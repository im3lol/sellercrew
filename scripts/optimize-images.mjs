// One-off asset optimizer. The agent avatars and brand art shipped as ~1 MB PNGs
// each (~17 MB total) and are rendered at small sizes via <img>, so they were the
// dominant page weight. This resizes + recompresses them in place. Originals are
// in git history if a larger source is ever needed again.
//
// Run: bun scripts/optimize-images.mjs
import sharp from "sharp";
import { readFile, writeFile, stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "public");

// [relativePath, maxWidth] — sized generously for retina at their display size.
const targets = [
  ...["ali", "saleem", "noor", "raed", "fares", "hakim", "bayan", "nadeem", "rayan", "adam", "badr"].map(
    (a) => [`agents/${a}.png`, 384]
  ),
  ["logo2.png", 256],
  ["logo-text.png", 640],
  ["brand-guide.png", 1280],
  ["brand/sellercrew-wordmark-glow.png", 1280],
  ["brand/sellercrew-brand-board.png", 1280],
];

let before = 0;
let after = 0;

for (const [rel, maxWidth] of targets) {
  const file = path.join(root, rel);
  try {
    const input = await readFile(file);
    before += input.length;
    const out = await sharp(input)
      .resize({ width: maxWidth, withoutEnlargement: true })
      .png({ compressionLevel: 9, quality: 80, effort: 8 })
      .toBuffer();
    // Only write if we actually saved space.
    if (out.length < input.length) {
      await writeFile(file, out);
      after += out.length;
      console.log(`✓ ${rel}: ${(input.length / 1024).toFixed(0)}KB → ${(out.length / 1024).toFixed(0)}KB`);
    } else {
      after += input.length;
      console.log(`= ${rel}: already optimal (${(input.length / 1024).toFixed(0)}KB)`);
    }
  } catch (err) {
    console.warn(`! skipped ${rel}: ${err.message}`);
  }
}

console.log(`\nTotal: ${(before / 1024 / 1024).toFixed(2)}MB → ${(after / 1024 / 1024).toFixed(2)}MB`);
