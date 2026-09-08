'use strict';
// Gameplay update(): collisions, drops, pickups, bombs; enemy/ship drawing and drawField().
function boom(x,y,big){SFX.boom(big);booms.push({x,y,f:0,sc:big?1.6:1,life:24,kind:big?'exp_big':'exp_small'});for(let i=0;i<(big?10:4);i++)booms.push({x,y,vx:(Math.random()-0.5)*(big?6:4),vy:(Math.random()-0.5)*(big?6:4),life:12+Math.random()*12});}
function hitShip(){if(ship.inv>0||GOD)return;if(shield>0){shield--;ship.inv=40;shieldHit=12;SFX.shieldHit();addFloat(Math.max(PX+90,Math.min(PX+PW-90,ship.x)),ship.y-44,shield?'SHIELD 1 LEFT':'SHIELD DOWN',C.cyan,true);return;}
  ship.hull--;
  if(ship.hull>0){ship.inv=40;shake=6;flash=3;SFX.hit();addFloat(Math.max(PX+90,Math.min(PX+PW-90,ship.x)),ship.y-44,ship.hull===1?'HULL CRITICAL 33%':'HULL DAMAGED 67%',C.red,true);return;}
  resetRockets();resetSideLasers();resetWorldEncounters();chain=0;chainT=0;lives--;ship.hull=ship.hullDisplay=lives>0?MAX_HULL:0;boom(ship.x,ship.y,true);SFX.die();shake=14;flash=8;ship.inv=90;wpn=Math.max(0,wpn-1);addFloat(ship.x,ship.y-40,'SHIP LOST',C.red);
  if(lives<=0){save.cores+=cores-bankedCores;bankedCores=cores;if(score>save.best)save.best=score;persist();mode='dead';deadSel=0;t=0;SFX.bossTheme(false);}}
function dropFor(e){kills++;
  const weaponGap=level<=5?9:15;
  if(wpn<MAXW&&(kills===1||kills-lastW>=weaponGap)){lastW=kills;return 'w';}
  const early=level<=4;const r=Math.random();
  if(r<0.30)return 'core';
  if(r<0.32)return 'b';
  if(r<(early?0.38:0.34))return 's';
  if(ship.hull<MAX_HULL&&r<(early?0.42:0.38))return 'h';
  if(r>=0.42&&r<0.57)return 'core';
  if(!orbActive&&level>=6&&r>=0.57&&r<0.60)return 'o';
  return null;}
function addHitImpact(x,y,bio){booms.push({x,y,life:8,kind:'impact',bio});}
function addFloat(x,y,txt,col,big){floats.push({x,y,txt,col,life:60,big});}
function pickupEvent(text,col){evt=50;evtText=text;evtCol=col;flash=6;slow=10;rings.push({x:ship.x,y:ship.y,r:10,col,life:30});
  for(let i=0;i<14;i++)booms.push({x:ship.x,y:ship.y,vx:Math.cos(i/14*6.283)*4,vy:Math.sin(i/14*6.283)*4,life:18,col});}
function fireBomb(){if(paused||bombs<=0||bombFx>0)return;bombs--;bombFx=40;shake=18;flash=10;slow=14;SFX.bomb();
  rings.push({x:ship.x,y:ship.y,r:20,col:C.white,life:40,big:true});booms.push({x:ship.x,y:ship.y,f:0,life:24,kind:'exp_ring',sc:1});
  for(const e of enemies){if(e.y>-10){e.hp-=6;if(e.hp<=0){awardKill(ENEMY_POINTS[e.k]||10,e.x,e.y);boom(e.x,e.y,true);}}}
  for(const e of ground)if(e.y>-10&&e.hp>0){e.hp-=6;if(e.hp<=0)destroyGround(e);}
  bombLattice(6);
  ground=ground.filter(e=>e.hp>0);
  enemies=enemies.filter(e=>e.hp>0);eshots=[];bombBoss();addFloat(ship.x,ship.y-60,'MEGABOMB',C.G,true);}
