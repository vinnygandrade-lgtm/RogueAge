# Forest Expedition — mid-run persistence

Players can leave Forest (town, inventory, World, logout) **without extracting**. The bag, journey, path choices, run buffs, and forge enchants stay in the character save until extract/death.

## Save field

- `expeditionRun` on `characters.data` / local save (`L2MINI_SAVE_VERSION` **18**)
- Payload builder: `ExpeditionEngine.getRunSavePayload()`
- Restore: `ExpeditionEngine.applyRunFromSave()` in `carregarJogo`

## Lifecycle

| Event | Behavior |
|--------|----------|
| Start / journey advance / upgrade pick | Silent `salvarJogo` with snapshot |
| **Pause expedition** (map footer) | `pauseRunToHub()` — parks run, returns to Forest hub with **Resume** |
| Leave Forest / leave `screen-game` | `suspendRunForWorldLeave()` — parks run, aborts fight if needed, persists |
| Re-enter Forest (parked) | Hub shows **Resume Expedition** (does not auto-jump into the map) |
| Resume | `resumeSuspendedRun()` — restores run vitals + map (town heal does not carry into the run) |
| Extract / death | Clears `expeditionRun` after payout |

## Effects while parked

- `isRunEffectsActive()` is false when `suspended`
- Run % buffs and temporary forge enchants **do not** apply in town
- Resume reapplies them on the expedition map

## Honesty (§12.7)

Still **client-authoritative** bag credit on extract. Persistence only prevents silent loss on reload/navigation.

## Related

- Engine: `src/systems/expedition_engine.ts`
- Nav: `src/ui/ui_main.ts` (`irPara` / `mudarTela`)
- Shell notes: `docs/ui-shell-spec.md` (portrait layout)
