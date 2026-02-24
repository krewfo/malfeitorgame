// src/actors/Player.js
// Malfeitor — personagem jogável.  1280×720 resolution.
// REGRA: Malfeitor NUNCA corre. Shift é ignorado. Máximo absoluto: +5% após 2s segurando direcional.
// Sprite ~88px de altura, silhueta sombria com capuz volumoso.

import * as Input from '../engine/input.js';
import { W, H } from '../engine/renderer.js';
import { Atmosphere } from '../engine/atmosphere.js';

function overlaps(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x &&
         a.y < b.y + b.h && a.y + a.h > b.y;
}

export class Player {
  constructor(x = 320, y = 360) {
    this.x = x;
    this.y = y;
    this.speed = 224; // px/s — fixo (56*4 scaled)
    this.spriteW = 56;
    this.spriteH = 88;
    this.hitbox = { w: 32, h: 24, ox: 12, oy: 64 };
    this.dir = 'down'; // up|down|left|right
    this.frame = 0;
    this._holdTime = 0;
    this._animTimer = 0;
    this._breathTimer = 0;
    this.id = 'malfeitor';
  }

  update(dt, colliders) {
    const ax = Input.axis('x');
    const ay = Input.axis('y');

    this._holdTime = (ax !== 0 || ay !== 0) ? this._holdTime + dt : 0;
    const speedMod = this._holdTime > 2 ? 1.05 : 1.0;
    const spd = this.speed * speedMod;

    let mx = ax;
    let my = ay;
    if (mx !== 0 && my !== 0) {
      const diag = 1 / Math.sqrt(2);
      mx *= diag;
      my *= diag;
    }

    const nx = this.x + mx * spd * dt;
    const ny = this.y + my * spd * dt;

    const hbX = { x: nx + this.hitbox.ox, y: this.y + this.hitbox.oy, w: this.hitbox.w, h: this.hitbox.h };
    const hbY = { x: this.x + this.hitbox.ox, y: ny + this.hitbox.oy, w: this.hitbox.w, h: this.hitbox.h };

    this.x = colliders.some(c => overlaps(hbX, c)) ? this.x : nx;
    this.y = colliders.some(c => overlaps(hbY, c)) ? this.y : ny;

    this.x = Math.max(0, Math.min(W - this.spriteW, this.x));
    this.y = Math.max(0, Math.min(H - this.spriteH, this.y));

    if (ax !== 0 || ay !== 0) {
      if      (ay < 0) this.dir = 'up';
      else if (ay > 0) this.dir = 'down';
      else if (ax < 0) this.dir = 'left';
      else             this.dir = 'right';

      this._animTimer += dt;
      if (this._animTimer >= 0.18) {
        this._animTimer = 0;
        this.frame = (this.frame + 1) % 4;
      }
    } else {
      this.frame = 0;
      this._animTimer = 0;
    }

    this._breathTimer += dt;
  }

  getHitbox() {
    return {
      x: this.x + this.hitbox.ox,
      y: this.y + this.hitbox.oy,
      w: this.hitbox.w,
      h: this.hitbox.h,
    };
  }

  getFeetCenter() {
    return {
      x: this.x + this.spriteW / 2,
      y: this.y + this.hitbox.oy,
    };
  }

