const C=document.querySelector('#game'),ctx=C.getContext('2d');
const W=C.width,H=C.height,T=32,COLS=28,ROWS=20;
const $=s=>document.querySelector(s);
const dom={};
function cacheDom(){
  for(const id of ['score','lives','combo','power','wallet','skillHud','objective','objectiveText','checkpointText','pauseBtn','mainMenu','toast','comboBar','pulseFx'])dom[id]=document.getElementById(id);
}
const keys=Object.create(null),pressed=Object.create(null);
const touch={up:false,down:false,left:false,right:false,dash:false,skill:false};
const touchPressed={dash:false,skill:false};
let gamepadDash=false,gamepadSkill=false;

function inputKey(e){
  if(e.code==='Space')return 'space';
  return String(e.key||'').toLowerCase();
}
addEventListener('keydown',e=>{
  if(typeof ensureAudio==='function')ensureAudio();
  const k=inputKey(e);
  if(!keys[k]&&!e.repeat)pressed[k]=true;
  keys[k]=true;
  if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();
});
addEventListener('keyup',e=>{
  keys[inputKey(e)]=false;
  if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();
});
addEventListener('blur',()=>{for(const k of Object.keys(keys))keys[k]=false;for(const k of Object.keys(pressed))pressed[k]=false;for(const k of Object.keys(touch))touch[k]=false;touchPressed.dash=false;touchPressed.skill=false;gamepadDash=false;gamepadSkill=false});
document.addEventListener('visibilitychange',()=>{
  if(document.hidden){
    for(const k of Object.keys(keys))keys[k]=false;for(const k of Object.keys(pressed))pressed[k]=false;for(const k of Object.keys(touch))touch[k]=false;touchPressed.dash=false;touchPressed.skill=false;gamepadDash=false;gamepadSkill=false;
    if(running)pauseGame();
  }
});

const paths={
  player:{idle:6,move:6,dash:5,overdrive:6,hurt:4,death:6},
  enemies:{hunter:4,strategist:4,ambusher:4,phase:4,sentinel:6,stalker:6,voidweaver:6},
  powers:['speed','shield','magnet','freeze','phase','teleport']
};
const images={player:{},enemies:{},powers:{},fragment:[],crystal:[],key:[],battery:[],terminalOff:[],terminalActive:[],doorLocked:[],doorOpen:[],checkpointOff:[],checkpointOn:[],boss:{idle:[],attack:[],hurt:[],death:[]},boss2:{idle:[],attack:[],hurt:[],death:[]},boss3:{idle:[],attack:[],hurt:[],death:[]},pulse:[]};

function loadImage(src){
  return new Promise(resolve=>{
    const i=new Image();
    i.onload=()=>resolve(i);
    i.onerror=()=>{console.warn('[Maze Hunter] asset ausente:',src);resolve(null)};
    i.src=src;
  });
}
async function load(){
  const pending=[];
  const queue=(src,target,index)=>pending.push(loadImage(src).then(image=>{target[index]=image}));
  for(const [anim,n] of Object.entries(paths.player)){
    images.player[anim]=[];
    for(let i=0;i<n;i++)queue(`assets/sprites/player/${anim}/${String(i).padStart(2,'0')}.webp`,images.player[anim],i);
  }
  for(const [e,n] of Object.entries(paths.enemies)){
    images.enemies[e]=[];
    for(let i=0;i<n;i++)queue(`assets/sprites/enemies/${e}/move/${String(i).padStart(2,'0')}.webp`,images.enemies[e],i);
  }
  for(const p of paths.powers)pending.push(loadImage(`assets/sprites/powerups/${p}.webp`).then(image=>{images.powers[p]=image}));
  for(let i=0;i<4;i++){
    queue(`assets/sprites/collectibles/fragment_${String(i).padStart(2,'0')}.webp`,images.fragment,i);
    queue(`assets/sprites/collectibles/crystal_${String(i).padStart(2,'0')}.webp`,images.crystal,i);
    queue(`assets/sprites/items/door_locked/${String(i).padStart(2,'0')}.webp`,images.doorLocked,i);
    queue(`assets/sprites/items/door_open/${String(i).padStart(2,'0')}.webp`,images.doorOpen,i);
  }
  for(let i=0;i<6;i++){
    queue(`assets/sprites/items/key/${String(i).padStart(2,'0')}.webp`,images.key,i);
    queue(`assets/sprites/items/battery/${String(i).padStart(2,'0')}.webp`,images.battery,i);
    queue(`assets/sprites/items/terminal_off/${String(i).padStart(2,'0')}.webp`,images.terminalOff,i);
    queue(`assets/sprites/items/terminal_active/${String(i).padStart(2,'0')}.webp`,images.terminalActive,i);
    queue(`assets/sprites/items/checkpoint_off/${String(i).padStart(2,'0')}.webp`,images.checkpointOff,i);
    queue(`assets/sprites/items/checkpoint_on/${String(i).padStart(2,'0')}.webp`,images.checkpointOn,i);
    for(const s of ['idle','attack','hurt','death']){
      queue(`assets/sprites/bosses/core_warden/${s}/${String(i).padStart(2,'0')}.webp`,images.boss[s],i);
      queue(`assets/sprites/bosses/neon_overmind/${s}/${String(i).padStart(2,'0')}.webp`,images.boss2[s],i);
      queue(`assets/sprites/bosses/abyss_engine/${s}/${String(i).padStart(2,'0')}.webp`,images.boss3[s],i);
    }
    queue(`assets/sprites/skills/pulse/${String(i).padStart(2,'0')}.webp`,images.pulse,i);
  }
  await Promise.all(pending);
}

const M1=[
"############################",
"#............##............#",
"#.####.#####.##.#####.####.#",
"#o####.#####.##.#####.####o#",
"#..........................#",
"#.####.##.########.##.####.#",
"#......##....##....##......#",
"######.##### ## #####.######",
"     #.##          ##.#     ",
"######.## ###  ### ##.######",
"      .   #      #   .      ",
"######.## ######## ##.######",
"     #.##          ##.#     ",
"######.## ######## ##.######",
"#............##............#",
"#.####.#####.#..#####.####.#",
"#o..##................##..o#",
"###.##.##.########.##.##.###",
"#......##....##....##......#",
"############################"
];
const M2=[
"############################",
"#o....#..............#....o#",
"#.##.#.####.####.####.#.##.#",
"#....#....#......#....#....#",
"####.####.#.####.#.####.####",
"#.........#....#.#.........#",
"#.######.####.##.####.######",
"#......#............#......#",
"###.##.#.##########.#.##.###",
"#...##.....#....#.....##...#",
"#.######.#.#.##.#.#.######.#",
"#........#........#........#",
"####.###.##########.###.####",
"#....#................#....#",
"#.##.#.######..######.#.##.#",
"#o...#......#..#......#...o#",
"###.######..#..#..######.###",
"#..........##..##..........#",
"#..........................#",
"############################"
];
const M3=[
"############################",
"#o......#..........#......o#",
"#.####..#.########.#..####.#",
"#......##....##....##......#",
"###.##....##....##....##.###",
"#...##.##.##.##.##.##.##..##",
"#.####.##....##....##.####.#",
"#......####.####.####......#",
"####.#................#.####",
"#....#.####.######.####.#..#",
"#.##.#....#......#....#.#..#",
"#.##.####.#.####.#.####.##.#",
"#........##......##........#",
"####.##....######....##.####",
"#....##.##........##.##....#",
"#.######.####..####.######.#",
"#o........................o#",
"###.####.#####.####.####.###",
"#..........................#",
"############################"
];


const M4=[
"############################",
"#o....#..............#....o#",
"#.##..#.####.####.####.#.###",
"#....##....#......#....##..#",
"###.....##.#.####.#.##.....#",
"#.#####.##.#....#.#.##.#####",
"#.....#....####.#....#.....#",
"####.###.#......#.###.####.#",
"#....#...#.####.#...#......#",
"#.##.#.###.#..#.###.#.##.###",
"#....#........#.....#......#",
"##.####.##.####.##.####.####",
"#......#..........#........#",
"####.#.#####..#####.#.####.#",
"#....#............#.#......#",
"#.######.##.##.##.######.###",
"#o.......##....##........o.#",
"###.####.#####.####.####.###",
"#..........................#",
"############################"
];


