/* ISOTOPE QoL, readability and balance pass. Loaded last on purpose. */
(function(){
  'use strict';
  const bad = /(?:Ã.|Â.|â[\x80-\xBF]|ð[\x80-\xBF])/;
  function repair(s){
    if(!bad.test(s)) return s;
    try { return new TextDecoder('utf-8').decode(Uint8Array.from(s, c => c.charCodeAt(0) & 255)); }
    catch(e){ return s; }
  }
  function repairTree(root){
    const walker=document.createTreeWalker(root||document.body, NodeFilter.SHOW_TEXT);
    const nodes=[]; while(walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(n=>{ const fixed=repair(n.nodeValue); if(fixed!==n.nodeValue)n.nodeValue=fixed; });
  }
  const css=document.createElement('style');
  css.textContent=`
    #ptable .pt { border-width:2px!important; border-color:color-mix(in srgb,currentColor 82%,white)!important; color:color-mix(in srgb,currentColor 86%,white)!important; box-shadow:0 0 8px color-mix(in srgb,currentColor 28%,transparent); }
    #ptable .pt.locked { opacity:.38!important; filter:brightness(.55) saturate(.35)!important; box-shadow:none!important; }
    #ptable .pt:not(.locked) { background:linear-gradient(145deg,rgba(79,216,235,.14),#0c1320 68%)!important; }
    #ptable .pt.affordable { opacity:1!important; filter:none!important; transform:translateY(-1px); background:linear-gradient(145deg,color-mix(in srgb,currentColor 16%,transparent),#0c1320 68%)!important; box-shadow:0 0 0 1px color-mix(in srgb,currentColor 45%,transparent),0 0 18px color-mix(in srgb,currentColor 18%,transparent),inset 0 0 14px color-mix(in srgb,currentColor 8%,transparent)!important; }
    #ptable .pt.affordable::after { content:'BUYABLE'; position:absolute; left:4px; right:4px; bottom:3px; font:700 7px/1 var(--mono); letter-spacing:1px; text-align:center; opacity:.62; }
    #ptable .pt.owned-glow { opacity:1!important; filter:none!important; }
    #vd-extra3,#vd-extra { max-height:min(58vh,620px)!important; min-height:260px; font-size:12px!important; line-height:1.65; }
    #vd-more3,#vd-more { border-color:#74eaff!important; color:#e8fbff!important; }
    .card[data-rarity="mythic"] { border:2px solid #ff6dbe!important; box-shadow:0 0 28px rgba(255,74,171,.45), inset 0 0 20px rgba(255,74,171,.12)!important; }
    .card[data-rarity="mythic"] .rarity-badge { color:#ffe5f5!important; background:#8c1f5c!important; }
  `;
  document.head.appendChild(css);
  const observer=new MutationObserver(records=>records.forEach(r=>{r.addedNodes.forEach(n=>{ if(n.nodeType===1)repairTree(n); else if(n.nodeType===3)n.nodeValue=repair(n.nodeValue); });if(r.type==='attributes'&&r.target.classList&&!r.target.classList.contains('hidden'))setTimeout(()=>{const id=r.target.id;if(id==='scr-vault')categoryVault();if(id==='scr-mastery')addAbilityMastery();if(id==='scr-aug')addAugments();if(id==='scr-set')saveTools();},0);}));
  observer.observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['class']}); repairTree();

  /* Rarity is a power budget, not merely a border color.  Clamp all cards to
     their tier range, then make mythics true run-defining choices. */
  const tier={common:[.02,.06],uncommon:[.05,.10],rare:[.09,.16],epic:[.14,.24],legendary:[.22,.36],mythic:[.35,.60]};
  function rebalance(){
    if(!window.ALL_CARDS) return;
    ALL_CARDS.forEach(c=>{
      const range=tier[c.rarity||'common']; if(!range) return;
      if(typeof c.extraValue==='number') c.extraValue=Math.max(range[0],Math.min(range[1],c.extraValue));
      if(c.rarity==='mythic') { c.max=Math.max(1,Math.min(c.max||1,2)); c.runDefining=true; }
    });
  }
  rebalance();
  if(window.DATA && Array.isArray(DATA.RELICS) && !DATA.RELICS.some(r=>r.id==='hex_archivist')){
    DATA.RELICS.push(
      {id:'hex_fragile',n:'Fractured Hex',ic:'⬡',d:'CURSE: -28% max HP and -22% movement speed.'},
      {id:'hex_blood',n:'Sanguine Hex',ic:'⬢',d:'CURSE: +28% damage, but -18% max HP.'},
      {id:'hex_null',n:'Null Hex',ic:'⬣',d:'CURSE: -28% damage. A challenge artifact.'},
      {id:'hex_archivist',n:'Archivist Hex',ic:'⎔',d:'BOON: improved high-rarity card odds; choose from five cards of the rolled tier.'},
      {id:'hex_aegis',n:'Aegis Hex',ic:'⬢',d:'BOON: doubles shield capacity.'}
    );
  }
  /* Extra level-up research: every entry uses the existing real stat pipeline. */
  if(window.ALL_CARDS && !ALL_CARDS.some(c=>c.id==='qol_prism_01')){
    const specs=[['dmg','Prism Amplifier',.07],['rate','Catalyst Governor',.06],['spd','Vector Skates',.05],['crit','Facet Scanner',.04],['shield','Dielectric Bloom',.10],['magnet','Ion Net',.08],['aoe','Resonance Bell',.22],['homing','Orbit Calculator',.025],['coin','Salvage Permit',.06],['pierce','Bore Lattice',.3],['projs','Fission Choir',.22],['hp','Ceramic Reserve',.08]];
    for(let i=0;i<84;i++){
      const s=specs[i%specs.length], rarity=i<12?'uncommon':i<26?'rare':i<33?'epic':'legendary';
      ALL_CARDS.push({id:'qol_prism_'+String(i+1).padStart(2,'0'),ic:'✦',n:s[1]+' '+(Math.floor(i/specs.length)+1),d:'+'+Math.round(s[2]*100)+'% '+s[0]+' effectiveness.',max:3,rarity,extraStat:s[0],extraValue:s[2],unique:true});
    }
  }
  /* Additional standard enemies use the existing renderer, damage, rewards,
     and wave spawner, so they are immediately playable rather than cosmetic. */
  if(window.DATA&&DATA.ETYPES&&!DATA.ETYPES.ionwisp){
    Object.assign(DATA.ETYPES,{
      ionwisp:{hp:14,spd:245,r:7,dmg:9,coin:2,xp:2,hue:192,shape:'dot',desc:'Fast ion mote that darts through formations.'},
      acidmanta:{hp:46,spd:118,r:16,dmg:18,coin:4,xp:4,hue:108,shape:'diamond',desc:'Corrosive glider with a sweeping approach.'},
      cobaltguard:{hp:108,spd:45,r:23,dmg:23,coin:6,xp:6,hue:216,shape:'shield',desc:'Armored cobalt sentinel.'},
      photonmite:{hp:10,spd:310,r:5,dmg:7,coin:1,xp:2,hue:54,shape:'dot',desc:'Tiny, extremely fast light-chaser.'},
      sulfurorb:{hp:62,spd:78,r:18,dmg:16,coin:4,xp:4,hue:62,shape:'ring',desc:'Slow toxic orbital threat.'},
      nickelram:{hp:128,spd:54,r:25,dmg:28,coin:7,xp:6,hue:205,shape:'square',desc:'Dense charge-oriented alloy brute.'},
      frostshard:{hp:28,spd:172,r:11,dmg:14,coin:3,xp:3,hue:198,shape:'diamond',desc:'Shard hunter with chilling pressure.'},
      radmote:{hp:24,spd:156,r:10,dmg:17,coin:3,xp:3,hue:78,shape:'ring',desc:'Unstable radioactive mote.'},
      plasmabeetle:{hp:82,spd:94,r:20,dmg:21,coin:5,xp:5,hue:328,shape:'tri',desc:'Plasma-plated charging insectoid.'},
      glassdrone:{hp:38,spd:142,r:13,dmg:15,coin:3,xp:4,hue:286,shape:'diamond',desc:'Brittle precision drone.'},
      tungstenpod:{hp:190,spd:31,r:29,dmg:32,coin:8,xp:7,hue:38,shape:'hex',desc:'Near-immovable heavy pod.'},
      neonrider:{hp:34,spd:205,r:12,dmg:16,coin:3,xp:4,hue:304,shape:'cross',desc:'Rapid neon skirmisher.'}
    });
  }
  function categoryVault(){
    document.querySelectorAll('#ptable .pt[data-id]').forEach(tile=>{
      const e=DATA.EL(tile.dataset.id), cat=e&&!e.mol&&DATA.CATS[e.cat]; if(!cat)return;
      const col='hsl('+(e.hue==null?cat.h:e.hue)+' 82% 64%)'; tile.style.color=col; tile.style.borderColor=col;
      const affordable=!DATA.isOwned(e.id)&&SAVE.coins>=e.cost;
      tile.classList.toggle('affordable',affordable);
      tile.title=(cat.n+' · '+(DATA.isOwned(e.id)?'OWNED':affordable?'AFFORDABLE · '+e.cost:'LOCKED · '+e.cost));
    });
  }
  function masteryElement(){
    const header=(document.querySelector('#m-head')||{}).textContent||'';
    return Object.values(DATA.ELEMS).find(e=>header.toUpperCase().includes(e.name.toUpperCase()))||DATA.EL(SAVE.sel);
  }
  function addAbilityMastery(){
    const tree=document.getElementById('m-tree'), el=masteryElement(); if(!tree||!el||document.getElementById('ability-mastery'))return;
    const slot=SAVE.getSignature?SAVE.getSignature(el.id):0, choice=(el.choices||el.signatures||[])[slot]||el.act||{};
    const mx=SAVE.mxp(el.id), all=SAVE.raw.abilityMastery||(SAVE.raw.abilityMastery={}), ranks=all[el.id]||(all[el.id]={}), rank=ranks[slot]||0, max=5, cost=90+rank*70;
    const card=document.createElement('div'); card.id='ability-mastery'; card.className='node';
    card.innerHTML='<b>✦ EQUIPPED ABILITY: '+choice.name+'</b><small>Improves this equipped signature: +6% temporary damage after casting and -6% cooldown per rank.</small><div class="row"><div class="pips">'+Array.from({length:max},(_,i)=>'<i class="'+(i<rank?'on':'')+'"></i>').join('')+'</div><button class="btn chamf" '+(rank>=max||mx.xp<cost?'disabled':'')+'>'+ (rank>=max?'MAX':'◆ '+cost)+'</button></div>';
    const btn=card.querySelector('button'); btn.onclick=()=>{if(rank>=max||mx.xp<cost)return;mx.xp-=cost;ranks[slot]=rank+1;all[el.id]=ranks;SAVE.save();UI.show('scr-mastery');}; tree.appendChild(card);
  }
  const AUGS=[['rate','Reaction Governor','+5% fire rate /lv',7,85],['armor','Ceramic Plating','+2% damage resistance /lv',6,110],['pierce','Breach Matrix','+1 projectile pierce /lv',4,140],['aoe','Reaction Chamber','+1 blast size /lv',5,115]];
  function addAugments(){
    const grid=document.getElementById('aug-grid');if(!grid||document.getElementById('qol-augs'))return;
    const wrap=document.createElement('div');wrap.id='qol-augs';wrap.style.cssText='display:contents';
    AUGS.forEach(a=>{const lv=SAVE.metaLv(a[0]),cost=Math.round(a[4]*Math.pow(lv+1,1.55)/10)*10,d=document.createElement('div');d.className='augcard panel';d.innerHTML='<h4>'+a[1]+'</h4><p>'+a[2]+'</p><div class="pips2">'+Array.from({length:a[3]},(_,i)=>'<i class="'+(i<lv?'on':'')+'"></i>').join('')+'</div><div class="augfoot"><span class="cost">'+(lv>=a[3]?'MAXED':'◈ '+cost)+'</span><button class="btn chamf" '+(lv>=a[3]||SAVE.coins<cost?'disabled':'')+'>BUY</button></div>';d.querySelector('button').onclick=()=>{if(lv<a[3]&&SAVE.spend(cost)){SAVE.raw.meta[a[0]]=lv+1;SAVE.save();UI.show('scr-aug');}};wrap.appendChild(d);});grid.appendChild(wrap);
  }
  function saveTools(){
    const host=document.getElementById('qol-save-tools')||document.getElementById('scr-set');if(!host||document.getElementById('qol-save-tools'))return;
    const box=document.createElement('div');box.id='qol-save-tools';box.className='panel';box.style.cssText='padding:14px;margin-top:14px;max-width:560px';box.innerHTML='<b>SAVE FILE</b><div style="display:flex;gap:8px;margin-top:10px"><button class="btn" id="save-export">EXPORT SAVE</button><button class="btn" id="save-import">IMPORT SAVE</button><input id="save-file" type="file" accept="application/json" hidden></div>';
    host.appendChild(box);document.getElementById('save-export').onclick=()=>{const blob=new Blob([JSON.stringify(SAVE.raw,null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='isotope-save.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);};document.getElementById('save-import').onclick=()=>document.getElementById('save-file').click();document.getElementById('save-file').onchange=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{try{const data=JSON.parse(r.result);if(!data||typeof data!=='object')throw Error();localStorage.setItem('isotope_save_v3',JSON.stringify(data));location.reload();}catch(_){alert('Invalid ISOTOPE save file.');}};r.readAsText(f);};
  }
  if(window.UI&&UI.show){const oldShow=UI.show;UI.show=function(id){oldShow(id);setTimeout(()=>{if(id==='scr-vault')categoryVault();if(id==='scr-mastery')addAbilityMastery();if(id==='scr-aug')addAugments();if(id==='scr-set')saveTools();},0);};}
  /* Ability mastery is per player and per equipped slot; wrapping individual
     choices avoids ever touching another operator's active ability. */
  Object.values(DATA.ELEMS).forEach(el=>(el.choices||[]).forEach((choice,slot)=>{if(!choice||choice.__mastered||typeof choice.exec!=='function')return;const exec=choice.exec;choice.exec=function(p){exec(p);const rank=(((SAVE.raw.abilityMastery||{})[p.elementId]||{})[slot])||0;if(rank){p.activeCd*=Math.pow(.94,rank);p.puDamage=Math.max(p.puDamage||1,1+.06*rank);p.puTimer=Math.max(p.puTimer||0,3+rank);}};choice.__mastered=true;}));
  console.log('ISO_QOL_FIXES active: text repair, accessible vault, expanded stats, tier power budget.');
})();
