/**
 * UI — chat global, clã e inspeção de jogadores
 * Migrado: js/ui_chat.js — Fase 4: tipos explícitos.
 */

import type {
  BotRankingSeed,
  ChatHistoryEntry,
  ChatInspectProfileData,
  ChatLogTab,
  ClanChatRow,
  InspectionCacheEntry,
  InspectionCachePreview,
  PlayerStats,
} from '../types/game';

function chatT(key: string, params?: Record<string, string | number>): string {
    return typeof window.t === 'function' ? window.t(key, params) : key;
}

const frasesBotsChat = [
    "Anyone know where Animal Bone drops?",
    "Selling [Sword of Damascus] +4 /pm me!!",
    "Dragon Valley farm party?",
    "These enchant rates are killing me...",
    "Used 50 scrolls, still no +6. I'm done.",
    "Recruiting for clan lvl 5! PM me.",
    "How long until Antharas spawns?",
    "Solo'd by a mob in TOI, shameful lol",
    "Olympiad is spicy today!",
    "Buying Ancient Coins, good pay!",
    "Anyone with Fighter buff in Giran?",
    "That TitanX is cracked ngl.",
    "Raid? Need a healer!",
    "RogueAge is way too addictive...",
    "Finally hit level 80! #Hype",
    "Who wins? Spellsinger or Sorcerer?",
    "GK lag or is it just me?",
    "Buying Grade A augment stones.",
    "Soulshots cheap / Black Friday prices!",
    "Where is NPC Reorin?",
    "Anyone for 1v1 in the arena?",
    "Gladi is the best pvp class, change my mind.",
    "Just dropped a Top Grade Life Stone! GZ",
    "Went for +16 and shattered the weap... F",
    "Any GM online?"
];

let chatIniciado = false;

function resetChatBootstrap(): void {
    chatIniciado = false;
}
const CHAT_HISTORY_LIMIT_DAYS = 3;

/** IDs já mostrados no chat de clã (evita duplicar INSERT local + postgres_changes). */
let clanChatSeenMessageIds = new Set<string | number>();

function isCloudChatUser(): boolean {
    return !!(window.SUPABASE_CONFIG && window.SUPABASE_CONFIG.enabled &&
        window.SupabaseAPI && typeof window.SupabaseAPI.getUser === 'function' && window.SupabaseAPI.getUser());
}

function aplicarMensagemClanCloudRow(row: ClanChatRow, historyReplay = false): void {
    if (!row || !row.id) return;
    if (clanChatSeenMessageIds.has(row.id)) return;
    clanChatSeenMessageIds.add(row.id);
    if (clanChatSeenMessageIds.size > 400) {
        clanChatSeenMessageIds = new Set(Array.from(clanChatSeenMessageIds).slice(-200));
    }
    const ts = row.created_at ? new Date(row.created_at).getTime() : Date.now();
    adicionarMensagemChat(row.char_name, row.body, row.tier || 'Paper', 'clan', true, ts, row.ascension_title || '', historyReplay);
}

function charNamesMatch(a: unknown, b: unknown): boolean {
    const x = String(a || '').trim();
    const y = String(b || '').trim();
    return !!(x && y && x.toLowerCase() === y.toLowerCase());
}

function findClanIdForCharInList(cn: string, clanList: Array<{ id?: string | number; membros?: unknown[]; lider?: string }>): string | number | null {
    if (!cn || !Array.isArray(clanList)) return null;
    for (const c of clanList) {
        if (!c || c.id == null) continue;
        const membros = Array.isArray(c.membros) ? c.membros : [];
        if (membros.some((m) => charNamesMatch(typeof m === 'string' ? m : String(m), cn))) {
            return c.id;
        }
        if (charNamesMatch(c.lider || '', cn)) {
            return c.id;
        }
    }
    return null;
}

/** Resolve clã ativo (window.playerClanId, lista de clãs ou save local). */
function resolveEffectivePlayerClanId() {
    const current = window.playerClanId;
    if (current != null && current !== '') return current;

    const cn = String(window.charName || '').trim();
    if (!cn) return null;

    const fromClans = findClanIdForCharInList(cn, window.clans || []);
    if (fromClans != null) {
        window.playerClanId = fromClans;
        return fromClans;
    }

    try {
        const keys = ['l2mini_player_clan_' + cn, 'l2mini_player_clan_' + cn.toLowerCase()];
        for (const key of keys) {
            const saved = localStorage.getItem(key);
            if (!saved || saved === 'null') continue;
            const parsed = JSON.parse(saved);
            if (parsed != null) {
                window.playerClanId = parsed;
                return parsed;
            }
        }
    } catch (_) { /* ignore */ }

    return null;
}

async function ensureClanIdForChat(): Promise<string | number | null> {
    let id = resolveEffectivePlayerClanId();
    if (id != null) return id;
    if (typeof window.iniciarSistemaClans === 'function') {
        try {
            await window.iniciarSistemaClans();
        } catch (e) {
            console.warn('[Chat] iniciarSistemaClans:', e);
        }
        id = resolveEffectivePlayerClanId();
    }
    return id;
}

function activateClanChatPanel() {
    const btnClan = document.getElementById('btn-tab-clan');
    if (btnClan) btnClan.classList.add('active');
    const chatClan = document.getElementById('chat-clan');
    const chatInput = document.getElementById('chat-input-container');
    if (chatClan) chatClan.classList.add('active');
    if (chatInput) chatInput.style.display = 'flex';
    flushPendingChatScroll(chatClan);
    if (isCloudChatUser()) {
        void sincronizarAbaClanChatCloud();
    }
}

/**
 * Abre subscrição + histórico do chat de clã na nuvem (RLS).
 */
