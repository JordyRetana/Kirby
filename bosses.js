/* Jordy Retana - Clases de Jefes */

class BossBase{
    constructor(){ this.dead=false; this.inv=0; this.phase=1; }
    hurt(){ }
    update(){ }
    draw(){ }
}

class NeonKing extends BossBase{
    constructor(x,y){
        super();
        this.x=x; this.y=y;
        this.w=60; this.h=46;
        this.baseX=x; this.baseY=y;
        this.t=rnd(0,999);
        this.hp=14; this.hpMax=14;
        this.fireCD=70;
        this.dir=1;
    }
    hurt(){
        if(this.inv>0 || this.dead) return;
        this.hp--; this.inv=16;
        addShake(6); sfx("boss");
        spawnParticles(this.x+this.w/2, this.y+this.h/2, 22, 1.1, 3.3, 26, "spark");
        if(this.hp <= Math.ceil(this.hpMax/2)) this.phase = 2;
        if(this.hp<=0){
            this.dead=true;
            addShake(16); sfx("win");
            fireworks(this.x+this.w/2, this.y+this.h/2);
            onBossDefeated("👑 ¡GANASTE AL PRIMER JEFE!", "Portal desbloqueado 🌀 — ve al portal para pasar al siguiente mapa.");
        }
    }
    update(player){
        if(this.dead) return;
        this.t += (this.phase===1?0.03:0.042);
        if(this.inv>0) this.inv--;

        const ampX = (this.phase===1 ? 105 : 140);
        const ampY = (this.phase===1 ? 14 : 18);
        this.x = this.baseX + Math.sin(this.t*2.0)*ampX;
        this.y = this.baseY + Math.sin(this.t*2.6)*ampY;

        const dx = (player.x+player.w/2) - (this.x+this.w/2);
        this.dir = dx>=0 ? 1 : -1;

        if(this.fireCD>0) this.fireCD--;
        if(this.fireCD<=0){
            if(this.phase===1){
                this.fireCD = 78;
                const sx = this.x + this.w/2 + this.dir*18;
                const sy = this.y + this.h/2 - 4;
                enemyShots.push(new EnemyShot(sx, sy, this.dir*4.8, rnd(-0.14,0.14), "rgba(255,107,122,.92)"));
            } else {
                this.fireCD = 64;
                const sx = this.x + this.w/2 + this.dir*18;
                const sy = this.y + this.h/2 - 4;
                enemyShots.push(new EnemyShot(sx, sy, this.dir*5.1, -0.60, "rgba(255,107,122,.92)"));
                enemyShots.push(new EnemyShot(sx, sy, this.dir*5.1,  0.00, "rgba(255,107,122,.92)"));
                enemyShots.push(new EnemyShot(sx, sy, this.dir*5.1,  0.60, "rgba(255,107,122,.92)"));
                addShake(2);
            }
        }
    }
    draw(){
        if(this.dead) return;
        const px = Math.floor(this.x - cam.x);
        const py = Math.floor(this.y - cam.y);

        ctx.globalAlpha = 0.22;
        ctx.fillStyle="#000";
        ctx.beginPath();
        ctx.ellipse(px+this.w/2, py+this.h+10, 30, 8, 0, 0, Math.PI*2);
        ctx.fill();
        ctx.globalAlpha=1;

        const blink = this.inv>0 && (Math.floor(this.inv/4)%2===0);
        ctx.save();
        if(blink) ctx.globalAlpha=0.55;

        ctx.fillStyle="rgba(0,0,0,.30)";
        roundRect(px-2,py-2,this.w+4,this.h+4,18); ctx.fill();

        const g = ctx.createRadialGradient(px+14,py+10,3,px+26,py+22,72);
        g.addColorStop(0, "#fff2ff");
        g.addColorStop(0.45, "#d9a7ff");
        g.addColorStop(1, "#5a1ea7");
        ctx.fillStyle=g;
        roundRect(px,py,this.w,this.h,16); ctx.fill();

        ctx.globalAlpha*=0.9;
        ctx.fillStyle="rgba(255,204,102,.95)";
        ctx.beginPath();
        ctx.moveTo(px+18,py+5);
        ctx.lineTo(px+24,py-8);
        ctx.lineTo(px+30,py+5);
        ctx.lineTo(px+36,py-8);
        ctx.lineTo(px+42,py+5);
        ctx.lineTo(px+42,py+10);
        ctx.lineTo(px+18,py+10);
        ctx.closePath();
        ctx.fill();
        ctx.globalAlpha = blink ? 0.55 : 1;

        ctx.fillStyle="#0b1020";
        circle(px+22, py+22, 4.2);
        circle(px+36, py+22, 4.2);
        ctx.fillStyle="rgba(255,255,255,.75)";
        circle(px+20.6, py+20.8, 1.5);
        circle(px+34.6, py+20.8, 1.5);

        ctx.fillStyle="rgba(11,16,32,.95)";
        roundRect(px+24, py+30, 12, 5, 3); ctx.fill();

        ctx.globalAlpha=0.85;
        ctx.fillStyle="rgba(0,0,0,.35)";
        roundRect(px+8, py-12, this.w-16, 7, 6); ctx.fill();
        const hpW = Math.max(0, (this.w-16) * (this.hp/this.hpMax));
        ctx.fillStyle= this.phase===1 ? "rgba(134,255,154,.92)" : "rgba(255,204,102,.92)";
        roundRect(px+8, py-12, hpW, 7, 6); ctx.fill();
        ctx.globalAlpha=1;

        ctx.restore();
    }
}

