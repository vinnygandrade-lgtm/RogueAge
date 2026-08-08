# Forest Expedition — mid-run persistence

Players can leave Forest (town, inventory, World, logout) **without extracting**. The bag, journey, path choices, run buffs, and forge enchants stay in the character save until extract/death.

## Save field

- `expeditionRun` on `characters.data` / local save (`L2MINI_SAVE_VERSION` **19**)
- Payload builder: `ExpeditionEngine.getRunSavePayload()`
- Restore: `ExpeditionEngine.applyRunFromSave()` in `carregarJogo`
- **Between-run ledger:** `expeditionMeta` (`ExpeditionMeta` / `src/systems/expedition_meta.ts`) — best journey, extracts/deaths, best bag Adena, last run line (per zone + lifetime). Survives extract; not cleared with `expeditionRun`.

## Lifecycle

| Event | Behavior |
|--------|----------|
| Start / journey advance / upgrade pick | Silent `salvarJogo` with snapshot |
| **Pause expedition** (map footer) | `pauseRunToHub()` — parks run and opens **World** with Resume/Extract dock (blocked while a fight is live). Forest hub still shows Resume if entered later. |
| Leave Forest / leave `screen-game` | Parks via `suspendRunForWorldLeave()` **only outside combat**. Live fight → `blockLeaveDuringCombat()` (no retreat). Edge interrupt keeps `combatInterrupted` + same path on Resume. |
| Open **World** while run active | Hunting Zones grid hidden; `#world-expedition-dock` shows **Resume** / **Collect & exit** (`syncWorldExpeditionPanel`). Adventure cards stay visible. |
| Re-enter Forest (parked) | Hub shows **Resume Expedition** (does not auto-jump into the map) |
| Resume | `resumeSuspendedRun()` — restores run vitals + map (town heal does not carry into the run) |
| **Start on another map while parked** | Hub warns (pending on map A). Confirm → extract 100% bag + victory modal → auto-start new run on map B (`confirmExtractToStartOtherZone`). Cancel keeps the parked run. |
| Extract / death | Clears `expeditionRun` after payout. Map footer = bag HUD (totals + “die = half”). Extract confirm = results screen: **100% Extract** vs **50% If you die** (portrait + landscape desk polish). |

## Effects while parked

- `isRunEffectsActive()` is false when `suspended`
- Run % buffs and temporary forge enchants **do not** apply in town
- Resume reapplies them on the expedition map

## Combat HUD (fight UI)

- During an active expedition run the global `.log-container` (chat + SYSTEM) stays **hidden** (portrait + landscape).
- Fight layout (top → bottom): **`#expedition-combat-stage`** (battle BG + mobs) → **`#expedition-combat-hud`** (fixed height: log left · vitals right) → hotbar.
- Battle BG (`#forest-battle-bg`) lives **inside the stage** — not behind the HUD/hotbar.
- Vitals move from `#expedition-vitals-home` (map/hub) into the HUD slot on fight enter (`ExpeditionEngine.syncCombatHud`).
- Combat log lines mirror `escreverLog` / `writeGameLog` while `#tela-floresta.expedition-combat-open`; cleared on fight enter. No chat input here.

## Path choices (safe / risk / fight)

- **Safe path → next journey fights-only** still applies. Scout/Tracks intel **survives** that stretch and is consumed on the next *flexible* map (not cleared inside combat-only).
- **Merchant** — pick 1 of 3: free supply crate · bag-Adena pact (+8% run stat) · lucky omen (`luckLegendaryNext`). No HP heal deal.
- **Forge** — choose weapon / armor / jewel slot for +1 temp enchant (fallback +8% run stat if no gear).
- **Scout** — choose fight-heavy vs safer for the map **after** the next fight-only stretch; sets `nextPathBias`.
- **Tracks** — choose force Warhorn / Forge / Elite / Fight; sets `nextPathGuarantee` for after fight-only.
- **Patrol** — March token (`marchToken`): next combat win rolls **4** upgrade cards.
- **Chest** — Secure (modest loot) vs Gamble (~70% big loot / ~30% `lootCurseNextFight` = next fight bag loot ×0.5). **No HP damage.**
- **Ambush** — bag gamble: success = Adena/mats; fail = lose bag Adena % and sometimes a drop stack. **Never HP.**
- **Warhorn** — Assault / Tempo / Iron Rally packages (unchanged)
- **Rare events** — 2 choices per type (shrine / gambler / cache / storm); **no HP chips**. Gambler high stake = bag Adena (`Purse wager`); shrine sells bag/regen or Max HP buff (heal is optional QoL on Moon bounty only). Storm “Focused” opens a secondary +8% pick.
- Persist: `marchToken`, `lootCurseNextFight`, `nextPathBias`, `nextPathGuarantee` on `expeditionRun`
- **Rules modal** + path legend must stay aligned (i18n `game.hunt.expedition.rules*` / `legendPath*`)

## Run builds (synergy)

- Unlock **as many builds as you complete** — bonuses **stack** (`unlockedBuildIds` on `expeditionRun`; legacy `activeBuildId` migrates on load)
- 10 builds in Offense / Defense / Sustain (Swift Caster, Blade Dancer, Executioner, Spell Fortress, Iron Wall, Trail Warden, **Phantom Step**, Mana Well, Vital Pulse, Arcane Channel)
- **Phantom Step:** Evasion cards (`dodgeRatePct` ≥ 15) + Atk Spd (`atkSpeedPct` ≥ 20) → `+6` Evasion investment · `+5%` Atk Spd (stacks; soft-caps with gear)
- Post-fight upgrade pool includes **Casting Speed** (`castSpeedPct`), **Max MP** (`maxMpPct`), and **Evasion** (`dodgeRatePct`, additive investment + soft-cap with gear) alongside Atk Spd / HP / CDR / etc.
- Upgrade cards reuse **Blessing Build** art when mapped (`assets/blessings/<id>.png` via `UPGRADE_BLESSING_ICON`) with emoji fallback until the PNG exists.
- Path / journey route cards load `assets/expedition/paths/<type>.png` (`combat`, `boss`, `elite`, `warhorn`, …) with emoji fallback — see `assets/expedition/paths/README.md`.
- **Legendary upgrade chance** after a win scales by path: combat **15%**, elite **30%**, boss **50%** (fallback 18%). Storm `luckLegendaryNext` still forces one legendary on the next win.
- Thresholds tuned for **~4–7 dedicated card picks** per build (not 1–2); mastery at **3 / 5 / 7** is a mid/late-run goal
- Mastery tiers at **3 / 5 / 7** unlocked builds (extra stacked % via `BUILD_MASTERY_TIERS`)
- Bonus % live in `buildBonusBuffs` (rebuilt from catalog on load) — separate from card picks; combat uses `getCombinedBuffPct` (cards + builds)
- Dedicated **Builds** tab — role groups, mastery track, stacked-bonus list, closest-build tip; upgrade cards show **Toward** / **Unlocks** hints; Stats chips mark ★ when builds contribute
- Compact chips still on the upgrade pick modal

## Honesty (§12.7)

Still **client-authoritative** bag credit on extract. Persistence only prevents silent loss on reload/navigation.

## Related

- Engine: `src/systems/expedition_engine.ts`
- Nav: `src/ui/ui_main.ts` (`irPara` / `mudarTela`)
- Shell notes: `docs/ui-shell-spec.md` (portrait layout)
