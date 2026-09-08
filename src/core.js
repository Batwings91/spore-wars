'use strict';
// Canvas, scaling, asset loading, debug params, palette and the pixel-sprite helpers.
const BRAND='640K GAMES';
// Logic runs in a 640x360 space; rendering is 1280x720 (K=2). Sprites are drawn native at 1280.
const LW=640,LH=360,PX=100,PW=440,K=2,W=LW*K,H=LH*K;
const X=v=>Math.round(v*K);
const cv=document.getElementById('c'),ctx=cv.getContext('2d');ctx.imageSmoothingEnabled=false;
// Scale to fit: fractional below 2x (a 1080p window gets 1.5x instead of a 1280x720 island with black borders,
// and portal iframes come in arbitrary sizes); integer steps from 2x up, where the pixels are large enough to show.
function fit(){const s=Math.min(innerWidth/W,innerHeight/H);const sc=s<2?s:Math.floor(s);cv.style.width=(W*sc)+'px';cv.style.height=(H*sc)+'px';}
addEventListener('resize',fit);fit();cv.focus();

// ---------- asset pack ----------
const ASSET_DATA={}; // dev: everything loads from ./assets/. dist: tools/build.js inlines the PNG sprites here; the WebP illustrations and the music stay as files in dist/assets/.
const ASSET_EXT={trader_shop:'webp',menu_hangar:'webp',lurker_body:'webp',spore_skimmer:'webp',ground_sentries:'webp',ground_bunkers:'webp',crawler_body:'webp',battleship_hull:'webp',mech_body:'webp',mothership_body:'webp',world_foundry:'webp',world_salvage:'webp',world_heart:'webp'};
const MAIN_TRACK='assets/space-adventure.m4a';
const IMG={},STRIP={};let assetsReady=false,assetsFailed=false;
(function(){
  // Core sprites gate the boot screen. The large WebP illustrations (ASSET_EXT) load in the background: every
  // draw site falls back until they arrive, and keeping them out of the inline bundle holds the initial download
  // under the portals' size guidance.
  const singles=["logo_prompt","logo_icon","px_nebula","px_haze1","px_haze2","px_stars_far","px_stars_mid","px_stars_near",'player','scout','bomber','frigate','cruiser','destroyer','heavycruiser','boss_battleship','boss_mothership','boss_mech','boss_mech_fire','bolt0','bolt1','bolt2','bolt3','bolt4','plasma_red','plasma_blue','icon_w','icon_s','icon_b','icon_core','flash0','flash1'];
  const deferred=Object.keys(ASSET_EXT);
  const strips={exp_small:12,exp_big:12,exp_boss:16,exp_ring:12,smoke:8,hit:8,muzzle_anim:8};
  let todo=singles.length+Object.keys(strips).length;const done=()=>{if(--todo===0)assetsReady=true;};
  const load=(n,onload,gate)=>{const im=new Image();im.onload=()=>{onload(im);if(gate)done();};im.onerror=()=>{if(gate){assetsFailed=true;done();}};im.src=ASSET_DATA[n]||('assets/'+n+'.'+(ASSET_EXT[n]||'png'));};
  for(const n of singles)load(n,im=>{IMG[n]=im;},true);
  for(const n in strips)load(n,im=>{STRIP[n]={img:im,n:strips[n],w:im.width/strips[n],h:im.height};},true);
  for(const n of deferred)load(n,im=>{IMG[n]=im;},false);
})();
function img(name,x,y,sc,alpha){const im=IMG[name];if(!im)return false;sc=sc||1;if(alpha!==undefined)ctx.globalAlpha=alpha;ctx.drawImage(im,X(x)-Math.round(im.width*sc/2),X(y)-Math.round(im.height*sc/2),Math.round(im.width*sc),Math.round(im.height*sc));if(alpha!==undefined)ctx.globalAlpha=1;return true;}
function strip(name,frame,x,y,sc){const st=STRIP[name];if(!st)return false;sc=sc||1;const f=Math.max(0,Math.min(st.n-1,Math.floor(frame)));ctx.drawImage(st.img,f*st.w,0,st.w,st.h,X(x)-Math.round(st.w*sc/2),X(y)-Math.round(st.h*sc/2),Math.round(st.w*sc),Math.round(st.h*sc));return true;}
const TOUCH=('ontouchstart' in window)||navigator.maxTouchPoints>0;
const DBG=new URLSearchParams(location.search);const GOD=DBG.get('god')==='1',STARTWAVE=parseInt(DBG.get('wave')||'0')||0;
const DOS={grey:'#aaaaaa',white:'#ffffff'};
const C={yellow:'#ffff55',orange:'#ff8800',red:'#ff2200',magenta:'#ff55ff',cyan:'#55ffff',cyanD:'#00aaaa',white:'#ffffff',black:'#000000',
  m0:'#1c1c24',m1:'#3c3c48',m2:'#60606c',m3:'#8c8c98',m4:'#b8b8c0',m5:'#e4e4e8',
  b0:'#08040c',b1:'#180c24',b2:'#2c1440',b3:'#3c2058',b4:'#1c3c48',b5:'#2c5860',
  g0:'#083c08',g1:'#1c7c1c',g2:'#3cc03c',g3:'#a0ff70',g4:'#e0ffc0',
  r0:'#4c0000',r1:'#a00000',r2:'#ff2000',r3:'#ffa080',
  o0:'#4c2400',o1:'#a05000',o2:'#ff9000',o3:'#ffe080',
  s0:'#141828',s1:'#26304c',s2:'#3e4c74',s3:'#5c6e9a',s4:'#8ea0c0',s5:'#c4d0e4',s6:'#ffffff',
  G:'#f0b040',gd:'#8a5a10',ck:'#28c8c0',cK:'#c0fff8',cKf:'#80fff0',rd:'#e03040',
  text:'#c0c0c8',dim:'#70707c'};
function sprite(rows,map){const h=rows.length,w=rows[0].length,o=document.createElement('canvas');o.width=w;o.height=h;const g=o.getContext('2d');
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){const ch=rows[y][x];if(ch!=='.'&&map[ch]){g.fillStyle=map[ch];g.fillRect(x,y,1,1);}}return o;}
function mirror(rows){return rows.map(r=>r+r.split('').reverse().join(''));} // draw left half, mirror to right
