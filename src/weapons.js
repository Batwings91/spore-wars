'use strict';
// Player weapons, shared equipment definitions, mount data and support ordnance.
// Shop, preview, ship assembly and combat all resolve through these records.
const SHIP_MOUNTS=Object.freeze({
  engine:[[-11,28],[11,28]],defence:[[-9,-3],[9,-3]],
  ordnance:[[-40,-8],[40,-8]],sideWeapon:[[-46,-10],[46,-10]],support:[[0,34]]
});
const GUN=[
  {n:'PULSE',dmg:1,rate:12,shots:[[0,-32,0,-8]]},
  {n:'TWIN',dmg:1,rate:11,shots:[[-14,-20,0,-8],[14,-20,0,-8]]},
  {n:'TRIPLE',dmg:2,rate:10,shots:[[0,-34,0,-9],[-16,-20,0,-8.5],[16,-20,0,-8.5]]},
  {n:'SPREAD',dmg:2,rate:16,shots:[[0,-34,0,-9],[-14,-22,-0.55,-8.4],[14,-22,0.55,-8.4],[-22,-14,-1,-7.6],[22,-14,1,-7.6]]},
  {n:'STORM',dmg:2,rate:18,shots:[[-6,-34,0,-10],[6,-34,0,-10],[-18,-22,-0.5,-9],[18,-22,0.5,-9],[-26,-12,-1.05,-8],[26,-12,1.05,-8]]},
  {n:'SIEGE',dmg:3,rate:20,shots:[[-6,-34,0,-10],[6,-34,0,-10],[-28,-24,-0.2,-9],[28,-24,0.2,-9],[-34,-18,-0.4,-8.5],[34,-18,0.4,-8.5]]}
];
const MAXW=GUN.length-1,GUN_PORTS=GUN.map(g=>g.shots.map(s=>s.slice(0,2)));
const EQUIPMENT=Object.freeze({
  primary:{id:'primary',saveKey:'weapon',loadoutKey:'weapon',label:'PRIMARY',name:'Starting gun',maxOwned:2,costs:[80,200],tiers:GUN,
    effect:t=>'Future runs start with '+GUN[t].n,note:'Run pickups can still advance it.',
    draw:(tier,x,y,v)=>{if(tier===5)drawSiegeHousings(x,y,v.frame,v.flash);drawGunMounts(tier,x,y,v.flash);}},
  defence:{id:'defence',saveKey:'shield',loadoutKey:'shield',label:'SHIELD',name:'Shield emitters',maxOwned:2,costs:[60,150],tiers:[{capacity:0},{capacity:1},{capacity:2}],
    effect:t=>t+' shield '+(t===1?'charge':'charges')+' at launch',note:'Absorbs hits before hull damage.',
    draw:(tier,x,y,v)=>drawShieldLayers(tier,x,y,v.frame,v.flash)},
  engine:{id:'engine',saveKey:'engine',loadoutKey:'engine',label:'ENGINE',name:'Engine tune',maxOwned:3,costs:[20,120,190],tiers:[{bonus:0},{bonus:0.5},{bonus:1},{bonus:1.5}],
    effect:t=>'Flight speed +'+Math.round(EQUIPMENT.engine.tiers[t].bonus/3.7*100)+'%',note:'Installs immediately and persists.',
    draw:(tier,x,y,v)=>drawEngines(tier,x,y,v.frame)},
  ordnance:{id:'ordnance',saveKey:'rockets',loadoutKey:'rockets',label:'ROCKET PODS',name:'Twin rocket pods',maxOwned:1,costs:[90],tiers:[null,{reload:180,limit:2,damage:1,life:180,turn:0.055,maxSpeed:4.2,accel:0.06}],
    effect:t=>t?'Twin homing pods / 3.0 sec reload':'No ordnance fitted',note:'Primary gun tier does not control pods.',
    draw:(tier,x,y,v)=>{if(tier)drawRocketPods(x,y,v.open,v.flash,v.side);}},
  support:{id:'support',saveKey:'orb',loadoutKey:'orb',label:'SEEKER ORB',name:'Seeker orb',maxOwned:1,costs:[120],tiers:[null,{reload:180,limit:2,damage:1}],
    effect:t=>t?'Trailing homing missile support':'No support fitted',note:'Equips now and on future runs.',
    draw:(tier,x,y,v)=>{if(tier)drawSeekerOrb(x+SHIP_MOUNTS.support[0][0],y+SHIP_MOUNTS.support[0][1],v.frame,0);}},
  sideWeapon:{id:'sideWeapon',saveKey:null,loadoutKey:'sideLaser',label:'SIDE LASER',name:'Heavy side laser',maxOwned:0,costs:[],tiers:[null],locked:true,
    effect:()=> 'Side hardpoints reserved for Phase 2',note:'Beam system is not for sale or equip yet.',draw:()=>{}}
});
const SHOP_COLUMNS=4,SHOP=Object.freeze(['primary','defence','engine','ordnance','support','sideWeapon'].map(id=>EQUIPMENT[id]));
function equipmentFor(key){return EQUIPMENT[key]||SHOP.find(it=>it.saveKey===key||it.loadoutKey===key);}
function equipmentOwned(it,source=save){return it.saveKey?Math.max(0,Math.min(it.maxOwned,Number(source[it.saveKey])||0)):0;}
function equipmentCost(it,level=equipmentOwned(it)){return it.locked||level>=it.maxOwned?null:it.costs[level];}
function savedLoadout(source=save){return{weapon:Number(source.weapon)||0,shield:Number(source.shield)||0,engine:Number(source.engine)||0,rockets:source.rockets===1?1:0,orb:source.orb===1?1:0,sideLaser:0};}
function candidateLoadout(base,kind,tier){const it=equipmentFor(kind),loadout=Object.assign({},base);if(it&&!it.locked)loadout[it.loadoutKey]=tier;return loadout;}
function previewLoadout(kind,tier,source=save){return candidateLoadout(savedLoadout(source),kind,tier);}
function drawEquipmentModule(id,tier,x,y,visual={}){const it=EQUIPMENT[id];if(!it)return;it.draw(tier,x,y,{frame:visual.frame||0,flash:visual.flash||0,open:visual.open||0,side:visual.side===undefined?-1:visual.side});}
// Player-only, cached white/cyan bolts: needle, rails, spear, chevron, split lance.
// Generated once at render resolution; no per-shot gradients or shared enemy sprites.
const BOLT=Array.from({length:6},(_,level)=>{
  const o=document.createElement('canvas');o.width=24;o.height=52;
  const g=o.getContext('2d');
  const shapes=[
    [[12,1],[15,12],[14,28],[10,28],[9,12]],
    [[8,2],[11,10],[10,28],[6,28],[5,10]],
    [[12,0],[19,15],[14,12],[15,31],[9,31],[10,12],[5,15]],
    [[12,1],[22,18],[16,15],[14,30],[10,30],[8,15],[2,18]],
    [[7,0],[11,12],[10,32],[4,32],[3,12]],
    [[12,0],[20,12],[17,29],[7,29],[4,12]]
  ];
  const tail=g.createLinearGradient(0,18,0,52);tail.addColorStop(0,'rgba(52,213,246,0.65)');tail.addColorStop(1,'rgba(52,213,246,0)');
  g.fillStyle=tail;g.fillRect(level===4?4:9,18,level===4?16:6,34);
  const paint=(points,offset=0)=>{
    g.beginPath();points.forEach(([x,y],i)=>{if(i)g.lineTo(x+offset,y);else g.moveTo(x+offset,y);});g.closePath();
    g.fillStyle='#34bbdb';g.fill();g.strokeStyle='#102d43';g.lineWidth=1;g.stroke();
  };
  paint(shapes[level]);if(level===1)paint(shapes[level],8);if(level===4)paint(shapes[level],10);
  g.fillStyle='#eaffff';
  if(level===1){g.fillRect(7,8,2,17);g.fillRect(15,8,2,17);}
  else if(level===4){g.fillRect(6,7,2,23);g.fillRect(16,7,2,23);g.fillRect(9,16,6,2);}
  else{g.fillRect(11,7,2,level>=2?21:17);}
  return o;
});
// Visual mount locations are derived from the firing profiles above.
function drawGunMounts(gun=wpn,sx=ship.x,sy=ship.y,flash=muzz){
  ctx.save();
  for(const [ox,oy] of GUN_PORTS[gun]){
    const x=X(sx+ox),y=X(sy+oy),w=[5,5,6,7,8,9][gun],length=[24,26,32,29,36,42][gun];
    // Solid shaded receivers and one barrel per shot origin.
    ctx.fillStyle='#0c141a';ctx.beginPath();ctx.moveTo(x-w+2,y+9);ctx.lineTo(x+w-2,y+9);ctx.lineTo(x+w,y+16);ctx.lineTo(x+w,y+length);ctx.lineTo(x-w,y+length);ctx.lineTo(x-w,y+16);ctx.closePath();ctx.fill();
    ctx.fillStyle='#53616a';ctx.fillRect(x-w+2,y+15,w*2-4,length-17);
    ctx.fillStyle='#95a4aa';ctx.fillRect(x-w+2,y+15,2,length-18);
    ctx.fillStyle='#283239';ctx.fillRect(x+1,y+15,w-2,length-17);
    ctx.fillStyle='#b49b64';ctx.fillRect(x-w+1,y+length-5,w*2-2,3);
    ctx.fillStyle='#080f15';ctx.fillRect(x-3,y,6,19);
    ctx.fillStyle='#9aafb6';ctx.fillRect(x-2,y+2,2,15);ctx.fillStyle='#3a4b54';ctx.fillRect(x,y+2,2,15);
    ctx.fillStyle='#b7f7ff';ctx.fillRect(x-1,y,2,3);
    if(gun>=2)for(let i=0;i<(gun===4?4:3);i++){ctx.fillStyle='#253038';ctx.fillRect(x-w-1,y+16+i*4,w*2+2,2);ctx.fillStyle='#7d898e';ctx.fillRect(x-w,y+16+i*4,3,1);}
    if(flash>0){ctx.globalAlpha=flash/6;ctx.fillStyle='#36bada';ctx.beginPath();ctx.moveTo(x,y-15);ctx.lineTo(x+w,y-2);ctx.lineTo(x,y+3);ctx.lineTo(x-w,y-2);ctx.closePath();ctx.fill();ctx.fillStyle='#efffff';ctx.fillRect(x-1,y-10,2,11);ctx.globalAlpha=1;}
  }
  ctx.restore();
}

