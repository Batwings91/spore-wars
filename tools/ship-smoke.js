#!/usr/bin/env node
// Campaign regression over Chrome DevTools Protocol. Serve the game on port 8000, then run node tools/campaign-smoke.js.
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

  await check("newRun();mode='play';ship.inv=0;hint=0;level=1;worldNotice=0;if(!IMG.player_hull)throw Error('hull missing');");
  for(let gun=0;gun<5;gun++){
    await check("wpn="+gun+";save.engine=2;shield=2;podOpen=wpn>=3?24:0;rocketFlash=0;render()");await shot('ship-tier-'+gun);
    await check("const before=JSON.stringify([save,wpn,shield,podOpen,rocketT,rocketSide]);drawEquipmentPreview('weapon',"+gun+",343,120);if(JSON.stringify([save,wpn,shield,podOpen,rocketT,rocketSide])!==before)throw Error('preview mutation');");
  }
  await check("save.weapon=2;save.engine=2;save.shield=2;save.cores=200;mode='shop';shopSel=0;render()");await shot('ship-workshop');
  await check("const old=drawShipAssembly;let got;drawShipAssembly=(x,y,loadout)=>{got=loadout;};drawEquipmentPreview('weapon',4,0,0);drawShipAssembly=old;if(got.weapon!==4||got.engine!==2||got.shield!==2)throw Error('preview lost equipment');");
  await check("mode='play';const old=IMG.player_hull;delete IMG.player_hull;render();IMG.player_hull=old;");await shot('ship-fallback');
  console.log('PASS five gun tiers, full loadout preview, state immutability and fallback');console.log(errors);ws.close();finish(errors.length?1:0);
})().catch(e=>{console.error(e);finish(2);});
