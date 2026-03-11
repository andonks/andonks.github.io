import { useEffect, useRef, useState } from 'react';
import * as Audio from './audio.js';
import './index.css';

const W = 480;
const H = 640;

// ─── Drawing ──────────────────────────────────────────────────────────────────

function drawPlayer(ctx, x, y, frame, focused) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(1.5, 1.5);

  // Engine glow
  const g = ctx.createRadialGradient(0, 10, 2, 0, 10, 24);
  g.addColorStop(0, 'rgba(0,200,255,0.85)');
  g.addColorStop(1, 'rgba(0,0,200,0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(0, 10, 22, 18, 0, 0, Math.PI * 2);
  ctx.fill();

  // Wings
  ctx.fillStyle = focused ? '#0099bb' : '#007aa0';
  ctx.beginPath();
  ctx.moveTo(-13, 4);  ctx.lineTo(-26, 14); ctx.lineTo(-21, -2); ctx.closePath(); ctx.fill();
  ctx.beginPath();
  ctx.moveTo( 13, 4);  ctx.lineTo( 26, 14); ctx.lineTo( 21, -2); ctx.closePath(); ctx.fill();

  // Body
  ctx.fillStyle = focused ? '#00ffff' : '#00ddee';
  ctx.beginPath();
  ctx.moveTo(0, -17);
  ctx.lineTo(11, 2);
  ctx.lineTo(9, 15);
  ctx.lineTo(-9, 15);
  ctx.lineTo(-11, 2);
  ctx.closePath();
  ctx.fill();

  // Cockpit
  ctx.fillStyle = '#aaffff';
  ctx.beginPath();
  ctx.ellipse(0, -4, 4, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  // Engine flame
  const fl = 3 + Math.sin(frame * 0.4) * 2.5;
  ctx.fillStyle = '#ff7700';
  ctx.beginPath();
  ctx.moveTo(-6, 15); ctx.lineTo(6, 15); ctx.lineTo(0, 15 + fl * 2.8); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#ffee00';
  ctx.beginPath();
  ctx.moveTo(-3, 15); ctx.lineTo(3, 15); ctx.lineTo(0, 15 + fl * 1.4); ctx.closePath(); ctx.fill();

  ctx.restore();
}

function drawEnemy(ctx, e, frame) {
  const { x, y, type, hp, maxHp } = e;
  const t = hp / maxHp;
  ctx.save();
  ctx.translate(x, y);

  if (type === 'grunt') {
    ctx.scale(2, 2);
    ctx.fillStyle = `hsl(${t * 18},90%,55%)`;
    ctx.beginPath();
    ctx.moveTo(0, 13); ctx.lineTo(-13, -4); ctx.lineTo(-17, 2);
    ctx.lineTo(0, 7); ctx.lineTo(17, 2); ctx.lineTo(13, -4);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#ff9999';
    ctx.beginPath(); ctx.ellipse(0, 5, 4, 5, 0, 0, Math.PI * 2); ctx.fill();

  } else if (type === 'fighter') {
    ctx.scale(2, 2);
    ctx.fillStyle = `hsl(${20 + t * 18},90%,55%)`;
    ctx.beginPath();
    ctx.moveTo(0, 19); ctx.lineTo(-20, -2); ctx.lineTo(-13, -17);
    ctx.lineTo(0, -9); ctx.lineTo(13, -17); ctx.lineTo(20, -2);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#ffbb66';
    ctx.beginPath(); ctx.ellipse(0, 2, 5, 7, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#cc5500';
    ctx.fillRect(-19, -5, 5, 11); ctx.fillRect(14, -5, 5, 11);

  } else if (type === 'bomber') {
    const pulse = 1 + Math.sin(frame * 0.09) * 0.04;
    ctx.scale(2 * pulse, 2 * pulse);
    ctx.fillStyle = `hsl(${t * 10},90%,38%)`;
    ctx.beginPath(); ctx.ellipse(0, 0, 26, 18, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = `hsl(${t * 10},90%,52%)`;
    ctx.beginPath();
    ctx.moveTo(0, 24); ctx.lineTo(-36, 4); ctx.lineTo(-32, -10);
    ctx.lineTo(32, -10); ctx.lineTo(36, 4);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#660000';
    [-19, 0, 19].forEach(ox => ctx.fillRect(ox - 3, 14, 6, 14));
    const cg = ctx.createRadialGradient(0, 0, 0, 0, 0, 10);
    cg.addColorStop(0, '#ff4444'); cg.addColorStop(1, 'transparent');
    ctx.fillStyle = cg;
    ctx.beginPath(); ctx.ellipse(0, 0, 10, 8, 0, 0, Math.PI * 2); ctx.fill();

  } else if (type === 'boss') {
    // ── Scaled body (2× base size) ─────────────────────────────────────────
    ctx.save();
    const pulse = 1 + Math.sin(frame * 0.05) * 0.025;
    ctx.scale(2 * pulse, 2 * pulse);

    // Wings
    ctx.fillStyle = '#770077';
    ctx.beginPath();
    ctx.moveTo(0, 46); ctx.lineTo(-72, 10); ctx.lineTo(-52, -28);
    ctx.lineTo(0, -20); ctx.lineTo(52, -28); ctx.lineTo(72, 10);
    ctx.closePath(); ctx.fill();

    // Body
    ctx.fillStyle = '#550055';
    ctx.beginPath(); ctx.ellipse(0, 0, 56, 38, 0, 0, Math.PI * 2); ctx.fill();

    // Core glow
    const cg = ctx.createRadialGradient(0, 0, 0, 0, 0, 30);
    cg.addColorStop(0, '#ff00ff');
    cg.addColorStop(0.5, '#880088');
    cg.addColorStop(1, 'rgba(100,0,100,0)');
    ctx.fillStyle = cg;
    ctx.beginPath(); ctx.ellipse(0, 0, 30, 30, 0, 0, Math.PI * 2); ctx.fill();

    ctx.fillStyle = '#ffaaff';
    ctx.beginPath(); ctx.ellipse(0, 0, 11, 11, 0, 0, Math.PI * 2); ctx.fill();

    // Weapon pods
    [-42, 42].forEach(ox => {
      ctx.fillStyle = '#550055';
      ctx.beginPath(); ctx.ellipse(ox, 14, 11, 15, 0, 0, Math.PI * 2); ctx.fill();
      const pg = ctx.createRadialGradient(ox, 20, 0, ox, 20, 7);
      pg.addColorStop(0, '#ff00ff'); pg.addColorStop(1, 'transparent');
      ctx.fillStyle = pg;
      ctx.beginPath(); ctx.arc(ox, 20, 7, 0, Math.PI * 2); ctx.fill();
    });
    ctx.restore();
  }

  ctx.restore();
}

function drawBullet(ctx, b, frame) {
  ctx.save();
  if (b.owner === 'player') {
    // Rotate ellipse to align with bullet velocity direction
    const angle = Math.atan2(b.vy, b.vx) + Math.PI / 2;
    const g = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, 14);
    g.addColorStop(0, '#ffffcc'); g.addColorStop(0.4, '#ffff00'); g.addColorStop(1, 'rgba(255,180,0,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.ellipse(b.x, b.y, b.pw ? 5 : 3, b.pw ? 24 : 20, angle, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.ellipse(b.x, b.y, b.pw ? 2 : 1.5, b.pw ? 14 : 12, angle, 0, Math.PI * 2); ctx.fill();
  } else if (b.burst) {
    // Elongated neon purple/blue — boss pod stream bullets
    const g = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, 14);
    g.addColorStop(0, '#ffffff'); g.addColorStop(0.3, '#8800ff'); g.addColorStop(1, 'rgba(80,0,255,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.ellipse(b.x, b.y, 4, 20, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#cc88ff';
    ctx.beginPath(); ctx.ellipse(b.x, b.y, 2, 12, 0, 0, Math.PI * 2); ctx.fill();
  } else {
    const p = 0.8 + Math.sin(frame * 0.22 + b.id * 1.7) * 0.2;
    const g = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, 16 * p);
    g.addColorStop(0, '#ffffff'); g.addColorStop(0.25, '#ff00cc'); g.addColorStop(1, 'rgba(255,0,180,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(b.x, b.y, 14 * p, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ff88ee';
    ctx.beginPath(); ctx.arc(b.x, b.y, 6 * p, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

function drawParticle(ctx, p) {
  const a = Math.max(0, p.life / p.maxLife);
  ctx.save();
  ctx.globalAlpha = a;
  ctx.fillStyle = p.color;
  ctx.beginPath();
  ctx.arc(p.x, p.y, Math.max(0.1, p.r * (0.4 + a * 0.6)), 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawExplosion(ctx, ex) {
  if (ex.delay > 0) return;
  const t = ex.life / ex.maxLife;   // 1 → 0
  const r = ex.maxR * (1 - t);      // expands 0 → maxR

  ctx.save();

  // Inner fireball glow (only in first ~60% of life)
  if (t > 0.4) {
    const ft = (t - 0.4) / 0.6;
    const gr = ctx.createRadialGradient(ex.x, ex.y, 0, ex.x, ex.y, r * 0.75 + 6);
    gr.addColorStop(0,   `rgba(255,255,255,${ft * 0.9})`);
    gr.addColorStop(0.3, `rgba(255,210,80,${ft * 0.65})`);
    gr.addColorStop(1,   'rgba(255,60,0,0)');
    ctx.fillStyle = gr;
    ctx.beginPath();
    ctx.arc(ex.x, ex.y, r * 0.75 + 6, 0, Math.PI * 2);
    ctx.fill();
  }

  // Primary shockwave ring — thick at birth, thins as it expands
  ctx.globalAlpha = t * 0.9;
  ctx.strokeStyle = ex.color;
  ctx.lineWidth = Math.max(0.5, 6 * t * t);
  ctx.beginPath();
  ctx.arc(ex.x, ex.y, Math.max(1, r), 0, Math.PI * 2);
  ctx.stroke();

  // Faint secondary ring slightly ahead
  ctx.globalAlpha = t * 0.35;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(ex.x, ex.y, Math.max(1, r * 1.18), 0, Math.PI * 2);
  ctx.stroke();

  ctx.restore();
}

// Spawn one or more explosion rings appropriate for the given type
function spawnExplosionRings(s, x, y, type) {
  const arr = s.explosions;
  const push = (dx, dy, maxR, life, color, delay = 0) =>
    arr.push({ x: x + dx, y: y + dy, maxR, life, maxLife: life, color, delay });

  if (type === 'grunt') {
    push(0, 0, 34, 22, '#ff8800');
  } else if (type === 'fighter') {
    push(0, 0, 52, 28, '#ffaa00');
    push(0, 0, 28, 18, '#ffffff', 4);
  } else if (type === 'bomber') {
    push(0, 0, 80, 38, '#ff5500');
    push(0, 0, 50, 28, '#ffcc00', 6);
    push(0, 0, 26, 18, '#ffffff', 12);
  } else if (type === 'player') {
    push(0, 0, 130, 48, '#ffffff');
    push(0, 0,  95, 40, '#aaddff',  7);
    push(0, 0,  60, 30, '#0088ff', 14);
    push(0, 0,  30, 20, '#ffffff', 20);
  } else if (type === 'boss') {
    const colors = ['#ff4400', '#ff8800', '#ffcc00', '#ffffff', '#ff2200'];
    for (let i = 0; i < 5; i++) {
      const dx = (Math.random() - 0.5) * 60;
      const dy = (Math.random() - 0.5) * 40;
      push(dx, dy, 65 + i * 18, 42 + i * 7, colors[i], i * 7);
    }
  } else if (type === 'player') {
    push(0, 0, 58, 32, '#00ffff');
    push(0, 0, 32, 22, '#ffffff', 5);
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

let _bid = 0;
function mkBullet(x, y, vx, vy, owner = 'enemy', color) {
  return { x, y, vx, vy, owner, id: _bid++, color };
}

let _cid = 0;
function mkCollectable(x, y) {
  return {
    x: x + (Math.random() - 0.5) * 20,
    y: y + (Math.random() - 0.5) * 10,
    vy: 1.2,
    vx: (Math.random() - 0.5) * 0.8,
    age: 0,
    id: _cid++,
  };
}

const DROP_COUNT = { grunt: 1, fighter: 2, bomber: 5, boss: 20 };
const COLLECT_PTS = 300;

function drawCollectable(ctx, c, frame) {
  const r = 9;
  const pulse = 1;
//  removed pulsing effect
//  const pulse = 1 + Math.sin(frame * 0.14 + c.id * 1.9) * 0.1;
  ctx.save();
  ctx.translate(c.x, c.y);
  ctx.scale(2, 2);
//  ctx.rotate(frame * 0.025 + c.id * 0.8);

  // Outer glow
  const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, r * 2.2);
  glow.addColorStop(0, 'rgba(0,255,120,0.35)');
  glow.addColorStop(1, 'rgba(0,200,80,0)');
  ctx.fillStyle = glow;
  ctx.beginPath(); ctx.arc(0, 0, r * 2.2, 0, Math.PI * 2); ctx.fill();

  // Hexagon body
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const x = Math.cos(a) * r * pulse;
    const y = Math.sin(a) * r * pulse;
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fillStyle = '#00bb44';
  ctx.fill();
  ctx.strokeStyle = '#88ffbb';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Inner highlight hexagon
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const x = Math.cos(a) * r * 0.48;
    const y = Math.sin(a) * r * 0.48;
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fillStyle = 'rgba(180,255,210,0.45)';
  ctx.fill();

  ctx.restore();
}

function aim(sx, sy, tx, ty, spd) {
  const d = Math.hypot(tx - sx, ty - sy) || 1;
  return { vx: (tx - sx) / d * spd, vy: (ty - sy) / d * spd };
}

function circle(x, y, n, spd, off = 0) {
  return Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2 + off;
    return mkBullet(x, y, Math.cos(a) * spd, Math.sin(a) * spd);
  });
}

function spread(x, y, n, ca, sa, spd, color) {
  return Array.from({ length: n }, (_, i) => {
    const a = ca + sa * (i / (n - 1) - 0.5);
    return mkBullet(x, y, Math.cos(a) * spd, Math.sin(a) * spd, 'enemy', color);
  });
}

function spawnParticles(arr, x, y, n, colors, spdRange, rRange) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2;
    const spd = spdRange[0] + Math.random() * (spdRange[1] - spdRange[0]);
    const life = 20 + Math.random() * 30;
    arr.push({
      x, y,
      vx: Math.cos(a) * spd, vy: Math.sin(a) * spd,
      r: rRange[0] + Math.random() * (rRange[1] - rRange[0]),
      life, maxLife: life,
      color: colors[Math.floor(Math.random() * colors.length)],
    });
  }
}

function explode(s, x, y, sz = 1) {
  s.shake = Math.max(s.shake, 7 * sz);
  const { particles: p } = s;

  // spark ring
  const n = Math.round(14 * sz);
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + Math.random() * 0.4;
    const spd = 2 + Math.random() * 5 * sz;
    const life = 18 + Math.random() * 22;
    p.push({ x, y, vx: Math.cos(a) * spd, vy: Math.sin(a) * spd,
      r: 2 + Math.random() * 2, life, maxLife: life,
      color: ['#ffff00','#ff8800','#ff4400'][Math.floor(Math.random() * 3)] });
  }
  // debris
  for (let i = 0; i < Math.round(10 * sz); i++) {
    const a = Math.random() * Math.PI * 2;
    const spd = Math.random() * 4 * sz;
    const life = 35 + Math.random() * 40;
    p.push({ x, y, vx: Math.cos(a) * spd, vy: Math.sin(a) * spd,
      r: 1.5 + Math.random() * 3, life, maxLife: life,
      color: ['#ffffff','#ffddaa','#ff6600'][Math.floor(Math.random() * 3)] });
  }
  // smoke
  for (let i = 0; i < Math.round(6 * sz); i++) {
    const a = Math.random() * Math.PI * 2;
    const spd = Math.random() * 1.5;
    const life = 28 + Math.random() * 30;
    p.push({ x, y, vx: Math.cos(a) * spd, vy: Math.sin(a) * spd - 0.6,
      r: 5 + Math.random() * 7 * sz, life, maxLife: life, color: '#2a2a2a' });
  }
}

// ─── Enemy definitions ────────────────────────────────────────────────────────

// Stats and base kill scores
const EDEFS = {
  grunt:   { w: 48, h: 40, maxHp: 3,    score: 500,   fireRate: 170, bspd: 1.75 },
  fighter: { w: 72, h: 60, maxHp: 8,    score: 2000,   fireRate: 140, bspd: 2    },
  bomber:  { w: 108,h: 84, maxHp: 30,   score: 6000,  fireRate: 76,  bspd: 1.4  },
  boss:    { w: 240,h: 180, maxHp: 2000, score: 200000, fireRate: 36,  bspd: 1.75 },
};

function createEnemy(type, x, pattern, vy = 1.5, startY = undefined) {
  const d = EDEFS[type];
  return {
    x, y: startY !== undefined ? startY : -(d.h / 2 + 10),
    type, pattern,
    w: d.w, h: d.h,
    hp: d.maxHp, maxHp: d.maxHp,
    score: d.score,
    fireRate: d.fireRate,
    bspd: d.bspd,
    vy,
    timer: 0,
    fireTimer: Math.floor(Math.random() * 50),
    dead: false,
    angle: 0,          // pattern angle accumulator
    phase: 0,
    transitionTimer: 0, // > 0 while boss is doing phase-transition charge
    chargeX: 0, chargeY: 0,  // player pos saved at transition start
    returnX: 0, returnY: 0,  // boss pos saved at transition start
  };
}

function updateEnemy(e, px, py, bullets) {
  e.timer++;
  e.fireTimer++;

  // Movement
  switch (e.pattern) {
    case 'straight':
      e.y += e.vy;
      break;
    case 'curve_r':
      e.y += e.vy;
      e.x += Math.sin(e.timer * 0.025) * 1.2;
      break;
    case 'curve_l':
      e.y += e.vy;
      e.x -= Math.sin(e.timer * 0.025) * 1.2;
      break;
    case 'zigzag':
      e.y += e.vy;
      e.x += Math.sin(e.timer * 0.055) * 3;
      break;
    case 'hover_c':
      if (e.y < H * 0.22) e.y += e.vy;
      e.x = W / 2 + Math.sin(e.timer * 0.014) * (W * 0.28);
      break;
    case 'hover_l':
      if (e.y < H * 0.22) e.y += e.vy;
      e.x = W * 0.27 + Math.sin(e.timer * 0.018) * (W * 0.14);
      break;
    case 'hover_r':
      if (e.y < H * 0.22) e.y += e.vy;
      e.x = W * 0.73 + Math.sin(e.timer * 0.018) * (W * 0.14);
      break;
    case 'side_l':   // enter from left edge, fly diagonally right-downward
      e.x += 2.6;
      e.y += e.vy;
      break;
    case 'side_r':   // enter from right edge, fly diagonally left-downward
      e.x -= 2.6;
      e.y += e.vy;
      break;
    case 'hover_mid':  // descend to mid-screen, hover & fire, then retreat up
      if (e.phase === 0) {
        e.y += e.vy;
        if (e.y >= H * 0.43) { e.phase = 1; e.timer = 0; }
      } else if (e.phase === 1) {
        e.x += Math.sin(e.timer * 0.05) * 1.6;
        e.x = Math.max(30, Math.min(W - 30, e.x));
        if (e.timer > 160) e.phase = 2;
      } else {
        e.y -= e.vy * 1.5;
      }
      break;
    case 'boss': {
      if (e.transitionTimer > 0) {
        if (e.transitionTimer > 80) {
          // Stage 1: hold position — explosions spawned by main loop
        } else if (e.transitionTimer > 30) {
          // Stage 2: charge toward player position saved at transition start (half speed)
          e.x += (e.chargeX - e.x) * 0.05;
          e.y += (e.chargeY - e.y) * 0.05;
        } else {
          // Stage 3: pull back to origin
          e.x += (e.returnX - e.x) * 0.15;
          e.y += (e.returnY - e.y) * 0.15;
        }
        e.transitionTimer--;
        if (e.transitionTimer === 0) e.phase++;
        break;
      }
      // Normal movement
      if (e.y < H * 0.22) {
        e.y += e.vy;
      } else {
        const targetX = W / 2 + Math.sin(e.timer * 0.009) * 160;
        e.x += (targetX - e.x) * 0.03;
        if (e.phase >= 1) {
          e.y = H * 0.22 + Math.sin(e.timer * 0.013) * 55;
        }
      }
      break;
    }
  }

  // Boss timed burst: last 60 frames of every 120-frame cycle.
  // Fire only during the first 20 of those 60 frames (cycle 60–79).
  // Skip firing (but still suppress normal fire) on the first burst
  // window of each HP phase.
  if (e.type === 'boss' && e.transitionTimer === 0 && e.y < H * 0.95) {
    const ratio = e.hp / e.maxHp;
    const hpPhase = ratio > 0.66 ? 1 : ratio > 0.33 ? 2 : 3;
    if (e.lastHpPhase === undefined) { e.lastHpPhase = hpPhase; e.burstPhaseArmed = false; }
    if (hpPhase !== e.lastHpPhase)   { e.lastHpPhase = hpPhase; e.burstPhaseArmed = false; }

    const cycle = e.timer % 120;
    // Arm once the first window's fire-zone has safely passed
    if (!e.burstPhaseArmed && cycle >= 80) e.burstPhaseArmed = true;

    if (cycle >= 60 && cycle < 80 && e.burstPhaseArmed && e.timer % 3 === 0) {
      [-84, 84].forEach(ox => {
        const b = mkBullet(e.x + ox, e.y + 40, 0, e.bspd * 3.5, 'enemy', '#8800ff');
        b.burst = true;
        bullets.push(b);
      });
    }
  }

  // Shooting — only fire while in the top 95% of the screen
  if (e.fireTimer < e.fireRate) return;
  if (e.y > H * 0.95) return;
  e.fireTimer = 0;
  if (e.type === 'boss' && e.transitionTimer > 0) return; // no fire during transition

  switch (e.type) {
    case 'grunt': {
      const v = aim(e.x, e.y, px, py, e.bspd);
      bullets.push(mkBullet(e.x, e.y, v.vx, v.vy));
      break;
    }
    case 'fighter': {
      const ca = Math.atan2(py - e.y, px - e.x);
      spread(e.x, e.y, 3, ca, 0.38, e.bspd, '#ffee00').forEach(b => bullets.push(b));
      break;
    }
    case 'bomber': {
      // 3×3 cluster, all fired straight down
      [-16, 0, 16].forEach(dx => {
        [0, 10, 20].forEach(dy => {
          bullets.push(mkBullet(e.x + dx, e.y + 22 + dy, 0, e.bspd * 2.2, 'enemy', '#ffaa00'));
        });
      });
      break;
    }
    case 'boss': {
      if (e.timer % 120 >= 60) break;  // burst window active — suppress normal fire
      const ratio = e.hp / e.maxHp;
      if (ratio > 0.66) {
        circle(e.x, e.y, 18, e.bspd, e.angle).forEach(b => bullets.push(b));
        e.angle += 0.18;
      } else if (ratio > 0.33) {
        circle(e.x, e.y, 18, e.bspd, e.angle).forEach(b => bullets.push(b));
        circle(e.x, e.y, 18, e.bspd * 0.65, -e.angle * 0.8).forEach(b => bullets.push(b));
        e.angle += 0.22;
        // aimed burst from pods
        if (e.timer % 40 === 0) {
          [-84, 84].forEach(ox => {
            const v = aim(e.x + ox, e.y + 40, px, py, e.bspd * 1.2);
            for (let i = 0; i < 4; i++) {
              bullets.push(mkBullet(e.x + ox, e.y + 40,
                v.vx + (Math.random() - 0.5) * 0.6, v.vy + (Math.random() - 0.5) * 0.6,
                'enemy', '#ffee00'));
            }
          });
        }
      } else {
        circle(e.x, e.y, 24, e.bspd, e.angle).forEach(b => bullets.push(b));
        circle(e.x, e.y, 16, e.bspd * 1.5, -e.angle * 1.3).forEach(b => bullets.push(b));
        e.angle += 0.3;
        if (e.timer % 28 === 0) {
          [-84, 84].forEach(ox => {
            const v = aim(e.x + ox, e.y + 40, px, py, e.bspd * 1.4);
            for (let i = 0; i < 5; i++) {
              bullets.push(mkBullet(e.x + ox, e.y + 40,
                v.vx + (Math.random() - 0.5) * 0.8, v.vy + (Math.random() - 0.5) * 0.8,
                'enemy', '#ffee00'));
            }
          });
        }
        const v = aim(e.x, e.y, px, py, e.bspd * 1.6);
        spread(e.x, e.y, 5, Math.atan2(py - e.y, px - e.x), 0.6, e.bspd * 1.6, '#ffaaff').forEach(b => bullets.push(b));
      }
      break;
    }
  }
}

// ─── Wave scripts ─────────────────────────────────────────────────────────────
// Each entry: { at: frameOffset, type, x, pattern, vy }

const WAVES = [
  // 0: Opener — 24 grunts, right side first then left side
  [
    { at:  30, type:'grunt', x: 495, sy:  35, pat:'side_r', vy:1.6 },
    { at:  30, type:'grunt', x: 495, sy:  95, pat:'side_r', vy:1.6 },
    { at:  55, type:'grunt', x: 495, sy:  95, pat:'side_r', vy:1.6 },
    { at:  55, type:'grunt', x: 495, sy: 155, pat:'side_r', vy:1.6 },

    { at:  85, type:'grunt', x: 495, sy:  35, pat:'side_r', vy:1.6 },
    { at:  85, type:'grunt', x: 495, sy:  95, pat:'side_r', vy:1.6 },
    { at: 110, type:'grunt', x: 495, sy:  95, pat:'side_r', vy:1.6 },
    { at: 110, type:'grunt', x: 495, sy: 155, pat:'side_r', vy:1.6 },

    { at: 140, type:'grunt', x: 495, sy:  35, pat:'side_r', vy:1.6 },
    { at: 140, type:'grunt', x: 495, sy:  95, pat:'side_r', vy:1.6 },
    { at: 165, type:'grunt', x: 495, sy:  95, pat:'side_r', vy:1.6 },
    { at: 165, type:'grunt', x: 495, sy: 155, pat:'side_r', vy:1.6 },

    { at: 300, type:'grunt', x: -15, sy:  15, pat:'side_l', vy:1.6 },
    { at: 300, type:'grunt', x: -15, sy:  75, pat:'side_l', vy:1.6 },
    { at: 325, type:'grunt', x: -15, sy:  75, pat:'side_l', vy:1.6 },
    { at: 325, type:'grunt', x: -15, sy: 135, pat:'side_l', vy:1.6 },

    { at: 355, type:'grunt', x: -15, sy:  15, pat:'side_l', vy:1.6 },
    { at: 355, type:'grunt', x: -15, sy:  75, pat:'side_l', vy:1.6 },
    { at: 380, type:'grunt', x: -15, sy:  75, pat:'side_l', vy:1.6 },
    { at: 380, type:'grunt', x: -15, sy: 135, pat:'side_l', vy:1.6 },

    { at: 410, type:'grunt', x: -15, sy:  15, pat:'side_l', vy:1.6 },
    { at: 410, type:'grunt', x: -15, sy:  75, pat:'side_l', vy:1.6 },
    { at: 435, type:'grunt', x: -15, sy:  75, pat:'side_l', vy:1.6 },
    { at: 435, type:'grunt', x: -15, sy: 135, pat:'side_l', vy:1.6 },
  ],
  // 1: 4 fighters + 12 grunts (sides), right side first then left
  [
    { at:   0, type:'fighter', x:100, pat:'curve_r',  vy:1.2 },

    { at:  30, type:'grunt', x: 495, sy:  35, pat:'side_r', vy:1.6 },
    { at:  30, type:'grunt', x: 495, sy:  95, pat:'side_r', vy:1.6 },
    { at:  55, type:'grunt', x: 495, sy:  95, pat:'side_r', vy:1.6 },
    { at:  55, type:'grunt', x: 495, sy: 155, pat:'side_r', vy:1.6 },

    { at:  85, type:'grunt', x: 495, sy:  35, pat:'side_r', vy:1.6 },
    { at:  85, type:'grunt', x: 495, sy:  95, pat:'side_r', vy:1.6 },
    { at: 110, type:'grunt', x: 495, sy:  95, pat:'side_r', vy:1.6 },
    { at: 110, type:'grunt', x: 495, sy: 155, pat:'side_r', vy:1.6 },

    { at: 120, type:'fighter', x:380, pat:'curve_l',  vy:1.2 },

    { at: 200, type:'fighter', x:100, pat:'curve_r',  vy:1.2 },

    { at: 300, type:'fighter', x:380, pat:'curve_l',  vy:1.2 },

    { at: 355, type:'grunt', x: -15, sy:  15, pat:'side_l', vy:1.6 },
    { at: 355, type:'grunt', x: -15, sy:  75, pat:'side_l', vy:1.6 },
    { at: 380, type:'grunt', x: -15, sy:  75, pat:'side_l', vy:1.6 },
    { at: 380, type:'grunt', x: -15, sy: 135, pat:'side_l', vy:1.6 },

    { at: 410, type:'grunt', x: -15, sy:  15, pat:'side_l', vy:1.6 },
    { at: 410, type:'grunt', x: -15, sy:  75, pat:'side_l', vy:1.6 },
    { at: 435, type:'grunt', x: -15, sy:  75, pat:'side_l', vy:1.6 },
    { at: 435, type:'grunt', x: -15, sy: 135, pat:'side_l', vy:1.6 },
  ],
  // 2: 2 bombers + 16 grunts (hover_mid)
  [
    { at:   0, type:'grunt',   x:30, pat:'hover_mid', vy:2.2 },
    { at:   0, type:'grunt',  x:450, pat:'hover_mid', vy:2.2 },
    { at:  30, type:'grunt',   x:80, pat:'hover_mid', vy:2.2 },
    { at:  30, type:'grunt',  x:400, pat:'hover_mid', vy:2.2 },
    { at:  60, type:'grunt',  x:130, pat:'hover_mid', vy:2.2 },
    { at:  60, type:'grunt',  x:350, pat:'hover_mid', vy:2.2 },
    { at:  90, type:'grunt',  x:180, pat:'hover_mid', vy:2.2 },
    { at:  90, type:'grunt',  x:300, pat:'hover_mid', vy:2.2 },

    { at: 100, type:'bomber', x:160, pat:'hover_l',   vy:0.9 },

    { at: 220, type:'bomber', x:320, pat:'hover_r',   vy:0.9 },

    { at: 225, type:'grunt',   x:30, pat:'hover_mid', vy:2.2 },
    { at: 225, type:'grunt',  x:450, pat:'hover_mid', vy:2.2 },
    { at: 255, type:'grunt',   x:80, pat:'hover_mid', vy:2.2 },
    { at: 255, type:'grunt',  x:400, pat:'hover_mid', vy:2.2 },
    { at: 285, type:'grunt',  x:130, pat:'hover_mid', vy:2.2 },
    { at: 285, type:'grunt',  x:350, pat:'hover_mid', vy:2.2 },
    { at: 315, type:'grunt',  x:180, pat:'hover_mid', vy:2.2 },
    { at: 315, type:'grunt',  x:300, pat:'hover_mid', vy:2.2 },
  ],
  // 3: 8 fighters + 12 grunts (hover_mid) + left & right entry
  [
    { at:   0, type:'fighter', x:100, pat:'zigzag',    vy:1.5 },
    { at:   0, type:'fighter', x:380, pat:'zigzag',    vy:1.5 },

    { at:  65, type:'grunt',   x:120, pat:'hover_mid', vy:2.5 },
    { at:  65, type:'grunt',   x:360, pat:'hover_mid', vy:2.5 },

    { at: 135, type:'fighter', x:100, pat:'curve_r',   vy:1.3 },
    { at: 135, type:'fighter', x:380, pat:'curve_l',   vy:1.3 },

    { at: 165, type:'grunt',   x: 80, pat:'hover_mid', vy:2.5 },
    { at: 165, type:'grunt',   x:400, pat:'hover_mid', vy:2.5 },

    { at: 230, type:'fighter', x:100, pat:'zigzag',    vy:1.5 },
    { at: 230, type:'fighter', x:380, pat:'zigzag',    vy:1.5 },

    { at: 255, type:'grunt', x: -15, sy:  15, pat:'side_l', vy:1.6 },
    { at: 255, type:'grunt', x: -15, sy:  75, pat:'side_l', vy:1.6 },
    { at: 280, type:'grunt', x: -15, sy:  75, pat:'side_l', vy:1.6 },
    { at: 280, type:'grunt', x: -15, sy: 135, pat:'side_l', vy:1.6 },

    { at: 300, type:'grunt', x: 495, sy:  35, pat:'side_r', vy:1.6 },
    { at: 300, type:'grunt', x: 495, sy:  95, pat:'side_r', vy:1.6 },
    { at: 325, type:'grunt', x: 495, sy:  95, pat:'side_r', vy:1.6 },
    { at: 325, type:'grunt', x: 495, sy: 155, pat:'side_r', vy:1.6 },

    { at: 360, type:'fighter', x:100, pat:'curve_r',  vy:1.3 },
    { at: 360, type:'fighter', x:380, pat:'curve_l',  vy:1.3 },
  ],
  // 4: 4 bombers in 2 pairs + 12 grunts (hover_mid) + crisscross
  [
    { at:   0, type:'bomber', x:130, pat:'hover_l',   vy:1.0 },
    { at:   0, type:'bomber', x:350, pat:'hover_r',   vy:1.0 },

    { at:  50, type:'grunt', x: -15, sy:  75, pat:'side_l', vy:1.6 },
    { at:  50, type:'grunt', x: 495, sy:  75, pat:'side_r', vy:1.6 },

    { at:  90, type:'grunt', x: -15, sy:  75, pat:'side_l', vy:1.6 },
    { at:  90, type:'grunt', x: 495, sy:  75, pat:'side_r', vy:1.6 },

    { at: 120, type:'grunt', x: -15, sy:  75, pat:'side_l', vy:1.6 },
    { at: 120, type:'grunt', x: 495, sy:  75, pat:'side_r', vy:1.6 },

    { at: 150, type:'grunt', x: -15, sy:  75, pat:'side_l', vy:1.6 },
    { at: 150, type:'grunt', x: 495, sy:  75, pat:'side_r', vy:1.6 },

    { at: 165, type:'grunt',  x: 80, pat:'hover_mid', vy:2.5 },
    { at: 165, type:'grunt',  x:400, pat:'hover_mid', vy:2.5 },

    { at: 200, type:'bomber', x:130, pat:'hover_l',   vy:1.0 },
    { at: 200, type:'bomber', x:350, pat:'hover_r',   vy:1.0 },

    { at: 215, type:'grunt',  x: 80, pat:'hover_mid', vy:2.5 },
    { at: 215, type:'grunt',  x:400, pat:'hover_mid', vy:2.5 },
  ],
  // 5: BOSS
  [
    { at:  0, type:'boss', x:240, pat:'boss', vy:0.55 },
  ],
];

// ─── Collision ────────────────────────────────────────────────────────────────

function overlaps(ax, ay, aw, ah, bx, by, bw, bh) {
  return (
    ax - aw / 2 < bx + bw / 2 &&
    ax + aw / 2 > bx - bw / 2 &&
    ay - ah / 2 < by + bh / 2 &&
    ay + ah / 2 > by - bh / 2
  );
}

// ─── Scrolling background buildings ──────────────────────────────────────────

function makeBuildings() {
  const b = [];
  for (let i = 0; i < 30; i++) {
    b.push({
      x: Math.random() * W,
      y: Math.random() * H,
      w: 20 + Math.random() * 50,
      h: 30 + Math.random() * 80,
      spd: 0.4 + Math.random() * 0.6,
      hue: Math.random() < 0.5 ? 210 : (Math.random() < 0.5 ? 270 : 180),
      alpha: 0.05 + Math.random() * 0.1,
    });
  }
  return b;
}

// ─── Game init ────────────────────────────────────────────────────────────────

function initState() {
  return {
    frame: 0,
    player: {
      x: W / 2, y: H - 100,
      w: 28, h: 32,
      hp: 3,
      invTimer: 0,
      deathTimer: 0,
      shootTimer: 0,
      bombs: 3,
    },
    playerBullets: [],
    enemies: [],
    enemyBullets: [],
    particles: [],
    stars: Array.from({ length: 180 }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      vy: 0.35 + Math.random() * 2.8,
      r: Math.random() * 1.6 + 0.3,
      alpha: 0.2 + Math.random() * 0.8,
      hue: Math.random() < 0.12 ? 50 : (Math.random() < 0.18 ? 200 : 0),
    })),
    buildings: makeBuildings(),
    score: 0,
    lives: 3,
    waveIdx: 0,
    waveTimer: 0,
    waveQueue: [...WAVES[0]],
    waveClear: false,
    waveDelay: 0,
    bossWarning: 0,
    bossBarAnim: 0,
    bossDefeated: false,
    bossDeathTimer: 0,
    bossDeathX: 0,
    bossDeathY: 0,
    explosions: [],
    collectables: [],
    chain: 0,
    chainTimer: 0,
    chainTextScale: 1.0,
    chainBossHitCooldown: 0,   // frames until boss hit can increment chain again (120 = 2 s)
    chainBossDecayTimer: 60,   // ticks down; each expiry drops chain by 1 if boss not hit
    chainBossHitThisSecond: false, // did a bullet land on the boss in the current decay window?
    gpsAccum: 0,               // GPS running sum: cumulative base scores of all kills in chain
    medalCount: 0,             // total pickups collected (for score calc screen)
    deathCount: 0,             // number of times player was hit (for No Deaths bonus)
    flashTimer: 0,
    shake: 0,
    shakeX: 0,
    shakeY: 0,
  };
}

// ─── Leaderboard helpers ──────────────────────────────────────────────────────

const LS_KEY = 'dondokpachi_scores';

function loadScores() {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]'); }
  catch { return []; }
}

function qualifiesForLeaderboard(score) {
  const scores = loadScores();
  return scores.length < 10 || score > scores[scores.length - 1].score;
}

function saveScore(initials, score) {
  const scores = loadScores();
  scores.push({ initials, score, isNew: true });
  scores.sort((a, b) => b.score - a.score);
  scores.splice(10);
  localStorage.setItem(LS_KEY, JSON.stringify(
    scores.map(s => ({ initials: s.initials, score: s.score }))
  ));
  return scores; // isNew flag only lives in memory for highlighting
}

// ─── Component ────────────────────────────────────────────────────────────────
// Fonts and text style sheet

const STYLES = {
  wrapper: {
    position: 'relative',
    width: W,
    height: H,
    userSelect: 'none',
  },
  canvas: {
    display: 'block',
    imageRendering: 'pixelated',
  },
  overlay: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(0,0,0,0.78)',
    color: '#fff',
    fontFamily: 'PixelifySans',
    textAlign: 'center',
    gap: 18,
  },
  title: { fontSize: 50, color: '#00ffff', textShadow: '0 0 20px #00ffff, 0 0 40px #0088ff', letterSpacing: 4 },
  sub: { fontSize: 24, color: '#aaeeff', letterSpacing: 2 },
  controls: { fontFamily: 'monospace', fontSize: 16, color: '#E2DED7', lineHeight: 1.8 },
  score: { fontFamily: 'Sixtyfour', fontSize: 54, color: '#ffff00' },
  btn: {
    padding: '10px 32px',
    fontSize: 16,
    fontFamily: 'PixelifySans',
    background: '#00ffff',
    color: '#000',
    border: 'none',
    cursor: 'pointer',
    letterSpacing: 2,
    fontWeight: 'bold',
  },
};

