'use strict';
// HUD panels, play scene, boot, title, pause, game over, sector complete and Workshop screens.
function drawPanels(){
  ctx.save();
  ctx.fillStyle='#09121d';ctx.fillRect(0,0,X(PX),H);ctx.fillRect(X(PX+PW),0,X(LW-PX-PW),H);
  ctx.fillStyle='#263f4e';ctx.fillRect(X(PX-1),0,X(1),H);ctx.fillRect(X(PX+PW),0,X(1),H);
  const label=(s,x,y,align)=>txt(s,x,y,'#91a7b5',9,align);
  const panel=(x,y,w,h)=>{ctx.fillStyle='#0e1c29';ctx.fillRect(X(x),X(y),X(w),X(h));ctx.fillStyle='#294251';ctx.fillRect(X(x),X(y),X(w),X(0.5));};
  const key=(s,x,y)=>{ctx.strokeStyle='#49616f';ctx.lineWidth=1;ctx.strokeRect(X(x),X(y),X(10),X(11));label(s,x+5,y+1,'center');};
  const box=(x,y,w,h,label,val,col)=>{panel(x,y,w,h);txt(label,x+8,y+6,'#91a7b5',9);if(val!==undefined)txt(val,x+8,y+21,col,15);};
  box(12,12,PX-24,44,'SCORE',String(score).padStart(6,'0'),C.yellow);
  box(12,64,PX-24,44,'BEST',String(Math.max(score,save.best)).padStart(6,'0'),C.text);
  box(12,116,PX-24,44,'LIVES');for(let i=0;i<lives;i++)ctx.drawImage(IMG.player_hull||IMG.player||SHIP,X(20+i*22),X(139),24,22);
  box(12,168,PX-24,44,'LEVEL',Math.max(1,Math.ceil(level/5))+'/5',C.text);txt(boss||bossWarn?'BOSS':'WAVE '+Math.max(1,level),20,203,boss||bossWarn?C.red:'#91a7b5',7);
  box(12,220,PX-24,56,'CHAIN','x'+chainMultiplier(),chainT>0?C.yellow:C.dim);
  ctx.fillStyle=C.s1;ctx.fillRect(X(20),X(264),X(PX-40),X(4));ctx.fillStyle=C.yellow;ctx.fillRect(X(20),X(264),X((PX-40)*chainT/CHAIN_TIME),X(4));
  box(12,284,PX-24,64,'HULL');
  const health=Math.max(0,Math.min(1,ship.hullDisplay/MAX_HULL));
  ctx.fillStyle='#243542';ctx.fillRect(X(20),X(307),X(PX-40),X(12));
  ctx.fillStyle='hsl('+Math.round(Math.max(0,(health-1/3)*180))+',65%,60%)';ctx.fillRect(X(20),X(307),X((PX-40)*health),X(12));
  ctx.fillStyle='rgba(255,255,255,0.18)';ctx.fillRect(X(20),X(307),X((PX-40)*health),X(2));
  const percent=Math.round(ship.hull/MAX_HULL*100);
  txt(ship.hull===0?'DESTROYED':percent+(ship.hull===1?'% CRITICAL':'% HEALTH'),PX/2,330,ship.hull===1?'#ed8474':'#91a7b5',7,'center');
  const rx=PX+PW+12,rw=LW-PX-PW-24;
  box(rx,12,rw,44,'GUN',GUN[wpn].n,C.cyan);for(let i=0;i<GUN.length;i++){ctx.fillStyle=i<=wpn?C.cyan:C.s1;ctx.fillRect(X(rx+rw-40+i*6),X(18),X(4),X(8));}
  box(rx,64,rw,44,'SHIELD');for(let i=0;i<2;i++){ctx.globalAlpha=i<shield?1:0.25;ctx.drawImage(SHF[Math.floor(t/4)%8],X(rx+8+i*30),X(80),X(18),X(18));ctx.globalAlpha=1;}
  txt(shield+' '+(shield===1?'hit left':'hits left'),rx+rw/2,99,shield?'#91cbd3':'#e5a08e',7,'center');
  box(rx,116,rw,44,'RUN CORES',String(cores),C.cyan);
  txt('Upgrades',rx+8,151,'#91a7b5',7);
  box(rx,168,rw,80,'BOMBS');if(!TOUCH)key('X',rx+rw-15,171);
  for(let i=0;i<6;i++){
    const bx=rx+16+(i%3)*22,by=197+Math.floor(i/3)*26;
    ctx.save();ctx.globalAlpha=i<bombs?1:0.2;
    ctx.fillStyle='#8a642e';ctx.fillRect(X(bx-6),X(by+3),X(12),X(6));
    ctx.fillStyle=i<bombs?'#e1b96c':'#70808a';ctx.beginPath();ctx.ellipse(X(bx),X(by),X(4.5),X(9),0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#fff0c1';ctx.fillRect(X(bx-2),X(by-5),X(1.5),X(8));
    ctx.fillStyle='#493a28';ctx.fillRect(X(bx-4),X(by+3),X(8),X(2));ctx.restore();
  }
  if(IMG.logo_icon)ctx.drawImage(IMG.logo_icon,X(rx+rw/2)-24,X(328),48,48);else label('640K GAMES',rx+rw/2,337,'center');
  for(let i=0;i<2;i++){const off=i?SFX.isMusicMuted():SFX.isMuted(),y=268+i*28;panel(rx,y,rw,24);txt((i?'MUSIC ':'SOUND ')+(off?'OFF':'ON'),rx+rw/2-(TOUCH?0:5),y+8,off?'#91a7b5':C.cyan,8,'center');if(!TOUCH)key(i?'N':'M',rx+rw-15,y+7);}if(TOUCH)label('TAP TO USE',rx+rw/2,254,'center');ctx.restore();}
function playScene(){const sx=shake?Math.round((Math.random()-0.5)*shake):0,sy=shake?Math.round((Math.random()-0.5)*shake):0;
  ctx.save();ctx.translate(sx,sy);drawField();ctx.restore();drawPanels();
  drawWorldNotice();
  if(flash>0){ctx.fillStyle='rgba(255,255,255,'+(flash/12)+')';ctx.fillRect(X(PX),0,X(PW),H);}
  if(evt>0&&mode==='play'&&!sectorPending){ctx.save();ctx.globalAlpha=Math.min(1,evt/12);glassPanel(PX+50,48,PW-100,25,evtCol);txt(evtText,LW/2,54,evtCol,12,'center');ctx.restore();}
  if(sectorPending&&!paused)drawVictorySweep();
  if(hint>0&&mode==='play'&&!paused){glassPanel(PX+32,LH-30,PW-64,23,'#55c5d8');txt(TOUCH?'DRAG TO MOVE / AUTO-FIRE':'ARROWS / WASD TO MOVE / AUTO-FIRE',LW/2,LH-24,'#d2e8ef',11,'center');}}
const BOOT_LINES=[[0,'Starting DOS...'],[30,''],[40,'HIMEM is testing extended memory...done.'],[80,'640K Sound System v1.0 installed. AdLib compatible.'],
  [110,''],[120,'C:\\>cd games\\spore'],[150,'C:\\GAMES\\SPORE>spore.exe'],[180,''],[185,'<logo>'],[195,'SPORE WARS  (c) 1991 '+BRAND],
  [200,'VGA detected. 256 colours. 590K conventional memory free.'],[230,'']];
function bootBeep(){for(const [n,s] of BOOT_LINES)if(t===n+1&&s)SFX.boot();}
function bootScreen(){ctx.fillStyle=C.black;ctx.fillRect(0,0,W,H);const L=BOOT_LINES.filter(([n])=>t>n).map(([,s])=>[s,DOS.grey]);
  L.forEach((l,i)=>{if(l[0]!=='<logo>')txt(l[0],16,16+i*20,l[1],16);else if(IMG.logo_prompt)ctx.drawImage(IMG.logo_prompt,X(16)-16,X(16+i*20)-12,388,60);else txt('C:\\>'+BRAND+'_',16,16+i*20,l[1],16);});
  if(t<=230&&Math.floor(blink/16)%2===0){ctx.fillStyle=DOS.grey;ctx.fillRect(X(16),X(16+L.length*20),X(10),X(16));}
  if(t>250){if(assetsReady||assetsFailed)txt('Press any key or tap to continue . . .',16,16+L.length*20+8,DOS.white,16);else txt('Loading graphics'+'.'.repeat(Math.floor(t/15)%4),16,16+L.length*20+8,DOS.white,16);}}
let titleSel=0,paused=false,exitConfirm=false,exitChoice=0,exitWait=0,pauseSel=0,sectorSel=0,deadSel=0,shopItem=0;
function setPaused(on){pauseSel=0;paused=on;exitConfirm=false;exitChoice=0;tapped=false;ptr.down=false;for(const k in keys)keys[k]=false;}
function pauseTap(p){
  if(exitConfirm&&exitWait>0)return;
  const y=exitConfirm?190:174;
  if(p.x<LW/2-130||p.x>LW/2+130)return;
  if(p.y>=y&&p.y<=y+30)setPaused(false);
  else if(p.y>=y+44&&p.y<=y+74){if(exitConfirm)quitRun();else{exitConfirm=true;exitChoice=0;exitWait=15;}}
}
const TITLE_BUTTONS=[{x:40,y:178,w:230,h:38},{x:40,y:224,w:230,h:32},{x:40,y:262,w:300,h:24},{x:40,y:290,w:300,h:24}]; // audio rows end at x=340 so they clear the hangar art
function titleAudioAction(i,x){const k=i===2?'sound':'music';
  if(x===undefined||x<164){if(i===2)SFX.toggleMute();else SFX.toggleMusic();}
  else if(x<188){SFX.setVolume(k,SFX.getVolume(k)-0.1);SFX.preview(k);}
  else if(x<260){SFX.setVolume(k,(x-188)/72);SFX.preview(k);}
  else if(x<282){SFX.setVolume(k,SFX.getVolume(k)+0.1);SFX.preview(k);}
  else SFX.preview(k);
}
// Translucent surfaces keep the scene visible; text remains fully opaque.
function glassPanel(x,y,w,h,accent){
  ctx.save();ctx.fillStyle='rgba(5,12,22,0.48)';ctx.fillRect(X(x),X(y),X(w),X(h));
  ctx.strokeStyle=accent||'#435765';ctx.lineWidth=X(0.5);ctx.strokeRect(X(x)+0.5,X(y)+0.5,X(w)-1,X(h)-1);
  ctx.fillStyle=accent||'#597481';ctx.fillRect(X(x+12),X(y),X(Math.min(28,w-24)),X(1));ctx.restore();
}
function titleScreen(){
  ctx.fillStyle='#050a12';ctx.fillRect(0,0,W,H);
  if(IMG.menu_hangar){ctx.save();ctx.imageSmoothingEnabled=true;ctx.drawImage(IMG.menu_hangar,0,0,W,H);ctx.restore();}
  else{
    // A complete title remains usable when the illustration is unavailable.
    for(const st of STARS){ctx.fillStyle=st.c;ctx.fillRect(st.x,(st.y+scroll*0.3)%H,st.s,st.s);}
    ctx.strokeStyle='#263b4c';ctx.lineWidth=X(3);ctx.strokeRect(X(355),X(42),X(230),X(265));
    const b=IMG.player_hull||IMG.player||SHIP;ctx.drawImage(b,X(470)-b.width,X(190)-b.height,b.width*2,b.height*2);
  }
  const shade=ctx.createLinearGradient(0,0,X(360),0);shade.addColorStop(0,'rgba(3,8,16,0.45)');shade.addColorStop(1,'rgba(3,8,16,0)');
  ctx.fillStyle=shade;ctx.fillRect(0,0,X(360),H);
  if(IMG.logo_prompt)ctx.drawImage(IMG.logo_prompt,X(40)-16,X(18),388,60);else txt(BRAND,40,25,'#94acb9',11);
  ctx.fillStyle='#39c7df';ctx.fillRect(X(40),X(49),X(28),X(2));
  txt('SPORE',42,66,'#102331',48);txt('SPORE',40,64,'#dbe8eb',48);
  txt('WARS',42,112,'#102331',48);txt('WARS',40,110,'#dbe8eb',48);
  txt('Beyond the last machine.',42,159,'#8faebc',11);
  const labels=['LAUNCH','WORKSHOP',SFX.isMuted()?'SOUND: OFF':'SOUND: ON',SFX.isMusicMuted()?'MUSIC: OFF':'MUSIC: ON'];
  TITLE_BUTTONS.forEach((b,i)=>{const hot=titleSel===i;
    glassPanel(b.x,b.y,b.w,b.h,hot?'#56dcf1':'#3d5364');
    if(hot){ctx.fillStyle='rgba(39,160,190,0.12)';ctx.fillRect(X(b.x+2),X(b.y+1),X(b.w-3),X(b.h-2));}
    txt(labels[i],b.x+20,b.y+(i===0?10:i>1?5:8),hot?'#a3f2ff':'#adc0cd',i===0?19:13);
    if(hot)txt('>',b.x+7,b.y+(i===0?12:i>1?5:8),'#56dcf1',13);
    if(i>1){const k=i===2?'sound':'music',v=SFX.getVolume(k);txt('-',174,b.y+6,'#a3f2ff',13,'center');txt('+',270,b.y+6,'#a3f2ff',13,'center');
      ctx.fillStyle='#223543';ctx.fillRect(X(188),X(b.y+6),X(72),X(12));ctx.fillStyle='#426f7b';ctx.fillRect(X(188),X(b.y+6),X(72*v),X(12));txt(Math.round(v*100)+'%',224,b.y+8,'#eefbff',8,'center');txt('TEST',312,b.y+7,'#a3f2ff',9,'center');
    }
    if(!TOUCH&&i<2)txt(i===0?'ENTER':i===1?'Q':i===2?'M':'N',b.x+b.w-10,b.y+(i>1?7:12),'#7e9aa9',9,'right');
  });
  txt(titleSel>=2?(TOUCH?'Tap level to adjust / TEST to listen':'LEFT / RIGHT volume   ENTER on/off   V test'):(TOUCH?'Drag to move / tap BOMB to clear fire':'ARROWS / WASD move   X bomb   P pause'),40,319,'#93a9b8',9);
  txt('Art: Skorpio / Daniel Cook / chabull / LuminousDragonGames',40,336,'#788a98',7);
  txt('Music: MintoDog / Illustrated by 640k games.',40,348,'#788a98',7);
}

// These rectangles match the existing keyboard and touch option bounds.
function menuChoice(label,x,y,w,h,selected,size=12){
  ctx.save();ctx.fillStyle=selected?'rgba(31,109,128,0.45)':'rgba(8,19,29,0.3)';ctx.fillRect(X(x),X(y),X(w),X(h));
  if(selected){ctx.strokeStyle='#85deeb';ctx.lineWidth=1;ctx.strokeRect(X(x)+0.5,X(y)+0.5,X(w)-1,X(h)-1);ctx.fillStyle='#85deeb';ctx.fillRect(X(x),X(y+6),X(2),X(h-12));}
  txt(label,x+w/2,y+(h-7*Math.max(2,Math.round(size*K/10))/K)/2,selected?'#eefbff':'#a4b8c6',size,'center');ctx.restore();
}
function deadOptions(){return usedContinue?['RETRY','WORKSHOP','MAIN MENU']:['RETRY','CONTINUE','WORKSHOP','MAIN MENU'];}
function chooseDead(i){const action=deadOptions()[i];if(action==='RETRY'){newRun();mode='play';t=0;}else if(action==='CONTINUE')continueRun();else if(action==='WORKSHOP'){shopFromSector=false;mode='shop';}else if(action==='MAIN MENU'){clearScene();mode='title';t=0;}}
function deadScreen(){playScene();glassPanel(PX+24,80,PW-48,210,'#b86a72');
  if(score>=save.best&&score>0)txt('NEW BEST!',PX+PW-32,85,C.yellow,9,'right');
  txt('FLEET LOST',LW/2,96,C.red,28,'center');txt('score '+score+' / wave '+level,LW/2,132,C.white,14,'center');
  txt(cores+' run cores saved / '+save.cores+' available',LW/2,153,C.cyan,11,'center');
  deadOptions().forEach((label,i)=>menuChoice(label,LW/2-130,176+i*23,260,22,deadSel===i,12));
  txt(TOUCH?'Tap an option':'UP/DOWN choose / ENTER select',LW/2,274,'#a4b8c6',9,'center');}

function pauseScreen(){
  glassPanel(PX+40,90,PW-80,190,'#55c5d8');
  txt(exitConfirm?'RETURN TO MAIN MENU?':'PAUSED',LW/2,108,'#d2e8ef',exitConfirm?20:28,'center');
  if(exitConfirm){txt('Your cores will be saved.',LW/2,145,'#a4b8c6',12,'center');txt('This run will end.',LW/2,163,'#a4b8c6',12,'center');}
  else txt('Shields absorb hits. Empty hull costs a life.',LW/2,145,'#a4b8c6',10,'center');
  const y=exitConfirm?190:174,labels=exitConfirm?['KEEP PLAYING','RETURN TO MAIN MENU']:['RESUME','MAIN MENU'];
  labels.forEach((label,i)=>{const hot=exitConfirm?exitChoice===i:pauseSel===i;
    menuChoice(label,LW/2-130,y+i*44,260,30,hot);});
  if(!TOUCH)txt(exitConfirm?'UP/DOWN choose / ENTER select / ESC resume':'UP/DOWN choose / ENTER select / ESC resume',LW/2,264,'#a4b8c6',9,'center');
}
const SHOP_GRID={x:304,y:60,size:70,gap:6,cols:SHOP_COLUMNS};
function shopTileBounds(i){const col=i%SHOP_GRID.cols,row=Math.floor(i/SHOP_GRID.cols);return{x:SHOP_GRID.x+col*(SHOP_GRID.size+SHOP_GRID.gap),y:SHOP_GRID.y+row*(SHOP_GRID.size+SHOP_GRID.gap),w:SHOP_GRID.size,h:SHOP_GRID.size};}
function shopHitTest(x,y){for(let i=0;i<SHOP.length;i++){const b=shopTileBounds(i);if(x>=b.x&&x<=b.x+b.w&&y>=b.y&&y<=b.y+b.h)return i;}return-1;}
// Presentation follows the existing 200-tick reward sweep; it never awards cores.
function drawVictorySweep(){
  const age=200-waveT,fade=Math.min(1,age/24,Math.max(0,waveT/24));
  ctx.save();ctx.globalAlpha=fade;
  const y=92+Math.max(0,1-age/30)*10;
  glassPanel(PX+44,y-12,PW-88,76,'#d6b36c');
  txt('LEVEL '+Math.floor(level/5)+' COMPLETE',LW/2,y,'#f0d59c',24,'center');
  txt('Salvage secured. Take a breath.',LW/2,y+29,'#c3d3d9',10,'center');
  const w=PW-128;ctx.fillStyle='#283842';ctx.fillRect(X(PX+64),X(y+48),X(w),X(2));
  ctx.fillStyle='#d6b36c';ctx.fillRect(X(PX+64),X(y+48),X(w*Math.min(1,age/200)),X(2));
  ctx.restore();
}
function completeSector(){
  if(!sectorPending)return;
  resetGround(); // wrecks too: travel resets worldScroll to 0, which would strand anchored wrecks far above the screen
  sectorBanked=cores-bankedCores;save.cores+=sectorBanked;bankedCores=cores;
  if(score>save.best)save.best=score;persist();sectorPending=false;mode=level>=CAMPAIGN_WAVES?'victory':'sector';sectorSel=0;t=0;setPaused(false);shots=[];eshots=[];resetRockets();
}
let travelOrigin={x:0,y:0};
function nextSector(){
  if(mode!=='sector'||level>=CAMPAIGN_WAVES)return;
  travelOrigin={x:ship.x,y:ship.y};shopFromSector=false;mode='travel';t=0;setPaused(false);
  shots=[];eshots=[];booms=[];floats=[];rings=[];evt=0;flash=0;shake=0;slow=0;muzz=0;
}
function updateSectorTravel(){
  worldScroll+=t<60?5:2;
  if(t<60){const p=t/60;ship.x=travelOrigin.x+(LW/2-travelOrigin.x)*p;ship.y=travelOrigin.y-(travelOrigin.y+90)*p*p;}
  else if(t===60){worldStage=worldFrom=worldForWave(level+1);worldFade=0;worldNotice=0;worldScroll=0;ship.x=LW/2;ship.y=LH+80;}
  else if(t>=90){const p=Math.min(1,(t-90)/60);ship.y=LH+80-140*(1-(1-p)*(1-p));}
  if(t>=180){mode='play';t=0;waveT=0;tapped=false;ptr.down=false;for(const k in keys)keys[k]=false;}
}
function sectorTravelScreen(){
  playScene();
  const curtain=t<60?Math.max(0,(t-30)/30):Math.max(0,1-(t-60)/30);
  ctx.fillStyle='rgba(5,10,18,'+curtain+')';ctx.fillRect(X(PX),0,X(PW),H);
  if(t>=72){const world=WORLDS[worldForWave(level+1)],fade=Math.min(1,(t-72)/24,(180-t)/24);
    ctx.save();ctx.globalAlpha=fade;glassPanel(PX+20,83,PW-40,101,world.accent);
    txt('LEVEL '+(Math.floor(level/5)+1),LW/2,97,world.accent,12,'center');
    txt(world.name,LW/2,121,'#e2edf0',22,'center');
    txt(world.detail,LW/2,157,world.accent,10,'center');ctx.restore();}
}
function leaveShop(){if(shopFromSector){mode='sector';t=60;tapped=false;}else{clearScene();mode='title';t=0;}}
function chooseSector(i){
  if(mode==='victory'){if(i===0){newRun(campaignLoop+1);mode='play';t=0;setPaused(false);}else{clearScene();mode='title';t=0;}tapped=false;ptr.down=false;return;}
  if(i===0){shopFromSector=true;mode='shop';t=0;}else nextSector();
}
function sectorScreen(){
  const won=mode==='victory';
  playScene();ctx.save();const reveal=Math.min(1,t/30);ctx.globalAlpha=reveal;
  ctx.fillStyle='rgba(5,10,18,0.66)';ctx.fillRect(X(PX),0,X(PW),H);
  glassPanel(PX+14,24,PW-28,310,'#d6b36c');
  txt(won?'THE BROOD HAS FALLEN':'SECTOR SECURED',LW/2,42,'#d6b36c',11,'center');
  txt(won?'CAMPAIGN COMPLETE':'LEVEL '+Math.floor(level/5)+' COMPLETE',LW/2,65,'#f0d59c',26,'center');
  txt(won?'Five worlds cleared. The colony is safe.':'Take a breath. The next world can wait.',LW/2,105,'#a4b8c6',10,'center');
  txt('+'+Math.floor(sectorBanked*Math.min(1,t/60))+' cores banked',LW/2,133,C.cyan,14,'center');
  txt(save.cores+' cores available for upgrades',LW/2,154,'#a4b8c6',12,'center');
  ctx.globalAlpha=reveal*(t<60?0.35:1);
  for(const [i,label] of (won?['HARDER REPLAY','MAIN MENU']:['UPGRADE / WORKSHOP','PROCEED']).entries()){
    menuChoice(label,LW/2-130,184+i*44,260,32,i===sectorSel,13);}
  ctx.globalAlpha=reveal;
  txt(won?'FINAL SCORE: '+score:'NEXT: '+WORLDS[worldForWave(level+1)].name,LW/2,277,'#d6b36c',10,'center');
  if(t<60)txt(TOUCH?'Tap to finish tally':'ENTER to finish tally',LW/2,307,'#a4b8c6',9,'center');
  else txt(TOUCH?'Choose when you are ready':won?'UP/DOWN choose / ENTER select':'UP/DOWN choose / ENTER select / Q Workshop',LW/2,307,'#a4b8c6',9,'center');
  ctx.restore();
}

function shopScreen(){
  ctx.fillStyle='#050a12';ctx.fillRect(0,0,W,H);
  if(IMG.trader_shop){ctx.save();ctx.imageSmoothingEnabled=true;const breath=1.003+Math.sin(t/70)*0.002;ctx.translate(X(145),X(140));ctx.scale(breath,breath);ctx.drawImage(IMG.trader_shop,-X(145),-X(140),W,H);ctx.restore();}
  else{
    // A complete counter and merchant remain when the illustration is unavailable.
    ctx.fillStyle='#352b35';ctx.fillRect(X(48),X(178),X(178),X(115));ctx.fillStyle='#777952';
    ctx.beginPath();ctx.ellipse(X(136),X(148),X(49),X(58),0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#111b23';ctx.fillRect(X(104),X(135),X(22),X(8));ctx.fillRect(X(148),X(130),X(22),X(8));ctx.fillRect(X(116),X(170),X(47),X(5));
    ctx.fillStyle='#29333c';ctx.fillRect(X(20),X(265),X(250),X(34));
  }
  const small=(text,x,y,col,size=9,align='left')=>txt(text,x,y,col,size,align);
  const surface=(x,y,w,h,hot)=>{ctx.fillStyle='rgba(7,16,25,0.88)';ctx.fillRect(X(x),X(y),X(w),X(h));ctx.strokeStyle=hot?'#b4e7ee':'#41505a';ctx.lineWidth=hot?2:1;ctx.strokeRect(X(x),X(y),X(w),X(h));};
  small('SALVAGE EXCHANGE',24,22,'#e5d4b7',15);small('WEAPONS / SYSTEMS / PARTS',24,43,'#93a4ae',8);
  small('AVAILABLE',614,20,'#91a4af',8,'right');txt(save.cores+' cores',614,34,'#b5f1f4',14,'right');
  small('EQUIPMENT WALL / 4 x 2',304,50,'#a7b6c0',8);
  SHOP.forEach((it,i)=>{const b=shopTileBounds(i),lvl=equipmentOwned(it),maxed=lvl>=it.maxOwned&&!it.locked,cost=equipmentCost(it,lvl),hot=shopSel===i,can=cost!==null&&save.cores>=cost;
    surface(b.x,b.y,b.w,b.h,hot);
    if(hot){small('>',b.x+4,b.y+4,'#e8ffff',8);ctx.strokeStyle='#e8ffff';ctx.strokeRect(X(b.x+3),X(b.y+3),X(b.w-6),X(b.h-6));}
    const previewTier=it.locked?0:Math.min(it.maxOwned,lvl+1),state=it.locked?'[LOCKED]':maxed?'[EQUIPPED]':can?'[READY]':'[NEED]';
    drawEquipmentPreview(it.id,previewTier,b.x+b.w/2,b.y+31,0.25);
    small(it.label,b.x+b.w/2,b.y+48,hot?'#f0fbfc':'#c2ced3',7,'center');
    small(state,b.x+b.w/2,b.y+60,it.locked||maxed?'#8fa2ac':can?'#a8e4cf':'#d4ad91',6,'center');
  });
  if(shopSel<SHOP.length)shopItem=shopSel;
  const it=SHOP[shopItem],lvl=equipmentOwned(it),maxed=lvl>=it.maxOwned&&!it.locked,cost=equipmentCost(it,lvl),can=cost!==null&&save.cores>=cost,candidate=it.locked?0:Math.min(it.maxOwned,lvl+1);
  surface(292,214,322,72,false);drawEquipmentPreview(it.id,candidate,338,251,0.43);
  small(it.name,380,221,'#e4e9e9',11);small(it.locked?'RESERVED':'OWNED '+lvl+' / '+it.maxOwned,602,222,'#a6b7c0',7,'right');
  small(it.effect(candidate),380,241,'#bdcbd2',8);small(it.note,380,258,it.locked?'#b39aaa':'#9cb7b8',7);
  small(it.locked?'Preview leaves the loadout unchanged.':maxed?'Installed / preview and combat match.':can?'Permanent equipment / ready to buy.':'Collect '+(cost-save.cores)+' more cores.',380,273,can?'#9cb7b8':'#d4ad91',7);
  surface(292,298,208,32,shopSel<SHOP.length&&!it.locked);small(it.locked?'NOT FOR SALE':maxed?'FULLY EQUIPPED':can?'BUY / '+cost+' CORES':'NEED '+(cost-save.cores)+' MORE CORES',396,310,maxed||!can?'#8fa2ac':'#d9f1ee',9,'center');
  surface(510,298,104,32,shopSel===SHOP.length);small(shopFromSector?'CONTINUE':'BACK',562,310,'#d9e1e4',9,'center');
  small('"Quality parts. Mostly legal."',146,318,'#ddc8ac',9,'center');
  if(!TOUCH)small('ARROWS grid / DOWN back / ENTER buy',453,344,'#8b9fae',8,'center');
}

function buy(){const it=SHOP[shopSel];if(!it||it.locked)return;const lvl=equipmentOwned(it),cost=equipmentCost(it,lvl);if(cost===null)return;if(save.cores<cost){flash=4;SFX.hit();return;}save.cores-=cost;save[it.saveKey]=lvl+1;if(it.id==='support'){orbActive=true;resetOrb();}if(it.id==='ordnance')resetRockets();persist();SFX.power();}
