// Build src/compositions/wire/gb-wire.json for the NewsWire composition: a dot-matrix globe,
// turned so Britain faces the viewer, land as evenly spaced dots (Britain's in gold).
//
// Points are places, not member data: UK towns, plus diaspora cities (Caribbean, Africa,
// the Americas, and the European cities of BLKOUT's own network history).
//
// Usage: NODE_PATH=<dir with d3-geo> node scripts/build-wire-geometry.mjs <ne_50m_admin_0_countries.geojson>
// (d3-geo is a build-time tool here, not an app dependency.)
import { readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(process.env.NODE_PATH + "/");
const { geoOrthographic, geoContains, geoDistance } = require("d3-geo");

const SIZE = 1000;
const FACING = [-14, 36];  // turned so Britain sits upper-centre with the Caribbean and Africa in view
const STEP = 1.6;          // degrees between land dots
const projection = geoOrthographic().rotate([-FACING[0], -FACING[1]]).scale(SIZE / 2 - 10).translate([SIZE / 2, SIZE / 2]).clipAngle(90);

const world = JSON.parse(readFileSync(process.argv[2], "utf8"));
const UK = new Set(["United Kingdom", "Isle of Man"]);
const ukFeatures = world.features.filter((f) => UK.has(f.properties.ADMIN));

// Even dots on the sphere: latitude rows, with longitude spacing widened towards the poles.
const dots = [], ukDots = [];
for (let lat = -80; lat <= 82; lat += STEP) {
  const lonStep = STEP / Math.max(0.2, Math.cos((lat * Math.PI) / 180));
  for (let lon = -180; lon < 180; lon += lonStep) {
    if (geoDistance(FACING, [lon, lat]) > Math.PI / 2 - 0.02) continue; // far side of the globe
    const feature = world.features.find((f) => geoContains(f, [lon, lat]));
    if (!feature) continue;
    const [x, y] = projection([lon, lat]);
    (UK.has(feature.properties.ADMIN) ? ukDots : dots).push([Math.round(x * 10) / 10, Math.round(y * 10) / 10]);
  }
}
// Britain is small at this scale: add a finer gold grid inside it so its shape reads.
for (let lat = 49.8; lat <= 61; lat += 0.45) {
  for (let lon = -8.7; lon <= 2; lon += 0.45 / Math.cos((lat * Math.PI) / 180)) {
    if (ukFeatures.some((f) => geoContains(f, [lon, lat]))) {
      const [x, y] = projection([lon, lat]);
      ukDots.push([Math.round(x * 10) / 10, Math.round(y * 10) / 10]);
    }
  }
}

const UK_TOWNS = [
  ["London", -0.12, 51.5], ["Birmingham", -1.89, 52.48], ["Manchester", -2.24, 53.48], ["Leeds", -1.55, 53.8],
  ["Bristol", -2.59, 51.45], ["Cardiff", -3.18, 51.48], ["Glasgow", -4.25, 55.86], ["Belfast", -5.93, 54.6],
  ["Newcastle", -1.61, 54.97],
];
const DIASPORA = [
  ["Kingston", -76.79, 17.99], ["Port of Spain", -61.52, 10.65], ["Bridgetown", -59.6, 13.1],
  ["Lagos", 3.38, 6.52], ["Accra", -0.19, 5.6], ["Addis Ababa", 38.75, 9.03], ["Nairobi", 36.82, -1.29],
  ["Johannesburg", 28.05, -26.2], ["Salvador", -38.5, -12.97],
  ["New York", -74.0, 40.7], ["Toronto", -79.38, 43.65], ["Atlanta", -84.39, 33.75],
  ["Amsterdam", 4.9, 52.37], ["Paris", 2.35, 48.86], ["Lisbon", -9.14, 38.72], ["Berlin", 13.4, 52.52],
];
for (const [name, lon, lat] of [...UK_TOWNS, ...DIASPORA]) {
  if (geoDistance(FACING, [lon, lat]) > Math.PI / 2 - 0.05) throw new Error(`FAILED: ${name} is on the far side of the globe`);
}
const toNode = ([name, lon, lat], kind) => {
  const [x, y] = projection([lon, lat]);
  return { name, kind, x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 };
};
const nodes = [...UK_TOWNS.map((t) => toNode(t, "uk")), ...DIASPORA.map((t) => toNode(t, "diaspora"))];
const hub = 0;
const idx = (name) => nodes.findIndex((n) => n.name === name);

const edges = new Set();
const add = (a, b) => edges.add(a < b ? `${a},${b}` : `${b},${a}`);
for (const n of ["Birmingham", "Manchester", "Leeds", "Bristol", "Cardiff", "Glasgow", "Belfast", "Newcastle"]) add(hub, idx(n));
const OUT = {
  London: ["Kingston", "Lagos", "Accra", "Nairobi", "New York", "Paris", "Amsterdam", "Port of Spain", "Johannesburg"],
  Birmingham: ["Kingston", "Bridgetown", "Toronto"],
  Manchester: ["Lagos", "Atlanta", "Addis Ababa"],
  Bristol: ["Salvador", "Lisbon"],
  Leeds: ["Berlin"],
  Glasgow: ["Toronto"],
};
for (const [from, tos] of Object.entries(OUT)) for (const to of tos) add(idx(from), idx(to));

const dotPath = (pts, r) => pts.map(([x, y]) => `M${x - r},${y}a${r},${r} 0 1,0 ${2 * r},0a${r},${r} 0 1,0 ${-2 * r},0`).join("");
const out = {
  viewBox: [0, 0, SIZE, SIZE],
  globe: { cx: SIZE / 2, cy: SIZE / 2, r: SIZE / 2 - 10 },
  landDots: dotPath(dots, 3.2),
  ukDots: dotPath(ukDots, 2.4),
  nodes,
  edges: [...edges].map((e) => e.split(",").map(Number)),
  hub,
  source: "Natural Earth 1:50m admin-0 countries (public domain)",
};
writeFileSync("src/compositions/wire/gb-wire.json", JSON.stringify(out));
console.log(`gb-wire.json: ${dots.length} land dots, ${ukDots.length} UK dots, ${nodes.length} places, ${out.edges.length} wires, ${Math.round(JSON.stringify(out).length / 1024)} KB`);
