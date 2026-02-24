// src/engine/audio.js
// Sistema de áudio via Howler.js (única dependência externa).
// Gerencia música de fundo e efeitos sonoros.
// Áudio é gracefully degraded se Howler.js não estiver disponível.

const _sounds = {};
let _currentMusic = null;
let _howlerAvailable = typeof Howl !== 'undefined';

export const AudioManager = {
  init() {
    _howlerAvailable = typeof Howl !== 'undefined';
    if (!_howlerAvailable) {
      console.warn('⚠️ Howler.js não encontrado — áudio desativado.');
      console.warn('   Para ativar: baixe howler.min.js para lib/howler.min.js');
      return;
    }

    // Pré-carregar sons conforme spec
    _loadMusic('mus_village_day',   'assets/audio/music/mus_village_day.wav');
    _loadMusic('mus_village_night', 'assets/audio/music/mus_village_night.wav');
    _loadMusic('mus_dream',         'assets/audio/music/mus_dream.wav');

    _loadSfx('sfx_text_blip',         'assets/audio/sfx/sfx_text_blip.wav');
    _loadSfx('sfx_text_blip_gareth',  'assets/audio/sfx/sfx_text_blip_gareth.wav');
    _loadSfx('sfx_text_blip_lyra',    'assets/audio/sfx/sfx_text_blip_lyra.wav');
    _loadSfx('sfx_text_blip_aldric',  'assets/audio/sfx/sfx_text_blip_aldric.wav');
    _loadSfx('sfx_coin',              'assets/audio/sfx/sfx_coin.wav');
    _loadSfx('sfx_notification',      'assets/audio/sfx/sfx_notification.wav');
    _loadSfx('sfx_ui_select',         'assets/audio/sfx/sfx_ui_select.wav');
  },

  /**
   * Toca música de fundo. Faz crossfade se outra está tocando.
   * @param {string} id - Identificador da música
   */
  playMusic(id) {
    if (!_howlerAvailable) return;
    if (_currentMusic === id) return;

    // Parar música anterior
    if (_currentMusic && _sounds[_currentMusic]) {
      _sounds[_currentMusic].fade(0.4, 0, 500);
      const old = _currentMusic;
      setTimeout(() => { _sounds[old]?.stop(); }, 500);
    }

    _currentMusic = id;
    if (_sounds[id]) {
      _sounds[id].volume(0);
      _sounds[id].play();
      _sounds[id].fade(0, 0.4, 500);
    }
  },

  /**
   * Para toda a música.
   */
  stopMusic() {
    if (!_howlerAvailable) return;
    if (_currentMusic && _sounds[_currentMusic]) {
      _sounds[_currentMusic].fade(0.4, 0, 300);
      const old = _currentMusic;
      setTimeout(() => { _sounds[old]?.stop(); }, 300);
    }
    _currentMusic = null;
  },

  /**
   * Toca efeito sonoro.
   * @param {string} id
   */
  playSfx(id) {
    if (!_howlerAvailable) return;
    if (_sounds[id]) {
      _sounds[id].play();
    }
  },

  /**
   * Retorna blip de texto específico para speaker.
   */
  getTextBlip(speaker) {
    const blipMap = {
      gareth: 'sfx_text_blip_gareth',
      lyra:   'sfx_text_blip_lyra',
      aldric: 'sfx_text_blip_aldric',
    };
    return blipMap[speaker] ?? 'sfx_text_blip';
  },
};

function _loadMusic(id, src) {
  if (!_howlerAvailable) return;
  try {
    _sounds[id] = new Howl({
      src: [src],
      loop: true,
      volume: 0.4,
      preload: true,
      onloaderror: () => {
        // Áudio ausente — graceful degradation (não quebrar o jogo)
        console.warn(`Áudio não encontrado: ${src}`);
      },
    });
  } catch {
    // Howler indisponível ou erro — ignorar silenciosamente
  }
}

function _loadSfx(id, src) {
  if (!_howlerAvailable) return;
  try {
    _sounds[id] = new Howl({
      src: [src],
      volume: 0.6,
      preload: true,
      onloaderror: () => {
        console.warn(`SFX não encontrado: ${src}`);
      },
    });
  } catch {
    // Ignorar silenciosamente
  }
}
