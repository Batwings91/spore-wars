'use strict';
// Enemy plasma, pickups, shield ring, core icon, background tile, stars, the three worlds, and the bevel/keycap/txt primitives.
const PLASMA=[sprite(['..mm..','.mMMm.','mMWWMm','mMWWMm','.mMMm.','..mm..'],{m:'#a020a0',M:C.magenta,W:C.white}),
              sprite(['..mm..','.mMMm.','mMMMMm','mMMWMm','.mMMm.','..mm..'],{m:'#a020a0',M:C.magenta,W:C.white})];
// capsule pickups: metal shell, coloured glass, letter drawn on top
function capsule(col,colD){return sprite(mirror(['....111','..11222','.122333','.123ccc','1223ccc','1223ccc','1223ccc','1223ccc','1223ccc','.123ccc','.122333','..11222','....111']),{1:C.s1,2:C.s3,3:C.s5,c:col});}
const CAP_W=capsule(C.orange),CAP_S=capsule(C.cyan),CAP_B=capsule(C.G);
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
  {name:'INFECTED SALVAGE',detail:'THE MACHINES ARE CHANGING',accent:'#b7a687',asset:'world_salvage'},
  {name:'SPORE HEART',detail:'BEYOND THE LAST MACHINE',accent:'#c09ba9',asset:'world_heart'}
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
  return tile;
});
let worldStage=0,worldFrom=0,worldFade=0,worldNotice=0,worldScroll=0;
const worldForWave=wave=>Math.min(2,Math.floor(Math.max(0,wave-1)/5));
function resetWorld(){worldStage=worldFrom=worldForWave(STARTWAVE+1);worldFade=0;worldNotice=240;worldScroll=0;}
function updateWorld(){
  worldScroll+=1.1;
  if(worldFade>0)worldFade--;if(worldNotice>0)worldNotice--;
  const next=worldForWave(level);
  if(next!==worldStage){worldFrom=worldStage;worldStage=next;worldFade=150;worldNotice=300;}
}
function drawWorld(){
  const paint=stage=>{
    const art=IMG[WORLDS[stage].asset];
    if(art){
      const h=Math.round(art.height*X(PW)/art.width),y=Math.floor(worldScroll%(h*2));
      // Alternate vertical reflection joins identical edge pixels without a hard seam.
      for(let i=-2;i<=0;i++){
        const top=y+i*h;if(top>=H||top+h<=0)continue;
        ctx.save();ctx.translate(X(PX),top+(i===-1?h:0));ctx.scale(1,i===-1?-1:1);
        ctx.imageSmoothingEnabled=true;ctx.drawImage(art,0,0,X(PW),h);ctx.restore();
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
function txt(s,x,y,col,size,align){ctx.font='bold '+Math.round((size||14)*K)+'px monospace';ctx.fillStyle=col||C.text;ctx.textAlign=align||'left';ctx.textBaseline='top';ctx.fillText(s,X(x),X(y));}
