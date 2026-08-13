/**
 * ECC → Aiuby compatibility bridge.
 *
 * Ships BEFORE any rename. Every legacy surface keeps working through the whole
 * 0.x series and is removed at 1.0.0, per
 * docs/architecture/ADR-0001-aiuby-naming-and-namespaces.md.
 *
 * Three bridges live here:
 *   1. Environment variables   ECC_*      -> AIUBY_*
 *   2. State directories       ~/.ecc, .ecc -> ~/.aiuby, .aiuby
 *   3. CLI binaries            ecc*       -> aiuby*
 *
 * Rules that must not drift:
 *   - The canonical form always wins; the legacy form is then ignored silently.
 *   - Notices go to stderr, never stdout, so `--json` output stays parseable.
 *   - Each distinct legacy surface warns at most once per process.
 */

const fs = require('fs');
const path = require('path');

const LEGACY_PREFIX = 'ECC_';
const CANONICAL_PREFIX = 'AIUBY_';
const LEGACY_DIR_NAME = '.ecc';
const CANONICAL_DIR_NAME = '.aiuby';
const REMOVAL_VERSION = '1.0.0';
const DATA_HOME_SUFFIX = 'AGENT_DATA_HOME';
const SUPPRESS_ENV = 'AIUBY_SUPPRESS_DEPRECATIONS';

const LEGACY_BINARIES = Object.freeze([
  'ecc',
  'ecc-install',
  'ecc-control-pane',
  'ecc-memory-mcp',
  'ecc-plan-canvas',
]);

/** Legacy surfaces already announced in this process. */
const announced = new Set();

function resetDeprecationState() {
  announced.clear();
}

function requireName(name) {
  if (typeof name !== 'string' || name.length === 0) {
    throw new TypeError('Environment variable name must be a non-empty string');
  }
  return name;
}

/** Strip whichever namespace prefix is present, leaving the bare suffix. */
function envSuffix(name) {
  const value = requireName(name);
  if (value.startsWith(CANONICAL_PREFIX)) {
    return value.slice(CANONICAL_PREFIX.length);
  }
  if (value.startsWith(LEGACY_PREFIX)) {
    return value.slice(LEGACY_PREFIX.length);
  }
  return value;
}

function toLegacyEnvName(name) {
  return `${LEGACY_PREFIX}${envSuffix(name)}`;
}

function toCanonicalEnvName(name) {
  return `${CANONICAL_PREFIX}${envSuffix(name)}`;
}

function isSuppressed(env) {
  const value = env && (env[SUPPRESS_ENV] || env.ECC_SUPPRESS_DEPRECATIONS);
  return value !== undefined && value !== '' && value !== '0' && value !== 'false';
}

function defaultSink(notice) {
  process.stderr.write(`${notice}\n`);
}

/**
 * Emit a deprecation notice at most once per key.
 * Returns true when the notice was actually emitted.
 */
function announce(key, notice, { onDeprecation, env } = {}) {
  if (announced.has(key)) {
    return false;
  }
  announced.add(key);

  if (isSuppressed(env || process.env)) {
    return false;
  }

  (onDeprecation || defaultSink)(notice);
  return true;
}

function envNotice(legacyName, canonicalName) {
  return `[aiuby] The \`${legacyName}\` environment variable is deprecated. `
    + `Use \`${canonicalName}\`. Compatibility support will be removed in ${REMOVAL_VERSION}.`;
}

/**
 * Read a namespaced variable, preferring the canonical name.
 *
 * @returns {{ value: string|undefined, source: 'canonical'|'legacy'|'default'|'unset', name: string }}
 */
function readEnv(name, options = {}) {
  const env = options.env || process.env;
  const canonicalName = toCanonicalEnvName(name);
  const legacyName = toLegacyEnvName(name);

  if (Object.prototype.hasOwnProperty.call(env, canonicalName)) {
    return { value: env[canonicalName], source: 'canonical', name: canonicalName };
  }

  if (Object.prototype.hasOwnProperty.call(env, legacyName)) {
    // `quiet` bridges the value without emitting anything. Required inside hook
    // subprocesses, where stderr is a contract channel the harness inspects —
    // an advisory notice there reads as a hook failure.
    if (!options.quiet) {
      announce(`env:${legacyName}`, envNotice(legacyName, canonicalName), {
        onDeprecation: options.onDeprecation,
        env,
      });
    }
    return { value: env[legacyName], source: 'legacy', name: legacyName };
  }

  if (options.defaultValue !== undefined) {
    return { value: options.defaultValue, source: 'default', name: canonicalName };
  }

  return { value: undefined, source: 'unset', name: canonicalName };
}

