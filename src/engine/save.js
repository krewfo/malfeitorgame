// src/engine/save.js
// Save/Load via localStorage. Auto-save em: fim de diálogo, troca de cena, beforeunload.

import { serialize as serFlags, deserialize as desFlags } from '../systems/FlagSystem.js';
import { serialize as serTrust, deserialize as desTrust } from '../systems/TrustSystem.js';
import { TimeSystem } from '../systems/TimeSystem.js';
import { EconomySystem } from '../systems/EconomySystem.js';

const KEY = 'malfeitor_v1';

export function save() {
  const state = {
    v: '1.0', ts: Date.now(),
    time:  { act: TimeSystem.act, day: TimeSystem.day, hour: TimeSystem.hour, dow: TimeSystem.dayOfWeek },
    econ:  EconomySystem.serialize(),
    flags: serFlags(),
    trust: serTrust(),
  };
  localStorage.setItem(KEY, JSON.stringify(state));
}

export function load() {
  try {
    const s = JSON.parse(localStorage.getItem(KEY));
    if (!s || s.v !== '1.0') return false;
    TimeSystem.set({ act: s.time.act, day: s.time.day, hour: s.time.hour, dayOfWeek: s.time.dow });
    EconomySystem.deserialize(s.econ);
    desFlags(s.flags);
    desTrust(s.trust);
    return true;
  } catch { return false; }
}

export const clear = () => localStorage.removeItem(KEY);

// Auto-save no unload
window.addEventListener('beforeunload', save);
