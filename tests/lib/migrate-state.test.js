/**
 * Tests for scripts/lib/migrate-state.js
 *
 * Run with: node tests/lib/migrate-state.test.js
 */

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');

const migrate = require('../../scripts/lib/migrate-state');

const TIMESTAMP = '20260806T120000Z';

function test(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    return true;
  } catch (err) {
    console.log(`  ✗ ${name}`);
    console.log(`    Error: ${err.message}`);
    return false;
  }
}

function createTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'migrate-state-'));
}

function writeFile(root, relativePath, contents) {
  const target = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, contents, 'utf8');
  return target;
}

function read(...segments) {
  return fs.readFileSync(path.join(...segments), 'utf8');
}

function exists(...segments) {
  return fs.existsSync(path.join(...segments));
}

/** A home directory holding a legacy user vault. */
function legacyHome() {
  const home = createTempDir();
  writeFile(home, '.ecc/memory/notes.md', '---\nschema: ecc.memory.v1\n---\nbody\n');
  writeFile(home, '.ecc/config.json', JSON.stringify({ schema: 'ecc.install.v1' }));
  return home;
}

function runTests() {
  let passed = 0;
  let failed = 0;

  console.log('\n=== migrate-state ===\n');

  console.log('detection');

  if (test('detects a legacy user vault', () => {
    const home = legacyHome();
    try {
      const detected = migrate.detectLegacyState({ home, projectRoot: createTempDir() });
      assert.strictEqual(detected.found, true);
      const user = detected.targets.find(t => t.scope === 'user');
      assert.strictEqual(user.legacyPath, path.join(home, '.ecc'));
      assert.strictEqual(user.canonicalPath, path.join(home, '.aiuby'));
      assert.strictEqual(user.conflict, false);
    } finally {
      fs.rmSync(home, { recursive: true, force: true });
    }
  })) passed++; else failed++;

  if (test('detects a legacy project vault', () => {
    const projectRoot = createTempDir();
    try {
      writeFile(projectRoot, '.ecc/memory/project/a.md', 'x');
      const detected = migrate.detectLegacyState({ home: createTempDir(), projectRoot });
      const project = detected.targets.find(t => t.scope === 'project');
      assert.ok(project, 'project target missing');
      assert.strictEqual(project.legacyPath, path.join(projectRoot, '.ecc'));
    } finally {
      fs.rmSync(projectRoot, { recursive: true, force: true });
    }
  })) passed++; else failed++;

  if (test('reports nothing to do on a clean install', () => {
    const home = createTempDir();
    try {
      const detected = migrate.detectLegacyState({ home, projectRoot: createTempDir() });
      assert.strictEqual(detected.found, false);
      assert.deepStrictEqual(detected.targets, []);
    } finally {
      fs.rmSync(home, { recursive: true, force: true });
    }
  })) passed++; else failed++;

  if (test('flags a conflict when both directories already exist', () => {
    const home = legacyHome();
    try {
      fs.mkdirSync(path.join(home, '.aiuby'));
      const detected = migrate.detectLegacyState({ home, projectRoot: createTempDir() });
      const user = detected.targets.find(t => t.scope === 'user');
      assert.strictEqual(user.conflict, true, 'a duplicate install must be flagged');
    } finally {
      fs.rmSync(home, { recursive: true, force: true });
    }
  })) passed++; else failed++;

  console.log('\nplanning');

  if (test('plans a move plus schema rewrites', () => {
    const home = legacyHome();
    try {
      const plan = migrate.planMigration({ home, projectRoot: createTempDir() });
      const moves = plan.operations.filter(op => op.type === 'move');
      const rewrites = plan.operations.filter(op => op.type === 'rewrite-schema');
      assert.strictEqual(moves.length, 1);
      assert.strictEqual(rewrites.length, 2, 'both the .md and the .json carry a schema id');
      assert.deepStrictEqual(plan.conflicts, []);
    } finally {
      fs.rmSync(home, { recursive: true, force: true });
    }
  })) passed++; else failed++;

  if (test('a conflicting target produces a conflict, not an operation', () => {
    const home = legacyHome();
    try {
      fs.mkdirSync(path.join(home, '.aiuby'));
      const plan = migrate.planMigration({ home, projectRoot: createTempDir() });
      assert.strictEqual(plan.conflicts.length, 1);
      assert.strictEqual(plan.operations.filter(op => op.type === 'move').length, 0);
      assert.match(plan.conflicts[0].reason, /already exists/i);
    } finally {
      fs.rmSync(home, { recursive: true, force: true });
    }
  })) passed++; else failed++;

  if (test('planning never touches the filesystem', () => {
    const home = legacyHome();
    try {
      migrate.planMigration({ home, projectRoot: createTempDir() });
      assert.ok(exists(home, '.ecc'), 'legacy directory must survive planning');
      assert.ok(!exists(home, '.aiuby'), 'planning must not create the target');
    } finally {
      fs.rmSync(home, { recursive: true, force: true });
    }
  })) passed++; else failed++;

  console.log('\nbackup');

  if (test('apply writes a backup before moving anything', () => {
    const home = legacyHome();
    try {
      const result = migrate.applyMigration({ home, projectRoot: createTempDir(), timestamp: TIMESTAMP });
      assert.ok(fs.existsSync(result.backupPath), 'backup directory missing');
      assert.ok(fs.existsSync(path.join(result.backupPath, 'manifest.json')), 'manifest missing');
      assert.match(result.backupPath, new RegExp(TIMESTAMP));
    } finally {
      fs.rmSync(home, { recursive: true, force: true });
    }
  })) passed++; else failed++;

  if (test('the backup contains the original bytes', () => {
    const home = legacyHome();
    try {
      const original = read(home, '.ecc/memory/notes.md');
      const result = migrate.applyMigration({ home, projectRoot: createTempDir(), timestamp: TIMESTAMP });
      const manifest = JSON.parse(read(result.backupPath, 'manifest.json'));
      const entry = manifest.entries.find(e => e.originalPath.endsWith('.ecc'));
      assert.ok(entry, 'manifest entry missing');
      assert.strictEqual(read(result.backupPath, entry.backupName, 'memory/notes.md'), original);
    } finally {
      fs.rmSync(home, { recursive: true, force: true });
    }
  })) passed++; else failed++;

  console.log('\napply');

  if (test('apply moves the directory and rewrites schema ids', () => {
    const home = legacyHome();
    try {
      migrate.applyMigration({ home, projectRoot: createTempDir(), timestamp: TIMESTAMP });
      assert.ok(!exists(home, '.ecc'), 'legacy directory must be gone');
      assert.ok(exists(home, '.aiuby/memory/notes.md'), 'content must arrive at the target');
      assert.match(read(home, '.aiuby/memory/notes.md'), /schema: aiuby\.memory\.v1/);
      assert.match(read(home, '.aiuby/config.json'), /aiuby\.install\.v1/);
    } finally {
      fs.rmSync(home, { recursive: true, force: true });
    }
  })) passed++; else failed++;

  if (test('apply refuses to run when a conflict is present', () => {
    const home = legacyHome();
    try {
      fs.mkdirSync(path.join(home, '.aiuby'));
      assert.throws(
        () => migrate.applyMigration({ home, projectRoot: createTempDir(), timestamp: TIMESTAMP }),
        /conflict/i
      );
      assert.ok(exists(home, '.ecc'), 'a refused migration must leave the source intact');
    } finally {
      fs.rmSync(home, { recursive: true, force: true });
    }
  })) passed++; else failed++;

  if (test('apply is a no-op on an already migrated install', () => {
    const home = createTempDir();
    try {
      writeFile(home, '.aiuby/memory/notes.md', 'schema: aiuby.memory.v1');
      const result = migrate.applyMigration({ home, projectRoot: createTempDir(), timestamp: TIMESTAMP });
      assert.strictEqual(result.applied.length, 0);
      assert.strictEqual(result.backupPath, null, 'no backup for a no-op');
    } finally {
      fs.rmSync(home, { recursive: true, force: true });
    }
  })) passed++; else failed++;

  if (test('apply leaves unrelated files in the home directory alone', () => {
    const home = legacyHome();
    try {
      writeFile(home, '.bashrc', 'export X=1');
      writeFile(home, '.claude/settings.json', '{}');
      migrate.applyMigration({ home, projectRoot: createTempDir(), timestamp: TIMESTAMP });
      assert.strictEqual(read(home, '.bashrc'), 'export X=1');
      assert.ok(exists(home, '.claude/settings.json'));
    } finally {
      fs.rmSync(home, { recursive: true, force: true });
    }
  })) passed++; else failed++;

  console.log('\nrollback');

  if (test('rollback restores the original tree exactly', () => {
    const home = legacyHome();
    try {
      const before = read(home, '.ecc/memory/notes.md');
      const result = migrate.applyMigration({ home, projectRoot: createTempDir(), timestamp: TIMESTAMP });
      migrate.rollbackMigration({ backupPath: result.backupPath });

      assert.ok(exists(home, '.ecc/memory/notes.md'), 'legacy tree must return');
      assert.strictEqual(read(home, '.ecc/memory/notes.md'), before, 'bytes must match exactly');
      assert.ok(!exists(home, '.aiuby'), 'the migrated target must be removed');
    } finally {
      fs.rmSync(home, { recursive: true, force: true });
    }
  })) passed++; else failed++;

  if (test('rollback rejects a missing or malformed backup', () => {
    assert.throws(() => migrate.rollbackMigration({ backupPath: '/nope/missing' }), /backup/i);

    const broken = createTempDir();
    try {
      assert.throws(() => migrate.rollbackMigration({ backupPath: broken }), /manifest/i);
    } finally {
      fs.rmSync(broken, { recursive: true, force: true });
    }
  })) passed++; else failed++;

  if (test('apply then rollback then apply again is stable', () => {
    const home = legacyHome();
    try {
      const first = migrate.applyMigration({ home, projectRoot: createTempDir(), timestamp: TIMESTAMP });
      migrate.rollbackMigration({ backupPath: first.backupPath });
      const second = migrate.applyMigration({ home, projectRoot: createTempDir(), timestamp: '20260806T130000Z' });

      assert.strictEqual(second.applied.filter(op => op.type === 'move').length, 1);
      assert.match(read(home, '.aiuby/memory/notes.md'), /aiuby\.memory\.v1/);
    } finally {
      fs.rmSync(home, { recursive: true, force: true });
    }
  })) passed++; else failed++;

  console.log('\nschema rewriting');

  if (test('rewrites every known document schema id', () => {
    const home = createTempDir();
    try {
      writeFile(home, '.ecc/a.json', JSON.stringify({
        a: 'ecc.memory.v1',
        b: 'ecc.install.v1',
        c: 'ecc.session.v2',
        d: 'ecc.consult.v1',
        e: 'ecc.feedback.v1',
        f: 'ecc.mcp.v1',
      }));
      migrate.applyMigration({ home, projectRoot: createTempDir(), timestamp: TIMESTAMP });
      const migrated = read(home, '.aiuby/a.json');
      assert.ok(!migrated.includes('ecc.'), `legacy schema id survived: ${migrated}`);
      assert.ok(migrated.includes('aiuby.session.v2'));
    } finally {
      fs.rmSync(home, { recursive: true, force: true });
    }
  })) passed++; else failed++;

  if (test('does not rewrite prose that merely mentions ecc', () => {
    const home = createTempDir();
    try {
      writeFile(home, '.ecc/notes.md', 'Migrated from the ECC project. See ecc.tools.\n');
      migrate.applyMigration({ home, projectRoot: createTempDir(), timestamp: TIMESTAMP });
      assert.strictEqual(
        read(home, '.aiuby/notes.md'),
        'Migrated from the ECC project. See ecc.tools.\n',
        'only schema ids may be rewritten'
      );
    } finally {
      fs.rmSync(home, { recursive: true, force: true });
    }
  })) passed++; else failed++;

  if (test('leaves binary-ish files untouched', () => {
    const home = createTempDir();
    try {
      const bytes = Buffer.from([0x00, 0x01, 0x02, 0xff]);
      fs.mkdirSync(path.join(home, '.ecc'), { recursive: true });
      fs.writeFileSync(path.join(home, '.ecc', 'blob.bin'), bytes);
      migrate.applyMigration({ home, projectRoot: createTempDir(), timestamp: TIMESTAMP });
      assert.ok(fs.readFileSync(path.join(home, '.aiuby', 'blob.bin')).equals(bytes));
    } finally {
      fs.rmSync(home, { recursive: true, force: true });
    }
  })) passed++; else failed++;

  console.log('\nbackup listing');

  if (test('lists backups newest first', () => {
    const home = legacyHome();
    try {
      const first = migrate.applyMigration({ home, projectRoot: createTempDir(), timestamp: '20260101T000000Z' });
      migrate.rollbackMigration({ backupPath: first.backupPath });
      migrate.applyMigration({ home, projectRoot: createTempDir(), timestamp: '20260202T000000Z' });

      const backups = migrate.listBackups({ home });
      assert.strictEqual(backups.length, 2);
      assert.match(backups[0].name, /20260202/);
    } finally {
      fs.rmSync(home, { recursive: true, force: true });
    }
  })) passed++; else failed++;

  console.log('\n=== Test Results ===');
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Total:  ${passed + failed}\n`);

  process.exit(failed > 0 ? 1 : 0);
}

runTests();
