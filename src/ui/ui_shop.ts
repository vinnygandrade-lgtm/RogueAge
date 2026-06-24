/**
 * UI — lojas de compra e venda
 * Migrado: js/ui_shop.js — Fase 4: tipos explícitos.
 */

import type {
  NpcShopBuyStackableResult,
  ShopCatalogItem,
  ShopCheckoutSummaryOpts,
  ShopCurrencyKind,
  ShopEquipTab,
  ShopGrocerCategory,
} from '../types/game';

function consumiveisCatalog(): ShopCatalogItem[] {
    return (window.catalogoConsumiveis || []) as ShopCatalogItem[];
}

function scrollsCatalog(): ShopCatalogItem[] {
    return (window.catalogoScrolls || []) as ShopCatalogItem[];
}

function armasCatalog(): ShopCatalogItem[] {
    return (window.catalogoArmas || []) as ShopCatalogItem[];
}

function armadurasCatalog(): ShopCatalogItem[] {
    return (window.catalogoArmaduras || []) as ShopCatalogItem[];
}

function joiasCatalog(): ShopCatalogItem[] {
    return (window.catalogoJoias || []) as ShopCatalogItem[];
}

function materiaisCatalog(): ShopCatalogItem[] {
    return (window.catalogoMateriais || []) as ShopCatalogItem[];
}

function precosVendaMap(): Record<string, number> {
    return window.precosVenda || {};
}

function shopT(key: string, params?: Record<string, string | number>): string {
    return typeof window.t === 'function' ? window.t(key, params) : key;
}

function shopPlayerLevel(): number {
    const n = typeof window.nivel !== 'undefined' ? Number(window.nivel) : 1;
    return Math.max(1, Math.min(85, Number.isFinite(n) ? Math.floor(n) : 1));
}

function _invNum(v: unknown): number {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
}

/** Preço unitário (Grocer + mega-shop NPC) — alinha cliente offline ao EconomyBalance e à RPC npc_shop_buy_stackable. */
function effectiveShopUnitForCatalogItem(item: ShopCatalogItem | null | undefined): number {
    if (!item) return 0;
    const base = Math.max(0, Number(item.preco) || 0);
    if (base <= 0) return 0;
    const EB = window.EconomyBalance;
    if (EB && typeof EB.effectiveShopUnitPrice === 'function') {
        return EB.effectiveShopUnitPrice(base, shopPlayerLevel());
    }
    return base;
}

let qtdCompraSelecionada = 1;
let itemSelecionado: ShopCatalogItem | null = null;

function _shopGradeDetailRow(grade: unknown): string {
    var label = (typeof window.t === 'function') ? window.t('game.shop.labelGrade') : 'Grade:';
    var tag = (typeof window.buildGradeTagHtml === 'function')
        ? window.buildGradeTagHtml(grade)
        : ('<span class="l2-grade-tag">[' + grade + ']</span>');
    return '<div class="shop-detail-grade-row">' + label + ' ' + tag + '</div>';
}

function _shopCurrencyKindFromItem(item: ShopCatalogItem | null | undefined): ShopCurrencyKind {
    if (item && item.moeda === 'Ancient') return 'ancient';
    return 'adena';
}

function _shopBalanceForKind(kind: ShopCurrencyKind): number {
    if (kind === 'ancient') return Math.max(0, Math.floor(Number(window.ancientCoins) || 0));
    return Math.max(0, Math.floor(Number(window.adenas) || 0));
}

function _shopFormatMoney(amount: unknown, kind: ShopCurrencyKind): string {
    var n = Math.max(0, Math.floor(Number(amount) || 0));
    var formatted = n.toLocaleString(typeof window.I18n !== 'undefined' && window.I18n.getLocale && window.I18n.getLocale() === 'pt-BR' ? 'pt-BR' : 'en-US');
    return kind === 'ancient' ? formatted + ' ac' : formatted + 'a';
}

function _shopMoneyValueClass(kind: ShopCurrencyKind): string {
    return kind === 'ancient' ? 'shop-checkout-summary__value--ancient' : 'shop-checkout-summary__value--adena';
}

function _shopCheckoutSummaryRow(label: string, valueHtml: string, extraClass?: string): string {
    return '<div class="shop-checkout-summary__row' + (extraClass ? ' ' + extraClass : '') + '">' +
        '<span class="shop-checkout-summary__label">' + label + '</span>' +
        '<span class="shop-checkout-summary__value">' + valueHtml + '</span>' +
        '</div>';
}

function _renderShopCheckoutSummary(containerId: string, opts: ShopCheckoutSummaryOpts): boolean {
    var el = document.getElementById(containerId);
    if (!el) return;

    var mode = opts.mode || 'buy';
    var kind = opts.currencyKind || 'adena';
    var unitPrice = Math.max(0, Math.floor(Number(opts.unitPrice) || 0));
    var qty = Math.max(1, Math.floor(Number(opts.quantity) || 1));
    var total = opts.total != null ? Math.max(0, Math.floor(Number(opts.total) || 0)) : unitPrice * qty;
    var balance = _shopBalanceForKind(kind);
    var after = mode === 'sell' ? balance + total : balance - total;
    var canAfford = mode === 'sell' ? true : balance >= total;
    var moneyClass = _shopMoneyValueClass(kind);
    var afterClass = canAfford ? 'shop-checkout-summary__value--ok' : 'shop-checkout-summary__value--warn';

    var title = mode === 'sell' ? shopT('game.shop.checkoutTitleSell') : shopT('game.shop.checkoutTitleBuy');
    var rows = '';

    if (mode === 'buy') {
        rows += _shopCheckoutSummaryRow(
            shopT('game.shop.labelUnitPrice'),
            '<span class="' + moneyClass + '">' + _shopFormatMoney(unitPrice, kind) + '</span>'
        );
        if (opts.showQuantity) {
            rows += _shopCheckoutSummaryRow(shopT('game.shop.labelQuantity'), '× ' + qty);
        }
        rows += _shopCheckoutSummaryRow(
            shopT('game.shop.labelOrderTotal'),
            '<span class="' + moneyClass + '">' + _shopFormatMoney(total, kind) + '</span>',
            'shop-checkout-summary__row--total'
        );
    } else {
        rows += _shopCheckoutSummaryRow(
            shopT('game.shop.labelYouReceive'),
            '<span class="' + moneyClass + '">' + _shopFormatMoney(total, kind) + '</span>',
            'shop-checkout-summary__row--total'
        );
        if (opts.showQuantity) {
            rows += _shopCheckoutSummaryRow(shopT('game.shop.labelQuantity'), '× ' + qty);
        }
    }

    rows += '<div class="shop-checkout-summary__divider"></div>';
    rows += _shopCheckoutSummaryRow(
        shopT('game.shop.labelYourBalance'),
        '<span class="' + moneyClass + '">' + _shopFormatMoney(balance, kind) + '</span>'
    );
    rows += _shopCheckoutSummaryRow(
        mode === 'sell' ? shopT('game.shop.labelBalanceAfterSell') : shopT('game.shop.labelBalanceAfterBuy'),
        '<span class="' + afterClass + '">' + _shopFormatMoney(after, kind) + '</span>',
        'shop-checkout-summary__row--after'
    );

    var hint = '';
    if (mode === 'buy' && !canAfford) {
        hint = '<div class="shop-checkout-summary__hint shop-checkout-summary__hint--warn">' +
            shopT('game.shop.insufficientFundsHint') + '</div>';
    }

    el.innerHTML =
        '<div class="shop-checkout-summary__title">' + title + '</div>' +
        rows + hint;
    el.hidden = false;

    return canAfford;
}

