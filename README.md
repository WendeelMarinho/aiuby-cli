<p align="center">
  <img src="assets/hero-aiuby.png" alt="Aiuby AI Engineering — AI-native engineering system" width="100%" />
</p>

<p align="center">
  <strong>Language:</strong>
  <a href="README.md">English</a> ·
  <a href="README.pt-BR.md">Português (Brasil)</a>
</p>

<p align="center">
  <a href="https://aiuby.com"><img src="https://img.shields.io/badge/Website-aiuby.com-111827?logo=googlechrome&logoColor=white" alt="Aiuby website" /></a>
  <a href="https://cortex.aiuby.com"><img src="https://img.shields.io/badge/Cortex-AI%20Engineering-2563EB" alt="Aiuby Cortex" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="MIT license" /></a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/-Shell-4EAA25?logo=gnu-bash&logoColor=white" alt="Shell" />
  <img src="https://img.shields.io/badge/-TypeScript-3178C6?logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/-Python-3776AB?logo=python&logoColor=white" alt="Python" />
  <img src="https://img.shields.io/badge/-Go-00ADD8?logo=go&logoColor=white" alt="Go" />
  <img src="https://img.shields.io/badge/-Java-ED8B00?logo=openjdk&logoColor=white" alt="Java" />
  <img src="https://img.shields.io/badge/-PHP-777BB4?logo=php&logoColor=white" alt="PHP" />
</p>

# Aiuby AI Engineering

**Agents can write code. Aiuby turns them into an engineering system.**

Aiuby AI Engineering is an AI-native engineering foundation for planning, building, reviewing, verifying, securing, documenting, and continuously improving software with intelligent agents.

It is not a prompt collection and it is not an autonomous coding demo.

It is a coordinated engineering layer that combines architecture, context, workflows, specialized agents, deterministic automation, memory, evaluation, security, and human governance.

```text
intent
  -> context
  -> architecture
  -> plan
  -> test
  -> implement
  -> review
  -> verify
  -> learn
  -> improve
```

> AI should not merely generate code. It should participate in a governed engineering process.

---

## Why Aiuby AI Engineering Exists

Software development with AI usually begins with a chat window and a vague instruction.

That is useful, but it is not enough for serious engineering.

Without an engineering system:

- architecture decisions disappear into conversations;
- agents receive incomplete or conflicting context;
- implementation starts before the problem is understood;
- tests and security checks depend on reminders;
- the same context writes and approves its own work;
- project knowledge is lost between sessions and tools;
- teams cannot explain why an AI-generated change should be trusted;
- repeated successes are not converted into reusable organizational capability.

Aiuby AI Engineering treats those problems as engineering infrastructure problems.

Instead of asking a model to “be more careful,” the system organizes how work is understood, delegated, executed, evaluated, reviewed, remembered, and governed.

---

## The Core Thesis

AI-native engineering requires more than a powerful model.

It requires an operating model around the model.

Aiuby is built around seven principles:

1. **Architecture before code** — implementation begins only after intent, constraints, risks, and system boundaries are understood.
2. **Context is infrastructure** — relevant project knowledge must be structured, retrievable, inspectable, and portable.
3. **Evidence over confidence** — plans, failing tests, passing tests, reviews, build results, security scans, and evaluation outputs form the delivery record.
4. **Agents need roles and boundaries** — planning, implementation, review, security, documentation, and operations should not collapse into one undifferentiated prompt.
5. **Deterministic automation surrounds probabilistic intelligence** — hooks, scripts, CI checks, policies, and quality gates enforce what cannot depend on model memory.
6. **Memory must become governed knowledge** — useful context should survive sessions, but recalled information must never silently become trusted policy.
7. **Humans remain accountable** — AI accelerates engineering decisions; it does not eliminate technical ownership or organizational responsibility.

---

## What Aiuby Provides

Aiuby combines multiple engineering surfaces into one coordinated foundation.

