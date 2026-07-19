/**

 * Quick Menu da barra inferior (#janela-nav-menu) — destinos secundários:

 * Community Hub, Marketplace, Clan Hall, Mailbox, Missões, Settings.

 * Usa a pilha de modais partilhada (abrirModal/fecharModal — §5 do GDD).

 */



const NAV_MENU_ID = 'janela-nav-menu';

const NAV_MENU_SWIPE_THRESHOLD_PX = 72;

const NAV_MENU_SWIPE_MAX_DRAG_PX = 220;

/** Ignore finger jitter until this — otherwise taps on the sheet cancel click. */
const NAV_MENU_SWIPE_ARM_PX = 14;



function navMenuIsOpen(): boolean {

    const el = document.getElementById(NAV_MENU_ID);

    return !!el && el.style.display === 'flex';

}



function navMenuFocusables(): HTMLElement[] {

    const sheet = document.getElementById(NAV_MENU_ID);

    if (!sheet) return [];

    return Array.from(

        sheet.querySelectorAll<HTMLElement>(

            'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',

        ),

    ).filter((el) => el.offsetParent !== null);

}



function modalIsOpen(id: string): boolean {

    const el = document.getElementById(id);

    return !!el && el.style.display === 'flex';

}



function panelIsVisible(id: string): boolean {

    const el = document.getElementById(id);

    if (!el) return false;

    const d = el.style.display;

    return d === 'flex' || d === 'block';

}



/** Marca o item do sheet conforme o destino/modal actualmente aberto. */

function syncNavMenuActiveItem(): void {

    document.querySelectorAll('.nav-menu-item').forEach((el) => {

        el.classList.remove('nav-menu-item--active');

    });



    if (modalIsOpen('janela-mailbox')) {

        document.getElementById('nav-menu-mailbox')?.classList.add('nav-menu-item--active');

        return;

    }

    if (modalIsOpen('janela-retention-hub')) {

        document.getElementById('nav-menu-retention')?.classList.add('nav-menu-item--active');

        return;

    }

    if (modalIsOpen('janela-missoes-diarias')) {

        document.getElementById('nav-menu-missions')?.classList.add('nav-menu-item--active');

        return;

    }

    if (modalIsOpen('janela-level-rewards')) {

        document.getElementById('nav-menu-achievements')?.classList.add('nav-menu-item--active');

        return;

    }

    if (modalIsOpen('janela-stat-ranking')) {

        document.getElementById('nav-menu-stat-ranking')?.classList.add('nav-menu-item--active');

        return;

    }

    if (modalIsOpen('janela-game-settings')) {

        document.getElementById('nav-menu-settings')?.classList.add('nav-menu-item--active');

        return;

    }

    if (panelIsVisible('tela-olympiad-arena')) {

        document.getElementById('nav-menu-olympiad')?.classList.add('nav-menu-item--active');

        return;

    }

    if (!socialScreenVisible()) return;



    if (panelIsVisible('menu-social-market')) {

        document.getElementById('nav-menu-market')?.classList.add('nav-menu-item--active');

        return;

    }

    if (panelIsVisible('menu-social-clans')) {

        document.getElementById('nav-menu-clans')?.classList.add('nav-menu-item--active');

        return;

    }

    if (panelIsVisible('praca-social')) {

        document.getElementById('nav-menu-social')?.classList.add('nav-menu-item--active');

    }

}



function resetNavMenuSheetTransform(sheet: HTMLElement): void {

    sheet.classList.remove('nav-menu-sheet--dragging', 'nav-menu-sheet--snap-back', 'nav-menu-sheet--dismissing');

    sheet.style.transform = 'translateX(-50%)';

    sheet.style.opacity = '';

}



function setNavMenuSheetDragOffset(sheet: HTMLElement, dy: number): void {

    const clamped = Math.max(0, Math.min(dy, NAV_MENU_SWIPE_MAX_DRAG_PX));

    sheet.style.transform = `translate(-50%, ${clamped}px)`;

    sheet.style.opacity = String(Math.max(0.35, 1 - clamped / (NAV_MENU_SWIPE_MAX_DRAG_PX * 1.35)));

}



/** Restaura o tab activo conforme a sub-tela visível (após fechar o sheet). */

