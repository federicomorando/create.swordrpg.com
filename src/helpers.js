import { WEAPONS, SHIELDS, ARMOR, GEAR, denariToDisplay } from "@federicomorando/sword-engine/data/equipment";
import { allSkillIds, BASE_SKILLS, CETO_FAMA, mestiereCost, characteristicMod } from "@federicomorando/sword-engine/constants";
import { computeCreationSkillState, computeProgressionSummary, computeRetaggioSlots } from "@federicomorando/sword-engine/progression";
import { getCultureAllowedValori } from "@federicomorando/sword-engine/data/cultures";
import { SKILL_LABELS, CETO_LABELS } from "./data/labels-it.mjs";
import { CHAR_KEYS, VALORI, STARTING_WEALTH, EVENT_DEFS } from "./data/constants.js";
import { state } from "./state.js";

export const modifier = characteristicMod;

export function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

export function escapeHTML(str) {
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;")
    .replaceAll("'", "&#039;");
}

export function charPointsUsed() {
  return Object.values(state.chars).reduce((a, b) => a + b, 0);
}

export function hasCultureTrait(id) {
  return state.cultureTrait1 === id || state.cultureTrait2 === id;
}

export function hasEventType(id) {
  return state.retaggio.events.some((ev) => ev.type === id);
}

export function knownSkillIds() {
  const set = new Set(BASE_SKILLS);
  for (const id of state.skills.mestiere) set.add(id);
  for (const id of state.skills.free) set.add(id);
  return Array.from(set);
}

export function freePicksTotal() {
  return state.chars.mens;
}

export function freePicksUsed() {
  const hasUrbana = hasCultureTrait("urbana");
  return state.skills.free.reduce((sum, id) => sum + (mestiereCost(id, state.ceto, hasUrbana) ?? 0), 0);
}

export function currentWealthMultiplier() {
  let mult = 1;
  if (hasCultureTrait("laboriosa")) mult *= 2;
  if (hasEventType("nomea")) mult *= 2;
  return mult;
}

export function recomputeRolledWealth() {
  if (!state.equipment.wealthRolled) return;
  state.equipment.wealth = state.equipment.wealthBase * currentWealthMultiplier();
}

export function rollInitialWealth() {
  const cfg = STARTING_WEALTH[state.ceto];
  let total = 0;
  for (let i = 0; i < cfg.dice; i++) total += Math.floor(Math.random() * 6) + 1;
  total = total * cfg.multiplier * cfg.inDenari;
  state.equipment.wealthBase = total;
  state.equipment.wealthRolled = true;
  state.equipment.wealth = total * currentWealthMultiplier();
}

export function syncRetaggioState() {
  const hasEsperienza = state.retaggio.events.some((ev) => ev.type === "esperienza");
  if (!hasEsperienza) {
    state.retaggio.espGrade3 = [""];
    state.retaggio.espGrade2 = ["", ""];
    return;
  }

  const known = new Set(knownSkillIds());
  state.retaggio.espGrade3 = state.retaggio.espGrade3.map((id) => (known.has(id) ? id : ""));
  state.retaggio.espGrade2 = state.retaggio.espGrade2.map((id) => (known.has(id) ? id : ""));
  if (state.retaggio.espGrade3.length < 1) state.retaggio.espGrade3 = [""];
  if (state.retaggio.espGrade2.length < 2) state.retaggio.espGrade2 = ["", ""];
}

export function derived() {
  const mod = characteristicMod;
  let spirito = state.chars.audacia + mod(state.chars.audacia);
  if (hasCultureTrait("antica")) spirito += 1;
  if (hasCultureTrait("spirituale")) spirito += 4;
  if (hasEventType("percorso_spirituale")) spirito += 3;

  let riflessi = state.chars.prudentia + mod(state.chars.celeritas);
  if (hasEventType("istinto")) riflessi += 1;

  return {
    riflessi,
    spirito,
    fatica: state.chars.fortitudo + state.chars.audacia,
    ferite: state.chars.fortitudo + mod(state.chars.fortitudo),
    fama: CETO_FAMA[state.ceto] + (hasEventType("nomea") ? 1 : 0)
  };
}

export function retaggioTotal() {
  return computeRetaggioSlots(state.chars.gratia, {
    hasTentazione: !!state.retaggio.tentazione,
    hasIntraprendente: hasCultureTrait("intraprendente"),
    ceto: state.ceto,
  }).total;
}

export function retaggioAvailable() {
  return computeRetaggioSlots(state.chars.gratia, {
    hasTentazione: !!state.retaggio.tentazione,
    hasIntraprendente: hasCultureTrait("intraprendente"),
    ceto: state.ceto,
  }).available;
}

export function totalValoriPoints() {
  return Object.values(state.valori).reduce((a, b) => a + b, 0);
}

export function buyableItems() {
  const weapons = WEAPONS.slice(0, 12).map((w) => ({
    id: `weapon:${w.weaponId}`,
    label: w.label,
    cost: w.costDenari,
    type: "weapon"
  }));
  const shields = SHIELDS.map((s) => ({ id: `shield:${s.shieldId}`, label: s.label, cost: s.costDenari, type: "shield" }));
  const armor = ARMOR.map((a) => ({ id: `armor:${a.armorId}`, label: a.label, cost: a.costDenari, type: "armor" }));
  const gear = GEAR.slice(0, 12).map((g) => ({ id: `gear:${g.gearId}`, label: g.label, cost: g.costDenari, type: "gear" }));
  return [...weapons, ...shields, ...armor, ...gear];
}

export function cartTotal() {
  const items = buyableItems();
  return state.equipment.cart.reduce((sum, entry) => {
    const item = items.find((x) => x.id === entry.id);
    return sum + (item ? item.cost * entry.qty : 0);
  }, 0);
}

