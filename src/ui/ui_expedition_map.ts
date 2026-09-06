/**
 * Expedition trail map — select a hunting grade, then Enter.
 * Cutout layers land one by one (manual). Until then, oval wash on select.
 */
import { registerGlobalFn } from '../runtime/register-global';

export type ExpSpotId = 'ng' | 'd' | 'c' | 'b' | 'a' | 's';

const EXP_SPOT_GRADES: Record<ExpSpotId, string> = {
  ng: 'No-Grade',
  d: 'D',
  c: 'C',
  b: 'B',
  a: 'A',
  s: 'S',
};

/** Listed files are fetched; missing PNGs stay hidden until a cutout lands. */
const EXP_LAYER_FILES: Record<ExpSpotId, string> = {
  ng: 'assets/expedition/ng.png',
  d: 'assets/expedition/d.png',
  c: 'assets/expedition/c.png',
  b: 'assets/expedition/b.png',
  a: 'assets/expedition/a.png',
  s: 'assets/expedition/s.png',
};

const EXP_LAYER_REV = '1';

function expStack(): HTMLElement | null {
  return document.getElementById('expedition-map-stack');
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

function gradeToSpot(grade: string): ExpSpotId | null {
  const g = String(grade || '');
  if (g === 'No-Grade' || g === 'NG') return 'ng';
  const lower = g.toLowerCase();
  if (lower === 'd' || lower === 'c' || lower === 'b' || lower === 'a' || lower === 's') {
    return lower as ExpSpotId;
  }
  return null;
}

function markActorHasLayer(spotId: string, on: boolean): void {
  const actor = document.querySelector(`.exp-map-actor--${spotId}`);
  actor?.classList.toggle('world-map-actor--has-layer', on);
}

function hideLayer(img: HTMLImageElement): void {
  img.hidden = true;
  img.removeAttribute('src');
  const id = (img.getAttribute('data-exp-spot') || '').trim();
  if (id) markActorHasLayer(id, false);
}

function revealLayer(img: HTMLImageElement): void {
  if (img.naturalWidth <= 0) return;
  img.hidden = false;
  const id = (img.getAttribute('data-exp-spot') || '').trim();
  if (id) markActorHasLayer(id, true);
}

function bindExpeditionMapLayers(): void {
  const stack = expStack();
  if (!stack) return;
  stack.querySelectorAll<HTMLImageElement>('.exp-map-layer').forEach((img) => {
    const id = (img.getAttribute('data-exp-spot') || '').trim() as ExpSpotId;
    const file = EXP_LAYER_FILES[id];
    img.hidden = true;
    if (!file) {
      hideLayer(img);
      return;
    }
    img.addEventListener('error', () => hideLayer(img));
    img.addEventListener('load', () => revealLayer(img));
    img.src = `${file}?v=${EXP_LAYER_REV}`;
    if (img.complete && img.naturalWidth > 0) revealLayer(img);
  });
}

function applyExpeditionMapSelection(spotId: string | null): void {
  const stack = expStack();
  if (!stack) return;
  if (spotId) stack.setAttribute('data-selected-spot', spotId);
  else stack.removeAttribute('data-selected-spot');

  stack.querySelectorAll('.world-map-hotspot').forEach((el) => {
    const id = (el.getAttribute('data-exp-spot') || '').trim();
    el.classList.toggle('is-selected', !!spotId && id === spotId);
    el.setAttribute('aria-pressed', spotId && id === spotId ? 'true' : 'false');
  });

  stack.querySelectorAll('.world-map-enter').forEach((el) => {
    const btn = el as HTMLButtonElement;
    const id = (btn.getAttribute('data-exp-spot') || '').trim();
    const on = !!spotId && id === spotId;
    btn.hidden = !on;
    btn.setAttribute('aria-hidden', on ? 'false' : 'true');
  });
}

function selecionarZonaExpedicao(spotId: string, ev?: Event): void {
  stop(ev);
  const stack = expStack();
  if (!stack || !spotId) return;
  const current = stack.getAttribute('data-selected-spot');
  if (current === spotId) return;
  applyExpeditionMapSelection(spotId);
  const tap = stack.querySelector(`.world-map-hotspot[data-exp-spot="${spotId}"]`);
  if (tap instanceof HTMLElement) tap.blur();
}

function activeRunGrade(): string | null {
  const eng = window.ExpeditionEngine;
  if (!eng?.state?.active) return null;
  return String(eng.state.zoneId || 'No-Grade');
}

function entrarZonaExpedicao(spotId: string, ev?: Event): void {
  stop(ev);
  const grade = EXP_SPOT_GRADES[spotId as ExpSpotId];
  if (!grade) return;

  const running = activeRunGrade();
  if (running) {
    const runningSpot = gradeToSpot(running);
    if (runningSpot && runningSpot !== spotId) {
      if (typeof window.l2Alert === 'function') {
        window.l2Alert(tt(
          'game.world.expeditionMap.runLocked',
          'Finish or extract the expedition already on the trail.',
        ));
      }
      return;
    }
    applyExpeditionMapSelection(null);
    if (typeof window.ExpeditionEngine?.resumeFromWorld === 'function') {
      window.ExpeditionEngine.resumeFromWorld();
    }
    return;
  }

  applyExpeditionMapSelection(null);
  if (typeof window.abrirDetalhesZona === 'function') window.abrirDetalhesZona(grade);
}

function limparSelecaoExpeditionMap(ev?: Event): void {
  if (ev) ev.stopPropagation();
  applyExpeditionMapSelection(null);
}

function voltarValeDaExpedicao(ev?: Event): void {
  stop(ev);
  applyExpeditionMapSelection(null);
  if (typeof window.irPara === 'function') window.irPara('world');
}

function syncExpeditionMapActiveBadge(): void {
  const running = activeRunGrade();
  const runningSpot = running ? gradeToSpot(running) : null;
  document.querySelectorAll<HTMLElement>('.exp-map-active').forEach((el) => {
    const id = (el.getAttribute('data-exp-spot') || '').trim();
    const on = !!runningSpot && id === runningSpot;
    el.hidden = !on;
    el.setAttribute('aria-hidden', on ? 'false' : 'true');
  });
  if (runningSpot) applyExpeditionMapSelection(runningSpot);
}

function abrirMapaExpedicao(): void {
  if (typeof window.ExpeditionEngine?.syncWorldExpeditionPanel === 'function') {
    window.ExpeditionEngine.syncWorldExpeditionPanel();
  }
  syncExpeditionMapActiveBadge();
  if (typeof window.irPara === 'function') window.irPara('expedition');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bindExpeditionMapLayers, { once: true });
} else {
  bindExpeditionMapLayers();
}

registerGlobalFn('selecionarZonaExpedicao', selecionarZonaExpedicao as (...args: never[]) => unknown);
registerGlobalFn('entrarZonaExpedicao', entrarZonaExpedicao as (...args: never[]) => unknown);
registerGlobalFn('limparSelecaoExpeditionMap', limparSelecaoExpeditionMap as (...args: never[]) => unknown);
registerGlobalFn('voltarValeDaExpedicao', voltarValeDaExpedicao as (...args: never[]) => unknown);
registerGlobalFn('abrirMapaExpedicao', abrirMapaExpedicao as (...args: never[]) => unknown);
registerGlobalFn('syncExpeditionMapActiveBadge', syncExpeditionMapActiveBadge as (...args: never[]) => unknown);
