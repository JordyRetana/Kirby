/* Jordy Retana - Definición de Niveles */

const LEVELS = [
    { world:1, stage:1, name:"Neon 1 — Ruinas", theme:"neon", bossLevel:false, build: buildNeon1 },
    { world:1, stage:2, name:"Neon 2 — Lab",    theme:"neon", bossLevel:false, build: buildNeon2 },
    { world:1, stage:3, name:"Neon 3 — Jefe",   theme:"neon", bossLevel:true,  build: buildNeonBoss },

    { world:2, stage:1, name:"Sky 1 — Islas",   theme:"sky",  bossLevel:false, build: buildSky1 },
    { world:2, stage:2, name:"Sky 2 — Viento",  theme:"sky",  bossLevel:false, build: buildSky2 },
    { world:2, stage:3, name:"Sky 3 — Jefe",    theme:"sky",  bossLevel:true,  build: buildSkyBoss },

    { world:3, stage:1, name:"Abyss 1 — Puertas", theme:"abyss", bossLevel:false, build: buildAbyss1 },
    { world:3, stage:2, name:"Abyss 2 — Trono",   theme:"abyss", bossLevel:false, build: buildAbyss2 },
    { world:3, stage:3, name:"Abyss 3 — FINAL",   theme:"abyss", bossLevel:true,  build: buildFinalBoss },
];

function buildNeon1(){
    currentTheme = THEMES.neon;
    wipeLevel(); commonBounds();

    setRect(6,19, 14,1,1);
    setRect(24,19, 12,1,1);
    setRect(40,18, 14,1,1);
    setRect(58,19, 12,1,1);
    setRect(74,18, 14,1,1);
    setRect(92,19, 14,1,1);
    setRect(116,18, 16,1,1);

    setRect(34,15, 10,1,5);
    setRect(66,14, 10,1,5);
    setRect(98,14, 10,1,5);

    setRect(52, MAP_H-3, 5,1,2);
    setRect(104,MAP_H-3, 5,1,2);

    map[MAP_H-3][16] = 4;
    map[MAP_H-3][84] = 4;

    setRect(44,17, 4,1,6);
    setRect(96,17, 4,1,6);

    placeCheckpoint(8, MAP_H-3);
    placePortal(150, MAP_H-3);

    map[MAP_H-4][30]  = 9;
    map[MAP_H-4][124] = 9;

    coinLine(34,16, 44,16);
    coinLine(70,15, 78,15);
    coinLine(104,15, 112,15);

    movingPlatforms.push(new MovingPlatform(48*TILE, 17*TILE, 96, 16,  50, 0, 240, 20));
    movingPlatforms.push(new MovingPlatform(92*TILE, 16*TILE, 96, 16, -52, 0, 260, 100));

    enemies.push(new Walker(10*TILE+3, 16*TILE+2));
    enemies.push(new Walker(62*TILE+3, 16*TILE+2));
    enemies.push(new Jumper(92*TILE+3, 16*TILE+2));
    enemies.push(new Shooter(130*TILE+3, 16*TILE+2));
    enemies.push(new BigBrute(44*TILE+4, 16*TILE+2));
    enemies.push(new Flyer(76*TILE+2, 10*TILE+2));

    player.setSpawn(3*TILE, 16*TILE);
    state.level.portalLocked = false;
}

