/* Jordy Retana - Archivo JavaScript Principal del Juego */

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;

const UI = {
    hudTitle: document.getElementById("hudTitle"),
    world: document.getElementById("world"),
    level: document.getElementById("level"),
    hearts: document.getElementById("hearts"),
    score: document.getElementById("score"),
    coins: document.getElementById("coins"),
    ability: document.getElementById("ability"),
    boss: document.getElementById("boss"),

    pauseOverlay: document.getElementById("pauseOverlay"),
    shopOverlay: document.getElementById("shopOverlay"),
    choices: document.getElementById("choices"),

    winOverlay: document.getElementById("winOverlay"),
    winTitle: document.getElementById("winTitle"),
    winSub: document.getElementById("winSub"),
    btnContinue: document.getElementById("btnContinue"),
    btnMenu: document.getElementById("btnMenu"),
    btnReset: document.getElementById("btnReset"),

    creditsOverlay: document.getElementById("creditsOverlay"),
    creditsText: document.getElementById("creditsText"),
    btnCreditsMenu: document.getElementById("btnCreditsMenu"),
    btnCreditsReplay: document.getElementById("btnCreditsReplay"),
    btnCreditsStop: document.getElementById("btnCreditsStop"),

    menuOverlay: document.getElementById("menuOverlay"),
    btnContinueRun: document.getElementById("btnContinueRun"),
    btnNewRun: document.getElementById("btnNewRun"),
    btnCloseMenu: document.getElementById("btnCloseMenu"),
    levelGrid: document.getElementById("levelGrid"),
    saveInfo: document.getElementById("saveInfo"),
    menuSub: document.getElementById("menuSub"),
};

const W = canvas.width;
const H = canvas.height;

const keys = new Set();
const pressed = new Set();

window.addEventListener("keydown", (e) => {
    const k = normKey(e);
    if(!keys.has(k)) pressed.add(k);
    keys.add(k);
    if(["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"," "].includes(e.key)) e.preventDefault();
});
window.addEventListener("keyup", (e) => keys.delete(normKey(e)));

function normKey(e){
    if(e.key === " ") return "Space";
    return e.key.length === 1 ? e.key.toLowerCase() : e.key;
}
const down = (k) => keys.has(k);
const just = (k) => pressed.has(k);

const SAVE_KEY = "puffpro_save_v4";
const SAVE_VERSION = 4;

function defaultSave(){
    return {
        version: SAVE_VERSION,
        unlocked: 0,
        lastLevel: 0,
        player: { lives:5, score:0, coins:0 },
        upgrades: null,
        timestamp: Date.now()
    };
}
function loadSave(){
    try{
        const raw = localStorage.getItem(SAVE_KEY);
        if(!raw) return defaultSave();
        const parsed = JSON.parse(raw);
        if(!parsed || parsed.version !== SAVE_VERSION) return defaultSave();
        return parsed;
    }catch{
        return defaultSave();
    }
}
function getSaveSnapshot(){
    return {
        version: SAVE_VERSION,
        unlocked: Math.max(state.save.unlocked, state.levelIndex),
        lastLevel: state.levelIndex,
        player: { lives: player.lives, score: player.score, coins: player.coins },
        upgrades: { ...upgrades },
        timestamp: Date.now()
    };
}
function saveGame(){
    const s = getSaveSnapshot();
    state.save = s;
    try{ localStorage.setItem(SAVE_KEY, JSON.stringify(s)); }catch{}
    updateSaveInfo();
    buildLevelSelect();
}
function clearSave(){
    try{ localStorage.removeItem(SAVE_KEY); }catch{}
    state.save = defaultSave();
    updateSaveInfo();
    buildLevelSelect();
}

let audioCtx = null;
let musicTimer = null;
let musicOn = false;

function ensureAudio(){
    if(audioCtx) return audioCtx;
    const AC = window.AudioContext || window.webkitAudioContext;
    if(!AC) return null;
    audioCtx = new AC();
    return audioCtx;
}
function beep(freq=440, dur=0.08, type="triangle", gain=0.05){
    const ac = ensureAudio();
    if(!ac) return;
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.value = gain;
    o.connect(g); g.connect(ac.destination);
    const t = ac.currentTime;
    o.start(t);
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.stop(t + dur + 0.02);
}
function sfx(name){
    if(name==="coin"){ beep(880,0.05,"triangle",0.05); beep(1320,0.05,"triangle",0.04); }
    if(name==="hurt"){ beep(180,0.10,"sawtooth",0.05); }
    if(name==="buy"){ beep(660,0.06,"square",0.04); beep(990,0.07,"triangle",0.035); }
    if(name==="no"){ beep(200,0.08,"square",0.035); }
    if(name==="boss"){ beep(520,0.07,"triangle",0.035); beep(780,0.07,"triangle",0.03); }
    if(name==="win"){ beep(523.25,0.07,"triangle",0.04); beep(659.25,0.07,"triangle",0.04); beep(783.99,0.09,"triangle",0.04); }
}

const melody = [
    523.25, 659.25, 783.99, 659.25,
    587.33, 739.99, 880.00, 739.99,
    493.88, 622.25, 739.99, 622.25,
    440.00, 554.37, 659.25, 554.37
];
function startCreditsMusic(){
    stopCreditsMusic();
    musicOn = true;
    let i=0;
    musicTimer = setInterval(() => {
        if(!musicOn) return;
        beep(melody[i%melody.length], 0.09, "triangle", 0.035);
        i++;
    }, 120);
}
function stopCreditsMusic(){
    musicOn = false;
    if(musicTimer){ clearInterval(musicTimer); musicTimer = null; }
}

const clamp = (v,a,b) => Math.max(a, Math.min(b,v));
const lerp  = (a,b,t) => a + (b-a)*t;
const sign  = (v) => (v<0?-1:(v>0?1:0));
const rnd   = (a,b) => a + Math.random()*(b-a);
const dist  = (ax,ay,bx,by) => Math.hypot(ax-bx, ay-by);

function aabb(ax,ay,aw,ah,bx,by,bw,bh){
    return ax < bx+bw && ax+aw > bx && ay < by+bh && ay+ah > by;
}

