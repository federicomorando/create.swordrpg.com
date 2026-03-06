/**
 * Talent (Talento) definitions for the SwORD system.
 *
 * Source: Il Tempo della Spada 1.0, Section 7.2 (pp. 139-148)
 * Canonical data: docs/sword_talents_canonical_clean.json
 *
 * There are 72 talents total, 12 per characteristic. Each talent auto-unlocks
 * when a character meets all skill grade prerequisites — talents are never
 * purchased or selected.
 *
 * Prerequisite types:
 *   - Simple: { skill, grade }
 *   - OR: { type: "or", options: [{ skill, grade }, ...] }
 *   - CHOICE_ANY: { type: "choice_any", options: [{ skill, grade }, ...], count: N }
 *
 * Effect types (categorized for phased implementation):
 *   Phase 2: charBonus — permanent +1 to a characteristic
 *   Phase 3: extraDice, resourceBonus, spiritFormula
 *   Phase 4: damageMod, parryMod, protectionMod
 *   Phase 5: successBonus, flag, special (active/contextual)
 *
 * Structural fixes applied vs. OCR source (6 issues):
 *   1. Diligente: "Ar- tigiano" → artigiano
 *   2. Ingegno: "Artigia- no" → artigiano
 *   3. Minaccioso: garbage entries removed, correct reqs: forza 3, atletica 3, autorita 3, lotta 3
 *   4. Fulmine di guerra: null grades fixed → agilita 6 + choice_any(2 weapon skills at 6)
 *   5. Meditazione: "Arti arcane op- pure Empatia" → or(arti_arcane, empatia)
 *   6. Arrocco: "una qualsiasi abilità d'arma" → choice_any(6 weapon skills, count=1)
 */

// ─── Characteristic categories ──────────────────────────────────────────────

export const TALENT_CATEGORIES = [
  "audacia", "celeritas", "fortitudo", "gratia", "mens", "prudentia"
];

export const TALENT_TRACK_CHARACTERISTIC = {
  audacia: "audacia",
  celeritas: "celeritas",
  fortitudo: "fortitudo",
  gratia: "gratia",
  mens: "mens",
  prudentia: "prudentia"
};

// ─── Talent definitions ─────────────────────────────────────────────────────

