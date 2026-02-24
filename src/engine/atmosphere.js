// src/engine/atmosphere.js
// Sistema de efeitos atmosféricos cinematográficos para Canvas 2D.
// Névoa volumétrica, partículas, vinheta, iluminação com bloom,
// nuvens procedurais, raios de luz, ambient occlusion.
// Tudo renderizado proceduralmente — sem texturas externas.

import { W, H } from './renderer.js';

// ─── PARTÍCULAS DE POEIRA / FUMAÇA ─────────────────────────────────
const MAX_PARTICLES = 80;
let _particles = [];
// Embers (fagulhas)
let _embers = [];

function _spawnParticle(config) {
  return {
    x: Math.random() * W,
    y: Math.random() * H,
    vx: (Math.random() - 0.5) * (config.windX ?? 12),
    vy: -Math.random() * (config.riseSpeed ?? 8) - 2,
    size: Math.random() * (config.maxSize ?? 3) + 1,
    alpha: Math.random() * 0.18 + 0.02,
    life: Math.random() * (config.lifetime ?? 12) + 4,
    maxLife: 0,
    color: config.color ?? '#C8C8C8',
    type: Math.random() > 0.7 ? 'dust' : 'smoke',
  };
}

function _spawnEmber() {
  return {
    x: Math.random() * W,
    y: H + 10,
    vx: (Math.random() - 0.5) * 30,
    vy: -Math.random() * 40 - 20,
    size: Math.random() * 2 + 1,
    alpha: Math.random() * 0.6 + 0.3,
    life: Math.random() * 3 + 1,
    maxLife: 0,
    flicker: Math.random() * Math.PI * 2,
  };
}

// ─── NUVENS PROCEDURAIS ─────────────────────────────────────────────
// Nuvens são geradas com ruído simplex aproximado via senos sobrepostos
let _cloudSeed = [];
function _initClouds() {
  _cloudSeed = [];
  for (let i = 0; i < 12; i++) {
    _cloudSeed.push({
      x: Math.random() * W * 1.4 - W * 0.2,
      y: Math.random() * 80 + 10,
      w: Math.random() * 300 + 100,
      h: Math.random() * 40 + 15,
      speed: Math.random() * 3 + 1,
      alpha: Math.random() * 0.25 + 0.05,
      layers: Math.floor(Math.random() * 3) + 2,
    });
  }
}
_initClouds();