const THEMES = {
    neon: {
        name: "Neon Ruins",
        bgA: "#070b18", bgB:"#0f1634", glow:"#7cf6ff",
        fog1: "#24358d",
        tileSolidTop: "rgba(124,246,255,.26)",
        tileSolidMid: "rgba(40,63,120,.88)",
        tileBreak: "rgba(120,90,240,.92)",
        spike: "rgba(255,107,122,.92)",
        portal: "rgba(124,246,255,.90)",
    },
    sky: {
        name: "Sky Isles",
        bgA: "#06131d", bgB:"#0a2a3e", glow:"#86ff9a",
        fog1: "#1c6aa8",
        tileSolidTop: "rgba(180,255,244,.22)",
        tileSolidMid: "rgba(32,120,170,.88)",
        tileBreak: "rgba(255,204,102,.92)",
        spike: "rgba(255,145,70,.92)",
        portal: "rgba(134,255,154,.92)",
    },
    abyss: {
        name: "Abyss Citadel",
        bgA: "#100814", bgB:"#250d1c", glow:"#ffcc66",
        fog1: "#4a1636",
        tileSolidTop: "rgba(255,204,102,.18)",
        tileSolidMid: "rgba(120,20,60,.92)",
        tileBreak: "rgba(255,107,122,.92)",
        spike: "rgba(255,70,120,.92)",
        portal: "rgba(255,204,102,.92)",
    }
};
let currentTheme = THEMES.neon;

const TILE = 24;
const MAP_W = 160;
const MAP_H = 24;
const map = Array.from({length: MAP_H}, () => Array(MAP_W).fill(0));

function setRect(x, y, w, h, v){
    for(let yy=y; yy<y+h; yy++){
        for(let xx=x; xx<x+w; xx++){
            if(yy>=0 && yy<MAP_H && xx>=0 && xx<MAP_W) map[yy][xx] = v;
        }
    }
}

function tileAt(px, py){
    const tx = Math.floor(px / TILE);
    const ty = Math.floor(py / TILE);

    if(tx < 0 || tx >= MAP_W) return 1;
    if(ty < 0) return 1;

    if(ty >= MAP_H) return 0;

    return map[ty][tx];
}

function setTile(tx,ty,v){
    if(ty<0||ty>=MAP_H||tx<0||tx>=MAP_W) return;
    map[ty][tx]=v;
}
function clearMap(){
    for(let y=0;y<MAP_H;y++) for(let x=0;x<MAP_W;x++) map[y][x]=0;
}
function coinLine(x1,y1,x2,y2, step=2){
    const dx = x2-x1, dy=y2-y1;
    const len = Math.max(1, Math.hypot(dx,dy));
    const n = Math.floor(len/step);
    for(let i=0;i<=n;i++){
        const t=i/n;
        const x=Math.round(lerp(x1,x2,t));
        const y=Math.round(lerp(y1,y2,t));
        if(map[y] && map[y][x]===0) map[y][x]=3;
    }
}

const particles = [];
function spawnParticles(x,y, n=10, spread=1.2, speed=2.8, life=28, kind="spark"){
    for(let i=0;i<n;i++){
        const a = Math.random()*Math.PI*2;
        const s = Math.random()*speed;
        particles.push({
            x, y,
            vx: Math.cos(a)*s*spread,
            vy: Math.sin(a)*s*spread - 0.6,
            life: life + Math.random()*life*0.35,
            kind,
            size: rnd(1.1, 2.9),
            t: rnd(0,999)
        });
    }
}
function fireworks(x,y){
    for(let k=0;k<3;k++){
        spawnParticles(x,y, 34, 1.3, 4.6, 42, "spark");
        spawnParticles(x,y, 22, 1.1, 4.0, 34, "coin");
        spawnParticles(x,y, 18, 1.2, 4.2, 36, "wind");
    }
}

const cam = { x:0, y:0, tx:0, ty:0, shake:0 };
function addShake(amount){ cam.shake = Math.min(26, cam.shake + amount); }
function updateCamera(player){
    cam.tx = player.x + player.w/2 - W/2;
    cam.ty = player.y + player.h/2 - H*0.58;
    const maxX = MAP_W*TILE - W;
    const maxY = MAP_H*TILE - H;
    cam.tx = clamp(cam.tx, 0, Math.max(0,maxX));
    cam.ty = clamp(cam.ty, 0, Math.max(0,maxY));
    cam.x = lerp(cam.x, cam.tx, 0.10);
    cam.y = lerp(cam.y, cam.ty, 0.10);
    if(cam.shake > 0) cam.shake *= 0.86;
}

const movingPlatforms = [];
class MovingPlatform{
    constructor(x,y,w,h, dx, dy, period, phase=0){
        this.x=x; this.y=y; this.w=w; this.h=h;
        this.baseX=x; this.baseY=y;
        this.dx=dx; this.dy=dy;
        this.period=period;
        this.t=phase;
        this.vx=0; this.vy=0;
    }
    update(){
        const prevX=this.x, prevY=this.y;
        this.t = (this.t + 1) % this.period;
        const s = Math.sin((this.t/this.period)*Math.PI*2);
        this.x = this.baseX + this.dx*s;
        this.y = this.baseY + this.dy*s;
        this.vx = this.x - prevX;
        this.vy = this.y - prevY;
    }
    draw(){
        const px = Math.floor(this.x - cam.x);
        const py = Math.floor(this.y - cam.y);

        ctx.fillStyle="rgba(0,0,0,.28)";
        roundRect(px-1,py-1,this.w+2,this.h+2,10); ctx.fill();

        const g = ctx.createLinearGradient(px,py,px,py+this.h);
        g.addColorStop(0, "rgba(255,255,255,.14)");
        g.addColorStop(1, currentTheme.tileSolidMid);
        ctx.fillStyle=g;
        roundRect(px,py,this.w,this.h,9); ctx.fill();

        ctx.globalAlpha=0.20;
        ctx.fillStyle="#fff";
        roundRect(px+6,py+5,this.w-12,4,8); ctx.fill();
        ctx.globalAlpha=1;
    }
}

function platformCollidePlayerTop(player, plat){
    const prevBottom = player.prevY + player.h;
    const currBottom = player.y + player.h;
    const platTop = plat.y;

    const overlapX = (player.x < plat.x + plat.w) && (player.x + player.w > plat.x);
    const wasAbove = prevBottom <= platTop + 1;
    const nowBelowOrTouch = currBottom >= platTop;

    if(overlapX && wasAbove && nowBelowOrTouch && player.vy >= 0){
        player.y = platTop - player.h;
        player.vy = 0;
        player.onGround = true;
        player.onPlatform = plat;
        return true;
    }
    return false;
}

