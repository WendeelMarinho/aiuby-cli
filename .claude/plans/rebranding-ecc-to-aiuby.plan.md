# Plano: Rebranding Técnico ECC → Aiuby AI Engineering

**Origem**: `/plan` — status report do operador (2026-08-06)
**Repositório**: `/home/wendeel/work/ecc/ECC` — branch `main`
**Complexidade**: **ALTA** (70–105h técnicas, excluindo design)
**Status**: aprovado — Fases 0–4 entregues em 2026-08-06

## Progresso

| Fase | Status | Nota |
|---|---|---|
| 0 — ADR de nomes | ✅ | `docs/architecture/ADR-0001-aiuby-naming-and-namespaces.md` |
| 1 — Auditoria em CI | ✅ | `npm run audit:legacy-names`; baseline 7007, ratchet unidirecional |
| 2 — Camada de compatibilidade | ✅ | env vars, paths, schemas, 5 shims de binário |
| 3 — `aiuby migrate` | ✅ | dry-run default, backup, rollback, proteção contra duplicata |
| 4a — Entrypoint da CLI | ✅ | `scripts/aiuby.js`; comando é `aiuby <cmd>` |
| 4b — Rename de env vars | ⛔ **revertida** | Quebra compat em entrypoints diretos. Regra em ADR §5a |
| 4c — Renames de arquivo | ✅ | icon, memory-vault doc, sync script, dashboard, resolve-root |
| 4d — Skills | ✅ | 4 diretórios + cópias traduzidas zh-CN/ja-JP + comando |
| 4e — Crate Rust | ⚠️ parcial | Metadata e consumidores JS. **Build não verificado — `cargo` ausente** |
| 5 — Pacotes e distribuição | ⬜ | + ponte para o nome do servidor MCP `ecc-memory-vault` |
| 6 — Upstream e migração docs | ⬜ | |
| 7 — Docs e 12 traduções | ⬜ | Resolve as 23 falhas pré-existentes de asserção sobre README |
| 8 — Contagens automatizadas | ⬜ | |
| 9 — Identidade visual | ⬜ | `assets/images/community/` está vazio; quebra `npm pack` hoje |
| 10 — Validação e release | ⬜ | |

**Suíte**: 3457/3480. As 23 falhas são pré-existentes (asserções sobre o README
reescrito na etapa editorial), confirmadas contra o `HEAD` anterior.

### Correções de premissa descobertas na execução

1. O contador `env-var` da auditoria **não mede progresso** — ele fica alto por
   todo o `0.x` por design (ADR §5a). O plano original o tratava como dívida a zerar.
2. `rg` ignora diretórios ocultos por padrão. Buscas manuais de referência
   precisam de `--hidden`, ou `.codex-plugin/`, `.claude-plugin/`, `.agents/` e
   `.cursor/` ficam invisíveis.
3. O sentinel citado em `resolve-aiuby-root.js` é `skills/continuous-learning-v2`,
   não um dos skills renomeados — o risco sinalizado no plano não existia.

---

## 1. Resumo

O rebranding editorial está avançado (~70%), mas o rebranding técnico mal começou.
A auditoria do repositório mostra que a identidade do pacote já migrou (`package.json`
é `aiuby-cli`, LICENSE tem duplo copyright), enquanto o núcleo operacional — 108
variáveis de ambiente `ECC_*`, os manifests de plugin, os paths `~/.ecc/`, os 229
links para `affaan-m/ECC` e o domínio `ecc.tools` — permanece integralmente legado.

O plano abaixo executa a migração em 11 fases, com a regra estrutural de que **a
camada de compatibilidade precede qualquer rename**, garantindo que instalações
existentes não quebrem em nenhum ponto da sequência.

**Estimativa revisada de progresso: ~30%** (editorial ~70%, técnico ~15%,
distribuição/identidade ~5%).

---

## 2. Estado real verificado (correções ao status report)

