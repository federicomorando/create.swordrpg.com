/**
 * Pure equipment data library for the SwORD system.
 *
 * Source: sword-engine-spec.json → itemDataSchema
 * PDF reference: Il Tempo della Spada 1.0, pp. 47, 114-129
 *
 * Zero Foundry dependencies — importable by Node.js tests and Foundry alike.
 *
 * Exports: CURRENCY, QUALITY_TIERS, WEAPON_PREGI, ARMOR_PREGI, WEAPONS, SHIELDS,
 *          ARMOR, GEAR, WEAPON_CATEGORIES, GEAR_CATEGORIES, DAMAGE_TYPES,
 *          ARMOR_PENALIZED_SKILLS, ARMOR_PREGI_SKILL_MAP,
 *          costToDenari, denariToDisplay, qualityCost, computeEncumbrance,
 *          armorSkillPenalty
 */

// ─── Currency system ──────────────────────────────────────────────────────────
// 1 Lira (l) = 20 Soldi (s) = 240 Denari (d). PDF p.114.

export const CURRENCY = {
  denaro: { abbrev: "d", inDenari: 1 },
  soldo:  { abbrev: "s", inDenari: 12 },
  lira:   { abbrev: "l", inDenari: 240 }
};

// ─── Quality system ───────────────────────────────────────────────────────────
// PDF pp.116-117.

export const QUALITY_TIERS = [
  { id: "scadente",      label: "Scadente",      costMultiplier: 0.5, pregiSlots: 0, skillGearBonus: -2 },
  { id: "normale",       label: "Normale",       costMultiplier: 1,   pregiSlots: 0, skillGearBonus: 0 },
  { id: "buona",         label: "Buona",         costMultiplier: 3,   pregiSlots: 1, skillGearBonus: 1 },
  { id: "eccellente",    label: "Eccellente",    costMultiplier: 5,   pregiSlots: 2, skillGearBonus: 2 },
  { id: "ottima",        label: "Ottima",        costMultiplier: 10,  pregiSlots: 3, skillGearBonus: 3 },
  { id: "straordinaria", label: "Straordinaria", costMultiplier: 25,  pregiSlots: 4, skillGearBonus: 4 }
];

// ─── Damage types ─────────────────────────────────────────────────────────────

export const DAMAGE_TYPES = {
  T: { label: "Taglio", effect: "+1 wound if target has no Protection" },
  B: { label: "Botta",  effect: "-1 Riflessi to target" },
  P: { label: "Punta",  effect: "Reduces armor Protection by 1" }
};

// ─── Weapon categories ────────────────────────────────────────────────────────

export const WEAPON_CATEGORIES = ["archi", "balestre", "armi_corte", "armi_comuni", "armi_da_guerra"];

// ─── Gear categories ──────────────────────────────────────────────────────────

export const GEAR_CATEGORIES = ["skill_tool", "travel", "clothing", "container", "alchemical", "ammunition"];

// ─── Armor-penalized skills ───────────────────────────────────────────────────
// PDF pp.54-57. Armor protezione is the penalty magnitude.

export const ARMOR_PENALIZED_SKILLS = new Set(["archi", "atletica", "furtivita", "manualita"]);

// ─── Armor pregi that reduce skill penalties ──────────────────────────────────
// Each reduces the penalty by 2 (min 0) for a specific skill.

export const ARMOR_PREGI_SKILL_MAP = {
  agile:       { skillId: "atletica",   reduction: 2 },
  da_arciere:  { skillId: "archi",      reduction: 2 },
  da_geniere:  { skillId: "manualita",  reduction: 2 },
  furtiva:     { skillId: "furtivita",  reduction: 2 }
};

// ─── Weapon pregi ─────────────────────────────────────────────────────────────
// 8 ranged + 24 melee = 32 total. PDF pp.121-126.

