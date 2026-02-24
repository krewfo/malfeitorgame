// src/actors/Aldric.js
// Frei Aldric — 67 anos. Ex-mago da corte de Valdris. 1280×720 cinematic sprite (52×84).
// Salvou Malfeitor por culpa própria. Frases sempre com duplo sentido.
// Hábito cinza longo, faixa roxa mística, barba branca, olhos sábios.

import { NPC } from './NPC.js';
import { Atmosphere } from '../engine/atmosphere.js';

export class Aldric extends NPC {
  constructor(x = 640, y = 360) {
    super('aldric', x, y);
    this.displayName = 'Frei Aldric';
    this.age = 67;
  }

  render(ctx) {
    if (!this.visible) return;

    const x = Math.floor(this.x);
    const y = Math.floor(this.y);
    const W = this.spriteW;  // 52
    const H = this.spriteH;  // 84

    // — Sombra —
    Atmosphere.renderShadow(ctx, x + W / 2, y + H, W * 0.85);

    // — Sandálias —
    ctx.fillStyle = '#2C1A0E';
    ctx.fillRect(x + 14, y + 72, 10, 12);
    ctx.fillRect(x + 28, y + 72, 10, 12);
    // Meias de lã
    ctx.fillStyle = '#4B4540';
    ctx.fillRect(x + 15, y + 70, 8, 6);
    ctx.fillRect(x + 29, y + 70, 8, 6);

    // — Hábito cinza longo —
    ctx.fillStyle = '#2D3340';
    ctx.fillRect(x + 8, y + 24, 36, 50);
    // Saia do hábito (levemente alargada)
    ctx.fillRect(x + 6, y + 54, 40, 20);

    // Dobras do tecido
    ctx.fillStyle = '#252B35';
    ctx.fillRect(x + 16, y + 30, 2, 44);
    ctx.fillRect(x + 34, y + 30, 2, 44);

    // — Faixa central mística (roxa) —
    ctx.fillStyle = '#9B8AC0';
    ctx.fillRect(x + 22, y + 28, 8, 46);
    // Símbolo na faixa
    ctx.fillStyle = '#7B6AA0';
    ctx.fillRect(x + 24, y + 40, 4, 4);
    ctx.fillRect(x + 23, y + 42, 6, 2);

    // — Cinto de corda —
    ctx.fillStyle = '#5A4830';
    ctx.fillRect(x + 10, y + 52, 32, 3);
    // Nó pendente
    ctx.fillRect(x + 20, y + 55, 4, 8);
    ctx.fillRect(x + 18, y + 61, 8, 3);

    // — Mangas largas —
    ctx.fillStyle = '#2D3340';
    ctx.fillRect(x + 2, y + 28, 10, 24);
    ctx.fillRect(x + 40, y + 28, 10, 24);
    // Abertura das mangas
    ctx.fillStyle = '#252B35';
    ctx.fillRect(x + 2, y + 48, 10, 4);
    ctx.fillRect(x + 40, y + 48, 10, 4);

    // Mãos envelhecidas
    ctx.fillStyle = '#B8956A';
    ctx.fillRect(x + 4, y + 50, 6, 5);
    ctx.fillRect(x + 42, y + 50, 6, 5);

    // — Pescoço —
    ctx.fillStyle = '#B8956A';
    ctx.fillRect(x + 20, y + 20, 12, 6);

    // — Cabeça —
    const headX = x + 14;
    const headY = y + 2;
    ctx.fillStyle = '#B8956A';
    ctx.fillRect(headX, headY, 24, 20);

    // Cabelo branco ralo
    ctx.fillStyle = '#C8C8C8';
    ctx.fillRect(headX - 1, headY - 2, 26, 6);
    // Lateral
    ctx.fillStyle = '#B0B0B0';
    ctx.fillRect(headX - 2, headY + 2, 3, 8);
    ctx.fillRect(headX + 23, headY + 2, 3, 8);

    // Sobrancelhas brancas grossas
    ctx.fillStyle = '#C8C8C8';
    ctx.fillRect(headX + 3, headY + 7, 6, 2);
    ctx.fillRect(headX + 15, headY + 7, 6, 2);

    // Olhos — profundos, sábios
    ctx.fillStyle = '#0D0A1F';
    ctx.fillRect(headX + 4, headY + 10, 4, 3);
    ctx.fillRect(headX + 16, headY + 10, 4, 3);
    // Brilho leve (conhecimento antigo)
    ctx.fillStyle = '#9B8AC0';
    ctx.fillRect(headX + 5, headY + 10, 2, 2);
    ctx.fillRect(headX + 17, headY + 10, 2, 2);

    // Nariz proeminente
    ctx.fillStyle = '#A07B5A';
    ctx.fillRect(headX + 10, headY + 12, 4, 5);

    // Barba branca longa
    ctx.fillStyle = '#C8C8C8';
    ctx.fillRect(headX + 4, headY + 16, 16, 10);
    ctx.fillStyle = '#B0B0B0';
    ctx.fillRect(headX + 6, headY + 18, 12, 8);
    // Ponta da barba
    ctx.fillStyle = '#C8C8C8';
    ctx.fillRect(headX + 8, headY + 24, 8, 4);

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
