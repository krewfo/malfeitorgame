// src/scenes/DreamScene.js
// Cena de sonho/flashback — DREAM-01: O Tribunal. 1280×720 cinematic.
// Cena linear sem controle do jogador. Câmera distorcida.
// Trigger: automático noite dos Dias 6-7 via DialogueSystem auto-trigger.
// Após o sonho terminar, retorna à taverna (quarto de Malfeitor).

import { getCtx } from '../engine/renderer.js';
import { W, H } from '../engine/renderer.js';
import { AudioManager } from '../engine/audio.js';
import { isActive as isDialogueActive } from '../ui/DialogueBox.js';
import { SceneManager } from './SceneManager.js';
import { TimeSystem } from '../systems/TimeSystem.js';
import { Atmosphere } from '../engine/atmosphere.js';

let _elapsed = 0;
let _dialogueStarted = false;

export const DreamScene = {
  enter(_player) {
    _elapsed = 0;
    _dialogueStarted = false;
    AudioManager.playMusic('mus_dream');
    Atmosphere.initParticles({ count: 50, color: 'rgba(200,164,248,0.08)', speedY: -2, embers: true, emberCount: 12 });
  },

  exit() {
    _elapsed = 0;
    _dialogueStarted = false;
    AudioManager.playMusic(TimeSystem.hour >= 18 ? 'mus_village_night' : 'mus_village_day');
    Atmosphere.clear();
  },

  update(dt, _player) {
    _elapsed += dt;
    Atmosphere.updateParticles(dt, { speedY: -2 });

    if (_dialogueStarted && !isDialogueActive()) {
      SceneManager.changeScene('tavern');
    }
    if (isDialogueActive()) {
      _dialogueStarted = true;
    }
  },

  render(_player) {
    const ctx = getCtx();

    // Seeded RNG for consistent procedural textures
    let _s = 77;
    const _rng = () => { _s = (_s * 16807 + 7) % 2147483647; return (_s & 0x7fffffff) / 0x7fffffff; };

    const wobble = Math.sin(_elapsed * 1.5) * 8;
    const pulse = Math.sin(_elapsed * 2) * 0.1;

    // ═══════════════════════════════════════════════════════════════
    // LAYER 0: VOID SKY — deep endless darkness above
    // ═══════════════════════════════════════════════════════════════
    ctx.fillStyle = '#060410';
    ctx.fillRect(0, 0, W, H);
    // Upper void gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, 200);
    skyGrad.addColorStop(0, '#020108');
    skyGrad.addColorStop(0.5, '#0A0620');
    skyGrad.addColorStop(1, '#0D0A2A');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, W, 200);

    // Ghostly stars/motes drifting in the void
    ctx.fillStyle = '#C8A4F8';
    for (let i = 0; i < 35; i++) {
      _rng();
      const sx = _rng() * W;
      const sy = _rng() * 160;
      const sa = 0.05 + Math.sin(_elapsed * (0.5 + _rng()) + i * 1.2) * 0.04;
      ctx.globalAlpha = sa;
      ctx.fillRect(sx, sy, 2, 2);
    }
    ctx.globalAlpha = 1;

    // ═══════════════════════════════════════════════════════════════
    // LAYER 1: BACK WALL — tribunal stone wall
    // ═══════════════════════════════════════════════════════════════
    ctx.fillStyle = '#14102A';
    ctx.fillRect(80, 60, W - 160, 350 + wobble);
    // Stone block texture
    ctx.fillStyle = '#1A1430';
    for (let by = 60; by < 400 + wobble; by += 28) {
      const offset = ((by - 60) / 28 % 2 === 0) ? 0 : 40;
      for (let bx = 82 + offset; bx < W - 82; bx += 80) {
        const bv = _rng() * 5 - 3;
        ctx.fillStyle = `rgb(${20 + bv},${16 + bv},${42 + bv})`;
        ctx.fillRect(bx, by, 78, 26);
        // Mortar lines
        ctx.fillStyle = '#0D0A1F';
        ctx.fillRect(bx, by, 78, 1);
        ctx.fillRect(bx, by, 1, 26);
      }
    }
    // Archway at top
    ctx.fillStyle = '#0D0A1F';
    ctx.fillRect(200, 58, W - 400, 6);
    ctx.fillStyle = '#1E1842';
    ctx.fillRect(202, 62, W - 404, 12);

    // ═══════════════════════════════════════════════════════════════
    // LAYER 2: TRIBUNAL FLOOR — distorted stone
    // ═══════════════════════════════════════════════════════════════
    ctx.fillStyle = '#12102A';
    ctx.fillRect(0, 400 + wobble, W, 320);
    // Individual floor tiles
    for (let fy = 400 + wobble; fy < H; fy += 40) {
      for (let fx = 0; fx < W; fx += 80) {
        const yOff = Math.sin(fx * 0.012 + _elapsed) * 3;
        const tv = _rng() * 6 - 3;
        ctx.fillStyle = `rgb(${18 + tv},${16 + tv},${38 + tv})`;
        ctx.fillRect(fx + 1, fy + yOff + 1, 78, 38);
        // Edge highlights
        ctx.fillStyle = 'rgba(200,164,248,0.02)';
        ctx.fillRect(fx + 1, fy + yOff + 1, 78, 1);
        ctx.fillRect(fx + 1, fy + yOff + 1, 1, 38);
      }
    }
    // Red carpet runner down center
    ctx.fillStyle = '#2A0A18';
    ctx.fillRect(440, 400 + wobble, 400, 320);
    ctx.fillStyle = '#3A0A20';
    ctx.fillRect(442, 400 + wobble, 396, 320);
    // Carpet border ornament
    ctx.fillStyle = '#D4AC0D';
    ctx.globalAlpha = 0.15;
    ctx.fillRect(440, 400 + wobble, 2, 320);
    ctx.fillRect(838, 400 + wobble, 2, 320);
    for (let cy = 400 + wobble; cy < H; cy += 40) {
      ctx.fillRect(445, cy, 6, 6);
      ctx.fillRect(829, cy, 6, 6);
    }
    ctx.globalAlpha = 1;

    // ═══════════════════════════════════════════════════════════════
    // LAYER 3: COLUNAS DO TRIBUNAL — gothic pillars
    // ═══════════════════════════════════════════════════════════════
    for (let i = 0; i < 4; i++) {
      const xOff = Math.sin(_elapsed * 0.8 + i * 0.5) * 4;
      // LEFT columns
      const lx = 160 + i * 100 + xOff;
      // Column base
      ctx.fillStyle = '#1E1A38';
      ctx.fillRect(lx - 8, 396 + wobble, 56, 14);
      ctx.fillStyle = '#2A2648';
      ctx.fillRect(lx - 4, 392 + wobble, 48, 8);
      // Column shaft
      ctx.fillStyle = '#2D2848';
      ctx.fillRect(lx, 120, 40, 276 + wobble);
      // Fluting
      ctx.fillStyle = '#24203E';
      ctx.fillRect(lx + 8, 120, 3, 276 + wobble);
      ctx.fillRect(lx + 18, 120, 3, 276 + wobble);
      ctx.fillRect(lx + 28, 120, 3, 276 + wobble);
      // Capital
      ctx.fillStyle = '#3A3458';
      ctx.fillRect(lx - 8, 112, 56, 12);
      ctx.fillStyle = '#D4AC0D';
      ctx.globalAlpha = 0.1;
      ctx.fillRect(lx - 4, 114, 48, 2);
      ctx.globalAlpha = 1;

      // RIGHT columns
      const rx = 920 + i * 100 + xOff;
      ctx.fillStyle = '#1E1A38';
      ctx.fillRect(rx - 8, 396 + wobble, 56, 14);
      ctx.fillStyle = '#2A2648';
      ctx.fillRect(rx - 4, 392 + wobble, 48, 8);
      ctx.fillStyle = '#2D2848';
      ctx.fillRect(rx, 120, 40, 276 + wobble);
      ctx.fillStyle = '#24203E';
      ctx.fillRect(rx + 8, 120, 3, 276 + wobble);
      ctx.fillRect(rx + 18, 120, 3, 276 + wobble);
      ctx.fillRect(rx + 28, 120, 3, 276 + wobble);
      ctx.fillStyle = '#3A3458';
      ctx.fillRect(rx - 8, 112, 56, 12);
      ctx.fillStyle = '#D4AC0D';
      ctx.globalAlpha = 0.1;
      ctx.fillRect(rx - 4, 114, 48, 2);
      ctx.globalAlpha = 1;
    }

    // ═══════════════════════════════════════════════════════════════
    // LAYER 4: TRONO REAL — elaborate throne
    // ═══════════════════════════════════════════════════════════════
    // Throne platform (raised dais)
    ctx.fillStyle = '#1E1842';
    ctx.fillRect(460, 310 + wobble * 0.3, 360, 100);
    ctx.fillStyle = '#2A2254';
    ctx.fillRect(464, 310 + wobble * 0.3, 352, 8);
    // Steps
    ctx.fillStyle = '#18143A';
    ctx.fillRect(480, 400 + wobble * 0.3, 320, 12);
    ctx.fillRect(500, 408 + wobble * 0.3, 280, 12);

    // Throne back
    ctx.fillStyle = '#3A1A50';
    ctx.fillRect(520, 70 + wobble * 0.3, 240, 250);
    // Inner panel
    ctx.fillStyle = '#461E60';
    ctx.fillRect(530, 90 + wobble * 0.3, 220, 100);
    // Ornate headboard
    ctx.fillStyle = '#5B2D8E';
    ctx.fillRect(530, 80 + wobble * 0.3, 220, 16);
    // Crown ornament top
    ctx.fillStyle = '#D4AC0D';
    ctx.globalAlpha = 0.4 + pulse;
    ctx.fillRect(596, 40 + wobble * 0.3, 88, 28);
    ctx.fillRect(604, 30 + wobble * 0.3, 8, 14);
    ctx.fillRect(668, 30 + wobble * 0.3, 8, 14);
    ctx.fillRect(632, 24 + wobble * 0.3, 16, 20);
    // Crown center gem
    ctx.fillStyle = '#8B5CE8';
    ctx.fillRect(636, 28 + wobble * 0.3, 8, 8);
    ctx.globalAlpha = 1;
    // Side gems
    ctx.fillStyle = '#8B5CE8';
    ctx.globalAlpha = 0.5;
    ctx.fillRect(616, 48 + wobble * 0.3, 8, 8);
    ctx.fillRect(656, 48 + wobble * 0.3, 8, 8);
    ctx.globalAlpha = 1;

    // Armrests
    ctx.fillStyle = '#3A1A50';
    ctx.fillRect(508, 220 + wobble * 0.3, 20, 60);
    ctx.fillRect(752, 220 + wobble * 0.3, 20, 60);
    ctx.fillStyle = '#D4AC0D';
    ctx.globalAlpha = 0.2;
    ctx.fillRect(510, 218 + wobble * 0.3, 16, 4);
    ctx.fillRect(754, 218 + wobble * 0.3, 16, 4);
    ctx.globalAlpha = 1;

    // ═══════════════════════════════════════════════════════════════
    // LAYER 5: SILHUETA DO REI — shadowed king figure
    // ═══════════════════════════════════════════════════════════════
    ctx.fillStyle = 'rgba(6, 4, 16, 0.85)';
    ctx.fillRect(580, 110 + wobble * 0.3, 120, 180);
    // Shoulders wider
    ctx.fillRect(560, 145 + wobble * 0.3, 160, 40);
    // Head
    ctx.fillRect(608, 90 + wobble * 0.3, 64, 60);
    // Subtle crown on silhouette
    ctx.fillStyle = '#D4AC0D';
    ctx.globalAlpha = 0.25 + Math.sin(_elapsed * 2) * 0.1;
    ctx.fillRect(612, 82 + wobble * 0.3, 56, 12);
    ctx.fillRect(620, 74 + wobble * 0.3, 8, 12);
    ctx.fillRect(652, 74 + wobble * 0.3, 8, 12);
    ctx.fillRect(636, 70 + wobble * 0.3, 8, 16);
    ctx.globalAlpha = 1;
    // Eyes — menacing glow
    ctx.fillStyle = '#D4AC0D';
    ctx.globalAlpha = 0.3 + Math.sin(_elapsed * 3) * 0.15;
    ctx.fillRect(620, 110 + wobble * 0.3, 6, 4);
    ctx.fillRect(648, 110 + wobble * 0.3, 6, 4);
    ctx.globalAlpha = 1;

    // ═══════════════════════════════════════════════════════════════
    // LAYER 6: VITRAIS — stained glass windows with light beams
    // ═══════════════════════════════════════════════════════════════
    const vitrais = [
      { x: 20, y: 100 }, { x: 20, y: 240 },
      { x: W - 72, y: 100 }, { x: W - 72, y: 240 },
    ];
    for (const v of vitrais) {
      // Window frame
      ctx.fillStyle = '#1A1430';
      ctx.fillRect(v.x - 4, v.y - 4, 56, 104);
      // Glass panels (multi-color)
      const colors = ['#C8A4F8', '#8B5CE8', '#6A3AAA', '#4A1688'];
      for (let p = 0; p < 4; p++) {
        ctx.fillStyle = colors[p];
        ctx.globalAlpha = 0.2 + Math.sin(_elapsed * 1.2 + v.x * 0.01 + p) * 0.06;
        ctx.fillRect(v.x, v.y + p * 24, 48, 22);
      }
      ctx.globalAlpha = 1;
      // Frame cross bars
      ctx.fillStyle = '#D4AC0D';
      ctx.globalAlpha = 0.2;
      ctx.fillRect(v.x - 2, v.y - 2, 52, 2);
      ctx.fillRect(v.x - 2, v.y + 98, 52, 2);
      ctx.fillRect(v.x + 22, v.y, 4, 96);
      ctx.fillRect(v.x, v.y + 46, 48, 4);
      ctx.globalAlpha = 1;

      // Light beam from each window
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 0.025 + Math.sin(_elapsed * 0.8 + v.x * 0.02) * 0.01;
      ctx.fillStyle = '#C8A4F8';
      const beamDir = v.x < W / 2 ? 1 : -1;
      for (let b = 0; b < 200; b += 4) {
        ctx.fillRect(v.x + 24 + beamDir * b, v.y + 10 + b * 1.5, 60 + b * 0.5, 4);
      }
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
    }

    // ═══════════════════════════════════════════════════════════════
    // LAYER 7: SILHUETA DO PAI DE KAEL — in chains
    // ═══════════════════════════════════════════════════════════════
    // Body
    ctx.fillStyle = '#2D3040';
    ctx.fillRect(240 + wobble * 0.5, 280, 56, 120);
    // Head
    ctx.fillRect(252 + wobble * 0.5, 250, 36, 36);
    // Bowed head shadow
    ctx.fillStyle = '#1A1828';
    ctx.fillRect(256 + wobble * 0.5, 258, 28, 14);
    // Arms extended (chained)
    ctx.fillStyle = '#2D3040';
    ctx.fillRect(218 + wobble * 0.5, 300, 26, 8);
    ctx.fillRect(292 + wobble * 0.5, 300, 26, 8);
    // Chains
    ctx.fillStyle = '#6B7280';
    for (let c = 0; c < 6; c++) {
      ctx.fillRect(210 + wobble * 0.5 - c * 8, 296 + c * 5, 6, 4);
      ctx.fillRect(320 + wobble * 0.5 + c * 8, 296 + c * 5, 6, 4);
    }
    // Chain anchors on floor
    ctx.fillStyle = '#4A4A5A';
    ctx.fillRect(160 + wobble * 0.5, 396 + wobble, 12, 8);
    ctx.fillRect(370 + wobble * 0.5, 396 + wobble, 12, 8);
    // Shadow on floor
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(220 + wobble * 0.5, 400 + wobble, 100, 20);

    // ═══════════════════════════════════════════════════════════════
    // LAYER 8: CANDELABROS E ILUMINAÇÃO
    // ═══════════════════════════════════════════════════════════════
    // Standing candelabras flanking throne
    for (const cx of [480, 800]) {
      // Stand
      ctx.fillStyle = '#3A3448';
      ctx.fillRect(cx, 200, 8, 200 + wobble * 0.3);
      ctx.fillRect(cx - 8, 396 + wobble * 0.3, 24, 6);
      // Candle holders (3 branches)
      ctx.fillRect(cx - 16, 196, 40, 4);
      // Candles
      ctx.fillStyle = '#D4C090';
      ctx.fillRect(cx - 14, 184, 6, 14);
      ctx.fillRect(cx + 1, 180, 6, 18);
      ctx.fillRect(cx + 18, 184, 6, 14);
      // Flames
      ctx.fillStyle = '#D4870A';
      ctx.globalAlpha = 0.7 + Math.sin(_elapsed * 6 + cx) * 0.2;
      ctx.fillRect(cx - 13, 178, 4, 8);
      ctx.fillRect(cx + 2, 174, 4, 8);
      ctx.fillRect(cx + 19, 178, 4, 8);
      ctx.fillStyle = '#FFD866';
      ctx.fillRect(cx - 12, 180, 2, 4);
      ctx.fillRect(cx + 3, 176, 2, 4);
      ctx.fillRect(cx + 20, 180, 2, 4);
      ctx.globalAlpha = 1;
    }

    // Lighting
    const lights = [
      // Throne glow
      { x: 640, y: 200, r: 280, color: [140, 92, 232], intensity: 0.08, flicker: 10 },
      // Left candelabra
      { x: 484, y: 180, r: 120, color: [212, 135, 10], intensity: 0.10, flicker: 12 },
      // Right candelabra
      { x: 804, y: 180, r: 120, color: [212, 135, 10], intensity: 0.10, flicker: 12 },
      // Vitral left beams
      { x: 60, y: 170, r: 160, color: [200, 164, 248], intensity: 0.04, flicker: 4 },
      // Vitral right beams
      { x: W - 48, y: 170, r: 160, color: [200, 164, 248], intensity: 0.04, flicker: 4 },
    ];
    Atmosphere.renderLights(ctx, lights, _elapsed);

    // God rays from above the throne
    Atmosphere.renderGodRays(ctx, _elapsed, {
      x: 640, y: 0, count: 5, length: 360, width: 30,
      color: '140,92,232', alpha: 0.025, angle: Math.PI / 2,
    });

    // ═══════════════════════════════════════════════════════════════
    // LAYER 9: ATMOSPHERE & OVERLAY
    // ═══════════════════════════════════════════════════════════════
    Atmosphere.renderParticles(ctx);

    // Heavy dream vignette
    const gradient = ctx.createRadialGradient(W / 2, H / 2, 80, W / 2, H / 2, W * 0.55);
    gradient.addColorStop(0, 'rgba(0,0,0,0)');
    gradient.addColorStop(0.4, 'rgba(0,0,0,0.25)');
    gradient.addColorStop(0.7, 'rgba(0,0,0,0.55)');
    gradient.addColorStop(1, 'rgba(0,0,0,0.92)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, W, H);

    // Purple mist
    Atmosphere.renderFog(ctx, _elapsed, {
      bands: 6, alpha: 0.04, color: '140,100,180', yStart: H * 0.3,
    });
    Atmosphere.renderGroundFog(ctx, _elapsed, {
      alpha: 0.06, color: '120,80,160', yStart: H * 0.55,
    });

    // Dream chromatic overlay
    Atmosphere.renderColorOverlay(ctx, '20,10,40', 0.15);

    // Dream distortion lines (horizontal scan)
    ctx.globalAlpha = 0.03;
    ctx.fillStyle = '#C8A4F8';
    const scanY = ((_elapsed * 60) % H);
    ctx.fillRect(0, scanY, W, 2);
    ctx.fillRect(0, scanY - H / 3, W, 1);
    ctx.fillRect(0, scanY + H / 3, W, 1);
    ctx.globalAlpha = 1;

    // "SONHO" pulsing text
    ctx.globalAlpha = 0.2 + Math.sin(_elapsed * 3) * 0.1;
    ctx.fillStyle = '#C8A4F8';
    ctx.font = '14px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('SONHO', W / 2, 26);
    ctx.globalAlpha = 1;
  },
};
