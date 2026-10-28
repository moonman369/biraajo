// Pixel diff between two capture runs.
//   node diff.mjs <labelA> <labelB> [threshold]
// Writes diff PNGs to <OUT_DIR>/diff-<A>-vs-<B>/ and prints one line per screenshot. Exit 1 if anything differs.
import fs from "node:fs";
import path from "node:path";
import { PNG } from "pngjs";
import pixelmatch from "pixelmatch";
import { OUT_DIR } from "./config.mjs";

const [a, b, thr] = process.argv.slice(2);
if (!a || !b) { console.error("usage: node diff.mjs <labelA> <labelB> [threshold]"); process.exit(1); }
const dirA = path.join(OUT_DIR, a);
const dirB = path.join(OUT_DIR, b);
const outDir = path.join(OUT_DIR, `diff-${a}-vs-${b}`);
fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });

const names = [...new Set([...fs.readdirSync(dirA), ...fs.readdirSync(dirB)])].filter((n) => n.endsWith(".png")).sort();
let differing = 0;
for (const n of names) {
  const fa = path.join(dirA, n);
  const fb = path.join(dirB, n);
  if (!fs.existsSync(fa) || !fs.existsSync(fb)) {
    console.log(`MISSING  ${n} (only in ${fs.existsSync(fa) ? a : b})`);
    differing++;
    continue;
  }
  const pa = PNG.sync.read(fs.readFileSync(fa));
  const pb = PNG.sync.read(fs.readFileSync(fb));
  if (pa.width !== pb.width || pa.height !== pb.height) {
    console.log(`SIZE     ${n} ${pa.width}x${pa.height} vs ${pb.width}x${pb.height}`);
    differing++;
    continue;
  }
  const diff = new PNG({ width: pa.width, height: pa.height });
  const px = pixelmatch(pa.data, pb.data, diff.data, pa.width, pa.height, { threshold: Number(thr ?? 0) });
  if (px > 0) {
    // Largest per-channel change: 1-3 is colour rounding, anything bigger needs a look.
    let maxDelta = 0;
    for (let i = 0; i < pa.data.length; i += 4) {
      for (let c = 0; c < 3; c++) maxDelta = Math.max(maxDelta, Math.abs(pa.data[i + c] - pb.data[i + c]));
    }
    fs.writeFileSync(path.join(outDir, n), PNG.sync.write(diff));
    console.log(`DIFF     ${n} ${px} px (${((px / (pa.width * pa.height)) * 100).toFixed(3)}%), max channel delta ${maxDelta}`);
    differing++;
  } else {
    console.log(`same     ${n}`);
  }
}
console.log(`\n${names.length} compared, ${differing} differ`);
process.exit(differing ? 1 : 0);
