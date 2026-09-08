'use strict';
// Cached decorative fauna, active wall organisms and reusable route terrain.
// World-space state advances only from updateWorldEncounters(), so pause freezes every tell and collision shape.

const FAUNA_DECOR_H=720;
// Decor tiles are 880x720 canvases (~2.5 MB each): build one on first use and keep only the current stage resident,
// instead of five at boot. faunaDecor() is the only way in.
const FAUNA_DECOR=[];
function faunaDecor(stage){if(!FAUNA_DECOR[stage])FAUNA_DECOR[stage]=buildFaunaDecor(stage);for(const k in FAUNA_DECOR)if(+k!==stage)delete FAUNA_DECOR[k];return FAUNA_DECOR[stage];}
function buildFaunaDecor(stage){
  const c=document.createElement('canvas');c.width=X(PW);c.height=FAUNA_DECOR_H;
  if(stage===0)return c;
  const g=c.getContext('2d'),h=FAUNA_DECOR_H/K;g.scale(K,K);g.lineCap='round';g.lineJoin='round';
  const palette=[null,['#402f46','#76546d','#a07183'],['#34392f','#697057','#9a9168'],['#352c3d','#6b586c','#a38b9b'],['#42272f','#75434e','#b26b67']][stage];
  const bands=[{y:0,h:112,density:5},{y:112,h:96,density:1},{y:208,h:98,density:3},{y:306,h:54,density:0}];
  g.globalAlpha=stage===1?0.26:0.3;
  for(const band of bands){
    if(!band.density)continue;
    for(const side of [-1,1])for(let i=0;i<band.density;i++){
      const edge=side<0?0:PW,x=edge+side*(18+(i%3)*13),y=band.y+16+(i*31)%Math.max(30,band.h-22);
      g.strokeStyle=palette[i%2];g.lineWidth=stage===1?3.5:stage===3?5:4;
      g.beginPath();g.moveTo(edge,y-26);g.bezierCurveTo(x-side*19,y-12,x+side*14,y+12,x,y+30);g.stroke();
      if(stage===1){
        g.fillStyle=palette[1];g.beginPath();g.ellipse(x,y,8,13,side*0.35,0,Math.PI*2);g.fill();
        g.strokeStyle='#9b7892';g.lineWidth=1;g.beginPath();g.moveTo(x-side*5,y-7);g.lineTo(x+side*4,y+8);g.stroke();
      }else if(stage===2){
        for(let p=-1;p<=1;p++){g.fillStyle=p?palette[1]:palette[2];g.beginPath();g.ellipse(x+side*p*8,y+p*6,10-Math.abs(p)*2,5,side*p*0.45,0,Math.PI*2);g.fill();}
      }else if(stage===3){
        g.strokeStyle=palette[1];g.lineWidth=7;g.beginPath();g.moveTo(edge,y-18);g.quadraticCurveTo(x+side*8,y,x,y+24);g.stroke();
        g.strokeStyle=palette[2];g.lineWidth=1;for(let r=-8;r<=12;r+=5){g.beginPath();g.moveTo(x-side*5,y+r);g.lineTo(x+side*7,y+r+2);g.stroke();}
      }else{
        g.strokeStyle=palette[0];g.lineWidth=7;g.beginPath();g.moveTo(edge,y-22);g.quadraticCurveTo(x-side*12,y,x,y+27);g.stroke();
        g.fillStyle=palette[1];g.beginPath();g.ellipse(x,y,7+(i%2)*3,10+(i%3)*2,side*0.25,0,Math.PI*2);g.fill();
        g.fillStyle=palette[2];g.globalAlpha=0.16;g.beginPath();g.ellipse(x-side*2,y-2,3,5,0,0,Math.PI*2);g.fill();g.globalAlpha=0.3;
      }
    }
  }
  return c;
}

function drawFaunaBackground(){
  if(worldStage<1)return;
  const tile=faunaDecor(worldStage),y=Math.floor(worldScroll%tile.height);
  ctx.save();ctx.drawImage(tile,X(PX),y-tile.height);ctx.drawImage(tile,X(PX),y);
  // Waves 21-22 establish the Lattice as distant ecology before its interactive wave-23 sequence.
  if(worldStage===4&&!broodLattice&&level<23){const ly=Math.floor((worldScroll*0.24)%X(430))-X(280);ctx.globalAlpha=0.12;ctx.drawImage(LATTICE_ART,X(PX+PW/2-110),ly);}
  ctx.restore();
}

