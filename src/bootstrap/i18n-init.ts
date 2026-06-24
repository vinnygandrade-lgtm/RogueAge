/** Equivalente ao bloco inline de I18n.init + botões EN/PT no index.html. */
export function initI18nAndLanguageBar(): void {
  if (window.I18n && typeof window.I18n.init === 'function') {
    window.I18n.init();
  }

  function bindLangUi() {
    const enBtn = document.getElementById('i18n-btn-en');
    const ptBtn = document.getElementById('i18n-btn-pt');
    if (enBtn) {
      enBtn.addEventListener('click', () => {
        window.I18n.setLocale('en');
      });
    }
    if (ptBtn) {
      ptBtn.addEventListener('click', () => {
        window.I18n.setLocale('pt-BR');
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bindLangUi);
  } else {
    bindLangUi();
  }
}