const levels={
  1:{
    name:'Laboratório Abandonado',
    map:M1, theme:{bg:'#06101a',wall:'#10283b',edge:'#1e5a78',inner:'#16344b'},
    start:[14,16],terminals:[[3,10],[24,10]],special:{type:'key',pos:[14,4]},exit:[15,1],
    crystals:[[2,1],[25,1],[2,18],[25,18]],
    powers:[[7,4,'speed'],[20,4,'shield'],[4,14,'magnet'],[23,14,'freeze'],[9,10,'phase'],[18,10,'teleport']],
    enemies:[['hunter',13,8],['strategist',14,8],['ambusher',13,10],['phase',14,10]],
    checkpoint:[15,14], boss:true, bossType:'core', bossHp:5, reward:5
  },
  2:{
    name:'Metrô Espectral',
    map:M2, theme:{bg:'#120d18',wall:'#2d1c32',edge:'#a9502d',inner:'#4b283a'},
    start:[2,18],terminals:[[4,2],[21,2],[14,15]],special:{type:'battery',pos:[14,9]},exit:[25,18],
    crystals:[[1,1],[26,1],[1,15],[26,15],[14,18]],
    powers:[[9,3,'speed'],[18,3,'shield'],[4,11,'magnet'],[23,11,'freeze'],[10,17,'phase'],[20,17,'teleport']],
    enemies:[['sentinel',8,6],['sentinel',21,7],['hunter',13,11],['strategist',17,15],['phase',9,15]],
    checkpoint:[14,13],
    shocks:[[8,5],[19,5],[7,13],[20,13]], boss:true, bossType:'rail', bossHp:6, reward:8
  },
  3:{
    name:'Cidade Neon',
    map:M3, theme:{bg:'#0a0718',wall:'#221338',edge:'#8c3cff',inner:'#173b58'},
    start:[14,18],terminals:[[3,4],[24,4],[5,12],[20,12]],special:{type:'battery',pos:[13,8]},exit:[14,1],
    crystals:[[1,1],[26,1],[1,16],[26,16],[14,4],[14,16]],
    powers:[[6,3,'speed'],[21,3,'shield'],[5,12,'magnet'],[22,12,'freeze'],[9,16,'phase'],[18,16,'teleport']],
    enemies:[['stalker',5,7],['stalker',22,7],['sentinel',8,15],['strategist',19,15],['hunter',13,10],['phase',13,4]],
    checkpoint:[14,14],
    shocks:[[4,8],[23,8],[8,13],[19,13],[15,5]], boss:true, bossType:'neon', bossHp:7, reward:12
  },
  4:{
    name:'Ruínas do Vazio',
    map:M4, theme:{bg:'#070713',wall:'#18182f',edge:'#5963e8',inner:'#35265b'},
    start:[14,18],terminals:[[3,3],[24,2],[4,13],[22,14]],special:{type:'battery',pos:[13,7]},exit:[14,1],
    crystals:[[1,1],[26,1],[1,16],[25,16],[8,10],[19,10],[14,18]],
    powers:[[7,4,'speed'],[22,4,'shield'],[4,12,'magnet'],[23,12,'freeze'],[8,16,'phase'],[19,16,'teleport']],
    enemies:[['voidweaver',5,6],['voidweaver',22,6],['voidweaver',14,12],['stalker',8,15],['sentinel',19,14],['strategist',14,5]],
    checkpoint:[14,15],
    shocks:[[6,8],[21,8],[9,12],[17,12]], boss:true, bossType:'abyss', bossHp:9, reward:16
  }
};

const upgradeDefs=[
 {id:'speed',name:'Velocidade Base',desc:'+4% velocidade por nível',max:5,base:80},
 {id:'overdrive',name:'Duração do Overdrive',desc:'+1,2 s por nível',max:5,base:100},
 {id:'magnet',name:'Ímã Permanente',desc:'atrai fragmentos próximos',max:3,base:140},
 {id:'shield',name:'Escudo Inicial',desc:'começa a fase protegido',max:1,base:250},
 {id:'dash',name:'Dash Adicional',desc:'reduz recarga do dash',max:3,base:180},
 {id:'combo',name:'Núcleo de Combo',desc:'+10% pontos por combo por nível',max:5,base:220},
 {id:'crystal',name:'Sintonia de Cristais',desc:'+1 cristal bônus ao concluir fase por nível',max:3,base:300},
 {id:'pulse',name:'Módulo EMP Pulse',desc:'desbloqueia habilidade ativa de pulso',max:1,base:350},
 {id:'pulsecd',name:'Recarga EMP',desc:'-1,2 s de recarga por nível',max:4,base:260},
 {id:'luck',name:'Coletor Raro',desc:'+5% chance de cristal ao eliminar inimigo',max:4,base:280},
];

let save={};
try{save=JSON.parse(localStorage.getItem('mh-core-save')||'null')||{}}catch(err){
  try{localStorage.setItem('mh-core-save-corrupt-backup',localStorage.getItem('mh-core-save')||'')}catch{}
  console.warn('[Maze Hunter] save corrompido; um backup foi criado e um novo save será iniciado.',err);
  save={};
}
save.crystals=Number(save.crystals||0);
save.upgrades=Object.assign({speed:0,overdrive:0,magnet:0,shield:0,dash:0,combo:0,crystal:0,pulse:0,pulsecd:0,luck:0},save.upgrades||{});
save.equipped=Array.isArray(save.equipped)?save.equipped:[];
save.settings=Object.assign({graphics:'auto',volume:80,musicVolume:55,sfxVolume:80,reduceFlash:false},save.settings||{});
save.completed=Object.assign({1:false,2:false,3:false,4:false},save.completed||{});
save.stats=Object.assign({bestScore:{},bestTime:{},bestRank:{},deaths:0,bestCombo:1,runs:0},save.stats||{});
// Keep legacy saves playable: sanitize equipped modules and auto-equip up to three purchased modules once.
save.equipped=save.equipped.filter(id=>upgradeDefs.some(u=>u.id===id)&&(save.upgrades[id]||0)>0).slice(0,3);
if(!save.equipped.length){
  save.equipped=upgradeDefs.filter(u=>(save.upgrades[u.id]||0)>0).slice(0,3).map(u=>u.id);
}
function moduleLevel(id){return save.equipped.includes(id)?(save.upgrades[id]||0):0}
function moduleActive(id){return moduleLevel(id)>0}
function moduleEffectText(id){
  const lv=moduleLevel(id);
  if(id==='speed')return `+${lv*4}% velocidade`;
  if(id==='overdrive')return `+${(lv*1.2).toFixed(1)} s Overdrive`;
  if(id==='magnet')return lv?'Ímã permanente':'Inativo';
  if(id==='shield')return lv?'Escudo inicial':'Inativo';
  if(id==='dash')return lv?`-${lv*180} ms recarga`:'Recarga padrão';
  if(id==='combo')return `+${lv*10}% pontos de combo`;
  if(id==='crystal')return `+${lv} cristal por conclusão`;
  if(id==='pulse')return lv?'EMP desbloqueado':'EMP bloqueado';
  if(id==='pulsecd')return `-${(lv*1.2).toFixed(1)} s recarga EMP`;
  if(id==='luck')return `+${lv*5}% chance de drop raro`;
  return '';
}

function persist(){
  localStorage.setItem('mh-core-save',JSON.stringify(save));
  renderUpgrades();renderBuild();renderEquipment();renderLevels();
}

let currentLevelId=1,level=levels[1],map=level.map.map(r=>r.split(''));
let state,player,enemies,frags,crystals,powers,terminals,specialItem,exitDoor,boss,checkpoint,shocks,particles=[];
let raf,last=0,running=false,paused=false,menuScreen='home',hitLock=0,toastTimer=0,runId=0;

function reset(levelId=currentLevelId){
  currentLevelId=levelId;
  level=levels[levelId];
  map=level.map.map(r=>r.padEnd(COLS,'#').slice(0,COLS).split(''));

  const startNow=performance.now();
  state={score:0,lives:3,combo:1,comboUntil:0,remaining:0,activePower:null,powerUntil:0,freezeUntil:0,terminals:0,hasSpecial:false,bossStarted:false,bossDefeated:false,startTime:startNow,kills:0,rareDrops:0,respawnInvulnUntil:0,screenShakeUntil:0,bossProjectiles:[],hazards:[],
    playerReleaseAt:startNow+3000,enemiesReleaseAt:startNow+8000,playerReleased:false,enemiesReleased:false,resultShown:false,finishAt:0};

  player={x:0,y:0,dir:{x:-1,y:0},moveDir:{x:0,y:0},queuedDir:{x:0,y:0},speed:120*(1+moduleLevel('speed')*.04),anim:'idle',animUntil:0,shield:moduleActive('shield'),dashCd:0,overdriveUntil:0,skillCd:0,dead:false,deathStartedAt:0,deathUntil:0};
  placeOnWalkable(player,level.start[0],level.start[1]);

  frags=[];crystals=[];powers=[];enemies=[];particles=[];
  terminals=level.terminals.map(([x,y])=>makeWalkablePoint(x,y,{on:false}));
  specialItem=makeWalkablePoint(level.special.pos[0],level.special.pos[1],{on:true,type:level.special.type});
  exitDoor=makeWalkablePoint(level.exit[0],level.exit[1],{open:false});
  checkpoint=makeWalkablePoint(level.checkpoint[0],level.checkpoint[1],{on:false});
  checkpoint.spawn={x:player.x,y:player.y};
  shocks=(level.shocks||[]).map(([x,y],i)=>makeWalkablePoint(x,y,{phase:i*700}));

  boss=makeWalkablePoint(14,9,{hp:level.bossHp||0,maxHp:level.bossHp||0,state:'idle',stateUntil:0,nextAttack:0,dead:!level.boss,deathStartedAt:0,deathUntil:0,invuln:0,type:level.bossType||'core',dir:{x:0,y:0}});

  for(let y=0;y<ROWS;y++)for(let x=0;x<COLS;x++){
    const c=map[y][x];
    if(c==='.'||c==='o'){
      frags.push({x:x*T+T/2,y:y*T+T/2,on:true,big:c==='o'});
      state.remaining++;
    }
  }

  level.crystals.forEach(([x,y])=>crystals.push(makeWalkablePoint(x,y,{on:true})));
  level.powers.forEach(([x,y,t])=>powers.push(makeWalkablePoint(x,y,{type:t,on:true})));
  level.enemies.forEach(([type,x,y],i)=>{
    const pos=makeWalkablePoint(x,y,{type,dir:i%2?{x:1,y:0}:{x:-1,y:0},speed:type==='sentinel'?92:type==='voidweaver'?86:74+i*4,dead:0});
    enemies.push(pos);
  });

  $('#levelLabel').textContent=`FASE ${levelId} — ${level.name}`;
  $('#objectiveText').textContent='Colete os fragmentos e cumpra os objetivos da área.';
  $('#checkpointText').textContent='Nenhum checkpoint ativo.';
  updateObjectiveState();updateHud();draw(performance.now());
}

