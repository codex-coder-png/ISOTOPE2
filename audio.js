'use strict'; window.AUDIO = {};
(function () {
   let AC = null, sfxG, musG, track = 'menu', stepIdx = 0, nextT = 0;
   const irnd = n => Math.floor(Math.random() * n);
   const TRACKS = {
      menu: { step: .5, root: 110, bass: [0, null, null, null, 7, null, 5, null, 0, null, null, null, 3, null, 5, null], drum: 0, scale: [0, 3, 5, 7, 10], mel: .22, pad: 1 },
      combat: { step: .25, root: 110, bass: [0, 0, 12, 0, 0, 0, 10, 0, 0, 0, 12, 0, 7, 0, 5, 3], drum: 1, scale: [0, 3, 5, 7, 10, 12], mel: .5, pad: 0 },
      boss: { step: .21, root: 98, bass: [0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 1, 0, 12, 1, 3, 1], drum: 2, scale: [0, 1, 3, 5, 7, 8, 10], mel: .6, pad: 0 },
      boss_1: { step:.20, root:92, bass:[0,0,12,0,7,0,10,0,0,3,5,0,12,0,7,5], drum:2, scale:[0,1,3,5,7,8,10], mel:.68, pad:1 },
      boss_2: { step:.18, root:82, bass:[0,7,0,10,0,12,0,7,0,3,0,10,12,0,5,0], drum:2, scale:[0,2,3,5,7,9,10], mel:.72, pad:0 },
      boss_3: { step:.24, root:104, bass:[0,0,5,0,7,0,3,0,0,10,7,0,5,0,12,0], drum:2, scale:[0,3,4,7,8,10], mel:.55, pad:1 },
      boss_4: { step:.16, root:73, bass:[0,1,0,7,0,3,0,10,0,5,0,12,0,7,0,3], drum:2, scale:[0,1,2,5,7,8,11], mel:.8, pad:0 },
      boss_5: { step:.22, root:116, bass:[0,0,12,0,10,0,7,0,5,0,3,0,12,0,10,0], drum:2, scale:[0,2,5,7,9,10], mel:.62, pad:1 },
      boss_6: { step:.19, root:88, bass:[0,5,0,7,0,10,0,12,0,3,0,8,0,10,0,5], drum:2, scale:[0,1,4,5,7,8,10], mel:.74, pad:0 },
      boss_7: { step:.23, root:126, bass:[0,0,7,0,10,0,5,0,12,0,7,0,3,0,10,0], drum:2, scale:[0,2,3,5,8,10], mel:.66, pad:1 },
      boss_8: { step:.17, root:78, bass:[0,3,0,5,0,8,0,10,12,0,7,0,5,0,3,0], drum:2, scale:[0,1,3,6,7,9,10], mel:.78, pad:0 },
      boss_9: { step:.21, root:100, bass:[0,7,12,0,5,0,10,0,0,3,7,0,12,0,5,0], drum:2, scale:[0,2,4,7,9,11], mel:.7, pad:1 },
      boss_10:{ step:.15, root:69, bass:[0,12,0,10,0,7,0,5,0,3,0,1,12,0,10,0], drum:2, scale:[0,1,3,5,6,8,10], mel:.84, pad:0 },
      boss_11:{ step:.25, root:108, bass:[0,0,3,0,7,0,10,0,12,0,5,0,3,0,7,0], drum:2, scale:[0,3,5,6,7,10], mel:.58, pad:1 },
      boss_12:{ step:.20, root:86, bass:[0,5,0,8,0,12,0,7,0,10,0,3,12,0,8,0], drum:2, scale:[0,1,4,5,7,9,11], mel:.76, pad:0 },
      combat_1:{ step:.25, root:124, bass:[0,0,7,0,10,0,12,0,5,0,7,0,3,0,10,0], drum:1, scale:[0,2,3,5,7,9,10], mel:.52, pad:0 },
      combat_2:{ step:.22, root:132, bass:[0,5,0,7,12,0,3,0,10,0,5,0,12,0,7,0], drum:1, scale:[0,2,4,7,9,11], mel:.56, pad:1 },
      combat_3:{ step:.27, root:116, bass:[0,0,3,0,7,10,0,5,0,12,0,7,0,3,0,10], drum:1, scale:[0,3,5,7,8,10], mel:.46, pad:0 },
      combat_4:{ step:.20, root:105, bass:[0,7,0,10,0,12,3,0,7,0,5,0,10,0,12,0], drum:1, scale:[0,1,3,5,7,10], mel:.6, pad:1 },
      combat_5:{ step:.24, root:140, bass:[0,0,5,0,7,0,10,0,12,0,5,0,3,0,7,0], drum:1, scale:[0,2,5,7,9,10], mel:.5, pad:0 },
      combat_6:{ step:.23, root:118, bass:[0,3,0,8,0,10,12,0,5,0,7,0,3,0,10,0], drum:1, scale:[0,1,4,5,8,10,11], mel:.57, pad:1 }
   };
   function init() {
      if (AC) return; try {
         AC = new (window.AudioContext || window.webkitAudioContext)();
         const m = AC.createGain(); m.connect(AC.destination);
         sfxG = AC.createGain(); sfxG.connect(m); musG = AC.createGain(); musG.connect(m);
         nextT = AC.currentTime + .1; applyVol();
      } catch (e) { }
   }
   function applyVol() {
      if (!AC) return; sfxG.gain.value = SAVE.set.sfx / 100 * .5;
      musG.gain.value = SAVE.set.music ? SAVE.set.mus / 100 * .16 : 0
   }
   function setTrack(t) { if (track !== t) { track = t; stepIdx = 0; if (AC) nextT = AC.currentTime + .05 } }
   const hz = (r, s) => r * Math.pow(2, s / 12);
   const now = () => AC ? AC.currentTime : 0;
   const at = w => w !== undefined ? w : now();

   /* ---- low-level synthesis primitives ---- */
   function osc(f, d = .1, type = 'sine', v = .2, slide = 0, when) {
      if (!AC) return; const t = at(when);
      const o = AC.createOscillator(), g = AC.createGain(); o.type = type; o.frequency.setValueAtTime(f, t);
      if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, f + slide), t + d);
      g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(.0001, t + d);
      o.connect(g); g.connect(sfxG); o.start(t); o.stop(t + d + .03)
   }
   // linear-ramp oscillator: better for long rising/falling sweeps (risers, power-downs)
   function sweep(f0, f1, d = .3, type = 'sine', v = .15, when) {
      if (!AC) return; const t = at(when);
      const o = AC.createOscillator(), g = AC.createGain(); o.type = type;
      o.frequency.setValueAtTime(Math.max(20, f0), t);
      o.frequency.linearRampToValueAtTime(Math.max(20, f1), t + d);
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + Math.min(.04, d * .3));
      g.gain.linearRampToValueAtTime(.0001, t + d);
      o.connect(g); g.connect(sfxG); o.start(t); o.stop(t + d + .03)
   }
   // two detuned oscillators for a fatter "shape"
   function fatOsc(f, d = .12, type = 'sawtooth', v = .12, detune = 7, when) {
      if (!AC) return; const t = at(when);
      [-detune, detune].forEach(dt => {
         const o = AC.createOscillator(), g = AC.createGain(); o.type = type;
         o.frequency.setValueAtTime(f, t); o.detune.setValueAtTime(dt, t);
         g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(.0001, t + d);
         o.connect(g); g.connect(sfxG); o.start(t); o.stop(t + d + .03)
      })
   }
   // crude FM-style bell/blip: carrier amplitude-modulated by a second osc
   function fmBlip(f, ratio = 2.3, idx = 40, d = .18, v = .15, when) {
      if (!AC) return; const t = at(when);
      const car = AC.createOscillator(), mod = AC.createOscillator(), modG = AC.createGain(), g = AC.createGain();
      car.type = 'sine'; mod.type = 'sine'; mod.frequency.setValueAtTime(f * ratio, t); modG.gain.setValueAtTime(idx, t);
      mod.connect(modG); modG.connect(car.frequency); car.frequency.setValueAtTime(f, t);
      g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(.0001, t + d);
      car.connect(g); g.connect(sfxG); mod.start(t); car.start(t); mod.stop(t + d + .03); car.stop(t + d + .03)
   }
   function chord(freqs, d = .5, type = 'triangle', v = .06, when) {
      const t = at(when); freqs.forEach((f, i) => osc(f, d, type, v, 0, t + i * .012))
   }
   function arpeggio(freqs, step = .05, d = .14, type = 'square', v = .08, when) {
      const t = at(when); freqs.forEach((f, i) => osc(f, d, type, v, 0, t + i * step))
   }
   function mosc(f, d, type, v, when) {
      if (!AC) return; const o = AC.createOscillator(), g = AC.createGain(), fl = AC.createBiquadFilter();
      o.type = type; o.frequency.value = f; fl.type = 'lowpass'; fl.frequency.value = 900;
      g.gain.setValueAtTime(v, when); g.gain.exponentialRampToValueAtTime(.0001, when + d);
      o.connect(fl); fl.connect(g); g.connect(musG); o.start(when); o.stop(when + d + .03)
   }
   function noiseBuf(d) {
      const len = Math.max(1, Math.floor(AC.sampleRate * d)), buf = AC.createBuffer(1, len, AC.sampleRate), ch = buf.getChannelData(0);
      for (let i = 0; i < len; i++) ch[i] = Math.random() * 2 - 1;
      return buf;
   }
   function nz(d = .1, v = .15, fq = 1200, when) {
      if (!AC) return; const t = at(when);
      const s = AC.createBufferSource(); s.buffer = noiseBuf(d); const f = AC.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = fq;
      const g = AC.createGain(); g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(.0001, t + d);
      s.connect(f); f.connect(g); g.connect(sfxG); s.start(t); s.stop(t + d)
   }
   function nzHP(d = .1, v = .15, fq = 1200, when) {
      if (!AC) return; const t = at(when);
      const s = AC.createBufferSource(); s.buffer = noiseBuf(d); const f = AC.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = fq;
      const g = AC.createGain(); g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(.0001, t + d);
      s.connect(f); f.connect(g); g.connect(sfxG); s.start(t); s.stop(t + d)
   }
   // filter-swept noise: whoosh / teleport / warp shapes
   function nzSweep(d = .3, v = .15, fq0 = 300, fq1 = 4000, when) {
      if (!AC) return; const t = at(when);
      const s = AC.createBufferSource(); s.buffer = noiseBuf(d); const f = AC.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 6;
      f.frequency.setValueAtTime(fq0, t); f.frequency.exponentialRampToValueAtTime(Math.max(80, fq1), t + d);
      const g = AC.createGain(); g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(.0001, t + d);
      s.connect(f); f.connect(g); g.connect(sfxG); s.start(t); s.stop(t + d)
   }
   // simple resonant "pluck" for UI ticks
   function pluck(f, d = .08, v = .1, when) {
      if (!AC) return; const t = at(when);
      const o = AC.createOscillator(), g = AC.createGain(), fl = AC.createBiquadFilter();
      o.type = 'triangle'; o.frequency.setValueAtTime(f, t); fl.type = 'lowpass'; fl.frequency.setValueAtTime(f * 6, t);
      fl.frequency.exponentialRampToValueAtTime(f * .8, t + d);
      g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(.0001, t + d);
      o.connect(fl); fl.connect(g); g.connect(sfxG); o.start(t); o.stop(t + d + .02)
   }
   function sub(f, d = .3, v = .3, when) {
      if (!AC) return; const t = at(when);
      const o = AC.createOscillator(), g = AC.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(f, t);
      o.frequency.exponentialRampToValueAtTime(Math.max(20, f * .5), t + d);
      g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(.0001, t + d);
      o.connect(g); g.connect(sfxG); o.start(t); o.stop(t + d + .03)
   }

   /* drums */
   const kick = t => mosc(150, .14, 'sine', .5, t), hat = (t, v) => { if (AC) nzAt(.03, v, 6000, t) }, snare = t => nzAt(.12, .22, 1800, t);
   function nzAt(d, v, fq, t) {
      if (!AC) return;
      const s = AC.createBufferSource(); s.buffer = noiseBuf(d); const f = AC.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = fq;
      const g = AC.createGain(); g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(.0001, t + d);
      s.connect(f); f.connect(g); g.connect(musG); s.start(t); s.stop(t + d)
   }
   function sched(T, i, t) {
      const b = T.bass[i % T.bass.length];
      if (b != null) mosc(hz(T.root, b), T.step * 1.6, 'sawtooth', .16, t);
      if (T.drum === 1) { if (i % 4 === 0) kick(t); if (i % 2 === 1) hat(t, .05); if (i % 8 === 4) snare(t) }
      else if (T.drum === 2) { if (i % 2 === 0) kick(t); hat(t, .07); if (i % 8 === 4 || i % 8 === 0) snare(t) }
      if (T.pad && i % 16 === 0) [0, 3, 7].forEach(s => mosc(hz(T.root, s), T.step * 8, 'sine', .05, t));
      if (Math.random() < T.mel) { const s = T.scale[irnd(T.scale.length)]; mosc(hz(T.root * 2, s), .18, 'square', .05, t) }
   }
   setInterval(() => {
      if (!AC || !SAVE.set.music || !SAVE.set.mus) return; const T = TRACKS[track];
      while (nextT < AC.currentTime + .3) { sched(T, stepIdx, nextT); nextT += T.step; stepIdx++ }
   }, 100);

   /* ---- SFX catalog ---- */
   const SFX = {
      /* -- UI -- */
      click() { osc(760, .06, 'square', .1); osc(1140, .05, 'square', .06, 0, now() + .03) },
      hover() { osc(1500, .03, 'sine', .03) },
      toggle(on) { on ? (osc(700, .05, 'square', .08), osc(1050, .05, 'square', .06, 0, now() + .04)) : (osc(500, .06, 'square', .08), osc(320, .06, 'square', .05, 0, now() + .04)) },
      tab() { pluck(880, .06, .06); pluck(1320, .05, .04, now() + .03) },
      deny() { osc(180, .12, 'square', .1, -60) },
      confirm() { arpeggio([523, 659, 784], .045, .1, 'triangle', .08) },
      /* -- economy / progression -- */
      coin() { osc(988, .06, 'sine', .08); osc(1319, .09, 'sine', .08, 0, now() + .05); osc(1976, .08, 'sine', .05, 0, now() + .1) },
      purchase() { arpeggio([392, 523, 659, 880], .05, .12, 'triangle', .09); nz(.05, .03, 4000, now() + .1) },
      unlock() { osc(660, .08, 'triangle', .1); osc(880, .1, 'triangle', .1, 0, now() + .07); osc(1320, .14, 'triangle', .1, 0, now() + .14) },
      node() { fmBlip(520, 2.1, 30, .16, .08) },
      xp() { osc(700 + Math.random() * 80, .04, 'sine', .03) },
      level() { [523, 659, 784, 1046, 1319].forEach((f, i) => osc(f, .16, 'triangle', .09, 0, now() + i * .06)); nz(.3, .03, 5000, now() + .1) },
      achievement() { chord([523, 659, 784], .5, 'triangle', .07); arpeggio([784, 988, 1175, 1568], .07, .3, 'triangle', .09, now() + .12); nzHP(.4, .04, 3000, now() + .1) },
      synth() { [262, 330, 392, 523].forEach((f, i) => osc(f, .4, 'triangle', .07, 0, now() + i * .05)); nz(.3, .03, 5000, now() + .1) },
      error() { osc(160, .16, 'square', .12, -70); osc(110, .2, 'square', .1, -40, now() + .08) },
      /* -- combat -- */
      shoot(p = 0) { osc(460 + p * 30 + Math.random() * 30, .06, 'square', .045, -200); osc(900, .04, 'sawtooth', .02, -400); nz(.03, .02, 3000) },
      hit() { nz(.04, .06, 2200) },
      crit() { nzHP(.06, .09, 2600); osc(1400, .07, 'square', .06, 300); osc(700, .05, 'square', .05, 200, now() + .02) },
      kill() { osc(240, .12, 'sawtooth', .09, -140); nz(.08, .05, 900); osc(90, .15, 'sine', .12, -40) },
      explosion() { nz(.4, .2, 700); sub(70, .4, .25); nz(.2, .12, 2000, now() + .05) },
      hurt() { osc(110, .2, 'sawtooth', .16, -40); nz(.12, .09, 700) },
      shield() { osc(600, .1, 'sine', .08); fatOsc(300, .16, 'sine', .06) },
      shieldBreak() { nzSweep(.22, .12, 2200, 200); osc(180, .18, 'sawtooth', .1, -60) },
      heal() { arpeggio([392, 494, 587, 740], .04, .18, 'sine', .07) },
      buff() { sweep(300, 900, .22, 'triangle', .09) },
      debuff() { sweep(700, 220, .24, 'sawtooth', .08) },
      burn() { nzHP(.1, .06, 2600); osc(300, .12, 'sawtooth', .05, -60) },
      freeze() { osc(1800, .12, 'sine', .05); nzHP(.14, .05, 5000) },
      shock() { osc(2200, .04, 'square', .06); osc(1600, .03, 'square', .05, 0, now() + .03); osc(2400, .03, 'square', .04, 0, now() + .06) },
      poison() { osc(260, .1, 'sawtooth', .05, -20); osc(340, .1, 'sine', .03, 0, now() + .05) },
      dash() { nz(.14, .08, 2400); osc(300, .12, 'sine', .05, 400) },
      teleport() { nzSweep(.2, .1, 1800, 300); fmBlip(700, 3.4, 60, .2, .07, now() + .05) },
      zap() { osc(880, .12, 'square', .05); osc(1500, .08, 'square', .03) },
      charm() { osc(660, .14, 'sine', .07); osc(990, .2, 'sine', .05) },
      skip() { osc(300, .1, 'triangle', .08) },
      ready() { osc(1250, .06, 'sine', .05) },
      active() { osc(392, .2, 'sawtooth', .1, 200); nz(.2, .06, 1500) },
      revive() { [392, 523, 659, 784].forEach((f, i) => osc(f, .2, 'triangle', .1, 0, now() + i * .09)) },
      /* -- streaks / waves / boss -- */
      comboUp(n = 1) { const base = 520 + Math.min(n, 10) * 55; osc(base, .08, 'square', .07); osc(base * 1.5, .06, 'square', .05, 0, now() + .04) },
      killstreak(tier = 1) { const root = 440 + tier * 60; arpeggio([root, root * 1.25, root * 1.5, root * 2], .045, .16, 'sawtooth', .08); nzHP(.15, .05, 3200, now() + .1) },
      wave() { osc(196, .3, 'sawtooth', .07, 100); osc(294, .25, 'sawtooth', .05, 0, now() + .12) },
      waveClear() { chord([392, 494, 587], .35, 'triangle', .07); arpeggio([587, 740, 880], .05, .2, 'triangle', .07, now() + .1) },
      waveIncoming() { sweep(200, 500, .4, 'sawtooth', .09); nzHP(.3, .04, 1500, now() + .1) },
      boss() { sub(55, .9, .16); sub(58, .9, .13); nz(.5, .06, 300); sub(40, .8, .2, now() + .1) },
      bossPhase() { nzSweep(.35, .14, 400, 3000); sub(60, .5, .2, now() + .05); osc(1200, .15, 'square', .05, -300, now() + .2) },
      bossDeath() { nz(.5, .22, 700); sub(55, .8, .3); sweep(700, 60, .8, 'sawtooth', .08, now() + .1) },
      /* -- HUD / status -- */
      heartbeat(intensity = 1) { sub(58, .16, .12 + .1 * intensity); sub(50, .12, .07 + .06 * intensity, now() + .18) },
      /* -- multiplayer -- */
      lobbyJoin() { arpeggio([523, 659, 880], .05, .12, 'triangle', .08) },
      lobbyLeave() { arpeggio([659, 523, 392], .05, .12, 'triangle', .07) },
      lobbyReady() { osc(880, .07, 'sine', .07); osc(1175, .07, 'sine', .06, 0, now() + .05) },
      countdownTick() { osc(700, .08, 'square', .08) },
      matchGo() { chord([523, 659, 784, 1046], .4, 'triangle', .1); nzHP(.3, .05, 3000, now() + .05) },
      victory() { arpeggio([523, 659, 784, 1046, 1319], .08, .35, 'triangle', .09); chord([523, 659, 784], .6, 'sine', .05, now() + .4) },
      defeat() { sweep(440, 90, .8, 'sawtooth', .12); nz(.3, .06, 500, now() + .2) },
      pvpFrag() { osc(180, .1, 'square', .1, -80); nzHP(.1, .06, 2400, now() + .02) },
      ping() { fmBlip(950, 2, 25, .14, .07); osc(1400, .05, 'sine', .04, 0, now() + .08) },
      chatMsg() { pluck(1046, .05, .05) },
      reconnect() { sweep(300, 900, .3, 'sine', .08) },
      disconnect() { sweep(700, 150, .4, 'sawtooth', .1) },
      hostMigrate() { nzSweep(.3, .1, 500, 2500); osc(600, .15, 'square', .05, -100, now() + .1) }
   };

   function resume() { if (AC && AC.state === 'suspended') AC.resume() }
   window.addEventListener('pointerdown', () => { init(); resume() });
   window.addEventListener('keydown', () => { init(); resume() });
   Object.assign(AUDIO, { init, applyVol, setTrack, SFX, resume });
})();
