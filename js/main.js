const C=document.querySelector('#game'),ctx=C.getContext('2d');
const W=C.width,H=C.height,T=32,COLS=28,ROWS=20;
const $=s=>document.querySelector(s);
const keys={}; addEventListener('keydown',e=>{keys[e.key.toLowerCase()]=true;if(e.code==='Space')e.preventDefault()}); addEventListener('keyup',e=>keys[e.key.toLowerCase()]=false);

const paths={
 player:{idle:6,move:6,dash:5,overdrive:6,hurt:4,death:6},
 enemies:['hunter','strategist','ambusher','phase'],
 powers:['speed','shield','magnet','freeze','phase','teleport']
};
const images={player:{},enemies:{},powers:{},fragment:[],crystal:[],key:[],terminalOff:[],terminalActive:[],doorLocked:[],doorOpen:[],boss:{idle:[],attack:[],hurt:[],death:[]}};
function img(src){return new Promise((res,rej)=>{const i=new Image();i.onload=()=>res(i);i.onerror=rej;i.src=src})}
async function load(){
 for(const [anim,n] of Object.entries(paths.player)){images.player[anim]=[];for(let i=0;i<n;i++)images.player[anim].push(await img(`assets/sprites/player/${anim}/${String(i).padStart(2,'0')}.webp`))}
 for(const e of paths.enemies){images.enemies[e]=[];for(let i=0;i<4;i++)images.enemies[e].push(await img(`assets/sprites/enemies/${e}/move/${String(i).padStart(2,'0')}.webp`))}
 for(const p of paths.powers) images.powers[p]=await img(`assets/sprites/powerups/${p}.webp`);
 for(let i=0;i<4;i++){images.fragment.push(await img(`assets/sprites/collectibles/fragment_${String(i).padStart(2,'0')}.webp`));images.crystal.push(await img(`assets/sprites/collectibles/crystal_${String(i).padStart(2,'0')}.webp`))}
 for(let i=0;i<6;i++){images.key.push(await img(`assets/sprites/items/key/${String(i).padStart(2,'0')}.webp`));images.terminalOff.push(await img(`assets/sprites/items/terminal_off/${String(i).padStart(2,'0')}.webp`));images.terminalActive.push(await img(`assets/sprites/items/terminal_active/${String(i).padStart(2,'0')}.webp`));for(const s of ['idle','attack','hurt','death'])images.boss[s].push(await img(`assets/sprites/bosses/core_warden/${s}/${String(i).padStart(2,'0')}.webp`))}
 for(let i=0;i<4;i++){images.doorLocked.push(await img(`assets/sprites/items/door_locked/${String(i).padStart(2,'0')}.webp`));images.doorOpen.push(await img(`assets/sprites/items/door_open/${String(i).padStart(2,'0')}.webp`))}
}
const map=[
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
].map(r=>r.padEnd(COLS,'#').slice(0,COLS).split(''));

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
function persist(){
 localStorage.setItem('mh-core-save',JSON.stringify(save));
 renderUpgrades();renderBuild();renderEquipment();
}