function resolveTileCollisions(ent){
    ent.onGround = false;
    ent.hitWall = 0;

    ent.x += ent.vx;
    let left = Math.floor(ent.x / TILE);
    let right = Math.floor((ent.x + ent.w) / TILE);
    let top = Math.floor(ent.y / TILE);
    let bottom = Math.floor((ent.y + ent.h - 1) / TILE);

    for(let ty=top; ty<=bottom; ty++){
        if(ty < 0) continue;
        if(ty >= MAP_H) continue;

        for(let tx=left; tx<=right; tx++){
            if(tx < 0 || tx >= MAP_W) continue;
            const t = map[ty][tx];
            if(t === 1 || t === 6){
                const tileX = tx*TILE, tileY = ty*TILE;
                if(aabb(ent.x, ent.y, ent.w, ent.h, tileX, tileY, TILE, TILE)){
                    if(ent.vx > 0){
                        ent.x = tileX - ent.w;
                        ent.vx = 0;
                        ent.hitWall = 1;
                    } else if(ent.vx < 0){
                        ent.x = tileX + TILE;
                        ent.vx = 0;
                        ent.hitWall = -1;
                    }
                }
            }
        }
    }

    ent.y += ent.vy;
    left = Math.floor(ent.x / TILE);
    right = Math.floor((ent.x + ent.w) / TILE);
    top = Math.floor(ent.y / TILE);
    bottom = Math.floor((ent.y + ent.h) / TILE);

    for(let ty=top; ty<=bottom; ty++){
        if(ty < 0) continue;
        if(ty >= MAP_H) continue;

        for(let tx=left; tx<=right; tx++){
            if(tx < 0 || tx >= MAP_W) continue;
            const t = map[ty][tx];
            const tileX = tx*TILE, tileY = ty*TILE;

            if(t === 1 || t === 6){
                if(aabb(ent.x, ent.y, ent.w, ent.h, tileX, tileY, TILE, TILE)){
                    if(ent.vy > 0){
                        ent.y = tileY - ent.h;
                        ent.vy = 0;
                        ent.onGround = true;
                    } else if(ent.vy < 0){
                        ent.y = tileY + TILE;
                        ent.vy = 0;
                    }
                }
            }

            if(t === 5){
                const prevY = ent.y - ent.vy;
                const wasAbove = (prevY + ent.h) <= tileY + 1;
                if(ent.vy > 0 && wasAbove && aabb(ent.x, ent.y, ent.w, ent.h, tileX, tileY, TILE, TILE)){
                    ent.y = tileY - ent.h;
                    ent.vy = 0;
                    ent.onGround = true;
                }
            }
        }
    }
}

const projectiles = [];
const enemyShots = [];

class StarShot{
    constructor(x,y,dir, power=1){
        this.x=x; this.y=y;
        this.vx=dir*(7.6 + (power-1)*0.7);
        this.w=10; this.h=10;
        this.life=150;
        this.dead=false;
        this.spin=rnd(0,Math.PI*2);
        this.power=power;
    }
    update(){
        if(this.dead) return;
        this.life--;
        if(this.life<=0) this.dead=true;
        this.x += this.vx;

        const t = tileAt(this.x+this.w/2, this.y+this.h/2);
        if(t === 1){
            this.dead=true;
            spawnParticles(this.x, this.y, 14, 1.1, 3.2, 22, "spark");
        }
        if(t === 6){
            const tx = Math.floor((this.x+this.w/2)/TILE);
            const ty = Math.floor((this.y+this.h/2)/TILE);
            setTile(tx,ty,0);
            this.dead=true;
            addShake(4);
            spawnParticles(tx*TILE+TILE/2, ty*TILE+TILE/2, 22, 1.0, 3.6, 26, "break");
        }
    }
    draw(){
        if(this.dead) return;
        const px = Math.floor(this.x - cam.x);
        const py = Math.floor(this.y - cam.y);
        this.spin += 0.22;

        ctx.save();
        ctx.translate(px+this.w/2, py+this.h/2);
        ctx.rotate(this.spin);

        ctx.globalAlpha = 0.35;
        ctx.fillStyle = currentTheme.glow;
        star(0,0, 8, 5, 2.6);
        ctx.fill();

        ctx.globalAlpha = 1;
        const g = ctx.createRadialGradient(-1,-2,1, 0,0,9);
        g.addColorStop(0, "#fff7d6");
        g.addColorStop(0.45, "#ffd46b");
        g.addColorStop(1, "#ff8a2f");
        ctx.fillStyle = g;
        star(0,0, 6, 5, 2.2);
        ctx.fill();

        ctx.restore();
        ctx.globalAlpha=1;
    }
}

class EnemyShot{
    constructor(x,y,vx,vy,color="rgba(255,107,122,.92)"){
        this.x=x; this.y=y;
        this.vx=vx; this.vy=vy;
        this.w=12; this.h=12;
        this.life=240;
        this.dead=false;
        this.t=rnd(0,999);
        this.color=color;
    }
    update(){
        if(this.dead) return;
        this.t += 0.2;
        this.life--;
        if(this.life<=0) this.dead=true;

        this.x += this.vx;
        this.y += this.vy + Math.sin(this.t)*0.10;

        if(tileAt(this.x+this.w/2, this.y+this.h/2) === 1){
            this.dead=true;
            spawnParticles(this.x,this.y,12,1.0,3.0,22,"hurt");
        }
    }
    draw(){
        if(this.dead) return;
        const px = Math.floor(this.x - cam.x);
        const py = Math.floor(this.y - cam.y);

        ctx.globalAlpha=0.18;
        ctx.fillStyle=this.color;
        circle(px+this.w/2, py+this.h/2, 13);
        ctx.globalAlpha=1;

        const g = ctx.createRadialGradient(px+4,py+4,2,px+6,py+6,14);
        g.addColorStop(0,"#ffe5ea");
        g.addColorStop(0.55,this.color);
        g.addColorStop(1,"rgba(0,0,0,.55)");
        ctx.fillStyle=g;
        roundRect(px,py,this.w,this.h,5); ctx.fill();
        ctx.globalAlpha=0.45;
        ctx.fillStyle="#fff";
        roundRect(px+2,py+2, this.w-5, 3, 4); ctx.fill();
        ctx.globalAlpha=1;
    }
}

const enemies = [];
const VOID_Y = MAP_H*TILE + 120;

