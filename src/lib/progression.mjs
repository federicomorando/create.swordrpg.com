import { allSkillIds, BASE_SKILLS, peGradeCost } from "./actor-core.mjs";
import { TALENT_DEFS, checkTalentUnlocked, countTalentProgress, computeTalentTrackBonuses } from "./talents.mjs";

const EVENT_DEFS = {
  addestramento_marziale: { effect: "extraDice", extraDiceAmount: 1 },
  apprendistato: { effect: "extraDice", modes: { single: { extraDiceAmount: 2 }, split: { extraDiceAmount: 1 } } },
  antico_sapere: { effect: "extraDice", extraDiceAmount: 1 },
  dedizione: { effect: "extraDice", extraDiceAmount: 1 },
  fascino: { effect: "extraDice", extraDiceAmount: 1 },
  percorso_spirituale: { effect: "spirito_bonus", bonus: 3 },
  talento_naturale: { effect: "extraDice", extraDiceAmount: 1 }
};

function emptySkillState() {
  return Object.fromEntries(
    allSkillIds().map((id) => [id, { baseGrade: 0, grade: 0, isMestiere: false, extraDice: 0 }])
  );
}

export function computeCreationSkillState(state) {
  const skills = emptySkillState();

  for (const id of BASE_SKILLS) {
    if (!skills[id]) continue;
    skills[id].baseGrade = Math.max(skills[id].baseGrade, 1);
    skills[id].grade = Math.max(skills[id].grade, 1);
  }

  for (const id of state.skills.mestiere || []) {
    if (!skills[id]) continue;
    skills[id].baseGrade = Math.max(skills[id].baseGrade, 1);
    skills[id].grade = Math.max(skills[id].grade, 1);
    skills[id].isMestiere = true;
  }

  for (const id of state.skills.free || []) {
    if (!skills[id]) continue;
    if (skills[id].grade >= 1) {
      skills[id].baseGrade = Math.max(skills[id].baseGrade, 2);
      skills[id].grade = Math.max(skills[id].grade, 2);
    } else {
      skills[id].baseGrade = Math.max(skills[id].baseGrade, 1);
      skills[id].grade = Math.max(skills[id].grade, 1);
    }
  }

  for (const id of state.skills.grade2 || []) {
    if (!id || !skills[id]) continue;
    skills[id].baseGrade = Math.max(skills[id].baseGrade, 2);
    skills[id].grade = Math.max(skills[id].grade, 2);
  }
  for (const id of state.skills.grade3 || []) {
    if (!id || !skills[id]) continue;
    skills[id].baseGrade = Math.max(skills[id].baseGrade, 3);
    skills[id].grade = Math.max(skills[id].grade, 3);
  }

  for (const id of state.retaggio?.espGrade3 || []) {
    if (!id || !skills[id]) continue;
    skills[id].baseGrade = Math.max(skills[id].baseGrade, 3);
    skills[id].grade = Math.max(skills[id].grade, 3);
  }
  for (const id of state.retaggio?.espGrade2 || []) {
    if (!id || !skills[id]) continue;
    skills[id].baseGrade = Math.max(skills[id].baseGrade, 2);
    skills[id].grade = Math.max(skills[id].grade, 2);
  }

  if (state.trait1Skill && skills[state.trait1Skill]) skills[state.trait1Skill].extraDice += 1;
  if (state.trait2Skill && skills[state.trait2Skill]) skills[state.trait2Skill].extraDice += 1;
  if (state.corteseAdvSkill && skills[state.corteseAdvSkill]) skills[state.corteseAdvSkill].extraDice += 1;

  const hasTrait = (id) => state.cultureTrait1 === id || state.cultureTrait2 === id;
  if (hasTrait("meticcio")) {
    if (skills.storia_e_leggende) skills.storia_e_leggende.extraDice += 1;
    if (skills.usi_e_costumi) skills.usi_e_costumi.extraDice += 1;
  }
  if (hasTrait("rurale")) {
    if (skills.sopravvivenza) skills.sopravvivenza.extraDice += 1;
    if (skills.usi_e_costumi) skills.usi_e_costumi.extraDice += 1;
  }
  if (hasTrait("tenace") && skills.forza) skills.forza.extraDice += 1;

  for (const ev of state.retaggio?.events || []) {
    if (!ev?.type) continue;
    const def = EVENT_DEFS[ev.type];
    if (!def) continue;
    if (def.effect === "extraDice") {
      const amount = def.modes ? (def.modes[ev.mode]?.extraDiceAmount ?? 0) : (def.extraDiceAmount ?? 0);
      for (const skillId of ev.picks || []) {
        if (skills[skillId]) skills[skillId].extraDice += amount;
      }
    }
  }

  return skills;
}

export function computeProgressionSummary(baseSkillState, currentGrades, peTotal = 0) {
  let peSpent = 0;
  const skillView = {};
  const skillsForTalent = {};

  for (const id of allSkillIds()) {
    const base = baseSkillState[id]?.baseGrade ?? 0;
    const current = Math.max(base, Math.min(6, Number(currentGrades[id] ?? base)));
    const isMestiere = Boolean(baseSkillState[id]?.isMestiere);
    const extraDice = Number(baseSkillState[id]?.extraDice ?? 0);

    if (current > base) peSpent += peGradeCost(base, current);

    const focusThresholds = isMestiere ? [3, 6] : [4, 6];
    const focusCount = focusThresholds.filter((t) => current >= t).length;

    skillView[id] = {
      id,
      baseGrade: base,
      grade: current,
      isMestiere,
      extraDice,
      focusCount,
      hasFocus: focusCount > 0,
      nextGradeCost: current >= 6 ? null : (current === 0 ? 10 : 2 * (current + 1))
    };

    skillsForTalent[id] = { grade: current };
  }

  const talents = {};
  for (const [id, def] of Object.entries(TALENT_DEFS)) {
    const unlocked = checkTalentUnlocked(def, skillsForTalent);
    const progress = unlocked ? null : countTalentProgress(def, skillsForTalent);
    talents[id] = {
      unlocked,
      partial: !unlocked && progress !== null && progress.met > 0,
      progress,
      ...def
    };
  }

  const talentCount = Object.values(talents).filter((t) => t.unlocked).length;
  const talentCharBonuses = computeTalentTrackBonuses(talents);
  const talentResourceBonuses = { spirito: 0, fatica: 0, ferite: 0, riflessi: 0 };
  const talentSpiritFormulas = [];

  for (const t of Object.values(talents)) {
    if (!t.unlocked) continue;
    for (const effect of t.effects || []) {
      if (effect.type === "extraDice" && !effect.context && skillView[effect.skill]) {
        skillView[effect.skill].extraDice += effect.bonus || 0;
      }
      if (effect.type === "resourceBonus" && talentResourceBonuses[effect.resource] != null) {
        talentResourceBonuses[effect.resource] += effect.bonus || 0;
      }
      if (effect.type === "spiritFormula") talentSpiritFormulas.push(effect);
    }
  }

  return {
    skills: skillView,
    peTotal,
    peSpent,
    peAvailable: peTotal - peSpent,
    talents,
    talentCount,
    talentCharBonuses,
    talentResourceBonuses,
    talentSpiritFormulas
  };
}