async function sincronizarAbaClanChatCloud() {
    if (!isCloudChatUser() || !window.SupabaseAPI) return;
    const clanId = resolveEffectivePlayerClanId();
    if (clanId == null) return;

    const el = document.getElementById('chat-clan');
    if (!el) return;

    el.innerHTML = '';
    clanChatSeenMessageIds.clear();

    const rows = await window.SupabaseAPI.fetchClanChatHistory!(clanId);
    rows.forEach((row) => aplicarMensagemClanCloudRow(row, true));
    scrollChatPanelToBottom(el, true);

    window.SupabaseAPI.subscribeClanChat?.(clanId, (row) => aplicarMensagemClanCloudRow(row));
}

// ==========================================
// CHAT RECOLHÍVEL (ganha espaço vertical no mobile)
// ==========================================
const CHAT_COLLAPSED_KEY = 'l2mini_chat_collapsed';

type ChatPanelId = 'chat-global' | 'chat-clan';

/** true = colado no fundo; false = jogador rolou para ler histórico antigo */
const chatStickToBottom: Record<ChatPanelId, boolean> = {
    'chat-global': true,
    'chat-clan': true,
};

function isChatPanelNearBottom(panel: HTMLElement): boolean {
    return panel.scrollHeight - panel.scrollTop - panel.clientHeight < 80;
}

function bindChatPanelScrollTracking(): void {
    (['chat-global', 'chat-clan'] as ChatPanelId[]).forEach((id) => {
        const panel = document.getElementById(id);
        if (!panel || panel.dataset.scrollTrackBound === '1') return;
        panel.dataset.scrollTrackBound = '1';
        panel.addEventListener('scroll', () => {
            chatStickToBottom[id] = isChatPanelNearBottom(panel);
        }, { passive: true });
    });
}

function scrollChatPanelToBottom(panel: HTMLElement, force = false): void {
    const panelId = panel.id as ChatPanelId;
    if (panelId !== 'chat-global' && panelId !== 'chat-clan') return;

    const pinned = chatStickToBottom[panelId] !== false;
    if (!force && !pinned) return;

    if (!panel.classList.contains('active')) {
        panel.dataset.pendingScrollBottom = force ? 'force' : '1';
        return;
    }

    const run = () => {
        panel.scrollTop = panel.scrollHeight;
    };

    requestAnimationFrame(() => {
        run();
        requestAnimationFrame(() => {
            run();
            setTimeout(run, 0);
        });
    });
}

function flushPendingChatScroll(panel: HTMLElement | null | undefined): void {
    if (!panel || !panel.classList.contains('active')) return;
    const pending = panel.dataset.pendingScrollBottom;
    if (pending) {
        delete panel.dataset.pendingScrollBottom;
        scrollChatPanelToBottom(panel, pending === 'force');
        return;
    }
    const panelId = panel.id as ChatPanelId;
    if (panelId === 'chat-global' || panelId === 'chat-clan') {
        if (chatStickToBottom[panelId] !== false) {
            scrollChatPanelToBottom(panel, true);
        }
    }
}

/** Estado do chat antes do auto-collapse de combate (não persiste em localStorage). */
let chatCollapsedBeforeCombat: boolean | null = null;

function stripLogHtml(html: string): string {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return (tmp.textContent || tmp.innerText || '').replace(/\s+/g, ' ').trim();
}

type LogPreviewKind = 'combat' | 'heal' | 'loot' | 'warn' | 'system' | 'chat' | 'neutral';

function getActiveLogPanel(): HTMLElement | null {
    return (
        document.querySelector<HTMLElement>('#log.log-content.active')
        || document.querySelector<HTMLElement>('#chat-global.log-content.active')
        || document.querySelector<HTMLElement>('#chat-clan.log-content.active')
        || document.getElementById('log')
    );
}

function getLatestPanelEntry(panel: HTMLElement): { html: string; text: string } {
    const isChatPanel = panel.id === 'chat-global' || panel.id === 'chat-clan';
    const child = (isChatPanel ? panel.lastElementChild : panel.firstElementChild) as HTMLElement | null;
    if (child) {
        return { html: child.outerHTML, text: stripLogHtml(child.innerHTML) };
    }
    const raw = (panel.innerHTML || '').trim();
    if (!raw) return { html: '', text: '' };
    const firstBreak = raw.search(/<br\s*\/?>/i);
    const chunk = firstBreak >= 0 ? raw.slice(0, firstBreak) : raw;
    return { html: chunk, text: stripLogHtml(chunk) };
}

