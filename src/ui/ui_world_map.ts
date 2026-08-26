/**
 * World valley — select a landmark, then Enter.
 * Cutout layers light up when the PNG exists.
 */
import { registerGlobalFn } from '../runtime/register-global';

export type WorldSpotId = 'forest' | 'daily' | 'clanwar' | 'olympiad' | 'raid';

/** Only listed files are requested. Add an id here when the next cutout lands. */
const WORLD_LAYER_FILES: Partial<Record<WorldSpotId, string>> = {
  forest: 'assets/world/forest.png',
  clanwar: 'assets/world/clanwar.png',
  daily: 'assets/world/daily.png',
  olympiad: 'assets/world/olympiad.png',
  raid: 'assets/world/raid.png',
};

const WORLD_LAYER_REV = '6';

function worldStack(): HTMLElement | null {
  return document.getElementById('world-map-stack');
}

function stop(ev?: Event): void {
  if (ev) {
    ev.stopPropagation();
    ev.preventDefault();
  }
}

function tt(key: string, fallback: string): string {
  return typeof window.t === 'function' ? window.t(key) : fallback;
}

function isClanLeaderWorld(): boolean {
  return !!(
    Array.isArray(window.clans)
    && window.playerClanId
    && window.clans.find((c) => c.id === window.playerClanId)?.lider === window.charName
  );
}

function markActorHasLayer(spotId: string, on: boolean): void {
  const actor = document.querySelector(`.world-map-actor--${spotId}`);
  actor?.classList.toggle('world-map-actor--has-layer', on);
}

function hideLayer(img: HTMLImageElement): void {
  img.hidden = true;
  img.removeAttribute('src');
  const id = (img.getAttribute('data-world-spot') || '').trim();
  if (id) markActorHasLayer(id, false);
}

function revealLayer(img: HTMLImageElement): void {
  if (img.naturalWidth <= 0) return;
  img.hidden = false;
  const id = (img.getAttribute('data-world-spot') || '').trim();
  if (id) markActorHasLayer(id, true);
}

function bindWorldMapLayers(): void {
  document.querySelectorAll<HTMLImageElement>('.world-map-layer').forEach((img) => {
    const id = (img.getAttribute('data-world-spot') || '').trim() as WorldSpotId;
    const file = WORLD_LAYER_FILES[id];
    img.hidden = true;
    if (!file) {
      hideLayer(img);
      return;
    }
    img.addEventListener('error', () => hideLayer(img));
    img.addEventListener('load', () => revealLayer(img));
    img.src = `${file}?v=${WORLD_LAYER_REV}`;
    if (img.complete && img.naturalWidth > 0) revealLayer(img);
  });
}

function applyWorldMapSelection(spotId: string | null): void {
  const stack = worldStack();
  if (!stack) return;
  if (spotId) stack.setAttribute('data-selected-spot', spotId);
  else stack.removeAttribute('data-selected-spot');

  stack.querySelectorAll('.world-map-hotspot').forEach((el) => {
    const id = (el.getAttribute('data-world-spot') || '').trim();
    el.classList.toggle('is-selected', !!spotId && id === spotId);
    el.setAttribute('aria-pressed', spotId && id === spotId ? 'true' : 'false');
  });

  stack.querySelectorAll('.world-map-enter').forEach((el) => {
    const btn = el as HTMLButtonElement;
    const id = (btn.getAttribute('data-world-spot') || '').trim();
    const on = !!spotId && id === spotId;
    btn.hidden = !on;
    btn.setAttribute('aria-hidden', on ? 'false' : 'true');
  });
}

function selecionarDestinoWorld(spotId: string, ev?: Event): void {
  stop(ev);
  const stack = worldStack();
  if (!stack || !spotId) return;
  const current = stack.getAttribute('data-selected-spot');
  if (current === spotId) return;
  applyWorldMapSelection(spotId);
  const tap = stack.querySelector(`.world-map-hotspot[data-world-spot="${spotId}"]`);
  if (tap instanceof HTMLElement) tap.blur();
}

function abrirWorldHuntingZones(): void {
  if (typeof window.ExpeditionEngine?.syncWorldExpeditionPanel === 'function') {
    window.ExpeditionEngine.syncWorldExpeditionPanel();
  }
  if (typeof window.abrirModal === 'function') window.abrirModal('janela-world-zones');
}

function escolherZonaWorld(grade: string, ev?: Event): void {
  stop(ev);
  if (typeof window.fecharModal === 'function') window.fecharModal('janela-world-zones');
  if (typeof window.abrirDetalhesZona === 'function') window.abrirDetalhesZona(grade);
}

function entrarDestinoWorld(spotId: string, ev?: Event): void {
  stop(ev);
  applyWorldMapSelection(null);
  switch (spotId) {
    case 'forest':
      abrirWorldHuntingZones();
      return;
    case 'daily':
      if (typeof window.abrirJanelaDailyBoss === 'function') window.abrirJanelaDailyBoss();
      return;
    case 'olympiad':
      if (typeof window.abrirOlympiad === 'function') window.abrirOlympiad();
      return;
    case 'raid':
      if (typeof window.abrirLobbyRaid === 'function') window.abrirLobbyRaid();
      return;
    case 'clanwar':
      if (!window.playerClanId) {
        if (typeof window.l2Alert === 'function') {
          window.l2Alert(tt('game.world.map.clanWarNeedClan', 'Join a clan to march to war.'));
        }
        return;
      }
      if (!isClanLeaderWorld()) {
        if (typeof window.l2Alert === 'function') {
          window.l2Alert(tt('game.world.map.clanWarLeaderOnly', 'Only the clan leader can open the war camp.'));
        }
        return;
      }
      if (typeof window.ClanWarEngine?.abrirLobby === 'function') window.ClanWarEngine.abrirLobby();
      return;
    default:
      return;
  }
}

function limparSelecaoWorldMap(ev?: Event): void {
  if (ev) ev.stopPropagation();
  applyWorldMapSelection(null);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bindWorldMapLayers, { once: true });
} else {
  bindWorldMapLayers();
}

registerGlobalFn('selecionarDestinoWorld', selecionarDestinoWorld as (...args: never[]) => unknown);
registerGlobalFn('entrarDestinoWorld', entrarDestinoWorld as (...args: never[]) => unknown);
registerGlobalFn('limparSelecaoWorldMap', limparSelecaoWorldMap as (...args: never[]) => unknown);
registerGlobalFn('abrirWorldHuntingZones', abrirWorldHuntingZones as (...args: never[]) => unknown);
registerGlobalFn('escolherZonaWorld', escolherZonaWorld as (...args: never[]) => unknown);
