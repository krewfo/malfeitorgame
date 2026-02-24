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
          } else {
            _showIdleDialogue(npc.id);
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
    const isNight = TimeSystem.hour >= 18 || TimeSystem.hour < 6;

    // Seeded RNG for consistent procedural detail
    let _s = 61;
    const _rng = () => { _s = (_s * 16807 + 7) % 2147483647; return (_s & 0x7fffffff) / 0x7fffffff; };

    // ═══════════════════════════════════════════════════════════════
    // LAYER 0: CÉU ESCURO — azul petróleo com nuvens dramáticas
    // ═══════════════════════════════════════════════════════════════
    // Deep sky gradient (petroleum blue → near-black)
    const skyGrad = ctx.createLinearGradient(0, 0, 0, 260);
    if (isNight) {
      skyGrad.addColorStop(0, '#04060E');
      skyGrad.addColorStop(0.3, '#08101A');
      skyGrad.addColorStop(0.7, '#0C1420');
      skyGrad.addColorStop(1, '#0E1624');
    } else {
      skyGrad.addColorStop(0, '#0E1820');
      skyGrad.addColorStop(0.3, '#14222E');
      skyGrad.addColorStop(0.6, '#1A2C3A');
      skyGrad.addColorStop(1, '#1E303E');
    }
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, W, 260);

    // Dramatic clouds (layered, brooding)
    Atmosphere.renderClouds(ctx, _elapsed, {
      count: 14, yMin: 10, yMax: 140,
      color: isNight ? '20,28,40' : '35,45,55',
      alpha: isNight ? 0.25 : 0.35,
      speed: 0.08,
    });
    // Second cloud layer (thinner, higher)
    Atmosphere.renderClouds(ctx, _elapsed, {
      count: 8, yMin: 0, yMax: 80,
      color: isNight ? '30,38,50' : '50,58,65',
      alpha: isNight ? 0.12 : 0.18,
      speed: 0.04,
    });

    // Dim moon/sun glow behind clouds
    ctx.fillStyle = isNight ? 'rgba(180,190,210,0.04)' : 'rgba(200,180,140,0.06)';
    ctx.fillRect(200, 30, 80, 60);
    ctx.fillStyle = isNight ? 'rgba(180,190,210,0.02)' : 'rgba(200,180,140,0.03)';
    ctx.fillRect(180, 20, 120, 80);

    // Mountain/treeline silhouettes far back
    ctx.fillStyle = isNight ? '#080C14' : '#101824';
    ctx.fillRect(0, 200, 300, 60);
    ctx.fillRect(250, 190, 200, 70);
    ctx.fillRect(800, 195, 250, 65);
    ctx.fillRect(1000, 200, 280, 60);
    // Tree tops on silhouette
    for (let i = 0; i < 16; i++) {
      const tx = 20 + i * 82;
      const th = 10 + _rng() * 18;
      ctx.fillRect(tx, 196 - th, 14 + _rng() * 12, th + 4);
    }

    // ═══════════════════════════════════════════════════════════════
    // LAYER 1: CHÃO — pedra irregular da praça
    // ═══════════════════════════════════════════════════════════════
    // Base ground
    ctx.fillStyle = isNight ? '#12101A' : '#1E1C28';
    ctx.fillRect(0, 250, W, H - 250);

    // Irregular cobblestone ground
    Atmosphere.renderCobblestone(ctx, {
      yStart: 440,
      baseColor: isNight ? [22, 20, 28] : [35, 32, 40],
      stoneW: 28, stoneH: 20, seed: 99,
    });

    // Path leading to church door (lighter stones, worn)
    ctx.fillStyle = isNight ? '#1A1824' : '#2A2834';
    ctx.fillRect(560, 440, 160, H - 440);
    // Worn stones on path
    for (let py = 445; py < H - 40; py += 18) {
      for (let px = 562; px < 718; px += 22) {
        const pv = _rng() * 6 - 3;
        ctx.fillStyle = `rgb(${35 + pv},${33 + pv},${44 + pv})`;
        ctx.fillRect(px, py, 20, 16);
      }
    }

    // Grass/dirt at edges
    ctx.fillStyle = isNight ? '#0A100E' : '#141E18';
    ctx.fillRect(0, 250, 120, H - 250);
    ctx.fillRect(W - 80, 250, 80, H - 250);
    // Grass tufts
    ctx.fillStyle = isNight ? '#0C1410' : '#1A2E1E';
    for (let i = 0; i < 18; i++) {
      const gx = i < 9 ? 10 + _rng() * 100 : W - 70 + _rng() * 60;
      const gy = 280 + _rng() * (H - 340);
      ctx.fillRect(gx, gy, 2, 4 + _rng() * 5);
      ctx.fillRect(gx + 3, gy - 1, 2, 5 + _rng() * 4);
    }

    // ═══════════════════════════════════════════════════════════════
    // LAYER 2: ÁRVORE SECA — esquerda, silhueta dramática
    // ═══════════════════════════════════════════════════════════════
    Atmosphere.renderDeadTree(ctx, 60, 340, 1.6);
    // Second smaller dead tree (right back)
    Atmosphere.renderDeadTree(ctx, W - 140, 380, 0.8);

    // ═══════════════════════════════════════════════════════════════
    // LAYER 3: CEMITÉRIO DISCRETO — lápides irregulares
    // ═══════════════════════════════════════════════════════════════

    // --- Left cemetery cluster ---
    Atmosphere.renderGravestone(ctx, 40, 400, 0);
    Atmosphere.renderGravestone(ctx, 85, 420, 2);
    Atmosphere.renderGravestone(ctx, 120, 445, 1);
    Atmosphere.renderGravestone(ctx, 55, 470, 0);
    Atmosphere.renderGravestone(ctx, 105, 490, 2);
    Atmosphere.renderGravestone(ctx, 30, 520, 1);
    Atmosphere.renderGravestone(ctx, 80, 540, 0);

    // Candle by gravestone (small vigil)
    ctx.fillStyle = '#C8B898';
    ctx.fillRect(49, 426, 3, 6);
    ctx.fillStyle = '#D4870A';
    ctx.globalAlpha = 0.5 + Math.sin(_elapsed * 4.5) * 0.3;
    ctx.fillRect(49, 422, 2, 5);
    ctx.globalAlpha = 1;

    // Small iron fence between graves (left)
    ctx.fillStyle = '#1E1A1A';
    ctx.fillRect(25, 460, 110, 2);
    for (let fx = 30; fx < 135; fx += 20) {
      ctx.fillRect(fx, 450, 2, 14);
      // Spike tops
      ctx.fillRect(fx - 1, 448, 4, 3);
    }

    // --- Right cemetery cluster ---
    Atmosphere.renderGravestone(ctx, W - 110, 430, 1);
    Atmosphere.renderGravestone(ctx, W - 70, 455, 0);
    Atmosphere.renderGravestone(ctx, W - 100, 490, 2);
    Atmosphere.renderGravestone(ctx, W - 60, 510, 1);
    Atmosphere.renderGravestone(ctx, W - 90, 545, 0);

    // Iron fence right
    ctx.fillStyle = '#1E1A1A';
    ctx.fillRect(W - 120, 480, 100, 2);
    for (let fx = W - 115; fx < W - 20; fx += 20) {
      ctx.fillRect(fx, 470, 2, 14);
      ctx.fillRect(fx - 1, 468, 4, 3);
    }

    // ═══════════════════════════════════════════════════════════════
    // LAYER 4: MUROS LATERAIS — pedra velha com sombra profunda
    // ═══════════════════════════════════════════════════════════════

    // Left stone wall (cemetery wall)
    ctx.fillStyle = '#161420';
    ctx.fillRect(130, 260, 30, 240);
    // Stone texture
    for (let wy = 262; wy < 498; wy += 16) {
      const off = (Math.floor(wy / 16) % 2) * 6;
      ctx.fillStyle = `rgb(${20 + _rng() * 4},${18 + _rng() * 4},${28 + _rng() * 4})`;
      ctx.fillRect(132 + off, wy, 26, 14);
    }
    // Wall cap
    ctx.fillStyle = '#1E1C28';
    ctx.fillRect(128, 256, 34, 6);

    // Right stone wall
    ctx.fillStyle = '#161420';
    ctx.fillRect(W - 120, 270, 28, 230);
    for (let wy = 272; wy < 498; wy += 16) {
      const off = (Math.floor(wy / 16) % 2) * 6;
      ctx.fillStyle = `rgb(${20 + _rng() * 4},${18 + _rng() * 4},${28 + _rng() * 4})`;
      ctx.fillRect(W - 118 + off, wy, 24, 14);
    }
    ctx.fillStyle = '#1E1C28';
    ctx.fillRect(W - 122, 266, 32, 6);

    // Deep shadow in alleys
    const shadowL = ctx.createLinearGradient(160, 260, 260, 260);
    shadowL.addColorStop(0, 'rgba(4,4,10,0.6)');
    shadowL.addColorStop(1, 'rgba(4,4,10,0)');
    ctx.fillStyle = shadowL;
    ctx.fillRect(130, 260, 130, 240);

    const shadowR = ctx.createLinearGradient(W - 92, 270, W - 200, 270);
    shadowR.addColorStop(0, 'rgba(4,4,10,0.6)');
    shadowR.addColorStop(1, 'rgba(4,4,10,0)');
    ctx.fillStyle = shadowR;
    ctx.fillRect(W - 220, 270, 128, 230);

    // ═══════════════════════════════════════════════════════════════
    // LAYER 5: IGREJA — fachada gótica imponente (centro)
    // ═══════════════════════════════════════════════════════════════

    // --- MAIN BODY ---
    ctx.fillStyle = '#161220';
    ctx.fillRect(320, 200, 640, 260);

    // Stone block wall texture
    for (let by = 204; by < 456; by += 16) {
      const off = (Math.floor(by / 16) % 2) * 18;
      for (let bx = 322 + off; bx < 958; bx += 36) {
        const bv = _rng() * 5 - 2;
        ctx.fillStyle = `rgb(${22 + bv},${18 + bv},${30 + bv})`;
        ctx.fillRect(bx, by, 34, 14);
        // Mortar line highlight
        ctx.fillStyle = 'rgba(80,70,100,0.04)';
        ctx.fillRect(bx, by, 34, 1);
      }
    }

    // Buttresses (vertical structural supports)
    ctx.fillStyle = '#12101C';
    ctx.fillRect(316, 200, 14, 260);
    ctx.fillRect(464, 200, 12, 260);
    ctx.fillRect(804, 200, 12, 260);
    ctx.fillRect(950, 200, 14, 260);
    // Buttress stepped tops
    ctx.fillStyle = '#1A1828';
    ctx.fillRect(312, 192, 22, 10);
    ctx.fillRect(460, 192, 20, 10);
    ctx.fillRect(800, 192, 20, 10);
    ctx.fillRect(946, 192, 22, 10);

    // --- PITCHED ROOF ---
    ctx.fillStyle = '#100E18';
    ctx.fillRect(300, 188, 680, 16);
    ctx.fillRect(310, 178, 660, 14);
    ctx.fillRect(320, 170, 640, 12);
    ctx.fillRect(340, 164, 600, 10);
    // Roof tile detail
    ctx.fillStyle = '#161220';
    for (let rx = 302; rx < 978; rx += 18) {
      ctx.fillRect(rx, 190, 16, 5);
    }
    for (let rx = 312; rx < 968; rx += 18) {
      ctx.fillRect(rx, 180, 16, 4);
    }

    // --- TALL POINTED TOWER (spire) ---
    // Tower body (vertical emphasis)
    ctx.fillStyle = '#14101E';
    ctx.fillRect(586, 40, 108, 174);
    // Tower stone texture
    for (let ty = 44; ty < 210; ty += 14) {
      const off = (Math.floor(ty / 14) % 2) * 10;
      for (let tx = 588 + off; tx < 692; tx += 22) {
        const tv = _rng() * 4 - 2;
        ctx.fillStyle = `rgb(${20 + tv},${16 + tv},${28 + tv})`;
        ctx.fillRect(tx, ty, 20, 12);
      }
    }
    // Tower corners (darker pilasters)
    ctx.fillStyle = '#100E18';
    ctx.fillRect(584, 40, 6, 174);
    ctx.fillRect(690, 40, 6, 174);

    // Spire taper (pointed)
    ctx.fillStyle = '#12101A';
    ctx.fillRect(590, 26, 100, 18);
    ctx.fillRect(596, 14, 88, 16);
    ctx.fillRect(604, 4, 72, 14);
    ctx.fillRect(614, -4, 52, 12);
    ctx.fillRect(624, -12, 32, 12);
    ctx.fillRect(630, -20, 20, 12);
    ctx.fillRect(634, -28, 12, 12);
    ctx.fillRect(637, -34, 6, 10);

    // Discreet finial (small ornament at top, NOT a cross)
    ctx.fillStyle = '#6B5B3D';
    ctx.fillRect(638, -40, 4, 10);
    ctx.fillRect(636, -36, 8, 3);

    // Tower windows (narrow slits with faint amber glow)
    const towerGlow = isNight ? 0.4 : 0.1;
    ctx.fillStyle = '#D4870A';
    ctx.globalAlpha = towerGlow;
    ctx.fillRect(634, 60, 12, 22);
    ctx.fillRect(634, 100, 12, 22);
    ctx.fillRect(634, 140, 14, 20);
    ctx.globalAlpha = 1;
    // Window stone frames
    ctx.fillStyle = '#100E18';
    for (const wy of [60, 100, 140]) {
      ctx.fillRect(632, wy - 2, 16, 2);
      ctx.fillRect(632, wy + (wy === 140 ? 20 : 22), 16, 2);
      ctx.fillRect(639, wy, 2, wy === 140 ? 20 : 22);
    }
    // Bell opening (belfry)
    ctx.fillStyle = '#060410';
    ctx.fillRect(618, 170, 44, 28);
    // Bell silhouette inside
    ctx.fillStyle = '#1E1828';
    ctx.fillRect(630, 172, 20, 16);
    ctx.fillRect(626, 186, 28, 6);

    // --- SIDE WINDOWS (narrow lancets with amber glow) ---
    const winGlow = isNight ? 0.5 : 0.12;
    // Left side
    ctx.fillStyle = '#D4870A';
    ctx.globalAlpha = winGlow;
    ctx.fillRect(360, 230, 18, 38);
    ctx.fillRect(408, 230, 18, 38);
    // Right side
    ctx.fillRect(854, 230, 18, 38);
    ctx.fillRect(902, 230, 18, 38);
    ctx.globalAlpha = 1;
    // Window frames (pointed arch tops)
    ctx.fillStyle = '#100E18';
    for (const wx of [360, 408, 854, 902]) {
      ctx.fillRect(wx - 2, 226, 22, 4);
      ctx.fillRect(wx - 2, 268, 22, 3);
      ctx.fillRect(wx + 7, 230, 2, 38);
    }

    // --- ROSE WINDOW (circular, above door) ---
    ctx.fillStyle = '#5B2D8E';
    ctx.globalAlpha = isNight ? 0.4 : 0.15;
    ctx.fillRect(608, 215, 64, 36);
    ctx.globalAlpha = 1;
    // Rose window tracery (ornate frame)
    ctx.fillStyle = '#D4AC0D';
    ctx.globalAlpha = 0.2;
    ctx.fillRect(606, 213, 68, 2);
    ctx.fillRect(606, 251, 68, 2);
    ctx.fillRect(606, 213, 2, 40);
    ctx.fillRect(672, 213, 2, 40);
    ctx.fillRect(638, 213, 4, 40);
    ctx.fillRect(606, 231, 68, 3);
    // Inner circle suggestion
    ctx.fillRect(618, 219, 44, 2);
    ctx.fillRect(618, 247, 44, 2);
    ctx.fillRect(614, 221, 2, 26);
    ctx.fillRect(664, 221, 2, 26);
    ctx.globalAlpha = 1;

    // ═══════════════════════════════════════════════════════════════
    // LAYER 6: PORTA PESADA DE MADEIRA — com luz quente vazando
    // ═══════════════════════════════════════════════════════════════

    // Stone archway (pointed gothic arch)
    ctx.fillStyle = '#1E1A28';
    ctx.fillRect(586, 290, 108, 170);
    // Arch taper
    ctx.fillStyle = '#201C2C';
    ctx.fillRect(590, 280, 100, 14);
    ctx.fillRect(596, 272, 88, 12);
    ctx.fillRect(604, 266, 72, 10);

    // Door recess (darkness)
    ctx.fillStyle = '#060410';
    ctx.fillRect(596, 292, 88, 168);

    // Heavy wooden door (double door)
    ctx.fillStyle = '#1E1208';
    ctx.fillRect(600, 296, 80, 164);
    // Door split
    ctx.fillStyle = '#0E0A04';
    ctx.fillRect(639, 296, 2, 164);
    // Wood plank detail
    ctx.fillStyle = '#241A0E';
    for (let dy = 300; dy < 456; dy += 28) {
      ctx.fillRect(602, dy, 76, 1);
    }
    // Iron studs on door
    ctx.fillStyle = '#3A3838';
    for (let dy = 310; dy < 450; dy += 35) {
      ctx.fillRect(612, dy, 4, 4);
      ctx.fillRect(626, dy, 4, 4);
      ctx.fillRect(650, dy, 4, 4);
      ctx.fillRect(664, dy, 4, 4);
    }
    // Iron hinges
    ctx.fillStyle = '#2A2828';
    ctx.fillRect(598, 320, 14, 3);
    ctx.fillRect(598, 380, 14, 3);
    ctx.fillRect(668, 320, 14, 3);
    ctx.fillRect(668, 380, 14, 3);
    // Door ring handles
    ctx.fillStyle = '#4A4848';
    ctx.fillRect(630, 400, 6, 10);
    ctx.fillRect(644, 400, 6, 10);
    ctx.fillStyle = '#5A5858';
    ctx.fillRect(631, 406, 4, 4);
    ctx.fillRect(645, 406, 4, 4);

    // Door slightly ajar — warm light leaking out
    ctx.fillStyle = '#D4870A';
    ctx.globalAlpha = isNight ? 0.25 : 0.08;
    ctx.fillRect(639, 340, 4, 120);
    ctx.globalAlpha = 1;

    // Light spill on ground from door
    const doorLight = ctx.createLinearGradient(640, 458, 640, 560);
    doorLight.addColorStop(0, `rgba(212,135,10,${isNight ? 0.12 : 0.04})`);
    doorLight.addColorStop(1, 'rgba(212,135,10,0)');
    ctx.fillStyle = doorLight;
    ctx.fillRect(580, 458, 120, 100);
    // Light expanding on floor
    const doorLightH = ctx.createLinearGradient(560, 480, 720, 480);
    doorLightH.addColorStop(0, 'rgba(212,135,10,0)');
    doorLightH.addColorStop(0.3, `rgba(212,135,10,${isNight ? 0.06 : 0.02})`);
    doorLightH.addColorStop(0.7, `rgba(212,135,10,${isNight ? 0.06 : 0.02})`);
    doorLightH.addColorStop(1, 'rgba(212,135,10,0)');
    ctx.fillStyle = doorLightH;
    ctx.fillRect(560, 458, 160, 80);

    // Steps leading to door
    ctx.fillStyle = '#2A2636';
    ctx.fillRect(580, 456, 120, 8);
    ctx.fillStyle = '#282434';
    ctx.fillRect(572, 462, 136, 7);
    ctx.fillStyle = '#262232';
    ctx.fillRect(564, 468, 152, 6);

    // ═══════════════════════════════════════════════════════════════
    // LAYER 7: DETALHES AMBIENTAIS
    // ═══════════════════════════════════════════════════════════════

    // Crows perched on tower and tree
    Atmosphere.renderCrow(ctx, 670, 38, _elapsed);
    Atmosphere.renderCrow(ctx, 100, 280, _elapsed + 3);

    // Small lanterns on wall brackets flanking door
    Atmosphere.renderLantern(ctx, 576, 310, _elapsed);
    Atmosphere.renderLantern(ctx, 694, 310, _elapsed);

    // Additional lantern on cemetery wall
    Atmosphere.renderLantern(ctx, 134, 268, _elapsed);

    // Fallen leaves (subtle)
    ctx.fillStyle = isNight ? '#1A1410' : '#2A2218';
    ctx.fillRect(400, 472, 4, 2);
    ctx.fillRect(500, 466, 3, 2);
    ctx.fillRect(740, 478, 4, 2);

    // ═══════════════════════════════════════════════════════════════
    // LAYER 8: BORDAS & SAÍDA
    // ═══════════════════════════════════════════════════════════════

    // Bottom wall
    ctx.fillStyle = '#0A0A12';
    ctx.fillRect(0, 680, W, 40);
    ctx.fillStyle = '#14121E';
    for (let wx = 0; wx < W; wx += 36) {
      ctx.fillRect(wx, 682, 34, 16);
    }

    // Left side (exit)
    ctx.fillStyle = '#0E0C16';
    ctx.fillRect(0, 0, 32, 280);
    ctx.fillRect(0, 440, 32, 280);
    // Exit opening (path back to town square)
    ctx.fillStyle = '#181624';
    ctx.fillRect(0, 280, 32, 160);
    // Stone arch around exit
    ctx.fillStyle = '#1E1C28';
    ctx.fillRect(0, 274, 36, 6);
    ctx.fillRect(0, 440, 36, 6);
    ctx.fillRect(28, 280, 8, 160);

    // Right side wall
    ctx.fillStyle = '#0E0C16';
    ctx.fillRect(W - 32, 0, 32, H);

    // Top hidden strip
    ctx.fillStyle = '#060410';
    ctx.fillRect(0, 0, 320, 48);
    ctx.fillRect(960, 0, 320, 48);

    // ═══════════════════════════════════════════════════════════════
    // LAYER 9: ILUMINAÇÃO CINEMATOGRÁFICA
    // ═══════════════════════════════════════════════════════════════
    const lights = [
      // Door warm light spill (key light)
      { x: 640, y: 460, r: 160, color: [212, 135, 10], intensity: isNight ? 0.22 : 0.06, flicker: 6 },
      // Door crack glow
      { x: 640, y: 380, r: 60, color: [220, 160, 40], intensity: isNight ? 0.15 : 0.04, flicker: 8 },
      // Lantern flanking door (left)
      { x: 580, y: 330, r: 80, color: [220, 160, 40], intensity: isNight ? 0.2 : 0.05, flicker: 10 },
      // Lantern flanking door (right)
      { x: 698, y: 330, r: 80, color: [220, 160, 40], intensity: isNight ? 0.2 : 0.05, flicker: 10 },
      // Cemetery wall lantern
      { x: 140, y: 288, r: 70, color: [200, 140, 30], intensity: isNight ? 0.14 : 0.03, flicker: 12 },
      // Vigil candle
      { x: 50, y: 424, r: 35, color: [212, 135, 10], intensity: isNight ? 0.1 : 0.02, flicker: 14 },
      // Tower windows (faint)
      { x: 640, y: 100, r: 80, color: [212, 140, 20], intensity: isNight ? 0.08 : 0.02, flicker: 5 },
      // Side windows
      { x: 384, y: 248, r: 50, color: [212, 135, 10], intensity: isNight ? 0.1 : 0.03, flicker: 6 },
      { x: 878, y: 248, r: 50, color: [212, 135, 10], intensity: isNight ? 0.1 : 0.03, flicker: 6 },
      // Rose window (purple glow)
      { x: 640, y: 233, r: 60, color: [140, 80, 180], intensity: isNight ? 0.06 : 0.02, flicker: 3 },
      // Ambient sky reflection on ground (cold fill)
      { x: 300, y: 550, r: 200, color: [40, 60, 90], intensity: isNight ? 0.03 : 0.015, flicker: 1 },
      { x: 980, y: 550, r: 200, color: [40, 60, 90], intensity: isNight ? 0.03 : 0.015, flicker: 1 },
    ];
    Atmosphere.renderLights(ctx, lights, _elapsed);

    // God rays from behind tower (divine/ominous)
    Atmosphere.renderGodRays(ctx, _elapsed, {
      x: 640, y: 0, count: 4, alpha: isNight ? 0.008 : 0.018,
      color: isNight ? '100,110,140' : '160,140,100',
      length: 400, width: 30,
    });

    // Exit label
    ctx.fillStyle = '#F5E6C8';
    ctx.font = '10px "Press Start 2P", monospace';
    ctx.textAlign = 'left';
    ctx.globalAlpha = 0.5;
    ctx.fillText('← PRAÇA', 6, 366);
    ctx.globalAlpha = 1;

    // ═══════════════════════════════════════════════════════════════
    // LAYER 10: ENTIDADES Z-SORTED
    // ═══════════════════════════════════════════════════════════════
    const entities = [player, ..._npcs.filter(n => n.visible)];
    entities.sort((a, b) => a.y - b.y);
    for (const e of entities) {
      e.render(ctx);
    }

    // ═══════════════════════════════════════════════════════════════
    // LAYER 11: FOREGROUND — névoa, partículas, vinheta
    // ═══════════════════════════════════════════════════════════════
    Atmosphere.renderParticles(ctx);

    // Ground fog (settling around gravestones)
    Atmosphere.renderGroundFog(ctx, _elapsed, {
      alpha: isNight ? 0.07 : 0.03, color: '60,60,80', yStart: H * 0.6,
    });

    // Mid fog (atmospheric depth)
    Atmosphere.renderFog(ctx, _elapsed, {
      bands: 5, alpha: isNight ? 0.045 : 0.025,
      color: isNight ? '30,35,50' : '60,60,75',
      yStart: H * 0.3,
    });

    // Shadow reinforcement on sides (judgement corridor)
    ctx.fillStyle = 'rgba(4,4,10,0.2)';
    ctx.fillRect(0, 200, 180, H - 230);
    ctx.fillRect(W - 140, 200, 140, H - 230);

    // Heavy vignette (isolation, dread)
    Atmosphere.renderVignette(ctx, isNight ? 0.78 : 0.58);

    // Cold color grade (petroleum blue tint)
    if (isNight) {
      Atmosphere.renderColorOverlay(ctx, '6,10,22', 0.2);
    } else {
      Atmosphere.renderColorOverlay(ctx, '14,18,28', 0.08);
    }
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

const _IDLE_LINES = {
  aldric: ['(Continua lendo em silêncio.)', 'Agora não, por favor.', '(Faz um gesto pedindo silêncio.)'],
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
