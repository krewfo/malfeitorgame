// src/engine/input.js
// Sistema de input — teclado.
// Axis x/y para movimento (WASD + Arrows).
// Ações: E/Enter para interagir, Espaço para avançar diálogo.
// REGRA: Shift NÃO aumenta velocidade. Malfeitor nunca corre.

const _keys = {};
const _justPressed = {};

document.addEventListener('keydown', e => {
  if (!_keys[e.code]) {
    _justPressed[e.code] = true;
  }
  _keys[e.code] = true;
});

document.addEventListener('keyup', e => {
  _keys[e.code] = false;
});

/**
 * Retorna eixo de movimento: -1, 0, ou 1.
 * @param {'x'|'y'} axis
 */
export function axis(a) {
  if (a === 'x') {
    const l = _keys['ArrowLeft']  || _keys['KeyA'] ? -1 : 0;
    const r = _keys['ArrowRight'] || _keys['KeyD'] ?  1 : 0;
    return l + r;
  }
  if (a === 'y') {
    const u = _keys['ArrowUp']   || _keys['KeyW'] ? -1 : 0;
    const d = _keys['ArrowDown'] || _keys['KeyS'] ?  1 : 0;
    return u + d;
  }
  return 0;
}

/**
 * Verifica se uma tecla está pressionada.
 */
export function isDown(code) {
  return !!_keys[code];
}

/**
 * Verifica se uma tecla foi acabada de pressionar (1 frame).
 */
export function justPressed(code) {
  return !!_justPressed[code];
}

/**
 * Verifica se a ação de interagir foi ativada (E ou Enter).
 */
export function interactPressed() {
  return justPressed('KeyE') || justPressed('Enter');
}

/**
 * Limpar justPressed — chamado uma vez por frame no fim do update.
 */
export function flush() {
  for (const k of Object.keys(_justPressed)) {
    delete _justPressed[k];
  }
}

/**
 * Exportar referência ao InputSystem para compatibilidade com Player.js
 */
export const InputSystem = {
  axis,
  isDown,
  justPressed,
  interactPressed,
  flush,
};
