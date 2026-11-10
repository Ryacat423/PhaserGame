// Lists every file in public/ with its size, image dimensions, and whether src/ references it.
// Usage: node scripts/asset-report.mjs
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const walk = (d) => fs.readdirSync(d, { withFileTypes: true })
  .flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));
const src = walk(path.join(root, 'src')).map((f) => fs.readFileSync(f, 'utf8')).join('\n');
const pub = path.join(root, 'public');

let total = 0;
for (const f of walk(pub).sort((a, b) => fs.statSync(b).size - fs.statSync(a).size)) {
  const rel = path.relative(pub, f).split(path.sep).join('/');
  const size = fs.statSync(f).size;
  total += size;
  const base = rel.replace(/\.[^.]+$/, '');
  const used = src.includes(base) ? '' : '  UNUSED';
  let dim = '';
  if (/\.(png|jpe?g|gif|webp)$/i.test(f)) {
    const m = await sharp(f).metadata();
    dim = `${m.width}x${m.height}${m.hasAlpha ? ' a' : ''}`;
  }
  console.log(`${(size / 1024).toFixed(0).padStart(6)}K  ${dim.padEnd(13)} ${rel}${used}`);
}
console.log(`total ${(total / 1048576).toFixed(2)} MB`);
