// src/actors/Gareth.js
// Gareth — taverneiro, 45 anos. 1280×720 cinematic sprite (56×88).
// Comprou a taverna de forma "legal mas não limpa". Nunca mente, mas omite.
// Avental de couro, barba curta, ombros largos. Sempre com um pano no ombro.

import { NPC } from './NPC.js';
import { Atmosphere } from '../engine/atmosphere.js';

export class Gareth extends NPC {
  constructor(x = 800, y = 480) {
    super('gareth', x, y);
    this.displayName = 'Gareth';
    this.age = 45;
  }

  render(ctx) {
    if (!this.visible) return;

    const x = Math.floor(this.x);
    const y = Math.floor(this.y);
    const W = this.spriteW;  // 56
    const H = this.spriteH;  // 88

    // — Sombra —
    Atmosphere.renderShadow(ctx, x + W / 2, y + H, W * 0.9);

    // — Botas escuras —
    ctx.fillStyle = '#1A1008';
    ctx.fillRect(x + 12, y + 74, 12, 14);
    ctx.fillRect(x + 32, y + 74, 12, 14);

    // — Calças marrom escuro —
    ctx.fillStyle = '#2B1A0E';
    ctx.fillRect(x + 12, y + 56, 14, 20);
    ctx.fillRect(x + 30, y + 56, 14, 20);

    // — Torso / camisa —
    ctx.fillStyle = '#3D2215';
    ctx.fillRect(x + 8, y + 28, 40, 30);

    // — Avental de couro —
    ctx.fillStyle = '#5C3A1E';
    ctx.fillRect(x + 14, y + 32, 28, 28);
    // Costuras do avental
    ctx.fillStyle = '#4A2E15';
    ctx.fillRect(x + 14, y + 46, 28, 2);
    ctx.fillRect(x + 27, y + 32, 2, 28);

    // — Cinto com fivela dourada —
    ctx.fillStyle = '#2C1A0E';
    ctx.fillRect(x + 10, y + 54, 36, 4);
    ctx.fillStyle = '#B45309';
    ctx.fillRect(x + 24, y + 54, 8, 4);

    // — Ombros largos —
    ctx.fillStyle = '#3D2215';
    ctx.fillRect(x + 4, y + 28, 8, 12);
    ctx.fillRect(x + 44, y + 28, 8, 12);

    // — Braços —
    ctx.fillStyle = '#3D2215';
    ctx.fillRect(x + 2, y + 34, 8, 20);
    ctx.fillRect(x + 46, y + 34, 8, 20);

    // Mãos
    ctx.fillStyle = '#8B6E52';
    ctx.fillRect(x + 3, y + 52, 6, 5);
    ctx.fillRect(x + 47, y + 52, 6, 5);

    // — Pano no ombro esquerdo —
    ctx.fillStyle = '#6B5842';
    ctx.fillRect(x + 4, y + 28, 10, 6);
    ctx.fillStyle = '#5A4835';
    ctx.fillRect(x + 2, y + 32, 8, 4);

    // — Pescoço —
    ctx.fillStyle = '#8B6E52';
    ctx.fillRect(x + 22, y + 24, 12, 6);

    // — Cabeça —
    const headX = x + 16;
    const headY = y + 4;
    ctx.fillStyle = '#8B6E52';
    ctx.fillRect(headX, headY, 24, 22);

    // Cabelo curto escuro
    ctx.fillStyle = '#2C1A0E';
    ctx.fillRect(headX - 1, headY - 2, 26, 8);
    ctx.fillRect(headX - 2, headY + 2, 3, 10);
    ctx.fillRect(headX + 23, headY + 2, 3, 10);

    // Sobrancelhas grossas
    ctx.fillStyle = '#1A0F08';
    ctx.fillRect(headX + 4, headY + 8, 6, 2);
    ctx.fillRect(headX + 14, headY + 8, 6, 2);

    // Olhos — escuros, observadores
    ctx.fillStyle = '#0D0A1F';
    ctx.fillRect(headX + 5, headY + 11, 4, 3);
    ctx.fillRect(headX + 15, headY + 11, 4, 3);
    // Pupila
    ctx.fillStyle = '#3A2510';
    ctx.fillRect(headX + 6, headY + 12, 2, 2);
    ctx.fillRect(headX + 16, headY + 12, 2, 2);

    // Nariz
    ctx.fillStyle = '#7A5F45';
    ctx.fillRect(headX + 10, headY + 13, 4, 4);

    // Barba curta
    ctx.fillStyle = '#2C1A0E';
    ctx.fillRect(headX + 2, headY + 17, 20, 5);
    ctx.fillStyle = '#3A2510';
    ctx.fillRect(headX + 4, headY + 18, 16, 3);

    // — Ícone [E] —
    if (this._showInteract) {
      ctx.fillStyle = 'rgba(10, 22, 40, 0.85)';
      ctx.fillRect(x + W / 2 - 14, y - 28, 28, 22);
      ctx.fillStyle = '#F5E6C8';
      ctx.font = '14px "Press Start 2P", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText('E', x + W / 2, y - 26);
    }
  }
}