function _hideShopCheckoutSummary(): void {
    var el = document.getElementById('shop-checkout-summary');
    if (el) {
        el.hidden = true;
        el.innerHTML = '';
    }
}

function _hideVendaCheckoutSummary(): void {
    var el = document.getElementById('venda-checkout-summary');
    if (el) {
        el.hidden = true;
        el.innerHTML = '';
    }
}

function _shopBuyQtyPickerVisible(): boolean {
    var qtdContainer = document.getElementById('compra-qtd-container');
    return !!(qtdContainer && qtdContainer.style.display !== 'none');
}

function _syncShopBuyButton(canAfford: boolean | undefined): void {
    var btn = document.getElementById('btn-comprar-item') as HTMLButtonElement | null;
    if (!btn || btn.style.display === 'none') return;
    btn.disabled = canAfford === false;
    btn.style.opacity = canAfford === false ? '0.55' : '1';
    btn.style.cursor = canAfford === false ? 'not-allowed' : 'pointer';
}

function _refreshShopBuyCheckoutSummary(): void {
    if (!itemSelecionado) {
        _hideShopCheckoutSummary();
        _syncShopBuyButton(true);
        return;
    }
    var kind = _shopCurrencyKindFromItem(itemSelecionado);
    var unit = effectiveShopUnitForCatalogItem(itemSelecionado);
    var qty = _shopBuyQtyPickerVisible() ? qtdCompraSelecionada : 1;
    var canAfford = _renderShopCheckoutSummary('shop-checkout-summary', {
        mode: 'buy',
        currencyKind: kind,
        unitPrice: unit,
        quantity: qty,
        showQuantity: _shopBuyQtyPickerVisible(),
    });
    _syncShopBuyButton(canAfford);
}

function _refreshVendaCheckoutSummary(): void {
    if (!itemParaVender) {
        _hideVendaCheckoutSummary();
        return;
    }
    var precoUnitario = precosVendaMap()[itemParaVender] || 5;
    var total = precoUnitario * qtdVendaSelecionada;
    _renderShopCheckoutSummary('venda-checkout-summary', {
        mode: 'sell',
        currencyKind: 'adena',
        unitPrice: precoUnitario,
        quantity: qtdVendaSelecionada,
        total: total,
        showQuantity: true,
    });
}

function fecharLoja(): void {
    const qtdContainer = document.getElementById('compra-qtd-container');
    if (qtdContainer) qtdContainer.style.display = 'none';
    const btnComprar = document.getElementById('btn-comprar-item') as HTMLButtonElement | null;
    if (btnComprar) btnComprar.onclick = null;

    const abas = document.getElementById('store-tabs');
    if (abas) abas.style.display = 'none';

    if (typeof window.clearShopGradeChrome === 'function') window.clearShopGradeChrome();

    _hideShopCheckoutSummary();

    if (typeof window.fecharModal === 'function') window.fecharModal('janela-loja');
    else {
        const janela = document.getElementById('janela-loja');
        if (janela) janela.style.display = 'none';
    }
}

function animarBotaoCompra(): void {
    const btn = document.getElementById('btn-comprar-item') as HTMLButtonElement | null;
    if(!btn) return;
    const flash = shopT('game.shop.bagFlash');
    let txtOriginal = shopT('game.shop.buyItemButton');
    btn.innerText = flash;
    btn.style.background = "#10b981";
    setTimeout(() => {
        if(btn.innerText === flash) {
            btn.innerText = txtOriginal;
            btn.style.background = "#15803d";
            _refreshShopBuyCheckoutSummary();
        }
    }, 1000); // 1 segundo de feedback visual
}

function abrirLojaGrocer(categoria: ShopGrocerCategory): void {
    const grid = document.getElementById('loja-itens');
    if (!grid) return;
    grid.innerHTML = '';
    const itens = (categoria === 'consumables') ? consumiveisCatalog() : scrollsCatalog();
    itens.forEach(item => {
        grid.innerHTML += `<div class="store-item-slot" onclick="selecionarConsumivel('${item.id}', '${categoria}', this)"><img src="${item.img || ''}" title="${item.nome}"></div>`;
    });
    const headerSpan = document.querySelector('#janela-loja .store-header span') as HTMLElement | null;
    if (headerSpan) {
        headerSpan.innerText = (categoria === 'consumables') ? shopT('game.shop.consumablesTitle') : shopT('game.shop.scrollsTitle');
    }
    const detalhe = document.getElementById('detalhe-texto');
    if (detalhe) detalhe.innerHTML = shopT('game.shop.selectItemHint');
    const qtdCont = document.getElementById('compra-qtd-container');
    if (qtdCont) qtdCont.style.display = 'none';
    const btnBuy = document.getElementById('btn-comprar-item');
    if (btnBuy) btnBuy.style.display = 'none';
    itemSelecionado = null;
    _hideShopCheckoutSummary();
    const abas = document.getElementById('store-tabs');
    if (abas) abas.style.display = 'none';

    window.abrirModal('janela-loja', 1500);
}

