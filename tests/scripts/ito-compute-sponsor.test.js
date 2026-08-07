/**
 * Tests for the Phase 1 Ito compute-sponsor surface.
 */

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const REPO_ROOT = path.join(__dirname, '..', '..');
const URL_TOKEN_PATTERN = /https?:\/\/[^\s<>"'`(){}\\]+/g;
const EXPECTED_COMPUTE_ROUTE = Object.freeze({
  protocol: 'https:',
  hostname: 'compute.itomarkets.com',
  port: '',
  username: '',
  password: '',
  pathname: '/',
  search: '',
  hash: '',
});

function read(relativePath) {
  return fs.readFileSync(path.join(REPO_ROOT, relativePath), 'utf8');
}

function readPngDimensions(relativePath) {
  const image = fs.readFileSync(path.join(REPO_ROOT, relativePath));
  assert.strictEqual(image.subarray(1, 4).toString('ascii'), 'PNG');
  return {
    width: image.readUInt32BE(16),
    height: image.readUInt32BE(20),
  };
}

function runTest(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    return true;
  } catch (error) {
    console.log(`  ✗ ${name}`);
    console.error(`    ${error.message}`);
    return false;
  }
}

function isExactComputeRoute(candidate) {
  try {
    const parsed = new URL(candidate.replace(/[.,;:!?]+$/, ''));
    return Object.entries(EXPECTED_COMPUTE_ROUTE).every(
      ([property, expected]) => parsed[property] === expected
    );
  } catch {
    return false;
  }
}

function assertExactComputeRoute(content) {
  const candidates = content.match(URL_TOKEN_PATTERN) || [];
  assert.ok(
    candidates.some(isExactComputeRoute),
    'Should include the exact Itô compute route'
  );
}

function assertExactHref(content, expectedHref) {
  const expected = new URL(expectedHref);
  const hrefs = [...content.matchAll(/\bhref="([^"]+)"/g)].map(match => match[1]);
  const properties = [
    'protocol',
    'hostname',
    'port',
    'username',
    'password',
    'pathname',
    'search',
    'hash',
  ];
  const hasExactHref = hrefs.some((href) => {
    try {
      const candidate = new URL(href);
      return properties.every(property => candidate[property] === expected[property]);
    } catch {
      return false;
    }
  });

  assert.ok(hasExactHref, `Should include the exact href ${expectedHref}`);
}

function assertHonestComputeCopy(content) {
  assertExactComputeRoute(content);
  assert.match(content, /compute provider Aiuby can bridge to/i);
  assert.match(content, /run or self-host any open-source model/i);
  assert.match(content, /any GPU provider/i);
  assert.match(content, /does not reserve capacity/i);
  assert.match(content, /aiuby ito find/i);
  assert.match(content, /explicitly configured canonical Itô CLI/i);
  assert.match(content, /submits a live authenticated RFQ/i);
  assert.match(content, /does not reserve capacity/i);
  assert.match(content, /managed inference[^\n.]*not live/i);
  assert.doesNotMatch(content, /ECC only (?:links|provides this link)/i);
}

function extractNamedTable(content, ariaLabel) {
  const escapedLabel = ariaLabel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = content.match(
    new RegExp(`<table[^>]*aria-label="${escapedLabel}"[^>]*>([\\s\\S]*?)<\\/table>`)
  );

  assert.ok(match, `Should include the "${ariaLabel}" table`);
  return match[1];
}

