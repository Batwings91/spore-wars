#!/usr/bin/env node
// 640K Games logo generator. Letters are a 5x7 bitmap font rendered as SVG <rect>s: no font dependency,
// crisp at any integer scale, editable in any vector tool or by changing a '#' below. Run: node brand/gen.js
// Writes brand/svg/*.svg and brand/png-jobs.json (consumed by brand/export-png.sh for the PNG set).
const fs=require('fs'),path=require('path');
const OUT=path.join(__dirname,'svg');fs.mkdirSync(OUT,{recursive:true});

const F={
'6':['.###.','#....','#....','####.','#...#','#...#','.###.'],
'4':['#...#','#...#','#...#','#####','....#','....#','....#'],
'0':['.###.','#...#','#..##','#.#.#','##..#','#...#','.###.'],
'K':['#...#','#..#.','#.#..','##...','#.#..','#..#.','#...#'],
'G':['.###.','#...#','#....','#.###','#...#','#...#','.###.'],
'A':['.###.','#...#','#...#','#####','#...#','#...#','#...#'],
'M':['#...#','##.##','#.#.#','#.#.#','#...#','#...#','#...#'],
'E':['#####','#....','#....','####.','#....','#....','#####'],
'S':['.####','#....','#....','.###.','....#','....#','####.'],
'C':['.###.','#...#','#....','#....','#....','#...#','.###.'],
':':['.....','..#..','..#..','.....','..#..','..#..','.....'],
'\\':['#....','#....','.#...','..#..','...#.','....#','....#'],
'>':['.....','#....','.#...','..#..','.#...','#....','.....'],
'B':['#####','#####','#####','#####','#####','#####','#####'],   // block cursor
'_':['.....','.....','.....','.....','.....','#####','#####'],   // underscore cursor
' ':['.....','.....','.....','.....','.....','.....','.....'],
};
// Render a string at (x,y) with cell size px. Horizontal runs are merged into one rect each.
function text(s,x,y,px,fill,attr=''){let o='',cx=x;for(const ch of s){const g=F[ch];if(!g)throw new Error('no glyph '+ch);
  g.forEach((row,r)=>{let c=0;while(c<5){if(row[c]==='#'){let w=0;while(c+w<5&&row[c+w]==='#')w++;o+=`<rect x="${cx+c*px}" y="${y+r*px}" width="${w*px}" height="${px}" fill="${fill}"${attr}/>`;c+=w;}else c++;}});
  cx+=6*px;}return o;}
const cells=s=>s.length*6-1;

// Palette: the game's UI colours, so the mark sits naturally in the HUD.
const INK={full:{prompt:'#a8a8a8',name:'#ffc83c',games:'#e8e8f0',cursor:'#e8e8f0'},
           light:{prompt:'#e8e8f0',name:'#e8e8f0',games:'#e8e8f0',cursor:'#e8e8f0'},
           dark:{prompt:'#0c0e1a',name:'#0c0e1a',games:'#0c0e1a',cursor:'#0c0e1a'}};
const BLINK='<style>.cursor{animation:blink 1s steps(1) infinite}@keyframes blink{50%{opacity:0}}</style>';
const svg=(w,h,body,{bg,animated}={})=>`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" shape-rendering="crispEdges" role="img" aria-label="640K Games">
${animated?BLINK+'\n':''}${bg?`<rect width="${w}" height="${h}" fill="${bg}"/>\n`:''}${body}
</svg>
`;
const jobs=[];const write=(name,s,png)=>{fs.writeFileSync(path.join(OUT,name+'.svg'),s);if(png)jobs.push(...png.map(j=>({svg:name,...j})));};

// ---- Wordmark: C:\>640K GAMES + cursor. 1x = 6 px per cell, 24 px margin -> 588 x 90.
function wordmark(ink,{cursor='B',bg,animated}={}){const px=6,m=24,s='C:\\>640K GAMES',W=m*2+cells(s+'B')*px,H=m*2+7*px;
  const b=text('C:\\>',m,m,px,ink.prompt)+text('640K',m+24*px,m,px,ink.name)+text(' GAMES',m+48*px,m,px,ink.games)
        +text(cursor,m+s.length*6*px,m,px,ink.cursor,' class="cursor"');   // cursor in the next character cell
  return svg(W,H,b,{bg,animated});}
write('640k-prompt',wordmark(INK.full,{bg:'#000000'}),[{scale:1},{scale:2},{scale:4}]);
write('640k-prompt-transparent',wordmark(INK.full),[{scale:2,alpha:true}]);
write('640k-prompt-animated',wordmark(INK.full,{bg:'#000000',animated:true}));
write('640k-prompt-underscore',wordmark(INK.full,{cursor:'_',bg:'#000000'}));
write('640k-prompt-mono-light',wordmark(INK.light),[{scale:2,alpha:true}]);
write('640k-prompt-mono-dark',wordmark(INK.dark),[{scale:2,alpha:true}]);

// ---- Icon: ">640K" over "GAMES" on a 32-cell square (1 px per cell at 1x). Avatar, favicon, HUD badge.
function icon(ink,{bg}={}){const S=32,px=1,x=1;
  const b=text('>',x,8,px,ink.prompt)+text('640K',x+6,8,px,ink.name)+text('GAMES',x,17,px,ink.games);
  return svg(S,S,b,{bg});}
write('640k-icon',icon(INK.full,{bg:'#000000'}),[{scale:1},{scale:2},{scale:4},{scale:8}]);
write('640k-icon-transparent',icon(INK.full),[{scale:8,alpha:true}]);
write('640k-icon-mono-light',icon(INK.light),[{scale:8,alpha:true}]);
write('640k-icon-mono-dark',icon(INK.dark),[{scale:8,alpha:true}]);

fs.writeFileSync(path.join(__dirname,'png-jobs.json'),JSON.stringify(jobs,null,1));
console.log('wrote',fs.readdirSync(OUT).length,'svg files and',jobs.length,'png jobs');
