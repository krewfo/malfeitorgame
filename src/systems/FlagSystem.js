// src/systems/FlagSystem.js
// REGRA: Este módulo NÃO importa nenhum outro sistema. Zero dependência circular.
// Todos os outros sistemas importam dele.
// Se precisar do dia atual, recebe via injectDayGetter().

const _flags = {
  // NPC
  FLAG_NPC_GARETH_FIRST_JOB:             false,
  FLAG_NPC_GARETH_VULNERABILITY_1:       false,
  FLAG_NPC_GARETH_FIRST_DRINK_OFFERED:   false,
  FLAG_NPC_LYRA_FIRST_MEETING:           false,
  FLAG_NPC_LYRA_CULPA_USED:              false,
  FLAG_NPC_LYRA_READING_STARTED:         false,
  FLAG_NPC_LYRA_ARC_BROKEN:              false,  // 🔴 PERMANENTE
  FLAG_NPC_LYRA_LIE_POTENTIAL:           false,
  FLAG_NPC_LYRA_LIE_DETECTED:            false,
  FLAG_NPC_LYRA_FATHER_PARALLEL_1:       false,
  FLAG_NPC_ALDRIC_INTRO_COMPLETE:        false,
  FLAG_NPC_ALDRIC_DEBT_HINT_1:           false,
  FLAG_NPC_ALDRIC_PERSONAL_HINT_1:       false,
  FLAG_NPC_DAVI_INTRO_COMPLETE:          false,
  FLAG_NPC_SERENA_FIRST_MEETING:         false,
  FLAG_NPC_NORA_INTRO:                   false,
  FLAG_NPC_BERTHILDA_ILL_HELPED:         false,
  FLAG_NPC_BERTHILDA_ILL_IGNORED:        false,
  // WORLD
  FLAG_WORLD_STENN_DEBT:                 false,
  FLAG_WORLD_DROUGHT_REVEALED:           false,
  FLAG_WORLD_FORBIDDEN_BOOK_READ:        false,
  FLAG_WORLD_STENN_CONFRONTED_PUBLIC:    false,
  FLAG_VILLAGE_TRUST_HIT_1:             false,
  FLAG_VILLAGE_TRUST_HIT_2:             false,
  FLAG_VILLAGE_HOSTILE:                  false,  // 🔴 PERMANENTE
  // PLAYER
  FLAG_PLAYER_MAGIC_LEVEL:               0,      // int 0–4
  FLAG_PLAYER_MAGIC_USED_COUNT:          0,      // int — ≥3 bloqueia finais positivos
  FLAG_PLAYER_MAGIC_USED_THIS_WEEK:      false,
  FLAG_PLAYER_AUTHORITY_USED_THIS_WEEK:  false,
  FLAG_PLAYER_CAPE_STATE:                0,      // int 0–5
  FLAG_PLAYER_EVICTED:                   false,
  FLAG_PLAYER_KNOWS_POISONS:             false,
  FLAG_PLAYER_POISON_USED:              false,  // 🔴 PERMANENTE
  // CRAFT
  FLAG_CRAFT_HERB_LEVEL:                 0,
  FLAG_CRAFT_CARPENTRY_LEVEL:            0,
  FLAG_CRAFT_WRITING_LEVEL:              0,
  FLAG_CRAFT_SWEEPING_ACTIVE:            false,
  // ENDING
  FLAG_ENDING_SCORE:                     0,
  FLAG_ENDING_REDEMPTION_AVAILABLE:      false,
  FLAG_ENDING_IMPASSE_AVAILABLE:         false,
  FLAG_ENDING_RELAPSE_LOCKED_IN:         false,  // 🔴 PERMANENTE
  FLAG_ACT_1_COMPLETE:                   false,
  FLAG_SYSTEM_NEW_GAME_PLUS:             false,
  // MEMORY
  FLAG_MEMORY_TRIBUNAL_SEEN:             false,
  FLAG_MEMORY_FIRST_RAID_SEEN:           false,
  // ENDING EVALUATION (referenced in _recalcEnding)
  FLAG_NPC_LYRA_ARC_COMPLETE:            false,
  FLAG_NPC_BERTHILDA_APPROVED:           false,
  FLAG_NPC_ALDRIC_FULL_REVEAL:           false,
  FLAG_NPC_ALDRIC_PERSONAL_HINT_1:       false,
  // EVENT SYSTEM (once-fire guards)
  FLAG_EVT_RENT_WARNING_FIRED:           false,
  FLAG_EVT_GARETH_MENTIONS_DAVI:         false,
  FLAG_EVT_DREAM_HINT_FIRED:             false,
  FLAG_HINT_DAVI_UNLOCKED:               false,
};