| Surface | Responsibility |
|---|---|
| **Agents** | Specialized workers for planning, architecture, implementation, review, security, testing, documentation, operations, and domain tasks |
| **Skills** | Reusable workflows and engineering knowledge loaded only when relevant |
| **Rules** | Durable language, framework, security, and project standards |
| **Hooks** | Deterministic automation triggered by engineering events |
| **Memory** | Durable project context, decisions, handoffs, summaries, and learned patterns |
| **Orchestration** | Delegation, sequencing, isolation, parallel execution, and workflow control |
| **Evaluation** | Evidence-based assessment of implementation quality, model behavior, and workflow effectiveness |
| **Security** | Scanning and governance for prompts, agents, hooks, MCP servers, permissions, secrets, and supply-chain surfaces |
| **Observability** | Logs, metrics, traces, evaluation records, cost visibility, and operational status |
| **Integrations** | Connections to repositories, issue trackers, infrastructure, data platforms, browsers, APIs, and enterprise systems |

### Current repository surface

The current foundation includes the inherited technical catalog below:

| Included | Current surface | Purpose |
|---|---:|---|
| Agents | 67 | Planning, architecture, review, build repair, security, language, data, ML, and domain work |
| Skills | 281 | TDD, research, security, documentation, frontend, backend, data, ML, operations, and business workflows |
| Commands | 94 | Maintained compatibility entry points for command-oriented workflows |
| Hooks and memory | Runtime | Enforcement, session summaries, continuous learning, context controls, and handoffs |
| Rules | Selective | Common, language-specific, framework-specific, and project-level standards |
| Security scanning | Included | Analysis of agent configuration, secrets, permissions, prompts, hooks, and MCP surfaces |

Counts describe the current repository and may change as the Aiuby catalog is consolidated.

---

## Aiuby Engineering Loop

A successful AI-native workflow should produce more than code.

It should produce a trail of engineering evidence.

```text
1. Understand the objective
2. Retrieve the relevant context
3. Identify constraints and risks
4. Design or validate the architecture
5. Produce an implementation plan
6. Confirm the plan when required
7. Create failing tests or explicit acceptance checks
8. Implement the smallest correct change
9. Review from a fresh context
10. Run security and quality gates
11. Verify build, lint, types, tests, migrations, and behavior
12. Record decisions, outcomes, and reusable knowledge
```

The expected result is not merely:

```text
"The code was generated."
```

The expected result is:

```text
"The change was understood, planned, implemented, reviewed,
verified, secured, documented, and supported by evidence."
```

---

## AI Engineering, Not Prompt Engineering

Prompt engineering focuses on how to ask a model for an answer.

AI Engineering focuses on how to build reliable systems in which models participate.

That includes:

- model and provider selection;
- context acquisition and compression;
- retrieval and memory design;
- agent roles and tool permissions;
- workflow orchestration;
- structured outputs and contracts;
- evaluation and regression testing;
- observability and cost control;
- fallback and failure handling;
- security and prompt-injection resistance;
- human approval boundaries;
- deployment and production operations;
- continuous learning without uncontrolled behavior drift.

Aiuby treats these capabilities as part of software engineering, not as isolated AI experiments.

---

## Architecture

```text
┌─────────────────────────────────────────────────────────────────────┐
│                       Human Engineering Layer                       │
│      intent · priorities · approvals · architecture · ownership     │
└───────────────────────────────┬─────────────────────────────────────┘
                                │
┌───────────────────────────────▼─────────────────────────────────────┐
│                     Aiuby Orchestration Layer                       │
│   workflows · delegation · gates · routing · sessions · handoffs   │
└───────────────┬──────────────────────┬──────────────────────────────┘
                │                      │
┌───────────────▼──────────────┐  ┌────▼──────────────────────────────┐
│     Intelligence Layer       │  │      Deterministic Layer          │
│ models · agents · retrieval  │  │ hooks · scripts · CI · policies  │
│ reasoning · generation       │  │ tests · scanners · validators    │
└───────────────┬──────────────┘  └────┬──────────────────────────────┘
                │                      │
┌───────────────▼──────────────────────▼──────────────────────────────┐
│                         Context and Memory                           │
│ project knowledge · decisions · architecture · standards · history │
└───────────────┬─────────────────────────────────────────────────────┘
                │
┌───────────────▼─────────────────────────────────────────────────────┐
│                       Engineering Integrations                       │
│ Git · GitHub · Jira · MCP · APIs · databases · cloud · observability│
└─────────────────────────────────────────────────────────────────────┘
```