const WALL_FAUNA=Object.freeze({
  spitter:{cycle:252,tell:48},
  snap:{cycle:220,tell:54,active:28,reach:66}
});
const WALL_FAUNA_LIMIT=3;
let wallFauna=[],faunaTimer=180,faunaSide=0,faunaCount=0;

const ROUTE_TEMPLATES=Object.freeze({
  centralIsland:Object.freeze({
    id:'central-island',stage:3,width:104,height:260,telegraph:92,margin:10,
    primitives:Object.freeze([
      {type:'rect',x:-36,y:0,w:72,h:42},
      {type:'rect',x:-52,y:42,w:104,h:176},
      {type:'rect',x:-36,y:218,w:72,h:42}
    ])
  })
});
const ROUTE_SURFACE=(()=>{
  const c=document.createElement('canvas');c.width=X(124);c.height=X(280);const g=c.getContext('2d');g.scale(K,K);g.translate(62,10);
  const ps=ROUTE_TEMPLATES.centralIsland.primitives;
  g.save();g.beginPath();for(const p of ps)g.rect(p.x,p.y,p.w,p.h);g.clip();
  const skin=g.createLinearGradient(-54,0,54,0);skin.addColorStop(0,'#2a1828');skin.addColorStop(0.48,'#4b2a40');skin.addColorStop(1,'#241520');g.fillStyle=skin;g.fillRect(-62,0,124,260);
  g.lineCap='round';g.lineJoin='round';
  g.strokeStyle='#180f18';g.lineWidth=20;g.beginPath();g.moveTo(-5,-7);g.bezierCurveTo(18,45,-21,91,4,132);g.bezierCurveTo(23,166,-13,216,6,269);g.stroke();
  g.strokeStyle='#704051';g.lineWidth=9;g.stroke();g.strokeStyle='#ac7580';g.lineWidth=1.5;g.stroke();
  const roots=[[-4,31,-42,18],[7,65,47,52],[-5,104,-49,91],[5,143,46,125],[-3,182,-45,173],[4,222,44,236]];
  for(const [x,y,tx,ty] of roots){g.strokeStyle='#1a111a';g.lineWidth=10;g.beginPath();g.moveTo(x,y);g.quadraticCurveTo(tx*0.45,y+(ty-y)*0.15,tx,ty);g.stroke();g.strokeStyle='#684052';g.lineWidth=4;g.stroke();g.strokeStyle='#a2757d';g.lineWidth=0.8;g.stroke();}
  const plates=[[-43,37,15,25,-0.5],[43,77,18,28,0.45],[-45,127,14,24,-0.35],[43,165,17,29,0.4],[-39,213,13,25,-0.5]];
  for(const [x,y,rx,ry,a] of plates){g.fillStyle='#6d5a66';g.strokeStyle='#b49ba1';g.lineWidth=1.5;g.beginPath();g.ellipse(x,y,rx,ry,a,0,Math.PI*2);g.fill();g.stroke();g.fillStyle='#392737';g.beginPath();g.ellipse(x+(x<0?4:-4),y,rx*0.45,ry*0.72,a,0,Math.PI*2);g.fill();}
  const organs=[[-5,18,8,11],[9,91,10,15],[-8,151,7,12],[5,202,11,16],[0,246,7,10]];
  for(const [x,y,rx,ry] of organs){g.fillStyle='#7f4453';g.strokeStyle='#bc7780';g.lineWidth=1;g.beginPath();g.ellipse(x,y,rx,ry,0,0,Math.PI*2);g.fill();g.stroke();g.fillStyle='#bd705e';g.globalAlpha=0.3;g.beginPath();g.ellipse(x-2,y-3,rx*0.3,ry*0.45,0,0,Math.PI*2);g.fill();g.globalAlpha=1;}
  g.restore();
  return c;
})();
const MAX_SHIP_HALF_WIDTH=58;
let routeSegment=null,routeLevel=0,routeTimer=240,routeSpawnedLevel=0;

