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
    const x=X(sx+ox),y=X(sy+oy);
    // Larger housings and cooling fins make upgrades visible on the ship itself.
    const width=[5,6,7,9,10][gun],length=[24,26,32,29,36][gun];
    ctx.beginPath();ctx.moveTo(x-width,y+8);ctx.lineTo(x-width+3,y-2);ctx.lineTo(x+width-3,y-2);
    ctx.lineTo(x+width,y+8);ctx.lineTo(x+width,y+length);ctx.lineTo(x-width,y+length);ctx.closePath();
    ctx.fillStyle='#142331';ctx.fill();ctx.strokeStyle='#8da4b0';ctx.lineWidth=1;ctx.stroke();
    ctx.fillStyle='#536e7d';ctx.fillRect(x-width+2,y+9,width*2-4,length-11);
    ctx.fillStyle='#bacfd7';ctx.fillRect(x-width+2,y+10,2,length-13);
    if(gun===1||gun===4){
      ctx.fillStyle='#0a1623';ctx.fillRect(x-5,y,4,18);ctx.fillRect(x+1,y,4,18);
      ctx.fillStyle='#b3f6ff';ctx.fillRect(x-4,y,2,14);ctx.fillRect(x+2,y,2,14);
    }else{
      ctx.fillStyle='#0a1623';ctx.fillRect(x-3,y,6,gun===2?24:18);
      ctx.fillStyle='#b3f6ff';ctx.fillRect(x-1,y,2,gun===2?22:14);
    }
    if(gun>=2)for(let i=0;i<(gun===4?4:3);i++){
      ctx.fillStyle=i%2?'#78909d':'#304652';ctx.fillRect(x-width-2,y+12+i*5,width*2+4,2);
    }
    if(gun>=3){
      ctx.fillStyle='#12394a';ctx.fillRect(x-width+2,y+length-7,width*2-4,4);
      ctx.fillStyle='#61e6f4';ctx.fillRect(x-width+3,y+length-6,(width*2-6)*(flash>0?1:0.5),2);
    }
    if(flash>0){
      ctx.globalAlpha=flash/6;ctx.fillStyle='#36bada';ctx.beginPath();ctx.moveTo(x,y-15);ctx.lineTo(x+width,y-2);ctx.lineTo(x,y+3);ctx.lineTo(x-width,y-2);ctx.closePath();ctx.fill();
      ctx.fillStyle='#efffff';ctx.fillRect(x-1,y-10,2,11);ctx.globalAlpha=1;
    }
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
  const candidates=enemies.filter(e=>e.hp>0&&e.y>0&&e.y<y&&e.x>PX&&e.x<PX+PW);
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
    if(target){shots.push({x,y:ship.y-8,vx:rocketSide*0.7,vy:-2.4,g:wpn,dmg:1,rocket:true,target,life:180,retargeted:false});rocketSide*=-1;rocketT=120;rocketFlash=8;}
  }
  for(const s of shots){if(!s.rocket||s.y<-50)continue;
    if(--s.life<=0){s.y=-99;continue;}
    if(!s.target||s.target.hp<=0||!(enemies.includes(s.target)||(s.target===boss&&!bossDying))||s.target.y<0||s.target.y>LH){
      s.target=s.retargeted?null:rocketTarget(s.x,s.y);s.retargeted=true;
    }
    let angle=Math.atan2(s.vy,s.vx);
    if(s.target){const desired=Math.atan2(s.target.y-s.y,s.target.x-s.x);const delta=Math.atan2(Math.sin(desired-angle),Math.cos(desired-angle));angle+=Math.max(-0.055,Math.min(0.055,delta));}
    const speed=Math.min(4.2,Math.hypot(s.vx,s.vy)+0.06);s.vx=Math.cos(angle)*speed;s.vy=Math.sin(angle)*speed;
  }
}
function drawRocketPods(){if(podOpen<=0)return;ctx.save();
  for(const side of [-1,1]){const x=ship.x+side*(25+15*podOpen/24),y=ship.y;
    ctx.fillStyle='#6a8392';ctx.fillRect(X(Math.min(ship.x+side*24,x)),X(y+4),X(Math.abs(x-ship.x-side*24)),X(4));
    ctx.fillStyle='#142331';ctx.fillRect(X(x-6),X(y-8),X(12),X(23));ctx.strokeStyle='#91a8b5';ctx.lineWidth=1;ctx.strokeRect(X(x-6),X(y-8),X(12),X(23));
    ctx.fillStyle='#617b8b';ctx.fillRect(X(x-4),X(y+2),X(8),X(11));ctx.fillStyle='#080e18';ctx.fillRect(X(x-3),X(y-7),X(6),X(7));
    ctx.fillStyle='#83efff';ctx.fillRect(X(x-2),X(y-6),X(4),X(2));
    if(rocketFlash>0&&side===-rocketSide){ctx.fillStyle='#eaffff';ctx.fillRect(X(x-2),X(y-13),X(4),X(6));}
  }ctx.restore();
}
