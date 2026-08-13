/**
 * UI — crafting (Maestro Reorin)
 * Migrado: js/ui_craft.js — Fase 4: tipos explícitos.
 */

import type {
  CraftCategory,
  CraftCreditResult,
  CraftItemRpcResult,
  CraftRecipe,
  CraftResultChoice,
  ItemCatalogBase,
} from '../types/game';

let receitaSelecionada: CraftRecipe | null = null;
let categoriaSelecionada: CraftCategory = 'special';
/** idBase escolhido em receitas com `escolhasResultado` (Vesper arma/joia unificadas). */
let craftVesperEscolhaIdBase: string | null = null;

function craftT(key: string, params?: Record<string, string | number>): string {
  return typeof window.t === 'function' ? window.t(key, params) : key;
}

function receitasDaCategoria(categoria: string): CraftRecipe[] {
  if (!window.catalogoReceitas) return [];
  return window.catalogoReceitas[categoria] || [];
}

function abrirJanelaCraft(categoria: CraftCategory = 'consumables'): void {
  window.abrirModal('janela-craft', 1500);
  mudarAbaCraft(categoria);
}

function fecharJanelaCraft(): void {
  window.fecharModal('janela-craft');
  receitaSelecionada = null;
  craftVesperEscolhaIdBase = null;
}

function syncCraftTabUi(categoria: CraftCategory): void {
  const tabs: { id: string; cat: CraftCategory }[] = [
    { id: 'tab-craft-consumables', cat: 'consumables' },
    { id: 'tab-craft-mats', cat: 'mats' },
    { id: 'tab-craft-special', cat: 'special' },
  ];
  for (const row of tabs) {
    const el = document.getElementById(row.id);
    if (!el) continue;
    const on = row.cat === categoria;
    el.classList.toggle('is-active', on);
    el.setAttribute('aria-selected', on ? 'true' : 'false');
    // Clear legacy inline styles from older builds
    el.style.background = '';
    el.style.borderColor = '';
    el.style.color = '';
  }
  const hint = document.getElementById('craft-tab-hint');
  if (hint) {
    const hintKey =
      categoria === 'consumables'
        ? 'game.craft.hintConsumables'
        : categoria === 'mats'
          ? 'game.craft.hintMats'
          : 'game.craft.hintSpecial';
    hint.textContent = craftT(hintKey);
  }
}

