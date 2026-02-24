// src/scenes/TavernScene.js
// Cena da taverna — primeiro local do jogo. 1280×720 cinematic.
// Gareth presente de 6h–23h.
// Saída: porta sul → town_square.

import { Gareth } from '../actors/Gareth.js';
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

// Colliders estáticos (1280×720)
const COLLIDERS = [
  // Paredes
  { x: 0,    y: 0,   w: 1280, h: 64 },    // parede norte
  { x: 0,    y: 0,   w: 32,   h: 720 },    // parede oeste
  { x: 1248, y: 0,   w: 32,   h: 720 },    // parede leste
  { x: 0,    y: 680, w: 560,  h: 40 },     // parede sul esquerda
  { x: 720,  y: 680, w: 560,  h: 40 },     // parede sul direita
  // Balcão
  { x: 720,  y: 200, w: 240,  h: 48 },
  // Mesas
  { x: 120,  y: 320, w: 96,   h: 64 },
  { x: 400,  y: 320, w: 96,   h: 64 },
  { x: 120,  y: 520, w: 96,   h: 64 },
  { x: 400,  y: 520, w: 96,   h: 64 },
];

// Zona de saída (porta sul)
const EXIT_ZONE = { x: 560, y: 680, w: 160, h: 40, target: 'town_square' };

let _gareth = null;
let _npcs = [];
let _elapsed = 0;

