'use strict';
// Gameplay update(): collisions, drops, pickups, bombs; enemy/ship drawing and drawField().
function boom(x,y,big){SFX.boom(big);booms.push({x,y,f:0,sc:big?1.6:1,life:24,kind:big?'exp_big':'exp_small'});for(let i=0;i<(big?10:4);i++)booms.push({x,y,vx:(Math.random()-0.5)*(big?6:4),vy:(Math.random()-0.5)*(big?6:4),life:12+Math.random()*12});}
function hitShip(){if(ship.inv>0||GOD)return;if(shield>0){shield--;ship.inv=40;shieldHit=12;SFX.shieldHit();return;}
  ship.hull--;
  if(ship.hull>0){ship.inv=40;shake=6;flash=3;SFX.hit();addFloat(ship.x,ship.y-40,ship.hull===1?'HULL CRITICAL':'HULL DAMAGED',C.red);return;}
  resetRockets();chain=0;chainT=0;lives--;ship.hull=lives>0?MAX_HULL:0;boom(ship.x,ship.y,true);SFX.die();shake=14;flash=8;ship.inv=90;wpn=Math.max(0,wpn-1);addFloat(ship.x,ship.y-40,'SHIP LOST',C.red);
  if(lives<=0){save.cores+=cores-bankedCores;bankedCores=cores;if(score>save.best)save.best=score;persist();mode='dead';deadSel=0;t=0;SFX.bossTheme(false);}}
function dropFor(e){kills++;
  const weaponGap=level<=5?9:15;
  if(wpn<MAXW&&(kills===1||kills-lastW>=weaponGap)){lastW=kills;return 'w';}
  const early=level<=4;const r=Math.random();
  if(r<0.30)return 'core';
  if(r<0.32)return 'b';
  if(r<(early?0.38:0.34))return 's';
  return null;}
function addFloat(x,y,txt,col,big){floats.push({x,y,txt,col,life:60,big});}
function pickupEvent(text,col){evt=50;evtText=text;evtCol=col;flash=6;slow=10;rings.push({x:ship.x,y:ship.y,r:10,col,life:30});
  for(let i=0;i<14;i++)booms.push({x:ship.x,y:ship.y,vx:Math.cos(i/14*6.283)*4,vy:Math.sin(i/14*6.283)*4,life:18,col});}
function fireBomb(){if(paused||bombs<=0||bombFx>0)return;bombs--;bombFx=40;shake=18;flash=10;slow=14;SFX.bomb();
  rings.push({x:ship.x,y:ship.y,r:20,col:C.white,life:40,big:true});booms.push({x:ship.x,y:ship.y,f:0,life:24,kind:'exp_ring',sc:1});
  for(const e of enemies){if(e.y>-10){e.hp-=6;if(e.hp<=0){awardKill(e.k===2?50:(e.k===1?20:10),e.x,e.y);boom(e.x,e.y,true);}}}
  enemies=enemies.filter(e=>e.hp>0);eshots=[];bombBoss();addFloat(ship.x,ship.y-60,'MEGABOMB',C.G,true);}
