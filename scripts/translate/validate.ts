/**
 * CLI: validate a single JSON file against ICCRA schema.
 * Usage: tsx validate.ts <path-to.json>
 *
 * @orchestrator Magnus Smárason | smarason.is
 * @created 2026-04-18
 */

import { readFile } from "node:fs/promises";
import { validateYearDoc } from "./schema.js";

async function main(): Promise<void> {
  const file = process.argv[2];
  if (!file) {
    console.error("Usage: tsx validate.ts <path-to.json>");
    process.exit(2);
  }
  const raw = await readFile(file, "utf8");
  const doc = JSON.parse(raw);
  const report = validateYearDoc(doc);
  if (report.valid) {
    console.log(`OK: ${file} passes ICCRA schema.`);
    process.exit(0);
  }
  console.error(`FAIL: ${file} has ${report.errors.length} error(s):`);
  for (const e of report.errors) console.error(`  ${e}`);
  process.exit(1);
}

main().catch((err) => {
  console.error("FATAL:", err);
  process.exit(1);
});
