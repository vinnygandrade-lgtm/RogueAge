/**
 * Sincronização periódica local → nuvem e fetch de ranking global.
 * Migrado: js/systems/cloud_sync.js — Fase 4: tipos explícitos.
 */
import type { CharacterSave, CloudRankingPlayer } from '../types/game';
import { registerGlobalFn } from '../runtime/register-global';

const CLOUD_CONFIG = {
  provider: 'supabase',
  apiUrl: 'https://kgjcbujkzsrgcjcowxts.supabase.co',
  apiKey:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtnamNidWprenNyZ2NqY293eHRzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzczNzk0NzcsImV4cCI6MjA5Mjk1NTQ3N30.s1C3ubMA_ZRrkCmtk1nLC4VjDImk707X1wSTsA9CL9A',
  syncEnabled: true,
  syncInterval: 30_000,
} as const;

function isCloudSaveEnabled(): boolean {
  return (
    CLOUD_CONFIG.syncEnabled &&
    typeof window.SupabaseAPI !== 'undefined' &&
    window.SUPABASE_CONFIG.enabled &&
    window.SupabaseAPI.client != null
  );
}

/** Envia o save local do personagem activo para o Supabase. */
export async function sincronizarSaveComNuvem(force = false): Promise<void> {
  const charName = window.charName;
  if (!CLOUD_CONFIG.syncEnabled || !charName) return;

  const saveData = localStorage.getItem(`l2mini_save_${charName.toLowerCase()}`);
  if (!saveData) return;

  try {
    console.log('☁️ Sincronizando save com a nuvem...');
    if (isCloudSaveEnabled()) {
      const parsed = JSON.parse(saveData) as CharacterSave;
      const saveRes = await window.SupabaseAPI.savePlayer(charName, parsed, { force }) as
        | { success?: boolean }
        | undefined;
      // After a successful character save, refresh combat-stat ladder snapshot (throttled).
      if (saveRes && saveRes.success && typeof window.pushCombatStatSnapshot === 'function') {
        void window.pushCombatStatSnapshot({ force: !!force });
      }
    }
  } catch (error) {
    console.error('Erro na sincronização cloud:', error);
  }
}

/** Ranking global real (nuvem); `null` → caller usa bots locais. */
export async function buscarRankingGlobalReal(): Promise<CloudRankingPlayer[] | null> {
  if (
    !CLOUD_CONFIG.syncEnabled ||
    typeof window.SUPABASE_CONFIG === 'undefined' ||
    !window.SUPABASE_CONFIG.enabled
  ) {
    return null;
  }

  try {
    console.log('🏆 Buscando ranking global da nuvem...');
    if (typeof window.SupabaseAPI === 'undefined') return null;

    const players = await window.SupabaseAPI.getGlobalRanking();
    if (players && players.length > 0) {
      return players as CloudRankingPlayer[];
    }
    return null;
  } catch (error) {
    console.error('Erro ao buscar ranking:', error);
    return null;
  }
}

export function dispararSincronizacaoCloud(force = false): void {
  void sincronizarSaveComNuvem(force);
}

window.dispararSincronizacaoCloud = dispararSincronizacaoCloud;
registerGlobalFn('buscarRankingGlobalReal', buscarRankingGlobalReal);

if (CLOUD_CONFIG.syncEnabled) {
  setInterval(() => {
    void sincronizarSaveComNuvem();
  }, CLOUD_CONFIG.syncInterval);
}

console.log('☁️ Cloud Sync Engine carregado (Aguardando configuração).');

export {};
