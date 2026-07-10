/**
 * Global chat — Postgres (histórico) + Realtime + broadcast (live).
 * Fonte de verdade na nuvem quando SQL está aplicado; cache local como espelho offline.
 */
import type { ChatHistoryEntry, GlobalChatRow } from '../types/game';

const HISTORY_DAYS = 3;
const HISTORY_MAX = 200;
const LOCAL_KEY = 'l2mini_chat_global_history';
const SEEN_CAP = 500;

type IngestSource = 'local' | 'history' | 'realtime' | 'broadcast' | 'send';

function chatT(key: string): string {
    return typeof window.t === 'function' ? window.t(key) : key;
}

function resolveRowBody(row: GlobalChatRow): string {
    if (!row) return '';
    const key = row.i18n_key;
    if (key && typeof window.t === 'function') {
        try {
            const params = (row.i18n_params && typeof row.i18n_params === 'object') ? row.i18n_params : {};
            const text = window.t(String(key), params as Record<string, string | number>);
            if (text && text !== key) return text;
        } catch { /* noop */ }
    }
    return row.body != null ? String(row.body) : '';
}

function rowToEntry(row: GlobalChatRow, bodyOverride?: string): ChatHistoryEntry | null {
    const body = bodyOverride || resolveRowBody(row) || (row.body != null ? String(row.body) : '');
    if (!body) return null;
    const ts = row.created_at ? new Date(row.created_at).getTime() : Date.now();
    return {
        autor: row.char_name || 'SYSTEM',
        mensagem: body,
        tipo: row.tier || (row.msg_kind === 'system' ? 'GM_ANNOUNCEMENT' : 'Paper'),
        timestamp: ts,
        ascensionTitle: row.ascension_title || '',
        cloudId: row.id,
    };
}