| Premissa do report | Verificado no repositório | Impacto |
|---|---|---|
| CLI tem 6 comandos | `scripts/ecc.js:9-94` expõe **20 comandos** | Escopo da fase de CLI é ~3× maior |
| Rebranding técnico "no início" | `package.json` **já é** `aiuby-cli`; bins `aiuby`, `aiuby-install`, `aiuby-control-pane`, `aiuby-memory-mcp`, `aiuby-plan-canvas` **já publicados** ao lado dos 5 `ecc-*` | Compat de binários existe, mas **sem aviso de depreciação e sem teste** — meio-feito é pior que não-feito |
| Números do README precisam ser corrigidos | Contagens **conferem**: 67 agents, 281 skills, 94 commands, soma = **442** | Item vira "automatizar + travar em CI", não "corrigir" |
| — | `LICENSE` já tem duplo copyright Wendeel + Affaan com link upstream | Atribuição legal mínima OK |
| — | **Não existem** `NOTICE`, `UPSTREAM.md`, `docs/migration/` | Lacuna real |

### Comandos reais da CLI (20)

`install`, `plan`, `catalog`, `consult`, `control-pane`, `ito`, `memory`,
`install-plan`, `list-installed`, `doctor`, `feedback`, `repair`, `auto-update`,
`status`, `platform-audit`, `security-ioc-scan`, `sessions`, `work-items`,
`session-inspect`, `loop-status`, `uninstall`

### Superfícies legadas medidas

| Identificador | Ocorrências | Natureza |
|---|---|---|
| `affaan-m/ECC` | 229 | parte é atribuição legítima, parte é link operacional errado |
| `x.com/affaan` + `@affaan` + `affaanmustafa` | 136 | contato pessoal do upstream — deve sair de superfícies operacionais |
| `ecc.tools` | 86 | domínio legado — deve sair |
| `ECC_*` (nomes distintos) | **108** | núcleo do runtime; `AIUBY_*` hoje = **0** |
| `.ecc` (paths) | 15 arquivos | memory-vault, benchmark, hermes, harness-adapter-compliance |
| Arquivos com "ecc" (case-insensitive) | ~1417 | inclui falsos positivos — exige allowlist antes de virar métrica |

### Focos 100% legados

| Arquivo | Problema |
|---|---|
| `.claude-plugin/plugin.json` | `"name": "ecc"` |
| `.claude-plugin/marketplace.json` | `"name": "ecc"` + `repository: affaan-m/ECC` (inconsistente com autor já migrado) |
| `.codex-plugin/plugin.json` | autor Affaan Mustafa, `me@affaanmustafa.com`, `homepage: ecc.tools`, descrição diz "249 ECC skills" (real: 281) |
| `.agents/plugins/marketplace.json` | `"name": "ecc"`, `displayName: "ECC"` |
| `agent.yaml` | `name: ecc`, `author: affaan-m` |
| `ecc2/Cargo.toml` | crate `ecc-tui`, autor Affaan, repo `affaan-m/ECC` |
| `scripts/ecc.js` | nome do arquivo + help + 34 exemplos `ecc ...` |
| `scripts/sync-ecc-to-codex.sh` | 85 ocorrências |
| `ecc_dashboard.py`, `scripts/lib/ecc_dashboard_runtime.py` | nome do módulo |
| `skills/configure-ecc/`, `skills/ecc-guide/`, `skills/ecc-recipes/`, `skills/ecc-tools-cost-audit/` | nomes de skills |
| `scripts/lib/resolve-ecc-root.js` | **atenção**: comentário na linha 28 indica sentinel acoplado a um nome de skill |

---

## 3. Padrões do repositório a espelhar

| Categoria | Fonte | Padrão |
|---|---|---|
| Scanner CI | `scripts/ci/scan-supply-chain-iocs.js` | Estrutura de saída JSON + exit codes + entrada no `package.json` como `security:ioc-scan` |
| Sub-comando CLI | `scripts/ecc.js:9-94` | Entrada em `COMMANDS` + script dedicado em `scripts/` + inclusão em `PRIMARY_COMMANDS` |
| Resolução de path | `scripts/lib/agent-data-home.js` | Env var → arquivo de config → `os.homedir()`, com override explícito documentado |
| Markers em docs | `ECC_BEGIN_MARKER` / `ECC_END_MARKER` | Injeção idempotente de conteúdo gerado entre marcadores |
| Testes de manifesto | `tests/plugin-manifest.test.js` | Asserção declarativa sobre JSONs de plugin |
| Testes de hooks | `tests/hooks/hooks.test.js` | Integração com HOME temporário |

