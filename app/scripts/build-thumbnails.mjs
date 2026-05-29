#!/usr/bin/env node
// Pre-build step: generate 192×192 webp thumbnails for every plate in
// public/images/woodcuts/ into public/images/woodcuts/thumbs/.
//
// The Library index references these so a row's thumbnail is ~20 KB
// instead of CSS-scaling the full ~2 MB plate. Run as the `prebuild`
// npm lifecycle script. Idempotent — re-encodes only when the source
// is newer than the existing thumbnail.

import { readdir, mkdir, stat } from 'node:fs/promises';
import { join, basename, extname } from 'node:path';
import sharp from 'sharp';

const SRC_DIR = 'public/images/woodcuts';
const THUMB_DIR = 'public/images/woodcuts/thumbs';
const SIZE = 192;     // 2× the 96px display size, for retina
const QUALITY = 80;

let entries;
try {
  entries = await readdir(SRC_DIR);
} catch (e) {
  if (e.code === 'ENOENT') {
    console.log(`[thumbs] ${SRC_DIR} does not exist — nothing to do.`);
    process.exit(0);
  }
  throw e;
}

const images = entries.filter((f) => /\.(png|jpe?g|webp)$/i.test(f));
await mkdir(THUMB_DIR, { recursive: true });

let built = 0, skipped = 0;
for (const file of images) {
  const src = join(SRC_DIR, file);
  const base = basename(file, extname(file));
  const dst = join(THUMB_DIR, `${base}.webp`);
  try {
    const [s, d] = await Promise.all([stat(src), stat(dst)]);
    if (d.mtimeMs >= s.mtimeMs) { skipped++; continue; }
  } catch { /* dst missing — build it */ }
  await sharp(src)
    .resize(SIZE, SIZE, { fit: 'cover', position: 'center' })
    .webp({ quality: QUALITY })
    .toFile(dst);
  built++;
  console.log(`[thumbs] ${file} → ${base}.webp`);
}

console.log(`[thumbs] done: ${built} built, ${skipped} up-to-date.`);
