'use strict';window.SAVE={};
(function(){
const KEY='isotope_save_v3';
function def(){return{coins:0,sel:'e1',unlocked:['e1','e6','e8'],mols:[],meta:{},
 mastery:{},signatures:{},stats:{runs:0,kills:0,bestWave:0,earned:0,mxp:0},
 set:{sfx:80,mus:50,music:1,shake:1,dmg:1,heartbeat:1,killstreaks:1,achToast:1,quickcomm:1,pingBadge:1,ambient:1},
 brief:false,abil:{},favs:[],plays:{},achievements:{}}}
let S;try{S={...def(),...JSON.parse(localStorage.getItem(KEY)||'{}')};
 S.stats={...def().stats,...(S.stats||{})};S.set={...def().set,...(S.set||{})};
 S.meta=S.meta||{};S.mastery=S.mastery||{};S.signatures=S.signatures||{};S.abil=S.abil||{};
 S.favs=Array.isArray(S.favs)?S.favs:[];S.plays=S.plays||{};S.achievements=S.achievements||{};
 S.unlocked=[...new Set(Array.isArray(S.unlocked)?S.unlocked:[])];
 S.mols=[...new Set(Array.isArray(S.mols)?S.mols:[])];
 if(!S.unlocked.includes('e1')) S.unlocked.unshift('e1');
 if(!S.sel || (String(S.sel).startsWith('e') && !S.unlocked.includes(S.sel))) S.sel='e1';
 save();
}catch(e){S=def()}
function save(){try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}}
function refreshCoins(){document.querySelectorAll('.coinv').forEach(b=>b.textContent=S.coins)}
function addCoins(v){S.coins+=v;S.stats.earned+=Math.max(0,v);refreshCoins()}
function spend(v){if(S.coins<v)return false;S.coins-=v;refreshCoins();save();return true}
function unlockElement(id,cost){
 id=DATA.canonicalId(id);
 if(!id.startsWith('e') || S.unlocked.includes(id)) return S.unlocked.includes(id);
 if(S.coins<cost) return false;
 S.coins-=cost; S.unlocked.push(id); S.unlocked=[...new Set(S.unlocked)];
 if(S.signatures[id]==null) S.signatures[id]=0; if(!S.abil[id]) S.abil[id]={};
 S.sel=id;
 refreshCoins(); save(); return true
}
function abilCost(el){
 if(!el) return 700;
 return el.mol ? 700 : Math.max(20, Math.round((Number(el.cost)||30)*2/5)*5);
}
function abilOwned(id, slot){
 try{id=DATA.canonicalId(id);}catch(e){}
 if(slot===0) return true;
 return !!(S.abil[id] && S.abil[id][slot]);
}
function buyAbil(id, slot, el){
 try{id=DATA.canonicalId(id);}catch(e){}
 if(slot===0) return true;
 if(abilOwned(id, slot)) return true;
 const cost = abilCost(el || (window.DATA && DATA.EL ? DATA.EL(id) : null));
 if(S.coins < cost) return false;
 S.coins -= cost;
 if(!S.abil[id]) S.abil[id] = {};
 S.abil[id][slot] = true;
 refreshCoins(); save(); return true;
}
function isFav(id){return S.favs.includes(id);}
function toggleFav(id){
 const i=S.favs.indexOf(id);
 if(i>=0) S.favs.splice(i,1); else S.favs.push(id);
 save();
}
function trackPlay(id){S.plays[id]=(S.plays[id]||0)+1;save();}
function grantAchievement(key){
 if(S.achievements[key]) return false;
 S.achievements[key]=Date.now();save();return true;
}
function hasAchievement(key){return !!S.achievements[key];}
function dailySeed(){
 const d=new Date();
 return d.getFullYear()*10000+d.getMonth()*100+d.getDate();
}
function mxp(id){return S.mastery[id]||{xp:0,nodes:{}}}
function addMxp(id,v){const m=mxp(id);m.xp+=v;S.mastery[id]=m;S.stats.mxp+=v}
function nodeRank(id,key){return mxp(id).nodes[key]||0}
function buyNode(elemId,nodeIdx){const t=DATA.MNODES[nodeIdx],m=mxp(elemId),r=m.nodes[t.key]||0;
 if(r>=t.max)return false;const c=DATA.mxCost(nodeIdx,r);
 if(m.xp<c)return false;m.xp-=c;m.nodes[t.key]=r+1;S.mastery[elemId]=m;save();return true}
function metaLv(id){return S.meta[id]||0}
function metaCost(m,lv){return Math.round(m.base*Math.pow(lv+1,1.7)/10)*10}
function getSignature(id){ return S.signatures[id] || 0 }
function setSignature(id,slot){ id=DATA.canonicalId(id); slot=Math.max(0,Math.min(2,+slot||0)); S.signatures[id]=slot; save(); return slot }
function equipElement(id){ id=DATA.canonicalId(id); if(id.startsWith('e') && !S.unlocked.includes(id)) return false; S.sel=id; if(S.signatures[id]==null) S.signatures[id]=0; save(); return true }

Object.assign(SAVE,{get raw(){return S},save,refreshCoins,addCoins,spend,unlockElement,
 mxp,addMxp,nodeRank,buyNode,getSignature,setSignature,equipElement,metaLv,metaCost,
 abilCost,abilOwned,buyAbil,isFav,toggleFav,trackPlay,grantAchievement,hasAchievement,dailySeed});
Object.defineProperty(SAVE,'coins',{get:()=>S.coins});
Object.defineProperty(SAVE,'unlocked',{get:()=>S.unlocked});
Object.defineProperty(SAVE,'mols',{get:()=>S.mols});
Object.defineProperty(SAVE,'set',{get:()=>S.set,set:v=>{S.set=v||S.set||{}}});
Object.defineProperty(SAVE,'stats',{get:()=>S.stats});
Object.defineProperty(SAVE,'meta',{get:()=>S.meta});
Object.defineProperty(SAVE,'sel',{get:()=>S.sel,set:v=>{S.sel=v}});
})();