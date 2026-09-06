#!/usr/bin/env node
// Headless smoke test over raw Chrome DevTools Protocol. No npm dependencies: needs Node 22+ (global fetch/WebSocket)
// and a Chrome/Edge install. Serve the project first (any static server on port 8000), then:
//   node tools/smoke.js            -> runs the flow, writes screenshots to tools/smoke-out/, exits 1 on page errors
//   URL=http://localhost:8000/dist/spore-wars.html node tools/smoke.js   (test the release build instead)
// Flow: boot -> title -> menu arrows -> mute toggle -> play -> pause -> resume -> quit via confirmation -> workshop
// -> Esc; then ?wave=4 without god mode until the fleet is lost -> Esc back to title.
const {spawn}=require('child_process'),fs=require('fs'),path=require('path'),os=require('os');
const BASE=process.env.URL||'http://localhost:8000/index.html',PORT=9333;
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
    for(let i=0;i<80;i++){await sleep(500);const n=await evalJs("performance.getEntriesByType('resource').length");if(n===last&&n>=40)stable++;else stable=0;last=n;if(stable>=2)break;}
    await sleep(1500);};

  await go(BASE);
  const raf=await evalJs('new Promise(r=>{let n=0;const t0=performance.now();(function f(){n++;performance.now()-t0<1000?requestAnimationFrame(f):r(n)})()})');
  console.log('rAF per second:',raf);if(raf<30)errors.push('rAF starved: '+raf+'/s (is the page visible/headless?)');
  await shot('01-boot');
  await key('Enter');await sleep(900);await shot('02-title');
  await key('ArrowDown');await sleep(300);await shot('03-title-workshop-selected');
  await key('ArrowDown');await key('Enter');await sleep(300);await shot('04-title-sound-off');await key('Enter');await sleep(200);
  await key('ArrowUp');await key('ArrowUp');await key('Enter');await sleep(1500);await shot('05-play');
  await key('Escape');await sleep(400);await shot('06-paused');
  await key('Enter');await sleep(600);await shot('07-resumed');
  await key('KeyP');await sleep(300);await key('KeyP');await sleep(300);
  // Quit through the confirmation: pause, select Main menu, confirm Return to main menu.
  await key('Escape');await key('ArrowDown');await key('Enter');await sleep(300);await shot('08-exit-confirm');
  await key('ArrowDown');await key('Enter');await sleep(500);await shot('09-title-after-quit');
  await key('ArrowDown');await key('Enter');await sleep(300);await shot('10-workshop');
  await key('Escape');await sleep(300);await shot('11-title-from-workshop');

  // Game over: wave 4 gives an immediate boss; the ship never moves. Dead when the SHIPS box holds no ship pixels.
  await go(BASE+'?wave=4');
  await key('Enter');await sleep(600);await key('Enter');
  const shipsPixels=()=>evalJs(`(()=>{const c=document.querySelector('canvas');const d=c.getContext('2d').getImageData(36,258,124,30).data;let n=0;for(let i=0;i<d.length;i+=4)if(Math.abs(d[i]-14)+Math.abs(d[i+1]-28)+Math.abs(d[i+2]-41)>60)n++;return n;})()`);
  let dead=false;for(let i=0;i<40&&!dead;i++){await sleep(3000);const n=await shipsPixels();dead=n<10;console.log('run tick',i,'ship pixels',n,'dead?',dead);}
  if(!dead)errors.push('ship never died within 120 s at ?wave=4');
  await sleep(800);await shot('12-fleet-lost');
  await key('Escape');await sleep(400);await shot('13-title-from-fleet-lost');

  console.log('\n=== page errors ===');console.log(errors.length?errors.join('\n'):'(none)');
  ws.close();finish(errors.length?1:0);
})().catch(e=>{console.error('DRIVER FAILED:',e);finish(2);});