export const WEAPON_PREGI = {
  // Ranged (8)
  attrezzi_da_ricarica: { cost: 1,  type: "ranged", appliesTo: "crossbows",     effect: "-1 ricarica" },
  da_guerra:            { cost: 0,  type: "ranged", appliesTo: "bows",          effect: "Add Fortitudo bonus to damage per quality tier" },
  flettenti_morbidi:    { cost: 1,  type: "ranged", appliesTo: "crossbows",     effect: "-1 ricarica (min 0)" },
  frecce_barbigli:      { cost: 1,  type: "ranged", appliesTo: "ranged",        effect: "+1 wound, causes bleeding" },
  frecce_sfondagiaco:   { cost: 1,  type: "ranged", appliesTo: "ranged",        effect: "-2 target Protection (vs -1 for P damage type)" },
  frecce_da_caccia:     { cost: 1,  type: "ranged", appliesTo: "ranged",        effect: "T damage, +1 wound vs unarmored" },
  frecce_da_volo:       { cost: 1,  type: "ranged", appliesTo: "bows",          effect: "+20m gittata" },
  ricurvo:              { cost: 1,  type: "ranged", appliesTo: "bows",          effect: "+10m gittata" },

  // Melee (24)
  agganciare:           { cost: 1,  type: "melee", appliesTo: "melee",          effect: "Defender -1 Riflessi on parry (stacks to -2)" },
  benedetta:            { cost: 2,  type: "melee", appliesTo: "melee",          effect: "+1 Fides bonus when invoked" },
  bilanciata:           { cost: 1,  type: "melee", appliesTo: "melee",          effect: "Additional actions cost 2 Riflessi instead of 3" },
  compatta:             { cost: 1,  type: "melee", appliesTo: "melee",          effect: "Use at one Misura less without penalty" },
  copertura:            { cost: 1,  type: "melee", appliesTo: "shields",        effect: "Auto cover vs ranged" },
  da_cavallo:           { cost: 1,  type: "melee", appliesTo: "melee+bows",     effect: "Extra die mounted" },
  da_lancio:            { cost: 1,  type: "melee", appliesTo: "short/polearms", effect: "Throwable 10m (+1 damage)" },
  da_sicario:           { cost: 1,  type: "melee", appliesTo: "short only",     effect: "+1 die on surprise attacks" },
  demolitrice:          { cost: 1,  type: "melee", appliesTo: "melee",          effect: "Doubled robustezza damage, +1 die Disarm" },
  difensiva:            { cost: 1,  type: "melee", appliesTo: "melee",          effect: "+1 parry; shields cost 2" },
  feritrice:            { cost: 1,  type: "melee", appliesTo: "melee",          effect: "T damage instead of normal; if already T, cost 2, +2 wounds vs no-Protection" },
  impugnatura_sicura:   { cost: 1,  type: "melee", appliesTo: "all",            effect: "-1 wound/fatigue penalty, +1 die vs Disarm" },
  leggera:              { cost: 1,  type: "melee", appliesTo: "Pesante only",   effect: "-0.5kg, no Riflessi cost for Pesante" },
  metallurgia_avanzata: { cost: 2,  type: "melee", appliesTo: "melee",          effect: "Choose extra damage type on hit" },
  occultabile:          { cost: 1,  type: "melee", appliesTo: "short only",     effect: "Can hide, found with Percezione 3+" },
  onorevole:            { cost: 2,  type: "melee", appliesTo: "melee",          effect: "+1 Honor bonus when invoked" },
  pavese:               { cost: 1,  type: "melee", appliesTo: "large shields",  effect: "Pavise stand for cover" },
  pesante:              { cost: 1,  type: "melee", appliesTo: "melee",          effect: "+1 damage, costs 1 Riflessi/use; stacks" },
  reliquia:             { cost: 2,  type: "melee", appliesTo: "melee+bows",     effect: "+1 Superstitio bonus when invoked" },
  rostri_o_ali:         { cost: 2,  type: "melee", appliesTo: "polearms",       effect: "+1 success on free attacks vs Misura closure" },
  sanguinaria:          { cost: 1,  type: "melee", appliesTo: "melee",          effect: "Causes bleeding on 1+ wound" },
  sfondagiaco:          { cost: 2,  type: "melee", appliesTo: "melee",          effect: "P damage, -2 Protection" },
  stordente:            { cost: 2,  type: "melee", appliesTo: "melee",          effect: "B damage, target -2 Riflessi" },
  versatile:            { cost: 1,  type: "melee", appliesTo: "not Pesante",    effect: "One-hand costs 1 Riflessi; two-hand +1 parry" }
};

