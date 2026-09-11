const C=document.querySelector('#game'),ctx=C.getContext('2d');
const W=C.width,H=C.height,T=32,COLS=28,ROWS=20;
const $=s=>document.querySelector(s);
const keys={};
const touch={up:false,down:false,left:false,right:false,dash:false};
let gamepadDash=false;

addEventListener('keydown',e=>{
  keys[e.key.toLowerCase()]=true;
  if(e.code==='Space')e.preventDefault();
});
addEventListener('keyup',e=>keys[e.key.toLowerCase()]=false);

const paths={
  player:{idle:6,move:6,dash:5,overdrive:6,hurt:4,death:6},
  enemies:{hunter:4,strategist:4,ambusher:4,phase:4,sentinel:6},
  powers:['speed','shield','magnet','freeze','phase','teleport']
};
const images={player:{},enemies:{},powers:{},fragment:[],crystal:[],key:[],battery:[],terminalOff:[],terminalActive:[],doorLocked:[],doorOpen:[],checkpointOff:[],checkpointOn:[],boss:{idle:[],attack:[],hurt:[],death:[]}};

function loadImage(src){
  return new Promise(resolve=>{
    const i=new Image();
    i.onload=()=>resolve(i);
    i.onerror=()=>{console.warn('[Maze Hunter] asset ausente:',src);resolve(null)};
    i.src=src;
  });
}
async function load(){
  for(const [anim,n] of Object.entries(paths.player)){
    images.player[anim]=[];
    for(let i=0;i<n;i++)images.player[anim].push(await loadImage(`assets/sprites/player/${anim}/${String(i).padStart(2,'0')}.webp`));
  }
  for(const [e,n] of Object.entries(paths.enemies)){
    images.enemies[e]=[];
    for(let i=0;i<n;i++)images.enemies[e].push(await loadImage(`assets/sprites/enemies/${e}/move/${String(i).padStart(2,'0')}.webp`));
  }
  for(const p of paths.powers)images.powers[p]=await loadImage(`assets/sprites/powerups/${p}.webp`);
  for(let i=0;i<4;i++){
    images.fragment.push(await loadImage(`assets/sprites/collectibles/fragment_${String(i).padStart(2,'0')}.webp`));
    images.crystal.push(await loadImage(`assets/sprites/collectibles/crystal_${String(i).padStart(2,'0')}.webp`));
    images.doorLocked.push(await loadImage(`assets/sprites/items/door_locked/${String(i).padStart(2,'0')}.webp`));
    images.doorOpen.push(await loadImage(`assets/sprites/items/door_open/${String(i).padStart(2,'0')}.webp`));
  }
  for(let i=0;i<6;i++){
    images.key.push(await loadImage(`assets/sprites/items/key/${String(i).padStart(2,'0')}.webp`));
    images.battery.push(await loadImage(`assets/sprites/items/battery/${String(i).padStart(2,'0')}.webp`));
    images.terminalOff.push(await loadImage(`assets/sprites/items/terminal_off/${String(i).padStart(2,'0')}.webp`));
    images.terminalActive.push(await loadImage(`assets/sprites/items/terminal_active/${String(i).padStart(2,'0')}.webp`));
    images.checkpointOff.push(await loadImage(`assets/sprites/items/checkpoint_off/${String(i).padStart(2,'0')}.webp`));
    images.checkpointOn.push(await loadImage(`assets/sprites/items/checkpoint_on/${String(i).padStart(2,'0')}.webp`));
    for(const s of ['idle','attack','hurt','death'])images.boss[s].push(await loadImage(`assets/sprites/bosses/core_warden/${s}/${String(i).padStart(2,'0')}.webp`));
  }
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
"#.####.#####.##.#####.####.#",
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

const levels={
  1:{
    name:'Laboratório Abandonado',
    map:M1, theme:{bg:'#06101a',wall:'#10283b',edge:'#1e5a78',inner:'#16344b'},
    start:[14,16],terminals:[[3,10],[24,10]],special:{type:'key',pos:[14,4]},exit:[14,1],
    crystals:[[2,2],[25,2],[2,17],[25,17]],
    powers:[[7,4,'speed'],[20,4,'shield'],[4,14,'magnet'],[23,14,'freeze'],[9,10,'phase'],[18,10,'teleport']],
    enemies:[['hunter',13,8],['strategist',14,8],['ambusher',13,10],['phase',14,10]],
    checkpoint:[14,14], boss:true, bossHp:5, reward:5
  },
  2:{
    name:'Metrô Espectral',
    map:M2, theme:{bg:'#120d18',wall:'#2d1c32',edge:'#a9502d',inner:'#4b283a'},
    start:[2,18],terminals:[[5,3],[22,3],[14,15]],special:{type:'battery',pos:[14,9]},exit:[25,18],
    crystals:[[1,1],[26,1],[1,15],[26,15],[14,18]],
    powers:[[9,3,'speed'],[18,3,'shield'],[4,11,'magnet'],[23,11,'freeze'],[10,17,'phase'],[20,17,'teleport']],
    enemies:[['sentinel',7,7],['sentinel',21,7],['hunter',13,11],['strategist',17,15],['phase',9,15]],
    checkpoint:[14,13],
    shocks:[[8,5],[19,5],[7,13],[20,13]], boss:false, reward:8
  }
};

const upgradeDefs=[
 {id:'speed',name:'Velocidade Base',desc:'+4% velocidade por nível',max:5,base:80},
 {id:'overdrive',name:'Duração do Overdrive',desc:'+1,2 s por nível',max:5,base:100},
 {id:'magnet',name:'Ímã Permanente',desc:'atrai fragmentos próximos',max:3,base:140},
 {id:'shield',name:'Escudo Inicial',desc:'começa a fase protegido',max:1,base:250},
 {id:'dash',name:'Dash Adicional',desc:'reduz recarga do dash',max:3,base:180},
];

let save=JSON.parse(localStorage.getItem('mh-core-save')||'null')||{};
save.crystals=Number(save.crystals||0);
save.upgrades=Object.assign({speed:0,overdrive:0,magnet:0,shield:0,dash:0},save.upgrades||{});
save.equipped=Array.isArray(save.equipped)?save.equipped:[];
save.settings=Object.assign({graphics:'auto',volume:80,reduceFlash:false},save.settings||{});
save.completed=Object.assign({1:false,2:false},save.completed||{});

function persist(){
  localStorage.setItem('mh-core-save',JSON.stringify(save));
  renderUpgrades();renderBuild();renderEquipment();renderLevels();
}

let currentLevelId=1,level=levels[1],map=level.map.map(r=>r.split(''));
let state,player,enemies,frags,crystals,powers,terminals,specialItem,exitDoor,boss,checkpoint,shocks;
let raf,last=0,running=false,paused=false,menuScreen='home',hitLock=0,toastTimer=0;

function reset(levelId=currentLevelId){
  currentLevelId=levelId;level=levels[levelId];map=level.map.map(r=>r.padEnd(COLS,'#').slice(0,COLS).split(''));
  state={score:0,lives:3,combo:1,remaining:0,activePower:null,powerUntil:0,freezeUntil:0,terminals:0,hasSpecial:false,bossStarted:false,bossDefeated:false};
  player={x:level.start[0]*T+T/2,y:level.start[1]*T+T/2,dir:{x:-1,y:0},moveDir:{x:0,y:0},queuedDir:{x:0,y:0},speed:120*(1+save.upgrades.speed*.04),anim:'idle',shield:save.upgrades.shield>0,dashCd:0,overdriveUntil:0};
  frags=[];crystals=[];powers=[];enemies=[];
  terminals=level.terminals.map(([x,y])=>({x:x*T+T/2,y:y*T+T/2,on:false}));
  specialItem={x:level.special.pos[0]*T+T/2,y:level.special.pos[1]*T+T/2,on:true,type:level.special.type};
  exitDoor={x:level.exit[0]*T+T/2,y:level.exit[1]*T+T/2,open:false};
  checkpoint={x:level.checkpoint[0]*T+T/2,y:level.checkpoint[1]*T+T/2,on:false,spawn:{x:player.x,y:player.y}};
  shocks=(level.shocks||[]).map(([x,y],i)=>({x:x*T+T/2,y:y*T+T/2,phase:i*700}));
  boss={x:14*T,y:9*T,hp:level.bossHp||0,maxHp:level.bossHp||0,state:'idle',nextAttack:0,dead:!level.boss,invuln:0};

  for(let y=0;y<ROWS;y++)for(let x=0;x<COLS;x++){
    const c=map[y][x];
    if(c==='.'||c==='o'){frags.push({x:x*T+T/2,y:y*T+T/2,on:true,big:c==='o'});state.remaining++}
  }
  level.crystals.forEach(([x,y])=>crystals.push({x:x*T+T/2,y:y*T+T/2,on:true}));
  level.powers.forEach(([x,y,t])=>powers.push({x:x*T+T/2,y:y*T+T/2,type:t,on:true}));
  level.enemies.forEach(([type,x,y],i)=>enemies.push({type,x:x*T+T/2,y:y*T+T/2,dir:i%2?{x:1,y:0}:{x:-1,y:0},speed:type==='sentinel'?92:74+i*4,dead:0}));
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
  const step=4;
  return [
    {x:1,y:0},{x:-1,y:0},{x:0,y:1},{x:0,y:-1}
  ].filter(d=>canMove(x,y,d.x*step,d.y*step,r));
}
const near=(a,b,d=22)=>Math.hypot(a.x-b.x,a.y-b.y)<d;

function showToast(text,type='good'){
  const el=$('#toast'); if(!el)return;
  el.textContent=text;el.className=`toast ${type}`;
  clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.add('hidden'),1700);
}