function syncTravelTabFromVisibleScreen(): void {

    let lugar: string | null = null;

    document.querySelectorAll('.screen-content').forEach((sc) => {

        const el = sc as HTMLElement;

        if (el.style.display === 'flex' || el.style.display === 'block') {

            const id = el.id?.replace('tela-', '');

            if (id) lugar = id;

        }

    });

    if (!lugar) return;



    let tabId: string | null = null;

    if (lugar === 'social') tabId = 'btn-tab-menu';

    else if (lugar === 'floresta') tabId = 'btn-tab-world';

    else if (['perfil', 'cidade', 'world', 'inventario'].includes(lugar)) tabId = `btn-tab-${lugar}`;



    document.querySelectorAll('.btn-travel').forEach((btn) => btn.classList.remove('active'));

    if (tabId) document.getElementById(tabId)?.classList.add('active');

}



function setNavMenuTabActive(active: boolean): void {

    const menuTab = document.getElementById('btn-tab-menu');

    if (!menuTab) return;

    if (active) {

        document.querySelectorAll('.btn-travel').forEach((btn) => btn.classList.remove('active'));

        menuTab.classList.add('active');

    } else {

        menuTab.classList.remove('active');

        syncTravelTabFromVisibleScreen();

    }

}



function focusNavMenuSheet(): void {
    // On phones, programmatic focus can make the next tap feel "eaten"
    // (sticky focus / hover). Keyboard users still get Tab trap via keydown.
    try {
        if (window.matchMedia('(pointer: coarse)').matches) return;
    } catch {
        /* matchMedia unavailable — fall through */
    }

    const items = navMenuFocusables();

    const firstItem = items.find((el) => el.classList.contains('nav-menu-item'));

    (firstItem || items[0])?.focus();

}



function onNavMenuKeyDown(e: KeyboardEvent): void {

    if (!navMenuIsOpen()) return;



    if (e.key === 'Escape') {

        e.preventDefault();

        fecharNavMenu();

        return;

    }



    if (e.key !== 'Tab') return;



    const focusables = navMenuFocusables();

    if (focusables.length === 0) return;



    const first = focusables[0];

    const last = focusables[focusables.length - 1];



    if (e.shiftKey && document.activeElement === first) {

        e.preventDefault();

        last.focus();

    } else if (!e.shiftKey && document.activeElement === last) {

        e.preventDefault();

        first.focus();

    }

}



function bindNavMenuA11y(): void {

    document.addEventListener('keydown', onNavMenuKeyDown);

}



function abrirNavMenu(): void {

    if (typeof window.abrirModal !== 'function') return;

    if (navMenuIsOpen()) {

        fecharNavMenu();

        return;

    }

    window.refreshNavMenuNotifications?.();

    window.dismissNavMenuTownCoach?.();
    window.dismissNavCoachToast?.();

    const sheet = document.getElementById(NAV_MENU_ID);

    if (sheet) resetNavMenuSheetTransform(sheet);

    window.abrirModal(NAV_MENU_ID);

    setNavMenuTabActive(true);

    syncNavMenuActiveItem();

    requestAnimationFrame(() => focusNavMenuSheet());

}



function fecharNavMenu(): void {

    const sheet = document.getElementById(NAV_MENU_ID);

    if (sheet) resetNavMenuSheetTransform(sheet);

    window.fecharModal?.(NAV_MENU_ID);

    setNavMenuTabActive(false);

    document.getElementById('btn-tab-menu')?.focus();

}



function socialScreenVisible(): boolean {

    const tela = document.getElementById('tela-social');

    if (!tela) return false;

    const d = tela.style.display;

    return d === 'flex' || d === 'block';

}



/** Abre um submenu do Social após a transição do irPara (150ms). Se a navegação foi bloqueada (combate, expedição), não mexe no DOM escondido. */

function goSocialSubmenu(menuId: 'market' | 'clans'): void {

    window.irPara('social');

    setTimeout(() => {

        if (socialScreenVisible() && typeof window.abrirMenuSocial === 'function') {

            window.abrirMenuSocial(menuId);

        }

        syncNavMenuActiveItem();

    }, 220);

}



