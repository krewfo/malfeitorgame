// src/scenes/ChurchScene.js
// Igreja de Crestfall — local de Aldric. 1280×720 cinematic.
// Aldric presente sempre, exceto Quarta manhã (missa — não interativo).
// Saída: oeste → town_square.

import { Aldric } from '../actors/Aldric.js';
import { getCtx } from '../engine/renderer.js';
import { W, H } from '../engine/renderer.js';
import { interactPressed } from '../engine/input.js';
import { TimeSystem } from '../systems/TimeSystem.js';
import { findProximityTrigger } from '../systems/DialogueSystem.js';
import { startDialogue, isActive as isDialogueActive } from '../ui/DialogueBox.js';
import { save } from '../engine/save.js';
import { SceneManager } from './SceneManager.js';
import { AudioManager } from '../engine/audio.js';
import { setTarget } from '../ui/TrustPanel.js';
import { Atmosphere } from '../engine/atmosphere.js';

// Colliders (1280×720)
const COLLIDERS = [
  { x: 0,    y: 0,   w: 1280, h: 48 },    // parede norte
  { x: 0,    y: 0,   w: 32,   h: 280 },    // parede oeste superior
  { x: 0,    y: 440, w: 32,   h: 280 },    // parede oeste inferior
  { x: 1248, y: 0,   w: 32,   h: 720 },    // parede leste
  { x: 0,    y: 680, w: 1280, h: 40 },     // parede sul
  // Altar
  { x: 520,  y: 64,  w: 240,  h: 80 },
  // Bancos
  { x: 240,  y: 240, w: 160,  h: 32 },
  { x: 240,  y: 320, w: 160,  h: 32 },
  { x: 240,  y: 400, w: 160,  h: 32 },
  { x: 880,  y: 240, w: 160,  h: 32 },
  { x: 880,  y: 320, w: 160,  h: 32 },
  { x: 880,  y: 400, w: 160,  h: 32 },
];

// Zona de saída
const EXIT = { x: 0, y: 280, w: 32, h: 160, target: 'town_square' };

let _aldric = null;
let _npcs = [];
let _elapsed = 0;