function selecionarConsumivel(id: string, categoria: ShopGrocerCategory, elemento: HTMLElement | null): void {
    // Adiciona feedback visual de seleção
    document.querySelectorAll('#loja-itens .store-item-slot').forEach(s => s.classList.remove('selected-slot'));
    if(elemento) elemento.classList.add('selected-slot');

    let btnBuy = document.getElementById('btn-comprar-item') as HTMLButtonElement | null;
    let qtdContainer = document.getElementById('compra-qtd-container');
    let catalogo = (categoria === 'consumables') ? consumiveisCatalog() : scrollsCatalog();
    itemSelecionado = catalogo.find(i => i.id === id) || null;
    if (!itemSelecionado || !btnBuy) return;

    let siglaMoeda = itemSelecionado.moeda === 'Ancient' ? 'ac' : 'a';
    let corMoeda = itemSelecionado.moeda === 'Ancient' ? '#60a5fa' : '#ffcc00';
    const unitEff = effectiveShopUnitForCatalogItem(itemSelecionado);

    const detalheEl = document.getElementById('detalhe-texto');
    if (detalheEl) {
        detalheEl.innerHTML = `
        <b style="color:white">${itemSelecionado.nome}</b><br><br>
        ${itemSelecionado.desc || ''}<br>
        ${shopT('game.shop.labelPrice')} <span style="color:${corMoeda}">${unitEff}${siglaMoeda}</span> ${shopT('game.shop.eachLabel')}
    `;
    }

    if (qtdContainer) qtdContainer.style.display = 'flex';
    const inputQtd = document.getElementById('input-qtd-compra') as HTMLInputElement | null;
    if (inputQtd) {
        inputQtd.value = '1';
        qtdCompraSelecionada = 1;
        inputQtd.oninput = function () { atualizarPrecoTotalCompra(); };
        inputQtd.onchange = function () { atualizarPrecoTotalCompra(); };
    }
    atualizarPrecoTotalCompra();
    btnBuy.innerText = shopT('game.shop.buyItemButton');
    btnBuy.style.display = 'block';

    btnBuy.onclick = function () { confirmarCompraMultipla(categoria); };
    _refreshShopBuyCheckoutSummary();
}

function alterarQtdCompra(delta: number): void {
    if (!itemSelecionado) return;
    const inputEl = document.getElementById('input-qtd-compra') as HTMLInputElement | null;
    if (!inputEl) return;
    let atual = parseInt(inputEl.value, 10);
    if (isNaN(atual)) atual = 0;
    let novo = atual + delta;
    if (novo < 1) novo = 1;
    inputEl.value = String(novo);
    atualizarPrecoTotalCompra();
}

function setQtdCompraMax(): void {
    if (!itemSelecionado) return;
    let saldoDisponivel = (itemSelecionado.moeda === 'Ancient') ? window.ancientCoins : window.adenas;
    const unitEff = effectiveShopUnitForCatalogItem(itemSelecionado);
    if (unitEff <= 0) return;
    let max = Math.floor(Number(saldoDisponivel) / unitEff);
    if (max < 1) max = 1;
    const inputEl = document.getElementById('input-qtd-compra') as HTMLInputElement | null;
    if (inputEl) inputEl.value = String(max);
    atualizarPrecoTotalCompra();
}

function atualizarPrecoTotalCompra(): void {
    if (!itemSelecionado) return;
    const inputEl = document.getElementById('input-qtd-compra') as HTMLInputElement | null;
    if (!inputEl) return;
    let val = parseInt(inputEl.value, 10);
    if (isNaN(val) || val < 1) val = 1;
    qtdCompraSelecionada = val;
    _refreshShopBuyCheckoutSummary();
}