// ─── Armor pregi ──────────────────────────────────────────────────────────────
// 15 total. PDF pp.128-129.

export const ARMOR_PREGI = {
  agile:           { cost: 1, effect: "Atletica armor penalty -2 (min 0)" },
  brigantina:      { cost: 2, effect: "+1 Protection torso only (XIV century)" },
  da_arciere:      { cost: 1, effect: "Archi armor penalty -2 (min 0)" },
  da_cavallo:      { cost: 1, effect: "+1 Protection when mounted" },
  da_geniere:      { cost: 1, effect: "Manualita armor penalty -2 (min 0)" },
  da_viaggio:      { cost: 1, effect: "Travel/sleep fatigue penalties -1 each" },
  dimessa:         { cost: 1, effect: "Armor appears common; wearer can reduce Fama by 1" },
  elmo_migliorato: { cost: 1, effect: "Padded: Protection 2 helmet; others: +1 vs head" },
  furtiva:         { cost: 1, effect: "Furtivita armor penalty -2 (min 0)" },
  leggera:         { cost: 1, effect: "-1/4 weight, Fatigue Reaction -1" },
  opera_d_arte:    { cost: 1, effect: "+1 Fama, price doubled" },
  pratica:         { cost: 1, effect: "Halved don/doff time" },
  rinforzata:      { cost: 1, effect: "+1 Protection" },
  robusta:         { cost: 1, effect: "Robustezza doubled (lose 1 Protection every 20 damage)" },
  terrificante:    { cost: 1, effect: "+1 extra die on Autorita checks" }
};

// ─── Compendium: Weapons ──────────────────────────────────────────────────────
// 25 weapons. PDF p.125.

