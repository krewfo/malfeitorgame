// src/actors/Davi.js
// Davi — 38 anos. Herbalista. 1280×720 cinematic sprite (52×84).
// Ervas medicinais e "venenos não-venenos". Roupas de trabalho verdes.
// Faixas com ervas, avental manchado de terra, mãos sujas.

import { NPC } from './NPC.js';
import { Atmosphere } from '../engine/atmosphere.js';

export class Davi extends NPC {
  constructor(x = 560, y = 440) {
    super('davi', x, y);
    this.displayName = 'Davi';
    this.age = 38;
  }

  render(ctx) {
    if (!this.visible) return;

    const x = Math.floor(this.x);
    const y = Math.floor(this.y);
    const W = this.spriteW;  // 52
    const H = this.spriteH;  // 84

    // — Sombra —
    Atmosphere.renderShadow(ctx, x + W / 2, y + H, W * 0.85);

    // — Botas de trabalho (com terra) —
    ctx.fillStyle = '#1A140E';
    ctx.fillRect(x + 12, y + 70, 12, 14);
    ctx.fillRect(x + 28, y + 70, 12, 14);
    // Manchas de terra
    ctx.fillStyle = '#3A2A18';
    ctx.fillRect(x + 14, y + 78, 4, 4);
    ctx.fillRect(x + 32, y + 76, 3, 3);

    // — Calças de linho —
    ctx.fillStyle = '#2A3A28';
    ctx.fillRect(x + 12, y + 52, 14, 20);
    ctx.fillRect(x + 26, y + 52, 14, 20);

    // Joelheiras gastas
    ctx.fillStyle = '#3A4A38';
    ctx.fillRect(x + 14, y + 58, 8, 6);
    ctx.fillRect(x + 30, y + 58, 8, 6);

    // — Torso — camisa verde escuro —
    ctx.fillStyle = '#1A4A3A';
    ctx.fillRect(x + 8, y + 24, 36, 30);

    // — Avental de trabalho manchado —
    ctx.fillStyle = '#2D5A48';
    ctx.fillRect(x + 14, y + 30, 24, 26);
    // Manchas de ervas / terra
    ctx.fillStyle = '#2D8B6A';
    ctx.fillRect(x + 18, y + 36, 4, 3);
    ctx.fillRect(x + 28, y + 42, 5, 3);
    ctx.fillStyle = '#4A6840';
    ctx.fillRect(x + 22, y + 48, 3, 3);

    // — Cinto utilitário —
    ctx.fillStyle = '#2C1A0E';
    ctx.fillRect(x + 10, y + 50, 32, 4);
    // Bolsinhas de ervas penduradas
    ctx.fillStyle = '#3A2A18';
    ctx.fillRect(x + 12, y + 54, 6, 5);
    ctx.fillRect(x + 34, y + 54, 6, 5);
    // Cordão
    ctx.fillStyle = '#5A4830';
    ctx.fillRect(x + 14, y + 50, 2, 6);
    ctx.fillRect(x + 36, y + 50, 2, 6);

    // — Braços —
    ctx.fillStyle = '#1A4A3A';
    ctx.fillRect(x + 2, y + 28, 10, 20);
    ctx.fillRect(x + 40, y + 28, 10, 20);
    // Mangas arregaçadas
    ctx.fillStyle = '#1A3A2E';
    ctx.fillRect(x + 2, y + 40, 10, 4);
    ctx.fillRect(x + 40, y + 40, 10, 4);

    // Mãos sujas de terra
    ctx.fillStyle = '#8B6E52';
    ctx.fillRect(x + 3, y + 46, 7, 5);
    ctx.fillRect(x + 42, y + 46, 7, 5);
    ctx.fillStyle = '#5A4830';
    ctx.fillRect(x + 4, y + 48, 4, 2);
    ctx.fillRect(x + 43, y + 48, 4, 2);

    // — Faixa de ervas no braço —
    ctx.fillStyle = '#2D8B6A';
    ctx.fillRect(x + 2, y + 32, 10, 2);
    ctx.fillRect(x + 40, y + 32, 10, 2);

    // — Pescoço —
    ctx.fillStyle = '#8B6E52';
    ctx.fillRect(x + 20, y + 20, 12, 6);

    // — Cabeça —
    const headX = x + 14;
    const headY = y + 2;
    ctx.fillStyle = '#8B6E52';
    ctx.fillRect(headX, headY, 24, 20);

    // Cabelo escuro curto, bagunçado
    ctx.fillStyle = '#2C1A0E';
    ctx.fillRect(headX - 1, headY - 2, 26, 7);
    ctx.fillRect(headX + 2, headY - 3, 4, 3); // Fio rebelde
    ctx.fillRect(headX + 18, headY - 3, 3, 3);

    // Sobrancelhas
    ctx.fillStyle = '#1A0F08';
    ctx.fillRect(headX + 4, headY + 7, 5, 2);
    ctx.fillRect(headX + 15, headY + 7, 5, 2);

    // Olhos — focados, perceptivos
    ctx.fillStyle = '#0D0A1F';
    ctx.fillRect(headX + 5, headY + 10, 4, 3);
    ctx.fillRect(headX + 15, headY + 10, 4, 3);
    // Iris verde escuro
    ctx.fillStyle = '#2D6B4A';
    ctx.fillRect(headX + 6, headY + 10, 2, 2);
    ctx.fillRect(headX + 16, headY + 10, 2, 2);

    // Nariz
    ctx.fillStyle = '#7A5F45';
    ctx.fillRect(headX + 10, headY + 12, 4, 4);

    // Boca — neutra
    ctx.fillStyle = '#6A4A38';
    ctx.fillRect(headX + 7, headY + 16, 10, 2);

    // Barba por fazer (stubble)
    ctx.fillStyle = '#3A2A1E';
    ctx.fillRect(headX + 4, headY + 15, 16, 2);

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
