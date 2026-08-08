/**
 * Draggable messenger FAB position (Messenger-style).
 * Persists normalized coords in localStorage; panel opens near the FAB.
 */

const FAB_POS_KEY = 'l2mini_floating_chat_fab_pos';
const DRAG_THRESHOLD_PX = 8;
const EDGE_PAD = 8;

type FabNormPos = { x: number; y: number };

let fabNormPos: FabNormPos | null = null;
let dragBound = false;
let suppressNextClick = false;

function getRoot(): HTMLElement | null {
    return document.getElementById('floating-chat-root');
}

function getFab(): HTMLElement | null {
    return document.getElementById('floating-chat-fab');
}

function getPanel(): HTMLElement | null {
    return document.getElementById('floating-chat-panel');
}

function clamp(n: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, n));
}

function loadSavedPos(): FabNormPos | null {
    try {
        const raw = localStorage.getItem(FAB_POS_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw) as Partial<FabNormPos>;
        if (typeof parsed.x !== 'number' || typeof parsed.y !== 'number') return null;
        if (!Number.isFinite(parsed.x) || !Number.isFinite(parsed.y)) return null;
        return {
            x: clamp(parsed.x, 0, 1),
            y: clamp(parsed.y, 0, 1),
        };
    } catch {
        return null;
    }
}

function savePos(pos: FabNormPos): void {
    fabNormPos = pos;
    try {
        localStorage.setItem(FAB_POS_KEY, JSON.stringify(pos));
    } catch {
        /* ignore */
    }
}

function rootMetrics(root: HTMLElement): { w: number; h: number } {
    const r = root.getBoundingClientRect();
    return { w: Math.max(1, r.width), h: Math.max(1, r.height) };
}

/** Apply left/top from normalized position (fab top-left as fraction of free area). */
function applyFabPixelPos(fab: HTMLElement, root: HTMLElement, left: number, top: number): void {
    const { w, h } = rootMetrics(root);
    const fw = fab.offsetWidth || 88;
    const fh = fab.offsetHeight || 44;
    const maxL = Math.max(EDGE_PAD, w - fw - EDGE_PAD);
    const maxT = Math.max(EDGE_PAD, h - fh - EDGE_PAD);
    const clampedL = clamp(left, EDGE_PAD, maxL);
    const clampedT = clamp(top, EDGE_PAD, maxT);

    fab.classList.add('floating-chat-fab--placed');
    fab.style.left = `${Math.round(clampedL)}px`;
    fab.style.top = `${Math.round(clampedT)}px`;
    fab.style.right = 'auto';
    fab.style.bottom = 'auto';

    const freeW = Math.max(1, w - fw - EDGE_PAD * 2);
    const freeH = Math.max(1, h - fh - EDGE_PAD * 2);
    savePos({
        x: clamp((clampedL - EDGE_PAD) / freeW, 0, 1),
        y: clamp((clampedT - EDGE_PAD) / freeH, 0, 1),
    });
}

function applyFabFromNorm(fab: HTMLElement, root: HTMLElement, pos: FabNormPos): void {
    const { w, h } = rootMetrics(root);
    const fw = fab.offsetWidth || 88;
    const fh = fab.offsetHeight || 44;
    const freeW = Math.max(1, w - fw - EDGE_PAD * 2);
    const freeH = Math.max(1, h - fh - EDGE_PAD * 2);
    const left = EDGE_PAD + pos.x * freeW;
    const top = EDGE_PAD + pos.y * freeH;
    applyFabPixelPos(fab, root, left, top);
}

/** Place chat panel near the FAB (or last saved spot), clamped to the shell. */
export function layoutFloatingChatPanelNearFab(): void {
    const root = getRoot();
    const panel = getPanel();
    const fab = getFab();
    if (!root || !panel) return;

    const { w, h } = rootMetrics(root);
    const pw = Math.min(panel.offsetWidth || 320, w - EDGE_PAD * 2);
    const ph = Math.min(panel.offsetHeight || 260, h - EDGE_PAD * 2);

    let anchorL = EDGE_PAD;
    let anchorT = h - (56 + EDGE_PAD);
    let anchorW = 88;
    let anchorH = 44;

    if (fab && fab.classList.contains('floating-chat-fab--placed') && fab.style.left) {
        anchorL = parseFloat(fab.style.left) || EDGE_PAD;
        anchorT = parseFloat(fab.style.top) || EDGE_PAD;
        anchorW = fab.offsetWidth || 88;
        anchorH = fab.offsetHeight || 44;
    } else if (fabNormPos) {
        const freeW = Math.max(1, w - 88 - EDGE_PAD * 2);
        const freeH = Math.max(1, h - 44 - EDGE_PAD * 2);
        anchorL = EDGE_PAD + fabNormPos.x * freeW;
        anchorT = EDGE_PAD + fabNormPos.y * freeH;
    } else if (fab) {
        const rootRect = root.getBoundingClientRect();
        const fabRect = fab.getBoundingClientRect();
        anchorL = fabRect.left - rootRect.left;
        anchorT = fabRect.top - rootRect.top;
        anchorW = fabRect.width;
        anchorH = fabRect.height;
    }

    // Prefer above the FAB; else below. Align to FAB's horizontal side.
    let left = anchorL;
    let top = anchorT - ph - 8;
    if (top < EDGE_PAD) {
        top = anchorT + anchorH + 8;
    }
    if (left + pw > w - EDGE_PAD) {
        left = w - EDGE_PAD - pw;
    }
    if (left < EDGE_PAD) left = EDGE_PAD;
    if (top + ph > h - EDGE_PAD) {
        top = Math.max(EDGE_PAD, h - EDGE_PAD - ph);
    }
    if (top < EDGE_PAD) top = EDGE_PAD;

    // If FAB is on the right half, prefer right-align panel to FAB.
    if (anchorL + anchorW / 2 > w / 2) {
        left = clamp(anchorL + anchorW - pw, EDGE_PAD, w - EDGE_PAD - pw);
    }

    panel.classList.add('floating-chat__panel--placed');
    panel.style.left = `${Math.round(left)}px`;
    panel.style.top = `${Math.round(top)}px`;
    panel.style.right = 'auto';
    panel.style.bottom = 'auto';
    panel.style.width = `${Math.round(Math.min(pw, w - EDGE_PAD * 2))}px`;
    panel.style.maxWidth = `${Math.round(w - EDGE_PAD * 2)}px`;
}