const coinSeekers = [];
function updateCoinSeekers(){
    for(const c of coinSeekers){
        const tx = player.x + player.w/2;
        const ty = player.y + player.h/2;
        const dx = tx - c.x;
        const dy = ty - c.y;
        c.vx += clamp(dx*0.012, -2.2, 2.2);
        c.vy += clamp(dy*0.012, -2.2, 2.2);
        c.vx *= 0.92; c.vy *= 0.92;
        c.x += c.vx; c.y += c.vy;
        c.life--;
        if(Math.hypot(dx,dy) < 14){
            c.life = 0;
            player.coins++;
            player.score += 6;
            sfx("coin");
            spawnParticles(tx, ty, 10, 1.0, 2.6, 22, "coin");
        }
    }
    for(let i=coinSeekers.length-1;i>=0;i--){
        if(coinSeekers[i].life<=0) coinSeekers.splice(i,1);
    }
}

function updateInhale(){
    if(player.inhaleT<=0) return;

    const s = player.inhaleShape();
    const power = s.p;

    for(let i=0;i<3;i++){
        if(Math.random() < 0.78){
            const t = Math.random();
            const x = lerp(s.farX, s.mouthX, t);
            const y = lerp(s.topY, s.botY, Math.random());
            const vx = (s.mouthX - x) * 0.06;
            const vy = (s.mouthY - y) * 0.06;
            particles.push({
                x, y,
                vx: vx + rnd(-0.6,0.6),
                vy: vy + rnd(-0.4,0.4),
                life: 18 + Math.random()*16,
                kind: "wind",
                size: rnd(1.0,2.2),
                t: rnd(0,999)
            });
        }
    }
    if(Math.random() < 0.33){
        spawnParticles(s.mouthX + rnd(-4,4), s.mouthY + rnd(-4,4), 4, 0.9, 2.2, 18, "spark");
    }

    const rx = Math.min(s.mouthX, s.farX);
    const rw = Math.abs(s.farX - s.mouthX);
    const ry = s.topY;
    const rh = (s.botY - s.topY);

    for(const e of enemies){
        if(e.dead) continue;

        if(aabb(rx,ry,rw,rh, e.x,e.y,e.w,e.h)){
            e.sucked=true;

            const targetX = player.face===1 ? (player.x+player.w-2) : (player.x - e.w + 2);
            const targetY = player.y + player.h*0.62;

            const dx = targetX - e.x;
            const dy = targetY - e.y;

            const weight = e.weight ?? 1.0;
            const pull = (0.07 + 0.12*power) / weight;
            e.vx += clamp(dx*pull, -2.2, 2.2);
            e.vy += clamp(dy*pull, -2.2, 2.2);

            if(Math.hypot(dx,dy)<14){
                if(e.type==="Big"){
                    e.hurt(1);
                    player.score += 10;
                    if(e.dead){
                        player.gainShotAbilityFromAbsorb();
                    }
                } else {
                    e.dead=true;
                    e.respawnTimer = e.respawnDelay;
                    player.score += 14;
                    player.gainShotAbilityFromAbsorb();
                }
                addShake(3.5);
                spawnParticles(e.x+e.w/2, e.y+e.h/2, 28, 1.0, 3.2, 28, "spark");
            }
        } else {
            e.sucked=false;
        }
    }

    const cx = (rx + rw/2);
    const cy = (ry + rh/2);
    const r = (72 * power) * (1 + upgrades.suctionBonus*0.20);

    if(r>10){
        const minTX = Math.floor((cx-r)/TILE);
        const maxTX = Math.floor((cx+r)/TILE);
        const minTY = Math.floor((cy-r)/TILE);
        const maxTY = Math.floor((cy+r)/TILE);

        for(let ty=minTY; ty<=maxTY; ty++){
            if(ty<0 || ty>=MAP_H) continue;
            for(let tx=minTX; tx<=maxTX; tx++){
                if(tx<0 || tx>=MAP_W) continue;
                if(map[ty][tx]===3){
                    const txp=tx*TILE+TILE/2, typ=ty*TILE+TILE/2;
                    const d=dist(txp,typ, player.x+player.w/2, player.y+player.h/2);
                    if(d<r){
                        setTile(tx,ty,0);
                        coinSeekers.push({ x:txp, y:typ, vx:0, vy:0, life:60 });
                    }
                }
            }
        }
    }
}

function updateEnemies(){
    for(const e of enemies){
        if(e.type==="Shooter") e.update(player);
        else if(e.type==="Flyer") e.update(player);
        else if(e.type==="Big") e.update();
        else e.update();
    }

    for(const e of enemies){
        if(e.dead) continue;
        if(aabb(player.x,player.y,player.w,player.h, e.x,e.y,e.w,e.h)){
            const falling = player.vy > 0.5;
            const playerBottom = player.y + player.h;
            const enemyTop = e.y;

            if(falling && (playerBottom - enemyTop) < 10){
                if(e.type==="Big"){
                    e.hurt(1);
                    player.vy = -7.1;
                    player.score += 8;
                    if(e.dead){
                        e.respawnTimer = e.respawnDelay;
                    }
                }else{
                    e.dead=true;
                    e.respawnTimer = e.respawnDelay;
                    player.vy = -7.1;
                    player.score += 10;
                }
                addShake(4);
                spawnParticles(e.x+e.w/2, e.y+e.h/2, 20, 1.0, 3.2, 24, "spark");
            } else {
                player.loseLife("enemy", false);
            }
        }
    }
}

function updateProjectiles(){
    for(const p of projectiles) p.update();
    for(const s of enemyShots) s.update();

    for(const p of projectiles){
        if(p.dead) continue;

        if(boss && !boss.dead){
            if(aabb(p.x,p.y,p.w,p.h, boss.x,boss.y,boss.w,boss.h)){
                p.dead=true;
                boss.hurt();
                player.score += 8;
                break;
            }
        }

        for(const e of enemies){
            if(e.dead) continue;
            if(aabb(p.x,p.y,p.w,p.h, e.x,e.y,e.w,e.h)){
                p.dead=true;
                if(e.type==="Big"){
                    e.hurt(1);
                    player.score += 10;
                    if(e.dead){
                        e.respawnTimer = e.respawnDelay;
                    }
                }else{
                    e.dead=true;
                    e.respawnTimer = e.respawnDelay;
                    player.score += 12;
                    sfx("coin");
                }
                addShake(5);
                spawnParticles(e.x+e.w/2, e.y+e.h/2, 26, 1.0, 3.8, 28, "spark");
                break;
            }
        }
    }

    for(const s of enemyShots){
        if(s.dead) continue;
        if(aabb(s.x,s.y,s.w,s.h, player.x,player.y,player.w,player.h)){
            s.dead=true;
            player.loseLife("shot", false);
        }
    }

    for(let i=projectiles.length-1;i>=0;i--) if(projectiles[i].dead) projectiles.splice(i,1);
    for(let i=enemyShots.length-1;i>=0;i--) if(enemyShots[i].dead) enemyShots.splice(i,1);
}