export const ChurchScene = {
  enter(player) {
    _elapsed = 0;
    if (player.x <= 40) {
      player.x = 80;
      player.y = 360;
    }

    _aldric = new Aldric(640, 360);
    _aldric.schedule = [
      { start: 7, end: 11, location: 'church', days: [3], label: 'missa' },
      { start: 7, end: 12, location: 'church' },
      { start: 12, end: 18, location: 'church_or_walk' },
      { start: 18, end: 22, location: 'church' },
    ];

    _npcs = [_aldric];

    AudioManager.playMusic(TimeSystem.hour >= 18 ? 'mus_village_night' : 'mus_village_day');

    Atmosphere.initParticles({ count: 25, color: 'rgba(200,180,220,0.1)', speedY: -3 });
    _updateVisibility();
  },

  exit() {
    _npcs = [];
    _aldric = null;
    Atmosphere.clear();
  },

  update(dt, player) {
    _elapsed += dt;
    if (isDialogueActive()) return;

    Atmosphere.updateParticles(dt, { speedY: -3 });

    const allColliders = [...COLLIDERS, ..._npcs.filter(n => n.visible).map(n => n.getHitbox())];
    player.update(dt, allColliders);

    for (const npc of _npcs) {
      npc.update(dt, player);
    }

    let nearNpc = null;
    for (const npc of _npcs) {
      if (npc.visible && npc.isPlayerNear(player) && npc.canInteract() === true) { nearNpc = npc.id; break; }
    }
    setTarget(nearNpc);

    if (interactPressed()) {
      for (const npc of _npcs) {
        if (npc.visible && npc.isPlayerNear(player) && npc.canInteract() === true) {
          if (npc.id === 'aldric' && TimeSystem.dayOfWeek === 3 && TimeSystem.hour < 11) {
            break;
          }
          const triggerId = findProximityTrigger(npc.id, 'church', TimeSystem.day);
          if (triggerId) {
            startDialogue(triggerId).then(() => save());
          }
          break;
        }
      }
    }

    const ph = player.getHitbox();
    if (_overlaps(ph, EXIT)) {
      player.x = 1160;
      player.y = 360;
      SceneManager.changeScene(EXIT.target);
    }

    _updateVisibility();
  },

  render(player) {
    const ctx = getCtx();

    // ═══════════════════════════════════════════════════════════════
    // LAYER 0: CHÃO DE PEDRA FRIA — ladrilhos individuais
    // ═══════════════════════════════════════════════════════════════
    ctx.fillStyle = '#20252E';
    ctx.fillRect(0, 0, W, H);

    // Individual stone tiles
    let _s = 31;
    const _rng = () => { _s = (_s * 16807 + 7) % 2147483647; return (_s & 0x7fffffff) / 0x7fffffff; };
    for (let ty = 0; ty < H; ty += 64) {
      for (let tx = 0; tx < W; tx += 64) {
        const bright = _rng() * 10 - 5;
        ctx.fillStyle = `rgb(${35 + bright},${40 + bright},${50 + bright})`;
        ctx.fillRect(tx + 1, ty + 1, 62, 62);
        // Crack details
        ctx.fillStyle = `rgba(0,0,0,0.08)`;
        ctx.fillRect(tx + 63, ty, 1, 64);
        ctx.fillRect(tx, ty + 63, 64, 1);
        // Light edge
        ctx.fillStyle = `rgba(160,160,180,0.04)`;
        ctx.fillRect(tx + 1, ty + 1, 62, 1);
        ctx.fillRect(tx + 1, ty + 1, 1, 62);
      }
    }

    // ═══════════════════════════════════════════════════════════════
    // LAYER 1: CORREDOR CENTRAL — carpete vermelho detalhado
    // ═══════════════════════════════════════════════════════════════
    ctx.fillStyle = '#2E0808';
    ctx.fillRect(560, 140, 160, 540);
    // Pattern on carpet
    ctx.fillStyle = '#3A0E0E';
    for (let cy = 140; cy < 680; cy += 30) {
      ctx.fillRect(570, cy, 140, 14);
    }
    // Gold border
    ctx.fillStyle = '#D4AC0D';
    ctx.fillRect(557, 140, 4, 540);
    ctx.fillRect(719, 140, 4, 540);
    // Inner gold pattern
    ctx.fillStyle = '#B8960A';
    ctx.globalAlpha = 0.3;
    for (let cy = 150; cy < 680; cy += 60) {
      ctx.fillRect(564, cy, 152, 2);
      // Diamond pattern
      ctx.fillRect(630, cy - 8, 20, 20);
    }
    ctx.globalAlpha = 1;
    // Carpet fringe at bottom
    ctx.fillStyle = '#D4AC0D';
    for (let fx = 562; fx < 718; fx += 8) {
      ctx.fillRect(fx, 676, 4, 8);
    }

    // ═══════════════════════════════════════════════════════════════
    // LAYER 2: PAREDES — pedra com textura detalhada
    // ═══════════════════════════════════════════════════════════════
    ctx.fillStyle = '#161A24';
    ctx.fillRect(0, 0, W, 48);
    ctx.fillRect(0, 0, 32, 280);
    ctx.fillRect(0, 440, 32, 280);
    ctx.fillRect(W - 32, 0, 32, H);
    ctx.fillRect(0, 680, W, 40);
    // Stone block texture
    ctx.fillStyle = '#1C2028';
    for (let wy = 0; wy < 48; wy += 18) {
      const off = (Math.floor(wy / 18) % 2) * 30;
      for (let wx = off; wx < W; wx += 60) {
        ctx.fillRect(wx + 1, wy + 1, 58, 16);
      }
    }

    // ═══════════════════════════════════════════════════════════════
    // LAYER 3: PORTA OESTE — arco de pedra
    // ═══════════════════════════════════════════════════════════════
    ctx.fillStyle = '#3D2215';
    ctx.fillRect(0, 280, 32, 160);
    // Stone arch
    ctx.fillStyle = '#3A3440';
    ctx.fillRect(0, 272, 38, 8);
    ctx.fillRect(0, 440, 38, 8);
    ctx.fillRect(32, 276, 6, 168);
    // Light from outside
    const doorGrad = ctx.createLinearGradient(32, 340, 140, 340);
    doorGrad.addColorStop(0, 'rgba(245,230,200,0.06)');
    doorGrad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = doorGrad;
    ctx.fillRect(32, 280, 110, 160);

    // ═══════════════════════════════════════════════════════════════
    // LAYER 4: ALTAR — detalhado com ornamentos
    // ═══════════════════════════════════════════════════════════════
    // Raised platform
    ctx.fillStyle = '#3A3440';
    ctx.fillRect(480, 130, 320, 20);
    ctx.fillRect(490, 126, 300, 6);
    // Altar table
    ctx.fillStyle = '#B8A888';
    ctx.fillRect(516, 60, 248, 72);
    // Front panel
    ctx.fillStyle = '#A89878';
    ctx.fillRect(516, 80, 248, 52);
    // Panel detail (cross embossed)
    ctx.fillStyle = '#C8B898';
    ctx.fillRect(624, 86, 32, 40);
    ctx.fillRect(612, 100, 56, 12);
    // White cloth draping over
    ctx.fillStyle = '#F5E6C8';
    ctx.fillRect(520, 56, 240, 8);
    ctx.fillStyle = '#E8D8B8';
    ctx.fillRect(520, 56, 240, 2);
    // Cloth overhangs
    ctx.fillRect(516, 56, 8, 20);
    ctx.fillRect(756, 56, 8, 20);

    // Grand cross (larger, ornate)
    ctx.fillStyle = '#D4AC0D';
    ctx.fillRect(626, 16, 28, 48);
    ctx.fillRect(610, 32, 60, 14);
    // Cross detail
    ctx.fillStyle = '#B8960A';
    ctx.fillRect(634, 20, 12, 40);
    ctx.fillRect(614, 36, 52, 6);
    // Gems on cross
    ctx.fillStyle = '#8B5CE8';
    ctx.fillRect(636, 22, 8, 8);
    ctx.fillStyle = '#5A1A1A';
    ctx.fillRect(616, 36, 6, 6);
    ctx.fillRect(658, 36, 6, 6);

    // Altar candles (6 total with flames)
    const altarCandles = [528, 556, 584, 696, 724, 752];
    for (const cx of altarCandles) {
      ctx.fillStyle = '#E8D8B8';
      ctx.fillRect(cx, 36, 6, 24);
      // Flame
      ctx.fillStyle = '#D4870A';
      ctx.globalAlpha = 0.7 + Math.sin(_elapsed * 5 + cx) * 0.2;
      ctx.fillRect(cx + 1, 30, 4, 7);
      ctx.fillStyle = '#FFD866';
      ctx.globalAlpha = 0.5 + Math.sin(_elapsed * 7 + cx * 0.5) * 0.2;
      ctx.fillRect(cx + 1, 32, 2, 3);
      ctx.globalAlpha = 1;
    }

    // ═══════════════════════════════════════════════════════════════
    // LAYER 5: BANCOS — mais detalhados
    // ═══════════════════════════════════════════════════════════════
    const benchRows = [
      { x: 240, y: 240 }, { x: 240, y: 320 }, { x: 240, y: 400 },
      { x: 880, y: 240 }, { x: 880, y: 320 }, { x: 880, y: 400 },
    ];
    for (const b of benchRows) {
      // Shadow
      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      ctx.fillRect(b.x + 4, b.y + 34, 156, 6);
      // Seat
      ctx.fillStyle = '#2C1A0E';
      ctx.fillRect(b.x, b.y, 160, 32);
      ctx.fillStyle = '#3D2215';
      ctx.fillRect(b.x, b.y, 160, 5);
      // Wood grain
      ctx.fillStyle = 'rgba(60,40,20,0.08)';
      ctx.fillRect(b.x + 10, b.y + 12, 100, 1);
      ctx.fillRect(b.x + 15, b.y + 22, 80, 1);
      // Back rest
      ctx.fillStyle = '#2C1A0E';
      ctx.fillRect(b.x, b.y - 12, 4, 44);
      ctx.fillRect(b.x + 156, b.y - 12, 4, 44);
      ctx.fillRect(b.x + 40, b.y - 10, 3, 10);
      ctx.fillRect(b.x + 80, b.y - 10, 3, 10);
      ctx.fillRect(b.x + 120, b.y - 10, 3, 10);
      // Top rail
      ctx.fillStyle = '#3D2215';
      ctx.fillRect(b.x - 1, b.y - 14, 162, 4);
    }

    // ═══════════════════════════════════════════════════════════════
    // LAYER 6: COLUNAS GÓTICAS
    // ═══════════════════════════════════════════════════════════════
    for (let i = 0; i < 4; i++) {
      const cy = 180 + i * 100;
      for (const colX of [160, 1080]) {
        // Column shaft
        ctx.fillStyle = '#3A4450';
        ctx.fillRect(colX, cy, 40, 60);
        // Fluting detail
        ctx.fillStyle = '#444F5A';
        ctx.fillRect(colX + 8, cy + 4, 4, 52);
        ctx.fillRect(colX + 18, cy + 4, 4, 52);
        ctx.fillRect(colX + 28, cy + 4, 4, 52);
        // Capital (top cap)
        ctx.fillStyle = '#4A5560';
        ctx.fillRect(colX - 4, cy - 6, 48, 10);
        ctx.fillRect(colX - 2, cy - 10, 44, 6);
        // Base
        ctx.fillRect(colX - 4, cy + 56, 48, 10);
        ctx.fillRect(colX - 2, cy + 64, 44, 6);
        // Shadow on floor
        ctx.fillStyle = 'rgba(0,0,0,0.15)';
        ctx.fillRect(colX + 10, cy + 70, 30, 6);
      }
    }

    // ═══════════════════════════════════════════════════════════════
    // LAYER 7: VITRAIS — detalhados com padrões
    // ═══════════════════════════════════════════════════════════════
    const vitrais = [
      { x: 200, y: 2, w: 56, h: 44, colors: ['#5B2D8E', '#7B4DB8', '#3A1A60'] },
      { x: 420, y: 2, w: 56, h: 44, colors: ['#1A3A6B', '#2A5A9B', '#0D2040'] },
      { x: 720, y: 2, w: 56, h: 44, colors: ['#5B2D8E', '#7B4DB8', '#3A1A60'] },
      { x: 1020, y: 2, w: 56, h: 44, colors: ['#1A3A6B', '#2A5A9B', '#0D2040'] },
    ];
    for (const v of vitrais) {
      // Arch shape (simplified)
      ctx.fillStyle = v.colors[0];
      ctx.fillRect(v.x, v.y + 8, v.w, v.h - 8);
      ctx.fillStyle = v.colors[1];
      ctx.fillRect(v.x + 4, v.y + 4, v.w - 8, 6);
      // Stained glass pattern
      ctx.fillStyle = v.colors[2];
      ctx.fillRect(v.x + v.w / 2 - 1, v.y + 8, 2, v.h - 12);
      ctx.fillRect(v.x + 4, v.y + v.h / 2, v.w - 8, 2);
      // Inner glow panels
      ctx.fillStyle = v.colors[1];
      ctx.globalAlpha = 0.3;
      ctx.fillRect(v.x + 4, v.y + 10, v.w / 2 - 5, v.h / 2 - 6);
      ctx.fillRect(v.x + v.w / 2 + 1, v.y + v.h / 2 + 2, v.w / 2 - 5, v.h / 2 - 8);
      ctx.globalAlpha = 1;
      // Gold frame
      ctx.fillStyle = '#D4AC0D';
      ctx.fillRect(v.x - 2, v.y, 2, v.h);
      ctx.fillRect(v.x + v.w, v.y, 2, v.h);
      ctx.fillRect(v.x - 2, v.y - 2, v.w + 4, 2);
      ctx.fillRect(v.x - 2, v.y + v.h, v.w + 4, 2);

      // Light beam from vitral onto floor
      ctx.fillStyle = v.colors[0];
      ctx.globalAlpha = 0.04 + Math.sin(_elapsed * 0.8 + v.x * 0.01) * 0.015;
      ctx.fillRect(v.x - 30, 48, v.w + 60, 160);
      ctx.globalAlpha = 1;
    }

    // ═══════════════════════════════════════════════════════════════
    // LAYER 8: ILUMINAÇÃO CINEMATOGRÁFICA
    // ═══════════════════════════════════════════════════════════════
    const lights = [
      // Altar candles
      { x: 640, y: 50, r: 220, color: [212, 172, 13], intensity: 0.2, flicker: 8 },
      // Individual altar candle pools
      { x: 540, y: 40, r: 60, color: [212, 160, 30], intensity: 0.1, flicker: 10 },
      { x: 740, y: 40, r: 60, color: [212, 160, 30], intensity: 0.1, flicker: 10 },
      // Column-side lights
      { x: 200, y: 300, r: 140, color: [180, 140, 80], intensity: 0.1, flicker: 5 },
      { x: 1080, y: 300, r: 140, color: [180, 140, 80], intensity: 0.1, flicker: 5 },
      // Door light
      { x: 30, y: 360, r: 100, color: [200, 190, 160], intensity: 0.06, flicker: 2 },
    ];
    Atmosphere.renderLights(ctx, lights, _elapsed);

    // God rays from vitral direction
    Atmosphere.renderGodRays(ctx, _elapsed, {
      x: W * 0.5, y: 0, count: 3, alpha: 0.01, color: '140,100,180', spread: 0.3,
    });

    // Label
    ctx.fillStyle = '#F5E6C8';
    ctx.font = '10px "Press Start 2P", monospace';
    ctx.textAlign = 'left';
    ctx.globalAlpha = 0.6;
    ctx.fillText('← PRAÇA', 8, 366);
    ctx.globalAlpha = 1;

    // ═══════════════════════════════════════════════════════════════
    // LAYER 9: ENTIDADES Z-SORTED
    // ═══════════════════════════════════════════════════════════════
    const entities = [player, ..._npcs.filter(n => n.visible)];
    entities.sort((a, b) => a.y - b.y);
    for (const e of entities) {
      e.render(ctx);
    }

    // ═══════════════════════════════════════════════════════════════
    // LAYER 10: FOREGROUND
    // ═══════════════════════════════════════════════════════════════
    Atmosphere.renderParticles(ctx);
    Atmosphere.renderFog(ctx, _elapsed, {
      bands: 4, alpha: 0.03, color: '120,110,140', yStart: H * 0.25,
    });
    Atmosphere.renderVignette(ctx, 0.65);
    // Mystical purple tint
    Atmosphere.renderColorOverlay(ctx, '20,15,35', 0.08);
  },
};

function _updateVisibility() {
  if (_aldric) {
    const hour = TimeSystem.hour;
    _aldric.visible = hour >= 7 && hour < 22;
  }
}

function _overlaps(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x &&
         a.y < b.y + b.h && a.y + a.h > b.y;
}