function mudarAbaCraft(categoria: CraftCategory): void {
  categoriaSelecionada = categoria;
  craftVesperEscolhaIdBase = null;
  syncCraftTabUi(categoria);

  const grid = document.getElementById('craft-receitas-grid');
  if (!grid) return;
  grid.innerHTML = '';

  const filtradas = receitasDaCategoria(categoria);

  if (!filtradas.length) {
    grid.innerHTML = `<div class="craft-empty">${craftT('game.craft.emptyCategory')}</div>`;
  } else {
    filtradas.forEach((rec) => {
      const safeId = String(rec.idReceita || '').replace(/'/g, '');
      grid.innerHTML += `<button type="button" class="store-item-slot" data-recipe-id="${safeId}" title="${rec.nome}" onclick="selecionarReceita('${safeId}')"><img src="${rec.img || ''}" alt="" onerror="this.src='assets/itens/item_generic.png'"></button>`;
    });
  }

  const detalhe = document.getElementById('craft-detalhe-texto');
  if (detalhe) detalhe.innerHTML = craftT('game.craft.selectRecipeHint');
  const ingHost = document.getElementById('craft-ingredientes');
  if (ingHost) ingHost.innerHTML = '';
  const btnExec = document.getElementById('btn-executar-craft');
  if (btnExec) {
    btnExec.style.display = 'none';
    btnExec.classList.remove('is-ready');
  }
  receitaSelecionada = null;
  const wrapEsc = document.getElementById('craft-escolha-vesper');
  if (wrapEsc) {
    wrapEsc.style.display = 'none';
    wrapEsc.innerHTML = '';
  }
}

function obterQtdIngrediente(id: string): number {
  if (id === 'Ancient Coin') return typeof window.ancientCoins !== 'undefined' ? window.ancientCoins : 0;
  if (id === 'Adena') return typeof window.adenas !== 'undefined' ? window.adenas : 0;
  return window.inventario[id] || 0;
}

function consumirIngrediente(id: string, qtd: number): void {
  if (id === 'Ancient Coin') {
    window.ancientCoins -= qtd;
  } else if (id === 'Adena') {
    window.adenas -= qtd;
  } else {
    window.inventario[id] -= qtd;
    if (window.inventario[id] <= 0) delete window.inventario[id];
  }
}

function noneMatch(choices: CraftResultChoice[], idBase: string | null): boolean {
  return !choices.some(o => o.idBase === idBase);
}

function renderPainelEscolhaVesper(): void {
  const wrap = document.getElementById('craft-escolha-vesper');
  if (!wrap) return;

  if (receitaSelecionada && Array.isArray(receitaSelecionada.escolhasResultado) && receitaSelecionada.escolhasResultado.length > 0) {
    const choices = receitaSelecionada.escolhasResultado;
    if (!craftVesperEscolhaIdBase || noneMatch(choices, craftVesperEscolhaIdBase)) {
      craftVesperEscolhaIdBase = choices[0].idBase;
    }
    const lab = craftT('game.craft.outputLabel');
    const opts = choices.map(o => `<option value="${o.idBase}">${o.label}</option>`).join('');
    wrap.style.display = 'block';
    wrap.innerHTML = `
            <label style="color:#e5e7eb;font-size:0.85em;display:block;margin-bottom:4px;">${lab}</label>
            <select id="craft-select-vesper" class="btn-l2" style="width:100%;padding:8px;font-size:0.85em;background:#1a1410;color:#facc15;border:1px solid #854d0e;box-sizing:border-box;" onchange="craftOnVesperVariantChange(this.value)">${opts}</select>`;
    const sel = document.getElementById('craft-select-vesper') as HTMLSelectElement | null;
    if (sel && craftVesperEscolhaIdBase) sel.value = craftVesperEscolhaIdBase;
  } else {
    wrap.style.display = 'none';
    wrap.innerHTML = '';
    craftVesperEscolhaIdBase = null;
  }
}

function atualizarListaIngredientesCraft(): void {
  if (!receitaSelecionada) return;

  let htmlIngredientes = '';
  let podeCraftar = true;

  receitaSelecionada.ingredientes.forEach((ing) => {
    const qtdPossui = obterQtdIngrediente(ing.id);
    const ok = qtdPossui >= ing.qtd;
    if (!ok) podeCraftar = false;

    const icone = ing.id === 'Ancient Coin' ? '🪙 ' : (ing.id === 'Adena' ? '💰 ' : '');

    htmlIngredientes += `
            <div class="craft-ing-row">
                <span class="craft-ing-row__name">${icone}${ing.id}</span>
                <span class="craft-ing-row__qty ${ok ? 'is-ok' : 'is-short'}">${qtdPossui.toLocaleString()} / ${ing.qtd.toLocaleString()}</span>
            </div>
        `;
  });

  const ingHost = document.getElementById('craft-ingredientes');
  if (ingHost) ingHost.innerHTML = htmlIngredientes;

  const btnExecutar = document.getElementById('btn-executar-craft') as HTMLButtonElement | null;
  if (!btnExecutar) return;
  btnExecutar.style.display = 'block';
  btnExecutar.classList.add('is-ready');
  btnExecutar.style.background = '';
  btnExecutar.style.borderColor = '';
  btnExecutar.style.color = '';

  if (podeCraftar) {
    btnExecutar.disabled = false;
    btnExecutar.innerText = craftT('game.craft.forgeItem');
  } else {
    btnExecutar.disabled = true;
    btnExecutar.innerText = craftT('game.craft.needMaterials');
  }
}

function buscarBaseDoEquipamento(idBase: string): ItemCatalogBase | null {
  let equipamento: ItemCatalogBase | null = null;
  if (window.catalogoArmaduras) equipamento = window.catalogoArmaduras.find(a => a.id === idBase) || null;
  if (!equipamento && window.catalogoArmas) equipamento = window.catalogoArmas.find(a => a.id === idBase) || null;
  if (!equipamento && window.catalogoJoias) equipamento = window.catalogoJoias.find(a => a.id === idBase) || null;
  return equipamento;
}

function selecionarReceita(id: string): void {
  const lista = receitasDaCategoria(categoriaSelecionada);
  receitaSelecionada = lista.find(r => r.idReceita === id) || null;
  if (!receitaSelecionada) return;

  craftVesperEscolhaIdBase = null;

  const grid = document.getElementById('craft-receitas-grid');
  if (grid) {
    grid.querySelectorAll('.store-item-slot').forEach((slot) => {
      const el = slot as HTMLElement;
      el.classList.toggle('is-selected', el.getAttribute('data-recipe-id') === id);
    });
  }

  const taxa = receitaSelecionada.taxaSucesso != null ? Number(receitaSelecionada.taxaSucesso) : 100;
  const rateLine = taxa >= 100
    ? craftT('game.craft.successRate')
    : craftT('game.craft.successRatePct', { pct: taxa });
  const warnFail = taxa < 100 ? craftT('game.craft.mintFailWarning') : '';
  const detalhe = document.getElementById('craft-detalhe-texto');
  if (detalhe) {
    detalhe.innerHTML = `
        <span class="craft-recipe-name">${receitaSelecionada.nome}</span>
        <span class="craft-recipe-desc">${receitaSelecionada.desc || ''}</span>
        <span class="craft-recipe-rate ${taxa < 100 ? 'is-risk' : 'is-safe'}">${rateLine}</span>
        ${warnFail ? `<span class="craft-recipe-warn">${warnFail}</span>` : ''}
    `;
  }

  renderPainelEscolhaVesper();
  atualizarListaIngredientesCraft();
}

function consumirIngredientesReceita(): void {
  if (!receitaSelecionada) return;
  receitaSelecionada.ingredientes.forEach(function (ing) {
    consumirIngrediente(ing.id, ing.qtd);
  });
}

function creditarResultadoCraftLocal(tipoGerado: string, idBaseGerado: string, qtdGerada: number): CraftCreditResult {
  let nomeGerado = '';
  let imgGerada = receitaSelecionada?.img;

  if (tipoGerado === 'material') {
    if (idBaseGerado === 'Ancient Coin') {
      window.ancientCoins = (Number(window.ancientCoins) || 0) + qtdGerada;
      nomeGerado = craftT('game.craft.mintResultName');
      imgGerada = 'assets/itens/ancient_coin.png';
    } else {
      if (window.InventoryManager && typeof window.InventoryManager.adicionarStack === 'function') {
        window.InventoryManager.adicionarStack(idBaseGerado, qtdGerada);
      } else {
        window.inventario[idBaseGerado] = (window.inventario[idBaseGerado] || 0) + qtdGerada;
      }
      nomeGerado =
        typeof window.consumableDisplayName === 'function'
          ? window.consumableDisplayName(idBaseGerado)
          : idBaseGerado;
    }
  } else {
    const baseEquip = buscarBaseDoEquipamento(idBaseGerado);
    if (baseEquip) {
      let tipoInst = tipoGerado;
      if (tipoGerado === 'jewel' && baseEquip.tipoItem) tipoInst = String(baseEquip.tipoItem);
      window.InventoryManager.adicionarEquipamento({
        tipo: tipoInst,
        base: baseEquip,
        enchant: 0,
        augmented: false,
        origin: 'Craft',
      });
      nomeGerado = String(baseEquip.nome || idBaseGerado);
      imgGerada = baseEquip.img as string | undefined;
    } else {
      console.error('Error: Base gear not found in DB! ID:', idBaseGerado);
      nomeGerado = 'Mystery Item';
    }
  }
  return { nomeGerado, imgGerada };
}

function registrarProgressoMintMissaoSeAplicavel(): void {
  if (receitaSelecionada && receitaSelecionada.idReceita === 'rec_mint_ancient_coin'
    && typeof window.registrarProgressoMissaoDiaria === 'function') {
    window.registrarProgressoMissaoDiaria('tentar_mint', 1);
  }
}

function registrarProgressoCraftMissao(): void {
  if (typeof window.registrarProgressoMissaoDiaria === 'function') {
    window.registrarProgressoMissaoDiaria('craft_item', 1);
  }
  registrarProgressoMintMissaoSeAplicavel();
}

function falhaCraftComMateriaisConsumidos(): void {
  if (typeof window.escreverLog === 'function') {
    const logLine = craftT('game.craft.logMintFailed');
    window.escreverLog('<span style="color:#ef4444; font-weight:bold;">' + logLine + '</span>');
  }
  if (typeof window.atualizar === 'function') window.atualizar();
  if (typeof window.salvarJogo === 'function') window.salvarJogo();
  if (typeof window.l2Alert === 'function') {
    window.l2Alert(craftT('game.craft.mintFailed'));
  }
  renderPainelEscolhaVesper();
  atualizarListaIngredientesCraft();
}

function _rpcErrorMessage(error: unknown): string {
  if (error && typeof error === 'object' && 'message' in error) {
    return String((error as { message?: unknown }).message || error);
  }
  return String(error);
}

async function executarCraft(): Promise<void> {
  if (!receitaSelecionada) return;

  let qtdGerada = 1;
  let tipoGerado: string | null = null;
  let idBaseGerado: string | null = null;

  const ir = receitaSelecionada.itemResultado;
  const esc = receitaSelecionada.escolhasResultado;

  if (ir && ir.tipoBase === 'material') {
    tipoGerado = 'material';
    idBaseGerado = ir.idBase;
    qtdGerada = ir.gerado || 1;
  } else if (Array.isArray(esc) && esc.length > 0) {
    const pick = esc.find(o => o.idBase === craftVesperEscolhaIdBase) || esc[0];
    tipoGerado = pick.tipoBase;
    idBaseGerado = pick.idBase;
  } else if (ir) {
    tipoGerado = ir.tipoBase;
    idBaseGerado = ir.idBase;
    qtdGerada = ir.gerado || 1;
  } else {
    if (typeof window.mostrarAviso === 'function') {
      window.mostrarAviso(craftT('game.craft.invalidRecipe'));
    }
    return;
  }

  if (!tipoGerado || !idBaseGerado) return;

  let podeCraftar = true;
  receitaSelecionada.ingredientes.forEach(ing => {
    if (obterQtdIngrediente(ing.id) < ing.qtd) podeCraftar = false;
  });

  if (!podeCraftar) {
    if (typeof window.mostrarAviso === 'function') {
      window.mostrarAviso(craftT('game.craft.notEnoughMaterials'));
    }
    return;
  }

  const btnExecutar = document.getElementById('btn-executar-craft') as HTMLButtonElement | null;
  if (btnExecutar) {
    btnExecutar.disabled = true;
    btnExecutar.innerText = craftT('game.craft.forging');
  }

  const taxaSucesso = receitaSelecionada.taxaSucesso != null ? Number(receitaSelecionada.taxaSucesso) : 100;
  const recipe = receitaSelecionada;
  // Consumable packs: clientAuthority (not in craft_item_secure yet). Debt: RPC §12.7.
  const useCloudRpc = !!(
    window.SupabaseAPI
    && window.SupabaseAPI.getUser()
    && window.charName
    && typeof window.SupabaseAPI.craftItem === 'function'
    && recipe.clientAuthority !== true
  );

  if (useCloudRpc) {
    try {
      const { data, error } = await window.SupabaseAPI.craftItem(
        window.charName,
        recipe.idReceita,
        craftVesperEscolhaIdBase,
      );

        if (error) {
        console.error('[Craft RPC Error]', error);
        if (typeof window.l2Alert === 'function') {
          const msg = typeof window.cloudRpcMessage === 'function'
            ? window.cloudRpcMessage(error, { prefix: 'game.craft.error', fallbackKey: 'game.craft.error.unknown', keyStyle: 'dot' })
            : craftT('game.craft.error.unknown');
          window.l2Alert(msg);
        }
        if (btnExecutar) {
          btnExecutar.disabled = false;
          btnExecutar.innerText = craftT('game.craft.forgeItem');
        }
        return;
      }

      const payload = data as CraftItemRpcResult | null;

      if (payload && payload.success === false && payload.error === 'mint_failed') {
        window.adenas = Math.max(0, Math.floor(Number(payload.adenas)));
        window.ancientCoins = Math.max(0, Math.floor(Number(payload.ancientCoins)));
        if (payload.inventario && typeof payload.inventario === 'object' && !Array.isArray(payload.inventario)) {
          window.inventario = Object.assign({}, payload.inventario);
        }
        if (typeof window.syncMoedasInventarioComCarteira === 'function') window.syncMoedasInventarioComCarteira();
        fecharJanelaCraft();
        registrarProgressoCraftMissao();
        falhaCraftComMateriaisConsumidos();
        if (btnExecutar) {
          btnExecutar.disabled = false;
          btnExecutar.innerText = craftT('game.craft.forgeItem');
        }
        return;
      }

      if (payload && payload.success) {
        window.adenas = Math.max(0, Math.floor(Number(payload.adenas)));
        window.ancientCoins = Math.max(0, Math.floor(Number(payload.ancientCoins)));
        if (payload.inventario && typeof payload.inventario === 'object' && !Array.isArray(payload.inventario)) {
          window.inventario = Object.assign({}, payload.inventario);
        }
        let rawEq = payload.inventarioEquips;
        if (typeof rawEq === 'string') {
          try {
            rawEq = JSON.parse(rawEq);
          } catch {
            rawEq = [];
          }
        }
        window.inventarioEquips =
          typeof window.normalizarInventarioEquipsParaInstancias === 'function'
            ? window.normalizarInventarioEquipsParaInstancias(Array.isArray(rawEq) ? rawEq : [])
            : Array.isArray(rawEq)
              ? rawEq
              : [];

        if (typeof window.syncMoedasInventarioComCarteira === 'function') window.syncMoedasInventarioComCarteira();

        const idCrafted = payload.id_base_crafted || idBaseGerado;
        let nomeGerado = '';
        let imgGerada = recipe.img;
        if (payload.tipo_crafted === 'material' && idCrafted === 'Ancient Coin') {
          nomeGerado = craftT('game.craft.mintResultName');
          imgGerada = 'assets/itens/ancient_coin.png';
        } else {
          const baseEquip = buscarBaseDoEquipamento(String(idCrafted));
          if (baseEquip) {
            nomeGerado = String(baseEquip.nome || idCrafted);
            imgGerada = baseEquip.img as string | undefined;
          } else {
            nomeGerado = String(idCrafted || '?');
          }
        }

        registrarProgressoCraftMissao();
        fecharJanelaCraft();
        mostrarResultadoCraft(nomeGerado, imgGerada, qtdGerada);

        if (typeof window.escreverLog === 'function') {
          const logLine = (recipe.idReceita === 'rec_mint_ancient_coin')
            ? craftT('game.craft.logMintSuccess')
            : craftT('game.craft.logForged', { item: nomeGerado });
          window.escreverLog('<span style="color:#facc15; font-weight:bold; text-shadow: 1px 1px 0 #000;">' + logLine + '</span>');
        }
        if (typeof window.atualizar === 'function') window.atualizar();
        if (typeof window.salvarJogo === 'function') window.salvarJogo();
        if (btnExecutar) {
          btnExecutar.disabled = false;
          btnExecutar.innerText = craftT('game.craft.forgeItem');
        }
      } else {
        const code = (payload && payload.error) ? String(payload.error) : 'unknown';
        const errKey = 'game.craft.error.' + code;
        let msg = craftT(errKey);
        if (msg === errKey) msg = craftT('game.craft.errorGeneric', { code });
        if (typeof window.l2Alert === 'function') window.l2Alert(msg);
        if (btnExecutar) {
          btnExecutar.disabled = false;
          btnExecutar.innerText = craftT('game.craft.forgeItem');
        }
      }
    } catch (err) {
      console.error('[Craft RPC Exception]', err);
      if (btnExecutar) {
        btnExecutar.disabled = false;
        btnExecutar.innerText = craftT('game.craft.forgeItem');
      }
    }
    return;
  }

  consumirIngredientesReceita();
  registrarProgressoCraftMissao();

  if (taxaSucesso < 100 && Math.random() * 100 >= taxaSucesso) {
    if (btnExecutar) {
      btnExecutar.disabled = false;
      btnExecutar.innerText = craftT('game.craft.forgeItem');
    }
    falhaCraftComMateriaisConsumidos();
    return;
  }

  const out = creditarResultadoCraftLocal(tipoGerado, idBaseGerado, qtdGerada);

  fecharJanelaCraft();
  mostrarResultadoCraft(out.nomeGerado, out.imgGerada, qtdGerada);

  if (typeof window.escreverLog === 'function') {
    const logLine = (recipe.idReceita === 'rec_mint_ancient_coin')
      ? craftT('game.craft.logMintSuccess')
      : craftT('game.craft.logForged', { item: out.nomeGerado });
    window.escreverLog('<span style="color:#facc15; font-weight:bold; text-shadow: 1px 1px 0 #000;">' + logLine + '</span>');
  }
  if (typeof window.atualizar === 'function') window.atualizar();
  if (typeof window.salvarJogo === 'function') window.salvarJogo();
  if (btnExecutar) {
    btnExecutar.disabled = false;
    btnExecutar.innerText = craftT('game.craft.forgeItem');
  }
}

function mostrarResultadoCraft(nomeItem: string, imgItem: string | undefined, qtd: number): void {
  const imgEl = document.getElementById('craft-res-img') as HTMLImageElement | null;
  const nomeEl = document.getElementById('craft-res-nome');
  const qtdEl = document.getElementById('craft-res-qtd');
  if (imgEl) imgEl.src = imgItem || 'assets/itens/item_generic.png';
  if (nomeEl) nomeEl.innerText = nomeItem;
  if (qtdEl) qtdEl.innerText = craftT('game.craft.craftedQty', { qtd });

  if (typeof window.tocarSom === 'function') window.tocarSom('enchant_success');

  window.abrirModal('janela-craft-resultado', 1800);
}

function fecharCraftResultado(): void {
  window.fecharModal('janela-craft-resultado');
  if (typeof window.atualizar === 'function') window.atualizar();
  if (typeof window.renderizarInventario === 'function') window.renderizarInventario();
}

function craftOnVesperVariantChange(idBase: string): void {
  craftVesperEscolhaIdBase = idBase;
  atualizarListaIngredientesCraft();
}

window.abrirJanelaCraft = abrirJanelaCraft;
window.fecharJanelaCraft = fecharJanelaCraft;
window.mudarAbaCraft = mudarAbaCraft;
window.selecionarReceita = selecionarReceita;
window.executarCraft = executarCraft;
window.mostrarResultadoCraft = mostrarResultadoCraft;
window.fecharCraftResultado = fecharCraftResultado;
window.craftOnVesperVariantChange = craftOnVesperVariantChange;
window.buscarBaseDoEquipamento = buscarBaseDoEquipamento;

export {};
