/**
 * Generates abstract 1200×630 WebP cover images for every blog article and
 * how-to guide. Covers are deterministic (seeded by slug) and tinted by
 * category, so re-running only changes images for new or renamed content.
 *
 * Usage: npm run covers
 */
import { readFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const force = process.argv.includes("--force");

const palettes = {
  "ai-tools": ["#6d4aff", "#2f6bff", "#22b8cf"],
  automation: ["#10b981", "#06b6d4", "#2f6bff"],
  productivity: ["#3b82f6", "#6366f1", "#a78bfa"],
  "artificial-intelligence": ["#8b5cf6", "#ec4899", "#6366f1"],
  "machine-learning": ["#06b6d4", "#6366f1", "#14b8a6"],
  saas: ["#6366f1", "#0ea5e9", "#a855f7"],
  "software-development": ["#0ea5e9", "#22c55e", "#6366f1"],
  "cloud-technology": ["#38bdf8", "#6366f1", "#818cf8"],
  "business-technology": ["#f59e0b", "#6366f1", "#ef4444"],
  "getting-started": ["#8b5cf6", "#3b82f6", "#22d3ee"],
  "automation-workflows": ["#10b981", "#3b82f6", "#06b6d4"],
  "content-creation": ["#ec4899", "#f97316", "#8b5cf6"],
  "developer-guides": ["#0ea5e9", "#6366f1", "#22c55e"],
};

/** Extracts `{ slug, category }` pairs from a content data file. */
function readEntries(file) {
  const source = readFileSync(join(root, file), "utf8");
  const entries = [];
  const re = /slug:\s*"([^"]+)"[\s\S]*?category:\s*"([^"]+)"/g;
  let match;
  while ((match = re.exec(source))) entries.push({ slug: match[1], category: match[2] });
  return entries;
}

function rng(seed) {
  let h = 2166136261;
  for (const ch of seed) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return () => {
    h += 0x6d2b79f5;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function svgFor(slug, category) {
  const [a, b, c] = palettes[category] ?? palettes["ai-tools"];
  const r = rng(slug);
  const W = 1200;
  const H = 630;

  const orbs = Array.from({ length: 3 }, (_, i) => {
    const color = [a, b, c][i];
    return `<circle cx="${(0.15 + r() * 0.7) * W}" cy="${(0.1 + r() * 0.8) * H}" r="${180 + r() * 160}" fill="${color}" opacity="${0.45 + r() * 0.25}" filter="url(#blur)"/>`;
  }).join("");

  // A small "workflow graph" of nodes and connectors.
  const nodeCount = 6 + Math.floor(r() * 3);
  const nodes = Array.from({ length: nodeCount }, (_, i) => ({
    x: 140 + (i / (nodeCount - 1)) * (W - 280) + (r() - 0.5) * 60,
    y: H / 2 + (r() - 0.5) * 300,
    s: 34 + r() * 26,
  }));
  const links = nodes
    .slice(1)
    .map((n, i) => {
      const p = nodes[i];
      const mx = (p.x + n.x) / 2;
      return `<path d="M${p.x},${p.y} C${mx},${p.y} ${mx},${n.y} ${n.x},${n.y}" stroke="white" stroke-opacity="0.35" stroke-width="2.5" fill="none" stroke-dasharray="6 8"/>`;
    })
    .join("");
  const nodeShapes = nodes
    .map(
      (n, i) =>
        `<rect x="${n.x - n.s / 2}" y="${n.y - n.s / 2}" width="${n.s}" height="${n.s}" rx="${n.s * 0.28}" fill="white" fill-opacity="${i % 3 === 0 ? 0.95 : 0.16}" stroke="white" stroke-opacity="0.5"/>` +
        (i % 3 === 0 ? `<circle cx="${n.x}" cy="${n.y}" r="${n.s * 0.18}" fill="${[a, b, c][i % 3]}"/>` : ""),
    )
    .join("");

  const sparkles = Array.from({ length: 40 }, () => `<circle cx="${r() * W}" cy="${r() * H}" r="${r() * 1.8 + 0.4}" fill="white" opacity="${r() * 0.6 + 0.1}"/>`).join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#070b1f"/>
      <stop offset="1" stop-color="#151b45"/>
    </linearGradient>
    <filter id="blur" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="90"/></filter>
    <pattern id="grid" width="48" height="48" patternUnits="userSpaceOnUse">
      <path d="M48 0H0V48" fill="none" stroke="white" stroke-opacity="0.06" stroke-width="1"/>
    </pattern>
    <radialGradient id="vignette" cx="0.5" cy="0.5" r="0.75">
      <stop offset="0.6" stop-color="#000" stop-opacity="0"/>
      <stop offset="1" stop-color="#000" stop-opacity="0.45"/>
    </radialGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  ${orbs}
  <rect width="${W}" height="${H}" fill="url(#grid)"/>
  ${sparkles}
  ${links}
  ${nodeShapes}
  <rect width="${W}" height="${H}" fill="url(#vignette)"/>
</svg>`;
}

const jobs = [
  { file: "src/data/content/articles-a.ts", dir: "public/images/blog" },
  { file: "src/data/content/articles-b.ts", dir: "public/images/blog" },
  { file: "src/data/content/guides-content.ts", dir: "public/images/guides" },
];

let created = 0;
for (const job of jobs) {
  mkdirSync(join(root, job.dir), { recursive: true });
  for (const { slug, category } of readEntries(job.file)) {
    const out = join(root, job.dir, `${slug}.webp`);
    if (existsSync(out) && !force) continue;
    await sharp(Buffer.from(svgFor(slug, category))).webp({ quality: 78 }).toFile(out);
    created++;
    console.log("created", out.replace(root + "/", ""));
  }
}
console.log(`Done. ${created} cover(s) generated.`);
