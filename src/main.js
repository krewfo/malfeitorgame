// src/main.js
// Ponto de entrada do MALFEITOR.
// Inicializa todos os sistemas, carrega dados, e inicia o game loop.
// Stack: JavaScript Vanilla + Canvas 2D. Zero frameworks, zero bundlers.

import { clear } from './engine/renderer.js';
import { InputSystem } from './engine/input.js';
import { injectDayGetter } from './systems/FlagSystem.js';
import * as TrustSystem from './systems/TrustSystem.js';
import { loadAct } from './systems/DialogueSystem.js';
import { TimeSystem } from './systems/TimeSystem.js';
import { SceneManager } from './scenes/SceneManager.js';
import { load as loadSave } from './engine/save.js';
import { HUD } from './ui/HUD.js';
import { AudioManager } from './engine/audio.js';
import { EventSystem } from './systems/EventSystem.js';
import { EconomySystem } from './systems/EconomySystem.js';

let lastTime = 0;
let running = false;

/**
 * Game loop — requestAnimationFrame.
 * Delta time em segundos.
 */
function gameLoop(timestamp) {
  if (!running) return;

  const dt = Math.min((timestamp - lastTime) / 1000, 0.1); // cap a 100ms
  lastTime = timestamp;

  // Update
  SceneManager.update(dt);

  // Render
  clear();
  SceneManager.render();

  // Flush input (justPressed limpa após 1 frame)
  InputSystem.flush();

  requestAnimationFrame(gameLoop);
}

/**
 * Inicialização completa do jogo.
 */
async function init() {
  console.log('🎮 MALFEITOR — Inicializando...');

  // Injetar getter de dia no FlagSystem (evita dependência circular)
  injectDayGetter(() => TimeSystem.day);

  // Inicializar sistemas
  await TrustSystem.init();
  await loadAct(1, 1);

  // Inicializar áudio
  AudioManager.init();

  // Carregar eventos agendados
  await EventSystem.loadEvents('data/events/act1_events.json');

  // Tentar carregar save existente
  const hasSave = loadSave();
  if (hasSave) {
    console.log('💾 Save carregado com sucesso.');
  } else {
    console.log('🆕 Novo jogo iniciado.');
  }

  // Inicializar HUD
  HUD.update();

  // Wiring: EventSystem notifications → HUD
  EventSystem.on('notification', (text) => {
    const msg = text.replace('{gold}', String(EconomySystem.gold));
    HUD.notify(msg, 'info', 4000);
  });

  // Inicializar cena — começa na taverna (Dia 1, quarto)
  await SceneManager.init('tavern');

  // Iniciar game loop
  running = true;
  lastTime = performance.now();
  requestAnimationFrame(gameLoop);

  console.log('✅ MALFEITOR — Pronto.');
}

// Iniciar quando o DOM estiver carregado
init().catch(err => {
  console.error('❌ Erro na inicialização:', err);
});
