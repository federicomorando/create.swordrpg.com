import { allSkillIds } from "../lib/actor-core.mjs";
import { computeCreationSkillState, computeProgressionSummary } from "../lib/progression.mjs";
import { WEAPONS, SHIELDS, ARMOR, GEAR } from "../lib/equipment.mjs";

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
  apprendistato: { effect: "extraDice", modes: { single: { extraDiceAmount: 2 }, split: { extraDiceAmount: 1 } } },
  addestramento_marziale: { effect: "extraDice", extraDiceAmount: 1 },
  antico_sapere: { effect: "extraDice", extraDiceAmount: 1 },
  dedizione: { effect: "extraDice", extraDiceAmount: 1 },
  fascino: { effect: "extraDice", extraDiceAmount: 1 },
  talento_naturale: { effect: "extraDice", extraDiceAmount: 1 },
  nomea: { effect: "fama_bonus", bonus: 1 },
  percorso_spirituale: { effect: "spirito_bonus", bonus: 3 },
  istinto: { effect: "riflessi_bonus", bonus: 1 }
};

const CETO_FAMA = { umile: 0, popolano: 1, borghese: 2, nobile: 3 };

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

    if (type === "weapon" || type === "shield") {
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
          misura: source.misura,
          costDenari: source.costDenari
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
          robustezzaCurrent: source.robustezza,
          costDenari: source.costDenari
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
        description: source.description ?? "",
        costDenari: source.costDenari
      }
    });
  }

  return out;
}

export function stateToFoundryActor(state) {
  const eventsRaw = state.retaggio.events || [];
  const eventsText = eventsRaw.map((ev) => (typeof ev === "string" ? ev : formatEvent(ev))).filter(Boolean);

  const creationSkills = computeCreationSkillState(state);
  const baseGrades = {};
  for (const id of allSkillIds()) {
    baseGrades[id] =
      state.progression?.source === "import"
        ? Number(state.progression.baseSkillGrades?.[id] ?? creationSkills[id]?.baseGrade ?? 0)
        : Number(creationSkills[id]?.baseGrade ?? 0);
  }

  const currentGrades = {};
  for (const id of allSkillIds()) {
    currentGrades[id] = Number(state.progression?.currentSkillGrades?.[id] ?? baseGrades[id]);
  }

  const baseSkillState = Object.fromEntries(
    Object.entries(creationSkills).map(([id, data]) => [id, { ...data, baseGrade: baseGrades[id] ?? data.baseGrade }])
  );

  const prog = computeProgressionSummary(baseSkillState, currentGrades, Number(state.progression?.peTotal ?? 0));

  let famaBonus = 0;
  let spiritoBonus = 0;
  let riflessiBonus = 0;
  const valueUpdates = { ...(state.valori || {}) };
  const retaggioFlags = {
    indomito: false,
    affinitaAnimale: false,
    conoscenze: false,
    nomea: false,
    legame: "",
    cimelio: ""
  };

  for (const ev of eventsRaw) {
    if (!ev || typeof ev !== "object" || !ev.type) continue;
    const def = EVENT_DEFS[ev.type];
    if (!def) continue;
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

  const anticaBonus = hasCultureTrait(state, "antica") ? 1 : 0;
  const spiritualeBonus = hasCultureTrait(state, "spirituale") ? 4 : 0;
  const talentCharBonuses = prog.talentCharBonuses || {};
  const ec = {
    fortitudo: state.chars.fortitudo + (talentCharBonuses.fortitudo || 0),
    celeritas: state.chars.celeritas + (talentCharBonuses.celeritas || 0),
    gratia: state.chars.gratia + (talentCharBonuses.gratia || 0),
    mens: state.chars.mens + (talentCharBonuses.mens || 0),
    prudentia: state.chars.prudentia + (talentCharBonuses.prudentia || 0),
    audacia: state.chars.audacia + (talentCharBonuses.audacia || 0)
  };

  let spirMax = ec.audacia + mod(ec.audacia) + (prog.skills.volonta?.grade || 0) + spiritoBonus + anticaBonus + spiritualeBonus;
  for (const sf of prog.talentSpiritFormulas || []) {
    if (sf.mode === "addScore") spirMax += ec[sf.characteristic] || 0;
    else if (sf.mode === "addModifier") {
      for (const charKey of sf.characteristics || []) spirMax += mod(ec[charKey] || 0);
    }
  }

  const fatMax = ec.fortitudo + ec.audacia + (prog.talentResourceBonuses?.fatica || 0);
  const ferMax = ec.fortitudo + mod(ec.fortitudo) + (prog.skills.forza?.grade || 0) + (prog.talentResourceBonuses?.ferite || 0);
  const rifMax = ec.prudentia + mod(ec.celeritas) + riflessiBonus + (prog.talentResourceBonuses?.riflessi || 0);

  const spent = cartToItems(state.equipment.cart || []).reduce((sum, item) => {
    const qty = Number(item.system?.quantity ?? 1);
    const unit = Number(item.system?.costDenari ?? 0);
    return sum + qty * unit;
  }, 0);
  const remainingDenari = Math.max(0, (state.equipment.wealth || 0) - spent);

  const retaggioTotal = Math.max(
    0,
    3 + mod(state.chars.gratia) + (state.retaggio.tentazione ? 1 : 0) + (hasCultureTrait(state, "intraprendente") ? 1 : 0)
  );

  const skills = Object.fromEntries(
    Object.entries(prog.skills).map(([id, data]) => [
      id,
      {
        grade: data.grade,
        baseGrade: data.baseGrade,
        isMestiere: data.isMestiere,
        hasFocus: data.hasFocus,
        focusCount: data.focusCount,
        extraDice: data.extraDice
      }
    ])
  );

  return {
    name: state.name || "Avventuriero",
    type: "character",
    img: "",
    system: {
      ceto: state.ceto,
      characteristics: state.chars,
      effectiveCharacteristics: ec,
      talentCharBonuses,
      skills,
      resources: {
        riflessi: { value: rifMax, max: rifMax },
        spirito: { value: spirMax, max: spirMax },
        fatica: { value: fatMax, max: fatMax },
        ferite: { value: ferMax, max: ferMax }
      },
      fama: (CETO_FAMA[state.ceto] ?? 0) + famaBonus,
      pe: { total: prog.peTotal, spent: prog.peSpent, available: prog.peAvailable },
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
      talents: prog.talents,
      talentCount: prog.talentCount,
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
