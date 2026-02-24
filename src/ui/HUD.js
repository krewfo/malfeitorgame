// src/ui/HUD.js
// HUD overlay — Dia/Hora + Ouro + Notificações.
// HTML + CSS sobre o Canvas (não Canvas puro para UI — conforme stack).

import { TimeSystem } from '../systems/TimeSystem.js';
import { EconomySystem } from '../systems/EconomySystem.js';

const dayLabel = document.getElementById('day-label');
const goldLabel = document.getElementById('gold-label');
const notifArea = document.getElementById('notification-area');
const weekProgress = document.getElementById('week-progress');

export const HUD = {
  update() {
    dayLabel.textContent = TimeSystem.label();
    goldLabel.textContent = `💰 ${EconomySystem.gold}`;
    _updateWeekProgress();
  },

  updateGold(amount) {
    goldLabel.textContent = `💰 ${amount}`;
  },

  /**
   * Exibe uma notificação temporária.
   * @param {string} text
   * @param {'info'|'danger'|'success'} type
   * @param {number} duration - ms (default 3000)
   */
  notify(text, type = 'info', duration = 3000) {
    const el = document.createElement('div');
    el.className = `notification ${type}`;
    el.textContent = text;
    notifArea.appendChild(el);

    setTimeout(() => {
      if (el.parentNode) el.parentNode.removeChild(el);
    }, duration);
  },
};

/**
 * Atualiza indicador visual de progresso semanal (7 pips = 7 dias).
 */
function _updateWeekProgress() {
  if (!weekProgress) return;
  const dow = TimeSystem.dayOfWeek; // 1=Seg … 7=Dom
  const DAYS = ['S', 'T', 'Q', 'Q', 'S', 'S', 'D']; // Seg-Dom
  let html = '';
  for (let i = 0; i < 7; i++) {
    const active = i < dow;
    const isCurrent = i === dow - 1;
    html += `<span class="week-pip${active ? ' active' : ''}${isCurrent ? ' current' : ''}">${DAYS[i]}</span>`;
  }
  weekProgress.innerHTML = html;
}
