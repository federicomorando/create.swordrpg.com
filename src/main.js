import { CULTURE_DEFS, CULTURE_IDS, getCultureAllowedValori } from "./lib/cultures.mjs";
import { WEAPONS, SHIELDS, ARMOR, GEAR, denariToDisplay } from "./lib/equipment.mjs";
import { allSkillIds, BASE_SKILLS, CETO_COST, mestiereCost } from "./lib/actor-core.mjs";
import { computeCreationSkillState, computeProgressionSummary } from "./lib/progression.mjs";
import { exportFoundryJSON, exportCharacterPDF } from "./export/exporters.mjs";
import {
  STEP_LABELS,
  CETO_LABELS,
  CHAR_LABELS,
  SKILL_LABELS,
  VALORE_LABELS,
  TENTAZIONI
} from "./data/labels-it.mjs";

const STORAGE_KEY = "swordrpg-character-v1";
const CHAR_KEYS = ["fortitudo", "celeritas", "gratia", "mens", "prudentia", "audacia"];
const VALORI = ["fides", "impietas", "honor", "ego", "superstitio", "ratio"];

const STARTING_WEALTH = {
  umile: { dice: 4, multiplier: 1, inDenari: 12 },
  popolano: { dice: 2, multiplier: 1, inDenari: 240 },
  borghese: { dice: 2, multiplier: 5, inDenari: 240 },
  nobile: { dice: 4, multiplier: 10, inDenari: 240 }
};