function collect(){
  const magnet=save.upgrades.magnet>0||state.activePower==='magnet';
  for(const f of frags)if(f.on){
    if(magnet&&Math.hypot(f.x-player.x,f.y-player.y)<90){f.x+=(player.x-f.x)*.08;f.y+=(player.y-f.y)*.08}
    if(near(player,f,18)){f.on=false;state.score+=f.big?50:10;state.remaining--;if(f.big)player.overdriveUntil=performance.now()+5000+save.upgrades.overdrive*1200}
  }
  for(const c of crystals)if(c.on&&near(player,c,22)){c.on=false;save.crystals++;state.score+=100;persist()}
  for(const p of powers)if(p.on&&near(player,p,23)){p.on=false;activatePower(p.type)}
  for(const t of terminals)if(!t.on&&near(player,t,25)){t.on=true;state.terminals++;state.score+=250;showToast(`Terminal ${state.terminals}/${terminals.length} ativado`)}
  if(specialItem.on&&near(player,specialItem,24)){specialItem.on=false;state.hasSpecial=true;state.score+=350;showToast(specialItem.type==='battery'?'Bateria espectral recuperada':'Chave do Núcleo obtida')}
  if(!checkpoint.on&&near(player,checkpoint,28)){
    checkpoint.on=true;checkpoint.spawn={x:checkpoint.x,y:checkpoint.y};state.score+=150;
    $('#checkpointText').textContent='Checkpoint ativo: você renasce aqui.';
    showToast('Checkpoint ativado');
  }
  if(exitDoor.open&&near(player,exitDoor,29)){
    if(level.boss&&!state.bossStarted)startBoss();
    else if(!level.boss)completeLevel();
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
  else if(level.boss&&!state.bossStarted)$('#objectiveText').textContent='Vá até o portão para despertar o Core Warden.';
  else if(level.boss&&!state.bossDefeated)$('#objectiveText').textContent='Use Overdrive para causar dano ao Core Warden.';
  else $('#objectiveText').textContent='Alcance a saída para concluir a fase.';
}

function startBoss(){
  state.bossStarted=true;boss.x=14*T;boss.y=9*T;boss.hp=boss.maxHp;boss.dead=false;boss.nextAttack=performance.now()+1000;
  showToast('CORE WARDEN DESPERTOU','warn');
}
function updateBoss(dt,now){
  if(!level.boss||!state.bossStarted||boss.dead)return;
  boss.state='idle';
  const dx=player.x-boss.x,dy=player.y-boss.y,dist=Math.hypot(dx,dy)||1;
  if(dist>75){boss.x+=dx/dist*58*dt;boss.y+=dy/dist*58*dt}
  if(now>boss.nextAttack){boss.state='attack';boss.nextAttack=now+1500}
  if(near(player,boss,42)){
    if(player.overdriveUntil>now&&now>boss.invuln){
      boss.hp--;boss.invuln=now+900;boss.state='hurt';state.score+=750;state.combo=Math.min(16,state.combo*2);
      if(boss.hp<=0){boss.dead=true;state.bossDefeated=true;state.score+=3000;save.crystals+=8;persist();showToast('Core Warden derrotado');setTimeout(completeLevel,650)}
    }else if(now>boss.invuln-700)hit();
  }
}

function activatePower(type){
  state.activePower=type;state.powerUntil=performance.now()+7000;
  if(type==='shield')player.shield=true;
  if(type==='freeze')state.freezeUntil=performance.now()+6500;
  if(type==='teleport'){player.x=checkpoint.on?checkpoint.spawn.x:level.start[0]*T+T/2;player.y=checkpoint.on?checkpoint.spawn.y:level.start[1]*T+T/2}
  showToast(`Power-up: ${type.toUpperCase()}`);
}

function gamepadVector(){
  const pads=navigator.getGamepads?navigator.getGamepads():[];
  const gp=[...pads].find(Boolean); if(!gp)return {x:0,y:0,dash:false};
  let x=gp.axes?.[0]||0,y=gp.axes?.[1]||0;
  if(Math.abs(x)<.25)x=0;if(Math.abs(y)<.25)y=0;
  if(gp.buttons?.[14]?.pressed)x=-1;if(gp.buttons?.[15]?.pressed)x=1;
  if(gp.buttons?.[12]?.pressed)y=-1;if(gp.buttons?.[13]?.pressed)y=1;
  return {x,y,dash:!!(gp.buttons?.[0]?.pressed||gp.buttons?.[1]?.pressed)};
}

function updatePlayer(dt,now){
  let wantX=0,wantY=0;
  if(keys['arrowleft']||keys['a']||touch.left)wantX=-1;
  if(keys['arrowright']||keys['d']||touch.right)wantX=1;
  if(keys['arrowup']||keys['w']||touch.up)wantY=-1;
  if(keys['arrowdown']||keys['s']||touch.down)wantY=1;

  const gp=gamepadVector();
  if(!wantX&&Math.abs(gp.x)>.25)wantX=Math.sign(gp.x);
  if(!wantY&&Math.abs(gp.y)>.25)wantY=Math.sign(gp.y);

  // Pac-like corridor movement: keep current direction until the requested turn is actually possible.
  if(!player.moveDir)player.moveDir={x:0,y:0};
  if(!player.queuedDir)player.queuedDir={x:0,y:0};

  if(wantX||wantY){
    // prioritize the stronger/most recent cardinal intent, avoiding diagonal wall snagging
    if(Math.abs(wantX)>=Math.abs(wantY) && wantX) player.queuedDir={x:wantX,y:0};
    else if(wantY) player.queuedDir={x:0,y:wantY};
  }

  const baseSpeed=player.speed*(state.activePower==='speed'?1.45:1);
  const dashPressed=keys[' ']||touch.dash||gp.dash;
  const dashing=dashPressed&&now>player.dashCd;
  let sp=baseSpeed;
  if(dashing){
    sp*=2.35;
    player.dashCd=now+Math.max(550,1200-save.upgrades.dash*180);
    player.anim='dash';
  }else player.anim=(player.moveDir.x||player.moveDir.y)?'move':'idle';
  if(player.overdriveUntil>now)player.anim='overdrive';

  const phase=state.activePower==='phase';
  const step=sp*dt;

  // At tile centers, accept queued turns if valid.
  const centeredX=alignedToGrid(player.x,5), centeredY=alignedToGrid(player.y,5);
  if(centeredX&&centeredY){
    snapIfClose(player);
    const q=player.queuedDir;
    if(q && (q.x||q.y) && (phase||canMove(player.x,player.y,q.x*5,q.y*5,12))){
      player.moveDir={x:q.x,y:q.y};
      player.dir={x:q.x,y:q.y};
    }
  }

  // Allow immediate reversal even outside exact center.
  const q=player.queuedDir;
  if(q && player.moveDir && q.x===-player.moveDir.x && q.y===-player.moveDir.y){
    player.moveDir={x:q.x,y:q.y};
    player.dir={x:q.x,y:q.y};
  }

  let mx=player.moveDir.x*step,my=player.moveDir.y*step;
  if(phase||canMove(player.x,player.y,mx,my,12)){
    player.x+=mx;player.y+=my;
  }else{
    // stop exactly at corridor center instead of vibrating against walls
    snapIfClose(player);
    player.moveDir={x:0,y:0};
    player.anim='idle';
  }

  // horizontal tunnels may wrap; vertical movement remains clamped
  if(player.x<0)player.x=W-1;
  if(player.x>=W)player.x=1;
  player.y=Math.max(T/2,Math.min(H-T/2,player.y));

  if(state.powerUntil<now)state.activePower=null;
  collect();
}
function chooseEnemyDir(e){
  const dirs=validDirsAt(e.x,e.y,11);
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
  for(const e of enemies){
    if(e.dead>now||state.freezeUntil>now)continue;

    // The phase enemy no longer ignores maze collision; "phase" becomes visual/behavioral, not wall-cheating.
    const centeredX=alignedToGrid(e.x,4),centeredY=alignedToGrid(e.y,4);
    if(centeredX&&centeredY){
      snapIfClose(e);
      const dirs=validDirsAt(e.x,e.y,11);
      const forwardOK=dirs.some(d=>d.x===e.dir.x&&d.y===e.dir.y);
      const intersection=dirs.length>=3;
      if(!forwardOK||intersection||Math.random()<(e.type==='ambusher'?.10:e.type==='sentinel'?.06:.025)){
        e.dir=chooseEnemyDir(e);
      }
    }

    const step=e.speed*dt;
    const mx=e.dir.x*step,my=e.dir.y*step;
    if(canMove(e.x,e.y,mx,my,11)){
      e.x+=mx;e.y+=my;
    }else{
      snapIfClose(e);
      e.dir=chooseEnemyDir(e);
    }

    if(e.x<0)e.x=W-1;
    if(e.x>=W)e.x=1;

    if(near(player,e,24)){
      if(player.overdriveUntil>now){
        e.dead=now+3500;
        state.combo=Math.min(16,state.combo*2);
        state.score+=200*state.combo;
      }else if(player.shield){
        player.shield=false;
        e.dead=now+1800;
      }else hit();
    }
  }
}
function updateShocks(now){
  if(!shocks.length)return;
  for(const s of shocks){
    const active=((now+s.phase)%3200)<1300;
    if(active&&near(player,s,23))hit();
  }
}

function hit(){
  const now=performance.now();if(now<hitLock)return;hitLock=now+1500;
  if(player.shield){player.shield=false;showToast('Escudo quebrado','warn');return}
  state.lives--;state.combo=1;player.anim='hurt';
  player.x=checkpoint.on?checkpoint.spawn.x:level.start[0]*T+T/2;
  player.y=checkpoint.on?checkpoint.spawn.y:level.start[1]*T+T/2;
  player.moveDir={x:0,y:0};player.queuedDir={x:0,y:0};
  if(state.lives<=0)gameOver();
}

function completeLevel(){
  if(!running&&menuScreen==='result')return;
  running=false;paused=false;
  save.completed[currentLevelId]=true;
  save.crystals+=level.reward;
  persist();
  $('#pauseBtn')?.classList.add('hidden');
  $('#resultTitle').textContent=`FASE ${currentLevelId} CONCLUÍDA`;
  $('#resultText').textContent=`${level.name}\nPontuação: ${state.score}\nRecompensa: +${level.reward} cristais`;
  const nextBtn=document.querySelector('[data-action="next"]');
  if(nextBtn)nextBtn.style.display=levels[currentLevelId+1]?'':'none';
  showMenuScreen('result');
}
function gameOver(){
  running=false;paused=false;$('#pauseBtn')?.classList.add('hidden');
  $('#resultTitle').textContent='GAME OVER';
  $('#resultText').textContent=`Fase ${currentLevelId} — ${level.name}\nPontuação: ${state.score}\nO checkpoint continua válido apenas nesta tentativa.`;
  const nextBtn=document.querySelector('[data-action="next"]');if(nextBtn)nextBtn.style.display='none';
  showMenuScreen('result');
}
function updateHud(){
  $('#score').textContent=state.score;$('#lives').textContent=state.lives;$('#combo').textContent='x'+state.combo;
  $('#power').textContent=state.activePower||'—';$('#wallet').textContent=save.crystals;updateObjectiveState();
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

  if(level.boss&&state.bossStarted&&!boss.dead){
    safeDraw(frame(images.boss[boss.state]||images.boss.idle,a6),boss.x-48,boss.y-48,96,96);
    ctx.fillStyle='#230808';ctx.fillRect(W/2-110,54,220,12);ctx.fillStyle='#ff5246';ctx.fillRect(W/2-108,56,216*(boss.hp/boss.maxHp),8);
  }

  for(const e of enemies)if(e.dead<=now){
    const im=frame(images.enemies[e.type],Math.floor(now/120));
    ctx.save();ctx.globalAlpha=e.type==='phase'?.7:1;
    if(!safeDraw(im,e.x-24,e.y-24,48,48)){ctx.fillStyle='#ff5470';ctx.beginPath();ctx.arc(e.x,e.y,18,0,Math.PI*2);ctx.fill()}
    ctx.restore();
  }

  const arr=images.player[player.anim]||images.player.idle,im=frame(arr,Math.floor(now/110));
  ctx.save();ctx.translate(player.x,player.y);ctx.rotate(Math.atan2(player.dir.y,player.dir.x));
  const q=currentGraphics();
  if(q!=='low'&&!save.settings.reduceFlash){ctx.shadowColor=player.anim==='overdrive'?'#d54cff':'#32d8ff';ctx.shadowBlur=q==='high'?18:8}
  safeDraw(im,-31,-31,62,62);ctx.restore();
  if(player.shield){ctx.strokeStyle='#56c9ff';ctx.lineWidth=3;ctx.beginPath();ctx.arc(player.x,player.y,30,0,Math.PI*2);ctx.stroke()}
}

function loop(now){
  if(!running)return;
  const dt=Math.min(.033,(now-last)/1000||0);last=now;
  updatePlayer(dt,now);updateEnemies(dt,now);updateBoss(dt,now);updateShocks(now);updateHud();draw(now);
  raf=requestAnimationFrame(loop);
}

function renderUpgrades(){
  $('#wallet').textContent=save.crystals;
  const list=$('#upgradeList');if(!list)return;
  list.innerHTML=upgradeDefs.map(u=>{
    const lv=save.upgrades[u.id]||0,cost=u.base*(lv+1),max=lv>=u.max;
    return `<div class="upgrade"><div><b>${u.name}</b> <span class="badge">Nv. ${lv}/${u.max}</span><small>${u.desc}</small></div><button data-buy="${u.id}" ${max?'disabled':''}>${max?'MAX':'💎 '+cost}</button></div>`;
  }).join('');
  document.querySelectorAll('[data-buy]').forEach(b=>b.onclick=()=>buy(b.dataset.buy));
}
function buy(id){
  const u=upgradeDefs.find(x=>x.id===id),lv=save.upgrades[id]||0,cost=u.base*(lv+1);
  if(lv<u.max&&save.crystals>=cost){save.crystals-=cost;save.upgrades[id]++;persist()}
}
function renderBuild(){
  const el=$('#buildSummary');if(!el)return;
  const chosen=save.equipped.length?save.equipped:upgradeDefs.filter(u=>save.upgrades[u.id]>0).slice(0,3).map(u=>u.id);
  el.innerHTML=chosen.map(id=>{const u=upgradeDefs.find(x=>x.id===id);return u?`<span class="badge">${u.name} ${save.upgrades[id]||0}</span>`:''}).join(' ')||'<small>Nenhum módulo equipado.</small>';
}
function renderEquipment(){
  const grid=$('#equipmentGrid'),slots=$('#equippedSlots');if(!grid||!slots)return;
  grid.innerHTML=upgradeDefs.map(u=>{
    const selected=save.equipped.includes(u.id);
    return `<div class="module ${selected?'selected':''}"><b>${u.name}</b><p>Nível ${save.upgrades[u.id]||0}/${u.max}</p><button data-equip="${u.id}" ${(save.upgrades[u.id]||0)<=0?'disabled':''}>${selected?'REMOVER':'EQUIPAR'}</button></div>`;
  }).join('');
  document.querySelectorAll('[data-equip]').forEach(b=>b.onclick=()=>{
    const id=b.dataset.equip;
    if(save.equipped.includes(id))save.equipped=save.equipped.filter(x=>x!==id);
    else if(save.equipped.length<3)save.equipped.push(id);
    persist();
  });
  slots.innerHTML=save.equipped.map(id=>`<span class="badge">${upgradeDefs.find(u=>u.id===id)?.name||id}</span>`).join(' ')||'<small>Escolha até 3 módulos.</small>';
}
function renderLevels(){
  const grid=$('#levelGrid');if(!grid)return;
  grid.innerHTML=Object.entries(levels).map(([id,l])=>{
    const n=Number(id),unlocked=n===1||save.completed[n-1],done=!!save.completed[n];
    return `<article class="level-card ${unlocked?'':'locked'}">
      <span class="level-status">${done?'CONCLUÍDA':unlocked?'DISPONÍVEL':'BLOQUEADA'}</span>
      <img src="assets/ui/levels/level${n}.webp" alt="">
      <div class="level-info"><h3>FASE ${n} — ${l.name}</h3>
      <p>${n===1?'Terminais, chave e confronto com o Core Warden.':'Trilhos eletrificados, 3 terminais, checkpoint e Rail Sentinels.'}</p>
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
  reset(id);running=true;paused=false;last=performance.now();hideMenu();$('#pauseBtn').classList.remove('hidden');requestAnimationFrame(loop);
}
function pauseGame(){if(!running||paused)return;paused=true;running=false;$('#pauseBtn').classList.add('hidden');showMenuScreen('pause')}
function resumeGame(){if(!paused)return;paused=false;running=true;last=performance.now();hideMenu();$('#pauseBtn').classList.remove('hidden');requestAnimationFrame(loop)}
function quitToMenu(){running=false;paused=false;$('#pauseBtn').classList.add('hidden');showMenuScreen('home');draw(performance.now())}
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

  const gs=$('#graphicsSelect'),vr=$('#volumeRange'),rf=$('#reduceFlash');
  gs.value=save.settings.graphics;gs.onchange=()=>{save.settings.graphics=gs.value;document.body.classList.toggle('graphics-low',currentGraphics()==='low');persist()};
  vr.value=save.settings.volume;vr.oninput=()=>{save.settings.volume=Number(vr.value);persist()};
  rf.checked=!!save.settings.reduceFlash;rf.onchange=()=>{save.settings.reduceFlash=rf.checked;persist()};
  $('#fullscreenBtn')?.addEventListener('click',async()=>{try{if(!document.fullscreenElement)await document.documentElement.requestFullscreen();else await document.exitFullscreen()}catch(e){}});
  $('#resetSaveBtn')?.addEventListener('click',()=>{if(confirm('Apagar todo o progresso de Maze Hunter?')){localStorage.removeItem('mh-core-save');location.reload()}});

  document.querySelectorAll('[data-touch]').forEach(btn=>{
    const k=btn.dataset.touch;
    const on=e=>{e.preventDefault();touch[k]=true};
    const off=e=>{e.preventDefault();touch[k]=false};
    btn.addEventListener('pointerdown',on);btn.addEventListener('pointerup',off);btn.addEventListener('pointercancel',off);btn.addEventListener('pointerleave',off);
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
  renderUpgrades();renderBuild();renderEquipment();renderLevels();setupMenu();reset(1);showMenuScreen('home');
  document.body.classList.toggle('graphics-low',currentGraphics()==='low');
}).catch(err=>{
  console.error('[Maze Hunter] falha de inicialização:',err);
  renderUpgrades();renderBuild();renderEquipment();renderLevels();setupMenu();reset(1);showMenuScreen('home');
});
