/* Jordy Retana - Clase del Jugador */

class Player{
    constructor(){
        this.spawnX = 3*TILE;
        this.spawnY = 16*TILE;
        this.resetAll();
    }
    resetAll(){
        upgrades.maxLives = 5;
        upgrades.suctionBonus = 0;
        upgrades.dashCooldownMul = 1;
        upgrades.shotPower = 1;
        upgrades.jumpBoost = 0;
        upgrades.speedBoost = 0;
        upgrades.shieldSec = 0;
        upgrades.coinBonus = 0;
        upgrades.shotDurationBonusSec = 0;

        this.lives = upgrades.maxLives;
        this.score = 0;
        this.coins = 0;

        this.ability = { name:null, timer:0 };

        this.setSpawn(this.spawnX, this.spawnY);
        this.resetToSpawn(true);
    }
    setSpawn(x,y){ this.spawnX=x; this.spawnY=y; }
    resetToSpawn(applyShield=false){
        this.x=this.spawnX; this.y=this.spawnY;
        this.prevY=this.y;
        this.w=20; this.h=20;
        this.vx=0; this.vy=0;
        this.face=1;
        this.onGround=false;
        this.onPlatform=null;

        this.invuln = 0;
        if(applyShield && upgrades.shieldSec>0){
            this.invuln = Math.max(this.invuln, Math.floor(upgrades.shieldSec*60));
        }

        this.coyote=0;
        this.lastJumpTap= -9999;
        this.tapCount=0;
        this.hasJumped=false;
        
        this.hasDoubleJumped=false;

        this.dashT=0;
        this.dashCD=0;

        this.inhaleT=0;
        this.cooldownShot=0;

        this.squash=0;
        this.win=false;
    }

    loseLife(reason="damage", respawnOnHit=true){
        if(this.invuln>0) return;

        this.lives = Math.max(0, this.lives - 1);

        this.invuln = 75;
        addShake(10);
        sfx("hurt");
        spawnParticles(this.x+this.w/2, this.y+this.h/2, 22, 1.1, 3.6, 34, "hurt");

        this.vy = -6.6;
        this.vx = -this.face * 3.2;

        if(this.lives <= 0){
            this.lives = upgrades.maxLives;
            this.score = Math.max(0, this.score - 50);
            this.ability = { name:null, timer:0 };
            this.resetToSpawn(true);
            return;
        }

        if(respawnOnHit){
            this.resetToSpawn(true);
        }
    }

    gainShotAbilityFromAbsorb(){
        const secs = BASE_SHOT_SEC + upgrades.shotDurationBonusSec;
        this.ability.name = "Disparo Estelar";
        this.ability.timer = Math.floor(secs * 60);
        spawnParticles(this.x+this.w/2, this.y+this.h/2, 18, 1.0, 3.0, 28, "spark");
    }

    shoot(){
        if(this.ability.name!=="Disparo Estelar") return;
        if(this.ability.timer<=0) return;
        if(this.cooldownShot>0) return;

        this.cooldownShot=16;
        const sx=this.x+this.w/2 + this.face*14;
        const sy=this.y+this.h/2 - 2;
        projectiles.push(new StarShot(sx,sy,this.face, upgrades.shotPower));
        if(upgrades.shotPower>=2){
            projectiles.push(new StarShot(sx,sy+6,this.face, upgrades.shotPower));
        }
        if(upgrades.shotPower>=3){
            projectiles.push(new StarShot(sx,sy-6,this.face, upgrades.shotPower));
        }
        spawnParticles(sx,sy,12,0.8,2.8,22,"spark");
    }

    startDash(){
        if(this.dashCD>0) return;
        this.dashT=12;
        const baseCD = 28;
        this.dashCD=Math.floor(baseCD * upgrades.dashCooldownMul);
        addShake(2.5);
        spawnParticles(this.x+this.w/2, this.y+this.h/2, 10, 1.0, 3.0, 20, "wind");
    }

