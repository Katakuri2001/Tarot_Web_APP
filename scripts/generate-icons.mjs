/**
 * Generate the raster icon set from app/icon.svg.
 *
 * app/icon.svg is the single source of truth for the Velora mark. Next serves
 * it directly and browsers render SVG favicons fine, but iOS does not honour
 * SVG for a home-screen icon, and the bare /favicon.ico probe that some
 * clients and crawlers use needs a real .ico. So both are derived from the SVG
 * rather than drawn by hand — that way swapping in real brand artwork later
 * means replacing the SVG and re-running this, not redesigning anything.
 *
 * Usage:
 *   node scripts/generate-icons.mjs
 *
 * Requires `sharp`. It is currently only a transitive dependency (Next pulls
 * it in), so this script is not guaranteed to run on a clean checkout until it
 * is declared in devDependencies. The generated files are committed, so a
 * normal `npm run build` never needs it.
 */

import { readFileSync, writeFileSync, existsSync, rmSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");

const SOURCE = resolve(root, "app/icon.svg");
const APPLE_PNG = resolve(root, "app/apple-icon.png");
const FAVICON_ICO = resolve(root, "app/favicon.ico");

/** Inert leftover from V1. Next's convention is apple-icon.*, so this was never served. */
const DEAD_APPLE_SVG = resolve(root, "app/apple-touch-icon.svg");

/**
 * iOS home-screen icon. 180x180 is what iOS expects for apple-touch-icon.
 */
const APPLE_SIZE = 180;

/** Sizes packed into the .ico, smallest first. */
const ICO_SIZES = [16, 32, 48];

let sharp;
try {
  ({ default: sharp } = await import("sharp"));
} catch {
  console.error(
    "This script needs `sharp`. It ships transitively with Next today, but is\n" +
      "not a declared dependency. Install it with:\n\n  npm i -D sharp\n"
  );
  process.exit(1);
}

/**
 * Pack PNG buffers into a single .ico container.
 *
 * Each image is stored PNG-compressed, which is valid for every browser that
 * matters and avoids re-encoding. Layout: a 6-byte ICONDIR, a 16-byte
 * ICONDIRENTRY per image, then the image payloads back to back.
 */
function packIco(pngs) {
  const HEADER = 6;
  const ENTRY = 16;
  const dirSize = HEADER + ENTRY * pngs.length;
  const offset = dirSize;

  const header = Buffer.alloc(HEADER);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: 1 = icon
  header.writeUInt16LE(pngs.length, 4);

  let cursor = offset;
  const entries = [];
  for (const { size, data } of pngs) {
    const entry = Buffer.alloc(ENTRY);
    // A dimension byte of 0 means 256; our sizes are all under that.
    entry.writeUInt8(size, 0);
    entry.writeUInt8(size, 1);
    entry.writeUInt8(0, 2); // palette size: 0 = truecolour
    entry.writeUInt8(0, 3); // reserved
    entry.writeUInt16LE(1, 4); // colour planes
    entry.writeUInt16LE(32, 6); // bits per pixel
    entry.writeUInt32LE(data.length, 8);
    entry.writeUInt32LE(cursor, 12);
    entries.push(entry);
    cursor += data.length;
  }

  return Buffer.concat([header, ...entries, ...pngs.map((p) => p.data)]);
}

async function main() {
  if (!existsSync(SOURCE)) {
    console.error(`Source icon missing: ${SOURCE}`);
    process.exit(1);
  }

  const svg = readFileSync(SOURCE);

  // A high density hint keeps the vector's curves smooth while downscaling,
  // so 16px is resampled from a detailed raster rather than a 32px one.
  const render = (size) =>
    sharp(svg, { density: 384 }).resize(size, size, { fit: "contain" }).png();

  const applePng = await render(APPLE_SIZE).toBuffer();
  writeFileSync(APPLE_PNG, applePng);
  console.log(`wrote app/apple-icon.png (${APPLE_SIZE}x${APPLE_SIZE}, ${applePng.length} bytes)`);

  const pngs = [];
  for (const size of ICO_SIZES) {
    pngs.push({ size, data: await render(size).toBuffer() });
  }
  const ico = packIco(pngs);
  writeFileSync(FAVICON_ICO, ico);
  console.log(
    `wrote app/favicon.ico (${ICO_SIZES.join("/")}px, ${ico.length} bytes)`
  );

  if (existsSync(DEAD_APPLE_SVG)) {
    rmSync(DEAD_APPLE_SVG);
    console.log("removed app/apple-touch-icon.svg (inert: Next uses apple-icon.*)");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});