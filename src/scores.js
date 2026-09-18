'use strict';
// Local DOS-style high scores. Kept separate from save.best so the long-standing save contract remains intact.
const SCORES_KEY='640k.sporewars.scores.v1';
function cleanInitials(value,legacy=false){
  const s=String(value||'').toUpperCase().replace(/[^A-Z-]/g,'').slice(0,3);
  return s.length===3&&(legacy||!s.includes('-'))?s:(legacy?'---':'AAA');
}
function cleanHighScores(raw){
  if(!Array.isArray(raw))return[];
  return raw.map((entry,i)=>({initials:cleanInitials(entry&&entry.initials,true),score:Math.max(0,Math.floor(Number(entry&&entry.score)||0)),id:String(entry&&entry.id||'import-'+i)}))
    .filter(entry=>entry.score>0).sort((a,b)=>b.score-a.score).slice(0,10);
}
let storedScores=null,hadStoredScores=false;
try{const raw=localStorage.getItem(SCORES_KEY);if(raw!==null){hadStoredScores=true;storedScores=JSON.parse(raw);}}catch(e){}
let highScores=cleanHighScores(storedScores);
if(!hadStoredScores&&save.best>0)highScores=[{initials:'---',score:save.best,id:'legacy-best'}];
function persistHighScores(){try{localStorage.setItem(SCORES_KEY,JSON.stringify(highScores));}catch(e){}}
if(hadStoredScores||highScores.length)persistHighScores();
let highScoreEntry=null,scoreRunBaseline=save.best,scoreRunId='',scoreRunInitials='';
function startScoreRun(){scoreRunBaseline=save.best;scoreRunId=Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,8);scoreRunInitials='';highScoreEntry=null;}
function recordHighScore(initials,score,id=scoreRunId){
  const entry={initials:cleanInitials(initials),score:Math.max(0,Math.floor(score)),id},at=highScores.findIndex(row=>row.id===id);
  if(at>=0)highScores[at]=entry;else highScores.push(entry);
  highScores.sort((a,b)=>b.score-a.score);highScores=highScores.slice(0,10);persistHighScores();
}
function considerHighScore(score){
  score=Math.max(0,Math.floor(score));if(score<=scoreRunBaseline)return false;
  if(scoreRunInitials){recordHighScore(scoreRunInitials,score);return false;}
  if(!highScoreEntry)highScoreEntry={letters:['A','A','A'],position:0,score};else highScoreEntry.score=Math.max(highScoreEntry.score,score);
  return true;
}
function changeInitial(delta){if(!highScoreEntry)return;const p=highScoreEntry.position,n=highScoreEntry.letters[p].charCodeAt(0)-65;highScoreEntry.letters[p]=String.fromCharCode(65+(n+delta+26)%26);SFX.ui();}
function setInitial(letter){if(!highScoreEntry||!/^[A-Z]$/.test(letter))return;highScoreEntry.letters[highScoreEntry.position]=letter;highScoreEntry.position=Math.min(2,highScoreEntry.position+1);SFX.ui();}
function submitHighScore(){if(!highScoreEntry)return;scoreRunInitials=highScoreEntry.letters.join('');recordHighScore(scoreRunInitials,highScoreEntry.score);highScoreEntry=null;SFX.power();}
function highScoreKey(e){
  if(!highScoreEntry)return false;
  if(e.code==='ArrowUp')changeInitial(1);
  else if(e.code==='ArrowDown')changeInitial(-1);
  else if(e.code==='ArrowLeft')highScoreEntry.position=(highScoreEntry.position+2)%3;
  else if(e.code==='ArrowRight')highScoreEntry.position=(highScoreEntry.position+1)%3;
  else if(e.code==='Enter')submitHighScore();
  else if(e.key&&/^[a-z]$/i.test(e.key))setInitial(e.key.toUpperCase());
  return true;
}
function highScoreTap(p){
  if(!highScoreEntry)return false;
  const centers=[260,320,380];
  for(let i=0;i<3;i++)if(Math.abs(p.x-centers[i])<=24&&p.y>=126&&p.y<=219){highScoreEntry.position=i;if(p.y<=151)changeInitial(1);else if(p.y>=194)changeInitial(-1);else SFX.ui();return true;}
  if(p.x>=250&&p.x<=390&&p.y>=238&&p.y<=272){submitHighScore();return true;}
  return true;
}
startScoreRun();
