#!/usr/bin/env node
/**
 * Generate catalog counts and keep marked documents in sync with the tree.
 *
 * A document opts in by embedding the marker pair; nothing is listed here.
 *
 *   <!-- aiuby:counts:begin -->
 *   <!-- aiuby:counts:end -->
 *
 * Usage:
 *   node scripts/ci/generate-counts.js            # print the counts
 *   node scripts/ci/generate-counts.js --json
 *   node scripts/ci/generate-counts.js --write    # update marked documents
 *   node scripts/ci/generate-counts.js --check    # fail if any is stale
 *
 * Exit codes:
 *   0  in sync, or informational run
 *   1  --check and at least one document is stale
 *   2  bad invocation
 */

const fs = require('fs');
const path = require('path');

const {
  BEGIN_MARKER,
  END_MARKER,
  computeCounts,
  hasMarkers,
  renderInto,
  renderTable,
} = require('../lib/catalog-counts');

const REPO_ROOT = path.resolve(__dirname, '../..');

const IGNORED_DIRS = new Set([
  '.git', 'node_modules', 'target', 'dist', 'build', 'coverage', '__pycache__',
]);

function usage() {
  return `
Generate catalog counts from the tree.

Usage:
  node scripts/ci/generate-counts.js [options]

Options:
  --write     Update every document carrying the count markers
  --check     Exit 1 when a marked document is out of date
  --json      Emit machine-readable JSON
  --root <p>  Repository root (default: this repository)
  -h, --help  Show this help

Documents opt in by embedding:
  ${BEGIN_MARKER}
  ${END_MARKER}
`;
}

function parseArgs(argv) {
  const options = { write: false, check: false, json: false, root: REPO_ROOT, help: false };

  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    switch (arg) {
      case '--write': options.write = true; break;
      case '--check': options.check = true; break;
      case '--json': options.json = true; break;
      case '--root': {
        const value = argv[++i];
        if (value === undefined) {
          throw new Error('--root requires a value');
        }
        options.root = path.resolve(value);
        break;
      }
      case '-h':
      case '--help': options.help = true; break;
      default: throw new Error(`Unknown argument: ${arg}`);
    }
  }

  return options;
}

function findMarkedDocuments(root) {
  const found = [];

  (function walk(dir) {
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (!IGNORED_DIRS.has(entry.name)) {
          walk(fullPath);
        }
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        let text;
        try {
          text = fs.readFileSync(fullPath, 'utf8');
        } catch {
          continue;
        }
        if (hasMarkers(text)) {
          found.push({ path: fullPath, relativePath: path.relative(root, fullPath), text });
        }
      }
    }
  })(root);

  return found.sort((a, b) => a.relativePath.localeCompare(b.relativePath));
}

function main() {
  let options;
  try {
    options = parseArgs(process.argv);
  } catch (error) {
    process.stderr.write(`Error: ${error.message}\n${usage()}`);
    process.exit(2);
  }

  if (options.help) {
    process.stdout.write(usage());
    process.exit(0);
  }

  const data = computeCounts({ root: options.root });
  const documents = findMarkedDocuments(options.root);

  const stale = [];
  const updated = [];

  for (const doc of documents) {
    const rendered = renderInto(doc.text, data);
    if (rendered === doc.text) {
      continue;
    }
    stale.push(doc.relativePath);
    if (options.write) {
      fs.writeFileSync(doc.path, rendered, 'utf8');
      updated.push(doc.relativePath);
    }
  }

  if (options.json) {
    process.stdout.write(`${JSON.stringify({
      counts: data,
      documents: documents.map(doc => doc.relativePath),
      stale,
      updated,
    }, null, 2)}\n`);
  } else {
    const lines = ['', 'Aiuby catalog counts', '', renderTable(data), ''];
    lines.push(`Marked documents: ${documents.length || 'none'}`);
    for (const doc of documents) {
      lines.push(`  ${stale.includes(doc.relativePath) ? '✗ stale  ' : '✓ current'} ${doc.relativePath}`);
    }
    if (options.write && updated.length > 0) {
      lines.push('', `Updated ${updated.length} document(s).`);
    }
    lines.push('');
    process.stdout.write(lines.join('\n'));
  }

  if (options.check && stale.length > 0) {
    process.stderr.write(
      `Catalog counts are stale in ${stale.length} document(s): ${stale.join(', ')}\n`
      + 'Run: npm run counts:write\n'
    );
    process.exit(1);
  }

  process.exit(0);
}

if (require.main === module) {
  main();
}

module.exports = { parseArgs, findMarkedDocuments };
