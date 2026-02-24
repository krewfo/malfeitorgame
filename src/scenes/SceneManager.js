// src/scenes/SceneManager.js
// Gerencia cenas, transições, e triggers de diálogo automáticos.
// Auto-save em cada troca de cena (Regra 7).

import { Player } from '../actors/Player.js';
import { findAutoTrigger } from '../systems/DialogueSystem.js';
import { startDialogue, isActive as isDialogueActive } from '../ui/DialogueBox.js';
import { TimeSystem } from '../systems/TimeSystem.js';
import { save } from '../engine/save.js';
import { fadeIn, fadeOut } from '../engine/renderer.js';

// Mapeamento de nomes de cena para os módulos
const SCENE_MAP = {};
let _currentScene = null;
let _currentSceneName = '';
let _player = null;
let _initialized = false;
let _transitioning = false;

export const SceneManager = {
  async init(sceneName) {
    // Criar jogador
    _player = new Player(320, 360);

    // Carregar módulos de cena sob demanda
    await _ensureSceneLoaded('tavern');
    await _ensureSceneLoaded('town_square');
    await _ensureSceneLoaded('church');
    await _ensureSceneLoaded('herb_garden');
    await _ensureSceneLoaded('dream');

    // Carregar cena inicial
    await this.changeScene(sceneName, false);
    _initialized = true;

    // Verificar auto-triggers na cena inicial
    await this._checkAutoTriggers();
  },

  async changeScene(sceneName, withFade = true) {
    if (_transitioning) return;
    _transitioning = true;

    if (withFade) await fadeIn(400);

    // Sair da cena atual
    if (_currentScene) {
      _currentScene.exit();
    }

    // Auto-save em troca de cena (Regra 7)
    save();

    // Entrar na nova cena
    _currentSceneName = sceneName;
    _currentScene = SCENE_MAP[sceneName];
    if (_currentScene) {
      _currentScene.enter(_player);
    }

    if (withFade) await fadeOut(400);
    _transitioning = false;

    // Verificar auto-triggers
    await this._checkAutoTriggers();
  },

  async _checkAutoTriggers() {
    if (isDialogueActive()) return;

    // Mapear nome de cena para nome em diálogo
    const sceneDialogueMap = {
      'tavern': 'tavern',
      'town_square': 'town_square',
      'church': 'church',
      'herb_garden': 'herb_garden',
      'dream': 'dream',
    };
    const dialogueScene = sceneDialogueMap[_currentSceneName] ?? _currentSceneName;
    const triggerId = findAutoTrigger(dialogueScene, TimeSystem.day);
    if (triggerId) {
      await startDialogue(triggerId);
      // Auto-save após diálogo (Regra 7)
      save();
      // Verificar se há mais triggers
      await this._checkAutoTriggers();
    }
  },

  update(dt) {
    if (!_initialized || _transitioning) return;
    if (isDialogueActive()) return; // Congelar mundo durante diálogo

    if (_currentScene) {
      _currentScene.update(dt, _player);
    }
  },

  render() {
    if (!_initialized) return;
    if (_currentScene) {
      _currentScene.render(_player);
    }
  },

  getCurrentScene() { return _currentSceneName; },
  getPlayer() { return _player; },
};

/**
 * Carrega módulo de cena sob demanda e registra no mapa.
 */
async function _ensureSceneLoaded(name) {
  if (SCENE_MAP[name]) return;
  try {
    let mod;
    switch (name) {
      case 'tavern':
        mod = await import('./TavernScene.js');
        SCENE_MAP[name] = mod.TavernScene;
        break;
      case 'town_square':
        mod = await import('./TownSquareScene.js');
        SCENE_MAP[name] = mod.TownSquareScene;
        break;
      case 'church':
        mod = await import('./ChurchScene.js');
        SCENE_MAP[name] = mod.ChurchScene;
        break;
      case 'herb_garden':
        mod = await import('./HerbGardenScene.js');
        SCENE_MAP[name] = mod.HerbGardenScene;
        break;
      case 'dream':
        mod = await import('./DreamScene.js');
        SCENE_MAP[name] = mod.DreamScene;
        break;
    }
  } catch (e) {
    console.error(`SceneManager: erro ao carregar cena "${name}":`, e);
  }
}
