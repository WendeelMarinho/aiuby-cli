# Using Aiuby

Aiuby installs a curated catalog of agents, skills, commands, rules, and hooks
into the AI coding tool you already use. This guide covers the whole loop:
choosing what to install, installing it, verifying it, and removing it.

If you only read one section, read [The two command surfaces](#the-two-command-surfaces).
Nearly every question about Aiuby turns out to be a confusion between them.

---

## The two command surfaces

Aiuby gives you commands in two different places. They are not the same thing
and they are not invoked the same way.

| | **CLI commands** | **Slash commands** |
|---|---|---|
| Where you type them | Your terminal | Inside the agent (Claude Code, Cursor, …) |
| How they look | `aiuby doctor` | `/tdd` |
| What they do | Install, diagnose, repair the catalog | Do actual engineering work |
| How many | 21 | 94 |
| Where they come from | The `aiuby` npm package | Copied into your harness by `aiuby install` |

The CLI is the installer and the maintenance tool. The slash commands are the
product. You run the CLI once in a while; you use the slash commands every day.

The same split applies to the rest of the catalog: **67 agents**, **281 skills**,
and **94 commands** — 442 components in total — all installed by the CLI, all
used from inside the agent.

---

## Installing

There are three install paths. Pick **one**. Stacking them is the most common
broken setup, because the plugin and the installer both write the same
components and you end up with duplicate skills and duplicate hook runs.

### Path 1 — Claude Code plugin (recommended for Claude Code)

```
/plugin marketplace add https://github.com/WendeelMarinho/aiuby-cli
/plugin install aiuby@aiuby
```

Nothing else to run. Do **not** follow this with `install.sh` or
`aiuby install --profile full`.

### Path 2 — npm

```bash
npm install -g aiuby
aiuby install --profile core --target claude
```

You can also run it without installing globally:

```bash
npx aiuby consult "security reviews"
npx -p aiuby aiuby-install --profile minimal --target claude
```

Note the `-p` in the second one. `aiuby-install` is a binary *inside* the
`aiuby` package, not a package of its own — `npx aiuby-install` would try to
fetch a package by that name and fail.

### Path 3 — from a clone

```bash
git clone https://github.com/WendeelMarinho/aiuby-cli
cd aiuby-cli
./install.sh --profile core --target claude     # Windows: .\install.ps1
```

Use this when you want to modify the catalog before installing it.

---

## Choosing what to install

Installing everything is rarely what you want. Every component you install
consumes context budget in every session, so a larger profile is a real cost,
not just a larger download.

### Ask first

```bash
aiuby consult "security reviews"
aiuby consult "mlops training model deployment"
```

`consult` takes plain language and recommends the profile and components that
fit. Run it before you install, not after.

### Browse the catalog

```bash
aiuby catalog profiles                        # the 7 profiles
aiuby catalog components --family language    # components by family
aiuby catalog show framework:nextjs           # one component in detail
```

### Preview without touching disk

```bash
aiuby plan --profile core --target cursor
aiuby install --profile core --target claude --dry-run
```

`plan` resolves the manifest and shows what *would* be written. `--dry-run`
works on any command that writes.

### The profiles

| Profile | Modules | For |
|---|---|---|
| `minimal` | 5 | Low-context Claude Code setup. No hook runtime. |
| `opencode` | 3 | Default OpenCode setup. Excludes hooks-runtime by default. |
| `core` | 6 | Baseline for any harness: commands, hooks, platform configs. |
| `developer` | 9 | Default engineering profile for app codebases. |
| `security` | 7 | Security-focused guidance on a baseline runtime. |
| `research` | 9 | Investigation, synthesis, and publishing workflows. |
| `full` | 25 | Everything currently classified. |

Add individual components on top of a profile:

```bash
aiuby install --profile minimal --target claude --with capability:machine-learning
```

---

## Supported harnesses

Aiuby installs into **13 harnesses** through **14 install target adapters**
(Claude Code has both a home-scoped and a project-scoped adapter).

```
claude-home        claude-project     cursor-project     antigravity-project
codex-home         gemini-project     hermes-home        opencode-home
openclaw-home      codebuddy-project  joycode-project    kimi-project
qwen-home          zed-project
```

`--target claude` resolves to `claude-home`. Use the full adapter id when you
want the project-scoped install instead.

The same source content is mechanically adapted per harness. Gemini gets its
tool vocabulary translated (`Read` becomes `read_file`, `Bash` becomes
`run_shell_command`); Cursor gets `.md` converted to `.mdc` with agents
prefixed `aiuby-*`; six harnesses get nested rule directories flattened. You
maintain one catalog, not thirteen.

---

## The CLI, by task

### Install and inspect

| Command | What it does |
|---|---|
| `aiuby install` | Install content into a target |
| `aiuby plan` | Resolve manifests and show the plan |
| `aiuby catalog` | Discover profiles and component ids |
| `aiuby consult` | Recommend components from plain language |
| `aiuby list-installed` | Show install-state for the current context |
| `aiuby uninstall` | Remove files recorded in install-state |

### Keep it healthy

| Command | What it does |
|---|---|
| `aiuby doctor` | Report missing or drifted managed files |
| `aiuby repair` | Restore drifted or missing files |
| `aiuby auto-update` | Pull latest and reinstall managed targets |
| `aiuby migrate` | Move a legacy ECC install to Aiuby |
| `aiuby status` | State store status summary |

### Sessions and memory

| Command | What it does |
|---|---|
| `aiuby memory` | Share durable context across harnesses |
| `aiuby sessions` | List or inspect sessions |
| `aiuby session-inspect` | Snapshot a dmux or Claude history target |
| `aiuby work-items` | Track Linear, GitHub, handoff, manual items |
| `aiuby loop-status` | Find stale loop wakeups and pending tool results |

### Operate

| Command | What it does |
|---|---|
| `aiuby control-pane` | Local operator control pane |
| `aiuby platform-audit` | Audit queues, discussions, roadmap, release, security |
| `aiuby security-ioc-scan` | Scan for active supply-chain IOCs |
| `aiuby feedback` | Shortest path to report a problem |
| `aiuby ito` | Invoke the separately installed Itô compute CLI |

Every command takes `--help`:

```bash
aiuby help install
aiuby install --help
```

### One behavior worth knowing

**Without a recognized command, arguments are routed to `install`.** That is
what makes the shorthand work:

```bash
aiuby typescript        # same as: aiuby install typescript
```

It also means a typo that happens to match an installable component will
install it rather than error. A typo that matches nothing gives you
`Error: Unknown command`. There are no abbreviations — `aiuby w` is not
`aiuby work-items`.

---

## Verifying an install

```bash
aiuby --version
aiuby list-installed --json
aiuby doctor
aiuby doctor --target cursor
```

`doctor` compares what is on disk against the install-state file Aiuby wrote
during install. If it reports drift you did not cause, run `aiuby repair
--dry-run` first and read the plan before applying it.

---

## Uninstalling

```bash
aiuby uninstall --target claude --dry-run
aiuby uninstall --target claude
```

Uninstall only removes files recorded in install-state. Anything you wrote
yourself is left alone — that is the guarantee, and it is why the install-state
file matters.

If you installed via the Claude Code plugin, remove it through
`/plugin uninstall` instead.

---

## Configuration

### State directories

| Path | Holds |
|---|---|
| `~/.aiuby/` | User-scoped state, memory, install-state |
| `.aiuby/` | Project-scoped state and memory |

If you are coming from ECC, `~/.ecc/` and `.ecc/` are still read during the
entire `0.x` series. Aiuby prints a one-line notice to stderr when it falls
back to one. Move them with:

```bash
aiuby migrate              # dry run, shows what would move
aiuby migrate --apply      # takes a timestamped backup first
aiuby migrate --list-backups
```

### Environment variables

| Variable | Effect |
|---|---|
| `AIUBY_DRY_RUN=1` | Preview without writing |
| `AIUBY_HOOK_PROFILE` | `minimal` \| `standard` \| `strict` |
| `AIUBY_DISABLED_HOOKS` | Comma-separated hook ids to skip |
| `AIUBY_AGENT_DATA_HOME` | Override the agent data root |

The matching `ECC_*` names still work through `0.x`. When both are set, the
`AIUBY_*` form wins and the legacy one is ignored without error.

---

## Compatibility with ECC

Aiuby is a fork of [ECC](https://github.com/affaan-m/ECC) by Affaan Mustafa,
relicensed and continued under MIT with dual copyright. See `NOTICE` and
`UPSTREAM.md`.

Through every `0.x` release, the legacy surfaces keep working:

- the `ecc`, `ecc-install`, `ecc-control-pane`, `ecc-memory-mcp`, and
  `ecc-plan-canvas` binaries
- `ECC_*` environment variables
- `~/.ecc/` and `.ecc/` state directories

Each emits a deprecation notice **once per process, to stderr only**, so piped
and `--json` output stays machine-parseable.

**All of it is removed in `1.0.0`.** `aiuby migrate` stays for one further
minor series after that. Migrate before you upgrade to `1.0.0`, not after.

Full details: [MIGRATION-1X-TO-2.0.md](./MIGRATION-1X-TO-2.0.md).

---

## Troubleshooting

**`Error: Unknown command: <x>`** — not a command, and not an installable
component either. Check `aiuby --help` for the 21 names; there are no
abbreviations.

**Duplicate skills, or hooks running twice** — you stacked install paths. Pick
one, then `aiuby uninstall --target <t>` the other and reinstall.

**`npx aiuby-install` fails with a 404** — that is a binary, not a package. Use
`npx -p aiuby aiuby-install`.

**A deprecation notice on every command** — you still have `~/.ecc/` or
`ECC_*` exported. Run `aiuby migrate`.

**`doctor` reports drift you did not cause** — run `aiuby repair --dry-run`
and read the plan before applying. Do not apply a repair you do not understand.

More: [TROUBLESHOOTING.md](../TROUBLESHOOTING.md).

---

## Where to go next

| Document | Covers |
|---|---|
| [README.md](../README.md) | Overview and the full component catalog |
| [SELECTIVE-INSTALL-ARCHITECTURE.md](./SELECTIVE-INSTALL-ARCHITECTURE.md) | How profiles, modules, and adapters resolve |
| [token-optimization.md](./token-optimization.md) | Keeping context budget under control |
| [MIGRATION-1X-TO-2.0.md](./MIGRATION-1X-TO-2.0.md) | Upgrading from a 1.x install |
| [TROUBLESHOOTING.md](../TROUBLESHOOTING.md) | Symptom-first diagnosis |
| [CONTRIBUTING.md](../CONTRIBUTING.md) | Adding agents, skills, commands, rules |