let state,player,enemies,frags,crystals,powers,terminals,keyItem,exitDoor,boss,raf,last=0,running=false;
function reset(){
 state={score:0,lives:3,combo:1,remaining:0,activePower:null,powerUntil:0,freezeUntil:0,terminals:0,hasKey:false,bossStarted:false,bossDefeated:false};
 player={x:14*T,y:16*T,vx:0,vy:0,dir:{x:-1,y:0},speed:120*(1+save.upgrades.speed*.04),anim:'idle',shield:save.upgrades.shield>0,dashCd:0,overdriveUntil:0};
 frags=[];crystals=[];powers=[];enemies=[];
 terminals=[{x:3*T+T/2,y:10*T+T/2,on:false},{x:24*T+T/2,y:10*T+T/2,on:false}];
 keyItem={x:14*T+T/2,y:4*T+T/2,on:true};
 exitDoor={x:14*T+T/2,y:1*T+T/2,open:false};
 boss={x:14*T,y:9*T,hp:5,maxHp:5,state:'idle',nextAttack:0,dead:false,invuln:0};
 for(let y=0;y<ROWS;y++)for(let x=0;x<COLS;x++){
   const c=map[y][x]; if(c==='.'||c==='o'){frags.push({x:x*T+T/2,y:y*T+T/2,on:true,big:c==='o'});state.remaining++}
 }
 [[2,2],[25,2],[2,17],[25,17]].forEach(([x,y])=>crystals.push({x:x*T+T/2,y:y*T+T/2,on:true}));
 const pspots=[[7,4,'speed'],[20,4,'shield'],[4,14,'magnet'],[23,14,'freeze'],[9,10,'phase'],[18,10,'teleport']];
 pspots.forEach(([x,y,t])=>powers.push({x:x*T+T/2,y:y*T+T/2,type:t,on:true}));
 const defs=[['hunter',13,8],['strategist',14,8],['ambusher',13,10],['phase',14,10]];
 defs.forEach(([type,x,y],i)=>enemies.push({type,x:x*T+T/2,y:y*T+T/2,dir:i%2?{x:1,y:0}:{x:-1,y:0},speed:74+i*6,dead:0}));
 updateObjectiveState();updateHud()
}
function wall(px,py){const x=Math.floor(px/T),y=Math.floor(py/T);if(x<0||x>=COLS||y<0||y>=ROWS)return true;return map[y][x]==='#'}
function canMove(x,y,dx,dy,r=11){
 return !wall(x+dx+(dx>0?r:-r),y+dy+(dy?0:r)) &&
        !wall(x+dx+(dx>0?r:-r),y+dy-(dy?0:r)) &&
        !wall(x+dx,y+dy+(dy>0?r:-r)) &&
        !wall(x+dx,y+dy-(dy>0?r:-r))
}
function near(a,b,d=22){return Math.hypot(a.x-b.x,a.y-b.y)<d}
function collect(){
 const magnet=save.upgrades.magnet>0 || state.activePower==='magnet';
 for(const f of frags) if(f.on){
   if(magnet && Math.hypot(f.x-player.x,f.y-player.y)<90){f.x+=(player.x-f.x)*.08;f.y+=(player.y-f.y)*.08}
   if(near(player,f,18)){f.on=false;state.score+=f.big?50:10;state.remaining--;if(f.big)player.overdriveUntil=performance.now()+5000+save.upgrades.overdrive*1200}
 }
 for(const c of crystals) if(c.on&&near(player,c,22)){c.on=false;save.crystals++;state.score+=100;persist()}
 for(const p of powers) if(p.on&&near(player,p,23)){p.on=false;activatePower(p.type)}
 for(const t of terminals) if(!t.on&&near(player,t,25)){t.on=true;state.terminals++;state.score+=250;updateObjectiveState()}
 if(keyItem.on&&near(player,keyItem,24)){keyItem.on=false;state.hasKey=true;state.score+=300;updateObjectiveState()}
 if(exitDoor.open&&near(player,exitDoor,28)&&!state.bossStarted){startBoss()}
 if(state.remaining<=0) updateObjectiveState();
}

function updateObjectiveState(){
 const ready=state.remaining<=0&&state.terminals>=2&&state.hasKey;
 exitDoor.open=ready;
 if(state.bossDefeated)return;
 if(state.remaining>0)$('#objective').textContent=`FRAGS ${state.remaining}`;
 else if(state.terminals<2)$('#objective').textContent=`TERMINAIS ${state.terminals}/2`;
 else if(!state.hasKey)$('#objective').textContent='ENCONTRE A CHAVE';
 else if(!state.bossStarted)$('#objective').textContent='ABRA O PORTÃO';
 else $('#objective').textContent=`BOSS ${Math.max(0,boss.hp)}/${boss.maxHp}`;
}
function startBoss(){
 state.bossStarted=true;
 $('#objective').textContent='CORE WARDEN';
 boss.x=14*T; boss.y=9*T; boss.hp=boss.maxHp; boss.state='idle'; boss.dead=false; boss.nextAttack=performance.now()+1200;
}
function updateBoss(dt,now){
 if(!state.bossStarted||boss.dead)return;
 boss.state='idle';
 const dx=player.x-boss.x,dy=player.y-boss.y,dist=Math.hypot(dx,dy)||1;
 const sp=54;
 if(dist>75){boss.x+=dx/dist*sp*dt;boss.y+=dy/dist*sp*dt}
 if(now>boss.nextAttack){boss.state='attack';boss.nextAttack=now+1600}
 if(near(player,boss,42)){
   if(player.overdriveUntil>now&&now>boss.invuln){
      boss.hp--;boss.invuln=now+900;boss.state='hurt';state.score+=750;state.combo=Math.min(16,state.combo*2);
      if(boss.hp<=0){boss.dead=true;boss.state='death';state.bossDefeated=true;state.score+=3000;save.crystals+=8;persist();setTimeout(win,900)}
   } else if(now>boss.invuln-700) hit();
 }
 updateObjectiveState();
}

