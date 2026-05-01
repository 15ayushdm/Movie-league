import pkg from "/opt/node22/lib/node_modules/playwright/index.js";
const { chromium } = pkg;
import fs from "fs";
import path from "path";

const BASE = "http://localhost:3000";
const PASSWORD = "test";
const OUT_DIR = "screenshots";

const PAGES = [
  { name: "01-login",     path: "/login",   skipAuth: true },
  { name: "02-dashboard", path: "/" },
  { name: "03-draft",     path: "/draft" },
  { name: "04-team",      path: "/team/__first_manager__" },
  { name: "05-scoring",   path: "/scoring" },
  { name: "06-admin",     path: "/admin" },
  { name: "07-rules",     path: "/rules" },
];

async function run() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const browser = await chromium.launch({
    executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
    args: ["--no-sandbox"],
  });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    deviceScaleFactor: 2,
  });

  // Login once → cookie persists for all pages
  const loginPage = await context.newPage();
  await loginPage.goto(`${BASE}/login`);
  await loginPage.fill('input[type="password"]', PASSWORD);
  await Promise.all([
    loginPage.waitForURL(`${BASE}/`),
    loginPage.click('button[type="submit"]'),
  ]);
  await loginPage.close();

  // Find a manager id for the team page
  const apiPage = await context.newPage();
  const teamLink = await apiPage.goto(`${BASE}/`).then(async () => {
    const href = await apiPage.locator('a[href^="/team/"]').first().getAttribute("href");
    return href;
  });
  await apiPage.close();

  for (const p of PAGES) {
    const url = p.path === "/team/__first_manager__"
      ? `${BASE}${teamLink}`
      : `${BASE}${p.path}`;

    let ctx = context;
    if (p.skipAuth) {
      // For login page, use a fresh context with no cookie
      ctx = await browser.newContext({
        viewport: { width: 1280, height: 900 },
        deviceScaleFactor: 2,
      });
    }

    const page = await ctx.newPage();
    await page.goto(url, { waitUntil: "networkidle" });
    await page.waitForTimeout(500);

    const filePath = path.join(OUT_DIR, `${p.name}.png`);
    await page.screenshot({ path: filePath, fullPage: true });
    console.log(`✓ ${p.name} → ${filePath}`);
    await page.close();
    if (p.skipAuth) await ctx.close();
  }

  await browser.close();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
