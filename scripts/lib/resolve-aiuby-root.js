'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');

// A plugin rename cannot be shimmed: the slug is a directory name the harness
// creates at install time. The established pattern here is to PREPEND the new
// slug and keep the old ones, so an operator who has not reinstalled still
// resolves. `everything-claude-code` was handled this way when it became `ecc`;
// `ecc` now joins it as deprecated. Both go away at 1.0.0. aiuby:compat
const CURRENT_PLUGIN_SLUG = 'aiuby';
const DEPRECATED_PLUGIN_SLUGS = ['ecc', 'everything-claude-code'];
const handleFor = slug => `${slug}@${slug}`;
const rootSegmentsFor = slug => [[slug], [handleFor(slug)], ['marketplaces', slug]];

const PLUGIN_CACHE_SLUGS = [CURRENT_PLUGIN_SLUG, ...DEPRECATED_PLUGIN_SLUGS];
const PLUGIN_ROOT_SEGMENTS = PLUGIN_CACHE_SLUGS.flatMap(rootSegmentsFor);

// Artifacts that identify a COMPLETE ECC root when the caller gives no explicit
// probe. A real ECC root ships both the script tree AND ECC's skills; a partial
// install (scripts copied, skills not) must not qualify for skill-resolving
// callers, which build `skills/...` paths against the resolved root (#2544).
// Checking "skills/ exists" is not enough — a user's own ~/.claude/skills/ can
// be present with none of ECC's skills — so we probe for a sentinel skill that
// ships in every ECC root and is exactly what the failing skill commands need.
// If that skill is ever renamed, move this sentinel with it.
const DEFAULT_SCRIPT_PROBE = path.join('scripts', 'lib', 'utils.js');
const DEFAULT_SKILL_PROBE = path.join('skills', 'continuous-learning-v2');

/**
 * Resolve the ECC source root directory.
 *
 * Tries, in order:
 *   1. CLAUDE_PLUGIN_ROOT env var (set by Claude Code for hooks, or by user)
 *   2. Standard install location (~/.claude/) — when scripts exist there
 *   3. Known plugin roots under ~/.claude/plugins/ (current + legacy slugs)
 *   4. Plugin cache auto-detection — scans ~/.claude/plugins/cache/{ecc,everything-claude-code}/
 *   5. Fallback to ~/.claude/ (original behaviour)
 *
 * @param {object} [options]
 * @param {string} [options.homeDir]  Override home directory (for testing)
 * @param {string} [options.envRoot]  Override CLAUDE_PLUGIN_ROOT (for testing)
 * @param {string} [options.probe]    Relative path used to verify a candidate
 *                                    root contains what the caller needs. When
 *                                    given, it is honored exactly (script
 *                                    consumers pass their own script path). When
 *                                    omitted, a candidate must contain BOTH the
 *                                    ECC script tree and a sentinel ECC skill,
 *                                    so a partial install (scripts without
 *                                    skills) is rejected for skill consumers.
 * @returns {string} Resolved ECC root path
 */
