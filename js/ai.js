function tankAI(t, g, dt) {
  const ai = t.ai;
  ai.thinkTimer -= dt;
  ai.strafeTimer -= dt;
  if (ai.acqT === undefined) { ai.acqT = 0; ai.errT = 0; ai.errTarget = 0; }
  ai.acqT -= dt;
  ai.errT -= dt;
  if (ai.errT <= 0) {
    ai.errT = U.rand(0.4, 0.8);
    ai.errTarget = U.rand(-1, 1);
  }
  ai.aimErr = U.lerp(ai.aimErr, ai.errTarget, Math.min(1, dt * 3));

  const enemies = g.tanks.filter(o => o.alive && o.team !== t.team);
  if (!ai.target || !ai.target.alive || ai.thinkTimer <= 0) {
    ai.thinkTimer = U.rand(0.9, 1.7);
    ai.acqT = U.rand(0.5, 1.1);
    let best = null, bestScore = 1e9;
    for (const e of enemies) {
      const d = U.dist(t.x, t.y, e.x, e.y) - (e.isPlayer ? 180 : 0);
      if (d < bestScore) { bestScore = d; best = e; }
    }
    ai.target = best;
  }
  if (ai.strafeTimer <= 0) {
    ai.strafeTimer = U.rand(1.5, 3.5);
    ai.strafeDir = Math.random() < 0.5 ? 1 : -1;
  }

  const cap = g.cap;
  let moveX = cap.x, moveY = cap.y;

  if (ai.target && t.ammo > 0) {
    const tg = ai.target;
    const d = U.dist(t.x, t.y, tg.x, tg.y);
    const flight = d / t.spec.gun.speed;
    const leadX = tg.x + Math.cos(tg.angle) * tg.speed * flight;
    const leadY = tg.y + Math.sin(tg.angle) * tg.speed * flight;
    const aimAngle = Math.atan2(leadY - t.y, leadX - t.x);
    t.ctrl.turret = aimAngle + ai.aimErr * t.spec.gun.disp * 3;

    const aimed = Math.abs(U.angDiff(t.turret, aimAngle)) < 0.05 + t.spec.gun.disp * 1.5;
    const inRange = d < 1000;
    const canPen = g.canPen(t, tg);
    t.ctrl.fire = aimed && inRange && canPen && t.reload <= 0 && t.ammo > 0 && ai.acqT <= 0;

    const isHeavy = t.spec.cls.includes('Тяж');
    const isTD = t.spec.cls.includes('ПТ');
    const desired = isHeavy ? 300 : (isTD ? 780 : 540);

    let ma;
    if (d > desired + 140) ma = aimAngle;
    else if (d < desired - 100) ma = aimAngle + Math.PI;
    else ma = aimAngle + Math.PI / 2 * ai.strafeDir;

    moveX = t.x + Math.cos(ma) * 300;
    moveY = t.y + Math.sin(ma) * 300;
  } else {
    t.ctrl.fire = false;
  }

  let desiredAngle = Math.atan2(moveY - t.y, moveX - t.x);
  const aheadX = t.x + Math.cos(t.angle) * 95;
  const aheadY = t.y + Math.sin(t.angle) * 95;
  for (const o of g.obstacles) {
    if (!o.solid) continue;
    if (U.dist(aheadX, aheadY, o.x, o.y) < o.r + 50) {
      const rel = U.angDiff(t.angle, Math.atan2(o.y - t.y, o.x - t.x));
      desiredAngle -= rel > 0 ? 0.9 : -0.9;
      break;
    }
  }

  const steerErr = U.angDiff(t.angle, desiredAngle);
  t.ctrl.steer = U.clamp(steerErr * 2.4, -1, 1);
  t.ctrl.throttle = Math.abs(steerErr) < 1.25 ? 1 : 0.3;
  if (!enemies.length && Math.abs(steerErr) < 0.2 && U.dist(t.x, t.y, cap.x, cap.y) < cap.r) {
    t.ctrl.throttle = 0;
  }
}

function planeAI(p, g, dt) {
  const ai = p.ai;
  ai.retarget -= dt;

  const M = 130;
  if (p.x < M || p.x > g.world.w - M || p.y < M || p.y > g.world.h - M) {
    ai.desired = Math.atan2(g.world.h / 2 - p.y, g.world.w / 2 - p.x);
    return;
  }

  let desired = ai.desired;

  if (p.spec.bombs) {
    if (p.bombs <= 0) ai.dropDone = true;
    if (!ai.dropDone) {
      if (!ai.target || !ai.target.alive || ai.retarget <= 0) {
        ai.retarget = U.rand(2.5, 4);
        ai.target = g.pickBombTarget(p);
      }
      const tg = ai.target;
      if (tg) {
        desired = Math.atan2(tg.y - p.y, tg.x - p.x);
        const blastAhead = p.spec.speed * 1.5 * 0.82;
        const bx = p.x + Math.cos(p.angle) * blastAhead;
        const by = p.y + Math.sin(p.angle) * blastAhead;
        const align = Math.abs(U.angDiff(p.angle, desired));
        if (U.dist(bx, by, tg.x, tg.y) < 130 && align < 0.3) {
          ai.dropNow = true;
        }
      }
    } else {
      const cap = g.cap;
      desired = Math.atan2(cap.y - p.y, cap.x - p.x);
    }
  } else {
    const enemyPlanes = g.planes.filter(o => o.alive && o.team !== p.team);
    if (enemyPlanes.length) {
      let best = null, bestD = 1e9;
      for (const e of enemyPlanes) {
        const d = U.dist(p.x, p.y, e.x, e.y);
        if (d < bestD) { bestD = d; best = e; }
      }
      ai.target = best;
    } else if (!ai.target || !ai.target.alive || ai.target.kind !== undefined || ai.retarget <= 0) {
      ai.retarget = U.rand(2, 3.5);
      ai.target = g.pickStrafeTarget(p);
    }
    const tg = ai.target;
    if (tg && tg.alive) {
      const isPlane = tg.kind !== undefined;
      const d = U.dist(p.x, p.y, tg.x, tg.y);
      const flight = d / 1700;
      const tv = isPlane ? tg.spec.speed : (tg.speed || 120);
      const leadX = tg.x + Math.cos(tg.angle) * tv * flight;
      const leadY = tg.y + Math.sin(tg.angle) * tv * flight;
      desired = Math.atan2(leadY - p.y, leadX - p.x);
      const align = Math.abs(U.angDiff(p.angle, desired));
      if (d < 440 && align < 0.2) {
        ai.pauseT -= dt;
        if (ai.pauseT <= 0 && !ai.firing) {
          ai.firing = true;
          ai.burstT = p.spec.burstTime;
        }
      }
    }
    if (ai.firing) {
      ai.burstT -= dt;
      if (ai.burstT <= 0) {
        ai.firing = false;
        ai.pauseT = p.spec.burstPause;
      }
    }
  }

  ai.desired = desired;
}
