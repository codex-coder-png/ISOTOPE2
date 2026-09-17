'use strict'; window.UI = {};
(function () {
  const { CATS, ELEMS, MOLDEF, RECIPES, MNODES, mxCost, RELICS, EL, elemStatsDisplay } = DATA;
  const SFX = AUDIO.SFX;
  function $(s) { return document.querySelector(s) }
  function $$(s) { return [...document.querySelectorAll(s)] }
  function toast(msg, cls = '') {
    const t = document.createElement('div'); t.className = 'toast ' + cls; t.textContent = msg;
    $('#toasts').appendChild(t); setTimeout(() => {
      t.style.opacity = '0'; t.style.transition = 'opacity .4s';
      setTimeout(() => t.remove(), 400)
    }, 2600)
  }
  function show(id) {
    $$('.screen').forEach(s => s.classList.add('hidden')); $('#' + id).classList.remove('hidden');
    if (id === 'scr-menu') { refreshShowcase(); AUDIO.setTrack('menu') }
    if (id === 'scr-vault') renderVault();
    if (id === 'scr-lab') renderLab();
    if (id === 'scr-aug') renderAug();
    if (id === 'scr-arch') renderArch();
    if (id === 'scr-mastery') renderMastery();
    SAVE.refreshCoins()
  }
  document.addEventListener('click', e => { const b = e.target.closest('[data-go]'); if (b) { SFX.click(); show(b.dataset.go) } });

  /* ---- menu showcase ---- */
  function refreshShowcase() {
    const el = EL(SAVE.sel), col = `hsl(${el.hue} 75% 60%)`;
    $('#bt-n').textContent = el.mol ? '⚗' : el.n; $('#bt-s').textContent = el.mol ? el.f.split('·')[0].slice(0, 4) : el.sym;
    $('#bt-nm').textContent = el.name.toUpperCase();
    const bt = $('#big-tile'); bt.style.borderColor = col; bt.style.color = col;
    $('#sel-cat').textContent = el.mol ? 'SYNTHESIZED COMPOUND' : CATS[el.cat].n.toUpperCase();
    $('#sel-blurb').textContent = el.mol ? el.desc : CATS[el.cat].blurb
  }

  /* ---- vault ---- */
  let vdTarget = null;
  function buildVault() {
    const pt = $('#ptable'); pt.innerHTML = '';
    const ph = (g, row, txt) => {
      const d = document.createElement('div'); d.className = 'pt ph';
      d.style.gridColumn = g; d.style.gridRow = row; d.textContent = txt; pt.appendChild(d)
    };
    ph(3, 6, '57–71'); ph(3, 7, '89–103');
    Object.values(ELEMS).forEach(e => {
      const d = document.createElement('div'); d.className = 'pt'; d.dataset.id = e.id;
      d.style.gridColumn = e.g; d.style.gridRow = e.row;
      const col = `hsl(${e.hue} 72% 62%)`; d.style.borderColor = col + '88'; d.style.color = col;
      d.innerHTML = `<span class="z">${e.n}</span><span class="sy">${e.sym}</span>`;
      d.onclick = () => { SFX.click(); selectVault(e.id) }; pt.appendChild(d)
    })
  }
  function renderVault() {
    SAVE.refreshCoins();
    $$('#ptable .pt').forEach(t => {
      if (!t.dataset.id) return; const id = t.dataset.id;
      t.classList.toggle('locked', !DATA.isOwned(id)); t.classList.toggle('sel', SAVE.sel === id)
    });
    const ms = $('#molstrip'); ms.innerHTML = '<span class="lbl">SYNTHESIZED ▸</span>';
    Object.keys(MOLDEF).forEach(k => {
      if (!MOLDEF[k].mol) return;
      const own = SAVE.raw.mols.includes(k), m = MOLDEF[k];
      const d = document.createElement('div'); d.className = 'mtile' + (own ? '' : ' locked') + (SAVE.sel === k ? ' sel' : '');
      const col = `hsl(${m.hue} 72% 62%)`; d.style.borderColor = own ? col : '#333'; d.style.color = own ? col : '#555';
      d.textContent = own ? m.f : '???'; if (own) d.onclick = () => { SFX.click(); selectVault(k) }; ms.appendChild(d)
    });
    if (!vdTarget) selectVault(SAVE.sel)
  }
  let abilityConfirm = null;
  function abilityPrice(el, slot){
    if (slot === 0) return 0;
    return el && el.mol ? 700 : Math.max(0, Math.round((Number(el.cost)||0) * 2));
  }
  function abilityOwned(el, slot){
    if(slot===0) return true;
    return SAVE.abilOwned ? SAVE.abilOwned(el.id, slot) : !!(SAVE.raw.abil[el.id] && SAVE.raw.abil[el.id][slot]);
  }
  function renderAbilityCard(el, choice, slot, selected, col){
    const own = abilityOwned(el, slot);
    const price = abilityPrice(el, slot);
    const confirming = abilityConfirm === el.id + ':' + slot;
    if(slot===0){
      return `<button class="sig-choice ${selected===0?'selected':''} main-real" data-sig="0">
        <strong>${choice ? (choice.ic||'✦')+' '+(choice.name||'ABILITY 1') : '✦ SIGNATURE 1'}</strong>
        <span>${choice ? (choice.desc||'') : 'Primary ability'}</span>${selected===0?'<em>SELECTED</em>':'<em>DEFAULT · FREE</em>'}
      </button>`;
    }
    if(!own){
      return `<button class="sig-choice locked-ability ${confirming?'confirming':''}" data-buy-abil="${slot}" title="Click once to confirm, click again to purchase">
        <strong>🔒 SIGNATURE ${slot+1}</strong>
        <span>${confirming ? 'ARE YOU SURE? CLICK AGAIN TO PURCHASE' : 'LOCKED · DETAILS HIDDEN'}</span>
        <em>${confirming ? 'PURCHASE · ◈ '+price : '🔒 ◈ '+price}</em>
      </button>`;
    }
    return `<button class="sig-choice ${selected===slot?'selected':''}" data-sig="${slot}">
      <strong>${choice ? (choice.ic||'✦')+' '+(choice.name||('SIGNATURE '+(slot+1))) : 'SIGNATURE '+(slot+1)}</strong>
      <span>${choice ? (choice.desc||'') : 'Unlocked signature ability.'}</span>${selected===slot?'<em>SELECTED</em>':'<em>OWNED · CLICK TO EQUIP</em>'}
    </button>`;
  }
  function selectVault(id) {
    id = DATA.canonicalId(id);
    vdTarget = id;
    const el = EL(id), own = DATA.isOwned(id);
    const col = `hsl(${el.hue} 72% 62%)`;
    const t = $('#vd-tile'); t.style.borderColor = col; t.style.color = col;
    t.innerHTML = `<span class="s">${el.mol ? el.f.slice(0, 4) : el.sym}</span>`;
    $('#vd-name').textContent = el.name.toUpperCase();
    $('#vd-cat').textContent = el.mol ? 'COMPOUND · ' + el.f : CATS[el.cat].n.toUpperCase();
    const fact = (!el.mol && DATA.ELEMENT_FACTS) ? DATA.ELEMENT_FACTS[el.sym] : null;
    $('#vd-desc').textContent = own
      ? (el.mol ? (el.desc || 'Catalogued real compound.') : (fact || 'A verified fact about this element is recorded in the Periodic Vault.'))
      : 'CLASSIFIED — UNLOCK THIS ELEMENT TO REVEAL ITS FACT AND ABILITIES.';
    $('#vd-stats').innerHTML = elemStatsDisplay(el).map(([k, v]) =>
      `<div class="statrow"><b>${k}</b><div class="bar"><i style="transform:scaleX(${Math.min(1, Math.max(.06, v))})"></i></div></div>`).join('');
    const choices = el.choices || el.signatures || [];
    let selectedSig = own ? (SAVE.getSignature ? SAVE.getSignature(id) : 0) : 0;
    if(!abilityOwned(el, selectedSig)) selectedSig = 0;
    if(own && SAVE.getSignature && SAVE.getSignature(id)!==selectedSig) SAVE.setSignature(id, selectedSig);
    $('#vd-active').innerHTML = own
      ? `<div class="main-ability"><b style="color:${col}">FACT</b><br>${el.mol ? (el.desc||'Catalogued real compound.') : (fact||'Verified periodic-table fact.')}</div>
         <div class="sig-choice-title">SIGNATURE ABILITIES — BUY / EQUIP INDIVIDUALLY</div>
         <div class="sig-choice-grid">${[0,1,2].map(slot=>renderAbilityCard(el, choices[slot], slot, selectedSig, col)).join('')}</div>`
      : `<b style="color:${col}">ABILITIES CLASSIFIED</b><br>Unlock this ${el.mol?'compound':'element'} to reveal Signature 1 and purchase Signatures 2 and 3 separately.`;

    $$('#vd-active [data-sig]').forEach(btn=>btn.onclick=()=>{
      const slot=Number(btn.dataset.sig);
      if(slot!==0 && !abilityOwned(el,slot)) return;
      abilityConfirm = null;
      if(SAVE.setSignature) SAVE.setSignature(id,slot);
      if(window.NET&&NET.setMySignature) NET.setMySignature(slot);
      SFX.unlock(); selectVault(id); toast('SIGNATURE '+(slot+1)+' EQUIPPED','good');
    });
    $$('#vd-active [data-buy-abil]').forEach(btn=>btn.onclick=()=>{
      const slot=Number(btn.dataset.buyAbil);
      if(abilityOwned(el,slot)) { abilityConfirm=null; selectVault(id); return; }
      const key=id+':'+slot;
      const price=abilityPrice(el,slot);
      if(abilityConfirm!==key){
        abilityConfirm=key;
        SFX.click();
        selectVault(id);
        toast('ARE YOU SURE? CLICK THE LOCKED ABILITY AGAIN TO PURCHASE · ◈ '+price,'gold');
        return;
      }
      abilityConfirm=null;
      if(SAVE.coins < price){
        SFX.error();
        toast('NOT ENOUGH COINS · NEED ◈ '+price,'bad');
        selectVault(id);
        return;
      }
      if(SAVE.buyAbil && SAVE.buyAbil(id,slot,el)){
        SFX.unlock();
        toast('SIGNATURE '+(slot+1)+' UNLOCKED · ◈ '+price,'good');
        selectVault(id);
      }else{
        SFX.error();
        toast('PURCHASE FAILED · NEED ◈ '+price,'bad');
        selectVault(id);
      }
    });

    const b = $('#vd-btn');
    if (SAVE.sel === id) { b.textContent = '✓ DEPLOYED'; b.disabled = true }
    else if (own) {
      b.textContent = 'SELECT'; b.disabled = false; b.onclick = () => {
        SAVE.sel = id;
        if(SAVE.getSignature && SAVE.getSignature(id)==null) SAVE.setSignature(id,0);
        SAVE.save(); if (window.NET && NET.setMyElement) NET.setMyElement(id);
        SFX.unlock(); renderVault(); toast(el.name + ' deployed · SIGNATURE 1 DEFAULTED ONLY IF NEEDED', 'good')
      }
    } else if (el.mol) {
      b.textContent = 'CATALOGUED BY FUSION · ◈ 700 ABILITY COST'; b.disabled = true;
    } else {
      b.textContent = 'UNLOCK · ◈ ' + el.cost; b.disabled = false; b.onclick = () => {
        if (DATA.isOwned(id)) { renderVault(); return; }
        if (SAVE.unlockElement(id, el.cost)) {
          if(SAVE.setSignature) SAVE.setSignature(id,0);
          SFX.unlock(); toast(el.name + ' unlocked! Signature 1 equipped.', 'gold'); renderVault()
        } else { SFX.error(); toast('Not enough coins', 'bad') }
      }
    }
  }

  /* ---- mastery ---- */
  let mSel = null;
  function renderMastery() {
    /* Always open on the currently equipped entity instead of remembering a stale selection. */
    mSel = SAVE.sel;
    $('#mxp-badge').textContent = '◆ ' + SAVE.mxp(mSel).xp;
    const box = $('#m-elems'); box.innerHTML = '';
    Object.values(ELEMS).filter(e => DATA.isOwned(e.id)).forEach(e => {
      const d = document.createElement('div'); d.className = 'mchip' + (mSel === e.id ? ' sel' : '');
      const col = `hsl(${e.hue} 72% 62%)`; d.style.borderColor = col; d.style.color = col;
      d.innerHTML = `<span style="font-weight:bold">${e.sym}</span><span style="font-size:9px">${SAVE.mxp(e.id).xp}</span>`;
      d.onclick = () => { SFX.click(); mSel = e.id; renderMastery() }; box.appendChild(d)
    });
    const el = EL(mSel), col = `hsl(${el.hue} 72% 62%)`, mx = SAVE.mxp(mSel);
    const choices = el.choices || el.signatures || [];
    const eqSlot = SAVE.getSignature ? SAVE.getSignature(mSel) : 0;
    const eq = choices[eqSlot] || choices[0];
    const eqHtml = eq
      ? `<div class="panel2 mastery-equipped" style="margin-top:10px;border-color:${col}88"><div class="tag" style="color:${col}">EQUIPPED ABILITY ${eqSlot+1}</div><b style="display:block;margin-top:5px;color:${col}">${eq.ic||'✦'} ${eq.name||('SIGNATURE '+(eqSlot+1))}</b><div class="sub" style="margin-top:4px">${eq.desc||'Description unavailable.'}</div></div>`
      : '';
    $('#m-head').innerHTML = `<div style="font-family:var(--disp);font-size:24px;color:${col}">${el.name.toUpperCase()}</div>
  <div class="sub">Mastery XP available: <b style="color:var(--gr)">◆ ${mx.xp}</b> · earn more by fighting as ${el.name}.</div>${eqHtml}`;
    $('#m-tree').innerHTML = MNODES.map((t, i) => {
      const r = SAVE.nodeRank(mSel, t.key), max = r >= t.max, c = mxCost(i, r);
      return `<div class="node${max ? ' max' : ''}">
   <b>${t.ic} ${el.name} ${t.t}</b><small>+${t.per}/rank ${t.d}</small>
   <div class="row"><div class="pips">${Array.from({ length: t.max }, (_, p) => `<i class="${p < r ? 'on' : ''}"></i>`).join('')}</div>
   <button class="btn chamf" style="padding:6px 12px;font-size:11px" data-mn="${i}" ${max || mx.xp < c ? 'disabled' : ''}>${max ? 'MAX' : '◆ ' + c}</button></div></div>`
    }).join('');
    $$('#m-tree [data-mn]').forEach(b => b.onclick = () => {
      if (SAVE.buyNode(mSel, +b.dataset.mn)) { SFX.unlock(); toast('Node unlocked', 'good'); renderMastery() }
      else { SFX.error() }
    })
  }

  /* ---- lab ---- */
  /* Dynamic synthesis chamber: one slot when empty; one stack per unique
     reagent while populated. Repeating the same reagent increases X count. */
  let slots = [];

  function addLabReagent(tok, label, hue, z) {
    const existing = slots.find(x => x && x.token === tok);
    if (existing) existing.count = Math.min(999, (existing.count || 1) + 1);
    else slots.push({ token: tok, label, hue, count: 1, z });
    SFX.click(); drawSlots();
  }

  function renderLab() {
    SAVE.refreshCoins();
    const inv = $('#lab-inv'); inv.innerHTML = '';
    const add = (tok, label, hue, z) => {
      const d = document.createElement('div'); d.className = 'reag';
      const col = `hsl(${hue} 72% 62%)`; d.style.borderColor = col + '88'; d.style.color = col;
      d.innerHTML = `<span class="z">${z || ''}</span><span class="s">${label}</span>`;
      d.title = `Add ${label} to the bonding chamber`;
      d.onclick = () => addLabReagent(tok, label, hue, z);
      inv.appendChild(d);
    };
    [...new Set(SAVE.raw.unlocked)].map(id => ELEMS[id]).filter(Boolean).sort((a, b) => a.n - b.n)
      .forEach(e => add(e.sym, e.sym, e.hue, e.n));
    SAVE.raw.mols.forEach(k => {
      const m = MOLDEF[k];
      if (m) add(m.token, m.f, m.hue, '⚗');
    });
    drawSlots();
    renderBook();
    const discovered = Object.keys(MOLDEF).filter(k => MOLDEF[k] && MOLDEF[k].mol).length;
    $('#lab-count').textContent = `${discovered} REAL COMPOUNDS`;
  }

  function drawSlots() {
    const count = Math.max(1, slots.length);
    $('#slots').innerHTML = Array.from({length: count}, (_, i) => `<div class="slot ${slots[i] ? 'filled' : ''}" data-i="${i}"></div>`).join('');
    $$('#slots .slot').forEach((s, i) => {
      const it = slots[i];
      if (it) {
        const col = `hsl(${it.hue} 72% 62%)`;
        s.style.borderColor = col; s.style.color = col;
        s.innerHTML = `<span class="slot-count">×${it.count||1}</span><span class="z">${it.z||''}</span><span class="s">${it.label}</span><span class="slot-help">CLICK TO REMOVE 1</span>`;
        s.title = `Remove one ${it.label}`;
        s.onclick = () => {
          if ((it.count||1) > 1) it.count--;
          else slots.splice(i, 1);
          SFX.click();
          drawSlots();
        };
      } else {
        s.style.borderColor = ''; s.style.color = '';
        s.innerHTML = `<span class="dim">+ REAGENT</span>`;
        s.onclick = null;
      }
    });
  }

  function renderBook() {
    const bk = $('#lab-book'); bk.innerHTML = '';
    Object.keys(MOLDEF).sort((a, b) => a.split('+').length - b.split('+').length).forEach(k => {
      const known = SAVE.raw.mols.includes(k), m = MOLDEF[k];
      if (!m || !m.mol) return;
      const d = document.createElement('div'); d.className = 'rec' + (known ? ' known' : '');
      d.innerHTML = known
        ? `<span class="f">${m.f}<span class="rx">${m.rx || 'REAL COMPOUND'}</span></span>
           <span class="nm">${m.name}</span>`
        : `<span class="f">${Array(k.split('+').length).fill('◻').join(' + ')}</span><span class="nm">???</span>`;
      bk.appendChild(d);
    });
  }

  $('#btn-synth').onclick = () => {
    const used = slots.filter(Boolean);
    const totalIngredients = used.reduce((n, s) => n + (s.count || 1), 0);
    if (totalIngredients < 2) {
      SFX.error();
      labMsg('<span style="color:var(--mg)">MINIMUM TWO ELEMENTS IN THE CHAMBER</span>');
      return;
    }
    const expanded = [];
    used.forEach(s => { for(let i=0;i<(s.count||1);i++) expanded.push(s.token); });
    const key = expanded.sort().join('+');
    const molId = RECIPES[key];
    const r = $('#reactor');
    r.classList.remove('shake'); void r.offsetWidth; r.classList.add('shake');

    if (!molId) {
      SFX.error();
      labMsg('<span style="color:var(--mg)">NO CATALOGUED REAL COMPOUND FOR THIS COMBINATION.</span><br><span class="dim">Only catalogued real compounds can be synthesized.</span>');
      return;
    }

    const m = MOLDEF[molId];
    if (!m) {
      SFX.error();
      labMsg('<span style="color:var(--mg)">REACTION DATA UNAVAILABLE.</span>');
      return;
    }

    if (!SAVE.raw.mols.includes(molId)) {
      SAVE.raw.mols.push(molId);
      SAVE.raw.mols = [...new Set(SAVE.raw.mols)];
      if(SAVE.raw.signatures && SAVE.raw.signatures[molId]==null) SAVE.raw.signatures[molId]=0;
      SAVE.save(); SFX.synth();
      labMsg(`<span style="color:var(--gr)">REAL COMPOUND CATALOGUED!<br><b style="font-size:18px">${m.name.toUpperCase()}</b><br>
      <span class="dim">${m.f}</span><br>${m.desc}<br><br><span class="dim">Signature 1 is free · Signatures 2 and 3 must be purchased separately for ◈ 700 each.</span></span>`);
      toast('CATALOGUED: ' + m.name, 'good');
    } else {
      SFX.click();
      labMsg(`<span class="dim">${m.name} is already catalogued.</span>`);
    }
    renderLab();
  };

  function labMsg(h) { $('#lab-result').innerHTML = h }

  /* ---- augmentations ---- */
  const META = [
    { id: 'dmg', n: 'Ion Lance', d: '+5% damage /lv', max: 10, base: 60 },
    { id: 'hp', n: 'Plated Hull', d: '+12 max HP /lv', max: 8, base: 50 },
    { id: 'spd', n: 'Thruster Tuning', d: '+3% speed /lv', max: 6, base: 50 },
    { id: 'mag', n: 'Magnet Core', d: '+18% pickup range /lv', max: 6, base: 40 },
    { id: 'luck', n: 'Alchemy Core', d: '+8% coins /lv', max: 8, base: 70 },
    { id: 'crit', n: 'Weakpoint Scanner', d: '+2.5% crit /lv', max: 8, base: 65 },
    { id: 'shield', n: 'Reactive Shield', d: '+15 shield /lv', max: 5, base: 90 },
    { id: 'head', n: 'Head Start', d: 'Start with 1 random ability /lv', max: 3, base: 150 },
    { id: 'revive', n: 'Emergency Cell', d: 'Revive once per run', max: 3, base: 250 }];
  function renderAug() {
    SAVE.refreshCoins(); const g = $('#aug-grid'); g.innerHTML = '';
    META.forEach((m, i) => {
      const lv = SAVE.metaLv(m.id), locked = i > 0 && !SAVE.metaLv(META[i - 1].id);
      const maxed = lv >= m.max, cost = SAVE.metaCost(m, lv);
      const d = document.createElement('div'); d.className = 'augcard panel' + (locked ? ' locked' : '');
      d.innerHTML = `<h4>${m.n} ${locked ? '🔒' : ''}</h4><p>${m.d}</p>
   <div class="pips2">${Array.from({ length: m.max }, (_, p) => `<i class="${p < lv ? 'on' : ''}"></i>`).join('')}</div>
   <div class="augfoot"><span class="cost">${maxed ? 'MAXED' : locked ? 'LOCKED' : '◈ ' + cost}</span>
   ${maxed || locked ? '' : `<button class="btn chamf" data-buy="${m.id}">BUY</button>`}</div>`;
      g.appendChild(d)
    });
    $$('#aug-grid [data-buy]').forEach(b => b.onclick = () => {
      const m = META.find(x => x.id === b.dataset.buy);
      const lv = SAVE.metaLv(m.id), cost = SAVE.metaCost(m, lv);
      if (SAVE.spend(cost)) { SAVE.raw.meta[m.id] = lv + 1; SAVE.save(); SFX.unlock(); renderAug(); toast(m.n + ' → LV ' + (lv + 1), 'good') }
      else { SFX.error(); toast('Not enough coins', 'bad') }
    })
  }

  /* ---- archive ---- */
  function renderArch() {
    const s = SAVE.stats;
    const tiles = [['RUNS', s.runs], ['BEST WAVE', s.bestWave], ['TOTAL KILLS', s.kills], ['COINS EARNED', s.earned],
    ['MASTERY XP', s.mxp], ['ELEMENTS', SAVE.raw.unlocked.length + '/118'],
    ['COMPOUNDS', SAVE.raw.mols.length + '/' + (DATA.realCompoundCount||Object.keys(DATA.MOLDEF||{}).length)]];
    $('#arch-stats').innerHTML = tiles.map(([k, v]) => `<div class="stat-tile panel"><div class="v">${v}</div><div class="k">${k}</div></div>`).join('');
    $('#arch-abil').innerHTML = MNODES.map(t => `<div class="acard panel"><div class="ic">${t.ic}</div>
  <div><b>${t.t}</b><small>+${t.per}/rank ${t.d}</small></div></div>`).join('');
    $('#arch-enemy').innerHTML = Object.entries(DATA.ETYPES).map(([k, t]) =>
      `<div class="acard panel"><div class="ic" style="color:hsl(${t.hue} 75% 60%)">●</div>
   <div><b>${k.toUpperCase()}</b><small>${t.desc}</small></div></div>`).join('')
  }

  /* ---- settings ---- */
  function bindSettings() {
    $('#set-sfx').value = SAVE.set.sfx; $('#set-mus').value = SAVE.set.mus;
    $('#set-sfx').oninput = e => { SAVE.set.sfx = +e.target.value; AUDIO.applyVol(); SAVE.save() };
    $('#set-mus').oninput = e => { SAVE.set.mus = +e.target.value; AUDIO.applyVol(); SAVE.save() };
    const tgl = (id, key, cb) => {
      const t = $(id); t.classList.toggle('on', !!SAVE.set[key]);
      t.onclick = () => { SAVE.set[key] = SAVE.set[key] ? 0 : 1; t.classList.toggle('on', !!SAVE.set[key]); SAVE.save(); cb && cb(); SFX.click() }
    };
    tgl('#tgl-mus', 'music', AUDIO.applyVol); tgl('#tgl-shake', 'shake'); tgl('#tgl-dmg', 'dmg');
    $('#btn-wipe').onclick = () => { if (confirm('Erase ALL progress?')) { localStorage.clear(); location.reload() } }
  }

  /* ---- multiplayer lobby (wired to HTML in index.html #scr-lobby) ---- */
  function bindMultiplayerUI() {
    let lobbyMode = 'coop';   // 'coop' | 'pvp'
    let fragTarget = 10;
    let friendlyFire = false;

    // mode card selection
    $$('.modecard[data-nm]').forEach(c => c.onclick = () => {
      SFX.click();
      $$('.modecard[data-nm]').forEach(x => x.classList.remove('sel'));
      c.classList.add('sel');
      lobbyMode = c.dataset.nm;
      $('#fragrow').style.display = lobbyMode === 'pvp' ? 'flex' : 'none';
      if (NET.isInLobby && NET.amHost) NET.updateConfig(lobbyMode, fragTarget, friendlyFire);
    });

    // frag target selection
    $$('[data-fr]').forEach(c => c.onclick = () => {
      SFX.click();
      $$('[data-fr]').forEach(x => x.classList.remove('sel'));
      c.classList.add('sel');
      fragTarget = +c.dataset.fr;
      if (NET.isInLobby && NET.amHost) NET.updateConfig(lobbyMode, fragTarget, friendlyFire);
    });

    // hide frag row initially
    $('#fragrow').style.display = 'none';

    /* FRIENDLY FIRE (host only toggles; guests see reflected state) */
    const ffToggle = $('#tgl-ff');
    if (ffToggle) {
      ffToggle.onclick = () => {
        if (!(NET.isInLobby && NET.amHost)) return;
        SFX.click();
        friendlyFire = !friendlyFire;
        ffToggle.classList.toggle('on', friendlyFire);
        NET.updateConfig(lobbyMode, fragTarget, friendlyFire);
      };
    }

    /* HOST */
    $('#btn-host').onclick = () => {
      SFX.click();
      const code = NET.createLobby(lobbyMode, 5, fragTarget, friendlyFire);
      $('#code-txt').textContent = code;
      $('#host-code').classList.remove('hidden');
      $('#lob-room').classList.remove('hidden');
      $('#room-code').textContent = code;
      $('#host-opts').classList.remove('hidden');
      $('#guest-wait').classList.add('hidden');
      $('#room-elem').textContent = DATA.EL(SAVE.sel).sym + ' – ' + DATA.EL(SAVE.sel).name;
      if (ffToggle) ffToggle.classList.toggle('on', friendlyFire);
      toast('Lobby created! Share: ' + code, 'gold');
    };

    /* JOIN */
    $('#btn-join').onclick = () => {
      SFX.click();
      const code = $('#join-in').value.trim().toUpperCase();
      if (!code) { toast('Enter a room code!', 'bad'); return; }
      NET.joinLobby(code, () => {
        $('#lob-room').classList.remove('hidden');
        $('#room-code').textContent = code;
        $('#host-opts').classList.add('hidden');
        $('#host-code').classList.add('hidden');
        $('#guest-wait').classList.remove('hidden');
        toast('Joining ' + code + '…', 'good');
      });
    };

    /* START (host only) */
    $('#btn-start').onclick = () => { SFX.click(); NET.startGame(); };

    /* LEAVE */
    $('#btn-leave').onclick = () => {
      SFX.click();
      NET.reset();
      $('#lob-room').classList.add('hidden');
      $('#host-code').classList.add('hidden');
      toast('Left lobby', 'good');
    };

    /* Lobby roster updates */
    NET.onLobbyUpdate = (players, config, isHostLocal, localId) => {
      const list = players.map(p => {
        const el = DATA.EL(p.elementId || '1');
        const col = `hsl(${el.hue} 75% 60%)`;
        return `<div style="display:flex;align-items:center;gap:10px;padding:8px 10px;background:var(--bg2);border:1px solid var(--line);border-left:4px solid ${col};border-radius:4px;margin-bottom:6px">
          <b style="color:${col}">${el.sym}</b>
          <div style="flex:1"><b>${p.name}</b>${p.isHost ? ' 👑' : ''}</div>
          <span class="tag" style="background:${p.ready ? 'rgba(69,196,106,.3)' : 'rgba(255,255,255,.08)'}">
            ${p.ready ? 'READY ✓' : 'WAITING…'}
          </span>
        </div>`;
      }).join('');
      $('#room-players').innerHTML = `<div class="mono" style="margin-bottom:8px;color:var(--tx2)">PLAYERS ${players.length} / 5</div>` + list;
      $('#btn-start').disabled = !isHostLocal || !players.every(p => p.ready);
      $('#btn-start').style.display = isHostLocal ? 'block' : 'none';
      if (config && config.mode) {
        $$('.modecard[data-nm]').forEach(c => c.classList.toggle('sel', c.dataset.nm === config.mode));
        lobbyMode = config.mode;
        $('#fragrow').style.display = config.mode === 'pvp' ? 'flex' : 'none';
      }
      if (config && ffToggle) {
        friendlyFire = !!config.friendlyFire;
        ffToggle.classList.toggle('on', friendlyFire);
        ffToggle.style.opacity = isHostLocal ? 1 : .55;
        ffToggle.style.cursor = isHostLocal ? 'pointer' : 'default';
      }
    };

    NET.onChatMessage = null; // chat not in this HTML layout
    // NOTE: NET.onGameStart is wired in game.js — it owns starting the actual match.
  }


  /* ---- deploy / co-op ---- */
  let mode = 'solo';
  $('#btn-deploy').onclick = () => {
    SFX.click();
    if (window.ISO_REFRESH_RELIC_PANEL) window.ISO_REFRESH_RELIC_PANEL();
    show('scr-game');
    $('#dep-elem').textContent = 'Selected: ' + EL(SAVE.sel).name;
    $('#coop-hints').classList.toggle('hidden', true);
    $('#m-deploy').classList.remove('hidden');
    $$('.modecard[data-mode]').forEach(c => c.classList.toggle('sel', c.dataset.mode === mode))
  };
  $$('.modecard[data-mode]').forEach(c => c.onclick = () => {
    SFX.click(); mode = c.dataset.mode;
    $$('.modecard[data-mode]').forEach(x => x.classList.toggle('sel', x === c));
    $('#coop-hints').classList.toggle('hidden', mode !== 'coop')
  });
  $('#dep-cancel').onclick = () => { SFX.click(); $('#m-deploy').classList.add('hidden'); show('scr-menu') };
  $('#dep-go').onclick = () => {
    SFX.click(); if (window.ISO_REFRESH_RELIC_PANEL) window.ISO_REFRESH_RELIC_PANEL(); $('#m-deploy').classList.add('hidden');
    if (!SAVE.set.brief) {
      SAVE.set.brief = 1; SAVE.save();
      $('#brief-rows').innerHTML = `
   <div class="kv"><span>P1 MOVE</span><b>WASD</b></div>
   <div class="kv"><span>P1 FIRE / AIM</span><b>MOUSE</b></div>
   <div class="kv"><span>SIGNATURE</span><b>Q</b></div>
   <div class="kv"><span>DASH</span><b>SPACE</b></div>
   <div class="kv"><span>P2 (CO-OP)</span><b>ARROWS · ENTER dash · R-SHIFT sig</b></div>
   <div class="kv"><span>PAUSE</span><b>ESC</b></div>`;
      $('#m-brief').classList.remove('hidden')
    }
    else { $('#scr-game').classList.remove('hidden'); GAME.start(SAVE.sel, mode) }
  };
  $('#btn-briefok').onclick = () => { SFX.click(); $('#m-brief').classList.add('hidden'); GAME.start(SAVE.sel, mode) };
  function syncPauseSettings(){
    const s=SAVE.raw.settings=SAVE.raw.settings||{};
    const aw=document.getElementById('pause-auto-wave'),ps=document.getElementById('pause-sfx'),pm=document.getElementById('pause-mus');
    if(aw) aw.checked=!!s.autoWave;
    if(ps) ps.value=SAVE.set.sfx;
    if(pm) pm.value=SAVE.set.mus;
  }
  function bindPauseSettings(){
    const aw=document.getElementById('pause-auto-wave'),ps=document.getElementById('pause-sfx'),pm=document.getElementById('pause-mus');
    if(aw) aw.onchange=()=>{SAVE.raw.settings=SAVE.raw.settings||{};SAVE.raw.settings.autoWave=aw.checked;SAVE.save();SFX.click();};
    if(ps) ps.oninput=()=>{SAVE.set.sfx=+ps.value;AUDIO.applyVol();SAVE.save();};
    if(pm) pm.oninput=()=>{SAVE.set.mus=+pm.value;AUDIO.applyVol();SAVE.save();};
  }
  bindPauseSettings();
  syncPauseSettings();
  const __pauseShow=window.__ISO_PAUSE_SYNC__;
  window.__ISO_PAUSE_SYNC__=()=>syncPauseSettings();
  $('#btn-resume').onclick = () => { SFX.click(); GAME.resume() };
  $('#btn-prestart').onclick = () => { SFX.click(); $('#bosswrap').classList.add('hidden'); GAME.start(SAVE.sel, mode) };
  function leaveMatch() {
    if (!window.NET || !NET.isInLobby) return;

    if (NET.leaveMatch) {
      NET.leaveMatch();
    } else {
      NET.reset();
    }
  }

  $('#btn-retry').onclick = () => {
    SFX.click();
    $('#bosswrap').classList.add('hidden');

    if (window.NET && NET.isInLobby && NET.amHost) {
      NET.startGame();
      return;
    }

    if (window.NET && NET.isInLobby) {
      UI.toast('Waiting for host to restart the match', 'good');
      return;
    }

    GAME.start(SAVE.sel, mode);
  };

  $('#btn-abandon').onclick = () => {
    SFX.click();

    leaveMatch();

    $('#bosswrap').classList.add('hidden');
    $('#m-pause').classList.add('hidden');

    show('scr-menu');
  };

  $('#btn-tomenu').onclick = () => {
    SFX.click();

    leaveMatch();

    $('#bosswrap').classList.add('hidden');
    $('#m-over').classList.add('hidden');

    show('scr-menu');
  };
  /* boot */
  buildVault(); bindSettings(); bindMultiplayerUI(); refreshShowcase(); SAVE.refreshCoins(); show('scr-menu');
  addEventListener('beforeunload', SAVE.save);
  Object.assign(UI, { show, toast });


/* ISO_ABILITY_3CHOICE_UI handled in core selectVault */


/* ISO_UI_STATS_V2 */
(function(){
if(window.__ISO_UI2__)return;window.__ISO_UI2__=true;
var NS=[['echo','ECHO','every 5th shot echoes'],['momentum','MOMENTUM','dmg bonus while moving'],['tempo','TEMPO','fire rate after ability'],['flux','FLUX','random status on shots'],['aegis','AEGIS','bonus while shielded'],['grit','GRIT','bonus below 35% HP'],['shatter','SHATTER','frozen/stunned kills explode'],['combust','COMBUST','burning kills explode'],['scavenge','SCAVENGE','coins grant shield'],['void','VOID','chance to erase low-HP foes']];
function baseNS(el){var n=el.mol?0:(+el.n||0);return{echo:Math.floor(n/30),flux:Math.floor(n/26),momentum:(n%5===0)?.5:0,aegis:(n%7===0)?.5:0,grit:(n%6===0)?.5:0,tempo:(n%8===0)?.5:0,shatter:(n%9===0)?.5:0,combust:(n%4===0)?.5:0,scavenge:(n%3===0)?.5:0,void:(n%11===0)?.5:0};}
function statRows(el){
var c=DATA.baseCombat(el);
var cat=el.mol?null:DATA.CATS[el.cat];
var base=[['DMG',c.dmg.toFixed(1)],['FIRE RATE',c.rate.toFixed(2)+'/s'],['PROJ SPEED',Math.round(c.ps)],['MAX HP',Math.round(c.hp)],['CRIT',c.crit+'%'],['PIERCE',c.pierce],['KNOCKBACK',Math.round(c.kb)],['ARMOR',Math.round(c.armor*100)+'%'],['TOXIC',cat?cat.tox:2],['REACT',cat?cat.react:3]];
var ns=baseNS(el);
var live=(window.__ISO_RUN&&window.__ISO_RUN.elId===el.id)?window.__ISO_ST:null;
var html=base.map(function(r){return '<div style="display:flex;justify-content:space-between;gap:8px"><span>'+r[0]+'</span><b style="color:var(--cy)">'+r[1]+'</b></div>';}).join('');
NS.forEach(function(s2){
var v=(ns[s2[0]]||0)+((live&&live[s2[0]])?live[s2[0]]-(ns[s2[0]]||0):0);
var bonus=live&&v>(ns[s2[0]]||0)?' <i style="color:var(--gr)">+'+(v-(ns[s2[0]]||0)).toFixed(1)+'</i>':'';
html+='<div style="display:flex;justify-content:space-between;gap:8px" title="'+s2[2]+'"><span>'+s2[1]+bonus+'</span><b style="color:var(--mg)">'+(v||0)+'</b></div>';
});
return html;
}
var oldSV=selectVault;
selectVault=function(id){
oldSV(id);
try{
var el=EL(DATA.canonicalId(id));
var statsBox=document.getElementById('vd-stats');
if(!statsBox||document.getElementById('vd-more'))return;
var wrap=document.createElement('div');
wrap.style.cssText='margin-top:8px';
wrap.innerHTML='<button id="vd-more" class="btn chamf" style="width:100%;padding:6px 10px;font-size:10px;letter-spacing:2px">FULL STATS â–¾</button><div id="vd-extra" style="display:none;margin-top:8px;max-height:230px;overflow:auto;border:1px solid #22303f;padding:8px;font-family:var(--mono);font-size:10px;color:var(--tx2)"></div>';
statsBox.parentElement.appendChild(wrap);
var btn=wrap.querySelector('#vd-more'),ex=wrap.querySelector('#vd-extra');
btn.onclick=function(){
var open=ex.style.display!=='none';
ex.style.display=open?'none':'block';
btn.textContent=open?'FULL STATS â–¾':'FULL STATS â–´';
if(!open)ex.innerHTML=statRows(el);
SFX.click();
};
}catch(err){}
};
function addSettingsExtra(){
var scr=document.getElementById('scr-settings');
if(!scr||document.getElementById('qol2-box'))return;
var box=document.createElement('div');box.id='qol2-box';box.style.cssText='margin-top:14px;display:grid;gap:10px;max-width:560px';
box.innerHTML='<div class="panel" style="padding:14px"><b style="letter-spacing:2px">EXTRA OPTIONS</b><div id="qx-opts" style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px"></div></div><div class="panel" style="padding:14px"><b style="letter-spacing:2px">KEYBINDS</b><div id="qx-keys" style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px"></div><small style="color:var(--tx2)">Click a bind, then press a key Â· Esc cancels.</small></div>';
scr.appendChild(box);
var orow=box.querySelector('#qx-opts');
[['minimap','MINIMAP',1],['fps','FPS COUNTER',0],['trails','BULLET TRAILS',1],['glow','GLOW FX',1],['tele','TELEGRAPHS',1],['hitstop','HITSTOP/SLOW-MO',1],['redflash','SOFT FLASH',0]].forEach(function(o){
if(SAVE.set[o[0]]===undefined)SAVE.set[o[0]]=o[2];
var b=document.createElement('button');b.className='btn chamf';b.style.cssText='padding:6px 10px;font-size:10px';
function paint(){b.textContent=o[1]+(SAVE.set[o[0]]?' âœ“':' âœ—');b.style.borderColor=SAVE.set[o[0]]?'#48c774':'#555';}
paint();
b.onclick=function(){SAVE.set[o[0]]=SAVE.set[o[0]]?0:1;SAVE.save();paint();SFX.click();};
orow.appendChild(b);
});
var krow=box.querySelector('#qx-keys');
SAVE.set.binds=SAVE.set.binds||{dash:'Space',active:'KeyQ',autofire:'KeyF'};
function buildKeys(){
krow.innerHTML='';
['dash','active','autofire'].forEach(function(k){
var b=document.createElement('button');b.className='btn chamf';b.style.cssText='padding:6px 10px;font-size:10px';
b.textContent=k.toUpperCase()+': '+String(SAVE.set.binds[k]).replace('Key','');
b.onclick=function(){window.__rebinding=k;b.textContent=k.toUpperCase()+': PRESS KEYâ€¦';SFX.click();};
krow.appendChild(b);
});
}
buildKeys();
addEventListener('keydown',function(e){
if(!window.__rebinding)return;
e.preventDefault();e.stopPropagation();
if(e.code!=='Escape'){SAVE.set.binds[window.__rebinding]=e.code;SAVE.save();}
window.__rebinding=null;buildKeys();
},true);
}
addSettingsExtra();
console.log('ISO_UI_STATS_V2 active: vault FULL STATS dropdown + expanded settings.');
})();

/* ISO_UIFIX_V3 */
(function(){
if(window.__ISO_UF3__)return;window.__ISO_UF3__=true;
var NSL={echo:'ECHO',momentum:'MOMENTUM',tempo:'TEMPO',flux:'FLUX',aegis:'AEGIS',grit:'GRIT',shatter:'SHATTER',combust:'COMBUST',scavenge:'SCAVENGE',void:'VOID'};
function rows(el){
var ns=window.ISO_NS?window.ISO_NS(el):{};
var c=DATA.baseCombat(el);
var base=[['DMG',c.dmg.toFixed(1)],['FIRE RATE',c.rate.toFixed(2)+'/s'],['PROJ SPEED',Math.round(c.ps)],['MAX HP',Math.round(c.hp)],['CRIT',Math.round(c.crit)+'%'],['PIERCE',c.pierce],['KNOCKBACK',Math.round(c.kb)],['ARMOR',Math.round((c.armor||0)*100)+'%']];
var cat=el.mol?null:DATA.CATS[el.cat];
if(cat){base.push(['TOXIC',cat.tox]);base.push(['REACT',cat.react]);}
var html=base.map(function(r){return '<div style="display:flex;justify-content:space-between;gap:8px"><span>'+r[0]+'</span><b style="color:var(--cy)">'+r[1]+'</b></div>';}).join('');
Object.keys(NSL).forEach(function(k){
html+='<div style="display:flex;justify-content:space-between;gap:8px"><span>'+NSL[k]+'</span><b style="color:'+((ns[k]||0)>0?'#7ef0a6':'#ff5d8f')+'">'+(ns[k]||0)+'</b></div>';
});
return html;
}
var oldSV=selectVault;
selectVault=function(id){
oldSV(id);
try{
var el=DATA.EL(DATA.canonicalId(id));
var wrap=document.getElementById('vd-stats');
if(!wrap)return;
var parent=wrap.parentElement;
var btn=document.getElementById('vd-more3'),box=document.getElementById('vd-extra3');
if(!btn){
btn=document.createElement('button');btn.id='vd-more3';btn.className='btn chamf';
btn.style.cssText='width:100%;padding:6px 10px;font-size:10px;letter-spacing:2px;margin-top:8px';
box=document.createElement('div');box.id='vd-extra3';
box.style.cssText='display:none;margin-top:8px;max-height:230px;overflow:auto;border:1px solid #22303f;padding:8px;font-family:var(--mono);font-size:10px;color:var(--tx2)';
parent.appendChild(btn);parent.appendChild(box);
btn.onclick=function(){var open=box.style.display!=='none';box.style.display=open?'none':'block';btn.textContent=open?'FULL STATS +':'FULL STATS -';SFX.click();};
}
box.innerHTML=rows(el);
btn.textContent=box.style.display!=='none'?'FULL STATS -':'FULL STATS +';
var ob=document.getElementById('vd-more');if(ob)ob.style.display='none';
var ox=document.getElementById('vd-extra');if(ox)ox.style.display='none';
}catch(err){}
};
function buildExtra(){
var scr=document.getElementById('scr-settings');
if(!scr)return false;
if(document.getElementById('qol3-box'))return true;
var box=document.createElement('div');box.id='qol3-box';box.style.cssText='margin-top:14px;display:grid;gap:10px;max-width:560px';
box.innerHTML='<div class="panel" style="padding:14px"><b style="letter-spacing:2px">EXTRA OPTIONS</b><div id="q3o" style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px"></div></div><div class="panel" style="padding:14px"><b style="letter-spacing:2px">KEYBINDS</b><div id="q3k" style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px"></div><small style="color:var(--tx2)">Click a bind then press a key. Esc cancels.</small></div>';
scr.appendChild(box);
var orow=box.querySelector('#q3o');
[['minimap','MINIMAP',1],['fps','FPS COUNTER',0],['trails','BULLET TRAILS',1],['glow','GLOW FX',1],['tele','TELEGRAPHS',1],['redflash','SOFT FLASH',0]].forEach(function(o){
if(SAVE.set[o[0]]===undefined)SAVE.set[o[0]]=o[2];
var b=document.createElement('button');b.className='btn chamf';b.style.cssText='padding:6px 10px;font-size:10px';
function paint(){b.textContent=o[1]+(SAVE.set[o[0]]?' ON':' OFF');b.style.borderColor=SAVE.set[o[0]]?'#48c774':'#555';}
paint();
b.onclick=function(){SAVE.set[o[0]]=SAVE.set[o[0]]?0:1;SAVE.save();paint();SFX.click();};
orow.appendChild(b);
});
var krow=box.querySelector('#q3k');
function buildKeys(){
krow.innerHTML='';
['dash','active','autofire'].forEach(function(k){
var b=document.createElement('button');b.className='btn chamf';b.style.cssText='padding:6px 10px;font-size:10px';
b.textContent=k.toUpperCase()+': '+(SAVE.set.binds[k]||'').replace('Key','');
b.onclick=function(){window.__rebinding=k;b.textContent=k.toUpperCase()+': PRESS KEY';};
krow.appendChild(b);
});
}
buildKeys();
addEventListener('keydown',function(e){
if(!window.__rebinding)return;
e.preventDefault();e.stopPropagation();
if(e.code!=='Escape'){SAVE.set.binds[window.__rebinding]=e.code;SAVE.save();}
window.__rebinding=null;buildKeys();if(window.ISO_BINDLBL)window.ISO_BINDLBL();
},true);
return true;
}
var tries=0;var iv=setInterval(function(){tries++;if(buildExtra()||tries>40)clearInterval(iv);},250);
var oldShow=UI.show;
UI.show=function(id){var r=oldShow.apply(this,arguments);buildExtra();return r;};
console.log('ISO_UIFIX_V3 active: per-element stat sheet + working settings panel.');
})();

/* ISO_UPDATE2_UI */
(function(){
if(window.__ISO_UPD2UI__)return;window.__ISO_UPD2UI__=true;
/* favorites strip + buy buttons in vault */
var __sv=selectVault;
selectVault=function(id){__sv(id);try{postVault(id);}catch(e){}};
function postVault(id){
 var el=DATA.EL(id),own=DATA.isOwned(id);if(!own)return;
 var box=document.getElementById('vd-active');if(!box)return;
 var fav=document.getElementById('fav-btn');
 if(!fav){fav=document.createElement('button');fav.id='fav-btn';fav.className='btn chamf';fav.style.cssText='padding:6px 12px;margin-top:6px';box.parentElement.insertBefore(fav,box);}
 fav.textContent=SAVE.isFav(id)?'★ FAVORITED':'☆ FAVORITE';
 fav.onclick=function(){SAVE.toggleFav(id);postVault(id);SFX.click();};
 box.querySelectorAll('.sig-choice').forEach(function(btn){
  var slot=+btn.dataset.sig;if(!slot)return;
  if(SAVE.abilOwned(id,slot))return;
  var cost=SAVE.abilCost(el);
  var bb=btn.querySelector('.buyab');
  if(!bb){bb=document.createElement('button');bb.className='buyab';bb.style.cssText='margin-top:4px;padding:3px 8px;border:1px solid var(--am);background:#221a0d;color:var(--am);font-family:var(--mono);font-size:9px;cursor:pointer';btn.appendChild(bb);}
  bb.textContent='UNLOCK ◈ '+cost;
  bb.onclick=function(ev){ev.stopPropagation();if(SAVE.buyAbil(id,slot,el)){toast('ABILITY UNLOCKED','good');selectVault(id);}else{toast('Not enough coins','bad');}};
  btn.style.opacity=.6;
 });
}
var __rv=renderVault;
renderVault=function(){__rv();try{favStrip();}catch(e){}};
function favStrip(){
 var ms=document.getElementById('molstrip');if(!ms)return;
 var fr=document.getElementById('favrow');
 if(!fr){fr=document.createElement('div');fr.id='favrow';fr.style.cssText='display:flex;gap:8px;margin-top:10px;flex-wrap:wrap;align-items:center';ms.parentElement.insertBefore(fr,ms);}
 var html='<span style="font-family:var(--mono);font-size:11px;color:var(--am);letter-spacing:.2em;margin-right:8px">FAVORITES ▸</span>';
 var favs=SAVE.raw.favs||[];
 html+=favs.length?favs.map(function(id){var e=DATA.EL(id);return '<span class="mtile" style="border-color:hsl('+e.hue+' 72% 62%);color:hsl('+e.hue+' 72% 62%)">★ '+(e.mol?e.f.slice(0,4):e.sym)+'</span>';}).join(''):'<span class="dim" style="font-size:11px">none yet - star elements in the vault</span>';
 var top=Object.entries(SAVE.raw.plays||{}).sort(function(a,b){return b[1]-a[1];})[0];
 if(top){var e=DATA.EL(top[0]);html+='<span class="dim" style="margin-left:auto;font-size:10px">MOST PLAYED: '+(e.mol?e.f:e.name)+' ('+top[1]+')</span>';}
 fr.innerHTML=html;
}
/* deploy: local modes + P2 select + favorites */
(function(){
 var mg=document.querySelector('#m-deploy .modegrid');
 if(mg&&!document.getElementById('mc-pvp')){
  var c=document.createElement('div');c.className='modecard';c.id='mc-pvp';c.dataset.mode='pvp';
  c.innerHTML='<b>LOCAL PVP</b><span>2P shared screen deathmatch</span>';
  mg.appendChild(c);
 }
 document.querySelectorAll('#m-deploy .modecard').forEach(function(c){
  c.addEventListener('click',function(){
   document.querySelectorAll('#m-deploy .modecard').forEach(function(x){x.classList.toggle('sel',x===c);});
   SAVE.set.localMode=c.dataset.mode;SAVE.save();
  });
 });
 var dep=document.getElementById('m-deploy');
 if(dep&&!document.getElementById('p2sel')){
  var b=document.createElement('button');b.id='p2sel';b.className='btn chamf';b.style.cssText='margin:10px auto 0;display:block';
  b.onclick=function(){openP2();};
  dep.appendChild(b);
 }
 function p2label(){var e=DATA.EL(SAVE.raw.sel2||'e2');return 'P2 ELEMENT: '+(e.mol?e.f.slice(0,6):e.name);}
 function openP2(){
  var ov=document.createElement('div');ov.className='ov';ov.style.zIndex=40;
  var mo=document.createElement('div');mo.className='modal';mo.style.maxWidth='700px';
  mo.innerHTML='<h2 style="color:var(--cy)">SELECT P2 ELEMENT</h2><div id="p2grid" style="display:flex;flex-wrap:wrap;gap:6px;margin-top:14px;max-height:60vh;overflow:auto"></div><button class="btn" id="p2close" style="margin-top:14px">DONE</button>';
  ov.appendChild(mo);document.body.appendChild(ov);
  var g=mo.querySelector('#p2grid');
  Object.values(DATA.ELEMS).filter(function(e){return DATA.isOwned(e.id);}).forEach(function(e){
   var d=document.createElement('button');d.className='mtile'+(SAVE.raw.sel2===e.id?' sel':'');
   d.style.borderColor='hsl('+e.hue+' 72% 62%)';d.style.color='hsl('+e.hue+' 72% 62%)';d.textContent=e.sym;
   d.onclick=function(){SAVE.raw.sel2=e.id;SAVE.save();g.querySelectorAll('.mtile').forEach(function(x){x.classList.remove('sel');});d.classList.add('sel');};
   g.appendChild(d);
  });
  mo.querySelector('#p2close').onclick=function(){ov.remove();upd();};
 }
 function upd(){var b=document.getElementById('p2sel');if(b)b.textContent=p2label();}
 upd();setInterval(upd,800);
})();
/* settings: keybinds + extra toggles */
(function(){
 var rows=document.getElementById('set-rows');if(!rows)return;
 function addRow(html){var d=document.createElement('div');d.className='setrow panel';d.innerHTML=html;rows.appendChild(d);return d;}
 var KB=[['p1u','P1 UP'],['p1d','P1 DOWN'],['p1l','P1 LEFT'],['p1r','P1 RIGHT'],['p1dash','P1 DASH'],['p1act','P1 ABILITY'],['p2u','P2 UP'],['p2d','P2 DOWN'],['p2l','P2 LEFT'],['p2r','P2 RIGHT'],['p2dash','P2 DASH'],['p2act','P2 ABILITY']];
 var kr=addRow('<label>KEYBINDS <small style="color:var(--tx3)">(click a key, then press new key)</small></label><div id="kbgrid" style="display:flex;flex-wrap:wrap;gap:6px;max-width:340px"></div>');
 var g=kr.querySelector('#kbgrid');
 KB.forEach(function(k){
  var b=document.createElement('button');b.className='btn chamf';b.style.cssText='padding:5px 9px;font-size:10px';
  function paint(){b.textContent=k[1]+': '+SAVE.set.binds[k[0]].replace('Key','').replace('Arrow','');}
  paint();
  b.onclick=function(){b.textContent=k[1]+': PRESS...';window.__rebind=k[0];};
  g.appendChild(b);
  b._paint=paint;
 });
 addEventListener('keydown',function(e){
  if(!window.__rebind)return;
  e.preventDefault();e.stopImmediatePropagation();
  if(e.code!=='Escape'){SAVE.set.binds[window.__rebind]=e.code;SAVE.save();}
  window.__rebind=null;
  document.querySelectorAll('#kbgrid button').forEach(function(x){if(x._paint)x._paint();});
 },true);
 var t1=addRow('<label>FPS COUNTER</label><div class="tgl" id="tgl-fps"></div>');
 var t2=addRow('<label>REDUCED HIT FLASH</label><div class="tgl" id="tgl-red"></div>');
 function bindTgl(id,key,cb){var t=document.getElementById(id);t.classList.toggle('on',!!SAVE.set[key]);t.onclick=function(){SAVE.set[key]=SAVE.set[key]?0:1;t.classList.toggle('on',!!SAVE.set[key]);SAVE.save();cb&&cb();SFX.click();};}
 bindTgl('tgl-fps','fps');bindTgl('tgl-red','redflash');
})();
console.log('ISO_UPDATE2_UI active.');
})();
})();
/* ISO_ABILITY_SELECTION_LOCKS_V3 handled in core selectVault */

