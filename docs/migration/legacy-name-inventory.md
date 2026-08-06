# Legacy Name Inventory

**Generated**: 2026-08-06 · baseline commit of the ECC → Aiuby migration
**Contract**: [ADR-0001 — Aiuby Naming and Namespaces](../architecture/ADR-0001-aiuby-naming-and-namespaces.md)
**Tool**: `npm run audit:legacy-names`

This is the impact map for the rebranding. It is generated, not hand-maintained —
regenerate it with the audit command rather than editing counts by hand.

## Baseline

| Metric | Count |
|---|---|
| Total occurrences | **7873** |
| Actionable (`rename` + `test-fixture`) | **7080** |
| Distinct files with actionable findings | **1385** |
| Distinct `ECC_*` environment variables | **105** |

The actionable count is recorded in `legacy-name-baseline.json` and enforced by
`npm run audit:legacy-names:strict`. The budget **ratchets down only** — the tool
refuses to record a higher number.

## By classification

| Classification | Count | Action |
|---|---|---|
| `rename` | 5850 | Must become the Aiuby equivalent |
| `test-fixture` | 1230 | Updated alongside the rename it asserts on |
| `historical-doc` | 782 | Stays — accurate record of the past |
| `compat-temporary` | 9 | Deliberate bridge; drops to 0 at `1.0.0` |
| `upstream-attribution` | 2 | Stays — MIT attribution |

## By pattern

| Pattern | Count | What it is | Target |
|---|---|---|---|
| `legacy-command` | 4424 | Bare `ecc` token — CLI invocations, plugin IDs, prose | `aiuby` |
| `env-var` | 1100 | `ECC_*` environment variables (105 distinct) | `AIUBY_*` |
| `legacy-artifact` | 795 | `ecc2`, `ecc-tui`, `ecc_dashboard`, `ecc-icon`, `ecc-agentshield` | `aiuby*` equivalents |
| `upstream-contact` | 656 | `affaanmustafa`, `x.com/affaan*`, `@affaan*` | Removed outside the allowlist |
| `legacy-binary` | 310 | `ecc-install`, `ecc-control-pane`, `ecc-memory-mcp`, `ecc-plan-canvas` | `aiuby-*` |
| `upstream-repo` | 278 | `affaan-m/ECC` | `WendeelMarinho/aiuby-cli`, except in attribution files |
| `legacy-plugin-ref` | 159 | `ecc@ecc` | `aiuby@aiuby` |
| `legacy-domain` | 109 | `ecc.tools` | `aiuby.com` |
| `legacy-state-dir` | 42 | `.ecc` paths | `.aiuby` |

> The `legacy-binary` pattern was added after the first baseline. The
> `legacy-command` lookahead excludes `-`, so the four published `ecc-*`
> entrypoints were invisible to the original scan — 310 occurrences under-reported.

## Known scanner limitation

The audit scans **file contents, not file names**. Legacy-named files
(`scripts/ecc.js`, `scripts/sync-ecc-to-codex.sh`, `ecc_dashboard.py`,
`skills/ecc-guide/`) are tracked in ADR-0001 §2 instead, and their renames land
in Phase 4.

## Actionable findings by area

| Area | Count | Phase | Notes |
|---|---|---|---|
| `docs/` | 2812 | 7 | Dominated by the 12 translated READMEs |
| `tests/` | 1062 | 2–5 | Follows each rename; not independent work |
| `scripts/` | 706 | 4 | The runtime core — gated behind Phase 2 |
| `ecc2/` | 566 | 4 | Rust crate `ecc-tui` → `aiuby-tui` |
| `skills/` | 519 | 4 | Includes the 4 skill directory renames |
| root files | 258 | 5, 7 | `README.md`, `AGENTS.md`, `RULES.md`, manifests |
| `.opencode/` | 117 | 5 | Harness adapter surface |
| `commands/` | 95 | 4 | Command frontmatter and examples |
| `hooks/` | 90 | 2, 4 | `hooks.json` carries 73 alone — highest silent-failure risk |
| `.agents/`, `.claude/`, `.kiro/`, `.cursor/` | 217 | 5 | Per-harness plugin manifests |
| `.github/` | 38 | 7 | Workflows, templates, CODEOWNERS |
| `workflows/`, `examples/` | 53 | 7 | Documentation surfaces |

## Highest-density files

| Count | File | Phase |
|---|---|---|
| 249 | `ecc2/src/main.rs` | 4 |
| 159 | `ecc2/src/tui/dashboard.rs` | 4 |
| 150 | `docs/es/README.md` | 7 |
| 138 | `docs/de-DE/README.md` | 7 |
| 134 | `docs/ru/README.md` | 7 |
| 96 | `docs/zh-CN/README.md` | 7 |
| 80 | `docs/ECC-2.0-GA-ROADMAP.md` | 7 |
| 76 | `README.zh-CN.md` | 7 |
| 75 | `tests/hooks/mcp-health-check.test.js` | 2 |
| 73 | `hooks/hooks.json` | 2 |
| 67 | `scripts/sync-ecc-to-codex.sh` | 4 |
| 52 | `docs/ko-KR/README.md` | 7 |
| 49 | `ecc2/src/session/manager.rs` | 4 |

## Classification rules

Applied in this order — the first match wins:

1. Path in `LICENSE`, `NOTICE`, `UPSTREAM.md` → **`upstream-attribution`**
2. Path under `CHANGELOG.md`, `docs/migration/`, `docs/releases/`, `.claude/plans/`, or ADR-0001 → **`historical-doc`**
3. Path under `tests/` → **`test-fixture`**
4. Line contains the marker `aiuby:compat` → **`compat-temporary`**
5. Everything else → **`rename`**

Allowlisted paths deliberately outrank the compat marker, so a stray marker
cannot reclassify an attribution file.

## Known false-positive guards

The patterns are anchored to avoid matching:

- `ecc` inside ordinary words (`necessidade`, `recce`) — relevant because six of
  the twelve translated READMEs are in Romance languages
- The Aiuby replacements themselves (`aiuby`, `AIUBY_*`, `aiuby.com`)
- Unrelated container images (`ghcr.io/org/myapp`)

Overlapping matches are reported once, under the most specific pattern, so
`affaan-m/ECC` counts as `upstream-repo` rather than also as `upstream-contact`.

## Usage

```bash
npm run audit:legacy-names                                  # human-readable report
npm run audit:legacy-names:strict                           # CI gate against the baseline
node scripts/ci/audit-legacy-names.js --json                # machine-readable
node scripts/ci/audit-legacy-names.js --pattern env-var     # one pattern
node scripts/ci/audit-legacy-names.js --classification rename --limit 200
node scripts/ci/audit-legacy-names.js --write-baseline      # after a phase lands
```
