#!/usr/bin/env node
// Phase 3 living-world regression over Chrome DevTools Protocol. Serve the project on port 8000 first.
const {spawn}=require('child_process'),fs=require('fs'),path=require('path'),os=require('os');
const BASE=process.env.URL||'http://localhost:8000/index.html',PORT=Number(process.env.SMOKE_PORT)||9471;
const CANDIDATES=[process.env.CHROME,'C:/Program Files/Google/Chrome/Application/chrome.exe','C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe','/Applications/Google Chrome.app/Contents/MacOS/Google Chrome','/usr/bin/google-chrome','/usr/bin/chromium'].filter(Boolean);
const EXE=CANDIDATES.find(p=>fs.existsSync(p));if(!EXE){console.error('No Chrome/Edge found; set CHROME=<path>');process.exit(2);}
const OUT=path.join(__dirname,'smoke-out');fs.mkdirSync(OUT,{recursive:true});
const profile=fs.mkdtempSync(path.join(os.tmpdir(),'spore-world-smoke-'));
const chrome=spawn(EXE,['--headless=new','--disable-gpu','--no-first-run','--no-default-browser-check','--autoplay-policy=no-user-gesture-required',
  '--remote-allow-origins=*','--remote-debugging-port='+PORT,'--window-size=1280,760','--user-data-dir='+profile,'about:blank'],{stdio:'ignore'});
