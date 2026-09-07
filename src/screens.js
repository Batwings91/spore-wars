'use strict';
// HUD panels, play scene, boot, title, pause, game over, sector complete and Workshop screens.
function drawPanels(){
  ctx.save();
  ctx.fillStyle='#09121d';ctx.fillRect(0,0,X(PX),H);ctx.fillRect(X(PX+PW),0,X(LW-PX-PW),H);
  ctx.fillStyle='#263f4e';ctx.fillRect(X(PX-1),0,X(1),H);ctx.fillRect(X(PX+PW),0,X(1),H);
  const label=(s,x,y,align)=>{ctx.font=Math.round(9*K)+'px monospace';ctx.fillStyle='#91a7b5';ctx.textAlign=align||'left';ctx.textBaseline='top';ctx.fillText(s,X(x),X(y));};
  const panel=(x,y,w,h)=>{ctx.fillStyle='#0e1c29';ctx.fillRect(X(x),X(y),X(w),X(h));ctx.fillStyle='#294251';ctx.fillRect(X(x),X(y),X(w),X(0.5));};
  const key=(s,x,y)=>{ctx.strokeStyle='#49616f';ctx.lineWidth=1;ctx.strokeRect(X(x),X(y),X(10),X(11));label(s,x+5,y+1,'center');};
  const box=(x,y,w,h,label,val,col)=>{panel(x,y,w,h);ctx.font=Math.round(9*K)+'px monospace';ctx.fillStyle='#91a7b5';ctx.textAlign='left';ctx.textBaseline='top';ctx.fillText(label,X(x+8),X(y+6));if(val!==undefined)txt(val,x+8,y+21,col,15);};
  box(12,12,PX-24,44,'SCORE',String(score).padStart(6,'0'),C.yellow);
  box(12,64,PX-24,44,'BEST',String(Math.max(score,save.best)).padStart(6,'0'),C.text);
  box(12,116,PX-24,44,'LIVES');for(let i=0;i<lives;i++)ctx.drawImage(IMG.player||SHIP,X(20+i*22),X(139),24,22);
  box(12,168,PX-24,44,'WAVE',boss||bossWarn?'BOSS':String(level),boss||bossWarn?C.red:C.text);
  box(12,220,PX-24,56,'CHAIN','x'+chainMultiplier(),chainT>0?C.yellow:C.dim);
  ctx.fillStyle=C.s1;ctx.fillRect(X(20),X(264),X(PX-40),X(4));ctx.fillStyle=C.yellow;ctx.fillRect(X(20),X(264),X((PX-40)*chainT/CHAIN_TIME),X(4));
  box(12,284,PX-24,64,'HULL');
  for(let i=0;i<MAX_HULL;i++){ctx.fillStyle=i<ship.hull?(ship.hull===1?'#ed8474':'#78d7b0'):'#243542';ctx.fillRect(X(20+i*22),X(307),X(16),X(12));}
  ctx.font=X(7)+'px monospace';ctx.fillStyle=ship.hull===1?'#ed8474':'#91a7b5';ctx.textAlign='center';ctx.fillText(ship.hull===0?'DESTROYED':ship.hull===1?'CRITICAL':'SHIP HEALTH',X(PX/2),X(330));
  const rx=PX+PW+12,rw=LW-PX-PW-24;
  box(rx,12,rw,44,'GUN',GUN[wpn].n,C.cyan);for(let i=0;i<5;i++){ctx.fillStyle=i<=wpn?C.cyan:C.s1;ctx.fillRect(X(rx+rw-34+i*6),X(18),X(4),X(8));}
  box(rx,64,rw,44,'SHIELD');for(let i=0;i<2;i++){ctx.globalAlpha=i<shield?1:0.25;ctx.drawImage(SHF[Math.floor(t/4)%8],X(rx+8+i*30),X(80),X(18),X(18));ctx.globalAlpha=1;}
  ctx.font=X(7)+'px monospace';ctx.fillStyle=shield?'#91cbd3':'#e5a08e';ctx.textAlign='center';ctx.fillText(shield+' '+(shield===1?'hit protected':'hits protected'),X(rx+rw/2),X(99));
  box(rx,116,rw,44,'RUN CORES',String(cores),C.cyan);
  ctx.font=Math.round(7*K)+'px monospace';ctx.fillStyle='#91a7b5';ctx.fillText('For upgrades',X(rx+8),X(151));
  box(rx,168,rw,80,'BOMBS');if(!TOUCH)key('X',rx+rw-15,171);
  for(let i=0;i<6;i++){
    const bx=rx+16+(i%3)*22,by=197+Math.floor(i/3)*26;
    ctx.save();ctx.globalAlpha=i<bombs?1:0.2;
    ctx.fillStyle='#8a642e';ctx.fillRect(X(bx-6),X(by+3),X(12),X(6));
    ctx.fillStyle=i<bombs?'#e1b96c':'#70808a';ctx.beginPath();ctx.ellipse(X(bx),X(by),X(4.5),X(9),0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#fff0c1';ctx.fillRect(X(bx-2),X(by-5),X(1.5),X(8));
    ctx.fillStyle='#493a28';ctx.fillRect(X(bx-4),X(by+3),X(8),X(2));ctx.restore();
  }
  if(IMG.logo_icon)ctx.drawImage(IMG.logo_icon,X(rx+rw/2)-32,X(LH-46),64,64);else label('640K GAMES',rx+rw/2,LH-30,'center');
  panel(rx,LH-88,rw,30);txt(SFX.isMuted()?'SOUND OFF':'SOUND ON',rx+rw/2-(TOUCH?0:5),LH-78,SFX.isMuted()?'#91a7b5':C.cyan,9,'center');if(!TOUCH)key('M',rx+rw-15,LH-79);if(TOUCH)label('TAP TO USE',rx+rw/2,254,'center');ctx.restore();}
function playScene(){const sx=shake?Math.round((Math.random()-0.5)*shake):0,sy=shake?Math.round((Math.random()-0.5)*shake):0;
  ctx.save();ctx.translate(sx,sy);drawField();ctx.restore();drawPanels();
  drawWorldNotice();
  if(flash>0){ctx.fillStyle='rgba(255,255,255,'+(flash/12)+')';ctx.fillRect(X(PX),0,X(PW),H);}
  if(evt>0&&mode==='play'){ctx.save();ctx.globalAlpha=Math.min(1,evt/12);glassPanel(PX+50,48,PW-100,25,evtCol);txt(evtText,LW/2,54,evtCol,12,'center');ctx.restore();}
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
const TITLE_BUTTONS=[{x:40,y:178,w:230,h:38},{x:40,y:224,w:230,h:32},{x:40,y:264,w:230,h:30}];
// Translucent surfaces keep the scene visible; text remains fully opaque.
function glassPanel(x,y,w,h,accent){
  ctx.save();ctx.fillStyle='rgba(5,12,22,0.55)';ctx.fillRect(X(x),X(y),X(w),X(h));
  ctx.strokeStyle=accent||'#435765';ctx.lineWidth=X(0.5);ctx.strokeRect(X(x)+0.5,X(y)+0.5,X(w)-1,X(h)-1);
  ctx.fillStyle=accent||'#597481';ctx.fillRect(X(x),X(y),X(2),X(h));ctx.restore();
}
function titleScreen(){
  ctx.fillStyle='#050a12';ctx.fillRect(0,0,W,H);
  if(IMG.menu_hangar){ctx.save();ctx.imageSmoothingEnabled=true;ctx.drawImage(IMG.menu_hangar,0,0,W,H);ctx.restore();}
  else{
    // A complete title remains usable when the illustration is unavailable.
    for(const st of STARS){ctx.fillStyle=st.c;ctx.fillRect(st.x,(st.y+scroll*0.3)%H,st.s,st.s);}
    ctx.strokeStyle='#263b4c';ctx.lineWidth=X(3);ctx.strokeRect(X(355),X(42),X(230),X(265));
    const b=IMG.player||SHIP;ctx.drawImage(b,X(470)-b.width,X(190)-b.height,b.width*2,b.height*2);
  }
  const shade=ctx.createLinearGradient(0,0,X(360),0);shade.addColorStop(0,'rgba(3,8,16,0.45)');shade.addColorStop(1,'rgba(3,8,16,0)');
  ctx.fillStyle=shade;ctx.fillRect(0,0,X(360),H);
  if(IMG.logo_prompt)ctx.drawImage(IMG.logo_prompt,X(40)-16,X(18),388,60);else txt(BRAND,40,25,'#94acb9',11);
  ctx.fillStyle='#39c7df';ctx.fillRect(X(40),X(49),X(28),X(2));
  txt('SPORE',42,66,'#102331',48);txt('SPORE',40,64,'#dbe8eb',48);
  txt('WARS',42,112,'#102331',48);txt('WARS',40,110,'#dbe8eb',48);
  txt('Beyond the last machine.',42,159,'#8faebc',11);
  const labels=['LAUNCH','WORKSHOP',SFX.isMuted()?'SOUND: OFF':'SOUND: ON'];
  TITLE_BUTTONS.forEach((b,i)=>{const hot=titleSel===i;
    glassPanel(b.x,b.y,b.w,b.h,hot?'#56dcf1':'#3d5364');
    if(hot){ctx.fillStyle='rgba(39,160,190,0.12)';ctx.fillRect(X(b.x+2),X(b.y+1),X(b.w-3),X(b.h-2));}
    txt(labels[i],b.x+20,b.y+(i===0?10:8),hot?'#a3f2ff':'#adc0cd',i===0?19:13);
    if(hot)txt('>',b.x+7,b.y+(i===0?12:8),'#56dcf1',13);
    if(!TOUCH)txt(i===0?'ENTER':i===1?'Q':'M',b.x+b.w-10,b.y+12,'#7e9aa9',9,'right');
  });
  txt(TOUCH?'Drag to move / tap BOMB to clear fire':'ARROWS / WASD  move    X  bomb    P  pause',40,313,'#93a9b8',10);
  ctx.save();ctx.font=X(7)+'px monospace';ctx.fillStyle='#788a98';ctx.textAlign='left';ctx.textBaseline='top';
  ctx.fillText('Art: Skorpio / Daniel Cook / chabull / LuminousDragonGames',X(40),X(336));
  ctx.fillText('Music: Alexandr Zhelanov / Illustrated by 640k games.',X(40),X(348));ctx.restore();
}

function deadOptions(){return usedContinue?['RETRY','WORKSHOP','MAIN MENU']:['RETRY','CONTINUE','WORKSHOP','MAIN MENU'];}
function chooseDead(i){const action=deadOptions()[i];if(action==='RETRY'){newRun();mode='play';t=0;}else if(action==='CONTINUE')continueRun();else if(action==='WORKSHOP'){shopFromSector=false;mode='shop';}else if(action==='MAIN MENU'){clearScene();mode='title';t=0;}}
function deadScreen(){playScene();glassPanel(PX+24,80,PW-48,210,'#b86a72');
  if(score>=save.best&&score>0)txt('NEW BEST!',PX+PW-32,85,C.yellow,9,'right');
  txt('FLEET LOST',LW/2,96,C.red,28,'center');txt('score '+score+' / wave '+level,LW/2,132,C.white,14,'center');
  txt(cores+' run cores saved / '+save.cores+' available',LW/2,153,C.cyan,11,'center');
  deadOptions().forEach((label,i)=>txt((deadSel===i?'> ':'')+label,LW/2,178+i*23,deadSel===i?C.white:'#a4b8c6',14,'center'));
  txt(TOUCH?'Tap an option':'UP/DOWN choose / ENTER select',LW/2,274,'#a4b8c6',9,'center');}

function pauseScreen(){
  glassPanel(PX+40,90,PW-80,190,'#55c5d8');
  txt(exitConfirm?'RETURN TO MAIN MENU?':'PAUSED',LW/2,108,'#d2e8ef',exitConfirm?20:28,'center');
  if(exitConfirm){txt('Your cores will be saved.',LW/2,145,'#a4b8c6',12,'center');txt('This run will end.',LW/2,163,'#a4b8c6',12,'center');}
  else txt('Shields absorb hits. Empty hull costs a life.',LW/2,145,'#a4b8c6',10,'center');
  const y=exitConfirm?190:174,labels=exitConfirm?['KEEP PLAYING','RETURN TO MAIN MENU']:['RESUME','MAIN MENU'];
  labels.forEach((label,i)=>{const hot=exitConfirm?exitChoice===i:pauseSel===i;
    glassPanel(LW/2-130,y+i*44,260,30,hot?'#56dcf1':'#526675');
    txt((hot?'> ':'')+label,LW/2,y+i*44+8,hot?C.white:'#a4b8c6',12,'center');});
  if(!TOUCH)txt(exitConfirm?'UP/DOWN choose / ENTER select / ESC resume':'UP/DOWN choose / ENTER select / ESC resume',LW/2,264,'#a4b8c6',9,'center');
}
const SHOP=[{k:'weapon',name:'Starting gun',desc:'begin each run with a better gun',cost:l=>80+l*120,max:2},
  {k:'shield',name:'Starting shield',desc:'absorb hits before losing a ship',cost:l=>60+l*90,max:2},
  {k:'engine',name:'Engine tune',desc:'move faster',cost:l=>l===0?20:50+l*70,max:3}];
function completeSector(){
  if(!sectorPending)return;
  sectorBanked=cores-bankedCores;save.cores+=sectorBanked;bankedCores=cores;
  if(score>save.best)save.best=score;persist();sectorPending=false;mode='sector';sectorSel=0;t=0;setPaused(false);shots=[];eshots=[];resetRockets();
}
function nextSector(){shopFromSector=false;mode='play';t=0;waveT=60;tapped=false;ptr.down=false;}
function leaveShop(){if(shopFromSector){mode='sector';t=0;tapped=false;}else{clearScene();mode='title';t=0;}}
function sectorScreen(){
  playScene();glassPanel(PX+30,78,PW-60,210,'#55c5d8');
  txt('LEVEL '+Math.floor(level/5)+' COMPLETE!',LW/2,96,'#d2e8ef',24,'center');
  txt('+'+sectorBanked+' cores banked',LW/2,133,C.cyan,14,'center');
  txt(save.cores+' cores available for upgrades',LW/2,154,'#a4b8c6',12,'center');
  for(const [i,label] of ['VISIT WORKSHOP','NEXT LEVEL'].entries()){
    glassPanel(LW/2-130,184+i*44,260,32,i===sectorSel?'#55c5d8':'#526675');txt((i===sectorSel?'> ':'')+label,LW/2,194+i*44,C.white,13,'center');}
  if(!TOUCH)txt('UP/DOWN choose / ENTER select / Q Workshop',LW/2,272,'#a4b8c6',10,'center');
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
  const small=(text,x,y,col,size=9,align='left')=>{ctx.font=X(size)+'px monospace';ctx.fillStyle=col;ctx.textAlign=align;ctx.textBaseline='top';ctx.fillText(text,X(x),X(y));};
  const surface=(x,y,w,h,hot)=>{ctx.fillStyle='rgba(7,16,25,0.88)';ctx.fillRect(X(x),X(y),X(w),X(h));ctx.strokeStyle=hot?'#b4e7ee':'#41505a';ctx.lineWidth=hot?2:1;ctx.strokeRect(X(x),X(y),X(w),X(h));};
  small('SALVAGE EXCHANGE',24,22,'#e5d4b7',15);small('WEAPONS / SYSTEMS / PARTS',24,43,'#93a4ae',8);
  small('AVAILABLE',614,20,'#91a4af',8,'right');txt(save.cores+' cores',614,34,'#b5f1f4',14,'right');
  small('PERMANENT UPGRADES',292,66,'#a7b6c0',8);
  SHOP.forEach((it,i)=>{const x=292+i*110,lvl=save[it.k],maxed=lvl>=it.max,cost=it.cost(lvl),hot=shopSel===i;
    surface(x,82,102,116,hot);
    const previewTier=Math.min(it.max,lvl+1);
    drawEquipmentPreview(it.k,previewTier,x+51,120);
    small((maxed?'OWNED':'NEXT')+' / MK '+previewTier,x+51,86,'#8ea9b7',7,'center');
    small(['GUN MODULE','SHIELD CORE','ION ENGINE'][i],x+51,164,hot?'#e6f0f2':'#b3c2ca',9,'center');
    small(maxed?'FULLY UPGRADED':cost+' cores',x+51,182,maxed?'#8fa2ac':'#c9b791',8,'center');
  });
  if(shopSel<3)shopItem=shopSel;
  const selected=shopItem,it=SHOP[selected],lvl=save[it.k],maxed=lvl>=it.max,cost=it.cost(lvl),can=save.cores>=cost;
  surface(292,210,322,72,false);small(it.name,304,220,'#e4e9e9',12);small('OWNED '+lvl+' / '+it.max,602,223,'#a6b7c0',8,'right');
  const effect=selected===0?'Start future runs with '+GUN[Math.min(it.max,lvl+1)].n:selected===1?'Start future runs with '+Math.min(it.max,lvl+1)+(Math.min(it.max,lvl+1)===1?' shield':' shields'):'Engine speed +'+Math.round(Math.min(it.max,lvl+1)*0.5/3.7*100)+'% / installs now';
  small(effect,304,242,'#bdcbd2',9);small(maxed?'All upgrades owned.':can?'Permanent upgrade. Ready to purchase.':'Collect '+(cost-save.cores)+' more cores to afford this.',304,261,can?'#9cb7b8':'#d4ad91',8);
  surface(292,298,208,32,shopSel<3);small(maxed?'FULLY UPGRADED':can?'BUY / '+cost+' CORES':'NEED '+(cost-save.cores)+' MORE CORES',396,310,maxed||!can?'#8fa2ac':'#d9f1ee',9,'center');
  surface(510,298,104,32,shopSel===3);small('BACK',562,310,'#d9e1e4',9,'center');
  small('"Quality parts. Mostly legal."',146,318,'#ddc8ac',9,'center');
  if(!TOUCH)small('LEFT/RIGHT items / DOWN back / UP items / ENTER select',453,344,'#8b9fae',8,'center');
}

function buy(){const it=SHOP[shopSel],lvl=save[it.k];if(lvl>=it.max)return;const c=it.cost(lvl);if(save.cores<c){flash=4;SFX.hit();return;}save.cores-=c;save[it.k]=lvl+1;persist();SFX.power();}
