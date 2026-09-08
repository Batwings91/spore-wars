#!/usr/bin/env node
// Campaign regression over Chrome DevTools Protocol. Serve the game on port 8000, then run node tools/campaign-smoke.js.
// Uses a fresh browser profile; output is in tools/smoke-out (ignored).
const {spawn}=require('child_process'),fs=require('fs'),path=require('path'),os=require('os');
const BASE=process.env.URL||'http://localhost:8000/index.html',PORT=Number(process.env.SMOKE_PORT)||9462;
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
    await sleep(1500);
    // Art checks require deferred illustrations, which do not gate the game boot.
    let artReady=false;for(let i=0;i<120;i++){artReady=await evalJs("Object.keys(ASSET_EXT).every(k=>IMG[k])");if(artReady)break;await sleep(250);}
    if(!artReady)throw Error('Deferred artwork did not load within 30 seconds');};







  await go(BASE);await evalJs('requestAnimationFrame=()=>0');await sleep(100);
  const check=async code=>{const r=await evalJs('(()=>{'+code+';return true})()');if(r!==true)throw Error('Check failed '+code+' '+errors.join(' | '));};
  await check("newRun();mode='play';if(WORLDS.length!==5||AUTHORED_WAVES.length!==25)throw Error('campaign length');for(let w=1;w<=25;w++){if(worldForWave(w)!==Math.floor((w-1)/5))throw Error('world mapping');if(w%5===0){if(AUTHORED_WAVES[w-1]!==null)throw Error('boss slot');continue;}level=w;formationGroup=0;enemies=[];while(formationGroup<AUTHORED_WAVES[w-1].length){enemies=[];spawnFormationGroup();for(const e of enemies)if(!R[e.k]||!Number.isFinite(e.hp))throw Error('enemy definition');}worldStage=worldForWave(w);render();}");
  for(let stage=0;stage<5;stage++){
    await check("newRun();mode='play';level="+(stage*5+1)+";worldStage=worldFrom="+stage+";worldFade=0;worldNotice=0;formationGroup=0;spawnFormationGroup();groundTimer=0;updateGround();render()");await shot('campaign-world-'+(stage+1));
    await check("level="+((stage+1)*5)+";bossWarn=0;spawnBoss();boss.y=boss.ty;if(boss.kind!=="+stage+")throw Error('boss order');const b=boss;for(let i=0;i<240;i++){if(b.kind===2||b.kind===3)updateCampaignBoss(b);else if(b.mother)updateMothership(b);else if(b.mech)updateMech(b);}if(eshots.some(s=>!Number.isFinite(s.x+s.y+s.vx+s.vy)))throw Error('bad projectile');render()");await shot('campaign-boss-'+(stage+1));
    await check("cores=10;bankedCores=0;save.cores=0;bossDying=1;updateBoss();if(!sectorPending)throw Error('boss reward');completeSector();if(save.cores!==10||mode!=="+JSON.stringify(stage===4?'victory':'sector')+")throw Error('completion');completeSector();if(save.cores!==10)throw Error('double bank');t=80;render()");
    if(stage<4)await check("chooseSector(0);if(mode!=='shop')throw Error('shop');leaveShop();nextSector();for(let i=0;i<180;i++)stepLogic();if(mode!=='play'||worldStage!=="+(stage+1)+")throw Error('travel');");
  }
  await shot('campaign-victory');
  await check("const w=level;for(let i=0;i<200;i++)stepLogic();if(level!==w||mode!=='victory')throw Error('end must wait');chooseSector(0);if(mode!=='play'||level!==0||worldStage!==0||campaignLoop!==1||bankedCores!==0)throw Error('hard replay reset');spawnWave();if(enemies[0].hp!==2)throw Error('harder HP');mode='victory';chooseSector(1);if(mode!=='title')throw Error('victory menu');newRun();if(campaignLoop)throw Error('normal launch resets challenge');");
  await go(BASE+'?wave=24');await evalJs('requestAnimationFrame=()=>0');await sleep(100);await check("newRun();mode='play';stepLogic();if(level!==25||!bossWarn||worldStage!==4)throw Error('debug finale');newRun(1);if(level!==0||worldStage!==0)throw Error('debug harder replay must start at beginning');");

  await check("newRun();mode='play';level=11;worldStage=worldFrom=2;worldFade=0;worldNotice=0;ship.inv=0;hint=0;const art=IMG.world_wilds;if(!art||WORLDS[2].asset!=='world_wilds')throw Error('Wilds image');const h=Math.round(art.height*X(PW)/art.width);worldScroll=h-1;render()");await shot('wilds-seam-before');
  await check("worldScroll++;render()");await shot('wilds-seam');
  await check("worldScroll++;render();const before=worldScroll;paused=true;stepLogic();if(worldScroll!==before)throw Error('paused scroll');paused=false;const art=IMG.world_wilds;delete IMG.world_wilds;render();IMG.world_wilds=art;");await shot('wilds-fallback');
  await check("worldScroll=0;render()");await shot('wilds-painted');
  await check("if(!IMG.seeder_body)throw Error('Seeder image missing');enemies=[{k:6,x:320,y:120,hp:6,t:60,ph:0,ct:22}];const before=JSON.stringify(enemies);render();if(JSON.stringify(enemies)!==before)throw Error('render mutation')");await shot('wilds-seeder');
  await check("const art=IMG.seeder_body;delete IMG.seeder_body;render();IMG.seeder_body=art;");await shot('wilds-seeder-fallback');
  await check("enemies=[{k:6,x:320,y:120,hp:6,t:60,ph:0,ct:60,flash:0}];booms=[];render();const normal=ctx.getImageData(X(298),X(98),88,88).data;enemies[0].flash=4;render();const hit=ctx.getImageData(X(298),X(98),88,88).data;let changes=0;for(let i=0;i<hit.length;i++)if(hit[i]!==normal[i])changes++;if(!changes)throw Error('no hit tint');for(const i of [0,87*4,87*88*4,(88*88-1)*4])for(let c=0;c<3;c++)if(normal[i+c]!==hit[i+c])throw Error('rectangular flash');if(ctx.filter!=='none')throw Error('filter leak');addHitImpact(320,135,true);render()");await shot('organic-hit');
  await check("enemies=[{k:2,x:320,y:120,hp:3,t:60,ct:60,flash:4}];booms=[];addHitImpact(320,135,false);render()");await shot('mechanical-hit');
  await check("newRun();mode='play';level=15;worldStage=worldFrom=2;worldFade=0;worldNotice=0;ship.inv=0;hint=0;spawnBoss();boss.y=boss.ty;boss.flash=3;boss.phase=2;boss.fireT=22;if(!IMG.matriarch_body)throw Error('Matriarch missing');const draw=ctx.drawImage;let wrong=false;ctx.drawImage=function(im,...args){if(im===IMG.boss_mech||im===IMG.boss_mech_fire)wrong=true;return draw.call(this,im,...args);};render();ctx.drawImage=draw;if(wrong)throw Error('wrong boss hit sprite');");await shot('matriarch-hit-phase2');
  await check("const art=IMG.matriarch_body;delete IMG.matriarch_body;render();IMG.matriarch_body=art;");await shot('matriarch-fallback');
  await check("newRun();mode='play';level=16;worldStage=worldFrom=3;worldFade=0;worldNotice=0;ship.inv=0;hint=0;if(!IMG.world_labyrinth||WORLDS[3].asset!=='world_labyrinth')throw Error('Labyrinth image');worldScroll=0;render()");await shot('labyrinth-painted');
  await check("const h=Math.round(IMG.world_labyrinth.height*X(PW)/IMG.world_labyrinth.width);for(const y of [h-1,h,h+1,h*2-1,h*2,h*2+1]){worldScroll=y;render();}const before=worldScroll;paused=true;stepLogic();if(worldScroll!==before)throw Error('Labyrinth pause');paused=false;");await shot('labyrinth-seam');
  await check("const art=IMG.world_labyrinth;delete IMG.world_labyrinth;render();IMG.world_labyrinth=art;");await shot('labyrinth-fallback');
  await check("newRun();mode='play';level=16;worldStage=worldFrom=3;worldFade=0;worldNotice=0;hint=0;ship.inv=0;if(!IMG.needle_body)throw Error('Needle missing');enemies=[{k:7,x:280,y:110,hp:3,t:60,ph:0,ct:22},{k:7,x:320,y:130,hp:3,t:75,ph:0,ct:80,flash:4},{k:7,x:360,y:110,hp:3,t:90,ph:0,ct:80}];const before=JSON.stringify(enemies);render();if(JSON.stringify(enemies)!==before)throw Error('Needle render mutation');if(ctx.globalAlpha!==1||ctx.globalCompositeOperation!=='source-over')throw Error('Needle canvas leak');");await shot('labyrinth-needles');
  await check("const art=IMG.needle_body;delete IMG.needle_body;render();IMG.needle_body=art;");await shot('needle-fallback');
  await check("newRun();mode='play';level=20;worldStage=worldFrom=3;worldFade=0;worldNotice=0;hint=0;ship.inv=0;spawnBoss();boss.y=boss.ty;boss.fireT=22;boss.phase=2;boss.flash=3;if(!IMG.warden_body)throw Error('Warden missing');const before=JSON.stringify(boss);render();if(JSON.stringify(boss)!==before)throw Error('Warden render mutation');");await shot('warden-painted');
  await check("const art=IMG.warden_body;delete IMG.warden_body;render();IMG.warden_body=art;");await shot('warden-fallback');
  await check("newRun();mode='play';level=21;worldStage=worldFrom=4;worldFade=0;worldNotice=0;hint=0;ship.inv=0;if(!IMG.world_brood||WORLDS[4].asset!=='world_brood')throw Error('Brood image');worldScroll=0;render();");await shot('brood-painted');
  await check("const h=Math.round(IMG.world_brood.height*X(PW)/IMG.world_brood.width);for(const y of [h-1,h,h+1,h*2-1,h*2,h*2+1]){worldScroll=y;render();}const before=worldScroll;paused=true;stepLogic();if(worldScroll!==before)throw Error('Brood pause');paused=false;");await shot('brood-seam');
  await check("const art=IMG.world_brood;delete IMG.world_brood;render();IMG.world_brood=art;");await shot('brood-fallback');
  await check("worldScroll=0;enemies=[{k:8,x:280,y:110,hp:8,t:60,ph:0,ct:22},{k:8,x:360,y:130,hp:8,t:80,ph:0,ct:80,flash:4}];if(!IMG.colony_body)throw Error('Colony missing');const before=JSON.stringify(enemies);render();if(JSON.stringify(enemies)!==before)throw Error('Colony render mutation');if(ctx.globalAlpha!==1||ctx.globalCompositeOperation!=='source-over')throw Error('Colony canvas leak');");await shot('colony-painted');
  await check("const art=IMG.colony_body;delete IMG.colony_body;render();IMG.colony_body=art;");await shot('colony-fallback');
  console.log('PASS 25-wave roster, five worlds/bosses, projectiles, checkpoints/shop/travel, final banking, victory wait/replay/menu, debug finale');console.log(errors);ws.close();finish(errors.length?1:0);
})().catch(e=>{console.error(e);finish(2);});
