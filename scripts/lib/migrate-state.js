/**
 * Migrate ECC state directories and document schema ids to Aiuby.
 *
 * Safety model (see docs/architecture/ADR-0001-aiuby-naming-and-namespaces.md):
 *   - planning is pure and never touches the filesystem
 *   - a duplicate install is a conflict, never a silent overwrite
 *   - every apply writes a full backup with a manifest before the first move
 *   - rollback restores the original bytes and removes the migrated target
 *
 * The caller owns dry-run: `planMigration` is the dry run.
 */

const fs = require('fs');
const path = require('path');

const { LEGACY_DIR_NAME, CANONICAL_DIR_NAME } = require('./legacy-compat');

const BACKUP_DIR_NAME = '.aiuby-migration-backups';
const MANIFEST_NAME = 'manifest.json';
const MANIFEST_SCHEMA = 'aiuby.migration-backup.v1';

/** Document schema families that carry an `ecc.<name>.v<N>` id. */
const SCHEMA_FAMILIES = Object.freeze([
  'memory', 'install', 'session', 'consult', 'feedback', 'mcp',
]);

/**
 * Matches only a full schema id. Anchoring to the known families is what keeps
 * prose like "see ecc.tools" from being rewritten.
 */
const SCHEMA_ID_PATTERN = new RegExp(`\\becc\\.(${SCHEMA_FAMILIES.join('|')})\\.v(\\d+)\\b`, 'g');

const REWRITABLE_EXTENSIONS = Object.freeze(new Set([
  '.json', '.md', '.markdown', '.yml', '.yaml', '.txt', '.jsonl',
]));

function directoryExists(candidate) {
  try {
    return fs.statSync(candidate).isDirectory();
  } catch {
    return false;
  }
}

function walkFiles(dir, acc = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkFiles(fullPath, acc);
    } else if (entry.isFile()) {
      acc.push(fullPath);
    }
  }
  return acc;
}

