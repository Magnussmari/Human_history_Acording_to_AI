import { chromium } from "playwright";

const BASE = "http://localhost:3000";
const OUT = "/tmp/chrono-qa";

const pages = [
  { slug: "home-top",        url: "/",             scroll: 0 },
  { slug: "home-hero",       url: "/",             scroll: 0,    sel: ".notebook-hero" },
  { slug: "home-timeline",   url: "/",             scroll: 1600 },
  { slug: "home-timeline-mid",url:"/",             scroll: 3200 },
  { slug: "year-2025",       url: "/year/2025",    scroll: 0 },
  { slug: "year-2025-mid",   url: "/year/2025",    scroll: 1400 },
  { slug: "year-1066",       url: "/year/1066",    scroll: 0 },
  { slug: "era-era-14",      url: "/era/era-14",   scroll: 0 },
  { slug: "era-era-14-mid",  url: "/era/era-14",   scroll: 1400 },
  { slug: "stratum",         url: "/stratum",      scroll: 0 },
  { slug: "stratum-mid",     url: "/stratum",      scroll: 700 },
  { slug: "globe",           url: "/?view=map",    scroll: 1500 },
  { slug: "methodology",     url: "/methodology",  scroll: 0 },
  { slug: "methodology-mid", url: "/methodology",  scroll: 1400 },
  { slug: "notfound",        url: "/no-such-page", scroll: 0 },
];

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 2,
});
const page = await ctx.newPage();

const errors = [];
page.on("pageerror", (e) => errors.push(`${page.url()}  PAGE-ERROR: ${e.message}`));
page.on("console", (msg) => {
  if (msg.type() === "error") errors.push(`${page.url()}  CONSOLE: ${msg.text()}`);
});

for (const p of pages) {
  try {
    await page.goto(BASE + p.url, { waitUntil: "networkidle", timeout: 30_000 });
  } catch (e) {
    errors.push(`${p.url}  NAV-FAIL: ${e.message}`);
    continue;
  }
  await page.waitForTimeout(500);
  if (p.scroll) {
    await page.evaluate((y) => window.scrollTo(0, y), p.scroll);
    await page.waitForTimeout(400);
  }
  await page.screenshot({
    path: `${OUT}/${p.slug}.png`,
    fullPage: false,
  });
  console.log(`shot: ${p.slug}`);
}

// Globe-specific: drag + autospin check
await page.goto(BASE + "/?view=map", { waitUntil: "networkidle", timeout: 30_000 });
await page.waitForTimeout(800);
const canvas = await page.$(".gs-canvas");
if (canvas) {
  const box = await canvas.boundingBox();
  if (box) {
    const midX = box.x + box.width / 2;
    const midY = box.y + box.height / 2;
    const t0 = Date.now();
    await page.mouse.move(midX, midY);
    await page.mouse.down();
    for (let i = 0; i < 30; i++) {
      await page.mouse.move(midX + i * 8, midY + i * 2, { steps: 2 });
    }
    await page.mouse.up();
    const dragMs = Date.now() - t0;
    console.log(`drag took ${dragMs}ms`);
  }
  await page.screenshot({ path: `${OUT}/globe-post-drag.png` });
}

// Home: click a row and confirm we land at /year/XXXX
await page.goto(BASE + "/", { waitUntil: "networkidle" });
await page.waitForTimeout(400);
await page.evaluate(() => window.scrollTo(0, 1800));
await page.waitForTimeout(400);
const firstRow = await page.$(".notebook-row-link");
if (firstRow) {
  const href = await firstRow.getAttribute("href");
  console.log(`first row href: ${href}`);
}

// Gather computed layout metrics I actually care about
const metrics = await page.evaluate(() => {
  const res = {};
  const rowEls = Array.from(document.querySelectorAll(".notebook-row")).slice(0, 6);
  res.rowHeights = rowEls.map((el) => el.getBoundingClientRect().height);
  const eyebrow = document.querySelector(".notebook-row-eyebrow");
  res.eyebrowFontSize = eyebrow ? getComputedStyle(eyebrow).fontSize : null;
  const chroLink = document.querySelector(".chronograph-link");
  res.chromeLinkFontSize = chroLink ? getComputedStyle(chroLink).fontSize : null;
  const sectionNum = document.querySelector(".notebook-section-num");
  res.sectionNumFontSize = sectionNum ? getComputedStyle(sectionNum).fontSize : null;
  res.bodyBg = getComputedStyle(document.body).background.slice(0, 160);
  res.bodyClass = document.body.className;
  // Any element whose computed font-size < 12px that contains text
  const small = [];
  for (const el of document.querySelectorAll("body *")) {
    if (el.children.length > 0) continue;
    const t = el.textContent?.trim() ?? "";
    if (!t) continue;
    const cs = getComputedStyle(el);
    const fs = parseFloat(cs.fontSize);
    if (fs < 12) {
      small.push(`${el.tagName.toLowerCase()}.${el.className} "${t.slice(0,40)}" ${cs.fontSize}`);
      if (small.length >= 12) break;
    }
  }
  res.tinyText = small;
  return res;
});

console.log("\nMETRICS:");
console.log(JSON.stringify(metrics, null, 2));
console.log("\nERRORS:");
console.log(errors.join("\n") || "(none)");

await browser.close();
