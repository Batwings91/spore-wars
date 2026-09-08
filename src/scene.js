'use strict';
// Enemy plasma, pickups, shield ring, core icon, background tile, stars, the three worlds, and the bevel/keycap/txt primitives.
const PLASMA=[sprite(['..mm..','.mMMm.','mMWWMm','mMWWMm','.mMMm.','..mm..'],{m:'#a020a0',M:C.magenta,W:C.white}),
              sprite(['..mm..','.mMMm.','mMMMMm','mMMWMm','.mMMm.','..mm..'],{m:'#a020a0',M:C.magenta,W:C.white})];
// capsule pickups: metal shell, coloured glass, letter drawn on top
function capsule(col,colD){return sprite(mirror(['....111','..11222','.122333','.123ccc','1223ccc','1223ccc','1223ccc','1223ccc','1223ccc','.123ccc','.122333','..11222','....111']),{1:C.s1,2:C.s3,3:C.s5,c:col});}
const CAP_W=capsule(C.orange),CAP_S=capsule(C.cyan),CAP_B=capsule(C.G),CAP_H=capsule('#79e69b');
// shield: 8 frames of a rotating dithered energy ring, 110px
const SHF=[];(function(){const R=52;for(let f=0;f<8;f++){const o=document.createElement('canvas');o.width=o.height=R*2+4;const g=o.getContext('2d');const a0=f/8*Math.PI*2;
  for(let y=0;y<o.height;y++)for(let x=0;x<o.width;x++){const dx=x-R-2,dy=y-R-2,d=Math.hypot(dx,dy);if(d>R||d<R-14)continue;
    const ang=Math.atan2(dy,dx)-a0;const seg=Math.sin(ang*4);const edge=d>R-3;
    if(edge){g.fillStyle=seg>0.3?C.cyan:C.cyanD;}else if(d>R-7){if(((x+y)&1)===0)continue;g.fillStyle=seg>0.5?C.cKf:C.cyanD;}else{if(((x*3+y)&3)!==0)continue;g.fillStyle=C.cyanD;}
    g.fillRect(x,y,1,1);}SHF.push(o);}})();
const CORE=sprite(['...cCCCC...','..cCCWWCC..','.cCCWWWWCC.','cCCWWWWWWCc','cCCWWWWWWCc','cCCCWWWWCCc','cCCCCWWCCCc','.cCCCCCCCc.','..ccCCCcc..','...ccccc...'],{c:C.cyanD,C:C.cyan,W:C.white});

// background tile at render res
const TH=960,BG=document.createElement('canvas');BG.width=X(PW);BG.height=TH;
(function(){const g=BG.getContext('2d'),ramp=[C.b0,C.b1,C.b2,C.b3,C.b4,C.b5],bayer=[[0,2],[3,1]];
  for(let y=0;y<TH;y++)for(let x=0;x<BG.width;x++){const ty=y/TH*Math.PI*2,xx=x/4;
    let v=0.5+0.22*Math.sin(xx*0.05+Math.sin(ty)*2)+0.2*Math.sin(ty*3+xx*0.02)+0.16*Math.sin(xx*0.11+ty*5)+0.12*Math.cos(xx*0.023-ty*2)+0.1*Math.sin((xx+y/4)*0.15);
    v=Math.max(0,Math.min(0.999,v));let f=v*ramp.length,i=Math.floor(f),frac=f-i;
    if(frac*4>bayer[y&1][x&1]&&frac>0.5)i=Math.min(ramp.length-1,i+1);i=Math.max(0,i-1);
    if(i===0)continue;g.fillStyle=ramp[i];g.fillRect(x,y,1,1);}})();