### Architectural boundaries

**Models are replaceable.** The engineering process should not depend on one provider or one generation model.

**Harnesses are adapters.** Claude Code, Codex, Cursor, OpenCode, Gemini CLI, Kimi, GitHub Copilot, and other environments expose different capabilities. Aiuby maps its engineering workflows to each harness without pretending they all have feature parity.

**Skills are loaded on demand.** Large knowledge catalogs should not consume every context window.

**Rules are selective.** Only the standards relevant to the project and stack should remain always loaded.

**Hooks operate outside the model context.** Deterministic checks should run even when a model forgets to request them.

**Memory is context, not authority.** Important claims must be verified and promoted into governed documentation before they are treated as project truth.

---

## Repository Structure

```text
aiuby-ai-engineering/
|-- agents/           # Specialized engineering agents
|-- skills/           # Reusable workflows and knowledge packs
|-- commands/         # Compatibility and command-oriented entry points
|-- rules/            # Common, language, framework, and project standards
|-- hooks/            # Runtime automation and deterministic enforcement
|-- scripts/          # Install, repair, sync, orchestration, and validation
|-- mcp-configs/      # Optional MCP integration definitions
|-- examples/         # Reference project configurations
|-- docs/             # Architecture, operating guides, and platform notes
|-- .claude-plugin/   # Claude Code adapter and plugin metadata
|-- .codex/           # OpenAI Codex instructions and reference configuration
|-- .cursor/          # Cursor rules and adapter configuration
|-- .opencode/        # OpenCode plugin and instructions
```

The root repository is the source of truth. Platform-specific adapters should package or map the same engineering capabilities instead of creating separate, divergent implementations.

---

## Core Concepts

### Agents

Agents are specialized workers with explicit scope, responsibility, tools, and constraints.

Examples include:

- planner;
- software architect;
- TDD guide;
- code reviewer;
- security reviewer;
- build error resolver;
- database reviewer;
- frontend reviewer;
- backend reviewer;
- ML engineering reviewer;
- documentation specialist;
- infrastructure and deployment specialist.

A role should exist because it creates useful separation of context or responsibility, not because “multi-agent” sounds sophisticated.

### Skills

Skills are reusable workflows and bodies of engineering knowledge.

A skill may define:

- when it should be used;
- what context it needs;
- the sequence of work;
- validation requirements;
- expected artifacts;
- failure and escalation conditions;
- security boundaries;
- examples and reference material.

New capabilities should normally be implemented as skills before becoming commands or always-loaded rules.

### Rules

Rules represent durable standards that must remain visible during relevant work.

```text
rules/
  common/        # Universal engineering principles
  typescript/    # TypeScript and JavaScript standards
  python/        # Python standards
  golang/        # Go standards
  java/          # Java standards
  php/           # PHP and Laravel standards
  rust/          # Rust standards
  project/       # Repository-specific architecture and conventions
```

Install rules selectively. Every always-loaded rule consumes context and competes with the actual problem.

### Hooks

Hooks execute deterministic actions around tool and workflow events.

Typical uses include:

- blocking destructive commands;
- detecting exposed secrets;
- requiring tests after implementation;
- warning about forbidden patterns;
- creating session summaries;
- recording workflow outcomes;
- triggering lint, type, build, migration, or security checks;
- enforcing project-specific quality gates.

### Context

Context is the working representation of what the system needs to know now.

Good context is:

- relevant;
- scoped;
- current;
- source-aware;
- inspectable;
- compressed without losing critical constraints;
- separated from untrusted instructions.

More context is not automatically better context.

### Memory

Memory preserves useful information across sessions and harnesses.

Potential memory objects include:

- architecture decisions;
- project vocabulary;
- accepted constraints;
- known risks;
- handoffs;
- investigation summaries;
- recurring failures;
- successful workflows;
- learned engineering patterns.

Memory entries should include provenance, confidence, scope, timestamps, and trust status whenever possible.

### Evaluations

Evaluations determine whether a model, agent, skill, workflow, or system change improves engineering outcomes.

