/* 梦境护卫队：玩法数据与运行逻辑分离，首版无外部资源。 */
const GAME_CONFIG = {
  arena: { width: 390, height: 844, wallY: 675, enemyLimit: 24 },
  wall: { maxHp: 100, attackRange: 16 },
  xp: { baseNeed: 28, growth: 1.28 },
  energy: { initial: 0, max: 100, wallHitGain: 1, wallHitCapPerSecond: 2 },
  heroes: {
    ember: { name: '炽羽', icon: '🔥', color: '#ef6e57', damage: 12, interval: .55, energyGain: 3, trait: '暴击', description: '12伤害 / 0.55秒；20%暴击', crit: .20, ultimate: '焚天坠羽' },
    frost: { name: '霜铃', icon: '❄️', color: '#5cbce8', damage: 9, interval: .8, energyGain: 4, trait: '迟缓', description: '9伤害 / 0.8秒；25%减速', slow: .25, ultimate: '极夜静止' },
    kite: { name: '风筝', icon: '🪁', color: '#70d489', damage: 8, interval: .65, energyGain: 3, trait: '穿透', description: '8伤害 / 0.65秒；穿透2', pierce: 2, ultimate: '千刃风暴' },
    rock: { name: '岩卫', icon: '🛡️', color: '#d4a45d', damage: 15, interval: 1, energyGain: 5, trait: '击退', description: '15伤害 / 1秒；击退敌人', knockback: 38, ultimate: '城垣苏醒' },
    star: { name: '星瞳', icon: '✦', color: '#b78bf5', damage: 18, interval: 1.1, energyGain: 5, trait: '小范围', description: '18伤害 / 1.1秒；小范围溅射', splash: 42, ultimate: '星群审判' },
    laser: { name: '镭射眼', icon: '◉', color: '#64e9f1', damage: 10, interval: .5, energyGain: 3, range: 680, trait: '持续链接', description: '10伤害 / 0.5秒；持续激光锁敌', ultimate: '镭爆时间' },
    princess: { name: '东方公主', icon: '◇', color: '#f0ac61', damage: 12, interval: .7, energyGain: 4, range: 640, trait: '飞针穿透', description: '12伤害 / 0.7秒；飞针穿透并插地', ultimate: '穿针引线' },
    arthur: { name: '亚瑟', icon: '◐', color: '#b9d9f2', damage: 16, interval: .85, energyGain: 4, range: 320, trait: '刀气护盾', description: '16伤害 / 0.85秒；弯月刀气与诱敌盾', ultimate: '圣盾号令' },
    guanyu: { name: '关羽', icon: '▣', color: '#ee7356', damage: 22, interval: .9, energyGain: 4, range: 680, trait: '外卖车队', description: '22伤害 / 0.9秒；上行外卖车冲阵', ultimate: '巨轮车队' },
    monk: { name: '唐小僧', icon: '◉', color: '#d8b466', damage: 14, interval: 1.15, energyGain: 5, range: 560, trait: '木鱼经文', description: '14伤害 / 1.15秒；眩晕木鱼与飞行经文', ultimate: '超级木鱼' }
  },
  enemies: {
    imp: { name: '小鬼', color: '#d66676', hp: 26, speed: 23, attack: 4, attackInterval: 1.35, xp: 7, radius: 12 },
    shell: { name: '甲壳', color: '#857d9b', hp: 72, speed: 13, attack: 7, attackInterval: 1.55, xp: 13, radius: 17 },
    shadow: { name: '影行者', color: '#5762aa', hp: 40, speed: 34, attack: 5, attackInterval: 1.05, xp: 10, radius: 11 },
    rift: { name: '裂隙兽', color: '#b278c9', hp: 140, speed: 17, attack: 11, attackInterval: 1.35, xp: 24, radius: 22 },
    boss: { name: '最终 Boss', color: '#e94461', hp: 680, speed: 10, attack: 18, attackInterval: 1.1, xp: 100, radius: 33 }
  },
  waves: [
    { label: '裂隙初开', entries: [['imp', 11]], cadence: .75 },
    { label: '暗影穿行', entries: [['imp', 10], ['shadow', 6]], cadence: .64 },
    { label: '甲壳压境', entries: [['imp', 10], ['shell', 7]], cadence: .58 },
    { label: '裂隙涌潮', entries: [['shadow', 10], ['shell', 8], ['rift', 2]], cadence: .52 },
    { label: '守墙之夜', entries: [['imp', 14], ['shadow', 10], ['rift', 4]], cadence: .46 },
    { label: '噩梦军团', entries: [['shell', 12], ['shadow', 12], ['rift', 6]], cadence: .42 },
    { label: '梦魇核心', entries: [['imp', 10], ['shell', 8], ['rift', 5], ['boss', 1]], cadence: .48 }
  ],
  upgrades: {
    damage: { name: '锋芒校准', icon: '⚔', color: '#e7a85a', tag: '通用', description: '全体伤害 +25%', apply: s => s.global.damage *= 1.25 },
    haste: { name: '疾速咒文', icon: '⚡', color: '#f1d75b', tag: '通用', description: '全体攻击间隔 -16%', apply: s => s.global.interval *= .84 },
    pierce: { name: '穿云符', icon: '➤', color: '#79d6d3', tag: '通用', description: '全体弹道穿透 +1', apply: s => s.global.pierce += 1 },
    crit: { name: '命运偏光', icon: '✧', color: '#f087c8', tag: '通用', description: '全体暴击率 +15%', apply: s => s.global.crit += .15 },
    fortify: { name: '城墙加固', icon: '▰', color: '#bb9b78', tag: '通用', description: '城墙上限与当前生命 +30', apply: s => { s.wallMax += 30; s.wallHp = Math.min(s.wallMax, s.wallHp + 30); } },
    repair: { name: '应急修补', icon: '✚', color: '#78d79b', tag: '通用', description: '立刻恢复城墙 35生命', apply: s => { s.wallHp = Math.min(s.wallMax, s.wallHp + 35); } },
    wisdom: { name: '梦境回响', icon: '◈', color: '#a58cf0', tag: '通用', description: '击杀经验 +30%', apply: s => s.global.xp *= 1.3 },
    emberEvo: { name: '焚尽爆炸', icon: '💥', color: '#ef6e57', tag: '炽羽进阶', description: '炽羽命中后爆炸，波及周围敌人', hero: 'ember', apply: s => s.evolutions.add('emberEvo') },
    frostEvo: { name: '凝霜冻结', icon: '🧊', color: '#5cbce8', tag: '霜铃进阶', description: '霜铃有概率冻结目标 1.2秒', hero: 'frost', apply: s => s.evolutions.add('frostEvo') },
    kiteEvo: { name: '裂风回旋', icon: '🌀', color: '#70d489', tag: '风筝进阶', description: '风筝命中后回旋，额外伤害附近目标', hero: 'kite', apply: s => s.evolutions.add('kiteEvo') },
    rockEvo: { name: '守墙回血', icon: '♥', color: '#d4a45d', tag: '岩卫进阶', description: '岩卫每次攻击恢复城墙 2生命', hero: 'rock', apply: s => s.evolutions.add('rockEvo') },
    starEvo: { name: '星群坠落', icon: '☄', color: '#b78bf5', tag: '星瞳进阶', description: '星瞳溅射范围与伤害提高', hero: 'star', apply: s => s.evolutions.add('starEvo') },
    laserLens: { name: '增幅透镜', icon: 'laser', color: '#64e9f1', tag: '镭射眼', description: '主tick伤害 +25%（最多3层）', hero: 'laser', apply: s => { const h=s.heroes.find(x=>x.id==='laser'); if(h) h.laserLensStacks=Math.min(3,(h.laserLensStacks||0)+1); } },
    laserScan: { name: '稳频扫描', icon: 'laser', color: '#75c8ff', tag: '镭射眼', description: 'tick间隔 -8%（最多3层）', hero: 'laser', apply: s => { const h=s.heroes.find(x=>x.id==='laser'); if(h) h.laserScanStacks=Math.min(3,(h.laserScanStacks||0)+1); } },
    laserLock: { name: '锁定灼刻', icon: 'laser', color: '#7ee7d7', tag: '镭射眼', description: '同一目标连续命中3次后，后续主tick伤害 +20%', hero: 'laser', apply: s => { const h=s.heroes.find(x=>x.id==='laser'); if(h) h.laserLock=true; } },
    laserOverdrive: { name: '镭爆增压', icon: 'laser', color: '#ad7cf4', tag: '镭射眼进阶', description: '镭爆半径 +20、伤害 +20%（最多2层）', hero: 'laser', apply: s => { const h=s.heroes.find(x=>x.id==='laser'); if(h) h.laserOverdriveStacks=Math.min(2,(h.laserOverdriveStacks||0)+1); } },
    princessForge: { name: '锋针淬炼', icon: 'princess', color: '#f0ac61', tag: '东方公主', description: '普攻针伤害 +20%（最多3层）', hero: 'princess', apply: s => { const h=s.heroes.find(x=>x.id==='princess'); if(h) h.princessForgeStacks=Math.min(3,(h.princessForgeStacks||0)+1); } },
    princessVolley: { name: '连发机栝', icon: 'princess', color: '#f4c878', tag: '东方公主', description: '攻击间隔 -10%（最多3层）', hero: 'princess', apply: s => { const h=s.heroes.find(x=>x.id==='princess'); if(h) h.princessVolleyStacks=Math.min(3,(h.princessVolleyStacks||0)+1); } },
    princessStay: { name: '留针秘术', icon: 'princess', color: '#dc7f62', tag: '东方公主', description: '插针驻留 +0.5秒（最多2层）', hero: 'princess', apply: s => { const h=s.heroes.find(x=>x.id==='princess'); if(h) h.princessStayStacks=Math.min(2,(h.princessStayStacks||0)+1); } },
    princessThread: { name: '牵丝断魂', icon: 'princess', color: '#e7aeff', tag: '东方公主进阶', description: '回针 +20%、路径总宽 +3px（最多2层）', hero: 'princess', apply: s => { const h=s.heroes.find(x=>x.id==='princess'); if(h) h.princessThreadStacks=Math.min(2,(h.princessThreadStacks||0)+1); } },
    arthurMark: { name: '王者刀痕', icon: 'arthur', color: '#cbe7ff', tag: '亚瑟', description: '普通/反击刀气伤害 +20%（最多3层）', hero: 'arthur', apply:s=>{const h=s.heroes.find(x=>x.id==='arthur');if(h)h.arthurMarkStacks=Math.min(3,(h.arthurMarkStacks||0)+1)} },
    arthurEdge: { name: '扩刃战式', icon: 'arthur', color: '#a9c6ef', tag: '亚瑟', description: '刀气距离 +35、总宽 +12（最多2层）', hero: 'arthur', apply:s=>{const h=s.heroes.find(x=>x.id==='arthur');if(h)h.arthurEdgeStacks=Math.min(2,(h.arthurEdgeStacks||0)+1)} },
    arthurGuard: { name: '守势预案', icon: 'arthur', color: '#77a8df', tag: '亚瑟', description: '盾HP +30、持续 +0.5秒（最多2层）', hero: 'arthur', apply:s=>{const h=s.heroes.find(x=>x.id==='arthur');if(h)h.arthurGuardStacks=Math.min(2,(h.arthurGuardStacks||0)+1)} },
    arthurRevenge: { name: '复仇号令', icon: 'arthur', color: '#dfaf70', tag: '亚瑟进阶', description: '反击伤害 +25%、次数+2（最多2层）', hero: 'arthur', apply:s=>{const h=s.heroes.find(x=>x.id==='arthur');if(h)h.arthurRevengeStacks=Math.min(2,(h.arthurRevengeStacks||0)+1)} },
    guanyuDamage: { name:'加急订单', icon:'guanyu', color:'#f08a62', tag:'关羽', description:'普通车伤害 +20%（最多3层）', hero:'guanyu', apply:s=>{const h=s.heroes.find(x=>x.id==='guanyu');if(h)h.guanyuDamageStacks=Math.min(3,(h.guanyuDamageStacks||0)+1)} },
    guanyuLane: { name:'加宽车道', icon:'guanyu', color:'#f6b46d', tag:'关羽', description:'普通车碰撞宽 +10、首次命中减速 +12% / 0.8秒（最多2层）', hero:'guanyu', apply:s=>{const h=s.heroes.find(x=>x.id==='guanyu');if(h)h.guanyuLaneStacks=Math.min(2,(h.guanyuLaneStacks||0)+1)} },
    guanyuCargo: { name:'满箱冲刺', icon:'guanyu', color:'#ffd576', tag:'关羽', description:'普通车最大命中 +1（最多2层）', hero:'guanyu', apply:s=>{const h=s.heroes.find(x=>x.id==='guanyu');if(h)h.guanyuCargoStacks=Math.min(2,(h.guanyuCargoStacks||0)+1)} },
    guanyuFleet: { name:'巨轮车队', icon:'guanyu', color:'#e7594e', tag:'关羽进阶', description:'巨车伤害 +20%、数量 +1（最多2层）', hero:'guanyu', apply:s=>{const h=s.heroes.find(x=>x.id==='guanyu');if(h)h.guanyuFleetStacks=Math.min(2,(h.guanyuFleetStacks||0)+1)} },
    monkStrike:{name:'檀击加持',icon:'monk',color:'#d8b466',tag:'唐小僧',description:'普通木鱼伤害 +20%（最多3层）',hero:'monk',apply:s=>{const h=s.heroes.find(x=>x.id==='monk');if(h)h.monkStrikeStacks=Math.min(3,(h.monkStrikeStacks||0)+1)}},
    monkVerse:{name:'梵文连诵',icon:'monk',color:'#efcf7a',tag:'唐小僧',description:'经文伤害 +35%（最多3层）',hero:'monk',apply:s=>{const h=s.heroes.find(x=>x.id==='monk');if(h)h.monkVerseStacks=Math.min(3,(h.monkVerseStacks||0)+1)}},
    monkCalm:{name:'慈悲定音',icon:'monk',color:'#bca0e5',tag:'唐小僧',description:'眩晕时长提升（最多2层）',hero:'monk',apply:s=>{const h=s.heroes.find(x=>x.id==='monk');if(h)h.monkCalmStacks=Math.min(2,(h.monkCalmStacks||0)+1)}},
    monkField:{name:'佛场余响',icon:'monk',color:'#f0a45c',tag:'唐小僧进阶',description:'超级路径 +20%、禁锢半径 +18（最多2层）',hero:'monk',apply:s=>{const h=s.heroes.find(x=>x.id==='monk');if(h)h.monkFieldStacks=Math.min(2,(h.monkFieldStacks||0)+1)}}
  }
};