---

## 4. Fases

### Fase 0 — Congelar o contrato de nomes (ADR)

**Entrega**: `docs/architecture/ADR-0001-aiuby-naming-and-namespaces.md`

- [ ] Tabela normativa de nomes — a proposta original **mais** o que a auditoria revelou: crate Rust, módulo Python do dashboard, nomes de skills, IDs de plugin por harness
- [ ] **Allowlist de legado permanente**: `LICENSE`, `NOTICE`, `UPSTREAM.md`, `docs/migration/`, CHANGELOG histórico
- [ ] Política de compatibilidade expressa em versões, não em datas
- [ ] Verificar **antes de congelar**: disponibilidade de `aiuby-cli`/`@aiuby/cli` no npm, org `aiuby` no GitHub, `ghcr.io/aiuby`

**Validação**: ADR revisado e commitado. Zero mudanças de código.

**Contrato proposto** (a confirmar):

| Elemento | Nome |
|---|---|
| Marca | AIUBY |
| Produto | Aiuby AI Engineering |
| Categoria | Sistema Operacional de Engenharia |
| Repositório | `aiuby-ai-engineering` |
| CLI | `aiuby` |
| Diretório do usuário | `~/.aiuby/` |
| Diretório do projeto | `.aiuby/` |
| Variáveis de ambiente | `AIUBY_*` |
| Configuração | `.aiuby/config.json` |
| Memória | `.aiuby/memory/` |
| Pacote npm | `aiuby-cli` *(recomendado — já em uso)* |
| Plugin Claude | `aiuby@aiuby` |
| Imagem GHCR | `ghcr.io/aiuby/aiuby-ai-engineering` |
| Crate Rust | `aiuby-tui` |

---

### Fase 1 — Auditoria classificada + baseline mensurável

**Entregas**: `scripts/ci/audit-legacy-names.js`, `docs/migration/legacy-name-inventory.md`

- [ ] Scanner varre o repo, aplica a allowlist do ADR, emite JSON + tabela
- [ ] Classificação por ocorrência: `rename` | `compat-temporary` | `upstream-attribution` | `historical-doc` | `test-fixture`
- [ ] Contagem baseline; flag `--strict` falha acima de um teto configurável que só desce
- [ ] Registrar como `npm run audit:legacy-names`
- [ ] Espelhar: `scripts/ci/scan-supply-chain-iocs.js`

**Validação**: `node scripts/ci/audit-legacy-names.js --json` reproduzível + teste em `tests/scripts/`.

> Esta fase absorve o "mapa de impacto do rebranding" do plano original — o scanner **é** o mapa.

---

### Fase 2 — Camada de compatibilidade *(precede qualquer rename)*

**Entregas**: `scripts/lib/legacy-compat.js` + testes

Três shims, sem comportamento novo — apenas tradução e aviso:

- [ ] **Env vars**: resolver lê `AIUBY_X`; se ausente, lê `ECC_X` e emite depreciação uma vez por processo. Mapa **gerado** a partir dos 108 nomes, não hardcode
- [ ] **Paths**: `~/.aiuby/` e `.aiuby/` com fallback de leitura em `~/.ecc/` e `.ecc/`. Pontos de entrada: `scripts/lib/agent-data-home.js` (`ECC_AGENT_DATA_HOME` é o pivô) e `scripts/lib/memory-vault.js`
- [ ] **Binários**: `ecc*` continuam funcionando mas imprimem em stderr:
  ```
  The `ecc` command is deprecated. Use `aiuby <command>`.
  Compatibility support will be removed in a future release.
  ```

**Validação**: testes nos 3 shims em ambas as direções + caso "ambos definidos → novo vence".

---

### Fase 3 — Migração de estado com backup, dry-run e rollback

**Entrega**: `scripts/migrate-to-aiuby.js`, exposto como `aiuby migrate`