export const WEAPONS = [
  // Bows (2)
  { weaponId: "arco_corto",  label: "Arco corto",  category: "archi", skillId: "archi", hands: "due_mani", costDenari: 12,  costDisplay: "12d",  weight: 1,   damageValue: 2, damageType: "P", parryModifier: 1, misura: null, pregi: [],              gittata: 30, ricarica: 1 },
  { weaponId: "arco_lungo",  label: "Arco lungo",  category: "archi", skillId: "archi", hands: "due_mani", costDenari: 24,  costDisplay: "24d",  weight: 1.5, damageValue: 3, damageType: "P", parryModifier: 2, misura: null, pregi: ["pesante"],     gittata: 30, ricarica: 1 },

  // Crossbows (3)
  { weaponId: "balestra_leggera",      label: "Balestra leggera",      category: "balestre", skillId: "balestre", hands: "due_mani", costDenari: 36,  costDisplay: "3s",  weight: 3, damageValue: 3, damageType: "P", parryModifier: 0, misura: null, pregi: [], gittata: 20, ricarica: 2 },
  { weaponId: "balestra_a_staffa",     label: "Balestra a staffa",     category: "balestre", skillId: "balestre", hands: "due_mani", costDenari: 72,  costDisplay: "6s",  weight: 4, damageValue: 4, damageType: "P", parryModifier: 1, misura: null, pregi: [], gittata: 20, ricarica: 4 },
  { weaponId: "balestra_a_verricello", label: "Balestra a verricello", category: "balestre", skillId: "balestre", hands: "due_mani", costDenari: 120, costDisplay: "10s", weight: 6, damageValue: 6, damageType: "P", parryModifier: 2, misura: null, pregi: [], gittata: 20, ricarica: 6 },

  // Short weapons / Armi corte (4)
  { weaponId: "accetta",      label: "Accetta",      category: "armi_corte", skillId: "armi_corte", hands: "una_mano", costDenari: 3, costDisplay: "3d", weight: 1,   damageValue: 3, damageType: "T", parryModifier: 1, misura: "S", pregi: ["agganciare"], gittata: null, ricarica: null },
  { weaponId: "bastoncello",  label: "Bastoncello",  category: "armi_corte", skillId: "armi_corte", hands: "una_mano", costDenari: 0, costDisplay: "na", weight: 1,   damageValue: 1, damageType: "B", parryModifier: 1, misura: "S", pregi: [],             gittata: null, ricarica: null },
  { weaponId: "coltellaccio", label: "Coltellaccio", category: "armi_corte", skillId: "armi_corte", hands: "una_mano", costDenari: 6, costDisplay: "6d", weight: 1,   damageValue: 2, damageType: "T", parryModifier: 2, misura: "M", pregi: [],             gittata: null, ricarica: null },
  { weaponId: "coltello",     label: "Coltello",     category: "armi_corte", skillId: "armi_corte", hands: "una_mano", costDenari: 2, costDisplay: "2d", weight: 0.5, damageValue: 1, damageType: "T", parryModifier: 1, misura: "S", pregi: [],             gittata: null, ricarica: null },

  // Common weapons / Armi comuni (8)
  { weaponId: "bordone",         label: "Bordone",         category: "armi_comuni", skillId: "armi_comuni", hands: "due_mani", costDenari: 3,  costDisplay: "3d",  weight: 2, damageValue: 2, damageType: "B", parryModifier: 3, misura: "L", pregi: [],              gittata: null, ricarica: null },
  { weaponId: "falce_da_guerra", label: "Falce da guerra", category: "armi_comuni", skillId: "armi_comuni", hands: "due_mani", costDenari: 12, costDisplay: "12d", weight: 6, damageValue: 4, damageType: "T", parryModifier: 3, misura: "L", pregi: [],              gittata: null, ricarica: null },
  { weaponId: "lancia_da_fante", label: "Lancia da fante", category: "armi_comuni", skillId: "armi_comuni", hands: "due_mani", costDenari: 10, costDisplay: "10d", weight: 3, damageValue: 3, damageType: "P", parryModifier: 3, misura: "L", pregi: [],              gittata: null, ricarica: null },
  { weaponId: "martello",        label: "Martello",        category: "armi_comuni", skillId: "armi_comuni", hands: "una_mano", costDenari: 6,  costDisplay: "6d",  weight: 2, damageValue: 2, damageType: "B", parryModifier: 1, misura: "S", pregi: ["compatta"],    gittata: null, ricarica: null },
  { weaponId: "randello",        label: "Randello",        category: "armi_comuni", skillId: "armi_comuni", hands: "una_mano", costDenari: 2,  costDisplay: "2d",  weight: 2, damageValue: 2, damageType: "B", parryModifier: 1, misura: "M", pregi: ["pesante"],     gittata: null, ricarica: null },
  { weaponId: "roncone",         label: "Roncone",         category: "armi_comuni", skillId: "armi_comuni", hands: "due_mani", costDenari: 12, costDisplay: "12d", weight: 5, damageValue: 4, damageType: "P", parryModifier: 2, misura: "L", pregi: ["agganciare"],  gittata: null, ricarica: null },
  { weaponId: "scure",           label: "Scure",           category: "armi_comuni", skillId: "armi_comuni", hands: "due_mani", costDenari: 8,  costDisplay: "8d",  weight: 4, damageValue: 5, damageType: "T", parryModifier: 2, misura: "M", pregi: ["agganciare"],  gittata: null, ricarica: null },
  { weaponId: "spiedo",          label: "Spiedo",          category: "armi_comuni", skillId: "armi_comuni", hands: "una_mano", costDenari: 10, costDisplay: "10d", weight: 2, damageValue: 3, damageType: "P", parryModifier: 2, misura: "M", pregi: ["da_lancio"],   gittata: null, ricarica: null },

  // War weapons / Armi da guerra (8)
  { weaponId: "ascia_normanna",      label: "Ascia normanna",      category: "armi_da_guerra", skillId: "armi_da_guerra", hands: "una_mano", costDenari: 96,  costDisplay: "8s",  weight: 2,   damageValue: 4, damageType: "T", parryModifier: 2, misura: "M",  pregi: ["pesante", "agganciare"],  gittata: null, ricarica: null },
  { weaponId: "lancia_da_cavaliere", label: "Lancia da cavaliere", category: "armi_da_guerra", skillId: "armi_da_guerra", hands: "due_mani", costDenari: 24,  costDisplay: "2s",  weight: 4,   damageValue: 5, damageType: "P", parryModifier: 1, misura: "LL", pregi: ["pesante", "da_cavallo"],  gittata: null, ricarica: null },
  { weaponId: "mannaia_inastata",    label: "Mannaia inastata",    category: "armi_da_guerra", skillId: "armi_da_guerra", hands: "due_mani", costDenari: 24,  costDisplay: "2s",  weight: 5,   damageValue: 6, damageType: "T", parryModifier: 3, misura: "L",  pregi: ["pesante"],                gittata: null, ricarica: null },
  { weaponId: "mazza_ferrata",       label: "Mazza ferrata",       category: "armi_da_guerra", skillId: "armi_da_guerra", hands: "una_mano", costDenari: 120, costDisplay: "10s", weight: 2,   damageValue: 3, damageType: "B", parryModifier: 1, misura: "M",  pregi: [],                         gittata: null, ricarica: null },
  { weaponId: "picca",               label: "Picca",               category: "armi_da_guerra", skillId: "armi_da_guerra", hands: "due_mani", costDenari: 36,  costDisplay: "3s",  weight: 4,   damageValue: 4, damageType: "P", parryModifier: 4, misura: "LL", pregi: ["pesante"],                gittata: null, ricarica: null },
  { weaponId: "pugnale",             label: "Pugnale",             category: "armi_da_guerra", skillId: "armi_da_guerra", hands: "una_mano", costDenari: 12,  costDisplay: "1s",  weight: 0.5, damageValue: 2, damageType: "P", parryModifier: 1, misura: "S",  pregi: [],                         gittata: null, ricarica: null },
  { weaponId: "spada_da_guerra",     label: "Spada da guerra",     category: "armi_da_guerra", skillId: "armi_da_guerra", hands: "una_mano", costDenari: 480, costDisplay: "40s", weight: 2,   damageValue: 4, damageType: "T", parryModifier: 3, misura: "M",  pregi: ["versatile"],              gittata: null, ricarica: null },
  { weaponId: "spada_d_arme",        label: "Spada d'arme",        category: "armi_da_guerra", skillId: "armi_da_guerra", hands: "una_mano", costDenari: 240, costDisplay: "20s", weight: 1.5, damageValue: 3, damageType: "T", parryModifier: 3, misura: "M",  pregi: [],                         gittata: null, ricarica: null }
];

