const TEAMS = {
  germany: {
    name: 'Германия',
    body: '#5a6360',
    dark: '#3b423f',
    track: '#282d2a',
    accent: '#9aa59e',
    hpColor: '#b9c2b2'
  },
  ussr: {
    name: 'СССР',
    body: '#5b6646',
    dark: '#3c442c',
    track: '#252a1b',
    accent: '#8a9468',
    hpColor: '#d8635a'
  }
};

const TANK_DB = {
  germany: [
    {
      id: 'pz4g',
      name: 'Pz.Kpfw. IV Ausf. G',
      cls: 'Средний танк',
      armor: { front: 50, side: 30, rear: 20, turretF: 50, turretS: 30 },
      gun: { pen: 80, dmg: 150, reload: 4.2, disp: 0.024, speed: 1450, ammo: 36 },
      hp: 280, crew: 5,
      speed: 190, reverse: 95, turn: 1.6, turretTurn: 1.1,
      size: { w: 46, l: 84 },
      turret: { r: 18, barrel: 48 },
      casemate: false,
      desc: 'Рабочая лошадка панцерваффе. Универсальное 75-мм орудие KwK 40, достойная подвижность. Слабая бортовая броня.'
    },
    {
      id: 'panther',
      name: 'Pz.Kpfw. V «Пантера»',
      cls: 'Средний танк',
      armor: { front: 80, side: 50, rear: 40, turretF: 110, turretS: 45 },
      gun: { pen: 155, dmg: 210, reload: 5.4, disp: 0.020, speed: 1500, ammo: 30 },
      hp: 300, crew: 5,
      speed: 200, reverse: 100, turn: 1.5, turretTurn: 1.2,
      size: { w: 48, l: 92 },
      turret: { r: 19, barrel: 56 },
      casemate: false,
      desc: 'Длинноствольное 75-мм KwK 42 пробивает почти всё. Рикошетная лобовая броня, но слабые борта.'
    },
    {
      id: 'tiger1',
      name: 'Pz.Kpfw. VI «Тигр»',
      cls: 'Тяжёлый танк',
      armor: { front: 100, side: 80, rear: 80, turretF: 100, turretS: 80 },
      gun: { pen: 130, dmg: 230, reload: 6.2, disp: 0.018, speed: 1450, ammo: 30 },
      hp: 340, crew: 5,
      speed: 165, reverse: 80, turn: 1.3, turretTurn: 1.0,
      size: { w: 50, l: 94 },
      turret: { r: 21, barrel: 54 },
      casemate: false,
      desc: 'Легендарный тяжёлый танк. Толстая броня со всех сторон, точная 88-мм пушка. Нетороплив и дорог в ремонте.'
    },
    {
      id: 'stug',
      name: 'StuG III Ausf. G',
      cls: 'ПТ-САУ (казематная)',
      armor: { front: 80, side: 30, rear: 30, turretF: 50, turretS: 30 },
      gun: { pen: 105, dmg: 190, reload: 4.6, disp: 0.020, speed: 1450, ammo: 30 },
      hp: 300, crew: 4,
      speed: 180, reverse: 85, turn: 1.4, turretTurn: 0.4,
      size: { w: 44, l: 80 },
      turret: { r: 20, barrel: 48 },
      casemate: true,
      desc: 'Штурмовое орудие без башни: gun наводится вместе с корпусом. Низкий силуэт, опасные засады, слабая бортовая броня.'
    },
    {
      id: 'tiger2',
      name: 'Pz.Kpfw. VII «Тигр II»',
      cls: 'Тяжёлый танк',
      armor: { front: 150, side: 80, rear: 80, turretF: 180, turretS: 80 },
      gun: { pen: 170, dmg: 260, reload: 7.0, disp: 0.016, speed: 1450, ammo: 26 },
      hp: 380, crew: 5,
      speed: 150, reverse: 75, turn: 1.2, turretTurn: 0.9,
      size: { w: 54, l: 100 },
      turret: { r: 22, barrel: 60 },
      casemate: false,
      desc: '«Королевский тигр». Почти непробиваемая лобовая броня и мощнейшее орудие. Медлителен и уязвим в борта.'
    }
  ],
  ussr: [
    {
      id: 't34_76',
      name: 'Т-34 (обр. 1941)',
      cls: 'Средний танк',
      armor: { front: 45, side: 45, rear: 40, turretF: 52, turretS: 45 },
      gun: { pen: 78, dmg: 150, reload: 4.4, disp: 0.026, speed: 1450, ammo: 36 },
      hp: 280, crew: 4,
      speed: 210, reverse: 105, turn: 1.7, turretTurn: 1.1,
      size: { w: 44, l: 78 },
      turret: { r: 18, barrel: 44 },
      casemate: false,
      desc: 'Наклонная броня и отличная подвижность. 76-мм орудие требует сближения с тяжёлыми танками.'
    },
    {
      id: 't34_85',
      name: 'Т-34-85',
      cls: 'Средний танк',
      armor: { front: 65, side: 45, rear: 45, turretF: 90, turretS: 60 },
      gun: { pen: 128, dmg: 190, reload: 5.6, disp: 0.021, speed: 1500, ammo: 32 },
      hp: 300, crew: 5,
      speed: 215, reverse: 110, turn: 1.65, turretTurn: 1.25,
      size: { w: 46, l: 82 },
      turret: { r: 19, barrel: 50 },
      casemate: false,
      desc: 'Новая башня и 85-мм орудие ЗИС-С-53. Хорош во всём: подвижность, огонь, разумная броня.'
    },
    {
      id: 'kv1',
      name: 'КВ-1',
      cls: 'Тяжёлый танк',
      armor: { front: 90, side: 75, rear: 70, turretF: 90, turretS: 75 },
      gun: { pen: 90, dmg: 165, reload: 5.2, disp: 0.024, speed: 1400, ammo: 30 },
      hp: 345, crew: 5,
      speed: 130, reverse: 65, turn: 1.2, turretTurn: 0.9,
      size: { w: 50, l: 88 },
      turret: { r: 20, barrel: 46 },
      casemate: false,
      desc: 'Крепость на гусеницах. В начале войны снаряды противников лишь царапали его броню. Тяжёл и неповоротлив.'
    },
    {
      id: 'is2',
      name: 'ИС-2',
      cls: 'Тяжёлый танк',
      armor: { front: 120, side: 90, rear: 60, turretF: 150, turretS: 90 },
      gun: { pen: 200, dmg: 330, reload: 9.5, disp: 0.018, speed: 1450, ammo: 24 },
      hp: 360, crew: 4,
      speed: 150, reverse: 75, turn: 1.25, turretTurn: 0.8,
      size: { w: 52, l: 96 },
      turret: { r: 21, barrel: 58 },
      casemate: false,
      desc: '122-мм орудие Д-25Т: одно попадание меняет ход боя. Долгая перезарядка — каждый выстрел на вес золота.'
    },
    {
      id: 'su152',
      name: 'СУ-152',
      cls: 'ПТ-САУ (казематная)',
      armor: { front: 75, side: 60, rear: 60, turretF: 75, turretS: 60 },
      gun: { pen: 160, dmg: 310, reload: 10.0, disp: 0.020, speed: 1400, ammo: 20 },
      hp: 330, crew: 4,
      speed: 160, reverse: 80, turn: 1.3, turretTurn: 0.45,
      size: { w: 48, l: 88 },
      turret: { r: 20, barrel: 52 },
      casemate: true,
      desc: '«Зверобой». 152-мм гаубица-пушка МЛ-20 срывает башни с «Тигров». Орудие наводится корпусом, перезарядка вечная.'
    }
  ]
};