function update(){t++;scroll=(scroll+1.8)%TH;
  if(chainT>0&&--chainT===0)chain=0;
  let dx=0,dy=0;if(keys.l)dx-=1;if(keys.r)dx+=1;if(keys.u)dy-=1;if(keys.d)dy+=1;
  if(ptr.down){dx+=(ptr.x-ptr.lx)*4.6/spd();dy+=(ptr.y-ptr.ly)*4.6/spd();ptr.lx=ptr.x;ptr.ly=ptr.y;}
  if(dx&&dy&&!ptr.down){dx*=0.707;dy*=0.707;}
  ship.x=Math.max(PX+30,Math.min(PX+PW-30,ship.x+dx*spd()));ship.y=Math.max(34,Math.min(LH-34,ship.y+dy*spd()));
  if(ship.inv>0)ship.inv--;
  fireT--;if(fireT<=0){const G=GUN[wpn];fireT=G.rate;muzz=6;SFX.shot(Math.min(2,wpn));const sh=(ox,oy,vx,vy)=>shots.push({x:ship.x+ox,y:ship.y+oy,vx,vy,g:wpn,dmg:G.dmg});
    if(wpn===0)sh(0,-32,0,-8);
    else if(wpn===1){sh(-14,-20,0,-8);sh(14,-20,0,-8);}
    else if(wpn===2){sh(0,-34,0,-9);sh(-16,-20,0,-8.5);sh(16,-20,0,-8.5);}
    else if(wpn===3){sh(0,-34,0,-9);sh(-14,-22,-0.8,-8.4);sh(14,-22,0.8,-8.4);sh(-22,-14,-1.4,-7.6);sh(22,-14,1.4,-7.6);}
    else{sh(-6,-34,0,-10);sh(6,-34,0,-10);sh(-18,-22,-0.7,-9);sh(18,-22,0.7,-9);sh(-26,-12,-1.5,-8);sh(26,-12,1.5,-8);}}
  updateRockets();
  for(const s of shots){s.x+=s.vx;s.y+=s.vy;}shots=shots.filter(s=>s.y>-12&&s.y<LH+20&&s.x>PX&&s.x<PX+PW);
  waveT--;
  if(boss||bossWarn>0||bossDying>0){ if(boss&&!boss.mother&&!bossDying&&t%240===0&&enemies.length<3){for(let i=0;i<2;i++)enemies.push({k:0,x:PX+60+Math.random()*(PW-120),y:-30-i*40,ph:i,hp:1,t:0});} }
  else if(!sectorPending&&enemies.length===0&&waveT<=0){if((level+1)%5===0){startBossWarning();}else{spawnWave();waveT=level<4?120:90;}}
  else if(!sectorPending&&waveT<=0&&enemies.length<4&&(level+1)%5!==0){spawnWave();waveT=level<4?120:90;}
  updateBoss();updateWorld();
  for(const e of enemies){e.t++;
    if(e.k===0){e.y+=1.1+level*0.04;e.x+=Math.sin(e.t*0.05+e.ph)*1.8;}
    if(e.k===1){e.y+=2.8+level*0.06;}
    if(e.k===3){if(e.y<e.ty)e.y+=0.8;else e.x+=Math.sin(e.t*0.02)*1.2;e.ct--;
      if(e.ct<=0&&e.y>0){e.ct=110;for(let j=-1;j<=1;j++){const a=Math.atan2(ship.y-e.y,ship.x-e.x)+j*0.35;eshots.push({x:e.x,y:e.y+20,vx:Math.cos(a)*2.2,vy:Math.sin(a)*2.2,blue:true});}SFX.plasma();}
      for(const tn of e.tent){const tipx=e.x+Math.sin(e.t*0.05+tn.ph)*tn.len*1.2,tipy=e.y+18+tn.len*1.6;if(ship.inv<=0&&!GOD&&Math.abs(tipx-ship.x)<14&&Math.abs(tipy-ship.y)<16){boom(tipx,tipy,false);hitShip();}}}
    if(e.k===4){e.y+=0.9;if(e.lunge>0){e.lunge--;e.x+=e.dir*5;}else{e.x+=e.dir*0.6;if(Math.abs(e.y-ship.y)<30&&Math.random()<0.03){e.lunge=22;e.dir=ship.x>e.x?1:-1;}}
      if(e.x<PX+16){e.x=PX+16;e.dir=1;}if(e.x>PX+PW-16){e.x=PX+PW-16;e.dir=-1;}}
    if(e.k===2){e.y+=0.6;e.ct--;if(e.ct<=0&&e.y>0){e.ct=90;const a=Math.atan2(ship.y-e.y,ship.x-e.x);eshots.push({x:e.x,y:e.y+8,vx:Math.cos(a)*2.4,vy:Math.sin(a)*2.4});SFX.plasma();}}
    if(Math.abs(e.x-ship.x)<R[e.k]+6&&Math.abs(e.y-ship.y)<R[e.k]+10){e.hp=0;boom(e.x,e.y,false);hitShip();}}
  // One hit per shot per tick; spent shots (y=-99) must not test enemies still queued above the screen.
  for(const s of shots){if(s.y<-50)continue;for(const e of enemies){if(e.hp>0&&Math.abs(s.x-e.x)<R[e.k]&&Math.abs(s.y-e.y)<R[e.k]){e.hp-=(s.dmg||1);e.flash=4;if(e.hp>0){SFX.hit();booms.push({x:s.x,y:s.y-4,f:0,life:8,kind:'hit',sc:1});}s.y=-99;
      if(e.hp<=0){awardKill([10,20,50,150,60][e.k],e.x,e.y);boom(e.x,e.y,e.k>=2);const k=dropFor(e);if(k)drops.push({x:e.x,y:e.y,k});}break;}}}
  enemies=enemies.filter(e=>e.hp>0&&e.y<LH+30);if(enemies.some(e=>e.k===3)&&enemies.length>12)enemies=enemies.filter(e=>e.k!==0||e.y>-100);
  for(const s of eshots){s.x+=s.vx;s.y+=s.vy;if(Math.abs(s.x-ship.x)<16&&Math.abs(s.y-ship.y)<20){s.y=999;hitShip();}}
  eshots=eshots.filter(s=>s.y<LH+10&&s.y>-10&&s.x>PX&&s.x<PX+PW);
  for(const d of drops){if(sectorPending){const dx=ship.x-d.x,dy=ship.y-d.y,len=Math.hypot(dx,dy)||1;d.x+=dx/len*7;d.y+=dy/len*7;}else d.y+=1.4;if(Math.hypot(d.x-ship.x,d.y-ship.y)<34||(sectorPending&&waveT<=0)){d.y=999;
      if(d.k==='core'){cores++;score+=5;SFX.core();addFloat(d.x,d.y,'+1 CORE',C.cyan);}
      if(d.k==='w'){if(wpn<MAXW){wpn++;pickupEvent('GUN '+(wpn+1)+'/5 / '+GUN[wpn].n,C.cyan);}else{score+=100;pickupEvent('GUN MAX / +100 SCORE',C.cyan);}SFX.power();}
      if(d.k==='s'){shield=Math.min(2,shield+1);pickupEvent('SHIELD',C.cyan);SFX.shield();}
      if(d.k==='b'){const full=bombs>=6;bombs=Math.min(6,bombs+1);pickupEvent(full?'BOMB FULL':'BOMB +1',C.G);SFX.power();}}}
  drops=drops.filter(d=>d.y<LH+12);
  for(const b of booms){if(b.vx!==undefined){b.x+=b.vx;b.y+=b.vy;}b.life--;}booms=booms.filter(b=>b.life>0);if(hint>0)hint--;if(muzz>0)muzz--;if(shieldHit>0)shieldHit--;
  for(const f of floats){f.y-=0.7;f.life--;}floats=floats.filter(f=>f.life>0);for(const r of rings){r.r+=r.big?9:4;r.life--;}rings=rings.filter(r=>r.life>0);if(evt>0)evt--;if(bombFx>0)bombFx--;
  for(const e of enemies)if(e.flash>0)e.flash--;
  if(sectorPending&&waveT<=0)completeSector();}