function tileAtPixel(px,py){
  return {x:Math.floor(px/T),y:Math.floor(py/T)};
}
function wallTile(tx,ty){
  if(tx<0||tx>=COLS||ty<0||ty>=ROWS)return true;
  return map[ty][tx]==='#';
}
function wall(px,py){
  const t=tileAtPixel(px,py);
  return wallTile(t.x,t.y);
}
function circleHitsWall(x,y,r=11){
  const minX=Math.floor((x-r)/T),maxX=Math.floor((x+r)/T);
  const minY=Math.floor((y-r)/T),maxY=Math.floor((y+r)/T);
  for(let ty=minY;ty<=maxY;ty++){
    for(let tx=minX;tx<=maxX;tx++){
      if(!wallTile(tx,ty))continue;
      const rx=tx*T,ry=ty*T;
      const cx=Math.max(rx,Math.min(x,rx+T));
      const cy=Math.max(ry,Math.min(y,ry+T));
      const dx=x-cx,dy=y-cy;
      if(dx*dx+dy*dy<r*r)return true;
    }
  }
  return false;
}
function canMove(x,y,dx,dy,r=11){
  return !circleHitsWall(x+dx,y+dy,r);
}
function tileCenter(v){return Math.floor(v/T)*T+T/2}
function alignedToGrid(v,tolerance=4){return Math.abs(v-tileCenter(v))<=tolerance}
function snapIfClose(obj){
  if(alignedToGrid(obj.x,5))obj.x=tileCenter(obj.x);
  if(alignedToGrid(obj.y,5))obj.y=tileCenter(obj.y);
}
function validDirsAt(x,y,r=11){
  const tx=Math.round((x-T/2)/T),ty=Math.round((y-T/2)/T);
  return [
    {x:1,y:0},{x:-1,y:0},{x:0,y:1},{x:0,y:-1}
  ].filter(d=>isWalkableTile(tx+d.x,ty+d.y));
}
const near=(a,b,d=22)=>Math.hypot(a.x-b.x,a.y-b.y)<d;

function isWalkableTile(tx,ty){
  return tx>=0&&tx<COLS&&ty>=0&&ty<ROWS&&map[ty][tx]!=='#';
}
function nearestWalkableTile(tx,ty,maxRadius=6){
  if(isWalkableTile(tx,ty))return {x:tx,y:ty};
  for(let r=1;r<=maxRadius;r++){
    for(let oy=-r;oy<=r;oy++){
      for(let ox=-r;ox<=r;ox++){
        if(Math.abs(ox)!==r&&Math.abs(oy)!==r)continue;
        const nx=tx+ox,ny=ty+oy;
        if(isWalkableTile(nx,ny))return {x:nx,y:ny};
      }
    }
  }
  return {x:1,y:1};
}
function placeOnWalkable(entity,tx,ty){
  const p=nearestWalkableTile(tx,ty);
  entity.x=p.x*T+T/2;entity.y=p.y*T+T/2;entity._centerLock=null;
  return p;
}
function makeWalkablePoint(tx,ty,extra={}){
  const p=nearestWalkableTile(tx,ty);
  return Object.assign({x:p.x*T+T/2,y:p.y*T+T/2},extra);
}
function validateLevelConfiguration(){
  const points=[
    ['player',level.start],['special',level.special.pos],['exit',level.exit],['checkpoint',level.checkpoint],
    ...level.terminals.map(p=>['terminal',p]),...level.crystals.map(p=>['crystal',p]),
    ...level.powers.map(p=>['power',p]),...level.enemies.map(p=>['enemy',[p[1],p[2]]]),
    ...(level.shocks||[]).map(p=>['shock',p])
  ];
  const invalid=points.filter(([,p])=>!isWalkableTile(p[0],p[1]));
  if(invalid.length)console.warn('[Maze Hunter] coordenadas inválidas corrigidas automaticamente:',invalid);
  return invalid.length===0;
}
function entityTile(entity){
  return {x:Math.round((entity.x-T/2)/T),y:Math.round((entity.y-T/2)/T)};
}
function atTileCenter(entity,tol=2.2){
  const tx=Math.round((entity.x-T/2)/T),ty=Math.round((entity.y-T/2)/T);
  const cx=tx*T+T/2,cy=ty*T+T/2;
  return Math.abs(entity.x-cx)<=tol&&Math.abs(entity.y-cy)<=tol;
}
function centerEntity(entity){
  const t=entityTile(entity);
  entity.x=t.x*T+T/2;entity.y=t.y*T+T/2;
}
function canEnterFrom(entity,dir){
  const t=entityTile(entity);
  return isWalkableTile(t.x+dir.x,t.y+dir.y);
}
function moveWithSubsteps(entity,dir,distance,radius,onCenter){
  if(distance<=0)return {moved:false,blocked:false};
  let remain=distance,moved=false,currentDir=dir||{x:0,y:0};
  while(remain>0){
    const step=Math.min(1.8,remain);
    if(!atTileCenter(entity,3))entity._centerLock=null;
    if(atTileCenter(entity,2.1)){
      const tile=entityTile(entity),centerKey=`${tile.x},${tile.y}`;
      if(entity._centerLock!==centerKey){
        centerEntity(entity);
        entity._centerLock=centerKey;
        if(onCenter)onCenter();
      }
      currentDir=entity.moveDir||entity.dir||currentDir;
    }
    if(!currentDir||(!currentDir.x&&!currentDir.y))break;
    const nx=entity.x+currentDir.x*step,ny=entity.y+currentDir.y*step;
    if(circleHitsWall(nx,ny,radius)){
      if(atTileCenter(entity,5))centerEntity(entity);
      return {moved,blocked:true};
    }
    entity.x=nx;entity.y=ny;moved=true;remain-=step;
  }
  return {moved,blocked:false};
}




function updateReleaseCountdown(now){
  const box=$('#releaseCountdown'),main=$('#releaseMain'),sub=$('#releaseSub');
  if(!box||!main||!sub)return;
  if(now<state.playerReleaseAt){
    const sec=Math.max(1,Math.ceil((state.playerReleaseAt-now)/1000));
    box.classList.remove('hidden','enemy-wait');
    main.textContent=sec;
    sub.textContent='PREPARE-SE';
    return;
  }
  if(!state.playerReleased){
    state.playerReleased=true;
    showToast('VAI!');
  }
  if(now<state.enemiesReleaseAt){
    const sec=Math.max(1,Math.ceil((state.enemiesReleaseAt-now)/1000));
    box.classList.remove('hidden');
    box.classList.add('enemy-wait');
    main.textContent=`INIMIGOS EM ${sec}`;
    sub.textContent='VOCÊ TEM VANTAGEM';
    return;
  }
  if(!state.enemiesReleased){
    state.enemiesReleased=true;
    showToast('INIMIGOS LIBERADOS','warn');
  }
  box.classList.add('hidden');
}

function showToast(text,type='good'){
  const el=$('#toast'); if(!el)return;
  el.textContent=text;el.className=`toast ${type}`;
  clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.add('hidden'),1700);
}

let audioCtx=null;
function ensureAudio(){
  const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return null;
  try{if(!audioCtx)audioCtx=new AC();if(audioCtx.state==='suspended')audioCtx.resume();return audioCtx}catch{return null}
}
function sfx(freq=440,duration=.07,type='sine',gain=.045){
  const ac=ensureAudio();if(!ac||save.settings.volume<=0)return;
  try{
    const o=ac.createOscillator(),g=ac.createGain(),now=ac.currentTime;
    o.type=type;o.frequency.setValueAtTime(freq,now);
    g.gain.setValueAtTime(Math.max(.0001,gain*(save.settings.volume/100)*(save.settings.sfxVolume/100)),now);
    g.gain.exponentialRampToValueAtTime(.0001,now+duration);
    o.connect(g);g.connect(ac.destination);o.start(now);o.stop(now+duration);
  }catch{}
}
let musicTimer=0,musicStep=0;
function playMusicNote(freq,duration=.22){
  const ac=ensureAudio();if(!ac||!running||save.settings.volume<=0||save.settings.musicVolume<=0)return;
  try{
    const o=ac.createOscillator(),g=ac.createGain(),now=ac.currentTime;
    o.type='triangle';o.frequency.setValueAtTime(freq,now);
    const vol=.018*(save.settings.volume/100)*(save.settings.musicVolume/100);
    g.gain.setValueAtTime(Math.max(.0001,vol),now);g.gain.exponentialRampToValueAtTime(.0001,now+duration);
    o.connect(g);g.connect(ac.destination);o.start(now);o.stop(now+duration);
  }catch{}
}
function startMusic(){
  stopMusic();
  const scales={1:[196,220,247,294],2:[174,196,233,262],3:[220,262,330,392],4:[147,174,220,233]};
  const notes=scales[currentLevelId]||scales[1];
  musicStep=0;
  musicTimer=setInterval(()=>{if(running&&!paused){playMusicNote(notes[musicStep%notes.length]);musicStep++}},520);
}
function stopMusic(){if(musicTimer){clearInterval(musicTimer);musicTimer=0}}
function burst(x,y,count=8){
  if(currentGraphics()==='low')count=Math.ceil(count/2);
  for(let i=0;i<count;i++){
    const a=(Math.PI*2*i/count)+Math.random()*.35,sp=32+Math.random()*65;
    particles.push({x,y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,life:.45+Math.random()*.35,max:.8,size:2+Math.random()*3});
  }
  if(particles.length>140)particles.splice(0,particles.length-140);
}
function updateEffects(dt){
  for(const p of particles){p.x+=p.vx*dt;p.y+=p.vy*dt;p.vx*=.97;p.vy*=.97;p.life-=dt}
  particles=particles.filter(p=>p.life>0);
}
function drawEffects(){
  if(!particles.length)return;ctx.save();
  for(const p of particles){ctx.globalAlpha=Math.max(0,p.life/p.max);ctx.fillStyle='#8ff7ff';ctx.beginPath();ctx.arc(p.x,p.y,p.size,0,Math.PI*2);ctx.fill()}
  ctx.restore();
}