export const TavernScene = {
  enter(player) {
    _elapsed = 0;
    if (player.x < 40 || player.x > 1200) {
      player.x = 640;
      player.y = 580;
    }

    _gareth = new Gareth(800, 480);
    _gareth.schedule = [
      { start: 6, end: 11, location: 'tavern_kitchen' },
      { start: 11, end: 23, location: 'tavern_main' },
    ];
    _npcs = [_gareth];

    AudioManager.playMusic(TimeSystem.hour >= 18 ? 'mus_village_night' : 'mus_village_day');

    Atmosphere.initParticles({ count: 50, color: 'rgba(200,180,140,0.12)', speedY: -6, embers: true, emberCount: 10 });
    _updateNPCVisibility();
  },

  exit() {
    _npcs = [];
    _gareth = null;
    Atmosphere.clear();
  },

  update(dt, player) {
    _elapsed += dt;
    if (isDialogueActive()) return;

    Atmosphere.updateParticles(dt, { speedY: -6 });

    const allColliders = [...COLLIDERS, ..._npcs.filter(n => n.visible).map(n => n.getHitbox())];
    player.update(dt, allColliders);

    for (const npc of _npcs) {
      npc.update(dt, player);
    }

    let nearNpc = null;
    for (const npc of _npcs) {
      if (npc.visible && npc.isPlayerNear(player)) { nearNpc = npc.id; break; }
    }
    setTarget(nearNpc);

    if (interactPressed()) {
      for (const npc of _npcs) {
        if (npc.visible && npc.isPlayerNear(player) && npc.canInteract() === true) {
          const triggerId = findProximityTrigger(npc.id, 'tavern', TimeSystem.day);
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
    if (_overlaps(ph, EXIT_ZONE)) {
      player.x = 640;
      player.y = 80;
      SceneManager.changeScene(EXIT_ZONE.target);
    }

    _updateNPCVisibility();
  },

  render(player) {
    const ctx = getCtx();
    const isNight = TimeSystem.hour >= 18 || TimeSystem.hour < 6;

    // ═══════════════════════════════════════════════════════════════
    // LAYER 0: CHÃO DE MADEIRA DETALHADO
    // ═══════════════════════════════════════════════════════════════
    ctx.fillStyle = '#140C06';
    ctx.fillRect(0, 0, W, H);

    // Individual planks com variação de tom
    let _s = 77;
    const _rng = () => { _s = (_s * 16807 + 7) % 2147483647; return (_s & 0x7fffffff) / 0x7fffffff; };
    for (let py = 64; py < 680; py += 40) {
      for (let px = 32; px < W - 32; px += 120) {
        const bright = _rng() * 12 - 6;
        const r = 26 + bright, g = 17 + bright * 0.6, b = 10 + bright * 0.4;
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.fillRect(px, py, 118, 38);
        // Plank edge
        ctx.fillStyle = `rgba(0,0,0,0.15)`;
        ctx.fillRect(px, py + 37, 118, 2);
        ctx.fillRect(px + 117, py, 1, 38);
        // Wood grain
        ctx.fillStyle = `rgba(60,40,20,${0.08 + _rng() * 0.06})`;
        ctx.fillRect(px + 12, py + 8, 60, 1);
        ctx.fillRect(px + 20, py + 18, 50, 1);
        ctx.fillRect(px + 8, py + 28, 70, 1);
        // Knots
        if (_rng() > 0.85) {
          ctx.fillStyle = 'rgba(40,25,12,0.3)';
          ctx.fillRect(px + 40 + _rng() * 40, py + 10 + _rng() * 15, 6, 6);
        }
      }
    }

    // ═══════════════════════════════════════════════════════════════
    // LAYER 1: PAREDES COM TEXTURA
    // ═══════════════════════════════════════════════════════════════
    // Parede norte — pedra com lastra de madeira
    ctx.fillStyle = '#2A1A10';
    ctx.fillRect(0, 0, W, 64);
    // Stone texture on wall
    ctx.fillStyle = '#321F14';
    for (let bx = 0; bx < W; bx += 40) {
      const off = (Math.floor(bx / 40) % 2) * 20;
      ctx.fillRect(bx, off > 0 ? 4 : 0, 38, 28);
      ctx.fillRect(bx, 30, 38, 28);
    }
    // Wainscoting (boiserie)
    ctx.fillStyle = '#3D2215';
    ctx.fillRect(0, 48, W, 20);
    ctx.fillStyle = '#4A2E18';
    ctx.fillRect(0, 48, W, 4);
    // Panel details
    ctx.fillStyle = '#351C10';
    for (let px = 40; px < W - 40; px += 80) {
      ctx.fillRect(px, 52, 60, 12);
    }

    // Paredes laterais
    ctx.fillStyle = '#1E1208';
    ctx.fillRect(0, 0, 32, H);
    ctx.fillRect(W - 32, 0, 32, H);
    // Stone texture lateral
    ctx.fillStyle = '#281A0E';
    for (let wy = 0; wy < H; wy += 32) {
      ctx.fillRect(2, wy, 28, 30);
      ctx.fillRect(W - 30, wy, 28, 30);
    }
    // Horizontal beams
    ctx.fillStyle = '#3A2212';
    ctx.fillRect(0, 180, 32, 10);
    ctx.fillRect(0, 360, 32, 10);
    ctx.fillRect(0, 540, 32, 10);
    ctx.fillRect(W - 32, 180, 32, 10);
    ctx.fillRect(W - 32, 360, 32, 10);
    ctx.fillRect(W - 32, 540, 32, 10);

    // Sul — paredes com porta
    ctx.fillStyle = '#1E1208';
    ctx.fillRect(0, 680, 560, 40);
    ctx.fillRect(720, 680, 560, 40);

    // Porta — luz exterior sutil
    ctx.fillStyle = '#0D1520';
    ctx.fillRect(560, 680, 160, 40);
    ctx.fillStyle = 'rgba(245, 230, 200, 0.04)';
    ctx.fillRect(540, 650, 200, 70);
    // Door frame
    ctx.fillStyle = '#3D2215';
    ctx.fillRect(556, 678, 4, 42);
    ctx.fillRect(720, 678, 4, 42);
    ctx.fillRect(556, 676, 168, 4);

    // ═══════════════════════════════════════════════════════════════
    // LAYER 2: LAREIRA (parede norte, esquerda)
    // ═══════════════════════════════════════════════════════════════
    // Stone hearth
    ctx.fillStyle = '#3A3434';
    ctx.fillRect(80, 20, 140, 50);
    ctx.fillRect(70, 10, 160, 14);
    // Mantle
    ctx.fillStyle = '#3D2215';
    ctx.fillRect(65, 5, 170, 8);
    // Fire opening
    ctx.fillStyle = '#0A0605';
    ctx.fillRect(110, 30, 80, 40);
    // Fire glow
    ctx.fillStyle = '#D4870A';
    ctx.globalAlpha = 0.3 + Math.sin(_elapsed * 6) * 0.15;
    ctx.fillRect(115, 45, 30, 20);
    ctx.fillStyle = '#FF6600';
    ctx.globalAlpha = 0.2 + Math.sin(_elapsed * 8 + 1) * 0.1;
    ctx.fillRect(140, 50, 20, 15);
    ctx.fillStyle = '#FFD866';
    ctx.globalAlpha = 0.15 + Math.sin(_elapsed * 10 + 2) * 0.1;
    ctx.fillRect(125, 55, 10, 10);
    ctx.globalAlpha = 1;
    // Embers
    ctx.fillStyle = '#FF4400';
    ctx.globalAlpha = 0.4 + Math.sin(_elapsed * 7) * 0.3;
    ctx.fillRect(120 + Math.sin(_elapsed * 3) * 5, 40 - Math.abs(Math.sin(_elapsed * 2)) * 8, 2, 2);
    ctx.fillRect(145 + Math.sin(_elapsed * 4 + 1) * 4, 38 - Math.abs(Math.sin(_elapsed * 2.5)) * 10, 2, 2);
    ctx.globalAlpha = 1;

    // ═══════════════════════════════════════════════════════════════
    // LAYER 3: BALCÃO DETALHADO
    // ═══════════════════════════════════════════════════════════════
    ctx.fillStyle = '#3D2215';
    ctx.fillRect(720, 200, 240, 48);
    // Front panel detail
    ctx.fillStyle = '#321A0E';
    ctx.fillRect(724, 210, 232, 34);
    ctx.fillStyle = '#3A2012';
    for (let px = 730; px < 956; px += 48) {
      ctx.fillRect(px, 214, 40, 26);
    }
    // Polished top
    ctx.fillStyle = '#5C3A1E';
    ctx.fillRect(718, 192, 244, 12);
    // Highlight
    ctx.fillStyle = 'rgba(180, 140, 80, 0.1)';
    ctx.fillRect(720, 194, 240, 4);
    // Mugs with detail
    const mugs = [760, 810, 860, 910];
    for (const mx of mugs) {
      ctx.fillStyle = '#4A3525';
      ctx.fillRect(mx, 196, 14, 12);
      ctx.fillStyle = '#5A4530';
      ctx.fillRect(mx + 1, 196, 12, 2);
      // Handle
      ctx.fillStyle = '#4A3525';
      ctx.fillRect(mx + 13, 200, 3, 6);
      // Foam
      ctx.fillStyle = '#C8B898';
      ctx.fillRect(mx + 2, 194, 10, 3);
    }

    // ═══════════════════════════════════════════════════════════════
    // LAYER 4: PRATELEIRAS + GARRAFAS
    // ═══════════════════════════════════════════════════════════════
    ctx.fillStyle = '#3A2212';
    ctx.fillRect(730, 70, 220, 6);
    ctx.fillRect(730, 120, 220, 6);
    ctx.fillRect(730, 170, 220, 6);
    // Bottles (varied shapes and colors)
    const bottles = [
      { x: 740, h: 44, c: '#1A4A3A' }, { x: 758, h: 40, c: '#1A3A6B' },
      { x: 776, h: 46, c: '#5A1A1A' }, { x: 794, h: 38, c: '#4A3A20' },
      { x: 812, h: 44, c: '#1A4A3A' }, { x: 830, h: 42, c: '#5A1A1A' },
      { x: 852, h: 40, c: '#3A1A50' }, { x: 870, h: 46, c: '#1A3A6B' },
      { x: 888, h: 38, c: '#4A3A20' }, { x: 906, h: 44, c: '#5A1A1A' },
      { x: 924, h: 42, c: '#1A4A3A' },
    ];
    for (const b of bottles) {
      ctx.fillStyle = b.c;
      ctx.fillRect(b.x, 76 + (50 - b.h), 10, b.h - 6);
      // Neck
      ctx.fillRect(b.x + 2, 76 + (50 - b.h) - 4, 6, 6);
      // Cork/cap
      ctx.fillStyle = '#6B5B3D';
      ctx.fillRect(b.x + 3, 76 + (50 - b.h) - 5, 4, 3);
    }
    // Second shelf bottles
    for (let i = 0; i < 6; i++) {
      ctx.fillStyle = ['#4A3A20','#5A1A1A','#1A3A6B','#3A1A50','#1A4A3A','#5A1A1A'][i];
      ctx.fillRect(740 + i * 34, 130, 10, 40);
      ctx.fillRect(742 + i * 34, 126, 6, 6);
    }

    // ═══════════════════════════════════════════════════════════════
    // LAYER 5: MESAS COM VELAS + DETALHES
    // ═══════════════════════════════════════════════════════════════
    const tables = [
      { x: 120, y: 320 }, { x: 400, y: 320 },
      { x: 120, y: 520 }, { x: 400, y: 520 },
    ];
    for (let ti = 0; ti < tables.length; ti++) {
      const t = tables[ti];
      // Shadow
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      ctx.fillRect(t.x + 6, t.y + 66, 84, 10);
      // Legs
      ctx.fillStyle = '#2C1A0E';
      ctx.fillRect(t.x + 4, t.y + 50, 8, 18);
      ctx.fillRect(t.x + 84, t.y + 50, 8, 18);
      // Table top
      ctx.fillStyle = '#3D2215';
      ctx.fillRect(t.x, t.y, 96, 64);
      // Top edge highlight
      ctx.fillStyle = '#4A2E18';
      ctx.fillRect(t.x, t.y, 96, 4);
      // Wood grain on table
      ctx.fillStyle = 'rgba(60,40,20,0.1)';
      ctx.fillRect(t.x + 10, t.y + 15, 60, 1);
      ctx.fillRect(t.x + 15, t.y + 30, 50, 1);
      ctx.fillRect(t.x + 8, t.y + 45, 65, 1);
      // Candle
      ctx.fillStyle = '#C8B898';
      ctx.fillRect(t.x + 42, t.y - 8, 6, 14);
      ctx.fillStyle = '#D4870A';
      ctx.globalAlpha = 0.7 + Math.sin(_elapsed * 5 + ti * 2) * 0.2;
      ctx.fillRect(t.x + 43, t.y - 14, 4, 7);
      ctx.globalAlpha = 1;
      // Items on table
      if (ti === 0) {
        ctx.fillStyle = '#4A3525';
        ctx.fillRect(t.x + 60, t.y + 8, 14, 12);
        ctx.fillStyle = '#C8B898';
        ctx.fillRect(t.x + 62, t.y + 6, 10, 3);
      }
      if (ti === 1) {
        // Plate
        ctx.fillStyle = '#5A5550';
        ctx.fillRect(t.x + 20, t.y + 12, 20, 14);
      }
    }

    // ═══════════════════════════════════════════════════════════════
    // LAYER 6: VIGAS DO TETO
    // ═══════════════════════════════════════════════════════════════
    ctx.fillStyle = '#2C1A0E';
    ctx.fillRect(0, 56, W, 12);
    for (let x = 160; x < W; x += 280) {
      ctx.fillRect(x, 0, 18, 68);
      // Beam shadow
      ctx.fillStyle = 'rgba(0,0,0,0.1)';
      ctx.fillRect(x + 18, 0, 4, 68);
      ctx.fillStyle = '#2C1A0E';
    }

    // Hanging lanterns from ceiling
    const hangLanterns = [280, 640, 1000];
    for (const lx of hangLanterns) {
      // Chain
      ctx.fillStyle = '#4A4440';
      ctx.fillRect(lx + 4, 68, 2, 24);
      // Lantern frame
      ctx.fillStyle = '#3A2A18';
      ctx.fillRect(lx - 2, 90, 14, 18);
      // Glass/glow
      ctx.fillStyle = '#D4870A';
      ctx.globalAlpha = 0.5 + Math.sin(_elapsed * 4 + lx) * 0.2;
      ctx.fillRect(lx, 92, 10, 14);
      ctx.globalAlpha = 1;
      // Bottom cap
      ctx.fillStyle = '#3A2A18';
      ctx.fillRect(lx - 1, 107, 12, 3);
    }

    // ═══════════════════════════════════════════════════════════════
    // LAYER 7: DECORAÇÃO NAS PAREDES
    // ═══════════════════════════════════════════════════════════════
    // Mounted antlers
    ctx.fillStyle = '#6B5B3D';
    ctx.fillRect(360, 16, 40, 4);
    ctx.fillRect(350, 12, 12, 8);
    ctx.fillRect(398, 12, 12, 8);
    ctx.fillRect(345, 8, 8, 8);
    ctx.fillRect(404, 8, 8, 8);
    // Shield
    ctx.fillStyle = '#3A1A0E';
    ctx.fillRect(540, 10, 28, 36);
    ctx.fillStyle = '#D4AC0D';
    ctx.fillRect(550, 16, 8, 24);
    ctx.fillRect(542, 24, 24, 6);

    // ═══════════════════════════════════════════════════════════════
    // LAYER 8: ILUMINAÇÃO CINEMATOGRÁFICA
    // ═══════════════════════════════════════════════════════════════
    const lights = [
      // Fireplace
      { x: 150, y: 50, r: 200, color: [212, 100, 10], intensity: 0.2, flicker: 15 },
      // Hanging lanterns
      { x: 280, y: 100, r: 180, color: [212, 150, 30], intensity: 0.18, flicker: 8 },
      { x: 640, y: 100, r: 200, color: [212, 172, 13], intensity: 0.2, flicker: 8 },
      { x: 1000, y: 100, r: 180, color: [212, 150, 30], intensity: 0.18, flicker: 8 },
      // Table candles
      { x: 163, y: 310, r: 80, color: [212, 160, 40], intensity: 0.12, flicker: 12 },
      { x: 443, y: 310, r: 80, color: [212, 160, 40], intensity: 0.12, flicker: 12 },
      { x: 163, y: 510, r: 80, color: [212, 160, 40], intensity: 0.12, flicker: 12 },
      { x: 443, y: 510, r: 80, color: [212, 160, 40], intensity: 0.12, flicker: 12 },
    ];
    Atmosphere.renderLights(ctx, lights, _elapsed);

    // ═══════════════════════════════════════════════════════════════
    // LAYER 9: ENTIDADES Z-SORTED
    // ═══════════════════════════════════════════════════════════════
    const entities = [player, ..._npcs.filter(n => n.visible)];
    entities.sort((a, b) => a.y - b.y);
    for (const e of entities) {
      e.render(ctx);
    }

    // ═══════════════════════════════════════════════════════════════
    // LAYER 10: FOREGROUND — poeira, fumaça, vinheta
    // ═══════════════════════════════════════════════════════════════
    Atmosphere.renderParticles(ctx);
    Atmosphere.renderFog(ctx, _elapsed, {
      bands: 4, alpha: 0.04, color: '120,100,60', yStart: H * 0.2,
    });
    Atmosphere.renderVignette(ctx, 0.6);

    if (isNight) {
      Atmosphere.renderColorOverlay(ctx, '10,12,30', 0.1);
    }
    // Warm interior tint always
    Atmosphere.renderColorOverlay(ctx, '40,25,10', 0.06);

    // Exit label
    ctx.fillStyle = '#F5E6C8';
    ctx.font = '10px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.globalAlpha = 0.6;
    ctx.fillText('↓ SAÍDA', 640, 700);
    ctx.globalAlpha = 1;
  },
};

function _updateNPCVisibility() {
  const hour = TimeSystem.hour;
  if (_gareth) {
    _gareth.visible = hour >= 6 && hour < 23;
    if (hour >= 6 && hour < 11) {
      _gareth.x = 1040;
      _gareth.y = 160;
    } else {
      _gareth.x = 800;
      _gareth.y = 480;
    }
  }
}

function _overlaps(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x &&
         a.y < b.y + b.h && a.y + a.h > b.y;
}

const _IDLE_LINES = {
  gareth: ['Tá olhando o quê? Tem trabalho a fazer.', 'Não tenho tempo pra conversa.', 'Se não vai trabalhar, saia da frente.'],
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
