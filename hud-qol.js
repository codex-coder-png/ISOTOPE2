/* ISOTOPE HUD QOL — H opens a compact live stat drawer directly beneath the minimap. */
(function(){
  'use strict';
  if(window.__ISO_HUD_QOL_V2__)return;
  window.__ISO_HUD_QOL_V2__=true;

  var css=document.createElement('style');
  css.textContent=`
  #iso-stats-anchor{position:fixed;right:14px;top:142px;z-index:46;pointer-events:none;font-family:var(--mono,monospace)}
  #iso-stats-toggle{pointer-events:auto;display:flex;align-items:center;gap:7px;border:1px solid rgba(116,234,255,.45);background:rgba(7,13,20,.9);color:#dffaff;border-radius:8px;padding:6px 9px;font-size:10px;letter-spacing:1.5px;box-shadow:0 5px 20px rgba(0,0,0,.3);cursor:pointer}
  #iso-stats-toggle b{font-size:13px;color:#74eaff}
  #iso-stats-panel{display:none;pointer-events:auto;width:238px;margin-top:5px;padding:10px;border:1px solid rgba(116,234,255,.28);background:rgba(5,10,16,.94);backdrop-filter:blur(8px);border-radius:9px;box-shadow:0 14px 38px rgba(0,0,0,.45)}
  #iso-stats-panel.on{display:block}
  #iso-stats-grid{display:grid;grid-template-columns:1fr 1fr;gap:3px 12px;margin-top:7px}
  #iso-stats-grid span{white-space:nowrap;color:#9eb0bd;font-size:9px;line-height:1.55}
  #iso-stats-grid b{float:right;color:#f4fbff;font-weight:700}
  #iso-stats-head{display:flex;justify-content:space-between;color:#74eaff;font-size:10px;letter-spacing:2px}
  #iso-stats-note{margin-top:7px;color:#637582;font-size:8px;line-height:1.5}
  `;
  document.head.appendChild(css);

  var anchor=document.createElement('div');anchor.id='iso-stats-anchor';
  anchor.innerHTML='<button id="iso-stats-toggle"><b>H</b><span>STATS</span></button><div id="iso-stats-panel"><div id="iso-stats-head"><span>LIVE COMBAT READOUT</span><span>H</span></div><div id="iso-stats-grid"></div><div id="iso-stats-note">Updates while the run is active. Values reflect equipped cards, augments, relics and element mastery.</div></div>';
  document.body.appendChild(anchor);

  var panel=anchor.querySelector('#iso-stats-panel');
  var grid=anchor.querySelector('#iso-stats-grid');
  function pct(v){return (Number(v||0)*100).toFixed(1)+'%';}
  function num(v){return Number(v||0).toFixed(v&&Math.abs(v)<10?2:0);}
  function update(){
    if(!window.RUN||!window.ST)return;
    var s=window.ST;
    var rows=[
      ['DMG',num(s.dmg)],['RATE',num(s.rate)],['HP',num(s.hp)],
      ['SHIELD',num(s.shieldMax)],['ARMOR',pct(s.armor)],['CRIT',pct(s.crit/100)],
      ['CRIT DMG',num(s.critD)],['PROJ SPEED',num(s.ps)],['PIERCE',num(s.pierce)],
      ['PROJECTILES',num(s.projs)],['AOE LV',num(s.aoeLv)],['CHAIN',num(s.chainLv)],
      ['POISON',num(s.poisonLv)],['BURN',num(s.burnLv)],['SLOW',num(s.slowLv)],
      ['HOMING',pct(s.homing)],['REGEN',num(s.regen)],['DASH CD',num(s.dashCd)],
      ['ACTIVE CD',num(s.activeCd)],['COIN ×',num(s.coinMult)]
    ];
    grid.innerHTML=rows.map(function(r){return '<span>'+r[0]+'<b>'+r[1]+'</b></span>';}).join('');
  }
  function setOpen(v){panel.classList.toggle('on',!!v);update();}
  anchor.querySelector('#iso-stats-toggle').onclick=function(){setOpen(!panel.classList.contains('on'));};
  document.addEventListener('keydown',function(e){
    if(e.key.toLowerCase()!=='h'||e.ctrlKey||e.altKey||e.metaKey)return;
    var tag=(e.target&&e.target.tagName||'').toLowerCase();
    if(tag==='input'||tag==='textarea'||tag==='select')return;
    e.preventDefault();setOpen(!panel.classList.contains('on'));
  });
  setInterval(update,250);
  console.log('ISO_HUD_QOL_V2 active: H stats is positioned below the minimap.');
})();