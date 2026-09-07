#!/usr/bin/env python3
"""Release build -> dist/. PNG sprites are inlined into dist/index.html; WebP illustrations and the music are copied to
dist/assets/ and load after boot. Upload the dist/ folder as one zip with index.html at the root. Same output as build.js."""
import base64,json,os,re,shutil
root=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
assets=os.path.join(root,'assets');dist=os.path.join(root,'dist');dist_assets=os.path.join(dist,'assets')
src=open(os.path.join(root,'index.html'),encoding='utf8').read()
shutil.rmtree(dist,ignore_errors=True);os.makedirs(dist_assets)
data={};copied=0;copied_bytes=0
for f in sorted(os.listdir(assets)):
    name,ext=os.path.splitext(f);full=os.path.join(assets,f)
    if ext=='.png':
        data[name]='data:image/png;base64,'+base64.b64encode(open(full,'rb').read()).decode()
    else:
        shutil.copyfile(full,os.path.join(dist_assets,f));copied+=1;copied_bytes+=os.path.getsize(full)
out=re.sub(r"const ASSET_DATA=\{.*?\};[^\n]*\n","const ASSET_DATA="+json.dumps(data)+";\n",src,count=1,flags=re.S)
open(os.path.join(dist,'index.html'),'w',encoding='utf8').write(out)
print('wrote dist/index.html',len(out.encode('utf8'))//1024,'KB (initial download); dist/assets/',copied,'files',copied_bytes//1024,'KB loaded after boot')
