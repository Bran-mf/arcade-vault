"use client";

import { useEffect, useRef } from "react";

export interface GameProps {
  onScore: (n: number) => void;
  onLives: (n: number) => void;
  onLevel: (n: number) => void;
  onGameOver: (score: number) => void;
  onPause?: () => void;
  paused?: boolean;
}

export default function AsteroidsGame({
  onScore,
  onLives,
  onLevel,
  onGameOver,
  paused = false,
}: GameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pausedRef = useRef(paused);

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const W = 800;
    const H = 600;

    // ── Input ──────────────────────────────────────────────────────────────────
    const keys: Record<string, boolean> = {};
    const justPressed: Record<string, boolean> = {};

    function onKeyDown(e: KeyboardEvent) {
      justPressed[e.code] = !keys[e.code];
      keys[e.code] = true;
      if (
        ["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(
          e.code
        )
      )
        e.preventDefault();
    }
    function onKeyUp(e: KeyboardEvent) {
      keys[e.code] = false;
    }

    canvas.addEventListener("keydown", onKeyDown);
    canvas.addEventListener("keyup", onKeyUp);

    function pressed(code: string) {
      const val = justPressed[code];
      justPressed[code] = false;
      return val;
    }

    // ── Utils ──────────────────────────────────────────────────────────────────
    const wrap = (v: number, max: number) => ((v % max) + max) % max;
    const dist = (a: { x: number; y: number }, b: { x: number; y: number }) =>
      Math.hypot(a.x - b.x, a.y - b.y);
    const rand = (min: number, max: number) =>
      min + Math.random() * (max - min);
    const randInt = (min: number, max: number) =>
      Math.floor(rand(min, max + 1));

    // ── Bullet ─────────────────────────────────────────────────────────────────
    class Bullet {
      x: number;
      y: number;
      vx: number;
      vy: number;
      ttl: number;
      radius: number;
      dead: boolean;
      constructor(x: number, y: number, angle: number) {
        this.x = x;
        this.y = y;
        const SPEED = 520;
        this.vx = Math.cos(angle) * SPEED;
        this.vy = Math.sin(angle) * SPEED;
        this.ttl = 1.1;
        this.radius = 2;
        this.dead = false;
      }
      update(dt: number) {
        this.x = wrap(this.x + this.vx * dt, W);
        this.y = wrap(this.y + this.vy * dt, H);
        this.ttl -= dt;
        if (this.ttl <= 0) this.dead = true;
      }
      draw() {
        ctx.fillStyle = "#fff";
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // ── Asteroid ───────────────────────────────────────────────────────────────
    const RADII = [0, 16, 30, 50];
    const SPEEDS = [0, 85, 55, 32];
    const POINTS = [0, 100, 50, 20];

    class Asteroid {
      x: number;
      y: number;
      size: number;
      radius: number;
      dead: boolean;
      vx: number;
      vy: number;
      rotSpeed: number;
      rot: number;
      verts: number[][];
      constructor(x: number, y: number, size = 3) {
        this.x = x;
        this.y = y;
        this.size = size;
        this.radius = RADII[size];
        this.dead = false;
        const angle = rand(0, Math.PI * 2);
        const speed = SPEEDS[size] + rand(-15, 15);
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.rotSpeed = rand(-1.2, 1.2);
        this.rot = rand(0, Math.PI * 2);
        const n = randInt(8, 13);
        this.verts = [];
        for (let i = 0; i < n; i++) {
          const a = (i / n) * Math.PI * 2;
          const r = this.radius * rand(0.6, 1.0);
          this.verts.push([Math.cos(a) * r, Math.sin(a) * r]);
        }
      }
      update(dt: number) {
        this.x = wrap(this.x + this.vx * dt, W);
        this.y = wrap(this.y + this.vy * dt, H);
        this.rot += this.rotSpeed * dt;
      }
      split() {
        if (this.size <= 1) return [];
        return [
          new Asteroid(this.x, this.y, this.size - 1),
          new Asteroid(this.x, this.y, this.size - 1),
        ];
      }
      draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rot);
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 1.5;
        ctx.lineJoin = "round";
        ctx.beginPath();
        ctx.moveTo(this.verts[0][0], this.verts[0][1]);
        for (let i = 1; i < this.verts.length; i++)
          ctx.lineTo(this.verts[i][0], this.verts[i][1]);
        ctx.closePath();
        ctx.stroke();
        ctx.restore();
      }
    }

    // ── Ship ───────────────────────────────────────────────────────────────────
    class Ship {
      x!: number;
      y!: number;
      angle!: number;
      vx!: number;
      vy!: number;
      radius!: number;
      thrusting!: boolean;
      invincible!: number;
      shootCooldown!: number;
      dead!: boolean;
      constructor() {
        this.reset();
      }
      reset() {
        this.x = W / 2;
        this.y = H / 2;
        this.angle = -Math.PI / 2;
        this.vx = 0;
        this.vy = 0;
        this.radius = 12;
        this.thrusting = false;
        this.invincible = 3;
        this.shootCooldown = 0;
        this.dead = false;
      }
      update(dt: number) {
        if (this.dead) return;
        if (this.invincible > 0) this.invincible -= dt;
        if (this.shootCooldown > 0) this.shootCooldown -= dt;
        const ROT = 3.5;
        const THRUST = 260;
        const DRAG = 0.987;
        if (keys["ArrowLeft"]) this.angle -= ROT * dt;
        if (keys["ArrowRight"]) this.angle += ROT * dt;
        this.thrusting = !!keys["ArrowUp"];
        if (this.thrusting) {
          this.vx += Math.cos(this.angle) * THRUST * dt;
          this.vy += Math.sin(this.angle) * THRUST * dt;
        }
        this.vx *= DRAG;
        this.vy *= DRAG;
        this.x = wrap(this.x + this.vx * dt, W);
        this.y = wrap(this.y + this.vy * dt, H);
      }
      tryShoot() {
        if (this.shootCooldown > 0 || this.dead) return [];
        this.shootCooldown = 0.2;
        const NOSE = 21;
        const ox = this.x + Math.cos(this.angle) * NOSE;
        const oy = this.y + Math.sin(this.angle) * NOSE;
        if (tripleTimer > 0) {
          const SPREAD = 0.18;
          return [
            new Bullet(ox, oy, this.angle - SPREAD),
            new Bullet(ox, oy, this.angle),
            new Bullet(ox, oy, this.angle + SPREAD),
          ];
        }
        return [new Bullet(ox, oy, this.angle)];
      }
      draw() {
        if (this.dead) return;
        if (this.invincible > 0 && Math.floor(this.invincible * 8) % 2 === 0)
          return;
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 1.5;
        ctx.lineJoin = "round";
        ctx.beginPath();
        ctx.moveTo(20, 0);
        ctx.lineTo(-12, -9);
        ctx.lineTo(-7, 0);
        ctx.lineTo(-12, 9);
        ctx.closePath();
        ctx.stroke();
        if (this.thrusting && Math.random() > 0.35) {
          ctx.beginPath();
          ctx.moveTo(-8, -4);
          ctx.lineTo(-8 - rand(6, 14), 0);
          ctx.lineTo(-8, 4);
          ctx.strokeStyle = "rgba(255, 130, 0, 0.85)";
          ctx.stroke();
        }
        ctx.restore();
      }
    }

    // ── Particle ───────────────────────────────────────────────────────────────
    class Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      life: number;
      ttl: number;
      dead: boolean;
      constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
        const angle = rand(0, Math.PI * 2);
        const speed = rand(30, 130);
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.life = rand(0.4, 1.1);
        this.ttl = this.life;
        this.dead = false;
      }
      update(dt: number) {
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.ttl -= dt;
        if (this.ttl <= 0) this.dead = true;
      }
      draw() {
        const alpha = this.ttl / this.life;
        ctx.strokeStyle = `rgba(255,255,255,${alpha.toFixed(2)})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x - this.vx * 0.05, this.y - this.vy * 0.05);
        ctx.stroke();
      }
    }

    // ── Game state ─────────────────────────────────────────────────────────────
    let ship: Ship,
      bullets: Bullet[],
      asteroids: Asteroid[],
      particles: Particle[];
    let score: number, lives: number, level: number;
    let gameState: "playing" | "dead" | "gameover";
    let deadTimer: number, tripleTimer: number, tripleUsed: boolean;

    // Track previous values to fire callbacks only on change
    let prevScore = -1,
      prevLives = -1,
      prevLevel = -1;

    function spawnAsteroids(count: number) {
      const SAFE_DIST = 130;
      for (let i = 0; i < count; i++) {
        let x, y;
        do {
          x = rand(0, W);
          y = rand(0, H);
        } while (Math.hypot(x - W / 2, y - H / 2) < SAFE_DIST);
        asteroids.push(new Asteroid(x, y, 3));
      }
    }

    function initGame() {
      ship = new Ship();
      bullets = [];
      asteroids = [];
      particles = [];
      score = 0;
      lives = 3;
      level = 1;
      gameState = "playing";
      tripleTimer = 0;
      tripleUsed = false;
      prevScore = -1;
      prevLives = -1;
      prevLevel = -1;
      spawnAsteroids(4);
    }

    function nextLevel() {
      level++;
      bullets = [];
      particles = [];
      ship.reset();
      spawnAsteroids(3 + level);
    }

    function explode(x: number, y: number, count = 8) {
      for (let i = 0; i < count; i++) particles.push(new Particle(x, y));
    }

    function killShip() {
      explode(ship.x, ship.y, 14);
      ship.dead = true;
      lives--;
      if (lives <= 0) {
        gameState = "gameover";
      } else {
        gameState = "dead";
        deadTimer = 2;
      }
    }

    function fireCallbacks() {
      if (score !== prevScore) {
        prevScore = score;
        onScore(score);
      }
      if (lives !== prevLives) {
        prevLives = lives;
        onLives(lives);
      }
      if (level !== prevLevel) {
        prevLevel = level;
        onLevel(level);
      }
    }

    // ── Update ─────────────────────────────────────────────────────────────────
    function update(dt: number) {
      if (gameState === "gameover") {
        if (pressed("Space")) initGame();
        particles.forEach((p) => p.update(dt));
        particles = particles.filter((p) => !p.dead);
        return;
      }
      if (gameState === "dead") {
        deadTimer -= dt;
        particles.forEach((p) => p.update(dt));
        particles = particles.filter((p) => !p.dead);
        asteroids.forEach((a) => a.update(dt));
        if (deadTimer <= 0) {
          gameState = "playing";
          ship.reset();
        }
        return;
      }
      if (pressed("Space")) bullets.push(...ship.tryShoot());
      ship.update(dt);
      bullets.forEach((b) => b.update(dt));
      asteroids.forEach((a) => a.update(dt));
      particles.forEach((p) => p.update(dt));
      if (tripleTimer > 0) tripleTimer -= dt;
      bullets = bullets.filter((b) => !b.dead);
      particles = particles.filter((p) => !p.dead);

      const newAsteroids: Asteroid[] = [];
      for (const b of bullets) {
        for (const a of asteroids) {
          if (!a.dead && !b.dead && dist(b, a) < a.radius) {
            b.dead = true;
            a.dead = true;
            score += POINTS[a.size];
            explode(a.x, a.y, a.size * 5);
            newAsteroids.push(...a.split());
            if (!tripleUsed && Math.random() < 0.15) {
              tripleUsed = true;
              tripleTimer = 10;
            }
          }
        }
      }
      asteroids = asteroids.filter((a) => !a.dead).concat(newAsteroids);
      bullets = bullets.filter((b) => !b.dead);

      if (ship.invincible <= 0) {
        for (const a of asteroids) {
          if (dist(ship, a) < ship.radius + a.radius * 0.82) {
            killShip();
            break;
          }
        }
      }
      if (asteroids.length === 0) nextLevel();
    }

    // ── Draw ───────────────────────────────────────────────────────────────────
    function draw() {
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, W, H);
      particles.forEach((p) => p.draw());
      asteroids.forEach((a) => a.draw());
      bullets.forEach((b) => b.draw());
      ship.draw();
      if (gameState === "gameover")
        drawOverlay(
          "GAME OVER",
          `PUNTAJE: ${score}   —   ESPACIO PARA REINICIAR`
        );
    }

    function drawOverlay(title: string, sub: string) {
      ctx.textAlign = "center";
      ctx.fillStyle = "#fff";
      ctx.font = "bold 46px monospace";
      ctx.fillText(title, W / 2, H / 2 - 18);
      ctx.font = "18px monospace";
      ctx.fillStyle = "rgba(255,255,255,0.65)";
      ctx.fillText(sub, W / 2, H / 2 + 22);
    }

    // ── Loop ───────────────────────────────────────────────────────────────────
    let lastTime: number | null = null;
    let rafId: number;
    let gameOverFired = false;

    function loop(ts: number) {
      const dt = lastTime === null ? 0 : Math.min((ts - lastTime) / 1000, 0.05);
      lastTime = ts;
      if (!pausedRef.current) update(dt);
      draw();
      fireCallbacks();
      if (gameState === "gameover" && !gameOverFired) {
        gameOverFired = true;
        onGameOver(score);
      }
      if (gameState !== "gameover") gameOverFired = false;
      rafId = requestAnimationFrame(loop);
    }

    initGame();
    canvas.focus();
    rafId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafId);
      canvas.removeEventListener("keydown", onKeyDown);
      canvas.removeEventListener("keyup", onKeyUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={800}
      height={600}
      tabIndex={0}
      style={{
        width: "100%",
        height: "100%",
        objectFit: "contain",
        display: "block",
      }}
    />
  );
}
