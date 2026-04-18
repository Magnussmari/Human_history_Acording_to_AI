#!/usr/bin/env node
/**
 * Aggregates individual year JSON files into 100-year chunks for the frontend.
 * Run from the repo root: node frontend/scripts/aggregate-data.mjs
 *
 * Also produces per-locale chunk trees for any locales present under
 * outputs/translations/<locale>/. Missing-locale years fall back to the
 * English source with a _locale_fallback: "en" marker so the UI never sees
 * a hole in the timeline.
 *
 * Output layout:
 *   frontend/public/data/{chunks,manifest.json}            — English (canonical)
 *   frontend/public/data/<locale>/{chunks,manifest.json}   — per-locale
 */

import fs from 'fs';
import path from 'path';

const JSON_DIR = process.env.JSON_DIR || path.resolve('outputs/json');
const TRANSLATIONS_DIR = path.resolve('outputs/translations');
const DATA_DIR = path.resolve('frontend/public/data');

fs.mkdirSync(DATA_DIR, { recursive: true });

const progressSrc = path.resolve('state/progress.json');
if (fs.existsSync(progressSrc)) {
  fs.copyFileSync(progressSrc, path.join(DATA_DIR, 'progress.json'));
  console.log('Copied progress.json');
}

const enFiles = fs.readdirSync(JSON_DIR).filter(f => f.endsWith('.json') && !f.includes('.tmp'));
const enByFilename = new Map();
const enYears = [];

for (const file of enFiles) {
  try {
    const data = JSON.parse(fs.readFileSync(path.join(JSON_DIR, file), 'utf8'));
    if (data.year !== undefined && data.events) {
      enByFilename.set(file, data);
      enYears.push(data);
    }
  } catch {
    console.error('Skip invalid (en):', file);
  }
}

console.log(`Loaded ${enYears.length} valid English year files`);

writeLocale('en', enYears, DATA_DIR);

const locales = discoverLocales();
for (const locale of locales) {
  const mergedYears = mergeLocale(locale, enByFilename);
  const outDir = path.join(DATA_DIR, locale);
  writeLocale(locale, mergedYears, outDir);
}

function discoverLocales() {
  if (!fs.existsSync(TRANSLATIONS_DIR)) return [];
  return fs.readdirSync(TRANSLATIONS_DIR)
    .filter(name => fs.statSync(path.join(TRANSLATIONS_DIR, name)).isDirectory());
}

function mergeLocale(locale, enByFilename) {
  const localeDir = path.join(TRANSLATIONS_DIR, locale);
  const localeByFilename = new Map();
  if (fs.existsSync(localeDir)) {
    for (const file of fs.readdirSync(localeDir)) {
      if (!file.endsWith('.json') || file.includes('.tmp')) continue;
      try {
        const data = JSON.parse(fs.readFileSync(path.join(localeDir, file), 'utf8'));
        localeByFilename.set(file, data);
      } catch {
        console.error(`Skip invalid (${locale}):`, file);
      }
    }
  }
  const out = [];
  let translated = 0;
  let fallback = 0;
  for (const [file, enDoc] of enByFilename.entries()) {
    const localeDoc = localeByFilename.get(file);
    if (localeDoc && localeDoc.year === enDoc.year && Array.isArray(localeDoc.events)) {
      out.push(localeDoc);
      translated++;
    } else {
      out.push({ ...enDoc, _locale_fallback: 'en' });
      fallback++;
    }
  }
  console.log(`Locale ${locale}: ${translated} translated, ${fallback} fallback(en)`);
  return out;
}

function writeLocale(locale, years, outDir) {
  const chunksDir = path.join(outDir, 'chunks');
  fs.mkdirSync(chunksDir, { recursive: true });

  years.sort((a, b) => b.year - a.year);

  const chunks = {};
  for (const year of years) {
    const centuryStart = Math.ceil(year.year / 100) * 100;
    const centuryEnd = centuryStart - 99;
    const key = `${centuryStart}_${centuryEnd}`;
    if (!chunks[key]) chunks[key] = [];
    chunks[key].push(year);
  }

  for (const [key, ys] of Object.entries(chunks)) {
    const filename = `chunk-${key.replace('_', '-to-')}.json`;
    fs.writeFileSync(path.join(chunksDir, filename), JSON.stringify(ys));
  }

  const translatedCount = years.filter(y => !y._locale_fallback).length;
  const manifest = {
    locale,
    total_years: years.length,
    total_events: years.reduce((sum, y) => sum + (y.events?.length || 0), 0),
    translated_years: translatedCount,
    fallback_years: years.length - translatedCount,
    year_range: {
      newest: Math.max(...years.map(y => y.year)),
      oldest: Math.min(...years.map(y => y.year)),
    },
    chunks: Object.entries(chunks)
      .map(([key, ys]) => ({
        file: `chunk-${key.replace('_', '-to-')}.json`,
        start: Math.max(...ys.map(y => y.year)),
        end: Math.min(...ys.map(y => y.year)),
        count: ys.length,
      }))
      .sort((a, b) => b.start - a.start),
    generated_at: new Date().toISOString(),
  };

  fs.writeFileSync(path.join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2));
  console.log(`  [${locale}] ${manifest.chunks.length} chunks, ${manifest.total_years} years, ${manifest.total_events} events → ${path.relative(process.cwd(), outDir)}`);
}
