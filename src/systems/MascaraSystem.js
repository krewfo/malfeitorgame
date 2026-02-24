// src/systems/MascaraSystem.js
// Sistema MASCARA — 8 aspectos de diálogo.
// Cada aspecto afeta cada NPC de forma diferente, conforme ASPECT_DELTA_TABLE.

import { applyDelta, getProfile } from './TrustSystem.js';
import { getFlag, setFlag } from './FlagSystem.js';
import { ASPECT_DELTA_TABLE } from '../../data/AspectTable.js';

export function processChoice(npcId, aspect, nodeId, contextScore = 0) {
  let deltas = { ...(ASPECT_DELTA_TABLE[aspect]?.[npcId] ?? {}) };

  // VULNERABILIDADE com Lyra hostil: cancela
  if (aspect === 'VULNERABILIDADE' && npcId === 'lyra') {
    const p = getProfile('lyra');
    if (p?.arc_state === 'hostile') deltas = {};
  }

  // CULPA: 2ª vez → delta ÷ 2
  if (aspect === 'CULPA') {
    const p = getProfile(npcId);
    if (p?._culpa_used) {
      for (const k of Object.keys(deltas)) deltas[k] = Math.floor(deltas[k] / 2);
    } else if (p) {
      p._culpa_used = true;
    }
  }

  if (aspect === 'AUTORIDADE')
    setFlag('FLAG_PLAYER_AUTHORITY_USED_THIS_WEEK', true, nodeId);

  if (aspect === 'MAGIA_LATENTE') {
    setFlag('FLAG_PLAYER_MAGIC_USED_COUNT', getFlag('FLAG_PLAYER_MAGIC_USED_COUNT') + 1, nodeId);
    setFlag('FLAG_PLAYER_MAGIC_USED_THIS_WEEK', true, nodeId);
  }

  applyDelta(npcId, deltas, contextScore);
}

export function isOptionVisible(option, npcId) {
  for (const f of option.hidden_when ?? []) if (getFlag(f))  return false;
  for (const f of option.visible_when ?? []) if (!getFlag(f)) return false;
  return true;
}

export const isCritical = aspect => ['AUTORIDADE', 'MANIPULACAO'].includes(aspect);
