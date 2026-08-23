/**
 * Town plaza — select NPC, then Speak.
 */
import { registerGlobalFn } from '../runtime/register-global';

function plazaStack(): HTMLElement | null {
  return document.getElementById('town-plaza-stack');
}

function plazaCoachEl(): HTMLElement | null {
  return document.getElementById('town-plaza-coach');
}

function stop(ev?: Event): void {
  if (ev) {
    ev.stopPropagation();
    ev.preventDefault();
  }
}

function plazaCoachSeen(): boolean {
  return !!window.uiCoachFlags?.plazaNpcTipSeen;
}

function hidePlazaCoachUi(): void {
  const el = plazaCoachEl();
  if (!el) return;
  el.classList.add('town-plaza-coach--hidden');
  el.hidden = true;
  el.setAttribute('aria-hidden', 'true');
}

function showPlazaCoachUi(): void {
  const el = plazaCoachEl();
  if (!el) return;
  el.classList.remove('town-plaza-coach--hidden');
  el.hidden = false;
  el.setAttribute('aria-hidden', 'false');
}

function markPlazaCoachSeen(): void {
  if (!window.uiCoachFlags || typeof window.uiCoachFlags !== 'object') {
    window.uiCoachFlags = {};
  }
  window.uiCoachFlags.plazaNpcTipSeen = true;
  try {
    if (typeof window.salvarJogo === 'function') window.salvarJogo({ silent: true });
  } catch {
    /* ignore */
  }
}

function dismissTownPlazaCoach(ev?: Event): void {
  stop(ev);
  hidePlazaCoachUi();
  markPlazaCoachSeen();
}

function maybeShowPlazaNpcCoach(): void {
  if (!window.charName || plazaCoachSeen()) {
    hidePlazaCoachUi();
    return;
  }
  const tela = document.getElementById('tela-cidade');
  if (!tela || tela.style.display === 'none') return;
  const praca = document.getElementById('praca-cidade');
  if (praca && praca.style.display === 'none') return;
  showPlazaCoachUi();
}

function applyTownPlazaSelection(npcId: string | null): void {
  const stack = plazaStack();
  if (!stack) return;
  if (npcId) stack.setAttribute('data-selected-npc', npcId);
  else stack.removeAttribute('data-selected-npc');

  stack.querySelectorAll('.town-plaza-hotspot').forEach((el) => {
    const id = (el.getAttribute('data-town-npc') || '').trim();
    el.classList.toggle('is-selected', !!npcId && id === npcId);
    el.setAttribute('aria-pressed', npcId && id === npcId ? 'true' : 'false');
  });

  stack.querySelectorAll('.town-plaza-speak').forEach((el) => {
    const btn = el as HTMLButtonElement;
    const id = (btn.getAttribute('data-town-npc') || '').trim();
    const on = !!npcId && id === npcId;
    btn.hidden = !on;
    btn.setAttribute('aria-hidden', on ? 'false' : 'true');
  });
}

function selecionarNpcTown(npcId: string, ev?: Event): void {
  stop(ev);
  const stack = plazaStack();
  if (!stack || !npcId) return;
  if (!plazaCoachSeen()) dismissTownPlazaCoach();
  const current = stack.getAttribute('data-selected-npc');
  if (current === npcId) return;
  applyTownPlazaSelection(npcId);
}

function falarNpcTown(npcId: string, ev?: Event): void {
  stop(ev);
  if (!npcId) return;
  if (!plazaCoachSeen()) dismissTownPlazaCoach();
  applyTownPlazaSelection(null);
  if (typeof window.abrirNpc === 'function') window.abrirNpc(npcId);
}

function limparSelecaoTownPlaza(ev?: Event): void {
  if (ev) ev.stopPropagation();
  applyTownPlazaSelection(null);
}

registerGlobalFn('selecionarNpcTown', selecionarNpcTown as (...args: never[]) => unknown);
registerGlobalFn('falarNpcTown', falarNpcTown as (...args: never[]) => unknown);
registerGlobalFn('limparSelecaoTownPlaza', limparSelecaoTownPlaza as (...args: never[]) => unknown);
registerGlobalFn('dismissTownPlazaCoach', dismissTownPlazaCoach as (...args: never[]) => unknown);
registerGlobalFn('maybeShowPlazaNpcCoach', maybeShowPlazaNpcCoach as (...args: never[]) => unknown);
