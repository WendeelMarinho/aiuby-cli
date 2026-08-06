/**
 * Tests for scripts/lib/legacy-name-audit.js
 *
 * Run with: node tests/lib/legacy-name-audit.test.js
 */

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');

const audit = require('../../scripts/lib/legacy-name-audit');

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
  return fs.mkdtempSync(path.join(os.tmpdir(), 'legacy-name-audit-'));
}

function writeFile(root, relativePath, contents) {
  const target = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, contents, 'utf8');
}

function matchesFor(relativePath, text) {
  return audit.auditText({ relativePath, text });
}

function patternsFound(findings) {
  return findings.map(finding => finding.pattern).sort();
}

function runTests() {
  let passed = 0;
  let failed = 0;

  console.log('\n=== legacy-name-audit ===\n');

  console.log('detection');

  if (test('detects the legacy domain', () => {
    const findings = matchesFor('README.md', 'See https://ecc.tools for docs.');
    assert.strictEqual(findings.length, 1);
    assert.strictEqual(findings[0].pattern, 'legacy-domain');
    assert.strictEqual(findings[0].match, 'ecc.tools');
    assert.strictEqual(findings[0].line, 1);
  })) passed++; else failed++;

  if (test('detects ECC_ environment variables', () => {
    const findings = matchesFor('scripts/foo.js', 'const x = process.env.ECC_DRY_RUN;');
    assert.strictEqual(findings.length, 1);
    assert.strictEqual(findings[0].pattern, 'env-var');
    assert.strictEqual(findings[0].match, 'ECC_DRY_RUN');
  })) passed++; else failed++;

  if (test('detects the upstream repository slug', () => {
    const findings = matchesFor('docs/guide.md', 'clone https://github.com/affaan-m/ECC');
    assert.deepStrictEqual(patternsFound(findings), ['upstream-repo']);
  })) passed++; else failed++;

  if (test('detects upstream personal contacts', () => {
    const findings = matchesFor('.codex-plugin/plugin.json', '"email": "me@affaanmustafa.com"');
    assert.deepStrictEqual(patternsFound(findings), ['upstream-contact']);
  })) passed++; else failed++;

  if (test('detects the x.com upstream handle', () => {
    const findings = matchesFor('README.md', 'https://x.com/affaanmustafa');
    assert.ok(patternsFound(findings).includes('upstream-contact'));
  })) passed++; else failed++;

  if (test('detects legacy state directories', () => {
    const findings = matchesFor('scripts/lib/memory-vault.js', "path.join(home, '.ecc', 'memory')");
    assert.deepStrictEqual(patternsFound(findings), ['legacy-state-dir']);
  })) passed++; else failed++;

  if (test('detects the legacy plugin reference', () => {
    const findings = matchesFor('docs/install.md', 'claude plugin install ecc@ecc');
    assert.ok(patternsFound(findings).includes('legacy-plugin-ref'));
  })) passed++; else failed++;

  if (test('detects the bare ecc command in shell examples', () => {
    const findings = matchesFor('README.md', 'Run `ecc doctor` to diagnose.');
    assert.ok(patternsFound(findings).includes('legacy-command'));
  })) passed++; else failed++;

  if (test('detects every published legacy binary name', () => {
    for (const bin of ['ecc-install', 'ecc-control-pane', 'ecc-memory-mcp', 'ecc-plan-canvas']) {
      const findings = matchesFor('README.md', `Run \`${bin} --help\`.`);
      assert.ok(findings.length > 0, `${bin} must be detected`);
      assert.strictEqual(findings[0].pattern, 'legacy-binary', bin);
      assert.strictEqual(findings[0].match, bin);
    }
  })) passed++; else failed++;

  if (test('detects legacy artifact names', () => {
    const crate = matchesFor('ecc2/Cargo.toml', 'name = "ecc-tui"');
    assert.ok(patternsFound(crate).includes('legacy-artifact'));

    const dashboard = matchesFor('ecc_dashboard.py', 'import ecc_dashboard_runtime');
    assert.ok(patternsFound(dashboard).includes('legacy-artifact'));
  })) passed++; else failed++;

  if (test('reports the correct line number for later lines', () => {
    const findings = matchesFor('a.md', 'one\ntwo\nsee ecc.tools\n');
    assert.strictEqual(findings[0].line, 3);
  })) passed++; else failed++;

  if (test('reports every occurrence on a single line', () => {
    const findings = matchesFor('a.md', 'ECC_ONE and ECC_TWO');
    assert.strictEqual(findings.length, 2);
    assert.deepStrictEqual(findings.map(f => f.match), ['ECC_ONE', 'ECC_TWO']);
  })) passed++; else failed++;

  console.log('\nfalse positives');

  if (test('does not match ecc inside ordinary words', () => {
    assert.deepStrictEqual(matchesFor('docs/pt-BR/README.md', 'A necessidade de checar.'), []);
    assert.deepStrictEqual(matchesFor('a.md', 'recce reccomend seccion'), []);
  })) passed++; else failed++;

  if (test('does not match the aiuby replacements', () => {
    assert.deepStrictEqual(matchesFor('scripts/aiuby.js', 'process.env.AIUBY_DRY_RUN'), []);
    assert.deepStrictEqual(matchesFor('README.md', 'Run `aiuby doctor`.'), []);
    assert.deepStrictEqual(matchesFor('README.md', 'https://aiuby.com'), []);
  })) passed++; else failed++;

  if (test('does not match unrelated ghcr images', () => {
    assert.deepStrictEqual(matchesFor('docs/docker.md', 'ghcr.io/org/myapp:latest'), []);
  })) passed++; else failed++;

  console.log('\nclassification');

  if (test('classifies ordinary source occurrences as rename', () => {
    const findings = matchesFor('scripts/doctor.js', 'process.env.ECC_DRY_RUN');
    assert.strictEqual(findings[0].classification, 'rename');
  })) passed++; else failed++;

  if (test('classifies allowlisted attribution files as upstream-attribution', () => {
    for (const file of ['LICENSE', 'NOTICE', 'UPSTREAM.md']) {
      const findings = matchesFor(file, 'Original work: https://github.com/affaan-m/ECC');
      assert.strictEqual(findings[0].classification, 'upstream-attribution', file);
    }
  })) passed++; else failed++;

  if (test('classifies migration docs and the ADR as historical-doc', () => {
    const migration = matchesFor('docs/migration/from-ecc-to-aiuby.md', 'Run `ecc doctor` first.');
    assert.strictEqual(migration[0].classification, 'historical-doc');

    const adr = matchesFor(
      'docs/architecture/ADR-0001-aiuby-naming-and-namespaces.md',
      'replaces ecc.tools'
    );
    assert.strictEqual(adr[0].classification, 'historical-doc');

    const changelog = matchesFor('CHANGELOG.md', 'renamed from ecc.tools');
    assert.strictEqual(changelog[0].classification, 'historical-doc');
  })) passed++; else failed++;

  if (test('classifies test files as test-fixture', () => {
    const findings = matchesFor('tests/hooks/hooks.test.js', 'env: { ECC_HOOK_PROFILE: "full" }');
    assert.strictEqual(findings[0].classification, 'test-fixture');
  })) passed++; else failed++;

  if (test('classifies lines marked aiuby:compat as compat-temporary', () => {
    const findings = matchesFor(
      'scripts/lib/legacy-compat.js',
      'const legacy = process.env.ECC_DRY_RUN; // aiuby:compat'
    );
    assert.strictEqual(findings[0].classification, 'compat-temporary');
  })) passed++; else failed++;

  if (test('classifies the legacy shim directory as compat-temporary', () => {
    const findings = matchesFor(
      'scripts/legacy/ecc-install.js',
      '/** Deprecated `ecc-install` entrypoint. Use `aiuby-install`. */'
    );
    assert.ok(findings.length > 0, 'expected the legacy token to be detected');
    assert.strictEqual(findings[0].classification, 'compat-temporary');
  })) passed++; else failed++;

  if (test('compat marker wins over the rename default but not over allowlists', () => {
    const compat = matchesFor('scripts/x.js', 'ecc.tools // aiuby:compat');
    assert.strictEqual(compat[0].classification, 'compat-temporary');

    const licensed = matchesFor('LICENSE', 'ecc.tools // aiuby:compat');
    assert.strictEqual(licensed[0].classification, 'upstream-attribution');
  })) passed++; else failed++;

  console.log('\nsummary');

  if (test('summarize counts findings by classification', () => {
    const findings = [
      { classification: 'rename' },
      { classification: 'rename' },
      { classification: 'test-fixture' },
      { classification: 'upstream-attribution' },
    ];
    const summary = audit.summarize(findings);
    assert.strictEqual(summary.total, 4);
    assert.strictEqual(summary.byClassification.rename, 2);
    assert.strictEqual(summary.byClassification['test-fixture'], 1);
    assert.strictEqual(summary.byClassification['upstream-attribution'], 1);
    assert.strictEqual(summary.byClassification['compat-temporary'], 0);
  })) passed++; else failed++;

  if (test('actionable count excludes allowlisted classifications', () => {
    const findings = [
      { classification: 'rename' },
      { classification: 'test-fixture' },
      { classification: 'upstream-attribution' },
      { classification: 'historical-doc' },
      { classification: 'compat-temporary' },
    ];
    assert.strictEqual(audit.summarize(findings).actionable, 2);
  })) passed++; else failed++;

  console.log('\ntree walking');

  if (test('walks a tree and skips node_modules and .git', () => {
    const root = createTempDir();
    try {
      writeFile(root, 'scripts/a.js', 'process.env.ECC_MODE');
      writeFile(root, 'node_modules/pkg/index.js', 'process.env.ECC_MODE');
      writeFile(root, '.git/config', 'url = ecc.tools');

      const result = audit.auditTree({ root });
      assert.strictEqual(result.findings.length, 1);
      assert.strictEqual(result.findings[0].file, 'scripts/a.js');
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  })) passed++; else failed++;

  if (test('skips binary and non-text files', () => {
    const root = createTempDir();
    try {
      writeFile(root, 'assets/logo.png', 'ECC_MODE');
      writeFile(root, 'docs/a.md', 'ECC_MODE');

      const result = audit.auditTree({ root });
      assert.deepStrictEqual(result.findings.map(f => f.file), ['docs/a.md']);
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  })) passed++; else failed++;

  if (test('returns findings sorted by file then line', () => {
    const root = createTempDir();
    try {
      writeFile(root, 'z.md', 'ecc.tools');
      writeFile(root, 'a.md', 'one\necc.tools');

      const result = audit.auditTree({ root });
      assert.deepStrictEqual(
        result.findings.map(f => `${f.file}:${f.line}`),
        ['a.md:2', 'z.md:1']
      );
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  })) passed++; else failed++;

  if (test('auditTree includes a summary', () => {
    const root = createTempDir();
    try {
      writeFile(root, 'scripts/a.js', 'process.env.ECC_MODE');
      writeFile(root, 'LICENSE', 'affaan-m/ECC');

      const result = audit.auditTree({ root });
      assert.strictEqual(result.summary.total, 2);
      assert.strictEqual(result.summary.actionable, 1);
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  })) passed++; else failed++;

  console.log('\n=== Test Results ===');
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Total:  ${passed + failed}\n`);

  process.exit(failed > 0 ? 1 : 0);
}

runTests();