function containsLegacySchemaId(filePath) {
  if (!REWRITABLE_EXTENSIONS.has(path.extname(filePath).toLowerCase())) {
    return false;
  }
  try {
    SCHEMA_ID_PATTERN.lastIndex = 0;
    return SCHEMA_ID_PATTERN.test(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return false;
  }
}

function rewriteSchemaIds(filePath) {
  const original = fs.readFileSync(filePath, 'utf8');
  const migrated = original.replace(SCHEMA_ID_PATTERN, 'aiuby.$1.v$2');
  if (migrated !== original) {
    fs.writeFileSync(filePath, migrated, 'utf8');
  }
  return migrated !== original;
}

/**
 * Locate legacy state directories for the user and the current project.
 * A target whose canonical counterpart already exists is a conflict.
 */
function detectLegacyState({ home, projectRoot } = {}) {
  const homeDir = home || require('os').homedir();
  const scopes = [
    { scope: 'user', base: homeDir },
    { scope: 'project', base: projectRoot || process.cwd() },
  ];

  const targets = [];
  for (const { scope, base } of scopes) {
    const legacyPath = path.join(base, LEGACY_DIR_NAME);
    if (!directoryExists(legacyPath)) {
      continue;
    }
    const canonicalPath = path.join(base, CANONICAL_DIR_NAME);
    targets.push({
      scope,
      base,
      legacyPath,
      canonicalPath,
      conflict: directoryExists(canonicalPath),
    });
  }

  return { found: targets.length > 0, targets };
}

/**
 * Build the migration plan. Pure — reads the filesystem but never writes.
 */
function planMigration(options = {}) {
  const detected = detectLegacyState(options);
  const operations = [];
  const conflicts = [];

  for (const target of detected.targets) {
    if (target.conflict) {
      conflicts.push({
        scope: target.scope,
        legacyPath: target.legacyPath,
        canonicalPath: target.canonicalPath,
        reason: `${target.canonicalPath} already exists — resolve the duplicate install before migrating`,
      });
      continue;
    }

    operations.push({
      type: 'move',
      scope: target.scope,
      from: target.legacyPath,
      to: target.canonicalPath,
    });

    for (const filePath of walkFiles(target.legacyPath)) {
      if (containsLegacySchemaId(filePath)) {
        const relativePath = path.relative(target.legacyPath, filePath);
        operations.push({
          type: 'rewrite-schema',
          scope: target.scope,
          file: path.join(target.canonicalPath, relativePath),
          sourceFile: filePath,
        });
      }
    }
  }

  return { found: detected.found, operations, conflicts, targets: detected.targets };
}

function backupRootFor(home) {
  return path.join(home || require('os').homedir(), BACKUP_DIR_NAME);
}

/**
 * Copy every source tree into a timestamped backup and record where it came
 * from, so rollback needs no knowledge beyond the backup directory itself.
 */
function createBackup({ plan, home, timestamp }) {
  const moves = plan.operations.filter(op => op.type === 'move');
  if (moves.length === 0) {
    return null;
  }

  const backupPath = path.join(backupRootFor(home), `aiuby-migrate-${timestamp}`);
  fs.mkdirSync(backupPath, { recursive: true });

  const entries = moves.map(op => {
    const backupName = `${op.scope}-${LEGACY_DIR_NAME.replace(/^\./, '')}`;
    fs.cpSync(op.from, path.join(backupPath, backupName), { recursive: true });
    return {
      scope: op.scope,
      backupName,
      originalPath: op.from,
      migratedPath: op.to,
    };
  });

  fs.writeFileSync(
    path.join(backupPath, MANIFEST_NAME),
    `${JSON.stringify({ schema: MANIFEST_SCHEMA, timestamp, entries }, null, 2)}\n`,
    'utf8'
  );

  return { path: backupPath, entries };
}

/**
 * Execute the migration. Refuses outright when any conflict is present — a
 * partial migration across scopes is worse than none.
 */
function applyMigration(options = {}) {
  const plan = planMigration(options);

  if (plan.conflicts.length > 0) {
    const detail = plan.conflicts.map(conflict => conflict.reason).join('; ');
    throw new Error(`Migration conflict: ${detail}`);
  }

  if (plan.operations.length === 0) {
    return { applied: [], backupPath: null, plan };
  }

  const timestamp = options.timestamp || new Date().toISOString().replace(/[-:.]/g, '').replace(/\d{3}Z$/, 'Z');
  const backup = createBackup({ plan, home: options.home, timestamp });
  const applied = [];

  for (const operation of plan.operations.filter(op => op.type === 'move')) {
    fs.mkdirSync(path.dirname(operation.to), { recursive: true });
    fs.cpSync(operation.from, operation.to, { recursive: true });
    fs.rmSync(operation.from, { recursive: true, force: true });
    applied.push(operation);
  }

  for (const operation of plan.operations.filter(op => op.type === 'rewrite-schema')) {
    if (fs.existsSync(operation.file) && rewriteSchemaIds(operation.file)) {
      applied.push(operation);
    }
  }

  return { applied, backupPath: backup ? backup.path : null, plan };
}

function readManifest(backupPath) {
  if (!directoryExists(backupPath)) {
    throw new Error(`Backup not found: ${backupPath}`);
  }

  const manifestPath = path.join(backupPath, MANIFEST_NAME);
  if (!fs.existsSync(manifestPath)) {
    throw new Error(`Backup manifest missing: ${manifestPath}`);
  }

  let manifest;
  try {
    manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  } catch (error) {
    throw new Error(`Backup manifest is not valid JSON: ${error.message}`);
  }

  if (!Array.isArray(manifest.entries)) {
    throw new Error('Backup manifest has no entries');
  }

  return manifest;
}

/** Restore a backup: legacy tree returns, migrated target is removed. */
function rollbackMigration({ backupPath } = {}) {
  const manifest = readManifest(backupPath);
  const restored = [];

  for (const entry of manifest.entries) {
    const source = path.join(backupPath, entry.backupName);
    if (!directoryExists(source)) {
      throw new Error(`Backup entry missing: ${source}`);
    }

    fs.rmSync(entry.migratedPath, { recursive: true, force: true });
    fs.rmSync(entry.originalPath, { recursive: true, force: true });
    fs.mkdirSync(path.dirname(entry.originalPath), { recursive: true });
    fs.cpSync(source, entry.originalPath, { recursive: true });
    restored.push(entry);
  }

  return { restored, backupPath };
}

function listBackups({ home } = {}) {
  const root = backupRootFor(home);
  if (!directoryExists(root)) {
    return [];
  }

  return fs.readdirSync(root, { withFileTypes: true })
    .filter(entry => entry.isDirectory() && entry.name.startsWith('aiuby-migrate-'))
    .map(entry => ({ name: entry.name, path: path.join(root, entry.name) }))
    .sort((a, b) => b.name.localeCompare(a.name));
}

module.exports = {
  BACKUP_DIR_NAME,
  MANIFEST_SCHEMA,
  SCHEMA_FAMILIES,
  detectLegacyState,
  planMigration,
  createBackup,
  applyMigration,
  rollbackMigration,
  listBackups,
};