- [ ] Detectar instalação legada: `~/.ecc/`, `.ecc/`, install-state com IDs `ecc`, plugin `ecc@ecc`
- [ ] `--dry-run` como **default**; escrita exige `--apply` explícito
- [ ] Backup com timestamp antes de qualquer escrita; `--rollback <backup>`
- [ ] Proteção contra instalação duplicada: detectar `~/.aiuby/` presente e reconciliar, nunca sobrescrever
- [ ] Migrar `ecc.memory.v1` → `aiuby.memory.v1` preservando o formato via `scripts/lib/memory-vault-format.js`
- [ ] Migrar install-state, config, plugins, e remover duplicações

**Validação**: teste de integração com HOME temporário — instalação ECC simulada → migrar → `doctor` limpo → rollback → estado original idêntico.

---

### Fase 4 — Renomear runtime e CLI

- [ ] `scripts/ecc.js` → `scripts/aiuby.js`; manter `scripts/ecc.js` como shim de 3 linhas
- [ ] Substituir help (`"ECC selective-install CLI"`) e os 34 exemplos `ecc ...`
- [ ] Renomear as 108 `ECC_*` → `AIUBY_*` **atrás do resolver da Fase 2**
- [ ] `scripts/sync-ecc-to-codex.sh` → `sync-aiuby-to-codex.sh`
- [ ] `ecc_dashboard.py` e `scripts/lib/ecc_dashboard_runtime.py`
- [ ] `scripts/lib/resolve-ecc-root.js` → `resolve-aiuby-root.js` — **mover o sentinel citado na linha 28 junto**
- [ ] Skills: `configure-ecc` → `configure-aiuby`, `ecc-guide` → `aiuby-guide`, `ecc-recipes` → `aiuby-recipes`, `ecc-tools-cost-audit` → `aiuby-cost-audit`, com shims em `legacy-command-shims/`
- [ ] `ecc2/`: crate `ecc-tui` → `aiuby-tui`, autor e repo no `Cargo.toml` *(escopo a confirmar — 577 ocorrências em 4 arquivos)*

**Validação**: `node tests/run-all.js` verde; `aiuby doctor` e `ecc doctor` (com aviso) ambos funcionais.

---

### Fase 5 — Pacotes e canais de distribuição

- [ ] `.claude-plugin/plugin.json`: `name` `ecc` → `aiuby`
- [ ] `.claude-plugin/marketplace.json`: `name` + corrigir `repository` (hoje aponta para `affaan-m/ECC` — bug de identidade)
- [ ] `.codex-plugin/plugin.json`: autor, e-mail, `homepage`, `repository`, `composerIcon`, e corrigir "249 ECC skills" → contagem gerada
- [ ] `.agents/plugins/marketplace.json`, `agent.yaml`
- [ ] `plugins/ecc/` → `plugins/aiuby/` (e a entrada correspondente em `package.json:files`)
- [ ] User-agent, nomes de telemetria, badges, links de instalação e suporte
- [ ] Docker/GHCR, GitHub App, releases e artefatos

**Validação**: `npm pack` + instalação limpa do tarball em container; `tests/plugin-manifest.test.js` estendido para **proibir** `affaan` e `ecc.tools` fora da allowlist.

---

### Fase 6 — Upstream, atribuição e guia de migração

- [ ] Criar `NOTICE` — attribution notice formal
- [ ] Criar `UPSTREAM.md` — histórico do fork, o que foi mantido, o que divergiu
- [ ] Criar `docs/migration/from-ecc-to-aiuby.md` cobrindo: detecção de instalação antiga, backup, dry-run, migração de config, migração de memória, migração de plugins, remoção de duplicações, rollback, período de compatibilidade, tabela comando-antigo → comando-novo
- [ ] Podar `affaan-m/ECC` das 229 ocorrências, mantendo apenas em `LICENSE`, `NOTICE`, `UPSTREAM.md`, `docs/migration/`, CHANGELOG histórico
- [ ] Corrigir links operacionais — ex.: `ecc work-items sync-github --repo affaan-m/ECC` no help da CLI

> Objetivo: remover ECC da identidade pública e operacional **sem apagar a origem open source**.

