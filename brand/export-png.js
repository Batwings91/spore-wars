#!/usr/bin/env node
// Rasterise brand/svg/*.svg to brand/png/ using headless Chrome (no npm deps). Run after gen.js.
// Chrome is found via $CHROME or the usual install paths. Pixel-perfect: the SVGs use crispEdges and
// integer cell sizes, and each job renders at an integer device scale factor.
const {execFileSync}=require('child_process'),fs=require('fs'),path=require('path'),os=require('os');
const CANDIDATES=[process.env.CHROME,'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe','C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome','/usr/bin/google-chrome','/usr/bin/chromium'].filter(Boolean);
const CHROME=CANDIDATES.find(p=>fs.existsSync(p));if(!CHROME){console.error('No Chrome/Edge found; set CHROME=<path>');process.exit(1);}
const OUT=path.join(__dirname,'png');fs.mkdirSync(OUT,{recursive:true});
const profile=fs.mkdtempSync(path.join(os.tmpdir(),'640k-png-'));
for(const j of JSON.parse(fs.readFileSync(path.join(__dirname,'png-jobs.json'),'utf8'))){
  const svgPath=path.join(__dirname,'svg',j.svg+'.svg'),s=fs.readFileSync(svgPath,'utf8');
  const w=+s.match(/ width="(\d+)"/)[1],h=+s.match(/ height="(\d+)"/)[1];
  const out=path.join(OUT,`${j.svg}@${j.scale}x.png`);
  const args=['--headless=new','--disable-gpu','--hide-scrollbars','--no-first-run','--user-data-dir='+profile,
    '--window-size='+w+','+h,'--force-device-scale-factor='+j.scale,'--screenshot='+out];
  if(j.alpha)args.push('--default-background-color=00000000');
  args.push('file:///'+svgPath.replace(/\\/g,'/'));
  execFileSync(CHROME,args,{stdio:'ignore'});
  console.log('wrote',path.relative(process.cwd(),out),`${w*j.scale}x${h*j.scale}`);
}
fs.rmSync(profile,{recursive:true,force:true});