function confirmarCompraMultipla(categoria: ShopGrocerCategory): void {
    if (!itemSelecionado) return;
    atualizarPrecoTotalCompra();
    const unitEff = effectiveShopUnitForCatalogItem(itemSelecionado);
    let total = unitEff * qtdCompraSelecionada;
    
    let carteira = itemSelecionado.moeda === 'Ancient' ? window.ancientCoins : window.adenas;
    let nomeMoeda = itemSelecionado.moeda === 'Ancient' ? shopT('game.shop.currencyAncientCoins') : shopT('game.shop.currencyAdenasShort');

    if (carteira < total) {
        window.mostrarAviso(shopT('game.shop.insufficientCurrency', { currency: nomeMoeda }));
        return;
    }

    const cloudShop = window.SUPABASE_CONFIG && window.SUPABASE_CONFIG.enabled &&
        window.SupabaseAPI && typeof window.SupabaseAPI.getUser === 'function' && window.SupabaseAPI.getUser() &&
        typeof window.charName === 'string' && window.charName;

    if (cloudShop) {
        if (typeof window.SupabaseAPI.npcShopBuyStackable !== 'function') {
            window.mostrarAviso(shopT('game.cloud.shopStackableFailed'));
            return;
        }
        void (async () => {
            try {
                const selected = itemSelecionado;
                if (!selected || !window.SupabaseAPI?.npcShopBuyStackable) return;
                const { data: rawData, error } = await window.SupabaseAPI.npcShopBuyStackable(
                    window.charName as string,
                    selected.id,
                    qtdCompraSelecionada
                );
                let data: NpcShopBuyStackableResult | null = rawData as NpcShopBuyStackableResult | null;
                if (typeof data === 'string') {
                    try {
                        data = JSON.parse(data) as NpcShopBuyStackableResult;
                    } catch {
                        data = null;
                    }
                }
                const rpcOk = data && (data.ok === true || data.ok === 'true');
                if (error || !rpcOk) {
                    const code = data && data.error;
                    if (code === 'insufficient_funds') {
                        window.mostrarAviso(shopT('game.shop.insufficientCurrency', { currency: nomeMoeda }));
                    } else {
                        window.mostrarAviso(shopT('game.cloud.shopStackableFailed'));
                    }
                    return;
                }
                window.adenas = typeof data.adenas === 'number' ? data.adenas : parseInt(data.adenas, 10) || 0;
                window.ancientCoins =
                    typeof data.ancient_coins === 'number'
                        ? data.ancient_coins
                        : parseInt(data.ancient_coins, 10) || 0;
                if (typeof window.syncMoedasInventarioComCarteira === 'function') {
                    window.syncMoedasInventarioComCarteira();
                }
                if (!window.inventario || typeof window.inventario !== 'object') {
                    window.inventario = {};
                }
                const inm = data.item_name || selected.nome;
                const qAfter =
                    typeof data.qty_after === 'number'
                        ? data.qty_after
                        : parseInt(data.qty_after, 10);
                if (inm && Number.isFinite(qAfter)) {
                    window.inventario[inm] = qAfter;
                    if (window.InventarioRecent && typeof window.InventarioRecent.touchStack === 'function') {
                        window.InventarioRecent.touchStack(inm);
                    }
                } else if (selected.nome) {
                    if (window.InventoryManager && typeof window.InventoryManager.adicionarStack === 'function') {
                        window.InventoryManager.adicionarStack(selected.nome, qtdCompraSelecionada);
                    } else {
                        const cur = Number(window.inventario[selected.nome]) || 0;
                        window.inventario[selected.nome] = cur + qtdCompraSelecionada;
                    }
                }
                window.tocarSom('adenas');
                window.escreverLog(
                    '<span style="color:#00ff00">' +
                        shopT('game.shop.logBoughtMats', { qtd: qtdCompraSelecionada, name: selected.nome }) +
                        '</span>'
                );
                window.atualizar();
                window.salvarJogo();
                animarBotaoCompra();
                atualizarPrecoTotalCompra();
            } catch (e) {
                console.error('[Grocer cloud purchase]', e);
                window.mostrarAviso(shopT('game.cloud.shopStackableFailed'));
            }
        })();
        return;
    }

    if (carteira >= total) {
        if (itemSelecionado.moeda === 'Ancient') window.ancientCoins -= total;
        else window.adenas -= total;

        window.tocarSom('adenas');
        if (window.InventoryManager && typeof window.InventoryManager.adicionarStack === 'function') {
            window.InventoryManager.adicionarStack(itemSelecionado.nome, qtdCompraSelecionada);
        } else if(window.inventario[itemSelecionado.nome]) window.inventario[itemSelecionado.nome] += qtdCompraSelecionada;
        else window.inventario[itemSelecionado.nome] = qtdCompraSelecionada;
        
        window.escreverLog('<span style="color:#00ff00">' + shopT('game.shop.logBoughtMats', { qtd: qtdCompraSelecionada, name: itemSelecionado.nome }) + '</span>');
        window.atualizar(); window.salvarJogo();
        animarBotaoCompra();
        atualizarPrecoTotalCompra();
    } else {
        window.mostrarAviso(shopT('game.shop.insufficientCurrency', { currency: nomeMoeda }));
    }
}

// ==========================================
// MEGA LOJA DE EQUIPAMENTOS (ABAS DINÂMICAS)
// ==========================================
let lojaGradeAtual = 'No-Grade';

function mostrarGradesEquipment(): void {
    const menu = document.getElementById('menu-equipment');
    const grades = document.getElementById('menu-equipment-grades');
    if (menu) menu.style.display = 'none';
    if (grades) grades.style.display = 'flex';
}

function voltarMenuEquipment(): void {
    const grades = document.getElementById('menu-equipment-grades');
    const menu = document.getElementById('menu-equipment');
    if (grades) grades.style.display = 'none';
    if (menu) menu.style.display = 'flex';
}

function abrirMegaLoja(grade: string): void {
    lojaGradeAtual = grade;
    const titulo = document.getElementById('titulo-loja-span');
    if (titulo) titulo.innerText = shopT('game.shop.equipmentsTitle', { grade: grade });
    if (typeof window.applyShopGradeChrome === 'function') window.applyShopGradeChrome(grade);
    const tabs = document.getElementById('store-tabs');
    if (tabs) tabs.style.display = 'flex';
    mudarAbaLoja('weapon');
    window.abrirModal('janela-loja', 1500);
}

function mudarAbaLoja(tipo: ShopEquipTab): void {
    const tabWeapon = document.getElementById('tab-weapon');
    const tabArmor = document.getElementById('tab-armor');
    const tabJewel = document.getElementById('tab-jewel');
    if (tabWeapon) tabWeapon.style.background = (tipo === 'weapon') ? '#1d4ed8' : '#222';
    if (tabArmor) tabArmor.style.background = (tipo === 'armor') ? '#1d4ed8' : '#222';
    if (tabJewel) tabJewel.style.background = (tipo === 'jewel') ? '#1d4ed8' : '#222';

    const grid = document.getElementById('loja-itens');
    if (!grid) return;
    grid.innerHTML = '';

    let catalogo: ShopCatalogItem[] = [];
    if (tipo === 'weapon') catalogo = armasCatalog();
    else if (tipo === 'armor') catalogo = armadurasCatalog();
    else if (tipo === 'jewel') catalogo = joiasCatalog();

    let itensFiltrados = catalogo.filter(item => item.grade === lojaGradeAtual && _invNum(item.preco) > 0);

    if (itensFiltrados.length === 0) {
        grid.innerHTML = '<span style="color:#aaa; font-size:0.8em; grid-column: span 4; text-align:center; padding-top: 10px;">' + shopT('game.shop.comingSoon') + '</span>';
    } else {
        itensFiltrados.forEach(item => {
            grid.innerHTML += `<div class="store-item-slot" onclick="selecionarItemLoja('${item.id}', '${tipo}', this)"><img src="${item.img || ''}" title="${item.nome}"></div>`;
        });
    }

    const detalhe = document.getElementById('detalhe-texto');
    if (detalhe) detalhe.innerHTML = shopT('game.shop.selectItemHint');
    const btnBuy = document.getElementById('btn-comprar-item');
    if (btnBuy) btnBuy.style.display = 'none';
    const qtdCont = document.getElementById('compra-qtd-container');
    if (qtdCont) qtdCont.style.display = 'none';
    itemSelecionado = null;
    _hideShopCheckoutSummary();
}

