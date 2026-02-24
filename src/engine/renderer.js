// src/engine/renderer.js
// Motor de renderização — Canvas 2D, 1920×1080 Full HD, escala via CSS.
// Lógica do jogo opera em 1280×720, ctx.scale(1.5) mapeia para Full HD.
// imageSmoothingEnabled = false SEMPRE — regra absoluta.

const canvas = document.getElementById('game-canvas');
const ctx    = canvas.getContext('2d');

// Resolução lógica (coordenadas do jogo)
export const W = 1280;
export const H = 720;

// Fator de escala para Full HD (1920/1280 = 1080/720 = 1.5)
const SCALE = 1.5;

// Resolução física Full HD
canvas.width  = Math.floor(W * SCALE);  // 1920
canvas.height = Math.floor(H * SCALE);  // 1080

// Garantir pixel art nítido — nunca remover
ctx.imageSmoothingEnabled = false;

// Aplicar escala Full HD
ctx.setTransform(SCALE, 0, 0, SCALE, 0, 0);

/**
 * Ajusta escala CSS do canvas para preencher a janela mantendo proporção 16:9.
 * Chamado no init e em cada resize.
 */
function setCanvasScale() {
  const pw = canvas.width;   // 1920
  const ph = canvas.height;  // 1080
  const scale = Math.min(window.innerWidth / pw, window.innerHeight / ph);
  canvas.style.width  = Math.floor(pw * scale) + 'px';
  canvas.style.height = Math.floor(ph * scale) + 'px';
}

window.addEventListener('resize', setCanvasScale);
setCanvasScale();

/**
 * Limpa o canvas inteiro.
 */
export function clear(color = '#0D0A1F') {
  // Resetar transform a cada frame para evitar acúmulo
  ctx.setTransform(SCALE, 0, 0, SCALE, 0, 0);
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, W, H);
}

/**
 * Desenha um retângulo preenchido (placeholder de sprite).
 */
export function drawRect(x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.floor(x), Math.floor(y), w, h);
}

/**
 * Desenha retângulo com borda (para debug de hitboxes).
 */
export function drawRectOutline(x, y, w, h, color = '#FF0000') {
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.strokeRect(Math.floor(x) + 0.5, Math.floor(y) + 0.5, w, h);
}

/**
 * Desenha sprite de uma imagem. Se a imagem não existir, desenha placeholder colorido.
 * @param {HTMLImageElement|null} img
 * @param {number} sx - source x
 * @param {number} sy - source y
 * @param {number} sw - source width
 * @param {number} sh - source height
 * @param {number} dx - dest x
 * @param {number} dy - dest y
 * @param {number} dw - dest width
 * @param {number} dh - dest height
 * @param {string} fallbackColor - cor do placeholder se img ausente
 */
export function drawSprite(img, sx, sy, sw, sh, dx, dy, dw, dh, fallbackColor = '#C8C8C8') {
  // Regra: imageSmoothingEnabled = false — nunca suavizar
  ctx.imageSmoothingEnabled = false;

  if (img && img.complete && img.naturalWidth > 0) {
    ctx.drawImage(img, sx, sy, sw, sh, Math.floor(dx), Math.floor(dy), dw, dh);
  } else {
    // Placeholder: retângulo colorido por personagem (Regra 14)
    drawRect(dx, dy, dw, dh, fallbackColor);
  }
}

/**
 * Desenha texto pixel art.
 */
export function drawText(text, x, y, size = 6, color = '#ECF0F1', align = 'left') {
  ctx.font = `${size}px "Press Start 2P", monospace`;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = 'top';
  ctx.fillText(text, Math.floor(x), Math.floor(y));
}

/**
 * Fade in/out via overlay CSS.
 */
export function fadeIn(duration = 500) {
  return new Promise(resolve => {
    const overlay = document.getElementById('fade-overlay');
    overlay.style.transition = `opacity ${duration}ms ease`;
    overlay.classList.add('active');
    setTimeout(resolve, duration);
  });
}

export function fadeOut(duration = 500) {
  return new Promise(resolve => {
    const overlay = document.getElementById('fade-overlay');
    overlay.style.transition = `opacity ${duration}ms ease`;
    overlay.classList.remove('active');
    setTimeout(resolve, duration);
  });
}

/**
 * Retorna o contexto 2D para uso direto quando necessário.
 */
export function getCtx() {
  return ctx;
}

/**
 * Retorna o elemento canvas.
 */
export function getCanvas() {
  return canvas;
}
