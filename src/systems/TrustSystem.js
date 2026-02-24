// src/systems/TrustSystem.js
// Sistema de confiança com 6 dimensões independentes por NPC.
// Nunca somar dimensões em "reputação geral" — isso destrói a profundidade.

import { getFlag, setFlag } from './FlagSystem.js';

const ARC = { HOSTILE:'hostile', NEUTRAL:'neutral', WARMING:'warming',
              TRUST:'trust', BROKEN:'broken', LOCKED:'locked' };
let _profiles = {};

export async function init() {
  const ids = ['gareth','lyra','aldric','davi','serena','nora','stenn','berthilda'];
  for (const id of ids) {
    const r = await fetch(`data/npcs/${id}.json`);
    _profiles[id] = await r.json();
    _profiles[id]._culpa_used = false; // runtime only
  }
  _profiles.berthilda.arc_state = ARC.LOCKED;
}

const RANGES = {
  familiaridade: [-10, 20], lealdade: [-10, 15], respeito: [-10, 15],
  simpatia: [-10, 15], medo: [0, 15], curiosidade: [0, 10],
};
const clamp = (v, mn, mx) => Math.max(mn, Math.min(mx, v));

export function applyDelta(npcId, deltas, ctx = 0) {
  const p = _profiles[npcId];
  if (!p || p.arc_state === ARC.LOCKED) return;

  // Lyra com arco quebrado: só penalidades passam
  const d = { ...deltas };
  if (npcId === 'lyra' && getFlag('FLAG_NPC_LYRA_ARC_BROKEN'))
    Object.keys(d).forEach(k => { if (d[k] > 0) delete d[k]; });

  for (const [dim, delta] of Object.entries(d)) {
    if (!(dim in RANGES)) continue;
    // Medo ≥ threshold bloqueia ganhos de simpatia
    if (dim === 'simpatia' && delta > 0 && p.trust.medo >= (p.thresholds?.medo_bloqueia_simpatia ?? 10)) continue;
    const final = Math.round(delta * (1 + ctx));
    const [mn, mx] = RANGES[dim];
    p.trust[dim] = clamp(p.trust[dim] + final, mn, mx);
  }

  // Aldric: familiaridade nunca cai abaixo de 3
  if (npcId === 'aldric') p.trust.familiaridade = Math.max(3, p.trust.familiaridade);

  _updateArc(npcId);
}

export function recordLie(npcId) {
  const p = _profiles[npcId];
  if (!p) return;
  p.lies_detected = (p.lies_detected ?? 0) + 1;
  if (npcId === 'lyra') {
    setFlag('FLAG_NPC_LYRA_ARC_BROKEN', true, 'lie_detected');
    p.arc_state = ARC.BROKEN;
  } else {
    applyDelta(npcId, { lealdade: -3 });
  }
}

function _updateArc(id) {
  const p = _profiles[id];
  if (p.arc_state === ARC.BROKEN || p.arc_state === ARC.LOCKED) return;
  const t = p.trust, thr = p.thresholds ?? {};
  let next = p.arc_state;
  if      (t.lealdade <= (thr.ruptura_irreversivel ?? -5))                      next = ARC.BROKEN;
  else if (t.familiaridade >= 8 && t.simpatia >= 6 && t.lealdade >= 6)          next = ARC.TRUST;
  else if (t.familiaridade >= 4 && t.simpatia >= 2)                             next = ARC.WARMING;
  else if (t.familiaridade >= 2 || t.medo < 3)                                  next = ARC.NEUTRAL;
  p.arc_state = next;
}

export function tickDayEnd(day) {
  for (const [id, p] of Object.entries(_profiles)) {
    if (p.arc_state === ARC.LOCKED) continue;
    const absent = day - (p.last_interaction_day ?? 0);
    if (absent >= 2) applyDelta(id, { familiaridade: -1 });
  }
}

export function tickWeekEnd() {
  if (!getFlag('FLAG_PLAYER_MAGIC_USED_THIS_WEEK') &&
      !getFlag('FLAG_PLAYER_AUTHORITY_USED_THIS_WEEK'))
    for (const id of Object.keys(_profiles)) applyDelta(id, { medo: -1 });
  setFlag('FLAG_PLAYER_MAGIC_USED_THIS_WEEK',     false, 'week_reset');
  setFlag('FLAG_PLAYER_AUTHORITY_USED_THIS_WEEK', false, 'week_reset');
}

export const getTrust    = id => _profiles[id]?.trust;
export const getArcState = id => _profiles[id]?.arc_state ?? ARC.NEUTRAL;
export const getProfile  = id => _profiles[id];
export const serialize   = ()  => JSON.parse(JSON.stringify(_profiles));
export const deserialize = d   => { _profiles = d; };
