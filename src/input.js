'use strict';
// Save data, keyboard, pointer/touch handlers, pause-on-blur.
const KEY='640k.sporewars.v3',SAVE_DEFAULTS=Object.freeze({cores:0,best:0,weapon:0,shield:0,engine:0,orb:0,rockets:0,sideLaser:0});
function migrateSaveData(raw,legacy=false){
  const source=raw&&typeof raw==='object'?raw:{},next=Object.assign({},SAVE_DEFAULTS,source);
  next.orb=next.orb===1?1:0;
  // Every v3 player previously received gun-linked pods during a run. Granting Mk I preserves that capability.
  next.rockets=Object.prototype.hasOwnProperty.call(source,'rockets')?(source.rockets===1?1:0):(legacy?1:0);
  next.sideLaser=next.sideLaser===1?1:0;
  return next;
}
let storedSave=null,hadStoredSave=false;
try{const s=localStorage.getItem(KEY);if(s){storedSave=JSON.parse(s);hadStoredSave=true;}}catch(e){}
let save=migrateSaveData(storedSave,hadStoredSave);
function persist(){try{localStorage.setItem(KEY,JSON.stringify(save));}catch(e){}}
if(hadStoredSave&&(!Object.prototype.hasOwnProperty.call(storedSave,'rockets')||!Object.prototype.hasOwnProperty.call(storedSave,'sideLaser')))persist();

