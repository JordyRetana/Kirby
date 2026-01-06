/* Jordy Retana - Clases de Enemigos */

function enemyLedgeTurn(e){
    if(!e.onGround) return;
    const frontX = e.x + (e.vx>0 ? e.w+2 : -2);
    const footY = e.y + e.h + 2;
    const below = tileAt(frontX, footY);
    if(below === 0) e.vx = -e.vx;
}

class Walker{
    constructor(x,y, palette=null){
        this.x=x; this.y=y;
        this.w=18; this.h=18;
        this.vx = Math.random()<0.5 ? -1.25 : 1.25;
        this.vy = 0;
        this.onGround=false;
        this.dead=false;
        this.sucked=false;
        this.t=rnd(0,999);
        this.palette = palette || (Math.random()<0.5 ? ["#b7fffa","#29f0e6","#0a8f8d"] : ["#ffd2a4","#ff9866","#c7422a"]);
        this.type="Walker";
        this.weight=1.0;
        this.hp=1;
        
        this.spawnX = x;
        this.spawnY = y;
        this.respawnTimer = 0;
        this.respawnDelay = 180;
    }
    
    update(){
        if(this.dead){
            this.respawnTimer--;
            if(this.respawnTimer <= 0){
                this.dead = false;
                this.x = this.spawnX;
                this.y = this.spawnY;
                this.vx = Math.random()<0.5 ? -1.25 : 1.25;
                this.vy = 0;
                this.sucked = false;
                this.hp = 1;
                this.t = rnd(0,999);
                
                spawnParticles(this.x+this.w/2, this.y+this.h/2, 12, 1.0, 2.2, 20, "spark");
            }
            return;
        }
        
        this.t += 0.08;

        if(!this.sucked){
            this.vy += 0.66;
            this.vy = clamp(this.vy, -20, 12);
        } else {
            this.vx *= 0.84;
            this.vy *= 0.84;
        }

        resolveTileCollisions(this);

        if(!this.sucked && this.hitWall) this.vx = -this.vx;
        if(!this.sucked) enemyLedgeTurn(this);

        if(this.y > VOID_Y){
            this.dead = true;
            this.respawnTimer = this.respawnDelay;
        }
    }
    
    draw(){
        if(this.dead){
            const px = Math.floor(this.spawnX - cam.x);
            const py = Math.floor(this.spawnY - cam.y);
            
            ctx.globalAlpha = 0.15;
            ctx.fillStyle = "rgba(255,255,255,.3)";
            roundRect(px, py, this.w, this.h, 8);
            ctx.fill();
            
            const percent = 1 - (this.respawnTimer / this.respawnDelay);
            ctx.globalAlpha = 0.6;
            ctx.fillStyle = currentTheme.glow;
            roundRect(px, py - 8, this.w * percent, 4, 2);
            ctx.fill();
            
            ctx.globalAlpha = 1;
            return;
        }
        
        const px = Math.floor(this.x - cam.x);
        const py = Math.floor(this.y - cam.y);
        const bob = Math.sin(this.t)*1.0;

        ctx.globalAlpha = 0.22;
        ctx.fillStyle = "#000";
        ctx.beginPath();
        ctx.ellipse(px+this.w/2, py+this.h+5, 10, 4, 0, 0, Math.PI*2);
        ctx.fill();
        ctx.globalAlpha = 1;

        const base = this.palette;
        const g = ctx.createRadialGradient(px+6, py+6, 2, px+10, py+10, 18);
        g.addColorStop(0, base[0]);
        g.addColorStop(0.55, base[1]);
        g.addColorStop(1, base[2]);

        ctx.fillStyle = "rgba(0,0,0,.30)";
        roundRect(px-1,py-1+bob,this.w+2,this.h+2,9); ctx.fill();

        ctx.fillStyle = g;
        roundRect(px, py+bob, this.w, this.h, 8); ctx.fill();

        ctx.globalAlpha = 0.22;
        ctx.fillStyle = "#fff";
        roundRect(px+3, py+3+bob, this.w-7, 4, 6); ctx.fill();
        ctx.globalAlpha = 1;

        ctx.fillStyle = "#0b1020";
        circle(px+6, py+7+bob, 2.2);
        circle(px+12, py+7+bob, 2.2);
        ctx.fillStyle="rgba(255,255,255,.75)";
        circle(px+5.2, py+6.2+bob, 0.9);
        circle(px+11.2, py+6.2+bob, 0.9);

        ctx.fillStyle = "rgba(11,16,32,.95)";
        roundRect(px+6, py+12+bob, 6, 3, 2); ctx.fill();

        if(this.sucked){
            ctx.globalAlpha = 0.12;
            ctx.fillStyle = currentTheme.glow;
            roundRect(px-4, py-4+bob, this.w+8, this.h+8, 10);
            ctx.fill();
            ctx.globalAlpha = 1;
        }
    }
}