function navMenuGo(dest: string): void {

    fecharNavMenu();

    switch (dest) {

        case 'social':

            window.irPara('social');

            setTimeout(() => syncNavMenuActiveItem(), 200);

            break;

        case 'market':

            goSocialSubmenu('market');

            break;

        case 'clans':

            goSocialSubmenu('clans');

            break;

        case 'mailbox':

            if (typeof window.abrirJanelaCorreio === 'function') window.abrirJanelaCorreio();

            break;

        case 'retention':

            if (typeof window.abrirRetentionHub === 'function') window.abrirRetentionHub('newbie');

            break;

        case 'missions':

            if (typeof window.abrirMissoesDiarias === 'function') window.abrirMissoesDiarias();

            break;

        case 'achievements':

            if (typeof window.abrirLevelRewards === 'function') window.abrirLevelRewards();

            break;

        case 'settings':

            if (typeof window.abrirGameSettings === 'function') window.abrirGameSettings();

            break;

        case 'statRanking':

            if (typeof window.abrirStatRanking === 'function') window.abrirStatRanking();

            setTimeout(() => syncNavMenuActiveItem(), 280);

            break;

        case 'olympiad':

            if (typeof window.abrirOlympiad === 'function') window.abrirOlympiad();

            setTimeout(() => syncNavMenuActiveItem(), 280);

            break;

        case 'clanwar':

            window.irPara('world');

            setTimeout(() => {

                const card = document.getElementById('card-clan-war-world');

                if (card && card.style.display !== 'none' && window.ClanWarEngine?.abrirLobby) {

                    window.ClanWarEngine.abrirLobby();

                } else if (card) {

                    card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

                    card.classList.add('glow-yellow');

                    window.setTimeout(() => card.classList.remove('glow-yellow'), 1600);

                }

                syncNavMenuActiveItem();

            }, 240);

            break;

    }

}



function bindNavMenuSwipe(): void {

    const sheet = document.getElementById(NAV_MENU_ID);

    if (!sheet || sheet.dataset.swipeBound === '1') return;

    sheet.dataset.swipeBound = '1';



    let startY = 0;

    let tracking = false;

    let armed = false;

    let currentDy = 0;



    /** Dismiss-swipe only from chrome — never from buttons (steals mobile clicks). */
    const canStartSwipe = (target: EventTarget | null): boolean => {

        if (!(target instanceof Element)) return false;

        if (target.closest('button, a, input, select, textarea, [role="button"]')) return false;

        return !!target.closest('.nav-menu-sheet__handle, .nav-menu-sheet__title');

    };



    const finishDrag = (close: boolean): void => {

        tracking = false;

        armed = false;

        if (!sheet) return;



        if (close) {

            sheet.classList.add('nav-menu-sheet--dismissing');

            setNavMenuSheetDragOffset(sheet, NAV_MENU_SWIPE_MAX_DRAG_PX);

            window.setTimeout(() => {

                fecharNavMenu();

            }, 160);

            return;

        }



        sheet.classList.remove('nav-menu-sheet--dragging');

        sheet.classList.add('nav-menu-sheet--snap-back');

        resetNavMenuSheetTransform(sheet);

        window.setTimeout(() => {

            sheet.classList.remove('nav-menu-sheet--snap-back');

        }, 220);

    };



    const onTouchStart = (e: TouchEvent) => {

        if (!navMenuIsOpen() || !canStartSwipe(e.target)) return;

        startY = e.touches[0].clientY;

        currentDy = 0;

        tracking = true;

        armed = false;

        sheet.classList.remove('nav-menu-sheet--snap-back', 'nav-menu-sheet--dismissing');

    };



    const onTouchMove = (e: TouchEvent) => {

        if (!tracking) return;

        const dy = e.touches[0].clientY - startY;

        if (dy <= 0) {

            currentDy = 0;

            if (armed) setNavMenuSheetDragOffset(sheet, 0);

            return;

        }

        if (!armed) {

            if (dy < NAV_MENU_SWIPE_ARM_PX) return;

            armed = true;

            sheet.classList.add('nav-menu-sheet--dragging');

        }

        currentDy = dy;

        setNavMenuSheetDragOffset(sheet, dy);

    };



    const onTouchEnd = () => {

        if (!tracking) return;

        // Tiny movement = tap, not swipe — leave click alone
        if (!armed) {

            tracking = false;

            return;

        }

        finishDrag(currentDy >= NAV_MENU_SWIPE_THRESHOLD_PX);

    };



    sheet.addEventListener('touchstart', onTouchStart, { passive: true });

    sheet.addEventListener('touchmove', onTouchMove, { passive: true });

    sheet.addEventListener('touchend', onTouchEnd);

    sheet.addEventListener('touchcancel', () => {

        if (!tracking) return;

        if (!armed) {

            tracking = false;

            return;

        }

        finishDrag(false);

    });

}



function initNavMenuUi(): void {

    bindNavMenuSwipe();

    bindNavMenuA11y();

}



if (document.readyState === 'loading') {

    document.addEventListener('DOMContentLoaded', initNavMenuUi);

} else {

    initNavMenuUi();

}



window.abrirNavMenu = abrirNavMenu;

window.fecharNavMenu = fecharNavMenu;

window.navMenuGo = navMenuGo;

window.syncNavMenuActiveItem = syncNavMenuActiveItem;



export {};


