export const STORAGE_KEY = "swordrpg-character-v1";
export const CHAR_KEYS = ["fortitudo", "celeritas", "gratia", "mens", "prudentia", "audacia"];
export const VALORI = ["fides", "impietas", "honor", "ego", "superstitio", "ratio"];

export const STARTING_WEALTH = {
  umile: { dice: 4, multiplier: 1, inDenari: 12 },
  popolano: { dice: 2, multiplier: 1, inDenari: 240 },
  borghese: { dice: 2, multiplier: 5, inDenari: 240 },
  nobile: { dice: 4, multiplier: 10, inDenari: 240 }
};

export const EVENT_DEFS = {
  addestramento_marziale: {
    label: "Addestramento marziale",
    pickFrom: ["archi", "balestre", "armi_corte", "armi_comuni", "armi_da_guerra", "lotta"],
    pickCount: 1,
    effect: "extraDice",
    extraDiceAmount: 1
  },
  apprendistato: {
    label: "Apprendistato",
    effect: "extraDice",
    modes: {
      single: { label: "2 dadi su 1 abilita", pickFrom: ["artigiano", "professione"], pickCount: 1, extraDiceAmount: 2 },
      split: { label: "1 dado su 2 abilita", pickFrom: ["artigiano", "professione"], pickCount: 2, extraDiceAmount: 1 }
    }
  },
  affinita_animale: { label: "Affinita animale", effect: "flag" },
  antico_sapere: {
    label: "Antico sapere",
    pickFrom: ["alchimia", "arti_arcane", "guarigione", "storia_e_leggende", "teologia"],
    pickCount: 2,
    effect: "extraDice",
    extraDiceAmount: 1
  },
  cimelio: { label: "Cimelio", effect: "flag" },
  conoscenze: { label: "Conoscenze", effect: "flag" },
  dedizione: {
    label: "Dedizione",
    pickFrom: ["arte_della_guerra", "atletica", "cavalcare", "empatia", "furtivita", "manualita", "mercatura", "sopravvivenza", "usi_e_costumi"],
    pickCount: 2,
    effect: "extraDice",
    extraDiceAmount: 1
  },
  esperienza: { label: "Esperienza", effect: "training", extraGrade3: 1, extraGrade2: 2 },
  fascino: {
    label: "Fascino",
    pickFrom: ["arti_liberali", "autorita", "intrattenere", "raggirare"],
    pickCount: 2,
    effect: "extraDice",
    extraDiceAmount: 1
  },
  indomito: { label: "Indomito", effect: "flag" },
  istinto: { label: "Istinto", effect: "riflessi_bonus", bonus: 1 },
  legame: { label: "Legame", effect: "flag" },
  nomea: { label: "Nomea", effect: "fama_bonus", bonus: 1 },
  percorso_spirituale: { label: "Percorso spirituale", effect: "spirito_bonus", bonus: 3, valorePickRequired: true },
  talento_naturale: {
    label: "Talento naturale",
    pickFrom: ["volonta", "agilita", "carisma", "forza", "ragionamento", "percezione"],
    pickCount: 1,
    effect: "extraDice",
    extraDiceAmount: 1
  }
};
