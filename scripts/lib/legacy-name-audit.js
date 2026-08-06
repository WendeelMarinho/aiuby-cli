/**
 * Legacy name audit — locates and classifies pre-rebrand ECC identifiers.
 *
 * The naming contract this enforces is frozen in
 * docs/architecture/ADR-0001-aiuby-naming-and-namespaces.md.
 *
 * Classifications:
 *   rename               must become the Aiuby equivalent
 *   compat-temporary     intentional bridge, removed at 1.0.0 (marked `aiuby:compat`)
 *   upstream-attribution legally required, stays forever
 *   historical-doc       accurate record of the past, stays forever
 *   test-fixture         asserts on legacy names, updated with the rename
 */

const fs = require('fs');
const path = require('path');

/** Lines carrying this marker are a deliberate compatibility bridge. */
const COMPAT_MARKER = 'aiuby:compat';

/**
 * Patterns are ordered; the first match at a given index wins, so more specific
 * patterns must precede broader ones.
 */
const LEGACY_PATTERNS = Object.freeze([
  { id: 'legacy-domain', regex: /\becc\.tools\b/gi },
  { id: 'upstream-repo', regex: /\baffaan-m\/ECC\b/gi },
  { id: 'upstream-contact', regex: /\b(?:affaanmustafa|affaan-m(?!\/ECC)|x\.com\/affaan\w*|@affaan\w*)/gi },
  { id: 'env-var', regex: /\bECC_[A-Z0-9_]+/g },
  { id: 'legacy-plugin-ref', regex: /\becc@ecc\b/gi },
  // Auxiliary bin names. The legacy-command lookahead excludes `-`, so without
  // this pattern the published `ecc-*` entrypoints are invisible to the audit.
  { id: 'legacy-binary', regex: /\becc-(?:install|control-pane|memory-mcp|plan-canvas)\b/gi },
  { id: 'legacy-artifact', regex: /\becc(?:2|-tui|_dashboard\w*|-icon|-agentshield|-universal)\b/gi },
  { id: 'legacy-state-dir', regex: /(?<![\w./-])\.ecc(?![\w-])/g },
  { id: 'legacy-command', regex: /(?<![\w./@-])ecc(?![\w.-])/gi },
]);

/**
 * Files that keep upstream references permanently. Entries ending in `/` match
 * a directory prefix; everything else matches the exact repo-relative path.
 */
const ATTRIBUTION_PATHS = Object.freeze(['LICENSE', 'NOTICE', 'UPSTREAM.md']);

const HISTORICAL_PATHS = Object.freeze([
  'CHANGELOG.md',
  'docs/migration/',
  'docs/releases/',
  'docs/architecture/ADR-0001-aiuby-naming-and-namespaces.md',
  '.claude/plans/',
]);

const TEST_PATHS = Object.freeze(['tests/']);

/** Directories that exist solely as the deprecation bridge; deleted at 1.0.0. */
const COMPAT_PATHS = Object.freeze(['scripts/legacy/']);

const CLASSIFICATIONS = Object.freeze([
  'rename',
  'compat-temporary',
  'upstream-attribution',
  'historical-doc',
  'test-fixture',
]);

/** Classifications that do not count against the strict audit budget. */
const NON_ACTIONABLE = Object.freeze(new Set([
  'compat-temporary',
  'upstream-attribution',
  'historical-doc',
]));

const IGNORED_DIRS = Object.freeze(new Set([
  '.git',
  'node_modules',
  'target',
  'dist',
  'build',
  'coverage',
  '__pycache__',
  '.pytest_cache',
]));

const TEXT_EXTENSIONS = Object.freeze(new Set([
  '.js', '.mjs', '.cjs', '.ts', '.tsx', '.jsx', '.json', '.jsonc',
  '.md', '.mdx', '.txt', '.yml', '.yaml', '.toml', '.rs', '.py',
  '.sh', '.bash', '.zsh', '.ps1', '.svg', '.html', '.css', '.lock',
]));

/** Extensionless files we still want to read. */
const TEXT_FILENAMES = Object.freeze(new Set([
  'LICENSE', 'NOTICE', 'VERSION', 'CODEOWNERS', 'Dockerfile', '.npmignore', '.gitignore',
]));

function toPosix(relativePath) {
  return String(relativePath).split(path.sep).join('/');
}

function matchesPathList(relativePath, list) {
  const normalized = toPosix(relativePath);
  return list.some(entry => (
    entry.endsWith('/') ? normalized.startsWith(entry) : normalized === entry
  ));
}

function isTextFile(relativePath) {
  const base = path.basename(relativePath);
  if (TEXT_FILENAMES.has(base)) {
    return true;
  }
  return TEXT_EXTENSIONS.has(path.extname(base).toLowerCase());
}

/**
 * Resolve the classification for one occurrence. Allowlisted paths win over the
 * compat marker so a stray marker cannot reclassify an attribution file.
 */