    tryBreakBlocks(){
        const fx = this.face===1 ? (this.x+this.w+2) : (this.x-2);
        const fy = this.y + this.h/2;
        const tx = Math.floor(fx/TILE);
        const ty = Math.floor(fy/TILE);
        if(map[ty] && map[ty][tx]===6){
            setTile(tx,ty,0);
            addShake(4);
            spawnParticles(tx*TILE+TILE/2, ty*TILE+TILE/2, 26, 1.0, 3.8, 30, "break");
            this.score += 3;
        }
    }

    inhaleShape(){
        const p = this.inhaleT / 26;
        const range = lerp(42, 126, p) * (1 + upgrades.suctionBonus*0.20);
        const height = lerp(22, 56, p);
        const mouthX = this.face===1 ? (this.x+this.w-1) : (this.x+1);
        const mouthY = this.y + this.h*0.60;

        const farX = this.face===1 ? (mouthX + range) : (mouthX - range);
        const topY = mouthY - height/2;
        const botY = mouthY + height/2;

        return { p, mouthX, mouthY, farX, topY, botY, range, height };
    }

    handleTiles(level){
        const left = Math.floor(this.x / TILE);
        const right = Math.floor((this.x + this.w) / TILE);
        const top = Math.floor(this.y / TILE);
        const bottom = Math.floor((this.y + this.h) / TILE);

        for(let ty=top; ty<=bottom; ty++){
            if(ty<0 || ty>=MAP_H) continue;
            for(let tx=left; tx<=right; tx++){
                if(tx<0 || tx>=MAP_W) continue;
                const t = map[ty][tx];
                const tileX=tx*TILE, tileY=ty*TILE;

                if(t===3 && aabb(this.x,this.y,this.w,this.h, tileX+4,tileY+4, TILE-8,TILE-8)){
                    setTile(tx,ty,0);
                    const bonus = 1 + upgrades.coinBonus*0.25;
                    this.coins += 1;
                    this.score += Math.floor(6 * bonus);
                    sfx("coin");
                    spawnParticles(tileX+TILE/2, tileY+TILE/2, 12, 1.0, 2.6, 24, "coin");
                }
                if(t===2 && aabb(this.x,this.y,this.w,this.h, tileX+3,tileY+10, TILE-6,TILE-10)){
                    this.loseLife("spike", true);
                }
                if(t===4 && aabb(this.x,this.y,this.w,this.h, tileX+4,tileY+8, TILE-8,TILE-8)){
                    if(this.vy>=0){
                        this.vy=-11.2;
                        this.onGround=false;
                        addShake(4);
                        spawnParticles(tileX+TILE/2, tileY+TILE/2, 18, 1.0, 3.3, 26, "spring");
                    }
                }
                if(t===7 && aabb(this.x,this.y,this.w,this.h, tileX+2,tileY+2, TILE-4,TILE-4)){
                    setTile(tx,ty,0);
                    this.setSpawn(tileX, tileY - this.h);
                    spawnParticles(tileX+TILE/2, tileY+TILE/2, 18, 1.0, 3.0, 26, "spark");
                    this.score += 10;
                }
                if(t===9 && aabb(this.x,this.y,this.w,this.h, tileX+4,tileY+4, TILE-8,TILE-8)){
                    setTile(tx,ty,0);
                    this.lives = Math.min(upgrades.maxLives, this.lives+1);
                    this.score += 12;
                    sfx("buy");
                    spawnParticles(tileX+TILE/2, tileY+TILE/2, 18, 1.0, 3.0, 26, "heal");
                }
                if(t===8 && aabb(this.x,this.y,this.w,this.h, tileX+2,tileY+2, TILE-4,TILE-4)){
                    if(!level.portalLocked){
                        this.win = true;
                    }
                }
            }
        }
    }