function buildNeon2(){
    currentTheme = THEMES.neon;
    wipeLevel(); commonBounds();

    for(let x=22; x<28; x++){ map[MAP_H-2][x]=0; map[MAP_H-1][x]=0; }
    for(let x=68; x<74; x++){ map[MAP_H-2][x]=0; map[MAP_H-1][x]=0; }
    for(let x=112; x<118; x++){ map[MAP_H-2][x]=0; map[MAP_H-1][x]=0; }

    setRect(6,19, 12,1,1);
    setRect(22,18, 12,1,1);
    setRect(38,17, 12,1,1);
    setRect(54,18, 12,1,1);
    setRect(78,18, 14,1,1);
    setRect(98,17, 12,1,1);
    setRect(120,18, 16,1,1);

    setRect(44,13, 10,1,5);
    setRect(90,13, 10,1,5);
    setRect(128,13,10,1,5);

    setRect(34, MAP_H-3, 4,1,2);
    setRect(86, MAP_H-3, 4,1,2);

    map[MAP_H-3][16]=4;
    map[MAP_H-3][60]=4;
    map[MAP_H-3][104]=4;

    placeCheckpoint(10, MAP_H-3);
    placePortal(150, MAP_H-3);

    map[MAP_H-4][52]=9;
    map[MAP_H-4][132]=9;

    coinLine(8,MAP_H-4, 16,MAP_H-4);
    coinLine(50,14, 58,14);
    coinLine(92,14, 100,14);
    coinLine(130,14, 138,14);

    movingPlatforms.push(new MovingPlatform(52*TILE, 17*TILE, 96, 16,  0, -38, 210, 10));
    movingPlatforms.push(new MovingPlatform(94*TILE, 16*TILE, 96, 16,  54,  0, 260, 120));
    movingPlatforms.push(new MovingPlatform(120*TILE, 15*TILE, 100, 16,  0, -34, 190, 40));

    enemies.push(new Walker(12*TILE,  16*TILE));
    enemies.push(new Jumper(36*TILE,  16*TILE));
    enemies.push(new Shooter(78*TILE, 16*TILE));
    enemies.push(new BigBrute(96*TILE, 16*TILE));
    enemies.push(new Flyer(126*TILE, 9*TILE));

    player.setSpawn(3*TILE, 16*TILE);
    state.level.portalLocked = false;
}

function buildNeonBoss(){
    currentTheme = THEMES.neon;
    wipeLevel(); commonBounds();

    setRect(10, MAP_H-3, 140, 1, 1);
    for(let x=12;x<148;x+=6) map[MAP_H-3][x]=6;
    setRect(28, 18, 16, 1, 1);
    setRect(50, 17, 16, 1, 1);
    setRect(72, 18, 16, 1, 1);
    setRect(96, 17, 16, 1, 1);
    setRect(46, 13, 10, 1, 5);
    setRect(92, 13, 10, 1, 5);

    setRect(22, MAP_H-3, 6, 1, 2);
    setRect(132,MAP_H-3, 6, 1, 2);

    for(let x=30; x<130; x+=3) map[MAP_H-4][x]=3;

    placeCheckpoint(12, MAP_H-3);
    placePortal(150, MAP_H-3);

    movingPlatforms.push(new MovingPlatform(38*TILE, 15*TILE, 104, 16,  0, -30, 220, 0));
    movingPlatforms.push(new MovingPlatform(96*TILE, 15*TILE, 104, 16,  0, -30, 220, 110));

    boss = new NeonKing(96*TILE, 10*TILE);
    
    enemies.push(new Walker(25*TILE, 16*TILE));
    enemies.push(new Walker(40*TILE, 16*TILE));
    enemies.push(new Jumper(60*TILE, 16*TILE));
    enemies.push(new Jumper(80*TILE, 16*TILE));
    enemies.push(new Shooter(105*TILE, 16*TILE));
    enemies.push(new Shooter(125*TILE, 16*TILE));
    enemies.push(new Flyer(50*TILE, 9*TILE));
    enemies.push(new Flyer(90*TILE, 9*TILE));
    enemies.push(new BigBrute(115*TILE, 16*TILE));
    enemies.push(new BigBrute(135*TILE, 16*TILE));
    
    enemies.forEach(e => {
        e.respawnDelay = Math.floor(e.respawnDelay * 0.7);
    });

    player.setSpawn(16*TILE, 16*TILE);
    state.level.portalLocked = true;
}

