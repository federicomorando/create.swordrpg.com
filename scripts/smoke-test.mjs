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

async function stepTitle(page) {
  return (await page.locator("h2").first().textContent()).trim();
}

async function forceStep(page, n) {
  await page.evaluate((step) => {
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
    localStorage.setItem(KEY, JSON.stringify(state));
  }, n);
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

  // ── Step 2: Caratteristiche (via next-step — step 1 always passes validation) ──
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

  // ── Steps 3–9: force navigation via localStorage + reload ──
  const stepChecks = [
    [3, "Cultura", async () => {
      const selects = await page.locator("select").count();
      if (selects >= 1) ok(`  ${selects} culture select(s)`);
      else fail("  Culture selects", "none");
    }],
    [4, "Statistiche derivate", async () => {
      const content = await page.locator(".step-content, main").first().textContent();
      if (content.length > 50) ok("  Derived stats displayed");
      else fail("  Derived content", "too short");
    }],
    [5, "Abilit", async () => {
      const selects = await page.locator("select").count();
      if (selects >= 1) ok(`  ${selects} skill select(s)`);
      else fail("  Skill selects", "none");
    }],
    [6, "Valori", async () => {
      const btns = await page.locator('[data-action]').count();
      if (btns >= 1) ok("  Valore controls present");
      else fail("  Valore controls", "none");
    }],
    [7, "Retaggio", async () => {
      const content = await page.locator("#app").textContent();
      if (content.includes("Retaggio") || content.includes("retaggio")) ok("  Retaggio content rendered");
      else fail("  Retaggio content", "missing");
    }],
    [8, "Equipaggiamento", async () => {
      const content = await page.locator("#app").textContent();
      if (content.includes("Ricchezza") || content.includes("ricchezza") || content.includes("Equipaggiamento"))
        ok("  Equipment content rendered");
      else fail("  Equipment content", "missing");
    }],
    [9, "Progressione", async () => {
      const content = await page.locator("#app").textContent();
      if (content.includes("PE") || content.includes("Progressione"))
        ok("  Progression content rendered");
      else fail("  Progression content", "missing");
    }],
  ];

  for (const [n, label, check] of stepChecks) {
    await forceStep(page, n);
    console.log(`\nStep ${n}: ${label}...`);
    const t = await stepTitle(page);
    if (t.startsWith(label)) ok(`Step ${n} rendered`);
    else fail(`Step ${n} title`, `got "${t}"`);
    await check();
  }

  // ── Navigation: go back to step 1 ──
  console.log("\nNavigation...");
  await forceStep(page, 1);
  if ((await stepTitle(page)) === "Ceto") ok("Navigate to step 1");
  else fail("Navigate to step 1", await stepTitle(page));

  // prev-step on step 1 should stay on step 1
  await page.click('[data-action="prev-step"]', { force: true });
  await page.waitForTimeout(300);
  if ((await stepTitle(page)) === "Ceto") ok("prev-step on step 1 stays");
  else fail("prev-step boundary", await stepTitle(page));

  // ── Export buttons ──
  console.log("\nExport...");
  if ((await page.locator('[data-action="export-json"]').count()) > 0) ok("Export JSON button");
  else fail("Export JSON", "not found");
  if ((await page.locator('[data-action="export-pdf"]').count()) > 0) ok("Export PDF button");
  else fail("Export PDF", "not found");
  if ((await page.locator('[data-action="import-json"]').count()) > 0) ok("Import JSON button");
  else fail("Import JSON", "not found");

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
