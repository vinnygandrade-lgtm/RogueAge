/**
 * Reward Hub — prémios GM via tabela `rewards` (Supabase).
 * Migrado: js/systems/reward_engine.js — Fase 4: tipos explícitos.
 */
import type {
  ItemCatalogBase,
  NormalizedRewardItem,
  RewardEngineApi,
  RewardRow,
  SupabaseClientLite,
} from '../types/game';
import { registerGlobal } from '../runtime/register-global';

function rewardT(key: string, params?: Record<string, string | number>): string {
  return typeof window.t === 'function' ? window.t(key, params) : key;
}

function equipmentCatalogs(): ItemCatalogBase[][] {
  return [
    window.catalogoArmas ?? [],
    window.catalogoArmaduras ?? [],
    window.catalogoJoias ?? [],
  ] as ItemCatalogBase[][];
}

function rewardsQuery(client: SupabaseClientLite) {
  return client.from('rewards') as unknown as {
    select: (cols: string) => {
      ilike: (
        col: string,
        val: string,
      ) => {
        eq: (
          col: string,
          val: boolean,
        ) => Promise<{ data: RewardRow[] | null; error: { message: string } | null }>;
      };
    };
    update: (patch: { claimed: boolean }) => {
      eq: (col: string, id: string) => Promise<{ error: { message: string } | null }>;
    };
  };
}

