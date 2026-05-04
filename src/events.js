import { getCultureAllowedValori } from "@federicomorando/sword-engine/data/cultures";
import { allSkillIds, mestiereCost } from "@federicomorando/sword-engine/constants";
import { exportFoundryJSON, exportCharacterPDF } from "./export/exporters.mjs";
import { CHAR_KEYS, VALORI } from "./data/constants.js";
import { state, defaultState } from "./state.js";
import {
  clamp, charPointsUsed, retaggioAvailable, freePicksUsed, freePicksTotal,
  totalValoriPoints, rollInitialWealth, recomputeRolledWealth, eventConfig,
  progressionSummary
} from "./helpers.js";
import { stepValidation } from "./validation.js";
import { render } from "./render.js";

function canGoToStep(targetStep) {
  if (state.progression?.source === "import") return true;
  for (let s = 1; s < targetStep; s += 1) {
    if (!stepValidation(s).ok) return false;
  }
  return true;
}

export async function onAction(event) {
  const el = event.currentTarget;
  const { action } = el.dataset;

  if (action === "goto-step") {
    const next = clamp(Number(el.dataset.step), 1, 9);
    if (canGoToStep(next)) state.step = next;
  }
  if (action === "prev-step") state.step = clamp(state.step - 1, 1, 9);
  if (action === "next-step") {
    const next = clamp(state.step + 1, 1, 9);
    if (stepValidation(state.step).ok && canGoToStep(next)) state.step = next;
  }

  if (action === "set-ceto") {
    state.ceto = el.dataset.ceto;
    state.skills.mestiere = [];
    state.skills.free = [];
    state.skills.grade3 = ["", ""];
    state.skills.grade2 = Array(8).fill("");
    if (state.retaggio.events.length > retaggioAvailable()) {
      state.retaggio.events = state.retaggio.events.slice(0, retaggioAvailable());
    }
    state.equipment.wealth = 0;
    state.equipment.wealthBase = 0;
    state.equipment.wealthRolled = false;
    state.equipment.cart = [];
  }

  if (action === "char-inc") {
    const key = el.dataset.char;
    if (charPointsUsed() < 54) state.chars[key] = clamp(state.chars[key] + 1, 5, 13);
  }
  if (action === "char-dec") {
    const key = el.dataset.char;
    state.chars[key] = clamp(state.chars[key] - 1, 5, 13);
  }

  if (action === "toggle-mestiere") {
    const skill = el.dataset.skill;
    if (state.skills.mestiere.includes(skill)) {
      state.skills.mestiere = state.skills.mestiere.filter((s) => s !== skill);
    } else {
      const hasUrbana = state.cultureTrait1 === "urbana" || state.cultureTrait2 === "urbana";
      const cost = mestiereCost(skill, state.ceto, hasUrbana) ?? 99;
      const used = state.skills.mestiere.reduce((sum, id) => sum + (mestiereCost(id, state.ceto, hasUrbana) ?? 0), 0);
      if (used + cost <= 6) state.skills.mestiere.push(skill);
    }
  }

  if (action === "toggle-free") {
    const skill = el.dataset.skill;
    const hasUrbana = state.cultureTrait1 === "urbana" || state.cultureTrait2 === "urbana";
    const cost = mestiereCost(skill, state.ceto, hasUrbana) ?? 99;
    if (state.skills.free.includes(skill)) {
      state.skills.free = state.skills.free.filter((s) => s !== skill);
    } else if (freePicksUsed() + cost <= freePicksTotal()) {
      state.skills.free.push(skill);
    }
  }

  if (action === "val-inc") {
    const key = el.dataset.valore;
    const allowed = getCultureAllowedValori(state.cultureTrait1, state.cultureTrait2);
    if (allowed.has(key) && totalValoriPoints() < 3) state.valori[key] = clamp(state.valori[key] + 1, 0, 3);
  }
  if (action === "val-dec") {
    const key = el.dataset.valore;
    state.valori[key] = clamp(state.valori[key] - 1, 0, 3);
  }

  if (action === "toggle-event") {
    const eventType = el.dataset.eventId;
    const idx = state.retaggio.events.findIndex((x) => x.type === eventType);
    if (idx >= 0) {
      state.retaggio.events.splice(idx, 1);
      if (eventType === "esperienza") {
        state.retaggio.espGrade3 = [""];
        state.retaggio.espGrade2 = ["", ""];
      }
    } else if (state.retaggio.events.length < retaggioAvailable()) {
      state.retaggio.events.push({ type: eventType, note: "", picks: [], mode: null, valoreKey: "" });
    }
    recomputeRolledWealth();
  }

  if (action === "toggle-event-pick") {
    const eventType = el.dataset.eventType;
    const skillId = el.dataset.skill;
    const ev = state.retaggio.events.find((x) => x.type === eventType);
    if (ev) {
      const cfg = eventConfig(ev);
      if (ev.picks.includes(skillId)) {
        ev.picks = ev.picks.filter((s) => s !== skillId);
      } else if (cfg?.pickFrom?.includes(skillId) && ev.picks.length < cfg.pickCount) {
        ev.picks.push(skillId);
      }
    }
  }

  if (action === "roll-wealth") {
    rollInitialWealth();
  }

  if (action === "buy-item") {
    const id = el.dataset.id;
    const found = state.equipment.cart.find((x) => x.id === id);
    if (found) found.qty += 1;
    else state.equipment.cart.push({ id, qty: 1 });
  }

  if (action === "remove-item") {
    const id = el.dataset.id;
    const found = state.equipment.cart.find((x) => x.id === id);
    if (!found) return;
    found.qty -= 1;
    if (found.qty <= 0) state.equipment.cart = state.equipment.cart.filter((x) => x.id !== id);
  }

  if (action === "import-json") {
    const input = document.getElementById("app").querySelector("[data-import-file]");
    if (input) input.click();
  }

  if (action === "pe-skill-inc") {
    const skillId = el.dataset.skill;
    const prog = progressionSummary();
    const nextCost = prog.skills?.[skillId]?.nextGradeCost;
    if (nextCost == null || nextCost > prog.peAvailable) {
      render();
      return;
    }
    const current = Number(state.progression.currentSkillGrades[skillId] ?? 0);
    state.progression.currentSkillGrades[skillId] = Math.min(6, current + 1);
  }

  if (action === "pe-skill-dec") {
    const skillId = el.dataset.skill;
    const base = Number(state.progression.baseSkillGrades[skillId] ?? 0);
    const current = Number(state.progression.currentSkillGrades[skillId] ?? base);
    state.progression.currentSkillGrades[skillId] = Math.max(base, current - 1);
  }

  if (action === "export-json") {
    exportFoundryJSON(state);
  }

  if (action === "export-pdf") {
    try {
      await exportCharacterPDF(state);
    } catch (err) {
      alert(`Errore export PDF: ${err.message}`);
    }
  }

  if (action === "reset") {
    const fresh = defaultState();
    Object.keys(state).forEach((k) => delete state[k]);
    Object.assign(state, fresh);
  }

  if (state.step === 8 && !state.equipment.wealthRolled) {
    rollInitialWealth();
  }

  render();
}

