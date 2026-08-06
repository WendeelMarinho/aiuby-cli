/**
 * Tests for scripts/legacy/*.js — the deprecated `ecc*` binary shims.
 *
 * Run with: node tests/scripts/legacy-shims.test.js
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const REPO_ROOT = path.resolve(__dirname, '..', '..');
const LEGACY_DIR = path.join(REPO_ROOT, 'scripts', 'legacy');
const PKG = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, 'package.json'), 'utf8'));

const SHIMS = [
  { legacy: 'ecc', canonical: 'aiuby', target: 'aiuby.js' },
  { legacy: 'ecc-install', canonical: 'aiuby-install', target: 'install-apply.js' },
  { legacy: 'ecc-control-pane', canonical: 'aiuby-control-pane', target: 'control-pane.js' },
  { legacy: 'ecc-memory-mcp', canonical: 'aiuby-memory-mcp', target: 'memory-mcp.mjs' },
  { legacy: 'ecc-plan-canvas', canonical: 'aiuby-plan-canvas', target: 'plan-canvas.js' },
];

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

function runShim(shimName, args = []) {
  return spawnSync(process.execPath, [path.join(LEGACY_DIR, `${shimName}.js`), ...args], {
    encoding: 'utf8',
    env: { ...process.env, AIUBY_SUPPRESS_DEPRECATIONS: '' },
    timeout: 30000,
  });
}

function runTests() {
  let passed = 0;
  let failed = 0;

  console.log('\n=== legacy binary shims ===\n');

  console.log('package.json wiring');

  if (test('every legacy bin points at its own shim file', () => {
    for (const { legacy } of SHIMS) {
      assert.strictEqual(
        PKG.bin[legacy],
        `scripts/legacy/${legacy}.js`,
        `${legacy} must resolve to a dedicated shim, not the shared entrypoint`
      );
    }
  })) passed++; else failed++;

  if (test('every canonical bin exists and bypasses the shim', () => {
    for (const { canonical } of SHIMS) {
      assert.ok(PKG.bin[canonical], `missing canonical bin ${canonical}`);
      assert.ok(
        !PKG.bin[canonical].includes('scripts/legacy/'),
        `${canonical} must not route through the deprecation shim`
      );
    }
  })) passed++; else failed++;

  if (test('shim files exist and the packed files list ships them', () => {
    for (const { legacy } of SHIMS) {
      assert.ok(fs.existsSync(path.join(LEGACY_DIR, `${legacy}.js`)), `missing ${legacy}.js`);
    }
    assert.ok(PKG.files.includes('scripts/legacy/'), 'scripts/legacy/ must be published');
  })) passed++; else failed++;

  if (test('each shim delegates to an existing target script', () => {
    for (const { legacy, target } of SHIMS) {
      const source = fs.readFileSync(path.join(LEGACY_DIR, `${legacy}.js`), 'utf8');
      assert.ok(source.includes(`'${target}'`), `${legacy}.js must delegate to ${target}`);
      assert.ok(
        fs.existsSync(path.join(REPO_ROOT, 'scripts', target)),
        `target script scripts/${target} does not exist`
      );
    }
  })) passed++; else failed++;

  console.log('\ndeprecation notice');

  if (test('the ecc shim warns on stderr and keeps stdout clean', () => {
    const result = runShim('ecc', ['--help']);
    assert.match(result.stderr, /`ecc` command is deprecated/);
    assert.match(result.stderr, /1\.0\.0/);
    assert.ok(
      !result.stdout.includes('deprecated'),
      'stdout must stay clean so piped and --json output remains parseable'
    );
  })) passed++; else failed++;

  if (test('the notice names the canonical replacement for the subcommand', () => {
    assert.match(runShim('ecc', ['doctor', '--help']).stderr, /Use `aiuby doctor`/);
    assert.match(runShim('ecc', ['--dry-run', 'status']).stderr, /Use `aiuby status`/);
  })) passed++; else failed++;

  if (test('auxiliary shims name the bare canonical binary', () => {
    const result = runShim('ecc-install', ['--help']);
    assert.match(result.stderr, /Use `aiuby-install`/);
  })) passed++; else failed++;

  if (test('the notice can be suppressed', () => {
    const result = spawnSync(process.execPath, [path.join(LEGACY_DIR, 'ecc.js'), '--help'], {
      encoding: 'utf8',
      env: { ...process.env, AIUBY_SUPPRESS_DEPRECATIONS: '1' },
      timeout: 30000,
    });
    assert.ok(!result.stderr.includes('deprecated'), 'suppressed notice must not appear');
  })) passed++; else failed++;

  console.log('\ndelegation');

  if (test('the shim forwards output from the target script', () => {
    const result = runShim('ecc', ['--help']);
    assert.match(result.stdout, /Usage:/);
    assert.strictEqual(result.status, 0);
  })) passed++; else failed++;

  if (test('the shim propagates a non-zero exit code', () => {
    const result = runShim('ecc', ['definitely-not-a-command']);
    assert.notStrictEqual(result.status, 0, 'unknown command must not exit 0');
  })) passed++; else failed++;

  if (test('the shim forwards arguments verbatim', () => {
    const result = runShim('ecc', ['catalog', 'profiles']);
    assert.strictEqual(result.status, 0);
    assert.ok(result.stdout.length > 0, 'delegated command produced no output');
  })) passed++; else failed++;

  console.log('\n=== Test Results ===');
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Total:  ${passed + failed}\n`);

  process.exit(failed > 0 ? 1 : 0);
}

runTests();
