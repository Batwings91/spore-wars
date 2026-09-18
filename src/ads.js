'use strict';
// Portal advertising adapter. CrazyGames v3 is optional: itch.io/dev builds keep rewards functional via the stub.
const ads=(function(root){
  const KINDS=new Set(['continue','doubleCores']);
  let state='loading',inFlight=false,adActive=false,gameplayWanted=false,gameplayReported=null,platformMuted=false;
  let hooks={onAdState:()=>{},onMuteChange:()=>{}};
  const sdk=()=>root.CrazyGames&&root.CrazyGames.SDK;
  const enabled=s=>s&&s.environment!=='disabled';
  function applyMute(){hooks.onMuteChange(platformMuted||adActive);}
  function configure(next={}){
    if(typeof next.onAdState==='function')hooks.onAdState=next.onAdState;
    if(typeof next.onMuteChange==='function')hooks.onMuteChange=next.onMuteChange;
    applyMute();
  }
  function updateSettings(s){
    platformMuted=!!(s.game&&s.game.settings&&s.game.settings.muteAudio);applyMute();
  }
  function flushGameplay(){
    const s=sdk();if(state!=='ready'||!enabled(s)||!s.game)return;
    if(gameplayReported===null&&!gameplayWanted){gameplayReported=false;return;}
    if(gameplayReported===gameplayWanted)return;
    try{(gameplayWanted?s.game.gameplayStart:s.game.gameplayStop).call(s.game);gameplayReported=gameplayWanted;}catch(e){}
  }
  const initPromise=(async()=>{
    const s=sdk();if(!s||typeof s.init!=='function'){state='stub';return false;}
    try{
      await s.init();
      if(!enabled(s)){state='stub';return false;}
      state='ready';updateSettings(s);
      if(s.game&&typeof s.game.addSettingsChangeListener==='function')s.game.addSettingsChangeListener(settings=>{platformMuted=!!settings.muteAudio;applyMute();});
      flushGameplay();return true;
    }catch(e){state='stub';return false;}
  })();
  function ready(){return state==='ready';}
  function setGameplay(active){gameplayWanted=!!active;flushGameplay();}
  async function showRewarded(kind){
    if(!KINDS.has(kind))throw new Error('Unknown rewarded-ad kind: '+kind);
    if(inFlight)return false;
    inFlight=true;
    const available=await initPromise,s=sdk();
    if(!available||!enabled(s)||!s.ad||typeof s.ad.requestAd!=='function'){inFlight=false;return true;}
    return new Promise(resolve=>{
      let settled=false;
      const finish=granted=>{if(settled)return;settled=true;if(adActive){adActive=false;hooks.onAdState(false);applyMute();}inFlight=false;resolve(granted);};
      try{s.ad.requestAd('rewarded',{
        adStarted:()=>{if(adActive)return;adActive=true;hooks.onAdState(true);applyMute();},
        adFinished:()=>finish(true),
        adError:()=>finish(false),
      });}catch(e){finish(false);}
    });
  }
  return{ready,showRewarded,setGameplay,configure};
})(typeof window==='undefined'?globalThis:window);