const STARS=[];for(let i=0;i<20;i++)STARS.push({x:Math.random()*X(PW),y:Math.random()*H,s:Math.random()<0.3?3:2,c:Math.random()<0.3?C.white:Math.random()<0.5?C.s4:C.s5});
// Scenery is cached once, with periodic edges and no gameplay random calls.
const WORLDS=[
  {name:'ORBITAL FOUNDRY',detail:'OUTER INDUSTRIAL BELT',accent:'#a9b6c0',asset:'world_foundry'},
  {name:'INFECTED SALVAGE',detail:'THE MACHINES ARE CHANGING',accent:'#bc92d5',asset:'world_salvage'},
  {name:'SPORE WILDS',detail:'THE FOREST IS WATCHING',accent:'#aca978',asset:'world_wilds'},
  {name:'LIVING LABYRINTH',detail:'THROUGH THE RIBS OF THE WORLD',accent:'#ad9dc3',asset:'world_labyrinth'},
  {name:'BROOD HEART',detail:'SILENCE THE SOURCE',accent:'#d69391',asset:'world_brood'}
];
const WORLD_TILES=WORLDS.map((world,stage)=>{
  const tile=document.createElement('canvas');tile.width=X(PW);tile.height=TH;
  const g=tile.getContext('2d'),height=TH/K;g.scale(K,K);
  const bed=g.createLinearGradient(0,0,PW,0);
  bed.addColorStop(0,stage===2?'#21141e':'#152029');bed.addColorStop(0.32,'#0b1017');
  bed.addColorStop(0.68,'#0b1017');bed.addColorStop(1,stage===2?'#21141e':'#152029');
  g.fillStyle=bed;g.fillRect(0,0,PW,height);
  // Long conduits and recessed service panels give the foundry its scale.
  if(stage<2){
    for(const side of [0,1]){g.save();g.translate(side?PW:0,0);g.scale(side?-1:1,1);
      for(const x of [13,23,99]){
        g.fillStyle='#080e14';g.fillRect(x-3,0,8,height);
        g.fillStyle='#2e3c46';g.fillRect(x,0,3,height);g.fillStyle='#46515a';g.fillRect(x,0,0.7,height);
      }
      for(let y=-120;y<height+120;y+=120){
        g.save();g.translate(0,y);if(stage===1){g.translate(-8,0);g.rotate(-0.045);}
        const metal=g.createLinearGradient(32,0,94,0);metal.addColorStop(0,'#34414a');metal.addColorStop(0.45,'#202c36');metal.addColorStop(1,'#111b24');
        g.fillStyle='#050b11';g.fillRect(30,6,65,104);g.fillStyle=metal;g.fillRect(33,9,59,97);
        g.strokeStyle='#45515a';g.lineWidth=0.6;g.strokeRect(35,11,55,93);
        g.fillStyle='#101820';g.fillRect(42,24,40,41);
        for(let v=0;v<7;v++){g.fillStyle='#2d3941';g.fillRect(44,26+v*5,36,1.2);}
        g.fillStyle='#4c493b';g.fillRect(44,80,33,5);
        for(let v=0;v<5;v++){g.fillStyle='#1b2022';g.fillRect(45+v*7,80,3,5);}
        for(const x of [37,86])for(const yy of [15,99]){g.fillStyle='#070d13';g.fillRect(x,yy,2.5,2.5);g.fillStyle='#52606a';g.fillRect(x,yy,1,1);}
        g.fillStyle='#0a1118';g.fillRect(0,112,107,8);g.fillStyle='#35434d';g.fillRect(0,112,107,1);
        g.restore();
      }
      g.restore();
    }
    // Quiet central deck: large panels, low contrast, no tiny hazard-like lights.
    g.strokeStyle='#18222c';g.lineWidth=0.6;
    for(let y=-120;y<height+120;y+=120){g.strokeRect(122,y+12,PW-244,96);g.strokeRect(128,y+18,PW-256,84);}
  }
  if(stage>0){
    for(const side of [0,1]){g.save();g.translate(side?PW:0,0);g.scale(side?-1:1,1);
      // Braided roots over salvage become a continuous ribbed wall in the heart.
      for(let y=-120;y<height+120;y+=120){
        const reach=stage===2?113:77;
        g.lineCap='round';g.lineJoin='round';
        for(let j=0;j<4;j++){
          g.beginPath();g.moveTo(-12,y+j*29);g.bezierCurveTo(38,y-14+j*26,reach+20,y+24+j*18,reach-j*13,y+76+j*11);
          for(const [width,col] of [[stage===2?18:10,'#100f15'],[stage===2?13:6,'#3b2c37'],[stage===2?6:2,'#55404a'],[1,'#74606a']]){g.lineWidth=width;g.strokeStyle=col;g.stroke();}
        }
        const sac=g.createRadialGradient(28,y+43,2,40,y+54,34);
        sac.addColorStop(0,stage===2?'#65444e':'#514333');sac.addColorStop(0.5,stage===2?'#39262f':'#342e26');sac.addColorStop(1,'#14131a');
        g.fillStyle=sac;g.beginPath();g.ellipse(33,y+54,stage===2?28:19,38,-0.3,0,Math.PI*2);g.fill();
        g.strokeStyle='#271b25';g.lineWidth=2;
        for(let j=0;j<3;j++){g.beginPath();g.moveTo(21+j*6,y+27);g.quadraticCurveTo(43+j*4,y+51,26+j*5,y+82);g.stroke();}
        g.strokeStyle='#80656b';g.lineWidth=0.7;g.beginPath();g.ellipse(30,y+52,17,29,-0.3,3.4,4.9);g.stroke();
      }
      g.restore();
    }
    if(stage===2){
      // Faint longitudinal fibres suggest an enormous living cavity beneath combat.
      g.strokeStyle='#231c28';g.lineWidth=1;
      for(let x=136;x<PW-120;x+=17){g.beginPath();g.moveTo(x,0);for(let y=0;y<=height;y+=4)g.lineTo(x+Math.sin(y/height*Math.PI*4+x)*7,y);g.stroke();}
    }
  }
  if(stage===2){
    g.fillStyle='#0b1113';g.fillRect(0,0,PW,height);
    for(let y=0;y<height;y+=90)for(const side of [0,1]){const x=side?PW-35:35;g.strokeStyle='#354136';g.lineWidth=10;g.beginPath();g.moveTo(x,y+70);g.quadraticCurveTo(x+(side?-18:18),y+30,x,y);g.stroke();for(let j=0;j<3;j++){g.fillStyle=['#485043','#596044','#38453e'][j];g.beginPath();g.ellipse(x+(j-1)*14,y+22+j*9,26-j*4,10,side?0.4:-0.4,0,Math.PI*2);g.fill();}}
  }
  if(stage===3){
    g.fillStyle='#111019';g.fillRect(0,0,PW,height);
    for(let y=-80;y<height+80;y+=80)for(const side of [0,1]){g.save();g.translate(side?PW:0,y);g.scale(side?-1:1,1);g.strokeStyle='#403746';g.lineWidth=18;g.beginPath();g.moveTo(-10,0);g.quadraticCurveTo(90,15,84,70);g.stroke();g.strokeStyle='#756774';g.lineWidth=3;g.stroke();g.restore();}
  }
  return tile;
});
// Infected Salvage's violet identity is a 'color' composite. Applied per frame over the whole playfield it is the slow
// path on mobile GPUs, so it is baked once: into the procedural tile here and into the prebaked backdrop below.
function tintSalvage(g,w,h){g.save();g.globalCompositeOperation='color';g.fillStyle='rgba(133,72,170,0.42)';g.fillRect(0,0,w,h);g.restore();}
tintSalvage(WORLD_TILES[1].getContext('2d'),X(PW),TH);
// Each painted world is rescaled to playfield width once (and tinted if Salvage) into an offscreen canvas, so the
// per-frame cost is two unscaled blits instead of two rescales of a 1024-wide WebP. Only the current and previous
// stage stay resident; the cache is rebuilt if the image is ever missing so the fallback still shows.
const WORLD_ART=[];
function worldArt(stage){const art=IMG[WORLDS[stage].asset];if(!art)return null;if(WORLD_ART[stage])return WORLD_ART[stage];
  const h=Math.round(art.height*X(PW)/art.width),c=document.createElement('canvas');c.width=X(PW);c.height=h;const g=c.getContext('2d');g.imageSmoothingEnabled=true;g.drawImage(art,0,0,X(PW),h);
  if(stage===1)tintSalvage(g,X(PW),h);
  for(const k in WORLD_ART)if(+k!==stage&&+k!==worldStage&&+k!==worldFrom)delete WORLD_ART[k];
  return WORLD_ART[stage]=c;}
