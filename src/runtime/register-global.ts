/**
 * Ponte temporária Fase 4: expõe APIs TS no `window` e em `globalThis`
 * para código legado que ainda usa identificadores globais bare (`RankingManager`, …).
 */
export function registerGlobal(key: string, value: unknown): void {
  (window as unknown as Record<string, unknown>)[key] = value;
  (globalThis as Record<string, unknown>)[key] = value;
}

export function registerGlobalFn<T extends (...args: never[]) => unknown>(
  name: string,
  fn: T,
): void {
  (globalThis as Record<string, unknown>)[name] = fn;
  (window as unknown as Record<string, unknown>)[name] = fn;
}
