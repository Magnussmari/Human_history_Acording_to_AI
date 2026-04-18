import { chromium } from "playwright";

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
await page.goto("http://localhost:3000/", { waitUntil: "networkidle" });
await page.waitForTimeout(900);

for (const y of [0, 1600, 3200]) {
  await page.evaluate((y) => window.scrollTo(0, y), y);
  await page.waitForTimeout(400);
  const info = await page.evaluate(() => {
    const timeline = document.querySelector(".notebook-timeline");
    const container = timeline?.firstElementChild;
    const inner = container?.firstElementChild;
    const wrappers = inner ? Array.from(inner.children) : [];
    const rows = Array.from(document.querySelectorAll(".notebook-row"));
    return {
      scrollY: window.scrollY,
      innerHeight: window.innerHeight,
      timelineTop: timeline ? Math.round(timeline.getBoundingClientRect().top + window.scrollY) : null,
      innerHeightAbs: inner ? Math.round(inner.getBoundingClientRect().height) : null,
      mountedCount: wrappers.length,
      wrapperYs: wrappers.slice(0, 4).map((w) => ({
        top: Math.round(w.getBoundingClientRect().top + window.scrollY),
        transform: w.style.transform,
        dataIdx: w.dataset.index,
      })),
      rowYs: rows.slice(0, 4).map((r) => Math.round(r.getBoundingClientRect().top + window.scrollY)),
      lastWrapperTop: wrappers.length ? Math.round(wrappers[wrappers.length - 1].getBoundingClientRect().top + window.scrollY) : null,
      documentHeight: document.documentElement.scrollHeight,
    };
  });
  console.log(JSON.stringify({ scrolled: y, ...info }, null, 2));
}

await browser.close();