  render(ctx) {
    const x = Math.floor(this.x);
    const y = Math.floor(this.y);
    const breathOff = Math.sin(this._breathTimer * 1.8) * 1;
    const walkBob = (this.frame % 2 === 1 && this._animTimer > 0) ? -1 : 0;
    const yy = y + walkBob;

    // ─── Sombra elíptica ────────────────────
    Atmosphere.renderShadow(ctx, x + this.spriteW / 2, y + this.spriteH, 52);

    // ─── STAFF / CAJADO COM CRÂNIO ──────────
    // O cajado é renderizado atrás ou na frente dependendo da direção
    const staffSide = (this.dir === 'left') ? -1 : 1;
    const staffX = (this.dir === 'left') ? x - 6 : x + 48;
    const staffBob = Math.sin(this._breathTimer * 1.8) * 0.5;

    // Renderiza cajado atrás se olhando para cima
    if (this.dir === 'up') {
      this._renderStaff(ctx, x + 46, yy + staffBob, breathOff);
    }

    // ─── Pernas ─────────────────────────────
    ctx.fillStyle = '#1A1225';
    const legSpread = this.frame % 2 === 1 ? 3 : 0;
    ctx.fillRect(x + 16 - legSpread, yy + 68, 10, 18);
    ctx.fillRect(x + 30 + legSpread, yy + 68, 10, 18);
    // Botas — couro escuro com sola
    ctx.fillStyle = '#2C1A0E';
    ctx.fillRect(x + 14 - legSpread, yy + 82, 14, 6);
    ctx.fillRect(x + 28 + legSpread, yy + 82, 14, 6);
    // Sole highlight
    ctx.fillStyle = '#1A1008';
    ctx.fillRect(x + 14 - legSpread, yy + 86, 14, 2);
    ctx.fillRect(x + 28 + legSpread, yy + 86, 14, 2);

    // ─── Corpo / Túnica com camadas ─────────
    ctx.fillStyle = '#161022';
    ctx.fillRect(x + 10, yy + 34 + breathOff, 36, 36);
    // Sombra na túnica (lado escuro)
    ctx.fillStyle = '#0D0A17';
    ctx.fillRect(x + 10, yy + 34 + breathOff, 12, 36);
    // Folds/creases
    ctx.fillStyle = '#120E1E';
    ctx.fillRect(x + 22, yy + 40 + breathOff, 2, 28);
    ctx.fillRect(x + 32, yy + 42 + breathOff, 2, 20);
    // Belt
    ctx.fillStyle = '#3A2A18';
    ctx.fillRect(x + 10, yy + 52 + breathOff, 36, 4);
    ctx.fillStyle = '#6B5B3D';
    ctx.fillRect(x + 24, yy + 51 + breathOff, 8, 6);

    // ─── Capa com volume (elemento dominante) ───
    ctx.fillStyle = '#1E1438';
    // Capa esquerda
    ctx.fillRect(x + 2, yy + 18 + breathOff, 16, 62);
    // Capa direita
    ctx.fillRect(x + 38, yy + 18 + breathOff, 16, 62);
    // Drape da capa por trás
    if (this.dir === 'down' || this.dir === 'left' || this.dir === 'right') {
      ctx.fillStyle = '#150F28';
      ctx.fillRect(x + 6, yy + 24 + breathOff, 44, 56);
    }
    // Cape edge detail (frayed bottom)
    ctx.fillStyle = '#120D22';
    ctx.fillRect(x + 4, yy + 76 + breathOff, 4, 4);
    ctx.fillRect(x + 12, yy + 78 + breathOff, 3, 3);
    ctx.fillRect(x + 40, yy + 77 + breathOff, 4, 3);
    ctx.fillRect(x + 48, yy + 76 + breathOff, 3, 4);
    // Cape fold lines
    ctx.fillStyle = '#1A1230';
    ctx.fillRect(x + 8, yy + 30 + breathOff, 2, 40);
    ctx.fillRect(x + 44, yy + 28 + breathOff, 2, 38);

    // ─── Capuz volumoso (mais detalhado) ─────
    ctx.fillStyle = '#1E1438';
    ctx.fillRect(x + 8, yy + 2, 40, 34);
    // Volume do capuz (borda com highlight)
    ctx.fillStyle = '#281C4A';
    ctx.fillRect(x + 6, yy, 44, 6);
    ctx.fillRect(x + 4, yy + 4, 6, 26);
    ctx.fillRect(x + 46, yy + 4, 6, 26);
    // Hood edge highlighting (top light catch)
    ctx.fillStyle = '#321E58';
    ctx.fillRect(x + 8, yy, 40, 2);
    // Interior escuro do capuz
    ctx.fillStyle = '#08060F';
    ctx.fillRect(x + 12, yy + 6, 32, 26);

    // ─── Rosto na sombra ────────────────────
    // Skin — mostly hidden in shadow
    ctx.fillStyle = '#7A5E42';
    ctx.fillRect(x + 16, yy + 12, 24, 16);
    // Deep shadow over upper face from hood
    ctx.fillStyle = 'rgba(8, 6, 15, 0.8)';
    ctx.fillRect(x + 12, yy + 6, 32, 14);

    // Olhos — glowing, piercing
    const eyeGlow = 0.8 + Math.sin(this._breathTimer * 2) * 0.15;
    if (this.dir === 'left') {
      ctx.fillStyle = `rgba(200,176,120,${eyeGlow})`;
      ctx.fillRect(x + 17, yy + 18, 4, 3);
      ctx.fillRect(x + 26, yy + 18, 4, 3);
      // Eye gleam
      ctx.fillStyle = '#F0E0C0';
      ctx.fillRect(x + 18, yy + 18, 1, 1);
      ctx.fillRect(x + 27, yy + 18, 1, 1);
    } else if (this.dir === 'right') {
      ctx.fillStyle = `rgba(200,176,120,${eyeGlow})`;
      ctx.fillRect(x + 26, yy + 18, 4, 3);
      ctx.fillRect(x + 35, yy + 18, 4, 3);
      ctx.fillStyle = '#F0E0C0';
      ctx.fillRect(x + 27, yy + 18, 1, 1);
      ctx.fillRect(x + 36, yy + 18, 1, 1);
    } else if (this.dir === 'up') {
      // De costas — sem olhos
    } else {
      // Down — staring forward
      ctx.fillStyle = `rgba(200,176,120,${eyeGlow})`;
      ctx.fillRect(x + 20, yy + 18, 4, 3);
      ctx.fillRect(x + 32, yy + 18, 4, 3);
      // Gleam
      ctx.fillStyle = '#F0E0C0';
      ctx.fillRect(x + 21, yy + 18, 1, 1);
      ctx.fillRect(x + 33, yy + 18, 1, 1);
    }

    // ─── Mãos ───────────────────────────────
    ctx.fillStyle = '#7A5E42';
    if (this.dir === 'left') {
      ctx.fillRect(x + 4, yy + 54 + breathOff, 6, 7);
      // Staff hand
      ctx.fillRect(x - 4, yy + 50 + breathOff, 6, 7);
    } else if (this.dir === 'right') {
      ctx.fillRect(x + 46, yy + 54 + breathOff, 6, 7);
      ctx.fillRect(x + 50, yy + 50 + breathOff, 6, 7);
    } else {
      ctx.fillRect(x + 4, yy + 54 + breathOff, 6, 7);
      ctx.fillRect(x + 46, yy + 54 + breathOff, 6, 7);
    }

    // ─── Detalhes da capa ──────────────────
    // Seam line
    ctx.fillStyle = '#261A45';
    ctx.fillRect(x + 27, yy + 34 + breathOff, 2, 32);
    // Brooch — ornate
    ctx.fillStyle = '#8B7530';
    ctx.fillRect(x + 24, yy + 31 + breathOff, 8, 5);
    ctx.fillStyle = '#D4AC0D';
    ctx.fillRect(x + 26, yy + 32 + breathOff, 4, 3);
    // Gem on brooch
    ctx.fillStyle = '#5B2D8E';
    ctx.fillRect(x + 27, yy + 32 + breathOff, 2, 2);

    // ─── STAFF na frente (exceto olhando pra cima) ──
    if (this.dir !== 'up') {
      this._renderStaff(ctx, staffX, yy + staffBob, breathOff);
    }
  }

