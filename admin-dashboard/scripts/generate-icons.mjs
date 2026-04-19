import sharp from 'sharp';
import { Buffer } from 'node:buffer';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const SOURCE = resolve(here, '../../Easy Circle.png');
const OUT_DIR = resolve(here, '../public');

await mkdir(OUT_DIR, { recursive: true });

const { width, height } = await sharp(SOURCE).metadata();
const side = Math.min(width, height);
const left = Math.round((width - side) / 2);
const top = Math.round((height - side) / 2);

function circleMask(size) {
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="white"/></svg>`
  );
}

async function render(size, filename) {
  await sharp(SOURCE)
    .extract({ left, top, width: side, height: side })
    .resize(size, size)
    .composite([{ input: circleMask(size), blend: 'dest-in' }])
    .png()
    .toFile(resolve(OUT_DIR, filename));
  console.log(`wrote ${filename} (${size}x${size})`);
}

await render(512, 'icon-512.png');
await render(192, 'icon-192.png');
await render(180, 'apple-touch-icon.png');
