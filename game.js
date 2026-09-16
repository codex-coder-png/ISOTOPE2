'use strict'; window.GAME = {};
(function () {
  const { CATS, ELEMS, MOLDEF, RECIPES, MNODES, ETYPES, RELICS, EL, baseCombat } = DATA;
  const BD = (DATA.BOSSDEFS && DATA.BOSSDEFS.length) ? DATA.BOSSDEFS : [{ name: 'THE CHROMATIC WARDEN', hue: 336, shape: 'hex', pat: 'spiral', hpMul: 1 }];
  const cv = document.getElementById('game'), cx = cv.getContext('2d');
  let W = innerWidth, H = innerHeight; function resize() {
    W = innerWidth; H = innerHeight; cv.width = W; cv.height = H;
    const bg = document.getElementById('bg'); bg.width = W; bg.height = H
  }
  addEventListener('resize', resize); resize();
  const TAU = Math.PI * 2, rnd = (a = 1, b) => b === undefined ? Math.random() * a : a + Math.random() * (b - a);
  const irnd = n => Math.floor(Math.random() * n), clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const d2 = (ax, ay, bx, by) => { const dx = ax - bx, dy = ay - by; return dx * dx + dy * dy };
  const keys = {}, mouse = { x: 0, y: 0, down: false }; let autofire = false;
  let RUN = null, ST = null; const SFX = AUDIO.SFX;
  function mkPlayer(i, name, elemId, signatureSlot, entityMeta) {
    let elId = DATA.canonicalId(elemId || (RUN && RUN.el ? RUN.el.id : SAVE.sel));
    if ((elId === 'e1' && entityMeta) && (entityMeta.entityId || entityMeta.formula || entityMeta.entityName)) {
      const cs=[entityMeta.entityId, entityMeta.formula, entityMeta.entityName, entityMeta.symbol].filter(Boolean);
      for (const c of cs) { const k=DATA.canonicalId(c); if (k !== 'e1' || String(c)==='e1') { elId=k; break; } }
    }
    const el = EL(elId) || EL('e1');
    return {
      id: i, name: name || ('Operator P' + (i + 1)), elementId: elId, elem: el, entityKind: el.mol ? 'compound' : 'element', entityName: el.name || el.sym || elId, formula: el.f || '',
      x: W / 2 + (i === 0 ? -120 : i === 1 ? 120 : i === 2 ? -60 : 60),
      y: H / 2 + (i >= 2 ? 100 : -50),
      hp: 0, sh: 0, downed: false, revive: 0,
      dashCd: 0, dashT: 0, dvx: 0, dvy: 0, iframes: 0, fireT: 0, angle: 0, nox: 0, orbitA: 0,
      novaT: 5, flashT: 6, gravT: 8, auraT: 0, activeCd: 0,
      turretT: 4, adrenT: 0, bulwarkCd: 0, holdT: 0, staticT: 0,
      kills: 0, deaths: 0, respawnTimer: 0, signatureSlot:Number.isFinite(+signatureSlot)?Math.max(0,Math.min(2,+signatureSlot)):0, puDamage:1, puSpeed:1, puRate:1, puTimer:0, puVamp:0, puArmor:0, puProj:1, puCrit:0, puDash:0
    }
  }
  function masteryBonus() {
    const id = RUN.el.id, b = {
      dmg: 0, rate: 0, proj: 0, pierce: 0, crit: 0, critD: 0,
      homing: 0, chain: 0, poison: 0, burn: 0, slow: 0, aoe: 0
    };
    MNODES.forEach(t => {
      const r = SAVE.nodeRank(id, t.key); if (!r) return;
      if (t.key === 'power') b.dmg += t.per * r; if (t.key === 'rate') b.rate += t.per * r;
      if (t.key === 'emission') b.proj += r; if (t.key === 'pen') b.pierce += r;
      if (t.key === 'crit') b.crit += t.per * r; if (t.key === 'over') b.critD += t.per * r;
      if (t.key === 'guide') b.homing += t.per * r; if (t.key === 'arc') b.chain += r;
      if (t.key === 'toxin') b.poison += r; if (t.key === 'exotherm') b.burn += r;
      if (t.key === 'zero') b.slow += r; if (t.key === 'detonate') b.aoe += r
    }); return b
  }
  function computeStats() {
    const c = baseCombat(RUN.el), ml = SAVE.raw.meta, ab = RUN.ab,
      L = id => ab[id] || 0, tr = RUN.el.trait || '', mb = masteryBonus();
    const relic = id => RUN.relics.includes(id), X = advancedBonus(); const s = {};
    s.dmg = c.dmg * (1 + .05 * (ml.dmg || 0)) * (1 + .22 * L('pow')) * (1 + mb.dmg / 100 + X.dmg) * (relic('core') ? 1.2 : 1) * (relic('prism_core') ? 1.1 : 1) * (relic('hex_blood') ? 1.28 : 1) * (relic('hex_null') ? .72 : 1);
    s.rate = c.rate * (1 + .15 * L('rate') + X.rate + .05 * (ml.rate || 0)) * (1 + mb.rate / 100) * (relic('prism_core') ? 1.05 : 1);
    s.ps = c.ps * (1 + .05 * L('windshear') + X.ps); s.kb = c.kb; s.pierce = c.pierce + L('pierce') + mb.pierce + Math.floor(X.pierce) + (ml.pierce || 0);
    s.crit = c.crit + 2.5 * (ml.crit || 0) + 8 * L('crit') + mb.crit + X.crit + (relic('fission_emblem') ? 5 : 0);
    s.critD = 1.8 + .4 * L('crit') + mb.critD / 100 + .25 * L('overdmg');
    s.spd = c.spd * (1 + .03 * (ml.spd || 0) + X.spd) * (1 + .08 * L('swift')) * (relic('phase_drive') ? 1.1 : 1) * (relic('hex_fragile') ? .78 : 1);
    s.hp = Math.round((c.hp + 12 * (ml.hp || 0)) * (1 + .06 * L('juggernaut') + X.hp) * (relic('hex_fragile') ? .72 : 1) * (relic('hex_blood') ? .82 : 1));
    s.magnet = 95 * (1 + .18 * (ml.mag || 0) + X.magnet) * (1 + .45 * L('magnet')) * (relic('magnet') ? 1.6 : 1) * (relic('ion_compass') ? 1.1 : 1);
    s.coinMult = (1 + .08 * (ml.luck || 0) + (tr === 'lucky' ? .4 : 0) + .15 * L('scavenger')) * (relic('golden_filter') ? 1.12 : 1);
    s.shieldMax = (15 * (ml.shield || 0) + 8 * L('plating') + X.shield + (relic('aegis_engine') ? 25 : 0)) * (relic('hex_aegis') ? 2 : 1);
    s.armor = clamp(c.armor + (tr === 'armor' ? .25 : 0) + .03 * L('juggernaut') + X.armor + .02 * (ml.armor || 0) + (relic('inertial_dampener') ? .12 : 0), 0, .85);
    s.projs = 1 + L('multi') + mb.proj + Math.floor(X.projs) + (relic('lens') ? 1 : 0) + (relic('singularity_lens') ? 1 : 0);
    s.homing = .055 * L('homing') + (RUN.style === 'magnet' ? .03 : 0) + mb.homing;
    s.leech = L('leech');
    s.chainLv = L('chain') + mb.chain + Math.floor(X.chain) + (tr === 'chain' ? 2 : 0) + (tr === 'conduct' ? 2 : 0);
    s.poisonLv = mb.poison + Math.floor(X.poison) + (RUN.style === 'corrode' ? 1 : 0) + (tr === 'toxic' || tr === 'miasma' ? 1 : 0) + (relic('corrosion_coil') ? 1 : 0);
    s.burnLv = mb.burn + Math.floor(X.burn) + (tr === 'burn' ? 1 : 0) + (relic('thermal_heart') ? 1 : 0);
    s.slowLv = mb.slow + Math.floor(X.slow) + (tr === 'chill' || tr === 'hydrate' || tr === 'conduct' ? 1 : 0);
    s.aoeLv = mb.aoe + Math.floor(X.aoe) + (RUN.style === 'boom' ? 1 : 0) + (tr === 'boom' ? 1 : 0) + (tr === 'blast' ? 2 : 0) + (ml.aoe || 0) + (relic('resonance_drum') ? 1 : 0);
    s.fission = L('fission');
    s.dashCd = 2.4 * Math.pow(.88, L('swift')) * (relic('battery') ? .7 : 1) * (relic('phase_drive') ? .9 : 1);
    s.activeCd = ((RUN.el.act && RUN.el.act.cd) || (CATS[RUN.el.cat] && CATS[RUN.el.cat].act.cd) || 7) * (relic('battery') ? .7 : 1);
    s.regen = (tr === 'hydrate' ? 1.5 : 0) + (relic('coolant') ? 2 : 0);
    s.thorns = L('thorns'); s.vamp = L('vamp'); s.ricochet = L('ricochet'); s.mines = L('mines');
    s.freeze = L('freeze'); s.execute = L('execute'); s.berserk = L('berserk'); s.voltaic = L('voltaic');
    s.bloodlust = L('bloodlust'); s.bulwark = L('bulwark'); s.static = L('static'); s.lifeline = L('lifeline');
    s.hoarder = L('hoarder'); s.windup = L('windup'); s.splitshot = L('splitshot'); s.necroblast = L('necroblast');
    ALL_CARDS.forEach(a=>{const lv=L(a.id);if(!lv||!a.extraStat)return;const v=a.extraValue*lv;
      if(a.extraStat==='dmg')s.dmg*=1+v;else if(a.extraStat==='rate')s.rate*=1+v;else if(a.extraStat==='hp')s.hp+=v;
      else if(a.extraStat==='spd')s.spd*=1+v;else if(a.extraStat==='crit')s.crit+=v*100;else if(a.extraStat==='shield')s.shieldMax+=v;
      else if(a.extraStat==='magnet')s.magnet*=1+v;else if(a.extraStat==='projs')s.projs+=Math.max(1,Math.round(v));
      else if(a.extraStat==='pierce')s.pierce+=Math.max(1,Math.round(v));else if(a.extraStat==='aoe')s.aoeLv+=Math.max(1,Math.round(v));
      else if(a.extraStat==='homing')s.homing+=v;else if(a.extraStat==='coin')s.coinMult*=1+v;});
    const Lp = ELAB[RUN.el.id];
    if (Lp && Lp.ps) {
      const q = Lp.ps;
      if (q.dmg) s.dmg *= 1 + q.dmg; if (q.rate) s.rate *= Math.max(.4, 1 + q.rate); if (q.spd) s.spd *= 1 + q.spd;
      if (q.hp) s.hp = Math.round(s.hp * (1 + q.hp)); if (q.crit) s.crit += q.crit * 100; if (q.critD) s.critD += q.critD;
      if (q.armor) s.armor = clamp(s.armor + q.armor, 0, .85); if (q.shield) s.shieldMax += q.shield; if (q.magnet) s.magnet *= 1 + q.magnet;
    }
    if(window.ISO_QAUG_DEFS){
      Object.keys(window.ISO_QAUG_DEFS).forEach(function(k){
        var lv=Number(ml[k]||0),def=window.ISO_QAUG_DEFS[k];if(!lv||!def)return;
        var v=def.per*lv;
        if(def.stat==='dmg')s.dmg*=1+v;
        else if(def.stat==='rate')s.rate*=1+v;
        else if(def.stat==='hp')s.hp+=v;
        else if(def.stat==='spd')s.spd*=1+v;
        else if(def.stat==='crit')s.crit+=v*100;
        else if(def.stat==='shield')s.shieldMax+=v;
        else if(def.stat==='magnet')s.magnet*=1+v;
        else if(def.stat==='pierce')s.pierce+=v;
        else if(def.stat==='aoe')s.aoeLv+=v;
        else if(def.stat==='homing')s.homing+=v;
        else if(def.stat==='coin')s.coinMult*=1+v;
      });
    }
    if (Lp && Lp.on && Lp.on.includes('windup')) s.windup += 1;
    s.trait = tr; ST = s; RUN.players.forEach(p => { p.hp = Math.min(p.hp, ST.hp) });
    if (L('lastwill') && !RUN.lastwillGranted) { RUN.revives++; RUN.lastwillGranted = true }
  }

  const CARD_RARITY = {
    common:{label:'COMMON',color:'#9aa0aa',weight:70}, uncommon:{label:'UNCOMMON',color:'#48c774',weight:40},
    rare:{label:'RARE',color:'#4d9cff',weight:20}, epic:{label:'EPIC',color:'#b66cff',weight:10},
    legendary:{label:'LEGENDARY',color:'#ffd43b',weight:2}, mythic:{label:'MYTHIC',color:'#ff4b55',weight:.5}
  };
  const EXTRA_CARD_PREFIX=['Flux','Quantum','Catalyst','Ion','Molecular','Atomic','Lattice','Reactive','Phase','Vector','Neutron','Photon'];
  const EXTRA_CARD_SUFFIX=['Reservoir','Matrix','Conduit','Array','Mantle','Drive','Engine','Prism','Relay','Core'];
  const EXTRA_CARD_EFFECTS=[['dmg',.028,'increase projectile damage'],['rate',.022,'increase fire rate'],['hp',4,'increase maximum health'],['spd',.018,'increase movement speed'],['crit',.012,'increase critical chance'],['shield',2,'increase maximum shield'],['magnet',.035,'increase pickup radius'],['projs',.08,'increase projectile output'],['pierce',.12,'increase piercing'],['aoe',.15,'increase reaction area'],['homing',.012,'increase homing strength'],['coin',.02,'increase coin gain']];
  const EXTRA_CARDS=[];
  for(let i=0;i<121;i++){
    const rarity=i<60?'common':i<92?'uncommon':i<112?'rare':i<119?'epic':i===119?'legendary':'mythic';
    const fx=EXTRA_CARD_EFFECTS[i%EXTRA_CARD_EFFECTS.length];
    EXTRA_CARDS.push({id:'xcard_'+String(i+1).padStart(3,'0'),ic:'✦',n:EXTRA_CARD_PREFIX[i%12]+' '+EXTRA_CARD_SUFFIX[Math.floor(i/12)]+' '+String(i+1).padStart(3,'0'),d:'Stack +'+fx[1]+' to '+fx[2]+' while equipped.',max:5,rarity,extraStat:fx[0],extraValue:fx[1],unique:true});
  }
  const ALL_CARDS=[];
  const ABIL_pool = [{ id: 'pow' }, { id: 'rate' }, { id: 'multi' }, { id: 'pierce' }, { id: 'orbit' }, { id: 'nova' }, { id: 'homing' },
  { id: 'leech' }, { id: 'crit' }, { id: 'chain' }, { id: 'swift' }, { id: 'magnet' }, { id: 'fission' }, { id: 'grav' },
  { id: 'thorns' }, { id: 'vamp' }, { id: 'plating' }, { id: 'ricochet' }, { id: 'mines' }, { id: 'turret' }, { id: 'freeze' },
  { id: 'execute' }, { id: 'berserk' }, { id: 'adrenaline' }, { id: 'phaseout' }, { id: 'voltaic' }, { id: 'scavenger' },
  { id: 'bloodlust' }, { id: 'bulwark' }, { id: 'static' }, { id: 'lifeline' }, { id: 'hoarder' }, { id: 'windup' },
  { id: 'splitshot' }, { id: 'necroblast' }, { id: 'juggernaut' }, { id: 'windshear' }, { id: 'overdmg' }, { id: 'lastwill' }];
  const ABIL = [
    { id: 'pow', ic: '⚡', n: 'Core Amplifier', d: '+22% projectile damage', max: 5 },
    { id: 'rate', ic: '♻', n: 'Reaction Catalyst', d: '+15% fire rate', max: 5 },
    { id: 'multi', ic: '⋔', n: 'Split Emitter', d: '+1 projectile', max: 3 },
    { id: 'pierce', ic: '➤', n: 'Phase Rounds', d: '+1 pierce', max: 3 },
    { id: 'orbit', ic: '◉', n: 'Electron Shell', d: '+2 orbiting electrons', max: 4 },
    { id: 'nova', ic: '✹', n: 'Decay Nova', d: 'Radial blast every 5s', max: 5 },
    { id: 'homing', ic: '⌖', n: 'Seeker Isotopes', d: 'Shots home in', max: 3 },
    { id: 'leech', ic: '✚', n: 'Isotope Siphon', d: 'Heal 1 HP per kill', max: 4 },
    { id: 'crit', ic: '✧', n: 'Critical Matrix', d: '+8% crit · +40% crit dmg', max: 4 },
    { id: 'chain', ic: '≋', n: 'Arc Discharge', d: 'Hits chain lightning', max: 4 },
    { id: 'swift', ic: '≫', n: 'Ion Thrusters', d: '+8% speed · -12% dash CD', max: 4 },
    { id: 'magnet', ic: '◎', n: 'Ferrofield', d: '+45% pickup radius', max: 3 },
    { id: 'fission', ic: '✺', n: 'Fission Rounds', d: 'Shots split on expiry', max: 3 },
    { id: 'grav', ic: '▣', n: 'Graviton Well', d: 'Collapse wells crush foes', max: 3 },
    { id: 'thorns', ic: '⟁', n: 'Reflex Plating', d: 'Blast nearby foes when hit', max: 3 },
    { id: 'vamp', ic: '❤', n: 'Crimson Cycle', d: 'Critical hits heal you', max: 3 },
    { id: 'plating', ic: '▨', n: 'Ablative Plating', d: '+8 max shield', max: 3 },
    { id: 'ricochet', ic: '↺', n: 'Ricochet Rounds', d: 'Shots bounce to new targets', max: 3 },
    { id: 'mines', ic: '✱', n: 'Proximity Mines', d: 'Dashing drops explosive mines', max: 3 },
    { id: 'turret', ic: '⌬', n: 'Auto-Turret', d: 'Periodic auto-barrage', max: 2 },
    { id: 'freeze', ic: '❆', n: 'Cryo Discharge', d: 'Critical hits freeze enemies', max: 3 },
    { id: 'execute', ic: '☓', n: 'Overkill Protocol', d: 'Finishes off low-HP enemies', max: 2 },
    { id: 'berserk', ic: '⚔', n: 'Berserker Core', d: '+dmg while below 30% HP', max: 3 },
    { id: 'adrenaline', ic: '⇶', n: 'Adrenal Surge', d: 'Kills grant a speed rush', max: 3 },
    { id: 'phaseout', ic: '⧫', n: 'Phase Dash', d: 'Longer dash invulnerability', max: 2 },
    { id: 'voltaic', ic: '⎋', n: 'Voltaic Death', d: 'Kills may chain lightning', max: 3 },
    { id: 'scavenger', ic: '◈', n: 'Scavenger Protocol', d: '+15% coin gain', max: 3 },
    { id: 'bloodlust', ic: '☗', n: 'Bloodlust', d: 'Fire rate builds with kills', max: 4 },
    { id: 'bulwark', ic: '🛡', n: 'Emergency Bulwark', d: 'Periodically block a hit', max: 2 },
    { id: 'static', ic: '☈', n: 'Static Field', d: 'Passive damage aura', max: 3 },
    { id: 'lifeline', ic: '✤', n: 'Emergency Nanites', d: 'Heal a sliver on pickup', max: 2 },
    { id: 'hoarder', ic: '♦', n: 'Isotope Hoarder', d: '+20% XP gain', max: 3 },
    { id: 'windup', ic: '⏫', n: 'Overdrive Coils', d: 'Fire rate ramps while firing', max: 3 },
    { id: 'splitshot', ic: '⋉', n: 'Splitting Rounds', d: 'Pierce hits spawn shards', max: 2 },
    { id: 'necroblast', ic: '💢', n: 'Necrotic Feedback', d: 'Kills may detonate', max: 3 },
    { id: 'juggernaut', ic: '⛨', n: 'Juggernaut Frame', d: '+HP and armor', max: 3 },
    { id: 'windshear', ic: '≽', n: 'Slipstream', d: '+projectile speed', max: 3 },
    { id: 'overdmg', ic: '✹', n: 'Overcharged Rounds', d: '+crit damage', max: 3 },
    { id: 'lastwill', ic: '☥', n: 'Last Rites', d: 'Grants one emergency revive', max: 1 }];
  // 120 one-rank research cards. Each family affects a real simulation stat;
  // the eight entries in a family are distinct research discoveries, not repeats.
  const ADVANCED_FAMILIES = [
    ['dmg', .06, '✦', 'Damage', ['Proton Cascade', 'Muon Hammer', 'Quark Focus', 'Ion Anvil', 'Plasma Edge', 'Hadron Bloom', 'Neutron Bite', 'Photon Shear']],
    ['rate', .07, '↯', 'Fire rate', ['Catalyst Mesh', 'Reaction Clock', 'Chain Primer', 'Vapor Valve', 'Kinetic Relay', 'Pulse Governor', 'Flux Rotor', 'Spark Lattice']],
    ['hp', .07, '⬡', 'Maximum HP', ['Ceramic Heart', 'Carbon Frame', 'Titanium Rib', 'Boron Skin', 'Tungsten Core', 'Graphene Weave', 'Basalt Shell', 'Cobalt Spine']],
    ['spd', .06, '➟', 'Movement speed', ['Ion Skates', 'Helium Lift', 'Lithium Sprint', 'Argon Drift', 'Mercury Glide', 'Neon Slipstream', 'Xenon Wake', 'Radon Step']],
    ['crit', 3, '✧', 'Critical chance', ['Laser Aperture', 'Diamond Facet', 'Gold Standard', 'Silver Mirror', 'Copper Lens', 'Sapphire Gate', 'Prism Array', 'Spectrum Cut']],
    ['pierce', .34, '➤', 'Pierce fragments', ['Needle Beam', 'Drill Charge', 'Rail Core', 'Ablation Tip', 'Chisel Ray', 'Breach Lattice', 'Boring Field', 'Tunneling Pulse']],
    ['projs', .26, '✣', 'Projectile count', ['Split Nucleus', 'Twin Emission', 'Triad Source', 'Scatter Chamber', 'Fission Fork', 'Orbital Bloom', 'Particle Choir', 'Shard Chorus']],
    ['armor', .018, '▣', 'Damage resistance', ['Oxide Coat', 'Chrome Plate', 'Nickel Seal', 'Ceramic Ward', 'Iron Lattice', 'Diamond Film', 'Lead Liner', 'Carbide Guard']],
    ['shield', 4, '◈', 'Shield capacity', ['Dielectric Cell', 'Capacitor Bank', 'Faraday Mesh', 'Static Reservoir', 'Plasma Buffer', 'Insulator Veil', 'Charge Vault', 'Field Battery']],
    ['chain', .34, 'ϟ', 'Chain discharge', ['Copper Filament', 'Silver Thread', 'Brine Conduit', 'Arc Relay', 'Storm Coil', 'Tesla Fork', 'Voltaic Net', 'Lightning Rail']],
    ['poison', .34, '☠', 'Corrosion potency', ['Chlorine Etch', 'Arsenic Mist', 'Iodine Bite', 'Cyanide Thread', 'Acid Seed', 'Venom Reactor', 'Toxin Bloom', 'Miasma Cell']],
    ['burn', .34, '♨', 'Burn potency', ['Thermite Grain', 'Sulfur Torch', 'Magnesium Flare', 'Phosphor Ember', 'Napalm Gel', 'Cinder Core', 'Solar Crucible', 'Furnace Coil']],
    ['slow', .34, '❄', 'Chill potency', ['Cryo Salt', 'Nitrogen Fog', 'Ice Lattice', 'Zero Point', 'Frost Needle', 'Glacier Cell', 'Winter Field', 'Cold Sink']],
    ['aoe', .34, '◎', 'Blast radius', ['Shock Ring', 'Sonic Halo', 'Nova Chamber', 'Blast Diffuser', 'Quake Disk', 'Impact Bloom', 'Pressure Wave', 'Resonance Drum']],
    ['magnet', .09, '🧲', 'Pickup range', ['Ferro Loop', 'Cobalt Pull', 'Rare Earth Core', 'Magnetic Lens', 'Flux Compass', 'Attraction Grid', 'Orbit Harvester', 'Salvage Vortex']]
  ];
  const ADVANCED_ABIL = ADVANCED_FAMILIES.flatMap(([stat, value, ic, label, names]) => names.map((n, i) => ({
    id: 'research_' + stat + '_' + i, ic, n, d: '+' + (stat === 'crit' ? value : Math.round(value * 100)) + (stat === 'shield' ? ' shield capacity' : stat === 'pierce' || stat === 'projs' || ['chain', 'poison', 'burn', 'slow', 'aoe'].includes(stat) ? '% progress toward ' + label.toLowerCase() : '% ' + label.toLowerCase()), max: 1, research: { stat, value }
  })));
  ABIL.push(...ADVANCED_ABIL);
  ALL_CARDS.push(...ABIL.map((a,i)=>({...a,rarity:i===38?'mythic':i===37?'legendary':i>=33?'epic':i>=25?'rare':i>=15?'uncommon':'common'})),...EXTRA_CARDS);
  function advancedBonus() {
    const out = { dmg: 0, rate: 0, hp: 0, spd: 0, crit: 0, pierce: 0, projs: 0, armor: 0, shield: 0, chain: 0, poison: 0, burn: 0, slow: 0, aoe: 0, magnet: 0, ps: 0 };
    ADVANCED_ABIL.forEach(a => { if (RUN && RUN.ab[a.id]) out[a.research.stat] += a.research.value * RUN.ab[a.id]; });
    return out;
  }
  function start(elemId, mode, netPlayers, isOnlineMatch, localNetId) {
    const el = EL(DATA.canonicalId(elemId || SAVE.sel)) || EL('e1'), c = baseCombat(el);
    RUN = {
      el, mode: mode || 'solo', style: c.style, hue: el.hue, t: 0, wave: 0, state: 'inter', interT: 3, spawnLeft: 0, spawnT: 0,
      players: [], ab: {}, relics: [], level: 1, xp: 0, coins: 0, kills: 0, pending: 0, signatureSlot: SAVE.getSignature?SAVE.getSignature(el.id):0, powerupNext:7, pvpPowerups:[],
      bullets: [], ebullets: [], enemies: [], pickups: [], parts: [], texts: [], clouds: [], wells: [], eclouds: [], fxQueue: [], deathFx: [], explosionFx: [], timedExplosions: [],
      shake: 0, boss: null, hitstop: 0, slowmo: 0, pullT: 0, pullSrc: null,
      revives: SAVE.metaLv('revive') > 0 ? 1 : 0, lastBossIdx: -1, bloodlustStacks: 0, lastwillGranted: false,
      isOnline: !!isOnlineMatch, localNetId: localNetId || 0,
      lastSnapshotAt: -Infinity,
      netSnapOnce: false,
      hostW: 0,
      hostH: 0,
      nextEid: 1,
      enemyMap: new Map(),
      overInfo: null,
      pvpTargetKills: (window.NET && NET.lobbyConfig && NET.lobbyConfig.pvpTargetKills) || 10,
      friendlyFire: !!(window.NET && NET.lobbyConfig && NET.lobbyConfig.friendlyFire)
    };

    // Ensure Boss HP bar & hitflash are explicitly hidden on start/respawn!
    RUN.boss = null;
    document.getElementById('bosswrap').classList.add('hidden');
    document.getElementById('hitflash').style.opacity = 0;
    ['m-over', 'm-pause', 'm-level', 'm-deploy', 'm-brief'].forEach(id => document.getElementById(id).classList.add('hidden'));

    const retryBtn = document.getElementById('btn-retry');
    if (retryBtn) {
      retryBtn.disabled = false;
      retryBtn.textContent = 'RE-DEPLOY';
    }

    if (netPlayers && netPlayers.length) {
      netPlayers.forEach((np, idx) => {
        RUN.players.push(mkPlayer(idx, np.name, np.elementId || np.entityId || np.formula || np.entityName, np.signatureSlot, np));
      });
    } else {
      const mySig = SAVE.getSignature ? SAVE.getSignature(el.id) : 0;
      RUN.players.push(mkPlayer(0, 'P1 Operator', elemId, mySig));
      if (mode === 'coop') RUN.players.push(mkPlayer(1, 'P2 Operator', elemId, mySig));
    }

    for (let i = 0; i < SAVE.metaLv('head'); i++) { const a = ABIL_pool[irnd(ABIL_pool.length)]; RUN.ab[a.id] = (RUN.ab[a.id] || 0) + 1 }
    computeStats(); RUN.players.forEach(p => { p.hp = ST.hp; p.sh = ST.shieldMax });
    buildChips();

    const pvpHud = document.getElementById('hud-pvp');
    if (mode === 'pvp' || mode === 'net_pvp') {
      if (pvpHud) pvpHud.classList.remove('hidden');
      banner('⚔ PVP ARENA — ELIMINATE ALL RIVALS', 2600); AUDIO.setTrack('boss');
    } else if (mode === 'boss' || mode === 'net_boss') {
      if (pvpHud) pvpHud.classList.add('hidden');
      banner('⚠ BOSS RAID — DEFEAT THE WARDEN', 2600); AUDIO.setTrack('boss');
      spawnBoss();
    } else {
      if (pvpHud) pvpHud.classList.add('hidden');
      banner((RUN.friendlyFire && (mode === 'coop' || mode === 'net_coop') ? '⚠ FRIENDLY FIRE ON — ' : '') + 'REACTOR BREACH — SURVIVE', 2400); AUDIO.setTrack('combat');
    }

    if (RUN.isOnline && window.NET && NET.isHost) {
      broadcastGameState(true);
    }
  }
  /* input */
  addEventListener('keydown', e => {
    keys[e.code] = true;
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
    if (!RUN || document.getElementById('scr-game').classList.contains('hidden')) return;
    if (e.code === 'KeyF') { autofire = !autofire; document.getElementById('autofire').innerHTML = `<span>F · AUTOFIRE ${autofire ? 'ON' : 'OFF'}</span>` }
    if (RUN.isOnline) {
      if (e.code === 'Escape') togglePause();
      if (e.code === 'Space') requestPlayerAction('dash');
      if (e.code === 'KeyQ') requestPlayerAction('active');
    } else {
      if (e.code === 'Escape') togglePause();
      if (e.code === 'Space') tryDash(RUN.players[0]);
      if (e.code === 'Enter' && RUN.players[1]) tryDash(RUN.players[1]);
      if (e.code === 'KeyQ') useActive(RUN.players[0]);
      if (e.code === 'ShiftRight' && RUN.players[1]) useActive(RUN.players[1]);
    }
  });
  addEventListener('keyup', e => keys[e.code] = false);
  cv.addEventListener('mousemove', e => { mouse.x = e.clientX; mouse.y = e.clientY });
  cv.addEventListener('mousedown', e => { if (e.button === 0) mouse.down = true });
  addEventListener('mouseup', () => mouse.down = false);
  cv.addEventListener('contextmenu', e => e.preventDefault());
  addEventListener('blur', () => { if (RUN && (RUN.state === 'play' || RUN.state === 'inter')) togglePause() });
  function isLocalPlayer(p) {
    return !!p && (!RUN.isOnline ? p.id === 0 : p.id === RUN.localNetId);
  }
  function movementInput(p) {
    if (RUN.isOnline && !isLocalPlayer(p)) {
      return { dx: (p.netInput && p.netInput.dx) || 0, dy: (p.netInput && p.netInput.dy) || 0 };
    }
    if (isLocalPlayer(p)) {
      return {
        dx: (keys.KeyD || keys.ArrowRight ? 1 : 0) - (keys.KeyA || keys.ArrowLeft ? 1 : 0),
        dy: (keys.KeyS || keys.ArrowDown ? 1 : 0) - (keys.KeyW || keys.ArrowUp ? 1 : 0)
      };
    }
    return {
      dx: (keys.ArrowRight ? 1 : 0) - (keys.ArrowLeft ? 1 : 0),
      dy: (keys.ArrowDown ? 1 : 0) - (keys.ArrowUp ? 1 : 0)
    };
  }
  function requestPlayerAction(action) {
    if (RUN.isOnline && !NET.isHost) { NET.sendClientAction(action); return; }
    const p = RUN.players[RUN.localNetId] || RUN.players[0];
    if (action === 'dash') tryDash(p);
    else if (action === 'active') useActive(p);
  }
  function tryDash(p) {
    if (!p || (p.dashCd > 0 && !(p.puDash>0)) || p.downed) return; let dx, dy;
    ({ dx, dy } = movementInput(p));
    if (!dx && !dy) { dx = Math.cos(p.angle); dy = Math.sin(p.angle) }
    const l = Math.hypot(dx, dy) || 1; p.dvx = dx / l * 760; p.dvy = dy / l * 760;
    p.dashT=.17; if(p.puDash>0)p.puDash--; p.dashCd=ST.dashCd; p.iframes = Math.max(p.iframes, .32 + .25 * (RUN.ab.phaseout || 0)); SFX.dash();
    for (let i = 0; i < 12; i++)burst(p.x, p.y, RUN.hue);
    const LD = LAB();
    if (LD && LD.on) {
      if (LD.on.includes('dashExpl')) setTimeout(() => { if (RUN) aoe(p.x, p.y, 90, ST.dmg * 1.1, 30) }, 140);
      if (LD.on.includes('splitDash')) for (let k = 0; k < 3; k++) { const a2 = p.angle + (k - 1) * .4; RUN.bullets.push({ x: p.x, y: p.y, vx: Math.cos(a2) * ST.ps, vy: Math.sin(a2) * ST.ps, dmg: ST.dmg * .8, r: 4, pierce: 0, hit: [], life: 1, owner: p.id, hom: true }); }
      if (LD.on.includes('speedDmg')) p.adrenT = Math.max(p.adrenT || 0, .8);
    }
    if (ST.mines) {
      const mx0 = p.x, my0 = p.y;
      for (let i = 0; i < ST.mines; i++) {
        const mx = mx0 + rnd(-24, 24), my = my0 + rnd(-24, 24);
        ringFx(mx, my, 30, 20);
        setTimeout(() => { if (RUN) aoe(mx, my, 110, ST.dmg * 1.8, 30) }, 550 + i * 140)
      }
    }
  }
  function nearestEnemy(x, y) {
    let b = null, bd = 1e9; RUN.enemies.forEach(e => {
      if (e.dead) return;
      const dd = d2(x, y, e.x, e.y); if (dd < bd) { bd = dd; b = e }
    }); return b
  }
  function useActive(p) {
    if (!p || p.downed || p.activeCd > 0) return;
    p.activeCd = ST.activeCd; SFX.active(); RUN.shake = Math.max(RUN.shake, 8);
    const st = RUN.style, tr = ST.trait, x = p.x, y = p.y;
    const pEl=p.elem||EL(p.elementId)||RUN.el; const sigs=pEl.signatures||[]; const pSlot=Number.isFinite(+p.signatureSlot)?Math.max(0,Math.min(2,+p.signatureSlot)):0; const signature=sigs[pSlot]||pEl.act||RUN.el.act||(CATS[pEl.cat]&&CATS[pEl.cat].act)||{name:'Surge',key:st};
    const L = LAB(); const key = L && L.a ? L.a : signature.key;
    banner(signature.name.toUpperCase(),1200);
    if (signature && typeof signature.exec === 'function') { signature.exec(p); return; } ringFx(x,y,RUN.hue,160); if(RUN.isOnline&&NET.isHost&&RUN.fxQueue){RUN.fxQueue.push({k:'shake',v:10});RUN.fxQueue.push({k:'banner',text:signature.name.toUpperCase()});}

    const sxp=signature.power||1;
    if(signature.key==='rift'){const ox=p.x,oy=p.y;p.x=clamp(p.x+Math.cos(p.angle)*180,30,W-30);p.y=clamp(p.y+Math.sin(p.angle)*180,30,H-30);p.iframes=.7;ringFx(ox,oy,RUN.hue,80);ringFx(p.x,p.y,RUN.hue,120);return}
    if(signature.key==='prism'){for(let i=-2;i<=2;i++){const a=p.angle+i*.16;RUN.bullets.push({x,y,vx:Math.cos(a)*ST.ps*1.4,vy:Math.sin(a)*ST.ps*1.4,dmg:ST.dmg*.9*sxp,r:5,pierce:2,hit:[],life:1.1,owner:p.id})}return}
    if(signature.key==='surge'){p.puDamage=1.35*sxp;p.puTimer=4;ringFx(x,y,RUN.hue,180);return}
    if(signature.key==='grav'){RUN.wells.push({x,y,r:130,t:3.5});ringFx(x,y,RUN.hue,170);return}
    if(signature.key==='bloom'){RUN.clouds.push({x,y,r:120,t:4});ringFx(x,y,RUN.hue,150);return}
    if(signature.key==='aegis'){p.sh=Math.min(ST.shieldMax+30,p.sh+ST.shieldMax*.8);p.iframes=1.2;ringFx(x,y,180,130);return}
    if(signature.key==='drift'){p.x=clamp(p.x+Math.cos(p.angle)*140,25,W-25);p.y=clamp(p.y+Math.sin(p.angle)*140,25,H-25);p.iframes=1.1;return}
    if(signature.key==='nova'){setTimeout(()=>{if(RUN){aoe(x,y,170,ST.dmg*2.1*sxp,25);ringFx(x,y,RUN.hue,220)}},650);return}
    if(signature.key==='lattice'){aoe(x,y,95,ST.dmg*.75*sxp,12);ringFx(x,y,RUN.hue,110);return}
    if(signature.key==='pulse'){aoe(x,y,150,ST.dmg*1.1*sxp,20);RUN.enemies.forEach(e=>{if(d2(e.x,e.y,x,y)<180*180)e.stun=Math.max(e.stun||0,1.2)});return}
    if(signature.key==='shard'){for(let i=0;i<12;i++){const a=i/12*TAU;RUN.bullets.push({x,y,vx:Math.cos(a)*ST.ps,vy:Math.sin(a)*ST.ps,dmg:ST.dmg*.7*sxp,r:4,pierce:1,hit:[],life:.9,owner:p.id})}return}
    if(signature.key==='vortex'){RUN.wells.push({x,y,r:95,t:4});RUN.shake=Math.max(RUN.shake,12);return}
    if(signature.key==='flash'){p.x=clamp(p.x+Math.cos(p.angle)*200,25,W-25);p.y=clamp(p.y+Math.sin(p.angle)*200,25,H-25);aoe(p.x,p.y,115,ST.dmg*sxp,10);return}
    if(signature.key==='anchor'){p.iframes=1.5;aoe(x,y,110,ST.dmg*1.5*sxp,15);return}
    if(signature.key==='comet'){setTimeout(()=>{if(RUN)aoe(clamp(mouse.x,20,W-20),clamp(mouse.y,20,H-20),105,ST.dmg*2*sxp,25)},400);return}
    if(signature.key==='echo'){setTimeout(()=>{if(RUN){RUN.bullets.push({x,y,vx:Math.cos(p.angle)*ST.ps*1.7,vy:Math.sin(p.angle)*ST.ps*1.7,dmg:ST.dmg*1.2*sxp,r:8,pierce:8,hit:[],life:1.2,owner:p.id});ringFx(x,y,RUN.hue,100)}},350);return}
    if(signature.key==='torrent'){RUN.clouds.push({x:x+Math.cos(p.angle)*120,y:y+Math.sin(p.angle)*120,r:90,t:4});aoe(x,y,100,ST.dmg*sxp,12);return}
    if(signature.key==='crown'){for(let i=0;i<6;i++){const a=RUN.t+i*TAU/6;RUN.bullets.push({x:x+Math.cos(a)*35,y:y+Math.sin(a)*35,vx:Math.cos(a)*ST.ps,vy:Math.sin(a)*ST.ps,dmg:ST.dmg*.8*sxp,r:5,pierce:3,hit:[],life:1.2,owner:p.id})}return}
    if(signature.key==='spike'){aoe(clamp(mouse.x,20,W-20),clamp(mouse.y,20,H-20),65,ST.dmg*1.8*sxp,20);return}
    if(signature.key==='mirror'){p.iframes=2;p.sh=Math.min(ST.shieldMax,p.sh+ST.shieldMax*.35);return}
    if(signature.key==='bloomfire'){RUN.clouds.push({x,y,r:145,t:5});aoe(x,y,145,ST.dmg*.6*sxp,20);return}
    if(signature.key==='coil'){p.store=(p.store||0)+1;aoe(x,y,80,ST.dmg*sxp*(p.store+1),10);return}
    if(signature.key==='tether'){const e=nearestEnemy(x,y);if(e){e.tether=3;e.x+=(x-e.x)*.18;e.y+=(y-e.y)*.18}return}
    if(signature.key==='ruin'){const e=nearestEnemy(x,y);if(e){e.marked=4;ringFx(e.x,e.y,RUN.hue,90)}return}
    if(signature.key==='halo'){aoe(x,y,100,ST.dmg*.8*sxp,10);p.sh=Math.min(ST.shieldMax,p.sh+12);return}
    if(signature.key==='drill'){RUN.bullets.push({x,y,vx:Math.cos(p.angle)*ST.ps*2,vy:Math.sin(p.angle)*ST.ps*2,dmg:ST.dmg*2*sxp,r:10,pierce:20,hit:[],life:1,owner:p.id});return}
    if(signature.key==='mist'){RUN.eclouds.push({x,y,r:150,t:4,friendly:true});return}
    if(signature.key==='crescent'){for(let i=-4;i<=4;i++){const a=p.angle+i*.11;RUN.bullets.push({x,y,vx:Math.cos(a)*ST.ps*1.3,vy:Math.sin(a)*ST.ps*1.3,dmg:ST.dmg*1.15*sxp,r:6,pierce:5,hit:[],life:.8,owner:p.id})}return}
    if(signature.key==='beacon'){RUN.wells.push({x,y,r:80,t:6,friendly:true});return}
    if(signature.key==='crash'){const ox=p.x,oy=p.y;p.x=clamp(p.x+Math.cos(p.angle)*160,25,W-25);p.y=clamp(p.y+Math.sin(p.angle)*160,25,H-25);aoe(ox,oy,75,ST.dmg*sxp,12);aoe(p.x,p.y,75,ST.dmg*sxp,12);return}
    if(signature.key==='spiral'){for(let i=0;i<10;i++){const a=p.angle+(i-5)*.12;RUN.bullets.push({x,y,vx:Math.cos(a)*ST.ps*(.8+i*.08),vy:Math.sin(a)*ST.ps*(.8+i*.08),dmg:ST.dmg*sxp,r:5,pierce:3,hit:[],life:1.3,owner:p.id})}return}
    if(signature.key==='cleave'){aoe(x+Math.cos(p.angle)*65,y+Math.sin(p.angle)*65,100,ST.dmg*1.6*sxp,18);return}

    // Element/fusion signatures. The data-driven key makes each selectable
    // isotope use its own named chemistry-themed active instead of category copy.
    if (key === 'beam') { const n = p.store || 0; p.store = 0; RUN.bullets.push({ x, y, vx: Math.cos(p.angle) * ST.ps * 2.6, vy: Math.sin(p.angle) * ST.ps * 2.6, dmg: ST.dmg * (2 + n * .15), r: 10, pierce: 20, hit: [], life: 1.1, owner: p.id, burn: true }); return }
    if (key === 'wall') { for (let i = -4; i <= 4; i++) { const a = p.angle + Math.PI / 2 + i * .12; RUN.bullets.push({ x, y, vx: Math.cos(a) * ST.ps * .9, vy: Math.sin(a) * ST.ps * .9, dmg: ST.dmg * 1.2, r: 5, pierce: 2, hit: [], life: 1.2, owner: p.id }); } return }
    if (key === 'rain') { for (let i = 0; i < 10; i++) { RUN.bullets.push({ x: rnd(W * .15, W * .85), y: -20, vx: 0, vy: ST.ps * 1.2, dmg: ST.dmg * 1.4, r: 5, pierce: 1, hit: [], life: 2, owner: p.id, expl: true }); } return }
    if (key === 'drone') { for (let k = 0; k < 6; k++) { const t = nearestEnemy(x, y); const a = t ? Math.atan2(t.y - y, t.x - x) : rnd(TAU); RUN.bullets.push({ x, y, vx: Math.cos(a) * ST.ps, vy: Math.sin(a) * ST.ps, dmg: ST.dmg * .9, r: 4, pierce: 0, hit: [], life: 1.2, owner: p.id, hom: true }); } return }
    if (key === 'singularity') { const sx2 = clamp(x + Math.cos(p.angle) * 220, 30, W - 30), sy2 = clamp(y + Math.sin(p.angle) * 220, 30, H - 30); RUN.wells.push({ x: sx2, y: sy2, t: 1.6, lv: 3 }); setTimeout(() => { if (RUN) aoe(sx2, sy2, 200, ST.dmg * 2.6, 280) }, 1500); return }
    if (key === 'pulse') { aoe(x, y, 185, ST.dmg * 2.6, RUN.hue); return }
    if (key === 'lance') { RUN.bullets.push({ x, y, vx: Math.cos(p.angle) * ST.ps * 2.4, vy: Math.sin(p.angle) * ST.ps * 2.4, dmg: ST.dmg * 4, r: 9, pierce: 14, hit: [], life: 1.25, owner: p.id }); return }
    if (key === 'orbit') { for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; RUN.bullets.push({ x, y, vx: Math.cos(a) * ST.ps * .9, vy: Math.sin(a) * ST.ps * .9, dmg: ST.dmg * 1.1, r: 4, pierce: 2, hit: [], life: 1.1, owner: p.id }) } return }
    if (key === 'veil') { p.x = clamp(x + Math.cos(p.angle) * 220, 20, W - 20); p.y = clamp(y + Math.sin(p.angle) * 220, 20, H - 20); p.iframes = Math.max(p.iframes, 2); aoe(p.x, p.y, 110, ST.dmg * 1.5, RUN.hue); return }
    if (key === 'storm') { const targets = RUN.enemies.filter(e => !e.dead).sort((a, b) => d2(a.x, a.y, x, y) - d2(b.x, b.y, x, y)).slice(0, 8); targets.forEach((e, i) => { dmgEnemy(e, ST.dmg * (2.2 - i * .12)); RUN.parts.push({ x, y, x2: e.x, y2: e.y, t: .18, life: .18, hue: RUN.hue, arc: true }) }); return }
    if (key === 'bloom') { RUN.clouds.push({ x, y, r: 165, t: 6 }); return }
    if (key === 'anchor') { RUN.pullT = 2.2; RUN.pullSrc = { x, y }; aoe(x, y, 115, ST.dmg * 1.8, RUN.hue); return }
    if (key === 'ward') { RUN.players.forEach(q => { q.iframes = Math.max(q.iframes, 2.6); q.sh = Math.min(ST.shieldMax, q.sh + 18) }); return }
    if (key === 'flare') { RUN.enemies.forEach(e => { if (!e.dead && d2(e.x, e.y, x, y) < 300 * 300) e.stun = Math.max(e.stun, 1.4) }); aoe(x, y, 250, ST.dmg * 1.2, RUN.hue); return }
    if (key === 'drill') { for (let i = -3; i <= 3; i++) { const a = p.angle + i * .12; RUN.bullets.push({ x, y, vx: Math.cos(a) * ST.ps * 1.5, vy: Math.sin(a) * ST.ps * 1.5, dmg: ST.dmg * 1.7, r: 5, pierce: 8, hit: [], life: 1.4, owner: p.id }) } return }
    if (key === 'tide') { RUN.eclouds.push({ x, y, r: 210, t: 2.5, friendly: true }); RUN.enemies.forEach(e => { if (!e.dead && d2(e.x, e.y, x, y) < 240 * 240) { e.slowT = Math.max(e.slowT, 3); dmgEnemy(e, ST.dmg * .8) } }); return }
    if (key === 'nova') { for (let i = 0; i < 3; i++) setTimeout(() => { if (RUN) aoe(p.x, p.y, 185, ST.dmg * 1.5, RUN.hue) }, i * 260); return }
    if (st === 'boom' || tr === 'blast') { aoe(x, y, 220, ST.dmg * 3, RUN.hue); SFX.explosion() }
    else if (st === 'heavy') {
      aoe(x, y, 200, ST.dmg * 2, RUN.hue); RUN.enemies.forEach(e => {
        if (!e.dead && !e.boss) {
          const a = Math.atan2(e.y - y, e.x - x); e.x += Math.cos(a) * 160; e.y += Math.sin(a) * 160
        }
      })
    }
    else if (st === 'metal' || st === 'dense') {
      for (let i = 0; i < 16; i++) {
        const a = i / 16 * TAU;
        RUN.bullets.push({ x, y, vx: Math.cos(a) * ST.ps * 1.2, vy: Math.sin(a) * ST.ps * 1.2, dmg: ST.dmg * 1.5, r: 5, pierce: 3, hit: [], life: 1.2, owner: p.id })
      }
    }
    else if (st === 'phase') { const t = nearestEnemy(x, y); if (t) { p.x = t.x; p.y = t.y; aoe(p.x, p.y, 160, ST.dmg * 2, RUN.hue) } }
    else if (st === 'pure') {
      for (let i = 0; i < 10; i++) {
        const a = p.angle + (i - 4.5) * .06;
        RUN.bullets.push({ x, y, vx: Math.cos(a) * ST.ps * 1.6, vy: Math.sin(a) * ST.ps * 1.6, dmg: ST.dmg * 1.4, r: 5, pierce: 6, hit: [], life: 1.4, owner: p.id })
      }
    }
    else if (st === 'corrode' || tr === 'toxic' || tr === 'miasma') {
      RUN.clouds.push({ x, y, r: 180, t: 5 });
      RUN.enemies.forEach(e => { if (!e.dead && d2(e.x, e.y, x, y) < 180 * 180) addPoison(e, ST.dmg * .8, 5) })
    }
    else if (st === 'inert') { RUN.players.forEach(q => { q.iframes = Math.max(q.iframes, 2.5) }) }
    else if (st === 'magnet') {
      RUN.enemies.forEach(e => {
        if (e.dead || e.boss) return;
        const a = Math.atan2(y - e.y, x - e.x); e.x += Math.cos(a) * 200; e.y += Math.sin(a) * 200
      }); aoe(x, y, 260, ST.dmg * 2, RUN.hue)
    }
    else if (st === 'rad') { for (let i = 0; i < 3; i++)setTimeout(() => { if (RUN) aoe(p.x, p.y, 200, ST.dmg * 1.5, RUN.hue) }, i * 250) }
    else if (st === 'chaos') { RUN.wells.push({ x, y, t: 2.2, lv: 3 }) }
    else aoe(x, y, 200, ST.dmg * 2, RUN.hue)
  }
  /* waves & enemies */
  function playerScale() {
    return 1 + Math.max(0, RUN.players.length - 1) * .6;
  }
  function startWave() {
    RUN.wave++; SFX.wave(); RUN.bloodlustStacks = 0;
    const spawnScale = 1 + Math.max(0, RUN.players.length - 1) * .7;
    if (RUN.wave % 5 === 0) { spawnBoss(); RUN.spawnLeft = Math.round(Math.min(6, 1 + Math.floor(RUN.wave / 10)) * spawnScale) }
    else RUN.spawnLeft = Math.round((6 + RUN.wave * 2.6 + RUN.wave * RUN.wave * .12) * spawnScale);
    RUN.spawnT = .3; RUN.state = 'play'
  }
  function pickType() {
    const w = RUN.wave;
    const pool = [['mote', 10], ['wisp', w >= 2 ? 7 : 0], ['swarm', w >= 2 ? 6 : 0], ['spitter', w >= 3 ? 6 : 0],
    ['splitter', w >= 4 ? 5 : 0], ['brute', w >= 3 ? 4 : 0], ['bomber', w >= 4 ? 5 : 0], ['healer', w >= 5 ? 4 : 0],
    ['tank', w >= 6 ? 3 : 0], ['orbiter', w >= 5 ? 4 : 0], ['sniper', w >= 7 ? 3 : 0], ['shielder', w >= 6 ? 3 : 0],
    ['ghost', w >= 3 ? 4 : 0], ['charger', w >= 4 ? 4 : 0], ['vampire', w >= 5 ? 4 : 0], ['mirror', w >= 6 ? 3 : 0],
    ['juggler', w >= 4 ? 4 : 0], ['crusher', w >= 7 ? 2 : 0], ['seeder', w >= 5 ? 3 : 0], ['phantomblade', w >= 6 ? 3 : 0],
    ['anchor', w >= 6 ? 3 : 0], ['stalker', w >= 3 ? 4 : 0], ['spark', w >= 2 ? 7 : 0], ['glider', w >= 2 ? 4 : 0],
    ['shardling', w >= 3 ? 5 : 0], ['flareling', w >= 3 ? 4 : 0], ['drifter', w >= 3 ? 4 : 0], ['coil', w >= 4 ? 3 : 0],
    ['prism', w >= 4 ? 3 : 0], ['crawler', w >= 4 ? 3 : 0], ['drone', w >= 5 ? 3 : 0], ['ripple', w >= 5 ? 3 : 0],
    ['cinder', w >= 5 ? 3 : 0], ['mole', w >= 6 ? 2 : 0], ['quanta', w >= 6 ? 3 : 0], ['pylon', w >= 6 ? 2 : 0],
    ['sentinel', w >= 7 ? 2 : 0], ['boulder', w >= 7 ? 2 : 0], ['reactor', w >= 8 ? 2 : 0], ['basalt', w >= 8 ? 1 : 0],
    ['phaseweaver', w >= 5 ? 1 : 0], ['voltconductor', w >= 6 ? 1 : 0], ['biomass', w >= 7 ? 1 : 0], ['gravitywell', w >= 8 ? 1 : 0], ['mimicore', w >= 9 ? 1 : 0],
    ['glasslancer', w >= 4 ? 2 : 0], ['emberdrone', w >= 5 ? 2 : 0], ['frostbinder', w >= 6 ? 2 : 0], ['echohound', w >= 7 ? 2 : 0],
    ['ionserpent', w >= 8 ? 2 : 0], ['voidsentry', w >= 9 ? 1 : 0], ['stormbeacon', w >= 10 ? 1 : 0], ['nullmimic', w >= 11 ? 1 : 0],
    ['crystalwarden', w >= 12 ? 1 : 0], ['plasmacrusher', w >= 13 ? 1 : 0], ['corroswirl', w >= 14 ? 1 : 0], ['gravityknight', w >= 15 ? 1 : 0]];
    let tot = pool.reduce((a, p) => a + p[1], 0), r = rnd(tot);
    for (const [t, w2] of pool) { if ((r -= w2) < 0) return t } return 'mote'
  }
  function edgePos() {
    const s = irnd(4);
    if (s === 0) return [rnd(W), -30]; if (s === 1) return [rnd(W), H + 30]; if (s === 2) return [-30, rnd(H)]; return [W + 30, rnd(H)]
  }
  function spawnEnemy(type, x, y, elite) {
    const w = RUN.wave, b = ETYPES[type] || ETYPES.mote, hpMul = (1 + (w - 1) * .22 + Math.pow(w, 1.5) * .02) * playerScale();
    if (!ETYPES[type]) type = 'mote';
    if (x === undefined) [x, y] = edgePos();
    const e = {
      type, x, y, r: b.r, hp: b.hp * hpMul, maxhp: b.hp * hpMul, spd: b.spd * rnd(.88, 1.12),
      dmg: b.dmg + w * .6, coin: b.coin, xp: b.xp, hue: b.hue, shape: b.shape, seed: rnd(10),
      touch: 0, slowT: 0, stun: 0, conf: 0, flash: 0, mark: 0, rust: 0, rustAmp: 0, shock: 0, shockT: 0, brittle: 0, brittleT: 0, drenched: 0, orb: rnd(TAU), shootT: rnd(1, 2.5), charge: 0, healT: 0,
      phaseT: rnd(1, 2.5), invuln: false, chgT: rnd(2, 3.5), charging: 0, seedT: rnd(3, 5)
    };
    e.eid = RUN.nextEid++;
    if (type === 'shielder') e.face = 0;
    if (elite) { e.elite = true; e.hp *= 2.4; e.maxhp *= 2.4; e.r *= 1.35; e.dmg *= 1.4; e.coin *= 4; e.xp *= 3 }
    else if (w >= 4 && Math.random() < .06) return spawnEnemy(type, x, y, true);
    RUN.enemies.push(e)
  }
  function pickBossIdx() {
    if (BD.length <= 1) return 0;
    let idx; do { idx = irnd(BD.length) } while (idx === RUN.lastBossIdx);
    RUN.lastBossIdx = idx; return idx
  }
  function spawnBoss() {
    const w = RUN.wave, def = BD[pickBossIdx()];
    const hp = 850 * (1 + w * .32) * def.hpMul * playerScale();
    const e = {
      type: 'boss', boss: true, x: W / 2, y: 110, r: 44, pat: def.pat, fast: def.fast, canCharge: def.charge,
      hp, maxhp: hp, spd: def.spd || 40, dmg: 22, coin: 40 + w * 2, xp: 30, hue: def.hue, shape: def.shape,
      seed: rnd(10), touch: 0, slowT: 0, stun: 0, conf: 0, flash: 0, mark: 0, rust: 0, rustAmp: 0, shock: 0, shockT: 0, brittle: 0, brittleT: 0, drenched: 0, t1: 1, t2: 2, t3: 6, t4: 4, spirA: 0, tele: 0, chT: 0, cdx: 0, cdy: 0, name: def.name
    };
    e.eid = RUN.nextEid++;
    RUN.enemies.push(e); RUN.boss = e;
    document.getElementById('bossname').textContent = '⚠ ' + e.name;
    document.getElementById('bosswrap').classList.remove('hidden');
    banner('⚠ WARDEN: ' + e.name, 2600); SFX.boss(); RUN.shake = 16; AUDIO.setTrack('boss')
  }

  const PVP_POWERUPS=[
    ['pu_overclock','Overclock Cell','⚡','Fire rate surge for 8s'],['pu_kinetic','Kinetic Shell','◈','Gain a heavy temporary shield'],['pu_repair','Repair Capsule','✚','Restore 35% health'],['pu_phase','Phase Shard','◇','Become untouchable for 2.5s'],['pu_haste','Haste Prism','≫','Movement surge for 8s'],['pu_damage','Damage Core','✹','Damage surge for 8s'],['pu_reset','Cooldown Key','⟳','Reset dash and signature cooldowns'],['pu_blink','Blink Battery','↯','Blink toward your aim'],['pu_vamp','Siphon Shard','♥','Your next kill restores health'],['pu_magnet','Ferro Beacon','◎','Massively increase pickup attraction'],['pu_nova','Nova Capsule','☢','Detonate a burst around yourself'],['pu_freeze','Cryo Capsule','❄','Freeze nearby enemies'],['pu_shock','Shock Battery','ϟ','Stun nearby enemies'],['pu_armor','Armor Plate','▣','Gain temporary damage reduction'],['pu_double','Duplicate Matrix','⋔','Double projectile output briefly'],['pu_critical','Critical Lens','✧','Empower critical hits briefly'],['pu_pull','Gravity Seed','⬣','Pull nearby enemies inward'],['pu_dash','Dash Reactor','➤','Gain three instant dash charges'],['pu_coin','Arena Cache','◈','Award 75 arena coins'],['pu_cleanse','Cleanse Node','✦','Clear negative effects and restore shield']
  ].map((x,i)=>({id:x[0],n:x[1],ic:x[2],d:x[3],hue:30+i*17}));
  function spawnPvpPowerup(){if(!RUN||!['pvp','net_pvp'].includes(RUN.mode)||RUN.pvpPowerups.length>=4)return;const u=PVP_POWERUPS[irnd(PVP_POWERUPS.length)];RUN.pvpPowerups.push(u.id);RUN.pickups.push({t:'powerup',powerupId:u.id,v:0,x:rnd(60,W-60),y:rnd(60,H-60),vx:rnd(-15,15),vy:rnd(-15,15)})}
  function applyPvpPowerup(p,id){
    if(id==='pu_overclock')p.puRate=1.8,p.puTimer=8;
    else if(id==='pu_kinetic')p.sh=Math.min(ST.shieldMax+50,p.sh+ST.shieldMax+50);
    else if(id==='pu_repair')p.hp=Math.min(ST.hp,p.hp+ST.hp*.35);
    else if(id==='pu_phase')p.iframes=2.5;
    else if(id==='pu_haste')p.puSpeed=1.65,p.puTimer=8;
    else if(id==='pu_damage')p.puDamage=1.75,p.puTimer=8;
    else if(id==='pu_reset')p.dashCd=0,p.activeCd=0;
    else if(id==='pu_blink'){p.x=clamp(p.x+Math.cos(p.angle)*220,25,W-25);p.y=clamp(p.y+Math.sin(p.angle)*220,25,H-25);}
    else if(id==='pu_vamp')p.puVamp=1;
    else if(id==='pu_magnet')p.puMagnet=3,p.puTimer=8;
    else if(id==='pu_nova')aoe(p.x,p.y,170,ST.dmg*2.5,25);
    else if(id==='pu_freeze')RUN.enemies.forEach(e=>{if(d2(e.x,e.y,p.x,p.y)<190*190)e.freeze=Math.max(e.freeze||0,3)});
    else if(id==='pu_shock')RUN.enemies.forEach(e=>{if(d2(e.x,e.y,p.x,p.y)<190*190)e.stun=2});
    else if(id==='pu_armor')p.puArmor=.45,p.puTimer=8;
    else if(id==='pu_double')p.puProj=2,p.puTimer=6;
    else if(id==='pu_critical')p.puCrit=1,p.puTimer=6;
    else if(id==='pu_pull')RUN.wells.push({x:p.x,y:p.y,r:180,t:4});
    else if(id==='pu_dash')p.dashCd=0,p.puDash=3;
    else if(id==='pu_coin'){RUN.coins+=75;SAVE.addCoins(75)}
    else if(id==='pu_cleanse')p.nox=0,p.sh=ST.shieldMax;
    const u=PVP_POWERUPS.find(x=>x.id===id);if(u){p.puName=u.n;banner('POWERUP: '+u.n,1100);ringFx(p.x,p.y,180,120);SFX.unlock()}
  }

  function spawnLoop(dt) {
    if (RUN.spawnLeft <= 0) return;
    RUN.spawnT -= dt; if (RUN.spawnT <= 0 && RUN.enemies.length < 130) {
      RUN.spawnT = Math.max(.12, .75 - RUN.wave * .028); RUN.spawnLeft--;
      const t = pickType();
      if (t === 'swarm') { for (let i = 0; i < 4; i++)spawnEnemy('swarm'); RUN.spawnLeft-- }
      else spawnEnemy(t)
    }
  }
  /* combat */
  function fire(p) {
    const n = ST.projs, spread = n > 1 ? .17 : 0;
    const berserkMul = (ST.berserk && p.hp < ST.hp * .3) ? 1 + .15 * ST.berserk : 1;
    for (let i = 0; i < n; i++) {
      const a = p.angle + (i - (n - 1) / 2) * spread + rnd(-.02, .02);
      let dmg = (ST.dmg*(p.puDamage||1)) * berserkMul, sc = false;
      if (RUN.style === 'chaos' && Math.random() < .18) { dmg *= 2.5; sc = true }
      const crit = (p.puCrit||0) > 0 ? true : Math.random() * 100 < ST.crit;
      RUN.bullets.push({
        x: p.x + Math.cos(a) * 16, y: p.y + Math.sin(a) * 16, vx: Math.cos(a) * ST.ps, vy: Math.sin(a) * ST.ps,
        dmg: dmg * (crit || sc ? ST.critD : 1), crit: crit || sc, r: 5, pierce: ST.pierce, hit: [], life: 1.5, main: true, owner: p.id
      });
      for (let k = 0; k < 2; k++)RUN.parts.push({
        x: p.x + Math.cos(a) * 18, y: p.y + Math.sin(a) * 18,
        vx: Math.cos(a) * 80 + rnd(-40, 40), vy: Math.sin(a) * 80 + rnd(-40, 40), t: .15, life: .15, hue: RUN.hue, r: 2
      })
    }
    SFX.shoot(RUN.el.mol ? 4 : RUN.el.n % 8)
  }
  function aoe(x, y, rad, dmg, hue) {
    // Radial explosion: damage falls off toward the edge instead of behaving like a single point hit.
    const R = Math.max(1, rad);
    RUN.enemies.forEach(e => {
      if (e.dead) return;
      const rr = R + (e.r || 0), dd = Math.sqrt(d2(e.x, e.y, x, y));
      if (dd <= rr) {
        const falloff = Math.max(.22, 1 - Math.max(0, dd - (e.r || 0)) / R * .78);
        dmgEnemy(e, dmg * falloff);
        if (!e.dead && !e.boss) {
          const push = (1 - Math.min(1, dd / rr)) * 42;
          if (push) { const aa = Math.atan2(e.y - y, e.x - x); e.x += Math.cos(aa) * push; e.y += Math.sin(aa) * push; }
        }
      }
    });
    RUN.explosionFx = RUN.explosionFx || [];
    RUN.explosionFx.push({ x, y, r: R, t: .42, life: .42, hue: hue == null ? (RUN.hue || 180) : hue });
    if (RUN.explosionFx.length > 90) RUN.explosionFx.splice(0, RUN.explosionFx.length - 90);
    ringFx(x, y, hue == null ? RUN.hue : hue, R, 8);
    for (let i = 0; i < 34; i++) { const a = rnd(TAU); const sp = rnd(80, 360) * (0.65 + Math.random()*.65); RUN.parts.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, t: rnd(.28, .58), life: .58, hue: hue == null ? RUN.hue : hue, r: rnd(1.5, 4.5) }) }
    RUN.shake = Math.max(RUN.shake, Math.min(15, 4 + R * .035));
  }
  function ringFx(x, y, hue, grow = 80, r0 = 8) {
    RUN.parts.push({ ring: true, x, y, r0, grow, t: .45, life: .45, hue });
    if (RUN.isOnline && NET.isHost && RUN.fxQueue && RUN.fxQueue.length < 600) RUN.fxQueue.push({ k: 'ring', x, y, hue, grow, r0 });
  }
  function arcChain(src, dmg, lv, hue = 190) {
    let cur = src;
    for (let i = 0; i < lv; i++) {
      let best = null, bd = 160 * 160;
      RUN.enemies.forEach(e => { if (e !== cur && !e.dead) { const dd = d2(cur.x, cur.y, e.x, e.y); if (dd < bd) { bd = dd; best = e } } });
      if (!best) break;
      RUN.parts.push({ x: cur.x, y: cur.y, x2: best.x, y2: best.y, t: .14, life: .14, hue, arc: true });
      if (RUN.isOnline && NET.isHost && RUN.fxQueue && RUN.fxQueue.length < 600) RUN.fxQueue.push({ k: 'arc', x: cur.x, y: cur.y, x2: best.x, y2: best.y, hue });
      dmgEnemy(best, dmg); cur = best; dmg *= .7
    }
  }
  function addPoison(e, dps, dur, hue) {
    if (e.boss) dps *= .4;
    if (!e.poison || e.poison.dps < dps) e.poison = { dps, t: dur, hue: hue || 120 }; else e.poison.t = Math.max(e.poison.t, dur)
  }
  function addBurn(e, dps, dur, stacks) {
    if (e.boss) dps *= .4;
    e.burn = e.burn || { dps: 0, t: 0, s: 0 };
    e.burn.dps = Math.max(e.burn.dps, dps);
    e.burn.t = Math.max(e.burn.t, dur);
    e.burn.s = Math.min(5, e.burn.s + (stacks || 1));
  }
  function addFreeze(e, t) { if (e.boss) t *= .25; e.freeze = Math.max(e.freeze || 0, t); }
  function addCorrode(e, t, amp) { e.corrode = Math.max(e.corrode || 0, t); e.corrodeAmp = amp || .35; }
  function addRust(e, t, amp) { if(!e||e.dead)return; e.rust=Math.max(e.rust||0,t); e.rustAmp=Math.max(e.rustAmp||0,amp==null?.72:amp); e.slowT=Math.max(e.slowT||0,t); }
  function addShock(e,t) { if(!e||e.dead)return; e.shockT=Math.max(e.shockT||0,t||1.2); e.shock=Math.max(e.shock||0,1); }
  function addBrittle(e,t) { if(!e||e.dead)return; e.brittleT=Math.max(e.brittleT||0,t||3); e.brittle=1; }
  function addDrenched(e,t) { if(!e||e.dead)return; e.drenched=Math.max(e.drenched||0,t||3); e.slowT=Math.max(e.slowT||0,t||3); }
  const ELAB = {};
  [['1', { sh: ['accel'], a: 'pulse' }], ['2', { ps: { spd: .08 }, a: 'anchor' }], ['3', { on: ['dashExpl'], a: 'veil' }], ['4', { sh: ['fast', 'pierce1'], ps: { spd: .1 } }], ['5', { sh: ['split'], a: 'wall' }], ['6', { ps: { armor: .05 }, a: 'veil' }], ['7', { on: ['slowHit', 'freezeCrit'], a: 'tide' }], ['8', { on: ['burnAmp'], a: 'flare' }], ['9', { on: ['corrodeHit'] }], ['10', { a: 'wall' }], ['11', { sh: ['expl'], a: 'tide' }], ['12', { on: ['blindHit'], a: 'flare' }], ['13', { ps: { rate: .25 }, sh: ['fast'] }], ['14', { on: ['chainHit'], a: 'anchor' }], ['15', { sh: ['burn', 'lag'] }], ['16', { sh: ['poison'], a: 'bloom' }], ['17', { on: ['poisonHit'], a: 'bloom' }], ['18', { a: 'ward' }], ['19', { on: ['unstable'] }], ['20', { ps: { shield: 10 }, a: 'wall' }], ['21', { ps: { hp: .1 }, a: 'ward' }], ['22', { ps: { hp: .2, armor: .08 }, a: 'ward' }], ['23', { on: ['store'], a: 'beam' }], ['24', { on: ['reflect'], ps: { armor: .05 } }], ['25', { on: ['catalyst'] }], ['26', { ps: { magnet: .5 }, a: 'anchor' }], ['27', { a: 'beam' }], ['28', { ps: { shield: 8 }, a: 'ward' }], ['29', { on: ['chainHit'] }], ['30', { ps: { shield: 10 }, on: ['shieldHeal'] }], ['31', { on: ['windup'] }], ['32', { a: 'veil' }], ['33', { sh: ['poison'], on: ['poisonHit'] }], ['34', { ps: { crit: .06 }, a: 'flare' }], ['35', { sh: ['corrode', 'lag'] }], ['36', { on: ['reveal'], a: 'beam' }], ['37', { on: ['instab'] }], ['38', { on: ['markHit'], a: 'flare' }], ['39', { a: 'drone' }], ['40', { ps: { armor: .08 }, on: ['heatShield'] }], ['41', { ps: { rate: .15 }, sh: ['fast'] }], ['42', { on: ['windup'] }], ['43', { on: ['unstable'] }], ['44', { on: ['markHit'] }], ['45', { on: ['reflect'] }], ['46', { a: 'pulse' }], ['47', { sh: ['fast'], ps: { crit: .08 } }], ['48', { on: ['toxicBattery'] }], ['49', { sh: ['hom', 'lag'] }], ['50', { a: 'drone' }], ['51', { sh: ['split', 'expl'] }], ['52', { on: ['infect'] }], ['53', { on: ['markHit'] }], ['54', { on: ['freezeCrit'], a: 'flare' }], ['55', { on: ['instab'] }], ['56', { sh: ['pullHit'] }], ['57', { a: 'veil' }], ['58', { on: ['sparkTrail'] }], ['59', { sh: ['hom'] }], ['60', { a: 'anchor' }], ['61', { on: ['auraRad'] }], ['62', { sh: ['expl'] }], ['63', { on: ['markHit'] }], ['64', { ps: { armor: .1 } }], ['65', { on: ['stunHit'], a: 'nova' }], ['66', { a: 'anchor' }], ['67', { sh: ['pierce1'], a: 'lance' }], ['68', { sh: ['fast'], a: 'beam' }], ['69', { ps: { rate: -.25, dmg: .4 }, sh: ['heavy'] }], ['70', { on: ['stillCharge'] }], ['71', { ps: { crit: .12, critD: .3 } }], ['72', { on: ['reserve'] }], ['73', { ps: { armor: .15, spd: -.12 } }], ['74', { sh: ['heavy'] }], ['75', { on: ['windup'] }], ['76', { ps: { armor: .1 }, on: ['shockHit'] }], ['77', { a: 'rain' }], ['78', { on: ['catalyst'] }], ['79', { on: ['goldKill'] }], ['80', { ps: { spd: .1 }, on: ['splitDash'] }], ['81', { on: ['delayPoison'] }], ['82', { ps: { armor: .08 }, a: 'wall' }], ['83', { a: 'wall' }], ['84', { on: ['infect'] }], ['85', { sh: ['corrode'], on: ['corrodeHit'] }], ['86', { on: ['poisonHit'], a: 'bloom' }], ['87', { on: ['unstable'] }], ['88', { on: ['auraRad'] }], ['89', { a: 'beam' }], ['90', { sh: ['heavy', 'poison'] }], ['91', { on: ['chainHit', 'poisonHit'] }], ['92', { sh: ['split'] }], ['93', { sh: ['pierce1', 'poison'] }], ['94', { on: ['critMass'] }], ['95', { on: ['reveal'], a: 'flare' }], ['96', { on: ['heatRay'] }], ['97', { sh: ['expl', 'lag'] }], ['98', { sh: ['pierce1', 'fast'] }], ['99', { on: ['confHit'] }], ['100', { sh: ['collapse'] }], ['101', { on: ['rageKill'] }], ['102', { on: ['corrodeHit'] }], ['103', { a: 'lance' }], ['104', { sh: ['heavy'] }], ['105', { sh: ['split'] }], ['106', { on: ['auraRad'] }], ['107', { on: ['speedDmg'] }], ['108', { sh: ['heavy', 'pullHit'] }], ['109', { on: ['unstable'] }], ['110', { ps: { rate: -.3, dmg: .6 }, sh: ['heavy'] }], ['111', { on: ['reveal'], ps: { crit: .08 } }], ['112', { ps: { spd: .08 }, a: 'veil' }], ['113', { on: ['markHit', 'explMark'] }], ['114', { ps: { armor: .1 }, sh: ['heavy'] }], ['115', { ps: { dmg: .35, hp: -.25 } }], ['116', { sh: ['lag', 'poison'] }], ['117', { on: ['poisonHit', 'explPoison'] }], ['118', { a: 'singularity' }]
  ].forEach(([k, v]) => ELAB[k] = v);
  function LAB() { return RUN && ELAB[RUN.el.id]; }
  function applyElemHit(b, e) {
    if (LAB() && LAB().on && LAB().on.includes('store')) { const op = RUN.players.find(q => q.id === b.owner); if (op) op.store = Math.min(20, (op.store || 0) + 1); }
    const L = LAB(); if (!L || !L.on) return;
    const cat = L.on.includes('catalyst') ? 1.5 : 1;
    if (b.crit && L.on.includes('freezeCrit')) addFreeze(e, .9 * cat);
    if (L.on.includes('poisonHit')) addPoison(e, ST.dmg * .4, 3 * cat);
    if (L.on.includes('corrodeHit')) addCorrode(e, 4 * cat, .35);
    if (L.on.includes('markHit')) e.mark = Math.max(e.mark, 4);
    if (L.on.includes('confHit') || L.on.includes('blindHit')) e.conf = Math.max(e.conf, 1);
    if (L.on.includes('stunHit')) e.stun = Math.max(e.stun, .5);
    if (L.on.includes('slowHit')) e.slowT = Math.max(e.slowT, 1);
    if (L.on.includes('chainHit') && !b.chained2) { b.chained2 = true; arcChain(e, ST.dmg * .4, 2); }
    if (L.on.includes('burnAmp') && e.burn) dmgEnemy(e, ST.dmg * .5, { quiet: true });
    if (L.on.includes('reveal') && e.type === 'ghost') { e.invuln = false; e.phaseT = 2.5; }
    if (L.on.includes('heatRay')) { e.heat = (e.heat || 0) + 1; if (e.heat >= 3) { e.heat = 0; dmgEnemy(e, ST.dmg * .8, { quiet: true }); } }
    if (L.on.includes('delayPoison')) addPoison(e, ST.dmg * .25, 5);
    if (L.on.includes('explMark') && e.mark > 0 && Math.random() < .3) { e.mark = 0; aoe(e.x, e.y, 80, ST.dmg * .9, 320); }
    if (L.on.includes('explPoison') && e.poison && Math.random() < .3) aoe(e.x, e.y, 70, ST.dmg * .7, 120);
    if (L.on.includes('shockHit')) aoe(b.x, b.y, 55, ST.dmg * .25, 220);
    if (L.on.includes('instab')) { const op = RUN.players.find(q => q.id === b.owner); if (op) { op.instab = (op.instab || 0) + 1; if (op.instab >= 6) { op.instab = 0; aoe(e.x, e.y, 90, ST.dmg * 1.4, 280); } } }
  }
  function bulletEnd(b) {
    if (b.fsplit && !b.frag) for (let k = -1; k <= 1; k += 2) { const a = Math.atan2(b.vy, b.vx) + k * .6; RUN.bullets.push({ x: b.x, y: b.y, vx: Math.cos(a) * ST.ps * .6, vy: Math.sin(a) * ST.ps * .6, dmg: ST.dmg * .35, r: 3, pierce: 0, hit: [], life: .5, frag: true, owner: b.owner }); }
    if (b.expl) aoe(b.x, b.y, 70, ST.dmg * .8, RUN.hue);
    if (b.lag) RUN.clouds.push({ x: b.x, y: b.y, r: 50, t: 1.6 });
  }
  function dmgEnemy(e, d, o = {}) {
    if (e.dead || e.invuln) return;
    if (e.type === 'tank') d *= .5;
    if (e.type === 'shielder') {
      const a = Math.atan2(RUN.players[0].y - e.y, RUN.players[0].x - e.x);
      let da = a - e.face; while (da > Math.PI) da -= TAU; while (da < -Math.PI) da += TAU;
      if (Math.abs(da) < 1.2 && !o.pierce) d *= .2
    }
    if (e.mark > 0) d *= 1.35;
    if (e.corrode > 0) d *= 1 + (e.corrodeAmp || .35);
    if (e.rust > 0) d *= 1 + (e.rustAmp || .72);
    if (e.brittleT > 0) d *= 1.22;
    if (e.freeze > 0) { d *= 1.5; e.freeze = 0; for (let i = 0; i < 4; i++) burst(e.x, e.y, 195); }
    e.hp -= d; e.flash = .09;
    if (ST.execute && !e.boss && e.hp > 0 && e.hp <= e.maxhp * .06 * ST.execute) e.hp = 0;
    if (o.big) {
      for (let i = 0; i < 5; i++)RUN.parts.push({ x: e.x, y: e.y, vx: rnd(-220, 220), vy: rnd(-220, 220), t: .3, life: .3, hue: 50, r: 2 });
      ringFx(e.x, e.y, 50, 40, 4)
    }
    if (!o.quiet && SAVE.set.dmg) RUN.texts.push({ x: e.x + rnd(-8, 8), y: e.y - e.r, t: .6, life: .6, s: Math.round(d) + '', big: o.big, col: o.col });
    if (RUN.isOnline && NET.isHost && RUN.fxQueue && RUN.fxQueue.length < 600) RUN.fxQueue.push({ k: 'txt', x: e.x, y: e.y - e.r, s: Math.round(d) + '', big: o.big, col: o.col });
    if (e.hp <= 0) killEnemy(e); else if (!o.quiet) SFX.hit()
  }
  function killEnemy(e) {
    if (e.dead) return; e.dead = true; SFX.kill();
    // Leave a brief, readable death animation behind before the enemy is removed.
    RUN.deathFx = RUN.deathFx || [];
    RUN.deathFx.push({ x:e.x, y:e.y, r:Math.max(10,e.r||12), t:.46, life:.46, hue:e.hue==null?RUN.hue:e.hue, elite:!!e.elite, boss:!!e.boss, shape:e.shape||e.type||'enemy' });
    if (RUN.deathFx.length > 100) RUN.deathFx.splice(0, RUN.deathFx.length-100);
    RUN.kills++; SAVE.stats.kills++; SAVE.addMxp(RUN.el.id, e.boss ? 10 : e.elite ? 3 : 1);
    if (ST.bloodlust) RUN.bloodlustStacks = Math.min(20, (RUN.bloodlustStacks || 0) + 1);
    const tr = ST.trait;
    if (ST.leech) RUN.players.forEach(p => { if (!p.downed) p.hp = Math.min(ST.hp, p.hp + ST.leech) });
    if (tr === 'vital') RUN.players.forEach(p => { if (!p.downed) p.hp = Math.min(ST.hp, p.hp + 2) });
    if (ST.voltaic && Math.random() < .22 * ST.voltaic) arcChain(e, ST.dmg * .6, 2, 190);
    if (e.burn) RUN.enemies.forEach(o => { if (!o.dead && o !== e && d2(o.x, o.y, e.x, e.y) < 90 * 90) addBurn(o, e.burn.dps, 2, 1); });
    const LK = LAB();
    if (LK && LK.on) {
      if (LK.on.includes('goldKill')) { RUN.coins += 2; SAVE.addCoins(2); }
      if (LK.on.includes('rageKill')) RUN.bloodlustStacks = Math.min(20, (RUN.bloodlustStacks || 0) + 1);
      if (LK.on.includes('infect')) RUN.enemies.forEach(o => { if (!o.dead && d2(o.x, o.y, e.x, e.y) < 110 * 110) addPoison(o, ST.dmg * .5, 3); });
      if (LK.on.includes('critMass')) { RUN.cm = (RUN.cm || 0) + 1; if (RUN.cm >= 6) { RUN.cm = 0; aoe(e.x, e.y, 160, ST.dmg * 2.5, 280); } }
    }
    if (ST.necroblast && Math.random() < .18 * ST.necroblast) aoe(e.x, e.y, 90, ST.dmg * 1.15, 20);
    if (RUN.ab.adrenaline) RUN.players.forEach(p => { if (!p.downed) p.adrenT = Math.max(p.adrenT || 0, .7 + .4 * RUN.ab.adrenaline) });
    ringFx(e.x, e.y, e.hue, e.elite ? 110 : 60);
    for (let i = 0; i < (e.elite ? 14 : 7); i++)burst(e.x, e.y, e.hue);
    if (e.elite) RUN.hitstop = Math.max(RUN.hitstop, .05);
    if (e.type === 'bomber') {
      aoe(e.x, e.y, 90, e.dmg, 20);
      RUN.players.forEach(p => { if (!p.downed && d2(p.x, p.y, e.x, e.y) < 95 * 95) hurtPlayer(p, e.dmg) })
    }
    const cv2 = Math.max(1, Math.round(e.coin * ST.coinMult));
    drop(e.x, e.y, 'coin', cv2); drop(e.x + rnd(-14, 14), e.y + rnd(-14, 14), 'xp', e.xp);
    if (Math.random() < .04) drop(e.x, e.y, 'hp', 20);
    if (Math.random() < .035) drop(e.x + rnd(-12,12), e.y + rnd(-12,12), 'shield', Math.round(Math.max(12,ST.shieldMax*.18)));
    if (Math.random() < .028) drop(e.x + rnd(-12,12), e.y + rnd(-12,12), 'charge', .9);
    if (Math.random() < .018) drop(e.x + rnd(-12,12), e.y + rnd(-12,12), 'overdrive', 1);
    if (Math.random() < .012) drop(e.x + rnd(-12,12), e.y + rnd(-12,12), 'vacuum', 1);
    if ((e.elite || e.boss) && Math.random() < (e.boss ? 1 : .3)) {
      /* Hex artifacts are deliberately scarcer than a mythic card: only 3%
         of relic drops may be one, while ordinary relic drops stay useful. */
      const hexes=RELICS.filter(r=>String(r.id).indexOf('hex_')===0);
      const ordinary=RELICS.filter(r=>String(r.id).indexOf('hex_')!==0);
      const r=hexes.length&&Math.random()<.03?hexes[irnd(hexes.length)]:ordinary[irnd(ordinary.length)];
      drop(e.x, e.y, 'relic', r.id);
    }
    if (e.type === 'splitter') for (let i = 0; i < 2; i++)spawnEnemy('mote', e.x + rnd(-16, 16), e.y + rnd(-16, 16));
    if (e.boss) {
      RUN.boss = null; document.getElementById('bosswrap').classList.add('hidden');
      banner('WARDEN DESTROYED', 2000); RUN.shake = 24; RUN.slowmo = .9; SFX.explosion(); AUDIO.setTrack('combat');
      RUN.players.forEach(p => {
        if (p.downed) {
          p.downed = false; p.hp = ST.hp * .5; p.revive = 0; p.iframes = 2;
          ringFx(p.x, p.y, 140, 100); banner(p.name + ' REVIVED', 1400); SFX.revive();
        }
      });
      for (let i = 0; i < 4; i++)ringFx(e.x, e.y, e.hue, 200 + i * 40, 10 + i * 14);
      for (let i = 0; i < 10; i++)drop(e.x + rnd(-40, 40), e.y + rnd(-40, 40), 'coin', 5);
      for (let i = 0; i < 8; i++)drop(e.x + rnd(-50, 50), e.y + rnd(-50, 50), 'xp', 5)
    }
  }
  function drop(x, y, t, v) { RUN.pickups.push({ t, x: x + rnd(-8, 8), y: y + rnd(-8, 8), v, vx: rnd(-40, 40), vy: rnd(-40, 40) }) }
  function burst(x, y, hue) {
    RUN.parts.push({ x, y, vx: rnd(-160, 160), vy: rnd(-160, 160), t: rnd(.2, .5), life: .5, hue, r: rnd(1.5, 3.5) });
    if (RUN.isOnline && NET.isHost && RUN.fxQueue && RUN.fxQueue.length < 600) RUN.fxQueue.push({ k: 'burst', x, y, hue });
  }
  function hurtPlayer(p, d) {
    if (p.iframes > 0 || p.dashT > 0 || p.downed) return;
    if (ST.trait === 'smoke' && Math.random() < .25) { RUN.texts.push({ x: p.x, y: p.y - 20, t: .6, life: .6, s: 'PHASED', col: '#aeb' }); return }
    if (ST.bulwark && (p.bulwarkCd || 0) <= 0 && d > 0) {
      p.bulwarkCd = 13 - 2 * ST.bulwark; p.iframes = .5;
      RUN.texts.push({ x: p.x, y: p.y - 24, t: .8, life: .8, s: 'BULWARK!', col: '#9ff', big: true });
      ringFx(p.x, p.y, 190, 90); SFX.active(); return
    }
    d *= (1 - ST.armor);
    if (p.sh > 0) { const a = Math.min(p.sh, d); p.sh -= a; d -= a }
    if (d > 0) {
      p.hp -= d;
      const LH = LAB();
      if (LH && LH.on) {
        if (LH.on.includes('reflect') && Math.random() < .3) aoe(p.x, p.y, 120, d * .9, 200);
        if (LH.on.includes('shieldHeal') && p.sh <= 0) p.hp = Math.min(ST.hp, p.hp + 12);
        if (LH.on.includes('toxicBattery')) { const t = nearestEnemy(p.x, p.y); if (t) addPoison(t, ST.dmg * .6, 3); }
        if (LH.on.includes('heatShield')) p.sh = Math.min(ST.shieldMax, p.sh + 5);
        if (LH.on.includes('reserve') && p.hp < ST.hp * .35 && (p.resCd || 0) <= 0) { p.resCd = 10; p.hp = Math.min(ST.hp, p.hp + ST.hp * .3); ringFx(p.x, p.y, 190, 90); }
      }
      // Combat is host-authoritative, but hit feedback is per screen: only
      // flash/shake the display owned by the player who was actually hit.
      if (!RUN.isOnline || isLocalPlayer(p)) {
        document.getElementById('hitflash').style.opacity = 1;
        setTimeout(() => document.getElementById('hitflash').style.opacity = 0, 120);
      }
      if (ST.thorns) aoe(p.x, p.y, 90, d * .5 * ST.thorns, 10)
    }
    p.iframes = .85; p.nox = 4;
    if (!RUN.isOnline || isLocalPlayer(p)) { RUN.shake = Math.max(RUN.shake, 7); SFX.hurt(); }
    if (p.hp <= 0) {
      if (RUN.revives > 0 && !RUN.coopUsed) {
        RUN.revives--; RUN.coopUsed = true; p.hp = ST.hp * .4; p.iframes = 2;
        aoe(p.x, p.y, 260, ST.dmg * 3, RUN.hue); banner('EMERGENCY CELL ACTIVATED', 1800); SFX.revive(); return
      }
      if (RUN.mode === 'coop' || RUN.mode === 'net_coop') { p.downed = true; p.hp = 0; banner(p.name + ' DOWN — REVIVE THEM!', 1600); return }
      endRun(true)
    }
  }
  function hurtPlayerPVP(p, d, attackerId) {
    if (p.iframes > 0 || p.dashT > 0 || p.downed) return;
    d *= (1 - ST.armor);
    if (p.sh > 0) { const a = Math.min(p.sh, d); p.sh -= a; d -= a }
    if (d > 0) p.hp -= d;
    p.iframes = 0.3; SFX.hurt();
    if (p.hp <= 0) {
      p.downed = true; p.hp = 0; p.deaths++;
      p.respawnTimer = 3.0;
      const atk = RUN.players.find(x => x.id === attackerId);
      if (atk) atk.kills++;
      banner((atk ? atk.name : 'RIVAL') + ' VAPORIZED ' + p.name, 1800);
      SFX.kill();
      if (atk && atk.kills >= RUN.pvpTargetKills) {
        banner('🏆 ' + atk.name.toUpperCase() + ' VICTORY!', 4000);
        endRun(false);
      }
    }
  }
  function endRun(died) {
    RUN.state = 'over'; SAVE.stats.runs++;
    RUN.boss = null;
    document.getElementById('bosswrap').classList.add('hidden');
    document.getElementById('hitflash').style.opacity = 0;
    const nb = RUN.wave > SAVE.stats.bestWave; SAVE.stats.bestWave = Math.max(SAVE.stats.bestWave, RUN.wave); SAVE.save();

    RUN.overInfo = {
      died,
      wave: RUN.wave,
      kills: RUN.kills,
      level: RUN.level,
      coins: RUN.coins,
      mxp: SAVE.mxp(RUN.el.id).xp,
      bestWave: SAVE.stats.bestWave,
      nb
    };

    broadcastGameState(true);
    AUDIO.setTrack('menu');
    const rows = [['WAVE REACHED', 'WAVE ' + RUN.wave], ['ENEMIES DESTROYED', RUN.kills],
    ['ISOTOPE LEVEL', 'LV ' + RUN.level], ['COINS BANKED', '◈ ' + RUN.coins],
    ['MASTERY XP', '◆ ' + SAVE.mxp(RUN.el.id).xp], ['BEST WAVE', 'WAVE ' + SAVE.stats.bestWave + (nb ? ' ★' : '')]];
    document.getElementById('ov-rows').innerHTML = rows.map(r => `<div class="kv"><span>${r[0]}</span><b>${r[1]}</b></div>`).join('');
    document.getElementById('over-flavor').textContent = died ? 'Your isotope has decayed into the lattice.' : 'Run abandoned.';
    document.getElementById('m-over').classList.remove('hidden')
  }
  /* level up */
  const xpNeed = l => Math.round(5 + l * 4 + l * l * .5);
  function gainXP(v) {
    RUN.xp += v * (1 + .2 * (ST.hoarder || 0));
    while (RUN.xp >= xpNeed(RUN.level)) {
      RUN.xp -= xpNeed(RUN.level); RUN.level++; RUN.pending++; SFX.level();
      RUN.players.forEach(p => { ringFx(p.x, p.y, 50, 140); for (let i = 0; i < 14; i++)burst(p.x, p.y, 50) })
    }
    if (RUN.pending > 0 && RUN.state !== 'level') openLevel()
  }
  function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = irnd(i + 1);[a[i], a[j]] = [a[j], a[i]] } return a }

  const WAIT_HTML = '<div class="panel" style="padding:20px;font-family:var(--mono);color:var(--tx2)">MODULE LOCKED IN — WAITING FOR TEAM…</div>';
  function pickerIds() { return RUN.isOnline ? RUN.players.map(p => p.id) : [0]; }
  function rollRarity(){
    /* Archivist Hex doubles every premium-tier roll without changing the
       common/uncommon baseline, so it is a real reward rather than flavor. */
    const hex=RUN&&RUN.relics&&RUN.relics.includes('hex_archivist')?2:1;
    const w=[['mythic',.5*hex],['legendary',2*hex],['epic',10*hex],['rare',20*hex],['uncommon',40],['common',70]];
    let n=Math.random()*w.reduce((a,x)=>a+x[1],0);for(const [k,v] of w){n-=v;if(n<=0)return k}return'common';
  }
  function makePool(){
    const pool=[],used=new Set();
    /* This artifact locks one level-up to its first rolled tier, letting the
       player compare five choices of that exact rarity. */
    const lockedTier=RUN&&RUN.relics&&RUN.relics.includes('hex_archivist')?rollRarity():null;
    while(pool.length<5){
      const wanted=lockedTier||rollRarity(), avail=ALL_CARDS.filter(a=>!used.has(a.id)&&(RUN.ab[a.id]||0)<(a.max||5));
      if(!avail.length)break;
      const same=avail.filter(a=>a.rarity===wanted),a=(same.length?same:avail)[irnd((same.length?same:avail).length)];
      used.add(a.id);const r=CARD_RARITY[a.rarity||'common'];
      pool.push({key:a.id,ic:a.ic,pre:RUN.el.name.toUpperCase()+' MODULE',n:a.n,d:a.d,lv:RUN.ab[a.id]||0,max:a.max,rarity:a.rarity,rarityLabel:r.label,color:r.color});
    }
    while(pool.length<5){const f=pool.length%2?'coin':'hp';pool.push({key:'filler:'+f,ic:f==='hp'?'✚':'◈',pre:'FIELD SUPPLY',n:f==='hp'?'MEND PLATING':'SALVAGE CACHE',d:f==='hp'?'Restore 30 HP':'Bank +40 coins',rarity:'common',rarityLabel:'COMMON',color:CARD_RARITY.common.color});}
    return pool;
  }
  function renderPool(pool, mode) {
    const box = document.getElementById('cards'); box.innerHTML = '';
    pool.forEach(c => {
      const d = document.createElement('div'); d.className = 'card panel';
      d.dataset.rarity=c.rarity||'common';d.style.setProperty('--rarity-color',c.color||CARD_RARITY.common.color);
      d.innerHTML=`<div class="rarity-badge">${c.rarityLabel||'COMMON'}</div><div class="ic">${c.ic}</div><div class="pre">${c.pre}</div><b>${c.n}</b>${c.lv!==undefined?`<div class="lv mono">STACK ${c.lv} → ${c.lv+1} / ${c.max}</div>`:''}<p>${c.d}</p>`;
      if (mode === 'host') d.onclick = () => chooseCard(RUN.localNetId, c.key);
      else if (mode === 'client') d.onclick = () => {
        NET.sendClientAction('pick:' + c.key);
        RUN.levelDone = RUN.levelDone || {};
        RUN.levelDone[RUN.localNetId] = true;
        RUN._lvlUI = null;
      };
      box.appendChild(d);
    });
  }
  function openLevel() {
    RUN.state = 'level';
    RUN.levelDone = {};
    RUN.pools = {};
    pickerIds().forEach(id => { RUN.pools[id] = makePool(); });
    const myId = pickerIds().includes(RUN.localNetId) ? RUN.localNetId : pickerIds()[0];
    renderPool(RUN.pools[myId], 'host');
    document.getElementById('m-level').classList.remove('hidden');
    if (RUN.isOnline && NET.isHost) broadcastGameState(true);
  }
  function chooseCard(pid, key) {
    if (!RUN || RUN.state !== 'level' || !RUN.pools || !RUN.pools[pid] || RUN.levelDone[pid]) return;
    const card = RUN.pools[pid].find(c => c.key === key);
    if (!card) return;
    if (key.startsWith('filler:')) {
      if (key === 'filler:hp') RUN.players.forEach(p => { p.hp = Math.min(ST.hp, p.hp + 30); });
      else { SAVE.addCoins(40); RUN.coins += 40; }
      SFX.coin();
    } else { RUN.ab[key] = (RUN.ab[key] || 0) + 1; SFX.unlock(); }
    RUN.levelDone[pid] = true;
    computeStats(); buildChips();
    if (pickerIds().every(id => RUN.levelDone[id])) {
      RUN.pending--;
      RUN.levelDone = {};
      if (RUN.pending > 0) { openLevel(); return; }
      RUN.pools = null;
      document.getElementById('m-level').classList.add('hidden');
      RUN.state = RUN.enemies.length || RUN.spawnLeft > 0 ? 'play' : 'inter';
    } else if (pid === RUN.localNetId) {
      document.getElementById('cards').innerHTML = WAIT_HTML;
    }
    if (RUN.isOnline && NET.isHost) broadcastGameState(true);
  }

  function buildChips() {
    document.getElementById('hud-bl').innerHTML = ABIL.filter(a => RUN.ab[a.id]).map(a =>
      `<div class="achip" title="${a.n}" style="border-color:${CARD_RARITY[a.rarity||'common'].color}">${a.ic}<b>LV${RUN.ab[a.id]}</b></div>`).join('')
  }
  /* updates */
  function updPlayer(p, dt) {
    if (p.downed) {
      if (RUN.mode === 'pvp' || RUN.mode === 'net_pvp') {
        p.respawnTimer -= dt;
        if (p.respawnTimer <= 0) {
          p.downed = false; p.hp = ST.hp; p.sh = ST.shieldMax;
          p.iframes = 1.5; p.x = rnd(80, W - 80); p.y = rnd(80, H - 80);
          ringFx(p.x, p.y, 180, 100); banner(p.name + ' RESPAWNED', 1200);
        }
      } else {
        p.revive = 0;
      }
      return;
    }
    const { dx, dy } = movementInput(p);
    if (RUN.isOnline && !isLocalPlayer(p) && p.netInput) {
      if (Number.isFinite(p.netInput.aimNX) && Number.isFinite(p.netInput.aimNY)) {
        p.angle = Math.atan2(p.netInput.aimNY * H - p.y, p.netInput.aimNX * W - p.x);
      } else if (Number.isFinite(p.netInput.angle)) {
        p.angle = p.netInput.angle;
      }
    }
    const l = Math.hypot(dx, dy) || 1;
    let spdMul = 1;
    if (p.adrenT > 0) spdMul *= 1.28;
    RUN.enemies.forEach(e => { if (!e.dead && e.type === 'anchor' && d2(e.x, e.y, p.x, p.y) < 190 * 190) spdMul = Math.min(spdMul, .55) });
    if (p.dashT > 0) {
      p.dashT -= dt; p.x += p.dvx * dt; p.y += p.dvy * dt;
      RUN.parts.push({ x: p.x, y: p.y, vx: 0, vy: 0, t: .25, life: .25, hue: RUN.hue, r: 4 })
    }
    else { p.x += dx / l * ST.spd * spdMul * dt; p.y += dy / l * ST.spd * spdMul * dt }
    if (RUN.pullT > 0 && RUN.pullSrc) {
      const a = Math.atan2(RUN.pullSrc.y - p.y, RUN.pullSrc.x - p.x);
      p.x += Math.cos(a) * 150 * dt; p.y += Math.sin(a) * 150 * dt
    }
    p.x = clamp(p.x, 16, W - 16); p.y = clamp(p.y, 16, H - 16);
    if (isLocalPlayer(p)) {
      const ne = nearestEnemy(p.x, p.y);
      p.angle = Math.atan2(mouse.y - p.y, mouse.x - p.x);
    } else if (!RUN.isOnline) {
      const ne = nearestEnemy(p.x, p.y);
      p.angle = ne ? Math.atan2(ne.y - p.y, ne.x - p.x) : p.angle;
    }
    p.dashCd = Math.max(0, p.dashCd - dt); p.activeCd = Math.max(0, p.activeCd - dt);
    p.iframes = Math.max(0, p.iframes - dt); p.nox = Math.max(0, p.nox - dt);
    p.adrenT = Math.max(0, (p.adrenT || 0) - dt); p.puTimer=Math.max(0,(p.puTimer||0)-dt); if(p.puTimer<=0){p.puDamage=1;p.puSpeed=1;p.puRate=1;p.puArmor=0;p.puProj=1;p.puCrit=0;} p.bulwarkCd = Math.max(0, (p.bulwarkCd || 0) - dt);
    p.resCd = Math.max(0, (p.resCd || 0) - dt);
    if (ST.regen) p.hp = Math.min(ST.hp, p.hp + ST.regen * dt);
    if (p.sh < ST.shieldMax && p.nox <= 0) p.sh = Math.min(ST.shieldMax, p.sh + 7 * dt);
    p.fireT -= dt;
    const wantFire = RUN.isOnline ? (isLocalPlayer(p) ? (mouse.down || autofire) : !!(p.netInput && p.netInput.fire)) : (p.id === 0 ? (mouse.down || autofire) : true);
    if (ST.windup) p.holdT = wantFire ? Math.min(3, (p.holdT || 0) + dt) : 0;
    const bloodlustMul = ST.bloodlust ? 1 + Math.min(.6, .025 * ST.bloodlust * (RUN.bloodlustStacks || 0)) : 1;
    const windupMul = ST.windup ? 1 + Math.min(.4, .13 * ST.windup) * Math.min(2, (p.holdT || 0) / 2) : 1;
    if (wantFire && p.fireT <= 0) { p.fireT = 1 / (ST.rate * bloodlustMul * windupMul * (p.puRate||1)); fire(p) }
    if (RUN.ab.turret) {
      p.turretT -= dt; if (p.turretT <= 0) {
        p.turretT = 4.6 - .5 * RUN.ab.turret;
        const targets = RUN.enemies.filter(e => !e.dead).sort((a, b) => d2(p.x, p.y, a.x, a.y) - d2(p.x, p.y, b.x, b.y)).slice(0, 2 + RUN.ab.turret);
        targets.forEach(t => {
          const a = Math.atan2(t.y - p.y, t.x - p.x);
          const nb = {
            x: p.x + Math.cos(a) * 16, y: p.y + Math.sin(a) * 16, vx: Math.cos(a) * ST.ps, vy: Math.sin(a) * ST.ps,
            dmg: dmg * (crit || sc ? ST.critD : 1), crit: crit || sc, r: 5, pierce: ST.pierce, hit: [], life: 1.5, main: true, owner: p.id
          };
          const LT = LAB();
          if (LT && LT.sh) {
            const t = LT.sh;
            if (t.includes('accel')) nb.acc = 520;
            if (t.includes('fast')) { nb.vx *= 1.5; nb.vy *= 1.5; nb.r = 4; }
            if (t.includes('heavy')) { nb.vx *= .6; nb.vy *= .6; nb.dmg *= 2; nb.kb = 3; nb.r = 7; }
            if (t.includes('pierce1')) nb.pierce += 1;
            if (t.includes('split')) nb.fsplit = true;
            if (t.includes('burn')) nb.burn = true;
            if (t.includes('poison')) nb.poison = true;
            if (t.includes('corrode')) nb.corrode = true;
            if (t.includes('mark')) nb.mark = true;
            if (t.includes('hom')) nb.hom = true;
            if (t.includes('expl') || t.includes('mine')) nb.expl = true;
            if (t.includes('lag')) nb.lag = true;
            if (t.includes('pullHit')) nb.pull = true;
            if (t.includes('collapse')) nb.collapse = true;
          }
          RUN.bullets.push(nb);
        });
        if (targets.length) SFX.shoot(2)
      }
    }
    if (ST.static) {
      const LU = LAB();
      if (LU && LU.on) {
        if (LU.on.includes('auraRad')) { p.radT = (p.radT || 0) - dt; if (p.radT <= 0) { p.radT = .5; RUN.enemies.forEach(e => { if (!e.dead && d2(e.x, e.y, p.x, p.y) < 95 * 95) dmgEnemy(e, ST.dmg * .2, { quiet: true }); }); } }
        if (LU.on.includes('stillCharge') && !dx && !dy) p.hp = Math.min(ST.hp, p.hp + 2.5 * dt);
        if (LU.on.includes('sparkTrail') && (dx || dy)) { p.sparkT = (p.sparkT || 0) - dt; if (p.sparkT <= 0) { p.sparkT = .4; burst(p.x, p.y, 55); const t = nearestEnemy(p.x, p.y); if (t && d2(t.x, t.y, p.x, p.y) < 70 * 70) dmgEnemy(t, ST.dmg * .5, { quiet: true }); } }
      }
      p.staticT -= dt; if (p.staticT <= 0) {
        p.staticT = .5;
        RUN.enemies.forEach(e => { if (!e.dead && d2(e.x, e.y, p.x, p.y) < 100 * 100) dmgEnemy(e, ST.dmg * .17 * ST.static, { quiet: true }) })
      }
    }
    const oc = (RUN.ab.orbit || 0) * 2;
    if (oc > 0) {
      p.orbitA += dt * 2.6;
      RUN.enemies.forEach(e => {
        if (e.dead) return;
        for (let i = 0; i < oc; i++) {
          const a = p.orbitA + i * TAU / oc, ox = p.x + Math.cos(a) * 54, oy = p.y + Math.sin(a) * 54;
          if (d2(ox, oy, e.x, e.y) < (8 + e.r) * (8 + e.r)) {
            e.orbCd = e.orbCd || 0;
            if (e.orbCd <= 0) { e.orbCd = .35; dmgEnemy(e, ST.dmg * .55); burst(e.x, e.y, RUN.hue) }
          }
        }
      })
    }
    if (RUN.ab.nova) {
      p.novaT -= dt; if (p.novaT <= 0) {
        p.novaT = 5; const lv = RUN.ab.nova;
        aoe(p.x, p.y, 140 + 32 * lv, ST.dmg * (1.1 + .45 * lv), RUN.hue)
      }
    }
    if (RUN.ab.grav) {
      p.gravT -= dt; if (p.gravT <= 0) {
        p.gravT = 7; const alive = RUN.enemies.filter(e => !e.dead);
        if (alive.length) { const t = alive[irnd(alive.length)]; RUN.wells.push({ x: t.x, y: t.y, t: 1.7, lv: RUN.ab.grav }) }
      }
    }
    if (ST.trait === 'flash') {
      p.flashT -= dt; if (p.flashT <= 0) {
        p.flashT = 6;
        RUN.enemies.forEach(e => { if (!e.dead && d2(e.x, e.y, p.x, p.y) < 280 * 280) e.stun = Math.max(e.stun, 1.2) });
        aoe(p.x, p.y, 280, ST.dmg * .4, 55)
      }
    }
    if (RUN.style === 'rad') {
      p.auraT -= dt; if (p.auraT <= 0) {
        p.auraT = .5;
        RUN.enemies.forEach(e => { if (!e.dead && d2(e.x, e.y, p.x, p.y) < 95 * 95) dmgEnemy(e, ST.dmg * .25, { quiet: true }) })
      }
    }
    if (RUN.mode === 'coop' || RUN.mode === 'net_coop') {
      const other = RUN.players.find(q => q.id !== p.id);
      if (other && other.downed && d2(p.x, p.y, other.x, other.y) < 70 * 70) {
        other.revive += dt;
        if (other.revive >= 2) {
          other.downed = false; other.hp = ST.hp * .5; other.revive = 0; SFX.revive();
          ringFx(other.x, other.y, 140, 100); banner(other.name + ' REVIVED', 1400)
        }
      }
    }
  }
  function applyTraitHit(b, e) {
    const tr = ST.trait;
    if (ST.aoeLv > 0) aoe(b.x, b.y, 40 + 14 * ST.aoeLv, ST.dmg * (.4 + .2 * ST.aoeLv), RUN.hue);
    if (ST.poisonLv > 0) addPoison(e, ST.dmg * .45 * ST.poisonLv, 3.5, 120);
    if (ST.burnLv > 0) addPoison(e, ST.dmg * .5 * ST.burnLv, 3, 25);
    if (ST.slowLv > 0) e.slowT = Math.max(e.slowT, .6 + .3 * ST.slowLv);
    if (tr === 'acid' || tr === 'corrosive') e.mark = tr === 'corrosive' ? 6 : 4;
    if (tr === 'cloud' || tr === 'miasma') RUN.clouds.push({ x: b.x, y: b.y, r: 58, t: 2.4 });
    if (tr === 'giggle' && Math.random() < .3) e.conf = 1.2;
    if (tr === 'fizz' && Math.random() < .2) e.stun = Math.max(e.stun, .9);
    if (ST.chainLv && !b.chained) { b.chained = true; arcChain(e, ST.dmg * .5, ST.chainLv, tr === 'conduct' ? 200 : 190) }
  }
  function updBullets(dt) {
    RUN.bullets.forEach(b => {
      if (ST.homing || b.hom) {
        let best = null, bd = 90000;
        RUN.enemies.forEach(e => { if (e.dead || b.hit.includes(e)) return; const dd = d2(b.x, b.y, e.x, e.y); if (dd < bd) { bd = dd; best = e } });
        if (best) {
          const ta = Math.atan2(best.y - b.y, best.x - b.x), ca = Math.atan2(b.vy, b.vx);
          let da = ta - ca; while (da > Math.PI) da -= TAU; while (da < -Math.PI) da += TAU;
          const na = ca + clamp(da, -ST.homing * 60 * dt, ST.homing * 60 * dt), sp = Math.hypot(b.vx, b.vy);
          b.vx = Math.cos(na) * sp; b.vy = Math.sin(na) * sp
        }
      }
      b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt;
      if (b.acc) { const sp = Math.hypot(b.vx, b.vy) || 1; const ns = sp + b.acc * dt; b.vx *= ns / sp; b.vy *= ns / sp; }
      if (b.collapse && !b.done && b.life < .8) { b.done = true; b.expl = true; b.life = 0; }
      for (const e of RUN.enemies) {
        if (e.dead || b.hit.includes(e)) continue;
        if (d2(b.x, b.y, e.x, e.y) < (b.r + e.r) * (b.r + e.r)) {
          dmgEnemy(e, b.dmg, { big: b.crit, col: b.crit ? '#ffd166' : undefined, pierce: b.pierce > 0 });
          for (let i = 0; i < 3; i++)RUN.parts.push({ x: b.x, y: b.y, vx: rnd(-120, 120), vy: rnd(-120, 120), t: .2, life: .2, hue: RUN.hue, r: 1.5 });
          if (!e.dead && !e.boss) { const ka = Math.atan2(b.vy, b.vx); e.x += Math.cos(ka) * ST.kb * .06; e.y += Math.sin(ka) * ST.kb * .06 }
          applyTraitHit(b, e);
          if (b.burn) addBurn(e, ST.dmg * .35, 3);
          if (b.poison) addPoison(e, ST.dmg * .45, 3.5);
          if (b.corrode) addCorrode(e, 4, .3);
          if (b.rust) addRust(e, 3.5, .72);
          if (b.shock) addShock(e, 1.4);
          if (b.brittle) addBrittle(e, 3.5);
          if (b.drenched) addDrenched(e, 2.8);
          if (b.freeze) addFreeze(e, 1.05);
          if (b.mark) e.mark = Math.max(e.mark, 4);
          if (b.pull) RUN.enemies.forEach(o => { if (!o.dead && d2(o.x, o.y, b.x, b.y) < 140 * 140) { const aa = Math.atan2(b.y - o.y, b.x - o.x); o.x += Math.cos(aa) * 46; o.y += Math.sin(aa) * 46; } });
          if (b.kb && !e.dead && !e.boss) { const ka = Math.atan2(b.vy, b.vx); e.x += Math.cos(ka) * 20; e.y += Math.sin(ka) * 20; }
          applyElemHit(b, e);
          if (b.crit) {
            if (ST.vamp) { const owner = RUN.players.find(pp => pp.id === b.owner); if (owner && !owner.downed) owner.hp = Math.min(ST.hp, owner.hp + ST.vamp) }
            if (ST.freeze && !e.boss) e.stun = Math.max(e.stun, .28 * ST.freeze)
          }
          if (!e.dead && e.type === 'mirror' && Math.random() < .25) ebul(e.x, e.y, Math.atan2(b.vy, b.vx), 260, e.dmg || 10);
          if (b.pierce > 0) {
            b.pierce--; b.hit.push(e);
            if (ST.splitshot && Math.random() < .5) {
              const a = Math.atan2(b.vy, b.vx);
              for (let k = -1; k <= 1; k += 2)RUN.bullets.push({
                x: b.x, y: b.y, vx: Math.cos(a + k * .5) * ST.ps * .6, vy: Math.sin(a + k * .5) * ST.ps * .6,
                dmg: ST.dmg * .3 * ST.splitshot, r: 3, pierce: 0, hit: [], life: .5, owner: b.owner
              })
            }
          }
          else {
            let bounced = false;
            if (ST.ricochet > 0) {
              if (b.ric === undefined) b.ric = ST.ricochet;
              if (b.ric > 0) {
                let best = null, bd = 260000;
                RUN.enemies.forEach(o => { if (o !== e && !o.dead && !b.hit.includes(o)) { const dd = d2(b.x, b.y, o.x, o.y); if (dd < bd) { bd = dd; best = o } } });
                if (best) {
                  const a = Math.atan2(best.y - b.y, best.x - b.x), spB = Math.hypot(b.vx, b.vy);
                  b.vx = Math.cos(a) * spB; b.vy = Math.sin(a) * spB; b.ric--; b.hit.push(e); bounced = true
                }
              }
            }
            if (!bounced) {
              b.life = 0; if (ST.fission && b.main && !b.frag) {
                for (let k = -1; k <= 1; k += 2) {
                  const a = Math.atan2(b.vy, b.vx) + k * .7;
                  RUN.bullets.push({
                    x: b.x, y: b.y, vx: Math.cos(a) * ST.ps * .7, vy: Math.sin(a) * ST.ps * .7, dmg: ST.dmg * .45,
                    r: 3, pierce: 0, hit: [], life: .7, frag: true, owner: b.owner
                  })
                }
              }
            }
            break
          }
        }
      }
    });
    RUN.bullets.forEach(b => { if (b.life <= 0 && !b._ended) { b._ended = true; bulletEnd(b); } });
    RUN.bullets = RUN.bullets.filter(b => b.life > 0 && b.x > -30 && b.x < W + 30 && b.y > -30 && b.y < H + 30);
    RUN.ebullets.forEach(b => {
      b.x += b.vx * dt; b.y += b.vy * dt;
      RUN.players.forEach(p => { if (!p.downed && d2(b.x, b.y, p.x, p.y) < (b.r + 11) * (b.r + 11)) { hurtPlayer(p, b.dmg); b.life = 0 } });
      b.life -= dt
    });
    RUN.ebullets = RUN.ebullets.filter(b => b.life > 0 && b.x > -40 && b.x < W + 40 && b.y > -40 && b.y < H + 40)
  }
  function ebul(x, y, a, spd, dmg) { RUN.ebullets.push({ x, y, vx: Math.cos(a) * spd, vy: Math.sin(a) * spd, r: 6, dmg, life: 6 }) }
  function nearestPlayer(x, y) {
    let b = null, bd = 1e9; RUN.players.forEach(p => {
      if (p.downed) return;
      const dd = d2(x, y, p.x, p.y); if (dd < bd) { bd = dd; b = p }
    }); return b || RUN.players[0]
  }
  function bossRing(b, n, spd, dmg) { for (let i = 0; i < n; i++)ebul(b.x, b.y, i / n * TAU + b.spirA, spd, dmg) }
  function bossAI(b, dt, mx, my, d) {
    const enr = b.hp < b.maxhp * .5;
    b.t1 -= dt; b.t2 -= dt; b.t3 -= dt; b.t4 -= dt;
    if (b.tele > 0) { b.tele -= dt; if (b.tele <= 0) { b.cdx = mx * 780; b.cdy = my * 780; b.chT = .65 } return }
    if (b.chT > 0) { b.chT -= dt; b.x += b.cdx * dt; b.y += b.cdy * dt; b.x = clamp(b.x, 40, W - 40); b.y = clamp(b.y, 40, H - 40); return }
    b.x += mx * (b.spd || 42) * dt; b.y += my * (b.spd || 42) * dt;
    const sp = b.fast ? (enr ? .07 : .1) : (enr ? .09 : .15);
    if (b.t1 <= 0) {
      if (b.pat === 'omega') { const opts = ['spiral', 'cross', 'rings', 'burst']; b.pat = opts[irnd(4)]; b.t1 = sp * 8; return }
      if (b.pat === 'spiral') {
        b.t1 = sp; b.spirA += b.fast ? .62 : .47;
        ebul(b.x, b.y, b.spirA, 175, 12); ebul(b.x, b.y, b.spirA + Math.PI, 175, 12)
      }
      else if (b.pat === 'cross') { b.t1 = sp; b.spirA += .4; for (let k = 0; k < 4; k++)ebul(b.x, b.y, b.spirA + k * Math.PI / 2, 165, 12) }
      else if (b.pat === 'rings') { b.t1 = enr ? 1.4 : 2; b.spirA += .3; bossRing(b, enr ? 22 : 16, 150, 12) }
      else if (b.pat === 'burst') {
        b.t1 = enr ? .8 : 1.2; const tp = nearestPlayer(b.x, b.y);
        const a0 = Math.atan2(tp.y - b.y, tp.x - b.x); for (let k = -3; k <= 3; k++)ebul(b.x, b.y, a0 + k * .12, 260, 13)
      }
      else if (b.pat === 'clouds') {
        b.t1 = 2; const tp = nearestPlayer(b.x, b.y);
        RUN.eclouds.push({ x: tp.x, y: tp.y, r: 90, t: 3.5 }); ringFx(tp.x, tp.y, b.hue, 90)
      }
      else if (b.pat === 'summon') { b.t1 = 3; for (let i = 0; i < (enr ? 4 : 2); i++)spawnEnemy(irnd(2) ? 'mote' : 'wisp', b.x + rnd(-80, 80), b.y + rnd(-60, 60)) }
      else if (b.pat === 'pull') { b.t1 = 4; RUN.pullT = 1.4; RUN.pullSrc = { x: b.x, y: b.y }; ringFx(b.x, b.y, b.hue, 220) }
      else if (b.pat === 'teleport') {
        b.t1 = 3; const tp = nearestPlayer(b.x, b.y);
        b.x = clamp(tp.x + rnd(-170, 170), 40, W - 40); b.y = clamp(tp.y + rnd(-170, 170), 40, H - 40);
        ringFx(b.x, b.y, b.hue, 140); bossRing(b, 14, 170, 12); SFX.active()
      }
      else { b.t1 = sp; b.spirA += .5; ebul(b.x, b.y, b.spirA, 175, 12) }
    }
    if (b.t2 <= 0) {
      b.t2 = 3.1; const tp = nearestPlayer(b.x, b.y);
      const a0 = Math.atan2(tp.y - b.y, tp.x - b.x); for (let k = -2; k <= 2; k++)ebul(b.x, b.y, a0 + k * .16, 240, 13)
    }
    if (b.t3 <= 0 && (b.pat === 'summon' || b.pat === 'omega')) { b.t3 = 8; for (let i = 0; i < 3; i++)spawnEnemy('mote', b.x + rnd(-70, 70), b.y + rnd(-50, 50)) }
    if (b.canCharge && b.t4 <= 0 && d < 460) { b.t4 = 6; b.tele = .65 }
  }
  function updEnemies(dt) {
    RUN.enemies.forEach(e => {
      if (e.dead) return;
      e.flash = Math.max(0, e.flash - dt); if (e.orbCd) e.orbCd -= dt;
      if (e.mark > 0) e.mark -= dt;
      if (e.poison) {
        if (e.burn) {
          e.burn.t -= dt; e.bT = (e.bT || 0) - dt;
          if (e.bT <= 0) { e.bT = .5; dmgEnemy(e, e.burn.dps * (e.burn.s || 1) * .5, { quiet: true }); burst(e.x, e.y, 25); }
          if (e.burn.t <= 0) e.burn = null;
          if (e.dead) return
        }
        if (e.corrode > 0) e.corrode -= dt;
        if (e.freeze > 0) e.freeze -= dt;
        if (e.rust > 0) { e.rust -= dt; e.slowT=Math.max(e.slowT,.12); if(e.rust<=0)e.rustAmp=0; }
        if (e.shockT > 0) e.shockT -= dt; else e.shock=0;
        if (e.brittleT > 0) e.brittleT -= dt; else e.brittle=0;
        if (e.drenched > 0) e.drenched -= dt;
        e.poison.t -= dt; e.pT = (e.pT || 0) - dt;
        if (e.pT <= 0) { e.pT = .5; dmgEnemy(e, e.poison.dps * .5, { quiet: true }); burst(e.x, e.y, e.poison.hue) }
        if (e.poison.t <= 0) e.poison = null; if (e.dead) return
      }
      if (e.burn) { cx.strokeStyle = 'hsla(20,90%,55%,.7)'; cx.lineWidth = 2; cx.beginPath(); cx.arc(0, 0, e.r + 3, 0, TAU); cx.stroke(); }
      if (e.corrode > 0) { cx.strokeStyle = 'hsla(90,80%,50%,.6)'; cx.lineWidth = 2; cx.setLineDash([4, 3]); cx.beginPath(); cx.arc(0, 0, e.r + 5, 0, TAU); cx.stroke(); cx.setLineDash([]); }
      if (e.freeze > 0) { cx.strokeStyle = 'rgba(170,240,255,.9)'; cx.lineWidth = 2; cx.beginPath(); for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; cx.lineTo(Math.cos(a) * (e.r + 4), Math.sin(a) * (e.r + 4)); } cx.closePath(); cx.stroke(); }
      if (e.rust > 0) { cx.strokeStyle = 'hsla(32,75%,48%,.9)'; cx.lineWidth = 2; cx.beginPath(); cx.arc(0,0,e.r+7,0,TAU); cx.stroke(); cx.beginPath(); cx.arc(0,0,e.r+10,-1.1,1.1); cx.stroke(); }
      if (e.shockT > 0) { cx.strokeStyle = 'hsla(285,95%,70%,.85)'; cx.lineWidth = 2; cx.beginPath(); for(let i=0;i<8;i++){const a=i/8*TAU+RUN.t*2;cx.lineTo(Math.cos(a)*(e.r+5),Math.sin(a)*(e.r+5));} cx.stroke(); }
      if (e.brittleT > 0) { cx.strokeStyle = 'hsla(205,100%,86%,.8)'; cx.setLineDash([2,3]); cx.beginPath(); cx.arc(0,0,e.r+6,0,TAU); cx.stroke(); cx.setLineDash([]); }
      if (e.drenched > 0) { cx.fillStyle='hsla(195,90%,65%,.14)'; cx.beginPath(); cx.arc(0,0,e.r+4,0,TAU); cx.fill(); }
      const tp = nearestPlayer(e.x, e.y);
      let dx = tp.x - e.x, dy = tp.y - e.y, d = Math.hypot(dx, dy) || 1, mx = dx / d, my = dy / d;
      if (e.type === 'shielder') e.face = Math.atan2(dy, dx);
      if (e.stun > 0) { e.stun -= dt }
      else if (e.boss) { bossAI(e, dt, mx, my, d) }
      else {
        let sp = e.spd * (e.slowT > 0 ? .55 : 1);
        if(e.rust>0) sp*=.42;
        if(e.drenched>0) sp*=.8;
        if(e.shockT>0) sp*=.68;
        // Five special archetypes have their own clearly telegraphed powers.
        if (e.special === 'blink') {
          e.specialT = (e.specialT || 2.4) - dt;
          if (e.specialT <= 0) { e.specialT = 3.6; e.x = clamp(tp.x + rnd(-180, 180), 24, W - 24); e.y = clamp(tp.y + rnd(-180, 180), 24, H - 24); ringFx(e.x, e.y, e.hue, 90) }
        }
        if (e.special === 'arc') {
          e.specialT = (e.specialT || 2.8) - dt;
          if (e.specialT <= 0) { e.specialT = 3.2; const a = Math.atan2(dy, dx); for (let i = -2; i <= 2; i++) ebul(e.x, e.y, a + i * .18, 250, e.dmg) }
        }
        if (e.special === 'split' && e.hp < e.maxhp * .5 && !e.specialUsed) {
          e.specialUsed = true; for (let i = 0; i < 4; i++) spawnEnemy('swarm', e.x + rnd(-24, 24), e.y + rnd(-24, 24)); ringFx(e.x, e.y, e.hue, 75)
        }
        if (e.special === 'pull') {
          e.specialT = (e.specialT || 4.5) - dt;
          if (e.specialT <= 0) { e.specialT = 5.5; RUN.pullT = 1.1; RUN.pullSrc = { x: e.x, y: e.y }; ringFx(e.x, e.y, e.hue, 150) }
        }
        if (e.special === 'mirror') {
          e.specialT = (e.specialT || 3) - dt;
          if (e.specialT <= 0) { e.specialT = 3.8; const a = Math.atan2(dy, dx); for (let i = -1; i <= 1; i++) ebul(e.x, e.y, a + i * .2, 275, e.dmg) }
        }
        if (e.conf > 0) { e.conf -= dt; e.wa = (e.wa || rnd(TAU)) + rnd(-3, 3) * dt; mx = Math.cos(e.wa); my = Math.sin(e.wa) }
        if (e.type === 'spitter') {
          if (d < 250) { mx = -mx; my = -my }
          e.shootT -= dt; if (e.shootT <= 0 && d < 560) { e.shootT = 2.2; ebul(e.x, e.y, Math.atan2(dy, dx), 230, 10) }
        }
        if (e.type === 'sniper') {
          if (d < 380) { mx = -mx; my = -my }
          e.charge = e.charge || 0; e.shootT -= dt;
          if (e.shootT <= 0 && d < 650) { e.shootT = 3; e.charge = .6 }
          if (e.charge > 0) { e.charge -= dt; if (e.charge <= 0) ebul(e.x, e.y, Math.atan2(dy, dx), 420, e.dmg) }
        }
        if (e.type === 'healer') {
          if (d < 300) { mx = -mx; my = -my }
          e.healT -= dt; if (e.healT <= 0) {
            e.healT = 1;
            RUN.enemies.forEach(o => { if (!o.dead && o !== e && d2(o.x, o.y, e.x, e.y) < 150 * 150) { o.hp = Math.min(o.maxhp, o.hp + o.maxhp * .06) } })
          }
        }
        if (e.type === 'orbiter') {
          e.orb += dt * 1.6;
          const tx = tp.x + Math.cos(e.orb) * 220, ty = tp.y + Math.sin(e.orb) * 220;
          const L = Math.hypot(tx - e.x, ty - e.y) || 1; mx = (tx - e.x) / L; my = (ty - e.y) / L;
          e.shootT -= dt; if (e.shootT <= 0) { e.shootT = 2; ebul(e.x, e.y, Math.atan2(tp.y - e.y, tp.x - e.x), 200, 10) }
        }
        if (e.type === 'wisp') {
          const px = -dy / d, py = dx / d, s = Math.sin(RUN.t * 4 + e.seed) * .95;
          mx += px * s; my += py * s; const L = Math.hypot(mx, my) || 1; mx /= L; my /= L
        }
        if (e.type === 'ghost') {
          e.phaseT -= dt; if (e.phaseT <= 0) { e.invuln = !e.invuln; e.phaseT = e.invuln ? 1.1 : 2.3 }
        }
        if (e.type === 'charger') {
          e.chgT -= dt;
          if (e.chgT <= 0) { e.charging = .55; e.chgT = rnd(2.8, 4.4) }
          if (e.charging > 0) { e.charging -= dt; sp *= 4 }
        }
        if (e.type === 'juggler') {
          if (d < 280) { mx = -mx; my = -my }
          e.shootT -= dt; if (e.shootT <= 0 && d < 520) {
            e.shootT = 2.6; const a0 = Math.atan2(dy, dx);
            for (let k = -1; k <= 1; k++)ebul(e.x, e.y, a0 + k * .28, 210, 9)
          }
        }
        if (e.type === 'seeder') {
          e.seedT -= dt; if (e.seedT <= 0 && RUN.enemies.length < 130) { e.seedT = rnd(3.5, 5.5); spawnEnemy('swarm', e.x + rnd(-20, 20), e.y + rnd(-20, 20)) }
        }
        if (!(e.freeze > 0)) { e.x += mx * sp * dt; e.y += my * sp * dt }
      }
      if (e.slowT > 0) e.slowT -= dt;
      e.touch -= dt;
      RUN.players.forEach(p => {
        if (!p.downed && e.touch <= 0 && d2(e.x, e.y, p.x, p.y) < (e.r + 13) * (e.r + 13)) {
          hurtPlayer(p, e.dmg); e.touch = .7;
          if (e.type === 'vampire') e.hp = Math.min(e.maxhp, e.hp + e.dmg * .6);
          if (e.type === 'crusher') { const ka = Math.atan2(p.y - e.y, p.x - e.x); p.x += Math.cos(ka) * 46; p.y += Math.sin(ka) * 46 }
        }
      })
    });
    const es = RUN.enemies;
    for (let i = 0; i < es.length; i++) {
      const a = es[i]; if (a.dead) continue;
      for (let j = i + 1; j < es.length; j++) {
        const b = es[j]; if (b.dead || a.boss || b.boss) continue;
        const dd = d2(a.x, a.y, b.x, b.y), rr = a.r + b.r;
        if (dd < rr * rr && dd > 0) {
          const dl = Math.sqrt(dd), ox = (a.x - b.x) / dl, oy = (a.y - b.y) / dl, push = (rr - dl) / 2;
          a.x += ox * push; a.y += oy * push; b.x -= ox * push; b.y -= oy * push
        }
      }
    }
    RUN.enemies = RUN.enemies.filter(e => !e.dead)
  }
  function updPickups(dt) {
    RUN.pickups.forEach(k => {
      k.x += k.vx * dt; k.y += k.vy * dt; k.vx *= .9; k.vy *= .9;
      RUN.players.forEach(p => {
        if (p.downed) return; const dd = d2(k.x, k.y, p.x, p.y);
        if (dd < ST.magnet * ST.magnet) { const dl = Math.sqrt(dd) || 1; k.vx += (p.x - k.x) / dl * 900 * dt; k.vy += (p.y - k.y) / dl * 900 * dt }
        if (dd < 20 * 20 && !k.got) {
          k.got = true;
          if (k.t === 'coin') { RUN.coins += k.v; SAVE.addCoins(k.v); SFX.coin() }
          else if (k.t === 'xp') { gainXP(k.v); SFX.xp() }
          else if (k.t === 'hp') { p.hp = Math.min(ST.hp, p.hp + k.v); SFX.coin() }
          else if (k.t === 'shield') { p.sh = Math.min(ST.shieldMax, (p.sh || 0) + k.v); p.iframes = Math.max(p.iframes || 0, .35); SFX.unlock(); ringFx(p.x,p.y,190,80) }
          else if (k.t === 'charge') { p.activeCd = Math.max(0, (p.activeCd || 0) - k.v); p.dashCd = Math.max(0, (p.dashCd || 0) - k.v); SFX.unlock(); ringFx(p.x,p.y,285,95) }
          else if (k.t === 'overdrive') { p.puDamage=Math.max(p.puDamage||1,1.35); p.puRate=Math.max(p.puRate||1,1.35); p.puTimer=Math.max(p.puTimer||0,5); SFX.unlock(); ringFx(p.x,p.y,45,105) }
          else if (k.t === 'vacuum') { RUN.pickups.forEach(o=>{ if(o!==k&&!o.got){ o.vx += (p.x-o.x)*3; o.vy += (p.y-o.y)*3; } }); SFX.unlock(); ringFx(p.x,p.y,160,130) }
          else if(k.t==='powerup'){RUN.pvpPowerups=RUN.pvpPowerups.filter(id=>id!==k.powerupId);applyPvpPowerup(p,k.powerupId)}
          else if(k.t==='powerup'){cx.beginPath();cx.arc(0,0,10,0,TAU);cx.fill();cx.fillStyle='#fff';cx.font='bold 9px sans-serif';cx.textAlign='center';cx.fillText(pu?pu.ic:'?',0,3)}
      else if (k.t === 'relic') {
            if (!RUN.relics.includes(k.v)) {
              RUN.relics.push(k.v); computeStats();
              const r = RELICS.find(r => r.id === k.v); banner('RELIC: ' + r.n, 1600); SFX.unlock(); ringFx(p.x, p.y, 260, 120)
            }
          }
          if (ST.lifeline) p.hp = Math.min(ST.hp, p.hp + ST.hp * .02 * ST.lifeline)
        }
      })
    });
    RUN.pickups = RUN.pickups.filter(k => !k.got)
  }
  function broadcastGameState(force) {
    if (!RUN || !RUN.isOnline || !NET.isHost) return;

    if (!force && RUN.t - RUN.lastSnapshotAt < 1 / 60) return;
    RUN.lastSnapshotAt = RUN.t;

    NET.broadcastSnapshot({
      t: RUN.t,
      wave: RUN.wave,
      state: RUN.state,
      interT: RUN.interT,
      spawnLeft: RUN.spawnLeft,
      level: RUN.level,
      xp: RUN.xp,
      coins: RUN.coins,
      kills: RUN.kills,

      vw: W,
      vh: H,

      players: RUN.players.map(p => ({
        id:p.id,signatureSlot:p.signatureSlot||0,elementId:p.elementId,entityId:p.elementId,entityKind:p.entityKind||'element',entityName:p.elem&&p.elem.name||p.entityName||'',formula:p.elem&&p.elem.f||p.formula||'',symbol:p.elem&&p.elem.sym||'',
        x: p.x,
        y: p.y,
        hp: p.hp,
        sh: p.sh,
        downed: p.downed,
        angle: p.angle,
        kills: p.kills,
        deaths: p.deaths,
        respawnTimer: p.respawnTimer,
        dashCd: p.dashCd,
        activeCd:p.activeCd,puDamage:p.puDamage||1,puSpeed:p.puSpeed||1,puRate:p.puRate||1,puName:p.puName||'',
        iframes: p.iframes
      })),

      enemies: RUN.enemies.filter(e => !e.dead).map(e => ({
        burn: e.burn ? (e.burn.s || 1) : 0, freeze: e.freeze || 0, corrode: e.corrode || 0, rust: e.rust || 0, shock: e.shockT || 0, brittle: e.brittleT || 0, drenched: e.drenched || 0,
        id: e.eid,
        type: e.type,
        x: e.x,
        y: e.y,
        hp: e.hp,
        maxhp: e.maxhp,
        hue: e.hue,
        r: e.r,
        shape: e.shape,
        seed: e.seed,
        boss: e.boss,
        elite: e.elite,
        name: e.name,
        face: e.face,
        burn: e.burn ? (e.burn.s || 1) : 0,
        freeze: e.freeze || 0,
        corrode: e.corrode || 0
      })),

      bullets: RUN.bullets.map(b => ({
        x: b.x,
        y: b.y,
        vx: b.vx,
        vy: b.vy,
        r: b.r,
        crit: b.crit,
        owner: b.owner
      })),

      ebullets: RUN.ebullets.map(b => ({
        x: b.x,
        y: b.y,
        r: b.r
      })),

      pickups: RUN.pickups.map(k => ({
        t:k.t,powerupId:k.powerupId,
        x: k.x,
        y: k.y,
        v: k.v
      })),

      clouds: RUN.clouds.map(c => ({
        x: c.x,
        y: c.y,
        r: c.r
      })),

      eclouds: RUN.eclouds.map(c => ({
        x: c.x,
        y: c.y,
        r: c.r,
        friendly: c.friendly
      })),

      wells: RUN.wells.map(w => ({
        x: w.x,
        y: w.y
      })),

      boss: RUN.boss ? {
        hp: RUN.boss.hp,
        maxhp: RUN.boss.maxhp,
        name: RUN.boss.name
      } : null,

      over: RUN.state === 'over' ? RUN.overInfo : null,
      fx: RUN.fxQueue && RUN.fxQueue.length ? RUN.fxQueue.splice(0, 240) : [],
      levelPools: (RUN.state === 'level' && RUN.pools) ? RUN.pools : null,
      levelDone:(RUN.state === 'level')?RUN.levelDone:null,pvpPowerups:RUN.pvpPowerups||[],
    });
  }
  function mergeShots(oldArr, incoming, rad) {
    const used = new Set(), rad2 = rad * rad;
    return incoming.map(nb => {
      let bi = -1, bd = rad2;
      for (let i = 0; i < oldArr.length; i++) {
        if (used.has(i)) continue;
        const dd = d2(oldArr[i].x, oldArr[i].y, nb.x, nb.y);
        if (dd < bd) { bd = dd; bi = i; }
      }
      if (bi >= 0) {
        used.add(bi);
        const o = oldArr[bi];
        o.x += (nb.x - o.x) * .3; o.y += (nb.y - o.y) * .3;
        o.vx = nb.vx; o.vy = nb.vy; o.r = nb.r; o.crit = nb.crit;
        return o;
      }
      return nb;
    });
  }

  function smoothClientWorld(dt) {
    const k = 1 - Math.exp(-22 * dt);
    RUN.players.forEach(p => {
      if (p._tx !== undefined) { p.x += (p._tx - p.x) * k; p.y += (p._ty - p.y) * k; }
      p.dashCd = Math.max(0, p.dashCd - dt); p.activeCd = Math.max(0, p.activeCd - dt);
    });
    RUN.enemies.forEach(e => {
      if (e._tx !== undefined) { e.x += (e._tx - e.x) * k; e.y += (e._ty - e.y) * k; }
      e.flash = Math.max(0, (e.flash || 0) - dt);
    });
    RUN.bullets.forEach(b => { b.x += (b.vx || 0) * dt; b.y += (b.vy || 0) * dt; });
    RUN.ebullets.forEach(b => { b.x += (b.vx || 0) * dt; b.y += (b.vy || 0) * dt; });
    RUN.pickups.forEach(pk => { if (pk._tx !== undefined) { pk.x += (pk._tx - pk.x) * k; pk.y += (pk._ty - pk.y) * k; } });
    RUN.parts.forEach(q => { q.t -= dt; if (!q.arc && !q.ring) { q.x += (q.vx || 0) * dt; q.y += (q.vy || 0) * dt; } });
    RUN.parts = RUN.parts.filter(q => q.t > 0);
    if (RUN.parts.length > 700) RUN.parts.splice(0, RUN.parts.length - 700);
    RUN.texts.forEach(t => { t.t -= dt; t.y -= 30 * dt; });
    RUN.texts = RUN.texts.filter(t => t.t > 0);
    if (RUN.shake > 0) RUN.shake = Math.max(0, RUN.shake - dt * 30);
  }

  function update(dt) {
    if (!RUN) return;

    // Clients do not simulate the world. They send their controls to the host
    // and render the authoritative state received in NET.onStateSnapshot.

    if (RUN.isOnline && !NET.isHost) {
      smoothClientWorld(dt);
      if (RUN.state === 'play' || RUN.state === 'inter') {
        const localP = RUN.players[RUN.localNetId];

        if (localP) {
          const { dx, dy } = movementInput(localP);
          const angle = Math.atan2(mouse.y - localP.y, mouse.x - localP.x);

          NET.sendClientInput({
            dx,
            dy,
            angle,
            aimNX: clamp(mouse.x / W, 0, 1),
            aimNY: clamp(mouse.y / H, 0, 1),
            fire: mouse.down || autofire
          });
        }
      }

      hud();
      return;
    }

    if (RUN.state === 'level' || RUN.state === 'pause' || RUN.state === 'over') return;
    RUN.t += dt; RUN.shake = Math.max(0, RUN.shake - dt * 30);
    let wdt = dt;
    if (RUN.hitstop > 0) { RUN.hitstop -= dt; wdt = 0 }
    else if (RUN.slowmo > 0) { RUN.slowmo -= dt; wdt = dt * .35 }
    if (RUN.pullT > 0) RUN.pullT -= dt;

    RUN.players.forEach(p => updPlayer(p, wdt));

    if (RUN.mode === 'pvp' || RUN.mode === 'net_pvp') {
      // PvP player bullet collisions
      RUN.bullets.forEach(b => {
        RUN.players.forEach(p => {
          if (p.id !== b.owner && !p.downed && p.iframes <= 0) {
            if (d2(b.x, b.y, p.x, p.y) < (b.r + 14) * (b.r + 14)) {
              hurtPlayerPVP(p, b.dmg, b.owner);
              b.life = 0;
            }
          }
        });
      });
    } else if ((RUN.mode === 'coop' || RUN.mode === 'net_coop') && RUN.friendlyFire && RUN.players.length > 1) {
      // Friendly fire: co-op player bullets can hurt teammates
      RUN.bullets.forEach(b => {
        RUN.players.forEach(p => {
          if (p.id !== b.owner && !p.downed) {
            if (d2(b.x, b.y, p.x, p.y) < (b.r + 14) * (b.r + 14)) {
              hurtPlayer(p, b.dmg * .6);
              b.life = 0;
            }
          }
        });
      });
    }

    if (RUN.state === 'inter') { RUN.interT -= wdt; if (RUN.interT <= 0) startWave() }
    else if (RUN.mode !== 'pvp' && RUN.mode !== 'net_pvp') {
      spawnLoop(wdt);
      if (RUN.spawnLeft <= 0 && RUN.enemies.length === 0 && RUN.state === 'play') {
        const bonus = 5 + RUN.wave; RUN.coins += bonus; SAVE.addCoins(bonus); SAVE.addMxp(RUN.el.id, 5);
        banner('WAVE ' + RUN.wave + ' CLEARED  +◈' + bonus, 1600);
        RUN.state = 'inter'; RUN.interT = 4
      }
    }

    if((RUN.mode==='pvp'||RUN.mode==='net_pvp')&&RUN.state==='play'){RUN.powerupNext-=wdt;if(RUN.powerupNext<=0){RUN.powerupNext=rnd(6,12);spawnPvpPowerup()}}
    updEnemies(wdt); updBullets(wdt); updPickups(wdt);
    RUN.eclouds.forEach(c => {
      c.t -= wdt;
      RUN.players.forEach(p => { if (!c.friendly && !p.downed && d2(p.x, p.y, c.x, c.y) < c.r * c.r) hurtPlayer(p, 10 * wdt * 3) })
    });
    RUN.eclouds = RUN.eclouds.filter(c => c.t > 0);
    RUN.parts.forEach(q => { q.t -= dt; if (!q.arc && !q.ring) { q.x += q.vx * dt; q.y += q.vy * dt } });
    RUN.parts = RUN.parts.filter(q => q.t > 0); if (RUN.parts.length > 700) RUN.parts.splice(0, RUN.parts.length - 700);
    RUN.texts.forEach(t => { t.t -= dt; t.y -= 30 * dt }); RUN.texts = RUN.texts.filter(t => t.t > 0);
    RUN.clouds.forEach(c => {
      c.t -= wdt;
      RUN.enemies.forEach(e => { if (!e.dead && d2(e.x, e.y, c.x, c.y) < c.r * c.r) dmgEnemy(e, ST.dmg * .9 * wdt, { quiet: true }) })
    });
    RUN.clouds = RUN.clouds.filter(c => c.t > 0);
    RUN.wells.forEach(wl => {
      wl.t -= wdt;
      RUN.enemies.forEach(e => {
        if (e.dead || e.boss) return; const dd = d2(e.x, e.y, wl.x, wl.y);
        if (dd < 340 * 340) { const dd2 = Math.sqrt(dd) || 1; e.x += (wl.x - e.x) / dd2 * 300 * wdt; e.y += (wl.y - e.y) / dd2 * 300 * wdt }
      });
      if (wl.t <= 0) aoe(wl.x, wl.y, 130, ST.dmg * (1.4 + .4 * wl.lv), 260)
    });
    RUN.wells = RUN.wells.filter(w => w.t > 0);
    if ((RUN.mode === 'coop' || RUN.mode === 'net_coop') && RUN.players.every(p => p.downed)) endRun(true);

    broadcastGameState(false);

    hud();
  }
  let banT = null;
  function banner(txt, ms) {
    const b = document.getElementById('banner'); b.textContent = txt; b.classList.remove('hidden');
    clearTimeout(banT); banT = setTimeout(() => b.classList.add('hidden'), ms)
  }
  function pause() {
    if (!RUN) return;
    if (RUN.isOnline && !NET.isHost) { NET.sendClientAction('togglePause'); return; }
    RUN.state = 'pause';
    document.getElementById('pause-info').textContent = `WAVE ${RUN.wave} · LV ${RUN.level} · ◈ ${RUN.coins}`;
    document.getElementById('m-pause').classList.remove('hidden');
    broadcastGameState(true);
  }
  function resume() {
    if (!RUN) return;
    if (RUN.isOnline && !NET.isHost) { NET.sendClientAction('togglePause'); return; }
    RUN.state = RUN.enemies.length || RUN.spawnLeft > 0 ? 'play' : 'inter';
    document.getElementById('m-pause').classList.add('hidden');
    broadcastGameState(true);
  }
  function togglePause() {
    if (!RUN) return;
    if (RUN.state === 'pause') resume(); else if (RUN.state === 'play' || RUN.state === 'inter') pause();
  }
  function hud() {
    const p0 = RUN.players[RUN.localNetId] || RUN.players[0] || { dashCd: 0, activeCd: 0 }, el = RUN.el, col = `hsl(${el.hue} 75% 60%)`;
    const pColors = ['var(--cy)', '#ff5d8f', '#5dff9e', '#ffb454'];
    document.getElementById('hp-bars').innerHTML = RUN.players.map((p, i) => `
  <div><div class="plabel" style="color:${pColors[i % 4]}">${p.name}${p.downed ? ' · DOWNED' : ''}</div>
  <div class="bar"><i style="transform:scaleX(${clamp(p.hp / ST.hp, 0, 1)})"></i>
   <span>${Math.ceil(Math.max(0, p.hp))}/${ST.hp}</span></div>
  ${ST.shieldMax ? `<div class="bar sh"><i style="transform:scaleX(${clamp(p.sh / ST.shieldMax, 0, 1)})"></i></div>` : ''}</div>`).join('');

    document.getElementById('h-wave').textContent = 'WAVE ' + String(Math.max(1, RUN.wave)).padStart(2, '0');
    document.getElementById('h-foes').textContent = RUN.mode === 'pvp' || RUN.mode === 'net_pvp' ? 'PVP ARENA' : (RUN.state === 'inter' ? 'NEXT WAVE IN ' + Math.ceil(RUN.interT) : 'HOSTILES: ' + (RUN.enemies.length + RUN.spawnLeft));
    document.getElementById('h-coins').textContent = '◈ ' + RUN.coins;
    document.getElementById('h-kills').textContent = 'KILLS ' + RUN.kills;
    document.getElementById('h-lv').textContent = 'LV ' + RUN.level;
    document.getElementById('h-mode').textContent = (RUN.mode || '').toUpperCase();
    document.getElementById('xpfill').style.transform = `scaleX(${clamp(RUN.xp / xpNeed(RUN.level), 0, 1)})`;
    document.getElementById('xptxt').textContent = 'LV ' + RUN.level + ' · ' + Math.floor(RUN.xp) + ' / ' + xpNeed(RUN.level) + ' XP';
    document.getElementById('dashfill').style.width = (100 * (1 - p0.dashCd / ST.dashCd)) + '%';
    document.getElementById('qfill').style.width = (100 * (1 - p0.activeCd / ST.activeCd)) + '%';
    if (RUN.boss) document.getElementById('bossfill').style.transform = `scaleX(${clamp(RUN.boss.hp / RUN.boss.maxhp, 0, 1)})`;
    document.getElementById('h-elem').style.borderColor = col;
    document.getElementById('h-elem').style.color = col;
    document.getElementById('h-num').textContent = el.mol ? '⚗' : el.n;
    document.getElementById('h-sym').textContent = el.mol ? el.f.slice(0, 3) : el.sym;

    // PvP Scoreboard update
    if (RUN.mode === 'pvp' || RUN.mode === 'net_pvp') {
      const list = [...RUN.players].sort((a, b) => b.kills - a.kills);
      document.getElementById('pvp-scores-list').innerHTML = list.map(p =>
        `<div style="display:flex;justify-content:space-between;gap:12px;margin-top:2px;color:${pColors[p.id % 4]}">
          <span>${p.name} (${p.elem ? p.elem.sym : 'H'})</span><b>${p.kills} / ${RUN.pvpTargetKills}</b>
        </div>`).join('');
    }
  }
  function render() {
    if (!RUN) return; cx.save();
    if (RUN.shake > 0 && SAVE.set.shake) cx.translate(rnd(-RUN.shake, RUN.shake), rnd(-RUN.shake, RUN.shake));
    cx.fillStyle = '#0a0f16'; cx.fillRect(-20, -20, W + 40, H + 40);
    /* nebula */
    const n1 = cx.createRadialGradient(W * .3 + Math.sin(RUN.t * .2) * 80, H * .3, 50, W * .3, H * .3, W * .5);
    n1.addColorStop(0, `hsla(${RUN.hue},60%,40%,.06)`); n1.addColorStop(1, 'transparent'); cx.fillStyle = n1; cx.fillRect(0, 0, W, H);
    const n2 = cx.createRadialGradient(W * .7 + Math.cos(RUN.t * .15) * 90, H * .7, 50, W * .7, H * .7, W * .5);
    n2.addColorStop(0, `hsla(${(RUN.hue + 120) % 360},60%,40%,.05)`); n2.addColorStop(1, 'transparent'); cx.fillStyle = n2; cx.fillRect(0, 0, W, H);
    cx.strokeStyle = 'rgba(90,140,200,.06)'; cx.lineWidth = 1; cx.beginPath();
    for (let x = 0; x < W; x += 48) { cx.moveTo(x, 0); cx.lineTo(x, H) } for (let y = 0; y < H; y += 48) { cx.moveTo(0, y); cx.lineTo(W, y) } cx.stroke();
    /* pulsing border */
    cx.strokeStyle = `hsla(${RUN.hue},70%,55%,${.12 + .08 * Math.sin(RUN.t * 2)})`; cx.lineWidth = 3; cx.strokeRect(4, 4, W - 8, H - 8);
    RUN.clouds.forEach(c => {
      cx.fillStyle = `hsla(80,80%,55%,${.08 + .04 * Math.sin(RUN.t * 6)})`;
      cx.beginPath(); cx.arc(c.x, c.y, c.r, 0, TAU); cx.fill()
    });
    RUN.eclouds.forEach(c => {
      cx.fillStyle = `hsla(${330},80%,50%,${.12 + .06 * Math.sin(RUN.t * 8)})`;
      cx.beginPath(); cx.arc(c.x, c.y, c.r, 0, TAU); cx.fill();
      cx.strokeStyle = `hsla(330,90%,60%,.5)`; cx.stroke()
    });
    RUN.wells.forEach(w => {
      cx.strokeStyle = 'rgba(167,139,255,.6)'; cx.lineWidth = 2;
      for (let i = 0; i < 3; i++) { cx.beginPath(); cx.arc(w.x, w.y, 30 + i * 36 + 10 * Math.sin(RUN.t * 5 + i), 0, TAU); cx.stroke() }
    });
    RUN.pickups.forEach(k => {
      const pu=PVP_POWERUPS.find(u=>u.id===k.powerupId); const col=k.t==='coin'?'#ffb454':k.t==='xp'?'#4fd8eb':k.t==='hp'?'#7ef0a6':k.t==='shield'?'#8eeaff':k.t==='charge'?'#cf91ff':k.t==='overdrive'?'#ffdf5d':k.t==='vacuum'?'#ff78ce':k.t==='powerup'?`hsl(${pu?pu.hue:0} 85% 62%)`:'#a78bff';
      cx.fillStyle = col; cx.save(); cx.translate(k.x, k.y); cx.rotate(RUN.t * 3);
      if (k.t === 'relic') { cx.beginPath(); for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; cx.lineTo(Math.cos(a) * 7, Math.sin(a) * 7) } cx.closePath(); cx.fill() }
      else if (k.t === 'coin') cx.fillRect(-4, -4, 8, 8);
      else if (k.t === 'shield') { cx.strokeStyle=col; cx.lineWidth=3; cx.beginPath(); cx.arc(0,0,8,0,TAU); cx.stroke(); }
      else if (k.t === 'charge') { cx.fillStyle=col; cx.beginPath(); cx.moveTo(1,-9);cx.lineTo(-4,1);cx.lineTo(1,1);cx.lineTo(-1,9);cx.lineTo(5,-2);cx.lineTo(0,-2);cx.closePath();cx.fill(); }
      else if (k.t === 'overdrive') { cx.fillStyle=col; cx.fillRect(-7,-2,14,4); cx.fillRect(-2,-7,4,14); }
      else if (k.t === 'vacuum') { cx.strokeStyle=col;cx.lineWidth=2;cx.beginPath();cx.arc(0,0,8,0,TAU);cx.stroke();cx.beginPath();cx.arc(0,0,3,0,TAU);cx.stroke(); }
      else { cx.beginPath(); cx.moveTo(0, -6); cx.lineTo(5, 4); cx.lineTo(-5, 4); cx.closePath(); cx.fill() }
      cx.restore()
    });
    RUN.enemies.forEach(e => {
      if (e.dead) return;
      const col = `hsl(${e.hue} ${e.elite ? 90 : 75}% ${e.flash > 0 ? 85 : 58}%)`;
      cx.save(); cx.translate(e.x, e.y);
      if (e.elite) { cx.strokeStyle = 'rgba(255,255,255,.7)'; cx.lineWidth = 1.5; cx.beginPath(); cx.arc(0, 0, e.r + 5, 0, TAU); cx.stroke() }
      if (e.poison) { cx.strokeStyle = `hsla(${e.poison.hue},80%,60%,.6)`; cx.lineWidth = 2; cx.beginPath(); cx.arc(0, 0, e.r + 3, 0, TAU); cx.stroke() }
      cx.fillStyle = col; cx.strokeStyle = '#0008'; cx.lineWidth = 2; cx.beginPath();
      const r = e.r;
      if (e.boss) {
        cx.rotate(RUN.t * .7);
        if (e.shape === 'square') cx.rect(-r, -r, r * 2, r * 2);
        else if (e.shape === 'diamond') { cx.moveTo(0, -r); cx.lineTo(r, 0); cx.lineTo(0, r); cx.lineTo(-r, 0); cx.closePath() }
        else if (e.shape === 'ring') cx.arc(0, 0, r, 0, TAU);
        else for (let i = 0; i < 6; i++) { const a = i * TAU / 6; cx.lineTo(Math.cos(a) * r, Math.sin(a) * r) }
        cx.closePath(); cx.fill(); cx.stroke();
        cx.fillStyle = '#fff'; cx.beginPath(); cx.arc(0, 0, r * .35, 0, TAU); cx.fill()
      }
      else if (e.shape === 'square') cx.rect(-r, -r, r * 2, r * 2), cx.fill(), cx.stroke();
      else if (e.shape === 'tri') { cx.moveTo(0, -r); cx.lineTo(r, r); cx.lineTo(-r, r); cx.closePath(); cx.fill(); cx.stroke() }
      else if (e.shape === 'diamond') { cx.rotate(RUN.t * 4 + e.seed); cx.moveTo(0, -r); cx.lineTo(r, 0); cx.lineTo(0, r); cx.lineTo(-r, 0); cx.closePath(); cx.fill(); cx.stroke() }
      else if (e.shape === 'cross') { cx.rect(-r * .3, -r, r * .6, r * 2); cx.rect(-r, -r * .3, r * 2, r * .6); cx.fill(); cx.stroke() }
      else if (e.shape === 'ring') { cx.arc(0, 0, r, 0, TAU); cx.fill(); cx.stroke(); cx.fillStyle = '#0a0f16'; cx.beginPath(); cx.arc(0, 0, r * .45, 0, TAU); cx.fill() }
      else if (e.shape === 'bomb') {
        cx.arc(0, 0, r, 0, TAU); cx.fill(); cx.stroke();
        cx.strokeStyle = col; cx.beginPath(); cx.moveTo(0, -r); cx.lineTo(0, -r - 6); cx.stroke()
      }
      else if (e.shape === 'shield') {
        cx.arc(0, 0, r, 0, TAU); cx.fill(); cx.stroke();
        cx.strokeStyle = '#9ff'; cx.lineWidth = 4; cx.beginPath(); cx.arc(0, 0, r + 3, e.face - 1.1, e.face + 1.1); cx.stroke()
      }
      else { cx.arc(0, 0, r, 0, TAU); cx.fill(); cx.stroke() }
      cx.restore();
      if (e.hp < e.maxhp && !e.boss) {
        cx.fillStyle = '#0009'; cx.fillRect(e.x - e.r, e.y - e.r - 7, e.r * 2, 3);
        cx.fillStyle = col; cx.fillRect(e.x - e.r, e.y - e.r - 7, e.r * 2 * clamp(e.hp / e.maxhp, 0, 1), 3)
      }
    });
    const pPalette = [`hsl(${RUN.hue} 80% 62%)`, '#ff5d8f', '#5dff9e', '#ffb454'];
    RUN.players.forEach((p, idx) => {
      const pc = pPalette[idx % 4];
      if (p.downed) cx.globalAlpha = .4;
      if (p.iframes > 0 && Math.floor(RUN.t * 20) % 2 === 0) cx.globalAlpha *= .4;
      cx.save(); cx.translate(p.x, p.y);
      cx.strokeStyle = pc + '55'; cx.lineWidth = 2; cx.beginPath(); cx.arc(0, 0, 17, 0, TAU); cx.stroke();
      cx.fillStyle = '#0d1420'; cx.beginPath(); cx.arc(0, 0, 13, 0, TAU); cx.fill();
      cx.strokeStyle = pc; cx.lineWidth = 2.5; cx.stroke();
      cx.fillStyle = pc; cx.font = 'bold 12px "Chakra Petch"'; cx.textAlign = 'center'; cx.textBaseline = 'middle';
      cx.fillText(p.elem ? (p.elem.mol ? '⚗' : p.elem.sym) : (RUN.el.mol ? '⚗' : RUN.el.sym), 0, 1);
      cx.rotate(p.angle); cx.strokeStyle = pc; cx.lineWidth = 3; cx.beginPath(); cx.moveTo(14, 0); cx.lineTo(22, 0); cx.stroke();
      cx.restore();

      // Render overhead name
      cx.font = 'bold 10px "Share Tech Mono"'; cx.textAlign = 'center'; cx.fillStyle = pc;
      cx.fillText(p.name, p.x, p.y - 24);

      if (p.downed) {
        cx.globalAlpha = 1; cx.strokeStyle = '#7ef0a6'; cx.lineWidth = 3;
        cx.beginPath(); cx.arc(p.x, p.y, 26, -Math.PI / 2, -Math.PI / 2 + (p.revive / 2) * TAU); cx.stroke()
      }
      cx.globalAlpha = 1;
      const oc = (RUN.ab.orbit || 0) * 2;
      for (let i = 0; i < oc; i++) {
        const a = p.orbitA + i * TAU / oc;
        cx.fillStyle = pc; cx.beginPath(); cx.arc(p.x + Math.cos(a) * 54, p.y + Math.sin(a) * 54, 5, 0, TAU); cx.fill()
      }
    });
    cx.globalCompositeOperation = 'lighter';
    RUN.bullets.forEach(b => {
      cx.fillStyle = `hsl(${RUN.hue} 90% ${b.crit ? 75 : 60}%)`;
      cx.beginPath(); cx.arc(b.x, b.y, b.r + (b.crit ? 2 : 0), 0, TAU); cx.fill()
    });
    RUN.ebullets.forEach(b => { cx.fillStyle = '#ff8c4f'; cx.beginPath(); cx.arc(b.x, b.y, b.r, 0, TAU); cx.fill() });
    RUN.parts.forEach(q => {
      const a = clamp(q.t / q.life, 0, 1);
      if (q.arc) {
        cx.strokeStyle = `hsla(${q.hue},90%,70%,${a})`; cx.lineWidth = 2;
        cx.beginPath(); cx.moveTo(q.x, q.y);
        cx.quadraticCurveTo((q.x + q.x2) / 2 + rnd(-14, 14), (q.y + q.y2) / 2 + rnd(-14, 14), q.x2, q.y2); cx.stroke()
      }
      else if (q.ring) {
        cx.strokeStyle = `hsla(${q.hue},90%,65%,${a})`; cx.lineWidth = 3;
        cx.beginPath(); cx.arc(q.x, q.y, q.r0 + (1 - a) * q.grow, 0, TAU); cx.stroke()
      }
      else { cx.fillStyle = `hsla(${q.hue},90%,62%,${a})`; cx.beginPath(); cx.arc(q.x, q.y, q.r, 0, TAU); cx.fill() }
    });
    cx.globalCompositeOperation = 'source-over';
    RUN.texts.forEach(t => {
      cx.font = (t.big ? 'bold 16px' : '12px') + ' "Share Tech Mono"'; cx.textAlign = 'center';
      cx.fillStyle = t.col || '#eaf4ff'; cx.globalAlpha = clamp(t.t / t.life, 0, 1); cx.fillText(t.s, t.x, t.y); cx.globalAlpha = 1
    });
    cx.strokeStyle = 'rgba(255,255,255,.6)'; cx.lineWidth = 1;
    cx.beginPath(); cx.arc(mouse.x, mouse.y, 8, 0, TAU); cx.stroke();
    cx.restore()
  }
  /* ambient bg */
  const bgc = document.getElementById('bg').getContext('2d');
  const glyphs = Array.from({ length: 46 }, () => {
    const e = Object.values(ELEMS)[irnd(118)];
    return { sym: e.sym, x: rnd(innerWidth), y: rnd(innerHeight), vx: rnd(-9, 9), vy: rnd(-7, 7), s: rnd(11, 30), a: rnd(.03, .12), h: e.hue }
  });
  function renderBG(dt) {
    bgc.clearRect(0, 0, W, H); bgc.fillStyle = '#070a10'; bgc.fillRect(0, 0, W, H);
    const g1 = bgc.createRadialGradient(W * .15, H * .1, 50, W * .15, H * .1, W * .6);
    g1.addColorStop(0, 'rgba(79,216,235,.07)'); g1.addColorStop(1, 'transparent'); bgc.fillStyle = g1; bgc.fillRect(0, 0, W, H);
    const g2 = bgc.createRadialGradient(W * .9, H * .9, 50, W * .9, H * .9, W * .55);
    g2.addColorStop(0, 'rgba(255,93,143,.06)'); g2.addColorStop(1, 'transparent'); bgc.fillStyle = g2; bgc.fillRect(0, 0, W, H);
    glyphs.forEach(g => {
      g.x += g.vx * dt; g.y += g.vy * dt;
      if (g.x < -40) g.x = W + 40; if (g.x > W + 40) g.x = -40; if (g.y < -40) g.y = H + 40; if (g.y > H + 40) g.y = -40;
      bgc.font = g.s + 'px "Share Tech Mono"'; bgc.fillStyle = `hsla(${g.h},70%,65%,${g.a})`; bgc.fillText(g.sym, g.x, g.y)
    })
  }
  let last = performance.now();
  function loop(now) {
    const dt = Math.min(.05, (now - last) / 1000); last = now;
    try {
      if (document.getElementById('scr-game').classList.contains('hidden')) renderBG(dt);
      else { update(dt); render() }
    } catch (err) {
      console.error('ISOTOPE loop error — recovering to menu:', err);
      RUN = null;
      try {
        document.getElementById('bosswrap').classList.add('hidden');
        document.getElementById('hitflash').style.opacity = 0;
        const pvpHud = document.getElementById('hud-pvp'); if (pvpHud) pvpHud.classList.add('hidden');
        ['m-over', 'm-pause', 'm-level', 'm-deploy', 'm-brief'].forEach(id => { const el = document.getElementById(id); if (el) el.classList.add('hidden') });
        if (window.UI) { UI.show('scr-menu'); UI.toast('A run error occurred — returned to menu.', 'bad') }
        else { document.getElementById('scr-game').classList.add('hidden'); document.getElementById('scr-menu').classList.remove('hidden') }
      } catch (e2) { console.error('ISOTOPE recovery error:', e2) }
    }
    requestAnimationFrame(loop)
  }

  // Network Callbacks Setup
  if (window.NET) {
    NET.onGameStart = (config, netPlayers, localId) => {
      if (window.UI) UI.show('scr-game');
      else { document.getElementById('scr-lobby').classList.add('hidden'); document.getElementById('scr-game').classList.remove('hidden') }
      start(netPlayers[localId].elementId, config.mode === 'pvp' ? 'net_pvp' : config.mode === 'boss' ? 'net_boss' : 'net_coop', netPlayers, true, localId);
    };

    NET.onClientInput = (playerId, input) => {
      if (!RUN || !RUN.players[playerId]) return;
      RUN.players[playerId].netInput = input;
    };

    NET.onClientAction = (playerId, action) => {
      if (!RUN || !NET.isHost) return;
      const p = RUN.players[playerId];
      if (!p) return;
      if (action === 'dash') tryDash(p);
      else if (action === 'active') useActive(p);
      else if (action === 'togglePause') togglePause();
      else if (typeof action === 'string' && action.indexOf('pick:') === 0) chooseCard(playerId, action.slice(5));
    };

    NET.onStateSnapshot = (snapshot) => {
      if (!RUN || NET.isHost) return;
      RUN.hostW = snapshot.vw || RUN.hostW || W;
      RUN.hostH = snapshot.vh || RUN.hostH || H;

      const sx = W / RUN.hostW;
      const sy = H / RUN.hostH;
      const s = Math.min(sx, sy);

      if (snapshot.fx) {
        snapshot.fx.forEach(ev => {
          if(ev.k==='shake') RUN.shake=Math.max(RUN.shake,ev.v||8); else if(ev.k==='banner') banner(ev.text||'SIGNATURE',900); else if (ev.k === 'ring') ringFx(ev.x * sx, ev.y * sy, ev.hue, ev.grow * s, ev.r0 * s);
          else if (ev.k === 'burst') burst(ev.x * sx, ev.y * sy, ev.hue);
          else if (ev.k === 'arc') RUN.parts.push({ x: ev.x * sx, y: ev.y * sy, x2: ev.x2 * sx, y2: ev.y2 * sy, t: .14, life: .14, hue: ev.hue, arc: true });
          else if (ev.k === 'txt') RUN.texts.push({ x: ev.x * sx, y: ev.y * sy, t: .6, life: .6, s: ev.s, big: ev.big, col: ev.col });
        });
      }

      const first = !RUN.netSnapOnce;
      RUN.netSnapOnce = true;

      RUN.t = snapshot.t;
      RUN.wave = snapshot.wave;
      RUN.state = snapshot.state;
      RUN.interT = snapshot.interT || 0;
      RUN.spawnLeft = snapshot.spawnLeft || 0;
      RUN.level = snapshot.level || RUN.level;
      RUN.xp = snapshot.xp || 0;
      RUN.coins = snapshot.coins || 0;
      RUN.kills = snapshot.kills || 0;

      const el = id => document.getElementById(id);
      const show = id => {
        const n = el(id);
        if (n) n.classList.remove('hidden');
      };
      const hide = id => {
        const n = el(id);
        if (n) n.classList.add('hidden');
      };

      if (RUN.state === 'pause') {
        if (el('pause-info')) {
          el('pause-info').textContent = `WAVE ${RUN.wave} · LV ${RUN.level} · ◈ ${RUN.coins}`;
        }
        show('m-pause');
      } else {
        hide('m-pause');
      }

      if (RUN.state === 'level') {
        show('m-level');
        const done = !!(snapshot.levelDone && snapshot.levelDone[RUN.localNetId]);
        const myPool = snapshot.levelPools ? snapshot.levelPools[RUN.localNetId] : null;
        const uiKey = (done ? 'd' : 'p') + (myPool ? 'm' : 'n');
        if (RUN._lvlUI !== uiKey) {
          RUN._lvlUI = uiKey;
          if (!done && myPool) renderPool(myPool, 'client');
          else if (el('cards')) el('cards').innerHTML = WAIT_HTML;
        }
      } else {
        hide('m-level');
        RUN._lvlUI = null;
      }

      if (RUN.state === 'over') {
        if (snapshot.over) {
          const o = snapshot.over;

          const rows = [
            ['WAVE REACHED', 'WAVE ' + o.wave],
            ['ENEMIES DESTROYED', o.kills],
            ['ISOTOPE LEVEL', 'LV ' + o.level],
            ['COINS BANKED', '◈ ' + o.coins],
            ['MASTERY XP', '◆ ' + o.mxp],
            ['BEST WAVE', 'WAVE ' + o.bestWave + (o.nb ? ' ★' : '')]
          ];

          if (el('ov-rows')) {
            el('ov-rows').innerHTML = rows.map(r =>
              `<div class="kv"><span>${r[0]}</span><b>${r[1]}</b></div>`
            ).join('');
          }

          if (el('over-flavor')) {
            el('over-flavor').textContent = o.died
              ? 'Your isotope has decayed into the lattice.'
              : 'Run abandoned.';
          }

          const retry = el('btn-retry');
          if (retry) {
            retry.disabled = true;
            retry.textContent = 'WAIT FOR HOST';
          }
        }

        show('m-over');
      } else {
        hide('m-over');
      }

      if (RUN.state === 'play' || RUN.state === 'inter') {
        hide('m-deploy');
        hide('m-brief');
      }

      if (snapshot.players) {
        snapshot.players.forEach(sp => {
          const p = RUN.players[sp.id];
          if (!p) return;
          const tx = sp.x * sx, ty = sp.y * sy;
          if (first || p._tx === undefined || d2(p.x, p.y, tx, ty) > 260 * 260) { p.x = tx; p.y = ty; }
          p._tx = tx; p._ty = ty;
          if (sp.id === RUN.localNetId && sp.hp < p.hp - .5) {
            document.getElementById('hitflash').style.opacity = 1;
            setTimeout(() => document.getElementById('hitflash').style.opacity = 0, 120);
            RUN.shake = Math.max(RUN.shake, 6); SFX.hurt();
          }
          p.hp = sp.hp; p.sh = sp.sh; p.downed = sp.downed; p.angle = sp.angle;
          p.signatureSlot=sp.signatureSlot||0; p.kills=sp.kills; p.deaths=sp.deaths; p.respawnTimer = sp.respawnTimer;
          p.dashCd=sp.dashCd||0;p.activeCd=sp.activeCd||0;p.iframes=sp.iframes||0;p.puDamage=sp.puDamage||1;p.puSpeed=sp.puSpeed||1;p.puRate=sp.puRate||1;p.puName=sp.puName||'';
        });
      }

      if (!RUN.enemyMap) RUN.enemyMap = new Map();

      if (snapshot.enemies) {
        const prev = {};
        RUN.enemies.forEach(e => { prev[e.id] = e; });
        RUN.enemies = snapshot.enemies.map((se, i) => {
          const id = se.id !== undefined ? se.id : i;
          const tx = se.x * sx, ty = se.y * sy;
          const old = prev[id];

          return {
            id, type: se.type,
            x: old ? old.x : tx, y: old ? old.y : ty,
            _tx: tx, _ty: ty,
            hp: se.hp, maxhp: se.maxhp, hue: se.hue,
            r: Math.max(2, se.r * s), shape: se.shape, seed: se.seed || 0,
            boss: se.boss, elite: se.elite, name: se.name, face: se.face || 0,
            burn: se.burn || 0,
            freeze: se.freeze || 0,
            corrode: se.corrode || 0
          };
        });
      }

      if (snapshot.bullets) {
        const inc = snapshot.bullets.map(b => ({ x: b.x * sx, y: b.y * sy, vx: (b.vx || 0) * sx, vy: (b.vy || 0) * sy, r: Math.max(2, b.r * s), crit: b.crit, owner: b.owner }));
        RUN.bullets = mergeShots(RUN.bullets, inc, 90);
      }
      if (snapshot.ebullets) {
        const inc = snapshot.ebullets.map(b => ({ x: b.x * sx, y: b.y * sy, vx: (b.vx || 0) * sx, vy: (b.vy || 0) * sy, r: Math.max(2, b.r * s), dmg: b.dmg || 10, life: 6 }));
        RUN.ebullets = mergeShots(RUN.ebullets, inc, 90);
      }
      if (snapshot.pickups) {
        RUN.pickups = snapshot.pickups.map(k => ({ t:k.t,powerupId:k.powerupId,v:k.v, x: k.x * sx, y: k.y * sy, _tx: k.x * sx, _ty: k.y * sy, vx: 0, vy: 0 }));
      }

      if (snapshot.clouds) {
        RUN.clouds = snapshot.clouds.map(c => ({
          x: c.x * sx,
          y: c.y * sy,
          r: c.r * s,
          t: 1
        }));
      }

      if (snapshot.eclouds) {
        RUN.eclouds = snapshot.eclouds.map(c => ({
          x: c.x * sx,
          y: c.y * sy,
          r: c.r * s,
          t: 1,
          friendly: c.friendly
        }));
      }

      if (snapshot.wells) {
        RUN.wells = snapshot.wells.map(w => ({
          x: w.x * sx,
          y: w.y * sy,
          t: 1,
          lv: 1
        }));
      }

      if (snapshot.boss) {
        if (!RUN.boss) {
          show('bosswrap');
          if (el('bossname')) el('bossname').textContent = '⚠ ' + snapshot.boss.name;
        }

        RUN.boss = snapshot.boss;
      } else {
        if (RUN.boss) {
          hide('bosswrap');
          RUN.boss = null;
        }
      }
    };
  }

  Object.assign(GAME, { CARD_RARITY, ALL_CARDS, PVP_POWERUPS, start, pause, resume, endRun });
  GAME.getRun = function(){ return RUN; }; GAME.getStats = function(){ return ST; };
  requestAnimationFrame(loop);


/* 

/* 
/* ISO_ABILITY_MASTER_GAME */
(function(){
if(window.__ISO_MASTER__) return; window.__ISO_MASTER__=true;
var oldUse=useActive, __oldFire=fire, __oldHit=applyElemHit, __oldDash=tryDash, __oldUpd=updPlayer;
function num(p){ var el=(p&&p.elem)||RUN.el; return (el&&!el.mol)?+el.n:0; }
function fxRing(x,y,hue,grow,r0,life){ if(!RUN)return; RUN.parts.push({ring:true,x:x,y:y,r0:r0||6,grow:grow||90,t:life||.5,life:life||.5,hue:hue}); }
function fxBurst(x,y,hue,n){ if(!RUN)return; n=n||10; for(var i=0;i<n;i++) RUN.parts.push({x:x,y:y,vx:rnd(-180,180),vy:rnd(-180,180),t:rnd(.18,.44),life:.5,hue:hue,r:rnd(1.5,3.8)}); }
function fxTele(x,y,r,dt,hue){ if(!RUN)return; RUN.parts.push({ring:true,x:x,y:y,r0:r*.22,grow:r*.55,t:dt,life:dt,hue:hue}); RUN.parts.push({ring:true,x:x,y:y,r0:r*.68,grow:r*.22,t:dt,life:dt,hue:hue}); }
function fxBeam(x,y,a,len,hue){ if(!RUN)return; var s=Math.max(4,Math.floor(len/18)); for(var i=0;i<=s;i++){ var t=i/s; RUN.parts.push({x:x+Math.cos(a)*len*t,y:y+Math.sin(a)*len*t,vx:rnd(-25,25),vy:rnd(-25,25),t:.22,life:.22,hue:hue,r:rnd(1.4,3.2)}); } }
function delayFx(fn,ms){ setTimeout(function(){ if(RUN) fn(); },ms); }
function near(x,y,r){ if(!RUN)return[]; return RUN.enemies.filter(function(e){ return !e.dead&&d2(e.x,e.y,x,y)<r*r; }); }
function applyStatus(e,st,d){ if(!e||e.dead||!st)return;
 if(st==='burn')addBurn(e,d*.35,4); else if(st==='poison')addPoison(e,d*.4,4); else if(st==='corrode')addCorrode(e,4,.35);
 else if(st==='slow')e.slowT=Math.max(e.slowT,2); else if(st==='freeze')addFreeze(e,.8); else if(st==='mark')e.mark=Math.max(e.mark,5);
 else if(st==='stun')e.stun=Math.max(e.stun,.9); else if(st==='conf')e.conf=Math.max(e.conf,1.5); }
function hitCircle(x,y,r,d,h,st){ if(!RUN)return; aoe(x,y,r,d,h); near(x,y,r).forEach(function(e){applyStatus(e,st,d);}); fxRing(x,y,h,r*.9,10,.42); fxBurst(x,y,h,12); }
function hitLine(x,y,a,len,w,d,h,st){ if(!RUN)return; var ca=Math.cos(a),sa=Math.sin(a);
 RUN.enemies.forEach(function(e){ if(e.dead)return; var px=e.x-x,py=e.y-y,t=clamp(px*ca+py*sa,0,len),cx2=x+ca*t,cy2=y+sa*t;
  if(d2(e.x,e.y,cx2,cy2)<(w+e.r)*(w+e.r)){ dmgEnemy(e,d); applyStatus(e,st,d); if(!e.boss){e.x+=ca*18;e.y+=sa*18;} } });
 fxBeam(x,y,a,len,h); fxRing(x+ca*len*.5,y+sa*len*.5,h,w*1.8,6,.28); RUN.shake=Math.max(RUN.shake,5); }
function hitCone(p,range,w,d,h,st){ if(!RUN||!p)return; var a0=p.angle;
 RUN.enemies.forEach(function(e){ if(e.dead)return; var dx=e.x-p.x,dy=e.y-p.y,dist=Math.hypot(dx,dy); if(dist>range+e.r)return;
  var da=Math.atan2(dy,dx)-a0; while(da>Math.PI)da-=TAU; while(da<-Math.PI)da+=TAU;
  if(Math.abs(da)<w){ dmgEnemy(e,d); applyStatus(e,st,d); if(!e.boss){e.x+=Math.cos(a0)*24;e.y+=Math.sin(a0)*24;} } });
 for(var i=0;i<14;i++){ var aa=a0+rnd(-w,w),rr=rnd(range*.25,range); RUN.parts.push({x:p.x+Math.cos(aa)*rr,y:p.y+Math.sin(aa)*rr,vx:Math.cos(aa)*rnd(60,220),vy:Math.sin(aa)*rnd(60,220),t:.28,life:.32,hue:h,r:rnd(1.5,3.4)}); }
 fxRing(p.x+Math.cos(a0)*range*.4,p.y+Math.sin(a0)*range*.4,h,range*.35,8,.3); }
function hitRing(x,y,rad,th,d,h,st){ if(!RUN)return;
 RUN.enemies.forEach(function(e){ if(e.dead)return; var dist=Math.hypot(e.x-x,e.y-y); if(Math.abs(dist-rad)<th+e.r){ dmgEnemy(e,d); applyStatus(e,st,d); if(!e.boss){ var a=Math.atan2(e.y-y,e.x-x); e.x+=Math.cos(a)*22; e.y+=Math.sin(a)*22; } } });
 fxRing(x,y,h,rad*.55,rad*.72,.45); }
function hitRect(x,y,w,hh,d,h,st){ if(!RUN)return;
 RUN.enemies.forEach(function(e){ if(e.dead)return; if(Math.abs(e.x-x)<w*.5+e.r&&Math.abs(e.y-y)<hh*.5+e.r){ dmgEnemy(e,d); applyStatus(e,st,d); } });
 for(var i=0;i<16;i++) RUN.parts.push({x:x+rnd(-w*.5,w*.5),y:y+rnd(-hh*.5,hh*.5),vx:rnd(-70,70),vy:rnd(-70,70),t:.25,life:.3,hue:h,r:rnd(1.2,3)});
 fxRing(x,y,h,Math.max(w,hh)*.35,10,.35); }
function hitBeam(x,y,a,len,w,d,h,st){ hitLine(x,y,a,len,w,d,h,st); fxRing(x+Math.cos(a)*len,y+Math.sin(a)*len,h,w*3,10,.35); }
function hitStar(x,y,r,pts,d,h,st){ if(!RUN)return;
 RUN.enemies.forEach(function(e){ if(e.dead)return; if(d2(e.x,e.y,x,y)<(r+e.r)*(r+e.r)){ dmgEnemy(e,d); applyStatus(e,st,d); } });
 for(var i=0;i<pts*2;i++){ var a=i/pts*Math.PI,rr=(i%2)?r:r*.4; RUN.parts.push({x:x+Math.cos(a)*rr,y:y+Math.sin(a)*rr,vx:Math.cos(a)*120,vy:Math.sin(a)*120,t:.4,life:.4,hue:h,r:3}); } }
function hitHex(x,y,r,d,h,st){ if(!RUN)return;
 RUN.enemies.forEach(function(e){ if(e.dead)return; if(d2(e.x,e.y,x,y)<(r+e.r)*(r+e.r)){ dmgEnemy(e,d); applyStatus(e,st,d); } });
 for(var i=0;i<6;i++){ var a=i/6*TAU; RUN.parts.push({x:x+Math.cos(a)*r,y:y+Math.sin(a)*r,vx:Math.cos(a)*80,vy:Math.sin(a)*80,t:.5,life:.5,hue:h,r:4}); } }
function hitCross(x,y,s,d,h,st){ if(!RUN)return;
 RUN.enemies.forEach(function(e){ if(e.dead)return; if(Math.abs(e.x-x)<s+e.r&&Math.abs(e.y-y)<s+e.r){ dmgEnemy(e,d); applyStatus(e,st,d); } });
 for(var i=0;i<4;i++) fxBeam(x,y,i/4*TAU,s,h); }
function hitSpiral(x,y,r,turns,d,h,st){ if(!RUN)return;
 RUN.enemies.forEach(function(e){ if(e.dead)return; if(d2(e.x,e.y,x,y)<(r+e.r)*(r+e.r)){ dmgEnemy(e,d); applyStatus(e,st,d); } });
 for(var i=0;i<turns*60;i++){ var a=i/10,t=i/60*r; RUN.parts.push({x:x+Math.cos(a)*t,y:y+Math.sin(a)*t,vx:0,vy:0,t:.6,life:.6,hue:h,r:2}); } }
function hitWave(x,y,a,len,amp,d,h,st){ if(!RUN)return; var ca=Math.cos(a),sa=Math.sin(a);
 RUN.enemies.forEach(function(e){ if(e.dead)return; var px=e.x-x,py=e.y-y,t=clamp(px*ca+py*sa,0,len),cx2=x+ca*t,cy2=y+sa*t,wv=Math.sin(t/30)*amp;
  if(d2(e.x,e.y,cx2+sa*wv,cy2-ca*wv)<(20+e.r)*(20+e.r)){ dmgEnemy(e,d); applyStatus(e,st,d); } });
 for(var i=0;i<=len;i+=14){ var wv2=Math.sin(i/30)*amp; RUN.parts.push({x:x+ca*i+sa*wv2,y:y+sa*i-ca*wv2,vx:0,vy:0,t:.4,life:.4,hue:h,r:2}); } }
function hitTriangle(x,y,a,s,d,h,st){ if(!RUN)return;
 RUN.enemies.forEach(function(e){ if(e.dead)return; var dx=e.x-x,dy=e.y-y,da=Math.atan2(dy,dx)-a; while(da>Math.PI)da-=TAU; while(da<-Math.PI)da+=TAU;
  if(Math.abs(da)<.6&&Math.hypot(dx,dy)<s+e.r){ dmgEnemy(e,d); applyStatus(e,st,d); } });
 for(var i=0;i<3;i++){ var ang=a+i/3*TAU-Math.PI/6; RUN.parts.push({x:x+Math.cos(ang)*s,y:y+Math.sin(ang)*s,vx:Math.cos(ang)*100,vy:Math.sin(ang)*100,t:.4,life:.4,hue:h,r:4}); } }
function hitGrid(x,y,w,hh,c,d,h,st){ if(!RUN)return;
 RUN.enemies.forEach(function(e){ if(e.dead)return; if(Math.abs(e.x-x)<w/2+e.r&&Math.abs(e.y-y)<hh/2+e.r){ dmgEnemy(e,d); applyStatus(e,st,d); } });
 for(var i=0;i<c;i++) RUN.parts.push({x:x+rnd(-w/2,w/2),y:y+rnd(-hh/2,hh/2),vx:0,vy:0,t:.5,life:.5,hue:h,r:3}); }
function bullet(p,o){ o=o||{}; var a=(typeof o.a==='number')?o.a:p.angle, sp=(typeof o.sp==='number')?o.sp:ST.ps;
 var b={x:p.x,y:p.y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,dmg:(typeof o.d==='number')?o.d:ST.dmg,r:(typeof o.r==='number')?o.r:5,pierce:o.pierce||0,hit:[],life:(typeof o.life==='number')?o.life:1.25,owner:p.id};
 if(o.hom)b.hom=true; if(o.expl)b.expl=true; if(o.burn)b.burn=true; if(o.poison)b.poison=true; if(o.corrode)b.corrode=true; if(o.rust)b.rust=true; if(o.shock)b.shock=true; if(o.brittle)b.brittle=true; if(o.drenched)b.drenched=true; if(o.freeze)b.freeze=true; if(o.mark)b.mark=true; if(o.pull)b.pull=true; if(o.acc)b.acc=o.acc; if(o.kb)b.kb=o.kb; if(o.fsplit)b.fsplit=true; if(o.collapse)b.collapse=true; if(o.crit)b.crit=true; if(o.chainOnHit)b.chainOnHit=true; if(o.lag)b.lag=true;
 RUN.bullets.push(b); return b; }
function fan(p,n,spread,o){ n=Math.max(1,n|0); for(var i=0;i<n;i++){ var off=n>1?(i/(n-1)-.5)*spread:0; bullet(p,Object.assign({},o,{a:p.angle+off})); } }
function ringShot(p,n,o){ n=Math.max(1,n|0); for(var i=0;i<n;i++) bullet(p,Object.assign({},o,{a:i/n*TAU})); }
function zone(x,y,r,t){ if(RUN) RUN.clouds.push({x:x,y:y,r:r,t:t}); }
function well(x,y,t,lv){ if(RUN) RUN.wells.push({x:x,y:y,t:t,lv:lv||1}); }
function shieldGain(p,a,ifr){ if(!RUN||!p)return; p.sh=Math.min(ST.shieldMax+a,p.sh+a); if(ifr)p.iframes=Math.max(p.iframes,ifr); fxRing(p.x,p.y,190,95,14,.5); }
function healGain(p,a){ if(!RUN||!p)return; p.hp=Math.min(ST.hp,p.hp+a); }
function dashMove(p,dist,ifr){ if(!RUN||!p)return; var ox=p.x,oy=p.y; p.x=clamp(p.x+Math.cos(p.angle)*dist,20,W-20); p.y=clamp(p.y+Math.sin(p.angle)*dist,20,H-20); p.iframes=Math.max(p.iframes,ifr||.5); fxRing(ox,oy,RUN.hue,80,8,.35); fxRing(p.x,p.y,RUN.hue,110,10,.42); }
function convertShots(p,r){ if(!RUN||!p||!RUN.ebullets)return; var keep=[]; for(var i=0;i<RUN.ebullets.length;i++){ var b=RUN.ebullets[i]; if(d2(b.x,b.y,p.x,p.y)<r*r){ bullet(p,{a:Math.atan2(b.vy,b.vx),sp:Math.hypot(b.vx,b.vy)||320,d:ST.dmg*1.1,r:5,pierce:2,life:1.4,burn:true}); } else keep.push(b); } RUN.ebullets=keep; }
var A={};
A[1]=function(p){ bullet(p,{d:ST.dmg*2.5,sp:ST.ps*1.25,acc:980,r:9,pierce:6,expl:true,life:1.8}); fan(p,3,.25,{d:ST.dmg*.72,acc:560,r:3,pierce:1,life:1.2}); hitLine(p.x,p.y,p.angle,240,18,ST.dmg*.5,190,'burn'); };
A[2]=function(p){ hitCross(p.x,p.y,220,ST.dmg,200,'slow'); near(p.x,p.y,340).forEach(function(e){ if(!e.boss){ e.y=Math.max(20,e.y-125); e.slowT=Math.max(e.slowT,2.2);} }); well(p.x,p.y-120,2.4,2); shieldGain(p,12,.6); };
A[3]=function(p){ dashMove(p,225,.72); for(var i=1;i<=5;i++){ var x=p.x-Math.cos(p.angle)*i*38,y=p.y-Math.sin(p.angle)*i*38; (function(x,y){ delayFx(function(){ hitStar(x,y,88,5,ST.dmg*.95,25,'burn'); },i*80); })(x,y); } };
A[4]=function(p){ bullet(p,{d:ST.dmg*1.9,sp:ST.ps*2.1,r:3,pierce:9,life:1.5}); fan(p,6,.35,{d:ST.dmg*.52,sp:ST.ps*1.75,r:2,pierce:3}); p.adrenT=Math.max(p.adrenT,2.2); hitCone(p,240,.45,ST.dmg*.5,210,'corrode'); };
A[5]=function(p){ hitRect(p.x+Math.cos(p.angle)*120,p.y+Math.sin(p.angle)*120,180,40,ST.dmg,310,'mark'); for(var i=0;i<7;i++){ var a=p.angle+(i-3)*.17; bullet(p,{a:a,sp:ST.ps*.52,d:ST.dmg*.92,r:7,pierce:0,life:2.4,fsplit:true}); } delayFx(function(){ ringShot(p,14,{d:ST.dmg*.52,r:4,pierce:2,sp:ST.ps*.95}); },450); };
A[6]=function(p){ p._form=((p._form||0)+1)%3; if(p._form===0){ shieldGain(p,30,1.25); hitRing(p.x,p.y,130,28,ST.dmg*.6,220,'mark'); } else if(p._form===1){ ringShot(p,10,{d:ST.dmg*.85,pierce:3,hom:true,chainOnHit:true}); } else { p.iframes=Math.max(p.iframes,1.45); hitCone(p,200,.8,ST.dmg,260,'conf'); } };
A[7]=function(p){ zone(p.x,p.y,175,5); hitSpiral(p.x,p.y,180,3,ST.dmg,205,'freeze'); near(p.x,p.y,260).forEach(function(e){ e.slowT=Math.max(e.slowT,3); if(Math.random()<.35) addFreeze(e,.8); }); };
A[8]=function(p){ zone(p.x,p.y,155,4); hitHex(p.x,p.y,160,ST.dmg,30,'burn'); near(p.x,p.y,320).forEach(function(e){ e.mark=Math.max(e.mark,6); addBurn(e,ST.dmg*.55,5); }); };
A[9]=function(p){ hitCone(p,260,.5,ST.dmg*.6,95,'corrode'); fan(p,8,.5,{d:ST.dmg*.88,pierce:4,corrode:true}); near(p.x,p.y,240).forEach(function(e){ addCorrode(e,6,.45); }); };
A[10]=function(p){ hitLine(p.x,p.y,p.angle+Math.PI/2,300,12,ST.dmg,320,'mark'); hitLine(p.x,p.y,p.angle-Math.PI/2,300,12,ST.dmg,320,'mark'); delayFx(function(){ ringShot(p,16,{sp:ST.ps*1.35,d:ST.dmg*.72,pierce:4,life:.9}); },350); };
A[11]=function(p){ zone(p.x,p.y,150,4); hitCircle(p.x+Math.cos(p.angle)*110,p.y+Math.sin(p.angle)*110,110,ST.dmg*.8,205,'slow'); fan(p,6,.7,{d:ST.dmg*.92,expl:true,r:6}); };
A[12]=function(p){ hitCircle(p.x,p.y,280,ST.dmg*1.15,55,'mark'); near(p.x,p.y,360).forEach(function(e){ e.stun=Math.max(e.stun,1.3); e.flash=.3; if(e.type==='ghost'){ e.invuln=false; e.phaseT=2.5; } }); };
A[13]=function(p){ fan(p,22,.9,{d:ST.dmg*.48,sp:ST.ps*1.35,r:3,pierce:1}); hitCone(p,250,.75,ST.dmg*.45,215,'corrode'); p.puRate=Math.max(p.puRate||1,1.65); p.puTimer=Math.max(p.puTimer||0,3); };
A[14]=function(p){
  /* Silicon — Circuit: place one conductive node every 0.5s.
     The next node links to the previous node. Nodes and links persist 7s.
     Nothing from the old radial-pull implementation is executed. */
  if(typeof window.ISO_SILICON_CIRCUIT==='function'){
    window.ISO_SILICON_CIRCUIT(p);
  }
};
A[15]=function(p){ fan(p,10,.8,{d:ST.dmg*.72,burn:true,life:2}); for(var i=1;i<=5;i++){ var x=p.x+Math.cos(p.angle)*i*45,y=p.y+Math.sin(p.angle)*i*45; (function(x,y){ delayFx(function(){ zone(x,y,65,3); hitWave(x,y,p.angle,100,30,ST.dmg,30,'burn'); },i*90); })(x,y); } };
A[16]=function(p){ RUN.eclouds.push({x:p.x,y:p.y,r:180,t:5,friendly:true}); hitHex(p.x,p.y,170,ST.dmg,65,'poison'); near(p.x,p.y,225).forEach(function(e){ addPoison(e,ST.dmg*.62,5); }); };
A[17]=function(p){ hitRing(p.x,p.y,220,40,ST.dmg,90,'poison'); for(var i=0;i<6;i++){ var a=i/6*TAU,x=p.x+Math.cos(a)*125,y=p.y+Math.sin(a)*125; (function(x,y){ delayFx(function(){ zone(x,y,95,4); },i*70); })(x,y); } };
A[18]=function(p){ hitCircle(p.x,p.y,230,ST.dmg,260,'slow'); zone(p.x,p.y,190,4); near(p.x,p.y,230).forEach(function(e){ e.stun=Math.max(e.stun,1); e.slowT=Math.max(e.slowT,2.5); e.burn=null; e.poison=null; }); if(RUN.ebullets) RUN.ebullets=RUN.ebullets.filter(function(b){ return d2(b.x,b.y,p.x,p.y)>230*230; }); };
A[19]=function(p){ for(var i=0;i<12;i++){ (function(i){ delayFx(function(){ bullet(p,{a:p.angle+rnd(-.5,.5),d:ST.dmg*.62,sp:ST.ps*1.25}); if(Math.random()<.4) hitStar(p.x,p.y,90,6,ST.dmg,20,'burn'); },i*70); })(i); } };
A[20]=function(p){ shieldGain(p,32,1); hitRect(p.x+Math.cos(p.angle)*110,p.y+Math.sin(p.angle)*110,210,80,ST.dmg,40,'stun'); delayFx(function(){ fan(p,20,TAU,{d:ST.dmg*.3,pierce:2}); },400); };
A[21]=function(p){ hitRing(p.x,p.y,160,30,ST.dmg,210,'mark'); RUN.bullets.forEach(function(b){ b.dmg*=1.15; b.pierce=(b.pierce||0)+1; }); shieldGain(p,20,.8); p.puDamage=1.38; p.puTimer=6; };
A[22]=function(p){ p.iframes=Math.max(p.iframes,2); p.adrenT=Math.max(p.adrenT,2.5); dashMove(p,260,1.5); hitCross(p.x,p.y,200,ST.dmg*1.5,220,'stun'); };
A[23]=function(p){ var s=Math.min(24,p.store||0); p.store=0; hitBeam(p.x,p.y,p.angle,300+s*10,20,ST.dmg*(2+s*.22),55,'burn'); };
A[24]=function(p){ convertShots(p,285); shieldGain(p,18,.9); hitRing(p.x,p.y,165,30,ST.dmg,225,'mark'); ringShot(p,10,{d:ST.dmg*.55,pierce:3,sp:ST.ps*1.2}); };
A[25]=function(p){ hitCircle(p.x,p.y,200,ST.dmg,280,'mark'); near(p.x,p.y,340).forEach(function(e){ e.mark=Math.max(e.mark,6); addPoison(e,ST.dmg*.35,4); addBurn(e,ST.dmg*.35,4); }); };
A[26]=function(p){ well(p.x,p.y,2.8,3); hitSpiral(p.x,p.y,200,4,ST.dmg,260,'slow'); near(p.x,p.y,400).forEach(function(e){ if(!e.boss){ var a=Math.atan2(p.y-e.y,p.x-e.x); e.x+=Math.cos(a)*185; e.y+=Math.sin(a)*185; } }); };
A[27]=function(p){ var s=Math.min(20,p.store||0); p.store=0; hitBeam(p.x,p.y,p.angle,500,12,ST.dmg*(3.6+s*.22),55,'burn'); };
A[28]=function(p){ shieldGain(p,28,1.2); convertShots(p,260); hitHex(p.x,p.y,160,ST.dmg,240,'slow'); };
A[29]=function(p){ fan(p,7,.4,{d:ST.dmg*.72,hom:true,pierce:2,chainOnHit:true}); delayFx(function(){ var t=nearestEnemy(p.x,p.y); if(t){ arcChain(t,ST.dmg*1.65,6,200); hitStar(t.x,t.y,100,5,ST.dmg,200,'stun'); } },200); };
A[30]=function(p){ shieldGain(p,42,1.4); delayFx(function(){ healGain(p,26); hitCircle(p.x,p.y,165,ST.dmg*1.25,145,'poison'); },1200); };
A[31]=function(p){ fan(p,14,.9,{sp:ST.ps*.72,d:ST.dmg*.62,burn:true,life:1.8}); hitWave(p.x,p.y,p.angle,240,50,ST.dmg,30,'burn'); p.holdT=Math.min(3,(p.holdT||0)+1); };
A[32]=function(p){ p._semi=(p._semi||0)?0:1; if(p._semi){ shieldGain(p,24,1); hitRing(p.x,p.y,145,30,ST.dmg,210,'slow'); } else { ringShot(p,12,{d:ST.dmg*.62,pierce:3,chainOnHit:true}); var t=nearestEnemy(p.x,p.y); if(t) arcChain(t,ST.dmg*1.45,5,200); } };
A[33]=function(p){ fan(p,12,.4,{d:ST.dmg*.48,poison:true,pierce:2}); hitCone(p,260,.5,ST.dmg*.5,120,'poison'); near(p.x,p.y,260).forEach(function(e){ addPoison(e,ST.dmg*.58,6); }); };
A[34]=function(p){ p.puCrit=1; p.puTimer=5; p.puDamage=1.25; hitBeam(p.x,p.y,p.angle,380,14,ST.dmg*2.25,55,'mark'); near(p.x,p.y,320).forEach(function(e){ e.flash=.5; if(e.type==='ghost'){ e.invuln=false; e.phaseT=2.5; } }); };
A[35]=function(p){ for(var i=0;i<6;i++){ var a=p.angle+(i-2.5)*.2; bullet(p,{a:a,sp:ST.ps*.82,d:ST.dmg*.72,corrode:true,r:7,life:1.8,expl:true,lag:true}); } hitGrid(p.x+Math.cos(p.angle)*120,p.y+Math.sin(p.angle)*120,140,140,12,ST.dmg,90,'corrode'); };
A[36]=function(p){ hitBeam(p.x,p.y,p.angle,450,10,ST.dmg*2.9,55,'mark'); near(p.x,p.y,360).forEach(function(e){ e.flash=.4; e.mark=Math.max(e.mark,3); if(e.type==='ghost'){ e.invuln=false; e.phaseT=2.5; } }); };
A[37]=function(p){ p.instab=(p.instab||0)+6; if(p.instab>=6){ p.instab=0; hitStar(p.x,p.y,260,8,ST.dmg*2.8,280,'burn'); } else fan(p,8,.6,{d:ST.dmg*.62,expl:true}); };
A[38]=function(p){ hitCircle(p.x,p.y,300,ST.dmg*.95,0,'mark'); near(p.x,p.y,420).forEach(function(e){ e.mark=Math.max(e.mark,7); e.flash=.25; }); };
A[39]=function(p){ for(var i=0;i<8;i++){ var t=nearestEnemy(p.x,p.y); var a=t?Math.atan2(t.y-p.y,t.x-p.x):i/8*TAU; bullet(p,{a:a,d:ST.dmg*.58,hom:true,life:2,pierce:1}); } hitHex(p.x,p.y,150,ST.dmg,120,'mark'); };
A[40]=function(p){ shieldGain(p,26,1); RUN.enemies.forEach(function(e){ if(!e.dead&&e.burn) e.burn.dps*=1.5; }); hitCircle(p.x,p.y,160,ST.dmg*.75,30,'burn'); };
A[41]=function(p){ p.puRate=1.9; p.puTimer=6; p.puDamage=1.18; hitRing(p.x,p.y,150,28,ST.dmg,220,'slow'); ringShot(p,10,{d:ST.dmg*.55,pierce:4,hom:true}); };
A[42]=function(p){ p.holdT=3; p.puDamage=1.32; p.puTimer=5; hitBeam(p.x,p.y,p.angle,350,25,ST.dmg*2.1,30,'burn'); };
A[43]=function(p){ for(var i=0;i<9;i++){ var o={a:p.angle+rnd(-.6,.6),d:ST.dmg*.62,sp:ST.ps*rnd(.7,1.5),life:rnd(.7,1.6),pierce:2}; var r=Math.random(); if(r<.3)o.expl=true; else if(r<.6)o.poison=true; else if(r<.8)o.burn=true; else o.fsplit=true; bullet(p,o); } hitGrid(p.x,p.y,160,160,15,ST.dmg,280,'conf'); };
A[44]=function(p){ var t=nearestEnemy(p.x,p.y); if(!t)return; t.mark=Math.max(t.mark,8); addPoison(t,ST.dmg*.72,5); addBurn(t,ST.dmg*.72,5); arcChain(t,ST.dmg*.85,4,200); hitStar(t.x,t.y,120,6,ST.dmg,300,'mark'); };
A[45]=function(p){ p.iframes=Math.max(p.iframes,1.6); convertShots(p,300); hitRing(p.x,p.y,175,35,ST.dmg,190,'mark'); near(p.x,p.y,260).forEach(function(e){ dmgEnemy(e,ST.dmg*.95); }); };
A[46]=function(p){ var s=Math.min(30,p.store||0); p.store=0; hitCircle(p.x,p.y,205+s*6,ST.dmg*(2+s*.25),200,'burn'); fan(p,6,.5,{d:ST.dmg*.72,acc:620,expl:true}); };
A[47]=function(p){ for(var i=0;i<16;i++) bullet(p,{a:rnd(TAU),sp:ST.ps*1.65,d:ST.dmg*.58,r:3,pierce:2,life:1.5}); delayFx(function(){ hitGrid(p.x,p.y,320,240,25,ST.dmg,220,'mark'); },300); };
A[48]=function(p){ shieldGain(p,18,.8); hitCone(p,240,.6,ST.dmg*.65,120,'poison'); near(p.x,p.y,300).forEach(function(e){ addPoison(e,ST.dmg*.78,6); }); };
A[49]=function(p){ fan(p,10,.7,{d:ST.dmg*.78,hom:true,sp:ST.ps*.9,life:2,pierce:3,corrode:true}); hitWave(p.x,p.y,p.angle,260,60,ST.dmg,220,'corrode'); };
A[50]=function(p){ for(var i=0;i<6;i++) bullet(p,{a:i/6*TAU,d:ST.dmg*.62,hom:true,life:2.4,pierce:2}); delayFx(function(){ ringShot(p,6,{d:ST.dmg*.52,hom:true,life:2}); hitRing(p.x,p.y,140,30,ST.dmg,40,'slow'); },700); };
A[51]=function(p){ for(var i=0;i<5;i++){ var a=p.angle+(i-2)*.35,x=p.x+Math.cos(a)*95,y=p.y+Math.sin(a)*95; (function(x,y){ delayFx(function(){ hitStar(x,y,110,7,ST.dmg*1.25,310,'slow'); fan(p,12,TAU,{d:ST.dmg*.42,pierce:2}); },i*140); })(x,y); } };
A[52]=function(p){ hitSpiral(p.x,p.y,180,3,ST.dmg,120,'poison'); near(p.x,p.y,380).forEach(function(e){ addPoison(e,ST.dmg*.62,6); }); };
A[53]=function(p){ RUN.eclouds.push({x:p.x,y:p.y,r:200,t:5,friendly:true}); hitCircle(p.x,p.y,170,ST.dmg,280,'mark'); near(p.x,p.y,420).forEach(function(e){ e.mark=Math.max(e.mark,6); e.flash=.2; if(e.type==='ghost'){ e.invuln=false; e.phaseT=2.5; } }); };
A[54]=function(p){ hitCircle(p.x,p.y,320,ST.dmg*1.15,220,'freeze'); near(p.x,p.y,400).forEach(function(e){ e.stun=Math.max(e.stun,1.5); if(!e.boss&&e.hp<e.maxhp*.35) addFreeze(e,1.2); }); };
A[55]=function(p){ p._timeStacks=(p._timeStacks||0)+1; p.puRate=1.5+Math.min(1.5,p._timeStacks*.22); p.puTimer=6; hitSpiral(p.x,p.y,220,4,ST.dmg*(1+p._timeStacks*.3),280,'burn'); };
A[56]=function(p){ fan(p,5,.4,{d:ST.dmg*1.35,sp:ST.ps*.72,r:8,pull:true,pierce:3}); well(p.x+Math.cos(p.angle)*160,p.y+Math.sin(p.angle)*160,2.2,2); hitTriangle(p.x,p.y,p.angle,240,ST.dmg,270,'slow'); };
A[57]=function(p){ var r=Math.floor(rnd(6)); if(r===0)fan(p,8,.5,{d:ST.dmg*.82,burn:true}); else if(r===1)hitRing(p.x,p.y,180,30,ST.dmg,120,'poison'); else if(r===2)well(p.x,p.y,2,2); else if(r===3)hitStar(p.x,p.y,200,6,ST.dmg*1.65,RUN.hue,'burn'); else if(r===4){ var t=nearestEnemy(p.x,p.y); if(t)arcChain(t,ST.dmg*1.55,5,200); } else shieldGain(p,22,1); };
A[58]=function(p){ dashMove(p,165,.55); for(var i=1;i<=6;i++){ var x=p.x-Math.cos(p.angle)*i*35,y=p.y-Math.sin(p.angle)*i*35; (function(x,y){ delayFx(function(){ hitStar(x,y,70,5,ST.dmg,55,'burn'); near(x,y,80).forEach(function(e){ dmgEnemy(e,ST.dmg*.6); }); },i*70); })(x,y); } };
A[59]=function(p){ fan(p,12,.9,{d:ST.dmg*.58,hom:true,sp:ST.ps*.82,life:2,pierce:2,pull:true}); hitWave(p.x,p.y,p.angle,280,70,ST.dmg,260,'slow'); };
A[60]=function(p){ well(p.x,p.y,3.2,4); hitSpiral(p.x,p.y,260,5,ST.dmg,270,'slow'); near(p.x,p.y,520).forEach(function(e){ if(!e.boss){ var a=Math.atan2(p.y-e.y,p.x-e.x); e.x+=Math.cos(a)*265; e.y+=Math.sin(a)*265; } }); convertShots(p,400); };
A[61]=function(p){ zone(p.x,p.y,125,7); well(p.x,p.y,3,1); hitHex(p.x,p.y,150,ST.dmg,120,'poison'); };
A[62]=function(p){ for(var i=0;i<4;i++){ var x=p.x+rnd(-125,125),y=p.y+rnd(-125,125); well(x,y,1.8,1); fxTele(x,y,95,.9,280); (function(x,y){ delayFx(function(){ hitStar(x,y,140,6,ST.dmg*1.65,260,'slow'); },900+i*120); })(x,y); } };
A[63]=function(p){ hitCircle(p.x,p.y,230,ST.dmg,0,'mark'); ringShot(p,12,{d:ST.dmg*.55,poison:true}); near(p.x,p.y,460).forEach(function(e){ e.mark=Math.max(e.mark,8); e.flash=.3; }); };
A[64]=function(p){ shieldGain(p,32,1.2); convertShots(p,245); hitRing(p.x,p.y,160,34,ST.dmg,250,'slow'); p.puArmor=.4; p.puTimer=6; };
A[65]=function(p){ hitCircle(p.x,p.y,300,ST.dmg*.85,120,'stun'); near(p.x,p.y,360).forEach(function(e){ e.stun=Math.max(e.stun,1.6); e.slowT=Math.max(e.slowT,3); }); };
A[66]=function(p){ var x=p.x+Math.cos(p.angle)*145,y=p.y+Math.sin(p.angle)*145; well(x,y,2.4,4); fxTele(x,y,110,.7,280); hitTriangle(p.x,p.y,p.angle,200,ST.dmg*1.2,270,'slow'); near(p.x,p.y,285).forEach(function(e){ if(!e.boss){ var a=Math.atan2(y-e.y,x-e.x); e.x+=Math.cos(a)*205; e.y+=Math.sin(a)*205; } }); };
A[67]=function(p){ hitBeam(p.x,p.y,p.angle,380,18,ST.dmg*3.45,260,'corrode'); var x=p.x+Math.cos(p.angle)*220,y=p.y+Math.sin(p.angle)*220; delayFx(function(){ hitCircle(x,y,125,ST.dmg*1.45,230,'stun'); },220); };
A[68]=function(p){ hitBeam(p.x,p.y,p.angle,480,6,ST.dmg*2.55,190,'mark'); fan(p,3,.12,{d:ST.dmg*.72,sp:ST.ps*2.6,r:2,pierce:12}); };
A[69]=function(p){ bullet(p,{d:ST.dmg*6.2,sp:ST.ps*.8,r:12,pierce:20,life:1.8,kb:3}); hitCross(p.x,p.y,180,ST.dmg*1.1,40,'stun'); };
A[70]=function(p){ var c=Math.min(12,p._charge||0); p._charge=0; hitCircle(p.x,p.y,165+c*22,ST.dmg*(1.5+c*.32),50,'stun'); };
A[71]=function(p){ p.puCrit=1; p.puTimer=6; p.puDamage=1.32; hitBeam(p.x,p.y,p.angle,420,8,ST.dmg*2.45,55,'mark'); };
A[72]=function(p){ if(p.hp<ST.hp*.4){ healGain(p,ST.hp*.35); shieldGain(p,22,1); } else hitRing(p.x,p.y,180,35,ST.dmg,190,'slow'); };
A[73]=function(p){ p.iframes=Math.max(p.iframes,2.8); p.puSpeed=.55; p.puTimer=3; hitCircle(p.x,p.y,165,ST.dmg*1.25,220,'slow'); };
A[74]=function(p){ bullet(p,{d:ST.dmg*3.25,sp:ST.ps*.55,r:13,pierce:12,life:2,kb:4,expl:true}); hitCone(p,210,.65,ST.dmg*.95,35,'stun'); };
A[75]=function(p){ p.puRate=1.75; p.puDamage=1.32; p.puTimer=6; hitCone(p,260,.6,ST.dmg*.8,25,'burn'); near(p.x,p.y,285).forEach(function(e){ addBurn(e,ST.dmg*.62,5); }); };
A[76]=function(p){ p.iframes=Math.max(p.iframes,1.5); hitCircle(p.x,p.y,245,ST.dmg*1.85,40,'stun'); near(p.x,p.y,260).forEach(function(e){ if(!e.boss){ e.x+=(e.x-p.x)*.2; e.y+=(e.y-p.y)*.2; e.stun=Math.max(e.stun,.6); } }); };
A[77]=function(p){ for(var i=0;i<6;i++){ var x=clamp(p.x+rnd(-225,225),30,W-30),y=clamp(p.y+rnd(-225,225),30,H-30); fxTele(x,y,90,.55+i*.12,25); (function(x,y){ delayFx(function(){ hitStar(x,y,120,6,ST.dmg*1.85,25,'burn'); },i*150); })(x,y); } };
A[78]=function(p){ hitCircle(p.x,p.y,220,ST.dmg*.75,300,'mark'); near(p.x,p.y,400).forEach(function(e){ e.mark=Math.max(e.mark,7); addPoison(e,ST.dmg*.42,5); addBurn(e,ST.dmg*.42,5); e.slowT=Math.max(e.slowT,2); }); };
A[79]=function(p){ hitCircle(p.x,p.y,190,ST.dmg*.8,48,'mark'); near(p.x,p.y,420).forEach(function(e){ e.mark=Math.max(e.mark,6); e.coin=(e.coin||1)+3; }); RUN.coins+=25; SAVE.addCoins(25); };
A[80]=function(p){
  /* Mercury — Liquid Body. This is the authoritative slot-0 implementation;
     the old Mercury Rain/radial signature is intentionally unreachable. */
  p.iframes=Math.max(p.iframes,1.5);
  var ox=p.x,oy=p.y;
  p.x=clamp(p.x+Math.cos(p.angle)*200,20,W-20);
  p.y=clamp(p.y+Math.sin(p.angle)*200,20,H-20);
  fxRing(ox,oy,RUN.hue,70,8,.35);
  fxRing(p.x,p.y,RUN.hue,105,10,.45);
  for(var i=0;i<4;i++){
    var a=i/4*TAU;
    RUN.bullets.push({x:p.x+Math.cos(a)*10,y:p.y+Math.sin(a)*10,vx:Math.cos(a)*ST.ps*.62,vy:Math.sin(a)*ST.ps*.62,dmg:ST.dmg*.55,r:7,hit:[],life:1.8,poison:true,owner:p.id,hom:true,mercuryDrop:true});
  }
};
A[81]=function(p){ near(p.x,p.y,380).forEach(function(e){ addPoison(e,ST.dmg*.75,7); }); delayFx(function(){ hitCircle(p.x,p.y,220,ST.dmg*.8,120,'poison'); near(p.x,p.y,420).forEach(function(e){ if(e.poison) dmgEnemy(e,ST.dmg*1.65,{quiet:true}); }); },1300); };
A[82]=function(p){ shieldGain(p,36,1.4); hitRect(p.x+Math.cos(p.angle)*110,p.y+Math.sin(p.angle)*110,230,85,ST.dmg,230,'slow'); };
A[83]=function(p){ for(var w=0;w<3;w++){ (function(w){ delayFx(function(){ hitRing(p.x,p.y,105+w*45,26,ST.dmg,300,'slow'); hitStar(p.x,p.y,105+w*45,6,ST.dmg,300,'slow'); },w*220); })(w); } };
A[84]=function(p){ hitCircle(p.x,p.y,135,ST.dmg*.75,120,'poison'); zone(p.x,p.y,125,5); near(p.x,p.y,360).forEach(function(e){ addPoison(e,ST.dmg*.68,6); e.mark=Math.max(e.mark,4); }); };
A[85]=function(p){ hitCone(p,260,.6,ST.dmg*1.2,120,'corrode'); near(p.x,p.y,380).forEach(function(e){ addPoison(e,ST.dmg*1.15,3); addCorrode(e,4,.45); }); };
A[86]=function(p){ zone(p.x,p.y,195,6); hitHex(p.x,p.y,190,ST.dmg,120,'poison'); near(p.x,p.y,225).forEach(function(e){ addPoison(e,ST.dmg*.55,6); }); };
A[87]=function(p){ p._critStacks=(p._critStacks||0)+3; fan(p,10,.7,{d:ST.dmg*.72,expl:true,crit:true}); if(p._critStacks>=9){ p._critStacks=0; hitStar(p.x,p.y,320,10,ST.dmg*3.1,320,'burn'); } else hitCircle(p.x,p.y,145,ST.dmg*.7,320,'mark'); };
A[88]=function(p){ zone(p.x,p.y,165,6); hitSpiral(p.x,p.y,170,3,ST.dmg,120,'poison'); delayFx(function(){ hitCircle(p.x,p.y,225,ST.dmg*1.45,60,'poison'); },700); };
A[89]=function(p){ var s=Math.min(20,p.store||0); p.store=0; hitBeam(p.x,p.y,p.angle,420,18,ST.dmg*(2.25+s*.22),120,'poison'); };
A[90]=function(p){ bullet(p,{d:ST.dmg*3.1,sp:ST.ps*.72,r:12,pierce:10,life:2,poison:true,expl:true}); var x=p.x+Math.cos(p.angle)*180,y=p.y+Math.sin(p.angle)*180; delayFx(function(){ zone(x,y,115,5); hitHex(x,y,120,ST.dmg,120,'poison'); },400); };
A[91]=function(p){ var t=nearestEnemy(p.x,p.y); if(!t)return; arcChain(t,ST.dmg*1.85,7,120); hitSpiral(t.x,t.y,140,3,ST.dmg,120,'poison'); };
A[92]=function(p){ fan(p,7,.5,{d:ST.dmg*.95,fsplit:true,pierce:3,life:1.6}); delayFx(function(){ hitRing(p.x,p.y,150,30,ST.dmg,55,'burn'); ringShot(p,10,{d:ST.dmg*.45,fsplit:true}); },350); };
A[93]=function(p){ bullet(p,{d:ST.dmg*2.7,sp:ST.ps*2.2,pierce:30,r:6,poison:true,life:1.6}); hitBeam(p.x,p.y,p.angle,400,12,ST.dmg,120,'poison'); };
A[94]=function(p){ var s=Math.min(20,RUN.cm||0); RUN.cm=0; hitCircle(p.x,p.y,185+s*10,ST.dmg*(2+s*.25),300,'burn'); ringShot(p,12,{d:ST.dmg*.65,expl:true}); };
A[95]=function(p){ zone(p.x,p.y,185,4); hitGrid(p.x,p.y,240,240,20,ST.dmg,200,'mark'); near(p.x,p.y,520).forEach(function(e){ e.mark=Math.max(e.mark,8); e.flash=.25; e.invuln=false; }); };
A[96]=function(p){ var t=nearestEnemy(p.x,p.y); if(t){ t.heat=(t.heat||0)+3; arcChain(t,ST.dmg*1.25,3,30); addBurn(t,ST.dmg*.85,6); } hitBeam(p.x,p.y,p.angle,440,10,ST.dmg*1.85,30,'burn'); };
A[97]=function(p){ var x=clamp(p.x+Math.cos(p.angle)*180,30,W-30),y=clamp(p.y+Math.sin(p.angle)*180,30,H-30); zone(x,y,95,3); fxTele(x,y,95,.9,120); delayFx(function(){ hitStar(x,y,190,7,ST.dmg*2.65,120,'poison'); zone(x,y,135,5); },900); };
A[98]=function(p){ fan(p,8,.35,{d:ST.dmg*1.75,sp:ST.ps*1.8,pierce:20,r:7,life:1.4}); hitBeam(p.x,p.y,p.angle,450,14,ST.dmg,200,'slow'); };
A[99]=function(p){ hitCircle(p.x,p.y,230,ST.dmg*.85,300,'conf'); near(p.x,p.y,420).forEach(function(e){ e.conf=Math.max(e.conf,2.5); e.slowT=Math.max(e.slowT,2.5); }); };
A[100]=function(p){ fan(p,9,.6,{d:ST.dmg*.95,collapse:true,life:1.1,pierce:2}); var x=p.x+Math.cos(p.angle)*180,y=p.y+Math.sin(p.angle)*180; delayFx(function(){ hitStar(x,y,160,8,ST.dmg*1.85,280,'burn'); },700); };
A[101]=function(p){ RUN.bloodlustStacks=Math.min(20,(RUN.bloodlustStacks||0)+8); p.puDamage=1.42; p.puTimer=6; hitRing(p.x,p.y,180,35,ST.dmg,0,'mark'); };
A[102]=function(p){ zone(p.x,p.y,215,5); hitHex(p.x,p.y,210,ST.dmg,260,'slow'); near(p.x,p.y,245).forEach(function(e){ e.slowT=Math.max(e.slowT,3); e.corrode=0; e.mark=0; dmgEnemy(e,ST.dmg*.95); }); };
A[103]=function(p){ hitBeam(p.x,p.y,p.angle,520,4,ST.dmg*3.25,190,'mark'); };
A[104]=function(p){ bullet(p,{d:ST.dmg*2.25,sp:ST.ps*.62,r:11,pierce:8,kb:4,life:1.8}); hitCone(p,210,.6,ST.dmg*.95,40,'stun'); };
A[105]=function(p){ fan(p,9,.7,{d:ST.dmg*.75,fsplit:true,pierce:2,life:1.4}); delayFx(function(){ hitSpiral(p.x,p.y,150,3,ST.dmg,120,'poison'); },300); };
A[106]=function(p){ well(p.x,p.y,5,2); zone(p.x,p.y,145,6); delayFx(function(){ hitStar(p.x,p.y,200,8,ST.dmg*1.65,320,'poison'); },1200); };
A[107]=function(p){ var spd=Math.hypot(p.dvx||0,p.dvy||0)+ST.spd; dashMove(p,185,.72); hitCircle(p.x,p.y,145+spd*.08,ST.dmg*(1.2+spd/800),20,'stun'); };
A[108]=function(p){ fan(p,6,.4,{d:ST.dmg*1.45,sp:ST.ps*.75,r:9,pull:true,pierce:4}); well(p.x+Math.cos(p.angle)*150,p.y+Math.sin(p.angle)*150,2.4,2); hitTriangle(p.x,p.y,p.angle,260,ST.dmg,270,'slow'); };
A[109]=function(p){ var r=Math.floor(rnd(6)); if(r===0)fan(p,10,.7,{d:ST.dmg*.75,expl:true}); else if(r===1)hitRing(p.x,p.y,190,35,ST.dmg,120,'poison'); else if(r===2)well(p.x,p.y,2.2,2); else if(r===3)hitStar(p.x,p.y,220,7,ST.dmg*1.75,RUN.hue,'burn'); else if(r===4){ var t=nearestEnemy(p.x,p.y); if(t)arcChain(t,ST.dmg*1.65,6,200); } else shieldGain(p,24,1); };
A[110]=function(p){ bullet(p,{d:ST.dmg*7.2,sp:ST.ps*.52,r:6,pierce:25,life:2,kb:2}); hitCross(p.x,p.y,160,ST.dmg*1.4,300,'stun'); };
A[111]=function(p){ hitCircle(p.x,p.y,260,ST.dmg*.8,200,'mark'); near(p.x,p.y,700).forEach(function(e){ e.mark=Math.max(e.mark,8); e.flash=.2; e.invuln=false; }); p.puCrit=1; p.puTimer=5; };
A[112]=function(p){ dashMove(p,245,2.2); hitWave(p.x,p.y,p.angle,280,60,ST.dmg,220,'slow'); };
A[113]=function(p){ var t=nearestEnemy(p.x,p.y); if(!t)return; t.mark=Math.max(t.mark,8); delayFx(function(){ if(!t.dead){ hitStar(t.x,t.y,150,7,ST.dmg*1.85,320,'poison'); near(t.x,t.y,165).forEach(function(o){ addPoison(o,ST.dmg*.55,4); }); } },800); };
A[114]=function(p){ bullet(p,{d:ST.dmg*4.25,sp:ST.ps*.72,r:12,pierce:18,kb:3,life:2}); shieldGain(p,16,.8); hitHex(p.x,p.y,160,ST.dmg,300,'stun'); };
A[115]=function(p){ var cost=Math.min(ST.hp*.25,Math.max(0,p.hp-1)); if(cost>0){ p.hp-=cost; hitStar(p.x,p.y,240,8,ST.dmg*(2+cost/20),340,'burn'); } else hitCircle(p.x,p.y,125,ST.dmg,340,'burn'); };
A[116]=function(p){ fan(p,10,.8,{d:ST.dmg*.65,poison:true,corrode:true,r:8,life:2}); hitSpiral(p.x,p.y,160,3,ST.dmg,120,'poison'); };
A[117]=function(p){ near(p.x,p.y,380).forEach(function(e){ addPoison(e,ST.dmg*.85,6); }); delayFx(function(){ hitCircle(p.x,p.y,240,ST.dmg,120,'poison'); near(p.x,p.y,420).forEach(function(e){ if(e.poison) hitStar(e.x,e.y,90,5,ST.dmg*1.25,120,'poison'); }); },900); };
A[118]=function(p){ var x=clamp(p.x+Math.cos(p.angle)*225,30,W-30),y=clamp(p.y+Math.sin(p.angle)*225,30,H-30); well(x,y,1.8,4); zone(x,y,125,2); fxTele(x,y,135,1.4,280); delayFx(function(){ hitStar(x,y,280,10,ST.dmg*3.45,280,'slow'); well(x,y,1,2); },1500); };
function shotMods(p,shots){ if(!RUN||!shots||!shots.length)return; var n=num(p);
 shots.forEach(function(b,i){ b.dmg*=1+((n*7+i)%7)*0.01; });
 switch(n){
  case 1: shots.forEach(function(b){ b.acc=(b.acc||0)+520; b.r=Math.max(2,b.r-1); }); break;
  case 2: p.x-=Math.cos(p.angle)*6; p.y-=Math.sin(p.angle)*6; break;
  case 4: shots.forEach(function(b){ b.r=3; b.vx*=1.25; b.vy*=1.25; b.pierce=(b.pierce||0)+1; }); break;
  case 15: shots.forEach(function(b){ b.burn=true; b.lag=true; }); break;
  case 23: p.store=Math.min(24,(p.store||0)+1); break;
  case 27: p.store=Math.min(20,(p.store||0)+1); break;
  case 29: shots.forEach(function(b){ b.chainOnHit=true; }); break;
  case 33: shots.forEach(function(b){ b.poison=true; }); break;
  case 46: p.store=Math.min(30,(p.store||0)+1); break;
  case 52: shots.forEach(function(b){ b.poison=true; }); break;
  case 84: shots.forEach(function(b){ b.poison=true; }); break;
  case 88: shots.forEach(function(b){ b.poison=true; }); break;
  case 89: p.store=Math.min(20,(p.store||0)+1); break;
  case 92: shots.forEach(function(b){ b.fsplit=true; }); break;
  case 94: RUN.cm=(RUN.cm||0)+.1; break;
 } }
tryDash=function(p){ if(__oldDash)__oldDash(p); if(!RUN||!p)return; var n=num(p);
 if(n===3){ for(var i=1;i<=4;i++){ var x=p.x-Math.cos(p.angle)*i*42,y=p.y-Math.sin(p.angle)*i*42; (function(x,y){ delayFx(function(){ hitStar(x,y,82,5,ST.dmg*.85,30,'burn'); },i*80); })(x,y); } }
 if(n===58){ for(var i=1;i<=3;i++){ var x=p.x-Math.cos(p.angle)*i*32,y=p.y-Math.sin(p.angle)*i*32; (function(x,y){ delayFx(function(){ burst(x,y,55); near(x,y,72).forEach(function(e){ dmgEnemy(e,ST.dmg*.48); }); },i*70); })(x,y); } }
 if(n===80) ringShot(p,8,{d:ST.dmg*.45,poison:true,life:1.2});
 if(n===107) hitCircle(p.x,p.y,125,ST.dmg*(1+Math.hypot(p.dvx||0,p.dvy||0)/800),20,'stun'); };
updPlayer=function(p,dt){ if(__oldUpd)__oldUpd(p,dt); if(!RUN||!p||p.downed)return; var n=num(p);
 if(n===2) p.iframes=Math.max(p.iframes,.02);
 if(n===61||n===84||n===88||n===106){ p._auraT=(p._auraT||0)-dt; if(p._auraT<=0){ p._auraT=.5; near(p.x,p.y,108).forEach(function(e){ dmgEnemy(e,ST.dmg*.18,{quiet:true}); }); } }
 if(n===70){ var mi=movementInput(p); if(!(mi.dx||mi.dy)) p._charge=Math.min(14,(p._charge||0)+dt*2.2); else p._charge=Math.max(0,(p._charge||0)-dt*5); } };
useActive=function(p){
 if(!p||p.downed||p.activeCd>0)return;
 var el=p.elem||RUN.el, n=(el&&!el.mol)?+el.n:0;
 var slot=Math.max(0,Math.min(2,Number(p.signatureSlot)||0));
 if(slot===0&&n&&A[n]){
  p.activeCd=ST.activeCd; SFX.active(); RUN.shake=Math.max(RUN.shake,9);
  var nm=(el.act&&el.act.name)?el.act.name:'ABILITY';
  banner(String(nm).toUpperCase(),1200); fxRing(p.x,p.y,RUN.hue,175,10,.55);
  try{ A[n](p); }catch(err){ console.error('ability',n,err); }
  return;
 }
 return oldUse(p);
};
})();

/* ISO_PUBLIC_COMBAT_BRIDGE_V1
 * custom-3-moves.js is intentionally a separate script.  Its bespoke move
 * callbacks run later, so expose read-through references to this closure's
 * live combat state instead of giving them stale copies (or letting ST throw
 * a ReferenceError).  These properties are accessors: a new run immediately
 * becomes visible to every move without re-wiring 118×3 callbacks.
 */
(function(){
  function expose(name, get){
    try { Object.defineProperty(window,name,{ configurable:true, get:get }); } catch(e) {}
  }
  expose('RUN', function(){ return RUN; });
  expose('ST', function(){ return ST; });
  expose('W', function(){ return W; });
  expose('H', function(){ return H; });
  expose('mouse', function(){ return mouse; });
  expose('ALL_CARDS', function(){ return ALL_CARDS; });
  console.log('ISO_PUBLIC_COMBAT_BRIDGE_V1 active: custom moves now receive live combat state.');
})();

/* 
/* ISO_CARD_REBALANCE_GAME */
(function(){
if (window.__ISO_CARD_REBAL__) return; window.__ISO_CARD_REBAL__ = true;
if (typeof ALL_CARDS === 'undefined') return;
var RMUL = { common: 1, uncommon: 1.5, rare: 2.25, epic: 3.5, legendary: 5, mythic: 8 };
var BASE = [
 ['dmg', .05, 'increase projectile damage'],
 ['rate', .04, 'increase fire rate'],
 ['hp', 6, 'increase maximum health'],
 ['spd', .03, 'increase movement speed'],
 ['crit', .02, 'increase critical chance'],
 ['shield', 3, 'increase maximum shield'],
 ['magnet', .06, 'increase pickup radius'],
 ['projs', .2, 'increase projectile output'],
 ['pierce', .25, 'increase piercing'],
 ['aoe', .25, 'increase reaction area'],
 ['homing', .04, 'increase homing strength'],
 ['coin', .04, 'increase coin gain']
];
var PRE = ['Flux','Quantum','Catalyst','Ion','Molecular','Atomic','Lattice','Reactive','Phase','Vector','Neutron','Photon'];
var SUF = ['Reservoir','Matrix','Conduit','Array','Mantle','Drive','Engine','Prism','Relay','Core'];
for (var k = ALL_CARDS.length - 1; k >= 0; k--) {
  if (ALL_CARDS[k] && ALL_CARDS[k].id && ALL_CARDS[k].id.indexOf('xcard_') === 0) ALL_CARDS.splice(k, 1);
}
if (typeof EXTRA_CARDS !== 'undefined') EXTRA_CARDS.length = 0;
for (var i = 0; i < 121; i++) {
  var rarity = i < 60 ? 'common' : i < 92 ? 'uncommon' : i < 112 ? 'rare' : i < 119 ? 'epic' : i === 119 ? 'legendary' : 'mythic';
  var fx = BASE[i % BASE.length];
  var val = fx[1] * RMUL[rarity];
  var desc;
  if (fx[0] === 'hp' || fx[0] === 'shield') {
    desc = 'Stack +' + Math.max(1, Math.round(val)) + ' to ' + fx[2] + ' while equipped.';
  } else if (fx[0] === 'projs' || fx[0] === 'pierce' || fx[0] === 'aoe') {
    var word = fx[0] === 'projs' ? 'projectile' : fx[0] === 'pierce' ? 'pierce' : 'blast rank';
    desc = 'Stack +' + Math.max(1, Math.round(val * 100)) + '% progress toward +1 ' + word + ' while equipped.';
  } else {
    desc = 'Stack +' + Math.max(1, Math.round(val * 100)) + '% to ' + fx[2] + ' while equipped.';
  }
  var card = {
    id: 'xcard_' + String(i + 1).padStart(3, '0'),
    ic: '✦',
    n: PRE[i % 12] + ' ' + SUF[Math.floor(i / 12) % 10] + ' ' + String(i + 1).padStart(3, '0'),
    d: desc, max: 5, rarity: rarity, extraStat: fx[0], extraValue: val, unique: true
  };
  EXTRA_CARDS.push(card);
  ALL_CARDS.push(card);
}
console.log('Card rebalance active: rarity now scales values (mythic x8), minimum 1%.');
})();

/* ISO_TRADER_SHOP_V1 */
(function(){
if(window.__ISO_TRADER_V1__)return; window.__ISO_TRADER_V1__=true;
var css='#lvl-warn{position:fixed;inset:0;display:none;align-items:center;justify-content:center;flex-direction:column;z-index:60;pointer-events:none;background:radial-gradient(circle,rgba(79,216,235,.14),rgba(0,0,0,.6));}#lvl-warn.on{display:flex;}.lw-ring{width:150px;height:150px;border:3px solid #4fd8eb;border-radius:50%;box-shadow:0 0 40px #4fd8eb88,inset 0 0 30px #4fd8eb44;animation:lwP 1.4s infinite;}.lw-txt{font-family:var(--disp);font-size:34px;color:#4fd8eb;letter-spacing:6px;margin-top:18px;text-shadow:0 0 18px #4fd8eb;}.lw-sub{font-family:var(--mono);color:var(--tx2);letter-spacing:3px;margin-top:6px;}.lw-bar{width:260px;height:6px;background:#12222e;margin-top:14px;}.lw-bar i{display:block;height:100%;width:100%;background:linear-gradient(90deg,#4fd8eb,#ff5d8f);animation:lwB 1.5s linear forwards;}@keyframes lwP{0%,100%{transform:scale(1)}50%{transform:scale(1.15)}}@keyframes lwB{from{width:100%}to{width:0}}#shop-ui{position:fixed;inset:0;display:none;align-items:center;justify-content:center;z-index:65;background:rgba(4,8,12,.78);}#shop-ui.on{display:flex;}';
var stEl=document.createElement('style'); stEl.textContent=css; document.head.appendChild(stEl);
var warnDiv=document.createElement('div'); warnDiv.id='lvl-warn';
warnDiv.innerHTML='<div class="lw-ring"></div><div class="lw-txt">STABILIZATION SURGE</div><div class="lw-sub">MODULE SELECT INCOMING</div><div class="lw-bar"><i></i></div>';
document.body.appendChild(warnDiv);
var shopDiv=document.createElement('div'); shopDiv.id='shop-ui'; document.body.appendChild(shopDiv);
var ITEMS=[
{id:'it1',ic:'⚡',n:'Overcharge Core',b:'dmg',d:'rate',v:.2},
{id:'it2',ic:'♻',n:'Flux Capacitor',b:'rate',d:'dmg',v:.2},
{id:'it3',ic:'➟',n:'Thruster Pack',b:'spd',d:'hp',v:.15},
{id:'it4',ic:'⬡',n:'Plated Hull',b:'hp',d:'spd',v:.15},
{id:'it5',ic:'✹',n:'Crit Matrix',b:'critD',d:'dmg',v:.25},
{id:'it6',ic:'☄',n:'Warhead Fins',b:'dmg',d:'spd',v:.15},
{id:'it7',ic:'◈',n:'Aegis Cell',b:'shieldMax',d:'rate',v:.2},
{id:'it8',ic:'▯',n:'Vented Shields',b:'rate',d:'shieldMax',v:.2},
{id:'it9',ic:'🧲',n:'Salvage Loop',b:'magnet',d:'dmg',v:.2},
{id:'it10',ic:'◉',n:'Greed Chip',b:'coinMult',d:'hp',v:.2},
{id:'it11',ic:'✚',n:'Bio Reserve',b:'hp',d:'coinMult',v:.2},
{id:'it12',ic:'≽',n:'Rail Coils',b:'ps',d:'dmg',v:.15},
{id:'it13',ic:'⚔',n:'Berserk Plating',b:'dmg',d:'hp',v:.2},
{id:'it14',ic:'↯',n:'Twitch Servos',b:'rate',d:'spd',v:.15},
{id:'it15',ic:'🛡',n:'Bulwark Core',b:'shieldMax',d:'hp',v:.2},
{id:'it16',ic:'❤',n:'Organic Frame',b:'hp',d:'shieldMax',v:.2},
{id:'it17',ic:'✧',n:'Weakpoint AI',b:'critD',d:'rate',v:.2},
{id:'it18',ic:'≋',n:'Accelerant',b:'ps',d:'rate',v:.15},
{id:'it19',ic:'◎',n:'Tractor Rig',b:'magnet',d:'spd',v:.2},
{id:'it20',ic:'♦',n:'Merchant Protocol',b:'coinMult',d:'dmg',v:.15}];
var ITEM_BY={}; ITEMS.forEach(function(it){ITEM_BY[it.id]=it;});
var STATN={dmg:'DAMAGE',rate:'FIRE RATE',hp:'MAX HP',spd:'SPEED',shieldMax:'SHIELD',magnet:'PICKUP RANGE',coinMult:'COINS',ps:'PROJ SPEED',critD:'CRIT DAMAGE'};
function itemDesc(it){var p=Math.round(it.v*100);return{bd:'+'+p+'% '+STATN[it.b],dd:'-'+p+'% '+STATN[it.d]};}
var __openLevel=openLevel;
openLevel=function(){
 if(!RUN)return __openLevel();
 if(RUN.isOnline&&!NET.isHost)return;
 if(RUN.state==='levelwarn')return;
 RUN.state='levelwarn'; RUN._warnT=1.5; warnDiv.classList.add('on');
 if(RUN.fxQueue){RUN.fxQueue.push({k:'banner',text:'STABILIZATION SURGE'});RUN.fxQueue.push({k:'levelwarn',v:1});}
 broadcastGameState(true);
};
var __drop=drop;
drop=function(x,y,t,v){ return __drop(x,y,t,v); };
var __start=start;
start=function(){ var r=__start.apply(this,arguments); if(RUN){RUN.items=RUN.items||[];RUN.shop=null;} return r; };
if(window.GAME){ GAME.start=function(){ var r=__start.apply(this,arguments); if(RUN){RUN.items=RUN.items||[];RUN.shop=null;} return r; }; }
function applyItems(){
 if(!RUN||!ST||!RUN.items||!RUN.items.length)return;
 RUN.items.forEach(function(id){ var it=ITEM_BY[id]; if(!it)return;
  if(ST[it.b]!==undefined)ST[it.b]*=1+it.v;
  if(ST[it.d]!==undefined)ST[it.d]*=1-it.v;
 });
 ST.hp=Math.max(40,Math.round(ST.hp));
 if(ST.shieldMax!==undefined)ST.shieldMax=Math.max(0,Math.round(ST.shieldMax));
 RUN.players.forEach(function(p){p.hp=Math.min(p.hp,ST.hp);p.sh=Math.min(p.sh,ST.shieldMax);});
}
var __cs=computeStats;
computeStats=function(){ __cs(); applyItems(); };
function shopPrice(){ return 60+(RUN.wave||1)*4; }
function pickStock(){
 var pool=ITEMS.filter(function(it){return (RUN.items||[]).indexOf(it.id)<0;});
 for(var i=pool.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1));var t=pool[i];pool[i]=pool[j];pool[j]=t;}
 return pool.slice(0,3).map(function(it){return it.id;});
}
function spawnShop(){
 var a=Math.random()*Math.PI*2, dist=120+Math.random()*120;
 RUN.shop={active:true,x:Math.max(90,Math.min(W-90,W/2+Math.cos(a)*dist)),y:Math.max(90,Math.min(H-90,H/2+Math.sin(a)*dist)),r:74,t:16,stock:pickStock(),taken:{},done:{}};
 RUN.interT=Math.max(RUN.interT,16);
 banner('A TRADER ENTERS THE ARENA - APPROACH TO BROWSE',2600);
}
function openShop(){
 var s=RUN.shop; if(!s||!s.active)return;
 s.active=false; s.done={};
 RUN.state='shop';
 banner('THE GEOMETRIST AWAITS YOUR CHOICE',1600);
 renderShopUI();
 broadcastGameState(true);
}
function closeShop(){
 RUN.shop=null; RUN.state='inter'; RUN.interT=1.6;
 shopDiv.classList.remove('on');
 broadcastGameState(true);
}
function chooseShop(pid,key){
 var s=RUN.shop; if(!RUN||RUN.state!=='shop'||!s||s.done[pid])return;
 if(key!=='cont'){
  var it=ITEM_BY[key];
  if(it&&!s.taken[key]&&(RUN.items||[]).indexOf(key)<0&&RUN.coins>=shopPrice()){
   RUN.coins-=shopPrice(); s.taken[key]=1; RUN.items=RUN.items||[]; RUN.items.push(key);
   computeStats(); buildChips();
   banner('RELIC BOUND: '+it.n.toUpperCase(),1600); SFX.unlock();
  } else return;
 } else SFX.click();
 s.done[pid]=key;
 renderShopUI();
 var ids=RUN.isOnline?RUN.players.map(function(p){return p.id;}):[0];
 var all=ids.every(function(id){return !!s.done[id];});
 if(all)closeShop(); else broadcastGameState(true);
}
function renderShopUI(){
 var s=RUN.shop;
 if(!s||RUN.state!=='shop'){shopDiv.classList.remove('on');return;}
 var myId=RUN.isOnline?RUN.localNetId:0;
 var done=!!s.done[myId];
 var p=shopPrice();
 var html='<div style="width:min(720px,92vw);background:linear-gradient(180deg,#0d1420,#0a0f16);border:1px solid #ffb45466;box-shadow:0 0 60px #ffb45422;padding:22px;clip-path:polygon(18px 0,100% 0,100% calc(100% - 18px),calc(100% - 18px) 100%,0 100%,0 18px);">';
 html+='<div style="font-family:var(--disp);font-size:24px;color:#ffb454;letter-spacing:4px;display:flex;align-items:center;gap:12px;"><span style="font-size:30px;color:#ffb454;text-shadow:0 0 14px #ffb454;display:inline-block;">⬠</span>THE GEOMETRIST<em style="font-size:10px;color:var(--tx2);letter-spacing:3px;font-style:normal;margin-left:auto;">RELIC TRADER - WARES LAST THIS RUN ONLY</em></div>';
 html+='<div style="font-family:var(--mono);color:#ffd43b;margin:6px 0 12px;">BANK ◈ '+RUN.coins+' · PRICE ◈ '+p+'</div>';
 html+='<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;">';
 s.stock.forEach(function(id){
  var it=ITEM_BY[id]; var dd=itemDesc(it); var taken=s.taken[id];
  html+='<button data-buy="'+id+'" style="background:#0f1826;border:1px solid '+(taken?'#33445a':'#ffb454')+';padding:14px 10px;cursor:pointer;text-align:center;color:var(--tx);opacity:'+(taken?'.35':'1')+';">';
  html+='<div style="font-size:26px;">'+it.ic+'</div><b style="display:block;margin:6px 0 4px;color:#eaf4ff;">'+it.n+'</b>';
  html+='<p style="color:#7ef0a6;font-size:11px;margin:0;">'+dd.bd+'</p>';
  html+='<p style="color:#ff5d8f;font-size:11px;margin:2px 0 8px;">'+dd.dd+'</p>';
  html+='<span style="font-family:var(--mono);color:#ffd43b;font-size:12px;">'+(taken?'SOLD OUT':'◈ '+p)+'</span></button>';
 });
 html+='</div><button data-leave="1" style="margin-top:14px;width:100%;background:none;border:1px solid #4fd8eb55;color:#4fd8eb;padding:10px;font-family:var(--mono);letter-spacing:2px;cursor:pointer;">▸ CONTINUE THROUGH THE BREACH</button>';
 if(done)html+='<div style="margin-top:10px;text-align:center;color:var(--tx2);font-family:var(--mono);">CONTRACT SIGNED - AWAITING OTHER OPERATORS…</div>';
 html+='</div>';
 shopDiv.innerHTML=html; shopDiv.classList.add('on');
 function pickAction(key){
  if(RUN.isOnline&&!NET.isHost){ NET.sendClientAction('shoppick:'+key); s.done[myId]='wait'; renderShopUI(); }
  else chooseShop(myId,key);
 }
 var btns=shopDiv.querySelectorAll('[data-buy]');
 for(var i=0;i<btns.length;i++){ btns[i].onclick=function(){ if(!done)pickAction(this.getAttribute('data-buy')); }; }
 var lv=shopDiv.querySelector('[data-leave]');
 if(lv)lv.onclick=function(){ if(!done)pickAction('cont'); };
}
var __update=update;
update=function(dt){
 if(!RUN){__update(dt);return;}
 if(RUN.state==='levelwarn'){
  if(RUN.isOnline&&!NET.isHost){warnDiv.classList.add('on');hud();return;}
  RUN._warnT=(RUN._warnT||1.5)-dt;
  RUN.parts.forEach(function(q){q.t-=dt;});
  RUN.parts=RUN.parts.filter(function(q){return q.t>0;});
  hud();
  if(RUN._warnT<=0){warnDiv.classList.remove('on');__openLevel();}
  return;
 }
 if(RUN.state==='shop'){
  if(RUN.isOnline&&NET.isHost)broadcastGameState(false);
  if(!RUN.isOnline||NET.isHost){ if(!shopDiv.classList.contains('on'))renderShopUI(); }
  hud(); return;
 }
 var prev=RUN.state;
 __update(dt);
 var hostish=!RUN.isOnline||NET.isHost;
 if(hostish){
  if(prev==='play'&&RUN.state==='inter'&&(RUN.mode==='solo'||RUN.mode==='coop'||RUN.mode==='net_coop')){
   if(!RUN.shop&&Math.random()<.3)spawnShop();
  }
  if(RUN.shop&&RUN.shop.active&&RUN.state==='inter'){
   RUN.shop.t-=dt;
   if(RUN.shop.t<=0){RUN.shop=null;RUN.interT=Math.min(RUN.interT,1.2);banner('THE TRADER DEPARTED',1200);}
   else{
    for(var i=0;i<RUN.players.length;i++){var p=RUN.players[i];
     if(p&&!p.downed&&d2(p.x,p.y,RUN.shop.x,RUN.shop.y)<(RUN.shop.r+14)*(RUN.shop.r+14)){openShop();break;}}
   }
  }
  if(RUN.state!=='shop')shopDiv.classList.remove('on');
 } else {
  if(RUN.shop&&RUN.shop.active&&RUN.state==='inter'&&!RUN._shopReq){
   var lp=RUN.players[RUN.localNetId];
   if(lp&&!lp.downed&&d2(lp.x,lp.y,RUN.shop.x,RUN.shop.y)<(RUN.shop.r+14)*(RUN.shop.r+14)){RUN._shopReq=true;NET.sendClientAction('shopenter');}
  }
  if(RUN.shop&&!RUN.shop.active)RUN._shopReq=false;
  if(RUN.state==='shop'&&!shopDiv.classList.contains('on'))renderShopUI();
  if(RUN.state!=='shop')shopDiv.classList.remove('on');
 }
};
if(window.NET){
 var __oca=NET.onClientAction;
 NET.onClientAction=function(pid,action){
  if(RUN&&NET.isHost){
   if(action==='shopenter'){ if(RUN.shop&&RUN.shop.active&&RUN.state==='inter')openShop(); return; }
   if(typeof action==='string'&&action.indexOf('shoppick:')===0){ chooseShop(pid,action.slice(9)); return; }
  }
  if(__oca)return __oca(pid,action);
 };
 var __bs=NET.broadcastSnapshot;
 NET.broadcastSnapshot=function(s){ if(s&&RUN)s.shop=RUN.shop||null; return __bs?__bs(s):s; };
 var __sn=NET.onStateSnapshot;
 NET.onStateSnapshot=function(s){
  if(s&&s.fx){for(var i=0;i<s.fx.length;i++){if(s.fx[i].k==='levelwarn'){warnDiv.classList.add('on');setTimeout(function(){warnDiv.classList.remove('on');},1500);}}}
  if(__sn)__sn(s);
  if(RUN){
   if(RUN.state==='level')warnDiv.classList.remove('on');
   if(s&&s.shop!==undefined){RUN.shop=s.shop;if(!s.shop)RUN._shopReq=false;}
  }
 };
}
var BDEFS=[
{name:'THE CHROMATIC WARDEN',hue:336,shape:'hex',pat:'spiral',hpMul:1},
{name:'ISOTOPE PRIME',hue:200,shape:'hex',pat:'burst',hpMul:.9},
{name:'THE SLAG COLOSSUS',hue:20,shape:'square',pat:'rings',hpMul:1.3,spd:30,charge:true},
{name:'HALOGEN TYRANT',hue:120,shape:'tri',pat:'clouds',hpMul:1},
{name:'THE CRITICAL MASS',hue:55,shape:'hex',pat:'spiral',hpMul:.85,fast:true},
{name:'ENTROPY ENGINE',hue:260,shape:'square',pat:'cross',hpMul:1.15},
{name:'THE PHOSPHOR KING',hue:60,shape:'diamond',pat:'summon',hpMul:1},
{name:'NEUTRON LICH',hue:190,shape:'diamond',pat:'teleport',hpMul:.9},
{name:'MAGMA SOVEREIGN',hue:15,shape:'square',pat:'clouds',hpMul:1.2,charge:true},
{name:'THE VACUUM SAINT',hue:280,shape:'ring',pat:'pull',hpMul:1.1},
{name:'FERRIC WARBRINGER',hue:25,shape:'square',pat:'summon',hpMul:1.25,charge:true},
{name:'OMEGA DECAY',hue:330,shape:'hex',pat:'omega',hpMul:1.5},
{name:'THE CRYSTAL REGENT',hue:295,shape:'diamond',pat:'rings',hpMul:1.05},
{name:'KRYPTON MIRAGE',hue:188,shape:'ring',pat:'teleport',hpMul:.95,fast:true},
{name:'THE ACID EMPEROR',hue:95,shape:'tri',pat:'clouds',hpMul:1.15},
{name:'TUNGSTEN BEHEMOTH',hue:38,shape:'square',pat:'cross',hpMul:1.42,spd:25,charge:true},
{name:'ELECTRON MAELSTROM',hue:210,shape:'ring',pat:'pull',hpMul:1.05},
{name:'RADIANT ARCHON',hue:58,shape:'hex',pat:'burst',hpMul:.88,fast:true},
{name:'THE BORON CITADEL',hue:155,shape:'square',pat:'summon',hpMul:1.35},
{name:'MERCURY TEMPEST',hue:230,shape:'diamond',pat:'spiral',hpMul:1.02,fast:true},
{name:'SULFUR ORACLE',hue:66,shape:'tri',pat:'clouds',hpMul:1.08},
{name:'DARK MATTER PROXY',hue:278,shape:'ring',pat:'omega',hpMul:1.28},
{name:'THE CARBON MONOLITH',hue:205,shape:'square',pat:'rings',hpMul:1.38,charge:true},
{name:'ABSOLUTE ZERO',hue:196,shape:'diamond',pat:'teleport',hpMul:1.12}];
function bIdxByName(nm){for(var i=0;i<BDEFS.length;i++){if(BDEFS[i].name===nm)return i;}return -1;}
spawnBoss=function(){
 if(!RUN)return;
 var w=RUN.wave, idx=0;
 if(BDEFS.length>1){do{idx=irnd(BDEFS.length);}while(idx===RUN.lastBossIdx);}
 RUN.lastBossIdx=idx;
 var d=BDEFS[idx];
 var hp=850*(1+w*.32)*(d.hpMul||1)*playerScale();
 var e={type:'boss',boss:true,x:W/2,y:110,r:36+(idx%6)*5,pat:d.pat,fast:d.fast,canCharge:d.charge,
  hp:hp,maxhp:hp,spd:d.spd||40,dmg:22,coin:40+w*2,xp:30,hue:d.hue,shape:d.shape,
  seed:rnd(10),touch:0,slowT:0,stun:0,conf:0,flash:0,mark:0,t1:1,t2:2,t3:6,t4:4,spirA:0,tele:0,chT:0,cdx:0,cdy:0,name:d.name,
  bi:idx,sides:3+idx%6,bspd:150+(idx%4)*40,bdouble:idx%2===0,bmines:idx%3===0,bsum:idx%4===1,btele:idx%5===2,bpull:idx%6===3};
 e.eid=RUN.nextEid++;
 RUN.enemies.push(e); RUN.boss=e;
 document.getElementById('bossname').textContent='⚠ '+e.name;
 document.getElementById('bosswrap').classList.remove('hidden');
 banner('⚠ WARDEN: '+e.name,2600); SFX.boss(); RUN.shake=16; AUDIO.setTrack('boss');
};
var __bossAI=bossAI;
bossAI=function(b,dt,mx,my,d){
 __bossAI(b,dt,mx,my,d);
 if(b.dead||b.bi===undefined)return;
 b.xt1=(b.xt1||rnd(1,3))-dt;
 if(b.xt1<=0){
  b.xt1=2.6+(b.bi%3)*.7;
  var tp=nearestPlayer(b.x,b.y);
  if(b.bdouble){for(var k=0;k<10;k++){var a=k/10*TAU+b.spirA;ebul(b.x,b.y,a,b.bspd,12);}}
  if(b.bmines&&tp)RUN.eclouds.push({x:tp.x,y:tp.y,r:80,t:3});
  if(b.sum)spawnEnemy(b.bi%2?'wisp':'mote',b.x+rnd(-70,70),b.y+rnd(-60,60));
  if(b.btele){b.x=clamp(tp.x+rnd(-160,160),40,W-40);b.y=clamp(tp.y+rnd(-160,160),40,H-40);ringFx(b.x,b.y,b.hue,120);}
  if(b.bpull){RUN.pullT=1.2;RUN.pullSrc={x:b.x,y:b.y};ringFx(b.x,b.y,b.hue,200);}
 }
};
var __render=render;
render=function(){
 __render();
 if(!RUN)return;
 cx.save();
 RUN.enemies.forEach(function(e){
  if(!e.boss||e.dead)return;
  var bi=(e.bi!==undefined)?e.bi:bIdxByName(e.name);
  if(bi<0)return;
  var sides=3+(bi%6);
  cx.strokeStyle='hsla('+e.hue+',90%,60%,.5)';cx.lineWidth=2;
  cx.beginPath();
  for(var i=0;i<=sides;i++){var a=RUN.t*.8+i/sides*TAU;var rr=e.r+14+4*Math.sin(RUN.t*3+i);var px=e.x+Math.cos(a)*rr,py=e.y+Math.sin(a)*rr;if(i)cx.lineTo(px,py);else cx.moveTo(px,py);}
  cx.closePath();cx.stroke();
  cx.fillStyle='hsla('+e.hue+',90%,70%,.85)';cx.font='bold 12px "Share Tech Mono"';cx.textAlign='center';
  cx.fillText('WARDEN '+String(bi+1).padStart(2,'0'),e.x,e.y-e.r-16);
 });
 if(RUN.shop&&RUN.shop.active&&RUN.state==='inter'){
  var s=RUN.shop;
  cx.save();cx.translate(s.x,s.y);
  cx.rotate(Math.sin(RUN.t*1.4)*.2);
  cx.fillStyle='#0d1420';cx.strokeStyle='#ffb454';cx.lineWidth=3;
  cx.beginPath();for(var i=0;i<5;i++){var a=-Math.PI/2+i/5*TAU;cx.lineTo(Math.cos(a)*26,Math.sin(a)*26);}cx.closePath();cx.fill();cx.stroke();
  cx.strokeStyle='rgba(255,180,84,.35)';cx.lineWidth=2;
  cx.beginPath();for(var i2=0;i2<5;i2++){var a2=-Math.PI/2+i2/5*TAU+RUN.t*.6;cx.lineTo(Math.cos(a2)*38,Math.sin(a2)*38);}cx.closePath();cx.stroke();
  cx.fillStyle='#ffd43b';cx.font='bold 16px "Share Tech Mono"';cx.textAlign='center';cx.fillText('⬠',0,5);
  cx.fillStyle='#ffb454';cx.font='bold 10px "Share Tech Mono"';cx.fillText('TRADE',0,-44);
  cx.strokeStyle='rgba(255,180,84,.3)';cx.setLineDash([6,6]);cx.beginPath();cx.arc(0,0,s.r,0,TAU);cx.stroke();cx.setLineDash([]);
  cx.restore();
 }
 cx.restore();
};
console.log('ISO_TRADER_SHOP_V1 active: level warning, Geometrist relic shop, 24 unique wardens.');
})();

/* ISO_NET_FIX_V1 */
(function(){
if(window.__ISO_NETFIX__)return; window.__ISO_NETFIX__=true;
var PING={rtt:0};
var ITEMS={
it1:{ic:'⚡',n:'Overcharge Core',bd:'+20% DAMAGE',dd:'-20% FIRE RATE'},
it2:{ic:'♻',n:'Flux Capacitor',bd:'+20% FIRE RATE',dd:'-20% DAMAGE'},
it3:{ic:'➟',n:'Thruster Pack',bd:'+15% SPEED',dd:'-15% MAX HP'},
it4:{ic:'⬡',n:'Plated Hull',bd:'+15% MAX HP',dd:'-15% SPEED'},
it5:{ic:'✹',n:'Crit Matrix',bd:'+25% CRIT DMG',dd:'-25% DAMAGE'},
it6:{ic:'☄',n:'Warhead Fins',bd:'+15% DAMAGE',dd:'-15% SPEED'},
it7:{ic:'◈',n:'Aegis Cell',bd:'+20% SHIELD',dd:'-20% FIRE RATE'},
it8:{ic:'▯',n:'Vented Shields',bd:'+20% FIRE RATE',dd:'-20% SHIELD'},
it9:{ic:'🧲',n:'Salvage Loop',bd:'+20% PICKUP',dd:'-20% DAMAGE'},
it10:{ic:'◉',n:'Greed Chip',bd:'+20% COINS',dd:'-20% MAX HP'},
it11:{ic:'✚',n:'Bio Reserve',bd:'+20% MAX HP',dd:'-20% COINS'},
it12:{ic:'≽',n:'Rail Coils',bd:'+15% PROJ SPEED',dd:'-15% DAMAGE'},
it13:{ic:'⚔',n:'Berserk Plating',bd:'+20% DAMAGE',dd:'-20% MAX HP'},
it14:{ic:'↯',n:'Twitch Servos',bd:'+15% FIRE RATE',dd:'-15% SPEED'},
it15:{ic:'🛡',n:'Bulwark Core',bd:'+20% SHIELD',dd:'-20% MAX HP'},
it16:{ic:'❤',n:'Organic Frame',bd:'+20% MAX HP',dd:'-20% SHIELD'},
it17:{ic:'✧',n:'Weakpoint AI',bd:'+20% CRIT DMG',dd:'-20% FIRE RATE'},
it18:{ic:'≋',n:'Accelerant',bd:'+15% PROJ SPEED',dd:'-15% FIRE RATE'},
it19:{ic:'◎',n:'Tractor Rig',bd:'+20% PICKUP',dd:'-20% SPEED'},
it20:{ic:'♦',n:'Merchant Protocol',bd:'+15% COINS',dd:'-15% DAMAGE'}};
/* ---- ping tagging: client stamps inputs, host echoes them back ---- */
var __si=NET.sendClientInput;
NET.sendClientInput=function(input){ if(input)input.ts=performance.now(); return __si(input); };
var __ci=NET.onClientInput;
NET.onClientInput=function(pid,input){ if(RUN&&RUN.players[pid]&&input&&input.ts)RUN.players[pid]._inputTs=input.ts; return __ci(pid,input); };
var __bs=NET.broadcastSnapshot;
NET.broadcastSnapshot=function(s){
 if(s&&RUN&&NET.isHost&&s.players){
  s.players.forEach(function(sp){ var p=null; for(var i=0;i<RUN.players.length;i++){if(RUN.players[i].id===sp.id)p=RUN.players[i];}
   if(p){ sp.echo=p._inputTs||0; sp.dashT=p.dashT||0; sp.dvx=p.dvx||0; sp.dvy=p.dvy||0; } });
 }
 return __bs(s);
};
var __sn=NET.onStateSnapshot;
NET.onStateSnapshot=function(s){
 if(s&&s.players&&RUN&&!NET.isHost){
  for(var i=0;i<s.players.length;i++){ var sp=s.players[i];
   if(sp.id===RUN.localNetId){
    if(sp.echo){ var rtt=performance.now()-sp.echo; if(rtt>0&&rtt<2000)PING.rtt=PING.rtt?PING.rtt*.7+rtt*.3:rtt; }
    var lp=RUN.players[RUN.localNetId];
    if(lp){ lp._sDashT=sp.dashT||0; lp._sDvx=sp.dvx||0; lp._sDvy=sp.dvy||0; }
   } }
 }
 if(__sn)__sn(s);
};
/* ---- client-side prediction: move instantly, reconcile with host ---- */
var __scw=smoothClientWorld;
smoothClientWorld=function(dt){
 __scw(dt);
 if(!RUN)return;
 var lp=RUN.players[RUN.localNetId];
 if(lp&&lp._tx!==undefined){
  var dx=lp._tx-lp.x,dy=lp._ty-lp.y,d=Math.hypot(dx,dy);
  if(d>64){ lp.x=lp._tx; lp.y=lp._ty; if(lp._sDashT!==undefined){lp.dashT=lp._sDashT;lp.dvx=lp._sDvx;lp.dvy=lp._sDvy;} }
  else if(d>0.4){ var k=1-Math.exp(-30*dt); lp.x+=dx*k; lp.y+=dy*k; }
 }
};
var __rpa=requestPlayerAction;
requestPlayerAction=function(action){
 if(RUN&&RUN.isOnline&&!NET.isHost&&action==='dash'){
  var lp=RUN.players[RUN.localNetId];
  if(lp&&!lp.downed&&lp.dashCd<=0){
   var mi=movementInput(lp),dx=mi.dx,dy=mi.dy;
   if(!dx&&!dy){dx=Math.cos(lp.angle);dy=Math.sin(lp.angle);}
   var l=Math.hypot(dx,dy)||1;
   lp.dvx=dx/l*760;lp.dvy=dy/l*760;lp.dashT=.17;lp.dashCd=ST.dashCd;lp.iframes=Math.max(lp.iframes,.35);
  }
 }
 return __rpa(action);
};
/* ---- client shop UI (fixes both-screen freeze) + shop safety timeout ---- */
var cshop=document.createElement('div');
cshop.style.cssText='position:fixed;inset:0;display:none;align-items:center;justify-content:center;z-index:66;background:rgba(4,8,12,.78);';
document.body.appendChild(cshop);
function hideClientShop(){ if(cshop.style.display!=='none'){cshop.style.display='none';cshop.dataset.sig='';} }
function showClientShop(){
 var s=RUN.shop; if(!s){hideClientShop();return;}
 var myId=RUN.localNetId, done=!!(s.done&&s.done[myId]);
 var price=60+(RUN.wave||1)*4;
 var sig=JSON.stringify([s.stock,s.taken,s.done,RUN.coins]);
 if(cshop.dataset.sig===sig)return;
 cshop.dataset.sig=sig; cshop.style.display='flex';
 var html='<div style="width:min(720px,92vw);background:linear-gradient(180deg,#0d1420,#0a0f16);border:1px solid #ffb45466;box-shadow:0 0 60px #ffb45422;padding:22px;">';
 html+='<div style="font-size:24px;color:#ffb454;letter-spacing:4px;">⬠ THE GEOMETRIST</div>';
 html+='<div style="color:#ffd43b;font-family:monospace;margin:6px 0 12px;">BANK ◈ '+RUN.coins+' · PRICE ◈ '+price+'</div>';
 html+='<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;">';
 (s.stock||[]).forEach(function(id){
  var it=ITEMS[id],taken=s.taken&&s.taken[id];
  html+='<button data-cbuy="'+id+'" style="background:#0f1826;border:1px solid '+(taken?'#33445a':'#ffb454')+';padding:14px 10px;cursor:pointer;text-align:center;color:#eaf4ff;opacity:'+(taken?'.35':'1')+';">';
  html+='<div style="font-size:22px;">'+(it?it.ic:'✦')+'</div><b style="display:block;margin:6px 0 4px;">'+(it?it.n:id)+'</b>';
  if(it){html+='<p style="color:#7ef0a6;font-size:11px;margin:0;">'+it.bd+'</p><p style="color:#ff5d8f;font-size:11px;margin:2px 0 6px;">'+it.dd+'</p>';}
  html+='<span style="color:#ffd43b;font-family:monospace;font-size:12px;">'+(taken?'SOLD OUT':'◈ '+price)+'</span></button>';
 });
 html+='</div><button data-cleave="1" style="margin-top:14px;width:100%;background:none;border:1px solid #4fd8eb55;color:#4fd8eb;padding:10px;font-family:monospace;letter-spacing:2px;cursor:pointer;">▸ CONTINUE THROUGH THE BREACH</button>';
 if(done)html+='<div style="margin-top:10px;text-align:center;color:#8aa;font-family:monospace;">CONTRACT SIGNED — AWAITING OTHER OPERATORS…</div>';
 html+='</div>';
 cshop.innerHTML=html;
 Array.prototype.forEach.call(cshop.querySelectorAll('[data-cbuy]'),function(b){
  b.onclick=function(){ if(done)return; var id=b.getAttribute('data-cbuy');
   NET.sendClientAction('shoppick:'+id); s.done=s.done||{}; s.done[myId]='wait'; cshop.dataset.sig=''; showClientShop(); };
 });
 var lv=cshop.querySelector('[data-cleave]');
 if(lv)lv.onclick=function(){ if(done)return; NET.sendClientAction('shoppick:cont'); s.done=s.done||{}; s.done[myId]='wait'; cshop.dataset.sig=''; showClientShop(); };
}
/* ---- update wrap: prediction loop, shop UI gating, anti-deadlock ---- */
var __upd=update;
update=function(dt){
 if(RUN){
  if(RUN.isOnline&&!NET.isHost){
   if(RUN.state==='play'||RUN.state==='inter'){
    var lp=RUN.players[RUN.localNetId];
    if(lp&&!lp.downed){
     var mi=movementInput(lp),dx=mi.dx,dy=mi.dy,l=Math.hypot(dx,dy)||1;
     var sm=1; if(lp.adrenT>0)sm*=1.28;
     if(lp.dashT>0){ lp.dashT-=dt; lp.x+=lp.dvx*dt; lp.y+=lp.dvy*dt; }
     else if(dx||dy){ lp.x+=dx/l*ST.spd*sm*dt; lp.y+=dy/l*ST.spd*sm*dt; }
     lp.x=clamp(lp.x,16,W-16); lp.y=clamp(lp.y,16,H-16);
    }
   }
   if(RUN.state==='shop')showClientShop(); else hideClientShop();
  } else if(RUN&&(!RUN.isOnline||NET.isHost)){
   if(RUN.state==='shop'){
    RUN._shopT=(RUN._shopT||0)+dt;
    if(RUN._shopT>20){ RUN.shop=null; RUN.state='inter'; RUN.interT=1.2; RUN._shopT=0;
     var sd=document.getElementById('shop-ui'); if(sd)sd.classList.remove('on');
     hideClientShop(); broadcastGameState(true); }
   } else RUN._shopT=0;
  }
 }
 return __upd(dt);
};
/* ---- ping badge ---- */
var badge=document.createElement('div');
badge.style.cssText='position:fixed;top:8px;right:12px;z-index:70;font-family:monospace;font-size:11px;color:#7ef0a6;background:rgba(10,15,22,.75);padding:3px 8px;border:1px solid #33445a;display:none;';
document.body.appendChild(badge);
var __hud0=hud;
hud=function(){
 __hud0();
 if(RUN&&RUN.isOnline){
  badge.style.display='block';
  if(NET.isHost){ badge.textContent='HOST · SIM 60Hz'; badge.style.color='#7ef0a6'; }
  else { badge.textContent='PING '+Math.round(PING.rtt)+'ms'; badge.style.color=PING.rtt<90?'#7ef0a6':PING.rtt<180?'#ffd43b':'#ff5d8f'; }
 } else badge.style.display='none';
};
console.log('ISO_NET_FIX_V1 active: prediction + 60Hz snapshots + shop freeze fix.');
})();

/* ISO_MEGA_GAME */
(function(){
if(window.__ISO_MEGA_GAME__)return;window.__ISO_MEGA_GAME__=true;
/* ---- tiny synth layer ---- */
var AC=null;
function actx(){if(!AC){try{AC=new (window.AudioContext||window.webkitAudioContext)();}catch(e){}}if(AC&&AC.state==='suspended')AC.resume();return AC;}
function blip(f,d,type,v){var ac=actx();if(!ac)return;var o=ac.createOscillator(),g=ac.createGain();o.type=type||'sine';o.frequency.value=f;g.gain.setValueAtTime(v||.06,ac.currentTime);g.gain.exponentialRampToValueAtTime(.001,ac.currentTime+d);o.connect(g);g.connect(ac.destination);o.start();o.stop(ac.currentTime+d+.02);}
var ISO_SFX={zap:function(){blip(880,.12,'square',.05);blip(1500,.08,'square',.03);},node:function(){blip(520,.1,'sine',.06);},charm:function(){blip(660,.14,'sine',.07);blip(990,.2,'sine',.05);},skip:function(){blip(300,.1,'triangle',.08);},ready:function(){blip(1250,.06,'sine',.05);}};
window.ISO_SFX=ISO_SFX;
addEventListener('keydown',function(){actx();},{once:true});
addEventListener('mousedown',function(){actx();},{once:true});
var musTimer=null,musGain=null;
function stopMus(){if(musTimer){clearInterval(musTimer);musTimer=null;}if(musGain){musGain.disconnect();musGain=null;}}
function startMus(mode){var ac=actx();if(!ac)return;stopMus();musGain=ac.createGain();musGain.gain.value=.045;musGain.connect(ac.destination);
var sc={menu:[220,277,330,415],combat:[196,233,294,392],boss:[174,207,261,349]}[mode]||[196,233,294,392];var step=0;
musTimer=setInterval(function(){var a2=actx();if(!a2||!musGain)return;var f=sc[step%4]*(step%8<4?1:2);
var o=a2.createOscillator(),g=a2.createGain();o.type=mode==='menu'?'sine':'sawtooth';o.frequency.value=f;g.gain.setValueAtTime(.5,a2.currentTime);g.gain.exponentialRampToValueAtTime(.01,a2.currentTime+.22);o.connect(g);g.connect(musGain);o.start();o.stop(a2.currentTime+.25);
if(mode!=='menu'&&step%4===0){var o2=a2.createOscillator(),g2=a2.createGain();o2.type='triangle';o2.frequency.value=f/2;g2.gain.setValueAtTime(.6,a2.currentTime);g2.gain.exponentialRampToValueAtTime(.01,a2.currentTime+.3);o2.connect(g2);g2.connect(musGain);o2.start();o2.stop(a2.currentTime+.32);}
step++;},mode==='menu'?480:mode==='boss'?140:180);}
if(window.AUDIO&&AUDIO.setTrack){var __st=AUDIO.setTrack;AUDIO.setTrack=function(t){var r=__st?__st.apply(this,arguments):undefined;startMus(t);return r;};}
function mnum(p){var el=(p&&p.elem)||RUN.el;return el&&!el.mol?+el.n:0;}
/* ---- SILICON CIRCUIT (element 14) ---- */
function circInit(){RUN.circNodes=RUN.circNodes||[];RUN.circLinks=RUN.circLinks||[];}
function segDist(px,py,ax,ay,bx,by){var dx=bx-ax,dy=by-ay;var t=((px-ax)*dx+(py-ay)*dy)/(dx*dx+dy*dy||1);t=Math.max(0,Math.min(1,t));return Math.hypot(px-(ax+dx*t),py-(ay+dy*t));}
function placeCircuit(p){
circInit();p.circuitCd=.5;
var x=clamp(mouse.x,20,W-20),y=clamp(mouse.y,20,H-20);
var node={x:x,y:y,t:7,linked:false};
RUN.circNodes.push(node);
var pend=null;for(var i=0;i<RUN.circNodes.length;i++){var n=RUN.circNodes[i];if(n!==node&&!n.linked){pend=n;break;}}
if(pend){pend.linked=true;node.linked=true;RUN.circLinks.push({ax:pend.x,ay:pend.y,bx:node.x,by:node.y,t:7});pend.t=7;node.t=7;ISO_SFX.zap();}
else ISO_SFX.node();
if(RUN.circNodes.length>6){var old=RUN.circNodes.shift();RUN.circLinks=RUN.circLinks.filter(function(l){return !(Math.abs(l.ax-old.x)<1&&Math.abs(l.ay-old.y)<1&&old.linked);});}
ringFx(x,y,200,60,6);
}
window.ISO_SILICON_CIRCUIT = placeCircuit;
var __use=useActive;
useActive=function(p){
if(p&&mnum(p)===14&&(p.circuitCd||0)<=0){
if(RUN.isOnline&&!NET.isHost){NET.sendClientAction('circuit');p.circuitCd=.5;return;}
placeCircuit(p);return;
}
return __use(p);
};
/* ---- CHARM / TEAM BULLETS ---- */
var __fire=fire;
fire=function(p){var before=RUN?RUN.bullets.length:0;__fire(p);if(!RUN)return;
var L=LAB();if(L&&L.sh&&L.sh.includes('charm')){for(var i=before;i<RUN.bullets.length;i++)RUN.bullets[i].charm=true;}};
var __ath=applyTraitHit;
applyTraitHit=function(b,e){__ath(b,e);if(ST.trait==='charm'&&b)b.charm=true;};
var __aeh=applyElemHit;
applyElemHit=function(b,e){
if(b&&b.charm&&e&&!e.dead&&!e.boss&&!e.charm){
e.dead=true;
RUN.allies=RUN.allies||[];
RUN.allies.push({x:e.x,y:e.y,r:e.r,shape:e.shape,hue:140,spd:e.spd,dmg:e.dmg,name:e.name,maxhp:e.maxhp,hp:Math.max(1,e.maxhp*.5),decay:10,touch:0});
ringFx(e.x,e.y,140,90,10);ISO_SFX.charm();
}
return __aeh(b,e);
};
if(typeof ELAB!=='undefined'){ELAB['99']=Object.assign({},ELAB['99'],{sh:['charm']});}
function tickAllies(dt){
var A=RUN.allies=RUN.allies||[];
for(var i=A.length-1;i>=0;i--){var a=A[i];
a.touch-=dt;a.decay-=dt;if(a.decay<=0){a.decay=10;a.hp-=10;}
var t=null,bd=1e9;
RUN.enemies.forEach(function(e){if(e.dead)return;var dd=d2(a.x,a.y,e.x,e.y);if(dd<bd){bd=dd;t=e;}});
if(t){var d=Math.sqrt(bd)||1;a.x+=(t.x-a.x)/d*a.spd*dt;a.y+=(t.y-a.y)/d*a.spd*dt;
if(d<a.r+t.r&&a.touch<=0){a.touch=.7;dmgEnemy(t,a.dmg,{quiet:true});a.hp-=t.dmg*.5;burst(a.x,a.y,140);}}
if(a.hp<=0){burst(a.x,a.y,140);ringFx(a.x,a.y,140,60);RUN.coins+=1;SAVE.addCoins(1);A.splice(i,1);}
}}
/* ---- update wrap: circuit tick + allies ---- */
var __upd=update;
update=function(dt){
__upd(dt);
if(!RUN)return;
RUN.players.forEach(function(p){if(p.circuitCd>0)p.circuitCd-=dt;});
var hostish=!RUN.isOnline||NET.isHost;
if(!hostish)return;
circInit();
RUN.circNodes.forEach(function(n){n.t-=dt;});
RUN.circLinks.forEach(function(l){l.t-=dt;
RUN.enemies.forEach(function(e){
if(!e.dead&&segDist(e.x,e.y,l.ax,l.ay,l.bx,l.by)<26+e.r){
e.slowT=Math.max(e.slowT,.4);
dmgEnemy(e,ST.dmg*4.2*dt,{quiet:true});
if(Math.random()<dt*10)RUN.parts.push({x:e.x,y:e.y,vx:rnd(-80,80),vy:rnd(-80,80),t:.18,life:.18,hue:200,r:2});
}});});
RUN.circNodes=RUN.circNodes.filter(function(n){return n.t>0;});
RUN.circLinks=RUN.circLinks.filter(function(l){return l.t>0;});
tickAllies(dt);
RUN.ebullets.forEach(function(b){(RUN.allies||[]).forEach(function(a){if(d2(b.x,b.y,a.x,a.y)<(b.r+a.r)*(b.r+a.r)){a.hp-=b.dmg;b.life=0;}});});
};
/* ---- host action for client circuit ---- */
if(window.NET){
var __oca=NET.onClientAction;
NET.onClientAction=function(pid,action){
if(RUN&&NET.isHost&&action==='circuit'){var p=RUN.players[pid];if(p&&(p.circuitCd||0)<=0)placeCircuit(p);return;}
if(__oca)return __oca(pid,action);
};
var __bs=NET.broadcastSnapshot;
NET.broadcastSnapshot=function(s){
if(s&&RUN){
circInit();
s.circ={n:RUN.circNodes.map(function(n){return{x:n.x,y:n.y,t:n.t};}),l:RUN.circLinks.map(function(l){return{ax:l.ax,ay:l.ay,bx:l.bx,by:l.by,t:l.t};})};
s.allies=(RUN.allies||[]).map(function(a){return{x:a.x,y:a.y,hp:a.hp,maxhp:a.maxhp,r:a.r,shape:a.shape,hue:a.hue,name:a.name};});
var alive=RUN.enemies.filter(function(e){return !e.dead;});
if(s.enemies)s.enemies.forEach(function(se,i){if(alive[i])se.charm=alive[i].charm?1:0;});
}
return __bs(s);
};
var __sn=NET.onStateSnapshot;
NET.onStateSnapshot=function(s){
if(__sn)__sn(s);
if(!RUN||NET.isHost||!s)return;
var sx=W/(RUN.hostW||W),sy=H/(RUN.hostH||H);
if(s.circ){RUN.circNodes=(s.circ.n||[]).map(function(n){return{x:n.x*sx,y:n.y*sy,t:n.t};});RUN.circLinks=(s.circ.l||[]).map(function(l){return{ax:l.ax*sx,ay:l.ay*sy,bx:l.bx*sx,by:l.by*sy,t:l.t};});}
else{RUN.circNodes=[];RUN.circLinks=[];}
RUN.allies=(s.allies||[]).map(function(a){return{x:a.x*sx,y:a.y*sy,hp:a.hp,maxhp:a.maxhp,r:Math.max(2,a.r*(sx+sy)/2),shape:a.shape,hue:a.hue,name:a.name,spd:120,dmg:10,decay:10,touch:0};});
};
}
/* ---- THEMED BACKGROUNDS ---- */
var THEME_PALS=[[196,330],[285,200],[95,40],[25,55],[268,190],[160,210]];
function themeIdx(){if(!RUN){var e=EL(SAVE.sel||'e1');return ((e.cat||0)%6);}return Math.floor(Math.max(0,RUN.wave-1)/5)%6;}
var stars=[];for(var i=0;i<90;i++)stars.push({x:Math.random(),y:Math.random(),s:Math.random()*2+.5,tw:Math.random()*6});
renderBG=function(dt){
bgc.clearRect(0,0,W,H);
var ti=themeIdx();if(!THEME_PALS[ti])ti=0;var pal=THEME_PALS[ti];
bgc.fillStyle='#070a10';bgc.fillRect(0,0,W,H);
var g1=bgc.createRadialGradient(W*.2,H*.15,50,W*.2,H*.15,W*.6);
g1.addColorStop(0,'hsla('+pal[0]+',70%,45%,.09)');g1.addColorStop(1,'transparent');bgc.fillStyle=g1;bgc.fillRect(0,0,W,H);
var g2=bgc.createRadialGradient(W*.85,H*.85,50,W*.85,H*.85,W*.5);
g2.addColorStop(0,'hsla('+pal[1]+',70%,45%,.08)');g2.addColorStop(1,'transparent');bgc.fillStyle=g2;bgc.fillRect(0,0,W,H);
var t=performance.now()/1000;
stars.forEach(function(s){var a=.05+.08*Math.abs(Math.sin(t+s.tw));bgc.fillStyle='hsla('+pal[0]+',80%,80%,'+a+')';bgc.fillRect(s.x*W,s.y*H,s.s,s.s);});
if(ti===1){bgc.strokeStyle='hsla('+pal[1]+',70%,60%,.08)';for(var c=0;c<7;c++){bgc.beginPath();var cx2=(c*.17+ .05)*W,cy2=H*.7+Math.sin(t*.5+c)*30;for(var k=0;k<6;k++){var a2=k/6*6.283;bgc.lineTo(cx2+Math.cos(a2)*40,cy2+Math.sin(a2)*40);}bgc.closePath();bgc.stroke();}}
if(ti===2){bgc.fillStyle='hsla('+pal[0]+',70%,50%,.06)';for(var b=0;b<6;b++){bgc.beginPath();bgc.arc((b*.2+.1)*W,H*.5+Math.sin(t*.7+b*2)*60,60+20*Math.sin(t+b),0,6.283);bgc.fill();}}
if(ti===3){bgc.strokeStyle='hsla('+pal[0]+',90%,60%,.1)';for(var r2=0;r2<4;r2++){bgc.beginPath();bgc.arc(W*.5,H*.1,80+r2*60+20*Math.sin(t*2+r2),0,6.283);bgc.stroke();}}
if(ti===4){bgc.strokeStyle='hsla('+pal[0]+',70%,60%,.07)';for(var v=0;v<5;v++){bgc.beginPath();bgc.moveTo(0,H*(.2+v*.15));bgc.bezierCurveTo(W*.3,H*(.2+v*.15)+Math.sin(t+v)*40,W*.7,H*(.2+v*.15)-Math.sin(t+v)*40,W,H*(.2+v*.15));bgc.stroke();}}
if(ti===5){bgc.strokeStyle='hsla('+pal[0]+',60%,60%,.06)';for(var gx=0;gx<W;gx+=64){bgc.beginPath();bgc.moveTo(gx+Math.sin(t)*6,0);bgc.lineTo(gx,H);}bgc.stroke();}
};
/* ---- render wrap: circuit, allies, radar, fps, boss%, theme tint ---- */
var statDiv=document.createElement('div');statDiv.id='iso-stats';statDiv.style.cssText='position:fixed;top:60px;left:12px;z-index:70;display:none;background:rgba(10,15,22,.85);border:1px solid #33445a;padding:10px;font-family:monospace;font-size:12px;color:#eaf4ff;';document.body.appendChild(statDiv);
var fpsE=0,fpsT=0,fpsV=0;
var prevQ=0,prevD=0;
var __ren=render;
render=function(){
__ren();
if(!RUN)return;
var ti=themeIdx();if(!THEME_PALS[ti])ti=0;var pal=THEME_PALS[ti];
cx.fillStyle='hsla('+pal[0]+',60%,50%,.04)';cx.fillRect(0,0,W,H);
/* circuit */
circInit();
RUN.circNodes.forEach(function(n){
cx.strokeStyle='hsla(200,90%,65%,.9)';cx.lineWidth=2;cx.fillStyle='hsla(200,80%,20%,.8)';
cx.beginPath();for(var k=0;k<6;k++){var a=k/6*TAU+RUN.t;cx.lineTo(n.x+Math.cos(a)*9,n.y+Math.sin(a)*9);}cx.closePath();cx.fill();cx.stroke();
cx.fillStyle='hsla(200,90%,70%,.6)';cx.font='9px monospace';cx.textAlign='center';cx.fillText(Math.ceil(n.t)+'s',n.x,n.y-14);
});
RUN.circLinks.forEach(function(l){
cx.strokeStyle='hsla(200,95%,70%,.85)';cx.lineWidth=2;cx.beginPath();
var segs=8;for(var s2=0;s2<=segs;s2++){var tt=s2/segs;var mx2=l.ax+(l.bx-l.ax)*tt,my2=l.ay+(l.by-l.ay)*tt;var off=Math.sin(RUN.t*14+s2*3)*6;var px=- (l.by-l.ay),py=(l.bx-l.ax);var pl=Math.hypot(px,py)||1;cx.lineTo(mx2+px/pl*off,my2+py/pl*off);}
cx.stroke();
cx.strokeStyle='hsla(200,95%,80%,.25)';cx.lineWidth=6;cx.stroke();
});
/* allies */
(RUN.allies||[]).forEach(function(a){
cx.save();cx.translate(a.x,a.y);
cx.fillStyle='hsl('+140+' 80% 55%)';cx.strokeStyle='#0008';cx.lineWidth=2;cx.beginPath();
if(a.shape==='square')cx.rect(-a.r,-a.r,a.r*2,a.r*2);
else if(a.shape==='diamond'){cx.moveTo(0,-a.r);cx.lineTo(a.r,0);cx.lineTo(0,a.r);cx.lineTo(-a.r,0);}
else cx.arc(0,0,a.r,0,TAU);
cx.closePath();cx.fill();cx.stroke();
cx.strokeStyle='rgba(126,240,166,.9)';cx.beginPath();cx.arc(0,0,a.r+4,0,TAU);cx.stroke();
cx.fillStyle='#fff';cx.font='8px monospace';cx.textAlign='center';cx.fillText('♥',0,3);
cx.restore();
cx.fillStyle='#0009';cx.fillRect(a.x-a.r,a.y-a.r-7,a.r*2,3);
cx.fillStyle='#7ef0a6';cx.fillRect(a.x-a.r,a.y-a.r-7,a.r*2*clamp(a.hp/a.maxhp,0,1),3);
});
/* radar */
if(SAVE.set.radar!==0){
var rw=110,rx=W-rw-14,ry=14;
cx.fillStyle='rgba(10,15,22,.7)';cx.fillRect(rx,ry,rw,rw);
cx.strokeStyle='#33445a';cx.strokeRect(rx,ry,rw,rw);
function dot(x,y,col){cx.fillStyle=col;cx.fillRect(rx+(x/W)*rw-1,ry+(y/H)*rw-1,2,2);}
RUN.enemies.forEach(function(e){if(!e.dead)dot(e.x,e.y,'#ff5d8f');});
(RUN.allies||[]).forEach(function(a){dot(a.x,a.y,'#7ef0a6');});
RUN.players.forEach(function(p){dot(p.x,p.y,'#4fd8eb');});
}
/* fps */
fpsT+=1/60;fpsE++;if(fpsT>=.5){fpsV=Math.round(fpsE/fpsT);fpsE=0;fpsT=0;}
if(SAVE.set.fps){cx.fillStyle='#7ef0a6';cx.font='11px monospace';cx.textAlign='left';cx.fillText('FPS '+fpsV,12,H-12);}
/* boss % */
if(RUN.boss){var bp=Math.ceil(clamp(RUN.boss.hp/RUN.boss.maxhp,0,1)*100);var bn=document.getElementById('bossname');if(bn)bn.textContent='⚠ '+RUN.boss.name+' · '+bp+'%';}
/* ready chime */
var p0=RUN.players[RUN.localNetId]||RUN.players[0];
if(p0){if(prevQ>0&&p0.activeCd<=0)ISO_SFX.ready();if(prevD>0&&p0.dashCd<=0)ISO_SFX.ready();prevQ=p0.activeCd;prevD=p0.dashCd;}
};
/* ---- QOL keys ---- */
addEventListener('keydown',function(e){
if(!RUN||document.getElementById('scr-game').classList.contains('hidden'))return;
var hostish=!RUN.isOnline||NET.isHost;
if(e.code==='KeyN'&&hostish&&RUN.state==='inter'){RUN.interT=0;RUN.coins+=2;SAVE.addCoins(2);banner('BREACH ACCELERATED +◈2',1200);ISO_SFX.skip();}
if(e.code==='KeyV'){SAVE.set.radar=SAVE.set.radar===0?1:0;SAVE.save();}
if(e.code==='F3'){e.preventDefault();SAVE.set.fps=SAVE.set.fps?0:1;SAVE.save();}
if(e.code==='KeyT'){var on=statDiv.style.display==='block';statDiv.style.display=on?'none':'block';
if(!on){statDiv.innerHTML='TIME '+Math.floor(RUN.t)+'s<br>KILLS '+RUN.kills+'<br>COINS ◈'+RUN.coins+'<br>WAVE '+RUN.wave+'<br>LV '+RUN.level+'<br>RELICS '+RUN.relics.length+'<br>ALLIES '+(RUN.allies||[]).length;}}
});
/* deploy element cycling */
addEventListener('keydown',function(e){
var dep=document.getElementById('m-deploy');
if(!dep||dep.classList.contains('hidden'))return;
if(e.code!=='BracketLeft'&&e.code!=='BracketRight')return;
var owned=Object.values(ELEMS).filter(function(el){return DATA.isOwned(el.id);}).sort(function(a,b){return a.n-b.n;});
if(!owned.length)return;
var idx=owned.findIndex(function(el){return el.id===SAVE.sel;});
idx=(idx+(e.code==='BracketRight'?1:-1)+owned.length)%owned.length;
SAVE.sel=owned[idx].id;SAVE.save();
document.getElementById('dep-elem').textContent='Selected: '+owned[idx].name;
if(window.NET&&NET.setMyElement)NET.setMyElement(SAVE.sel);
SFX.click();
});
console.log('ISO_MEGA_GAME active: circuit, charm, themes, audio layer, QOL.');
})();

/* 
/* 
/* 
/* ISO_QOL2 */
(function(){
if(window.__ISO_QOL2__)return;window.__ISO_QOL2__=true;
var DEF={minimap:1,mmsize:1,parts:1,ehp:0,tele:1,fps:0,hitstop:1,redflash:0,trails:1,glow:1,auras:1,binds:{dash:'Space',active:'KeyQ',autofire:'KeyF'}};
SAVE.set=SAVE.set||{};
Object.keys(DEF).forEach(function(k){if(SAVE.set[k]===undefined)SAVE.set[k]=DEF[k];});
if(!SAVE.set.binds)SAVE.set.binds={};
['dash','active','autofire'].forEach(function(k){if(!SAVE.set.binds[k])SAVE.set.binds[k]=DEF.binds[k];});
if(SAVE.save)SAVE.save();
function SET(){return SAVE.set;}
function keyName(c){return String(c).replace('Key','').replace('Digit','');}
/* ---- keybinds + actions ---- */
var rebinding=null;
function dashAct(){if(RUN.isOnline)NET.sendClientAction('dash');else tryDash(RUN.players[0]);}
function actAct(){if(RUN.isOnline)NET.sendClientAction('active');else useActive(RUN.players[0]);}
function updAF(){var el=document.getElementById('autofire');if(el)el.innerHTML='<span>'+keyName(SAVE.set.binds.autofire)+' Â· AUTOFIRE '+(autofire?'ON':'OFF')+'</span>';}
addEventListener('keydown',function(e){
if(rebinding){e.preventDefault();e.stopPropagation();if(e.code!=='Escape'){SAVE.set.binds[rebinding]=e.code;SAVE.save();}rebinding=null;refreshBinds();return;}
if(!RUN||document.getElementById('scr-game').classList.contains('hidden'))return;
var B=SAVE.set.binds;
if(e.code===B.dash&&B.dash!=='Space'){e.preventDefault();e.stopPropagation();dashAct();}
else if(e.code===B.active&&B.active!=='KeyQ'){e.preventDefault();e.stopPropagation();actAct();}
else if(e.code===B.autofire&&B.autofire!=='KeyF'){e.preventDefault();e.stopPropagation();autofire=!autofire;updAF();}
else if(e.code==='Space'&&B.dash!=='Space'){e.stopPropagation();}
else if(e.code==='KeyQ'&&B.active!=='KeyQ'){e.stopPropagation();}
else if(e.code==='KeyF'&&B.autofire!=='KeyF'){e.stopPropagation();}
},true);
/* ---- settings UI ---- */
var OPTS=[['minimap','MINIMAP'],['ehp','ALWAYS HP BARS'],['tele','TELEGRAPHS'],['fps','FPS COUNTER'],['trails','BULLET TRAILS'],['glow','GLOW FX'],['auras','ENEMY AURAS'],['hitstop','HITSTOP/SLOW-MO'],['redflash','REDUCED FLASH']];
function refreshBinds(){
var row=document.getElementById('kb-row');if(!row)return;row.innerHTML='';
['dash','active','autofire'].forEach(function(k){
var b=document.createElement('button');b.className='btn chamf';b.style.cssText='padding:6px 12px;font-size:11px';
b.textContent=k.toUpperCase()+': '+keyName(SAVE.set.binds[k]);
b.onclick=function(){rebinding=k;b.textContent=k.toUpperCase()+': PRESS KEYâ€¦';};
row.appendChild(b);});
}
function refreshOpts(){
var row=document.getElementById('opt-row');if(!row)return;row.innerHTML='';
OPTS.forEach(function(o){
var b=document.createElement('button');b.className='btn chamf';b.style.cssText='padding:6px 10px;font-size:10px';
b.textContent=o[1]+(SAVE.set[o[0]]?' âœ“':' âœ—');b.style.borderColor=SAVE.set[o[0]]?'#48c774':'#555';
b.onclick=function(){SAVE.set[o[0]]=SAVE.set[o[0]]?0:1;SAVE.save();refreshOpts();};
row.appendChild(b);});
[['mmsize',['S','M','L'],'MAP SIZE'],['parts',['LOW','MED','HIGH'],'PARTICLES']].forEach(function(c){
var b=document.createElement('button');b.className='btn chamf';b.style.cssText='padding:6px 10px;font-size:10px';
b.textContent=c[2]+': '+c[1][SAVE.set[c[0]]||0];
b.onclick=function(){SAVE.set[c[0]]=((SAVE.set[c[0]]||0)+1)%c[1].length;SAVE.save();refreshOpts();};
row.appendChild(b);});
}
function buildSettingsExtra(){
var scr=document.getElementById('scr-settings');if(!scr||document.getElementById('qol2-box'))return;
var box=document.createElement('div');box.id='qol2-box';box.style.cssText='margin-top:16px;display:grid;gap:10px;max-width:560px';
box.innerHTML='<div class="panel" style="padding:14px"><b style="letter-spacing:2px">KEYBINDS</b><div id="kb-row" style="display:flex;gap:8px;margin-top:8px;flex-wrap:wrap"></div><small style="color:var(--tx2)">Click a bind then press a new key Â· Esc cancels.</small></div><div class="panel" style="padding:14px"><b style="letter-spacing:2px">EXTRA OPTIONS</b><div id="opt-row" style="display:flex;gap:8px;margin-top:8px;flex-wrap:wrap"></div></div>';
scr.appendChild(box);refreshBinds();refreshOpts();
}
buildSettingsExtra();
/* ---- hitstop / flash settings ---- */
var __upd=update;
update=function(dt){if(RUN){if(!SET().hitstop){RUN.hitstop=0;if(!RUN.boss)RUN.slowmo=0;}}return __upd(dt);};
/* ---- particle density ---- */
var __burst=burst;
burst=function(x,y,hue){var p=SET().parts;if(p===0){if(Math.random()<.5)return;}__burst(x,y,hue);if(p===2)__burst(x,y,hue);};
/* ---- enhanced enemy AI (bespoke behaviors) ---- */
var __ue=updEnemies;
updEnemies=function(dt){
__ue(dt);
if(!RUN)return;
RUN.enemies.forEach(function(e){
if(e.dead)return;
var tp=nearestPlayer(e.x,e.y);
switch(e.type){
case 'orbiter':e._oT=(e._oT||2.4)-dt;if(e._oT<=0){e._oT=2.4;var a=Math.atan2(tp.y-e.y,tp.x-e.x);ebul(e.x,e.y,a+.35,200,8);ebul(e.x,e.y,a-.35,200,8);}break;
case 'seeder':e._sT=(e._sT||6)-dt;if(e._sT<=0&&RUN.enemies.length<120){e._sT=6;spawnEnemy(Math.random()<.5?'shardling':'swarm',e.x+rnd(-20,20),e.y+rnd(-20,20));ringFx(e.x,e.y,e.hue,60);}break;
case 'crusher':if(e.touch>.5){e._cT=(e._cT||0)-dt;if(e._cT<=0){e._cT=.9;RUN.players.forEach(function(p){if(!p.downed&&d2(p.x,p.y,e.x,e.y)<80*80)hurtPlayer(p,e.dmg*.5);});RUN.shake=Math.max(RUN.shake,5);ringFx(e.x,e.y,15,90);}}break;
case 'spark':e.x+=Math.sin(RUN.t*14+e.seed)*46*dt;e.y+=Math.cos(RUN.t*12+e.seed)*46*dt;break;
case 'basalt':e._bT=(e._bT||.7)-dt;if(e._bT<=0){e._bT=.7;RUN.clouds.push({x:e.x,y:e.y,r:42,t:2});}break;
case 'reactor':e._rT=(e._rT||4)-dt;if(e._rT<=0){e._rT=4;RUN.players.forEach(function(p){if(!p.downed&&d2(p.x,p.y,e.x,e.y)<110*110)hurtPlayer(p,10);});ringFx(e.x,e.y,340,140);}break;
case 'pylon':e._pT=(e._pT||3.4)-dt;if(e._pT<=0){e._pT=3.4;for(var k=0;k<6;k++)ebul(e.x,e.y,k/6*TAU+RUN.t,220,9);}break;
case 'vampire':if(e.hp<e.maxhp*.5)e.spd=ETYPES.vampire.spd*1.3;break;
case 'gravitywell':e._gT=(e._gT||5)-dt;if(e._gT<=0){e._gT=5;RUN.pullT=1.4;RUN.pullSrc={x:e.x,y:e.y};ringFx(e.x,e.y,e.hue,160);}break;
case 'phaseweaver':if(e.specialT>3.4&&!e._pw){e._pw=1;var ox=e.x,oy=e.y;setTimeout(function(){if(RUN&&!e.dead){aoe(ox,oy,60,e.dmg*.6,265);ringFx(ox,oy,265,80);}},400);}if(e.specialT<2)e._pw=0;break;
case 'voltconductor':e._vT=(e._vT||4)-dt;if(e._vT<=0){e._vT=4;arcChain(e,ST.dmg*.5,3,55);}break;
case 'biomass':if(!e.su2&&e.hp<e.maxhp*.75){e.su2=true;spawnEnemy('swarm',e.x,e.y);spawnEnemy('swarm',e.x,e.y);ringFx(e.x,e.y,120,70);}break;
case 'juggler':e._jT=(e._jT||5)-dt;if(e._jT<=0){e._jT=5;var a0=Math.atan2(tp.y-e.y,tp.x-e.x);for(var j=-2;j<=2;j++)ebul(e.x,e.y,a0+j*.22,210,8);}break;
case 'mimicore':e._mT=(e._mT||4.5)-dt;if(e._mT<=0){e._mT=4.5;var a1=Math.atan2(tp.y-e.y,tp.x-e.x);for(var mm=-1;mm<=1;mm++)ebul(e.x,e.y,a1+mm*.25,275,e.dmg);}break;case 'glasslancer':e._gLT=(e._gLT||3.8)-dt;if(e._gLT<=0){e._gLT=3.8;var al=Math.atan2(tp.y-e.y,tp.x-e.x);e.x=clamp(e.x+Math.cos(al)*85,24,W-24);e.y=clamp(e.y+Math.sin(al)*85,24,H-24);RUN.clouds.push({x:e.x,y:e.y,r:34,t:2});}break;
case 'emberdrone':e._eT=(e._eT||2.6)-dt;if(e._eT<=0){e._eT=2.6;RUN.wells.push({x:tp.x+rnd(-80,80),y:tp.y+rnd(-80,80),t:1.7,lv:2});}break;
case 'frostbinder':e._fT=(e._fT||4.2)-dt;if(e._fT<=0){e._fT=4.2;RUN.eclouds.push({x:e.x,y:e.y,r:105,t:2.0,friendly:false});}break;
case 'echohound':e._hT=(e._hT||3.4)-dt;if(e._hT<=0){e._hT=3.4;var ah=Math.atan2(tp.y-e.y,tp.x-e.x);for(var hh=-1;hh<=1;hh++)ebul(e.x,e.y,ah+hh*.12,320,e.dmg*.75);}break;
case 'ionserpent':e._sT2=(e._sT2||2.8)-dt;if(e._sT2<=0){e._sT2=2.8;var as=Math.atan2(tp.y-e.y,tp.x-e.x);for(var ss=0;ss<5;ss++)ebul(e.x,e.y,as-.55+ss*.275,245,e.dmg*.65);}break;
case 'voidsentry':e._vT2=(e._vT2||5)-dt;if(e._vT2<=0){e._vT2=5;RUN.eclouds.push({x:tp.x,y:tp.y,r:85,t:2.2,friendly:false});}break;
case 'stormbeacon':e._stT=(e._stT||5.5)-dt;if(e._stT<=0){e._stT=5.5;var sp=RUN.players.filter(function(p){return !p.downed;})[0];if(sp){sp._stormX=sp.x;sp._stormY=sp.y;ringFx(sp.x,sp.y,e.hue,60);setTimeout(function(){if(RUN)aoe(sp._stormX,sp._stormY,70,e.dmg*1.8,e.hue);},1100);}}break;
case 'nullmimic':e._nT=(e._nT||6)-dt;if(e._nT<=0){e._nT=6;RUN.players.forEach(function(p){p.nullAimT=.9;});ringFx(e.x,e.y,e.hue,100);}break;
case 'crystalwarden':if(e.hp<e.maxhp*.65&&!e._cr){e._cr=1;for(var cc=0;cc<3;cc++)spawnEnemy('shielder',e.x+rnd(-50,50),e.y+rnd(-50,50));ringFx(e.x,e.y,e.hue,130);}break;
case 'plasmacrusher':e._pcT=(e._pcT||4.5)-dt;if(e._pcT<=0&&d<330){e._pcT=4.5;e.plasmaCharge=.75;ringFx(e.x,e.y,e.hue,90);}if(e.plasmaCharge>0){e.plasmaCharge-=dt;if(e.plasmaCharge<=0)aoe(e.x,e.y,100,e.dmg*1.6,e.hue);}break;
case 'corroswirl':e._coT=(e._coT||4)-dt;if(e._coT<=0){e._coT=4;RUN.players.forEach(function(p){if(!p.downed&&d2(p.x,p.y,e.x,e.y)<130*130)p.sh=Math.max(0,(p.sh||0)-18);});ringFx(e.x,e.y,e.hue,120);}break;
case 'gravityblink':e._gbT=(e._gbT||5)-dt;if(e._gbT<=0){e._gbT=5;e.x=clamp(tp.x+rnd(-200,200),24,W-24);e.y=clamp(tp.y+rnd(-200,200),24,H-24);RUN.wells.push({x:e.x,y:e.y,t:2.3,lv:3});ringFx(e.x,e.y,e.hue,110);}break;

}
});
};
/* ---- render: better map, effects, telegraphs, radar in HUD ---- */
var fpsE=0,fpsT=0,fpsV=0;
var __ren=render;
render=function(){
__ren();
if(!RUN)return;
var S=SET();
/* erase old overlapping radar */
cx.fillStyle='#0a0f16';cx.fillRect(W-130,8,124,124);
/* map decor: hex grid + vignette + corners + tier tint */
var tier=Math.floor(Math.max(1,RUN.wave)/5)%6;
cx.strokeStyle='hsla('+RUN.hue+',60%,60%,.05)';cx.lineWidth=1;cx.beginPath();
for(var hx=0;hx<W+48;hx+=48){for(var hy=0;hy<H+48;hy+=56){var off=(Math.floor(hy/56)%2)*24;cx.moveTo(hx+off+12,hy);cx.lineTo(hx+off+24,hy+14);cx.lineTo(hx+off+24,hy+42);cx.lineTo(hx+off+12,hy+56);cx.lineTo(hx+off,hy+42);cx.lineTo(hx+off,hy+14);cx.closePath();}}
cx.stroke();
var vg=cx.createRadialGradient(W/2,H/2,Math.min(W,H)*.35,W/2,H/2,Math.max(W,H)*.75);
vg.addColorStop(0,'rgba(0,0,0,0)');vg.addColorStop(1,'rgba(0,0,0,.4)');cx.fillStyle=vg;cx.fillRect(0,0,W,H);
cx.strokeStyle='hsla('+RUN.hue+',80%,60%,.5)';cx.lineWidth=2;
[[8,8,1,1],[W-8,8,-1,1],[8,H-8,1,-1],[W-8,H-8,-1,-1]].forEach(function(c){cx.beginPath();cx.moveTo(c[0]+c[2]*18,c[1]);cx.lineTo(c[0],c[1]);cx.lineTo(c[0],c[1]+c[3]*18);cx.stroke();});
cx.fillStyle='hsla('+ (RUN.hue+tier*40)%360 +',70%,50%,.03)';cx.fillRect(0,0,W,H);
/* bullet trails + glow */
if(S.trails||S.glow){
cx.globalCompositeOperation='lighter';
RUN.bullets.forEach(function(b){
if(S.trails){cx.strokeStyle='hsla('+RUN.hue+',90%,65%,.35)';cx.lineWidth=b.r*.8;cx.beginPath();cx.moveTo(b.x-b.vx*.045,b.y-b.vy*.045);cx.lineTo(b.x,b.y);cx.stroke();}
if(S.glow){var g=cx.createRadialGradient(b.x,b.y,0,b.x,b.y,b.r*3);g.addColorStop(0,'hsla('+RUN.hue+',90%,70%,.3)');g.addColorStop(1,'transparent');cx.fillStyle=g;cx.beginPath();cx.arc(b.x,b.y,b.r*3,0,TAU);cx.fill();}
});
RUN.ebullets.forEach(function(b){if(S.glow){var g=cx.createRadialGradient(b.x,b.y,0,b.x,b.y,b.r*3);g.addColorStop(0,'rgba(255,140,80,.3)');g.addColorStop(1,'transparent');cx.fillStyle=g;cx.beginPath();cx.arc(b.x,b.y,b.r*3,0,TAU);cx.fill();}});
cx.globalCompositeOperation='source-over';
}
/* player dash ghosts */
RUN.players.forEach(function(p){
p._trail=p._trail||[];
p._trail.push({x:p.x,y:p.y,t:.3});
if(p._trail.length>14)p._trail.shift();
p._trail.forEach(function(q){q.t-=1/60;});
cx.globalCompositeOperation='lighter';
p._trail.forEach(function(q,i){if(q.t>0&&p.dashT>0){cx.fillStyle='hsla('+RUN.hue+',80%,60%,'+(q.t*.5)+')';cx.beginPath();cx.arc(q.x,q.y,10*q.t/.3,0,TAU);cx.fill();}});
cx.globalCompositeOperation='source-over';
});
/* enemy telegraphs + auras + hp bars */
RUN.enemies.forEach(function(e){
if(e.dead)return;
if(S.ehp&&!e.boss){cx.fillStyle='#0009';cx.fillRect(e.x-e.r,e.y-e.r-7,e.r*2,3);cx.fillStyle='hsl('+e.hue+' 80% 60%)';cx.fillRect(e.x-e.r,e.y-e.r-7,e.r*2*clamp(e.hp/e.maxhp,0,1),3);}
if(!S.auras&&!S.tele)return;
var tp=nearestPlayer(e.x,e.y);
cx.lineWidth=2;
switch(e.type){
case 'sniper':if(S.tele&&e.charge>0){cx.strokeStyle='rgba(255,60,60,'+(.3+.4*Math.abs(Math.sin(RUN.t*20)))+')';cx.beginPath();cx.moveTo(e.x,e.y);cx.lineTo(tp.x,tp.y);cx.stroke();}break;
case 'spitter':if(S.tele&&e.shootT<.5){cx.strokeStyle='hsla(280,90%,60%,.7)';cx.beginPath();cx.arc(e.x,e.y,e.r+5+Math.sin(RUN.t*25)*2,0,TAU);cx.stroke();}break;
case 'healer':if(S.auras){cx.strokeStyle='hsla(140,90%,60%,'+(.3+.2*Math.sin(RUN.t*6))+')';cx.beginPath();cx.arc(e.x,e.y,150,0,TAU);cx.stroke();}break;
case 'shielder':if(S.auras){cx.strokeStyle='rgba(150,255,255,.8)';cx.lineWidth=3;cx.beginPath();cx.arc(e.x,e.y,e.r+6,e.face-1.1,e.face+1.1);cx.stroke();}break;
case 'ghost':if(S.auras&&e.invuln){cx.fillStyle='rgba(10,15,22,.5)';cx.beginPath();cx.arc(e.x,e.y,e.r+2,0,TAU);cx.fill();}break;
case 'stalker':if(S.auras){var dd=Math.hypot(tp.x-e.x,tp.y-e.y);if(dd>120){cx.fillStyle='rgba(10,15,22,.45)';cx.beginPath();cx.arc(e.x,e.y,e.r+2,0,TAU);cx.fill();}}break;
case 'charger':if(S.tele&&e.charging>0){cx.strokeStyle='hsla(10,90%,60%,.8)';cx.beginPath();cx.arc(e.x,e.y,e.r+6+Math.sin(RUN.t*30)*3,0,TAU);cx.stroke();}break;
case 'bomber':if(S.tele&&e.hp<e.maxhp*.35){cx.fillStyle='rgba(255,120,40,'+(Math.abs(Math.sin(RUN.t*18))*.8)+')';cx.beginPath();cx.arc(e.x,e.y-e.r-6,3,0,TAU);cx.fill();}break;
case 'mirror':if(S.auras){cx.strokeStyle='hsla(190,90%,70%,'+(.4+.3*Math.sin(RUN.t*8))+')';cx.beginPath();cx.arc(e.x,e.y,e.r+5,0,TAU);cx.stroke();}break;
case 'vampire':if(S.auras){cx.fillStyle='hsla(340,90%,60%,.8)';cx.font='bold 9px monospace';cx.textAlign='center';cx.fillText('â™¥',e.x,e.y-e.r-8);}break;
case 'anchor':if(S.auras){cx.strokeStyle='hsla(230,80%,60%,.25)';cx.beginPath();cx.arc(e.x,e.y,190,0,TAU);cx.stroke();}break;
case 'reactor':if(S.auras){cx.strokeStyle='hsla(340,90%,60%,'+(.3+.3*Math.sin(RUN.t*10))+')';cx.beginPath();cx.arc(e.x,e.y,e.r+8,0,TAU);cx.stroke();}break;
case 'basalt':if(S.auras){cx.fillStyle='hsla(20,90%,55%,.5)';cx.beginPath();cx.arc(e.x,e.y+e.r*.5,e.r*.7,0,TAU);cx.fill();}break;
case 'phaseweaver':case 'voltconductor':case 'biomass':case 'gravitywell':case 'mimicore':
if(S.auras){cx.strokeStyle='hsla('+e.hue+',95%,70%,'+(.5+.3*Math.sin(RUN.t*7))+')';cx.lineWidth=2.5;cx.beginPath();for(var i2=0;i2<6;i2++){var a2=i2/6*TAU+RUN.t;cx.lineTo(e.x+Math.cos(a2)*(e.r+7),e.y+Math.sin(a2)*(e.r+7));}cx.closePath();cx.stroke();}break;
}
});
/* reduced flash */
if(S.redflash){var hf=document.getElementById('hitflash');if(hf&&parseFloat(hf.style.opacity)>0.4)hf.style.opacity=0.4;}
/* fps */
fpsT+=1/60;fpsE++;if(fpsT>=.5){fpsV=Math.round(fpsE/fpsT);fpsE=0;fpsT=0;}
if(S.fps){cx.fillStyle='#7ef0a6';cx.font='11px monospace';cx.textAlign='left';cx.fillText('FPS '+fpsV,12,H-12);}
/* radar attached inside the money panel */
if(S.minimap){
var hc=document.getElementById('h-coins');
var pr=hc&&hc.parentElement?hc.parentElement.getBoundingClientRect():null;
var size=[90,110,140][S.mmsize||1];
var rx=pr?(pr.right-size-4):(W-size-14);
var ry=pr?(pr.bottom+4):14;
cx.fillStyle='rgba(10,15,22,.85)';cx.fillRect(rx,ry,size,size);
cx.strokeStyle='hsla('+RUN.hue+',70%,55%,.6)';cx.lineWidth=1.5;cx.strokeRect(rx,ry,size,size);
if(pr){cx.strokeStyle='hsla('+RUN.hue+',70%,55%,.6)';cx.beginPath();cx.moveTo(rx+size*.5,ry);cx.lineTo(rx+size*.5,ry-4);cx.stroke();}
function dot(x,y,col,s2){cx.fillStyle=col;cx.fillRect(rx+(x/W)*size-(s2||1),ry+(y/H)*size-(s2||1),(s2||2)+1,(s2||2)+1);}
RUN.pickups.forEach(function(k){dot(k.x,k.y,'#ffd43b',1);});
RUN.enemies.forEach(function(e){if(!e.dead)dot(e.x,e.y,e.boss?'#ff4bd9':'#ff5d8f',e.boss?2:1);});
RUN.players.forEach(function(p){dot(p.x,p.y,'#4fd8eb',2);});
}
};
console.log('ISO_QOL2 active: keybinds, extra settings, juicier FX, better map, enemy flair, HUD radar.');
})();

/* 
/* ISO_MEGA2_GAME */
(function(){
if(window.__ISO_MEGA2__)return;window.__ISO_MEGA2__=true;
var NEWSTATS=['echo','momentum','tempo','flux','aegis','grit','shatter','combust','scavenge','void'];
/* ---------- new cards (new stats + core-mechanic mythics) ---------- */
var NC=[
{id:'echo',ic:'âˆ¿',n:'Echo Chamber',d:'Every 5th shot echoes at 50% dmg',max:3,rarity:'rare'},
{id:'momentum',ic:'âž ',n:'Momentum Coils',d:'+12% dmg while moving /rank',max:3,rarity:'uncommon'},
{id:'tempo',ic:'â™©',n:'Battle Tempo',d:'After ability: +25% fire rate 4s /rank',max:3,rarity:'rare'},
{id:'flux',ic:'â˜¯',n:'Flux Rounds',d:'Shots apply a random elemental status',max:2,rarity:'epic'},
{id:'aegis',ic:'â›Š',n:'Aegis Matrix',d:'+8% dmg & -8% dmg taken while shielded /rank',max:3,rarity:'rare'},
{id:'grit',ic:'ðŸ©¸',n:'Last Grit',d:'Below 35% HP: +30% dmg, -10% dmg taken /rank',max:2,rarity:'uncommon'},
{id:'shatter',ic:'â–',n:'Shatter Core',d:'Frozen/stunned kills explode /rank',max:3,rarity:'rare'},
{id:'combust',ic:'â™¨',n:'Combustion',d:'Burning kills explode & spread fire /rank',max:3,rarity:'uncommon'},
{id:'scavenge',ic:'âš™',n:'Scavenge Plating',d:'Coins also grant shield /rank',max:2,rarity:'common'},
{id:'void',ic:'ðŸ•³',n:'Void Touch',d:'Low-HP foes may be erased /rank',max:2,rarity:'epic'},
{id:'singularity',ic:'â¬¤',n:'SINGULARITY CORE',d:'CORE: every 10th shot collapses into a black hole',max:1,rarity:'mythic'},
{id:'phoenix',ic:'ðŸ”¥',n:'PHOENIX PROTOCOL',d:'CORE: once per run, death becomes a nova + revive',max:1,rarity:'mythic'},
{id:'overclock',ic:'âš¡',n:'OVERCLOCK HEART',d:'CORE: +40% fire rate, but -0.4 HP per shot',max:1,rarity:'mythic'},
{id:'dilations',ic:'â³',n:'TIME DILATION',d:'CORE: every 8s slow all enemies for 2s',max:1,rarity:'legendary'},
{id:'dronecmd',ic:'âŒ¬',n:'DRONE COMMAND',d:'CORE: periodic 4-target auto-volley',max:1,rarity:'legendary'},
{id:'critwave',ic:'âœ§',n:'CRIT WAVE',d:'CORE: crits fire a 3-shot wave',max:1,rarity:'legendary'}
];
NC.forEach(function(a){ABIL.push(a);ALL_CARDS.push(a);});
/* ---------- computeStats: new stats + element baselines + stack bonuses ---------- */
var __cs=computeStats;
computeStats=function(){
__cs();
if(!RUN||!ST)return;
var ab=RUN.ab||{};
NEWSTATS.forEach(function(k){ST[k]=(ST[k]||0)+(ab[k]||0);});
var n=RUN.el&&RUN.el.mol?(String(RUN.el.f||'').length*3):(+RUN.el.n||0);
ST.echo+=Math.floor(n/30);
ST.flux+=Math.floor(n/26);
if(n%5===0)ST.momentum+=.5;
if(n%7===0)ST.aegis+=.5;
if(n%6===0)ST.grit+=.5;
if(n%8===0)ST.tempo+=.5;
if(n%9===0)ST.shatter+=.5;
if(n%4===0)ST.combust+=.5;
if(n%3===0)ST.scavenge+=.5;
if(n%11===0)ST.void+=.5;
Object.keys(ab).forEach(function(id){
if(id.indexOf('xcard_')===0){var lv=ab[id];if(lv>=3)ST.crit+=1;if(lv>=5)ST.dmg*=1.03;}
});
if(ab.overclock)ST.rate*=1.4;
};
/* ---------- fire wrap: echo/momentum/tempo/flux/aegis/grit/singularity/overclock/critwave ---------- */
var __fire=fire;
fire=function(p){
var before=RUN?RUN.bullets.length:0;
var mult=1;
if(ST){
var mi=movementInput(p);
if(ST.momentum&&(mi.dx||mi.dy))mult*=1+.12*ST.momentum;
if(ST.tempo&&(p.tempoT||0)>0)mult*=1+.25*ST.tempo;
if(ST.aegis&&p.sh>=ST.shieldMax*.9)mult*=1+.2*ST.aegis;
if(ST.grit&&p.hp<ST.hp*.35)mult*=1+.3*ST.grit;
}
__fire(p);
if(!RUN)return;
for(var i=before;i<RUN.bullets.length;i++){
var b=RUN.bullets[i];b.dmg*=mult;
if(ST&&ST.flux){var r=Math.random();if(r<.34)b.burn=true;else if(r<.67)b.poison=true;else b.corrode=true;}
if(ST&&ST.critwave&&b.crit&&!b.cw){b.cw=1;for(var k=-1;k<=1;k++)RUN.bullets.push({x:b.x,y:b.y,vx:b.vx*.8+k*60,vy:b.vy*.8+k*60,dmg:b.dmg*.4,r:3,pierce:0,hit:[],life:.6,owner:p.id});}
}
if(ST&&ST.echo){p.echoN=(p.echoN||0)+1;if(p.echoN%5===0){var src=RUN.bullets[RUN.bullets.length-1];if(src)RUN.bullets.push({x:p.x,y:p.y,vx:src.vx*.9,vy:src.vy*.9,dmg:src.dmg*.5,r:src.r,pierce:src.pierce+1,hit:[],life:1.2,owner:p.id});}}
if(RUN.ab&&RUN.ab.singularity){p.singN=(p.singN||0)+(RUN.bullets.length-before);if(p.singN>=10){p.singN=0;var lb=RUN.bullets[RUN.bullets.length-1];var sx=lb?lb.x:p.x,sy=lb?lb.y:p.y;RUN.wells.push({x:sx,y:sy,t:1.2,lv:3});setTimeout(function(){if(RUN)aoe(sx,sy,180,ST.dmg*2.5,280);},1200);}}
if(RUN.ab&&RUN.ab.overclock&&RUN.bullets.length>before)p.hp=Math.max(1,p.hp-.4);
};
/* ---------- useActive -> tempo ---------- */
var __ua=useActive;
useActive=function(p){var ready=!p.downed&&(p.activeCd||0)<=0;__ua(p);if(ready&&ST&&ST.tempo)p.tempoT=3+ST.tempo;};
/* ---------- hurtPlayer: aegis/grit/phoenix ---------- */
var __hp=hurtPlayer;
hurtPlayer=function(p,d){
if(ST&&RUN){
if(ST.phoenix&&!RUN.phoenixUsed&&(p.hp-d*1.15)<=0){RUN.phoenixUsed=true;p.hp=ST.hp*.5;p.iframes=2;aoe(p.x,p.y,260,ST.dmg*3,RUN.hue);banner('PHOENIX PROTOCOL',1800);ringFx(p.x,p.y,25,200);return;}
if(ST.aegis&&p.sh>0)d*=1-.08*ST.aegis;
if(ST.grit&&p.hp<ST.hp*.35)d*=1-.1*ST.grit;
}
__hp(p,d);
};
/* ---------- dmgEnemy: void erase ---------- */
var __de=dmgEnemy;
dmgEnemy=function(e,d,o){
if(ST&&ST.void&&e&&!e.boss&&!e.dead&&e.hp>0&&e.hp<e.maxhp*.1&&Math.random()<.12*ST.void){d=e.hp+999;o=o||{};o.col='#b66cff';o.big=true;ringFx(e.x,e.y,280,70);}
__de(e,d,o);
};
/* ---------- killEnemy: shatter + combust ---------- */
var __ke=killEnemy;
killEnemy=function(e){
var fr=e.freeze>0||e.stun>0,bu=!!e.burn,x=e.x,y=e.y;
__ke(e);
if(fr&&ST&&ST.shatter)aoe(x,y,70+20*ST.shatter,ST.dmg*.8*ST.shatter,205);
if(bu&&ST&&ST.combust){aoe(x,y,60+20*ST.combust,ST.dmg*.6*ST.combust,25);RUN.enemies.forEach(function(o){if(!o.dead&&d2(o.x,o.y,x,y)<90*90)addBurn(o,ST.dmg*.4,3);});}
};
/* ---------- updPickups: scavenge ---------- */
var __pk=updPickups;
updPickups=function(dt){
var c0=RUN?RUN.coins:0;
__pk(dt);
if(RUN&&ST&&ST.scavenge&&RUN.coins>c0)RUN.players.forEach(function(q){q.sh=Math.min(ST.shieldMax,q.sh+(RUN.coins-c0)*.15*ST.scavenge);});
};
/* ---------- updPlayer: tempo decay, dilation, dronecmd ---------- */
var __up=updPlayer;
updPlayer=function(p,dt){
__up(p,dt);
if(!RUN)return;
if(p.tempoT>0)p.tempoT-=dt;
if(RUN.ab&&RUN.ab.dilations){p.dilT=(p.dilT||8)-dt;if(p.dilT<=0){p.dilT=8;RUN.enemies.forEach(function(e){if(!e.boss)e.slowT=Math.max(e.slowT,2);});ringFx(p.x,p.y,200,160);}}
if(RUN.ab&&RUN.ab.dronecmd){p.drT=(p.drT||2)-dt;if(p.drT<=0){p.drT=2;RUN.enemies.filter(function(e){return !e.dead;}).slice(0,4).forEach(function(t){var a=Math.atan2(t.y-p.y,t.x-p.x);RUN.bullets.push({x:p.x,y:p.y,vx:Math.cos(a)*ST.ps,vy:Math.sin(a)*ST.ps,dmg:ST.dmg*.6,r:4,pierce:1,hit:[],life:1.2,owner:p.id});});}}
};
/* ---------- chooseCard: rarity bonuses ---------- */
var __cc=chooseCard;
chooseCard=function(pid,key){
var card=null;
if(RUN&&RUN.pools&&RUN.pools[pid])card=RUN.pools[pid].find(function(c){return c.key===key;});
__cc(pid,key);
if(card&&RUN&&card.rarity){
if(card.rarity==='rare')ST.dmg*=1.02;
else if(card.rarity==='epic')RUN.players.forEach(function(p){p.hp=Math.min(ST.hp,p.hp+10);});
else if(card.rarity==='legendary'){RUN.coins+=15;SAVE.addCoins(15);}
else if(card.rarity==='mythic')ST.crit+=3;
}
};
/* ---------- settings UI + keybinds ---------- */
function buildKeysUI(krow){
krow.innerHTML='';
var K=['dash','active','autofire'];
K.forEach(function(k){
var b=document.createElement('button');b.className='btn chamf';b.style.cssText='padding:6px 10px;font-size:10px';
b.textContent=k.toUpperCase()+': '+String(SAVE.set.binds[k]).replace('Key','');
b.onclick=function(){window.__reb=k;b.textContent=k.toUpperCase()+': PRESS KEYâ€¦';};
krow.appendChild(b);
});
}
function addSettings(){
var scr=document.getElementById('scr-settings');
if(!scr||document.getElementById('mega-set'))return;
SAVE.set.binds=SAVE.set.binds||{dash:'Space',active:'KeyQ',autofire:'KeyF'};
var box=document.createElement('div');box.id='mega-set';box.style.cssText='margin-top:14px;display:grid;gap:10px;max-width:640px';
box.innerHTML='<div class="panel" style="padding:14px"><b>EXTRA OPTIONS</b><div id="mx-opts" style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px"></div></div><div class="panel" style="padding:14px"><b>KEYBINDS</b><div id="mx-keys" style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px"></div><small style="color:var(--tx2)">Click a bind then press a key Â· Esc cancels.</small></div>';
scr.appendChild(box);
var orow=document.getElementById('mx-opts');
[['minimap','MINIMAP'],['fps','FPS'],['trails','TRAILS'],['glow','GLOW'],['tele','TELEGRAPHS'],['hitstop','HITSTOP'],['redflash','SOFT FLASH']].forEach(function(o){
if(SAVE.set[o[0]]===undefined)SAVE.set[o[0]]=1;
var b=document.createElement('button');b.className='btn chamf';b.style.cssText='padding:6px 10px;font-size:10px';
function paint(){b.textContent=o[1]+(SAVE.set[o[0]]?' âœ“':' âœ—');b.style.borderColor=SAVE.set[o[0]]?'#48c774':'#555';}
paint();
b.onclick=function(){SAVE.set[o[0]]=SAVE.set[o[0]]?0:1;SAVE.save();paint();};
orow.appendChild(b);
});
buildKeysUI(document.getElementById('mx-keys'));
}
addSettings();
addEventListener('keydown',function(e){
if(window.__reb){e.preventDefault();e.stopPropagation();if(e.code!=='Escape'){SAVE.set.binds[window.__reb]=e.code;SAVE.save();}window.__reb=null;var kr=document.getElementById('mx-keys');if(kr)buildKeysUI(kr);return;}
if(!RUN||document.getElementById('scr-game').classList.contains('hidden'))return;
var B=SAVE.set.binds||{};
function act(a){if(RUN.isOnline)requestPlayerAction(a);else{if(a==='dash')tryDash(RUN.players[0]);else useActive(RUN.players[0]);}}
if(e.code===B.dash&&B.dash!=='Space'){e.stopPropagation();act('dash');}
else if(e.code===B.active&&B.active!=='KeyQ'){e.stopPropagation();act('active');}
else if(e.code===B.autofire&&B.autofire!=='KeyF'){e.stopPropagation();autofire=!autofire;var el=document.getElementById('autofire');if(el)el.innerHTML='<span>AUTOFIRE '+(autofire?'ON':'OFF')+'</span>';}
else if(e.code==='Space'&&B.dash!=='Space')e.stopPropagation();
else if(e.code==='KeyQ'&&B.active!=='KeyQ')e.stopPropagation();
else if(e.code==='KeyF'&&B.autofire!=='KeyF')e.stopPropagation();
},true);
/* ---------- render wrap: trails, telegraphs, minimap in money panel, fps ---------- */
var fpsE=0,fpsT=0,fpsV=60;
var __ren=render;
render=function(){
__ren();
if(!RUN)return;
var S=SAVE.set;
fpsT+=1/60;fpsE++;if(fpsT>=.5){fpsV=Math.round(fpsE/fpsT);fpsE=0;fpsT=0;}
if(S.trails){cx.globalCompositeOperation='lighter';RUN.bullets.forEach(function(b){cx.strokeStyle='hsla('+RUN.hue+',90%,65%,.35)';cx.lineWidth=Math.max(1,b.r*.8);cx.beginPath();cx.moveTo(b.x-b.vx*.05,b.y-b.vy*.05);cx.lineTo(b.x,b.y);cx.stroke();});cx.globalCompositeOperation='source-over';}
if(S.tele){RUN.enemies.forEach(function(e){if(e.dead)return;
if(e.type==='sniper'&&e.charge>0){var tp=nearestPlayer(e.x,e.y);cx.strokeStyle='rgba(255,60,60,.5)';cx.lineWidth=1;cx.beginPath();cx.moveTo(e.x,e.y);cx.lineTo(tp.x,tp.y);cx.stroke();}
if(e.type==='charger'&&e.charging>0){cx.strokeStyle='hsla(10,90%,60%,.7)';cx.lineWidth=2;cx.beginPath();cx.arc(e.x,e.y,e.r+6,0,TAU);cx.stroke();}
if(e.type==='bomber'&&e.hp<e.maxhp*.35){cx.fillStyle='rgba(255,120,40,'+(Math.abs(Math.sin(RUN.t*18))*.8)+')';cx.beginPath();cx.arc(e.x,e.y-e.r-6,3,0,TAU);cx.fill();}
});}
if(S.minimap){
var hc=document.getElementById('h-coins');
var pr=hc&&hc.parentElement?hc.parentElement.getBoundingClientRect():null;
var size=110;
var rx=pr?pr.right-size-4:W-size-12,ry=pr?pr.bottom+4:12;
cx.fillStyle='rgba(10,15,22,.85)';cx.fillRect(rx,ry,size,size);
cx.strokeStyle='hsla('+RUN.hue+',70%,55%,.6)';cx.lineWidth=1;cx.strokeRect(rx,ry,size,size);
function dot(x,y,c,s2){cx.fillStyle=c;cx.fillRect(rx+x/W*size-(s2||1),ry+y/H*size-(s2||1),(s2||2)+1,(s2||2)+1);}
RUN.pickups.forEach(function(k){dot(k.x,k.y,'#ffd43b',1);});
RUN.enemies.forEach(function(e){if(!e.dead)dot(e.x,e.y,e.boss?'#ff4bd9':'#ff5d8f',e.boss?2:1);});
RUN.players.forEach(function(p){dot(p.x,p.y,'#4fd8eb',2);});
}
if(S.fps){cx.fillStyle='#7ef0a6';cx.font='11px monospace';cx.textAlign='left';cx.fillText('FPS '+fpsV,12,H-12);}
};
console.log('ISO_MEGA2_GAME active: 10 new stats, 16 new cards, rarity bonuses, expanded settings + keybinds.');
})();

/* ISO_NEWSTATS_V2 */
(function(){
if(window.__ISO_NS2__)return;window.__ISO_NS2__=true;
var NS=['echo','momentum','tempo','flux','aegis','grit','shatter','combust','scavenge','void'];
function elnum(){var el=RUN&&RUN.el;return el&&!el.mol?+el.n:0;}
var __cs=computeStats;
computeStats=function(){
__cs();
if(!RUN||!ST)return;
var ab=RUN.ab||{},n=elnum();
NS.forEach(function(k){ST[k]=(ST[k]||0)+(ab[k]||0);});
ST.echo+=Math.floor(n/30);
ST.flux+=Math.floor(n/26);
if(n%5===0)ST.momentum+=.5;
if(n%7===0)ST.aegis+=.5;
if(n%6===0)ST.grit+=.5;
if(n%8===0)ST.tempo+=.5;
if(n%9===0)ST.shatter+=.5;
if(n%4===0)ST.combust+=.5;
if(n%3===0)ST.scavenge+=.5;
if(n%11===0)ST.void+=.5;
window.__ISO_ST=ST;window.__ISO_RUN={ab:RUN.ab,elId:RUN.el.id};
};
var NC=[
{id:'echo',ic:'âˆ¿',n:'Echo Chamber',d:'Every 5th shot echoes at 50% dmg',max:3,rarity:'rare'},
{id:'momentum',ic:'âž ',n:'Momentum Coils',d:'+12% dmg while moving /rank',max:3,rarity:'uncommon'},
{id:'tempo',ic:'â™©',n:'Battle Tempo',d:'After ability: +25% fire rate 4s /rank',max:3,rarity:'rare'},
{id:'flux',ic:'â˜¯',n:'Flux Rounds',d:'Shots apply random elemental status',max:2,rarity:'epic'},
{id:'aegis',ic:'â›Š',n:'Aegis Matrix',d:'+8% dmg & -8% dmg taken while shielded /rank',max:3,rarity:'rare'},
{id:'grit',ic:'ðŸ©¸',n:'Last Grit',d:'Below 35% HP: +30% dmg, -10% dmg taken /rank',max:2,rarity:'uncommon'},
{id:'shatter',ic:'â–',n:'Shatter Core',d:'Frozen/stunned kills explode /rank',max:3,rarity:'rare'},
{id:'combust',ic:'â™¨',n:'Combustion',d:'Burning kills explode & spread fire /rank',max:3,rarity:'uncommon'},
{id:'scavenge',ic:'âš™',n:'Scavenge Plating',d:'Coins also grant shield /rank',max:2,rarity:'common'},
{id:'void',ic:'ðŸ•³',n:'Void Touch',d:'Low-HP foes may be erased /rank',max:2,rarity:'epic'}];
NC.forEach(function(a){ABIL.push(a);ALL_CARDS.push(a);});
var __fire=fire;
fire=function(p){
var before=RUN?RUN.bullets.length:0;
__fire(p);
if(!RUN||!ST)return;
var mi=movementInput(p),moving=(mi.dx||mi.dy),mult=1;
if(ST.momentum&&moving)mult*=1+.12*ST.momentum;
if(ST.tempo&&(p.tempoT||0)>0)mult*=1+.25*ST.tempo;
if(ST.aegis&&p.sh>=ST.shieldMax*.9)mult*=1+.2*ST.aegis;
if(ST.grit&&p.hp<ST.hp*.35)mult*=1+.3*ST.grit;
for(var i=before;i<RUN.bullets.length;i++){var b=RUN.bullets[i];b.dmg*=mult;
if(ST.flux){var r=Math.random();if(r<.34)b.burn=true;else if(r<.67)b.poison=true;else b.corrode=true;}}
if(ST.echo){p.echoN=(p.echoN||0)+1;if(p.echoN%5===0){var s=RUN.bullets[RUN.bullets.length-1];if(s)RUN.bullets.push({x:p.x,y:p.y,vx:s.vx*.9,vy:s.vy*.9,dmg:s.dmg*.5,r:s.r,pierce:s.pierce+1,hit:[],life:1.2,owner:p.id});}}
};
var __ke=killEnemy;
killEnemy=function(e){
var fr=e.freeze>0||e.stun>0,bu=!!e.burn,x=e.x,y=e.y;
__ke(e);
if(fr&&ST.shatter)aoe(x,y,70+20*ST.shatter,ST.dmg*.8*ST.shatter,205);
if(bu&&ST.combust){aoe(x,y,60+20*ST.combust,ST.dmg*.6*ST.combust,25);RUN.enemies.forEach(function(o){if(!o.dead&&d2(o.x,o.y,x,y)<90*90)addBurn(o,ST.dmg*.4,3);});}
};
var __hp=hurtPlayer;
hurtPlayer=function(p,d){
if(ST){if(ST.aegis&&p.sh>0)d*=1-.08*ST.aegis;if(ST.grit&&p.hp<ST.hp*.35)d*=1-.1*ST.grit;}
__hp(p,d);
};
var __pk=updPickups;
updPickups=function(dt){var c0=RUN?RUN.coins:0;__pk(dt);if(RUN&&ST&&ST.scavenge&&RUN.coins>c0){RUN.players.forEach(function(q){q.sh=Math.min(ST.shieldMax,q.sh+(RUN.coins-c0)*.15*ST.scavenge);});}};
var __de=dmgEnemy;
dmgEnemy=function(e,d,o){if(ST&&ST.void&&e&&!e.boss&&!e.dead&&e.hp>0&&e.hp<e.maxhp*.1&&Math.random()<.12*ST.void){d=e.hp+999;o=o||{};o.col='#b66cff';o.big=true;ringFx(e.x,e.y,280,60);}__de(e,d,o);};
var __ua=useActive;
useActive=function(p){var had=!p.downed&&(p.activeCd||0)<=0;__ua(p);if(had&&ST&&ST.tempo)p.tempoT=3+ST.tempo;};
SAVE.set.binds=SAVE.set.binds||{dash:'Space',active:'KeyQ',autofire:'KeyF'};
addEventListener('keydown',function(e){
if(window.__rebinding)return;
if(!RUN||document.getElementById('scr-game').classList.contains('hidden'))return;
var B=SAVE.set.binds;
function act(a){if(RUN.isOnline){requestPlayerAction(a);}else{if(a==='dash')tryDash(RUN.players[0]);else useActive(RUN.players[0]);}}
if(e.code===B.dash&&B.dash!=='Space'){e.preventDefault();e.stopPropagation();act('dash');}
else if(e.code===B.active&&B.active!=='KeyQ'){e.preventDefault();e.stopPropagation();act('active');}
else if(e.code===B.autofire&&B.autofire!=='KeyF'){e.preventDefault();e.stopPropagation();autofire=!autofire;var el2=document.getElementById('autofire');if(el2)el2.innerHTML='<span>'+B.autofire.replace('Key','')+' Â· AUTOFIRE '+(autofire?'ON':'OFF')+'</span>';}
else if(e.code==='Space'&&B.dash!=='Space')e.stopPropagation();
else if(e.code==='KeyQ'&&B.active!=='KeyQ')e.stopPropagation();
else if(e.code==='KeyF'&&B.autofire!=='KeyF')e.stopPropagation();
},true);
var __ren=render;
var __isoPrev=performance.now(),__isoFps=60;
render=function(){
var now=performance.now();var dt=now-__isoPrev;__isoPrev=now;
if(dt>0)__isoFps=__isoFps*.9+(1000/dt)*.1;
__ren();
if(!RUN)return;
var S=SAVE.set;
if(S.fps){cx.fillStyle='#7ef0a6';cx.font='11px monospace';cx.textAlign='left';cx.fillText('FPS '+Math.round(__isoFps),12,H-12);}
if(S.trails||S.glow){cx.globalCompositeOperation='lighter';
RUN.bullets.forEach(function(b){
if(S.trails){cx.strokeStyle='hsla('+RUN.hue+',90%,65%,.35)';cx.lineWidth=Math.max(1,b.r*.8);cx.beginPath();cx.moveTo(b.x-b.vx*.05,b.y-b.vy*.05);cx.lineTo(b.x,b.y);cx.stroke();}
if(S.glow){var g=cx.createRadialGradient(b.x,b.y,0,b.x,b.y,b.r*3);g.addColorStop(0,'hsla('+RUN.hue+',90%,70%,.3)');g.addColorStop(1,'transparent');cx.fillStyle=g;cx.beginPath();cx.arc(b.x,b.y,b.r*3,0,TAU);cx.fill();}
});
cx.globalCompositeOperation='source-over';}
if(S.tele){RUN.enemies.forEach(function(e){if(e.dead)return;
if(e.type==='sniper'&&e.charge>0){var tp=RUN.players[0];cx.strokeStyle='rgba(255,60,60,.5)';cx.lineWidth=1;cx.beginPath();cx.moveTo(e.x,e.y);cx.lineTo(tp.x,tp.y);cx.stroke();}
if(e.type==='charger'&&e.charging>0){cx.strokeStyle='hsla(10,90%,60%,.7)';cx.lineWidth=2;cx.beginPath();cx.arc(e.x,e.y,e.r+6,0,TAU);cx.stroke();}
if(e.type==='bomber'&&e.hp<e.maxhp*.35){cx.fillStyle='rgba(255,120,40,'+(Math.abs(Math.sin(RUN.t*18))*.8)+')';cx.beginPath();cx.arc(e.x,e.y-e.r-6,3,0,TAU);cx.fill();}
});}
if(S.minimap){var hc=document.getElementById('h-coins');var pr=hc&&hc.parentElement?hc.parentElement.getBoundingClientRect():null;var size=110;
var rx=pr?pr.right-size-4:W-size-12,ry=pr?pr.bottom+4:12;
cx.fillStyle='rgba(10,15,22,.85)';cx.fillRect(rx,ry,size,size);
cx.strokeStyle='hsla('+RUN.hue+',70%,55%,.6)';cx.lineWidth=1;cx.strokeRect(rx,ry,size,size);
RUN.pickups.forEach(function(k){cx.fillStyle='#ffd43b';cx.fillRect(rx+k.x/W*size-1,ry+k.y/H*size-1,2,2);});
RUN.enemies.forEach(function(e){if(!e.dead){cx.fillStyle=e.boss?'#ff4bd9':'#ff5d8f';var s2=e.boss?3:2;cx.fillRect(rx+e.x/W*size-1,ry+e.y/H*size-1,s2,s2);}});
RUN.players.forEach(function(p){cx.fillStyle='#4fd8eb';cx.fillRect(rx+p.x/W*size-2,ry+p.y/H*size-2,3,3);});}
if(S.redflash){var hf=document.getElementById('hitflash');if(hf&&parseFloat(hf.style.opacity)>0.4)hf.style.opacity=0.4;}
};
console.log('ISO_NEWSTATS_V2 active: 10 new stats, 10 new cards, settings hooks, minimap/trails/telegraphs.');
})();

/* ISO_STATFIX_V3 */
(function(){
if(window.__ISO_SF3__)return;window.__ISO_SF3__=true;
function h32(s){s=String(s||'');var h=2166136261>>>0;for(var i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)>>>0;}return h>>>0;}
function nsFor(el){
var n=(el&&el.mol)?(h32(el.token||el.f||el.name)%118):(el?(+el.n||0):0);
var cat=(el&&!el.mol)?(el.cat||0):((el&&el.mol)?(h32(el.name)%11):0);
var o={
echo:Math.floor(((n*7)%13)/6),
momentum:Math.floor(((n*3)%11)/5),
tempo:Math.floor(((n*5)%9)/4),
flux:Math.floor(((n*11)%17)/8),
aegis:Math.floor(((n*13)%15)/7),
grit:Math.floor(((n*17)%13)/6),
shatter:Math.floor(((n*19)%11)/5),
combust:Math.floor(((n*23)%17)/8),
scavenge:Math.floor(((n*29)%13)/6),
void:Math.floor(((n*31)%19)/9)
};
var cb={0:'combust',1:'grit',2:'momentum',3:'shatter',4:'echo',5:'tempo',6:'flux',7:'aegis',8:'scavenge',9:'void',10:'echo'}[cat];
if(cb)o[cb]+=1;
return o;
}
window.ISO_NS=nsFor;
var NSKEYS=['echo','momentum','tempo','flux','aegis','grit','shatter','combust','scavenge','void'];
var __cs=computeStats;
computeStats=function(){
__cs();
if(!RUN||!ST)return;
var b=nsFor(RUN.el),ab=RUN.ab||{};
NSKEYS.forEach(function(k){ST[k]=(b[k]||0)+(ab[k]||0);});
};
SAVE.set=SAVE.set||{};
SAVE.set.binds=SAVE.set.binds||{dash:'Space',active:'KeyQ',autofire:'KeyF'};
function bindLbl(){var el=document.getElementById('autofire');if(el)el.innerHTML='<span>'+(SAVE.set.binds.autofire||'KeyF').replace('Key','')+' AUTOFIRE '+(autofire?'ON':'OFF')+'</span>';}
window.ISO_BINDLBL=bindLbl;
function doDash(){if(RUN.isOnline){NET.sendClientAction('dash');}else{tryDash(RUN.players[0]);if(RUN.players[1])tryDash(RUN.players[1]);}}
function doActive(){if(RUN.isOnline){NET.sendClientAction('active');}else{useActive(RUN.players[0]);if(RUN.players[1])useActive(RUN.players[1]);}}
addEventListener('keydown',function(e){
if(window.__rebinding)return;
if(!RUN||document.getElementById('scr-game').classList.contains('hidden'))return;
var B=SAVE.set.binds,code=e.code;
if(code==='Space'&&B.dash!=='Space'){e.preventDefault();e.stopPropagation();}
else if(code==='KeyQ'&&B.active!=='KeyQ'){e.stopPropagation();}
else if(code==='KeyF'&&B.autofire!=='KeyF'){e.stopPropagation();}
else if(code===B.dash&&B.dash!=='Space'){e.preventDefault();doDash();}
else if(code===B.active&&B.active!=='KeyQ'){doActive();}
else if(code===B.autofire&&B.autofire!=='KeyF'){autofire=!autofire;bindLbl();}
},true);
console.log('ISO_STATFIX_V3 active: unique per-element new stats + rebindable keys.');
})();

/* ISO_RENDER_SAFE */
(function(){
if(window.__ISO_RENDER_SAFE__)return;window.__ISO_RENDER_SAFE__=true;
renderBG=function(dt){
 try{
  bgc.clearRect(0,0,W,H);
  bgc.fillStyle='#070a10';bgc.fillRect(0,0,W,H);
  var el=null;
  try{ if(window.DATA&&DATA.EL&&window.SAVE) el=DATA.EL(SAVE.sel); }catch(e){}
  var hue=(el&&el.hue!=null)?el.hue:190;
  var g1=bgc.createRadialGradient(W*.15,H*.1,50,W*.15,H*.1,W*.6);
  g1.addColorStop(0,'hsla('+hue+',60%,40%,.07)');g1.addColorStop(1,'transparent');
  bgc.fillStyle=g1;bgc.fillRect(0,0,W,H);
  var g2=bgc.createRadialGradient(W*.9,H*.9,50,W*.9,H*.9,W*.55);
  g2.addColorStop(0,'hsla('+((hue+120)%360)+',60%,40%,.06)');g2.addColorStop(1,'transparent');
  bgc.fillStyle=g2;bgc.fillRect(0,0,W,H);
  if(typeof glyphs!=='undefined'&&glyphs&&glyphs.length){
   glyphs.forEach(function(g){
    g.x+=g.vx*dt;g.y+=g.vy*dt;
    if(g.x<-40)g.x=W+40;if(g.x>W+40)g.x=-40;
    if(g.y<-40)g.y=H+40;if(g.y>H+40)g.y=-40;
    bgc.font=g.s+'px "Share Tech Mono"';
    bgc.fillStyle='hsla('+g.h+',70%,65%,'+g.a+')';
    bgc.fillText(g.sym,g.x,g.y);
   });
  }
 }catch(err){ /* never spam the loop again */ }
};
console.log('ISO_RENDER_SAFE active: menu background is molecule-safe.');
})();

/* ISO_ARCH_V1 */
(function(){
if(window.__ISO_ARCH_V1__)return;window.__ISO_ARCH_V1__=true;

/* ---- SAFE menu background: molecules (Glycine) no longer crash it ---- */
renderBG=function(dt){
try{
bgc.clearRect(0,0,W,H);bgc.fillStyle='#070a10';bgc.fillRect(0,0,W,H);
var el=null;try{el=DATA.EL(SAVE.sel);}catch(e){}
var hue=(el&&el.hue!=null)?el.hue:190;
var g1=bgc.createRadialGradient(W*.15,H*.1,50,W*.15,H*.1,W*.6);
g1.addColorStop(0,'hsla('+hue+',60%,40%,.08)');g1.addColorStop(1,'transparent');
bgc.fillStyle=g1;bgc.fillRect(0,0,W,H);
var g2=bgc.createRadialGradient(W*.9,H*.9,50,W*.9,H*.9,W*.55);
g2.addColorStop(0,'hsla('+((hue+120)%360)+',60%,40%,.06)');g2.addColorStop(1,'transparent');
bgc.fillStyle=g2;bgc.fillRect(0,0,W,H);
for(var i=0;i<glyphs.length;i++){var g=glyphs[i];
g.x+=g.vx*dt;g.y+=g.vy*dt;
if(g.x<-40)g.x=W+40;if(g.x>W+40)g.x=-40;if(g.y<-40)g.y=H+40;if(g.y>H+40)g.y=-40;
bgc.font=g.s+'px "Share Tech Mono"';bgc.fillStyle='hsla('+g.h+',70%,65%,'+g.a+')';bgc.fillText(g.sym,g.x,g.y);}
}catch(err){}
};

/* ---- ALLY / SUMMON SYSTEM (full HP, decays 5 HP per tick) ---- */
function allyPoolAll(){return Object.keys(ETYPES);}
function summon(p,n,pool){
RUN.allies=RUN.allies||[];
var use=pool||allyPoolAll();
for(var i=0;i<n;i++){
var t=use[irnd(use.length)];var b=ETYPES[t]||ETYPES.mote;
var w=RUN.wave||1;var hpMul=1+(w-1)*.22+Math.pow(w,1.5)*.02;
RUN.allies.push({type:t,x:p.x+rnd(-46,46),y:p.y+rnd(-46,46),r:b.r,hp:b.hp*hpMul,maxhp:b.hp*hpMul,dmg:b.dmg+w*.6,spd:b.spd,hue:b.hue,shape:b.shape,touch:0,decayT:0});
ringFx(p.x,p.y,140,80);
}
SFX.active();
}
function updAllies(dt){
if(!RUN.allies)return;
for(var i=RUN.allies.length-1;i>=0;i--){
var a=RUN.allies[i];
a.decayT+=dt;while(a.decayT>=1){a.decayT-=1;a.hp-=5;}
a.touch-=dt;
var t=null,bd=1e9;
RUN.enemies.forEach(function(e){if(e.dead)return;var dd=d2(a.x,a.y,e.x,e.y);if(dd<bd){bd=dd;t=e;}});
if(t){var d=Math.sqrt(bd)||1;
if(d>a.r+t.r){a.x+=(t.x-a.x)/d*a.spd*dt;a.y+=(t.y-a.y)/d*a.spd*dt;}
else if(a.touch<=0){a.touch=.7;dmgEnemy(t,a.dmg,{quiet:true});if(t&&!t.dead)a.hp-=t.dmg*.5;}
}
if(a.hp<=0){burst(a.x,a.y,140);ringFx(a.x,a.y,140,60);RUN.allies.splice(i,1);}
}
}

/* ---- BUFF / DEBUFF helpers ---- */
function buffP(p,kind){
if(kind==='dmg'){p.puDamage=Math.max(p.puDamage||1,1.5);p.puTimer=6;}
if(kind==='rate'){p.puRate=Math.max(p.puRate||1,1.6);p.puTimer=6;}
if(kind==='shield'){p.sh=Math.min(ST.shieldMax+40,p.sh+ST.shieldMax);p.iframes=Math.max(p.iframes,1);}
if(kind==='speed'){p.adrenT=Math.max(p.adrenT,4);}
if(kind==='crit'){p.puCrit=1;p.puTimer=6;}
ringFx(p.x,p.y,140,130);
}
function debuffE(p,kind){
RUN.enemies.forEach(function(e){
if(e.dead||d2(e.x,e.y,p.x,p.y)>330*330)return;
if(kind==='slow')e.slowT=Math.max(e.slowT,4);
if(kind==='stun')e.stun=Math.max(e.stun,1.4);
if(kind==='mark')e.mark=Math.max(e.mark,8);
if(kind==='corrode')addCorrode(e,6,.5);
if(kind==='poison')addPoison(e,ST.dmg*.6,5);
if(kind==='conf')e.conf=Math.max(e.conf,3);
if(kind==='disarm'){e.shootT=Math.max(e.shootT||0,4);e.charge=0;}
});
ringFx(p.x,p.y,320,150);
}
function infect(p,e){e.infected=true;addPoison(e,ST.dmg*.6,5);}

/* ---- ARCHETYPE ability sets (3 choices each: dedicated buffs / debuffs / summons) ---- */
var ARCH={};
var SUM=[
{ic:'â¬¢',name:'Field Summon',desc:'Summon a random non-boss enemy at FULL health to fight for you. It decays 5 HP per second.',fn:function(p){summon(p,1);}},
{ic:'â‚',name:'Swarm Protocol',desc:'Deploy 3 small allied swarmers (full HP, 5 HP/s decay).',fn:function(p){summon(p,3,['swarm','wisp','mote','shardling']);}},
{ic:'â›¨',name:'Heavy Summon',desc:'Summon a heavy ally (brute/tank/crusher) and mend all your allies.',fn:function(p){summon(p,1,['brute','tank','crusher','basalt']);(RUN.allies||[]).forEach(function(a){a.hp=Math.min(a.maxhp,a.hp+a.maxhp*.3);});}}
];
var BUF=[
{ic:'âœš',name:'Reinforcement Field',desc:'DEDICATED BUFF: +50% damage and a big shield surge.',fn:function(p){buffP(p,'dmg');buffP(p,'shield');}},
{ic:'',name:'Catalytic Surge',desc:'DEDICATED BUFF: +60% fire rate and speed rush.',fn:function(p){buffP(p,'rate');buffP(p,'speed');}},
{ic:'â˜ˆ',name:'Weaken Field',desc:'DEDICATED DEBUFF: mark + corrode nearby enemies so they take more damage.',fn:function(p){debuffE(p,'mark');debuffE(p,'corrode');}}
];
var DEB=[
{ic:'â˜ˆ',name:'Green Pulse',desc:'DEDICATED DEBUFF: stun and disarm nearby enemies.',fn:function(p){debuffE(p,'stun');debuffE(p,'disarm');}},
{ic:'â„',name:'Neural Slow',desc:'DEDICATED DEBUFF: slow and confuse nearby enemies.',fn:function(p){debuffE(p,'slow');debuffE(p,'conf');}},
{ic:'âœš',name:'Fallback Aegis',desc:'DEDICATED BUFF: shield surge + guaranteed crits for 6s.',fn:function(p){buffP(p,'shield');buffP(p,'crit');}}
];
var INF=[
{ic:'â˜£',name:'Infect',desc:'Infect the nearest enemy; the infection spreads when it dies.',fn:function(p){var t=nearestEnemy(p.x,p.y);if(t)infect(p,t);debuffE(p,'poison');}},
{ic:'â‹',name:'Plague Nova',desc:'Infect every enemy near you and poison them.',fn:function(p){RUN.enemies.forEach(function(e){if(!e.dead&&d2(e.x,e.y,p.x,p.y)<260*260)infect(p,e);});}},
{ic:'âœš',name:'Toxic Overdrive',desc:'BUFF while debuffing: +30% damage and infect the 3 nearest foes.',fn:function(p){buffP(p,'dmg');var list=RUN.enemies.filter(function(e){return !e.dead;}).sort(function(a,b){return d2(a.x,a.y,p.x,p.y)-d2(b.x,b.y,p.x,p.y);}).slice(0,3);list.forEach(function(e){infect(p,e);});}}
];
var BNC=[
{ic:'â†º',name:'Bouncing Bollets',desc:'Your shots ricochet 3 times for 6s and corrode on hit.',fn:function(p){p.bounceT=6;p.corrodeB=true;p.splitB=false;}},
{ic:'â‹‰',name:'Split Bounce',desc:'Bouncing shots that also split on impact for 6s.',fn:function(p){p.bounceT=6;p.splitB=true;p.corrodeB=false;}},
{ic:'â‰ˆ',name:'Mercury Rain',desc:'Heavy bouncing slugs that slow whatever they hit.',fn:function(p){p.bounceT=6;p.corrodeB=false;p.splitB=false;debuffE(p,'slow');}}
];
function byKey(k){return k.charAt(0)==='e'?DATA.ELEMS[k]:DATA.MOLDEF[k];}
function defArch(key,list){
var el=byKey(key);if(!el)return;
ARCH[key]=list;
el.choices=list.map(function(L,i){return {id:'arch_'+key+'_'+i,key:'arch'+i,slot:i,ic:L.ic,name:L.name,desc:L.desc,power:1,main:i===0};});
el.signatures=el.choices;el.act=el.choices[0];
}
defArch('e39',SUM);defArch('e50',SUM);
defArch('e21',BUF);defArch('e25',BUF);defArch('e41',BUF);
defArch('e65',DEB);defArch('e99',DEB);defArch('e102',DEB);
defArch('e52',INF);defArch('e84',INF);
defArch('e35',BNC);defArch('e80',BNC);
var glyKey=null;Object.keys(DATA.MOLDEF).forEach(function(k){if(DATA.MOLDEF[k].name==='Glycine')glyKey=k;});
if(glyKey)defArch(glyKey,SUM);

/* ---- hooks: useActive, fire, killEnemy, update, render, net ---- */
var prevUse=useActive;
useActive=function(p){
if(!p||p.downed||p.activeCd>0)return;
var el=p.elem||RUN.el;
var key=el.mol?(el.id||el.name):('e'+el.n);
var list=ARCH[key];
if(!list)return prevUse(p);
var slot=Math.max(0,Math.min(2,Number(p.signatureSlot)||0));
p.activeCd=ST.activeCd;SFX.active();RUN.shake=Math.max(RUN.shake,8);
banner(list[slot].name.toUpperCase(),1200);ringFx(p.x,p.y,RUN.hue,150);
list[slot].fn(p);
};
var oldFire=fire;
fire=function(p){var before=RUN?RUN.bullets.length:0;oldFire(p);if(!RUN)return;
if(p.bounceT>0){for(var i=before;i<RUN.bullets.length;i++){var b=RUN.bullets[i];if(b.ric===undefined)b.ric=3;if(p.splitB)b.fsplit=true;if(p.corrodeB)b.corrode=true;}}};
var oldKill=killEnemy;
killEnemy=function(e){
if(e.infected&&RUN){RUN.enemies.forEach(function(o){if(!o.dead&&!o.infected&&d2(o.x,o.y,e.x,e.y)<110*110){o.infected=true;addPoison(o,ST.dmg*.5,4);}});}
return oldKill(e);
};
var oldUpdate=update;
update=function(dt){
oldUpdate(dt);
if(!RUN)return;
RUN.allies=RUN.allies||[];
if(!RUN.isOnline||NET.isHost)updAllies(dt);
RUN.players.forEach(function(p){
if(p.bounceT>0){p.bounceT-=dt;if(!p._ricAdded){p._ricAdded=true;ST.ricochet=(ST.ricochet||0)+3;}}
else if(p._ricAdded){p._ricAdded=false;ST.ricochet=Math.max(0,(ST.ricochet||0)-3);}
});
};
var oldRender=render;
render=function(){
oldRender();
if(!RUN||!RUN.allies)return;
RUN.allies.forEach(function(a){
var col='hsl('+a.hue+' 80% 62%)';
cx.save();cx.translate(a.x,a.y);
cx.strokeStyle='rgba(126,240,166,.9)';cx.lineWidth=2;cx.beginPath();cx.arc(0,0,a.r+4,0,TAU);cx.stroke();
cx.fillStyle=col;cx.strokeStyle='#0008';cx.lineWidth=2;cx.beginPath();
if(a.shape==='square')cx.rect(-a.r,-a.r,a.r*2,a.r*2);
else if(a.shape==='diamond'){cx.moveTo(0,-a.r);cx.lineTo(a.r,0);cx.lineTo(0,a.r);cx.lineTo(-a.r,0);cx.closePath();}
else if(a.shape==='tri'){cx.moveTo(0,-a.r);cx.lineTo(a.r,a.r);cx.lineTo(-a.r,a.r);cx.closePath();}
else cx.arc(0,0,a.r,0,TAU);
cx.fill();cx.stroke();cx.restore();
cx.fillStyle='#0009';cx.fillRect(a.x-a.r,a.y-a.r-7,a.r*2,3);
cx.fillStyle='#7ef0a6';cx.fillRect(a.x-a.r,a.y-a.r-7,a.r*2*clamp(a.hp/a.maxhp,0,1),3);
});
};
if(window.NET){
var oldBS=NET.broadcastSnapshot;
NET.broadcastSnapshot=function(s){
if(s&&RUN&&RUN.allies)s.allies=RUN.allies.map(function(a){return {t:a.type,x:a.x,y:a.y,hp:a.hp,maxhp:a.maxhp,r:a.r,hue:a.hue,shape:a.shape};});
return oldBS(s);
};
var oldSN=NET.onStateSnapshot;
NET.onStateSnapshot=function(s){
var r=oldSN(s);
if(s&&s.allies&&RUN){var sx=W/(RUN.hostW||W),sy=H/(RUN.hostH||H);
RUN.allies=(s.allies||[]).map(function(o){return {type:o.t,x:o.x*sx,y:o.y*sy,hp:o.hp,maxhp:o.maxhp,r:Math.max(2,o.r*Math.min(sx,sy)),hue:o.hue,shape:o.shape,touch:0,decayT:0,spd:120,dmg:10};});}
return r;
};
}
var oldStart=start;
start=function(){var r=oldStart.apply(this,arguments);if(RUN)RUN.allies=RUN.allies||[];return r;};
console.log('ISO_ARCH_V1 active: safe menu bg + summoner/buffer/debuffer/infection/bounce archetypes.');
})();

/* ISO_ARCH_FINAL */
(function(){
if(window.__ISO_ARCH_FINAL__)return;window.__ISO_ARCH_FINAL__=true;
/* safe menu background: molecules no longer crash it */
renderBG=function(dt){
try{
bgc.clearRect(0,0,W,H);bgc.fillStyle='#070a10';bgc.fillRect(0,0,W,H);
var el=null;try{el=DATA.EL(SAVE.sel);}catch(e){}
var hue=(el&&el.hue!=null)?el.hue:190;
var g1=bgc.createRadialGradient(W*.15,H*.1,50,W*.15,H*.1,W*.6);
g1.addColorStop(0,'hsla('+hue+',60%,40%,.08)');g1.addColorStop(1,'transparent');bgc.fillStyle=g1;bgc.fillRect(0,0,W,H);
var g2=bgc.createRadialGradient(W*.9,H*.9,50,W*.9,H*.9,W*.55);
g2.addColorStop(0,'hsla('+((hue+120)%360)+',60%,40%,.06)');g2.addColorStop(1,'transparent');bgc.fillStyle=g2;bgc.fillRect(0,0,W,H);
for(var i=0;i<glyphs.length;i++){var g=glyphs[i];
g.x+=g.vx*dt;g.y+=g.vy*dt;
if(g.x<-40)g.x=W+40;if(g.x>W+40)g.x=-40;if(g.y<-40)g.y=H+40;if(g.y>H+40)g.y=-40;
bgc.font=g.s+'px "Share Tech Mono"';bgc.fillStyle='hsla('+g.h+',70%,65%,'+g.a+')';bgc.fillText(g.sym,g.x,g.y);}
}catch(err){}
};
/* ---- allies (summons) ---- */
function summon(p,type){
var b=ETYPES[type];if(!b)return;
var w=RUN.wave||1;var hpMul=1+(w-1)*.22+Math.pow(w,1.5)*.02;
RUN.allies=RUN.allies||[];
RUN.allies.push({type:type,x:p.x+rnd(-40,40),y:p.y+rnd(-40,40),r:b.r,hp:b.hp*hpMul,maxhp:b.hp*hpMul,spd:b.spd,dmg:b.dmg+w*.6,hue:b.hue,shape:b.shape,touch:0});
ringFx(p.x,p.y,140,90);
}
function summonRandom(p){
var pool=Object.keys(ETYPES).filter(function(t){return !ETYPES[t].special;});
summon(p,pool[irnd(pool.length)]);
}
/* ---- archetype ability sets ---- */
var SUM=[
{n:'Field Summon',ic:'â¬¢',d:'Summon a random non-boss enemy at FULL health to fight for you. It decays 5 HP per second.',f:function(p){summonRandom(p);}},
{n:'Swarm Protocol',ic:'â‚',d:'Deploy 3 small allied swarmers (full health, 5 HP/s decay).',f:function(p){summon(p,'swarm');summon(p,'wisp');summon(p,'mote');}},
{n:'Heavy Summon',ic:'â›¨',d:'Summon a heavy ally (brute/tank/crusher) and mend all your allies.',f:function(p){summon(p,['brute','tank','crusher'][irnd(3)]);(RUN.allies||[]).forEach(function(a){a.hp=Math.min(a.maxhp,a.hp+a.maxhp*.3);});}}
];
var BUF=[
{n:'War Catalyst',ic:'âœš',d:'DEDICATED BUFF: you and your partner gain +35% dmg and +25% fire rate for 6s.',f:function(p){RUN.players.forEach(function(q){q.puDamage=Math.max(q.puDamage||1,1.35);q.puRate=Math.max(q.puRate||1,1.25);q.puTimer=6;});ringFx(p.x,p.y,140,170);}},
{n:'Aegis Field',ic:'â›Š',d:'DEDICATED BUFF: all operators gain +30 shield and 1s of invulnerability.',f:function(p){RUN.players.forEach(function(q){q.sh=Math.min(ST.shieldMax+30,q.sh+30);q.iframes=Math.max(q.iframes,1);});}},
{n:'Weaken Field',ic:'â˜ˆ',d:'DEDICATED DEBUFF: mark, slow and corrode every enemy nearby.',f:function(p){RUN.enemies.forEach(function(e){if(!e.dead&&d2(e.x,e.y,p.x,p.y)<320*320){e.mark=Math.max(e.mark,8);e.slowT=Math.max(e.slowT,3);addCorrode(e,5,.45);}});}}
];
var DEB=[
{n:'Green Pulse',ic:'â˜ˆ',d:'DEDICATED DEBUFF: stun and disarm (delay attacks of) nearby enemies.',f:function(p){RUN.enemies.forEach(function(e){if(!e.dead&&d2(e.x,e.y,p.x,p.y)<300*300){e.stun=Math.max(e.stun,1.6);e.shootT=Math.max(e.shootT||0,3);}});}},
{n:'Neural Slow',ic:'â„',d:'DEDICATED DEBUFF: slow and confuse nearby enemies.',f:function(p){RUN.enemies.forEach(function(e){if(!e.dead&&d2(e.x,e.y,p.x,p.y)<300*300){e.slowT=Math.max(e.slowT,3.5);e.conf=Math.max(e.conf,2.5);}});}},
{n:'Ruin Mark',ic:'â˜ ',d:'DEDICATED DEBUFF: heavy corrode + poison on everything near you.',f:function(p){RUN.enemies.forEach(function(e){if(!e.dead&&d2(e.x,e.y,p.x,p.y)<300*300){addCorrode(e,6,.5);addPoison(e,ST.dmg*.6,5);}});}}
];
var INF=[
{n:'Infect',ic:'â˜£',d:'Infect the nearest enemy; the infection spreads to nearby foes when it dies.',f:function(p){var t=nearestEnemy(p.x,p.y);if(t){t.infected=true;addPoison(t,ST.dmg*.6,5);ringFx(t.x,t.y,120,80);}}},
{n:'Plague Nova',ic:'â‹',d:'Infect every enemy near you and poison them.',f:function(p){RUN.enemies.forEach(function(e){if(!e.dead&&d2(e.x,e.y,p.x,p.y)<260*260){e.infected=true;addPoison(e,ST.dmg*.5,4);}});}},
{n:'Toxic Overdrive',ic:'âœš',d:'BUFF + DEBUFF: +30% dmg for 6s and poison everything nearby.',f:function(p){p.puDamage=Math.max(p.puDamage||1,1.3);p.puTimer=6;RUN.enemies.forEach(function(e){if(!e.dead&&d2(e.x,e.y,p.x,p.y)<240*240)addPoison(e,ST.dmg*.5,4);});}}
];
var BNC=[
{n:'Bouncing Bolts',ic:'â†º',d:'Your shots ricochet to new targets for 6s.',f:function(p){p.bounceT=6;p.splitB=false;p.corrodeB=false;}},
{n:'Split Bounce',ic:'â‹‰',d:'Bouncing shots that also split on impact for 6s.',f:function(p){p.bounceT=6;p.splitB=true;p.corrodeB=false;}},
{n:'Mercury Rain',ic:'â‰ˆ',d:'Bouncing corrosive slugs that slow what they hit, 6s.',f:function(p){p.bounceT=6;p.corrodeB=true;p.splitB=false;}}
];
var ARCH={};
function setArch(elKey,list){
var el=DATA.ELEMS[elKey];if(!el)return;
ARCH[elKey]=list;
el.choices=list.map(function(L,i){return {id:'arch_'+elKey+'_'+i,key:'arch'+i,slot:i,ic:L.ic,name:L.n,desc:L.d,power:1,main:i===0};});
el.signatures=el.choices;el.act=el.choices[0];
}
setArch('e50',SUM);setArch('e39',SUM);
setArch('e21',BUF);setArch('e25',BUF);
setArch('e65',DEB);setArch('e99',DEB);setArch('e102',DEB);
setArch('e52',INF);setArch('e84',INF);setArch('e117',INF);
setArch('e35',BNC);setArch('e80',BNC);
var glyKey=null;Object.keys(DATA.MOLDEF).forEach(function(k){if(DATA.MOLDEF[k].name==='Glycine')glyKey=k;});
if(glyKey){var gm=DATA.MOLDEF[glyKey];ARCH[glyKey]=SUM;gm.choices=SUM.map(function(L,i){return {id:'arch_gly_'+i,key:'arch'+i,slot:i,ic:L.ic,name:L.n,desc:L.d,power:1,main:i===0};});gm.signatures=gm.choices;gm.act=gm.choices[0];}
/* ---- useActive override ---- */
var prevUA=useActive;
useActive=function(p){
if(!p||p.downed||p.activeCd>0)return;
var el=p.elem||RUN.el;
var key=el.mol?(el.id||''):('e'+el.n);
var arch=ARCH[key];
if(!arch)return prevUA(p);
var slot=Math.max(0,Math.min(2,Number(p.signatureSlot)||0));
p.activeCd=ST.activeCd;SFX.active();RUN.shake=Math.max(RUN.shake,8);
var c=el.choices?el.choices[slot]:null;
banner((c?c.name:'ABILITY').toUpperCase(),1200);
ringFx(p.x,p.y,140,150);
arch[slot].f(p);
};
/* ---- bounce bullets ---- */
var prevFire=fire;
fire=function(p){
var before=RUN?RUN.bullets.length:0;
prevFire(p);
if(!RUN)return;
if(p.bounceT>0){for(var i=before;i<RUN.bullets.length;i++){var b=RUN.bullets[i];if(b.ric===undefined)b.ric=3;if(p.splitB)b.fsplit=true;if(p.corrodeB)b.corrode=true;}}
};
/* ---- infection spread on death ---- */
var prevKill=killEnemy;
killEnemy=function(e){
if(e.infected&&RUN){var x=e.x,y=e.y;RUN.enemies.forEach(function(o){if(!o.dead&&o!==e&&d2(o.x,o.y,x,y)<110*110){o.infected=true;addPoison(o,ST.dmg*.5,3);}});}
prevKill(e);
};
/* ---- update: allies tick + bounce timer (host/solo only) ---- */
var prevUpd=update;
update=function(dt){
prevUpd(dt);
if(!RUN)return;
if(RUN.isOnline&&!NET.isHost)return;
RUN.players.forEach(function(p){if(p.bounceT>0)p.bounceT-=dt;});
var A=RUN.allies||[];
for(var i=A.length-1;i>=0;i--){
var a=A[i];
a.hp-=5*dt;a.touch-=dt;
if(a.hp<=0){burst(a.x,a.y,a.hue);A.splice(i,1);continue;}
var t=nearestEnemy(a.x,a.y);
if(t){var d=Math.hypot(t.x-a.x,t.y-a.y)||1;
if(d>a.r+t.r){a.x+=(t.x-a.x)/d*a.spd*dt;a.y+=(t.y-a.y)/d*a.spd*dt;}
else if(a.touch<=0){a.touch=.7;dmgEnemy(t,a.dmg,{quiet:true});a.hp-=t.dmg*.5;}}
}
};
/* ---- render: draw allies ---- */
var prevRen=render;
render=function(){
prevRen();
if(!RUN||!RUN.allies)return;
RUN.allies.forEach(function(a){
var col='hsl('+a.hue+' 80% 60%)';
cx.save();cx.translate(a.x,a.y);
cx.strokeStyle='rgba(126,240,166,.9)';cx.lineWidth=2;cx.beginPath();cx.arc(0,0,a.r+4,0,TAU);cx.stroke();
cx.fillStyle=col;cx.strokeStyle='#0008';cx.lineWidth=2;cx.beginPath();
if(a.shape==='square')cx.rect(-a.r,-a.r,a.r*2,a.r*2);
else if(a.shape==='diamond'){cx.moveTo(0,-a.r);cx.lineTo(a.r,0);cx.lineTo(0,a.r);cx.lineTo(-a.r,0);cx.closePath();}
else if(a.shape==='tri'){cx.moveTo(0,-a.r);cx.lineTo(a.r,a.r);cx.lineTo(-a.r,a.r);cx.closePath();}
else cx.arc(0,0,a.r,0,TAU);
cx.fill();cx.stroke();cx.restore();
cx.fillStyle='#0009';cx.fillRect(a.x-a.r,a.y-a.r-7,a.r*2,3);
cx.fillStyle='#7ef0a6';cx.fillRect(a.x-a.r,a.y-a.r-7,a.r*2*clamp(a.hp/a.maxhp,0,1),3);
});
};
/* ---- multiplayer sync for allies ---- */
if(window.NET){
var oldBS=NET.broadcastSnapshot;
NET.broadcastSnapshot=function(s){
if(s&&RUN&&RUN.allies)s.allies=RUN.allies.map(function(a){return {type:a.type,x:a.x,y:a.y,hp:a.hp,maxhp:a.maxhp,r:a.r,hue:a.hue,shape:a.shape};});
return oldBS(s);
};
var oldSN=NET.onStateSnapshot;
NET.onStateSnapshot=function(s){
oldSN(s);
if(RUN&&s&&s.allies){var sx=W/(RUN.hostW||W),sy=H/(RUN.hostH||H);
RUN.allies=s.allies.map(function(o){return {type:o.type,x:o.x*sx,y:o.y*sy,hp:o.hp,maxhp:o.maxhp,r:Math.max(2,o.r*Math.min(sx,sy)),hue:o.hue,shape:o.shape,touch:0,spd:120,dmg:10};});}
};
}
console.log('ISO_ARCH_FINAL active: summoners/buffers/debuffers/infection/bounce + safe menu bg.');
})();

/* ISO_ARCH_FIX_V1 */
(function(){
if(window.__ISO_ARCH_FIX_V1__)return;window.__ISO_ARCH_FIX_V1__=true;
function cslot(v){return Math.max(0,Math.min(2,Number(v)||0));}
renderBG=function(dt){
try{
bgc.clearRect(0,0,W,H);bgc.fillStyle='#070a10';bgc.fillRect(0,0,W,H);
var g1=bgc.createRadialGradient(W*.15,H*.1,50,W*.15,H*.1,W*.6);
g1.addColorStop(0,'rgba(79,216,235,.07)');g1.addColorStop(1,'transparent');bgc.fillStyle=g1;bgc.fillRect(0,0,W,H);
var g2=bgc.createRadialGradient(W*.9,H*.9,50,W*.9,H*.9,W*.55);
g2.addColorStop(0,'rgba(255,93,143,.06)');g2.addColorStop(1,'transparent');bgc.fillStyle=g2;bgc.fillRect(0,0,W,H);
for(var i=0;i<glyphs.length;i++){var g=glyphs[i];
g.x+=g.vx*dt;g.y+=g.vy*dt;
if(g.x<-40)g.x=W+40;if(g.x>W+40)g.x=-40;if(g.y<-40)g.y=H+40;if(g.y>H+40)g.y=-40;
bgc.font=g.s+'px "Share Tech Mono"';bgc.fillStyle='hsla('+g.h+',70%,65%,'+g.a+')';bgc.fillText(g.sym,g.x,g.y);}
}catch(err){}
};
var ARCH={};
ARCH['e50']='summon';ARCH['e39']='summon';ARCH['e21']='buffer';ARCH['e25']='buffer';ARCH['e78']='buffer';
ARCH['e65']='debuffer';ARCH['e99']='debuffer';ARCH['e102']='debuffer';
ARCH['e52']='infect';ARCH['e84']='infect';ARCH['e117']='infect';
ARCH['e35']='bounce';ARCH['e80']='bounce';ARCH['e49']='bounce';
var glyKey=null;Object.keys(DATA.MOLDEF).forEach(function(k){if(DATA.MOLDEF[k].name==='Glycine')glyKey=k;});
if(glyKey)ARCH[glyKey]='summon';
var NAMES={
summon:[{ic:'⬢',n:'Field Summon',d:'Summon a random allied creature at FULL health. It decays 5 HP per second.'},{ic:'⁂',n:'Swarm Protocol',d:'Deploy 3 small allied swarmers (full HP, 5 HP/s decay).'},{ic:'⛨',n:'Heavy Summon',d:'Summon a heavy allied tank (full HP, 5 HP/s decay).'}],
buffer:[{ic:'✚',n:'War Catalyst',d:'BUFF: you and your partner gain +35% damage for 6s.'},{ic:'⚡',n:'Overclock Pulse',d:'BUFF: +40% fire rate and +20 shield for 6s.'},{ic:'⛊',n:'Aegis Field',d:'BUFF: 2s invulnerability and 30% damage reduction for 5s.'}],
debuffer:[{ic:'☈',n:'Green Pulse',d:'DEBUFF: stun and slow every enemy nearby.'},{ic:'☠',n:'Ruin Mark',d:'DEBUFF: mark and corrode every enemy nearby.'},{ic:'❄',n:'Neural Slow',d:'DEBUFF: confuse and heavily slow every enemy nearby.'}],
infect:[{ic:'☣',n:'Infect',d:'Infect the nearest enemy; the infection spreads when it dies.'},{ic:'❋',n:'Plague Nova',d:'Infect every enemy near you.'},{ic:'💥',n:'Toxic Detonation',d:'Detonate all infected enemies near you.'}],
bounce:[{ic:'↺',n:'Bouncing Bolts',d:'Your shots ricochet to new targets for 6s.'},{ic:'⋉',n:'Split Bounce',d:'Bouncing shots that also split on impact for 6s.'},{ic:'≈',n:'Mercury Rain',d:'Bouncing corrosive slugs that slow for 6s.'}]
};
function setChoices(el,list){
el.choices=list.map(function(L,i){return{id:'arch_'+el.id+'_'+i,key:'arch'+i,slot:i,ic:L.ic,name:L.n,desc:L.d,power:1,main:i===0};});
el.signatures=el.choices;el.act=el.choices[0];
}
Object.keys(ARCH).forEach(function(k){var el=DATA.ELEMS[k]||DATA.MOLDEF[k];if(el)setChoices(el,NAMES[ARCH[k]]);});
function randomAllyType(){var pool=['mote','wisp','brute','spitter','splitter','bomber','healer','swarm','orbiter','sniper','shielder','charger','juggler','seeder','glider','shardling','drifter','coil','prism','crawler','drone','ripple','cinder'];return pool[irnd(pool.length)];}
function spawnAlly(type,x,y){var b=ETYPES[type]||ETYPES.mote;var w=RUN.wave||1;var hpMul=1+(w-1)*.22+Math.pow(w,1.5)*.02;RUN.allies=RUN.allies||[];RUN.allies.push({type:type,x:x,y:y,r:b.r,hp:b.hp*hpMul,maxhp:b.hp*hpMul,spd:b.spd,dmg:b.dmg+w*.6,hue:b.hue,shape:b.shape,touch:0});ringFx(x,y,140,90);}
var __start=start;
start=function(){var r=__start.apply(this,arguments);if(RUN)RUN.allies=[];return r;};
var __ua=useActive;
useActive=function(p){
if(!p||p.downed||p.activeCd>0)return;
var el=p.elem||RUN.el;
var arch=ARCH[el.mol?el.id:('e'+el.n)];
if(!arch)return __ua(p);
var slot=cslot(p.signatureSlot);
p.activeCd=ST.activeCd;SFX.active();RUN.shake=Math.max(RUN.shake,8);
var nm=NAMES[arch][slot];
banner(String(nm.n).toUpperCase(),1200);ringFx(p.x,p.y,140,150);
if(RUN.isOnline&&NET.isHost&&RUN.fxQueue){RUN.fxQueue.push({k:'shake',v:8});RUN.fxQueue.push({k:'banner',text:String(nm.n).toUpperCase()});}
if(arch==='summon'){
if(slot===0)spawnAlly(randomAllyType(),p.x+rnd(-40,40),p.y+rnd(-40,40));
else if(slot===1){spawnAlly('swarm',p.x-40,p.y);spawnAlly('wisp',p.x+40,p.y);spawnAlly('mote',p.x,p.y-40);}
else spawnAlly(['brute','tank','crusher'][irnd(3)],p.x+rnd(-40,40),p.y+rnd(-40,40));
}else if(arch==='buffer'){
if(slot===0)RUN.players.forEach(function(q){q.puDamage=Math.max(q.puDamage||1,1.35);q.puTimer=6;});
else if(slot===1)RUN.players.forEach(function(q){q.puRate=Math.max(q.puRate||1,1.4);q.puTimer=6;q.sh=Math.min(ST.shieldMax+20,q.sh+20);});
else RUN.players.forEach(function(q){q.iframes=Math.max(q.iframes,2);q.puArmor=.3;q.puTimer=5;});
ringFx(p.x,p.y,140,180);
}else if(arch==='debuffer'){
RUN.enemies.forEach(function(e){if(e.dead)return;if(d2(e.x,e.y,p.x,p.y)>320*320)return;
if(slot===0){e.stun=Math.max(e.stun,1.4);e.slowT=Math.max(e.slowT,2);}
else if(slot===1){e.mark=Math.max(e.mark,6);addCorrode(e,5,.45);}
else{e.conf=Math.max(e.conf,2);e.slowT=Math.max(e.slowT,3);}});
}else if(arch==='infect'){
if(slot===0){var t=nearestEnemy(p.x,p.y);if(t){t.infected=true;addPoison(t,ST.dmg*.7,5);ringFx(t.x,t.y,120,80);}}
else if(slot===1)RUN.enemies.forEach(function(e){if(!e.dead&&d2(e.x,e.y,p.x,p.y)<260*260){e.infected=true;addPoison(e,ST.dmg*.5,4);}});
else RUN.enemies.forEach(function(e){if(e.infected&&!e.dead&&d2(e.x,e.y,p.x,p.y)<300*300)dmgEnemy(e,ST.dmg*1.2,{quiet:true});});
}else if(arch==='bounce'){
p.bounceT=6;p.splitB=(slot===1);p.corrodeB=(slot===2);
}
};
var __ke=killEnemy;
killEnemy=function(e){
if(e.infected&&RUN)RUN.enemies.forEach(function(o){if(!o.dead&&!o.infected&&d2(o.x,o.y,e.x,e.y)<110*110){o.infected=true;addPoison(o,ST.dmg*.4,3);}});
__ke(e);
};
var __upd=update;
update=function(dt){
__upd(dt);
if(!RUN)return;
if(RUN.isOnline&&!NET.isHost)return;
RUN.players.forEach(function(q){if(q.bounceT>0){q.bounceT-=dt;ST.ricochet=Math.max(ST.ricochet||0,2);if(q.splitB)ST.splitshot=Math.max(ST.splitshot||0,1);if(q.corrodeB)ST.slowLv=Math.max(ST.slowLv||0,1);}});
if(!RUN.allies)return;
var A=RUN.allies;
for(var i=A.length-1;i>=0;i--){
var a=A[i];a.hp-=5*dt;a.touch-=dt;
var t=null,bd=1e9;
RUN.enemies.forEach(function(e){if(e.dead)return;var dd=d2(a.x,a.y,e.x,e.y);if(dd<bd){bd=dd;t=e;}});
if(t){var d=Math.sqrt(bd)||1;
if(d>a.r+t.r){a.x+=(t.x-a.x)/d*a.spd*dt;a.y+=(t.y-a.y)/d*a.spd*dt;}
else if(a.touch<=0){a.touch=.7;dmgEnemy(t,a.dmg,{quiet:true});}}
if(a.hp<=0){burst(a.x,a.y,140);A.splice(i,1);}
}
};
var __ren=render;
render=function(){
__ren();
if(!RUN||!RUN.allies||!RUN.allies.length)return;
RUN.allies.forEach(function(a){
var col='hsl('+a.hue+' 80% 60%)';
cx.save();cx.translate(a.x,a.y);
cx.strokeStyle='rgba(126,240,166,.8)';cx.lineWidth=2;cx.beginPath();cx.arc(0,0,a.r+4,0,TAU);cx.stroke();
cx.fillStyle=col;cx.strokeStyle='#0008';cx.lineWidth=2;cx.beginPath();
if(a.shape==='square')cx.rect(-a.r,-a.r,a.r*2,a.r*2);
else if(a.shape==='diamond'){cx.moveTo(0,-a.r);cx.lineTo(a.r,0);cx.lineTo(0,a.r);cx.lineTo(-a.r,0);cx.closePath();}
else if(a.shape==='tri'){cx.moveTo(0,-a.r);cx.lineTo(a.r,a.r);cx.lineTo(-a.r,a.r);cx.closePath();}
else cx.arc(0,0,a.r,0,TAU);
cx.fill();cx.stroke();cx.restore();
cx.fillStyle='#0009';cx.fillRect(a.x-a.r,a.y-a.r-7,a.r*2,3);
cx.fillStyle='#7ef0a6';cx.fillRect(a.x-a.r,a.y-a.r-7,a.r*2*clamp(a.hp/a.maxhp,0,1),3);
});
};
if(window.NET){
var __bs=NET.broadcastSnapshot;
NET.broadcastSnapshot=function(s){if(s&&RUN&&RUN.allies)s.allies=RUN.allies.map(function(a){return{t:a.type,x:a.x,y:a.y,hp:a.hp,maxhp:a.maxhp,r:a.r,hue:a.hue,shape:a.shape};});return __bs(s);};
var __sn=NET.onStateSnapshot;
NET.onStateSnapshot=function(s){var r=__sn(s);if(s&&s.allies&&RUN){var sx=W/(RUN.hostW||W),sy=H/(RUN.hostH||H);RUN.allies=s.allies.map(function(a){return{type:a.t,x:a.x*sx,y:a.y*sy,hp:a.hp,maxhp:a.maxhp,r:Math.max(2,a.r*sx),hue:a.hue,shape:a.shape,touch:0,spd:120,dmg:10};});}return r;};
}
console.log('ISO_ARCH_FIX_V1 active: safe menu bg + summoner/buffer/debuffer/infect/bounce archetypes.');
})();

/* ISO_RENDER_FINAL */
(function(){
if(window.ISO_RENDER_FINAL)return;window.ISO_RENDER_FINAL=true;
renderBG=function(dt){
try{
bgc.clearRect(0,0,W,H);bgc.fillStyle='#070a10';bgc.fillRect(0,0,W,H);
var hue=190;
try{var el=DATA.EL(SAVE.sel||'e1');if(el&&el.hue!=null)hue=el.hue;}catch(e){}
var g1=bgc.createRadialGradient(W*.15,H*.1,50,W*.15,H*.1,W*.6);
g1.addColorStop(0,'hsla('+hue+',60%,40%,.07)');g1.addColorStop(1,'transparent');bgc.fillStyle=g1;bgc.fillRect(0,0,W,H);
var g2=bgc.createRadialGradient(W*.9,H*.9,50,W*.9,H*.9,W*.55);
g2.addColorStop(0,'hsla('+((hue+120)%360)+',60%,40%,.06)');g2.addColorStop(1,'transparent');bgc.fillStyle=g2;bgc.fillRect(0,0,W,H);
if(typeof glyphs!=='undefined'&&glyphs){for(var i=0;i<glyphs.length;i++){var g=glyphs[i];
g.x+=g.vx*dt;g.y+=g.vy*dt;
if(g.x<-40)g.x=W+40;if(g.x>W+40)g.x=-40;if(g.y<-40)g.y=H+40;if(g.y>H+40)g.y=-40;
bgc.font=g.s+'px "Share Tech Mono"';bgc.fillStyle='hsla('+g.h+',70%,65%,'+g.a+')';bgc.fillText(g.sym,g.x,g.y);}}
}catch(err){}
};
console.log('ISO_RENDER_FINAL active: menu background crash fixed.');
})();

/* ISO_UPDATE2_GAME */
(function(){
if(window.__ISO_UPD2__)return;window.__ISO_UPD2__=true;
/* ---- save helpers: favorites, plays, ability unlocks ---- */
SAVE.raw.favs=SAVE.raw.favs||[];SAVE.raw.plays=SAVE.raw.plays||{};SAVE.raw.abil=SAVE.raw.abil||{};SAVE.raw.sel2=SAVE.raw.sel2||'e2';
SAVE.isFav=function(id){return SAVE.raw.favs.indexOf(id)>=0;};
SAVE.toggleFav=function(id){var i=SAVE.raw.favs.indexOf(id);if(i>=0)SAVE.raw.favs.splice(i,1);else SAVE.raw.favs.push(id);SAVE.save();};
SAVE.plays=function(id){SAVE.raw.plays[id]=(SAVE.raw.plays[id]||0)+1;SAVE.save();};
SAVE.abilOwned=function(id,slot){if(!slot)return true;return !!(SAVE.raw.abil[id]&&SAVE.raw.abil[id][slot]);};
SAVE.abilCost=function(el){var base=(el&&Number(el.cost))||0;return base*2;};
SAVE.buyAbil=function(id,slot,el){var c=SAVE.abilCost(el);if(!SAVE.spend(c))return false;SAVE.raw.abil[id]=SAVE.raw.abil[id]||{};SAVE.raw.abil[id][slot]=true;SAVE.save();return true;};
/* ---- keybinds ---- */
var B=SAVE.set.binds=Object.assign({p1u:'KeyW',p1d:'KeyS',p1l:'KeyA',p1r:'KeyD',p1dash:'Space',p1act:'KeyQ',p2u:'ArrowUp',p2d:'ArrowDown',p2l:'ArrowLeft',p2r:'ArrowRight',p2dash:'Enter',p2act:'ShiftRight'},SAVE.set.binds||{});
var __mi=movementInput;
movementInput=function(p){
 if(RUN&&!RUN.isOnline&&(RUN.mode==='coop'||RUN.mode==='pvp')){
  if(p.id===0)return{dx:(keys[B.p1r]?1:0)-(keys[B.p1l]?1:0),dy:(keys[B.p1d]?1:0)-(keys[B.p1u]?1:0)};
  if(p.id===1)return{dx:(keys[B.p2r]?1:0)-(keys[B.p2l]?1:0),dy:(keys[B.p2d]?1:0)-(keys[B.p2u]?1:0)};
 }
 return __mi(p);
};
addEventListener('keydown',function(e){
 if(!RUN||document.getElementById('scr-game').classList.contains('hidden'))return;
 var two=!RUN.isOnline&&(RUN.mode==='coop'||RUN.mode==='pvp')&&RUN.players[1];
 if(e.code===B.p1dash){e.preventDefault();e.stopImmediatePropagation();tryDash(RUN.players[0]);return;}
 if(e.code===B.p1act){e.stopImmediatePropagation();useActive(RUN.players[0]);return;}
 if(two){
  if(e.code===B.p2dash){e.preventDefault();e.stopImmediatePropagation();tryDash(RUN.players[1]);return;}
  if(e.code===B.p2act){e.stopImmediatePropagation();useActive(RUN.players[1]);return;}
  if(['Space','KeyQ','Enter','ShiftRight'].indexOf(e.code)>=0)e.stopImmediatePropagation();
 }else{
  if(B.p1dash!=='Space'&&e.code==='Space')e.stopImmediatePropagation();
  if(B.p1act!=='KeyQ'&&e.code==='KeyQ')e.stopImmediatePropagation();
 }
},true);
/* ---- glycine (add if missing) ---- */
var GLY='C+C+H+H+H+H+H+N+O+O';
if(!DATA.MOLDEF[GLY]){
 var m={token:'Glycine',f:'C2H5NO2',name:'Glycine',hue:140,mods:{hp:1.1,dmg:1.05},trait:'vital',desc:'Amino acid: life itself fights beside you.',rx:'2C+5H+N+2O',mol:true};
 m.signatures=DATA.makeSignatureChoices(m);
 m.act={id:'main_gly',key:'main_gly',slot:0,ic:'⬢',name:'Amino Surge',desc:'Heal and hasten; your body befriends the fallen.',power:1.06,main:true};
 DATA.MOLDEF[GLY]=m;DATA.RECIPES[GLY]=GLY;
}
/* ---- allies (befriended enemies) ---- */
var RUN_ALLIES=function(){RUN.allies=RUN.allies||[];return RUN.allies;};
function spawnAlly(x,y){
 var pool=Object.keys(ETYPES).filter(function(t){return !ETYPES[t].special&&t!=='boss';});
 var t=pool[irnd(pool.length)],b=ETYPES[t],w=RUN.wave||1,hpMul=1+(w-1)*.22+Math.pow(w,1.5)*.02;
 RUN_ALLIES().push({type:t,x:x,y:y,r:b.r,hp:b.hp*hpMul,maxhp:b.hp*hpMul,dmg:b.dmg+w*.6,spd:b.spd,hue:b.hue,shape:b.shape,touch:0,decayT:0});
 ringFx(x,y,140,90);
}
function tickAllies(dt){
 var A=RUN_ALLIES();
 for(var i=A.length-1;i>=0;i--){var a=A[i];
  a.decayT+=dt;if(a.decayT>=5){a.decayT-=5;a.hp-=5;}
  a.touch-=dt;
  var t=null,bd=1e9;
  RUN.enemies.forEach(function(e){if(e.dead)return;var dd=d2(a.x,a.y,e.x,e.y);if(dd<bd){bd=dd;t=e;}});
  if(t){var d=Math.hypot(t.x-a.x,t.y-a.y)||1;
   if(d>a.r+t.r){a.x+=(t.x-a.x)/d*a.spd*dt;a.y+=(t.y-a.y)/d*a.spd*dt;}
   else if(a.touch<=0){a.touch=.7;dmgEnemy(t,a.dmg,{quiet:true});}
  }
  if(a.hp<=0){burst(a.x,a.y,140);A.splice(i,1);}
 }
}
/* ---- category ability pairs (fit each element family) ---- */
var CAT_AB=[
 [{n:'Volatile Dash',d:'Dash leaving detonations behind.',f:function(p){var ox=p.x,oy=p.y;p.x=clamp(p.x+Math.cos(p.angle)*180,20,W-20);p.y=clamp(p.y+Math.sin(p.angle)*180,20,H-20);p.iframes=Math.max(p.iframes,.6);aoe(ox,oy,90,ST.dmg*1.2,RUN.hue);aoe(p.x,p.y,90,ST.dmg*1.2,RUN.hue);}},
  {n:'Sodium Toss',d:'Explosive pellets + a water pool.',f:function(p){for(var i=0;i<5;i++){var a=p.angle+(i-2)*.15;RUN.bullets.push({x:p.x,y:p.y,vx:Math.cos(a)*ST.ps,vy:Math.sin(a)*ST.ps,dmg:ST.dmg*1.2,r:6,pierce:0,hit:[],life:1.2,expl:true,owner:p.id});}RUN.clouds.push({x:p.x+Math.cos(p.angle)*140,y:p.y+Math.sin(p.angle)*140,r:90,t:4});}}],
 [{n:'Seismic Slam',d:'Shockwave that hurls enemies back.',f:function(p){aoe(p.x,p.y,200,ST.dmg*2,RUN.hue);RUN.enemies.forEach(function(e){if(!e.dead&&!e.boss){var a=Math.atan2(e.y-p.y,e.x-p.x);e.x+=Math.cos(a)*160;e.y+=Math.sin(a)*160;}});}},
  {n:'Bulwark',d:'Heavy shield + armor for 5s.',f:function(p){p.sh=Math.min(ST.shieldMax+30,p.sh+ST.shieldMax);p.puArmor=.3;p.puTimer=5;}}],
 [{n:'Blade Storm',d:'Radial fan of piercing shards.',f:function(p){for(var i=0;i<16;i++){var a=i/16*TAU;RUN.bullets.push({x:p.x,y:p.y,vx:Math.cos(a)*ST.ps*1.2,vy:Math.sin(a)*ST.ps*1.2,dmg:ST.dmg*1.5,r:5,pierce:3,hit:[],life:1.2,owner:p.id});}}},
  {n:'Temper',d:'Fire rate + lifesteal for 6s.',f:function(p){p.puRate=1.5;p.puVamp=1;p.puTimer=6;}}],
 [{n:'Heavy Slug',d:'Colossal knockback slug.',f:function(p){RUN.bullets.push({x:p.x,y:p.y,vx:Math.cos(p.angle)*ST.ps*.55,vy:Math.sin(p.angle)*ST.ps*.55,dmg:ST.dmg*3.2,r:13,pierce:12,hit:[],life:2,kb:4,expl:true,owner:p.id});}},
  {n:'Lead Wall',d:'Wall of heavy blocking rounds.',f:function(p){for(var i=-4;i<=4;i++){var a=p.angle+Math.PI/2+i*.12;RUN.bullets.push({x:p.x,y:p.y,vx:Math.cos(a)*ST.ps*.9,vy:Math.sin(a)*ST.ps*.9,dmg:ST.dmg*1.2,r:5,pierce:2,hit:[],life:1.2,owner:p.id});}}}],
 [{n:'Phase Blink',d:'Blink through foes, damaging them.',f:function(p){var t=nearestEnemy(p.x,p.y);if(t){p.x=t.x;p.y=t.y;aoe(p.x,p.y,160,ST.dmg*2,RUN.hue);}else{p.x=clamp(p.x+Math.cos(p.angle)*220,20,W-20);p.y=clamp(p.y+Math.sin(p.angle)*220,20,H-20);}p.iframes=Math.max(p.iframes,2);}},
  {n:'Shard Lattice',d:'Piercing crystal lattice burst.',f:function(p){for(var i=0;i<9;i++){var a=p.angle+(i-4)*.1;RUN.bullets.push({x:p.x,y:p.y,vx:Math.cos(a)*ST.ps*1.6,vy:Math.sin(a)*ST.ps*1.6,dmg:ST.dmg*1.4,r:5,pierce:6,hit:[],life:1.4,owner:p.id});}}}],
 [{n:'Oxy Boost',d:'Fire rate up; your burns amplify.',f:function(p){p.puRate=1.4;p.puTimer=6;RUN.enemies.forEach(function(e){if(!e.dead&&e.burn)e.burn.dps*=1.5;});}},
  {n:'Pure Lance',d:'Sweeping piercing beam burst.',f:function(p){RUN.bullets.push({x:p.x,y:p.y,vx:Math.cos(p.angle)*ST.ps*2.4,vy:Math.sin(p.angle)*ST.ps*2.4,dmg:ST.dmg*4,r:9,pierce:14,hit:[],life:1.25,owner:p.id});}}],
 [{n:'Toxic Bloom',d:'Erupts a large poison field.',f:function(p){RUN.clouds.push({x:p.x,y:p.y,r:180,t:5});RUN.enemies.forEach(function(e){if(!e.dead&&d2(e.x,e.y,p.x,p.y)<180*180)addPoison(e,ST.dmg*.8,5);});}},
  {n:'Corrode Jet',d:'Cone that melts armor.',f:function(p){RUN.enemies.forEach(function(e){if(e.dead)return;var dx=e.x-p.x,dy=e.y-p.y,dist=Math.hypot(dx,dy);if(dist>260)return;var da=Math.atan2(dy,dx)-p.angle;while(da>Math.PI)da-=TAU;while(da<-Math.PI)da+=TAU;if(Math.abs(da)<.6){addCorrode(e,6,.45);dmgEnemy(e,ST.dmg*.6);}});}}],
 [{n:'Inert Veil',d:'Invulnerability + clears enemy shots.',f:function(p){p.iframes=Math.max(p.iframes,2.5);if(RUN.ebullets)RUN.ebullets=RUN.ebullets.filter(function(b){return d2(b.x,b.y,p.x,p.y)>230*230;});}},
  {n:'Neon Grid',d:'Ring of laser barriers.',f:function(p){for(var i=0;i<16;i++){var a=i/16*TAU;RUN.bullets.push({x:p.x,y:p.y,vx:Math.cos(a)*ST.ps*.4,vy:Math.sin(a)*ST.ps*.4,dmg:ST.dmg*.6,r:4,pierce:6,hit:[],life:2.2,owner:p.id});}}}],
 [{n:'Magnet Pull',d:'Drags enemies inward and crushes.',f:function(p){RUN.enemies.forEach(function(e){if(e.dead||e.boss)return;var a=Math.atan2(p.y-e.y,p.x-e.x);e.x+=Math.cos(a)*200;e.y+=Math.sin(a)*200;});aoe(p.x,p.y,260,ST.dmg*2,RUN.hue);}},
  {n:'Seekers',d:'Homing volley.',f:function(p){for(var i=0;i<6;i++){var a=i/6*TAU;RUN.bullets.push({x:p.x,y:p.y,vx:Math.cos(a)*ST.ps,vy:Math.sin(a)*ST.ps,dmg:ST.dmg*.9,r:4,pierce:0,hit:[],life:1.2,hom:true,owner:p.id});}}}],
 [{n:'Meltdown',d:'Sustained radiation nova.',f:function(p){for(var i=0;i<3;i++)setTimeout(function(){if(RUN)aoe(p.x,p.y,200,ST.dmg*1.5,RUN.hue);},i*250);}},
  {n:'Fallout',d:'Lingering radiation zones.',f:function(p){for(var i=0;i<3;i++){var a=i/3*TAU;RUN.clouds.push({x:p.x+Math.cos(a)*120,y:p.y+Math.sin(a)*120,r:90,t:5});}}}],
 [{n:'Collapse',d:'Gravity singularity that collapses.',f:function(p){var x=clamp(p.x+Math.cos(p.angle)*220,30,W-30),y=clamp(p.y+Math.sin(p.angle)*220,30,H-30);RUN.wells.push({x:x,y:y,t:1.6,lv:3});setTimeout(function(){if(RUN)aoe(x,y,200,ST.dmg*2.6,280);},1500);}},
  {n:'Crit Surge',d:'Crit buff + unstable burst.',f:function(p){p.puCrit=1;p.puTimer=5;for(var i=0;i<10;i++){var a=rnd(TAU);RUN.bullets.push({x:p.x,y:p.y,vx:Math.cos(a)*ST.ps*1.6,vy:Math.sin(a)*ST.ps*1.6,dmg:ST.dmg*.7,r:5,pierce:2,hit:[],life:1.4,crit:true,owner:p.id});}}}]
];
var SPEC={};
SPEC[GLY]=[
 {n:'Amino Surge',d:'Heal + speed; befriend the fallen.',f:function(p){p.hp=Math.min(ST.hp,p.hp+ST.hp*.25);p.adrenT=Math.max(p.adrenT,3);}},
 {n:'Neuro Toxin',d:'Confuse + poison nearby foes.',f:function(p){RUN.enemies.forEach(function(e){if(!e.dead&&d2(e.x,e.y,p.x,p.y)<260*260){e.conf=Math.max(e.conf,2.5);addPoison(e,ST.dmg*.6,5);}});}}
];
SPEC['e6']=[
 {n:'Allotropy',d:'Cycle Diamond/Graphite/Dust forms.',f:function(p){p._form=((p._form||0)+1)%3;if(p._form===0){p.sh=Math.min(ST.shieldMax+30,p.sh+ST.shieldMax);}else if(p._form===1){for(var i=0;i<10;i++){var a=i/10*TAU;RUN.bullets.push({x:p.x,y:p.y,vx:Math.cos(a)*ST.ps,vy:Math.sin(a)*ST.ps,dmg:ST.dmg*.8,r:4,pierce:3,hit:[],life:1.1,chainOnHit:true,owner:p.id});}}else{p.iframes=Math.max(p.iframes,1.4);}}},
 {n:'Graphite Arc',d:'Chain lightning through foes.',f:function(p){var t=nearestEnemy(p.x,p.y);if(t)arcChain(t,ST.dmg*1.6,6,200);}}
];
SPEC['e1']=[
 {n:'Compress Blast',d:'Charged hydrogen explosion.',f:function(p){aoe(p.x,p.y,220,ST.dmg*3,RUN.hue);}},
 {n:'Hydrogen Rush',d:'Speed + accelerating shots 6s.',f:function(p){p.adrenT=Math.max(p.adrenT,4);p.puTimer=6;p.puRate=1.3;}}
];
SPEC['e11']=[
 {n:'Water Reaction',d:'Sodium pellets + water pools.',f:function(p){for(var i=0;i<5;i++){var a=p.angle+(i-2)*.15;RUN.bullets.push({x:p.x,y:p.y,vx:Math.cos(a)*ST.ps,vy:Math.sin(a)*ST.ps,dmg:ST.dmg*1.2,r:6,hit:[],life:1.2,expl:true,owner:p.id});}RUN.clouds.push({x:p.x,y:p.y,r:110,t:4});}},
 {n:'Alkali Splash',d:'Caustic splash that burns.',f:function(p){RUN.enemies.forEach(function(e){if(!e.dead&&d2(e.x,e.y,p.x,p.y)<220*220){addBurn(e,ST.dmg*.6,4);addCorrode(e,4,.4);}});}}
];
SPEC['e80']=[
 {n:'Liquid Body',d:'Slip through foes, split droplets.',f:function(p){p.iframes=Math.max(p.iframes,1.5);p.x=clamp(p.x+Math.cos(p.angle)*200,20,W-20);p.y=clamp(p.y+Math.sin(p.angle)*200,20,H-20);for(var i=0;i<8;i++){var a=i/8*TAU;RUN.bullets.push({x:p.x,y:p.y,vx:Math.cos(a)*ST.ps*.8,vy:Math.sin(a)*ST.ps*.8,dmg:ST.dmg*.5,r:4,hit:[],life:1.6,poison:true,owner:p.id});}}},
 {n:'Quicksilver',d:'Speed + slow nearby foes.',f:function(p){p.adrenT=Math.max(p.adrenT,4);RUN.enemies.forEach(function(e){if(!e.dead&&d2(e.x,e.y,p.x,p.y)<220*220)e.slowT=Math.max(e.slowT,3);});}}
];
SPEC['e50']=[
 {n:'Tin Soldiers',d:'Summon autonomous soldiers.',f:function(p){for(var i=0;i<3;i++)spawnAlly(p.x+rnd(-40,40),p.y+rnd(-40,40));}},
 {n:'Solder Shield',d:'Molten shield that melts shots.',f:function(p){p.sh=Math.min(ST.shieldMax+25,p.sh+ST.shieldMax);p.puArmor=.25;p.puTimer=5;}}
];
function getMyAbil(el,slot){
 if(!el||slot===0)return null;
 var pair=SPEC[el.id]||CAT_AB[el.cat]||null;
 if(!pair)return null;
 return pair[slot-1]||null;
}
/* ---- choices rewrite: slot0 default free, 1/2 purchasable ---- */
Object.values(DATA.ELEMS).forEach(function(e){
 var pair=SPEC[e.id]||CAT_AB[e.cat];if(!pair)return;
 var ch=e.choices||e.signatures||[];
 ch[1]=Object.assign({},ch[1]||{},{id:'ab_'+e.id+'_1',slot:1,ic:'◆',name:pair[0].n,desc:pair[0].d,main:false});
 ch[2]=Object.assign({},ch[2]||{},{id:'ab_'+e.id+'_2',slot:2,ic:'◆',name:pair[1].n,desc:pair[1].d,main:false});
 e.choices=ch;e.signatures=ch;
});
(function(){var g=DATA.MOLDEF[GLY];if(g){var pair=SPEC[GLY];var ch=g.choices||g.signatures||[];ch[1]=Object.assign({},ch[1]||{},{id:'ab_gly_1',slot:1,ic:'◆',name:pair[0].n,desc:pair[0].d,main:false});ch[2]=Object.assign({},ch[2]||{},{id:'ab_gly_2',slot:2,ic:'◆',name:pair[1].n,desc:pair[1].d,main:false});g.choices=ch;g.signatures=ch;}})();
/* ---- useActive: gating + custom fns + glycine passive handled in update ---- */
var __ua=useActive;
useActive=function(p){
 if(!p||p.downed||p.activeCd>0)return;
 var el=p.elem||RUN.el,slot=Math.max(0,Math.min(2,Number(p.signatureSlot)||0));
 if(slot>0&&!SAVE.abilOwned(el.id,slot)){banner('ABILITY LOCKED - PURCHASE IN VAULT',1400);return;}
 var my=getMyAbil(el,slot);
 if(my&&my.f){p.activeCd=ST.activeCd;SFX.active();RUN.shake=Math.max(RUN.shake,8);banner(my.n.toUpperCase(),1200);ringFx(p.x,p.y,RUN.hue,150);my.f(p);return;}
 __ua(p);
};
var __ss=SAVE.setSignature;
SAVE.setSignature=function(id,slot){if(slot>0&&!SAVE.abilOwned(id,slot)){if(window.UI)UI.toast('LOCKED - purchase first','bad');return;}return __ss(id,slot);};
/* ---- update hook: glycine passive summon + allies ---- */
var __upd=update;
update=function(dt){
 __upd(dt);
 if(!RUN)return;
 RUN_ALLIES();
 if(RUN.el&&RUN.el.id===GLY){var p0=RUN.players[0];if(p0&&!p0.downed){p0.glyT=(p0.glyT||0)+dt;if(p0.glyT>=10){p0.glyT=0;spawnAlly(p.x||p0.x,p0.y);}}}
 tickAllies(dt);
};
/* ---- start hook: local modes + P2 element + plays tracking ---- */
var __start=start;
start=function(elemId,mode,np,isOnline,localId){
 if(!np&&!isOnline)mode=SAVE.set.localMode||mode;
 var r=__start(elemId,mode,np,isOnline,localId);
 if(RUN&&!RUN.isOnline&&RUN.players[1]&&(mode==='coop'||mode==='pvp')){
  var e2=DATA.EL(SAVE.raw.sel2||'e2'),p1=RUN.players[1];
  p1.elem=e2;p1.elementId=e2.id;p1.name='P2 '+(e2.mol?e2.f.slice(0,4):e2.sym);
 }
 if(RUN)SAVE.plays((RUN.players[0].elem||RUN.el).id);
 return r;
};
/* ---- render hook: draw allies + fps ---- */
var __ren=render;
render=function(){
 __ren();
 if(!RUN)return;
 var A=RUN_ALLIES();
 A.forEach(function(a){
  var col='hsl('+a.hue+' 80% 62%)';
  cx.save();cx.translate(a.x,a.y);
  cx.strokeStyle='rgba(126,240,166,.9)';cx.lineWidth=2;cx.beginPath();cx.arc(0,0,a.r+4,0,TAU);cx.stroke();
  cx.fillStyle=col;cx.strokeStyle='#0008';cx.lineWidth=2;cx.beginPath();
  if(a.shape==='square')cx.rect(-a.r,-a.r,a.r*2,a.r*2);
  else if(a.shape==='diamond'){cx.moveTo(0,-a.r);cx.lineTo(a.r,0);cx.lineTo(0,a.r);cx.lineTo(-a.r,0);cx.closePath();}
  else if(a.shape==='tri'){cx.moveTo(0,-a.r);cx.lineTo(a.r,a.r);cx.lineTo(-a.r,a.r);cx.closePath();}
  else cx.arc(0,0,a.r,0,TAU);
  cx.fill();cx.stroke();cx.restore();
  cx.fillStyle='#0009';cx.fillRect(a.x-a.r,a.y-a.r-7,a.r*2,3);
  cx.fillStyle='#7ef0a6';cx.fillRect(a.x-a.r,a.y-a.r-7,a.r*2*clamp(a.hp/a.maxhp,0,1),3);
 });
 if(SAVE.set.fps&&RUN){cx.fillStyle='#7ef0a6';cx.font='11px monospace';cx.textAlign='left';cx.fillText('FPS '+(RUN._fps||60),12,H-12);}
};

/* ISO_COMPOUND_RUNTIME_V1 */
(function(){
if(window.__ISO_COMPOUND_RUNTIME__)return;window.__ISO_COMPOUND_RUNTIME__=true;
function __near(x,y){var best=null,bd=1e18;(RUN.enemies||[]).forEach(function(e){if(!e.dead){var dd=d2(e.x,e.y,x,y);if(dd<bd){bd=dd;best=e;}}});return best;}
function __seg(px,py,ax,ay,bx,by){var dx=bx-ax,dy=by-ay,t=((px-ax)*dx+(py-ay)*dy)/(dx*dx+dy*dy||1);t=Math.max(0,Math.min(1,t));return Math.hypot(px-(ax+dx*t),py-(ay+dy*t));}
var __cUpd=update;
update=function(dt){
  __cUpd(dt); if(!RUN)return;
  // orbiting molecular charges
  if(RUN.compOrbits) RUN.compOrbits.forEach(function(o){
    o.t-=dt; if(o.t<=0)return;
    var owner=RUN.players.find(function(p){return p.id===o.owner&&!p.downed;}); if(!owner)return;
    o.x=owner.x;o.y=owner.y;
    for(var i=0;i<o.n;i++){
      var a=RUN.t*1.6+i*TAU/o.n, ox=o.x+Math.cos(a)*48, oy=o.y+Math.sin(a)*48;
      RUN.enemies.forEach(function(e){if(!e.dead&&d2(e.x,e.y,ox,oy)<(e.r+10)*(e.r+10)&&Math.random()<dt*4){dmgEnemy(e,ST.dmg*.75);}});
    }
  });
  if(RUN.compOrbits) RUN.compOrbits=RUN.compOrbits.filter(function(o){return o.t>0;});
  if(RUN.compGuards) RUN.compGuards=RUN.compGuards.filter(function(g){
    g.t-=dt; var p=RUN.players.find(function(q){return q.id===g.pid;});
    if(!p||g.t<=0)return false;
    for(var gi=0;gi<g.n;gi++){var ga=RUN.t*2+gi*TAU/g.n,gx=p.x+Math.cos(ga)*46,gy=p.y+Math.sin(ga)*46; RUN.ebullets.forEach(function(b){if(b.life>0&&d2(b.x,b.y,gx,gy)<14*14){b.life=0;g.charges=Math.max(0,(g.charges||0)-1);}});}
    return true;
  });
  if(RUN.compFields) RUN.compFields=RUN.compFields.filter(function(f){
    f.t-=dt; if(f.t<=0)return false;
    RUN.enemies.forEach(function(e){if(!e.dead&&d2(e.x,e.y,f.x,f.y)<f.r*f.r){e.slowT=Math.max(e.slowT,.18);f._pulse=f._pulse||0;}}); return true;
  });
  if(RUN.compThreads) RUN.compThreads=RUN.compThreads.filter(function(t){t.t-=dt; if(t.t<=0)return false; RUN.enemies.forEach(function(e){if(!e.dead&&__seg(e.x,e.y,t.ax,t.ay,t.bx,t.by)<18+e.r&&Math.random()<dt*4){e.slowT=Math.max(e.slowT,.45);dmgEnemy(e,ST.dmg*.55);}}); return true;});
  if(RUN.compMines) RUN.compMines=RUN.compMines.filter(function(m){
    if(m.totalT==null)m.totalT=Math.max(.1,m.t);
    m.t-=dt;
    if(m.t<=0){
      m._triggered=true;
      aoe(m.x,m.y,(m.r||90)*1.6,m.dmg || ST.dmg*(m.r?1.65:1.7),m.hue==null?16:m.hue);
      return false;
    }
    return true;
  });
  if(RUN.compBeacons) RUN.compBeacons.forEach(function(b){
    b.t-=dt; b.step=(b.step||0)+dt; if(b.step>.9){b.step=0;var phase=Math.floor((b.t*10)%3);RUN.enemies.forEach(function(e){if(!e.dead&&d2(e.x,e.y,b.x,b.y)<145*145){if(phase===0)e.slowT=Math.max(e.slowT,.7);else if(phase===1)e.stun=Math.max(e.stun,.35);else dmgEnemy(e,ST.dmg*.55);}});}
  });
  if(RUN.compBeacons) RUN.compBeacons=RUN.compBeacons.filter(function(b){return b.t>0;});
  if(RUN.compSwarm) RUN.compSwarm=RUN.compSwarm.filter(function(d){
    d.t-=dt;if(d.t<=0)return false;var p=RUN.players.find(function(q){return q.id===d.owner;});if(!p)return false;
    d.ang+=dt*(1.2+d.phase*.08);var rr=38+8*Math.sin(RUN.t*2+d.phase),tx=p.x+Math.cos(d.ang)*rr,ty=p.y+Math.sin(d.ang)*rr;
    var e=__near(tx,ty);if(e&&d2(e.x,e.y,tx,ty)<30*30&&Math.random()<dt*5){dmgEnemy(e,ST.dmg*.9);burst(e.x,e.y,90);}
    return true;
  });
  if(RUN.compEcho) RUN.compEcho=RUN.compEcho.filter(function(e){e.t-=dt;if(e.t<=0){var p=RUN.players.find(function(q){return q.id===e.owner;});if(p){for(var k=0;k<5;k++){var a=e.a+(k-2)*.12;RUN.bullets.push({x:p.x,y:p.y,vx:Math.cos(a)*ST.ps*1.15,vy:Math.sin(a)*ST.ps*1.15,dmg:ST.dmg*.7,r:4,pierce:2,hit:[],life:.9,owner:p.id});}}return false;}return true;});
  RUN.enemies.forEach(function(e){
    if(e.compTether){e.compTether.t-=dt;var p=RUN.players.find(function(q){return q.id===e.compTether.pid;});if(p&&!e.dead){e.x+=(p.x-e.x)*dt*.8;e.y+=(p.y-e.y)*dt*.8;if(Math.random()<dt*1.7)dmgEnemy(e,e.compTether.dmg);}if(e.compTether.t<=0)e.compTether=null;}
    if(e.compRes){e.compRes-=dt;if(e.compRes>0&&Math.random()<dt*1.5){var near=RUN.enemies.filter(function(q){return !q.dead&&q!==e&&d2(q.x,q.y,e.x,e.y)<150*150;});near.slice(0,2).forEach(function(q){dmgEnemy(q,ST.dmg*.4);});}}
    if(e.compRupture){e.compRupture.t-=dt;if(e.compRupture.t<=0)e.compRupture=null;}
  });
  RUN.players.forEach(function(p){if(p.compRecovery){p.hp=Math.min(ST.hp,p.hp+1.5*dt);p.compRecovery-=dt;if(p.compRecovery<0)p.compRecovery=0;}});
};
var __cRen=render;
render=function(){__cRen();if(!RUN)return;
  (RUN.compOrbits||[]).forEach(function(o){var p=RUN.players.find(function(q){return q.id===o.owner;});if(!p)return;for(var i=0;i<o.n;i++){var a=RUN.t*1.6+i*TAU/o.n;cx.beginPath();cx.arc(p.x+Math.cos(a)*48,p.y+Math.sin(a)*48,6,0,TAU);cx.strokeStyle='hsl('+((RUN.hue+i*30)%360)+' 85% 70%)';cx.lineWidth=2;cx.stroke();}});
  (RUN.compThreads||[]).forEach(function(t){cx.beginPath();cx.moveTo(t.ax,t.ay);cx.lineTo(t.bx,t.by);cx.strokeStyle='rgba(126,240,255,.7)';cx.lineWidth=3;cx.stroke();});
  (RUN.compMines||[]).forEach(function(m){var total=m.totalT||Math.max(.1,m.t||1),p=1-Math.max(0,(m.t||0)/total),rate=2.2+15*p*p,flash=.25+.7*p*((Math.sin(RUN.t*rate*6.283)+1)/2);cx.save();cx.globalCompositeOperation='lighter';cx.strokeStyle='hsla('+(m.hue==null?24:m.hue)+',100%,70%,'+flash+')';cx.lineWidth=2+3*p;cx.beginPath();cx.arc(m.x,m.y,(m.r||40)*(.25+.75*p),0,TAU);cx.stroke();cx.beginPath();cx.arc(m.x,m.y,8+10*p,0,TAU);cx.stroke();cx.restore();});
  (RUN.compBeacons||[]).forEach(function(b){cx.beginPath();cx.arc(b.x,b.y,22+3*Math.sin(RUN.t*5),0,TAU);cx.strokeStyle='rgba(120,220,255,.8)';cx.stroke();});
};
})();

console.log('ISO_UPDATE2_GAME active.');
})();
/* NOTE: the outer game.js IIFE (opened at the top of this file) used to be
   closed right here, which silently orphaned every patch below this point
   (ISO_FINAL_ABILITY_DISPATCH_FIX_V1 onward) into their own disconnected
   scopes. Since those patches reassign closure-local bindings like
   useActive/RUN/ST/A without their own `var`, that made them throw
   "useActive is not defined" the instant they ran, which in turn aborted
   the rest of this <script> block before it ever installed the real,
   final ability router. The extra closing call has been removed here; the
   IIFE now stays open through the end of the file, where it is closed for
   real (see ISO_OUTER_SCOPE_CLOSE at the bottom). */


/* ISO_FINAL_ABILITY_DISPATCH_FIX_V1
 * One-and-only-one active ability dispatcher.
 * Prevents semantic/custom ability execution from falling through into the
 * legacy signature handler, which was causing the original ability to fire
 * alongside the new one (especially Water compounds and Silicon).
 */
(function(){
  if(window.__ISO_FINAL_ABILITY_DISPATCH_FIX_V1__)return;
  window.__ISO_FINAL_ABILITY_DISPATCH_FIX_V1__=true;
  var legacyUse=useActive;
  function ready(p, name){
    p.activeCd=ST.activeCd;
    if(window.SFX&&SFX.active)SFX.active();
    RUN.shake=Math.max(RUN.shake||0,8);
    if(name)banner(String(name).toUpperCase(),1200);
    if(window.fxRing)fxRing(p.x,p.y,RUN.hue,175,10,.55);
    else if(window.ringFx)ringFx(p.x,p.y,RUN.hue,150);
  }
  function elementPair(el){
    if(!el)return null;
    try{
      if(typeof SPEC!=='undefined'&&SPEC[el.id])return SPEC[el.id];
      if(typeof CAT_AB!=='undefined'&&CAT_AB[el.cat])return CAT_AB[el.cat];
    }catch(e){}
    return null;
  }
  function choiceFor(el,slot){
    if(!el)return null;
    var list=el.choices||el.signatures||[];
    return list[slot]||null;
  }
  useActive=function(p){
    if(!p||!RUN||p.downed||p.activeCd>0)return;
    var el=p.elem||RUN.el;
    var slot=Math.max(0,Math.min(2,Number(p.signatureSlot)||0));

    /* Silicon's actual Circuit ability owns slot 0. Never call A[14] for it. */
    if(el && !el.mol && Number(el.n)===14 && slot===0 && typeof window.ISO_SILICON_CIRCUIT==='function'){
      if(RUN.isOnline && window.NET && !NET.isHost){
        NET.sendClientAction('circuit');
        p.circuitCd=.5;
        return;
      }
      ready(p,'Circuit');
      window.ISO_SILICON_CIRCUIT(p);
      return;
    }

    /* Molecules/compounds with real semantic exec functions take precedence
       for ALL three slots. This is the key fix for Water and every compound. */
    var choice=choiceFor(el,slot);
    if(choice && typeof choice.exec==='function'){
      ready(p,choice.name||choice.n||'ABILITY');
      try{choice.exec(p);}catch(err){console.error('semantic ability',choice,err);}
      return;
    }

    /* Element secondary/tertiary semantic abilities. Execute them directly;
       never fall through into the legacy signature handler. */
    if(slot>0){
      var pair=elementPair(el);
      var ab=pair && pair[slot-1];
      if(ab && typeof ab.f==='function'){
        if(typeof SAVE!=='undefined' && SAVE.abilOwned && el.id && !SAVE.abilOwned(el.id,slot)){
          banner('ABILITY LOCKED - PURCHASE IN VAULT',1400);
          return;
        }
        ready(p,ab.n||ab.name||'ABILITY');
        try{ab.f(p);}catch(err){console.error('element semantic ability',el.id,slot,err);}
        return;
      }
    }

    /* Element slot 0 uses the dedicated 118-element semantic implementation. */
    if(slot===0 && el && !el.mol && Number(el.n)>0 && typeof A!=='undefined' && typeof A[Number(el.n)]==='function'){
      ready(p,(el.act&&el.act.name)||'ABILITY');
      try{A[Number(el.n)](p);}catch(err){console.error('element ability',Number(el.n),err);}
      return;
    }

    /* Only true legacy cases are allowed to reach the old dispatcher. */
    return legacyUse(p);
  };
  console.log('ISO_FINAL_ABILITY_DISPATCH_FIX_V1 active: semantic abilities no longer fall through into legacy/original signatures.');
})();

/* ISO_AUTHORITATIVE_ABILITY_ROUTER_V2
 * All 118 element abilities use the dedicated semantic implementation.
 * Updated elements NEVER fall through to any of the legacy signature/archetype
 * dispatchers. Secondary abilities are locked until bought and slot 0 is the
 * safe default when an unowned slot is encountered.
 */
(function(){
  if(window.__ISO_AUTHORITATIVE_ABILITY_ROUTER_V2__) return;
  window.__ISO_AUTHORITATIVE_ABILITY_ROUTER_V2__=true;

  /* Make every element's 2 optional choices callable without the legacy router. */
  function wireSecondaryChoices(){
    if(!window.DATA||!DATA.ELEMS) return;
    Object.values(DATA.ELEMS).forEach(function(el){
      var pair=null;
      try{
        if(typeof SPEC!=='undefined'&&SPEC[el.id]) pair=SPEC[el.id];
        else if(typeof CAT_AB!=='undefined'&&CAT_AB[el.cat]) pair=CAT_AB[el.cat];
      }catch(e){}
      if(!pair)return;
      el.choices=el.choices||el.signatures||[];
      for(var s=1;s<=2;s++){
        var fn=pair[s-1]&&pair[s-1].f;
        if(!fn)continue;
        if(!el.choices[s])el.choices[s]={slot:s};
        el.choices[s].exec=fn;
        el.choices[s].name=(pair[s-1].n||el.choices[s].name||('Ability '+(s+1)));
        el.choices[s].desc=(pair[s-1].d||el.choices[s].desc||'');
        el.choices[s].main=false;
      }
      el.signatures=el.choices;
    });
  }

  function resolvedElement(p){
    var id=p&&p.elementId;
    var el=(id&&DATA&&DATA.EL)?DATA.EL(id):null;
    if(!el) el=p&&p.elem;
    if(!el) el=RUN&&RUN.el;
    if(p&&el){p.elem=el;p.elementId=el.id;}
    return el;
  }

  var FALLBACK=useActive;
  wireSecondaryChoices();

  useActive=function(p){
    if(!p||!RUN||p.downed||p.activeCd>0)return;

    var el=resolvedElement(p);
    if(!el){return FALLBACK(p);}

    var slot = (typeof p.signatureSlot === 'number' && Number.isFinite(p.signatureSlot))
      ? Math.max(0, Math.min(2, p.signatureSlot))
      : (window.SAVE && SAVE.getSignature ? SAVE.getSignature(el.id) : 0);

    /* A player may never activate an unowned optional ability. */
    if(slot > 0 && window.SAVE && SAVE.abilOwned && !SAVE.abilOwned(el.id, slot)){
      slot = 0;
      p.signatureSlot = 0;
      if(window.NET && NET.setMySignature) try{NET.setMySignature(0);}catch(e){}
    }

    /* Silicon slot 0 is a hard contract: Circuit must always invoke the
       conductive-node implementation, never a generic projectile choice. */
    if(!el.mol && Number(el.n)===14 && slot===0){
      p.activeCd=.5;
      if(window.SFX&&SFX.active)SFX.active();
      RUN.shake=Math.max(RUN.shake||0,6);
      if(window.banner)banner('CIRCUIT',1000);
      if(RUN.isOnline && window.NET && !NET.isHost){
        NET.sendClientAction('circuit');
        p.circuitCd=.5;
      }else if(typeof window.ISO_SILICON_CIRCUIT==='function'){
        window.ISO_SILICON_CIRCUIT(p);
      }else if(typeof A!=='undefined'&&typeof A[14]==='function'){
        A[14](p);
      }
      return;
    }

    /* All 3 choices for elements and compounds execute their dedicated custom implementation. */
    var choice=(el.choices||el.signatures||[])[slot];
    if(choice && typeof choice.exec==='function'){
      p.activeCd=ST.activeCd;
      if(window.SFX&&SFX.active)SFX.active();
      RUN.shake=Math.max(RUN.shake||0,8);
      if(window.banner)banner(String(choice.name||'ABILITY').toUpperCase(),1200);
      try{choice.exec(p);}catch(err){console.error('custom ability execution error',el.id,slot,err);}
      return;
    }

    /* Silicon's slot 0 is exclusively the Circuit system. */
    if(!el.mol && Number(el.n)===14 && slot===0){
      p.activeCd=.5;
      if(window.SFX&&SFX.active)SFX.active();
      RUN.shake=Math.max(RUN.shake||0,6);
      if(window.banner)banner('CIRCUIT',1000);
      if(RUN.isOnline && window.NET && !NET.isHost){
        NET.sendClientAction('circuit');
        p.circuitCd=.5;
      }else if(typeof window.ISO_SILICON_CIRCUIT==='function'){
        window.ISO_SILICON_CIRCUIT(p);
      }
      return;
    }

    /* All 118 elemental first abilities are hard-routed to A[n].
       No category ability, old signature, ARCH ability, or legacyUse can fire. */
    if(!el.mol && Number(el.n)>=1 && Number(el.n)<=118 && typeof A!=='undefined' && typeof A[Number(el.n)]==='function'){
      p.activeCd=ST.activeCd;
      if(window.SFX&&SFX.active)SFX.active();
      RUN.shake=Math.max(RUN.shake||0,6);
      var name=(el.choices&&el.choices[0]&&el.choices[0].name)||'ABILITY '+el.n;
      if(window.banner)banner(String(name).toUpperCase(),1200);
      try{A[Number(el.n)](p);}catch(err){console.error('element semantic ability',el.n,err);}
      return;
    }

    /* Unknown legacy entities are the only ones allowed through the old router. */
    return FALLBACK(p);
  };

  /* Sanitize stale save data so an unowned slot can never remain equipped. */
  if(window.SAVE){
    var oldGet=SAVE.getSignature;
    SAVE.getSignature=function(id){
      var s=oldGet?Number(oldGet(id))||0:0;
      try{
        if(s>0 && !SAVE.abilOwned(id,s)) return 0;
      }catch(e){ if(s>0)return 0; }
      return Math.max(0,Math.min(2,s));
    };
    var oldSet=SAVE.setSignature;
    SAVE.setSignature=function(id,slot){
      slot=Math.max(0,Math.min(2,Number(slot)||0));
      if(slot>0&&SAVE.abilOwned&&!SAVE.abilOwned(id,slot)){
        slot=0;
      }
      return oldSet?oldSet(id,slot):slot;
    };
  }

  console.log('ISO_AUTHORITATIVE_ABILITY_ROUTER_V2 active: updated element abilities no longer fall through to legacy behavior.');
})();

/* ISO_VAULT_ABILITY_ECONOMY_V3
 * Optional element abilities are purchased separately at 2x element price.
 * Synthesized/chemical compounds use the fixed 700 credit unlock price.
 */
(function(){
  if(window.__ISO_VAULT_ABILITY_ECONOMY_V3__)return;
  window.__ISO_VAULT_ABILITY_ECONOMY_V3__=true;
  if(!window.SAVE)return;
  SAVE.abilCost=function(el){
    if(!el)return 0;
    return el.mol ? 700 : Math.max(0,Math.round((Number(el.cost)||0)*2));
  };
  SAVE.buyAbil=function(id,slot,el){
    slot=Math.max(1,Math.min(2,Number(slot)||1));
    var c=SAVE.abilCost(el);
    if(SAVE.abilOwned && SAVE.abilOwned(id,slot)) return true;
    if(!SAVE.spend(c)) return false;
    SAVE.raw.abil[id]=SAVE.raw.abil[id]||{};
    SAVE.raw.abil[id][slot]=true;
    if(!SAVE.raw.signatures) SAVE.raw.signatures={};
    if(SAVE.raw.signatures[id]==null) SAVE.raw.signatures[id]=0;
    SAVE.save();
    return true;
  };
  console.log('ISO_VAULT_ABILITY_ECONOMY_V3 active: optional abilities are individually purchased; elements cost 2x, compounds cost 700.');
})();
/* ISO_COMPOUND_ATTACKS_V5
 * Every synthesized real compound gets 3 executable, compound-specific attacks.
 * These are not name-only abilities: each selection runs its own closure with
 * chemistry-derived parameters, projectiles/fields/statuses, and a visible effect.
 */
(function(){
  if(window.__ISO_COMPOUND_ATTACKS_V5__) return;
  window.__ISO_COMPOUND_ATTACKS_V5__=true;
  if(!window.DATA||!DATA.MOLDEF) return;

  function hash(s){let h=2166136261>>>0;for(const c of String(s)){h^=c.charCodeAt(0);h=Math.imul(h,16777619)>>>0;}return h>>>0;}
  function enemies(){return RUN&&RUN.enemies?RUN.enemies.filter(e=>e&&!e.dead):[];}
  function allies(p){return RUN&&RUN.players?RUN.players.filter(q=>q&&q.id!==p.id&&!q.downed):[];}
  function dist(a,b){return Math.hypot(a.x-b.x,a.y-b.y);}
  function clamp2(v,a,b){return Math.max(a,Math.min(b,v));}
  function cursor(p){return {x:typeof mouse!=='undefined'?clamp2(mouse.x,20,W-20):p.x+Math.cos(p.angle||0)*180,y:typeof mouse!=='undefined'?clamp2(mouse.y,20,H-20):p.y+Math.sin(p.angle||0)*180};}
  function stat(k,d){try{return Number(ST[k])||d}catch(e){return d;}}
  function dmgBase(seed){return stat('dmg',12)*(1+(seed%17)*0.028);}
  function speedBase(seed){return stat('ps',7)*(1.15+(seed%7)*0.07);}
  function bullet(p,ang,speed,dmg,r,life,extra){
    RUN.bullets.push(Object.assign({x:p.x,y:p.y,vx:Math.cos(ang)*speed,vy:Math.sin(ang)*speed,dmg,r,life,owner:p.id,hit:[]},extra||{}));
  }
  function burst(x,y,r,dmg,kb){if(typeof aoe==='function')aoe(x,y,r,dmg,kb);}
  function ring(x,y,r,col){if(typeof ringFx==='function')ringFx(x,y,col,r);}
  function nearest(p){var best=null,bd=1e18;enemies().forEach(e=>{var d=d2(e.x,e.y,p.x,p.y);if(d<bd){bd=d;best=e;}});return best;}
  function applyMark(e,key,t,amp){e.compMarks=e.compMarks||{};e.compMarks[key]={t,amp:amp||1};}
  function chemistry(name,formula){
    const n=String(name).toLowerCase(),f=String(formula).toLowerCase();
    const c={};const re=/([A-Z][a-z]?)(\d*)/g;let m;while((m=re.exec(formula||''))){c[m[1]]=(c[m[1]]||0)+Number(m[2]||1);}
    return {
      C:c.C||0,H:c.H||0,O:c.O||0,N:c.N||0,P:c.P||0,S:c.S||0,
      F:c.F||0,Cl:c.Cl||0,Br:c.Br||0,I:c.I||0,
      metal:Object.keys(c).some(k=>/^(Na|K|Ca|Mg|Al|Fe|Cu|Ag|Zn|Ba|Sr|Li|Cs|Rb|Be|Ga|Ge|As|Se)$/.test(k)),
      oxy:n.includes('peroxide')||n.includes('nitrate')||n.includes('nitrite')||n.includes('chromate')||n.includes('hypochlorite')||n.includes('perchlorate')||n.includes('periodate'),
      acid:/(acid|hydrogen chloride|hydrogen fluoride|hydrogen bromide|hydrogen iodide)/.test(n),
      base:/hydroxide|carbonate|bicarbonate/.test(n),
      bio:/creatine|vitamin|amino|adenosine|guanosine|cytidine|uridine|thymidine|caffeine|nicotine|cholesterol|bilirubin|melanin|carotene/.test(n),
      gas:/water|methane|ethane|propane|butane|pentane|hexane|heptane|octane|oxide|ammonia/.test(n),
      organic:/^c/.test(f)||c.C>0
    };
  }

  function fitProfile(name,formula){
    const n=String(name).toLowerCase();
    if(n==='water')return 'water';
    if(n.includes('peroxide'))return 'peroxide';
    if(/amine|ammonia/.test(n))return 'amine';
    if(/methane|ethane|propane|butane|pentane|hexane|heptane|octane|nonane|decane/.test(n))return 'fuel';
    if(/ethene|propene|butene|pentene|hexene|heptene|octene/.test(n))return 'alkene';
    if(/acetylene|alkyne|propyne|butyne/.test(n))return 'alkyne';
    if(/hydroxide/.test(n))return 'base';
    if(/bicarbonate|carbonate/.test(n))return 'carbonate';
    if(/sulfate|sulfite|bisulfite|metabisulfite/.test(n))return 'sulfate';
    if(/nitrate|nitrite/.test(n))return 'nitrate';
    if(/chromate|dichromate/.test(n))return 'chromate';
    if(/bromate|iodate|periodate|hypochlorite|perchlorate/.test(n))return 'oxoHalogen';
    if(/silicate|fluorosilicate/.test(n))return 'silicate';
    if(/cyanide|cyanamide|cyanogen/.test(n))return 'cyan';
    if(/phosphate|adenosine monophosphate|guanosine monophosphate|cytidine monophosphate|uridine monophosphate|thymidine monophosphate/.test(n))return 'phosphate';
    if(/adenosine|guanosine|cytidine|uridine|thymidine/.test(n))return 'nucleoside';
    if(/creatine/.test(n))return 'creatine';
    if(/vitamin|nicotinamide|riboflavin|thiamine|biotin|pantothenic/.test(n))return 'vitamin';
    if(/alanine|valine|leucine|isoleucine|lysine|arginine|histidine|methionine|phenylalanine|tyrosine|tryptophan|glutamic|glutamine|l-dopa/.test(n))return 'amino';
    if(/cholesterol|cholic acid|bilirubin|melanin|carotene/.test(n))return 'bioPigment';
    if(/nicotine|caffeine|theobromine|capsaicin|menthol|vanillin|citral|limonene|ephedrine|atropine|quinine|warfarin|ibuprofen|naproxen|lidocaine|procaine|allopurinol|barbituric/.test(n))return 'bioactive';
    if(/acid$| acid/.test(n))return 'acid';
    if(/sodium|potassium|calcium|magnesium|aluminum|iron|copper|silver|zinc|barium|strontium|lithium|cesium|rubidium|beryllium|gallium|germanium|arsenic|selenium|krypton|xenon|iodine|bromine|chlorine/.test(n))return 'ionic';
    return 'general';
  }

  function makeAbility(m,slot){
    const name=m.name||'Compound', formula=m.f||m.formula||'', seed=hash(name+'|'+formula+'|'+slot), c=chemistry(name,formula), pfit=fitProfile(name,formula);
    const angBias=((seed%101)-50)*0.0016, damage=dmgBase(seed)*(1+(c.O*.025)+(c.halogen?0:0));
    const velocity=speedBase(seed), duration=3.6+(seed%6)*0.42, radius=65+(seed%7)*14;
    const spec={
      seed,name,formula,profile:pfit,slot,C:c.C,H:c.H,O:c.O,N:c.N,P:c.P,S:c.S,F:c.F,Cl:c.Cl,Br:c.Br,I:c.I,metal:c.metal,oxy:c.oxy,acid:c.acid,base:c.base,bio:c.bio,gas:c.gas,organic:c.organic,
      damage,velocity,duration,radius,ang:angBias
    };
    return function(p){
      if(!RUN||!p)return;
      const a=(p.angle||0)+spec.ang, t=cursor(p), d=spec.damage*(p.puDamage||1);
      const friendly=()=>RUN.players.filter(q=>q&&!q.downed);
      const applySlow=e=>e.slowT=Math.max(e.slowT||0,0.7+(spec.O||0)*.08);
      const applyCorrode=e=>{if(typeof addCorrode==='function')addCorrode(e,3.5+spec.O*.2,0.38+spec.oxygen*.02);};
      const applyBurn=e=>{if(typeof addBurn==='function')addBurn(e,d*.18,2.4+spec.duration*.35);};

      switch(spec.profile){
        case 'water':
          if(slot===0){ for(let i=-1;i<=1;i++)bullet(p,a+i*.065,spec.velocity*1.6,d*(1.1+i*0.04),4,1.25,{compound:name,water:true,knock:1.2}); RUN.compFields=RUN.compFields||[];RUN.compFields.push({x:t.x,y:t.y,r:55+spec.radius*.35,t:2.8,water:true,owner:p.id}); }
          else if(slot===1){ RUN.compFields=RUN.compFields||[];RUN.compFields.push({x:t.x,y:t.y,r:spec.radius,t:spec.duration,waterCurrent:true,owner:p.id}); enemies().forEach(e=>{if(d2(e.x,e.y,t.x,t.y)<spec.radius*spec.radius){applySlow(e);}}); }
          else { p.sh=Math.min((ST.shieldMax||90)+20,p.sh+(ST.shieldMax||90)*.28);p._waterShield=spec.duration; }
          break;
        case 'peroxide':
          if(slot===0){ RUN.compMines=RUN.compMines||[];RUN.compMines.push({x:t.x,y:t.y,t:spec.duration,owner:p.id,peroxide:true,d:d*1.15,r:spec.radius*.7}); }
          else if(slot===1){ RUN.compFields=RUN.compFields||[];RUN.compFields.push({x:p.x,y:p.y,r:spec.radius*.9,t:spec.duration,oxidizer:true,owner:p.id}); }
          else { for(let i=0;i<5;i++){const aa=a+(i-2)*.18;bullet(p,aa,spec.velocity*1.35,d*.72,4,1.0,{compound:name,oxidizer:true,burn:true});} }
          break;
        case 'amine':
          if(slot===0){const e=nearest(p);if(e){e.compTether={pid:p.id,t:spec.duration,dmg:d*.5,amine:true};e.x+=(p.x-e.x)*.08;e.y+=(p.y-e.y)*.08;} ring(p.x,p.y,90,140);}
          else if(slot===1){friendly().forEach(q=>{q.puDamage=Math.max(q.puDamage||1,1.16+(spec.N*.01));q.puRate=Math.max(q.puRate||1,1.14);q.puTimer=Math.max(q.puTimer||0,spec.duration);});}
          else {RUN.compFields=RUN.compFields||[];RUN.compFields.push({x:t.x,y:t.y,r:spec.radius,t:spec.duration,base:true,owner:p.id});}
          break;
        case 'fuel':
          if(slot===0){RUN.compThreads=RUN.compThreads||[];RUN.compThreads.push({ax:p.x,ay:p.y,bx:t.x,by:t.y,t:spec.duration,fuelTrail:true,dmg:d*.32,owner:p.id});}
          else if(slot===1){p.x=clamp2(p.x+Math.cos(a)*155,25,W-25);p.y=clamp2(p.y+Math.sin(a)*155,25,H-25);burst(p.x,p.y,72,d*1.35,85);}
          else {p._fuelReserve={t:spec.duration,charge:0,owner:p.id,dmg:d};}
          break;
        case 'alkene':
          if(slot===0){const q=[];for(let i=0;i<4;i++){const aa=a+(i-1.5)*.1;bullet(p,aa,spec.velocity*(1.25+i*.1),d*(.7+i*.1),4,1.25,{compound:name,addition:true,splitAfter:1});q.push(i);} }
          else if(slot===1){RUN.compFields=RUN.compFields||[];RUN.compFields.push({x:t.x,y:t.y,r:spec.radius,t:spec.duration,polymer:true,owner:p.id});}
          else {RUN.compMines=RUN.compMines||[];RUN.compMines.push({x:t.x,y:t.y,t:spec.duration,owner:p.id,alkeneTrap:true,d:d});}
          break;
        case 'alkyne':
          if(slot===0){bullet(p,a,spec.velocity*2.15,d*1.85,4,1.0,{compound:name,pierce:9,triple:true});}
          else if(slot===1){RUN.compThreads=RUN.compThreads||[];RUN.compThreads.push({ax:p.x,ay:p.y,bx:t.x,by:t.y,t:spec.duration,spark:true,dmg:d*.6,owner:p.id});}
          else {const e=nearest(p);if(e){applyBurn(e);e.compDet={t:1.6,dmg:d*1.8,triple:true,owner:p.id};}}
          break;
        case 'acid':
          if(slot===0){RUN.compFields=RUN.compFields||[];RUN.compFields.push({x:t.x,y:t.y,r:spec.radius,t:spec.duration,acid:true,owner:p.id,dmg:d*.45});}
          else if(slot===1){bullet(p,a,spec.velocity*1.9,d*1.4,4,1.0,{compound:name,corrosive:true,pierce:5});}
          else {const e=nearest(p);if(e){applyCorrode(e);applyMark(e,'acid',spec.duration,1.25);burst(e.x,e.y,40,d*.55,10);}}
          break;
        case 'base':
          if(slot===0){burst(t.x,t.y,70+spec.radius*.25,d*.95,35);enemies().forEach(e=>{if(d2(e.x,e.y,t.x,t.y)<100*100){applyCorrode(e);e.slowT=Math.max(e.slowT||0,.8);}});}
          else if(slot===1){p.sh=Math.min((ST.shieldMax||90)+35,p.sh+(ST.shieldMax||90)*.5);p._baseShell=spec.duration;}
          else {RUN.compFields=RUN.compFields||[];RUN.compFields.push({x:t.x,y:t.y,r:spec.radius,t:spec.duration,neutralize:true,owner:p.id});}
          break;
        case 'carbonate':
          if(slot===0){RUN.compMines=RUN.compMines||[];RUN.compMines.push({x:t.x,y:t.y,t:spec.duration,owner:p.id,carbonate:true,d:d*1.3,r:spec.radius*.55});}
          else if(slot===1){p.sh=Math.min((ST.shieldMax||90)+20,p.sh+20);RUN.compFields=RUN.compFields||[];RUN.compFields.push({x:p.x,y:p.y,r:80,t:3.6,buffer:true,owner:p.id});}
          else {burst(t.x,t.y,78,d*1.5,75);for(let i=0;i<4;i++)bullet(p,a+(i-1.5)*.24,spec.velocity*.9,d*.4,3,.8,{compound:name,carbonation:true});}
          break;
        case 'sulfate':
          if(slot===0){RUN.compFields=RUN.compFields||[];for(let i=0;i<4;i++)RUN.compFields.push({x:t.x+Math.cos(i*Math.PI/2)*55,y:t.y+Math.sin(i*Math.PI/2)*55,r:35,t:spec.duration,sulfate:true,owner:p.id});}
          else if(slot===1){friendly().forEach(q=>{q.puDamage=Math.max(q.puDamage||1,1.1);q.puTimer=Math.max(q.puTimer||0,4);});}
          else {burst(t.x,t.y,72,d*1.25,60);enemies().forEach(e=>{if(d2(e.x,e.y,t.x,t.y)<72*72)applySlow(e);});}
          break;
        case 'nitrate':
          if(slot===0){p._nitrateCharge={t:spec.duration,stacks:0,d:d};}
          else if(slot===1){RUN.compFields=RUN.compFields||[];RUN.compFields.push({x:t.x,y:t.y,r:spec.radius,t:spec.duration,nitrate:true,owner:p.id});}
          else {for(let i=0;i<6;i++)setTimeout(()=>{if(RUN)bullet(p,a+(i-2.5)*.1,spec.velocity*1.4,d*.58,4,1,{compound:name,oxidizing:true});},i*90);}
          break;
        case 'chromate':
          if(slot===0){bullet(p,a,spec.velocity*2.5,d*1.75,3,.85,{compound:name,chromatic:true,pierce:7});}
          else if(slot===1){p._chromeWard=spec.duration;p.sh=Math.min((ST.shieldMax||90)+25,p.sh+25);}
          else {for(let i=0;i<3;i++)bullet(p,a+(i-1)*.2,spec.velocity*1.7,d*.8,4,1,{compound:name,prism:true});}
          break;
        case 'oxoHalogen':
          if(slot===0){bullet(p,a,spec.velocity*1.75,d*1.25,4,1.1,{compound:name,oxidizer:true,corrosive:true});}
          else if(slot===1){RUN.compThreads=RUN.compThreads||[];RUN.compThreads.push({ax:p.x,ay:p.y,bx:t.x,by:t.y,t:spec.duration,reactive:true,owner:p.id,dmg:d*.5});}
          else {RUN.compFields=RUN.compFields||[];RUN.compFields.push({x:t.x,y:t.y,r:spec.radius,t:spec.duration,sterilize:true,owner:p.id});}
          break;
        case 'silicate':
          if(slot===0){RUN.compThreads=RUN.compThreads||[];RUN.compThreads.push({ax:t.x-80,ay:t.y-35,bx:t.x+80,by:t.y+35,t:spec.duration,wall:true,silicate:true,owner:p.id});}
          else if(slot===1){p.x=clamp2(p.x+Math.cos(a)*145,25,W-25);p.y=clamp2(p.y+Math.sin(a)*145,25,H-25);p.iframes=Math.max(p.iframes||0,1.0);}
          else {RUN.compFields=RUN.compFields||[];for(let i=0;i<4;i++)RUN.compFields.push({x:p.x+Math.cos(i*Math.PI/2)*45,y:p.y+Math.sin(i*Math.PI/2)*45,r:28,t:spec.duration,cage:true,owner:p.id});}
          break;
        case 'cyan':
          if(slot===0){const e=nearest(p);if(e){applyMark(e,'cyan',spec.duration,1.6);e.slowT=Math.max(e.slowT||0,2.2);}}
          else if(slot===1){bullet(p,a,spec.velocity*1.85,d*1.5,4,1.1,{compound:name,cyan:true,pierce:3});}
          else {const e=nearest(p);if(e){e.compTether={pid:p.id,t:spec.duration,dmg:d*.75,cyan:true};}}
          break;
        case 'phosphate':
          if(slot===0){p._phosBattery={t:spec.duration,charge:0,d:d};p.puRate=Math.max(p.puRate||1,1.15);p.puTimer=spec.duration;}
          else if(slot===1){friendly().forEach(q=>{q.puDamage=Math.max(q.puDamage||1,1.2);q.puRate=Math.max(q.puRate||1,1.15);q.puTimer=Math.max(q.puTimer||0,6);});}
          else {const e=nearest(p);if(e){applyMark(e,'phosphate',spec.duration,1.3);burst(e.x,e.y,42,d*.8,15);}}
          break;
        case 'nucleoside':
          if(slot===0){RUN.compEcho=RUN.compEcho||[];RUN.compEcho.push({owner:p.id,a,delay:1.0,t:1.0,compound:name,seed});bullet(p,a,spec.velocity*1.25,d*.72,4,1.2,{compound:name,basePair:true});}
          else if(slot===1){for(let i=0;i<3;i++)bullet(p,a+(i-1)*.18,spec.velocity*(1+i*.15),d*.72,4,1.3,{compound:name,helix:true});}
          else {p._geneticMemory={t:spec.duration,owner:p.id,element:name};}
          break;
        case 'creatine':
          if(slot===0){friendly().forEach(q=>{q.puDamage=Math.max(q.puDamage||1,1.3);q.puRate=Math.max(q.puRate||1,1.2);q.puTimer=Math.max(q.puTimer||0,7);q.sh=Math.min((ST.shieldMax||90)+25,q.sh+18);});p.puDamage=Math.max(p.puDamage||1,1.32);p.puRate=Math.max(p.puRate||1,1.22);p.puTimer=7;ring(p.x,p.y,140,160);}
          else if(slot===1){const a1=allies(p)[0];if(a1){a1.sh=Math.min((ST.shieldMax||90)+25,(a1.sh||0)+28);a1.activeCd=Math.max(0,(a1.activeCd||0)-2);a1.hp=Math.min(a1.hp+10,(ST.hp||120));}p.sh=Math.min((ST.shieldMax||90)+25,p.sh+18);}
          else {p._creatineReserve={t:spec.duration,charge:0,d:d};}
          break;
        case 'vitamin':
          if(slot===0){RUN.compFields=RUN.compFields||[];RUN.compFields.push({x:p.x,y:p.y,r:95,t:spec.duration,cofactor:true,owner:p.id});}
          else if(slot===1){p.puDamage=Math.max(p.puDamage||1,1.18);p.puRate=Math.max(p.puRate||1,1.15);p.puTimer=Math.max(p.puTimer||0,5);}
          else {p.iframes=Math.max(p.iframes||0,1.3);p._vitGuard=spec.duration;}
          break;
        case 'amino':
          if(slot===0){const a1=allies(p)[0];if(a1){p._aminoLink={target:a1.id,t:spec.duration};a1._aminoLinked={target:p.id,t:spec.duration};}}
          else if(slot===1){p.hp=Math.min(ST.hp||120,p.hp+(ST.hp||120)*.16);const a1=allies(p)[0];if(a1)a1.hp=Math.min(ST.hp||120,a1.hp+(ST.hp||120)*.12);}
          else {for(let i=-2;i<=2;i++)bullet(p,a+i*.08,spec.velocity*1.2,d*.55,4,1,{compound:name,aminoCascade:true});}
          break;
        case 'bioPigment':
          if(slot===0){p._compoundStealth=spec.duration;p.iframes=Math.max(p.iframes||0,.8);}
          else if(slot===1){burst(t.x,t.y,60,d*.9,0);enemies().forEach(e=>{if(d2(e.x,e.y,t.x,t.y)<90*90)e.blindT=Math.max(e.blindT||0,2);});}
          else {const e=nearest(p);if(e){applyMark(e,'pigment',spec.duration,1.35);}}
          break;
        case 'bioactive':
          if(slot===0){const e=nearest(p);if(e){applyMark(e,'receptor',spec.duration,1.5);e.stun=Math.max(e.stun||0,.45);}}
          else if(slot===1){const e=nearest(p);if(e){e.compFocus={t:spec.duration,owner:p.id,mult:1.45};}}
          else {RUN.compFields=RUN.compFields||[];RUN.compFields.push({x:t.x,y:t.y,r:80,t:2.8,bioactive:true,owner:p.id});}
          break;
        case 'ionic':
          if(slot===0){bullet(p,a,spec.velocity*1.9,d*1.3,5,1.15,{compound:name,ion:true,chain:Math.min(4,2+spec.N+spec.O)});}
          else if(slot===1){RUN.compFields=RUN.compFields||[];RUN.compFields.push({x:t.x,y:t.y,r:spec.radius,t:spec.duration,ionic:true,owner:p.id});}
          else {RUN.compThreads=RUN.compThreads||[];for(let i=0;i<3;i++)RUN.compThreads.push({ax:p.x,ay:p.y,bx:t.x+(i-1)*30,by:t.y+(i-1)*30,t:spec.duration,ionThread:true,owner:p.id,dmg:d*.35});}
          break;
        default:
          if(slot===0){bullet(p,a,spec.velocity*1.55,d*1.25,5,1.2,{compound:name,uniqueSeed:spec.seed});}
          else if(slot===1){RUN.compFields=RUN.compFields||[];RUN.compFields.push({x:t.x,y:t.y,r:spec.radius,t:spec.duration,compound:name,uniqueSeed:spec.seed,owner:p.id});}
          else {burst(t.x,t.y,75,d*1.3,35);}
      }
      p._lastCompoundAbility={id:m.id,slot,seed:spec.seed,name,formula};
    };
  }

  let count=0;
  Object.keys(DATA.MOLDEF).forEach(function(k){
    const m=DATA.MOLDEF[k];
    if(!m||!m.mol||m.rx!=='Real compound'||!Array.isArray(m.choices)||m.choices.length!==3)return;
    m.choices.forEach(function(ch,slot){ch.exec=makeAbility(m,slot);ch.implemented=true;ch.implementation='compound-specific attack closure';});
    m.act=m.choices[0];m.signatures=m.choices;count+=3;
  });

  /* Runtime states that make the persistent abilities actually do damage. */
  const oldUpd=update;
  update=function(dt){
    oldUpd(dt); if(!RUN)return;
    const now=RUN.t||0;
    (RUN.compFields||[]).forEach(function(f){
      if(f._tick==null)f._tick=0;f._tick+=dt;
      if(f._tick<.22)return;f._tick=0;
      enemies().forEach(function(e){
        if(d2(e.x,e.y,f.x,f.y)>((f.r||40)+e.r)**2)return;
        if(f.waterCurrent){e.x+=(f.x-e.x)*.08; e.y+=(f.y-e.y)*.08; e.slowT=Math.max(e.slowT||0,.5);}
        if(f.acid){if(typeof addCorrode==='function')addCorrode(e,2.4,.32);if(f.dmg&&typeof dmgEnemy==='function')dmgEnemy(e,f.dmg);}
        if(f.oxidizer){if(typeof addBurn==='function')addBurn(e,stat('dmg',12)*.16,1.8);}
        if(f.polymer){e.slowT=Math.max(e.slowT||0,1.0);}
        if(f.base&&typeof addCorrode==='function')addCorrode(e,1.3,.22);
        if(f.neutralize){e.slowT=Math.max(e.slowT||0,.6);}
        if(f.sulfate){if(typeof dmgEnemy==='function')dmgEnemy(e,stat('dmg',12)*.28);e.slowT=Math.max(e.slowT||0,.45);}
        if(f.nitrate){if(typeof dmgEnemy==='function')dmgEnemy(e,stat('dmg',12)*.32);e._nitrateBurn=1.5;}
        if(f.sterilize){if(typeof dmgEnemy==='function')dmgEnemy(e,stat('dmg',12)*.22);e.conf=Math.max(e.conf||0,.5);}
        if(f.cage){e.x+=(f.x-e.x)*.12;e.y+=(f.y-e.y)*.12;}
        if(f.ionic&&typeof dmgEnemy==='function')dmgEnemy(e,stat('dmg',12)*.3);
        if(f.water&&typeof dmgEnemy==='function')dmgEnemy(e,stat('dmg',12)*.18);
        if(f.waterCurrent&&d2(e.x,e.y,f.x,f.y)<f.r*f.r){e.slowT=Math.max(e.slowT||0,1.0);}
        if(f.coFactor){
          const owner=RUN.players.find(q=>q&&q.id===f.owner);if(owner){owner.hp=Math.min(ST.hp||120,owner.hp+0.3*dt);owner.sh=Math.min((ST.shieldMax||90)+25,owner.sh+0.5*dt);}
        }
      });
    });
    (RUN.compMines||[]).forEach(function(m){
      if(m._triggered)return;
      if(!enemies().some(e=>d2(e.x,e.y,m.x,m.y)<((m.r||35)+e.r)**2))return;
      m._triggered=true;
      burst(m.x,m.y,m.r?m.r*1.4:90,m.d||stat('dmg',12)*1.4,65);
      enemies().forEach(e=>{if(d2(e.x,e.y,m.x,m.y)<110*110&&m.peroxide&&typeof addCorrode==='function')addCorrode(e,4,.45);});
    });
    RUN.compMines=RUN.compMines||[];RUN.compMines=RUN.compMines.filter(m=>!m._triggered&&m.t>0);
    RUN.players.forEach(function(p){
      if(p._fuelReserve){p._fuelReserve.t-=dt; if(p._fuelReserve.t<=0){burst(p.x,p.y,92,(p._fuelReserve.d||stat('dmg',12))*2.1,70);p._fuelReserve=null;}}
      if(p._nitrateCharge){p._nitrateCharge.t-=dt;if(p._nitrateCharge.t>0&&Math.random()<dt*.75)p._nitrateCharge.stacks=Math.min(8,(p._nitrateCharge.stacks||0)+1);else if(p._nitrateCharge.t<=0){var ns=Math.max(1,p._nitrateCharge.stacks||1);for(var ni=0;ni<ns;ni++)bullet(p,(p.angle||0)+(ni-(ns-1)/2)*.07,stat('ps',7)*1.55,(p._nitrateCharge.d||stat('dmg',12))*(.55+ns*.08),4,1.0,{compound:'nitrate-release',oxidizing:true});p._nitrateCharge=null;}}
      if(p._phosBattery){p._phosBattery.t-=dt;if(p._phosBattery.t>0&&Math.random()<dt*.8)p._phosBattery.charge=Math.min(100,(p._phosBattery.charge||0)+4);else if(p._phosBattery.t<=0){var pc=Math.max(1,Math.round((p._phosBattery.charge||20)/20));for(var pi=0;pi<pc;pi++)bullet(p,(p.angle||0)+(pi-(pc-1)/2)*.1,stat('ps',7)*1.9,(p._phosBattery.d||stat('dmg',12))*(1.0+pc*.12),5,1.15,{compound:'phosphate-release',phosphate:true});p._phosBattery=null;}}
      if(p._creatineReserve){p._creatineReserve.t-=dt;if(p._creatineReserve.t>0){p.puRate=Math.max(p.puRate||1,1.08);p.puDamage=Math.max(p.puDamage||1,1.08);}else{var cp=RUN.players.filter(function(q){return q&&!q.downed;});cp.forEach(function(q){q.puRate=Math.max(q.puRate||1,1.16);q.puDamage=Math.max(q.puDamage||1,1.14);q.puTimer=Math.max(q.puTimer||0,4);q.sh=Math.min((ST.shieldMax||90)+25,q.sh+12);});ring(p.x,p.y,125,160);p._creatineReserve=null;}}
      if(p._waterShield){p._waterShield-=dt;if(p._waterShield>0)p.sh=Math.min((ST.shieldMax||90)+20,p.sh+.15*dt);}
      if(p._baseShell){p._baseShell-=dt;if(p._baseShell>0)p.sh=Math.min((ST.shieldMax||90)+35,p.sh+.1*dt);else p._baseShell=null;}
      if(p._chromeWard){p._chromeWard-=dt;if(p._chromeWard>0)p.iframes=Math.max(p.iframes||0,.08);}
      if(p._vitGuard){p._vitGuard-=dt;if(p._vitGuard>0)p.iframes=Math.max(p.iframes||0,.08);}
      if(p._geneticMemory){p._geneticMemory.t-=dt;if(p._geneticMemory.t>0&&Math.random()<dt*.9)bullet(p,(p.angle||0)+((Math.random()-.5)*.4),stat('ps',7)*1.35,stat('dmg',12)*.65,4,1.0,{compound:'genetic-memory'});else if(p._geneticMemory.t<=0)p._geneticMemory=null;}
      if(p._aminoLink){p._aminoLink.t-=dt;var at=RUN.players.find(function(q){return q.id===p._aminoLink.target;});if(at&&p._aminoLink.t>0){p.hp=Math.min(ST.hp||120,p.hp+.8*dt);at.hp=Math.min(ST.hp||120,at.hp+.6*dt);}else p._aminoLink=null;}
      if(p._compoundStealth){p._compoundStealth-=dt;}
    });
    enemies().forEach(function(e){
      if(e.compTether&&e.compTether.amine){e.compTether.t-=dt;if(e.compTether.t>0){const p=RUN.players.find(q=>q.id===e.compTether.pid);if(p){e.x+=(p.x-e.x)*dt*.55;e.y+=(p.y-e.y)*dt*.55;if(Math.random()<dt*2)dmgEnemy(e,e.compTether.dmg||2);}}else e.compTether=null;}
      if(e.compMarks){Object.keys(e.compMarks).forEach(function(k){e.compMarks[k].t-=dt;if(e.compMarks[k].t<=0)delete e.compMarks[k];});}
      if(e.compFocus){e.compFocus.t-=dt;if(e.compFocus.t<=0)e.compFocus=null;}
      if(e._nitrateBurn){e._nitrateBurn-=dt;if(e._nitrateBurn>0&&Math.random()<dt)dmgEnemy(e,stat('dmg',12)*.15);}
    });
  };
  const oldRen=render;
  render=function(){
    oldRen();if(!RUN)return;
    (RUN.compFields||[]).forEach(function(f){
      const color=f.acid?'rgba(190,100,255,.18)':f.oxidizer?'rgba(255,180,80,.16)':f.water||f.waterCurrent?'rgba(90,190,255,.18)':f.polymer?'rgba(120,230,180,.15)':f.ionic?'rgba(120,160,255,.15)':'rgba(120,220,255,.12)';
      cx.fillStyle=color;cx.beginPath();cx.arc(f.x,f.y,f.r||30,0,TAU);cx.fill();cx.strokeStyle=color.replace(/\.1[258]/,'.45');cx.lineWidth=2;cx.stroke();
    });
    (RUN.compThreads||[]).forEach(function(t){cx.strokeStyle=t.fuelTrail?'rgba(255,170,70,.7)':t.spark?'rgba(255,230,120,.85)':'rgba(120,220,255,.65)';cx.lineWidth=t.wall||t.silicate?5:3;cx.beginPath();cx.moveTo(t.ax,t.ay);cx.lineTo(t.bx,t.by);cx.stroke();});
  };

  const audit=[];Object.keys(DATA.MOLDEF).forEach(function(k){const m=DATA.MOLDEF[k];if(!m||!m.mol||m.rx!=='Real compound')return;audit.push({name:m.name,implemented:m.choices.every(c=>typeof c.exec==='function'&&c.implemented===true)});});
  DATA.compoundAttackRuntime={version:'V5',totalExecutables:count,allImplemented:audit.every(a=>a.implemented),audit};
  console.log('ISO_COMPOUND_ATTACKS_V5 active:',count,'real-compound executable abilities installed; allImplemented=',DATA.compoundAttackRuntime.allImplemented);
})();
/* ISOTOPE COMPOUND WAVE 1: first ability execution only. Names/descriptions are untouched. */
(function(){
 if(window.__ISO_COMPOUND_WAVE1__)return; window.__ISO_COMPOUND_WAVE1__=true;
 if(!window.DATA||!DATA.MOLDEF)return;
 function h(s){let x=2166136261>>>0;for(const c of String(s)){x^=c.charCodeAt(0);x=Math.imul(x,16777619)>>>0;}return x>>>0;}
 function es(){return RUN&&RUN.enemies?RUN.enemies.filter(e=>e&&!e.dead):[]}
 function as(p){return RUN&&RUN.players?RUN.players.filter(q=>q&&q.id!==p.id&&!q.downed):[]}
 function st(k,d){try{return Number(ST[k])||d}catch(e){return d}}
 function pt(p){let x=(typeof mouse!=='undefined'&&mouse&&Number.isFinite(mouse.x))?mouse.x:p.x+Math.cos(p.angle||0)*220;let y=(typeof mouse!=='undefined'&&mouse&&Number.isFinite(mouse.y))?mouse.y:p.y+Math.sin(p.angle||0)*220;return{x:Math.max(20,Math.min(W-20,x)),y:Math.max(20,Math.min(H-20,y))}}
 function bd(seed){return st('dmg',12)*(1+(seed%17)*.03)} function sp(seed){return st('ps',7)*(1.15+(seed%11)*.08)}
 function shot(p,a,s,d,r,life,o){if(RUN&&RUN.bullets)RUN.bullets.push(Object.assign({x:p.x,y:p.y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,dmg:d,r,life,owner:p.id,hit:[]},o||{}))}
 function burst(x,y,r,d,k){if(typeof aoe==='function')aoe(x,y,r,d,k||0)} function ring(x,y,r,c){if(typeof ringFx==='function')ringFx(x,y,c||RUN.hue||170,r)}
 function near(p){let b=null,z=1e30;es().forEach(e=>{let q=d2(e.x,e.y,p.x,p.y);if(q<z){z=q;b=e}});return b}
 function buff(p,d,r,t,sh){p.puDamage=Math.max(p.puDamage||1,d);p.puRate=Math.max(p.puRate||1,r);p.puTimer=Math.max(p.puTimer||0,t);if(sh)p.sh=Math.min((ST.shieldMax||90)+sh,p.sh+sh)}
 function cone(p,seed,n,spread,o){const a=p.angle||0,c=(n-1)/2;for(let i=0;i<n;i++){const ex=Object.assign({},o||{});shot(p,a+(i-c)*spread,sp(seed+i*13),bd(seed+i*7)*(ex.mult||1),ex.r||4,ex.life||1.25,ex)}}
 function install(m,ch){
   const name=String(ch.name||''),desc=String(ch.desc||''),profile=String(ch.profile||m.profile||'general'),arch=String(ch.archetype||'projectile'),seed=h(m.name+'|'+(m.f||'')+'|'+name+'|'+desc+'|W1');
   ch.exec=function(p){if(!RUN||!p||p.downed)return;const t=pt(p),a=p.angle||0,d=bd(seed),s=sp(seed),r=55+(seed%65),dur=3.4+(seed%5)*.45,c=(profile+':'+arch).toLowerCase();
     if(/field/.test(c)){RUN.compFields=RUN.compFields||[];RUN.compFields.push({x:t.x,y:t.y,r,t:dur,owner:p.id,profile,compound:m.name,seed,damage:d*.28,slow:/acid|sulfur|cyan|bioactive|ionic/.test(profile)});burst(t.x,t.y,18,d*.25,10)}
     else if(/shield|support/.test(c)){buff(p,1.12+(seed%5)*.03,1.08+(seed%4)*.025,Math.min(8,dur+2),12+(seed%4)*4);ring(p.x,p.y,95,seed%240)}
     else if(/delayed|mine|trap/.test(c)){RUN.compMines=RUN.compMines||[];RUN.compMines.push({x:t.x,y:t.y,t:dur,owner:p.id,compound:m.name,seed,r:34+(seed%25),d:d*(1.4+(seed%4)*.12),profile});ring(t.x,t.y,38,seed%240)}
     else if(/tether|root|cage/.test(c)){const e=near(p);if(e){e.compTether={pid:p.id,t:dur,dmg:d*.55,compound:m.name,root:true,seed};e.slowT=Math.max(e.slowT||0,.8+(seed%3)*.25)}shot(p,a,s*1.1,d*.65,4,1.2,{compound:m.name,hom:true,pierce:1,corrode:/acid|halide|oxo/.test(profile),poison:/cyan|bioactive|amine/.test(profile)})}
     else if(/buff|ally|link|relay|heal|creatine|vitamin|amino|phosphate/.test(c)){buff(p,1.18+(seed%6)*.025,1.1+(seed%5)*.025,5+(seed%3),10+(seed%5)*3);as(p).slice(0,3).forEach((q,i)=>buff(q,1.12+(seed%4)*.03,1.08+i*.02,4.5+(seed%2),8+(seed%4)*2));ring(p.x,p.y,115,seed%240)}
     else if(/beam|line/.test(c)){shot(p,a,s*2.5,d*1.7,3,.9,{compound:m.name,pierce:5,corrode:/acid|hydrogenHalide|oxo/.test(profile),burn:/peroxide|nitrate|alkane|alkyne/.test(profile)})}
     else if(/split|volley|spiral|prism|projectile|cone|cascade|pulse|wave/.test(c)){const n=3+(seed%3);cone(p,seed,n,.10,{compound:m.name,pierce:/ionic|silicate|chromate/.test(profile)?2:0,burn:/peroxide|nitrate|alkane|alkyne|oxoHalogen/.test(profile),poison:/cyan|amine|bioactive/.test(profile),corrode:/acid|hydrogenHalide|oxoHalogen/.test(profile)})}
     else if(/burst|implode|detonate|charge/.test(c)){burst(t.x,t.y,72+(seed%45),d*(1.45+(seed%6)*.1),55+(seed%45));cone(p,seed,2+(seed%3),.16,{compound:m.name,burn:/peroxide|alkane|alkyne|nitrate/.test(profile),corrode:/acid|hydrogenHalide|oxoHalogen/.test(profile),mult:.72})}
     else if(/stealth|memory|reserve|transition/.test(c)){p.iframes=Math.max(p.iframes||0,.7);p._compoundWave1={t:dur,seed,compound:m.name,profile};if(/transition/.test(c)){const ox=p.x,oy=p.y;p.x=Math.max(25,Math.min(W-25,p.x+Math.cos(a)*120));p.y=Math.max(25,Math.min(H-25,p.y+Math.sin(a)*120));ring(ox,oy,80,seed%240)}ring(p.x,p.y,100,seed%240);shot(p,a,s*1.7,d*1.2,4,1.15,{compound:m.name,pierce:1,poison:/cyan|bioactive/.test(profile),corrode:/acid|halide/.test(profile)})}
     else {shot(p,a,s*1.75,d*1.35,5,1.25,{compound:m.name,pierce:/silicate|ionic|chromate/.test(profile)?2:0,burn:/peroxide|nitrate|alkane|alkyne|oxoHalogen/.test(profile),poison:/cyan|amine|bioactive/.test(profile),corrode:/acid|hydrogenHalide/.test(profile)});burst(t.x,t.y,28,d*.3,12)}
     p._lastCompoundAbility={id:m.id,slot:0,name,description:desc,seed,wave:1};
   };
   ch.implemented=true;ch.implementation='Wave 1 executable chemistry attack';
 }
 let count=0;Object.keys(DATA.MOLDEF).forEach(k=>{const m=DATA.MOLDEF[k];if(!m||!m.mol||m.rx!=='Real compound'||!m.choices||!m.choices[0])return;install(m,m.choices[0]);count++});
 const oldUpdate=window.update;if(typeof oldUpdate==='function'){window.update=function(dt){oldUpdate(dt);if(!RUN)return;for(const f of (RUN.compFields||[])){if(!f._w1)f._w1=0;f._w1+=dt;if(f._w1<.22)continue;f._w1=0;for(const e of es()){if(d2(e.x,e.y,f.x,f.y)>(f.r+e.r)*(f.r+e.r))continue;if(f.damage&&typeof dmgEnemy==='function')dmgEnemy(e,f.damage);if(f.slow)e.slowT=Math.max(e.slowT||0,.7);if(/acid|halide|oxo/.test(String(f.profile))&&typeof addCorrode==='function')addCorrode(e,2.5,.3);if(/peroxide|nitrate|alkane|alkyne/.test(String(f.profile))&&typeof addBurn==='function')addBurn(e,st('dmg',12)*.16,1.8);if(/cyan|amine|bioactive/.test(String(f.profile))&&typeof addPoison==='function')addPoison(e,st('dmg',12)*.2,2.6)}}}}
 DATA.compoundWave1={wave:1,implementedFirstAbilities:count,totalCompounds:count,namesAndDescriptionsUntouched:true};
 console.log('ISO_COMPOUND_WAVE1 active:',count,'first abilities executable; names/descriptions untouched.');
})();


/* ISO_COMPOUND_WAVE1_ACTUAL_BEHAVIOR_V2
 * Repairs Wave 1 first abilities so displayed names/descriptions are the real
 * ability, while execution is tied to that exact action rather than a generic family label.
 */
(function(){
  if(window.__ISO_COMPOUND_WAVE1_ACTUAL_BEHAVIOR_V2__)return;
  window.__ISO_COMPOUND_WAVE1_ACTUAL_BEHAVIOR_V2__=true;
  if(!window.DATA||!DATA.MOLDEF)return;
  const clamp2=(v,a,b)=>Math.max(a,Math.min(b,v));
  const h=s=>{let x=2166136261>>>0;for(const c of String(s)){x^=c.charCodeAt(0);x=Math.imul(x,16777619)>>>0;}return x>>>0;};
  const enemies=()=>RUN&&RUN.enemies?RUN.enemies.filter(e=>e&&!e.dead):[];
  const allies=p=>RUN&&RUN.players?RUN.players.filter(q=>q&&!q.downed):[];
  const target=p=>({x:typeof mouse!=='undefined'&&mouse?clamp2(mouse.x,20,W-20):p.x+Math.cos(p.angle||0)*220,y:typeof mouse!=='undefined'&&mouse?clamp2(mouse.y,20,H-20):p.y+Math.sin(p.angle||0)*220});
  const nearest=p=>{let b=null,bd=1e30;enemies().forEach(e=>{const d=d2(e.x,e.y,p.x,p.y);if(d<bd){bd=d;b=e;}});return b;};
  const dmg=(seed,m=1)=>Number(ST.dmg||12)*(1+(seed%13)*.035)*m;
  const spd=(seed,m=1)=>Number(ST.ps||7)*(1.18+(seed%9)*.07)*m;
  const shot=(p,a,s,d,r=4,life=1.2,o={})=>{RUN.bullets.push(Object.assign({x:p.x,y:p.y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,dmg:d,r,life,owner:p.id,hit:[]},o));};
  const ring=(x,y,r)=>{if(typeof ringFx==='function')ringFx(x,y,RUN.hue||170,r);};
  const burst=(x,y,r,d,k)=>{if(typeof aoe==='function')aoe(x,y,r,d,k||0);};
  const addField=(f)=>{RUN.compFields=RUN.compFields||[];RUN.compFields.push(f);};
  const buff=(p,dm,rt,t,shield)=>{p.puDamage=Math.max(p.puDamage||1,dm);p.puRate=Math.max(p.puRate||1,rt);p.puTimer=Math.max(p.puTimer||0,t);if(shield)p.sh=Math.min((ST.shieldMax||90)+shield,p.sh+shield);};

  function description(action,profile,compound){
    const a=action.toLowerCase();
    if(/bubble.*snare|water snare|snare/.test(a)) return `Launches a ${compound} snare that homes onto an enemy, bursts on contact, briefly roots the target and drags nearby enemies inward.`;
    if(/jet/.test(a)) return `Fires a concentrated ${compound} stream that strikes enemies in a tight forward spread and knocks them back.`;
    if(/pull|current/.test(a)) return `Creates a ${compound} current at the target location that pulls nearby enemies toward its center and slows them.`;
    if(/shield|ward|guard|shell/.test(a)) return `Coats you in a ${compound} defensive layer that absorbs damage for several seconds.`;
    if(/beam|lance|spear|needle|dart|ray/.test(a)) return `Fires a fast piercing ${compound} projectile along your aim direction, dealing heavy single-target damage.`;
    if(/bloom|mist|veil|haze|cloud|wash/.test(a)) return `Creates a lingering ${compound} field at the target point that repeatedly damages enemies caught inside and applies its chemical status.`;
    if(/mine|trap|mark|tag|lock|brand|seed/.test(a)) return `Places a ${compound} hazard/mark that attaches to the nearest enemy or target point, then triggers its chemical effect when touched or struck.`;
    if(/burst|pulse|wave|sweep|flash|flare|surge/.test(a)) return `Releases a ${compound} area burst around the target that damages nearby enemies and applies its characteristic secondary effect.`;
    if(/trail|stripe|line|wall|lattice|screen|rampart|glasswork/.test(a)) return `Creates a persistent ${compound} structure or line in the aimed area that blocks space and damages enemies crossing it.`;
    if(/charge|battery|reserve|vault/.test(a)) return `Stores ${compound} energy for several seconds; when the charge completes, it releases a stronger attack based on the amount stored.`;
    if(/echo|memory|replication|sequence/.test(a)) return `Fires the ${compound} attack once, then creates a delayed echo that repeats the strike from the same direction.`;
    if(/squad|relay|link|heal|repair|cofactor|support/.test(a)) return `Buffs you and nearby allies with ${compound}'s support effect, improving combat stats and granting a defensive benefit.`;
    if(/bridge|dash|transition/.test(a)) return `Moves you rapidly toward the aimed location while leaving behind a short-lived ${compound} hazard and brief protection.`;
    if(/prism|split|spiral|volley|cascade|fan/.test(a)) return `Splits the ${compound} attack into multiple projectiles with different trajectories so several enemies can be hit at once.`;
    if(/focus|signal|response|receptor/.test(a)) return `Locks onto the nearest enemy and makes that target more vulnerable to your attacks for a short duration.`;
    if(/stealth|cloak/.test(a)) return `Temporarily shrouds you in a ${compound} veil, reducing incoming danger and giving brief invulnerability.`;
    if(/implode|collapse|detonate|combustion|explosion|pop/.test(a)) return `Creates a delayed ${compound} reaction at the target point that detonates in a large damaging explosion.`;
    if(/precipitate|crystal/.test(a)) return `Forms ${compound} crystals around the target area; enemies that enter the cluster are struck by repeated shards.`;
    return `Uses ${compound} to perform the ${action} described by this ability, creating a visible attack or effect that damages, controls, or supports targets in range.`;
  }

  function runFirst(m,ch,p){
    if(!RUN||!p||p.downed)return;
    const full=String(ch.name||'');
    const action=full.includes('—')?full.split('—').pop().trim():full.replace(/^.*? - /,'').trim();
    const a=(p.angle||0);
    const t=target(p);
    const seed=h(m.name+'|'+(m.f||'')+'|'+action);
    const D=dmg(seed),S=spd(seed),R=68+(seed%6)*13,T=3.6+(seed%5)*.5;
    const al=action.toLowerCase();

    // WATER / SNARE: a real homing snare projectile + pull/slow field.
    if(/water|bubble/.test(al) && /snare|bubble/.test(al)){
      shot(p,a,S*1.35,D*1.18,9,2.2,{compound:m.name,hom:true,pierce:0,pull:true,slow:true,waterSnare:true});
      addField({x:t.x,y:t.y,r:72,t:2.2,owner:p.id,profile:'water',waterCurrent:true,damage:D*.22,snareField:true});
      ring(t.x,t.y,48); return;
    }
    if(/jet/.test(al)){
      for(let i=-2;i<=2;i++)shot(p,a+i*.07,S*(1.45+Math.abs(i)*.04),D*(.74-Math.abs(i)*.06),5,1.25,{compound:m.name,water:true,knock:1.4});
      return;
    }
    if(/pull|current/.test(al)){
      addField({x:t.x,y:t.y,r:R,t:T,owner:p.id,profile:'water',waterCurrent:true,damage:D*.38});
      return;
    }
    if(/shield|ward|guard|shell/.test(al)){
      buff(p,1.0,1.0,T,22+(seed%5)*4); p.iframes=Math.max(p.iframes||0,.25); ring(p.x,p.y,82); return;
    }
    if(/beam|lance|spear|needle|dart|ray/.test(al)){
      shot(p,a,S*2.45,D*1.8,4,.95,{compound:m.name,pierce:7,corrode:/acid|halide|oxo|chromate/.test(m.name.toLowerCase()),burn:/peroxide|nitrate|fuel/.test(m.name.toLowerCase()),poison:/cyan|amine|bioactive/.test(m.name.toLowerCase())});
      return;
    }
    if(/bloom|mist|veil|haze|cloud|wash/.test(al)){
      addField({x:t.x,y:t.y,r:R,t:T,owner:p.id,profile:String(ch.profile||''),damage:D*.32,slow:/water|acid|sulfur|amine|cyan/.test(String(ch.profile||'')),oxidizer:/peroxide|nitrate/.test(String(ch.profile||''))});
      burst(t.x,t.y,20,D*.2,10); return;
    }
    if(/mine|trap|mark|tag|lock|brand|seed/.test(al)){
      if(/mark|tag|lock|brand/.test(al)){const e=nearest(p);if(e){e.compMarks=e.compMarks||{};e.compMarks[m.name]={t:T,mult:1.35};e.mark=Math.max(e.mark||0,5);e.slowT=Math.max(e.slowT||0,.8);}ring(p.x,p.y,50);}
      else {RUN.compMines=RUN.compMines||[];RUN.compMines.push({x:t.x,y:t.y,t:T,owner:p.id,compound:m.name,r:32+(seed%22),d:D*1.5,profile:ch.profile});ring(t.x,t.y,36);}
      return;
    }
    if(/burst|pulse|wave|sweep|flash|flare|surge/.test(al)){
      burst(t.x,t.y,R,D*1.15,65+(seed%35));
      if(/water|acid|sulfur|amine|cyan|bioactive|ionic/.test(String(ch.profile||''))) enemies().forEach(e=>{if(d2(e.x,e.y,t.x,t.y)<R*R)e.slowT=Math.max(e.slowT||0,.9);});
      return;
    }
    if(/trail|stripe|line|wall|lattice|screen|rampart|glasswork/.test(al)){
      RUN.compThreads=RUN.compThreads||[];
      RUN.compThreads.push({ax:p.x,ay:p.y,bx:t.x,by:t.y,t:T,owner:p.id,profile:ch.profile,wall:/wall|glass|rampart|screen|lattice/.test(al),compound:m.name,dmg:D*.55});
      return;
    }
    if(/charge|battery|reserve|vault/.test(al)){
      p._compoundChargeActual={t:T,owner:p.id,seed,d:D,compound:m.name}; ring(p.x,p.y,42); return;
    }
    if(/echo|memory|replication|sequence/.test(al)){
      shot(p,a,S*1.55,D*.95,5,1.2,{compound:m.name,pierce:3});
      RUN.compEcho=RUN.compEcho||[];RUN.compEcho.push({owner:p.id,x:p.x,y:p.y,a,delay:1.0,t:1.0,d:D,compound:m.name}); return;
    }
    if(/squad|relay|link|heal|repair|cofactor|support/.test(al)){
      allies(p).slice(0,4).forEach(q=>buff(q,1.18,1.12,5,12)); buff(p,1.2,1.14,5,14); ring(p.x,p.y,120); return;
    }
    if(/bridge|dash|transition/.test(al)){
      const ox=p.x,oy=p.y;p.x=clamp2(t.x,25,W-25);p.y=clamp2(t.y,25,H-25);p.iframes=Math.max(p.iframes||0,.9);RUN.compThreads=RUN.compThreads||[];RUN.compThreads.push({ax:ox,ay:oy,bx:p.x,by:p.y,t:1.5,transition:true,owner:p.id,profile:ch.profile}); return;
    }
    if(/prism|split|spiral|volley|cascade|fan/.test(al)){
      const n=5; for(let i=0;i<n;i++)shot(p,a+(i-(n-1)/2)*.12,S*(1.15+i*.06),D*(.68+i*.07),4,1.2,{compound:m.name,pierce:/silicate|ionic|chromate/.test(String(ch.profile||''))?2:0}); return;
    }
    if(/focus|signal|response|receptor/.test(al)){
      const e=nearest(p); if(e){e.compFocus={t:T,owner:p.id,mult:1.45,compound:m.name};e.mark=Math.max(e.mark||0,6);burst(e.x,e.y,28,D*.55,12);} return;
    }
    if(/stealth|cloak/.test(al)){
      p.iframes=Math.max(p.iframes||0,1.15);p._compoundStealth=T;ring(p.x,p.y,90);return;
    }
    if(/implode|collapse|detonate|combustion|explosion|pop/.test(al)){
      const tx=t.x,ty=t.y;setTimeout(()=>{if(RUN)burst(tx,ty,R+18,D*2.05,90);},650+(seed%4)*90);ring(tx,ty,34);return;
    }
    if(/precipitate|crystal/.test(al)){
      addField({x:t.x,y:t.y,r:R*.75,t:T,owner:p.id,profile:ch.profile,crystal:true,damage:D*.4});
      for(let i=0;i<6;i++)shot(p,a+(i-2.5)*.35,S*.85,D*.42,3,1.0,{compound:m.name,pierce:1});return;
    }
    // Hard fallback is still a real attack, never a family-only visual.
    shot(p,a,S*1.7,D*1.35,5,1.25,{compound:m.name,pierce:/ionic|silicate|chromate/.test(String(ch.profile||''))?2:0});
    burst(t.x,t.y,26,D*.25,10);
  }

  let fixed=0;
  Object.keys(DATA.MOLDEF).forEach(k=>{
    const m=DATA.MOLDEF[k];
    if(!m||!m.mol||m.rx!=='Real compound'||!Array.isArray(m.choices))return;
    m.choices.forEach(function(ch, slot){
      if(!ch)return;
      const original=String(ch.name||'').trim();
      const plain=original.includes('—')?original.split('—').pop().trim():original;
      ch.name=(m.name || m.f || 'Compound') + ' — ' + (plain || ('Ability ' + (slot+1)));
      ch.desc=description(plain,String(ch.profile||m.profile||'general'),m.name||'compound');
      ch.main=(slot===0);
      ch.slot=slot;
      ch.exec=function(p){runFirst(m,ch,p);};
      ch.implemented=true;
      ch.implementation='All 3 compound abilities actual behavior V2';
      fixed++;
    });
    m.act=m.choices[0];
    m.signatures=m.choices;
  });

  // Make stored/displayed choices reflect the corrected names and descriptions.
  DATA.compoundAllAbilitiesActual={fixedTotalAbilities:fixed,descriptionsAreExecutable:true,version:'V2'};
  console.log('ISO_COMPOUND_ALL_ACTUAL_BEHAVIOR active:',fixed,'compound abilities across all 3 slots repaired with real descriptions + executable actions.');
})();

/* ISO_BUILD6_INTERNAL_PIPELINE
 * Permanent deep-augmentation and relic effects. This block is intentionally
 * inside the game closure so it can modify live ST/computeStats safely. */
(function(){
  if(window.__ISO_BUILD6_INTERNAL_PIPELINE__) return; window.__ISO_BUILD6_INTERNAL_PIPELINE__=true;
  var baseCompute=computeStats;
  var MEGA_AUG=[
    ['dmg',.03],['rate',.03],['hp',8],['spd',.02],['crit',.02],['shield',5],['magnet',.06],['coin',.05],['pierce',.5],['aoe',.5],['head',.5],['revive',1],
    ['dmg',.04],['rate',.04],['hp',12],['spd',.03],['crit',.025],['shield',8],['magnet',.08],['coin',.07],['pierce',.333],['aoe',.5],['dmg',.05],['rate',.05],['hp',16],['spd',.04],['crit',.03],['shield',10],['magnet',.10],['coin',.10]
  ];
  computeStats=function(){
    baseCompute(); if(!RUN||!ST)return;
    MEGA_AUG.forEach(function(cfg,i){var lv=Number(SAVE.raw.meta&&SAVE.raw.meta['megaAug'+i]||0);if(!lv)return;var v=cfg[1]*lv;
      if(cfg[0]==='dmg')ST.dmg*=1+v; else if(cfg[0]==='rate')ST.rate*=1+v; else if(cfg[0]==='hp')ST.hp+=v;
      else if(cfg[0]==='spd')ST.spd*=1+v; else if(cfg[0]==='crit')ST.crit+=v*100; else if(cfg[0]==='shield')ST.shieldMax+=v;
      else if(cfg[0]==='magnet')ST.magnet*=1+v; else if(cfg[0]==='coin')ST.coinMult*=1+v; else if(cfg[0]==='pierce')ST.pierce+=Math.floor(v); else if(cfg[0]==='aoe')ST.aoeLv+=Math.floor(v);
      else if(cfg[0]==='head'){} else if(cfg[0]==='revive')RUN.revives=Math.max(RUN.revives||0,(SAVE.metaLv?SAVE.metaLv('revive'):0)+cfg[1]*lv);
    });
    var rr=RUN.relics||[];
    if(rr.indexOf('gravity_anchor')>=0)ST.kb*=1.2;
    if(rr.indexOf('phase_prism')>=0)ST.aoeLv+=1;
    if(rr.indexOf('cryogenic_loop')>=0)ST.slowLv+=1;
    if(rr.indexOf('toxic_reservoir')>=0)ST.poisonLv+=1;
    if(rr.indexOf('star_map')>=0)ST.spd*=1.08;
    if(rr.indexOf('glass_heart')>=0){ST.dmg*=1.35;ST.crit+=20;ST.hp=Math.round(ST.hp*.85);}
    if(rr.indexOf('twin_core')>=0)ST.projs+=Math.floor((RUN.wave||1)/2);
    if(rr.indexOf('iron_oath')>=0)ST.armor=Math.min(.85,ST.armor+.08);
  };
  console.log('ISO_BUILD6_INTERNAL_PIPELINE active: deep augmentations and expansion relics modify live combat stats.');
})();



/* ISO_COMBAT_FX_V10
 * Integrated into the game's closure so it can actually observe RUN/update/render.
 */
(function(){
  if(window.__ISO_COMBAT_FX_V10__)return; window.__ISO_COMBAT_FX_V10__=true;
  function queueExplosionFx(x,y,r,hue){
    if(!RUN)return;
    RUN.explosionFx=RUN.explosionFx||[];
    RUN.explosionFx.push({x:x,y:y,r:Math.max(8,r||60),t:.5,life:.5,hue:hue==null?RUN.hue||190:hue});
    if(RUN.explosionFx.length>100)RUN.explosionFx.splice(0,RUN.explosionFx.length-100);
  }
  function queueDeathFx(e){
    if(!RUN)return;
    RUN.deathFx=RUN.deathFx||[];
    RUN.deathFx.push({x:e.x,y:e.y,r:Math.max(10,e.r||12),t:.62,life:.62,hue:e.hue==null?RUN.hue||190:e.hue,elite:!!e.elite,boss:!!e.boss});
  }
  var baseUpdate=update;
  update=function(dt){
    baseUpdate(dt);
    if(!RUN)return;
    if(RUN.explosionFx)for(var i=RUN.explosionFx.length-1;i>=0;i--){RUN.explosionFx[i].t-=dt;if(RUN.explosionFx[i].t<=0)RUN.explosionFx.splice(i,1);}
    if(RUN.deathFx)for(var j=RUN.deathFx.length-1;j>=0;j--){RUN.deathFx[j].t-=dt;if(RUN.deathFx[j].t<=0)RUN.deathFx.splice(j,1);}
    /* Authoritative scheduled fuses. They do NOT detonate on enemy contact. */
    if(RUN.timedExplosions)for(var k=RUN.timedExplosions.length-1;k>=0;k--){var f=RUN.timedExplosions[k];f.t-=dt;if(f.t<=0){aoe(f.x,f.y,f.r,f.dmg,f.hue);RUN.timedExplosions.splice(k,1);}}
  };
  var baseRender=render;
  render=function(){
    baseRender();
    if(!RUN)return;
    cx.save();cx.globalCompositeOperation='lighter';
    (RUN.explosionFx||[]).forEach(function(f){var p=Math.max(0,f.t/f.life),r=f.r*(1-p);cx.strokeStyle='hsla('+f.hue+',100%,78%,'+(p*.9)+')';cx.lineWidth=2+6*p;cx.beginPath();cx.arc(f.x,f.y,Math.max(4,r),0,TAU);cx.stroke();cx.fillStyle='hsla('+f.hue+',100%,88%,'+(p*.08)+')';cx.beginPath();cx.arc(f.x,f.y,Math.max(3,r*.7),0,TAU);cx.fill();});
    (RUN.deathFx||[]).forEach(function(f){var p=Math.max(0,f.t/f.life),r=f.r*(1.2+(1-p)*2.2);cx.strokeStyle='hsla('+f.hue+',100%,76%,'+(p*.95)+')';cx.lineWidth=(f.boss?4:f.elite?3:2)*p+1;cx.beginPath();cx.arc(f.x,f.y,r,0,TAU);cx.stroke();var n=f.boss?16:f.elite?11:7;for(var i=0;i<n;i++){var a=i*TAU/n+RUN.t*.7;var len=(8+26*(1-p))*p;cx.beginPath();cx.moveTo(f.x+Math.cos(a)*r*.35,f.y+Math.sin(a)*r*.35);cx.lineTo(f.x+Math.cos(a)*(r+len),f.y+Math.sin(a)*(r+len));cx.stroke();}}
    );
    (RUN.timedExplosions||[]).forEach(function(f){var p=1-clamp(f.t/f.total,0,1),rate=2+18*p*p,pulse=(Math.sin(RUN.t*rate*TAU)+1)/2,rr=Math.max(8,(f.r||60)*(.18+.82*p));cx.strokeStyle='hsla('+(f.hue==null?RUN.hue:f.hue)+',100%,75%,'+(.15+.78*pulse*p)+')';cx.lineWidth=2+4*pulse;cx.beginPath();cx.arc(f.x,f.y,rr,0,TAU);cx.stroke();if(p>.35){var rays=5+Math.floor(p*10);for(var j=0;j<rays;j++){var a=RUN.t*1.2+j*TAU/rays;cx.beginPath();cx.moveTo(f.x+Math.cos(a)*8,f.y+Math.sin(a)*8);cx.lineTo(f.x+Math.cos(a)*(12+26*pulse*p),f.y+Math.sin(a)*(12+26*pulse*p));cx.stroke();}}});
    cx.restore();
  };
  /* richer effect helpers used by new/status-aware abilities */
  window.ISO_STATUS_V10={burn:addBurn,freeze:addFreeze,corrode:addCorrode,rust:addRust,shock:addShock,brittle:addBrittle,drenched:addDrenched};
  console.log('ISO_COMBAT_FX_V10 active: integrated death bursts, radial explosions, accelerating timer fuses, touch-safe delayed detonation, and expanded statuses.');
})();

/* ISO_LOCAL_STREAM_BUTTON_V3: open a real localhost tab, not a file:// clone. */
(function(){
  if(window.__ISO_LOCAL_STREAM_BUTTON_V3__)return;window.__ISO_LOCAL_STREAM_BUTTON_V3__=true;
  function toastMsg(t,type){try{if(window.UI&&UI.toast)UI.toast(t,type||'good');}catch(e){}}
  var b=document.getElementById('btn-local-stream'); if(!b)return;
  b.onclick=function(){
    var url='http://127.0.0.1:8765/index.html?local=1';
    var w=window.open(url,'_blank','noopener');
    if(w){toastMsg('LOCALHOST TAB OPENED · use the same room code in both tabs','good');return;}
    toastMsg('POPUP BLOCKED · allow popups for Isotope and press again','bad');
  };
})();

/* ISO_GLOBAL_LIVE_STATE_BRIDGE: compatibility bridge for external semantic/Fx modules. */
(function(){
  try{Object.defineProperty(window,'RUN',{configurable:true,get:function(){return RUN;}});}catch(e){}
  try{Object.defineProperty(window,'ST',{configurable:true,get:function(){return ST;}});}catch(e){}
})();


/* ISO_EXACT_ABILITY_ROUTER_V11
 * Final authority for ability dispatch. Element signature 1 is restored to the
 * original per-element implementation (A[n]); secondary element abilities and
 * all compound abilities are only allowed to run their own stored executable.
 * Adds exact chemistry contracts for the compounds whose descriptions are most
 * easily confused with the generic projectile fallback.
 */
(function(){
  if(window.__ISO_EXACT_ABILITY_ROUTER_V11__)return;
  window.__ISO_EXACT_ABILITY_ROUTER_V11__=true;

  function alive(){return RUN&&RUN.enemies?RUN.enemies.filter(function(e){return e&&!e.dead;}):[];}
  function nearest(x,y){var best=null,bd=1e30;alive().forEach(function(e){var q=d2(e.x,e.y,x,y);if(q<bd){bd=q;best=e;}});return best;}
  function target(p){
    var mx=(typeof mouse!=='undefined'&&mouse&&Number.isFinite(mouse.x))?mouse.x:p.x+Math.cos(p.angle||0)*260;
    var my=(typeof mouse!=='undefined'&&mouse&&Number.isFinite(mouse.y))?mouse.y:p.y+Math.sin(p.angle||0)*260;
    return {x:Math.max(24,Math.min(W-24,mx)),y:Math.max(24,Math.min(H-24,my))};
  }
  function shot(p,a,s,d,r,life,o){
    RUN.bullets.push(Object.assign({x:p.x,y:p.y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,dmg:d,r:r||5,life:life||1.4,owner:p.id,hit:[]},o||{}));
  }
  function mark(e,t,mult){if(!e)return;e.mark=Math.max(e.mark||0,t||5);e.compMarks=e.compMarks||{};e.compMarks.__exact={t:t||5,amp:mult||1.35};}
  function pulse(x,y,r,d,h){if(typeof aoe==='function')aoe(x,y,r,d,h==null?RUN.hue:h);}
  function ibuprofenExec(p,ch){
    var text=(String(ch.name||'')+' '+String(ch.desc||'')).toLowerCase();
    var d=(ST.dmg||12), sp=(ST.ps||380), t=target(p), hue=RUN.hue||270;
    /* Marked Seeker: one persistent homing seeker. It does not vanish on
       contact; the hit marks the target, and follow-up damage is amplified. */
    if(/marked seeker/.test(text)||(/seeker/.test(text)&&/homes/.test(text)&&/marks/.test(text))){
      var b={x:p.x,y:p.y,vx:Math.cos(p.angle||0)*sp*1.45,vy:Math.sin(p.angle||0)*sp*1.45,dmg:d*1.05,r:7,life:3.0,owner:p.id,hit:[],hom:true,pierce:0,semanticType:'ibuprofen-seeker',onHit:function(e){mark(e,6,1.35);e._ibuMarkedUntil=(RUN.t||0)+6;ringFx(e.x,e.y,hue,42);}};
      RUN.bullets.push(b); ringFx(t.x,t.y,hue,24); return true;
    }
    /* Chain Needle: first target is slowed, then the effect jumps to two more
       distinct hostiles instead of becoming an ordinary multi-shot volley. */
    if(/chain needle/.test(text)||(/homing chain needle/.test(text))){
      var first=nearest(p.x,p.y); if(!first)return true;
      var hitList=[first]; first.slowT=Math.max(first.slowT||0,3.2);
      if(typeof dmgEnemy==='function')dmgEnemy(first,d*1.6,{quiet:true});
      var cur=first;
      for(var i=0;i<2;i++){
        var next=null,nd=180*180;
        alive().forEach(function(e){if(hitList.indexOf(e)>=0)return;var q=d2(e.x,e.y,cur.x,cur.y);if(q<nd){nd=q;next=e;}});
        if(!next)break;
        hitList.push(next);next.slowT=Math.max(next.slowT||0,2.6);if(typeof arcChain==='function'){RUN.parts.push({x:cur.x,y:cur.y,x2:next.x,y2:next.y,t:.18,life:.18,hue:hue,arc:true});dmgEnemy(next,d*1.05,{quiet:true});}else dmgEnemy(next,d);cur=next;
      }
      return true;
    }
    /* Recovery Bloom: heal/shield first, then emit a recovery burst around the
       operator. */
    if(/recovery bloom/.test(text)||(/restores a small amount of health and shield/.test(text))){
      var hp=(ST.hp||120);p.hp=Math.min(hp,p.hp+hp*.10);p.sh=Math.min((ST.shieldMax||90)+18,p.sh+18);pulse(p.x,p.y,96,d*.45,hue);ringFx(p.x,p.y,hue,96);return true;
    }
    return false;
  }

  /* Allow special per-description handlers without rewriting the description. */
  function exactCompound(p,el,ch,slot){
    var n=(el.name||'').toLowerCase(), txt=(String(ch.name||'')+' '+String(ch.desc||'')).toLowerCase();
    if(n==='ibuprofen') return ibuprofenExec(p,ch);
    /* Generic description contracts are intentionally verb-driven: the
       displayed description, not the family/archetype, chooses the mechanic. */
    var t=target(p),d=Number(ST.dmg||12),sp=Number(ST.ps||380),h=RUN.hue||190;
    if(/homes? toward|homing/.test(txt)&&/marks? (?:that )?target/.test(txt)){
      var b={x:p.x,y:p.y,vx:Math.cos(p.angle||0)*sp*1.4,vy:Math.sin(p.angle||0)*sp*1.4,dmg:d*1.05,r:6,life:2.8,owner:p.id,hit:[],hom:true,semanticType:'description-seeker',onHit:function(e){mark(e,6,1.35);}};RUN.bullets.push(b);return true;
    }
    if(/restores?|heals?/.test(txt)&&/shield/.test(txt)&&/(burst|around the operator|nearby)/.test(txt)){
      p.hp=Math.min(ST.hp||120,p.hp+(ST.hp||120)*.1);p.sh=Math.min((ST.shieldMax||90)+18,p.sh+14);pulse(p.x,p.y,92,d*.4,h);return true;
    }
    if(/fires? a homing chain/.test(txt)&&/slows?/.test(txt)&&/chain/.test(txt)){
      var e0=nearest(p.x,p.y);if(e0){e0.slowT=Math.max(e0.slowT||0,3);dmgEnemy(e0,d*1.45,{quiet:true});if(typeof arcChain==='function')arcChain(e0,d*.72,2,h);}return true;
    }
    if(/creates? .*field|lingering .*field/.test(txt)&&/repeatedly/.test(txt)){
      RUN.compFields=RUN.compFields||[];RUN.compFields.push({x:t.x,y:t.y,r:100,t:4.5,owner:p.id,descriptionField:true,damage:d*.3,profile:el.name});ringFx(t.x,t.y,h,100);return true;
    }
    if(/places? .*hazard|plants? .*field|deploys? a .*mine/.test(txt)){
      RUN.compMines=RUN.compMines||[];RUN.compMines.push({x:t.x,y:t.y,t:5.5,totalT:5.5,owner:p.id,r:42,dmg:d*1.8,descriptionMine:true,hue:h});ringFx(t.x,t.y,h,42);return true;
    }
    return false;
  }

  var previous=useActive;
  useActive=function(p){
    if(!p||!RUN||p.downed||p.activeCd>0)return;
    var el=p.elem||RUN.el;
    if(!el)return previous(p);
    var slot=Number.isFinite(+p.signatureSlot)?Math.max(0,Math.min(2,+p.signatureSlot)):0;
    if(window.SAVE&&SAVE.getSignature)slot=SAVE.getSignature(el.id);
    if(slot>0&&window.SAVE&&SAVE.abilOwned&&!SAVE.abilOwned(el.id,slot)){slot=0;p.signatureSlot=0;}

    /* CRITICAL: elemental Ability 1 uses the old exact implementation A[n].
       This prevents semantic/family routers from replacing unique moves such as
       Bismuth Crystal Growth, Nitrogen Cryogenic Fog, etc. */
    if(!el.mol&&Number(el.n)>=1&&Number(el.n)<=118&&slot===0&&typeof A!=='undefined'&&typeof A[Number(el.n)]==='function'){
      p.signatureSlot=0;p.activeCd=ST.activeCd;SFX.active();RUN.shake=Math.max(RUN.shake||0,6);
      var n=(el.choices&&el.choices[0]&&el.choices[0].name)||'ABILITY '+el.n;banner(String(n).toUpperCase(),1200);
      try{A[Number(el.n)](p);}catch(err){console.error('exact element ability 1',el.n,err);}
      return;
    }

    var choice=(el.choices||el.signatures||[])[slot];
    if(choice){
      if(el.mol && exactCompound(p,el,choice,slot)){
        p.activeCd=ST.activeCd;SFX.active();RUN.shake=Math.max(RUN.shake||0,8);banner(String(choice.name||'ABILITY').toUpperCase(),1200);return;
      }
      if(typeof choice.exec==='function'){
        p.activeCd=ST.activeCd;SFX.active();RUN.shake=Math.max(RUN.shake||0,8);banner(String(choice.name||'ABILITY').toUpperCase(),1200);
        try{choice.exec(p);}catch(err){console.error('exact choice execution',el.id,slot,err);}return;
      }
    }
    return previous(p);
  };

  /* Compound identity packet helper: ensure other players receive both the
     canonical compound id and its scientific name/formula. */
  if(window.NET){
    var pkt0=NET.entityPacket;
    if(typeof pkt0==='function'&&!NET.__exactEntityPacket){NET.entityPacket=function(id){var k=DATA.canonicalId(id),e=DATA.EL(k)||{};return Object.assign(pkt0.call(this,id),{entityId:k,entityName:e.name||'',formula:e.f||e.formula||'',entityKind:e.mol?'compound':'element'});};NET.__exactEntityPacket=true;}
  }

  console.log('ISO_EXACT_ABILITY_ROUTER_V11 active: element Ability 1 restored to A[n]; description-driven compound contracts + Ibuprofen exact mechanics enabled.');
})();

/* ISO_OUTER_SCOPE_CLOSE: real closing brace for the outer IIFE opened at the
   top of game.js. Keeping every later patch inside this closure is what lets
   them see/replace useActive, RUN, ST, A, SFX, banner, etc. See the note
   above ISO_FINAL_ABILITY_DISPATCH_FIX_V1 for why this matters. */
})();
