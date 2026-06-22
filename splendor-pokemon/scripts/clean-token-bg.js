/**
 * Remove gray/white baked-in background from AI-generated token PNGs.
 * Makes all light-gray pixels transparent, keeping only the actual pokeball.
 */
import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { PNG } from 'pngjs';
import { join } from 'path';

const UI_DIR = join(import.meta.dirname, '..', 'public', 'assets', 'ui');
const TOKEN_FILES = [
  'token-red.png', 'token-blue.png', 'token-black.png',
  'token-pink.png', 'token-yellow.png', 'token-purple.png',
];

for (const filename of TOKEN_FILES) {
  const filepath = join(UI_DIR, filename);
  const backupPath = filepath + '.bak';

  console.log(`Processing ${filename}...`);
  const data = readFileSync(filepath);
  const png = PNG.sync.read(data);

  console.log(`  ${png.width}x${png.height}, ${png.data.length} bytes raw`);

  let bgRemoved = 0;
  let totalPixels = png.width * png.height;

  for (let i = 0; i < png.data.length; i += 4) {
    const r = png.data[i];
    const g = png.data[i + 1];
    const b = png.data[i + 2];
    const a = png.data[i + 3];

    // Detect "background-ish" pixels:
    // 1. Already transparent — keep as-is
    // 2. Light gray/white (all channels > 200) — make transparent
    // 3. Gray with low saturation — likely background
    const isLightGray = r > 200 && g > 200 && b > 200;
    const maxC = Math.max(r, g, b);
    const minC = Math.min(r, g, b);
    const isGrayish = (maxC - minC) < 20 && maxC > 150 && maxC < 240;

    if (isLightGray || isGrayish) {
      png.data[i + 3] = 0; // make transparent
      bgRemoved++;
    }
  }

  // Save backup first
  writeFileSync(backupPath, data);
  // Write cleaned version
  const cleaned = PNG.sync.write(png);
  writeFileSync(filepath, cleaned);

  const pct = ((bgRemoved / totalPixels) * 100).toFixed(1);
  console.log(`  Removed ${bgRemoved} background pixels (${pct}%)`);
  console.log(`  Original: ${(data.length / 1024).toFixed(0)} KB → Cleaned: ${(cleaned.length / 1024).toFixed(0)} KB`);
  console.log(`  Backup saved to ${filename}.bak`);
  console.log();
}

console.log('Done! All token backgrounds cleaned.');
console.log('Backup files (*.bak) can be deleted once you verify the result.');
