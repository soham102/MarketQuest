// Dev QA: play all 10 rounds through the UI. Usage: node scripts/qa-simulation.mjs <outDir>
import { chromium } from "playwright-core";

const outDir = process.argv[2];
const BASE = "http://localhost:3100";
const browser = await chromium.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe" });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const errors = [];
await page.context().addCookies([{ name: "mq_guest_session", value: "1", url: "http://localhost:3100" }]); // browse as a guest (sign-in page is shown first otherwise)
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
const log = (...a) => console.log(...a);
const assert = (cond, msg) => { if (!cond) { log("FAIL:", msg); process.exitCode = 1; } else log("ok:", msg); };

const plan = {
  1: [["KRTI", "buy", 30]],
  2: [["SHKT", "buy", 20], ["ARYA", "buy", 5]],
  3: [["PRAN", "buy", 15], ["ARYA", "sell", 5]],
  4: [],
  5: [["VYOM", "buy", 10]],
  6: [["URJA", "buy", 20]],
  7: [],
  8: [],
  9: [["PRAN", "sell", 5]],
  10: [["DHAN", "buy", 5]],
};

async function order(ticker, side, qty) {
  await page.getByRole("button", { name: new RegExp(`^${ticker}`) }).first().click();
  if (side === "sell") await page.getByRole("radio", { name: "Sell", exact: true }).click();
  await page.locator('input[id^="qty-"]').fill(String(qty));
  await page.getByRole("button", { name: `Add ${side} order` }).click();
}

await page.goto(`${BASE}/simulate`, { waitUntil: "networkidle" });
await page.getByRole("button", { name: /Start the simulation/ }).click();
await page.waitForURL("**/simulate/play");
await page.getByText("Place an order").waitFor();
await page.screenshot({ path: `${outDir}/sim_r1_terminal.png`, fullPage: true });

// Invalid orders
await page.getByRole("button", { name: /^VYOM/ }).first().click();
await page.getByRole("radio", { name: "Sell", exact: true }).click();
await page.locator('input[id^="qty-"]').fill("5");
assert(await page.getByText(/don't own any VYOM/).isVisible(), "selling unowned shares is rejected");
await page.getByRole("radio", { name: "Buy", exact: true }).click();
await page.locator('input[id^="qty-"]').fill("2.5");
assert(await page.getByText(/whole shares only/).isVisible(), "fractional quantity is rejected");
await page.locator('input[id^="qty-"]').fill("100000");
assert(await page.getByText(/You can afford up to/).isVisible(), "overspending is rejected with max affordable");
await page.locator('input[id^="qty-"]').fill("");

for (let r = 1; r <= 10; r++) {
  await page.getByRole("heading", { level: 1 }).first().waitFor();
  for (const [t, s, q] of plan[r]) await order(t, s, q);
  await page.locator("fieldset").nth(0).locator("label").first().click();
  await page.locator("fieldset").nth(1).locator("label").first().click();
  await page.getByRole("button", { name: /Review & confirm decision/ }).click();
  await page.getByRole("button", { name: /Confirm & see what happens/ }).click();
  await page.getByText("How to judge this round").waitFor();
  if (r === 1) {
    assert(await page.getByText("₹1,00,920.40").first().isVisible(), "round 1 value after = ₹1,00,920.40 (30×₹31.20 gain − ₹15.60 charges)");
    await page.screenshot({ path: `${outDir}/sim_r1_debrief.png`, fullPage: true });
  }
  if (r === 4) {
    await page.reload({ waitUntil: "networkidle" });
    assert(await page.getByText("How to judge this round").isVisible(), "debrief persists across a page refresh");
    assert(!(await page.getByRole("button", { name: /Review & confirm decision/ }).count()), "round cannot be re-resolved after refresh");
  }
  // Knowledge check
  await page.locator("fieldset").last().locator("label").first().click();
  await page.getByRole("button", { name: "Check answer" }).click();
  const next = page.getByRole("button", { name: r === 10 ? /See your final report/ : new RegExp(`Continue to Round ${r + 1}`) });
  await next.click();
  if (r === 5) {
    await page.getByText("Place an order").waitFor();
    await page.reload({ waitUntil: "networkidle" });
    assert(await page.getByText(/^Round 6 of 10$/).isVisible(), "resumes at round 6 after refresh");
  }
  if (r === 6 || r === 9) {
    await page.getByText("Place an order").waitFor().catch(() => {});
  }
  if (r === 5) await page.screenshot({ path: `${outDir}/sim_r6_terminal.png`, fullPage: true });
  if (r === 8) await page.screenshot({ path: `${outDir}/sim_r9_terminal.png`, fullPage: true });
  log("round", r, "done");
}

await page.waitForURL("**/simulate/report");
await page.getByText("Financial performance").waitFor();
await page.waitForTimeout(500);
await page.screenshot({ path: `${outDir}/sim_report.png`, fullPage: true });
assert(await page.getByText("Five learning dimensions").isVisible(), "report shows learning dimensions");

// Review a past round
await page.goto(`${BASE}/simulate/review/3`, { waitUntil: "networkidle" });
assert(await page.getByRole("heading", { name: "Alternative decisions" }).isVisible(), "round 3 review renders");

// Restart from lobby
await page.goto(`${BASE}/simulate`, { waitUntil: "networkidle" });
await page.getByRole("button", { name: "Restart" }).click();
await page.getByRole("button", { name: /Erase progress & restart/ }).click();
await page.waitForURL("**/simulate/play");
await page.getByText("Place an order").waitFor();
assert(await page.getByText("₹1,00,000.00").first().isVisible(), "restart resets portfolio to ₹1,00,000");

// Mobile terminal
await page.setViewportSize({ width: 390, height: 844 });
await page.reload({ waitUntil: "networkidle" });
await page.screenshot({ path: `${outDir}/sim_mobile_terminal.png`, fullPage: true });
const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
assert(!overflow, "no horizontal scroll on mobile terminal");

log(errors.length ? "ERRORS:\n" + [...new Set(errors)].join("\n") : "no console errors");
await browser.close();