const LATTICE_NODES=Object.freeze([
  {x:-73,y:20,r:18,depth:0},{x:-27,y:3,r:11,depth:1,interactive:true},{x:25,y:24,r:22,depth:0},
  {x:72,y:61,r:14,depth:1},{x:-61,y:92,r:9,depth:2},{x:-8,y:104,r:20,depth:1,interactive:true},
  {x:58,y:132,r:15,depth:0},{x:-48,y:171,r:14,depth:1},{x:9,y:183,r:10,depth:2},
  {x:69,y:218,r:19,depth:1,interactive:true},{x:-5,y:251,r:13,depth:0}
]);
const LATTICE_INTERACTIVE=LATTICE_NODES.map((n,i)=>n.interactive?i:-1).filter(i=>i>=0);
const LATTICE_LINKS=Object.freeze([[0,1],[1,2],[1,5],[2,3],[3,6],[4,5],[5,6],[5,7],[5,8],[6,9],[7,8],[8,9],[8,10]]);
const LATTICE_PULSE_PATH=Object.freeze([0,1,2,3,6,9,8,10,8,7,5,4,5,1]);
const LATTICE_ART=(()=>{
  const c=document.createElement('canvas');c.width=X(220);c.height=X(300);const g=c.getContext('2d');g.scale(K,K);g.translate(110,20);g.lineCap='round';g.lineJoin='round';
  for(const [a,b] of LATTICE_LINKS){const p=LATTICE_NODES[a],q=LATTICE_NODES[b],mx=(p.x+q.x)/2+(a%2?9:-7),my=(p.y+q.y)/2;
    g.strokeStyle='#1b1119';g.lineWidth=11-Math.max(p.depth,q.depth)*2;g.beginPath();g.moveTo(p.x,p.y);g.quadraticCurveTo(mx,my,q.x,q.y);g.stroke();
    g.strokeStyle='#5b2d3a';g.lineWidth=5-Math.max(p.depth,q.depth);g.stroke();g.strokeStyle='#9b4f47';g.lineWidth=1;g.stroke();}
  for(const n of LATTICE_NODES){g.globalAlpha=[0.72,0.52,0.34][n.depth];g.fillStyle='#251620';g.strokeStyle='#794552';g.lineWidth=2;g.beginPath();
    for(let i=0;i<9;i++){const a=i/9*Math.PI*2,r=n.r*(0.83+((i*7+n.r)%5)*0.045),x=n.x+Math.cos(a)*r,y=n.y+Math.sin(a)*r;if(i)g.lineTo(x,y);else g.moveTo(x,y);}g.closePath();g.fill();g.stroke();
    g.fillStyle='#75382f';g.globalAlpha*=0.7;g.beginPath();g.ellipse(n.x-2,n.y-2,n.r*0.46,n.r*0.55,(n.x+n.y)*0.01,0,Math.PI*2);g.fill();}
  g.globalAlpha=1;return c;
})();
let broodLattice=null,latticeLevel=0,latticeTimer=180,latticeSpawnedLevel=0;

function resetWorldEncounters(){
  wallFauna=[];faunaTimer=180;faunaSide=0;faunaCount=0;
  routeSegment=null;routeLevel=0;routeTimer=240;routeSpawnedLevel=0;
  broodLattice=null;latticeLevel=0;latticeTimer=180;latticeSpawnedLevel=0;
  if(eshots)eshots=eshots.filter(s=>!s.fauna);
}

function faunaSuppressed(){return !!(boss||bossWarn||bossDying||sectorPending||mode!=='play');}
function spawnWallFauna(kind=faunaCount%2?'snap':'spitter',edge=faunaSide?1:-1){
  const profile=WALL_FAUNA[kind],id=faunaCount++;
  faunaSide=faunaSide?0:1;
  const x=edge<0?PX+12:PX+PW-12,side=edge<0?1:-1;
  const e={id,kind,side,x,y:-34,anchor:worldScroll+X(34),ct:profile.cycle+(id%3)*17,aim:Math.PI/2,flash:0};
  wallFauna.push(e);return e;
}

