import { STORAGE_KEY, CHAR_KEYS, VALORI, EVENT_DEFS } from "./data/constants.js";

export function defaultState() {
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

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function normalizeState(rawState) {
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

export function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export const state = normalizeState(loadState() ?? defaultState());