function selecionarItemLoja(id: string, tipo: ShopEquipTab, elemento: HTMLElement | null): void { 
    // Feedback visual
    document.querySelectorAll('#loja-itens .store-item-slot').forEach(s => s.classList.remove('selected-slot'));
    if(elemento) elemento.classList.add('selected-slot');

    let btnBuy = document.getElementById('btn-comprar-item') as HTMLButtonElement | null;
    let qtdContainer = document.getElementById('compra-qtd-container');
    if (qtdContainer) qtdContainer.style.display = 'none';
    if (!btnBuy) return;

    if (tipo === 'armor') {
        itemSelecionado = armadurasCatalog().find(i => i.id === id) || null;
        if (!itemSelecionado) return; 
        let infoExtra = "";
        let pDefValor = itemSelecionado.pDef || itemSelecionado.def || 0;
        let reqLinha = '';
        if (typeof window.validarEquipPorGrade === 'function') {
            let vReq = window.validarEquipPorGrade(itemSelecionado);
            let corReq = vReq.permitido ? '#22c55e' : '#ef4444';
            reqLinha = `<br>${shopT('game.shop.labelReqLevel')} <span style="color:${corReq}; font-weight:bold;">${vReq.nivelMinimo}</span> <span style="color:#94a3b8;">${shopT('game.shop.youLevelHint', { level: vReq.nivelAtual })}</span>`;
        }
        
        // Lê o tipo de armadura e dá uma cor
        let corTipo = itemSelecionado.tipo === 'Heavy' ? '#ef4444' : (itemSelecionado.tipo === 'Light' ? '#10b981' : '#3b82f6');
        let tipoTxt = itemSelecionado.tipo ? `<br>${shopT('game.shop.labelType')} <span style="color:${corTipo}; font-weight:bold;">${itemSelecionado.tipo}</span>` : '';
        
        // Verifica e adiciona os bônus ocultos que criamos
        if (itemSelecionado.bonusHp) infoExtra += `<br>${shopT('game.shop.labelMaxHp')} <span style="color:#10b981">+${itemSelecionado.bonusHp}</span>`;
        if (itemSelecionado.bonusMp) infoExtra += `<br>${shopT('game.shop.labelMaxMp')} <span style="color:#3b82f6">+${itemSelecionado.bonusMp}</span>`;
        if (_invNum(itemSelecionado.bonusSpd)) infoExtra += `<br>${shopT('game.shop.labelAtkSpeed')} <span style="color:#fcd34d">${shopT('game.shop.atkSpeedFast', { n: String(itemSelecionado.bonusSpd) })}</span>`;
        if (itemSelecionado.bonusCrit) infoExtra += `<br>${shopT('game.shop.labelCritRate')} <span style="color:#ef4444">+${itemSelecionado.bonusCrit}%</span>`;
        if (itemSelecionado.bonusMDef) infoExtra += `<br>${shopT('game.shop.labelMDefBonus')} <span style="color:#a855f7">+${itemSelecionado.bonusMDef}</span>`;
        if (itemSelecionado.desc) infoExtra += `<br><br><span style="color:#c4b5fd; font-style:italic;">"${itemSelecionado.desc}"</span>`;
        const precoEquip = effectiveShopUnitForCatalogItem(itemSelecionado);
        document.getElementById('detalhe-texto').innerHTML = `<b style="color:white; font-size:1.1em;">${itemSelecionado.nome}</b><br><br>${_shopGradeDetailRow(itemSelecionado.grade)}${tipoTxt}${reqLinha}<br>${shopT('game.shop.labelPDef')} <span style="color:#fde047">+${pDefValor}</span>${infoExtra}`; 
        btnBuy.onclick = function() { confirmarCompraArmor(); }; 
    } 
    else if (tipo === 'weapon') {
        itemSelecionado = armasCatalog().find(i => i.id === id) || null;
        if (!itemSelecionado) return; 
        let infoExtra = "";
        let tipoArma = itemSelecionado.tipo ? `<br>${shopT('game.shop.labelType')} <span style="color:#f59e0b; font-weight:bold;">${itemSelecionado.tipo}</span>` : '';
        let reqLinha = '';
        if (typeof window.validarEquipPorGrade === 'function') {
            let vReq = window.validarEquipPorGrade(itemSelecionado);
            let corReq = vReq.permitido ? '#22c55e' : '#ef4444';
            reqLinha = `<br>${shopT('game.shop.labelReqLevel')} <span style="color:${corReq}; font-weight:bold;">${vReq.nivelMinimo}</span> <span style="color:#94a3b8;">${shopT('game.shop.youLevelHint', { level: vReq.nivelAtual })}</span>`;
        }
        
        // Adiciona o M.Atk para os magos conseguirem comprar cajados direito
        if (itemSelecionado.matk) infoExtra += `<br>${shopT('game.shop.labelMAtkBase')} <span style="color:#3b82f6">+${itemSelecionado.matk}</span>`;
        if (itemSelecionado.bonusHp) infoExtra += `<br>${shopT('game.shop.labelMaxHp')} <span style="color:#10b981">+${itemSelecionado.bonusHp}</span>`;
        if (itemSelecionado.bonusMp) infoExtra += `<br>${shopT('game.shop.labelMaxMp')} <span style="color:#60a5fa">+${itemSelecionado.bonusMp}</span>`;
        if (_invNum(itemSelecionado.bonusSpd)) infoExtra += `<br>${shopT('game.shop.labelAtkSpeed')} <span style="color:#fcd34d">${shopT('game.shop.atkSpeedFast', { n: String(itemSelecionado.bonusSpd) })}</span>`;
        if (itemSelecionado.bonusCrit) infoExtra += `<br>${shopT('game.shop.labelCritRate')} <span style="color:#ef4444">+${itemSelecionado.bonusCrit}%</span>`;
        if (itemSelecionado.desc) infoExtra += `<br><br><span style="color:#c4b5fd; font-style:italic;">"${itemSelecionado.desc}"</span>`;
        const precoW = effectiveShopUnitForCatalogItem(itemSelecionado);
        document.getElementById('detalhe-texto').innerHTML = `<b style="color:white; font-size:1.1em;">${itemSelecionado.nome}</b><br><br>${_shopGradeDetailRow(itemSelecionado.grade)}${tipoArma}${reqLinha}<br>${shopT('game.shop.labelPAtkBase')} <span style="color:#ef4444">+${itemSelecionado.atk}</span>${infoExtra}`; 
        btnBuy.onclick = function() { confirmarCompraWeapon(); }; 
    }
    else if (tipo === 'jewel') {
        itemSelecionado = joiasCatalog().find(i => i.id === id) || null;
        if (!itemSelecionado) return;
        let infoJoia = '';
        let reqLinha = '';
        if (typeof window.validarEquipPorGrade === 'function') {
            let vReq = window.validarEquipPorGrade(itemSelecionado);
            let corReq = vReq.permitido ? '#22c55e' : '#ef4444';
            reqLinha = `<br>${shopT('game.shop.labelReqLevel')} <span style="color:${corReq}; font-weight:bold;">${vReq.nivelMinimo}</span> <span style="color:#94a3b8;">${shopT('game.shop.youLevelHint', { level: vReq.nivelAtual })}</span>`;
        }
        if (itemSelecionado.bonusHp) infoJoia += `<br>${shopT('game.shop.labelMaxHp')} <span style="color:#10b981">+${itemSelecionado.bonusHp}</span>`;
        if (itemSelecionado.bonusMp) infoJoia += `<br>${shopT('game.shop.labelMaxMp')} <span style="color:#60a5fa">+${itemSelecionado.bonusMp}</span>`;
        if (_invNum(itemSelecionado.bonusSpd)) infoJoia += `<br>${shopT('game.shop.labelAtkSpeed')} <span style="color:#fcd34d">${shopT('game.shop.atkSpeedFast', { n: String(itemSelecionado.bonusSpd) })}</span>`;
        if (itemSelecionado.bonusCrit) infoJoia += `<br>${shopT('game.shop.labelCritRate')} <span style="color:#ef4444">+${itemSelecionado.bonusCrit}%</span>`;
        if (itemSelecionado.pAtk) infoJoia += `<br>${shopT('game.shop.labelPAtk')} <span style="color:#ef4444">+${itemSelecionado.pAtk}</span>`;
        if (itemSelecionado.mAtk) infoJoia += `<br>${shopT('game.shop.labelMAtk')} <span style="color:#3b82f6">+${itemSelecionado.mAtk}</span>`;
        if (itemSelecionado.desc) infoJoia += `<br><br><span style="color:#c4b5fd; font-style:italic;">"${itemSelecionado.desc}"</span>`;
        const precoJ = effectiveShopUnitForCatalogItem(itemSelecionado);
        document.getElementById('detalhe-texto').innerHTML = `<b style="color:white; font-size:1.1em;">${itemSelecionado.nome}</b><br><br>${shopT('game.shop.labelType')} <span style="color:#a855f7; text-transform:capitalize;">${itemSelecionado.tipoItem}</span><br>${_shopGradeDetailRow(itemSelecionado.grade)}${reqLinha}<br>${shopT('game.shop.labelMDef')} <span style="color:#a855f7">+${itemSelecionado.mDef}</span>${infoJoia}`; 
        btnBuy.onclick = function() { confirmarCompraJewel(); };
    }
    
    btnBuy.style.display = 'block'; btnBuy.innerText = shopT('game.shop.buyItemButton'); btnBuy.disabled = false; btnBuy.style.background = "#15803d"; 
    _refreshShopBuyCheckoutSummary();
}