function update(){t++;scroll=(scroll+1.8)%TH;
  if(chainT>0&&--chainT===0)chain=0;
  let dx=0,dy=0;if(keys.l)dx-=1;if(keys.r)dx+=1;if(keys.u)dy-=1;if(keys.d)dy+=1;
  if(ptr.down){dx+=(ptr.x-ptr.lx)*4.6/spd();dy+=(ptr.y-ptr.ly)*4.6/spd();ptr.lx=ptr.x;ptr.ly=ptr.y;}
  if(dx&&dy&&!ptr.down){dx*=0.707;dy*=0.707;}
  const shipEdge=sideLaserOwned()?58:30;ship.x=Math.max(PX+shipEdge,Math.min(PX+PW-shipEdge,ship.x+dx*spd()));ship.y=Math.max(34,Math.min(LH-34,ship.y+dy*spd()));
  if(ship.inv>0)ship.inv--;
  fireT--;if(fireT<=0){const G=GUN[wpn];fireT=G.rate;muzz=6;SFX.shot(Math.min(2,wpn));
    for(const [ox,oy,vx,vy] of G.shots)shots.push({x:ship.x+ox,y:ship.y+oy,vx,vy,g:wpn,dmg:G.dmg});}
  updateRockets();
  for(const s of shots){s.x+=s.vx;s.y+=s.vy;}shots=shots.filter(s=>s.y>-12&&s.y<LH+20&&s.x>PX&&s.x<PX+PW);
  waveT--;
  if(boss||bossWarn>0||bossDying>0){ if(boss&&!boss.mother&&!bossDying&&t%240===0&&enemies.length<3){for(let i=0;i<2;i++)enemies.push({k:0,x:PX+60+Math.random()*(PW-120),y:-30-i*40,ph:i,hp:1,t:0});} }
  else if(!sectorPending&&AUTHORED_WAVES[level-1]&&formationGroup<AUTHORED_WAVES[level-1].length){if(waveT<=0&&enemies.length<=2)spawnFormationGroup();}
  else if(!sectorPending&&enemies.length===0&&waveT<=0){if((level+1)%5===0){startBossWarning();}else{spawnWave();}}
  else if(!sectorPending&&!AUTHORED_WAVES[level-1]&&waveT<=0&&enemies.length<4&&(level+1)%5!==0){spawnWave();}
  updateBoss();updateWorld();updateGround();updateWorldEncounters();
  for(const e of enemies){e.t++;
    if(e.k===0){e.y+=1.1+level*0.04;e.x+=Math.sin(e.t*0.05+e.ph)*1.8;}
    if(e.k===1){e.y+=2.8+level*0.06;}
    if(e.k===9){
      if(e.state===2){e.x+=e.vx;e.y+=e.vy;if(--e.ct<=0){e.state=0;e.ct=150;}}
      else if(e.state===1){e.y+=0.28;if(--e.ct<=0){e.state=2;e.ct=34;e.vx=Math.max(-3.2,Math.min(3.2,(e.aimX-e.x)/26));e.vy=3.7;}}
      else{e.y+=0.62;e.x+=Math.sin(e.t*0.025+e.ph)*0.28;if(e.y>24&&--e.ct<=45){e.state=1;e.ct=45;e.aimX=ship.x;}}
    }
    else if(e.k===10){
      if(e.state===2){e.x+=e.vx;e.y+=e.vy;if(--e.ct<=0){e.state=0;e.ct=140;}}
      else if(e.state===1){e.y+=0.2;if(--e.ct<=0){const dx=e.aimX-e.x,dy=e.aimY-e.y,len=Math.hypot(dx,dy)||1;e.state=2;e.ct=24;e.vx=dx/len*4.1;e.vy=dy/len*4.1;}}
      else{e.y+=0.78;e.x=Math.max(PX+28,Math.min(PX+PW-28,e.x+Math.sin(e.t*0.055+e.ph)*1.25));if(e.y>20&&--e.ct<=36){e.state=1;e.ct=36;e.aimX=ship.x;e.aimY=ship.y;}}
      if(e.state===2)for(const tip of hunterTipPoints(e))if(Math.hypot(tip.x-ship.x,tip.y-ship.y)<12)hitShip();
    }
    else if(e.k>=6){
      if(e.k===7){e.y+=2.6;e.x=Math.max(PX+20,Math.min(PX+PW-20,e.x+Math.sin(e.t*0.08+e.ph)*2));}
      else{e.y+=e.k===8?0.65:0.9;e.x+=Math.sin(e.t*0.035+e.ph)*0.45;}
      if(e.y>20&&e.y<LH-100&&--e.ct<=0){const a=Math.atan2(ship.y-e.y,ship.x-e.x),fan=e.k===8?[-0.45,0,0.45]:e.k===6?[-0.18,0.18]:[0];for(const d of fan)eshots.push({x:e.x,y:e.y+12,vx:Math.cos(a+d)*1.8,vy:Math.sin(a+d)*1.8,ground:true,bio:true});e.ct=e.k===8?210:e.k===6?180:999;SFX.plasma();}
    }
    if(e.k===5){e.y+=1.28+Math.sin(e.t*0.09+e.ph)*0.22;e.x=Math.max(PX+30,Math.min(PX+PW-30,e.x+Math.sin(e.t*0.045+e.ph)*2.15));
      if(e.y>24&&e.y<LH-105){if(e.ct===36)e.aim=Math.atan2(ship.y-e.y,ship.x-e.x);if(--e.ct<=0){for(const d of [-0.24,0,0.24])eshots.push({x:e.x,y:e.y+13,vx:Math.cos(e.aim+d)*1.65,vy:Math.sin(e.aim+d)*1.65,ground:true,bio:true,family:'ray'});e.ct=168+(Math.floor(e.ph*10)&15);SFX.plasma();}}}
    if(e.k===3){if(e.y<e.ty)e.y+=0.8;else e.x+=Math.sin(e.t*0.02)*1.2;e.ct--;
      if(e.ct<=0&&e.y>0){e.ct=110;for(let j=-1;j<=1;j++){const a=Math.atan2(ship.y-e.y,ship.x-e.x)+j*0.35;eshots.push({x:e.x,y:e.y+20,vx:Math.cos(a)*2.2,vy:Math.sin(a)*2.2,blue:true});}SFX.plasma();}
      for(const tn of e.tent){const tipx=e.x+Math.sin(e.t*0.05+tn.ph)*tn.len*1.2,tipy=e.y+18+tn.len*1.6;if(ship.inv<=0&&!GOD&&Math.abs(tipx-ship.x)<14&&Math.abs(tipy-ship.y)<16){boom(tipx,tipy,false);hitShip();}}}
    if(e.k===4){e.y+=0.9;if(e.lunge>0){e.lunge--;e.x+=e.dir*5;}else{e.x+=e.dir*0.6;if(Math.abs(e.y-ship.y)<30&&Math.random()<0.03){e.lunge=22;e.dir=ship.x>e.x?1:-1;}}
      if(e.x<PX+16){e.x=PX+16;e.dir=1;}if(e.x>PX+PW-16){e.x=PX+PW-16;e.dir=-1;}}
    if(e.k===2){e.y+=0.6;e.ct--;if(e.ct<=0&&e.y>0){e.ct=90;const a=Math.atan2(ship.y-e.y,ship.x-e.x);eshots.push({x:e.x,y:e.y+8,vx:Math.cos(a)*2.4,vy:Math.sin(a)*2.4});SFX.plasma();}}
    if(Math.abs(e.x-ship.x)<R[e.k]+6&&Math.abs(e.y-ship.y)<R[e.k]+10){e.hp=0;boom(e.x,e.y,false);hitShip();}}
  updateSideLasers();
  // One hit per shot per tick; spent shots (y=-99) must not test enemies still queued above the screen.
  for(const s of shots){if(s.y<-50)continue;for(const e of enemies){if(e.hp>0&&Math.abs(s.x-e.x)<R[e.k]&&Math.abs(s.y-e.y)<R[e.k]){e.hp-=(s.dmg||1);e.flash=4;if(e.hp>0){SFX.hit();addHitImpact(s.x,s.y,e.k>=3);}s.y=-99;
      if(e.hp<=0){awardKill(ENEMY_POINTS[e.k]||10,e.x,e.y);boom(e.x,e.y,e.k>=2);const k=dropFor(e);if(k)drops.push({x:e.x,y:e.y,k});}break;}}}
  for(const s of shots){if(s.y<-50)continue;for(const e of ground)if(e.hp>0&&e.y>0&&Math.abs(s.x-e.x)<21&&Math.abs(s.y-e.y)<21){e.hp-=s.dmg||1;if(e.hp>0)addHitImpact(s.x,s.y,e.stage>0);s.y=-99;e.flash=5;if(e.hp<=0)destroyGround(e);else SFX.hit();break;}}
  damageLatticeWithShots();
  ground=ground.filter(e=>e.hp>0);
  enemies=enemies.filter(e=>e.hp>0&&e.y<LH+30);if(enemies.some(e=>e.k===3)&&enemies.length>12)enemies=enemies.filter(e=>e.k!==0||e.y>-100);
  for(const s of eshots){s.x+=s.vx;s.y+=s.vy;const radius=s.radius||0;if(Math.abs(s.x-ship.x)<16+radius&&Math.abs(s.y-ship.y)<20+radius){s.y=999;hitShip();}}
  eshots=eshots.filter(s=>s.y<LH+10&&s.y>-10&&s.x>PX&&s.x<PX+PW);
  for(const d of drops){if(sectorPending){const dx=ship.x-d.x,dy=ship.y-d.y,len=Math.hypot(dx,dy)||1;d.x+=dx/len*7;d.y+=dy/len*7;}else d.y+=1.4;if(Math.hypot(d.x-ship.x,d.y-ship.y)<34||(sectorPending&&waveT<=0)){d.y=999;
      if(d.k==='core'){cores++;score+=5;SFX.core();addFloat(d.x,d.y,'+1 CORE',C.cyan);}
      if(d.k==='w'){if(wpn<MAXW){wpn++;pickupEvent('GUN '+(wpn+1)+'/'+GUN.length+' / '+GUN[wpn].n,C.cyan);}else{score+=100;pickupEvent('GUN MAX / +100 SCORE',C.cyan);}SFX.power();}
      if(d.k==='o'){if(orbActive){score+=100;pickupEvent('ORB ONLINE / +100 SCORE',C.cyan);}else{orbActive=true;resetOrb();pickupEvent('SEEKER ORB ONLINE',C.cyan);}SFX.power();}
      if(d.k==='h'&&lives>0){const full=ship.hull>=MAX_HULL;ship.hull=Math.min(MAX_HULL,ship.hull+1);pickupEvent(full?'HULL FULL':'HULL REPAIRED', '#79e69b');SFX.power();}
      if(d.k==='s'){shield=Math.min(2,shield+1);pickupEvent('SHIELD',C.cyan);SFX.shield();}
      if(d.k==='b'){const full=bombs>=6;bombs=Math.min(6,bombs+1);pickupEvent(full?'BOMB FULL':'BOMB +1',C.G);SFX.power();}}}
  keepRouteEntitiesReachable();drops=drops.filter(d=>d.y<LH+12); // once per tick, after enemies, ground and drops have moved
  for(const b of booms){if(b.vx!==undefined){b.x+=b.vx;b.y+=b.vy;}b.life--;}booms=booms.filter(b=>b.life>0);if(hint>0)hint--;if(muzz>0)muzz--;if(shieldHit>0)shieldHit--;
  for(const f of floats){f.y-=0.7;f.life--;}floats=floats.filter(f=>f.life>0);for(const r of rings){r.r+=r.big?9:4;r.life--;}rings=rings.filter(r=>r.life>0);if(evt>0)evt--;if(bombFx>0)bombFx--;
  for(const e of enemies)if(e.flash>0)e.flash--;
  if(sectorPending&&waveT<=0)completeSector();}

