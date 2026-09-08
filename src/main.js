'use strict';
// Run transitions (clearScene/quitRun/continueRun), the fixed-step loop, stepLogic() and render().
// drawField() draws the live world (enemies, boss, booms, floats), and the title uses it as a backdrop:
// clear the run's transient state on every return to the title so nothing bleeds through.
function clearScene(){orbActive=false;resetGround();resetRockets();resetSideLasers();enemies=[];eshots=[];shots=[];drops=[];booms=[];floats=[];rings=[];boss=null;bossWarn=0;bossDying=0;}
function quitRun(){clearScene();save.cores+=cores-bankedCores;bankedCores=cores;if(score>save.best)save.best=score;persist();setPaused(false);mode='title';t=0;SFX.bossTheme(false);}
function continueRun(){resetGround();resetRockets();resetSideLasers();chain=0;chainT=0;usedContinue=true;mode='play';lives=2;ship.hull=ship.hullDisplay=MAX_HULL;ship.inv=120;eshots=[];enemies=[];flash=6;}

newRun();
let lastT=0,acc=0;
function frame(now){const STEP=1000/60;const dt=lastT?Math.min(50,now-lastT):STEP;lastT=now;acc+=dt;let steps=0;while(acc>=STEP&&steps<3){acc-=STEP;steps++;stepLogic();}if(steps>0)render();requestAnimationFrame(frame);}
function stepLogic(){if(!paused)ship.hullDisplay+=Math.max(-0.08,Math.min(0.08,ship.hull-ship.hullDisplay));if(exitWait>0)exitWait--;blink++;if(mode!=='play'&&!paused){t++;if(mode!=='sector')scroll=(scroll+0.9)%TH;}
  if(shake>0)shake--;if(flash>0)flash--;
  if(mode==='boot'){bootBeep();if(tapped&&t>60&&(assetsReady||assetsFailed)){SFX.unlock();SFX.preload();mode='title';t=0;}}
  else if(mode==='title'){if(tapped&&t>10){const i=tapSrc==='ptr'?TITLE_BUTTONS.findIndex(b=>ptr.x>=b.x&&ptr.x<=b.x+b.w&&ptr.y>=b.y&&ptr.y<=b.y+b.h):titleSel;if(i===1)mode='shop';else if(i===2||i===3)titleAudioAction(i,tapSrc==='ptr'?ptr.x:undefined);else if(i===0){newRun();mode='play';t=0;}}}
  else if(mode==='play'){if(!paused){if(slow>0){slow--;if(blink%2===0)update();}else update();}}
  else if(mode==='travel'){if(!paused)updateSectorTravel();}
  else if(mode==='dead'){if(tapped){if(tapSrc==='key')chooseDead(deadSel);else if(ptr.x>=LW/2-130&&ptr.x<=LW/2+130){const i=Math.floor((ptr.y-176)/23);if(i>=0&&i<deadOptions().length)chooseDead(i);}}}
  else if(mode==='sector'||mode==='victory'){if(tapped&&t>15){if(t<60)t=60;else if(tapSrc==='key')chooseSector(sectorSel);else if(ptr.x>=LW/2-130&&ptr.x<=LW/2+130){if(ptr.y>=184&&ptr.y<=216)chooseSector(0);else if(ptr.y>=228&&ptr.y<=260)chooseSector(1);}}}
  else if(mode==='shop'){if(tapped){if(tapSrc==='key'){if(shopSel===SHOP.length)leaveShop();else buy();}else{const i=shopHitTest(ptr.x,ptr.y);if(i>=0){shopSel=i;shopItem=i;}else if(ptr.y>=298&&ptr.y<=330){if(ptr.x>=510&&ptr.x<=614)leaveShop();else if(ptr.x>=292&&ptr.x<=500&&shopSel<SHOP.length)buy();}}}}
  if(mode!=='title')SFX.stopPreview();
  // Music runs through play and the sector travel sequence; ducking it for the 3-second flight read as the track stopping.
  SFX.music(((mode==='play'||mode==='travel')&&!paused)||(mode==='title'&&SFX.previewing()),worldStage);
  tapped=false;}
// Draw exactly once per animation frame. Catch-up logic steps no longer multiply the render cost, which used to
// triple the drawing work on a device that was already falling behind.
function render(){
  if(mode==='boot')bootScreen();
  else if(mode==='title')titleScreen();
  else if(mode==='play'){playScene();if(paused)pauseScreen();}
  else if(mode==='dead')deadScreen();
  else if(mode==='sector'||mode==='victory')sectorScreen();
  else if(mode==='travel'){sectorTravelScreen();if(paused)pauseScreen();}
  else if(mode==='shop')shopScreen();}
requestAnimationFrame(frame);
