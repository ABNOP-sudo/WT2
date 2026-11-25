const U = {
  clamp(v, a, b) { return v < a ? a : (v > b ? b : v); },
  lerp(a, b, t) { return a + (b - a) * t; },
  rand(a, b) { return a + Math.random() * (b - a); },
  randInt(a, b) { return Math.floor(a + Math.random() * (b - a + 1)); },
  dist(ax, ay, bx, by) { return Math.hypot(bx - ax, by - ay); },
  dist2(ax, ay, bx, by) { const dx = bx - ax, dy = by - ay; return dx * dx + dy * dy; },
  angNorm(a) {
    while (a > Math.PI) a -= Math.PI * 2;
    while (a < -Math.PI) a += Math.PI * 2;
    return a;
  },
  angDiff(from, to) { return U.angNorm(to - from); },
  pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; },
  other(team) { return team === 'germany' ? 'ussr' : 'germany'; }
};