class StormSeraph extends BossBase{
    constructor(x,y){
        super();
        this.x=x; this.y=y;
        this.w=70; this.h=54;
        this.baseX=x; this.baseY=y;
        this.t=rnd(0,999);
        this.hp=18; this.hpMax=18;
        this.fireCD=62;
        this.dir=1;
        this.diveCD=160;
    }
    hurt(){
        if(this.inv>0 || this.dead) return;
        this.hp--; this.inv=14;
        addShake(6); sfx("boss");
        spawnParticles(this.x+this.w/2, this.y+this.h/2, 20, 1.2, 3.6, 28, "spark");
        if(this.hp <= Math.ceil(this.hpMax/2)) this.phase = 2;
        if(this.hp<=0){
            this.dead=true;
            addShake(18); sfx("win");
            fireworks(this.x+this.w/2, this.y+this.h/2);
            onBossDefeated("🌩️ ¡DERROTASTE AL JEFE DEL CIELO!", "El portal 🌀 brilla… entra para ir al mundo final.");
        }
    }
    update(player){
        if(this.dead) return;
        this.t += (this.phase===1?0.034:0.050);
        if(this.inv>0) this.inv--;

        const ampX = (this.phase===1 ? 125 : 155);
        const ampY = (this.phase===1 ? 18 : 22);
        this.x = this.baseX + Math.sin(this.t*2.0)*ampX;
        this.y = this.baseY + Math.sin(this.t*2.6)*ampY;

        const dx = (player.x+player.w/2) - (this.x+this.w/2);
        this.dir = dx>=0 ? 1 : -1;

        if(this.fireCD>0) this.fireCD--;
        if(this.fireCD<=0){
            if(this.phase===1){
                this.fireCD = 62;
                const sx=this.x+this.w/2 + this.dir*18;
                const sy=this.y+this.h/2 - 2;
                enemyShots.push(new EnemyShot(sx,sy, this.dir*5.4, rnd(-0.25,0.25), "rgba(134,255,154,.92)"));
            }else{
                this.fireCD = 52;
                const sx=this.x+this.w/2 + this.dir*18;
                const sy=this.y+this.h/2 - 2;
                for(const vy of [-0.9,-0.45,0,0.45,0.9]){
                    enemyShots.push(new EnemyShot(sx,sy, this.dir*5.7, vy, "rgba(134,255,154,.92)"));
                }
                addShake(2);
            }
        }

        if(this.diveCD>0) this.diveCD--;
        if(this.diveCD<=0){
            this.diveCD = this.phase===1 ? 190 : 140;
            const sx=this.x+this.w/2;
            const sy=this.y+this.h;
            enemyShots.push(new EnemyShot(sx-10,sy, rnd(-1.2,1.2), 3.8, "rgba(255,255,255,.85)"));
            enemyShots.push(new EnemyShot(sx+10,sy, rnd(-1.2,1.2), 3.8, "rgba(255,255,255,.85)"));
            spawnParticles(sx,sy, 18, 1.2, 3.6, 26, "wind");
            addShake(3.5);
        }
    }
    draw(){
        if(this.dead) return;
        const px = Math.floor(this.x - cam.x);
        const py = Math.floor(this.y - cam.y);

        ctx.globalAlpha=0.18;
        ctx.fillStyle="#000";
        ctx.beginPath();
        ctx.ellipse(px+this.w/2, py+this.h+12, 34, 9, 0, 0, Math.PI*2);
        ctx.fill();
        ctx.globalAlpha=1;

        const blink = this.inv>0 && (Math.floor(this.inv/4)%2===0);
        ctx.save();
        if(blink) ctx.globalAlpha=0.55;

        ctx.fillStyle="rgba(0,0,0,.30)";
        roundRect(px-2,py-2,this.w+4,this.h+4,22); ctx.fill();

        const g=ctx.createRadialGradient(px+18,py+14,3, px+34,py+26, 90);
        g.addColorStop(0,"#ffffff");
        g.addColorStop(0.35,"#c6fff2");
        g.addColorStop(1,"#147db8");
        ctx.fillStyle=g;
        roundRect(px,py,this.w,this.h,20); ctx.fill();

        ctx.globalAlpha*=0.9;
        ctx.fillStyle="rgba(134,255,154,.22)";
        roundRect(px-18, py+14, 24, 20, 14); ctx.fill();
        roundRect(px+this.w-6, py+14, 24, 20, 14); ctx.fill();
        ctx.globalAlpha = blink ? 0.55 : 1;

        ctx.fillStyle="#0b1020";
        circle(px+28, py+24, 4.0);
        circle(px+44, py+24, 4.0);
        ctx.fillStyle="rgba(255,255,255,.75)";
        circle(px+26.6, py+22.8, 1.4);
        circle(px+42.6, py+22.8, 1.4);

        ctx.globalAlpha=0.85;
        ctx.fillStyle="rgba(0,0,0,.35)";
        roundRect(px+10, py-14, this.w-20, 7, 6); ctx.fill();
        const hpW = Math.max(0,(this.w-20)*(this.hp/this.hpMax));
        ctx.fillStyle= this.phase===1 ? "rgba(134,255,154,.92)" : "rgba(255,204,102,.92)";
        roundRect(px+10, py-14, hpW, 7, 6); ctx.fill();
        ctx.globalAlpha=1;

        ctx.restore();
    }
}

