#!/usr/bin/env node
'use strict';
const assert=require('assert'),fs=require('fs'),path=require('path');
const root=path.dirname(__dirname),assets=path.join(root,'assets'),dist=path.join(root,'dist');
const credits=fs.readFileSync(path.join(root,'CREDITS.txt'),'utf8'),disclosure=credits.split('Art credits')[0];
const files=fs.readdirSync(assets).filter(name=>fs.statSync(path.join(assets,name)).isFile()).sort();
const missingCredits=files.filter(name=>!credits.includes(name));
assert.deepStrictEqual(missingCredits,[],'CREDITS.txt is missing assets: '+missingCredits.join(', '));
const aiAssets=['battleship_hull.webp','colony_body.webp','crawler_body.webp','ground_bunkers.webp','ground_sentries.webp','lurker_body.webp','matriarch_body.webp','mech_body.webp','menu_hangar.webp','mothership_body.webp','needle_body.webp','player_hull.png','seeder_body.webp','spore_skimmer.webp','trader_shop.webp','wall_fauna.png','warden_body.webp','world_brood.webp','world_foundry.webp','world_heart.webp','world_labyrinth.webp','world_salvage.webp','world_wilds.webp'];
const missingDisclosure=aiAssets.filter(name=>!disclosure.includes(name));
assert.deepStrictEqual(missingDisclosure,[],'AI disclosure is missing runtime assets: '+missingDisclosure.join(', '));
assert(credits.includes('AI coding assistants')&&credits.includes('no AI-generated music'),'AI disclosure must cover code assistance and excluded media');
const index=path.join(dist,'index.html');assert(fs.existsSync(index),'Run node tools/build.js before the release audit');
const initialBytes=fs.statSync(index).size,limit=8*1024*1024;
assert(initialBytes<limit,`Initial download is ${(initialBytes/1048576).toFixed(2)} MB, over the 8 MB target`);
assert(fs.existsSync(path.join(dist,'CREDITS.txt')),'Release build must include CREDITS.txt');
assert.strictEqual(fs.readFileSync(path.join(dist,'CREDITS.txt'),'utf8'),credits,'Release credits must match the source file');
const deferred=files.filter(name=>path.extname(name).toLowerCase()!=='.png');
for(const name of deferred){const built=path.join(dist,'assets',name);assert(fs.existsSync(built),'Missing deferred release asset: '+name);assert.strictEqual(fs.statSync(built).size,fs.statSync(path.join(assets,name)).size,'Release asset size differs: '+name);}
const html=fs.readFileSync(index,'utf8');for(const name of files.filter(name=>path.extname(name).toLowerCase()==='.png')){const key=JSON.stringify(path.basename(name,'.png'))+': "data:image/png;base64,';assert(html.includes(key),'PNG data must be embedded in release HTML: '+name);}
console.log(`release audit passed: ${(initialBytes/1048576).toFixed(2)} MB initial (<8 MB), ${files.length}/${files.length} assets credited, ${aiAssets.length} AI runtime assets disclosed, CREDITS.txt packaged`);