// Small original player-only missile; cached at startup like the main bolts.
const ROCKET=(()=>{const c=document.createElement('canvas');c.width=20;c.height=40;const g=c.getContext('2d');
  g.fillStyle='#173348';g.beginPath();g.moveTo(10,1);g.lineTo(15,10);g.lineTo(15,23);g.lineTo(19,30);g.lineTo(1,30);g.lineTo(5,23);g.lineTo(5,10);g.closePath();g.fill();
  g.fillStyle='#819aa7';g.fillRect(6,11,8,17);g.fillStyle='#eaffff';g.fillRect(7,9,3,18);
  g.fillStyle='#54e5ff';g.fillRect(6,14,8,3);g.fillRect(8,29,4,9);return c;})();
let podOpen=0,rocketT=240,rocketSide=-1,rocketFlash=0;
function resetRockets(){resetOrb();podOpen=0;rocketT=240;rocketSide=-1;rocketFlash=0;if(shots)shots=shots.filter(s=>!s.rocket);}
function rocketTarget(x,y){
  const candidates=enemies.concat(ground).filter(e=>e.hp>0&&e.y>0&&e.y<y&&e.x>PX&&e.x<PX+PW);
  if(!candidates.length)return boss&&!bossDying&&boss.hp>0&&boss.y>=boss.ty&&boss.y<y?boss:null;
  let best=null,rank=Infinity;
  for(const e of candidates){const reserved=shots.some(s=>s.rocket&&s.y>0&&s.target===e);const r=Math.hypot(e.x-x,e.y-y)+(reserved?1000:0);if(r<rank){best=e;rank=r;}}
  return best;
}
function updateRockets(){
  const tier=save.rockets===1?1:0,profile=EQUIPMENT.ordnance.tiers[tier];
  if(rocketFlash>0)rocketFlash--;
  podOpen=Math.max(0,Math.min(24,podOpen+(profile?1:-1)));
  if(!profile)rocketT=240;
  else rocketT=Math.min(rocketT,profile.reload);
  if(profile&&podOpen===24&&--rocketT<=0&&shots.filter(s=>s.rocket&&!s.orb&&s.y>0).length<profile.limit){
    const mount=SHIP_MOUNTS.ordnance[rocketSide<0?0:1],x=ship.x+mount[0],y=ship.y+mount[1],target=rocketTarget(x,ship.y);
    if(target){shots.push({x,y,vx:rocketSide*0.7,vy:-2.4,g:wpn,dmg:profile.damage,rocket:true,target,life:profile.life,retargeted:false});rocketSide*=-1;rocketT=profile.reload;rocketFlash=12;}
  }
  updateOrb();
  for(const s of shots){if(!s.rocket||s.y<-50)continue;
    if(--s.life<=0){s.y=-99;continue;}
    if(!s.target||s.target.hp<=0||!(enemies.includes(s.target)||ground.includes(s.target)||(s.target===boss&&!bossDying))||s.target.y<0||s.target.y>LH){
      s.target=s.retargeted?null:rocketTarget(s.x,s.y);s.retargeted=true;
    }
    let angle=Math.atan2(s.vy,s.vx);
    const steer=s.orb?EQUIPMENT.ordnance.tiers[1]:profile||EQUIPMENT.ordnance.tiers[1];
    if(s.target){const desired=Math.atan2(s.target.y-s.y,s.target.x-s.x);const delta=Math.atan2(Math.sin(desired-angle),Math.cos(desired-angle));angle+=Math.max(-steer.turn,Math.min(steer.turn,delta));}
    const speed=Math.min(steer.maxSpeed,Math.hypot(s.vx,s.vy)+steer.accel);s.vx=Math.cos(angle)*speed;s.vy=Math.sin(angle)*speed;
  }
}
function drawRocketPods(sx=ship.x,sy=ship.y,openTicks=podOpen,flash=rocketFlash,nextSide=rocketSide){if(openTicks<=0)return;ctx.save();
  for(const [i,side] of [-1,1].entries()){const open=openTicks/24,ease=open*open*(3-2*open),firing=flash>0&&side===-nextSide,mount=SHIP_MOUNTS.ordnance[i];
    const x=sx+side*(25+(Math.abs(mount[0])-25)*ease),y=sy+mount[1]+(firing?flash*0.3:0);
    ctx.fillStyle='#6a8392';ctx.fillRect(X(Math.min(sx+side*24,x)),X(y+4),X(Math.abs(x-sx-side*24)),X(4));
    ctx.fillStyle='#142331';ctx.fillRect(X(x-6),X(y-8),X(12),X(23));ctx.fillStyle='#9a885f';ctx.fillRect(X(x-5),X(y+12),X(10),X(2));
    ctx.fillStyle='#617b8b';ctx.fillRect(X(x-4),X(y+2),X(8),X(11));ctx.fillStyle='#080e18';ctx.fillRect(X(x-3),X(y-7),X(6),X(7));
    ctx.fillStyle=openTicks<24?'#dca761':'#83efff';ctx.fillRect(X(x+side*3-1),X(y+6),X(2),X(5));
    // Visible magazines use the player missile's silver body and cyan band.
    if(openTicks>=12)for(const offset of [-2,2]){ctx.fillStyle='#c6d5d9';ctx.fillRect(X(x+offset)-1,X(y-4),2,X(9));ctx.fillStyle='#6be7f6';ctx.fillRect(X(x+offset)-1,X(y),2,2);}
    ctx.fillStyle='#83efff';ctx.fillRect(X(x-2),X(y-6),X(4),X(2));
    if(firing){ctx.globalAlpha=flash/12;ctx.fillStyle='#eaffff';ctx.beginPath();ctx.moveTo(X(x-4),X(y-8));ctx.lineTo(X(x),X(y-22));ctx.lineTo(X(x+4),X(y-8));ctx.fill();ctx.fillStyle='#5bdaeb';ctx.beginPath();ctx.moveTo(X(x-3),X(y+14));ctx.lineTo(X(x),X(y+25));ctx.lineTo(X(x+3),X(y+14));ctx.fill();ctx.globalAlpha=1;}
  }ctx.restore();
}