class EclipseEmperor extends BossBase{
    constructor(x,y){
        super();
        this.x=x; this.y=y;
        this.w=110; this.h=78;
        this.baseX=x; this.baseY=y;
        this.t=rnd(0,999);
        this.hp=24; this.hpMax=24;
        this.fireCD=44;
        this.dir=1;
        this.ringT=0;
        this.summonCD=140;
        this.beamCD=210;
        this.shield=8;
    }
    hurt(){
        if(this.dead) return;
        if(this.inv>0) return;

        if(this.shield > 0){
            this.shield--;
            this.inv=10;
            addShake(5); sfx("boss");
            spawnParticles(this.x+this.w/2, this.y+this.h/2, 18, 1.2, 3.6, 26, "spark");
            return;
        }

        this.hp--;
        this.inv=14;
        addShake(7); sfx("boss");
        spawnParticles(this.x+this.w/2, this.y+this.h/2, 26, 1.2, 4.0, 30, "spark");

        if(this.hp <= 16) this.phase = 2;
        if(this.hp <= 8) this.phase = 3;

        if(this.hp<=0){
            this.dead=true;
            addShake(24); sfx("win");
            fireworks(this.x+this.w/2, this.y+this.h/2);
            onFinalVictory();
        }
    }
    update(player){
        if(this.dead) return;
        if(this.inv>0) this.inv--;

        this.t += (this.phase===1?0.022:(this.phase===2?0.032:0.042));
        const ampX = (this.phase===1 ? 140 : (this.phase===2 ? 170 : 200));
        const ampY = (this.phase===1 ? 18 : (this.phase===2 ? 22 : 26));

        this.x = this.baseX + Math.sin(this.t*2.0)*ampX;
        this.y = this.baseY + Math.sin(this.t*2.6)*ampY;

        const dx = (player.x+player.w/2) - (this.x+this.w/2);
        this.dir = dx>=0 ? 1 : -1;

        this.ringT += 0.05 + this.phase*0.02;

        if(this.fireCD>0) this.fireCD--;
        if(this.fireCD<=0){
            const sx=this.x+this.w/2 + this.dir*26;
            const sy=this.y+this.h/2 - 6;
            if(this.phase===1){
                this.fireCD=44;
                enemyShots.push(new EnemyShot(sx,sy, this.dir*6.0, rnd(-0.24,0.24), "rgba(255,204,102,.92)"));
            }else if(this.phase===2){
                this.fireCD=38;
                for(const vy of [-0.55, 0, 0.55]){
                    enemyShots.push(new EnemyShot(sx,sy, this.dir*6.3, vy, "rgba(255,204,102,.92)"));
                }
            }else{
                this.fireCD=34;
                for(const vy of [-1.0,-0.6,-0.2,0.2,0.6,1.0]){
                    enemyShots.push(new EnemyShot(sx,sy, this.dir*6.6, vy, "rgba(255,204,102,.92)"));
                }
                addShake(2);
            }
        }

        if(this.summonCD>0) this.summonCD--;
        if(this.summonCD<=0){
            this.summonCD = (this.phase===1?120:(this.phase===2?90:60));
            const alive = enemies.filter(e=>!e.dead).length;
            if(alive < 9){
                const px = (Math.random()<0.5 ? 30 : 120) * TILE;
                const py = (Math.random()<0.5 ? 16 : 12) * TILE;
                const roll = Math.random();
                if(roll<0.35) enemies.push(new Walker(px, py, ["#ffe1a8","#ffcc66","#d46a12"]));
                else if(roll<0.60) enemies.push(new Jumper(px, py, ["#ffd0d7","#ff6b7a","#8b0b1f"]));
                else if(roll<0.85) enemies.push(new Shooter(px, py, ["#fff2ff","#d9a7ff","#5a1ea7"]));
                else enemies.push(new Flyer(px, py-60, ["#ffffff","#c6fff2","#147db8"]));
                spawnParticles(px,py, 20, 1.2, 3.2, 26, "spark");
            }
        }

        if(this.beamCD>0) this.beamCD--;
        if(this.beamCD<=0){
            this.beamCD = (this.phase===1?260:(this.phase===2?220:180));
            const y = this.y + this.h/2;
            for(let i=0;i<9;i++){
                const vx = this.dir*(7.8 + i*0.15);
                const vy = (Math.random()-0.5)*0.35;
                enemyShots.push(new EnemyShot(this.x+this.w/2, y + (Math.random()-0.5)*8, vx, vy, "rgba(255,107,122,.92)"));
            }
            addShake(10);
            spawnParticles(this.x+this.w/2, y, 40, 1.4, 4.2, 32, "wind");
        }
    }
    draw(){
        if(this.dead) return;
        const px = Math.floor(this.x - cam.x);
        const py = Math.floor(this.y - cam.y);

        ctx.globalAlpha=0.22;
        ctx.fillStyle="#000";
        ctx.beginPath();
        ctx.ellipse(px+this.w/2, py+this.h+14, 52, 12, 0, 0, Math.PI*2);
        ctx.fill();
        ctx.globalAlpha=1;

        const blink = this.inv>0 && (Math.floor(this.inv/4)%2===0);

        ctx.globalAlpha = 0.12;
        ctx.fillStyle = "rgba(255,204,102,.85)";
        circle(px+this.w/2, py+this.h/2, 78);
        ctx.globalAlpha = 1;

        ctx.save();
        if(blink) ctx.globalAlpha=0.55;

        ctx.fillStyle="rgba(0,0,0,.34)";
        roundRect(px-2,py-2,this.w+4,this.h+4,26); ctx.fill();

        const g=ctx.createRadialGradient(px+32,py+22,4, px+56,py+42, 140);
        g.addColorStop(0,"#fff2ff");
        g.addColorStop(0.35,"#ffcc66");
        g.addColorStop(1,"#3b0b2a");
        ctx.fillStyle=g;
        roundRect(px,py,this.w,this.h,24); ctx.fill();

        ctx.fillStyle="#0b1020";
        circle(px+44, py+34, 6.0);
        circle(px+this.w-44, py+34, 6.0);
        ctx.fillStyle="rgba(255,255,255,.85)";
        circle(px+41.8, py+32.8, 2.0);
        circle(px+this.w-46.2, py+32.8, 2.0);

        ctx.globalAlpha=0.88;
        ctx.fillStyle="rgba(0,0,0,.40)";
        roundRect(px+16, py-16, this.w-32, 8, 6); ctx.fill();
        const hpW = Math.max(0,(this.w-32)*(this.hp/this.hpMax));
        ctx.fillStyle = this.phase===1 ? "rgba(255,204,102,.92)" : (this.phase===2 ? "rgba(255,107,122,.92)" : "rgba(134,255,154,.92)");
        roundRect(px+16, py-16, hpW, 8, 6); ctx.fill();
        ctx.globalAlpha=1;

        if(this.shield>0){
            ctx.globalAlpha=0.25;
            ctx.strokeStyle="rgba(124,246,255,.85)";
            ctx.lineWidth=3;
            ctx.beginPath();
            ctx.ellipse(px+this.w/2, py+this.h/2, 74, 50, 0, 0, Math.PI*2);
            ctx.stroke();
            ctx.lineWidth=1;
            ctx.globalAlpha=1;
        }

        ctx.restore();
    }
}