function updateParticles(){
    for(const p of particles){
        p.t += 0.12;
        p.x += p.vx;
        p.y += p.vy;

        if(p.kind==="wind"){
            p.vx *= 0.90;
            p.vy *= 0.90;
        } else {
            p.vy += 0.03;
            p.vx *= 0.98;
            p.vy *= 0.98;
        }
        p.life--;
    }
    for(let i=particles.length-1;i>=0;i--){
        if(particles[i].life<=0) particles.splice(i,1);
    }
}

function drawBackground(){
    ctx.fillStyle = currentTheme.bgA;
    ctx.fillRect(0,0,W,H);

    ctx.globalAlpha=0.12;
    ctx.fillStyle=currentTheme.fog1;
    blob(W*0.25, H*0.28, 280, 160, 0.25);
    blob(W*0.82, H*0.22, 260, 140, -0.35);
    ctx.globalAlpha=1;

    const t = performance.now()*0.001;
    ctx.globalAlpha=0.85;
    for(let i=0;i<110;i++){
        const sx = (i*173.3 + t*22) % W;
        const sy = (i*61.7 + 50) % H;
        const s = (i%3===0)?2:1;
        ctx.fillStyle = (i%9===0) ? currentTheme.glow : "rgba(255,255,255,.85)";
        ctx.fillRect(sx, sy, s, s);
    }
    ctx.globalAlpha=1;

    if(state.level && state.level.wind){
        const f = state.level.windForce(frame);
        if(Math.random() < 0.55){
            const y = rnd(80, H-60);
            const x = f>0 ? -20 : (W+20);
            particles.push({ x: x+cam.x, y: y+cam.y, vx: f*2.4, vy: rnd(-0.25,0.25), life: 30+rnd(0,20), kind:"wind", size:rnd(1.0,2.0), t:rnd(0,999) });
        }
    }
}

function drawTiles(){
    const sx = cam.x;
    const sy = cam.y;

    const startX = Math.floor(sx / TILE) - 1;
    const endX   = Math.floor((sx + W) / TILE) + 2;
    const startY = Math.floor(sy / TILE) - 1;
    const endY   = Math.floor((sy + H) / TILE) + 2;

    for(let ty=startY; ty<=endY; ty++){
        if(ty<0||ty>=MAP_H) continue;
        for(let tx=startX; tx<=endX; tx++){
            if(tx<0||tx>=MAP_W) continue;
            const t = map[ty][tx];
            if(t===0) continue;

            const x = tx*TILE - sx;
            const y = ty*TILE - sy;

            if(t===1){
                ctx.fillStyle="rgba(0,0,0,.22)";
                roundRect(x+1,y+1,TILE-2,TILE-2,6); ctx.fill();

                const g = ctx.createLinearGradient(x,y,x,y+TILE);
                g.addColorStop(0, currentTheme.tileSolidTop);
                g.addColorStop(1, currentTheme.tileSolidMid);
                ctx.globalAlpha=0.95;
                ctx.fillStyle=g;
                roundRect(x+2,y+2,TILE-4,TILE-6,5); ctx.fill();
                ctx.globalAlpha=1;

                ctx.globalAlpha=0.16;
                ctx.fillStyle="#fff";
                roundRect(x+5,y+6,TILE-10,3,5); ctx.fill();
                ctx.globalAlpha=1;
            }

            if(t===6){
                ctx.fillStyle=currentTheme.tileBreak;
                roundRect(x+1,y+1,TILE-2,TILE-2,6); ctx.fill();
                ctx.globalAlpha=0.28;
                ctx.fillStyle="#fff";
                roundRect(x+4,y+5,TILE-8,4,6); ctx.fill();
                roundRect(x+6,y+12,TILE-12,3,6); ctx.fill();
                ctx.globalAlpha=1;
            }

            if(t===2){
                ctx.fillStyle=currentTheme.spike;
                for(let i=0;i<4;i++){
                    const px=x+i*(TILE/4);
                    ctx.beginPath();
                    ctx.moveTo(px+1, y+TILE-2);
                    ctx.lineTo(px+(TILE/8), y+8);
                    ctx.lineTo(px+(TILE/4)-1, y+TILE-2);
                    ctx.closePath();
                    ctx.fill();
                }
                ctx.globalAlpha=0.23;
                ctx.fillStyle="#fff";
                ctx.fillRect(x+4,y+TILE-8,TILE-8,2);
                ctx.globalAlpha=1;
            }

            if(t===3){
                ctx.save();
                ctx.translate(x+TILE/2, y+TILE/2);
                const pulse = 1 + Math.sin(performance.now()*0.008 + tx*0.8)*0.09;
                ctx.scale(pulse,pulse);

                ctx.globalAlpha=0.32; ctx.fillStyle=currentTheme.glow; circle(0,0,10);
                ctx.globalAlpha=1;
                const cg=ctx.createRadialGradient(-2,-3,2,0,0,12);
                cg.addColorStop(0,"#fff7d6");
                cg.addColorStop(0.45,"#ffd46b");
                cg.addColorStop(1,"#ff8a2f");
                ctx.fillStyle=cg; circle(0,0,7);
                ctx.fillStyle="rgba(0,0,0,.18)";
                roundRect(-1.5,-5,3,10,2); ctx.fill();
                ctx.restore();
            }

            if(t===4){
                ctx.fillStyle="rgba(134,255,154,.92)";
                roundRect(x+4,y+10,TILE-8,TILE-12,8); ctx.fill();
                ctx.globalAlpha=0.22; ctx.fillStyle="#fff";
                roundRect(x+6,y+12,TILE-12,4,6); ctx.fill();
                ctx.globalAlpha=1;
            }

            if(t===5){
                ctx.globalAlpha=0.88;
                ctx.fillStyle="rgba(255,255,255,.18)";
                roundRect(x+2,y+7,TILE-4,TILE-12,10); ctx.fill();
                ctx.globalAlpha=0.9; ctx.fillStyle="rgba(255,255,255,.22)";
                roundRect(x+4,y+10,TILE-8,5,8); ctx.fill();
                ctx.globalAlpha=1;
            }

            if(t===7){
                ctx.globalAlpha=0.9;
                ctx.fillStyle="rgba(255,255,255,.22)";
                roundRect(x+8,y+4,3,TILE-8,3); ctx.fill();
                ctx.fillStyle="rgba(255,204,102,.92)";
                roundRect(x+11,y+6,9,7,3); ctx.fill();
                ctx.globalAlpha=1;
            }

            if(t===9){
                ctx.save();
                ctx.translate(x+TILE/2, y+TILE/2);
                const p=1+Math.sin(performance.now()*0.009+tx)*0.08;
                ctx.scale(p,p);
                ctx.globalAlpha=0.95;
                ctx.fillStyle="rgba(255,107,122,.95)";
                heart(0,0,9); ctx.fill();
                ctx.globalAlpha=0.20; ctx.fillStyle="#fff";
                circle(-2,-3,2.2);
                ctx.restore();
                ctx.globalAlpha=1;
            }

            if(t===8){
                ctx.save();
                ctx.translate(x+TILE/2, y+TILE/2);
                const s=1+Math.sin(performance.now()*0.01+tx)*0.06;
                ctx.scale(s,s);

                const locked = state.level.portalLocked;
                ctx.globalAlpha=locked ? 0.12 : 0.22;
                ctx.fillStyle=currentTheme.glow; circle(0,0,14);

                ctx.globalAlpha=locked ? 0.25 : 1;
                ctx.strokeStyle=locked ? "rgba(255,255,255,.28)" : currentTheme.portal;
                ctx.lineWidth=3;
                ctx.beginPath(); ctx.arc(0,0,9,0,Math.PI*2); ctx.stroke();

                ctx.globalAlpha=locked ? 0.25 : 0.65;
                ctx.strokeStyle="rgba(255,255,255,.7)";
                ctx.lineWidth=1.5;
                ctx.beginPath(); ctx.arc(0,0,5,0,Math.PI*2); ctx.stroke();

                ctx.restore();
                ctx.globalAlpha=1;
                ctx.lineWidth=1;
            }
        }
    }
}

