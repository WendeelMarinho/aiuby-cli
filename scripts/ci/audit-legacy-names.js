#!/usr/bin/env node
/**
 * Audit the repository for pre-rebrand ECC identifiers.
 *
 * The naming contract and the permanent legacy allowlist are frozen in
 * docs/architecture/ADR-0001-aiuby-naming-and-namespaces.md.
 *
 * Usage:
 *   node scripts/ci/audit-legacy-names.js
 *   node scripts/ci/audit-legacy-names.js --json
 *   node scripts/ci/audit-legacy-names.js --strict
 *   node scripts/ci/audit-legacy-names.js --classification rename --pattern env-var
 *   node scripts/ci/audit-legacy-names.js --write-baseline
 *
 * Exit codes:
 *   0  clean, or non-strict run
 *   1  --strict and actionable findings exceed the baseline budget
 *   2  bad invocation
 */

const fs = require('fs');
const path = require('path');

const { auditTree, CLASSIFICATIONS, LEGACY_PATTERNS } = require('../lib/legacy-name-audit');

const REPO_ROOT = path.resolve(__dirname, '../..');
const BASELINE_PATH = path.join(REPO_ROOT, 'docs/migration/legacy-name-baseline.json');
const PATTERN_IDS = LEGACY_PATTERNS.map(pattern => pattern.id);

function usage() {
  return `
Audit legacy ECC names against the ADR-0001 naming contract.

Usage:
  node scripts/ci/audit-legacy-names.js [options]

Options:
  --root <path>              Directory to audit (default: repository root)
  --json                     Emit machine-readable JSON
  --strict                   Exit 1 when actionable findings exceed the baseline
  --max <n>                  Override the baseline budget for --strict
  --classification <id>      Filter output (${CLASSIFICATIONS.join(', ')})
  --pattern <id>             Filter output (${PATTERN_IDS.join(', ')})
  --limit <n>                Show at most n findings in text mode (default: 40)
  --write-baseline           Record the current actionable count as the budget
  -h, --help                 Show this help

The budget only ever ratchets down: --write-baseline refuses to raise it.
`;
}

function parseArgs(argv) {
  const options = {
    root: REPO_ROOT,
    json: false,
    strict: false,
    max: null,
    classification: null,
    pattern: null,
    limit: 40,
    writeBaseline: false,
    help: false,
  };

  const requireValue = (arg, value) => {
    if (value === undefined) {
      throw new Error(`${arg} requires a value`);
    }
    return value;
  };

  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    switch (arg) {
      case '--root':
        options.root = path.resolve(requireValue(arg, argv[++i]));
        break;
      case '--json':
        options.json = true;
        break;
      case '--strict':
        options.strict = true;
        break;
      case '--max':
        options.max = Number.parseInt(requireValue(arg, argv[++i]), 10);
        if (!Number.isInteger(options.max) || options.max < 0) {
          throw new Error('--max requires a non-negative integer');
        }
        break;
      case '--classification':
        options.classification = requireValue(arg, argv[++i]);
        if (!CLASSIFICATIONS.includes(options.classification)) {
          throw new Error(`Unknown classification: ${options.classification}`);
        }
        break;
      case '--pattern':
        options.pattern = requireValue(arg, argv[++i]);
        if (!PATTERN_IDS.includes(options.pattern)) {
          throw new Error(`Unknown pattern: ${options.pattern}`);
        }
        break;
      case '--limit':
        options.limit = Number.parseInt(requireValue(arg, argv[++i]), 10);
        if (!Number.isInteger(options.limit) || options.limit < 0) {
          throw new Error('--limit requires a non-negative integer');
        }
        break;
      case '--write-baseline':
        options.writeBaseline = true;
        break;
      case '-h':
      case '--help':
        options.help = true;
        break;
      default:
        throw new Error(`Unknown argument: ${arg}`);
    }
  }

  return options;
}

function readBaseline() {
  try {
    const parsed = JSON.parse(fs.readFileSync(BASELINE_PATH, 'utf8'));
    return Number.isInteger(parsed.actionableBudget) ? parsed.actionableBudget : null;
  } catch {
    return null;
  }
}