---

### Fase 7 — Documentação comunitária e traduções

- [ ] `CONTRIBUTING.md`, `SECURITY.md`, `CODE_OF_CONDUCT.md`, `SPONSORING.md`, `SPONSORS.md`, `CHANGELOG.md`
- [ ] `.github/`: templates de issue, template de PR, `CODEOWNERS`, workflows, `FUNDING.yml`
- [ ] `AGENTS.md`, `RULES.md`, `TROUBLESHOOTING.md`, `COMMANDS-QUICK-REF.md`, `WORKING-CONTEXT.md`, `SOUL.md`
- [ ] **12 traduções**: `docs/de-DE` (184), `docs/es` (183), `docs/ru` (155), `docs/zh-CN` (84), `docs/th` (43), `docs/ko-KR` (43), `docs/ur` (41), `docs/pt-BR` (40), `docs/ja-JP` (39), `docs/vi-VN` (37), `docs/tr`, `docs/zh-TW`
- [ ] Consolidar `pt-BR/README-PT-BR.md` (hoje não versionado) e `en/` (hoje vazio) na estrutura `docs/`
- [ ] Contatos, e-mails, links de reporte de vulnerabilidade, exemplos, guias, documentação de instalação/desinstalação

---

### Fase 8 — Contagens automatizadas e verificação de promessas

- [ ] `scripts/ci/generate-counts.js` emite `{agents, skills, commands, catalog, harnesses}` a partir do disco
- [ ] Injetar nos READMEs entre marcadores (convenção `*_BEGIN_MARKER` / `*_END_MARKER` já existe)
- [ ] CI falha se README divergir do disco
- [ ] **Resolver divergência**: o report declara "7 harnesses", mas `scripts/lib/install-targets/` tem **15 targets** — antigravity, claude-home, claude-project, codebuddy, codex-home, cursor, gemini, hermes, joycode, kimi, openclaw, opencode, qwen, zed. Definir se *harness* ≠ *target*, ou corrigir o número
- [ ] Auditar cada superfície prometida contra código real: Aiuby CLI, Cortex integrado, memória compartilhada, harnesses declarados, scanner de segurança, workflows exibidos, comandos da imagem
- [ ] Mover para "Roadmap" tudo o que ainda não existe

---

### Fase 9 — Identidade visual definitiva

- [ ] Logo oficial: SVG, PNG transparente, variantes dark e light
- [ ] `assets/ecc-icon.svg` → `assets/aiuby-icon.png` (referenciado em `.codex-plugin/plugin.json`)
- [ ] Favicon e ícone da CLI
- [ ] Hero **determinístico** em SVG/HTML — não depender de imagem gerada por IA, para que cada palavra, logo e número fique exato
- [ ] Social preview do GitHub, imagem Open Graph
- [ ] Atualizar dashboard, terminal, instalador e screenshots
- [ ] Tipografia, cores, espaçamento e regras de uso da marca

---

### Fase 10 — Validação final e release

| Cenário | Verificação |
|---|---|
| Instalação limpa | apenas nomes Aiuby |
| Upgrade de instalação ECC existente | sem perda de estado |
| Migração de estado e memória | `aiuby migrate` + rollback |
| `doctor` e `repair` | ambos verdes |
| Desinstalação | não remove arquivos do usuário |
| Harnesses | Claude Code, Codex, Cursor e demais adaptadores declarados |
| Plataformas | Linux, macOS, Windows |
| Documentação | todos os links resolvem |
| Build e testes | `node tests/run-all.js` |
| Publicação | `npm publish --dry-run`, pacote e plugin |
| Segredos e domínios | nenhum domínio antigo indevido |
| Auditoria | `audit-legacy-names --strict` → zero fora da allowlist |

---

## 5. Validação

```bash
node tests/run-all.js
node scripts/ci/audit-legacy-names.js --strict
npm run lint
npx markdownlint-cli '**/*.md' --ignore node_modules
npm pack --dry-run
node scripts/doctor.js
```

---

## 6. Riscos