function inferLogPreviewKind(html: string, text: string, panelId: string): LogPreviewKind {
    if (panelId === 'chat-global' || panelId === 'chat-clan') return 'chat';
    const lower = text.toLowerCase();
    const colorMatch = html.match(/color:\s*#([0-9a-f]{3,6})/i);
    const hex = colorMatch ? colorMatch[1].toLowerCase() : '';

    if (hex === 'ef4444' || lower.includes('fail') || lower.includes('crystallized') || lower.includes('no hp') || lower.includes('no mana')) {
        return 'warn';
    }
    if (hex === '10b981' || lower.includes('heal') || lower.includes('hp potion') || lower.includes('regenerat')) {
        return 'heal';
    }
    if (lower.includes('damage') || lower.includes('dano') || lower.includes('dealt') || lower.includes('duel')) {
        return 'combat';
    }
    if (hex === 'facc15' || hex === 'fde047' || lower.includes('adena') || lower.includes('drop') || lower.includes('obtained')) {
        return 'loot';
    }
    if (hex === 'aaa' || lower.includes('faded') || lower.includes('ended') || lower.includes('wore off')) {
        return 'system';
    }
    return 'neutral';
}

function logPreviewTagForKind(kind: LogPreviewKind): string {
    if (typeof window.t !== 'function') {
        const fallback: Record<LogPreviewKind, string> = {
            combat: 'FIGHT', heal: 'HEAL', loot: 'LOOT', warn: '!', system: 'SYS', chat: 'CHAT', neutral: 'LOG',
        };
        return fallback[kind];
    }
    switch (kind) {
        case 'combat': return window.t('chat.previewTagCombat');
        case 'heal': return window.t('chat.previewTagHeal');
        case 'loot': return window.t('chat.previewTagLoot');
        case 'warn': return window.t('chat.previewTagWarn');
        case 'system': return window.t('chat.previewTagSystem');
        case 'chat': return window.t('chat.previewTagChat');
        default: return window.t('chat.previewTagNeutral');
    }
}

function refreshLogCollapsedPreview(): void {
    const preview = document.getElementById('log-collapsed-preview');
    const tagEl = document.getElementById('log-collapsed-preview-tag');
    const textEl = document.getElementById('log-collapsed-preview-text');
    const cont = document.querySelector('.log-container');
    if (!preview || !textEl || !cont) return;

    const collapsed = cont.classList.contains('log-container--collapsed');
    if (!collapsed) {
        preview.hidden = true;
        if (tagEl) tagEl.textContent = '';
        textEl.textContent = '';
        preview.className = 'log-collapsed-preview';
        return;
    }

    const panel = getActiveLogPanel();
    if (!panel) return;

    const { html, text } = getLatestPanelEntry(panel);
    const emptyLabel = typeof window.t === 'function' ? window.t('chat.collapsedEmpty') : 'No recent messages';

    if (!text) {
        preview.className = 'log-collapsed-preview log-collapsed-preview--neutral';
        if (tagEl) tagEl.textContent = '';
        textEl.textContent = emptyLabel;
        preview.hidden = false;
        return;
    }

    const kind = inferLogPreviewKind(html, text, panel.id);
    preview.className = `log-collapsed-preview log-collapsed-preview--${kind}`;
    if (tagEl) tagEl.textContent = logPreviewTagForKind(kind);
    textEl.textContent = text.slice(0, 96);
    preview.hidden = false;
}

function aplicarChatCollapse(collapsed: boolean): void {
    const cont = document.querySelector('.log-container');
    const btn = document.getElementById('btn-log-collapse');
    if (!cont) return;
    cont.classList.toggle('log-container--collapsed', collapsed);
    if (btn) {
        btn.textContent = collapsed ? '▴' : '▾';
        btn.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
    }
    refreshLogCollapsedPreview();
    if (!collapsed) {
        const panel = getActiveLogPanel();
        if (panel && (panel.id === 'chat-global' || panel.id === 'chat-clan')) {
            flushPendingChatScroll(panel);
        }
    }
}

let combatLogTabDefaultLabel: string | null = null;

/** Recolhe o chat durante combate na floresta; modo log-only (só SYSTEM). */
function setChatCollapsedForCombat(inCombat: boolean): void {
    const cont = document.querySelector('.log-container');
    if (!cont) return;

    const combatTab = document.getElementById('btn-tab-combat');

    if (inCombat) {
        if (chatCollapsedBeforeCombat !== null) return;
        chatCollapsedBeforeCombat = cont.classList.contains('log-container--collapsed');
        cont.classList.add('log-container--hunt-log-only');
        if (combatTab) {
            if (combatLogTabDefaultLabel === null) combatLogTabDefaultLabel = combatTab.textContent || 'SYSTEM';
            combatTab.textContent = typeof window.t === 'function'
                ? window.t('chat.huntLogTab')
                : 'COMBAT LOG';
        }
        applyLogTabSwitch('combat');
        if (!chatCollapsedBeforeCombat) aplicarChatCollapse(true);
        refreshLogCollapsedPreview();
    } else {
        cont.classList.remove('log-container--hunt-log-only');
        if (combatTab && combatLogTabDefaultLabel !== null) {
            combatTab.textContent = combatLogTabDefaultLabel;
            combatLogTabDefaultLabel = null;
        }
        if (chatCollapsedBeforeCombat === null) return;
        const restoreCollapsed = chatCollapsedBeforeCombat;
        chatCollapsedBeforeCombat = null;
        aplicarChatCollapse(restoreCollapsed);
    }
}

function toggleChatCollapse(): void {
    const cont = document.querySelector('.log-container');
    const collapsed = !(cont && cont.classList.contains('log-container--collapsed'));
    aplicarChatCollapse(collapsed);
    if (chatCollapsedBeforeCombat !== null) {
        chatCollapsedBeforeCombat = collapsed;
    } else {
        try {
            localStorage.setItem(CHAT_COLLAPSED_KEY, collapsed ? '1' : '0');
        } catch (e) { /* storage cheio/indisponível — estado só da sessão */ }
    }
}

function restaurarChatCollapse(): void {
    let collapsed = false;
    try {
        collapsed = localStorage.getItem(CHAT_COLLAPSED_KEY) === '1';
    } catch (e) { /* ignore */ }
    if (collapsed) aplicarChatCollapse(true);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        restaurarChatCollapse();
        bindLogCollapsedPreviewKeys();
    });
} else {
    restaurarChatCollapse();
    bindLogCollapsedPreviewKeys();
}

function bindLogCollapsedPreviewKeys(): void {
    const preview = document.getElementById('log-collapsed-preview');
    if (!preview || preview.dataset.keysBound === '1') return;
    preview.dataset.keysBound = '1';
    preview.addEventListener('keydown', (e: KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggleChatCollapse();
        }
    });
}

