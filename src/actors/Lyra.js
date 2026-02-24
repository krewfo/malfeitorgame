// src/actors/Lyra.js
// Lyra — 13 anos. Pai morto no Saque de Edenvale. 1280×720 cinematic sprite (44×72).
// Começa hostil. Uma mentira detectada fecha o arco dela PERMANENTEMENTE.
// Pequena, magra, cabelo longo castanho, roupas simples azuis remendadas.

import { NPC } from './NPC.js';
import { Atmosphere } from '../engine/atmosphere.js';

export class Lyra extends NPC {
  constructor(x = 640, y = 400) {
    super('lyra', x, y);
    this.displayName = 'Lyra';
    this.age = 13;
  }

  render(ctx) {
    if (!this.visible) return;

    const x = Math.floor(this.x);
    const y = Math.floor(this.y);
    const W = this.spriteW;  // 44
    const H = this.spriteH;  // 72

    // — Sombra —
    Atmosphere.renderShadow(ctx, x + W / 2, y + H, W * 0.8);

    // — Sapatos simples —
    ctx.fillStyle = '#1A1510';
    ctx.fillRect(x + 10, y + 62, 9, 10);
    ctx.fillRect(x + 25, y + 62, 9, 10);

    // — Vestido azul escuro (até joelhos) —
    ctx.fillStyle = '#1A3A6B';
    ctx.fillRect(x + 8, y + 28, 28, 36);

    // Saia se alarga
    ctx.fillRect(x + 6, y + 48, 32, 16);

    // Remendos no vestido
    ctx.fillStyle = '#2A4A7B';
    ctx.fillRect(x + 12, y + 38, 6, 6);
    ctx.fillRect(x + 26, y + 50, 5, 5);

    // Costura visível
    ctx.fillStyle = '#4A7CBF';
    ctx.fillRect(x + 14, y + 40, 2, 2);
    ctx.fillRect(x + 28, y + 52, 2, 2);

    // — Cinto de corda fino —
    ctx.fillStyle = '#5A4830';
    ctx.fillRect(x + 8, y + 44, 28, 2);

    // — Braços finos —
    ctx.fillStyle = '#1A3A6B';
    ctx.fillRect(x + 4, y + 30, 6, 16);
    ctx.fillRect(x + 34, y + 30, 6, 16);

    // Mãos pequenas
    ctx.fillStyle = '#B8956A';
    ctx.fillRect(x + 4, y + 44, 5, 4);
    ctx.fillRect(x + 35, y + 44, 5, 4);

    // — Pescoço —
    ctx.fillStyle = '#B8956A';
    ctx.fillRect(x + 17, y + 22, 10, 6);

    // — Cabeça —
    const headX = x + 12;
    const headY = y + 2;
    ctx.fillStyle = '#B8956A';
    ctx.fillRect(headX, headY, 20, 20);

    // Cabelo castanho longo
    ctx.fillStyle = '#5C3317';
    ctx.fillRect(headX - 2, headY - 2, 24, 8);
    // Mechas laterais longas
    ctx.fillRect(headX - 3, headY + 4, 4, 24);
    ctx.fillRect(headX + 19, headY + 4, 4, 24);
    // Topo
    ctx.fillRect(headX, headY - 3, 20, 4);

    // Sobrancelhas franzidas (hostil)
    ctx.fillStyle = '#3A2010';
    ctx.fillRect(headX + 3, headY + 7, 5, 2);
    ctx.fillRect(headX + 12, headY + 7, 5, 2);

    // Olhos — desconfiados, grandes
    ctx.fillStyle = '#0D0A1F';
    ctx.fillRect(headX + 4, headY + 10, 4, 3);
    ctx.fillRect(headX + 12, headY + 10, 4, 3);
    // Brilho
    ctx.fillStyle = '#4A7CBF';
    ctx.fillRect(headX + 5, headY + 10, 2, 2);
    ctx.fillRect(headX + 13, headY + 10, 2, 2);

    // Nariz pequeno
    ctx.fillStyle = '#A07B5A';
    ctx.fillRect(headX + 9, headY + 12, 3, 3);

    // Boca — cerrada
    ctx.fillStyle = '#8A5540';
    ctx.fillRect(headX + 7, headY + 16, 6, 2);

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
