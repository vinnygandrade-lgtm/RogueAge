/**
 * Character creation unlocks — expand when new paperdoll presets ship.
 * Only unlocked race/gender/class combos can finish creation.
 */

export type CreationUnlockCombo = {
  race: string;
  gender: string;
  charClass: string;
};

/** Currently playable creations (full paperdoll art). */
export const CREATION_UNLOCKED_COMBOS: readonly CreationUnlockCombo[] = [
  { race: 'Human', gender: 'Male', charClass: 'Fighter' },
];

export function isCreationRaceUnlocked(race: string): boolean {
  return CREATION_UNLOCKED_COMBOS.some((u) => u.race === race);
}

export function isCreationGenderUnlocked(race: string, gender: string): boolean {
  return CREATION_UNLOCKED_COMBOS.some((u) => u.race === race && u.gender === gender);
}

export function isCreationClassUnlocked(race: string, gender: string, charClass: string): boolean {
  return CREATION_UNLOCKED_COMBOS.some(
    (u) => u.race === race && u.gender === gender && u.charClass === charClass,
  );
}

export function isCreationComboUnlocked(race: string, gender: string, charClass: string): boolean {
  return isCreationClassUnlocked(race, gender, charClass);
}

window.isCreationRaceUnlocked = isCreationRaceUnlocked;
window.isCreationGenderUnlocked = isCreationGenderUnlocked;
window.isCreationClassUnlocked = isCreationClassUnlocked;
window.isCreationComboUnlocked = isCreationComboUnlocked;