// Ground units share the scenery's pixel scroll, and never gate aerial wave progression.
function updateGround(){
  for(const w of groundWrecks){w.y=(worldScroll-w.anchor)/K;w.heat=Math.max(0,w.heat-1);w.age++;}groundWrecks=groundWrecks.filter(w=>w.y<LH+40);
  // Bosses and the sector sweep suppress new sentries and silence the live ones; existing units keep scrolling
  // off with the scenery instead of vanishing mid-screen. The timer is held so the first post-boss spawn waits 240 ticks.
  const suppress=boss||bossWarn||bossDying||sectorPending;if(suppress)groundTimer=Math.max(groundTimer,240);
  if(level<1)return;
  const progress=Math.min(3,(level-1)%5),cap=6+progress;
  if(!suppress&&--groundTimer<=0&&ground.length<cap){const n=groundCount++,variant=n%3===2?2:Math.floor(n/3)%2,edge=variant?72:45,x=variant===2?PX+PW/2:(groundSide?PX+PW-edge:PX+edge);if(variant!==2)groundSide=1-groundSide;
    ground.push({x,y:-28,anchor:worldScroll+56,stage:Math.min(2,worldStage),variant,hp:Math.ceil(4*(1+campaignLoop*0.25)),ct:150,aim:Math.PI/2,flash:0});groundTimer=150-progress*20;}
  for(const e of ground){e.y=(worldScroll-e.anchor)/K;if(e.flash>0)e.flash--;
    if(suppress||e.y<24||e.y>LH-90)continue;
    e.ct--;
    if(e.ct===45)e.aim=Math.atan2(ship.y-e.y,ship.x-e.x);
    if(e.ct<=0){if(Math.hypot(ship.x-e.x,ship.y-e.y)>90){for(const spread of (e.variant===1?[-0.12,0.12]:[0])){const a=e.aim+spread,side=spread?Math.sign(spread)*7:0;eshots.push({x:e.x+Math.cos(e.aim)*18-Math.sin(e.aim)*side,y:e.y+Math.sin(e.aim)*18+Math.cos(e.aim)*side,vx:Math.cos(a)*1.7,vy:Math.sin(a)*1.7,ground:true,bio:e.stage>0});}SFX.plasma();}e.ct=e.variant?300:240;}
  }
  ground=ground.filter(e=>e.y<LH+35&&e.hp>0);
}
function destroyGround(e){if(e.destroyed)return;e.destroyed=true;
  awardKill(40,e.x,e.y);boom(e.x,e.y,true);if(Math.random()<0.5)drops.push({x:e.x,y:e.y,k:'core'}); // 50%: a guaranteed core tripled first-sector income
  groundWrecks.push({x:e.x,y:e.y,anchor:e.anchor,stage:e.stage,variant:e.variant,heat:90,age:0});if(groundWrecks.length>20)groundWrecks.shift();
}
const WRECK_SMOKE=(()=>{const c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d'),h=g.createRadialGradient(32,32,3,32,32,31);h.addColorStop(0,'rgba(156,148,137,0.8)');h.addColorStop(0.5,'rgba(104,102,99,0.5)');h.addColorStop(1,'rgba(80,80,80,0)');g.fillStyle=h;g.fillRect(0,0,64,64);return c;})();
const GROUND_FALLBACK_GRADIENT=[null,null]; // radial gradients are in user space, so one per variant serves every unit
// Snap to the same scrolling pixel as the scenery, with a fixed world anchor.
const groundRenderY=anchor=>Math.floor(worldScroll)-Math.floor(anchor);
function drawGround(){
  for(const w of groundWrecks){ctx.save();ctx.translate(X(w.x),groundRenderY(w.anchor));
    const r=w.variant===2?32:27;ctx.fillStyle='rgba(5,8,12,0.4)';ctx.beginPath();ctx.ellipse(0,X(3),X(r),X(r*0.7),0,0,Math.PI*2);ctx.fill();
    // Torn plates/chitin, a charred crater and a collapsed weapon.
    for(let i=0;i<14;i++){const a=i*2.4+w.variant*0.7,dx=Math.cos(a)*(8+(i*7%23)),dy=Math.sin(a)*(5+(i*11%18));
      ctx.save();ctx.translate(X(dx),X(dy));ctx.rotate(a);const scale=0.7+(i%3)*0.25;ctx.scale(scale,scale);ctx.fillStyle=w.stage?(i%2?'#654651':'#493039'):(i%2?'#62625a':'#444b4c');ctx.strokeStyle='#1c2023';ctx.lineWidth=1;
      ctx.beginPath();ctx.moveTo(X(-7),X(-4));ctx.lineTo(X(5),X(-3));ctx.lineTo(X(2),0);ctx.lineTo(X(7),X(3));ctx.lineTo(X(-4),X(2));ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();}
    ctx.fillStyle='#0c0d10';ctx.beginPath();ctx.ellipse(0,0,X(w.variant===2?15:10),X(8),-0.2,0,Math.PI*2);ctx.fill();
    ctx.save();ctx.rotate(0.8+w.variant*0.4);ctx.fillStyle=w.stage?'#49323e':'#454b49';ctx.fillRect(X(5),X(-3),X(13),X(5));ctx.fillStyle='#111216';ctx.fillRect(X(15),X(-3),X(3),X(4));ctx.restore();
    if(w.heat>0){ctx.globalAlpha=w.heat/90;ctx.fillStyle=w.stage?'#c86786':'#d98b46';for(let i=0;i<3;i++)ctx.fillRect(X(i*5-6),X(i%2?3:-2),X(2),X(2));}
    // Cached soft puffs: visible smoke without hiding incoming fire; logic age freezes on pause.
    for(let i=0;i<8;i++){const age=w.age-i*18;if(age<0||age>=300)continue;const f=age/300,size=X(16+f*24);
      ctx.globalAlpha=0.32*Math.sin(Math.PI*f);ctx.drawImage(WRECK_SMOKE,X(Math.sin(i*2+w.variant)*8+f*11)-size/2,X(-5-f*37)-size/2,size,size);}
    ctx.restore();
  }
  for(const e of ground){drawGroundEnemy(e);if(e.flash>0){ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha=Math.min(e.flash,4)*0.07;drawGroundEnemy(e);ctx.restore();}}
}
function drawGroundEnemy(e){ctx.save();ctx.translate(X(e.x),groundRenderY(e.anchor));
    if(e.variant===2){
      if(IMG.ground_bunkers){const im=IMG.ground_bunkers,w=im.width/3;ctx.imageSmoothingEnabled=true;ctx.drawImage(im,e.stage*w,0,w,im.height,X(-34),X(-34),X(68),X(68));}
      else{ctx.fillStyle=e.stage?'#302631':'#252c30';ctx.beginPath();ctx.ellipse(0,0,X(32),X(30),0,0,Math.PI*2);ctx.fill();ctx.strokeStyle=e.stage?'#74515e':'#657073';ctx.lineWidth=X(4);ctx.stroke();ctx.fillStyle='#17191c';ctx.fillRect(X(-13),X(-14),X(26),X(32));}
      if(e.ct<=45&&e.y>=24&&e.y<=LH-90){ctx.strokeStyle=e.stage?'#ed83bc':'#f2bd64';ctx.globalAlpha=0.3+(1-e.ct/45)*0.6;ctx.lineWidth=X(1);ctx.beginPath();ctx.arc(0,0,X(22),0,Math.PI*2);ctx.stroke();}
      ctx.restore();return;
    }
    ctx.fillStyle='rgba(0,0,0,0.38)';ctx.beginPath();ctx.ellipse(X(3),X(7),X(26),X(18),0,0,Math.PI*2);ctx.fill();
    if(IMG.ground_sentries){const im=IMG.ground_sentries,w=im.width/3;ctx.imageSmoothingEnabled=true;ctx.drawImage(im,e.stage*w,0,w,im.height,X(-26),X(-26),X(52),X(52));}
    else{const bio=e.stage>0;ctx.lineCap='round';for(const side of [-1,1])for(const y of [-12,12]){ctx.strokeStyle=bio?'#715365':'#69747a';ctx.lineWidth=X(4);ctx.beginPath();ctx.moveTo(X(side*8),X(y*0.5));ctx.lineTo(X(side*22),X(y));ctx.lineTo(X(side*24),X(y+7));ctx.stroke();}
      let g=GROUND_FALLBACK_GRADIENT[bio?1:0];if(!g){g=ctx.createRadialGradient(X(-5),X(-6),X(2),0,0,X(21));g.addColorStop(0,bio?'#a07583':'#a5a38e');g.addColorStop(1,bio?'#362236':'#27323a');GROUND_FALLBACK_GRADIENT[bio?1:0]=g;}ctx.fillStyle=g;ctx.beginPath();ctx.ellipse(0,0,X(17),X(20),0,0,Math.PI*2);ctx.fill();}
    const charging=e.ct<=45&&e.y>=24&&e.y<=LH-90;
    ctx.rotate(e.aim-Math.PI/2);
    for(const offset of (e.variant?[-7,7]:[0])){ctx.fillStyle=e.stage?'#382433':'#1a252e';
      if(e.stage&&e.variant){ctx.beginPath();ctx.ellipse(X(offset),X(12),X(6),X(10),0,0,Math.PI*2);ctx.fill();}else ctx.fillRect(X(offset-4),X(8),X(8),X(13));
      ctx.fillStyle=charging?(e.stage?'#ed83bc':'#f2bd64'):'#887459';ctx.fillRect(X(offset-2),X(16),X(4),X(5));}
    if(charging){ctx.globalAlpha=0.35+(1-e.ct/45)*0.55;ctx.strokeStyle=e.stage?'#ed83bc':'#f2bd64';ctx.lineWidth=X(1);ctx.beginPath();ctx.arc(0,0,X(25),0,Math.PI*2);ctx.stroke();}
    ctx.restore();
}

function blit(img,x,y,sc){sc=sc||1;const w=img.width*sc,h=img.height*sc;ctx.drawImage(img,X(x)-Math.floor(w/2),X(y)-Math.floor(h/2),w,h);}
function seg(x,y,r,fill,edge){ctx.fillStyle=edge;ctx.fillRect(Math.round(x-r-1),Math.round(y-r-1),r*2+2,r*2+2);ctx.fillStyle=fill;ctx.fillRect(Math.round(x-r),Math.round(y-r),r*2,r*2);}
// Wave-six lurker: layered carapace over articulated, shaded tendrils.
// The endpoint expression matches the existing tip collision in update().
const LURKER_BANDS=[[1,5],[6,10],[11,14]]; // segment ranges sharing one stroke width, base to tip
function drawLurkerArt(e){
  ctx.save();ctx.lineCap='round';ctx.lineJoin='round';
  for(let j=0;j<e.tent.length;j++){
    const tn=e.tent[j],sw=Math.sin(e.t*0.05+tn.ph);
    const ax=e.x+(j-1.5)*11,ay=e.y+12;
    const tx=e.x+sw*tn.len*1.2,ty=e.y+18+tn.len*1.6;
    const points=[{x:ax,y:ay,r:4.5}];
    for(let i=1;i<=14;i++){const f=i/14,k=1-f;points.push({x:k*k*ax+2*k*f*(ax+sw*22)+f*f*tx,y:k*k*ay+2*k*f*(ay+tn.len*0.9)+f*f*ty,r:4.5-3*f});}
    // Finish each shading layer before the next, so joins never become metal-like rings. The taper is three width
    // bands per pass (9 strokes per tentacle) rather than a stroke per segment (42): the round joins hide the steps,
    // and this was the single largest draw cost on levels 2-3 (~170 strokes per lurker per frame).
    for(let pass=0;pass<3;pass++){const offset=pass===2?0.8:0;ctx.strokeStyle=['#130e20','#70445f','#a77586'][pass];
      for(const [a,b] of LURKER_BANDS){const r=points[(a+b)>>1].r;ctx.lineWidth=X(pass===0?r*2+2:pass===1?r*2:Math.max(0.6,r*0.45));
        ctx.beginPath();ctx.moveTo(X(points[a-1].x-offset),X(points[a-1].y-offset));for(let i=a;i<=b;i++)ctx.lineTo(X(points[i].x-offset),X(points[i].y-offset));ctx.stroke();}}
    // Pale tapered hook keeps the existing harmful tip easy to locate.
    ctx.beginPath();ctx.moveTo(X(tx-2),X(ty-4));ctx.quadraticCurveTo(X(tx),X(ty+3),X(tx+3),X(ty-3));ctx.strokeStyle='#d1b4c8';ctx.lineWidth=X(1);ctx.stroke();
  }
  const breath=1+Math.sin(e.t*0.07)*0.018;
  ctx.imageSmoothingEnabled=true;
  if(IMG.lurker_body)ctx.drawImage(IMG.lurker_body,X(e.x-31*breath),X(e.y-26*breath),X(62*breath),X(52*breath));
  else{ctx.fillStyle='#321e38';ctx.beginPath();ctx.ellipse(X(e.x),X(e.y),X(29),X(24),0,0,Math.PI*2);ctx.fill();
    for(let j=-1;j<=1;j++){ctx.fillStyle=j===0?'#805270':'#59364f';ctx.beginPath();ctx.ellipse(X(e.x+j*15),X(e.y-5),X(11),X(18),j*0.3,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#d7a34e';ctx.beginPath();ctx.ellipse(X(e.x+j*14),X(e.y+4),X(2),X(4),0,0,Math.PI*2);ctx.fill();}}

  // Firing organ swells and brightens during the existing 25-tick charge.
  const charge=e.ct<25?1-e.ct/25:0,glow=0.28+charge*0.65;
  ctx.globalAlpha=glow;ctx.fillStyle='#fa459a';ctx.beginPath();ctx.ellipse(X(e.x),X(e.y+20),X(2.2+charge*1.2),X(3.2+charge),0,0,Math.PI*2);ctx.fill();
  if(charge>0){ctx.globalAlpha=charge;ctx.strokeStyle='#ff9ed0';ctx.lineWidth=X(0.7);ctx.beginPath();ctx.arc(X(e.x),X(e.y+20),X(6-charge*2),0,Math.PI*2);ctx.stroke();}
  ctx.restore();
}


// The original skimmer core now sits inside a broad membrane so the Spore Ray reads wide even at gameplay scale.
function drawSporeSkimmer(e){
  const bank=Math.sin(e.t*0.045+e.ph),charge=e.ct<=36?1-e.ct/36:0;
  ctx.save();ctx.translate(X(e.x),X(e.y));ctx.rotate(bank*0.16);ctx.imageSmoothingEnabled=true;
  ctx.fillStyle='#211523';ctx.strokeStyle='#8d6879';ctx.lineWidth=X(1.5);ctx.beginPath();ctx.moveTo(0,X(-18));ctx.bezierCurveTo(X(-13),X(-15),X(-25),X(-10),X(-31),X(1));ctx.lineTo(X(-17),X(-3));ctx.lineTo(X(-27),X(12));ctx.quadraticCurveTo(X(-10),X(8),0,X(20));ctx.quadraticCurveTo(X(10),X(8),X(27),X(12));ctx.lineTo(X(17),X(-3));ctx.lineTo(X(31),X(1));ctx.bezierCurveTo(X(25),X(-10),X(13),X(-15),0,X(-18));ctx.fill();ctx.stroke();
  ctx.fillStyle='#5c3548';ctx.globalAlpha=0.72;for(const side of [-1,1]){ctx.beginPath();ctx.moveTo(0,X(-11));ctx.quadraticCurveTo(X(side*18),X(-8),X(side*28),X(3));ctx.lineTo(X(side*13),X(2));ctx.closePath();ctx.fill();}ctx.globalAlpha=1;
  if(IMG.spore_skimmer)ctx.drawImage(IMG.spore_skimmer,X(-14),X(-20),X(28),X(40));
  else{ctx.fillStyle='#532e30';ctx.beginPath();ctx.moveTo(0,X(24));ctx.lineTo(X(-20),X(-12));ctx.lineTo(0,X(-20));ctx.lineTo(X(20),X(-12));ctx.closePath();ctx.fill();
    ctx.fillStyle='#d4b583';ctx.beginPath();ctx.moveTo(0,X(22));ctx.lineTo(X(-7),X(-12));ctx.lineTo(X(7),X(-12));ctx.closePath();ctx.fill();
    ctx.fillStyle='#db872f';ctx.beginPath();ctx.ellipse(0,X(-5),X(5),X(9),0,0,Math.PI*2);ctx.fill();}
  ctx.strokeStyle='#6d4052';ctx.lineWidth=X(2);for(const side of [-1,1]){ctx.beginPath();ctx.moveTo(X(side*7),X(15));ctx.quadraticCurveTo(X(side*12+bank*3),X(27),X(side*8),X(34));ctx.stroke();}
  if(charge>0){ctx.globalAlpha=0.35+charge*0.6;ctx.fillStyle='#ffbd79';for(const side of [-1,0,1]){ctx.beginPath();ctx.ellipse(X(side*8),X(11),X(2+charge),X(3+charge),0,0,Math.PI*2);ctx.fill();}ctx.globalAlpha=1;}
  ctx.restore();
}

function drawCarapaceRammer(e){
  const tell=e.state===1,charging=e.state===2,open=tell?1-e.ct/45:charging?1:0,tilt=charging?Math.atan2(e.vy,e.vx)+Math.PI/2:Math.sin(e.t*0.025+e.ph)*0.08;
  ctx.save();ctx.translate(X(e.x),X(e.y));ctx.rotate(tilt);
  if(charging){ctx.globalAlpha=0.3;ctx.fillStyle='#c96767';for(const side of [-1,1])ctx.fillRect(X(side*15-3),X(-31),X(6),X(18));ctx.globalAlpha=1;}
  ctx.fillStyle='#251824';ctx.strokeStyle='#d1b8a5';ctx.lineWidth=X(2);ctx.beginPath();ctx.moveTo(0,X(-23));ctx.quadraticCurveTo(X(-24),X(-25),X(-34),X(-5));ctx.lineTo(X(-24),X(14));ctx.quadraticCurveTo(X(-11),X(7),0,X(20));ctx.quadraticCurveTo(X(11),X(7),X(24),X(14));ctx.lineTo(X(34),X(-5));ctx.quadraticCurveTo(X(24),X(-25),0,X(-23));ctx.fill();ctx.stroke();
  ctx.fillStyle='#6c5361';for(const side of [-1,1]){ctx.beginPath();ctx.ellipse(X(side*18),X(-5),X(12),X(16),side*0.25,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#9d8790';ctx.lineWidth=X(1);ctx.stroke();}
  ctx.fillStyle=tell||charging?'#ffae68':'#734451';ctx.beginPath();ctx.ellipse(0,X(1+open*3),X(4+open*4),X(7+open*2),0,0,Math.PI*2);ctx.fill();
  if(tell){ctx.globalAlpha=0.45+open*0.45;ctx.strokeStyle='#ffd49b';ctx.beginPath();ctx.arc(0,X(1),X(14-open*5),0,Math.PI*2);ctx.stroke();}
  ctx.restore();
}

function hunterTendrils(e){
  const heading=e.state===2?Math.atan2(e.vy,e.vx):Math.PI/2,reach=e.state===2?44:e.state===1?32:26,wave=Math.sin(e.t*0.12+e.ph)*6;
  return[-0.72,0.04,0.7].map((spread,i)=>{const a=heading+spread,root={x:e.x+Math.cos(a)*7,y:e.y+Math.sin(a)*7},tip={x:e.x+Math.cos(a)*reach,y:e.y+Math.sin(a)*reach};return{root,tip,cp:{x:(root.x+tip.x)/2+Math.cos(a+Math.PI/2)*wave*(i-1),y:(root.y+tip.y)/2+Math.sin(a+Math.PI/2)*wave*(i-1)}};});
}
function hunterTipPoints(e){return hunterTendrils(e).map(t=>t.tip);}
function drawTendrilHunter(e){
  const tell=e.state===1,lunging=e.state===2;
  ctx.save();ctx.lineCap='round';ctx.lineJoin='round';for(const [i,tn] of hunterTendrils(e).entries()){
    ctx.strokeStyle='#170f1c';ctx.lineWidth=X(lunging?7:6);ctx.beginPath();ctx.moveTo(X(tn.root.x),X(tn.root.y));ctx.quadraticCurveTo(X(tn.cp.x),X(tn.cp.y),X(tn.tip.x),X(tn.tip.y));ctx.stroke();
    ctx.strokeStyle=i===1?'#96657d':'#6e475e';ctx.lineWidth=X(lunging?3.5:2.5);ctx.stroke();ctx.fillStyle=lunging?'#f1c39a':'#b090a0';ctx.beginPath();ctx.arc(X(tn.tip.x),X(tn.tip.y),X(2.5),0,Math.PI*2);ctx.fill();
  }ctx.translate(X(e.x),X(e.y));ctx.fillStyle='#2a192b';ctx.strokeStyle=tell?'#e9b07d':'#987688';ctx.lineWidth=X(tell?2:1);ctx.beginPath();ctx.moveTo(0,X(-13));ctx.lineTo(X(11),X(-3));ctx.lineTo(X(7),X(11));ctx.lineTo(X(-5),X(14));ctx.lineTo(X(-13),0);ctx.closePath();ctx.fill();ctx.stroke();ctx.fillStyle=tell||lunging?'#ffac68':'#7d465b';ctx.beginPath();ctx.ellipse(0,X(3),X(tell?5:3),X(tell?6:4),0,0,Math.PI*2);ctx.fill();ctx.restore();
}
// Crawler legs and amber organ animate from the existing gait/lunge state.
function drawCrawlerArt(e){
  ctx.save();ctx.translate(X(e.x),X(e.y));ctx.scale(e.dir,1);ctx.lineCap='round';ctx.lineJoin='round';
  for(const side of [-1,1])for(let j=0;j<3;j++){
    const root=-13+j*10,step=Math.sin(e.t*0.25+j*1.8+side)*3;
    const knee=root+(e.lunge>0?-6:step),foot=root+(e.lunge>0?-10:step*1.5);
    ctx.beginPath();ctx.moveTo(X(root),X(side*8));ctx.lineTo(X(knee),X(side*18));ctx.lineTo(X(foot+4),X(side*24));
    ctx.strokeStyle='#16180f';ctx.lineWidth=X(4);ctx.stroke();
    ctx.strokeStyle='#6c6545';ctx.lineWidth=X(2.4);ctx.stroke();
    ctx.strokeStyle='#b7ac80';ctx.lineWidth=X(0.7);ctx.stroke();
    ctx.beginPath();ctx.moveTo(X(foot+4),X(side*24));ctx.lineTo(X(foot+8),X(side*21));ctx.strokeStyle='#d6c8a2';ctx.lineWidth=X(1.2);ctx.stroke();
  }
  ctx.imageSmoothingEnabled=true;
  const breath=1+Math.sin(e.t*0.1)*0.015;
  ctx.drawImage(IMG.crawler_body,X(-25),X(-18*breath),X(50),X(36*breath));
  ctx.globalAlpha=e.lunge>0?0.85:0.25;ctx.fillStyle='#ffad37';
  ctx.beginPath();ctx.ellipse(X(15),0,X(e.lunge>0?3:2),X(2),0,0,Math.PI*2);ctx.fill();
  ctx.restore();
}


function drawCrawler(e){const cx=X(e.x),cy=X(e.y),d=e.dir;
  // spiky segmented body
  for(let i=0;i<5;i++){seg(cx-d*i*10,cy+i*3,10-i,i%2?'#4a7a20':'#6aa030','#1c3808');}
  for(let i=0;i<6;i++){ctx.fillStyle='#d0f060';ctx.fillRect(cx-24+i*10,cy-18-(i%2)*4,3,10);}
  // hooked arms reaching in direction of travel, animated
  const a=Math.sin(e.t*0.25)*6;
  for(const side of[-1,1]){const ax=cx+d*18,ay=cy+side*10+a*side;ctx.fillStyle='#1c3808';ctx.fillRect(Math.min(cx,ax),ay-2,Math.abs(ax-cx),5);
    ctx.fillStyle=C.s5;ctx.fillRect(ax-2,ay-2,d>0?12:-12,4);ctx.fillRect(ax+d*8,ay-2-side*6,4,side>0?-6:6);ctx.fillRect(ax+d*8,ay-2,4,side*8);}
  seg(cx+d*6,cy,3,e.lunge>0?C.magenta:'#ff8000','#000');}
// Shop previews and live equipment use the same renderers; these never change loadout state.
// Engine housing gradients are position-free (drawn under a translate), so one per tier serves every frame.
const ENGINE_GRADIENT=[];
function drawEngines(tier,sx,sy,frame=t){
  // Cool exhaust and physical housings share the same two rear sockets.
  ctx.save();
  for(const side of [-1,1]){const x=X(sx+side*11),y=X(sy+28+tier),length=12+tier*4+(frame%6<3?2:0);
    ctx.fillStyle='#176d8a';ctx.beginPath();ctx.moveTo(x-5,y);ctx.lineTo(x,y+length);ctx.lineTo(x+5,y);ctx.fill();ctx.fillStyle='#b8faff';ctx.beginPath();ctx.moveTo(x-2,y);ctx.lineTo(x,y+length*0.7);ctx.lineTo(x+2,y);ctx.fill();}
  ctx.restore();
  ctx.save();
  for(const side of [-1,1]){
    const x=X(sx+side*11),y=X(sy+17),w=5+tier;
    let metal=ENGINE_GRADIENT[tier];if(!metal){metal=ctx.createLinearGradient(-w,0,w,0);metal.addColorStop(0,'#20282e');metal.addColorStop(0.4,'#afbabd');metal.addColorStop(1,'#3b464c');ENGINE_GRADIENT[tier]=metal;}
    ctx.save();ctx.translate(x,0);ctx.fillStyle=metal;ctx.fillRect(-w,y,w*2,25+tier*2);ctx.restore();
    ctx.strokeStyle='#122330';ctx.lineWidth=1;ctx.strokeRect(x-w,y,w*2,25+tier*2);
    for(let n=0;n<tier;n++){
      ctx.fillStyle='#20313c';ctx.fillRect(x-w-2,y+4+n*7,w*2+4,3);
      ctx.fillStyle='#a9eff5';ctx.fillRect(x-w,y+4+n*7,w*2,1);
    }
    ctx.fillStyle='#152b3a';ctx.fillRect(x-w,y+21+tier*2,w*2,5);
    ctx.fillStyle='#9ef4ff';ctx.fillRect(x-w+2,y+24+tier*2,w*2-4,3);
  }
  ctx.restore();
}
function drawShieldLayers(count,sx,sy,frame=t,hit=shieldHit){
  if(count<=0)return;
  for(const side of [-1,1]){const x=X(sx+side*9),y=X(sy-3);ctx.save();ctx.fillStyle='#26323a';ctx.strokeStyle='#bca16a';ctx.lineWidth=2;ctx.beginPath();ctx.arc(x,y,6,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.fillStyle=count>1?'#d9ffff':'#47cadf';ctx.beginPath();ctx.arc(x,y,3,0,Math.PI*2);ctx.fill();ctx.restore();}
  ctx.save();const pulse=1+Math.sin(frame*0.08)*0.015;
  ctx.strokeStyle=hit>0?'#eaffff':'#66dce9';ctx.lineWidth=hit>0?3:1;
  ctx.globalAlpha=hit>0?0.85:0.3;
  ctx.beginPath();ctx.ellipse(X(sx),X(sy),X(25*pulse),X(29*pulse),0,0,Math.PI*2);ctx.stroke();
  if(count>1){ctx.globalAlpha=hit>0?0.5:0.16;ctx.beginPath();ctx.ellipse(X(sx),X(sy),X(28*pulse),X(32*pulse),0,0,Math.PI*2);ctx.stroke();}
  ctx.restore();
}
// One assembly for live flight and candidate previews; previews never mutate run/save state.
function drawShipAssembly(x,y,loadout,frame=t,gunFlash=0,pods=0,podFlash=0,podSide=-1,shieldFlash=0,laserPhase=0,laserT=0){
  const base=IMG.player_hull||IMG.player||SHIP;
  ctx.drawImage(base,X(x)-Math.floor(base.width/2),X(y)-Math.floor(base.height/2));
  drawEquipmentModule('engine',loadout.engine,x,y,{frame});
  drawEquipmentModule('primary',loadout.weapon,x,y,{frame,flash:gunFlash});
  drawEquipmentModule('ordnance',loadout.rockets,x,y,{frame,open:pods,flash:podFlash,side:podSide});
  drawEquipmentModule('defence',loadout.shield,x,y,{frame,flash:shieldFlash});
  drawEquipmentModule('support',loadout.orb,x,y,{frame});
  drawEquipmentModule('sideWeapon',loadout.sideLaser,x,y,{frame,laserPhase,laserT});
}
function activeLoadout(){const loadout=savedLoadout();loadout.weapon=wpn;loadout.shield=shield;loadout.orb=orbActive?1:0;return loadout;}
function drawEquipmentPreview(kind,tier,x,y,scale=0.56){
  // A checkpoint preview starts from the live ship; the title Workshop starts from the saved launch fit.
  const loadout=candidateLoadout(shopFromSector?activeLoadout():savedLoadout(),kind,tier);
  ctx.save();ctx.translate(X(x),X(y));ctx.scale(scale,scale);
  drawShipAssembly(0,0,loadout,0,0,loadout.rockets?24:0);
  ctx.restore();
}
function drawShip(){if(mode==='title')return;if(ship.inv>0&&Math.floor(ship.inv/4)%2===0&&mode==='play')return;
  if(orbActive)drawSeekerOrb(orbX,orbY,t,orbFlash);
  const loadout=activeLoadout();loadout.orb=0;
  drawShipAssembly(ship.x,ship.y,loadout,t,muzz,podOpen,rocketFlash,rocketSide,shieldHit,sideLaserPhase,sideLaserT);
}

function drawField(){ctx.save();ctx.beginPath();ctx.rect(X(PX),0,X(PW),H);ctx.clip();
  if(WORLD_TILES[worldStage])drawWorld();else{
  ctx.fillStyle='#04030a';ctx.fillRect(X(PX),0,X(PW),H);
  if(IMG.px_nebula){const layer=(nm,sp,al)=>{const im=IMG[nm];if(!im)return;const y=Math.floor((scroll*sp)%im.height);if(al!==undefined)ctx.globalAlpha=al;ctx.drawImage(im,0,0,X(PW),im.height,X(PX),y-im.height,X(PW),im.height);ctx.drawImage(im,0,0,X(PW),im.height,X(PX),y,X(PW),im.height);ctx.globalAlpha=1;};
    layer('px_nebula',0.35);layer('px_haze1',0.55,0.7);layer('px_stars_far',0.8,0.6);layer('px_haze2',1.0,0.5);layer('px_stars_mid',1.4,0.75);layer('px_stars_near',2.0,0.9);}
  else{ctx.globalAlpha=0.85;const sy=Math.floor(scroll);ctx.drawImage(BG,X(PX),sy-TH);ctx.drawImage(BG,X(PX),sy);ctx.globalAlpha=1;}
  for(const st of STARS){const yy=(st.y+scroll*1.6)%H;ctx.fillStyle=st.c;ctx.fillRect(X(PX)+st.x,Math.floor(yy),st.s,st.s);}
  }
  drawFaunaBackground();drawRouteSegments();drawBroodLattice();drawGround();drawWallFauna();
  for(const d of drops){const bob=Math.sin(t*0.15+d.y)*2,p=1+Math.sin(t*0.2+d.x)*0.08;
    if(d.k==='core'){if(!img('icon_core',d.x,d.y,0.7*p)){blit(CORE,d.x,d.y,1.4*p);}}
    else if(d.k==='o'){drawSeekerOrb(d.x,d.y+bob,t,0);txt('ORB',d.x,d.y+bob+14,C.cyan,8,'center');}
    else if(d.k==='h'){blit(CAP_H,d.x,d.y+bob,2*p);txt('+',d.x,d.y+bob-4,'#f0fff2',10,'center');txt('REPAIR',d.x,d.y+bob+17,'#79e69b',8,'center');}
    else{const nm=d.k==='w'?'icon_w':d.k==='b'?'icon_b':'icon_s';if(!img(nm,d.x,d.y+bob,p)){const cap=d.k==='w'?CAP_W:d.k==='b'?CAP_B:CAP_S;blit(cap,d.x,d.y+bob,2);}txt(d.k.toUpperCase(),d.x+0.5,d.y+bob-7,C.s0,13,'center');txt(d.k.toUpperCase(),d.x,d.y+bob-8,C.white,13,'center');}}
  for(const e of enemies){drawAirEnemy(e);if(e.flash>0){ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha=Math.min(e.flash,4)*0.07;drawAirEnemy(e);ctx.restore();}}

  drawBoss();drawSideLaserBeams();
  for(const s of shots){ctx.save();ctx.translate(X(s.x),X(s.y));ctx.rotate(Math.atan2(s.vy,s.vx)+Math.PI/2);if(s.rocket){const flame=7+(s.life%4)*2;ctx.fillStyle='rgba(67,209,236,0.3)';ctx.beginPath();ctx.moveTo(X(-3),X(5));ctx.lineTo(0,X(5+flame));ctx.lineTo(X(3),X(5));ctx.fill();ctx.fillStyle='#d9fbff';ctx.fillRect(X(-1),X(5),X(2),X(flame*0.55));}const b=s.rocket?ROCKET:BOLT[s.g];ctx.drawImage(b,-b.width/2,-12);ctx.restore();}
  for(const s of eshots){if(s.fauna==='spore'){drawFaunaProjectile(s);continue;}if(s.family==='ray'){drawRayProjectile(s);continue;}if(s.ground){ctx.fillStyle=s.bio?'#e58cbd':'#efb65d';ctx.beginPath();ctx.arc(X(s.x),X(s.y),X(4.5),0,Math.PI*2);ctx.fill();ctx.fillStyle=s.bio?'#67334e':'#784b28';ctx.beginPath();ctx.arc(X(s.x-1),X(s.y+1),X(2),0,Math.PI*2);ctx.fill();continue;}const nm=s.blue?'plasma_blue':'plasma_red';for(let k=1;k<=3;k++){if(!img(nm,s.x-s.vx*k*1.5,s.y-s.vy*k*1.5,1-k*0.2,0.35-k*0.1))blit(PLASMA[1],s.x-s.vx*k*1.5,s.y-s.vy*k*1.5,3-k*0.6);}ctx.globalAlpha=1;if(!img(nm,s.x,s.y,1+(t%8<4?0.1:0)))blit(PLASMA[t%8<4?0:1],s.x,s.y,3);}
  for(const b of booms){if(b.kind==='impact'){
    const age=8-b.life;ctx.save();ctx.globalAlpha=b.life/8;
    for(let i=0;i<4;i++){const a=i*2.4,dx=Math.cos(a),dy=Math.sin(a),r=2+age*0.7;
      if(b.bio){ctx.fillStyle=i%2?'#e9adbb':'#f6c886';ctx.beginPath();ctx.arc(X(b.x)+dx*r,X(b.y)+dy*r,Math.max(0.6,2-age*0.15),0,Math.PI*2);ctx.fill();}
      else{ctx.strokeStyle=i%2?'#e8cb9a':'#eb9b51';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(X(b.x)+dx*r,X(b.y)+dy*r);ctx.lineTo(X(b.x)+dx*(r+3),X(b.y)+dy*(r+3));ctx.stroke();}}
    ctx.restore();continue;
  }if(b.vx===undefined){const st=STRIP[b.kind||'exp_small'];const tot=24;const prog=(tot-b.life)/tot;if(!(st&&strip(b.kind,prog*st.n,b.x,b.y,b.kind==='exp_big'?1.1:b.kind==='exp_ring'?2.4:1.4))){const fr=Math.floor((24-b.life)/4);if(fr<6)blit(BOOMF[fr],b.x,b.y,b.sc);}}
    else{const f=b.life/24;ctx.fillStyle=f>0.6?C.white:f>0.35?C.yellow:f>0.15?C.orange:C.red;const sz=f>0.5?9:6;ctx.fillRect(X(b.x),X(b.y),sz,sz);}}
  for(const r of rings){ctx.globalAlpha=r.life/(r.big?46:30);ctx.strokeStyle=r.col;ctx.lineWidth=r.big?6:3;ctx.beginPath();ctx.arc(X(r.x),X(r.y),X(r.r),0,6.283);ctx.stroke();if(r.big){ctx.lineWidth=2;ctx.beginPath();ctx.arc(X(r.x),X(r.y),X(r.r*0.7),0,6.283);ctx.stroke();}}ctx.globalAlpha=1;
  for(const f of floats){ctx.globalAlpha=Math.min(1,f.life/20);txt(f.txt,f.x+1,f.y+1,C.s0,f.big?22:13,'center');txt(f.txt,f.x,f.y,f.col,f.big?22:13,'center');}ctx.globalAlpha=1;
  if(bombFx>0){ctx.globalAlpha=bombFx/40*0.6;ctx.fillStyle=C.G;ctx.fillRect(X(PX),0,X(PW),H);ctx.globalAlpha=1;}
  drawShip();ctx.restore();}

// Gameplay silhouettes for the campaign pass; final painted designs follow the visual review.
function drawCampaignCreature(e){ctx.save();ctx.translate(X(e.x),X(e.y));const needle=e.k===7,colony=e.k===8;
  const pulse=1+Math.sin(e.t*0.07)*0.04;ctx.scale(pulse,pulse);
  if(colony&&IMG.colony_body){
    const art=IMG.colony_body,h=52,w=h*art.width/art.height;ctx.imageSmoothingEnabled=true;ctx.drawImage(art,X(-w/2),X(-26),X(w),X(h));
    if(e.ct<45&&e.y>20&&e.y<LH-100){ctx.globalAlpha*=(1-e.ct/45)*0.4;ctx.fillStyle='#ffdc9b';ctx.beginPath();ctx.ellipse(0,X(17),X(2),X(3),0,0,Math.PI*2);ctx.fill();}
    ctx.restore();return;
  }
  if(needle&&IMG.needle_body){
    ctx.imageSmoothingEnabled=true;const art=IMG.needle_body,h=30,w=h*art.width/art.height;
    ctx.drawImage(art,X(-w/2),X(-17),X(w),X(h));
    if(e.ct<45&&e.y>20&&e.y<LH-100){ctx.globalAlpha*=(1-e.ct/45)*0.4;ctx.fillStyle='#ffdc9b';ctx.beginPath();ctx.ellipse(0,X(10),X(1.5),X(2),0,0,Math.PI*2);ctx.fill();}
    ctx.restore();return;
  }
  if(e.k===6&&IMG.seeder_body){
    ctx.imageSmoothingEnabled=true;ctx.drawImage(IMG.seeder_body,X(-22),X(-22),X(44),X(44));
    if(e.ct<45&&e.y>20&&e.y<LH-100){ctx.globalAlpha*=(1-e.ct/45)*0.5;ctx.fillStyle='#ffdc9b';for(const side of [-1,1]){ctx.beginPath();ctx.ellipse(X(side*4),X(12),X(2),X(3),0,0,Math.PI*2);ctx.fill();}}
    ctx.restore();return;
  }
  if(needle){for(let i=4;i>=0;i--){ctx.fillStyle=i%2?'#6f4865':'#aa8297';ctx.beginPath();ctx.ellipse(X(Math.sin(e.t*0.09-i)*3),X(i*5-12),X(7-i),X(5),0,0,Math.PI*2);ctx.fill();}}
  else{for(let i=0;i<(colony?5:3);i++){const a=i*2.4,x=Math.cos(a)*(colony?14:8),y=Math.sin(a)*12;ctx.fillStyle=colony?'#744553':'#68664b';ctx.beginPath();ctx.ellipse(X(x),X(y),X(13),X(16),a,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#2a1a29';ctx.lineWidth=X(2);ctx.stroke();}}
  ctx.fillStyle=e.ct<45?'#ffd09a':'#c78b59';ctx.beginPath();ctx.ellipse(0,X(7),X(needle?3:6),X(5),0,0,Math.PI*2);ctx.fill();ctx.restore();}

// Shared by normal drawing and the short silhouette-only additive hit pass.
function drawAirEnemy(e){
    if(e.k===0){if(!img('scout',e.x,e.y,1+Math.sin(e.t*0.15)*0.04)){const p=1.5+Math.sin(e.t*0.15)*0.12;blit(E1,e.x,e.y,p);}}
    else if(e.k===1){const wob=Math.sin(e.t*0.3);ctx.save();ctx.translate(X(e.x),X(e.y));ctx.rotate(wob*0.12);const b=IMG.bomber;if(b)ctx.drawImage(b,-b.width/2,-b.height/2);else ctx.drawImage(E2,-E2.width*0.75,-E2.height*0.75,E2.width*1.5,E2.height*1.5);ctx.restore();}
    else if(e.k===2){if(!img('frigate',e.x,e.y))blit(E3,e.x,e.y,1.5);if(e.ct<30&&Math.floor(e.ct/4)%2===0){ctx.fillStyle=C.magenta;ctx.fillRect(X(e.x)-9,X(e.y)+8,18,6);}}
    else if(e.k===3){drawLurkerArt(e);}
    else if(e.k===5){drawSporeSkimmer(e);}
    else if(e.k===9){drawCarapaceRammer(e);}
    else if(e.k===10){drawTendrilHunter(e);}
    else if(e.k>=6){drawCampaignCreature(e);}
    else if(e.k===4&&IMG.crawler_body){drawCrawlerArt(e);}
    else{const sc=K/1.5,cx=X(e.x),cy=X(e.y);ctx.save();ctx.translate(cx*(1-sc),cy*(1-sc));ctx.scale(sc,sc);drawCrawler(e);ctx.restore();}

}