function collect(){
  const magnet=moduleActive('magnet')||state.activePower==='magnet';
  for(const f of frags)if(f.on){
    if(magnet&&Math.hypot(f.x-player.x,f.y-player.y)<90){f.x+=(player.x-f.x)*.08;f.y+=(player.y-f.y)*.08}
    if(near(player,f,18)){f.on=false;state.score+=f.big?50:10;state.remaining--;burst(f.x,f.y,f.big?10:5);sfx(f.big?720:560,.05,'sine',.025);if(f.big)player.overdriveUntil=performance.now()+5000+moduleLevel('overdrive')*1200}
  }
  for(const c of crystals)if(c.on&&near(player,c,22)){c.on=false;save.crystals++;state.score+=100;burst(c.x,c.y,12);sfx(880,.09,'triangle',.04);persist()}
  for(const p of powers)if(p.on&&near(player,p,23)){p.on=false;activatePower(p.type)}
  for(const t of terminals)if(!t.on&&near(player,t,25)){t.on=true;state.terminals++;state.score+=250;burst(t.x,t.y,12);sfx(520,.10,'square',.03);showToast(`Terminal ${state.terminals}/${terminals.length} ativado`)}
  if(specialItem.on&&near(player,specialItem,24)){specialItem.on=false;state.hasSpecial=true;state.score+=350;burst(specialItem.x,specialItem.y,16);sfx(760,.14,'triangle',.04);showToast(specialItem.type==='battery'?'Bateria espectral recuperada':'Chave do Núcleo obtida')}
  if(!checkpoint.on&&near(player,checkpoint,28)){
    checkpoint.on=true;checkpoint.spawn={x:checkpoint.x,y:checkpoint.y};state.score+=150;
    $('#checkpointText').textContent='Checkpoint ativo: você renasce aqui.';
    burst(checkpoint.x,checkpoint.y,16);sfx(620,.16,'sine',.04);if(navigator.vibrate)navigator.vibrate(22);showToast('Checkpoint ativado');
  }
  if(exitDoor.open&&near(player,exitDoor,29)){
    if(level.boss&&!state.bossStarted)startBoss();
    else if(!level.boss||state.bossDefeated)completeLevel();
  }
  updateObjectiveState();
}

function updateObjectiveState(){
  const ready=state.remaining<=0&&state.terminals>=terminals.length&&state.hasSpecial;
  exitDoor.open=ready;
  let txt='';
  if(state.remaining>0)txt=`FRAGS ${state.remaining}`;
  else if(state.terminals<terminals.length)txt=`TERMINAIS ${state.terminals}/${terminals.length}`;
  else if(!state.hasSpecial)txt=level.special.type==='battery'?'BATERIA':'CHAVE';
  else if(level.boss&&!state.bossStarted)txt='ABRA O PORTÃO';
  else if(level.boss&&!state.bossDefeated)txt=`BOSS ${Math.max(0,boss.hp)}/${boss.maxHp}`;
  else txt='SAÍDA';
  if($('#objective'))$('#objective').textContent=txt;

  if(state.remaining>0)$('#objectiveText').textContent=`Colete todos os fragmentos restantes: ${state.remaining}.`;
  else if(state.terminals<terminals.length)$('#objectiveText').textContent=`Ative os terminais: ${state.terminals}/${terminals.length}.`;
  else if(!state.hasSpecial)$('#objectiveText').textContent=level.special.type==='battery'?'Encontre a Bateria Espectral.':'Encontre a Chave do Núcleo.';
  else if(level.boss&&!state.bossStarted)$('#objectiveText').textContent='Vá até o portão para despertar o guardião desta fase.';
  else if(level.boss&&!state.bossDefeated)$('#objectiveText').textContent=boss.type==='neon'?'Use Overdrive para romper o escudo do Neon Overmind.':boss.type==='abyss'?'Use Overdrive e EMP Pulse para expor o Abyss Engine.':boss.type==='rail'?'Desvie dos disparos dos trilhos e ataque o Rail Sentinel Prime em Overdrive.':'Use Overdrive para causar dano ao Core Warden.';
  else $('#objectiveText').textContent='Alcance a saída para concluir a fase.';
}

function startBoss(){
  state.bossStarted=true;
  placeOnWalkable(boss,14,9);
  boss.hp=boss.maxHp;boss.dead=false;boss.state='idle';boss.stateUntil=0;boss.deathStartedAt=0;boss.deathUntil=0;boss.nextAttack=performance.now()+1000;boss.dir={x:0,y:0};
  sfx(145,.28,'sawtooth',.045);showToast(boss.type==='neon'?'NEON OVERMIND DESPERTOU':boss.type==='abyss'?'ABYSS ENGINE ATIVADO':boss.type==='rail'?'RAIL SENTINEL PRIME ONLINE':'CORE WARDEN DESPERTOU','warn');
}
function chooseBossDir(){
  const dirs=validDirsAt(boss.x,boss.y,13);
  if(!dirs.length)return {x:0,y:0};
  dirs.sort((a,b)=>{
    const da=Math.abs((boss.x+a.x*T)-player.x)+Math.abs((boss.y+a.y*T)-player.y);
    const db=Math.abs((boss.x+b.x*T)-player.x)+Math.abs((boss.y+b.y*T)-player.y);
    return da-db;
  });
  return dirs[0];
}
function defeatBoss(now){
  if(boss.dead)return;
  boss.hp=0;boss.dead=true;boss.state='death';boss.deathStartedAt=now;boss.deathUntil=now+900;burst(boss.x,boss.y,34);sfx(95,.35,'sawtooth',.06);
  state.bossDefeated=true;state.score+=3000;save.crystals+=8;persist();
  showToast(boss.type==='neon'?'Neon Overmind derrotado':boss.type==='abyss'?'Abyss Engine destruído':boss.type==='rail'?'Rail Sentinel Prime derrotado':'Core Warden derrotado');
  updateObjectiveState();
}
function updateBoss(dt,now){
  if(!level.boss||!state.bossStarted||boss.dead)return;
  if(now>=boss.stateUntil)boss.state='idle';
  const decide=()=>{
    const dirs=validDirsAt(boss.x,boss.y,13);
    const forwardOK=dirs.some(d=>d.x===boss.dir.x&&d.y===boss.dir.y);
    if(!forwardOK||dirs.length>=3||(!boss.dir.x&&!boss.dir.y))boss.dir=chooseBossDir();
  };
  const res=moveWithSubsteps(boss,boss.dir,58*dt,13,decide);
  if(res.blocked)boss.dir=chooseBossDir();

  if(now>boss.nextAttack){
    boss.state='attack';boss.stateUntil=now+520;boss.nextAttack=now+1500;
    if(boss.type==='core'){
      const dx=player.x-boss.x,dy=player.y-boss.y,m=Math.hypot(dx,dy)||1;
      state.bossProjectiles.push({x:boss.x,y:boss.y,vx:dx/m*165,vy:dy/m*165,r:8,life:3});
    }else if(boss.type==='neon'){
      for(const a of [0,Math.PI/2,Math.PI,Math.PI*1.5])state.bossProjectiles.push({x:boss.x,y:boss.y,vx:Math.cos(a)*150,vy:Math.sin(a)*150,r:7,life:2.6});
    }else if(boss.type==='rail'){
      const dx=player.x-boss.x,dy=player.y-boss.y,m=Math.hypot(dx,dy)||1,nx=-dy/m,ny=dx/m;
      for(const side of [-1,1])state.bossProjectiles.push({x:boss.x+nx*14*side,y:boss.y+ny*14*side,vx:dx/m*210,vy:dy/m*210,r:6,life:2.4});
    }else if(boss.type==='abyss'){
      state.hazards.push({x:player.x,y:player.y,r:26,life:2.2,arm:.7});
    }
    burst(boss.x,boss.y,10);sfx(boss.type==='abyss'?100:180,.11,'sawtooth',.035);
  }
  if(near(player,boss,42)){
    if(player.overdriveUntil>now&&now>boss.invuln){
      boss.hp--;boss.invuln=now+900;boss.state='hurt';boss.stateUntil=now+420;state.score+=750;burst(boss.x,boss.y,14);sfx(190,.09,'square',.04);triggerCombo(now);
      if(boss.hp<=0)defeatBoss(now);
    }else if(now>boss.invuln-700)hit();
  }
}

function activatePower(type){
  state.activePower=type;state.powerUntil=performance.now()+7000;
  if(type==='shield')player.shield=true;
  if(type==='freeze')state.freezeUntil=performance.now()+6500;
  if(type==='teleport'){
    if(checkpoint.on){player.x=checkpoint.spawn.x;player.y=checkpoint.spawn.y}
    else placeOnWalkable(player,level.start[0],level.start[1]);
    player.moveDir={x:0,y:0};player.queuedDir={x:0,y:0};
  }
  showToast(`Power-up: ${type.toUpperCase()}`);
}