function drawParticles(){
    for(const p of particles){
        const x=p.x - cam.x;
        const y=p.y - cam.y;
        const life=clamp(p.life/30,0,1);
        ctx.globalAlpha=0.85*life;

        if(p.kind==="dust"){ ctx.fillStyle="rgba(255,255,255,.45)"; circle(x,y,p.size); }
        else if(p.kind==="coin"){ ctx.fillStyle="rgba(255,212,107,.95)"; circle(x,y,p.size); }
        else if(p.kind==="spark"){
            ctx.fillStyle=currentTheme.glow; circle(x,y,p.size);
            ctx.globalAlpha*=0.45; ctx.fillStyle="rgba(255,255,255,.85)";
            circle(x+1,y-1,Math.max(1,p.size-0.8));
        }
        else if(p.kind==="spring"){ ctx.fillStyle="rgba(134,255,154,.95)"; circle(x,y,p.size); }
        else if(p.kind==="hurt"){ ctx.fillStyle="rgba(255,107,122,.95)"; circle(x,y,p.size); }
        else if(p.kind==="heal"){ ctx.fillStyle="rgba(134,255,154,.95)"; circle(x,y,p.size); }
        else if(p.kind==="break"){ ctx.fillStyle="rgba(180,160,255,.95)"; circle(x,y,p.size); }
        else if(p.kind==="wind"){
            const len = 8 + 10*life;
            ctx.globalAlpha*=0.75;
            ctx.fillStyle="rgba(255,255,255,.65)";
            roundRect(x, y, len, 2.2, 2); ctx.fill();
            ctx.globalAlpha*=0.55;
            ctx.fillStyle=currentTheme.glow;
            roundRect(x+2, y-3, len*0.65, 2.0, 2); ctx.fill();
        } else { ctx.fillStyle="rgba(255,255,255,.7)"; circle(x,y,p.size); }

        ctx.globalAlpha=1;
    }

    for(const c of coinSeekers){
        const x=c.x - cam.x, y=c.y - cam.y;
        ctx.globalAlpha=0.85; ctx.fillStyle="rgba(255,212,107,.95)"; circle(x,y,2.2);
        ctx.globalAlpha=0.18; ctx.fillStyle=currentTheme.glow; circle(x,y,6.8);
        ctx.globalAlpha=1;
    }
}

function drawFrameBorder(){
    ctx.globalAlpha = 0.22;
    ctx.strokeStyle = "rgba(255,255,255,.25)";
    ctx.lineWidth = 2;
    roundRect(10,10,W-20,H-20,16);
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.lineWidth = 1;
}

function roundRect(x,y,w,h,r){
    r = Math.min(r, w/2, h/2);
    ctx.beginPath();
    ctx.moveTo(x+r, y);
    ctx.arcTo(x+w, y, x+w, y+h, r);
    ctx.arcTo(x+w, y+h, x, y+h, r);
    ctx.arcTo(x, y+h, x, y, r);
    ctx.arcTo(x, y, x+w, y, r);
    ctx.closePath();
}
function circle(x,y,r){
    ctx.beginPath();
    ctx.arc(x,y,r,0,Math.PI*2);
    ctx.fill();
}
function star(x,y, outerR, points=5, innerR=outerR*0.5){
    ctx.beginPath();
    const step = Math.PI / points;
    let rot = -Math.PI/2;
    ctx.moveTo(x + Math.cos(rot)*outerR, y + Math.sin(rot)*outerR);
    for(let i=0;i<points;i++){
        ctx.lineTo(x + Math.cos(rot)*outerR, y + Math.sin(rot)*outerR);
        rot += step;
        ctx.lineTo(x + Math.cos(rot)*innerR, y + Math.sin(rot)*innerR);
        rot += step;
    }
    ctx.closePath();
}
function blob(cx,cy,rx,ry,rot){
    ctx.beginPath();
    ctx.ellipse(cx,cy,rx,ry,rot,0,Math.PI*2);
    ctx.fill();
}
function heart(x,y,s){
    ctx.beginPath();
    ctx.moveTo(x, y+s*0.55);
    ctx.bezierCurveTo(x-s, y-s*0.15, x-s*0.4, y-s*0.95, x, y-s*0.55);
    ctx.bezierCurveTo(x+s*0.4, y-s*0.95, x+s, y-s*0.15, x, y+s*0.55);
    ctx.closePath();
}

function renderHearts(n){
    UI.hearts.innerHTML="";
    for(let i=0;i<upgrades.maxLives;i++){
        const d=document.createElement("div");
        d.className="heart"+(i<n?" full":"");
        UI.hearts.appendChild(d);
    }
}

