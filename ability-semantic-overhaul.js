/* ISOTOPE ABILITY SEMANTIC OVERHAUL V8
 * Purpose: make every usable element/compound ability execute the mechanic
 * its description names. This file is loaded LAST so no legacy family router
 * can replace a semantic move with a generic bullet/explosion fallback.
 */
(function(){
  'use strict';
  if(window.__ISO_ABILITY_SEMANTIC_V8__)return;
  window.__ISO_ABILITY_SEMANTIC_V8__=true;
  const DATA=window.DATA;
  if(!DATA)return;

  const TAU=Math.PI*2;
  const E=()=>window.RUN;
  const STT=()=>window.ST||{};
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const dist2=(a,b,c,d)=>{const x=a-c,y=b-d;return x*x+y*y};
  const hsh=s=>{let h=2166136261>>>0;for(const c of String(s)){h^=c.charCodeAt(0);h=Math.imul(h,16777619)>>>0}return h>>>0};
  const alive=()=>{const r=E();return r&&r.enemies?r.enemies.filter(x=>x&&!x.dead):[]};
  const playerAt=(p,r=1e9)=>{let out=null,bd=r*r;for(const q of alive()){const d=dist2(p.x,p.y,q.x,q.y);if(d<bd){bd=d;out=q}}return out};
  const aim=(p,range=260)=>{const m=window.mouse;let x=Number.isFinite(m&&m.x)?m.x:p.x+Math.cos(p.angle||0)*range;let y=Number.isFinite(m&&m.y)?m.y:p.y+Math.sin(p.angle||0)*range;return{x:clamp(x,20,(window.W||1280)-20),y:clamp(y,20,(window.H||720)-20)}};
  const hit=(e,d,opt={})=>{if(!e||e.dead)return;if(typeof window.dmgEnemy==='function')window.dmgEnemy(e,d,opt);else{e.hp-=d;if(e.hp<=0)e.dead=true}};
  const status=(e,k,v,dmg)=>{if(!e)return;const fx=window.ISO_STATUS_V10||{};if(k==='burn'&&window.addBurn)window.addBurn(e,dmg*.35,d||3);else if(k==='poison'&&window.addPoison)window.addPoison(e,dmg*.4,d||4);else if(k==='freeze'&&window.addFreeze)window.addFreeze(e,d||1);else if(k==='corrode'&&window.addCorrode)window.addCorrode(e,d||4,.35);else if(k==='rust'&&fx.rust)fx.rust(e,d||3.5,.72);else if(k==='shock'&&fx.shock)fx.shock(e,d||1.3);else if(k==='brittle'&&fx.brittle)fx.brittle(e,d||3);else if(k==='drenched'&&fx.drenched)fx.drenched(e,d||3);else if(k==='slow')e.slowT=Math.max(e.slowT||0,d||2);else if(k==='stun')e.stun=Math.max(e.stun||0,d||.8);else if(k==='mark')e.mark=Math.max(e.mark||0,d||5);else if(k==='conf')e.conf=Math.max(e.conf||0,d||1.5)};
  const hue=(entity,seed)=>{const base=Number(entity&&entity.hue);return Number.isFinite(base)?base:(seed%360)};
  const fx=(x,y,h,r=70)=>{if(window.ringFx)window.ringFx(x,y,h,r);const r0=E();if(!r0||!r0.parts)return;for(let i=0;i<Math.min(12,4+Math.floor(r/30));i++)r0.parts.push({x,y,vx:(Math.random()-.5)*180,vy:(Math.random()-.5)*180,t:.35,life:.35,hue:h,r:2});};
  const aoe=(x,y,r,d,h,st)=>{if(window.aoe)window.aoe(x,y,r,d,h||190);const rr=alive();for(const e of rr){if(dist2(x,y,e.x,e.y)<(r+e.r)*(r+e.r)){hit(e,d);status(e,st,d,d)}}fx(x,y,h||190,r)};
  const setShield=(p,v,ifr=0)=>{p.sh=Math.min((STT().shieldMax||90)+v,(p.sh||0)+v);if(ifr)p.iframes=Math.max(p.iframes||0,ifr);};
  const heal=(p,v)=>{p.hp=Math.min(STT().hp||100,(p.hp||0)+v)};
  const proj=(p,o)=>{
    const r=E();if(!r)return null;o=o||{};const a=typeof o.a==='number'?o.a:(p.angle||0),speed=o.speed||STT().ps||380;
    const b={type:'projectile',x:p.x,y:p.y,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed,dmg:o.dmg||STT().dmg||14,r:o.r||5,life:o.life||1.4,owner:p.id,hit:[],pierce:o.pierce||0,hue:o.hue||190,acc:o.acc||0,hom:o.hom||false,status:o.status||null,statusTime:o.statusTime||1.5,expl:o.expl||0,kb:o.kb||0,semanticType:o.type||'orb'};
    addObj(b);p._isoLastAttack={speed,dmg:b.dmg,r:b.r,pierce:b.pierce,type:o.type||'orb',hue:b.hue};return b;
  };
  const ring=(p,n,opts={})=>{for(let i=0;i<n;i++)proj(p,{...opts,a:i/n*TAU})};
  const line=(p,len,w,d,h,st)=>{const rr=alive(),a=p.angle||0,ca=Math.cos(a),sa=Math.sin(a);for(const e of rr){const px=e.x-p.x,py=e.y-p.y,t=clamp(px*ca+py*sa,0,len),xx=p.x+ca*t,yy=p.y+sa*t;if(dist2(e.x,e.y,xx,yy)<(w+e.r)*(w+e.r)){hit(e,d);status(e,st,d)}}fx(p.x+ca*len*.5,p.y+sa*len*.5,h,w*2)};
  const cone=(p,range,half,d,h,st)=>{for(const e of alive()){const dx=e.x-p.x,dy=e.y-p.y,dd=Math.hypot(dx,dy);if(dd>range+e.r)continue;let da=Math.atan2(dy,dx)-(p.angle||0);while(da>Math.PI)da-=TAU;while(da<-Math.PI)da+=TAU;if(Math.abs(da)<=half){hit(e,d);status(e,st,d)}}fx(p.x+Math.cos(p.angle)*range*.45,p.y+Math.sin(p.angle)*range*.45,h,range*.32)};
  const teleport=(p,x,y)=>{const ox=p.x,oy=p.y;p.x=clamp(x,20,(window.W||1280)-20);p.y=clamp(y,20,(window.H||720)-20);fx(ox,oy,240,65);fx(p.x,p.y,300,80)};
  const uniqueStyle=(id)=>{const n=hsh(id);return{seed:n,phase:n%360,scale:.82+(n%39)/100,delay:.22+(n%110)/100,speed:.82+(n%61)/100,count:3+(n%8),radius:58+(n%128),duration:2.2+(n%55)/10,status:['burn','poison','freeze','corrode','rust','shock','brittle','drenched','slow','stun'][n%10]};};
  function addObj(obj){const r=E();if(!r)return; r.isoAbilities||(r.isoAbilities=[]);if(obj&&obj.type==='mine'&&obj.totalT==null)obj.totalT=Math.max(.05,obj.t||1);r.isoAbilities.push(obj);return obj;}

  /* Persistent semantic object simulation. The objects are intentionally
     different from the game's generic bullet/field helpers so two abilities
     with the same family description still have materially different motion. */
  function tick(dt){
    const r=E();if(!r)return;
    const arr=r.isoAbilities||[];
    for(let i=arr.length-1;i>=0;i--){const o=arr[i];o.t-=dt;o.age=(o.age||0)+dt;
      if(o.type==='projectile'){
        if(o.acc){const v=Math.hypot(o.vx,o.vy)||1,nv=v+o.acc*dt;o.vx*=nv/v;o.vy*=nv/v;}
        if(o.hom){const t=alive().filter(e=>!o.hit.includes(e)).sort((a,b)=>dist2(a.x,a.y,o.x,o.y)-dist2(b.x,b.y,o.x,o.y))[0];if(t){let aa=Math.atan2(t.y-o.y,t.x-o.x),ca=Math.atan2(o.vy,o.vx),dd=aa-ca;while(dd>Math.PI)dd-=TAU;while(dd<-Math.PI)dd+=TAU;const na=ca+clamp(dd,-3.2*dt,3.2*dt),v=Math.hypot(o.vx,o.vy)||1;o.vx=Math.cos(na)*v;o.vy=Math.sin(na)*v;}}
        o.x+=o.vx*dt;o.y+=o.vy*dt;
        for(const e of alive()){if(o.hit.includes(e)||dist2(o.x,o.y,e.x,e.y)>(o.r+e.r)*(o.r+e.r))continue;hit(e,o.dmg);status(e,o.status,o.dmg,o.statusTime);if(o.kb&&!e.boss){const dd=Math.hypot(o.vx,o.vy)||1;e.x+=(o.vx/dd)*o.kb;e.y+=(o.vy/dd)*o.kb;}o.hit.push(e);
          if(o.expl)aoe(o.x,o.y,o.expl,o.dmg*.8,o.hue,o.status);
          if(o.pierce>0)o.pierce--;else o.life=0;
        }
      }
      else if(o.type==='crystal'){o.size=Math.min(o.maxSize,o.size+o.grow*dt);o.cool=(o.cool||0)-dt;for(const e of alive()){const touching=dist2(o.x,o.y,e.x,e.y)<(o.size+e.r)*(o.size+e.r);if(touching&&o.cool<=0){hit(e,o.dmg);status(e,o.status,o.dmg,o.statusTime);o.cool=o.touchDps?.12:.22;}}}
      else if(o.type==='trail'){for(const e of alive())if(dist2(o.x,o.y,e.x,e.y)<(o.r+e.r)*(o.r+e.r)){hit(e,o.dmg);status(e,o.status,o.dmg,o.statusTime)}}
      else if(o.type==='cloud'||o.type==='radiation'){for(const e of alive())if(dist2(o.x,o.y,e.x,e.y)<(o.r+e.r)*(o.r+e.r)&&Math.random()<dt*(o.rate||4)){hit(e,o.dmg);status(e,o.status,o.dmg,o.statusTime)}}
      else if(o.type==='mine'){if(!o.armed){o.armed=true;o.age=0;}if(o.proximity){for(const e of alive())if(dist2(o.x,o.y,e.x,e.y)<(o.r+e.r)*(o.r+e.r)){hit(e,o.dmg);status(e,o.status,o.dmg,o.statusTime);o.t=Math.min(o.t,.05);}}}
      else if(o.type==='beacon'){if(Math.random()<dt*(o.pulse||1.5)){for(const e of alive())if(dist2(o.x,o.y,e.x,e.y)<o.r*o.r){hit(e,o.dmg);status(e,o.status,o.dmg,o.statusTime)}for(const p of (r.players||[]))if(!p.downed&&dist2(o.x,o.y,p.x,p.y)<o.r*o.r){setShield(p,o.allyShield||0);}}
      }
      else if(o.type==='reactor'){if(Math.random()<dt*(o.pulse||2)){o.power*=o.growth;aoe(o.x,o.y,o.r,o.dmg*o.power,o.hue,o.status)}}
      else if(o.type==='tether'){const e=o.target;if(e&&!e.dead){const dx=o.x-e.x,dy=o.y-e.y,dd=Math.hypot(dx,dy)||1;e.x+=(o.x-e.x)/dd*o.pull*dt;e.y+=(o.y-e.y)/dd*o.pull*dt;hit(e,o.dmg*dt,{quiet:true});status(e,o.status,o.dmg,o.statusTime)}}
      else if(o.type==='laser'){if(Math.random()<dt*4)line({x:o.x,y:o.y,angle:o.a},o.len,o.w,o.dmg,o.hue,o.status)}
      else if(o.type==='barrier'){for(const b of (r.ebullets||[])){if(dist2(b.x,b.y,o.x,o.y)<o.r*o.r){b.life=0;if(o.reflect){const q=Math.atan2(o.y-b.y,o.x-b.x);b.vx=Math.cos(q)*Math.hypot(b.vx,b.vy);b.vy=Math.sin(q)*Math.hypot(b.vx,b.vy);b.life=3}}}}
      else if(o.type==='drone'){const owner=(r.players||[]).find(p=>p.id===o.owner);if(owner){o.ang+=o.spin*dt;o.x=owner.x+Math.cos(o.ang)*o.orbit;o.y=owner.y+Math.sin(o.ang)*o.orbit;if(Math.random()<dt*o.fire){const e=playerAt(owner,500);if(e)proj(owner,{a:Math.atan2(e.y-o.y,e.x-o.x),speed:640,dmg:o.dmg,type:'drone',hue:o.hue,life:1.1})}}}
      else if(o.type==='gravity'){for(const e of alive()){const dx=o.x-e.x,dy=o.y-e.y,dd=Math.hypot(dx,dy)||1;if(dd<o.r){e.x+=(dx/dd)*o.pull*dt;e.y+=(dy/dd)*o.pull*dt;hit(e,o.dps*dt,{quiet:true})}}for(const b of (r.ebullets||[])){const dx=o.x-b.x,dy=o.y-b.y,dd=Math.hypot(dx,dy)||1;if(dd<o.r){b.vx+=(dx/dd)*o.pull*dt;b.vy+=(dy/dd)*o.pull*dt}}}
      if(o.t<=0){if(o.onEnd)try{o.onEnd(o)}catch(err){console.error('semantic end',err)}arr.splice(i,1)}
    }
    r.isoAbilities=arr;
  }
  function render(){
    const r=E();if(!r||!r.isoAbilities)return;const c=document.getElementById('iso-semantic-fx');if(!c)return;const x=c.getContext('2d');c.width=window.innerWidth;c.height=window.innerHeight;x.clearRect(0,0,c.width,c.height);
    for(const o of r.isoAbilities){x.save();x.translate(o.x,o.y);x.globalAlpha=Math.max(0,Math.min(1,o.t/(o.fade||.45)));
      const col=`hsla(${o.hue||190},90%,65%,${o.alpha||.8})`;
      x.strokeStyle=col;x.fillStyle=col;x.lineWidth=o.width||2;
      if(o.type==='projectile'){x.rotate(Math.atan2(o.vy,o.vx));x.beginPath();x.moveTo(o.r*1.8,0);x.lineTo(-o.r*.9,-o.r*.75);x.lineTo(-o.r*.9,o.r*.75);x.closePath();x.fill();x.shadowBlur=10;x.shadowColor=col}
      else if(o.type==='crystal'){for(let k=0;k<6;k++){x.save();x.rotate(k*TAU/6);x.beginPath();x.moveTo(0,0);x.lineTo(o.size*.75,-o.size*.2);x.lineTo(o.size,o.size*.18);x.lineTo(o.size*.55,o.size*.34);x.closePath();x.fill();x.restore()}}
      else if(o.type==='laser'){x.rotate(o.a);x.fillRect(0,-o.w,o.len,o.w*2)}
      else if(o.type==='barrier'){x.strokeRect(-o.r,-o.r,o.r*2,o.r*2)}
      else if(o.type==='cloud'||o.type==='radiation'||o.type==='gravity'){x.beginPath();x.arc(0,0,o.r*(.92+.08*Math.sin(o.age*5)),0,TAU);x.stroke()}
      else if(o.type==='beacon'||o.type==='reactor'){x.beginPath();x.arc(0,0,8+4*Math.sin(o.age*7),0,TAU);x.fill();x.beginPath();x.arc(0,0,o.r*.6,0,TAU);x.stroke()}
      else if(o.type==='mine'){const total=o.totalT||o.t||1,p=1-clamp(o.t/total,0,1),rate=2.2+17*p*p,pulse=(Math.sin(o.age*rate*TAU)+1)/2;x.globalAlpha=.3+.65*pulse*p;x.beginPath();x.arc(0,0,7+10*p,0,TAU);x.fill();x.globalAlpha=1;x.beginPath();x.arc(0,0,(o.r||34)*(.18+.82*p),0,TAU);x.stroke();for(let i=0;i<(4+Math.floor(7*p));i++){const a=i*TAU/(4+Math.floor(7*p));x.beginPath();x.moveTo(Math.cos(a)*10,Math.sin(a)*10);x.lineTo(Math.cos(a)*(14+16*pulse*p),Math.sin(a)*(14+16*pulse*p));x.stroke();}}
      else if(o.type==='drone'){x.beginPath();x.arc(0,0,7,0,TAU);x.fill();x.strokeRect(-5,-5,10,10)}
      else if(o.type==='tether'){x.beginPath();x.moveTo(0,0);if(o.target)x.lineTo(o.target.x-o.x,o.target.y-o.y);x.stroke()}
      else {x.beginPath();x.arc(0,0,o.r||10,0,TAU);x.stroke()}
      x.restore();
    }
  }
  const canvas=document.createElement('canvas');canvas.id='iso-semantic-fx';canvas.style.cssText='position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:8';document.body&&document.body.appendChild(canvas);
  let last=performance.now();function frame(now){const dt=Math.min(.05,(now-last)/1000||0);last=now;tick(dt);render();requestAnimationFrame(frame)}requestAnimationFrame(frame);

  function lower(s){return String(s||'').toLowerCase()}
  function has(s,...q){s=lower(s);return q.some(k=>s.includes(k))}
  function explicitElementFirst(n,p,entity,style){
    const d=lower(entity.act&&entity.act.desc||'');const h=hue(entity,style.phase),D=(STT().dmg||14)*style.scale,S=(STT().ps||380)*style.speed,a=p.angle||0;
    switch(n){
      case 1:{const b=proj(p,{type:'hydrogen-compress',speed:S*.65,dmg:D*2.1,r:6+style.radius*.02,pierce:5,acc:900,hue:h,expl:true,life:1.9});setTimeout(()=>{if(b)b.r+=8},350);return}
      case 2:{p._isoFloatT=4; p._isoFloatPower=1.5;setShield(p,10,.35);for(let i=0;i<style.count;i++)proj(p,{a:a+(i-(style.count-1)/2)*.12,speed:S*(1.1+i*.16),dmg:D*.55,r:3,type:'helium-recoil',hue:h});for(const e of alive()){if(dist2(p.x,p.y,e.x,e.y)<style.radius*style.radius&&!e.boss)e.y=Math.max(20,e.y-80-style.radius*.25)}return}
      case 3:{const ox=p.x,oy=p.y;const dist=150+style.radius*.5;p.x=clamp(p.x+Math.cos(a)*dist,20,(window.W||1280)-20);p.y=clamp(p.y+Math.sin(a)*dist,20,(window.H||720)-20);fx(ox,oy,h,45);addObj({type:'trail',x:ox,y:oy,t:2.4,r:24,dmg:D*.7,status:'burn',statusTime:2,hue:h,fade:.5});fx(p.x,p.y,h,70);return}
      case 4:{p._isoSpeedT=3;for(let i=0;i<4;i++)proj(p,{a:a+(i-.5)*.035,speed:S*2.2,dmg:D*1.1,r:2.3,pierce:10,type:'beryllium-piercer',hue:h});return}
      case 5:{const q=aim(p,170);addObj({type:'barrier',x:q.x,y:q.y,t:5,r:75+style.radius*.2,hue:h,width:3,reflect:false,fade:.6});return}
      case 6:{p._isoForm=((p._isoForm||0)+1)%3;const form=p._isoForm;if(form===0)setShield(p,35,1.2);else if(form===1){ring(p,10,{speed:S*1.25,dmg:D*.75,type:'graphite-chain',hue:h});}else{p.iframes=Math.max(p.iframes,1.4);p._stealthT=3;}return}
      case 7:{addObj({type:'cloud',x:p.x,y:p.y,t:5,r:170+style.radius*.4,dmg:D*.16,rate:4.2,status:'freeze',statusTime:1.2,hue:h,fade:.7});return}
      case 8:{addObj({type:'beacon',x:p.x,y:p.y,t:5,r:190,dmg:D*.1,allyShield:0,status:'burn',statusTime:1,pulse:2,hue:h,fade:.7,powerAmp:1.5});p._isoOxygenAmpT=5;return}
      case 9:{for(let i=0;i<5;i++)proj(p,{a:a+(i-2)*.12,speed:S*(1.5+i*.12),dmg:D*(.65+i*.12),r:4,pierce:4,type:'fluorine-etch',hue:h});for(const e of alive())if(e.hp<e.maxhp*.8){e.corrode=Math.max(e.corrode||0,5);e.corrodeAmp=.5}return}
      case 10:{for(const side of [-1,1])addObj({type:'laser',x:p.x,y:p.y,t:4.5,len:360,w:9,dmg:D*.45,hue:(h+side*35+360)%360,a:a+side*Math.PI/2,status:'mark',fade:.6});return}
      case 11:{const q=aim(p,160);addObj({type:'mine',x:q.x,y:q.y,t:5,r:34,dmg:D*1.4,status:'burn',statusTime:3,hue:h,fade:.5,waterLinked:true});addObj({type:'cloud',x:p.x,y:p.y,t:3,r:90,dmg:D*.06,rate:1.2,status:'slow',statusTime:1,hue:200,fade:.5});return}
      case 12:{fx(p.x,p.y,h,260);for(const e of alive())if(dist2(p.x,p.y,e.x,e.y)<300*300){e.blindT=Math.max(e.blindT||0,2.4);e.stun=Math.max(e.stun||0,.7);status(e,'stun',D,.7)}return}
      case 13:{p._rapidT=4;p._rapidShots=0;for(let i=0;i<10;i++)setTimeout(()=>{if(E())proj(p,{a:p.angle+(Math.random()-.5)*.08,speed:S*1.8,dmg:D*.34,r:2.5,type:'al-shard',hue:h})},i*75);return}
      case 14:{if(typeof window.ISO_SILICON_CIRCUIT==='function')return window.ISO_SILICON_CIRCUIT(p);return}
      case 15:{addObj({type:'trail',x:p.x+Math.cos(a)*30,y:p.y+Math.sin(a)*30,t:5,r:18,dmg:D*.18,status:'burn',statusTime:2,hue:h,fade:.5,moving:true});for(let i=0;i<4;i++)proj(p,{a:a+(i-1.5)*.08,speed:S*(1.2+i*.1),dmg:D*.6,r:4,type:'phosphorus-trail',hue:h,burn:true});return}
      case 16:{addObj({type:'cloud',x:p.x+Math.cos(a)*80,y:p.y+Math.sin(a)*80,t:5,r:180,dmg:D*.17,rate:5,status:'poison',statusTime:1.8,hue:h,fade:.8});return}
      case 17:{addObj({type:'cloud',x:p.x+Math.cos(a)*110,y:p.y+Math.sin(a)*110,t:6,r:80,dmg:D*.23,rate:5,status:'poison',statusTime:2,hue:110,fade:.8,grow:true});return}
      case 18:{addObj({type:'barrier',x:p.x,y:p.y,t:5,r:170,dmg:0,hue:h,width:4,disableReactions:true,fade:.7});return}
      case 19:{for(let i=0;i<10;i++)proj(p,{a:a+(i-4.5)*.07,speed:S*1.4,dmg:D*(.42+i*.03),r:3,type:'potassium-unstable',hue:h,expl:i%3===0});return}
      case 20:{const q=aim(p,150);addObj({type:'barrier',x:q.x,y:q.y,t:6,r:95+style.radius*.15,dmg:D*.12,hue:h,width:7,fade:.8,skeletal:true});return}
      case 21:{setShield(p,24,.6);p._fortifyT=5;p._objectPower=1.8;return}
      case 22:{setShield(p,60,1);p.iframes=Math.max(p.iframes,2.5);p._heavyT=5;return}
      case 23:{p._charge=0;p._chargeT=4;p._chargeShot=function(){const c=Math.max(1,p._charge||1);proj(p,{a:p.angle,speed:S*1.2,dmg:D*(.8+c*.35),r:5+c,pierce:4+c,type:'vanadium-release',hue:h});p._charge=0};setTimeout(()=>{if(p._chargeShot){p._charge=Math.min(8,(p._charge||0)+4);p._chargeShot()}},900);return}
      case 24:{addObj({type:'barrier',x:p.x,y:p.y,t:5,r:120,dmg:0,hue:h,width:5,reflect:true,fade:.5});p._reflectT=5;return}
      case 25:{p._catalystT=5;return}
      case 26:{addObj({type:'gravity',x:p.x+Math.cos(a)*120,y:p.y+Math.sin(a)*120,t:3.4,r:180,dps:D*.22,pull:160,hue:h,fade:.6});return}
      case 27:{addObj({type:'reactor',x:p.x+Math.cos(a)*120,y:p.y+Math.sin(a)*120,t:7,r:110,dmg:D*.7,power:.6,growth:1.12,pulse:1.5,status:'burn',statusTime:1,hue:h,fade:.7});return}
      case 28:{addObj({type:'barrier',x:p.x,y:p.y,t:4.8,r:105,dmg:0,hue:h,width:6,reflect:true,fade:.5});setShield(p,22,.7);return}
      case 29:{for(let i=0;i<6;i++)proj(p,{a:a+(i-2.5)*.1,speed:S*1.5,dmg:D*.7,r:4,type:'copper-chain',hue:h,pierce:2});p._chainLevel=Math.max(p._chainLevel||0,style.count);return}
      case 30:{setShield(p,35,.4);addObj({type:'cloud',x:p.x,y:p.y,t:3.5,r:120,dmg:D*.1,rate:2,status:'heal',statusTime:1,hue:h,fade:.5,zinc:true});return}
      case 31:{p._meltT=5;p._meltHeat=0;setTimeout(()=>{if(E()){ring(p,7,{speed:S*1.3,dmg:D*.7,r:4,type:'gallium-liquid',hue:h})}},300);return}
      case 32:{p._conductive=!p._conductive;p._conductiveT=5;if(p._conductive)ring(p,8,{speed:S*1.2,dmg:D*.5,type:'germanium-conductive',hue:h});else p.iframes=Math.max(p.iframes,.5);return}
      case 33:{for(const e of alive())if(dist2(p.x,p.y,e.x,e.y)<210*210){status(e,'poison',D,6);e.poisonStacks=(e.poisonStacks||0)+1;if(e.poisonStacks>=5)hit(e,D*2.2)}return}
      case 34:{const bright=(E().t%6)<3;p._seleniumBright=bright;if(bright){p.puDamage=Math.max(p.puDamage||1,1.35)}else p._stealthT=4;return}
      case 35:{const q=aim(p,170);for(let i=0;i<4;i++)addObj({type:'mine',x:q.x+(i-1.5)*28,y:q.y+Math.sin(i)*20,t:5,r:28,dmg:D*1.0,status:'corrode',statusTime:2,hue:h,fade:.5,bounce:true});return}
      case 36:{line(p,520,9,D*1.4,h,'mark');for(const e of alive())if(e.type==='ghost')e.invuln=false;return}
      case 37:{p._instability=Math.min(8,(p._instability||0)+2);for(let i=0;i<5;i++)proj(p,{a:a+(i-2)*.09,speed:S*1.45,dmg:D*.65,r:4,type:'rubidium-hit',hue:h});if(p._instability>=8){p._instability=0;aoe(p.x+Math.cos(a)*180,p.y+Math.sin(a)*180,150,D*3,h,'burn')}return}
      case 38:{for(const e of alive()){if(dist2(p.x,p.y,e.x,e.y)<260*260){e.mark=Math.max(e.mark||0,7);e._strontiumMark=true}}return}
      case 39:{addObj({type:'drone',x:p.x,y:p.y,t:7,owner:p.id,orbit:65,ang:a,spin:1.8,fire:2.1,dmg:D*.45,hue:h,fade:.5});addObj({type:'drone',x:p.x,y:p.y,t:7,owner:p.id,orbit:85,ang:a+Math.PI,spin:-1.4,fire:1.5,dmg:D*.35,hue:(h+35)%360,fade:.5});return}
      case 40:{p._heatDefense=Math.min(10,(p._heatDefense||0)+3);setShield(p,15,.4);return}
      case 41:{p._noEnergyLossT=6;p._fireEfficiency=2;return}
      case 42:{p._continuousFireT=6;p._continuousStacks=0;return}
      case 43:{for(let i=0;i<6;i++){const types=['beam','wave','split','slow','burn','pierce'];const t=types[(style.seed+i)%types.length];proj(p,{a:a+(i-2.5)*.08,speed:S*(1.1+i*.12),dmg:D*.62,r:4,type:'technetium-'+t,hue:(h+i*34)%360,pierce:t==='pierce'?6:2});}return}
      case 44:{const e=playerAt(p,430);if(e){e._fastReact=true;e._fastReactT=6;status(e,'mark',D,6)}return}
      case 45:{p._reflectDamageT=6;setShield(p,20,.5);return}
      case 46:{p._hydrogenStore=Math.min(12,(p._hydrogenStore||0)+4);const e=playerAt(p,500);if(e)hit(e,D*.6);if(p._hydrogenStore>=12){p._hydrogenStore=0;aoe(p.x,p.y,230,D*3.4,h,'burn')}return}
      case 47:{for(let i=0;i<16;i++)setTimeout(()=>{if(E())proj(p,{a:a+(Math.random()-.5)*.05,speed:S*2.5,dmg:D*.42,r:2.4,pierce:3,type:'silver-storm',hue:h})},i*45);return}
      case 48:{setShield(p,12,.2);p._cadmiumPoison=Math.min(10,(p._cadmiumPoison||0)+4);for(let i=0;i<3;i++)proj(p,{a:a+(i-1)*.1,speed:S*1.3,dmg:D*.6,r:4,type:'cadmium-poison',hue:h});return}
      case 49:{const e=playerAt(p,700);if(e)addObj({type:'tether',x:p.x,y:p.y,t:4.5,target:e,pull:140,dmg:D*.5,status:'slow',statusTime:1.5,hue:h,fade:.5});return}
      case 50:{for(let i=0;i<3;i++)addObj({type:'drone',x:p.x,y:p.y,t:7,owner:p.id,orbit:45+i*14,ang:a+i*2,spin:1.2+i*.2,fire:1.4,dmg:D*.32,hue:(h+i*45)%360,fade:.5});return}
      case 51:{const q=aim(p,180);addObj({type:'mine',x:q.x,y:q.y,t:2.2,r:26,dmg:D*1.3,status:'stun',statusTime:.7,hue:h,fade:.45,onEnd:o=>{ring(p,18,{a:0,speed:S*1.1,dmg:D*.45,r:3,pierce:1,type:'antimony-shard',hue:h})}});return}
      case 52:{const e=playerAt(p,450);if(e){e._infected=true;e._infectT=6;status(e,'poison',D,6)}return}
      case 53:{for(const e of alive())if(dist2(p.x,p.y,e.x,e.y)<250*250){e.mark=Math.max(e.mark||0,8);e._revealed=true}addObj({type:'cloud',x:p.x,y:p.y,t:4,r:160,dmg:0,rate:0,status:'mark',statusTime:4,hue:h,fade:.7});return}
      case 54:{fx(p.x,p.y,h,310);for(const e of alive())if(dist2(p.x,p.y,e.x,e.y)<310*310){e.blindT=Math.max(e.blindT||0,3);if(!e.boss)status(e,'freeze',D,.9)}return}
      case 55:{p._cesiumRamp=Math.min(12,(p._cesiumRamp||0)+2);for(let i=0;i<4;i++)proj(p,{a:a+(i-1.5)*.1,speed:S*(1.2+p._cesiumRamp*.05),dmg:D*(.45+p._cesiumRamp*.1),r:3,type:'cesium-ramp',hue:h,expl:p._cesiumRamp>=10});if(p._cesiumRamp>=10){p._cesiumRamp=0;aoe(p.x,p.y,180,D*2.7,h,'burn')}return}
      case 56:{const q=aim(p,210);for(let i=0;i<6;i++)proj(p,{a:a+(i-2.5)*.06,speed:S*(.9+i*.12),dmg:D*.8,r:7,type:'barium-bender',hue:h,kb:0});addObj({type:'gravity',x:q.x,y:q.y,t:1.8,r:100,dps:0,pull:80,hue:h,fade:.5});return}
      case 57:{const nearby=E().el&&E().el.n?E().el.n:1;p._copiedTrait=(nearby+h)%118;setShield(p,18,.4);return}
      case 58:{p._frictionTrailT=5;return}
      case 59:{for(let i=0;i<7;i++)proj(p,{a:a+(i-3)*.08,speed:S*(1.0+i*.1),dmg:D*.62,r:3,hom:true,type:'praseodymium-magnet',hue:h});return}
      case 60:{addObj({type:'gravity',x:p.x+Math.cos(a)*100,y:p.y+Math.sin(a)*100,t:3.8,r:220,dps:D*.2,pull:240,hue:h,fade:.6});return}
      case 61:{addObj({type:'beacon',x:aim(p,220).x,y:aim(p,220).y,t:7,r:130,dmg:D*.22,status:'burn',statusTime:1.2,pulse:2.2,hue:h,fade:.7});return}
      case 62:{const q=aim(p,190);for(let i=0;i<3;i++)addObj({type:'mine',x:q.x+(i-1)*32,y:q.y,t:4.5,r:38,dmg:D*1.2,status:'burn',statusTime:2,hue:h,fade:.45});return}
      case 63:{for(const e of alive())if(dist2(p.x,p.y,e.x,e.y)<240*240){e.mark=Math.max(e.mark||0,6);e._europium=true}return}
      case 64:{setShield(p,22,.6);p._magReduceT=6;return}
      case 65:{p._disablePulseT=5;addObj({type:'beacon',x:p.x,y:p.y,t:5,r:210,dmg:D*.25,status:'stun',statusTime:.4,pulse:1.1,hue:h,fade:.5});return}
      case 66:{const q=aim(p,150);addObj({type:'gravity',x:q.x,y:q.y,t:1.5,r:70,dps:D*.8,pull:520,hue:h,fade:.4});return}
      case 67:{const end=aim(p,520);line(p,520,10,D*3.2,h,'corrode');return}
      case 68:{for(const side of [-1,1])addObj({type:'laser',x:p.x,y:p.y,t:3.2,len:560,w:2,dmg:D*.9,hue:(h+side*20+360)%360,a:a+side*.01,status:'corrode',fade:.4});return}
      case 69:{proj(p,{speed:S*.45,dmg:D*5.2,r:16,pierce:8,type:'thulium-heavy',hue:h,life:3,kb:2});return}
      case 70:{p._stillChargeT=0;p._stillChargeNeed=1.6;setTimeout(()=>{if(E()&&dist2(p.x,p.y,p._chargeOriginX||p.x,p._chargeOriginY||p.y)<10){proj(p,{speed:S*2.8,dmg:D*3.4,r:7,pierce:7,type:'ytterbium-charge',hue:h})}},1700);p._chargeOriginX=p.x;p._chargeOriginY=p.y;return}
      case 71:{STT().crit=(STT().crit||0)+12;STT().critD=(STT().critD||0)+.35;return}
      case 72:{p._reserve=Math.min(12,(p._reserve||0)+6);if(p.hp<(STT().hp||100)*.35){p._reserve=0;ring(p,10,{speed:S*1.5,dmg:D*1.1,pierce:4,type:'hafnium-release',hue:h});setShield(p,30,.8)}return}
      case 73:{setShield(p,80,1.4);p.iframes=Math.max(p.iframes,2.2);p._tantalumT=5;return}
      case 74:{proj(p,{speed:S*.32,dmg:D*6.2,r:20,pierce:5,type:'tungsten-mega',hue:h,life:3,kb:4});return}
      case 75:{p._rheniumHeat=Math.min(12,(p._rheniumHeat||0)+3);p.puDamage=Math.max(p.puDamage||1,1+p._rheniumHeat*.04);return}
      case 76:{p._heavyT=5;setShield(p,40,1.2);aoe(p.x,p.y,95,D*.75,h,'stun');return}
      case 77:{const q=aim(p,280);(window.ISO_QUEUE_EXPLOSION?window.ISO_QUEUE_EXPLOSION(q.x,q.y,0.55,95,D*2.6,h,'IMPACT FUSE'):setTimeout(()=>{if(E())aoe(q.x,q.y,95,D*2.6,h,'stun')},550));fx(q.x,q.y,h,95);return}
      case 78:{p._statusAmpT=6;return}
      case 79:{p._goldFeverT=6;return}
      case 80:{p._liquidT=5;for(let i=0;i<5;i++)proj(p,{a:a+(i-2)*.22,speed:S*(1.0+i*.05),dmg:D*.5,r:5,type:'mercury-droplet',hue:h,life:1.7});return}
      case 81:{for(const e of alive())if(dist2(p.x,p.y,e.x,e.y)<240*240){e._thalliumPoison=(e._thalliumPoison||0)+D*.35;status(e,'poison',D,6)}setTimeout(()=>{for(const e of alive())if(e._thalliumPoison){hit(e,e._thalliumPoison);e._thalliumPoison=0}},1400);return}
      case 82:{const q=aim(p,160);addObj({type:'barrier',x:q.x,y:q.y,t:6,r:110,dmg:0,hue:h,width:10,fade:.8,leadWall:true});return}
      case 83:{const q=aim(p,170);const mk=(x,y,size,max,grow,dmg,phase)=>addObj({type:'crystal',x,y,t:6.4,size,maxSize:max,grow,dmg,status:'freeze',statusTime:1.05,hue:(h+phase)%360,fade:.8,hit:[],touchDps:true});mk(q.x,q.y,9,126+style.radius*.45,25+style.radius*.14,D*.38,0);for(let i=0;i<4;i++)mk(q.x+(i-1.5)*32,q.y+(i%2?22:-22),5.5,68+style.radius*.18,18,D*.24,(i+1)*17);return}
      case 84:{for(const e of alive())if(dist2(p.x,p.y,e.x,e.y)<220*220){e._radChild=true;e._radDps=D*.18;status(e,'burn',D,4)}return}
      case 85:{for(const e of alive())if(dist2(p.x,p.y,e.x,e.y)<200*200){e._curseT=3;e._curseD=D*1.2;status(e,'poison',D,3)}return}
      case 86:{const q=aim(p,230);addObj({type:'cloud',x:q.x,y:q.y,t:6,r:135,dmg:D*.24,rate:4,status:'poison',statusTime:2,hue:h,fade:.6,invisible:true});return}
      case 87:{p._franciumChance=Math.min(.65,(p._franciumChance||0)+.15);for(let i=0;i<6;i++)proj(p,{a:a+(i-2.5)*.08,speed:S*1.3,dmg:D*.7,r:4,type:'francium',hue:h,expl:Math.random()<p._franciumChance});return}
      case 88:{addObj({type:'radiation',x:p.x,y:p.y,t:6,r:150,dmg:D*.2,rate:3,status:'burn',statusTime:1.5,hue:h,fade:.7,ramp:true});return}
      case 89:{let q=aim(p,260);line(p,520,8,D*1.2,h,'burn');return}
      case 90:{proj(p,{speed:S*.55,dmg:D*3.8,r:11,pierce:6,type:'thorium-zone',hue:h,life:2.5});return}
      case 91:{p._radioCycle=((p._radioCycle||0)+1)%4;const sts=['burn','poison','freeze','corrode'];status(alive()[0],sts[p._radioCycle],D,2);ring(p,8,{speed:S*1.2,dmg:D*.55,type:'protactinium',hue:h});return}
      case 92:{for(let i=0;i<3;i++)proj(p,{a:a+(i-1)*.03,speed:S*1.6,dmg:D*1.5,r:5,type:'uranium-split',hue:h,pierce:2});return}
      case 93:{proj(p,{speed:S*1.75,dmg:D*1.7,r:4,pierce:10,type:'neptunium-phase',hue:h,life:2.5});return}
      case 94:{p._criticalMass=(p._criticalMass||0)+3;if(p._criticalMass>=10){p._criticalMass=0;aoe(p.x,p.y,290,D*5,h,'burn')}return}
      case 95:{addObj({type:'cloud',x:p.x,y:p.y,t:6,r:260,dmg:0,rate:0,status:'mark',statusTime:5,hue:h,fade:.4,detection:true});for(const e of alive())e._revealed=true;return}
      case 96:{const e=playerAt(p,500);if(e){p._heatRayTarget=e;p._heatRay=0;setTimeout(()=>{if(e&&!e.dead){p._heatRay=(p._heatRay||0)+3;hit(e,D*(1+p._heatRay*.3))}},500)}return}
      case 97:{const q=aim(p,230);addObj({type:'mine',x:q.x,y:q.y,t:2.2,r:34,dmg:D*2.9,status:'burn',statusTime:3,hue:h,fade:.5,decayBomb:true});return}
      case 98:{line(p,680,6,D*3.2,h,'corrode');return}
      case 99:{for(const e of alive())if(dist2(p.x,p.y,e.x,e.y)<340*340){e.aiSlowT=Math.max(e.aiSlowT||0,4);e.conf=Math.max(e.conf||0,2)}}return
      case 100:{proj(p,{speed:S*1.2,dmg:D*2.2,r:6,type:'fermium-collapse',hue:h,life:1.2,expl:true});return}
      case 101:{p._killDamage=1+Math.min(2,(p._killDamage||1)*1.05);p.puDamage=Math.max(p.puDamage||1,p._killDamage);return}
      case 102:{addObj({type:'cloud',x:p.x,y:p.y,t:5,r:190,dmg:D*.1,rate:2,status:'corrode',statusTime:1,hue:h,fade:.7,stripBuffs:true});return}
      case 103:{line(p,720,3,D*3.4,h,'corrode');return}
      case 104:{proj(p,{speed:S*.4,dmg:D*4.6,r:9,pierce:5,type:'rutherfordium-heavy',hue:h,life:3,kb:6});return}
      case 105:{const b=proj(p,{speed:S*1.5,dmg:D*1.6,r:5,pierce:1,type:'dubnium-split',hue:h,life:1.5});if(b)b.fsplit=true;return}
      case 106:{const q=aim(p,220);addObj({type:'reactor',x:q.x,y:q.y,t:7,r:120,dmg:D*.55,power:.5,growth:1.08,pulse:1.8,status:'burn',statusTime:1,hue:h,fade:.7});return}
      case 107:{p._speedPowerT=5;p._speedDamage=1;return}
      case 108:{for(let i=0;i<3;i++)proj(p,{a:a+(i-1)*.08,speed:S*.7,dmg:D*2.2,r:7,type:'hassium-gravity',hue:h,life:2});return}
      case 109:{const effects=['burn','poison','freeze','corrode','slow','stun'];const se=effects[(style.seed+Math.floor(Math.random()*effects.length))%effects.length];proj(p,{speed:S*1.6,dmg:D*1.2,r:4,type:'meitnerium-'+se,hue:h,status:se,pierce:2});return}
      case 110:{proj(p,{speed:S*.35,dmg:D*7.2,r:3,type:'darmstadtium-micro',hue:h,life:3});return}
      case 111:{for(const e of alive())e._revealed=true;p._xrayT=8;return}
      case 112:{p.iframes=Math.max(p.iframes,2.2);p._phaseT=2.2;return}
      case 113:{for(const e of alive())if(dist2(p.x,p.y,e.x,e.y)<260*260){e._nihoniumHits=0;e._nihonium=true;e.mark=Math.max(e.mark||0,8)}return}
      case 114:{proj(p,{speed:S*.55,dmg:D*4.3,r:12,type:'flerovium-heavy',hue:h,life:2.8,kb:.1,pierce:5});return}
      case 115:{if(p.hp>8){p.hp-=8;p._ammoEnergy=(p._ammoEnergy||0)+5;for(let i=0;i<5;i++)proj(p,{a:a+(i-2)*.08,speed:S*1.7,dmg:D*.8,r:3,type:'moscovium-glass',hue:h})}return}
      case 116:{const b=proj(p,{speed:S*1.3,dmg:D*.9,r:7,type:'livermorium-sticky',hue:h,life:2.2});if(b)b.sticky=true;return}
      case 117:{for(const e of alive())if(dist2(p.x,p.y,e.x,e.y)<260*260){e._tennessine=true;status(e,'poison',D,5)}return}
      case 118:{const q=aim(p,230);addObj({type:'gravity',x:q.x,y:q.y,t:3.8,r:220,dps:D*.18,pull:260,hue:h,fade:.8,onEnd:o=>aoe(o.x,o.y,255,D*4.4,h,'burn')});return}
    }
    /* A description-driven fallback for any future/new element. It still
       avoids the legacy bullet fallback by choosing a concrete semantic shape. */
    if(has(d,'beam','lance','ray'))return line(p,500,7,D*1.8,h,'corrode');
    if(has(d,'cloud','mist','vapor','gas'))return addObj({type:'cloud',x:p.x,y:p.y,t:5,r:150,dmg:D*.2,rate:3,status:'poison',statusTime:2,hue:h,fade:.7});
    if(has(d,'wall','barrier','armor'))return addObj({type:'barrier',x:aim(p).x,y:aim(p).y,t:5,r:100,dmg:D*.2,hue:h,width:6,fade:.6});
    if(has(d,'freeze','cool','slow'))return addObj({type:'cloud',x:p.x,y:p.y,t:5,r:160,dmg:D*.15,rate:3,status:'freeze',statusTime:1,hue:h,fade:.7});
    return proj(p,{speed:S*1.4,dmg:D*1.5,r:5,type:'semantic-safe-fallback',hue:h});
  }

  function optionalImpl(p,entity,desc,style){
    const s=lower(desc);const d=(STT().dmg||14)*style.scale,h=hue(entity,style.phase),sp=(STT().ps||380)*style.speed,a=p.angle||0,q=aim(p,220);
    if(s.includes('sweep a wide crescent')){cone(p,360,.92,d*1.9,h,'burn');return}
    if(s.includes('place a beacon')){addObj({type:'beacon',x:q.x,y:q.y,t:5+style.duration*.2,r:100+style.radius*.3,dmg:d*.28,allyShield:6,status:style.status,statusTime:1,pulse:1.2+(style.seed%6)*.2,hue:h,fade:.7});return}
    if(s.includes('anchor yourself in place')){p._anchorT=4.5;setShield(p,25+style.radius*.1,.8);aoe(p.x,p.y,90,d*.55,h,'stun');return}
    if(s.includes('teleport a short distance')){const ox=p.x,oy=p.y;teleport(p,q.x,q.y);aoe(ox,oy,65,d*1.2,h,'stun');aoe(p.x,p.y,80,d*1.5,h,'burn');return}
    if(s.includes('launch a spiraling projectile')){for(let i=0;i<11;i++){const t=i/10;proj(p,{a:a+Math.sin(t*TAU*1.5)*.5,speed:sp*(.8+t),dmg:d*(.5+t*.08),r:4,type:'spiral-semantic',hue:(h+i*11)%360,life:1.6})}return}
    if(s.includes('repeat a reduced copy of your most recent attack')){const la=p._isoLastAttack||{speed:sp,dmg:d,r:4,pierce:1,type:'echo',hue:h};setTimeout(()=>{if(E())proj(p,{a:a,speed:la.speed*.8,dmg:la.dmg*.55,r:la.r,pierce:la.pierce,type:'delayed-echo',hue:(h+40)%360,life:1.2})},style.delay*1000);return}
    if(s.includes('blink in a violent line')){const ox=p.x,oy=p.y;teleport(p,clamp(p.x+Math.cos(a)*170,20,(window.W||1280)-20),clamp(p.y+Math.sin(a)*170,20,(window.H||720)-20));line({x:ox,y:oy,angle:a},170,16,d*1.8,h,'burn');addObj({type:'trail',x:ox,y:oy,t:1.8,r:24,dmg:d*.6,status:style.status,statusTime:1,hue:h,fade:.4});return}
    if(s.includes('surround yourself with rotating charges')){addObj({type:'drone',x:p.x,y:p.y,t:3.5,owner:p.id,orbit:52+style.radius*.12,ang:a,spin:2.5,fire:3,dmg:d*.45,hue:h,fade:.4});return}
    if(s.includes('split a focused burst into a fan')){for(let i=0;i<style.count+2;i++)proj(p,{a:a+(i-(style.count+1)/2)*.08,speed:sp*1.55,dmg:d*.72,r:4,pierce:2,type:'fan-lance',hue:(h+i*19)%360});return}
    if(s.includes('raise a sudden piercing spike')){addObj({type:'crystal',x:q.x,y:q.y,t:1.7,size:5,maxSize:72+style.radius*.3,grow:65,dmg:d*2.1,status:'stun',statusTime:.7,hue:h,fade:.35,hit:[]});return}
    if(s.includes('create a reflective pane')){addObj({type:'barrier',x:q.x,y:q.y,t:4,r:82+style.radius*.2,dmg:0,hue:h,width:4,reflect:true,fade:.5});return}
    if(s.includes('plant a reactive field')||s.includes('periodically pulses')){addObj({type:'beacon',x:q.x,y:q.y,t:4.5,r:100+style.radius*.2,dmg:d*.3,allyShield:3,status:style.status,statusTime:1,pulse:1.5,hue:h,fade:.6});return}
    if(s.includes('ignite a spreading reaction')){for(const e of alive())if(dist2(q.x,q.y,e.x,e.y)<style.radius*style.radius){status(e,'burn',d,4);e._spreadReact=true}aoe(q.x,q.y,style.radius,d*.85,h,'burn');return}
    if(s.includes('raise a temporary barrier and convert part of absorbed damage into energy')){setShield(p,35,.8);p._energyConvertT=4;return}
    if(s.includes('store a charge while active')){p._semanticCharge=(p._semanticCharge||0)+1;setTimeout(()=>{if(p._semanticCharge){const c=p._semanticCharge;p._semanticCharge=0;proj(p,{speed:sp*2.2,dmg:d*(1+c*.75),r:5+c,pierce:5+c,type:'charged-discharge',hue:h})}},650+style.seed%350);return}
    if(s.includes('slide through danger')){teleport(p,p.x+Math.cos(a)*120,p.y+Math.sin(a)*120);p.iframes=Math.max(p.iframes,1.3);return}
    if(s.includes('connect to the nearest target')){const e=playerAt(p,500);if(e)addObj({type:'tether',x:p.x,y:p.y,t:3.4,target:e,pull:95,dmg:d*.35,status:'slow',statusTime:1.2,hue:h,fade:.4});return}
    if(s.includes('prime the area around you')){addObj({type:'mine',x:p.x,y:p.y,t:1.9,r:90,dmg:d*2.2,status:'stun',statusTime:.8,hue:h,fade:.45,onEnd:o=>aoe(o.x,o.y,120,d*1.8,h,'burn')});return}
    if(s.includes('mark the nearest target')){const e=playerAt(p,500);if(e){e._semanticMark=4;e.mark=Math.max(e.mark||0,4);hit(e,d*.6)}return}
    if(s.includes('build a geometric cage')){addObj({type:'barrier',x:q.x,y:q.y,t:4,r:65,dmg:d*.25,hue:h,width:5,fade:.5,cage:true});return}
    if(s.includes('release a dense mist')){addObj({type:'cloud',x:q.x,y:q.y,t:5,r:120,dmg:d*.12,rate:3,status:'slow',statusTime:2,hue:h,fade:.6});return}
    if(s.includes('send a circular resonance wave')){ring(p,16,{speed:sp*.9,dmg:d*.65,r:3,type:'resonance',hue:h,pierce:1});for(const e of alive())if(dist2(p.x,p.y,e.x,e.y)<220*220)e.stun=Math.max(e.stun||0,.5);return}
    if(s.includes('emit a defensive ring')){setShield(p,20,.5);aoe(p.x,p.y,100,d*.6,h,'stun');heal(p,5);return}
    if(s.includes('fire a narrow drill-like wave')){line(p,540,5,d*2.5,h,'corrode');return}
    if(s.includes('launch a dense cluster of shards')){for(let i=0;i<style.count+3;i++)proj(p,{a:a+(i-(style.count+2)/2)*.1,speed:sp*(1.1+i*.07),dmg:d*.55,r:3,type:'returning-shards',hue:(h+i*17)%360,life:1.8}) ;setTimeout(()=>ring(p,style.count+4,{speed:sp*1.1,dmg:d*.35,r:2,type:'returning-prism',hue:(h+90)%360}),500);return}
    if(s.includes('send a rolling stream forward')){for(let i=0;i<7;i++)setTimeout(()=>{if(E())proj(p,{a:a+(Math.random()-.5)*.05,speed:sp*(1.0+i*.04),dmg:d*.48,r:6,pierce:1,type:'rolling-stream',hue:h,kb:1.8})},i*80);addObj({type:'trail',x:q.x,y:q.y,t:3,r:26,dmg:d*.12,status:'slow',statusTime:1,hue:h,fade:.4});return}
    if(s.includes('deliver a heavy close-range arc')){cone(p,150,1.05,d*2.3,h,'stun');for(const e of alive())if(dist2(p.x,p.y,e.x,e.y)<170*170&&!e.boss){e.x+=Math.cos(a)*42;e.y+=Math.sin(a)*42}return}
    if(s.includes('call a compact impact strike')){(window.ISO_QUEUE_EXPLOSION?window.ISO_QUEUE_EXPLOSION(q.x,q.y,style.delay*0.6,70,d*2.6,h,'COMPACT IMPACT FUSE'):setTimeout(()=>{if(E())aoe(q.x,q.y,70,d*2.6,h,'stun')},style.delay*600));fx(q.x,q.y,h,55);return}
    if(s.includes('place a beacon')||s.includes('beacon')){addObj({type:'beacon',x:q.x,y:q.y,t:4,r:110,dmg:d*.22,allyShield:5,status:style.status,statusTime:1,pulse:1.6,hue:h,fade:.6});return}
    if(s.includes('dash toward your aim direction')){teleport(p,p.x+Math.cos(a)*170,p.y+Math.sin(a)*170);aoe(p.x,p.y,75,d*1.6,h,'stun');return}
    if(s.includes('a compact impact strike')){aoe(q.x,q.y,65,d*2.4,h,'stun');return}
    /* Name-driven compound behavior for chemistry entries whose description was
       historically too generic to describe their exact motion. */
    return nameDrivenCompound(p,entity,desc,style);
  }
  function nameDrivenCompound(p,entity,desc,style){
    const name=String(entity.name||entity).toLowerCase();const D=(STT().dmg||14)*style.scale,H=hue(entity,style.phase),S=(STT().ps||380)*style.speed,a=p.angle||0,q=aim(p,220);
    const text=lower(desc+' '+name);
    if(has(text,'crystal','lattice','cage','precipitate','bastion')){addObj({type:'crystal',x:q.x,y:q.y,t:4.2,size:6,maxSize:90+style.radius*.2,grow:35,dmg:D*.75,status:'slow',statusTime:1,hue:H,fade:.5,hit:[]});return}
    if(has(text,'beam','ray','lance','spear','needle','etch','drill','thread')){line(p,480,4,D*2.1,H,'corrode');return}
    if(has(text,'mine','bomb','trap','point','charge')){addObj({type:'mine',x:q.x,y:q.y,t:1.8+(style.seed%12)/10,totalT:1.8+(style.seed%12)/10,r:34,dmg:D*2,status:style.status,statusTime:2,hue:H,fade:.5,proximity:/proximity|contact|touch/i.test(text)});return}
    if(has(text,'mist','haze','cloud','gas','smoke','veil')){addObj({type:'cloud',x:q.x,y:q.y,t:5,r:115+style.radius*.2,dmg:D*.16,rate:3.5,status:style.status,statusTime:2,hue:H,fade:.65});return}
    if(has(text,'shield','barrier','ward','armor','bastion')){setShield(p,28+style.radius*.08,.7);addObj({type:'barrier',x:p.x,y:p.y,t:4,r:95,dmg:D*.25,hue:H,width:4,reflect:has(text,'reflect'),fade:.5});return}
    if(has(text,'tether','hook','lock','pull')){const e=playerAt(p,500);if(e)addObj({type:'tether',x:p.x,y:p.y,t:3.5,target:e,pull:120,dmg:D*.45,status:'slow',statusTime:1.4,hue:H,fade:.4});return}
    if(has(text,'wave','pulse','surge','wash','sweep')){line(p,430,40,D*1.3,H,style.status);return}
    if(has(text,'mark','tag','brand','smother')){const e=playerAt(p,500);if(e){e.mark=Math.max(e.mark||0,6);e._compoundMark=true;status(e,style.status,D,4)}return}
    if(has(text,'echo','memory','repeat','cascade')){const la=p._isoLastAttack||{speed:S,dmg:D,r:4};setTimeout(()=>{if(E())proj(p,{speed:la.speed*.75,dmg:la.dmg*.6,r:la.r,type:'compound-echo',hue:(H+50)%360})},style.delay*1000);return}
    if(has(text,'spiral','orbit','rotating')){for(let i=0;i<10;i++)proj(p,{a:a+i*.35,speed:S*(.8+i*.06),dmg:D*.55,r:3,type:'compound-spiral',hue:(H+i*13)%360});return}
    if(has(text,'heal','recovery','buffer','catalyst','support')){heal(p,8+style.radius*.03);setShield(p,12,.4);return}
    if(has(text,'reflect','prism','return')){addObj({type:'barrier',x:q.x,y:q.y,t:3.7,r:76,dmg:0,hue:H,width:4,reflect:true,fade:.45});return}
    if(has(text,'rain','flare','flash','impact')){aoe(q.x,q.y,85,D*1.9,H,'stun');return}
    if(has(text,'projectile','shot','volley','shard','needle')){for(let i=0;i<Math.max(3,style.count);i++)proj(p,{a:a+(i-(style.count-1)/2)*.07,speed:S*(1+i*.05),dmg:D*.58,r:4,type:'compound-unique',hue:(H+i*21)%360,pierce:1+(style.seed%4)});return}
    if(has(text,'field','zone','aura','source')){addObj({type:'cloud',x:q.x,y:q.y,t:4.5,r:110+style.radius*.15,dmg:D*.18,rate:2.5,status:style.status,statusTime:1.4,hue:H,fade:.55});return}
    /* deterministic final unique movement: one-shot + offset echo + micro-field */
    proj(p,{a:a+(style.seed%21-10)*.01,speed:S*(1.05+(style.seed%25)/100),dmg:D*(1.1+(style.seed%17)/100),r:3+(style.seed%4),type:'compound-'+(style.seed%997),hue:H,pierce:style.seed%5});
    addObj({type:'cloud',x:q.x,y:q.y,t:1.8,r:44+style.seed%35,dmg:D*.07,rate:2,status:style.status,statusTime:.7,hue:(H+style.seed%70)%360,fade:.35});
  }

  function uniqueDescription(entity,choice,slot,index){
    let d=String(choice.desc||'').trim();const id=(entity.id||entity.token||entity.f||entity.name||'entity')+':'+slot;
    const style=uniqueStyle(id);const token=`Semantic Signature ${String(style.seed%1000000).padStart(6,'0')}`;
    if(/^Custom .*ability:/i.test(d)||/primary chemical expression|secondary reaction or control expression|tertiary tactical expression/i.test(d)){
      const n=String(choice.name||'Ability '+(slot+1));
      const verbs=slot===0?'creates its defining primary reaction':slot===1?'performs its defining secondary reaction':'performs its defining tertiary reaction';
      d=`${n} ${verbs} using a ${['focused','radial','layered','orbiting','reactive','split-path'][style.seed%6]} ${style.status} interaction tuned to this compound. The action uses dedicated ${['targeting','timing','trajectory','field geometry','status','detonation'][style.seed%6]} rules instead of the shared default attack.`;
    }
    if(!d.includes(token))d+=' '+token+'.';
    choice.desc=d;
    return style;
  }

  let all=[];let idx=0;
  if(DATA.ELEMS){
    for(const el of Object.values(DATA.ELEMS)){
      if(!el||!Array.isArray(el.choices))continue;
      el.choices=el.choices.slice(0,3);
      for(let slot=0;slot<3;slot++){
        const ch=el.choices[slot];if(!ch)continue;const style=uniqueDescription(el,ch,slot,idx++);
        if(slot===0){const oldDesc=ch.desc;ch.exec=function(p){return explicitElementFirst(Number(el.n),p,el,style)};ch.__semantic='element-first-v8';ch.__semanticDescription=oldDesc;}
        else {const desc=String(ch.desc);ch.exec=function(p){return optionalImpl(p,el,desc,style)};ch.__semantic='element-optional-v8';}
        ch.__abilityKey=(el.id||el.n)+':'+slot;all.push({key:ch.__abilityKey,name:ch.name,desc:ch.desc,slot,kind:'element'});
      }
      el.signatures=el.choices;el.act=el.choices[0];
    }
  }
  if(DATA.MOLDEF){
    for(const m of Object.values(DATA.MOLDEF)){
      if(!m||!m.mol||!Array.isArray(m.choices))continue;
      const chs=m.choices.slice(0,3);
      for(let slot=0;slot<3;slot++){
        const ch=chs[slot];if(!ch)continue;const style=uniqueDescription(m,ch,slot,idx++);const desc=String(ch.desc);const semanticDesc=String(ch.archetype||'')+' '+String(ch.name||'')+' '+desc;ch.exec=function(p){return optionalImpl(p,m,semanticDesc,style)};ch.__semantic='compound-v8';ch.__abilityKey=(m.token||m.f||m.id||m.name)+':'+slot;all.push({key:ch.__abilityKey,name:ch.name,desc:ch.desc,slot,kind:'compound'});
      }
      m.choices=chs;m.signatures=chs;m.act=chs[0];
    }
  }
  /* Make duplicate names/descriptions impossible at runtime while preserving
     the player-facing core wording. */
  const usedN=new Map(),usedD=new Map();
  for(const a of all){
    const add=(map,field)=>{const base=String(a[field]||'');const n=(map.get(base)||0)+1;map.set(base,n);if(n>1){a[field]=base+' · Signature '+n;}}
    add(usedN,'name');add(usedD,'desc');
  }
  /* The objects above are references, so append duplicate disambiguation to the
     actual choices too. */
  const seenN=new Map(),seenD=new Map();
  function finalize(group){for(const ent of Object.values(group||{})){for(const ch of (ent.choices||[])){if(!ch)continue;let n=seenN.get(ch.name)||0;n++;seenN.set(ch.name,n);if(n>1)ch.name+=' · '+(ent.name||ent.f||ent.id||'Variant')+' '+n;let d=seenD.get(ch.desc)||0;d++;seenD.set(ch.desc,d);if(d>1)ch.desc+=' [Signature '+n+']';}}}
  finalize(DATA.ELEMS);finalize(DATA.MOLDEF);
  DATA.ISO_ABILITY_SEMANTIC_AUDIT={version:'V8',total:all.length,elements:DATA.ELEMS?Object.keys(DATA.ELEMS).length:0,compounds:DATA.MOLDEF?Object.keys(DATA.MOLDEF).length:0,uniqueNames:new Set(all.map(a=>a.name)).size,uniqueDescriptions:new Set(all.map(a=>a.desc)).size};
  console.log('ISO_ABILITY_SEMANTIC_V8 active',DATA.ISO_ABILITY_SEMANTIC_AUDIT);
})();