function confirmarCompraArmor(): void { 
    if (!itemSelecionado) return; 
    const preco = effectiveShopUnitForCatalogItem(itemSelecionado);
    if (window.adenas < preco) {
        window.mostrarAviso(shopT('game.shop.insufficientAdena'));
        return;
    }
    window.adenas -= preco; window.tocarSom('adenas');
    window.InventoryManager.adicionarEquipamento({ tipo: 'armor', base: itemSelecionado, enchant: 0, origin: 'Shop' }); 
    window.escreverLog('<span style="color:#00ff00">' + shopT('game.shop.logBoughtEquip', { name: itemSelecionado.nome }) + '</span>');
    window.calcularStatusGlobais(); window.atualizar(); window.salvarJogo(); 
    animarBotaoCompra();
    _refreshShopBuyCheckoutSummary();
}

function confirmarCompraWeapon(): void { 
    if (!itemSelecionado) return; 
    const preco = effectiveShopUnitForCatalogItem(itemSelecionado);
    if (window.adenas < preco) {
        window.mostrarAviso(shopT('game.shop.insufficientAdena'));
        return;
    }
    window.adenas -= preco; window.tocarSom('adenas');
    window.InventoryManager.adicionarEquipamento({ tipo: 'weapon', base: itemSelecionado, enchant: 0, augmented: false, origin: 'Shop' }); 
    window.escreverLog('<span style="color:#00ff00">' + shopT('game.shop.logBoughtEquip', { name: itemSelecionado.nome }) + '</span>');
    window.calcularStatusGlobais(); window.atualizar(); window.salvarJogo(); 
    animarBotaoCompra();
    _refreshShopBuyCheckoutSummary();
}