| Risco | Prob. | Severidade | Mitigação |
|---|---|---|---|
| Rename das 108 env vars quebra hooks silenciosamente (hooks fazem `exit 0` em erro por design) | **Alta** | **Crítica** | Fase 2 antes da Fase 4, obrigatoriamente. Teste que enumera todo `ECC_*` do repo e prova cobertura do resolver |
| `aiuby-cli` / org `aiuby` / `ghcr.io/aiuby` já tomados | Média | Alta | Verificar **na Fase 0**, antes de o ADR congelar. Nome alternativo pronto |
| Migração de `~/.ecc/` destrói memória do usuário | Baixa | **Crítica** | Dry-run default + backup obrigatório + rollback testado |
| Remoção excessiva de `affaan-m` viola atribuição MIT | Média | Alta | Allowlist explícita no ADR; `NOTICE` criado **antes** da poda |
| Bins `ecc*` já publicados sem aviso — usuários não sabem que vão quebrar | **Já ocorrendo** | Média | Fase 2 adiciona o aviso; janela de compat conta a partir daí |
| ~1417 arquivos tocados = PR irrevisável | Alta | Média | Uma fase = um PR. Fases 1–3 são aditivas (zero risco de regressão) |
| Sentinel acoplado a nome de skill em `resolve-ecc-root.js:28` | Média | Alta | Ler o comentário e mover o sentinel junto no rename |

---

## 7. Esforço por fase

| Fase | Esforço | Bloqueia |
|---|---|---|
| 0 — ADR | 2–3h | tudo |
| 1 — Auditoria | 4–6h | 4, 10 |
| 2 — Compatibilidade | 8–12h | **4, 5** |
| 3 — Migração de estado | 10–14h | 10 |
| 4 — CLI e runtime | 12–16h | 10 |
| 5 — Pacotes e distribuição | 6–8h | 10 |
| 6 — Upstream e migração docs | 4–6h | — |
| 7 — Docs + 12 traduções | 12–20h | — |
| 8 — Contagens e promessas | 4–6h | — |
| 9 — Identidade visual | externo | 10 |
| 10 — Validação e release | 8–12h | — |

**Total: 70–105h** de trabalho técnico, excluindo design.

### Divergência com a ordem sugerida no report

A ordem relativa proposta está correta, com dois ajustes:

1. A **camada de compatibilidade precisa vir antes de qualquer rename** — inclusive antes de o mapa de impacto virar ação.
2. O item "mapa de impacto do rebranding" é absorvido pela Fase 1: o scanner de auditoria **é** o mapa, e mantê-los separados criaria dois artefatos que divergem.

---

## 8. Decisões pendentes *(bloqueiam a Fase 0)*

1. **Pacote npm**: `aiuby-cli` (já no `package.json`) ou `@aiuby/cli` (exige org npm)?
   *Recomendação: manter `aiuby-cli`, reservar o escopo para depois.*
2. **Repositório**: manter `WendeelMarinho/aiuby-cli` (já referenciado no `package.json`) ou migrar para `aiuby/aiuby-ai-engineering`? Muda 229 links.
3. **Janela de compatibilidade**: por versão (`ecc*` removido em `1.0.0`) ou por data?
4. **"7 harnesses"**: o que conta como harness, dado que existem 15 install targets?
5. **`ecc2/` (crate Rust `ecc-tui`)**: entra nesta rodada ou fica para depois? São 577 ocorrências concentradas em `main.rs` (295), `dashboard.rs` (160), `session/manager.rs` (70), `worktree/mod.rs` (52).

---

## 9. Aceite

- [ ] ADR aprovado e nomes congelados
- [ ] `audit-legacy-names --strict` retorna zero fora da allowlist
- [ ] Instalação limpa e upgrade de instalação ECC ambos verdes
- [ ] Migração de estado com rollback testado
- [ ] `node tests/run-all.js` verde
- [ ] Cobertura de testes ≥ 80% nos novos scripts
- [ ] Nenhum contato, domínio ou repo do upstream em superfície operacional
- [ ] Atribuição preservada em `LICENSE`, `NOTICE`, `UPSTREAM.md`

---

**AGUARDANDO CONFIRMAÇÃO** — nenhum código foi alterado.
