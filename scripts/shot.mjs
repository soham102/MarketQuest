// Dev helper: screenshot routes with the system Chrome. Usage: node scripts/shot.mjs <outDir> <path> [width]
import { chromium } from "playwright-core";

const [outDir, path = "/", width = "1280"] = process.argv.slice(2);
const browser = await chromium.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe" });
const page = await browser.newPage({ viewport: { width: Number(width), height: 900 } });
const errors = [];
await page.context().addCookies([{ name: "mq_guest_session", value: "1", url: "http://localhost:3100" }]); // browse as a guest (sign-in page is shown first otherwise)
page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
page.on("pageerror", (e) => errors.push(e.message));
await page.goto(`http://localhost:3100${path}`, { waitUntil: "networkidle" });
await page.waitForTimeout(800);
const name = (path.replace(/\W+/g, "_") || "root") + `_${width}.png`;
await page.screenshot({ path: `${outDir}/${name}`, fullPage: true });
console.log(name, errors.length ? `ERRORS:\n${errors.join("\n")}` : "no console errors");
await browser.close();