const TAPE_CONFIG = {
  ember_heat: { name:'灼热增幅', rarity:'common', hero:'ember', text:'普攻伤害 +18%', apply:m=>m.damage+=.18 }, ember_loop:{name:'引燃回路',rarity:'rare',hero:'ember',text:'有效普攻回能 +1',apply:m=>m.energy=Math.min(2,m.energy+1)}, ember_master:{name:'焚城母带',rarity:'epic',hero:'ember',text:'大招范围 +35，灼烧 +1秒',apply:m=>{m.emberRadius+=35;m.emberBurn+=1}},
  frost_tide:{name:'寒潮调音',rarity:'common',hero:'frost',text:'减速 +10%（总≤60%）',apply:m=>m.slow=Math.min(.35,m.slow+.1)}, frost_core:{name:'冷核记录',rarity:'rare',hero:'frost',text:'有效普攻回能 +1',apply:m=>m.energy=Math.min(2,m.energy+1)}, frost_echo:{name:'静止延音',rarity:'epic',hero:'frost',text:'冻结 +0.5秒，Boss额外 +0.25秒',apply:m=>{m.freeze+=.5;m.bossFreeze+=.25}},
  kite_edge:{name:'锋面切割',rarity:'common',hero:'kite',text:'普攻伤害 +15%',apply:m=>m.damage+=.15}, kite_cycle:{name:'风压循环',rarity:'rare',hero:'kite',text:'有效普攻回能 +1',apply:m=>m.energy=Math.min(2,m.energy+1)}, kite_echo:{name:'回声风暴',rarity:'epic',hero:'kite',text:'大招 +3枚风刃',apply:m=>m.kiteBlades+=3},
  rock_plate:{name:'重击镀层',rarity:'common',hero:'rock',text:'普攻伤害 +20%',apply:m=>m.damage+=.2}, rock_beat:{name:'城防节拍',rarity:'rare',hero:'rock',text:'有效普攻回能 +1',apply:m=>m.energy=Math.min(2,m.energy+1)}, rock_master:{name:'砖石母带',rarity:'epic',hero:'rock',text:'治疗 +8、护盾 +8、击退 +25px',apply:m=>{m.rockHeal+=8;m.rockShield+=8;m.rockKnock+=25}},
  star_prism:{name:'聚焦棱镜',rarity:'common',hero:'star',text:'普攻伤害 +20%',apply:m=>m.damage+=.2}, star_orbit:{name:'星轨传导',rarity:'rare',hero:'star',text:'有效普攻回能 +1',apply:m=>m.energy=Math.min(2,m.energy+1)}, star_ember:{name:'观测余烬',rarity:'epic',hero:'star',text:'大招范围 +20，额外第4枚50%伤害陨星',apply:m=>{m.starRadius+=20;m.starExtra=true}},
  laser_prism:{name:'折光准镜',rarity:'common',hero:'laser',text:'主tick伤害 +20%，索敌范围 +40px',apply:m=>{m.damage+=.2;m.laserRange+=40}}, laser_capacitor:{name:'闭环电容',rarity:'rare',hero:'laser',text:'有效tick回能 +1',apply:m=>m.energy=Math.min(2,m.energy+1)}, laser_clock:{name:'爆闪时钟',rarity:'epic',hero:'laser',text:'镭爆AOE伤害 +3，半径 +15px',apply:m=>{m.laserUltDamage+=3;m.laserUltRadius+=15}},
  princess_needle:{name:'飞针机括',rarity:'common',hero:'princess',text:'普攻针伤害 +20%',apply:m=>m.damage+=.2}, princess_coil:{name:'回路线圈',rarity:'rare',hero:'princess',text:'每根有效针回能 +1',apply:m=>m.energy=Math.min(2,m.energy+1)}, princess_spool:{name:'牵丝线轴',rarity:'epic',hero:'princess',text:'回针伤害 +12，路径总宽 +4px',apply:m=>{m.princessReturnDamage+=12;m.princessReturnWidth+=4}},
  arthur_edge:{name:'王锋剑印',rarity:'common',hero:'arthur',text:'普通与反击基础伤害 +20%',apply:m=>m.damage+=.2}, arthur_core:{name:'誓约能芯',rarity:'rare',hero:'arthur',text:'有效普通刀气回能 +1',apply:m=>m.energy=Math.min(2,m.energy+1)}, arthur_bulwark:{name:'守誓壁垒',rarity:'epic',hero:'arthur',text:'盾HP +40，持续 +0.5秒',apply:m=>{m.arthurShieldHp+=40;m.arthurShieldTime+=.5}},
  guanyu_engine:{name:'驿道引擎',rarity:'common',hero:'guanyu',text:'普通车伤害 +20%',apply:m=>m.damage+=.2}, guanyu_battery:{name:'订单电池',rarity:'rare',hero:'guanyu',text:'有效普通车回能 +1',apply:m=>m.energy=Math.min(2,m.energy+1)}, guanyu_cargo:{name:'巨轮货箱',rarity:'epic',hero:'guanyu',text:'巨车碰撞基础伤害 +15',apply:m=>m.guanyuGiantDamage+=15},
  monk_wood:{name:'檀木法器',rarity:'common',hero:'monk',text:'普通木鱼伤害 +20%',apply:m=>m.damage+=.2}, monk_echo:{name:'经卷回声',rarity:'rare',hero:'monk',text:'经文伤害 +4',apply:m=>m.monkVerseDamage+=4}, monk_bell:{name:'定禅佛钟',rarity:'epic',hero:'monk',text:'超级路径 +12，禁锢半径 +10',apply:m=>{m.monkPathDamage+=12;m.monkBindRadius+=10}},
  high_fidelity:{name:'高保真镜带',rarity:'common',text:'普攻伤害 +10%',apply:m=>m.damage+=.1}, psi_wire:{name:'灵能导线',rarity:'rare',text:'有效普攻回能 +1',apply:m=>m.energy=Math.min(2,m.energy+1)}, finale:{name:'演出尾奏',rarity:'epic',text:'大招直接伤害/治疗/护盾 +12%',apply:m=>m.ultPower+=.12}
};
const TAPE_RARITY_ORDER = ['epic','rare','common'];
const TAPE_LEVELS={
ember_heat:{damage:[.18,.30,.45]},ember_loop:{energy:[1,2,3]},ember_master:{emberDamage:[35,60,90],emberBurn:[1,2,3]},frost_tide:{slow:[.10,.16,.24]},frost_core:{energy:[1,2,3]},frost_echo:{freeze:[.5,.8,1.2],bossFreeze:[.25,.4,.6]},kite_edge:{damage:[.15,.25,.38]},kite_cycle:{energy:[1,2,3]},kite_echo:{kiteBlades:[3,5,8]},rock_plate:{damage:[.20,.34,.50]},rock_beat:{energy:[1,2,3]},rock_master:{rockHeal:[8,14,20],rockShield:[8,14,20],rockKnock:[25,45,65]},star_prism:{damage:[.20,.34,.50]},star_orbit:{energy:[1,2,3]},star_ember:{starRadius:[20,35,50],starExtra:[1,2],starExtraPower:[.5,1,.75]},laser_prism:{damage:[.20,.34,.50],laserRange:[40,70,110]},laser_capacitor:{energy:[1,2,3]},laser_clock:{laserUltDamage:[3,5,8],laserUltRadius:[15,25,40]},princess_needle:{damage:[.20,.34,.50]},princess_coil:{energy:[1,2,3]},princess_spool:{princessReturnDamage:[12,20,30],princessReturnWidth:[4,7,10]},arthur_edge:{damage:[.20,.34,.50]},arthur_core:{energy:[1,2,3]},arthur_bulwark:{arthurShieldHp:[40,70,110],arthurShieldTime:[.5,1,1.5]},guanyu_engine:{damage:[.20,.34,.50]},guanyu_battery:{energy:[1,2,3]},guanyu_cargo:{guanyuGiantDamage:[15,25,38]},monk_wood:{damage:[.20,.34,.50]},monk_echo:{monkVerseDamage:[4,7,11]},monk_bell:{monkPathDamage:[12,20,30],monkBindRadius:[10,18,28]},high_fidelity:{damage:[.10,.18,.28]},psi_wire:{energy:[1,2,3]},finale:{ultPower:[.12,.20,.30]}
};

const canvas = document.querySelector('#game');
const ctx = canvas.getContext('2d');
const $ = s => document.querySelector(s);
const ui = { wave: $('#waveLabel'), level: $('#levelLabel'), wallText: $('#wallText'), wallBar: $('#wallBar'), wallHealth: $('#wallHealth'), xpText: $('#xpText'), xpBar: $('#xpBar'), status: $('#statusText'), modal: $('#modal'), kicker: $('#modalKicker'), title: $('#modalTitle'), desc: $('#modalDescription'), choices: $('#choices'), lobby: $('#lobby'), battle: $('#battle'), toast: $('#lobbyToast'), ultimateControls: $('#ultimateControls'), battleFeedback: $('#battleFeedback'), tapeTray:$('#tapeTray') };
let state, lastTime = performance.now(), raf, mode = 'lobby', toastTimer, battleFeedbackTimer;

function choiceIconSvg(kind) {
  const paths = {
    ember: '<path d="M12 29c0-9 9-10 7-21 9 7 13 14 9 22 5-1 7-5 7-8 4 12-3 20-13 20S8 37 12 29Z"/>',
    frost: '<path d="M24 5v38M8 14l32 20M8 34 40 14M14 7l20 34M34 7 14 41"/>',
    kite: '<path d="M24 5 40 24 24 43 8 24Z M24 5v38M8 24h32"/>',
    rock: '<path d="M24 5 39 11v12c0 10-6 16-15 20C15 39 9 33 9 23V11Z M16 25h16"/>',
    star: '<path d="m24 4 5 14 15 1-12 9 4 15-12-8-12 8 4-15L4 19l15-1Z"/>',
    laser: '<circle cx="24" cy="24" r="15"/><circle cx="24" cy="24" r="6"/><path d="M4 24h9M35 24h9"/>',
    princess: '<path d="m12 37 23-24 3 3-23 24-6 2Z"/><path d="m30 10 7 7M9 41l5-5"/>',
    arthur: '<path d="M24 4 39 11v12c0 10-6 16-15 20C15 39 9 33 9 23V11Z"/><path d="M24 12v22M15 23h18"/>',
    guanyu: '<rect x="13" y="14" width="22" height="20" rx="3"/><path d="M13 22H8v12h27"/><circle cx="17" cy="38" r="3"/><circle cx="31" cy="38" r="3"/><path d="M20 18h10"/>',
    damage: '<path d="m10 37 28-28M13 11l5 5M31 33l5 5M16 35l-6 6M32 13l6-6"/>',
    haste: '<path d="M27 4 11 27h12l-2 17 16-24H25Z"/>',
    pierce: '<path d="M6 24h30M27 14l11 10-11 10M13 17l-7 7 7 7"/>',
    crit: '<path d="m24 5 5 14 15 1-12 9 4 15-12-8-12 8 4-15L4 19l15-1Z"/>',
    fortify: '<path d="M9 18h30v23H9ZM14 18V9h6v9M28 18V9h6v9M18 27h12v14H18Z"/>',
    repair: '<path d="M24 9v30M9 24h30"/>',
    wisdom: '<path d="M24 5 40 18v14L24 43 8 32V18Z M17 24h14"/>',
    emberEvo: '<path d="M12 29c0-9 9-10 7-21 9 7 13 14 9 22 5-1 7-5 7-8 4 12-3 20-13 20S8 37 12 29Z"/><path d="M5 6l5 4M38 8l5-3"/>',
    frostEvo: '<path d="M24 5v38M8 14l32 20M8 34 40 14"/><circle cx="24" cy="24" r="7"/>',
    kiteEvo: '<path d="M24 5 40 24 24 43 8 24Z M24 5v38"/><path d="M7 11c9-8 28-4 33 7"/>',
    rockEvo: '<path d="M24 43S8 34 8 21c0-7 10-11 16-2 6-9 16-5 16 2 0 13-16 22-16 22Z"/>',
    starEvo: '<path d="m24 4 5 14 15 1-12 9 4 15-12-8-12 8 4-15L4 19l15-1Z"/><path d="M6 6v8M42 6v8"/>'
  };
  return `<svg viewBox="0 0 48 48" aria-hidden="true">${paths[kind] || paths.wisdom}</svg>`;
}
function showLobby() {
  cancelAnimationFrame(raf); mode = 'lobby'; state = null;
  {const ghost=document.querySelector('.tape-ghost');if(ghost?.remove)ghost.remove();} clearTapeTargetMarks(); ui.modal.classList.add('hidden'); ui.ultimateControls.replaceChildren(); ui.tapeTray.hidden=true; ui.tapeTray.replaceChildren(); ui.battle.hidden = true; ui.lobby.hidden = false;
}
function startBattle() {
  mode = 'battle'; ui.lobby.hidden = true; ui.battle.hidden = false;
  ui.battle.style.setProperty('--wall-ratio', GAME_CONFIG.arena.wallY / GAME_CONFIG.arena.height);
  restart();
}
function showToast(message) {
  clearTimeout(toastTimer); ui.toast.textContent = message; ui.toast.classList.add('visible');
  toastTimer = setTimeout(() => ui.toast.classList.remove('visible'), 1800);
}
function showBattleFeedback(message) {
  clearTimeout(battleFeedbackTimer); ui.battleFeedback.textContent = message; ui.battleFeedback.classList.add('visible');
  battleFeedbackTimer = setTimeout(() => ui.battleFeedback.classList.remove('visible'), 1250);
}
function addHeroEnergy(hero, amount) {
  hero.energy = Math.min(hero.energyMax, hero.energy + amount);
  syncUltimateButtons();
}
function syncUltimateButtons() {
  if (!state || !ui.ultimateControls) return;
  ui.ultimateControls.replaceChildren();
  state.heroes.forEach((hero, index) => {
    const spec = GAME_CONFIG.heroes[hero.id], button = document.createElement('button'), ready = hero.energy >= hero.energyMax;
    button.type = 'button'; button.className = `ultimate-button${ready ? ' ready' : ''}`;
    button.style.gridColumn = String(index + 1); button.setAttribute('aria-label', `${spec.name}${spec.ultimate}，能量 ${Math.floor(hero.energy)}/100`);
    button.textContent = ready ? `可释放\n${spec.ultimate}` : `大招\n${Math.floor(hero.energy)}/100`;
    button.addEventListener('click', event => {
      const tape = state.tapeInteraction?.tape;
      if (tape && state.tapeInteraction.stage === 'selected') { if(!submitTrayTape(tape, hero)) setTimeout(finishTapeInteraction,180); }
      else if (event.offsetY >= 65) { const slot=Math.max(0,Math.min(2,Math.floor(event.offsetX/(button.clientWidth||58)*3))); if(hero.tapes[slot])openTapeDetail(hero,hero.tapes[slot]); }
      else useUltimate(hero);
    }); ui.ultimateControls.append(button);
  });
}
function closestWallEnemy() { return [...state.enemies].sort((a,b) => b.y - a.y)[0]; }
function hasAttackingEnemy() { return state.enemies.some(e => e.y + GAME_CONFIG.enemies[e.id].radius >= GAME_CONFIG.arena.wallY - 10); }
function useUltimate(hero) {
  const spec = GAME_CONFIG.heroes[hero.id], mods = hero.mods || defaultMods();
  if (!state.running || state.ended || state.modalKind) return showBattleFeedback('战斗暂停，暂不可释放');
  if (hero.energy < hero.energyMax) return showBattleFeedback(`${spec.ultimate}：能量未满`);
  if (hero.id === 'laser' && hero.laserUlt > 0) return showBattleFeedback('镭爆时间仍在持续中');
  if (hero.id === 'princess' && state.needles.some(needle=>needle.hero==='princess'&&needle.state==='returning')) return showBattleFeedback('穿针引线仍在收回中');
  if (hero.id === 'princess' && !state.needles.some(needle=>needle.hero==='princess'&&needle.state==='planted')) return showBattleFeedback('尚无可收回飞针');
  if (hero.id === 'arthur' && state.arthurShield) return showBattleFeedback('圣盾仍在场');
  if (hero.id === 'guanyu' && state.cars.some(car=>car.giant)) return showBattleFeedback('巨轮车队仍在行进');
  if(hero.id==='monk'&&state.superMonks.length)return showBattleFeedback('超级木鱼仍在场');
  const hasTarget = hero.id === 'laser' ? Boolean(findLaserTarget(hero)) : hero.id === 'princess' ? true : hero.id === 'arthur' ? Boolean(findArthurTarget(hero,560)) : hero.id==='monk'?Boolean(monkTarget(hero,620)):state.enemies.length > 0;
  const rockValid = state.wallHp < state.wallMax || state.wallShield <= 0 || hasAttackingEnemy();
  if ((hero.id !== 'rock' && !hasTarget) || (hero.id === 'rock' && !rockValid)) return showBattleFeedback(hero.id === 'rock' ? '城垣完好，暂无可释放时机' : '暂无可释放目标');
  hero.energy = 0; syncUltimateButtons(); showBattleFeedback(`释放：${spec.ultimate}`);
  if(hero.id==='monk'){
    const candidates=state.enemies.filter(e=>Math.hypot(e.x-heroX(hero),e.y-711)<=620),p=candidates.sort((a,b)=>state.enemies.filter(o=>Math.hypot(o.x-a.x,o.y-a.y)<=120).length-state.enemies.filter(o=>Math.hypot(o.x-b.x,o.y-b.y)<=120).length||b.y-a.y||(a.spawnOrder||0)-(b.spawnOrder||0))[0],m=mods;state.superMonks.push({hero:'monk',x:heroX(hero),y:711,tx:Math.max(48,Math.min(342,p.x)),ty:Math.max(48,Math.min(555,p.y)),arrived:false,pulses:0,time:0,damage:(45+(m.monkPathDamage||0))*(1+m.ultPower)*(1+.2*(hero.monkFieldStacks||0)),radius:120+(m.monkBindRadius||0)+18*(hero.monkFieldStacks||0)});
  } else if (hero.id === 'guanyu') {
    launchGuanyuFleet(hero);
  } else if (hero.id === 'arthur') {
    const point=bestShieldPoint(hero),m=mods,base=120+(m.arthurShieldHp||0)+30*(hero.arthurGuardStacks||0),power=Math.max(.5,Math.min(2,1+(m.ultPower||0)));state.arthurShield={hero, x:point.x,y:point.y,hp:Math.floor(base*power),maxHp:Math.floor(base*power),time:6+(m.arthurShieldTime||0)+.5*(hero.arthurGuardStacks||0),taunted:new Set(),tick:0,retaliateCd:0,retaliations:0};showBattleFeedback('圣盾号令 · 诱敌');
  } else if (hero.id === 'princess') {
    hero.returnCast=(hero.returnCast||0)+1;hero.returnCounts=new Map();
    state.needles.filter(needle=>needle.hero==='princess'&&needle.state==='planted').forEach(needle=>{needle.state='returning';needle.returnCast=hero.returnCast;needle.returnHits=new Set();});
    showBattleFeedback('穿针引线 · 飞针回收');
  } else if (hero.id === 'laser') {
    hero.laserUlt = 5;
    showBattleFeedback('镭爆时间 · 5.0秒');
  } else if (hero.id === 'ember') {
    const center = closestWallEnemy(), radius = 110; areaDamage(center.x, center.y, radius, (160 + mods.emberDamage) * (1+mods.ultPower), '焚天坠羽');
    state.enemies.filter(e => Math.hypot(e.x-center.x,e.y-center.y) <= radius).forEach(e => { e.burn = { remaining: 3 + mods.emberBurn, tick: 1, damage: 15 }; });
  } else if (hero.id === 'frost') {
    for (const enemy of [...state.enemies]) { damageEnemy(enemy, 30 * (1+mods.ultPower), '极夜'); enemy.frozen = Math.max(enemy.frozen || 0, enemy.id === 'boss' ? 1 + mods.bossFreeze : 2 + mods.freeze); }
  } else if (hero.id === 'kite') state.ultimates.push({ type: 'kite', remaining: 10 + mods.kiteBlades, timer: 0, power: 1+mods.ultPower });
  else if (hero.id === 'rock') {
    state.wallHp = Math.min(state.wallMax, state.wallHp + (15 + mods.rockHeal) * (1+mods.ultPower)); state.wallShield = (20 + mods.rockShield) * (1+mods.ultPower); state.shieldTimer = 5;
    for (const enemy of state.enemies) if (enemy.y + GAME_CONFIG.enemies[enemy.id].radius >= GAME_CONFIG.arena.wallY - 10) enemy.y = Math.max(94, enemy.y - (100 + mods.rockKnock));
  } else if (hero.id === 'star') state.ultimates.push({ type: 'star', remaining: 3 + mods.starExtra, timer: 0, radius: 75 + mods.starRadius, power: 1+mods.ultPower, extra: mods.starExtra, extraPower:mods.starExtraPower });
  if (mods.wallShieldOnUlt) { state.wallShield = Math.min(25, state.wallShield + mods.wallShieldOnUlt); state.shieldTimer = Math.max(state.shieldTimer, 4); }
  if (mods.triumph) hero.triumphPending = true;
  if (mods.distortion) hero.distortionTimer = 5;
  updateUi();
}