export function eventConfig(ev) {
  const base = EVENT_DEFS[ev.type];
  if (!base) return null;
  if (!base.modes) return base;
  if (!ev.mode || !base.modes[ev.mode]) return { ...base, pickFrom: null, pickCount: 0 };
  const modeCfg = base.modes[ev.mode];
  return { ...base, ...modeCfg };
}

export function percorsoValoreOptions() {
  const axes = [["fides", "impietas"], ["honor", "ego"], ["superstitio", "ratio"]];
  const out = [];
  for (const [left, right] of axes) {
    const leftVal = state.valori[left];
    const rightVal = state.valori[right];
    if (leftVal > 0) out.push(left);
    else if (rightVal > 0) out.push(right);
    else out.push(left, right);
  }
  return out;
}

export function eventComplete(ev) {
  const base = EVENT_DEFS[ev.type];
  if (base?.modes && !ev.mode) return false;
  const cfg = eventConfig(ev);
  if (!cfg) return false;
  if (cfg.pickFrom && ev.picks.length !== cfg.pickCount) return false;
  if (cfg.valorePickRequired && !ev.valoreKey) return false;
  return true;
}

export function syncSkillTrainingState() {
  const known = new Set(knownSkillIds());
  const freeRaised = new Set(
    state.skills.free.filter((id) => BASE_SKILLS.includes(id) || state.skills.mestiere.includes(id))
  );

  state.skills.grade3 = state.skills.grade3.map((id) => (known.has(id) ? id : ""));
  state.skills.grade2 = state.skills.grade2.map((id) => (known.has(id) && !freeRaised.has(id) ? id : ""));
}

export function buildTrainingOptions() {
  syncSkillTrainingState();
  const known = knownSkillIds()
    .map((id) => ({ id, label: SKILL_LABELS[id] ?? id }))
    .sort((a, b) => a.label.localeCompare(b.label));
  const freeRaised = new Set(
    state.skills.free.filter((id) => BASE_SKILLS.includes(id) || state.skills.mestiere.includes(id))
  );
  const grade3Set = new Set(state.skills.grade3.filter(Boolean));

  const grade3Slots = state.skills.grade3.map((selected, index) => {
    const other = state.skills.grade3.filter((v, i) => i !== index && v);
    return {
      index,
      selected,
      options: known.filter((s) => !other.includes(s.id) || s.id === selected)
    };
  });

  const grade2Slots = state.skills.grade2.map((selected, index) => {
    const other = state.skills.grade2.filter((v, i) => i !== index && v);
    return {
      index,
      selected,
      options: known.filter(
        (s) =>
          !grade3Set.has(s.id) &&
          !freeRaised.has(s.id) &&
          (!other.includes(s.id) || s.id === selected)
      )
    };
  });

  return { grade3Slots, grade2Slots };
}

function creationBaseGradeMap() {
  const baseState = computeCreationSkillState(state);
  return Object.fromEntries(
    Object.entries(baseState).map(([id, data]) => [id, data.baseGrade])
  );
}

export function ensureProgressionState() {
  if (!state.progression) {
    state.progression = { source: "creation", peTotal: 0, baseSkillGrades: {}, currentSkillGrades: {} };
  }

  const skillIds = allSkillIds();
  if (state.progression.source !== "import") {
    const baseMap = creationBaseGradeMap();
    state.progression.baseSkillGrades = baseMap;
    for (const id of skillIds) {
      const minGrade = baseMap[id] ?? 0;
      if (state.progression.peTotal === 0) {
        state.progression.currentSkillGrades[id] = minGrade;
      } else {
        const current = Number(state.progression.currentSkillGrades[id] ?? minGrade);
        state.progression.currentSkillGrades[id] = Math.max(minGrade, Math.min(6, current));
      }
    }
  } else {
    for (const id of skillIds) {
      const base = Number(state.progression.baseSkillGrades[id] ?? 0);
      const current = Number(state.progression.currentSkillGrades[id] ?? base);
      state.progression.baseSkillGrades[id] = Math.max(0, Math.min(6, base));
      state.progression.currentSkillGrades[id] = Math.max(state.progression.baseSkillGrades[id], Math.min(6, current));
    }
  }
}

export function progressionSummary() {
  ensureProgressionState();
  const creation = computeCreationSkillState(state);
  const withBase = Object.fromEntries(
    Object.entries(creation).map(([id, data]) => [
      id,
      {
        ...data,
        baseGrade:
          state.progression.source === "import"
            ? Number(state.progression.baseSkillGrades[id] ?? data.baseGrade)
            : data.baseGrade
      }
    ])
  );
  return computeProgressionSummary(withBase, state.progression.currentSkillGrades, state.progression.peTotal);
}

export function uiSummary() {
  const hasUrbana = state.cultureTrait1 === "urbana" || state.cultureTrait2 === "urbana";
  const mestiereUsed = state.skills.mestiere.reduce(
    (sum, id) => sum + (mestiereCost(id, state.ceto, hasUrbana) ?? 0),
    0
  );
  const remainingWealth = state.equipment.wealth - cartTotal();
  const prog = progressionSummary();

  return {
    ceto: CETO_LABELS[state.ceto],
    charsLeft: Math.max(0, 54 - charPointsUsed()),
    mestiereLeft: Math.max(0, 6 - mestiereUsed),
    freeLeft: Math.max(0, freePicksTotal() - freePicksUsed()),
    valoriLeft: Math.max(0, 3 - totalValoriPoints()),
    retaggioLeft: Math.max(0, retaggioAvailable() - state.retaggio.events.length),
    wealthText:
      state.equipment.wealth > 0 ? denariToDisplay(Math.max(0, remainingWealth)) : "non tirata",
    peText: `${prog.peAvailable} PE`
  };
}