function resolveEccRoot(options = {}) {
  const envRoot = options.envRoot !== undefined
    ? options.envRoot
    : (process.env.CLAUDE_PLUGIN_ROOT || '');

  if (envRoot && envRoot.trim()) {
    return envRoot.trim();
  }

  const homeDir = options.homeDir || os.homedir();
  const claudeDir = path.join(homeDir, '.claude');

  // Decide whether a candidate directory is a usable ECC root. An explicit
  // caller probe is honored exactly (script consumers know the artifact they
  // need). With the default probe the caller is a skill consumer, so a
  // candidate must contain both ECC's scripts and a sentinel ECC skill —
  // otherwise a scripts-only ~/.claude short-circuits and every skill path
  // resolves to a location that does not exist (#2544).
  const isRoot = options.probe
    ? (dir) => fs.existsSync(path.join(dir, options.probe))
    : (dir) => fs.existsSync(path.join(dir, DEFAULT_SCRIPT_PROBE))
            && fs.existsSync(path.join(dir, DEFAULT_SKILL_PROBE));

  // Standard install — files are copied directly into ~/.claude/
  if (isRoot(claudeDir)) {
    return claudeDir;
  }

  // Exact legacy plugin install locations. These preserve backwards
  // compatibility without scanning arbitrary plugin trees.
  const legacyPluginRoots = PLUGIN_ROOT_SEGMENTS.map((segments) =>
    path.join(claudeDir, 'plugins', ...segments)
  );

  for (const candidate of legacyPluginRoots) {
    if (isRoot(candidate)) {
      return candidate;
    }
  }

  // Plugin cache — Claude Code stores marketplace plugins under
  // ~/.claude/plugins/cache/<plugin-name>/<org>/<version>/
  try {
    for (const slug of PLUGIN_CACHE_SLUGS) {
      const cacheBase = path.join(claudeDir, 'plugins', 'cache', slug);

      // Guard per slug: a missing cache directory for one slug must not abort
      // the scan for the others. Before `aiuby` led this list the first entry
      // always existed, so the outer catch masked this.
      let orgDirs;
      try {
        orgDirs = fs.readdirSync(cacheBase, { withFileTypes: true });
      } catch {
        continue;
      }

      for (const orgEntry of orgDirs) {
        if (!orgEntry.isDirectory()) continue;
        const orgPath = path.join(cacheBase, orgEntry.name);

        let versionDirs;
        try {
          versionDirs = fs.readdirSync(orgPath, { withFileTypes: true });
        } catch {
          continue;
        }

        for (const verEntry of versionDirs) {
          if (!verEntry.isDirectory()) continue;
          const candidate = path.join(orgPath, verEntry.name);
          if (isRoot(candidate)) {
            return candidate;
          }
        }
      }
    }
  } catch {
    // Plugin cache doesn't exist or isn't readable — continue to fallback
  }

  return claudeDir;
}

/**
 * Compact inline locator for embedding in hooks.json and command .md code blocks.
 *
 * Earlier revisions inlined the *entire* resolveEccRoot() search (~700 chars,
 * duplicated ~80×). That blob used a spread (`...s`) over nested array literals,
 * which broke Windows hook execution due to shell quoting (#2368).
 *
 * This minified form contains no spread, no nested array literals, and no
 * escaped double quotes, so it survives `node -e "..."` quoting on every shell.
 * When CLAUDE_PLUGIN_ROOT is set (as Claude Code does for plugin hooks and
 * commands) it is used directly. Otherwise the inline probes the same set of
 * locations resolveEccRoot() knows about — ~/.claude, the exact plugin roots
 * under ~/.claude/plugins/, and the versioned plugin cache — only far enough to
 * load the committed resolve-aiuby-root module, then delegates the authoritative
 * decision to resolveEccRoot(). This keeps discovery behaviour identical to the
 * old inline while centralising the real logic in one tested module.
 *
 * Usage in commands:
 *   const _r = <paste INLINE_RESOLVE>;
 *   const sm = require(_r + '/scripts/lib/session-manager');
 */
// Search order and cache slugs are derived from the constants above so the
// inline copy can never drift from the module's own resolution order.
const INLINE_SEARCH_LIST = PLUGIN_ROOT_SEGMENTS
  .map(segments => `'${segments.join('/')}'`)
  .join(',');
const INLINE_CACHE_LIST = PLUGIN_CACHE_SLUGS.map(slug => `'${slug}'`).join(',');

const INLINE_RESOLVE = `(function(){var p=require('path'),f=require('fs'),o=require('os');var e=process.env.CLAUDE_PLUGIN_ROOT;if(e&&e.trim())return e.trim();var d=p.join(o.homedir(),'.claude');function L(x){try{return require(p.join(x,'scripts','lib','resolve-aiuby-root')).resolveEccRoot()}catch(_){return null}}var r=L(d);if(r)return r;var s=[${INLINE_SEARCH_LIST}];for(var i=0;i<s.length;i++){r=L(p.join(d,'plugins',s[i]));if(r)return r}var g=[${INLINE_CACHE_LIST}];for(var j=0;j<g.length;j++){try{var c=p.join(d,'plugins','cache',g[j]);var O=f.readdirSync(c);for(var k=0;k<O.length;k++){var q=p.join(c,O[k]);var V=f.readdirSync(q);for(var m=0;m<V.length;m++){r=L(p.join(q,V[m]));if(r)return r}}}catch(_){}}return d})()`;

module.exports = {
  resolveEccRoot,
  INLINE_RESOLVE,
};
