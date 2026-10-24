// End-to-end auth & sync QA against the local mock Supabase (scripts/mock-supabase.mjs).
// Requires: mock on :54321 and `NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321 NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=x next dev -p 3100`.
// Usage: node scripts/qa-auth.mjs <screenshot-dir>
import { chromium } from "playwright-core";

const outDir = process.argv[2];
const APP = "http://localhost:3100";
const MOCK = "http://127.0.0.1:54321";
const browser = await chromium.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe" });
const errors = [];
let failed = 0;
const assert = (cond, msg) => {
  console.log(cond ? "ok:" : "FAIL:", msg);
  if (!cond) failed++;
};
const counts = async (user) => (await fetch(`${MOCK}/__test/counts?user=${user}`)).json();
/** Poll the database until `check` passes (saves are debounced and asynchronous). */
async function waitForCounts(user, check, timeout = 15000) {
  const start = Date.now();
  let c;
  do {
    c = await counts(user);
    if (check(c)) return c;
    await new Promise((r) => setTimeout(r, 300));
  } while (Date.now() - start < timeout);
  return c;
}
const ctl = (path) => fetch(`${MOCK}${path}`, { method: "POST" });

async function newDevice(name) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  page.on("pageerror", (e) => errors.push(`[${name}] ${e.message}`));
  page.on("response", (r) => {
    if (r.status() >= 400 && !r.url().includes("favicon") && !r.url().includes("/rest/v1/rpc/") && !r.url().includes("/auth/v1/"))
      errors.push(`[${name}] ${r.status()} ${r.url()}`);
  });
  return { ctx, page };
}

async function completeLesson(page, slug) {
  await page.goto(`${APP}/learn/${slug}`, { waitUntil: "networkidle" });
  for (let i = 0; i < 4; i++) await page.getByRole("button", { name: /^Next/ }).click();
  const fs = page.locator("fieldset");
  for (let i = 0; i < (await fs.count()); i++) {
    await fs.nth(i).locator("label").first().click();
    await fs.nth(i).getByRole("button", { name: "Check answer" }).click();
  }
  await page.getByRole("button", { name: /^Next/ }).click();
  await page.getByRole("button", { name: /Finish lesson/ }).click();
  await page.getByText("Lesson complete").waitFor();
}

async function playRound(page, orders = []) {
  await page.goto(`${APP}/simulate/play`, { waitUntil: "networkidle" });
  await page.getByText("Place an order").waitFor();
  for (const [ticker, qty] of orders) {
    await page.getByRole("button", { name: new RegExp(`^${ticker}`) }).first().click();
    await page.locator('input[id^="qty-"]').fill(String(qty));
    await page.getByRole("button", { name: "Add buy order" }).click();
  }
  await page.locator("fieldset").nth(0).locator("label").first().click();
  await page.locator("fieldset").nth(1).locator("label").first().click();
  await page.getByRole("button", { name: /Review & confirm decision/ }).click();
  await page.getByRole("button", { name: /Confirm & see what happens/ }).click();
  await page.getByText("How to judge this round").waitFor();
  await page.locator("fieldset").last().locator("label").first().click();
  await page.getByRole("button", { name: "Check answer" }).click();
  await page.getByRole("button", { name: /Continue to Round/ }).click();
  await page.getByText("Place an order").waitFor();
}