function fireSporeOrgan(e){
  const speed=1.15,a=e.aim;
  eshots.push({x:e.x+e.side*18,y:e.y,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed,ground:true,bio:true,fauna:'spore',radius:6});
  SFX.plasma();e.flash=8;
}

function updateWallFauna(){
  const suppress=faunaSuppressed();
  if(worldStage<1||level<6){wallFauna=[];faunaTimer=180;return;}
  if(!suppress&&--faunaTimer<=0&&wallFauna.length<WALL_FAUNA_LIMIT){
    spawnWallFauna();faunaTimer=220+(faunaCount%3)*45;
  }
  for(const e of wallFauna){
    e.y=(worldScroll-e.anchor)/K;if(e.flash>0)e.flash--;
    const profile=WALL_FAUNA[e.kind];if(suppress||e.y<18||e.y>LH-46)continue;
    // The snap bloom stays folded while the split is present, preserving both mature-ship lanes.
    if(routeSegment&&e.kind==='snap'){e.ct=Math.max(e.ct,profile.tell+1);continue;}
    if(e.kind==='spitter'&&e.ct===profile.tell)e.aim=Math.atan2(ship.y-e.y,ship.x-e.x);
    if(--e.ct<=0){
      if(e.kind==='spitter')fireSporeOrgan(e);
      e.ct=profile.cycle+(e.id%3)*17;
    }
    if(e.kind==='snap'&&e.ct<=profile.active){
      const tip=e.x+e.side*profile.reach,minX=Math.min(e.x,tip)-8,maxX=Math.max(e.x,tip)+8;
      if(ship.x+6>=minX&&ship.x-6<=maxX&&Math.abs(ship.y-e.y)<18)hitShip();
    }
  }
  wallFauna=wallFauna.filter(e=>e.y<LH+45);
}

function routePrimitives(segment=routeSegment){
  if(!segment)return[];
  return segment.template.primitives.map(p=>p.type==='rect'?{type:'rect',x:segment.x+p.x,y:segment.y+p.y,w:p.w,h:p.h}:p);
}
function routeLaneClearance(segment=routeSegment){
  if(!segment)return null;
  const primitives=routePrimitives(segment),required=2*(MAX_SHIP_HALF_WIDTH+segment.template.margin);
  return{left:Math.min(...primitives.map(p=>p.x-PX)),right:Math.min(...primitives.map(p=>PX+PW-(p.x+p.w))),required};
}
function spawnRouteSegment(template=ROUTE_TEMPLATES.centralIsland){
  routeSegment={template,x:PX+PW/2,y:-template.height-template.telegraph-12,playerContact:false};return routeSegment;
}
function rectOverlap(x,y,halfW,halfH,r){return x+halfW>r.x&&x-halfW<r.x+r.w&&y+halfH>r.y&&y-halfH<r.y+r.h;}
function resolvePlayerTerrain(){
  if(!routeSegment)return false;
  const halfW=sideLaserOwned()?MAX_SHIP_HALF_WIDTH:30,halfH=23;
  let touching=false;const primitives=routePrimitives();
  // At most three passes resolve the three touching stepped rectangles without an unbounded collision loop.
  for(let pass=0;pass<primitives.length;pass++)for(const r of primitives){
      if(!rectOverlap(ship.x,ship.y,halfW,halfH,r))continue;
      touching=true;
      const dl=Math.abs(ship.x-(r.x-halfW)),dr=Math.abs((r.x+r.w+halfW)-ship.x),dt=Math.abs(ship.y-(r.y-halfH)),db=Math.abs((r.y+r.h+halfH)-ship.y);
      const edge=Math.min(dl,dr,dt,db);
      if(edge===dl)ship.x=r.x-halfW-0.1;else if(edge===dr)ship.x=r.x+r.w+halfW+0.1;
      else if(edge===dt)ship.y=r.y-halfH-0.1;else ship.y=r.y+r.h+halfH+0.1;
      ship.x=Math.max(PX+halfW,Math.min(PX+PW-halfW,ship.x));ship.y=Math.max(34,Math.min(LH-34,ship.y));
    }
  if(touching&&!routeSegment.playerContact)hitShip();
  routeSegment.playerContact=touching;return touching;
}
function placeInOpenLane(e,radius=8){
  if(!routeSegment)return false;
  for(const r of routePrimitives()){
    if(!rectOverlap(e.x,e.y,radius,radius,r))continue;
    const left=r.x-radius-2,right=r.x+r.w+radius+2;
    e.x=e.x<r.x+r.w/2?left:right;return true;
  }
  return false;
}
function keepRouteEntitiesReachable(){
  if(!routeSegment)return;
  // Air enemies, bullets and rockets overfly the island and remain targetable. Ground fixtures and rewards must occupy a lane.
  for(const e of ground)placeInOpenLane(e,24);
  for(const d of drops)placeInOpenLane(d,12);
}