const EVENT_DEFS = {
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

const app = document.getElementById("app");

const state = normalizeState(loadState() ?? defaultState());
render();

function defaultState() {
  return {
    step: 1,
    name: "Avventuriero",
    ceto: "umile",
    chars: Object.fromEntries(CHAR_KEYS.map((k) => [k, 7])),
    cultureTrait1: "",
    cultureTrait2: "",
    trait1Skill: "",
    trait2Skill: "",
    corteseAdvSkill: "",
    skills: {
      mestiere: [],
      free: [],
      grade3: ["", ""],
      grade2: Array(8).fill("")
    },
    valori: Object.fromEntries(VALORI.map((k) => [k, 0])),
    retaggio: {
      tentazione: "",
      events: [],
      espGrade3: [""],
      espGrade2: ["", ""]
    },
    equipment: {
      wealth: 0,
      wealthBase: 0,
      wealthRolled: false,
      cart: []
    },
    progression: {
      source: "creation",
      peTotal: 0,
      baseSkillGrades: {},
      currentSkillGrades: {}
    }
  };
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function normalizeState(rawState) {
  const s = rawState ?? defaultState();
  if (!s.name) s.name = "Avventuriero";
  if (typeof s.corteseAdvSkill !== "string") s.corteseAdvSkill = "";
  if (!s.retaggio) s.retaggio = { tentazione: "", events: [] };
  if (!Array.isArray(s.retaggio.events)) s.retaggio.events = [];
  if (!Array.isArray(s.retaggio.espGrade3)) s.retaggio.espGrade3 = [""];
  if (!Array.isArray(s.retaggio.espGrade2)) s.retaggio.espGrade2 = ["", ""];
  if (s.retaggio.espGrade3.length < 1) s.retaggio.espGrade3 = [""];
  if (s.retaggio.espGrade2.length < 2) s.retaggio.espGrade2 = ["", ""];

  if (!s.equipment) s.equipment = { wealth: 0, wealthBase: 0, wealthRolled: false, cart: [] };
  if (!Array.isArray(s.equipment.cart)) s.equipment.cart = [];
  if (typeof s.equipment.wealthBase !== "number") s.equipment.wealthBase = 0;
  if (typeof s.equipment.wealthRolled !== "boolean") s.equipment.wealthRolled = false;

  if (!s.progression) {
    s.progression = { source: "creation", peTotal: 0, baseSkillGrades: {}, currentSkillGrades: {} };
  }
  if (!s.progression.source) s.progression.source = "creation";
  if (typeof s.progression.peTotal !== "number") s.progression.peTotal = 0;
  if (!s.progression.baseSkillGrades || typeof s.progression.baseSkillGrades !== "object") s.progression.baseSkillGrades = {};
  if (!s.progression.currentSkillGrades || typeof s.progression.currentSkillGrades !== "object") s.progression.currentSkillGrades = {};

  s.retaggio.events = s.retaggio.events
    .map((ev) => {
      if (typeof ev === "string") {
        const type = Object.keys(EVENT_DEFS).find((id) => EVENT_DEFS[id].label === ev) ?? null;
        return type ? { type, note: "", picks: [], mode: "single", valoreKey: "" } : null;
      }
      if (!ev?.type || !EVENT_DEFS[ev.type]) return null;
      return {
        type: ev.type,
        note: ev.note ?? "",
        picks: Array.isArray(ev.picks) ? ev.picks : [],
        mode: ev.mode ?? null,
        valoreKey: ev.valoreKey ?? ""
      };
    })
    .filter(Boolean);

  return s;
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function escapeHTML(str) {
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;")
    .replaceAll("'", "&#039;");
}

function charPointsUsed() {
  return Object.values(state.chars).reduce((a, b) => a + b, 0);
}

function modifier(score) {
  const d = score - 7;
  return d > 0 ? Math.ceil(d / 2) : Math.floor(d / 2);
}

function hasCultureTrait(id) {
  return state.cultureTrait1 === id || state.cultureTrait2 === id;
}

function hasEventType(id) {
  return state.retaggio.events.some((ev) => ev.type === id);
}

function knownSkillIds() {
  const set = new Set(BASE_SKILLS);
  for (const id of state.skills.mestiere) set.add(id);
  for (const id of state.skills.free) set.add(id);
  return Array.from(set);
}

function freePicksTotal() {
  return state.chars.mens;
}

function freePicksUsed() {
  const hasUrbana = hasCultureTrait("urbana");
  return state.skills.free.reduce((sum, id) => sum + (mestiereCost(id, state.ceto, hasUrbana) ?? 0), 0);
}

function currentWealthMultiplier() {
  let mult = 1;
  if (hasCultureTrait("laboriosa")) mult *= 2;
  if (hasEventType("nomea")) mult *= 2;
  return mult;
}

function recomputeRolledWealth() {
  if (!state.equipment.wealthRolled) return;
  state.equipment.wealth = state.equipment.wealthBase * currentWealthMultiplier();
}

function syncRetaggioState() {
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

function derived() {
  let spirito = state.chars.audacia + 1;
  if (hasCultureTrait("antica")) spirito += 1;
  if (hasCultureTrait("spirituale")) spirito += 4;
  if (hasEventType("percorso_spirituale")) spirito += 3;

  let riflessi = modifier(state.chars.celeritas) + 3;
  if (hasEventType("istinto")) riflessi += 1;

  return {
    riflessi,
    spirito,
    fatica: state.chars.fortitudo + 2,
    ferite: state.chars.fortitudo + 2,
    fama: CETO_COST[state.ceto] + (hasEventType("nomea") ? 1 : 0)
  };
}

function retaggioTotal() {
  let total = 3 + modifier(state.chars.gratia) + (state.retaggio.tentazione ? 1 : 0);
  if (hasCultureTrait("intraprendente")) total += 1;
  return Math.max(0, total);
}

function retaggioAvailable() {
  return Math.max(0, retaggioTotal() - CETO_COST[state.ceto]);
}

function totalValoriPoints() {
  return Object.values(state.valori).reduce((a, b) => a + b, 0);
}

function buyableItems() {
  const weapons = WEAPONS.slice(0, 12).map((w) => ({
    id: `weapon:${w.weaponId}`,
    label: w.label,
    cost: w.costDenari
  }));
  const shields = SHIELDS.map((s) => ({ id: `shield:${s.shieldId}`, label: s.label, cost: s.costDenari }));
  const armor = ARMOR.map((a) => ({ id: `armor:${a.armorId}`, label: a.label, cost: a.costDenari }));
  const gear = GEAR.slice(0, 12).map((g) => ({ id: `gear:${g.gearId}`, label: g.label, cost: g.costDenari }));
  return [...weapons, ...shields, ...armor, ...gear];
}

function cartTotal() {
  const items = buyableItems();
  return state.equipment.cart.reduce((sum, entry) => {
    const item = items.find((x) => x.id === entry.id);
    return sum + (item ? item.cost * entry.qty : 0);
  }, 0);
}

function eventConfig(ev) {
  const base = EVENT_DEFS[ev.type];
  if (!base) return null;
  if (!base.modes) return base;
  if (!ev.mode || !base.modes[ev.mode]) return { ...base, pickFrom: null, pickCount: 0 };
  const modeCfg = base.modes[ev.mode];
  return { ...base, ...modeCfg };
}

function percorsoValoreOptions() {
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

function eventComplete(ev) {
  const base = EVENT_DEFS[ev.type];
  if (base?.modes && !ev.mode) return false;
  const cfg = eventConfig(ev);
  if (!cfg) return false;
  if (cfg.pickFrom && ev.picks.length !== cfg.pickCount) return false;
  if (cfg.valorePickRequired && !ev.valoreKey) return false;
  return true;
}

function stepValidation(step = state.step) {
  const allowed = getCultureAllowedValori(state.cultureTrait1, state.cultureTrait2);
  const hasUrbana = state.cultureTrait1 === "urbana" || state.cultureTrait2 === "urbana";
  const mestiereCostUsed = state.skills.mestiere.reduce(
    (sum, id) => sum + (mestiereCost(id, state.ceto, hasUrbana) ?? 0),
    0
  );
  const freeUsed = freePicksUsed();
  const eventiTarget = retaggioAvailable();
  const hasEsperienza = state.retaggio.events.some((ev) => ev.type === "esperienza");
  const espSlotsOk =
    !hasEsperienza ||
    (state.retaggio.espGrade3.every((x) => x) && state.retaggio.espGrade2.every((x) => x));
  const eventiOk = state.retaggio.events.length <= eventiTarget && state.retaggio.events.every(eventComplete) && espSlotsOk;

  const checks = {
    1: { ok: true, msg: "" },
    2: { ok: charPointsUsed() === 54, msg: "Servono esattamente 54 punti caratteristiche." },
    3: {
      ok:
        Boolean(state.cultureTrait1 && state.cultureTrait2 && state.trait1Skill && state.trait2Skill) &&
        (!(state.cultureTrait1 === "cortese" || state.cultureTrait2 === "cortese") || Boolean(state.corteseAdvSkill)),
      msg: "Seleziona due tratti cultura e un dado extra per ciascuno. Se hai Cortese, scegli anche il dado bonus Cortese."
    },
    4: { ok: true, msg: "" },
    5: {
      ok:
        mestiereCostUsed === 6 &&
        freeUsed === freePicksTotal() &&
        state.skills.grade3.filter(Boolean).length === 2 &&
        state.skills.grade2.filter(Boolean).length === 8,
      msg: "Abilita: 6 punti mestiere, punti liberi = Mens, 2 slot grado 3 e 8 slot grado 2."
    },
    6: {
      ok:
        totalValoriPoints() === 3 &&
        Object.entries(state.valori).every(([k, v]) => v === 0 || allowed.has(k)),
      msg: "Valori: assegna esattamente 3 punti su assi consentiti."
    },
    7: {
      ok: eventiOk,
      msg: "Retaggio: completa gli eventi selezionati (mode/pick/valore) e non superare i punti disponibili."
    },
    8: {
      ok: state.equipment.wealth > 0 && cartTotal() <= state.equipment.wealth,
      msg: "Equipaggiamento: tira la ricchezza e resta entro il budget."
    },
    9: { ok: true, msg: "" }
  };
  return checks[step];
}

function syncSkillTrainingState() {
  const known = new Set(knownSkillIds());
  const freeRaised = new Set(
    state.skills.free.filter((id) => BASE_SKILLS.includes(id) || state.skills.mestiere.includes(id))
  );

  state.skills.grade3 = state.skills.grade3.map((id) => (known.has(id) ? id : ""));
  state.skills.grade2 = state.skills.grade2.map((id) => (known.has(id) && !freeRaised.has(id) ? id : ""));
}

function buildTrainingOptions() {
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

function ensureProgressionState() {
  if (!state.progression) {
    state.progression = { source: "creation", peTotal: 0, baseSkillGrades: {}, currentSkillGrades: {} };
  }

  const skillIds = allSkillIds();
  if (state.progression.source !== "import") {
    const baseMap = creationBaseGradeMap();
    state.progression.baseSkillGrades = baseMap;
    for (const id of skillIds) {
      const minGrade = baseMap[id] ?? 0;
      const current = Number(state.progression.currentSkillGrades[id] ?? minGrade);
      state.progression.currentSkillGrades[id] = Math.max(minGrade, Math.min(6, current));
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

function progressionSummary() {
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

function render() {
  syncSkillTrainingState();
  syncRetaggioState();
  ensureProgressionState();
  const allowedValori = getCultureAllowedValori(state.cultureTrait1, state.cultureTrait2);
  const allSkills = allSkillIds();
  const validation = stepValidation(state.step);
  app.innerHTML = `
    <main class="layout">
      <header class="header">
        <div class="header-top">
          <div>
            <h1>Il Tempo della Spada - Character Lab</h1>
            <p>Frontend-only wizard (GitHub Pages). Auto-save in localStorage.</p>
          </div>
          <div class="header-actions">
            <button data-action="export-json">Export JSON (Foundry)</button>
            <button data-action="export-pdf">Export PDF</button>
            <button data-action="import-json">Import JSON</button>
            <button data-action="reset">Nuovo personaggio</button>
            <input type="file" accept=\"application/json,.json\" data-import-file style=\"display:none\" />
          </div>
        </div>
        <div class="name-row">
          <label>Nome personaggio</label>
          <input value="${escapeHTML(state.name)}" data-change="set-name" />
        </div>
      </header>

      <section class="steps">
        ${STEP_LABELS.map((label, i) => `<button class="step ${state.step === i + 1 ? "active" : ""}" data-action="goto-step" data-step="${i + 1}">${label}</button>`).join("")}
      </section>

      <section class="panel">
        ${renderStepContent(allowedValori, allSkills)}
      </section>

      <footer class="footer">
        <button data-action="prev-step" ${state.step === 1 ? "disabled" : ""}>Indietro</button>
        <button data-action="next-step" ${state.step === 9 || !validation.ok ? "disabled" : ""}>Avanti</button>
        ${validation.ok ? "" : `<span class="warn">${validation.msg}</span>`}
      </footer>
    </main>
  `;

  app.querySelectorAll("[data-action]").forEach((el) => el.addEventListener("click", onAction));
  app.querySelectorAll("[data-change]").forEach((el) => el.addEventListener("change", onChange));
  app.querySelectorAll("[data-import-file]").forEach((el) => el.addEventListener("change", onImportFile));
  saveState();
}

function renderStepContent(allowedValori, allSkills) {
  if (state.step === 1) {
    return `
      <h2>Ceto</h2>
      <div class="cards">
        ${Object.entries(CETO_LABELS)
          .map(
            ([id, label]) => `
          <button class="card ${state.ceto === id ? "selected" : ""}" data-action="set-ceto" data-ceto="${id}">
            <strong>${label}</strong>
            <span>Costo retaggio/fama: ${CETO_COST[id]}</span>
          </button>
        `
          )
          .join("")}
      </div>
    `;
  }

  if (state.step === 2) {
    return `
      <h2>Caratteristiche</h2>
      <p>Punti usati: <strong>${charPointsUsed()}</strong> / 54</p>
      <div class="grid2">
        ${CHAR_KEYS.map(
          (key) => `
          <div class="row">
            <span>${CHAR_LABELS[key]}</span>
            <div class="spin">
              <button data-action="char-dec" data-char="${key}">-</button>
              <strong>${state.chars[key]}</strong>
              <button data-action="char-inc" data-char="${key}">+</button>
              <em>mod ${modifier(state.chars[key]) >= 0 ? "+" : ""}${modifier(state.chars[key])}</em>
            </div>
          </div>
        `
        ).join("")}
      </div>
    `;
  }

  if (state.step === 3) {
    const cultureOption = (selected, other) =>
      [
        `<option value="" ${selected ? "" : "selected"}>-</option>`,
        ...CULTURE_IDS.map(
          (id) =>
            `<option value="${id}" ${selected === id ? "selected" : ""} ${other === id ? "disabled" : ""}>${id}</option>`
        )
      ].join("");

    const trait1Skills = state.cultureTrait1 && CULTURE_DEFS[state.cultureTrait1].skillChoices
      ? CULTURE_DEFS[state.cultureTrait1].skillChoices
      : allSkills;
    const trait2Skills = state.cultureTrait2 && CULTURE_DEFS[state.cultureTrait2].skillChoices
      ? CULTURE_DEFS[state.cultureTrait2].skillChoices
      : allSkills;
    const hasCortese = state.cultureTrait1 === "cortese" || state.cultureTrait2 === "cortese";
    const corteseOptions = CULTURE_DEFS.cortese?.advantagePickFrom ?? [];

    return `
      <h2>Cultura</h2>
      <div class="grid2">
        <label>Tratto 1
          <select data-change="set-trait-1">${cultureOption(state.cultureTrait1, state.cultureTrait2)}</select>
        </label>
        <label>Dado extra tratto 1
          <select data-change="set-trait-1-skill">
            <option value="">-</option>
            ${trait1Skills.map((s) => `<option value="${s}" ${state.trait1Skill === s ? "selected" : ""}>${SKILL_LABELS[s] ?? s}</option>`).join("")}
          </select>
        </label>

        <label>Tratto 2
          <select data-change="set-trait-2">${cultureOption(state.cultureTrait2, state.cultureTrait1)}</select>
        </label>
        <label>Dado extra tratto 2
          <select data-change="set-trait-2-skill">
            <option value="">-</option>
            ${trait2Skills.map((s) => `<option value="${s}" ${state.trait2Skill === s ? "selected" : ""}>${SKILL_LABELS[s] ?? s}</option>`).join("")}
          </select>
        </label>
      </div>
      ${
        hasCortese
          ? `
          <label>Dado bonus Cortese
            <select data-change="set-cortese-adv-skill">
              <option value="">-</option>
              ${corteseOptions
                .map((s) => `<option value="${s}" ${state.corteseAdvSkill === s ? "selected" : ""}>${SKILL_LABELS[s] ?? s}</option>`)
                .join("")}
            </select>
          </label>
        `
          : ""
      }
      <p>Valori consentiti: ${Array.from(allowedValori).map((k) => VALORE_LABELS[k]).join(", ")}</p>
    `;
  }

  if (state.step === 4) {
    const d = derived();
    return `
      <h2>Statistiche derivate</h2>
      <ul class="list">
        <li>Riflessi: <strong>${d.riflessi}</strong></li>
        <li>Spirito: <strong>${d.spirito}</strong></li>
        <li>Fatica: <strong>${d.fatica}</strong></li>
        <li>Ferite: <strong>${d.ferite}</strong></li>
        <li>Fama iniziale: <strong>${d.fama}</strong></li>
      </ul>
    `;
  }

  if (state.step === 5) {
    const hasUrbana = state.cultureTrait1 === "urbana" || state.cultureTrait2 === "urbana";
    const mestiereOptions = allSkills
      .map((id) => ({ id, cost: mestiereCost(id, state.ceto, hasUrbana) }))
      .filter((x) => x.cost !== null)
      .sort((a, b) => a.cost - b.cost || a.id.localeCompare(b.id));

    const usedCost = state.skills.mestiere.reduce((sum, id) => sum + (mestiereOptions.find((x) => x.id === id)?.cost ?? 0), 0);
    const usedFree = freePicksUsed();
    const freeTotal = freePicksTotal();
    const freeOptions = mestiereOptions;
    const { grade3Slots, grade2Slots } = buildTrainingOptions();

    return `
      <h2>Abilita</h2>
      <p>Mestiere: ${usedCost}/6 punti</p>
      <div class="chips">
        ${mestiereOptions
          .map((m) => `<button class="chip ${state.skills.mestiere.includes(m.id) ? "selected" : ""}" data-action="toggle-mestiere" data-skill="${m.id}">${SKILL_LABELS[m.id] ?? m.id} (${m.cost})</button>`)
          .join("")}
      </div>
      <p>Abilita libere (costo variabile): ${usedFree}/${freeTotal}</p>
      <div class="chips">
        ${freeOptions
          .map((opt) => `<button class="chip ${state.skills.free.includes(opt.id) ? "selected" : ""}" data-action="toggle-free" data-skill="${opt.id}">${SKILL_LABELS[opt.id] ?? opt.id} (${opt.cost})</button>`)
          .join("")}
      </div>
      <div class="cards">
        <div class="card">
          <strong>Addestramento - Grado 3 (2)</strong>
          ${grade3Slots
            .map(
              (slot) => `
              <label>Slot ${slot.index + 1}
                <select data-change="set-grade3" data-slot="${slot.index}">
                  <option value="">-</option>
                  ${slot.options
                    .map((opt) => `<option value="${opt.id}" ${slot.selected === opt.id ? "selected" : ""}>${opt.label}</option>`)
                    .join("")}
                </select>
              </label>
            `
            )
            .join("")}
        </div>
        <div class="card">
          <strong>Addestramento - Grado 2 (8)</strong>
          ${grade2Slots
            .map(
              (slot) => `
              <label>Slot ${slot.index + 1}
                <select data-change="set-grade2" data-slot="${slot.index}">
                  <option value="">-</option>
                  ${slot.options
                    .map((opt) => `<option value="${opt.id}" ${slot.selected === opt.id ? "selected" : ""}>${opt.label}</option>`)
                    .join("")}
                </select>
              </label>
            `
            )
            .join("")}
        </div>
      </div>
    `;
  }

  if (state.step === 6) {
    return `
      <h2>Valori</h2>
      <p>Punti assegnati: ${totalValoriPoints()}/3</p>
      <div class="grid2">
        ${VALORI.map(
          (v) => `
          <div class="row">
            <span>${VALORE_LABELS[v]}</span>
            <div class="spin">
              <button data-action="val-dec" data-valore="${v}" ${state.valori[v] <= 0 ? "disabled" : ""}>-</button>
              <strong>${state.valori[v]}</strong>
              <button data-action="val-inc" data-valore="${v}" ${state.valori[v] >= 3 || totalValoriPoints() >= 3 || !allowedValori.has(v) ? "disabled" : ""}>+</button>
            </div>
          </div>
        `
        ).join("")}
      </div>
      <p class="note">I valori disabilitati non sono previsti dai tratti culturali scelti.</p>
    `;
  }

  if (state.step === 7) {
    const selected = new Map(state.retaggio.events.map((ev) => [ev.type, ev]));
    const hasEsperienza = state.retaggio.events.some((ev) => ev.type === "esperienza");
    const knownSkills = knownSkillIds().sort((a, b) => (SKILL_LABELS[a] ?? a).localeCompare(SKILL_LABELS[b] ?? b));
    const espG3 = state.retaggio.espGrade3 ?? [""];
    const espG2 = state.retaggio.espGrade2 ?? ["", ""];
    const percorsoOpts = percorsoValoreOptions();
    return `
      <h2>Retaggio</h2>
      <p>Punti disponibili: ${retaggioAvailable()} | Eventi scelti: ${state.retaggio.events.length}</p>
      <label>Tentazione
        <select data-change="set-tentazione">
          <option value="">Nessuna</option>
          ${TENTAZIONI.map((t) => `<option value="${t}" ${state.retaggio.tentazione === t ? "selected" : ""}>${t}</option>`).join("")}
        </select>
      </label>
      <div class="chips">
        ${Object.entries(EVENT_DEFS)
          .map(([id, def]) => `<button class="chip ${selected.has(id) ? "selected" : ""}" data-action="toggle-event" data-event-id="${id}">${def.label}</button>`)
          .join("")}
      </div>
      <div class="cards">
        ${state.retaggio.events
          .map((ev) => {
            const cfg = eventConfig(ev);
            const complete = eventComplete(ev);
            if (!cfg) return "";
            const pickOptions = cfg.pickFrom ?? [];
            const modeBlock = EVENT_DEFS[ev.type].modes
              ? `
                <label>Modalita
                  <select data-change="set-event-mode" data-event-type="${ev.type}">
                    <option value="">-</option>
                    ${Object.entries(EVENT_DEFS[ev.type].modes)
                      .map(([modeId, modeCfg]) => `<option value="${modeId}" ${ev.mode === modeId ? "selected" : ""}>${modeCfg.label}</option>`)
                      .join("")}
                  </select>
                </label>
              `
              : "";

            return `
              <div class="card ${complete ? "" : "incomplete"}">
                <strong>${EVENT_DEFS[ev.type].label}</strong>
                <p class="note">Effetto: ${cfg.effect ?? "narrativo"}</p>
                ${modeBlock}
                <label>Nota
                  <input data-change="set-event-note" data-event-type="${ev.type}" value="${escapeHTML(ev.note ?? "")}" />
                </label>
                ${
                  pickOptions.length
                    ? `
                    <p>Scelte ${ev.picks.length}/${cfg.pickCount}</p>
                    <div class="chips">
                      ${pickOptions
                        .map((skillId) => `<button class="chip ${ev.picks.includes(skillId) ? "selected" : ""}" data-action="toggle-event-pick" data-event-type="${ev.type}" data-skill="${skillId}">${SKILL_LABELS[skillId] ?? skillId}</button>`)
                        .join("")}
                    </div>
                  `
                    : ""
                }
                ${
                  cfg.valorePickRequired
                    ? `
                    <label>Valore del percorso spirituale
                      <select data-change="set-event-valore" data-event-type="${ev.type}">
                        <option value="">-</option>
                        ${percorsoOpts
                          .map((v) => `<option value="${v}" ${ev.valoreKey === v ? "selected" : ""}>${VALORE_LABELS[v]}</option>`)
                          .join("")}
                      </select>
                    </label>
                  `
                    : ""
                }
              </div>
            `;
          })
          .join("")}
      </div>
      ${
        hasEsperienza
          ? `
          <div class="card">
            <strong>Esperienza - Addestramenti extra</strong>
            <label>Grado 3 (1 abilita)
              <select data-change="set-esp-g3" data-slot="0">
                <option value="">-</option>
                ${knownSkills.map((id) => `<option value="${id}" ${espG3[0] === id ? "selected" : ""}>${SKILL_LABELS[id] ?? id}</option>`).join("")}
              </select>
            </label>
            ${[0, 1]
              .map(
                (slot) => `
                <label>Grado 2 (${slot + 1}/2)
                  <select data-change="set-esp-g2" data-slot="${slot}">
                    <option value="">-</option>
                    ${knownSkills.map((id) => `<option value="${id}" ${espG2[slot] === id ? "selected" : ""}>${SKILL_LABELS[id] ?? id}</option>`).join("")}
                  </select>
                </label>
              `
              )
              .join("")}
          </div>
        `
          : ""
      }
    `;
  }

  if (state.step === 8) {
    const items = buyableItems();
    const remaining = state.equipment.wealth - cartTotal();
    return `
      <h2>Equipaggiamento</h2>
      <p>Ricchezza: <strong>${denariToDisplay(state.equipment.wealth)}</strong> (${state.equipment.wealth}d)</p>
      <button data-action="roll-wealth">Tira ricchezza iniziale</button>
      <div class="catalog">
        ${items
          .map((it) => `<button class="row buy" data-action="buy-item" data-id="${it.id}" ${remaining < it.cost ? "disabled" : ""}><span>${it.label}</span><span>${denariToDisplay(it.cost)}</span></button>`)
          .join("")}
      </div>
      <h3>Carrello</h3>
      <div class="list">
        ${state.equipment.cart
          .map((c) => {
            const item = items.find((x) => x.id === c.id);
            if (!item) return "";
            return `<button class="row" data-action="remove-item" data-id="${c.id}"><span>${item.label} x${c.qty}</span><span>${denariToDisplay(item.cost * c.qty)}</span></button>`;
          })
          .join("")}
      </div>
      <p>Totale: ${denariToDisplay(cartTotal())} | Rimanente: ${denariToDisplay(remaining)}</p>
    `;
  }

  const prog = progressionSummary();
  const skills = Object.values(prog.skills).sort((a, b) => (SKILL_LABELS[a.id] ?? a.id).localeCompare(SKILL_LABELS[b.id] ?? b.id));
  const unlockedTalents = Object.values(prog.talents).filter((t) => t.unlocked);
  const partialTalents = Object.values(prog.talents).filter((t) => t.partial && !t.unlocked);
  return `
    <h2>Progressione (PE e Talenti)</h2>
    <div class="cards">
      <div class="card">
        <label>PE Totali
          <input type="number" min="0" data-change="set-pe-total" value="${prog.peTotal}" />
        </label>
        <p>PE Spesi: <strong>${prog.peSpent}</strong></p>
        <p>PE Disponibili: <strong>${prog.peAvailable}</strong></p>
      </div>
      <div class="card">
        <p>Talenti sbloccati: <strong>${prog.talentCount}</strong></p>
        <p>Talenti parziali: <strong>${partialTalents.length}</strong></p>
      </div>
    </div>
    <h3>Abilita e Costi PE</h3>
    <div class="list">
      ${skills
        .map(
          (s) => `
          <div class="row">
            <span>${SKILL_LABELS[s.id] ?? s.id} (base ${s.baseGrade})</span>
            <div class="spin">
              <button data-action="pe-skill-dec" data-skill="${s.id}" ${s.grade <= s.baseGrade ? "disabled" : ""}>-</button>
              <strong>${s.grade}</strong>
              <button data-action="pe-skill-inc" data-skill="${s.id}" ${s.grade >= 6 || (s.nextGradeCost != null && s.nextGradeCost > prog.peAvailable) ? "disabled" : ""}>+</button>
              <em>${s.nextGradeCost == null ? "max" : `prossimo: ${s.nextGradeCost} PE`}</em>
            </div>
          </div>
        `
        )
        .join("")}
    </div>
    <h3>Talenti Sbloccati</h3>
    <div class="chips">
      ${unlockedTalents
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((t) => `<span class="chip selected">${t.name}</span>`)
        .join("")}
    </div>
  `;
}

function canGoToStep(targetStep) {
  if (state.progression?.source === "import") return true;
  for (let s = 1; s < targetStep; s += 1) {
    if (!stepValidation(s).ok) return false;
  }
  return true;
}

async function onAction(event) {
  const { action } = event.currentTarget.dataset;

  if (action === "goto-step") {
    const next = clamp(Number(event.currentTarget.dataset.step), 1, 9);
    if (canGoToStep(next)) state.step = next;
  }
  if (action === "prev-step") state.step = clamp(state.step - 1, 1, 9);
  if (action === "next-step") {
    const next = clamp(state.step + 1, 1, 9);
    if (stepValidation(state.step).ok && canGoToStep(next)) state.step = next;
  }

  if (action === "set-ceto") {
    state.ceto = event.currentTarget.dataset.ceto;
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
    const key = event.currentTarget.dataset.char;
    if (charPointsUsed() < 54) state.chars[key] = clamp(state.chars[key] + 1, 5, 13);
  }
  if (action === "char-dec") {
    const key = event.currentTarget.dataset.char;
    state.chars[key] = clamp(state.chars[key] - 1, 5, 13);
  }

  if (action === "toggle-mestiere") {
    const skill = event.currentTarget.dataset.skill;
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
    const skill = event.currentTarget.dataset.skill;
    const hasUrbana = state.cultureTrait1 === "urbana" || state.cultureTrait2 === "urbana";
    const cost = mestiereCost(skill, state.ceto, hasUrbana) ?? 99;
    if (state.skills.free.includes(skill)) {
      state.skills.free = state.skills.free.filter((s) => s !== skill);
    } else if (freePicksUsed() + cost <= freePicksTotal()) {
      state.skills.free.push(skill);
    }
  }

  if (action === "val-inc") {
    const key = event.currentTarget.dataset.valore;
    const allowed = getCultureAllowedValori(state.cultureTrait1, state.cultureTrait2);
    if (allowed.has(key) && totalValoriPoints() < 3) state.valori[key] = clamp(state.valori[key] + 1, 0, 3);
  }
  if (action === "val-dec") {
    const key = event.currentTarget.dataset.valore;
    state.valori[key] = clamp(state.valori[key] - 1, 0, 3);
  }

  if (action === "toggle-event") {
    const eventType = event.currentTarget.dataset.eventId;
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
    const eventType = event.currentTarget.dataset.eventType;
    const skillId = event.currentTarget.dataset.skill;
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
    const cfg = STARTING_WEALTH[state.ceto];
    let total = 0;
    for (let i = 0; i < cfg.dice; i++) total += Math.floor(Math.random() * 6) + 1;
    total = total * cfg.multiplier * cfg.inDenari;
    state.equipment.wealthBase = total;
    state.equipment.wealthRolled = true;
    state.equipment.wealth = total * currentWealthMultiplier();
  }

  if (action === "buy-item") {
    const id = event.currentTarget.dataset.id;
    const found = state.equipment.cart.find((x) => x.id === id);
    if (found) found.qty += 1;
    else state.equipment.cart.push({ id, qty: 1 });
  }

  if (action === "remove-item") {
    const id = event.currentTarget.dataset.id;
    const found = state.equipment.cart.find((x) => x.id === id);
    if (!found) return;
    found.qty -= 1;
    if (found.qty <= 0) state.equipment.cart = state.equipment.cart.filter((x) => x.id !== id);
  }

  if (action === "import-json") {
    const input = app.querySelector("[data-import-file]");
    if (input) input.click();
  }

  if (action === "pe-skill-inc") {
    const skillId = event.currentTarget.dataset.skill;
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
    const skillId = event.currentTarget.dataset.skill;
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

  render();
}

function onChange(event) {
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

async function onImportFile(event) {
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