class Jumper extends Walker{
    constructor(x,y, palette=null){
        super(x,y,palette);
        this.type="Jumper";
        this.jumpCD = 40 + Math.floor(Math.random()*40);
        this.palette = palette || ["#d7ffb9","#86ff9a","#0f8a4a"];
        this.weight=1.1;
        this.respawnDelay = 180;
    }
    
    update(){
        if(this.dead){
            this.respawnTimer--;
            if(this.respawnTimer <= 0){
                this.dead = false;
                this.x = this.spawnX;
                this.y = this.spawnY;
                this.vx = Math.random()<0.5 ? -1.25 : 1.25;
                this.vy = 0;
                this.sucked = false;
                this.hp = 1;
                this.t = rnd(0,999);
                this.jumpCD = 40 + Math.floor(Math.random()*40);
                spawnParticles(this.x+this.w/2, this.y+this.h/2, 12, 1.0, 2.2, 20, "spark");
            }
            return;
        }
        
        this.t += 0.09;

        if(!this.sucked){
            this.vy += 0.68;
            this.vy = clamp(this.vy, -20, 13);

            if(this.jumpCD>0) this.jumpCD--;
            if(this.onGround && this.jumpCD<=0){
                this.vy = -8.8;
                this.jumpCD = 42 + Math.floor(Math.random()*46);
                spawnParticles(this.x+this.w/2, this.y+this.h, 8, 0.9, 2.2, 18, "dust");
            }
        } else {
            this.vx *= 0.84;
            this.vy *= 0.84;
        }

        resolveTileCollisions(this);

        if(!this.sucked && this.hitWall) this.vx = -this.vx;
        if(!this.sucked) enemyLedgeTurn(this);

        if(this.y > VOID_Y){
            this.dead = true;
            this.respawnTimer = this.respawnDelay;
        }
    }
}

class Shooter extends Walker{
    constructor(x,y, palette=null){
        super(x,y,palette);
        this.type="Shooter";
        this.fireCD = 70 + Math.floor(Math.random()*60);
        this.face = (this.vx>=0)?1:-1;
        this.palette = palette || ["#ffe1a8","#ffcc66","#d46a12"];
        this.weight=1.25;
        this.respawnDelay = 240;
    }
    
    update(player){
        if(this.dead){
            this.respawnTimer--;
            if(this.respawnTimer <= 0){
                this.dead = false;
                this.x = this.spawnX;
                this.y = this.spawnY;
                this.vx = Math.random()<0.5 ? -1.25 : 1.25;
                this.vy = 0;
                this.sucked = false;
                this.hp = 1;
                this.t = rnd(0,999);
                this.fireCD = 70 + Math.floor(Math.random()*60);
                spawnParticles(this.x+this.w/2, this.y+this.h/2, 12, 1.0, 2.2, 20, "spark");
            }
            return;
        }
        
        this.t += 0.07;

        if(!this.sucked){
            this.vy += 0.68;
            this.vy = clamp(this.vy, -20, 13);
        } else {
            this.vx *= 0.84;
            this.vy *= 0.84;
        }

        resolveTileCollisions(this);

        if(!this.sucked){
            if(this.hitWall){ this.vx = -this.vx; }
            enemyLedgeTurn(this);
            this.face = (player.x > this.x) ? 1 : -1;

            if(this.fireCD>0) this.fireCD--;
            const inRange = Math.abs((player.x+player.w/2)-(this.x+this.w/2)) < 260;
            if(this.fireCD<=0 && inRange){
                this.fireCD = 85;
                const sx = this.x + this.w/2 + this.face*12;
                const sy = this.y + this.h/2 - 2;
                enemyShots.push(new EnemyShot(sx, sy, this.face*4.2, rnd(-0.10,0.10), currentTheme.spike));
                spawnParticles(sx,sy,10,0.9,2.6,20,"hurt");
            }
        }

        if(this.y > VOID_Y){
            this.dead = true;
            this.respawnTimer = this.respawnDelay;
        }
    }
}

