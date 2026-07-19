import {
  finishBootLoading,
  hideLoadingOverlay,
  setBootProgress,
  showBootLoading,
  showLoadingOverlay,
} from './bootstrap/boot-ui';
import { initI18nAndLanguageBar } from './bootstrap/i18n-init';

function bootMsg(key: string, fallback: string): string {
  return typeof window.t === 'function' ? window.t(key) : fallback;
}

function tickBoot(percent: number, message?: string): void {
  setBootProgress(percent, message);
}

showBootLoading(bootMsg('loading.connecting', 'Connecting...'));
tickBoot(2, bootMsg('loading.connecting', 'Connecting...'));

window.hideLoadingOverlay = hideLoadingOverlay;
window.showLoadingOverlay = showLoadingOverlay;

async function bootGame(): Promise<void> {
  await import('./data/database');
  tickBoot(12, bootMsg('loading.phaseDatabase', 'Loading game data...'));

  await import('./core/item_security');
  await import('./core/inventory_recent');
  await import('./core/inventory_stack_keys');
  await import('./core/inventory_manager');
  tickBoot(22, bootMsg('loading.phaseInventory', 'Loading inventory...'));

  await import('./db/db_bots');
  await import('./db/db_castles');
  await import('./db/db_items');
  tickBoot(32, bootMsg('loading.phaseItems', 'Loading item catalog...'));

  await import('./economy/economy_balance');
  await import('./db/db_mobs');
  await import('./db/db_bosses');
  await import('./db/db_zones');
  tickBoot(42, bootMsg('loading.phaseWorld', 'Loading world data...'));

  await import('./core/core_globals');
  await import('./ui/grade_ui');
  // Layout mode early — sets html[data-l2-layout] before heavy UI so PC CSS applies
  await import('./ui/ui_layout_mode');
  await import('./i18n/i18n');
  await import('./i18n/locales_bundle');
  await import('./runtime/cloud_rpc_message');
  tickBoot(52, bootMsg('loading.phaseI18n', 'Loading languages...'));

  initI18nAndLanguageBar();
  tickBoot(58, bootMsg('loading.phaseI18n', 'Loading languages...'));

  await import('./core/core_stats');
  await import('./systems/tutorial_engine');
  await import('./core/core_persistence');
  tickBoot(65, bootMsg('loading.phaseSave', 'Loading save engine...'));

  await import('./systems/olympiad_bots');
  await import('./systems/olympiad_engine');
  await import('./systems/supabase_api');
  await import('./systems/global_chat_engine');
  await import('./ui/character_portraits');
  await import('./systems/auth_engine');
  await import('./systems/castle_engine');
  await import('./systems/clan_war_engine');
  await import('./systems/market_cloud');
  await import('./systems/gm_engine');
  await import('./systems/reward_engine');
  await import('./systems/retention_engine');
  await import('./systems/mailbox_engine');
  await import('./systems/cloud_sync');
  await import('./systems/multiplayer_visuals');
  await import('./systems/ranking_manager');
  await import('./systems/ranking_seasons');
  tickBoot(78, bootMsg('loading.phaseOnline', 'Loading online services...'));

  await import('./combat/combat_i18n');
  await import('./core/core');
  await import('./systems/raid_engine');
  await import('./combat/combat_feedback');
  await import('./combat/combat_math');
  await import('./ui/ui_main');
  await import('./ui/ui_forest_battle_bg');
  await import('./combat/combat');
  await import('./combat/skills_engine');
  await import('./game/classes');
  await import('./game/skills');
  await import('./game/skill_unlock_notifs');
  tickBoot(88, bootMsg('loading.phaseCombat', 'Loading combat...'));

  await import('./ui/pwa_install');
  await import('./ui/ui_settings');
  await import('./ui/ui_nav_notifications');
  await import('./ui/ui_nav_coach');
  await import('./ui/ui_nav_menu');
  await import('./ui/ui_inventory');
  tickBoot(91, bootMsg('loading.phaseUi', 'Preparing interface...'));
  await import('./systems/endgame_pursuits');
  await import('./systems/expedition_engine');
  await import('./ui/ui_chat');
  await import('./ui/ui_clans');
  tickBoot(94, bootMsg('loading.phaseUi', 'Preparing interface...'));
  await import('./ui/ui_reward_icons');
  await import('./ui/ui_mission_toasts');
  await import('./ui/ui_daily_missions');
  await import('./ui/ui_level_rewards');
  await import('./ui/ui_retention');
  await import('./ui/ui_gameplay_achievements');
  await import('./ui/ui_shop');
  await import('./ui/ui_market');
  await import('./ui/ui_enchant');
  tickBoot(97, bootMsg('loading.phaseUi', 'Preparing interface...'));
  await import('./ui/ui_smartbar');
  await import('./paperdoll/paperdoll_config');
  await import('./paperdoll/ui_paperdoll');
  await import('./ui/ui_craft');
  await import('./ui/ui_daily_boss');

  finishBootLoading();
}

bootGame().catch((err) => {
  console.error('[L2Mini] Boot falhou:', err);
  const status = document.getElementById('loading-status');
  if (status) {
    status.textContent = bootMsg('loading.bootFailed', 'Failed to load game modules. Check console (F12).');
  }
  showBootLoading(bootMsg('loading.bootFailed', 'Failed to load game modules. Check console (F12).'));
});