export function clearFloatingChatPanelPlacement(): void {
    const panel = getPanel();
    if (!panel) return;
    panel.classList.remove('floating-chat__panel--placed');
    panel.style.left = '';
    panel.style.top = '';
    panel.style.right = '';
    panel.style.bottom = '';
    panel.style.width = '';
    panel.style.maxWidth = '';
}

/** Re-apply saved FAB position (resize / layout change). */
export function refreshFloatingChatFabPosition(): void {
    const root = getRoot();
    const fab = getFab();
    if (!root || !fab) return;
    if (!fabNormPos) fabNormPos = loadSavedPos();
    if (!fabNormPos) return;
    // Need layout — wait a frame if fab not measured yet
    if (!fab.offsetWidth) {
        requestAnimationFrame(() => refreshFloatingChatFabPosition());
        return;
    }
    applyFabFromNorm(fab, root, fabNormPos);
    if (root.classList.contains('floating-chat--open')) {
        layoutFloatingChatPanelNearFab();
    }
}

function onPointerDown(ev: PointerEvent): void {
    const fab = getFab();
    const root = getRoot();
    if (!fab || !root || ev.button !== 0) return;

    const startX = ev.clientX;
    const startY = ev.clientY;
    const rootRect = root.getBoundingClientRect();
    const fabRect = fab.getBoundingClientRect();
    let originL = fabRect.left - rootRect.left;
    let originT = fabRect.top - rootRect.top;
    let dragging = false;
    let pointerId = ev.pointerId;

    const onMove = (e: PointerEvent) => {
        if (e.pointerId !== pointerId) return;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        if (!dragging) {
            if (Math.hypot(dx, dy) < DRAG_THRESHOLD_PX) return;
            dragging = true;
            fab.classList.add('floating-chat-fab--dragging');
            try {
                fab.setPointerCapture(pointerId);
            } catch {
                /* ignore */
            }
        }
        e.preventDefault();
        applyFabPixelPos(fab, root, originL + (e.clientX - startX), originT + (e.clientY - startY));
    };

    const onUp = (e: PointerEvent) => {
        if (e.pointerId !== pointerId) return;
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
        window.removeEventListener('pointercancel', onUp);
        fab.classList.remove('floating-chat-fab--dragging');
        try {
            fab.releasePointerCapture(pointerId);
        } catch {
            /* ignore */
        }
        if (dragging) {
            suppressNextClick = true;
            // Touch/mouse may not always emit click after a drag — clear soon after.
            setTimeout(() => {
                suppressNextClick = false;
            }, 320);
        }
    };

    window.addEventListener('pointermove', onMove, { passive: false });
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
}

function onFabClick(ev: MouseEvent): void {
    if (suppressNextClick) {
        ev.preventDefault();
        ev.stopPropagation();
        suppressNextClick = false;
        return;
    }
    if (typeof window.toggleFloatingChat === 'function') {
        window.toggleFloatingChat();
    }
}

export function initFloatingChatFabPosition(): void {
    const fab = getFab();
    if (!fab || dragBound) {
        refreshFloatingChatFabPosition();
        return;
    }
    dragBound = true;
    fabNormPos = loadSavedPos();

    // Prefer JS handler over inline onclick (drag vs tap).
    fab.removeAttribute('onclick');
    fab.addEventListener('click', onFabClick);
    fab.addEventListener('pointerdown', onPointerDown);
    fab.style.touchAction = 'none';
    fab.setAttribute('data-i18n-title', 'chat.fabDragTitle');

    if (fabNormPos) {
        requestAnimationFrame(() => refreshFloatingChatFabPosition());
    }

    window.addEventListener('l2-layout-change', () => {
        requestAnimationFrame(() => refreshFloatingChatFabPosition());
    });
    window.addEventListener('resize', () => {
        requestAnimationFrame(() => refreshFloatingChatFabPosition());
    });
}