class Flyer{
    constructor(x,y, palette=null){
        this.x=x; this.y=y;
        this.baseX=x; this.baseY=y;
        this.w=18; this.h=16;
        this.vx = (Math.random()<0.5?-1:1) * 1.35;
        this.vy = 0;
        this.dead=false;
        this.sucked=false;
        this.t=rnd(0,999);
        this.fireCD = 80 + Math.floor(Math.random()*50);
        this.type="Flyer";
        this.palette = palette || ["#ffffff","#c6fff2","#147db8"];
        this.weight=1.4;
        this.hp=1;
        
        this.spawnX = x;
        this.spawnY = y;
        this.respawnTimer = 0;
        this.respawnDelay = 300;
    }
    
    update(player){
        if(this.dead){
            this.respawnTimer--;
            if(this.respawnTimer <= 0){
                this.dead = false;
                this.x = this.spawnX;
                this.y = this.spawnY;
                this.baseX = this.spawnX;
                this.baseY = this.spawnY;
                this.vx = (Math.random()<0.5?-1:1) * 1.35;
                this.vy = 0;
                this.sucked = false;
                this.hp = 1;
                this.t = rnd(0,999);
                this.fireCD = 80 + Math.floor(Math.random()*50);
                spawnParticles(this.x+this.w/2, this.y+this.h/2, 12, 1.0, 2.2, 20, "spark");
            }
            return;
        }
        
        this.t += 0.05;

        if(this.sucked){
            this.vx *= 0.86;
            this.vy *= 0.86;
            this.x += this.vx;
            this.y += this.vy;
        }else{
            this.x += this.vx;
            this.y = this.baseY + Math.sin(this.t*2.4)*18;

            const aheadX = this.x + (this.vx>0?this.w+2:-2);
            const midY = this.y + this.h/2;
            if(tileAt(aheadX, midY)===1) this.vx = -this.vx;

            if(this.fireCD>0) this.fireCD--;
            const inRange = Math.abs((player.x+player.w/2)-(this.x+this.w/2)) < 300;
            if(this.fireCD<=0 && inRange){
                this.fireCD = 95;
                const dir = (player.x > this.x) ? 1 : -1;
                const sx = this.x + this.w/2 + dir*12;
                const sy = this.y + this.h/2;
                enemyShots.push(new EnemyShot(sx, sy, dir*4.8, rnd(-0.45,0.45), "rgba(255,255,255,.85)"));
                spawnParticles(sx,sy,10,1.0,2.8,22,"wind");
            }
        }

        if(this.y > VOID_Y){
            this.dead = true;
            this.respawnTimer = this.respawnDelay;
        }
    }
    
    draw(){
        if(this.dead){
            const px = Math.floor(this.spawnX - cam.x);
            const py = Math.floor(this.spawnY - cam.y);
            
            ctx.globalAlpha = 0.15;
            ctx.fillStyle = "rgba(255,255,255,.3)";
            roundRect(px, py, this.w, this.h, 8);
            ctx.fill();
            
            const percent = 1 - (this.respawnTimer / this.respawnDelay);
            ctx.globalAlpha = 0.6;
            ctx.fillStyle = currentTheme.glow;
            roundRect(px, py - 8, this.w * percent, 4, 2);
            ctx.fill();
            
            ctx.globalAlpha = 1;
            return;
        }
        
        const px = Math.floor(this.x - cam.x);
        const py = Math.floor(this.y - cam.y);

        ctx.globalAlpha = 0.18;
        ctx.fillStyle = "#000";
        ctx.beginPath();
        ctx.ellipse(px+this.w/2, py+this.h+10, 12, 4, 0, 0, Math.PI*2);
        ctx.fill();
        ctx.globalAlpha=1;

        const base=this.palette;
        const g = ctx.createRadialGradient(px+6, py+4, 2, px+10, py+8, 18);
        g.addColorStop(0, base[0]);
        g.addColorStop(0.6, base[1]);
        g.addColorStop(1, base[2]);

        ctx.fillStyle="rgba(0,0,0,.28)";
        roundRect(px-1,py-1,this.w+2,this.h+2,9); ctx.fill();
        ctx.fillStyle=g;
        roundRect(px,py,this.w,this.h,8); ctx.fill();

        ctx.globalAlpha=0.6;
        ctx.fillStyle="rgba(134,255,154,.18)";
        roundRect(px-10, py+4, 10, 7, 6); ctx.fill();
        roundRect(px+this.w, py+4, 10, 7, 6); ctx.fill();
        ctx.globalAlpha=1;

        ctx.fillStyle="#0b1020";
        circle(px+7, py+6, 2.0);
        circle(px+12,py+6, 2.0);
        ctx.fillStyle="rgba(255,255,255,.8)";
        circle(px+6.1, py+5.2, 0.8);
        circle(px+11.1,py+5.2, 0.8);
    }
}

