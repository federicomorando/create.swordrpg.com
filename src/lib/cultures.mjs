/**
 * Popoli e Culture — Pure data definitions, zero Foundry deps.
 *
 * Each culture trait grants:
 *  - An extra die in one skill (chosen from skillChoices, or any skill for Meticcio)
 *  - Access to specific Valori axes (used to constrain the Valori creation step)
 *  - A unique advantage
 *
 * Source: IL_TEMPO_DELLA_SPADA_Errata.md pp.48-49, lines 922-1002.
 */

export const CULTURE_DEFS = {
  antica: {
    skillChoices: ["carisma", "volonta"],
    valori: ["fides", "superstitio"],
    advantage: "audacia_mod_bonus"  // +1 to Audacia modifier
  },
  cortese: {
    skillChoices: ["carisma", "ragionamento"],
    valori: ["fides", "honor"],
    advantage: "extra_die_pick",    // extra die in 1 of 3 skills
    advantagePickFrom: ["arti_liberali", "autorita", "empatia"]
  },
  erudita: {
    skillChoices: ["percezione", "ragionamento"],
    valori: ["ego", "ratio"],
    advantage: "study_bonus"        // +1 success on study/meditation/work checks
  },
  guerresca: {
    skillChoices: ["agilita", "forza"],
    valori: ["impietas", "honor"],
    advantage: "wound_fatigue_bonus" // +1 graffi/leggere, +1 fresco/stanco
  },
  intraprendente: {
    skillChoices: ["percezione", "volonta"],
    valori: ["ego", "ratio"],
    advantage: "retaggio_bonus"     // +1 retaggio point
  },
  laboriosa: {
    skillChoices: ["percezione", "ragionamento"],
    valori: ["honor", "ratio"],
    advantage: "double_wealth"      // starting wealth doubled
  },
  meticcio: {
    skillChoices: null,  // any skill
    valori: null,        // any valore
    advantage: "mixed_heritage"     // extra language + extra die in storia_e_leggende + usi_e_costumi
  },
  militare: {
    skillChoices: ["agilita", "volonta"],
    valori: ["impietas", "honor"],
    advantage: "quality_equipment"  // starting equipment Buona quality
  },
  rurale: {
    skillChoices: ["forza", "percezione"],
    valori: ["fides", "superstitio"],
    advantage: "survival_bonus"     // extra die in sopravvivenza + usi_e_costumi
  },
  spirituale: {
    skillChoices: ["carisma", "volonta"],
    valori: ["fides", "superstitio"],
    advantage: "spirito_bonus"      // +4 Spirito
  },
  tenace: {
    skillChoices: ["percezione", "volonta"],
    valori: ["honor", "superstitio"],
    advantage: "forza_extra_die"    // extra die in Forza
  },
  urbana: {
    skillChoices: ["carisma", "ragionamento"],
    valori: ["ego", "ratio"],
    advantage: "ceto_distance_minus1" // ceto skill distance -1 + contact bonus (partial deferred)
  }
};

/** All 6 valore keys */
const ALL_VALORI = new Set(["fides", "impietas", "honor", "ego", "superstitio", "ratio"]);

/** All culture IDs */
export const CULTURE_IDS = Object.keys(CULTURE_DEFS);

/**
 * Compute the set of allowed valore keys for a pair of culture traits.
 * If either trait is Meticcio (valori: null), all 6 axes are available.
 * Otherwise, return the union of both traits' valori arrays.
 *
 * @param {string} trait1 - Culture ID for first trait
 * @param {string} trait2 - Culture ID for second trait
 * @returns {Set<string>} Set of allowed valore keys
 */
export function getCultureAllowedValori(trait1, trait2) {
  const def1 = CULTURE_DEFS[trait1];
  const def2 = CULTURE_DEFS[trait2];

  // If either trait is missing or Meticcio, allow all
  if (!def1 || !def2 || def1.valori === null || def2.valori === null) {
    return new Set(ALL_VALORI);
  }

  const allowed = new Set();
  for (const v of def1.valori) allowed.add(v);
  for (const v of def2.valori) allowed.add(v);
  return allowed;
}
