/**
 * Tooltip / roster de presença Realtime no HUD.
 * Migrado: js/systems/multiplayer_visuals.js — Fase 4: tipos explícitos.
 */
import type {
  MultiplayerVisualsApi,
  OnlinePlayerCardInput,
  PresenceState,
} from '../types/game';
import { registerGlobal } from '../runtime/register-global';

function rosterLines(state: PresenceState | null | undefined): string[] {
  const out: string[] = [];
  if (!state || typeof state !== 'object') return out;

  const selfName =
    typeof window.charName === 'string' ? window.charName.toLowerCase() : '';

  Object.keys(state).forEach((key) => {
    const bucket = state[key];
    if (!Array.isArray(bucket)) return;

    bucket.forEach((item) => {
      if (!item || typeof item !== 'object') return;
      const raw = item as Record<string, unknown>;
      const nested =
        raw.presences && Array.isArray(raw.presences) && raw.presences[0] &&
        typeof raw.presences[0] === 'object'
          ? (raw.presences[0] as Record<string, unknown>)
          : null;
      const meta =
        raw.charName != null || raw.char_name != null ? raw : nested ?? raw;

      const name = String(meta.charName ?? meta.char_name ?? key);
      if (selfName && name.toLowerCase() === selfName) return;

      const tit = typeof meta.ascensionTitle === 'string' ? meta.ascensionTitle : '';
      const line = tit ? `${name} · ${tit}` : name;
      if (!out.includes(line)) out.push(line);
    });
  });

  return out;
}

export const MultiplayerVisuals: MultiplayerVisualsApi = {
  containerId: 'online-players-area',

  init() {
    console.log('👥 Motor de Visualização Multiplayer iniciado.');
    this.createContainer();
    window.addEventListener('l2-presence-update', (e: Event) => {
      const detail = (e as CustomEvent<PresenceState>).detail;
      this.renderPlayers(detail);
    });
  },

  createContainer() {
    const praca = document.getElementById('praca-cidade');
    if (!praca) return;
    if (document.getElementById(this.containerId)) return;

    const onlineArea = document.createElement('div');
    onlineArea.id = this.containerId;
    onlineArea.className = 'online-players-grid';

    const title = praca.querySelector('h4');
    if (title) {
      title.insertAdjacentElement('afterend', onlineArea);
    } else {
      praca.prepend(onlineArea);
    }
  },

  renderPlayers(presenceState) {
    const wrap = document.getElementById('multiplayer-status');
    if (!wrap) return;

    const lines = rosterLines(presenceState);
    const n = lines.length;
    const tFn = typeof window.t === 'function' ? window.t : null;

    if (n === 0) {
      wrap.setAttribute(
        'title',
        tFn ? tFn('game.multiplayer.presenceNoOthers') : '',
      );
      return;
    }

    const header = tFn
      ? tFn('game.multiplayer.onlineRosterTitle', { n })
      : `Other players online (${n})`;
    const body = lines.slice(0, 12).join('\n');
    const suffix =
      n > 12 ? `\n${tFn ? tFn('game.multiplayer.andMore') : '…'}` : '';
    wrap.setAttribute('title', `${header}\n${body}${suffix}`);
  },

  createPlayerCard(player: OnlinePlayerCardInput) {
    const div = document.createElement('div');
    div.className = 'player-online-card';

    const avatarImg = window.AuthEngine?.getAvatarForClass
      ? window.AuthEngine.getAvatarForClass(
          player.charClass,
          player.race ?? window.charRace,
          player.gender ?? window.charGender,
        )
      : 'assets/chars/homem.png';

    const level = player.level ?? window.nivel ?? 1;
    div.innerHTML = `
            <div class="player-online-avatar">
                <img src="${avatarImg}" alt="">
                <div class="online-indicator"></div>
            </div>
            <div class="player-online-info">
                <div class="player-name">${player.charName}</div>
                <div class="player-sub">${player.charClass.replace('_', ' ')} (Lv.${level})</div>
            </div>
        `;

    div.onclick = () => {
      if (typeof window.abrirPerfilJogadorRanking === 'function') {
        window.l2Alert(
          typeof window.t === 'function'
            ? window.t('game.mp.viewingPlayer', { name: player.charName })
            : `Viewing details of ${player.charName}...`,
        );
      }
    };

    return div;
  },
};

registerGlobal('MultiplayerVisuals', MultiplayerVisuals);

document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => MultiplayerVisuals.init(), 1000);
});

export {};