function blit(img,x,y,sc){sc=sc||1;const w=img.width*sc,h=img.height*sc;ctx.drawImage(img,X(x)-Math.floor(w/2),X(y)-Math.floor(h/2),w,h);}
function seg(x,y,r,fill,edge){ctx.fillStyle=edge;ctx.fillRect(Math.round(x-r-1),Math.round(y-r-1),r*2+2,r*2+2);ctx.fillStyle=fill;ctx.fillRect(Math.round(x-r),Math.round(y-r),r*2,r*2);}
// Wave-six lurker: layered carapace over articulated, shaded tendrils.
// The endpoint expression matches the existing tip collision in update().
function drawLurkerArt(e){
  ctx.save();ctx.lineCap='round';ctx.lineJoin='round';
  for(let j=0;j<e.tent.length;j++){
    const tn=e.tent[j],sw=Math.sin(e.t*0.05+tn.ph);
    const ax=e.x+(j-1.5)*11,ay=e.y+12;
    const tx=e.x+sw*tn.len*1.2,ty=e.y+18+tn.len*1.6;
    let px=ax,py=ay;
    for(let i=1;i<=14;i++){
      const f=i/14,k=1-f;
      const x=k*k*ax+2*k*f*(ax+sw*22)+f*f*tx,y=k*k*ay+2*k*f*(ay+tn.len*0.9)+f*f*ty;
      const r=4.5-3*f;
      ctx.beginPath();ctx.moveTo(X(px),X(py));ctx.lineTo(X(x),X(y));ctx.strokeStyle='#130e20';ctx.lineWidth=X(r*2+2);ctx.stroke();
      ctx.strokeStyle=i%2?'#70445f':'#4b304d';ctx.lineWidth=X(r*2);ctx.stroke();
      ctx.beginPath();ctx.moveTo(X(px-0.8),X(py-0.5));ctx.lineTo(X(x-0.8),X(y-0.5));ctx.strokeStyle='#a78196';ctx.lineWidth=X(Math.max(0.6,r*0.45));ctx.stroke();
      px=x;py=y;
    }
    // Bright ivory hook marks the harmful tip, not a projectile.
    ctx.beginPath();ctx.moveTo(X(tx-3),X(ty-4));ctx.lineTo(X(tx),X(ty+3));ctx.lineTo(X(tx+3),X(ty-3));ctx.strokeStyle='#d1b4c8';ctx.lineWidth=X(1.5);ctx.stroke();
  }
  const breath=1+Math.sin(e.t*0.07)*0.018;
  ctx.imageSmoothingEnabled=true;
  ctx.drawImage(IMG.lurker_body,X(e.x-31*breath),X(e.y-26*breath),X(62*breath),X(52*breath));
  // Firing organ swells and brightens during the existing 25-tick charge.
  const charge=e.ct<25?1-e.ct/25:0,glow=0.28+charge*0.65;
  ctx.globalAlpha=glow;ctx.fillStyle='#fa459a';ctx.beginPath();ctx.ellipse(X(e.x),X(e.y+20),X(2.2+charge*1.2),X(3.2+charge),0,0,Math.PI*2);ctx.fill();
  if(charge>0){ctx.globalAlpha=charge;ctx.strokeStyle='#ff9ed0';ctx.lineWidth=X(0.7);ctx.beginPath();ctx.arc(X(e.x),X(e.y+20),X(6-charge*2),0,Math.PI*2);ctx.stroke();}
  ctx.restore();
}


