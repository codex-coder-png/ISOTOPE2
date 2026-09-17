/* ISOTOPE BUILD 7.5 — MEGA QOL / CONTENT / CO-OP OVERHAUL
   Loaded last. All modifications target the fixed build only. */
(function(){
  'use strict';
  const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
  const DATA=window.DATA, SAVE=window.SAVE, AUDIO=window.AUDIO, NET=window.NET;
  if(!DATA||!SAVE) return;
  const toast=(m,c)=>window.UI&&UI.toast?UI.toast(m,c):void 0;
  const hue=e=>Number.isFinite(+e.hue)?+e.hue:(DATA.CATS[e.cat]?.h||200);

  /* ---------- periodic vault color restoration ---------- */
  const vaultStyle=document.createElement('style');
  vaultStyle.textContent=`
    #ptable .pt[data-id]{position:relative!important;transition:transform .13s,filter .13s,opacity .13s,box-shadow .13s!important;border-width:2px!important;background:linear-gradient(145deg,hsla(var(--eh),78%,58%,.24),rgba(7,12,19,.93) 72%)!important;color:hsl(var(--eh) 88% 72%)!important;border-color:hsl(var(--eh) 82% 64%)!important;box-shadow:0 0 13px hsla(var(--eh),82%,60%,.16),inset 0 0 16px hsla(var(--eh),85%,60%,.06)!important}
    #ptable .pt[data-id] .z{color:hsl(var(--eh) 60% 72%)!important} #ptable .pt[data-id] .sy{color:hsl(var(--eh) 95% 78%)!important;text-shadow:0 0 10px hsla(var(--eh),85%,65%,.34)}
    #ptable .pt[data-id].locked{filter:brightness(.33) saturate(.35)!important;opacity:.48!important;box-shadow:none!important;background:#080d14!important;color:#4b596b!important}
    #ptable .pt[data-id].affordable{filter:none!important;opacity:1!important;transform:translateY(-2px) scale(1.015);box-shadow:0 0 0 1px hsl(var(--eh) 90% 72%),0 0 22px hsla(var(--eh),90%,65%,.4),inset 0 0 22px hsla(var(--eh),90%,65%,.14)!important}
    #ptable .pt[data-id].owned-glow{box-shadow:0 0 17px hsla(var(--eh),90%,65%,.22),inset 0 0 14px hsla(var(--eh),90%,65%,.09)!important}
    #ptable .pt[data-id].affordable::after{content:'BUYABLE';position:absolute;left:4px;right:4px;bottom:4px;text-align:center;font:700 7px/1 var(--mono);letter-spacing:1.4px;color:hsl(var(--eh) 100% 84%);text-shadow:0 0 8px hsla(var(--eh),100%,75%,.45)}
    #m-head .equipped-box{margin-top:10px;padding:10px 12px;border:1px solid var(--line2);background:linear-gradient(145deg,rgba(20,39,57,.8),rgba(8,14,23,.95));border-left:3px solid hsl(var(--eh) 90% 65%)}
    #m-head .equipped-box b{color:hsl(var(--eh) 95% 75%)}
    #ability-mastery{border-color:var(--eh)!important;background:linear-gradient(145deg,hsla(var(--eh),70%,55%,.12),#0b1220 70%)!important}
    #mega-update-panel{grid-column:1/-1!important;width:100%;box-sizing:border-box;margin-top:18px;border:1px solid rgba(116,234,255,.28);background:linear-gradient(145deg,rgba(11,24,34,.95),rgba(8,13,21,.96));padding:13px 15px;max-width:920px}
    #mega-update-panel .urow{display:grid;grid-template-columns:92px 1fr;gap:12px;padding:7px 0;border-top:1px solid rgba(255,255,255,.06)}
    #mega-update-panel .urow:first-child{border-top:0} #mega-update-panel .uver{color:var(--cy);font-family:var(--mono);font-size:11px} #mega-update-panel .utxt{color:var(--tx2);font-size:12px}
    #mega-codex{margin-top:16px;padding:12px;border:1px solid var(--line);background:#0a111c}
    #mega-hud-ability{position:fixed;left:14px;bottom:86px;z-index:44;min-width:250px;max-width:320px;padding:9px 12px;border:1px solid rgba(116,234,255,.28);background:rgba(6,12,19,.88);font-family:var(--mono);box-shadow:0 8px 26px rgba(0,0,0,.3)}
    #mega-hud-ability .nm{color:#e9f8ff;font-family:var(--disp);font-size:12px;letter-spacing:.08em} #mega-hud-ability .ds{color:var(--tx2);font-size:10px;line-height:1.35;margin-top:3px}
    #iso-stats-anchor{display:none!important;position:fixed;right:14px;top:258px;z-index:46!important}
    body.mega-in-round #iso-stats-anchor{display:block!important}
    #mega-stats{position:fixed;right:14px;top:262px;z-index:43;width:250px;display:none;pointer-events:none;padding:10px;border:1px solid rgba(116,234,255,.28);background:rgba(5,10,16,.94);backdrop-filter:blur(8px);font-family:var(--mono)}
    #mega-stats.on{display:block} #mega-stats h4{color:var(--cy);font-size:10px;letter-spacing:2px;margin-bottom:6px} #mega-stats .sg{display:grid;grid-template-columns:1fr 1fr;gap:3px 12px;font-size:9px;color:var(--tx2)} #mega-stats b{float:right;color:#f4fbff}
    #mega-bg-orbit{position:fixed;inset:0;pointer-events:none;z-index:1;overflow:hidden;opacity:.7}
    .mega-particle{position:absolute;width:3px;height:3px;border-radius:50%;background:#7bdfff;box-shadow:0 0 12px #7bdfff;opacity:.18;animation:megaDrift linear infinite}@keyframes megaDrift{from{transform:translate3d(0,0,0) scale(.7);opacity:.05}50%{opacity:.28}to{transform:translate3d(80px,-120px,0) scale(1.6);opacity:.02}}
    #mega-content-counter{font-family:var(--mono);font-size:10px;color:var(--tx3);letter-spacing:.12em;margin-top:8px}
  `;
  document.head.appendChild(vaultStyle);

  /* ---------- massive content catalog ---------- */
  const NEW_ENEMIES={
    ionwarden:{hp:72,spd:112,r:18,dmg:18,coin:5,xp:6,hue:196,shape:'shield',special:'pulse',desc:'Pulse guardian that emits expanding shock rings.'},
    prismstalker:{hp:44,spd:218,r:11,dmg:17,coin:4,xp:5,hue:280,shape:'diamond',special:'blink',desc:'Prismatic hunter that blinks toward operators.'},
    cryocaster:{hp:64,spd:83,r:16,dmg:20,coin:5,xp:6,hue:190,shape:'ring',special:'freeze',desc:'Projects freezing fields and pressure volleys.'},
    acidseer:{hp:58,spd:94,r:17,dmg:19,coin:5,xp:6,hue:103,shape:'tri',special:'corrode',desc:'Corrosive seer that strips shields with acid storms.'},
    magnetar:{hp:135,spd:32,r:27,dmg:27,coin:8,xp:9,hue:312,shape:'hex',special:'pull',desc:'Dense magnetic core that drags nearby operators.'},
    shardqueen:{hp:96,spd:72,r:20,dmg:24,coin:7,xp:8,hue:325,shape:'diamond',special:'crystal',desc:'Creates crystal fragments when damaged.'},
    voltbeetle:{hp:36,spd:245,r:9,dmg:15,coin:3,xp:4,hue:58,shape:'cross',special:'arc',desc:'High-speed electric raider that chains shocks.'},
    voidmason:{hp:155,spd:30,r:25,dmg:30,coin:9,xp:10,hue:258,shape:'square',special:'void',desc:'Builds anti-projectile void zones.'},
    emberreaver:{hp:54,spd:154,r:15,dmg:22,coin:5,xp:6,hue:24,shape:'tri',special:'embers',desc:'Leaves delayed ember charges at target locations.'},
    echooracle:{hp:82,spd:108,r:18,dmg:23,coin:7,xp:8,hue:330,shape:'ring',special:'echo',desc:'Repeats attack patterns as delayed echo volleys.'},
    alloyram:{hp:176,spd:74,r:26,dmg:33,coin:9,xp:10,hue:205,shape:'square',special:'charge',desc:'Armored alloy rusher with a punishing charge.'},
    radweaver:{hp:88,spd:128,r:19,dmg:25,coin:7,xp:8,hue:80,shape:'cross',special:'storm',desc:'Radioactive caster that marks players before strikes.'},
    silicasphinx:{hp:115,spd:65,r:21,dmg:26,coin:8,xp:9,hue:168,shape:'diamond',special:'lance',desc:'Etches crystalline lanes through the arena.'},
    quantummite:{hp:12,spd:330,r:5,dmg:9,coin:2,xp:3,hue:312,shape:'dot',special:'blink',desc:'Tiny probability mite that flickers unpredictably.'},
    bioforge:{hp:108,spd:52,r:23,dmg:21,coin:8,xp:9,hue:122,shape:'dot',special:'split',desc:'Living reactor that divides into small threats.'},
    tungstenseer:{hp:240,spd:23,r:30,dmg:37,coin:12,xp:13,hue:38,shape:'hex',special:'cross',desc:'Massive tungsten engine with wide shock patterns.'},
    neonmarauder:{hp:48,spd:268,r:10,dmg:20,coin:4,xp:5,hue:302,shape:'tri',special:'invert',desc:'Neon raider that disrupts aiming.'},
    cobaltarcher:{hp:68,spd:98,r:15,dmg:28,coin:6,xp:7,hue:218,shape:'diamond',special:'lance',desc:'Fires precision crystal bolts from range.'},
    sulfurwitch:{hp:74,spd:86,r:17,dmg:29,coin:7,xp:8,hue:64,shape:'ring',special:'embers',desc:'Leaves lingering sulfur hazards behind.'},
    xenophase:{hp:92,spd:146,r:18,dmg:24,coin:7,xp:8,hue:188,shape:'ring',special:'blink',desc:'Phase-shifts between positions while pursuing.'}
  };
  Object.assign(DATA.ETYPES,NEW_ENEMIES);

  const EXTRA_BOSSES=[
    ['THE NEON HUNTER',302,'tri','teleport',1.08],['THE ACID BLOOM',102,'ring','clouds',1.25],['THE MAGNETIC CROWN',312,'hex','pull',1.22],['THE QUANTUM DRIFTER',255,'diamond','teleport',1.0],
    ['THE TUNGSTEN THRONE',38,'square','rings',1.65],['THE PRISMATIC SERAPH',285,'hex','burst',1.12],['THE CRYO ARCHON',192,'ring','clouds',1.18],['THE RADIUM COLOSSUS',82,'square','omega',1.5],
    ['THE SILICA SOVEREIGN',168,'diamond','summon',1.34],['THE VOID ALCHEMIST',262,'ring','pull',1.46],['THE COBALT ECLIPSE',218,'hex','cross',1.28],['THE SULFUR CROWN',64,'tri','clouds',1.20]
  ].map((x,i)=>({name:x[0],hue:x[1],shape:x[2],pat:x[3],hpMul:x[4],fast:i%3===0,charge:i%4===0}));
  if(Array.isArray(DATA.BOSSDEFS)) DATA.BOSSDEFS.push(...EXTRA_BOSSES);

  const NEW_RELICS=[
    {id:'gravity_anchor',ic:'◈',n:'Gravity Anchor',d:'+20% knockback and 12% slow potency.'},
    {id:'phase_prism',ic:'◇',n:'Phase Prism',d:'Every 9th projectile phases through enemies and deals +70% damage.'},
    {id:'volatile_cell',ic:'✹',n:'Volatile Cell',d:'Every 7th kill causes a delayed local explosion.'},
    {id:'cryogenic_loop',ic:'❄',n:'Cryogenic Loop',d:'Critical hits have a chance to freeze nearby enemies.'},
    {id:'toxic_reservoir',ic:'☠',n:'Toxic Reservoir',d:'Poison effects spread to a nearby enemy on expiry.'},
    {id:'echo_chamber',ic:'≋',n:'Echo Chamber',d:'Every 11th projectile repeats from your last position.'},
    {id:'star_map',ic:'✦',n:'Star Map',d:'+18% movement speed while at full shield.'},
    {id:'salvage_drone',ic:'⌬',n:'Salvage Drone',d:'Periodic micro-drone collects nearby pickups.'},
    {id:'reactor_bloom',ic:'✤',n:'Reactor Bloom',d:'Level-ups heal all operators and grant temporary shield.'},
    {id:'glass_heart',ic:'◇',n:'Glass Heart',d:'+35% damage and +20% crit, but -15% maximum HP.'},
    {id:'twin_core',ic:'✣',n:'Twin Core',d:'+1 projectile every other wave.'},
    {id:'null_compass',ic:'⌖',n:'Null Compass',d:'Enemy telegraphs last longer and reveal hidden threats.'},
    {id:'phase_battery',ic:'▯',n:'Phase Battery',d:'Dashes leave a damaging afterimage.'},
    {id:'corona_ring',ic:'◎',n:'Corona Ring',d:'At full shield, emit a passive elemental ring every 4 seconds.'},
    {id:'iron_oath',ic:'⬢',n:'Iron Oath',d:'Below 40% HP, gain 25% damage resistance.'},
    {id:'neutron_seed',ic:'✺',n:'Neutron Seed',d:'Kills have a chance to create a powerful catalyst pickup.'},
    {id:'alchemy_dice',ic:'⚗',n:'Alchemy Dice',d:'Pickup drops gain varied bonuses instead of a fixed value.'},
    {id:'signal_lens',ic:'⌁',n:'Signal Lens',d:'Equipped abilities briefly reveal enemy weak points.'}
  ];
  DATA.RELICS.push(...NEW_RELICS.filter(r=>!DATA.RELICS.some(x=>x.id===r.id)));

  /* ---------- cards: 240 genuinely different choices ---------- */
  const cardFamilies=[
    ['fire', 'Thermal', ['shots ignite targets','burning targets erupt when killed','heated shots gain speed']],
    ['ice', 'Cryo', ['shots chill targets','frozen enemies fracture','critical hits emit frost']],
    ['arc', 'Voltage', ['shots arc to a second target','shocked targets take amplified damage','electric hits briefly stun']],
    ['void', 'Void', ['shots create tiny gravity dents','marked enemies lose armor','final hit opens a micro-rift']],
    ['toxin', 'Toxin', ['shots corrode shields','poisoned targets spread toxin','corroded targets slow']],
    ['prism', 'Prism', ['shots split into angled shards','shards gain pierce','critical shots emit a rainbow fan']],
    ['orbit', 'Orbit', ['shots leave orbiting motes','motes intercept enemies','motes return to you as healing sparks']],
    ['quake', 'Seismic', ['hits push enemies back','impact zones linger','heavy hits stun elites']],
    ['echo', 'Echo', ['every tenth shot repeats','repeated shots deal reduced damage','echoes inherit status effects']],
    ['phase', 'Phase', ['shots pass through one target','phased shots accelerate','phased kills release a pulse']],
    ['bloom', 'Bloom', ['kills release a seed','seeds grow into damage fields','fields heal nearby operators']],
    ['magnet', 'Magnetic', ['shots curve toward targets','kills pull pickups inward','nearby elites lose movement speed']]
  ];
  const NEW_CARD_RAR=['uncommon','rare','rare','epic','epic','legendary','mythic'];
  const newCards=[];
  for(let i=0;i<240;i++){
    const f=cardFamilies[i%cardFamilies.length], tier=NEW_CARD_RAR[i%NEW_CARD_RAR.length];
    const effect=(i%3===0?'primary':i%3===1?'secondary':'tertiary');
    let d=f[2][i%3];
    const n=`${f[1]} ${effect==='primary'?'Core':effect==='secondary'?'Circuit':'Catalyst'} ${String(i+1).padStart(3,'0')}`;
    newCards.push({id:`mega_${String(i+1).padStart(3,'0')}`,ic:['✦','✧','ϟ','◇'][i%4],n,d:`${d}. ${effect==='primary'?'+4% damage to this effect.':effect==='secondary'?'+6% effect duration.':'+7% effect strength.'}`,max:3,rarity:tier,extraStat:['dmg','rate','aoe','crit','homing','pierce'][i%6],extraValue:[.035,.03,.18,.012,.015,.15][i%6],unique:true,megaType:f[0],megaIndex:i});
  }
  if(window.ALL_CARDS) window.ALL_CARDS.push(...newCards);

  /* ---------- extra pickups ---------- */
  const PICKUPS={
    catalyst:{ic:'✹',name:'Catalyst',desc:'Instantly resets 35% of active cooldown and grants +20% damage for 5s.',hue:45},
    rewind:{ic:'↶',name:'Rewind Cell',desc:'Restores 18% missing HP and rewinds nearby enemy projectiles.',hue:185},
    stasis:{ic:'❄',name:'Stasis Crystal',desc:'Freezes nearby enemies for 1.4 seconds.',hue:198},
    nova:{ic:'✺',name:'Nova Seed',desc:'Triggers a delayed radial blast around the collector.',hue:320},
    dupe:{ic:'⧉',name:'Duplication Shard',desc:'Duplicates the next standard pickup collected by the team.',hue:290},
    overclock2:{ic:'⚡',name:'Overclock Cell',desc:'Temporarily doubles fire rate and projectile speed.',hue:55},
    repair:{ic:'✚',name:'Repair Swarm',desc:'Heals all local co-op operators and adds shield.',hue:120},
    voidkey:{ic:'⌑',name:'Void Key',desc:'Damages all non-boss enemies on the field and removes one elite.',hue:260}
  };

  function rng(){return Math.random();}
  function run(){return window.RUN||null;}
  function curEl(){const r=run();return r&&r.el||DATA.EL(SAVE.sel);}
  function selectedChoice(el){const slot=SAVE.getSignature?SAVE.getSignature(el.id):0;return (el.choices||el.signatures||[])[slot]||el.act||{};}
  function equip(id){
    id=DATA.canonicalId(id); const e=DATA.EL(id); if(!e) return false;
    if(!DATA.isOwned(id) && !e.mol) return false;
    if(SAVE.equipElement) SAVE.equipElement(id); else {SAVE.sel=id;SAVE.save();}
    if(NET&&NET.setMyElement) NET.setMyElement(id);
    if(window.UI&&UI.refreshShowcase){};
    refreshVault(); renderMastery(); updateHudAbility();
    return true;
  }
  function refreshVault(){
    $$('#ptable .pt[data-id]').forEach(t=>{
      const e=DATA.EL(t.dataset.id); if(!e)return;
      const c=hue(e); t.style.setProperty('--eh',c);
      const own=DATA.isOwned(e.id), affordable=!own&&!e.mol&&SAVE.coins>=e.cost;
      t.classList.toggle('locked',!own); t.classList.toggle('affordable',affordable); t.classList.toggle('owned-glow',own&&SAVE.sel===e.id); t.classList.toggle('sel',SAVE.sel===e.id);
      t.title=own?`${e.name} · OWNED${SAVE.sel===e.id?' · EQUIPPED':''}`:affordable?`${e.name} · BUYABLE · ◈ ${e.cost}`:`${e.name} · LOCKED · ◈ ${e.cost}`;
    });
  }
  let masteryViewId=null;
  function renderMastery(forcedId){
    const scr=$('#scr-mastery'); if(!scr||scr.classList.contains('hidden'))return;
    const m=document.getElementById('m-elems'), detail=document.getElementById('m-detail'); if(!m||!detail)return;
    const equippedId=DATA.canonicalId ? DATA.canonicalId(SAVE.sel) : SAVE.sel;
    if(forcedId)masteryViewId=DATA.canonicalId ? DATA.canonicalId(forcedId) : forcedId;
    if(!masteryViewId||!DATA.ELEMS[masteryViewId]||!DATA.isOwned(masteryViewId))masteryViewId=equippedId;
    const el=DATA.EL(masteryViewId); if(!el)return;
    const slot=Math.max(0,Math.min(2,Number(SAVE.getSignature?SAVE.getSignature(el.id):0))), choice=selectedChoice(el), col=hue(el), mx=SAVE.mxp(el.id);
    m.querySelectorAll('.mchip').forEach(x=>x.classList.toggle('sel',x.dataset.id===el.id));
    const head=$('#m-head');
    head.innerHTML=`<div><div style="font-family:var(--disp);font-size:24px;color:hsl(${col} 90% 72%)">${el.name.toUpperCase()}</div><div class="sub">◆ ${mx.xp} mastery XP · ${equippedId===el.id?'EQUIPPED ELEMENT':'MASTERY VIEW'} · equipped ability is loaded from this element's saved loadout</div>
      <div class="equipped-box" style="--eh:${col}"><b>⚡ EQUIPPED ABILITY ${slot+1}: ${choice.name||choice.n||'ABILITY'}</b><div class="sub" style="margin-top:4px">${choice.desc||'No description available.'}</div></div></div>`;
    const tree=$('#m-tree'); if(!tree)return;
    [...tree.querySelectorAll('.node')].forEach(n=>n.remove());
    DATA.MNODES.forEach((t,i)=>{
      const r=SAVE.nodeRank(el.id,t.key),max=r>=t.max,c=DATA.mxCost(i,r),n=document.createElement('div');n.className='node'+(max?' max':'');
      n.innerHTML=`<b>${t.ic} ${el.name} ${t.t}</b><small>+${t.per}/rank ${t.d}</small><div class="row"><div class="pips">${Array.from({length:t.max},(_,p)=>`<i class="${p<r?'on':''}"></i>`).join('')}</div><button class="btn chamf" ${max||mx.xp<c?'disabled':''}>${max?'MAX':'◆ '+c}</button></div>`;
      n.querySelector('button').onclick=()=>{if(SAVE.buyNode(el.id,i)){toast('MASTERY NODE UNLOCKED','good');renderMastery(el.id);}else SFX.error();}; tree.appendChild(n);
    });
    const all=SAVE.raw.abilityMastery||(SAVE.raw.abilityMastery={}),ranks=all[el.id]||(all[el.id]={}),rank=Number(ranks[slot]||0),max=5,cost=90+rank*70;
    const ac=document.createElement('div');ac.id='ability-mastery';ac.className='node';ac.style.setProperty('--eh',col);
    ac.innerHTML=`<b>✦ EQUIPPED ABILITY ${slot+1}: ${choice.name||choice.n}</b><small>${choice.desc||''}</small><small>Upgrade path is unique to ${el.name} Ability ${slot+1}; switching your equipped element or ability changes this card.</small><div class="row"><div class="pips">${Array.from({length:max},(_,p)=>`<i class="${p<rank?'on':''}"></i>`).join('')}</div><button class="btn chamf" ${rank>=max||mx.xp<cost?'disabled':''}>${rank>=max?'MAX':'◆ '+cost}</button></div>`;
    ac.querySelector('button').onclick=()=>{if(rank>=max||mx.xp<cost)return;mx.xp-=cost;ranks[slot]=rank+1;all[el.id]=ranks;SAVE.save();renderMastery(el.id);}; tree.prepend(ac);
    let codex=document.getElementById('mega-codex'); if(!codex){codex=document.createElement('div');codex.id='mega-codex';detail.appendChild(codex);}
    codex.innerHTML=`<b style="color:hsl(${col} 90% 72%);letter-spacing:.12em">ABILITY LOADOUT · ${el.name.toUpperCase()}</b><div style="display:grid;gap:6px;margin-top:7px">${[0,1,2].map(i=>{const c=(el.choices||el.signatures||[])[i]||{},owned=i===0||SAVE.abilOwned(el.id,i);return `<div class="panel2" style="border-left:3px solid hsl(${col} 80% ${owned?'62':'35'}%)"><b>${i+1}. ${c.name||'SIGNATURE '+(i+1)}</b><div class="sub">${c.desc||''}</div><span class="tag">${i===slot?'EQUIPPED':owned?'OWNED':'LOCKED'}</span></div>`}).join('')}</div>`;
  }
  function updateHudAbility(){
    let box=document.getElementById('mega-hud-ability'); if(!box){box=document.createElement('div');box.id='mega-hud-ability';document.body.appendChild(box);}
    const r=run();
    if(!r||!['play','inter'].includes(r.state)||document.getElementById('scr-game')?.classList.contains('hidden')){box.style.display='none';return;}
    const p=r.players?.[r.localNetId||0]||r.players?.[0], el=p?.elem||r.el, slot=Number(p?.signatureSlot??SAVE.getSignature?.(el.id)??0), c=selectedChoice(el); box.style.display='block';
    box.innerHTML=`<div style="font-size:8px;color:var(--tx3);letter-spacing:.16em">${weaponNames[((r.wave||1)-1)%weaponNames.length]||'ATTACK PROTOCOL'}</div><div class="nm" style="color:hsl(${hue(el)} 90% 74%)">ABILITY ${slot+1} · ${c.name||c.n||'SIGNATURE'}</div><div class="ds">${c.desc||''}</div>`;
  }

  /* Patch UI.show so every relevant screen reselects current equipment. */
  if(window.UI&&UI.show&&!UI.__megaShow){
    const base=UI.show; UI.show=function(id){
      const out=base.apply(this,arguments);
      if(id==='scr-vault'){setTimeout(refreshVault,20);}
      if(id==='scr-mastery'){masteryViewId=DATA.canonicalId?DATA.canonicalId(SAVE.sel):SAVE.sel;setTimeout(()=>renderMastery(masteryViewId),20);}
      if(id==='scr-menu'){setTimeout(renderUpdatePanel,20);}
      setTimeout(updateHudAbility,20); return out;
    }; UI.__megaShow=true;
  }
  document.addEventListener('click',e=>{
    const chip=e.target.closest('#m-elems .mchip'); if(chip&&chip.dataset.id){masteryViewId=chip.dataset.id;setTimeout(()=>renderMastery(masteryViewId),25);}
    const tile=e.target.closest('#ptable .pt[data-id]'); if(tile){setTimeout(refreshVault,20);}
    const buy=e.target.closest('#vd-btn'); if(buy){setTimeout(()=>{const id=(window.SAVE.sel);refreshVault();renderMastery();updateHudAbility();},30);}
  },true);

  /* Equip on purchase even when older handler is used. */
  const oldUnlock=SAVE.unlockElement; if(!SAVE.__megaUnlock){
    SAVE.unlockElement=function(id,cost){const ok=oldUnlock.call(this,id,cost);if(ok){const k=DATA.canonicalId(id);if(this.equipElement)this.equipElement(k);else{this.sel=k;this.save();}setTimeout(()=>{if(NET&&NET.setMyElement)NET.setMyElement(k);refreshVault();renderMastery();updateHudAbility();},0);}return ok;}; SAVE.__megaUnlock=true;
  }
  const oldSetSig=SAVE.setSignature; if(!SAVE.__megaSig){
    SAVE.setSignature=function(id,slot){const r=oldSetSig.call(this,id,slot);if(this.sel===DATA.canonicalId(id))setTimeout(updateHudAbility,0);return r;}; SAVE.__megaSig=true;
  }

  /* Mastery chips: dataset ids for exact reselection. */
  setInterval(()=>{$$('#m-elems .mchip').forEach(ch=>{if(!ch.dataset.id){const sym=ch.querySelector('span')?.textContent.trim();const el=Object.values(DATA.ELEMS).find(x=>x.sym===sym);if(el)ch.dataset.id=el.id;}})},500);

  /* ---------- main update panel / changelog ---------- */
  function renderUpdatePanel(){
    const host=$('#menuright')||$('#scr-menu'); if(!host||document.getElementById('mega-update-panel'))return;
    const d=document.createElement('div');d.id='mega-update-panel';
    d.innerHTML=`<div style="display:flex;justify-content:space-between;align-items:center"><b style="font-family:var(--disp);font-size:16px;color:var(--cy);letter-spacing:.12em">UPDATE 7.5 · STABILITY &amp; CO-OP INTEGRITY PASS</b><span class="tag">LIVE BUILD</span></div>
      <div class="urow"><div class="uver">7.5 · CRITICAL FIX</div><div class="utxt">Found and fixed a root-cause bug where the game's actual "start run" entry point was permanently bound to an old, pre-patch version of the start function. This silently prevented several already-written fixes from ever running in a real game session: P2 was always given P1's element/ability instead of their own saved selection, equipped relics never actually applied to the run, and ally state wasn't cleared between runs. All three now work correctly because the underlying cause is fixed, not just the symptom.</div></div>
      <div class="urow"><div class="uver">7.5 · ABILITY NAMES</div><div class="utxt">Removed a leftover block that was overwriting every element's Ability 2 and Ability 3 display names with one of only 11 shared category names (so many unrelated elements showed the exact same move name). Each element now keeps the name that was already being generated uniquely for it, so displayed names no longer collide across elements.</div></div>
      <div class="urow"><div class="uver">7.5 · CO-OP</div><div class="utxt">Player 2's on-map icon and label now correctly reflect Player 2's own selected element instead of mirroring Player 1's.</div></div>
      <div class="urow"><div class="uver">VAULT</div><div class="utxt">Restored category/element colors, clearer owned / buyable / locked states, and automatic equip + UI reselection.</div></div>
      <div class="urow"><div class="uver">MASTERY</div><div class="utxt">Opening the screen follows your equipped element and explicitly shows the equipped ability, its description, and its individual upgrade path.</div></div>
      <div class="urow"><div class="uver">CO-OP</div><div class="utxt">Offline tab rooms use BroadcastChannel room codes first, so two tabs opened from the same local file can join the same room; hosted builds may additionally use PeerJS. Player element + signature loadouts stay per-player while run rewards remain shared where appropriate.</div></div>
      <div class="urow"><div class="uver">COMBAT</div><div class="utxt">New attack protocols, pickup effects, boss patterns, status interactions, audiovisual reactions, 20 new enemy archetypes, and 12 more bosses.</div></div>
      <div class="urow"><div class="uver">CONTENT</div><div class="utxt">+240 unique cards, 18 relics, expanded enemy codex, more augment/research hooks, extra pickup families, and a larger live-run HUD.</div></div>
      <div id="mega-content-counter">BUILD COUNTS: 118 ELEMENTS · ${Object.keys(DATA.MOLDEF||{}).filter(k=>DATA.MOLDEF[k]?.mol).length} COMPOUNDS · ${window.ALL_CARDS?.length||0} CARDS · ${Object.keys(DATA.ETYPES||{}).length} ENEMY ARCHETYPES · ${DATA.BOSSDEFS?.length||0} BOSSES</div>`;
    host.appendChild(d);
  }

  function addContentCodex(){
    const arch=document.getElementById('scr-arch');if(!arch||document.getElementById('mega-content-codex'))return;
    const d=document.createElement('div');d.id='mega-content-codex';d.className='panel';d.style.cssText='padding:14px;margin-top:16px';
    d.innerHTML=`<h3 style="color:var(--cy);letter-spacing:.14em">EXPANSION CODEX</h3><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:8px;margin-top:10px">${Object.entries(NEW_ENEMIES).map(([k,v])=>`<div class="panel2"><b>${k.toUpperCase()}</b><div class="sub">${v.desc}</div><span class="tag">SPECIAL · ${v.special||'CHASE'}</span></div>`).join('')}</div>`;
    arch.appendChild(d);
  }
  if(window.UI&&UI.show&&!UI.__megaCodex){const base=UI.show;UI.show=function(id){const r=base.apply(this,arguments);if(id==='scr-arch')setTimeout(addContentCodex,20);return r;};UI.__megaCodex=true;}

  /* ---------- offline multiplayer — room codes work file:// without a server ---------- */
  if(NET && !NET.__offlineUpgrade){
    NET.__offlineUpgrade=true;
    const fileMode=location.protocol==='file:' || navigator.onLine===false;
    if(fileMode){
      const badge=$('#net-status'); if(badge)badge.textContent='OFFLINE TAB P2P · BROADCAST ROOMS';
      const oldCreate=NET.createLobby, oldJoin=NET.joinLobby;
      NET.createLobby=function(){const r=oldCreate.apply(this,arguments);toast('OFFLINE ROOM READY · OPEN THE SAME FILE IN ANOTHER TAB','gold');return r;};
      NET.joinLobby=function(code,cb){const r=oldJoin.call(this,code,()=>{toast('OFFLINE TAB CONNECTED','good');if(cb)cb();});return r;};
    }
  }

  /* ---------- music rotation ---------- */
  if(AUDIO&&AUDIO.setTrack&&!AUDIO.__megaMusic){
    const raw=AUDIO.setTrack, bosses=Array.from({length:12},(_,i)=>'boss_'+(i+1)), combats=Array.from({length:6},(_,i)=>'combat_'+(i+1));
    AUDIO.setTrack=function(t){
      if(t==='boss')t=bosses[Math.floor(Math.random()*bosses.length)];
      else if(t==='combat')t=combats[Math.floor(Math.random()*combats.length)];
      return raw.call(this,t);
    }; AUDIO.__megaMusic=true;
    setInterval(()=>{const r=run();if(!r||!['play','inter'].includes(r.state))return;if(r.boss) AUDIO.setTrack('boss'); else if(r.wave>0&&r.wave%2===0) AUDIO.setTrack('combat');},30000);
  }

  /* ---------- deep augmentation expansion ---------- */
  const DEEP_AUGS=[
    ['dmg','Proton Foundry','+3% damage per rank',6,70],['rate','Pulse Governor','+3% fire rate per rank',6,70],['hp','Graphene Skeleton','+8 max HP per rank',8,60],['spd','Vector Drive','+2% speed per rank',6,65],
    ['crit','Facet Array','+2% crit per rank',6,75],['shield','Capacitor Lattice','+5 shield per rank',6,80],['mag','Salvage Magnetics','+6% pickup range per rank',6,60],['luck','Catalyst Ledger','+5% coin gain per rank',6,85],
    ['pierce','Bore Engine','+1 pierce every 2 ranks',6,95],['aoe','Reaction Aperture','+1 AoE every 2 ranks',6,95],['head','Starter Archive','+1 starting card every 2 ranks',4,140],['revive','Phoenix Cell','+1 revive per rank',3,220],
    ['dmg','Hadron Furnace','+4% damage per rank',5,110],['rate','Muon Clock','+4% rate per rank',5,110],['hp','Ceramic Reserve','+12 HP per rank',5,100],['spd','Ion Boots','+3% speed per rank',5,100],
    ['crit','Diamond Aperture','+2.5% crit per rank',5,120],['shield','Field Reservoir','+8 shield per rank',5,115],['mag','Orbit Harvester','+8% pickup range per rank',5,90],['luck','Quantum Salvage','+7% coin gain per rank',5,120],
    ['pierce','Tunneling Core','+1 pierce per 3 ranks',6,130],['aoe','Nova Chamber','+1 reaction area per 2 ranks',6,125],['dmg','Antimatter Lining','+5% damage per rank',4,150],['rate','Flux Relay','+5% rate per rank',4,150],
    ['hp','Titanium Heart','+16 HP per rank',4,145],['spd','Phase Treads','+4% speed per rank',4,140],['crit','Spectrum Scanner','+3% crit per rank',4,145],['shield','Aegis Reservoir','+10 shield per rank',4,150],
    ['mag','Ferrofield II','+10% pickup range per rank',4,135],['luck','Golden Protocol','+10% coin gain per rank',4,160]
  ];
  function addDeepAugments(){
    const grid=document.getElementById('aug-grid'); if(!grid||document.getElementById('mega-deep-augs'))return;
    const wrap=document.createElement('div');wrap.id='mega-deep-augs';wrap.style.cssText='display:contents';
    DEEP_AUGS.forEach((a,i)=>{
      const id='megaAug'+i,lv=Number(SAVE.raw.meta[id]||0),max=a[3],cost=Math.round(a[4]*Math.pow(lv+1,1.45)/10)*10;
      const d=document.createElement('div');d.className='augcard panel';
      d.innerHTML=`<h4>${a[1]}</h4><p>${a[2]}</p><div class="pips2">${Array.from({length:max},(_,x)=>`<i class="${x<lv?'on':''}"></i>`).join('')}</div><div class="augfoot"><span class="cost">${lv>=max?'MAXED':'◈ '+cost}</span><button class="btn chamf" ${lv>=max||SAVE.coins<cost?'disabled':''}>${lv>=max?'MAX':'BUY'}</button></div>`;
      d.querySelector('button').onclick=()=>{if(lv>=max||!SAVE.spend(cost))return;SAVE.raw.meta[id]=lv+1;SAVE.save();addDeepAugments();toast(a[1]+' → LV '+(lv+1),'good');};wrap.appendChild(d);
    });grid.appendChild(wrap);
  }
  const oldShowAug=window.UI&&UI.show?UI.show:null;
  if(oldShowAug&&!UI.__megaAug){ const base=UI.show; UI.show=function(id){const r=base.apply(this,arguments);if(id==='scr-aug')setTimeout(addDeepAugments,20);return r;};UI.__megaAug=true; }

  /* ---------- background depth ---------- */
  let bgOrbit=document.getElementById('mega-bg-orbit'); if(!bgOrbit){bgOrbit=document.createElement('div');bgOrbit.id='mega-bg-orbit';document.body.appendChild(bgOrbit);for(let i=0;i<44;i++){const s=document.createElement('i');s.className='mega-particle';s.style.left=(Math.random()*100)+'%';s.style.top=(Math.random()*100)+'%';s.style.animationDuration=(5+Math.random()*11)+'s';s.style.animationDelay=(-Math.random()*11)+'s';bgOrbit.appendChild(s);}}

  /* ---------- new pickup spawning / processing ---------- */
  let pickupTimer=0, lastWave=0, dupeNext=0, weaponMode=0, shotSeen=0;
  const weaponNames=['PRISM BURST','PHASE NEEDLE','ARC WEAVE','GRAVITY DRILL','TOXIC BLOOM','CRYO SHARD','ECHO CASCADE','MAGNET FAN','SEISMIC SPIKE','NOVA LANCE','VOID RIPPLE','ORBITAL CUTTER'];
  function spawnMegaPickup(r){
    if(!r||r.pickups.length>28)return;
    const keys=Object.keys(PICKUPS), type=keys[Math.floor(rng()*keys.length)];
    r.pickups.push({t:'mega',megaType:type,x:40+rng()*(window.innerWidth-80),y:70+rng()*(window.innerHeight-140),vx:rng(-20,20),vy:rng(-20,20),life:999,powerupId:type,v:0});
  }
  function collectMega(r,p,k,i){
    const type=PICKUPS[k.megaType]; if(!type)return;
    const msg=type.name.toUpperCase();
    if(k.megaType==='catalyst'){p.activeCd=Math.max(0,p.activeCd*0.65);p.puDamage=Math.max(p.puDamage||1,1.2);p.puTimer=Math.max(p.puTimer||0,5);}
    else if(k.megaType==='rewind'){const miss=Math.max(0,ST.hp-p.hp);p.hp=Math.min(ST.hp,p.hp+miss*.18);r.ebullets=[];}
    else if(k.megaType==='stasis'){r.enemies.forEach(e=>{if(!e.dead&&Math.hypot(e.x-p.x,e.y-p.y)<170){e.freeze=Math.max(e.freeze||0,.8);e.slowT=Math.max(e.slowT||0,2);}});}
    else if(k.megaType==='nova'){r.wells.push({x:p.x,y:p.y,t:1.2,lv:4});}
    else if(k.megaType==='dupe'){dupeNext=1;}
    else if(k.megaType==='overclock2'){p.puRate=2;p.puSpeed=1.35;p.puTimer=Math.max(p.puTimer||0,7);}
    else if(k.megaType==='repair'){r.players.forEach(q=>{q.hp=Math.min(ST.hp,q.hp+18);q.sh=Math.min(ST.shieldMax,q.sh+15);});}
    else if(k.megaType==='voidkey'){r.enemies.filter(e=>!e.dead&&!e.boss).forEach(e=>dmgEnemy(e,ST.dmg*1.4));}
    if(window.SFX&&SFX.unlock)SFX.unlock(); if(window.UI&&UI.toast)UI.toast('PICKUP · '+msg,'good');
    if(dupeNext&&k.megaType!=='dupe'){dupeNext=0;r.pickups.push({t:'coin',v:Math.max(1,k.v||2),x:p.x+8,y:p.y+8,vx:0,vy:0,life:8});}
    r.parts.push({ring:true,x:p.x,y:p.y,r0:8,grow:70,t:.45,life:.45,hue:type.hue});
    r.pickups.splice(i,1);
  }
  function tickMegaEnemies(r){
    if(!r||r.state!=='play')return;
    r.enemies.forEach(e=>{
      if(e.dead||!e.special)return;
      const now=r.t, cd=e._megaCd||0;
      if(cd>now)return;
      const targets=r.players.filter(p=>!p.downed); if(!targets.length)return;
      const p=targets[Math.floor(Math.random()*targets.length)];
      const dist=Math.hypot(p.x-e.x,p.y-e.y);
      e._megaCd=now+(e.special==='pulse'?3.4:e.special==='arc'?4.0:e.special==='freeze'?4.8:e.special==='corrode'?4.5:e.special==='pull'?5.5:e.special==='crystal'?5.2:e.special==='blink'?4.1:e.special==='void'?5.8:e.special==='embers'?3.7:e.special==='echo'?4.2:e.special==='storm'?5.0:e.special==='lance'?4.0:e.special==='invert'?5.5:e.special==='charge'?4.6:4.5);
      if(e.special==='pulse'){r.parts.push({ring:true,x:e.x,y:e.y,r0:8,grow:95,t:.5,life:.5,hue:e.hue});targets.forEach(q=>{if(Math.hypot(q.x-e.x,q.y-e.y)<120&&!q.iframes){q.hp=Math.max(0,q.hp-e.dmg*.55);q.iframes=Math.max(q.iframes||0,.25);}});}
      else if(e.special==='freeze'){targets.forEach(q=>{if(Math.hypot(q.x-e.x,q.y-e.y)<150){q.hp=Math.max(0,q.hp-e.dmg*.35);q.iframes=Math.max(q.iframes||0,.25);}});r.eclouds.push({x:e.x,y:e.y,r:115,t:1.4,friendly:false});}
      else if(e.special==='corrode'){if(dist<230&&!p.iframes){p.sh=Math.max(0,p.sh-e.dmg*1.2);p.hp=Math.max(0,p.hp-e.dmg*.25);}r.eclouds.push({x:p.x,y:p.y,r:65,t:1.4,friendly:false});}
      else if(e.special==='pull'){r.pullT=1.3;r.pullSrc={x:e.x,y:e.y};r.parts.push({ring:true,x:e.x,y:e.y,r0:10,grow:130,t:1.2,life:1.2,hue:e.hue});}
      else if(e.special==='blink'){e.x=Math.max(30,Math.min(innerWidth-30,p.x+(Math.random()-.5)*240));e.y=Math.max(65,Math.min(innerHeight-30,p.y+(Math.random()-.5)*240));r.parts.push({ring:true,x:e.x,y:e.y,r0:4,grow:45,t:.3,life:.3,hue:e.hue});}
      else if(e.special==='void'){r.eclouds.push({x:p.x,y:p.y,r:95,t:1.8,friendly:false});}
      else if(e.special==='embers'){r.wells.push({x:p.x,y:p.y,t:1.0,lv:2});}
      else if(e.special==='echo'){for(let i=-1;i<=1;i++){const a=Math.atan2(p.y-e.y,p.x-e.x)+i*.18;r.ebullets.push({x:e.x,y:e.y,vx:Math.cos(a)*270,vy:Math.sin(a)*270,r:5,dmg:e.dmg,life:4});}}
      else if(e.special==='arc'){for(let i=-1;i<=1;i++){const a=Math.atan2(p.y-e.y,p.x-e.x)+i*.28;r.ebullets.push({x:e.x,y:e.y,vx:Math.cos(a)*250,vy:Math.sin(a)*250,r:4,dmg:e.dmg*.75,life:4});}}
      else if(e.special==='lance'){const a=Math.atan2(p.y-e.y,p.x-e.x);r.ebullets.push({x:e.x,y:e.y,vx:Math.cos(a)*380,vy:Math.sin(a)*380,r:6,dmg:e.dmg*1.35,life:3});}
      else if(e.special==='storm'){r.parts.push({ring:true,x:p.x,y:p.y,r0:4,grow:70,t:.65,life:.65,hue:e.hue});setTimeout(()=>{const rr=run();if(rr){const q=rr.players.find(x=>x.id===p.id);if(q&&!q.iframes){q.hp=Math.max(0,q.hp-e.dmg*1.15);q.iframes=.4;}}},650);}
      else if(e.special==='crystal'){for(let i=0;i<2;i++){if(r.enemies.length<150){const ids=['shardling','frostshard','crystalwarden'];const t=ids[Math.floor(Math.random()*ids.length)],b=DATA.ETYPES[t];r.enemies.push({id:(r.nextEid++),type:t,x:e.x+(-18+i*36),y:e.y+15,hp:b.hp*.6,maxhp:b.hp*.6,hue:b.hue,r:b.r*.75,shape:b.shape,dmg:b.dmg*.8,coin:1,xp:1,seed:Math.random()*10,dead:false,elite:false});}}}
      else if(e.special==='invert'){p.angle+=Math.PI; r.parts.push({ring:true,x:p.x,y:p.y,r0:4,grow:55,t:.4,life:.4,hue:e.hue});}
      else if(e.special==='charge'){e.x=Math.max(30,Math.min(innerWidth-30,p.x+(Math.random()-.5)*40));e.y=Math.max(65,Math.min(innerHeight-30,p.y+(Math.random()-.5)*40));}
    });
  }

  function tickMega(){
    const r=run();if(!r)return;
    if(r.state==='play'){
      tickMegaEnemies(r);
      pickupTimer-=.25;
      if(pickupTimer<=0){pickupTimer=10+Math.random()*7;if(r.wave>2)spawnMegaPickup(r);}
      r.pickups.slice().forEach((k,i)=>{if(k.t!=='mega')return;for(const p of r.players){if(p.downed)continue;if(Math.hypot(p.x-k.x,p.y-k.y)<24){collectMega(r,p,k,i);break;}}});
      const w=Math.floor(r.wave||0);if(w&&w!==lastWave){lastWave=w;weaponMode=(w-1)%weaponNames.length;}
      // Cosmetic/behavioral attack effects are appended to newly-created bullets without replacing element abilities.
      const elNum=r.el?.n||1; r.bullets.forEach(b=>{if(b.__megaSeen)return;b.__megaSeen=1;b.megaType=weaponMode;b.megaAge=0;shotSeen++});
      r.bullets.forEach(b=>{b.megaAge=(b.megaAge||0)+.25; if(b.megaType===1&&b.megaAge>.45){b.vx*=1.01;b.vy*=1.01;} if(b.megaType===2&&Math.random()<.018){b.vx=-b.vx;b.vy=-b.vy;} if(b.megaType===8&&b.megaAge<.35)b.r=Math.max(b.r,5);});
      r.players.forEach(p=>{if(p.iframes>0&&r.relics?.includes('phase_battery')&&Math.random()<.04)r.parts.push({ring:true,x:p.x,y:p.y,r0:5,grow:34,t:.2,life:.2,hue:r.hue});});
    }
    updateHudAbility();
  }
  setInterval(tickMega,250);

  /* ---------- live stat drawer only while actively in a round ---------- */
  const stats=document.createElement('div');stats.id='mega-stats';stats.innerHTML='<h4>LIVE REACTOR STATS</h4><div class="sg"></div>';document.body.appendChild(stats);
  function statsUpdate(){
    const r=run(), visible=!!(r&&['play','inter'].includes(r.state)&&!$('#scr-game')?.classList.contains('hidden'));
    document.body.classList.toggle('mega-in-round',visible);
    stats.classList.toggle('on',visible&&stats.classList.contains('force'));
    if(!visible){stats.classList.remove('force');const legacy=document.getElementById('iso-stats-panel');if(legacy)legacy.classList.remove('on');}
    if(!r||!window.ST)return;
    const s=window.ST, rows=[['DMG',s.dmg],['RATE',s.rate],['HP',s.hp],['SHIELD',s.shieldMax],['ARMOR',(s.armor*100).toFixed(1)+'%'],['CRIT',(s.crit)+'%'],['PIERCE',s.pierce],['PROJECTILES',s.projs],['AOE',s.aoeLv],['CHAIN',s.chainLv],['POISON',s.poisonLv],['BURN',s.burnLv],['SLOW',s.slowLv],['DASH CD',s.dashCd],['ACTIVE CD',s.activeCd],['COIN ×',s.coinMult.toFixed(2)]];
    stats.querySelector('.sg').innerHTML=rows.map(x=>`<span>${x[0]}<b>${typeof x[1]==='number'?x[1].toFixed(Math.abs(x[1])<10?2:0):x[1]}</b></span>`).join('');
  }
  document.addEventListener('keydown',e=>{
    if(e.key.toLowerCase()!=='h'||e.ctrlKey||e.altKey||e.metaKey)return;
    const tag=(e.target?.tagName||'').toLowerCase();if(tag==='input'||tag==='textarea'||tag==='select')return;
    const r=run();if(!r||!['play','inter'].includes(r.state)||$('#scr-game')?.classList.contains('hidden'))return;
    stats.classList.toggle('force');statsUpdate();e.preventDefault();
  },true);
  setInterval(statsUpdate,250);

  /* ---------- render custom pickup icons using an overlay canvas ---------- */
  const fx=document.createElement('canvas');fx.id='mega-fx';fx.style.cssText='position:fixed;inset:0;z-index:41;pointer-events:none';document.body.appendChild(fx);const fxc=fx.getContext('2d');
  function drawFx(){
    fx.width=innerWidth;fx.height=innerHeight;fxc.clearRect(0,0,fx.width,fx.height);const r=run();if(!r)return;
    (r.pickups||[]).filter(k=>k.t==='mega').forEach(k=>{const d=PICKUPS[k.megaType];if(!d)return;fxc.save();fxc.translate(k.x,k.y);fxc.strokeStyle=`hsla(${d.hue},90%,70%,.7)`;fxc.lineWidth=2;fxc.beginPath();fxc.arc(0,0,10+Math.sin(Date.now()/180+k.x)*2,0,Math.PI*2);fxc.stroke();fxc.fillStyle=`hsla(${d.hue},90%,68%,.95)`;fxc.font='bold 11px sans-serif';fxc.textAlign='center';fxc.textBaseline='middle';fxc.fillText(d.ic,0,0);fxc.restore();});
    updateHudAbility(); requestAnimationFrame(drawFx);
  } requestAnimationFrame(drawFx);

  renderUpdatePanel(); refreshVault();
  setInterval(()=>{refreshVault();if(!$('#scr-mastery')?.classList.contains('hidden'))renderMastery();},1600);
  console.log('ISOTOPE BUILD 7.5 MEGA OVERHAUL ACTIVE');
})();
