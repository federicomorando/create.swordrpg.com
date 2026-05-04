import { getCultureAllowedValori } from "@federicomorando/sword-engine/data/cultures";
import { mestiereCost } from "@federicomorando/sword-engine/constants";
import { state } from "./state.js";
import {
  charPointsUsed, freePicksUsed, freePicksTotal, totalValoriPoints,
  retaggioAvailable, cartTotal, eventComplete
} from "./helpers.js";

export function stepValidation(step = state.step) {
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