function updateRouteSegment(){
  if(level!==routeLevel){routeLevel=level;routeTimer=240;}
  const eligible=worldStage===3&&level===18&&!faunaSuppressed();
  if(eligible&&routeSpawnedLevel!==level&&--routeTimer<=0){spawnRouteSegment();routeSpawnedLevel=level;}
  if(routeSegment){routeSegment.y+=1.1/K;resolvePlayerTerrain();if(routeSegment.y>LH+30)routeSegment=null;}
}

function spawnBroodLattice(){
  broodLattice={x:PX+PW/2,y:22,t:0,pulse:0,next:0,rewarded:false,open:false,nodes:LATTICE_NODES.map((n,i)=>({state:n.interactive?'dormant':'background',hp:n.interactive?6:0,flash:0,i}))};
  return broodLattice;
}
function latticeNodeWorld(i,lattice=broodLattice){const n=LATTICE_NODES[i];return{x:lattice.x+n.x,y:lattice.y+n.y,r:n.r};}
function activeLatticeNode(){if(!broodLattice)return null;return broodLattice.nodes.find(n=>n.state==='tell'||n.state==='open');}
function updateBroodLattice(){
  if(level!==latticeLevel){latticeLevel=level;latticeTimer=180;}
  const hardSuppress=boss||bossWarn||bossDying||sectorPending||mode!=='play';
  if(hardSuppress){if(broodLattice)broodLattice=null;return;}
  if(worldStage===4&&level===23&&latticeSpawnedLevel!==level&&--latticeTimer<=0){spawnBroodLattice();latticeSpawnedLevel=level;}
  const l=broodLattice;if(!l)return;l.t++;l.y+=0.16;
  for(const n of l.nodes)if(n.flash>0)n.flash--;
  if(!l.open){
    const active=activeLatticeNode();
    if(active){
      if(active.state==='tell'&&--active.timer<=0){active.state='open';active.timer=150;}
      else if(active.state==='open'&&--active.timer<=0){active.state='dormant';l.pulse=0;}
    }else{
      l.pulse=(l.pulse+1)%(LATTICE_PULSE_PATH.length*9);const at=LATTICE_PULSE_PATH[Math.floor(l.pulse/9)],target=LATTICE_INTERACTIVE[l.next];
      if(l.t>72&&at===target){const n=l.nodes[target];n.state='tell';n.timer=42;}
    }
  }
  if(l.y>LH+45)broodLattice=null;
}
function destroyLatticeNode(node){
  if(!broodLattice||node.state==='destroyed')return;const p=latticeNodeWorld(node.i);node.state='destroyed';node.hp=0;score+=100;addFloat(p.x,p.y,'+100',C.yellow);SFX.boom(false);
  for(let i=0;i<8;i++){const a=i/8*Math.PI*2,r=4+(i%3)*3;booms.push({x:p.x+Math.cos(a)*r,y:p.y+Math.sin(a)*r,life:8,kind:'impact',bio:true});}
  const remaining=LATTICE_INTERACTIVE.filter(i=>broodLattice.nodes[i].state!=='destroyed');
  if(remaining.length){broodLattice.next=LATTICE_INTERACTIVE.indexOf(remaining[0]);broodLattice.pulse=0;}
  else if(!broodLattice.rewarded){broodLattice.rewarded=true;broodLattice.open=true;for(const dx of [-24,0,24])drops.push({x:broodLattice.x+dx,y:p.y,k:'core'});pickupEvent('LATTICE OPEN / SALVAGE RELEASED','#f0b174');}
}
function hitLatticeNode(node,damage,x,y){node.hp-=damage;node.flash=6;addHitImpact(x,y,true);SFX.hit();if(node.hp<=0)destroyLatticeNode(node);}
function damageLatticeWithShots(){
  if(!broodLattice)return false;let hit=false;
  for(const s of shots){if(s.y<-50)continue;for(const node of broodLattice.nodes){if(node.state!=='open')continue;const p=latticeNodeWorld(node.i);if(Math.hypot(s.x-p.x,s.y-p.y)>p.r)continue;hitLatticeNode(node,s.dmg||1,s.x,s.y);s.y=-99;hit=true;break;}}
  return hit;
}
function damageLatticeWithSideLaser(x,halfWidth,damage){
  if(!broodLattice)return false;let hit=false;
  for(const node of broodLattice.nodes){if(node.state!=='open')continue;const p=latticeNodeWorld(node.i);if(p.y<=0||p.y>ship.y||Math.abs(x-p.x)>halfWidth+p.r)continue;hitLatticeNode(node,damage,x,p.y);hit=true;}
  return hit;
}
function bombLattice(damage=6){if(!broodLattice)return;for(const node of broodLattice.nodes)if(node.state==='open'){const p=latticeNodeWorld(node.i);hitLatticeNode(node,damage,p.x,p.y);}}
function updateWorldEncounters(){updateWallFauna();updateRouteSegment();updateBroodLattice();}

