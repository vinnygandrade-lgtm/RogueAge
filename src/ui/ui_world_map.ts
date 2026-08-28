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
  renderWorldHuntingZoneCards();
  if (typeof window.abrirModal === 'function') window.abrirModal('janela-world-zones');
}

const HUNT_ZONE_CARD_GRADES = ['No-Grade', 'D', 'C', 'B', 'A', 'S'] as const;

function zoneCardSlug(grade: string): string {
  if (grade === 'No-Grade') return 'ng';
  return String(grade || 'ng').toLowerCase();
}

function zoneCardArtUrl(grade: string): string {
  const cat = window.catalogoZonas?.[grade];
  if (cat?.img) return cat.img;
  return typeof window.battleBgUrlForGrade === 'function'
    ? window.battleBgUrlForGrade(grade, false)
    : `assets/zones/battle_${zoneCardSlug(grade)}.webp`;
}

function bindZoneCardArt(img: HTMLImageElement, card: HTMLElement, url: string): void {
  card.classList.add('is-art-pending');
  card.classList.remove('has-zone-art');
  img.hidden = true;
  img.removeAttribute('src');
  img.alt = '';
  const probe = new Image();
  probe.onload = () => {
    img.src = url;
    img.hidden = false;
    card.classList.remove('is-art-pending');
    card.classList.add('has-zone-art');
  };
  probe.onerror = () => {
    img.hidden = true;
    img.removeAttribute('src');
    card.classList.add('is-art-pending');
    card.classList.remove('has-zone-art');
  };
  probe.src = url;
}

function renderWorldHuntingZoneCards(): void {
  const grid = document.getElementById('world-hunting-zones-grid');
  if (!grid) return;
  grid.replaceChildren();
  grid.classList.add('world-zone-grid');

  HUNT_ZONE_CARD_GRADES.forEach((grade) => {
    const cat = window.catalogoZonas?.[grade];
    if (!cat) return;
    const sfx = zoneCardSlug(grade);
    const name = typeof window.t === 'function' ? window.t(`game.zones.${sfx}.name`) : cat.nome;
    const costShort = typeof window.t === 'function' ? window.t(`game.zones.${sfx}.costShort`) : String(cat.custo);
    const level = typeof window.t === 'function'
      ? window.t('game.zones.levelRange', { range: cat.nivelSugerido })
      : `Lv. ${cat.nivelSugerido}`;
    const pending = typeof window.t === 'function'
      ? window.t('game.zones.artPending')
      : 'Scenery coming soon';
    const aria = typeof window.t === 'function'
      ? window.t('game.zones.cardAria', { name, range: cat.nivelSugerido, cost: costShort })
      : `${name}. ${level}. ${costShort}`;

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `world-zone-card world-zone-card--${sfx}`;
    if (grade === 'No-Grade') btn.classList.add('world-zone-card--trailhead');
    btn.setAttribute('data-zone-grade', grade);
    btn.setAttribute('aria-label', aria);
    btn.onclick = (ev) => escolherZonaWorld(grade, ev);

    const art = document.createElement('span');
    art.className = 'world-zone-card__art';
    art.setAttribute('aria-hidden', 'true');
    const img = document.createElement('img');
    img.className = 'world-zone-card__img';
    img.decoding = 'async';
    img.draggable = false;
    img.alt = '';
    const pendingEl = document.createElement('span');
    pendingEl.className = 'world-zone-card__pending';
    const pendingMark = document.createElement('span');
    pendingMark.className = 'world-zone-card__pending-mark';
    pendingMark.textContent = grade === 'No-Grade' ? 'NG' : grade;
    const pendingTxt = document.createElement('span');
    pendingTxt.className = 'world-zone-card__pending-txt';
    pendingTxt.textContent = pending;
    pendingEl.appendChild(pendingMark);
    pendingEl.appendChild(pendingTxt);
    art.appendChild(img);
    art.appendChild(pendingEl);

    const body = document.createElement('span');
    body.className = 'world-zone-card__body';

    const top = document.createElement('span');
    top.className = 'world-zone-card__top';
    const gradeEl = document.createElement('span');
    gradeEl.className = 'world-zone-card__grade';
    gradeEl.textContent = grade === 'No-Grade' ? 'NG' : grade;
    top.appendChild(gradeEl);
    if (grade === 'No-Grade') {
      const badge = document.createElement('span');
      badge.className = 'world-zone-card__badge';
      const badgeTxt = typeof window.t === 'function' ? window.t('game.zones.trailheadBadge') : 'Start here';
      badge.textContent = badgeTxt && badgeTxt !== 'game.zones.trailheadBadge' ? badgeTxt : 'Start here';
      top.appendChild(badge);
    }

    const nameEl = document.createElement('span');
    nameEl.className = 'world-zone-card__name';
    nameEl.textContent = name && name !== `game.zones.${sfx}.name` ? name : cat.nome;

    const meta = document.createElement('span');
    meta.className = 'world-zone-card__meta';
    const levelEl = document.createElement('span');
    levelEl.className = 'world-zone-card__level';
    levelEl.textContent = level && level !== 'game.zones.levelRange' ? level : `Lv. ${cat.nivelSugerido}`;
    const costEl = document.createElement('span');
    costEl.className = 'world-zone-card__cost';
    costEl.textContent = costShort && costShort !== `game.zones.${sfx}.costShort` ? costShort : String(cat.custo);
    const go = document.createElement('span');
    go.className = 'world-zone-card__go';
    go.setAttribute('aria-hidden', 'true');
    go.textContent = '›';
    meta.appendChild(levelEl);
    meta.appendChild(costEl);
    meta.appendChild(go);

    const foot = document.createElement('span');
    foot.className = 'world-zone-card__foot';
    foot.appendChild(nameEl);
    foot.appendChild(meta);

    body.appendChild(top);
    body.appendChild(foot);

    btn.appendChild(art);
    btn.appendChild(body);
    grid.appendChild(btn);
    bindZoneCardArt(img, btn, zoneCardArtUrl(grade));
  });
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
registerGlobalFn('renderWorldHuntingZoneCards', renderWorldHuntingZoneCards as (...args: never[]) => unknown);