function activatePower(type){
 state.activePower=type;state.powerUntil=performance.now()+7000;
 if(type==='shield')player.shield=true;
 if(type==='freeze')state.freezeUntil=performance.now()+6500;
 if(type==='teleport'){player.x=14*T;player.y=16*T}
}
function updatePlayer(dt,now){
 let dx=0,dy=0;
 if(keys['arrowleft']||keys['a'])dx=-1;if(keys['arrowright']||keys['d'])dx=1;
 if(keys['arrowup']||keys['w'])dy=-1;if(keys['arrowdown']||keys['s'])dy=1;
 if(dx&&dy){dx*=.707;dy*=.707}
 let sp=player.speed*(state.activePower==='speed'?1.45:1);
 const dashing=keys[' ']&&now>player.dashCd;
 if(dashing){sp*=2.8;player.dashCd=now+Math.max(550,1200-save.upgrades.dash*180);player.anim='dash'}
 else player.anim=(dx||dy)?'move':'idle';
 if(player.overdriveUntil>now)player.anim='overdrive';
 const phase=state.activePower==='phase';
 let mx=dx*sp*dt,my=dy*sp*dt;
 if(dx||dy)player.dir={x:dx,y:dy};
 if(phase||canMove(player.x,player.y,mx,my,12)){player.x+=mx;player.y+=my}else{
   if(phase||canMove(player.x,player.y,mx,0,12))player.x+=mx;
   if(phase||canMove(player.x,player.y,0,my,12))player.y+=my;
 }
 player.x=(player.x+W)%W; player.y=Math.max(T,Math.min(H-T,player.y));
 if(state.powerUntil<now)state.activePower=null;
 collect()
}
function updateEnemies(dt,now){
 for(const e of enemies){if(e.dead>now)continue;
   if(state.freezeUntil>now)continue;
   const tx=player.x-e.x,ty=player.y-e.y;
   let cand;
   if(e.type==='hunter')cand=Math.abs(tx)>Math.abs(ty)?{x:Math.sign(tx),y:0}:{x:0,y:Math.sign(ty)};
   else if(e.type==='strategist')cand=Math.abs(tx)<Math.abs(ty)?{x:Math.sign(tx),y:0}:{x:0,y:Math.sign(ty)};
   else if(e.type==='ambusher'){cand=Math.random()<.04?{x:[-1,1,0,0][Math.floor(Math.random()*4)],y:[0,0,-1,1][Math.floor(Math.random()*4)]}:e.dir}
   else cand=Math.random()<.02?{x:[-1,1,0,0][Math.floor(Math.random()*4)],y:[0,0,-1,1][Math.floor(Math.random()*4)]}:e.dir;
   let mx=cand.x*e.speed*dt,my=cand.y*e.speed*dt;
   const ph=e.type==='phase';
   if(ph||canMove(e.x,e.y,mx,my,11)){e.x+=mx;e.y+=my;e.dir=cand}
   else{
     const opts=[{x:1,y:0},{x:-1,y:0},{x:0,y:1},{x:0,y:-1}].sort(()=>Math.random()-.5);
     const o=opts.find(o=>canMove(e.x,e.y,o.x*3,o.y*3,11));if(o)e.dir=o;
   }
   e.x=(e.x+W)%W;
   if(near(player,e,24)){
     if(player.overdriveUntil>now){e.dead=now+3500;state.combo=Math.min(16,state.combo*2);state.score+=200*state.combo}
     else if(player.shield){player.shield=false;e.dead=now+1800}
     else hit();
   }
 }
}
let hitLock=0;
function hit(){const now=performance.now();if(now<hitLock)return;hitLock=now+1500;state.lives--;state.combo=1;player.x=14*T;player.y=16*T;player.anim='hurt';if(state.lives<=0)gameOver()}
function win(){running=false;save.crystals+=5;persist();$('#overlay').classList.remove('hidden');$('#overlay .panel').innerHTML=`<h2>CORE WARDEN DERROTADO</h2><p>Fase 1 concluída.<br>Pontuação: ${state.score}<br>+5 cristais de conclusão +8 do boss</p><button onclick="location.reload()">JOGAR NOVAMENTE</button>`}
function gameOver(){running=false;$('#overlay').classList.remove('hidden');$('#overlay .panel').innerHTML=`<h2>GAME OVER</h2><p>Pontuação: ${state.score}</p><button onclick="location.reload()">TENTAR NOVAMENTE</button>`}
function updateHud(){$('#score').textContent=state.score;$('#lives').textContent=state.lives;$('#combo').textContent='x'+state.combo;$('#power').textContent=state.activePower||'—';$('#wallet').textContent=save.crystals;updateObjectiveState()}