function buildSky1(){
    currentTheme = THEMES.sky;
    wipeLevel(); commonBounds();

    for(let x=18;x<30;x++){ map[MAP_H-2][x]=0; map[MAP_H-1][x]=0; }
    for(let x=60;x<72;x++){ map[MAP_H-2][x]=0; map[MAP_H-1][x]=0; }
    for(let x=110;x<122;x++){ map[MAP_H-2][x]=0; map[MAP_H-1][x]=0; }

    setRect(8,19, 10,1,1);
    setRect(24,17, 12,1,1);
    setRect(44,18, 12,1,1);
    setRect(66,16, 12,1,1);
    setRect(88,17, 12,1,1);
    setRect(114,18,14,1,1);
    setRect(136,17,14,1,1);

    setRect(34,13, 12,1,5);
    setRect(78,12, 12,1,5);
    setRect(122,13,12,1,5);

    map[MAP_H-3][14]=4;
    map[MAP_H-3][96]=4;

    placeCheckpoint(6, MAP_H-3);
    placePortal(150, MAP_H-3);

    coinLine(24,16, 34,16);
    coinLine(66,15, 76,15);
    coinLine(114,16, 124,16);

    movingPlatforms.push(new MovingPlatform(52*TILE, 15*TILE, 110, 16,  0, -42, 240, 10));
    movingPlatforms.push(new MovingPlatform(102*TILE, 14*TILE, 110, 16,  58, 0, 260, 120));

    enemies.push(new Walker(26*TILE,  15*TILE, ["#ffffff","#c6fff2","#147db8"]));
    enemies.push(new Jumper(66*TILE,  14*TILE, ["#d7ffb9","#86ff9a","#0f8a4a"]));
    enemies.push(new Shooter(118*TILE, 16*TILE, ["#ffffff","#ffcc66","#147db8"]));
    enemies.push(new Flyer(92*TILE, 10*TILE, ["#ffffff","#c6fff2","#147db8"]));
    enemies.push(new BigBrute(136*TILE, 16*TILE));

    player.setSpawn(3*TILE, 16*TILE);
    state.level.portalLocked = false;
}

function buildSky2(){
    currentTheme = THEMES.sky;
    wipeLevel(); commonBounds();

    setRect(8,19, 12,1,1);
    setRect(28,18,12,1,1);
    setRect(48,17,12,1,1);
    setRect(68,18,12,1,1);
    setRect(88,17,12,1,1);
    setRect(108,18,12,1,1);
    setRect(128,17,14,1,1);

    for(let x=44;x<50;x++){ map[MAP_H-2][x]=0; map[MAP_H-1][x]=0; }
    for(let x=96;x<104;x++){ map[MAP_H-2][x]=0; map[MAP_H-1][x]=0; }

    setRect(24, MAP_H-3, 6, 1, 2);
    setRect(72, MAP_H-3, 6, 1, 2);
    setRect(120,MAP_H-3, 6, 1, 2);

    setRect(40, 13, 14, 1, 5);
    setRect(76, 12, 14, 1, 5);
    setRect(112,13, 14, 1, 5);

    map[MAP_H-3][14] = 4;
    map[MAP_H-3][96] = 4;
    map[MAP_H-4][54] = 9;
    map[MAP_H-4][134] = 9;

    placeCheckpoint(6, MAP_H-3);
    placePortal(150, MAP_H-3);

    coinLine(28,17, 36,17);
    coinLine(68,17, 76,17);
    coinLine(108,17, 116,17);
    coinLine(138,16, 146,16);

    movingPlatforms.push(new MovingPlatform(58*TILE, 14*TILE, 120, 16,  0, -46, 220, 0));
    movingPlatforms.push(new MovingPlatform(98*TILE, 15*TILE, 120, 16,  72, 0, 240, 140));

    enemies.push(new Jumper(30*TILE,  16*TILE, ["#ffffff","#c6fff2","#147db8"]));
    enemies.push(new Shooter(80*TILE,  15*TILE, ["#ffffff","#ffcc66","#147db8"]));
    enemies.push(new Walker(128*TILE, 16*TILE, ["#d7ffb9","#86ff9a","#0f8a4a"]));
    enemies.push(new Flyer(64*TILE, 10*TILE, ["#ffffff","#c6fff2","#147db8"]));
    enemies.push(new BigBrute(114*TILE, 16*TILE));

    player.setSpawn(3*TILE, 16*TILE);

    state.level.wind = true;
    state.level.windForce = (frame) => {
        const base = 0.9;
        const gust = Math.sin(frame*0.015) * 0.8 + Math.sin(frame*0.004) * 0.6;
        return base + gust;
    };

    state.level.portalLocked = false;
}