Useful evaluation dimensions include:

- functional correctness;
- regression rate;
- test quality;
- security findings;
- architecture adherence;
- implementation completeness;
- review accuracy;
- latency;
- token and monetary cost;
- human correction rate;
- reproducibility;
- production reliability.

Without evaluations, “better AI engineering” becomes an opinion.

---

## Supported Engineering Domains

The repository currently includes or is designed to support workflows across:

- software architecture;
- backend engineering;
- frontend engineering;
- mobile engineering;
- APIs and integrations;
- databases and data engineering;
- machine learning engineering;
- LLM and agent systems;
- testing and quality engineering;
- application and agent security;
- DevOps, containers, cloud, and deployment;
- documentation and knowledge management;
- technical research;
- product and project engineering;
- business, content, and operational workflows where engineering agents are useful.

Supported language and framework packs include current repository coverage for TypeScript, JavaScript, Python, Go, Java, PHP, Laravel, Django, Spring Boot, Quarkus, C++, Rust, Kotlin, Swift, and additional ecosystems.

---

## Harness Support

Aiuby is designed to operate across multiple AI coding and engineering environments.

| Harness | Intended integration |
|---|---|
| Claude Code | Agents, skills, commands, rules, hooks, MCP, and plugin-based workflows |
| OpenAI Codex | Project instructions, skills, agents, prompts, and synchronized configuration |
| Cursor | Project-local rules, agents, prompts, and supported hook adapters |
| OpenCode | Plugin, commands, instructions, and event integrations |
| Gemini CLI | Project-local engineering configuration |
| GitHub Copilot | Repository instructions and reusable prompt files |
| Kimi Code | Project instructions and skills |
| Zed, Qwen, Antigravity, Hermes, OpenClaw, and others | Capability-limited adapters based on each platform's native surfaces |

Feature parity must not be assumed. Each harness has different context, hook, agent, plugin, and tool capabilities.

---

## Installation

> [!IMPORTANT]
> This README establishes the **Aiuby AI Engineering** product identity. Some internal package names, scripts, command namespaces, directories, and compatibility shims may still use the legacy `ecc` identifier while the technical migration is completed.

### Clone the repository

```bash
git clone <repository-url> aiuby-ai-engineering
cd aiuby-ai-engineering
```

Replace `<repository-url>` with the final Aiuby repository URL.

### Inspect before installing

```bash
npm install
node scripts/ecc.js list-installed
node scripts/ecc.js doctor
```

### Claude Code — current compatibility path

Use one installation method per harness. Do not combine a plugin installation with a second full manual installation for the same environment.

```bash
./install.sh --profile core --target claude
```

For a low-context installation without the hook runtime:

```bash
./install.sh --profile minimal --target claude
```

### OpenAI Codex — current compatibility path

Run Codex once so its configuration directory exists, then synchronize the engineering assets:

```bash
npm install
bash scripts/sync-ecc-to-codex.sh
```

The sync process should preserve existing Codex files and create backups before merging project instructions, skills, prompts, agents, and reference configuration.

### Other harnesses

```bash
./install.sh --profile minimal --target cursor
./install.sh --profile minimal --target gemini
./install.sh --profile minimal --target zed
./install.sh --profile minimal --target kimi
./install.sh --profile minimal --target qwen
```

Use only targets implemented by the repository version you have checked out.

### Validate the installation

```bash
node scripts/ecc.js doctor
```

### Reset or uninstall

```bash
node scripts/ecc.js list-installed
node scripts/ecc.js uninstall --dry-run
node scripts/ecc.js uninstall
```

Do not delete unrelated files from a harness configuration directory. Prefer state-aware uninstall and repair commands.

---

## Start Using Aiuby

Begin with the engineering outcome, not with the entire catalog.