// Independent, run-owned support orb; saved ownership equips it on new runs.
let orbActive=false,orbX=0,orbY=0,orbT=180,orbFlash=0,orbReady=false;
function resetOrb(){orbT=180;orbFlash=0;orbReady=false;}
function updateOrb(){
  if(!orbActive)return;
  const profile=EQUIPMENT.support.tiers[1];
  const tx=ship.x,ty=Math.min(LH-12,ship.y+34);
  if(!orbReady){orbX=tx;orbY=ty;orbReady=true;}else{orbX+=(tx-orbX)*0.12;orbY+=(ty-orbY)*0.12;}
  if(orbFlash>0)orbFlash--;
  if(orbT>0)orbT--;
  if(orbT===0&&shots.filter(s=>s.orb&&s.y>0).length<profile.limit){const target=rocketTarget(orbX,ship.y);
    if(target){shots.push({x:orbX,y:orbY-7,vx:0,vy:-2.4,g:wpn,dmg:profile.damage,rocket:true,orb:true,target,life:180,retargeted:false});orbT=profile.reload;orbFlash=12;}}
}
function drawSeekerOrb(x,y,frame=t,flash=0){
  ctx.save();ctx.translate(X(x),X(y));const pulse=1+Math.sin(frame*0.07)*0.04;ctx.scale(pulse,pulse);
  ctx.fillStyle='#121d27';ctx.beginPath();ctx.arc(0,0,13,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#a58f61';ctx.beginPath();ctx.arc(0,0,11,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#42545f';ctx.beginPath();ctx.arc(0,0,9,0,Math.PI*2);ctx.fill();
  ctx.fillStyle=flash?'#f0ffff':'#61e1ed';ctx.beginPath();ctx.arc(-1,-1,6,0,Math.PI*2);ctx.fill();ctx.fillStyle='#d5ffff';ctx.beginPath();ctx.arc(-3,-3,2,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#18252e';for(const side of [-1,1])ctx.fillRect(side*8-2,-3,4,6);
  if(flash){ctx.globalAlpha=flash/12;ctx.fillStyle='#cbffff';ctx.fillRect(-2,-24,4,12);}ctx.restore();
}
function drawSiegeHousings(x,y,frame=t,flash=0){
  ctx.save();
  for(const side of [-1,1]){const cx=X(x+side*29),cy=X(y-4);
    ctx.fillStyle='#1c2a33';ctx.fillRect(X(x+Math.min(side*10,side*29)),cy+9,X(19),13);
    ctx.fillStyle='#101920';ctx.beginPath();ctx.moveTo(cx-13,cy-35);ctx.lineTo(cx+10,cy-35);ctx.lineTo(cx+18,cy-20);ctx.lineTo(cx+18,cy+32);ctx.lineTo(cx+7,cy+39);ctx.lineTo(cx-16,cy+26);ctx.lineTo(cx-16,cy-22);ctx.closePath();ctx.fill();
    ctx.fillStyle='#57656c';ctx.fillRect(cx-11,cy-22,23,48);ctx.fillStyle='#a4afb1';ctx.fillRect(cx-11,cy-22,3,43);ctx.fillStyle='#2b3941';ctx.fillRect(cx+3,cy-22,9,48);
    ctx.fillStyle='#b29960';ctx.fillRect(cx-11,cy+23,23,5);ctx.fillRect(cx-9,cy-28,19,4);
    for(let i=0;i<4;i++){ctx.fillStyle='#16242d';ctx.fillRect(cx-10,cy+i*6,20,3);}
    ctx.fillStyle=flash?'#efffff':'#43cddc';ctx.fillRect(cx-5,cy-18,9,10);
  }ctx.restore();
}
