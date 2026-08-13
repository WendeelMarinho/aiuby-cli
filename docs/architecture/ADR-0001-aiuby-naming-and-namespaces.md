# ADR-0001: Aiuby Naming and Namespaces

**Date**: 2026-08-06
**Status**: accepted
**Deciders**: Wendeel Marinho

## Context

This repository is a fork of [ECC](https://github.com/affaan-m/ECC) by Affaan
Mustafa, relicensed and continued as **Aiuby AI Engineering** under MIT with dual
copyright.

The editorial layer (README, positioning, documentation, initial hero image) has
already moved to the Aiuby identity. The operational layer has not. A repository
audit on 2026-08-06 found:

| Surface | Legacy state |
|---|---|
| Environment variables | 108 distinct `ECC_*` names; zero `AIUBY_*` |
| Upstream repo links | 229 occurrences of `affaan-m/ECC` |
| Upstream personal contacts | 136 occurrences (`x.com/affaan`, `@affaan`, `affaanmustafa`) |
| Legacy domain | 86 occurrences of `ecc.tools` |
| State directories | `.ecc` referenced across 15 files |
| Plugin manifests | `"name": "ecc"` in all four marketplace/plugin manifests |
| Rust crate | `ecc-tui`, authored to the upstream maintainer |
| CLI binaries | `aiuby*` and `ecc*` both published, with **no deprecation notice** |

The last row is the most dangerous: `package.json` already ships five `aiuby-*`
binaries alongside five `ecc-*` binaries, silently. Existing users have no signal
that the `ecc*` entrypoints are on a removal path.

Renaming 108 environment variables, the state directory, and the plugin
namespaces without a frozen contract would produce inconsistent partial renames
across 1400+ files, break existing installations, and risk stripping attribution
the MIT license requires us to preserve.

This ADR freezes the naming contract so that every subsequent migration phase has
a single normative reference.

## Decision

### 1. Canonical names

| Element | Name | Notes |
|---|---|---|
| Brand | `AIUBY` | Uppercase in display contexts |
| Product | Aiuby AI Engineering | Full product name |
| Category | Sistema Operacional de Engenharia | Positioning line |
| Repository | `WendeelMarinho/aiuby-cli` | **Retained** — already referenced in `package.json` |
| npm package | `aiuby` | Verified available on npm 2026-08-06 |
| CLI binary | `aiuby` | Primary entrypoint: `aiuby doctor`, `aiuby install`, … |
| Auxiliary binaries | `aiuby-install`, `aiuby-control-pane`, `aiuby-memory-mcp`, `aiuby-plan-canvas` | Already published |
| User directory | `~/.aiuby/` | |
| Project directory | `.aiuby/` | |
| Environment variables | `AIUBY_*` | 1:1 rename of the 108 `ECC_*` names |
| Configuration | `.aiuby/config.json` | |
| Memory root | `.aiuby/memory/` | |
| Memory format ID | `aiuby.memory.v1` | Migrated from `ecc.memory.v1` |
| Plugin namespace | `aiuby` | Replaces `CLAUDE_ECC_NAMESPACE = 'ecc'` |
| Claude plugin ref | `aiuby@aiuby` | marketplace `aiuby`, plugin `aiuby` |
| Rust crate | `aiuby-tui` | Replaces `ecc-tui` |
| Python dashboard module | `aiuby_dashboard` | Replaces `ecc_dashboard` |
| Container image | `ghcr.io/WendeelMarinho/aiuby-cli` | Follows the repository owner |
| Website | `https://aiuby.com` | Replaces `ecc.tools` |
| GitHub | `https://github.com/WendeelMarinho/aiuby-cli` | |
| Instagram | `https://instagram.com/aiuby.ai` | |
| User-agent | `aiuby/<version>` | |

`aiuby-cli` and `@aiuby/cli` are also available on npm and are **reserved**;
they are not the shipping name. The package ships as `aiuby`, matching the
binary, so `npm install -g aiuby` and `aiuby <command>` use one word instead
of two names the operator has to keep straight.

The repository stays `WendeelMarinho/aiuby-cli`. Repository name and package
name are independent, and renaming the repository would invalidate every
existing link for no gain.

### 2. Skill and script renames

| Legacy | Canonical |
|---|---|
| `skills/configure-ecc/` | `skills/configure-aiuby/` |
| `skills/ecc-guide/` | `skills/aiuby-guide/` |
| `skills/ecc-recipes/` | `skills/aiuby-recipes/` |
| `skills/ecc-tools-cost-audit/` | `skills/aiuby-cost-audit/` |
| `scripts/ecc.js` | `scripts/aiuby.js` |
| `scripts/sync-ecc-to-codex.sh` | `scripts/sync-aiuby-to-codex.sh` |
| `scripts/lib/resolve-ecc-root.js` | `scripts/lib/resolve-aiuby-root.js` |
| `scripts/lib/ecc_dashboard_runtime.py` | `scripts/lib/aiuby_dashboard_runtime.py` |
| `ecc_dashboard.py` | `aiuby_dashboard.py` |
| `plugins/ecc/` | `plugins/aiuby/` |
| `assets/ecc-icon.svg` | `assets/aiuby-icon.png` |
| `docs/design/ecc-memory-vault.md` | `docs/design/aiuby-memory-vault.md` |

### 3. Harness vs. install target

The README claims "7 harnesses". The registry in
`scripts/lib/install-targets/registry.js` declares **14 install target adapters**
covering **13 distinct harnesses** (`claude` has both a home and a project
adapter).

This ADR fixes the vocabulary:

- **Harness** — a distinct agent tool Aiuby installs into. There are **13**:
  Claude Code, Cursor, Antigravity, Codex, Gemini, Hermes, OpenCode, OpenClaw,
  CodeBuddy, JoyCode, Kimi, Qwen, Zed.
- **Install target** — an adapter, i.e. one (harness, scope) pair. There are
**14**: the 13 above plus `claude-project` alongside `claude-home`.

Public copy states the **harness** count. The "7 harnesses" figure is retired.
Both counts become machine-generated in the counts phase; neither is hand-written
again.

### 4. Compatibility policy

Compatibility is expressed in **versions, not dates**, because users upgrade on
their own schedule and a date-based window silently expires for anyone who is
behind.

| Stage | Versions | Behavior |
|---|---|---|
| Dual support | all `0.x` | `ecc*` binaries, `ECC_*` variables, `~/.ecc/` and `.ecc/` all work. Each emits a deprecation notice once per process. |
| Removal | `1.0.0` | Legacy entrypoints, variables, and path fallbacks are deleted. `aiuby migrate` remains for one further minor series. |

Precedence when both forms are present: **the Aiuby form always wins**, and the
legacy form is ignored without error.

Deprecation notices go to `stderr`, never `stdout`, so piped and `--json` output
stays machine-parseable.

Standard notice text:

```
The `ecc` command is deprecated. Use `aiuby <command>`.
Compatibility support will be removed in 1.0.0.
```

### 5. Legacy allowlist — where "ECC" and upstream references remain permanently

The goal is to remove ECC from the **public and operational identity**, not to
erase the open-source origin. The following surfaces keep upstream references
indefinitely and are exempt from the legacy-name audit:

| Path | Reason |
|---|---|
| `LICENSE` | MIT attribution — legally required |
| `NOTICE` | Formal attribution notice |
| `UPSTREAM.md` | Fork history and divergence record |
| `docs/migration/**` | Migration guide must name the thing being migrated from |
| `CHANGELOG.md` entries predating the rebrand | Historical accuracy |
| `docs/releases/**` | Frozen evidence of releases shipped under the ECC name |
| `docs/architecture/ADR-0001-*` | This document |
| `.claude/plans/**` | Migration planning artifacts, not shipped |
| Lines explicitly marked `aiuby:compat` | Deliberate bridge, removed at `1.0.0` |

Everywhere else — help text, error messages, plugin manifests, issue templates,
support links, telemetry, READMEs, translations — upstream personal contacts
(`x.com/affaan`, `@affaan`, `me@affaanmustafa.com`), the legacy domain
(`ecc.tools`), and operational links to `affaan-m/ECC` are **removed**.

Attribution to the upstream project is preserved as *project* attribution
(`LICENSE`, `NOTICE`, `UPSTREAM.md`), not as *contact* or *support* routing.

### 5a. Environment variables are bridged, not blind-renamed

A mechanical `ECC_* -> AIUBY_*` rewrite across the 66 source files was attempted
and **reverted**: it broke 137 tests. The failure is structural, not cosmetic.

Roughly 66 scripts are directly invocable entrypoints — hooks in particular are
spawned by the harness without passing through `scripts/hooks/run-with-flags.js`.
Rewriting their reads to `AIUBY_*` means an operator who still exports `ECC_*`
silently loses the setting in exactly those processes, which is the compatibility
guarantee §4 promises.

The rule that follows:

- **Source may read `AIUBY_*` only through `getEnv()`**, which falls back to the
  legacy name. A bare `process.env.AIUBY_*` read in a directly-invocable script is
  a compatibility bug.
- `bootstrapEnv()` promotes legacy names in place and is called at the CLI entry
  and the hook wrapper. It is a convenience for code below those entrypoints, not
  a license to blind-rename.
- Removing `ECC_*` from source is therefore **not** a mechanical pass. It happens
  per call site, each swapped to `getEnv()`, and it lands after the `1.0.0`
  removal — not before.

Consequence: the `env-var` count in the legacy-name audit stays high through
`0.x` **by design**. It is not a measure of migration progress.

### 6. Ordering constraint

**The compatibility layer ships before any rename.** No phase may rename an
environment variable, path, or binary until the resolver that reads both forms is
merged and tested. This is a hard constraint, not a preference: hooks in this
repository `exit 0` on error by design, so a missed variable rename fails
silently rather than loudly.

## Alternatives Considered

### Alternative 1: Blind `ecc` → `aiuby` substitution

Rejected. The audit surfaces ~1417 files containing `ecc` case-insensitively,
including Portuguese prose false positives, upstream attribution that must
survive, and test fixtures asserting on legacy names. A global substitution would
break scripts, invalidate published installations, and strip required attribution
in a single unreviewable commit.

### Alternative 2: `@aiuby/cli` scoped package

Rejected for this cycle. It requires creating and verifying an npm organization
before anything can publish, adding an external blocker to the critical path.
`aiuby` is already the package identity, is verified available, and the
scoped name stays reserved for a future move.

### Alternative 3: Date-based compatibility window

Rejected. Users on old versions never observe a calendar deadline. Version-gated
removal is observable from the artifact the user actually has installed.

### Alternative 4: Migrate to an `aiuby/` GitHub organization now

Deferred. It would invalidate 229 existing links plus published install
instructions mid-migration. `WendeelMarinho/aiuby-cli` is already consistent with
`package.json`, and an organization move is a clean separate change once the
naming migration is complete.

## Consequences

### Positive

- Every subsequent phase has one normative reference; no per-file judgment calls.
- The audit script can be written against a machine-readable allowlist, turning
  "is the rebranding done?" into a CI check rather than an opinion.
- Existing installations keep working through the entire `0.x` series.
- Attribution is preserved deliberately and auditably rather than by accident.

### Negative

- Dual-path resolution adds indirection to environment variable and path lookup
  until `1.0.0`.
- The 108-variable rename touches nearly every script in the repository.
- Translated documentation (12 locales) must be updated in lockstep or it drifts.

### Risks

- **Silent hook breakage** — hooks `exit 0` on error, so a missed rename does not
  surface. Mitigated by the ordering constraint in §6 plus a test that enumerates
  every `ECC_*` name in the repository and asserts resolver coverage.
- **Over-removal of attribution** — mitigated by creating `NOTICE` and
  `UPSTREAM.md` *before* pruning any `affaan-m/ECC` reference.
- **State loss during migration** — mitigated by `aiuby migrate` defaulting to
  dry-run, requiring an explicit `--apply`, and taking a timestamped backup before
  any write.
- **Sentinel coupling** — `scripts/lib/resolve-ecc-root.js:28` documents a
  sentinel tied to a skill name. The rename must move the sentinel with it.

## Implementation Reference

The phased execution plan derived from this ADR lives at
`.claude/plans/rebranding-ecc-to-aiuby.plan.md`.
