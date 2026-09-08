'use strict';
// Battleship, Mech and Brood Mother: update, bombs, illustrated and fallback drawing, health bar.
// ================= BOSSES: BATTLESHIP / MECH / MOTHERSHIP =================
const CAMPAIGN_BOSSES=['BATTLESHIP','ASSAULT MECH','SEED MATRIARCH','TENDRIL WARDEN','BROOD MOTHER'];
const campaignBossKind=()=>Math.min(4,Math.max(0,Math.floor(level/5)-1));
function startBossWarning(){bossWarn=150;level++;eshots=[];SFX.siren(level>=15);addFloat(LW/2,150,'',C.red);}
function spawnBoss(){bossCount++;const kind=campaignBossKind(),mech=kind>=1&&kind<=3,mother=kind===4;
  // Each boss scales with its own appearance count (waves 5/20/35 -> 1/2/3), not with every boss fought so far:
  // the old bossCount formula made the second Battleship (532 HP) tougher than the second Mothership (480 HP).
  const nth=Math.floor((level-5)/15)+1;
  const baseHp=mother?Math.round(300*(1+level*0.02)):mech?Math.round(260*(1+level*0.02)):Math.round((140+nth*60)*(1+level*0.02)*(nth===1?0.9:1));
  const hpMax=Math.round((kind===2?340:kind===3?390:baseHp)*(1+campaignLoop*0.25));
  boss={kind,name:CAMPAIGN_BOSSES[kind],mech,mother,x:PX+PW/2,y:mother?-180:-120,ty:88,hp:hpMax,hpMax,t:0,phase:1,dir:1,fireT:90,volT:200,flash:0,
    turrets:mother?[{dx:-68,dy:76,hp:24,ct:90},{dx:68,dy:76,hp:24,ct:150}]:mech?[]:[{dx:-52,dy:26,hp:12,ct:60},{dx:52,dy:26,hp:12,ct:120},{dx:0,dy:58,hp:16,ct:180}]};
  SFX.bossTheme(true);}