function triggerCombo(now){
  state.combo=Math.min(16,Math.max(2,state.combo*2));save.stats.bestCombo=Math.max(save.stats.bestCombo||1,state.combo);
  state.comboUntil=now+3500;
}
function rollRareDrop(x,y){
  const chance=.08+moduleLevel('luck')*.05;
  if(Math.random()<chance){
    save.crystals++;
    state.rareDrops++;
    persist();
    showToast('DROP RARO: +1 cristal');
  }
}
function usePulse(now){
  if(!moduleActive('pulse')||now<player.skillCd)return;
  const cooldown=Math.max(4200,10000-moduleLevel('pulsecd')*1200);
  player.skillCd=now+cooldown;
  const radius=180;
  for(const e of enemies){
    if(e.dead<=now && Math.hypot(e.x-player.x,e.y-player.y)<=radius){
      e.dead=now+2200;
      state.score+=180;
      state.kills++;
      triggerCombo(now);
      rollRareDrop(e.x,e.y);
    }
  }
  state.freezeUntil=Math.max(state.freezeUntil,now+1200);
  if(level.boss&&state.bossStarted&&!boss.dead&&Math.hypot(boss.x-player.x,boss.y-player.y)<=radius){
    boss.invuln=Math.max(0,now-1);
    boss.state='hurt';boss.stateUntil=now+420;
    boss.nextAttack=Math.max(boss.nextAttack,now+1800);
    if(player.overdriveUntil>now){
      boss.hp--;state.score+=500;triggerCombo(now);boss.invuln=now+900;
      if(boss.hp<=0)defeatBoss(now);
    }
  }
  const fx=$('#pulseFx');
  if(fx){
    fx.style.left=`${(player.x/W)*100}%`;
    fx.style.top=`${(player.y/H)*100}%`;
    fx.classList.remove('hidden','active');
    void fx.offsetWidth;
    fx.classList.add('active');
    setTimeout(()=>fx.classList.add('hidden'),520);
  }
  burst(player.x,player.y,24);sfx(320,.18,'square',.04);if(navigator.vibrate)navigator.vibrate(35);showToast('EMP PULSE');
}
function updateCombo(now){
  if(state.combo>1&&now>state.comboUntil)state.combo=1;
  const bar=$('#comboBar span');
  if(bar){
    const remain=state.combo>1?Math.max(0,state.comboUntil-now):0;
    bar.style.width=`${Math.min(100,(remain/3500)*100)}%`;
  }
}

function gamepadVector(){
  const pads=navigator.getGamepads?navigator.getGamepads():[];
  const gp=[...pads].find(Boolean);
  if(!gp){gamepadDash=false;gamepadSkill=false;return {x:0,y:0,dashPressed:false,skillPressed:false}}
  let x=gp.axes?.[0]||0,y=gp.axes?.[1]||0;
  if(Math.abs(x)<.25)x=0;if(Math.abs(y)<.25)y=0;
  if(gp.buttons?.[14]?.pressed)x=-1;if(gp.buttons?.[15]?.pressed)x=1;
  if(gp.buttons?.[12]?.pressed)y=-1;if(gp.buttons?.[13]?.pressed)y=1;
  const dash=!!(gp.buttons?.[0]?.pressed||gp.buttons?.[1]?.pressed);
  const skill=!!(gp.buttons?.[2]?.pressed||gp.buttons?.[3]?.pressed);
  const dashPressed=dash&&!gamepadDash,skillPressed=skill&&!gamepadSkill;
  gamepadDash=dash;gamepadSkill=skill;
  return {x,y,dashPressed,skillPressed};
}
function requestedDirection(){
  let want={x:0,y:0};
  if(keys.arrowleft||keys.a||touch.left)want={x:-1,y:0};
  else if(keys.arrowright||keys.d||touch.right)want={x:1,y:0};
  else if(keys.arrowup||keys.w||touch.up)want={x:0,y:-1};
  else if(keys.arrowdown||keys.s||touch.down)want={x:0,y:1};

  const gp=gamepadVector();
  if(!want.x&&!want.y){
    if(Math.abs(gp.x)>.35&&Math.abs(gp.x)>=Math.abs(gp.y))want={x:Math.sign(gp.x),y:0};
    else if(Math.abs(gp.y)>.35)want={x:0,y:Math.sign(gp.y)};
  }
  return {want,gp};
}

function updatePlayer(dt,now){
  if(player.dead)return;
  const {want,gp}=requestedDirection();
  if(want.x||want.y)player.queuedDir=want;
  if(now<state.playerReleaseAt){
    player.anim='idle';
    player.moveDir={x:0,y:0};
    return;
  }

  const skillPressed=!!pressed.e||touchPressed.skill||gp.skillPressed;
  if(skillPressed)usePulse(now);
  pressed.e=false;touchPressed.skill=false;

  let speed=player.speed*(state.activePower==='speed'?1.45:1);
  const dashPressed=!!pressed.space||touchPressed.dash||gp.dashPressed;
  const dashing=dashPressed&&now>player.dashCd;
  pressed.space=false;touchPressed.dash=false;
  if(dashing){
    speed*=2.2;
    player.dashCd=now+Math.max(550,1200-moduleLevel('dash')*180);
    player.anim='dash';burst(player.x,player.y,6);sfx(260,.05,'sawtooth',.02);
  }

  // Reverse immediately inside a corridor.
  const q=player.queuedDir||{x:0,y:0};
  if(q.x===-player.moveDir.x&&q.y===-player.moveDir.y&&(q.x||q.y)){
    player.moveDir={x:q.x,y:q.y};player.dir={x:q.x,y:q.y};
  }
  if((q.x||q.y)&&!(player.moveDir.x||player.moveDir.y)&&atTileCenter(player,2.1)&&canEnterFrom(player,q)){
    centerEntity(player);
    player.moveDir={x:q.x,y:q.y};player.dir={x:q.x,y:q.y};
  }

  const onCenter=()=>{
    const queued=player.queuedDir||{x:0,y:0};
    if((queued.x||queued.y)&&canEnterFrom(player,queued)){
      player.moveDir={x:queued.x,y:queued.y};
      player.dir={x:queued.x,y:queued.y};
    }else if((player.moveDir.x||player.moveDir.y)&&!canEnterFrom(player,player.moveDir)){
      player.moveDir={x:0,y:0};
    }
  };

  const phasing=state.activePower==='phase';
  let result;
  if(phasing){
    const distance=speed*dt,d=player.moveDir;
    if(d&&(d.x||d.y)){
      player.x+=d.x*distance;player.y+=d.y*distance;
      result={moved:true,blocked:false};
    }else result={moved:false,blocked:false};
  }else{
    result=moveWithSubsteps(player,player.moveDir,speed*dt,10,onCenter);
  }
  if(result.blocked){
    if(atTileCenter(player,6))centerEntity(player);
    player.moveDir={x:0,y:0};player._centerLock=null;
  }

  if(now<player.animUntil&&player.anim==='hurt'){}
  else if(player.overdriveUntil>now)player.anim='overdrive';
  else if(!dashing)player.anim=result.moved?'move':'idle';

  if(player.x<0)player.x=W-1;
  if(player.x>=W)player.x=1;
  player.y=Math.max(T/2,Math.min(H-T/2,player.y));
  if(state.powerUntil<now){
    const expired=state.activePower;
    state.activePower=null;
    if(expired==='phase'&&circleHitsWall(player.x,player.y,10)){
      const t=entityTile(player);placeOnWalkable(player,t.x,t.y);
      player.moveDir={x:0,y:0};player.queuedDir={x:0,y:0};
    }
  }
  collect();
}

function chooseEnemyDir(e){
  const dirs=validDirsAt(e.x,e.y,10);
  if(!dirs.length)return {x:0,y:0};

  const reverse={x:-e.dir.x,y:-e.dir.y};
  let options=dirs.filter(d=>!(d.x===reverse.x&&d.y===reverse.y));
  if(!options.length)options=dirs;

  const tx=player.x-e.x,ty=player.y-e.y;

  if(e.type==='hunter'){
    options.sort((a,b)=>{
      const da=Math.abs((e.x+a.x*T)-player.x)+Math.abs((e.y+a.y*T)-player.y);
      const db=Math.abs((e.x+b.x*T)-player.x)+Math.abs((e.y+b.y*T)-player.y);
      return da-db;
    });
    return options[0];
  }

  if(e.type==='strategist'){
    const targetX=player.x+(player.moveDir?.x||player.dir.x)*T*3;
    const targetY=player.y+(player.moveDir?.y||player.dir.y)*T*3;
    options.sort((a,b)=>{
      const da=Math.abs((e.x+a.x*T)-targetX)+Math.abs((e.y+a.y*T)-targetY);
      const db=Math.abs((e.x+b.x*T)-targetX)+Math.abs((e.y+b.y*T)-targetY);
      return da-db;
    });
    return options[0];
  }

  if(e.type==='voidweaver'){
    const targetX=player.x+(Math.sin(performance.now()/700)*T*2);
    const targetY=player.y+(Math.cos(performance.now()/700)*T*2);
    options.sort((a,b)=>{
      const da=Math.abs((e.x+a.x*T)-targetX)+Math.abs((e.y+a.y*T)-targetY);
      const db=Math.abs((e.x+b.x*T)-targetX)+Math.abs((e.y+b.y*T)-targetY);
      return da-db;
    });
    return options[0];
  }

  if(e.type==='stalker'){
    // Stalker alternates between direct pursuit and flanking.
    const targetX=player.x-(player.moveDir?.y||0)*T*2;
    const targetY=player.y+(player.moveDir?.x||0)*T*2;
    options.sort((a,b)=>{
      const da=Math.abs((e.x+a.x*T)-targetX)+Math.abs((e.y+a.y*T)-targetY);
      const db=Math.abs((e.x+b.x*T)-targetX)+Math.abs((e.y+b.y*T)-targetY);
      return da-db;
    });
    return Math.random()<.8?options[0]:options[Math.floor(Math.random()*options.length)];
  }

  if(e.type==='sentinel'){
    options.sort((a,b)=>{
      const sameAxisA=(Math.abs(tx)>Math.abs(ty))?Math.abs(a.x):Math.abs(a.y);
      const sameAxisB=(Math.abs(tx)>Math.abs(ty))?Math.abs(b.x):Math.abs(b.y);
      return sameAxisB-sameAxisA;
    });
    return Math.random()<.75?options[0]:options[Math.floor(Math.random()*options.length)];
  }

  // Ambusher / Phase: valid random corridor direction only.
  return options[Math.floor(Math.random()*options.length)];
}

