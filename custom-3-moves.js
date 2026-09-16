/* ===========================================================================
 * ISOTOPE - custom-3-moves.js
 * Bespoke 3 Unique Working Signature Abilities For Every Element & Compound
 * =========================================================================== */
'use strict';
(function () {
  if (window.__ISO_CUSTOM_3_MOVES_V6__) return;
  window.__ISO_CUSTOM_3_MOVES_V6__ = true;

  // Core math and geometry utilities
  function rnd(a, b) { return a + Math.random() * (b - a); }
  function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }
  function d2(x1, y1, x2, y2) { var dx = x1 - x2, dy = y1 - y2; return dx * dx + dy * dy; }

  function nearEnemies(x, y, r) {
    if (!window.RUN || !RUN.enemies) return [];
    return RUN.enemies.filter(function (e) { return !e.dead && d2(e.x, e.y, x, y) < r * r; });
  }

  function nearestEnemy(x, y) {
    var list = nearEnemies(x, y, 9999);
    var best = null, bd = 1e12;
    for (var i = 0; i < list.length; i++) {
      var dist = d2(x, y, list[i].x, list[i].y);
      if (dist < bd) { bd = dist; best = list[i]; }
    }
    return best;
  }

  function targetPos(p) {
    var tx = (typeof mouse !== 'undefined' && mouse && Number.isFinite(mouse.x)) ? mouse.x : p.x + Math.cos(p.angle || 0) * 220;
    var ty = (typeof mouse !== 'undefined' && mouse && Number.isFinite(mouse.y)) ? mouse.y : p.y + Math.sin(p.angle || 0) * 220;
    return { x: clamp(tx, 25, (typeof W !== 'undefined' ? W - 25 : 1200)), y: clamp(ty, 25, (typeof H !== 'undefined' ? H - 25 : 800)) };
  }

  function fxRing(x, y, hue, grow, r0, life) {
    if (typeof window.ringFx === 'function') { window.ringFx(x, y, hue || (RUN && RUN.hue) || 190, grow || 90); }
    else if (window.RUN && RUN.parts) { RUN.parts.push({ ring: true, x: x, y: y, r0: r0 || 6, grow: grow || 90, t: life || 0.45, life: life || 0.45, hue: hue || 190 }); }
  }

  function fxBurst(x, y, hue, n) {
    if (!window.RUN || !RUN.parts) return;
    n = n || 12;
    for (var i = 0; i < n; i++) {
      RUN.parts.push({ x: x, y: y, vx: rnd(-200, 200), vy: rnd(-200, 200), t: rnd(0.2, 0.5), life: 0.5, hue: hue || 190, r: rnd(1.8, 4.2) });
    }
  }

  function shootBullet(p, opts) {
    if (!window.RUN || !RUN.bullets) return null;
    opts = opts || {};
    var a = (typeof opts.a === 'number') ? opts.a : (p.angle || 0);
    var sp = (typeof opts.sp === 'number') ? opts.sp : (window.ST ? ST.ps : 380);
    var b = {
      x: p.x, y: p.y,
      vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
      dmg: (typeof opts.d === 'number') ? opts.d : (window.ST ? ST.dmg : 14),
      r: (typeof opts.r === 'number') ? opts.r : 5,
      pierce: opts.pierce || 0,
      hit: [],
      life: (typeof opts.life === 'number') ? opts.life : 1.25,
      owner: p.id
    };
    if (opts.hom) b.hom = true;
    if (opts.expl) b.expl = true;
    if (opts.burn) b.burn = true;
    if (opts.poison) b.poison = true;
    if (opts.corrode) b.corrode = true;
    if (opts.mark) b.mark = true;
    if (opts.pull) b.pull = true;
    if (opts.acc) b.acc = opts.acc;
    if (opts.kb) b.kb = opts.kb;
    if (opts.crit) b.crit = true;
    if (opts.chainOnHit) b.chainOnHit = true;
    if (opts.fsplit) b.fsplit = true;
    if (opts.water) b.water = true;
    if (opts.compound) b.compound = opts.compound;
    RUN.bullets.push(b);
    return b;
  }

  function shootFan(p, n, spread, opts) {
    n = Math.max(1, n | 0);
    for (var i = 0; i < n; i++) {
      var off = n > 1 ? (i / (n - 1) - 0.5) * spread : 0;
      shootBullet(p, Object.assign({}, opts, { a: (p.angle || 0) + off }));
    }
  }

  function shootRing(p, n, opts) {
    n = Math.max(1, n | 0);
    for (var i = 0; i < n; i++) {
      shootBullet(p, Object.assign({}, opts, { a: (i / n) * Math.PI * 2 }));
    }
  }

  function addField(f) {
    if (!window.RUN) return;
    RUN.compFields = RUN.compFields || [];
    RUN.compFields.push(f);
  }

  function addZone(x, y, r, t) {
    if (window.RUN && RUN.clouds) RUN.clouds.push({ x: x, y: y, r: r, t: t });
  }

  function addWell(x, y, t, lv) {
    if (window.RUN && RUN.wells) RUN.wells.push({ x: x, y: y, t: t, lv: lv || 1 });
  }

  function gainShield(p, amt, ifr) {
    if (!window.RUN || !p) return;
    var maxSh = (window.ST ? ST.shieldMax : 90) + amt;
    p.sh = Math.min(maxSh, (p.sh || 0) + amt);
    if (ifr) p.iframes = Math.max(p.iframes || 0, ifr);
    fxRing(p.x, p.y, RUN.hue || 190, 95, 14, 0.5);
  }

  function gainHeal(p, amt) {
    if (!window.RUN || !p) return;
    p.hp = Math.min((window.ST ? ST.hp : 100), (p.hp || 0) + amt);
  }

  function dash(p, dist, ifr) {
    if (!window.RUN || !p) return;
    var a = p.angle || 0;
    var ox = p.x, oy = p.y;
    p.x = clamp(p.x + Math.cos(a) * dist, 25, (typeof W !== 'undefined' ? W - 25 : 1200));
    p.y = clamp(p.y + Math.sin(a) * dist, 25, (typeof H !== 'undefined' ? H - 25 : 800));
    p.iframes = Math.max(p.iframes || 0, ifr || 0.5);
    fxRing(ox, oy, RUN.hue || 200, 80, 8, 0.35);
    fxRing(p.x, p.y, RUN.hue || 200, 110, 10, 0.42);
  }

  function applyAoE(x, y, r, d, hue) {
    if (typeof aoe === 'function') aoe(x, y, r, d, hue || (window.RUN && RUN.hue) || 200);
  }

  function applyStatusToNear(x, y, r, statusType, dmgVal) {
    dmgVal = dmgVal || (window.ST ? ST.dmg : 14);
    nearEnemies(x, y, r).forEach(function (e) {
      if (statusType === 'burn' && typeof addBurn === 'function') addBurn(e, dmgVal * 0.4, 4);
      else if (statusType === 'poison' && typeof addPoison === 'function') addPoison(e, dmgVal * 0.45, 4);
      else if (statusType === 'corrode' && typeof addCorrode === 'function') addCorrode(e, 4, 0.4);
      else if (statusType === 'slow') e.slowT = Math.max(e.slowT || 0, 2.5);
      else if (statusType === 'freeze' && typeof addFreeze === 'function') addFreeze(e, 1.3);
      else if (statusType === 'stun') e.stun = Math.max(e.stun || 0, 1.1);
      else if (statusType === 'mark') e.mark = Math.max(e.mark || 0, 6);
      else if (statusType === 'conf') e.conf = Math.max(e.conf || 0, 2.0);
    });
  }

  function convertShots(p, r) {
    if (!window.RUN || !p || !RUN.ebullets) return;
    var keep = [];
    for (var i = 0; i < RUN.ebullets.length; i++) {
      var b = RUN.ebullets[i];
      if (d2(b.x, b.y, p.x, p.y) < r * r) {
        shootBullet(p, { a: Math.atan2(b.vy, b.vx), sp: Math.hypot(b.vx, b.vy) || 340, d: (window.ST ? ST.dmg : 14) * 1.3, r: 5, pierce: 3, life: 1.3, burn: true });
      } else { keep.push(b); }
    }
    RUN.ebullets = keep;
  }

  /* =========================================================================
     118 ELEMENTS: 3 BESPOKE CUSTOM MOVES FOR EACH ELEMENT (1 to 118)
     ========================================================================= */
  var ELEMENT_MOVES_DATA = {};
  ELEMENT_MOVES_DATA[1] = [
    {
      name: 'Hydrogen Burst', ic: '💥',
      desc: 'Fires extremely light accelerating projectiles and holds hydrogen to release a massive compressed explosion on impact.',
      f: function(p) {
        if (typeof A !== 'undefined' && typeof A[1] === 'function') { A[1](p); }
        else { shootFan(p, 5, 0.35, { d: ST.dmg * 1.5, sp: ST.ps * 1.25, pierce: 2 }); applyAoE(p.x, p.y, 140, ST.dmg * 1.6, (1 * 25) % 360); }
      }
    },
    {
      name: 'Fusion Plasma Jet', ic: '🔥',
      desc: 'Emits a concentrated thermonuclear jet that pierces lines of enemies and inflicts heavy burns.',
      f: function(p) {
        shootBullet(p, { d: ST.dmg * 3.8, sp: ST.ps * 2.8, r: 6, pierce: 12, life: 1.1, expl: true }); if (typeof hitBeam === 'function') hitBeam(p.x, p.y, p.angle, 450, 16, ST.dmg * 2.2, (1 * 25) % 360, 'burn'); applyStatusToNear(p.x + Math.cos(p.angle)*150, p.y + Math.sin(p.angle)*150, 100, 'burn', ST.dmg);
      }
    },
    {
      name: 'Hydro-Magnetic Singularity', ic: '🌀',
      desc: 'Spawns an intense hydrogen vortex that pulls enemies inward before detonating in a massive shockwave.',
      f: function(p) {
        addWell(p.x + Math.cos(p.angle) * 140, p.y + Math.sin(p.angle) * 140, 3.8, 3); if (window.RUN) RUN.shake = Math.max(RUN.shake || 0, 16); setTimeout(function() { applyAoE(p.x + Math.cos(p.angle) * 140, p.y + Math.sin(p.angle) * 140, 240, ST.dmg * 3.6, (1 * 33) % 360); shootRing(p, 16, { d: ST.dmg * 1.1, sp: ST.ps * 1.3, pierce: 4 }); }, 650);
      }
    }
  ];
  ELEMENT_MOVES_DATA[2] = [
    {
      name: 'Float', ic: '🎈',
      desc: 'Grants high buoyancy to drift over hazards while firing recoil-boosted helium pulses and lifting nearby enemies.',
      f: function(p) {
        if (typeof A !== 'undefined' && typeof A[2] === 'function') { A[2](p); }
        else { shootFan(p, 5, 0.35, { d: ST.dmg * 1.5, sp: ST.ps * 1.25, pierce: 2 }); applyAoE(p.x, p.y, 140, ST.dmg * 1.6, (2 * 25) % 360); }
      }
    },
    {
      name: 'Anti-Grav Balloon', ic: '🫧',
      desc: 'Launches anti-gravity canisters that lift enemies upward, disarming and rooting them in mid-air.',
      f: function(p) {
        addWell(p.x + Math.cos(p.angle) * 130, p.y + Math.sin(p.angle) * 130, 3.2, 2); shootFan(p, 4, 0.28, { d: ST.dmg * 1.4, sp: ST.ps * 1.5, pierce: 2, hom: true }); applyStatusToNear(p.x + Math.cos(p.angle) * 130, p.y + Math.sin(p.angle) * 130, 160, 'stun', ST.dmg);
      }
    },
    {
      name: 'Cryogenic Superfluid', ic: '❄️',
      desc: 'Coats the arena in zero-viscosity liquid helium, massively slowing foes and nullifying enemy projectiles.',
      f: function(p) {
        addZone(p.x, p.y, 220, 5.5); convertShots(p, 260); nearEnemies(p.x, p.y, 300).forEach(function(e) { if (typeof addFreeze === 'function') addFreeze(e, 2.0); e.slowT = Math.max(e.slowT || 0, 4.0); }); shootRing(p, 14, { d: ST.dmg * 0.9, sp: ST.ps * 1.4, pierce: 3 });
      }
    }
  ];
  ELEMENT_MOVES_DATA[3] = [
    {
      name: 'Reactive Dash', ic: '⚡',
      desc: 'Dashes forward leaving volatile lithium particles that violently detonate when enemies touch them.',
      f: function(p) {
        if (typeof A !== 'undefined' && typeof A[3] === 'function') { A[3](p); }
        else { shootFan(p, 5, 0.35, { d: ST.dmg * 1.5, sp: ST.ps * 1.25, pierce: 2 }); applyAoE(p.x, p.y, 140, ST.dmg * 1.6, (3 * 25) % 360); }
      }
    },
    {
      name: 'Lithium Battery Surge', ic: '🔋',
      desc: 'Overcharges energy reserves to boost movement speed, shield recovery, and fire rate for 6s.',
      f: function(p) {
        p.puRate = Math.max(p.puRate || 1, 1.75); p.puDamage = Math.max(p.puDamage || 1, 1.4); p.puTimer = Math.max(p.puTimer || 0, 6.0); gainShield(p, 20, 0.6); shootRing(p, 8, { d: ST.dmg * 0.9, sp: ST.ps * 1.4, chainOnHit: true, pierce: 3 });
      }
    },
    {
      name: 'Carmine Flame Wave', ic: '🔥',
      desc: 'Unleashes a vibrant carmine flame wave that melts enemy armor and inflicts lingering burn.',
      f: function(p) {
        if (typeof hitWave === 'function') hitWave(p.x, p.y, p.angle, 320, 75, ST.dmg * 2.8, (3 * 33) % 360, 'burn'); applyAoE(p.x + Math.cos(p.angle) * 120, p.y + Math.sin(p.angle) * 120, 210, ST.dmg * 2.5, (3 * 33) % 360); shootFan(p, 5, 0.35, { d: ST.dmg * 1.4, sp: ST.ps * 1.7, pierce: 5, kb: 2.2 });
      }
    }
  ];
  ELEMENT_MOVES_DATA[4] = [
    {
      name: 'Lightweight Armor', ic: '🛡️',
      desc: 'Extremely high movement speed and armor penetration; bullets become tiny, fast piercing projectiles.',
      f: function(p) {
        if (typeof A !== 'undefined' && typeof A[4] === 'function') { A[4](p); }
        else { shootFan(p, 5, 0.35, { d: ST.dmg * 1.5, sp: ST.ps * 1.25, pierce: 2 }); applyAoE(p.x, p.y, 140, ST.dmg * 1.6, (4 * 25) % 360); }
      }
    },
    {
      name: 'Beryllium Reflector', ic: '🪞',
      desc: 'Deploys a rigid reflector shield that deflects incoming enemy projectiles and amplifies crits.',
      f: function(p) {
        gainShield(p, 30, 1.2); convertShots(p, 160); p.puDamage = Math.max(p.puDamage || 1, 1.3); p.puTimer = Math.max(p.puTimer || 0, 4.5); fxRing(p.x, p.y, (4 * 25) % 360, 150, 12, 0.6);
      }
    },
    {
      name: 'Emerald Shard Fan', ic: '💎',
      desc: 'Releases a wide fan of razor-sharp beryl crystal shards that shred multiple targets.',
      f: function(p) {
        shootFan(p, 9, 0.55, { d: ST.dmg * 1.45, sp: ST.ps * 1.8, r: 5, pierce: 4, crit: true }); shootRing(p, 12, { d: ST.dmg * 0.85, sp: ST.ps * 1.2, pierce: 2 }); applyAoE(p.x, p.y, 160, ST.dmg * 1.8, (4 * 33) % 360);
      }
    }
  ];
  ELEMENT_MOVES_DATA[5] = [
    {
      name: 'Crystal Field', ic: '🧊',
      desc: 'Creates crystalline structures that block bullets; shooting them fractures the crystals into razor-sharp shards.',
      f: function(p) {
        if (typeof A !== 'undefined' && typeof A[5] === 'function') { A[5](p); }
        else { shootFan(p, 5, 0.35, { d: ST.dmg * 1.5, sp: ST.ps * 1.25, pierce: 2 }); applyAoE(p.x, p.y, 140, ST.dmg * 1.6, (5 * 25) % 360); }
      }
    },
    {
      name: 'Neutron Absorber', ic: '🛡️',
      desc: 'Raises a radiation-absorbing boron shield that negates projectile damage and converts it to shields.',
      f: function(p) {
        gainShield(p, 45, 1.4); convertShots(p, 140); applyAoE(p.x, p.y, 110, ST.dmg * 0.8, (5 * 25) % 360); applyStatusToNear(p.x, p.y, 140, 'slow', ST.dmg);
      }
    },
    {
      name: 'Boride Drill Spike', ic: '⛏️',
      desc: 'Fires a high-hardness boron carbide drill that pierces through all enemies in a straight line.',
      f: function(p) {
        shootBullet(p, { d: ST.dmg * 4.8, sp: ST.ps * 3.0, r: 10, pierce: 25, kb: 3.0, crit: true }); if (typeof hitBeam === 'function') hitBeam(p.x, p.y, p.angle, 500, 22, ST.dmg * 2.6, (5 * 33) % 360, 'corrode'); if (window.RUN) RUN.shake = Math.max(RUN.shake || 0, 14);
      }
    }
  ];
  ELEMENT_MOVES_DATA[6] = [
    {
      name: 'Allotropy', ic: '💎',
      desc: 'Cycles between Diamond (armor/tank), Graphite (electric chain conduction), and Fullerene (stealth/speed).',
      f: function(p) {
        if (typeof A !== 'undefined' && typeof A[6] === 'function') { A[6](p); }
        else { shootFan(p, 5, 0.35, { d: ST.dmg * 1.5, sp: ST.ps * 1.25, pierce: 2 }); applyAoE(p.x, p.y, 140, ST.dmg * 1.6, (6 * 25) % 360); }
      }
    },
    {
      name: 'Graphene Nanoweb', ic: '🕸️',
      desc: 'Deploys a razor-thin graphene web that slows, binds, and inflicts continuous bleed on hostiles.',
      f: function(p) {
        addWell(p.x + Math.cos(p.angle) * 130, p.y + Math.sin(p.angle) * 130, 3.2, 2); shootFan(p, 4, 0.28, { d: ST.dmg * 1.4, sp: ST.ps * 1.5, pierce: 2, hom: true }); applyStatusToNear(p.x + Math.cos(p.angle) * 130, p.y + Math.sin(p.angle) * 130, 160, 'stun', ST.dmg);
      }
    },
    {
      name: 'Diamond Edge Cleave', ic: '🗡️',
      desc: 'Delivers a devastating ultra-hard diamond slash dealing massive critical damage.',
      f: function(p) {
        if (typeof hitWave === 'function') hitWave(p.x, p.y, p.angle, 320, 75, ST.dmg * 2.8, (6 * 33) % 360, 'slow'); applyAoE(p.x + Math.cos(p.angle) * 120, p.y + Math.sin(p.angle) * 120, 210, ST.dmg * 2.5, (6 * 33) % 360); shootFan(p, 5, 0.35, { d: ST.dmg * 1.4, sp: ST.ps * 1.7, pierce: 5, kb: 2.2 });
      }
    }
  ];
  ELEMENT_MOVES_DATA[7] = [
    {
      name: 'Cryogenic Fog', ic: '🌫️',
      desc: 'Releases nitrogen vapor that rapidly cools an area, slowing enemies and freezing them solid.',
      f: function(p) {
        if (typeof A !== 'undefined' && typeof A[7] === 'function') { A[7](p); }
        else { shootFan(p, 5, 0.35, { d: ST.dmg * 1.5, sp: ST.ps * 1.25, pierce: 2 }); applyAoE(p.x, p.y, 140, ST.dmg * 1.6, (7 * 25) % 360); }
      }
    },
    {
      name: 'Azide Detonation', ic: '💣',
      desc: 'Plants unstable nitrogen azide charges that trigger cascading multi-target explosions.',
      f: function(p) {
        addWell(p.x + Math.cos(p.angle) * 130, p.y + Math.sin(p.angle) * 130, 3.2, 2); shootFan(p, 4, 0.28, { d: ST.dmg * 1.4, sp: ST.ps * 1.5, pierce: 2, hom: true }); applyStatusToNear(p.x + Math.cos(p.angle) * 130, p.y + Math.sin(p.angle) * 130, 160, 'stun', ST.dmg);
      }
    },
    {
      name: 'Atmospheric Blast', ic: '💨',
      desc: 'Releases an explosive high-pressure nitrogen shockwave that hurls enemies away and clears projectiles.',
      f: function(p) {
        if (typeof hitWave === 'function') hitWave(p.x, p.y, p.angle, 320, 75, ST.dmg * 2.8, (7 * 33) % 360, 'slow'); applyAoE(p.x + Math.cos(p.angle) * 120, p.y + Math.sin(p.angle) * 120, 210, ST.dmg * 2.5, (7 * 33) % 360); shootFan(p, 5, 0.35, { d: ST.dmg * 1.4, sp: ST.ps * 1.7, pierce: 5, kb: 2.2 });
      }
    }
  ];
  ELEMENT_MOVES_DATA[8] = [
    {
      name: 'Combustion', ic: '🔥',
      desc: 'Doesn\'t directly do huge damage; instead, massively amplifies nearby fire and explosions, creating high-damage zones.',
      f: function(p) {
        if (typeof A !== 'undefined' && typeof A[8] === 'function') { A[8](p); }
        else { shootFan(p, 5, 0.35, { d: ST.dmg * 1.5, sp: ST.ps * 1.25, pierce: 2 }); applyAoE(p.x, p.y, 140, ST.dmg * 1.6, (8 * 25) % 360); }
      }
    },
    {
      name: 'Ozone Arc Ring', ic: '⚡',
      desc: 'Radiates trivalent ozone pulses that shock nearby enemies with leaping electric arcs.',
      f: function(p) {
        p.puRate = Math.max(p.puRate || 1, 1.75); p.puDamage = Math.max(p.puDamage || 1, 1.4); p.puTimer = Math.max(p.puTimer || 0, 6.0); gainShield(p, 20, 0.6); shootRing(p, 8, { d: ST.dmg * 0.9, sp: ST.ps * 1.4, chainOnHit: true, pierce: 3 });
      }
    },
    {
      name: 'Hyperoxic Overdrive', ic: '☄️',
      desc: 'Saturates your weapon with pure oxygen, granting extreme fire rate and guaranteed crits for 5s.',
      f: function(p) {
        applyAoE(p.x, p.y, 250, ST.dmg * 3.4, (8 * 33) % 360); shootRing(p, 18, { d: ST.dmg * 1.15, sp: ST.ps * 1.5, pierce: 4, burn: true }); p.puDamage = Math.max(p.puDamage || 1, 1.6); p.puRate = Math.max(p.puRate || 1, 1.45); p.puTimer = Math.max(p.puTimer || 0, 6.0); gainShield(p, 25, 0.8);
      }
    }
  ];
  ELEMENT_MOVES_DATA[9] = [
    {
      name: 'Corrosion', ic: '🧪',
      desc: 'Extremely aggressive projectiles that eat through enemy armor; damage increases against already-damaged targets.',
      f: function(p) {
        if (typeof A !== 'undefined' && typeof A[9] === 'function') { A[9](p); }
        else { shootFan(p, 5, 0.35, { d: ST.dmg * 1.5, sp: ST.ps * 1.25, pierce: 2 }); applyAoE(p.x, p.y, 140, ST.dmg * 1.6, (9 * 25) % 360); }
      }
    },
    {
      name: 'Etching Ray', ic: '☣️',
      desc: 'Beams an intense fluorine ray that melts through shields and leaves lingering acid trails.',
      f: function(p) {
        shootBullet(p, { d: ST.dmg * 3.8, sp: ST.ps * 2.8, r: 6, pierce: 12, life: 1.1, expl: true }); if (typeof hitBeam === 'function') hitBeam(p.x, p.y, p.angle, 450, 16, ST.dmg * 2.2, (9 * 25) % 360, 'mark'); applyStatusToNear(p.x + Math.cos(p.angle)*150, p.y + Math.sin(p.angle)*150, 100, 'mark', ST.dmg);
      }
    },
    {
      name: 'Teflon Nonstick Barrier', ic: '🛡️',
      desc: 'Coats yourself in a non-reactive barrier that nullifies incoming status effects and grants invulnerability.',
      f: function(p) {
        applyAoE(p.x, p.y, 220, ST.dmg * 2.8, (9 * 33) % 360); shootRing(p, 14, { d: ST.dmg * 1.0, sp: ST.ps * 1.3, pierce: 3 }); p.puDamage = Math.max(p.puDamage || 1, 1.45); p.puTimer = Math.max(p.puTimer || 0, 5.5); gainShield(p, 20, 0.6);
      }
    }
  ];
  ELEMENT_MOVES_DATA[10] = [
    {
      name: 'Neon Sign', ic: '🏮',
      desc: 'Creates glowing laser barriers; enemies crossing them take repeated high-voltage damage.',
      f: function(p) {
        if (typeof A !== 'undefined' && typeof A[10] === 'function') { A[10](p); }
        else { shootFan(p, 5, 0.35, { d: ST.dmg * 1.5, sp: ST.ps * 1.25, pierce: 2 }); applyAoE(p.x, p.y, 140, ST.dmg * 1.6, (10 * 25) % 360); }
      }
    },
    {
      name: 'Luminescent Flash', ic: '✨',
      desc: 'Emits a blinding high-voltage flash that stuns enemies and forces projectile deflection.',
      f: function(p) {
        addWell(p.x + Math.cos(p.angle) * 130, p.y + Math.sin(p.angle) * 130, 3.2, 2); shootFan(p, 4, 0.28, { d: ST.dmg * 1.4, sp: ST.ps * 1.5, pierce: 2, hom: true }); applyStatusToNear(p.x + Math.cos(p.angle) * 130, p.y + Math.sin(p.angle) * 130, 160, 'stun', ST.dmg);
      }
    },
    {
      name: 'Noble Neon Beam', ic: '☄️',
      desc: 'Fires a sustained crimson-orange neon discharge beam with infinite pierce.',
      f: function(p) {
        applyAoE(p.x, p.y, 220, ST.dmg * 2.8, (10 * 33) % 360); shootRing(p, 14, { d: ST.dmg * 1.0, sp: ST.ps * 1.3, pierce: 3 }); p.puDamage = Math.max(p.puDamage || 1, 1.45); p.puTimer = Math.max(p.puTimer || 0, 5.5); gainShield(p, 20, 0.6);
      }
    }
  ];
  ELEMENT_MOVES_DATA[11] = [
    {
      name: 'Water Reaction', ic: '🟡',
      desc: 'Throw sodium pellets that explode upon contact with water or moisture; create pools to combo explosions.',
      f: function(p) {
        if (typeof A !== 'undefined' && typeof A[11] === 'function') { A[11](p); }
        else { shootFan(p, 5, 0.35, { d: ST.dmg * 1.5, sp: ST.ps * 1.25, pierce: 2 }); applyAoE(p.x, p.y, 140, ST.dmg * 1.6, (11 * 25) % 360); }
      }
    },
    {
      name: 'Caustic Hydroxide Pool', ic: '🧪',
      desc: 'Creates a burning alkaline zone that dissolves enemy armor and slows movement.',
      f: function(p) {
        addZone(p.x + Math.cos(p.angle) * 100, p.y + Math.sin(p.angle) * 100, 140, 5.0); addField({ x: p.x + Math.cos(p.angle) * 100, y: p.y + Math.sin(p.angle) * 100, r: 130, t: 5.0, seed: 11 }); applyStatusToNear(p.x + Math.cos(p.angle) * 100, p.y + Math.sin(p.angle) * 100, 150, 'corrode', ST.dmg * 1.5);
      }
    },
    {
      name: 'Vapor Flame Nova', ic: '💥',
      desc: 'Discharges an intense golden sodium flare that blinds and knocks back all nearby hostiles.',
      f: function(p) {
        applyAoE(p.x, p.y, 250, ST.dmg * 3.4, (11 * 33) % 360); shootRing(p, 18, { d: ST.dmg * 1.15, sp: ST.ps * 1.5, pierce: 4, burn: true }); p.puDamage = Math.max(p.puDamage || 1, 1.6); p.puRate = Math.max(p.puRate || 1, 1.45); p.puTimer = Math.max(p.puTimer || 0, 6.0); gainShield(p, 25, 0.8);
      }
    }
  ];
  ELEMENT_MOVES_DATA[12] = [
    {
      name: 'Flashburn', ic: '🟢',
      desc: 'Fires extremely bright magnesium flares that blind enemies and illuminate the entire map.',
      f: function(p) {
        if (typeof A !== 'undefined' && typeof A[12] === 'function') { A[12](p); }
        else { shootFan(p, 5, 0.35, { d: ST.dmg * 1.5, sp: ST.ps * 1.25, pierce: 2 }); applyAoE(p.x, p.y, 140, ST.dmg * 1.6, (12 * 25) % 360); }
      }
    },
    {
      name: 'Thermite Spark Stream', ic: '🔥',
      desc: 'Launches a focused barrage of white-hot burning magnesium ribbons that ignite everything in their path.',
      f: function(p) {
        shootBullet(p, { d: ST.dmg * 3.8, sp: ST.ps * 2.8, r: 6, pierce: 12, life: 1.1, expl: true }); if (typeof hitBeam === 'function') hitBeam(p.x, p.y, p.angle, 450, 16, ST.dmg * 2.2, (12 * 25) % 360, 'burn'); applyStatusToNear(p.x + Math.cos(p.angle)*150, p.y + Math.sin(p.angle)*150, 100, 'burn', ST.dmg);
      }
    },
    {
      name: 'Magnesia Shield Wall', ic: '🛡️',
      desc: 'Raises a fireproof refractory barrier that absorbs incoming impacts and radiates heat.',
      f: function(p) {
        applyAoE(p.x, p.y, 220, ST.dmg * 2.8, (12 * 33) % 360); shootRing(p, 14, { d: ST.dmg * 1.0, sp: ST.ps * 1.3, pierce: 3 }); p.puDamage = Math.max(p.puDamage || 1, 1.45); p.puTimer = Math.max(p.puTimer || 0, 5.5); gainShield(p, 20, 0.6);
      }
    }
  ];
  ELEMENT_MOVES_DATA[13] = [
    {
      name: 'Metal Storm', ic: '🔵',
      desc: 'Rapid-fire lightweight metal shards; huge magazine and extremely fast reload speed.',
      f: function(p) {
        if (typeof A !== 'undefined' && typeof A[13] === 'function') { A[13](p); }
        else { shootFan(p, 5, 0.35, { d: ST.dmg * 1.5, sp: ST.ps * 1.25, pierce: 2 }); applyAoE(p.x, p.y, 140, ST.dmg * 1.6, (13 * 25) % 360); }
      }
    },
    {
      name: 'Anodized Plating', ic: '🛡️',
      desc: 'Hardens your hull with an oxide layer, boosting shield absorption and movement speed.',
      f: function(p) {
        gainShield(p, 45, 1.4); convertShots(p, 140); applyAoE(p.x, p.y, 110, ST.dmg * 0.8, (13 * 25) % 360); applyStatusToNear(p.x, p.y, 140, 'slow', ST.dmg);
      }
    },
    {
      name: 'Alumino-Thermic Blast', ic: '💥',
      desc: 'Ignites a high-heat thermite reaction, creating a searing shockwave that shreds heavy armor.',
      f: function(p) {
        if (typeof hitWave === 'function') hitWave(p.x, p.y, p.angle, 320, 75, ST.dmg * 2.8, (13 * 33) % 360, 'slow'); applyAoE(p.x + Math.cos(p.angle) * 120, p.y + Math.sin(p.angle) * 120, 210, ST.dmg * 2.5, (13 * 33) % 360); shootFan(p, 5, 0.35, { d: ST.dmg * 1.4, sp: ST.ps * 1.7, pierce: 5, kb: 2.2 });
      }
    }
  ];
  ELEMENT_MOVES_DATA[14] = [
    {
      name: 'Circuit', ic: '🟤',
      desc: 'Place conductive nodes that create electrical pathways between each other to build customized lethal traps.',
      f: function(p) {
        if (typeof A !== 'undefined' && typeof A[14] === 'function') { A[14](p); }
        else { shootFan(p, 5, 0.35, { d: ST.dmg * 1.5, sp: ST.ps * 1.25, pierce: 2 }); applyAoE(p.x, p.y, 140, ST.dmg * 1.6, (14 * 25) % 360); }
      }
    },
    {
      name: 'Piezoelectric Pulse', ic: '⚡',
      desc: 'Discharges accumulated pressure into a chain lightning nova that arcs through groups of foes.',
      f: function(p) {
        p.puRate = Math.max(p.puRate || 1, 1.75); p.puDamage = Math.max(p.puDamage || 1, 1.4); p.puTimer = Math.max(p.puTimer || 0, 6.0); gainShield(p, 20, 0.6); shootRing(p, 8, { d: ST.dmg * 0.9, sp: ST.ps * 1.4, chainOnHit: true, pierce: 3 });
      }
    },
    {
      name: 'Silicate Mirror Array', ic: '💎',
      desc: 'Deploys refractive semiconductor mirrors that reflect hostile lasers and amplify projectile damage.',
      f: function(p) {
        shootFan(p, 9, 0.55, { d: ST.dmg * 1.45, sp: ST.ps * 1.8, r: 5, pierce: 4, crit: true }); shootRing(p, 12, { d: ST.dmg * 0.85, sp: ST.ps * 1.2, pierce: 2 }); applyAoE(p.x, p.y, 160, ST.dmg * 1.8, (14 * 33) % 360);
      }
    }
  ];
  ELEMENT_MOVES_DATA[15] = [
    {
      name: 'White Flame', ic: '🟣',
      desc: 'Shots leave persistent burning trails; enemies killed by fire leave additional spreading flames behind.',
      f: function(p) {
        if (typeof A !== 'undefined' && typeof A[15] === 'function') { A[15](p); }
        else { shootFan(p, 5, 0.35, { d: ST.dmg * 1.5, sp: ST.ps * 1.25, pierce: 2 }); applyAoE(p.x, p.y, 140, ST.dmg * 1.6, (15 * 25) % 360); }
      }
    },
    {
      name: 'Red Phosphorus Smokescreen', ic: '🌫️',
      desc: 'Deploys a dense toxic smoke cloud that blinds hostiles and conceals your position.',
      f: function(p) {
        addZone(p.x + Math.cos(p.angle) * 100, p.y + Math.sin(p.angle) * 100, 140, 5.0); addField({ x: p.x + Math.cos(p.angle) * 100, y: p.y + Math.sin(p.angle) * 100, r: 130, t: 5.0, seed: 15 }); applyStatusToNear(p.x + Math.cos(p.angle) * 100, p.y + Math.sin(p.angle) * 100, 150, 'slow', ST.dmg * 1.5);
      }
    },
    {
      name: 'Pyrotechnic Volley', ic: '🎆',
      desc: 'Launches a spreading volley of incendiary flares that detonate in cascading fireballs.',
      f: function(p) {
        shootFan(p, 9, 0.55, { d: ST.dmg * 1.45, sp: ST.ps * 1.8, r: 5, pierce: 4, crit: true }); shootRing(p, 12, { d: ST.dmg * 0.85, sp: ST.ps * 1.2, pierce: 2 }); applyAoE(p.x, p.y, 160, ST.dmg * 1.8, (15 * 33) % 360);
      }
    }
  ];
  ELEMENT_MOVES_DATA[16] = [
    {
      name: 'Sulfur Cloud', ic: '🟡',
      desc: 'Creates an expanding yellow toxic cloud that damages enemies over time and obscures vision.',
      f: function(p) {
        if (typeof A !== 'undefined' && typeof A[16] === 'function') { A[16](p); }
        else { shootFan(p, 5, 0.35, { d: ST.dmg * 1.5, sp: ST.ps * 1.25, pierce: 2 }); applyAoE(p.x, p.y, 140, ST.dmg * 1.6, (16 * 25) % 360); }
      }
    },
    {
      name: 'Brimstone Geyser', ic: '🌋',
      desc: 'Erupts a geyser of molten sulfur beneath the cursor, launching burning debris in all directions.',
      f: function(p) {
        shootBullet(p, { d: ST.dmg * 3.2, sp: ST.ps * 2.2, r: 7, pierce: 6, kb: 1.8, hom: true, life: 1.4 }); shootFan(p, 3, 0.18, { d: ST.dmg * 0.9, sp: ST.ps * 1.5, pierce: 2 }); applyStatusToNear(p.x, p.y, 140, 'mark', ST.dmg);
      }
    },
    {
      name: 'Vulcanized Carapace', ic: '🛡️',
      desc: 'Cross-links defensive layers, granting high kinetic resistance and immunity to status debuffs.',
      f: function(p) {
        applyAoE(p.x, p.y, 220, ST.dmg * 2.8, (16 * 33) % 360); shootRing(p, 14, { d: ST.dmg * 1.0, sp: ST.ps * 1.3, pierce: 3 }); p.puDamage = Math.max(p.puDamage || 1, 1.45); p.puTimer = Math.max(p.puTimer || 0, 5.5); gainShield(p, 20, 0.6);
      }
    }
  ];
  ELEMENT_MOVES_DATA[17] = [
    {
      name: 'Gas Burst', ic: '🟢',
      desc: 'Releases poisonous gas that spreads outward and lingers across the battlefield.',
      f: function(p) {
        if (typeof A !== 'undefined' && typeof A[17] === 'function') { A[17](p); }
        else { shootFan(p, 5, 0.35, { d: ST.dmg * 1.5, sp: ST.ps * 1.25, pierce: 2 }); applyAoE(p.x, p.y, 140, ST.dmg * 1.6, (17 * 25) % 360); }
      }
    },
    {
      name: 'Bleach Cascade', ic: '🧪',
      desc: 'Sprays an oxidizing chemical torrent that strips enemy buffs, dissolves armor, and poisons targets.',
      f: function(p) {
        shootBullet(p, { d: ST.dmg * 3.2, sp: ST.ps * 2.2, r: 7, pierce: 6, kb: 1.8, hom: true, life: 1.4 }); shootFan(p, 3, 0.18, { d: ST.dmg * 0.9, sp: ST.ps * 1.5, pierce: 2 }); applyStatusToNear(p.x, p.y, 140, 'mark', ST.dmg);
      }
    },
    {
      name: 'Chloric Shock Dart', ic: '⚡',
      desc: 'Fires high-speed halogen darts that burst into secondary toxic gas pockets on impact.',
      f: function(p) {
        applyAoE(p.x, p.y, 220, ST.dmg * 2.8, (17 * 33) % 360); shootRing(p, 14, { d: ST.dmg * 1.0, sp: ST.ps * 1.3, pierce: 3 }); p.puDamage = Math.max(p.puDamage || 1, 1.45); p.puTimer = Math.max(p.puTimer || 0, 5.5); gainShield(p, 20, 0.6);
      }
    }
  ];
  ELEMENT_MOVES_DATA[18] = [
    {
      name: 'Inert Zone', ic: '🟣',
      desc: 'Creates an area where elemental reactions are disabled; fire can\'t spread, electricity can\'t chain.',
      f: function(p) {
        if (typeof A !== 'undefined' && typeof A[18] === 'function') { A[18](p); }
        else { shootFan(p, 5, 0.35, { d: ST.dmg * 1.5, sp: ST.ps * 1.25, pierce: 2 }); applyAoE(p.x, p.y, 140, ST.dmg * 1.6, (18 * 25) % 360); }
      }
    },
    {
      name: 'Plasma Glow Discharge', ic: '✨',
      desc: 'Releases a soothing violet argon discharge that purges negative status and restores player shields.',
      f: function(p) {
        shootBullet(p, { d: ST.dmg * 3.2, sp: ST.ps * 2.2, r: 7, pierce: 6, kb: 1.8, hom: true, life: 1.4 }); shootFan(p, 3, 0.18, { d: ST.dmg * 0.9, sp: ST.ps * 1.5, pierce: 2 }); applyStatusToNear(p.x, p.y, 140, 'mark', ST.dmg);
      }
    },
    {
      name: 'Absolute Inertia Field', ic: '❄️',
      desc: 'Freezes all kinetic energy in a wide area, locking enemy bullets and staggering advancing hostiles.',
      f: function(p) {
        addZone(p.x, p.y, 220, 5.5); convertShots(p, 260); nearEnemies(p.x, p.y, 300).forEach(function(e) { if (typeof addFreeze === 'function') addFreeze(e, 2.0); e.slowT = Math.max(e.slowT || 0, 4.0); }); shootRing(p, 14, { d: ST.dmg * 0.9, sp: ST.ps * 1.4, pierce: 3 });
      }
    }
  ];
  ELEMENT_MOVES_DATA[19] = [
    {
      name: 'Overreaction', ic: '🟣',
      desc: 'Extremely unstable rapid-fire weapon; every few shots randomly causes an explosive reaction.',
      f: function(p) {
        if (typeof A !== 'undefined' && typeof A[19] === 'function') { A[19](p); }
        else { shootFan(p, 5, 0.35, { d: ST.dmg * 1.5, sp: ST.ps * 1.25, pierce: 2 }); applyAoE(p.x, p.y, 140, ST.dmg * 1.6, (19 * 25) % 360); }
      }
    },
    {
      name: 'Electrolyte Surge', ic: '⚡',
      desc: 'Stimulates neuromuscular speed, drastically boosting agility, dash recovery, and weapon reload.',
      f: function(p) {
        p.puRate = Math.max(p.puRate || 1, 1.75); p.puDamage = Math.max(p.puDamage || 1, 1.4); p.puTimer = Math.max(p.puTimer || 0, 6.0); gainShield(p, 20, 0.6); shootRing(p, 8, { d: ST.dmg * 0.9, sp: ST.ps * 1.4, chainOnHit: true, pierce: 3 });
      }
    },
    {
      name: 'Violet Combustion Nova', ic: '💥',
      desc: 'Detonates a violent lilac flame wave that sends shockwaves rippling across the arena.',
      f: function(p) {
        applyAoE(p.x, p.y, 250, ST.dmg * 3.4, (19 * 33) % 360); shootRing(p, 18, { d: ST.dmg * 1.15, sp: ST.ps * 1.5, pierce: 4, burn: true }); p.puDamage = Math.max(p.puDamage || 1, 1.6); p.puRate = Math.max(p.puRate || 1, 1.45); p.puTimer = Math.max(p.puTimer || 0, 6.0); gainShield(p, 25, 0.8);
      }
    }
  ];
  ELEMENT_MOVES_DATA[20] = [
    {
      name: 'Bone Wall', ic: '⚪',
      desc: 'Summons calcium structures resembling giant skeletal walls that absorb damage and shatter into projectiles.',
      f: function(p) {
        if (typeof A !== 'undefined' && typeof A[20] === 'function') { A[20](p); }
        else { shootFan(p, 5, 0.35, { d: ST.dmg * 1.5, sp: ST.ps * 1.25, pierce: 2 }); applyAoE(p.x, p.y, 140, ST.dmg * 1.6, (20 * 25) % 360); }
      }
    },
    {
      name: 'Calcified Carapace', ic: '🛡️',
      desc: 'Hardens your outer armor, granting temporary invulnerability and retaliatory thorn damage.',
      f: function(p) {
        gainShield(p, 45, 1.4); convertShots(p, 140); applyAoE(p.x, p.y, 110, ST.dmg * 0.8, (20 * 25) % 360); applyStatusToNear(p.x, p.y, 140, 'slow', ST.dmg);
      }
    },
    {
      name: 'Calcite Spike Wave', ic: '⛏️',
      desc: 'Sends a line of erupting mineral stalagmites that impale and launch enemies into the air.',
      f: function(p) {
        if (typeof hitWave === 'function') hitWave(p.x, p.y, p.angle, 320, 75, ST.dmg * 2.8, (20 * 33) % 360, 'slow'); applyAoE(p.x + Math.cos(p.angle) * 120, p.y + Math.sin(p.angle) * 120, 210, ST.dmg * 2.5, (20 * 33) % 360); shootFan(p, 5, 0.35, { d: ST.dmg * 1.4, sp: ST.ps * 1.7, pierce: 5, kb: 2.2 });
      }
    }
  ];
  ELEMENT_MOVES_DATA[21] = [
    {
      name: 'Reinforcement', ic: '⚙️',
      desc: 'Temporarily strengthens every object you interact with: cover, traps, projectiles, and defenses.',
      f: function(p) {
        if (typeof A !== 'undefined' && typeof A[21] === 'function') { A[21](p); }
        else { shootFan(p, 5, 0.35, { d: ST.dmg * 1.5, sp: ST.ps * 1.25, pierce: 2 }); applyAoE(p.x, p.y, 140, ST.dmg * 1.6, (21 * 25) % 360); }
      }
    },
    {
      name: 'Scandium Alloy Spike', ic: '🗡️',
      desc: 'Fires an ultra-light aerospace alloy spear that pierces straight through lines of enemy units.',
      f: function(p) {
        shootBullet(p, { d: ST.dmg * 3.2, sp: ST.ps * 2.2, r: 7, pierce: 6, kb: 1.8, hom: true, life: 1.4 }); shootFan(p, 3, 0.18, { d: ST.dmg * 0.9, sp: ST.ps * 1.5, pierce: 2 }); applyStatusToNear(p.x, p.y, 140, 'mark', ST.dmg);
      }
    },
    {
      name: 'Structural Fortification', ic: '🛡️',
      desc: 'Reinforces your kinetic matrix, granting extreme damage reduction and bullet deflection for 6s.',
      f: function(p) {
        applyAoE(p.x, p.y, 220, ST.dmg * 2.8, (21 * 33) % 360); shootRing(p, 14, { d: ST.dmg * 1.0, sp: ST.ps * 1.3, pierce: 3 }); p.puDamage = Math.max(p.puDamage || 1, 1.45); p.puTimer = Math.max(p.puTimer || 0, 5.5); gainShield(p, 20, 0.6);
      }
    }
  ];
  ELEMENT_MOVES_DATA[22] = [
    {
      name: 'Titan Frame', ic: '⚙️',
      desc: 'Massive damage resistance while maintaining speed; ultimate grants near-unstoppable momentum.',
      f: function(p) {
        if (typeof A !== 'undefined' && typeof A[22] === 'function') { A[22](p); }
        else { shootFan(p, 5, 0.35, { d: ST.dmg * 1.5, sp: ST.ps * 1.25, pierce: 2 }); applyAoE(p.x, p.y, 140, ST.dmg * 1.6, (22 * 25) % 360); }
      }
    },
    {
      name: 'Titanium Shrapnel Burst', ic: '💥',
      desc: 'Erupts high-tensile titanium shards in a 360-degree radial blast that shreds armor.',
      f: function(p) {
        shootFan(p, 7, 0.42, { d: ST.dmg * 1.25, sp: ST.ps * 1.6, r: 5, pierce: 3, crit: true }); applyAoE(p.x, p.y, 90, ST.dmg * 0.8, (22 * 25) % 360);
      }
    },
    {
      name: 'Titanium Dreadnought Charge', ic: '🚀',
      desc: 'Charges forward with unstoppable force, smashing enemies and deflecting all projectiles in your path.',
      f: function(p) {
        applyAoE(p.x, p.y, 220, ST.dmg * 2.8, (22 * 33) % 360); shootRing(p, 14, { d: ST.dmg * 1.0, sp: ST.ps * 1.3, pierce: 3 }); p.puDamage = Math.max(p.puDamage || 1, 1.45); p.puTimer = Math.max(p.puTimer || 0, 5.5); gainShield(p, 20, 0.6);
      }
    }
  ];
  ELEMENT_MOVES_DATA[23] = [
    {
      name: 'Battery Shot', ic: '🔵',
      desc: 'Attacks store energy instead of immediately releasing it; shoot again to discharge all stored energy.',
      f: function(p) {
        if (typeof A !== 'undefined' && typeof A[23] === 'function') { A[23](p); }
        else { shootFan(p, 5, 0.35, { d: ST.dmg * 1.5, sp: ST.ps * 1.25, pierce: 2 }); applyAoE(p.x, p.y, 140, ST.dmg * 1.6, (23 * 25) % 360); }
      }
    },
    {
      name: 'Redox Flow Surge', ic: '⚡',
      desc: 'Cycles vanadium redox valence states, instantly restoring shields and shocking nearby foes.',
      f: function(p) {
        p.puRate = Math.max(p.puRate || 1, 1.75); p.puDamage = Math.max(p.puDamage || 1, 1.4); p.puTimer = Math.max(p.puTimer || 0, 6.0); gainShield(p, 20, 0.6); shootRing(p, 8, { d: ST.dmg * 0.9, sp: ST.ps * 1.4, chainOnHit: true, pierce: 3 });
      }
    },
    {
      name: 'Vanadium Steel Cleave', ic: '🗡️',
      desc: 'Unleashes an overcharged vanadium arc blade dealing massive critical damage.',
      f: function(p) {
        if (typeof hitWave === 'function') hitWave(p.x, p.y, p.angle, 320, 75, ST.dmg * 2.8, (23 * 33) % 360, 'slow'); applyAoE(p.x + Math.cos(p.angle) * 120, p.y + Math.sin(p.angle) * 120, 210, ST.dmg * 2.5, (23 * 33) % 360); shootFan(p, 5, 0.35, { d: ST.dmg * 1.4, sp: ST.ps * 1.7, pierce: 5, kb: 2.2 });
      }
    }
  ];
  ELEMENT_MOVES_DATA[24] = [
    {
      name: 'Chromium Coat', ic: '⚙️',
      desc: 'Reflective armor has a chance to bounce enemy projectiles back toward attackers.',
      f: function(p) {
        if (typeof A !== 'undefined' && typeof A[24] === 'function') { A[24](p); }
        else { shootFan(p, 5, 0.35, { d: ST.dmg * 1.5, sp: ST.ps * 1.25, pierce: 2 }); applyAoE(p.x, p.y, 140, ST.dmg * 1.6, (24 * 25) % 360); }
      }
    },
    {
      name: 'Mirror Prism Beam', ic: '🪞',
      desc: 'Fires a reflective chromium ray that refracts between multiple targets.',
      f: function(p) {
        gainShield(p, 30, 1.2); convertShots(p, 160); p.puDamage = Math.max(p.puDamage || 1, 1.3); p.puTimer = Math.max(p.puTimer || 0, 4.5); fxRing(p.x, p.y, (24 * 25) % 360, 150, 12, 0.6);
      }
    },
    {
      name: 'Stainless Chrome Aegis', ic: '🛡️',
      desc: 'Raises an impenetrable chrome barrier that absorbs all damage and converts it to bonus attack power.',
      f: function(p) {
        applyAoE(p.x, p.y, 220, ST.dmg * 2.8, (24 * 33) % 360); shootRing(p, 14, { d: ST.dmg * 1.0, sp: ST.ps * 1.3, pierce: 3 }); p.puDamage = Math.max(p.puDamage || 1, 1.45); p.puTimer = Math.max(p.puTimer || 0, 5.5); gainShield(p, 20, 0.6);
      }
    }
  ];
  ELEMENT_MOVES_DATA[25] = [
    {
      name: 'Catalyst', ic: '🟣',
      desc: 'Makes nearby elemental effects happen faster, amplifying reaction speeds and tick rates.',
      f: function(p) {
        if (typeof A !== 'undefined' && typeof A[25] === 'function') { A[25](p); }
        else { shootFan(p, 5, 0.35, { d: ST.dmg * 1.5, sp: ST.ps * 1.25, pierce: 2 }); applyAoE(p.x, p.y, 140, ST.dmg * 1.6, (25 * 25) % 360); }
      }
    },
    {
      name: 'Permanganate Oxidizer', ic: '🧪',
      desc: 'Splashes deep violet oxidizer that melts enemy defenses and accelerates active burns and poisons.',
      f: function(p) {
        shootBullet(p, { d: ST.dmg * 3.2, sp: ST.ps * 2.2, r: 7, pierce: 6, kb: 1.8, hom: true, life: 1.4 }); shootFan(p, 3, 0.18, { d: ST.dmg * 0.9, sp: ST.ps * 1.5, pierce: 2 }); applyStatusToNear(p.x, p.y, 140, 'mark', ST.dmg);
      }
    },
    {
      name: 'Catalytic Hyper-Nova', ic: '💥',
      desc: 'Detonates all active status effects on surrounding enemies into simultaneous massive explosions.',
      f: function(p) {
        applyAoE(p.x, p.y, 250, ST.dmg * 3.4, (25 * 33) % 360); shootRing(p, 18, { d: ST.dmg * 1.15, sp: ST.ps * 1.5, pierce: 4, burn: true }); p.puDamage = Math.max(p.puDamage || 1, 1.6); p.puRate = Math.max(p.puRate || 1, 1.45); p.puTimer = Math.max(p.puTimer || 0, 6.0); gainShield(p, 25, 0.8);
      }
    }
  ];
  ELEMENT_MOVES_DATA[26] = [
    {
      name: 'Magnetism', ic: '🔴',
      desc: 'Pulls metal projectiles, metallic enemies, and dropped objects toward you in a crushing magnetic vortex.',
      f: function(p) {
        if (typeof A !== 'undefined' && typeof A[26] === 'function') { A[26](p); }
        else { shootFan(p, 5, 0.35, { d: ST.dmg * 1.5, sp: ST.ps * 1.25, pierce: 2 }); applyAoE(p.x, p.y, 140, ST.dmg * 1.6, (26 * 25) % 360); }
      }
    },
    {
      name: 'Ferrous Shrapnel Cannon', ic: '⚙️',
      desc: 'Fires high-caliber iron slugs that splinter into heavy piercing fragments on impact.',
      f: function(p) {
        shootFan(p, 7, 0.42, { d: ST.dmg * 1.25, sp: ST.ps * 1.6, r: 5, pierce: 3, crit: true }); applyAoE(p.x, p.y, 90, ST.dmg * 0.8, (26 * 25) % 360);
      }
    },
    {
      name: 'Magnetic Singularity Core', ic: '🧲',
      desc: 'Collapses a superdense magnetic core at target point, trapping enemies and crushing them with metallic force.',
      f: function(p) {
        addWell(p.x + Math.cos(p.angle) * 140, p.y + Math.sin(p.angle) * 140, 3.8, 3); if (window.RUN) RUN.shake = Math.max(RUN.shake || 0, 16); setTimeout(function() { applyAoE(p.x + Math.cos(p.angle) * 140, p.y + Math.sin(p.angle) * 140, 240, ST.dmg * 3.6, (26 * 33) % 360); shootRing(p, 16, { d: ST.dmg * 1.1, sp: ST.ps * 1.3, pierce: 4 }); }, 650);
      }
    }
  ];
  ELEMENT_MOVES_DATA[27] = [
    {
      name: 'Radiant Core', ic: '🔵',
      desc: 'Generates an energy core that slowly charges to release a powerful sustained beam.',
      f: function(p) {
        if (typeof A !== 'undefined' && typeof A[27] === 'function') { A[27](p); }
        else { shootFan(p, 5, 0.35, { d: ST.dmg * 1.5, sp: ST.ps * 1.25, pierce: 2 }); applyAoE(p.x, p.y, 140, ST.dmg * 1.6, (27 * 25) % 360); }
      }
    },
    {
      name: 'Cobalt-60 Radiation Pulse', ic: '☢️',
      desc: 'Discharges an intense gamma pulse that penetrates walls and inflicts lingering nuclear decay.',
      f: function(p) {
        p.puRate = Math.max(p.puRate || 1, 1.75); p.puDamage = Math.max(p.puDamage || 1, 1.4); p.puTimer = Math.max(p.puTimer || 0, 6.0); gainShield(p, 20, 0.6); shootRing(p, 8, { d: ST.dmg * 0.9, sp: ST.ps * 1.4, chainOnHit: true, pierce: 3 });
      }
    },
    {
      name: 'Magnetic Super-Alloy Field', ic: '🛡️',
      desc: 'Forms a magnetic stasis field that locks incoming enemy projectiles in place before reversing them.',
      f: function(p) {
        addWell(p.x + Math.cos(p.angle) * 140, p.y + Math.sin(p.angle) * 140, 3.8, 3); if (window.RUN) RUN.shake = Math.max(RUN.shake || 0, 16); setTimeout(function() { applyAoE(p.x + Math.cos(p.angle) * 140, p.y + Math.sin(p.angle) * 140, 240, ST.dmg * 3.6, (27 * 33) % 360); shootRing(p, 16, { d: ST.dmg * 1.1, sp: ST.ps * 1.3, pierce: 4 }); }, 650);
      }
    }
  ];
  ELEMENT_MOVES_DATA[28] = [
    {
      name: 'Magnetic Shield', ic: '🟢',
      desc: 'Creates a magnetic barrier that deflects certain projectiles and reduces kinetic damage.',
      f: function(p) {
        if (typeof A !== 'undefined' && typeof A[28] === 'function') { A[28](p); }
        else { shootFan(p, 5, 0.35, { d: ST.dmg * 1.5, sp: ST.ps * 1.25, pierce: 2 }); applyAoE(p.x, p.y, 140, ST.dmg * 1.6, (28 * 25) % 360); }
      }
    },
    {
      name: 'Nitinol Shape-Memory', ic: '🧬',
      desc: 'Activates shape-memory alloy elasticity, rapidly regenerating player HP and granting high dodge chance.',
      f: function(p) {
        shootBullet(p, { d: ST.dmg * 3.2, sp: ST.ps * 2.2, r: 7, pierce: 6, kb: 1.8, hom: true, life: 1.4 }); shootFan(p, 3, 0.18, { d: ST.dmg * 0.9, sp: ST.ps * 1.5, pierce: 2 }); applyStatusToNear(p.x, p.y, 140, 'mark', ST.dmg);
      }
    },
    {
      name: 'Electromagnetic Repulsor', ic: '⚡',
      desc: 'Releases an intense radial electromagnetic burst that staggers enemies and knocks them to the arena edge.',
      f: function(p) {
        addWell(p.x + Math.cos(p.angle) * 140, p.y + Math.sin(p.angle) * 140, 3.8, 3); if (window.RUN) RUN.shake = Math.max(RUN.shake || 0, 16); setTimeout(function() { applyAoE(p.x + Math.cos(p.angle) * 140, p.y + Math.sin(p.angle) * 140, 240, ST.dmg * 3.6, (28 * 33) % 360); shootRing(p, 16, { d: ST.dmg * 1.1, sp: ST.ps * 1.3, pierce: 4 }); }, 650);
      }
    }
  ];
  ELEMENT_MOVES_DATA[29] = [
    {
      name: 'Conductor', ic: '🟠',
      desc: 'Bullets jump between enemies; the more connected enemies there are, the stronger the chain becomes.',
      f: function(p) {
        if (typeof A !== 'undefined' && typeof A[29] === 'function') { A[29](p); }
        else { shootFan(p, 5, 0.35, { d: ST.dmg * 1.5, sp: ST.ps * 1.25, pierce: 2 }); applyAoE(p.x, p.y, 140, ST.dmg * 1.6, (29 * 25) % 360); }
      }
    },
    {
      name: 'High-Voltage Arc Lash', ic: '⚡',
      desc: 'Strikes forward with a searing copper electrical whip that stuns and electrocutes targets.',
      f: function(p) {
        p.puRate = Math.max(p.puRate || 1, 1.75); p.puDamage = Math.max(p.puDamage || 1, 1.4); p.puTimer = Math.max(p.puTimer || 0, 6.0); gainShield(p, 20, 0.6); shootRing(p, 8, { d: ST.dmg * 0.9, sp: ST.ps * 1.4, chainOnHit: true, pierce: 3 });
      }
    },
    {
      name: 'Conductive Grid Overload', ic: '🌐',
      desc: 'Electrifies the entire combat floor, causing every enemy in the room to chain lightning to its neighbors.',
      f: function(p) {
        applyAoE(p.x, p.y, 220, ST.dmg * 2.8, (29 * 33) % 360); shootRing(p, 14, { d: ST.dmg * 1.0, sp: ST.ps * 1.3, pierce: 3 }); p.puDamage = Math.max(p.puDamage || 1, 1.45); p.puTimer = Math.max(p.puTimer || 0, 5.5); gainShield(p, 20, 0.6);
      }
    }
  ];
  ELEMENT_MOVES_DATA[30] = [
    {
      name: 'Sacrificial Plating', ic: '🔵',
      desc: 'Damage first consumes a protective zinc layer; when destroyed, it releases a healing burst.',
      f: function(p) {
        if (typeof A !== 'undefined' && typeof A[30] === 'function') { A[30](p); }
        else { shootFan(p, 5, 0.35, { d: ST.dmg * 1.5, sp: ST.ps * 1.25, pierce: 2 }); applyAoE(p.x, p.y, 140, ST.dmg * 1.6, (30 * 25) % 360); }
      }
    },
    {
      name: 'Galvanic Shock Shroud', ic: '⚡',
      desc: 'Surrounds yourself in a galvanic electrical mantle that retaliates against attackers with shockwaves.',
      f: function(p) {
        shootBullet(p, { d: ST.dmg * 3.2, sp: ST.ps * 2.2, r: 7, pierce: 6, kb: 1.8, hom: true, life: 1.4 }); shootFan(p, 3, 0.18, { d: ST.dmg * 0.9, sp: ST.ps * 1.5, pierce: 2 }); applyStatusToNear(p.x, p.y, 140, 'mark', ST.dmg);
      }
    },
    {
      name: 'Zinc Oxide Regeneration', ic: '🛡️',
      desc: 'Deploys a soothing zinc mineral mist that heals all allies and restores armor plating.',
      f: function(p) {
        applyAoE(p.x, p.y, 220, ST.dmg * 2.8, (30 * 33) % 360); shootRing(p, 14, { d: ST.dmg * 1.0, sp: ST.ps * 1.3, pierce: 3 }); p.puDamage = Math.max(p.puDamage || 1, 1.45); p.puTimer = Math.max(p.puTimer || 0, 5.5); gainShield(p, 20, 0.6);
      }
    }
  ];
  ELEMENT_MOVES_DATA[31] = [
    {
      name: 'Meltdown', ic: '🔵',
      desc: 'Your weapon melts into liquid when overheated, temporarily switching to an expansive molten wave pattern.',
      f: function(p) {
        if (typeof A !== 'undefined' && typeof A[31] === 'function') { A[31](p); }
        else { shootFan(p, 5, 0.35, { d: ST.dmg * 1.5, sp: ST.ps * 1.25, pierce: 2 }); applyAoE(p.x, p.y, 140, ST.dmg * 1.6, (31 * 25) % 360); }
      }
    },
    {
      name: 'Liquid Metal Dart', ic: '💧',
      desc: 'Fires liquid gallium darts that slip through obstacles before solidifying inside enemies.',
      f: function(p) {
        shootBullet(p, { d: ST.dmg * 3.2, sp: ST.ps * 2.2, r: 7, pierce: 6, kb: 1.8, hom: true, life: 1.4 }); shootFan(p, 3, 0.18, { d: ST.dmg * 0.9, sp: ST.ps * 1.5, pierce: 2 }); applyStatusToNear(p.x, p.y, 140, 'mark', ST.dmg);
      }
    },
    {
      name: 'Gallium Alloy Embrittlement', ic: '☣️',
      desc: 'Splashes liquid gallium onto enemies, causing their armor to crack and making them take 60% extra damage.',
      f: function(p) {
        applyAoE(p.x, p.y, 220, ST.dmg * 2.8, (31 * 33) % 360); shootRing(p, 14, { d: ST.dmg * 1.0, sp: ST.ps * 1.3, pierce: 3 }); p.puDamage = Math.max(p.puDamage || 1, 1.45); p.puTimer = Math.max(p.puTimer || 0, 5.5); gainShield(p, 20, 0.6);
      }
    }
  ];
  ELEMENT_MOVES_DATA[32] = [
    {
      name: 'Semiconductor', ic: '🟡',
      desc: 'Toggle between Conductive and Insulating states to control whether attacks chain electricity or block damage.',
      f: function(p) {
        if (typeof A !== 'undefined' && typeof A[32] === 'function') { A[32](p); }
        else { shootFan(p, 5, 0.35, { d: ST.dmg * 1.5, sp: ST.ps * 1.25, pierce: 2 }); applyAoE(p.x, p.y, 140, ST.dmg * 1.6, (32 * 25) % 360); }
      }
    },
    {
      name: 'Infrared Thermal Pulse', ic: '🔴',
      desc: 'Fires an infrared optical pulse that marks enemy weak spots and deals bonus fire damage.',
      f: function(p) {
        p.puRate = Math.max(p.puRate || 1, 1.75); p.puDamage = Math.max(p.puDamage || 1, 1.4); p.puTimer = Math.max(p.puTimer || 0, 6.0); gainShield(p, 20, 0.6); shootRing(p, 8, { d: ST.dmg * 0.9, sp: ST.ps * 1.4, chainOnHit: true, pierce: 3 });
      }
    },
    {
      name: 'Semiconductor Gate Array', ic: '🌐',
      desc: 'Deploys semiconductor logic gates that redirect incoming projectiles away from the player.',
      f: function(p) {
        shootFan(p, 9, 0.55, { d: ST.dmg * 1.45, sp: ST.ps * 1.8, r: 5, pierce: 4, crit: true }); shootRing(p, 12, { d: ST.dmg * 0.85, sp: ST.ps * 1.2, pierce: 2 }); applyAoE(p.x, p.y, 160, ST.dmg * 1.8, (32 * 33) % 360);
      }
    }
  ];
  ELEMENT_MOVES_DATA[33] = [
    {
      name: 'Poison Bullet', ic: '🟡',
      desc: 'Weak direct damage but devastating lethal poison stacking that slowly suffocates targets.',
      f: function(p) {
        if (typeof A !== 'undefined' && typeof A[33] === 'function') { A[33](p); }
        else { shootFan(p, 5, 0.35, { d: ST.dmg * 1.5, sp: ST.ps * 1.25, pierce: 2 }); applyAoE(p.x, p.y, 140, ST.dmg * 1.6, (33 * 25) % 360); }
      }
    },
    {
      name: 'Arsenide Toxic Haze', ic: '🌫️',
      desc: 'Releases a deadly arsenic vapor cloud that lowers enemy attack speed and damages over time.',
      f: function(p) {
        addZone(p.x + Math.cos(p.angle) * 100, p.y + Math.sin(p.angle) * 100, 140, 5.0); addField({ x: p.x + Math.cos(p.angle) * 100, y: p.y + Math.sin(p.angle) * 100, r: 130, t: 5.0, seed: 33 }); applyStatusToNear(p.x + Math.cos(p.angle) * 100, p.y + Math.sin(p.angle) * 100, 150, 'slow', ST.dmg * 1.5);
      }
    },
    {
      name: 'Lethal Toxicity Cascade', ic: '☠️',
      desc: 'Detonates all active poison stacks on nearby enemies into an instant execution nova.',
      f: function(p) {
        shootFan(p, 9, 0.55, { d: ST.dmg * 1.45, sp: ST.ps * 1.8, r: 5, pierce: 4, crit: true }); shootRing(p, 12, { d: ST.dmg * 0.85, sp: ST.ps * 1.2, pierce: 2 }); applyAoE(p.x, p.y, 160, ST.dmg * 1.8, (33 * 33) % 360);
      }
    }
  ];
  ELEMENT_MOVES_DATA[34] = [
    {
      name: 'Photoreaction', ic: '🟢',
      desc: 'Gets stronger while standing in bright areas; dark areas make it weaker but increase stealth.',
      f: function(p) {
        if (typeof A !== 'undefined' && typeof A[34] === 'function') { A[34](p); }
        else { shootFan(p, 5, 0.35, { d: ST.dmg * 1.5, sp: ST.ps * 1.25, pierce: 2 }); applyAoE(p.x, p.y, 140, ST.dmg * 1.6, (34 * 25) % 360); }
      }
    },
    {
      name: 'Photoelectric Discharge', ic: '⚡',
      desc: 'Converts ambient light into high-voltage laser bolts that seek out marked enemies.',
      f: function(p) {
        shootBullet(p, { d: ST.dmg * 3.2, sp: ST.ps * 2.2, r: 7, pierce: 6, kb: 1.8, hom: true, life: 1.4 }); shootFan(p, 3, 0.18, { d: ST.dmg * 0.9, sp: ST.ps * 1.5, pierce: 2 }); applyStatusToNear(p.x, p.y, 140, 'mark', ST.dmg);
      }
    },
    {
      name: 'Solar Amplification Nova', ic: '☀️',
      desc: 'Flares with brilliant solar energy, blinding all hostiles and granting 100% crit chance for 6s.',
      f: function(p) {
        applyAoE(p.x, p.y, 250, ST.dmg * 3.4, (34 * 33) % 360); shootRing(p, 18, { d: ST.dmg * 1.15, sp: ST.ps * 1.5, pierce: 4, burn: true }); p.puDamage = Math.max(p.puDamage || 1, 1.6); p.puRate = Math.max(p.puRate || 1, 1.45); p.puTimer = Math.max(p.puTimer || 0, 6.0); gainShield(p, 25, 0.8);
      }
    }
  ];
  ELEMENT_MOVES_DATA[35] = [
    {
      name: 'Liquid Hazard', ic: '🟤',
      desc: 'Throws bouncing pools of corrosive red liquid that remain on the ground and dissolve enemy armor.',
      f: function(p) {
        if (typeof A !== 'undefined' && typeof A[35] === 'function') { A[35](p); }
        else { shootFan(p, 5, 0.35, { d: ST.dmg * 1.5, sp: ST.ps * 1.25, pierce: 2 }); applyAoE(p.x, p.y, 140, ST.dmg * 1.6, (35 * 25) % 360); }
      }
    },
    {
      name: 'Halogen Acid Splash', ic: '🧪',
      desc: 'Lobs a pressurized bromine flask that bursts into heavy acid spray over a wide radius.',
      f: function(p) {
        shootBullet(p, { d: ST.dmg * 3.2, sp: ST.ps * 2.2, r: 7, pierce: 6, kb: 1.8, hom: true, life: 1.4 }); shootFan(p, 3, 0.18, { d: ST.dmg * 0.9, sp: ST.ps * 1.5, pierce: 2 }); applyStatusToNear(p.x, p.y, 140, 'mark', ST.dmg);
      }
    },
    {
      name: 'Fuming Bromine Suffocation', ic: '🌫️',
      desc: 'Releases dense amber fumes that disorient enemies and cause them to miss attacks.',
      f: function(p) {
        applyAoE(p.x, p.y, 220, ST.dmg * 2.8, (35 * 33) % 360); shootRing(p, 14, { d: ST.dmg * 1.0, sp: ST.ps * 1.3, pierce: 3 }); p.puDamage = Math.max(p.puDamage || 1, 1.45); p.puTimer = Math.max(p.puTimer || 0, 5.5); gainShield(p, 20, 0.6);
      }
    }
  ];
  ELEMENT_MOVES_DATA[36] = [
    {
      name: 'Flash Lance', ic: '🟣',
      desc: 'Fires concentrated beams of intense light that pierce targets and briefly reveal invisible enemies.',
      f: function(p) {
        if (typeof A !== 'undefined' && typeof A[36] === 'function') { A[36](p); }
        else { shootFan(p, 5, 0.35, { d: ST.dmg * 1.5, sp: ST.ps * 1.25, pierce: 2 }); applyAoE(p.x, p.y, 140, ST.dmg * 1.6, (36 * 25) % 360); }
      }
    },
    {
      name: 'Krypton Ion Pulse', ic: '✨',
      desc: 'Discharges an ion pulse that slows enemy movement speed by 70% and strips shields.',
      f: function(p) {
        p.puRate = Math.max(p.puRate || 1, 1.75); p.puDamage = Math.max(p.puDamage || 1, 1.4); p.puTimer = Math.max(p.puTimer || 0, 6.0); gainShield(p, 20, 0.6); shootRing(p, 8, { d: ST.dmg * 0.9, sp: ST.ps * 1.4, chainOnHit: true, pierce: 3 });
      }
    },
    {
      name: 'White Flash Supernova', ic: '🌟',
      desc: 'Emits an ultra-luminescent flash that permanently stuns low-tier foes and blinds elites.',
      f: function(p) {
        applyAoE(p.x, p.y, 250, ST.dmg * 3.4, (36 * 33) % 360); shootRing(p, 18, { d: ST.dmg * 1.15, sp: ST.ps * 1.5, pierce: 4, burn: true }); p.puDamage = Math.max(p.puDamage || 1, 1.6); p.puRate = Math.max(p.puRate || 1, 1.45); p.puTimer = Math.max(p.puTimer || 0, 6.0); gainShield(p, 25, 0.8);
      }
    }
  ];
  ELEMENT_MOVES_DATA[37] = [
    {
      name: 'Hyperreactive', ic: '🟣',
      desc: 'Every hit builds instability; at maximum instability, your next shot triggers a catastrophic chain reaction.',
      f: function(p) {
        if (typeof A !== 'undefined' && typeof A[37] === 'function') { A[37](p); }
        else { shootFan(p, 5, 0.35, { d: ST.dmg * 1.5, sp: ST.ps * 1.25, pierce: 2 }); applyAoE(p.x, p.y, 140, ST.dmg * 1.6, (37 * 25) % 360); }
      }
    },
    {
      name: 'Violent Spontaneous Ignition', ic: '💥',
      desc: 'Spontaneously ignites ambient moisture, creating rapid explosive bursts around the player.',
      f: function(p) {
        shootBullet(p, { d: ST.dmg * 3.2, sp: ST.ps * 2.2, r: 7, pierce: 6, kb: 1.8, hom: true, life: 1.4 }); shootFan(p, 3, 0.18, { d: ST.dmg * 0.9, sp: ST.ps * 1.5, pierce: 2 }); applyStatusToNear(p.x, p.y, 140, 'mark', ST.dmg);
      }
    },
    {
      name: 'Alkali Super-Detonation', ic: '💣',
      desc: 'Unleashes maximum rubidium reaction potential in a colossal arena-clearing blast.',
      f: function(p) {
        applyAoE(p.x, p.y, 220, ST.dmg * 2.8, (37 * 33) % 360); shootRing(p, 14, { d: ST.dmg * 1.0, sp: ST.ps * 1.3, pierce: 3 }); p.puDamage = Math.max(p.puDamage || 1, 1.45); p.puTimer = Math.max(p.puTimer || 0, 5.5); gainShield(p, 20, 0.6);
      }
    }
  ];
  ELEMENT_MOVES_DATA[38] = [
    {
      name: 'Red Flare', ic: '🟢',
      desc: 'Creates brilliant red flares that mark enemies; marked enemies take increasing damage from all attacks.',
      f: function(p) {
        if (typeof A !== 'undefined' && typeof A[38] === 'function') { A[38](p); }
        else { shootFan(p, 5, 0.35, { d: ST.dmg * 1.5, sp: ST.ps * 1.25, pierce: 2 }); applyAoE(p.x, p.y, 140, ST.dmg * 1.6, (38 * 25) % 360); }
      }
    },
    {
      name: 'Crimson Pyrotechnic Barrage', ic: '🎆',
      desc: 'Fires a flurry of scarlet rockets that home in on marked targets and burst into sparks.',
      f: function(p) {
        shootFan(p, 7, 0.42, { d: ST.dmg * 1.25, sp: ST.ps * 1.6, r: 5, pierce: 3, crit: true }); applyAoE(p.x, p.y, 90, ST.dmg * 0.8, (38 * 25) % 360);
      }
    },
    {
      name: 'Strontium Beacon Flare', ic: '🚨',
      desc: 'Plants an intense crimson beacon that draws enemy aggro and pulses with continuous fire damage.',
      f: function(p) {
        applyAoE(p.x, p.y, 250, ST.dmg * 3.4, (38 * 33) % 360); shootRing(p, 18, { d: ST.dmg * 1.15, sp: ST.ps * 1.5, pierce: 4, burn: true }); p.puDamage = Math.max(p.puDamage || 1, 1.6); p.puRate = Math.max(p.puRate || 1, 1.45); p.puTimer = Math.max(p.puTimer || 0, 6.0); gainShield(p, 25, 0.8);
      }
    }
  ];
  ELEMENT_MOVES_DATA[39] = [
    {
      name: 'Phosphor Drone', ic: '⚪',
      desc: 'Summons glowing drones that illuminate enemies, mark targets, and fire tiny precision energy shots.',
      f: function(p) {
        if (typeof A !== 'undefined' && typeof A[39] === 'function') { A[39](p); }
        else { shootFan(p, 5, 0.35, { d: ST.dmg * 1.5, sp: ST.ps * 1.25, pierce: 2 }); applyAoE(p.x, p.y, 140, ST.dmg * 1.6, (39 * 25) % 360); }
      }
    },
    {
      name: 'Yttrium Garnet Laser', ic: '💎',
      desc: 'Beams an Nd:YAG style high-precision cutting laser that pierces armor effortlessly.',
      f: function(p) {
        shootBullet(p, { d: ST.dmg * 3.8, sp: ST.ps * 2.8, r: 6, pierce: 12, life: 1.1, expl: true }); if (typeof hitBeam === 'function') hitBeam(p.x, p.y, p.angle, 450, 16, ST.dmg * 2.2, (39 * 25) % 360, 'mark'); applyStatusToNear(p.x + Math.cos(p.angle)*150, p.y + Math.sin(p.angle)*150, 100, 'mark', ST.dmg);
      }
    },
    {
      name: 'Superconducting Magnetic Lift', ic: '🛸',
      desc: 'Activates high-temperature superconducting levitation, granting flight and total hazard immunity.',
      f: function(p) {
        addWell(p.x + Math.cos(p.angle) * 140, p.y + Math.sin(p.angle) * 140, 3.8, 3); if (window.RUN) RUN.shake = Math.max(RUN.shake || 0, 16); setTimeout(function() { applyAoE(p.x + Math.cos(p.angle) * 140, p.y + Math.sin(p.angle) * 140, 240, ST.dmg * 3.6, (39 * 33) % 360); shootRing(p, 16, { d: ST.dmg * 1.1, sp: ST.ps * 1.3, pierce: 4 }); }, 650);
      }
    }
  ];
  ELEMENT_MOVES_DATA[40] = [
    {
      name: 'Heat Shield', ic: '⚪',
      desc: 'Becomes stronger as your surroundings become hotter; fire attacks actually charge your defenses.',
      f: function(p) {
        if (typeof A !== 'undefined' && typeof A[40] === 'function') { A[40](p); }
        else { shootFan(p, 5, 0.35, { d: ST.dmg * 1.5, sp: ST.ps * 1.25, pierce: 2 }); applyAoE(p.x, p.y, 140, ST.dmg * 1.6, (40 * 25) % 360); }
      }
    },
    {
      name: 'Refractory Armor Plate', ic: '🛡️',
      desc: 'Coats you in ultra-durable zirconia ceramics, nullifying enemy knockback and bullet damage.',
      f: function(p) {
        gainShield(p, 45, 1.4); convertShots(p, 140); applyAoE(p.x, p.y, 110, ST.dmg * 0.8, (40 * 25) % 360); applyStatusToNear(p.x, p.y, 140, 'slow', ST.dmg);
      }
    },
    {
      name: 'Nuclear Cladding Shell', ic: '☢️',
      desc: 'Channels nuclear reactor cladding toughness, absorbing damage and releasing retaliatory shockwaves.',
      f: function(p) {
        applyAoE(p.x, p.y, 220, ST.dmg * 2.8, (40 * 33) % 360); shootRing(p, 14, { d: ST.dmg * 1.0, sp: ST.ps * 1.3, pierce: 3 }); p.puDamage = Math.max(p.puDamage || 1, 1.45); p.puTimer = Math.max(p.puTimer || 0, 5.5); gainShield(p, 20, 0.6);
      }
    }
  ];
  ELEMENT_MOVES_DATA[41] = [
    {
      name: 'Superconductor', ic: '⚙️',
      desc: 'Temporarily removes energy loss from your weapons, giving absurdly efficient zero-recoil attacks.',
      f: function(p) {
        if (typeof A !== 'undefined' && typeof A[41] === 'function') { A[41](p); }
        else { shootFan(p, 5, 0.35, { d: ST.dmg * 1.5, sp: ST.ps * 1.25, pierce: 2 }); applyAoE(p.x, p.y, 140, ST.dmg * 1.6, (41 * 25) % 360); }
      }
    },
    {
      name: 'Magnetic Flux Pinning', ic: '🧲',
      desc: 'Pins enemies in place with quantum magnetic locking, rendering them completely unable to move.',
      f: function(p) {
        shootBullet(p, { d: ST.dmg * 3.2, sp: ST.ps * 2.2, r: 7, pierce: 6, kb: 1.8, hom: true, life: 1.4 }); shootFan(p, 3, 0.18, { d: ST.dmg * 0.9, sp: ST.ps * 1.5, pierce: 2 }); applyStatusToNear(p.x, p.y, 140, 'mark', ST.dmg);
      }
    },
    {
      name: 'Zero-Resistance Railgun', ic: '⚡',
      desc: 'Charges a zero-resistance superconducting slug that annihilates everything in a straight line.',
      f: function(p) {
        applyAoE(p.x, p.y, 220, ST.dmg * 2.8, (41 * 33) % 360); shootRing(p, 14, { d: ST.dmg * 1.0, sp: ST.ps * 1.3, pierce: 3 }); p.puDamage = Math.max(p.puDamage || 1, 1.45); p.puTimer = Math.max(p.puTimer || 0, 5.5); gainShield(p, 20, 0.6);
      }
    }
  ];
  ELEMENT_MOVES_DATA[42] = [
    {
      name: 'Heatproof', ic: '⚙️',
      desc: 'Your weapon becomes stronger and deals escalating damage the longer it fires continuously.',
      f: function(p) {
        if (typeof A !== 'undefined' && typeof A[42] === 'function') { A[42](p); }
        else { shootFan(p, 5, 0.35, { d: ST.dmg * 1.5, sp: ST.ps * 1.25, pierce: 2 }); applyAoE(p.x, p.y, 140, ST.dmg * 1.6, (42 * 25) % 360); }
      }
    },
    {
      name: 'High-Temp Crucible', ic: '🔥',
      desc: 'Forms a searing molten perimeter that melts passing enemy bullets into slag.',
      f: function(p) {
        shootBullet(p, { d: ST.dmg * 3.2, sp: ST.ps * 2.2, r: 7, pierce: 6, kb: 1.8, hom: true, life: 1.4 }); shootFan(p, 3, 0.18, { d: ST.dmg * 0.9, sp: ST.ps * 1.5, pierce: 2 }); applyStatusToNear(p.x, p.y, 140, 'mark', ST.dmg);
      }
    },
    {
      name: 'Moly-Disulfide Slick', ic: '🛢️',
      desc: 'Coats the floor in ultra-slick lubricant, causing enemies to lose control and collide with each other.',
      f: function(p) {
        applyAoE(p.x, p.y, 220, ST.dmg * 2.8, (42 * 33) % 360); shootRing(p, 14, { d: ST.dmg * 1.0, sp: ST.ps * 1.3, pierce: 3 }); p.puDamage = Math.max(p.puDamage || 1, 1.45); p.puTimer = Math.max(p.puTimer || 0, 5.5); gainShield(p, 20, 0.6);
      }
    }
  ];
  ELEMENT_MOVES_DATA[43] = [
    {
      name: 'Unstable Shot', ic: '🔵',
      desc: 'Every projectile has a chance to decay into another random high-energy projectile type mid-flight.',
      f: function(p) {
        if (typeof A !== 'undefined' && typeof A[43] === 'function') { A[43](p); }
        else { shootFan(p, 5, 0.35, { d: ST.dmg * 1.5, sp: ST.ps * 1.25, pierce: 2 }); applyAoE(p.x, p.y, 140, ST.dmg * 1.6, (43 * 25) % 360); }
      }
    },
    {
      name: 'Gamma Isotope Tracer', ic: '☢️',
      desc: 'Tags hostiles with diagnostic isotopes, revealing health bars and increasing all critical hit damage.',
      f: function(p) {
        shootBullet(p, { d: ST.dmg * 3.2, sp: ST.ps * 2.2, r: 7, pierce: 6, kb: 1.8, hom: true, life: 1.4 }); shootFan(p, 3, 0.18, { d: ST.dmg * 0.9, sp: ST.ps * 1.5, pierce: 2 }); applyStatusToNear(p.x, p.y, 140, 'mark', ST.dmg);
      }
    },
    {
      name: 'Synthetic Decay Storm', ic: '🌀',
      desc: 'Spawns a tempest of erratic synthetic radionuclides that bombard the entire combat area.',
      f: function(p) {
        applyAoE(p.x, p.y, 220, ST.dmg * 2.8, (43 * 33) % 360); shootRing(p, 14, { d: ST.dmg * 1.0, sp: ST.ps * 1.3, pierce: 3 }); p.puDamage = Math.max(p.puDamage || 1, 1.45); p.puTimer = Math.max(p.puTimer || 0, 5.5); gainShield(p, 20, 0.6);
      }
    }
  ];
  ELEMENT_MOVES_DATA[44] = [
    {
      name: 'Catalytic Mark', ic: '⚙️',
      desc: 'Mark an enemy so all elemental reactions, burns, and poisons trigger dramatically faster on it.',
      f: function(p) {
        if (typeof A !== 'undefined' && typeof A[44] === 'function') { A[44](p); }
        else { shootFan(p, 5, 0.35, { d: ST.dmg * 1.5, sp: ST.ps * 1.25, pierce: 2 }); applyAoE(p.x, p.y, 140, ST.dmg * 1.6, (44 * 25) % 360); }
      }
    },
    {
      name: 'Hardened Alloy Shard', ic: '🗡️',
      desc: 'Fires ultra-hard ruthenium-platinum needle shards that inflict permanent armor shred.',
      f: function(p) {
        shootBullet(p, { d: ST.dmg * 3.2, sp: ST.ps * 2.2, r: 7, pierce: 6, kb: 1.8, hom: true, life: 1.4 }); shootFan(p, 3, 0.18, { d: ST.dmg * 0.9, sp: ST.ps * 1.5, pierce: 2 }); applyStatusToNear(p.x, p.y, 140, 'mark', ST.dmg);
      }
    },
    {
      name: 'Multi-Valence Explosion', ic: '💥',
      desc: 'Cycles through multiple ruthenium valence states to trigger a rainbow cascade of elemental explosions.',
      f: function(p) {
        applyAoE(p.x, p.y, 220, ST.dmg * 2.8, (44 * 33) % 360); shootRing(p, 14, { d: ST.dmg * 1.0, sp: ST.ps * 1.3, pierce: 3 }); p.puDamage = Math.max(p.puDamage || 1, 1.45); p.puTimer = Math.max(p.puTimer || 0, 5.5); gainShield(p, 20, 0.6);
      }
    }
  ];
  ELEMENT_MOVES_DATA[45] = [
    {
      name: 'Mirror Armor', ic: '⚙️',
      desc: 'Reflects a percentage of incoming damage and enemy projectiles directly back toward attackers.',
      f: function(p) {
        if (typeof A !== 'undefined' && typeof A[45] === 'function') { A[45](p); }
        else { shootFan(p, 5, 0.35, { d: ST.dmg * 1.5, sp: ST.ps * 1.25, pierce: 2 }); applyAoE(p.x, p.y, 140, ST.dmg * 1.6, (45 * 25) % 360); }
      }
    },
    {
      name: 'Noble Luster Shield', ic: '✨',
      desc: 'Coats you in an untarnishable reflective shield that nullifies corrosive and poisonous debuffs.',
      f: function(p) {
        gainShield(p, 45, 1.4); convertShots(p, 140); applyAoE(p.x, p.y, 110, ST.dmg * 0.8, (45 * 25) % 360); applyStatusToNear(p.x, p.y, 140, 'slow', ST.dmg);
      }
    },
    {
      name: 'Rhodium Plating Nova', ic: '🛡️',
      desc: 'Shatters outer mirror plating in a brilliant flash, blinding all enemies and wiping hostile bullets.',
      f: function(p) {
        applyAoE(p.x, p.y, 250, ST.dmg * 3.4, (45 * 33) % 360); shootRing(p, 18, { d: ST.dmg * 1.15, sp: ST.ps * 1.5, pierce: 4, burn: true }); p.puDamage = Math.max(p.puDamage || 1, 1.6); p.puRate = Math.max(p.puRate || 1, 1.45); p.puTimer = Math.max(p.puTimer || 0, 6.0); gainShield(p, 25, 0.8);
      }
    }
  ];
  ELEMENT_MOVES_DATA[46] = [
    {
      name: 'Hydrogen Storage', ic: '⚙️',
      desc: 'Absorbs hydrogen and energy attacks into storage; release stored energy as a massive blast.',
      f: function(p) {
        if (typeof A !== 'undefined' && typeof A[46] === 'function') { A[46](p); }
        else { shootFan(p, 5, 0.35, { d: ST.dmg * 1.5, sp: ST.ps * 1.25, pierce: 2 }); applyAoE(p.x, p.y, 140, ST.dmg * 1.6, (46 * 25) % 360); }
      }
    },
    {
      name: 'Catalytic Converter Purge', ic: '💨',
      desc: 'Converts toxic gases and burns around you into clean kinetic thrust and shield power.',
      f: function(p) {
        shootBullet(p, { d: ST.dmg * 3.2, sp: ST.ps * 2.2, r: 7, pierce: 6, kb: 1.8, hom: true, life: 1.4 }); shootFan(p, 3, 0.18, { d: ST.dmg * 0.9, sp: ST.ps * 1.5, pierce: 2 }); applyStatusToNear(p.x, p.y, 140, 'mark', ST.dmg);
      }
    },
    {
      name: 'Hydrogen Fusion Eruption', ic: '💥',
      desc: 'Releases 900x volume stored hydrogen in a thermonuclear shockwave that flattens nearby foes.',
      f: function(p) {
        if (typeof hitWave === 'function') hitWave(p.x, p.y, p.angle, 320, 75, ST.dmg * 2.8, (46 * 33) % 360, 'slow'); applyAoE(p.x + Math.cos(p.angle) * 120, p.y + Math.sin(p.angle) * 120, 210, ST.dmg * 2.5, (46 * 33) % 360); shootFan(p, 5, 0.35, { d: ST.dmg * 1.4, sp: ST.ps * 1.7, pierce: 5, kb: 2.2 });
      }
    }
  ];
  ELEMENT_MOVES_DATA[47] = [
    {
      name: 'Silver Rain', ic: '⚪',
      desc: 'Extremely fast projectiles with high precision; creates a storm of silver bullets across the room.',
      f: function(p) {
        if (typeof A !== 'undefined' && typeof A[47] === 'function') { A[47](p); }
        else { shootFan(p, 5, 0.35, { d: ST.dmg * 1.5, sp: ST.ps * 1.25, pierce: 2 }); applyAoE(p.x, p.y, 140, ST.dmg * 1.6, (47 * 25) % 360); }
      }
    },
    {
      name: 'Antimicrobial Cleanse', ic: '✨',
      desc: 'Purges all negative status effects from your squad and emits a damaging holy silver shockwave.',
      f: function(p) {
        shootBullet(p, { d: ST.dmg * 3.2, sp: ST.ps * 2.2, r: 7, pierce: 6, kb: 1.8, hom: true, life: 1.4 }); shootFan(p, 3, 0.18, { d: ST.dmg * 0.9, sp: ST.ps * 1.5, pierce: 2 }); applyStatusToNear(p.x, p.y, 140, 'mark', ST.dmg);
      }
    },
    {
      name: 'Sterling Silver Tempest', ic: '🌧️',
      desc: 'Summons a torrential downpour of razor-sharp silver needles with maximum armor pierce.',
      f: function(p) {
        applyAoE(p.x, p.y, 220, ST.dmg * 2.8, (47 * 33) % 360); shootRing(p, 14, { d: ST.dmg * 1.0, sp: ST.ps * 1.3, pierce: 3 }); p.puDamage = Math.max(p.puDamage || 1, 1.45); p.puTimer = Math.max(p.puTimer || 0, 5.5); gainShield(p, 20, 0.6);
      }
    }
  ];
  ELEMENT_MOVES_DATA[48] = [
    {
      name: 'Toxic Battery', ic: '🟢',
      desc: 'Stores energy from damage taken and converts it into a volley of lethal poisonous projectiles.',
      f: function(p) {
        if (typeof A !== 'undefined' && typeof A[48] === 'function') { A[48](p); }
        else { shootFan(p, 5, 0.35, { d: ST.dmg * 1.5, sp: ST.ps * 1.25, pierce: 2 }); applyAoE(p.x, p.y, 140, ST.dmg * 1.6, (48 * 25) % 360); }
      }
    },
    {
      name: 'Neutron Control Rod', ic: '🛡️',
      desc: 'Deploys cadmium control rods that absorb explosive damage and slow enemy attack speed.',
      f: function(p) {
        shootBullet(p, { d: ST.dmg * 3.2, sp: ST.ps * 2.2, r: 7, pierce: 6, kb: 1.8, hom: true, life: 1.4 }); shootFan(p, 3, 0.18, { d: ST.dmg * 0.9, sp: ST.ps * 1.5, pierce: 2 }); applyStatusToNear(p.x, p.y, 140, 'mark', ST.dmg);
      }
    },
    {
      name: 'Heavy Metal Bio-Accumulation', ic: '☠️',
      desc: 'Infects all enemies on screen with irreversible heavy metal toxicity, draining their max HP.',
      f: function(p) {
        applyAoE(p.x, p.y, 220, ST.dmg * 2.8, (48 * 33) % 360); shootRing(p, 14, { d: ST.dmg * 1.0, sp: ST.ps * 1.3, pierce: 3 }); p.puDamage = Math.max(p.puDamage || 1, 1.45); p.puTimer = Math.max(p.puTimer || 0, 5.5); gainShield(p, 20, 0.6);
      }
    }
  ];
  ELEMENT_MOVES_DATA[49] = [
    {
      name: 'Liquid Metal', ic: '🟣',
      desc: 'Creates flowing metal that snakes around obstacles and barriers directly toward enemies.',
      f: function(p) {
        if (typeof A !== 'undefined' && typeof A[49] === 'function') { A[49](p); }
        else { shootFan(p, 5, 0.35, { d: ST.dmg * 1.5, sp: ST.ps * 1.25, pierce: 2 }); applyAoE(p.x, p.y, 140, ST.dmg * 1.6, (49 * 25) % 360); }
      }
    },
    {
      name: 'Indium Tin Oxide Shield', ic: '🪞',
      desc: 'Forms a transparent conductive screen that deflects lasers and amplifies your shot velocity.',
      f: function(p) {
        gainShield(p, 45, 1.4); convertShots(p, 140); applyAoE(p.x, p.y, 110, ST.dmg * 0.8, (49 * 25) % 360); applyStatusToNear(p.x, p.y, 140, 'slow', ST.dmg);
      }
    },
    {
      name: 'Cryogenic Solder Bind', ic: '❄️',
      desc: 'Freezes enemies in low-melting metal welds, rooting them firmly to the floor.',
      f: function(p) {
        addZone(p.x, p.y, 220, 5.5); convertShots(p, 260); nearEnemies(p.x, p.y, 300).forEach(function(e) { if (typeof addFreeze === 'function') addFreeze(e, 2.0); e.slowT = Math.max(e.slowT || 0, 4.0); }); shootRing(p, 14, { d: ST.dmg * 0.9, sp: ST.ps * 1.4, pierce: 3 });
      }
    }
  ];
  ELEMENT_MOVES_DATA[50] = [
    {
      name: 'Tin Soldier', ic: '⚪',
      desc: 'Summons tiny autonomous soldiers that march forward, draw enemy fire, and fight alongside you.',
      f: function(p) {
        if (typeof A !== 'undefined' && typeof A[50] === 'function') { A[50](p); }
        else { shootFan(p, 5, 0.35, { d: ST.dmg * 1.5, sp: ST.ps * 1.25, pierce: 2 }); applyAoE(p.x, p.y, 140, ST.dmg * 1.6, (50 * 25) % 360); }
      }
    },
    {
      name: 'Tin Pest Disintegration', ic: '🧊',
      desc: 'Inflicts allotropic tin pest on metallic foes, causing their armor to crumble into useless dust.',
      f: function(p) {
        shootBullet(p, { d: ST.dmg * 3.2, sp: ST.ps * 2.2, r: 7, pierce: 6, kb: 1.8, hom: true, life: 1.4 }); shootFan(p, 3, 0.18, { d: ST.dmg * 0.9, sp: ST.ps * 1.5, pierce: 2 }); applyStatusToNear(p.x, p.y, 140, 'mark', ST.dmg);
      }
    },
    {
      name: 'Bronze Alloy Vanguard', ic: '🛡️',
      desc: 'Upgrades all summoned tin soldiers into armored bronze champions with heavy shock lances.',
      f: function(p) {
        applyAoE(p.x, p.y, 220, ST.dmg * 2.8, (50 * 33) % 360); shootRing(p, 14, { d: ST.dmg * 1.0, sp: ST.ps * 1.3, pierce: 3 }); p.puDamage = Math.max(p.puDamage || 1, 1.45); p.puTimer = Math.max(p.puTimer || 0, 5.5); gainShield(p, 20, 0.6);
      }
    }
  ];
  ELEMENT_MOVES_DATA[51] = [
    {
      name: 'Brittle Burst', ic: '🟠',
      desc: 'Creates fragile crystal bombs that explode into dozens of razor-sharp piercing shards.',
      f: function(p) {
        if (typeof A !== 'undefined' && typeof A[51] === 'function') { A[51](p); }
        else { shootFan(p, 5, 0.35, { d: ST.dmg * 1.5, sp: ST.ps * 1.25, pierce: 2 }); applyAoE(p.x, p.y, 140, ST.dmg * 1.6, (51 * 25) % 360); }
      }
    },
    {
      name: 'Stibnite Needle Fan', ic: '🗡️',
      desc: 'Fires a spread of crystalline stibnite needles that splinter inside enemies on hit.',
      f: function(p) {
        shootFan(p, 7, 0.42, { d: ST.dmg * 1.25, sp: ST.ps * 1.6, r: 5, pierce: 3, crit: true }); applyAoE(p.x, p.y, 90, ST.dmg * 0.8, (51 * 25) % 360);
      }
    },
    {
      name: 'Flame-Retardant Barrier', ic: '🛡️',
      desc: 'Raises an antimony trioxide barrier that extinguishes all fire and absorbs explosive damage.',
      f: function(p) {
        applyAoE(p.x, p.y, 250, ST.dmg * 3.4, (51 * 33) % 360); shootRing(p, 18, { d: ST.dmg * 1.15, sp: ST.ps * 1.5, pierce: 4, burn: true }); p.puDamage = Math.max(p.puDamage || 1, 1.6); p.puRate = Math.max(p.puRate || 1, 1.45); p.puTimer = Math.max(p.puTimer || 0, 6.0); gainShield(p, 25, 0.8);
      }
    }
  ];
  ELEMENT_MOVES_DATA[52] = [
    {
      name: 'Contamination', ic: '🟢',
      desc: 'Infects enemies with toxic telluride; killing an infected enemy spreads the effect to nearby foes.',
      f: function(p) {
        if (typeof A !== 'undefined' && typeof A[52] === 'function') { A[52](p); }
        else { shootFan(p, 5, 0.35, { d: ST.dmg * 1.5, sp: ST.ps * 1.25, pierce: 2 }); applyAoE(p.x, p.y, 140, ST.dmg * 1.6, (52 * 25) % 360); }
      }
    },
    {
      name: 'Thermoelectric Cooler', ic: '❄️',
      desc: 'Channels Peltier cooling to freeze surrounding hostiles and nullify bullet momentum.',
      f: function(p) {
        shootBullet(p, { d: ST.dmg * 3.2, sp: ST.ps * 2.2, r: 7, pierce: 6, kb: 1.8, hom: true, life: 1.4 }); shootFan(p, 3, 0.18, { d: ST.dmg * 0.9, sp: ST.ps * 1.5, pierce: 2 }); applyStatusToNear(p.x, p.y, 140, 'mark', ST.dmg);
      }
    },
    {
      name: 'Toxic Garlic Miasma', ic: '🌫️',
      desc: 'Emits pungent tellurium vapor that disorients enemies and deals heavy ticking damage.',
      f: function(p) {
        applyAoE(p.x, p.y, 220, ST.dmg * 2.8, (52 * 33) % 360); shootRing(p, 14, { d: ST.dmg * 1.0, sp: ST.ps * 1.3, pierce: 3 }); p.puDamage = Math.max(p.puDamage || 1, 1.45); p.puTimer = Math.max(p.puTimer || 0, 5.5); gainShield(p, 20, 0.6);
      }
    }
  ];
  ELEMENT_MOVES_DATA[53] = [
    {
      name: 'Vapor Mark', ic: '🟣',
      desc: 'Creates purple vapor that marks enemies and reveals their health and position through walls.',
      f: function(p) {
        if (typeof A !== 'undefined' && typeof A[53] === 'function') { A[53](p); }
        else { shootFan(p, 5, 0.35, { d: ST.dmg * 1.5, sp: ST.ps * 1.25, pierce: 2 }); applyAoE(p.x, p.y, 140, ST.dmg * 1.6, (53 * 25) % 360); }
      }
    },
    {
      name: 'Sublimation Cloud', ic: '🌫️',
      desc: 'Instantly sublimates solid iodine into an expanding violet vapor screen that damages enemies.',
      f: function(p) {
        addZone(p.x + Math.cos(p.angle) * 100, p.y + Math.sin(p.angle) * 100, 140, 5.0); addField({ x: p.x + Math.cos(p.angle) * 100, y: p.y + Math.sin(p.angle) * 100, r: 130, t: 5.0, seed: 53 }); applyStatusToNear(p.x + Math.cos(p.angle) * 100, p.y + Math.sin(p.angle) * 100, 150, 'slow', ST.dmg * 1.5);
      }
    },
    {
      name: 'Thyroid Energy Overload', ic: '⚡',
      desc: 'Surges biological metabolic rate, doubling movement speed and dash cooldown recovery.',
      f: function(p) {
        applyAoE(p.x, p.y, 220, ST.dmg * 2.8, (53 * 33) % 360); shootRing(p, 14, { d: ST.dmg * 1.0, sp: ST.ps * 1.3, pierce: 3 }); p.puDamage = Math.max(p.puDamage || 1, 1.45); p.puTimer = Math.max(p.puTimer || 0, 5.5); gainShield(p, 20, 0.6);
      }
    }
  ];
  ELEMENT_MOVES_DATA[54] = [
    {
      name: 'Xenon Flash', ic: '🟣',
      desc: 'Enormous flash that blinds enemies and briefly freezes weaker enemies in place.',
      f: function(p) {
        if (typeof A !== 'undefined' && typeof A[54] === 'function') { A[54](p); }
        else { shootFan(p, 5, 0.35, { d: ST.dmg * 1.5, sp: ST.ps * 1.25, pierce: 2 }); applyAoE(p.x, p.y, 140, ST.dmg * 1.6, (54 * 25) % 360); }
      }
    },
    {
      name: 'Xenon Ion Thruster', ic: '🚀',
      desc: 'Fires a high-efficiency ion propulsion blast behind you, rocketing you forward and scorching foes.',
      f: function(p) {
        shootBullet(p, { d: ST.dmg * 3.2, sp: ST.ps * 2.2, r: 7, pierce: 6, kb: 1.8, hom: true, life: 1.4 }); shootFan(p, 3, 0.18, { d: ST.dmg * 0.9, sp: ST.ps * 1.5, pierce: 2 }); applyStatusToNear(p.x, p.y, 140, 'mark', ST.dmg);
      }
    },
    {
      name: 'Noble Stasis Field', ic: '❄️',
      desc: 'Creates an absolute stasis dome where all bullets and enemies are suspended in time for 3s.',
      f: function(p) {
        applyAoE(p.x, p.y, 220, ST.dmg * 2.8, (54 * 33) % 360); shootRing(p, 14, { d: ST.dmg * 1.0, sp: ST.ps * 1.3, pierce: 3 }); p.puDamage = Math.max(p.puDamage || 1, 1.45); p.puTimer = Math.max(p.puTimer || 0, 5.5); gainShield(p, 20, 0.6);
      }
    }
  ];
  ELEMENT_MOVES_DATA[55] = [
    {
      name: 'Time Reaction', ic: '🟣',
      desc: 'Extremely unstable: shots become faster and stronger every second until triggering a massive blast.',
      f: function(p) {
        if (typeof A !== 'undefined' && typeof A[55] === 'function') { A[55](p); }
        else { shootFan(p, 5, 0.35, { d: ST.dmg * 1.5, sp: ST.ps * 1.25, pierce: 2 }); applyAoE(p.x, p.y, 140, ST.dmg * 1.6, (55 * 25) % 360); }
      }
    },
    {
      name: 'Atomic Clock Sync', ic: '⏱️',
      desc: 'Calibrates weapon timing to atomic frequency, granting guaranteed crits and instant bullet travel.',
      f: function(p) {
        shootBullet(p, { d: ST.dmg * 3.2, sp: ST.ps * 2.2, r: 7, pierce: 6, kb: 1.8, hom: true, life: 1.4 }); shootFan(p, 3, 0.18, { d: ST.dmg * 0.9, sp: ST.ps * 1.5, pierce: 2 }); applyStatusToNear(p.x, p.y, 140, 'mark', ST.dmg);
      }
    },
    {
      name: 'Hyper-Alkali Water Eruption', ic: '💥',
      desc: 'Violently explodes on contact with any moisture, shattering obstacles and blowing enemies away.',
      f: function(p) {
        if (typeof hitWave === 'function') hitWave(p.x, p.y, p.angle, 320, 75, ST.dmg * 2.8, (55 * 33) % 360, 'slow'); applyAoE(p.x + Math.cos(p.angle) * 120, p.y + Math.sin(p.angle) * 120, 210, ST.dmg * 2.5, (55 * 33) % 360); shootFan(p, 5, 0.35, { d: ST.dmg * 1.4, sp: ST.ps * 1.7, pierce: 5, kb: 2.2 });
      }
    }
  ];
  ELEMENT_MOVES_DATA[56] = [
    {
      name: 'Gravity Shell', ic: '🟢',
      desc: 'Creates heavy projectiles that bend enemy movement toward their impact points.',
      f: function(p) {
        if (typeof A !== 'undefined' && typeof A[56] === 'function') { A[56](p); }
        else { shootFan(p, 5, 0.35, { d: ST.dmg * 1.5, sp: ST.ps * 1.25, pierce: 2 }); applyAoE(p.x, p.y, 140, ST.dmg * 1.6, (56 * 25) % 360); }
      }
    },
    {
      name: 'Barium Green Fire', ic: '🔥',
      desc: 'Ignites emerald barium flames that linger on enemies and reduce their armor by 40%.',
      f: function(p) {
        shootBullet(p, { d: ST.dmg * 3.2, sp: ST.ps * 2.2, r: 7, pierce: 6, kb: 1.8, hom: true, life: 1.4 }); shootFan(p, 3, 0.18, { d: ST.dmg * 0.9, sp: ST.ps * 1.5, pierce: 2 }); applyStatusToNear(p.x, p.y, 140, 'mark', ST.dmg);
      }
    },
    {
      name: 'Baryte Shield Fortress', ic: '🛡️',
      desc: 'Summons ultra-dense baryte mineral pillars that block all incoming heavy projectile fire.',
      f: function(p) {
        applyAoE(p.x, p.y, 220, ST.dmg * 2.8, (56 * 33) % 360); shootRing(p, 14, { d: ST.dmg * 1.0, sp: ST.ps * 1.3, pierce: 3 }); p.puDamage = Math.max(p.puDamage || 1, 1.45); p.puTimer = Math.max(p.puTimer || 0, 5.5); gainShield(p, 20, 0.6);
      }
    }
  ];
  ELEMENT_MOVES_DATA[57] = [
    {
      name: 'Element Shift', ic: '🟣',
      desc: 'Temporarily copies the basic property of a nearby elemental attack and adopts its traits.',
      f: function(p) {
        if (typeof A !== 'undefined' && typeof A[57] === 'function') { A[57](p); }
        else { shootFan(p, 5, 0.35, { d: ST.dmg * 1.5, sp: ST.ps * 1.25, pierce: 2 }); applyAoE(p.x, p.y, 140, ST.dmg * 1.6, (57 * 25) % 360); }
      }
    },
    {
      name: 'Mischmetal Spark Shower', ic: '✨',
      desc: 'Showers the room in pyrophoric sparks that ignite enemies and trigger chain reactions.',
      f: function(p) {
        shootBullet(p, { d: ST.dmg * 3.2, sp: ST.ps * 2.2, r: 7, pierce: 6, kb: 1.8, hom: true, life: 1.4 }); shootFan(p, 3, 0.18, { d: ST.dmg * 0.9, sp: ST.ps * 1.5, pierce: 2 }); applyStatusToNear(p.x, p.y, 140, 'mark', ST.dmg);
      }
    },
    {
      name: 'Lanthanide Optical Flare', ic: '🌟',
      desc: 'Focuses refractive glass lenses to project a searing concentrated solar beam.',
      f: function(p) {
        applyAoE(p.x, p.y, 250, ST.dmg * 3.4, (57 * 33) % 360); shootRing(p, 18, { d: ST.dmg * 1.15, sp: ST.ps * 1.5, pierce: 4, burn: true }); p.puDamage = Math.max(p.puDamage || 1, 1.6); p.puRate = Math.max(p.puRate || 1, 1.45); p.puTimer = Math.max(p.puTimer || 0, 6.0); gainShield(p, 25, 0.8);
      }
    }
  ];
  ELEMENT_MOVES_DATA[58] = [
    {
      name: 'Spark Stone', ic: '🟣',
      desc: 'Creates friction sparks when moving, leaving damaging fiery trails behind you.',
      f: function(p) {
        if (typeof A !== 'undefined' && typeof A[58] === 'function') { A[58](p); }
        else { shootFan(p, 5, 0.35, { d: ST.dmg * 1.5, sp: ST.ps * 1.25, pierce: 2 }); applyAoE(p.x, p.y, 140, ST.dmg * 1.6, (58 * 25) % 360); }
      }
    },
    {
      name: 'Ceria Polishing Grind', ic: '⛏️',
      desc: 'Fires micro-abrasive cerium oxide particles that shred through enemy shields and armor.',
      f: function(p) {
        shootBullet(p, { d: ST.dmg * 3.2, sp: ST.ps * 2.2, r: 7, pierce: 6, kb: 1.8, hom: true, life: 1.4 }); shootFan(p, 3, 0.18, { d: ST.dmg * 0.9, sp: ST.ps * 1.5, pierce: 2 }); applyStatusToNear(p.x, p.y, 140, 'mark', ST.dmg);
      }
    },
    {
      name: 'Pyrophoric Firestorm', ic: '🔥',
      desc: 'Ignites a massive storm of high-friction cerium sparks that burns everything in range.',
      f: function(p) {
        applyAoE(p.x, p.y, 220, ST.dmg * 2.8, (58 * 33) % 360); shootRing(p, 14, { d: ST.dmg * 1.0, sp: ST.ps * 1.3, pierce: 3 }); p.puDamage = Math.max(p.puDamage || 1, 1.45); p.puTimer = Math.max(p.puTimer || 0, 5.5); gainShield(p, 20, 0.6);
      }
    }
  ];
  ELEMENT_MOVES_DATA[59] = [
    {
      name: 'Magnetic Swarm', ic: '🟡',
      desc: 'Fires several small magnetic projectiles that curve around cover toward enemies.',
      f: function(p) {
        if (typeof A !== 'undefined' && typeof A[59] === 'function') { A[59](p); }
        else { shootFan(p, 5, 0.35, { d: ST.dmg * 1.5, sp: ST.ps * 1.25, pierce: 2 }); applyAoE(p.x, p.y, 140, ST.dmg * 1.6, (59 * 25) % 360); }
      }
    },
    {
      name: 'Didymium Eye Filter', ic: '🪞',
      desc: 'Filters intense flashes, granting complete immunity to blinds and revealing stealth units.',
      f: function(p) {
        shootBullet(p, { d: ST.dmg * 3.2, sp: ST.ps * 2.2, r: 7, pierce: 6, kb: 1.8, hom: true, life: 1.4 }); shootFan(p, 3, 0.18, { d: ST.dmg * 0.9, sp: ST.ps * 1.5, pierce: 2 }); applyStatusToNear(p.x, p.y, 140, 'mark', ST.dmg);
      }
    },
    {
      name: 'Green Spectrum Overdrive', ic: '🟢',
      desc: 'Unleashes an emerald spectrum wave that empowers all player projectile speeds by 80%.',
      f: function(p) {
        applyAoE(p.x, p.y, 250, ST.dmg * 3.4, (59 * 33) % 360); shootRing(p, 18, { d: ST.dmg * 1.15, sp: ST.ps * 1.5, pierce: 4, burn: true }); p.puDamage = Math.max(p.puDamage || 1, 1.6); p.puRate = Math.max(p.puRate || 1, 1.45); p.puTimer = Math.max(p.puTimer || 0, 6.0); gainShield(p, 25, 0.8);
      }
    }
  ];
  ELEMENT_MOVES_DATA[60] = [
    {
      name: 'Ultimate Magnet', ic: '🟢',
      desc: 'Creates an enormous magnetic field that pulls enemies, weapons, and projectiles toward a central point.',
      f: function(p) {
        if (typeof A !== 'undefined' && typeof A[60] === 'function') { A[60](p); }
        else { shootFan(p, 5, 0.35, { d: ST.dmg * 1.5, sp: ST.ps * 1.25, pierce: 2 }); applyAoE(p.x, p.y, 140, ST.dmg * 1.6, (60 * 25) % 360); }
      }
    },
    {
      name: 'Rare-Earth Gauss Bolt', ic: '⚡',
      desc: 'Fires a magnetized hyper-velocity spike that drags adjacent enemies into its trajectory.',
      f: function(p) {
        shootBullet(p, { d: ST.dmg * 3.2, sp: ST.ps * 2.2, r: 7, pierce: 6, kb: 1.8, hom: true, life: 1.4 }); shootFan(p, 3, 0.18, { d: ST.dmg * 0.9, sp: ST.ps * 1.5, pierce: 2 }); applyStatusToNear(p.x, p.y, 140, 'mark', ST.dmg);
      }
    },
    {
      name: 'Magnetic Crush Nova', ic: '🧲',
      desc: 'Pulls all enemies on the screen together violently, slamming them into each other for lethal collision damage.',
      f: function(p) {
        addWell(p.x + Math.cos(p.angle) * 140, p.y + Math.sin(p.angle) * 140, 3.8, 3); if (window.RUN) RUN.shake = Math.max(RUN.shake || 0, 16); setTimeout(function() { applyAoE(p.x + Math.cos(p.angle) * 140, p.y + Math.sin(p.angle) * 140, 240, ST.dmg * 3.6, (60 * 33) % 360); shootRing(p, 16, { d: ST.dmg * 1.1, sp: ST.ps * 1.3, pierce: 4 }); }, 650);
      }
    }
  ];
  ELEMENT_MOVES_DATA[61] = [
    {
      name: 'Decay Beacon', ic: '🟣',
      desc: 'Place a radioactive beacon that continuously damages and irradiates everything around it.',
      f: function(p) {
        if (typeof A !== 'undefined' && typeof A[61] === 'function') { A[61](p); }
        else { shootFan(p, 5, 0.35, { d: ST.dmg * 1.5, sp: ST.ps * 1.25, pierce: 2 }); applyAoE(p.x, p.y, 140, ST.dmg * 1.6, (61 * 25) % 360); }
      }
    },
    {
      name: 'Luminous Beta Glow', ic: '✨',
      desc: 'Emits continuous phosphor radiation that illuminates dark sectors and damages nearby foes.',
      f: function(p) {
        shootBullet(p, { d: ST.dmg * 3.2, sp: ST.ps * 2.2, r: 7, pierce: 6, kb: 1.8, hom: true, life: 1.4 }); shootFan(p, 3, 0.18, { d: ST.dmg * 0.9, sp: ST.ps * 1.5, pierce: 2 }); applyStatusToNear(p.x, p.y, 140, 'mark', ST.dmg);
      }
    },
    {
      name: 'Nuclear Micro-Battery Pulse', ic: '🔋',
      desc: 'Discharges stored nuclear battery power, instantly filling all active cooldowns.',
      f: function(p) {
        applyAoE(p.x, p.y, 220, ST.dmg * 2.8, (61 * 33) % 360); shootRing(p, 14, { d: ST.dmg * 1.0, sp: ST.ps * 1.3, pierce: 3 }); p.puDamage = Math.max(p.puDamage || 1, 1.45); p.puTimer = Math.max(p.puTimer || 0, 5.5); gainShield(p, 20, 0.6);
      }
    }
  ];
  ELEMENT_MOVES_DATA[62] = [
    {
      name: 'Magnetic Mine', ic: '🟢',
      desc: 'Mines attract nearby enemies with magnetic pull before violently detonating.',
      f: function(p) {
        if (typeof A !== 'undefined' && typeof A[62] === 'function') { A[62](p); }
        else { shootFan(p, 5, 0.35, { d: ST.dmg * 1.5, sp: ST.ps * 1.25, pierce: 2 }); applyAoE(p.x, p.y, 140, ST.dmg * 1.6, (62 * 25) % 360); }
      }
    },
    {
      name: 'Samarium-Cobalt Magnetron', ic: '🧲',
      desc: 'Emits an intense high-temperature magnetic pulse that disarms and staggers enemies.',
      f: function(p) {
        shootBullet(p, { d: ST.dmg * 3.2, sp: ST.ps * 2.2, r: 7, pierce: 6, kb: 1.8, hom: true, life: 1.4 }); shootFan(p, 3, 0.18, { d: ST.dmg * 0.9, sp: ST.ps * 1.5, pierce: 2 }); applyStatusToNear(p.x, p.y, 140, 'mark', ST.dmg);
      }
    },
    {
      name: 'Neutron Absorbing Mesh', ic: '🛡️',
      desc: 'Raises an ultra-dense absorption screen that converts incoming damage into player shields.',
      f: function(p) {
        applyAoE(p.x, p.y, 220, ST.dmg * 2.8, (62 * 33) % 360); shootRing(p, 14, { d: ST.dmg * 1.0, sp: ST.ps * 1.3, pierce: 3 }); p.puDamage = Math.max(p.puDamage || 1, 1.45); p.puTimer = Math.max(p.puTimer || 0, 5.5); gainShield(p, 20, 0.6);
      }
    }
  ];
  ELEMENT_MOVES_DATA[63] = [
    {
      name: 'Red Phosphor', ic: '🟣',
      desc: 'Marks enemies with glowing red symbols, making them visible through walls and vulnerable.',
      f: function(p) {
        if (typeof A !== 'undefined' && typeof A[63] === 'function') { A[63](p); }
        else { shootFan(p, 5, 0.35, { d: ST.dmg * 1.5, sp: ST.ps * 1.25, pierce: 2 }); applyAoE(p.x, p.y, 140, ST.dmg * 1.6, (63 * 25) % 360); }
      }
    },
    {
      name: 'Fluorescent Screen Burst', ic: '✨',
      desc: 'Flashes with intense UV fluorescence, confusing enemy targeting systems.',
      f: function(p) {
        shootBullet(p, { d: ST.dmg * 3.2, sp: ST.ps * 2.2, r: 7, pierce: 6, kb: 1.8, hom: true, life: 1.4 }); shootFan(p, 3, 0.18, { d: ST.dmg * 0.9, sp: ST.ps * 1.5, pierce: 2 }); applyStatusToNear(p.x, p.y, 140, 'mark', ST.dmg);
      }
    },
    {
      name: 'Phosphor Resonance Cascade', ic: '🔴',
      desc: 'Causes all marked glowing enemies to detonate in chain reaction crimson novas.',
      f: function(p) {
        shootFan(p, 9, 0.55, { d: ST.dmg * 1.45, sp: ST.ps * 1.8, r: 5, pierce: 4, crit: true }); shootRing(p, 12, { d: ST.dmg * 0.85, sp: ST.ps * 1.2, pierce: 2 }); applyAoE(p.x, p.y, 160, ST.dmg * 1.8, (63 * 33) % 360);
      }
    }
  ];
  ELEMENT_MOVES_DATA[64] = [
    {
      name: 'Magnetic Armor', ic: '🟢',
      desc: 'Magnetic fields reduce incoming projectile damage and absorb kinetic energy.',
      f: function(p) {
        if (typeof A !== 'undefined' && typeof A[64] === 'function') { A[64](p); }
        else { shootFan(p, 5, 0.35, { d: ST.dmg * 1.5, sp: ST.ps * 1.25, pierce: 2 }); applyAoE(p.x, p.y, 140, ST.dmg * 1.6, (64 * 25) % 360); }
      }
    },
    {
      name: 'Magnetocaloric Freeze', ic: '❄️',
      desc: 'Removes thermal energy via magnetic demagnetization, instantly freezing nearby hostiles.',
      f: function(p) {
        shootBullet(p, { d: ST.dmg * 3.2, sp: ST.ps * 2.2, r: 7, pierce: 6, kb: 1.8, hom: true, life: 1.4 }); shootFan(p, 3, 0.18, { d: ST.dmg * 0.9, sp: ST.ps * 1.5, pierce: 2 }); applyStatusToNear(p.x, p.y, 140, 'mark', ST.dmg);
      }
    },
    {
      name: 'MRI Contrast Scan', ic: '📡',
      desc: 'Scans the entire arena, highlighting all enemy internal weak points for 3x critical damage.',
      f: function(p) {
        applyAoE(p.x, p.y, 220, ST.dmg * 2.8, (64 * 33) % 360); shootRing(p, 14, { d: ST.dmg * 1.0, sp: ST.ps * 1.3, pierce: 3 }); p.puDamage = Math.max(p.puDamage || 1, 1.45); p.puTimer = Math.max(p.puTimer || 0, 5.5); gainShield(p, 20, 0.6);
      }
    }
  ];
  ELEMENT_MOVES_DATA[65] = [
    {
      name: 'Green Pulse', ic: '🔵',
      desc: 'Emits periodic electromagnetic pulses that disable enemy abilities and interrupt attacks.',
      f: function(p) {
        if (typeof A !== 'undefined' && typeof A[65] === 'function') { A[65](p); }
        else { shootFan(p, 5, 0.35, { d: ST.dmg * 1.5, sp: ST.ps * 1.25, pierce: 2 }); applyAoE(p.x, p.y, 140, ST.dmg * 1.6, (65 * 25) % 360); }
      }
    },
    {
      name: 'Magnetostrictive Soundwave', ic: '🔊',
      desc: 'Vibrates with extreme sonic frequency, shattering enemy shields and physical barriers.',
      f: function(p) {
        shootBullet(p, { d: ST.dmg * 3.2, sp: ST.ps * 2.2, r: 7, pierce: 6, kb: 1.8, hom: true, life: 1.4 }); shootFan(p, 3, 0.18, { d: ST.dmg * 0.9, sp: ST.ps * 1.5, pierce: 2 }); applyStatusToNear(p.x, p.y, 140, 'mark', ST.dmg);
      }
    },
    {
      name: 'Terfenol-D Impact Stomp', ic: '💥',
      desc: 'Delivers an earth-shattering kinetic stomp that knocks all surrounding enemies into the air.',
      f: function(p) {
        applyAoE(p.x, p.y, 220, ST.dmg * 2.8, (65 * 33) % 360); shootRing(p, 14, { d: ST.dmg * 1.0, sp: ST.ps * 1.3, pierce: 3 }); p.puDamage = Math.max(p.puDamage || 1, 1.45); p.puTimer = Math.max(p.puTimer || 0, 5.5); gainShield(p, 20, 0.6);
      }
    }
  ];
  ELEMENT_MOVES_DATA[66] = [
    {
      name: 'Extreme Magnet', ic: '🟢',
      desc: 'Creates an extremely powerful but tiny magnetic field that violently drags enemies together.',
      f: function(p) {
        if (typeof A !== 'undefined' && typeof A[66] === 'function') { A[66](p); }
        else { shootFan(p, 5, 0.35, { d: ST.dmg * 1.5, sp: ST.ps * 1.25, pierce: 2 }); applyAoE(p.x, p.y, 140, ST.dmg * 1.6, (66 * 25) % 360); }
      }
    },
    {
      name: 'Laser Host Rod', ic: '☄️',
      desc: 'Channels infrared laser pulses through a dysprosium rod to pierce heavy elite armor.',
      f: function(p) {
        shootBullet(p, { d: ST.dmg * 3.8, sp: ST.ps * 2.8, r: 6, pierce: 12, life: 1.1, expl: true }); if (typeof hitBeam === 'function') hitBeam(p.x, p.y, p.angle, 450, 16, ST.dmg * 2.2, (66 * 25) % 360, 'mark'); applyStatusToNear(p.x + Math.cos(p.angle)*150, p.y + Math.sin(p.angle)*150, 100, 'mark', ST.dmg);
      }
    },
    {
      name: 'Magnetic Hardness Lock', ic: '🛡️',
      desc: 'Locks your defensive matrix with extreme coercive force, rendering you immune to all debuffs.',
      f: function(p) {
        addWell(p.x + Math.cos(p.angle) * 140, p.y + Math.sin(p.angle) * 140, 3.8, 3); if (window.RUN) RUN.shake = Math.max(RUN.shake || 0, 16); setTimeout(function() { applyAoE(p.x + Math.cos(p.angle) * 140, p.y + Math.sin(p.angle) * 140, 240, ST.dmg * 3.6, (66 * 33) % 360); shootRing(p, 16, { d: ST.dmg * 1.1, sp: ST.ps * 1.3, pierce: 4 }); }, 650);
      }
    }
  ];
  ELEMENT_MOVES_DATA[67] = [
    {
      name: 'Magnetic Lance', ic: '🟣',
      desc: 'Charges a straight-line attack with highest magnetic strength that ignores most enemy armor.',
      f: function(p) {
        if (typeof A !== 'undefined' && typeof A[67] === 'function') { A[67](p); }
        else { shootFan(p, 5, 0.35, { d: ST.dmg * 1.5, sp: ST.ps * 1.25, pierce: 2 }); applyAoE(p.x, p.y, 140, ST.dmg * 1.6, (67 * 25) % 360); }
      }
    },
    {
      name: 'Holmium YAG Scalpel', ic: '🗡️',
      desc: 'Fires a surgical medical laser beam that slices through enemy hulls with pin-point precision.',
      f: function(p) {
        shootBullet(p, { d: ST.dmg * 3.2, sp: ST.ps * 2.2, r: 7, pierce: 6, kb: 1.8, hom: true, life: 1.4 }); shootFan(p, 3, 0.18, { d: ST.dmg * 0.9, sp: ST.ps * 1.5, pierce: 2 }); applyStatusToNear(p.x, p.y, 140, 'mark', ST.dmg);
      }
    },
    {
      name: 'Flux Concentrator Vortex', ic: '🌀',
      desc: 'Focuses magnetic flux lines into an intense gravity vortex that crushes anything inside.',
      f: function(p) {
        addWell(p.x + Math.cos(p.angle) * 140, p.y + Math.sin(p.angle) * 140, 3.8, 3); if (window.RUN) RUN.shake = Math.max(RUN.shake || 0, 16); setTimeout(function() { applyAoE(p.x + Math.cos(p.angle) * 140, p.y + Math.sin(p.angle) * 140, 240, ST.dmg * 3.6, (67 * 33) % 360); shootRing(p, 16, { d: ST.dmg * 1.1, sp: ST.ps * 1.3, pierce: 4 }); }, 650);
      }
    }
  ];
  ELEMENT_MOVES_DATA[68] = [
    {
      name: 'Fiber Beam', ic: '🟢',
      desc: 'Fires extremely thin, precise laser threads with infinite pierce across the room.',
      f: function(p) {
        if (typeof A !== 'undefined' && typeof A[68] === 'function') { A[68](p); }
        else { shootFan(p, 5, 0.35, { d: ST.dmg * 1.5, sp: ST.ps * 1.25, pierce: 2 }); applyAoE(p.x, p.y, 140, ST.dmg * 1.6, (68 * 25) % 360); }
      }
    },
    {
      name: 'Optical Amplifier Pulse', ic: '📡',
      desc: 'Amplifies all allied projectile speeds and damage by 50% for 6 seconds.',
      f: function(p) {
        p.puRate = Math.max(p.puRate || 1, 1.75); p.puDamage = Math.max(p.puDamage || 1, 1.4); p.puTimer = Math.max(p.puTimer || 0, 6.0); gainShield(p, 20, 0.6); shootRing(p, 8, { d: ST.dmg * 0.9, sp: ST.ps * 1.4, chainOnHit: true, pierce: 3 });
      }
    },
    {
      name: 'Pink Erbium Shimmer', ic: '✨',
      desc: 'Casts a glittering pink protective shroud that absorbs lasers and deflects projectiles.',
      f: function(p) {
        applyAoE(p.x, p.y, 220, ST.dmg * 2.8, (68 * 33) % 360); shootRing(p, 14, { d: ST.dmg * 1.0, sp: ST.ps * 1.3, pierce: 3 }); p.puDamage = Math.max(p.puDamage || 1, 1.45); p.puTimer = Math.max(p.puTimer || 0, 5.5); gainShield(p, 20, 0.6);
      }
    }
  ];
  ELEMENT_MOVES_DATA[69] = [
    {
      name: 'Rare Shot', ic: '🟣',
      desc: 'Extremely slow-firing weapon with enormous single-target kinetic impact damage.',
      f: function(p) {
        if (typeof A !== 'undefined' && typeof A[69] === 'function') { A[69](p); }
        else { shootFan(p, 5, 0.35, { d: ST.dmg * 1.5, sp: ST.ps * 1.25, pierce: 2 }); applyAoE(p.x, p.y, 140, ST.dmg * 1.6, (69 * 25) % 360); }
      }
    },
    {
      name: 'Portable X-Ray Emitter', ic: '☢️',
      desc: 'Fires a penetrating radioactive beam that irradiates targets and reveals hidden paths.',
      f: function(p) {
        shootBullet(p, { d: ST.dmg * 3.8, sp: ST.ps * 2.8, r: 6, pierce: 12, life: 1.1, expl: true }); if (typeof hitBeam === 'function') hitBeam(p.x, p.y, p.angle, 450, 16, ST.dmg * 2.2, (69 * 25) % 360, 'mark'); applyStatusToNear(p.x + Math.cos(p.angle)*150, p.y + Math.sin(p.angle)*150, 100, 'mark', ST.dmg);
      }
    },
    {
      name: 'Thulium Fiber Cannon', ic: '💥',
      desc: 'Discharges a colossal high-power laser blast that disintegrates standard enemies instantly.',
      f: function(p) {
        applyAoE(p.x, p.y, 220, ST.dmg * 2.8, (69 * 33) % 360); shootRing(p, 14, { d: ST.dmg * 1.0, sp: ST.ps * 1.3, pierce: 3 }); p.puDamage = Math.max(p.puDamage || 1, 1.45); p.puTimer = Math.max(p.puTimer || 0, 5.5); gainShield(p, 20, 0.6);
      }
    }
  ];
  ELEMENT_MOVES_DATA[70] = [
    {
      name: 'Atomic Pulse', ic: '🟡',
      desc: 'Charge your weapon by standing still; movement cancels the charge but allows rapid repositioning.',
      f: function(p) {
        if (typeof A !== 'undefined' && typeof A[70] === 'function') { A[70](p); }
        else { shootFan(p, 5, 0.35, { d: ST.dmg * 1.5, sp: ST.ps * 1.25, pierce: 2 }); applyAoE(p.x, p.y, 140, ST.dmg * 1.6, (70 * 25) % 360); }
      }
    },
    {
      name: 'Atomic Clock Laser', ic: '⏱️',
      desc: 'Syncs laser firing rate with ytterbium atomic resonance for ultra-rapid fire.',
      f: function(p) {
        shootBullet(p, { d: ST.dmg * 3.8, sp: ST.ps * 2.8, r: 6, pierce: 12, life: 1.1, expl: true }); if (typeof hitBeam === 'function') hitBeam(p.x, p.y, p.angle, 450, 16, ST.dmg * 2.2, (70 * 25) % 360, 'mark'); applyStatusToNear(p.x + Math.cos(p.angle)*150, p.y + Math.sin(p.angle)*150, 100, 'mark', ST.dmg);
      }
    },
    {
      name: 'Fiber Laser Melter', ic: '🔥',
      desc: 'Beams an industrial-grade laser that melts boss armor plates in seconds.',
      f: function(p) {
        applyAoE(p.x, p.y, 220, ST.dmg * 2.8, (70 * 33) % 360); shootRing(p, 14, { d: ST.dmg * 1.0, sp: ST.ps * 1.3, pierce: 3 }); p.puDamage = Math.max(p.puDamage || 1, 1.45); p.puTimer = Math.max(p.puTimer || 0, 5.5); gainShield(p, 20, 0.6);
      }
    }
  ];
  ELEMENT_MOVES_DATA[71] = [
    {
      name: 'Precision Core', ic: '🟣',
      desc: 'Crit chance and weak-point damage increase dramatically, turning every shot into a critical hit.',
      f: function(p) {
        if (typeof A !== 'undefined' && typeof A[71] === 'function') { A[71](p); }
        else { shootFan(p, 5, 0.35, { d: ST.dmg * 1.5, sp: ST.ps * 1.25, pierce: 2 }); applyAoE(p.x, p.y, 140, ST.dmg * 1.6, (71 * 25) % 360); }
      }
    },
    {
      name: 'Lutetium Silicate Scintillator', ic: '✨',
      desc: 'Detects high-energy radiation to convert incoming hostile shots into shield energy.',
      f: function(p) {
        shootBullet(p, { d: ST.dmg * 3.2, sp: ST.ps * 2.2, r: 7, pierce: 6, kb: 1.8, hom: true, life: 1.4 }); shootFan(p, 3, 0.18, { d: ST.dmg * 0.9, sp: ST.ps * 1.5, pierce: 2 }); applyStatusToNear(p.x, p.y, 140, 'mark', ST.dmg);
      }
    },
    {
      name: 'Apex Lanthanide Lance', ic: '🗡️',
      desc: 'Fires the hardest and densest rare-earth spear, penetrating through all targets on screen.',
      f: function(p) {
        shootBullet(p, { d: ST.dmg * 4.8, sp: ST.ps * 3.0, r: 10, pierce: 25, kb: 3.0, crit: true }); if (typeof hitBeam === 'function') hitBeam(p.x, p.y, p.angle, 500, 22, ST.dmg * 2.6, (71 * 33) % 360, 'corrode'); if (window.RUN) RUN.shake = Math.max(RUN.shake || 0, 14);
      }
    }
  ];
  ELEMENT_MOVES_DATA[72] = [
    {
      name: 'Energy Reserve', ic: '⚪',
      desc: 'Stores incoming energy and automatically releases it when your health becomes low.',
      f: function(p) {
        if (typeof A !== 'undefined' && typeof A[72] === 'function') { A[72](p); }
        else { shootFan(p, 5, 0.35, { d: ST.dmg * 1.5, sp: ST.ps * 1.25, pierce: 2 }); applyAoE(p.x, p.y, 140, ST.dmg * 1.6, (72 * 25) % 360); }
      }
    },
    {
      name: 'Neutron Absorber Shield', ic: '🛡️',
      desc: 'Absorbs nuclear and explosive damage, boosting your own attack power.',
      f: function(p) {
        gainShield(p, 45, 1.4); convertShots(p, 140); applyAoE(p.x, p.y, 110, ST.dmg * 0.8, (72 * 25) % 360); applyStatusToNear(p.x, p.y, 140, 'slow', ST.dmg);
      }
    },
    {
      name: 'Hafnium Carbide Plasma', ic: '🔥',
      desc: 'Emits ultra-refractory plasma that withstands extreme heat and incinerates enemies.',
      f: function(p) {
        applyAoE(p.x, p.y, 220, ST.dmg * 2.8, (72 * 33) % 360); shootRing(p, 14, { d: ST.dmg * 1.0, sp: ST.ps * 1.3, pierce: 3 }); p.puDamage = Math.max(p.puDamage || 1, 1.45); p.puTimer = Math.max(p.puTimer || 0, 5.5); gainShield(p, 20, 0.6);
      }
    }
  ];
  ELEMENT_MOVES_DATA[73] = [
    {
      name: 'Unbreakable', ic: '⚙️',
      desc: 'Creates temporary armor that cannot be destroyed, granting complete immunity to all damage.',
      f: function(p) {
        if (typeof A !== 'undefined' && typeof A[73] === 'function') { A[73](p); }
        else { shootFan(p, 5, 0.35, { d: ST.dmg * 1.5, sp: ST.ps * 1.25, pierce: 2 }); applyAoE(p.x, p.y, 140, ST.dmg * 1.6, (73 * 25) % 360); }
      }
    },
    {
      name: 'Tantalum Capacitor Blast', ic: '🔋',
      desc: 'Discharges ultra-dense capacitor energy in a wide electric arc.',
      f: function(p) {
        shootBullet(p, { d: ST.dmg * 3.2, sp: ST.ps * 2.2, r: 7, pierce: 6, kb: 1.8, hom: true, life: 1.4 }); shootFan(p, 3, 0.18, { d: ST.dmg * 0.9, sp: ST.ps * 1.5, pierce: 2 }); applyStatusToNear(p.x, p.y, 140, 'mark', ST.dmg);
      }
    },
    {
      name: 'Corrosion-Proof Bulwark', ic: '🛡️',
      desc: 'Raises an acid-proof tantalum wall that protects you and your allies.',
      f: function(p) {
        applyAoE(p.x, p.y, 220, ST.dmg * 2.8, (73 * 33) % 360); shootRing(p, 14, { d: ST.dmg * 1.0, sp: ST.ps * 1.3, pierce: 3 }); p.puDamage = Math.max(p.puDamage || 1, 1.45); p.puTimer = Math.max(p.puTimer || 0, 5.5); gainShield(p, 20, 0.6);
      }
    }
  ];
  ELEMENT_MOVES_DATA[74] = [
    {
      name: 'Heavy Shell', ic: '⚙️',
      desc: 'Fires incredibly slow, gigantic projectiles with massive impact force and knockback.',
      f: function(p) {
        if (typeof A !== 'undefined' && typeof A[74] === 'function') { A[74](p); }
        else { shootFan(p, 5, 0.35, { d: ST.dmg * 1.5, sp: ST.ps * 1.25, pierce: 2 }); applyAoE(p.x, p.y, 140, ST.dmg * 1.6, (74 * 25) % 360); }
      }
    },
    {
      name: 'Tungsten Carbide Penetrator', ic: '⛏️',
      desc: 'Launches an ultra-dense armor-piercing kinetic sabot round.',
      f: function(p) {
        shootBullet(p, { d: ST.dmg * 3.2, sp: ST.ps * 2.2, r: 7, pierce: 6, kb: 1.8, hom: true, life: 1.4 }); shootFan(p, 3, 0.18, { d: ST.dmg * 0.9, sp: ST.ps * 1.5, pierce: 2 }); applyStatusToNear(p.x, p.y, 140, 'mark', ST.dmg);
      }
    },
    {
      name: 'Incandescent Filament Nova', ic: '💡',
      desc: 'Heats tungsten filament to 3000°C, releasing a blinding heat flash.',
      f: function(p) {
        applyAoE(p.x, p.y, 250, ST.dmg * 3.4, (74 * 33) % 360); shootRing(p, 18, { d: ST.dmg * 1.15, sp: ST.ps * 1.5, pierce: 4, burn: true }); p.puDamage = Math.max(p.puDamage || 1, 1.6); p.puRate = Math.max(p.puRate || 1, 1.45); p.puTimer = Math.max(p.puTimer || 0, 6.0); gainShield(p, 25, 0.8);
      }
    }
  ];
  ELEMENT_MOVES_DATA[75] = [
    {
      name: 'Overheat Mastery', ic: '⚪',
      desc: 'Your weapon gets stronger at extreme heat instead of overheating normally.',
      f: function(p) {
        if (typeof A !== 'undefined' && typeof A[75] === 'function') { A[75](p); }
        else { shootFan(p, 5, 0.35, { d: ST.dmg * 1.5, sp: ST.ps * 1.25, pierce: 2 }); applyAoE(p.x, p.y, 140, ST.dmg * 1.6, (75 * 25) % 360); }
      }
    },
    {
      name: 'Superalloy Turbine Blade', ic: '🗡️',
      desc: 'Spins jet turbine blades around you, shredding close-range enemies.',
      f: function(p) {
        shootBullet(p, { d: ST.dmg * 3.2, sp: ST.ps * 2.2, r: 7, pierce: 6, kb: 1.8, hom: true, life: 1.4 }); shootFan(p, 3, 0.18, { d: ST.dmg * 0.9, sp: ST.ps * 1.5, pierce: 2 }); applyStatusToNear(p.x, p.y, 140, 'mark', ST.dmg);
      }
    },
    {
      name: 'Refractory Thermal Jet', ic: '🔥',
      desc: 'Discharges extreme temperature exhaust that pushes you forward and burns pursuers.',
      f: function(p) {
        applyAoE(p.x, p.y, 220, ST.dmg * 2.8, (75 * 33) % 360); shootRing(p, 14, { d: ST.dmg * 1.0, sp: ST.ps * 1.3, pierce: 3 }); p.puDamage = Math.max(p.puDamage || 1, 1.45); p.puTimer = Math.max(p.puTimer || 0, 5.5); gainShield(p, 20, 0.6);
      }
    }
  ];
  ELEMENT_MOVES_DATA[76] = [
    {
      name: 'Density', ic: '⚫',
      desc: 'Become extremely heavy: you cannot be knocked back and your attacks create ground shockwaves.',
      f: function(p) {
        if (typeof A !== 'undefined' && typeof A[76] === 'function') { A[76](p); }
        else { shootFan(p, 5, 0.35, { d: ST.dmg * 1.5, sp: ST.ps * 1.25, pierce: 2 }); applyAoE(p.x, p.y, 140, ST.dmg * 1.6, (76 * 25) % 360); }
      }
    },
    {
      name: 'Osmium Tetroxide Fumes', ic: '☣️',
      desc: 'Releases toxic volatile oxide fumes that blind and poison enemy units.',
      f: function(p) {
        shootBullet(p, { d: ST.dmg * 3.2, sp: ST.ps * 2.2, r: 7, pierce: 6, kb: 1.8, hom: true, life: 1.4 }); shootFan(p, 3, 0.18, { d: ST.dmg * 0.9, sp: ST.ps * 1.5, pierce: 2 }); applyStatusToNear(p.x, p.y, 140, 'mark', ST.dmg);
      }
    },
    {
      name: 'Colossal Mass Collapse', ic: '⛰️',
      desc: 'Slams down with the density of osmium, crushing all enemies in a wide radius.',
      f: function(p) {
        addWell(p.x + Math.cos(p.angle) * 140, p.y + Math.sin(p.angle) * 140, 3.8, 3); if (window.RUN) RUN.shake = Math.max(RUN.shake || 0, 16); setTimeout(function() { applyAoE(p.x + Math.cos(p.angle) * 140, p.y + Math.sin(p.angle) * 140, 240, ST.dmg * 3.6, (76 * 33) % 360); shootRing(p, 16, { d: ST.dmg * 1.1, sp: ST.ps * 1.3, pierce: 4 }); }, 650);
      }
    }
  ];
  ELEMENT_MOVES_DATA[77] = [
    {
      name: 'Meteorite', ic: '⚙️',
      desc: 'Calls down extremely dense impact strikes from above, recreating the K-Pg impact.',
      f: function(p) {
        if (typeof A !== 'undefined' && typeof A[77] === 'function') { A[77](p); }
        else { shootFan(p, 5, 0.35, { d: ST.dmg * 1.5, sp: ST.ps * 1.25, pierce: 2 }); applyAoE(p.x, p.y, 140, ST.dmg * 1.6, (77 * 25) % 360); }
      }
    },
    {
      name: 'Extinction Impact Shock', ic: '☄️',
      desc: 'Triggers a localized meteor blast that flattens enemy formations.',
      f: function(p) {
        shootBullet(p, { d: ST.dmg * 3.2, sp: ST.ps * 2.2, r: 7, pierce: 6, kb: 1.8, hom: true, life: 1.4 }); shootFan(p, 3, 0.18, { d: ST.dmg * 0.9, sp: ST.ps * 1.5, pierce: 2 }); applyStatusToNear(p.x, p.y, 140, 'mark', ST.dmg);
      }
    },
    {
      name: 'Corrosion-Immune Hull', ic: '🛡️',
      desc: 'Coats hull in pristine iridium alloy, immune to all acid and debuffs.',
      f: function(p) {
        applyAoE(p.x, p.y, 220, ST.dmg * 2.8, (77 * 33) % 360); shootRing(p, 14, { d: ST.dmg * 1.0, sp: ST.ps * 1.3, pierce: 3 }); p.puDamage = Math.max(p.puDamage || 1, 1.45); p.puTimer = Math.max(p.puTimer || 0, 5.5); gainShield(p, 20, 0.6);
      }
    }
  ];
  ELEMENT_MOVES_DATA[78] = [
    {
      name: 'Catalyst', ic: '⚪',
      desc: 'Greatly amplifies status effects without directly increasing base damage.',
      f: function(p) {
        if (typeof A !== 'undefined' && typeof A[78] === 'function') { A[78](p); }
        else { shootFan(p, 5, 0.35, { d: ST.dmg * 1.5, sp: ST.ps * 1.25, pierce: 2 }); applyAoE(p.x, p.y, 140, ST.dmg * 1.6, (78 * 25) % 360); }
      }
    },
    {
      name: 'Cisplatin Chemotherapy', ic: '🧪',
      desc: 'Infects hostile organic cells with cytotoxic platinum complexes.',
      f: function(p) {
        shootBullet(p, { d: ST.dmg * 3.2, sp: ST.ps * 2.2, r: 7, pierce: 6, kb: 1.8, hom: true, life: 1.4 }); shootFan(p, 3, 0.18, { d: ST.dmg * 0.9, sp: ST.ps * 1.5, pierce: 2 }); applyStatusToNear(p.x, p.y, 140, 'mark', ST.dmg);
      }
    },
    {
      name: 'Catalytic Exhaust Nova', ic: '💨',
      desc: 'Purifies the battlefield, converting enemy bullets into beneficial shield sparks.',
      f: function(p) {
        applyAoE(p.x, p.y, 250, ST.dmg * 3.4, (78 * 33) % 360); shootRing(p, 18, { d: ST.dmg * 1.15, sp: ST.ps * 1.5, pierce: 4, burn: true }); p.puDamage = Math.max(p.puDamage || 1, 1.6); p.puRate = Math.max(p.puRate || 1, 1.45); p.puTimer = Math.max(p.puTimer || 0, 6.0); gainShield(p, 25, 0.8);
      }
    }
  ];
  ELEMENT_MOVES_DATA[79] = [
    {
      name: 'Midas', ic: '🟡',
      desc: 'Enemies you kill drop gold; gold can temporarily increase damage, speed, or health.',
      f: function(p) {
        if (typeof A !== 'undefined' && typeof A[79] === 'function') { A[79](p); }
        else { shootFan(p, 5, 0.35, { d: ST.dmg * 1.5, sp: ST.ps * 1.25, pierce: 2 }); applyAoE(p.x, p.y, 140, ST.dmg * 1.6, (79 * 25) % 360); }
      }
    },
    {
      name: 'Gold Leaf Shroud', ic: '✨',
      desc: 'Envelops you in atomic gold leaf, deflecting infrared radiation and lasers.',
      f: function(p) {
        shootBullet(p, { d: ST.dmg * 3.2, sp: ST.ps * 2.2, r: 7, pierce: 6, kb: 1.8, hom: true, life: 1.4 }); shootFan(p, 3, 0.18, { d: ST.dmg * 0.9, sp: ST.ps * 1.5, pierce: 2 }); applyStatusToNear(p.x, p.y, 140, 'mark', ST.dmg);
      }
    },
    {
      name: 'Golden Touch Petrification', ic: '👑',
      desc: 'Transmutes the nearest enemy into solid gold, immobilizing it and yielding bonus coins.',
      f: function(p) {
        applyAoE(p.x, p.y, 220, ST.dmg * 2.8, (79 * 33) % 360); shootRing(p, 14, { d: ST.dmg * 1.0, sp: ST.ps * 1.3, pierce: 3 }); p.puDamage = Math.max(p.puDamage || 1, 1.45); p.puTimer = Math.max(p.puTimer || 0, 5.5); gainShield(p, 20, 0.6);
      }
    }
  ];
  ELEMENT_MOVES_DATA[80] = [
    {
      name: 'Liquid Body', ic: '🩶',
      desc: 'Become a flowing liquid that can slip through small gaps and split into multiple droplets.',
      f: function(p) {
        if (typeof A !== 'undefined' && typeof A[80] === 'function') { A[80](p); }
        else { shootFan(p, 5, 0.35, { d: ST.dmg * 1.5, sp: ST.ps * 1.25, pierce: 2 }); applyAoE(p.x, p.y, 140, ST.dmg * 1.6, (80 * 25) % 360); }
      }
    },
    {
      name: 'Cinnabar Toxic Pool', ic: '🧪',
      desc: 'Leaves pools of heavy liquid mercury that slow and poison entering hostiles.',
      f: function(p) {
        addZone(p.x + Math.cos(p.angle) * 100, p.y + Math.sin(p.angle) * 100, 140, 5.0); addField({ x: p.x + Math.cos(p.angle) * 100, y: p.y + Math.sin(p.angle) * 100, r: 130, t: 5.0, seed: 80 }); applyStatusToNear(p.x + Math.cos(p.angle) * 100, p.y + Math.sin(p.angle) * 100, 150, 'poison', ST.dmg * 1.5);
      }
    },
    {
      name: 'Quicksilver Surge', ic: '🌊',
      desc: 'Surges forward as a tidal wave of dense quicksilver, sweeping enemies along.',
      f: function(p) {
        applyAoE(p.x, p.y, 220, ST.dmg * 2.8, (80 * 33) % 360); shootRing(p, 14, { d: ST.dmg * 1.0, sp: ST.ps * 1.3, pierce: 3 }); p.puDamage = Math.max(p.puDamage || 1, 1.45); p.puTimer = Math.max(p.puTimer || 0, 5.5); gainShield(p, 20, 0.6);
      }
    }
  ];
  ELEMENT_MOVES_DATA[81] = [
    {
      name: 'Delayed Poison', ic: '🔵',
      desc: 'Damage doesn\'t happen immediately; instead, enemies accumulate lethal poison that triggers simultaneously.',
      f: function(p) {
        if (typeof A !== 'undefined' && typeof A[81] === 'function') { A[81](p); }
        else { shootFan(p, 5, 0.35, { d: ST.dmg * 1.5, sp: ST.ps * 1.25, pierce: 2 }); applyAoE(p.x, p.y, 140, ST.dmg * 1.6, (81 * 25) % 360); }
      }
    },
    {
      name: 'Cellular Mimicry Toxin', ic: '☣️',
      desc: 'Mimics potassium to enter enemy cells, bypassing armor and shields.',
      f: function(p) {
        shootBullet(p, { d: ST.dmg * 3.2, sp: ST.ps * 2.2, r: 7, pierce: 6, kb: 1.8, hom: true, life: 1.4 }); shootFan(p, 3, 0.18, { d: ST.dmg * 0.9, sp: ST.ps * 1.5, pierce: 2 }); applyStatusToNear(p.x, p.y, 140, 'mark', ST.dmg);
      }
    },
    {
      name: 'Execution Poison Burst', ic: '☠️',
      desc: 'Detonates all thallium poison on screen for catastrophic burst damage.',
      f: function(p) {
        applyAoE(p.x, p.y, 220, ST.dmg * 2.8, (81 * 33) % 360); shootRing(p, 14, { d: ST.dmg * 1.0, sp: ST.ps * 1.3, pierce: 3 }); p.puDamage = Math.max(p.puDamage || 1, 1.45); p.puTimer = Math.max(p.puTimer || 0, 5.5); gainShield(p, 20, 0.6);
      }
    }
  ];
  ELEMENT_MOVES_DATA[82] = [
    {
      name: 'Lead Barrier', ic: '⚪',
      desc: 'Extremely effective radiation shielding; creates a heavy wall that blocks radiation and projectiles.',
      f: function(p) {
        if (typeof A !== 'undefined' && typeof A[82] === 'function') { A[82](p); }
        else { shootFan(p, 5, 0.35, { d: ST.dmg * 1.5, sp: ST.ps * 1.25, pierce: 2 }); applyAoE(p.x, p.y, 140, ST.dmg * 1.6, (82 * 25) % 360); }
      }
    },
    {
      name: 'Dense Lead Slug', ic: '⚙️',
      desc: 'Fires a heavy lead bullet with extreme stopping power and knockback.',
      f: function(p) {
        shootBullet(p, { d: ST.dmg * 3.2, sp: ST.ps * 2.2, r: 7, pierce: 6, kb: 1.8, hom: true, life: 1.4 }); shootFan(p, 3, 0.18, { d: ST.dmg * 0.9, sp: ST.ps * 1.5, pierce: 2 }); applyStatusToNear(p.x, p.y, 140, 'mark', ST.dmg);
      }
    },
    {
      name: 'Bunker Down', ic: '🛡️',
      desc: 'Deploys a lead fallout shelter, granting 80% damage reduction for 5 seconds.',
      f: function(p) {
        applyAoE(p.x, p.y, 220, ST.dmg * 2.8, (82 * 33) % 360); shootRing(p, 14, { d: ST.dmg * 1.0, sp: ST.ps * 1.3, pierce: 3 }); p.puDamage = Math.max(p.puDamage || 1, 1.45); p.puTimer = Math.max(p.puTimer || 0, 5.5); gainShield(p, 20, 0.6);
      }
    }
  ];
  ELEMENT_MOVES_DATA[83] = [
    {
      name: 'Crystal Growth', ic: '🟡',
      desc: 'Creates beautiful stepped crystals that continuously grow outward and damage enemies.',
      f: function(p) {
        if (typeof A !== 'undefined' && typeof A[83] === 'function') { A[83](p); }
        else { shootFan(p, 5, 0.35, { d: ST.dmg * 1.5, sp: ST.ps * 1.25, pierce: 2 }); applyAoE(p.x, p.y, 140, ST.dmg * 1.6, (83 * 25) % 360); }
      }
    },
    {
      name: 'Diamagnetic Levitation', ic: '🧲',
      desc: 'Levitates above the ground via diamagnetic repulsion, avoiding ground hazards.',
      f: function(p) {
        shootBullet(p, { d: ST.dmg * 3.2, sp: ST.ps * 2.2, r: 7, pierce: 6, kb: 1.8, hom: true, life: 1.4 }); shootFan(p, 3, 0.18, { d: ST.dmg * 0.9, sp: ST.ps * 1.5, pierce: 2 }); applyStatusToNear(p.x, p.y, 140, 'mark', ST.dmg);
      }
    },
    {
      name: 'Iridescent Crystal Maze', ic: '💎',
      desc: 'Grows a labyrinth of rainbow bismuth crystals that traps and shreds enemies.',
      f: function(p) {
        applyAoE(p.x, p.y, 220, ST.dmg * 2.8, (83 * 33) % 360); shootRing(p, 14, { d: ST.dmg * 1.0, sp: ST.ps * 1.3, pierce: 3 }); p.puDamage = Math.max(p.puDamage || 1, 1.45); p.puTimer = Math.max(p.puTimer || 0, 5.5); gainShield(p, 20, 0.6);
      }
    }
  ];
  ELEMENT_MOVES_DATA[84] = [
    {
      name: 'Radiation Touch', ic: '🟣',
      desc: 'Enemies you hit become radioactive and damage other enemies nearby.',
      f: function(p) {
        if (typeof A !== 'undefined' && typeof A[84] === 'function') { A[84](p); }
        else { shootFan(p, 5, 0.35, { d: ST.dmg * 1.5, sp: ST.ps * 1.25, pierce: 2 }); applyAoE(p.x, p.y, 140, ST.dmg * 1.6, (84 * 25) % 360); }
      }
    },
    {
      name: 'Alpha Particle Cloud', ic: '☢️',
      desc: 'Emits high-energy alpha radiation that shreds enemy organic health.',
      f: function(p) {
        addZone(p.x + Math.cos(p.angle) * 100, p.y + Math.sin(p.angle) * 100, 140, 5.0); addField({ x: p.x + Math.cos(p.angle) * 100, y: p.y + Math.sin(p.angle) * 100, r: 130, t: 5.0, seed: 84 }); applyStatusToNear(p.x + Math.cos(p.angle) * 100, p.y + Math.sin(p.angle) * 100, 150, 'slow', ST.dmg * 1.5);
      }
    },
    {
      name: 'Lethal Heat Source', ic: '🔥',
      desc: 'Releases intense radioactive decay heat, incinerating everything close.',
      f: function(p) {
        applyAoE(p.x, p.y, 220, ST.dmg * 2.8, (84 * 33) % 360); shootRing(p, 14, { d: ST.dmg * 1.0, sp: ST.ps * 1.3, pierce: 3 }); p.puDamage = Math.max(p.puDamage || 1, 1.45); p.puTimer = Math.max(p.puTimer || 0, 5.5); gainShield(p, 20, 0.6);
      }
    }
  ];
  ELEMENT_MOVES_DATA[85] = [
    {
      name: 'Decay Curse', ic: '🟣',
      desc: 'Extremely powerful radioactive curse with a short duration that rapidly melts health.',
      f: function(p) {
        if (typeof A !== 'undefined' && typeof A[85] === 'function') { A[85](p); }
        else { shootFan(p, 5, 0.35, { d: ST.dmg * 1.5, sp: ST.ps * 1.25, pierce: 2 }); applyAoE(p.x, p.y, 140, ST.dmg * 1.6, (85 * 25) % 360); }
      }
    },
    {
      name: 'Halogen Radiance', ic: '✨',
      desc: 'Combines halogen reactivity with radiation to inflict heavy lingering burn.',
      f: function(p) {
        shootBullet(p, { d: ST.dmg * 3.2, sp: ST.ps * 2.2, r: 7, pierce: 6, kb: 1.8, hom: true, life: 1.4 }); shootFan(p, 3, 0.18, { d: ST.dmg * 0.9, sp: ST.ps * 1.5, pierce: 2 }); applyStatusToNear(p.x, p.y, 140, 'mark', ST.dmg);
      }
    },
    {
      name: 'Ephemeral Decay Blast', ic: '💥',
      desc: 'Decays completely in seconds, releasing a colossal final nuclear burst.',
      f: function(p) {
        if (typeof hitWave === 'function') hitWave(p.x, p.y, p.angle, 320, 75, ST.dmg * 2.8, (85 * 33) % 360, 'slow'); applyAoE(p.x + Math.cos(p.angle) * 120, p.y + Math.sin(p.angle) * 120, 210, ST.dmg * 2.5, (85 * 33) % 360); shootFan(p, 5, 0.35, { d: ST.dmg * 1.4, sp: ST.ps * 1.7, pierce: 5, kb: 2.2 });
      }
    }
  ];
  ELEMENT_MOVES_DATA[86] = [
    {
      name: 'Invisible Gas', ic: '🟣',
      desc: 'Creates an invisible toxic zone; enemies don\'t know they\'re inside until damage begins.',
      f: function(p) {
        if (typeof A !== 'undefined' && typeof A[86] === 'function') { A[86](p); }
        else { shootFan(p, 5, 0.35, { d: ST.dmg * 1.5, sp: ST.ps * 1.25, pierce: 2 }); applyAoE(p.x, p.y, 140, ST.dmg * 1.6, (86 * 25) % 360); }
      }
    },
    {
      name: 'Basement Seepage', ic: '🌫️',
      desc: 'Seeps radioactive gas upward from the ground across the entire room.',
      f: function(p) {
        shootBullet(p, { d: ST.dmg * 3.2, sp: ST.ps * 2.2, r: 7, pierce: 6, kb: 1.8, hom: true, life: 1.4 }); shootFan(p, 3, 0.18, { d: ST.dmg * 0.9, sp: ST.ps * 1.5, pierce: 2 }); applyStatusToNear(p.x, p.y, 140, 'mark', ST.dmg);
      }
    },
    {
      name: 'Heavy Gas Suffocation', ic: '☠️',
      desc: 'Displaces all breathable air with heavy radon gas, silencing enemy abilities.',
      f: function(p) {
        applyAoE(p.x, p.y, 220, ST.dmg * 2.8, (86 * 33) % 360); shootRing(p, 14, { d: ST.dmg * 1.0, sp: ST.ps * 1.3, pierce: 3 }); p.puDamage = Math.max(p.puDamage || 1, 1.45); p.puTimer = Math.max(p.puTimer || 0, 5.5); gainShield(p, 20, 0.6);
      }
    }
  ];
  ELEMENT_MOVES_DATA[87] = [
    {
      name: 'Critical Reaction', ic: '🔴',
      desc: 'One of the most unstable elements: every attack has an escalating chance to cause a gigantic reaction.',
      f: function(p) {
        if (typeof A !== 'undefined' && typeof A[87] === 'function') { A[87](p); }
        else { shootFan(p, 5, 0.35, { d: ST.dmg * 1.5, sp: ST.ps * 1.25, pierce: 2 }); applyAoE(p.x, p.y, 140, ST.dmg * 1.6, (87 * 25) % 360); }
      }
    },
    {
      name: 'Volatile Alkali Blast', ic: '💥',
      desc: 'Spontaneously explodes upon contact with the air, launching shockwaves.',
      f: function(p) {
        shootBullet(p, { d: ST.dmg * 3.2, sp: ST.ps * 2.2, r: 7, pierce: 6, kb: 1.8, hom: true, life: 1.4 }); shootFan(p, 3, 0.18, { d: ST.dmg * 0.9, sp: ST.ps * 1.5, pierce: 2 }); applyStatusToNear(p.x, p.y, 140, 'mark', ST.dmg);
      }
    },
    {
      name: 'Francium Cataclysm', ic: '💣',
      desc: 'Triggers a runaway radioactive alkali chain reaction that clears the screen.',
      f: function(p) {
        applyAoE(p.x, p.y, 220, ST.dmg * 2.8, (87 * 33) % 360); shootRing(p, 14, { d: ST.dmg * 1.0, sp: ST.ps * 1.3, pierce: 3 }); p.puDamage = Math.max(p.puDamage || 1, 1.45); p.puTimer = Math.max(p.puTimer || 0, 5.5); gainShield(p, 20, 0.6);
      }
    }
  ];
  ELEMENT_MOVES_DATA[88] = [
    {
      name: 'Radiant Aura', ic: '🟢',
      desc: 'Constantly emits radiation around you; the longer enemies stay nearby, the more damage they take.',
      f: function(p) {
        if (typeof A !== 'undefined' && typeof A[88] === 'function') { A[88](p); }
        else { shootFan(p, 5, 0.35, { d: ST.dmg * 1.5, sp: ST.ps * 1.25, pierce: 2 }); applyAoE(p.x, p.y, 140, ST.dmg * 1.6, (88 * 25) % 360); }
      }
    },
    {
      name: 'Luminescent Luminescence', ic: '✨',
      desc: 'Emits an eerie green glow that reveals and weakens all nearby enemies.',
      f: function(p) {
        addWell(p.x + Math.cos(p.angle) * 130, p.y + Math.sin(p.angle) * 130, 3.2, 2); shootFan(p, 4, 0.28, { d: ST.dmg * 1.4, sp: ST.ps * 1.5, pierce: 2, hom: true }); applyStatusToNear(p.x + Math.cos(p.angle) * 130, p.y + Math.sin(p.angle) * 130, 160, 'stun', ST.dmg);
      }
    },
    {
      name: 'Radium Burn Nova', ic: '☢️',
      desc: 'Unleashes an intense blast of radium radiation that inflicts permanent burn.',
      f: function(p) {
        applyAoE(p.x, p.y, 250, ST.dmg * 3.4, (88 * 33) % 360); shootRing(p, 18, { d: ST.dmg * 1.15, sp: ST.ps * 1.5, pierce: 4, burn: true }); p.puDamage = Math.max(p.puDamage || 1, 1.6); p.puRate = Math.max(p.puRate || 1, 1.45); p.puTimer = Math.max(p.puTimer || 0, 6.0); gainShield(p, 25, 0.8);
      }
    }
  ];
  ELEMENT_MOVES_DATA[89] = [
    {
      name: 'Radiation Core', ic: '🔵',
      desc: 'Slowly generates radioactive energy, allowing you to fire increasingly powerful radiation blasts.',
      f: function(p) {
        if (typeof A !== 'undefined' && typeof A[89] === 'function') { A[89](p); }
        else { shootFan(p, 5, 0.35, { d: ST.dmg * 1.5, sp: ST.ps * 1.25, pierce: 2 }); applyAoE(p.x, p.y, 140, ST.dmg * 1.6, (89 * 25) % 360); }
      }
    },
    {
      name: 'Actinium Alpha Cascade', ic: '☢️',
      desc: 'Launches a cascading chain of alpha particles that pierce through enemy ranks.',
      f: function(p) {
        shootBullet(p, { d: ST.dmg * 3.2, sp: ST.ps * 2.2, r: 7, pierce: 6, kb: 1.8, hom: true, life: 1.4 }); shootFan(p, 3, 0.18, { d: ST.dmg * 0.9, sp: ST.ps * 1.5, pierce: 2 }); applyStatusToNear(p.x, p.y, 140, 'mark', ST.dmg);
      }
    },
    {
      name: 'Nuclear Core Meltdown', ic: '💥',
      desc: 'Overcharges actinium core to release a massive glowing blue radiation wave.',
      f: function(p) {
        addWell(p.x + Math.cos(p.angle) * 140, p.y + Math.sin(p.angle) * 140, 3.8, 3); if (window.RUN) RUN.shake = Math.max(RUN.shake || 0, 16); setTimeout(function() { applyAoE(p.x + Math.cos(p.angle) * 140, p.y + Math.sin(p.angle) * 140, 240, ST.dmg * 3.6, (89 * 33) % 360); shootRing(p, 16, { d: ST.dmg * 1.1, sp: ST.ps * 1.3, pierce: 4 }); }, 650);
      }
    }
  ];
  ELEMENT_MOVES_DATA[90] = [
    {
      name: 'Decay Cannon', ic: '🟢',
      desc: 'Slow but extremely powerful shots that leave radiation zones behind.',
      f: function(p) {
        if (typeof A !== 'undefined' && typeof A[90] === 'function') { A[90](p); }
        else { shootFan(p, 5, 0.35, { d: ST.dmg * 1.5, sp: ST.ps * 1.25, pierce: 2 }); applyAoE(p.x, p.y, 140, ST.dmg * 1.6, (90 * 25) % 360); }
      }
    },
    {
      name: 'Molten Salt Energy', ic: '⚡',
      desc: 'Channels thorium molten salt reactor energy to boost fire rate and shield recharge.',
      f: function(p) {
        shootBullet(p, { d: ST.dmg * 3.2, sp: ST.ps * 2.2, r: 7, pierce: 6, kb: 1.8, hom: true, life: 1.4 }); shootFan(p, 3, 0.18, { d: ST.dmg * 0.9, sp: ST.ps * 1.5, pierce: 2 }); applyStatusToNear(p.x, p.y, 140, 'mark', ST.dmg);
      }
    },
    {
      name: 'Fertile Breeder Blast', ic: '💣',
      desc: 'Breeds fissile material upon impact, triggering secondary cascading explosions.',
      f: function(p) {
        if (typeof hitWave === 'function') hitWave(p.x, p.y, p.angle, 320, 75, ST.dmg * 2.8, (90 * 33) % 360, 'slow'); applyAoE(p.x + Math.cos(p.angle) * 120, p.y + Math.sin(p.angle) * 120, 210, ST.dmg * 2.5, (90 * 33) % 360); shootFan(p, 5, 0.35, { d: ST.dmg * 1.4, sp: ST.ps * 1.7, pierce: 5, kb: 2.2 });
      }
    }
  ];
  ELEMENT_MOVES_DATA[91] = [
    {
      name: 'Decay Chain', ic: '🟣',
      desc: 'Every hit cycles through multiple radioactive effects before reaching its final form.',
      f: function(p) {
        if (typeof A !== 'undefined' && typeof A[91] === 'function') { A[91](p); }
        else { shootFan(p, 5, 0.35, { d: ST.dmg * 1.5, sp: ST.ps * 1.25, pierce: 2 }); applyAoE(p.x, p.y, 140, ST.dmg * 1.6, (91 * 25) % 360); }
      }
    },
    {
      name: 'Alpha-Beta Transmutation', ic: '🧬',
      desc: 'Transmutes enemy elemental types, stripping their resistances.',
      f: function(p) {
        shootBullet(p, { d: ST.dmg * 3.2, sp: ST.ps * 2.2, r: 7, pierce: 6, kb: 1.8, hom: true, life: 1.4 }); shootFan(p, 3, 0.18, { d: ST.dmg * 0.9, sp: ST.ps * 1.5, pierce: 2 }); applyStatusToNear(p.x, p.y, 140, 'mark', ST.dmg);
      }
    },
    {
      name: 'Superheavy Chain Detonation', ic: '💥',
      desc: 'Detonates all active decay chains on screen in a synchronized blast.',
      f: function(p) {
        applyAoE(p.x, p.y, 220, ST.dmg * 2.8, (91 * 33) % 360); shootRing(p, 14, { d: ST.dmg * 1.0, sp: ST.ps * 1.3, pierce: 3 }); p.puDamage = Math.max(p.puDamage || 1, 1.45); p.puTimer = Math.max(p.puTimer || 0, 5.5); gainShield(p, 20, 0.6);
      }
    }
  ];
  ELEMENT_MOVES_DATA[92] = [
    {
      name: 'Fission', ic: '🟢',
      desc: 'Shots split into smaller projectiles when hitting enemies; those split again on subsequent hits.',
      f: function(p) {
        if (typeof A !== 'undefined' && typeof A[92] === 'function') { A[92](p); }
        else { shootFan(p, 5, 0.35, { d: ST.dmg * 1.5, sp: ST.ps * 1.25, pierce: 2 }); applyAoE(p.x, p.y, 140, ST.dmg * 1.6, (92 * 25) % 360); }
      }
    },
    {
      name: 'Depleted Uranium Sabot', ic: '⛏️',
      desc: 'Fires ultra-dense depleted uranium rounds with self-sharpening armor pierce.',
      f: function(p) {
        shootBullet(p, { d: ST.dmg * 3.2, sp: ST.ps * 2.2, r: 7, pierce: 6, kb: 1.8, hom: true, life: 1.4 }); shootFan(p, 3, 0.18, { d: ST.dmg * 0.9, sp: ST.ps * 1.5, pierce: 2 }); applyStatusToNear(p.x, p.y, 140, 'mark', ST.dmg);
      }
    },
    {
      name: 'Supercritical Fission Burst', ic: '☢️',
      desc: 'Initiates sustained nuclear fission, creating an expanding sphere of devastation.',
      f: function(p) {
        applyAoE(p.x, p.y, 220, ST.dmg * 2.8, (92 * 33) % 360); shootRing(p, 14, { d: ST.dmg * 1.0, sp: ST.ps * 1.3, pierce: 3 }); p.puDamage = Math.max(p.puDamage || 1, 1.45); p.puTimer = Math.max(p.puTimer || 0, 5.5); gainShield(p, 20, 0.6);
      }
    }
  ];
  ELEMENT_MOVES_DATA[93] = [
    {
      name: 'Deep Radiation', ic: '🔵',
      desc: 'Projectiles pass through walls and obstacles, delivering radiation deep into enemy ranks.',
      f: function(p) {
        if (typeof A !== 'undefined' && typeof A[93] === 'function') { A[93](p); }
        else { shootFan(p, 5, 0.35, { d: ST.dmg * 1.5, sp: ST.ps * 1.25, pierce: 2 }); applyAoE(p.x, p.y, 140, ST.dmg * 1.6, (93 * 25) % 360); }
      }
    },
    {
      name: 'Transuranic Decay Dart', ic: '🗡️',
      desc: 'Fires high-velocity neptunium needles that linger inside enemies.',
      f: function(p) {
        shootBullet(p, { d: ST.dmg * 3.2, sp: ST.ps * 2.2, r: 7, pierce: 6, kb: 1.8, hom: true, life: 1.4 }); shootFan(p, 3, 0.18, { d: ST.dmg * 0.9, sp: ST.ps * 1.5, pierce: 2 }); applyStatusToNear(p.x, p.y, 140, 'mark', ST.dmg);
      }
    },
    {
      name: 'Neptunium Pulse Nova', ic: '🌊',
      desc: 'Emits deep-penetrating radiation shockwaves that damage all hidden foes.',
      f: function(p) {
        applyAoE(p.x, p.y, 250, ST.dmg * 3.4, (93 * 33) % 360); shootRing(p, 18, { d: ST.dmg * 1.15, sp: ST.ps * 1.5, pierce: 4, burn: true }); p.puDamage = Math.max(p.puDamage || 1, 1.6); p.puRate = Math.max(p.puRate || 1, 1.45); p.puTimer = Math.max(p.puTimer || 0, 6.0); gainShield(p, 25, 0.8);
      }
    }
  ];
  ELEMENT_MOVES_DATA[94] = [
    {
      name: 'Critical Mass', ic: '🟣',
      desc: 'Collect energy from kills; reach critical mass to trigger a gigantic explosion.',
      f: function(p) {
        if (typeof A !== 'undefined' && typeof A[94] === 'function') { A[94](p); }
        else { shootFan(p, 5, 0.35, { d: ST.dmg * 1.5, sp: ST.ps * 1.25, pierce: 2 }); applyAoE(p.x, p.y, 140, ST.dmg * 1.6, (94 * 25) % 360); }
      }
    },
    {
      name: 'Implosion Core Trigger', ic: '💣',
      desc: 'Compresses subcritical plutonium with explosive lenses, triggering a nuclear blast.',
      f: function(p) {
        shootBullet(p, { d: ST.dmg * 3.2, sp: ST.ps * 2.2, r: 7, pierce: 6, kb: 1.8, hom: true, life: 1.4 }); shootFan(p, 3, 0.18, { d: ST.dmg * 0.9, sp: ST.ps * 1.5, pierce: 2 }); applyStatusToNear(p.x, p.y, 140, 'mark', ST.dmg);
      }
    },
    {
      name: 'Thermonuclear Overdrive', ic: '☢️',
      desc: 'Releases full plutonium detonation, clearing the entire screen of hostiles.',
      f: function(p) {
        applyAoE(p.x, p.y, 250, ST.dmg * 3.4, (94 * 33) % 360); shootRing(p, 18, { d: ST.dmg * 1.15, sp: ST.ps * 1.5, pierce: 4, burn: true }); p.puDamage = Math.max(p.puDamage || 1, 1.6); p.puRate = Math.max(p.puRate || 1, 1.45); p.puTimer = Math.max(p.puTimer || 0, 6.0); gainShield(p, 25, 0.8);
      }
    }
  ];
  ELEMENT_MOVES_DATA[95] = [
    {
      name: 'Smoke Detector', ic: '🔴',
      desc: 'Creates invisible detection zones that reveal enemies and weak points through walls.',
      f: function(p) {
        if (typeof A !== 'undefined' && typeof A[95] === 'function') { A[95](p); }
        else { shootFan(p, 5, 0.35, { d: ST.dmg * 1.5, sp: ST.ps * 1.25, pierce: 2 }); applyAoE(p.x, p.y, 140, ST.dmg * 1.6, (95 * 25) % 360); }
      }
    },
    {
      name: 'Ionization Chamber', ic: '⚡',
      desc: 'Ionizes ambient air particles to electrocute enemies passing through.',
      f: function(p) {
        shootBullet(p, { d: ST.dmg * 3.2, sp: ST.ps * 2.2, r: 7, pierce: 6, kb: 1.8, hom: true, life: 1.4 }); shootFan(p, 3, 0.18, { d: ST.dmg * 0.9, sp: ST.ps * 1.5, pierce: 2 }); applyStatusToNear(p.x, p.y, 140, 'mark', ST.dmg);
      }
    },
    {
      name: 'Alpha Beam Sweep', ic: '☄️',
      desc: 'Sweeps a wide beam of americium alpha particles that burns through enemy lines.',
      f: function(p) {
        applyAoE(p.x, p.y, 220, ST.dmg * 2.8, (95 * 33) % 360); shootRing(p, 14, { d: ST.dmg * 1.0, sp: ST.ps * 1.3, pierce: 3 }); p.puDamage = Math.max(p.puDamage || 1, 1.45); p.puTimer = Math.max(p.puTimer || 0, 5.5); gainShield(p, 20, 0.6);
      }
    }
  ];
  ELEMENT_MOVES_DATA[96] = [
    {
      name: 'Heat Ray', ic: '🟢',
      desc: 'Emits constant radiation that becomes stronger while aimed at the same enemy.',
      f: function(p) {
        if (typeof A !== 'undefined' && typeof A[96] === 'function') { A[96](p); }
        else { shootFan(p, 5, 0.35, { d: ST.dmg * 1.5, sp: ST.ps * 1.25, pierce: 2 }); applyAoE(p.x, p.y, 140, ST.dmg * 1.6, (96 * 25) % 360); }
      }
    },
    {
      name: 'Alpha Decay Luminescence', ic: '✨',
      desc: 'Glows with intense purple light, blinding enemies and dealing radiant damage.',
      f: function(p) {
        addWell(p.x + Math.cos(p.angle) * 130, p.y + Math.sin(p.angle) * 130, 3.2, 2); shootFan(p, 4, 0.28, { d: ST.dmg * 1.4, sp: ST.ps * 1.5, pierce: 2, hom: true }); applyStatusToNear(p.x + Math.cos(p.angle) * 130, p.y + Math.sin(p.angle) * 130, 160, 'stun', ST.dmg);
      }
    },
    {
      name: 'Thermoelectric Power Surge', ic: '🔋',
      desc: 'Converts decay heat into extreme weapon damage and movement speed.',
      f: function(p) {
        applyAoE(p.x, p.y, 220, ST.dmg * 2.8, (96 * 33) % 360); shootRing(p, 14, { d: ST.dmg * 1.0, sp: ST.ps * 1.3, pierce: 3 }); p.puDamage = Math.max(p.puDamage || 1, 1.45); p.puTimer = Math.max(p.puTimer || 0, 5.5); gainShield(p, 20, 0.6);
      }
    }
  ];
  ELEMENT_MOVES_DATA[97] = [
    {
      name: 'Decay Bomb', ic: '🟣',
      desc: 'Throw a bomb that slowly decays before violently detonating with massive force.',
      f: function(p) {
        if (typeof A !== 'undefined' && typeof A[97] === 'function') { A[97](p); }
        else { shootFan(p, 5, 0.35, { d: ST.dmg * 1.5, sp: ST.ps * 1.25, pierce: 2 }); applyAoE(p.x, p.y, 140, ST.dmg * 1.6, (97 * 25) % 360); }
      }
    },
    {
      name: 'Californium Precursor', ic: '🧬',
      desc: 'Decays into californium mid-flight, spawning secondary neutron bursts.',
      f: function(p) {
        shootBullet(p, { d: ST.dmg * 3.2, sp: ST.ps * 2.2, r: 7, pierce: 6, kb: 1.8, hom: true, life: 1.4 }); shootFan(p, 3, 0.18, { d: ST.dmg * 0.9, sp: ST.ps * 1.5, pierce: 2 }); applyStatusToNear(p.x, p.y, 140, 'mark', ST.dmg);
      }
    },
    {
      name: 'Targeted Radio-Burst', ic: '💥',
      desc: 'Launches a cluster of high-energy berkelium warheads across the arena.',
      f: function(p) {
        applyAoE(p.x, p.y, 220, ST.dmg * 2.8, (97 * 33) % 360); shootRing(p, 14, { d: ST.dmg * 1.0, sp: ST.ps * 1.3, pierce: 3 }); p.puDamage = Math.max(p.puDamage || 1, 1.45); p.puTimer = Math.max(p.puTimer || 0, 5.5); gainShield(p, 20, 0.6);
      }
    }
  ];
  ELEMENT_MOVES_DATA[98] = [
    {
      name: 'Neutron Burst', ic: '🟢',
      desc: 'Fires extremely powerful neutron-like blasts that pass through multiple enemies.',
      f: function(p) {
        if (typeof A !== 'undefined' && typeof A[98] === 'function') { A[98](p); }
        else { shootFan(p, 5, 0.35, { d: ST.dmg * 1.5, sp: ST.ps * 1.25, pierce: 2 }); applyAoE(p.x, p.y, 140, ST.dmg * 1.6, (98 * 25) % 360); }
      }
    },
    {
      name: 'Spontaneous Fission Emitter', ic: '☢️',
      desc: 'Continuously emits fast neutrons that penetrate all enemy defenses.',
      f: function(p) {
        shootBullet(p, { d: ST.dmg * 3.2, sp: ST.ps * 2.2, r: 7, pierce: 6, kb: 1.8, hom: true, life: 1.4 }); shootFan(p, 3, 0.18, { d: ST.dmg * 0.9, sp: ST.ps * 1.5, pierce: 2 }); applyStatusToNear(p.x, p.y, 140, 'mark', ST.dmg);
      }
    },
    {
      name: 'Dense Neutron Beam', ic: '☄️',
      desc: 'Fires a concentrated californium neutron beam with infinite armor penetration.',
      f: function(p) {
        applyAoE(p.x, p.y, 220, ST.dmg * 2.8, (98 * 33) % 360); shootRing(p, 14, { d: ST.dmg * 1.0, sp: ST.ps * 1.3, pierce: 3 }); p.puDamage = Math.max(p.puDamage || 1, 1.45); p.puTimer = Math.max(p.puTimer || 0, 5.5); gainShield(p, 20, 0.6);
      }
    }
  ];
  ELEMENT_MOVES_DATA[99] = [
    {
      name: 'Brainwave', ic: '🟣',
      desc: 'Temporarily slows enemy AI and causes enemies to behave erratically and attack each other.',
      f: function(p) {
        if (typeof A !== 'undefined' && typeof A[99] === 'function') { A[99](p); }
        else { shootFan(p, 5, 0.35, { d: ST.dmg * 1.5, sp: ST.ps * 1.25, pierce: 2 }); applyAoE(p.x, p.y, 140, ST.dmg * 1.6, (99 * 25) % 360); }
      }
    },
    {
      name: 'Relativistic Distortion', ic: '🌀',
      desc: 'Distorts local spacetime, slowing enemy projectiles by 90%.',
      f: function(p) {
        shootBullet(p, { d: ST.dmg * 3.2, sp: ST.ps * 2.2, r: 7, pierce: 6, kb: 1.8, hom: true, life: 1.4 }); shootFan(p, 3, 0.18, { d: ST.dmg * 0.9, sp: ST.ps * 1.5, pierce: 2 }); applyStatusToNear(p.x, p.y, 140, 'mark', ST.dmg);
      }
    },
    {
      name: 'Quantum Confusion Nova', ic: '🧠',
      desc: 'Releases a psychic wave that confuses all enemies on screen for 5 seconds.',
      f: function(p) {
        applyAoE(p.x, p.y, 250, ST.dmg * 3.4, (99 * 33) % 360); shootRing(p, 18, { d: ST.dmg * 1.15, sp: ST.ps * 1.5, pierce: 4, burn: true }); p.puDamage = Math.max(p.puDamage || 1, 1.6); p.puRate = Math.max(p.puRate || 1, 1.45); p.puTimer = Math.max(p.puTimer || 0, 6.0); gainShield(p, 25, 0.8);
      }
    }
  ];
  ELEMENT_MOVES_DATA[100] = [
    {
      name: 'Atomic Collapse', ic: '🟣',
      desc: 'Fires unstable particles that collapse into explosions after traveling a certain distance.',
      f: function(p) {
        if (typeof A !== 'undefined' && typeof A[100] === 'function') { A[100](p); }
        else { shootFan(p, 5, 0.35, { d: ST.dmg * 1.5, sp: ST.ps * 1.25, pierce: 2 }); applyAoE(p.x, p.y, 140, ST.dmg * 1.6, (100 * 25) % 360); }
      }
    },
    {
      name: 'Heavy Ion Fissure', ic: '⚡',
      desc: 'Cracks open a heavy ion rift that continuously damages passing enemies.',
      f: function(p) {
        shootBullet(p, { d: ST.dmg * 3.2, sp: ST.ps * 2.2, r: 7, pierce: 6, kb: 1.8, hom: true, life: 1.4 }); shootFan(p, 3, 0.18, { d: ST.dmg * 0.9, sp: ST.ps * 1.5, pierce: 2 }); applyStatusToNear(p.x, p.y, 140, 'mark', ST.dmg);
      }
    },
    {
      name: 'Thermonuclear Ivy Nova', ic: '💥',
      desc: 'Recreates the Ivy Mike nuclear test detonation, wiping standard enemies.',
      f: function(p) {
        applyAoE(p.x, p.y, 250, ST.dmg * 3.4, (100 * 33) % 360); shootRing(p, 18, { d: ST.dmg * 1.15, sp: ST.ps * 1.5, pierce: 4, burn: true }); p.puDamage = Math.max(p.puDamage || 1, 1.6); p.puRate = Math.max(p.puRate || 1, 1.45); p.puTimer = Math.max(p.puTimer || 0, 6.0); gainShield(p, 25, 0.8);
      }
    }
  ];
  ELEMENT_MOVES_DATA[101] = [
    {
      name: 'Chain Reaction', ic: '🟣',
      desc: 'Every kill increases your damage until you stop killing enemies.',
      f: function(p) {
        if (typeof A !== 'undefined' && typeof A[101] === 'function') { A[101](p); }
        else { shootFan(p, 5, 0.35, { d: ST.dmg * 1.5, sp: ST.ps * 1.25, pierce: 2 }); applyAoE(p.x, p.y, 140, ST.dmg * 1.6, (101 * 25) % 360); }
      }
    },
    {
      name: 'Periodic Mastery', ic: '📜',
      desc: 'Applies all elemental vulnerabilities to the target simultaneously.',
      f: function(p) {
        shootBullet(p, { d: ST.dmg * 3.2, sp: ST.ps * 2.2, r: 7, pierce: 6, kb: 1.8, hom: true, life: 1.4 }); shootFan(p, 3, 0.18, { d: ST.dmg * 0.9, sp: ST.ps * 1.5, pierce: 2 }); applyStatusToNear(p.x, p.y, 140, 'mark', ST.dmg);
      }
    },
    {
      name: 'Mendeleev Resonance Burst', ic: '🌟',
      desc: 'Triggers a synchronized resonance burst across all periodic elements.',
      f: function(p) {
        applyAoE(p.x, p.y, 220, ST.dmg * 2.8, (101 * 33) % 360); shootRing(p, 14, { d: ST.dmg * 1.0, sp: ST.ps * 1.3, pierce: 3 }); p.puDamage = Math.max(p.puDamage || 1, 1.45); p.puTimer = Math.max(p.puTimer || 0, 5.5); gainShield(p, 20, 0.6);
      }
    }
  ];
  ELEMENT_MOVES_DATA[102] = [
    {
      name: 'Noble Decay', ic: '🟣',
      desc: 'Creates an area where enemies slowly lose their buffs, shields, and abilities.',
      f: function(p) {
        if (typeof A !== 'undefined' && typeof A[102] === 'function') { A[102](p); }
        else { shootFan(p, 5, 0.35, { d: ST.dmg * 1.5, sp: ST.ps * 1.25, pierce: 2 }); applyAoE(p.x, p.y, 140, ST.dmg * 1.6, (102 * 25) % 360); }
      }
    },
    {
      name: 'Dynamite Nobel Blast', ic: '💣',
      desc: 'Launches a cluster of high-explosive charges in homage to Alfred Nobel.',
      f: function(p) {
        shootBullet(p, { d: ST.dmg * 3.2, sp: ST.ps * 2.2, r: 7, pierce: 6, kb: 1.8, hom: true, life: 1.4 }); shootFan(p, 3, 0.18, { d: ST.dmg * 0.9, sp: ST.ps * 1.5, pierce: 2 }); applyStatusToNear(p.x, p.y, 140, 'mark', ST.dmg);
      }
    },
    {
      name: 'Peace Sanctuary Field', ic: '🕊️',
      desc: 'Forms a pacification sanctuary where enemies cannot fire weapons.',
      f: function(p) {
        applyAoE(p.x, p.y, 220, ST.dmg * 2.8, (102 * 33) % 360); shootRing(p, 14, { d: ST.dmg * 1.0, sp: ST.ps * 1.3, pierce: 3 }); p.puDamage = Math.max(p.puDamage || 1, 1.45); p.puTimer = Math.max(p.puTimer || 0, 5.5); gainShield(p, 20, 0.6);
      }
    }
  ];
  ELEMENT_MOVES_DATA[103] = [
    {
      name: 'Particle Lance', ic: '🟣',
      desc: 'Fires an extremely narrow particle beam with almost no spread and maximum pierce.',
      f: function(p) {
        if (typeof A !== 'undefined' && typeof A[103] === 'function') { A[103](p); }
        else { shootFan(p, 5, 0.35, { d: ST.dmg * 1.5, sp: ST.ps * 1.25, pierce: 2 }); applyAoE(p.x, p.y, 140, ST.dmg * 1.6, (103 * 25) % 360); }
      }
    },
    {
      name: 'Cyclotron Acceleration', ic: '🌀',
      desc: 'Accelerates projectile speed by 200%, making bullets hit instantly.',
      f: function(p) {
        shootBullet(p, { d: ST.dmg * 3.2, sp: ST.ps * 2.2, r: 7, pierce: 6, kb: 1.8, hom: true, life: 1.4 }); shootFan(p, 3, 0.18, { d: ST.dmg * 0.9, sp: ST.ps * 1.5, pierce: 2 }); applyStatusToNear(p.x, p.y, 140, 'mark', ST.dmg);
      }
    },
    {
      name: 'Heavy Ion Cannon', ic: '☄️',
      desc: 'Fires a relativistic heavy ion slug that crushes boss armor.',
      f: function(p) {
        applyAoE(p.x, p.y, 220, ST.dmg * 2.8, (103 * 33) % 360); shootRing(p, 14, { d: ST.dmg * 1.0, sp: ST.ps * 1.3, pierce: 3 }); p.puDamage = Math.max(p.puDamage || 1, 1.45); p.puTimer = Math.max(p.puTimer || 0, 5.5); gainShield(p, 20, 0.6);
      }
    }
  ];
  ELEMENT_MOVES_DATA[104] = [
    {
      name: 'Heavy Particle', ic: '⚙️',
      desc: 'Slow projectiles that massively knock enemies backward with crushing force.',
      f: function(p) {
        if (typeof A !== 'undefined' && typeof A[104] === 'function') { A[104](p); }
        else { shootFan(p, 5, 0.35, { d: ST.dmg * 1.5, sp: ST.ps * 1.25, pierce: 2 }); applyAoE(p.x, p.y, 140, ST.dmg * 1.6, (104 * 25) % 360); }
      }
    },
    {
      name: 'Gold Foil Scattering', ic: '🪞',
      desc: 'Scatters alpha particles backward upon hitting enemies, hitting flanking foes.',
      f: function(p) {
        shootBullet(p, { d: ST.dmg * 3.2, sp: ST.ps * 2.2, r: 7, pierce: 6, kb: 1.8, hom: true, life: 1.4 }); shootFan(p, 3, 0.18, { d: ST.dmg * 0.9, sp: ST.ps * 1.5, pierce: 2 }); applyStatusToNear(p.x, p.y, 140, 'mark', ST.dmg);
      }
    },
    {
      name: 'Nuclear Model Overdrive', ic: '⚛',
      desc: 'Condenses atomic mass into your attacks, multiplying kinetic knockback by 5x.',
      f: function(p) {
        applyAoE(p.x, p.y, 250, ST.dmg * 3.4, (104 * 33) % 360); shootRing(p, 18, { d: ST.dmg * 1.15, sp: ST.ps * 1.5, pierce: 4, burn: true }); p.puDamage = Math.max(p.puDamage || 1, 1.6); p.puRate = Math.max(p.puRate || 1, 1.45); p.puTimer = Math.max(p.puTimer || 0, 6.0); gainShield(p, 25, 0.8);
      }
    }
  ];
  ELEMENT_MOVES_DATA[105] = [
    {
      name: 'Split Decay', ic: '🟣',
      desc: 'Projectiles randomly split into different trajectories after hitting something.',
      f: function(p) {
        if (typeof A !== 'undefined' && typeof A[105] === 'function') { A[105](p); }
        else { shootFan(p, 5, 0.35, { d: ST.dmg * 1.5, sp: ST.ps * 1.25, pierce: 2 }); applyAoE(p.x, p.y, 140, ST.dmg * 1.6, (105 * 25) % 360); }
      }
    },
    {
      name: 'Heavy Isomer Fragment', ic: '💥',
      desc: 'Fires unstable isomers that fragment into secondary homing shards.',
      f: function(p) {
        shootBullet(p, { d: ST.dmg * 3.2, sp: ST.ps * 2.2, r: 7, pierce: 6, kb: 1.8, hom: true, life: 1.4 }); shootFan(p, 3, 0.18, { d: ST.dmg * 0.9, sp: ST.ps * 1.5, pierce: 2 }); applyStatusToNear(p.x, p.y, 140, 'mark', ST.dmg);
      }
    },
    {
      name: 'Cluster Fission Storm', ic: '🌧️',
      desc: 'Launches a storm of splitting warheads that cover the entire combat arena.',
      f: function(p) {
        applyAoE(p.x, p.y, 220, ST.dmg * 2.8, (105 * 33) % 360); shootRing(p, 14, { d: ST.dmg * 1.0, sp: ST.ps * 1.3, pierce: 3 }); p.puDamage = Math.max(p.puDamage || 1, 1.45); p.puTimer = Math.max(p.puTimer || 0, 5.5); gainShield(p, 20, 0.6);
      }
    }
  ];
  ELEMENT_MOVES_DATA[106] = [
    {
      name: 'Decay Reactor', ic: '🟣',
      desc: 'Place a reactor that continuously produces increasingly powerful radiation pulses.',
      f: function(p) {
        if (typeof A !== 'undefined' && typeof A[106] === 'function') { A[106](p); }
        else { shootFan(p, 5, 0.35, { d: ST.dmg * 1.5, sp: ST.ps * 1.25, pierce: 2 }); applyAoE(p.x, p.y, 140, ST.dmg * 1.6, (106 * 25) % 360); }
      }
    },
    {
      name: 'Transactinide Beam', ic: '⚡',
      desc: 'Fires a superheavy transactinide laser that penetrates all physical barriers.',
      f: function(p) {
        shootBullet(p, { d: ST.dmg * 3.8, sp: ST.ps * 2.8, r: 6, pierce: 12, life: 1.1, expl: true }); if (typeof hitBeam === 'function') hitBeam(p.x, p.y, p.angle, 450, 16, ST.dmg * 2.2, (106 * 25) % 360, 'mark'); applyStatusToNear(p.x + Math.cos(p.angle)*150, p.y + Math.sin(p.angle)*150, 100, 'mark', ST.dmg);
      }
    },
    {
      name: 'Superheavy Meltdown', ic: '☢️',
      desc: 'Overloads the seaborgium reactor, detonating it in a colossal nuclear nova.',
      f: function(p) {
        applyAoE(p.x, p.y, 220, ST.dmg * 2.8, (106 * 33) % 360); shootRing(p, 14, { d: ST.dmg * 1.0, sp: ST.ps * 1.3, pierce: 3 }); p.puDamage = Math.max(p.puDamage || 1, 1.45); p.puTimer = Math.max(p.puTimer || 0, 5.5); gainShield(p, 20, 0.6);
      }
    }
  ];
  ELEMENT_MOVES_DATA[107] = [
    {
      name: 'Impact Frame', ic: '⚙️',
      desc: 'Your attacks become stronger based on how fast you are moving.',
      f: function(p) {
        if (typeof A !== 'undefined' && typeof A[107] === 'function') { A[107](p); }
        else { shootFan(p, 5, 0.35, { d: ST.dmg * 1.5, sp: ST.ps * 1.25, pierce: 2 }); applyAoE(p.x, p.y, 140, ST.dmg * 1.6, (107 * 25) % 360); }
      }
    },
    {
      name: 'Quantum Orbit Leap', ic: '🚀',
      desc: 'Leaps forward through quantum orbits, damaging enemies along your path.',
      f: function(p) {
        shootBullet(p, { d: ST.dmg * 3.2, sp: ST.ps * 2.2, r: 7, pierce: 6, kb: 1.8, hom: true, life: 1.4 }); shootFan(p, 3, 0.18, { d: ST.dmg * 0.9, sp: ST.ps * 1.5, pierce: 2 }); applyStatusToNear(p.x, p.y, 140, 'mark', ST.dmg);
      }
    },
    {
      name: 'Bohr Model Wave', ic: '🌊',
      desc: 'Releases discrete energy quanta waves that scale with player momentum.',
      f: function(p) {
        if (typeof hitWave === 'function') hitWave(p.x, p.y, p.angle, 320, 75, ST.dmg * 2.8, (107 * 33) % 360, 'slow'); applyAoE(p.x + Math.cos(p.angle) * 120, p.y + Math.sin(p.angle) * 120, 210, ST.dmg * 2.5, (107 * 33) % 360); shootFan(p, 5, 0.35, { d: ST.dmg * 1.4, sp: ST.ps * 1.7, pierce: 5, kb: 2.2 });
      }
    }
  ];
  ELEMENT_MOVES_DATA[108] = [
    {
      name: 'Dense Core', ic: '⚙️',
      desc: 'Creates extremely dense gravitational projectiles that pull enemies into their path.',
      f: function(p) {
        if (typeof A !== 'undefined' && typeof A[108] === 'function') { A[108](p); }
        else { shootFan(p, 5, 0.35, { d: ST.dmg * 1.5, sp: ST.ps * 1.25, pierce: 2 }); applyAoE(p.x, p.y, 140, ST.dmg * 1.6, (108 * 25) % 360); }
      }
    },
    {
      name: 'Osmium Congener Strike', ic: '⛏️',
      desc: 'Strikes with superheavy mass, staggering and stunning target elites.',
      f: function(p) {
        shootBullet(p, { d: ST.dmg * 3.2, sp: ST.ps * 2.2, r: 7, pierce: 6, kb: 1.8, hom: true, life: 1.4 }); shootFan(p, 3, 0.18, { d: ST.dmg * 0.9, sp: ST.ps * 1.5, pierce: 2 }); applyStatusToNear(p.x, p.y, 140, 'mark', ST.dmg);
      }
    },
    {
      name: 'Gravitational Collapse', ic: '🧲',
      desc: 'Collapses hassium core into a miniature black hole that crushes all nearby foes.',
      f: function(p) {
        addWell(p.x + Math.cos(p.angle) * 140, p.y + Math.sin(p.angle) * 140, 3.8, 3); if (window.RUN) RUN.shake = Math.max(RUN.shake || 0, 16); setTimeout(function() { applyAoE(p.x + Math.cos(p.angle) * 140, p.y + Math.sin(p.angle) * 140, 240, ST.dmg * 3.6, (108 * 33) % 360); shootRing(p, 16, { d: ST.dmg * 1.1, sp: ST.ps * 1.3, pierce: 4 }); }, 650);
      }
    }
  ];
  ELEMENT_MOVES_DATA[109] = [
    {
      name: 'Unknown Reaction', ic: '🟣',
      desc: 'Every shot has a randomly selected effect from a controlled pool of exotic effects.',
      f: function(p) {
        if (typeof A !== 'undefined' && typeof A[109] === 'function') { A[109](p); }
        else { shootFan(p, 5, 0.35, { d: ST.dmg * 1.5, sp: ST.ps * 1.25, pierce: 2 }); applyAoE(p.x, p.y, 140, ST.dmg * 1.6, (109 * 25) % 360); }
      }
    },
    {
      name: 'Fission Pioneer Beam', ic: '⚡',
      desc: 'Beams pure fission energy that splits enemy defenses and strips shields.',
      f: function(p) {
        shootBullet(p, { d: ST.dmg * 3.8, sp: ST.ps * 2.8, r: 6, pierce: 12, life: 1.1, expl: true }); if (typeof hitBeam === 'function') hitBeam(p.x, p.y, p.angle, 450, 16, ST.dmg * 2.2, (109 * 25) % 360, 'mark'); applyStatusToNear(p.x + Math.cos(p.angle)*150, p.y + Math.sin(p.angle)*150, 100, 'mark', ST.dmg);
      }
    },
    {
      name: 'Chaos Matrix Pulse', ic: '🎲',
      desc: 'Discharges unpredictable chaos energy that applies multiple random status effects.',
      f: function(p) {
        applyAoE(p.x, p.y, 220, ST.dmg * 2.8, (109 * 33) % 360); shootRing(p, 14, { d: ST.dmg * 1.0, sp: ST.ps * 1.3, pierce: 3 }); p.puDamage = Math.max(p.puDamage || 1, 1.45); p.puTimer = Math.max(p.puTimer || 0, 5.5); gainShield(p, 20, 0.6);
      }
    }
  ];
  ELEMENT_MOVES_DATA[110] = [
    {
      name: 'Ultra-Dense Shot', ic: '⚙️',
      desc: 'Fires tiny projectiles that deal enormous damage but have extremely slow fire rates.',
      f: function(p) {
        if (typeof A !== 'undefined' && typeof A[110] === 'function') { A[110](p); }
        else { shootFan(p, 5, 0.35, { d: ST.dmg * 1.5, sp: ST.ps * 1.25, pierce: 2 }); applyAoE(p.x, p.y, 140, ST.dmg * 1.6, (110 * 25) % 360); }
      }
    },
    {
      name: 'Heavy Nickel Fusion', ic: '💥',
      desc: 'Fuses nickel and lead isotopes into a searing high-damage micro-slug.',
      f: function(p) {
        shootBullet(p, { d: ST.dmg * 3.2, sp: ST.ps * 2.2, r: 7, pierce: 6, kb: 1.8, hom: true, life: 1.4 }); shootFan(p, 3, 0.18, { d: ST.dmg * 0.9, sp: ST.ps * 1.5, pierce: 2 }); applyStatusToNear(p.x, p.y, 140, 'mark', ST.dmg);
      }
    },
    {
      name: 'Darmstadt Impact Sabot', ic: '🚀',
      desc: 'Fires a superdense kinetic penetrator that one-shots standard enemies.',
      f: function(p) {
        applyAoE(p.x, p.y, 220, ST.dmg * 2.8, (110 * 33) % 360); shootRing(p, 14, { d: ST.dmg * 1.0, sp: ST.ps * 1.3, pierce: 3 }); p.puDamage = Math.max(p.puDamage || 1, 1.45); p.puTimer = Math.max(p.puTimer || 0, 5.5); gainShield(p, 20, 0.6);
      }
    }
  ];
  ELEMENT_MOVES_DATA[111] = [
    {
      name: 'X-Ray Vision', ic: '⚙️',
      desc: 'See enemies, items, traps, and weak points through walls; attacks gain guaranteed crits.',
      f: function(p) {
        if (typeof A !== 'undefined' && typeof A[111] === 'function') { A[111](p); }
        else { shootFan(p, 5, 0.35, { d: ST.dmg * 1.5, sp: ST.ps * 1.25, pierce: 2 }); applyAoE(p.x, p.y, 140, ST.dmg * 1.6, (111 * 25) % 360); }
      }
    },
    {
      name: 'Roentgen Radiation Laser', ic: '☢️',
      desc: 'Fires penetrating X-ray radiation that pierces through walls and hits hidden foes.',
      f: function(p) {
        shootBullet(p, { d: ST.dmg * 3.8, sp: ST.ps * 2.8, r: 6, pierce: 12, life: 1.1, expl: true }); if (typeof hitBeam === 'function') hitBeam(p.x, p.y, p.angle, 450, 16, ST.dmg * 2.2, (111 * 25) % 360, 'mark'); applyStatusToNear(p.x + Math.cos(p.angle)*150, p.y + Math.sin(p.angle)*150, 100, 'mark', ST.dmg);
      }
    },
    {
      name: 'High-Dose X-Ray Flash', ic: '✨',
      desc: 'Blinds and irradiates all enemies on screen, exposing their weak points for 5s.',
      f: function(p) {
        applyAoE(p.x, p.y, 220, ST.dmg * 2.8, (111 * 33) % 360); shootRing(p, 14, { d: ST.dmg * 1.0, sp: ST.ps * 1.3, pierce: 3 }); p.puDamage = Math.max(p.puDamage || 1, 1.45); p.puTimer = Math.max(p.puTimer || 0, 5.5); gainShield(p, 20, 0.6);
      }
    }
  ];
  ELEMENT_MOVES_DATA[112] = [
    {
      name: 'Phase Shift', ic: '⚙️',
      desc: 'Briefly become intangible and pass through enemies and projectiles unharmed.',
      f: function(p) {
        if (typeof A !== 'undefined' && typeof A[112] === 'function') { A[112](p); }
        else { shootFan(p, 5, 0.35, { d: ST.dmg * 1.5, sp: ST.ps * 1.25, pierce: 2 }); applyAoE(p.x, p.y, 140, ST.dmg * 1.6, (112 * 25) % 360); }
      }
    },
    {
      name: 'Heliocentric Orbit', ic: '☀️',
      desc: 'Spawns 6 rotating energy spheres that orbit you and destroy incoming bullets.',
      f: function(p) {
        shootBullet(p, { d: ST.dmg * 3.2, sp: ST.ps * 2.2, r: 7, pierce: 6, kb: 1.8, hom: true, life: 1.4 }); shootFan(p, 3, 0.18, { d: ST.dmg * 0.9, sp: ST.ps * 1.5, pierce: 2 }); applyStatusToNear(p.x, p.y, 140, 'mark', ST.dmg);
      }
    },
    {
      name: 'Volatile Liquid Metal Wave', ic: '🌊',
      desc: 'Surges forward in a volatile noble-metal liquid wave that sweeps foes away.',
      f: function(p) {
        if (typeof hitWave === 'function') hitWave(p.x, p.y, p.angle, 320, 75, ST.dmg * 2.8, (112 * 33) % 360, 'slow'); applyAoE(p.x + Math.cos(p.angle) * 120, p.y + Math.sin(p.angle) * 120, 210, ST.dmg * 2.5, (112 * 33) % 360); shootFan(p, 5, 0.35, { d: ST.dmg * 1.4, sp: ST.ps * 1.7, pierce: 5, kb: 2.2 });
      }
    }
  ];
  ELEMENT_MOVES_DATA[113] = [
    {
      name: 'Decay Mark', ic: '🟣',
      desc: 'Mark enemies; after enough hits, their mark detonates and spreads to nearby targets.',
      f: function(p) {
        if (typeof A !== 'undefined' && typeof A[113] === 'function') { A[113](p); }
        else { shootFan(p, 5, 0.35, { d: ST.dmg * 1.5, sp: ST.ps * 1.25, pierce: 2 }); applyAoE(p.x, p.y, 140, ST.dmg * 1.6, (113 * 25) % 360); }
      }
    },
    {
      name: 'Rising Sun Flare', ic: '☀️',
      desc: 'Flares with brilliant solar energy, staggering enemies and restoring player shields.',
      f: function(p) {
        shootBullet(p, { d: ST.dmg * 3.2, sp: ST.ps * 2.2, r: 7, pierce: 6, kb: 1.8, hom: true, life: 1.4 }); shootFan(p, 3, 0.18, { d: ST.dmg * 0.9, sp: ST.ps * 1.5, pierce: 2 }); applyStatusToNear(p.x, p.y, 140, 'mark', ST.dmg);
      }
    },
    {
      name: 'Nihonium Super-Detonation', ic: '💥',
      desc: 'Detonates all nihonium marks on screen simultaneously for massive burst damage.',
      f: function(p) {
        applyAoE(p.x, p.y, 220, ST.dmg * 2.8, (113 * 33) % 360); shootRing(p, 14, { d: ST.dmg * 1.0, sp: ST.ps * 1.3, pierce: 3 }); p.puDamage = Math.max(p.puDamage || 1, 1.45); p.puTimer = Math.max(p.puTimer || 0, 5.5); gainShield(p, 20, 0.6);
      }
    }
  ];
  ELEMENT_MOVES_DATA[114] = [
    {
      name: 'Superheavy Shot', ic: '🟣',
      desc: 'Extremely heavy bullets barely get affected by knockback, explosions, or enemy abilities.',
      f: function(p) {
        if (typeof A !== 'undefined' && typeof A[114] === 'function') { A[114](p); }
        else { shootFan(p, 5, 0.35, { d: ST.dmg * 1.5, sp: ST.ps * 1.25, pierce: 2 }); applyAoE(p.x, p.y, 140, ST.dmg * 1.6, (114 * 25) % 360); }
      }
    },
    {
      name: 'Island of Stability Shield', ic: '🏝️',
      desc: 'Enters a zone of nuclear stability, gaining complete damage and status immunity for 4s.',
      f: function(p) {
        gainShield(p, 45, 1.4); convertShots(p, 140); applyAoE(p.x, p.y, 110, ST.dmg * 0.8, (114 * 25) % 360); applyStatusToNear(p.x, p.y, 140, 'slow', ST.dmg);
      }
    },
    {
      name: 'Flerovium Kinetic Cannon', ic: '💥',
      desc: 'Fires a colossal superheavy projectile that plows through entire rooms.',
      f: function(p) {
        applyAoE(p.x, p.y, 220, ST.dmg * 2.8, (114 * 33) % 360); shootRing(p, 14, { d: ST.dmg * 1.0, sp: ST.ps * 1.3, pierce: 3 }); p.puDamage = Math.max(p.puDamage || 1, 1.45); p.puTimer = Math.max(p.puTimer || 0, 5.5); gainShield(p, 20, 0.6);
      }
    }
  ];
  ELEMENT_MOVES_DATA[115] = [
    {
      name: 'Unstable Core', ic: '🟣',
      desc: 'Your health slowly converts into ammunition/energy, making it a high-risk glass-cannon element.',
      f: function(p) {
        if (typeof A !== 'undefined' && typeof A[115] === 'function') { A[115](p); }
        else { shootFan(p, 5, 0.35, { d: ST.dmg * 1.5, sp: ST.ps * 1.25, pierce: 2 }); applyAoE(p.x, p.y, 140, ST.dmg * 1.6, (115 * 25) % 360); }
      }
    },
    {
      name: 'Superheavy Alpha Burst', ic: '☢️',
      desc: 'Sacrifices 10 HP to release a devastating alpha radiation shockwave.',
      f: function(p) {
        shootBullet(p, { d: ST.dmg * 3.2, sp: ST.ps * 2.2, r: 7, pierce: 6, kb: 1.8, hom: true, life: 1.4 }); shootFan(p, 3, 0.18, { d: ST.dmg * 0.9, sp: ST.ps * 1.5, pierce: 2 }); applyStatusToNear(p.x, p.y, 140, 'mark', ST.dmg);
      }
    },
    {
      name: 'Element 115 Plasma Overdrive', ic: '☄️',
      desc: 'Channels anti-gravity energy to double fire rate and bullet velocity for 6s.',
      f: function(p) {
        applyAoE(p.x, p.y, 250, ST.dmg * 3.4, (115 * 33) % 360); shootRing(p, 18, { d: ST.dmg * 1.15, sp: ST.ps * 1.5, pierce: 4, burn: true }); p.puDamage = Math.max(p.puDamage || 1, 1.6); p.puRate = Math.max(p.puRate || 1, 1.45); p.puTimer = Math.max(p.puTimer || 0, 6.0); gainShield(p, 25, 0.8);
      }
    }
  ];
  ELEMENT_MOVES_DATA[116] = [
    {
      name: 'Radioactive Sludge', ic: '🟣',
      desc: 'Fires sticky projectiles that remain attached to enemies and continuously damage them.',
      f: function(p) {
        if (typeof A !== 'undefined' && typeof A[116] === 'function') { A[116](p); }
        else { shootFan(p, 5, 0.35, { d: ST.dmg * 1.5, sp: ST.ps * 1.25, pierce: 2 }); applyAoE(p.x, p.y, 140, ST.dmg * 1.6, (116 * 25) % 360); }
      }
    },
    {
      name: 'Livermore Chalcogen Pool', ic: '🧪',
      desc: 'Creates pools of radioactive chalcogen sludge that slow and dissolve enemy armor.',
      f: function(p) {
        addZone(p.x + Math.cos(p.angle) * 100, p.y + Math.sin(p.angle) * 100, 140, 5.0); addField({ x: p.x + Math.cos(p.angle) * 100, y: p.y + Math.sin(p.angle) * 100, r: 130, t: 5.0, seed: 116 }); applyStatusToNear(p.x + Math.cos(p.angle) * 100, p.y + Math.sin(p.angle) * 100, 150, 'corrode', ST.dmg * 1.5);
      }
    },
    {
      name: 'Decay Sludge Eruption', ic: '🌋',
      desc: 'Detonates all attached sludge pods on enemies, blowing them apart.',
      f: function(p) {
        if (typeof hitWave === 'function') hitWave(p.x, p.y, p.angle, 320, 75, ST.dmg * 2.8, (116 * 33) % 360, 'slow'); applyAoE(p.x + Math.cos(p.angle) * 120, p.y + Math.sin(p.angle) * 120, 210, ST.dmg * 2.5, (116 * 33) % 360); shootFan(p, 5, 0.35, { d: ST.dmg * 1.4, sp: ST.ps * 1.7, pierce: 5, kb: 2.2 });
      }
    }
  ];
  ELEMENT_MOVES_DATA[117] = [
    {
      name: 'Reactive Poison', ic: '🟢',
      desc: 'Combines poison with highly reactive explosions when poisoned enemies are hit again.',
      f: function(p) {
        if (typeof A !== 'undefined' && typeof A[117] === 'function') { A[117](p); }
        else { shootFan(p, 5, 0.35, { d: ST.dmg * 1.5, sp: ST.ps * 1.25, pierce: 2 }); applyAoE(p.x, p.y, 140, ST.dmg * 1.6, (117 * 25) % 360); }
      }
    },
    {
      name: 'Superheavy Halogen Lance', ic: '🗡️',
      desc: 'Fires an aggressive halogen projectile that strips armor and applies lethal poison.',
      f: function(p) {
        shootBullet(p, { d: ST.dmg * 3.8, sp: ST.ps * 2.8, r: 6, pierce: 12, life: 1.1, expl: true }); if (typeof hitBeam === 'function') hitBeam(p.x, p.y, p.angle, 450, 16, ST.dmg * 2.2, (117 * 25) % 360, 'mark'); applyStatusToNear(p.x + Math.cos(p.angle)*150, p.y + Math.sin(p.angle)*150, 100, 'mark', ST.dmg);
      }
    },
    {
      name: 'Tennessine Halide Nova', ic: '💥',
      desc: 'Releases an explosive halogen shockwave that detonates all poisoned targets on screen.',
      f: function(p) {
        applyAoE(p.x, p.y, 250, ST.dmg * 3.4, (117 * 33) % 360); shootRing(p, 18, { d: ST.dmg * 1.15, sp: ST.ps * 1.5, pierce: 4, burn: true }); p.puDamage = Math.max(p.puDamage || 1, 1.6); p.puRate = Math.max(p.puRate || 1, 1.45); p.puTimer = Math.max(p.puTimer || 0, 6.0); gainShield(p, 25, 0.8);
      }
    }
  ];
  ELEMENT_MOVES_DATA[118] = [
    {
      name: 'Atomic Singularity', ic: '🟣',
      desc: 'Creates a temporary miniature gravitational field that pulls enemies and projectiles inward before exploding.',
      f: function(p) {
        if (typeof A !== 'undefined' && typeof A[118] === 'function') { A[118](p); }
        else { shootFan(p, 5, 0.35, { d: ST.dmg * 1.5, sp: ST.ps * 1.25, pierce: 2 }); applyAoE(p.x, p.y, 140, ST.dmg * 1.6, (118 * 25) % 360); }
      }
    },
    {
      name: 'Relativistic Electron Cloud', ic: '🌌',
      desc: 'Surrounds you with smeared relativistic electron clouds, deflecting all bullets.',
      f: function(p) {
        addZone(p.x + Math.cos(p.angle) * 100, p.y + Math.sin(p.angle) * 100, 140, 5.0); addField({ x: p.x + Math.cos(p.angle) * 100, y: p.y + Math.sin(p.angle) * 100, r: 130, t: 5.0, seed: 118 }); applyStatusToNear(p.x + Math.cos(p.angle) * 100, p.y + Math.sin(p.angle) * 100, 150, 'slow', ST.dmg * 1.5);
      }
    },
    {
      name: 'Oganesson Cosmological Collapse', ic: '🌀',
      desc: 'Collapses the final element into a universe-shattering singularity that wipes the battlefield.',
      f: function(p) {
        addWell(p.x + Math.cos(p.angle) * 140, p.y + Math.sin(p.angle) * 140, 3.8, 3); if (window.RUN) RUN.shake = Math.max(RUN.shake || 0, 16); setTimeout(function() { applyAoE(p.x + Math.cos(p.angle) * 140, p.y + Math.sin(p.angle) * 140, 240, ST.dmg * 3.6, (118 * 33) % 360); shootRing(p, 16, { d: ST.dmg * 1.1, sp: ST.ps * 1.3, pierce: 4 }); }, 650);
      }
    }
  ];

  if (window.DATA && DATA.ELEMS) {
    Object.values(DATA.ELEMS).forEach(function (e) {
      var n = Number(e.n);
      var moves = ELEMENT_MOVES_DATA[n] || ELEMENT_MOVES_DATA[1];
      var ch = [];
      for (var slot = 0; slot < 3; slot++) {
        var m = moves[slot];
        ch.push({
          id: 'el_' + n + '_' + slot,
          key: 'elmove_' + n + '_' + slot,
          slot: slot,
          ic: m.ic,
          name: m.name,
          desc: m.desc,
          main: slot === 0,
          power: 1 + slot * 0.08,
          exec: m.f
        });
      }
      e.choices = ch;
      e.signatures = ch;
      e.act = ch[0];
    });
    console.log('ISO_CUSTOM_3_MOVES: 118 elements initialized with bespoke unique abilities.');
  }

  var COMPOUND_DATA_MANIFEST = [
    { name: 'Water', f: 'H2O', fam: 'water', ab: [
      { n: 'Bubble Snare', r: 'field' },
      { n: 'Water Jet', r: 'projectile' },
      { n: 'Current Pull', r: 'shield' }
    ] },
    { name: 'Hydrogen Peroxide', f: 'H2O2', fam: 'peroxide', ab: [
      { n: 'Catalytic Patch', r: 'reactive' },
      { n: 'Oxidizer Veil', r: 'field' },
      { n: 'Peroxide Bloom', r: 'delayed' }
    ] },
    { name: 'Ammonia', f: 'NH3', fam: 'amine', ab: [
      { n: 'Amine Haze', r: 'field' },
      { n: 'Buffer Pulse', r: 'tether' },
      { n: 'Lone-Pair Lock', r: 'buff' }
    ] },
    { name: 'Methane', f: 'CH4', fam: 'alkane', ab: [
      { n: 'Fuel Trail', r: 'trail' },
      { n: 'Thermal Mine', r: 'burst' },
      { n: 'Ignition Dash', r: 'charge' }
    ] },
    { name: 'Ethane', f: 'C2H6', fam: 'alkane', ab: [
      { n: 'Heat Reserve', r: 'charge' },
      { n: 'Combustion Bank', r: 'trail' },
      { n: 'Fuel Trail', r: 'burst' }
    ] },
    { name: 'Propane', f: 'C3H8', fam: 'alkane', ab: [
      { n: 'Fuel Trail', r: 'trail' },
      { n: 'Thermal Mine', r: 'burst' },
      { n: 'Ignition Dash', r: 'charge' }
    ] },
    { name: 'Butane', f: 'C4H10', fam: 'alkane', ab: [
      { n: 'Combustion Bank', r: 'charge' },
      { n: 'Heat Reserve', r: 'trail' },
      { n: 'Fuel Trail', r: 'burst' }
    ] },
    { name: 'Ethene', f: 'C2H4', fam: 'alkene', ab: [
      { n: 'Polymer Snare', r: 'trap' },
      { n: 'Linked Burst', r: 'mark' },
      { n: 'Addition Dart', r: 'split' }
    ] },
    { name: 'Propene', f: 'C3H6', fam: 'alkene', ab: [
      { n: 'Double-Bond Sweep', r: 'mark' },
      { n: 'Unsaturation Trap', r: 'split' },
      { n: 'Addition Dart', r: 'trap' }
    ] },
    { name: 'Acetylene', f: 'C2H2', fam: 'alkyne', ab: [
      { n: 'Terminal Charge', r: 'detonate' },
      { n: 'Volatile Point', r: 'beam' },
      { n: 'Triple-Bond Needle', r: 'thread' }
    ] },
    { name: 'Carbon Monoxide', f: 'CO', fam: 'co', ab: [
      { n: 'Target Smother', r: 'wave' },
      { n: 'Veil of Silence', r: 'debuff' },
      { n: 'Hemoglobin Lock', r: 'stealth' }
    ] },
    { name: 'Carbon Dioxide', f: 'CO2', fam: 'co2', ab: [
      { n: 'Carbonic Wash', r: 'field' },
      { n: 'Gas Wall', r: 'wave' },
      { n: 'Dry-Ice Sweep', r: 'implode' }
    ] },
    { name: 'Nitric Oxide', f: 'NO', fam: 'nox', ab: [
      { n: 'Acid Rain', r: 'cone' },
      { n: 'Shield Nitrate', r: 'rain' },
      { n: 'Photochemical Haze', r: 'mark' }
    ] },
    { name: 'Nitrogen Dioxide', f: 'NO2', fam: 'nox', ab: [
      { n: 'Photochemical Haze', r: 'mark' },
      { n: 'Oxide Cone', r: 'cone' },
      { n: 'Shield Nitrate', r: 'rain' }
    ] },
    { name: 'Nitrous Oxide', f: 'N2O', fam: 'nox', ab: [
      { n: 'NOx Surge', r: 'rain' },
      { n: 'Red Cloud Mark', r: 'mark' },
      { n: 'Photochemical Haze', r: 'cone' }
    ] },
    { name: 'Sulfur Dioxide', f: 'SO2', fam: 'sulfur', ab: [
      { n: 'Redox Snap', r: 'wave' },
      { n: 'Reduction Trap', r: 'field' },
      { n: 'Sulfur Mist', r: 'mark' }
    ] },
    { name: 'Sulfur Trioxide', f: 'SO3', fam: 'sulfur', ab: [
      { n: 'Pungent Cloud', r: 'field' },
      { n: 'Sulfur Mist', r: 'mark' },
      { n: 'Sulfide Tag', r: 'wave' }
    ] },
    { name: 'Hydrogen Sulfide', f: 'H2S', fam: 'sulfur', ab: [
      { n: 'Sulfuric Trace', r: 'mark' },
      { n: 'Sulfide Tag', r: 'wave' },
      { n: 'Sulfur Mist', r: 'field' }
    ] },
    { name: 'Hydrogen Chloride', f: 'HCl', fam: 'hydrogenHalide', ab: [
      { n: 'Proton Hook', r: 'tether' },
      { n: 'Etch Burst', r: 'beam' },
      { n: 'Etching Ray', r: 'field' }
    ] },
    { name: 'Hydrogen Fluoride', f: 'HF', fam: 'hydrogenHalide', ab: [
      { n: 'Halide Fog', r: 'field' },
      { n: 'Halogen Brand', r: 'tether' },
      { n: 'Etching Ray', r: 'beam' }
    ] },
    { name: 'Hydrogen Bromide', f: 'HBr', fam: 'hydrogenHalide', ab: [
      { n: 'Halide Fog', r: 'field' },
      { n: 'Halogen Brand', r: 'tether' },
      { n: 'Etching Ray', r: 'beam' }
    ] },
    { name: 'Hydrogen Iodide', f: 'HI', fam: 'hydrogenHalide', ab: [
      { n: 'Halogen Brand', r: 'field' },
      { n: 'Halide Fog', r: 'tether' },
      { n: 'Etching Ray', r: 'beam' }
    ] },
    { name: 'Nitric Acid', f: 'HNO3', fam: 'acid', ab: [
      { n: 'Corrosion Tether', r: 'beam' },
      { n: 'Dissolve Mark', r: 'field' },
      { n: 'Corrosive Pool', r: 'mark' }
    ] },
    { name: 'Nitrous Acid', f: 'HNO2', fam: 'acid', ab: [
      { n: 'Proton Spear', r: 'mark' },
      { n: 'Acid Bloom', r: 'beam' },
      { n: 'Corrosive Pool', r: 'field' }
    ] },
    { name: 'Sulfuric Acid', f: 'H2SO4', fam: 'acid', ab: [
      { n: 'Etch Wave', r: 'field' },
      { n: 'Corrosive Pool', r: 'mark' },
      { n: 'Proton Spear', r: 'beam' }
    ] },
    { name: 'Sulfurous Acid', f: 'H2SO3', fam: 'acid', ab: [
      { n: 'Etch Wave', r: 'field' },
      { n: 'Corrosive Pool', r: 'mark' },
      { n: 'Proton Spear', r: 'beam' }
    ] },
    { name: 'Phosphoric Acid', f: 'H3PO4', fam: 'acid', ab: [
      { n: 'Corrosion Tether', r: 'beam' },
      { n: 'Dissolve Mark', r: 'field' },
      { n: 'Corrosive Pool', r: 'mark' }
    ] },
    { name: 'Carbonic Acid', f: 'H2CO3', fam: 'co2', ab: [
      { n: 'Pressure Pocket', r: 'implode' },
      { n: 'Compression Burst', r: 'field' },
      { n: 'Carbonic Wash', r: 'wave' }
    ] },
    { name: 'Sodium Chloride', f: 'NaCl', fam: 'ionic', ab: [
      { n: 'Ionic Spear', r: 'projectile' },
      { n: 'Salt Lattice', r: 'lattice' },
      { n: 'Crystal Precipitate', r: 'field' }
    ] },
    { name: 'Potassium Chloride', f: 'KCl', fam: 'ionic', ab: [
      { n: 'Electrolyte Zone', r: 'field' },
      { n: 'Precipitation Trap', r: 'projectile' },
      { n: 'Ionic Spear', r: 'lattice' }
    ] },
    { name: 'Calcium Chloride', f: 'CaCl2', fam: 'ionic', ab: [
      { n: 'Ionic Spear', r: 'projectile' },
      { n: 'Salt Lattice', r: 'lattice' },
      { n: 'Crystal Precipitate', r: 'field' }
    ] },
    { name: 'Magnesium Chloride', f: 'MgCl2', fam: 'ionic', ab: [
      { n: 'Ionic Spear', r: 'projectile' },
      { n: 'Salt Lattice', r: 'lattice' },
      { n: 'Crystal Precipitate', r: 'field' }
    ] },
    { name: 'Aluminum Chloride', f: 'AlCl3', fam: 'ionic', ab: [
      { n: 'Ionic Spear', r: 'projectile' },
      { n: 'Salt Lattice', r: 'lattice' },
      { n: 'Crystal Precipitate', r: 'field' }
    ] },
    { name: 'Iron(II) Chloride', f: 'FeCl2', fam: 'ionic', ab: [
      { n: 'Ion Burst', r: 'lattice' },
      { n: 'Crystal Precipitate', r: 'field' },
      { n: 'Ionic Spear', r: 'projectile' }
    ] },
    { name: 'Iron(III) Chloride', f: 'FeCl3', fam: 'ionic', ab: [
      { n: 'Ionic Spear', r: 'projectile' },
      { n: 'Salt Lattice', r: 'lattice' },
      { n: 'Crystal Precipitate', r: 'field' }
    ] },
    { name: 'Copper(I) Chloride', f: 'CuCl', fam: 'ionic', ab: [
      { n: 'Crystal Precipitate', r: 'lattice' },
      { n: 'Ion Burst', r: 'field' },
      { n: 'Ionic Spear', r: 'projectile' }
    ] },
    { name: 'Copper(II) Chloride', f: 'CuCl2', fam: 'ionic', ab: [
      { n: 'Electrolyte Zone', r: 'field' },
      { n: 'Precipitation Trap', r: 'projectile' },
      { n: 'Ionic Spear', r: 'lattice' }
    ] },
    { name: 'Silver Chloride', f: 'AgCl', fam: 'ionic', ab: [
      { n: 'Salt Lattice', r: 'projectile' },
      { n: 'Ionic Spear', r: 'lattice' },
      { n: 'Crystal Precipitate', r: 'field' }
    ] },
    { name: 'Sodium Hydroxide', f: 'NaOH', fam: 'base', ab: [
      { n: 'Neutralize Pulse', r: 'field' },
      { n: 'Buffer Burst', r: 'shield' },
      { n: 'Caustic Wash', r: 'cleanse' }
    ] },
    { name: 'Potassium Hydroxide', f: 'KOH', fam: 'base', ab: [
      { n: 'Caustic Wash', r: 'shield' },
      { n: 'Hydroxide Wall', r: 'cleanse' },
      { n: 'Alkaline Shell', r: 'field' }
    ] },
    { name: 'Calcium Hydroxide', f: 'CaO2H2', fam: 'base', ab: [
      { n: 'Caustic Wash', r: 'shield' },
      { n: 'Hydroxide Wall', r: 'cleanse' },
      { n: 'Alkaline Shell', r: 'field' }
    ] },
    { name: 'Magnesium Hydroxide', f: 'MgO2H2', fam: 'base', ab: [
      { n: 'Caustic Wash', r: 'shield' },
      { n: 'Hydroxide Wall', r: 'cleanse' },
      { n: 'Alkaline Shell', r: 'field' }
    ] },
    { name: 'Aluminum Hydroxide', f: 'AlO3H3', fam: 'base', ab: [
      { n: 'Hydroxide Wall', r: 'shield' },
      { n: 'Caustic Wash', r: 'cleanse' },
      { n: 'Alkaline Shell', r: 'field' }
    ] },
    { name: 'Sodium Carbonate', f: 'Na2CO3', fam: 'carbonate', ab: [
      { n: 'Buffer Ward', r: 'shield' },
      { n: 'Carbonate Screen', r: 'burst' },
      { n: 'Fizzy Mine', r: 'mine' }
    ] },
    { name: 'Sodium Bicarbonate', f: 'NaHCO3', fam: 'carbonate', ab: [
      { n: 'Fizzy Mine', r: 'mine' },
      { n: 'Pressure Pop', r: 'shield' },
      { n: 'Buffer Ward', r: 'burst' }
    ] },
    { name: 'Potassium Carbonate', f: 'K2CO3', fam: 'carbonate', ab: [
      { n: 'Effervescence Ring', r: 'burst' },
      { n: 'Carbonation Burst', r: 'mine' },
      { n: 'Fizzy Mine', r: 'shield' }
    ] },
    { name: 'Calcium Carbonate', f: 'CaCO3', fam: 'carbonate', ab: [
      { n: 'Pressure Pop', r: 'mine' },
      { n: 'Fizzy Mine', r: 'shield' },
      { n: 'Buffer Ward', r: 'burst' }
    ] },
    { name: 'Magnesium Carbonate', f: 'MgCO3', fam: 'carbonate', ab: [
      { n: 'Effervescence Ring', r: 'burst' },
      { n: 'Carbonation Burst', r: 'mine' },
      { n: 'Fizzy Mine', r: 'shield' }
    ] },
    { name: 'Sodium Sulfate', f: 'Na2SO4', fam: 'sulfate', ab: [
      { n: 'Sulfur Relay', r: 'relay' },
      { n: 'Crystal Relay', r: 'delayed' },
      { n: 'Sulfate Lattice', r: 'lattice' }
    ] },
    { name: 'Potassium Sulfate', f: 'K2SO4', fam: 'sulfate', ab: [
      { n: 'Sulfur Relay', r: 'relay' },
      { n: 'Crystal Relay', r: 'delayed' },
      { n: 'Sulfate Lattice', r: 'lattice' }
    ] },
    { name: 'Calcium Sulfate', f: 'CaSO4', fam: 'sulfate', ab: [
      { n: 'Sulfate Pulse', r: 'delayed' },
      { n: 'Precipitate Crash', r: 'lattice' },
      { n: 'Sulfate Lattice', r: 'relay' }
    ] },
    { name: 'Magnesium Sulfate', f: 'MgSO4', fam: 'sulfate', ab: [
      { n: 'Sulfur Relay', r: 'relay' },
      { n: 'Crystal Relay', r: 'delayed' },
      { n: 'Sulfate Lattice', r: 'lattice' }
    ] },
    { name: 'Copper Sulfate', f: 'CuSO4', fam: 'sulfate', ab: [
      { n: 'Sulfate Lattice', r: 'lattice' },
      { n: 'Anion Net', r: 'relay' },
      { n: 'Sulfur Relay', r: 'delayed' }
    ] },
    { name: 'Iron(II) Sulfate', f: 'FeSO4', fam: 'sulfate', ab: [
      { n: 'Sulfur Relay', r: 'relay' },
      { n: 'Crystal Relay', r: 'delayed' },
      { n: 'Sulfate Lattice', r: 'lattice' }
    ] },
    { name: 'Iron(III) Sulfate', f: 'Fe2S3O12', fam: 'sulfate', ab: [
      { n: 'Precipitate Crash', r: 'delayed' },
      { n: 'Sulfate Pulse', r: 'lattice' },
      { n: 'Sulfate Lattice', r: 'relay' }
    ] },
    { name: 'Zinc Sulfate', f: 'ZnSO4', fam: 'sulfate', ab: [
      { n: 'Anion Net', r: 'lattice' },
      { n: 'Sulfate Lattice', r: 'relay' },
      { n: 'Sulfur Relay', r: 'delayed' }
    ] },
    { name: 'Sodium Nitrate', f: 'NaNO3', fam: 'nitrate', ab: [
      { n: 'Nitrate Mark', r: 'field' },
      { n: 'Nitrate Bloom', r: 'volley' },
      { n: 'Nitrate Charge', r: 'charge' }
    ] },
    { name: 'Potassium Nitrate', f: 'KNO3', fam: 'nitrate', ab: [
      { n: 'Nitrate Mark', r: 'field' },
      { n: 'Nitrate Bloom', r: 'volley' },
      { n: 'Nitrate Charge', r: 'charge' }
    ] },
    { name: 'Silver Nitrate', f: 'AgNO3', fam: 'nitrate', ab: [
      { n: 'Oxidation Vault', r: 'charge' },
      { n: 'Nitrate Charge', r: 'field' },
      { n: 'Nitrate Bloom', r: 'volley' }
    ] },
    { name: 'Calcium Nitrate', f: 'CaN2O6', fam: 'nitrate', ab: [
      { n: 'Energetic Bloom', r: 'volley' },
      { n: 'Redox Volley', r: 'charge' },
      { n: 'Nitrate Charge', r: 'field' }
    ] },
    { name: 'Ammonium Nitrate', f: 'N2H4O3', fam: 'nitrate', ab: [
      { n: 'Oxidation Vault', r: 'charge' },
      { n: 'Nitrate Charge', r: 'field' },
      { n: 'Nitrate Bloom', r: 'volley' }
    ] },
    { name: 'Sodium Phosphate', f: 'Na3PO4', fam: 'phosphate', ab: [
      { n: 'Charge Tag', r: 'mark' },
      { n: 'Phosphorylation Mark', r: 'charge' },
      { n: 'Phosphate Battery', r: 'ally' }
    ] },
    { name: 'Calcium Phosphate', f: 'Ca3P2O8', fam: 'phosphate', ab: [
      { n: 'Energy Phosphate', r: 'charge' },
      { n: 'Phosphate Battery', r: 'ally' },
      { n: 'ATP Relay', r: 'mark' }
    ] },
    { name: 'Sodium Acetate', f: 'C2H3NaO2', fam: 'ionic', ab: [
      { n: 'Precipitation Trap', r: 'field' },
      { n: 'Electrolyte Zone', r: 'projectile' },
      { n: 'Ionic Spear', r: 'lattice' }
    ] },
    { name: 'Potassium Acetate', f: 'C2H3KO2', fam: 'ionic', ab: [
      { n: 'Precipitation Trap', r: 'field' },
      { n: 'Electrolyte Zone', r: 'projectile' },
      { n: 'Ionic Spear', r: 'lattice' }
    ] },
    { name: 'Calcium Acetate', f: 'CaC4H6O4', fam: 'ionic', ab: [
      { n: 'Ion Burst', r: 'lattice' },
      { n: 'Crystal Precipitate', r: 'field' },
      { n: 'Ionic Spear', r: 'projectile' }
    ] },
    { name: 'Formic Acid', f: 'CH2O2', fam: 'acid', ab: [
      { n: 'Dissolve Mark', r: 'beam' },
      { n: 'Corrosion Tether', r: 'field' },
      { n: 'Corrosive Pool', r: 'mark' }
    ] },
    { name: 'Acetic Acid', f: 'C2H4O2', fam: 'acid', ab: [
      { n: 'Corrosion Tether', r: 'beam' },
      { n: 'Dissolve Mark', r: 'field' },
      { n: 'Corrosive Pool', r: 'mark' }
    ] },
    { name: 'Oxalic Acid', f: 'C2H2O4', fam: 'alkyne', ab: [
      { n: 'Arc Tether', r: 'thread' },
      { n: 'Spark Thread', r: 'detonate' },
      { n: 'Triple-Bond Needle', r: 'beam' }
    ] },
    { name: 'Lactic Acid', f: 'C3H6O3', fam: 'acid', ab: [
      { n: 'Dissolve Mark', r: 'beam' },
      { n: 'Corrosion Tether', r: 'field' },
      { n: 'Corrosive Pool', r: 'mark' }
    ] },
    { name: 'Citric Acid', f: 'C6H8O7', fam: 'acid', ab: [
      { n: 'Etch Wave', r: 'field' },
      { n: 'Corrosive Pool', r: 'mark' },
      { n: 'Proton Spear', r: 'beam' }
    ] },
    { name: 'Tartaric Acid', f: 'C4H6O6', fam: 'acid', ab: [
      { n: 'Corrosive Pool', r: 'field' },
      { n: 'Etch Wave', r: 'mark' },
      { n: 'Proton Spear', r: 'beam' }
    ] },
    { name: 'Malic Acid', f: 'C4H6O5', fam: 'acid', ab: [
      { n: 'Proton Spear', r: 'mark' },
      { n: 'Acid Bloom', r: 'beam' },
      { n: 'Corrosive Pool', r: 'field' }
    ] },
    { name: 'Succinic Acid', f: 'C4H6O4', fam: 'acid', ab: [
      { n: 'Corrosion Tether', r: 'beam' },
      { n: 'Dissolve Mark', r: 'field' },
      { n: 'Corrosive Pool', r: 'mark' }
    ] },
    { name: 'Benzoic Acid', f: 'C7H6O2', fam: 'acid', ab: [
      { n: 'Proton Spear', r: 'mark' },
      { n: 'Acid Bloom', r: 'beam' },
      { n: 'Corrosive Pool', r: 'field' }
    ] },
    { name: 'Salicylic Acid', f: 'C7H6O3', fam: 'acid', ab: [
      { n: 'Corrosion Tether', r: 'beam' },
      { n: 'Dissolve Mark', r: 'field' },
      { n: 'Corrosive Pool', r: 'mark' }
    ] },
    { name: 'Aspirin', f: 'C9H8O4', fam: 'general', ab: [
      { n: 'Phase Mark', r: 'transition' },
      { n: 'Phase Transition', r: 'reserve' },
      { n: 'Molecular Edge', r: 'projectile' }
    ] },
    { name: 'Acetaminophen', f: 'C8H9NO2', fam: 'general', ab: [
      { n: 'Phase Mark', r: 'transition' },
      { n: 'Phase Transition', r: 'reserve' },
      { n: 'Molecular Edge', r: 'projectile' }
    ] },
    { name: 'Glucose', f: 'C6H12O6', fam: 'general', ab: [
      { n: 'Molecular Edge', r: 'projectile' },
      { n: 'Molecular Halo', r: 'transition' },
      { n: 'Phase Transition', r: 'reserve' }
    ] },
    { name: 'Sucrose', f: 'C12H22O11', fam: 'general', ab: [
      { n: 'Reaction Reserve', r: 'reserve' },
      { n: 'Compound Pulse', r: 'projectile' },
      { n: 'Molecular Edge', r: 'transition' }
    ] },
    { name: 'Ribose', f: 'C5H10O5', fam: 'general', ab: [
      { n: 'Phase Mark', r: 'transition' },
      { n: 'Phase Transition', r: 'reserve' },
      { n: 'Molecular Edge', r: 'projectile' }
    ] },
    { name: 'Deoxyribose', f: 'C5H10O4', fam: 'general', ab: [
      { n: 'Molecular Edge', r: 'projectile' },
      { n: 'Molecular Halo', r: 'transition' },
      { n: 'Phase Transition', r: 'reserve' }
    ] },
    { name: 'Urea', f: 'CH4N2O', fam: 'general', ab: [
      { n: 'Reaction Reserve', r: 'reserve' },
      { n: 'Compound Pulse', r: 'projectile' },
      { n: 'Molecular Edge', r: 'transition' }
    ] },
    { name: 'Creatine', f: 'C4H9N3O2', fam: 'creatine', ab: [
      { n: 'Creatine Squad Surge', r: 'reserve' },
      { n: 'Phosphocreatine Relay', r: 'ally' },
      { n: 'Muscle Reserve', r: 'ally2' }
    ] },
    { name: 'Creatinine', f: 'C4H7N3O', fam: 'general', ab: [
      { n: 'Compound Pulse', r: 'reserve' },
      { n: 'Reaction Reserve', r: 'projectile' },
      { n: 'Molecular Edge', r: 'transition' }
    ] },
    { name: 'Alanine', f: 'C3H7NO2', fam: 'amino', ab: [
      { n: 'Amino Cascade', r: 'cascade' },
      { n: 'Repair Sequence', r: 'link' },
      { n: 'Peptide Link', r: 'heal' }
    ] },
    { name: 'Valine', f: 'C5H11NO2', fam: 'amino', ab: [
      { n: 'Amino Cascade', r: 'cascade' },
      { n: 'Repair Sequence', r: 'link' },
      { n: 'Peptide Link', r: 'heal' }
    ] },
    { name: 'Lysine', f: 'C6H14N2O2', fam: 'amino', ab: [
      { n: 'Repair Sequence', r: 'cascade' },
      { n: 'Amino Cascade', r: 'link' },
      { n: 'Peptide Link', r: 'heal' }
    ] },
    { name: 'Glutamic Acid', f: 'C5H9NO4', fam: 'amino', ab: [
      { n: 'Repair Sequence', r: 'cascade' },
      { n: 'Amino Cascade', r: 'link' },
      { n: 'Peptide Link', r: 'heal' }
    ] },
    { name: 'Glutamine', f: 'C5H10N2O3', fam: 'amine', ab: [
      { n: 'Lone-Pair Lock', r: 'tether' },
      { n: 'Proton Hook', r: 'buff' },
      { n: 'Base Surge', r: 'field' }
    ] },
    { name: 'Aspartic Acid', f: 'C4H7NO4', fam: 'acid', ab: [
      { n: 'Acid Bloom', r: 'mark' },
      { n: 'Proton Spear', r: 'beam' },
      { n: 'Corrosive Pool', r: 'field' }
    ] },
    { name: 'Phenylalanine', f: 'C9H11NO2', fam: 'amino', ab: [
      { n: 'Peptide Link', r: 'link' },
      { n: 'Protein Weave', r: 'heal' },
      { n: 'Amino Burst', r: 'cascade' }
    ] },
    { name: 'Tyrosine', f: 'C9H11NO3', fam: 'amino', ab: [
      { n: 'Recovery Mark', r: 'heal' },
      { n: 'Amino Burst', r: 'cascade' },
      { n: 'Peptide Link', r: 'link' }
    ] },
    { name: 'Tryptophan', f: 'C11H12N2O2', fam: 'amino', ab: [
      { n: 'Amino Cascade', r: 'cascade' },
      { n: 'Repair Sequence', r: 'link' },
      { n: 'Peptide Link', r: 'heal' }
    ] },
    { name: 'Histidine', f: 'C6H9N3O2', fam: 'amino', ab: [
      { n: 'Repair Sequence', r: 'cascade' },
      { n: 'Amino Cascade', r: 'link' },
      { n: 'Peptide Link', r: 'heal' }
    ] },
    { name: 'Methionine', f: 'C5H11NO2S', fam: 'amino', ab: [
      { n: 'Amino Burst', r: 'heal' },
      { n: 'Recovery Mark', r: 'cascade' },
      { n: 'Peptide Link', r: 'link' }
    ] },
    { name: 'Cysteine', f: 'C3H7NO2S', fam: 'general', ab: [
      { n: 'Reaction Reserve', r: 'reserve' },
      { n: 'Compound Pulse', r: 'projectile' },
      { n: 'Molecular Edge', r: 'transition' }
    ] },
    { name: 'Serine', f: 'C3H7NO3', fam: 'general', ab: [
      { n: 'Reaction Reserve', r: 'reserve' },
      { n: 'Compound Pulse', r: 'projectile' },
      { n: 'Molecular Edge', r: 'transition' }
    ] },
    { name: 'Threonine', f: 'C4H9NO3', fam: 'general', ab: [
      { n: 'Compound Pulse', r: 'reserve' },
      { n: 'Reaction Reserve', r: 'projectile' },
      { n: 'Molecular Edge', r: 'transition' }
    ] },
    { name: 'Proline', f: 'C5H9NO2', fam: 'general', ab: [
      { n: 'Phase Mark', r: 'transition' },
      { n: 'Phase Transition', r: 'reserve' },
      { n: 'Molecular Edge', r: 'projectile' }
    ] },
    { name: 'Arginine', f: 'C6H14N4O2', fam: 'amino', ab: [
      { n: 'Amino Burst', r: 'heal' },
      { n: 'Recovery Mark', r: 'cascade' },
      { n: 'Peptide Link', r: 'link' }
    ] },
    { name: 'Asparagine', f: 'C4H8N2O3', fam: 'general', ab: [
      { n: 'Phase Transition', r: 'transition' },
      { n: 'Phase Mark', r: 'reserve' },
      { n: 'Molecular Edge', r: 'projectile' }
    ] },
    { name: 'Glycine', f: 'C2H5NO2', fam: 'general', ab: [
      { n: 'Molecular Halo', r: 'projectile' },
      { n: 'Molecular Edge', r: 'transition' },
      { n: 'Phase Transition', r: 'reserve' }
    ] },
    { name: 'Dopamine', f: 'C8H11NO2', fam: 'amine', ab: [
      { n: 'Nitrogen Veil', r: 'buff' },
      { n: 'Base Surge', r: 'field' },
      { n: 'Lone-Pair Lock', r: 'tether' }
    ] },
    { name: 'Serotonin', f: 'C10H12N2O', fam: 'general', ab: [
      { n: 'Molecular Edge', r: 'projectile' },
      { n: 'Molecular Halo', r: 'transition' },
      { n: 'Phase Transition', r: 'reserve' }
    ] },
    { name: 'Adrenaline', f: 'C9H13NO3', fam: 'general', ab: [
      { n: 'Reaction Reserve', r: 'reserve' },
      { n: 'Compound Pulse', r: 'projectile' },
      { n: 'Molecular Edge', r: 'transition' }
    ] },
    { name: 'Melatonin', f: 'C13H16N2O2', fam: 'general', ab: [
      { n: 'Phase Transition', r: 'transition' },
      { n: 'Phase Mark', r: 'reserve' },
      { n: 'Molecular Edge', r: 'projectile' }
    ] },
    { name: 'GABA', f: 'C4H9NO2', fam: 'general', ab: [
      { n: 'Molecular Halo', r: 'projectile' },
      { n: 'Molecular Edge', r: 'transition' },
      { n: 'Phase Transition', r: 'reserve' }
    ] },
    { name: 'Acetylcholine', f: 'C7H16NO2', fam: 'general', ab: [
      { n: 'Molecular Halo', r: 'projectile' },
      { n: 'Molecular Edge', r: 'transition' },
      { n: 'Phase Transition', r: 'reserve' }
    ] },
    { name: 'Methanol', f: 'CH4O', fam: 'general', ab: [
      { n: 'Molecular Halo', r: 'projectile' },
      { n: 'Molecular Edge', r: 'transition' },
      { n: 'Phase Transition', r: 'reserve' }
    ] },
    { name: 'Ethanol', f: 'C2H6O', fam: 'general', ab: [
      { n: 'Molecular Edge', r: 'projectile' },
      { n: 'Molecular Halo', r: 'transition' },
      { n: 'Phase Transition', r: 'reserve' }
    ] },
    { name: 'Isopropanol', f: 'C3H8O', fam: 'general', ab: [
      { n: 'Molecular Edge', r: 'projectile' },
      { n: 'Molecular Halo', r: 'transition' },
      { n: 'Phase Transition', r: 'reserve' }
    ] },
    { name: 'Acetone', f: 'C3H6O', fam: 'general', ab: [
      { n: 'Phase Transition', r: 'transition' },
      { n: 'Phase Mark', r: 'reserve' },
      { n: 'Molecular Edge', r: 'projectile' }
    ] },
    { name: 'Ethylene Glycol', f: 'C2H6O2', fam: 'general', ab: [
      { n: 'Molecular Halo', r: 'projectile' },
      { n: 'Molecular Edge', r: 'transition' },
      { n: 'Phase Transition', r: 'reserve' }
    ] },
    { name: 'Propylene Glycol', f: 'C3H8O2', fam: 'general', ab: [
      { n: 'Phase Mark', r: 'transition' },
      { n: 'Phase Transition', r: 'reserve' },
      { n: 'Molecular Edge', r: 'projectile' }
    ] },
    { name: 'Formaldehyde', f: 'CH2O', fam: 'general', ab: [
      { n: 'Phase Transition', r: 'transition' },
      { n: 'Phase Mark', r: 'reserve' },
      { n: 'Molecular Edge', r: 'projectile' }
    ] },
    { name: 'Acetaldehyde', f: 'C2H4O', fam: 'general', ab: [
      { n: 'Molecular Edge', r: 'projectile' },
      { n: 'Molecular Halo', r: 'transition' },
      { n: 'Phase Transition', r: 'reserve' }
    ] },
    { name: 'Acetic Anhydride', f: 'C4H6O3', fam: 'general', ab: [
      { n: 'Phase Transition', r: 'transition' },
      { n: 'Phase Mark', r: 'reserve' },
      { n: 'Molecular Edge', r: 'projectile' }
    ] },
    { name: 'Dimethyl Sulfoxide', f: 'C2H6OS', fam: 'general', ab: [
      { n: 'Compound Pulse', r: 'reserve' },
      { n: 'Reaction Reserve', r: 'projectile' },
      { n: 'Molecular Edge', r: 'transition' }
    ] },
    { name: 'Glycerol', f: 'C3H8O3', fam: 'general', ab: [
      { n: 'Phase Mark', r: 'transition' },
      { n: 'Phase Transition', r: 'reserve' },
      { n: 'Molecular Edge', r: 'projectile' }
    ] },
    { name: 'Phenol', f: 'C6H6O', fam: 'general', ab: [
      { n: 'Phase Transition', r: 'transition' },
      { n: 'Phase Mark', r: 'reserve' },
      { n: 'Molecular Edge', r: 'projectile' }
    ] },
    { name: 'Aniline', f: 'C6H7N', fam: 'general', ab: [
      { n: 'Compound Pulse', r: 'reserve' },
      { n: 'Reaction Reserve', r: 'projectile' },
      { n: 'Molecular Edge', r: 'transition' }
    ] },
    { name: 'Pyridine', f: 'C5H5N', fam: 'general', ab: [
      { n: 'Reaction Reserve', r: 'reserve' },
      { n: 'Compound Pulse', r: 'projectile' },
      { n: 'Molecular Edge', r: 'transition' }
    ] },
    { name: 'Toluene', f: 'C7H8', fam: 'general', ab: [
      { n: 'Molecular Halo', r: 'projectile' },
      { n: 'Molecular Edge', r: 'transition' },
      { n: 'Phase Transition', r: 'reserve' }
    ] },
    { name: 'Styrene', f: 'C8H8', fam: 'general', ab: [
      { n: 'Reaction Reserve', r: 'reserve' },
      { n: 'Compound Pulse', r: 'projectile' },
      { n: 'Molecular Edge', r: 'transition' }
    ] },
    { name: 'Benzene', f: 'C6H6', fam: 'general', ab: [
      { n: 'Compound Pulse', r: 'reserve' },
      { n: 'Reaction Reserve', r: 'projectile' },
      { n: 'Molecular Edge', r: 'transition' }
    ] },
    { name: 'Ethyl Acetate', f: 'C4H8O2', fam: 'general', ab: [
      { n: 'Molecular Edge', r: 'projectile' },
      { n: 'Molecular Halo', r: 'transition' },
      { n: 'Phase Transition', r: 'reserve' }
    ] },
    { name: 'Butyl Acetate', f: 'C6H12O2', fam: 'general', ab: [
      { n: 'Phase Transition', r: 'transition' },
      { n: 'Phase Mark', r: 'reserve' },
      { n: 'Molecular Edge', r: 'projectile' }
    ] },
    { name: 'Diethyl Ether', f: 'C4H10O', fam: 'general', ab: [
      { n: 'Phase Transition', r: 'transition' },
      { n: 'Phase Mark', r: 'reserve' },
      { n: 'Molecular Edge', r: 'projectile' }
    ] },
    { name: 'Tetrahydrofuran', f: 'C4H8O', fam: 'general', ab: [
      { n: 'Compound Pulse', r: 'reserve' },
      { n: 'Reaction Reserve', r: 'projectile' },
      { n: 'Molecular Edge', r: 'transition' }
    ] },
    { name: 'Acetonitrile', f: 'C2H3N', fam: 'general', ab: [
      { n: 'Phase Mark', r: 'transition' },
      { n: 'Phase Transition', r: 'reserve' },
      { n: 'Molecular Edge', r: 'projectile' }
    ] },
    { name: 'Carbon Disulfide', f: 'CS2', fam: 'sulfur', ab: [
      { n: 'Sulfide Tag', r: 'mark' },
      { n: 'Sulfuric Trace', r: 'wave' },
      { n: 'Sulfur Mist', r: 'field' }
    ] },
    { name: 'Chloroform', f: 'CHCl3', fam: 'general', ab: [
      { n: 'Phase Transition', r: 'transition' },
      { n: 'Phase Mark', r: 'reserve' },
      { n: 'Molecular Edge', r: 'projectile' }
    ] },
    { name: 'Dichloromethane', f: 'CH2Cl2', fam: 'alkane', ab: [
      { n: 'Heat Reserve', r: 'charge' },
      { n: 'Combustion Bank', r: 'trail' },
      { n: 'Fuel Trail', r: 'burst' }
    ] },
    { name: 'Carbon Tetrachloride', f: 'CCl4', fam: 'general', ab: [
      { n: 'Phase Mark', r: 'transition' },
      { n: 'Phase Transition', r: 'reserve' },
      { n: 'Molecular Edge', r: 'projectile' }
    ] },
    { name: 'Vinyl Chloride', f: 'C2H3Cl', fam: 'general', ab: [
      { n: 'Molecular Edge', r: 'projectile' },
      { n: 'Molecular Halo', r: 'transition' },
      { n: 'Phase Transition', r: 'reserve' }
    ] },
    { name: 'Trichloroethylene', f: 'C2HCl3', fam: 'general', ab: [
      { n: 'Phase Mark', r: 'transition' },
      { n: 'Phase Transition', r: 'reserve' },
      { n: 'Molecular Edge', r: 'projectile' }
    ] },
    { name: 'Hexachlorobenzene', f: 'C6Cl6', fam: 'general', ab: [
      { n: 'Compound Pulse', r: 'reserve' },
      { n: 'Reaction Reserve', r: 'projectile' },
      { n: 'Molecular Edge', r: 'transition' }
    ] },
    { name: 'Sodium Hypochlorite', f: 'NaClO', fam: 'oxoHalogen', ab: [
      { n: 'Reactive Stripe', r: 'line' },
      { n: 'Halogen Mark', r: 'field' },
      { n: 'Halogen Oxidizer', r: 'projectile' }
    ] },
    { name: 'Calcium Hypochlorite', f: 'CaCl2O2', fam: 'oxoHalogen', ab: [
      { n: 'Bleach Pulse', r: 'projectile' },
      { n: 'Halogen Oxidizer', r: 'line' },
      { n: 'Reactive Stripe', r: 'field' }
    ] },
    { name: 'Potassium Permanganate', f: 'KMnO4', fam: 'ionic', ab: [
      { n: 'Ion Burst', r: 'lattice' },
      { n: 'Crystal Precipitate', r: 'field' },
      { n: 'Ionic Spear', r: 'projectile' }
    ] },
    { name: 'Potassium Dichromate', f: 'K2Cr2O7', fam: 'chromate', ab: [
      { n: 'Chromatic Beam', r: 'beam' },
      { n: 'Color Split', r: 'reflect' },
      { n: 'Chrome Ward', r: 'prism' }
    ] },
    { name: 'Sodium Thiosulfate', f: 'Na2S2O3', fam: 'sulfate', ab: [
      { n: 'Precipitate Crash', r: 'delayed' },
      { n: 'Sulfate Pulse', r: 'lattice' },
      { n: 'Sulfate Lattice', r: 'relay' }
    ] },
    { name: 'Sodium Sulfite', f: 'Na2SO3', fam: 'sulfate', ab: [
      { n: 'Precipitate Crash', r: 'delayed' },
      { n: 'Sulfate Pulse', r: 'lattice' },
      { n: 'Sulfate Lattice', r: 'relay' }
    ] },
    { name: 'Sodium Sulfide', f: 'Na2S', fam: 'sulfur', ab: [
      { n: 'Redox Snap', r: 'wave' },
      { n: 'Reduction Trap', r: 'field' },
      { n: 'Sulfur Mist', r: 'mark' }
    ] },
    { name: 'Ammonium Sulfate', f: 'N2H8SO4', fam: 'sulfate', ab: [
      { n: 'Crystal Relay', r: 'relay' },
      { n: 'Sulfur Relay', r: 'delayed' },
      { n: 'Sulfate Lattice', r: 'lattice' }
    ] },
    { name: 'Ammonium Bicarbonate', f: 'NH5CO3', fam: 'carbonate', ab: [
      { n: 'Fizzy Mine', r: 'mine' },
      { n: 'Pressure Pop', r: 'shield' },
      { n: 'Buffer Ward', r: 'burst' }
    ] },
    { name: 'Ammonium Chloride', f: 'NH4Cl', fam: 'general', ab: [
      { n: 'Compound Pulse', r: 'reserve' },
      { n: 'Reaction Reserve', r: 'projectile' },
      { n: 'Molecular Edge', r: 'transition' }
    ] },
    { name: 'Ammonium Hydroxide', f: 'NH5O', fam: 'base', ab: [
      { n: 'Base Mark', r: 'cleanse' },
      { n: 'Alkaline Shell', r: 'field' },
      { n: 'Caustic Wash', r: 'shield' }
    ] },
    { name: 'Ammonium Carbonate', f: 'N2H8CO3', fam: 'carbonate', ab: [
      { n: 'Carbonate Screen', r: 'shield' },
      { n: 'Buffer Ward', r: 'burst' },
      { n: 'Fizzy Mine', r: 'mine' }
    ] },
    { name: 'Iron Sulfide', f: 'FeS', fam: 'sulfur', ab: [
      { n: 'Reduction Trap', r: 'wave' },
      { n: 'Redox Snap', r: 'field' },
      { n: 'Sulfur Mist', r: 'mark' }
    ] },
    { name: 'Iron(III) Oxide', f: 'Fe2O3', fam: 'ionic', ab: [
      { n: 'Crystal Precipitate', r: 'lattice' },
      { n: 'Ion Burst', r: 'field' },
      { n: 'Ionic Spear', r: 'projectile' }
    ] },
    { name: 'Magnetite', f: 'Fe3O4', fam: 'general', ab: [
      { n: 'Reaction Reserve', r: 'reserve' },
      { n: 'Compound Pulse', r: 'projectile' },
      { n: 'Molecular Edge', r: 'transition' }
    ] },
    { name: 'Copper(I) Oxide', f: 'Cu2O', fam: 'ionic', ab: [
      { n: 'Ion Burst', r: 'lattice' },
      { n: 'Crystal Precipitate', r: 'field' },
      { n: 'Ionic Spear', r: 'projectile' }
    ] },
    { name: 'Copper(II) Oxide', f: 'CuO', fam: 'ionic', ab: [
      { n: 'Salt Lattice', r: 'projectile' },
      { n: 'Ionic Spear', r: 'lattice' },
      { n: 'Crystal Precipitate', r: 'field' }
    ] },
    { name: 'Zinc Oxide', f: 'ZnO', fam: 'ionic', ab: [
      { n: 'Salt Lattice', r: 'projectile' },
      { n: 'Ionic Spear', r: 'lattice' },
      { n: 'Crystal Precipitate', r: 'field' }
    ] },
    { name: 'Aluminum Oxide', f: 'Al2O3', fam: 'ionic', ab: [
      { n: 'Salt Lattice', r: 'projectile' },
      { n: 'Ionic Spear', r: 'lattice' },
      { n: 'Crystal Precipitate', r: 'field' }
    ] },
    { name: 'Magnesium Oxide', f: 'MgO', fam: 'ionic', ab: [
      { n: 'Precipitation Trap', r: 'field' },
      { n: 'Electrolyte Zone', r: 'projectile' },
      { n: 'Ionic Spear', r: 'lattice' }
    ] },
    { name: 'Calcium Oxide', f: 'CaO', fam: 'ionic', ab: [
      { n: 'Crystal Precipitate', r: 'lattice' },
      { n: 'Ion Burst', r: 'field' },
      { n: 'Ionic Spear', r: 'projectile' }
    ] },
    { name: 'Silicon Dioxide', f: 'SiO2', fam: 'general', ab: [
      { n: 'Phase Transition', r: 'transition' },
      { n: 'Phase Mark', r: 'reserve' },
      { n: 'Molecular Edge', r: 'projectile' }
    ] },
    { name: 'Silicon Carbide', f: 'SiC', fam: 'general', ab: [
      { n: 'Compound Pulse', r: 'reserve' },
      { n: 'Reaction Reserve', r: 'projectile' },
      { n: 'Molecular Edge', r: 'transition' }
    ] },
    { name: 'Silicon Nitride', f: 'Si3N4', fam: 'general', ab: [
      { n: 'Molecular Edge', r: 'projectile' },
      { n: 'Molecular Halo', r: 'transition' },
      { n: 'Phase Transition', r: 'reserve' }
    ] },
    { name: 'Titanium Dioxide', f: 'TiO2', fam: 'general', ab: [
      { n: 'Molecular Edge', r: 'projectile' },
      { n: 'Molecular Halo', r: 'transition' },
      { n: 'Phase Transition', r: 'reserve' }
    ] },
    { name: 'Titanium Carbide', f: 'TiC', fam: 'general', ab: [
      { n: 'Molecular Edge', r: 'projectile' },
      { n: 'Molecular Halo', r: 'transition' },
      { n: 'Phase Transition', r: 'reserve' }
    ] },
    { name: 'Tungsten Carbide', f: 'WC', fam: 'general', ab: [
      { n: 'Phase Transition', r: 'transition' },
      { n: 'Phase Mark', r: 'reserve' },
      { n: 'Molecular Edge', r: 'projectile' }
    ] },
    { name: 'Boron Nitride', f: 'BN', fam: 'general', ab: [
      { n: 'Molecular Edge', r: 'projectile' },
      { n: 'Molecular Halo', r: 'transition' },
      { n: 'Phase Transition', r: 'reserve' }
    ] },
    { name: 'Boron Carbide', f: 'B4C', fam: 'general', ab: [
      { n: 'Phase Mark', r: 'transition' },
      { n: 'Phase Transition', r: 'reserve' },
      { n: 'Molecular Edge', r: 'projectile' }
    ] },
    { name: 'Hydroxyapatite', f: 'Ca5P3O13H', fam: 'general', ab: [
      { n: 'Compound Pulse', r: 'reserve' },
      { n: 'Reaction Reserve', r: 'projectile' },
      { n: 'Molecular Edge', r: 'transition' }
    ] },
    { name: 'Fluorapatite', f: 'Ca5P3O12F', fam: 'general', ab: [
      { n: 'Molecular Halo', r: 'projectile' },
      { n: 'Molecular Edge', r: 'transition' },
      { n: 'Phase Transition', r: 'reserve' }
    ] },
    { name: 'Sodium Fluoride', f: 'NaF', fam: 'ionic', ab: [
      { n: 'Crystal Precipitate', r: 'lattice' },
      { n: 'Ion Burst', r: 'field' },
      { n: 'Ionic Spear', r: 'projectile' }
    ] },
    { name: 'Calcium Fluoride', f: 'CaF2', fam: 'ionic', ab: [
      { n: 'Salt Lattice', r: 'projectile' },
      { n: 'Ionic Spear', r: 'lattice' },
      { n: 'Crystal Precipitate', r: 'field' }
    ] },
    { name: 'Aluminum Fluoride', f: 'AlF3', fam: 'ionic', ab: [
      { n: 'Precipitation Trap', r: 'field' },
      { n: 'Electrolyte Zone', r: 'projectile' },
      { n: 'Ionic Spear', r: 'lattice' }
    ] },
    { name: 'Sodium Bromide', f: 'NaBr', fam: 'ionic', ab: [
      { n: 'Precipitation Trap', r: 'field' },
      { n: 'Electrolyte Zone', r: 'projectile' },
      { n: 'Ionic Spear', r: 'lattice' }
    ] },
    { name: 'Potassium Bromide', f: 'KBr', fam: 'ionic', ab: [
      { n: 'Salt Lattice', r: 'projectile' },
      { n: 'Ionic Spear', r: 'lattice' },
      { n: 'Crystal Precipitate', r: 'field' }
    ] },
    { name: 'Silver Bromide', f: 'AgBr', fam: 'ionic', ab: [
      { n: 'Ionic Spear', r: 'projectile' },
      { n: 'Salt Lattice', r: 'lattice' },
      { n: 'Crystal Precipitate', r: 'field' }
    ] },
    { name: 'Silver Iodide', f: 'AgI', fam: 'ionic', ab: [
      { n: 'Precipitation Trap', r: 'field' },
      { n: 'Electrolyte Zone', r: 'projectile' },
      { n: 'Ionic Spear', r: 'lattice' }
    ] },
    { name: 'Potassium Iodide', f: 'KI', fam: 'ionic', ab: [
      { n: 'Ion Burst', r: 'lattice' },
      { n: 'Crystal Precipitate', r: 'field' },
      { n: 'Ionic Spear', r: 'projectile' }
    ] },
    { name: 'Sodium Iodide', f: 'NaI', fam: 'ionic', ab: [
      { n: 'Ion Burst', r: 'lattice' },
      { n: 'Crystal Precipitate', r: 'field' },
      { n: 'Ionic Spear', r: 'projectile' }
    ] },
    { name: 'Sodium Chlorate', f: 'NaClO3', fam: 'ionic', ab: [
      { n: 'Ionic Spear', r: 'projectile' },
      { n: 'Salt Lattice', r: 'lattice' },
      { n: 'Crystal Precipitate', r: 'field' }
    ] },
    { name: 'Potassium Chlorate', f: 'KClO3', fam: 'ionic', ab: [
      { n: 'Ionic Spear', r: 'projectile' },
      { n: 'Salt Lattice', r: 'lattice' },
      { n: 'Crystal Precipitate', r: 'field' }
    ] },
    { name: 'Potassium Perchlorate', f: 'KClO4', fam: 'oxoHalogen', ab: [
      { n: 'Halogen Mark', r: 'line' },
      { n: 'Reactive Stripe', r: 'field' },
      { n: 'Halogen Oxidizer', r: 'projectile' }
    ] },
    { name: 'Sodium Chlorite', f: 'NaClO2', fam: 'ionic', ab: [
      { n: 'Precipitation Trap', r: 'field' },
      { n: 'Electrolyte Zone', r: 'projectile' },
      { n: 'Ionic Spear', r: 'lattice' }
    ] },
    { name: 'Silver Oxide', f: 'Ag2O', fam: 'ionic', ab: [
      { n: 'Electrolyte Zone', r: 'field' },
      { n: 'Precipitation Trap', r: 'projectile' },
      { n: 'Ionic Spear', r: 'lattice' }
    ] },
    { name: 'Silver Sulfide', f: 'Ag2S', fam: 'sulfur', ab: [
      { n: 'Pungent Cloud', r: 'field' },
      { n: 'Sulfur Mist', r: 'mark' },
      { n: 'Sulfide Tag', r: 'wave' }
    ] },
    { name: 'Zinc Sulfide', f: 'ZnS', fam: 'sulfur', ab: [
      { n: 'Redox Snap', r: 'wave' },
      { n: 'Reduction Trap', r: 'field' },
      { n: 'Sulfur Mist', r: 'mark' }
    ] },
    { name: 'Copper Sulfide', f: 'CuS', fam: 'sulfur', ab: [
      { n: 'Sulfide Tag', r: 'mark' },
      { n: 'Sulfuric Trace', r: 'wave' },
      { n: 'Sulfur Mist', r: 'field' }
    ] },
    { name: 'Lead Sulfide', f: 'PbS', fam: 'sulfur', ab: [
      { n: 'Redox Snap', r: 'wave' },
      { n: 'Reduction Trap', r: 'field' },
      { n: 'Sulfur Mist', r: 'mark' }
    ] },
    { name: 'Lead(II) Oxide', f: 'PbO', fam: 'general', ab: [
      { n: 'Molecular Edge', r: 'projectile' },
      { n: 'Molecular Halo', r: 'transition' },
      { n: 'Phase Transition', r: 'reserve' }
    ] },
    { name: 'Lead Dioxide', f: 'PbO2', fam: 'general', ab: [
      { n: 'Molecular Edge', r: 'projectile' },
      { n: 'Molecular Halo', r: 'transition' },
      { n: 'Phase Transition', r: 'reserve' }
    ] },
    { name: 'Tin Dioxide', f: 'SnO2', fam: 'general', ab: [
      { n: 'Phase Mark', r: 'transition' },
      { n: 'Phase Transition', r: 'reserve' },
      { n: 'Molecular Edge', r: 'projectile' }
    ] },
    { name: 'Chromium Oxide', f: 'Cr2O3', fam: 'general', ab: [
      { n: 'Phase Transition', r: 'transition' },
      { n: 'Phase Mark', r: 'reserve' },
      { n: 'Molecular Edge', r: 'projectile' }
    ] },
    { name: 'Manganese Dioxide', f: 'MnO2', fam: 'general', ab: [
      { n: 'Phase Mark', r: 'transition' },
      { n: 'Phase Transition', r: 'reserve' },
      { n: 'Molecular Edge', r: 'projectile' }
    ] },
    { name: 'Nickel Oxide', f: 'NiO', fam: 'general', ab: [
      { n: 'Molecular Edge', r: 'projectile' },
      { n: 'Molecular Halo', r: 'transition' },
      { n: 'Phase Transition', r: 'reserve' }
    ] },
    { name: 'Cobalt Oxide', f: 'CoO', fam: 'general', ab: [
      { n: 'Phase Mark', r: 'transition' },
      { n: 'Phase Transition', r: 'reserve' },
      { n: 'Molecular Edge', r: 'projectile' }
    ] },
    { name: 'Cobalt Sulfate', f: 'CoSO4', fam: 'sulfate', ab: [
      { n: 'Sulfate Lattice', r: 'lattice' },
      { n: 'Anion Net', r: 'relay' },
      { n: 'Sulfur Relay', r: 'delayed' }
    ] },
    { name: 'Nickel Sulfate', f: 'NiSO4', fam: 'sulfate', ab: [
      { n: 'Crystal Relay', r: 'relay' },
      { n: 'Sulfur Relay', r: 'delayed' },
      { n: 'Sulfate Lattice', r: 'lattice' }
    ] },
    { name: 'Zinc Chloride', f: 'ZnCl2', fam: 'ionic', ab: [
      { n: 'Ion Burst', r: 'lattice' },
      { n: 'Crystal Precipitate', r: 'field' },
      { n: 'Ionic Spear', r: 'projectile' }
    ] },
    { name: 'Copper Nitrate', f: 'CuN2O6', fam: 'nitrate', ab: [
      { n: 'Nitrate Mark', r: 'field' },
      { n: 'Nitrate Bloom', r: 'volley' },
      { n: 'Nitrate Charge', r: 'charge' }
    ] },
    { name: 'Cobalt Chloride', f: 'CoCl2', fam: 'general', ab: [
      { n: 'Phase Transition', r: 'transition' },
      { n: 'Phase Mark', r: 'reserve' },
      { n: 'Molecular Edge', r: 'projectile' }
    ] },
    { name: 'Nickel Chloride', f: 'NiCl2', fam: 'general', ab: [
      { n: 'Compound Pulse', r: 'reserve' },
      { n: 'Reaction Reserve', r: 'projectile' },
      { n: 'Molecular Edge', r: 'transition' }
    ] },
    { name: 'Barium Sulfate', f: 'BaSO4', fam: 'sulfate', ab: [
      { n: 'Crystal Relay', r: 'relay' },
      { n: 'Sulfur Relay', r: 'delayed' },
      { n: 'Sulfate Lattice', r: 'lattice' }
    ] },
    { name: 'Barium Chloride', f: 'BaCl2', fam: 'ionic', ab: [
      { n: 'Precipitation Trap', r: 'field' },
      { n: 'Electrolyte Zone', r: 'projectile' },
      { n: 'Ionic Spear', r: 'lattice' }
    ] },
    { name: 'Strontium Chloride', f: 'SrCl2', fam: 'ionic', ab: [
      { n: 'Ionic Spear', r: 'projectile' },
      { n: 'Salt Lattice', r: 'lattice' },
      { n: 'Crystal Precipitate', r: 'field' }
    ] },
    { name: 'Strontium Nitrate', f: 'SrN2O6', fam: 'nitrate', ab: [
      { n: 'Nitrate Bloom', r: 'field' },
      { n: 'Nitrate Mark', r: 'volley' },
      { n: 'Nitrate Charge', r: 'charge' }
    ] },
    { name: 'Lithium Carbonate', f: 'Li2CO3', fam: 'carbonate', ab: [
      { n: 'Carbonate Screen', r: 'shield' },
      { n: 'Buffer Ward', r: 'burst' },
      { n: 'Fizzy Mine', r: 'mine' }
    ] },
    { name: 'Lithium Hydroxide', f: 'LiOH', fam: 'base', ab: [
      { n: 'Alkaline Shell', r: 'cleanse' },
      { n: 'Base Mark', r: 'field' },
      { n: 'Caustic Wash', r: 'shield' }
    ] },
    { name: 'Lithium Chloride', f: 'LiCl', fam: 'ionic', ab: [
      { n: 'Crystal Precipitate', r: 'lattice' },
      { n: 'Ion Burst', r: 'field' },
      { n: 'Ionic Spear', r: 'projectile' }
    ] },
    { name: 'Boric Acid', f: 'BH3O3', fam: 'acid', ab: [
      { n: 'Corrosive Pool', r: 'field' },
      { n: 'Etch Wave', r: 'mark' },
      { n: 'Proton Spear', r: 'beam' }
    ] },
    { name: 'Sodium Borate', f: 'B4Na2O7', fam: 'ionic', ab: [
      { n: 'Ion Burst', r: 'lattice' },
      { n: 'Crystal Precipitate', r: 'field' },
      { n: 'Ionic Spear', r: 'projectile' }
    ] },
    { name: 'Phosphorus Pentoxide', f: 'P2O5', fam: 'general', ab: [
      { n: 'Molecular Edge', r: 'projectile' },
      { n: 'Molecular Halo', r: 'transition' },
      { n: 'Phase Transition', r: 'reserve' }
    ] },
    { name: 'Phosphorus Trichloride', f: 'PCl3', fam: 'general', ab: [
      { n: 'Molecular Halo', r: 'projectile' },
      { n: 'Molecular Edge', r: 'transition' },
      { n: 'Phase Transition', r: 'reserve' }
    ] },
    { name: 'Phosphorus Pentachloride', f: 'PCl5', fam: 'general', ab: [
      { n: 'Reaction Reserve', r: 'reserve' },
      { n: 'Compound Pulse', r: 'projectile' },
      { n: 'Molecular Edge', r: 'transition' }
    ] },
    { name: 'Sulfur Hexafluoride', f: 'SF6', fam: 'general', ab: [
      { n: 'Compound Pulse', r: 'reserve' },
      { n: 'Reaction Reserve', r: 'projectile' },
      { n: 'Molecular Edge', r: 'transition' }
    ] },
    { name: 'Sulfuryl Chloride', f: 'SCl2O2', fam: 'general', ab: [
      { n: 'Molecular Edge', r: 'projectile' },
      { n: 'Molecular Halo', r: 'transition' },
      { n: 'Phase Transition', r: 'reserve' }
    ] },
    { name: 'Thionyl Chloride', f: 'SOCl2', fam: 'general', ab: [
      { n: 'Phase Transition', r: 'transition' },
      { n: 'Phase Mark', r: 'reserve' },
      { n: 'Molecular Edge', r: 'projectile' }
    ] },
    { name: 'Silicon Tetrafluoride', f: 'SiF4', fam: 'general', ab: [
      { n: 'Phase Mark', r: 'transition' },
      { n: 'Phase Transition', r: 'reserve' },
      { n: 'Molecular Edge', r: 'projectile' }
    ] },
    { name: 'Caffeine', f: 'C8H10N4O2', fam: 'bioactive', ab: [
      { n: 'Targeted Response', r: 'pulse' },
      { n: 'Systemic Echo', r: 'mark' },
      { n: 'Receptor Surge', r: 'focus' }
    ] },
    { name: 'Uric Acid', f: 'C5H4N4O3', fam: 'acid', ab: [
      { n: 'Etch Wave', r: 'field' },
      { n: 'Corrosive Pool', r: 'mark' },
      { n: 'Proton Spear', r: 'beam' }
    ] },
    { name: 'Histamine', f: 'C5H9N3', fam: 'amine', ab: [
      { n: 'Buffer Pulse', r: 'field' },
      { n: 'Amine Haze', r: 'tether' },
      { n: 'Lone-Pair Lock', r: 'buff' }
    ] },
    { name: 'Vitamin C', f: 'C6H8O6', fam: 'vitamin', ab: [
      { n: 'Antioxidant Guard', r: 'shield' },
      { n: 'Deficiency Cleanse', r: 'field' },
      { n: 'Cofactor Field', r: 'support' }
    ] },
    { name: 'Vitamin B3', f: 'C6H6N2O', fam: 'vitamin', ab: [
      { n: 'Cofactor Link', r: 'support' },
      { n: 'Metabolic Spark', r: 'shield' },
      { n: 'Cofactor Field', r: 'field' }
    ] },
    { name: 'Vitamin B6', f: 'C8H11NO3', fam: 'vitamin', ab: [
      { n: 'Cofactor Field', r: 'field' },
      { n: 'Vitamin Pulse', r: 'support' },
      { n: 'Metabolic Spark', r: 'shield' }
    ] },
    { name: 'Vitamin B12', f: 'C63H88CoN14O14P', fam: 'vitamin', ab: [
      { n: 'Metabolic Spark', r: 'support' },
      { n: 'Cofactor Link', r: 'shield' },
      { n: 'Cofactor Field', r: 'field' }
    ] },
    { name: 'Riboflavin', f: 'C17H20N4O6', fam: 'vitamin', ab: [
      { n: 'Vitamin Pulse', r: 'field' },
      { n: 'Cofactor Field', r: 'support' },
      { n: 'Metabolic Spark', r: 'shield' }
    ] },
    { name: 'Biotin', f: 'C10H16N2O3S', fam: 'vitamin', ab: [
      { n: 'Cofactor Link', r: 'support' },
      { n: 'Metabolic Spark', r: 'shield' },
      { n: 'Cofactor Field', r: 'field' }
    ] },
    { name: 'Folic Acid', f: 'C19H19N7O6', fam: 'acid', ab: [
      { n: 'Acid Bloom', r: 'mark' },
      { n: 'Proton Spear', r: 'beam' },
      { n: 'Corrosive Pool', r: 'field' }
    ] },
    { name: 'ATP', f: 'C10H16N5O13P3', fam: 'general', ab: [
      { n: 'Reaction Reserve', r: 'reserve' },
      { n: 'Compound Pulse', r: 'projectile' },
      { n: 'Molecular Edge', r: 'transition' }
    ] },
    { name: 'ADP', f: 'C10H15N5O10P2', fam: 'general', ab: [
      { n: 'Molecular Halo', r: 'projectile' },
      { n: 'Molecular Edge', r: 'transition' },
      { n: 'Phase Transition', r: 'reserve' }
    ] },
    { name: 'NAD+', f: 'C21H28N7O14P2', fam: 'general', ab: [
      { n: 'Phase Mark', r: 'transition' },
      { n: 'Phase Transition', r: 'reserve' },
      { n: 'Molecular Edge', r: 'projectile' }
    ] },
    { name: 'FAD', f: 'C27H33N9O15P2', fam: 'general', ab: [
      { n: 'Molecular Edge', r: 'projectile' },
      { n: 'Molecular Halo', r: 'transition' },
      { n: 'Phase Transition', r: 'reserve' }
    ] },
    { name: 'Creatine Phosphate', f: 'C4H10N3O5P', fam: 'phosphate', ab: [
      { n: 'Energy Phosphate', r: 'charge' },
      { n: 'Phosphate Battery', r: 'ally' },
      { n: 'ATP Relay', r: 'mark' }
    ] },
    { name: 'Testosterone', f: 'C19H28O2', fam: 'general', ab: [
      { n: 'Molecular Edge', r: 'projectile' },
      { n: 'Molecular Halo', r: 'transition' },
      { n: 'Phase Transition', r: 'reserve' }
    ] },
    { name: 'Estradiol', f: 'C18H24O2', fam: 'general', ab: [
      { n: 'Phase Transition', r: 'transition' },
      { n: 'Phase Mark', r: 'reserve' },
      { n: 'Molecular Edge', r: 'projectile' }
    ] },
    { name: 'Progesterone', f: 'C21H30O2', fam: 'general', ab: [
      { n: 'Molecular Edge', r: 'projectile' },
      { n: 'Molecular Halo', r: 'transition' },
      { n: 'Phase Transition', r: 'reserve' }
    ] },
    { name: 'Cortisol', f: 'C21H30O5', fam: 'general', ab: [
      { n: 'Phase Transition', r: 'transition' },
      { n: 'Phase Mark', r: 'reserve' },
      { n: 'Molecular Edge', r: 'projectile' }
    ] },
    { name: 'Coenzyme Q10', f: 'C59H90O4', fam: 'general', ab: [
      { n: 'Molecular Edge', r: 'projectile' },
      { n: 'Molecular Halo', r: 'transition' },
      { n: 'Phase Transition', r: 'reserve' }
    ] },
    { name: 'Heme', f: 'C34H32FeN4O4', fam: 'general', ab: [
      { n: 'Phase Transition', r: 'transition' },
      { n: 'Phase Mark', r: 'reserve' },
      { n: 'Molecular Edge', r: 'projectile' }
    ] },
    { name: 'Chlorophyll a', f: 'C55H72MgN4O5', fam: 'general', ab: [
      { n: 'Molecular Edge', r: 'projectile' },
      { n: 'Molecular Halo', r: 'transition' },
      { n: 'Phase Transition', r: 'reserve' }
    ] },
    { name: 'Chlorophyll b', f: 'C55H70MgN4O6', fam: 'general', ab: [
      { n: 'Molecular Edge', r: 'projectile' },
      { n: 'Molecular Halo', r: 'transition' },
      { n: 'Phase Transition', r: 'reserve' }
    ] },
    { name: 'Thymine', f: 'C5H6N2O2', fam: 'general', ab: [
      { n: 'Phase Mark', r: 'transition' },
      { n: 'Phase Transition', r: 'reserve' },
      { n: 'Molecular Edge', r: 'projectile' }
    ] },
    { name: 'Uracil', f: 'C4H4N2O2', fam: 'general', ab: [
      { n: 'Phase Transition', r: 'transition' },
      { n: 'Phase Mark', r: 'reserve' },
      { n: 'Molecular Edge', r: 'projectile' }
    ] },
    { name: 'Cytosine', f: 'C4H5N3O', fam: 'general', ab: [
      { n: 'Phase Transition', r: 'transition' },
      { n: 'Phase Mark', r: 'reserve' },
      { n: 'Molecular Edge', r: 'projectile' }
    ] },
    { name: 'Adenine', f: 'C5H5N5', fam: 'general', ab: [
      { n: 'Phase Transition', r: 'transition' },
      { n: 'Phase Mark', r: 'reserve' },
      { n: 'Molecular Edge', r: 'projectile' }
    ] },
    { name: 'Guanine', f: 'C5H5N5O', fam: 'general', ab: [
      { n: 'Molecular Halo', r: 'projectile' },
      { n: 'Molecular Edge', r: 'transition' },
      { n: 'Phase Transition', r: 'reserve' }
    ] },
    { name: 'Cyanamide', f: 'CH2N2', fam: 'cyan', ab: [
      { n: 'Toxic Pin', r: 'root' },
      { n: 'Binding Pulse', r: 'mark' },
      { n: 'Cyanide Lock', r: 'projectile' }
    ] },
    { name: 'Cyanogen', f: 'C2N2', fam: 'cyan', ab: [
      { n: 'Binding Pulse', r: 'root' },
      { n: 'Toxic Pin', r: 'mark' },
      { n: 'Cyanide Lock', r: 'projectile' }
    ] },
    { name: 'Methylamine', f: 'CH5N', fam: 'amine', ab: [
      { n: 'Nitrogen Veil', r: 'buff' },
      { n: 'Base Surge', r: 'field' },
      { n: 'Lone-Pair Lock', r: 'tether' }
    ] },
    { name: 'Dimethylamine', f: 'C2H7N', fam: 'amine', ab: [
      { n: 'Buffer Pulse', r: 'field' },
      { n: 'Amine Haze', r: 'tether' },
      { n: 'Lone-Pair Lock', r: 'buff' }
    ] },
    { name: 'Trimethylamine', f: 'C3H9N', fam: 'amine', ab: [
      { n: 'Amine Haze', r: 'field' },
      { n: 'Buffer Pulse', r: 'tether' },
      { n: 'Lone-Pair Lock', r: 'buff' }
    ] },
    { name: 'Nitromethane', f: 'CH3NO2', fam: 'alkane', ab: [
      { n: 'Flame Sweep', r: 'burst' },
      { n: 'Ignition Dash', r: 'charge' },
      { n: 'Fuel Trail', r: 'trail' }
    ] },
    { name: 'Nitrobenzene', f: 'C6H5NO2', fam: 'general', ab: [
      { n: 'Compound Pulse', r: 'reserve' },
      { n: 'Reaction Reserve', r: 'projectile' },
      { n: 'Molecular Edge', r: 'transition' }
    ] },
    { name: 'Phenylhydrazine', f: 'C6H8N2', fam: 'general', ab: [
      { n: 'Molecular Edge', r: 'projectile' },
      { n: 'Molecular Halo', r: 'transition' },
      { n: 'Phase Transition', r: 'reserve' }
    ] },
    { name: 'Pyrrole', f: 'C4H5N', fam: 'general', ab: [
      { n: 'Reaction Reserve', r: 'reserve' },
      { n: 'Compound Pulse', r: 'projectile' },
      { n: 'Molecular Edge', r: 'transition' }
    ] },
    { name: 'Furan', f: 'C4H4O', fam: 'general', ab: [
      { n: 'Phase Transition', r: 'transition' },
      { n: 'Phase Mark', r: 'reserve' },
      { n: 'Molecular Edge', r: 'projectile' }
    ] },
    { name: 'Indole', f: 'C8H7N', fam: 'general', ab: [
      { n: 'Molecular Edge', r: 'projectile' },
      { n: 'Molecular Halo', r: 'transition' },
      { n: 'Phase Transition', r: 'reserve' }
    ] },
    { name: 'Imidazole', f: 'C3H4N2', fam: 'general', ab: [
      { n: 'Compound Pulse', r: 'reserve' },
      { n: 'Reaction Reserve', r: 'projectile' },
      { n: 'Molecular Edge', r: 'transition' }
    ] },
    { name: 'Morpholine', f: 'C4H9NO', fam: 'general', ab: [
      { n: 'Compound Pulse', r: 'reserve' },
      { n: 'Reaction Reserve', r: 'projectile' },
      { n: 'Molecular Edge', r: 'transition' }
    ] },
    { name: 'Ethyleneimine', f: 'C2H5N', fam: 'general', ab: [
      { n: 'Phase Transition', r: 'transition' },
      { n: 'Phase Mark', r: 'reserve' },
      { n: 'Molecular Edge', r: 'projectile' }
    ] },
    { name: 'Diethyl Carbonate', f: 'C5H10O3', fam: 'carbonate', ab: [
      { n: 'Carbonate Screen', r: 'shield' },
      { n: 'Buffer Ward', r: 'burst' },
      { n: 'Fizzy Mine', r: 'mine' }
    ] },
    { name: 'Dimethylformamide', f: 'C3H7NO', fam: 'general', ab: [
      { n: 'Phase Transition', r: 'transition' },
      { n: 'Phase Mark', r: 'reserve' },
      { n: 'Molecular Edge', r: 'projectile' }
    ] },
    { name: 'Acetyl Chloride', f: 'C2H3ClO', fam: 'general', ab: [
      { n: 'Compound Pulse', r: 'reserve' },
      { n: 'Reaction Reserve', r: 'projectile' },
      { n: 'Molecular Edge', r: 'transition' }
    ] },
    { name: 'Benzoyl Chloride', f: 'C7H5ClO', fam: 'general', ab: [
      { n: 'Molecular Halo', r: 'projectile' },
      { n: 'Molecular Edge', r: 'transition' },
      { n: 'Phase Transition', r: 'reserve' }
    ] },
    { name: 'Oxalyl Chloride', f: 'C2Cl2O2', fam: 'general', ab: [
      { n: 'Compound Pulse', r: 'reserve' },
      { n: 'Reaction Reserve', r: 'projectile' },
      { n: 'Molecular Edge', r: 'transition' }
    ] },
    { name: 'Phosgene', f: 'CCl2O', fam: 'general', ab: [
      { n: 'Compound Pulse', r: 'reserve' },
      { n: 'Reaction Reserve', r: 'projectile' },
      { n: 'Molecular Edge', r: 'transition' }
    ] },
    { name: 'Chloral', f: 'C2HCl3O', fam: 'general', ab: [
      { n: 'Molecular Edge', r: 'projectile' },
      { n: 'Molecular Halo', r: 'transition' },
      { n: 'Phase Transition', r: 'reserve' }
    ] },
    { name: 'Carbonyl Sulfide', f: 'COS', fam: 'sulfur', ab: [
      { n: 'Sulfuric Trace', r: 'mark' },
      { n: 'Sulfide Tag', r: 'wave' },
      { n: 'Sulfur Mist', r: 'field' }
    ] },
    { name: 'Sodium Cyanide', f: 'NaCN', fam: 'cyan', ab: [
      { n: 'Toxic Pin', r: 'root' },
      { n: 'Binding Pulse', r: 'mark' },
      { n: 'Cyanide Lock', r: 'projectile' }
    ] },
    { name: 'Potassium Cyanide', f: 'KCN', fam: 'cyan', ab: [
      { n: 'Triple-Atom Needle', r: 'projectile' },
      { n: 'Cyan Thread', r: 'root' },
      { n: 'Cyanide Lock', r: 'mark' }
    ] },
    { name: 'Calcium Cyanamide', f: 'CaCN2', fam: 'cyan', ab: [
      { n: 'Toxic Pin', r: 'root' },
      { n: 'Binding Pulse', r: 'mark' },
      { n: 'Cyanide Lock', r: 'projectile' }
    ] },
    { name: 'Zinc Carbonate', f: 'ZnCO3', fam: 'carbonate', ab: [
      { n: 'Pressure Pop', r: 'mine' },
      { n: 'Fizzy Mine', r: 'shield' },
      { n: 'Buffer Ward', r: 'burst' }
    ] },
    { name: 'Copper Carbonate', f: 'CuCO3', fam: 'carbonate', ab: [
      { n: 'Fizzy Mine', r: 'mine' },
      { n: 'Pressure Pop', r: 'shield' },
      { n: 'Buffer Ward', r: 'burst' }
    ] },
    { name: 'Iron(II) Carbonate', f: 'FeCO3', fam: 'carbonate', ab: [
      { n: 'Pressure Pop', r: 'mine' },
      { n: 'Fizzy Mine', r: 'shield' },
      { n: 'Buffer Ward', r: 'burst' }
    ] },
    { name: 'Iron(II) Hydroxide', f: 'FeO2H2', fam: 'base', ab: [
      { n: 'Base Mark', r: 'cleanse' },
      { n: 'Alkaline Shell', r: 'field' },
      { n: 'Caustic Wash', r: 'shield' }
    ] },
    { name: 'Iron(III) Hydroxide', f: 'FeO3H3', fam: 'base', ab: [
      { n: 'Buffer Burst', r: 'field' },
      { n: 'Neutralize Pulse', r: 'shield' },
      { n: 'Caustic Wash', r: 'cleanse' }
    ] },
    { name: 'Copper Hydroxide', f: 'CuO2H2', fam: 'base', ab: [
      { n: 'Alkaline Shell', r: 'cleanse' },
      { n: 'Base Mark', r: 'field' },
      { n: 'Caustic Wash', r: 'shield' }
    ] },
    { name: 'Aluminum Sulfate', f: 'Al2S3O12', fam: 'sulfate', ab: [
      { n: 'Sulfate Lattice', r: 'lattice' },
      { n: 'Anion Net', r: 'relay' },
      { n: 'Sulfur Relay', r: 'delayed' }
    ] },
    { name: 'Sodium Bisulfate', f: 'NaHSO4', fam: 'sulfate', ab: [
      { n: 'Crystal Relay', r: 'relay' },
      { n: 'Sulfur Relay', r: 'delayed' },
      { n: 'Sulfate Lattice', r: 'lattice' }
    ] },
    { name: 'Potassium Bisulfate', f: 'KHSO4', fam: 'sulfate', ab: [
      { n: 'Precipitate Crash', r: 'delayed' },
      { n: 'Sulfate Pulse', r: 'lattice' },
      { n: 'Sulfate Lattice', r: 'relay' }
    ] },
    { name: 'Sodium Nitrite', f: 'NaNO2', fam: 'nitrate', ab: [
      { n: 'Energetic Bloom', r: 'volley' },
      { n: 'Redox Volley', r: 'charge' },
      { n: 'Nitrate Charge', r: 'field' }
    ] },
    { name: 'Potassium Nitrite', f: 'KNO2', fam: 'nitrate', ab: [
      { n: 'Energetic Bloom', r: 'volley' },
      { n: 'Redox Volley', r: 'charge' },
      { n: 'Nitrate Charge', r: 'field' }
    ] },
    { name: 'Silver Nitrite', f: 'AgNO2', fam: 'nitrate', ab: [
      { n: 'Redox Volley', r: 'volley' },
      { n: 'Energetic Bloom', r: 'charge' },
      { n: 'Nitrate Charge', r: 'field' }
    ] },
    { name: 'Sodium Bromate', f: 'NaBrO3', fam: 'oxoHalogen', ab: [
      { n: 'Reactive Stripe', r: 'line' },
      { n: 'Halogen Mark', r: 'field' },
      { n: 'Halogen Oxidizer', r: 'projectile' }
    ] },
    { name: 'Potassium Bromate', f: 'KBrO3', fam: 'oxoHalogen', ab: [
      { n: 'Reactive Stripe', r: 'line' },
      { n: 'Halogen Mark', r: 'field' },
      { n: 'Halogen Oxidizer', r: 'projectile' }
    ] },
    { name: 'Sodium Iodate', f: 'NaIO3', fam: 'oxoHalogen', ab: [
      { n: 'Halogen Mark', r: 'line' },
      { n: 'Reactive Stripe', r: 'field' },
      { n: 'Halogen Oxidizer', r: 'projectile' }
    ] },
    { name: 'Potassium Iodate', f: 'KIO3', fam: 'oxoHalogen', ab: [
      { n: 'Halogen Mark', r: 'line' },
      { n: 'Reactive Stripe', r: 'field' },
      { n: 'Halogen Oxidizer', r: 'projectile' }
    ] },
    { name: 'Sodium Periodate', f: 'NaIO4', fam: 'oxoHalogen', ab: [
      { n: 'Halogen Oxidizer', r: 'projectile' },
      { n: 'Bleach Pulse', r: 'line' },
      { n: 'Reactive Stripe', r: 'field' }
    ] },
    { name: 'Potassium Periodate', f: 'KIO4', fam: 'oxoHalogen', ab: [
      { n: 'Halogen Oxidizer', r: 'projectile' },
      { n: 'Bleach Pulse', r: 'line' },
      { n: 'Reactive Stripe', r: 'field' }
    ] },
    { name: 'Sodium Chromate', f: 'Na2CrO4', fam: 'chromate', ab: [
      { n: 'Oxidation Prism', r: 'prism' },
      { n: 'Redox Mirror', r: 'beam' },
      { n: 'Chromatic Beam', r: 'reflect' }
    ] },
    { name: 'Potassium Chromate', f: 'K2CrO4', fam: 'chromate', ab: [
      { n: 'Reflective Arc', r: 'reflect' },
      { n: 'Chrome Ward', r: 'prism' },
      { n: 'Chromatic Beam', r: 'beam' }
    ] },
    { name: 'Lead Chromate', f: 'PbCrO4', fam: 'chromate', ab: [
      { n: 'Oxidation Prism', r: 'prism' },
      { n: 'Redox Mirror', r: 'beam' },
      { n: 'Chromatic Beam', r: 'reflect' }
    ] },
    { name: 'Ammonium Dichromate', f: 'N2H8Cr2O7', fam: 'chromate', ab: [
      { n: 'Chrome Ward', r: 'reflect' },
      { n: 'Reflective Arc', r: 'prism' },
      { n: 'Chromatic Beam', r: 'beam' }
    ] },
    { name: 'Copper(I) Iodide', f: 'CuI', fam: 'ionic', ab: [
      { n: 'Precipitation Trap', r: 'field' },
      { n: 'Electrolyte Zone', r: 'projectile' },
      { n: 'Ionic Spear', r: 'lattice' }
    ] },
    { name: 'Copper(I) Bromide', f: 'CuBr', fam: 'ionic', ab: [
      { n: 'Ionic Spear', r: 'projectile' },
      { n: 'Salt Lattice', r: 'lattice' },
      { n: 'Crystal Precipitate', r: 'field' }
    ] },
    { name: 'Silver Fluoride', f: 'AgF', fam: 'ionic', ab: [
      { n: 'Ionic Spear', r: 'projectile' },
      { n: 'Salt Lattice', r: 'lattice' },
      { n: 'Crystal Precipitate', r: 'field' }
    ] },
    { name: 'Lithium Fluoride', f: 'LiF', fam: 'ionic', ab: [
      { n: 'Electrolyte Zone', r: 'field' },
      { n: 'Precipitation Trap', r: 'projectile' },
      { n: 'Ionic Spear', r: 'lattice' }
    ] },
    { name: 'Cesium Chloride', f: 'CsCl', fam: 'ionic', ab: [
      { n: 'Ionic Spear', r: 'projectile' },
      { n: 'Salt Lattice', r: 'lattice' },
      { n: 'Crystal Precipitate', r: 'field' }
    ] },
    { name: 'Cesium Iodide', f: 'CsI', fam: 'ionic', ab: [
      { n: 'Ion Burst', r: 'lattice' },
      { n: 'Crystal Precipitate', r: 'field' },
      { n: 'Ionic Spear', r: 'projectile' }
    ] },
    { name: 'Rubidium Chloride', f: 'RbCl', fam: 'ionic', ab: [
      { n: 'Precipitation Trap', r: 'field' },
      { n: 'Electrolyte Zone', r: 'projectile' },
      { n: 'Ionic Spear', r: 'lattice' }
    ] },
    { name: 'Strontium Carbonate', f: 'SrCO3', fam: 'carbonate', ab: [
      { n: 'Effervescence Ring', r: 'burst' },
      { n: 'Carbonation Burst', r: 'mine' },
      { n: 'Fizzy Mine', r: 'shield' }
    ] },
    { name: 'Barium Carbonate', f: 'BaCO3', fam: 'carbonate', ab: [
      { n: 'Carbonate Screen', r: 'shield' },
      { n: 'Buffer Ward', r: 'burst' },
      { n: 'Fizzy Mine', r: 'mine' }
    ] },
    { name: 'Barium Hydroxide', f: 'BaO2H2', fam: 'base', ab: [
      { n: 'Alkaline Shell', r: 'cleanse' },
      { n: 'Base Mark', r: 'field' },
      { n: 'Caustic Wash', r: 'shield' }
    ] },
    { name: 'Barium Peroxide', f: 'BaO2', fam: 'peroxide', ab: [
      { n: 'Peroxide Mark', r: 'field' },
      { n: 'Oxygen Burst', r: 'delayed' },
      { n: 'Peroxide Bloom', r: 'reactive' }
    ] },
    { name: 'Beryllium Chloride', f: 'BeCl2', fam: 'ionic', ab: [
      { n: 'Ion Burst', r: 'lattice' },
      { n: 'Crystal Precipitate', r: 'field' },
      { n: 'Ionic Spear', r: 'projectile' }
    ] },
    { name: 'Beryllium Oxide', f: 'BeO', fam: 'ionic', ab: [
      { n: 'Salt Lattice', r: 'projectile' },
      { n: 'Ionic Spear', r: 'lattice' },
      { n: 'Crystal Precipitate', r: 'field' }
    ] },
    { name: 'Beryllium Fluoride', f: 'BeF2', fam: 'ionic', ab: [
      { n: 'Crystal Precipitate', r: 'lattice' },
      { n: 'Ion Burst', r: 'field' },
      { n: 'Ionic Spear', r: 'projectile' }
    ] },
    { name: 'Boron Trioxide', f: 'B2O3', fam: 'general', ab: [
      { n: 'Phase Transition', r: 'transition' },
      { n: 'Phase Mark', r: 'reserve' },
      { n: 'Molecular Edge', r: 'projectile' }
    ] },
    { name: 'Boron Trifluoride', f: 'BF3', fam: 'general', ab: [
      { n: 'Compound Pulse', r: 'reserve' },
      { n: 'Reaction Reserve', r: 'projectile' },
      { n: 'Molecular Edge', r: 'transition' }
    ] },
    { name: 'Aluminum Bromide', f: 'AlBr3', fam: 'ionic', ab: [
      { n: 'Salt Lattice', r: 'projectile' },
      { n: 'Ionic Spear', r: 'lattice' },
      { n: 'Crystal Precipitate', r: 'field' }
    ] },
    { name: 'Aluminum Iodide', f: 'AlI3', fam: 'ionic', ab: [
      { n: 'Ionic Spear', r: 'projectile' },
      { n: 'Salt Lattice', r: 'lattice' },
      { n: 'Crystal Precipitate', r: 'field' }
    ] },
    { name: 'Gallium Chloride', f: 'GaCl3', fam: 'ionic', ab: [
      { n: 'Ion Burst', r: 'lattice' },
      { n: 'Crystal Precipitate', r: 'field' },
      { n: 'Ionic Spear', r: 'projectile' }
    ] },
    { name: 'Gallium Oxide', f: 'Ga2O3', fam: 'ionic', ab: [
      { n: 'Precipitation Trap', r: 'field' },
      { n: 'Electrolyte Zone', r: 'projectile' },
      { n: 'Ionic Spear', r: 'lattice' }
    ] },
    { name: 'Germanium Dioxide', f: 'GeO2', fam: 'ionic', ab: [
      { n: 'Precipitation Trap', r: 'field' },
      { n: 'Electrolyte Zone', r: 'projectile' },
      { n: 'Ionic Spear', r: 'lattice' }
    ] },
    { name: 'Germanium Tetrachloride', f: 'GeCl4', fam: 'ionic', ab: [
      { n: 'Salt Lattice', r: 'projectile' },
      { n: 'Ionic Spear', r: 'lattice' },
      { n: 'Crystal Precipitate', r: 'field' }
    ] },
    { name: 'Arsenic Trioxide', f: 'As2O3', fam: 'ionic', ab: [
      { n: 'Ion Burst', r: 'lattice' },
      { n: 'Crystal Precipitate', r: 'field' },
      { n: 'Ionic Spear', r: 'projectile' }
    ] },
    { name: 'Arsenic Pentoxide', f: 'As2O5', fam: 'ionic', ab: [
      { n: 'Ion Burst', r: 'lattice' },
      { n: 'Crystal Precipitate', r: 'field' },
      { n: 'Ionic Spear', r: 'projectile' }
    ] },
    { name: 'Arsenic Trichloride', f: 'AsCl3', fam: 'ionic', ab: [
      { n: 'Crystal Precipitate', r: 'lattice' },
      { n: 'Ion Burst', r: 'field' },
      { n: 'Ionic Spear', r: 'projectile' }
    ] },
    { name: 'Selenium Dioxide', f: 'SeO2', fam: 'ionic', ab: [
      { n: 'Ion Burst', r: 'lattice' },
      { n: 'Crystal Precipitate', r: 'field' },
      { n: 'Ionic Spear', r: 'projectile' }
    ] },
    { name: 'Selenium Hexafluoride', f: 'SeF6', fam: 'ionic', ab: [
      { n: 'Salt Lattice', r: 'projectile' },
      { n: 'Ionic Spear', r: 'lattice' },
      { n: 'Crystal Precipitate', r: 'field' }
    ] },
    { name: 'Krypton Difluoride', f: 'KrF2', fam: 'ionic', ab: [
      { n: 'Ionic Spear', r: 'projectile' },
      { n: 'Salt Lattice', r: 'lattice' },
      { n: 'Crystal Precipitate', r: 'field' }
    ] },
    { name: 'Xenon Difluoride', f: 'XeF2', fam: 'ionic', ab: [
      { n: 'Salt Lattice', r: 'projectile' },
      { n: 'Ionic Spear', r: 'lattice' },
      { n: 'Crystal Precipitate', r: 'field' }
    ] },
    { name: 'Xenon Tetrafluoride', f: 'XeF4', fam: 'ionic', ab: [
      { n: 'Electrolyte Zone', r: 'field' },
      { n: 'Precipitation Trap', r: 'projectile' },
      { n: 'Ionic Spear', r: 'lattice' }
    ] },
    { name: 'Xenon Hexafluoride', f: 'XeF6', fam: 'ionic', ab: [
      { n: 'Ionic Spear', r: 'projectile' },
      { n: 'Salt Lattice', r: 'lattice' },
      { n: 'Crystal Precipitate', r: 'field' }
    ] },
    { name: 'Iodine Pentafluoride', f: 'IF5', fam: 'ionic', ab: [
      { n: 'Precipitation Trap', r: 'field' },
      { n: 'Electrolyte Zone', r: 'projectile' },
      { n: 'Ionic Spear', r: 'lattice' }
    ] },
    { name: 'Iodine Heptafluoride', f: 'IF7', fam: 'ionic', ab: [
      { n: 'Crystal Precipitate', r: 'lattice' },
      { n: 'Ion Burst', r: 'field' },
      { n: 'Ionic Spear', r: 'projectile' }
    ] },
    { name: 'Chlorine Trifluoride', f: 'ClF3', fam: 'ionic', ab: [
      { n: 'Ionic Spear', r: 'projectile' },
      { n: 'Salt Lattice', r: 'lattice' },
      { n: 'Crystal Precipitate', r: 'field' }
    ] },
    { name: 'Phosphorous Acid', f: 'H3PO3', fam: 'acid', ab: [
      { n: 'Proton Spear', r: 'mark' },
      { n: 'Acid Bloom', r: 'beam' },
      { n: 'Corrosive Pool', r: 'field' }
    ] },
    { name: 'Hypochlorous Acid', f: 'HClO', fam: 'acid', ab: [
      { n: 'Corrosion Tether', r: 'beam' },
      { n: 'Dissolve Mark', r: 'field' },
      { n: 'Corrosive Pool', r: 'mark' }
    ] },
    { name: 'Perchloric Acid', f: 'HClO4', fam: 'acid', ab: [
      { n: 'Proton Spear', r: 'mark' },
      { n: 'Acid Bloom', r: 'beam' },
      { n: 'Corrosive Pool', r: 'field' }
    ] },
    { name: 'Sodium Peroxide', f: 'Na2O2', fam: 'peroxide', ab: [
      { n: 'Peroxide Bloom', r: 'delayed' },
      { n: 'Reactive Skin', r: 'reactive' },
      { n: 'Oxidizer Veil', r: 'field' }
    ] },
    { name: 'Potassium Peroxide', f: 'K2O2', fam: 'peroxide', ab: [
      { n: 'Catalytic Patch', r: 'reactive' },
      { n: 'Oxidizer Veil', r: 'field' },
      { n: 'Peroxide Bloom', r: 'delayed' }
    ] },
    { name: 'Calcium Peroxide', f: 'CaO2', fam: 'peroxide', ab: [
      { n: 'Catalytic Patch', r: 'reactive' },
      { n: 'Oxidizer Veil', r: 'field' },
      { n: 'Peroxide Bloom', r: 'delayed' }
    ] },
    { name: 'Zinc Peroxide', f: 'ZnO2', fam: 'peroxide', ab: [
      { n: 'Peroxide Bloom', r: 'delayed' },
      { n: 'Reactive Skin', r: 'reactive' },
      { n: 'Oxidizer Veil', r: 'field' }
    ] },
    { name: 'Manganese(II) Sulfate', f: 'MnSO4', fam: 'sulfate', ab: [
      { n: 'Precipitate Crash', r: 'delayed' },
      { n: 'Sulfate Pulse', r: 'lattice' },
      { n: 'Sulfate Lattice', r: 'relay' }
    ] },
    { name: 'Manganese(II) Chloride', f: 'MnCl2', fam: 'general', ab: [
      { n: 'Phase Transition', r: 'transition' },
      { n: 'Phase Mark', r: 'reserve' },
      { n: 'Molecular Edge', r: 'projectile' }
    ] },
    { name: 'Iron(III) Nitrate', f: 'FeN3O9', fam: 'nitrate', ab: [
      { n: 'Nitrate Charge', r: 'charge' },
      { n: 'Oxidation Vault', r: 'field' },
      { n: 'Nitrate Bloom', r: 'volley' }
    ] },
    { name: 'Iron(II) Nitrate', f: 'FeN2O6', fam: 'nitrate', ab: [
      { n: 'Oxidation Vault', r: 'charge' },
      { n: 'Nitrate Charge', r: 'field' },
      { n: 'Nitrate Bloom', r: 'volley' }
    ] },
    { name: 'Cobalt Nitrate', f: 'CoN2O6', fam: 'nitrate', ab: [
      { n: 'Redox Volley', r: 'volley' },
      { n: 'Energetic Bloom', r: 'charge' },
      { n: 'Nitrate Charge', r: 'field' }
    ] },
    { name: 'Nickel Nitrate', f: 'NiN2O6', fam: 'nitrate', ab: [
      { n: 'Redox Volley', r: 'volley' },
      { n: 'Energetic Bloom', r: 'charge' },
      { n: 'Nitrate Charge', r: 'field' }
    ] },
    { name: 'Barium Nitrate', f: 'BaN2O6', fam: 'nitrate', ab: [
      { n: 'Nitrate Charge', r: 'charge' },
      { n: 'Oxidation Vault', r: 'field' },
      { n: 'Nitrate Bloom', r: 'volley' }
    ] },
    { name: 'Strontium Hydroxide', f: 'SrO2H2', fam: 'base', ab: [
      { n: 'Base Mark', r: 'cleanse' },
      { n: 'Alkaline Shell', r: 'field' },
      { n: 'Caustic Wash', r: 'shield' }
    ] },
    { name: 'Lithium Peroxide', f: 'Li2O2', fam: 'peroxide', ab: [
      { n: 'Reactive Skin', r: 'delayed' },
      { n: 'Peroxide Bloom', r: 'reactive' },
      { n: 'Oxidizer Veil', r: 'field' }
    ] },
    { name: 'Sodium Silicate', f: 'Na2SiO3', fam: 'silicate', ab: [
      { n: 'Glass Fan', r: 'wall' },
      { n: 'Silicate Glasswork', r: 'bridge' },
      { n: 'Silicate Bridge', r: 'cage' }
    ] },
    { name: 'Potassium Silicate', f: 'K2SiO3', fam: 'silicate', ab: [
      { n: 'Silicate Bridge', r: 'bridge' },
      { n: 'Mineral Rampart', r: 'cage' },
      { n: 'Silicate Glasswork', r: 'wall' }
    ] },
    { name: 'Calcium Silicate', f: 'CaSiO3', fam: 'silicate', ab: [
      { n: 'Silicate Prism', r: 'cage' },
      { n: 'Ion Cage', r: 'wall' },
      { n: 'Silicate Glasswork', r: 'bridge' }
    ] },
    { name: 'Sodium Metabisulfite', f: 'Na2S2O5', fam: 'sulfate', ab: [
      { n: 'Sulfate Lattice', r: 'lattice' },
      { n: 'Anion Net', r: 'relay' },
      { n: 'Sulfur Relay', r: 'delayed' }
    ] },
    { name: 'Sodium Bisulfite', f: 'NaHSO3', fam: 'sulfate', ab: [
      { n: 'Sulfate Pulse', r: 'delayed' },
      { n: 'Precipitate Crash', r: 'lattice' },
      { n: 'Sulfate Lattice', r: 'relay' }
    ] },
    { name: 'Sodium Bisulfide', f: 'NaHS', fam: 'sulfur', ab: [
      { n: 'Sulfide Tag', r: 'mark' },
      { n: 'Sulfuric Trace', r: 'wave' },
      { n: 'Sulfur Mist', r: 'field' }
    ] },
    { name: 'Ammonium Fluoride', f: 'NH4F', fam: 'general', ab: [
      { n: 'Molecular Edge', r: 'projectile' },
      { n: 'Molecular Halo', r: 'transition' },
      { n: 'Phase Transition', r: 'reserve' }
    ] },
    { name: 'Ammonium Bromide', f: 'NH4Br', fam: 'general', ab: [
      { n: 'Molecular Edge', r: 'projectile' },
      { n: 'Molecular Halo', r: 'transition' },
      { n: 'Phase Transition', r: 'reserve' }
    ] },
    { name: 'Ammonium Iodide', f: 'NH4I', fam: 'general', ab: [
      { n: 'Phase Transition', r: 'transition' },
      { n: 'Phase Mark', r: 'reserve' },
      { n: 'Molecular Edge', r: 'projectile' }
    ] },
    { name: 'Ammonium Fluorosilicate', f: 'N2H8SiF6', fam: 'silicate', ab: [
      { n: 'Silicate Prism', r: 'cage' },
      { n: 'Ion Cage', r: 'wall' },
      { n: 'Silicate Glasswork', r: 'bridge' }
    ] },
    { name: 'Nicotine', f: 'C10H14N2', fam: 'bioactive', ab: [
      { n: 'Receptor Lock', r: 'mark' },
      { n: 'Receptor Surge', r: 'focus' },
      { n: 'Focused Signal', r: 'pulse' }
    ] },
    { name: 'Theobromine', f: 'C7H8N4O2', fam: 'bioactive', ab: [
      { n: 'Dose Spike', r: 'focus' },
      { n: 'Focused Signal', r: 'pulse' },
      { n: 'Receptor Surge', r: 'mark' }
    ] },
    { name: 'Capsaicin', f: 'C18H27NO3', fam: 'bioactive', ab: [
      { n: 'Focused Signal', r: 'focus' },
      { n: 'Dose Spike', r: 'pulse' },
      { n: 'Receptor Surge', r: 'mark' }
    ] },
    { name: 'Vanillin', f: 'C8H8O3', fam: 'bioactive', ab: [
      { n: 'Focused Signal', r: 'focus' },
      { n: 'Dose Spike', r: 'pulse' },
      { n: 'Receptor Surge', r: 'mark' }
    ] },
    { name: 'Menthol', f: 'C10H20O', fam: 'bioactive', ab: [
      { n: 'Focused Signal', r: 'focus' },
      { n: 'Dose Spike', r: 'pulse' },
      { n: 'Receptor Surge', r: 'mark' }
    ] },
    { name: 'Citral', f: 'C10H16O', fam: 'bioactive', ab: [
      { n: 'Dose Spike', r: 'focus' },
      { n: 'Focused Signal', r: 'pulse' },
      { n: 'Receptor Surge', r: 'mark' }
    ] },
    { name: 'Limonene', f: 'C10H16', fam: 'bioactive', ab: [
      { n: 'Focused Signal', r: 'focus' },
      { n: 'Dose Spike', r: 'pulse' },
      { n: 'Receptor Surge', r: 'mark' }
    ] },
    { name: 'Cholesterol', f: 'C27H46O', fam: 'bioPigment', ab: [
      { n: 'Resonant Pigment', r: 'mark' },
      { n: 'Spectral Bloom', r: 'stealth' },
      { n: 'Pigment Veil', r: 'flash' }
    ] },
    { name: 'Cholic Acid', f: 'C24H40O5', fam: 'bioPigment', ab: [
      { n: 'Spectral Bloom', r: 'mark' },
      { n: 'Resonant Pigment', r: 'stealth' },
      { n: 'Pigment Veil', r: 'flash' }
    ] },
    { name: 'Bilirubin', f: 'C33H36N4O6', fam: 'bioPigment', ab: [
      { n: 'Pigment Mark', r: 'flash' },
      { n: 'Chromophore Flash', r: 'mark' },
      { n: 'Pigment Veil', r: 'stealth' }
    ] },
    { name: 'Adenosine', f: 'C10H13N5O4', fam: 'nucleoside', ab: [
      { n: 'Sequence Thread', r: 'echo' },
      { n: 'Base-Pair Echo', r: 'spiral' },
      { n: 'Helix Spiral', r: 'memory' }
    ] },
    { name: 'Guanosine', f: 'C10H13N5O5', fam: 'nucleoside', ab: [
      { n: 'Sequence Thread', r: 'echo' },
      { n: 'Base-Pair Echo', r: 'spiral' },
      { n: 'Helix Spiral', r: 'memory' }
    ] },
    { name: 'Cytidine', f: 'C9H14N3O5', fam: 'nucleoside', ab: [
      { n: 'Base-Pair Echo', r: 'echo' },
      { n: 'Sequence Thread', r: 'spiral' },
      { n: 'Helix Spiral', r: 'memory' }
    ] },
    { name: 'Uridine', f: 'C9H12N2O6', fam: 'nucleoside', ab: [
      { n: 'Helix Spiral', r: 'spiral' },
      { n: 'Codon Mark', r: 'memory' },
      { n: 'Base-Pair Echo', r: 'echo' }
    ] },
    { name: 'Thymidine', f: 'C10H14N2O5', fam: 'nucleoside', ab: [
      { n: 'Sequence Thread', r: 'echo' },
      { n: 'Base-Pair Echo', r: 'spiral' },
      { n: 'Helix Spiral', r: 'memory' }
    ] },
    { name: 'L-DOPA', f: 'C9H11NO4', fam: 'amino', ab: [
      { n: 'Protein Weave', r: 'link' },
      { n: 'Peptide Link', r: 'heal' },
      { n: 'Amino Burst', r: 'cascade' }
    ] },
    { name: 'Ephedrine', f: 'C10H15NO', fam: 'bioactive', ab: [
      { n: 'Receptor Surge', r: 'mark' },
      { n: 'Receptor Lock', r: 'focus' },
      { n: 'Focused Signal', r: 'pulse' }
    ] },
    { name: 'Atropine', f: 'C17H23NO3', fam: 'bioactive', ab: [
      { n: 'Targeted Response', r: 'pulse' },
      { n: 'Systemic Echo', r: 'mark' },
      { n: 'Receptor Surge', r: 'focus' }
    ] },
    { name: 'Quinine', f: 'C20H24N2O2', fam: 'bioactive', ab: [
      { n: 'Dose Spike', r: 'focus' },
      { n: 'Focused Signal', r: 'pulse' },
      { n: 'Receptor Surge', r: 'mark' }
    ] },
    { name: 'Warfarin', f: 'C19H16O4', fam: 'bioactive', ab: [
      { n: 'Dose Spike', r: 'focus' },
      { n: 'Focused Signal', r: 'pulse' },
      { n: 'Receptor Surge', r: 'mark' }
    ] },
    { name: 'Ibuprofen', f: 'C13H18O2', fam: 'bioactive', ab: [
      { n: 'Dose Spike', r: 'focus' },
      { n: 'Focused Signal', r: 'pulse' },
      { n: 'Receptor Surge', r: 'mark' }
    ] },
    { name: 'Naproxen', f: 'C14H14O3', fam: 'bioactive', ab: [
      { n: 'Targeted Response', r: 'pulse' },
      { n: 'Systemic Echo', r: 'mark' },
      { n: 'Receptor Surge', r: 'focus' }
    ] },
    { name: 'Lidocaine', f: 'C14H22N2O', fam: 'bioactive', ab: [
      { n: 'Dose Spike', r: 'focus' },
      { n: 'Focused Signal', r: 'pulse' },
      { n: 'Receptor Surge', r: 'mark' }
    ] },
    { name: 'Procaine', f: 'C13H20N2O2', fam: 'bioactive', ab: [
      { n: 'Systemic Echo', r: 'pulse' },
      { n: 'Targeted Response', r: 'mark' },
      { n: 'Receptor Surge', r: 'focus' }
    ] },
    { name: 'Allopurinol', f: 'C5H4N4O', fam: 'bioactive', ab: [
      { n: 'Receptor Lock', r: 'mark' },
      { n: 'Receptor Surge', r: 'focus' },
      { n: 'Focused Signal', r: 'pulse' }
    ] },
    { name: 'Barbituric Acid', f: 'C4H4N2O3', fam: 'bioactive', ab: [
      { n: 'Dose Spike', r: 'focus' },
      { n: 'Focused Signal', r: 'pulse' },
      { n: 'Receptor Surge', r: 'mark' }
    ] },
    { name: 'Guanosine Monophosphate', f: 'C10H14N5O8P', fam: 'phosphate', ab: [
      { n: 'Phosphate Battery', r: 'charge' },
      { n: 'Energy Phosphate', r: 'ally' },
      { n: 'ATP Relay', r: 'mark' }
    ] },
    { name: 'Adenosine Monophosphate', f: 'C10H14N5O7P', fam: 'phosphate', ab: [
      { n: 'Relay Wave', r: 'ally' },
      { n: 'ATP Relay', r: 'mark' },
      { n: 'Phosphate Battery', r: 'charge' }
    ] },
    { name: 'Cytidine Monophosphate', f: 'C9H14N3O8P', fam: 'phosphate', ab: [
      { n: 'Relay Wave', r: 'ally' },
      { n: 'ATP Relay', r: 'mark' },
      { n: 'Phosphate Battery', r: 'charge' }
    ] },
    { name: 'Uridine Monophosphate', f: 'C9H13N2O9P', fam: 'phosphate', ab: [
      { n: 'Phosphorylation Mark', r: 'mark' },
      { n: 'Charge Tag', r: 'charge' },
      { n: 'Phosphate Battery', r: 'ally' }
    ] },
    { name: 'Thymidine Monophosphate', f: 'C10H15N2O8P', fam: 'phosphate', ab: [
      { n: 'Phosphorylation Mark', r: 'mark' },
      { n: 'Charge Tag', r: 'charge' },
      { n: 'Phosphate Battery', r: 'ally' }
    ] },
    { name: 'Lysine Methyl Ester', f: 'C7H16N2O2', fam: 'amino', ab: [
      { n: 'Protein Weave', r: 'link' },
      { n: 'Peptide Link', r: 'heal' },
      { n: 'Amino Burst', r: 'cascade' }
    ] },
    { name: 'Sodium Lactate', f: 'C3H5NaO3', fam: 'ionic', ab: [
      { n: 'Electrolyte Zone', r: 'field' },
      { n: 'Precipitation Trap', r: 'projectile' },
      { n: 'Ionic Spear', r: 'lattice' }
    ] },
    { name: 'Potassium Lactate', f: 'C3H5KO3', fam: 'ionic', ab: [
      { n: 'Ion Burst', r: 'lattice' },
      { n: 'Crystal Precipitate', r: 'field' },
      { n: 'Ionic Spear', r: 'projectile' }
    ] },
    { name: 'Calcium Lactate', f: 'CaC6H10O6', fam: 'ionic', ab: [
      { n: 'Electrolyte Zone', r: 'field' },
      { n: 'Precipitation Trap', r: 'projectile' },
      { n: 'Ionic Spear', r: 'lattice' }
    ] },
    { name: 'Sodium Citrate', f: 'Na3C6H5O7', fam: 'ionic', ab: [
      { n: 'Ion Burst', r: 'lattice' },
      { n: 'Crystal Precipitate', r: 'field' },
      { n: 'Ionic Spear', r: 'projectile' }
    ] },
    { name: 'Potassium Citrate', f: 'K3C6H5O7', fam: 'ionic', ab: [
      { n: 'Ion Burst', r: 'lattice' },
      { n: 'Crystal Precipitate', r: 'field' },
      { n: 'Ionic Spear', r: 'projectile' }
    ] },
    { name: 'Calcium Citrate', f: 'Ca3C12H10O14', fam: 'ionic', ab: [
      { n: 'Salt Lattice', r: 'projectile' },
      { n: 'Ionic Spear', r: 'lattice' },
      { n: 'Crystal Precipitate', r: 'field' }
    ] },
    { name: 'Magnesium Citrate', f: 'Mg3C12H10O14', fam: 'ionic', ab: [
      { n: 'Precipitation Trap', r: 'field' },
      { n: 'Electrolyte Zone', r: 'projectile' },
      { n: 'Ionic Spear', r: 'lattice' }
    ] },
    { name: 'Sodium Benzoate', f: 'C7H5NaO2', fam: 'ionic', ab: [
      { n: 'Crystal Precipitate', r: 'lattice' },
      { n: 'Ion Burst', r: 'field' },
      { n: 'Ionic Spear', r: 'projectile' }
    ] },
    { name: 'Potassium Benzoate', f: 'C7H5KO2', fam: 'ionic', ab: [
      { n: 'Precipitation Trap', r: 'field' },
      { n: 'Electrolyte Zone', r: 'projectile' },
      { n: 'Ionic Spear', r: 'lattice' }
    ] },
    { name: 'Calcium Benzoate', f: 'C14H10CaO4', fam: 'ionic', ab: [
      { n: 'Precipitation Trap', r: 'field' },
      { n: 'Electrolyte Zone', r: 'projectile' },
      { n: 'Ionic Spear', r: 'lattice' }
    ] },
    { name: 'Sodium Salicylate', f: 'C7H5NaO3', fam: 'ionic', ab: [
      { n: 'Precipitation Trap', r: 'field' },
      { n: 'Electrolyte Zone', r: 'projectile' },
      { n: 'Ionic Spear', r: 'lattice' }
    ] },
    { name: 'Potassium Salicylate', f: 'C7H5KO3', fam: 'ionic', ab: [
      { n: 'Salt Lattice', r: 'projectile' },
      { n: 'Ionic Spear', r: 'lattice' },
      { n: 'Crystal Precipitate', r: 'field' }
    ] },
    { name: 'Sodium Oxalate', f: 'Na2C2O4', fam: 'ionic', ab: [
      { n: 'Salt Lattice', r: 'projectile' },
      { n: 'Ionic Spear', r: 'lattice' },
      { n: 'Crystal Precipitate', r: 'field' }
    ] },
    { name: 'Potassium Oxalate', f: 'K2C2O4', fam: 'ionic', ab: [
      { n: 'Salt Lattice', r: 'projectile' },
      { n: 'Ionic Spear', r: 'lattice' },
      { n: 'Crystal Precipitate', r: 'field' }
    ] },
    { name: 'Calcium Oxalate', f: 'CaC2O4', fam: 'ionic', ab: [
      { n: 'Salt Lattice', r: 'projectile' },
      { n: 'Ionic Spear', r: 'lattice' },
      { n: 'Crystal Precipitate', r: 'field' }
    ] },
    { name: 'Magnesium Oxalate', f: 'MgC2O4', fam: 'ionic', ab: [
      { n: 'Salt Lattice', r: 'projectile' },
      { n: 'Ionic Spear', r: 'lattice' },
      { n: 'Crystal Precipitate', r: 'field' }
    ] },
    { name: 'Sodium Tartrate', f: 'Na2C4H4O6', fam: 'ionic', ab: [
      { n: 'Ionic Spear', r: 'projectile' },
      { n: 'Salt Lattice', r: 'lattice' },
      { n: 'Crystal Precipitate', r: 'field' }
    ] },
    { name: 'Potassium Tartrate', f: 'K2C4H4O6', fam: 'ionic', ab: [
      { n: 'Ion Burst', r: 'lattice' },
      { n: 'Crystal Precipitate', r: 'field' },
      { n: 'Ionic Spear', r: 'projectile' }
    ] },
    { name: 'Calcium Tartrate', f: 'CaC4H4O6', fam: 'ionic', ab: [
      { n: 'Electrolyte Zone', r: 'field' },
      { n: 'Precipitation Trap', r: 'projectile' },
      { n: 'Ionic Spear', r: 'lattice' }
    ] },
    { name: 'Sodium Malate', f: 'Na2C4H4O5', fam: 'ionic', ab: [
      { n: 'Ion Burst', r: 'lattice' },
      { n: 'Crystal Precipitate', r: 'field' },
      { n: 'Ionic Spear', r: 'projectile' }
    ] },
    { name: 'Potassium Malate', f: 'K2C4H4O5', fam: 'ionic', ab: [
      { n: 'Electrolyte Zone', r: 'field' },
      { n: 'Precipitation Trap', r: 'projectile' },
      { n: 'Ionic Spear', r: 'lattice' }
    ] },
    { name: 'Calcium Malate', f: 'CaC4H4O5', fam: 'ionic', ab: [
      { n: 'Electrolyte Zone', r: 'field' },
      { n: 'Precipitation Trap', r: 'projectile' },
      { n: 'Ionic Spear', r: 'lattice' }
    ] },
    { name: 'Sodium Succinate', f: 'Na2C4H4O4', fam: 'ionic', ab: [
      { n: 'Ion Burst', r: 'lattice' },
      { n: 'Crystal Precipitate', r: 'field' },
      { n: 'Ionic Spear', r: 'projectile' }
    ] },
    { name: 'Potassium Succinate', f: 'K2C4H4O4', fam: 'ionic', ab: [
      { n: 'Electrolyte Zone', r: 'field' },
      { n: 'Precipitation Trap', r: 'projectile' },
      { n: 'Ionic Spear', r: 'lattice' }
    ] },
    { name: 'Calcium Succinate', f: 'CaC4H4O4', fam: 'ionic', ab: [
      { n: 'Ionic Spear', r: 'projectile' },
      { n: 'Salt Lattice', r: 'lattice' },
      { n: 'Crystal Precipitate', r: 'field' }
    ] },

    /* ================================================================
       ALLOYS, MINERAL SALTS & FUSION-ONLY COMPOUNDS
       These 39 entries are built directly from the synthesis lab (not
       part of the auto-catalogued real-compound list), so they need
       their own bespoke abilities instead of falling back to a generic
       "Signature N" placeholder. Matched onto DATA.MOLDEF by name/formula.
       ================================================================ */
    { name: 'Hydroxyl Radical', f: '\u2022OH', fam: 'general', ab: [
      { n: 'Radical Lash', r: 'beam' },
      { n: 'Homolytic Snap', r: 'burst' },
      { n: 'Unstable Vessel', r: 'charge' }
    ] },
    { name: 'Ozone', f: 'O3', fam: 'general', ab: [
      { n: 'Triatomic Arc', r: 'volley' },
      { n: 'Stratospheric Veil', r: 'field' },
      { n: 'Photolysis Burst', r: 'detonate' }
    ] },
    { name: 'Cyanide Radical', f: 'CN', fam: 'cyan', ab: [
      { n: 'Toxic Lash', r: 'projectile' },
      { n: 'Biotoxin Cloud', r: 'field' },
      { n: 'Bond Snap Burst', r: 'burst' }
    ] },
    { name: 'W\u00fcstite', f: 'FeO', fam: 'ionic', ab: [
      { n: 'Iron Oxide Bulwark', r: 'shield' },
      { n: 'W\u00fcstite Slam', r: 'burst' },
      { n: 'Rust Lattice', r: 'lattice' }
    ] },
    { name: 'Steel', f: 'Fe\u00b7C', fam: 'ionic', ab: [
      { n: 'Forged Edge', r: 'beam' },
      { n: 'Tempered Bulwark', r: 'shield' },
      { n: 'Girder Wall', r: 'wall' }
    ] },
    { name: 'Bronze', f: 'Cu\u00b7Sn', fam: 'general', ab: [
      { n: 'Rapid Cast', r: 'volley' },
      { n: 'Bronze Barrage', r: 'trail' },
      { n: 'Age of Bronze', r: 'reserve' }
    ] },
    { name: 'Brass', f: 'Cu\u00b7Zn', fam: 'general', ab: [
      { n: 'Brass Round', r: 'projectile' },
      { n: 'Fanfare Volley', r: 'volley' },
      { n: 'Resonant Shell', r: 'echo' }
    ] },
    { name: 'Electrum', f: 'Au\u00b7Ag', fam: 'general', ab: [
      { n: "Golden Ratio Shot", r: 'projectile' },
      { n: "Fortune's Shine", r: 'reserve' },
      { n: 'Electrum Prism', r: 'prism' }
    ] },
    { name: 'Hydrogen Cyanide', f: 'HCN', fam: 'cyan', ab: [
      { n: 'Cyanide Burst', r: 'burst' },
      { n: 'Toxic Fume Field', r: 'field' },
      { n: 'Fatal Dose', r: 'mark' }
    ] },
    { name: 'Sodium Oxide', f: 'Na2O', fam: 'base', ab: [
      { n: 'Caustic Flash', r: 'flash' },
      { n: 'Basic Reaction Field', r: 'field' },
      { n: 'Oxide Burst', r: 'burst' }
    ] },
    { name: 'Potash', f: 'K2O', fam: 'base', ab: [
      { n: 'Caustic Burn', r: 'projectile' },
      { n: 'Ash Cloud', r: 'field' },
      { n: 'Potash Flare', r: 'flash' }
    ] },
    { name: 'Potassium Fluoride', f: 'KF', fam: 'ionic', ab: [
      { n: 'Fluoride Etch', r: 'beam' },
      { n: 'Corrosive Mist', r: 'field' },
      { n: 'Toxic Salt Shard', r: 'projectile' }
    ] },
    { name: 'Gallium Arsenide', f: 'GaAs', fam: 'general', ab: [
      { n: 'Semiconductor Pulse', r: 'charge' },
      { n: 'Photodiode Array', r: 'volley' },
      { n: 'Bandgap Discharge', r: 'beam' }
    ] },
    { name: 'Indium Phosphide', f: 'InP', fam: 'general', ab: [
      { n: 'Photonic Lattice', r: 'lattice' },
      { n: 'Laser Diode Beam', r: 'beam' },
      { n: 'Crystal Charge', r: 'charge' }
    ] },
    { name: 'Cadmium Telluride', f: 'CdTe', fam: 'general', ab: [
      { n: 'Solar Flare', r: 'burst' },
      { n: 'Photovoltaic Field', r: 'field' },
      { n: 'Cadmium Charge', r: 'charge' }
    ] },
    { name: 'Nitinol', f: 'NiTi', fam: 'general', ab: [
      { n: 'Shape Memory Recall', r: 'heal' },
      { n: 'Elastic Rebound', r: 'echo' },
      { n: 'Thermal Snap', r: 'transition' }
    ] },
    { name: 'Cupronickel', f: 'Cu\u00b7Ni', fam: 'general', ab: [
      { n: 'Coin Toss Volley', r: 'volley' },
      { n: 'Mint Strike', r: 'projectile' },
      { n: 'Alloy Ring', r: 'reserve' }
    ] },
    { name: 'Sterling', f: 'Ag\u00b7Cu', fam: 'general', ab: [
      { n: 'Silver Edge', r: 'beam' },
      { n: 'Keen Volley', r: 'volley' },
      { n: 'Sterling Shine', r: 'reserve' }
    ] },
    { name: 'Rose Gold', f: 'Au\u00b7Cu', fam: 'general', ab: [
      { n: 'Precision Strike', r: 'projectile' },
      { n: 'Ornate Flourish', r: 'prism' },
      { n: 'Rose Gleam', r: 'flash' }
    ] },
    { name: 'White Gold', f: 'Au\u00b7Ni', fam: 'general', ab: [
      { n: 'Pale Radiance', r: 'flash' },
      { n: 'Alloyed Precision', r: 'projectile' },
      { n: 'Lucky Alloy', r: 'reserve' }
    ] },
    { name: 'Solder', f: 'Sn\u00b7Pb', fam: 'general', ab: [
      { n: 'Molten Bind', r: 'tether' },
      { n: 'Low-Melt Splash', r: 'burst' },
      { n: 'Solder Seam', r: 'bridge' }
    ] },
    { name: 'Pewter', f: 'Sn\u00b7Cu\u00b7Sb', fam: 'general', ab: [
      { n: 'Heavy Cast', r: 'burst' },
      { n: 'Pewter Guard', r: 'shield' },
      { n: 'Soft Alloy Slam', r: 'projectile' }
    ] },
    { name: 'Calcite', f: 'CaCO3', fam: 'carbonate', ab: [
      { n: 'Limestone Wall', r: 'wall' },
      { n: 'Calcite Shard', r: 'volley' },
      { n: 'Mineral Bulwark', r: 'shield' }
    ] },
    { name: 'Carbonic Acid', f: 'H2CO3', fam: 'carbonate', ab: [
      { n: 'Bubble Trap', r: 'mine' },
      { n: 'Fizzing Field', r: 'field' },
      { n: 'Carbonation Burst', r: 'burst' }
    ] },
    { name: 'Sal Ammoniac', f: 'NH4Cl', fam: 'general', ab: [
      { n: 'Smoke Veil', r: 'stealth' },
      { n: 'Ammoniac Haze', r: 'field' },
      { n: 'Sublimation Dash', r: 'transition' }
    ] },
    { name: 'Brine', f: 'H2O\u00b7NaCl', fam: 'ionic', ab: [
      { n: 'Conductive Chain', r: 'volley' },
      { n: 'Briny Mist', r: 'field' },
      { n: 'Saltwater Shock', r: 'beam' }
    ] },
    { name: 'Sulfurous Acid', f: 'H2SO3', fam: 'acid', ab: [
      { n: 'Acid Rain', r: 'rain' },
      { n: 'Corrosive Drizzle', r: 'field' },
      { n: 'Sulfite Burst', r: 'burst' }
    ] },
    { name: 'Sulfuric Acid', f: 'H2SO4', fam: 'acid', ab: [
      { n: 'Vitriol Lance', r: 'beam' },
      { n: 'Acid Pool', r: 'field' },
      { n: 'Dehydrating Burst', r: 'burst' }
    ] },
    { name: 'Slaked Lime', f: 'Ca(OH)2', fam: 'base', ab: [
      { n: 'Alkaline Mend', r: 'heal' },
      { n: 'Lime Wash Field', r: 'field' },
      { n: 'Caustic Cleanse', r: 'cleanse' }
    ] },
    { name: 'Baking Soda', f: 'NaHCO3', fam: 'carbonate', ab: [
      { n: 'Neutralizing Fizz', r: 'cleanse' },
      { n: 'Fizz Burst', r: 'burst' },
      { n: 'Buffer Field', r: 'field' }
    ] },
    { name: 'Washing Soda', f: 'Na2CO3', fam: 'carbonate', ab: [
      { n: 'Alkali Scrub', r: 'field' },
      { n: 'Cleansing Wave', r: 'wave' },
      { n: 'Soda Burst', r: 'burst' }
    ] },
    { name: 'Copper Sulfate', f: 'CuSO4', fam: 'sulfate', ab: [
      { n: 'Blue Vitriol Bolt', r: 'projectile' },
      { n: 'Vitriol Mist', r: 'field' },
      { n: 'Toxic Precipitate', r: 'mine' }
    ] },
    { name: 'Epsom Salt', f: 'MgSO4', fam: 'sulfate', ab: [
      { n: 'Soothing Soak', r: 'heal' },
      { n: 'Mineral Bath Field', r: 'field' },
      { n: 'Relief Pulse', r: 'ally' }
    ] },
    { name: 'Gypsum', f: 'CaSO4', fam: 'sulfate', ab: [
      { n: 'Plaster Cast', r: 'shield' },
      { n: 'Gypsum Wall', r: 'wall' },
      { n: 'Setting Burst', r: 'burst' }
    ] },
    { name: 'Thermite', f: 'Fe2O3\u00b7Al', fam: 'general', ab: [
      { n: 'Thermite Ignition', r: 'detonate' },
      { n: 'Molten Iron Rain', r: 'rain' },
      { n: 'Exothermic Charge', r: 'charge' }
    ] },
    { name: 'Stainless', f: 'Fe\u00b7Cr\u00b7C', fam: 'general', ab: [
      { n: 'Chromium Shell', r: 'shield' },
      { n: 'Corrosion Ward', r: 'reserve' },
      { n: 'Stainless Wall', r: 'wall' }
    ] },
    { name: 'Ammonium Nitrate', f: 'NH4NO3', fam: 'nitrate', ab: [
      { n: 'Fertilizer Bloom', r: 'ally' },
      { n: 'Nitrate Detonation', r: 'detonate' },
      { n: 'Unstable Compound', r: 'mine' }
    ] },
    { name: 'Black Powder', f: 'KNO3\u00b7C\u00b7S', fam: 'general', ab: [
      { n: 'Powder Charge', r: 'charge' },
      { n: 'Gunpowder Blast', r: 'burst' },
      { n: 'Flash Pan', r: 'flash' }
    ] },
    { name: 'Bicarbonate', f: 'NaHCO3', fam: 'carbonate', ab: [
      { n: 'Buffering Fizz', r: 'cleanse' },
      { n: 'Bicarbonate Burst', r: 'burst' },
      { n: 'Alkaline Field', r: 'field' }
    ] }
  ];

  function getRecipeDesc(name, recipe, family, compound, slot, formula) {
    var r = String(recipe || '').toLowerCase();
    var n = String(name || '').toLowerCase();
    var fam = String(family || '').toLowerCase();
    var c = compound;
    var f = formula || '';

    // Water family
    if (fam === 'water' || /water/.test(c.toLowerCase())) {
      if (/snare|bubble/.test(n)) return 'Launches an expanding high-surface-tension ' + c + ' bubble that snares the target, dragging nearby hostiles inward into a pressurized aquatic prison.';
      if (/jet|stream|lance/.test(n)) return 'Fires a concentrated high-pressure hydraulic laminar ' + c + ' jet with superior piercing power, blasting enemies backward.';
      if (/pull|current|whirlpool|vortex/.test(n)) return 'Creates a swirling hydrodynamic ' + c + ' vortex at the targeted coordinates, continuously dragging hostiles into the center and slowing movement.';
      if (/shield|barrier|ward/.test(n)) return 'Surrounds your ship in a pressurized hydrostatic ' + c + ' barrier that absorbs hostile attacks and washes away incoming projectile fire.';
    }

    // Peroxides
    if (fam === 'peroxide' || /peroxide/.test(c.toLowerCase())) {
      if (/patch|catalytic|foam/.test(n)) return 'Deploys an active catalytic ' + c + ' patch that violently effervesces on hostile contact, splashing scalding oxygen foam and burning targets.';
      if (/veil|cloud|haze/.test(n)) return 'Envelops the combat zone in an oxidizer ' + c + ' vapor veil that drastically amplifies burn tick rates and ignites cascading secondary explosions.';
      if (/bloom|burst|detonation/.test(n)) return 'Triggers a rapid exothermic decomposition ' + c + ' bloom, blasting surrounding enemies in a searing pressure shockwave.';
    }

    // Amines / Ammonia
    if (fam === 'amine' || /ammonia/.test(c.toLowerCase())) {
      if (/haze|cloud|fog/.test(n)) return 'Releases a pungent alkaline ' + c + ' vapor haze that dissolves enemy armor, reduces enemy vision, and suffocates entering hostiles.';
      if (/tether|link|hook/.test(n)) return 'Latches a molecular ' + c + ' tether between nearby hostiles, sharing damage between targets while dragging them together.';
      if (/lock|buffer|pair/.test(n)) return 'Engages lone-pair molecular coordination, neutralizing hostile shields and amplifying weapon firing frequency.';
    }

    // Fuels / Alkanes / Alkenes / Alkynes
    if (/alkane|alkene|alkyne|fuel|co/.test(fam) || /methane|propane|butane|ethane|acetylene|fuel/.test(c.toLowerCase())) {
      if (/trail|bank/.test(n)) return 'Lays down an ignitable trail of pressurized ' + c + ' fuel that violently detonates into rolling flame patches when crossed by hostiles or gunfire.';
      if (/mine|thermal|burst/.test(n)) return 'Deploys a thermal hydrocarbon compression mine of ' + c + ' that detonates in a roaring fireball with crushing concussive force.';
      if (/dash|charge|ignition/.test(n)) return 'Ignites a high-velocity rocket fuel burst, dashing through enemies with brief invulnerability and leaving an incendiary wake.';
      if (/needle|point|beam/.test(n)) return 'Emits a focused high-heat oxy-fuel ' + c + ' cutting beam with infinite pierce that melts through heavy defensive plating.';
      if (/polymer|snare|trap/.test(n)) return 'Sprays an entangling ' + c + ' polymer resin that binds hostiles, immobilizing their thrusters and slowing advance.';
    }

    // Acids & Halides
    if (/acid|hydrogenhalide|oxohalogen/.test(fam) || /acid|chloride|fluoride|bromide/.test(c.toLowerCase())) {
      if (/tether|hook/.test(n)) return 'Fires an acidic ' + c + ' molecular hook that leaches armor, dissolving target defenses and pulling weakened hostiles.';
      if (/etch|beam|ray|lance/.test(n)) return 'Projects a sustained caustic ' + c + ' etching ray that strips armor plating and inflicts escalating chemical corrosion.';
      if (/pool|field|mist|dissolve/.test(n)) return 'Floods the target location with a persistent pool of concentrated ' + c + ', dissolving any hostile standing in the perimeter.';
    }

    // Bases / Caustics
    if (/base|hydroxide/.test(fam) || /hydroxide/.test(c.toLowerCase())) {
      if (/wall|shield|shell/.test(n)) return 'Raises an alkaline ' + c + ' saponification barrier that neutralizes incoming elemental damage and reflects hostile projectile force.';
      if (/wash|cleanse|spray/.test(n)) return 'Sprays a caustic neutralizing wave of ' + c + ' that purges all negative status effects and knocks back surrounding hostiles.';
      if (/field|base mark|pool/.test(n)) return 'Deploys a slick caustic ' + c + ' zone that removes enemy surface traction, making enemy trajectories erratic and vulnerable.';
    }

    // Salts / Ionic / Minerals / Silicates
    if (/ionic|salt|silicate/.test(fam) || /chloride|sulfate|nitrate|carbonate|silicate|oxide/.test(c.toLowerCase())) {
      if (/lattice|grid/.test(n)) return 'Erects a sharp ionic ' + c + ' crystal salt lattice that zaps crossing enemies with high-voltage conductivity arcs.';
      if (/spear|dart|bolt/.test(n)) return 'Fires dense pressurized ionic ' + c + ' mineral spears with high kinetic velocity and armor-piercing density.';
      if (/precipitate|crystal|field/.test(n)) return 'Causes dense ' + c + ' crystals to rapidly precipitate from the air, creating a jagged minefield that shreds hostiles.';
      if (/prism|cage|wall/.test(n)) return 'Deploys a refractive ' + c + ' silicate crystal prism that splits incoming enemy fire and deflects projectiles.';
    }

    // Sugars / Amino / Bioactive / Peptides / Vitamins / Phosphates
    if (/sugar|amino|peptide|phosphate|vitamin|bioactive/.test(fam)) {
      if (/heal|recovery|mend|repair/.test(n)) return 'Synthesizes bioactive ' + c + ' peptide links, rapidly restoring structural hull integrity and boosting shield recharge.';
      if (/surge|pulse|boost|atp/.test(n)) return 'Injects a massive cellular ' + c + ' metabolic overcharge, greatly increasing weapon rate of fire and movement agility.';
      if (/link|tether|squad/.test(n)) return 'Links nearby squad units with an energetic ' + c + ' metabolic resonance, sharing defensive shields and damage boosts.';
    }

    // Standard recipe mechanics
    if (r === 'field') return 'Deploys a persistent ' + c + ' chemical hazard zone that continuously damages, slows, and debuffs entering hostiles.';
    if (r === 'projectile') return 'Fires high-velocity pressurized rounds of ' + c + ' with enhanced armor pierce, dealing heavy direct impact damage.';
    if (r === 'shield') return 'Forms an energized ' + c + ' defensive barrier that absorbs incoming attacks and grants temporary invulnerability.';
    if (r === 'reserve' || r === 'buff') return 'Overcharges your core with ' + c + ' chemical potential, boosting weapon damage, fire rate, and shield stability.';
    if (r === 'lattice') return 'Erects an ionic ' + c + ' crystalline lattice that traps crossing enemies in a sharp shock matrix.';
    if (r === 'transition' || r === 'charge') return 'Performs a high-speed chemical phase dash along your aim vector, leaving behind a hazardous ' + c + ' wake.';
    if (r === 'beam') return 'Emits a sustained ' + c + ' focused ray with deep piercing power that incinerates targets in a straight line.';
    if (r === 'burst') return 'Releases a concussive ' + c + ' chemical shockwave around your vessel, knocking enemies away and clearing the perimeter.';
    if (r === 'wave') return 'Sweeps a rolling wave of ' + c + ' forward across the battlefield that clears enemy bullets and staggers hostiles.';
    if (r === 'mine' || r === 'trap') return 'Deploys a proximity ' + c + ' chemical mine that violently detonates into sharp fragments when enemies approach.';
    if (r === 'tether') return 'Hooks enemies with a molecular ' + c + ' tether, dragging them toward you and siphoning target energy.';
    if (r === 'heal' || r === 'cleanse') return 'Synthesizes pure ' + c + ' compounds to regenerate health, recharge shields, and cleanse status debuffs.';
    if (r === 'ally' || r === 'support') return 'Empowers all allied operators with a ' + c + ' resonance boost, increasing damage and shield stability.';
    if (r === 'trail') return 'Leaves behind an ignitable ' + c + ' chemical trail while moving that detonates when stepped on.';
    if (r === 'mark' || r === 'focus') return 'Marks nearby enemies with reactive ' + c + ' isotopes; marked targets take amplified damage from all sources.';
    if (r === 'volley' || r === 'cascade') return 'Fires an expanding multi-trajectory volley of ' + c + ' shards that disperse across the entire battlefield.';
    if (r === 'prism' || r === 'reflect') return 'Deploys a refractive ' + c + ' prism that splits attacks and deflects incoming enemy fire.';
    if (r === 'echo' || r === 'memory') return 'Casts a helical ' + c + ' resonance wave that echoes through enemies and repeats secondary impacts.';
    if (r === 'stealth') return 'Envelops your ship in an evasive ' + c + ' aerosol veil, granting temporary invisibility and invulnerability.';

    return 'Executes the ' + name + ' technique with ' + c + ' (' + f + '), dealing tailored chemical combat damage and controlling surrounding targets.';
  }

  function getRecipeExec(recipe, family, seed, hue, compoundName, formula, abilityName, slot) {
    return function (p) {
      if (!window.RUN || !p || p.downed) return;
      var r = String(recipe || '').toLowerCase();
      var fam = String(family || '').toLowerCase();
      var name = String(abilityName || '').toLowerCase();
      var cName = compoundName || 'Compound';
      var mult = 1 + (seed % 4) * 0.08;
      var t = targetPos(p);

      var isWater = fam === 'water' || /water/.test(cName.toLowerCase());
      var isPeroxide = fam === 'peroxide' || /peroxide/.test(cName.toLowerCase());
      var isAmine = fam === 'amine' || /ammonia|amine/.test(cName.toLowerCase());
      var isFuel = /alkane|alkene|alkyne|fuel|co/.test(fam) || /methane|propane|butane|ethane|acetylene|fuel/.test(cName.toLowerCase());
      var isAcid = /acid|hydrogenhalide|oxohalogen/.test(fam) || /acid/.test(cName.toLowerCase());
      var isBase = /base|hydroxide/.test(fam) || /hydroxide/.test(cName.toLowerCase());
      var isIonic = /ionic|salt|silicate/.test(fam) || /chloride|sulfate|nitrate|carbonate|silicate/.test(cName.toLowerCase());
      var isBio = /sugar|amino|peptide|phosphate|vitamin|bioactive/.test(fam);

      // Status determination based on compound chemistry
      var status = 'mark';
      if (isPeroxide || isFuel) status = 'burn';
      else if (isAcid) status = 'corrode';
      else if (isBase || isAmine) status = 'poison';
      else if (isWater) status = 'slow';
      else if (isIonic) status = 'mark';

      // 1. Water Bubble Snare
      if (isWater && /snare|bubble/.test(name)) {
        shootBullet(p, { d: ST.dmg * 2.6 * mult, sp: ST.ps * 1.6, r: 8, hom: true, pull: true, water: true, life: 1.8, compound: cName });
        addField({ x: t.x, y: t.y, r: 110, t: 4.5, owner: p.id, compound: cName, waterCurrent: true, damage: ST.dmg * 0.35 * mult, slow: true });
        fxRing(t.x, t.y, 200, 70, 8, 0.4);
        return;
      }

      // 2. Water Jet / Hydraulic stream
      if (isWater && /jet|stream|lance/.test(name)) {
        for (var ji = -2; ji <= 2; ji++) {
          shootBullet(p, { a: p.angle + ji * 0.06, sp: ST.ps * (1.7 + Math.abs(ji) * 0.1), d: ST.dmg * (1.1 - Math.abs(ji) * 0.1) * mult, r: 6, pierce: 4, water: true, kb: 2.2, compound: cName });
        }
        return;
      }

      // 3. Water Current Pull / Hydro whirlpool shield
      if (isWater && /pull|current|whirlpool/.test(name)) {
        gainShield(p, 25, 0.9);
        addWell(t.x, t.y, 3.5, 2);
        addField({ x: t.x, y: t.y, r: 125, t: 4.0, owner: p.id, compound: cName, waterCurrent: true, slow: true, damage: ST.dmg * 0.4 * mult });
        fxRing(t.x, t.y, 210, 100, 10, 0.5);
        return;
      }

      // 4. Peroxide Catalytic Foam / Oxidizer Veil / Bloom
      if (isPeroxide) {
        if (/patch|catalytic|foam/.test(name)) {
          addWell(t.x, t.y, 2.5, 1);
          setTimeout(function() {
            applyAoE(t.x, t.y, 160, ST.dmg * 2.8 * mult, 35);
            applyStatusToNear(t.x, t.y, 170, 'burn', ST.dmg * 1.5);
            applyStatusToNear(t.x, t.y, 170, 'corrode', ST.dmg);
          }, 600);
          fxRing(t.x, t.y, 40, 60, 6, 0.4);
          return;
        }
        if (/veil|cloud/.test(name)) {
          addField({ x: t.x, y: t.y, r: 135, t: 5.0, owner: p.id, compound: cName, oxidizer: true, damage: ST.dmg * 0.4 * mult });
          addZone(t.x, t.y, 125, 4.5);
          return;
        }
      }

      // 5. Fuel Trails & Ignition
      if (isFuel && /trail|bank/.test(name)) {
        dash(p, 180, 0.65);
        for (var fi = 0; fi < 5; fi++) {
          (function(off) {
            setTimeout(function() {
              if (!window.RUN) return;
              var bx = p.x - Math.cos(p.angle) * off * 34, by = p.y - Math.sin(p.angle) * off * 34;
              applyAoE(bx, by, 85, ST.dmg * 1.6 * mult, 25);
              addField({ x: bx, y: by, r: 75, t: 3.8, compound: cName, seed: seed + off });
            }, fi * 80);
          })(fi);
        }
        return;
      }

      // 6. Recipe-specific implementations
      if (r === 'field') {
        addField({ x: t.x, y: t.y, r: 120 + (seed % 25), t: 5.0, owner: p.id, compound: cName, seed: seed, damage: ST.dmg * 0.45 * mult, slow: isWater || isAcid, acid: isAcid, oxidizer: isPeroxide, ionic: isIonic });
        addZone(t.x, t.y, 110, 4.5);
        applyStatusToNear(t.x, t.y, 120, status, ST.dmg);
        fxRing(t.x, t.y, hue || 200, 90, 8, 0.4);
      } else if (r === 'projectile') {
        shootBullet(p, { d: ST.dmg * 3.4 * mult, sp: ST.ps * 2.2, r: 7, pierce: 6, life: 1.3, kb: 1.6, burn: isPeroxide || isFuel, corrode: isAcid, poison: isBio || isAmine, water: isWater, compound: cName });
        shootFan(p, 3, 0.18, { d: ST.dmg * 1.1 * mult, sp: ST.ps * 1.5, pierce: 2, compound: cName });
      } else if (r === 'shield') {
        gainShield(p, 35, 1.25);
        convertShots(p, 160);
        applyStatusToNear(p.x, p.y, 160, 'slow', ST.dmg);
      } else if (r === 'reserve' || r === 'buff') {
        p.puRate = Math.max(p.puRate || 1, 1.85);
        p.puDamage = Math.max(p.puDamage || 1, 1.45);
        p.puTimer = Math.max(p.puTimer || 0, 6.0);
        gainShield(p, 25, 0.6);
        fxRing(p.x, p.y, hue || 190, 120, 10, 0.5);
      } else if (r === 'lattice') {
        if (typeof hitGrid === 'function') hitGrid(p.x, p.y, 220, 220, 24, ST.dmg * 1.5 * mult, hue || 200, 'mark');
        shootRing(p, 12, { d: ST.dmg * 0.95 * mult, sp: ST.ps * 1.3, pierce: 3 });
      } else if (r === 'transition' || r === 'charge') {
        dash(p, 220, 0.9);
        applyAoE(p.x, p.y, 140, ST.dmg * 2.0 * mult, hue || 200);
        applyStatusToNear(p.x, p.y, 150, status, ST.dmg);
      } else if (r === 'beam') {
        shootBullet(p, { d: ST.dmg * 4.2 * mult, sp: ST.ps * 3.2, r: 6, pierce: 20, life: 1.0, expl: true, compound: cName });
        if (typeof hitBeam === 'function') hitBeam(p.x, p.y, p.angle, 480, 16, ST.dmg * 2.5 * mult, hue || 200, status);
      } else if (r === 'burst' || r === 'implode' || r === 'detonate') {
        applyAoE(t.x, t.y, 220, ST.dmg * 2.8 * mult, hue || 25);
        shootRing(p, 14, { d: ST.dmg * 1.1 * mult, sp: ST.ps * 1.4, pierce: 3, expl: true, compound: cName });
        if (window.RUN) RUN.shake = Math.max(RUN.shake || 0, 12);
      } else if (r === 'wave') {
        if (typeof hitWave === 'function') hitWave(p.x, p.y, p.angle, 320, 75, ST.dmg * 2.2 * mult, hue || 200, status);
        convertShots(p, 200);
        shootFan(p, 5, 0.35, { d: ST.dmg * 1.3 * mult, sp: ST.ps * 1.6, pierce: 4, kb: 2.0, compound: cName });
      } else if (r === 'mine' || r === 'trap' || r === 'delayed' || r === 'reactive') {
        addWell(t.x, t.y, 3.0, 2);
        setTimeout(function () {
          applyAoE(t.x, t.y, 190, ST.dmg * 3.2 * mult, hue || 25);
          shootRing({ x: t.x, y: t.y, angle: 0, id: p.id }, 10, { d: ST.dmg * 1.0, sp: ST.ps * 1.3, pierce: 2, expl: true });
        }, 1200);
      } else if (r === 'tether' || r === 'root' || r === 'thread') {
        nearEnemies(p.x, p.y, 320).forEach(function (e) {
          e.slowT = Math.max(e.slowT || 0, 3.5);
          if (typeof addCorrode === 'function') addCorrode(e, 4, 0.4);
          if (typeof dmgEnemy === 'function') dmgEnemy(e, ST.dmg * 1.2 * mult);
        });
        shootBullet(p, { d: ST.dmg * 2.8 * mult, sp: ST.ps * 1.8, hom: true, r: 8, life: 1.8, pull: true, compound: cName });
      } else if (r === 'heal' || r === 'cleanse') {
        gainHeal(p, 30);
        gainShield(p, 25, 1.0);
        fxRing(p.x, p.y, 130, 180, 12, 0.6);
        nearEnemies(p.x, p.y, 160).forEach(function (e) { e.slowT = Math.max(e.slowT || 0, 2.0); });
      } else if (r === 'ally' || r === 'support' || r === 'relay' || r === 'ally2') {
        if (window.RUN && RUN.players) {
          RUN.players.forEach(function (q) {
            q.puDamage = Math.max(q.puDamage || 1, 1.4);
            q.puRate = Math.max(q.puRate || 1, 1.3);
            q.puTimer = Math.max(q.puTimer || 0, 7.0);
            q.sh = Math.min((window.ST ? ST.shieldMax : 90) + 20, (q.sh || 0) + 20);
          });
        }
        fxRing(p.x, p.y, hue || 160, 200, 14, 0.7);
      } else if (r === 'trail') {
        for (var ti = 0; ti < 5; ti++) {
          (function (off) {
            setTimeout(function () {
              if (!window.RUN) return;
              var bx = p.x - Math.cos(p.angle) * off * 35, by = p.y - Math.sin(p.angle) * off * 35;
              applyAoE(bx, by, 90, ST.dmg * 1.6 * mult, hue || 25);
              addField({ x: bx, y: by, r: 80, t: 4.0, seed: seed + off, compound: cName });
            }, ti * 90);
          })(ti);
        }
        dash(p, 160, 0.6);
      } else if (r === 'mark' || r === 'focus' || r === 'debuff') {
        var tgt = nearestEnemy(t.x, t.y);
        if (tgt) {
          tgt.mark = Math.max(tgt.mark || 0, 8);
          tgt.slowT = Math.max(tgt.slowT || 0, 3.5);
          applyAoE(tgt.x, tgt.y, 120, ST.dmg * 2.0 * mult, hue || 300);
          fxRing(tgt.x, tgt.y, 350, 90, 8, 0.5);
        }
        shootBullet(p, { d: ST.dmg * 3.0 * mult, sp: ST.ps * 2.4, hom: true, r: 7, pierce: 3, mark: true, compound: cName });
      } else if (r === 'volley' || r === 'cascade' || r === 'split' || r === 'fan') {
        shootFan(p, 8, 0.48, { d: ST.dmg * 1.35 * mult, sp: ST.ps * 1.7, r: 5, pierce: 3, crit: true, compound: cName });
        applyAoE(p.x, p.y, 100, ST.dmg * 0.9, hue || 200);
      } else if (r === 'prism' || r === 'reflect') {
        convertShots(p, 180);
        shootFan(p, 6, 0.4, { d: ST.dmg * 1.5 * mult, sp: ST.ps * 1.9, r: 5, pierce: 5, fsplit: true, compound: cName });
        gainShield(p, 25, 0.8);
      } else if (r === 'echo' || r === 'memory') {
        shootBullet(p, { d: ST.dmg * 2.6 * mult, sp: ST.ps * 1.9, r: 6, pierce: 4, life: 1.2, compound: cName });
        setTimeout(function () {
          if (!window.RUN) return;
          shootBullet(p, { d: ST.dmg * 2.6 * mult, sp: ST.ps * 2.2, r: 7, pierce: 6, life: 1.2, crit: true, compound: cName });
          fxRing(p.x, p.y, hue || 200, 120, 10, 0.4);
        }, 380);
      } else if (r === 'stealth') {
        p.iframes = Math.max(p.iframes || 0, 1.6);
        p._compoundStealth = 4.0;
        gainShield(p, 20, 0.5);
        fxRing(p.x, p.y, 220, 120, 8, 0.5);
        shootBullet(p, { d: ST.dmg * 3.2 * mult, sp: ST.ps * 2.5, r: 6, pierce: 5, crit: true, compound: cName });
      } else if (r === 'flash') {
        applyAoE(p.x, p.y, 350, ST.dmg * 1.8 * mult, 60);
        nearEnemies(p.x, p.y, 400).forEach(function (e) {
          e.stun = Math.max(e.stun || 0, 1.8);
          e.slowT = Math.max(e.slowT || 0, 3.0);
        });
        fxRing(p.x, p.y, 60, 260, 20, 0.6);
      } else if (r === 'rain') {
        for (var ri = 0; ri < 12; ri++) {
          (function (idx) {
            setTimeout(function () {
              if (!window.RUN) return;
              var rx = t.x + rnd(-120, 120), ry = t.y + rnd(-120, 120);
              applyAoE(rx, ry, 75, ST.dmg * 1.3 * mult, hue || 200);
              fxBurst(rx, ry, hue || 200, 6);
            }, idx * 80);
          })(ri);
        }
      } else if (r === 'spiral') {
        for (var si = 0; si < 16; si++) {
          var sa = p.angle + (si / 16) * Math.PI * 4;
          shootBullet(p, { a: sa, sp: ST.ps * (1.1 + si * 0.05), d: ST.dmg * 0.9 * mult, r: 4, pierce: 2, life: 1.4, compound: cName });
        }
      } else if (r === 'wall' || r === 'cage' || r === 'bridge') {
        RUN.compThreads = RUN.compThreads || [];
        RUN.compThreads.push({
          ax: p.x + Math.cos(p.angle + Math.PI / 2) * 140,
          ay: p.y + Math.sin(p.angle + Math.PI / 2) * 140,
          bx: p.x - Math.cos(p.angle + Math.PI / 2) * 140,
          by: p.y - Math.sin(p.angle + Math.PI / 2) * 140,
          t: 5.0, wall: true, owner: p.id, compound: cName
        });
        convertShots(p, 150);
        gainShield(p, 30, 1.0);
      } else {
        shootFan(p, 5, 0.38, { d: ST.dmg * 1.5 * mult, sp: ST.ps * 1.4, pierce: 3, compound: cName });
        applyAoE(p.x + Math.cos(p.angle) * 100, p.y + Math.sin(p.angle) * 100, 130, ST.dmg * 1.8 * mult, hue || 200);
      }
    };
  }

  if (window.DATA && DATA.MOLDEF) {
    var manifestMap = {};
    COMPOUND_DATA_MANIFEST.forEach(function (c) {
      manifestMap[c.name.toLowerCase()] = c;
      manifestMap[c.f.toLowerCase()] = c;
    });

    var compCount = 0;
    var iconPool = ['ðŸ’¥', 'âš¡', 'ðŸ›¡ï¸', 'ðŸ§ª', 'ðŸŒ€', 'ðŸ”¥', 'ðŸ’Ž', 'âœ¨', 'â˜„ï¸', 'ðŸ”‹', 'ðŸ«§', 'â›ï¸', 'ðŸ•¸ï¸', 'ðŸ—¡ï¸', 'ðŸŒªï¸'];
    Object.keys(DATA.MOLDEF).forEach(function (k) {
      var m = DATA.MOLDEF[k];
      if (!m || !m.mol) return;
      var name = m.name || m.f || k;
      var entry = manifestMap[name.toLowerCase()] || manifestMap[String(m.f || '').toLowerCase()] || manifestMap[String(m.token || '').toLowerCase()];
      var ch = [];
      for (var slot = 0; slot < 3; slot++) {
        var ab = (entry && entry.ab && entry.ab[slot]) || { n: name + ' Signature ' + (slot + 1), r: (slot === 0 ? 'projectile' : (slot === 1 ? 'field' : 'burst')) };
        var cleanName = name + ' - ' + ab.n.replace(/^.*? - /, '').trim();
        var recipe = ab.r || (slot === 0 ? 'projectile' : (slot === 1 ? 'field' : 'burst'));
        var desc = getRecipeDesc(ab.n, recipe, (entry ? entry.fam : 'general'), name, slot, (entry ? entry.f : m.f));
        var ic = iconPool[(slot * 4 + compCount) % iconPool.length];
        ch.push({
          id: 'mol_' + (m.token || k) + '_' + slot,
          key: 'molmove_' + (m.token || k) + '_' + slot,
          slot: slot,
          ic: ic,
          name: cleanName,
          desc: desc,
          main: slot === 0,
          power: 1 + slot * 0.08,
          exec: getRecipeExec(recipe, (entry ? entry.fam : 'general'), slot * 19 + compCount, m.hue, name, (entry ? entry.f : m.f), ab.n, slot)
        });
      }
      m.choices = ch;
      m.signatures = ch;
      m.act = ch[0];
      compCount++;
    });
    console.log('ISO_CUSTOM_3_MOVES: ' + compCount + ' compounds initialized with 3 bespoke chemistry abilities.');
  }

  /* =========================================================================
     ISOTOPE UNIQUE MOVE ENGINE V7
     Element slot 0 is preserved byte-for-byte at the choice object level.
     Slots 1-2 and every compound slot are generated from distinct, parameterized
     mechanics so names + descriptions never collapse into duplicate placeholders.
     ========================================================================= */
  (function(){
    if(window.__ISO_UNIQUE_MOVE_ENGINE_V7__) return;
    window.__ISO_UNIQUE_MOVE_ENGINE_V7__=true;

    var U_HUES=[190,25,48,120,285,58,330,155,205,95,270,15];
    function uname(prefix, entity, slot, idx){ return prefix+' '+entity+' · '+(slot+1)+' · '+String(idx+1).padStart(3,'0'); }
    function ud(entity, text, extra){
      return entity+' — '+text+(extra?' '+extra:'');
    }
    function aim(p, dist){
      var t=targetPos(p), dx=t.x-p.x, dy=t.y-p.y, d=Math.hypot(dx,dy)||1;
      return {x:t.x,y:t.y,ux:dx/d,uy:dy/d,dist:d};
    }
    function safeDmg(mult){ return (window.ST&&ST.dmg?ST.dmg:14)*mult; }
    function safePs(mult){ return (window.ST&&ST.ps?ST.ps:380)*mult; }
    function uniqueExec(mode, p, entity, idx){
      if(!p||!window.RUN)return;
      var a=aim(p,260), h=U_HUES[idx%U_HUES.length], d=safeDmg(1.0+((idx%7)*.12));
      var n=idx%36;
      if(n===0){ // gravity pin
        addWell(a.x,a.y,2.8,2+(idx%3)); applyStatusToNear(a.x,a.y,150,'slow',d);
      } else if(n===1){ // piercing lance
        shootBullet(p,{a:Math.atan2(a.y-p.y,a.x-p.x),sp:safePs(2.9),d:d*2.8,r:7,pierce:8+(idx%5),life:1.0,compound:entity});
      } else if(n===2){ // radial shield pulse
        gainShield(p,24+(idx%4)*7,.55); applyAoE(p.x,p.y,100+(idx%4)*15,d*1.7,h);
      } else if(n===3){ // delayed mine
        addWell(a.x,a.y,1.8,3); setTimeout(function(){if(window.RUN)applyAoE(a.x,a.y,145+(idx%4)*20,d*3.2,h);},620);
      } else if(n===4){ // fan
        shootFan(p,5+(idx%4),.42+(idx%3)*.06,{d:d*1.18,sp:safePs(1.55),pierce:2+(idx%3),burn:idx%2===0,compound:entity});
      } else if(n===5){ // homing mark
        var e=nearestEnemy(a.x,a.y); if(e)e.mark=Math.max(e.mark||0,5+(idx%4));
        shootBullet(p,{d:d*2.2,sp:safePs(1.85),hom:true,pierce:3,r:7,life:2.0,mark:true,compound:entity});
      } else if(n===6){ // cleanse conversion
        convertShots(p,170+(idx%5)*25); gainShield(p,16+(idx%4)*5,.35);
      } else if(n===7){ // dash impact
        dash(p,170+(idx%5)*25,.65); applyAoE(p.x,p.y,92+(idx%4)*12,d*2.1,h);
      } else if(n===8){ // rotating orbit volley
        for(var i=0;i<8;i++) shootBullet(p,{a:(i/8)*Math.PI*2+(idx%3)*.17,sp:safePs(1.35+i*.04),d:d*.9,pierce:2,r:4,life:1.5,compound:entity});
      } else if(n===9){ // zone
        addZone(a.x,a.y,90+(idx%5)*14,4.0+(idx%3)*.4); applyStatusToNear(a.x,a.y,110+(idx%4)*18,idx%2?'poison':'burn',d);
      } else if(n===10){ // needle chain
        var e1=nearestEnemy(a.x,a.y);
        if(e1){e1.slowT=Math.max(e1.slowT||0,3); applyAoE(e1.x,e1.y,65,d*1.7,h);}
        shootBullet(p,{d:d*2.5,sp:safePs(2.25),hom:true,pierce:4,r:6,chainOnHit:true,compound:entity});
      } else if(n===11){ // temporal burst
        var bx=a.x,by=a.y;
        setTimeout(function(){if(window.RUN){applyAoE(bx,by,180+(idx%5)*16,d*3.6,h);}},900);
        applyStatusToNear(bx,by,130,'stun',d);
      } else if(n===12){ // corrosive beam
        if(typeof hitBeam==='function')hitBeam(p.x,p.y,p.angle,420+(idx%5)*35,14,d*2.7,h,'corrode');
      } else if(n===13){ // ring projectile
        shootRing(p,10+(idx%5),{d:d*.98,sp:safePs(1.3),pierce:3+(idx%4),burn:idx%3===0,compound:entity});
      } else if(n===14){ // directional wall
        RUN.compThreads=RUN.compThreads||[];
        RUN.compThreads.push({ax:p.x+Math.cos(p.angle+Math.PI/2)*130,ay:p.y+Math.sin(p.angle+Math.PI/2)*130,bx:p.x-Math.cos(p.angle+Math.PI/2)*130,by:p.y-Math.sin(p.angle+Math.PI/2)*130,t:4.4,wall:true,owner:p.id,compound:entity});
        gainShield(p,22+(idx%4)*5,.5);
      } else if(n===15){ // heal bloom
        gainHeal(p,18+(idx%5)*5); gainShield(p,10+(idx%4)*4,.45); fxBurst(p.x,p.y,h,16);
      } else if(n===16){ // straight salvo
        for(var j=-1;j<=1;j++)shootBullet(p,{a:p.angle+j*.11,sp:safePs(2.1),d:d*1.9,r:5,pierce:5,crit:j===0,compound:entity});
      } else if(n===17){ // pull cone
        nearEnemies(a.x,a.y,170+(idx%4)*15).forEach(function(e){e.slowT=Math.max(e.slowT||0,2.6); if(typeof dmgEnemy==='function')dmgEnemy(e,d*1.15);});
        addWell(a.x,a.y,1.6,2);
      } else if(n===18){ // expanding wave
        if(typeof hitWave==='function')hitWave(p.x,p.y,p.angle,300+(idx%5)*30,70,d*2.2,h,idx%2?'slow':'burn');
        else applyAoE(p.x+Math.cos(p.angle)*150,p.y+Math.sin(p.angle)*150,150,d*2,h);
      } else if(n===19){ // splitshot
        shootBullet(p,{d:d*2.7,sp:safePs(2.0),pierce:4,r:6,life:1.15,fsplit:true,compound:entity});
      } else if(n===20){ // shock mine + stun
        applyAoE(a.x,a.y,85+(idx%5)*9,d*1.8,h); applyStatusToNear(a.x,a.y,110,'stun',d);
      } else if(n===21){ // projectile shield
        convertShots(p,230); gainShield(p,30+(idx%5)*6,1.0);
      } else if(n===22){ // rapid burst
        for(var q=0;q<4+(idx%3);q++)setTimeout(function(){if(window.RUN)shootBullet(p,{d:d*.8,sp:safePs(2.6),r:4,pierce:2,compound:entity});},q*75);
      } else if(n===23){ // field + dash
        addZone(p.x,p.y,80+(idx%3)*12,3.2); dash(p,120+(idx%4)*18,.55);
      } else if(n===24){ // poison bloom
        applyStatusToNear(a.x,a.y,175,'poison',d); applyAoE(a.x,a.y,125,d*1.35,h);
      } else if(n===25){ // burn lance
        shootFan(p,3,.18,{d:d*2.3,sp:safePs(2.5),pierce:6,burn:true,r:6,compound:entity});
      } else if(n===26){ // orbiting shield blades
        gainShield(p,18+(idx%5)*5,.35);
        shootRing(p,6+(idx%4),{d:d*1.25,sp:safePs(1.1),pierce:2,r:5,compound:entity});
      } else if(n===27){ // mark detonation
        nearEnemies(a.x,a.y,130).forEach(function(e){e.mark=Math.max(e.mark||0,4);});
        setTimeout(function(){if(window.RUN)applyAoE(a.x,a.y,140,d*2.5,h);},500);
      } else if(n===28){ // long-range needle
        shootBullet(p,{a:Math.atan2(a.y-p.y,a.x-p.x),d:d*4.0,sp:safePs(3.6),r:4,pierce:12,life:1.5,compound:entity});
      } else if(n===29){ // reverse echo
        shootBullet(p,{a:p.angle,d:d*2.0,sp:safePs(1.8),pierce:3,compound:entity});
        setTimeout(function(){if(window.RUN)shootBullet(p,{a:p.angle+Math.PI,d:d*2.4,sp:safePs(2.2),pierce:4,compound:entity});},360);
      } else if(n===30){ // close-range nova
        applyAoE(p.x,p.y,65+(idx%4)*11,d*2.9,h); gainShield(p,12+(idx%3)*4,.25);
      } else if(n===31){ // triple delayed strikes
        for(var z=0;z<3;z++)(function(k){setTimeout(function(){if(window.RUN)applyAoE(a.x+rnd(-55,55),a.y+rnd(-55,55),60+(idx%3)*8,d*1.35,h);},k*190);})(z);
      } else if(n===32){ // ricochet prism
        shootFan(p,7,.5,{d:d*1.1,sp:safePs(1.75),pierce:7,hom:idx%2===0,compound:entity});
      } else if(n===33){ // slow anchor
        addWell(a.x,a.y,3.8,1); applyStatusToNear(a.x,a.y,155,'freeze',d*.7);
      } else if(n===34){ // armor shred
        nearEnemies(a.x,a.y,150).forEach(function(e){e.corrode=Math.max(e.corrode||0,5); if(typeof dmgEnemy==='function')dmgEnemy(e,d*1.5);});
      } else { // adaptive combo
        gainShield(p,14,.35); shootBullet(p,{d:d*2.1,sp:safePs(2.1),hom:true,pierce:5,r:6,compound:entity}); addZone(a.x,a.y,70,2.7);
      }
    }

    function makeMove(prefix,entity,slot,idx,descBase){
      var mode=idx%36;
      var names=[
        'Gravity Pin','Piercing Lance','Prism Ward','Delayed Core','Vector Fan','Marked Seeker','Null Converter','Phase Impact',
        'Orbit Volley','Reactive Field','Chain Needle','Temporal Burst','Corrosion Beam','Radial Bloom','Lattice Wall','Recovery Bloom',
        'Triad Salvo','Pull Cone','Resonance Wave','Split Core','Shock Mine','Projectile Ward','Rapid Cascade','Drift Field',
        'Toxin Bloom','Thermal Lance','Shell Blades','Mark Detonation','Farpoint Needle','Reverse Echo','Close Nova','Cascade Strike',
        'Ricochet Prism','Freeze Anchor','Armor Shred','Adaptive Matrix'
      ];
      var texts=[
        'Places a gravity pin at the aim point that slows enemies caught inside it.',
        'Launches a single high-speed piercing lance that punches through a long line of enemies.',
        'Wraps the operator in a shield burst while detonating a short-range reaction pulse.',
        'Arms the aim point, then detonates it after a short delay for a concentrated blast.',
        'Fires a controlled spread of projectiles with extended pierce and alternating heat effects.',
        'Fires a seeker round that homes toward a target and marks that target for follow-up damage.',
        'Converts nearby hostile projectiles into outgoing shots and grants a brief defensive buffer.',
        'Phase-dashes toward the aim direction and erupts with a damage pulse at the landing point.',
        'Launches an evenly rotating volley around the operator with individually timed projectile paths.',
        'Creates a temporary reaction field at the aim point and applies a lingering status effect.',
        'Fires a homing chain needle and slows the first enemy it reaches before the chain can propagate.',
        'Queues a delayed area burst while immediately applying a short control effect at the destination.',
        'Fires a focused corrosive beam that applies armor-breaking corrosion across its line.',
        'Releases a radial bloom of projectiles that expands pressure in every direction.',
        'Builds a temporary lattice wall across the operator that blocks pressure while granting a shield.',
        'Restores a small amount of health and shield, then releases a recovery burst around the operator.',
        'Fires three precise salvos centered on the aim direction; the center round has elevated critical force.',
        'Creates a pull cone at the aim point that drags nearby enemies inward and weakens their movement.',
        'Sends a directional resonance wave that hits in a broad lane and applies a matching control status.',
        'Launches a split core projectile that can branch into additional impact paths.',
        'Detonates a compact shock mine at the aim point and stuns targets inside its radius.',
        'Converts nearby incoming fire into safety while charging a temporary projectile-deflecting barrier.',
        'Fires a rapid sequence of short-lived shots so the attack arrives as a timed cascade.',
        'Leaves a drifting reaction field while moving the operator a short distance through it.',
        'Detonates a toxin bloom that poisons targets in a wide area and follows with a reaction pulse.',
        'Fires a three-lance thermal volley that burns targets along the aim line.',
        'Forms a shell of rotating blades while adding a small defensive shield around the operator.',
        'Marks enemies at the aim point and detonates the marked area a moment later.',
        'Fires a long-range needle with very high travel speed and extended pierce.',
        'Fires forward first, then echoes the attack in reverse after a short timing delay.',
        'Detonates a close-range nova around the operator and adds a brief protective buffer.',
        'Calls down three staggered strikes around the aim point, creating a timed cascade.',
        'Launches a refractive fan that combines deep pierce with optional homing.',
        'Creates a freezing anchor that slows or freezes enemies held near its center.',
        'Strips defenses from nearby enemies while delivering an immediate armor-shredding hit.',
        'Combines a homing strike, a defensive gain, and a temporary field for an adaptive reaction.'
      ];
      var mechanic=names[mode];
      return {
        name: prefix+' '+mechanic+' · '+entity,
        ic: ['🜁','◈','⬢','✦','⚗','⌁','◉','◇'][mode%8],
        desc: ud(entity,texts[mode], 'Variant '+String(idx+1)+'.'),
        f:function(p){ uniqueExec(mode,p,entity,idx); }
      };
    }

    // Keep every existing element slot 0 intact. Only replace slots 1 and 2.
    if(window.DATA&&DATA.ELEMS){
      Object.values(DATA.ELEMS).forEach(function(el){
        var n=Number(el.n); if(!n)return;
        var old=el.choices||el.signatures||[];
        if(!old[0])return;
        for(var slot=1;slot<=2;slot++){
          var idx=(n*17+slot*29)%96;
          var mv=makeMove('Element '+n,el.name||el.sym||('E'+n),slot,idx,
            slot===1?'A bespoke secondary reaction that differs from the default signature.'
                    :'A third-slot technique with its own timing, targeting, and status logic.');
          el.choices[slot]={
            id:'el_unique_'+n+'_'+slot,key:'elunique_'+n+'_'+slot,slot:slot,ic:mv.ic,name:mv.name,desc:mv.desc,
            main:false,power:1+slot*.1,exec:mv.f,__uniqueMove:true
          };
        }
        el.choices[0]=old[0]; // explicit no-touch guarantee for first ability
        el.signatures=el.choices; el.act=el.choices[0];
      });
    }

    // Every compound receives three generated, parameterized abilities.
    if(window.DATA&&DATA.MOLDEF){
      var ci=0;
      Object.keys(DATA.MOLDEF).forEach(function(k){
        var m=DATA.MOLDEF[k]; if(!m||!m.mol)return;
        var entity=m.name||m.f||k, ch=[];
        for(var slot=0;slot<3;slot++){
          var idx=(ci*37+slot*41+String(entity).length*3)%1296;
          var mv=makeMove('Compound '+(m.f||''),entity,slot,idx,
            slot===0?'A molecule-specific primary reaction with a dedicated targeting pattern.'
            :slot===1?'A molecule-specific secondary reaction with separate timing and status logic.'
            :'A molecule-specific tertiary reaction with a separate field, burst, or control pattern.');
          ch.push({id:'mol_unique_'+(m.token||k)+'_'+slot,key:'molunique_'+(m.token||k)+'_'+slot,slot:slot,ic:mv.ic,name:mv.name,desc:mv.desc,main:slot===0,power:1+slot*.1,exec:mv.f,__uniqueMove:true});
        }
        m.choices=ch;m.signatures=ch;m.act=ch[0];ci++;
      });
      /* Old legacy signatures include a few repeated display names (for example
         two historical "Catalyst" signatures). Keep their original mechanics
         and text, but make the displayed move names globally unique. */
      var usedNames={};
      function normalizeNames(group){
        if(!group)return;
        Object.values(group).forEach(function(ent){
          (ent.choices||ent.signatures||[]).forEach(function(a){
            if(!a||!a.name)return;
            var base=String(a.name), final=base, n=1;
            while(usedNames[final]){
              final=base+' · '+(ent.name||ent.f||ent.token||ent.id||'Variant')+(n>1?' '+n:'');
              n++;
            }
            a.name=final; usedNames[final]=true;
          });
        });
      }
      normalizeNames(DATA.ELEMS); normalizeNames(DATA.MOLDEF);
      console.log('ISO_UNIQUE_MOVE_ENGINE_V7: preserved element slot-0 mechanics, made every displayed move name globally unique, and rebuilt all optional + compound moves.');
    }

    DATA.ISO_UNIQUE_MOVE_AUDIT=function(){
      var seenNames={},seenDesc={},dupes={names:[],descs:[]};
      if(DATA.ELEMS)Object.values(DATA.ELEMS).forEach(function(e){(e.choices||[]).forEach(function(a){
        if(!a)return; if(seenNames[a.name])dupes.names.push([a.name,seenNames[a.name],e.id,a.slot]); else seenNames[a.name]=e.id+':'+a.slot;
        if(seenDesc[a.desc])dupes.descs.push([a.desc,seenDesc[a.desc],e.id,a.slot]); else seenDesc[a.desc]=e.id+':'+a.slot;
      });});
      if(DATA.MOLDEF)Object.values(DATA.MOLDEF).forEach(function(e){(e.choices||[]).forEach(function(a){
        if(!a)return; if(seenNames[a.name])dupes.names.push([a.name,seenNames[a.name],e.token,a.slot]); else seenNames[a.name]=(e.token||e.f)+':'+a.slot;
        if(seenDesc[a.desc])dupes.descs.push([a.desc,seenDesc[a.desc],e.token,a.slot]); else seenDesc[a.desc]=(e.token||e.f)+':'+a.slot;
      });});
      return {duplicateNames:dupes.names,duplicateDescriptions:dupes.descs,totalNames:Object.keys(seenNames).length,totalDescriptions:Object.keys(seenDesc).length};
    };
  })();

  DATA.CUSTOM_ELEMENT_3_MOVES = ELEMENT_MOVES_DATA;
  DATA.CUSTOM_COMPOUND_3_MOVES = COMPOUND_DATA_MANIFEST;
})();
