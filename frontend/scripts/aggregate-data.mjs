#!/usr/bin/env node
/**
 * Aggregates individual year JSON files into 100-year chunks for the frontend.
 * Run from the repo root: node frontend/scripts/aggregate-data.mjs
 */

import fs from 'fs';
import path from 'path';

const JSON_DIR = process.env.JSON_DIR || path.resolve('outputs/json');
const OUT_DIR = path.resolve('frontend/public/data/chunks');
const DATA_DIR = path.resolve('frontend/public/data');

// Ensure output dirs exist
fs.mkdirSync(OUT_DIR, { recursive: true });
fs.mkdirSync(DATA_DIR, { recursive: true });

// Copy progress.json
const progressSrc = path.resolve('state/progress.json');
if (fs.existsSync(progressSrc)) {
  fs.copyFileSync(progressSrc, path.join(DATA_DIR, 'progress.json'));
  console.log('Copied progress.json');
}

// Read all year JSON files
const files = fs.readdirSync(JSON_DIR).filter(f => f.endsWith('.json') && !f.includes('.tmp'));
const allYears = [];

for (const file of files) {
  try {
    const data = JSON.parse(fs.readFileSync(path.join(JSON_DIR, file), 'utf8'));
    if (data.year !== undefined && data.events) {
      allYears.push(data);
    }
  } catch {
    console.error('Skip invalid:', file);
  }
}

console.log(`Loaded ${allYears.length} valid year files`);

// Sort descending
allYears.sort((a, b) => b.year - a.year);

// Create 100-year chunks
const chunks = {};
for (const year of allYears) {
  const centuryStart = Math.ceil(year.year / 100) * 100;
  const centuryEnd = centuryStart - 99;
  const key = `${centuryStart}_${centuryEnd}`;
  if (!chunks[key]) chunks[key] = [];
  chunks[key].push(year);
}

// Write chunk files
for (const [key, years] of Object.entries(chunks)) {
  const filename = `chunk-${key.replace('_', '-to-')}.json`;
  fs.writeFileSync(path.join(OUT_DIR, filename), JSON.stringify(years));
  console.log(`  ${filename}: ${years.length} years`);
}

// Write manifest
const manifest = {
  total_years: allYears.length,
  total_events: allYears.reduce((sum, y) => sum + (y.events?.length || 0), 0),
  year_range: {
    newest: Math.max(...allYears.map(y => y.year)),
    oldest: Math.min(...allYears.map(y => y.year)),
  },
  chunks: Object.entries(chunks)
    .map(([key, years]) => ({
      file: `chunk-${key.replace('_', '-to-')}.json`,
      start: Math.max(...years.map(y => y.year)),
      end: Math.min(...years.map(y => y.year)),
      count: years.length,
    }))
    .sort((a, b) => b.start - a.start),
  generated_at: new Date().toISOString(),
};

fs.writeFileSync(path.join(DATA_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2));
console.log(`\nManifest: ${manifest.chunks.length} chunks, ${manifest.total_years} years, ${manifest.total_events} events`);