    doJump(isDouble=false){
        const boost = 1 + upgrades.jumpBoost*0.06;
        const base = isDouble ? -10.2 : -9.6;
        this.vy = base * boost;

        this.onGround = false;
        this.coyote = 0;
        this.squash = isDouble ? 0.35 : 0.25;
        spawnParticles(this.x+this.w/2, this.y+this.h, 10, 0.9, 2.4, 18, "dust");
        addShake(isDouble ? 1.8 : 1.0);
        
        if(isDouble){
            this.hasDoubleJumped = true;
        }
    }

    update(level, frame){
        this.prevY = this.y;
        this.onPlatform = null;

        if(this.invuln>0) this.invuln--;
        if(this.cooldownShot>0) this.cooldownShot--;
        if(this.dashCD>0) this.dashCD--;

        if(this.ability.timer>0){
            this.ability.timer--;
            if(this.ability.timer===0) this.ability.name=null;
        }

        if(just("c")) this.shoot();

        if(down("x")) this.inhaleT = Math.min(26, this.inhaleT + 2.2);
        else this.inhaleT = Math.max(0, this.inhaleT - 3.2);

        if(just("z")) this.startDash();

        const ACC = 0.54;
        const baseMAX = 4.35 + upgrades.speedBoost*0.35;
        const FRICTION = this.onGround ? 0.82 : 0.93;

        let ax=0;
        if(down("ArrowLeft")) ax -= ACC;
        if(down("ArrowRight")) ax += ACC;
        if(ax!==0) this.face = sign(ax);

        if(level.wind && !this.onGround){
            ax += level.windForce(frame) * 0.22;
        }else if(level.wind){
            ax += level.windForce(frame) * 0.14;
        }

        if(this.dashT>0){
            this.dashT--;
            this.vx = this.face * 7.1;
            this.tryBreakBlocks();
        }else{
            this.vx = clamp(this.vx + ax, -baseMAX, baseMAX);
            this.vx *= FRICTION;
        }

        const jumpPressed = just("ArrowUp") || just("Space");
        if(jumpPressed){
            const dt = frame - this.lastJumpTap;
            if(dt <= 16) this.tapCount++;
            else this.tapCount = 1;
            this.lastJumpTap = frame;
        }

        if(this.onGround) this.coyote = 8;
        else this.coyote = Math.max(0, this.coyote-1);

        if(jumpPressed && (this.onGround || this.coyote>0)){
            this.doJump(false);
            this.hasJumped = true;
            this.tapCount = 1;
            this.hasDoubleJumped = false;
        }
        
        if(jumpPressed && !this.onGround && this.coyote===0 && this.hasJumped && !this.hasDoubleJumped){
            if(this.tapCount >= 2){
                this.tapCount = 0;
                this.doJump(true);
            }
        }

        let grav = 0.72;
        let maxFall = 13.2;
        const falling = this.vy > 0.5;
        const riseMult = 0.92;
        const fallMult = 1.18;

        this.vy += grav * (falling ? fallMult : riseMult);
        this.vy = clamp(this.vy, -22, maxFall);

        resolveTileCollisions(this);

        for(const plat of movingPlatforms){
            if(platformCollidePlayerTop(this, plat)){
                this.x += plat.vx;
                this.y += plat.vy;
            }
        }

        if(this.onGround){
            this.hasJumped = false;
            this.tapCount = 0;
            this.hasDoubleJumped = false;
        }

        this.handleTiles(level);

        if(this.y > VOID_Y){
            this.loseLife("void", true);
        }

        this.squash *= 0.86;
    }