function main() {
  console.log('\n=== Testing Ito compute-sponsor surface ===\n');

  let passed = 0;
  let failed = 0;

  const tests = [
    ['compute route validation rejects deceptive lookalike hosts', () => {
      const deceptiveCopy = [
        'Itô is a compute provider Aiuby can bridge to:',
        'https://compute.itomarkets.com.attacker.example',
        'Any GPU provider works.',
        'Managed inference through Itô is not live.',
      ].join(' ');

      assert.throws(
        () => assertHonestComputeCopy(deceptiveCopy),
        /exact Itô compute route/
      );
    }],
    ['Kimi install stays inside its project root and passes doctor with native instruction surfaces', () => {
      const homeDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ecc-kimi-home-'));
      const projectDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ecc-kimi-project-'));

      try {
        const result = spawnSync(
          process.execPath,
          [
            path.join(REPO_ROOT, 'scripts', 'install-apply.js'),
            '--target',
            'kimi',
            '--profile',
            'minimal',
            '--dry-run',
            '--json',
          ],
          {
            cwd: projectDir,
            env: { ...process.env, HOME: homeDir },
            encoding: 'utf8',
            maxBuffer: 20 * 1024 * 1024,
          }
        );
        assert.strictEqual(result.status, 0, result.stderr);

        const plan = JSON.parse(result.stdout).plan;
        const targetRoot = path.resolve(plan.targetRoot);
        const destinations = plan.operations.map(operation => (
          path.resolve(operation.destinationPath)
        ));
        const relativeDestinations = destinations.map(destination => (
          path.relative(targetRoot, destination).replaceAll(path.sep, '/')
        ));

        assert.strictEqual(plan.target, 'kimi');
        assert.strictEqual(plan.adapter.id, 'kimi-project');
        assert.strictEqual(plan.adapter.kind, 'project');
        assert.deepStrictEqual(plan.warnings, []);
        assert.ok(plan.operations.length > 0);
        assert.ok(destinations.every(destination => (
          destination === targetRoot || destination.startsWith(`${targetRoot}${path.sep}`)
        )));
        assert.ok(relativeDestinations.includes('AGENTS.md'));
        assert.ok(relativeDestinations.some(destination => destination.startsWith('skills/')));
        assert.ok(relativeDestinations.every(destination => (
          !/^\.(?:claude|codex|cursor|gemini|hermes|opencode|openclaw|qwen|zed)\//.test(destination)
        )));

        const apply = spawnSync(
          process.execPath,
          [
            path.join(REPO_ROOT, 'scripts', 'install-apply.js'),
            '--target',
            'kimi',
            '--profile',
            'minimal',
            '--json',
          ],
          {
            cwd: projectDir,
            env: { ...process.env, HOME: homeDir },
            encoding: 'utf8',
            maxBuffer: 30 * 1024 * 1024,
          }
        );
        assert.strictEqual(apply.status, 0, apply.stderr);
        assert.strictEqual(JSON.parse(apply.stdout).result.target, 'kimi');
        assert.ok(fs.existsSync(path.join(projectDir, '.kimi', 'AGENTS.md')));
        assert.ok(fs.readdirSync(path.join(projectDir, '.kimi', 'skills')).length > 0);

        const doctor = spawnSync(
          process.execPath,
          [
            path.join(REPO_ROOT, 'scripts', 'doctor.js'),
            '--target',
            'kimi',
            '--json',
          ],
          {
            cwd: projectDir,
            env: { ...process.env, HOME: homeDir },
            encoding: 'utf8',
            maxBuffer: 30 * 1024 * 1024,
          }
        );
        assert.strictEqual(doctor.status, 0, doctor.stderr);
        const doctorResult = JSON.parse(doctor.stdout).results.find(result => (
          result.adapter.target === 'kimi'
        ));
        assert.ok(doctorResult);
        assert.strictEqual(doctorResult.exists, true);
      } finally {
        fs.rmSync(homeDir, { recursive: true, force: true });
        fs.rmSync(projectDir, { recursive: true, force: true });
      }
    }],
    ['inference guide distinguishes rental compute from managed serving', () => {
      assertHonestComputeCopy(read('docs/ATLAS-CLOUD-GUIDE.md'));
    }],
    ['harness docs route generic open-source model intent without lock-in', () => {
      assertHonestComputeCopy(read('.claude-plugin/README.md'));
      assertHonestComputeCopy(read('.kimi/README.md'));
    }],
    ['integration record keeps the thesis and real client boundary honest', () => {
      const record = read('docs/design/ecc-ito-compute-integration.md');
      assert.match(record, /-> any open-source model/);
      assert.doesNotMatch(record, /public Kimi|Moonshot|video and sponsorship/i);
      assert.match(record, /Status: \*\*Implemented local CLI bridge/i);
      assert.match(record, /auth`, `find`, `status`, and `evals/);
      assert.match(record, /ito_auth`, `ito_find`, and `ito_status/);
      assert.match(record, /sixtytwo-cli==0\.3\.33/);
      assert.match(record, /explicit node/i);
      assert.match(record, /unpublished/i);
      assert.match(record, /managed inference remains unavailable/i);
      assert.match(record, /version bump[\s\S]*intentionally deferred/i);
      assert.doesNotMatch(record, /manual_copy|ito\.compute\.handoff|ecc ito rent/i);
    }],
    ['top-level CLI help exposes the provider-neutral compute route', () => {
      const result = spawnSync('node', ['scripts/aiuby.js', '--help'], {
        cwd: REPO_ROOT,
        encoding: 'utf8',
      });
      assert.strictEqual(result.status, 0, result.stderr);
      assertHonestComputeCopy(result.stdout);
    }],
    ['installer help and human dry-run expose the compute route', () => {
      const help = spawnSync('node', ['scripts/install-apply.js', '--help'], {
        cwd: REPO_ROOT,
        encoding: 'utf8',
      });
      assert.strictEqual(help.status, 0, help.stderr);
      assertHonestComputeCopy(help.stdout);

      const homeDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ecc-ito-home-'));
      const projectDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ecc-ito-project-'));
      try {
        const dryRun = spawnSync(
          'node',
          [path.join(REPO_ROOT, 'scripts', 'install-apply.js'), '--profile', 'minimal', '--dry-run'],
          {
            cwd: projectDir,
            env: { ...process.env, HOME: homeDir },
            encoding: 'utf8',
          }
        );
        assert.strictEqual(dryRun.status, 0, dryRun.stderr);
        assertHonestComputeCopy(dryRun.stdout);
      } finally {
        fs.rmSync(homeDir, { recursive: true, force: true });
        fs.rmSync(projectDir, { recursive: true, force: true });
      }
    }],
  ];

  for (const [name, fn] of tests) {
    if (runTest(name, fn)) {
      passed += 1;
    } else {
      failed += 1;
    }
  }

  console.log(`\nResults: Passed: ${passed}, Failed: ${failed}`);
  process.exit(failed > 0 ? 1 : 0);
}

main();
