# Migrating from ECC to Aiuby

Aiuby AI Engineering is a fork of ECC. If you have an ECC installation, this
guide moves it over.

**Nothing here is urgent.** Every ECC-era name keeps working for the whole
`0.x` series. You can migrate now, later, or in stages.

The naming contract behind this guide is
[ADR-0001](../architecture/ADR-0001-aiuby-naming-and-namespaces.md); the fork
record is [UPSTREAM.md](../../UPSTREAM.md).

---

## What changed

| ECC | Aiuby | Still works during 0.x? |
|---|---|---|
| `ecc <command>` | `aiuby <command>` | Yes, with a deprecation notice |
| `ecc-install`, `ecc-control-pane`, `ecc-memory-mcp`, `ecc-plan-canvas` | `aiuby-*` | Yes, with a deprecation notice |
| `ECC_*` variables | `AIUBY_*` | Yes, silently bridged |
| `~/.ecc/` | `~/.aiuby/` | Yes, read as a fallback |
| `.ecc/` (project) | `.aiuby/` | Yes, read as a fallback |
| `ecc.memory.v1` and other `ecc.*.vN` schema ids | `aiuby.*.vN` | Yes, both accepted |
| Plugin `ecc@ecc` | `aiuby@aiuby` | Yes, both search paths kept |
| MCP label `ecc-memory-vault` | `aiuby-memory-vault` | Yes — see below |

All compatibility is removed in **`1.0.0`**. The window is expressed in
versions, not dates, so it does not expire on you while you are on an older
release.

## Do you have anything to migrate?

```bash
aiuby migrate
```

**Dry run is the default.** This command never writes. It reports what it
would move and stops. If you see `Nothing to migrate`, you are done — skip to
[Commands and variables](#commands-and-variables).

## Migrating state

```bash
aiuby migrate --apply
```

This moves `~/.ecc/` to `~/.aiuby/` and `.ecc/` to `.aiuby/`, and rewrites
`ecc.*.vN` schema ids inside the moved files to `aiuby.*.vN`.

Before the first move it writes a full backup to
`~/.aiuby-migration-backups/aiuby-migrate-<timestamp>/`, with a manifest
recording where each tree came from. The command prints the backup path and
the exact rollback command.

Files outside the ECC state directories are never touched.

### Undoing it

```bash
aiuby migrate --list-backups
aiuby migrate --rollback ~/.aiuby-migration-backups/aiuby-migrate-<timestamp>
```

Rollback restores the original bytes and removes the migrated directory. The
backup manifest carries absolute paths, so rollback works from any directory
and in any later session.

### If it refuses to run

```
Error: Migration conflict: /home/you/.aiuby already exists — resolve the
duplicate install before migrating
```

You have both an ECC and an Aiuby install. The migration **aborts entirely**
rather than migrating one scope and leaving the other — a half-migrated state
across scopes is worse than none.

Resolve it by deciding which directory is authoritative:

```bash
# Keep the Aiuby one and discard the stale ECC state
rm -rf ~/.ecc

# Or keep the ECC one: move the Aiuby directory aside, then migrate
mv ~/.aiuby ~/.aiuby.bak && aiuby migrate --apply
```

Inspect both before deleting anything. Memory documents live under
`<dir>/memory/`.

## Commands and variables

Old commands keep working and tell you the replacement:

```
$ ecc doctor
[aiuby] The `ecc` command is deprecated. Use `aiuby doctor`.
        Compatibility support will be removed in 1.0.0.
```

The notice goes to `stderr`, never `stdout`, so piped output and `--json`
stay parseable.

Environment variables are bridged automatically: `AIUBY_FOO` wins if set,
otherwise `ECC_FOO` is used. Rename them at your convenience:

```bash
# before
export ECC_HOOK_PROFILE=strict
# after
export AIUBY_HOOK_PROFILE=strict
```

To silence every deprecation notice — useful in CI once you know the state of
your install:

```bash
export AIUBY_SUPPRESS_DEPRECATIONS=1
```

## Reinstalling the plugin

A plugin slug is a directory name your harness creates at install time, so it
cannot be bridged from inside the package. Aiuby resolves `aiuby`, `ecc`, and
`everything-claude-code` install paths, which means **an existing plugin
install keeps working without action**.

To move to the Aiuby slug, remove the old plugin and install the new one
through your harness's normal plugin flow. If both are present, the `aiuby`
install wins.

## MCP server

The label changed from `ecc-memory-vault` to `aiuby-memory-vault` in the
config template shipped at `mcp-configs/mcp-servers.json`.

**No action is required.** An MCP server name in a client config is a local
label pointing at a command, not a protocol identifier. Your existing
`ecc-memory-vault` entry keeps working. Rename the key if you want the
config to match current docs.

## Uninstalling

```bash
aiuby uninstall --target <target> --dry-run
```

Uninstall removes only files recorded in install-state. It does not remove
your memory vault, your configuration, or anything you authored.

## Verifying

```bash
aiuby doctor          # reports missing or drifted managed files
aiuby repair --dry-run
aiuby status
```

## Reference

| Old | New |
|---|---|
| `ecc install` | `aiuby install` |
| `ecc doctor` | `aiuby doctor` |
| `ecc repair` | `aiuby repair` |
| `ecc status` | `aiuby status` |
| `ecc memory …` | `aiuby memory …` |
| `ecc uninstall` | `aiuby uninstall` |
| `ecc plan` / `catalog` / `consult` | `aiuby plan` / `catalog` / `consult` |
| `ecc sessions` / `work-items` / `loop-status` | `aiuby sessions` / `work-items` / `loop-status` |
| — | `aiuby migrate` *(new)* |

Run `aiuby --help` for the full command list.

## Getting help

Report problems at
[github.com/WendeelMarinho/aiuby-cli/issues](https://github.com/WendeelMarinho/aiuby-cli/issues).

Do not send Aiuby issues to the upstream ECC project — see
[UPSTREAM.md](../../UPSTREAM.md).