/** Convenience wrapper returning only the value. */
function getEnv(name, options = {}) {
  return readEnv(name, options).value;
}

/**
 * Write both forms so spawned children reading either name observe the value.
 * The legacy write is what keeps un-migrated hooks working during 0.x.
 */
function applyEnv(name, value, options = {}) {
  const env = options.env || process.env;
  env[toCanonicalEnvName(name)] = value;
  env[toLegacyEnvName(name)] = value; // aiuby:compat
  return env;
}

/**
 * Promote every legacy variable in an environment to its canonical name.
 * The canonical value wins wherever both are present.
 */
function normalizeEnv(env = process.env, options = {}) {
  const normalized = { ...env };

  for (const key of Object.keys(env)) {
    if (!key.startsWith(LEGACY_PREFIX)) {
      continue;
    }
    const canonicalName = toCanonicalEnvName(key);
    if (Object.prototype.hasOwnProperty.call(env, canonicalName)) {
      announce(`env:${key}`, envNotice(key, canonicalName), {
        onDeprecation: options.onDeprecation,
        env,
      });
      continue;
    }
    normalized[canonicalName] = env[key];
  }

  return normalized;
}

const SCHEMA_LEGACY_PREFIX = 'ecc.';
const SCHEMA_CANONICAL_PREFIX = 'aiuby.';

/**
 * Persisted document schema ids (`ecc.memory.v1`, `ecc.install.v1`, …).
 *
 * Readers must accept both spellings BEFORE `aiuby migrate` rewrites any file,
 * otherwise a half-migrated vault fails validation. Same ordering constraint as
 * the environment and path bridges.
 */
function toCanonicalSchemaId(schemaId) {
  const value = requireName(schemaId);
  return value.startsWith(SCHEMA_LEGACY_PREFIX)
    ? `${SCHEMA_CANONICAL_PREFIX}${value.slice(SCHEMA_LEGACY_PREFIX.length)}`
    : value;
}

function toLegacySchemaId(schemaId) {
  const value = requireName(schemaId);
  return value.startsWith(SCHEMA_CANONICAL_PREFIX)
    ? `${SCHEMA_LEGACY_PREFIX}${value.slice(SCHEMA_CANONICAL_PREFIX.length)}`
    : value;
}

/** True when `actual` is either spelling of `expected`. */
function schemaMatches(actual, expected) {
  if (!actual || !expected || typeof actual !== 'string' || typeof expected !== 'string') {
    return false;
  }
  return toCanonicalSchemaId(actual) === toCanonicalSchemaId(expected);
}

/**
 * Promote every legacy variable to its canonical name **in place**, once, at a
 * process entrypoint.
 *
 * This is what lets the rest of the source read only `AIUBY_*` while a user who
 * still exports `ECC_*` keeps working. Doing it here — rather than wrapping
 * every read site — keeps the bridge in one auditable place.
 *
 * Silent by design: entrypoints include hook subprocesses, where stderr is a
 * contract channel. The user-facing notice is emitted by the `ecc*` shims and
 * by explicit `readEnv` calls instead.
 */
function bootstrapEnv(env = process.env) {
  for (const key of Object.keys(env)) {
    if (!key.startsWith(LEGACY_PREFIX)) {
      continue;
    }
    const canonicalName = toCanonicalEnvName(key);
    if (!Object.prototype.hasOwnProperty.call(env, canonicalName)) {
      env[canonicalName] = env[key];
    }
  }
  return env;
}

function directoryExists(candidate) {
  try {
    return fs.statSync(candidate).isDirectory();
  } catch {
    return false;
  }
}

function dirNotice(legacyPath, canonicalPath) {
  return `[aiuby] Using the legacy state directory \`${legacyPath}\`. `
    + `Run \`aiuby migrate\` to move it to \`${canonicalPath}\`. `
    + `Compatibility support will be removed in ${REMOVAL_VERSION}.`;
}

/**
 * Resolve a state directory with explicit-override → canonical → legacy → default
 * precedence. Probing by existence (rather than assuming) is what lets an
 * un-migrated install keep reading its own data.
 */
