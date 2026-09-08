'use strict';
// Cached decorative fauna, active wall organisms and reusable route terrain.
// World-space state advances only from updateWorldEncounters(), so pause freezes every tell and collision shape.

const FAUNA_DECOR_H=720;
const FAUNA_DECOR=Array.from({length:WORLDS.length},(_,stage)=>{
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
});

function drawFaunaBackground(){
  if(worldStage<1)return;
  const tile=FAUNA_DECOR[worldStage],y=Math.floor(worldScroll%tile.height);
  ctx.save();ctx.drawImage(tile,X(PX),y-tile.height);ctx.drawImage(tile,X(PX),y);ctx.restore();
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
const MAX_SHIP_HALF_WIDTH=58;
let routeSegment=null,routeLevel=0,routeTimer=240,routeSpawnedLevel=0;

function resetWorldEncounters(){
  wallFauna=[];faunaTimer=180;faunaSide=0;faunaCount=0;
  routeSegment=null;routeLevel=0;routeTimer=240;routeSpawnedLevel=0;
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
  if(routeSegment){routeSegment.y+=1.1/K;resolvePlayerTerrain();keepRouteEntitiesReachable();if(routeSegment.y>LH+30)routeSegment=null;}
}
function updateWorldEncounters(){updateWallFauna();updateRouteSegment();}

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
  const segment=routeSegment,primitives=routePrimitives(segment),p=primitives[1],front=Math.max(...primitives.map(r=>r.y+r.h));
  ctx.save();
  // The lower chevrons arrive first and identify both safe lanes before the blocking edge reaches the player.
  const tellY=front+42,fade=Math.max(0,Math.min(1,(tellY+30)/70,(LH+35-tellY)/70));ctx.globalAlpha=fade;
  ctx.strokeStyle='#dfbd7e';ctx.lineWidth=X(2);
  for(const side of [-1,1]){const cx=segment.x+side*105;ctx.beginPath();ctx.moveTo(X(cx-side*20),X(tellY-12));ctx.lineTo(X(cx),X(tellY));ctx.lineTo(X(cx-side*20),X(tellY+12));ctx.stroke();}
  if(fade>0.15)txt('SPLIT',segment.x,tellY-4,'#d8b986',9,'center');ctx.globalAlpha=1;
  // These three stepped rectangles are both the visible solid boundary and the collision primitives.
  ctx.fillStyle='#241724';for(const r of primitives)ctx.fillRect(X(r.x),X(r.y),X(r.w),X(r.h));
  ctx.strokeStyle='#b9a1ae';ctx.lineWidth=X(3);for(const r of primitives)ctx.strokeRect(X(r.x),X(r.y),X(r.w),X(r.h));
  ctx.strokeStyle='#513b50';ctx.lineWidth=X(9);for(let y=p.y+15;y<p.y+p.h;y+=25){ctx.beginPath();ctx.moveTo(X(p.x+6),X(y));ctx.quadraticCurveTo(X(segment.x),X(y+12),X(p.x+p.w-6),X(y));ctx.stroke();}
  ctx.strokeStyle='#c2a5ae';ctx.lineWidth=X(1);for(let y=p.y+10;y<p.y+p.h;y+=25){ctx.beginPath();ctx.moveTo(X(p.x+5),X(y));ctx.lineTo(X(p.x+p.w-5),X(y));ctx.stroke();}
  ctx.fillStyle='#754456';for(let y=p.y+22;y<p.y+p.h;y+=48){ctx.beginPath();ctx.ellipse(X(segment.x+((y/16)%3-1)*11),X(y),X(8),X(12),0,0,Math.PI*2);ctx.fill();}
  ctx.fillStyle='#593447';for(const r of [primitives[0],primitives[2]]){ctx.beginPath();ctx.ellipse(X(segment.x),X(r.y+r.h/2),X(20),X(12),0,0,Math.PI*2);ctx.fill();}
  ctx.restore();
}

function drawFaunaProjectile(s){
  const a=Math.atan2(s.vy,s.vx);ctx.save();ctx.translate(X(s.x),X(s.y));ctx.rotate(a);
  ctx.strokeStyle='rgba(176,104,132,0.5)';ctx.lineWidth=X(3);ctx.beginPath();ctx.moveTo(X(-13),0);ctx.lineTo(X(-4),0);ctx.stroke();
  ctx.fillStyle='#5d3048';ctx.strokeStyle='#f0aa79';ctx.lineWidth=X(1.5);ctx.beginPath();ctx.ellipse(0,0,X(6),X(5),0,0,Math.PI*2);ctx.fill();ctx.stroke();
  ctx.fillStyle='#ffd2a2';ctx.beginPath();ctx.ellipse(X(2),X(-1),X(2),X(1.5),0,0,Math.PI*2);ctx.fill();ctx.restore();
}
