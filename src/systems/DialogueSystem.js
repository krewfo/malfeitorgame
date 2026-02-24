// src/systems/DialogueSystem.js
// Gerencia nós de diálogo carregados via JSON.
// Tipos de trigger: auto, proximity, flag, manual.

import { getFlag, setFlag } from './FlagSystem.js';

const _db = new Map();

export async function loadAct(act, week) {
  const r = await fetch(`data/dialogues/act${act}_week${week}.json`);
  const nodes = await r.json();
  for (const n of nodes) _db.set(n.node_id, n);
}

export const getNode = id => _db.get(id) ?? null;

export function findAutoTrigger(scene, day) {
  let best = null;
  for (const [id, node] of _db) {
    const t = node.trigger;
    if (t.type !== 'auto') continue;
    // scene lives at node top-level, not inside trigger
    const nodeScene = t.scene ?? node.scene;
    if (nodeScene && nodeScene !== scene) continue;
    if (t.day_range && (day < t.day_range[0] || day > t.day_range[1])) continue;
    if (t.conditions?.some(f => !getFlag(f))) continue;
    if (getFlag(`FLAG_DIALOGUE_${id}_SEEN`)) continue;
    if (!best || t.priority > best.priority) best = { id, priority: t.priority ?? 0 };
  }
  return best?.id ?? null;
}

/**
 * Busca diálogos de proximity para um NPC específico, verificando condições.
 */
export function findProximityTrigger(npcId, scene, day) {
  let best = null;
  for (const [id, node] of _db) {
    const t = node.trigger;
    if (t.type !== 'proximity') continue;
    if (t.npc && t.npc !== npcId) continue;
    const nodeScene = t.scene ?? node.scene;
    if (nodeScene && nodeScene !== scene) continue;
    if (t.day_range && (day < t.day_range[0] || day > t.day_range[1])) continue;
    if (t.conditions?.some(f => !getFlag(f))) continue;
    if (getFlag(`FLAG_DIALOGUE_${id}_SEEN`)) continue;
    if (!best || t.priority > best.priority) best = { id, priority: t.priority ?? 0 };
  }
  return best?.id ?? null;
}

export function markSeen(nodeId) {
  setFlag(`FLAG_DIALOGUE_${nodeId}_SEEN`, true, 'dialogue');
}