export default function Game() {
  const canvasRef     = useRef(null);
  const stateRef      = useRef(null);
  const rafRef        = useRef(null);
  const keysRef       = useRef({});
  const initialsRef   = useRef('');
  const hiScoreRef    = useRef(0);
  const [screen, setScreen]               = useState('title');
  const [finalScore, setFinalScore]       = useState(0);
  const [initialsDisplay, setInitialsDisplay] = useState('');
  const [leaderboard, setLeaderboard]     = useState(() => loadScores());
  const [isWin, setIsWin]                 = useState(false);
  const [calcBonuses, setCalcBonuses]     = useState([]);
  const [calcDisplayScore, setCalcDisplayScore] = useState(0);
  const [calcLines, setCalcLines]         = useState([]);
  // each entry: { labelVis, detailVis, detailNum, ptsVis, ptsNum }
  const selectedTrackRef                  = useRef(2);
  const [selectedTrack, setSelectedTrack] = useState(2);

  useEffect(() => {
    if (screen !== 'playing') return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    stateRef.current = initState();

    const onKeyDown = e => {
      // Pause toggle — handled before anything else; Space consumed here only
      if (e.code === 'Escape' || e.code === 'Space') {
        paused = !paused;
        if (paused == true) {
          Audio.sfxPause();
        }
        // if (paused) Audio.stopMusic();
        // else {
          // const isBoss = stateRef.current?.waveIdx === WAVES.length - 1;
          // Audio.startMusic(isBoss ? Audio.BOSS_TRACK_IDX : selectedTrackRef.current);
        // }
        // return;
      }
      if (e.code === 'KeyQ') { debugMode = !debugMode; return; }
      keysRef.current[e.code] = true;
      // Bomb on Shift press
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
        const s = stateRef.current;
        if (!s || s.player.bombs <= 0) return;
        s.player.bombs--;
        s.enemyBullets = [];
        s.enemies.forEach(en => {
          if (en.type === 'boss') {
            // Boss just takes heavy damage
            en.hp -= 160;
          } else {
            // All other ships instantly destroyed
            en.dead = true;
            s.score += en.score;
            const sz = en.type === 'bomber' ? 2.2 : en.type === 'fighter' ? 1.5 : 1;
            explode(s, en.x, en.y, sz);
            spawnExplosionRings(s, en.x, en.y, en.type);
            const drops = DROP_COUNT[en.type] ?? 1;
            for (let d = 0; d < drops; d++) s.collectables.push(mkCollectable(en.x, en.y));
          }
        });
        Audio.sfxBomb();
        // origin point of explosion animation
        explode(s, W/2, H/2, 2.5);
        // flash particles
        for (let i = 0; i < 60; i++) {
          const a = Math.random() * Math.PI * 2;
          const spd = 1 + Math.random() * 12;
          const life = 20 + Math.random() * 30;
          s.particles.push({
            x: W/2, y: H/2,
            vx: Math.cos(a) * spd, vy: Math.sin(a) * spd,
            r: 2 + Math.random() * 4, life, maxLife: life,
            color: ['#00ffff','#ffffff','#aaffff'][Math.floor(Math.random() * 3)],
          });
        }
      }
    };
    const onKeyUp = e => { keysRef.current[e.code] = false; };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup',   onKeyUp);

    let running   = true;
    let paused    = false;
    let debugMode = false;

    const TICK_MS = 1000 / 60;   // ~16.667 ms per game tick
    let lastTick  = 0;

    function loop(now) {
      if (!running) return;
      if (paused) {
        // Draw pause overlay over last frame and wait
        ctx.save();
        ctx.fillStyle = 'rgba(0,0,0,0.55)';
        ctx.fillRect(0, 0, W, H);
        ctx.textAlign = 'center';
        ctx.fillStyle = '#00ffff';
        ctx.font = 'bold 30px Sixtyfour';
        ctx.fillText('PAUSED', W / 2, H / 2 - 10);
        ctx.fillStyle = '#E2DED7';
        ctx.font = '24px PixelifySans';
        ctx.fillText('SPACE  or  ESC  to  resume', W / 2, H / 2 + 22);
        ctx.restore();
        rafRef.current = requestAnimationFrame(loop);
        return;
      }

      // ── 60 fps cap — skip tick if not enough time has elapsed ─────────────
      if (now - lastTick < TICK_MS - 1) {
        rafRef.current = requestAnimationFrame(loop);
        return;
      }
      lastTick = now;

      const s = stateRef.current;
      const keys = keysRef.current;
      const pl = s.player;
      const focused = keys['KeyX'];

      // ── Input (frozen while death animation plays) ────────────────────────
      if (pl.deathTimer <= 0) {
        const spd = focused ? 2.6 : 5.2;
        if (keys['ArrowLeft'] || keys['KeyA']) pl.x = Math.max(pl.w / 2, pl.x - spd);
        if (keys['ArrowRight']|| keys['KeyD']) pl.x = Math.min(W - pl.w / 2, pl.x + spd);
        if (keys['ArrowUp']   || keys['KeyW']) pl.y = Math.max(pl.h / 2, pl.y - spd);
        if (keys['ArrowDown'] || keys['KeyS']) pl.y = Math.min(H - pl.h / 2, pl.y + spd);
      }

      // ── Shoot ─────────────────────────────────────────────────────────────
      pl.shootTimer++;
      if (pl.deathTimer > 0) { /* no shooting during death window */ }
      else if (focused) {
        // FOCUS (X held): auto-fire 2 tight streams, high damage, slower movement
        if (pl.shootTimer >= 5) {
          pl.shootTimer = 0;
          Audio.sfxFocusShoot();
          [
            { dx: -7, vx: -0.18 },
            { dx:  7, vx:  0.18 },
          ].forEach(({ dx, vx }) => {
            const b = mkBullet(pl.x + dx, pl.y - 18, vx, -20, 'player');
            b.pw = true;
            s.playerBullets.push(b);
          });
        }
      } else if (keys['KeyZ']) {
        // SHOOT (Z): 7-bullet fan, 45° total (±22.5°), speed 20px/frame
        if (pl.shootTimer >= 10) {
          pl.shootTimer = 0;
          Audio.sfxShoot();
          s.playerBullets.push(mkBullet(pl.x - 20, pl.y - 10, -7.65, -18.5, 'player'));
          s.playerBullets.push(mkBullet(pl.x - 12, pl.y - 14, -5.18, -19.3, 'player'));
          s.playerBullets.push(mkBullet(pl.x -  5, pl.y - 17, -2.61, -19.8, 'player'));
          s.playerBullets.push(mkBullet(pl.x,      pl.y - 18,  0,    -20,   'player'));
          s.playerBullets.push(mkBullet(pl.x +  5, pl.y - 17,  2.61, -19.8, 'player'));
          s.playerBullets.push(mkBullet(pl.x + 12, pl.y - 14,  5.18, -19.3, 'player'));
          s.playerBullets.push(mkBullet(pl.x + 20, pl.y - 10,  7.65, -18.5, 'player'));
        }
      }

      // ── Move bullets ──────────────────────────────────────────────────────
      s.playerBullets = s.playerBullets.filter(b => {
        b.x += b.vx; b.y += b.vy;
        return b.y > -30 && b.x > -20 && b.x < W + 20;
      });
      s.enemyBullets = s.enemyBullets.filter(b => {
        b.x += b.vx; b.y += b.vy;
        return b.y < H + 30 && b.y > -30 && b.x > -20 && b.x < W + 20;
      });

      // ── Wave logic ────────────────────────────────────────────────────────
      if (s.bossWarning > 0) {
        // Hold here — boss warning countdown; start boss wave when it expires
        s.bossWarning--;
        if (s.bossWarning === 0) {
          s.waveIdx = WAVES.length - 1;
          s.waveTimer = 0;
          s.waveQueue = [...WAVES[WAVES.length - 1]];
          s.waveClear = false;
          s.bossBarAnim = 1;
          Audio.switchMusic(Audio.BOSS_TRACK_IDX);
        }
      } else if (s.waveDelay > 0) {
        s.waveDelay--;
      } else {
        s.waveTimer++;
        while (s.waveQueue.length > 0 && s.waveQueue[0].at <= s.waveTimer) {
          const ev = s.waveQueue.shift();
          s.enemies.push(createEnemy(ev.type, ev.x, ev.pat, ev.vy, ev.sy));
        }
        // Wave complete when queue empty and all enemies cleared
        if (s.waveQueue.length === 0 && s.enemies.length === 0 && !s.waveClear) {
          s.waveClear = true;
          const next = s.waveIdx + 1;
          if (next < WAVES.length) {
            if (next === WAVES.length - 1) {
              // Final wave done — boss warning before the boss appears
              s.bossWarning = 210;
              Audio.sfxAssWarning();
            } else {
              // Normal transition — near-instant gap
              s.waveDelay = 10;
              s.waveIdx = next;
              s.waveTimer = 0;
              s.waveQueue = [...WAVES[next]];
              s.waveClear = false;
            }
          }
        }
      }

      // ── Update enemies ────────────────────────────────────────────────────
      s.enemies.forEach(e => updateEnemy(e, pl.x, pl.y, s.enemyBullets));

      // Boss transition — ongoing explosions during freeze stage, shake during charge
      s.enemies.forEach(en => {
        if (en.type !== 'boss' || en.transitionTimer <= 0) return;
        if (en.transitionTimer > 80 && s.frame % 9 === 0) {
          const ox = (Math.random() - 0.5) * en.w * 0.55;
          const oy = (Math.random() - 0.5) * en.h * 0.4;
          spawnExplosionRings(s, en.x + ox, en.y + oy, 'bomber');
          explode(s, en.x + ox, en.y + oy, 1.6);
          Audio.sfxEnemyDie();
        }
        if (en.transitionTimer <= 80 && en.transitionTimer > 30) {
          s.shake = Math.max(s.shake, 7); // rumble during charge
        }
      });

      s.enemies = s.enemies.filter(e => {
        if (e.dead) return false;
        if (e.y > H + 120 || e.y < -300 || e.x < -200 || e.x > W + 200) return false;
        return true;
      });

      // ── Collisions: player bullets → enemies ──────────────────────────────
      s.enemies.forEach(en => {
        s.playerBullets.forEach(b => {
          if (b.hit) return;
          const hw = en.w * 0.6, hh = en.h * 0.6;
          if (overlaps(b.x, b.y, 6, 10, en.x, en.y, hw, hh)) {
            b.hit = true;
            const dmg = b.pw ? 3 : 1;
            en.hp -= dmg;
            spawnParticles(s.particles, b.x, b.y, 3, ['#ffff00','#ffffff','#ffaa00'], [1,5],[1,3]);
            // Boss chain — refresh display on any hit; increment once per 2 s
            if (en.type === 'boss' && en.hp > 0) {
              s.chainBossHitThisSecond = true;
              s.chainTimer = 200; // keep counter visible while hitting the boss
              if (s.chainBossHitCooldown === 0) {
                s.chain++;
                s.chainTextScale += 0.01;
                s.chainBossHitCooldown = 120;
              }
            }
            // Boss phase transition trigger
            if (en.type === 'boss' && en.transitionTimer === 0 && en.hp > 0) {
              const ratio = en.hp / en.maxHp;
              if ((en.phase === 0 && ratio <= 0.66) || (en.phase === 1 && ratio <= 0.33)) {
                en.transitionTimer = 120;
                en.chargeX = pl.x;
                en.chargeY = pl.y;
                en.returnX = en.x;
                en.returnY = en.y;
                s.enemyBullets = [];
                for (let i = 0; i < 6; i++) {
                  const ox = (Math.random() - 0.5) * en.w * 0.55;
                  const oy = (Math.random() - 0.5) * en.h * 0.4;
                  spawnExplosionRings(s, en.x + ox, en.y + oy, 'bomber');
                  explode(s, en.x + ox, en.y + oy, 1.8);
                }
                Audio.sfxBigExplosion();
              }
            }
            if (en.hp <= 0) {
              en.dead = true;
              // GPS: score += gpsAccum + base, then bank base for future multiplier
              s.score += s.gpsAccum + en.score;
              s.gpsAccum += en.score;
              s.chain++;
              s.chainTextScale += 0.01;
              s.chainTimer = 200;
              const sz = en.type === 'boss' ? 3 : en.type === 'bomber' ? 2.2 : en.type === 'fighter' ? 1.5 : 1;
              explode(s, en.x, en.y, sz);
              spawnExplosionRings(s, en.x, en.y, en.type);
              if (en.type === 'boss' || en.type === 'bomber') {
                Audio.sfxBigExplosion();
              } else {
                Audio.sfxEnemyDie();
              }
              const drops = DROP_COUNT[en.type] ?? 1;
              for (let d = 0; d < drops; d++) s.collectables.push(mkCollectable(en.x, en.y));
              if (en.type === 'boss') {
                s.bossDefeated = true;
                s.bossDeathX = en.x;
                s.bossDeathY = en.y;
                s.bossDeathTimer = 180;
                s.flashTimer = 20;
                // Convert every enemy bullet on screen into a collectable pickup
                s.enemyBullets.forEach(b => s.collectables.push(mkCollectable(b.x, b.y)));
                s.enemyBullets = [];
                // Initial burst: several big explosions scattered around the boss
                for (let i = 0; i < 8; i++) {
                  const ox = (Math.random() - 0.5) * 130;
                  const oy = (Math.random() - 0.5) * 80;
                  spawnExplosionRings(s, en.x + ox, en.y + oy, 'boss');
                  explode(s, en.x + ox, en.y + oy, 2.2);
                }
              }
            }
          }
        });
      });
      s.playerBullets = s.playerBullets.filter(b => !b.hit);

      // ── Collisions: enemy bullets + enemy bodies → player ────────────────
      if (pl.invTimer <= 0 && !debugMode) {
        let playerHit = false;

        // Enemy bullets
        for (const b of s.enemyBullets) {
          if (overlaps(pl.x, pl.y, pl.w * 0.38, pl.h * 0.38, b.x, b.y, 5, 5)) {
            playerHit = true;
            break;
          }
        }

        // Enemy bodies — grunts/fighters also destroyed on impact
        if (!playerHit) {
          for (const e of s.enemies) {
            if (e.dead) continue;
            if (overlaps(pl.x, pl.y, pl.w * 0.5, pl.h * 0.5, e.x, e.y, e.w * 0.6, e.h * 0.6)) {
              playerHit = true;
              // small ships get rammed apart; bombers/boss shrug it off
              if (e.type === 'grunt' || e.type === 'fighter') {
                e.dead = true;
                s.score += EDEFS[e.type].score;
                spawnExplosionRings(s, e.x, e.y, e.type);
                explode(s, e.x, e.y, e.type === 'fighter' ? 1.2 : 0.9);
                Audio.sfxEnemyDie();
                const drops = DROP_COUNT[e.type] ?? 1;
                for (let d = 0; d < drops; d++) s.collectables.push(mkCollectable(e.x, e.y));
              }
              break;
            }
          }
        }

        if (playerHit) {
          s.lives--;
          s.deathCount++;
          s.medalCount = 0;     // medal streak resets on death
          pl.deathTimer = 60;   // 1 second frozen / invisible
          pl.invTimer   = 240;  // total invincibility (includes death time)

          // Big white & blue player explosion
          spawnExplosionRings(s, pl.x, pl.y, 'player');
          s.shake = Math.max(s.shake, 18);
          const { particles: pp } = s;
          for (let i = 0; i < 28; i++) {
            const a = (i / 28) * Math.PI * 2 + Math.random() * 0.3;
            const spd = 2.5 + Math.random() * 6;
            const life = 22 + Math.random() * 30;
            pp.push({ x: pl.x, y: pl.y,
              vx: Math.cos(a) * spd, vy: Math.sin(a) * spd,
              r: 2 + Math.random() * 2.5, life, maxLife: life,
              color: ['#ffffff','#aaddff','#0099ff','#cceeff'][Math.floor(Math.random() * 4)] });
          }
          for (let i = 0; i < 14; i++) {
            const a = Math.random() * Math.PI * 2;
            const spd = Math.random() * 3.5;
            const life = 35 + Math.random() * 40;
            pp.push({ x: pl.x, y: pl.y,
              vx: Math.cos(a) * spd, vy: Math.sin(a) * spd,
              r: 1.5 + Math.random() * 3, life, maxLife: life,
              color: ['#ffffff','#ddeeff'][Math.floor(Math.random() * 2)] });
          }

          Audio.sfxPlayerHit();
          s.flashTimer = 14;
          s.enemyBullets = [];
          s.chain = 0;
          s.chainTimer = 0;
          s.chainTextScale = 1.0;
          s.gpsAccum = 0;
          // game over triggers when deathTimer expires (1-second delay)
        }
      }
      // Boss bar draw-in animation
      if (s.bossBarAnim > 0 && s.bossBarAnim < 40) s.bossBarAnim++;

      // Tick timers (deathTimer first; respawn position when it expires)
      if (pl.deathTimer > 0) {
        pl.deathTimer--;
        if (pl.deathTimer === 0) {
          if (s.lives <= 0) {
            running = false;
            setFinalScore(s.score);
            setIsWin(false);
            setScreen(qualifiesForLeaderboard(s.score) ? 'enter_initials' : 'leaderboard');
            return;
          }
          pl.x = W / 2;
          pl.y = H - 100;
        }
      }
      if (pl.invTimer > 0) pl.invTimer--;

      // ── Boss death explosion show ─────────────────────────────────────────
      if (s.bossDeathTimer > 0) {
        s.bossDeathTimer--;
        if (s.frame % 7 === 0) {
          const ox = (Math.random() - 0.5) * 140;
          const oy = (Math.random() - 0.5) * 90;
          spawnExplosionRings(s, s.bossDeathX + ox, s.bossDeathY + oy, 'bomber');
          explode(s, s.bossDeathX + ox, s.bossDeathY + oy, 1.8);
        }
        if (s.frame % 20 === 0) Audio.sfxBigExplosion();
      }

      // ── Win condition ─────────────────────────────────────────────────────
      if (s.bossDefeated && s.enemies.length === 0
          && s.bossDeathTimer <= 0 && s.collectables.length === 0) {
        running = false;
        Audio.stopMusic();
        Audio.sfxWaveClear();
        setFinalScore(s.score);
        setIsWin(true);
        // Level Clear bonus calculations
        setCalcBonuses([
          { label: 'MEDALS COLLECTED', detailCount: s.medalCount, detailSuffix: '× 1,000',  pts: s.medalCount * 1000 },
          { label: 'BOMBS REMAINING', detailCount: s.player.bombs, detailSuffix: '× 250,000', pts: s.player.bombs * 250000 },
          { label: 'LIVES REMAINING', detailCount: s.lives,      detailSuffix: '× 1,000,000', pts: s.lives * 1000000 },
          { label: 'NO DEATHS',       detailText: s.deathCount === 0 ? 'PERFECT!' : '--',   pts: s.deathCount === 0 ? 250000 : 0 },
        ]);
        setScreen('score_calc');
        return;
      }

      // ── Chain timer / boss decay ──────────────────────────────────────────
      const bossAlive = s.enemies.some(e => e.type === 'boss' && !e.dead);
      if (bossAlive) {
        // Boss phase: cooldown for hit-based increment
        if (s.chainBossHitCooldown > 0) s.chainBossHitCooldown--;
        // Every 60 frames (1 s), drop chain by 1 if boss wasn't hit this window
        if (--s.chainBossDecayTimer <= 0) {
          s.chainBossDecayTimer = 60;
          if (!s.chainBossHitThisSecond && s.chain > 0) {
            s.chain--;
            s.chainTextScale = Math.max(1.0, s.chainTextScale - 0.01);
            if (s.chain === 0) s.gpsAccum = 0;
          }
          s.chainBossHitThisSecond = false;
        }
      } else if (!s.bossWarning) {
        // Normal phase (not in WARNING): timer-based chain expiry
        if (s.chainTimer > 0) { s.chainTimer--; if (!s.chainTimer) { s.chain = 0; s.chainTextScale = 1.0; s.gpsAccum = 0; } }
      }
      // bossWarning > 0: chain timer is paused — do nothing
      if (s.flashTimer > 0) s.flashTimer--;

      // ── Explosions ────────────────────────────────────────────────────────
      s.explosions = s.explosions.filter(ex => {
        if (ex.delay > 0) { ex.delay--; return true; }
        ex.life--;
        return ex.life > 0;
      });

      // ── Particles ─────────────────────────────────────────────────────────
      s.particles = s.particles.filter(p => {
        p.x += p.vx; p.y += p.vy;
        p.vy += 0.04; p.vx *= 0.985;
        p.life--;
        return p.life > 0;
      });

      // ── Stars ─────────────────────────────────────────────────────────────
      s.stars.forEach(st => {
        st.y += st.vy;
        if (st.y > H + 2) { st.y = -2; st.x = Math.random() * W; }
      });

      // ── Buildings ─────────────────────────────────────────────────────────
      s.buildings.forEach(b => {
        b.y += b.spd;
        if (b.y > H + b.h) b.y = -b.h;
      });

      // ── Collectables ──────────────────────────────────────────────────────
      s.collectables = s.collectables.filter(c => {
//  acceleration
//        c.age++;
//        if (c.age > 40) c.vy = Math.min(c.vy + 0.01, 5);
        c.x += c.vx;
        c.y += c.vy;
        c.vx *= 0.97;
        if (overlaps(pl.x, pl.y, pl.w * 0.8, pl.h * 0.8, c.x, c.y, 30, 30)) {
          s.score += COLLECT_PTS;
          s.medalCount++;
          spawnParticles(s.particles, c.x, c.y, 6,
            ['#00ff88', '#aaffcc', '#ffffff'], [1, 4], [1, 3]);
          return false;
        }
        return c.y < H + 20;
      });

      // ── Screen shake ──────────────────────────────────────────────────────
      s.shake *= 0.84;
      if (s.shake < 0.5) s.shake = 0;
      s.shakeX = s.shake ? (Math.random() - 0.5) * s.shake : 0;
      s.shakeY = s.shake ? (Math.random() - 0.5) * s.shake : 0;

      s.frame++;

      // ════════════════════════════════════════════════════════════════════
      // RENDER
      // ════════════════════════════════════════════════════════════════════
      ctx.save();
      if (s.shake) ctx.translate(s.shakeX, s.shakeY);

      // Background
      ctx.fillStyle = '#00000e';
      ctx.fillRect(-10, -10, W + 20, H + 20);

      // City silhouette (scrolling buildings)
      s.buildings.forEach(b => {
        ctx.fillStyle = `hsla(${b.hue},60%,20%,${b.alpha})`;
        ctx.fillRect(b.x - b.w / 2, b.y - b.h, b.w, b.h);
        // windows
        ctx.fillStyle = `hsla(${b.hue},80%,70%,${b.alpha * 2.5})`;
        for (let wy = b.y - b.h + 6; wy < b.y - 4; wy += 10) {
          for (let wx = b.x - b.w / 2 + 4; wx < b.x + b.w / 2 - 4; wx += 8) {
            if (Math.random() < 0.4) ctx.fillRect(wx, wy, 4, 5);
          }
        }
      });

      // Grid scanlines
      ctx.strokeStyle = 'rgba(0,60,120,0.25)';
      ctx.lineWidth = 1;
      const gs = 44;
      const off = s.frame % gs;
      for (let y = -gs + off; y < H; y += gs) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
      }
      // Perspective diagonals
      ctx.strokeStyle = 'rgba(0,40,80,0.15)';
      const doff = (s.frame * 0.3) % 80;
      for (let x = -W + doff; x < W * 2; x += 80) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + 110, H); ctx.stroke();
      }

      // Stars
      s.stars.forEach(st => {
        const col = st.hue === 0 ? `rgba(255,255,255,${st.alpha})`
          : st.hue === 50 ? `rgba(255,220,100,${st.alpha})`
          : `rgba(100,190,255,${st.alpha})`;
        ctx.fillStyle = col;
        ctx.beginPath(); ctx.arc(st.x, st.y, st.r, 0, Math.PI * 2); ctx.fill();
      });

      // Collectables (drawn under enemies so they emerge from the wreckage)
      s.collectables.forEach(c => drawCollectable(ctx, c, s.frame));

      // Enemies
      s.enemies.forEach(e => drawEnemy(ctx, e, s.frame));

      // Explosion rings (above enemies, under bullets)
      s.explosions.forEach(ex => drawExplosion(ctx, ex));

      // Enemy bullets
      s.enemyBullets.forEach(b => drawBullet(ctx, b, s.frame));

      // Player (hidden during death window; flash when invincible)
      if (pl.deathTimer <= 0 && (pl.invTimer <= 0 || Math.floor(pl.invTimer / 5) % 2 === 0)) {
        drawPlayer(ctx, pl.x, pl.y, s.frame, focused);
        if (focused) {
          ctx.strokeStyle = 'rgba(0,255,255,0.55)';
          ctx.lineWidth = 1;
          ctx.beginPath(); ctx.arc(pl.x, pl.y, 5, 0, Math.PI * 2); ctx.stroke();
        }
      }

      // Player bullets
      s.playerBullets.forEach(b => drawBullet(ctx, b, s.frame));

      // Particles (top layer)
      s.particles.forEach(p => drawParticle(ctx, p));

      ctx.restore();

      // White flash (player/boss death)
      if (s.flashTimer > 0) {
        ctx.save();
        ctx.globalAlpha = (s.flashTimer / 14) * 0.85;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, W, H);
        ctx.restore();
      }

      // ─ HUD ──────────────────────────────────────────────────────────────
      // Top bar
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      ctx.fillRect(0, 0, W, 34);
      ctx.strokeStyle = 'rgba(0,255,255,0.3)';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(0, 34); ctx.lineTo(W, 34); ctx.stroke();

      // Player current score (top left)
      ctx.font = '18px "Sixtyfour", monospace';
      ctx.fillStyle = '#00ffff';
      ctx.textAlign = 'left';
      ctx.fillText(`${String(s.score).padStart(1,'0')}`, 8, 22);

      // Hi-score (top center)
      const hi = hiScoreRef.current;
      ctx.textAlign = 'center';
      ctx.fillStyle = s.score >= hi && hi > 0 ? '#ffff00' : 'rgba(0,220,220,0.65)';
      ctx.fillText(`${String(Math.max(hi, s.score)).padStart(1,'0')}`, W / 2, 22);

      ctx.textAlign = 'right';
      // Ship count
      for (let i = 0; i < s.lives; i++) {
        // hey! This is a smarter way of managing the x variable
        const lx = W - 20 - i * 36;
        ctx.fillStyle = '#00ffff';
        //body
        ctx.beginPath();
        ctx.moveTo(lx, 1);
        ctx.lineTo(lx+7,15);
        ctx.lineTo(lx+5,23);
        ctx.lineTo(lx-5,23);
        ctx.lineTo(lx-7,15);
        ctx.closePath();
        ctx.fill();
        //fins
        ctx.beginPath();
        ctx.moveTo(lx-7, 15);  ctx.lineTo(lx-15, 22); ctx.lineTo(lx-12, 11); ctx.closePath(); ctx.fill();
        ctx.beginPath();
        ctx.moveTo(lx+7, 15);  ctx.lineTo(lx+15, 22); ctx.lineTo(lx+12, 11); ctx.closePath(); ctx.fill();
      }

      // Bomb count
      ctx.textAlign = 'left';
      ctx.fillStyle = '#ffff44';
      ctx.font = '12px monospace';
      for (let i = 0; i < s.player.bombs; i++) {
        const b2b = i*22;
        ctx.beginPath();
        // body
        ctx.arc(10 + b2b, H - 20, 5, 0, Math.PI * 2);
        ctx.moveTo(15+b2b,H-20);
        ctx.lineTo(15+b2b,H-12);
        ctx.lineTo(5+b2b,H-12);
        ctx.lineTo(5+b2b,H-20);
        // fins
        ctx.moveTo(10+b2b,H-13);
        ctx.lineTo(15+b2b,H-8);
        ctx.lineTo(15+b2b,H-3);
        ctx.lineTo(10+b2b,H-8);
        ctx.lineTo(5+b2b,H-3);
        ctx.lineTo(5+b2b,H-8);
        ctx.lineTo(10+b2b,H-13);
        ctx.fill();
      }

      // Chain counter
      if (s.chain > 0) {
        const ca = Math.min(1, s.chainTimer / 80);
        ctx.globalAlpha = ca;
        ctx.fillStyle = '#ffff00';
        const chainPx = Math.round(10 * s.chainTextScale);
        ctx.font = `${chainPx}px Sixtyfour`;
        ctx.textAlign = 'center';
        ctx.fillText(`${s.chain} CHAIN!`, W / 2, H - 18);
        ctx.globalAlpha = 1;
      }

      // Fixed boss HP bar (top of screen, sweeps in from centre after warning)
      if (s.bossBarAnim > 0) {
        const boss = s.enemies.find(e => e.type === 'boss' && !e.dead);
        if (boss) {
          const t    = Math.max(0, boss.hp / boss.maxHp);
          const barW = W * 0.95;
          const barH = 16;
          const cx   = W / 2;
          const by   = 44;
          const prog  = Math.min(1, s.bossBarAnim / 40);
          const animW = barW * prog;
          const animX = cx - animW / 2;
          const alpha = Math.min(1, prog * 2.5);

          // Track + clipped HP fill
          ctx.save();
          ctx.globalAlpha = alpha;
          ctx.fillStyle = 'rgba(40,0,40,0.85)';
          ctx.fillRect(animX, by, animW, barH);
          ctx.beginPath();
          ctx.rect(animX, by, animW, barH);
          ctx.clip();
          ctx.fillStyle = `hsl(${t * 120},90%,50%)`;
          ctx.fillRect(cx - barW / 2, by, barW * t, barH);
          ctx.restore();

          // Border
          ctx.save();
          ctx.globalAlpha = alpha;
          ctx.strokeStyle = '#cc00cc';
          ctx.lineWidth = 1;
          ctx.strokeRect(animX, by, animW, barH);
          ctx.restore();
        }
      }

      // Boss warning overlay
      if (s.bossWarning > 0) {
        const blink   = Math.floor(s.frame / 5) % 2 === 0;
        const pulse   = 1 + Math.sin(s.frame * 0.28) * 0.055;
        const fadeIn  = Math.min(1, (210 - s.bossWarning) / 18);  // quick fade in
        ctx.save();
        ctx.textAlign = 'center';

        // Red glow behind text
        ctx.globalAlpha = fadeIn * (blink ? 0.95 : 0.22);
        ctx.shadowColor = '#ff0000';
        ctx.shadowBlur  = 40;
        ctx.font = `bold ${Math.round(46 * pulse)}px monospace`;
        ctx.fillStyle = '#ff1100';
        ctx.fillText('///WARNING///', W / 2, H / 2 - 14);

        // Secondary glow pass for extra intensity
        ctx.shadowBlur = 18;
        ctx.globalAlpha = fadeIn * (blink ? 0.5 : 0.1);
        ctx.fillText('///WARNING///', W / 2, H / 2 - 14);

        ctx.shadowBlur  = 0;
        ctx.globalAlpha = fadeIn * (blink ? 0.88 : 0.18);
        ctx.font = '15px monospace';
        ctx.fillStyle = '#ffaa00';
        ctx.fillText('BOSS  APPROACHING', W / 2, H / 2 + 22);

        ctx.restore();
      }

      // Wave label (hidden — uncomment to debug)
      // ctx.fillStyle = 'rgba(0,255,255,0.38)';
      // ctx.font = '11px monospace';
      // ctx.textAlign = 'right';
      // const wl = s.waveIdx === WAVES.length - 1 ? '!! BOSS !!' : `WAVE ${s.waveIdx + 1} / ${WAVES.length - 1}`;
      // ctx.fillText(wl, W - 8, H - 8);

      // Debug mode indicator
      if (debugMode) {
        ctx.font = 'bold 11px monospace';
        ctx.textAlign = 'right';
        ctx.fillStyle = '#ff4444';
        ctx.fillText('DEBUG MODE', W - 8, H - 8);
      }

      rafRef.current = requestAnimationFrame(loop);
    }

    rafRef.current = requestAnimationFrame(loop);

    return () => {
      running = false;
      Audio.stopMusic();
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [screen]);

  // Score calculation screen — sequenced per-element reveal with count-up animation
  useEffect(() => {
    if (screen !== 'score_calc') return;

    let cancelled = false;
    const timers = [];
    const rafIds = [];

    // Initialise all lines hidden
    setCalcLines(calcBonuses.map(() => ({
      labelVis: false, detailVis: false, detailNum: 0, ptsVis: false, ptsNum: 0,
    })));
    setCalcDisplayScore(finalScore);

    // Resolves after ms; always resolves so `await` unblocks (check cancelled after)
    const wait = ms => new Promise(resolve => {
      const id = setTimeout(resolve, ms);
      timers.push(id);
    });

    // Animates 0 → target over duration ms, calling onTick(value) each frame
    const countUp = (target, duration, onTick) => new Promise(resolve => {
      if (target === 0) { onTick(0); resolve(); return; }
      const t0 = performance.now();
      const tick = now => {
        if (cancelled) { resolve(); return; }
        const p  = Math.min(1, (now - t0) / duration);
        const ep = 1 - Math.pow(1 - p, 3);          // ease-out cubic
        onTick(Math.round(ep * target));
        if (p < 1) { rafIds.push(requestAnimationFrame(tick)); }
        else       { onTick(target); resolve(); }
      };
      rafIds.push(requestAnimationFrame(tick));
    });

    const setLine = (i, patch) =>
      setCalcLines(prev => prev.map((l, j) => j === i ? { ...l, ...patch } : l));

    const run = async () => {
      let runningScore = finalScore;
      await wait(600);                               // initial pause before first line

      for (let i = 0; i < calcBonuses.length; i++) {
        if (cancelled) return;
        const b = calcBonuses[i];

        // ① Label
        setLine(i, { labelVis: true });
        await wait(1000);
        if (cancelled) return;

        // ② Detail (count up the numeric part if present)
        setLine(i, { detailVis: true });
        if (b.detailCount != null && b.detailCount > 0) {
          await countUp(b.detailCount, 600, val => setLine(i, { detailNum: val }));
        }
        await wait(1000);
        if (cancelled) return;

        // ③ Points (count up pts AND overall score simultaneously)
        setLine(i, { ptsVis: true });
        if (b.pts > 0) {
          const base = runningScore;
          await countUp(b.pts, 800, val => {
            Audio.sfxScoreTally();
            setLine(i, { ptsNum: val });
            setCalcDisplayScore(base + val);
          });
          runningScore += b.pts;
        }
        await wait(1000);
        if (cancelled) return;
      }

      // All done — commit final score and transition
      setFinalScore(runningScore);
      setScreen(qualifiesForLeaderboard(runningScore) ? 'enter_initials' : 'leaderboard');
    };

    run();

    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
      rafIds.forEach(cancelAnimationFrame);
    };
  }, [screen]);

  // Title screen canvas background animation
  useEffect(() => {
    if (screen !== 'title') return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    const stars = Array.from({ length: 180 }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      vy: 0.35 + Math.random() * 2.8, r: Math.random() * 1.6 + 0.3,
      alpha: 0.2 + Math.random() * 0.8,
      hue: Math.random() < 0.12 ? 50 : (Math.random() < 0.18 ? 200 : 0),
    }));
    const buildings = makeBuildings();
    let frame = 0;
    let running = true;

    function drawTitle() {
      if (!running) return;

      ctx.fillStyle = '#00000e';
      ctx.fillRect(0, 0, W, H);

      buildings.forEach(b => {
        b.y += b.spd;
        if (b.y > H + b.h) b.y = -b.h;
        ctx.fillStyle = `hsla(${b.hue},60%,20%,${b.alpha})`;
        ctx.fillRect(b.x - b.w / 2, b.y - b.h, b.w, b.h);
      });

      ctx.strokeStyle = 'rgba(0,60,120,0.25)';
      ctx.lineWidth = 1;
      const gs = 44;
      const off = frame % gs;
      for (let y = -gs + off; y < H; y += gs) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
      }

      ctx.strokeStyle = 'rgba(0,40,80,0.15)';
      const doff = (frame * 0.3) % 80;
      for (let x = -W + doff; x < W * 2; x += 80) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + 110, H); ctx.stroke();
      }

      stars.forEach(st => {
        st.y += st.vy;
        if (st.y > H + 2) { st.y = -2; st.x = Math.random() * W; }
        const col = st.hue === 0 ? `rgba(255,255,255,${st.alpha})`
          : st.hue === 50  ? `rgba(255,220,100,${st.alpha})`
          : `rgba(100,190,255,${st.alpha})`;
        ctx.fillStyle = col;
        ctx.beginPath(); ctx.arc(st.x, st.y, st.r, 0, Math.PI * 2); ctx.fill();
      });

      frame++;
      rafRef.current = requestAnimationFrame(drawTitle);
    }

    rafRef.current = requestAnimationFrame(drawTitle);
    return () => { running = false; cancelAnimationFrame(rafRef.current); };
  }, [screen]);

  // Keep canvas hi-score ref in sync with leaderboard state
  useEffect(() => {
    hiScoreRef.current = leaderboard[0]?.score ?? 0;
  }, [leaderboard]);

  // Initials entry screen
  useEffect(() => {
    if (screen !== 'enter_initials') return;
    initialsRef.current = '';
    setInitialsDisplay('');

    const onKey = (e) => {
      const cur = initialsRef.current;
      if (e.key === 'Backspace') {
        const next = cur.slice(0, -1);
        initialsRef.current = next;
        setInitialsDisplay(next);
      } else if (/^[a-zA-Z]$/.test(e.key) && cur.length < 3) {
        const next = cur + e.key.toUpperCase();
        Audio.sfxBigExplosion();
        initialsRef.current = next;
        setInitialsDisplay(next);
      } else if (e.key === 'Enter' && cur.length === 3) {
        const scores = saveScore(cur, finalScore);
        Audio.sfxWaveClear;
        setLeaderboard(scores);
        setScreen('leaderboard');
      }
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [screen, finalScore]);


  const startGame = () => {
    keysRef.current = {};
    Audio.initAudio();
    Audio.startMusic(selectedTrackRef.current);
    setScreen('playing');
  };

  return (
    <div style={STYLES.wrapper}>
      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        style={STYLES.canvas}
      />

      {screen === 'title' && (
        <div style={STYLES.overlay}>
          <div style={{ fontFamily: 'Sixtyfour', fontSize: 40, color: '#E2DED7'}}>DoDonkPACHI</div>
          <div style={{ ...STYLES.sub, fontSize: 30, marginTop: -14, marginBottom: 18 }}>DATA STORM</div>
          <div style={{ fontSize: 24, color: '#aaeeff', letterSpacing: 3, opacity: 0.7, textDecoration: 'underline' }}>
            CONTROLS
          </div>
          <div style={{ ...STYLES.controls, marginTop: -8, marginBottom: 18 }}>
            <div>ARROWS / WASD — MOVE</div>
            <div>Z — SPREAD SHOT</div>
            <div>X — FOCUS SHOT</div>
            <div>SHIFT — BOMB (clears bullets)</div>
            <div>ESC / SPACE — PAUSE</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
            <button style={STYLES.btn} onClick={startGame}>
              PLAY
            </button>
            <button
              style={{ ...STYLES.btn, background: 'transparent', color: '#00ffff', border: '1px solid #00ffff55' }}
              onClick={() => { setIsWin(null); setScreen('leaderboard'); }}>
              LEADERBOARD
            </button>
          </div>
          <div style={{ ...STYLES.controls, fontSize: 14, marginTop: 18, marginBottom: 18 }}>
            <div>&copy; Andy Krueger 2026</div>
            <div>Music by DavidKBD, licenced under CC By 4.0 (https://creativecommons.org/licenses/by/4.0/)</div>
          </div>
          <div style={{ ...STYLES.controls, fontSize: 10, marginTop: 9, marginBottom: 0 }}>version 0.1.0</div>
        </div>
      )}

      {screen === 'score_calc' && (
        <div style={STYLES.overlay}>
          <div style={{ ...STYLES.title, color: '#ffff00', textShadow: '0 0 20px #ffaa00, 0 0 50px #ff8800' }}>
            ALL CLEAR!
          </div>
          <div style={STYLES.score}>{String(calcDisplayScore).padStart(1, '0')}</div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minWidth: 360 }}>
            {calcBonuses.map((bonus, i) => {
              const line = calcLines[i] ?? {};
              return (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontFamily: 'PixelifySans',
                    fontSize: 13,
                    letterSpacing: 1,
                    opacity: line.labelVis ? 1 : 0,
                    transition: 'opacity 0.2s ease',
                    minHeight: 22,
                  }}
                >
                  {/* Label */}
                  <span style={{ color: '#aaeeff', minWidth: 160 }}>{bonus.label}</span>

                  {/* Detail */}
                  <span style={{
                    color: '#667788', margin: '0 12px', minWidth: 110, textAlign: 'right',
                    opacity: line.detailVis ? 1 : 0, transition: 'opacity 0.15s ease',
                  }}>
                    {bonus.detailCount != null
                      ? `${line.detailNum} ${bonus.detailSuffix}`
                      : bonus.detailText}
                  </span>

                  {/* Points */}
                  <span style={{
                    color: bonus.pts > 0 ? '#ffff00' : '#445566',
                    minWidth: 100, textAlign: 'right',
                    opacity: line.ptsVis ? 1 : 0, transition: 'opacity 0.15s ease',
                  }}>
                    {bonus.pts > 0 ? `+${(line.ptsNum ?? 0).toLocaleString()}` : '---'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {screen === 'enter_initials' && (
        <div style={STYLES.overlay}>
          <div style={{
            ...STYLES.title,
            color: isWin ? '#ffff00' : '#ff4444',
            textShadow: isWin ? '0 0 20px #ffaa00' : '0 0 20px #ff0000',
          }}>
            {isWin ? 'ALL CLEAR!' : 'GAME OVER'}
          </div>
          <div style={STYLES.score}>{String(finalScore).padStart(1, '0')}</div>
          <div style={{ ...STYLES.sub, marginTop: -6 }}>ENTER YOUR INITIALS</div>

          <div style={{ display: 'flex', gap: 10 }}>
            {[0, 1, 2].map(i => {
              const active = i === initialsDisplay.length;
              return (
                <div key={i} style={{
                  width: 48, height: 60,
                  border: `2px solid ${active ? '#00ffff' : '#2a4455'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 34, fontFamily: 'Sixtyfour', color: '#fff', fontWeight: 'bold',
                  background: active ? 'rgba(0,255,255,0.08)' : 'rgba(0,0,0,0.3)',
                  boxShadow: active ? '0 0 12px rgba(0,255,255,0.4)' : 'none',
                }}>
                  {initialsDisplay[i] ?? (active ? '▮' : '')}
                </div>
              );
            })}
          </div>

          <div style={STYLES.controls}>
            BACKSPACE TO DELETE • ENTER TO CONFIRM
          </div>
        </div>
      )}

      {screen === 'leaderboard' && (() => {
        const hiEntry = leaderboard[0];
        return (
          <div style={{ ...STYLES.overlay, gap: 10 }}>
            <div style={{
              ...STYLES.title, fontSize: 28,
              color: isWin === null ? '#00ffff' : isWin ? '#ffff00' : '#ff4444',
              textShadow: isWin === null ? '0 0 16px #00ffff' : isWin ? '0 0 16px #ffaa00' : '0 0 16px #ff0000',
            }}>
              {isWin === null ? '— LEADERBOARD —' : isWin ? '★ ALL CLEAR! ★' : 'GAME OVER'}
            </div>

            <div style={{ fontFamily: 'PixelifySans', width: 400 }}>
              <div style={{
                color: '#00ffff', fontSize: 13, letterSpacing: 3,
                textAlign: 'center', marginBottom: 6, opacity: 0.8,
              }}>
                ── TOP PILOTS ──
              </div>
              {leaderboard.length === 0 && (
                <div style={{ color: '#445566', textAlign: 'left', fontSize: 14 }}>
                  NO RECORDS YET
                </div>
              )}
              {leaderboard.map((entry, i) => {
                const isPlayer = !!entry.isNew;
                return (
                  <div key={i} style={{
                    display: 'grid',
                    gridTemplateColumns: '80px auto auto',
                    padding: '8px 0px',
                    background: isPlayer ? 'rgba(0,255,180,0.12)' : 'transparent',
                    borderLeft: isPlayer ? '2px solid #00ffcc' : '2px solid transparent',
                    color: isPlayer ? '#00ffcc' : i === 0 ? '#ffee44' : '#7799aa',
                    fontSize: 24,
                    fontFamily: 'Sixtyfour'
                  }}>
                    <span style={{ opacity: 0.6, textAlign: 'left' }}>{i + 1}.</span>
                    <span style={{ fontWeight: 'bold', letterSpacing: 2 }}>{entry.initials}</span>
                    <span style={{ textAlign: 'right' }}>{String(entry.score).padStart(8, '0')}</span>
                  </div>
                );
              })}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
              <button style={STYLES.btn} onClick={startGame}>
                PLAY
              </button>
              <button
                style={{ ...STYLES.btn, background: 'transparent', color: '#00ffff', border: '1px solid #00ffff55' }}
                onClick={() => setScreen('title')}>
                TITLE SCREEN
              </button>
            </div>

          </div>
        );
      })()}
    </div>
  );
}
