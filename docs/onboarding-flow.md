# Onboarding — primeira sessão (tips por marco)

Fluxo ponta-a-ponta do que um personagem **novo** vê até o primeiro combate, a primeira extração e a primeira skill
equipada, e como isso é medido.
Ler antes de mexer em `tutorial_engine.ts`, `ui_nav_coach.ts`, navegação inicial (`irPara`) ou no bloco
`onboarding` do save.

## Filosofia

- **Sem tour guiado / sem locks.** O tour passo-a-passo antigo foi aposentado (`tutorialProgress` fica sempre
  `completed`; mantido só por compatibilidade de save).
- **Dirigido por estado, não por ecrã.** O jogo sabe em que passo da primeira sessão o jogador está
  (`window.onboardingData.done`) e mostra **uma** dica apontando o **próximo** passo.
- **Dica de caminho volta até cumprir.** Fechar a dica só silencia naquela visita; ao voltar ao ecrã, aparece de
  novo até o marco ser atingido. Dicas de sistema (barra, poções, menu) continuam **uma vez só**.

## Caminho do novato e marcos

| # | Onde o jogador está | Dica (chave `navCoach.*`) | Pulse | Marco que a resolve |
|---|---|---|---|---|
| A | Perfil (landing) | `world*` — "toca em WORLD" | `#btn-tab-world` | `forest` |
| B | World (vale) | `zone*` — "toca em Deepgrove, Enter" | `.world-map-actor--forest` | `forest` |
| C | Mapa da trilha | `trail*` — "toca no NG, Enter" | `.exp-map-actor--ng` | `forest` |
| — | Modal de zona | **pulado** na 1ª ida a zona grátis (`isFirstExpedition`) | — | — |
| D | Hub da trilha (`floresta`) | `expedition*` — "Begin Expedition" | `#btn-iniciar-caca` | `mob_spawn` |
| D2 | Cartas de caminho (run ativa) | `path*` — "começa pela ⚔️ Luta" | `.expedition-path-card--combat` | `mob_spawn` |
| E | 1º pull em ecrã | `hotbar*` — alvo + Attack | `#barra-de-atalhos-dinamica` | flag `hotbarTipSeen` |
| F | 1º dano recebido | `consumables*` — HP / AUTO shot | `#consumables-bar` | flag `consumablesTipSeen` |
| H | Modal de upgrade após a 1ª vitória | `upgrade*` — "escolhe teu prêmio (vale só nesta run)" | `#exp-upgrade-cards` | `upgrade_picked` |
| I | Mapa da jornada 2 (cartas + Recolher e sair) | `extract*` — "continuar ou garantir a bolsa" | `.expedition-bag-bar__extract` | `first_extract` |
| J | World / Cidade / hub da trilha (sem run) após 1º kill | `skillGo*` — "toca em PERFIL, tem skill te esperando" | `#btn-tab-perfil` | `skill_equipped` |
| K | Perfil após 1º kill | `skill*` — "aba Skills → skill → Colocar na barra → slot" | `#btn-profile-spellbook` | `skill_equipped` |
| G | Perfil/World/Cidade depois de J/K resolvidas | `menuTown*` — MENU (correio, missões) | `#btn-tab-menu` | flag `menuTownSeen` |

**Marcos** (`OnboardingMilestone`): `world`, `forest`, `mob_spawn`, `first_attack`, `first_hit`, `first_kill`,
`level_up`, `upgrade_picked`, `first_extract`, `skill_equipped`. O onboarding conta como **completo** (fim das dicas
A–D2) quando `world`, `forest`, `mob_spawn`, `first_attack` e `first_kill` existem; a partir daí `coachPostCombat`
dá prioridade à lição de skill (J/K) e só depois à dica G. Toda classe tem uma skill de nível 1 (Power Strike /
Wind Strike), por isso K é sempre acionável.

**Ordem vivida pelo novato:** A → B → C → D → D2 → E → F → **H → I** → (Recolher e sair → recap "Bolsa garantida" →
Voltar pro vale) → **J → K** → G. Se morrer antes de extrair, I volta na próxima run (sem nag: fechar silencia a
sessão). Se escolher outro caminho em vez de extrair, `notifyExpeditionNodeConfirmed` conta como "beleza" (snooze).

## Gatilhos (código)

