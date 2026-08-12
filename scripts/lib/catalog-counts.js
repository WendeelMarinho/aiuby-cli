/**
 * Catalog counts derived from disk.
 *
 * Public copy must never hand-write these numbers. A README that claims
 * "281 skills" while the tree holds 274 is a promise the code does not keep,
 * and nothing catches it. Generating them makes drift a CI failure instead.
 *
 * Vocabulary is fixed by ADR-0001 §3:
 *   harness       a distinct agent tool Aiuby installs into
 *   install target one (harness, scope) adapter — `claude` has home and project
 */

const fs = require('fs');
const path = require('path');

const BEGIN_MARKER = '<!-- aiuby:counts:begin -->';
const END_MARKER = '<!-- aiuby:counts:end -->';

/** Not install-target adapters, despite living beside them. */
const NON_TARGET_MODULES = Object.freeze(new Set(['registry', 'helpers']));

/** Index files that live in a surface directory without being a member of it. */
const INDEX_FILENAMES = Object.freeze(new Set(['README.md', 'index.md']));

function listDir(dir) {
  try {
    return fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return [];
  }
}

function countMarkdownFiles(dir) {
  return listDir(dir).filter(entry => (
    entry.isFile()
    && entry.name.endsWith('.md')
    && !INDEX_FILENAMES.has(entry.name)
  )).length;
}

function countMarkdownFilesDeep(dir) {
  let total = 0;
  for (const entry of listDir(dir)) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      total += countMarkdownFilesDeep(fullPath);
    } else if (entry.isFile() && entry.name.endsWith('.md') && !INDEX_FILENAMES.has(entry.name)) {
      total += 1;
    }
  }
  return total;
}

/** A skill is a directory that actually ships a SKILL.md. */
function countSkills(dir) {
  return listDir(dir).filter(entry => (
    entry.isDirectory() && fs.existsSync(path.join(dir, entry.name, 'SKILL.md'))
  )).length;
}

/**
 * Adapter file names encode (harness, scope) as `<harness>-<scope>.js`.
 * Stripping the scope collapses `claude-home` and `claude-project` into one
 * harness, which is exactly the distinction ADR-0001 §3 draws.
 */
function readInstallTargets(dir) {
  const modules = listDir(dir)
    .filter(entry => entry.isFile() && entry.name.endsWith('.js'))
    .map(entry => entry.name.replace(/\.js$/, ''))
    .filter(name => !NON_TARGET_MODULES.has(name));

  const harnessNames = [...new Set(
    modules.map(name => name.replace(/-(home|project)$/, ''))
  )].sort();

  return { installTargets: modules.length, harnesses: harnessNames.length, harnessNames };
}

function computeCounts({ root } = {}) {
  const repoRoot = path.resolve(root || process.cwd());

  const agents = countMarkdownFiles(path.join(repoRoot, 'agents'));
  const skills = countSkills(path.join(repoRoot, 'skills'));
  const commands = countMarkdownFilesDeep(path.join(repoRoot, 'commands'));
  const targets = readInstallTargets(path.join(repoRoot, 'scripts', 'lib', 'install-targets'));

  return {
    agents,
    skills,
    commands,
    catalog: agents + skills + commands,
    ...targets,
  };
}

function hasMarkers(text) {
  return typeof text === 'string'
    && text.includes(BEGIN_MARKER)
    && text.includes(END_MARKER)
    && text.indexOf(BEGIN_MARKER) < text.indexOf(END_MARKER);
}

function renderTable(data) {
  return [
    '| Surface | Count |',
    '|---|---:|',
    `| Agents | ${data.agents} |`,
    `| Skills | ${data.skills} |`,
    `| Commands | ${data.commands} |`,
    `| Catalog total | ${data.catalog} |`,
    `| Harnesses | ${data.harnesses} |`,
    `| Install targets | ${data.installTargets} |`,
  ].join('\n');
}

/**
 * Replace the marked block. Documents without markers are returned unchanged,
 * so a file opts in by adding the markers rather than by being listed somewhere.
 */
function renderInto(text, data) {
  if (!hasMarkers(text)) {
    return text;
  }

  const start = text.indexOf(BEGIN_MARKER);
  const end = text.indexOf(END_MARKER);

  return [
    text.slice(0, start + BEGIN_MARKER.length),
    '\n',
    renderTable(data),
    '\n',
    text.slice(end),
  ].join('');
}

module.exports = {
  BEGIN_MARKER,
  END_MARKER,
  computeCounts,
  hasMarkers,
  renderInto,
  renderTable,
};