  /**
   * Renderiza o cajado com crânio na ponta.
   */
  _renderStaff(ctx, sx, yy, breathOff) {
    // Shaft (dark wood, gnarled)
    ctx.fillStyle = '#2C1A0E';
    ctx.fillRect(sx, yy + 10, 5, 78);
    // Wood detail/knots
    ctx.fillStyle = '#3A2412';
    ctx.fillRect(sx + 1, yy + 14, 3, 70);
    // Notch details
    ctx.fillStyle = '#221408';
    ctx.fillRect(sx, yy + 30, 5, 2);
    ctx.fillRect(sx, yy + 50, 5, 2);
    ctx.fillRect(sx, yy + 70, 5, 2);

    // Wrapped grip area
    ctx.fillStyle = '#4A3A28';
    for (let gy = 44; gy < 60; gy += 4) {
      ctx.fillRect(sx - 1, yy + gy + breathOff, 7, 3);
    }

    // ─── SKULL on top ───
    // Skull base
    ctx.fillStyle = '#C8B890';
    ctx.fillRect(sx - 4, yy - 4, 13, 14);
    // Top of skull (rounded)
    ctx.fillStyle = '#D4C8A0';
    ctx.fillRect(sx - 3, yy - 8, 11, 6);
    ctx.fillRect(sx - 1, yy - 10, 7, 4);
    // Eye sockets
    ctx.fillStyle = '#0A0605';
    ctx.fillRect(sx - 2, yy - 2, 4, 4);
    ctx.fillRect(sx + 4, yy - 2, 4, 4);
    // Nose cavity
    ctx.fillRect(sx + 1, yy + 3, 3, 3);
    // Jaw
    ctx.fillStyle = '#B8A880';
    ctx.fillRect(sx - 3, yy + 7, 11, 4);
    // Teeth
    ctx.fillStyle = '#E0D8C0';
    ctx.fillRect(sx - 2, yy + 7, 2, 2);
    ctx.fillRect(sx + 1, yy + 7, 2, 2);
    ctx.fillRect(sx + 4, yy + 7, 2, 2);
    ctx.fillRect(sx + 7, yy + 7, 2, 2);
    // Skull shadow
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.fillRect(sx - 4, yy, 4, 10);
  }
}
