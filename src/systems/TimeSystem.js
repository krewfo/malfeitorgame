// src/systems/TimeSystem.js
// Tempo avança por ação, NÃO em tempo real (Regra 10).
// Nunca usar setInterval para progressão de dia/hora.

import { tickDayEnd, tickWeekEnd } from './TrustSystem.js';
import { setFlag } from './FlagSystem.js';
import { EventSystem } from './EventSystem.js';

export const TimeSystem = {
  act: 1, day: 1, hour: 8, dayOfWeek: 1, // 1=Seg … 7=Dom

  advance(hours = 1) {
    this.hour += hours;
    if (this.hour >= 24) {
      this.hour = 6;
      this.day++;
      this.dayOfWeek = (this.dayOfWeek % 7) + 1;
      tickDayEnd(this.day);
      if (this.dayOfWeek === 1) { // nova semana
        tickWeekEnd();
        import('./EconomySystem.js').then(m => m.EconomySystem.checkRent());
      }
      // Manter EconomySystem atualizado com dia da semana
      import('./EconomySystem.js').then(m => m.EconomySystem.updateDow(this.dayOfWeek));
      // Verificar eventos agendados
      EventSystem.checkEvents(this.day, this.hour);
      import('../ui/HUD.js').then(m => m.HUD.update());
      import('../engine/save.js').then(m => m.save()); // auto-save diário
    }
  },

  label() {
    const h = this.hour;
    const t = h < 12 ? 'MANHÃ' : h < 18 ? 'TARDE' : h < 22 ? 'ENTARDECER' : 'NOITE';
    return `DIA ${this.day} — ${t}`;
  },

  set({ act, day, hour, dayOfWeek }) {
    if (act !== undefined) this.act = act;
    if (day !== undefined) this.day = day;
    if (hour !== undefined) this.hour = hour;
    if (dayOfWeek !== undefined) this.dayOfWeek = dayOfWeek;
  },
};
