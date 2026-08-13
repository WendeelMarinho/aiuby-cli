#!/usr/bin/env node
/**
 * Assert every declared `bin` target resolves to a file that exists.
 *
 * This exists because `package-lock.json` shipped `"aiuby": "scripts/ecc.js"`
 * long after that file was renamed: the canonical entrypoint of the package
 * pointed at nothing. The legacy-name audit could not catch it — its
 * `legacy-command` pattern excludes path-shaped references by design, so a
 * broken *path* is invisible to a scanner looking for a broken *word*.
 *
 * Lockfiles are generated state. They drift from package.json silently and no
 * test exercises them, so the failure only surfaces after publish, on a user's
 * machine, as `command not found`. A file-existence check needs no naming
 * heuristics and cannot produce a false positive.
 */

'use strict';

const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..', '..');

/** Bin maps declared across the manifest and both lockfiles. */
function collectBinMaps() {
  const maps = [];

  const pkgPath = path.join(repoRoot, 'package.json');
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  maps.push({ source: 'package.json', bin: pkg.bin || {} });

  const lockPath = path.join(repoRoot, 'package-lock.json');
  if (fs.existsSync(lockPath)) {
    const lock = JSON.parse(fs.readFileSync(lockPath, 'utf8'));
    const rootEntry = lock.packages && lock.packages[''];
    if (rootEntry && rootEntry.bin) {
      maps.push({ source: 'package-lock.json', bin: rootEntry.bin });
    }
  }

  return maps;
}

/**
 * Lockfile bin maps must agree with package.json, not merely point at real
 * files. A stale-but-existing target still installs the wrong command.
 */
function compareAgainstManifest(maps) {
  const manifest = maps.find(m => m.source === 'package.json');
  const problems = [];

  for (const map of maps) {
    if (map.source === 'package.json') continue;
    for (const [name, target] of Object.entries(map.bin)) {
      const expected = manifest.bin[name];
      if (expected === undefined) {
        problems.push(`${map.source}: declares bin "${name}" that package.json does not`);
      } else if (expected !== target) {
        problems.push(
          `${map.source}: bin "${name}" -> ${target}, but package.json says ${expected}`
        );
      }
    }
    for (const name of Object.keys(manifest.bin)) {
      if (map.bin[name] === undefined) {
        problems.push(`${map.source}: missing bin "${name}" declared in package.json`);
      }
    }
  }

  return problems;
}

function main() {
  const maps = collectBinMaps();
  const problems = [];
  let checked = 0;

  for (const map of maps) {
    for (const [name, target] of Object.entries(map.bin)) {
      checked += 1;
      if (!fs.existsSync(path.join(repoRoot, target))) {
        problems.push(`${map.source}: bin "${name}" -> ${target} (file does not exist)`);
      }
    }
  }

  problems.push(...compareAgainstManifest(maps));

  if (problems.length > 0) {
    console.error('[bin-targets] FAIL');
    for (const problem of problems) {
      console.error(`  ${problem}`);
    }
    console.error('\nRun `npm install --package-lock-only` to regenerate the lockfile.');
    process.exit(1);
  }

  console.log(`[bin-targets] OK - ${checked} targets across ${maps.length} manifests resolve`);
}

main();
