const fs = require('fs');
const path = require('path');
const vm = require('vm');

function makeCtx() {
  const target = {};
  return new Proxy(target, {
    get(t, p) {
      if (p === 'canvas') return { width: 1600, height: 900 };
      if (typeof p === 'symbol') return undefined;
      if (!(p in t)) t[p] = () => ({ width: 0, actualBoundingBoxAscent: 0 });
      return t[p];
    },
    set(t, p, v) { t[p] = v; return true; }
  });
}

function makeEl(id) {
  return {
    id,
    style: {},
    classList: { add() {}, remove() {}, toggle() {} },
    textContent: '',
    innerHTML: '',
    children: [],
    firstChild: null,
    parentNode: null,
    appendChild(c) { this.children.push(c); c.parentNode = this; if (this.firstChild === null) this.firstChild = c; },
    removeChild(c) { this.children = this.children.filter(x => x !== c); if (this.firstChild === c) this.firstChild = this.children[0] || null; },
    addEventListener() {},
    setAttribute() {},
    clientWidth: 1600,
    clientHeight: 900,
    width: 210,
    height: 210,
    getContext() { return makeCtx(); }
  };
}

const els = {};
const windowStub = {
  addEventListener() {},
  innerWidth: 1600,
  innerHeight: 900,
  devicePixelRatio: 1,
  AudioContext: null,
  webkitAudioContext: null
};
const documentStub = {
  createElement(tag) { const e = makeEl('dyn-' + tag + Math.random()); if (tag === 'canvas') e.width = 3200, e.height = 3200; return e; },
  getElementById(id) { if (!els[id]) els[id] = makeEl(id); return els[id]; },
  querySelectorAll() { return []; },
  addEventListener() {}
};

const sandbox = {
  window: windowStub,
  document: documentStub,
  setTimeout,
  clearTimeout,
  Math,
  console,
  requestAnimationFrame() { return 0; }
};
sandbox.globalThis = sandbox;
vm.createContext(sandbox);

const files = ['utils.js', 'audio.js', 'data.js', 'entities.js', 'ai.js', 'ui.js', 'main.js'];
for (const f of files) {
  const code = fs.readFileSync(path.join(__dirname, '..', 'js', f), 'utf8');
  vm.runInContext(code, sandbox, { filename: f });
}

const refs = vm.runInContext('({ G, U, UI, Sfx })', sandbox);
const G = refs.G;
const U = refs.U;
if (!G || !U) throw new Error('globals missing');
G.init();

function run(seconds, opts = {}) {
  const dt = 1 / 60;
  for (let i = 0; i < seconds / dt; i++) {
    if (opts.onTick) opts.onTick(i * dt);
    G.update(dt);
    G.draw();
  }
}

const counts = {};

function battle(nation, tankId, label) {
  G.startBattle(nation, tankId);
  console.log(`--- battle ${label}: player=${G.player.spec.name}`);
  for (let i = 0; i < G.tanks.length; i++) {
    const t = G.tanks[i];
    console.log(`   ${t.team} ${t.spec.name} hp=${t.hp}`);
  }
  G.keys['KeyW'] = true;
  run(8, { onTick(t) { if (Math.floor(t) !== Math.floor(t - 1 / 60)) { } } });
  const alive0 = G.tanks.filter(t => t.alive).length;
  if (typeof alive0 !== 'number') throw new Error('bad');

  G.mouse.x = 900; G.mouse.y = 450; G.mouse.down = true;

  G.waveTimer = 2;
  run(90);

  const shellsFired = G.shells.length;
  counts[label] = {
    tickets: { ...G.tickets },
    playerAlive: G.player ? G.player.alive : false,
    playerKills: G.playerKills,
    planesSpawned: G.waveIndex,
    state: G.state,
    capOwner: G.cap.owner,
    capProgress: +G.cap.progress.toFixed(2),
    time: +G.time.toFixed(1)
  };
  console.log('   state:', JSON.stringify(counts[label]));
}

battle('germany', 'panther', 'de-panther');

if (G.state === 'over') {
  G.startBattle('ussr', 'is2');
  documentStub.getElementById('menu').classList.remove('hidden');
  G.keys['KeyW'] = true;
  G.mouse.down = true;
  G.waveTimer = 2;
  run(70);
  counts['ru-is2'] = {
    tickets: { ...G.tickets },
    playerKills: G.playerKills,
    planesSpawned: G.waveIndex,
    state: G.state,
    capOwner: G.cap.owner,
    time: +G.time.toFixed(1)
  };
  console.log('--- battle ru-is2 state:', JSON.stringify(counts['ru-is2']));
}

console.log('\nSMOKE TEST PASSED');