class BigBrute{
    constructor(x,y){
        this.x=x; this.y=y;
        this.w=34; this.h=26;
        this.vx = (Math.random()<0.5?-1:1)*0.85;
        this.vy = 0;
        this.onGround=false;
        this.dead=false;
        this.sucked=false;
        this.t=rnd(0,999);
        this.type="Big";
        this.hp=3;
        this.weight=2.4;
        
        this.spawnX = x;
        this.spawnY = y;
        this.respawnTimer = 0;
        this.respawnDelay = 480;
    }
    
    hurt(dmg=1){
        this.hp -= dmg;
        addShake(5);
        spawnParticles(this.x+this.w/2, this.y+this.h/2, 16, 1.1, 3.4, 26, "spark");
        if(this.hp<=0){
            this.dead=true;
            this.respawnTimer = this.respawnDelay;
            player.coins += 3;
            player.score += 30;
            sfx("coin");
            spawnParticles(this.x+this.w/2, this.y+this.h/2, 28, 1.2, 3.8, 28, "coin");
        }
    }
    
    update(){
        if(this.dead){
            this.respawnTimer--;
            if(this.respawnTimer <= 0){
                this.dead = false;
                this.x = this.spawnX;
                this.y = this.spawnY;
                this.vx = (Math.random()<0.5?-1:1)*0.85;
                this.vy = 0;
                this.sucked = false;
                this.hp = 3;
                this.t = rnd(0,999);
                spawnParticles(this.x+this.w/2, this.y+this.h/2, 12, 1.0, 2.2, 20, "spark");
            }
            return;
        }
        
        this.t += 0.05;

        if(!this.sucked){
            this.vy += 0.72;
            this.vy = clamp(this.vy, -20, 13);
        }else{
            this.vx *= 0.88;
            this.vy *= 0.88;
        }

        resolveTileCollisions(this);

        if(!this.sucked && this.hitWall) this.vx = -this.vx;
        if(!this.sucked) enemyLedgeTurn(this);

        if(this.y > VOID_Y){
            this.dead = true;
            this.respawnTimer = this.respawnDelay;
        }
    }
    
    draw(){
        if(this.dead){
            const px = Math.floor(this.spawnX - cam.x);
            const py = Math.floor(this.spawnY - cam.y);
            
            ctx.globalAlpha = 0.15;
            ctx.fillStyle = "rgba(255,255,255,.3)";
            roundRect(px, py, this.w, this.h, 12);
            ctx.fill();
            
            const percent = 1 - (this.respawnTimer / this.respawnDelay);
            ctx.globalAlpha = 0.6;
            ctx.fillStyle = currentTheme.glow;
            roundRect(px, py - 8, this.w * percent, 4, 2);
            ctx.fill();
            
            ctx.globalAlpha = 1;
            return;
        }
        
        const px = Math.floor(this.x - cam.x);
        const py = Math.floor(this.y - cam.y);
        const bob = Math.sin(this.t)*0.5;

        ctx.globalAlpha=0.22;
        ctx.fillStyle="#000";
        ctx.beginPath();
        ctx.ellipse(px+this.w/2, py+this.h+6, 18, 6, 0, 0, Math.PI*2);
        ctx.fill();
        ctx.globalAlpha=1;

        ctx.fillStyle="rgba(0,0,0,.30)";
        roundRect(px-2,py-2+bob,this.w+4,this.h+4,14); ctx.fill();

        const g=ctx.createRadialGradient(px+12,py+8,3,px+18,py+14,50);
        g.addColorStop(0,"#fff2ff");
        g.addColorStop(0.45,"#ffcc66");
        g.addColorStop(1,"#3b0b2a");
        ctx.fillStyle=g;
        roundRect(px,py+bob,this.w,this.h,12); ctx.fill();

        ctx.globalAlpha=0.16;
        ctx.fillStyle="#fff";
        roundRect(px+6,py+6+bob,this.w-14,4,6); ctx.fill();
        ctx.globalAlpha=1;

        ctx.fillStyle="#0b1020";
        circle(px+12, py+10+bob, 2.6);
        circle(px+22, py+10+bob, 2.6);
        ctx.fillStyle="rgba(255,255,255,.8)";
        circle(px+11.0, py+9.0+bob, 1.0);
        circle(px+21.0, py+9.0+bob, 1.0);

        ctx.globalAlpha=0.85;
        for(let i=0;i<3;i++){
            ctx.fillStyle = (i < this.hp) ? "rgba(134,255,154,.92)" : "rgba(255,255,255,.18)";
            roundRect(px+6+i*9, py-10, 7, 4, 2); ctx.fill();
        }
        ctx.globalAlpha=1;
    }
}