| Marco / dica | Onde dispara |
|---|---|
| `world` | `TutorialEngine.onNav('world')` (`ui_main.ts` → `irPara`) |
| `forest` | `onNav('floresta')` |
| `mob_spawn` + tip E | `spawnMonstros()` em `src/combat/combat.ts` → `notifyMobSpawn` |
| `first_attack` | `executarAtaqueBasico` em `combat_math.ts` → `notifyFirstAttack` (sem gate `isRunning`) |
| `first_hit` + tip F | dano no jogador em `combat_math.ts` (`playerHP -= …`) → `notifyPlayerHit` |
| `first_kill` | `processarMorteMonstro` (`combat.ts`) → `notifyMobKilled` |
| `level_up` | loop de level-up em `combat.ts` → `notifyLevelUp` |
| `skill_equipped` | `notifySkillAssignedFromSpellbook` (`skills.ts`) |
| Tips A–D | `coachForScreen(lugar)` em `onNav` + `afterCharacterLoad` (D vs D2 decide por `ExpeditionEngine.state.active`) |
| Tip D2 | `notifyHuntSearch` na chamada de `startExpedition` (ignorada depois de `mob_spawn`); dispensada (snooze) em `notifyExpeditionNodeConfirmed` |
| Tip H | `ExpeditionEngine.showUpgradeModal` → `notifyUpgradeOffered` (dispensa a tip de combate que estivesse no ecrã) |
| `upgrade_picked` + tip I | `ExpeditionEngine.pickUpgrade` (após `advanceJourney`) → `notifyUpgradePicked` (I só se `first_extract` pendente e run ativa) |
| `first_extract` | `ExpeditionEngine.finishExpedition(success=true)` → `notifyExpeditionExtracted` |
| Tips J/K | `coachPostCombat(lugar)` em `onNav` + `afterCharacterLoad`; hub da trilha sem nav: `fecharVitoriaEProcurar` (`combat.ts`) → `notifyVictoryModalClosed` |
| Limpeza | `showForestDeathScreen` / `showForestFleeSuccessScreen` (`combat.ts`) chamam `hideBeginnerTip` |

**Toast por cima de modais:** `#l2-tip-toast` vive no **`body`** (irmão de `#modal-overlay`), não dentro de
`#screen-game` — senão o `z-index: 2300` fica preso ao stacking context do ecrã (`z-index: 100`) e a tip H desaparece
atrás do modal de upgrade. Regra de lift em combate usa `body:has(.game-container.game-ingame) .l2-tip`.

**Regras em `ui_nav_coach.ts`:** `TIP_RULE` distingue `goal` (marco + ecrã) de `flag` (opcionalmente com `screen`
para tips de combate). `hideBeginnerTipForNav` esconde a tip presa a outro ecrã e limpa o snooze;
`hideBeginnerTipForMilestone` esconde ao atingir o marco; `hideTipUi` cancela também o timer pendente. `screen` aceita
`string | string[]` (ex.: `skillGo` em `world` / `floresta` / `cidade`).
`markSeen` só persiste para `flag`. `positionTipAwayFromTarget` levanta o toast quando ele cobriria o alvo
(botão Begin, barras de combate).

## Persistência

- Bloco **`onboarding: { startedAt, done: { <marco>: epochMs } }`** no save (`L2MINI_SAVE_VERSION = 22`).
- **Migração v21** (`migrarDadosSave`): save sem `onboarding` → veterano (`nivel > 1`, XP > 0 ou tips já vistas)
  recebe tudo como feito (`completedOnboarding()`, timestamps `0`); nível 1 sem combate recebe `freshOnboarding()`.
- **Migração v22:** marcos novos (`upgrade_picked`, `first_extract`) — `backfillVeteranOnboarding` preenche com `0`
  quando `startedAt === 0` (marcador de veterano escrito pela v21). Novos marcos futuros: acrescentar em
  `ALL_MILESTONES` (`tutorial_engine.ts`) e repetir este passo com nova versão.
- `bootstrapNewCharacter` (`core.ts` → `iniciarJogo`) e o payload inicial de `linkCharacterToAccount`
  (`auth_engine.ts`) começam com `done: {}`.
- Cada `mark()` faz `salvarJogo({ silent: true })`.

## Métrica (funil)

- Tabela **`public.onboarding_events`** + RPC **`log_onboarding_milestone(p_char_name, p_milestone, p_level, p_elapsed_ms)`**
  — `supabase_onboarding_metrics.sql` (espelho **MASTER 5J**). Uma linha por `(char_name, milestone)`; repetição é
  ignorada. RLS: jogador lê só as próprias linhas.
- Cliente: `SupabaseAPI.logOnboardingMilestone` (fire-and-forget, sem retry, nunca bloqueia gameplay); chamado em
  `mark()` só com sessão Supabase. `elapsed_ms` = tempo desde `startedAt` (relógio do cliente; `0` = veterano migrado).
- Query de funil para staff está comentada no fim do SQL. Drop-off relevante: `world → forest → mob_spawn → first_kill`.
- **Limitação honesta:** métrica de UX, não prova anti-cheat; o cliente decide quando marcar.

## Checklist ao mexer

1. Nova dica de caminho → acrescentar em `TIP_RULE` (kind `goal`, ecrã, marco), `TIP_I18N`, `pulseForTip`, i18n
   **en + pt-BR**, e o gatilho em `coachForScreen`.
2. Novo marco → `OnboardingMilestone` (`src/types/game.ts`), `ALL_MILESTONES` (`tutorial_engine.ts`), passo novo em
   `migrarDadosSave` (backfill de veteranos) e, se fizer parte do "primeiro combate", `CORE_MILESTONES`.
3. Mudou a navegação inicial (`initialDest`, dock, mapa) → rever a tabela acima e os selectores de pulse.
4. Testar com save **sem** `onboarding` (veterano não deve ver dica A) e com personagem novo
   (A → B → C → D → D2 → E → F → H → I → J → K → G).
5. Tip que precisa aparecer com um modal aberto → confirmar que o modal usa `abrirModal` com z < 2300 e que o toast
   continua no `body`.
