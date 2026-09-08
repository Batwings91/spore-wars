#!/usr/bin/env node
// Ship/shop regression over Chrome DevTools Protocol. Serve the game on port 8000, then run node tools/ship-smoke.js.
// Uses a fresh browser profile; output is in tools/smoke-out (ignored).
const {spawn}=require('child_process'),fs=require('fs'),path=require('path'),os=require('os');
const BASE=process.env.URL||'http://localhost:8000/index.html',PORT=Number(process.env.SMOKE_PORT)||9464;
const CANDIDATES=[process.env.CHROME,'C:/Program Files/Google/Chrome/Application/chrome.exe','C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe','/Applications/Google Chrome.app/Contents/MacOS/Google Chrome','/usr/bin/google-chrome','/usr/bin/chromium'].filter(Boolean);
const EXE=CANDIDATES.find(p=>fs.existsSync(p));if(!EXE){console.error('No Chrome/Edge found; set CHROME=<path>');process.exit(2);}
const OUT=path.join(__dirname,'smoke-out');fs.mkdirSync(OUT,{recursive:true});
const profile=fs.mkdtempSync(path.join(os.tmpdir(),'spore-smoke-'));
const chrome=spawn(EXE,['--headless=new','--disable-gpu','--no-first-run','--no-default-browser-check','--autoplay-policy=no-user-gesture-required',
  '--remote-debugging-port='+PORT,'--window-size=1280,760','--user-data-dir='+profile,'about:blank'],{stdio:'ignore'});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const errors=[];