function updateBoss(){
  if(bossWarn>0){bossWarn--;if(bossWarn===0)spawnBoss();return;}
  if(!boss)return;const b=boss;b.t++;if(b.flash>0)b.flash--;
  if(bossDying>0){bossDying--;
    if(bossDying%9===0){const ox=(Math.random()-0.5)*140,oy=(Math.random()-0.5)*110;booms.push({x:b.x+ox,y:b.y+oy,f:0,life:24,kind:Math.random()<0.5?'exp_big':'exp_small',sc:1});SFX.boom(true);shake=10;}
    b.y+=0.4;b.x+=Math.sin(b.t*0.3)*1.5;
    if(bossDying===0){booms.push({x:b.x,y:b.y,f:0,life:40,kind:'exp_boss',sc:1.4});booms.push({x:b.x,y:b.y+20,f:0,life:60,kind:'smoke',sc:2});flash=14;shake=26;slow=30;
      score+=2000+bossCount*500;addFloat(b.x,b.y-40,'+'+(2000+bossCount*500),C.G,true);pickupEvent(b.name+' DEFEATED',C.G);
      lastW=kills;drops.push({x:b.x-40,y:b.y,k:'w'});drops.push({x:b.x,y:b.y,k:'s'});drops.push({x:b.x+40,y:b.y,k:'b'});for(let i=0;i<6;i++)drops.push({x:b.x-60+i*24,y:b.y+30,k:'core'});
      boss=null;waveT=200;sectorPending=true;enemies=[];eshots=[];shots=[];resetRockets();SFX.bossTheme(false);}
    return;}
  // entry
  if(b.y<b.ty){b.y+=0.9;return;}
  if(b.kind===2||b.kind===3)updateCampaignBoss(b);else if(b.mother)updateMothership(b);else if(b.mech)updateMech(b);else{
  // sway
  b.x+=b.dir*(b.phase===2?0.9:0.55);if(b.x<PX+110){b.dir=1;}if(b.x>PX+PW-110){b.dir=-1;}
  // Give the first Battleship more dodge time between aimed shots.
  const turretSpeed=bossCount===1?2.2:2.6;
  // turrets: aimed plasma
  for(const tu of b.turrets){if(tu.hp<=0)continue;tu.ct--;if(tu.ct<=0){tu.ct=bossCount===1?(b.phase===2?85:130):(b.phase===2?70:110);const tx=b.x+tu.dx,ty=b.y+tu.dy;const a=Math.atan2(ship.y-ty,ship.x-tx);eshots.push({x:tx,y:ty,vx:Math.cos(a)*turretSpeed,vy:Math.sin(a)*turretSpeed});SFX.plasma();}}
  // bow volley: fan of plasma
  b.volT--;if(b.volT<=0){b.volT=b.phase===2?150:230;const n=b.phase===2?9:5;for(let i=0;i<n;i++){const a=Math.PI/2+(i-(n-1)/2)*0.22;eshots.push({x:b.x,y:b.y+70,vx:Math.cos(a)*2.2,vy:Math.sin(a)*2.2,blue:true});}SFX.plasma();}
  // phase 2 sweep: a line of shots that walks across
  if(b.phase===2&&b.t%16===0){const sx=PX+((b.t/16)*38)%PW;eshots.push({x:sx,y:b.y+40,vx:0,vy:3.2});}
  }
  // player collision with hull
  if(b.mother?((Math.abs(ship.x-b.x)<28&&Math.abs(ship.y-b.y)<130)||(Math.abs(ship.x-b.x)<86&&Math.abs(ship.y-b.y)<62)):(Math.abs(ship.x-b.x)<(b.mech?44:70)&&Math.abs(ship.y-b.y)<(b.mech?30:55))){hitShip();}
  // Carrier lower wings stay open so shots can reach the launch bays.
  // player shots vs turrets then hull
  for(const s of shots){if(s.y<-50)continue;let hit=false;
    for(const tu of b.turrets){if(tu.hp>0&&Math.abs(s.x-(b.x+tu.dx))<14&&Math.abs(s.y-(b.y+tu.dy))<14){tu.hp-=(s.dmg||1);hit=true;booms.push({x:s.x,y:s.y,f:0,life:8,kind:'hit',sc:1});if(tu.hp<=0){boom(b.x+tu.dx,b.y+tu.dy,false);awardKill(150,b.x+tu.dx,b.y+tu.dy);}break;}}
    if(!hit&&(b.mother?((Math.abs(s.x-b.x)<32&&Math.abs(s.y-b.y)<142)||(Math.abs(s.x-b.x)<96&&Math.abs(s.y-b.y)<62)):(Math.abs(s.x-b.x)<(b.mech?54:80)&&Math.abs(s.y-b.y)<(b.mech?36:60)))){b.hp-=(s.dmg||1);b.flash=3;hit=true;booms.push({x:s.x,y:s.y,f:0,life:8,kind:'hit',sc:1});SFX.hit();}
    if(hit)s.y=-99;}
  if(b.phase===1&&b.hp<b.hpMax*0.5){b.phase=2;pickupEvent(b.kind>=2?'BROOD FRENZY':b.mech?'MECH OVERDRIVE':'HULL BREACH',C.red);shake=10;flash=6;}
  if(b.hp<=0){bossDying=110;eshots=[];SFX.bossTheme(false);}
}
function updateMech(b){
  if(b.fireFlash>0)b.fireFlash--;
  b.fireT--;
  if(b.fireT>45){b.x+=b.dir*(b.phase===2?1.2:0.85);if(b.x<PX+80)b.dir=1;if(b.x>PX+PW-80)b.dir=-1;}
  // Lock aim before firing: moving out of the marked area is the counterplay.
  if(b.fireT===45){b.aimX=ship.x;b.aimY=Math.max(b.y+100,ship.y);}
  if(b.fireT<=0){
    for(const dx of [-40,40]){const x=b.x+dx,y=b.y+18,a=Math.atan2(b.aimY-y,b.aimX-x);
      for(let i=-1;i<=1;i++)eshots.push({x,y,vx:Math.cos(a+i*0.16)*2.6,vy:Math.sin(a+i*0.16)*2.6,blue:true});}
    b.fireFlash=12;b.fireT=b.phase===2?110:150;SFX.plasma();}
}
function updateMothership(b){
  b.x+=b.dir*0.3;if(b.x<PX+140)b.dir=1;if(b.x>PX+PW-140)b.dir=-1;
  // Each surviving bay launches independently; cap escorts to bound the pressure.
  for(const bay of b.turrets){if(bay.hp<=0)continue;bay.ct--;
    if(bay.ct<=0){bay.ct=b.phase===2?150:210;if(enemies.length<6){enemies.push({k:0,x:b.x+bay.dx,y:b.y+bay.dy+10,ph:0,hp:1,t:0});SFX.wave();}}}
  b.volT--;
  if(b.volT===45)b.gap=1+((b.salvo||0)%3)*2;
  if(b.volT<=0){const spacing=(PW-64)/7;
    for(let i=0;i<8;i++){if(i===b.gap||i===b.gap+1)continue;eshots.push({x:PX+32+i*spacing,y:b.y+135,vx:0,vy:b.phase===2?2.4:2,blue:true});}
    b.salvo=(b.salvo||0)+1;b.volT=b.phase===2?160:210;SFX.plasma();}
}
function bombBoss(){if(!boss||bossDying)return;boss.hp-=25;boss.flash=6;for(const tu of boss.turrets){const wasAlive=tu.hp>0;tu.hp-=8;if(wasAlive&&tu.hp<=0){boom(boss.x+tu.dx,boss.y+tu.dy,false);awardKill(150,boss.x+tu.dx,boss.y+tu.dy);}}}
const BATTLESHIP_MOUNT=(()=>{
  const o=document.createElement('canvas');o.width=o.height=X(28);const g=o.getContext('2d');g.scale(K,K);g.translate(14,14);
  const metal=g.createRadialGradient(-5,-6,1,0,0,15);metal.addColorStop(0,'#a6a89c');metal.addColorStop(0.5,'#58636a');metal.addColorStop(1,'#202a33');
  g.beginPath();for(let i=0;i<8;i++){const a=(i+0.5)*Math.PI/4;if(i===0)g.moveTo(Math.cos(a)*12,Math.sin(a)*12);else g.lineTo(Math.cos(a)*12,Math.sin(a)*12);}
  g.closePath();g.fillStyle=metal;g.fill();g.strokeStyle='#171f27';g.lineWidth=1.2;g.stroke();
  g.beginPath();g.arc(0,0,8.5,0,Math.PI*2);g.fillStyle='#263039';g.fill();g.strokeStyle='#788087';g.lineWidth=0.7;g.stroke();
  for(const x of [-7,7])for(const y of [-7,7]){g.fillStyle='#17212a';g.fillRect(x-1,y-1,2,2);g.fillStyle='#acaa9b';g.fillRect(x-1,y-1,1,0.5);}
  return o;
})();
function drawBattleshipHull(b){
  ctx.save();ctx.imageSmoothingEnabled=true;
  ctx.drawImage(IMG.battleship_hull,X(b.x-80),X(b.y-60),X(160),X(120));
  // Heat in the recessed reactor replaces the flat phase-two rectangle.
  ctx.globalAlpha*=b.phase===2?0.65+Math.sin(b.t*0.12)*0.2:0.35;
  ctx.fillStyle=b.phase===2?'#ed8059':'#89553e';
  for(let j=0;j<3;j++)ctx.fillRect(X(b.x-4),X(b.y-7+j*5),X(8),X(1.5));
  ctx.restore();
}
function drawBattleshipTurret(b,tu){
  const x=b.x+tu.dx,y=b.y+tu.dy;ctx.save();ctx.translate(X(x),X(y));
  ctx.drawImage(BATTLESHIP_MOUNT,X(-14),X(-14));
  if(tu.hp<=0){
    ctx.fillStyle='#080d12';ctx.beginPath();ctx.ellipse(0,0,X(8),X(7),0,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle='#73503b';ctx.lineWidth=X(1.5);ctx.beginPath();ctx.moveTo(X(-8),X(-6));ctx.lineTo(X(-3),X(-3));ctx.lineTo(X(-5),X(4));ctx.moveTo(X(8),X(6));ctx.lineTo(X(4),X(2));ctx.stroke();
  }else{
    ctx.rotate(Math.atan2(ship.y-y,ship.x-x)-Math.PI/2);
    ctx.fillStyle='#414e57';ctx.fillRect(X(-7),X(-9),X(14),X(12));
    ctx.fillStyle='#929a98';ctx.fillRect(X(-7),X(-9),X(14),X(0.7));
    ctx.fillStyle='#25313a';ctx.fillRect(X(5),X(-8),X(2),X(10));
    ctx.fillStyle='#202a32';ctx.fillRect(X(-4),X(-11),X(8),X(12));
    ctx.fillStyle='#849098';ctx.fillRect(X(-4),X(-11),X(1),X(10));ctx.fillRect(X(3),X(-11),X(1),X(10));
    // The emitter is centred on the existing projectile origin, not the barrel tip.
    const charge=!bossDying&&b.y>=b.ty&&tu.ct<25?1-tu.ct/25:0;
    ctx.fillStyle=charge>0?'#ef8ca7':'#793e50';ctx.fillRect(X(-3),X(-1),X(6),X(2));
    if(charge>0){ctx.globalAlpha=charge*0.65;ctx.fillStyle='#ffb8bd';ctx.beginPath();ctx.arc(0,0,X(3+charge*2),0,Math.PI*2);ctx.fill();}
  }
  ctx.restore();
}
function drawMechArt(b){
  ctx.save();ctx.translate(X(b.x),X(b.y));ctx.lineCap='round';ctx.lineJoin='round';
  const active=!bossDying&&b.y>=b.ty;
  const stride=active?Math.min(1,Math.max(0,(b.fireT-45)/12)):0;
  // Four cosmetic legs brace while the existing aim lock stops movement.
  for(const side of [-1,1])for(const row of [-1,1]){
    const gait=Math.sin(b.t*0.16+(side===row?0:Math.PI))*stride;
    const kneeY=row*22+gait*2,footY=row*31-gait*2;
    ctx.beginPath();ctx.moveTo(X(side*20),X(row*8));ctx.lineTo(X(side*44),X(kneeY));ctx.lineTo(X(side*50),X(footY));
    for(const [w,col] of [[9,'#141b22'],[6,'#667073'],[2,'#bab5a5']]){ctx.strokeStyle=col;ctx.lineWidth=X(w);ctx.stroke();}
    ctx.fillStyle='#252e35';ctx.beginPath();ctx.arc(X(side*44),X(kneeY),X(4),0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#a79a87';ctx.fillRect(X(side*44-1),X(kneeY-2),X(2),X(1));
    for(const toe of [-2,2]){ctx.beginPath();ctx.moveTo(X(side*50),X(footY));ctx.lineTo(X(side*(52+toe)),X(footY+row*3));ctx.lineWidth=X(2);ctx.strokeStyle='#8c8580';ctx.stroke();}
  }
  ctx.imageSmoothingEnabled=true;
  // The painted shoulder sockets align with the unchanged +/-40, +18 emitters.
  ctx.drawImage(IMG.mech_body,X(-50),X(-23),X(100),X(60));
  const fire=active?(b.fireFlash||0)/12:0;
  const charge=active&&b.fireT<=45&&b.aimX!==undefined?1-b.fireT/45:0;
  for(const dx of [-40,40]){
    ctx.save();ctx.translate(X(dx),X(18));
    if(b.aimX!==undefined)ctx.rotate(Math.atan2(b.aimY-(b.y+18),b.aimX-(b.x+dx))-Math.PI/2);
    const recoil=fire*2;
    ctx.fillStyle='#19242c';ctx.fillRect(X(-4),X(-11-recoil),X(8),X(12));
    ctx.fillStyle='#bbb7a8';ctx.fillRect(X(-4),X(-11-recoil),X(1.5),X(10));
    ctx.fillStyle='#63696a';ctx.fillRect(X(2.5),X(-11-recoil),X(1.5),X(10));
    ctx.fillStyle=charge>0||fire>0?'#f4ad67':'#713f38';ctx.fillRect(X(-3),X(-1),X(6),X(2));
    if(charge>0||fire>0){ctx.globalAlpha*=Math.max(charge*0.5,fire);ctx.fillStyle=fire>0?'#ffe1b5':'#ed8c57';ctx.beginPath();ctx.ellipse(0,0,X(2+fire*3),X(2+fire*6),0,0,Math.PI*2);ctx.fill();}
    ctx.restore();
  }
  if(b.phase===2){ctx.globalAlpha*=0.55+Math.sin(b.t*0.15)*0.2;ctx.fillStyle='#f2b05f';for(const dx of [-1.5,1.5])ctx.fillRect(X(dx-0.5),X(-7),X(1),X(4));}
  ctx.restore();
}
// Source regions separate the painted chambers from the spine without extra assets.
const MOTHER_ART={cut:960,spineX:355,spineW:350,bayX:110,bayY:960,bayW:235,bayH:248};
function drawMothershipArt(b){
  const art=IMG.mothership_body,a=MOTHER_ART,sx=200/art.width,sy=284/art.height;
  ctx.save();ctx.translate(X(b.x),X(b.y));ctx.imageSmoothingEnabled=true;ctx.lineCap='round';
  for(const bay of b.turrets){
    const side=bay.dx<0?-1:1;ctx.beginPath();ctx.moveTo(X(side*56),X(36));ctx.bezierCurveTo(X(side*62),X(50),X(bay.dx),X(52),X(bay.dx),X(bay.dy-13));
    for(const [w,col] of [[5,'#251523'],[3,'#714555'],[0.8,'#ad8580']]){ctx.lineWidth=X(w);ctx.strokeStyle=col;ctx.stroke();}
  }
  ctx.drawImage(art,0,0,art.width,a.cut,X(-100),X(-142),X(200),X(a.cut*sy));
  ctx.drawImage(art,a.spineX,a.cut,a.spineW,art.height-a.cut,X(-100+a.spineX*sx),X(-142+a.cut*sy),X(a.spineW*sx),X((art.height-a.cut)*sy));
  const charge=!bossDying&&b.y>=b.ty&&b.volT<=45?1-b.volT/45:0;
  if(charge>0||b.phase===2){
    ctx.globalAlpha*=charge>0?charge*0.55:0.16+Math.sin(b.t*0.1)*0.06;ctx.fillStyle=charge>0?'#ffc58a':'#e99a72';
    for(const y of [-45,10,65]){ctx.beginPath();ctx.ellipse(0,X(y),X(4),X(10),0,0,Math.PI*2);ctx.fill();}
  }
  ctx.restore();
}
function drawMothershipBay(b,bay){
  const art=IMG.mothership_body,a=MOTHER_ART;ctx.save();ctx.translate(X(b.x+bay.dx),X(b.y+bay.dy));ctx.imageSmoothingEnabled=true;
  if(bay.dx>0)ctx.scale(-1,1);
  if(bay.hp<=0){
    // Split shells and a ragged dark opening identify disabled chambers.
    ctx.save();ctx.rotate(-0.12);ctx.drawImage(art,a.bayX,a.bayY,117,a.bayH,X(-17),X(-15),X(14),X(30));ctx.restore();
    ctx.save();ctx.rotate(0.12);ctx.drawImage(art,a.bayX+117,a.bayY,a.bayW-117,a.bayH,X(3),X(-13),X(14),X(30));ctx.restore();
    ctx.beginPath();for(const [i,p] of [[-6,-9],[-1,-4],[4,-10],[7,-2],[3,4],[6,10],[-3,7],[-7,2]].entries()){if(i===0)ctx.moveTo(X(p[0]),X(p[1]));else ctx.lineTo(X(p[0]),X(p[1]));}
    ctx.closePath();ctx.fillStyle='#160f1b';ctx.fill();ctx.strokeStyle='#8a5368';ctx.lineWidth=X(1);ctx.stroke();
  }else{
    ctx.drawImage(art,a.bayX,a.bayY,a.bayW,a.bayH,X(-14),X(-15),X(28),X(30));
    const opening=!bossDying&&b.y>=b.ty&&bay.ct<=30?1-bay.ct/30:0;
    ctx.beginPath();ctx.ellipse(0,0,X(6+opening*3),X(7+opening*3),0,0,Math.PI*2);ctx.fillStyle='#211423';ctx.fill();ctx.strokeStyle='#a67778';ctx.lineWidth=X(1);ctx.stroke();
    if(opening>0){ctx.globalAlpha*=opening*0.8;ctx.fillStyle='#efa871';ctx.beginPath();ctx.ellipse(0,X(3),X(3+opening*2),X(4),0,0,Math.PI*2);ctx.fill();}
  }
  ctx.restore();
}
function drawBoss(){
  if(bossWarn>0){glassPanel(PX+40,12,PW-80,32,'#ee9871');txt('INCOMING / '+CAMPAIGN_BOSSES[campaignBossKind()],LW/2,20,'#ffd3ad',13,'center');}
  if(!boss)return;const b=boss;
  const illustrated=!b.mother&&!b.mech&&IMG.battleship_hull;
  const mechArt=b.kind===1&&IMG.mech_body;
  const motherArt=b.mother&&IMG.mothership_body;
  const im=b.mother?IMG.boss_mothership:b.mech?((b.fireFlash>0?IMG.boss_mech_fire:IMG.boss_mech)||IMG.boss_mech||IMG.boss_mech_fire):IMG.boss_battleship;if(b.kind===2||b.kind===3){drawCampaignBoss(b);}else if(motherArt){drawMothershipArt(b);}else if(mechArt){drawMechArt(b);}else if(illustrated){drawBattleshipHull(b);}else if(im){ctx.drawImage(im,X(b.x)-im.width/2,X(b.y)-im.height/2);}
  else if(b.mother){drawMothershipFallback(b);}
  else if(b.mech){drawMechFallback(b);}
  else{ctx.fillStyle='#a03030';ctx.fillRect(X(b.x)-140,X(b.y)-100,280,200);}
  for(const tu of b.turrets){if(motherArt){drawMothershipBay(b,tu);continue;}if(illustrated){drawBattleshipTurret(b,tu);continue;}if(b.mother){const x=b.x+tu.dx,y=b.y+tu.dy;bevel(x-12,y-10,24,20,true);ctx.fillStyle=tu.hp<=0?C.s0:(tu.ct<=30&&!bossDying?C.yellow:C.cyan);ctx.fillRect(X(x-8),X(y-6),X(16),X(12));continue;}if(tu.hp<=0){ctx.fillStyle='#201010';ctx.beginPath();ctx.arc(X(b.x+tu.dx),X(b.y+tu.dy),12,0,6.283);ctx.fill();continue;}
    const hot=tu.ct<25;ctx.fillStyle='#3a1418';ctx.beginPath();ctx.arc(X(b.x+tu.dx),X(b.y+tu.dy),16,0,6.283);ctx.fill();
    ctx.fillStyle=hot?C.magenta:'#c04050';ctx.beginPath();ctx.arc(X(b.x+tu.dx),X(b.y+tu.dy),10,0,6.283);ctx.fill();ctx.fillStyle=C.white;ctx.fillRect(X(b.x+tu.dx)-3,X(b.y+tu.dy)-3,6,6);}
  if(b.flash>0&&(motherArt||mechArt||illustrated||im)){ctx.globalCompositeOperation='lighter';ctx.globalAlpha=0.6;if(motherArt)drawMothershipArt(b);else if(mechArt)drawMechArt(b);else if(illustrated)drawBattleshipHull(b);else ctx.drawImage(im,X(b.x)-im.width/2,X(b.y)-im.height/2);ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';}
  if(!motherArt&&!mechArt&&!illustrated&&b.phase===2&&!bossDying&&t%30<15){ctx.globalAlpha=0.25;ctx.fillStyle=C.red;ctx.fillRect(X(b.x)-60,X(b.y)-40,120,80);ctx.globalAlpha=1;}
  // Telegraph existing attacks without changing their timers.
  if(!b.mother&&!b.mech&&!bossDying&&b.y>=b.ty){ctx.save();
    if(b.volT<=30){const r=5+b.volT/3;ctx.strokeStyle=C.cyan;ctx.lineWidth=X(1);ctx.beginPath();ctx.arc(X(b.x),X(b.y+70),X(r),0,Math.PI*2);ctx.stroke();}
    if(b.phase===2){const sx=PX+((Math.floor(b.t/16)+1)*38)%PW;const sy=b.y+40;ctx.fillStyle=C.yellow;ctx.beginPath();ctx.moveTo(X(sx-5),X(sy-12));ctx.lineTo(X(sx+5),X(sy-12));ctx.lineTo(X(sx),X(sy-5));ctx.closePath();ctx.fill();}
    ctx.restore();}
  if(b.kind===1&&!bossDying&&b.y>=b.ty&&b.fireT<=45&&b.aimX!==undefined){ctx.save();
    ctx.strokeStyle=C.yellow;ctx.lineWidth=X(1);ctx.setLineDash([X(3),X(4)]);ctx.beginPath();
    for(const dx of [-40,40]){ctx.moveTo(X(b.x+dx),X(b.y+18));ctx.lineTo(X(b.aimX),X(b.aimY));}ctx.stroke();ctx.setLineDash([]);
    ctx.strokeRect(X(b.aimX-10),X(b.aimY-10),X(20),X(20));ctx.restore();}
  if(b.mother&&!bossDying){txt(b.turrets.some(bay=>bay.hp>0)?'DESTROY SPORE SACS':'SPORE SACS RUPTURED',LW/2,30,C.cyan,11,'center');
    if(b.y>=b.ty&&b.volT<=45&&b.gap!==undefined){const spacing=(PW-64)/7;ctx.save();ctx.strokeStyle=C.cyan;ctx.lineWidth=X(2);
      ctx.strokeRect(X(PX+32+(b.gap-0.35)*spacing),X(b.y+139),X(spacing*1.7),X(12));txt('GAP',PX+32+(b.gap+0.5)*spacing,b.y+141,C.white,10,'center');ctx.restore();}}
  // health bar
  const bw=PW-40;glassPanel(PX+20,6,bw,20,'#b88364');const f=Math.max(0,Math.min(1,b.hp/b.hpMax));txt(b.name,PX+28,9,'#e6c6b0',9);ctx.fillStyle='#293642';ctx.fillRect(X(PX+145),X(12),X(bw-135),X(5));ctx.fillStyle=b.phase===2?'#ed7f86':'#eeb275';ctx.fillRect(X(PX+145),X(12),X((bw-135)*f),X(5));
}
function drawMechFallback(b){
  // Keep the Mech legible when both sprites fail to load.
  for(const dx of [-38,26]){bevel(b.x+dx,b.y+12,12,24,false);bevel(b.x+dx-3,b.y+30,18,8,true);}
  bevel(b.x-32,b.y-26,64,48,false);bevel(b.x-50,b.y-12,18,34,true);bevel(b.x+32,b.y-12,18,34,true);
  ctx.fillStyle=b.fireFlash>0?C.white:C.cyan;ctx.fillRect(X(b.x-12),X(b.y-12),X(24),X(6));
  for(const dx of [-43,37]){ctx.fillStyle=b.fireT<=45?C.yellow:C.dim;ctx.fillRect(X(b.x+dx),X(b.y+16),X(6),X(8));}
}
function drawMothershipFallback(b){
  bevel(b.x-28,b.y-142,56,284,false);bevel(b.x-96,b.y-92,32,208,false);bevel(b.x+64,b.y-92,32,208,false);
  for(const dy of [-54,16,76])bevel(b.x-80,b.y+dy,160,16,false);
  ctx.fillStyle=C.orange;ctx.fillRect(X(b.x-8),X(b.y-100),X(16),X(180));
}

function updateCampaignBoss(b){
  b.x=LW/2+Math.sin(b.t*0.012)*(b.kind===2?65:110);b.fireT--;
  if(b.fireT===45){b.aimX=ship.x;b.aimY=ship.y;}
  if(b.fireT<=0){
    if(b.kind===2){const a=Math.atan2(b.aimY-b.y,b.aimX-b.x);for(let j=-2;j<=2;j++)eshots.push({x:b.x,y:b.y+26,vx:Math.cos(a+j*0.25)*1.7,vy:Math.sin(a+j*0.25)*1.7,ground:true,bio:true});
      if(enemies.length<4)enemies.push({k:5,x:b.x,y:b.y+38,hp:Math.ceil(4*(1+campaignLoop*0.25)),t:0,ph:0});
    }else{const gap=(b.salvo||0)%3;for(let lane=0;lane<3;lane++){if(lane===gap)continue;for(let j=0;j<2;j++)eshots.push({x:PX+PW*(lane+0.35+j*0.3)/3,y:b.y+30,vx:0,vy:2,ground:true,bio:true});}b.salvo=(b.salvo||0)+1;}
    b.fireT=b.phase===2?130:180;SFX.plasma();
  }
}
function drawCampaignBoss(b){ctx.save();ctx.translate(X(b.x),X(b.y));
  if(b.kind===3){for(const side of [-1,1])for(let j=0;j<3;j++){ctx.strokeStyle='#70556d';ctx.lineWidth=X(5-j);ctx.beginPath();ctx.moveTo(X(side*25),X(j*8-12));ctx.quadraticCurveTo(X(side*(40+j*6)),X(5+Math.sin(b.t*0.06+j)*8),X(side*48),X(26-j*8));ctx.stroke();}}
  if(b.kind===3){ctx.fillStyle='#776477';ctx.beginPath();ctx.moveTo(X(-48),X(-9));ctx.lineTo(X(-25),X(-27));ctx.lineTo(0,X(-15));ctx.lineTo(X(25),X(-27));ctx.lineTo(X(48),X(-9));ctx.lineTo(X(18),X(27));ctx.lineTo(0,X(16));ctx.lineTo(X(-18),X(27));ctx.closePath();ctx.fill();ctx.fillStyle='#342535';ctx.fillRect(X(-14),X(-12),X(28),X(28));ctx.fillStyle=b.fireT<=45?'#ffcd86':'#b18484';ctx.beginPath();ctx.ellipse(0,X(3),X(8),X(13),0,0,Math.PI*2);ctx.fill();}
  else for(let j=-1;j<=1;j++){ctx.fillStyle='#706247';ctx.beginPath();ctx.ellipse(X(j*25),0,X(22),X(28),j*0.3,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#201724';ctx.lineWidth=X(2);ctx.stroke();ctx.fillStyle=b.fireT<=45?'#ffcd86':'#af7650';ctx.beginPath();ctx.ellipse(X(j*25),X(9),X(7),X(10),0,0,Math.PI*2);ctx.fill();}
  ctx.restore();if(b.fireT<=45&&!bossDying){const msg=b.kind===2?'SEED VOLLEY / KEEP MOVING':['LEFT LANE SAFE','CENTRE LANE SAFE','RIGHT LANE SAFE'][(b.salvo||0)%3];txt(msg,LW/2,36,'#edb985',10,'center');}
}
