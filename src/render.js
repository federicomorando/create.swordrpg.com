import { CULTURE_DEFS, CULTURE_IDS, getCultureAllowedValori } from "@federicomorando/sword-engine/data/cultures";
import { denariToDisplay } from "@federicomorando/sword-engine/data/equipment";
import { allSkillIds, CETO_FAMA, mestiereCost } from "@federicomorando/sword-engine/constants";
import {
  STEP_LABELS, CETO_LABELS, CHAR_LABELS, SKILL_LABELS, VALORE_LABELS, TENTAZIONI
} from "./data/labels-it.mjs";
import { CHAR_KEYS, VALORI, EVENT_DEFS } from "./data/constants.js";
import { state, saveState } from "./state.js";
import {
  modifier, escapeHTML, charPointsUsed, derived, totalValoriPoints,
  retaggioAvailable, freePicksUsed, freePicksTotal, buyableItems, cartTotal,
  eventConfig, eventComplete, percorsoValoreOptions, knownSkillIds,
  buildTrainingOptions, syncSkillTrainingState, syncRetaggioState,
  ensureProgressionState, progressionSummary, uiSummary
} from "./helpers.js";
import { stepValidation } from "./validation.js";

export function render() {
  syncSkillTrainingState();
  syncRetaggioState();
  ensureProgressionState();
  const allowedValori = getCultureAllowedValori(state.cultureTrait1, state.cultureTrait2);
  const allSkills = allSkillIds();
  const validation = stepValidation(state.step);
  const summary = uiSummary();
  const app = document.getElementById("app");
  app.innerHTML = `
    <main class="layout">
      <header class="header">
        <div class="header-top">
          <div>
            <h1>Il Tempo della Spada - Creazione PG</h1>
          </div>
          <div class="header-actions">
            <details class="actions-menu">
              <summary aria-label="Apri menu azioni">
                <span class="menu-trigger-icon" aria-hidden="true">☰</span>
                <span class="menu-trigger-label">Azioni</span>
              </summary>
              <div class="actions-menu-list">
                <button data-action="export-json"><span class="action-icon" aria-hidden="true">⇩</span><span>Export JSON (Foundry)</span></button>
                <button data-action="export-pdf"><span class="action-icon" aria-hidden="true">⎙</span><span>Export PDF</span></button>
                <button data-action="import-json"><span class="action-icon" aria-hidden="true">⇧</span><span>Import JSON</span></button>
                <button data-action="reset"><span class="action-icon" aria-hidden="true">✦</span><span>Nuovo personaggio</span></button>
              </div>
            </details>
            <div class="actions-inline">
              <button data-action="export-json"><span class="action-icon" aria-hidden="true">⇩</span><span>Export JSON (Foundry)</span></button>
              <button data-action="export-pdf"><span class="action-icon" aria-hidden="true">⎙</span><span>Export PDF</span></button>
              <button data-action="import-json"><span class="action-icon" aria-hidden="true">⇧</span><span>Import JSON</span></button>
              <button data-action="reset"><span class="action-icon" aria-hidden="true">✦</span><span>Nuovo personaggio</span></button>
            </div>
            <input type="file" accept="application/json,.json" data-import-file style="display:none" />
          </div>
        </div>
        <div class="name-row">
          <label>Nome personaggio</label>
          <input value="${escapeHTML(state.name)}" data-change="set-name" />
        </div>
      </header>

      <section class="steps">
        ${STEP_LABELS.map((label, i) => `<button class="step ${state.step === i + 1 ? "active" : ""}" data-action="goto-step" data-step="${i + 1}" ${state.step === i + 1 ? 'aria-current="step"' : ""}>${label}</button>`).join("")}
      </section>

      <p class="step-meta">Step ${state.step} di ${STEP_LABELS.length}: ${STEP_LABELS[state.step - 1]}</p>
      <section class="mobile-summary" aria-label="Riepilogo rapido">
        <p class="mobile-summary-title">Riepilogo rapido</p>
        <div class="mobile-summary-grid">
          <span class="chip">Ceto: ${summary.ceto}</span>
          <span class="chip">Car. mancanti: ${summary.charsLeft}</span>
          <span class="chip">Mestiere/libere: ${summary.mestiereLeft}/${summary.freeLeft}</span>
          <span class="chip">Valori/Retaggio: ${summary.valoriLeft}/${summary.retaggioLeft}</span>
          <span class="chip">Budget: ${summary.wealthText}</span>
          <span class="chip">PE liberi: ${summary.peText}</span>
        </div>
      </section>

      <section class="panel">
        ${renderStepContent(allowedValori, allSkills)}
      </section>
      <p class="page-end-link"><a href="./about.html">About</a></p>

      <footer class="footer">
        <button data-action="prev-step" ${state.step === 1 ? "disabled" : ""}>Indietro</button>
        <button data-action="next-step" ${state.step === 9 || !validation.ok ? "disabled" : ""}>Avanti</button>
        ${validation.ok ? "" : `<span class="warn" aria-live="polite">${validation.msg}</span>`}
      </footer>
    </main>
  `;

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
            <span>Costo retaggio/fama: ${CETO_FAMA[id]}</span>
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
              <button data-action="char-dec" data-char="${key}" aria-label="Diminuisci ${CHAR_LABELS[key]}">-</button>
              <strong>${state.chars[key]}</strong>
              <button data-action="char-inc" data-char="${key}" aria-label="Aumenta ${CHAR_LABELS[key]}">+</button>
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
      <p class="section-divider">Abilita libere (costo variabile): ${usedFree}/${freeTotal}</p>
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
    const hasValoriLimitations = VALORI.some((v) => !allowedValori.has(v));
    return `
      <h2>Valori</h2>
      <p>Punti assegnati: ${totalValoriPoints()}/3</p>
      <div class="grid2">
        ${VALORI.map(
          (v) => `
          <div class="row ${allowedValori.has(v) ? "" : "row-disabled"}">
            <span>${VALORE_LABELS[v]}</span>
            <div class="spin">
              <button data-action="val-dec" data-valore="${v}" aria-label="Diminuisci ${VALORE_LABELS[v]}" ${state.valori[v] <= 0 ? "disabled" : ""}>-</button>
              <strong>${state.valori[v]}</strong>
              <button data-action="val-inc" data-valore="${v}" aria-label="Aumenta ${VALORE_LABELS[v]}" ${state.valori[v] >= 3 || totalValoriPoints() >= 3 || !allowedValori.has(v) ? "disabled" : ""}>+</button>
            </div>
          </div>
        `
        ).join("")}
      </div>
      ${
        hasValoriLimitations
          ? `<p class="note">I valori disabilitati non sono previsti dai tratti culturali scelti.</p>`
          : ""
      }
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
    const groups = [
      { title: "Armi", items: items.filter((it) => it.type === "weapon") },
      { title: "Scudi", items: items.filter((it) => it.type === "shield") },
      { title: "Armature", items: items.filter((it) => it.type === "armor") },
      { title: "Equipaggiamento", items: items.filter((it) => it.type === "gear") }
    ];
    return `
      <h2>Equipaggiamento</h2>
      <p>Ricchezza: <strong>${denariToDisplay(state.equipment.wealth)}</strong> (${state.equipment.wealth}d)</p>
      <button data-action="roll-wealth">Tira ricchezza iniziale</button>
      <div class="catalog">
        ${groups
          .map(
            (group) => `
              <div class="card catalog-group">
                <strong>${group.title}</strong>
                <div class="list">
                  ${group.items
                    .map((it) => `<button class="row buy" data-action="buy-item" data-id="${it.id}" ${remaining < it.cost ? "disabled" : ""}><span>${it.label}</span><span>${denariToDisplay(it.cost)}</span></button>`)
                    .join("")}
                </div>
              </div>
            `
          )
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
          <div class="row progression-row">
            <span>${SKILL_LABELS[s.id] ?? s.id} (base ${s.baseGrade})</span>
            <div class="spin progression-spin">
              <button data-action="pe-skill-dec" data-skill="${s.id}" aria-label="Riduci grado ${SKILL_LABELS[s.id] ?? s.id}" ${s.grade <= s.baseGrade ? "disabled" : ""}>-</button>
              <strong class="progression-grade">${s.grade}</strong>
              <button data-action="pe-skill-inc" data-skill="${s.id}" aria-label="Aumenta grado ${SKILL_LABELS[s.id] ?? s.id}" ${s.grade >= 6 || (s.nextGradeCost != null && s.nextGradeCost > prog.peAvailable) ? "disabled" : ""}>+</button>
              <em class="progression-next">${s.nextGradeCost == null ? "max" : `prossimo: ${s.nextGradeCost} PE`}</em>
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