// ─── Compendium: Shields ──────────────────────────────────────────────────────
// 3 shields. PDF p.125.

export const SHIELDS = [
  { shieldId: "brocchiere",  label: "Brocchiere",  costDenari: 12, costDisplay: "1s", weight: 1, damageValue: 1, damageType: "B", parryModifier: 1, misura: "S", pregi: [] },
  { shieldId: "scudo",       label: "Scudo",       costDenari: 12, costDisplay: "1s", weight: 3, damageValue: 2, damageType: "B", parryModifier: 2, misura: "S", pregi: [] },
  { shieldId: "scudo_grande", label: "Scudo grande", costDenari: 24, costDisplay: "2s", weight: 5, damageValue: 2, damageType: "B", parryModifier: 3, misura: "S", pregi: ["pesante", "copertura"] }
];

// ─── Compendium: Armor ────────────────────────────────────────────────────────
// 3 armor types. PDF p.128.

export const ARMOR = [
  { armorId: "abiti_imbottiti",        label: "Abiti imbottiti",        costDenari: 24,   costDisplay: "24d", weight: 2,  protezione: 1, robustezza: 10, pregi: [] },
  { armorId: "armatura_da_fanteria",   label: "Armatura da fanteria",   costDenari: 144,  costDisplay: "12s", weight: 6,  protezione: 2, robustezza: 20, pregi: [] },
  { armorId: "armatura_da_cavalleria", label: "Armatura da cavalleria", costDenari: 1920, costDisplay: "8l",  weight: 15, protezione: 3, robustezza: 30, pregi: [] }
];