export const RewardEngine: RewardEngineApi = {
  rewards: [],
  claiming: false,
  lastPendingCount: 0,

  escapeHtml(text: unknown): string {
    if (text == null) return '';
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  },

  normalizeRewardItems(items: unknown): NormalizedRewardItem[] {
    if (items == null) return [];
    let raw: unknown = items;
    if (typeof raw === 'string') {
      try {
        raw = JSON.parse(raw) as unknown;
      } catch {
        return [];
      }
    }
    if (!Array.isArray(raw)) {
      if (typeof raw === 'object' && raw !== null) {
        const obj = raw as Record<string, unknown>;
        if (obj.id != null || obj.nome != null) raw = [raw];
        else return [];
      } else {
        return [];
      }
    }

    return (raw as Array<Record<string, unknown>>)
      .map((item) => ({
        id: String(item.id != null ? item.id : item.nome),
        nome: item.nome != null ? String(item.nome) : null,
        qtd: Number(
          item.qtd != null
            ? item.qtd
            : item.qty != null
              ? item.qty
              : item.quantity != null
                ? item.quantity
                : 0,
        ),
        tipo: item.tipo != null ? String(item.tipo) : undefined,
        epic: !!item.epic,
      }))
      .filter(
        (item) =>
          item.id.length > 0 && !Number.isNaN(item.qtd) && item.qtd > 0,
      );
  },

  resolveCatalogEntry(rawKey: unknown): ItemCatalogBase | null {
    if (rawKey == null) return null;
    const key = String(rawKey).trim();
    if (!key) return null;

    for (const cat of equipmentCatalogs()) {
      const found = cat.find(
        (i) => String(i.id) === key || String(i.nome) === key,
      );
      if (found) return found;
    }
    return null;
  },

  renderRewardChipHtml(item: NormalizedRewardItem): string {
    if (!item?.id) return '';
    const qtd = Math.max(1, Number(item.qtd) || 1);
    const idRaw = item.id;
    const idLower = idRaw.toLowerCase();
    const epic = !!item.epic;

    if (idLower === 'adena') {
      return `
                <div class="reward-item-chip reward-item-chip--currency">
                    <div class="reward-item-chip__icon-wrap"><div class="coin-icon coin-adena reward-item-chip__coin"></div></div>
                    <div class="reward-item-chip__meta">
                        <div class="reward-item-chip__name">${rewardT('reward.currencyAdena')}</div>
                        <div class="reward-item-chip__qty">×${qtd.toLocaleString()}</div>
                    </div>
                </div>`;
    }
    if (
      idLower === 'ancient coin' ||
      idLower === 'ancientcoin' ||
      idLower === 'ancient coins'
    ) {
      return `
                <div class="reward-item-chip reward-item-chip--currency">
                    <div class="reward-item-chip__icon-wrap"><div class="coin-icon coin-ancient reward-item-chip__coin"></div></div>
                    <div class="reward-item-chip__meta">
                        <div class="reward-item-chip__name">${rewardT('reward.currencyAncient')}</div>
                        <div class="reward-item-chip__qty">×${qtd.toLocaleString()}</div>
                    </div>
                </div>`;
    }

    const cat = this.resolveCatalogEntry(idRaw);
    const displayName =
      item.nome && String(item.nome).trim()
        ? String(item.nome).trim()
        : cat?.nome
          ? String(cat.nome)
          : idRaw;
    const imgSrc = cat?.img ? String(cat.img) : 'assets/itens/item_generic.png';
    const safeName = this.escapeHtml(displayName);
    const tierLabel =
      cat?.grade != null
        ? `<span class="reward-item-chip__grade">${this.escapeHtml(String(cat.grade))}</span>`
        : '';

    return `
            <div class="reward-item-chip ${epic ? 'reward-item-chip--epic' : ''}">
                <div class="reward-item-chip__icon-wrap">
                    <img class="reward-item-chip__img" src="${this.escapeHtml(imgSrc)}" alt="" loading="lazy" onerror="this.src='assets/itens/item_generic.png'">
                </div>
                <div class="reward-item-chip__meta">
                    <div class="reward-item-chip__name">${safeName}</div>
                    ${tierLabel}
                    <div class="reward-item-chip__qty">×${qtd.toLocaleString()}</div>
                </div>
            </div>`;
  },

  async init() {
    if (!window.charName) return;
    console.log('🎁 Reward Hub: Fetching rewards...');
    await this.checkRewards();
    setInterval(() => {
      void this.checkRewards();
    }, 60_000);
  },

  async checkRewards() {
    const client = window.SupabaseAPI?.client;
    if (!window.charName || !client) return;

    try {
      const { data, error } = await rewardsQuery(client)
        .select('*')
        .ilike('char_name', window.charName)
        .eq('claimed', false);

      if (error) throw error;

      this.rewards = data ?? [];
      this.updateBadge();

      const hub = document.getElementById('janela-reward-hub');
      if (this.rewards.length > 0 && hub && hub.style.display === 'flex') {
        this.render();
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('Reward Hub fetch error:', message);
    }
  },

  updateBadge() {
    const badge = document.getElementById('notif-badge');
    const n = this.rewards.length;
    const prev = this.lastPendingCount;
    this.lastPendingCount = n;

    window.aplicarNotifBadgeVisual?.();

    if (badge && n > prev && n > 0) {
      badge.classList.remove('reward-badge--ping');
      void badge.offsetWidth;
      badge.classList.add('reward-badge--ping');
    }
  },

  createHUDBtn() {
    return;
  },

  open() {
    window.abrirModal('janela-reward-hub', 2500);
    this.render();
  },

  render() {
    const cont = document.getElementById('reward-hub-content');
    if (!cont) return;

    if (this.rewards.length === 0) {
      cont.innerHTML = `
                <div style="text-align:center; padding:40px; color:#555;">
                    <div style="font-size:3em; margin-bottom:10px; opacity:0.2;">🎁</div>
                    <p style="font-family:'Cinzel'; font-size:12px;">${rewardT('reward.emptyState')}</p>
                </div>
            `;
      return;
    }

    let html = '<div style="display:flex; flex-direction:column; gap:15px;">';
    this.rewards.forEach((reward) => {
      const date = reward.created_at
        ? new Date(reward.created_at).toLocaleDateString()
        : '';
      const senderRaw = reward.sender || rewardT('reward.fallbackSender');
      const sender = this.escapeHtml(senderRaw);
      const msg = this.escapeHtml(reward.message || '').replace(/\n/g, '<br>');

      html += `
                <div style="background:linear-gradient(145deg, #0f172a 0%, #020617 50%, #0c1a2e 100%); border:1px solid rgba(212,175,55,0.35); border-radius:10px; overflow:hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.55), 0 0 28px rgba(212,175,55,0.06);">
                    <div style="padding:11px 14px; background:linear-gradient(90deg, rgba(180,130,40,0.14), rgba(30,58,138,0.22)); border-bottom:1px solid rgba(212,175,55,0.22);">
                        <div style="font-size:8px; letter-spacing:0.28em; color:#d4af37; font-family:'Cinzel',serif; font-weight:700; text-transform:uppercase; opacity:0.95;">${rewardT('reward.gmGiftHeader')}</div>
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-top:8px;">
                            <span style="font-size:11px; color:#93c5fd; font-family:'Cinzel',serif; font-weight:bold;">✦ ${sender}</span>
                            <span style="font-size:9px; color:#64748b;">${this.escapeHtml(date)}</span>
                        </div>
                    </div>
                    <div style="padding:16px 15px 15px;">
                        <p style="font-size:12px; color:#cbd5e1; margin:0 0 14px 0; line-height:1.55; font-family: Georgia, 'Times New Roman', serif; font-style:italic;">${msg}</p>
                        <div class="reward-hub-items-scroll">
                            ${this.renderItems(this.normalizeRewardItems(reward.items))}
                        </div>
                        <button class="btn-l2" style="width:100%; height:38px; background:linear-gradient(180deg, #ca8a04, #a16207); border:1px solid rgba(212,175,55,0.5); font-weight:bold; font-size:11px; letter-spacing:0.08em; text-transform:uppercase; font-family:'Cinzel',serif;"
                                onclick="RewardEngine.claim('${reward.id}')">${rewardT('reward.claimGift')}</button>
                    </div>
                </div>
            `;
    });
    html += '</div>';
    cont.innerHTML = html;
  },

  renderItems(items: NormalizedRewardItem[]): string {
    if (!Array.isArray(items) || items.length === 0) return '';
    return `<div class="reward-item-chip-grid">${items.map((item) => this.renderRewardChipHtml(item)).join('')}</div>`;
  },

  async claim(id: string) {
    if (this.claiming) return;

    const rewardIndex = this.rewards.findIndex((r) => r.id === id);
    if (rewardIndex === -1) return;

    const reward = this.rewards[rewardIndex];
    const client = window.SupabaseAPI?.client;
    if (!client) return;

    this.claiming = true;

    try {
      const itemsEntrega = this.normalizeRewardItems(reward.items);
      if (itemsEntrega.length === 0) {
        console.warn('RewardEngine.claim: empty or invalid items after normalize', reward.id);
        window.l2Alert(rewardT('reward.invalidData'));
        return;
      }

      const { error } = await rewardsQuery(client)
        .update({ claimed: true })
        .eq('id', id);

      if (error) throw error;

      this.rewards.splice(rewardIndex, 1);
      this.updateBadge();
      this.render();

      itemsEntrega.forEach((item) => {
        const qty = Number(item.qtd);
        const idLower = String(item.id).toLowerCase();

        if (idLower === 'adena') {
          window.adenas = (Number(window.adenas) || 0) + qty;
          window.escreverLog(
            `<span style="color:#facc15; font-weight:bold;">+${qty.toLocaleString()} Adena (Reward Hub)</span>`,
          );
        } else if (
          idLower === 'ancient coin' ||
          idLower === 'ancientcoin' ||
          idLower === 'ancient coins'
        ) {
          window.ancientCoins = (Number(window.ancientCoins) || 0) + qty;
          window.escreverLog(
            `<span style="color:#60a5fa; font-weight:bold;">+${qty.toLocaleString()} Ancient Coins (Reward Hub)</span>`,
          );
        } else if (this.isEquipment(item.id)) {
          for (let i = 0; i < qty; i++) {
            this.addEquip(item.id);
          }
          window.escreverLog(
            `<span style="color:#fff;">+${qty}x ${item.id} (Reward Hub)</span>`,
          );
        } else {
          if (!window.inventario) window.inventario = {};
          window.inventario[item.id] =
            (Number(window.inventario[item.id]) || 0) + qty;
          window.escreverLog(
            `<span style="color:#aaa;">+${qty}x ${item.id} (Reward Hub)</span>`,
          );
        }
      });

      window.atualizar();
      window.salvarJogo();
      window.mostrarAviso(rewardT('reward.claimedToast'));
    } catch (err) {
      console.error('Reward claim error:', err);
      const message = err instanceof Error ? err.message : String(err);
      window.l2Alert(rewardT('reward.errorGeneric', { message }));
    } finally {
      this.claiming = false;
    }
  },

  isEquipment(itemKey: string): boolean {
    return equipmentCatalogs().some((cat) =>
      cat.some((i) => i.id === itemKey || i.nome === itemKey),
    );
  },

  addEquip(itemKey: string): void {
    let info: ItemCatalogBase | null = null;
    for (const cat of equipmentCatalogs()) {
      info = cat.find((i) => i.id === itemKey || i.nome === itemKey) ?? null;
      if (info) break;
    }

    if (info && window.inventarioEquips) {
      window.inventarioEquips.push({
        uid: `RW-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        tipo: String(info.tipoItem ?? info.tipo ?? 'item'),
        enchant: 0,
        augmented: false,
        base: info,
      });
    }
  },
};

registerGlobal('RewardEngine', RewardEngine);

window.addEventListener('load', () => {
  const checkChar = setInterval(() => {
    if (window.charName) {
      clearInterval(checkChar);
      void RewardEngine.init();
    }
  }, 1000);
});

export {};
