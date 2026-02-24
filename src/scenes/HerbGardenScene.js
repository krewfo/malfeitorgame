// src/scenes/HerbGardenScene.js
// Jardim de ervas — local de Davi. 1280×720 cinematic.
// Davi presente Dias 4–7, 6h–18h.
// Saída: norte → town_square.

import { Davi } from '../actors/Davi.js';
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
  { x: 0,    y: 0,   w: 520,  h: 32 },     // norte esquerda
  { x: 760,  y: 0,   w: 520,  h: 32 },     // norte direita
  { x: 0,    y: 0,   w: 32,   h: 720 },     // oeste
  { x: 1248, y: 0,   w: 32,   h: 720 },     // leste
  { x: 0,    y: 688, w: 1280, h: 32 },      // sul
  // Canteiros de ervas
  { x: 120,  y: 160, w: 240,  h: 80 },
  { x: 120,  y: 320, w: 240,  h: 80 },
  { x: 120,  y: 480, w: 240,  h: 80 },
  { x: 920,  y: 160, w: 240,  h: 80 },
  { x: 920,  y: 320, w: 240,  h: 80 },
  { x: 920,  y: 480, w: 240,  h: 80 },
  // Mesa de trabalho
  { x: 560,  y: 560, w: 160,  h: 64 },
];

// Zona de saída
const EXIT = { x: 520, y: 0, w: 240, h: 96, target: 'town_square' };

let _davi = null;
let _npcs = [];
let _elapsed = 0;