function writeBaseline(summary) {
  const previous = readBaseline();
  if (previous !== null && summary.actionable > previous) {
    throw new Error(
      `Refusing to raise the baseline: current ${summary.actionable} > recorded ${previous}. `
      + 'The budget only ratchets down.'
    );
  }

  fs.mkdirSync(path.dirname(BASELINE_PATH), { recursive: true });
  fs.writeFileSync(
    BASELINE_PATH,
    `${JSON.stringify({
      $comment: 'Actionable legacy-name budget. Ratchets down only. See docs/architecture/ADR-0001-aiuby-naming-and-namespaces.md',
      actionableBudget: summary.actionable,
      total: summary.total,
      byClassification: summary.byClassification,
      byPattern: summary.byPattern,
    }, null, 2)}\n`,
    'utf8'
  );

  return summary.actionable;
}

function applyFilters(findings, options) {
  return findings.filter(finding => (
    (!options.classification || finding.classification === options.classification)
    && (!options.pattern || finding.pattern === options.pattern)
  ));
}

function topEntries(counts, limit) {
  return Object.entries(counts)
    .filter(([, count]) => count > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit);
}

function countBy(findings, key) {
  const counts = {};
  for (const finding of findings) {
    counts[finding[key]] = (counts[finding[key]] || 0) + 1;
  }
  return counts;
}

function renderText(result, filtered, options, budget) {
  const { summary } = result;
  const lines = [];

  lines.push('');
  lines.push('Legacy name audit — ADR-0001 naming contract');
  lines.push(`Root: ${result.root}`);
  lines.push('');
  lines.push(`Total occurrences: ${summary.total}`);
  lines.push(`Actionable:        ${summary.actionable}${budget === null ? '' : ` (budget ${budget})`}`);
  lines.push('');

  lines.push('By classification:');
  for (const classification of CLASSIFICATIONS) {
    const count = summary.byClassification[classification] || 0;
    const marker = count > 0 && !['rename', 'test-fixture'].includes(classification) ? ' ' : ' ';
    lines.push(`  ${classification.padEnd(22)}${marker}${count}`);
  }
  lines.push('');

  lines.push('By pattern:');
  for (const [pattern, count] of topEntries(summary.byPattern, PATTERN_IDS.length)) {
    lines.push(`  ${pattern.padEnd(22)} ${count}`);
  }
  lines.push('');

  const fileCounts = topEntries(countBy(filtered, 'file'), 15);
  if (fileCounts.length > 0) {
    lines.push(`Top files${options.classification || options.pattern ? ' (filtered)' : ''}:`);
    for (const [file, count] of fileCounts) {
      lines.push(`  ${String(count).padStart(5)}  ${file}`);
    }
    lines.push('');
  }

  if (options.limit > 0 && filtered.length > 0) {
    lines.push(`Findings (showing ${Math.min(options.limit, filtered.length)} of ${filtered.length}):`);
    for (const finding of filtered.slice(0, options.limit)) {
      lines.push(`  ${finding.file}:${finding.line}  [${finding.classification}/${finding.pattern}]  ${finding.match}`);
    }
    lines.push('');
  }

  return lines.join('\n');
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

  const result = auditTree({ root: options.root });
  const filtered = applyFilters(result.findings, options);
  let budget = options.max !== null ? options.max : readBaseline();

  if (options.writeBaseline) {
    try {
      budget = writeBaseline(result.summary);
      process.stderr.write(`Baseline written: ${budget} actionable findings.\n`);
    } catch (error) {
      process.stderr.write(`Error: ${error.message}\n`);
      process.exit(1);
    }
  }

  if (options.json) {
    process.stdout.write(`${JSON.stringify({
      root: result.root,
      summary: result.summary,
      budget,
      findings: filtered,
    }, null, 2)}\n`);
  } else {
    process.stdout.write(`${renderText(result, filtered, options, budget)}\n`);
  }

  if (options.strict) {
    const limit = budget === null ? 0 : budget;
    if (result.summary.actionable > limit) {
      process.stderr.write(
        `Legacy name audit failed: ${result.summary.actionable} actionable findings exceed the budget of ${limit}.\n`
      );
      process.exit(1);
    }
  }

  process.exit(0);
}

if (require.main === module) {
  main();
}

module.exports = { parseArgs, readBaseline, BASELINE_PATH };