export const TALENT_DEFS = {

  // ═══════════════════════════════════════════════════════════════════════════
  // AUDACIA (base skill: Volontà) — 12 talents
  // ═══════════════════════════════════════════════════════════════════════════

  bassifondi: {
    name: "Bassifondi",
    category: "audacia",
    grade: 3,
    baseSkill: "volonta",
    requirements: [
      { skill: "volonta", grade: 3 },
      { skill: "furtivita", grade: 3 },
      { skill: "raggirare", grade: 3 },
      { skill: "usi_e_costumi", grade: 3 }
    ],
    effects: [
      { type: "successBonus", context: "furtivita_urban", bonus: 1 },
      { type: "flag", key: "focus_umile_social" }
    ],
    effectsRaw: "Ottenete un successo bonus alle prove di Furtività in ambienti urbani angusti. Ottenete inoltre un focus aggiuntivo nelle interazioni sociali con persone di ceto Umile."
  },

  diligente: {
    name: "Diligente",
    category: "audacia",
    grade: 3,
    baseSkill: "volonta",
    requirements: [
      { skill: "volonta", grade: 3 },
      { skill: "mercatura", grade: 3 },
      { type: "or", options: [{ skill: "arti_liberali", grade: 3 }, { skill: "teologia", grade: 3 }] },
      { type: "or", options: [{ skill: "artigiano", grade: 3 }, { skill: "professione", grade: 3 }] }
    ],
    effects: [
      { type: "special", key: "double_work_earnings" },
      { type: "special", key: "study_3pe" }
    ],
    effectsRaw: "Quando effettuate un interludio di lavoro, raddoppiate il guadagno; quando ne effettuate uno di studio, ottenete 3 PE in luogo di 2."
  },

  lottatore: {
    name: "Lottatore",
    category: "audacia",
    grade: 3,
    baseSkill: "volonta",
    requirements: [
      { skill: "volonta", grade: 3 },
      { skill: "atletica", grade: 3 },
      { skill: "lotta", grade: 3 },
      { type: "or", options: [{ skill: "armi_comuni", grade: 3 }, { skill: "armi_da_guerra", grade: 3 }] }
    ],
    effects: [
      { type: "damageMod", context: "unarmed", bonus: 1 },
      { type: "special", key: "free_grapple_for_fatica" }
    ],
    effectsRaw: "Aumentate di +1 il danno causato con attacchi a mani nude. Una volta per turno, dopo un attacco o difesa senz'armi, potete spendere un punto Fatica per un'azione di abrazzar gratuita."
  },

  stratega: {
    name: "Stratega",
    category: "audacia",
    grade: 3,
    baseSkill: "volonta",
    requirements: [
      { skill: "volonta", grade: 3 },
      { skill: "arte_della_guerra", grade: 3 },
      { skill: "autorita", grade: 3 },
      { type: "or", options: [{ skill: "armi_comuni", grade: 3 }, { skill: "armi_da_guerra", grade: 3 }] }
    ],
    effects: [
      { type: "special", key: "distribute_riflessi" }
    ],
    effectsRaw: "All'inizio di ogni turno ricevete una riserva di punti Riflessi pari al vostro grado in Arte della guerra da ridistribuire tra voi e i vostri compagni."
  },

  alfiere: {
    name: "Alfiere",
    category: "audacia",
    grade: 4,
    baseSkill: "volonta",
    requirements: [
      { skill: "volonta", grade: 4 },
      { skill: "autorita", grade: 4 },
      { type: "or", options: [{ skill: "arti_liberali", grade: 4 }, { skill: "teologia", grade: 4 }] }
    ],
    effects: [
      { type: "special", key: "valori_activation_plus1" },
      { type: "charBonus", characteristic: "audacia", bonus: 1 }
    ],
    effectsRaw: "Quando mettete in gioco i Valori, potete considerarli maggiori di un punto ai fini dei successi bonus. +1 Audacia."
  },

  fiore_della_cavalleria: {
    name: "Fiore della cavalleria",
    category: "audacia",
    grade: 4,
    baseSkill: "volonta",
    requirements: [
      { skill: "volonta", grade: 4 },
      { skill: "arte_della_guerra", grade: 4 },
      { skill: "cavalcare", grade: 4 }
    ],
    effects: [
      { type: "special", key: "formation_bonus" }
    ],
    effectsRaw: "In formazione (ogni membro entro 5 metri, almeno 2 compagni), tutti ricevono un successo bonus ad attacchi, difese e Reazioni. Con un Valore in gioco, il bonus si estende ai compagni che lo condividono."
  },

  lotta_in_arme: {
    name: "Lotta in arme",
    category: "audacia",
    grade: 4,
    baseSkill: "volonta",
    requirements: [
      { skill: "volonta", grade: 4 },
      { skill: "lotta", grade: 4 },
      { type: "or", options: [{ skill: "armi_da_guerra", grade: 4 }, { skill: "armi_comuni", grade: 4 }] }
    ],
    effects: [
      { type: "special", key: "weapons_at_close_range" }
    ],
    effectsRaw: "Potete utilizzare armi di Misura Media o inferiore anche a Misura Stretta o in abrazzar, sfruttandone danno e Parata."
  },

  vitalita: {
    name: "Vitalità",
    category: "audacia",
    grade: 4,
    baseSkill: "volonta",
    requirements: [
      { skill: "volonta", grade: 4 },
      { skill: "atletica", grade: 4 },
      { type: "or", options: [{ skill: "lotta", grade: 4 }, { skill: "sopravvivenza", grade: 4 }] }
    ],
    effects: [
      { type: "special", key: "scale_fatigue_penalties" },
      { type: "charBonus", characteristic: "fortitudo", bonus: 1 }
    ],
    effectsRaw: "Scalate di un successo le penalità legate alla Fatica. +1 Fortitudo."
  },

  araldo: {
    name: "Araldo",
    category: "audacia",
    grade: 5,
    baseSkill: "volonta",
    requirements: [
      { skill: "volonta", grade: 5 },
      { skill: "autorita", grade: 5 }
    ],
    effects: [
      { type: "special", key: "companions_reaction_resolve_bonus" },
      { type: "charBonus", characteristic: "audacia", bonus: 1 }
    ],
    effectsRaw: "I compagni con cui condividete almeno un Valore ottengono un successo bonus alle Reazioni e ai confronti di Risolutezza. +1 Audacia."
  },

  condottiero: {
    name: "Condottiero",
    category: "audacia",
    grade: 5,
    baseSkill: "volonta",
    requirements: [
      { skill: "volonta", grade: 5 },
      { skill: "arte_della_guerra", grade: 5 }
    ],
    effects: [
      { type: "special", key: "success_reserve_adg" }
    ],
    effectsRaw: "Ricevete una riserva di successi bonus pari al grado in Arte della guerra. Potete assegnare 1 successo bonus per turno a qualsiasi prova vostra o dei compagni."
  },

  illuminazione: {
    name: "Illuminazione",
    category: "audacia",
    grade: 5,
    baseSkill: "volonta",
    requirements: [
      { skill: "volonta", grade: 5 },
      { type: "or", options: [{ skill: "arti_arcane", grade: 5 }, { skill: "teologia", grade: 5 }] }
    ],
    effects: [
      { type: "spiritFormula", mode: "addScore", characteristic: "mens" }
    ],
    effectsRaw: "Aumentate i punti Spirito di un numero pari al vostro punteggio di Mens."
  },

  volitivo: {
    name: "Volitivo",
    category: "audacia",
    grade: 6,
    baseSkill: "volonta",
    requirements: [
      { skill: "volonta", grade: 6 },
      { type: "or", options: [{ skill: "intrattenere", grade: 6 }, { skill: "raggirare", grade: 6 }] }
    ],
    effects: [
      { type: "charBonus", characteristic: "gratia", bonus: 1 },
      { type: "special", key: "modify_valori" }
    ],
    effectsRaw: "+1 Gratia. Potete rimuovere o aggiungere una Tentazione. Potete modificare di un punto un Valore anche oltre il limite."
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // CELERITAS (base skill: Agilità) — 12 talents
  // ═══════════════════════════════════════════════════════════════════════════

  combattimento_con_due_armi: {
    name: "Combattimento con due armi",
    category: "celeritas",
    grade: 3,
    baseSkill: "agilita",
    requirements: [
      { skill: "agilita", grade: 3 },
      { skill: "atletica", grade: 3 },
      { skill: "armi_corte", grade: 3 },
      { type: "choice_any", options: [
        { skill: "armi_comuni", grade: 3 },
        { skill: "armi_da_guerra", grade: 3 },
        { skill: "lotta", grade: 3 }
      ], count: 1 }
    ],
    effects: [
      { type: "special", key: "free_secondary_attack" }
    ],
    effectsRaw: "Ottenete un'azione gratuita per turno con un'arma di Stretta Misura nella mano secondaria, ma con un successo di penalità."
  },

  equitazione: {
    name: "Equitazione",
    category: "celeritas",
    grade: 3,
    baseSkill: "agilita",
    requirements: [
      { skill: "agilita", grade: 3 },
      { skill: "atletica", grade: 3 },
      { skill: "cavalcare", grade: 3 },
      { skill: "empatia", grade: 3 }
    ],
    effects: [
      { type: "special", key: "mounted_two_hand" },
      { type: "successBonus", context: "mounted_melee", bonus: 1 }
    ],
    effectsRaw: "Potete usare armi a due mani (compresi archi e balestre) a cavallo. -1 penalità da movimento cavalcatura. +1 successo ad attacchi e difese in sella nella mischia."
  },

  grazia_felina: {
    name: "Grazia felina",
    category: "celeritas",
    grade: 3,
    baseSkill: "agilita",
    requirements: [
      { skill: "agilita", grade: 3 },
      { skill: "atletica", grade: 3 },
      { skill: "furtivita", grade: 3 },
      { type: "or", options: [{ skill: "armi_corte", grade: 3 }, { skill: "manualita", grade: 3 }] }
    ],
    effects: [
      { type: "resourceBonus", resource: "riflessi", bonus: 1 },
      { type: "extraDice", skill: "agilita", bonus: 1 }
    ],
    effectsRaw: "+1 Riflessi (permanente). Un dado extra in Agilità."
  },

  lingua_sciolta: {
    name: "Lingua Sciolta",
    category: "celeritas",
    grade: 3,
    baseSkill: "agilita",
    requirements: [
      { skill: "agilita", grade: 3 },
      { skill: "intrattenere", grade: 3 },
      { skill: "raggirare", grade: 3 },
      { type: "or", options: [{ skill: "autorita", grade: 3 }, { skill: "empatia", grade: 3 }] }
    ],
    effects: [
      { type: "special", key: "ars_oratoria_riflessi_drain" }
    ],
    effectsRaw: "Una volta per sfida di Ars oratoria, potete causare una perdita di Riflessi all'interlocutore pari ai successi in una prova di Carisma."
  },

  senso_del_pericolo: {
    name: "Senso del pericolo",
    category: "celeritas",
    grade: 4,
    baseSkill: "agilita",
    requirements: [
      { skill: "agilita", grade: 4 },
      { skill: "furtivita", grade: 4 },
      { skill: "sopravvivenza", grade: 4 }
    ],
    effects: [
      { type: "charBonus", characteristic: "celeritas", bonus: 1 },
      { type: "special", key: "draw_weapon_3riflessi" }
    ],
    effectsRaw: "+1 Celeritas. Potete estrarre un'arma spendendo 3 punti Riflessi."
  },

  sicario: {
    name: "Sicario",
    category: "celeritas",
    grade: 4,
    baseSkill: "agilita",
    requirements: [
      { skill: "agilita", grade: 4 },
      { skill: "furtivita", grade: 4 },
      { skill: "armi_corte", grade: 4 }
    ],
    effects: [
      { type: "special", key: "surprise_bonus_damage_bleeding" }
    ],
    effectsRaw: "Quando cogliete di sorpresa un avversario, infliggete danni aggiuntivi pari ai modificatori di Celeritas e di Prudentia e provocate sanguinamento."
  },

  stile_a_due_armi: {
    name: "Stile a due armi",
    category: "celeritas",
    grade: 4,
    baseSkill: "agilita",
    requirements: [
      { skill: "agilita", grade: 4 },
      { skill: "armi_corte", grade: 4 },
      { type: "or", options: [{ skill: "armi_da_guerra", grade: 4 }, { skill: "lotta", grade: 4 }] }
    ],
    effects: [
      { type: "special", key: "two_medium_weapons" }
    ],
    effectsRaw: "Potete combattere con due armi a una mano di Misura Media, con un'azione gratuita per turno (con un successo di penalità)."
  },

  tempismo: {
    name: "Tempismo",
    category: "celeritas",
    grade: 4,
    baseSkill: "agilita",
    requirements: [
      { skill: "agilita", grade: 4 },
      { skill: "armi_da_guerra", grade: 4 },
      { skill: "armi_comuni", grade: 4 }
    ],
    effects: [
      { type: "special", key: "win_ties_riflessi_recovery_extra_action" }
    ],
    effectsRaw: "A parità di Riflessi agite prima degli avversari. All'inizio di ogni turno recuperate 1 punto Riflessi. Potete spendere 3 Riflessi per un'azione addizionale."
  },

  maestro_di_lotta: {
    name: "Maestro di lotta",
    category: "celeritas",
    grade: 5,
    baseSkill: "agilita",
    requirements: [
      { skill: "agilita", grade: 5 },
      { skill: "lotta", grade: 5 }
    ],
    effects: [
      { type: "damageMod", context: "unarmed", bonus: 1 },
      { type: "charBonus", characteristic: "fortitudo", bonus: 1 }
    ],
    effectsRaw: "+1 danni delle percussioni (pugni e calci). +1 Fortitudo."
  },

  maestro_di_scudo: {
    name: "Maestro di scudo",
    category: "celeritas",
    grade: 5,
    baseSkill: "agilita",
    requirements: [
      { skill: "agilita", grade: 5 },
      { skill: "armi_da_guerra", grade: 5 }
    ],
    effects: [
      { type: "special", key: "shield_parry_as_reaction" }
    ],
    effectsRaw: "Potete parare con lo scudo usando una Reazione al posto di un'azione, spendendo Riflessi pari ai successi dell'attacco."
  },

  ombra: {
    name: "Ombra",
    category: "celeritas",
    grade: 5,
    baseSkill: "agilita",
    requirements: [
      { skill: "agilita", grade: 5 },
      { skill: "furtivita", grade: 5 }
    ],
    effects: [
      { type: "special", key: "riflessi_cost_minus1" },
      { type: "special", key: "spirito_for_reactions" }
    ],
    effectsRaw: "Qualsiasi spesa di Riflessi costa 1 punto in meno (minimo 0). Potete eseguire Reazioni spendendo Spirito al posto di Riflessi."
  },

  fulmine_di_guerra: {
    name: "Fulmine di guerra",
    category: "celeritas",
    grade: 6,
    baseSkill: "agilita",
    requirements: [
      { skill: "agilita", grade: 6 },
      { type: "choice_any", options: [
        { skill: "armi_comuni", grade: 6 },
        { skill: "armi_corte", grade: 6 },
        { skill: "armi_da_guerra", grade: 6 },
        { skill: "lotta", grade: 6 }
      ], count: 2 }
    ],
    effects: [
      { type: "charBonus", characteristic: "prudentia", bonus: 1 },
      { type: "special", key: "extra_attack_3riflessi" }
    ],
    effectsRaw: "+1 Prudentia. Ogni turno potete spendere 3 Riflessi per un attacco o parata addizionale."
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // FORTITUDO (base skill: Forza) — 12 talents
  // ═══════════════════════════════════════════════════════════════════════════

  giostrare: {
    name: "Giostrare",
    category: "fortitudo",
    grade: 3,
    baseSkill: "forza",
    requirements: [
      { skill: "forza", grade: 3 },
      { skill: "armi_comuni", grade: 3 },
      { skill: "armi_da_guerra", grade: 3 },
      { skill: "cavalcare", grade: 3 }
    ],
    effects: [
      { type: "special", key: "mounted_shield_lance" },
      { type: "special", key: "double_charge_strength" }
    ],
    effectsRaw: "Potete combattere in sella con scudo e lancia da cavaliere o arma a una mano. In carica raddoppiate il bonus dai gradi di Forza della cavalcatura."
  },

  incoccare: {
    name: "Incoccare",
    category: "fortitudo",
    grade: 3,
    baseSkill: "forza",
    requirements: [
      { skill: "forza", grade: 3 },
      { skill: "atletica", grade: 3 },
      { skill: "manualita", grade: 3 },
      { type: "or", options: [{ skill: "archi", grade: 3 }, { skill: "balestre", grade: 3 }] }
    ],
    effects: [
      { type: "special", key: "reload_minus1" }
    ],
    effectsRaw: "Diminuite di un'azione il tempo di ricarica delle armi in cui avete raggiunto i gradi di prerequisito. Se scende a 0, ricaricare diventa azione gratuita (una volta per turno)."
  },

  minaccioso: {
    name: "Minaccioso",
    category: "fortitudo",
    grade: 3,
    baseSkill: "forza",
    requirements: [
      { skill: "forza", grade: 3 },
      { skill: "atletica", grade: 3 },
      { skill: "autorita", grade: 3 },
      { skill: "lotta", grade: 3 }
    ],
    effects: [
      { type: "extraDice", skill: "autorita", bonus: 1, context: "intimidation" }
    ],
    effectsRaw: "Vi basta un'occhiata per intimorire qualcuno: guadagnate un dado extra in Autorità."
  },

  sbracciata: {
    name: "Sbracciata",
    category: "fortitudo",
    grade: 3,
    baseSkill: "forza",
    requirements: [
      { skill: "forza", grade: 3 },
      { skill: "atletica", grade: 3 },
      { skill: "lotta", grade: 3 },
      { type: "or", options: [{ skill: "armi_comuni", grade: 3 }, { skill: "armi_da_guerra", grade: 3 }] }
    ],
    effects: [
      { type: "special", key: "spend_fatica_plus1_damage" }
    ],
    effectsRaw: "Quando portate un attacco con arma da mischia, potete spendere 1 Fatica: il danno aumenta di +1."
  },

  carovaniere: {
    name: "Carovaniere",
    category: "fortitudo",
    grade: 4,
    baseSkill: "forza",
    requirements: [
      { skill: "forza", grade: 4 },
      { skill: "mercatura", grade: 4 },
      { skill: "sopravvivenza", grade: 4 }
    ],
    effects: [
      { type: "special", key: "party_travel_bonus" }
    ],
    effectsRaw: "In viaggio, voi e compagni avete un successo bonus alle prove di Percezione e alle Reazioni di Fatica. La compagnia può ignorare 1 punto di penalità al Movimento per terreno o clima."
  },

  fanteria: {
    name: "Fanteria",
    category: "fortitudo",
    grade: 4,
    baseSkill: "forza",
    requirements: [
      { skill: "forza", grade: 4 },
      { skill: "armi_comuni", grade: 4 },
      { skill: "armi_da_guerra", grade: 4 }
    ],
    effects: [
      { type: "special", key: "one_hand_polearms_shield" },
      { type: "damageMod", context: "polearm_shield", bonus: 1 },
      { type: "parryMod", context: "polearm_shield", bonus: 1 }
    ],
    effectsRaw: "Potete impugnare con una mano lance da fante, picche, ronconi e falcioni inastati, con lo scudo nell'altra. +1 danno all'arma in asta e +1 Parata allo scudo."
  },

  mente_del_guerriero: {
    name: "Mente del guerriero",
    category: "fortitudo",
    grade: 4,
    baseSkill: "forza",
    requirements: [
      { skill: "forza", grade: 4 },
      { skill: "arti_liberali", grade: 4 },
      { skill: "lotta", grade: 4 }
    ],
    effects: [
      { type: "special", key: "scale_wound_penalties" },
      { type: "charBonus", characteristic: "audacia", bonus: 1 }
    ],
    effectsRaw: "Scalate di un successo le penalità per le ferite. +1 Audacia."
  },

  mitridatismo: {
    name: "Mitridatismo",
    category: "fortitudo",
    grade: 4,
    baseSkill: "forza",
    requirements: [
      { skill: "forza", grade: 4 },
      { skill: "guarigione", grade: 4 }
    ],
    effects: [
      { type: "successBonus", context: "poison_reaction", bonus: 2 }
    ],
    effectsRaw: "+2 successi bonus alle Reazioni contro i veleni."
  },

  bestia_da_soma: {
    name: "Bestia da soma",
    category: "fortitudo",
    grade: 5,
    baseSkill: "forza",
    requirements: [
      { skill: "forza", grade: 5 },
      { skill: "atletica", grade: 5 }
    ],
    effects: [
      { type: "charBonus", characteristic: "fortitudo", bonus: 1 },
      { type: "special", key: "extra_fatica_per_level" },
      { type: "special", key: "halve_excess_fatica_wounds" }
    ],
    effectsRaw: "+1 Fortitudo. +1 punto Fatica aggiuntivo in ogni livello. Se esaurite la Fatica, ulteriori perdite vengono dimezzate prima di essere trasformate in ferite."
  },

  duellante: {
    name: "Duellante",
    category: "fortitudo",
    grade: 5,
    baseSkill: "forza",
    requirements: [
      { skill: "forza", grade: 5 },
      { skill: "armi_corte", grade: 5 }
    ],
    effects: [
      { type: "parryMod", context: "armi_corte", bonus: 1 },
      { type: "special", key: "quick_draw_armi_corte" },
      { type: "special", key: "modify_misura_on_riflessi_loss" }
    ],
    effectsRaw: "+1 Parata con armi corte. Potete spendere 3 Riflessi per estrarre o agire con arma corta. Se gli avversari perdono Riflessi, potete modificare la Misura o ritirarvi senza attacchi gratuiti."
  },

  maestro_darma: {
    name: "Maestro d'arma",
    category: "fortitudo",
    grade: 5,
    baseSkill: "forza",
    requirements: [
      { skill: "forza", grade: 5 },
      { skill: "armi_da_guerra", grade: 5 },
      { skill: "armi_comuni", grade: 5 }
    ],
    effects: [
      { type: "special", key: "weapon_mastery_sword" },
      { type: "special", key: "weapon_mastery_axe" },
      { type: "special", key: "weapon_mastery_polearm" }
    ],
    effectsRaw: "Spada: parata gratuita per turno. Ascia/mazza: ogni ferita causa anche -1 Fatica e -1 Riflessi. Armi in asta: +1 successo per difendere/ripristinare la Misura."
  },

  macchina_da_guerra: {
    name: "Macchina da guerra",
    category: "fortitudo",
    grade: 6,
    baseSkill: "forza",
    requirements: [
      { skill: "forza", grade: 6 },
      { skill: "lotta", grade: 6 }
    ],
    effects: [
      { type: "charBonus", characteristic: "celeritas", bonus: 1 },
      { type: "damageMod", context: "melee_all", bonus: 1 },
      { type: "parryMod", context: "melee_all", bonus: 1 },
      { type: "protectionMod", context: "unarmored", bonus: 1 }
    ],
    effectsRaw: "+1 Celeritas. +1 danno e +1 Parata con tutte le armi da mischia. Protezione 1 senza armatura."
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // GRATIA (base skill: Carisma) — 12 talents
  // ═══════════════════════════════════════════════════════════════════════════

  affarista: {
    name: "Affarista",
    category: "gratia",
    grade: 3,
    baseSkill: "carisma",
    requirements: [
      { skill: "carisma", grade: 3 },
      { skill: "mercatura", grade: 3 },
      { skill: "raggirare", grade: 3 },
      { skill: "usi_e_costumi", grade: 3 }
    ],
    effects: [
      { type: "special", key: "double_trade_earnings" },
      { type: "flag", key: "focus_borghese_social" }
    ],
    effectsRaw: "Raddoppiate la rendita e i guadagni del lavoro. Focus nelle interazioni sociali con persone di ceto Borghese."
  },

  cortesia: {
    name: "Cortesia",
    category: "gratia",
    grade: 3,
    baseSkill: "carisma",
    requirements: [
      { skill: "carisma", grade: 3 },
      { skill: "arti_liberali", grade: 3 },
      { skill: "autorita", grade: 3 },
      { type: "or", options: [{ skill: "intrattenere", grade: 3 }, { skill: "raggirare", grade: 3 }] }
    ],
    effects: [
      { type: "special", key: "add_fides_honor_to_fama" }
    ],
    effectsRaw: "Potete sommare Fides oppure Honor alla vostra Fama quando la mettete in gioco."
  },

  fattucchiere: {
    name: "Fattucchiere",
    category: "gratia",
    grade: 3,
    baseSkill: "carisma",
    requirements: [
      { skill: "carisma", grade: 3 },
      { skill: "alchimia", grade: 3 },
      { skill: "arti_arcane", grade: 3 },
      { skill: "raggirare", grade: 3 }
    ],
    effects: [
      { type: "special", key: "fake_magic_superstitio_defense" }
    ],
    effectsRaw: "Con una prova di Raggirare, chiunque voglia nuocervi deve superare un confronto di Risolutezza di Superstitio contro i vostri successi."
  },

  trovatore: {
    name: "Trovatore",
    category: "gratia",
    grade: 3,
    baseSkill: "carisma",
    requirements: [
      { skill: "carisma", grade: 3 },
      { skill: "intrattenere", grade: 3 },
      { skill: "storia_e_leggende", grade: 3 },
      { skill: "usi_e_costumi", grade: 3 }
    ],
    effects: [
      { type: "extraDice", skill: "arti_liberali", bonus: 1 },
      { type: "flag", key: "focus_nobile_social" }
    ],
    effectsRaw: "Un dado extra in Arti liberali. Focus nelle interazioni sociali con persone di ceto Nobile."
  },

  compagni_fedeli: {
    name: "Compagni fedeli",
    category: "gratia",
    grade: 4,
    baseSkill: "carisma",
    requirements: [
      { skill: "carisma", grade: 4 },
      { skill: "empatia", grade: 4 },
      { type: "or", options: [{ skill: "cavalcare", grade: 4 }, { skill: "sopravvivenza", grade: 4 }] }
    ],
    effects: [
      { type: "special", key: "animal_companion_boost" },
      { type: "special", key: "spend_pe_for_animal_skill" }
    ],
    effectsRaw: "Qualsiasi animale possediate riceve un pregio aggiuntivo. Potete spendere PE (doppio dei successi, max 6) per potenziare le abilità degli animali."
  },

  retore: {
    name: "Retore",
    category: "gratia",
    grade: 4,
    baseSkill: "carisma",
    requirements: [
      { skill: "carisma", grade: 4 },
      { skill: "arti_liberali", grade: 4 },
      { skill: "intrattenere", grade: 4 }
    ],
    effects: [
      { type: "special", key: "no_riflessi_combined_ars_oratoria" }
    ],
    effectsRaw: "Nelle sfide di oratoria non spendete punti Riflessi per effettuare manovre combinate."
  },

  seduttore: {
    name: "Seduttore",
    category: "gratia",
    grade: 4,
    baseSkill: "carisma",
    requirements: [
      { skill: "carisma", grade: 4 },
      { skill: "intrattenere", grade: 4 },
      { skill: "raggirare", grade: 4 }
    ],
    effects: [
      { type: "charBonus", characteristic: "gratia", bonus: 1 }
    ],
    effectsRaw: "+1 Gratia."
  },

  senza_volto: {
    name: "Senza volto",
    category: "gratia",
    grade: 4,
    baseSkill: "carisma",
    requirements: [
      { skill: "carisma", grade: 4 },
      { skill: "furtivita", grade: 4 },
      { skill: "raggirare", grade: 4 }
    ],
    effects: [
      { type: "special", key: "reduce_fama_by3" }
    ],
    effectsRaw: "Se lo desiderate, in qualsiasi momento potete considerare la vostra Fama più bassa di 3 punti."
  },

  intuito: {
    name: "Intuito",
    category: "gratia",
    grade: 5,
    baseSkill: "carisma",
    requirements: [
      { skill: "carisma", grade: 5 },
      { skill: "arti_liberali", grade: 5 }
    ],
    effects: [
      { type: "charBonus", characteristic: "mens", bonus: 1 },
      { type: "special", key: "ars_oratoria_threshold_minus1" }
    ],
    effectsRaw: "+1 Mens. La soglia delle sfide di oratoria diminuisce di un punto."
  },

  ispirare: {
    name: "Ispirare",
    category: "gratia",
    grade: 5,
    baseSkill: "carisma",
    requirements: [
      { skill: "carisma", grade: 5 },
      { skill: "empatia", grade: 5 },
      { type: "or", options: [{ skill: "intrattenere", grade: 5 }, { skill: "autorita", grade: 5 }] }
    ],
    effects: [
      { type: "special", key: "spend_spirito_heal_companions" }
    ],
    effectsRaw: "Una volta al giorno, potete spendere Spirito (max pari al Valore condiviso) per far recuperare ferite (Graffi e Ferite Leggere), Fatica e Spirito ai compagni."
  },

  rete_di_contatti: {
    name: "Rete di contatti",
    category: "gratia",
    grade: 5,
    baseSkill: "carisma",
    requirements: [
      { skill: "carisma", grade: 5 },
      { skill: "usi_e_costumi", grade: 5 }
    ],
    effects: [
      { type: "special", key: "contact_familiarity_plus1" },
      { type: "special", key: "extra_contacts" }
    ],
    effectsRaw: "+1 familiarità e influenza a un Contatto. Ogni insediamento ospita un Contatto aggiuntivo. Una volta al mese potete sostituire un Contatto."
  },

  maesta: {
    name: "Maestà",
    category: "gratia",
    grade: 6,
    baseSkill: "carisma",
    requirements: [
      { skill: "carisma", grade: 6 },
      { skill: "autorita", grade: 6 }
    ],
    effects: [
      { type: "charBonus", characteristic: "audacia", bonus: 1 }
    ],
    effectsRaw: "+1 Audacia."
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // MENS (base skill: Ragionamento) — 12 talents
  // ═══════════════════════════════════════════════════════════════════════════

  determinazione: {
    name: "Determinazione",
    category: "mens",
    grade: 3,
    baseSkill: "ragionamento",
    requirements: [
      { skill: "ragionamento", grade: 3 },
      { skill: "autorita", grade: 3 },
      { type: "or", options: [{ skill: "arti_liberali", grade: 3 }, { skill: "mercatura", grade: 3 }] },
      { type: "or", options: [{ skill: "atletica", grade: 3 }, { skill: "lotta", grade: 3 }] }
    ],
    effects: [
      { type: "special", key: "extra_die_forza_or_volonta" }
    ],
    effectsRaw: "Ricevete un dado extra in Forza oppure in Volontà."
  },

  ingegno: {
    name: "Ingegno",
    category: "mens",
    grade: 3,
    baseSkill: "ragionamento",
    requirements: [
      { skill: "ragionamento", grade: 3 },
      { skill: "arti_liberali", grade: 3 },
      { skill: "storia_e_leggende", grade: 3 },
      { type: "or", options: [{ skill: "artigiano", grade: 3 }, { skill: "professione", grade: 3 }] }
    ],
    effects: [
      { type: "special", key: "extra_die_mercatura_teologia_usi" },
      { type: "special", key: "learn_skill_6pe" }
    ],
    effectsRaw: "Un dado extra in un'abilità a scelta tra Mercatura, Teologia, Usi e costumi. Il costo per apprendere una nuova abilità scende a 6 PE."
  },

  medico_da_campo: {
    name: "Medico da campo",
    category: "mens",
    grade: 3,
    baseSkill: "ragionamento",
    requirements: [
      { skill: "ragionamento", grade: 3 },
      { skill: "empatia", grade: 3 },
      { skill: "guarigione", grade: 3 },
      { skill: "sopravvivenza", grade: 3 }
    ],
    effects: [
      { type: "special", key: "halve_wound_healing_time" },
      { type: "special", key: "reduce_cure_penalty" }
    ],
    effectsRaw: "Dimezzate i tempi per curare ferite. -1 successo alle penalità di cura per livello ferita e mancanza attrezzature."
  },

  meditazione: {
    name: "Meditazione",
    category: "mens",
    grade: 3,
    baseSkill: "ragionamento",
    requirements: [
      { skill: "ragionamento", grade: 3 },
      { skill: "arti_liberali", grade: 3 },
      { skill: "teologia", grade: 3 },
      { type: "or", options: [{ skill: "arti_arcane", grade: 3 }, { skill: "empatia", grade: 3 }] }
    ],
    effects: [
      { type: "spiritFormula", mode: "addModifier", characteristics: ["mens", "prudentia"] },
      { type: "special", key: "meditation_spirito_recovery" }
    ],
    effectsRaw: "Potete aggiungere il vostro bonus di Mens e di Prudentia per calcolare i punti Spirito. Potete meditare un'ora per recuperare Spirito pari ai successi in una prova di Ragionamento."
  },

  giuramento_di_ippocrate: {
    name: "Giuramento di Ippocrate",
    category: "mens",
    grade: 4,
    baseSkill: "ragionamento",
    requirements: [
      { skill: "ragionamento", grade: 4 },
      { skill: "alchimia", grade: 4 },
      { skill: "guarigione", grade: 4 }
    ],
    effects: [
      { type: "extraDice", skill: "alchimia", bonus: 1 },
      { type: "extraDice", skill: "guarigione", bonus: 1 }
    ],
    effectsRaw: "Un dado extra in Alchimia e Guarigione."
  },

  mondano: {
    name: "Mondano",
    category: "mens",
    grade: 4,
    baseSkill: "ragionamento",
    requirements: [
      { skill: "ragionamento", grade: 4 },
      { skill: "arti_liberali", grade: 4 },
      { skill: "usi_e_costumi", grade: 4 }
    ],
    effects: [
      { type: "extraDice", skill: "carisma", bonus: 1 }
    ],
    effectsRaw: "Un dado extra in Carisma."
  },

  vagabondo: {
    name: "Vagabondo",
    category: "mens",
    grade: 4,
    baseSkill: "ragionamento",
    requirements: [
      { skill: "ragionamento", grade: 4 },
      { skill: "storia_e_leggende", grade: 4 },
      { skill: "usi_e_costumi", grade: 4 }
    ],
    effects: [
      { type: "special", key: "third_cultural_trait" },
      { type: "charBonus", characteristic: "mens", bonus: 1 }
    ],
    effectsRaw: "Potete scegliere un terzo tratto culturale. +1 Mens."
  },

  vita_di_strada: {
    name: "Vita di strada",
    category: "mens",
    grade: 4,
    baseSkill: "ragionamento",
    requirements: [
      { skill: "ragionamento", grade: 4 },
      { skill: "furtivita", grade: 4 },
      { skill: "usi_e_costumi", grade: 4 }
    ],
    effects: [
      { type: "extraDice", skill: "percezione", bonus: 1 }
    ],
    effectsRaw: "Un dado extra in Percezione."
  },

  chiave_della_mappa: {
    name: "Chiave della mappa",
    category: "mens",
    grade: 5,
    baseSkill: "ragionamento",
    requirements: [
      { skill: "ragionamento", grade: 5 },
      { skill: "artigiano", grade: 5 }
    ],
    effects: [
      { type: "special", key: "create_extraordinary_items" }
    ],
    effectsRaw: "Potete creare oggetti di qualità Straordinaria con Artigiano o Alchimia."
  },

  colpo_docchio: {
    name: "Colpo d'occhio",
    category: "mens",
    grade: 5,
    baseSkill: "ragionamento",
    requirements: [
      { skill: "ragionamento", grade: 5 },
      { type: "or", options: [{ skill: "manualita", grade: 5 }, { skill: "sopravvivenza", grade: 5 }] }
    ],
    effects: [
      { type: "charBonus", characteristic: "prudentia", bonus: 1 }
    ],
    effectsRaw: "+1 Prudentia."
  },

  eponimo: {
    name: "Eponimo",
    category: "mens",
    grade: 5,
    baseSkill: "ragionamento",
    requirements: [
      { skill: "ragionamento", grade: 5 },
      { skill: "arti_liberali", grade: 5 }
    ],
    effects: [
      { type: "special", key: "extra_die_any_skill" }
    ],
    effectsRaw: "Assegnate un dado extra in una qualsiasi abilità."
  },

  custode_del_sapere: {
    name: "Custode del sapere",
    category: "mens",
    grade: 6,
    baseSkill: "ragionamento",
    requirements: [
      { skill: "ragionamento", grade: 6 },
      { type: "or", options: [{ skill: "arti_arcane", grade: 6 }, { skill: "teologia", grade: 6 }] }
    ],
    effects: [
      { type: "charBonus", characteristic: "mens", bonus: 1 }
    ],
    effectsRaw: "+1 Mens."
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // PRUDENTIA (base skill: Percezione) — 12 talents
  // ═══════════════════════════════════════════════════════════════════════════

  arrocco: {
    name: "Arrocco",
    category: "prudentia",
    grade: 3,
    baseSkill: "percezione",
    requirements: [
      { skill: "percezione", grade: 3 },
      { skill: "arte_della_guerra", grade: 3 },
      { skill: "sopravvivenza", grade: 3 },
      { type: "choice_any", options: [
        { skill: "archi", grade: 3 },
        { skill: "balestre", grade: 3 },
        { skill: "armi_corte", grade: 3 },
        { skill: "armi_comuni", grade: 3 },
        { skill: "armi_da_guerra", grade: 3 },
        { skill: "lotta", grade: 3 }
      ], count: 1 }
    ],
    effects: [
      { type: "successBonus", context: "battlefield_study", bonus: 1 },
      { type: "successBonus", context: "camp_preparation", bonus: 1 }
    ],
    effectsRaw: "+1 successo in Arte della guerra per studiare il campo di battaglia e in Sopravvivenza per preparare l'accampamento."
  },

  avanguardia: {
    name: "Avanguardia",
    category: "prudentia",
    grade: 3,
    baseSkill: "percezione",
    requirements: [
      { skill: "percezione", grade: 3 },
      { skill: "autorita", grade: 3 },
      { skill: "furtivita", grade: 3 },
      { skill: "sopravvivenza", grade: 3 }
    ],
    effects: [
      { type: "special", key: "sacrifice_success_companion_die" }
    ],
    effectsRaw: "Nelle prove di Furtività, Percezione o Sopravvivenza potete sacrificare un vostro successo per assegnare un dado extra alle prove dei compagni."
  },

  battipista: {
    name: "Battipista",
    category: "prudentia",
    grade: 3,
    baseSkill: "percezione",
    requirements: [
      { skill: "percezione", grade: 3 },
      { skill: "atletica", grade: 3 },
      { skill: "sopravvivenza", grade: 3 },
      { skill: "usi_e_costumi", grade: 3 }
    ],
    effects: [
      { type: "special", key: "travel_distance_bonus" },
      { type: "successBonus", context: "fatigue_reaction", bonus: 1 }
    ],
    effectsRaw: "Aumentate dei gradi di Sopravvivenza i km coperti in un giorno di viaggio. +1 successo alle Reazioni di Fatica dei compagni."
  },

  scienza_antica: {
    name: "Scienza antica",
    category: "prudentia",
    grade: 3,
    baseSkill: "percezione",
    requirements: [
      { skill: "percezione", grade: 3 },
      { skill: "alchimia", grade: 3 },
      { skill: "arti_arcane", grade: 3 },
      { skill: "artigiano", grade: 3 }
    ],
    effects: [
      { type: "extraDice", skill: "artigiano", bonus: 1 }
    ],
    effectsRaw: "Un dado extra in tutte le abilità di Artigiano."
  },

  aggiustare_il_tiro: {
    name: "Aggiustare il tiro",
    category: "prudentia",
    grade: 4,
    baseSkill: "percezione",
    requirements: [
      { skill: "percezione", grade: 4 },
      { skill: "archi", grade: 4 },
      { skill: "atletica", grade: 4 }
    ],
    effects: [
      { type: "special", key: "successive_shot_bonus" }
    ],
    effectsRaw: "La seconda freccia tirata consecutivamente verso il medesimo bersaglio, e ogni freccia successiva, hanno un successo bonus."
  },

  bruciapelo: {
    name: "Bruciapelo",
    category: "prudentia",
    grade: 4,
    baseSkill: "percezione",
    requirements: [
      { skill: "percezione", grade: 4 },
      { skill: "balestre", grade: 4 }
    ],
    effects: [
      { type: "successBonus", context: "crossbow_10m", bonus: 1 },
      { type: "damageMod", context: "crossbow_10m", bonus: 1 }
    ],
    effectsRaw: "Quando tirate con la balestra entro 10 metri: +1 successo alla prova e +1 al danno."
  },

  cercatore: {
    name: "Cercatore",
    category: "prudentia",
    grade: 4,
    baseSkill: "percezione",
    requirements: [
      { skill: "percezione", grade: 4 },
      { skill: "furtivita", grade: 4 },
      { skill: "sopravvivenza", grade: 4 }
    ],
    effects: [
      { type: "charBonus", characteristic: "prudentia", bonus: 1 }
    ],
    effectsRaw: "+1 Prudentia."
  },

  tattiche_di_guerriglia: {
    name: "Tattiche di Guerriglia",
    category: "prudentia",
    grade: 4,
    baseSkill: "percezione",
    requirements: [
      { skill: "percezione", grade: 4 },
      { skill: "arte_della_guerra", grade: 4 },
      { skill: "sopravvivenza", grade: 4 }
    ],
    effects: [
      { type: "special", key: "party_furtivita_woodland" },
      { type: "special", key: "ambush_success_reserve" }
    ],
    effectsRaw: "I compagni hanno +1 successo alle prove di Furtività in boschi e foreste. In agguato, ricevete una riserva di successi bonus pari al grado di Sopravvivenza."
  },

  armonioso: {
    name: "Armonioso",
    category: "prudentia",
    grade: 5,
    baseSkill: "percezione",
    requirements: [
      { skill: "percezione", grade: 5 },
      { skill: "atletica", grade: 5 }
    ],
    effects: [
      { type: "charBonus", characteristic: "celeritas", bonus: 1 }
    ],
    effectsRaw: "+1 Celeritas."
  },

  cecchino: {
    name: "Cecchino",
    category: "prudentia",
    grade: 5,
    baseSkill: "percezione",
    requirements: [
      { skill: "percezione", grade: 5 },
      { skill: "balestre", grade: 5 }
    ],
    effects: [
      { type: "special", key: "crossbow_aim_bonus" }
    ],
    effectsRaw: "Quando prendete la mira con la balestra: +10m Gittata, -1 successo penalità condizioni, -1 successo difficoltà tiro, -1 Protezione bersaglio."
  },

  occhio_di_falco: {
    name: "Occhio di falco",
    category: "prudentia",
    grade: 5,
    baseSkill: "percezione",
    requirements: [
      { skill: "percezione", grade: 5 },
      { skill: "archi", grade: 5 },
      { skill: "atletica", grade: 5 }
    ],
    effects: [
      { type: "damageMod", context: "bow", bonus: 1 },
      { type: "special", key: "bow_range_plus10m" },
      { type: "special", key: "extra_arrow_3riflessi" }
    ],
    effectsRaw: "+1 danno con archi. +10m Gittata. Una volta per turno, 3 Riflessi per ricaricare o scoccare una freccia addizionale."
  },

  giudice: {
    name: "Giudice",
    category: "prudentia",
    grade: 6,
    baseSkill: "percezione",
    requirements: [
      { skill: "percezione", grade: 6 },
      { skill: "autorita", grade: 6 },
      { type: "or", options: [{ skill: "arti_liberali", grade: 6 }, { skill: "raggirare", grade: 6 }] }
    ],
    effects: [
      { type: "charBonus", characteristic: "gratia", bonus: 1 },
      { type: "special", key: "categorical_judgment_ars_oratoria" }
    ],
    effectsRaw: "+1 Gratia. Una volta per sfida di Ars oratoria, potete esprimere un giudizio categorico e ottenere un successo bonus a qualsiasi prova."
  }
};

// ─── Prerequisite checker ───────────────────────────────────────────────────

/**
 * Check if all requirements for a talent are met given a skills object.
 * @param {object} talentDef - A talent definition from TALENT_DEFS
 * @param {object} skills - Skills object where each key maps to { grade, ... }
 * @returns {boolean} True if all prerequisites are satisfied
 */
export function checkTalentUnlocked(talentDef, skills) {
  return talentDef.requirements.every(req => {
    if (req.type === "or") {
      return req.options.some(o => (skills[o.skill]?.grade ?? 0) >= o.grade);
    }
    if (req.type === "choice_any") {
      return req.options.filter(o => (skills[o.skill]?.grade ?? 0) >= o.grade).length >= req.count;
    }
    // Simple requirement
    return (skills[req.skill]?.grade ?? 0) >= req.grade;
  });
}

/**
 * Count how many of a talent's requirements the character currently meets.
 * Returns { met, total } where total is the number of requirement entries.
 */
export function countTalentProgress(talentDef, skills) {
  let met = 0;
  for (const req of talentDef.requirements) {
    if (req.type === "or") {
      if (req.options.some(o => (skills[o.skill]?.grade ?? 0) >= o.grade)) met++;
    } else if (req.type === "choice_any") {
      if (req.options.filter(o => (skills[o.skill]?.grade ?? 0) >= o.grade).length >= req.count) met++;
    } else {
      if ((skills[req.skill]?.grade ?? 0) >= req.grade) met++;
    }
  }
  return { met, total: talentDef.requirements.length };
}

/**
 * Compute characteristic bonuses from talent-track progression.
 *
 * Rule: for each base-skill track (category), the first unlocked talent at
 * grade 3/4/5/6 grants +1 to the related characteristic.
 *
 * @param {object} talents - Actor talents object ({ talentId: { unlocked, category, grade, ... } })
 * @returns {object} Characteristic bonus map
 */
export function computeTalentTrackBonuses(talents) {
  const bonuses = {
    fortitudo: 0,
    celeritas: 0,
    gratia: 0,
    mens: 0,
    prudentia: 0,
    audacia: 0
  };
  const thresholds = [3, 4, 5, 6];
  for (const category of TALENT_CATEGORIES) {
    const related = TALENT_TRACK_CHARACTERISTIC[category];
    for (const threshold of thresholds) {
      const reached = Object.values(talents || {}).some(t =>
        t.unlocked && t.category === category && t.grade === threshold
      );
      if (reached) bonuses[related] += 1;
    }
  }
  return bonuses;
}

/**
 * Sum unlocked talent bonuses by effect type and context.
 * Useful for context-driven effects (e.g. successBonus).
 *
 * @param {object} talents - Actor talents object
 * @param {string} effectType - Effect type, e.g. "successBonus"
 * @param {string} context - Effect context key
 * @returns {number} Total bonus
 */
export function computeTalentEffectBonus(talents, effectType, context) {
  let bonus = 0;
  for (const talent of Object.values(talents || {})) {
    if (!talent.unlocked) continue;
    for (const effect of talent.effects || []) {
      if (effect.type === effectType && effect.context === context) {
        bonus += effect.bonus || 0;
      }
    }
  }
  return bonus;
}

/**
 * Sum unlocked contextual extra-dice effects for a specific skill/context.
 *
 * @param {object} talents - Actor talents object
 * @param {string} skillId - Skill being checked
 * @param {string} context - Context key
 * @returns {number} Extra dice
 */
export function computeTalentContextExtraDice(talents, skillId, context) {
  let dice = 0;
  for (const talent of Object.values(talents || {})) {
    if (!talent.unlocked) continue;
    for (const effect of talent.effects || []) {
      if (effect.type === "extraDice" && effect.context === context && effect.skill === skillId) {
        dice += effect.bonus || 0;
      }
    }
  }
  return dice;
}
