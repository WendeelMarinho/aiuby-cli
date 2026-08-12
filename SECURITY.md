# Security Policy

## Supported Versions

| Version | Supported |
| --- | --- |
| 0.1.x | :white_check_mark: |

Aiuby is pre-1.0. Security fixes land on `main` and ship in the next release;
there are no backport branches yet.

Reports about **ECC**, the upstream project Aiuby forked from, belong to
[that project's security policy](https://github.com/affaan-m/ECC/security),
not here. See [UPSTREAM.md](UPSTREAM.md).

## Reporting a Vulnerability

Use GitHub private vulnerability reporting — it reaches the maintainer directly:

- <https://github.com/WendeelMarinho/aiuby-cli/security/advisories/new>

You can also email **<wendeelmarinho@gmail.com>**.

Do **not** open a public GitHub issue for security vulnerabilities.

Include:

- affected file, package, version, commit, and install path
- steps to reproduce from a clean checkout
- expected impact and affected trust boundary
- whether exploitation requires local shell access, a malicious repo, a malicious package, a remote unauthenticated actor, or maintainer credentials
- any PoC logs with tokens, keys, local paths, and private data redacted

Expected response:

- **Acknowledgment:** within 48 hours
- **Initial assessment:** within 7 days
- **Critical fix or mitigation target:** within 14 days when the report affects a supported release and crosses a real trust boundary
- **Coordinated disclosure:** before public advisory publication

If a report is declined, we will explain whether it is not reproducible, out of scope, already fixed, or needs a stronger attack path.

## Scope

This policy covers:

- the `WendeelMarinho/aiuby-cli` repository
- the `aiuby-cli` npm package
- Aiuby plugin, install, repair, dashboard, hook, rule, skill, MCP, and command surfaces shipped from this repository
- GitHub Actions workflows and release automation in this repository
- the compatibility layer and state migrator (`aiuby migrate`), including backup and rollback behavior

## Official Distribution Surfaces

Official Aiuby surfaces are:

- GitHub repo: <https://github.com/WendeelMarinho/aiuby-cli>
- npm package: `aiuby-cli`
- CLI binary: `aiuby`
- marketplace/plugin slug: `aiuby@aiuby`
- website: <https://aiuby.com>

The deprecated `ecc`, `ecc-install`, `ecc-control-pane`, `ecc-memory-mcp`, and
`ecc-plan-canvas` binaries ship from the same `aiuby-cli` package during `0.x`
and are removed at `1.0.0`. They are official; anything else bearing the ECC
name is not ours.

Treat any package not listed above as unofficial until verified. Aiuby is not
distributed on npm under any other name, is not published as a Go module, and
does not operate a GitHub App.

Packages and surfaces carrying the **ECC** name belong to the upstream project
and are outside this policy. For their official distribution list, see
[the upstream repository](https://github.com/affaan-m/ECC).

## Out of Scope

Reports are usually out of scope when they only show:

- local command execution where the user already controls the local shell and no higher-privilege trust boundary is crossed
- screenshots, stale line numbers, or reports against the upstream ECC repository that do not reproduce on current `WendeelMarinho/aiuby-cli`
- self-XSS or social engineering with no repository-controlled exploit path
- dependency graph/package metadata confusion without an install path to an official Aiuby package
- vulnerabilities in third-party packages unless Aiuby pins, installs, or executes them in a way that creates extra impact

Local developer tools can still be valid security issues when untrusted repository content, package installation, generated hooks, or CI automation can trigger execution without clear user intent. Show that trust boundary in the report.

## Supply-Chain Rules

Aiuby treats supply-chain exposure as a first-class security surface.

- GitHub Actions must use pinned commit SHAs for third-party actions.
- Workflows must avoid shelling untrusted GitHub context directly into `run:` blocks.
- Release and install docs must point only to official packages.
- Package metadata should point at `WendeelMarinho/aiuby-cli`, not historical repo paths.
- Private vulnerability reports are triaged privately before public disclosure.
- Security advisories are published only when a supported release is affected and coordinated disclosure is appropriate.

## Operational Guidance

### Secrets Handling

`mcp-configs/mcp-servers.json` is a **template**. All `YOUR_*_HERE` values must be replaced at install time from env-vars or a secrets manager. Never commit real credentials. If a secret is accidentally committed, rotate it immediately and rewrite history. Do not rely on a plain revert.

The same rule applies to user-scope Claude Code config (`~/.claude/settings.json` or `%USERPROFILE%\.claude\settings.json`). That file is outside this repository, but it is commonly shared through `claude doctor` output, screenshots, and bug reports. Do not hardcode PATs, API keys, or OAuth tokens into `mcpServers[*].env` blocks. Resolve them at spawn time from the OS keychain or env-vars your MCP server already supports.

Quick audit:

```bash
# macOS / Linux
grep -EnH '(TOKEN|SECRET|KEY|PASSWORD)\s*"\s*:\s*"[A-Za-z0-9_-]{16,}"' ~/.claude/settings.json

# Windows PowerShell
Select-String -Path "$env:USERPROFILE\.claude\settings.json" -Pattern '(TOKEN|SECRET|KEY|PASSWORD)"\s*:\s*"[A-Za-z0-9_-]{16,}"'
```

If the audit matches, rotate the secret at the issuing provider, then move it out of the file.

### Local MCP Ports

Some bundled MCP servers connect over plain HTTP to a localhost port. Before first use, verify the listening process:

```bash
# Windows
netstat -ano | findstr :18801

# macOS / Linux
lsof -iTCP:18801 -sTCP:LISTEN
```

Compare the PID against the expected binary. Any other process on that port can intercept MCP traffic.

## Triage: suspicious `<system-reminder>` blocks

Aiuby runs inside agent harnesses that may inject ephemeral client-side system reminders into the model input on every turn. These blocks are not automatically repository-carried payloads.

Before treating one as an attack, verify:

1. Is the block actually in a file under this repo?

   ```bash
   grep -rEn "system-reminder|NEVER mention|DO NOT mention" .
   ```

2. Is the block stored in the session transcript as part of a tool result?
3. Is it consistent with known client reminders such as TodoWrite nudges, date notices, or file-modified notices?

Escalate upstream only when the block is present inside a tool result or repository file and is not attributable to the file, URL, or command that was actually read.

## Security Resources

- **Security scan:** `/security-scan` (see `skills/security-scan/`)
- **Supply-chain IOC scan:** `aiuby security-ioc-scan`
- **AgentShield:** maintained by the upstream ECC project, not by Aiuby
- **Security Guide:** [The Shorthand Guide to Everything Agentic Security](./the-security-guide.md)
- **Supply-chain incident response:** [npm/GitHub Actions package-registry playbook](./docs/security/supply-chain-incident-response.md)
- **OWASP MCP Top 10:** <https://owasp.org/www-project-mcp-top-10/>
- **OWASP Agentic Applications Top 10:** <https://genai.owasp.org/resource/owasp-top-10-for-agentic-applications-for-2026/>