function buildSkyBoss(){
    currentTheme = THEMES.sky;
    wipeLevel(); commonBounds();

    setRect(12, MAP_H-3, 138, 1, 1);
    for(let x=16;x<148;x+=7) map[MAP_H-3][x]=6;

    setRect(30, 18, 18, 1, 1);
    setRect(58, 17, 18, 1, 1);
    setRect(86, 18, 18, 1, 1);
    setRect(114,17, 18, 1, 1);

    setRect(44, 13, 14, 1, 5);
    setRect(92, 12, 14, 1, 5);

    setRect(26, MAP_H-3, 6, 1, 2);
    setRect(130,MAP_H-3, 6, 1, 2);

    for(let x=26; x<150; x+=3) map[MAP_H-4][x]=3;

    placeCheckpoint(12, MAP_H-3);
    placePortal(150, MAP_H-3);

    movingPlatforms.push(new MovingPlatform(46*TILE, 15*TILE, 120, 16,  0, -32, 210, 10));
    movingPlatforms.push(new MovingPlatform(104*TILE, 14*TILE, 120, 16,  0, -32, 210, 120));

    boss = new StormSeraph(96*TILE, 9*TILE);

    enemies.push(new Walker(25*TILE, 16*TILE, ["#ffffff","#c6fff2","#147db8"]));
    enemies.push(new Walker(45*TILE, 16*TILE, ["#ffffff","#c6fff2","#147db8"]));
    enemies.push(new Jumper(65*TILE, 16*TILE, ["#d7ffb9","#86ff9a","#0f8a4a"]));
    enemies.push(new Jumper(85*TILE, 16*TILE, ["#d7ffb9","#86ff9a","#0f8a4a"]));
    enemies.push(new Shooter(105*TILE, 16*TILE, ["#ffffff","#ffcc66","#147db8"]));
    enemies.push(new Shooter(125*TILE, 16*TILE, ["#ffffff","#ffcc66","#147db8"]));
    enemies.push(new Flyer(55*TILE, 9*TILE, ["#ffffff","#c6fff2","#147db8"]));
    enemies.push(new Flyer(95*TILE, 9*TILE, ["#ffffff","#c6fff2","#147db8"]));
    enemies.push(new BigBrute(115*TILE, 16*TILE));
    enemies.push(new BigBrute(135*TILE, 16*TILE));
    
    enemies.forEach(e => {
        e.respawnDelay = Math.floor(e.respawnDelay * 0.7);
    });

    player.setSpawn(16*TILE, 16*TILE);
    state.level.portalLocked = true;
}

function buildAbyss1(){
    currentTheme = THEMES.abyss;
    wipeLevel(); commonBounds();

    setRect(6,19, 20,1,1);
    setRect(30,18,16,1,1);
    setRect(52,17,16,1,1);
    setRect(74,18,16,1,1);
    setRect(96,17,16,1,1);
    setRect(120,18,18,1,1);

    for(let x=40;x<46;x++){ map[MAP_H-2][x]=0; map[MAP_H-1][x]=0; }
    for(let x=88;x<94;x++){ map[MAP_H-2][x]=0; map[MAP_H-1][x]=0; }

    setRect(40,13, 12,1,5);
    setRect(88,12, 12,1,5);
    setRect(128,13, 12,1,5);

    map[MAP_H-3][18]=4;
    map[MAP_H-4][60]=9;

    placeCheckpoint(6, MAP_H-3);
    placePortal(150, MAP_H-3);

    coinLine(30,17, 38,17);
    coinLine(74,17, 82,17);
    coinLine(120,17, 128,17);

    movingPlatforms.push(new MovingPlatform(70*TILE, 15*TILE, 120, 16,  0, -44, 240, 30));
    enemies.push(new Walker(32*TILE,16*TILE, ["#ffd0d7","#ff6b7a","#8b0b1f"]));
    enemies.push(new Shooter(80*TILE,16*TILE, ["#fff2ff","#ffcc66","#3b0b2a"]));
    enemies.push(new Flyer(116*TILE,10*TILE, ["#ffffff","#c6fff2","#147db8"]));
    enemies.push(new BigBrute(136*TILE,16*TILE));

    player.setSpawn(3*TILE, 16*TILE);
    state.level.portalLocked = false;
}

