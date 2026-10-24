// Dev QA: open each lesson, step to the experiment, interact, complete the quiz. Usage: node scripts/qa-lessons.mjs <outDir>
import { chromium } from "playwright-core";

const outDir = process.argv[2];
const slugs = ["what-is-a-stock","portfolio-value-pnl","order-types","earnings-expectations","interest-rates-rbi","pe-ratio","inflation-pricing-power","diversification","volatility-drawdowns","rumours-vs-facts","rebalancing"];
const browser = await chromium.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe" });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const errors = [];
await page.context().addCookies([{ name: "mq_guest_session", value: "1", url: "http://localhost:3100" }]); // browse as a guest (sign-in page is shown first otherwise)
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
for (const slug of slugs) {
  await page.goto(`http://localhost:3100/learn/${slug}`, { waitUntil: "networkidle" });
  for (let i = 0; i < 3; i++) await page.getByRole("button", { name: /^Next/ }).click();
  // Nudge every slider with the keyboard
  const thumbs = page.getByRole("slider");
  for (let i = 0; i < await thumbs.count(); i++) { await thumbs.nth(i).focus(); await page.keyboard.press("ArrowRight"); }
  await page.screenshot({ path: `${outDir}/exp_${slug}.png`, fullPage: true });
  await page.getByRole("button", { name: /^Next/ }).click();
  // Answer each quiz question with the first option
  const fieldsets = page.locator("fieldset");
  for (let i = 0; i < await fieldsets.count(); i++) {
    await fieldsets.nth(i).locator("label").first().click();
    await fieldsets.nth(i).getByRole("button", { name: "Check answer" }).click();
  }
  await page.getByRole("button", { name: /^Next/ }).click();
  await page.getByRole("button", { name: /Finish lesson/ }).click();
  const done = await page.getByText("Lesson complete").isVisible();
  console.log(slug, done ? "completed" : "NOT COMPLETED");
}
await page.goto("http://localhost:3100/", { waitUntil: "networkidle" });
await page.screenshot({ path: `${outDir}/home_after_lessons.png`, fullPage: true });
console.log(errors.length ? "ERRORS:\n" + [...new Set(errors)].join("\n") : "no console errors");
await browser.close();