export function onChange(event) {
  const action = event.currentTarget.dataset.change;
  const value = event.currentTarget.value;

  if (action === "set-trait-1") {
    state.cultureTrait1 = value;
    if (state.cultureTrait1 === state.cultureTrait2) state.cultureTrait2 = "";
    state.trait1Skill = "";
    if (!(state.cultureTrait1 === "cortese" || state.cultureTrait2 === "cortese")) state.corteseAdvSkill = "";
    recomputeRolledWealth();
  }
  if (action === "set-trait-2") {
    state.cultureTrait2 = value;
    if (state.cultureTrait2 === state.cultureTrait1) state.cultureTrait1 = "";
    state.trait2Skill = "";
    if (!(state.cultureTrait1 === "cortese" || state.cultureTrait2 === "cortese")) state.corteseAdvSkill = "";
    recomputeRolledWealth();
  }
  if (action === "set-trait-1-skill") state.trait1Skill = value;
  if (action === "set-trait-2-skill") state.trait2Skill = value;
  if (action === "set-cortese-adv-skill") state.corteseAdvSkill = value;
  if (action === "set-tentazione") {
    state.retaggio.tentazione = value;
    if (state.retaggio.events.length > retaggioAvailable()) {
      state.retaggio.events = state.retaggio.events.slice(0, retaggioAvailable());
    }
    recomputeRolledWealth();
  }
  if (action === "set-name") state.name = value;
  if (action === "set-grade3") {
    const slot = Number(event.currentTarget.dataset.slot);
    state.skills.grade3[slot] = value;
  }
  if (action === "set-grade2") {
    const slot = Number(event.currentTarget.dataset.slot);
    state.skills.grade2[slot] = value;
  }
  if (action === "set-event-note") {
    const ev = state.retaggio.events.find((x) => x.type === event.currentTarget.dataset.eventType);
    if (ev) ev.note = value;
  }
  if (action === "set-event-mode") {
    const ev = state.retaggio.events.find((x) => x.type === event.currentTarget.dataset.eventType);
    if (ev) {
      ev.mode = value || null;
      ev.picks = [];
    }
  }
  if (action === "set-event-valore") {
    const ev = state.retaggio.events.find((x) => x.type === event.currentTarget.dataset.eventType);
    if (ev) ev.valoreKey = value;
  }
  if (action === "set-esp-g3") {
    const slot = Number(event.currentTarget.dataset.slot);
    state.retaggio.espGrade3[slot] = value;
  }
  if (action === "set-esp-g2") {
    const slot = Number(event.currentTarget.dataset.slot);
    state.retaggio.espGrade2[slot] = value;
  }
  if (action === "set-pe-total") {
    state.progression.peTotal = Math.max(0, Number(value || 0));
  }

  render();
}

