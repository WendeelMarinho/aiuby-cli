/**
 * Tests for scripts/lib/catalog-counts.js
 *
 * Run with: node tests/lib/catalog-counts.test.js
 */

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');

const counts = require('../../scripts/lib/catalog-counts');

const REPO_ROOT = path.resolve(__dirname, '..', '..');

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

function createTempRepo() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'catalog-counts-'));
  const write = (rel, body = 'x') => {
    const target = path.join(root, rel);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, body, 'utf8');
  };

  write('agents/a.md');
  write('agents/b.md');
  write('agents/README.md');            // index, not an agent
  write('skills/one/SKILL.md');
  write('skills/two/SKILL.md');
  write('commands/x.md');
  write('scripts/lib/install-targets/claude-home.js');
  write('scripts/lib/install-targets/claude-project.js');
  write('scripts/lib/install-targets/cursor-project.js');
  write('scripts/lib/install-targets/registry.js');
  write('scripts/lib/install-targets/helpers.js');

  return root;
}

function runTests() {
  let passed = 0;
  let failed = 0;

  console.log('\n=== catalog-counts ===\n');

  console.log('counting');

  if (test('counts agents, skills, and commands from disk', () => {
    const root = createTempRepo();
    try {
      const result = counts.computeCounts({ root });
      assert.strictEqual(result.agents, 2, 'agents/README.md is an index, not an agent');
      assert.strictEqual(result.skills, 2);
      assert.strictEqual(result.commands, 1);
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  })) passed++; else failed++;

  if (test('catalog is the sum of the three primary surfaces', () => {
    const root = createTempRepo();
    try {
      const result = counts.computeCounts({ root });
      assert.strictEqual(result.catalog, result.agents + result.skills + result.commands);
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  })) passed++; else failed++;

  if (test('separates install targets from distinct harnesses', () => {
    const root = createTempRepo();
    try {
      const result = counts.computeCounts({ root });
      // claude-home + claude-project + cursor-project = 3 targets, 2 harnesses
      assert.strictEqual(result.installTargets, 3);
      assert.strictEqual(result.harnesses, 2);
      assert.deepStrictEqual(result.harnessNames, ['claude', 'cursor']);
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  })) passed++; else failed++;

  if (test('ignores registry and helpers as targets', () => {
    const root = createTempRepo();
    try {
      assert.ok(!counts.computeCounts({ root }).harnessNames.includes('registry'));
      assert.ok(!counts.computeCounts({ root }).harnessNames.includes('helpers'));
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  })) passed++; else failed++;

  if (test('a skill directory without SKILL.md is not counted', () => {
    const root = createTempRepo();
    try {
      fs.mkdirSync(path.join(root, 'skills', 'empty'), { recursive: true });
      assert.strictEqual(counts.computeCounts({ root }).skills, 2);
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  })) passed++; else failed++;

  if (test('missing directories count as zero rather than throwing', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'catalog-empty-'));
    try {
      const result = counts.computeCounts({ root });
      assert.strictEqual(result.agents, 0);
      assert.strictEqual(result.skills, 0);
      assert.strictEqual(result.catalog, 0);
      assert.strictEqual(result.harnesses, 0);
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  })) passed++; else failed++;

  console.log('\nmarker rendering');

  if (test('renderInto replaces content between markers', () => {
    const before = `intro\n${counts.BEGIN_MARKER}\nstale\n${counts.END_MARKER}\noutro\n`;
    const after = counts.renderInto(before, { agents: 1, skills: 2, commands: 3, catalog: 6, harnesses: 4, installTargets: 5 });
    assert.ok(after.startsWith('intro\n'));
    assert.ok(after.endsWith('outro\n'));
    assert.ok(!after.includes('stale'));
    assert.ok(after.includes('1'));
  })) passed++; else failed++;

  if (test('renderInto is idempotent', () => {
    const data = { agents: 1, skills: 2, commands: 3, catalog: 6, harnesses: 4, installTargets: 5 };
    const base = `${counts.BEGIN_MARKER}\n${counts.END_MARKER}\n`;
    const once = counts.renderInto(base, data);
    assert.strictEqual(counts.renderInto(once, data), once);
  })) passed++; else failed++;

  if (test('renderInto leaves text without markers untouched', () => {
    const text = 'no markers here\n';
    assert.strictEqual(counts.renderInto(text, { agents: 1 }), text);
  })) passed++; else failed++;

  if (test('hasMarkers reports whether a document opts in', () => {
    assert.ok(counts.hasMarkers(`${counts.BEGIN_MARKER}\n${counts.END_MARKER}`));
    assert.ok(!counts.hasMarkers('plain text'));
    assert.ok(!counts.hasMarkers(counts.BEGIN_MARKER), 'an unterminated block does not count');
  })) passed++; else failed++;

  console.log('\nreal repository');

  if (test('the real repository reports the documented surface', () => {
    const result = counts.computeCounts({ root: REPO_ROOT });
    assert.ok(result.agents > 0 && result.skills > 0 && result.commands > 0);
    assert.strictEqual(result.catalog, result.agents + result.skills + result.commands);
    assert.ok(
      result.installTargets >= result.harnesses,
      'every harness has at least one target'
    );
  })) passed++; else failed++;

  console.log('\n=== Test Results ===');
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Total:  ${passed + failed}\n`);

  process.exit(failed > 0 ? 1 : 0);
}

runTests();
