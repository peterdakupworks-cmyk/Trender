// Shared Nigeria state -> city list.
// Used by: creator registration, campaign location targeting, and campaign feed matching.
// Keeping this in one place means the artist's "target city" options and the
// creator's "my city" options can never drift apart.

export const NIGERIA_STATES_CITIES: Record<string, string[]> = {
  FCT: ["Abuja"],
  Lagos: ["Lagos", "Ikeja", "Lekki"],
  Rivers: ["Port Harcourt"],
  Plateau: ["Jos"],
  Kano: ["Kano"],
  Oyo: ["Ibadan"],
  Edo: ["Benin City"],
  Enugu: ["Enugu"],
};

export const NIGERIA_STATES = Object.keys(NIGERIA_STATES_CITIES);

export function citiesForState(state: string): string[] {
  return NIGERIA_STATES_CITIES[state] ?? [];
}
