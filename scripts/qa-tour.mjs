// Dev QA: guided tour for new users. Usage: node scripts/qa-tour.mjs <screenshot-dir>  (app on :3100)
import { chromium } from "playwright-core";

const outDir = process.argv[2];
const APP = process.env.QA_BASE ?? "http://localhost:3100";
const browser = await chromium.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe" });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await ctx.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
let failed = 0;
const assert = (c, msg) => {
  console.log(c ? "ok:" : "FAIL:", msg);
  if (!c) failed++;
};
const dialog = () => page.getByRole("dialog");
const stepText = async () => (await dialog().locator("p").first().textContent())?.trim();

// Walk a whole tour with Next, checking each highlighted step has a spotlight on screen.
async function walkTour(name) {
  await dialog().waitFor();
  const total = Number((await stepText()).match(/of (\d+)/)[1]);
  let missing = [];
  for (let i = 1; i <= total; i++) {
    await page.waitForTimeout(550);
    const title = await dialog().getByRole("heading").textContent();
    const card = await dialog().boundingBox();
    const inView = card.y >= 0 && card.y + card.height <= 900 && card.x >= 0 && card.x + card.width <= 1280;
    if (!inView) missing.push(`${title} (card off-screen)`);
    if (i === 2) await page.screenshot({ path: `${outDir}/tour_${name}_step2.png` });
    await dialog().getByRole("button", { name: i === total ? "Finish" : "Next" }).click();
  }
  await dialog().waitFor({ state: "detached" });
  return { total, missing };
}

// 1. Sign-in page: no helper. Continue as guest → home shows the new-user helper.
await page.goto(`${APP}/`, { waitUntil: "networkidle" });
assert((await page.locator('[data-tour="tour-helper"]').count()) === 0, "no helper on the sign-in page");
await page.getByRole("button", { name: /Continue without signing in/ }).click();
await page.waitForURL(`${APP}/`);
const helper = page.getByRole("button", { name: /New here\? Take a quick tour/ });
await helper.waitFor();
assert(true, "new user sees the 'New here? Take a tour' helper");
await page.screenshot({ path: `${outDir}/tour_home_helper.png` });

// 2. Home tour: Next through every step; Back works.
await helper.click();
await dialog().waitFor();
assert((await stepText()).startsWith("Step 1 of"), "tour opens at step 1");
await dialog().getByRole("button", { name: "Next" }).click();
await dialog().getByRole("button", { name: "Back" }).click();
assert((await stepText()).startsWith("Step 1 of"), "Back returns to the previous step");
await page.screenshot({ path: `${outDir}/tour_home_step1.png` });
const home = await walkTour("home");
assert(home.missing.length === 0, `home tour: ${home.total} steps, every card on screen ${home.missing.join(", ")}`);
const helperAfter = page.getByRole("button", { name: "Help: tour this page" });
assert(await helperAfter.isVisible(), "after finishing, helper becomes a compact '?' button");

// 3. Persisted: reload keeps the compact helper (onboarded saved).
await page.reload({ waitUntil: "networkidle" });
assert(await page.getByRole("button", { name: "Help: tour this page" }).isVisible(), "tour completion is remembered after refresh");

// 4. Learn page tour + Skip.
await page.goto(`${APP}/learn`, { waitUntil: "networkidle" });
await page.getByRole("button", { name: "Help: tour this page" }).click();
await dialog().getByRole("button", { name: "Next" }).click();
await page.waitForTimeout(500);
assert((await dialog().getByRole("heading").textContent()) === "Search", "learn tour highlights the search box");
await page.screenshot({ path: `${outDir}/tour_learn_step2.png` });
await dialog().getByRole("button", { name: "Skip tour" }).click();
await dialog().waitFor({ state: "detached" });
assert(true, "Skip closes the tour");

// 5. Lobby and terminal tours; Esc closes.
await page.goto(`${APP}/simulate`, { waitUntil: "networkidle" });
await page.getByRole("button", { name: "Help: tour this page" }).click();
const lobby = await walkTour("lobby");
assert(lobby.missing.length === 0, `lobby tour: ${lobby.total} steps`);
await page.getByRole("button", { name: /Start the simulation/ }).click();
await page.waitForURL("**/simulate/play");
await page.getByText("Place an order").waitFor();
await page.getByRole("button", { name: "Help: tour this page" }).click();
await dialog().waitFor();
assert((await dialog().getByRole("heading").textContent()) === "Your trading terminal", "terminal page gets the terminal tour");
const terminal = await walkTour("terminal");
assert(terminal.missing.length === 0, `terminal tour: ${terminal.total} steps`);
await page.getByRole("button", { name: "Help: tour this page" }).click();
await dialog().waitFor();
await page.keyboard.press("Escape");
await dialog().waitFor({ state: "detached" });
assert(true, "Esc closes the tour");

// 6. Debrief: helper sits above the sticky Continue bar; debrief tour is used.
await page.locator("fieldset").nth(0).locator("label").first().click();
await page.locator("fieldset").nth(1).locator("label").first().click();
await page.getByRole("button", { name: /Review & confirm decision/ }).click();
await page.getByRole("button", { name: /Confirm & see what happens/ }).click();
await page.getByText("How to judge this round").waitFor();
const hb = await page.getByRole("button", { name: "Help: tour this page" }).boundingBox();
const bar = await page.locator("[data-sticky-cta]").boundingBox();
assert(hb.y + hb.height <= bar.y, "helper button doesn't overlap the debrief Continue bar");
await page.getByRole("button", { name: "Help: tour this page" }).click();
assert((await dialog().getByRole("heading").textContent()) === "The debrief", "debrief phase gets the debrief tour");
const debrief = await walkTour("debrief");
assert(debrief.missing.length === 0, `debrief tour: ${debrief.total} steps`);

// 7. Mobile: tour cards fit the screen.
await page.setViewportSize({ width: 390, height: 844 });
await page.goto(`${APP}/`, { waitUntil: "networkidle" });
await page.getByRole("button", { name: "Help: tour this page" }).click();
await dialog().getByRole("button", { name: "Next" }).click();
await page.waitForTimeout(600);
const box = await dialog().boundingBox();
assert(box.x >= 0 && box.x + box.width <= 390 && box.y >= 0 && box.y + box.height <= 844, "mobile: tour card fits the screen");
await page.screenshot({ path: `${outDir}/tour_mobile.png` });

console.log(errors.length ? `ERRORS:\n${[...new Set(errors)].join("\n")}` : "no console errors");
console.log(failed ? `${failed} check(s) failed` : "all tour checks passed");
await browser.close();
process.exit(failed ? 1 : 0);
