// src/actors/NPC.js
// Classe base para todos os NPCs. 1280×720 resolution.
// Zona circular de interação. Ícone [E] quando jogador próximo.
// Schedule por hora. Berthilda não interage na demo (arc=locked).

import { getArcState } from '../systems/TrustSystem.js';
import { TimeSystem } from '../systems/TimeSystem.js';
import { Atmosphere } from '../engine/atmosphere.js';

// Cores placeholder por NPC
const NPC_COLORS = {
  gareth:    { body: '#3D2215', head: '#8B6E52', detail: '#B45309' },
  lyra:      { body: '#1A3A6B', head: '#B8956A', detail: '#4A7CBF' },
  aldric:    { body: '#2D3340', head: '#B8956A', detail: '#9B8AC0' },
  davi:      { body: '#1A4A3A', head: '#8B6E52', detail: '#2D8B6A' },
  berthilda: { body: '#1F2937', head: '#B8956A', detail: '#6B7280' },
  serena:    { body: '#5A1A1A', head: '#8B6E52', detail: '#A0A0A0' },
  stenn:     { body: '#3A1A0E', head: '#B8956A', detail: '#8B7530' },
  nora:      { body: '#2C1A0E', head: '#B8956A', detail: '#C8B898' },
};

// Dimensões por NPC — escala 1280×720
const NPC_DIMS = {
  gareth:    { w: 56, h: 88, hitW: 32, hitH: 24, radius: 72, speed: 176 },
  lyra:      { w: 44, h: 72, hitW: 28, hitH: 20, radius: 64, speed: 288 },
  aldric:    { w: 52, h: 84, hitW: 28, hitH: 24, radius: 72, speed: 152 },
  davi:      { w: 52, h: 84, hitW: 28, hitH: 24, radius: 72, speed: 192 },
  berthilda: { w: 40, h: 68, hitW: 24, hitH: 20, radius: 56, speed: 208 },
  serena:    { w: 40, h: 68, hitW: 24, hitH: 20, radius: 56, speed: 208 },
  stenn:     { w: 40, h: 68, hitW: 24, hitH: 20, radius: 56, speed: 208 },
  nora:      { w: 40, h: 68, hitW: 24, hitH: 20, radius: 56, speed: 208 },
};

export class NPC {
  constructor(id, x = 0, y = 0) {
    this.id = id;
    this.x = x;
    this.y = y;

    const dims = NPC_DIMS[id] ?? { w: 40, h: 68, hitW: 24, hitH: 20, radius: 56, speed: 208 };
    this.spriteW = dims.w;
    this.spriteH = dims.h;
    this.hitbox = { w: dims.hitW, h: dims.hitH, ox: Math.floor((dims.w - dims.hitW) / 2), oy: dims.h - dims.hitH };
    this.interactRadius = dims.radius;
    this.speed = dims.speed;

    this.colors = NPC_COLORS[id] ?? { body: '#A0A0A0', head: '#8B6E52', detail: '#7F8C8D' };
    this.dir = 'down';
    this.frame = 0;
    this._showInteract = false;
    this.visible = true;
    this.schedule = [];
  }

  isPlayerNear(player) {
    const feet = player.getFeetCenter();
    const npcCenterX = this.x + this.spriteW / 2;
    const npcBottomY = this.y + this.spriteH;
    const dx = feet.x - npcCenterX;
    const dy = feet.y - npcBottomY;
    return Math.sqrt(dx * dx + dy * dy) < this.interactRadius;
  }

  canInteract() {
    if (this.id === 'berthilda' && TimeSystem.act < 3) return false;
    const arc = getArcState(this.id);
    if (arc === 'broken') return 'rejected';
    return true;
  }

  isAvailable(sceneLocation) {
    const hour = TimeSystem.hour;
    const dow  = TimeSystem.dayOfWeek;

    for (const slot of this.schedule) {
      if (hour >= slot.start && hour < slot.end) {
        if (slot.days && !slot.days.includes(dow)) continue;
        if (slot.location === sceneLocation || slot.location.includes(sceneLocation)) {
          return true;
        }
      }
    }
    return false;
  }

  update(dt, player) {
    this._showInteract = this.visible && this.isPlayerNear(player) && this.canInteract() === true;
  }

  render(ctx) {
    if (!this.visible) return;

    const x = Math.floor(this.x);
    const y = Math.floor(this.y);

    // Sombra elíptica
    Atmosphere.renderShadow(ctx, x + this.spriteW / 2, y + this.spriteH, this.spriteW * 0.85);

    // Corpo
    ctx.fillStyle = this.colors.body;
    ctx.fillRect(x + 4, y + Math.floor(this.spriteH * 0.35), this.spriteW - 8, Math.floor(this.spriteH * 0.65));

    // Cabeça
    const headW = Math.floor(this.spriteW * 0.55);
    const headH = Math.floor(this.spriteH * 0.3);
    const headX = x + Math.floor((this.spriteW - headW) / 2);
    ctx.fillStyle = this.colors.head;
    ctx.fillRect(headX, y + 4, headW, headH);

    // Cabelo
    ctx.fillStyle = '#1A1215';
    ctx.fillRect(headX, y + 2, headW, Math.floor(headH * 0.3));

    // Olhos
    ctx.fillStyle = '#0D0A1F';
    ctx.fillRect(headX + Math.floor(headW * 0.2), y + 4 + Math.floor(headH * 0.45), 3, 3);
    ctx.fillRect(headX + Math.floor(headW * 0.65), y + 4 + Math.floor(headH * 0.45), 3, 3);

    // Detalhe (cinto/colar/etc)
    ctx.fillStyle = this.colors.detail;
    ctx.fillRect(x + 8, y + Math.floor(this.spriteH * 0.38), this.spriteW - 16, 4);

    // Pernas
    ctx.fillStyle = '#1A1215';
    ctx.fillRect(x + Math.floor(this.spriteW * 0.25), y + Math.floor(this.spriteH * 0.8), 10, Math.floor(this.spriteH * 0.2));
    ctx.fillRect(x + Math.floor(this.spriteW * 0.55), y + Math.floor(this.spriteH * 0.8), 10, Math.floor(this.spriteH * 0.2));

    // Ícone [E] de interação
    if (this._showInteract) {
      ctx.fillStyle = 'rgba(10, 22, 40, 0.85)';
      ctx.fillRect(x + Math.floor(this.spriteW / 2) - 14, y - 28, 28, 22);
      ctx.fillStyle = '#F5E6C8';
      ctx.font = '14px "Press Start 2P", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText('E', x + Math.floor(this.spriteW / 2), y - 26);
    }
  }

  getHitbox() {
    return {
      x: this.x + this.hitbox.ox,
      y: this.y + this.hitbox.oy,
      w: this.hitbox.w,
      h: this.hitbox.h,
    };
  }
}
