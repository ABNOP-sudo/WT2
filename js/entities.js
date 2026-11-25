class Particle {
  constructor(x, y, vx, vy, life, size, color, opts = {}) {
    this.x = x; this.y = y;
    this.vx = vx; this.vy = vy;
    this.life = life;
    this.maxLife = life;
    this.size = size;
    this.color = color;
    this.type = opts.type || 'dot';
    this.grow = opts.grow || 0;
    this.drag = opts.drag || 0;
    this.dead = false;
  }

  update(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    if (this.drag) { const f = 1 - this.drag * dt; this.vx *= f; this.vy *= f; }
    if (this.grow) this.size += this.grow * dt;
    this.life -= dt;
    if (this.life <= 0) this.dead = true;
  }

  draw(ctx) {
    const a = U.clamp(this.life / this.maxLife, 0, 1);
    if (this.type === 'ring') {
      ctx.strokeStyle = this.color;
      ctx.globalAlpha = a * 0.8;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.stroke();
    } else if (this.type === 'smoke') {
      ctx.fillStyle = this.color;
      ctx.globalAlpha = a * 0.35;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = this.color;
      ctx.globalAlpha = a;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
}

class FloatText {
  constructor(x, y, text, color, size = 14) {
    this.x = x; this.y = y;
    this.text = text;
    this.color = color;
    this.life = 1.4;
    this.maxLife = 1.4;
    this.size = size;
    this.dead = false;
  }

  update(dt) {
    this.y -= 26 * dt;
    this.life -= dt;
    if (this.life <= 0) this.dead = true;
  }

  draw(ctx) {
    ctx.globalAlpha = U.clamp(this.life / this.maxLife, 0, 1);
    ctx.fillStyle = this.color;
    ctx.font = `bold ${this.size}px Arial`;
    ctx.textAlign = 'center';
    ctx.strokeStyle = 'rgba(0,0,0,0.8)';
    ctx.lineWidth = 3;
    ctx.strokeText(this.text, this.x, this.y);
    ctx.fillText(this.text, this.x, this.y);
    ctx.globalAlpha = 1;
  }
}

const FX = {
  count(g) { return g.particles.length; },

  add(g, p) {
    if (g.particles.length < 520) g.particles.push(p);
  },

  muzzle(x, y, angle, g) {
    for (let i = 0; i < 6; i++) {
      const a = angle + U.rand(-0.4, 0.4);
      const s = U.rand(120, 380);
      this.add(g, new Particle(x, y, Math.cos(a) * s, Math.sin(a) * s, U.rand(0.15, 0.35), U.rand(2, 5), '#ffd977', { drag: 3 }));
    }
    this.add(g, new Particle(x, y, 0, 0, 0.12, 16, '#fff3c0', { type: 'dot', grow: 40 }));
    for (let i = 0; i < 4; i++) {
      const a = angle + U.rand(-0.6, 0.6);
      this.add(g, new Particle(x, y, Math.cos(a) * 60, Math.sin(a) * 60, U.rand(0.5, 0.9), U.rand(6, 11), '#8b8b80', { type: 'smoke', grow: 14, drag: 1.5 }));
    }
  },

  ricochet(x, y, g) {
    for (let i = 0; i < 8; i++) {
      const a = U.rand(0, Math.PI * 2);
      const s = U.rand(90, 300);
      this.add(g, new Particle(x, y, Math.cos(a) * s, Math.sin(a) * s, U.rand(0.2, 0.5), U.rand(1.5, 3), '#ffe9a8', { drag: 4 }));
    }
  },

  hitSparks(x, y, g) {
    for (let i = 0; i < 12; i++) {
      const a = U.rand(0, Math.PI * 2);
      const s = U.rand(80, 360);
      this.add(g, new Particle(x, y, Math.cos(a) * s, Math.sin(a) * s, U.rand(0.2, 0.55), U.rand(1.5, 3.5), U.pick(['#ffcf6e', '#ff9c4a', '#ffffff']), { drag: 3 }));
    }
  },

  smokePuff(x, y, g, dark = false) {
    if (g.particles.length > 420) return;
    const a = U.rand(0, Math.PI * 2);
    const s = U.rand(10, 45);
    this.add(g, new Particle(x + U.rand(-6, 6), y + U.rand(-6, 6), Math.cos(a) * s, Math.sin(a) * s - 15, U.rand(1.2, 2.4), U.rand(7, 14), dark ? '#3a3a38' : '#8f8f86', { type: 'smoke', grow: 16, drag: 1.2 }));
  },

  flame(x, y, g) {
    if (g.particles.length > 460) return;
    const a = U.rand(0, Math.PI * 2);
    this.add(g, new Particle(x, y, Math.cos(a) * 30, Math.sin(a) * 30 - 30, U.rand(0.25, 0.5), U.rand(4, 8), U.pick(['#ff9c3a', '#ffd257', '#ff6a2a']), { grow: -6, drag: 2 }));
  },

  ring(x, y, size, g, color = '#ffc86e') {
    this.add(g, new Particle(x, y, 0, 0, 0.45, size, color, { type: 'ring', grow: size * 5 }));
  },

  boom(x, y, g, scale = 1) {
    this.add(g, new Particle(x, y, 0, 0, 0.2, 26 * scale, '#fff6d8', { grow: 220 * scale }));
    this.ring(x, y, 14 * scale, g);
    for (let i = 0; i < Math.floor(16 * scale); i++) {
      const a = U.rand(0, Math.PI * 2);
      const s = U.rand(60, 420) * scale;
      this.add(g, new Particle(x, y, Math.cos(a) * s, Math.sin(a) * s, U.rand(0.3, 0.8), U.rand(2, 5), U.pick(['#ffcf6e', '#ff8c3a', '#ff5c2a']), { drag: 2.5 }));
    }
    for (let i = 0; i < Math.floor(10 * scale); i++) {
      const a = U.rand(0, Math.PI * 2);
      const s = U.rand(20, 90);
      this.add(g, new Particle(x, y, Math.cos(a) * s, Math.sin(a) * s, U.rand(1, 2.2), U.rand(10, 20), '#54524c', { type: 'smoke', grow: 22, drag: 1 }));
    }
  }
};

class Shell {
  constructor(owner, team, x, y, angle, spec, isMG = false, mgDmg = 0) {
    this.owner = owner;
    this.team = team;
    this.x = x;
    this.y = y;
    const speed = isMG ? 1700 : spec.speed;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.angle = angle;
    this.dmg = isMG ? mgDmg : spec.dmg * U.rand(0.9, 1.1);
    this.pen = isMG ? 0 : spec.pen * U.rand(0.92, 1.08);
    this.mg = isMG;
    this.life = isMG ? 0.9 : 2.4;
    this.team = team;
  }

  update(dt, g) {
    const spd = Math.hypot(this.vx, this.vy);
    const steps = Math.max(1, Math.ceil(spd * dt / 18));
    const st = dt / steps;
    for (let i = 0; i < steps; i++) {
      this.x += this.vx * st;
      this.y += this.vy * st;
      if (this.x < -50 || this.y < -50 || this.x > g.world.w + 50 || this.y > g.world.h + 50) return false;
      for (const o of g.obstacles) {
        if (o.solid && U.dist2(this.x, this.y, o.x, o.y) < o.r * o.r) {
          FX.hitSparks(this.x, this.y, g);
          Sfx.ricochet();
          return false;
        }
      }
      for (const t of g.tanks) {
        if (t.team === this.team) continue;
        if (t.containsPoint(this.x, this.y)) {
          t.takeHit(this, g);
          return false;
        }
      }
      for (const p of g.planes) {
        if (!p.alive || p.team === this.team) continue;
        const rr = p.spec.bombs ? 36 : 27;
        if (U.dist2(this.x, this.y, p.x, p.y) < rr * rr) {
          p.takeHit(this, g);
          return false;
        }
      }
    }
    this.life -= dt;
    return this.life > 0;
  }

  draw(ctx) {
    const tlen = this.mg ? 20 : 34;
    const bx = this.x - this.vx * 0.00002 * tlen * 50;
    const by = this.y - this.vy * 0.00002 * tlen * 50;
    ctx.strokeStyle = this.mg ? 'rgba(255,220,150,0.55)' : 'rgba(255,230,160,0.9)';
    ctx.lineWidth = this.mg ? 1.4 : 2.2;
    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.lineTo(this.x, this.y);
    ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.mg ? 1.4 : 2.2, 0, Math.PI * 2);
    ctx.fill();
  }
}

class Bomb {
  constructor(owner, team, x, y, vx, vy, dmg, radius) {
    this.owner = owner;
    this.team = team;
    this.x = x; this.y = y;
    this.vx = vx; this.vy = vy;
    this.dmg = dmg;
    this.radius = radius;
    this.fuse = 1.5;
    this.dir = Math.atan2(vy, vx);
    this.dead = false;
  }

  update(dt, g) {
    const drag = 1 - 0.35 * dt;
    this.vx *= drag;
    this.vy *= drag;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.fuse -= dt;
    this.z = U.clamp(1 - this.fuse / 1.5, 0, 1);
    if (this.fuse <= 0) {
      g.groundBlast(this.x, this.y, this.owner, this.team, this.dmg, this.radius);
      return false;
    }
    return this.x > -100 && this.y > -100 && this.x < g.world.w + 100 && this.y < g.world.h + 100;
  }

  draw(ctx) {
    const s = U.lerp(0.55, 1.15, this.z);
    ctx.fillStyle = 'rgba(0,0,0,0.32)';
    ctx.beginPath();
    ctx.ellipse(this.x + this.z * 26, this.y + this.z * 34, 7 * s, 4.5 * s, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.dir);
    ctx.fillStyle = '#4c4f45';
    ctx.beginPath();
    ctx.ellipse(0, 0, 11 * s, 5 * s, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#33362e';
    ctx.fillRect(-11 * s, -1.2 * s, 6 * s, 2.4 * s);
    ctx.fillStyle = '#7d8172';
    ctx.beginPath();
    ctx.arc(11 * s, 0, 2 * s, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

class Tank {
  constructor(team, spec, x, y, angle, isPlayer) {
    this.team = team;
    this.spec = spec;
    this.x = x; this.y = y;
    this.angle = angle;
    this.turret = angle;
    this.speed = 0;
    this.hp = spec.hp;
    this.crewAlive = spec.crew;
    this.ammo = spec.gun.ammo;
    this.reload = 0;
    this.mgCd = 0;
    this.alive = true;
    this.isPlayer = isPlayer;
    this.modules = { engine: false, fireTime: 0, trackTime: 0, gunTime: 0 };
    this.ctrl = { throttle: 0, steer: 0, turret: angle, fire: false };
    this.ai = { thinkTimer: 0, target: null, strafeDir: 1, strafeTimer: 0, aimErr: 0 };
    this.flash = 0;
    this.recoil = 0;
    this.smokeT = U.rand(0, 0.3);
    this.kills = 0;
    this.damageDealt = 0;
  }

  reloadMult() {
    return 1 + (this.spec.crew - this.crewAlive) * 0.22 + (this.modules.gunTime > 0 ? 0.5 : 0);
  }

  containsPoint(px, py) {
    const dx = px - this.x, dy = py - this.y;
    const c = Math.cos(this.angle), s = Math.sin(this.angle);
    const lx = dx * c + dy * s;
    const ly = -dx * s + dy * c;
    return Math.abs(lx) <= this.spec.size.l / 2 + 1 && Math.abs(ly) <= this.spec.size.w / 2 + 1;
  }

  update(dt, g) {
    if (!this.alive) {
      this.smokeT -= dt;
      if (this.smokeT <= 0) {
        this.smokeT = U.rand(0.25, 0.5);
        FX.smokePuff(this.x + U.rand(-14, 14), this.y + U.rand(-14, 14), g, true);
        if (Math.random() < 0.3) FX.flame(this.x + U.rand(-10, 10), this.y + U.rand(-10, 10), g);
      }
      return;
    }

    const m = this.modules;
    if (this.reload > 0) this.reload -= dt;
    if (this.mgCd > 0) this.mgCd -= dt;
    if (this.flash > 0) this.flash -= dt;
    if (this.recoil > 0) this.recoil -= dt * 4;
    if (m.gunTime > 0) m.gunTime -= dt;
    if (m.trackTime > 0) m.trackTime -= dt;
    if (m.fireTime > 0) {
      m.fireTime -= dt;
      this.hp -= 9 * dt;
      this.smokeT -= dt;
      if (this.smokeT <= 0) { this.smokeT = 0.12; FX.flame(this.x + U.rand(-16, 16), this.y + U.rand(-12, 12), g); }
      if (this.hp <= 0) { this.destroy(g, null); return; }
    }

    const immobilized = m.trackTime > 0;
    const throttle = immobilized ? 0 : this.ctrl.throttle;
    const enginePen = m.engine ? 0.4 : 1;
    const targetSpeed = throttle >= 0
      ? this.spec.speed * throttle * enginePen
      : this.spec.reverse * (-throttle) * enginePen;
    this.speed = U.lerp(this.speed, targetSpeed, dt * 2.5);
    if (!immobilized) this.angle += this.ctrl.steer * this.spec.turn * dt;
    this.x += Math.cos(this.angle) * this.speed * dt;
    this.y += Math.sin(this.angle) * this.speed * dt;

    this.collide(g);

    const deadCrew = this.spec.crew - this.crewAlive;
    const tt = this.spec.turretTurn * Math.max(0.25, 1 - deadCrew * 0.2 - (m.gunTime > 0 ? 0.4 : 0));
    if (this.ctrl.turret !== null && tt > 0) {
      const d = U.angDiff(this.turret, this.ctrl.turret);
      this.turret = U.angNorm(this.turret + U.clamp(d, -tt * dt, tt * dt));
    }

    if (this.ctrl.fire && this.reload <= 0 && this.ammo > 0 && m.gunTime <= 0) {
      g.fireMainGun(this);
    }

    if (this.mgCd <= 0) {
      const target = this.findMgTarget(g);
      if (target) g.fireMg(this, target);
    }
  }

  collide(g) {
    const rad = 27;
    this.x = U.clamp(this.x, rad, g.world.w - rad);
    this.y = U.clamp(this.y, rad, g.world.h - rad);
    for (const o of g.obstacles) {
      const dx = this.x - o.x, dy = this.y - o.y;
      const d = Math.hypot(dx, dy);
      const min = o.r + rad - 8;
      if (d < min && d > 0.01) {
        const p = min - d;
        this.x += dx / d * p;
        this.y += dy / d * p;
      }
    }
    for (const other of g.tanks) {
      if (other === this) continue;
      const dx = this.x - other.x, dy = this.y - other.y;
      const d = Math.hypot(dx, dy);
      const min = 55;
      if (d < min && d > 0.01) {
        const p = (min - d) * (other.alive ? 0.5 : 1);
        this.x += dx / d * p;
        this.y += dy / d * p;
        if (other.alive) {
          other.x -= dx / d * p;
          other.y -= dy / d * p;
        }
      }
    }
  }

  findMgTarget(g) {
    let best = null, bestD = 620;
    for (const p of g.planes) {
      if (!p.alive || p.team === this.team) continue;
      const d = U.dist(this.x, this.y, p.x, p.y);
      if (d < bestD) { bestD = d; best = p; }
    }
    return best;
  }

  takeHit(s, g) {
    if (!this.alive) return;
    const px = s.x, py = s.y;
    const camD = g.camDist(px, py);

    if (s.mg) {
      this.hp -= s.dmg;
      FX.hitSparks(px, py, g);
      if (this.hp <= 0) this.destroy(g, s.owner);
      return;
    }

    const dir = Math.atan2(s.vy, s.vx);
    const turretHit = U.dist2(px, py, this.x, this.y) < Math.pow(this.spec.turret.r + 3, 2);
    const headAngle = turretHit ? this.turret : this.angle;
    const aRel = Math.abs(U.angNorm(dir - headAngle));
    const q = Math.min(aRel, Math.PI - aRel);
    let armorKey, impactF;
    if (aRel > 2.4) { armorKey = 'front'; impactF = Math.PI - aRel; }
    else if (aRel < 0.9) { armorKey = 'rear'; impactF = aRel; }
    else { armorKey = 'side'; impactF = Math.PI / 2 - q; }

    const A = this.spec.armor;
    let armor;
    if (turretHit) armor = armorKey === 'front' ? A.turretF : (armorKey === 'rear' ? A.turretS * 0.8 : A.turretS);
    else armor = A[armorKey];

    const eff = armor / Math.max(0.12, Math.cos(Math.min(impactF, 1.45)));

    if (s.pen < eff) {
      FX.ricochet(px, py, g);
      Sfx.ricochet();
      g.floatText(px, py - 14, impactF > 1.45 ? 'РИКОШЕТ' : 'НЕ ПРОБИЛ', '#c9cdb9', 12);
      return;
    }

    const before = this.hp;
    this.hp -= s.dmg;
    if (s.owner) s.owner.damageDealt = (s.owner.damageDealt || 0) + Math.min(s.dmg, before);
    Sfx.armorHit();

    const r = Math.random();
    if (r < 0.20) {
      this.modules.trackTime = Math.max(this.modules.trackTime, U.rand(4, 6.5));
      g.floatText(px, py - 16, 'ГУСЕНИЦА', '#ffce6e');
    } else if (r < 0.32) {
      this.modules.engine = true;
      g.floatText(px, py - 16, 'ДВИГАТЕЛЬ', '#ffce6e');
      if (Math.random() < 0.3 && this.modules.fireTime <= 0) {
        this.modules.fireTime = 6;
        g.floatText(this.x, this.y - 40, 'ПОЖАР!', '#ff7a4a', 18);
      }
    } else if (r < 0.40) {
      if (Math.random() < 0.4) {
        this.hp = 0;
        g.floatText(px, py - 16, 'ВЗРЫВ БК!', '#ff5a3a', 18);
      } else {
        this.ammo = Math.floor(this.ammo / 2);
        g.floatText(px, py - 16, 'БК ПОВРЕЖДЁН', '#ffce6e');
      }
    } else if (r < 0.50) {
      this.modules.gunTime = Math.max(this.modules.gunTime, U.rand(6, 9));
      g.floatText(px, py - 16, 'ОРУДИЕ', '#ffce6e');
    } else if (r < 0.68) {
      this.crewAlive--;
      if (this.crewAlive < 0) this.crewAlive = 0;
      g.floatText(px, py - 16, 'ЭКИПАЖ', '#ff9c6e');
    }
    if (s.dmg > 100 && Math.random() < 0.12 && this.modules.fireTime <= 0) this.modules.fireTime = 5;

    g.floatText(px, py - 2, '-' + Math.round(Math.min(s.dmg, before)), '#ffd98a', 15);

    if (this.crewAlive <= 1) this.hp = 0;
    if (this.hp <= 0) this.destroy(g, s.owner);

    if (this.isPlayer) {
      g.shake = Math.min(g.shake + 8, 18);
      if (this.modules.fireTime > 0) Sfx.armorHit();
    }
  }

  destroy(g, killer) {
    if (!this.alive) return;
    this.alive = false;
    this.crewAlive = 0;
    this.speed = 0;
    FX.boom(this.x, this.y, g, 1.3);
    FX.ring(this.x, this.y, 30, g, '#ff9c4a');
    Sfx.bigExplosion(g.camDist(this.x, this.y));
    g.onUnitKilled(this, killer);
  }

  draw(ctx) {
    const c = TEAMS[this.team];
    ctx.save();
    ctx.translate(this.x, this.y);

    ctx.fillStyle = 'rgba(0,0,0,0.28)';
    ctx.save();
    ctx.rotate(this.angle);
    ctx.fillRect(-this.spec.size.l / 2 + 4, -this.spec.size.w / 2 + 5, this.spec.size.l, this.spec.size.w);
    ctx.restore();

    ctx.rotate(this.angle);
    const w = this.spec.size.w, l = this.spec.size.l;
    const trackDmg = this.modules.trackTime > 0;
    ctx.fillStyle = c.track;
    ctx.fillRect(-l / 2 - 3, -w / 2 - 5, l + 6, 10);
    ctx.fillRect(-l / 2 - 3, w / 2 - 5, l + 6, 10);
    if (trackDmg) {
      ctx.strokeStyle = '#1a1a16';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-l / 4, -w / 2 - 5); ctx.lineTo(-l / 4 - 10, w / 2 + 5);
      ctx.moveTo(-l / 4, -w / 2 - 5); ctx.lineTo(-l / 4 + 10, w / 2 + 5);
      ctx.stroke();
    }
    ctx.fillStyle = c.body;
    ctx.fillRect(-l / 2, -w / 2, l, w);
    ctx.strokeStyle = c.dark;
    ctx.lineWidth = 2;
    ctx.strokeRect(-l / 2, -w / 2, l, w);
    ctx.fillStyle = 'rgba(255,255,255,0.10)';
    ctx.beginPath();
    ctx.moveTo(l / 2, -w / 2);
    ctx.lineTo(l / 2, w / 2);
    ctx.lineTo(l / 2 - 16, w / 2 - 4);
    ctx.lineTo(l / 2 - 16, -w / 2 + 4);
    ctx.fill();
    if (this.spec.casemate) {
      ctx.fillStyle = c.dark;
      ctx.beginPath();
      ctx.moveTo(-l / 2 + 10, -w / 2 + 4);
      ctx.lineTo(-l / 2 + 26, -w / 2 + 9);
      ctx.lineTo(-l / 2 + 26, w / 2 - 9);
      ctx.lineTo(-l / 2 + 10, w / 2 - 4);
      ctx.closePath();
      ctx.fill();
    }

    ctx.rotate(-this.angle);
    ctx.rotate(this.turret);
    const rec = this.recoil > 0 ? this.recoil * 5 : 0;
    ctx.fillStyle = c.dark;
    ctx.fillRect(this.spec.turret.r - 2 - rec, -2.6, this.spec.turret.barrel, 5.2);
    ctx.fillStyle = c.track;
    ctx.fillRect(this.spec.turret.r + this.spec.turret.barrel - 8 - rec, -3.6, 7, 7.2);
    if (this.spec.casemate) {
      ctx.fillStyle = c.body;
      ctx.beginPath();
      ctx.arc(0, 0, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = c.dark;
      ctx.stroke();
    } else {
      ctx.fillStyle = c.body;
      ctx.beginPath();
      ctx.arc(0, 0, this.spec.turret.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = c.dark;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = c.dark;
      ctx.beginPath();
      ctx.arc(0, 0, 6, 0, Math.PI * 2);
      ctx.fill();
    }
    if (this.flash > 0) {
      ctx.fillStyle = 'rgba(255,240,180,0.95)';
      ctx.beginPath();
      ctx.arc(this.spec.turret.r + this.spec.turret.barrel + 6, 0, 12, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    if (this.isPlayer && this.alive) {
      ctx.strokeStyle = 'rgba(232,220,180,0.5)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.arc(this.x, this.y, 34, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    if (this.alive && !this.isPlayer) {
      const bw = 40;
      const hp = U.clamp(this.hp / this.maxHpSafe(), 0, 1);
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      ctx.fillRect(this.x - bw / 2, this.y - this.spec.size.w / 2 - 16, bw, 5);
      ctx.fillStyle = this.team === G.playerNation ? '#7fae62' : '#d8635a';
      ctx.fillRect(this.x - bw / 2, this.y - this.spec.size.w / 2 - 16, bw * hp, 5);
    }
  }

  maxHpSafe() { return this.spec.hp; }
}

class Plane {
  constructor(team, kind, g) {
    this.team = team;
    this.kind = kind;
    this.spec = PLANE_DB[team][kind];
    const fromEast = team === 'germany';
    this.x = fromEast ? g.world.w + 140 : -140;
    this.y = U.rand(400, g.world.h - 400);
    this.angle = fromEast ? Math.PI : 0;
    this.hp = this.spec.hp;
    this.bombs = this.spec.bombs || 0;
    this.alive = true;
    this.dropCd = 0;
    this.mgCd = 0;
    this.prop = 0;
    this.kills = 0;
    this.damageDealt = 0;
    this.ai = {
      desired: this.angle,
      target: null,
      retarget: 0,
      firing: false,
      burstT: 0,
      pauseT: 0,
      dropDone: false
    };
  }

  takeHit(s, g) {
    if (!this.alive) return;
    const dmg = s.mg ? s.dmg : s.dmg * 0.25;
    this.hp -= dmg;
    if (s.owner) s.owner.damageDealt = (s.owner.damageDealt || 0) + dmg;
    FX.hitSparks(s.x, s.y, g);
    Sfx.hit();
    if (this.hp <= 0) this.destroy(g, s.owner);
  }

  destroy(g, killer) {
    if (!this.alive) return;
    this.alive = false;
    FX.boom(this.x, this.y, g, 1.1);
    FX.ring(this.x, this.y, 26, g, '#ffb066');
    Sfx.explosion(g.camDist(this.x, this.y));
    g.onUnitKilled(this, killer);
  }

  update(dt, g) {
    if (!this.alive) return;
    planeAI(this, g, dt);

    const ta = this.ai.desired;
    const d = U.angDiff(this.angle, ta);
    this.angle = U.angNorm(this.angle + U.clamp(d, -this.spec.turn * dt, this.spec.turn * dt));

    this.x += Math.cos(this.angle) * this.spec.speed * dt;
    this.y += Math.sin(this.angle) * this.spec.speed * dt;
    this.prop += dt * 40;

    if (this.mgCd > 0) this.mgCd -= dt;
    if (this.dropCd > 0) this.dropCd -= dt;

    if (this.ai.firing && this.mgCd <= 0) {
      this.mgCd = 0.1;
      const perp = this.angle + Math.PI / 2;
      for (let i = 0; i < this.spec.guns; i++) {
        const off = (i % 2 === 0 ? 1 : -1) * 9;
        const gx = this.x + Math.cos(perp) * off + Math.cos(this.angle) * 16;
        const gy = this.y + Math.sin(perp) * off + Math.sin(this.angle) * 16;
        const a = this.angle + U.rand(-0.05, 0.05);
        g.shells.push(new Shell(this, this.team, gx, gy, a, null, true, this.spec.mgDmg));
      }
      Sfx.mgShot(g.camDist(this.x, this.y));
    }

    if (this.ai.dropNow && this.bombs > 0 && this.dropCd <= 0) {
      this.ai.dropNow = false;
      this.dropCd = 0.55;
      this.bombs--;
      g.bombs.push(new Bomb(this, this.team,
        this.x + Math.cos(this.angle) * 6,
        this.y + Math.sin(this.angle) * 6,
        Math.cos(this.angle) * this.spec.speed,
        Math.sin(this.angle) * this.spec.speed,
        this.spec.bombDmg, this.spec.bombRadius
      ));
    }
  }

  draw(ctx) {
    const isBomber = !!this.spec.bombs;
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    ctx.save();
    ctx.translate(this.x + 20, this.y + 28);
    ctx.rotate(this.angle);
    this.drawSilhouette(ctx, isBomber, 0.85, true);
    ctx.restore();

    const c = TEAMS[this.team];
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    this.drawSilhouette(ctx, isBomber, 1, false, c);
    ctx.fillStyle = 'rgba(230,230,230,0.35)';
    ctx.beginPath();
    ctx.arc(isBomber ? -2 : -10, 0, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  drawSilhouette(ctx, isBomber, scale, shadow, c) {
    const body = shadow ? '#000' : (c ? c.body : '#555');
    const dark = shadow ? '#000' : (c ? c.dark : '#333');
    ctx.fillStyle = body;
    ctx.strokeStyle = dark;
    ctx.lineWidth = 1.5;
    if (isBomber) {
      ctx.beginPath();
      ctx.ellipse(0, 0, 34 * scale, 7 * scale, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(12, -8 * scale, 10 * scale, 22 * scale, 0, 0, Math.PI * 2);
      ctx.ellipse(12, 8 * scale, 10 * scale, 22 * scale, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(-30, 0, 7 * scale, 13 * scale, 0, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.ellipse(0, 0, 30 * scale, 5 * scale, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(6, -11 * scale, 12 * scale, 4.5 * scale, 0, 0, Math.PI * 2);
      ctx.ellipse(6, 11 * scale, 12 * scale, 4.5 * scale, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(-26, 0, 8 * scale, 2.5 * scale, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}
