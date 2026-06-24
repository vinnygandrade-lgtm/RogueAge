/** Carrega `<script src>` clássicos em ordem (scope global partilhado — onclick no HTML). */
export function loadLegacyScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const normalized = src.startsWith('/') ? src : `/${src}`;
    const existing = document.querySelector(`script[data-l2-legacy="${normalized}"]`);
    if (existing) {
      resolve();
      return;
    }

    const el = document.createElement('script');
    el.src = normalized;
    el.async = false;
    el.dataset.l2Legacy = normalized;
    el.onload = () => resolve();
    el.onerror = () => reject(new Error(`[L2Mini] Falha ao carregar script legado: ${normalized}`));
    document.body.appendChild(el);
  });
}

export async function loadLegacyScripts(paths: readonly string[]): Promise<void> {
  for (const path of paths) {
    await loadLegacyScript(path);
  }
}
