'use strict';
// Run state, kill chain, newRun, guns, wave spawning.
let mode='boot',t=0,blink=0,shopSel=0,scroll=0,lastW=0;
let boss=null,bossWarn=0,bossDying=0,bossCount=0;let muzz=0,shieldHit=0,floats=[],evt=0,evtText='',evtCol='#fff',rings=[],bombs=0,bombFx=0,slow=0;let ship,shots,eshots,enemies,drops,booms,score,lives,cores,wpn,shield,usedContinue,shake,flash,waveT,level,fireT,hint,kills;
let formationGroup=0;
let ground=[],groundWrecks=[],groundTimer=240,groundSide=0,groundCount=0;
function resetGround(clearWrecks=true){if(clearWrecks)groundWrecks=[];ground=[];groundTimer=240;groundSide=0;groundCount=0;}
let bankedCores=0,sectorPending=false,sectorBanked=0,shopFromSector=false;
const MAX_HULL=3;
const CHAIN_TIME=240;let chain=0,chainT=0;
const chainMultiplier=()=>Math.min(4,1+Math.floor(chain/3));
function awardKill(points,x,y){chain++;chainT=CHAIN_TIME;const mult=chainMultiplier(),earned=points*mult;score+=earned;addFloat(x,y,'+'+earned+(mult>1?' x'+mult:''),C.yellow);}
function newRun(){resetGround();formationGroup=STARTWAVE?(AUTHORED_WAVES[STARTWAVE-1]?.length||0):0;sectorPending=false;sectorBanked=0;shopFromSector=false;resetRockets();resetWorld();chain=0;chainT=0;bankedCores=0;ship={x:PX+PW/2,y:LH-60,inv:60,hull:MAX_HULL,hullDisplay:MAX_HULL};shots=[];eshots=[];enemies=[];drops=[];booms=[];
  score=0;lives=3;cores=0;wpn=save.weapon;shield=save.shield;usedContinue=false;shake=0;flash=0;waveT=0;level=0;fireT=0;hint=240;kills=0;floats=[];rings=[];evt=0;bombs=1;bombFx=0;slow=0;lastW=0;boss=null;bossWarn=0;bossDying=0;bossCount=0;if(STARTWAVE)level=STARTWAVE;}
const GUN=[{n:'PULSE',dmg:1,rate:12},{n:'TWIN',dmg:1,rate:11},{n:'TRIPLE',dmg:2,rate:10},{n:'SPREAD',dmg:2,rate:16},{n:'STORM',dmg:2,rate:18}];const MAXW=4;
const spd=()=>3.7+save.engine*0.5;
const R={0:17,1:20,2:23,3:30,4:20,5:20};
// Authored formations through the first three sectors; null entries are boss waves.
// Entries are [enemy kind, count, horizontal fraction of the playfield].
const AUTHORED_WAVES=[
  [[0,2,0.5],[0,2,0.28],[0,2,0.72],[0,2,0.4],[0,2,0.65]],
  [[0,2,0.25],[0,2,0.75],[0,2,0.5],[0,2,0.3],[0,2,0.7]],
  [[0,2,0.5],[1,2,0.3],[1,2,0.7],[0,2,0.25],[1,2,0.6]],
  [[2,1,0.5],[1,2,0.5],[2,2,0.5],[1,2,0.3],[2,1,0.7]],
  null,
  // Infected Salvage: introduce lurkers singly; crawlers first appear in wave 9.
  [[0,2,0.5],[3,1,0.5],[0,2,0.3],[3,1,0.7]],
  [[3,1,0.3],[1,2,0.6],[2,1,0.7],[3,1,0.5]],
  [[2,1,0.3],[3,1,0.7],[0,2,0.5],[3,1,0.35]],
  [[4,1,0.06],[0,2,0.7],[4,1,0.94],[3,1,0.5]],
  null,
  // Spore Heart: biological attackers, building towards the final paired lurkers.
  [[5,2,0.3],[3,1,0.5],[4,2,0.94],[3,1,0.3]],
  [[4,2,0.06],[3,1,0.65],[5,2,0.65],[3,1,0.35]],
  [[3,1,0.3],[5,2,0.35],[3,1,0.7],[4,2,0.94]],
  [[4,2,0.06],[3,1,0.35],[5,2,0.65],[3,2,0.5]]
];
function spawnFormationGroup(){
  const groups=AUTHORED_WAVES[level-1],[kind,count,lane]=groups[formationGroup];
  if(kind===3&&enemies.filter(e=>e.k===3).length+count>2)return;
  formationGroup++;
  for(let i=0;i<count;i++){
    const x=PX+PW*lane+(kind===2||kind===3?(i-(count-1)/2)*110:0);
    if(kind===0)enemies.push({k:0,x,y:-24-i*80,ph:i*0.6,hp:1,t:0});
    else if(kind===1)enemies.push({k:1,x:x+(i?24:-24),y:-24-i*90,hp:1,t:0});
    else if(kind===2)enemies.push({k:2,x,y:-24-i*30,hp:3,t:0,ct:60+i*20});
    else if(kind===3)enemies.push({k:3,x,y:-40-i*30,hp:8,t:i*20,ct:80,ty:50+i*12,tent:[0,1,2,3].map(j=>({ph:j*1.7+i,len:26+j*4}))});
    else if(kind===5)enemies.push({k:5,x:x+i*40,y:-30-i*80,hp:4,t:0,ph:i*Math.PI});
    else{const edge=i%2?1-lane:lane;enemies.push({k:4,x:PX+PW*edge,y:-30-i*60,hp:4,t:0,dir:edge<0.5?1:-1,lunge:0});}
  }
  waveT=formationGroup<groups.length?(level<=4?300:270):(level<=4?120:150);
}
function spawnWave(){level++;if(level>1)SFX.wave();if(AUTHORED_WAVES[level-1]){formationGroup=0;spawnFormationGroup();return;}waveT=90;const n=Math.min(8,3+Math.floor(level/2));
  let kind=level%4===3?2:(level%3===0?1:0);
  if(level>=6&&level%3===0)kind=3;if(level>=9&&level%4===1)kind=4;if(level>=16&&level%5===1)kind=5;
  const base=level===1?PX+PW/2:PX+56+Math.random()*(PW-112);
  for(let i=0;i<n;i++){
    if(kind===0)enemies.push({k:0,x:base,y:-24-i*40,ph:i*0.6,hp:1,t:0});
    if(kind===1)enemies.push({k:1,x:PX+28+Math.random()*(PW-56),y:-24-i*48,hp:1,t:0});
    if(kind===2)enemies.push({k:2,x:PX+56+i*((PW-112)/Math.max(1,n-1)),y:-24-(i%2)*30,hp:3,t:0,ct:60+i*20});
    if(kind===3&&i<3)enemies.push({k:3,x:PX+80+i*((PW-160)/2),y:-40-i*30,hp:8,t:i*20,ct:80,ty:50+i*12,tent:[0,1,2,3].map(j=>({ph:j*1.7+i,len:26+j*4}))});
    if(kind===5&&i<4)enemies.push({k:5,x:PX+80+i*70,y:-30-i*80,hp:4,t:0,ph:i*Math.PI});
    if(kind===4&&i<4)enemies.push({k:4,x:i%2?PX+20:PX+PW-20,y:-30-i*60,hp:4,t:0,dir:i%2?1:-1,lunge:0});}
  // add a few drifters alongside the new types so the screen isn't empty
  if(kind>=3)for(let i=0;i<4;i++)enemies.push({k:0,x:base,y:-140-i*40,ph:i*0.6,hp:1,t:0});}