function newState() {
  return { running: false, ended: false, pendingVictory: false, waveClearPending: false, modalKind: 'hero', level: 1, xp: 0, wallHp: GAME_CONFIG.wall.maxHp, wallMax: GAME_CONFIG.wall.maxHp, wallShield: 0, shieldTimer: 0, elapsed: 0, wallHitSecond: -1, wallHitCounts: new Map(), wave: 0, waveTapeAwarded: false, waveDeaths:0, waveEnemyTotal:0, discsThisRun: 0, enemySerial:0, needleSerial:0, guanyuSerial:0, guanyuSeed:2463534242, tapeTarget:null, tapeDrop: null, tapeQueue: [], pendingTape: null, tapeTray:[],tapeOverflowQueue:[],overflowDraining:null,tapeInteraction:null,tapeFlying:[], spawnQueue: [], spawnTimer: 0, intermission: 0, enemies: [], shots: [], needles: [], blades: [], cars: [], monkFish:[], scriptures:[], superMonks:[], arthurShield:null, ultimates: [], effects: [], heroes: [], global: { damage: 1, interval: 1, pierce: 0, crit: 0, xp: 1 }, evolutions: new Set(), kills: 0 };
}
function sample(arr, count) { const pool = [...arr], out = []; while (pool.length && out.length < count) out.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]); return out; }
function defaultMods() { return { damage:0, energy:0, slow:0, emberDamage:0, emberBurn:0, freeze:0, bossFreeze:0, kiteBlades:0, rockHeal:0, rockShield:0,rockKnock:0, starRadius:0, starExtra:0, starExtraPower:0, laserRange:0, laserUltDamage:0, laserUltRadius:0, princessReturnDamage:0, princessReturnWidth:0, arthurShieldHp:0, arthurShieldTime:0, guanyuGiantDamage:0, monkVerseDamage:0,monkPathDamage:0,monkBindRadius:0, ultPower:0, interval:1, energyFlat:0, energyMult:1, wallShieldOnUlt:0, triumph:false, distortion:false }; }
function tapeGrade(tape){return tape.fusionCount>=4?'orange':tape.fusionCount>=2?'purple':'blue'}
function targetTape(){const t=state.tapeTarget;return t&&state.heroes.find(h=>h.id===t.heroId)?.tapes.find(x=>x.cassetteId===t.cassetteId&&x.boundHeroId===t.heroId&&x.fusionCount<4)}
function newTapePool(){return Object.entries(TAPE_CONFIG).filter(([id,t])=>{if(t.hero&&!state.heroes.some(h=>h.id===t.hero))return false;return !state.heroes.some(h=>h.tapes.some(x=>x.cassetteId===id));})}
function createTape(id,boundHeroId){return {id,cassetteId:id,boundHeroId:boundHeroId||null,fusionCount:1,alignment:null,affixId:null,...TAPE_CONFIG[id]}}
function rollTape(){const target=targetTape(),wave=state.wave;if(target&&((wave>=4)||Math.random()<.65))return createTape(target.cassetteId,target.boundHeroId);const pool=newTapePool();if(!pool.length)return null;const [id,tape]=pool[Math.floor(Math.random()*pool.length)];return createTape(id,tape.hero||null)}
const TAPE_TRAY_CAPACITY=7;
function fillTapeTray(){if(!state||state.ended||state.overflowDraining||state.tapeTray.length>=TAPE_TRAY_CAPACITY||!state.tapeOverflowQueue.length){renderTapeTray();return false}state.overflowDraining={tape:state.tapeOverflowQueue[0],targetSlot:state.tapeTray.length,time:.25,duration:.25};renderTapeTray();return true;}
function storeTape(tape){if(!tape||state.ended)return false;if(state.overflowDraining||state.tapeOverflowQueue.length||state.tapeTray.length>=TAPE_TRAY_CAPACITY)state.tapeOverflowQueue.push(tape);else state.tapeTray.push(tape);fillTapeTray();renderTapeTray();return true;}
function clearTapeTargetMarks(){const buttons=ui.ultimateControls?.querySelectorAll?.('.tape-valid,.tape-invalid')||[];buttons.forEach(b=>b.classList.remove('tape-valid','tape-invalid'));}
function markTapeTargets(tape){if(!ui.ultimateControls)return;[...ui.ultimateControls.children].forEach((button,index)=>{const valid=legalTapeTarget(tape,state.heroes[index]);button.classList.toggle('tape-valid',valid);button.classList.toggle('tape-invalid',!valid);});}
function renderTapeTray(){if(!state||!ui.tapeTray)return;ui.tapeTray.hidden=!state.tapeTray.length&&!state.tapeOverflowQueue.length&&!state.tapeFlying.length&&!state.overflowDraining;ui.tapeTray.replaceChildren();for(let i=0;i<TAPE_TRAY_CAPACITY;i++){const slot=document.createElement('div'),tape=state.tapeTray[i];slot.className='tray-slot';slot.dataset.traySlot=String(i);if(tape){const b=document.createElement('button');b.className=`tray-tape${state.tapeInteraction?.tape===tape?' selected':''}`;b.type='button';b.textContent=TAPE_CONFIG[tape.cassetteId].name;b.setAttribute('aria-label',`${TAPE_CONFIG[tape.cassetteId].name}，拖拽或点选装备`);b.addEventListener('pointerdown',e=>beginTrayPointer(e,tape,b));slot.append(b)}ui.tapeTray.append(slot)}if(state.tapeOverflowQueue.length){const n=document.createElement('span');n.className='tray-overflow';n.textContent=`待收纳 +${state.tapeOverflowQueue.length}`;ui.tapeTray.append(n)}}
function resumeAfterTapeInteraction(){clearTapeTargetMarks();state.tapeInteraction=null;const ghost=document.querySelector('.tape-ghost');if(ghost?.remove)ghost.remove();if(!state.modalKind&&!state.ended)state.running=true;renderTapeTray();}
function finishTapeInteraction(){if(!state)return;const p=state.tapeInteraction;p?.button?.releasePointerCapture?.(p.pointerId);if(p?.holdTimer)clearTimeout(p.holdTimer);resumeAfterTapeInteraction();}
function legalTapeTarget(tape,hero){return hero&&(!tape.hero||tape.hero===hero.id)&&(!tape.boundHeroId||tape.boundHeroId===hero.id)}
function removeTrayTape(tape){const index=state.tapeTray.indexOf(tape);if(index<0)return false;state.tapeTray.splice(index,1);fillTapeTray();return true;}
function v3ReplaceChoice(tape,hero){state.running=false;state.modalKind='replace';state.tapeInteraction={tape,stage:'replace',heroId:hero.id};ui.modal.classList.remove('hidden');ui.choices.classList.remove('portrait-choices','finish-actions');ui.kicker.textContent='满槽替换';ui.title.textContent='选择要替换的卡带';ui.desc.textContent='新卡仍保留在暂存栏，选择后还需确认。';ui.choices.replaceChildren();hero.tapes.forEach((old,index)=>{const b=document.createElement('button');b.className='choice';b.type='button';b.textContent=`槽位 ${index+1}：${TAPE_CONFIG[old.cassetteId].name}${old.fusionCount>=4?'（橙色）':''}`;b.onclick=()=>v3ConfirmReplace(tape,hero,index);ui.choices.append(b)});const cancel=document.createElement('button');cancel.className='choice';cancel.type='button';cancel.textContent='取消，保留新卡';cancel.onclick=()=>{ui.modal.classList.add('hidden');state.modalKind=null;state.tapeInteraction={tape,stage:'selected'};markTapeTargets(tape);renderTapeTray();};ui.choices.append(cancel);}
function v3ConfirmReplace(tape,hero,slot){const old=hero.tapes[slot];state.modalKind='replaceConfirm';ui.kicker.textContent='永久替换确认';ui.title.textContent='确认替换此槽位？';ui.desc.textContent=old.fusionCount>=4?'替换橙色神器/魔器将永久失去额外词条与所有同调进度。':'被替换卡及其全部同调进度将永久销毁。';ui.choices.replaceChildren();const yes=document.createElement('button'),discard=document.createElement('button'),cancel=document.createElement('button');[yes,discard,cancel].forEach(b=>{b.className='choice';b.type='button'});yes.textContent='确认替换';discard.textContent='丢弃新卡';cancel.textContent='取消';yes.onclick=()=>{if(!removeTrayTape(tape))return;if(state.tapeTarget?.heroId===hero.id&&state.tapeTarget.cassetteId===old.cassetteId)state.tapeTarget=null;tape.boundHeroId=hero.id;hero.tapes.splice(slot,1,tape);rebuildHeroMods(hero);state.pendingTape=null;state.modalKind=null;ui.modal.classList.add('hidden');resumeAfterTapeInteraction();};discard.onclick=()=>{removeTrayTape(tape);state.pendingTape=null;state.modalKind=null;ui.modal.classList.add('hidden');resumeAfterTapeInteraction();};cancel.onclick=()=>v3ReplaceChoice(tape,hero);ui.choices.append(yes,discard,cancel);}
function submitTrayTape(tape,hero){if(!legalTapeTarget(tape,hero)){showBattleFeedback('无法装备给该梦灵');return false}if(!state.tapeTray.includes(tape))return false;const same=hero.tapes.find(x=>x.cassetteId===tape.cassetteId&&x.boundHeroId===hero.id&&x.fusionCount<4);if(same){tape.boundHeroId=hero.id;removeTrayTape(tape);absorbTape(hero,same);return true}if(hero.tapes.length<3){tape.boundHeroId=hero.id;removeTrayTape(tape);hero.tapes.push(tape);rebuildHeroMods(hero);resumeAfterTapeInteraction();return true}v3ReplaceChoice(tape,hero);return true}
function openTrayDetail(tape){state.running=false;state.modalKind='trayDetail';state.tapeInteraction={tape,stage:'detail'};ui.modal.classList.remove('hidden');ui.kicker.textContent='暂存卡带';ui.title.textContent=TAPE_CONFIG[tape.cassetteId].name;ui.desc.textContent=`${tape.text}｜${tape.hero?'专属：仅对应梦灵':'通用：投放成功后绑定英雄'}｜拖拽或短按后点选英雄装备。`;ui.choices.replaceChildren();const close=document.createElement('button');close.className='choice';close.type='button';close.textContent='关闭';close.onclick=()=>{state.modalKind=null;ui.modal.classList.add('hidden');resumeAfterTapeInteraction();};ui.choices.append(close);}
function beginTrayPointer(e,tape,button){if(!state||state.ended||state.tapeInteraction?.pointerId!==undefined||e.button!==undefined&&e.button!==0)return;e.preventDefault();button.setPointerCapture?.(e.pointerId);const p={tape,button,pointerId:e.pointerId,x:e.clientX,y:e.clientY,drag:false,stage:'press',holdTimer:null};state.tapeInteraction=p;p.holdTimer=setTimeout(()=>{if(state.tapeInteraction===p&&!p.drag)openTrayDetail(tape)},350);const move=ev=>{if(state.tapeInteraction!==p||ev.pointerId!==p.pointerId)return;const dx=ev.clientX-p.x,dy=ev.clientY-p.y;if(!p.drag&&Math.hypot(dx,dy)>=8){clearTimeout(p.holdTimer);p.drag=true;p.stage='drag';state.running=false;button.classList.add('dragging');const g=document.createElement('div');g.className='tape-ghost';document.body.append(g);p.ghost=g;markTapeTargets(tape)}if(p.drag&&p.ghost){p.ghost.style.left=ev.clientX+'px';p.ghost.style.top=ev.clientY+'px'}};const cancel=ev=>{if(ev?.pointerId!==undefined&&ev.pointerId!==p.pointerId)return;button.removeEventListener('pointermove',move);if(state.tapeInteraction===p){if(p.drag)setTimeout(finishTapeInteraction,180);else finishTapeInteraction();}};const up=ev=>{if(ev.pointerId!==p.pointerId||state.tapeInteraction!==p)return;button.removeEventListener('pointermove',move);clearTimeout(p.holdTimer);if(!p.drag){state.running=false;p.stage='selected';markTapeTargets(tape);renderTapeTray();return}const rect=canvas.getBoundingClientRect(),x=(ev.clientX-rect.left)*390/rect.width,y=(ev.clientY-rect.top)*844/rect.height,hero=y>=684&&y<=770?state.heroes.find((_,i)=>Math.abs(x-(55+i*70))<=32):null;if(hero){if(!submitTrayTape(tape,hero))setTimeout(finishTapeInteraction,180);}else setTimeout(finishTapeInteraction,180);};button.addEventListener('pointermove',move);button.addEventListener('pointerup',up,{once:true});button.addEventListener('pointercancel',cancel,{once:true});button.addEventListener('lostpointercapture',cancel,{once:true});}
function nextTraySlot(){const reserved=new Set(state.tapeFlying.map(f=>f.targetSlot));if(state.overflowDraining)reserved.add(state.overflowDraining.targetSlot);for(let i=0;i<TAPE_TRAY_CAPACITY;i++)if(i>=state.tapeTray.length&&!reserved.has(i))return i;return -1;}
function pickGroundTape(){if(!state?.tapeDrop||state.ended)return false;const slot=nextTraySlot();if(slot<0){showBattleFeedback('暂存栏已满');return false}const tape=state.tapeDrop;state.tapeDrop=null;state.tapeFlying.push({tape,x:tape.x,y:tape.y,time:.4,targetSlot:slot});renderTapeTray();return true;}
function resolveFlightSlot(flight){const reserved=new Set(state.tapeFlying.filter(f=>f!==flight).map(f=>f.targetSlot));if(state.overflowDraining)reserved.add(state.overflowDraining.targetSlot);for(let i=0;i<TAPE_TRAY_CAPACITY;i++)if(i>=state.tapeTray.length&&!reserved.has(i)){flight.targetSlot=i;return i}return flight.targetSlot;}
function tapeFlightTarget(flight){const index=resolveFlightSlot(flight),fallback={x:14+(index+.5)*(362/TAPE_TRAY_CAPACITY),y:820},slot=ui.tapeTray?.querySelector?.(`[data-tray-slot="${index}"]`),rect=slot?.getBoundingClientRect?.(),canvasRect=canvas.getBoundingClientRect();if(!rect||!canvasRect.width||!canvasRect.height)return fallback;return {x:(rect.left+rect.width/2-canvasRect.left)*GAME_CONFIG.arena.width/canvasRect.width,y:(rect.top+rect.height/2-canvasRect.top)*GAME_CONFIG.arena.height/canvasRect.height};}
function queueTapeAt(x,y) { if (state.discsThisRun >= 7 || state.waveTapeAwarded || state.ended) return; const tape = rollTape(); if (!tape) return; state.discsThisRun++; state.waveTapeAwarded=true; const drop = { ...tape, x, y }; if (state.modalKind) state.tapeQueue.push(drop); else if (!state.tapeDrop) state.tapeDrop = drop; else state.tapeQueue.push(drop); }
function trySpawnTape() { if (!state.modalKind && !state.tapeDrop && state.tapeQueue.length) state.tapeDrop = state.tapeQueue.shift(); }
function processWaveClearTape() {
  if (!state.waveClearPending || state.ended || state.modalKind === 'level') return false;
  if (state.tapeDrop) { const lostTape = state.tapeDrop; state.tapeDrop = null; storeTape(lostTape); }
  while(!state.modalKind&&state.tapeQueue.length)storeTape(state.tapeQueue.shift());
  return Boolean(state.modalKind || state.pendingTape);
}
function rebuildHeroMods(hero) { hero.affixes=hero.tapes.map(tape=>tape.affixId).filter(Boolean); hero.mods = defaultMods(); for (const tape of hero.tapes) { const level=Math.min(3,Math.max(1,tape.fusionCount===1?1:tape.fusionCount===2||tape.fusionCount===3?2:3)), data=TAPE_LEVELS[tape.cassetteId]||{}; for(const [key,values] of Object.entries(data)){const value=values[level-1]??values[values.length-1]; if(key==='starExtra')hero.mods.starExtra=value; else hero.mods[key]=(hero.mods[key]||0)+value;} } for(const affix of hero.affixes)applyAffix(hero,affix); }
function chooseAffix(hero, alignment){const artifact=['glow_finale','star_conduit','oathwall','triumph'], cursed=['frenzy','black_battery','distortion','night_overclock'];const pool=(alignment==='artifact'?artifact:cursed).filter(id=>!hero.affixes.includes(id)&&!(id==='star_conduit'&&hero.mods.energy>=3));return pool.length?pool[Math.floor(Math.random()*pool.length)]:null}
function applyAffix(hero,id){const m=hero.mods;if(id==='glow_finale')m.ultPower+=.15;if(id==='star_conduit')m.energyFlat+=1;if(id==='oathwall')m.wallShieldOnUlt=8;if(id==='triumph')m.triumph=true;if(id==='frenzy'){m.damage+=.28;m.energyFlat-=1;}if(id==='black_battery'){m.energyMult*=1.35;m.damage-=.15;}if(id==='distortion'){m.ultPower+=.35;m.distortion=true;}if(id==='night_overclock'){m.interval*=.8;m.ultPower-=.15;}m.ultPower=Math.max(-.5,Math.min(1,m.ultPower));m.interval=Math.max(.3,m.interval)}
function openTapePanel(tape, lost=false) {
  if(state.modalKind==='level'){state.tapeQueue.push(tape);return}
  const owner=state.heroes.find(hero=>hero.id===(tape.boundHeroId||tape.hero)); const match=owner?.tapes.find(item=>item.cassetteId===tape.cassetteId&&item.boundHeroId===(tape.boundHeroId||owner.id)&&item.fusionCount<4);
  if(match){ absorbTape(owner,match); return; }
  state.running = false; state.pendingTape = tape; state.modalKind = 'tape'; ui.modal.classList.remove('hidden'); ui.choices.classList.remove('portrait-choices','finish-actions');
  ui.kicker.textContent = lost ? '遗落卡带 · 波间处理' : `${tape.rarity.toUpperCase()} 卡带`;
  ui.title.textContent = tape.name; ui.desc.textContent = tape.text;
  ui.choices.replaceChildren();
  if (tape.hero) showTapeSlots(tape, tape.hero); else {
    ui.desc.textContent += ' · 选择装备梦灵';
    state.heroes.forEach(hero => { const b=document.createElement('button'); b.className='choice'; b.type='button'; b.innerHTML=`<span class="choice-icon">${choiceIconSvg(hero.id)}</span><span><strong>${GAME_CONFIG.heroes[hero.id].name}</strong><small>装备此通用卡带</small></span>`; b.onclick=()=>showTapeSlots(tape,hero.id); ui.choices.append(b); });
    ui.choices.append(tapeSkipButton());
  }
}
function tapeSkipButton() { const b=document.createElement('button'); b.className='choice'; b.type='button'; b.innerHTML='<span class="choice-icon">×</span><span><strong>跳过</strong><small>本局销毁此卡带</small></span>'; b.onclick=closeTapePanel; return b; }
function showTapeSlots(tape, heroId) {
  const hero=state.heroes.find(item=>item.id===heroId); ui.desc.textContent=`装备至 ${GAME_CONFIG.heroes[heroId].name} · ${tape.text}`; ui.choices.replaceChildren();
  if (hero.tapes.length < 3) { const b=document.createElement('button');b.className='choice';b.type='button';b.innerHTML='<span class="choice-icon">+</span><span><strong>装备至空槽</strong><small>剩余槽位可继续装备</small></span>';b.onclick=()=>equipTape(tape,heroId,hero.tapes.length);ui.choices.append(b); }
  else hero.tapes.forEach((item,index)=>{const old=TAPE_CONFIG[item.cassetteId],b=document.createElement('button');b.className='choice';b.type='button';b.innerHTML=`<span class="choice-icon">${index+1}</span><span><strong>替换槽位 ${index+1}</strong><small>销毁：${old.name}</small></span>`;b.onclick=()=>item.fusionCount>=4?confirmOrangeReplace(tape,heroId,index):equipTape(tape,heroId,index);ui.choices.append(b);});
  ui.choices.append(tapeSkipButton());
}
function equipTape(tape, heroId, slot) { const hero=state.heroes.find(item=>item.id===heroId); if (!hero || (tape.hero && tape.hero!==heroId)) return; tape.boundHeroId=heroId; if (slot < hero.tapes.length) { const removed=hero.tapes[slot]; if(state.tapeTarget?.cassetteId===removed.cassetteId&&state.tapeTarget.heroId===heroId)state.tapeTarget=null; hero.tapes.splice(slot,1,tape); } else hero.tapes.push(tape); state.tapeTarget={heroId,cassetteId:tape.cassetteId}; rebuildHeroMods(hero); closeTapePanel(); }
function confirmOrangeReplace(tape,heroId,slot){const hero=state.heroes.find(h=>h.id===heroId),old=hero.tapes[slot];ui.kicker.textContent='永久替换确认';ui.title.textContent='替换橙色卡带？';ui.desc.textContent=`替换橙色${old.alignment==='artifact'?'神器':'魔器'}将永久失去额外词条：${old.affixId}`;ui.choices.replaceChildren();const yes=document.createElement('button'),no=document.createElement('button');yes.className=no.className='choice';yes.type=no.type='button';yes.textContent='确认替换';no.textContent='取消';yes.onclick=()=>equipTape(tape,heroId,slot);no.onclick=()=>showTapeSlots(tape,heroId);ui.choices.append(yes,no)}
function absorbTape(hero, equipped) { state.running=false; state.modalKind='fusion'; equipped.fusionCount++; if(equipped.fusionCount>=4){equipped.fusionCount=4; if(state.tapeTarget?.cassetteId===equipped.cassetteId&&state.tapeTarget.heroId===hero.id)state.tapeTarget=null; if(!equipped.alignment){equipped.alignment=Math.random()<.5?'artifact':'cursed';rebuildHeroMods(hero);equipped.affixId=chooseAffix(hero,equipped.alignment);if(equipped.affixId)hero.affixes.push(equipped.affixId);} showBattleFeedback(`终极同调 · ${equipped.alignment==='artifact'?'神':'魔'} · ${equipped.affixId||'无额外词条'}`); } else showBattleFeedback(equipped.fusionCount===2?'蓝→紫 同调完成':'素材 1/2 吸收'); rebuildHeroMods(hero); setTimeout(()=>{if(!state.ended){state.modalKind=null;clearTapeTargetMarks();state.tapeInteraction=null;renderTapeTray();trySpawnTape();if(state.enemies.length||state.spawnQueue.length)state.running=true;}},equipped.fusionCount===4?1200:800); }
function closeTapePanel() { state.pendingTape=null; state.modalKind=null; ui.modal.classList.add('hidden'); if (state.pendingVictory) return win(); trySpawnTape(); if (state.spawnQueue.length||state.enemies.length||state.shots.length) state.running=true; updateUi(); }
function tapeEffectPreview(tape,level){const data=TAPE_LEVELS[tape.cassetteId]||{},v=key=>data[key]?.[level-1];if(tape.cassetteId==='monk_wood')return `普通木鱼 +${Math.round(v('damage')*100)}%`;if(tape.cassetteId==='monk_echo')return `经文伤害 +${v('monkVerseDamage')}`;if(tape.cassetteId==='monk_bell')return `超级路径 +${v('monkPathDamage')}，禁锢半径 +${v('monkBindRadius')}px`;if(tape.cassetteId==='guanyu_engine')return `普通车伤害 +${Math.round(v('damage')*100)}%`;if(tape.cassetteId==='guanyu_battery')return `有效普通车回能 +${v('energy')}`;if(tape.cassetteId==='guanyu_cargo')return `巨车碰撞基础伤害 +${v('guanyuGiantDamage')}`;return TAPE_CONFIG[tape.cassetteId].text;}
function openTapeDetail(hero,tape){state.running=false;state.modalKind='tapeDetail';ui.modal.classList.remove('hidden');ui.choices.classList.remove('portrait-choices','finish-actions');const grade=tapeGrade(tape),level=grade==='blue'?1:grade==='purple'?2:3,next=grade==='blue'?'紫Ⅱ':grade==='purple'?'橙Ⅲ':'已达橙Ⅲ',affixText={glow_finale:'耀光尾奏：大招直接值+15%',star_conduit:'星辉传导：有效普攻回能+1',oathwall:'守誓护壁：大招+8墙盾',triumph:'凯旋残响：下次普攻+10能量',frenzy:'狂焰协议：伤害+28%，回能-1',black_battery:'黑潮电池：回能×1.35，伤害-15%',distortion:'失真演出：大招+35%，攻速减缓',night_overclock:'夜幕超频：间隔-20%，大招-15%'};ui.kicker.textContent=`${grade==='orange'?'橙Ⅲ':grade==='purple'?'紫Ⅱ':'蓝Ⅰ'} · ${hero.id}`;ui.title.textContent=TAPE_CONFIG[tape.cassetteId].name;ui.desc.textContent=`绑定：${GAME_CONFIG.heroes[hero.id].name}｜当前 ${grade}：${tapeEffectPreview(tape,level)}｜${tape.fusionCount===3?'素材1/2':`同调 ${tape.fusionCount}/4`}｜下阶：${next}${level<3?`：${tapeEffectPreview(tape,level+1)}`:''}${tape.alignment?`｜${tape.alignment==='artifact'?'神':'魔'}：${affixText[tape.affixId]||tape.affixId}`:''}`;ui.choices.replaceChildren();if(grade!=='orange'){const b=document.createElement('button');b.className='choice';b.type='button';b.textContent=state.tapeTarget?.heroId===hero.id&&state.tapeTarget?.cassetteId===tape.cassetteId?'取消同调目标':'设为同调目标';b.onclick=()=>{if(state.tapeTarget?.heroId===hero.id&&state.tapeTarget?.cassetteId===tape.cassetteId)state.tapeTarget=null;else state.tapeTarget={heroId:hero.id,cassetteId:tape.cassetteId};openTapeDetail(hero,tape)};ui.choices.append(b)}const c=document.createElement('button');c.className='choice';c.type='button';c.textContent='关闭';c.onclick=()=>{state.modalKind=null;ui.modal.classList.add('hidden');if(state.enemies.length||state.spawnQueue.length)state.running=true};ui.choices.append(c)}
function xpNeed() { return Math.round(GAME_CONFIG.xp.baseNeed * Math.pow(GAME_CONFIG.xp.growth, state.level - 1)); }
function showChoices(kind) {
  state.running = false; state.modalKind = kind; ui.modal.classList.remove('hidden');
  ui.choices.classList.remove('finish-actions');
  ui.choices.classList.add('portrait-choices');
  const baseIds = Object.keys(GAME_CONFIG.heroes).filter(id => !state.heroes.some(h => h.id === id));
  let options = [];
  if (kind === 'hero') { options = sample(baseIds, 3).map(id => ({ type: 'hero', id })); ui.kicker.textContent = '梦境正在裂开'; ui.title.textContent = state.heroes.length ? '招募新的护卫' : '选择首位护卫'; ui.desc.textContent = '护卫固定驻守城墙，自动攻击最接近城墙的敌人。'; }
  else {
    const laser = state.heroes.find(h => h.id === 'laser');
    const princess = state.heroes.find(h => h.id === 'princess');
    const arthur = state.heroes.find(h => h.id === 'arthur');
    const guanyu = state.heroes.find(h => h.id === 'guanyu');
    const monk = state.heroes.find(h => h.id === 'monk');
    const canUse = id => {
      if (id === 'pierce') return state.heroes.some(h => GAME_CONFIG.heroes[h.id].pierce) || Boolean(princess && state.global.pierce < 3) || Boolean(guanyu && (guanyu.guanyuCargoStacks||0)+state.global.pierce<2);
      if (id === 'laserLens') return laser && (laser.laserLensStacks || 0) < 3;
      if (id === 'laserScan') return laser && (laser.laserScanStacks || 0) < 3;
      if (id === 'laserLock') return laser && !laser.laserLock;
      if (id === 'laserOverdrive') return laser && state.heroes.length >= 3 && (laser.laserOverdriveStacks || 0) < 2;
      if (id === 'princessForge') return princess && (princess.princessForgeStacks || 0) < 3;
      if (id === 'princessVolley') return princess && (princess.princessVolleyStacks || 0) < 3;
      if (id === 'princessStay') return princess && (princess.princessStayStacks || 0) < 2;
      if (id === 'princessThread') return princess && state.heroes.length >= 3 && (princess.princessThreadStacks || 0) < 2;
      if (id === 'arthurMark') return arthur && (arthur.arthurMarkStacks||0)<3;
      if (id === 'arthurEdge') return arthur && (arthur.arthurEdgeStacks||0)<2;
      if (id === 'arthurGuard') return arthur && (arthur.arthurGuardStacks||0)<2;
      if (id === 'arthurRevenge') return arthur && state.heroes.length>=3 && (arthur.arthurRevengeStacks||0)<2;
      if (id === 'guanyuDamage') return guanyu && (guanyu.guanyuDamageStacks||0)<3;
      if (id === 'guanyuLane') return guanyu && (guanyu.guanyuLaneStacks||0)<2;
      if (id === 'guanyuCargo') return guanyu && (guanyu.guanyuCargoStacks||0)<2;
      if (id === 'guanyuFleet') return guanyu && state.heroes.length>=3 && (guanyu.guanyuFleetStacks||0)<2;
      if(id==='monkStrike')return monk&&(monk.monkStrikeStacks||0)<3;if(id==='monkVerse')return monk&&(monk.monkVerseStacks||0)<3;if(id==='monkCalm')return monk&&(monk.monkCalmStacks||0)<2;if(id==='monkField')return monk&&state.heroes.length>=3&&(monk.monkFieldStacks||0)<2;
      const upgrade = GAME_CONFIG.upgrades[id];
      return !upgrade.hero || !state.evolutions.has(id);
    };
    const heroUpgrades = Object.keys(GAME_CONFIG.upgrades).filter(id => GAME_CONFIG.upgrades[id].hero && state.heroes.some(h => h.id === GAME_CONFIG.upgrades[id].hero) && canUse(id));
    const generic = Object.keys(GAME_CONFIG.upgrades).filter(id => !GAME_CONFIG.upgrades[id].hero && canUse(id));
    const candidates = state.heroes.length < 3 ? [...baseIds.map(id => 'hero:' + id), ...heroUpgrades.map(id => 'upgrade:' + id), ...generic.map(id => 'upgrade:' + id)] : [...heroUpgrades.map(id => 'upgrade:' + id), ...generic.map(id => 'upgrade:' + id)];
    options = sample(candidates, 3).map(key => { const [type, id] = key.split(':'); return { type, id }; });
    ui.kicker.textContent = `等级 ${state.level} · 战斗暂停`;
    ui.title.textContent = '选择一项梦境祝福';
    ui.desc.textContent = state.heroes.length < 3 ? '可继续招募新护卫，也可强化当前阵线。' : '三位护卫已满，专属进阶词条已加入祝福池。';
  }
  ui.choices.replaceChildren(...options.map(option => makeChoice(option)));
}
function makeChoice(option) {
  const data = option.type === 'hero' ? GAME_CONFIG.heroes[option.id] : GAME_CONFIG.upgrades[option.id];
  let description=data.description;
  if(option.id==='guanyuLane'){const hero=state.heroes.find(h=>h.id==='guanyu'),stack=hero?.guanyuLaneStacks||0;description=`当前：碰撞宽 ${30+10*stack}px / 减速 ${12*stack}%（0.8秒）；下阶：宽 +10px、减速 +12%（${stack+1}/2）`;}
  const button = document.createElement('button'); button.className = 'choice'; button.type = 'button'; button.style.setProperty('--card-color', data.color);
  button.innerHTML = `<span class="choice-icon">${choiceIconSvg(option.id)}</span><span><strong>${data.name}</strong><small>${description}</small></span><em class="choice-tag">${option.type === 'hero' ? '护卫' : data.tag}</em>`;
  button.addEventListener('click', () => choose(option)); return button;
}
function choose(option) {
  const wasLevelChoice = state.modalKind === 'level';
  const isOpeningDraft = state.wave === 0 && state.kills === 0 && !state.spawnQueue.length && !state.enemies.length;
  if (option.type === 'hero') { state.heroes.push({ id: option.id, cooldown: .25 + Math.random() * .3, laserTimer: .1, laserUlt: 0, laserTarget: null, laserHits: 0, laserLensStacks: 0, laserScanStacks: 0, laserLock:false, laserOverdriveStacks: 0, princessForgeStacks:0, princessVolleyStacks:0, princessStayStacks:0, princessThreadStacks:0, returnCast:0, returnCounts:new Map(), arthurMarkStacks:0,arthurEdgeStacks:0,arthurGuardStacks:0,arthurRevengeStacks:0, guanyuDamageStacks:0,guanyuLaneStacks:0,guanyuCargoStacks:0,guanyuFleetStacks:0,guanyuCastIndex:0,monkStrikeStacks:0,monkVerseStacks:0,monkCalmStacks:0,monkFieldStacks:0, energy: GAME_CONFIG.energy.initial, energyMax: GAME_CONFIG.energy.max, tapes: [], mods: defaultMods(), affixes:[] }); syncUltimateButtons(); }
  else GAME_CONFIG.upgrades[option.id].apply(state);
  ui.modal.classList.add('hidden');
  state.modalKind = null;
  trySpawnTape();
  // 保留溢出经验：连升时必须连续出卡，直到经验不足以下一等级为止。
  if (wasLevelChoice && state.xp >= xpNeed()) {
    state.xp -= xpNeed(); state.level++;
    showChoices('level'); updateUi();
    return;
  }
  // 波末升级链结束时，遗落卡带必须先进入处理面板；普通战斗中的地面卡带不受此分支影响。
  if (state.waveClearPending && processWaveClearTape()) { updateUi(); return; }
  if (state.pendingVictory) return win();
  if (isOpeningDraft) startWave();
  // 若升级恰好由本波最后一击触发，波次结算已排队；不能重新开启空战斗循环。
  else if (state.spawnQueue.length || state.enemies.length || state.shots.length) state.running = true;
  else state.running = false;
  updateUi();
}
function startWave() {
  const wave = GAME_CONFIG.waves[state.wave];
  if (!wave) return win();
  state.waveTapeAwarded = false; state.waveDeaths=0; state.waveEnemyTotal=wave.entries.reduce((sum,[,amount])=>sum+amount,0); state.spawnQueue = wave.entries.flatMap(([id, amount]) => Array.from({ length: amount }, () => id));
  state.spawnTimer = .5; state.intermission = 0; state.waveClearPending = false; state.modalKind = null; state.running = true;
  state.heroes.filter(hero=>hero.id==='laser').forEach(hero=>{hero.laserTimer=.1;hero.laserTarget=null;hero.laserHits=0;hero.laserBeam=null;});
  ui.status.textContent = `${wave.label}！`; updateUi();
}
function spawnEnemy(id) {
  const type = GAME_CONFIG.enemies[id], scaling = 1 + state.wave * .15;
  state.enemies.push({ id, spawnOrder:state.enemySerial++, x: 38 + Math.random() * (GAME_CONFIG.arena.width - 76), y: 94 + Math.random() * 28, hp: type.hp * scaling, maxHp: type.hp * scaling, slow: 0, slowStrength:0, carSlowRemaining:0, carSlowStrength:0, frozen: 0, stun:0,stunResist:0,bind:0, hitCd: type.attackInterval * .5, flash: 0 });
}
function update(dt) {
  if (!state || state.ended) return;
  for(const f of [...state.tapeFlying]){f.time-=dt;if(f.time<=0){remove(state.tapeFlying,f);storeTape(f.tape);}}
  const draining=state.overflowDraining;
  if(draining){draining.time-=dt;if(draining.time<=0){if(state.tapeOverflowQueue[0]===draining.tape&&state.tapeTray.length<TAPE_TRAY_CAPACITY){state.tapeOverflowQueue.shift();state.tapeTray.push(draining.tape);}state.overflowDraining=null;fillTapeTray();}}
  if (!state.running) return;
  state.elapsed += dt;
  const wave = GAME_CONFIG.waves[state.wave];
  state.spawnTimer -= dt;
  if (state.spawnQueue.length && state.enemies.length < GAME_CONFIG.arena.enemyLimit && state.spawnTimer <= 0) { spawnEnemy(state.spawnQueue.shift()); state.spawnTimer = wave.cadence; }
  updateEnemies(dt); if (state.ended) return;
  updateUltimates(dt); updateArthurShield(dt); updateHeroes(dt); updateShots(dt); updateNeedles(dt); updateBlades(dt); updateCars(dt); updateMonk(dt); updateSuperMonks(dt); updateEffects(dt);
  if (!state.spawnQueue.length && !state.enemies.length && !state.shots.length && !state.blades.length && !state.needles.some(needle=>needle.state!=='planted')) {
    state.running = false; state.cars=[]; state.monkFish=[]; state.scriptures=[]; state.wave++; state.waveClearPending = true;
    processWaveClearTape();
    if (state.wave >= GAME_CONFIG.waves.length) {
      state.pendingVictory = true;
      const waitForFinalTape = () => {
        if (state !== waveSession || state.ended) return;
        if (processWaveClearTape() || state.modalKind || state.tapeDrop || state.tapeQueue.length || state.pendingTape) { setTimeout(waitForFinalTape, 150); return; }
        win();
      };
      const waveSession = state;
      setTimeout(waitForFinalTape, 0);
    }
    else {
      ui.status.textContent = '防线稳住了，下一波即将抵达';
      const waveSession = state;
      const waitForChoiceThenStart = () => {
        if (state !== waveSession || state.ended) return;
        if (processWaveClearTape() || state.modalKind || state.tapeDrop || state.tapeQueue.length || state.pendingTape) { setTimeout(waitForChoiceThenStart, 150); return; }
        startWave();
      };
      setTimeout(waitForChoiceThenStart, 1250);
    }
  }
  updateUi();
}
function activeEnemySlow(e){return Math.min(.55,(e.slow>0?(e.slowStrength||0):0)+(e.carSlowRemaining>0?(e.carSlowStrength||0):0));}
function updateEnemies(dt) {
  for (const e of [...state.enemies]) {
    if (state.ended) return;
    const type = GAME_CONFIG.enemies[e.id]; e.flash = Math.max(0, e.flash - dt); e.slow = Math.max(0, e.slow - dt); e.carSlowRemaining=Math.max(0,(e.carSlowRemaining||0)-dt); e.stun=Math.max(0,(e.stun||0)-dt);e.stunResist=Math.max(0,(e.stunResist||0)-dt);e.bind=Math.max(0,(e.bind||0)-dt); if(!e.slow)e.slowStrength=0;if(!e.carSlowRemaining)e.carSlowStrength=0;e.frozen = Math.max(0, e.frozen - dt);
    if (e.burn) { e.burn.remaining -= dt; e.burn.tick -= dt; if (e.burn.tick <= 0) { e.burn.tick += 1; damageEnemy(e, e.burn.damage, '灼烧'); } if (e.burn.remaining <= 0) e.burn = null; }
    if (!state.enemies.includes(e)) continue;
    const shield=state.arthurShield;
    const slowMultiplier=(e.frozen||e.stun||e.bind)?0:1-activeEnemySlow(e);
    if(shield&&shield.taunted.has(e)){const dx=shield.x-e.x,dy=shield.y-e.y,d=Math.hypot(dx,dy)||1;if(d>32)e.y+=dy/d*type.speed*dt*slowMultiplier;else{e.hitCd-=dt;if(e.hitCd<=0){e.hitCd=type.attackInterval;damageArthurShield(type.attack,e);}}continue;}
    if (e.y + type.radius < GAME_CONFIG.arena.wallY - 10) e.y += type.speed * dt * slowMultiplier;
    else { if(e.stun||e.frozen)continue;e.hitCd -= dt; if (e.hitCd <= 0) { e.hitCd = type.attackInterval; hurtWall(type.attack); } }
  }
}
function findArthurTarget(hero,range=320){const x=heroX(hero),y=711;return state.enemies.filter(e=>Math.hypot(e.x-x,e.y-y)<=range).sort((a,b)=>(b.y-a.y)||(Math.hypot(a.x-x,a.y-y)-Math.hypot(b.x-x,b.y-y))||((a.spawnOrder||0)-(b.spawnOrder||0)))[0]||null;}
function bestShieldPoint(hero){const x=heroX(hero),y=711,candidates=state.enemies.filter(e=>Math.hypot(e.x-x,e.y-y)<=560);let best=null,bestCount=-1;for(const e of candidates){const count=state.enemies.filter(o=>Math.hypot(o.x-e.x,o.y-e.y)<=120).length;if(!best||count>bestCount||(count===bestCount&&(e.y>best.y||(e.y===best.y&&(e.spawnOrder||0)<(best.spawnOrder||0))))){best=e;bestCount=count;}}return {x:Math.max(48,Math.min(342,best.x)),y:Math.max(48,Math.min(555,best.y))};}
function launchBlade(hero,tx,ty,retaliate=false){if(!retaliate&&state.blades.filter(b=>!b.retaliate).length>=8)return false;const x=heroX(hero),y=711,dx=tx-x,dy=ty-y,d=Math.hypot(dx,dy)||1,m=hero.mods||defaultMods(),dist=300+35*(hero.arthurEdgeStacks||0),width=96+12*(hero.arthurEdgeStacks||0),damage=16*state.global.damage*(1+m.damage+.2*(hero.arthurMarkStacks||0))*(retaliate?.8:1)*(retaliate?(1+.25*(hero.arthurRevengeStacks||0)):1);state.blades.push({hero:'arthur',x,y,vx:dx/d*800,vy:dy/d*800,distance:0,maxDistance:dist,width,damage,retaliate,hits:new Set(),energyGranted:false,crit:!retaliate&&Math.random()<(state.global.crit||0)});return true;}
function updateBlades(dt){for(const blade of [...state.blades]){const ax=blade.x,ay=blade.y,remaining=blade.maxDistance-blade.distance,step=Math.min(800*dt,remaining),bx=ax+blade.vx/800*step,by=ay+blade.vy/800*step;for(const enemy of state.enemies.filter(e=>!blade.hits.has(e)).map(e=>({e,t:segmentHitT(ax,ay,bx,by,e.x,e.y,GAME_CONFIG.enemies[e.id].radius+blade.width/2)})).filter(v=>v.t!==null).sort((a,b)=>a.t-b.t)){blade.hits.add(enemy.e);const damage=blade.damage*(blade.crit?2:1),ok=damageEnemy(enemy.e,damage,blade.crit?'暴击':'刀气');if(ok&&!blade.retaliate&&!blade.energyGranted){const hero=state.heroes.find(h=>h.id==='arthur');primaryEnergy(hero,GAME_CONFIG.heroes.arthur,hero.mods||defaultMods());blade.energyGranted=true;}}blade.x=bx;blade.y=by;blade.distance+=step;if(blade.distance>=blade.maxDistance)remove(state.blades,blade);}}
function damageArthurShield(damage,enemy){const shield=state.arthurShield;if(!shield)return;const actual=Math.min(shield.hp,damage);shield.hp-=actual;if(actual>0&&shield.retaliateCd<=0&&shield.retaliations<Math.min(12,8+2*(shield.hero.arthurRevengeStacks||0))){launchBlade(shield.hero,shield.x,shield.y,true);shield.retaliateCd=.4;shield.retaliations++;shield.hero.cooldown=attackInterval(shield.hero,GAME_CONFIG.heroes.arthur);state.effects.push({text:'反击',x:shield.x,y:shield.y-20,life:.4,color:'#ffcb76'});}if(shield.hp<=0)state.arthurShield=null;}
function updateArthurShield(dt){const s=state.arthurShield;if(!s)return;s.time-=dt;s.retaliateCd=Math.max(0,s.retaliateCd-dt);s.tick-=dt;if(s.time<=0){state.arthurShield=null;return;}if(s.tick<=0){s.tick+=.25;for(const e of [...s.taunted])if(!state.enemies.includes(e))s.taunted.delete(e);const add=state.enemies.filter(e=>!s.taunted.has(e)&&Math.hypot(e.x-s.x,e.y-s.y)<=220).sort((a,b)=>Math.hypot(a.x-s.x,a.y-s.y)-Math.hypot(b.x-s.x,b.y-s.y)||(b.y-a.y)||((a.spawnOrder||0)-(b.spawnOrder||0)));for(const e of add){if(s.taunted.size>=5)break;s.taunted.add(e);}}}
function attackInterval(hero, spec) { return Math.max(.3, spec.interval * state.global.interval * (hero.mods?.interval || 1) * (hero.distortionTimer > 0 ? 1.25 : 1) * (hero.id === 'laser' ? Math.pow(.92,hero.laserScanStacks||0) : hero.id === 'princess' ? Math.pow(.9,hero.princessVolleyStacks||0) : 1)); }
function findLaserTarget(hero) {
  const range=(GAME_CONFIG.heroes.laser.range||680)+(hero.mods?.laserRange||0), x=heroX(hero), y=711;
  return state.enemies.filter(enemy=>Math.hypot(enemy.x-x,enemy.y-y)<=range).sort((a,b)=>(b.y-a.y)||((a.spawnOrder||0)-(b.spawnOrder||0)))[0]||null;
}
function primaryEnergy(hero, spec, mods) {
  let energy=Math.max(1,Math.min(spec.energyGain+3,spec.energyGain+mods.energy+(mods.energyFlat||0)));
  energy=Math.max(1,Math.min(spec.energyGain+3,Math.floor(energy*(mods.energyMult||1))));
  if(hero.triumphPending){energy+=10;hero.triumphPending=false;}
  addHeroEnergy(hero,energy);
}
function laserTick(hero) {
  const spec=GAME_CONFIG.heroes.laser,mods=hero.mods||defaultMods(),target=findLaserTarget(hero);
  if(!target){hero.laserTarget=null;hero.laserHits=0;hero.laserBeam=null;return;}
  if(hero.laserTarget!==target){hero.laserTarget=target;hero.laserHits=0;}
  const locked=hero.laserLock&&hero.laserHits>=3, crit=Math.random()<(state.global.crit||0), lockPower=locked?1.2:1;
  // 增幅透镜与卡带/神魔的普攻伤害修正共用同一加法桶；只作用于主激光 tick。
  let damage=spec.damage*state.global.damage*(1+mods.damage+.25*Math.min(3,hero.laserLensStacks||0))*lockPower;if(crit)damage*=2;
  const center={x:target.x,y:target.y}; hero.laserBeam={target,flash:.10};
  const causedDamage=damageEnemy(target,damage,crit?'暴击':'镭射');
  if(!causedDamage){hero.laserTarget=null;hero.laserHits=0;hero.laserBeam=null;return;}
  hero.laserHits++; primaryEnergy(hero,spec,mods);
  if(hero.laserUlt>0){
    const radius=90+(mods.laserUltRadius||0)+20*(hero.laserOverdriveStacks||0), power=Math.max(.5,Math.min(2,1+(mods.ultPower||0)))*(1+.2*(hero.laserOverdriveStacks||0)), aoe=(7+(mods.laserUltDamage||0))*power;
    for(const enemy of [...state.enemies]) if(enemy!==target&&Math.hypot(enemy.x-center.x,enemy.y-center.y)<=radius) damageEnemy(enemy,aoe,'镭爆');
    state.effects.push({ring:radius,x:center.x,y:center.y,life:.28,color:'#9d8cff',laserRing:true});
  }
}
// Returns the first segment/circle contact, not the closest projection. This keeps the final piercing landing point deterministic across frame rates.
function segmentHitT(ax,ay,bx,by,px,py,r){const dx=bx-ax,dy=by-ay,fx=ax-px,fy=ay-py,a=dx*dx+dy*dy;if(!a)return Math.hypot(fx,fy)<=r?0:null;const c=fx*fx+fy*fy-r*r;if(c<=0)return 0;const b=2*(fx*dx+fy*dy),disc=b*b-4*a*c;if(disc<0)return null;const root=Math.sqrt(disc),t1=(-b-root)/(2*a),t2=(-b+root)/(2*a);return t1>=0&&t1<=1?t1:t2>=0&&t2<=1?t2:null;}
function arenaSpan(ax,ay,bx,by){let lo=0,hi=1;for(const [p,q] of [[-(bx-ax),ax],[(bx-ax),390-ax],[-(by-ay),ay-74],[(by-ay),675-ay]]){if(p===0){if(q<0)return null;continue;}const t=q/p;if(p<0)lo=Math.max(lo,t);else hi=Math.min(hi,t);}return lo<=hi?{enter:Math.max(0,lo),exit:Math.min(1,hi)}:null;}
function findPrincessTarget(hero){const x=heroX(hero),y=711;return state.enemies.filter(enemy=>Math.hypot(enemy.x-x,enemy.y-y)<=GAME_CONFIG.heroes.princess.range).sort((a,b)=>(b.y-a.y)||((a.spawnOrder||0)-(b.spawnOrder||0)))[0]||null;}
function plantNeedle(needle){needle.state='planted';needle.life=Math.min(3,2+.5*((state.heroes.find(h=>h.id===needle.hero)?.princessStayStacks)||0));needle.maxLife=needle.life;needle.vx=needle.vy=0;}
function canLaunchNeedle(hero){const own=state.needles.filter(needle=>needle.hero==='princess');if(own.length<18)return true;const planted=own.filter(needle=>needle.state==='planted').sort((a,b)=>a.life-b.life)[0];if(!planted)return false;remove(state.needles,planted);return true;}
function launchNeedle(hero){const target=findPrincessTarget(hero);if(!target||!canLaunchNeedle(hero))return false;const x=heroX(hero),y=711,dx=target.x-x,dy=target.y-y,d=Math.hypot(dx,dy)||1;state.needles.push({id:state.needleSerial++,hero:'princess',state:'flying',x,y,px:x,py:y,vx:dx/d*900,vy:dy/d*900,distance:0,hasEnteredArena:false,hits:new Set(),energyGranted:false});return true;}
function needleDamage(hero,needle,target,index){const spec=GAME_CONFIG.heroes.princess,mods=hero.mods||defaultMods(),base=index===0?12:9,crit=Math.random()<(state.global.crit||0),damage=base*state.global.damage*(1+mods.damage+.2*(hero.princessForgeStacks||0))*(crit?2:1),caused=damageEnemy(target,damage,crit?'暴击':'飞针');if(caused&&!needle.energyGranted){primaryEnergy(hero,spec,mods);needle.energyGranted=true;}state.effects.push({text:index===0?'针刺':'穿针',x:target.x,y:target.y-20,life:.24,color:index===0?'#fff0b0':'#e6a56c'});}
function updateNeedles(dt){
  for(const needle of [...state.needles]){
    const hero=state.heroes.find(h=>h.id===needle.hero);if(!hero){remove(state.needles,needle);continue;}
    if(needle.state==='planted'){needle.life-=dt;if(needle.life<=0)remove(state.needles,needle);continue;}
    const ax=needle.x,ay=needle.y;
    if(needle.state==='returning'){
      const tx=heroX(hero),ty=711,dx=tx-ax,dy=ty-ay,d=Math.hypot(dx,dy)||1,step=Math.min(d,1200*dt),bx=ax+dx/d*step,by=ay+dy/d*step,mods=hero.mods||defaultMods(),half=(24+(mods.princessReturnWidth||0)+3*(hero.princessThreadStacks||0))/2,power=Math.max(.5,Math.min(2,1+(mods.ultPower||0)))*(1+.2*(hero.princessThreadStacks||0)),damage=(48+(mods.princessReturnDamage||0))*power;
      for(const enemy of [...state.enemies]){if(needle.returnHits.has(enemy))continue;const radius=GAME_CONFIG.enemies[enemy.id].radius+half,t=segmentHitT(ax,ay,bx,by,enemy.x,enemy.y,radius),count=hero.returnCounts.get(enemy)||0;if(t!==null&&count<3){needle.returnHits.add(enemy);hero.returnCounts.set(enemy,count+1);damageEnemy(enemy,damage,'牵丝');state.effects.push({text:'裂光',x:enemy.x,y:enemy.y-18,life:.25,color:'#ffd27b'});}}
      needle.x=bx;needle.y=by;if(d<=16)remove(state.needles,needle);continue;
    }
    const remaining=Math.max(0,640-needle.distance),scale=Math.min(1,remaining/(900*dt||1)),rawBx=ax+needle.vx*dt*scale,rawBy=ay+needle.vy*dt*scale,span=arenaSpan(ax,ay,rawBx,rawBy);
    let bx=rawBx,by=rawBy,sx=ax,sy=ay,landAtBoundary=false;
    if(!needle.hasEnteredArena){
      if(span){needle.hasEnteredArena=true;sx=ax+(rawBx-ax)*span.enter;sy=ay+(rawBy-ay)*span.enter;if(span.exit<1){bx=ax+(rawBx-ax)*span.exit;by=ay+(rawBy-ay)*span.exit;landAtBoundary=true;}}
    }else if(span&&span.exit<1){bx=ax+(rawBx-ax)*span.exit;by=ay+(rawBy-ay)*span.exit;landAtBoundary=true;}
    const candidates=needle.hasEnteredArena?state.enemies.filter(enemy=>!needle.hits.has(enemy)).map(enemy=>({enemy,t:segmentHitT(sx,sy,bx,by,enemy.x,enemy.y,GAME_CONFIG.enemies[enemy.id].radius+3)})).filter(item=>item.t!==null).sort((a,b)=>a.t-b.t):[],limit=Math.min(4,2+state.global.pierce);
    for(const {enemy,t} of candidates){if(needle.hits.size>=limit)break;needle.hits.add(enemy);needleDamage(hero,needle,enemy,needle.hits.size-1);needle.x=sx+(bx-sx)*t;needle.y=sy+(by-sy)*t;if(needle.hits.size>=limit){plantNeedle(needle);break;}}
    if(needle.state!=='flying')continue;
    needle.x=bx;needle.y=by;needle.distance+=Math.hypot(bx-ax,by-ay);
    if(needle.distance>=640||landAtBoundary)plantNeedle(needle);
  }
}
function findGuanyuTarget(hero){
  const x=heroX(hero), y=711, range=GAME_CONFIG.heroes.guanyu.range;
  return state.enemies.filter(e=>Math.hypot(e.x-x,e.y-y)<=range).sort((a,b)=>b.y-a.y||Math.hypot(a.x-x,a.y-y)-Math.hypot(b.x-x,b.y-y)||((a.spawnOrder||0)-(b.spawnOrder||0)))[0];
}
function guanyuRandom(seed){let x=(seed>>>0)||1;x^=x<<13;x^=x>>>17;x^=x<<5;return (x>>>0)/4294967296;}
function launchGuanyuCar(hero, giant=false, laneX=null, batch=null){
  const normal=state.cars.filter(car=>!car.giant).length;
  if(!giant&&normal>=12)return false;
  const target=!giant&&findGuanyuTarget(hero); if(!giant&&!target)return false;
  const m=hero.mods||defaultMods(), laneStacks=Math.min(2,hero.guanyuLaneStacks||0), halfW=giant?24:15+5*laneStacks, width=giant?48:30+10*laneStacks, height=giant?68:44;
  const x=giant?laneX:Math.max(halfW+8,Math.min(GAME_CONFIG.arena.width-halfW-8,target.x));
  const power=Math.max(.5,Math.min(2,1+(m.ultPower||0)));
  const normalDamage=22*state.global.damage*(1+(m.damage||0)+.2*(hero.guanyuDamageStacks||0));
  const giantDamage=(65+(m.guanyuGiantDamage||0))*(1+.2*(hero.guanyuFleetStacks||0))*power;
  const spawnY=GAME_CONFIG.arena.wallY-12;
  state.cars.push({id:state.guanyuSerial++,hero:'guanyu',giant,x,y:spawnY,px:x,py:spawnY,speed:giant?700:850,drawW:giant?52:34,drawH:giant?76:50,width,height,carSlowStrength:giant?0:.12*laneStacks,maxHits:giant?3:Math.min(4,2+(hero.guanyuCargoStacks||0)+state.global.pierce),damage:giant?giantDamage:normalDamage,hits:new Set(),energyGranted:false,crit:!giant&&Math.random()<(state.global.crit||0),crash:0,batch});
  return true;
}
function launchGuanyuFleet(hero){
  const seed=(state.guanyuSeed+(hero.guanyuCastIndex||0)*0x9e3779b9)>>>0; hero.guanyuCastIndex=(hero.guanyuCastIndex||0)+1;
  const count=Math.min(5,3+Math.floor(guanyuRandom(seed)*3)+(hero.guanyuFleetStacks||0));
  const left=26+12,right=GAME_CONFIG.arena.width-26-12, lanes=[0,1,2,3,4]; let x=seed||1;
  for(let i=lanes.length-1;i>0;i--){x=(x*1664525+1013904223)>>>0;const j=x%(i+1);[lanes[i],lanes[j]]=[lanes[j],lanes[i]];}
  const batch={id:`fleet-${state.wave}-${hero.guanyuCastIndex}`,hits:new Map()};
  for(const lane of lanes.slice(0,count))launchGuanyuCar(hero,true,left+(right-left)*((lane+.5)/5),batch);
  state.effects.push({text:`巨轮车队 ×${count}`,x:GAME_CONFIG.arena.width/2,y:GAME_CONFIG.arena.wallY-30,life:.7,color:'#ffd27a'});
}
// Exact first contact for a vertical swept AABB against an enemy circle. The horizontal rectangle side is expanded by the circle radius; near corners use the circle arc, preserving collision order across frame rates.
function sweptCarRectHitT(car,ax,ay,bx,by,enemy){
  const radius=GAME_CONFIG.enemies[enemy.id].radius, dx=Math.abs(enemy.x-ax), halfW=car.width/2, halfH=car.height/2;
  if(dx>halfW+radius)return null;
  const cornerDx=Math.max(0,dx-halfW), verticalReach=halfH+Math.sqrt(Math.max(0,radius*radius-cornerDx*cornerDx));
  const high=enemy.y+verticalReach, low=enemy.y-verticalReach;
  if(ay<=high&&ay>=low)return 0;
  const distance=ay-by;if(distance<=0||ay<low||by>high)return null;
  const t=(ay-high)/distance;return t>=0&&t<=1?t:null;
}
function updateCars(dt){
  for(const car of [...state.cars]){
    if(car.crash>0){car.crash-=dt;if(car.crash<=0)remove(state.cars,car);continue;}
    const hero=state.heroes.find(h=>h.id===car.hero);if(!hero){remove(state.cars,car);continue;}
    const ax=car.x,ay=car.y,step=car.speed*dt,bx=ax,by=ay-step;
    car.px=ax;car.py=ay;
    const hits=state.enemies.filter(e=>!car.hits.has(e)).map(e=>({e,t:sweptCarRectHitT(car,ax,ay,bx,by,e)})).filter(v=>v.t!==null).sort((a,b)=>a.t-b.t);
    for(const hit of hits){
      if(car.hits.size>=car.maxHits)break;
      if(car.giant){const used=car.batch.hits.get(hit.e)||0;if(used>=2)continue;car.batch.hits.set(hit.e,used+1);}
      car.hits.add(hit.e);const damage=car.damage*(car.crit?2:1),ok=damageEnemy(hit.e,damage,car.crit?'暴击':'车撞');
      if(!car.giant&&car.carSlowStrength>0&&state.enemies.includes(hit.e)){hit.e.carSlowRemaining=.8;hit.e.carSlowStrength=Math.min(.24,car.carSlowStrength);}
      if(ok&&!car.giant&&!car.energyGranted){primaryEnergy(hero,GAME_CONFIG.heroes.guanyu,hero.mods||defaultMods());car.energyGranted=true;}
      state.effects.push({text:car.giant?'巨轮':'外卖',x:hit.e.x,y:hit.e.y-18,life:.22,color:car.giant?'#ffcf6a':'#ffe2a1',ring:GAME_CONFIG.enemies[hit.e.id].radius+8});
      if(car.hits.size>=car.maxHits){car.x=ax+(bx-ax)*hit.t;car.y=ay+(by-ay)*hit.t;car.crash=.08;break;}
    }
    if(car.crash>0)continue;car.x=bx;car.y=by;
    if(car.y-car.height/2<0)remove(state.cars,car);
  }
}
function monkTarget(hero,range=560){const x=heroX(hero),y=711;return state.enemies.filter(e=>Math.hypot(e.x-x,e.y-y)<=range).sort((a,b)=>b.y-a.y||Math.hypot(a.x-x,a.y-y)-Math.hypot(b.x-x,b.y-y)||(a.spawnOrder||0)-(b.spawnOrder||0))[0];}
function monkStun(e,hero){if(e.stunResist>0)return;const elite=e.id==='rift',boss=e.id==='boss',n=hero.monkCalmStacks||0,d=(boss?.5:elite?1:2)+(boss?.1:elite?.15:.3)*n,r=boss?2:elite?1.5:1;e.stun=Math.max(e.stun||0,d);e.stunResist=r;}
function launchMonkFish(hero){const target=monkTarget(hero);if(!target||state.monkFish.length>=8)return false;const x=heroX(hero),y=711,dx=target.x-x,dy=target.y-y,d=Math.hypot(dx,dy)||1,m=hero.mods||defaultMods();state.monkFish.push({hero:'monk',x,y,vx:dx/d*280,vy:dy/d*280,distance:0,age:0,verses:0,hits:new Set(),energy:false,crit:Math.random()<(state.global.crit||0),damage:14*state.global.damage*(1+m.damage+.2*(hero.monkStrikeStacks||0))});return true;}
function updateMonk(dt){for(const fish of [...state.monkFish]){const hero=state.heroes.find(h=>h.id==='monk');if(!hero){remove(state.monkFish,fish);continue;}const ax=fish.x,ay=fish.y,bx=ax+fish.vx*dt,by=ay+fish.vy*dt;fish.age+=dt;while(fish.verses<2&&fish.age>=fish.verses+1){fish.verses++;if(state.scriptures.length<12){const t=state.enemies.filter(e=>Math.hypot(e.x-fish.x,e.y-fish.y)<=220).sort((a,b)=>Math.hypot(a.x-fish.x,a.y-fish.y)-Math.hypot(b.x-fish.x,b.y-fish.y)||b.y-a.y||(a.spawnOrder||0)-(b.spawnOrder||0))[0];if(t)state.scriptures.push({hero:'monk',target:t,x:fish.x,y:fish.y,tx:t.x,ty:t.y,time:0,duration:.35,damage:(9+(hero.mods.monkVerseDamage||0))*(1+.35*(hero.monkVerseStacks||0))});}}const limit=Math.min(3,1+state.global.pierce);for(const hit of state.enemies.filter(e=>!fish.hits.has(e)).map(e=>({e,t:segmentHitT(ax,ay,bx,by,e.x,e.y,GAME_CONFIG.enemies[e.id].radius+16)})).filter(x=>x.t!==null).sort((a,b)=>a.t-b.t)){fish.hits.add(hit.e);const ok=damageEnemy(hit.e,fish.damage*(fish.crit?2:1),fish.crit?'暴击':'木鱼');if(ok){monkStun(hit.e,hero);if(!fish.energy){primaryEnergy(hero,GAME_CONFIG.heroes.monk,hero.mods);fish.energy=true;}}if(fish.hits.size>=limit){remove(state.monkFish,fish);break;}}fish.x=bx;fish.y=by;fish.distance+=280*dt;if(fish.distance>=600||fish.y<0)remove(state.monkFish,fish);}for(const s of [...state.scriptures]){s.time+=dt;if(s.time>=s.duration){if(state.enemies.includes(s.target))damageEnemy(s.target,s.damage,'经文');remove(state.scriptures,s);}}}
function monkPulse(s){s.pulses++;s.pulseVisual=.35;for(const e of state.enemies)if(Math.hypot(e.x-s.x,e.y-s.y)<=s.radius)e.bind=Math.max(e.bind||0,e.id==='boss'?.5:e.id==='rift'?1:2);state.effects.push({ring:s.radius,x:s.x,y:s.y,life:.35,color:'#f2cf77'});}
function updateSuperMonks(dt){for(const s of [...state.superMonks]){const hero=state.heroes.find(h=>h.id==='monk');if(!hero){remove(state.superMonks,s);continue;}let remaining=dt;if(!s.arrived){const dx=s.tx-s.x,dy=s.ty-s.y,d=Math.hypot(dx,dy);const step=Math.min(d,500*remaining);const ax=s.x,ay=s.y;if(d>0){s.x+=dx/d*step;s.y+=dy/d*step;}if(step>=d){s.x=s.tx;s.y=s.ty;s.hits??=new Set();for(const e of state.enemies.filter(e=>!s.hits.has(e)).map(e=>({e,t:segmentHitT(ax,ay,s.x,s.y,e.x,e.y,GAME_CONFIG.enemies[e.id].radius+32)})).filter(v=>v.t!==null)){s.hits.add(e.e);damageEnemy(e.e,s.damage,'超级木鱼');monkStun(e.e,hero);}s.arrived=true;s.time=0;monkPulse(s);remaining-=d/500;}else remaining=0;}if(!s.arrived)continue;const before=s.time;s.time+=remaining;s.pulseVisual=Math.max(0,(s.pulseVisual||0)-dt);if(s.pulses<2&&before<2.5&&s.time>=2.5)monkPulse(s);if(s.time>=5)remove(state.superMonks,s);}}
function updateHeroes(dt) {
  for (const hero of state.heroes) {
    const spec = GAME_CONFIG.heroes[hero.id];
    if (hero.distortionTimer) hero.distortionTimer = Math.max(0, hero.distortionTimer - dt);
    if (hero.id === 'laser') {
      if(hero.laserUlt>0){hero.laserUlt=Math.max(0,hero.laserUlt-dt);if(hero.laserUlt<1e-6)hero.laserUlt=0;}
      if(hero.laserBeam)hero.laserBeam.flash=Math.max(0,hero.laserBeam.flash-dt);
      hero.laserTimer=(hero.laserTimer ?? .1)-dt;
      while(hero.laserTimer<=0){hero.laserTimer+=attackInterval(hero,spec);laserTick(hero);}
      continue;
    }
    if(hero.id==='princess'){
      hero.cooldown-=dt;
      if(hero.cooldown<=0&&launchNeedle(hero))hero.cooldown+=attackInterval(hero,spec);
      continue;
    }
    if(hero.id==='arthur'){
      hero.cooldown-=dt;const target=findArthurTarget(hero);if(hero.cooldown<=0&&target&&launchBlade(hero,target.x,target.y))hero.cooldown+=attackInterval(hero,spec);continue;
    }
    if(hero.id==='guanyu'){
      hero.cooldown-=dt;
      if(hero.cooldown<=0){if(launchGuanyuCar(hero))hero.cooldown=attackInterval(hero,spec);else if(state.cars.filter(car=>!car.giant).length>=12)hero.cooldown=.05;else hero.cooldown=0;}
      continue;
    }
    if(hero.id==='monk'){hero.cooldown-=dt;if(hero.cooldown<=0&&launchMonkFish(hero))hero.cooldown=attackInterval(hero,spec);continue;}
    hero.cooldown -= dt;
    if (hero.cooldown <= 0 && state.enemies.length) {
      const interval = attackInterval(hero,spec);
      hero.cooldown += interval;
      const target = [...state.enemies].sort((a,b) => b.y - a.y)[0];
      state.shots.push({ hero: hero.id, x: heroX(hero), y: 711, target, hits: new Set(), pierce: (spec.pierce || 0) + state.global.pierce, life: 2 });
      if (hero.id === 'rock' && state.evolutions.has('rockEvo')) state.wallHp = Math.min(state.wallMax, state.wallHp + 2);
    }
  }
}
function updateUltimates(dt) {
  if (!state.running || state.ended) return;
  if (state.shieldTimer > 0) { state.shieldTimer = Math.max(0, state.shieldTimer - dt); if (!state.shieldTimer) state.wallShield = 0; }
  for (const ult of [...state.ultimates]) {
    ult.timer -= dt;
    while (ult.remaining > 0 && ult.timer <= 0) {
      if (ult.type === 'kite') {
        const target = closestWallEnemy(); if (target) state.shots.push({ ultimate: 'kite', x: GAME_CONFIG.arena.width / 2, y: 711, target, hits: new Set(), pierce: 4, life: 2, damage: 32 * (ult.power || 1) });
        ult.timer += .1;
      } else if (ult.type === 'star') {
        const center = densestEnemyCenter(105); const isExtra = ult.extra && ult.remaining <= ult.extra; if (center) areaDamage(center.x, center.y, ult.radius || 75, 75 * (ult.power || 1) * (isExtra ? (ult.extraPower||.5) : 1), '星群');
        ult.timer += .35;
      }
      ult.remaining--;
    }
    if (ult.remaining <= 0) remove(state.ultimates, ult);
  }
}
function densestEnemyCenter(radius) {
  let best = null, bestCount = -1;
  for (const enemy of state.enemies) { const count = state.enemies.filter(other => Math.hypot(enemy.x-other.x, enemy.y-other.y) <= radius).length; if (count > bestCount || (count === bestCount && best && enemy.y > best.y)) { best = enemy; bestCount = count; } }
  return best;
}
function areaDamage(x, y, radius, damage, label) { for (const enemy of [...state.enemies]) if (Math.hypot(enemy.x-x, enemy.y-y) <= radius) damageEnemy(enemy, damage, label); state.effects.push({ ring: radius, x, y, life: .3, color: '#ffd772' }); }
function heroX(hero) { return 55 + state.heroes.indexOf(hero) * 70; }
function updateShots(dt) {
  for (const shot of [...state.shots]) {
    shot.life -= dt; if (!shot.target || !state.enemies.includes(shot.target) || shot.life <= 0) { remove(state.shots, shot); continue; }
    const dx = shot.target.x - shot.x, dy = shot.target.y - shot.y, d = Math.hypot(dx, dy) || 1, speed = 490;
    shot.x += dx / d * speed * dt; shot.y += dy / d * speed * dt;
    if (d < 16) { hitShot(shot, shot.target); if (shot.pierce > 0) { shot.pierce--; shot.hits.add(shot.target); shot.target = closestUnhit(shot); } else remove(state.shots, shot); }
  }
}
function closestUnhit(shot) { return state.enemies.filter(e => !shot.hits.has(e)).sort((a,b) => Math.hypot(a.x-shot.x,a.y-shot.y)-Math.hypot(b.x-shot.x,b.y-shot.y))[0]; }
function hitShot(shot, target) {
  if (shot.ultimate) { damageEnemy(target, shot.damage, '风刃'); return; }
  const spec = GAME_CONFIG.heroes[shot.hero], hero = state.heroes.find(item=>item.id===shot.hero), mods = hero?.mods || defaultMods(); let damage = spec.damage * state.global.damage * (1 + mods.damage), crit = Math.random() < (state.global.crit + (spec.crit || 0)); if (crit) damage *= 2;
  const causedDamage = damageEnemy(target, damage, crit ? '暴击' : '');
  if (causedDamage && !shot.energyGranted) { primaryEnergy(hero,spec,mods); shot.energyGranted = true; }
  if (spec.slow) { target.slow = Math.max(target.slow, 1.25); target.slowStrength = Math.max(target.slowStrength || 0, Math.min(.55, .25 + mods.slow)); }
  if (spec.knockback) target.y = Math.max(92, target.y - spec.knockback);
  let radius = spec.splash || 0; if (state.evolutions.has('emberEvo') && shot.hero === 'ember') radius = 47; if (state.evolutions.has('starEvo') && shot.hero === 'star') radius = 68;
  if (radius) splash(target, radius, damage * (state.evolutions.has('starEvo') ? .75 : .55), shot.hero);
  if (state.evolutions.has('frostEvo') && shot.hero === 'frost' && Math.random() < .35) { target.frozen = 1.2; state.effects.push({ text: '冻结', x: target.x, y: target.y - 20, life: .6, color: '#b9efff' }); }
  if (state.evolutions.has('kiteEvo') && shot.hero === 'kite') splash(target, 55, damage * .55, shot.hero);
}
function splash(center, radius, damage, source) { for (const e of [...state.enemies]) if (e !== center && Math.hypot(e.x-center.x, e.y-center.y) < radius) damageEnemy(e, damage, '溅射'); state.effects.push({ ring: radius, x: center.x, y: center.y, life: .22, color: GAME_CONFIG.heroes[source].color }); }
function damageEnemy(enemy, damage, label) { if (!state.enemies.includes(enemy)) return false; enemy.hp -= damage; enemy.flash = .1; state.effects.push({ text: `${Math.ceil(damage)}${label ? ' '+label : ''}`, x: enemy.x, y: enemy.y - 12, life: .5, color: label === '暴击' ? '#ffe36a' : '#ffffff' }); if (enemy.id === 'boss' && !enemy.bossTapeTriggered && enemy.hp <= enemy.maxHp * .5) { enemy.bossTapeTriggered = true; queueTapeAt(enemy.x, enemy.y); } if (enemy.hp <= 0) kill(enemy); return true; }
function kill(enemy) { const type = GAME_CONFIG.enemies[enemy.id]; remove(state.enemies, enemy); state.kills++; state.waveDeaths++; const wave = state.wave; if (wave <= 3 && !state.waveTapeAwarded && state.waveDeaths >= Math.ceil(state.waveEnemyTotal*.6)) queueTapeAt(enemy.x, enemy.y); if ((wave === 4 || wave === 5) && enemy.id === 'rift' && !state.waveTapeAwarded) queueTapeAt(enemy.x, enemy.y); addXp(type.xp * state.global.xp); }
function addXp(amount) { state.xp += amount; while (state.xp >= xpNeed()) { state.xp -= xpNeed(); state.level++; showChoices('level'); break; } }
function awardWallDamageEnergy() {
  const second = Math.floor(state.elapsed);
  if (state.wallHitSecond !== second) { state.wallHitSecond = second; state.wallHitCounts = new Map(); }
  for (const hero of state.heroes) { const count = state.wallHitCounts.get(hero.id) || 0; if (count < GAME_CONFIG.energy.wallHitCapPerSecond) { state.wallHitCounts.set(hero.id, count + 1); addHeroEnergy(hero, GAME_CONFIG.energy.wallHitGain); } }
}
function hurtWall(damage) {
  const shieldAbsorbed = Math.min(state.wallShield, damage); state.wallShield -= shieldAbsorbed; const hpDamage = damage - shieldAbsorbed;
  if (hpDamage > 0) { state.wallHp = Math.max(0, state.wallHp - hpDamage); awardWallDamageEnergy(); state.effects.push({ text: `城墙 -${hpDamage}`, x: GAME_CONFIG.arena.width / 2, y: GAME_CONFIG.arena.wallY - 15, life: .6, color: '#ff9e90' }); }
  else state.effects.push({ text: `护盾 -${shieldAbsorbed}`, x: GAME_CONFIG.arena.width / 2, y: GAME_CONFIG.arena.wallY - 15, life: .6, color: '#8ee6ff' });
  if (!state.wallHp) lose();
}
function updateEffects(dt) { for (const e of [...state.effects]) { e.life -= dt; if (e.text) e.y -= 22 * dt; if (e.life <= 0) remove(state.effects, e); } }
function remove(arr, obj) { const i = arr.indexOf(obj); if (i >= 0) arr.splice(i, 1); }
function finish(title, desc, victory) {
  const uninstalled=(state.tapeTray?.length||0)+(state.tapeOverflowQueue?.length||0)+(state.tapeFlying?.length||0)+(state.tapeDrop?1:0)+(state.tapeQueue?.length||0); state.running = false; state.ended = true; state.ultimates = []; state.heroes.forEach(hero=>{if(hero.id==='laser'){hero.laserUlt=0;hero.laserBeam=null;}}); state.shots = state.shots.filter(shot => !shot.ultimate); state.needles=[];state.blades=[];state.cars=[];state.monkFish=[];state.scriptures=[];state.superMonks=[];state.arthurShield=null; state.tapeDrop=null; state.tapeQueue=[]; state.pendingTape=null; state.tapeTray=[];state.tapeOverflowQueue=[];state.tapeFlying=[];state.overflowDraining=null;state.tapeInteraction=null;{const ghost=document.querySelector('.tape-ghost');if(ghost?.remove)ghost.remove();}clearTapeTargetMarks();ui.tapeTray.hidden=true;ui.tapeTray.replaceChildren();state.modalKind='result'; ui.modal.classList.remove('hidden');
  ui.kicker.textContent = victory ? '梦境恢复安宁' : '城墙已经失守'; ui.title.textContent = title; ui.desc.textContent = `${desc}｜未装备卡带 ${uninstalled} 盘`;
  ui.choices.replaceChildren(); ui.choices.classList.remove('portrait-choices'); ui.choices.classList.add('finish-actions');
  const again = document.createElement('button'); again.type='button'; again.className='choice'; again.style.setProperty('--card-color', victory ? '#70d489' : '#ef6e57'); again.innerHTML = `<span class="choice-icon">${choiceIconSvg(victory ? 'star' : 'repair')}</span><span><strong>再次守卫</strong><small>本局击败 ${state.kills} 个噩梦</small></span>`; again.onclick = restart;
  const home = document.createElement('button'); home.type='button'; home.className='choice'; home.style.setProperty('--card-color', '#648fe8'); home.innerHTML = `<span class="choice-icon">${choiceIconSvg('fortify')}</span><span><strong>返回主界面</strong><small>回到月门防线</small></span>`; home.onclick = showLobby;
  ui.choices.append(again, home);
}
function win() { finish('第七波已清剿！', `你守住了梦境城墙，击败 ${state.kills} 个噩梦。`, true); }
function lose() { finish('梦境防线失守', `你在第 ${state.wave + 1} 波止步；调整祝福再试一次。`, false); }
function restart() { if (mode !== 'battle') return; cancelAnimationFrame(raf); {const ghost=document.querySelector('.tape-ghost');if(ghost?.remove)ghost.remove();} clearTapeTargetMarks(); ui.tapeTray.hidden=true;ui.tapeTray.replaceChildren(); ui.choices.classList.remove('finish-actions'); ui.ultimateControls.replaceChildren(); state = newState(); showChoices('hero'); render(); updateUi(); raf = requestAnimationFrame(loop); }
function updateUi() { const need = xpNeed(), wallRatio = state.wallHp / state.wallMax; ui.wave.textContent = `第 ${Math.min(state.wave + 1, 7)} / 7 波`; ui.level.textContent = `Lv.${state.level}`; ui.wallText.textContent = `${Math.ceil(state.wallHp)} / ${state.wallMax}`; ui.wallBar.style.width = `${100*wallRatio}%`; ui.wallHealth.classList.toggle('danger', wallRatio <= .3); ui.xpText.textContent = `${Math.floor(state.xp)} / ${need}`; ui.xpBar.style.width = `${100*state.xp/need}%`; }
function render() {
  const { width:w, height:h, wallY } = GAME_CONFIG.arena; ctx.clearRect(0,0,w,h);
  const sky=ctx.createLinearGradient(0,0,0,h); sky.addColorStop(0,'#31305b'); sky.addColorStop(.26,'#242951'); sky.addColorStop(.82,'#151b39'); sky.addColorStop(1,'#0b1027'); ctx.fillStyle=sky; ctx.fillRect(0,0,w,h);
  // 连续石质通道：纵深纹理只存在于城墙前，英雄区域保持独立。
  ctx.fillStyle='#222a4b';ctx.fillRect(16,74,w-32,wallY-74);ctx.strokeStyle='#68739b52';ctx.lineWidth=2;ctx.strokeRect(16,74,w-32,wallY-74);
  ctx.strokeStyle='#7e89ad28';ctx.lineWidth=1;for(let x=22;x<w-16;x+=64){ctx.beginPath();ctx.moveTo(x,74);ctx.lineTo(x,wallY);ctx.stroke();}for(let y=116;y<wallY;y+=70){ctx.beginPath();ctx.moveTo(16,y);ctx.lineTo(w-16,y);ctx.stroke();}
  ctx.fillStyle='#202944';ctx.fillRect(0,wallY,w,h-wallY);ctx.fillStyle='#111834';ctx.fillRect(0,wallY+19,w,h-wallY-19);
  // 城墙横向分界与石质垛口。
  ctx.fillStyle=state.wallShield > 0 ? '#39708c' : '#465574';ctx.fillRect(0,wallY,w,17);ctx.fillStyle='#7d8fa8';for(let x=0;x<w;x+=30){ctx.fillRect(x,wallY-10,20,13);ctx.fillStyle='#aab9c7';ctx.fillRect(x+3,wallY-7,14,3);ctx.fillStyle='#7d8fa8';}if(state.wallShield>0){ctx.strokeStyle='#8deaff';ctx.lineWidth=2;ctx.strokeRect(4,wallY-15,w-8,34);}
  // 顶部裂隙入口。
  ctx.strokeStyle='#b88be4';ctx.shadowColor='#8c64d4';ctx.shadowBlur=14;ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(w/2,91,66,16,0,0,Math.PI*2);ctx.stroke();ctx.shadowBlur=0;
  for(const e of state.enemies) drawEnemy(e); drawArthurShield(); drawLasers(); for(const s of state.superMonks) drawSuperMonk(s); for(const blade of state.blades) drawBlade(blade); for(const car of state.cars) drawCar(car); for(const fish of state.monkFish) drawMonkFish(fish); for(const verse of state.scriptures) drawScripture(verse); for(const s of state.shots) drawShot(s); for(const needle of state.needles) drawNeedle(needle); if(state.tapeDrop) drawTapeDrop(state.tapeDrop); for(const flight of state.tapeFlying) drawTapeFlight(flight);if(state.overflowDraining)drawOverflowDrain(state.overflowDraining); for(const e of state.effects) drawEffect(e); drawHeroes();drawPrincessNeedleCount();drawGuanyuCarCount();
}
function drawEnemy(e) { const t=GAME_CONFIG.enemies[e.id], r=t.radius; ctx.save();ctx.translate(e.x,e.y);ctx.fillStyle=e.flash?'#fff':t.color;ctx.beginPath();ctx.arc(0,0,r,0,Math.PI*2);ctx.fill();ctx.fillStyle='#10152c';ctx.beginPath();ctx.arc(-r*.28,-2,2.5,0,7);ctx.arc(r*.28,-2,2.5,0,7);ctx.fill();if(e.stun>0){ctx.strokeStyle='#ffe48a';ctx.beginPath();ctx.arc(0,-r-6,5,0,7);ctx.stroke();}if(e.bind>0){ctx.strokeStyle='#e9be55';ctx.beginPath();ctx.arc(0,r+4,r*.8,0,7);ctx.stroke();ctx.beginPath();ctx.moveTo(-5,r+4);ctx.lineTo(5,r+4);ctx.stroke();}ctx.restore();ctx.fillStyle='#10152c';ctx.fillRect(e.x-r,e.y-r-8,r*2,4);ctx.fillStyle='#69e28e';ctx.fillRect(e.x-r,e.y-r-8,r*2*Math.max(0,e.hp/e.maxHp),4); if(e.frozen){ctx.strokeStyle='#d7fbff';ctx.strokeRect(e.x-r-2,e.y-r-2,r*2+4,r*2+4);} }
function drawShot(s) { const c=s.ultimate?'#9fe8ff':GAME_CONFIG.heroes[s.hero].color;ctx.fillStyle=c;ctx.shadowColor=c;ctx.shadowBlur=10;ctx.beginPath();ctx.arc(s.x,s.y,s.ultimate?6:5,0,7);ctx.fill();ctx.shadowBlur=0; }
function drawBlade(b){ctx.save();ctx.strokeStyle=b.retaliate?'#f4a75e':b.crit?'#ffe286':'#dbeeff';ctx.shadowColor=ctx.strokeStyle;ctx.shadowBlur=8;ctx.lineWidth=Math.max(3,b.width/12);ctx.beginPath();ctx.arc(b.x,b.y,b.width*.16,0,Math.PI*1.3);ctx.stroke();ctx.restore();}
function drawCar(car){ctx.save();const w=car.drawW,h=car.drawH,tailX=car.px??car.x,tailY=(car.py??car.y)+h*.52;const tail=ctx.createLinearGradient(car.x,car.y+h*.15,tailX,tailY);tail.addColorStop(0,car.giant?'#ffd873cc':'#ffd47dcc');tail.addColorStop(1,car.giant?'#c83d3a00':'#ef6a3a00');ctx.strokeStyle=tail;ctx.lineWidth=car.giant?22:13;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(car.x,car.y+h*.12);ctx.lineTo(tailX,tailY);ctx.stroke();ctx.translate(car.x,car.y);ctx.shadowColor=car.giant?'#f5b54d':'#f17746';ctx.shadowBlur=car.giant?14:7;ctx.fillStyle=car.giant?'#b83e3e':'#dd6b43';ctx.fillRect(-w/2,-h/2,w,h);ctx.fillStyle=car.giant?'#f0b04d':'#ffb454';ctx.fillRect(-w*.31,-h*.27,w*.62,h*.27);ctx.fillStyle='#fbebc8';ctx.fillRect(-w*.19,-h*.05,w*.38,h*.22);ctx.fillStyle='#15203d';ctx.fillRect(-w/2-2,h*.25,8,10);ctx.fillRect(w/2-6,h*.25,8,10);ctx.shadowBlur=0;ctx.strokeStyle=car.giant?'#ffd782':'#ffe7aa';ctx.lineWidth=1.5;ctx.strokeRect(-w/2,-h/2,w,h);ctx.restore();}
function drawMonkFish(f){ctx.save();ctx.translate(f.x,f.y);ctx.fillStyle='#8b6135';ctx.strokeStyle='#f4cf72';ctx.lineWidth=2;ctx.beginPath();ctx.roundRect(-16,-16,32,32,8);ctx.fill();ctx.stroke();ctx.fillStyle='#f1c96d';ctx.beginPath();ctx.arc(0,0,7,0,7);ctx.fill();ctx.restore();}
function drawScripture(s){const t=Math.min(1,s.time/s.duration),x=(1-t)*(1-t)*s.x+2*(1-t)*t*((s.x+s.tx)/2)+t*t*s.tx,y=(1-t)*(1-t)*s.y+2*(1-t)*t*(Math.min(s.y,s.ty)-35)+t*t*s.ty;ctx.save();ctx.fillStyle='#ffe485';ctx.fillRect(x-4,y-6,8,12);ctx.strokeStyle='#9a7132';ctx.strokeRect(x-4,y-6,8,12);ctx.restore();}
function drawSuperMonk(s){ctx.save();if(s.arrived){ctx.strokeStyle='#f2cf77';ctx.globalAlpha=.3;ctx.beginPath();ctx.arc(s.x,s.y,s.radius,0,7);ctx.stroke();if(s.pulseVisual>0){ctx.globalAlpha=s.pulseVisual/.35;ctx.beginPath();ctx.arc(s.x,s.y,s.radius*(1-s.pulseVisual/.7),0,7);ctx.stroke();}}ctx.globalAlpha=1;ctx.translate(s.x,s.y);ctx.fillStyle='#a67632';ctx.strokeStyle='#ffe18a';ctx.lineWidth=3;ctx.beginPath();ctx.roundRect(-32,-32,64,64,14);ctx.fill();ctx.stroke();ctx.restore();}
function drawArthurShield(){const s=state.arthurShield;if(!s)return;ctx.save();ctx.fillStyle='#8bb9e9aa';ctx.beginPath();ctx.arc(s.x,s.y,32,0,7);ctx.fill();ctx.strokeStyle='#cce8ff';ctx.lineWidth=2;ctx.stroke();ctx.strokeStyle='#6ca4db44';ctx.beginPath();ctx.arc(s.x,s.y,220,0,7);ctx.stroke();ctx.fillStyle='#edf7ff';ctx.font='bold 9px Microsoft YaHei';ctx.textAlign='center';ctx.fillText(`${Math.ceil(s.hp)}/${s.maxHp} · 诱敌${s.taunted.size}/5`,s.x,s.y-40);ctx.restore();}
function drawNeedle(needle){const hero=state.heroes.find(h=>h.id===needle.hero),x=needle.x,y=needle.y;if(!hero)return;ctx.save();if(needle.state==='planted'){ctx.globalAlpha=Math.max(.18,needle.life/needle.maxLife);ctx.strokeStyle='#f6c26e';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x-5,y+8);ctx.lineTo(x+5,y-8);ctx.stroke();ctx.strokeStyle='#f6d38b';ctx.lineWidth=1;ctx.beginPath();ctx.arc(x,y,7*needle.life/needle.maxLife,0,7);ctx.stroke();}else if(needle.state==='returning'){ctx.strokeStyle='#ffd56f';ctx.shadowColor='#ffbd55';ctx.shadowBlur=8;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(heroX(hero),711);ctx.stroke();ctx.fillStyle='#fff0bb';ctx.beginPath();ctx.arc(x,y,3,0,7);ctx.fill();}else{ctx.strokeStyle='#ffcf71';ctx.shadowColor='#ff7c52';ctx.shadowBlur=7;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(x-needle.vx/900*9,y-needle.vy/900*9);ctx.lineTo(x,y);ctx.stroke();}ctx.restore();}
function drawPrincessNeedleCount(){const hero=state.heroes.find(h=>h.id==='princess');if(!hero)return;ctx.fillStyle='#ffd38a';ctx.font='bold 8px Microsoft YaHei';ctx.textAlign='center';ctx.fillText(`飞针:${state.needles.filter(needle=>needle.hero==='princess').length}`,heroX(hero),704);}
function drawGuanyuCarCount(){const hero=state.heroes.find(h=>h.id==='guanyu');if(!hero)return;const normal=state.cars.filter(car=>!car.giant).length,giant=state.cars.filter(car=>car.giant).length;ctx.fillStyle='#ffc178';ctx.font='bold 8px Microsoft YaHei';ctx.textAlign='center';ctx.fillText(giant?`车队:${giant}`:`外卖车:${normal}/12`,heroX(hero),704);}
function drawLasers(){for(const hero of state.heroes.filter(h=>h.id==='laser')){const beam=hero.laserBeam,target=beam?.target,x=heroX(hero),y=711,range=(GAME_CONFIG.heroes.laser.range||680)+(hero.mods?.laserRange||0);if(!target||!state.enemies.includes(target)||Math.hypot(target.x-x,target.y-y)>range)continue;ctx.save();ctx.lineCap='round';ctx.strokeStyle='#51dce9';ctx.shadowColor='#53edff';ctx.shadowBlur=8;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(x,y-14);ctx.lineTo(target.x,target.y);ctx.stroke();if(beam.flash>0){ctx.strokeStyle='#e5ffff';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(x,y-14);ctx.lineTo(target.x,target.y);ctx.stroke();}ctx.strokeStyle='#bafcff';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(target.x,target.y,GAME_CONFIG.enemies[target.id].radius+5,0,7);ctx.stroke();ctx.restore();}}
function drawTapeDrop(tape){const c='#65bfff';ctx.save();ctx.translate(tape.x,tape.y);ctx.shadowColor=c;ctx.shadowBlur=14;ctx.fillStyle='#1b2342';ctx.strokeStyle=c;ctx.lineWidth=3;ctx.beginPath();ctx.roundRect(-20,-20,40,40,8);ctx.fill();ctx.stroke();ctx.fillStyle=c;ctx.fillRect(-12,-7,24,14);ctx.fillStyle='#fff';ctx.fillRect(-8,-3,7,6);ctx.fillRect(3,-3,5,6);ctx.restore();}
function drawTapeFlight(f){const progress=Math.max(0,Math.min(1,1-f.time/.4)),target=tapeFlightTarget(f),x=f.x+(target.x-f.x)*progress,y=f.y+(target.y-f.y)*progress-55*4*progress*(1-progress);drawTapeDrop({...f.tape,x,y});}
function overflowDrainOrigin(){const fallback={x:350,y:782},badge=ui.tapeTray?.querySelector?.('.tray-overflow'),rect=badge?.getBoundingClientRect?.(),canvasRect=canvas.getBoundingClientRect();if(!rect||!canvasRect.width||!canvasRect.height)return fallback;return {x:(rect.left+rect.width/2-canvasRect.left)*GAME_CONFIG.arena.width/canvasRect.width,y:(rect.top+rect.height/2-canvasRect.top)*GAME_CONFIG.arena.height/canvasRect.height};}
function drawOverflowDrain(drain){const progress=Math.max(0,Math.min(1,1-drain.time/drain.duration)),from=overflowDrainOrigin(),target=tapeFlightTarget(drain),x=from.x+(target.x-from.x)*progress,y=from.y+(target.y-from.y)*progress-24*4*progress*(1-progress);drawTapeDrop({...drain.tape,x,y});}
function drawEffect(e){ctx.save();ctx.globalAlpha=Math.min(1,e.life*2);if(e.ring){ctx.strokeStyle=e.color;ctx.lineWidth=2;ctx.beginPath();ctx.arc(e.x,e.y,e.ring*(1-e.life/.22*.35),0,7);ctx.stroke();}else{ctx.fillStyle=e.color;ctx.font='bold 11px Microsoft YaHei';ctx.textAlign='center';ctx.fillText(e.text,e.x,e.y);}ctx.restore();}
function drawHeroMark(id,x,y,color){ctx.save();ctx.translate(x,y);ctx.strokeStyle='#fff';ctx.fillStyle=color;ctx.lineWidth=2;ctx.lineJoin='round';if(id==='ember'){ctx.beginPath();ctx.moveTo(0,-12);ctx.lineTo(8,2);ctx.lineTo(2,2);ctx.lineTo(8,12);ctx.lineTo(-8,5);ctx.lineTo(-3,-1);ctx.closePath();ctx.fill();}else if(id==='frost'){for(let i=0;i<3;i++){ctx.rotate(Math.PI/3);ctx.beginPath();ctx.moveTo(-12,0);ctx.lineTo(12,0);ctx.stroke();}}else if(id==='kite'){ctx.beginPath();ctx.moveTo(0,-13);ctx.lineTo(11,0);ctx.lineTo(0,13);ctx.lineTo(-11,0);ctx.closePath();ctx.stroke();ctx.beginPath();ctx.moveTo(0,-13);ctx.lineTo(0,13);ctx.stroke();}else if(id==='rock'){ctx.beginPath();ctx.moveTo(0,-13);ctx.lineTo(12,-8);ctx.lineTo(10,9);ctx.lineTo(0,14);ctx.lineTo(-10,9);ctx.lineTo(-12,-8);ctx.closePath();ctx.fill();}else if(id==='laser'){ctx.beginPath();ctx.arc(0,0,12,0,7);ctx.stroke();ctx.beginPath();ctx.arc(0,0,4,0,7);ctx.fill();}else if(id==='princess'){ctx.rotate(-.7);ctx.fillRect(-2,-13,4,22);ctx.beginPath();ctx.moveTo(0,-16);ctx.lineTo(5,-9);ctx.lineTo(-5,-9);ctx.closePath();ctx.fill();}else if(id==='guanyu'){ctx.fillRect(-11,-7,22,15);ctx.fillStyle='#ffe7bd';ctx.fillRect(-6,-4,12,7);ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(-6,10,3,0,7);ctx.arc(7,10,3,0,7);ctx.fill();}else{ctx.beginPath();for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,r=i%2?6:13;const px=Math.cos(a)*r,py=Math.sin(a)*r;i?ctx.lineTo(px,py):ctx.moveTo(px,py);}ctx.closePath();ctx.fill();}ctx.restore();}
function drawHeroes(){ const cardY=707,colors={blue:'#75b8ef',purple:'#bd83ef',orange:'#f3cf67'};for(const hero of state.heroes){const h=GAME_CONFIG.heroes[hero.id],x=heroX(hero),ratio=hero.energy/hero.energyMax,ready=hero.energy>=hero.energyMax,laserActive=hero.id==='laser'&&hero.laserUlt>0;ctx.fillStyle='#0c1230';ctx.beginPath();ctx.roundRect(x-29,cardY,58,84,10);ctx.fill();ctx.strokeStyle=laserActive?'#c386ff':ready?'#ffd66d':h.color;ctx.lineWidth=laserActive?3:ready?2:1;ctx.shadowColor=laserActive?'#9b75ff':'transparent';ctx.shadowBlur=laserActive?9:0;ctx.stroke();ctx.shadowBlur=0;ctx.fillStyle=h.color;ctx.beginPath();ctx.arc(x,cardY+19,15,0,7);ctx.fill();drawHeroMark(hero.id,x,cardY+19,h.color);ctx.fillStyle='#e8ecff';ctx.font='bold 10px Microsoft YaHei';ctx.textAlign='center';ctx.fillText(h.name,x,cardY+42);ctx.fillStyle='#27304c';ctx.fillRect(x-21,cardY+48,42,5);ctx.fillStyle=ready?'#f3cd59':'#65d8f2';ctx.fillRect(x-21,cardY+48,42*ratio,5);ctx.fillStyle='#b9c8e9';ctx.font='9px Microsoft YaHei';ctx.fillText(`${Math.floor(hero.energy)}/${hero.energyMax}`,x,cardY+62);ctx.fillStyle=laserActive?'#d6b9ff':ready?'#ffe889':'#9ee8ff';ctx.font='bold 8px Microsoft YaHei';ctx.fillText(laserActive?`镭爆 ${hero.laserUlt.toFixed(1)}s`:ready?'可释放':'蓄能中',x,cardY+72);for(let i=0;i<3;i++){const tape=hero.tapes[i],slotX=x-17+i*12,grade=tape&&tapeGrade(tape);ctx.fillStyle='#141b35';ctx.fillRect(slotX,cardY+75,10,7);ctx.strokeStyle=tape?colors[grade]:'#58627f';ctx.lineWidth=tape?1.5:1;ctx.strokeRect(slotX+.5,cardY+75.5,9,6);if(tape){ctx.fillStyle=colors[grade];ctx.font='bold 6px sans-serif';ctx.fillText(grade==='orange'?(tape.alignment==='artifact'?'神':'魔'):grade==='blue'?'Ⅰ':'Ⅱ',slotX+5,cardY+81);if(grade==='orange'&&tape.alignment==='artifact'){ctx.strokeStyle='#ffe889';ctx.shadowColor='#ffd66d';ctx.shadowBlur=5;ctx.beginPath();ctx.arc(slotX+5,cardY+78,7,0,7);ctx.stroke();ctx.shadowBlur=0}if(grade==='orange'&&tape.alignment==='cursed'){ctx.strokeStyle='#8d2530';ctx.shadowColor='#8d2530';ctx.shadowBlur=5;ctx.beginPath();ctx.moveTo(slotX+1,cardY+76);ctx.lineTo(slotX+8,cardY+81);ctx.stroke();ctx.shadowBlur=0}}} } for(let i=state.heroes.length;i<5;i++){let x=55+i*70;ctx.strokeStyle='#67709a';ctx.setLineDash([4,4]);ctx.strokeRect(x-27,cardY,54,84);ctx.setLineDash([]);}}
function loop(now){const dt=Math.min(.05,(now-lastTime)/1000);lastTime=now;update(dt);render();raf=requestAnimationFrame(loop);}
$('#xpDebug').onclick=()=>{ if(state && !state.ended){ addXp(Math.ceil(xpNeed()*.75)); updateUi(); } }; $('#restartDebug').onclick=restart;
$('#startBattle').onclick=startBattle;
canvas.addEventListener('pointerup', event => { if (!state || state.modalKind || state.ended) return; const rect=canvas.getBoundingClientRect(), x=(event.clientX-rect.left)*GAME_CONFIG.arena.width/rect.width, y=(event.clientY-rect.top)*GAME_CONFIG.arena.height/rect.height; if(state.tapeDrop&&Math.hypot(x-state.tapeDrop.x,y-state.tapeDrop.y)<=28){pickGroundTape();return} if(state.tapeInteraction?.tape){const hero=y>=684&&y<=752?state.heroes.find((_,i)=>Math.abs(x-(55+i*70))<=32):null;if(hero)submitTrayTape(state.tapeInteraction.tape,hero);else finishTapeInteraction();return} if(y>=775){const hero=state.heroes.find((_,i)=>Math.abs(x-(55+i*70))<=29);if(hero){const slot=Math.floor((x-(heroX(hero)-17))/12);if(hero.tapes[slot])openTapeDetail(hero,hero.tapes[slot]);}} });
document.querySelectorAll('[data-toast]').forEach(button => button.addEventListener('click', () => showToast(button.dataset.toast)));
showLobby();
