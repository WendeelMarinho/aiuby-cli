/**
 * Guards that published counts stay derived from the tree, and that commands
 * the README advertises actually exist in the CLI.
 *
 * Run with: node tests/ci/catalog-counts-surface.test.js
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const { computeCounts, BEGIN_MARKER, END_MARKER } = require('../../scripts/lib/catalog-counts');

const REPO_ROOT = path.resolve(__dirname, '..', '..');
const GENERATOR = path.join(REPO_ROOT, 'scripts', 'ci', 'generate-counts.js');

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

function readReadme() {
  return fs.readFileSync(path.join(REPO_ROOT, 'README.md'), 'utf8');
}

function runTests() {
  let passed = 0;
  let failed = 0;

  console.log('\n=== catalog counts surface ===\n');

  if (test('README opts into generated counts', () => {
    const readme = readReadme();
    assert.ok(readme.includes(BEGIN_MARKER), 'README must carry the counts begin marker');
    assert.ok(readme.includes(END_MARKER), 'README must carry the counts end marker');
  })) passed++; else failed++;

  if (test('published counts match the tree', () => {
    const result = spawnSync(process.execPath, [GENERATOR, '--check'], {
      cwd: REPO_ROOT,
      encoding: 'utf8',
      timeout: 60000,
    });
    assert.strictEqual(
      result.status,
      0,
      `counts are stale — run "npm run counts:write".\n${result.stderr}`
    );
  })) passed++; else failed++;

  if (test('no surface count is hand-written outside the marked block', () => {
    const readme = readReadme();
    const data = computeCounts({ root: REPO_ROOT });
    const start = readme.indexOf(BEGIN_MARKER);
    const end = readme.indexOf(END_MARKER);
    const outside = readme.slice(0, start) + readme.slice(end);

    for (const [surface, value] of Object.entries(data)) {
      if (typeof value !== 'number' || value < 10) {
        continue;
      }
      assert.ok(
        !new RegExp(`\\b${value}\\s+(agents|skills|commands|harnesses|install targets)\\b`, 'i').test(outside),
        `README states "${value} ${surface}" outside the generated block; it will drift`
      );
    }
  })) passed++; else failed++;

  if (test('every aiuby command the README shows exists in the CLI', () => {
    const help = spawnSync(process.execPath, [path.join(REPO_ROOT, 'scripts', 'aiuby.js')], {
      cwd: REPO_ROOT,
      encoding: 'utf8',
      timeout: 60000,
    }).stdout;

    const available = new Set(
      (help.match(/^ {2}([a-z][a-z-]+)/gm) || []).map(line => line.trim())
    );
    assert.ok(available.size > 5, 'could not read the CLI command list');

    const advertised = new Set(
      (readReadme().match(/\baiuby ([a-z][a-z-]+)/g) || []).map(match => match.split(' ')[1])
    );

    const missing = [...advertised].filter(command => !available.has(command));
    assert.deepStrictEqual(missing, [], `README advertises commands the CLI does not have: ${missing}`);
  })) passed++; else failed++;

  if (test('the README does not describe the shipped CLI as future work', () => {
    const readme = readReadme();
    assert.ok(
      !/future command-line control surface/i.test(readme),
      'the Aiuby CLI has shipped; describing it as future understates the surface'
    );
  })) passed++; else failed++;

  console.log('\n=== Test Results ===');
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Total:  ${passed + failed}\n`);

  process.exit(failed > 0 ? 1 : 0);
}

runTests();