function updateHUD(){
    const lvl = LEVELS[state.levelIndex];
    UI.world.textContent = String(lvl.world);
    UI.level.textContent = String(lvl.stage);
    UI.coins.textContent = String(player.coins);
    UI.score.textContent = String(player.score);

    if(player.ability.name){
        UI.ability.textContent = `${player.ability.name} (${Math.ceil(player.ability.timer/60)}s)`;
    } else {
        UI.ability.textContent = "—";
    }

    UI.boss.textContent = (boss && !boss.dead) ? "VIVO" : (lvl.bossLevel ? "DERROTADO" : "—");
    renderHearts(player.lives);
}

const state = {
    save: loadSave(),
    levelIndex: 0,
    level: null,
    paused: false,
    menuOpen: true
};

function wipeLevel(){
    clearMap();
    movingPlatforms.length=0;
    enemies.length=0;
    projectiles.length=0;
    enemyShots.length=0;
    particles.length=0;
    coinSeekers.length=0;
    boss=null;
    state.level = { portalLocked:false, wind:false, windForce: () => 0 };
}

function commonBounds(){
    setRect(0, MAP_H-2, MAP_W, 2, 1);
    setRect(0, 0, 1, MAP_H, 1);
    setRect(MAP_W-1, 0, 1, MAP_H, 1);
}

function placePortal(tx,ty){ map[ty][tx] = 8; }
function placeCheckpoint(tx,ty){ map[ty][tx] = 7; }

const upgrades = {
    maxLives: 5,
    suctionBonus: 0,
    dashCooldownMul: 1,
    shotPower: 1,
    jumpBoost: 0,
    speedBoost: 0,
    shieldSec: 0,
    coinBonus: 0,
    shotDurationBonusSec: 0
};

const BASE_SHOT_SEC = 8;

const SHOP_POOL = [
    { id:"heart", cost:6, title:"+1 Vida Máxima", desc:"Aumenta el máximo de vidas (y te cura 1).",
      apply(){ upgrades.maxLives = Math.min(8, upgrades.maxLives+1); player.lives = Math.min(upgrades.maxLives, player.lives+1); } },

    { id:"heal", cost:4, title:"Curación +1", desc:"Recupera 1 vida ahora (sin subir el máximo).",
      apply(){ player.lives = Math.min(upgrades.maxLives, player.lives+1); } },

    { id:"shotTime", cost:7, title:"Tiempo de Disparo +6s", desc:"El Disparo Estelar dura más cuando lo ganas por absorción.",
      apply(){ upgrades.shotDurationBonusSec += 6; } },

    { id:"suction", cost:6, title:"+20% Succión", desc:"Más alcance para absorber enemigos/monedas.",
      apply(){ upgrades.suctionBonus = Math.min(5, upgrades.suctionBonus+1); } },

    { id:"dash", cost:7, title:"Dash mejorado", desc:"Menos recarga del dash (Z).",
      apply(){ upgrades.dashCooldownMul = Math.max(0.55, upgrades.dashCooldownMul*0.85); } },

    { id:"shot", cost:8, title:"Disparo Estelar +", desc:"Tus estrellas hacen más daño/velocidad.",
      apply(){ upgrades.shotPower = Math.min(3, upgrades.shotPower+1); } },

    { id:"jump", cost:6, title:"Salto +", desc:"Un poquito más de altura y control.",
      apply(){ upgrades.jumpBoost = Math.min(5, upgrades.jumpBoost+1); } },

    { id:"speed", cost:7, title:"Velocidad +", desc:"Te mueves un poco más rápido.",
      apply(){ upgrades.speedBoost = Math.min(4, upgrades.speedBoost+1); } },

    { id:"shield", cost:9, title:"Escudo 8s", desc:"Invulnerable por unos segundos al iniciar el nivel.",
      apply(){ upgrades.shieldSec = Math.min(18, upgrades.shieldSec + 8); } },

    { id:"coinbonus", cost:8, title:"Imán de Monedas", desc:"Más monedas por recoger (bonus pequeño).",
      apply(){ upgrades.coinBonus = Math.min(3, upgrades.coinBonus+1); } },
];

function pickShopChoices(){
    const copy = SHOP_POOL.slice();
    for(let i=copy.length-1;i>0;i--){
        const j = Math.floor(Math.random()*(i+1));
        [copy[i],copy[j]]=[copy[j],copy[i]];
    }
    return copy.slice(0,3);
}

let shopChoices = [];
let shopActive = false;

function openShop(){
    shopActive = true;
    UI.shopOverlay.classList.add("show");
    UI.pauseOverlay.classList.remove("show");
    UI.winOverlay.classList.remove("show");
    UI.creditsOverlay.classList.remove("show");
    state.paused = true;

    shopChoices = pickShopChoices();
    UI.choices.innerHTML = "";

    const skipBtn = document.createElement("button");
    skipBtn.className = "choiceBtn";
    skipBtn.innerHTML = `
      <div class="choiceKey">0</div>
      <div class="choiceText">
        <b>Continuar sin comprar</b>
        <span>No gastas monedas. Sigues al siguiente nivel.</span>
      </div>
      <div class="price ok">FREE</div>
    `;
    skipBtn.addEventListener("click", () => { closeShop(); advanceToNextLevel(); });
    UI.choices.appendChild(skipBtn);

    shopChoices.forEach((c, idx) => {
        const canBuy = player.coins >= c.cost;
        const btn = document.createElement("button");
        btn.className = "choiceBtn" + (canBuy ? "" : " disabled");
        const priceClass = canBuy ? "price ok" : "price no";
        btn.innerHTML = `
        <div class="choiceKey">${idx+1}</div>
        <div class="choiceText">
          <b>${c.title}</b>
          <span>${c.desc}</span>
        </div>
        <div class="${priceClass}">✨ ${c.cost}</div>
      `;
        btn.addEventListener("click", () => chooseUpgrade(idx));
        UI.choices.appendChild(btn);
    });
}
function closeShop(){
    shopActive = false;
    UI.shopOverlay.classList.remove("show");
    state.paused = false;
}
function chooseUpgrade(i){
    if(!shopActive) return;
    const opt = shopChoices[i];
    if(!opt) return;

    if(player.coins < opt.cost){
        sfx("no");
        addShake(4);
        spawnParticles(player.x+player.w/2, player.y+player.h/2, 10, 1.1, 2.8, 20, "hurt");
        return;
    }
    player.coins -= opt.cost;
    opt.apply();
    sfx("buy");
    closeShop();
    advanceToNextLevel();
}