let worldStage=0,worldFrom=0,worldFade=0,worldNotice=0,worldScroll=0;
const worldForWave=wave=>Math.min(4,Math.floor(Math.max(0,wave-1)/5));
function resetWorld(wave=STARTWAVE+1){worldStage=worldFrom=worldForWave(wave);worldFade=0;worldNotice=240;worldScroll=0;}
function updateWorld(){
  worldScroll+=1.1;
  if(worldFade>0)worldFade--;if(worldNotice>0)worldNotice--;
  const next=worldForWave(level);
  if(next!==worldStage){worldFrom=worldStage;worldStage=next;worldFade=150;worldNotice=300;}
}
function drawWorld(){
  const paint=stage=>{
    const art=worldArt(stage);
    if(art){
      const h=art.height,y=Math.floor(worldScroll%(h*2));
      // Alternate vertical reflection joins identical edge pixels without a hard seam.
      for(let i=-2;i<=0;i++){
        const top=y+i*h;if(top>=H||top+h<=0)continue;
        ctx.save();ctx.translate(X(PX),top+(i===-1?h:0));ctx.scale(1,i===-1?-1:1);
        ctx.drawImage(art,0,0);ctx.restore();
      }
    }else{const y=Math.floor(worldScroll%TH);ctx.drawImage(WORLD_TILES[stage],X(PX),y-TH);ctx.drawImage(WORLD_TILES[stage],X(PX),y);}
  };
  ctx.save();
  if(worldFade>0){paint(worldFrom);ctx.globalAlpha=1-worldFade/150;}
  paint(worldStage);ctx.restore();
}
function drawWorldNotice(){
  if(worldNotice<=0||mode!=='play'||boss||bossWarn||paused)return;
  const world=WORLDS[worldStage];ctx.save();ctx.globalAlpha=Math.min(1,worldNotice/40,(300-worldNotice)/30);
  ctx.fillStyle=world.accent;ctx.fillRect(X(PX+16),X(13),X(24),X(1));
  txt(world.name,PX+16,20,world.accent,12);txt(world.detail,PX+16,36,'#86919d',8);ctx.restore();
}
function keycap(ch,x,y){bevel(x,y,11,11,false);txt(ch,x+5.5,y+1,C.white,9,'center');}
function bevel(x,y,w,h,inset){x=X(x);y=X(y);w=X(w);h=X(h);ctx.fillStyle=C.m1;ctx.fillRect(x,y,w,h);
  ctx.fillStyle=inset?C.m0:C.m4;ctx.fillRect(x,y,w,3);ctx.fillRect(x,y,3,h);
  ctx.fillStyle=inset?C.m4:C.m0;ctx.fillRect(x,y+h-3,w,3);ctx.fillRect(x+w-3,y,3,h);
  ctx.fillStyle=C.m2;ctx.fillRect(x+3,y+3,w-6,3);}