export const GlobalChatEngine = {
    started: false,
    seenKeys: new Set<string>(),
    _warnedDeploy: false,
    _pollTimer: null as ReturnType<typeof setInterval> | null,
    _refreshing: false,
    _starting: false,

    sleep(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    },

    async waitForCloudSession(maxMs = 12000): Promise<boolean> {
        const deadline = Date.now() + maxMs;
        while (Date.now() < deadline) {
            if (this.isCloudSession()) return true;
            await this.sleep(400);
        }
        return this.isCloudSession();
    },

    isCloudSession(): boolean {
        return !!(window.SUPABASE_CONFIG?.enabled
            && window.SupabaseAPI
            && typeof window.SupabaseAPI.getUser === 'function'
            && window.SupabaseAPI.getUser());
    },

    fingerprint(autor: string, body: string, ts: number): string {
        return `fp:${String(autor || '').trim().toLowerCase()}|${body}|${Math.floor(ts / 3000)}`;
    },

    keysForEntry(entry: ChatHistoryEntry): string[] {
        const keys = [this.fingerprint(entry.autor, entry.mensagem, entry.timestamp)];
        if (entry.cloudId != null) keys.unshift(`id:${entry.cloudId}`);
        return keys;
    },

    hasSeen(entry: ChatHistoryEntry): boolean {
        return this.keysForEntry(entry).some((k) => this.seenKeys.has(k));
    },

    markSeen(entry: ChatHistoryEntry): void {
        for (const k of this.keysForEntry(entry)) {
            this.seenKeys.add(k);
        }
        if (this.seenKeys.size > SEEN_CAP) {
            this.seenKeys = new Set(Array.from(this.seenKeys).slice(-Math.floor(SEEN_CAP / 2)));
        }
    },

    loadLocalCache(): ChatHistoryEntry[] {
        try {
            const raw = localStorage.getItem(LOCAL_KEY);
            if (!raw) return [];
            const since = Date.now() - HISTORY_DAYS * 24 * 60 * 60 * 1000;
            return (JSON.parse(raw) as ChatHistoryEntry[])
                .filter((m) => m && m.timestamp > since)
                .sort((a, b) => a.timestamp - b.timestamp);
        } catch {
            return [];
        }
    },

    saveLocalCache(entries: ChatHistoryEntry[]): void {
        if (!entries.length) return;
        const since = Date.now() - HISTORY_DAYS * 24 * 60 * 60 * 1000;
        const sorted = entries
            .filter((m) => m && m.timestamp > since)
            .sort((a, b) => a.timestamp - b.timestamp)
            .slice(-HISTORY_MAX);
        try {
            localStorage.setItem(LOCAL_KEY, JSON.stringify(sorted));
        } catch (e) {
            console.warn('[GlobalChat] local cache write:', e);
        }
    },

    upsertLocalCache(entry: ChatHistoryEntry): void {
        let history = this.loadLocalCache();
        if (entry.cloudId != null) {
            history = history.filter((m) => String(m.cloudId || '') !== String(entry.cloudId));
        }
        const dup = history.some((m) =>
            m.autor === entry.autor
            && m.mensagem === entry.mensagem
            && Math.abs(m.timestamp - entry.timestamp) < 5000,
        );
        if (!dup) history.push(entry);
        this.saveLocalCache(history);
    },

    mergeLocalAndCloud(local: ChatHistoryEntry[], cloud: GlobalChatRow[]): ChatHistoryEntry[] {
        const merged: ChatHistoryEntry[] = [];
        const cloudIds = new Set<string>();

        for (const row of cloud) {
            const entry = rowToEntry(row);
            if (!entry) continue;
            if (entry.cloudId != null) cloudIds.add(String(entry.cloudId));
            merged.push(entry);
        }

        for (const localEntry of local) {
            if (localEntry.cloudId != null && cloudIds.has(String(localEntry.cloudId))) continue;
            const dup = merged.some((m) =>
                m.autor === localEntry.autor
                && m.mensagem === localEntry.mensagem
                && Math.abs(m.timestamp - localEntry.timestamp) < 5000,
            );
            if (!dup) merged.push(localEntry);
        }

        return merged.sort((a, b) => a.timestamp - b.timestamp);
    },

    renderEntries(entries: ChatHistoryEntry[]): void {
        const el = document.getElementById('chat-global');
        if (!el || typeof window.adicionarMensagemChat !== 'function') return;
        if (!entries.length) return;

        el.innerHTML = '';
        this.seenKeys.clear();

        for (const entry of entries) {
            this.markSeen(entry);
            window.adicionarMensagemChat(
                entry.autor,
                entry.mensagem,
                entry.tipo,
                'global',
                true,
                entry.timestamp,
                entry.ascensionTitle || '',
                true,
            );
        }
        window.refreshLogCollapsedPreview?.();
        if (typeof window.scrollChatPanelToBottom === 'function') {
            window.scrollChatPanelToBottom(el, true);
        }
    },

    /** Pinta o cache local sem esperar sessão nuvem (histórico global, não por personagem). */
    paintLocalCacheIfNeeded(force = false): void {
        const el = document.getElementById('chat-global');
        if (!el) return;
        if (!force && el.childElementCount > 0 && this.started) return;
        const cached = this.loadLocalCache();
        if (cached.length) this.renderEntries(cached);
    },

    ingest(row: GlobalChatRow, _source?: IngestSource): boolean {
        const entry = rowToEntry(row);
        if (!entry || this.hasSeen(entry)) return false;

        this.markSeen(entry);
        if (typeof window.adicionarMensagemChat === 'function') {
            window.adicionarMensagemChat(
                entry.autor,
                entry.mensagem,
                entry.tipo,
                'global',
                true,
                entry.timestamp,
                entry.ascensionTitle || '',
                _source === 'history',
            );
            window.refreshLogCollapsedPreview?.();
        }
        this.upsertLocalCache(entry);
        return true;
    },

    ingestBroadcast(payload: {
        autor: string;
        mensagem: string;
        tipo?: string;
        ascensionTitle?: string;
        cloudMsgId?: string;
        createdAt?: string;
    }): boolean {
        const body = String(payload.mensagem || '').trim();
        if (!body) return false;
        const ts = payload.createdAt ? new Date(payload.createdAt).getTime() : Date.now();
        return this.ingest({
            id: payload.cloudMsgId || `bc-${payload.autor}-${ts}`,
            char_name: payload.autor,
            body,
            tier: payload.tipo || 'Paper',
            ascension_title: payload.ascensionTitle || '',
            created_at: new Date(ts).toISOString(),
        }, 'broadcast');
    },

    upgradeMessageId(tempId: string, cloudId: string): void {
        this.seenKeys.delete(`id:${tempId}`);
        this.seenKeys.add(`id:${cloudId}`);

        const history = this.loadLocalCache();
        let changed = false;
        for (const entry of history) {
            if (String(entry.cloudId || '') === tempId) {
                entry.cloudId = cloudId;
                changed = true;
            }
        }
        if (changed) this.saveLocalCache(history);
    },

    async ensureTransport(charName: string): Promise<void> {
        if (!window.SupabaseAPI) return;

        const api = window.SupabaseAPI;
        const presenceOk = !!(api.presenceChannel
            && api._presenceSubscribed
            && api.presenceChannel.state === 'joined');

        if (!presenceOk) {
            await api.ensureChatConnected?.(charName, {});
        }

        api._globalChatOnInsert = (row) => {
            this.ingest(row as GlobalChatRow, 'realtime');
        };
        if (!api._globalChatSubscribed) {
            api.subscribeGlobalChat?.((row) => {
                this.ingest(row as GlobalChatRow, 'realtime');
            });
        }
    },

    async fetchCloudHistory(): Promise<GlobalChatRow[]> {
        if (!window.SupabaseAPI) return [];
        if (!window.SupabaseAPI.client) await window.SupabaseAPI.init?.();
        await this.waitForCloudSession(8000);

        const rpcRows = await window.SupabaseAPI.fetchGlobalChatHistoryRpc?.(HISTORY_MAX, HISTORY_DAYS);
        if (rpcRows && rpcRows.length > 0) return rpcRows;
        const selectRows = await window.SupabaseAPI.fetchGlobalChatHistory?.(HISTORY_MAX, HISTORY_DAYS) || [];
        return selectRows;
    },

    async fetchCloudHistoryWithRetry(attempts = 3): Promise<GlobalChatRow[]> {
        let last: GlobalChatRow[] = [];
        for (let i = 0; i < attempts; i++) {
            last = await this.fetchCloudHistory();
            if (last.length > 0) return last;
            if (i < attempts - 1) await this.sleep(1200 * (i + 1));
        }
        return last;
    },

    async refresh(soft = false): Promise<void> {
        if (!this.isCloudSession() || this._refreshing) return;
        this._refreshing = true;
        try {
            let cloud: GlobalChatRow[] = [];
            try {
                cloud = await this.fetchCloudHistory();
            } catch (e) {
                console.warn('[GlobalChat] cloud history:', e);
            }

            const local = this.loadLocalCache();
            const merged = this.mergeLocalAndCloud(local, cloud);
            if (merged.length) {
                this.saveLocalCache(merged);
                if (soft && this.started) {
                    for (const entry of merged) {
                        if (this.hasSeen(entry)) continue;
                        if (entry.cloudId != null) {
                            this.ingest({
                                id: entry.cloudId,
                                char_name: entry.autor,
                                body: entry.mensagem,
                                tier: entry.tipo,
                                ascension_title: entry.ascensionTitle,
                                created_at: new Date(entry.timestamp).toISOString(),
                            }, 'history');
                        } else {
                            this.markSeen(entry);
                            window.adicionarMensagemChat?.(
                                entry.autor,
                                entry.mensagem,
                                entry.tipo,
                                'global',
                                true,
                                entry.timestamp,
                                entry.ascensionTitle || '',
                                true,
                            );
                        }
                    }
                    window.refreshLogCollapsedPreview?.();
                } else if (!soft || merged.length > local.length) {
                    this.renderEntries(merged);
                }
            }
        } finally {
            this._refreshing = false;
        }
    },

    startPolling(): void {
        this.stopPolling();
        this._pollTimer = setInterval(() => {
            void this.refresh(true);
        }, 15000);
    },

    stopPolling(): void {
        if (this._pollTimer) {
            clearInterval(this._pollTimer);
            this._pollTimer = null;
        }
    },

    async start(force = false): Promise<void> {
        if (this._starting) return;

        this.paintLocalCacheIfNeeded(force);

        if (this.started && !force) {
            await this.refresh(true);
            return;
        }

        this._starting = true;
        try {
            const hasSession = await this.waitForCloudSession(15000);
            if (!hasSession) {
                this.started = this.loadLocalCache().length > 0;
                return;
            }

            const charName = String(window.charName || '').trim();
            if (charName) {
                await this.trySyncCharacterOnce();
                await this.ensureTransport(charName);
            } else {
                await window.SupabaseAPI?.ensureGlobalChatReady?.();
            }

            const cloud = await this.fetchCloudHistoryWithRetry(3);
            const merged = this.mergeLocalAndCloud(this.loadLocalCache(), cloud);
            if (merged.length) {
                this.saveLocalCache(merged);
                this.renderEntries(merged);
            }

            this.started = true;
            this.startPolling();
        } finally {
            this._starting = false;
        }
    },

    async reconnect(): Promise<void> {
        if (!this.isCloudSession() || !this.started) return;
        const charName = String(window.charName || '').trim();
        if (!charName) return;
        await this.ensureTransport(charName);
        await this.refresh(true);
    },

    reset(): void {
        this.started = false;
        this.seenKeys.clear();
        this._warnedDeploy = false;
        this.stopPolling();
        window.SupabaseAPI?.unsubscribeGlobalChat?.();
        if (window.SupabaseAPI) {
            window.SupabaseAPI._globalChatOnInsert = null;
            window.SupabaseAPI._globalChatPgReady = false;
        }
    },

    rpcErrorMessage(code?: string): string {
        if (typeof window.cloudRpcMessage === 'function' && code) {
            const mapped = window.cloudRpcMessage(code, { prefix: 'game.cloud', keyStyle: 'dot' });
            if (mapped && !mapped.startsWith('game.cloud')) return mapped;
        }
        if (code === 'character_not_found') return chatT('game.cloud.error_character_not_found');
        return chatT('game.cloud.chatSendFailed');
    },

    async trySyncCharacterOnce(): Promise<void> {
        if (typeof window.salvarJogo !== 'function') return;
        try {
            await window.salvarJogo({ silent: true });
        } catch (e) {
            console.warn('[GlobalChat] salvarJogo before retry:', e);
        }
    },

    async send(charName: string, body: string, tier: string, ascTitle: string): Promise<void> {
        if (!window.SupabaseAPI) return;

        const msg = String(body || '').trim();
        if (!msg) return;

        const ts = Date.now();
        const tempId = `local-${ts}-${Math.random().toString(36).slice(2, 9)}`;

        await this.ensureTransport(charName);

        // 1) UI + cache local imediatos
        this.ingest({
            id: tempId,
            char_name: charName,
            body: msg,
            tier,
            ascension_title: ascTitle,
            created_at: new Date(ts).toISOString(),
        }, 'send');

        // 2) Fanout live (outras contas online no mesmo canal de presença)
        try {
            await window.SupabaseAPI.broadcastChat?.(
                charName, msg, tier, 'global', ascTitle,
                { cloudMsgId: tempId, createdAt: new Date(ts).toISOString() },
            );
        } catch (e) {
            console.warn('[GlobalChat] broadcast:', e);
        }

        // 3) Persistência na nuvem (histórico + realtime postgres)
        const attemptInsert = async (): Promise<ReturnType<NonNullable<typeof window.SupabaseAPI.parseGlobalChatRpcResult>>> => {
            const r = await window.SupabaseAPI.insertGlobalChatMessage!(charName, msg, tier, ascTitle);
            return window.SupabaseAPI.parseGlobalChatRpcResult?.(r) || { ok: !r.error };
        };

        let parsed = await attemptInsert();

        if (!parsed.ok && parsed.errorCode === 'character_not_found') {
            await this.trySyncCharacterOnce();
            parsed = await attemptInsert();
        }

        if (parsed.ok) {
            if (window.SupabaseAPI) window.SupabaseAPI._globalChatPgReady = true;
            if (parsed.id) {
                this.upgradeMessageId(tempId, parsed.id);
                try {
                    await window.SupabaseAPI.broadcastChat?.(
                        charName, msg, tier, 'global', ascTitle,
                        { cloudMsgId: parsed.id, createdAt: new Date(ts).toISOString() },
                    );
                } catch { /* noop */ }
            }
            return;
        }

        if (parsed.transportError) {
            if (window.SupabaseAPI) window.SupabaseAPI._globalChatPgReady = false;
            if (!this._warnedDeploy && typeof window.mostrarAviso === 'function') {
                this._warnedDeploy = true;
                window.mostrarAviso(chatT('game.cloud.chatHistoryPendingDeploy'));
            }
            return;
        }

        if (typeof window.mostrarAviso === 'function') {
            window.mostrarAviso(this.rpcErrorMessage(parsed.errorCode));
        }
    },
};

window.GlobalChatEngine = GlobalChatEngine;

export {};