async function signIn(page, who, { from = "/" } = {}) {
  await page.goto(`${APP}/sign-in?next=${encodeURIComponent(from)}`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Continue with Google" }).click();
  await page.waitForURL("**/auth/v1/authorize**");
  await page.getByText(who === "alice" ? "Alice Learner" : who === "bob" ? "Bob Investor" : "Cancel").click();
}

const accountButton = (page, name) => page.getByRole("button", { name: new RegExp(`Account menu for ${name}`) });
const waitSaved = (page, name) => page.getByRole("button", { name: new RegExp(`Account menu for ${name}.*All progress saved`) }).waitFor({ timeout: 15000 });

/* ---------------------------------------------------------------------------- */

// 0. The sign-in page is the first page; "Continue without signing in" lets guests in and is remembered.
const d1 = await newDevice("device-1");
let page = d1.page;
await page.goto(`${APP}/`, { waitUntil: "networkidle" });
assert(page.url() === `${APP}/sign-in`, "first visit lands on the sign-in page");
await page.goto(`${APP}/simulate`, { waitUntil: "networkidle" });
assert(page.url() === `${APP}/sign-in?next=%2Fsimulate`, "deep links also show sign-in first (and remember the destination)");
await page.getByRole("button", { name: /Continue without signing in/ }).click();
await page.waitForURL(`${APP}/simulate`);
await page.goto(`${APP}/`, { waitUntil: "networkidle" });
assert(page.url() === `${APP}/`, "guest choice is remembered");

// 1. Anonymous learner makes progress; sees the save prompt.
await completeLesson(page, "what-is-a-stock");
await page.goto(`${APP}/simulate`, { waitUntil: "networkidle" });
await page.getByRole("button", { name: /Start the simulation/ }).click();
await page.waitForURL("**/simulate/play");
await playRound(page, [["KRTI", 20]]);
await playRound(page, [["SHKT", 10]]);
await page.goto(`${APP}/`, { waitUntil: "networkidle" });
assert(await page.getByText("Your progress lives only in this browser").isVisible(), "anonymous user sees the save-progress prompt");
assert(await page.getByRole("link", { name: "Sign in" }).isVisible(), "header shows a Sign in button when signed out");
await page.screenshot({ path: `${outDir}/auth_1_anonymous_home.png` });

// 2. Protected route redirects when signed out.
await page.goto(`${APP}/account`, { waitUntil: "networkidle" });
assert(page.url().startsWith(`${APP}/sign-in?next=%2Faccount`), "signed-out visit to /account redirects to /sign-in");
await page.screenshot({ path: `${outDir}/auth_2_sign_in.png` });

// 3. Cancelling at Google shows a helpful message.
await signIn(page, "cancel");
await page.waitForURL("**/sign-in?error=cancelled**");
assert(await page.getByText(/Sign-in was cancelled/).isVisible(), "cancelling sign-in shows a clear message");

// 4. Sign in → anonymous progress migrates into the account.
await signIn(page, "alice", { from: "/simulate" });
await page.waitForURL(`${APP}/simulate`);
await accountButton(page, "Alice Learner").waitFor();
await waitSaved(page, "Alice Learner");
assert(await page.getByText("Your progress on this device is now saved to your account.").isVisible(), "migration success message shown");
let c = await counts("alice");
assert(c.concepts === 1 && c.sessions === 1 && c.rounds === 2 && c.orders === 2, `anonymous progress migrated to Alice (${JSON.stringify(c)})`);
const anonLeft = await page.evaluate(() => localStorage.getItem("marketquest:v1"));
assert(anonLeft === null, "anonymous browser copy removed after migration");
await page.screenshot({ path: `${outDir}/auth_4_signed_in.png` });

// 5. Playing while signed in saves each round, without duplicates.
await playRound(page);
c = await waitForCounts("alice", (x) => x.rounds === 3);
await waitSaved(page, "Alice Learner");
assert(c.rounds === 3 && c.orders === 2, `round 3 saved; orders not duplicated (${JSON.stringify(c)})`);

// 6. Refresh keeps the session and progress.
await page.reload({ waitUntil: "networkidle" });
await accountButton(page, "Alice Learner").waitFor();
assert(await page.getByText(/^Round 4 of 10$/).isVisible(), "after refresh: still signed in and on round 4");

// 7. User menu shows identity and status; account page works.
await accountButton(page, "Alice Learner").click();
assert(await page.getByText("alice.learner@example.com").isVisible(), "user menu shows the Google email");
await page.screenshot({ path: `${outDir}/auth_7_user_menu.png` });
await page.keyboard.press("Escape");
await page.goto(`${APP}/account`, { waitUntil: "networkidle" });
assert(page.url() === `${APP}/account`, "signed-in user can open /account");
assert(await page.getByText("3 of 10 rounds").isVisible(), "account page shows saved simulation progress");
await page.screenshot({ path: `${outDir}/auth_7_account.png`, fullPage: true });

// 8. Second device: same account resumes exactly where device 1 is.
const d2 = await newDevice("device-2");
await signIn(d2.page, "alice", { from: "/simulate/play" });
await d2.page.waitForURL(`${APP}/simulate/play`);
await d2.page.getByText(/^Round 4 of 10$/).waitFor({ timeout: 15000 });
assert(true, "second device resumes Alice at round 4");
await d2.page.goto(`${APP}/learn`, { waitUntil: "networkidle" });
assert((await d2.page.getByText("1 of 11 completed").count()) > 0, "second device restores completed lessons");

// 9. Device 2 plays on; device 1 picks it up when it regains focus (no stale overwrite).
await playRound(d2.page);
await waitForCounts("alice", (x) => x.rounds === 4);
await waitSaved(d2.page, "Alice Learner");
await page.goto(`${APP}/simulate/play`, { waitUntil: "networkidle" });
await page.evaluate(() => document.dispatchEvent(new Event("visibilitychange")));
await page.getByText(/^Round 5 of 10$/).waitFor({ timeout: 15000 });
assert(true, "device 1 adopts newer progress from device 2");
c = await counts("alice");
assert(c.rounds === 4, `cloud has 4 rounds, none lost or duplicated (${JSON.stringify(c)})`);

// 10. Save failure → visible error → automatic retry succeeds.
await ctl("/__test/fail-saves?n=1");
await playRound(page);
await page.getByText(/Couldn't save your progress/).waitFor({ timeout: 10000 });
assert(true, "failed save shows an error message");
c = await waitForCounts("alice", (x) => x.rounds === 5);
await waitSaved(page, "Alice Learner");
assert(c.rounds === 5, `retry saved round 5 (${JSON.stringify(c)})`);

// 11. Expired session → clear state, progress kept locally.
await ctl("/__test/expire-sessions");
await page.goto(`${APP}/learn`, { waitUntil: "networkidle" });
await completeLesson(page, "pe-ratio");
await page.getByText(/session (has expired|has ended)/i).first().waitFor({ timeout: 15000 });
assert(true, "expired session is reported to the user");
await page.screenshot({ path: `${outDir}/auth_11_expired.png` });
const keptLocally = await page.evaluate(() =>
  Object.keys(localStorage).some((k) => k.startsWith("marketquest:v1:user:") && localStorage.getItem(k)?.includes("pe-ratio")),
);
assert(keptLocally, "progress made while expired is kept on the device");

// 12. Signing in again uploads what was kept.
await signIn(page, "alice", { from: "/learn" });
await page.waitForURL(`${APP}/learn`);
c = await waitForCounts("alice", (x) => x.concepts === 2);
await waitSaved(page, "Alice Learner");
assert(c.concepts === 2, `lesson completed while expired synced after re-sign-in (${JSON.stringify(c)})`);

// 13. Sign out → anonymous, device copy removed, account route protected again.
assert(await page.getByRole("button", { name: "Sign out" }).isVisible(), "top-right Sign out button visible when signed in");
await page.getByRole("button", { name: "Sign out" }).click();
await page.waitForURL(`${APP}/sign-in`);
assert(true, "sign-out returns to the sign-in page");
assert(await page.getByText(/Signed out/).isVisible(), "sign-out confirmation shown");
await page.getByRole("button", { name: /Continue without signing in/ }).click();
await page.getByRole("link", { name: "Sign in" }).waitFor();
const leftovers = await page.evaluate(() => Object.keys(localStorage).filter((k) => k.startsWith("marketquest:v1:user:")));
assert(leftovers.length === 0, "account data removed from this device after sign-out");
await page.goto(`${APP}/`, { waitUntil: "networkidle" });
assert(await page.getByText("0 of 11 concepts completed").isVisible(), "signed-out view shows no account progress");
await page.goto(`${APP}/account`, { waitUntil: "networkidle" });
assert(page.url().includes("/sign-in"), "/account is protected again after sign-out");

// 14. Data isolation: Bob on the same device sees none of Alice's data.
await signIn(page, "bob", { from: "/" });
await page.waitForURL(`${APP}/`);
await waitSaved(page, "Bob Investor");
assert(await page.getByText("0 of 11 concepts completed").isVisible(), "Bob sees none of Alice's lessons");
await page.goto(`${APP}/simulate`, { waitUntil: "networkidle" });
assert(await page.getByRole("button", { name: /Start the simulation/ }).isVisible(), "Bob has no simulation of Alice's");
const bob = await counts("bob");
c = await counts("alice");
assert(bob.sessions === 0 && bob.rounds === 0 && c.rounds === 5, `database rows stay separated (alice ${c.rounds} rounds, bob ${bob.rounds})`);
await accountButton(page, "Bob Investor").click();
await page.getByRole("menuitem", { name: "Sign out" }).click();
await page.waitForURL(`${APP}/sign-in`);

// 15. Conflict: an anonymous run on a new device vs Alice's existing run → explicit choice.
const d3 = await newDevice("device-3");
await d3.page.goto(`${APP}/simulate`, { waitUntil: "networkidle" });
await d3.page.getByRole("button", { name: /Continue without signing in/ }).click();
await d3.page.waitForURL(`${APP}/simulate`);
await d3.page.getByRole("button", { name: /Start the simulation/ }).click();
await d3.page.waitForURL("**/simulate/play");
await playRound(d3.page);
await signIn(d3.page, "alice", { from: "/simulate/play" });
await d3.page.getByText("Which simulation should we keep?").waitFor({ timeout: 15000 });
assert(true, "conflicting simulations prompt an explicit choice");
await d3.page.screenshot({ path: `${outDir}/auth_15_conflict.png` });
await d3.page.getByRole("button", { name: "Keep my account's run" }).click();
await d3.page.getByText(/^Round 6 of 10$/).waitFor({ timeout: 15000 });
c = await counts("alice");
assert(c.rounds === 5 && c.sessions === 1, `account run kept untouched (${JSON.stringify(c)})`);

// 16. Mobile layout of the signed-in header.
await d3.page.setViewportSize({ width: 390, height: 844 });
await d3.page.goto(`${APP}/`, { waitUntil: "networkidle" });
await accountButton(d3.page, "Alice Learner").waitFor();
const overflow = await d3.page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
assert(!overflow, "no horizontal scroll on mobile when signed in");
await d3.page.screenshot({ path: `${outDir}/auth_16_mobile.png` });

console.log(errors.length ? `UNEXPECTED ERRORS:\n${[...new Set(errors)].join("\n")}` : "no unexpected page errors");
console.log(failed ? `${failed} check(s) failed` : "all auth checks passed");
await browser.close();
process.exit(failed ? 1 : 0);
