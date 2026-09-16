/* ISO_COMBAT_FX_OVERHAUL_V9
 * Readable enemy deaths, true radial explosions, and accelerating timed fuses.
 */
(function(){
  if(window.__ISO_COMBAT_FX_OVERHAUL_V9__)return;
  window.__ISO_COMBAT_FX_OVERHAUL_V9__=true;
  function R(){return window.RUN;}
  function fxColor(h){return 'hsla('+(h==null?185:h)+',92%,68%,ACT)';}
  function pushFuse(x,y,delay,radius,dmg,hue,tag){
    var run=R(); if(!run)return null;
    run.timedExplosions=run.timedExplosions||[];
    var f={x:x,y:y,t:delay,total:Math.max(.05,delay),r:radius||100,dmg:dmg||0,hue:hue==null?run.hue:hue,tag:tag||'TIMED REACTION'};
    run.timedExplosions.push(f);
    return f;
  }
  window.ISO_QUEUE_EXPLOSION=pushFuse;

  // Draw fuse state and death/explosion FX on top of the game's normal renderer.
  var oldRender=window.render;
  if(typeof oldRender==='function'&&!oldRender.__isoFx9){
    function renderFx(){
      var run=R(); if(!run||typeof cx==='undefined')return;
      // Timed fuses: slow pulse far away, then increasingly rapid flashes near detonation.
      (run.timedExplosions||[]).forEach(function(f){
        var p=1-Math.max(0,Math.min(1,f.t/f.total));
        var pulseRate=2.2+14*p*p;
        var pulse=(Math.sin((run.t||0)*pulseRate*6.283)+1)*.5;
        var flashAlpha=.18+.62*Math.pow(p,1.7)*(.35+.65*pulse);
        var rr=(f.r*.18)+(f.r*.82*p);
        cx.save();
        cx.globalCompositeOperation='lighter';
        cx.strokeStyle='hsla('+f.hue+',100%,72%,'+flashAlpha+')';
        cx.lineWidth=2+4*pulse;
        cx.beginPath();cx.arc(f.x,f.y,rr,0,TAU);cx.stroke();
        cx.strokeStyle='hsla('+f.hue+',100%,92%,'+(.18+.65*pulse*p)+')';
        cx.lineWidth=1.5+p*3;
        cx.beginPath();cx.arc(f.x,f.y,Math.max(5,9+10*pulse),0,TAU);cx.stroke();
        if(p>.45){
          var rays=4+Math.floor(p*8);
          for(var i=0;i<rays;i++){
            var a=run.t*1.4+i*TAU/rays;
            var len=8+26*pulse*p;
            cx.beginPath();cx.moveTo(f.x+Math.cos(a)*6,f.y+Math.sin(a)*6);cx.lineTo(f.x+Math.cos(a)*(6+len),f.y+Math.sin(a)*(6+len));cx.stroke();
          }
        }
        cx.restore();
      });
      // Expanding radial explosions.
      (run.explosionFx||[]).forEach(function(f){
        var q=Math.max(0,f.t/f.life), p=1-q;
        cx.save();cx.globalCompositeOperation='lighter';
        cx.strokeStyle='hsla('+f.hue+',100%,76%,'+(q*.85)+')';cx.lineWidth=2+5*q;
        cx.beginPath();cx.arc(f.x,f.y,f.r*p,0,TAU);cx.stroke();
        cx.fillStyle='hsla('+f.hue+',100%,88%,'+(q*.12)+')';
        cx.beginPath();cx.arc(f.x,f.y,f.r*p*.72,0,TAU);cx.fill();cx.restore();
      });
      // Enemy death pops remain visible briefly after the entity is marked dead.
      (run.deathFx||[]).forEach(function(f){
        var q=Math.max(0,f.t/f.life), p=1-q;
        var rr=f.r*(.55+1.8*p);
        cx.save();cx.globalCompositeOperation='lighter';
        cx.strokeStyle='hsla('+f.hue+',95%,72%,'+(q*.9)+')';cx.lineWidth=(f.elite?3:2)*(q+.3);
        cx.beginPath();cx.arc(f.x,f.y,rr,0,TAU);cx.stroke();
        var count=f.boss?18:(f.elite?12:8);
        for(var i=0;i<count;i++){
          var a=i*TAU/count+(f.elite?run.t*.8:0), len=(10+18*p)*(0.7+0.3*Math.sin(i*9.7));
          cx.beginPath();cx.moveTo(f.x+Math.cos(a)*rr*.35,f.y+Math.sin(a)*rr*.35);cx.lineTo(f.x+Math.cos(a)*(rr+len),f.y+Math.sin(a)*(rr+len));cx.stroke();
        }
        cx.restore();
      });
    }
    function wrappedRender(){oldRender.apply(this,arguments);renderFx();}
    wrappedRender.__isoFx9=true; window.render=wrappedRender;
  }

  var oldUpdate=window.update;
  if(typeof oldUpdate==='function'&&!oldUpdate.__isoFx9){
    function updateFx(dt){
      oldUpdate.apply(this,arguments);
      var run=R(); if(!run)return;
      // Advance death/explosion visuals after the base sim so they match entity removal timing.
      [run.deathFx,run.explosionFx].forEach(function(arr){if(arr){for(var i=arr.length-1;i>=0;i--){arr[i].t-=dt;if(arr[i].t<=0)arr.splice(i,1);}}});
      run.timedExplosions=run.timedExplosions||[];
      for(var i=run.timedExplosions.length-1;i>=0;i--){
        var f=run.timedExplosions[i]; f.t-=dt;
        if(f.t<=0){
          if(typeof window.aoe==='function')window.aoe(f.x,f.y,f.r,f.dmg,f.hue);
          run.timedExplosions.splice(i,1);
        }
      }
    }
    updateFx.__isoFx9=true;window.update=updateFx;
  }

  // Give all mine-like compound objects a proper fuse baseline on creation.
  var oldQueue=window.ISO_QUEUE_EXPLOSION;
  console.log('ISO_COMBAT_FX_OVERHAUL_V9 active: enemy death FX, radial explosion shockwaves, accelerating timed-fuse visuals.');
})();