| Objective | Recommended flow |
|---|---|
| Build a feature | Understand context → architecture check → plan → TDD → review → verification |
| Fix a bug | Reproduce → failing regression test → minimal fix → review → complete verification |
| Review code | Fresh-context code review → risk classification → actionable findings → regression checks |
| Repair a build | Isolate failure → identify root cause → implement constrained fix → rerun full checks |
| Refactor safely | Establish behavioral baseline → identify boundaries → incremental changes → regression evidence |
| Prepare production release | Security scan → E2E tests → build → migrations → rollback validation → release evidence |
| Resume a long project | Retrieve governed context → inspect last handoff → validate assumptions → continue from plan |
| Improve the system | Evaluate outcomes → identify repeated patterns → refine skill or rule → regression-test the workflow |

### Example delivery flow

```text
plan the feature
  -> inspect and approve the plan
  -> activate the relevant engineering skill
  -> create RED evidence
  -> implement until GREEN
  -> review from a separate context
  -> fix findings with regression tests
  -> run build, lint, types, tests, security, and migrations
  -> save the engineering handoff
```

---

## Security Model

AI engineering expands the attack surface.

Prompts, project instructions, hooks, MCP servers, agent files, permissions, secrets, external content, generated commands, and recalled memories must all be treated as security-sensitive inputs.

### Security principles

- install only from verified repositories and package channels;
- inspect hooks before enabling them;
- grant agents the minimum necessary tool permissions;
- isolate credentials from prompts and generated output;
- treat retrieved web, repository, issue, email, and document content as untrusted data;
- separate instructions from evidence;
- require confirmation for destructive, irreversible, financial, production, or high-impact operations;
- scan agent and MCP configuration as part of application security;
- keep deterministic controls around probabilistic model behavior;
- preserve audit trails for sensitive changes.

### Current compatibility scanner

```bash
npx -y ecc-agentshield scan --path .
```

The scanner name remains under the legacy compatibility namespace until the Aiuby package migration is completed.

For vulnerabilities, use the private disclosure process documented in `SECURITY.md`. Do not publish exploitable details in a public issue.

---

## Context, Memory, and Trust

Aiuby separates four concepts that are often mixed together:

| Concept | Meaning |
|---|---|
| **Conversation** | Temporary interaction history |
| **Context** | Information selected for the current task |
| **Memory** | Durable, retrievable information from previous work |
| **Governed knowledge** | Reviewed and accepted project truth, such as architecture decisions, specifications, policies, and documentation |

A memory entry is not automatically true because an agent saved it.

Important claims should be checked against authoritative sources. Accepted knowledge should be promoted into version-controlled project documentation, ADRs, specifications, tests, or policies.

### Memory flow

```text
session evidence
  -> summary
  -> memory candidate
  -> provenance and confidence
  -> retrieval when relevant
  -> human or automated verification
  -> governed project knowledge
```

---

## Observability and Evaluation

Production AI systems cannot be operated through intuition alone.

Aiuby engineering workflows should expose:

- model and provider used;
- prompt and instruction version;
- retrieved sources;
- tool calls;
- workflow state;
- approvals and overrides;
- latency;
- token consumption;
- monetary cost;
- errors and retries;
- evaluation scores;
- test and quality-gate results;
- security findings;
- deployment outcome;
- human corrections;
- rollback or recovery events.

Observability is required both for software reliability and for understanding whether AI is actually improving the engineering process.

---

## Aiuby Ecosystem

Aiuby AI Engineering is intended to become the engineering foundation across the Aiuby ecosystem.

### Aiuby

The company and engineering organization responsible for developing AI-native systems, implementation methods, products, integrations, and enterprise transformation capabilities.

