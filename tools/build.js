#!/usr/bin/env node
// Release build -> dist/. The src/*.js files are inlined into dist/index.html in place of their <script src> tags,
// PNG sprites become data URIs, and the WebP illustrations and the music are copied to dist/assets/ (fetched after
// boot). Upload the dist/ folder as one zip with index.html at the root. Node port of build.py: byte-identical output.
const fs=require('fs'),path=require('path');
const root=path.dirname(__dirname),assets=path.join(root,'assets'),dist=path.join(root,'dist'),distAssets=path.join(dist,'assets');
let html=fs.readFileSync(path.join(root,'index.html'),'utf8');
fs.rmSync(dist,{recursive:true,force:true});fs.mkdirSync(distAssets,{recursive:true});
const data={};let copied=0,copiedBytes=0;
for(const f of fs.readdirSync(assets).sort()){
  const ext=path.extname(f),full=path.join(assets,f);
  if(ext==='.png')data[path.basename(f,ext)]='data:image/png;base64,'+fs.readFileSync(full).toString('base64');
  else{fs.copyFileSync(full,path.join(distAssets,f));copied++;copiedBytes+=fs.statSync(full).size;}
}
// Match Python json.dumps separators so both builders produce the same bytes.
const dumps=o=>'{'+Object.entries(o).map(([k,v])=>JSON.stringify(k)+': '+JSON.stringify(v)).join(', ')+'}';
html=html.replace(/<script src="(src\/[^"]+)"><\/script>/g,(m,src)=>'<script>\n'+fs.readFileSync(path.join(root,src),'utf8')+'</script>');
html=html.replace(/const ASSET_DATA=\{[\s\S]*?\};[^\n]*\n/,()=>'const ASSET_DATA='+dumps(data)+';\n');
fs.writeFileSync(path.join(dist,'index.html'),html,'utf8');
const kb=n=>Math.round(n/1024);
console.log('wrote dist/index.html',kb(Buffer.byteLength(html,'utf8')),'KB (initial download); dist/assets/',copied,'files',kb(copiedBytes),'KB loaded after boot');
