import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const SOURCE = resolve(here, '../../Easy Circle.png');
const OUT_DIR = resolve(here, '../public');

const BG = { r: 0x14, g: 0x12, b: 0x0f, alpha: 1 };

await mkdir(OUT_DIR, { recursive: true });

const { width, height } = await sharp(SOURCE).metadata();
const side = Math.min(width, height);
const left = Math.round((width - side) / 2);
const top = Math.round((height - side) / 2);

async function render(size, filename) {
  await sharp(SOURCE)
    .extract({ left, top, width: side, height: side })
    .resize(size, size, { fit: 'contain', background: BG })
    .flatten({ background: BG })
    .png()
    .toFile(resolve(OUT_DIR, filename));
  console.log(`wrote ${filename} (${size}x${size})`);
}

await render(512, 'icon-512.png');
await render(192, 'icon-192.png');
await render(180, 'apple-touch-icon.png');