- Website: [aiuby.com](https://aiuby.com)

### Cortex

The operational intelligence surface for engineering context, analysis, workflows, agents, evaluations, and organizational knowledge.

- Platform: [cortex.aiuby.com](https://cortex.aiuby.com)

### Aiuby CLI

The future command-line control surface for installing, configuring, inspecting, evaluating, and operating Aiuby engineering capabilities across projects and harnesses.

The current repository may continue to expose legacy `ecc` commands during the migration period.

---

## Enterprise Direction

Aiuby AI Engineering is being shaped for teams that need to move beyond isolated AI-assisted coding.

The enterprise direction includes:

- project and organization context;
- architecture and decision intelligence;
- repository and issue-tracker integrations;
- GitHub, Jira, CI/CD, cloud, and observability connections;
- policy and permission management;
- private skills and organizational standards;
- evaluation suites and regression governance;
- model routing and provider independence;
- local, private, cloud, and hybrid execution;
- auditable agent workflows;
- engineering productivity and quality metrics;
- reusable knowledge across teams and products;
- secure AI adoption programs.

The objective is not to remove engineering teams.

The objective is to give engineering teams a more capable operating model.

---

## Roadmap

### Phase 1 — Identity and foundation

- establish Aiuby AI Engineering as the official product identity;
- replace public ECC branding and external links;
- preserve license and upstream attribution;
- document legacy compatibility identifiers;
- standardize repository language and architecture vocabulary.

### Phase 2 — Aiuby runtime migration

- introduce the `aiuby` CLI namespace;
- migrate installer, doctor, repair, and uninstall commands;
- rename package, plugin, dashboard, and configuration identifiers;
- provide automated migration from legacy `ecc` state;
- prevent duplicated installations during transition.

### Phase 3 — Engineering context platform

- connect repositories, Jira, documentation, CI/CD, infrastructure, and observability;
- represent projects, architecture, decisions, risks, requirements, and engineering evidence;
- improve cross-session and cross-harness handoffs;
- integrate with Cortex.

### Phase 4 — Evaluation and governance

- workflow evaluation suites;
- model and skill regression testing;
- engineering quality scorecards;
- security and permission governance;
- cost, latency, and productivity observability;
- organization-level policies and approval gates.

### Phase 5 — Enterprise AI Engineering

- private organizational catalogs;
- multi-team knowledge and context;
- hybrid and self-hosted execution;
- portfolio-level engineering intelligence;
- reusable company engineering systems;
- governed continuous improvement.

---

## Migration Checklist

This README is the beginning of the identity migration, not the end of the technical migration.

Before the public Aiuby release, review the following:

- [x] Create the official Aiuby AI Engineering hero image at `assets/hero-aiuby.png`.
- [x] Confirm the final GitHub repository URL.
- [x] Keep English as the primary README and Portuguese (Brazil) as the secondary translation.
- [x] Replace package names and npm links.
- [ ] Replace Claude Code marketplace and plugin identifiers.
- [x] Rename CLI commands from `ecc` to `aiuby` with backward compatibility.
- [ ] Rename environment variables from `ECC_*` to `AIUBY_*`.
- [ ] Rename local state directories and memory namespaces.
- [ ] Update dashboard identity and assets.
- [ ] Update issue templates, security contacts, and contribution links.
- [ ] Review every external sponsor, partner, community, and pricing reference.
- [x] Preserve required MIT license and original copyright notices.
- [ ] Add migration documentation for existing installations.
- [ ] Run the full repository test and packaging suite.

---

## Contributing

Contributions may include:

- agents;
- skills;
- rules;
- hooks;
- evaluation suites;
- language and framework packs;
- security improvements;
- harness adapters;
- integrations;
- documentation;
- tests;
- observability and operational tooling.

A contribution should explain:

1. the engineering problem it solves;
2. when the capability should be used;
3. its inputs, outputs, and boundaries;
4. how correctness is evaluated;
5. what security risks it introduces;
6. how it behaves across supported harnesses;
7. what tests protect it from regression.

See `CONTRIBUTING.md` for the repository contribution process.

---

## Attribution and Upstream Foundation

This repository is based on and adapted from the open-source **ECC — Agent Harness Operating System** project by Affaan Mustafa and its contributors.

The Aiuby distribution introduces a new product identity, engineering philosophy, ecosystem direction, documentation structure, and planned runtime migration while preserving the obligations of the original MIT license.

Upstream project:

- [github.com/affaan-m/ECC](https://github.com/affaan-m/ECC)

Do not remove copyright notices or the original license text where preservation is required.

---

## License

MIT License.

See [`LICENSE`](LICENSE) for the complete license text and preserved copyright notices.

---

<p align="center">
  <strong>AI does not replace engineering.</strong><br />
  <strong>AI Engineering redesigns how engineering is performed.</strong>
</p>

<p align="center">
  <a href="https://aiuby.com">Aiuby</a> ·
  <a href="https://cortex.aiuby.com">Cortex</a>
</p>