export async function onImportFile(event) {
  const file = event.currentTarget.files?.[0];
  if (!file) return;
  try {
    const raw = await file.text();
    const parsed = JSON.parse(raw);
    const actor = parsed?.system ? parsed : parsed?.actor ?? null;
    if (!actor?.system) throw new Error("Formato JSON non riconosciuto");

    state.name = actor.name || state.name;
    state.ceto = actor.system.ceto || state.ceto;

    for (const key of CHAR_KEYS) {
      const v = Number(actor.system.characteristics?.[key]);
      if (!Number.isNaN(v)) state.chars[key] = v;
    }

    state.cultureTrait1 = actor.system.culture?.trait1 || "";
    state.cultureTrait2 = actor.system.culture?.trait2 || "";
    state.trait1Skill = "";
    state.trait2Skill = "";
    state.corteseAdvSkill = "";

    for (const k of VALORI) {
      const v = Number(actor.system.valori?.[k]);
      if (!Number.isNaN(v)) state.valori[k] = v;
    }

    state.retaggio.tentazione = actor.system.tentazione || "";
    state.retaggio.events = [];
    state.retaggio.espGrade3 = [""];
    state.retaggio.espGrade2 = ["", ""];

    const importedBase = {};
    const importedCurrent = {};
    for (const id of allSkillIds()) {
      const data = actor.system.skills?.[id] || {};
      const base = Number(data.baseGrade ?? data.grade ?? 0);
      const current = Number(data.grade ?? base);
      importedBase[id] = Math.max(0, Math.min(6, Number.isNaN(base) ? 0 : base));
      importedCurrent[id] = Math.max(importedBase[id], Math.min(6, Number.isNaN(current) ? importedBase[id] : current));
    }

    state.skills.mestiere = allSkillIds().filter((id) => actor.system.skills?.[id]?.isMestiere);
    state.skills.free = [];
    state.skills.grade3 = ["", ""];
    state.skills.grade2 = Array(8).fill("");

    state.progression.source = "import";
    state.progression.baseSkillGrades = importedBase;
    state.progression.currentSkillGrades = importedCurrent;
    state.progression.peTotal = Number(actor.system.pe?.total ?? 0) || 0;

    state.equipment.cart = [];
    const money = actor.system.money || {};
    const wealth = (Number(money.lire || 0) * 240) + (Number(money.soldi || 0) * 12) + Number(money.denari || 0);
    state.equipment.wealth = Math.max(0, wealth);
    state.equipment.wealthBase = state.equipment.wealth;
    state.equipment.wealthRolled = state.equipment.wealth > 0;

    state.step = 9;
  } catch (err) {
    alert(`Import JSON fallito: ${err.message}`);
  } finally {
    event.currentTarget.value = "";
    render();
  }
}