const keys={};let tapped=false,tapSrc='key';
const KEYMAP={ArrowLeft:'l',ArrowRight:'r',ArrowUp:'u',ArrowDown:'d',KeyA:'l',KeyD:'r',KeyW:'u',KeyS:'d'};
addEventListener('keydown',e=>{
  if(e.code==='KeyM'&&!e.repeat){SFX.toggleMute();}
  if(e.code==='KeyN'&&!e.repeat){SFX.toggleMusic();}
  if(mode==='play'||mode==='travel'){
    if(e.code==='Escape'||e.code==='KeyP'){e.preventDefault();if(!e.repeat)setPaused(!paused);return;}
    if(paused){
      e.preventDefault();if(e.repeat)return;
      if(e.code==='ArrowUp'||e.code==='ArrowDown'||e.code==='KeyW'||e.code==='KeyS'){if(exitConfirm)exitChoice=1-exitChoice;else pauseSel=1-pauseSel;}
      else if(e.code==='Enter'){if(!exitConfirm){if(pauseSel===0)setPaused(false);else{exitConfirm=true;exitChoice=0;exitWait=15;}}else if(exitChoice===1)quitRun();else setPaused(false);}
      else if(e.code==='Space')setPaused(false);
      return;
    }
  }
  if(KEYMAP[e.code]){if(mode==='play')keys[KEYMAP[e.code]]=true;e.preventDefault();}
  if(e.code==='Space'){if(!e.repeat){tapped=true;tapSrc='key';}e.preventDefault();}
  if(e.code==='Enter'&&!e.repeat){tapped=true;tapSrc='key';}
  if((e.code==='KeyX'||e.code==='KeyB'||e.code==='ShiftLeft')&&!e.repeat&&mode==='play'&&!paused)fireBomb();
  if(e.code==='KeyX'&&!e.repeat&&mode==='shop'&&shopSel<SHOP.length)sell();
  if(e.code==='KeyQ'&&!e.repeat){if(mode==='sector'){if(t<60)t=60;else{shopInstalled=null;shopFromSector=true;mode='shop';t=0;}}else if(mode==='title'||mode==='dead'){shopInstalled=null;shopFromSector=false;mode='shop';}else if(mode==='shop')leaveShop();}
  if(mode==='shop'){
    const previousShopSel=shopSel;
    if(shopSel<SHOP.length)shopItem=shopSel;
    if(e.code==='ArrowDown'||e.code==='KeyS'){
      if(shopSel<SHOP.length){const next=shopSel+SHOP_COLUMNS;shopSel=next<SHOP.length?next:SHOP.length;if(shopSel<SHOP.length)shopItem=shopSel;}
    }
    else if(e.code==='ArrowUp'||e.code==='KeyW'){
      if(shopSel===SHOP.length)shopSel=shopItem;else if(shopSel>=SHOP_COLUMNS){shopSel-=SHOP_COLUMNS;shopItem=shopSel;}
    }
    else if(shopSel<SHOP.length&&(e.code==='ArrowLeft'||e.code==='ArrowRight')){shopSel=(shopSel+(e.code==='ArrowLeft'?SHOP.length-1:1))%SHOP.length;shopItem=shopSel;}
    if(shopSel!==previousShopSel)shopInstalled=null;
  }
  if((mode==='sector'||mode==='victory')&&!e.repeat&&(e.code==='ArrowUp'||e.code==='ArrowDown'||e.code==='KeyW'||e.code==='KeyS'))sectorSel=1-sectorSel;
  if(mode==='dead'&&!e.repeat){const n=deadOptions().length;if(e.code==='ArrowUp'||e.code==='KeyW')deadSel=(deadSel+n-1)%n;if(e.code==='ArrowDown'||e.code==='KeyS')deadSel=(deadSel+1)%n;}
  if(mode==='title'&&titleSel>=2){const k=titleSel===2?'sound':'music';if(e.code==='ArrowLeft'||e.code==='ArrowRight'){SFX.setVolume(k,SFX.getVolume(k)+(e.code==='ArrowLeft'?-0.1:0.1));SFX.preview(k);}if(e.code==='KeyV'&&!e.repeat)SFX.preview(k);}
  if(mode==='title'){if(e.code==='ArrowUp'||e.code==='KeyW')titleSel=(titleSel+TITLE_BUTTONS.length-1)%TITLE_BUTTONS.length;if(e.code==='ArrowDown'||e.code==='KeyS')titleSel=(titleSel+1)%TITLE_BUTTONS.length;}
  if(e.code==='Escape'&&!e.repeat){if(mode==='shop')leaveShop();else if(mode==='dead'){clearScene();mode='title';t=0;}}
  if(mode==='dead'&&e.code==='KeyC'&&!usedContinue)continueRun();
  if(mode==='boot'&&t>60&&(assetsReady||assetsFailed)){SFX.unlock();mode='title';t=0;}
});
addEventListener('keyup',e=>{if(KEYMAP[e.code])keys[KEYMAP[e.code]]=false;});
// Losing window focus pauses a live run: an alt-tabbed player should not die off-screen.
addEventListener('blur',()=>{if((mode==='play'||mode==='travel')&&!paused)setPaused(true);});
let ptr={down:false,x:0,y:0,lx:0,ly:0,rel:0};
function pos(e){const r=cv.getBoundingClientRect();const p=e.touches?e.touches[0]:e;return{x:(p.clientX-r.left)/r.width*LW,y:(p.clientY-r.top)/r.height*LH};}
function pdown(e){if(e.cancelable)e.preventDefault();cv.focus();const p=pos(e);if(p.x>=PX+PW+12&&p.x<=LW-12&&(mode==='play'||mode==='dead'||mode==='travel')){if(p.y>=268&&p.y<=292){SFX.toggleMute();return;}if(p.y>=296&&p.y<=320){SFX.toggleMusic();return;}}
  if((mode==='play'||mode==='travel')&&paused){pauseTap(p);return;}
  if(mode==='play'&&p.x>PX+PW+12&&p.y>168&&p.y<248){fireBomb();ptr.down=false;return;}ptr.down=true;ptr.x=ptr.lx=p.x;ptr.y=ptr.ly=p.y;ptr.rel=p.y/LH;tapped=true;tapSrc='ptr';}
function pmove(e){if(mode==='title'&&!e.touches){const p=pos(e),i=TITLE_BUTTONS.findIndex(b=>p.x>=b.x&&p.x<=b.x+b.w&&p.y>=b.y&&p.y<=b.y+b.h);if(i>=0)titleSel=i;}if(!ptr.down)return;if(e.cancelable)e.preventDefault();const p=pos(e);ptr.x=p.x;ptr.y=p.y;}
function pup(e){if(e.cancelable)e.preventDefault();ptr.down=false;}
addEventListener('mousedown',pdown);addEventListener('mousemove',pmove);addEventListener('mouseup',pup);
addEventListener('touchstart',pdown,{passive:false});addEventListener('touchmove',pmove,{passive:false});addEventListener('touchend',pup,{passive:false});