export const HerbGardenScene = {
  enter(player) {
    _elapsed = 0;
    if (player.y <= 40) {
      player.x = 640;
      player.y = 80;
    }

    _davi = new Davi(560, 440);
    _davi.schedule = [
      { start: 6, end: 18, location: 'herb_garden' },
      { start: 18, end: 23, location: 'home' },
    ];

    _npcs = [_davi];

    AudioManager.playMusic(TimeSystem.hour >= 18 ? 'mus_village_night' : 'mus_village_day');

    Atmosphere.initParticles({ count: 35, color: 'rgba(140,180,100,0.12)', speedY: -5 });
    _updateVisibility();
  },

  exit() {
    _npcs = [];
    _davi = null;
    Atmosphere.clear();
  },

  update(dt, player) {
    _elapsed += dt;
    if (isDialogueActive()) return;

    Atmosphere.updateParticles(dt, { speedY: -5 });

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
          const triggerId = findProximityTrigger(npc.id, 'herb_garden', TimeSystem.day);
          if (triggerId) {
            startDialogue(triggerId).then(() => save());
          } else {
            _showIdleDialogue(npc.id);
          }
          break;
        }
      }
    }

    const ph = player.getHitbox();
    if (_overlaps(ph, EXIT)) {
      player.y = 560;
      player.x = 640;
      SceneManager.changeScene(EXIT.target);
    }

    _updateVisibility();
  },

  render(player) {
    const ctx = getCtx();
    const isNight = TimeSystem.hour >= 18 || TimeSystem.hour < 6;

    // ═══════════════════════════════════════════════════════════════
    // LAYER 0: CÉU COM COPA DE ÁRVORES
    // ═══════════════════════════════════════════════════════════════
    Atmosphere.renderSky(ctx, _elapsed, { isNight, height: 100 });

    // Tree canopy overhanging from edges
    ctx.fillStyle = isNight ? '#060D08' : '#0D2518';
    // Left canopy layers
    ctx.fillRect(0, 30, 240, 60);
    ctx.fillRect(0, 20, 180, 20);
    ctx.fillRect(20, 10, 120, 15);
    // Right canopy
    ctx.fillRect(1040, 30, 240, 60);
    ctx.fillRect(1100, 20, 180, 20);
    ctx.fillRect(1140, 10, 100, 15);
    // Middle canopy
    ctx.fillStyle = isNight ? '#081210' : '#102A1C';
    ctx.fillRect(280, 35, 200, 45);
    ctx.fillRect(780, 38, 220, 42);
    // Leaf detail
    ctx.fillStyle = isNight ? '#0A1A10' : '#163822';
    for (let i = 0; i < 20; i++) {
      const lx = (i * 117 + 30) % (W - 40);
      const ly = 40 + (i * 13) % 30;
      ctx.fillRect(lx, ly, 12 + (i % 3) * 4, 8);
    }

    // ═══════════════════════════════════════════════════════════════
    // LAYER 1: CHÃO — terra rica e grama
    // ═══════════════════════════════════════════════════════════════
    // Base earth
    ctx.fillStyle = isNight ? '#0D1A12' : '#142E1E';
    ctx.fillRect(0, 80, W, H - 80);

    // Grass variation patches
    ctx.fillStyle = isNight ? '#0A1610' : '#1A3A24';
    let _s = 55;
    const _rng = () => { _s = (_s * 16807 + 7) % 2147483647; return (_s & 0x7fffffff) / 0x7fffffff; };
    for (let gy = 90; gy < H - 40; gy += 20) {
      for (let gx = 40; gx < W - 40; gx += 30) {
        const b = _rng() * 8 - 4;
        ctx.fillStyle = isNight
          ? `rgb(${10 + b},${22 + b},${16 + b})`
          : `rgb(${20 + b},${46 + b},${30 + b})`;
        ctx.fillRect(gx, gy, 28, 18);
      }
    }

    // Grass tufts (scattered)
    ctx.fillStyle = isNight ? '#0E2218' : '#1A4A2A';
    for (let i = 0; i < 30; i++) {
      _rng();
      const gx = _rng() * (W - 80) + 40;
      const gy = _rng() * (H - 160) + 100;
      ctx.fillRect(gx, gy, 2, 5 + _rng() * 4);
      ctx.fillRect(gx + 3, gy + 1, 2, 4 + _rng() * 3);
      ctx.fillRect(gx - 2, gy + 2, 2, 3 + _rng() * 3);
    }

    // ═══════════════════════════════════════════════════════════════
    // LAYER 2: CAMINHOS DE TERRA
    // ═══════════════════════════════════════════════════════════════
    ctx.fillStyle = isNight ? '#1E1610' : '#3A2A18';
    ctx.fillRect(360, 32, 160, H - 64);
    ctx.fillRect(760, 32, 160, H - 64);
    ctx.fillRect(32, 260, W - 64, 40);
    ctx.fillRect(32, 420, W - 64, 40);

    // Dirt texture
    ctx.fillStyle = isNight ? '#2A2018' : '#4A3A28';
    for (let px = 362; px < 518; px += 20) {
      for (let py = 40; py < H - 40; py += 18) {
        if (_rng() > 0.6) {
          ctx.fillRect(px + _rng() * 8, py + _rng() * 6, 3 + _rng() * 4, 2);
        }
      }
    }
    // Small pebbles
    ctx.fillStyle = isNight ? '#3A3430' : '#5A5040';
    for (let i = 0; i < 15; i++) {
      ctx.fillRect(370 + _rng() * 140, 50 + _rng() * (H - 100), 3, 2);
      ctx.fillRect(770 + _rng() * 140, 50 + _rng() * (H - 100), 3, 2);
    }

    // ═══════════════════════════════════════════════════════════════
    // LAYER 3: CANTEIROS DE ERVAS (muito mais detalhados)
    // ═══════════════════════════════════════════════════════════════
    const herbs = [
      { x: 120, y: 160, color: '#2D8B6A', accent: '#4A9E6F', flowerColor: '#D4870A' },
      { x: 120, y: 320, color: '#1A5A3E', accent: '#2D6B4A', flowerColor: '#8B5CE8' },
      { x: 120, y: 480, color: '#2D8B6A', accent: '#3A7A5A', flowerColor: '#D44A0A' },
      { x: 920, y: 160, color: '#4A9E6F', accent: '#5AB87A', flowerColor: '#D4AC0D' },
      { x: 920, y: 320, color: '#1A5A3E', accent: '#2D6B4A', flowerColor: '#4A7CBF' },
      { x: 920, y: 480, color: '#2D8B6A', accent: '#4A9E6F', flowerColor: '#D4870A' },
    ];

    for (const h of herbs) {
      // Shadow underneath
      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      ctx.fillRect(h.x + 6, h.y + 82, 236, 8);
      // Wooden raised bed frame
      ctx.fillStyle = '#3D2215';
      ctx.fillRect(h.x - 6, h.y - 6, 252, 92);
      ctx.fillStyle = '#4A2E18';
      ctx.fillRect(h.x - 6, h.y - 6, 252, 4);
      // Inner corner posts
      ctx.fillStyle = '#2C1A0E';
      ctx.fillRect(h.x - 6, h.y - 6, 6, 92);
      ctx.fillRect(h.x + 240, h.y - 6, 6, 92);
      // Rich soil
      ctx.fillStyle = '#1E1208';
      ctx.fillRect(h.x, h.y, 240, 80);
      // Soil texture
      ctx.fillStyle = '#2A1A10';
      for (let sx = h.x + 4; sx < h.x + 236; sx += 16) {
        for (let sy = h.y + 4; sy < h.y + 76; sy += 12) {
          ctx.fillRect(sx + _rng() * 4, sy + _rng() * 4, 4 + _rng() * 6, 2);
        }
      }

      // Plants (more varied)
      for (let i = 0; i < 7; i++) {
        const px = h.x + 8 + i * 33;
        const sway = Math.sin(_elapsed * 1.2 + px * 0.1 + h.y * 0.01) * 1;
        // Stem
        ctx.fillStyle = h.color;
        ctx.fillRect(px + 8 + sway, h.y + 18, 3, 44);
        // Branch stems
        ctx.fillRect(px + 4 + sway, h.y + 28, 8, 2);
        ctx.fillRect(px + 10 + sway, h.y + 38, 8, 2);
        // Leaves (multi-layered)
        ctx.fillStyle = h.accent;
        ctx.fillRect(px + sway, h.y + 10, 18, 10);
        ctx.fillRect(px + 2 + sway, h.y + 22, 14, 8);
        ctx.fillRect(px - 2 + sway, h.y + 34, 10, 8);
        ctx.fillRect(px + 12 + sway, h.y + 36, 10, 6);
        // Flower/fruit
        if (i % 2 === 0) {
          ctx.fillStyle = h.flowerColor;
          ctx.fillRect(px + 5 + sway, h.y + 6, 8, 6);
          ctx.fillStyle = '#FFD866';
          ctx.fillRect(px + 7 + sway, h.y + 7, 3, 3);
        }
      }
    }

    // ═══════════════════════════════════════════════════════════════
    // LAYER 4: MESA DE TRABALHO (detalhada)
    // ═══════════════════════════════════════════════════════════════
    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.fillRect(566, 626, 148, 8);
    // Legs
    ctx.fillStyle = '#2C1A0E';
    ctx.fillRect(566, 604, 8, 24);
    ctx.fillRect(706, 604, 8, 24);
    ctx.fillRect(566, 608, 148, 3);
    // Table top
    ctx.fillStyle = '#3D2215';
    ctx.fillRect(556, 556, 168, 50);
    ctx.fillStyle = '#4A2E18';
    ctx.fillRect(556, 552, 168, 6);
    // Wood grain
    ctx.fillStyle = 'rgba(60,40,20,0.08)';
    ctx.fillRect(565, 565, 100, 1);
    ctx.fillRect(570, 580, 90, 1);
    // Items on table
    // Herb bundles
    ctx.fillStyle = '#2D8B6A';
    ctx.fillRect(575, 562, 22, 10);
    ctx.fillStyle = '#1A5A3E';
    ctx.fillRect(600, 564, 18, 8);
    // Mortar & pestle
    ctx.fillStyle = '#5A5A5A';
    ctx.fillRect(635, 560, 18, 18);
    ctx.fillStyle = '#4A4A4A';
    ctx.fillRect(639, 564, 10, 10);
    ctx.fillStyle = '#6B6B6B';
    ctx.fillRect(648, 556, 4, 14);
    // Bottles/vials
    ctx.fillStyle = '#5A1A1A';
    ctx.fillRect(670, 558, 8, 20);
    ctx.fillRect(670, 556, 4, 4);
    ctx.fillStyle = '#1A4A3A';
    ctx.fillRect(682, 560, 8, 18);
    ctx.fillRect(682, 558, 4, 4);
    ctx.fillStyle = '#3A1A50';
    ctx.fillRect(694, 558, 8, 18);
    ctx.fillRect(694, 556, 4, 4);
    // Cutting board
    ctx.fillStyle = '#4A3A20';
    ctx.fillRect(706, 564, 14, 10);

    // ═══════════════════════════════════════════════════════════════
    // LAYER 5: BORDAS / CERCA DE MADEIRA (detalhada)
    // ═══════════════════════════════════════════════════════════════
    ctx.fillStyle = isNight ? '#0D1A12' : '#142E1E';
    ctx.fillRect(0, 0, 520, 32);
    ctx.fillRect(760, 0, 520, 32);
    ctx.fillRect(0, 0, 32, H);
    ctx.fillRect(W - 32, 0, 32, H);
    ctx.fillRect(0, 688, W, 32);

    // Detailed wooden fence
    ctx.fillStyle = '#3D2215';
    // Horizontal rails
    ctx.fillRect(40, 14, 478, 4);
    ctx.fillRect(40, 26, 478, 4);
    ctx.fillRect(762, 14, 478, 4);
    ctx.fillRect(762, 26, 478, 4);
    // Vertical posts
    for (let x = 40; x < 520; x += 50) {
      ctx.fillRect(x, 8, 8, 26);
      ctx.fillStyle = '#4A2E18';
      ctx.fillRect(x, 6, 8, 4);
      ctx.fillStyle = '#3D2215';
    }
    for (let x = 762; x < W - 36; x += 50) {
      ctx.fillRect(x, 8, 8, 26);
      ctx.fillStyle = '#4A2E18';
      ctx.fillRect(x, 6, 8, 4);
      ctx.fillStyle = '#3D2215';
    }

    // Gate opening north
    ctx.fillStyle = isNight ? '#1E1610' : '#3A2A18';
    ctx.fillRect(520, 0, 240, 32);
    // Gate posts
    ctx.fillStyle = '#3D2215';
    ctx.fillRect(516, 4, 10, 30);
    ctx.fillRect(754, 4, 10, 30);
    ctx.fillStyle = '#4A2E18';
    ctx.fillRect(516, 2, 10, 4);
    ctx.fillRect(754, 2, 10, 4);

    // ═══════════════════════════════════════════════════════════════
    // LAYER 6: ILUMINAÇÃO
    // ═══════════════════════════════════════════════════════════════
    const lights = isNight ? [
      { x: 640, y: 570, r: 180, color: [212, 135, 10], intensity: 0.18, flicker: 8 },
    ] : [
      // Dappled sunlight through canopy
      { x: 400, y: 250, r: 200, color: [200, 190, 120], intensity: 0.08, flicker: 3 },
      { x: 800, y: 350, r: 180, color: [200, 180, 110], intensity: 0.07, flicker: 3 },
      { x: 640, y: 500, r: 220, color: [180, 170, 100], intensity: 0.06, flicker: 2 },
    ];
    Atmosphere.renderLights(ctx, lights, _elapsed);

    if (!isNight) {
      // Dappled sunlight patches (light filtering through leaves)
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 8; i++) {
        const dx = 100 + i * 160 + Math.sin(_elapsed * 0.3 + i * 1.5) * 10;
        const dy = 150 + (i * 83) % 400;
        const dr = 30 + Math.sin(_elapsed * 0.5 + i) * 8;
        ctx.globalAlpha = 0.02 + Math.sin(_elapsed * 0.4 + i * 2) * 0.01;
        ctx.fillStyle = 'rgb(180,170,100)';
        ctx.fillRect(dx - dr, dy - dr / 2, dr * 2, dr);
      }
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
    }

    // Label
    ctx.fillStyle = '#F5E6C8';
    ctx.font = '10px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.globalAlpha = 0.6;
    ctx.fillText('↑ PRAÇA', 640, 18);
    ctx.globalAlpha = 1;

    // ═══════════════════════════════════════════════════════════════
    // LAYER 7: ENTIDADES Z-SORTED
    // ═══════════════════════════════════════════════════════════════
    const entities = [player, ..._npcs.filter(n => n.visible)];
    entities.sort((a, b) => a.y - b.y);
    for (const e of entities) {
      e.render(ctx);
    }

    // ═══════════════════════════════════════════════════════════════
    // LAYER 8: FOREGROUND
    // ═══════════════════════════════════════════════════════════════
    Atmosphere.renderParticles(ctx);
    Atmosphere.renderFog(ctx, _elapsed, {
      bands: 4, alpha: isNight ? 0.04 : 0.025, color: '70,100,60', yStart: H * 0.4,
    });
    Atmosphere.renderGroundFog(ctx, _elapsed, {
      alpha: isNight ? 0.05 : 0.02, color: '80,100,70', yStart: H * 0.65,
    });
    Atmosphere.renderVignette(ctx, isNight ? 0.6 : 0.45);

    if (isNight) {
      Atmosphere.renderColorOverlay(ctx, '8,18,12', 0.2);
    } else {
      Atmosphere.renderColorOverlay(ctx, '20,30,15', 0.05);
    }
  },
};