function confirmarCompraJewel(): void { 
    if (!itemSelecionado) return; 
    const preco = effectiveShopUnitForCatalogItem(itemSelecionado);
    if (window.adenas < preco) {
        window.mostrarAviso(shopT('game.shop.insufficientAdena'));
        return;
    }
    window.adenas -= preco; window.tocarSom('adenas');
    window.InventoryManager.adicionarEquipamento({
        tipo: itemSelecionado.tipoItem || 'jewel',
        base: itemSelecionado,
        enchant: 0,
        origin: 'Shop'
    }); 
    window.escreverLog('<span style="color:#00ff00">' + shopT('game.shop.logBoughtEquip', { name: itemSelecionado.nome }) + '</span>');
    window.calcularStatusGlobais(); window.atualizar(); window.salvarJogo(); 
    animarBotaoCompra();
    _refreshShopBuyCheckoutSummary();
}

let itemParaVender: string | null = null;
let qtdVendaSelecionada = 1;

function fecharVenda(): void {
    const qtdCont = document.getElementById('venda-qtd-container');
    if (qtdCont) qtdCont.style.display = 'none';
    const btnVender = document.getElementById('btn-vender-item') as HTMLButtonElement | null;
    if (btnVender) btnVender.onclick = null;
    _hideVendaCheckoutSummary();
    if (typeof window.fecharModal === 'function') window.fecharModal('janela-venda');
    else {
        const janela = document.getElementById('janela-venda');
        if (janela) janela.style.display = 'none';
    }
}

function abrirLojaVenda(): void {
    const grid = document.getElementById('venda-itens');
    if (!grid) return;
    grid.innerHTML = ''; 
    var kMoedaAd = (window.L2MINI_CURRENCY_BAG_KEYS && window.L2MINI_CURRENCY_BAG_KEYS.adena) || 'Adena';
    var kMoedaAc = (window.L2MINI_CURRENCY_BAG_KEYS && window.L2MINI_CURRENCY_BAG_KEYS.ancient) || 'Ancient Coin';
    let nomesDosItens = Object.keys(window.inventario).filter(function (nome) { return nome !== kMoedaAd && nome !== kMoedaAc; });
    if (nomesDosItens.length === 0) { 
        grid.innerHTML = '<span style="color:#aaa; font-size:0.8em; grid-column: span 4; text-align:center; padding-top: 10px;">' + shopT('game.shop.bagEmpty') + '</span>'; 
    } else { 
        nomesDosItens.forEach(nome => { 
            let qtd = window.inventario[nome]; 
            // Tenta encontrar o ícone no banco de dados para ficar bonito na venda
            let itemData = materiaisCatalog().find(m => m.nome === nome) || 
                           consumiveisCatalog().find(c => c.nome === nome) || 
                           scrollsCatalog().find(s => s.nome === nome);
            
            let imgHtml = itemData ? `<img src="${itemData.img}" style="width:70%; height:70%; object-fit:contain; margin-bottom: 8px;">` : `<span style="font-size: 8px; color:#ddd; text-align:center; padding: 2px;">${nome}</span>`;
            
            grid.innerHTML += `<div class="store-item-slot" onclick="selecionarItemVenda('${nome}', this)" style="position:relative; flex-direction:column;">
                ${imgHtml}
                <div class="inv-qtd">${qtd}</div>
            </div>`; 
        }); 
    } 
    window.abrirModal('janela-venda', 1500); 
    document.getElementById('venda-detalhe-texto').innerHTML = shopT('game.shop.selectItemToSell'); 
    document.getElementById('btn-vender-item').style.display = 'none'; 
    if(document.getElementById('venda-qtd-container')) document.getElementById('venda-qtd-container').style.display = 'none'; 
    itemParaVender = null; 
    _hideVendaCheckoutSummary();
}
function selecionarItemVenda(nome: string, elemento: HTMLElement | null): void {
    document.querySelectorAll('#venda-itens .store-item-slot').forEach(s => s.classList.remove('selected-slot'));
    if (elemento) elemento.classList.add('selected-slot');

    itemParaVender = nome;
    const qtd = window.inventario[nome];
    const precoUnitario = precosVendaMap()[nome] || 5;
    qtdVendaSelecionada = 1;
    const detalheVenda = document.getElementById('venda-detalhe-texto');
    if (detalheVenda) {
        detalheVenda.innerHTML =
            `<b style="color:white">${nome}</b><br><br>` +
            `${shopT('game.shop.ownedLabel')} ${qtd}<br>` +
            `${shopT('game.shop.sellPriceLabel')} <span style="color:#ffcc00">${precoUnitario}a</span> ${shopT('game.shop.eachLabel')}`;
    }
    const qtdCont = document.getElementById('venda-qtd-container');
    if (qtdCont) qtdCont.style.display = 'flex';
    const inputQtd = document.getElementById('input-qtd-venda') as HTMLInputElement | null;
    if (inputQtd) {
        inputQtd.value = String(qtdVendaSelecionada);
        inputQtd.max = String(qtd);
        inputQtd.oninput = function () { atualizarPrecoTotalVenda(); };
    }
    const btnVender = document.getElementById('btn-vender-item') as HTMLButtonElement | null;
    if (btnVender) {
        btnVender.onclick = function () { confirmarVenda(); };
        btnVender.style.display = 'block';
    }
    atualizarPrecoTotalVenda();
}

function alterarQtdVenda(delta: number): void {
    if (!itemParaVender) return;
    const max = window.inventario[itemParaVender];
    const inputEl = document.getElementById('input-qtd-venda') as HTMLInputElement | null;
    if (!inputEl) return;
    let atual = parseInt(inputEl.value, 10);
    if (isNaN(atual)) atual = 0;
    let novo = atual + delta;
    if (novo < 1) novo = 1;
    if (novo > max) novo = max;
    inputEl.value = String(novo);
    atualizarPrecoTotalVenda();
}

function setQtdVendaMax(): void {
    if (!itemParaVender) return;
    qtdVendaSelecionada = window.inventario[itemParaVender];
    const inputEl = document.getElementById('input-qtd-venda') as HTMLInputElement | null;
    if (inputEl) {
        inputEl.value = String(qtdVendaSelecionada);
        atualizarPrecoTotalVenda();
    }
}

