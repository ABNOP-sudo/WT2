const UI = {
  nation: 'germany',
  selected: { germany: TANK_DB.germany[0].id, ussr: TANK_DB.ussr[0].id },

  init() {
    document.querySelectorAll('#nation-tabs button').forEach(btn => {
      btn.addEventListener('click', () => {
        this.nation = btn.dataset.nation;
        document.querySelectorAll('#nation-tabs button').forEach(b => b.classList.toggle('active', b === btn));
        Sfx.uiClick();
        this.renderTankGrid();
      });
    });

    document.getElementById('start-btn').addEventListener('click', () => {
      Sfx.init();
      Sfx.uiClick();
      G.startBattle(this.nation, this.selected[this.nation]);
    });

    document.getElementById('again-btn').addEventListener('click', () => {
      Sfx.uiClick();
      document.getElementById('result-overlay').classList.add('hidden');
      document.getElementById('menu').classList.remove('hidden');
      document.getElementById('hud').classList.add('hidden');
      G.state = 'menu';
      this.renderTankGrid();
    });

    this.renderTankGrid();
  },

  statBars(spec) {
    const armor = Math.min(100, (spec.armor.front + spec.armor.side) / 3.2);
    const dmg = Math.min(100, spec.gun.dmg / 3.4);
    const rof = Math.min(100, (12 / spec.gun.reload) * 8);
    const mob = Math.min(100, spec.speed / 2.2);
    const rows = [
      ['Броня', armor],
      ['Огневая мощь', dmg],
      ['Скорострельность', rof],
      ['Подвижность', mob]
    ];
    return rows.map(([label, v]) =>
      `<div class="card-tk"><div class="chk"><span>${label}</span></div><div class="b"><i style="width:${Math.round(v)}%"></i></div></div>`
    ).join('');
  },

  renderTankGrid() {
    const grid = document.getElementById('tank-grid');
    grid.innerHTML = '';
    const specs = TANK_DB[this.nation];
    const selId = this.selected[this.nation];
    for (const spec of specs) {
      const card = document.createElement('div');
      card.className = 'tank-card' + (spec.id === selId ? ' selected' : '');
      card.innerHTML = `
        <h3>${spec.name}</h3>
        <div class="cls">${spec.cls}</div>
        ${this.statBars(spec)}
      `;
      card.addEventListener('click', () => {
        this.selected[this.nation] = spec.id;
        Sfx.uiClick();
        this.renderTankGrid();
      });
      grid.appendChild(card);
    }

    const sel = specs.find(s => s.id === this.selected[this.nation]);
    document.getElementById('detail-inner').innerHTML = `
      <b>${sel.name}</b>
      <div class="drow">Броня корпуса: <span>${sel.armor.front} / ${sel.armor.side} / ${sel.armor.rear} мм</span> ·
      Башня: <span>${sel.armor.turretF} / ${sel.armor.turretS} мм</span></div>
      <div class="drow">Орудие: <span>${sel.gun.pen} мм пробития</span> · <span>${sel.gun.dmg} урона</span> ·
      перезарядка <span>${sel.gun.reload.toFixed(1)} с</span> · боезапас <span>${sel.gun.ammo}</span></div>
      <div class="drow">Экипаж: <span>${sel.crew} чел.</span> · Макс. урон от пожара и попаданий не по модулю включён</div>
      <div class="drow" style="margin-top:4px">${sel.desc}</div>
    `;

    const db = PLANE_DB[this.nation];
    document.getElementById('airfighter-info').textContent = '✈ Истребитель: ' + db.fighter.name + ' — патрулирует и сбивает самолёты, штурмует наземные цели';
    document.getElementById('airbomber-info').textContent = '✈ Бомбардировщик: ' + db.bomber.name + ` — несёт ${db.bomber.bombs} бомбы (${db.bomber.bombDmg} урона каждому, радиус ${db.bomber.bombRadius}), сбрасывает по наземным целям`;
  },

  updateHUD(g) {
    const t = g.player;
    const tu = document.getElementById('tickets-ussr-fill');
    const tg = document.getElementById('tickets-germany-fill');
    tu.style.width = (g.tickets.ussr / g.startTickets * 100) + '%';
    tg.style.width = (g.tickets.germany / g.startTickets * 100) + '%';
    document.getElementById('tickets-ussr-n').textContent = Math.max(0, Math.round(g.tickets.ussr));
    document.getElementById('tickets-germany-n').textContent = Math.max(0, Math.round(g.tickets.germany));

    const ring = document.getElementById('cap-ring');
    ring.style.borderColor = g.cap.owner === 'ussr' ? '#d8635a' : (g.cap.owner === 'germany' ? '#c9cfbf' : '#8b8d7c');
    ring.style.color = g.cap.owner === 'ussr' ? '#ff9c92' : (g.cap.owner === 'germany' ? '#fff' : '#b6bda8');

    if (!t) return;
    document.getElementById('panel-tank-name').textContent = t.spec.name;
    document.getElementById('panel-speed').textContent = Math.round(Math.abs(t.speed) / 5) + ' км/ч';

    const crewRow = document.getElementById('crew-row');
    let crewHtml = '';
    for (let i = 0; i < t.spec.crew; i++) {
      crewHtml += `<div class="crew-ico${i < t.crewAlive ? '' : ' dead'}">●</div>`;
    }
    crewRow.innerHTML = crewHtml;

    document.getElementById('mod-fire').className = 'mod' + (t.modules.fireTime > 0 ? ' fire-on' : '');
    document.getElementById('mod-track').className = 'mod' + (t.modules.trackTime > 0 ? ' on' : '');
    document.getElementById('mod-engine').className = 'mod' + (t.modules.engine ? ' on' : '');
    document.getElementById('mod-gun').className = 'mod' + (t.modules.gunTime > 0 ? ' on' : '');

    const hpFrac = U.clamp(t.hp / t.spec.hp, 0, 1);
    const hpFill = document.getElementById('hp-fill');
    hpFill.style.width = (hpFrac * 100) + '%';
    hpFill.className = hpFrac < 0.3 ? 'low' : '';
    document.getElementById('hp-n').textContent = Math.max(0, Math.round(t.hp)) + ' / ' + t.spec.hp;

    document.getElementById('ammo-n').textContent = 'БП: ' + t.ammo;
    const rf = document.getElementById('reload-fill');
    if (t.reload <= 0) {
      rf.className = 'ready';
      rf.style.width = '100%';
    } else {
      rf.className = '';
      rf.style.width = (100 * (1 - t.reload / (t.spec.gun.reload * t.reloadMult()))) + '%';
    }

    const dt2 = document.getElementById('death-overlay');
    if (!t.alive && G.state === 'battle') {
      dt2.classList.remove('hidden');
      document.getElementById('respawn-t').textContent = Math.ceil(G.respawnTimer);
    } else {
      dt2.classList.add('hidden');
    }
  },

  showResult(g) {
    const win = g.winner === g.playerNation;
    const title = document.getElementById('result-title');
    title.textContent = win ? 'ПОБЕДА!' : 'ПОРАЖЕНИЕ';
    title.className = win ? 'win' : 'lose';
    document.getElementById('result-stats').innerHTML =
      `Очки прочности: <b>${g.playerNation === 'ussr' ? 'СССР ' + Math.max(0, Math.round(g.tickets.ussr)) : 'Германия ' + Math.max(0, Math.round(g.tickets.germany))}</b><br>` +
      `Фраги: <b>${g.playerKills}</b> · Нанесено урона: <b>${Math.round(g.playerDamage)}</b> · Время боя: <b>${Math.floor(g.time / 60)}:${String(Math.floor(g.time % 60)).padStart(2, '0')}</b>`;
    document.getElementById('result-overlay').classList.remove('hidden');
  }
};
