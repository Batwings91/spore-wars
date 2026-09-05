#!/usr/bin/env python3
"""Inline every file in assets/ into index.html and write dist/spore-wars.html (single-file release build)."""
import base64,json,os,re
root=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
src=open(os.path.join(root,'index.html'),encoding='utf8').read()
data={}
for f in sorted(os.listdir(os.path.join(root,'assets'))):
    name,ext=os.path.splitext(f)
    if ext in ('.png','.webp'):
        data[name]='data:image/'+ext[1:]+';base64,'+base64.b64encode(open(os.path.join(root,'assets',f),'rb').read()).decode()
music='data:audio/mp4;base64,'+base64.b64encode(open(os.path.join(root,'assets','fly.m4a'),'rb').read()).decode()
out=re.sub(r"const ASSET_DATA=\{.*?\};[^\n]*\n","const ASSET_DATA="+json.dumps(data)+";\n",src,count=1,flags=re.S)
out=re.sub(r"const MAIN_TRACK='[^']*';","const MAIN_TRACK='"+music+"';",out,count=1)
os.makedirs(os.path.join(root,'dist'),exist_ok=True)
open(os.path.join(root,'dist','spore-wars.html'),'w',encoding='utf8').write(out)
print('wrote dist/spore-wars.html',len(out)//1024,'KB')
