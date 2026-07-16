# Level Achievements (Conquistas)

Progress rewards for reaching character levels. UI: MENU → Progress → **Achievements** (`#janela-level-rewards`) → tab **Levels**.

**Journey** (lifetime goals + chat titles): see `docs/gameplay-achievements.md`.

## Board UI

- **80 tiles** (levels 1–80) in a **10×8** grid — each tile shows **only the level number**.
- States:
  - **locked** (dark) — not reached; tap to **preview** rewards only
  - **claimable** (warm + dot) — reached, not claimed; tap opens claim modal with **Claim**
  - **claimed** (green + ✓) — already collected
- **Milestones** (10, 20, … 80): gold frame, gem marker, larger number.
- Tap opens `#janela-level-reward-claim`: level badge, status, reward list **with item icons**, Claim button (when eligible).
- Top bar: progress line + **Claim All**.

## Rules

- Claim when `nivel >= level` and level not in `claimed`.
- **Every 10 levels** is a **milestone**: bigger Adena/items + **Ancient Coins** (`floor(level/10)` AC).
- Normal levels never grant AC (craft + milestones only for AC economy).

## Persistence

- Saved on the character: `levelRewards: { claimed: number[] }` in JSONB / local save.
- `L2MINI_SAVE_VERSION` **14** migrates missing `levelRewards`.
- APIs: `getLevelRewardsSavePayload` / `aplicarLevelRewardsFromSave` wired in `core_persistence.ts`.

## Hooks

- Level-up loop in `aplicarXpGanhoFloresta` → `onLevelRewardReached(nivel)`.
- GM level set refreshes badge via `aplicarHudLevelRewardsBadge`.
- Badge: `refreshNavMenuNotifications({ achievements })` / `#nav-notif-achievements`.

## Code

- Motor/UI: `src/ui/ui_level_rewards.ts`
- Styles: `css/index-extras.css` + landscape overrides in `css/shell-landscape.css`
- Nav: `navMenuGo('achievements')` in `ui_nav_menu.ts`
