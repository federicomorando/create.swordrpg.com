import { allSkillIds } from "../lib/actor-core.mjs";
import { WEAPONS, SHIELDS, ARMOR, GEAR } from "../lib/equipment.mjs";

function skillSkeleton() {
  return Object.fromEntries(
    allSkillIds().map((id) => [id, { grade: 0, baseGrade: 0, isMestiere: false, hasFocus: false, focusCount: 0, extraDice: 0 }])
  );
}

const EVENT_LABELS = {
  addestramento_marziale: "Addestramento marziale",
  apprendistato: "Apprendistato",
  affinita_animale: "Affinita animale",
  antico_sapere: "Antico sapere",
  cimelio: "Cimelio",
  conoscenze: "Conoscenze",
  dedizione: "Dedizione",
  esperienza: "Esperienza",
  fascino: "Fascino",
  indomito: "Indomito",
  istinto: "Istinto",
  legame: "Legame",
  nomea: "Nomea",
  percorso_spirituale: "Percorso spirituale",
  talento_naturale: "Talento naturale"
};

const EVENT_DEFS = {
  addestramento_marziale: { effect: "extraDice", extraDiceAmount: 1 },
  apprendistato: {
    effect: "extraDice",
    modes: {
      single: { extraDiceAmount: 2 },
      split: { extraDiceAmount: 1 }
    }
  },
  affinita_animale: { effect: "flag" },
  antico_sapere: { effect: "extraDice", extraDiceAmount: 1 },
  cimelio: { effect: "flag" },
  conoscenze: { effect: "flag" },
  dedizione: { effect: "extraDice", extraDiceAmount: 1 },
  esperienza: { effect: "training" },
  fascino: { effect: "extraDice", extraDiceAmount: 1 },
  indomito: { effect: "flag" },
  istinto: { effect: "riflessi_bonus", bonus: 1 },
  legame: { effect: "flag" },
  nomea: { effect: "fama_bonus", bonus: 1 },
  percorso_spirituale: { effect: "spirito_bonus", bonus: 3, valorePickRequired: true },
  talento_naturale: { effect: "extraDice", extraDiceAmount: 1 }
};

function formatEvent(eventObj) {
  if (!eventObj || typeof eventObj !== "object") return "";
  const base = EVENT_LABELS[eventObj.type] ?? eventObj.type ?? "";
  const picks = Array.isArray(eventObj.picks) && eventObj.picks.length ? ` [${eventObj.picks.join(", ")}]` : "";
  const mode = eventObj.mode ? ` (${eventObj.mode})` : "";
  const valore = eventObj.valoreKey ? ` {${eventObj.valoreKey}}` : "";
  const note = eventObj.note ? ` - ${eventObj.note}` : "";
  return `${base}${mode}${picks}${valore}${note}`.trim();
}

function hasCultureTrait(state, id) {
  return state.cultureTrait1 === id || state.cultureTrait2 === id;
}

function mod(score) {
  const d = Number(score) - 7;
  return d > 0 ? Math.ceil(d / 2) : Math.floor(d / 2);
}

function denariToMoney(total) {
  const lire = Math.floor(total / 240);
  const remAfterL = total % 240;
  const soldi = Math.floor(remAfterL / 12);
  const denari = remAfterL % 12;
  return { lire, soldi, denari };
}

function cartToItems(cart) {
  const out = [];
  const lookup = {
    weapon: new Map(WEAPONS.map((x) => [x.weaponId, x])),
    shield: new Map(SHIELDS.map((x) => [x.shieldId, x])),
    armor: new Map(ARMOR.map((x) => [x.armorId, x])),
    gear: new Map(GEAR.map((x) => [x.gearId, x]))
  };

  for (const entry of cart) {
    const [type, rawId] = entry.id.split(":");
    const qty = Number(entry.qty || 1);
    const source = lookup[type]?.get(rawId);
    if (!source) continue;

    if (type === "weapon") {
      out.push({
        type: "weapon",
        name: source.label,
        system: {
          quantity: qty,
          weight: source.weight,
          pregi: source.pregi,
          damageValue: source.damageValue,
          damageType: source.damageType,
          parryModifier: source.parryModifier,
          misura: source.misura
        }
      });
      continue;
    }

    if (type === "shield") {
      out.push({
        type: "weapon",
        name: source.label,
        system: {
          quantity: qty,
          weight: source.weight,
          pregi: source.pregi,
          damageValue: source.damageValue,
          damageType: source.damageType,
          parryModifier: source.parryModifier,
          misura: source.misura
        }
      });
      continue;
    }

    if (type === "armor") {
      out.push({
        type: "armor",
        name: source.label,
        system: {
          quantity: qty,
          weight: source.weight,
          pregi: source.pregi,
          protezione: source.protezione,
          robustezza: source.robustezza,
          robustezzaCurrent: source.robustezza
        }
      });
      continue;
    }

    out.push({
      type: "gear",
      name: source.label,
      system: {
        quantity: qty,
        weight: source.weight,
        pregi: [],
        description: source.description ?? ""
      }
    });
  }

  return out;
}