// ─── Compendium: Gear ─────────────────────────────────────────────────────────
// 29 items (6 skill tools + 9 travel + 3 containers + 4 clothing + 5 alchemical + 2 ammunition).
// PDF pp.119-122.

export const GEAR = [
  // Skill tools (6)
  { gearId: "attrezzi_alchimia",   label: "Attrezzi da alchimia",   gearCategory: "skill_tool",  costDenari: 240, costDisplay: "1l",  weight: 5,    skillBonusSkillId: "alchimia",       description: "Required for Alchimia checks" },
  { gearId: "attrezzi_artigiano",  label: "Attrezzi da artigiano",  gearCategory: "skill_tool",  costDenari: 48,  costDisplay: "4s",  weight: 5,    skillBonusSkillId: "artigiano",      description: "Required for Artigiano checks" },
  { gearId: "attrezzi_guarigione", label: "Attrezzi da guarigione", gearCategory: "skill_tool",  costDenari: 120, costDisplay: "10s", weight: 2,    skillBonusSkillId: "guarigione",     description: "Required for Guarigione checks" },
  { gearId: "attrezzi_manualita",  label: "Attrezzi da manualita",  gearCategory: "skill_tool",  costDenari: 24,  costDisplay: "2s",  weight: 3,    skillBonusSkillId: "manualita",      description: "Required for Manualita checks (lockpicks, tools, etc.)" },
  { gearId: "strumento_musicale",  label: "Strumento musicale",     gearCategory: "skill_tool",  costDenari: 120, costDisplay: "10s", weight: 2,    skillBonusSkillId: "intrattenere",   description: "Required for Intrattenere (musical) checks" },
  { gearId: "materiale_scrittura", label: "Materiale da scrittura", gearCategory: "skill_tool",  costDenari: 60,  costDisplay: "5s",  weight: 1,    skillBonusSkillId: "arti_liberali",  description: "Quill, ink, parchment. Required for written Arti liberali" },

  // Travel (9)
  { gearId: "corda_10m",       label: "Corda (10m)",            gearCategory: "travel", costDenari: 6,  costDisplay: "6d", weight: 2,    skillBonusSkillId: null, description: "Hemp rope, 10 meters" },
  { gearId: "torcia",          label: "Torcia",                 gearCategory: "travel", costDenari: 1,  costDisplay: "1d", weight: 0.5,  skillBonusSkillId: null, description: "Burns for ~1 hour" },
  { gearId: "lanterna",        label: "Lanterna",               gearCategory: "travel", costDenari: 12, costDisplay: "1s", weight: 1,    skillBonusSkillId: null, description: "Metal lantern, requires oil" },
  { gearId: "olio_lanterna",   label: "Olio per lanterna",      gearCategory: "travel", costDenari: 3,  costDisplay: "3d", weight: 0.5,  skillBonusSkillId: null, description: "Burns for ~4 hours" },
  { gearId: "sacco_a_pelo",    label: "Sacco a pelo / Coperta", gearCategory: "travel", costDenari: 6,  costDisplay: "6d", weight: 2,    skillBonusSkillId: null, description: "Bedroll or blanket for camping" },
  { gearId: "tenda",           label: "Tenda (2 persone)",      gearCategory: "travel", costDenari: 24, costDisplay: "2s", weight: 5,    skillBonusSkillId: null, description: "Canvas tent for 2 people" },
  { gearId: "acciarino",       label: "Acciarino e esca",       gearCategory: "travel", costDenari: 3,  costDisplay: "3d", weight: 0.25, skillBonusSkillId: null, description: "Flint and tinder" },
  { gearId: "razioni_1giorno", label: "Razioni (1 giorno)",     gearCategory: "travel", costDenari: 2,  costDisplay: "2d", weight: 1,    skillBonusSkillId: null, description: "Dried food for one day" },
  { gearId: "otre_acqua",      label: "Otre d'acqua",           gearCategory: "travel", costDenari: 2,  costDisplay: "2d", weight: 1,    skillBonusSkillId: null, description: "Waterskin, holds ~1 liter" },

  // Containers (3)
  { gearId: "bisaccia", label: "Bisaccia", gearCategory: "container", costDenari: 3,  costDisplay: "3d", weight: 0.5, skillBonusSkillId: null, description: "Saddlebag or small sack" },
  { gearId: "zaino",    label: "Zaino",    gearCategory: "container", costDenari: 6,  costDisplay: "6d", weight: 1,   skillBonusSkillId: null, description: "Backpack" },
  { gearId: "baule",    label: "Baule",    gearCategory: "container", costDenari: 12, costDisplay: "1s", weight: 5,   skillBonusSkillId: null, description: "Wooden chest/trunk" },

  // Clothing (4)
  { gearId: "abiti_umili",    label: "Abiti da umile",    gearCategory: "clothing", costDenari: 6,   costDisplay: "6d",  weight: 1,   skillBonusSkillId: null, description: "Humble-class clothing" },
  { gearId: "abiti_popolano", label: "Abiti da popolano", gearCategory: "clothing", costDenari: 24,  costDisplay: "2s",  weight: 1,   skillBonusSkillId: null, description: "Commoner-class clothing" },
  { gearId: "abiti_borghese", label: "Abiti da borghese", gearCategory: "clothing", costDenari: 120, costDisplay: "10s", weight: 1,   skillBonusSkillId: null, description: "Bourgeois-class clothing" },
  { gearId: "abiti_nobile",   label: "Abiti da nobile",   gearCategory: "clothing", costDenari: 480, costDisplay: "2l",  weight: 1.5, skillBonusSkillId: null, description: "Noble-class clothing" },

  // Alchemical (5)
  { gearId: "antidoto_generico",   label: "Antidoto generico",   gearCategory: "alchemical", costDenari: 60,  costDisplay: "5s",  weight: 0.25, skillBonusSkillId: null, description: "Reduces poison power by 2 for next reaction" },
  { gearId: "fuoco_greco",        label: "Fuoco greco",         gearCategory: "alchemical", costDenari: 240, costDisplay: "1l",  weight: 0.5,  skillBonusSkillId: null, description: "Incendiary; causes burning damage" },
  { gearId: "unguento_curativo",  label: "Unguento curativo",   gearCategory: "alchemical", costDenari: 60,  costDisplay: "5s",  weight: 0.25, skillBonusSkillId: null, description: "+1 success to Guarigione checks for wound treatment" },
  { gearId: "veleno_da_contatto", label: "Veleno da contatto",  gearCategory: "alchemical", costDenari: 120, costDisplay: "10s", weight: 0.25, skillBonusSkillId: null, description: "Applied to blade; Forza Reaction vs power 3 on wound" },
  { gearId: "veleno_da_ingestione", label: "Veleno da ingestione", gearCategory: "alchemical", costDenari: 120, costDisplay: "10s", weight: 0.25, skillBonusSkillId: null, description: "In food/drink; Forza Reaction vs power 4" },

  // Ammunition (2)
  { gearId: "frecce_12", label: "Frecce (12) con faretra", gearCategory: "ammunition", costDenari: 12, costDisplay: "12d", weight: 1, skillBonusSkillId: null, description: "12 arrows with quiver" },
  { gearId: "dardi_12",  label: "Dardi (12) con faretra",  gearCategory: "ammunition", costDenari: 24, costDisplay: "2s",  weight: 2, skillBonusSkillId: null, description: "12 bolts with quiver" }
];

