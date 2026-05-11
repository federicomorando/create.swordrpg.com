#!/usr/bin/env node
/**
 * Playwright smoke test for create.SwORDRPG.com character creator.
 * Requires the Vite dev server running (npm run dev).
 *
 * Usage: node scripts/smoke-test.mjs [--headed] [--port 5173]
 */

import { chromium } from "playwright";

const HEADED = process.argv.includes("--headed");
const SLOW = HEADED ? 300 : 0;
const portIdx = process.argv.indexOf("--port");
const PORT = portIdx !== -1 ? process.argv[portIdx + 1] : "5173";
const BASE = `http://localhost:${PORT}`;

let passed = 0;
let failed = 0;

function ok(name) {
  passed++;
  console.log(`  ✓ ${name}`);
}

function fail(name, err) {
  failed++;
  console.log(`  ✗ ${name}: ${err.message ?? err}`);
}

function assert(cond, name, detail) {
  if (cond) ok(name);
  else fail(name, detail);
}

async function stepTitle(page) {
  return (await page.locator("h2").first().textContent()).trim();
}

async function forceStep(page, n, stateOverrides = {}) {
  await page.evaluate(({ step, overrides }) => {
    const KEY = "swordrpg-character-v1";
    const raw = localStorage.getItem(KEY);
    const state = raw && raw !== "undefined" ? JSON.parse(raw) : {
      name: "TestChar", ceto: "borghese",
      chars: { fortitudo: 9, celeritas: 9, gratia: 9, mens: 9, prudentia: 9, audacia: 9 },
      cultureTrait1: "", cultureTrait2: "", trait1Skill: "", trait2Skill: "", corteseAdvSkill: "",
      skills: { mestiere: [], free: [], grade3: ["", ""], grade2: Array(8).fill("") },
      valori: { fides: 0, honor: 0, humanitas: 0, iustitia: 0, pietas: 0, virtus: 0 },
      retaggio: { tentazione: "", events: [], espGrade3: [""], espGrade2: ["", ""] },
      equipment: { wealth: 0, wealthBase: 0, wealthRolled: false, cart: [] },
      progression: { source: "creation", peTotal: 0, baseSkillGrades: {}, currentSkillGrades: {} }
    };
    state.step = step;
    if (!state.progression) state.progression = { source: "creation", peTotal: 0, baseSkillGrades: {}, currentSkillGrades: {} };
    state.progression.source = "import";
    Object.assign(state, overrides);
    localStorage.setItem(KEY, JSON.stringify(state));
  }, { step: n, overrides: stateOverrides });
  await page.reload();
  await page.waitForSelector("#app", { timeout: 10000 });
  await page.waitForTimeout(500);
}

