/**
 * Browser-safe SwORD actor constants extracted from the Foundry system.
 */

export const BASE_SKILLS = ["volonta", "agilita", "carisma", "forza", "ragionamento", "percezione"];

export const CETO_ORDER = ["umile", "popolano", "borghese", "nobile"];

export const CETO_COST = { umile: 0, popolano: 1, borghese: 2, nobile: 3 };

export const CETO_SKILLS = {
  common: ["agilita", "carisma", "forza", "percezione", "ragionamento", "volonta"],
  umile: ["armi_corte", "empatia", "furtivita", "guarigione", "professione", "raggirare", "sopravvivenza"],
  popolano: ["archi", "armi_comuni", "artigiano", "atletica", "lotta", "manualita", "usi_e_costumi"],
  borghese: ["alchimia", "arti_liberali", "balestre", "intrattenere", "mercatura", "professione", "storia_e_leggende"],
  nobile: ["armi_da_guerra", "arte_della_guerra", "arti_arcane", "autorita", "cavalcare", "professione", "teologia"]
};

export const SKILL_MAP = {
  armi_comuni: "fortitudo",
  armi_da_guerra: "fortitudo",
  atletica: "fortitudo",
  forza: "fortitudo",
  lotta: "fortitudo",
  agilita: "celeritas",
  archi: "celeritas",
  armi_corte: "celeritas",
  furtivita: "celeritas",
  manualita: "celeritas",
  carisma: "gratia",
  intrattenere: "gratia",
  mercatura: "gratia",
  raggirare: "gratia",
  usi_e_costumi: "gratia",
  alchimia: "mens",
  arti_arcane: "mens",
  arti_liberali: "mens",
  ragionamento: "mens",
  storia_e_leggende: "mens",
  balestre: "prudentia",
  empatia: "prudentia",
  guarigione: "prudentia",
  percezione: "prudentia",
  sopravvivenza: "prudentia",
  arte_della_guerra: "audacia",
  autorita: "audacia",
  cavalcare: "audacia",
  teologia: "audacia",
  volonta: "audacia",
  artigiano: "varies",
  professione: "varies"
};

export function peGradeCost(fromGrade, toGrade) {
  if (toGrade <= fromGrade) return 0;
  let cost = 0;
  if (fromGrade === 0 && toGrade >= 1) {
    cost += 10;
    for (let g = 2; g <= toGrade; g++) cost += 2 * g;
  } else {
    for (let g = fromGrade + 1; g <= toGrade; g++) cost += 2 * g;
  }
  return cost;
}

export function mestiereCost(skillId, ceto, hasUrbana = false) {
  if (CETO_SKILLS.common.includes(skillId)) return null;
  if (BASE_SKILLS.includes(skillId)) return null;

  const idx = CETO_ORDER.indexOf(ceto);
  for (let dist = 0; dist < CETO_ORDER.length; dist++) {
    for (const d of [idx - dist, idx + dist]) {
      if (d < 0 || d >= CETO_ORDER.length) continue;
      const current = CETO_ORDER[d];
      if (CETO_SKILLS[current]?.includes(skillId)) {
        let cost = dist <= 1 ? 1 : dist;
        if (hasUrbana && cost > 1) cost -= 1;
        return cost;
      }
    }
  }
  return null;
}

export function allSkillIds() {
  return Object.keys(SKILL_MAP);
}
