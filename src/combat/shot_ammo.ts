/**
 * Forest / hunt soulshot & blessed spiritshot ammo by equipped weapon grade.
 * Grade gates ammo only — damage bonus stays +20% for every band.
 */

export type ShotBand = 'NG' | 'D' | 'C' | 'B' | 'A' | 'S';

const BANDS: ShotBand[] = ['NG', 'D', 'C', 'B', 'A', 'S'];

export function weaponGradeToShotBand(grade: unknown): ShotBand {
  const key = String(grade == null ? '' : grade)
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '-');
  if (key === 'D') return 'D';
  if (key === 'C') return 'C';
  if (key === 'B') return 'B';
  if (key === 'A') return 'A';
  if (key === 'S') return 'S';
  // No-Grade / NG / empty / unknown → NG
  return 'NG';
}

export function shotBandFromItemName(nome: string | null | undefined): ShotBand {
  if (!nome) return 'NG';
  const match = String(nome).match(/\(([^)]+)\)/);
  return weaponGradeToShotBand(match ? match[1] : 'NG');
}

export function resolveActiveShotKey(isMage: boolean, weaponGrade?: unknown): string {
  let grade = weaponGrade;
  if (grade == null) {
    const arma = window.armaEquipadaBase;
    grade = arma?.base?.grade ?? 'No-Grade';
  }
  const band = weaponGradeToShotBand(grade);
  return isMage ? `B. Spiritshot (${band})` : `Soulshot (${band})`;
}

export function shotIconPathForKey(nome: string | null | undefined): string {
  if (!nome) return 'assets/itens/soulshot_ng.png';
  const band = shotBandFromItemName(nome).toLowerCase() as Lowercase<ShotBand>;
  if (String(nome).includes('Spiritshot')) {
    return `assets/itens/spiritshot_${band}.png`;
  }
  return `assets/itens/soulshot_${band}.png`;
}

export function isShotConsumableName(nome: string | null | undefined): boolean {
  if (!nome) return false;
  return String(nome).includes('Soulshot') || String(nome).includes('Spiritshot');
}

export function allShotInventoryKeys(): string[] {
  const out: string[] = [];
  for (const band of BANDS) {
    out.push(`Soulshot (${band})`);
    out.push(`B. Spiritshot (${band})`);
  }
  return out;
}

window.resolveActiveShotKey = resolveActiveShotKey;
window.weaponGradeToShotBand = weaponGradeToShotBand;
window.shotIconPathForKey = shotIconPathForKey;
window.isShotConsumableName = isShotConsumableName;

export {};
