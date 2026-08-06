/**
 * Legacy `ecc*` binary shims.
 *
 * Each legacy bin entry in package.json points at its own file in this
 * directory. That indirection is deliberate: Node resolves symlinks when it
 * populates `process.argv[1]`, so an npm bin symlink named `ecc` reports the
 * *target* script path, not the name the operator typed. A dedicated file per
 * legacy binary makes `__filename` an unambiguous signal.
 *
 * The shim warns, then delegates by spawning the canonical script so both
 * CommonJS and ESM targets work identically.
 *
 * Removed at 1.0.0 — see docs/architecture/ADR-0001-aiuby-naming-and-namespaces.md.
 */

const path = require('path');
const { spawnSync } = require('child_process');

const { warnLegacyBinary } = require('../lib/legacy-compat');

const SCRIPTS_DIR = path.resolve(__dirname, '..');

/**
 * @param {string} shimPath   the shim's own `__filename`
 * @param {string} targetScript path relative to scripts/
 */
function runLegacyShim(shimPath, targetScript) {
  warnLegacyBinary(shimPath, process.argv.slice(2));

  const result = spawnSync(
    process.execPath,
    [path.join(SCRIPTS_DIR, targetScript), ...process.argv.slice(2)],
    { stdio: 'inherit', env: process.env }
  );

  if (result.error) {
    process.stderr.write(`[aiuby] ${result.error.message}\n`);
    process.exit(1);
  }

  if (result.signal) {
    process.exit(1);
  }

  process.exit(typeof result.status === 'number' ? result.status : 1);
}

module.exports = { runLegacyShim, SCRIPTS_DIR };
