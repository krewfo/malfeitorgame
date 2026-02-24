// src/scenes/TownSquareScene.js
// Praça da aldeia — centro de Crestfall. 1280×720 cinematic.
// Lyra: Dia 1 sempre; Dia 2+ das 12h–18h | Aldeões: 3 anônimos de dia.
// Saídas: norte → tavern, leste → church, sul → herb_garden.

import { NPC } from '../actors/NPC.js';
import { Lyra } from '../actors/Lyra.js';
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
  // Bordas
  { x: 0,    y: 0,   w: 1280, h: 32 },     // norte
  { x: 0,    y: 0,   w: 32,   h: 720 },     // oeste
  { x: 1248, y: 0,   w: 32,   h: 720 },     // leste
  { x: 0,    y: 688, w: 1280, h: 32 },      // sul
  // Fonte/poço central
  { x: 560,  y: 280, w: 160,  h: 120 },
  // Bancos
  { x: 160,  y: 240, w: 80,   h: 32 },
  { x: 1040, y: 240, w: 80,   h: 32 },
];

// Zonas de saída
const EXITS = [
  { x: 520, y: 0,    w: 240, h: 32,  target: 'tavern',      label: 'TAVERNA' },
  { x: 1248, y: 280, w: 32,  h: 160, target: 'church',      label: 'IGREJA' },
  { x: 520, y: 688,  w: 240, h: 32,  target: 'herb_garden', label: 'JARDIM' },
];

let _lyra = null;
let _aldeoes = [];
let _npcs = [];
let _elapsed = 0;

