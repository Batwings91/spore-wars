#!/usr/bin/env node
// Release build -> dist/. PNG sprites are inlined into dist/index.html as data URIs; the WebP illustrations and the
// music are copied to dist/assets/ and load from there (the game fetches them after boot). Upload the dist/ folder
// as one zip with index.html at the root. Node port of build.py: byte-identical index.html.
const fs=require('fs'),path=require('path');
const root=path.dirname(__dirname),assets=path.join(root,'assets'),dist=path.join(root,'dist'),distAssets=path.join(dist,'assets');
const src=fs.readFileSync(path.join(root,'index.html'),'utf8');
fs.rmSync(dist,{recursive:true,force:true});fs.mkdirSync(distAssets,{recursive:true});
const data={};let copied=0,copiedBytes=0;
for(const f of fs.readdirSync(assets).sort()){
  const ext=path.extname(f),full=path.join(assets,f);
  if(ext==='.png')data[path.basename(f,ext)]='data:image/png;base64,'+fs.readFileSync(full).toString('base64');
  else{fs.copyFileSync(full,path.join(distAssets,f));copied++;copiedBytes+=fs.statSync(full).size;}
}
// Match Python json.dumps separators so both builders produce the same bytes.
const dumps=o=>'{'+Object.entries(o).map(([k,v])=>JSON.stringify(k)+': '+JSON.stringify(v)).join(', ')+'}';
const out=src.replace(/const ASSET_DATA=\{[\s\S]*?\};[^\n]*\n/,()=>'const ASSET_DATA='+dumps(data)+';\n');
fs.writeFileSync(path.join(dist,'index.html'),out,'utf8');
const kb=n=>Math.round(n/1024);
console.log('wrote dist/index.html',kb(Buffer.byteLength(out,'utf8')),'KB (initial download); dist/assets/',copied,'files',kb(copiedBytes),'KB loaded after boot');
