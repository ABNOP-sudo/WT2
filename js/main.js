const G = {
  state: 'menu',
  world: { w: 3200, h: 3200 },
  tanks: [],
  planes: [],
  shells: [],
  bombs: [],
  particles: [],
  texts: [],
  obstacles: [],
  trees: [],
  tickets: { germany: 700, ussr: 700 },
  startTickets: 700,
  cap: { x: 1600, y: 1600, r: 260, owner: null, progress: 0, starveMsg: 0 },
  playerNation: 'germany',
  player: null,
  playerKills: 0,
  playerDamage: 0,
  respawnTimer: 0,
  waveTimer: 0,
  waveIndex: 0,
  shake: 0,
  camera: { x: 800, y: 800 },
  mouse: { x: 0, y: 0, down: false },
  keys: {},
  terrain: null,
  time: 0,
  winner: null,
  msgT: 0,

  init() {
    const canvas = document.getElementById('game');
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.minimap = document.getElementById('minimap');
    this.mmCtx = this.minimap.getContext('2d');
    this.resize();
    window.addEventListener('resize', () => this.resize());
    window.addEventListener('orientationchange', () => setTimeout(() => this.resize(), 250));
    this.cameraAim = null;

    window.addEventListener('keydown', e => {
      this.keys[e.code] = true;
      if (e.code === 'Space') e.preventDefault();
    });
    window.addEventListener('keyup', e => { this.keys[e.code] = false; });
    canvas.addEventListener('mousemove', e => {
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;
    });
    canvas.addEventListener('mousedown', e => { if (e.button === 0) this.mouse.down = true; });
    window.addEventListener('mouseup', e => { if (e.button === 0) this.mouse.down = false; });
    canvas.addEventListener('contextmenu', e => e.preventDefault());

    this.touchMode = ('ontouchstart' in window) || (window.navigator && window.navigator.maxTouchPoints > 0);
    this.joy = { x: 0, y: 0, active: false, id: null };
    this.touchFire = false;
    this.touchAim = { x: null, y: null, t: -999 };
    if (this.touchMode) {
      document.body.classList.add('touch-mode');
      document.getElementById('touch-controls').classList.remove('hidden');
      this.setupTouch();
    }

    UI.init();
    requestAnimationFrame(ts => this.frame(ts));
  },

  resize() {
    const dpr = window.devicePixelRatio || 1;
    this.dpr = dpr;
    this.canvas.width = Math.floor(window.innerWidth * dpr);
    this.canvas.height = Math.floor(window.innerHeight * dpr);
    this.vw = window.innerWidth;
    this.vh = window.innerHeight;
  },

  setupTouch() {
    const joyZone = document.getElementById('joy-zone');
    const joyStick = document.getElementById('joy-stick');
    const fireBtn = document.getElementById('fire-btn');
    const STICK_R = 56;

    const moveStick = e => {
      const r = joyZone.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      let dx = e.clientX - cx, dy = e.clientY - cy;
      const len = Math.hypot(dx, dy);
      if (len > STICK_R) { dx = dx / len * STICK_R; dy = dy / len * STICK_R; }
      this.joy.x = dx / STICK_R;
      this.joy.y = dy / STICK_R;
      joyStick.style.transform = `translate(${dx}px, ${dy}px)`;
    };
    const resetStick = () => {
      this.joy.x = 0;
      this.joy.y = 0;
      this.joy.active = false;
      this.joy.id = null;
      joyStick.style.transform = 'translate(0px, 0px)';
    };

    joyZone.addEventListener('pointerdown', e => {
      this.joy.active = true;
      this.joy.id = e.pointerId;
      try { joyZone.setPointerCapture(e.pointerId); } catch (err) {}
      moveStick(e);
      e.preventDefault();
    }, { passive: false });
    joyZone.addEventListener('pointermove', e => {
      if (this.joy.active && e.pointerId === this.joy.id) { moveStick(e); e.preventDefault(); }
    }, { passive: false });
    joyZone.addEventListener('pointerup', e => { if (e.pointerId === this.joy.id) resetStick(); });
    joyZone.addEventListener('pointercancel', resetStick);

    fireBtn.addEventListener('pointerdown', e => {
      this.touchFire = true;
      e.preventDefault();
    }, { passive: false });
    fireBtn.addEventListener('pointerup', () => { this.touchFire = false; });
    fireBtn.addEventListener('pointercancel', () => { this.touchFire = false; });
    fireBtn.addEventListener('pointerleave', () => { this.touchFire = false; });

    const aim = e => {
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;
      const w = this.screenToWorld(e.clientX, e.clientY);
      this.touchAim.x = w.x;
      this.touchAim.y = w.y;
      this.touchAim.t = this.time;
      e.preventDefault();
    };
    this.canvas.addEventListener('pointerdown', aim, { passive: false });
    this.canvas.addEventListener('pointermove', e => {
      if (e.pointerType !== 'mouse' && (e.touches === undefined || e.pressure > 0)) aim(e);
    }, { passive: false });
  },

  nearestEnemyTank(t) {
    let best = null, bestD = 1200;
    for (const o of this.tanks) {
      if (!o.alive || o.team === t.team) continue;
      const d = U.dist(t.x, t.y, o.x, o.y);
      if (d < bestD) { bestD = d; best = o; }
    }
    return best;
  },

  camDist(x, y) {
    return U.dist(x, y, this.camera.x, this.camera.y);
  },

  screenToWorld(sx, sy) {
    return {
      x: sx - this.vw / 2 + this.camera.x,
      y: sy - this.vh / 2 + this.camera.y
    };
  },

  startBattle(nation, tankId) {
    this.state = 'battle';
    this.playerNation = nation;
    this.startTickets = 700;
    this.tickets = { germany: 700, ussr: 700 };
    this.tanks = [];
    this.planes = [];
    this.shells = [];
    this.bombs = [];
    this.particles = [];
    this.texts = [];
    this.time = 0;
    this.winner = null;
    this.respawnTimer = 0;
    this.waveTimer = 16;
    this.waveIndex = 0;
    this.playerKills = 0;
    this.playerDamage = 0;
    this.cap = {
      x: this.world.w / 2, y: this.world.h / 2, r: 260,
      owner: null, progress: 0
    };
    this.shake = 0;
    document.getElementById('menu').classList.add('hidden');
    document.getElementById('hud').classList.remove('hidden');
    document.getElementById('death-overlay').classList.add('hidden');
    document.getElementById('result-overlay').classList.add('hidden');
    document.getElementById('killfeed').innerHTML = '';

    this.genWorld();
    this.spawnTeams(nation, tankId);
    this.camera.x = this.player.x;
    this.camera.y = this.player.y;
    this.cameraAim = null;
    this.message(TEAMS[nation].name + ' — В БОЙ!', 3);
  },

  genWorld() {
    const w = this.world.w, h = this.world.h;
    this.obstacles = [];
    this.trees = [];

    const tc = document.createElement('canvas');
    tc.width = w;
    tc.height = h;
    const c = tc.getContext('2d');
    c.fillStyle = '#4c5a3c';
    c.fillRect(0, 0, w, h);
    for (let i = 0; i < 2600; i++) {
      const x = Math.random() * w, y = Math.random() * h;
      const r = U.rand(12, 60);
      const shade = U.rand(-14, 14);
      c.fillStyle = `rgba(${76 + shade}, ${90 + shade}, ${60 + shade}, 0.35)`;
      c.beginPath();
      c.arc(x, y, r, 0, Math.PI * 2);
      c.fill();
    }
    c.fillStyle = '#8a7f5a';
    c.globalAlpha = 0.85;
    c.fillRect(0, h / 2 - 34, w, 68);
    c.fillRect(w / 2 - 34, 0, 68, h);
    c.globalAlpha = 1;
    c.strokeStyle = 'rgba(60,55,38,0.8)';
    c.setLineDash([26, 22]);
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(0, h / 2);
    c.lineTo(w, h / 2);
    c.moveTo(w / 2, 0);
    c.lineTo(w / 2, h);
    c.stroke();
    c.setLineDash([]);
    c.fillStyle = 'rgba(66, 74, 50, 0.5)';
    for (let i = 0; i < 350; i++) {
      c.beginPath();
      c.ellipse(Math.random() * w, Math.random() * h, U.rand(20, 80), U.rand(12, 40), U.rand(0, 3), 0, Math.PI * 2);
      c.fill();
    }
    this.terrain = tc;

    let tries = 0;
    while (this.obstacles.length < 16 && tries < 300) {
      tries++;
      const x = U.rand(500, w - 500), y = U.rand(300, h - 300);
      if (U.dist(x, y, w / 2, h / 2) < 420) continue;
      if (Math.abs(y - h / 2) < 120 || Math.abs(x - w / 2) < 130) continue;
      const hw = U.rand(42, 70), hh = U.rand(38, 60);
      this.obstacles.push({ x, y, r: Math.max(hw, hh) * 0.9, hw, hh, type: 'house', rot: U.rand(-0.3, 0.3), solid: true });
    }
    tries = 0;
    while (this.obstacles.length < 40 && tries < 400) {
      tries++;
      const x = U.rand(300, w - 300), y = U.rand(200, h - 200);
      if (Math.abs(y - h / 2) < 90 || Math.abs(x - w / 2) < 100) continue;
      const r = U.rand(20, 42);
      let ok = true;
      for (const o of this.obstacles) if (U.dist(x, y, o.x, o.y) < o.r + r + 40) { ok = false; break; }
      if (!ok) continue;
      this.obstacles.push({ x, y, r, type: 'rock', solid: true });
    }
    tries = 0;
    while (this.trees.length < 70 && tries < 600) {
      tries++;
      const x = U.rand(150, w - 150), y = U.rand(150, h - 150);
      if (Math.abs(y - h / 2) < 70 || Math.abs(x - w / 2) < 80) continue;
      let ok = true;
      for (const o of this.obstacles) if (U.dist(x, y, o.x, o.y) < o.r + 30) { ok = false; break; }
      for (const t of this.trees) if (U.dist(x, y, t.x, t.y) < 70) { ok = false; break; }
      if (!ok) continue;
      this.trees.push({ x, y, r: U.rand(18, 30), trunk: 7 });
    }
  },

  spawnTeams(nation, tankId) {
    const enemy = otherNation(nation);
    const cy = this.world.h / 2;
    const playerSpec = TANK_DB[nation].find(s => s.id === tankId) || TANK_DB[nation][0];
    const p = new Tank(nation, playerSpec, 320, cy + 40, 0, true);
    this.tanks.push(p);
    this.player = p;

    const allySpecs = TANK_DB[nation].filter(s => s.id !== tankId);
    for (let i = 0; i < 4; i++) {
      const spec = allySpecs[i % allySpecs.length];
      this.tanks.push(new Tank(nation, spec, U.rand(160, 420), cy + U.rand(-500, 500), U.rand(-0.4, 0.4), false));
    }
    for (let i = 0; i < 5; i++) {
      const spec = TANK_DB[enemy][i % TANK_DB[enemy].length];
      this.tanks.push(new Tank(enemy, spec, U.rand(this.world.w - 420, this.world.w - 160), cy + U.rand(-500, 500), Math.PI + U.rand(-0.4, 0.4), false));
    }
  },

  spawnPlane(team, kind) {
    if (this.planes.filter(p => p.alive && p.team === team).length >= 2) return;
    const plane = new Plane(team, kind, this);
    this.planes.push(plane);
    const db = PLANE_DB[team];
    const label = kind === 'bomber' ? db.bomber.name : db.fighter.name;
    const side = team === this.playerNation ? 'ally' : 'enemy';
    this.feed(`${side === 'ally' ? 'Союзная' : 'Вражеская'} авиация: ${label}`, side);
  },

  fireMainGun(t) {
    const spec = t.spec;
    const ang = t.turret + U.rand(-1, 1) * spec.gun.disp * (t.isPlayer ? 1.6 : 2.4);
    const mx = t.x + Math.cos(ang) * (spec.turret.barrel + spec.turret.r + 4);
    const my = t.y + Math.sin(ang) * (spec.turret.barrel + spec.turret.r + 4);
    this.shells.push(new Shell(t, t.team, mx, my, ang, spec.gun));
    t.reload = spec.gun.reload * t.reloadMult();
    t.ammo--;
    t.flash = 0.07;
    t.recoil = 1;
    FX.muzzle(mx, my, ang, this);
    Sfx.shot(this.camDist(t.x, t.y));
  },

  fireMg(t, plane) {
    const d = U.dist(t.x, t.y, plane.x, plane.y);
    const flight = d / 1700;
    const leadX = plane.x + Math.cos(plane.angle) * plane.spec.speed * flight;
    const leadY = plane.y + Math.sin(plane.angle) * plane.spec.speed * flight;
    const ang = Math.atan2(leadY - t.y, leadX - t.x) + U.rand(-0.03, 0.03);
    this.shells.push(new Shell(t, t.team, t.x + Math.cos(ang) * 30, t.y + Math.sin(ang) * 30, ang, null, true, 4.5));
    t.mgCd = 0.13;
    Sfx.mgShot(this.camDist(t.x, t.y));
  },

  groundBlast(x, y, owner, team, dmg, radius) {
    FX.boom(x, y, this, 1.6);
    FX.ring(x, y, 40, this, '#ffb066');
    Sfx.bigExplosion(this.camDist(x, y));
    for (const t of this.tanks) {
      if (!t.alive) continue;
      const d = U.dist(x, y, t.x, t.y);
      if (d < radius) {
        const dd = dmg * (1 - (d / radius) * 0.75);
        t.hp -= dd;
        if (owner) owner.damageDealt = (owner.damageDealt || 0) + Math.min(dd, Math.max(0, t.hp + dd));
        this.floatText(t.x, t.y - 30, '-' + Math.round(dd), '#ff9c6e', 16);
        const r = Math.random();
        if (r < 0.25) { t.modules.trackTime = Math.max(t.modules.trackTime, 5); this.floatText(t.x, t.y - 14, 'ГУСЕНИЦА', '#ffce6e', 12); }
        else if (r < 0.4 && t.modules.fireTime <= 0) { t.modules.fireTime = 6; }
        if (t.isPlayer) this.shake = Math.min(this.shake + 12, 20);
        if (t.hp <= 0) t.destroy(this, owner);
        else Sfx.hit();
      }
    }
  },

  canPen(shooter, target) {
    const dir = Math.atan2(shooter.y - target.y, shooter.x - target.x);
    const aRel = Math.abs(U.angNorm(dir - target.angle));
    const A = target.spec.armor;
    const armor = aRel > 2.4 ? A.front : (aRel < 0.9 ? A.rear : A.side);
    return shooter.spec.gun.pen * 1.06 >= armor;
  },

  onUnitKilled(victim, killer) {
    const loss = victim.kind !== undefined ? 30 : 55;
    this.tickets[victim.team] = Math.max(0, this.tickets[victim.team] - loss);

    let killerName = '—';
    if (killer) {
      killerName = killer.spec ? killer.spec.name : 'Авиация';
      if (killer.kind !== undefined) killerName += ' ✈';
      killer.kills = (killer.kills || 0) + 1;
    }

    if (killer === this.player) {
      this.playerKills++;
      if (victim.team !== this.playerNation) this.message('Цель уничтожена: ' + (victim.spec ? victim.spec.name : 'самолёт'), 2);
    }
    if (victim === this.player) {
      this.respawnTimer = 8;
      Sfx.bigExplosion(0);
    }

    const vName = victim.spec ? victim.spec.name : 'Самолёт ✈';
    const cls = victim.team === this.playerNation ? 'ally-death' : 'enemy-death';
    this.feed(`${killerName} → ${vName}`, cls);
  },

  feed(text, cls = '') {
    const ul = document.getElementById('killfeed');
    const li = document.createElement('li');
    li.className = cls;
    li.textContent = text;
    ul.appendChild(li);
    while (ul.children.length > 5) ul.removeChild(ul.firstChild);
    setTimeout(() => { li.style.opacity = '0'; li.style.transition = 'opacity 1s'; }, 6000);
    setTimeout(() => { if (li.parentNode) li.parentNode.removeChild(li); }, 7200);
  },

  message(text, dur = 2.5) {
    const el = document.getElementById('center-msg');
    el.textContent = text;
    el.style.opacity = '1';
    this.msgT = dur;
  },

  floatText(x, y, text, color, size = 14) {
    this.texts.push(new FloatText(x, y, text, color, size));
    if (this.texts.length > 40) this.texts.shift();
  },

  pickBombTarget(p) {
    let best = null, bestScore = 1e9;
    for (const t of this.tanks) {
      if (!t.alive || t.team === p.team) continue;
      let score = U.dist(p.x, p.y, t.x, t.y);
      if (U.dist(t.x, t.y, this.cap.x, this.cap.y) < this.cap.r) score -= 500;
      if (t.isPlayer) score -= 200;
      if (score < bestScore) { bestScore = score; best = t; }
    }
    return best || { x: this.cap.x, y: this.cap.y, alive: true };
  },

  pickStrafeTarget(p) {
    let best = null, bestScore = 1e9;
    for (const t of this.tanks) {
      if (!t.alive || t.team === p.team) continue;
      const score = U.dist(p.x, p.y, t.x, t.y);
      if (score < bestScore) { bestScore = score; best = t; }
    }
    return best || { x: this.cap.x, y: this.cap.y, alive: true, angle: 0, speed: 0 };
  },

  updateCapture(dt) {
    const cap = this.cap;
    let ussr = 0, germany = 0;
    for (const t of this.tanks) {
      if (!t.alive) continue;
      if (U.dist(t.x, t.y, cap.x, cap.y) < cap.r) {
        if (t.team === 'ussr') ussr++;
        else germany++;
      }
    }
    if (ussr > 0 && germany === 0) {
      if (cap.owner !== 'ussr') {
        cap.progress = Math.min(1, cap.progress + 0.16 * dt);
        if (cap.progress >= 1) {
          cap.owner = 'ussr';
          this.message(TEAMS.ussr.name + ' захватила точку А!', 3);
          this.tickets.germany = Math.max(0, this.tickets.germany - 40);
        } else if (cap.owner === 'germany') cap.progress = Math.max(0, 1 - cap.progress);
      }
      if (cap.owner === 'ussr') this.tickets.germany = Math.max(0, this.tickets.germany - 4 * dt);
    } else if (germany > 0 && ussr === 0) {
      if (cap.owner !== 'germany') {
        cap.progress = Math.min(1, cap.progress + 0.16 * dt);
        if (cap.progress >= 1) {
          cap.owner = 'germany';
          this.message(TEAMS.germany.name + ' захватила точку А!', 3);
          this.tickets.ussr = Math.max(0, this.tickets.ussr - 40);
        } else if (cap.owner === 'ussr') cap.progress = Math.max(0, 1 - cap.progress);
      }
      if (cap.owner === 'germany') this.tickets.ussr = Math.max(0, this.tickets.ussr - 4 * dt);
    } else {
      cap.progress = Math.max(0, cap.progress - 0.15 * dt);
      if (cap.progress < 1 && cap.owner !== null) cap.owner = null;
    }
  },

  updateWaves(dt) {
    this.waveTimer -= dt;
    if (this.waveTimer <= 0) {
      this.waveTimer = U.rand(28, 40);
      this.waveIndex++;
      for (const team of ['germany', 'ussr']) {
        const kind = (this.waveIndex + (team === 'germany' ? 0 : 1)) % 2 === 1 ? 'fighter' : 'bomber';
        this.spawnPlane(team, kind);
      }
    }
  },

  checkEnd() {
    if (this.tickets.germany <= 0 && this.tickets.ussr <= 0) {
      this.winner = this.tickets[this.playerNation] <= 0 ? otherNation(this.playerNation) : this.playerNation;
    } else if (this.tickets.ussr <= 0) this.winner = 'germany';
    else if (this.tickets.germany <= 0) this.winner = 'ussr';

    const enemy = otherNation(this.playerNation);
    const enemyUnits = this.tanks.some(t => t.alive && t.team === enemy) || this.planes.some(p => p.alive && p.team === enemy);
    if (!enemyUnits) this.winner = this.playerNation;
    const allyUnits = this.tanks.some(t => t.alive && t.team === this.playerNation) || this.planes.some(p => p.alive && p.team === this.playerNation);
    if (!allyUnits) this.winner = enemy;

    if (this.winner && this.state === 'battle') {
      this.state = 'over';
      UI.showResult(this);
    }
  },

  respawn() {
    const p = new Tank(this.playerNation, this.player.spec, 260 + U.rand(-60, 60), this.world.h / 2 + U.rand(-200, 200), 0, true);
    this.tanks.push(p);
    this.player = p;
    this.camera.x = p.x;
    this.camera.y = p.y;
  },

  update(dt) {
    if (this.state !== "battle") { Sfx.engineUpdate(false, 0); return; }
    this.time += dt;

    if (this.msgT > 0) {
      this.msgT -= dt;
      if (this.msgT <= 0) document.getElementById('center-msg').style.opacity = '0';
    }

    if ((!this.player || !this.player.alive) && this.state === 'battle') {
      this.respawnTimer -= dt;
      if (this.respawnTimer <= 0) this.respawn();
    }

    const player = this.player;
    if (player && player.alive) {
      let throttle = (this.keys['KeyW'] ? 1 : 0) + (this.keys['KeyS'] ? -1 : 0);
      let steer = (this.keys['KeyD'] ? 1 : 0) - (this.keys['KeyA'] ? 1 : 0);
      let fire = this.mouse.down;
      let aimPoint = null;
      if (this.touchMode) {
        if (this.joy.active) {
          throttle = U.clamp(-this.joy.y, -1, 1);
          steer = U.clamp(this.joy.x, -1, 1);
        }
        if (this.touchAim.x !== null && this.time - this.touchAim.t < 4) {
          aimPoint = { x: this.touchAim.x, y: this.touchAim.y };
        } else {
          const foe = this.nearestEnemyTank(player);
          if (foe) aimPoint = { x: foe.x, y: foe.y };
        }
        fire = fire || this.touchFire;
      }
      if (aimPoint === null) {
        aimPoint = this.screenToWorld(this.mouse.x, this.mouse.y);
      }
      this.cameraAim = aimPoint;
      player.ctrl.throttle = throttle;
      player.ctrl.steer = steer;
      player.ctrl.turret = Math.atan2(aimPoint.y - player.y, aimPoint.x - player.x);
      player.ctrl.fire = fire && player.ammo > 0;
      if (fire && player.ammo <= 0) this.message('БОЕЗАПАС ИСЧЕРПАН', 0.5);
      Sfx.engineUpdate(true, U.clamp(Math.abs(player.speed) / player.spec.speed, 0, 1));
    } else {
      Sfx.engineUpdate(false, 0);
    }

    for (const t of this.tanks) {
      if (t.alive && !t.isPlayer) tankAI(t, this, dt);
      t.update(dt, this);
    }
    for (const p of this.planes) p.update(dt, this);
    this.shells = this.shells.filter(s => s.update(dt, this));
    this.bombs = this.bombs.filter(b => b.update(dt, this));
    this.particles = this.particles.filter(p => { p.update(dt); return !p.dead; });
    this.texts = this.texts.filter(t => { t.update(dt); return !t.dead; });

    this.updateCapture(dt);
    this.updateWaves(dt);
    this.checkEnd();

    if (player && player.alive) {
      let ox = 0, oy = 0;
      if (this.cameraAim) {
        ox = U.clamp(this.cameraAim.x - player.x, -this.vw * 0.12, this.vw * 0.12);
        oy = U.clamp(this.cameraAim.y - player.y, -this.vh * 0.12, this.vh * 0.12);
      }
      this.camera.x = U.lerp(this.camera.x, player.x + ox, dt * 7);
      this.camera.y = U.lerp(this.camera.y, player.y + oy, dt * 7);
    } else if (player) {
      this.camera.x = U.lerp(this.camera.x, player.x, dt * 3);
      this.camera.y = U.lerp(this.camera.y, player.y, dt * 3);
    }
    const halfW = Math.min(this.vw / 2, this.world.w / 2);
    const halfH = Math.min(this.vh / 2, this.world.h / 2);
    this.camera.x = U.clamp(this.camera.x, Math.min(halfW, this.world.w / 2), Math.max(this.world.w - halfW, this.world.w / 2));
    this.camera.y = U.clamp(this.camera.y, Math.min(halfH, this.world.h / 2), Math.max(this.world.h - halfH, this.world.h / 2));
    if (this.shake > 0) this.shake = Math.max(0, this.shake - dt * 30);
  },

  frame(ts) {
    if (!this.lastTs) this.lastTs = ts;
    const dt = Math.min(0.05, (ts - this.lastTs) / 1000);
    this.lastTs = ts;
    this.update(dt);
    this.draw();
    UI.updateHUD(this);
    requestAnimationFrame(t => this.frame(t));
  },

  draw() {
    const ctx = this.ctx;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.fillStyle = '#10130f';
    ctx.fillRect(0, 0, this.vw, this.vh);
    if (this.state === 'menu' || !this.terrain) return;

    const shx = this.shake > 0 ? U.rand(-this.shake, this.shake) : 0;
    const shy = this.shake > 0 ? U.rand(-this.shake, this.shake) : 0;
    ctx.save();
    ctx.translate(this.vw / 2 - this.camera.x + shx, this.vh / 2 - this.camera.y + shy);

    ctx.drawImage(this.terrain, 0, 0);

    ctx.strokeStyle = '#3f4436';
    ctx.lineWidth = 6;
    ctx.strokeRect(0, 0, this.world.w, this.world.h);

    this.drawCap(ctx);

    for (const t of this.trees) {
      if (!this.onScreen(t.x, t.y, t.r + 40)) continue;
      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      ctx.beginPath();
      ctx.arc(t.x + 5, t.y + 6, t.r * 0.7, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#39482c';
      ctx.beginPath();
      ctx.arc(t.x, t.y, t.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#465a35';
      ctx.beginPath();
      ctx.arc(t.x - t.r * 0.2, t.y - t.r * 0.2, t.r * 0.7, 0, Math.PI * 2);
      ctx.fill();
    }

    for (const o of this.obstacles) {
      if (!this.onScreen(o.x, o.y, o.r + 60)) continue;
      if (o.type === 'house') {
        ctx.save();
        ctx.translate(o.x, o.y);
        ctx.rotate(o.rot);
        ctx.fillStyle = 'rgba(0,0,0,0.25)';
        ctx.fillRect(-o.hw + 6, -o.hh + 8, o.hw * 2, o.hh * 2);
        ctx.fillStyle = '#6e6350';
        ctx.fillRect(-o.hw, -o.hh, o.hw * 2, o.hh * 2);
        ctx.fillStyle = '#8c4a3a';
        ctx.beginPath();
        ctx.moveTo(-o.hw - 6, -o.hh);
        ctx.lineTo(0, -o.hh - 22);
        ctx.lineTo(o.hw + 6, -o.hh);
        ctx.lineTo(o.hw, -o.hh + 10);
        ctx.lineTo(-o.hw, -o.hh + 10);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#3d3628';
        ctx.lineWidth = 2;
        ctx.strokeRect(-o.hw, -o.hh, o.hw * 2, o.hh * 2);
        ctx.restore();
      } else {
        ctx.fillStyle = '#6b6b62';
        ctx.beginPath();
        ctx.arc(o.x + 4, o.y + 5, o.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#7d7d73';
        ctx.beginPath();
        ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#8d8d82';
        ctx.beginPath();
        ctx.arc(o.x - o.r * 0.25, o.y - o.r * 0.25, o.r * 0.55, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    for (const t of this.tanks) t.draw(ctx);
    for (const s of this.shells) s.draw(ctx);
    for (const b of this.bombs) b.draw(ctx);
    for (const p of this.planes) p.draw(ctx);
    for (const p of this.particles) p.draw(ctx);
    for (const t of this.texts) t.draw(ctx);

    ctx.restore();

    this.drawReticle(ctx);
    this.drawMinimap();
  },

  onScreen(x, y, m = 40) {
    return Math.abs(x - this.camera.x) < this.vw / 2 + m && Math.abs(y - this.camera.y) < this.vh / 2 + m;
  },

  drawCap(ctx) {
    const cap = this.cap;
    ctx.save();
    ctx.strokeStyle = cap.owner === 'ussr' ? 'rgba(216,99,90,0.9)' : (cap.owner === 'germany' ? 'rgba(220,226,210,0.9)' : 'rgba(220,220,180,0.55)');
    ctx.lineWidth = 4;
    ctx.setLineDash([18, 14]);
    ctx.beginPath();
    ctx.arc(cap.x, cap.y, cap.r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    if (cap.progress > 0 && !cap.owner) {
      ctx.strokeStyle = 'rgba(240,220,150,0.9)';
      ctx.lineWidth = 7;
      ctx.beginPath();
      ctx.arc(cap.x, cap.y, cap.r - 12, -Math.PI / 2, -Math.PI / 2 + cap.progress * Math.PI * 2);
      ctx.stroke();
    }
    ctx.fillStyle = 'rgba(20,24,16,0.45)';
    ctx.beginPath();
    ctx.arc(cap.x, cap.y, cap.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(240,232,200,0.8)';
    ctx.font = 'bold 110px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('А', cap.x, cap.y);
    ctx.textBaseline = 'alphabetic';
    ctx.restore();
  },

  drawReticle(ctx) {
    const t = this.player;
    if (!t || !t.alive || this.state !== 'battle') return;
    const spread = 10 + t.spec.gun.disp * U.dist(t.x, t.y, ...this.mouseWorldXY()) * 420;
    const mx = this.mouse.x, my = this.mouse.y;
    ctx.strokeStyle = t.reload <= 0 ? 'rgba(255,225,150,0.95)' : 'rgba(200,200,190,0.5)';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(mx, my, spread, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(mx - spread - 6, my);
    ctx.lineTo(mx - spread + 3, my);
    ctx.moveTo(mx + spread - 3, my);
    ctx.lineTo(mx + spread + 6, my);
    ctx.moveTo(mx, my - spread - 6);
    ctx.lineTo(mx, my - spread + 3);
    ctx.moveTo(mx, my + spread - 3);
    ctx.lineTo(mx, my + spread + 6);
    ctx.stroke();
    if (t.reload > 0) {
      const frac = 1 - t.reload / (t.spec.gun.reload * t.reloadMult());
      ctx.strokeStyle = 'rgba(232,194,104,0.9)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(mx, my, spread + 9, -Math.PI / 2, -Math.PI / 2 + frac * Math.PI * 2);
      ctx.stroke();
    }
  },

  mouseWorldXY() {
    const w = this.screenToWorld(this.mouse.x, this.mouse.y);
    return [w.x, w.y];
  },

  drawMinimap() {
    const c = this.mmCtx;
    const S = 210;
    const k = S / this.world.w;
    c.clearRect(0, 0, S, S);
    c.fillStyle = '#39412e';
    c.fillRect(0, 0, S, S);
    c.fillStyle = '#8a7f5a';
    c.fillRect(0, S / 2 - 2, S, 4);
    c.fillRect(S / 2 - 2, 0, 4, S);

    c.strokeStyle = 'rgba(230,230,180,0.8)';
    c.beginPath();
    c.arc(this.cap.x * k, this.cap.y * k, this.cap.r * k, 0, Math.PI * 2);
    c.stroke();

    for (const o of this.obstacles) {
      c.fillStyle = o.type === 'house' ? '#7d7264' : '#84847a';
      c.fillRect(o.x * k - 1.5, o.y * k - 1.5, 3, 3);
    }
    for (const t of this.tanks) {
      c.fillStyle = t.alive
        ? (t.team === 'ussr' ? '#d8635a' : '#c9cfbf')
        : 'rgba(60,60,55,0.8)';
      const icon = t.isPlayer ? 4 : 3;
      c.fillRect(t.x * k - icon / 2, t.y * k - icon / 2, icon, icon);
    }
    for (const p of this.planes) {
      if (!p.alive) continue;
      c.fillStyle = p.team === 'ussr' ? '#ff8a80' : '#eef2e6';
      c.save();
      c.translate(p.x * k, p.y * k);
      c.rotate(p.angle);
      c.beginPath();
      c.moveTo(5, 0);
      c.lineTo(-3, -3);
      c.lineTo(-3, 3);
      c.closePath();
      c.fill();
      c.restore();
    }
    if (this.player && this.player.alive) {
      c.strokeStyle = '#ffe98a';
      c.lineWidth = 1.5;
      c.strokeRect(this.player.x * k - 4, this.player.y * k - 4, 8, 8);
    }
  }
};

window.addEventListener('DOMContentLoaded', () => G.init());