function drawBroodLattice(){
  const l=broodLattice;if(!l)return;ctx.save();ctx.globalAlpha=l.open?0.42:0.78;ctx.drawImage(LATTICE_ART,X(l.x-110),X(l.y-20));ctx.globalAlpha=1;
  if(!activeLatticeNode()&&!l.open){const i=Math.floor(l.pulse/9),f=(l.pulse%9)/9,a=LATTICE_NODES[LATTICE_PULSE_PATH[i]],b=LATTICE_NODES[LATTICE_PULSE_PATH[(i+1)%LATTICE_PULSE_PATH.length]],x=l.x+a.x+(b.x-a.x)*f,y=l.y+a.y+(b.y-a.y)*f;
    ctx.fillStyle='#f09a55';ctx.globalAlpha=0.45;ctx.beginPath();ctx.arc(X(x),X(y),X(5),0,Math.PI*2);ctx.fill();ctx.fillStyle='#ffd398';ctx.globalAlpha=0.8;ctx.beginPath();ctx.arc(X(x),X(y),X(2),0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;}
  for(const node of l.nodes){if(node.state==='background'||node.state==='dormant')continue;const base=LATTICE_NODES[node.i],p=latticeNodeWorld(node.i),tell=node.state==='tell',open=node.state==='open',destroyed=node.state==='destroyed',push=tell?1-node.timer/42:open?1:0;
    ctx.save();ctx.translate(X(p.x),X(p.y));
    if(destroyed){ctx.fillStyle='#130c13';ctx.beginPath();ctx.arc(0,0,X(base.r+2),0,Math.PI*2);ctx.fill();ctx.strokeStyle='#9d5b64';ctx.lineWidth=X(3);for(const side of [-1,1]){ctx.beginPath();ctx.arc(X(side*5),0,X(base.r*0.72),side<0?-1.9:0.2,side<0?1.9:4.1);ctx.stroke();}ctx.restore();continue;}
    ctx.scale(1+push*0.16,1+push*0.16);ctx.strokeStyle=tell?'#f0a666':'#ffd0a0';ctx.lineWidth=X(open?3:2);ctx.globalAlpha=tell?0.45+push*0.45:0.95;ctx.beginPath();ctx.arc(0,0,X(base.r+5-push*3),0,Math.PI*2);ctx.stroke();
    ctx.fillStyle=open?'#4a1421':'#6f3541';ctx.beginPath();ctx.ellipse(0,0,X(base.r*0.72),X(base.r*0.8),0,0,Math.PI*2);ctx.fill();
    if(open){ctx.fillStyle='#ffb35f';ctx.beginPath();ctx.ellipse(0,0,X(base.r*0.28),X(base.r*0.48),0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#ffe0a3';ctx.fillRect(X(-1),X(-base.r*0.33),X(2),X(base.r*0.66));}
    if(node.flash>0){ctx.globalAlpha=node.flash/6;ctx.fillStyle='#fff0c8';ctx.beginPath();ctx.arc(0,0,X(base.r),0,Math.PI*2);ctx.fill();}
    ctx.restore();}
  ctx.restore();
}

function drawWallFauna(){
  for(const e of wallFauna){
    const profile=WALL_FAUNA[e.kind],tell=e.ct<=profile.tell,charge=tell?1-e.ct/profile.tell:0;
    ctx.save();ctx.translate(X(e.x),X(e.y));ctx.scale(e.side,1);ctx.lineCap='round';ctx.lineJoin='round';
    ctx.strokeStyle='#241728';ctx.lineWidth=X(7);ctx.beginPath();ctx.moveTo(X(-18),X(-20));ctx.quadraticCurveTo(X(2),0,X(-16),X(22));ctx.stroke();
    if(e.kind==='spitter'){
      const open=tell?charge:0,bright=tell?'#e9a06f':'#875469';
      ctx.fillStyle='#3d283d';ctx.strokeStyle=tell?'#d9a274':'#6f526a';ctx.lineWidth=X(tell?2:1);ctx.beginPath();ctx.ellipse(0,0,X(14+open*3),X(19+open*4),0,0,Math.PI*2);ctx.fill();ctx.stroke();
      for(const a of [-0.65,0,0.65]){ctx.save();ctx.rotate(a*open);ctx.fillStyle='#684158';ctx.beginPath();ctx.ellipse(X(11+open*4),0,X(10),X(5),0,0,Math.PI*2);ctx.fill();ctx.restore();}
      ctx.fillStyle=bright;ctx.beginPath();ctx.ellipse(X(10+open*6),0,X(3+open*3),X(5+open*2),0,0,Math.PI*2);ctx.fill();
      if(tell){ctx.globalAlpha=0.45+charge*0.45;ctx.strokeStyle='#ffd0a0';ctx.beginPath();ctx.arc(X(10),0,X(19-charge*7),0,Math.PI*2);ctx.stroke();}
    }else{
      const active=e.ct<=profile.active,open=tell?Math.min(1,(profile.tell-e.ct)/(profile.tell-profile.active)):0;
      ctx.fillStyle='#40253a';ctx.strokeStyle=tell?'#e4b881':'#72516a';ctx.lineWidth=X(tell?2:1);ctx.beginPath();ctx.ellipse(0,0,X(13),X(17),0,0,Math.PI*2);ctx.fill();ctx.stroke();
      for(const a of [-0.7,-0.23,0.23,0.7]){ctx.save();ctx.rotate(a*(0.5+open));ctx.fillStyle=tell?'#8b5964':'#58364e';ctx.beginPath();ctx.moveTo(0,0);ctx.quadraticCurveTo(X(15),X(-7),X(25+open*8),0);ctx.quadraticCurveTo(X(15),X(7),0,0);ctx.fill();ctx.restore();}
      if(active){ctx.strokeStyle='#e5c6a0';ctx.lineWidth=X(8);ctx.beginPath();ctx.moveTo(X(12),0);ctx.lineTo(X(profile.reach),0);ctx.stroke();ctx.strokeStyle='#8e4665';ctx.lineWidth=X(3);ctx.stroke();ctx.fillStyle='#ffd59a';ctx.beginPath();ctx.moveTo(X(profile.reach+7),0);ctx.lineTo(X(profile.reach-4),X(-7));ctx.lineTo(X(profile.reach-4),X(7));ctx.closePath();ctx.fill();}
      else if(tell){ctx.globalAlpha=0.5+open*0.35;ctx.strokeStyle='#f0c893';ctx.beginPath();ctx.arc(0,0,X(21+open*5),0,Math.PI*2);ctx.stroke();}
    }
    if(e.flash>0){ctx.globalAlpha=e.flash/8;ctx.fillStyle='#ffe0b5';ctx.beginPath();ctx.arc(X(12),0,X(6),0,Math.PI*2);ctx.fill();}
    ctx.restore();
  }
}

function drawRouteSegments(){
  if(!routeSegment)return;
  const segment=routeSegment,primitives=routePrimitives(segment),front=Math.max(...primitives.map(r=>r.y+r.h));
  ctx.save();
  // The lower chevrons arrive first and identify both safe lanes before the blocking edge reaches the player.
  const tellY=front+42,fade=Math.max(0,Math.min(1,(tellY+30)/70,(LH+35-tellY)/70));ctx.globalAlpha=fade;
  ctx.strokeStyle='#dfbd7e';ctx.lineWidth=X(2);
  for(const side of [-1,1]){const cx=segment.x+side*105;ctx.beginPath();ctx.moveTo(X(cx-side*20),X(tellY-12));ctx.lineTo(X(cx),X(tellY));ctx.lineTo(X(cx-side*20),X(tellY+12));ctx.stroke();}
  if(fade>0.15)txt('SPLIT',segment.x,tellY-4,'#d8b986',9,'center');ctx.globalAlpha=1;
  // Cached ribs and embedded organs share the exact stepped silhouette used by collision.
  ctx.drawImage(ROUTE_SURFACE,X(segment.x-62),X(segment.y-10));
  ctx.strokeStyle='#9b858e';ctx.lineWidth=X(1.5);ctx.beginPath();ctx.moveTo(X(segment.x-36),X(segment.y));ctx.lineTo(X(segment.x+36),X(segment.y));ctx.lineTo(X(segment.x+36),X(segment.y+42));ctx.lineTo(X(segment.x+52),X(segment.y+42));ctx.lineTo(X(segment.x+52),X(segment.y+218));ctx.lineTo(X(segment.x+36),X(segment.y+218));ctx.lineTo(X(segment.x+36),X(segment.y+260));ctx.lineTo(X(segment.x-36),X(segment.y+260));ctx.lineTo(X(segment.x-36),X(segment.y+218));ctx.lineTo(X(segment.x-52),X(segment.y+218));ctx.lineTo(X(segment.x-52),X(segment.y+42));ctx.lineTo(X(segment.x-36),X(segment.y+42));ctx.closePath();ctx.stroke();
  ctx.restore();
}

function drawFaunaProjectile(s){
  const a=Math.atan2(s.vy,s.vx);ctx.save();ctx.translate(X(s.x),X(s.y));ctx.rotate(a);
  ctx.strokeStyle='rgba(176,104,132,0.5)';ctx.lineWidth=X(3);ctx.beginPath();ctx.moveTo(X(-13),0);ctx.lineTo(X(-4),0);ctx.stroke();
  ctx.fillStyle='#5d3048';ctx.strokeStyle='#f0aa79';ctx.lineWidth=X(1.5);ctx.beginPath();ctx.ellipse(0,0,X(6),X(5),0,0,Math.PI*2);ctx.fill();ctx.stroke();
  ctx.fillStyle='#ffd2a2';ctx.beginPath();ctx.ellipse(X(2),X(-1),X(2),X(1.5),0,0,Math.PI*2);ctx.fill();ctx.restore();
}
function drawRayProjectile(s){
  const a=Math.atan2(s.vy,s.vx);ctx.save();ctx.translate(X(s.x),X(s.y));ctx.rotate(a);
  ctx.strokeStyle='rgba(226,126,92,0.45)';ctx.lineWidth=X(2);ctx.beginPath();ctx.moveTo(X(-12),0);ctx.lineTo(X(-3),0);ctx.stroke();
  ctx.fillStyle='#8c3f4c';ctx.strokeStyle='#ffc17f';ctx.lineWidth=X(1);ctx.beginPath();ctx.moveTo(X(6),0);ctx.lineTo(X(-3),X(-4));ctx.lineTo(X(-1),0);ctx.lineTo(X(-3),X(4));ctx.closePath();ctx.fill();ctx.stroke();
  ctx.fillStyle='#ffe0a3';ctx.beginPath();ctx.arc(X(2),0,X(1.5),0,Math.PI*2);ctx.fill();ctx.restore();
}