// ─── API PÚBLICA ─────────────────────────────────────────────────────
export const Atmosphere = {

  initParticles(config = {}) {
    const count = config.count ?? MAX_PARTICLES;
    _particles = [];
    for (let i = 0; i < count; i++) {
      const p = _spawnParticle(config);
      p.maxLife = p.life;
      _particles.push(p);
    }
    // Embers para cenas com fogo
    _embers = [];
    if (config.embers) {
      for (let i = 0; i < (config.emberCount ?? 15); i++) {
        const e = _spawnEmber();
        e.maxLife = e.life;
        _embers.push(e);
      }
    }
  },

  updateParticles(dt, config = {}) {
    for (const p of _particles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      // Drift lateral suave (vento)
      p.x += Math.sin(p.y * 0.01 + p.life) * 0.3;
      if (p.life <= 0 || p.y < -10 || p.x < -10 || p.x > W + 10) {
        Object.assign(p, _spawnParticle(config));
        p.y = H + 5;
        p.maxLife = p.life;
      }
    }
    for (const e of _embers) {
      e.x += e.vx * dt;
      e.y += e.vy * dt;
      e.vy -= 2 * dt; // gravidade inversa (sobe)
      e.vx += Math.sin(e.life * 3) * 5 * dt;
      e.life -= dt;
      e.flicker += dt * 12;
      if (e.life <= 0 || e.y < -20) {
        Object.assign(e, _spawnEmber());
        e.maxLife = e.life;
      }
    }
  },

  renderParticles(ctx) {
    for (const p of _particles) {
      const fadeRatio = Math.min(p.life / (p.maxLife * 0.3), 1);
      ctx.globalAlpha = p.alpha * fadeRatio;
      ctx.fillStyle = p.color;
      const s = Math.ceil(p.size);
      if (p.type === 'dust') {
        ctx.fillRect(Math.floor(p.x), Math.floor(p.y), s, s);
      } else {
        // Smoke — slightly larger, softer
        ctx.fillRect(Math.floor(p.x) - 1, Math.floor(p.y) - 1, s + 2, s + 2);
      }
    }
    // Embers — bright orange/yellow flicker
    for (const e of _embers) {
      const fadeRatio = Math.min(e.life / (e.maxLife * 0.4), 1);
      const flick = Math.sin(e.flicker) * 0.3 + 0.7;
      ctx.globalAlpha = e.alpha * fadeRatio * flick;
      ctx.fillStyle = flick > 0.85 ? '#FFD866' : '#D4870A';
      ctx.fillRect(Math.floor(e.x), Math.floor(e.y), Math.ceil(e.size), Math.ceil(e.size));
    }
    ctx.globalAlpha = 1;
  },

  /**
   * Renderiza nuvens procedurais animadas.
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} time - tempo acumulado
   * @param {object} opts - { yOffset, tint, alpha }
   */
  renderClouds(ctx, time, opts = {}) {
    const yOff = opts.yOffset ?? 0;
    const tintR = opts.tintR ?? 60;
    const tintG = opts.tintG ?? 45;
    const tintB = opts.tintB ?? 30;
    const baseAlpha = opts.alpha ?? 1.0;

    for (const c of _cloudSeed) {
      const cx = ((c.x + c.speed * time * 2) % (W + c.w * 2)) - c.w;
      for (let layer = 0; layer < c.layers; layer++) {
        const lOff = layer * 8;
        const lW = c.w - layer * 30;
        const lH = c.h - layer * 5;
        if (lW <= 0 || lH <= 0) continue;
        const a = (c.alpha - layer * 0.04) * baseAlpha;
        if (a <= 0) continue;
        ctx.globalAlpha = a;
        const shade = 20 + layer * 15;
        ctx.fillStyle = `rgb(${tintR + shade},${tintG + shade},${tintB + shade})`;
        ctx.fillRect(
          Math.floor(cx + lOff),
          Math.floor(c.y + yOff + layer * 3),
          Math.floor(lW),
          Math.floor(lH)
        );
      }
    }
    ctx.globalAlpha = 1;
  },

  /**
   * Renderiza névoa volumétrica com gradientes.
   */
  renderFog(ctx, time, opts = {}) {
    const alpha = opts.alpha ?? 0.06;
    const color = opts.color ?? '180, 200, 210';
    const bands = opts.bands ?? 5;
    const speed = opts.speed ?? 15;
    const yStart = opts.yStart ?? H * 0.4;

    for (let i = 0; i < bands; i++) {
      const yBase = yStart + i * (H * 0.1);
      const xOff = Math.sin(time * 0.3 + i * 1.7) * speed + Math.cos(time * 0.15 + i) * 10;
      const bandH = 50 + Math.sin(time * 0.5 + i * 2.1) * 16;
      const bandAlpha = alpha * (0.6 + Math.sin(time * 0.4 + i * 0.8) * 0.4);

      // Fog with gradient falloff
      const grad = ctx.createLinearGradient(0, yBase, 0, yBase + bandH);
      grad.addColorStop(0, `rgba(${color}, 0)`);
      grad.addColorStop(0.3, `rgba(${color}, 1)`);
      grad.addColorStop(0.7, `rgba(${color}, 1)`);
      grad.addColorStop(1, `rgba(${color}, 0)`);

      ctx.globalAlpha = bandAlpha;
      ctx.fillStyle = grad;
      ctx.fillRect(Math.floor(xOff - 60), Math.floor(yBase), W + 120, Math.floor(bandH));
    }
    ctx.globalAlpha = 1;
  },

  /**
   * Renderiza névoa de chão (ground fog) — mais densa embaixo.
   */
  renderGroundFog(ctx, time, opts = {}) {
    const alpha = opts.alpha ?? 0.08;
    const color = opts.color ?? '120,110,90';
    const yStart = opts.yStart ?? H * 0.6;

    const grad = ctx.createLinearGradient(0, yStart, 0, H);
    grad.addColorStop(0, `rgba(${color}, 0)`);
    grad.addColorStop(0.4, `rgba(${color}, 0.3)`);
    grad.addColorStop(1, `rgba(${color}, 0.6)`);

    ctx.globalAlpha = alpha + Math.sin(time * 0.3) * 0.02;
    ctx.fillStyle = grad;
    ctx.fillRect(0, Math.floor(yStart), W, H - yStart);

    // Wispy tendrils
    for (let i = 0; i < 6; i++) {
      const xOff = Math.sin(time * 0.2 + i * 2.3) * 40;
      const yy = yStart + 20 + i * 30;
      const ww = 200 + Math.sin(time * 0.4 + i) * 60;
      ctx.globalAlpha = alpha * 0.5;
      ctx.fillStyle = `rgba(${color}, 0.4)`;
      ctx.fillRect(
        Math.floor(i * 220 + xOff - 40),
        Math.floor(yy),
        Math.floor(ww),
        Math.floor(20 + Math.sin(time * 0.6 + i) * 8)
      );
    }
    ctx.globalAlpha = 1;
  },

  /**
   * Renderiza vinheta cinematográfica com bordas escuras.
   */
  renderVignette(ctx, intensity = 0.6) {
    const gradient = ctx.createRadialGradient(W / 2, H / 2, W * 0.2, W / 2, H / 2, W * 0.75);
    gradient.addColorStop(0, 'rgba(0,0,0,0)');
    gradient.addColorStop(0.5, `rgba(0,0,0,${intensity * 0.2})`);
    gradient.addColorStop(0.75, `rgba(0,0,0,${intensity * 0.5})`);
    gradient.addColorStop(1, `rgba(0,0,0,${intensity})`);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, W, H);
  },

  /**
   * Renderiza luzes pontuais com bloom multi-camada.
   * Cada luz projeta 3 gradientes sobrepostos para simular bloom.
   */
  renderLights(ctx, lights, time) {
    ctx.globalCompositeOperation = 'lighter';
    for (const l of lights) {
      const flickerAmt = l.flicker ?? 8;
      const baseR = l.radius ?? l.r ?? 100;
      const flickSpeed = l.flickSpeed ?? 4;
      const r = baseR + Math.sin(time * flickSpeed + l.x * 0.1) * flickerAmt
                      + Math.sin(time * 6.3 + l.y * 0.07) * (flickerAmt * 0.3);
      const alpha = (l.intensity ?? 0.15) + Math.sin(time * 3.5 + l.y * 0.05) * 0.02;
      const col = l.color ?? '#D4870A';

      // Layer 1: Core glow (small, bright)
      const grad1 = ctx.createRadialGradient(l.x, l.y, 0, l.x, l.y, r * 0.3);
      grad1.addColorStop(0, _colorWithAlpha(col, alpha * 1.5));
      grad1.addColorStop(0.5, _colorWithAlpha(col, alpha * 0.8));
      grad1.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad1;
      ctx.fillRect(l.x - r * 0.3, l.y - r * 0.3, r * 0.6, r * 0.6);

      // Layer 2: Main light spread
      const grad2 = ctx.createRadialGradient(l.x, l.y, 0, l.x, l.y, r);
      grad2.addColorStop(0, _colorWithAlpha(col, alpha * 0.6));
      grad2.addColorStop(0.3, _colorWithAlpha(col, alpha * 0.35));
      grad2.addColorStop(0.7, _colorWithAlpha(col, alpha * 0.1));
      grad2.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad2;
      ctx.fillRect(l.x - r, l.y - r, r * 2, r * 2);

      // Layer 3: Bloom halo (large, dim)
      const grad3 = ctx.createRadialGradient(l.x, l.y, r * 0.5, l.x, l.y, r * 1.6);
      grad3.addColorStop(0, _colorWithAlpha(col, alpha * 0.08));
      grad3.addColorStop(0.5, _colorWithAlpha(col, alpha * 0.03));
      grad3.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad3;
      ctx.fillRect(l.x - r * 1.6, l.y - r * 1.6, r * 3.2, r * 3.2);
    }
    ctx.globalCompositeOperation = 'source-over';
  },

  /**
   * Renderiza raios de luz diagonais (god rays).
   */
  renderGodRays(ctx, time, opts = {}) {
    const originX = opts.x ?? W * 0.3;
    const originY = opts.y ?? 0;
    const count = opts.count ?? 5;
    const alpha = opts.alpha ?? 0.03;
    const color = opts.color ?? '212,172,60';
    const spread = opts.spread ?? 0.4;

    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < count; i++) {
      const angle = -Math.PI / 2 + (i - count / 2) * spread / count;
      const rayAlpha = alpha * (0.5 + Math.sin(time * 0.5 + i * 1.3) * 0.5);
      const len = H * 1.2;
      const width = 30 + Math.sin(time * 0.3 + i * 2) * 10;

      ctx.save();
      ctx.translate(originX, originY);
      ctx.rotate(angle + Math.sin(time * 0.2 + i) * 0.02);
      ctx.globalAlpha = rayAlpha;

      const grad = ctx.createLinearGradient(0, 0, 0, len);
      grad.addColorStop(0, `rgba(${color}, 0.3)`);
      grad.addColorStop(0.3, `rgba(${color}, 0.15)`);
      grad.addColorStop(1, `rgba(${color}, 0)`);
      ctx.fillStyle = grad;
      ctx.fillRect(-width / 2, 0, width, len);

      ctx.restore();
    }
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
  },

  /**
   * Renderiza sombra elíptica sob os pés de uma entidade.
   */
  renderShadow(ctx, x, y, w = 48) {
    const h = Math.floor(w * 0.25);
    const grad = ctx.createRadialGradient(x, y, 0, x, y, w / 2);
    grad.addColorStop(0, 'rgba(0,0,0,0.4)');
    grad.addColorStop(0.6, 'rgba(0,0,0,0.2)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(x - w / 2, y - h / 2, w, h);
  },

  /**
   * Overlay de cor (mood lighting).
   */
  renderColorOverlay(ctx, color, alpha = 0.15) {
    ctx.globalAlpha = alpha;
    ctx.fillStyle = `rgba(${color}, 1)`;
    ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = 1;
  },

  /**
   * Renderiza céu dramático com gradiente, lua/sol e montanhas.
   */
  renderSky(ctx, time, opts = {}) {
    const isNight = opts.isNight ?? true;
    const skyH = opts.height ?? 200;

    // Sky gradient
    const grad = ctx.createLinearGradient(0, 0, 0, skyH);
    if (isNight) {
      grad.addColorStop(0, '#060510');
      grad.addColorStop(0.3, '#0E0C1F');
      grad.addColorStop(0.6, '#1A1530');
      grad.addColorStop(1, '#2A1F35');
    } else {
      grad.addColorStop(0, '#1A2A35');
      grad.addColorStop(0.3, '#2A3A45');
      grad.addColorStop(0.5, '#3A4A55');
      grad.addColorStop(1, '#4A5060');
    }
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, skyH);

    // Clouds
    this.renderClouds(ctx, time, {
      yOffset: 0, alpha: isNight ? 0.6 : 0.8,
      tintR: isNight ? 30 : 60, tintG: isNight ? 25 : 50, tintB: isNight ? 40 : 45,
    });

    // Moon/sun
    if (isNight) {
      const moonX = W * 0.35 + Math.sin(time * 0.05) * 10;
      const moonY = 50 + Math.sin(time * 0.03) * 3;
      // Moon glow
      const moonGlow = ctx.createRadialGradient(moonX, moonY, 5, moonX, moonY, 80);
      moonGlow.addColorStop(0, 'rgba(255,240,200,0.15)');
      moonGlow.addColorStop(0.3, 'rgba(255,220,160,0.06)');
      moonGlow.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = moonGlow;
      ctx.fillRect(moonX - 80, moonY - 80, 160, 160);
      // Moon disc
      ctx.fillStyle = '#E8D8B0';
      ctx.globalAlpha = 0.7;
      ctx.beginPath();
      ctx.arc(moonX, moonY, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    } else {
      // Dim sun behind clouds
      const sunX = W * 0.35;
      const sunY = 55;
      const sunGlow = ctx.createRadialGradient(sunX, sunY, 10, sunX, sunY, 120);
      sunGlow.addColorStop(0, 'rgba(212,172,40,0.2)');
      sunGlow.addColorStop(0.3, 'rgba(212,135,10,0.08)');
      sunGlow.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = sunGlow;
      ctx.fillRect(sunX - 120, sunY - 120, 240, 240);
    }

    // Stars (night only)
    if (isNight) {
      const stars = [
        [80,12],[180,35],[310,18],[450,42],[580,8],[720,30],[850,22],
        [950,45],[1080,15],[1180,38],[140,55],[400,60],[700,52],[1020,58],
        [250,25],[630,40],[900,10],[1150,48],
      ];
      for (const [sx, sy] of stars) {
        ctx.globalAlpha = 0.2 + Math.sin(time * 2 + sx * 0.5 + sy) * 0.15;
        ctx.fillStyle = '#F5E6C8';
        const ss = (sx * sy) % 3 === 0 ? 2 : 1;
        ctx.fillRect(sx, sy, ss, ss);
      }
      ctx.globalAlpha = 1;
    }

    // Mountains silhouette
    const mtColor = isNight ? '#0C0A18' : '#1A1A2A';
    ctx.fillStyle = mtColor;
    const mts = [
      [0, skyH - 30, 200, 40], [140, skyH - 50, 180, 60],
      [280, skyH - 35, 220, 45], [460, skyH - 60, 250, 70],
      [660, skyH - 40, 200, 50], [820, skyH - 55, 230, 65],
      [1010, skyH - 30, 200, 40], [1120, skyH - 45, 200, 55],
    ];
    for (const [mx, my, mw, mh] of mts) {
      // Simple triangle-ish mountains using rects
      for (let row = 0; row < mh; row++) {
        const ratio = row / mh;
        const rw = mw * (0.3 + ratio * 0.7);
        ctx.fillRect(
          Math.floor(mx + (mw - rw) / 2),
          Math.floor(my + row),
          Math.floor(rw),
          2
        );
      }
    }
  },

  /**
   * Renderiza chão de pedras (cobblestone) procedural.
   */
  renderCobblestone(ctx, opts = {}) {
    const yStart = opts.yStart ?? 200;
    const baseColor = opts.baseColor ?? [50, 45, 38];
    const seed = opts.seed ?? 42;

    // Base dark ground
    ctx.fillStyle = `rgb(${baseColor[0] - 15},${baseColor[1] - 15},${baseColor[2] - 12})`;
    ctx.fillRect(0, yStart, W, H - yStart);

    // Procedural stones
    const stoneW = opts.stoneW ?? 32;
    const stoneH = opts.stoneH ?? 24;
    let _s = seed;
    const _rng = () => { _s = (_s * 16807 + 7) % 2147483647; return (_s & 0x7fffffff) / 0x7fffffff; };

    for (let gy = yStart; gy < H; gy += stoneH) {
      const rowOff = (Math.floor(gy / stoneH) % 2) * (stoneW / 2);
      for (let gx = -stoneW; gx < W + stoneW; gx += stoneW) {
        const sx = gx + rowOff + (_rng() - 0.5) * 4;
        const sy = gy + (_rng() - 0.5) * 3;
        const sw = stoneW - 3 + (_rng() - 0.5) * 4;
        const sh = stoneH - 3 + (_rng() - 0.5) * 3;
        const brightness = _rng() * 20 - 10;

        // Stone body
        ctx.fillStyle = `rgb(${baseColor[0] + brightness},${baseColor[1] + brightness},${baseColor[2] + brightness - 3})`;
        ctx.fillRect(Math.floor(sx), Math.floor(sy), Math.floor(sw), Math.floor(sh));

        // Light edge (top-left)
        ctx.fillStyle = `rgba(200,180,140,${0.05 + _rng() * 0.04})`;
        ctx.fillRect(Math.floor(sx), Math.floor(sy), Math.floor(sw), 2);
        ctx.fillRect(Math.floor(sx), Math.floor(sy), 2, Math.floor(sh));

        // Dark edge (bottom-right crack)
        ctx.fillStyle = `rgba(0,0,0,${0.15 + _rng() * 0.1})`;
        ctx.fillRect(Math.floor(sx), Math.floor(sy + sh - 1), Math.floor(sw), 1);
        ctx.fillRect(Math.floor(sx + sw - 1), Math.floor(sy), 1, Math.floor(sh));
      }
    }
  },

  /**
   * Desenha lanterna na parede.
   */
  renderLantern(ctx, x, y, time) {
    // Bracket
    ctx.fillStyle = '#3A2A18';
    ctx.fillRect(x, y, 4, 12);
    ctx.fillRect(x - 4, y + 4, 12, 4);
    // Lantern body
    ctx.fillStyle = '#2C1A0E';
    ctx.fillRect(x - 3, y + 10, 10, 16);
    // Glass
    ctx.fillStyle = '#D4870A';
    ctx.globalAlpha = 0.5 + Math.sin(time * 5 + x) * 0.2;
    ctx.fillRect(x - 1, y + 12, 6, 12);
    ctx.globalAlpha = 1;
    // Top
    ctx.fillStyle = '#1A0F08';
    ctx.fillRect(x - 4, y + 8, 12, 3);
    ctx.fillRect(x - 2, y + 26, 8, 2);
  },

  /**
   * Desenha árvore morta.
   */
  renderDeadTree(ctx, x, y, scale = 1) {
    const s = scale;
    // Trunk
    ctx.fillStyle = '#1A1210';
    ctx.fillRect(x, y - 120 * s, 16 * s, 120 * s);
    ctx.fillStyle = '#221A14';
    ctx.fillRect(x + 4 * s, y - 120 * s, 8 * s, 120 * s);
    // Main branches
    const branches = [
      [-60, -100, 50, 6], [30, -110, 55, 5],
      [-40, -80, 35, 5], [25, -70, 40, 5],
      [-70, -95, 20, 4], [50, -105, 25, 4],
      [-30, -60, 25, 4], [40, -55, 30, 4],
    ];
    ctx.fillStyle = '#1A1210';
    for (const [bx, by, bw, bh] of branches) {
      ctx.fillRect(
        Math.floor(x + bx * s),
        Math.floor(y + by * s),
        Math.floor(bw * s),
        Math.floor(bh * s)
      );
    }
    // Twigs
    ctx.fillStyle = '#150E0A';
    const twigs = [
      [-80, -105, 15, 2], [65, -115, 18, 2],
      [-55, -92, 12, 2], [55, -68, 14, 2],
      [-45, -75, 10, 2], [60, -100, 12, 2],
    ];
    for (const [tx, ty, tw, th] of twigs) {
      ctx.fillRect(
        Math.floor(x + tx * s),
        Math.floor(y + ty * s),
        Math.floor(tw * s),
        Math.floor(th * s)
      );
    }
    // Roots
    ctx.fillStyle = '#1A1210';
    ctx.fillRect(x - 12 * s, y - 4 * s, 40 * s, 8 * s);
    ctx.fillRect(x - 8 * s, y, 10 * s, 6 * s);
    ctx.fillRect(x + 14 * s, y, 10 * s, 6 * s);
  },

  /**
   * Desenha lápide / gravestone.
   */
  renderGravestone(ctx, x, y, variant = 0) {
    ctx.fillStyle = '#3A3A40';
    if (variant === 0) {
      // Rounded top
      ctx.fillRect(x, y, 20, 30);
      ctx.fillRect(x + 2, y - 6, 16, 8);
      ctx.fillRect(x + 4, y - 10, 12, 6);
    } else if (variant === 1) {
      // Cross
      ctx.fillRect(x + 4, y - 20, 12, 50);
      ctx.fillRect(x - 2, y - 10, 24, 8);
    } else {
      // Tilted slab
      ctx.fillRect(x + 2, y, 18, 26);
      ctx.fillRect(x + 4, y - 4, 14, 6);
    }
    // Moss
    ctx.fillStyle = '#1A3A2E';
    ctx.globalAlpha = 0.4;
    ctx.fillRect(x + 2, y + 20, 16, 6);
    ctx.globalAlpha = 1;
    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.fillRect(x + 4, y + 28, 22, 4);
  },

  /**
   * Desenha corvo / raven.
   */
  renderCrow(ctx, x, y, time) {
    const bob = Math.sin(time * 1.5) * 1;
    const yy = y + bob;
    // Body
    ctx.fillStyle = '#0D0A0A';
    ctx.fillRect(x, yy, 14, 8);
    // Head
    ctx.fillRect(x + 10, yy - 4, 8, 8);
    // Beak
    ctx.fillStyle = '#5A4A30';
    ctx.fillRect(x + 18, yy - 2, 5, 3);
    // Eye
    ctx.fillStyle = '#C8A060';
    ctx.fillRect(x + 14, yy - 2, 2, 2);
    // Tail
    ctx.fillStyle = '#0D0A0A';
    ctx.fillRect(x - 6, yy + 1, 8, 4);
    ctx.fillRect(x - 8, yy + 3, 4, 3);
    // Wings (folded)
    ctx.fillStyle = '#1A1418';
    ctx.fillRect(x + 1, yy - 2, 12, 3);
  },

  /**
   * Limpa estado ao sair de cena.
   */
  clear() {
    _particles = [];
    _embers = [];
  },
};

function _colorWithAlpha(c, alpha) {
  if (Array.isArray(c)) return `rgba(${c[0]},${c[1]},${c[2]},${alpha})`;
  const r = parseInt(c.slice(1, 3), 16);
  const g = parseInt(c.slice(3, 5), 16);
  const b = parseInt(c.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}
