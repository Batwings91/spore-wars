#!/usr/bin/env node
// Inline every file in assets/ into index.html and write dist/spore-wars.html (single-file release build).
// Node port of build.py. Byte-identical output, so it does not matter which one you run.
const fs=require('fs'),path=require('path');
const root=path.dirname(__dirname);
const src=fs.readFileSync(path.join(root,'index.html'),'utf8');
const assets=path.join(root,'assets');
const data={};
for(const f of fs.readdirSync(assets).sort()){
  if(f.endsWith('.png'))data[f.slice(0,-4)]='data:image/png;base64,'+fs.readFileSync(path.join(assets,f)).toString('base64');
}
const music='data:audio/mp4;base64,'+fs.readFileSync(path.join(assets,'fly.m4a')).toString('base64');
// Match Python json.dumps, which separates with ", " and ": " — keeps both builders byte-identical.
const dumps=o=>'{'+Object.entries(o).map(([k,v])=>JSON.stringify(k)+': '+JSON.stringify(v)).join(', ')+'}';
// Replacer functions, not strings: $-sequences in a replacement string would be interpreted.
let out=src.replace(/const ASSET_DATA=\{[\s\S]*?\};[^\n]*\n/,()=>'const ASSET_DATA='+dumps(data)+';\n');
out=out.replace(/const MAIN_TRACK='[^']*';/,()=>"const MAIN_TRACK='"+music+"';");
fs.mkdirSync(path.join(root,'dist'),{recursive:true});
fs.writeFileSync(path.join(root,'dist','spore-wars.html'),out,'utf8');
console.log('wrote dist/spore-wars.html',Math.floor(Buffer.byteLength(out,'utf8')/1024),'KB');