function drawLurker(e){const cx=X(e.x),cy=X(e.y);
  // tentacles: chains of shrinking segments ending in a hook
  for(const tn of e.tent){let px=cx,py=cy+24;const sw=Math.sin(e.t*0.05+tn.ph);
    for(let i=0;i<8;i++){const f=i/8;px+=sw*tn.len*0.22*(1-f*0.3);py+=tn.len*0.3;const r=Math.max(2,6-i*0.6);seg(px,py,r,i%2?'#7a2c8a':'#a040b0','#3a0c48');}
    // hook
    ctx.fillStyle=C.s5;ctx.fillRect(Math.round(px-2),Math.round(py),4,10);ctx.fillRect(Math.round(px-2+sw*6),Math.round(py+8),Math.abs(Math.round(sw*6))+4,4);}
  // dome body with eye cluster
  ctx.fillStyle='#3a0c48';ctx.beginPath();ctx.ellipse(cx,cy,46,30,0,0,6.283);ctx.fill();
  ctx.fillStyle='#7a2c8a';ctx.beginPath();ctx.ellipse(cx,cy-3,40,24,0,0,6.283);ctx.fill();
  ctx.fillStyle='#c060d0';ctx.beginPath();ctx.ellipse(cx-8,cy-12,22,10,0,0,6.283);ctx.fill();
  for(let i=-1;i<=1;i++){seg(cx+i*16,cy+2,5,e.ct<25?C.magenta:'#101018','#e0e0ff');seg(cx+i*16,cy+2,2,C.white,C.white);}
  for(let i=0;i<7;i++){ctx.fillStyle='#3a0c48';ctx.fillRect(cx-42+i*14,cy+20,6,8);}}
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
function drawEngines(tier,sx,sy,frame=t){
  const fl=FLAME[frame%6<3?0:1];
  blit(fl,sx-11,sy+36,1+tier*0.1);blit(fl,sx+11,sy+36,1+tier*0.1);
  if(!tier)return;
  ctx.save();
  for(const side of [-1,1]){
    const x=X(sx+side*11),y=X(sy+22),w=5+tier;
    const metal=ctx.createLinearGradient(x-w,0,x+w,0);
    metal.addColorStop(0,'#233747');metal.addColorStop(0.4,'#b7cbd0');metal.addColorStop(1,'#405567');
    ctx.fillStyle=metal;ctx.fillRect(x-w,y,w*2,25+tier*2);
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
  const fr=Math.floor(frame/3)%8,sc=hit>0?1.15:1+Math.sin(frame*0.1)*0.03;
  ctx.save();ctx.globalAlpha=hit>0?1:0.75+(count>1?0.15:0);
  blit(SHF[fr],sx,sy,sc);
  if(count>1){ctx.globalAlpha=0.5;blit(SHF[(fr+4)%8],sx,sy,sc*0.85);}
  ctx.restore();
}
function drawEquipmentPreview(kind,tier,x,y){
  ctx.save();ctx.translate(X(x),X(y));ctx.scale(0.8,0.8);
  const base=IMG.player||SHIP;
  ctx.drawImage(base,-base.width/2,-base.height/2);
  drawEngines(kind==='engine'?tier:0,0,0,0);
  drawGunMounts(kind==='weapon'?tier:0,0,0,0);
  drawShieldLayers(kind==='shield'?tier:0,0,0,0,0);
  ctx.restore();
}
function drawShip(){if(mode==='title')return;if(ship.inv>0&&Math.floor(ship.inv/4)%2===0&&mode==='play')return;
  const bank=keys.l?-1:keys.r?1:(ptr.down?Math.max(-1,Math.min(1,(ptr.x-ptr.lx)*0.5)):0);
  const sq=1-Math.abs(bank)*0.22;const base=IMG.player||SHIP;const w=Math.round(base.width*sq);
  ctx.drawImage(base,X(ship.x)-Math.floor(w/2),X(ship.y)-Math.floor(base.height/2),w,base.height);
  drawEngines(save.engine,ship.x,ship.y);
  drawShieldLayers(shield,ship.x,ship.y);
  drawGunMounts();drawRocketPods();}

function drawField(){ctx.save();ctx.beginPath();ctx.rect(X(PX),0,X(PW),H);ctx.clip();
  if(WORLD_TILES[worldStage])drawWorld();else{
  ctx.fillStyle='#04030a';ctx.fillRect(X(PX),0,X(PW),H);
  if(IMG.px_nebula){const layer=(nm,sp,al)=>{const im=IMG[nm];if(!im)return;const y=Math.floor((scroll*sp)%im.height);if(al!==undefined)ctx.globalAlpha=al;ctx.drawImage(im,0,0,X(PW),im.height,X(PX),y-im.height,X(PW),im.height);ctx.drawImage(im,0,0,X(PW),im.height,X(PX),y,X(PW),im.height);ctx.globalAlpha=1;};
    layer('px_nebula',0.35);layer('px_haze1',0.55,0.7);layer('px_stars_far',0.8,0.6);layer('px_haze2',1.0,0.5);layer('px_stars_mid',1.4,0.75);layer('px_stars_near',2.0,0.9);}
  else{ctx.globalAlpha=0.85;const sy=Math.floor(scroll);ctx.drawImage(BG,X(PX),sy-TH);ctx.drawImage(BG,X(PX),sy);ctx.globalAlpha=1;}
  for(const st of STARS){const yy=(st.y+scroll*1.6)%H;ctx.fillStyle=st.c;ctx.fillRect(X(PX)+st.x,Math.floor(yy),st.s,st.s);}
  }
  for(const d of drops){const bob=Math.sin(t*0.15+d.y)*2,p=1+Math.sin(t*0.2+d.x)*0.08;
    if(d.k==='core'){if(!img('icon_core',d.x,d.y,0.7*p)){blit(CORE,d.x,d.y,1.4*p);}}
    else{const nm=d.k==='w'?'icon_w':d.k==='b'?'icon_b':'icon_s';if(!img(nm,d.x,d.y+bob,p)){const cap=d.k==='w'?CAP_W:d.k==='b'?CAP_B:CAP_S;blit(cap,d.x,d.y+bob,2);}txt(d.k.toUpperCase(),d.x+0.5,d.y+bob-7,C.s0,13,'center');txt(d.k.toUpperCase(),d.x,d.y+bob-8,C.white,13,'center');}}
  for(const e of enemies){
    if(e.k===0){if(!img('scout',e.x,e.y,1+Math.sin(e.t*0.15)*0.04)){const p=1.5+Math.sin(e.t*0.15)*0.12;blit(E1,e.x,e.y,p);}}
    else if(e.k===1){const wob=Math.sin(e.t*0.3);ctx.save();ctx.translate(X(e.x),X(e.y));ctx.rotate(wob*0.12);const b=IMG.bomber;if(b)ctx.drawImage(b,-b.width/2,-b.height/2);else ctx.drawImage(E2,-E2.width*0.75,-E2.height*0.75,E2.width*1.5,E2.height*1.5);ctx.restore();}
    else if(e.k===2){if(!img('frigate',e.x,e.y))blit(E3,e.x,e.y,1.5);if(e.ct<30&&Math.floor(e.ct/4)%2===0){ctx.fillStyle=C.magenta;ctx.fillRect(X(e.x)-9,X(e.y)+8,18,6);}}
    else if(e.k===3&&IMG.lurker_body){drawLurkerArt(e);}
    else if(e.k===4&&IMG.crawler_body){drawCrawlerArt(e);}
    else{const sc=K/1.5,cx=X(e.x),cy=X(e.y);ctx.save();ctx.translate(cx*(1-sc),cy*(1-sc));ctx.scale(sc,sc);if(e.k===3)drawLurker(e);else drawCrawler(e);ctx.restore();}
    if(e.flash>0){ctx.globalCompositeOperation='lighter';ctx.globalAlpha=0.5;ctx.fillStyle=C.white;ctx.fillRect(X(e.x)-X(R[e.k]),X(e.y)-X(R[e.k]),X(R[e.k]*2),X(R[e.k]*2));ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';}
  }
  drawBoss();
  for(const s of shots){ctx.save();ctx.translate(X(s.x),X(s.y));ctx.rotate(Math.atan2(s.vy,s.vx)+Math.PI/2);const b=s.rocket?ROCKET:BOLT[s.g];ctx.drawImage(b,-b.width/2,-12);ctx.restore();}
  for(const s of eshots){const nm=s.blue?'plasma_blue':'plasma_red';for(let k=1;k<=3;k++){if(!img(nm,s.x-s.vx*k*1.5,s.y-s.vy*k*1.5,1-k*0.2,0.35-k*0.1))blit(PLASMA[1],s.x-s.vx*k*1.5,s.y-s.vy*k*1.5,3-k*0.6);}ctx.globalAlpha=1;if(!img(nm,s.x,s.y,1+(t%8<4?0.1:0)))blit(PLASMA[t%8<4?0:1],s.x,s.y,3);}
  for(const b of booms){if(b.vx===undefined){const st=STRIP[b.kind||'exp_small'];const tot=b.kind==='hit'?8:24;const prog=(tot-b.life)/tot;if(!(st&&strip(b.kind,prog*st.n,b.x,b.y,b.kind==='exp_big'?1.1:b.kind==='exp_ring'?2.4:1.4))){const fr=Math.floor((24-b.life)/4);if(fr<6)blit(BOOMF[fr],b.x,b.y,b.sc);}}
    else{const f=b.life/24;ctx.fillStyle=f>0.6?C.white:f>0.35?C.yellow:f>0.15?C.orange:C.red;const sz=f>0.5?9:6;ctx.fillRect(X(b.x),X(b.y),sz,sz);}}
  for(const r of rings){ctx.globalAlpha=r.life/(r.big?46:30);ctx.strokeStyle=r.col;ctx.lineWidth=r.big?6:3;ctx.beginPath();ctx.arc(X(r.x),X(r.y),X(r.r),0,6.283);ctx.stroke();if(r.big){ctx.lineWidth=2;ctx.beginPath();ctx.arc(X(r.x),X(r.y),X(r.r*0.7),0,6.283);ctx.stroke();}}ctx.globalAlpha=1;
  for(const f of floats){ctx.globalAlpha=Math.min(1,f.life/20);txt(f.txt,f.x+1,f.y+1,C.s0,f.big?22:13,'center');txt(f.txt,f.x,f.y,f.col,f.big?22:13,'center');}ctx.globalAlpha=1;
  if(bombFx>0){ctx.globalAlpha=bombFx/40*0.6;ctx.fillStyle=C.G;ctx.fillRect(X(PX),0,X(PW),H);ctx.globalAlpha=1;}
  drawShip();ctx.restore();}