export function stateToFoundryActor(state) {
  const eventsRaw = state.retaggio.events || [];
  const eventsText = eventsRaw
    .map((ev) => (typeof ev === "string" ? ev : formatEvent(ev)))
    .filter(Boolean);

  const skills = skillSkeleton();
  const valueUpdates = { ...(state.valori || {}) };
  let famaBonus = 0;
  let spiritoBonus = 0;
  let riflessiBonus = 0;
  const retaggioFlags = {
    indomito: false,
    affinitaAnimale: false,
    conoscenze: false,
    nomea: false,
    legame: "",
    cimelio: ""
  };

  for (const id of state.skills.mestiere ?? []) {
    if (!skills[id]) continue;
    skills[id].grade = Math.max(skills[id].grade, 1);
    skills[id].isMestiere = true;
  }

  for (const id of state.skills.free ?? []) {
    if (!skills[id]) continue;
    skills[id].grade = skills[id].grade >= 1 ? 2 : 1;
  }

  for (const id of state.skills.grade2 ?? []) {
    if (!id || !skills[id]) continue;
    skills[id].grade = Math.max(skills[id].grade, 2);
  }
  for (const id of state.skills.grade3 ?? []) {
    if (!id || !skills[id]) continue;
    skills[id].grade = Math.max(skills[id].grade, 3);
  }

  if (state.trait1Skill && skills[state.trait1Skill]) skills[state.trait1Skill].extraDice += 1;
  if (state.trait2Skill && skills[state.trait2Skill]) skills[state.trait2Skill].extraDice += 1;

  // Culture effects that alter extraDice/bonuses.
  if (hasCultureTrait(state, "meticcio")) {
    if (skills.storia_e_leggende) skills.storia_e_leggende.extraDice += 1;
    if (skills.usi_e_costumi) skills.usi_e_costumi.extraDice += 1;
  }
  if (hasCultureTrait(state, "rurale")) {
    if (skills.sopravvivenza) skills.sopravvivenza.extraDice += 1;
    if (skills.usi_e_costumi) skills.usi_e_costumi.extraDice += 1;
  }
  if (hasCultureTrait(state, "tenace") && skills.forza) {
    skills.forza.extraDice += 1;
  }

  // Retaggio event effects.
  for (const ev of eventsRaw) {
    if (!ev || typeof ev !== "object" || !ev.type) continue;
    const def = EVENT_DEFS[ev.type];
    if (!def) continue;

    if (def.effect === "extraDice") {
      const amount = def.modes ? (def.modes[ev.mode]?.extraDiceAmount ?? 0) : (def.extraDiceAmount ?? 0);
      for (const skillId of ev.picks || []) {
        if (skills[skillId]) skills[skillId].extraDice += amount;
      }
    }

    if (def.effect === "training") {
      for (const skillId of state.retaggio.espGrade3 || []) {
        if (!skillId || !skills[skillId]) continue;
        skills[skillId].grade = Math.max(skills[skillId].grade, 3);
        skills[skillId].baseGrade = Math.max(skills[skillId].baseGrade, 3);
      }
      for (const skillId of state.retaggio.espGrade2 || []) {
        if (!skillId || !skills[skillId]) continue;
        skills[skillId].grade = Math.max(skills[skillId].grade, 2);
        skills[skillId].baseGrade = Math.max(skills[skillId].baseGrade, 2);
      }
    }

    if (def.effect === "fama_bonus") famaBonus += def.bonus || 0;
    if (def.effect === "spirito_bonus") {
      spiritoBonus += def.bonus || 0;
      if (ev.valoreKey && ev.valoreKey in valueUpdates) valueUpdates[ev.valoreKey] = (valueUpdates[ev.valoreKey] || 0) + 1;
    }
    if (def.effect === "riflessi_bonus") riflessiBonus += def.bonus || 0;

    if (ev.type === "indomito") retaggioFlags.indomito = true;
    if (ev.type === "affinita_animale") retaggioFlags.affinitaAnimale = true;
    if (ev.type === "conoscenze") retaggioFlags.conoscenze = true;
    if (ev.type === "nomea") retaggioFlags.nomea = true;
    if (ev.type === "legame") retaggioFlags.legame = ev.note || "Legame";
    if (ev.type === "cimelio") retaggioFlags.cimelio = ev.note || "Cimelio";
  }

  for (const base of ["volonta", "agilita", "carisma", "forza", "ragionamento", "percezione"]) {
    if (skills[base]) {
      skills[base].grade = Math.max(skills[base].grade, 1);
      skills[base].baseGrade = 1;
    }
  }
  for (const id of Object.keys(skills)) {
    skills[id].baseGrade = skills[id].grade;
  }

  const retaggioTotal = Math.max(
    0,
    3 + mod(state.chars.gratia) + (state.retaggio.tentazione ? 1 : 0) + (hasCultureTrait(state, "intraprendente") ? 1 : 0)
  );
  const anticaBonus = hasCultureTrait(state, "antica") ? 1 : 0;
  const spiritualeBonus = hasCultureTrait(state, "spirituale") ? 4 : 0;

  const spirMax =
    state.chars.audacia + mod(state.chars.audacia) + (skills.volonta?.grade || 0) + spiritoBonus + anticaBonus + spiritualeBonus;
  const fatMax = state.chars.fortitudo + state.chars.audacia;
  const ferMax = state.chars.fortitudo + mod(state.chars.fortitudo) + (skills.forza?.grade || 0);
  const rifMax = state.chars.prudentia + mod(state.chars.celeritas) + riflessiBonus;

  const resources = {
    riflessi: { value: rifMax, max: rifMax },
    spirito: { value: spirMax, max: spirMax },
    fatica: { value: fatMax, max: fatMax },
    ferite: { value: ferMax, max: ferMax }
  };

  const spent = cartToItems(state.equipment.cart || []).reduce((sum, item) => {
    const qty = Number(item.system?.quantity ?? 1);
    const unit = Number(item.system?.costDenari ?? 0);
    return sum + qty * unit;
  }, 0);
  const remainingDenari = Math.max(0, (state.equipment.wealth || 0) - spent);

  return {
    name: state.name || "Avventuriero",
    type: "character",
    img: "",
    system: {
      ceto: state.ceto,
      characteristics: state.chars,
      skills,
      resources,
      fama: (state.ceto ? { umile: 0, popolano: 1, borghese: 2, nobile: 3 }[state.ceto] ?? 0 : 0) + famaBonus,
      pe: { total: 0, spent: 0 },
      valori: valueUpdates,
      woundLevels: { graffi: 0, leggere: 0, gravi: 0, critiche: 0, mortali: 0 },
      culture: {
        trait1: state.cultureTrait1 || "",
        trait2: state.cultureTrait2 || ""
      },
      languages: [],
      retaggio: {
        total: retaggioTotal,
        notes: eventsText.join("; "),
        spiritoBonus,
        riflessiBonus,
        indomito: retaggioFlags.indomito,
        affinitaAnimale: retaggioFlags.affinitaAnimale,
        conoscenze: retaggioFlags.conoscenze,
        nomea: retaggioFlags.nomea,
        legame: retaggioFlags.legame,
        cimelio: retaggioFlags.cimelio
      },
      events: eventsText,
      tentazione: state.retaggio.tentazione || "",
      money: denariToMoney(remainingDenari)
    },
    items: cartToItems(state.equipment.cart || [])
  };
}

export function stateToFoundryCharacterJSON(state) {
  const actor = stateToFoundryActor(state);
  return {
    _id: crypto.randomUUID(),
    name: actor.name,
    type: actor.type,
    img: actor.img,
    system: actor.system,
    items: actor.items,
    folder: null,
    sort: 0,
    ownership: { default: 0 },
    flags: {},
    _stats: {
      coreVersion: "13.351",
      systemId: "sword",
      systemVersion: "1.0.0",
      createdTime: Date.now(),
      modifiedTime: Date.now(),
      lastModifiedBy: "browser-export"
    }
  };
}
