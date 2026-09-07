'use strict';
// Run state, kill chain, newRun, guns, wave spawning.
let mode='boot',t=0,blink=0,shopSel=0,scroll=0,lastW=0;
let boss=null,bossWarn=0,bossDying=0,bossCount=0;let muzz=0,shieldHit=0,floats=[],evt=0,evtText='',evtCol='#fff',rings=[],bombs=0,bombFx=0,slow=0;let ship,shots,eshots,enemies,drops,booms,score,lives,cores,wpn,shield,usedContinue,shake,flash,waveT,level,fireT,hint,kills;
let bankedCores=0,sectorPending=false,sectorBanked=0,shopFromSector=false;
const CHAIN_TIME=240;let chain=0,chainT=0;
const chainMultiplier=()=>Math.min(4,1+Math.floor(chain/3));
function awardKill(points,x,y){chain++;chainT=CHAIN_TIME;const mult=chainMultiplier(),earned=points*mult;score+=earned;addFloat(x,y,'+'+earned+(mult>1?' x'+mult:''),C.yellow);}
function newRun(){sectorPending=false;sectorBanked=0;shopFromSector=false;resetRockets();resetWorld();chain=0;chainT=0;bankedCores=0;ship={x:PX+PW/2,y:LH-60,inv:60};shots=[];eshots=[];enemies=[];drops=[];booms=[];
  score=0;lives=3;cores=0;wpn=save.weapon;shield=save.shield;usedContinue=false;shake=0;flash=0;waveT=0;level=0;fireT=0;hint=240;kills=0;floats=[];rings=[];evt=0;bombs=1;bombFx=0;slow=0;lastW=0;boss=null;bossWarn=0;bossDying=0;bossCount=0;if(STARTWAVE)level=STARTWAVE;}
const GUN=[{n:'PULSE',dmg:1,rate:12},{n:'TWIN',dmg:1,rate:11},{n:'TRIPLE',dmg:2,rate:10},{n:'SPREAD',dmg:2,rate:14},{n:'STORM',dmg:2,rate:14}];const MAXW=4;
const spd=()=>3.7+save.engine*0.5;
const R={0:17,1:20,2:23,3:30,4:20};
function spawnWave(){level++;if(level>1)SFX.wave();const n=Math.min(8,3+Math.floor(level/2));
  // Opening: scouts, scouts, diving bombers, aimed-fire frigates, then the boss.
  let kind=level<=4?[0,0,1,2][level-1]:(level%4===3?2:(level%3===0?1:0));
  if(level>=6&&level%3===0)kind=3;if(level>=9&&level%4===1)kind=4;
  const base=level===1?PX+PW/2:PX+56+Math.random()*(PW-112);
  for(let i=0;i<n;i++){
    if(kind===0)enemies.push({k:0,x:base,y:-24-i*40,ph:i*0.6,hp:1,t:0});
    if(kind===1)enemies.push({k:1,x:PX+28+Math.random()*(PW-56),y:-24-i*48,hp:1,t:0});
    if(kind===2)enemies.push({k:2,x:PX+56+i*((PW-112)/Math.max(1,n-1)),y:-24-(i%2)*30,hp:3,t:0,ct:60+i*20});
    if(kind===3&&i<3)enemies.push({k:3,x:PX+80+i*((PW-160)/2),y:-40-i*30,hp:8,t:i*20,ct:80,ty:50+i*12,tent:[0,1,2,3].map(j=>({ph:j*1.7+i,len:26+j*4}))});
    if(kind===4&&i<4)enemies.push({k:4,x:i%2?PX+20:PX+PW-20,y:-30-i*60,hp:4,t:0,dir:i%2?1:-1,lunge:0});}
  // add a few drifters alongside the new types so the screen isn't empty
  if(kind>=3)for(let i=0;i<4;i++)enemies.push({k:0,x:base,y:-140-i*40,ph:i*0.6,hp:1,t:0});}
