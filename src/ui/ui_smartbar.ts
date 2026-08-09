/**
 * UI — smart bar (atalhos, soulshots, cooldowns visuais)
 * Migrado: js/ui_smartbar.js — Fase 4: tipos explícitos.
 */

import type { ItemCatalogBase, ShopCatalogItem, SkillCatalogEntry } from '../types/game';
import { L2MINI_HOTBAR_SLOT_COUNT } from '../types/game';

const LONG_PRESS_MS = 600;

type HotbarPinCallback = (index: number) => void;
type CatalogRow = ItemCatalogBase | ShopCatalogItem;

let modoAtalhoItem: string | null = null;
let timerSegurarDedo: ReturnType<typeof setTimeout> | undefined;
let segurouDedo = false;

window.autoShotAtivo = window.autoShotAtivo ?? false;

/** Small AUTO chip above Soulshot/Spiritshot — toggle auto-consume on hit. */
window.toggleAutoShot = function () {
  const telaOly = document.getElementById('tela-olympiad-arena');
  if (telaOly && telaOly.style.display === 'flex') {
    if (typeof window.escreverLog === 'function') {
      window.escreverLog(`<span style="color:#facc15;">${smartbarT('game.smartbar.olympiadShotsDisabled')}</span>`);
    }
    window.autoShotAtivo = false;
    renderizarBarraAtalhos();
    return;
  }

  window.autoShotAtivo = !window.autoShotAtivo;
  if (typeof window.escreverLog === 'function') {
    if (window.autoShotAtivo) {
      if (typeof window.tocarSom === 'function') window.tocarSom('soulshot');
      window.escreverLog(`<span style="color:#60a5fa; font-weight:bold;">${smartbarT('game.smartbar.autoShotOn')}</span>`);
    } else {
      window.escreverLog(`<span style="color:#aaa;">${smartbarT('game.smartbar.autoShotOff')}</span>`);
    }
  }
  renderizarBarraAtalhos();
};

function smartbarT(key: string, params?: Record<string, string | number>): string {
  return typeof window.t === 'function' ? window.t(key, params) : key;
}

function hotbarLabel(slotKey: string): string {
  if (!slotKey) return '';
  return typeof window.hotbarDisplayName === 'function' ? window.hotbarDisplayName(slotKey) : slotKey;
}

/** Pull `src` from catalog icon HTML (`<img src="…">`); null if emoji/legacy markup. */
function skillCatalogIconSrc(skill: SkillCatalogEntry | undefined): string | null {
  const html = String(skill?.icone || '');
  const m = html.match(/src\s*=\s*["']([^"']+)["']/i);
  return m && m[1] ? m[1] : null;
}