function updateEnemies(dt,now){
  if(now<state.enemiesReleaseAt||player.dead)return;

  for(const e of enemies){
    if(e.dead>now||state.freezeUntil>now)continue;

    const decide=()=>{
      const dirs=validDirsAt(e.x,e.y,10);
      const forwardOK=dirs.some(d=>d.x===e.dir.x&&d.y===e.dir.y);
      const intersection=dirs.length>=3;
      if(!forwardOK||intersection||Math.random()<0.04)e.dir=chooseEnemyDir(e);
      if(!e.dir||(!e.dir.x&&!e.dir.y))e.dir=chooseEnemyDir(e);
    };

    let result;
    const canPhase=e.type==='phase'&&((Math.floor(now/1200)+enemies.indexOf(e))%4===0);
    if(canPhase){
      e.x+=e.dir.x*e.speed*dt;e.y+=e.dir.y*e.speed*dt;
      result={moved:true,blocked:false};
    }else result=moveWithSubsteps(e,e.dir,e.speed*dt,10,decide);
    if(result.blocked){
      if(atTileCenter(e,6))centerEntity(e);
      e.dir=chooseEnemyDir(e);
    }

    if(e.x<0)e.x=W-1;
    if(e.x>=W)e.x=1;

    if(near(player,e,24)){
      if(player.overdriveUntil>now){
        e.dead=now+3500;state.kills++;triggerCombo(now);
        state.score+=Math.round(200*state.combo*(1+moduleLevel('combo')*.10));
        rollRareDrop(e.x,e.y);
      }else if(player.shield){
        player.shield=false;e.dead=now+3500;state.kills++;state.score+=120;triggerCombo(now);rollRareDrop(e.x,e.y);burst(e.x,e.y,12);sfx(220,.08,'square',.035);showToast('Escudo: inimigo repelido','warn');
      }else hit();
    }
  }
}

function updateBossAttacks(dt,now){
  for(const p of state.bossProjectiles){
    p.x+=p.vx*dt;p.y+=p.vy*dt;p.life-=dt;
    if(p.life>0&&Math.hypot(player.x-p.x,player.y-p.y)<p.r+12)hit();
  }
  state.bossProjectiles=state.bossProjectiles.filter(p=>p.life>0&&!wall(p.x,p.y));
  for(const h of state.hazards){
    h.life-=dt;h.arm-=dt;
    if(h.arm<=0&&Math.hypot(player.x-h.x,player.y-h.y)<h.r)hit();
  }
  state.hazards=state.hazards.filter(h=>h.life>0);
}
function updateShocks(now){
  if(!shocks.length||player.dead)return;
  for(const s of shocks){
    const active=((now+s.phase)%3200)<1300;
    if(active&&near(player,s,23))hit();
  }
}

function hit(){
  const now=performance.now();if(now<hitLock||player.dead||now<state.respawnInvulnUntil)return;hitLock=now+1500;
  if(player.shield){player.shield=false;burst(player.x,player.y,18);sfx(210,.12,'square',.04);showToast('Escudo quebrado','warn');return}
  state.lives--;state.combo=1;state.comboUntil=0;player.anim='hurt';player.animUntil=now+520;burst(player.x,player.y,14);sfx(125,.12,'sawtooth',.04);
  if(state.lives<=0){
    player.dead=true;player.anim='death';player.deathStartedAt=now;player.deathUntil=now+950;save.stats.deaths=(save.stats.deaths||0)+1;persist();
    player.moveDir={x:0,y:0};player.queuedDir={x:0,y:0};player.overdriveUntil=0;
    sfx(70,.4,'sawtooth',.06);showToast('NÚCLEO COLAPSADO','warn');
    return;
  }
  if(checkpoint.on){
    placeOnWalkable(player,entityTile(checkpoint).x,entityTile(checkpoint).y);
  }else{
    placeOnWalkable(player,level.start[0],level.start[1]);
  }
  player.moveDir={x:0,y:0};player.queuedDir={x:0,y:0};
  player.overdriveUntil=0;state.respawnInvulnUntil=now+1100;
}
function completeLevel(){
  if(state.resultShown)return;
  state.resultShown=true;running=false;paused=false;stopMusic();
  const wasCompleted=!!save.completed[currentLevelId];
  const firstClear=!wasCompleted;
  save.completed[currentLevelId]=true;
  const baseReward=firstClear?level.reward:Math.max(1,Math.ceil(level.reward*.4));
  const completionReward=baseReward+moduleLevel('crystal');
  save.crystals+=completionReward;persist();
  $('#pauseBtn')?.classList.add('hidden');

  const elapsed=Math.max(0,(performance.now()-state.startTime)/1000);
  save.stats.runs=(save.stats.runs||0)+1;
  save.stats.bestScore[currentLevelId]=Math.max(save.stats.bestScore[currentLevelId]||0,state.score);
  const prevTime=save.stats.bestTime[currentLevelId];
  if(!prevTime||elapsed<prevTime)save.stats.bestTime[currentLevelId]=elapsed;
  const rankScore=state.score+state.lives*1200-Math.floor(elapsed*8);
  let rank='C';
  if(rankScore>=9000)rank='S';else if(rankScore>=6500)rank='A';else if(rankScore>=4000)rank='B';
  const rankValue={C:1,B:2,A:3,S:4};
  const prevRank=save.stats.bestRank[currentLevelId]||'C';
  if(rankValue[rank]>rankValue[prevRank])save.stats.bestRank[currentLevelId]=rank;
  persist();

  $('#resultTitle').textContent=`FASE ${currentLevelId} CONCLUÍDA`;
  $('#resultText').innerHTML=`${level.name}<br><span class="rank-chip">RANK ${rank}</span><br>Pontuação: ${state.score}<br>Vidas: ${state.lives}<br>Tempo: ${elapsed.toFixed(1)}s<br>Eliminações: ${state.kills}<br>Drops raros: ${state.rareDrops}<br>Recompensa: +${completionReward} cristais`;
  const nextBtn=document.querySelector('[data-action="next"]');
  if(nextBtn)nextBtn.style.display=levels[currentLevelId+1]?'':'none';
  showMenuScreen('result');
}

function gameOver(){
  if(state.resultShown)return;
  state.resultShown=true;running=false;paused=false;stopMusic();$('#pauseBtn')?.classList.add('hidden');
  $('#resultTitle').textContent='GAME OVER';
  $('#resultText').textContent=`Fase ${currentLevelId} — ${level.name}\nPontuação: ${state.score}\nO checkpoint continua válido apenas nesta tentativa.`;
  const nextBtn=document.querySelector('[data-action="next"]');if(nextBtn)nextBtn.style.display='none';
  showMenuScreen('result');
}
function updateHud(){
  $('#score').textContent=state.score;$('#lives').textContent=state.lives;$('#combo').textContent='x'+state.combo;
  $('#power').textContent=state.activePower||'—';$('#wallet').textContent=save.crystals;
  const sh=$('#skillHud');
  if(sh){
    if(!moduleActive('pulse'))sh.textContent='BLOQUEADA';
    else{
      const rem=Math.max(0,player.skillCd-performance.now());
      sh.textContent=rem>0?`${(rem/1000).toFixed(1)}s`:'EMP PRONTO';
    }
  }
  updateObjectiveState();
}

function drawMap(){
  ctx.fillStyle=level.theme.bg;ctx.fillRect(0,0,W,H);
  for(let y=0;y<ROWS;y++)for(let x=0;x<COLS;x++)if(map[y][x]==='#'){
    const px=x*T,py=y*T;ctx.fillStyle=level.theme.wall;ctx.fillRect(px+1,py+1,T-2,T-2);
    ctx.strokeStyle=level.theme.edge;ctx.lineWidth=1;ctx.strokeRect(px+3,py+3,T-6,T-6);
    ctx.fillStyle=level.theme.inner;ctx.fillRect(px+6,py+6,T-12,4);
  }
}
function safeDraw(image,...args){
  if(image instanceof HTMLImageElement&&image.complete&&image.naturalWidth>0){ctx.drawImage(image,...args);return true}
  return false;
}
function frame(list,index){
  if(!Array.isArray(list)||!list.length)return null;
  return list[((index%list.length)+list.length)%list.length]||list.find(Boolean)||null;
}
function currentGraphics(){
  const g=save.settings.graphics;if(g!=='auto')return g;
  return (navigator.hardwareConcurrency||4)<=4?'low':((navigator.hardwareConcurrency||4)<=8?'medium':'high');
}

