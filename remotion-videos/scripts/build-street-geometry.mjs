// Build src/compositions/wire/street-wire.json for NewsWire's hyperlocal scale: an indicative
// UK neighbourhood at street level — a curving high street, terraced side streets at uneven
// angles, a railway — with homes as dots. Generated, not traced from any real place, so no
// real street or home is identifiable (Rob, 18 Oct 2026).
//
// Usage: node scripts/build-street-geometry.mjs
import { writeFileSync } from "node:fs";

const SIZE = 1000, R = SIZE / 2 - 10, C = SIZE / 2;
let seed = 7;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const inside = ([x, y], m = 0) => Math.hypot(x - C, y - C) < R - m;
const r1 = (v) => Math.round(v * 10) / 10;

// High street: a gentle curve across the circle.
const hs = (t) => {
  const a = [30, 640], c = [520, 430], b = [980, 470];
  const u = 1 - t;
  return [u * u * a[0] + 2 * u * t * c[0] + t * t * b[0], u * u * a[1] + 2 * u * t * c[1] + t * t * b[1]];
};
const hsTangent = (t) => { const p = hs(t), q = hs(Math.min(1, t + 0.01)); const l = Math.hypot(q[0] - p[0], q[1] - p[1]); return [(q[0] - p[0]) / l, (q[1] - p[1]) / l]; };

const streets = [];       // polylines
const houses = [];        // [x, y]
const sample = (pts, step) => {
  const out = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const [x1, y1] = pts[i], [x2, y2] = pts[i + 1];
    const n = Math.max(1, Math.round(Math.hypot(x2 - x1, y2 - y1) / step));
    for (let k = 0; k < n; k++) out.push([x1 + ((x2 - x1) * k) / n, y1 + ((y2 - y1) * k) / n, x2 - x1, y2 - y1]);
  }
  return out;
};
const terrace = (pts, gap = 15, off = 17) => {
  for (const [x, y, dx, dy] of sample(pts, gap)) {
    const l = Math.hypot(dx, dy), nx = -dy / l, ny = dx / l;
    for (const side of [1, -1]) {
      const h = [x + nx * off * side, y + ny * off * side];
      if (inside(h, 8)) houses.push(h);
    }
  }
};

const high = Array.from({ length: 41 }, (_, i) => hs(i / 40));
streets.push({ pts: high, w: 16 });

// Side streets branching both ways off the high street, at uneven angles, some kinking.
const sideEnds = [];
for (let t = 0.08; t < 0.95; t += 0.1 + rnd() * 0.04) {
  const [x, y] = hs(t), [tx, ty] = hsTangent(t);
  for (const dir of [1, -1]) {
    if (rnd() < 0.15) continue;
    // Perpendicular to the high street, turned by up to ~20° either way, kinking once.
    const base = Math.atan2(tx * dir, -ty * dir) + (rnd() - 0.5) * 0.7;
    const len = 260 + rnd() * 260;
    const mid = [x + Math.cos(base) * len * 0.55, y + Math.sin(base) * len * 0.55];
    const kink = base + (rnd() - 0.5) * 0.6;
    const end = [mid[0] + Math.cos(kink) * len * 0.45, mid[1] + Math.sin(kink) * len * 0.45];
    const pts = [[x, y], mid, end];
    streets.push({ pts, w: 9 });
    terrace([[x + Math.cos(base) * 30, y + Math.sin(base) * 30], mid, end]);
    sideEnds.push({ mid, end });
  }
}
// A back street joining some side-street midpoints, so it reads as a neighbourhood, not a comb.
const upper = sideEnds.filter((s) => s.mid[1] < 380).sort((a, b) => a.mid[0] - b.mid[0]).map((s) => s.mid);
if (upper.length > 2) { streets.push({ pts: upper, w: 8 }); terrace(upper, 15, 15); }
// Shops along the high street.
terrace(high, 13, 24);

// The railway: a straight diagonal with sleeper ticks, no houses on it.
const rail = [[90, 180], [900, 900]];
const houseFree = houses.filter(([x, y]) => {
  const [ax, ay] = rail[0], [bx, by] = rail[1];
  const d = Math.abs((by - ay) * x - (bx - ax) * y + bx * ay - by * ax) / Math.hypot(bx - ax, by - ay);
  return d > 22;
});

// The signal: a corner on the high street (hub) and gold homes spread across the patch.
const hub = hs(0.5).map(r1);
const lit = [];
const pool = houseFree.filter((h) => inside(h, 60));
while (lit.length < 14 && pool.length) {
  const h = pool.splice(Math.floor(rnd() * pool.length), 1)[0];
  if (lit.every((l) => Math.hypot(l[0] - h[0], l[1] - h[1]) > 120) && Math.hypot(h[0] - hub[0], h[1] - hub[1]) > 90) lit.push(h.map(r1));
}
const nodes = [{ name: "corner", kind: "hub", x: hub[0], y: hub[1] }, ...lit.map(([x, y], i) => ({ name: `home${i}`, kind: "home", x, y }))];
const edges = new Set();
const add = (a, b) => edges.add(a < b ? `${a},${b}` : `${b},${a}`);
for (let i = 1; i < nodes.length; i++) {
  add(0, i);
  const near = nodes.map((n, j) => [Math.hypot(n.x - nodes[i].x, n.y - nodes[i].y), j]).filter(([, j]) => j !== i && j !== 0).sort((a, b) => a[0] - b[0]);
  add(i, near[0][1]);
}

const clipLine = (pts) => pts.filter((p) => inside(p, 2));
const d = streets.map(({ pts }) => clipLine(pts)).filter((p) => p.length > 1).map((p) => "M" + p.map(([x, y]) => `${r1(x)},${r1(y)}`).join(" L"));
const dot = (pts, r) => pts.map(([x, y]) => `M${r1(x - r)},${r1(y)}a${r},${r} 0 1,0 ${2 * r},0a${r},${r} 0 1,0 ${-2 * r},0`).join("");
const out = {
  viewBox: [0, 0, SIZE, SIZE],
  globe: { cx: C, cy: C, r: R },
  streets: d,
  streetWidths: streets.filter(({ pts }) => clipLine(pts).length > 1).map((s) => s.w),
  rail: `M${rail[0].join(",")} L${rail[1].join(",")}`,
  landDots: dot(houseFree.filter((h) => !lit.some((l) => Math.hypot(l[0] - h[0], l[1] - h[1]) < 1)), 4),
  ukDots: dot(lit, 6),
  nodes,
  edges: [...edges].map((e) => e.split(",").map(Number)),
  hub: 0,
  source: "Generated indicative neighbourhood (not a real place)",
};
writeFileSync("src/compositions/wire/street-wire.json", JSON.stringify(out));
console.log(`street-wire.json: ${d.length} streets, ${houseFree.length} homes, ${lit.length} lit, ${out.edges.length} wires`);
