'use strict';
// Player bolts, gun mounts, and the gun-level-four homing rockets.
// Player-only, cached white/cyan bolts: needle, rails, spear, chevron, split lance.
// Generated once at render resolution; no per-shot gradients or shared enemy sprites.
const BOLT=Array.from({length:5},(_,level)=>{
  const o=document.createElement('canvas');o.width=24;o.height=52;
  const g=o.getContext('2d');
  const shapes=[
    [[12,1],[15,12],[14,28],[10,28],[9,12]],
    [[8,2],[11,10],[10,28],[6,28],[5,10]],
    [[12,0],[19,15],[14,12],[15,31],[9,31],[10,12],[5,15]],
    [[12,1],[22,18],[16,15],[14,30],[10,30],[8,15],[2,18]],
    [[7,0],[11,12],[10,32],[4,32],[3,12]]
  ];
  const tail=g.createLinearGradient(0,18,0,52);tail.addColorStop(0,'rgba(52,213,246,0.65)');tail.addColorStop(1,'rgba(52,213,246,0)');
  g.fillStyle=tail;g.fillRect(level===4?4:9,18,level===4?16:6,34);
  const paint=(points,offset=0)=>{
    g.beginPath();points.forEach(([x,y],i)=>{if(i)g.lineTo(x+offset,y);else g.moveTo(x+offset,y);});g.closePath();
    g.fillStyle='#34bbdb';g.fill();g.strokeStyle='#102d43';g.lineWidth=1;g.stroke();
  };
  paint(shapes[level]);if(level===1)paint(shapes[level],8);if(level===4)paint(shapes[level],10);
  g.fillStyle='#eaffff';
  if(level===1){g.fillRect(7,8,2,17);g.fillRect(15,8,2,17);}
  else if(level===4){g.fillRect(6,7,2,23);g.fillRect(16,7,2,23);g.fillRect(9,16,6,2);}
  else{g.fillRect(11,7,2,level>=2?21:17);}
  return o;
});
// Visual mount locations mirror the existing shot origins; firing logic is unchanged.
const GUN_PORTS=[[[0,-32]],[[-14,-20],[14,-20]],[[0,-34],[-16,-20],[16,-20]],
  [[0,-34],[-14,-22],[14,-22],[-22,-14],[22,-14]],
  [[-6,-34],[6,-34],[-18,-22],[18,-22],[-26,-12],[26,-12]]];
function drawGunMounts(gun=wpn,sx=ship.x,sy=ship.y,flash=muzz){
  ctx.save();
  for(const [ox,oy] of GUN_PORTS[gun]){
    const x=X(sx+ox),y=X(sy+oy),w=[5,5,6,7,8][gun],length=[24,26,32,29,36][gun];
    // Solid shaded receivers and one barrel per shot origin.
    ctx.fillStyle='#0c141a';ctx.beginPath();ctx.moveTo(x-w+2,y+9);ctx.lineTo(x+w-2,y+9);ctx.lineTo(x+w,y+16);ctx.lineTo(x+w,y+length);ctx.lineTo(x-w,y+length);ctx.lineTo(x-w,y+16);ctx.closePath();ctx.fill();
    ctx.fillStyle='#53616a';ctx.fillRect(x-w+2,y+15,w*2-4,length-17);
    ctx.fillStyle='#95a4aa';ctx.fillRect(x-w+2,y+15,2,length-18);
    ctx.fillStyle='#283239';ctx.fillRect(x+1,y+15,w-2,length-17);
    ctx.fillStyle='#b49b64';ctx.fillRect(x-w+1,y+length-5,w*2-2,3);
    ctx.fillStyle='#080f15';ctx.fillRect(x-3,y,6,19);
    ctx.fillStyle='#9aafb6';ctx.fillRect(x-2,y+2,2,15);ctx.fillStyle='#3a4b54';ctx.fillRect(x,y+2,2,15);
    ctx.fillStyle='#b7f7ff';ctx.fillRect(x-1,y,2,3);
    if(gun>=2)for(let i=0;i<(gun===4?4:3);i++){ctx.fillStyle='#253038';ctx.fillRect(x-w-1,y+16+i*4,w*2+2,2);ctx.fillStyle='#7d898e';ctx.fillRect(x-w,y+16+i*4,3,1);}
    if(flash>0){ctx.globalAlpha=flash/6;ctx.fillStyle='#36bada';ctx.beginPath();ctx.moveTo(x,y-15);ctx.lineTo(x+w,y-2);ctx.lineTo(x,y+3);ctx.lineTo(x-w,y-2);ctx.closePath();ctx.fill();ctx.fillStyle='#efffff';ctx.fillRect(x-1,y-10,2,11);ctx.globalAlpha=1;}
  }
  ctx.restore();
}

// Small original player-only missile; cached at startup like the main bolts.
const ROCKET=(()=>{const c=document.createElement('canvas');c.width=20;c.height=40;const g=c.getContext('2d');
  g.fillStyle='#173348';g.beginPath();g.moveTo(10,1);g.lineTo(15,10);g.lineTo(15,23);g.lineTo(19,30);g.lineTo(1,30);g.lineTo(5,23);g.lineTo(5,10);g.closePath();g.fill();
  g.fillStyle='#819aa7';g.fillRect(6,11,8,17);g.fillStyle='#eaffff';g.fillRect(7,9,3,18);
  g.fillStyle='#54e5ff';g.fillRect(6,14,8,3);g.fillRect(8,29,4,9);return c;})();