function atualizarPrecoTotalVenda(): void {
    if (!itemParaVender) return;
    const inputEl = document.getElementById('input-qtd-venda') as HTMLInputElement | null;
    if (!inputEl) return;
    const rawValue = inputEl.value;
    const max = window.inventario[itemParaVender];
    if (rawValue === '' || rawValue === '0') {
        qtdVendaSelecionada = 0;
        _refreshVendaCheckoutSummary();
        return;
    }
    let val = parseInt(rawValue, 10);
    if (val > max) { val = max; inputEl.value = String(max); }
    qtdVendaSelecionada = val;
    _refreshVendaCheckoutSummary();
}

function confirmarVenda(): void { 
    if (!itemParaVender || !window.inventario[itemParaVender]) return; 
    var kMoedaAd = (window.L2MINI_CURRENCY_BAG_KEYS && window.L2MINI_CURRENCY_BAG_KEYS.adena) || 'Adena';
    var kMoedaAc = (window.L2MINI_CURRENCY_BAG_KEYS && window.L2MINI_CURRENCY_BAG_KEYS.ancient) || 'Ancient Coin';
    if (itemParaVender === kMoedaAd || itemParaVender === kMoedaAc) {
        return window.mostrarAviso(shopT('game.shop.cannotSellCurrency'));
    }
    let inputEl = document.getElementById('input-qtd-venda') as HTMLInputElement | null;
    let val = inputEl ? parseInt(inputEl.value, 10) : 1; 
    if (isNaN(val) || val < 1) return window.mostrarAviso(shopT('game.shop.invalidSellAmount')); 
    if (val > window.inventario[itemParaVender]) val = window.inventario[itemParaVender]; 
    let qtdParaVender = val; 
    let precoUnitario = precosVendaMap()[itemParaVender] || 5; 
    let totalAdena = precoUnitario * qtdParaVender; 
    window.inventario[itemParaVender] -= qtdParaVender; 
    window.adenas += totalAdena; 
    if(typeof window.tocarSom === 'function') window.tocarSom('adenas'); 
    window.escreverLog('<span style="color:#00ff00">' + shopT('game.shop.logSold', { qtd: qtdParaVender, name: itemParaVender, total: totalAdena }) + '</span>');
    
    // Anima o botão de venda também!
    let btn = document.getElementById('btn-vender-item') as HTMLButtonElement | null;
    if (!btn) return;
    let txtOriginal = btn.innerText;
    const soldFlash = shopT('game.shop.soldFlash');
    btn.innerText = soldFlash;
    btn.style.background = "#10b981";
    setTimeout(() => { if(btn && btn.innerText === soldFlash) { btn.innerText = txtOriginal; btn.style.background = "#b91d1d"; } }, 1000);

    if (window.inventario[itemParaVender] <= 0) { 
        delete window.inventario[itemParaVender]; 
        itemParaVender = null; 
        document.getElementById('venda-detalhe-texto').innerHTML = shopT('game.shop.selectItemToSell'); 
        document.getElementById('btn-vender-item').style.display = 'none'; 
        if(document.getElementById('venda-qtd-container')) document.getElementById('venda-qtd-container').style.display = 'none'; 
        _hideVendaCheckoutSummary();
    } else { 
        selecionarItemVenda(itemParaVender, null); 
    } 
    window.atualizar(); abrirLojaVenda(); window.salvarJogo(); 
}

// ==========================================
// SISTEMA DE BUFFS (GRAND MASTER)
// ==========================================
function comprarBuff(tipo: 'fighter' | 'mage' | string): void {
    const EB = window.EconomyBalance;
    let precoBuff = EB && typeof EB.grandMasterBuffPrice === 'function'
        ? EB.grandMasterBuffPrice(shopPlayerLevel())
        : 500;
    
    if (tipo === 'fighter' && window.tempoFimBuffGuerreiro > Date.now()) return window.mostrarAviso(shopT('game.shop.fighterBuffActive'));
    if (tipo === 'mage' && window.tempoFimBuffMistico > Date.now()) return window.mostrarAviso(shopT('game.shop.mageBuffActive'));

    if (window.adenas >= precoBuff) {
        window.adenas -= precoBuff;
        
        let tempoFim = Date.now() + 1800000; 
        
        if (tipo === 'fighter') {
            window.tempoFimBuffGuerreiro = tempoFim;
            window.tempoFimBuffMistico = 0; 
        } else {
            window.tempoFimBuffMistico = tempoFim;
            window.tempoFimBuffGuerreiro = 0; 
        }
        
        if(typeof window.tocarSom === 'function') window.tocarSom('enchant'); 
        if(typeof window.calcularStatusGlobais === 'function') window.calcularStatusGlobais(); 
        window.atualizar();
        window.salvarJogo();
        
        let nomePacote = tipo === 'fighter' ? shopT('game.shop.blessingPackFighter') : shopT('game.shop.blessingPackMage');
        let corMsg = tipo === 'fighter' ? '#10b981' : '#3b82f6';
        
        window.escreverLog(`<span style="color:${corMsg}; font-weight:bold;">${shopT('game.shop.blessingLog', { pack: nomePacote })}</span>`);
        if(typeof window.fecharNpc === 'function') window.fecharNpc();
        
    } else {
        window.mostrarAviso(shopT('game.shop.blessingsNeedAdena', { amount: precoBuff }));
    }
}

window.fecharLoja = fecharLoja;
window.abrirLojaGrocer = abrirLojaGrocer;
window.selecionarConsumivel = selecionarConsumivel;
window.alterarQtdCompra = alterarQtdCompra;
window.setQtdCompraMax = setQtdCompraMax;
window.mostrarGradesEquipment = mostrarGradesEquipment;
window.voltarMenuEquipment = voltarMenuEquipment;
window.abrirMegaLoja = abrirMegaLoja;
window.mudarAbaLoja = mudarAbaLoja;
window.selecionarItemLoja = selecionarItemLoja;
window.fecharVenda = fecharVenda;
window.abrirLojaVenda = abrirLojaVenda;
window.selecionarItemVenda = selecionarItemVenda;
window.alterarQtdVenda = alterarQtdVenda;
window.setQtdVendaMax = setQtdVendaMax;
window.comprarBuff = comprarBuff;

export {};