// ─── Currency conversion functions ────────────────────────────────────────────

/**
 * Parse a display cost string to denari.
 * Accepted formats: "8s" (8 soldi), "2l" (2 lire), "12d" (12 denari), "na" (free).
 * @param {string} displayStr
 * @returns {number} Total in denari
 */
export function costToDenari(displayStr) {
  if (!displayStr || displayStr === "na") return 0;
  const str = displayStr.trim().toLowerCase();
  const match = str.match(/^(\d+(?:\.\d+)?)\s*([dsl])$/);
  if (!match) return 0;
  const value = parseFloat(match[1]);
  const denom = match[2];
  if (denom === "d") return Math.round(value);
  if (denom === "s") return Math.round(value * 12);
  if (denom === "l") return Math.round(value * 240);
  return 0;
}

/**
 * Convert denari to display string using the highest fitting denomination.
 * @param {number} denari
 * @returns {string} Display string (e.g. "8s", "2l", "12d")
 */
export function denariToDisplay(denari) {
  if (denari <= 0) return "na";
  if (denari >= 240 && denari % 240 === 0) return `${denari / 240}l`;
  if (denari >= 12 && denari % 12 === 0) return `${denari / 12}s`;
  return `${denari}d`;
}

/**
 * Apply quality cost multiplier to a base cost in denari.
 * @param {number} baseDenari
 * @param {string} qualityId
 * @returns {number} Adjusted cost in denari
 */
