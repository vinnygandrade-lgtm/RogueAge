/**
 * Quick Menu da barra inferior (#janela-nav-menu) — destinos secundários:
 * Community Hub, Marketplace, Clan Hall, Mailbox, Missões, Settings.
 * Usa a pilha de modais partilhada (abrirModal/fecharModal — §5 do GDD).
 */

const NAV_MENU_ID = 'janela-nav-menu';

function abrirNavMenu(): void {
    if (typeof window.abrirModal !== 'function') return;
    window.abrirModal(NAV_MENU_ID);
}

function fecharNavMenu(): void {
    window.fecharModal?.(NAV_MENU_ID);
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
    }, 220);
}

function navMenuGo(dest: string): void {
    fecharNavMenu();
    switch (dest) {
        case 'social':
            window.irPara('social');
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
        case 'missions':
            if (typeof window.abrirMissoesDiarias === 'function') window.abrirMissoesDiarias();
            break;
        case 'settings':
            if (typeof window.abrirGameSettings === 'function') window.abrirGameSettings();
            break;
    }
}

window.abrirNavMenu = abrirNavMenu;
window.fecharNavMenu = fecharNavMenu;
window.navMenuGo = navMenuGo;

export {};
