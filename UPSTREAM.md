# Upstream

Aiuby AI Engineering is a fork of [ECC](https://github.com/affaan-m/ECC)
("Everything Claude Code") by Affaan Mustafa, used under the MIT license.

This file records what the fork inherited, what changed, and where the two
projects diverge. It is the companion to [NOTICE](NOTICE) and
[LICENSE](LICENSE), and it is exempt from the legacy-name audit — upstream
names are supposed to appear here.

## Relationship

Aiuby is an **independent continuation**, not a distribution channel for ECC.

- Not affiliated with, endorsed by, or supported by the ECC project.
- Support requests go to [the Aiuby repository](https://github.com/WendeelMarinho/aiuby-cli),
  never to the upstream maintainer.
- Upstream is credited as the origin of the work, not as a contact or
  escalation path.

## Commit history

The fork **does not preserve upstream commit history**. The inherited tree
entered this repository as a single squashed commit (`269ed16`, 2026-08-06).

Consequence: `git log` and `git blame` in this repository attribute inherited
lines to that squash commit, not to their original upstream authors.
Per-line provenance for anything predating the fork must be read from the
[upstream repository](https://github.com/affaan-m/ECC).

## What the fork inherited

Substantially all of the operator layer, including:

| Surface | Origin |
|---|---|
| Agents, skills, commands | Upstream |
| Hooks and the hook-profile system | Upstream |
| Rules and install manifests | Upstream |
| Selective-install engine and harness adapters | Upstream |
| Memory vault and its document format | Upstream |
| SQLite state store, session and work-item tooling | Upstream |
| Rust TUI control plane (`ecc2/`, crate `ecc-tui`) | Upstream |

## What diverged

| Change | Detail |
|---|---|
| Identity | Product, CLI, package, plugin, directories, environment variables, and schema ids renamed to Aiuby. Frozen in [ADR-0001](docs/architecture/ADR-0001-aiuby-naming-and-namespaces.md). |
| Compatibility layer | `scripts/lib/legacy-compat.js` bridges ECC-era environment variables, state directories, document schema ids, and binaries. Did not exist upstream. |
| State migrator | `aiuby migrate` (`scripts/lib/migrate-state.js`). Did not exist upstream. |
| Name audit | `npm run audit:legacy-names` with a one-way ratcheting baseline. Did not exist upstream. |
| Plugin slug | `aiuby`, with `ecc` and `everything-claude-code` retained as deprecated search paths. |
| Maintainer identity | Upstream author metadata removed from shipped manifests and the Rust crate. Attribution moved here, to `NOTICE`, and to `LICENSE`. |

Two defects found while migrating were fixed rather than carried forward:

- The plugin-cache scan aborted every remaining slug when the first slug's
  directory was missing (single `try/catch` around the whole loop).
- The audit's own pattern set missed the four published `ecc-*` auxiliary
  binaries, under-reporting by 310 occurrences.

## Where upstream names legitimately remain

Per ADR-0001 §5, these surfaces keep ECC and upstream references permanently:

- `LICENSE`, `NOTICE`, `UPSTREAM.md`
- `docs/migration/**`
- `docs/releases/**` — frozen evidence of releases shipped under the ECC name
- `CHANGELOG.md` entries predating the rebrand
- Lines explicitly marked `aiuby:compat`, which are removed at `1.0.0`

Everywhere else — help text, error messages, plugin manifests, issue
templates, support links, READMEs, translations — upstream personal contacts,
the `ecc.tools` domain, and operational links to `affaan-m/ECC` are removed.
The goal is to remove ECC from the current public and operational identity,
not to erase the open-source origin.

## Migrating an ECC installation

See [docs/migration/from-ecc-to-aiuby.md](docs/migration/from-ecc-to-aiuby.md).
