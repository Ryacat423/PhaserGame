// One-time asset optimization. The originals stay in git history (commit before 'Optimize assets').
//
//   node scripts/optimize-assets.mjs            # images: repack sheets, convert to WebP, drop unused
//   node scripts/optimize-assets.mjs --audio    # audio: re-encode to MP3 with ffmpeg (needs ffmpeg on PATH)
//
// After running, src/ references are rewritten to the new file names.
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const root = path.resolve(import.meta.dirname, '..');
const pub = path.join(root, 'public');
const srcDir = path.join(root, 'src');
const walk = (d) => fs.readdirSync(d, { withFileTypes: true })
  .flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));
const rel = (f) => path.relative(pub, f).split(path.sep).join('/');
const kb = (n) => `${(n / 1024).toFixed(0)}K`;

/**
 * Spritesheets are drawn far smaller than their source frames, and several sheets exceed the
 * 4096px texture limit of many phone GPUs. Repack each into smaller frames, keeping frame order,
 * and only the frames the animations use. `ratio` in src/config/sprites.ts must match newW / w.
 */
const SHEETS = [
  { file: 'assets/sprites/dog_sprite.png', w: 1005, h: 950, frames: 61, newW: 280, newH: 265, cols: 8 },
  { file: 'assets/sprites/cat_sprite2.png', w: 480, h: 480, frames: 102, newW: 240, newH: 240, cols: 11 },
  { file: 'assets/sprites/snow.png', w: 1000, h: 600, frames: 101, newW: 400, newH: 240, cols: 10 },
  { file: 'assets/sprites/bonfire.png', w: 392, h: 626, frames: 106, newW: 98, newH: 156, cols: 15 },
  { file: 'assets/sprites/lightning.png', w: 270, h: 480, frames: 23, newW: 270, newH: 480, cols: 8 },
  { file: 'assets/sprites/cat_idle.png', w: 125, h: 150, frames: 12, newW: 125, newH: 150, cols: 12 }
];

// Largest size any plain image is drawn at is the 1000x600 canvas; allow 2x for sharp screens.
const MAX_W = 2000;
const MAX_H = 1200;

const renames = new Map(); // old public path -> new public path
const deleted = [];

async function repackSheet(s) {
  const input = path.join(pub, s.file);
  const meta = await sharp(input).metadata();
  const srcCols = Math.floor(meta.width / s.w);
  const rows = Math.ceil(s.frames / s.cols);
  const composites = [];
  for (let i = 0; i < s.frames; i++) {
    const sx = (i % srcCols) * s.w;
    const sy = Math.floor(i / srcCols) * s.h;
    const tile = await sharp(input)
      .extract({ left: sx, top: sy, width: s.w, height: s.h })
      .resize(s.newW, s.newH, { fit: 'fill', kernel: 'lanczos3' })
      .png()
      .toBuffer();
    composites.push({ input: tile, left: (i % s.cols) * s.newW, top: Math.floor(i / s.cols) * s.newH });
  }
  const out = input.replace(/\.png$/, '.webp');
  await sharp({
    create: { width: s.cols * s.newW, height: rows * s.newH, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } }
  })
    .composite(composites)
    .webp({ quality: 88, alphaQuality: 100, effort: 6 })
    .toFile(out);
  report(input, out, `${meta.width}x${meta.height} -> ${s.cols * s.newW}x${rows * s.newH}`);
}

async function convertImage(input) {
  const meta = await sharp(input).metadata();
  const out = input.replace(/\.(png|jpe?g)$/i, '.webp');
  let img = sharp(input);
  if (meta.width > MAX_W || meta.height > MAX_H) {
    img = img.resize(MAX_W, MAX_H, { fit: 'inside', withoutEnlargement: true });
  }
  await img.webp({ quality: 85, alphaQuality: 100, effort: 6 }).toFile(out);
  const m2 = await sharp(out).metadata();
  report(input, out, meta.width !== m2.width ? `${meta.width}x${meta.height} -> ${m2.width}x${m2.height}` : '');
}

function report(input, out, note) {
  const before = fs.statSync(input).size;
  const after = fs.statSync(out).size;
  console.log(`${kb(before).padStart(7)} -> ${kb(after).padStart(6)}  ${rel(input)} ${note}`);
  if (input !== out) {
    renames.set(rel(input), rel(out));
    fs.unlinkSync(input);
  }
}

function referencedIn(src, file) {
  // Match the path without extension followed by a dot, so 'cat_sprite' doesn't match 'cat_sprite2.png'.
  return src.includes(file.replace(/\.[^.]+$/, '') + '.');
}

function removeUnused(src) {
  for (const f of walk(pub)) {
    const r = rel(f);
    if (r === 'favicon.ico') continue;
    if (!referencedIn(src, r)) {
      deleted.push(`${kb(fs.statSync(f).size).padStart(7)}  ${r}`);
      fs.unlinkSync(f);
    }
  }
}

function rewriteSources() {
  for (const f of walk(srcDir)) {
    let text = fs.readFileSync(f, 'utf8');
    let changed = false;
    for (const [from, to] of renames) {
      if (text.includes(from)) {
        text = text.split(from).join(to);
        changed = true;
      }
    }
    if (changed) fs.writeFileSync(f, text);
  }
}

function encodeAudio(input) {
  // MP3 plays in every browser, so each sound stays a single file and the load.audio calls don't change.
  const isMusic = fs.statSync(input).size > 400 * 1024;
  const out = input.replace(/\.(wav|mp3|ogg)$/i, '.mp3');
  const tmp = `${out}.tmp.mp3`;
  execFileSync('ffmpeg', [
    '-y', '-loglevel', 'error', '-i', input, '-vn',
    '-ac', isMusic ? '2' : '1', '-ar', '44100',
    '-c:a', 'libmp3lame', '-b:a', isMusic ? '96k' : '64k', tmp
  ]);
  const before = fs.statSync(input).size;
  fs.unlinkSync(input);
  fs.renameSync(tmp, out);
  console.log(`${kb(before).padStart(7)} -> ${kb(fs.statSync(out).size).padStart(6)}  ${rel(input)}`);
  if (input !== out) renames.set(rel(input), rel(out));
}

const src = walk(srcDir).map((f) => fs.readFileSync(f, 'utf8')).join('\n');

if (process.argv.includes('--audio')) {
  for (const f of walk(pub).filter((f) => /\.(wav|mp3|ogg)$/i.test(f))) encodeAudio(f);
  rewriteSources();
} else {
  removeUnused(src);
  const sheetFiles = new Set(SHEETS.map((s) => s.file));
  for (const s of SHEETS) await repackSheet(s);
  for (const f of walk(pub).filter((f) => /\.(png|jpe?g)$/i.test(f) && !sheetFiles.has(rel(f)))) {
    await convertImage(f);
  }
  rewriteSources();
  console.log('\nRemoved (not referenced in src/):\n' + deleted.join('\n'));
}