function draw(now){
  drawMap();
  const fi=Math.floor(now/140)%4,a6=Math.floor(now/130)%6,a4=Math.floor(now/160)%4;
  for(const f of frags)if(f.on)safeDraw(frame(images.fragment,fi),f.x-16,f.y-16,32,32);
  for(const c of crystals)if(c.on)safeDraw(frame(images.crystal,fi),c.x-18,c.y-18,36,36);
  for(const p of powers)if(p.on)safeDraw(images.powers[p.type],p.x-20,p.y-20,40,40);

  for(const t of terminals){
    const im=frame(t.on?images.terminalActive:images.terminalOff,a6);
    if(!safeDraw(im,t.x-24,t.y-24,48,48)){ctx.fillStyle=t.on?'#2ff0df':'#36748a';ctx.fillRect(t.x-13,t.y-18,26,36)}
  }
  const specialFrames=specialItem.type==='battery'?images.battery:images.key;
  if(specialItem.on)safeDraw(frame(specialFrames,a6),specialItem.x-22,specialItem.y-22,44,44);
  safeDraw(frame(exitDoor.open?images.doorOpen:images.doorLocked,a4),exitDoor.x-28,exitDoor.y-30,56,56);
  safeDraw(frame(checkpoint.on?images.checkpointOn:images.checkpointOff,a6),checkpoint.x-24,checkpoint.y-28,48,56);

  for(const s of shocks){
    const active=((now+s.phase)%3200)<1300;
    ctx.save();ctx.globalAlpha=active?.95:.22;ctx.strokeStyle=active?'#ff6a31':'#7f4b44';ctx.lineWidth=active?5:2;
    ctx.beginPath();ctx.arc(s.x,s.y,17,0,Math.PI*2);ctx.stroke();
    if(active&&currentGraphics()!=='low'){ctx.shadowColor='#ff5a24';ctx.shadowBlur=14}
    ctx.restore();
  }

  if(level.boss&&state.bossStarted&&(!boss.dead||now<boss.deathUntil)){
    const bossFrames=boss.type==='neon'?images.boss2:boss.type==='abyss'?images.boss3:images.boss;
    const deathIndex=boss.dead?Math.min(5,Math.floor((now-boss.deathStartedAt)/150)):a6;
    if(boss.type==='rail'){
      const rim=frame(images.enemies.sentinel,Math.floor(now/110));
      safeDraw(rim,boss.x-50,boss.y-50,100,100);
    }else safeDraw(frame(bossFrames[boss.state]||bossFrames.idle,deathIndex),boss.x-48,boss.y-48,96,96);
    if(!boss.dead){ctx.fillStyle='#230808';ctx.fillRect(W/2-110,54,220,12);ctx.fillStyle='#ff5246';ctx.fillRect(W/2-108,56,216*(boss.hp/boss.maxHp),8)}
  }

  for(const p of state.bossProjectiles){
    ctx.save();ctx.fillStyle='#ff9d45';ctx.shadowColor='#ff5a24';ctx.shadowBlur=currentGraphics()==='low'?0:12;ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fill();ctx.restore();
  }
  for(const h of state.hazards){
    ctx.save();ctx.globalAlpha=Math.max(.15,Math.min(.8,h.life/2.2));ctx.strokeStyle=h.arm>0?'#7849ff':'#ff4f9a';ctx.lineWidth=h.arm>0?2:5;ctx.beginPath();ctx.arc(h.x,h.y,h.r,0,Math.PI*2);ctx.stroke();ctx.restore();
  }

  for(const e of enemies)if(e.dead<=now){
    const im=frame(images.enemies[e.type],Math.floor(now/120));
    ctx.save();ctx.globalAlpha=e.type==='phase'?.7:1;
    if(!safeDraw(im,e.x-24,e.y-24,48,48)){ctx.fillStyle='#ff5470';ctx.beginPath();ctx.arc(e.x,e.y,18,0,Math.PI*2);ctx.fill()}
    ctx.restore();
  }

  const arr=images.player[player.anim]||images.player.idle;
  const playerFrameIndex=player.anim==='death'?Math.min(5,Math.floor((now-player.deathStartedAt)/155)):player.anim==='hurt'?Math.min(3,Math.floor(Math.max(0,player.animUntil-now)/130)):Math.floor(now/110);
  const im=frame(arr,playerFrameIndex);
  ctx.save();ctx.translate(player.x,player.y);
  if(player.dir.x<0)ctx.scale(-1,1);
  const q=currentGraphics();
  if(q!=='low'&&!save.settings.reduceFlash){ctx.shadowColor=player.anim==='overdrive'?'#d54cff':'#32d8ff';ctx.shadowBlur=q==='high'?18:8}
  if(now<state.respawnInvulnUntil&&Math.floor(now/90)%2===0)ctx.globalAlpha=.45;
  safeDraw(im,-31,-31,62,62);ctx.restore();
  drawEffects();
  if(player.shield){ctx.strokeStyle='#56c9ff';ctx.lineWidth=3;ctx.beginPath();ctx.arc(player.x,player.y,30,0,Math.PI*2);ctx.stroke()}
  if(moduleActive('pulse')&&now>=player.skillCd){
    safeDraw(frame(images.pulse,a6),player.x+22,player.y-38,22,22);
  }
}

function loop(now,sessionId=runId){
  if(!running||sessionId!==runId)return;
  const dt=Math.min(.033,(now-last)/1000||0);last=now;
  updateReleaseCountdown(now);updatePlayer(dt,now);updateEnemies(dt,now);if(now>=state.enemiesReleaseAt){updateBoss(dt,now);updateBossAttacks(dt,now)}if(now>=state.playerReleaseAt)updateShocks(now);updateCombo(now);updateEffects(dt);updateHud();draw(now);
  if(player.dead&&now>=player.deathUntil&&!state.resultShown){gameOver();return}
  raf=requestAnimationFrame(t=>loop(t,sessionId));
}

function renderUpgrades(){
  $('#wallet').textContent=save.crystals;
  const list=$('#upgradeList');if(!list)return;
  list.innerHTML=upgradeDefs.map(u=>{
    const lv=save.upgrades[u.id]||0,cost=u.base*(lv+1),max=lv>=u.max,locked=(u.id==='pulsecd'&&!save.upgrades.pulse);
    const label=max?'MAX':locked?'REQUER EMP':'💎 '+cost;
    return `<div class="upgrade"><div><b>${u.name}</b> <span class="badge">Nv. ${lv}/${u.max}</span><small>${u.desc}</small></div><button data-buy="${u.id}" ${(max||locked)?'disabled':''}>${label}</button></div>`;
  }).join('');
  document.querySelectorAll('[data-buy]').forEach(b=>b.onclick=()=>buy(b.dataset.buy));
}
function buy(id){
  const u=upgradeDefs.find(x=>x.id===id),lv=save.upgrades[id]||0,cost=u.base*(lv+1);
  if(id==='pulsecd'&&!save.upgrades.pulse)return;
  if(lv<u.max&&save.crystals>=cost){save.crystals-=cost;save.upgrades[id]++;persist()}
}
function renderBuild(){
  const el=$('#buildSummary');if(!el)return;
  const chosen=save.equipped;
  el.innerHTML=chosen.map(id=>{const u=upgradeDefs.find(x=>x.id===id);return u?`<span class="badge">${u.name} ${save.upgrades[id]||0}</span>`:''}).join(' ')||'<small>Nenhum módulo equipado.</small>';
}
function renderEquipment(){
  const grid=$('#equipmentGrid'),slots=$('#equippedSlots');if(!grid||!slots)return;
  grid.innerHTML=upgradeDefs.map(u=>{
    const selected=save.equipped.includes(u.id);
    const dep=u.id==='pulsecd'&&!moduleActive('pulse');
    return `<div class="module ${selected?'selected':''}"><b>${u.name}</b><p>Nível ${save.upgrades[u.id]||0}/${u.max}</p><small>${moduleEffectText(u.id)}${dep?' · Requer EMP Pulse equipado':''}</small><button data-equip="${u.id}" ${((save.upgrades[u.id]||0)<=0||dep)?'disabled':''}>${selected?'REMOVER':'EQUIPAR'}</button></div>`;
  }).join('');
  document.querySelectorAll('[data-equip]').forEach(b=>b.onclick=()=>{
    const id=b.dataset.equip;
    if(save.equipped.includes(id))save.equipped=save.equipped.filter(x=>x!==id);
    else if(save.equipped.length<3)save.equipped.push(id);
    persist();
  });
  slots.innerHTML=save.equipped.map(id=>`<span class="badge">${upgradeDefs.find(u=>u.id===id)?.name||id}</span>`).join(' ')||'<small>Escolha até 3 módulos.</small>';
}
function applyBuildPreset(ids){
  save.equipped=ids.filter(id=>(save.upgrades[id]||0)>0).slice(0,3);persist();
}
function renderLevels(){
  const grid=$('#levelGrid');if(!grid)return;
  grid.innerHTML=Object.entries(levels).map(([id,l])=>{
    const n=Number(id),unlocked=n===1||save.completed[n-1],done=!!save.completed[n];
    return `<article class="level-card ${unlocked?'':'locked'}">
      <span class="level-status">${done?'CONCLUÍDA':unlocked?'DISPONÍVEL':'BLOQUEADA'}</span>
      <img src="assets/ui/levels/level${n}.webp" alt="">
      <div class="level-info"><h3>FASE ${n} — ${l.name}</h3>
      <p>${n===1?'Terminais, chave e confronto com o Core Warden.':n===2?'Trilhos eletrificados, 3 terminais, checkpoint e Rail Sentinel Prime.':n===3?'Cidade Neon, 4 terminais, Neon Stalkers e Neon Overmind.':'Ruínas do Vazio, Void Weavers, EMP Pulse e confronto com o Abyss Engine.'}</p>
      <small>Melhor score: ${save.stats.bestScore[n]||0} · Melhor rank: ${save.stats.bestRank[n]||'—'} · Melhor tempo: ${save.stats.bestTime[n]?save.stats.bestTime[n].toFixed(1)+'s':'—'}</small>
      <button data-level="${n}" ${unlocked?'':'disabled'}>${done?'JOGAR NOVAMENTE':'INICIAR'}</button></div>
    </article>`;
  }).join('');
  document.querySelectorAll('[data-level]').forEach(b=>b.onclick=()=>startLevel(Number(b.dataset.level)));
}