function _updateVisibility() {
  if (_davi) {
    const day = TimeSystem.day;
    const hour = TimeSystem.hour;
    _davi.visible = day >= 4 && hour >= 6 && hour < 18;
  }
}

function _overlaps(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x &&
         a.y < b.y + b.h && a.y + a.h > b.y;
}

const _IDLE_LINES = {
  davi: ['(Examina uma planta com atenção.)', 'Hmm... Não agora.', '(Cheira uma erva e franze o nariz.)'],
};
let _lastIdleTime = 0;
function _showIdleDialogue(npcId) {
  const now = Date.now();
  if (now - _lastIdleTime < 3000) return;
  _lastIdleTime = now;
  const lines = _IDLE_LINES[npcId] ?? ['...'];
  const text = lines[Math.floor(Math.random() * lines.length)];
  const box = document.getElementById('dialogue-box');
  const nameEl = document.getElementById('npc-name');
  const textEl = document.getElementById('dialogue-text');
  document.getElementById('options-container').innerHTML = '';
  nameEl.textContent = npcId.toUpperCase();
  nameEl.style.color = '#9CA3AF';
  textEl.textContent = text;
  box.style.borderColor = '#374151';
  box.classList.remove('hidden');
  setTimeout(() => { box.classList.add('hidden'); }, 2200);
}