function finish(code){try{chrome.kill();}catch(e){}try{fs.rmSync(profile,{recursive:true,force:true});}catch(e){}process.exit(code);}
(async()=>{
  let wsUrl;for(let i=0;i<50&&!wsUrl;i++){try{const l=await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();const pg=l.find(t=>t.type==='page');if(pg)wsUrl=pg.webSocketDebuggerUrl;}catch(e){}if(!wsUrl)await sleep(200);}
  if(!wsUrl)throw new Error('no CDP page target');
  const ws=new WebSocket(wsUrl);await new Promise(r=>ws.onopen=r);
  let id=0;const pending={};
  ws.onmessage=ev=>{const m=JSON.parse(ev.data);if(m.id&&pending[m.id]){pending[m.id](m.result||m.error);delete pending[m.id];}
    if(m.method==='Runtime.exceptionThrown')errors.push('EXCEPTION: '+(m.params.exceptionDetails.exception?.description||m.params.exceptionDetails.text));
    if(m.method==='Runtime.consoleAPICalled'&&(m.params.type==='error'||m.params.type==='warning'))errors.push(m.params.type.toUpperCase()+': '+m.params.args.map(a=>a.value??a.description).join(' '));
    if(m.method==='Log.entryAdded'&&m.params.entry.level==='error'&&!/favicon/.test(m.params.entry.text+m.params.entry.url))errors.push('LOG: '+m.params.entry.text+' '+(m.params.entry.url||''));};
  const send=(method,params={})=>new Promise(r=>{const i=++id;pending[i]=r;ws.send(JSON.stringify({id:i,method,params}));});
  await send('Page.enable');await send('Runtime.enable');await send('Log.enable');
  const VK={Enter:13,Escape:27,ArrowUp:38,ArrowDown:40,Space:32,KeyP:80,KeyQ:81};
  const KEYS={Enter:'Enter',Escape:'Escape',ArrowUp:'ArrowUp',ArrowDown:'ArrowDown',Space:' ',KeyP:'p',KeyQ:'q'};
  const key=async code=>{const b={code,key:KEYS[code],windowsVirtualKeyCode:VK[code],nativeVirtualKeyCode:VK[code]};
    await send('Input.dispatchKeyEvent',{type:code==='Space'?'keyDown':'rawKeyDown',...b,...(code==='Space'?{text:' '}:{})});await send('Input.dispatchKeyEvent',{type:'keyUp',...b});await sleep(60);};
  const shot=async name=>{const r=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync(path.join(OUT,name+'.png'),Buffer.from(r.data,'base64'));console.log('shot',name);};
  const evalJs=async expr=>(await send('Runtime.evaluate',{expression:expr,returnByValue:true,awaitPromise:true})).result?.value;
  // Navigate, then wait until resource loading has settled (the boot screen ignores keys until assets are in),
  // plus the boot screen's own 60-tick minimum.
  const go=async url=>{await send('Page.navigate',{url});let last=-1,stable=0;
    for(let i=0;i<80;i++){await sleep(500);const n=await evalJs("performance.getEntriesByType('resource').length");if(n===last&&i>=2)stable++;else stable=0;last=n;if(stable>=2)break;}
    let ready=false;
    for(let i=0;i<120;i++){ready=await evalJs("typeof assetsReady!=='undefined'&&(assetsReady||assetsFailed)&&typeof t!=='undefined'&&t>60");if(ready)break;await sleep(250);}
    if(!ready)throw new Error('Boot assets did not settle within 30 seconds');
    await send('Input.dispatchMouseEvent',{type:'mouseMoved',x:0,y:0});
    await sleep(1500);};







  await go(BASE);await evalJs('requestAnimationFrame=()=>0');await sleep(100);
  const check=async code=>{const r=await evalJs('(()=>{'+code+';return true})()');if(r!==true)throw Error('Check failed '+code+' '+errors.join(' | '));};

  await check("if(save.rockets!==0||save.sideLaser!==0)throw Error('fresh save equipment');newRun();mode='play';ship.inv=0;hint=0;level=1;worldNotice=0;if(!IMG.player_hull)throw Error('hull missing');");
  for(let gun=0;gun<6;gun++){
    await check("wpn="+gun+";save.engine=2;save.rockets=1;shield=2;podOpen=24;rocketFlash=0;render()");await shot('ship-tier-'+gun);
    await check("const before=JSON.stringify([save,wpn,shield,podOpen,rocketT,rocketSide]);drawEquipmentPreview('weapon',"+gun+",343,120);if(JSON.stringify([save,wpn,shield,podOpen,rocketT,rocketSide])!==before)throw Error('preview mutation');");
  }
  await check("save.weapon=2;save.engine=2;save.shield=2;save.rockets=1;save.orb=1;save.sideLaser=1;save.cores=300;mode='shop';shopSel=0;render()");await shot('ship-workshop');
  await send('Emulation.setDeviceMetricsOverride',{width:800,height:500,deviceScaleFactor:1,mobile:false});await sleep(250);await shot('ship-workshop-small');await send('Emulation.clearDeviceMetricsOverride');await sleep(250);
  await check("shopFromSector=false;const old=drawShipAssembly;let got;drawShipAssembly=(x,y,loadout)=>{got=loadout;};drawEquipmentPreview('primary',4,0,0);drawShipAssembly=old;if(got.weapon!==4||got.engine!==2||got.shield!==2||got.rockets!==1||got.orb!==1||got.sideLaser!==1)throw Error('preview lost equipment');");
  await check("shopFromSector=true;wpn=5;shield=1;orbActive=false;const old=drawShipAssembly;let got;drawShipAssembly=(x,y,loadout)=>{got=loadout;};drawEquipmentPreview('engine',3,0,0);drawShipAssembly=old;shopFromSector=false;if(got.weapon!==5||got.engine!==3||got.shield!==1||got.rockets!==1||got.orb!==0)throw Error('checkpoint preview lost live fit');");
  await check("const before=savedLoadout(),candidate=previewLoadout('ordnance',0);for(const k of Object.keys(before))if(k!=='rockets'&&candidate[k]!==before[k])throw Error('candidate changed '+k);if(candidate.rockets!==0)throw Error('candidate ordnance');save.sideLaser=0;const laser=previewLoadout('sideWeapon',1);if(laser.sideLaser!==1)throw Error('laser candidate');save.sideLaser=1;");
  await check("for(let i=0;i<GUN.length;i++)if(JSON.stringify(GUN_PORTS[i])!==JSON.stringify(GUN[i].shots.map(s=>s.slice(0,2))))throw Error('gun mount drift');if(EQUIPMENT.ordnance.tiers[1].reload!==180||EQUIPMENT.sideWeapon.tiers[1].width!==14||SHOP[3]!==EQUIPMENT.ordnance||SHOP[5]!==EQUIPMENT.sideWeapon)throw Error('equipment catalogue drift');");
  await check("wpn=MAXW;level=1;kills=lastW=0;bombDrought=0;const random=Math.random;Math.random=()=>0.99;for(let i=0;i<BOMB_DROUGHT_LIMIT-1;i++)if(dropFor({})==='b')throw Error('early forced bomb');if(dropFor({})!=='b'||bombDrought!==0)throw Error('bomb drought');Math.random=()=>0.31;if(dropFor({})!=='b'||bombDrought!==0)throw Error('random bomb');Math.random=random;");
  await check("mode='play';const old=IMG.player_hull;delete IMG.player_hull;render();IMG.player_hull=old;");await shot('ship-fallback');

  await check("if(GUN.length!==6||MAXW!==5||BOLT.length!==6||GUN_PORTS.length!==6)throw Error('tier tables');save.orb=0;newRun();mode='play';ship.inv=0;wpn=5;fireT=0;waveT=999;level=1;formationGroup=AUTHORED_WAVES[0].length;update();if(shots.filter(s=>!s.rocket).length!==6||shots.some(s=>s.dmg!==3))throw Error('Siege fire');render()");await shot('ship-siege');
  await check("save.orb=0;orbActive=false;drops=[{k:'o',x:ship.x,y:ship.y}];update();if(!orbActive||save.orb)throw Error('run pickup');newRun();if(orbActive)throw Error('pickup persisted');mode='shop';shopSel=4;save.cores=0;buy();if(save.orb||orbActive)throw Error('unaffordable');save.cores=200;buy();if(save.orb!==1||save.cores!==80||!orbActive)throw Error('purchase');buy();if(save.cores!==80)throw Error('duplicate purchase');newRun();if(!orbActive)throw Error('owned reset');mode='play';wpn=0;enemies=[{x:ship.x,y:100,hp:100,k:0}];ground=[];shots=[];for(let i=0;i<179;i++)updateRockets();if(shots.length)throw Error('early orb missile');updateRockets();if(shots.length!==1||!shots[0].orb||shots[0].target!==enemies[0])throw Error('orb launch');if(!Number.isFinite(shots[0].vx+shots[0].vy))throw Error('steering');");
  await check("orbT=0;shots=[{orb:true,rocket:true,y:100,life:180,vx:0,vy:-2},{orb:true,rocket:true,y:110,life:180,vx:0,vy:-2}];updateRockets();if(shots.length!==2)throw Error('orb cap');shots=[];enemies=[];boss=null;orbT=0;updateRockets();if(shots.length)throw Error('no target');enemies=[{x:ship.x+60,y:100,hp:5,k:0}];updateRockets();if(shots.length!==1)throw Error('target recovery');ship.inv=0;shield=0;ship.hull=1;lives=3;hitShip();if(!orbActive||shots.some(s=>s.orb))throw Error('life reset');continueRun();if(!orbActive||orbReady)throw Error('continue reset');");
  await check("newRun();mode='play';paused=true;orbReady=true;orbX=100;orbY=200;orbT=95;const before=JSON.stringify([orbX,orbY,orbT]);stepLogic();if(JSON.stringify([orbX,orbY,orbT])!==before)throw Error('pause');paused=false;mode='shop';shopSel=0;shopItem=0;");
  await key('ArrowDown');await check("if(shopSel!==4)throw Error('grid down');");await key('ArrowUp');await check("if(shopSel!==0)throw Error('grid up');");await check("shopSel=3;shopItem=3;");await key('ArrowDown');await check("if(shopSel!==SHOP.length)throw Error('down to back');");await key('ArrowUp');await check("if(shopSel!==3)throw Error('return to item');");
  await check("const b=shopTileBounds(4);shopSel=0;ptr.x=b.x+b.w/2;ptr.y=b.y+b.h/2;tapSrc='ptr';tapped=true;stepLogic();if(shopSel!==4)throw Error('orb touch');render()");await shot('shop-orb');
  await check("mode='shop';shopFromSector=true;sectorSel=0;shopInstalled={id:'engine',tier:1};leaveShop();if(mode!=='sector'||sectorSel!==1||shopInstalled!==null)throw Error('shop menu/default');");
  await check("mode='shop';shopSel=5;save.sideLaser=0;save.cores=239;buy();if(save.sideLaser||save.cores!==239)throw Error('unaffordable laser');save.cores=500;buy();if(save.sideLaser!==1||save.cores!==260)throw Error('laser purchase');buy();if(save.cores!==260)throw Error('laser duplicate');const stored=JSON.parse(localStorage.getItem(KEY));if(stored.sideLaser!==1)throw Error('laser save');");
  await check("mode='shop';shopSel=3;save.rockets=0;save.cores=90;buy();if(save.rockets!==1||save.cores!==0)throw Error('rocket purchase');buy();if(save.cores!==0)throw Error('rocket duplicate');");
  await check("newRun();mode='play';wpn=5;podOpen=24;ship.inv=0;hint=0;level=1;worldNotice=0;updateOrb();render()");await shot('ship-siege-orb');await send('Emulation.setDeviceMetricsOverride',{width:800,height:500,deviceScaleFactor:1,mobile:false});await sleep(250);await shot('ship-siege-orb-small');await send('Emulation.clearDeviceMetricsOverride');await sleep(250);
  await go(BASE);await evalJs('requestAnimationFrame=()=>0');await sleep(100);await check("newRun();if(save.orb!==1||!orbActive||save.sideLaser!==1||savedLoadout().sideLaser!==1)throw Error('saved loadout reload');");
  await check("save.orb=0;orbActive=false;level=6;wpn=MAXW;kills=20;lastW=20;const random=Math.random;Math.random=()=>0.585;if(dropFor({})!=='o')throw Error('orb drop');orbActive=true;if(dropFor({})==='o')throw Error('owned orb drop');Math.random=random;localStorage.setItem(KEY,JSON.stringify({cores:37,best:999,weapon:2,shield:1,engine:3,orb:1}));");
  await go(BASE);await evalJs('requestAnimationFrame=()=>0');await sleep(100);await check("newRun();if(save.cores!==37||save.best!==999||save.weapon!==2||save.shield!==1||save.engine!==3||save.orb!==1||save.rockets!==1||save.sideLaser!==0||!orbActive)throw Error('legacy save migration');const stored=JSON.parse(localStorage.getItem(KEY));if(stored.rockets!==1||stored.sideLaser!==0)throw Error('migration not persisted');");

  await check("save.sideLaser=1;newRun();mode='play';fireT=999;waveT=999;level=1;formationGroup=AUTHORED_WAVES[0].length;enemies=[];ground=[];boss=null;const p=EQUIPMENT.sideWeapon.tiers[1],starts=[];for(let tick=1;tick<=700;tick++){const was=sideLaserPhase;updateSideLasers();if(was!==2&&sideLaserPhase===2)starts.push(tick);}if(starts[0]!==p.recharge+p.windup||starts[1]-starts[0]!==p.duration+p.recharge+p.windup)throw Error('laser cadence '+starts);if(sideLaserPhase===2&&sideLaserT>p.duration)throw Error('laser duration');");
  await check("resetSideLasers();sideLaserPhase=2;sideLaserT=EQUIPMENT.sideWeapon.tiers[1].duration;const x=ship.x+SHIP_MOUNTS.sideWeapon[0][0],edge=EQUIPMENT.sideWeapon.tiers[1].width/2+R[0],inside={x:x-edge+0.1,y:120,hp:2,k:0,flash:0,t:0,ph:0},outside={x:x-edge-0.1,y:150,hp:2,k:0,flash:0,t:0,ph:0};enemies=[inside,outside];ground=[];damageWithSideLasers();if(inside.hp!==1||outside.hp!==2)throw Error('beam footprint');if(sideLaserImpacts.length!==1||sideLaserImpacts[0].x!==x)throw Error('beam mount impact');sideLaserPhase=2;sideLaserT=20;render()");await shot('side-laser-active');
  await send('Emulation.setDeviceMetricsOverride',{width:800,height:500,deviceScaleFactor:1,mobile:false});await sleep(250);await shot('side-laser-active-small');await send('Emulation.clearDeviceMetricsOverride');await sleep(250);
  await check("sideLaserPhase=1;sideLaserT=24;enemies=[];render()");await shot('side-laser-windup');
  await check("const x=ship.x+SHIP_MOUNTS.sideWeapon[1][0],g={x,y:180,anchor:worldScroll-X(180),hp:2,stage:0,variant:0,ct:200,aim:0,flash:0};enemies=[];ground=[g];damageWithSideLasers();if(g.hp!==1)throw Error('beam ground damage');boss={x:ship.x,y:88,ty:88,hp:5,kind:0,mech:false,mother:false,turrets:[]};damageWithSideLasers();if(boss.hp!==3)throw Error('twin boss beam damage');boss=null;");
  await check("sideLaserPhase=1;sideLaserT=20;paused=true;const before=JSON.stringify([sideLaserPhase,sideLaserT]);stepLogic();if(JSON.stringify([sideLaserPhase,sideLaserT])!==before)throw Error('laser pause');paused=false;continueRun();if(sideLaserPhase!==0||sideLaserT!==EQUIPMENT.sideWeapon.tiers[1].recharge)throw Error('laser lifecycle reset');");

  await check("newRun();mode='play';orbActive=false;enemies=[];boss=null;const target={x:ship.x,y:100,hp:100,anchor:0},profile=EQUIPMENT.ordnance.tiers[1];ground=[target];save.rockets=0;wpn=5;resetRockets();for(let i=0;i<500;i++)updateRockets();if(podOpen!==0||shots.length)throw Error('gun unlocked rockets');save.rockets=1;wpn=0;resetRockets();shots=[];const launches=[];for(let tick=1;tick<=600;tick++){updateRockets();if(shots.length){const s=shots[0],mount=SHIP_MOUNTS.ordnance[launches.length%2];if(s.target!==target||s.dmg!==profile.damage)throw Error('ground missile');if(s.x!==ship.x+mount[0]||s.y!==ship.y+mount[1])throw Error('launch origin');launches.push(tick);shots=[];}}if(launches[0]!==23+profile.reload)throw Error('first launch');for(let i=1;i<launches.length;i++)if(launches[i]-launches[i-1]!==profile.reload)throw Error('cadence');rocketT=0;shots=Array.from({length:profile.limit},()=>({rocket:true,x:ship.x,y:200,vx:0,vy:-2,life:180,target}));updateRockets();if(shots.length!==profile.limit)throw Error('pod cap');");
  await check("newRun();mode='play';orbActive=false;save.rockets=1;bossWarn=0;level=1;groundTimer=0;updateGround();if(groundTimer!==150)throw Error('ground interval');level=4;groundTimer=0;updateGround();if(groundTimer!==90)throw Error('late ground interval');const e=ground[0];e.y=120;e.anchor=worldScroll-X(120);e.hp=0;destroyGround(e);destroyGround(e);if(groundWrecks.length!==1)throw Error('duplicate wreck');for(let i=0;i<150;i++)updateGround();if(groundWrecks[0].age!==150)throw Error('wreck age');wpn=1;podOpen=24;ship.inv=0;hint=0;worldNotice=0;groundWrecks[0].x=320;groundWrecks[0].anchor=worldScroll-X(180);render()");await shot('side-missiles-wreck-smoke');
  await check("newRun();mode='play';orbActive=false;wpn=0;fireT=999;waveT=999;level=1;formationGroup=AUTHORED_WAVES[0].length;const e={x:ship.x,y:ship.y-70,anchor:worldScroll-X(ship.y-70),hp:1,stage:0,variant:0,ct:200,aim:0,flash:0};ground=[e];enemies=[];shots=[{x:e.x,y:e.y,vx:0,vy:-1,rocket:true,g:0,dmg:1,target:e,life:180,retargeted:false}];update();if(ground.includes(e)||groundWrecks.length!==1)throw Error('missile ground kill');");
  console.log('PASS equipment catalogue/mount parity, full-loadout preview, v3 migration, independent rockets, six tiers, orb, ground missile kill, pause and grid keyboard/touch shop');console.log(errors);ws.close();finish(errors.length?1:0);
})().catch(e=>{console.error(e);finish(2);});