function drawMap(){
 ctx.fillStyle='#06101a';ctx.fillRect(0,0,W,H);
 for(let y=0;y<ROWS;y++)for(let x=0;x<COLS;x++)if(map[y][x]==='#'){
   const px=x*T,py=y*T;ctx.fillStyle='#10283b';ctx.fillRect(px+1,py+1,T-2,T-2);
   ctx.strokeStyle='#1e5a78';ctx.lineWidth=1;ctx.strokeRect(px+3,py+3,T-6,T-6);
   ctx.fillStyle='#16344b';ctx.fillRect(px+6,py+6,T-12,4)
 }
}
function safeDraw(image,...args){
 if(image instanceof HTMLImageElement && image.complete && image.naturalWidth>0){
   ctx.drawImage(image,...args); return true;
 }
 return false;
}
function frame(list,index){
 if(!Array.isArray(list)||!list.length)return null;
 return list[((index%list.length)+list.length)%list.length]||list.find(Boolean)||null;
}
function draw(now){
 drawMap();
 const fi=Math.floor(now/140)%4;
 const a6=Math.floor(now/130)%6;
 const a4=Math.floor(now/160)%4;

 for(const f of frags) if(f.on) safeDraw(frame(images.fragment,fi),f.x-16,f.y-16,32,32);
 for(const c of crystals) if(c.on) safeDraw(frame(images.crystal,fi),c.x-18,c.y-18,36,36);
 for(const p of powers) if(p.on) safeDraw(images.powers[p.type],p.x-20,p.y-20,40,40);

 for(const t of terminals){
   const list=t.on?images.terminalActive:images.terminalOff;
   const im=frame(list,a6);
   if(!safeDraw(im,t.x-24,t.y-24,48,48)){
     ctx.fillStyle=t.on?'#2ff0df':'#36748a';
     ctx.fillRect(t.x-13,t.y-18,26,36);
   }
 }

 if(keyItem.on){
   if(!safeDraw(frame(images.key,a6),keyItem.x-22,keyItem.y-22,44,44)){
     ctx.fillStyle='#ffd339';ctx.beginPath();ctx.arc(keyItem.x,keyItem.y,9,0,Math.PI*2);ctx.fill();
   }
 }

 const doorIm=frame(exitDoor.open?images.doorOpen:images.doorLocked,a4);
 if(!safeDraw(doorIm,exitDoor.x-28,exitDoor.y-30,56,56)){
   ctx.fillStyle=exitDoor.open?'#3ef2b8':'#d94d46';ctx.fillRect(exitDoor.x-18,exitDoor.y-24,36,48);
 }

 if(state.bossStarted&&!boss.dead){
   const bossIm=frame(images.boss[boss.state]||images.boss.idle,a6);
   safeDraw(bossIm,boss.x-48,boss.y-48,96,96);
   ctx.fillStyle='#230808';ctx.fillRect(W/2-110,54,220,12);
   ctx.fillStyle='#ff5246';ctx.fillRect(W/2-108,56,216*(boss.hp/boss.maxHp),8);
 }

 for(const e of enemies) if(e.dead<=now){
   const im=frame(images.enemies[e.type],fi);
   ctx.save();ctx.globalAlpha=(e.type==='phase'?0.7:1);
   if(!safeDraw(im,e.x-24,e.y-24,48,48)){
      ctx.fillStyle='#ff5470';ctx.beginPath();ctx.arc(e.x,e.y,18,0,Math.PI*2);ctx.fill();
   }
   ctx.restore();
 }

 const arr=images.player[player.anim]||images.player.idle;
 const im=frame(arr,Math.floor(now/110));
 ctx.save();ctx.translate(player.x,player.y);
 const ang=Math.atan2(player.dir.y,player.dir.x);ctx.rotate(ang);
 const q=currentGraphics();
 if(q!=='low'){
   ctx.shadowColor=(player.anim==='overdrive'?'#d54cff':'#32d8ff');
   ctx.shadowBlur=(q==='high'&&(player.anim==='dash'||player.anim==='overdrive'))?20:8;
 }
 safeDraw(im,-31,-31,62,62);
 ctx.restore();

 if(player.shield){
   ctx.strokeStyle='#56c9ff';ctx.lineWidth=3;ctx.beginPath();ctx.arc(player.x,player.y,30,0,Math.PI*2);ctx.stroke();
 }
}
function loop(now){if(!running)return;const dt=Math.min(.033,(now-last)/1000||0);last=now;updatePlayer(dt,now);updateEnemies(dt,now);updateBoss(dt,now);updateHud();draw(now);raf=requestAnimationFrame(loop)}
function currentGraphics(){
 const g=save.settings.graphics;
 if(g!=='auto')return g;
 return (navigator.hardwareConcurrency||4)<=4?'low':((navigator.hardwareConcurrency||4)<=8?'medium':'high');
}
function renderUpgrades(){
 const wallet=$('#wallet'); if(wallet)wallet.textContent=save.crystals;
 const list=$('#upgradeList'); if(!list)return;
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
   return `<div class="module ${selected?'selected':''}">
     <b>${u.name}</b><p>Nível ${save.upgrades[u.id]||0}/${u.max}</p>
     <button data-equip="${u.id}" ${(save.upgrades[u.id]||0)<=0?'disabled':''}>${selected?'REMOVER':'EQUIPAR'}</button>
   </div>`;
 }).join('');
 document.querySelectorAll('[data-equip]').forEach(b=>b.onclick=()=>{
   const id=b.dataset.equip;
   if(save.equipped.includes(id))save.equipped=save.equipped.filter(x=>x!==id);
   else if(save.equipped.length<3)save.equipped.push(id);
   persist();
 });
 slots.innerHTML=save.equipped.map(id=>`<span class="badge">${upgradeDefs.find(u=>u.id===id)?.name||id}</span>`).join(' ')||'<small>Escolha até 3 módulos.</small>';
}