export const TownSquareScene = {
  enter(player) {
    _elapsed = 0;
    if (player.y <= 40) {
      player.x = 640;
      player.y = 80;
    } else if (player.x >= 1200) {
      player.x = 1160;
      player.y = 360;
    } else if (player.y >= 640) {
      player.x = 640;
      player.y = 620;
    }

    _lyra = new Lyra(640, 400);
    _lyra.schedule = [
      { start: 7, end: 12, location: 'home_area', days: [1,2,3,4,5] },
      { start: 12, end: 18, location: 'town_square' },
      { start: 18, end: 23, location: 'home_area' },
    ];

    _aldeoes = [
      new NPC('aldeao1', 320, 380),
      new NPC('aldeao2', 480, 440),
      new NPC('aldeao3', 800, 420),
    ];
    _aldeoes.forEach(a => {
      a.canInteract = () => false;
      a.colors = { body: '#3D2215', head: '#B8956A', detail: '#6B5842' };
      a.schedule = [{ start: 6, end: 18, location: 'town_square' }];
    });

    _npcs = [_lyra, ..._aldeoes];

    AudioManager.playMusic(TimeSystem.hour >= 18 ? 'mus_village_night' : 'mus_village_day');

    Atmosphere.initParticles({ count: 50, color: 'rgba(180,160,120,0.12)', speedY: -4 });
    _updateVisibility();
  },

  exit() {
    _npcs = [];
    _lyra = null;
    _aldeoes = [];
    Atmosphere.clear();
  },

  update(dt, player) {
    _elapsed += dt;
    if (isDialogueActive()) return;

    Atmosphere.updateParticles(dt, { speedY: -4 });

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
          const triggerId = findProximityTrigger(npc.id, 'town_square', TimeSystem.day);
          if (triggerId) {
            startDialogue(triggerId).then(() => save());
          }
          break;
        }
      }
    }

    const ph = player.getHitbox();
    for (const exit of EXITS) {
      if (_overlaps(ph, exit)) {
        if (exit.target === 'tavern') { player.y = 620; player.x = 640; }
        else if (exit.target === 'church') { player.x = 80; player.y = 360; }
        else if (exit.target === 'herb_garden') { player.y = 80; player.x = 640; }
        SceneManager.changeScene(exit.target);
        break;
      }
    }

    _updateVisibility();
  },

  render(player) {
    const ctx = getCtx();
    const isNight = TimeSystem.hour >= 18 || TimeSystem.hour < 6;

    // Seeded RNG for consistent procedural detail
    let _s = 42;
    const _rng = () => { _s = (_s * 16807 + 7) % 2147483647; return (_s & 0x7fffffff) / 0x7fffffff; };

    // ═══════════════════════════════════════════════════════════════
    // LAYER 0: CÉU CREPUSCULAR DRAMÁTICO
    // ═══════════════════════════════════════════════════════════════
    Atmosphere.renderSky(ctx, _elapsed, { isNight, height: 220 });

    // Extra twilight bands — cold purple/orange transition
    if (!isNight) {
      const twi = ctx.createLinearGradient(0, 140, 0, 220);
      twi.addColorStop(0, 'rgba(80,40,60,0.12)');
      twi.addColorStop(0.5, 'rgba(120,60,30,0.08)');
      twi.addColorStop(1, 'rgba(40,30,50,0)');
      ctx.fillStyle = twi;
      ctx.fillRect(0, 140, W, 80);
    }

    // ═══════════════════════════════════════════════════════════════
    // LAYER 1: SILHUETAS DISTANTES — profundidade atmosférica
    // ═══════════════════════════════════════════════════════════════
    // Far layer (nearly invisible, hazy)
    ctx.fillStyle = isNight ? 'rgba(12,10,20,0.5)' : 'rgba(30,28,40,0.5)';
    ctx.fillRect(0, 142, 60, 58);
    ctx.fillRect(80, 134, 50, 66);
    ctx.fillRect(180, 140, 70, 60);
    ctx.fillRect(1120, 138, 60, 62);
    ctx.fillRect(1200, 142, 80, 58);
    // Far chimneys
    ctx.fillRect(100, 124, 10, 14);
    ctx.fillRect(210, 130, 8, 12);
    ctx.fillRect(1150, 128, 10, 14);
    // Smoke wisps (animated)
    ctx.globalAlpha = 0.04;
    ctx.fillStyle = isNight ? '#4A4060' : '#6A6070';
    const smokeOff = Math.sin(_elapsed * 0.6) * 6;
    ctx.fillRect(96 + smokeOff, 114, 6, 12);
    ctx.fillRect(206 + smokeOff * 0.7, 120, 5, 12);
    ctx.fillRect(1146 + smokeOff * 0.8, 118, 7, 12);
    ctx.globalAlpha = 1;

    // Mid-layer silhouettes (slightly closer)
    ctx.fillStyle = isNight ? '#0E0C18' : '#1A1828';
    ctx.fillRect(0, 150, 100, 60);
    ctx.fillRect(130, 145, 80, 65);
    ctx.fillRect(250, 148, 60, 62);
    ctx.fillRect(1060, 146, 70, 64);
    ctx.fillRect(1160, 150, 120, 60);
    // Mid chimneys
    ctx.fillRect(50, 140, 12, 14);
    ctx.fillRect(160, 136, 10, 12);
    ctx.fillRect(1090, 134, 14, 16);

    // ═══════════════════════════════════════════════════════════════
    // LAYER 2: BECOS LATERAIS — sombras profundas
    // ═══════════════════════════════════════════════════════════════
    // Left alley (deep shadow between buildings)
    ctx.fillStyle = '#040308';
    ctx.fillRect(140, 200, 60, 280);
    // Alley depth gradient
    const alleyL = ctx.createLinearGradient(140, 200, 200, 200);
    alleyL.addColorStop(0, 'rgba(4,3,8,0.9)');
    alleyL.addColorStop(1, 'rgba(4,3,8,0)');
    ctx.fillStyle = alleyL;
    ctx.fillRect(140, 200, 80, 280);

    // Right alley
    ctx.fillStyle = '#040308';
    ctx.fillRect(1080, 190, 55, 290);
    const alleyR = ctx.createLinearGradient(1135, 190, 1080, 190);
    alleyR.addColorStop(0, 'rgba(4,3,8,0.9)');
    alleyR.addColorStop(1, 'rgba(4,3,8,0)');
    ctx.fillStyle = alleyR;
    ctx.fillRect(1060, 190, 75, 290);

    // ═══════════════════════════════════════════════════════════════
    // LAYER 3: CHÃO — COBBLESTONE IRREGULAR
    // ═══════════════════════════════════════════════════════════════
    Atmosphere.renderCobblestone(ctx, {
      yStart: 200,
      baseColor: isNight ? [28, 24, 22] : [42, 38, 32],
      stoneW: 30, stoneH: 22, seed: 77,
    });

    // Puddles (rain remnants)
    if (isNight) {
      ctx.fillStyle = 'rgba(20,30,60,0.2)';
      ctx.fillRect(380, 460, 50, 12);
      ctx.fillRect(720, 520, 40, 10);
      ctx.fillRect(500, 580, 60, 14);
      // Puddle reflections of warm lights
      ctx.fillStyle = 'rgba(212,135,10,0.03)';
      ctx.fillRect(382, 462, 46, 8);
      ctx.fillRect(502, 582, 56, 10);
    }

    // Grass/moss patches between stones
    ctx.fillStyle = isNight ? '#0A1610' : '#18321E';
    for (let i = 0; i < 20; i++) {
      const gx = 120 + _rng() * (W - 240);
      const gy = 240 + _rng() * (H - 320);
      ctx.fillRect(gx, gy, 2 + _rng() * 3, 1);
    }

    // Dirt patches on sides
    ctx.fillStyle = isNight ? '#100E0A' : '#1E1A14';
    ctx.fillRect(0, 200, 32, H - 232);
    ctx.fillRect(W - 32, 200, 32, H - 232);

    // ═══════════════════════════════════════════════════════════════
    // LAYER 4: IGREJA COM TORRE PONTUDA — fundo central
    // ═══════════════════════════════════════════════════════════════

    // --- SPIRE (tall pointed tower) ---
    ctx.fillStyle = '#16121E';
    // Tower body
    ctx.fillRect(440, 30, 48, 170);
    // Taper to point
    ctx.fillRect(444, 18, 40, 16);
    ctx.fillRect(448, 8, 32, 14);
    ctx.fillRect(452, 0, 24, 12);
    ctx.fillRect(456, -8, 16, 12);
    ctx.fillRect(460, -16, 8, 12);
    // Tower stone texture
    ctx.fillStyle = '#1C1828';
    for (let ty = 34; ty < 196; ty += 14) {
      const off = (Math.floor(ty / 14) % 2) * 8;
      for (let tx = 442; tx < 486; tx += 16) {
        ctx.fillRect(tx + off, ty, 14, 12);
      }
    }
    // Tower windows (narrow slits with glow)
    ctx.fillStyle = '#D4870A';
    ctx.globalAlpha = isNight ? 0.4 : 0.1;
    ctx.fillRect(458, 60, 6, 16);
    ctx.fillRect(458, 100, 6, 16);
    ctx.fillRect(458, 140, 8, 14);
    ctx.globalAlpha = 1;
    // Cross on top
    ctx.fillStyle = '#6B5B3D';
    ctx.fillRect(462, -24, 4, 14);
    ctx.fillRect(457, -18, 14, 3);

    // --- CHURCH BODY ---
    ctx.fillStyle = '#1A1624';
    ctx.fillRect(340, 160, 248, 120);
    // Stone block wall
    ctx.fillStyle = '#201C2A';
    for (let by = 163; by < 276; by += 14) {
      const off = (Math.floor(by / 14) % 2) * 16;
      for (let bx = 342; bx < 586; bx += 32) {
        const bv = _rng() * 4 - 2;
        ctx.fillStyle = `rgb(${30 + bv},${26 + bv},${40 + bv})`;
        ctx.fillRect(bx + off, by, 30, 12);
      }
    }
    // Buttresses (external supports)
    ctx.fillStyle = '#181422';
    ctx.fillRect(340, 160, 12, 120);
    ctx.fillRect(576, 160, 12, 120);
    ctx.fillRect(456, 160, 10, 120);
    // Buttress caps
    ctx.fillStyle = '#1E1A28';
    ctx.fillRect(337, 156, 18, 6);
    ctx.fillRect(573, 156, 18, 6);

    // Pitched roof
    ctx.fillStyle = '#14101C';
    ctx.fillRect(330, 150, 268, 14);
    ctx.fillRect(335, 142, 258, 12);
    ctx.fillRect(340, 136, 248, 10);
    // Roof shingle detail
    ctx.fillStyle = '#1A1524';
    for (let rx = 332; rx < 596; rx += 16) {
      ctx.fillRect(rx, 152, 14, 4);
      ctx.fillRect(rx + 4, 144, 14, 4);
    }

    // Rose window (large circular stained glass)
    ctx.fillStyle = '#5B2D8E';
    ctx.globalAlpha = isNight ? 0.45 : 0.18;
    ctx.fillRect(438, 168, 52, 28);
    ctx.globalAlpha = 1;
    // Rose window frame & cross
    ctx.fillStyle = '#D4AC0D';
    ctx.globalAlpha = 0.25;
    ctx.fillRect(437, 167, 54, 2);
    ctx.fillRect(437, 197, 54, 2);
    ctx.fillRect(437, 167, 2, 32);
    ctx.fillRect(489, 167, 2, 32);
    ctx.fillRect(462, 167, 4, 32);
    ctx.fillRect(437, 181, 54, 3);
    ctx.globalAlpha = 1;

    // Lower windows with warm amber glow
    const cwGlow = isNight ? 0.55 : 0.15;
    ctx.fillStyle = '#D4870A';
    ctx.globalAlpha = cwGlow;
    ctx.fillRect(370, 200, 22, 32);
    ctx.fillRect(410, 200, 22, 32);
    ctx.fillRect(500, 200, 22, 32);
    ctx.fillRect(540, 200, 22, 32);
    ctx.globalAlpha = 1;
    // Window frames (gothic pointed arches)
    ctx.fillStyle = '#0D0A14';
    for (const wx of [370, 410, 500, 540]) {
      ctx.fillRect(wx + 10, 200, 2, 32);
      ctx.fillRect(wx, 214, 22, 2);
      ctx.fillRect(wx, 198, 22, 3);
    }

    // Church entrance (arched doorway)
    ctx.fillStyle = '#060410';
    ctx.fillRect(436, 230, 56, 50);
    // Arch top
    ctx.fillStyle = '#201C2A';
    ctx.fillRect(434, 226, 60, 6);
    ctx.fillRect(438, 222, 52, 6);
    // Steps
    ctx.fillStyle = '#2E2A38';
    ctx.fillRect(430, 276, 68, 6);
    ctx.fillRect(426, 280, 76, 5);
    ctx.fillRect(422, 284, 84, 4);

    // ═══════════════════════════════════════════════════════════════
    // LAYER 5: CASAS TORTAS — arquitetura irregular medieval
    // ═══════════════════════════════════════════════════════════════

    // --- LEFT HOUSE CLUSTER (crooked, leaning) ---
    // House A (far left, shorter, leans right slightly)
    ctx.fillStyle = '#181218';
    ctx.fillRect(0, 190, 140, 120);
    // Crooked lean — extra strip
    ctx.fillStyle = '#1A1420';
    ctx.fillRect(130, 200, 16, 100);
    // Roof (irregular pitch)
    ctx.fillStyle = '#12101A';
    ctx.fillRect(-10, 180, 160, 14);
    ctx.fillRect(-5, 172, 150, 12);
    ctx.fillRect(0, 166, 130, 10);
    // Chimney
    ctx.fillStyle = '#1A1620';
    ctx.fillRect(30, 152, 16, 20);
    ctx.fillRect(28, 148, 20, 6);
    // Smoke
    ctx.globalAlpha = 0.03;
    ctx.fillStyle = '#8A8090';
    ctx.fillRect(34 + Math.sin(_elapsed * 0.4) * 4, 136, 8, 14);
    ctx.fillRect(32 + Math.sin(_elapsed * 0.5 + 1) * 6, 122, 10, 16);
    ctx.globalAlpha = 1;
    // Timber frame on house A
    ctx.fillStyle = '#2A1E14';
    ctx.fillRect(0, 240, 140, 5);
    ctx.fillRect(60, 190, 6, 120);
    ctx.fillRect(0, 215, 140, 4);
    // Windows (dark, no light = abandoned feel)
    ctx.fillStyle = '#0A0810';
    ctx.fillRect(15, 200, 18, 14);
    ctx.fillRect(80, 200, 18, 14);
    // One lit window on second row
    ctx.fillStyle = '#D4870A';
    ctx.globalAlpha = isNight ? 0.35 : 0.08;
    ctx.fillRect(15, 250, 18, 16);
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#2A1E14';
    ctx.fillRect(23, 250, 2, 16);
    ctx.fillRect(15, 257, 18, 2);
    // Shutters hanging (crooked)
    ctx.fillStyle = '#1E1610';
    ctx.fillRect(78, 198, 4, 18);
    ctx.fillRect(96, 201, 4, 15);

    // House B (slightly behind, taller, leans left)
    ctx.fillStyle = '#161020';
    ctx.fillRect(180, 170, 120, 140);
    // Lean offset (walls not straight)
    ctx.fillStyle = '#181224';
    ctx.fillRect(175, 180, 10, 126);
    // Roof
    ctx.fillStyle = '#100E18';
    ctx.fillRect(170, 162, 140, 12);
    ctx.fillRect(175, 154, 130, 12);
    ctx.fillRect(185, 148, 110, 10);
    // Timber frame
    ctx.fillStyle = '#2A1E14';
    ctx.fillRect(180, 220, 120, 5);
    ctx.fillRect(235, 170, 6, 140);
    // Diagonal brace (visible decay)
    ctx.fillStyle = '#241A10';
    for (let d = 0; d < 40; d += 4) {
      ctx.fillRect(185 + d, 225 + d, 4, 4);
    }
    // Upper windows (one lit)
    ctx.fillStyle = '#D4870A';
    ctx.globalAlpha = isNight ? 0.45 : 0.12;
    ctx.fillRect(198, 180, 16, 20);
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#2A1E14';
    ctx.fillRect(205, 180, 2, 20);
    ctx.fillRect(198, 189, 16, 2);
    // Lower windows (dark)
    ctx.fillStyle = '#080610';
    ctx.fillRect(198, 235, 16, 20);
    ctx.fillRect(258, 235, 16, 20);
    // Door
    ctx.fillStyle = '#1A120E';
    ctx.fillRect(248, 260, 28, 50);
    ctx.fillStyle = '#D4870A';
    ctx.fillRect(270, 280, 3, 3);

    // --- RIGHT BUILDING CLUSTER ---
    // Tavern (main right building, larger, timber-framed)
    ctx.fillStyle = '#1C1410';
    ctx.fillRect(870, 155, 288, 160);
    // Second floor overhang (jettied upper floor)
    ctx.fillStyle = '#201814';
    ctx.fillRect(862, 110, 304, 50);
    // Overhang shadow underneath
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    ctx.fillRect(862, 155, 304, 6);
    // Timber frame (half-timbered)
    ctx.fillStyle = '#3D2215';
    ctx.fillRect(870, 155, 8, 160);
    ctx.fillRect(1150, 155, 8, 160);
    ctx.fillRect(870, 155, 288, 6);
    ctx.fillRect(870, 222, 288, 5);
    ctx.fillRect(1010, 155, 8, 160);
    ctx.fillRect(940, 160, 6, 55);
    // Cross braces (decorative X pattern)
    ctx.fillStyle = '#3A2818';
    for (let d = 0; d < 50; d += 4) {
      ctx.fillRect(880 + d, 162 + d, 4, 4);
      ctx.fillRect(926 - d, 162 + d, 4, 4);
    }
    for (let d = 0; d < 50; d += 4) {
      ctx.fillRect(1020 + d * 1.5, 162 + d, 4, 4);
      ctx.fillRect(1092 - d * 1.5, 162 + d, 4, 4);
    }
    // Plaster fill (between timbers)
    ctx.fillStyle = isNight ? '#1A1510' : '#221C16';
    ctx.fillRect(878, 161, 62, 58);
    ctx.fillRect(1018, 161, 52, 58);
    ctx.fillRect(1100, 161, 50, 58);

    // Overhang roof (double-pitched)
    ctx.fillStyle = '#161010';
    ctx.fillRect(855, 100, 316, 14);
    ctx.fillRect(860, 90, 306, 14);
    ctx.fillRect(866, 82, 294, 12);
    // Roof tile texture
    ctx.fillStyle = '#1E1614';
    for (let rx = 857; rx < 1168; rx += 18) {
      ctx.fillRect(rx, 102, 16, 5);
      ctx.fillRect(rx + 6, 92, 16, 5);
      ctx.fillRect(rx + 3, 84, 16, 4);
    }
    // Chimney (tavern)
    ctx.fillStyle = '#1A1210';
    ctx.fillRect(1120, 60, 20, 32);
    ctx.fillRect(1118, 56, 24, 6);
    // Chimney smoke
    ctx.globalAlpha = 0.035;
    ctx.fillStyle = '#8A7A70';
    ctx.fillRect(1124 + Math.sin(_elapsed * 0.3) * 5, 40, 10, 18);
    ctx.fillRect(1122 + Math.sin(_elapsed * 0.4 + 0.8) * 8, 24, 14, 20);
    ctx.globalAlpha = 1;

    // Tavern windows (warm amber glow — key visual contrast)
    const tGlow = isNight ? 0.6 : 0.18;
    // Ground floor windows
    ctx.fillStyle = '#D4870A';
    ctx.globalAlpha = tGlow;
    ctx.fillRect(888, 170, 24, 22);
    ctx.fillRect(918, 170, 24, 22);
    ctx.fillRect(1026, 170, 24, 22);
    ctx.fillRect(1062, 170, 24, 22);
    ctx.fillRect(1104, 170, 24, 22);
    // Upper floor windows (dimmer)
    ctx.globalAlpha = tGlow * 0.65;
    ctx.fillRect(880, 118, 20, 18);
    ctx.fillRect(930, 118, 20, 18);
    ctx.fillRect(1020, 118, 20, 18);
    ctx.fillRect(1080, 118, 20, 18);
    ctx.fillRect(1130, 118, 20, 18);
    ctx.globalAlpha = 1;
    // Window cross frames
    ctx.fillStyle = '#3D2215';
    for (const wx of [888, 918, 1026, 1062, 1104]) {
      ctx.fillRect(wx + 11, 170, 2, 22);
      ctx.fillRect(wx, 180, 24, 2);
    }
    for (const wx of [880, 930, 1020, 1080, 1130]) {
      ctx.fillRect(wx + 9, 118, 2, 18);
    }

    // Tavern sign (hanging from bracket)
    ctx.fillStyle = '#3D2215';
    ctx.fillRect(855, 100, 16, 4);
    ctx.fillRect(855, 100, 3, 36);
    // Chain links
    ctx.fillStyle = '#5A5040';
    ctx.fillRect(856, 130, 2, 4);
    ctx.fillRect(868, 130, 2, 4);
    // Sign board
    ctx.fillStyle = '#2C1A0E';
    ctx.fillRect(846, 132, 38, 26);
    ctx.fillStyle = '#D4870A';
    ctx.globalAlpha = 0.45;
    ctx.fillRect(850, 136, 30, 18);
    ctx.globalAlpha = 1;
    // Tiny mug icon on sign
    ctx.fillStyle = '#8B6E40';
    ctx.fillRect(858, 140, 10, 8);
    ctx.fillRect(868, 142, 3, 4);

    // Barrels and crates outside tavern
    ctx.fillStyle = '#2C1A0E';
    ctx.fillRect(1156, 280, 32, 34);
    ctx.fillRect(1190, 286, 28, 28);
    ctx.fillStyle = '#3D2215';
    ctx.fillRect(1158, 294, 28, 3);
    ctx.fillRect(1192, 298, 24, 3);
    // Crate
    ctx.fillStyle = '#281E12';
    ctx.fillRect(1160, 260, 24, 22);
    ctx.fillStyle = '#3A2818';
    ctx.fillRect(1160, 260, 24, 2);
    ctx.fillRect(1160, 270, 24, 2);
    ctx.fillRect(1171, 260, 2, 22);

    // --- SMALL HOUSE (far right, partially hidden) ---
    ctx.fillStyle = '#14101A';
    ctx.fillRect(1180, 170, 100, 120);
    ctx.fillStyle = '#100E16';
    ctx.fillRect(1175, 162, 110, 12);
    ctx.fillRect(1180, 156, 100, 10);
    // One dim window
    ctx.fillStyle = '#D4870A';
    ctx.globalAlpha = isNight ? 0.2 : 0.05;
    ctx.fillRect(1200, 186, 16, 16);
    ctx.globalAlpha = 1;

    // ═══════════════════════════════════════════════════════════════
    // LAYER 6: POÇO ANTIGO — centro da praça
    // ═══════════════════════════════════════════════════════════════

    // Well shadow on ground
    ctx.fillStyle = 'rgba(0,0,0,0.12)';
    ctx.fillRect(548, 400, 184, 16);

    // Well base (irregular stone circle)
    ctx.fillStyle = '#3A3834';
    ctx.fillRect(550, 280, 180, 120);
    ctx.fillStyle = '#4A4440';
    ctx.fillRect(555, 285, 170, 110);
    // Individual stones (irregular)
    for (let wy = 282; wy < 394; wy += 14) {
      const off = (Math.floor(wy / 14) % 2) * 12;
      for (let wx = 552; wx < 728; wx += 24) {
        const sv = _rng() * 6 - 3;
        ctx.fillStyle = `rgb(${68 + sv},${64 + sv},${58 + sv})`;
        ctx.fillRect(wx + off, wy, 22, 12);
      }
    }
    // Inner lip
    ctx.fillStyle = '#5A5650';
    ctx.fillRect(558, 283, 164, 4);
    // Water (dark void)
    ctx.fillStyle = '#08101E';
    ctx.fillRect(566, 296, 148, 94);
    // Water surface reflections (subtle)
    ctx.fillStyle = isNight ? 'rgba(212,172,40,0.05)' : 'rgba(60,90,140,0.08)';
    ctx.fillRect(572, 308 + Math.sin(_elapsed * 1.0) * 2, 136, 8);
    ctx.fillRect(578, 332 + Math.sin(_elapsed * 1.3 + 1) * 2, 124, 6);
    ctx.fillRect(574, 356 + Math.sin(_elapsed * 0.8 + 2) * 3, 130, 5);

    // Pillar / frame (A-frame wood)
    ctx.fillStyle = '#3D2215';
    // Left post
    ctx.fillRect(570, 250, 10, 60);
    // Right post
    ctx.fillRect(700, 250, 10, 60);
    // Crossbeam
    ctx.fillStyle = '#4A2E18';
    ctx.fillRect(566, 244, 148, 10);
    // Rope spool
    ctx.fillStyle = '#5A4A30';
    ctx.fillRect(630, 248, 20, 8);
    ctx.fillStyle = '#4A3A20';
    ctx.fillRect(634, 244, 12, 4);
    // Rope dangling
    ctx.fillStyle = '#6B5B3D';
    ctx.fillRect(639, 255, 2, 38);
    // Bucket
    ctx.fillStyle = '#3D2215';
    ctx.fillRect(634, 290, 12, 10);
    ctx.fillRect(633, 290, 14, 2);
    ctx.fillStyle = '#5A4A30';
    ctx.fillRect(635, 294, 10, 3);
    // Bucket handle
    ctx.fillStyle = '#5A5040';
    ctx.fillRect(639, 286, 2, 6);

    // Moss on well stones
    ctx.fillStyle = '#1A3A1E';
    ctx.globalAlpha = 0.25;
    ctx.fillRect(555, 370, 30, 6);
    ctx.fillRect(680, 360, 40, 5);
    ctx.fillRect(560, 300, 10, 14);
    ctx.globalAlpha = 1;

    // ═══════════════════════════════════════════════════════════════
    // LAYER 7: POSTES DE MADEIRA com placas penduradas
    // ═══════════════════════════════════════════════════════════════

    // -- Post 1 (left of well) --
    ctx.fillStyle = '#2C1A0E';
    ctx.fillRect(318, 260, 10, 180);
    // Post cap
    ctx.fillStyle = '#3D2215';
    ctx.fillRect(316, 256, 14, 8);
    // Lantern bracket
    ctx.fillRect(326, 270, 16, 4);
    // Hanging sign on post 1
    ctx.fillStyle = '#2C1A0E';
    ctx.fillRect(314, 292, 3, 16);
    ctx.fillRect(330, 292, 3, 16);
    ctx.fillStyle = '#1E1208';
    ctx.fillRect(306, 306, 36, 24);
    // Sign text area
    ctx.fillStyle = '#281A10';
    ctx.fillRect(310, 310, 28, 16);
    // Tiny cross/sword icon
    ctx.fillStyle = '#6B5B3D';
    ctx.fillRect(322, 314, 2, 10);
    ctx.fillRect(318, 316, 10, 2);

    // -- Post 2 (right of well) --
    ctx.fillStyle = '#2C1A0E';
    ctx.fillRect(760, 268, 10, 172);
    ctx.fillStyle = '#3D2215';
    ctx.fillRect(758, 264, 14, 8);
    // Bracket
    ctx.fillRect(740, 278, 22, 4);
    // Hanging sign on post 2
    ctx.fillStyle = '#2C1A0E';
    ctx.fillRect(738, 298, 3, 14);
    ctx.fillRect(758, 298, 3, 14);
    ctx.fillStyle = '#1E1208';
    ctx.fillRect(728, 310, 42, 22);
    ctx.fillStyle = '#281A10';
    ctx.fillRect(732, 314, 34, 14);
    // Arrow icon (direction)
    ctx.fillStyle = '#6B5B3D';
    ctx.fillRect(740, 320, 16, 2);
    ctx.fillRect(752, 316, 4, 10);

    // -- Post 3 (near church) --
    ctx.fillStyle = '#2C1A0E';
    ctx.fillRect(530, 210, 8, 80);
    ctx.fillStyle = '#3D2215';
    ctx.fillRect(528, 206, 12, 6);

    // ═══════════════════════════════════════════════════════════════
    // LAYER 8: DETALHES AMBIENTAIS (bancos, pedras, etc.)
    // ═══════════════════════════════════════════════════════════════

    // Stone bench (left)
    ctx.fillStyle = '#3A3838';
    ctx.fillRect(160, 240, 80, 12);
    ctx.fillStyle = '#4A4846';
    ctx.fillRect(162, 238, 76, 4);
    // Bench legs
    ctx.fillStyle = '#2E2C2C';
    ctx.fillRect(166, 250, 8, 14);
    ctx.fillRect(224, 250, 8, 14);

    // Stone bench (right, further back)
    ctx.fillStyle = '#3A3838';
    ctx.fillRect(1040, 240, 80, 12);
    ctx.fillStyle = '#4A4846';
    ctx.fillRect(1042, 238, 76, 4);
    ctx.fillStyle = '#2E2C2C';
    ctx.fillRect(1046, 250, 8, 14);
    ctx.fillRect(1104, 250, 8, 14);

    // Stray cart wheel leaning on wall (left)
    ctx.fillStyle = '#2C1A0E';
    ctx.fillRect(20, 340, 24, 24);
    ctx.fillStyle = '#181008';
    ctx.fillRect(28, 348, 8, 8);

    // Crate stack (near church steps)
    ctx.fillStyle = '#281E12';
    ctx.fillRect(322, 272, 18, 16);
    ctx.fillRect(318, 260, 22, 14);
    ctx.fillStyle = '#1E1610';
    ctx.fillRect(322, 272, 18, 2);
    ctx.fillRect(330, 272, 2, 16);

    // Broken fence posts (edge detail)
    ctx.fillStyle = '#2C1A0E';
    ctx.fillRect(35, 290, 6, 30);
    ctx.fillRect(55, 295, 6, 22);
    ctx.fillRect(65, 292, 6, 26);
    // Horizontal rail (broken)
    ctx.fillRect(35, 300, 36, 3);

    // ═══════════════════════════════════════════════════════════════
    // LAYER 9: LANTERNAS & LUZES nas paredes
    // ═══════════════════════════════════════════════════════════════
    Atmosphere.renderLantern(ctx, 338, 270, _elapsed);
    Atmosphere.renderLantern(ctx, 528, 206, _elapsed);
    Atmosphere.renderLantern(ctx, 740, 278, _elapsed);
    Atmosphere.renderLantern(ctx, 870, 148, _elapsed);
    Atmosphere.renderLantern(ctx, 1150, 148, _elapsed);

    // ═══════════════════════════════════════════════════════════════
    // LAYER 10: CORVOS (2)
    // ═══════════════════════════════════════════════════════════════
    Atmosphere.renderCrow(ctx, 1120, 80, _elapsed);
    Atmosphere.renderCrow(ctx, 448, 24, _elapsed + 2.5);

    // ═══════════════════════════════════════════════════════════════
    // LAYER 11: BORDAS / MUROS / SAÍDAS
    // ═══════════════════════════════════════════════════════════════
    // Bottom wall
    ctx.fillStyle = '#0E0C14';
    ctx.fillRect(0, 688, W, 32);
    ctx.fillStyle = '#161420';
    for (let wx = 0; wx < W; wx += 36) {
      ctx.fillRect(wx, 690, 34, 16);
    }
    // Top wall (hidden behind buildings)
    ctx.fillStyle = '#0E0C14';
    ctx.fillRect(0, 0, 520, 32);
    ctx.fillRect(760, 0, 520, 32);

    // Exit arches (stone with mortar detail)
    // North → Tavern
    ctx.fillStyle = '#2A2434';
    ctx.fillRect(520, 0, 240, 32);
    ctx.fillStyle = '#3A3444';
    ctx.fillRect(520, 26, 240, 6);
    ctx.fillRect(520, 0, 6, 32);
    ctx.fillRect(754, 0, 6, 32);
    // South → Garden
    ctx.fillStyle = '#2A2434';
    ctx.fillRect(520, 688, 240, 32);
    ctx.fillStyle = '#3A3444';
    ctx.fillRect(520, 688, 240, 6);
    // East → Church
    ctx.fillStyle = '#2A2434';
    ctx.fillRect(W - 32, 280, 32, 160);
    ctx.fillStyle = '#3A3444';
    ctx.fillRect(W - 32, 280, 6, 160);

    // ═══════════════════════════════════════════════════════════════
    // LAYER 12: ILUMINAÇÃO CINEMATOGRÁFICA — contraste frio/quente
    // ═══════════════════════════════════════════════════════════════
    const lights = [
      // Church tower window
      { x: 462, y: 100, r: 60, color: [212, 135, 10], intensity: isNight ? 0.12 : 0.03, flicker: 6 },
      // Church lower windows (warm vs cold building)
      { x: 390, y: 215, r: 70, color: [212, 140, 20], intensity: isNight ? 0.18 : 0.04, flicker: 5 },
      { x: 530, y: 215, r: 70, color: [212, 140, 20], intensity: isNight ? 0.18 : 0.04, flicker: 5 },
      // Left house lit window
      { x: 24, y: 258, r: 50, color: [200, 130, 30], intensity: isNight ? 0.15 : 0.03, flicker: 8 },
      // Left house B upper window
      { x: 206, y: 190, r: 60, color: [210, 145, 20], intensity: isNight ? 0.2 : 0.04, flicker: 7 },
      // Tavern windows (main warm source)
      { x: 900, y: 180, r: 120, color: [220, 155, 25], intensity: isNight ? 0.28 : 0.07, flicker: 5 },
      { x: 1060, y: 180, r: 110, color: [215, 140, 20], intensity: isNight ? 0.25 : 0.06, flicker: 6 },
      // Tavern upper windows
      { x: 950, y: 125, r: 80, color: [200, 130, 20], intensity: isNight ? 0.12 : 0.03, flicker: 4 },
      { x: 1100, y: 125, r: 80, color: [200, 130, 20], intensity: isNight ? 0.12 : 0.03, flicker: 4 },
      // Lantern posts
      { x: 343, y: 290, r: 100, color: [220, 160, 40], intensity: isNight ? 0.22 : 0.05, flicker: 10 },
      { x: 533, y: 226, r: 80, color: [220, 160, 40], intensity: isNight ? 0.18 : 0.04, flicker: 10 },
      { x: 745, y: 298, r: 100, color: [220, 160, 40], intensity: isNight ? 0.22 : 0.05, flicker: 10 },
      { x: 875, y: 168, r: 80, color: [220, 160, 40], intensity: isNight ? 0.18 : 0.04, flicker: 10 },
      { x: 1155, y: 168, r: 80, color: [220, 160, 40], intensity: isNight ? 0.18 : 0.04, flicker: 10 },
      // Ambient well (faint cool)
      { x: 640, y: 340, r: 130, color: [100, 120, 160], intensity: isNight ? 0.04 : 0.02, flicker: 2 },
      // Far right house dim
      { x: 1208, y: 194, r: 40, color: [200, 130, 20], intensity: isNight ? 0.08 : 0.02, flicker: 6 },
    ];
    Atmosphere.renderLights(ctx, lights, _elapsed);

    // God rays — dramatic crepuscular beams
    Atmosphere.renderGodRays(ctx, _elapsed, {
      x: W * 0.32, y: 0, count: 5, alpha: isNight ? 0.012 : 0.025,
      color: isNight ? '140,120,100' : '180,150,100',
      length: 500, width: 40,
    });

    // Exit labels
    ctx.fillStyle = '#F5E6C8';
    ctx.font = '10px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.globalAlpha = 0.5;
    ctx.fillText('TAVERNA ↑', 640, 18);
    ctx.fillText('↓ JARDIM', 640, 706);
    ctx.textAlign = 'left';
    ctx.fillText('IGREJA →', 1150, 365);
    ctx.globalAlpha = 1;

    // ═══════════════════════════════════════════════════════════════
    // LAYER 13: ENTIDADES Z-SORTED
    // ═══════════════════════════════════════════════════════════════
    const entities = [player, ..._npcs.filter(n => n.visible)];
    entities.sort((a, b) => a.y - b.y);
    for (const e of entities) {
      e.render(ctx);
    }

    // ═══════════════════════════════════════════════════════════════
    // LAYER 14: FOREGROUND — névoa, partículas, vinheta, overlay
    // ═══════════════════════════════════════════════════════════════
    Atmosphere.renderParticles(ctx);

    // Ground fog (settling in the square)
    Atmosphere.renderGroundFog(ctx, _elapsed, {
      alpha: isNight ? 0.07 : 0.035, color: '80,70,60', yStart: H * 0.5,
    });

    // Mid-height fog (atmospheric depth)
    Atmosphere.renderFog(ctx, _elapsed, {
      bands: 6, alpha: isNight ? 0.05 : 0.03,
      color: isNight ? '40,35,50' : '80,75,65',
      yStart: H * 0.25,
    });

    // Extra alley shadow overlay (reinforcing depth)
    ctx.fillStyle = 'rgba(4,3,8,0.15)';
    ctx.fillRect(0, 200, 50, H - 232);
    ctx.fillRect(W - 50, 200, 50, H - 232);

    // Heavy vignette (judgement framing)
    Atmosphere.renderVignette(ctx, isNight ? 0.75 : 0.55);

    // Color grade
    if (isNight) {
      Atmosphere.renderColorOverlay(ctx, '6,8,24', 0.22);
    } else {
      // Crepuscular warm-cold split
      Atmosphere.renderColorOverlay(ctx, '25,20,18', 0.08);
    }
  },
};

function _updateVisibility() {
  const hour = TimeSystem.hour;
  const day = TimeSystem.day;

  if (_lyra) {
    if (day === 1) {
      _lyra.visible = true;
    } else {
      _lyra.visible = hour >= 12 && hour < 18;
    }
  }

  for (const a of _aldeoes) {
    a.visible = hour >= 6 && hour < 18;
  }
}

function _overlaps(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x &&
         a.y < b.y + b.h && a.y + a.h > b.y;
}