function shortcutSkillIconHtml(_nomeSlot: string, skill: SkillCatalogEntry): string {
  const src = skillCatalogIconSrc(skill);
  if (src) {
    const safe = src.replace(/"/g, '&quot;');
    return `<img class="shortcut-slot__icon" src="${safe}" alt="" draggable="false">`;
  }
  // Emoji / non-image fallback — still centered in the rounded slot
  return `<span class="shortcut-slot__glyph">${skill.icone || '•'}</span>`;
}

function shortcutAttackIconSrc(): string {
  // Human Fighter series is the current Attack art; mage set TBD.
  return 'assets/skills/hf_attack.png';
}

/** Persist hotbar slot + refresh combat bar. `key` null clears. */
function assignHotbarSlot(index: number, key: string | null): boolean {
  if (index < 0 || index >= L2MINI_HOTBAR_SLOT_COUNT) return false;
  const next = key && String(key).trim() ? String(key).trim() : null;
  window.barraAtalhos[index] = next;
  renderizarBarraAtalhos();
  if (typeof window.salvarJogo === 'function') window.salvarJogo();
  if (typeof window.renderHotbarEditor === 'function') window.renderHotbarEditor();
  return true;
}

function clearHotbarSlot(index: number): boolean {
  return assignHotbarSlot(index, null);
}

function resolveHotbarEntryIconSrc(nomeSlot: string | null | undefined): string {
  if (!nomeSlot) return '';
  if (nomeSlot === 'Attack') return shortcutAttackIconSrc();
  const skill = window.bancoDeSkills?.[nomeSlot];
  const fromSkill = skillCatalogIconSrc(skill);
  if (fromSkill) return fromSkill;
  return obterImgItemDinamico(nomeSlot);
}

function resolveSmartbarItemDesc(nome: string, itemData: CatalogRow | undefined): string {
  if (typeof window.consumableDescText === 'function') {
    const fromConsumable = window.consumableDescText(nome);
    if (fromConsumable) return fromConsumable;
  }
  if (itemData?.desc) return String(itemData.desc);

  const kAd = window.L2MINI_CURRENCY_BAG_KEYS?.adena || 'Adena';
  const kAc = window.L2MINI_CURRENCY_BAG_KEYS?.ancient || 'Ancient Coin';
  if (nome === 'HP Potion') return smartbarT('game.smartbar.itemDesc.hpPotion');
  if (nome === 'Mana Potion' || nome === 'MP Potion') return smartbarT('game.smartbar.itemDesc.manaPotion');
  if (nome.includes('Recipe')) return smartbarT('game.smartbar.itemDesc.recipe');
  if (nome.includes('Ancient Coin') || nome === kAc) return smartbarT('game.smartbar.itemDesc.ancientCoin');
  if (nome === kAd || nome === 'Adena') return smartbarT('game.smartbar.itemDesc.adena');
  if (nome.includes('Soulshot')) return smartbarT('game.smartbar.itemDesc.soulshot');
  if (nome.includes('Spiritshot')) return smartbarT('game.smartbar.itemDesc.spiritshot');
  return smartbarT('game.smartbar.itemDesc.generic');
}

function smartbarCatalogRows(includeEquips = false): CatalogRow[] {
  const out: CatalogRow[] = [];
  if (window.catalogoConsumiveis) out.push(...(window.catalogoConsumiveis as CatalogRow[]));
  if (window.catalogoScrolls) out.push(...(window.catalogoScrolls as CatalogRow[]));
  if (window.catalogoMateriais) out.push(...(window.catalogoMateriais as CatalogRow[]));
  if (includeEquips) {
    if (window.catalogoArmaduras) out.push(...(window.catalogoArmaduras as CatalogRow[]));
    if (window.catalogoArmas) out.push(...(window.catalogoArmas as CatalogRow[]));
    if (window.catalogoJoias) out.push(...(window.catalogoJoias as CatalogRow[]));
  }
  return out;
}

function findCatalogRow(nome: string): CatalogRow | undefined {
  return smartbarCatalogRows(true).find((i) => i.nome === nome || i.id === nome);
}

function abrirAcaoItemGeral(
  nome: string,
  opts?: { previewQty?: number; previewOnly?: boolean },
): void {
  try {
    const parent = document.getElementById('btn-acao-item')?.parentElement;
    if (parent) {
      parent.querySelectorAll('.btn-acao-extra').forEach((btn) => btn.remove());
    }
  } catch { /* noop */ }

  if (typeof window.abrirModal === 'function') window.abrirModal('janela-item-acao', 2100);
  else {
    const janela = document.getElementById('janela-item-acao');
    if (janela) janela.style.display = 'flex';
  }

  const titulo = document.getElementById('acao-titulo');
  const desc = document.getElementById('acao-desc');
  const img = document.getElementById('acao-img') as HTMLImageElement | null;
  const btnAcao = document.getElementById('btn-acao-item') as HTMLButtonElement | null;
  if (!titulo || !desc || !img || !btnAcao) return;

  const previewOnly = !!opts?.previewOnly;
  const previewQty = opts?.previewQty;

  titulo.innerText = previewOnly
    ? (typeof window.t === 'function' ? window.t('game.inventoryUi.itemInfoTitle') : 'ITEM INFO')
    : smartbarT('game.smartbar.itemOptions');

  const kAd = window.L2MINI_CURRENCY_BAG_KEYS?.adena || 'Adena';
  const kAc = window.L2MINI_CURRENCY_BAG_KEYS?.ancient || 'Ancient Coin';
  const isCurrency = (nome === kAd || nome === kAc);

  const imgSlotEl = document.getElementById('acao-img-slot');
  if (imgSlotEl) {
    if (isCurrency) imgSlotEl.classList.add('l2-currency-modal-slot');
    else imgSlotEl.classList.remove('l2-currency-modal-slot');
  }

  const itemData = findCatalogRow(nome);

  let imgItem = 'assets/npcs/grocer.png';
  if (itemData?.img) imgItem = itemData.img;
  else if (nome === 'HP Potion') imgItem = 'assets/itens/pot_hp.png';
  else if (nome === 'Mana Potion' || nome === 'MP Potion') imgItem = 'assets/itens/pot_mp.png';
  else if (nome.includes('Potion')) imgItem = 'assets/itens/pot_hp.png';
  else if (nome.includes('Recipe')) imgItem = 'assets/itens/recipe_s.png';
  else if (nome.includes('Ancient Coin')) imgItem = 'assets/itens/ancient_coin.png';
  else if (nome === 'Adena') imgItem = 'assets/itens/adena_coin.png';
  else if (nome.includes('Soulshot') || nome.includes('Spiritshot')) {
    imgItem =
      typeof window.shotIconPathForKey === 'function'
        ? window.shotIconPathForKey(nome)
        : 'assets/itens/soulshot_ng.png';
  }

  const displayName = hotbarLabel(nome);
  const textoDesc = resolveSmartbarItemDesc(nome, itemData);

  img.src = imgItem;
  if (isCurrency) img.classList.add('l2-coin-modal');
  else img.classList.remove('l2-coin-modal');

  const hero = document.getElementById('acao-hero');
  const heroName = document.getElementById('acao-hero-name');
  const heroTags = document.getElementById('acao-hero-tags');
  if (hero && heroName && heroTags) {
    heroName.textContent = displayName;
    heroTags.innerHTML = '';
    hero.classList.add('acao-hero--card', 'is-filled');
  }

  let extraBag = '';
  if (isCurrency && !previewOnly) {
    extraBag = `<div class="item-sheet__note">${smartbarT('game.smartbar.currencyNoShortcut')}</div>`;
  }
  const owned = window.inventario[nome] ?? 0;
  const qtyLine = previewQty != null
    ? `<div class="item-sheet__row"><span class="item-sheet__lbl">${typeof window.t === 'function' ? window.t('game.inventoryUi.sheet.inReward', { n: Number(previewQty).toLocaleString() }) : ('In this reward: ' + Number(previewQty).toLocaleString())}</span></div>`
    : `<div class="item-sheet__row"><span class="item-sheet__lbl">${typeof window.t === 'function' ? window.t('game.inventoryUi.sheet.quantity', { n: owned }) : (smartbarT('game.smartbar.quantity') + ' ' + owned)}</span></div>`;
  const flavor = textoDesc
    ? `<div class="item-sheet__flavor">“${String(textoDesc).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}”</div>`
    : '';
  desc.innerHTML = `<div class="item-sheet item-sheet--body"><div class="item-sheet__body">${qtyLine}${flavor}${extraBag}</div></div>`;

  btnAcao.style.display = 'block';
  if (isCurrency || previewOnly) {
    btnAcao.innerText = smartbarT('game.smartbar.closeDetails');
    btnAcao.style.background = 'linear-gradient(180deg, #404040 0%, #262626 100%)';
    btnAcao.style.borderColor = '#737373';
    btnAcao.onclick = function () {
      if (typeof window.fecharJanelaAcao === 'function') window.fecharJanelaAcao();
    };
  } else {
    btnAcao.innerText = smartbarT('game.smartbar.pinToShortcut');
    btnAcao.style.background = 'linear-gradient(180deg, #ca8a04 0%, #854d0e 100%)';
    btnAcao.style.borderColor = '#eab308';
    btnAcao.onclick = function () {
      window.fecharJanelaAcao?.();
      window.abrirSeletorAtalhoGlobal(nome, (index: number) => {
        assignHotbarSlot(index, nome);
        if (typeof window.escreverLog === 'function') {
          window.escreverLog(`<span style="color:#10b981;">${smartbarT('game.smartbar.itemPinnedToSlot', { item: hotbarLabel(nome), slot: String(index + 1) })}</span>`);
        }
      });
    };
  }
}

window.abrirSeletorAtalhoGlobal = function (nomeItem: string, callback: HotbarPinCallback): void {
  const modal = document.getElementById('janela-seletor-atalho-global');
  const grid = document.getElementById('grid-seletor-global');
  const imgPreview = document.getElementById('seletor-global-img') as HTMLImageElement | null;
  const nomePreview = document.getElementById('seletor-global-nome');

  if (!modal || !grid || !imgPreview || !nomePreview) return;

  imgPreview.src = obterImgItemDinamico(nomeItem);
  nomePreview.innerText = hotbarLabel(nomeItem);

  grid.innerHTML = '';
  for (let i = 0; i < L2MINI_HOTBAR_SLOT_COUNT; i++) {
    const nomeSlot = window.barraAtalhos[i];
    let visualSlot = '';

    if (nomeSlot) {
      const skill = window.bancoDeSkills?.[nomeSlot];
      if (skill?.icone) {
        visualSlot = `<div style="font-size: 1.2em; filter: drop-shadow(0 0 2px #000);">${skill.icone}</div>`;
      } else {
        visualSlot = `<img src="${obterImgItemDinamico(nomeSlot)}" style="width: 36px; height: 36px; object-fit: contain; filter: drop-shadow(0 0 2px #000);">`;
      }
    }

    const slot = document.createElement('div');
    slot.className = 'shortcut-slot';
    slot.style.width = '100%';
    slot.style.aspectRatio = '1/1';
    slot.style.border = '1px solid #4a3623';
    slot.style.background = 'linear-gradient(135deg, #1a1410 0%, #0a0806 100%)';
    slot.style.position = 'relative';
    slot.style.borderRadius = '3px';
    slot.style.cursor = 'pointer';
    slot.style.minWidth = '32px';

    slot.innerHTML = `
            <span style="position: absolute; top: 1px; left: 2px; font-size: 8px; color: ${i >= 6 ? '#facc15' : '#88745c'}; font-weight: bold;">${hotbarSlotKeyLabel(i)}</span>
            <div style="display: flex; align-items: center; justify-content: center; width: 100%; height: 100%;">
                ${visualSlot}
            </div>
        `;

    slot.onclick = () => {
      callback(i);
      window.fecharSeletorGlobal();
      if (typeof window.tocarSom === 'function') window.tocarSom('enchant');
    };

    grid.appendChild(slot);
  }

  if (typeof window.abrirModal === 'function') window.abrirModal('janela-seletor-atalho-global', 3000);
  else modal.style.display = 'flex';
};

window.fecharSeletorGlobal = function (): void {
  if (typeof window.fecharModal === 'function') window.fecharModal('janela-seletor-atalho-global');
  else {
    const modal = document.getElementById('janela-seletor-atalho-global');
    if (modal) modal.style.display = 'none';
  }
};

function obterImgItemDinamico(nome: string | null | undefined): string {
  if (!nome) return 'assets/itens/item_generic.png';

  const itemEncontrado = findCatalogRow(nome);
  if (itemEncontrado?.img) return itemEncontrado.img;

  if (nome === 'HP Potion') return 'assets/itens/pot_hp.png';
  if (nome === 'Mana Potion' || nome === 'MP Potion') return 'assets/itens/pot_mp.png';
  if (nome.includes('Potion')) return 'assets/itens/pot_hp.png';
  if (nome.includes('Recipe')) return 'assets/itens/recipe_s.png';
  if (nome.includes('Soulshot') || nome.includes('Spiritshot')) {
    return typeof window.shotIconPathForKey === 'function'
      ? window.shotIconPathForKey(nome)
      : 'assets/itens/soulshot_ng.png';
  }
  if (nome.includes('Ancient Coin')) return 'assets/itens/ancient_coin.png';
  if (nome === 'Adena') return 'assets/itens/adena_coin.png';

  return 'assets/itens/item_generic.png';
}

function applyHotbarCombatDockStyles(container: HTMLElement): void {
  container.style.setProperty('display', 'grid', 'important');
  container.style.position = 'relative';
  container.style.bottom = 'auto';
  container.style.left = 'auto';
  container.style.transform = 'none';
  container.style.width = '100%';
  container.style.zIndex = '1000';
}

function resetHotbarDockStyles(container: HTMLElement): void {
  container.style.removeProperty('position');
  container.style.removeProperty('bottom');
  container.style.removeProperty('left');
  container.style.removeProperty('transform');
  container.style.removeProperty('width');
  container.style.removeProperty('z-index');
}

function isExpeditionHotbarLive(): boolean {
  const exp = (window as Window & {
    ExpeditionEngine?: {
      state?: { active?: boolean; suspended?: boolean };
      isRunEffectsActive?: () => boolean;
    };
  }).ExpeditionEngine;
  if (!exp?.state?.active) return false;
  if (typeof exp.isRunEffectsActive === 'function') return !!exp.isRunEffectsActive();
  return !exp.state.suspended;
}

/** Re-dock hotbar into expedition map/combat panel after render (CSS default is display:none). */
function syncExpeditionHotbarDockIfNeeded(): void {
  const exp = (window as Window & {
    ExpeditionEngine?: {
      state?: { active?: boolean; suspended?: boolean };
      isExpeditionCombatUiActive?: () => boolean;
      syncExpeditionHotbar?: (mode: 'hub' | 'map' | 'combat' | 'idle') => void;
    };
  }).ExpeditionEngine;
  if (!isExpeditionHotbarLive() || typeof exp?.syncExpeditionHotbar !== 'function') return;
  const mode =
    typeof exp.isExpeditionCombatUiActive === 'function' && exp.isExpeditionCombatUiActive()
      ? 'combat'
      : 'map';
  exp.syncExpeditionHotbar(mode);
  const barra = document.getElementById('barra-de-atalhos-dinamica');
  if (barra) barra.style.setProperty('display', 'grid', 'important');
}

function getSkillCdTotal(nomeSlot: string): number {
  if (nomeSlot === 'Attack') return window.playerStats?.atkSpeed ?? 1000;
  const skill = window.bancoDeSkills?.[nomeSlot];
  if (skill?.cd) {
    const base = skill.cd;
    const eng = window.ExpeditionEngine as { getSkillCooldownMs?: (n: number) => number } | undefined;
    if (eng && typeof eng.getSkillCooldownMs === 'function') {
      return eng.getSkillCooldownMs(base);
    }
    return base;
  }
  if (nomeSlot.includes('Potion')) return 15000;
  return 1000;
}

/** Sync cast rails from skillCastUi (safe after full hotbar rebuild). */
function syncHotbarCastRails(): void {
  const ui = window.skillCastUi;
  const now = Date.now();
  let castingName: string | null = null;
  let remainRatio = 0;

  if (ui && ui.name && ui.endsAt > now && ui.totalMs > 0) {
    castingName = ui.name;
    remainRatio = Math.max(0, Math.min(1, (ui.endsAt - now) / ui.totalMs));
  } else {
    // Fallback if skillCastUi not published yet
    const castLeft =
      typeof window.getSkillGcdRemainingMs === 'function' ? window.getSkillGcdRemainingMs() : 0;
    const castTotal = Math.max(
      1,
      typeof window.getActiveSkillCastTotalMs === 'function'
        ? window.getActiveSkillCastTotalMs()
        : Number(window.SKILL_GCD_MS) || 1500,
    );
    castingName =
      castLeft > 0 && typeof window.getSkillGcdCastName === 'function'
        ? window.getSkillGcdCastName()
        : null;
    remainRatio = castLeft > 0 ? Math.max(0, Math.min(1, castLeft / castTotal)) : 0;
  }

  document.querySelectorAll('.shortcut-cast-rail').forEach((railNode) => {
    const rail = railNode as HTMLElement;
    const nome = rail.getAttribute('data-cast-rail');
    const fill = rail.querySelector('.shortcut-cast-rail__fill') as HTMLElement | null;
    const active = !!nome && !!castingName && nome === castingName && remainRatio > 0;
    rail.classList.toggle('shortcut-cast-rail--active', active);
    if (fill) {
      // scaleX avoids CSS width:!important fighting inline width
      fill.style.transform = `scaleX(${active ? remainRatio : 0})`;
    }
  });
}

function renderizarBarraAtalhos(): void {
  try {
    const container = document.getElementById('barra-de-atalhos-dinamica');
    const raidHook = document.getElementById('raid-atalhos-hook');
    const olyHook = document.getElementById('olympiad-atalhos-hook');
    const hotbarHome = document.getElementById('hotbar-home-anchor');

    const arenaRaid = document.getElementById('tela-raid-arena');
    const arenaOly = document.getElementById('tela-olympiad-arena');
    const estaNaRaid = arenaRaid && (arenaRaid.style.display === 'flex' || arenaRaid.style.display === 'block');
    const estaNaOlympiad = arenaOly && arenaOly.style.display === 'flex';

    const expEng = (window as Window & {
      ExpeditionEngine?: {
        state?: { active?: boolean; suspended?: boolean };
        isExpeditionCombatUiActive?: () => boolean;
        syncExpeditionHotbar?: (mode: 'hub' | 'map' | 'combat' | 'idle') => void;
      };
    }).ExpeditionEngine;
    // Parked/suspended runs must NOT steal the global hotbar (Profile/Town would show it).
    const expeditionLive = isExpeditionHotbarLive();
    const expeditionCombat = !!(
      expeditionLive &&
      typeof expEng?.isExpeditionCombatUiActive === 'function' &&
      expEng.isExpeditionCombatUiActive()
    );

    if (container) {
      if (estaNaRaid && raidHook) {
        if (container.parentElement !== raidHook) raidHook.appendChild(container);
        applyHotbarCombatDockStyles(container);
      } else if (estaNaOlympiad && olyHook) {
        if (container.parentElement !== olyHook) olyHook.appendChild(container);
        applyHotbarCombatDockStyles(container);
      } else if (expeditionLive && typeof expEng?.syncExpeditionHotbar === 'function') {
        expEng.syncExpeditionHotbar(expeditionCombat ? 'combat' : 'map');
        applyHotbarCombatDockStyles(container);
      } else if (hotbarHome) {
        if (container.parentElement !== hotbarHome) hotbarHome.appendChild(container);
        resetHotbarDockStyles(container);
      }
    }

    if (!container) return;

    let novoHtml = '';
    const agora = Date.now();

    for (let i = 0; i < L2MINI_HOTBAR_SLOT_COUNT; i++) {
      const nomeSlot = window.barraAtalhos[i];
      const keyLabel = hotbarSlotKeyLabel(i);
      const secondRow = i >= 6;
      let conteudo = '';
      let classExtra = '';
      let styleExtra = '';

      if (nomeSlot) {
        // Icon overlay = personal recharge only. Cast uses the top rail (not the old red wash).
        let pct = 0;
        const personalLeft = Math.max(0, (Number(window.cooldownsAtivos[nomeSlot]) || 0) - agora);
        if (personalLeft > 0) {
          pct = (personalLeft / Math.max(1, getSkillCdTotal(nomeSlot))) * 100;
          if (pct < 0) pct = 0;
          if (pct > 100) pct = 100;
        }

        const htmlTimer = `<div class="cd-timer-text" style="position:absolute; top:50%; left:50%; transform:translate(-50%, -50%); color:#ffcc00; font-weight:900; font-size:14px; font-family:monospace; text-shadow:1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 0px 0px 5px #000; z-index:10; pointer-events:none; display:none;"></div>`;

        if (nomeSlot === 'Attack') {
          let auraAtiva = window.autoAtaqueAtivo === true;
          if (window.ClanWarEngine?.ativo) {
            auraAtiva = !!window.ClanWarEngine.autoAtaqueAtivo;
          }
          if (auraAtiva) classExtra = 'auto-attack-active';

          const imgAtaque = shortcutAttackIconSrc();
          const castRailAttack = `<div class="shortcut-cast-rail" data-cast-rail="Attack" aria-hidden="true"><div class="shortcut-cast-rail__fill"></div></div>`;

          conteudo = `
                        ${castRailAttack}
                        <div class="cd-overlay" data-cd="Attack" style="height: ${pct}%;"></div>
                        ${htmlTimer}
                        <img class="shortcut-slot__icon" src="${imgAtaque}" alt="" draggable="false">
                        <span class="shortcut-key" style="${secondRow ? 'color: #facc15;' : ''}">${keyLabel}</span>
                    `;
        } else {
          const skill = window.bancoDeSkills?.[nomeSlot];
          if (skill) {
            const castRailInside = `<div class="shortcut-cast-rail" data-cast-rail="${String(nomeSlot).replace(/"/g, '&quot;')}" aria-hidden="true"><div class="shortcut-cast-rail__fill"></div></div>`;
            conteudo = `
                        ${castRailInside}
                        <div class="cd-overlay" data-cd="${nomeSlot}" style="height: ${pct}%;"></div>
                        ${htmlTimer}
                        ${shortcutSkillIconHtml(nomeSlot, skill)}
                        <span class="shortcut-key" style="${secondRow ? 'color: #facc15;' : ''}">${keyLabel}</span>
                    `;
            styleExtra = `border-color: ${skill.cor || '#888'}88; box-shadow: inset 0 0 8px ${skill.cor || '#888'}20;`;
          } else {
            let qtd = 0;
            let imgKey = nomeSlot;
            const isShotSlotRow =
              nomeSlot.includes('Soulshot') || nomeSlot.includes('Spiritshot');
            if (isShotSlotRow && typeof window.resolveActiveShotKey === 'function') {
              const isMage =
                typeof window.isClasseMagica === 'function' && window.isClasseMagica(window.charClass);
              imgKey = window.resolveActiveShotKey(!!isMage);
              qtd = window.inventario[imgKey] || 0;
            } else if (nomeSlot === 'MP Potion' && window.inventario['Mana Potion']) {
              qtd = window.inventario['Mana Potion'];
            } else if (nomeSlot === 'Mana Potion' && window.inventario['MP Potion']) {
              qtd = window.inventario['MP Potion'];
            } else {
              qtd = window.inventario[nomeSlot] || 0;
            }

            const imgItem = obterImgItemDinamico(imgKey);
            if (window.autoShotAtivo && isShotSlotRow) {
              classExtra = 'auto-shot-active';
            }

            conteudo = `
                        <div class="cd-overlay" data-cd="${nomeSlot}" style="height: ${pct}%;"></div>
                        ${htmlTimer}
                        <img class="shortcut-slot__icon shortcut-slot__icon--item" src="${imgItem}" alt="" draggable="false">
                        <span class="shortcut-count">${qtd}</span>
                        <span class="shortcut-key" style="${secondRow ? 'color: #facc15;' : ''}">${keyLabel}</span>
                    `;
          }
        }
      } else {
        conteudo = `<span class="shortcut-key" style="color:#333; ${secondRow ? 'color: #665544;' : ''}">${keyLabel}</span>`;
      }

      const slotHtml = `
                <div class="shortcut-slot ${classExtra}" style="${styleExtra}"
                     ${nomeSlot ? `title="${hotbarLabel(nomeSlot).replace(/"/g, '&quot;')}"` : ''}
                     onmousedown="iniciarToqueAtalho(${i})"
                     onmouseup="soltarToqueAtalho(${i})"
                     onmouseleave="cancelarToqueAtalho()"
                     ontouchstart="iniciarToqueAtalho(${i})"
                     ontouchend="event.preventDefault(); soltarToqueAtalho(${i})">
                    ${conteudo}
                </div>
            `;

      // AUTO chips sit above Attack / Soulshot|Spiritshot. Olympiad: no attack auto chip; shots disabled entirely.
      const naGuerraHotbar = !!window.ClanWarEngine?.ativo;
      const isShotSlot =
        !!nomeSlot && (nomeSlot.includes('Soulshot') || nomeSlot.includes('Spiritshot'));
      const showAttackAutoChip =
        nomeSlot === 'Attack' && !estaNaOlympiad && !naGuerraHotbar;
      const showShotAutoChip = isShotSlot && !estaNaOlympiad;

      if (showAttackAutoChip || showShotAutoChip) {
        const autoOn = showAttackAutoChip
          ? window.autoAtaqueAtivo === true
          : window.autoShotAtivo === true;
        const autoLabel = smartbarT('game.smartbar.autoAttackChip');
        const autoTitle = showAttackAutoChip
          ? (autoOn
            ? smartbarT('game.smartbar.autoAttackChipTitleOn')
            : smartbarT('game.smartbar.autoAttackChipTitleOff'))
          : (autoOn
            ? smartbarT('game.smartbar.autoShotChipTitleOn')
            : smartbarT('game.smartbar.autoShotChipTitleOff'));
        const toggleFn = showAttackAutoChip ? 'toggleAutoAtaque' : 'toggleAutoShot';
        const onClass = showShotAutoChip ? 'is-on is-on-shot' : 'is-on';
        const stackMod = showShotAutoChip ? 'shortcut-slot-stack--shot' : 'shortcut-slot-stack--attack';
        novoHtml += `
                <div class="shortcut-slot-stack ${stackMod}">
                    <button type="button"
                        class="hotbar-auto-atk-btn${autoOn ? ` ${onClass}` : ''}"
                        title="${autoTitle.replace(/"/g, '&quot;')}"
                        aria-pressed="${autoOn ? 'true' : 'false'}"
                        aria-label="${autoTitle.replace(/"/g, '&quot;')}"
                        onmousedown="event.stopPropagation();"
                        ontouchstart="event.stopPropagation();"
                        onclick="event.stopPropagation(); event.preventDefault(); if (typeof window.${toggleFn} === 'function') window.${toggleFn}();">
                        ${autoLabel}
                    </button>
                    ${slotHtml}
                </div>
            `;
      } else {
        novoHtml += slotHtml;
      }
    }
    container.innerHTML = novoHtml;
    invalidateHotbarCdOverlayCache();
    syncHotbarCastRails();
    kickHotbarCdLoop();

    if (!estaNaRaid && !estaNaOlympiad) {
      syncExpeditionHotbarDockIfNeeded();
    }
  } catch (erro) {
    console.error('Error drawing shortcuts:', erro);
  }
}

function hotbarKeyboardInputEnabled(): boolean {
  if (typeof window.matchMedia !== 'function') return true;
  return !window.matchMedia('(hover: none) and (pointer: coarse)').matches;
}

function hotbarSlotKeyLabel(index: number): string {
  const n = index + 1;
  return hotbarKeyboardInputEnabled() ? `F${n}` : String(n);
}

function isTypingInFormField(): boolean {
  const el = document.activeElement;
  if (!el || !(el instanceof HTMLElement)) return false;
  const tag = el.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
  return el.isContentEditable;
}

function isPlayerInGameScreen(): boolean {
  const game = document.getElementById('screen-game');
  return !!(game && game.classList.contains('active-screen'));
}

function fnKeyToHotbarIndex(key: string): number | null {
  const match = /^F(\d{1,2})$/i.exec(key);
  if (!match) return null;
  const n = parseInt(match[1], 10);
  if (!Number.isFinite(n) || n < 1 || n > L2MINI_HOTBAR_SLOT_COUNT) return null;
  return n - 1;
}

/** Dispara o atalho do slot (toque curto ou tecla F1–F12 no PC). */
function ativarAtalhoSlot(index: number): void {
  if (index < 0 || index >= L2MINI_HOTBAR_SLOT_COUNT) return;

  if (modoAtalhoItem) {
    const pinned = modoAtalhoItem;
    modoAtalhoItem = null;
    const barra = document.getElementById('barra-de-atalhos-dinamica');
    if (barra) barra.classList.remove('glow-yellow');
    assignHotbarSlot(index, pinned);
    if (typeof window.escreverLog === 'function') {
      window.escreverLog(`<span style="color:#10b981;">${smartbarT('game.smartbar.pinnedToSlot', { slot: String(index + 1) })}</span>`);
    }
    return;
  }

  const nomeSlot = window.barraAtalhos[index];
  if (!nomeSlot) return;

  const naRaid = !!window.RaidEngine?.ativo;
  const naOlympiad = !!window.OlympiadEngine?.ativo;
  const naGuerra = !!window.ClanWarEngine?.ativo;

  if (nomeSlot === 'Attack') {
    // Attack uses atkSpeed swing CD (cooldownsAtivos). Olympiad/Raid enforce their own locks.
    if (naOlympiad) window.OlympiadEngine?.playerAtaca?.();
    else if (naRaid) {
      if (typeof window.atacar === 'function') window.atacar();
      else window.RaidEngine?.playerAtaca?.();
    } else if (naGuerra) window.ClanWarEngine?.usarSkillPlayer?.('Attack');
    else {
      window.atacar?.();
    }
  } else {
    const skill = window.bancoDeSkills?.[nomeSlot];
    if (skill) {
      if (naOlympiad) window.OlympiadEngine?.playerUsaSkill?.(nomeSlot);
      else if (naGuerra) window.ClanWarEngine?.usarSkillPlayer?.(nomeSlot);
      else if (naRaid) executarSkillNaRaid(nomeSlot, skill);
      else if (typeof window.usarSkill === 'function') window.usarSkill(nomeSlot);
    } else {
      let nomeReal = nomeSlot;
      if (nomeSlot === 'MP Potion' && window.inventario['Mana Potion']) nomeReal = 'Mana Potion';
      if (nomeSlot === 'Mana Potion' && window.inventario['MP Potion']) nomeReal = 'MP Potion';

      const qtdAtual = window.inventario[nomeReal] || 0;

      if (qtdAtual <= 0 && !nomeSlot.includes('shot')) {
        if (typeof window.escreverLog === 'function') {
          window.escreverLog(`<span style="color:#ef4444; font-weight:bold; font-size:0.9em;">${smartbarT('game.smartbar.emptyStock', { item: hotbarLabel(nomeSlot) })}</span>`);
        }
        return;
      }

      if (nomeSlot === 'HP Potion') {
        if (typeof window.usarPocao === 'function') window.usarPocao();
      } else if (nomeSlot === 'Mana Potion' || nomeSlot === 'MP Potion') {
        if (typeof window.usarPocaoMP === 'function') window.usarPocaoMP(nomeSlot);
      } else if (nomeSlot.includes('Soulshot') || nomeSlot.includes('Spiritshot')) {
        // Slot tap keeps toggle for F-keys; primary UX is the AUTO chip above the shot.
        if (typeof window.toggleAutoShot === 'function') window.toggleAutoShot();
      }
    }
  }
}

function installHotbarKeyboardBindings(): void {
  if ((window as Window & { _hotbarKeyboardBound?: boolean })._hotbarKeyboardBound) return;
  (window as Window & { _hotbarKeyboardBound?: boolean })._hotbarKeyboardBound = true;

  document.addEventListener('keydown', (e) => {
    if (!hotbarKeyboardInputEnabled()) return;
    if (e.repeat) return;
    if (!isPlayerInGameScreen()) return;
    if (isTypingInFormField()) return;

    const index = fnKeyToHotbarIndex(e.key);
    if (index == null) return;

    e.preventDefault();
    ativarAtalhoSlot(index);
  });
}

installHotbarKeyboardBindings();

function iniciarToqueAtalho(index: number): void {
  if (timerSegurarDedo) clearTimeout(timerSegurarDedo);
  segurouDedo = false;

  timerSegurarDedo = setTimeout(() => {
    const telaFloresta = document.getElementById('tela-floresta');
    const telaRaid = document.getElementById('tela-raid-arena');
    const telaOlympiad = document.getElementById('tela-olympiad-arena');

    const estaNaFloresta = telaFloresta && telaFloresta.style.display === 'flex';
    const estaNaRaid = telaRaid && telaRaid.style.display === 'flex';
    const estaNaOlympiad = telaOlympiad && telaOlympiad.style.display === 'flex';
    const estaNaGuerra = !!window.ClanWarEngine?.ativo;

    if (estaNaFloresta || estaNaRaid || estaNaOlympiad || estaNaGuerra || (window.monstrosAtivos && window.monstrosAtivos.length > 0)) {
      if (typeof window.escreverLog === 'function') {
        window.escreverLog(`<span style="color:#fcd34d; font-size:0.9em;">${smartbarT('game.smartbar.shortcutsLocked')}</span>`);
      }
      segurouDedo = true;
      return;
    }

    segurouDedo = true;
    const slotItem = window.barraAtalhos[index];
    if (slotItem && !modoAtalhoItem) {
      if (slotItem.includes('shot')) window.autoShotAtivo = false;
      if (typeof window.escreverLog === 'function') {
        window.escreverLog(`<span style="color:#ef4444;">${smartbarT('game.smartbar.removedFromSlot', { item: hotbarLabel(slotItem), slot: String(index + 1) })}</span>`);
      }
      clearHotbarSlot(index);
    }
  }, LONG_PRESS_MS);
}

function executarSkillNaRaid(nomeSlot: string, skill: SkillCatalogEntry): void {
  const agora = Date.now();
  if (typeof window.isSkillGcdBlocked === 'function' && window.isSkillGcdBlocked()) return;
  if (window.cooldownsAtivos[nomeSlot] && window.cooldownsAtivos[nomeSlot] > agora) return;
  if (window.playerMP < (skill.mp || 0)) {
    if (typeof window.escreverLog === 'function') {
      window.escreverLog(`<span style="color:#3b82f6; font-size:10px;">${smartbarT('game.smartbar.insufficientMp', { skill: hotbarLabel(nomeSlot) })}</span>`);
    }
    return;
  }

  window.playerMP -= skill.mp || 0;
  if (typeof window.atualizar === 'function') window.atualizar();

  const launch = () => {
    if (window.playerHP <= 0) return;
    const raidNow = window.RaidEngine;
    const bossNow = raidNow?.bossData;
    if (!raidNow || !bossNow) return;

    if (typeof window.escreverLog === 'function') {
      window.escreverLog(`<span style="color:${skill.cor || '#fff'}; font-weight:bold;">${smartbarT('game.smartbar.youCast', { skill: hotbarLabel(nomeSlot) })}</span>`);
    }

    if (skill.tipo !== 'cura' && skill.tipo !== 'buff') {
      const isMage = typeof window.isClasseMagica === 'function'
        ? window.isClasseMagica(window.charClass)
        : false;
      const danoBruto = isMage ? window.playerStats.mAtk : window.playerStats.pAtk;
      const multSkill = skill.danoMult || 1.5;
      const defDoBoss = isMage ? bossNow.mDef : bossNow.pDef;

      const multiplicadorDefesa = 1000 / (1000 + defDoBoss);
      let danoFinal = Math.floor(danoBruto * multSkill * multiplicadorDefesa);

      const roll =
        typeof window.rollSkillDamageCrit === 'function'
          ? window.rollSkillDamageCrit({ skillName: nomeSlot, isMagic: !!isMage })
          : { isCrit: Math.random() * 100 <= (window.playerStats.critRate || 0), damageMult: isMage ? 1.5 : 2 };
      if (roll.isCrit) {
        danoFinal = Math.floor(danoFinal * roll.damageMult);
        raidNow.escreverLogRaid(`<span style="color:${skill.cor || '#fff'}; font-weight:bold;">${smartbarT('game.raid.criticalSkillDamage', { damage: danoFinal })}</span>`);
        if (typeof window.tocarSomCritico === 'function') window.tocarSomCritico();
        raidNow.mostrarDanoVisual?.(danoFinal, true);
      } else {
        raidNow.escreverLogRaid(smartbarT('game.raid.magicDamageBoss', { damage: danoFinal }));
        raidNow.mostrarDanoVisual?.(danoFinal, false);
      }
      raidNow.receberDanoBoss(danoFinal, true);
    } else if (skill.tipo === 'cura') {
      const cura = skill.curaFixa || Math.floor(window.playerStats.mAtk * (skill.curaMult || 1));
      window.playerHP += cura;
      if (window.playerHP > window.playerStats.maxHp) window.playerHP = window.playerStats.maxHp;
      raidNow.escreverLogRaid(`<span style="color:#10b981; font-weight:bold;">${smartbarT('game.raid.healFor', { amount: cura })}</span>`);
      if (typeof window.atualizar === 'function') window.atualizar();
    }
  };

  const castMs =
    typeof window.resolveSkillCastMs === 'function'
      ? window.resolveSkillCastMs(skill)
      : 1500;
  if (typeof window.beginSkillCast === 'function') {
    window.beginSkillCast(nomeSlot, skill.cd || 1000, castMs, launch);
  } else {
    window.globalCooldownAtivo = Date.now() + Math.max(200, castMs || 1500);
    window.dispararAnimacaoCooldown(nomeSlot, skill.cd || 1000);
    launch();
  }
}

function soltarToqueAtalho(index: number): void {
  if (timerSegurarDedo) clearTimeout(timerSegurarDedo);
  if (!segurouDedo) {
    ativarAtalhoSlot(index);
  }
}

function cancelarToqueAtalho(): void {
  if (timerSegurarDedo) clearTimeout(timerSegurarDedo);
}

const HOTBAR_CD_FAST_MS = 50;
const HOTBAR_CD_IDLE_MS = 250;

let _hotbarCdLoopTimer: ReturnType<typeof setTimeout> | null = null;
let _hotbarCdOverlays: HTMLElement[] | null = null;
let _hotbarCdBusy = false;

function invalidateHotbarCdOverlayCache(): void {
  _hotbarCdOverlays = null;
}

function getHotbarCdOverlays(): HTMLElement[] {
  if (!_hotbarCdOverlays) {
    _hotbarCdOverlays = Array.from(document.querySelectorAll('.cd-overlay')) as HTMLElement[];
  }
  return _hotbarCdOverlays;
}

function hotbarHasActiveVisuals(agora: number): boolean {
  const ui = window.skillCastUi;
  if (ui && ui.name && ui.endsAt > agora) return true;
  if (typeof window.isAttackWindupActive === 'function' && window.isAttackWindupActive()) {
    return true;
  }
  if (typeof window.getSkillGcdRemainingMs === 'function' && window.getSkillGcdRemainingMs() > 0) {
    return true;
  }
  const cds = window.cooldownsAtivos;
  if (!cds) return false;
  for (const k of Object.keys(cds)) {
    if ((Number(cds[k]) || 0) > agora) return true;
  }
  return false;
}

function paintHotbarCooldownOverlays(agora: number): void {
  syncHotbarCastRails();
  const overlays = getHotbarCdOverlays();
  for (let i = 0; i < overlays.length; i++) {
    const el = overlays[i];
    if (!el) continue;
    const nome = el.getAttribute('data-cd');
    if (!nome) continue;
    const timerText = el.nextElementSibling as HTMLElement | null;

    // Personal recharge only (grey). Never paint cast as red overlay on the icon.
    const personalLeft = Math.max(0, (Number(window.cooldownsAtivos[nome]) || 0) - agora);
    el.classList.remove('cd-overlay--cast');

    if (personalLeft > 0) {
      const totalMs = getSkillCdTotal(nome);
      let porcentagem = (personalLeft / Math.max(1, totalMs)) * 100;
      if (porcentagem < 0) porcentagem = 0;
      if (porcentagem > 100) porcentagem = 100;
      el.style.height = porcentagem + '%';
      el.style.width = '100%';

      if (timerText?.classList.contains('cd-timer-text')) {
        if (nome !== 'Attack') {
          timerText.innerText = (personalLeft / 1000).toFixed(1);
          timerText.style.display = 'block';
          timerText.classList.remove('cd-timer-text--cast');
        } else {
          timerText.style.display = 'none';
          timerText.classList.remove('cd-timer-text--cast');
        }
      }
    } else {
      el.style.height = '0%';
      if (timerText?.classList.contains('cd-timer-text')) {
        timerText.style.display = 'none';
        timerText.classList.remove('cd-timer-text--cast');
      }
    }
  }
}

function scheduleHotbarCdLoop(delayMs: number): void {
  if (_hotbarCdLoopTimer != null) clearTimeout(_hotbarCdLoopTimer);
  _hotbarCdLoopTimer = setTimeout(tickHotbarCooldownLoop, delayMs);
}

function tickHotbarCooldownLoop(): void {
  const agora = Date.now();
  const busy = hotbarHasActiveVisuals(agora);
  if (busy || _hotbarCdBusy) {
    paintHotbarCooldownOverlays(agora);
  }
  _hotbarCdBusy = busy;
  scheduleHotbarCdLoop(busy ? HOTBAR_CD_FAST_MS : HOTBAR_CD_IDLE_MS);
}

/** Wake CD/cast rails immediately when a skill/CD starts (avoids idle 250ms lag). */
function kickHotbarCdLoop(): void {
  scheduleHotbarCdLoop(0);
}

window.dispararAnimacaoCooldown = function (nome: string, tempoMs: number): void {
  window.cooldownsAtivos[nome] = Date.now() + tempoMs;
  kickHotbarCdLoop();
};

/** Personal swing/skill CD animation (not the shared skill GCD). */
window.dispararAnimacaoGCD = function (tempoMs: number, nome: string): void {
  window.dispararAnimacaoCooldown(nome, tempoMs);
};

window.kickHotbarCdLoop = kickHotbarCdLoop;
scheduleHotbarCdLoop(HOTBAR_CD_IDLE_MS);

window.renderizarBarraAtalhos = renderizarBarraAtalhos;
window.iniciarToqueAtalho = iniciarToqueAtalho;
window.soltarToqueAtalho = soltarToqueAtalho;
window.cancelarToqueAtalho = cancelarToqueAtalho;
window.abrirAcaoItemGeral = abrirAcaoItemGeral;
window.assignHotbarSlot = assignHotbarSlot;
window.clearHotbarSlot = clearHotbarSlot;
window.resolveHotbarEntryIconSrc = resolveHotbarEntryIconSrc;
window.obterImgItemDinamico = obterImgItemDinamico;

export {};