function showMenuScreen(name){
  menuScreen=name;$('#mainMenu').classList.remove('hidden');
  document.querySelectorAll('[data-screen]').forEach(s=>s.classList.toggle('hidden',s.dataset.screen!==name));
}
function hideMenu(){$('#mainMenu').classList.add('hidden')}

function startLevel(id){
  runId++;
  if(raf)cancelAnimationFrame(raf);
  reset(id);
  const now=performance.now();
  state.startTime=now+3000;
  state.playerReleaseAt=now+3000;
  state.enemiesReleaseAt=now+8000;
  state.playerReleased=false;
  state.enemiesReleased=false;
  running=true;paused=false;last=now;hideMenu();$('#pauseBtn').classList.remove('hidden');startMusic();
  updateReleaseCountdown(now);
  validateLevelConfiguration();
  const sessionId=runId;
  raf=requestAnimationFrame(t=>loop(t,sessionId));
}
function shiftFutureTimers(delta){
  const shift=v=>v&&v>0?v+delta:v;
  state.playerReleaseAt=shift(state.playerReleaseAt);
  state.enemiesReleaseAt=shift(state.enemiesReleaseAt);
  state.powerUntil=shift(state.powerUntil);
  state.freezeUntil=shift(state.freezeUntil);
  state.comboUntil=shift(state.comboUntil);
  state.finishAt=shift(state.finishAt);
  player.overdriveUntil=shift(player.overdriveUntil);
  player.dashCd=shift(player.dashCd);
  player.skillCd=shift(player.skillCd);
  player.animUntil=shift(player.animUntil);
  player.deathStartedAt=shift(player.deathStartedAt);
  player.deathUntil=shift(player.deathUntil);
  hitLock=shift(hitLock);
  boss.nextAttack=shift(boss.nextAttack);
  boss.invuln=shift(boss.invuln);
  boss.stateUntil=shift(boss.stateUntil);
  boss.deathStartedAt=shift(boss.deathStartedAt);
  boss.deathUntil=shift(boss.deathUntil);
  for(const e of enemies)if(e.dead>0)e.dead+=delta;
  for(const s of shocks)s.phase-=delta;
}
let pauseStartedAt=0;
function pauseGame(){
  if(!running||paused)return;
  pauseStartedAt=performance.now();
  paused=true;running=false;stopMusic();$('#pauseBtn').classList.add('hidden');showMenuScreen('pause')
}
function resumeGame(){
  if(!paused)return;
  const now=performance.now();
  const pausedFor=Math.max(0,now-pauseStartedAt);
  shiftFutureTimers(pausedFor);
  state.startTime+=pausedFor;
  paused=false;running=true;last=now;hideMenu();$('#pauseBtn').classList.remove('hidden');startMusic();
  const sessionId=runId;
  raf=requestAnimationFrame(t=>loop(t,sessionId))
}
function quitToMenu(){
  runId++;
  if(raf)cancelAnimationFrame(raf);
  running=false;paused=false;stopMusic();$('#pauseBtn').classList.add('hidden');showMenuScreen('home');draw(performance.now())
}
function restartGame(){startLevel(currentLevelId)}

function setupMenu(){
  document.querySelectorAll('[data-screen-open]').forEach(b=>b.onclick=()=>showMenuScreen(b.dataset.screenOpen));
  document.querySelectorAll('[data-back]').forEach(b=>b.onclick=()=>showMenuScreen(paused?'pause':'home'));
  document.querySelector('[data-action="resume"]')?.addEventListener('click',resumeGame);
  document.querySelector('[data-action="restart"]')?.addEventListener('click',restartGame);
  document.querySelectorAll('[data-action="quit"]').forEach(b=>b.addEventListener('click',quitToMenu));
  document.querySelector('[data-action="retry"]')?.addEventListener('click',()=>startLevel(currentLevelId));
  document.querySelector('[data-action="next"]')?.addEventListener('click',()=>{if(levels[currentLevelId+1])startLevel(currentLevelId+1);else showMenuScreen('levels')});
  $('#pauseBtn')?.addEventListener('click',pauseGame);

  const gs=$('#graphicsSelect'),vr=$('#volumeRange'),mvr=$('#musicVolumeRange'),svr=$('#sfxVolumeRange'),rf=$('#reduceFlash');
  gs.value=save.settings.graphics;gs.onchange=()=>{save.settings.graphics=gs.value;document.body.classList.toggle('graphics-low',currentGraphics()==='low');persist()};
  vr.value=save.settings.volume;vr.oninput=()=>{save.settings.volume=Number(vr.value);persist()};
  if(mvr){mvr.value=save.settings.musicVolume;mvr.oninput=()=>{save.settings.musicVolume=Number(mvr.value);persist()}}
  if(svr){svr.value=save.settings.sfxVolume;svr.oninput=()=>{save.settings.sfxVolume=Number(svr.value);persist()}}
  rf.checked=!!save.settings.reduceFlash;rf.onchange=()=>{save.settings.reduceFlash=rf.checked;persist()};
  $('#fullscreenBtn')?.addEventListener('click',async()=>{try{if(!document.fullscreenElement)await document.documentElement.requestFullscreen();else await document.exitFullscreen()}catch(e){}});
  $('#resetSaveBtn')?.addEventListener('click',()=>{if(confirm('Apagar todo o progresso de Maze Hunter?')){localStorage.removeItem('mh-core-save');location.reload()}});
  document.querySelectorAll('[data-preset]').forEach(b=>b.addEventListener('click',()=>{
    const presets={speed:['speed','dash','magnet'],survival:['shield','magnet','overdrive'],emp:['pulse','pulsecd','combo']};
    applyBuildPreset(presets[b.dataset.preset]||[]);
  }));

  const stick=$('#virtualStick');
  if(stick){
    const knob=stick.querySelector('.virtual-stick-knob');
    const clearStick=()=>{touch.left=touch.right=touch.up=touch.down=false;if(knob)knob.style.transform='translate(0,0)'};
    const moveStick=e=>{
      const r=stick.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2;
      let dx=e.clientX-cx,dy=e.clientY-cy;const max=r.width*.28,m=Math.hypot(dx,dy)||1;
      if(m>max){dx=dx/m*max;dy=dy/m*max}
      if(knob)knob.style.transform=`translate(${dx}px,${dy}px)`;
      touch.left=dx<-12;touch.right=dx>12;touch.up=dy<-12;touch.down=dy>12;
    };
    stick.addEventListener('pointerdown',e=>{e.preventDefault();ensureAudio();try{stick.setPointerCapture(e.pointerId)}catch{};moveStick(e)});
    stick.addEventListener('pointermove',e=>{if(e.buttons)moveStick(e)});
    stick.addEventListener('pointerup',clearStick);stick.addEventListener('pointercancel',clearStick);
  }
  const updateOrientationHint=()=>{const el=$('#orientationHint');if(el){const coarse=matchMedia('(hover:none),(pointer:coarse)').matches;el.classList.toggle('hidden',!(coarse&&innerHeight>innerWidth))}};
  updateOrientationHint();addEventListener('resize',updateOrientationHint,{passive:true});

  document.querySelectorAll('[data-touch]').forEach(btn=>{
    const k=btn.dataset.touch;
    const on=e=>{e.preventDefault();ensureAudio();if(!touch[k]&&(k==='dash'||k==='skill'))touchPressed[k]=true;touch[k]=true};
    const off=e=>{e.preventDefault();touch[k]=false};
    btn.addEventListener('pointerdown',e=>{on(e);try{btn.setPointerCapture(e.pointerId)}catch{}});
    btn.addEventListener('pointerup',off);btn.addEventListener('pointercancel',off);
  });
}

addEventListener('keydown',e=>{
  if(e.key==='Escape'){
    e.preventDefault();
    if(running)pauseGame();
    else if(paused&&menuScreen==='pause')resumeGame();
    else if(!$('#mainMenu').classList.contains('hidden')&&menuScreen!=='home')showMenuScreen(paused?'pause':'home');
  }
});

load().then(()=>{
  cacheDom();renderUpgrades();renderBuild();renderEquipment();renderLevels();setupMenu();reset(1);showMenuScreen('home');
  document.body.classList.toggle('graphics-low',currentGraphics()==='low');
}).catch(err=>{
  console.error('[Maze Hunter] falha de inicialização:',err);
  renderUpgrades();renderBuild();renderEquipment();renderLevels();setupMenu();reset(1);showMenuScreen('home');
});