export function qualityCost(baseDenari, qualityId) {
  const tier = QUALITY_TIERS.find(q => q.id === qualityId);
  if (!tier) return baseDenari;
  return Math.round(baseDenari * tier.costMultiplier);
}

// ─── Encumbrance computation ──────────────────────────────────────────────────
// Formula: base = fortitudo + gradi(forza). PDF p.47.
// Categories: leggero (×2, 0), moderato (×4, -1), pesante (×6, -2), massimo (×8, -3).
// Over massimo = overloaded (cannot move).

const ENCUMBRANCE_CATEGORIES = [
  { id: "leggero",  multiplier: 2, penalty: 0 },
  { id: "moderato", multiplier: 4, penalty: -1 },
  { id: "pesante",  multiplier: 6, penalty: -2 },
  { id: "massimo",  multiplier: 8, penalty: -3 }
];

/**
 * Compute encumbrance category and penalty.
 * @param {number} fortitudo - Fortitudo characteristic score
 * @param {number} forzaGrade - Forza skill grade
 * @param {number} carriedWeight - Total carried weight in kg
 * @returns {{ base: number, category: string, penalty: number }}
 */
export function computeEncumbrance(fortitudo, forzaGrade, carriedWeight) {
  const base = fortitudo + forzaGrade;
  if (carriedWeight <= 0) return { base, category: "leggero", penalty: 0 };

  for (const cat of ENCUMBRANCE_CATEGORIES) {
    if (carriedWeight <= base * cat.multiplier) {
      return { base, category: cat.id, penalty: cat.penalty };
    }
  }
  // Over massimo
  return { base, category: "overloaded", penalty: -3 };
}

// ─── Armor skill penalty ──────────────────────────────────────────────────────

/**
 * Compute armor skill penalty for a specific skill.
 * Formula: max(0, protezione - sum(armorPregiReduction for skill)).
 * @param {number} protezione - Armor protezione value
 * @param {string[]} armorPregi - Array of armor pregio IDs on the armor
 * @param {string} skillId - The skill being checked
 * @returns {number} Penalty (0 or positive integer)
 */
export function armorSkillPenalty(protezione, armorPregi, skillId) {
  if (!ARMOR_PENALIZED_SKILLS.has(skillId)) return 0;
  let reduction = 0;
  for (const pregioId of armorPregi) {
    const mapping = ARMOR_PREGI_SKILL_MAP[pregioId];
    if (mapping && mapping.skillId === skillId) {
      reduction += mapping.reduction;
    }
  }
  return Math.max(0, protezione - reduction);
}
