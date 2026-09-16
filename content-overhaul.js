/* ISOTOPE CONTENT OVERHAUL V1 — extra cards, augmentations, codex and run utilities. */
(function(){
  'use strict';
  if(window.__ISO_CONTENT_OVERHAUL_V1__)return;
  window.__ISO_CONTENT_OVERHAUL_V1__=true;

  var CARD_EFFECTS=[
    ['dmg',.03,'projectile damage'],['rate',.024,'fire rate'],['hp',5,'maximum health'],['spd',.02,'movement speed'],
    ['crit',.015,'critical chance'],['shield',2,'maximum shield'],['magnet',.035,'pickup range'],['projs',.08,'projectile output'],
    ['pierce',.15,'piercing'],['aoe',.12,'reaction area'],['homing',.014,'homing strength'],['coin',.025,'coin gain']
  ];
  var CARD_PREFIX=['Atomic','Molecular','Quantum','Lattice','Flux','Neutron','Photon','Catalyst','Isotope','Valence','Orbital','Reaction','Fission','Fusion','Resonant'];
  var CARD_SUFFIX=['Array','Reservoir','Conduit','Mantle','Prism','Core','Drive','Matrix','Engine','Relay','Protocol','Cage'];
  var rar=['common','uncommon','rare','epic','legendary','mythic'];
  if(window.ALL_CARDS){
    for(var i=0;i<180;i++){
      var id='content_card_'+String(i+1).padStart(3,'0');
      if(ALL_CARDS.some(function(c){return c.id===id;}))continue;
      var fx=CARD_EFFECTS[i%CARD_EFFECTS.length], rr=i<96?'common':i<138?'uncommon':i<162?'rare':i<174?'epic':i<179?'legendary':'mythic';
      var val=fx[1]*(rr==='uncommon'?1.35:rr==='rare'?1.8:rr==='epic'?2.6:rr==='legendary'?4:rr==='mythic'?6:1);
      if(fx[0]==='projs'||fx[0]==='pierce'||fx[0]==='aoe')val=Math.max(1,Math.round(val));
      var d=(fx[0]==='hp'||fx[0]==='shield')?'Stack +'+Math.max(1,Math.round(val))+' '+fx[2]+'.':
        'Stack +'+Math.max(1,Math.round(val*100))+'% '+fx[2]+'.';
      ALL_CARDS.push({id:id,ic:'◆',n:CARD_PREFIX[i%CARD_PREFIX.length]+' '+CARD_SUFFIX[Math.floor(i/CARD_PREFIX.length)%CARD_SUFFIX.length]+' '+String(i+1).padStart(3,'0'),d:d,max:6,rarity:rr,extraStat:fx[0],extraValue:val,unique:true});
    }
  }

  var AUGS=[
    ['qaug_dmg_01','dmg','Resonance Densifier','+3% damage / level',8,120,.03],
    ['qaug_rate_01','rate','Clockwork Catalyst','+4% fire rate / level',8,120,.04],
    ['qaug_hp_01','hp','Ceramic Reserve','+5 maximum HP / level',8,100,5],
    ['qaug_spd_01','spd','Vector Implant','+2% speed / level',8,105,.02],
    ['qaug_crit_01','crit','Kinetic Critic','+1.5% crit / level',8,125,.015],
    ['qaug_shield_01','shield','Dielectric Stack','+2 maximum shield / level',8,110,2],
    ['qaug_magnet_01','magnet','Field Magnetics','+3.5% pickup range / level',8,90,.035],
    ['qaug_pierce_01','pierce','Bore Geometry','+1 pierce / level',6,140,1],
    ['qaug_aoe_01','aoe','Reaction Aperture','+1 reaction area / level',7,135,1],
    ['qaug_homing_01','homing','Guidance Mesh','+1.4% homing / level',7,105,.014],
    ['qaug_coin_01','coin','Salvage Dividend','+2.5% coin gain / level',7,115,.025],
    ['qaug_dmg_02','dmg','Critical Mass','+3% damage / level',6,170,.03],
    ['qaug_rate_02','rate','Pulse Governor','+4% fire rate / level',6,170,.04],
    ['qaug_hp_02','hp','Reserve Capsule','+5 maximum HP / level',6,150,5],
    ['qaug_shield_02','shield','Aegis Lattice','+2 maximum shield / level',7,165,2],
    ['qaug_spd_02','spd','Phase Bearings','+2% speed / level',6,150,.02],
    ['qaug_crit_02','crit','Prism Focus','+1.5% crit / level',6,180,.015],
    ['qaug_magnet_02','magnet','Collection Field','+3.5% pickup range / level',6,140,.035]
  ];
  window.ISO_QAUG_DEFS={};
  AUGS.forEach(function(a){window.ISO_QAUG_DEFS[a[0]]={stat:a[1],per:a[6]};});
  function makeAugCards(){
    var grid=document.getElementById('aug-grid'); if(!grid)return;
    var old=document.getElementById('content-augments'); if(old)return;
    var wrap=document.createElement('div');wrap.id='content-augments';wrap.style.cssText='display:contents';
    AUGS.forEach(function(a,idx){
      var lv=SAVE.metaLv(a[0]), cost=Math.round(a[5]*Math.pow(lv+1,1.48)/10)*10;
      var d=document.createElement('div'); d.className='augcard panel content-aug';
      d.innerHTML='<h4>'+a[1]+'</h4><p>'+a[2]+'</p><div class="pips2">'+Array.from({length:a[4]},function(_,j){return '<i class="'+(j<lv?'on':'')+'"></i>';}).join('')+'</div><div class="augfoot"><span class="cost">'+(lv>=a[4]?'MAXED':'◈ '+cost)+'</span><button class="btn chamf" '+(lv>=a[4]||SAVE.coins<cost?'disabled':'')+'>BUY</button></div>';
      d.querySelector('button').onclick=function(){var cur=SAVE.metaLv(a[0]),price=Math.round(a[5]*Math.pow(cur+1,1.48)/10)*10;if(cur>=a[4]||!SAVE.spend(price))return;SAVE.raw.meta[a[0]]=cur+1;SAVE.save();if(window.UI)UI.show('scr-aug');};
      wrap.appendChild(d);
    });
    grid.appendChild(wrap);
  }
  function addCodex(){
    var host=document.getElementById('scr-set'); if(!host||document.getElementById('iso-content-codex'))return;
    var box=document.createElement('div');box.id='iso-content-codex';box.className='panel';box.style.cssText='margin-top:14px;padding:14px;max-width:720px';
    box.innerHTML='<b>ISOTOPE CONTENT INDEX</b><div id="iso-counts" style="margin-top:8px;color:var(--tx2);line-height:1.7"></div><div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px"><button class="btn" id="iso-audit">ABILITY AUDIT</button><button class="btn" id="iso-vault-refresh">REFRESH VAULT</button><button class="btn" id="iso-safe-save">BACKUP SAVE</button></div><pre id="iso-audit-out" style="white-space:pre-wrap;display:none;margin-top:10px;color:var(--tx2);font:11px var(--mono)"></pre>';
    host.appendChild(box);
    function counts(){
      var elc=window.DATA&&DATA.ELEMS?Object.keys(DATA.ELEMS).length:0;
      var mc=window.DATA&&DATA.MOLDEF?Object.keys(DATA.MOLDEF).filter(function(k){return DATA.MOLDEF[k]&&DATA.MOLDEF[k].mol;}).length:0;
      var cc=window.ALL_CARDS?ALL_CARDS.length:0;
      var ec=window.DATA&&DATA.ETYPES?Object.keys(DATA.ETYPES).length:0;
      var bc=window.DATA&&DATA.BOSSDEFS?DATA.BOSSDEFS.length:0;
      var rc=window.DATA&&DATA.RELICS?DATA.RELICS.length:0;
      document.getElementById('iso-counts').textContent='Elements: '+elc+' · Compounds: '+mc+' · Cards: '+cc+' · Enemies: '+ec+' · Bosses: '+bc+' · Artifacts: '+rc;
    }
    counts();
    document.getElementById('iso-audit').onclick=function(){
      var out=document.getElementById('iso-audit-out');out.style.display='block';
      try{var a=DATA.ISO_UNIQUE_MOVE_AUDIT();out.textContent='Duplicate names: '+a.duplicateNames.length+'\\nDuplicate descriptions: '+a.duplicateDescriptions.length+'\\nUnique names: '+a.totalNames+'\\nUnique descriptions: '+a.totalDescriptions+'\\n\\nSilicon slot 1: '+((DATA.ELEMS['14'].choices[0]||{}).name||'missing');}
      catch(e){out.textContent='Audit unavailable: '+e.message;}
    };
    document.getElementById('iso-vault-refresh').onclick=function(){if(window.UI)UI.show('scr-vault');};
    document.getElementById('iso-safe-save').onclick=function(){try{var blob=new Blob([JSON.stringify(SAVE.raw,null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='isotope-backup-'+Date.now()+'.json';a.click();setTimeout(function(){URL.revokeObjectURL(a.href);},1000);}catch(e){}};
  }
  if(window.UI&&UI.show){
    var prev=UI.show;UI.show=function(id){prev(id);setTimeout(function(){if(id==='scr-aug')makeAugCards();if(id==='scr-set')addCodex();},40);};
  }else setTimeout(function(){makeAugCards();addCodex();},400);
  console.log('ISO_CONTENT_OVERHAUL_V1: +180 unique cards, +18 augmentations, content index, expanded artifacts/enemies/bosses/pickups.');
})();