function classifyOccurrence({ relativePath, lineText }) {
  if (matchesPathList(relativePath, ATTRIBUTION_PATHS)) {
    return 'upstream-attribution';
  }
  if (matchesPathList(relativePath, HISTORICAL_PATHS)) {
    return 'historical-doc';
  }
  if (matchesPathList(relativePath, TEST_PATHS)) {
    return 'test-fixture';
  }
  if (matchesPathList(relativePath, COMPAT_PATHS)) {
    return 'compat-temporary';
  }
  if (typeof lineText === 'string' && lineText.includes(COMPAT_MARKER)) {
    return 'compat-temporary';
  }
  return 'rename';
}

function buildLineIndex(text) {
  const starts = [0];
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '\n') {
      starts.push(i + 1);
    }
  }
  return starts;
}

function lineNumberFor(lineStarts, index) {
  let low = 0;
  let high = lineStarts.length - 1;
  while (low < high) {
    const mid = Math.ceil((low + high) / 2);
    if (lineStarts[mid] <= index) {
      low = mid;
    } else {
      high = mid - 1;
    }
  }
  return low + 1;
}

function lineTextFor(text, lineStarts, lineNumber) {
  const start = lineStarts[lineNumber - 1];
  const end = text.indexOf('\n', start);
  return end === -1 ? text.slice(start) : text.slice(start, end);
}

/**
 * Scan one file's contents. Overlapping matches are suppressed so a single
 * occurrence is reported once, under its most specific pattern.
 */
function auditText({ relativePath, text }) {
  if (typeof text !== 'string' || text.length === 0) {
    return [];
  }

  const lineStarts = buildLineIndex(text);
  const claimed = [];
  const findings = [];

  for (const pattern of LEGACY_PATTERNS) {
    const regex = new RegExp(pattern.regex.source, pattern.regex.flags);
    let match = regex.exec(text);

    while (match !== null) {
      const start = match.index;
      const end = start + match[0].length;
      const overlaps = claimed.some(range => start < range.end && end > range.start);

      if (!overlaps) {
        claimed.push({ start, end });
        const line = lineNumberFor(lineStarts, start);
        findings.push({
          file: toPosix(relativePath),
          line,
          column: start - lineStarts[line - 1] + 1,
          pattern: pattern.id,
          match: match[0],
          classification: classifyOccurrence({
            relativePath,
            lineText: lineTextFor(text, lineStarts, line),
          }),
        });
      }

      if (match[0].length === 0) {
        regex.lastIndex += 1;
      }
      match = regex.exec(text);
    }
  }

  return findings.sort((a, b) => a.line - b.line || a.column - b.column);
}

function walkFiles(rootDir, currentDir, acc) {
  let entries;
  try {
    entries = fs.readdirSync(currentDir, { withFileTypes: true });
  } catch {
    return acc;
  }

  for (const entry of entries) {
    if (entry.isSymbolicLink()) {
      continue;
    }
    const fullPath = path.join(currentDir, entry.name);
    if (entry.isDirectory()) {
      if (!IGNORED_DIRS.has(entry.name)) {
        walkFiles(rootDir, fullPath, acc);
      }
    } else if (entry.isFile()) {
      const relativePath = toPosix(path.relative(rootDir, fullPath));
      if (isTextFile(relativePath)) {
        acc.push({ fullPath, relativePath });
      }
    }
  }

  return acc;
}

function summarize(findings) {
  const byClassification = {};
  for (const classification of CLASSIFICATIONS) {
    byClassification[classification] = 0;
  }

  const byPattern = {};
  let actionable = 0;

  for (const finding of findings) {
    byClassification[finding.classification] = (byClassification[finding.classification] || 0) + 1;
    if (finding.pattern) {
      byPattern[finding.pattern] = (byPattern[finding.pattern] || 0) + 1;
    }
    if (!NON_ACTIONABLE.has(finding.classification)) {
      actionable += 1;
    }
  }

  return {
    total: findings.length,
    actionable,
    byClassification,
    byPattern,
  };
}

function auditTree({ root } = {}) {
  const rootDir = path.resolve(root || process.cwd());
  const files = walkFiles(rootDir, rootDir, []);
  const findings = [];

  for (const file of files) {
    let text;
    try {
      text = fs.readFileSync(file.fullPath, 'utf8');
    } catch {
      continue;
    }
    findings.push(...auditText({ relativePath: file.relativePath, text }));
  }

  findings.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line || a.column - b.column);

  return { root: rootDir, findings, summary: summarize(findings) };
}

module.exports = {
  COMPAT_MARKER,
  LEGACY_PATTERNS,
  CLASSIFICATIONS,
  ATTRIBUTION_PATHS,
  HISTORICAL_PATHS,
  COMPAT_PATHS,
  auditText,
  auditTree,
  classifyOccurrence,
  summarize,
};
