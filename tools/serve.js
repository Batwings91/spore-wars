#!/usr/bin/env node
// Static dev server for the project folder (Python is not on every machine): node tools/serve.js -> http://localhost:8000
const http=require('http'),fs=require('fs'),path=require('path');
const ROOT=path.dirname(__dirname),PORT=+process.env.PORT||8000;
const T={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg','.gif':'image/gif','.json':'application/json','.m4a':'audio/mp4','.mp3':'audio/mpeg','.ogg':'audio/ogg','.wav':'audio/wav','.svg':'image/svg+xml','.txt':'text/plain','.md':'text/markdown'};
http.createServer((req,res)=>{
  let p=decodeURIComponent(new URL(req.url,'http://x').pathname);if(p.endsWith('/'))p+='index.html';
  const f=path.join(ROOT,path.normalize(p).replace(/^([\\/]|\.\.)+/,''));
  if(!f.startsWith(ROOT)){res.writeHead(403).end();return;}
  fs.stat(f,(e,st)=>{if(e||!st.isFile()){res.writeHead(404).end('not found');return;}
    res.writeHead(200,{'Content-Type':T[path.extname(f).toLowerCase()]||'application/octet-stream','Content-Length':st.size,'Cache-Control':'no-cache'});fs.createReadStream(f).pipe(res);});
}).listen(PORT,'127.0.0.1',()=>console.log('serving '+ROOT+' on http://localhost:'+PORT+'/index.html'));