let podOpen=0,rocketT=120,rocketSide=-1,rocketFlash=0;
function resetRockets(){podOpen=0;rocketT=120;rocketSide=-1;rocketFlash=0;if(shots)shots=shots.filter(s=>!s.rocket);}
function rocketTarget(x,y){
  const candidates=enemies.concat(ground).filter(e=>e.hp>0&&e.y>0&&e.y<y&&e.x>PX&&e.x<PX+PW);
  if(!candidates.length)return boss&&!bossDying&&boss.hp>0&&boss.y>=boss.ty&&boss.y<y?boss:null;
  let best=null,rank=Infinity;
  for(const e of candidates){const reserved=shots.some(s=>s.rocket&&s.y>0&&s.target===e);const r=Math.hypot(e.x-x,e.y-y)+(reserved?1000:0);if(r<rank){best=e;rank=r;}}
  return best;
}
function updateRockets(){
  if(rocketFlash>0)rocketFlash--;
  podOpen=Math.max(0,Math.min(24,podOpen+(wpn>=3?1:-1)));
  if(wpn<3)rocketT=120;
  else if(podOpen===24&&--rocketT<=0&&shots.filter(s=>s.rocket&&s.y>0).length<3){
    const x=ship.x+rocketSide*40,target=rocketTarget(x,ship.y);
    if(target){shots.push({x,y:ship.y-8,vx:rocketSide*0.7,vy:-2.4,g:wpn,dmg:1,rocket:true,target,life:180,retargeted:false});rocketSide*=-1;rocketT=120;rocketFlash=12;}
  }
  for(const s of shots){if(!s.rocket||s.y<-50)continue;
    if(--s.life<=0){s.y=-99;continue;}
    if(!s.target||s.target.hp<=0||!(enemies.includes(s.target)||ground.includes(s.target)||(s.target===boss&&!bossDying))||s.target.y<0||s.target.y>LH){
      s.target=s.retargeted?null:rocketTarget(s.x,s.y);s.retargeted=true;
    }
    let angle=Math.atan2(s.vy,s.vx);
    if(s.target){const desired=Math.atan2(s.target.y-s.y,s.target.x-s.x);const delta=Math.atan2(Math.sin(desired-angle),Math.cos(desired-angle));angle+=Math.max(-0.055,Math.min(0.055,delta));}
    const speed=Math.min(4.2,Math.hypot(s.vx,s.vy)+0.06);s.vx=Math.cos(angle)*speed;s.vy=Math.sin(angle)*speed;
  }
}
function drawRocketPods(sx=ship.x,sy=ship.y,openTicks=podOpen,flash=rocketFlash,nextSide=rocketSide){if(openTicks<=0)return;ctx.save();
  for(const side of [-1,1]){const open=openTicks/24,ease=open*open*(3-2*open),firing=flash>0&&side===-nextSide;
    const x=sx+side*(25+15*ease),y=sy+(firing?flash*0.3:0);
    ctx.fillStyle='#6a8392';ctx.fillRect(X(Math.min(sx+side*24,x)),X(y+4),X(Math.abs(x-sx-side*24)),X(4));
    ctx.fillStyle='#142331';ctx.fillRect(X(x-6),X(y-8),X(12),X(23));ctx.strokeStyle='#bda477';ctx.lineWidth=1;ctx.strokeRect(X(x-6),X(y-8),X(12),X(23));
    ctx.fillStyle='#617b8b';ctx.fillRect(X(x-4),X(y+2),X(8),X(11));ctx.fillStyle='#080e18';ctx.fillRect(X(x-3),X(y-7),X(6),X(7));
    ctx.fillStyle='#a0b6be';ctx.fillRect(X(x-5),X(y-7-5*ease),X(10),X(3*(1-ease)+1));
    ctx.fillStyle=openTicks<24?'#dca761':'#83efff';ctx.fillRect(X(x+side*3-1),X(y+6),X(2),X(5));
    // Visible magazines use the player missile's silver body and cyan band.
    if(openTicks>=12)for(const offset of [-2,2]){ctx.fillStyle='#c6d5d9';ctx.fillRect(X(x+offset)-1,X(y-4),2,X(9));ctx.fillStyle='#6be7f6';ctx.fillRect(X(x+offset)-1,X(y),2,2);}
    ctx.fillStyle='#83efff';ctx.fillRect(X(x-2),X(y-6),X(4),X(2));
    if(firing){ctx.globalAlpha=flash/12;ctx.fillStyle='#eaffff';ctx.beginPath();ctx.moveTo(X(x-4),X(y-8));ctx.lineTo(X(x),X(y-22));ctx.lineTo(X(x+4),X(y-8));ctx.fill();ctx.fillStyle='#5bdaeb';ctx.beginPath();ctx.moveTo(X(x-3),X(y+14));ctx.lineTo(X(x),X(y+25));ctx.lineTo(X(x+3),X(y+14));ctx.fill();ctx.globalAlpha=1;}
  }ctx.restore();
}