function buildAbyss2(){
    currentTheme = THEMES.abyss;
    wipeLevel(); commonBounds();

    setRect(10, MAP_H-3, 140, 1, 1);
    for(let x=14;x<146;x+=5) map[MAP_H-3][x]=6;

    setRect(24,18, 18,1,1);
    setRect(56,17, 18,1,1);
    setRect(88,18, 18,1,1);
    setRect(120,17, 18,1,1);

    setRect(40,13, 14,1,5);
    setRect(96,12, 14,1,5);

    setRect(26, MAP_H-3, 6, 1, 2);
    setRect(130,MAP_H-3, 6, 1, 2);

    for(let x=30; x<130; x+=3) map[MAP_H-4][x]=3;

    placeCheckpoint(12, MAP_H-3);
    placePortal(150, MAP_H-3);

    movingPlatforms.push(new MovingPlatform(56*TILE, 15*TILE, 120, 16,  0, -34, 220, 10));
    movingPlatforms.push(new MovingPlatform(104*TILE, 14*TILE, 120, 16,  0, -34, 220, 120));

    enemies.push(new Walker(32*TILE, 16*TILE, ["#ffe1a8","#ffcc66","#3b0b2a"]));
    enemies.push(new Jumper(60*TILE, 16*TILE, ["#ffd0d7","#ff6b7a","#8b0b1f"]));
    enemies.push(new Shooter(112*TILE,16*TILE, ["#fff2ff","#d9a7ff","#5a1ea7"]));
    enemies.push(new Flyer(84*TILE, 10*TILE, ["#ffffff","#c6fff2","#147db8"]));
    enemies.push(new BigBrute(92*TILE, 16*TILE));

    player.setSpawn(16*TILE, 16*TILE);
    state.level.portalLocked = false;
}

function buildFinalBoss(){
    currentTheme = THEMES.abyss;
    wipeLevel(); commonBounds();

    setRect(12, MAP_H-3, 138, 1, 1);
    for(let x=16;x<148;x+=6) map[MAP_H-3][x]=6;

    setRect(32,18, 22,1,1);
    setRect(70,17, 22,1,1);
    setRect(108,18,22,1,1);

    setRect(46,13, 16,1,5);
    setRect(96,12, 16,1,5);

    for(let x=26; x<150; x+=3) map[MAP_H-4][x]=3;

    placeCheckpoint(12, MAP_H-3);
    placePortal(150, MAP_H-3);

    movingPlatforms.push(new MovingPlatform(60*TILE, 15*TILE, 140, 16,  0, -36, 210, 10));
    movingPlatforms.push(new MovingPlatform(96*TILE, 14*TILE, 140, 16,  0, -36, 210, 120));

    boss = new EclipseEmperor(96*TILE, 8*TILE);

    enemies.push(new Walker(25*TILE, 16*TILE, ["#ffe1a8","#ffcc66","#3b0b2a"]));
    enemies.push(new Walker(45*TILE, 16*TILE, ["#ffe1a8","#ffcc66","#3b0b2a"]));
    enemies.push(new Jumper(65*TILE, 16*TILE, ["#ffd0d7","#ff6b7a","#8b0b1f"]));
    enemies.push(new Jumper(85*TILE, 16*TILE, ["#ffd0d7","#ff6b7a","#8b0b1f"]));
    enemies.push(new Shooter(105*TILE, 16*TILE, ["#fff2ff","#d9a7ff","#5a1ea7"]));
    enemies.push(new Shooter(125*TILE, 16*TILE, ["#fff2ff","#d9a7ff","#5a1ea7"]));
    enemies.push(new Flyer(55*TILE, 10*TILE, ["#ffffff","#c6fff2","#147db8"]));
    enemies.push(new Flyer(95*TILE, 10*TILE, ["#ffffff","#c6fff2","#147db8"]));
    enemies.push(new BigBrute(115*TILE, 16*TILE));
    enemies.push(new BigBrute(135*TILE, 16*TILE));
    
    enemies.forEach(e => {
        e.respawnDelay = Math.floor(e.respawnDelay * 0.7);
    });

    player.setSpawn(16*TILE, 16*TILE);
    state.level.portalLocked = true;
}