function applyLogTabSwitch(tab: ChatLogTab | string): void {
    if (tab !== 'clan' && window.SupabaseAPI && typeof window.SupabaseAPI.unsubscribeClanChat === 'function') {
        window.SupabaseAPI.unsubscribeClanChat();
    }

    const log = document.getElementById('log');
    const chatGlobal = document.getElementById('chat-global');
    const chatClan = document.getElementById('chat-clan');
    const chatInput = document.getElementById('chat-input-container');

    if (log) log.classList.remove('active');
    if (chatGlobal) chatGlobal.classList.remove('active');
    if (chatClan) chatClan.classList.remove('active');
    if (chatInput) chatInput.style.display = 'none';

    document.querySelectorAll('.log-tab').forEach(btn => btn.classList.remove('active'));

    if (tab === 'combat') {
        document.getElementById('btn-tab-combat')?.classList.add('active');
        log?.classList.add('active');
    } else if (tab === 'chat') {
        document.getElementById('btn-tab-chat')?.classList.add('active');
        chatGlobal?.classList.add('active');
        if (chatInput) chatInput.style.display = 'flex';
        flushPendingChatScroll(chatGlobal);
    } else if (tab === 'clan') {
        void (async () => {
            const clanId = await ensureClanIdForChat();
            if (clanId == null) {
                if (typeof window.mostrarAviso === 'function') window.mostrarAviso(chatT('chat.clanOnly'));
                switchLogTab('chat');
                return;
            }
            activateClanChatPanel();
        })();
    }
}

/**
 * Alterna entre as abas de LOG (Combat/System), CHAT (Global) e CLAN
 */
function switchLogTab(tab: ChatLogTab | string): void {
    const contColl = document.querySelector('.log-container');
    if (contColl?.classList.contains('log-container--hunt-log-only') && tab !== 'combat') {
        return;
    }
    if (contColl && contColl.classList.contains('log-container--collapsed')) {
        aplicarChatCollapse(false);
        if (chatCollapsedBeforeCombat !== null) {
            chatCollapsedBeforeCombat = false;
        } else {
            try { localStorage.setItem(CHAT_COLLAPSED_KEY, '0'); } catch (e) { /* ignore */ }
        }
    }
    applyLogTabSwitch(tab);
}

/**
 * Escapa caracteres HTML para evitar ataques XSS
 */
function escaparHTML(str: unknown): string {
    const p = document.createElement('p');
    p.textContent = str == null ? '' : String(str);
    return p.innerHTML;
}

let lastMessageTime = 0;
const SPAM_COOLDOWN = 1000; // 1 segundo entre mensagens

/**
 * Adiciona uma mensagem visual ao container de chat (global ou clan)
 */