let menuScreen='home', paused=false;
function showMenuScreen(name){
 menuScreen=name;
 $('#mainMenu').classList.remove('hidden');
 document.querySelectorAll('[data-screen]').forEach(s=>s.classList.toggle('hidden',s.dataset.screen!==name));
}
function hideMenu(){
 $('#mainMenu').classList.add('hidden');
}
function start(){
 reset();running=true;paused=false;last=performance.now();hideMenu();$('#pauseBtn')?.classList.remove('hidden');requestAnimationFrame(loop)
}
function pauseGame(){
 if(!running||paused)return;
 paused=true;running=false;$('#pauseBtn')?.classList.add('hidden');showMenuScreen('pause');
}
function resumeGame(){
 if(!paused)return;
 paused=false;running=true;last=performance.now();hideMenu();$('#pauseBtn')?.classList.remove('hidden');requestAnimationFrame(loop)
}
function quitToMenu(){
 running=false;paused=false;$('#pauseBtn')?.classList.add('hidden');showMenuScreen('home');draw(performance.now());
}
function restartGame(){start()}

function setupMenu(){
 document.querySelectorAll('[data-screen-open]').forEach(b=>b.onclick=()=>showMenuScreen(b.dataset.screenOpen));
 document.querySelectorAll('[data-back]').forEach(b=>b.onclick=()=>showMenuScreen(paused?'pause':'home'));
 document.querySelector('[data-action="play"]')?.addEventListener('click',start);
 document.querySelector('[data-action="resume"]')?.addEventListener('click',resumeGame);
 document.querySelector('[data-action="restart"]')?.addEventListener('click',restartGame);
 document.querySelector('[data-action="quit"]')?.addEventListener('click',quitToMenu);
 $('#pauseBtn')?.addEventListener('click',pauseGame);

 const gs=$('#graphicsSelect'),vr=$('#volumeRange'),rf=$('#reduceFlash');
 if(gs){gs.value=save.settings.graphics;gs.onchange=()=>{save.settings.graphics=gs.value;persist()}}
 if(vr){vr.value=save.settings.volume;vr.oninput=()=>{save.settings.volume=Number(vr.value);persist()}}
 if(rf){rf.checked=!!save.settings.reduceFlash;rf.onchange=()=>{save.settings.reduceFlash=rf.checked;persist()}}
 $('#fullscreenBtn')?.addEventListener('click',async()=>{
   try{if(!document.fullscreenElement)await document.documentElement.requestFullscreen();else await document.exitFullscreen()}catch(e){}
 });
 $('#resetSaveBtn')?.addEventListener('click',()=>{
   if(confirm('Apagar todo o progresso de Maze Hunter?')){
     localStorage.removeItem('mh-core-save');location.reload();
   }
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
addEventListener('gamepadconnected',()=>console.info('[Maze Hunter] Gamepad conectado'));

load().then(()=>{
 reset();draw(0);renderUpgrades();renderBuild();renderEquipment();setupMenu();showMenuScreen('home');
}).catch(err=>{
 console.error('[Maze Hunter] Falha ao carregar assets:',err);
 reset();renderUpgrades();renderBuild();renderEquipment();setupMenu();showMenuScreen('home');draw(0);
});