function resolveDataDir({ base, envName, env, onDeprecation }) {
  const override = readEnv(envName, { env, onDeprecation });
  if (override.source === 'canonical' || override.source === 'legacy') {
    return { path: override.value, source: 'env', legacy: override.source === 'legacy' };
  }

  const canonicalPath = path.join(base, CANONICAL_DIR_NAME);
  if (directoryExists(canonicalPath)) {
    return { path: canonicalPath, source: 'canonical', legacy: false };
  }

  const legacyPath = path.join(base, LEGACY_DIR_NAME);
  if (directoryExists(legacyPath)) {
    announce(`dir:${legacyPath}`, dirNotice(legacyPath, canonicalPath), { onDeprecation, env });
    return { path: legacyPath, source: 'legacy', legacy: true };
  }

  return { path: canonicalPath, source: 'default', legacy: false };
}

function resolveUserDataDir(options = {}) {
  const env = options.env || process.env;
  const home = options.home || require('os').homedir();
  return resolveDataDir({
    base: home,
    envName: `${CANONICAL_PREFIX}${DATA_HOME_SUFFIX}`,
    env,
    onDeprecation: options.onDeprecation,
    // Forwarded, not dropped: hooks resolve state dirs on every invocation and
    // must be able to suppress the notice. aiuby:compat
    quiet: options.quiet,
  });
}

function resolveProjectDataDir(options = {}) {
  const env = options.env || process.env;
  const projectRoot = options.projectRoot || process.cwd();
  return resolveDataDir({
    base: projectRoot,
    envName: `${CANONICAL_PREFIX}PROJECT_DATA_DIR`,
    env,
    onDeprecation: options.onDeprecation,
    // Forwarded, not dropped: hooks resolve state dirs on every invocation and
    // must be able to suppress the notice. aiuby:compat
    quiet: options.quiet,
  });
}

/**
 * Identify a legacy binary from argv[1] or a shim path.
 * Handles Windows launcher extensions and both path separators.
 */
function detectLegacyBinary(invokedPath) {
  if (typeof invokedPath !== 'string' || invokedPath.length === 0) {
    return null;
  }

  const base = invokedPath.split(/[\\/]/).pop() || '';
  const withoutExtension = base.replace(/\.(js|cjs|mjs|cmd|bat|exe|ps1)$/i, '').toLowerCase();

  return LEGACY_BINARIES.includes(withoutExtension) ? withoutExtension : null;
}

function canonicalBinaryFor(legacyBinary) {
  return legacyBinary.replace(/^ecc/, 'aiuby');
}

/**
 * First non-flag argument, i.e. the subcommand the operator meant to run.
 *
 * Only meaningful for the `ecc` router. The auxiliary binaries take flags with
 * values, so a bare token there is a flag value (`--profile core`), not a
 * subcommand — suggesting `aiuby-install core` would be wrong advice. The
 * router's only global flag (`--dry-run`) takes no value, so the first bare
 * token really is the subcommand.
 */
function firstSubcommand(legacyBinary, args) {
  if (legacyBinary !== 'ecc' || !Array.isArray(args)) {
    return null;
  }
  return args.find(arg => typeof arg === 'string' && arg.length > 0 && !arg.startsWith('-')) || null;
}

function legacyBinaryNotice(legacyBinary, args = []) {
  const canonical = canonicalBinaryFor(legacyBinary);
  const subcommand = firstSubcommand(legacyBinary, args);
  const replacement = subcommand ? `${canonical} ${subcommand}` : canonical;

  return `[aiuby] The \`${legacyBinary}\` command is deprecated. Use \`${replacement}\`.\n`
    + `        Compatibility support will be removed in ${REMOVAL_VERSION}.`;
}

/**
 * Warn when the process was launched through a legacy binary.
 * No-op for canonical invocations.
 */
function warnLegacyBinary(invokedPath, args = [], options = {}) {
  const legacyBinary = detectLegacyBinary(invokedPath);
  if (!legacyBinary) {
    return null;
  }

  announce(`bin:${legacyBinary}`, legacyBinaryNotice(legacyBinary, args), {
    onDeprecation: options.onDeprecation,
    env: options.env,
  });

  return legacyBinary;
}

module.exports = {
  LEGACY_PREFIX,
  CANONICAL_PREFIX,
  LEGACY_DIR_NAME,
  CANONICAL_DIR_NAME,
  LEGACY_BINARIES,
  REMOVAL_VERSION,
  SUPPRESS_ENV,
  resetDeprecationState,
  toLegacyEnvName,
  toCanonicalEnvName,
  toCanonicalSchemaId,
  toLegacySchemaId,
  schemaMatches,
  readEnv,
  getEnv,
  applyEnv,
  normalizeEnv,
  bootstrapEnv,
  resolveUserDataDir,
  resolveProjectDataDir,
  detectLegacyBinary,
  canonicalBinaryFor,
  legacyBinaryNotice,
  warnLegacyBinary,
};