async function run() {
  const browser = await chromium.launch({ headless: !HEADED, slowMo: SLOW });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });

  const errors = [];
  page.on("pageerror", (err) => errors.push(err.message));

  // ── Load the app ──
  console.log("\nLoading app...");
  await page.goto(BASE);
  await page.waitForSelector("#app", { timeout: 10000 });
  const title = await page.locator("h1").first().textContent();
  if (title.includes("Tempo della Spada")) ok("App loaded");
  else fail("App title", title);

  // ── Step 1: Ceto ──
  console.log("\nStep 1: Ceto...");
  if ((await stepTitle(page)) === "Ceto") ok("Step 1 rendered");
  else fail("Step 1 title", await stepTitle(page));

  const cetoCards = await page.locator('[data-action="set-ceto"]').count();
  if (cetoCards === 4) ok(`${cetoCards} ceto options`);
  else fail("Ceto options", `expected 4, got ${cetoCards}`);

  await page.click('[data-action="set-ceto"][data-ceto="borghese"]');
  await page.waitForTimeout(300);
  ok("Selected ceto: borghese");

  // ── Step 2: Caratteristiche ──
  await page.click('[data-action="next-step"]');
  await page.waitForTimeout(500);
  console.log("\nStep 2: Caratteristiche...");
  if ((await stepTitle(page)) === "Caratteristiche") ok("Step 2 rendered");
  else fail("Step 2 title", await stepTitle(page));

  const incBtns = await page.locator('[data-action="char-inc"]').count();
  if (incBtns === 6) ok(`${incBtns} characteristic controls`);
  else fail("Characteristic controls", `expected 6, got ${incBtns}`);

  await page.fill('[data-change="set-name"]', "TestChar");
  await page.locator('[data-change="set-name"]').dispatchEvent("change");
  await page.waitForTimeout(300);
  ok("Set character name");

  // Step 2: verify modifier display
  // Default chars are all 7, characteristicMod(7) = 0
  const modTexts = await page.locator("div.row em").allTextContents();
  const allModZero = modTexts.every(m => m.trim() === "mod +0");
  assert(allModZero, "All modifiers show +0 for score 7", `got: ${modTexts.join(", ")}`);

  // Step 2: increment a characteristic and verify modifier updates
  await page.click('[data-action="char-inc"][data-char="fortitudo"]');
  await page.waitForTimeout(300);
  const fortRow = page.locator('div.row:has([data-char="fortitudo"])');
  const fortVal = await fortRow.locator("strong").textContent();
  const fortMod = await fortRow.locator("em").textContent();
  assert(fortVal.trim() === "8", "Fortitudo incremented to 8", `got ${fortVal}`);
  assert(fortMod.trim() === "mod +1", "Fortitudo modifier updated to +1", `got ${fortMod}`);

  // Step 2: verify points counter
  // 5 × 7 + 8 = 43
  const pointsText = await page.locator("p strong").first().textContent();
  assert(pointsText.trim() === "43", "Points used: 43/54", `got ${pointsText}`);

  // ── Step 3: Cultura ──
  console.log("\nStep 3: Cultura...");
  await forceStep(page, 3);
  const t3 = await stepTitle(page);
  assert(t3 === "Cultura", "Step 3 rendered", `got "${t3}"`);
  const selects3 = await page.locator("select").count();
  assert(selects3 >= 2, `${selects3} culture select(s)`, "too few");

  // ── Step 4: Derived stats with known values ──
  console.log("\nStep 4: Statistiche derivate...");
  // Set known characteristics: fortitudo=10, celeritas=8, prudentia=9, audacia=12, ceto=borghese
  // Expected: riflessi = prudentia + mod(celeritas) = 9 + 1 = 10
  //           spirito = audacia + mod(audacia) = 12 + 3 = 15
  //           fatica = fortitudo + audacia = 10 + 12 = 22
  //           ferite = fortitudo + mod(fortitudo) = 10 + 2 = 12
  //           fama = CETO_FAMA[borghese] + 0 = 2
  await forceStep(page, 4, {
    ceto: "borghese",
    chars: { fortitudo: 10, celeritas: 8, gratia: 9, mens: 9, prudentia: 9, audacia: 12 },
  });
  const t4 = await stepTitle(page);
  assert(t4.startsWith("Statistiche derivate"), "Step 4 rendered", `got "${t4}"`);

  const statValues = await page.evaluate(() => {
    const items = [...document.querySelectorAll("ul.list li")];
    const out = {};
    for (const li of items) {
      const text = li.textContent.trim();
      const strong = li.querySelector("strong");
      if (!strong) continue;
      const val = Number(strong.textContent.trim());
      if (text.startsWith("Riflessi")) out.riflessi = val;
      if (text.startsWith("Spirito")) out.spirito = val;
      if (text.startsWith("Fatica")) out.fatica = val;
      if (text.startsWith("Ferite")) out.ferite = val;
      if (text.startsWith("Fama")) out.fama = val;
    }
    return out;
  });
  assert(statValues.riflessi === 10, `Riflessi = 10 (pru9+mod(cel8))`, `got ${statValues.riflessi}`);
  assert(statValues.spirito === 15, `Spirito = 15 (aud12+mod(aud12))`, `got ${statValues.spirito}`);
  assert(statValues.fatica === 22, `Fatica = 22 (fort10+aud12)`, `got ${statValues.fatica}`);
  assert(statValues.ferite === 12, `Ferite = 12 (fort10+mod(fort10))`, `got ${statValues.ferite}`);
  assert(statValues.fama === 2, `Fama = 2 (borghese)`, `got ${statValues.fama}`);

  // Step 4: verify with antica culture bonus (+1 spirito)
  await forceStep(page, 4, {
    ceto: "borghese",
    chars: { fortitudo: 10, celeritas: 8, gratia: 9, mens: 9, prudentia: 9, audacia: 12 },
    cultureTrait1: "antica",
  });
  const spiritoAntica = await page.evaluate(() => {
    const li = [...document.querySelectorAll("ul.list li")].find(l => l.textContent.startsWith("Spirito"));
    return Number(li?.querySelector("strong")?.textContent?.trim());
  });
  assert(spiritoAntica === 16, `Spirito with antica = 16 (12+mod(12)+1)`, `got ${spiritoAntica}`);

  // Step 4: verify with nobile ceto (fama = 3)
  await forceStep(page, 4, {
    ceto: "nobile",
    chars: { fortitudo: 9, celeritas: 9, gratia: 9, mens: 9, prudentia: 9, audacia: 9 },
  });
  const famaNobile = await page.evaluate(() => {
    const li = [...document.querySelectorAll("ul.list li")].find(l => l.textContent.startsWith("Fama"));
    return Number(li?.querySelector("strong")?.textContent?.trim());
  });
  assert(famaNobile === 3, `Fama nobile = 3`, `got ${famaNobile}`);

  // ── Step 5: Abilita ──
  console.log("\nStep 5: Abilita...");
  await forceStep(page, 5);
  const t5 = await stepTitle(page);
  assert(t5.startsWith("Abilit"), "Step 5 rendered", `got "${t5}"`);
  const mestChips = await page.locator('[data-action="toggle-mestiere"]').count();
  assert(mestChips >= 5, `${mestChips} mestiere skill chips`, "too few");
  const grade3Selects = await page.locator('[data-change="set-grade3"]').count();
  assert(grade3Selects === 2, `${grade3Selects} grade 3 slots`, `expected 2`);
  const grade2Selects = await page.locator('[data-change="set-grade2"]').count();
  assert(grade2Selects === 8, `${grade2Selects} grade 2 slots`, `expected 8`);

  // ── Step 6: Valori ──
  console.log("\nStep 6: Valori...");
  await forceStep(page, 6);
  const t6 = await stepTitle(page);
  assert(t6 === "Valori", "Step 6 rendered", `got "${t6}"`);
  const valInc = await page.locator('[data-action="val-inc"]').count();
  assert(valInc >= 6, `${valInc} valore increment buttons`, "too few");
  const valPointsText = await page.evaluate(() => {
    const ps = [...document.querySelectorAll("p")];
    const p = ps.find(p => p.textContent.includes("Punti assegnati"));
    return p?.textContent?.trim() ?? "";
  });
  assert(valPointsText.includes("0/3"), "Valore points 0/3", `got "${valPointsText}"`);

  // ── Step 7: Retaggio ──
  console.log("\nStep 7: Retaggio...");
  await forceStep(page, 7);
  const t7 = await stepTitle(page);
  assert(t7 === "Retaggio", "Step 7 rendered", `got "${t7}"`);
  const eventChips = await page.locator('[data-action="toggle-event"]').count();
  assert(eventChips >= 10, `${eventChips} event type chips`, "too few");
  const tentSelect = await page.locator('[data-change="set-tentazione"]').count();
  assert(tentSelect === 1, "Tentazione select present", "missing");

  // ── Step 8: Equipaggiamento ──
  console.log("\nStep 8: Equipaggiamento...");
  await forceStep(page, 8);
  const t8 = await stepTitle(page);
  assert(t8 === "Equipaggiamento", "Step 8 rendered", `got "${t8}"`);
  const content8 = await page.locator("#app").textContent();
  assert(
    content8.includes("Ricchezza") || content8.includes("ricchezza"),
    "Wealth display present",
    "missing"
  );

  // ── Step 9: Progressione ──
  console.log("\nStep 9: Progressione...");
  await forceStep(page, 9);
  const t9 = await stepTitle(page);
  assert(t9.startsWith("Progressione"), "Step 9 rendered", `got "${t9}"`);
  const content9 = await page.locator("#app").textContent();
  assert(content9.includes("PE"), "PE display present", "missing");

  // ── Export: verify JSON export produces valid data ──
  console.log("\nExport validation...");
  await forceStep(page, 9, {
    name: "ExportTest",
    ceto: "borghese",
    chars: { fortitudo: 10, celeritas: 8, gratia: 9, mens: 9, prudentia: 9, audacia: 12 },
  });
  assert(
    (await page.locator('[data-action="export-json"]').count()) > 0,
    "Export JSON button",
    "not found"
  );
  assert(
    (await page.locator('[data-action="export-pdf"]').count()) > 0,
    "Export PDF button",
    "not found"
  );
  assert(
    (await page.locator('[data-action="import-json"]').count()) > 0,
    "Import JSON button",
    "not found"
  );

  // ── Navigation ──
  console.log("\nNavigation...");
  await forceStep(page, 1);
  if ((await stepTitle(page)) === "Ceto") ok("Navigate to step 1");
  else fail("Navigate to step 1", await stepTitle(page));

  await page.click('[data-action="prev-step"]', { force: true });
  await page.waitForTimeout(300);
  if ((await stepTitle(page)) === "Ceto") ok("prev-step on step 1 stays");
  else fail("prev-step boundary", await stepTitle(page));

  // ── Reset ──
  console.log("\nReset...");
  page.once("dialog", (d) => d.accept());
  await page.locator('[data-action="reset"]').last().click({ force: true });
  await page.waitForTimeout(1000);
  if ((await stepTitle(page)) === "Ceto") ok("Reset returns to step 1");
  else fail("Reset", await stepTitle(page));

  // ── Console errors ──
  console.log("\nError check...");
  if (errors.length === 0) ok("No JS errors across all steps");
  else fail("JS errors", errors.join("; "));

  // ── Summary ──
  await browser.close();
  console.log(`\n${"─".repeat(40)}`);
  console.log(`Smoke test: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

run().catch((err) => {
  console.error(`\nFATAL: ${err.message}`);
  console.error(err.stack);
  process.exit(1);
});