    draw(){
        const shakeX = (Math.random()-0.5) * cam.shake;
        const shakeY = (Math.random()-0.5) * cam.shake;
        const px = Math.floor(this.x - cam.x + shakeX);
        const py = Math.floor(this.y - cam.y + shakeY);

        ctx.globalAlpha = 0.22;
        ctx.fillStyle = "#000";
        ctx.beginPath();
        ctx.ellipse(px+this.w/2, py+this.h+6, 14, 5.5, 0, 0, Math.PI*2);
        ctx.fill();
        ctx.globalAlpha = 1;

        const invBlink = this.invuln>0 && (Math.floor(this.invuln/6)%2===0);

        const squash = clamp(this.squash, 0, 0.40);
        const sx = 1 + squash;
        const sy = 1 - squash;

        ctx.save();
        if(invBlink) ctx.globalAlpha = 0.55;

        ctx.fillStyle="rgba(0,0,0,.30)";
        roundRect(px-1,py-1,this.w+2,this.h+2,11); ctx.fill();

        const g = ctx.createRadialGradient(px+6, py+6, 2, px+10, py+10, 20);
        g.addColorStop(0, "#fff2f8");
        g.addColorStop(0.45, "#ff95c7");
        g.addColorStop(1, "#c42264");
        ctx.fillStyle=g;

        ctx.save();
        ctx.translate(px+this.w/2, py+this.h/2);
        ctx.scale(sx, sy);
        roundRect(-this.w/2, -this.h/2, this.w, this.h, 10);
        ctx.fill();
        ctx.restore();

        ctx.globalAlpha*=0.20;
        ctx.fillStyle="#fff";
        roundRect(px+3,py+3,this.w-7,4,6); ctx.fill();
        ctx.globalAlpha = invBlink ? 0.55 : 1;

        ctx.globalAlpha*=0.92;
        ctx.fillStyle="rgba(255,120,165,.9)";
        circle(px+6, py+13, 3.0);
        circle(px+this.w-6, py+13, 3.0);

        ctx.globalAlpha = invBlink ? 0.55 : 1;
        ctx.fillStyle="#0b1020";
        const eyeX = this.face===1 ? px+12 : px+8;
        circle(eyeX, py+9, 2.8);
        circle(eyeX+6, py+9, 2.8);
        ctx.fillStyle="rgba(255,255,255,.75)";
        circle(eyeX-1.2, py+8.2, 1.1);
        circle(eyeX+4.8, py+8.2, 1.1);

        const fg = ctx.createLinearGradient(px, py+this.h, px, py+this.h+14);
        fg.addColorStop(0, "#ffe8a9");
        fg.addColorStop(1, "#ff8a2f");
        ctx.fillStyle=fg;
        roundRect(px+2, py+this.h-2, 8, 7, 4);
        roundRect(px+this.w-10, py+this.h-2, 8, 7, 4);
        ctx.fill();

        if(this.inhaleT>0){
            const s = this.inhaleShape();
            const mx = this.face===1 ? px+this.w-3 : px+3;
            const my = py+12;

            ctx.globalAlpha = 0.16 + 0.14*s.p;
            ctx.strokeStyle = currentTheme.glow;
            ctx.lineWidth = 2;
            ctx.beginPath();
            const rr = 8 + 10*s.p;
            const cx = mx + (this.face===1?4:-4);
            const cy = my;
            for(let a=0;a<Math.PI*2; a+=0.22){
                const r = rr*(a/(Math.PI*2));
                ctx.lineTo(cx + Math.cos(a)*r, cy + Math.sin(a)*r);
            }
            ctx.stroke();
            ctx.globalAlpha = 1;
            ctx.lineWidth = 1;

            ctx.fillStyle="#0b1020";
            circle(mx, my, 4.7);
            ctx.fillStyle="rgba(255,255,255,.20)";
            circle(mx-1.2*this.face, my-1.4, 1.2);
        } else {
            ctx.fillStyle="#0b1020";
            const mx = this.face===1 ? px+this.w-6 : px+6;
            roundRect(mx-3, py+12, 6, 3, 2); ctx.fill();
        }

        if(this.ability.name){
            ctx.globalAlpha=0.08;
            ctx.fillStyle=currentTheme.glow;
            roundRect(px-6, py-6, this.w+12, this.h+12, 14); ctx.fill();
            ctx.globalAlpha=1;
        }

        ctx.restore();
    }
}
