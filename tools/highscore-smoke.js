#!/usr/bin/env node
'use strict';
const assert=require('assert'),fs=require('fs'),path=require('path'),vm=require('vm');
const root=path.dirname(__dirname),source=fs.readFileSync(path.join(root,'src','scores.js'),'utf8')+`
globalThis.__scores={cleanHighScores,startScoreRun,considerHighScore,submitHighScore,highScoreKey,highScoreTap,
  rows:()=>highScores,entry:()=>highScoreEntry,runInitials:()=>scoreRunInitials};`;
function makeStorage(initial={}){const data=new Map(Object.entries(initial));return{getItem:k=>data.has(k)?data.get(k):null,setItem:(k,v)=>data.set(k,String(v)),read:k=>data.get(k)};}
function load(best=0,initial={}){const localStorage=makeStorage(initial),save={best},sounds=[];const context=vm.createContext({console,Date,Math,JSON,String,Number,Array,localStorage,save,SFX:{ui:()=>sounds.push('ui'),power:()=>sounds.push('power')}});vm.runInContext(source,context,{filename:'src/scores.js'});return{api:context.__scores,localStorage,save,sounds};}

const migrated=load(75),api=migrated.api;
assert.deepStrictEqual(JSON.parse(JSON.stringify(api.rows())),[{initials:'---',score:75,id:'legacy-best'}],'legacy best must migrate without altering save');
assert.strictEqual(migrated.save.best,75);
api.startScoreRun();assert.strictEqual(api.considerHighScore(75),false,'ties are not new bests');
assert.strictEqual(api.considerHighScore(120),true,'new best must open initials entry');
for(const [code,key] of [['KeyC','c'],['KeyA','a'],['KeyT','t']])api.highScoreKey({code,key});
assert.deepStrictEqual(Array.from(api.entry().letters),['C','A','T']);
api.highScoreKey({code:'Enter',key:'Enter'});
assert.strictEqual(api.entry(),null);assert.strictEqual(api.rows()[0].initials,'CAT');assert.strictEqual(api.rows()[0].score,120);
assert.strictEqual(migrated.save.best,75,'score table must never mutate save.best');
assert.strictEqual(api.considerHighScore(180),false,'same run should update without asking twice');
assert.strictEqual(api.rows()[0].score,180);assert.strictEqual(api.rows().filter(row=>row.initials==='CAT').length,1,'same run must not duplicate');

api.startScoreRun();api.considerHighScore(190);api.highScoreTap({x:260,y:132});assert.strictEqual(api.entry().letters[0],'B','touch up must cycle the selected initial');
api.highScoreTap({x:320,y:170});assert.strictEqual(api.entry().position,1,'touching a letter must select it');
api.highScoreTap({x:300,y:250});assert.strictEqual(api.entry(),null,'touch SAVE must submit');

for(let i=0;i<12;i++){api.startScoreRun();api.considerHighScore(200+i);api.submitHighScore();}
assert.strictEqual(api.rows().length,10,'table must cap at ten');assert.strictEqual(api.rows()[0].score,211);assert.strictEqual(api.rows()[9].score,202);
const persisted=JSON.parse(migrated.localStorage.read('640k.sporewars.scores.v1'));assert.strictEqual(persisted.length,10);

const dirty=load(999,{'640k.sporewars.scores.v1':JSON.stringify([{initials:'x!y9z',score:'42.9'},{initials:'BAD',score:-2},null])});
assert.deepStrictEqual(JSON.parse(JSON.stringify(dirty.api.rows())),[{initials:'XYZ',score:42,id:'import-0'}],'stored rows must sanitize, sort and drop invalid scores');

const index=fs.readFileSync(path.join(root,'index.html'),'utf8'),input=fs.readFileSync(path.join(root,'src','input.js'),'utf8'),screens=fs.readFileSync(path.join(root,'src','screens.js'),'utf8');
assert(index.indexOf('src/input.js')<index.indexOf('src/scores.js')&&index.indexOf('src/scores.js')<index.indexOf('src/game.js'),'score module load order');
assert(input.includes('highScoreKey(e)')&&input.includes('highScoreTap(p)'),'keyboard and touch entry wiring');
assert(screens.includes('drawHighScoreTable(402')&&screens.includes('drawHighScoreTable(350'),'title and game-over tables');
console.log('high-score smoke passed: migration, initials, run update, top ten, keyboard and touch wiring');