const _auditLog = [];
let _dayGetter = () => 0; // Injetado pelo TimeSystem para evitar circular

const PERMANENT = new Set([
  'FLAG_NPC_LYRA_ARC_BROKEN',
  'FLAG_VILLAGE_HOSTILE',
  'FLAG_PLAYER_POISON_USED',
  'FLAG_ENDING_RELAPSE_LOCKED_IN',
]);

export function setFlag(id, value, source = '') {
  if (!(id in _flags)) {
    // Flags dinâmicas de diálogo (FLAG_DIALOGUE_*_SEEN e flags de escolha)
    // são criadas automaticamente para rastreamento de nós vistos
    if (id.startsWith('FLAG_DIALOGUE_') || id.startsWith('FLAG_NPC_LYRA_D1_') || id.startsWith('FLAG_NPC_')) {
      _flags[id] = undefined; // registrar antes de setar
    } else {
      console.error(`FlagSystem: flag desconhecida "${id}"`);
      return;
    }
  }
  if (PERMANENT.has(id) && _flags[id] === true && value === false) return; // permanente
  const old = _flags[id];
  if (old === value) return;
  _flags[id] = value;
  _auditLog.push({ day: _dayGetter(), flag: id, old, value, source, ts: Date.now() });
  _handleCritical(id, value);
  _recalcEnding();
}

export const getFlag = id => _flags[id];
export const injectDayGetter = fn => { _dayGetter = fn; };

function _handleCritical(id, value) {
  if (!value) return;
  if (id === 'FLAG_NPC_LYRA_ARC_BROKEN') {
    _flags.FLAG_ENDING_SCORE = Math.min(_flags.FLAG_ENDING_SCORE, 30);
    console.warn('🔴 LYRA_ARC_BROKEN — Redenção Plena impossível neste playthrough');
  }
  if (id === 'FLAG_VILLAGE_HOSTILE') {
    _flags.FLAG_ENDING_REDEMPTION_AVAILABLE = false;
  }
}

function _recalcEnding() {
  let s = 0;
  if (_flags.FLAG_NPC_LYRA_ARC_COMPLETE)           s += 30;
  if (_flags.FLAG_NPC_BERTHILDA_APPROVED)          s += 30;
  if (_flags.FLAG_NPC_ALDRIC_FULL_REVEAL)          s += 15;
  if (!_flags.FLAG_PLAYER_MAGIC_USED_COUNT)        s += 15;
  if (_flags.FLAG_WORLD_STENN_CONFRONTED_PUBLIC)   s += 10;
  if (_flags.FLAG_NPC_LYRA_ARC_BROKEN)             s -= 30;
  if (_flags.FLAG_PLAYER_MAGIC_USED_COUNT >= 3)    s -= 20;
  if (_flags.FLAG_PLAYER_POISON_USED)              s -= 15;
  if (_flags.FLAG_VILLAGE_HOSTILE)                 s -= 25;
  _flags.FLAG_ENDING_SCORE              = s;
  _flags.FLAG_ENDING_REDEMPTION_AVAILABLE = s >= 85;
  _flags.FLAG_ENDING_IMPASSE_AVAILABLE    = s >= 50 && s < 85;
}

export function serialize()    { return { flags: { ..._flags }, log: [..._auditLog] }; }
export function deserialize(d) { Object.assign(_flags, d.flags); _auditLog.push(...(d.log ?? [])); }