function adicionarMensagemChat(
    autor: string,
    mensagem: string,
    tipo = 'papel',
    canal: 'global' | 'clan' = 'global',
    pularPersistencia = false,
    forcedTimestamp: number | null = null,
    ascensionTitle = '',
    historyReplay = false,
): void {
    const containerId = canal === 'clan' ? 'chat-clan' : 'chat-global';
    const chatContainer = document.getElementById(containerId);
    if (!chatContainer) return;

    // Sanitização de segurança
    const autorLimpo = escaparHTML(autor);
    const mensagemLimpa = escaparHTML(mensagem);

    // Determina se a mensagem é do jogador ATUAL (para ficar verde)
    const ehOMeuPersonagem = (typeof window.charName !== 'undefined' && autor === window.charName);
    
    // Normaliza o tipo para as classes CSS (pega apenas o primeiro nome se houver divisão, ex: "Paper 5" -> "paper")
    let tierBase = tipo.split(' ')[0];
    let classeCor = tierBase.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    
    // Tratamento especial para anúncios de GM
    let isAnnouncement = (tipo === 'GM_ANNOUNCEMENT');
    if (isAnnouncement) {
        classeCor = "announcement";
    }

    // Se for o personagem que está logado AGORA, aplica a cor verde especial, 
    // independente de como a mensagem foi salva originalmente.
    if (ehOMeuPersonagem && !isAnnouncement) {
        classeCor = "player";
    }

    // Busca tag de clã (se houver e não for chat de clã)
    let clanTag = "";
    if (canal !== 'clan' && Array.isArray(window.clans) && !isAnnouncement) {
        const clan = window.clans.find((c) => {
            const membros = Array.isArray(c.membros) ? c.membros : [];
            return membros.some((m) => m === autor);
        });
        if (clan && typeof clan.sigla === 'string') {
            clanTag = `<span style="color: #ca8a04; font-size: 0.85em; margin-right: 4px; font-weight: bold;">[${clan.sigla}]</span>`;
        }
    }

    let ascensionBadge = '';
    if (!isAnnouncement) {
        let effectiveAsc = typeof ascensionTitle === 'string' ? ascensionTitle.trim() : '';
        if (!effectiveAsc && ehOMeuPersonagem && window.EndgamePursuits && typeof window.EndgamePursuits.getRenownTitle === 'function') {
            effectiveAsc = window.EndgamePursuits.getRenownTitle() || '';
        }
        if (effectiveAsc) {
            ascensionBadge = `<span style="color:#c084fc;font-size:0.82em;font-weight:700;margin-right:5px;font-family:'Cinzel',serif;">[${escaparHTML(effectiveAsc)}]</span>`;
        }
    }

    const dataMsg = forcedTimestamp ? new Date(forcedTimestamp) : new Date();
    const hora = dataMsg.getHours().toString().padStart(2, '0');
    const minuto = dataMsg.getMinutes().toString().padStart(2, '0');
    const timestampHtml = `<span style="color: #555; font-size: 0.9em; margin-right: 5px;">[${hora}:${minuto}]</span>`;

    // Persistência local (Simulando Multiplayer)
    if (!pularPersistencia) {
        const hist: ChatHistoryEntry = { autor, mensagem, tipo, timestamp: Date.now() };
        const trimmedAsc = typeof ascensionTitle === 'string' ? ascensionTitle.trim() : '';
        if (trimmedAsc) hist.ascensionTitle = trimmedAsc;
        salvarMensagemNoHistorico(canal, hist);
    }

    // Usamos aspas duplas no onclick e escapamos aspas simples no nome para evitar quebra de JS
    const autorParaJS = autorLimpo.replace(/'/g, "\\'");

    // Prefixo do canal para o chat de clã
    const prefixoCanal = canal === 'clan' ? `<span style="color: #ca8a04; font-weight: bold; margin-right: 5px;">[CLAN]</span>` : "";

    let msgHtml = "";
    if (isAnnouncement) {
        msgHtml = `
            <div class="chat-msg announcement-msg" style="background: rgba(153, 27, 27, 0.2); border: 1px solid #ef4444; border-radius: 4px; padding: 5px 10px; margin: 5px 0;">
                <span style="color: #ef4444; font-weight: bold; font-family: 'Cinzel';">[ANNOUNCEMENT]</span>
                <span class="chat-text" style="color: #fff; font-weight: bold;">${mensagemLimpa}</span>
            </div>
        `;
    } else {
        msgHtml = `
            <div class="chat-msg">
                ${timestampHtml}
                ${prefixoCanal}
                ${clanTag}
                ${ascensionBadge}
                <span class="chat-author ${classeCor}" onclick="abrirPerfilChat('${autorParaJS}', '${tipo}')">${autorLimpo}:</span>
                <span class="chat-text" style="color: #e5dacc;">${mensagemLimpa}</span>
            </div>
        `;
    }

    chatContainer.insertAdjacentHTML('beforeend', msgHtml);

    if (chatContainer.children.length > 50) {
        chatContainer.removeChild(chatContainer.firstElementChild!);
    }

    if (!historyReplay) {
        const panelId = chatContainer.id as ChatPanelId;
        if (ehOMeuPersonagem) chatStickToBottom[panelId] = true;
        scrollChatPanelToBottom(chatContainer, ehOMeuPersonagem);
    }
    window.refreshLogCollapsedPreview?.();
}

/**
 * Salva a mensagem no LocalStorage e remove mensagens com mais de 3 dias
 */
function salvarMensagemNoHistorico(canal: 'global' | 'clan', msgObj: ChatHistoryEntry): void {
    const key = canal === 'clan' ? 'l2mini_chat_clan_history' : 'l2mini_chat_global_history';
    let history: ChatHistoryEntry[] = [];
    
    try {
        const saved = localStorage.getItem(key);
        if (saved) history = JSON.parse(saved);
    } catch (e) { history = []; }

    if (msgObj.cloudId != null) {
        history = history.filter((m) => String(m.cloudId || '') !== String(msgObj.cloudId));
    }

    history.push(msgObj);

    // Limpeza: Mantém apenas os últimos 3 dias
    const tresDiasAtras = Date.now() - (CHAT_HISTORY_LIMIT_DAYS * 24 * 60 * 60 * 1000);
    history = history.filter(m => m.timestamp > tresDiasAtras);

    // Limite de segurança para não explodir o localStorage (ex: 200 mensagens)
    if (history.length > 200) history = history.slice(-200);

    localStorage.setItem(key, JSON.stringify(history));
}

/**
 * Carrega o histórico de mensagens salvas
 */
function carregarHistoricoChat(): void {
    const canais: Array<'global' | 'clan'> = ['global', 'clan'];
    const cloud = isCloudChatUser();

    canais.forEach(canal => {
        if (cloud && canal === 'clan') return;

        const key = canal === 'clan' ? 'l2mini_chat_clan_history' : 'l2mini_chat_global_history';
        try {
            const saved = localStorage.getItem(key);
            if (!saved) return;
            
            let history = JSON.parse(saved) as ChatHistoryEntry[];
            const tresDiasAtras = Date.now() - (CHAT_HISTORY_LIMIT_DAYS * 24 * 60 * 60 * 1000);
            
            // Filtra e ordena por timestamp (antigas primeiro → novas em baixo)
            history = history
                .filter(m => m.timestamp > tresDiasAtras)
                .sort((a, b) => a.timestamp - b.timestamp);

            history.forEach(m => {
                adicionarMensagemChat(m.autor, m.mensagem, m.tipo, canal, true, m.timestamp, m.ascensionTitle || '', true);
            });

            const panel = document.getElementById(canal === 'clan' ? 'chat-clan' : 'chat-global');
            if (panel && history.length) scrollChatPanelToBottom(panel, true);
        } catch (e) { console.error(`Erro ao carregar histórico de chat (${canal}):`, e); }
    });
}

/**
 * Sistema de Cache para Inspeção (Evita lag de rede em cliques repetidos)
 */
const inspectionCache = new Map<string, InspectionCacheEntry>();
const CACHE_DURATION = 120000; // 2 minutos

/** Leitura defensiva para UI (ex.: lista de membros no clã) — só dados em cache válidos */
window.getInspectionCacheEntry = function (nome: string): InspectionCachePreview | null {
    if (!nome) return null;
    const key = String(nome).trim();
    const cached = inspectionCache.get(key);
    if (!cached || (Date.now() - cached.timestamp >= CACHE_DURATION)) return null;
    const d = cached.data;
    if (!d || typeof d !== 'object') return null;
    return {
        nivel: typeof d.nivel !== 'undefined' && d.nivel !== null ? d.nivel : null,
        classe: d.classe || null,
        raca: d.raca || null,
        charGender: d.charGender || null
    };
};

/**
 * Abre o perfil de um jogador do chat (bot ou player)
 */
function abrirPerfilChat(nome: string, tipo?: string): void {
    void tipo;
    // Se clicar no próprio nome, abre o perfil do jogador
    if (typeof window.charName !== 'undefined' && nome === window.charName) {
        if (typeof window.irPara === 'function') window.irPara('perfil');
        return;
    }

    // MULTIPLAYER: Tenta buscar dados do jogador real na nuvem
    if (window.SupabaseAPI && window.SUPABASE_CONFIG && window.SUPABASE_CONFIG.enabled) {
        const cacheKey = String(nome).trim();

        // Verifica se temos os dados no cache e se não expiraram
        let cached = inspectionCache.get(cacheKey);
        if (!cached && nome !== cacheKey) cached = inspectionCache.get(nome);
        if (cached && (Date.now() - cached.timestamp < CACHE_DURATION)) {
            console.log("⚡ [Cache] Usando dados locais para:", nome);
            window.botAtualVisualizado = cached.data;
            if (typeof window.abrirPerfilJogadorRanking === 'function') {
                var openAs = (cached.data && cached.data.nome) ? String(cached.data.nome).trim() : cacheKey;
                window.abrirPerfilJogadorRanking(openAs, true);
            }
            return;
        }

        // Se não tem cache, busca na nuvem
        if (window.mostrarAviso) window.mostrarAviso(chatT('chat.inspecting', { name: String(nome).replace(/[<>&]/g, '') }));

        console.log('🔍 Buscando dados cloud autoritativos para inspeção:', nome);

        const client = window.SupabaseAPI.client;
        if (!client) {
            tentarAbrirPerfilLegado(nome);
            return;
        }

        const keyEq = String(nome).trim();
        void (async () => {
            let res = await client
                .from('characters')
                .select('char_name, char_class, level, data')
                .eq('char_name', keyEq)
                .maybeSingle();
            if (!res.error && !res.data) {
                res = await client
                    .from('characters')
                    .select('char_name, char_class, level, data')
                    .ilike('char_name', keyEq)
                    .maybeSingle();
            }

            const { data, error } = res;
            if (error) {
                console.error('Erro na busca de inspeção:', error);
                tentarAbrirPerfilLegado(nome);
                return;
            }

            const row = data as {
                char_name?: string;
                char_class?: string;
                level?: number;
                data?: Record<string, unknown>;
            } | null;

            if (row?.data) {
                const realData = (typeof window.unwrapCloudCharacterJsonb === 'function')
                    ? (window.unwrapCloudCharacterJsonb(row.data) as Record<string, unknown>)
                    : row.data;

                const clsRaw = row.char_class || (realData.charClass as string) || 'Fighter';
                const clsDisplay = (typeof window.formatClassDisplayName === 'function')
                    ? window.formatClassDisplayName(clsRaw)
                    : String(clsRaw).replace(/_/g, ' ');

                const saveForCalc = { ...realData } as Record<string, unknown>;
                saveForCalc.charClass = clsRaw;
                saveForCalc.nivel = row.level != null ? row.level : (realData.nivel as number) || 1;
                saveForCalc.charRace = realData.charRace || 'Human';
                if (realData.charGender) saveForCalc.charGender = realData.charGender;

                let authoritativeStats: Partial<PlayerStats> = {};
                if (typeof window.calcularStatusGlobaisFromData === 'function') {
                    try {
                        const stComp = window.calcularStatusGlobaisFromData(saveForCalc);
                        if (stComp && typeof stComp === 'object' && typeof stComp.pAtk === 'number') {
                            authoritativeStats = stComp as Partial<PlayerStats>;
                        }
                    } catch (statsEx) {
                        console.warn('[inspect] calcularStatusGlobaisFromData', statsEx);
                    }
                }
                if (typeof authoritativeStats.pAtk !== 'number') {
                    authoritativeStats = (realData.playerStats as Partial<PlayerStats>) || {};
                }

                const ce = (typeof window.coerceInspectEquipItem === 'function')
                    ? window.coerceInspectEquipItem
                    : (x: unknown) => x;
                const pickEq = (typeof window.pickInspectSaveEquip === 'function')
                    ? window.pickInspectSaveEquip
                    : (rd: Record<string, unknown>, keys: string[]) => {
                        if (!rd || !keys.length) return null;
                        for (const pk of keys) {
                            if (Object.prototype.hasOwnProperty.call(rd, pk) && rd[pk] != null) return rd[pk];
                        }
                        return null;
                    };
                const armaR = pickEq(realData, ['armaEquipadaBase', 'arma_equipada_base', 'ArmaEquipadaBase']);
                const armR = pickEq(realData, ['armaduraEquipada', 'armadura_equipada', 'ArmaduraEquipada', 'ArmorEquipped', 'equippedArmor']);
                const j1 = realData.colarEquipado != null ? realData.colarEquipado : realData.colar_equipado;
                const j2 = realData.brincoEquipado1 != null ? realData.brincoEquipado1 : realData.brinco_equipado1;
                const j3 = realData.brincoEquipado2 != null ? realData.brincoEquipado2 : realData.brinco_equipado2;
                const j4 = realData.anelEquipado1 != null ? realData.anelEquipado1 : realData.anel_equipado1;
                const j5 = realData.anelEquipado2 != null ? realData.anelEquipado2 : realData.anel_equipado2;

                const egBlock = realData.endgame as { renown?: number } | undefined;
                const egR = egBlock && typeof egBlock.renown === 'number' ? egBlock.renown : 0;
                const ascTitleInspect =
                    window.EndgamePursuits?.getAscensionTitleForRenown
                        ? window.EndgamePursuits.getAscensionTitleForRenown(egR)
                        : '';

                const profileData: ChatInspectProfileData = {
                    nome: row.char_name ?? nome,
                    classe: clsDisplay,
                    _classKey: clsRaw,
                    nivel: row.level || (realData.nivel as number) || 1,
                    olympiadPoints: (realData.olympiadPoints as number) || 0,
                    raca: (realData.charRace as string) || 'Human',
                    charGender: realData.charGender === 'Female' || realData.charGender === 'Male'
                        ? (realData.charGender as string)
                        : 'Male',
                    isMage: window.isClasseMagica ? window.isClasseMagica(clsRaw) : false,
                    maxHp: authoritativeStats.maxHp || 1000,
                    maxMp: authoritativeStats.maxMp || 500,
                    pAtk: authoritativeStats.pAtk || 100,
                    mAtk: authoritativeStats.mAtk || 100,
                    pDef: authoritativeStats.pDef || 100,
                    mDef: authoritativeStats.mDef || 100,
                    atkSpd: authoritativeStats.atkSpeed || 3800,
                    critRate: authoritativeStats.critRate || 5,
                    renown: egR,
                    ascensionTitle: ascTitleInspect,
                    isCloudPlayerInspection: true,
                    equipamentos: {
                        arma: ce(armaR, 'weapon'),
                        armadura: ce(armR, 'armor'),
                        joias: [
                            ce(j1, 'jewel'), ce(j2, 'jewel'), ce(j3, 'jewel'),
                            ce(j4, 'jewel'), ce(j5, 'jewel'),
                        ].filter((j) => !!j),
                        enchant: (realData.enchant as number) || 0,
                    },
                };

                const cachePayload: InspectionCacheEntry = {
                    data: profileData,
                    timestamp: Date.now(),
                };
                const canonName = String(row.char_name).trim();
                inspectionCache.set(canonName, cachePayload);
                if (keyEq.toLowerCase() !== canonName.toLowerCase()) {
                    inspectionCache.set(keyEq, cachePayload);
                }

                window.botAtualVisualizado = profileData;

                if (typeof window.abrirPerfilJogadorRanking === 'function') {
                    window.abrirPerfilJogadorRanking(row.char_name!, true);
                }
            } else {
                window.l2Alert(chatT('chat.playerNotFoundCloud'));
                tentarAbrirPerfilLegado(nome);
            }
        })();
        return;
    }

    tentarAbrirPerfilLegado(nome);
}

function tentarAbrirPerfilLegado(nome: string): void {
    // Tenta carregar como outro jogador salvo localmente ou bot
    if (typeof window.abrirPerfilMembroClan === 'function') {
        window.abrirPerfilMembroClan(nome, true);
    } else if (typeof window.dbBotsRanking !== 'undefined') {
        const botData = window.dbBotsRanking.find((b) => {
            const row = b as BotRankingSeed;
            return (row.nome || row.farmBot1) === nome;
        });
        if (botData && typeof window.abrirPerfilJogadorRanking === 'function') {
            window.abrirPerfilJogadorRanking(nome, true);
        }
    }
}

/**
 * Envia a mensagem digitada pelo jogador
 */
function enviarMensagemPlayer(): void {
    const input = document.getElementById('input-chat-msg');
    if (!(input instanceof HTMLInputElement)) return;
    
    const msg = input.value.trim();
    
    if (msg.length === 0) return;

    // Detecta o canal atual baseado na aba ativa
    const btnClan = document.getElementById('btn-tab-clan');
    const canalAtual: 'global' | 'clan' = (btnClan && btnClan.classList.contains('active')) ? 'clan' : 'global';

    // Controle de Spam
    const agora = Date.now();
    if (agora - lastMessageTime < SPAM_COOLDOWN) {
        if (typeof window.mostrarAviso === 'function') window.mostrarAviso(chatT('chat.spamWait'));
        return;
    }
    lastMessageTime = agora;

    if (msg.length > 100) {
        if (typeof window.mostrarAviso === 'function') window.mostrarAviso(chatT('chat.msgTooLong'));
        return;
    }

    // Pega o rank atual do player para salvar no histórico (caso mude de conta, mostra o rank antigo)
    let rankData = (typeof window.getOlympiadRank === 'function') ? window.getOlympiadRank(window.olympiadPoints) : { nomeCompleto: 'Paper 5' };
    
    const meuNome = typeof window.charName !== 'undefined' ? window.charName : "Player";
    const ascTitle =
        (window.EndgamePursuits && typeof window.EndgamePursuits.getRenownTitle === 'function')
            ? (window.EndgamePursuits.getRenownTitle() || '')
            : '';

    const cloudUser = isCloudChatUser();
    const isClanCloud = canalAtual === 'clan' && cloudUser;
    const isGlobalCloud = canalAtual === 'global' && cloudUser;

    if (!isClanCloud && !isGlobalCloud) {
        adicionarMensagemChat(meuNome, msg, rankData.nomeCompleto, canalAtual, false, null, ascTitle);
    }
    input.value = '';

    if (isGlobalCloud) {
        void window.GlobalChatEngine?.send(meuNome, msg, rankData.nomeCompleto, ascTitle);
    }

    if (isClanCloud) {
        void (async () => {
            try {
                const clanId = await ensureClanIdForChat();
                if (clanId == null) return;
                const r = await window.SupabaseAPI.insertClanChatMessage!(
                    clanId, msg, rankData.nomeCompleto, ascTitle,
                );
                if (r.error) {
                    if (typeof window.mostrarAviso === 'function') {
                        window.mostrarAviso(typeof window.t === 'function' ? window.t('game.cloud.clanChatSendFailed') : 'Clan message could not be sent. Sync your character or check membership.');
                    }
                    return;
                }
                // A mensagem será adicionada via Realtime (subscribeClanChat)
            } catch (e) {
                console.warn('Clan chat cloud:', e);
                if (typeof window.mostrarAviso === 'function') {
                    window.mostrarAviso(typeof window.t === 'function' ? window.t('game.cloud.clanChatSendFailed') : 'Clan message could not be sent.');
                }
            }
        })();
    }

    // Simulação de Multiplayer (Canal Global) - Só sem sessão cloud (evita bots falsos / ruído)
    if (canalAtual === 'global' && !cloudUser) {
        // Pequena chance de um bot responder a você (interação simulada)
        if (Math.random() > 0.7) {
            setTimeout(() => {
                const respostas = [
                    "kkkkk concordo",
                    "boa!",
                    "?",
                    "fala mais sobre isso ae",
                    "quem?",
                    "bora pvp então",
                    "isso aí!",
                    "pior que é verdade kkk"
                ];
                
                if (typeof window.dbBotsRanking !== 'undefined' && window.dbBotsRanking.length > 0) {
                    const bot = window.dbBotsRanking[Math.floor(Math.random() * window.dbBotsRanking.length)] as BotRankingSeed;
                    const nomeBot = bot.nome || bot.farmBot1 || 'Adventurer';
                    const frase = respostas[Math.floor(Math.random() * respostas.length)];
                    
                    // Pega o rank do bot que respondeu
                    let rankBot = (typeof window.getOlympiadRank === 'function')
                        ? window.getOlympiadRank(Number(bot.olympiadPoints) || 0)
                        : { nomeCompleto: 'Paper 5' };
                    adicionarMensagemChat(nomeBot, frase, rankBot.nomeCompleto, 'global');
                }
            }, 2000);
        }
    } 
    // Simulação local (clã) — não misturar com broadcast real
    else if (canalAtual === 'clan' && !cloudUser) {
        setTimeout(() => {
            const meuClan = window.clans.find((c) => c.id === window.playerClanId);
            const membros = meuClan && Array.isArray(meuClan.membros) ? meuClan.membros : [];
            if (meuClan && membros.length > 1) {
                const outrosMembros = membros.filter((m) => m !== meuNome);
                if (outrosMembros.length > 0) {
                    const membro = outrosMembros[Math.floor(Math.random() * outrosMembros.length)];
                    const respostasClan = [
                        "Opa, fala!",
                        "Bora farmar depois?",
                        "Alguém on pra Raid?",
                        "Amanhã tem Siege hein",
                        "Salve clã!",
                        "Tamo junto"
                    ];
                    const frase = respostasClan[Math.floor(Math.random() * respostasClan.length)];
                    
                    // Busca dados do bot/membro para pegar o rank
                    let rankMembro = { nomeCompleto: 'Paper 5' };
                    if (typeof window.dbBotsRanking !== 'undefined') {
                        const botData = window.dbBotsRanking.find((b) => {
                            const row = b as BotRankingSeed;
                            return (row.nome || row.farmBot1) === membro;
                        }) as BotRankingSeed | undefined;
                        if (botData) rankMembro = window.getOlympiadRank(Number(botData.olympiadPoints) || 0);
                    }
                    
                    adicionarMensagemChat(membro, frase, rankMembro.nomeCompleto, 'clan');
                }
            }
        }, 1500);
    }
}

/**
 * Inicia o loop de mensagens automáticas dos bots
 */
function iniciarChatAutomatico() {
    const cloudEnabled = !!(window.SUPABASE_CONFIG && window.SUPABASE_CONFIG.enabled);
    const cloudUser = isCloudChatUser();

    if (chatIniciado) {
        if (cloudUser) void window.GlobalChatEngine?.start(true);
        return;
    }

    if (cloudEnabled && !cloudUser) {
        setTimeout(iniciarChatAutomatico, 1500);
        return;
    }

    chatIniciado = true;
    bindChatPanelScrollTracking();

    if (cloudUser) {
        console.log('☁️ [Chat] Modo nuvem — GlobalChatEngine');
        void window.GlobalChatEngine?.start();
        return;
    }

    carregarHistoricoChat();

    // Função para gerar uma mensagem aleatória de um bot
    function gerarMensagemAleatoria() {
        if (typeof window.dbBotsRanking === 'undefined' || window.dbBotsRanking.length === 0) {
            // Se o DB de bots ainda não carregou, tenta novamente em breve
            setTimeout(gerarMensagemAleatoria, 2000);
            return;
        }

        // Escolhe um bot aleatório
        const bot = window.dbBotsRanking[Math.floor(Math.random() * window.dbBotsRanking.length)] as BotRankingSeed;
        const nomeBot = bot.nome || bot.farmBot1 || 'Adventurer';
        
        // Escolhe uma frase aleatória
        const frase = frasesBotsChat[Math.floor(Math.random() * frasesBotsChat.length)];
        
        // Pega o rank real do bot baseado nos pontos dele
        let rankBot = (typeof window.getOlympiadRank === 'function')
            ? window.getOlympiadRank(Number(bot.olympiadPoints) || 0)
            : { nomeCompleto: 'Paper 5' };

        adicionarMensagemChat(nomeBot, frase, rankBot.nomeCompleto);

        // Define o próximo intervalo (entre 5 a 15 segundos)
        const proximoIntervalo = Math.floor(Math.random() * 10000) + 5000;
        setTimeout(gerarMensagemAleatoria, proximoIntervalo);
    }

    // Inicia o loop
    setTimeout(gerarMensagemAleatoria, 3000);
}

// Ouvinte para o Enter no chat
bindChatPanelScrollTracking();

document.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter') return;
    const inputChat = document.getElementById('input-chat-msg');
    const containerChat = document.getElementById('chat-input-container');
    if (!(inputChat instanceof HTMLInputElement) || !(containerChat instanceof HTMLElement)) return;

    if (containerChat.style.display === 'flex' && document.activeElement === inputChat) {
        window.enviarMensagemPlayer();
    } else if (containerChat.style.display === 'flex') {
        inputChat.focus();
    }
});

window.switchLogTab = switchLogTab;
window.toggleChatCollapse = toggleChatCollapse;
window.setChatCollapsedForCombat = setChatCollapsedForCombat;
window.refreshLogCollapsedPreview = refreshLogCollapsedPreview;
window.scrollChatPanelToBottom = scrollChatPanelToBottom;
window.abrirPerfilChat = abrirPerfilChat;
window.enviarMensagemPlayer = enviarMensagemPlayer;
window.iniciarChatAutomatico = iniciarChatAutomatico;
window.resetChatBootstrap = resetChatBootstrap;
window.adicionarMensagemChat = adicionarMensagemChat;

export {};
