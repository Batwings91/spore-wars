#!/usr/bin/env node
// Rendering cost and asset-fallback probe over CDP (no npm deps). Serve the project on 8000 first.
//   node tools/perf-probe.js            -> for several waves: ms per update()/render() and canvas calls per frame,
//                                          once with all art and once with every WebP blocked (fallback path),
//                                          screenshots in tools/smoke-out/perf-*.png, exit 1 on page errors.
// Desktop numbers are not phone numbers, but the ratios between waves and between art/fallback are what matter.
const {spawn}=require('child_process'),fs=require('fs'),path=require('path'),os=require('os');
const BASE=process.env.URL||'http://localhost:8000/index.html',PORT=9341,WAVES=(process.env.WAVES||'1,6,11,16,21').split(',').map(Number);
const CANDIDATES=[process.env.CHROME,'C:/Program Files/Google/Chrome/Application/chrome.exe','C:/Program Files (x86)/Google/Chrome/Application/chrome.exe','C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe','/Applications/Google Chrome.app/Contents/MacOS/Google Chrome','/usr/bin/google-chrome','/usr/bin/chromium'].filter(Boolean);
const EXE=CANDIDATES.find(p=>fs.existsSync(p));if(!EXE){console.error('No Chrome/Edge found; set CHROME=<path>');process.exit(2);}
const OUT=path.join(__dirname,'smoke-out');fs.mkdirSync(OUT,{recursive:true});
const profile=fs.mkdtempSync(path.join(os.tmpdir(),'spore-perf-'));
const chrome=spawn(EXE,['--headless=new','--disable-gpu','--no-first-run','--no-default-browser-check','--autoplay-policy=no-user-gesture-required','--remote-debugging-port='+PORT,'--window-size=1280,760','--user-data-dir='+profile,'about:blank'],{stdio:'ignore'});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));const errors=[];
function finish(code){try{chrome.kill();}catch(e){}try{fs.rmSync(profile,{recursive:true,force:true});}catch(e){}process.exit(code);}
(async()=>{
  let wsUrl;for(let i=0;i<50&&!wsUrl;i++){try{const l=await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();const pg=l.find(t=>t.type==='page');if(pg)wsUrl=pg.webSocketDebuggerUrl;}catch(e){}if(!wsUrl)await sleep(200);}
  if(!wsUrl)throw new Error('no CDP page target');
  const ws=new WebSocket(wsUrl);await new Promise(r=>ws.onopen=r);let id=0;const pending={};
  ws.onmessage=ev=>{const m=JSON.parse(ev.data);if(m.id&&pending[m.id]){pending[m.id](m.result||m.error);delete pending[m.id];}
    if(m.method==='Runtime.exceptionThrown')errors.push('EXCEPTION: '+(m.params.exceptionDetails.exception?.description||m.params.exceptionDetails.text));
    if(m.method==='Runtime.consoleAPICalled'&&(m.params.type==='error'||m.params.type==='warning'))errors.push(m.params.type.toUpperCase()+': '+m.params.args.map(a=>a.value??a.description).join(' '));
    if(m.method==='Log.entryAdded'&&m.params.entry.level==='error'&&!/favicon|ERR_BLOCKED_BY_CLIENT/.test(m.params.entry.text+m.params.entry.url))errors.push('LOG: '+m.params.entry.text+' '+(m.params.entry.url||''));};
  const send=(method,params={})=>new Promise(r=>{const i=++id;pending[i]=r;ws.send(JSON.stringify({id:i,method,params}));});
  await send('Page.enable');await send('Runtime.enable');await send('Log.enable');await send('Network.enable');
  const evalJs=async expr=>(await send('Runtime.evaluate',{expression:expr,returnByValue:true,awaitPromise:true})).result?.value;
  const key=async code=>{const b={code,key:code==='Enter'?'Enter':' ',windowsVirtualKeyCode:13,nativeVirtualKeyCode:13};await send('Input.dispatchKeyEvent',{type:'rawKeyDown',...b});await send('Input.dispatchKeyEvent',{type:'keyUp',...b});await sleep(60);};
  const shot=async name=>{const r=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync(path.join(OUT,name+'.png'),Buffer.from(r.data,'base64'));};
  const go=async url=>{await send('Page.navigate',{url});let last=-1,stable=0;for(let i=0;i<80;i++){await sleep(500);const n=await evalJs("performance.getEntriesByType('resource').length");if(n===last&&i>=2)stable++;else stable=0;last=n;if(stable>=2)break;}await sleep(1500);};
  // Wrap the global update()/render() and count canvas calls; sample N frames.
  const PROBE=`(()=>{const P=CanvasRenderingContext2D.prototype,names=['drawImage','fill','stroke','fillRect','strokeRect','fillText','createRadialGradient','createLinearGradient','save','restore'];
    const counts={};for(const n of names){counts[n]=0;const o=P[n];P['__'+n]=o;P[n]=function(){counts[n]++;return o.apply(this,arguments);};}
    let uT=0,rT=0,frames=0;const u=update,r=render;update=function(){const t0=performance.now();u();uT+=performance.now()-t0;};render=function(){const t0=performance.now();r();rT+=performance.now()-t0;frames++;};
    return new Promise(res=>setTimeout(()=>{update=u;render=r;for(const n of names)P[n]=P['__'+n];const per={};for(const n of names)per[n]=+(counts[n]/frames).toFixed(1);
      res({frames,updateMs:+(uT/frames).toFixed(2),renderMs:+(rT/frames).toFixed(2),calls:per,enemies:enemies.length,ground:ground.length,wrecks:groundWrecks.length,booms:booms.length,world:worldStage,mode});},3000));})()`;
  const results=[];
  for(const blocked of [false,true]){
    await send('Network.setBlockedURLs',{urls:blocked?['*.webp']:[]});
    for(const w of WAVES){await go(BASE+'?god=1&wave='+w);await key('Enter');await sleep(800);await key('Enter');await sleep(6000);
      const r=await evalJs(PROBE);r.wave=w;r.art=blocked?'fallback':'painted';results.push(r);await shot('perf-'+(blocked?'fallback':'painted')+'-w'+w);
      console.log((blocked?'FALLBACK':'PAINTED ').padEnd(9),'wave',String(w).padStart(2),'world',r.world,' update',r.updateMs,'ms  render',r.renderMs,'ms  drawImage',r.calls.drawImage,' fill',r.calls.fill,' stroke',r.calls.stroke,' grad',r.calls.createRadialGradient+r.calls.createLinearGradient,' save/restore',r.calls.save,' enemies',r.enemies,'ground',r.ground,'wrecks',r.wrecks);}
  }
  console.log('\n=== page errors ===');console.log(errors.length?errors.join('\n'):'(none)');ws.close();finish(errors.length?1:0);
})().catch(e=>{console.error('DRIVER FAILED:',e);finish(2);});
