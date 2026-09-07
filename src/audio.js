'use strict';
// SFX: synthesised 8-bit effects, OPL-style fallback music, streamed main track, mute, tab audio ownership.
// ---------- Sound Blaster-style audio: OPL2 FM music + one 8-bit digitised channel ----------
const SFX=(function(){
  let ac=null,master=null,musicBus=null,pcmBus=null,muted=false,seq=null;
  try{muted=localStorage.getItem('640k.mute')==='1';}catch(e){}
  let audioBlocked=false;
  function ctx(){if(document.hidden||audioBlocked)return null;if(!ac){const A=window.AudioContext||window.webkitAudioContext;if(!A)return null;ac=new A();master=ac.createGain();master.gain.value=muted?0:0.6;master.connect(ac.destination);
      musicBus=ac.createGain();musicBus.gain.value=0.5;musicBus.connect(master);
      pcmBus=ac.createGain();pcmBus.gain.value=0.8;const lp=ac.createBiquadFilter();lp.type='lowpass';lp.frequency.value=5200;pcmBus.connect(lp);lp.connect(master);}
    if(ac.state==='suspended')ac.resume();return ac;}

  // --- OPL2-style 2-op FM voice with ADSR, sine operators, optional vibrato ---
  function opl(f,t0,dur,p){const a=ac;if(!a)return;p=Object.assign({mod:1,idx:120,idxDecay:0.3,a:0.01,d:0.15,s:0.6,r:0.12,vol:0.3,vib:0,car:'sine',bus:musicBus,fb:0},p);
    const car=a.createOscillator(),md=a.createOscillator(),mg=a.createGain(),g=a.createGain();car.type=p.car;md.type='sine';
    car.frequency.setValueAtTime(f,t0);md.frequency.setValueAtTime(f*p.mod,t0);
    mg.gain.setValueAtTime(p.idx,t0);mg.gain.exponentialRampToValueAtTime(Math.max(1,p.idx*p.idxDecay),t0+dur);
    md.connect(mg);mg.connect(car.frequency);
    if(p.vib){const lfo=a.createOscillator(),lg=a.createGain();lfo.frequency.value=5.5;lg.gain.value=f*0.012;lfo.connect(lg);lg.connect(car.frequency);lfo.start(t0+0.15);lfo.stop(t0+dur+p.r);}
    const e=g.gain;e.setValueAtTime(0.0001,t0);e.linearRampToValueAtTime(p.vol,t0+p.a);e.exponentialRampToValueAtTime(Math.max(0.0001,p.vol*p.s),t0+p.a+p.d);
    e.setValueAtTime(Math.max(0.0001,p.vol*p.s),t0+dur);e.exponentialRampToValueAtTime(0.0001,t0+dur+p.r);
    car.connect(g);g.connect(p.bus);car.start(t0);md.start(t0);car.stop(t0+dur+p.r+0.02);md.stop(t0+dur+p.r+0.02);}

  // --- one channel of "digitised" audio: render to 8-bit @ 11025 Hz, play through a lowpass ---
  const cache={};
  function pcm(name,dur,gen){const a=ctx();if(!a)return;let b=cache[name];
    if(!b){const rate=11025,n=Math.floor(rate*dur);b=a.createBuffer(1,n,rate);const d=b.getChannelData(0);let st={};for(let i=0;i<n;i++){let v=gen(i/rate,i,st);v=Math.max(-1,Math.min(1,v));d[i]=Math.round(v*127)/127;}cache[name]=b;}
    const src=a.createBufferSource();src.buffer=b;src.connect(pcmBus);src.start(a.currentTime);}
  const rnd=()=>Math.random()*2-1;
  const env=(t,att,dec)=>t<att?t/att:Math.exp(-(t-att)/dec);
  // Realistic explosion: transient crack + low rumble + mid crackle + hiss + random debris pops. Layers are one-pole filtered noise.
  function explosion(size,seed){let rs=seed*9301+49297;const r=()=>{rs=(rs*9301+49297)%233280;return rs/233280*2-1;};
    const pops=[];for(let i=0;i<8;i++)pops.push({t:0.08+Math.abs(r())*0.5*size,l:0.01+Math.abs(r())*0.02,g:0.4+Math.abs(r())*0.5});
    return (t,i,st)=>{if(!st.init){st.init=1;st.lo=0;st.lo2=0;st.mid=0;st.hi=0;}
      const w=rnd();
      st.lo+=(w-st.lo)*0.035;st.lo2+=(st.lo-st.lo2)*0.035;          // rumble ~60-120Hz
      st.mid+=(w-st.mid)*0.25;                                        // crackle band
      st.hi=w-st.hi*0.3;                                              // hiss
      const crack=t<0.012?w*(1-t/0.012):0;                            // initial transient
      const rumble=st.lo2*9*env(t,0.006,0.28*size);
      const body=st.mid*1.6*env(t,0.004,0.11*size);
      const hiss=st.hi*0.25*env(t,0.002,0.05*size);
      let debris=0;for(const p of pops){if(t>p.t&&t<p.t+p.l)debris+=w*p.g*(1-(t-p.t)/p.l);}
      const tail=st.lo*2.5*env(t,0.05,0.5*size)*(t>0.15?1:0);         // slow low decay
      return (crack*0.9+rumble+body+hiss+debris*0.6+tail)*0.55;};}
  const S={
    shot:(w)=>{const f=[900,1250,700][w];pcm('shot'+w,0.12,(t)=>Math.sign(Math.sin(2*Math.PI*f*Math.pow(0.35,t/0.12)*t))*0.5*env(t,0.002,0.03)+rnd()*0.15*env(t,0.001,0.015));},
    hit:()=>pcm('hit',0.1,(t)=>rnd()*0.7*env(t,0.002,0.03)),
    boom:(big)=>{const v=Math.floor(Math.random()*3);pcm('boom'+(big?'B':'S')+v,big?1.1:0.55,explosion(big?1:0.55,v));},
    core:()=>pcm('core',0.18,(t)=>{const f=t<0.09?1320:1760;return Math.sin(2*Math.PI*f*t)*0.5*env(t%0.09,0.003,0.04);}),
    power:()=>pcm('power',0.5,(t)=>{const k=Math.min(3,Math.floor(t/0.12)),f=[660,880,1100,1320][k];return (Math.sin(2*Math.PI*f*t)+0.4*Math.sin(2*Math.PI*f*2*t))*0.45*env(t-k*0.12,0.005,0.08);}),
    shield:()=>pcm('shield',0.5,(t)=>Math.sin(2*Math.PI*(300+t*1800)*t)*0.5*env(t,0.02,0.25)),
    shieldHit:()=>pcm('shieldHit',0.3,(t,i,st)=>{st.l=(st.l||0)*0.6+rnd()*0.4;return (st.l*2+Math.sin(2*Math.PI*1800*Math.exp(-t*4)*t))*0.5*env(t,0.002,0.09);}),
    die:()=>pcm('die',1.8,explosion(1.6,7)),
    siren:()=>{const a=ctx();if(!a)return;const t0=a.currentTime;for(let i=0;i<4;i++){opl(520,t0+i*0.5,0.22,{mod:1,idx:60,vol:0.22,a:0.01,d:0.1,s:0.6,r:0.15,bus:pcmBus,car:'sawtooth'});opl(390,t0+i*0.5+0.25,0.22,{mod:1,idx:60,vol:0.22,a:0.01,d:0.1,s:0.6,r:0.15,bus:pcmBus,car:'sawtooth'});}},
    bomb:()=>{pcm('bomb',2.2,explosion(2.4,11));const a=ctx();if(a){const t0=a.currentTime;[220,330,440,660,880].forEach((f,i)=>opl(f,t0+i*0.04,0.5,{mod:2,idx:400,idxDecay:0.1,vol:0.2,a:0.005,d:0.2,s:0.4,r:0.4,bus:pcmBus}));}},
    wave:()=>{const a=ctx();if(!a)return;const t0=a.currentTime;[440,554,659,880].forEach((f,i)=>opl(f,t0+i*0.09,0.18,{mod:2,idx:300,vol:0.25,a:0.005,d:0.1,s:0.5,r:0.15,bus:pcmBus}));},
    plasma:()=>pcm('plasma',0.2,(t)=>Math.sin(2*Math.PI*(700-t*2500)*t)*0.4*env(t,0.005,0.08)),
    ui:()=>pcm('ui',0.06,(t)=>Math.sin(2*Math.PI*990*t)*0.4*env(t,0.002,0.02)),
    boot:()=>pcm('boot',0.03,(t)=>Math.sign(Math.sin(2*Math.PI*1000*t))*0.2*env(t,0.001,0.01)),
  };

  // --- music: OPL-style arrangement. 125 bpm, 16th-note grid. A minor. ---
  const N=n=>440*Math.pow(2,(n-69)/12);
  const STEP=60/125/4; // seconds per 16th
  // chords per bar (8 bars): Am F C G | Am F E Am
  const chords=[[57,60,64],[53,57,60],[48,52,55],[55,59,62],[57,60,64],[53,57,60],[52,56,59],[57,60,64]];
  const roots=[45,41,36,43,45,41,40,45];
  // lead melody: [midi, length in 16ths]; 0 = rest. 8 bars = 128 16ths.
  const melody=[
    [69,2],[72,2],[76,4],[74,2],[72,2],[71,4],   [69,2],[71,2],[72,4],[76,2],[74,2],[72,4],
    [72,2],[74,2],[76,4],[79,2],[76,2],[74,4],   [71,2],[72,2],[74,6],[0,2],[71,2],[69,2],[67,2],[0,2],
    [69,2],[72,2],[76,4],[81,2],[79,2],[76,4],   [77,2],[76,2],[74,4],[72,2],[74,2],[76,4],
    [76,2],[74,2],[72,4],[71,2],[68,2],[71,4],   [69,8],[0,4],[64,2],[67,2]];
  let melPos=0,melWait=0,step=0;
  function tick(){if(muted)return;const a=ctx();if(!a)return;const t0=a.currentTime+0.02;const bar=Math.floor(step/16)%8,inBar=step%16;
    // drums (OPL-style): kick on 1 & 3, snare on 2 & 4, hats every 8th
    if(inBar%8===0)pcm('kick',0.25,(t)=>Math.sin(2*Math.PI*140*Math.exp(-t*12)*t)*env(t,0.002,0.12));
    if(inBar%8===4)pcm('snare',0.2,(t,i,st)=>(rnd()*0.7+Math.sin(2*Math.PI*190*t)*0.4)*env(t,0.002,0.07));
    if(inBar%2===0)pcm('hat',0.05,(t)=>rnd()*0.35*env(t,0.001,0.02));
    // bass: root on 1, octave/fifth pattern
    const r=roots[bar];const bpat=[0,null,0,null,7,null,0,null,0,null,12,null,7,null,0,null][inBar];
    if(bpat!==null)opl(N(r+bpat),t0,STEP*0.9,{mod:1,idx:250,idxDecay:0.15,a:0.005,d:0.08,s:0.5,r:0.05,vol:0.34});
    // pad chord: sustained, soft, played once per bar
    if(inBar===0)chords[bar].forEach((n,i)=>opl(N(n),t0+i*0.01,STEP*15.5,{mod:2,idx:40,idxDecay:0.5,a:0.15,d:0.3,s:0.7,r:0.3,vol:0.09,vib:1}));
    // lead
    if(melWait<=0){const [n,len]=melody[melPos];if(n)opl(N(n),t0,STEP*len*0.9,{mod:3,idx:200,idxDecay:0.25,a:0.01,d:0.12,s:0.55,r:0.15,vol:0.26,vib:len>=4});
      melWait=len;melPos=(melPos+1)%melody.length;}
    melWait--;step++;}
  const TR={main:{uri:MAIN_TRACK,gain:1.0}};let cur=null,mainOn=false;
  function loadTrack(k){const a=ctx();const t=TR[k];if(!a||t.buf||t.busy)return;t.busy=true;fetch(t.uri).then(r=>r.arrayBuffer()).then(b=>a.decodeAudioData(b)).then(buf=>{
      // trim trailing silence so the loop is tight
      const d=buf.getChannelData(0);let end=d.length-1;while(end>0&&Math.abs(d[end])<0.004)end--;t.buf=buf;t.loopEnd=(end+1)/buf.sampleRate;
      if(cur===k&&!t.src)play(k);}).catch(()=>{t.busy=false;});}
  function play(k){const a=ctx();const t=TR[k];if(!a||!t.buf||t.src)return;if(seq){clearInterval(seq);seq=null;}
    t.src=a.createBufferSource();t.src.buffer=t.buf;t.src.loop=true;t.src.loopEnd=t.loopEnd;t.g=a.createGain();t.g.gain.setValueAtTime(0.0001,a.currentTime);t.g.gain.exponentialRampToValueAtTime(mainOn?t.gain:0.0001,a.currentTime+1.0);t.src.connect(t.g);t.g.connect(master);t.src.start();}
  function stop(k){const t=TR[k];if(!t.src)return;t.src.stop();t.src.disconnect();t.g.disconnect();t.src=null;}
  function select(k){if(cur===k)return;if(cur)stop(cur);cur=k;if(!k)return;loadTrack(k);if(TR[k].buf)play(k);else if(k==='main'){step=0;melPos=0;melWait=0;if(!seq)seq=setInterval(tick,STEP*1000);}}
  // Duck the recorded loop rather than stopping it, so it keeps its position across pause, menus and focus changes.
  function music(on){on=on&&!document.hidden&&!audioBlocked;if(mainOn===on)return;mainOn=on;const t=TR.main;
    const ramp=(to,secs)=>{if(!t.src||!t.g||!ac)return;const g=t.g.gain;g.cancelScheduledValues(ac.currentTime);g.setValueAtTime(Math.max(0.0001,g.value),ac.currentTime);g.exponentialRampToValueAtTime(to,ac.currentTime+secs);};
    if(on){const a=ctx();if(a)musicBus.gain.value=0.5;if(cur!=='main')select('main');else if(t.src)ramp(t.gain,0.6);else if(!t.buf&&!seq){step=0;melPos=0;melWait=0;seq=setInterval(tick,STEP*1000);}}
    else{ramp(0.0001,0.25);if(seq){clearInterval(seq);seq=null;}if(musicBus)musicBus.gain.value=0;}}
  // Only the most recently opened/focused game copy may produce audio.
  const AUDIO_KEY='640k.sporewars.audio-owner',audioId=Date.now()+'-'+Math.random();
  let audioChannel=null;
  function silenceAudio(){music(false);if(master)master.gain.value=0;if(ac&&ac.state==='running')ac.suspend().catch(()=>{});}
  function takeAudio(){if(document.hidden)return;audioBlocked=false;if(master)master.gain.value=muted?0:0.6;
    if(audioChannel)audioChannel.postMessage(audioId);
    try{localStorage.setItem(AUDIO_KEY,audioId);}catch(e){}
  }
  function otherAudio(id){if(typeof id!=='string'||id===audioId)return;audioBlocked=true;silenceAudio();}
  try{audioChannel=new BroadcastChannel(AUDIO_KEY);audioChannel.onmessage=e=>otherAudio(e.data);}catch(e){}
  addEventListener('storage',e=>{if(e.key===AUDIO_KEY&&e.newValue)otherAudio(e.newValue);});
  addEventListener('focus',takeAudio);
  addEventListener('blur',()=>{audioBlocked=true;silenceAudio();});
  // A click/key also reacquires audio when another visible window took ownership.
  for(const event of ['pointerdown','keydown'])addEventListener(event,()=>{if(audioBlocked)takeAudio();});
  document.addEventListener('visibilitychange',()=>{if(document.hidden){audioBlocked=true;silenceAudio();}else takeAudio();});
  addEventListener('pagehide',()=>{audioBlocked=true;silenceAudio();if(ac){ac.close().catch(()=>{});ac=null;}});
  addEventListener('pageshow',takeAudio);
  takeAudio();
  function bossTheme(on){/* boss track removed: main theme plays throughout */}
  function loadBoss(){loadTrack('main');}
  function toggleMute(){muted=!muted;if(master)master.gain.value=muted?0:0.6;try{localStorage.setItem('640k.mute',muted?'1':'0');}catch(e){}return muted;}
  return Object.assign(S,{music,bossTheme,toggleMute,isMuted:()=>muted,unlock:ctx,preload:loadBoss});
})();
