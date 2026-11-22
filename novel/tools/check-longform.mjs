#!/usr/bin/env node
// Validate the revised novel's minimum chapter length.
// The standard is 3,000 Han characters of chapter BODY, excluding chapter heading,
// punctuation, whitespace, digits, and Latin letters.
//
// Usage: node novel/tools/check-longform.mjs [--strict]
// Non-strict mode reports progress without failing while the long rewrite is underway.
// Strict mode exits 1 until all chapters 16-500 meet the threshold.

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const minHan = 3000, first = 16, last = 500;
const strict = process.argv.includes('--strict');
const results = [];
for (let chapter = first; chapter <= last; chapter++) {
  const file = path.join(root, 'chapters', chapter + '.txt');
  let body = '';
  try {
    body = await readFile(file, 'utf8');
  } catch (err) {
    results.push({ chapter, han: 0, status: 'missing', error: err.message });
    continue;
  }
  body = body.replace(/^第[一二三四五六七八九十百千零〇0-9]+章[^\n]*\n/, '');
  const han = (body.match(/\p{Script=Han}/gu) || []).length;
  results.push({ chapter, han, status: han >= minHan ? 'pass' : 'short' });
}
const passed = results.filter(row => row.status === 'pass');
const failed = results.filter(row => row.status !== 'pass');
console.log('Long-form novel rewrite length audit');
console.log('Scope: chapters 16-500; minimum: 3000 Chinese Han characters per chapter body.');
console.log(`Passed: ${passed.length}/${results.length}; remaining: ${failed.length}`);
console.log(`Passing chapters: ${passed.map(row => row.chapter).join(', ') || '(none)'}`);
console.log(`First chapters needing revision: ${failed.slice(0, 20).map(row => `${row.chapter}(${row.han})`).join(', ')}`);
if (strict && failed.length) process.exitCode = 1;