// Studio 5x7 bitmap alphabet, extended from the Logo repository. No system font dependency.
const UI_GLYPHS={
  "0":[14,17,19,21,25,17,14],
  "1":[4,12,4,4,4,4,14],
  "2":[14,17,1,2,4,8,31],
  "3":[30,1,1,6,1,1,30],
  "4":[17,17,17,31,1,1,1],
  "5":[31,16,16,30,1,1,30],
  "6":[14,16,16,30,17,17,14],
  "7":[31,1,2,4,8,8,8],
  "8":[14,17,17,14,17,17,14],
  "9":[14,17,17,15,1,1,14],
  "K":[17,18,20,24,20,18,17],
  "G":[14,17,16,23,17,17,14],
  "A":[14,17,17,31,17,17,17],
  "M":[17,27,21,21,17,17,17],
  "E":[31,16,16,30,16,16,31],
  "S":[15,16,16,14,1,1,30],
  "C":[14,17,16,16,16,17,14],
  ":":[0,4,4,0,4,4,0],
  "\\":[16,16,8,4,2,1,1],
  ">":[0,16,8,4,8,16,0],
  "B":[30,17,17,30,17,17,30],
  "_":[0,0,0,0,0,31,31],
  " ":[0,0,0,0,0,0,0],
  "D":[30,17,17,17,17,17,30],
  "F":[31,16,16,30,16,16,16],
  "H":[17,17,17,31,17,17,17],
  "I":[14,4,4,4,4,4,14],
  "J":[7,2,2,2,18,18,12],
  "L":[16,16,16,16,16,16,31],
  "N":[17,25,25,21,19,19,17],
  "O":[14,17,17,17,17,17,14],
  "P":[30,17,17,30,16,16,16],
  "Q":[14,17,17,17,21,18,13],
  "R":[30,17,17,30,20,18,17],
  "T":[31,4,4,4,4,4,4],
  "U":[17,17,17,17,17,17,14],
  "V":[17,17,17,17,17,10,4],
  "W":[17,17,17,21,21,21,10],
  "X":[17,17,10,4,10,17,17],
  "Y":[17,17,10,4,4,4,4],
  "Z":[31,1,2,4,8,16,31],
  "!":[4,4,4,4,4,0,4],
  "?":[14,17,1,2,4,0,4],
  "/":[1,1,2,4,8,16,16],
  "-":[0,0,0,31,0,0,0],
  "+":[0,4,4,31,4,4,0],
  ".":[0,0,0,0,0,12,12],
  ",":[0,0,0,0,0,4,8],
  "'":[4,4,8,0,0,0,0],
  "\"":[10,10,0,0,0,0,0],
  "(":[2,4,8,8,8,4,2],
  ")":[8,4,2,2,2,4,8],
  "[":[14,8,8,8,8,8,14],
  "]":[14,2,2,2,2,2,14],
  "%":[25,25,2,4,8,19,19],
  "=":[0,0,31,0,31,0,0],
  "<":[0,1,8,4,8,1,0],
  "*":[0,10,4,31,4,10,0],
  ";":[0,4,0,0,4,4,8],
  "|":[4,4,4,4,4,4,4],
  "#":[10,10,31,10,31,10,10],
  "&":[12,18,20,12,21,18,13],
  "@":[14,17,23,21,23,16,15],
  "$":[4,15,20,14,5,30,4],
  "^":[4,10,17,0,0,0,0],
  "~":[0,0,9,22,0,0,0],
  "{":[2,4,4,8,4,4,2],
  "}":[8,4,4,2,4,4,8],
  "`":[8,4,0,0,0,0,0],
  "a":[0,0,14,1,15,17,15],
  "b":[16,16,30,17,17,17,30],
  "c":[0,0,14,17,16,17,14],
  "d":[1,1,15,17,17,17,15],
  "e":[0,0,14,17,31,16,14],
  "f":[6,9,8,28,8,8,8],
  "g":[0,0,15,17,15,1,14],
  "h":[16,16,30,17,17,17,17],
  "i":[4,0,12,4,4,4,14],
  "j":[2,0,6,2,2,18,12],
  "k":[16,16,18,20,24,20,18],
  "l":[12,4,4,4,4,4,14],
  "m":[0,0,26,21,21,21,21],
  "n":[0,0,30,17,17,17,17],
  "o":[0,0,14,17,17,17,14],
  "p":[0,0,30,17,30,16,16],
  "q":[0,0,15,17,15,1,1],
  "r":[0,0,22,25,16,16,16],
  "s":[0,0,15,16,14,1,30],
  "t":[8,8,28,8,8,9,6],
  "u":[0,0,17,17,17,19,13],
  "v":[0,0,17,17,17,10,4],
  "w":[0,0,17,17,21,21,10],
  "x":[0,0,17,10,4,10,17],
  "y":[0,0,17,17,15,1,14],
  "z":[0,0,31,2,4,8,31]
};
const UI_TEXT_CACHE=new Map();
function txt(s,x,y,col=C.text,size=14,align='left'){
  s=String(s).replace(/[–—]/g,'-').replace(/…/g,'...').replace(/[“”]/g,'"').replace(/[‘’]/g,"'");
  const key=col+'|'+s;let bitmap=UI_TEXT_CACHE.get(key);
  if(!bitmap){
    bitmap=document.createElement('canvas');bitmap.width=Math.max(1,s.length*6-1);bitmap.height=7;
    const g=bitmap.getContext('2d');g.fillStyle=col;
    for(let i=0;i<s.length;i++){const rows=UI_GLYPHS[s[i]]||UI_GLYPHS['?'];for(let r=0;r<7;r++)for(let c=0;c<5;c++)if(rows[r]&(1<<(4-c)))g.fillRect(i*6+c,r,1,1);}
    if(UI_TEXT_CACHE.size>=128)UI_TEXT_CACHE.delete(UI_TEXT_CACHE.keys().next().value);
    UI_TEXT_CACHE.set(key,bitmap);
  }
  const scale=Math.max(2,Math.round(size*K/10)),w=bitmap.width*scale,h=7*scale;
  ctx.save();ctx.imageSmoothingEnabled=false;
  ctx.drawImage(bitmap,X(x)-(align==='center'?Math.round(w/2):align==='right'?w:0),X(y),w,h);ctx.restore();
}
