#!/usr/bin/env node
'use strict';
const assert=require('assert'),fs=require('fs'),path=require('path'),vm=require('vm');
const root=path.dirname(__dirname),source=fs.readFileSync(path.join(root,'src','ads.js'),'utf8')+'\nglobalThis.__ads=ads;';
function load(extra={}){
  const context=vm.createContext(Object.assign({console,Promise,Set,setTimeout,clearTimeout},extra));
  vm.runInContext(source,context,{filename:'src/ads.js'});return context.__ads;
}
async function turn(){await new Promise(resolve=>setTimeout(resolve,0));}
(async()=>{
  const stub=load();
  assert.strictEqual(stub.ready(),false,'SDK-free builds must use the stub');
  assert.strictEqual(await stub.showRewarded('continue'),true,'stub continue must grant immediately');
  assert.strictEqual(await stub.showRewarded('doubleCores'),true,'stub double-cores must grant immediately');
  await assert.rejects(stub.showRewarded('unknown'),/Unknown rewarded-ad kind/);

  const calls=[],listeners=[];
  const SDK={environment:'local',init:async()=>calls.push('init'),ad:{requestAd:(type,callbacks)=>{calls.push(type);SDK.callbacks=callbacks;}},game:{settings:{muteAudio:true},addSettingsChangeListener:fn=>listeners.push(fn),gameplayStart:()=>calls.push('start'),gameplayStop:()=>calls.push('stop')}};
  const live=load({CrazyGames:{SDK}}),adStates=[],mutes=[];
  live.configure({onAdState:on=>adStates.push(on),onMuteChange:on=>mutes.push(on)});
  await turn();
  assert.strictEqual(live.ready(),true,'local CrazyGames SDK must initialize');
  assert.deepStrictEqual(mutes,[false,true],'configure must receive the platform mute setting');
  listeners[0]({muteAudio:false});assert.strictEqual(mutes.at(-1),false,'settings changes must release platform mute');
  live.setGameplay(true);live.setGameplay(true);live.setGameplay(false);
  assert.deepStrictEqual(calls.filter(x=>x==='start'||x==='stop'),['start','stop'],'gameplay lifecycle must be deduplicated');
  const rewarded=live.showRewarded('continue');await turn();
  assert.strictEqual(calls.at(-1),'rewarded');SDK.callbacks.adStarted();
  assert.deepStrictEqual(adStates,[true]);assert.strictEqual(mutes.at(-1),true,'ad start must mute');
  SDK.callbacks.adFinished();assert.strictEqual(await rewarded,true,'finished rewarded ad must grant');
  assert.deepStrictEqual(adStates,[true,false]);assert.strictEqual(mutes.at(-1),false,'ad finish must restore mute state');
  const failed=live.showRewarded('doubleCores');await turn();SDK.callbacks.adStarted();SDK.callbacks.adError({code:'unfilled'});
  assert.strictEqual(await failed,false,'failed rewarded ad must not grant');

  const index=fs.readFileSync(path.join(root,'index.html'),'utf8'),screens=fs.readFileSync(path.join(root,'src','screens.js'),'utf8'),main=fs.readFileSync(path.join(root,'src','main.js'),'utf8');
  assert(index.includes('crazygames-sdk-v3.js')&&index.indexOf('src/ads.js')<index.indexOf('src/input.js'),'v3 SDK and adapter script order');
  assert(screens.includes("claimReward('continue'")&&screens.includes("claimReward('doubleCores'"),'both reward surfaces use the adapter');
  assert(main.includes('ads.setGameplay(gameplay)')&&main.includes('onMuteChange:SFX.setExternalMute'),'lifecycle and audio hooks are wired');
  console.log('ads smoke passed: stub, SDK init, rewards, mute and gameplay lifecycle');
})().catch(error=>{console.error(error);process.exitCode=1;});
