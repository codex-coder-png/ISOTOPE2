'use strict';
(function(){
  if(window.__ISO_CHROMEBOOK_LOCAL_V12__)return;
  window.__ISO_CHROMEBOOK_LOCAL_V12__=true;
  const qp=new URLSearchParams(location.search);
  const isFile=location.protocol==='file:';

  function css(){
    if(document.getElementById('iso-chrome-css'))return;
    const s=document.createElement('style');s.id='iso-chrome-css';
    s.textContent=`
#iso-chrome-modal{position:fixed;inset:0;z-index:100000;background:rgba(3,7,14,.82);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;padding:18px;box-sizing:border-box}
#iso-chrome-card{width:min(980px,96vw);max-height:92vh;overflow:auto;background:#0b1320;border:1px solid #45dff0;box-shadow:0 0 40px #00d9ff18;padding:20px;color:#dcecff;font-family:var(--mono,monospace)}
#iso-chrome-layout{display:grid;grid-template-columns:minmax(0,1fr) 290px;gap:16px}
#iso-chrome-help{border:1px solid #263956;background:#08111d;padding:14px;color:#9fb5cf}
#iso-chrome-help h3{margin:0 0 9px;color:#62e9ff;font-size:13px;letter-spacing:.08em}
#iso-chrome-help .hs{margin:9px 0;padding-left:20px;position:relative;font-size:10px;line-height:1.55}
#iso-chrome-help .hs b{color:#dcecff}.hs i{position:absolute;left:0;top:0;color:#62e9ff;font-style:normal}
#iso-chrome-help .tip{margin-top:12px;border-left:2px solid #eeb44b;padding:8px;background:#0c1724;font-size:10px;line-height:1.5;color:#a8bbd0}
@media(max-width:760px){#iso-chrome-layout{grid-template-columns:1fr}}
#iso-chrome-card h2{margin:0 0 6px;color:#62e9ff;letter-spacing:.1em}#iso-chrome-card .tiny{font-size:11px;color:#8ba0bd;line-height:1.5}
#iso-chrome-card .row{display:flex;gap:8px;flex-wrap:wrap;margin:12px 0}.iso-area{width:100%;box-sizing:border-box;min-height:130px;background:#060b13;border:1px solid #263956;color:#cfe5ff;padding:10px;font:11px var(--mono,monospace);resize:vertical}
#iso-chrome-card .pill{padding:6px 9px;border:1px solid #2d4664;background:#101b2b;color:#9fb8d8;font:10px var(--mono,monospace)}
#iso-chrome-card .ok{color:#72f2a0}.iso-local-status{margin-top:10px;padding:8px;border:1px solid #283c58;background:#09111d;color:#9ab5d4;font-size:11px}
`;
    document.head.appendChild(s);
  }
  function make(){
    css();
    let el=document.getElementById('iso-chrome-modal');
    if(el)el.remove();
    el=document.createElement('div');el.id='iso-chrome-modal';
    el.innerHTML=`<div id="iso-chrome-card">
      <h2>CHROMEBOOK LOCAL CO-OP</h2>
      <div class="tiny">Direct browser-to-browser connection for downloaded Chromebook builds. No website or Python server is required.</div>
      <div id="iso-chrome-layout">
        <div>
          <div class="row"><button class="btn primary" id="iso-ch-host">HOST</button><button class="btn" id="iso-ch-join">JOIN</button><button class="btn" id="iso-ch-close">CLOSE</button></div>
          <div class="tiny" id="iso-ch-step">Choose HOST in one tab, JOIN in the other.</div>
          <textarea class="iso-area" id="iso-ch-offer" placeholder="HOST: generated connection code appears here. JOIN: paste the host code here."></textarea>
          <div class="row"><button class="btn" id="iso-ch-generate">GENERATE / ACCEPT</button><button class="btn" id="iso-ch-copy">COPY</button><button class="btn" id="iso-ch-answer">APPLY ANSWER (HOST)</button></div>
          <textarea class="iso-area" id="iso-ch-answerbox" placeholder="JOIN: generated answer appears here. Copy it back to the HOST tab."></textarea>
          <div class="iso-local-status" id="iso-ch-status">STATUS · READY</div>
        </div>
        <aside id="iso-chrome-help">
          <h3>QUICK INSTRUCTIONS</h3>
          <div class="hs"><i>1.</i><b>HOST</b> in the first tab → Generate.</div>
          <div class="hs"><i>2.</i>Copy the host code into the second tab.</div>
          <div class="hs"><i>3.</i><b>JOIN</b> → paste the code → Generate / Accept.</div>
          <div class="hs"><i>4.</i>Copy the JOIN answer back to the HOST tab.</div>
          <div class="hs"><i>5.</i><b>APPLY ANSWER (HOST)</b> and wait for CONNECTED.</div>
          <div class="tip"><b>Need two players?</b><br>Use two tabs on the same Chromebook. Keep both tabs open while connecting.</div>
          <div class="tip"><b>Popup blocked?</b><br>Allow popups for the local file, then press OPEN LOCAL CO-OP again.</div>
        </aside>
      </div>
    </div>`;
    document.body.appendChild(el);
    const status=t=>{const n=document.getElementById('iso-ch-status');if(n)n.textContent='STATUS · '+t;};
    const step=t=>{const n=document.getElementById('iso-ch-step');if(n)n.textContent=t;};
    const offer=document.getElementById('iso-ch-offer');
    const answer=document.getElementById('iso-ch-answerbox');
    document.getElementById('iso-ch-host').onclick=async()=>{
      try{
        NET.setChromebookTransport(true);
        NET.createLobby('coop',2,10,false);
        const code=await NET.rtcCreateHostOffer();
        offer.value=code;
        step('HOST: copy the large code above into the JOIN tab. Wait for the JOIN player to return an ANSWER.');
        status('HOST OFFER CREATED');
      }catch(e){status('HOST ERROR · '+e.message);}
    };
    document.getElementById('iso-ch-join').onclick=()=>{
      NET.setChromebookTransport(true);
      step('JOIN: paste the host offer into the top box, then press GENERATE / ACCEPT.');
      status('JOIN READY');
    };
    document.getElementById('iso-ch-generate').onclick=async()=>{
      try{
        if(!offer.value.trim())throw new Error('Paste the host offer first.');
        NET.setChromebookTransport(true);
        // Start the normal lobby retry loop; it will send JOIN_REQ once the data channel opens.
        NET.joinLobby('ISO-LOCAL');
        const ans=await NET.rtcClientMakeAnswer(offer.value.trim());
        answer.value=ans;
        step('JOIN: copy the ANSWER below back into the HOST tab and wait for CONNECTED.');
        status('ANSWER CREATED');
      }catch(e){status('JOIN ERROR · '+e.message);}
    };
    document.getElementById('iso-ch-answer').onclick=async()=>{
      try{
        if(!answer.value.trim())throw new Error('Paste the JOIN answer first.');
        await NET.rtcHostApplyAnswer(answer.value.trim());
        step('HOST: connection is negotiating. The JOIN player will appear in the lobby when the data channel opens.');
        status('ANSWER APPLIED · CONNECTING');
      }catch(e){status('HOST ERROR · '+e.message);}
    };
    document.getElementById('iso-ch-copy').onclick=async()=>{
      const txt=document.activeElement===answer?answer.value:offer.value;
      try{await navigator.clipboard.writeText(txt);status('COPIED TO CLIPBOARD');}catch(e){
        const area=document.activeElement===answer?answer:offer;area.focus();area.select();document.execCommand('copy');status('COPIED');
      }
    };
    document.getElementById('iso-ch-close').onclick=()=>el.remove();
  }
  function openTab(){
    const url=location.href.split('#')[0].replace(/([?&])chrome=1(&?)/,'$1').replace(/[?&]$/,'');
    const sep=url.includes('?')?'&':'?';
    const target=url+sep+'chrome=1&local=1';
    const w=window.open(target,'_blank','noopener');
    if(!w){ if(window.UI&&UI.toast)UI.toast('POPUP BLOCKED · allow popups for the local file','bad'); else alert('Allow popups for this local file and press again.'); }
  }
  function bind(){
    const b=document.getElementById('btn-local-stream');if(!b)return;
    b.textContent='↗ OPEN LOCAL CO-OP';
    const sm=document.createElement('small');sm.textContent=isFile?'Chromebook-ready · direct browser P2P':'localhost / direct P2P';b.appendChild(sm);
    b.onclick=()=>{
      if(isFile){openTab();setTimeout(make,200);} 
      else {window.open('http://127.0.0.1:8765/index.html?local=1','_blank','noopener');}
    };
    if(qp.get('local')==='1' && qp.get('chrome')==='1') setTimeout(make,300);
  }
  let tries=0;const iv=setInterval(()=>{tries++;if(document.getElementById('btn-local-stream')){bind();clearInterval(iv);}if(tries>60)clearInterval(iv);},150);
})();