const PLANE_DB = {
  germany: {
    fighter: {
      id: 'bf109',
      name: 'Bf 109 G (истребитель)',
      hp: 70,
      speed: 520,
      turn: 2.6,
      mgDmg: 4,
      burstTime: 0.7,
      burstPause: 1.2,
      guns: 2
    },
    bomber: {
      id: 'ju87',
      name: 'Ju 87 D «Штука» (бомбардировщик)',
      hp: 120,
      speed: 380,
      turn: 1.6,
      bombs: 4,
      bombDmg: 340,
      bombRadius: 170,
      mgDmg: 2.5,
      burstTime: 0.5,
      burstPause: 1.8,
      guns: 1
    }
  },
  ussr: {
    fighter: {
      id: 'la5',
      name: 'Ла-5 ФН (истребитель)',
      hp: 80,
      speed: 545,
      turn: 2.8,
      mgDmg: 4.5,
      burstTime: 0.7,
      burstPause: 1.2,
      guns: 2
    },
    bomber: {
      id: 'il2',
      name: 'Ил-2 М «Штурмовик» (бомбардировщик)',
      hp: 170,
      speed: 370,
      turn: 1.5,
      bombs: 3,
      bombDmg: 360,
      bombRadius: 180,
      mgDmg: 3,
      burstTime: 0.8,
      burstPause: 1.4,
      guns: 2
    }
  }
};

const SHELL_SPEED = 1450;

function otherNation(n) { return n === 'germany' ? 'ussr' : 'germany'; }
