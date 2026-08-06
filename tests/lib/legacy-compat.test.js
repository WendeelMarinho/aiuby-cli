/**
 * Tests for scripts/lib/legacy-compat.js
 *
 * Run with: node tests/lib/legacy-compat.test.js
 */

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');

const compat = require('../../scripts/lib/legacy-compat');
const { auditTree } = require('../../scripts/lib/legacy-name-audit');

const REPO_ROOT = path.resolve(__dirname, '..', '..');

function test(name, fn) {
  try {
    compat.resetDeprecationState();
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
  return fs.mkdtempSync(path.join(os.tmpdir(), 'legacy-compat-'));
}

function collector() {
  const notices = [];
  return { notices, onDeprecation: notice => notices.push(notice) };
}

function runTests() {
  let passed = 0;
  let failed = 0;

  console.log('\n=== legacy-compat ===\n');

  console.log('env name mapping');

  if (test('maps canonical names to legacy names', () => {
    assert.strictEqual(compat.toLegacyEnvName('AIUBY_DRY_RUN'), 'ECC_DRY_RUN');
    assert.strictEqual(compat.toLegacyEnvName('AIUBY_HOOK_PROFILE'), 'ECC_HOOK_PROFILE');
  })) passed++; else failed++;

  if (test('maps legacy names to canonical names', () => {
    assert.strictEqual(compat.toCanonicalEnvName('ECC_DRY_RUN'), 'AIUBY_DRY_RUN');
    assert.strictEqual(compat.toCanonicalEnvName('ECC_AGENT_DATA_HOME'), 'AIUBY_AGENT_DATA_HOME');
  })) passed++; else failed++;

  if (test('accepts a bare suffix in either direction', () => {
    assert.strictEqual(compat.toLegacyEnvName('DRY_RUN'), 'ECC_DRY_RUN');
    assert.strictEqual(compat.toCanonicalEnvName('DRY_RUN'), 'AIUBY_DRY_RUN');
  })) passed++; else failed++;

  if (test('round-trips every name', () => {
    for (const name of ['AIUBY_A', 'AIUBY_LONG_NAME_9']) {
      assert.strictEqual(compat.toCanonicalEnvName(compat.toLegacyEnvName(name)), name);
    }
  })) passed++; else failed++;

  if (test('rejects names that are not namespaced env vars', () => {
    assert.throws(() => compat.toLegacyEnvName(''), /non-empty/i);
    assert.throws(() => compat.toLegacyEnvName(null), /non-empty/i);
  })) passed++; else failed++;

  console.log('\nenv reading');

  if (test('prefers the canonical variable', () => {
    const { notices, onDeprecation } = collector();
    const env = { AIUBY_MODE: 'new', ECC_MODE: 'old' };
    const result = compat.readEnv('AIUBY_MODE', { env, onDeprecation });
    assert.strictEqual(result.value, 'new');
    assert.strictEqual(result.source, 'canonical');
    assert.strictEqual(notices.length, 0, 'canonical hit must not warn');
  })) passed++; else failed++;

  if (test('falls back to the legacy variable and warns', () => {
    const { notices, onDeprecation } = collector();
    const env = { ECC_MODE: 'old' };
    const result = compat.readEnv('AIUBY_MODE', { env, onDeprecation });
    assert.strictEqual(result.value, 'old');
    assert.strictEqual(result.source, 'legacy');
    assert.strictEqual(notices.length, 1);
    assert.match(notices[0], /ECC_MODE/);
    assert.match(notices[0], /AIUBY_MODE/);
    assert.match(notices[0], /1\.0\.0/);
  })) passed++; else failed++;

  if (test('returns unset when neither is present', () => {
    const { notices, onDeprecation } = collector();
    const result = compat.readEnv('AIUBY_MODE', { env: {}, onDeprecation });
    assert.strictEqual(result.value, undefined);
    assert.strictEqual(result.source, 'unset');
    assert.strictEqual(notices.length, 0);
  })) passed++; else failed++;

  if (test('applies a default value when unset', () => {
    const result = compat.readEnv('AIUBY_MODE', { env: {}, defaultValue: 'fallback' });
    assert.strictEqual(result.value, 'fallback');
    assert.strictEqual(result.source, 'default');
  })) passed++; else failed++;

  if (test('treats an empty legacy value as set', () => {
    const result = compat.readEnv('AIUBY_MODE', { env: { ECC_MODE: '' } });
    assert.strictEqual(result.value, '');
    assert.strictEqual(result.source, 'legacy');
  })) passed++; else failed++;

  if (test('accepts a legacy name as the lookup key', () => {
    const result = compat.readEnv('ECC_MODE', { env: { AIUBY_MODE: 'new' } });
    assert.strictEqual(result.value, 'new');
    assert.strictEqual(result.source, 'canonical');
  })) passed++; else failed++;

  if (test('warns only once per legacy variable', () => {
    const { notices, onDeprecation } = collector();
    const env = { ECC_MODE: 'old' };
    compat.readEnv('AIUBY_MODE', { env, onDeprecation });
    compat.readEnv('AIUBY_MODE', { env, onDeprecation });
    compat.readEnv('AIUBY_MODE', { env, onDeprecation });
    assert.strictEqual(notices.length, 1);
  })) passed++; else failed++;

  if (test('warns separately for distinct variables', () => {
    const { notices, onDeprecation } = collector();
    const env = { ECC_MODE: 'a', ECC_HARNESS: 'b' };
    compat.readEnv('AIUBY_MODE', { env, onDeprecation });
    compat.readEnv('AIUBY_HARNESS', { env, onDeprecation });
    assert.strictEqual(notices.length, 2);
  })) passed++; else failed++;

  if (test('getEnv returns the bare value', () => {
    assert.strictEqual(compat.getEnv('AIUBY_MODE', { env: { ECC_MODE: 'old' } }), 'old');
    assert.strictEqual(compat.getEnv('AIUBY_MODE', { env: {} }), undefined);
  })) passed++; else failed++;

  console.log('\nenv writing');

  if (test('applyEnv sets both forms so child processes see either', () => {
    const env = {};
    compat.applyEnv('AIUBY_MODE', 'value', { env });
    assert.strictEqual(env.AIUBY_MODE, 'value');
    assert.strictEqual(env.ECC_MODE, 'value');
  })) passed++; else failed++;

  if (test('normalizeEnv promotes every legacy value to its canonical name', () => {
    const { notices, onDeprecation } = collector();
    const env = { ECC_MODE: 'a', ECC_HARNESS: 'b', AIUBY_HARNESS: 'kept', PATH: '/bin' };
    const normalized = compat.normalizeEnv(env, { onDeprecation });
    assert.strictEqual(normalized.AIUBY_MODE, 'a');
    assert.strictEqual(normalized.AIUBY_HARNESS, 'kept', 'canonical must win');
    assert.strictEqual(normalized.PATH, '/bin', 'unrelated vars pass through');
    assert.strictEqual(notices.length, 1, 'only the shadowed legacy var warns');
  })) passed++; else failed++;

  console.log('\nrepository coverage');

  if (test('the resolver covers every ECC_* name used in the repository', () => {
    const { findings } = auditTree({ root: REPO_ROOT });
    const legacyNames = [...new Set(
      findings.filter(f => f.pattern === 'env-var').map(f => f.match)
    )];

    assert.ok(legacyNames.length >= 100, `expected 100+ legacy names, found ${legacyNames.length}`);

    const uncovered = legacyNames.filter(legacyName => {
      const canonical = compat.toCanonicalEnvName(legacyName);
      const result = compat.readEnv(canonical, { env: { [legacyName]: 'probe' } });
      return result.value !== 'probe' || result.source !== 'legacy';
    });

    assert.deepStrictEqual(uncovered, [], 'every legacy name must resolve through the shim');
  })) passed++; else failed++;

  console.log('\nschema ids');

  if (test('maps schema ids in both directions', () => {
    assert.strictEqual(compat.toCanonicalSchemaId('ecc.memory.v1'), 'aiuby.memory.v1');
    assert.strictEqual(compat.toCanonicalSchemaId('ecc.install.v1'), 'aiuby.install.v1');
    assert.strictEqual(compat.toLegacySchemaId('aiuby.session.v2'), 'ecc.session.v2');
  })) passed++; else failed++;

  if (test('schema mapping is idempotent', () => {
    assert.strictEqual(compat.toCanonicalSchemaId('aiuby.memory.v1'), 'aiuby.memory.v1');
    assert.strictEqual(compat.toLegacySchemaId('ecc.memory.v1'), 'ecc.memory.v1');
  })) passed++; else failed++;

  if (test('schemaMatches accepts either spelling', () => {
    assert.ok(compat.schemaMatches('ecc.memory.v1', 'aiuby.memory.v1'));
    assert.ok(compat.schemaMatches('aiuby.memory.v1', 'aiuby.memory.v1'));
    assert.ok(compat.schemaMatches('ecc.memory.v1', 'ecc.memory.v1'));
  })) passed++; else failed++;

  if (test('schemaMatches still rejects a different document or version', () => {
    assert.ok(!compat.schemaMatches('ecc.memory.v1', 'aiuby.install.v1'));
    assert.ok(!compat.schemaMatches('ecc.memory.v999', 'aiuby.memory.v1'));
    assert.ok(!compat.schemaMatches(undefined, 'aiuby.memory.v1'));
    assert.ok(!compat.schemaMatches('', 'aiuby.memory.v1'));
  })) passed++; else failed++;

  console.log('\nuser data directory');

  if (test('prefers the canonical directory when both exist', () => {
    const home = createTempDir();
    try {
      fs.mkdirSync(path.join(home, '.aiuby'));
      fs.mkdirSync(path.join(home, '.ecc'));
      const result = compat.resolveUserDataDir({ home, env: {} });
      assert.strictEqual(result.path, path.join(home, '.aiuby'));
      assert.strictEqual(result.source, 'canonical');
      assert.strictEqual(result.legacy, false);
    } finally {
      fs.rmSync(home, { recursive: true, force: true });
    }
  })) passed++; else failed++;

  if (test('falls back to the legacy directory and warns', () => {
    const home = createTempDir();
    const { notices, onDeprecation } = collector();
    try {
      fs.mkdirSync(path.join(home, '.ecc'));
      const result = compat.resolveUserDataDir({ home, env: {}, onDeprecation });
      assert.strictEqual(result.path, path.join(home, '.ecc'));
      assert.strictEqual(result.source, 'legacy');
      assert.strictEqual(result.legacy, true);
      assert.strictEqual(notices.length, 1);
      assert.match(notices[0], /aiuby migrate/);
    } finally {
      fs.rmSync(home, { recursive: true, force: true });
    }
  })) passed++; else failed++;

  if (test('defaults to the canonical directory when neither exists', () => {
    const home = createTempDir();
    const { notices, onDeprecation } = collector();
    try {
      const result = compat.resolveUserDataDir({ home, env: {}, onDeprecation });
      assert.strictEqual(result.path, path.join(home, '.aiuby'));
      assert.strictEqual(result.source, 'default');
      assert.strictEqual(notices.length, 0);
    } finally {
      fs.rmSync(home, { recursive: true, force: true });
    }
  })) passed++; else failed++;

  if (test('an explicit env override beats directory probing', () => {
    const home = createTempDir();
    try {
      fs.mkdirSync(path.join(home, '.ecc'));
      const override = path.join(home, 'custom');
      const result = compat.resolveUserDataDir({ home, env: { AIUBY_AGENT_DATA_HOME: override } });
      assert.strictEqual(result.path, override);
      assert.strictEqual(result.source, 'env');
    } finally {
      fs.rmSync(home, { recursive: true, force: true });
    }
  })) passed++; else failed++;

  if (test('a legacy env override is honored and warns', () => {
    const home = createTempDir();
    const { notices, onDeprecation } = collector();
    try {
      const override = path.join(home, 'custom');
      const result = compat.resolveUserDataDir({
        home,
        env: { ECC_AGENT_DATA_HOME: override },
        onDeprecation,
      });
      assert.strictEqual(result.path, override);
      assert.strictEqual(result.source, 'env');
      assert.strictEqual(notices.length, 1);
    } finally {
      fs.rmSync(home, { recursive: true, force: true });
    }
  })) passed++; else failed++;

  console.log('\nproject data directory');

  if (test('resolves the project directory with the same precedence', () => {
    const root = createTempDir();
    try {
      fs.mkdirSync(path.join(root, '.ecc'));
      const legacy = compat.resolveProjectDataDir({ projectRoot: root });
      assert.strictEqual(legacy.path, path.join(root, '.ecc'));
      assert.strictEqual(legacy.legacy, true);

      fs.mkdirSync(path.join(root, '.aiuby'));
      const canonical = compat.resolveProjectDataDir({ projectRoot: root });
      assert.strictEqual(canonical.path, path.join(root, '.aiuby'));
      assert.strictEqual(canonical.legacy, false);
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  })) passed++; else failed++;

  console.log('\nlegacy binaries');

  if (test('detects each legacy binary name', () => {
    assert.strictEqual(compat.detectLegacyBinary('/usr/bin/ecc'), 'ecc');
    assert.strictEqual(compat.detectLegacyBinary('/usr/bin/ecc-install'), 'ecc-install');
    assert.strictEqual(compat.detectLegacyBinary('C:\\bin\\ecc.CMD'), 'ecc');
    assert.strictEqual(compat.detectLegacyBinary('/usr/bin/ecc-memory-mcp'), 'ecc-memory-mcp');
  })) passed++; else failed++;

  if (test('does not flag canonical binaries', () => {
    assert.strictEqual(compat.detectLegacyBinary('/usr/bin/aiuby'), null);
    assert.strictEqual(compat.detectLegacyBinary('/usr/bin/aiuby-install'), null);
    assert.strictEqual(compat.detectLegacyBinary('/repo/scripts/aiuby.js'), null);
    assert.strictEqual(compat.detectLegacyBinary(undefined), null);
  })) passed++; else failed++;

  if (test('maps legacy binaries to their canonical replacement', () => {
    assert.strictEqual(compat.canonicalBinaryFor('ecc'), 'aiuby');
    assert.strictEqual(compat.canonicalBinaryFor('ecc-install'), 'aiuby-install');
    assert.strictEqual(compat.canonicalBinaryFor('ecc-plan-canvas'), 'aiuby-plan-canvas');
  })) passed++; else failed++;

  if (test('builds the deprecation notice with the invoked subcommand', () => {
    const notice = compat.legacyBinaryNotice('ecc', ['doctor', '--json']);
    assert.match(notice, /`ecc` command is deprecated/);
    assert.match(notice, /aiuby doctor/);
    assert.match(notice, /1\.0\.0/);
  })) passed++; else failed++;

  if (test('the notice omits flags and degrades without a subcommand', () => {
    assert.match(compat.legacyBinaryNotice('ecc', ['--dry-run', 'status']), /aiuby status/);
    assert.match(compat.legacyBinaryNotice('ecc', []), /Use `aiuby`/);
    assert.match(compat.legacyBinaryNotice('ecc-install', ['--profile', 'core']), /Use `aiuby-install`/);
  })) passed++; else failed++;

  if (test('warnLegacyBinary emits once and only for legacy invocations', () => {
    const { notices, onDeprecation } = collector();
    compat.warnLegacyBinary('/usr/bin/ecc', ['doctor'], { onDeprecation });
    compat.warnLegacyBinary('/usr/bin/ecc', ['doctor'], { onDeprecation });
    assert.strictEqual(notices.length, 1);

    compat.warnLegacyBinary('/usr/bin/aiuby', ['doctor'], { onDeprecation });
    assert.strictEqual(notices.length, 1);
  })) passed++; else failed++;

  console.log('\nnotice routing');

  if (test('the default sink writes to stderr, never stdout', () => {
    const stdoutWrite = process.stdout.write;
    const stderrWrite = process.stderr.write;
    const out = [];
    const err = [];
    process.stdout.write = chunk => { out.push(String(chunk)); return true; };
    process.stderr.write = chunk => { err.push(String(chunk)); return true; };

    try {
      compat.readEnv('AIUBY_MODE', { env: { ECC_MODE: 'old' } });
    } finally {
      process.stdout.write = stdoutWrite;
      process.stderr.write = stderrWrite;
    }

    assert.deepStrictEqual(out, [], 'stdout must stay clean for --json consumers');
    assert.strictEqual(err.length, 1);
    assert.match(err[0], /ECC_MODE/);
  })) passed++; else failed++;

  if (test('notices are suppressed when quiet mode is requested', () => {
    const { notices, onDeprecation } = collector();
    compat.readEnv('AIUBY_MODE', {
      env: { ECC_MODE: 'old', AIUBY_SUPPRESS_DEPRECATIONS: '1' },
      onDeprecation,
    });
    assert.strictEqual(notices.length, 0);
  })) passed++; else failed++;

  console.log('\n=== Test Results ===');
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Total:  ${passed + failed}\n`);

  process.exit(failed > 0 ? 1 : 0);
}

runTests();