const player = new Player();

function onBossDefeated(title, sub){
    state.level.portalLocked = false;
    UI.winTitle.textContent = title;
    UI.winSub.textContent = sub;
    UI.winOverlay.classList.add("show");
    state.paused = true;
    saveGame();
}

function onFinalVictory(){
    state.level.portalLocked = false;
    UI.creditsOverlay.classList.add("show");
    UI.winOverlay.classList.remove("show");
    state.paused = true;
    startCreditsMusic();
    saveGame();
}

function startLevel(index, fromMenu=false){
    state.levelIndex = clamp(index, 0, LEVELS.length-1);
    const lvl = LEVELS[state.levelIndex];

    lvl.build();
    player.resetToSpawn(true);
    cam.x=0; cam.y=0; cam.tx=0; cam.ty=0;
    state.paused = false;

    state.save.unlocked = Math.max(state.save.unlocked, state.levelIndex);
    state.save.lastLevel = state.levelIndex;
    saveGame();

    updateHUD();
    if(fromMenu){
        UI.menuOverlay.classList.remove("show");
        state.menuOpen = false;
    }
}

function advanceToNextLevel(){
    const next = state.levelIndex + 1;
    if(next >= LEVELS.length){
        UI.creditsOverlay.classList.add("show");
        state.paused = true;
        startCreditsMusic();
        return;
    }
    startLevel(next, false);
}

function resetRun(){
    clearSave();
    player.resetAll();
    startLevel(0, true);
}

function updateSaveInfo(){
    const s = state.save;
    const dt = new Date(s.timestamp);
    UI.saveInfo.textContent = `Desbloqueado: Nivel ${s.unlocked+1}/9 • Último: Nivel ${s.lastLevel+1} • ${dt.toLocaleString()}`;
}

function buildLevelSelect(){
    UI.levelGrid.innerHTML = "";
    for(let i=0;i<LEVELS.length;i++){
        const lvl = LEVELS[i];
        const unlocked = i <= state.save.unlocked;
        const btn = document.createElement("button");
        btn.className = "lvlBtn" + (unlocked ? "" : " locked");
        btn.innerHTML = `
        <div class="lvlMeta">
          <span>${lvl.name}</span>
          <span>${lvl.bossLevel ? "👑" : "🌀"}</span>
        </div>
        <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
          <span class="tag">Mundo ${lvl.world}</span>
          <span class="tag">${lvl.theme.toUpperCase()}</span>
        </div>
      `;
        if(unlocked){
            btn.addEventListener("click", () => startLevel(i, true));
        }
        UI.levelGrid.appendChild(btn);
    }
}

UI.btnCloseMenu.addEventListener("click", () => {
    UI.menuOverlay.classList.remove("show");
    state.menuOpen = false;
    state.paused = false;
});

UI.btnNewRun.addEventListener("click", () => resetRun());
UI.btnContinueRun.addEventListener("click", () => {
    const idx = clamp(state.save.lastLevel ?? 0, 0, LEVELS.length-1);
    startLevel(idx, true);
});

UI.btnContinue.addEventListener("click", () => {
    UI.winOverlay.classList.remove("show");
    state.paused = false;
});
UI.btnMenu.addEventListener("click", () => {
    UI.winOverlay.classList.remove("show");
    openMenu();
});
UI.btnReset.addEventListener("click", () => resetRun());

UI.btnCreditsStop.addEventListener("click", () => stopCreditsMusic());
UI.btnCreditsMenu.addEventListener("click", () => { stopCreditsMusic(); UI.creditsOverlay.classList.remove("show"); openMenu(); });
UI.btnCreditsReplay.addEventListener("click", () => { stopCreditsMusic(); UI.creditsOverlay.classList.remove("show"); resetRun(); });

function openMenu(){
    UI.menuOverlay.classList.add("show");
    state.menuOpen = true;
    state.paused = true;
    updateSaveInfo();
    buildLevelSelect();
}

let frame = 0;

function handleGlobalKeys(){
    if(just("p") && !shopActive){
        state.paused = !state.paused;
        UI.pauseOverlay.classList.toggle("show", state.paused && !state.menuOpen && !UI.winOverlay.classList.contains("show") && !UI.creditsOverlay.classList.contains("show"));
        if(!state.paused) UI.pauseOverlay.classList.remove("show");
    }

    if(just("m")){
        if(state.menuOpen){
            UI.menuOverlay.classList.remove("show");
            state.menuOpen = false;
            state.paused = false;
        } else {
            openMenu();
        }
    }

    if(just("r")){
        startLevel(state.levelIndex, false);
    }

    if(shopActive){
        if(just("0")){ closeShop(); advanceToNextLevel(); }
        if(just("1")) chooseUpgrade(0);
        if(just("2")) chooseUpgrade(1);
        if(just("3")) chooseUpgrade(2);
    }
}

function step(){
    frame++;
    handleGlobalKeys();

    if(state.menuOpen){
        drawBackground();
        drawTiles();
        drawParticles();
        drawFrameBorder();
        updateHUD();
        pressed.clear();
        requestAnimationFrame(step);
        return;
    }

    UI.pauseOverlay.classList.toggle("show", state.paused && !shopActive && !UI.winOverlay.classList.contains("show") && !UI.creditsOverlay.classList.contains("show"));

    if(!state.paused){
        for(const plat of movingPlatforms) plat.update();
        updateInhale();
        updateCoinSeekers();
        player.update(state.level, frame);

        if(boss){
            boss.update(player);
            if(boss.dead) state.level.portalLocked = false;
        }

        updateEnemies();
        updateProjectiles();
        updateParticles();

        if(player.win){
            player.win = false;

            if(state.levelIndex === LEVELS.length-1){
                onFinalVictory();
            } else {
                openShop();
            }
        }

        updateCamera(player);
        updateHUD();
        saveGame();
    }

    drawBackground();
    drawTiles();

    for(const plat of movingPlatforms) plat.draw();

    for(const e of enemies){
        if(e.dead) continue;
        if(e.draw) e.draw();
    }

    if(boss) boss.draw();

    for(const p of projectiles) p.draw();
    for(const s of enemyShots) s.draw();

    drawParticles();
    player.draw();
    drawFrameBorder();

    pressed.clear();
    requestAnimationFrame(step);
}

updateSaveInfo();
buildLevelSelect();

startLevel(clamp(state.save.lastLevel ?? 0, 0, LEVELS.length-1), false);
openMenu();

requestAnimationFrame(step);