const sleep=ms=>new Promise(r=>setTimeout(r,ms)),errors=[];
const keepAlive=setInterval(()=>{},1000);
function finish(code){clearInterval(keepAlive);try{chrome.kill();}catch(e){}try{fs.rmSync(profile,{recursive:true,force:true});}catch(e){}process.exit(code);}
(async()=>{
  let wsUrl;for(let i=0;i<50&&!wsUrl;i++){try{const l=await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json(),pg=l.find(t=>t.type==='page');if(pg)wsUrl=pg.webSocketDebuggerUrl;}catch(e){}if(!wsUrl)await sleep(200);}
  if(!wsUrl)throw new Error('no CDP page target');
  const ws=new WebSocket(wsUrl);await Promise.race([new Promise((resolve,reject)=>{ws.onopen=resolve;ws.onerror=()=>reject(Error('CDP websocket failed'));ws.onclose=()=>reject(Error('CDP websocket closed before opening'));}),sleep(5000).then(()=>{throw Error('CDP websocket open timeout');})]);let id=0;const pending={};
  ws.addEventListener('message',async ev=>{const raw=typeof ev.data==='string'?ev.data:ev.data&&typeof ev.data.text==='function'?await ev.data.text():String(ev.data),m=JSON.parse(raw);if(m.id&&pending[m.id]){clearTimeout(pending[m.id].timer);pending[m.id].resolve(m.result||m.error);delete pending[m.id];}
    if(m.method==='Runtime.exceptionThrown')errors.push('EXCEPTION: '+(m.params.exceptionDetails.exception?.description||m.params.exceptionDetails.text));
    if(m.method==='Runtime.consoleAPICalled'&&(m.params.type==='error'||m.params.type==='warning'))errors.push(m.params.type.toUpperCase()+': '+m.params.args.map(a=>a.value??a.description).join(' '));
    if(m.method==='Log.entryAdded'&&m.params.entry.level==='error'&&!/favicon/.test(m.params.entry.text+m.params.entry.url))errors.push('LOG: '+m.params.entry.text+' '+(m.params.entry.url||''));});
  const send=(method,params={})=>new Promise((resolve,reject)=>{const i=++id,timer=setTimeout(()=>{delete pending[i];reject(Error('CDP timeout: '+method));},10000);pending[i]={resolve,timer};ws.send(JSON.stringify({id:i,method,params}));});
  const evalJs=async expr=>(await send('Runtime.evaluate',{expression:expr,returnByValue:true,awaitPromise:true})).result?.value;
  const shot=async name=>{const r=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync(path.join(OUT,name+'.png'),Buffer.from(r.data,'base64'));console.log('shot',name);};
  await send('Page.enable');await send('Runtime.enable');await send('Log.enable');await send('Page.navigate',{url:BASE});
  let ready=false;for(let i=0;i<120;i++){await sleep(250);ready=await evalJs("typeof assetsReady!=='undefined'&&(assetsReady||assetsFailed)&&typeof t!=='undefined'&&t>60");if(ready)break;}if(!ready)throw Error('boot timeout');
  await evalJs('requestAnimationFrame=()=>0');await sleep(100);
  const check=async code=>{const r=await evalJs('(()=>{'+code+';return true})()');if(r!==true)throw Error('Check failed: '+code+' | '+errors.join(' | '));};

  await check("if(FAUNA_DECOR.length!==5||FAUNA_DECOR.slice(1).some(c=>c.width!==X(PW)||c.height!==FAUNA_DECOR_H))throw Error('decor cache');if(WALL_FAUNA_LIMIT!==3)throw Error('fauna cap');");
  await check("newRun();mode='play';level=6;worldStage=worldFrom=1;worldNotice=0;ship.inv=0;shield=0;wallFauna=[];eshots=[];const e=spawnWallFauna('spitter',-1);e.anchor=worldScroll-X(120);e.ct=WALL_FAUNA.spitter.tell;updateWallFauna();if(e.ct!==WALL_FAUNA.spitter.tell-1||!Number.isFinite(e.aim))throw Error('spitter tell');e.ct=1;updateWallFauna();const s=eshots.find(q=>q.fauna==='spore');if(!s||s.radius!==6||Math.abs(Math.hypot(s.vx,s.vy)-1.15)>.001||e.ct!==WALL_FAUNA.spitter.cycle+(e.id%3)*17)throw Error('spitter fire/cadence');");
  await check("wallFauna=[];const e=spawnWallFauna('snap',-1);e.anchor=worldScroll-X(ship.y);e.ct=WALL_FAUNA.snap.active;ship.x=PX+44;ship.inv=0;ship.hull=3;updateWallFauna();if(ship.hull!==2||e.ct!==WALL_FAUNA.snap.active-1)throw Error('snap active damage');");
  await check("paused=true;wallFauna[0].ct=20;routeSegment=spawnRouteSegment();routeSegment.y=30;const before=JSON.stringify([wallFauna,routeSegment,worldScroll,ship.x,ship.y]);stepLogic();if(JSON.stringify([wallFauna,routeSegment,worldScroll,ship.x,ship.y])!==before)throw Error('pause freeze');paused=false;");
  await check("save.sideLaser=1;routeSegment=spawnRouteSegment();routeSegment.y=80;const c=routeLaneClearance();if(c.left<c.required||c.right<c.required||routeSegment.template.telegraph<80)throw Error('mature clearance/telegraph');ship.inv=90;ship.y=180;ship.x=PX+MAX_SHIP_HALF_WIDTH;if(resolvePlayerTerrain())throw Error('left lane blocked');ship.x=PX+PW-MAX_SHIP_HALF_WIDTH;if(resolvePlayerTerrain())throw Error('right lane blocked');ship.x=PX+PW/2;ship.y=180;ship.inv=0;ship.hull=3;if(!resolvePlayerTerrain()||ship.hull!==2||routePrimitives().some(r=>rectOverlap(ship.x,ship.y,MAX_SHIP_HALF_WIDTH,23,r)))throw Error('terrain collision');");
  await check("resetWorldEncounters();mode='play';worldStage=worldFrom=3;level=18;boss=null;bossWarn=0;bossDying=0;sectorPending=false;for(let i=0;i<239;i++)updateRouteSegment();if(routeSegment)throw Error('early split');updateRouteSegment();if(!routeSegment||routeSpawnedLevel!==18)throw Error('split schedule');wallFauna=[];const e=spawnWallFauna('snap',-1);e.anchor=worldScroll-X(ship.y);e.ct=WALL_FAUNA.snap.active;ship.x=PX+44;ship.inv=0;ship.hull=3;updateWallFauna();if(ship.hull!==3||e.ct!==WALL_FAUNA.snap.tell+1)throw Error('split snap suppression');");
  await check("routeSegment=spawnRouteSegment();routeSegment.y=80;const enemy={x:320,y:160,hp:2,k:0},rocket={x:320,y:160,rocket:true},drop={x:320,y:160,k:'core'},fixture={x:320,y:160,hp:2};enemies=[enemy];shots=[rocket];drops=[drop];ground=[fixture];keepRouteEntitiesReachable();if(enemy.x!==320||rocket.x!==320)throw Error('air overflight');if(drop.x===320||fixture.x===320)throw Error('reward/fixture lane placement');routeSegment.y=LH+31;updateRouteSegment();if(routeSegment)throw Error('clean rejoin');");
  await check("wallFauna=[{kind:'snap'}];routeSegment=spawnRouteSegment();eshots=[{fauna:'spore'},{ground:true}];resetWorldEncounters();if(eshots.length!==1||eshots[0].fauna)throw Error('seed cleanup');wallFauna=[{kind:'snap'}];routeSegment=spawnRouteSegment();ship.inv=0;ship.hull=1;lives=3;hitShip();if(wallFauna.length||routeSegment)throw Error('life cleanup');wallFauna=[{kind:'snap'}];routeSegment=spawnRouteSegment();continueRun();if(wallFauna.length||routeSegment)throw Error('continue cleanup');wallFauna=[{kind:'snap'}];routeSegment=spawnRouteSegment();clearScene();if(wallFauna.length||routeSegment)throw Error('menu cleanup');");

  await check("newRun();mode='play';level=6;worldStage=worldFrom=1;worldNotice=0;hint=0;ship.inv=0;wallFauna=[];let a=spawnWallFauna('spitter',-1);a.anchor=worldScroll-X(118);a.ct=20;a=spawnWallFauna('snap',1);a.anchor=worldScroll-X(205);a.ct=18;render();");await shot('phase3-salvage-fauna');
  await check("worldStage=worldFrom=2;wallFauna=[];let a=spawnWallFauna('spitter',1);a.anchor=worldScroll-X(140);a.ct=22;render();");await shot('phase3-wilds-fauna');
  await check("worldStage=worldFrom=3;level=18;routeSegment=spawnRouteSegment();routeSegment.y=24;wallFauna=[];ship.x=PX+80;render();");await shot('phase3-labyrinth-split');
  await send('Emulation.setDeviceMetricsOverride',{width:800,height:500,deviceScaleFactor:1,mobile:false});await sleep(250);await shot('phase3-labyrinth-split-small');await send('Emulation.clearDeviceMetricsOverride');await sleep(250);
  await check("worldStage=worldFrom=4;level=21;routeSegment=null;wallFauna=[];let a=spawnWallFauna('snap',-1);a.anchor=worldScroll-X(170);a.ct=12;render();");await shot('phase3-brood-fauna');
  if(errors.length)throw Error(errors.join('\n'));
  console.log('PASS fauna cache/tells/fire/cadence/damage/pause/lifecycle, split telegraph/collision/mature clearance/rejoin and reachable rewards');ws.close();finish(0);
})().catch(e=>{console.error(e);finish(2);});
