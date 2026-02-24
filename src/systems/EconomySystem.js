// src/systems/EconomySystem.js
// Sistema de economia básica. Gold + aluguel semanal.

import { setFlag } from './FlagSystem.js';

export const EconomySystem = {
  gold: 5,
  RENT: 15,
  _dailyIncome: 2, // estimativa para projeção de risco

  earn(n) {
    this.gold += n;
    import('../ui/HUD.js').then(m => m.HUD.updateGold(this.gold));
  },

  spend(n) {
    if (this.gold < n) return false;
    this.gold -= n;
    import('../ui/HUD.js').then(m => m.HUD.updateGold(this.gold));
    return true;
  },

  checkRent() {
    if (!this.spend(this.RENT)) {
      setFlag('FLAG_PLAYER_EVICTED', true, 'rent');
      import('../ui/HUD.js').then(m => m.HUD.notify('Gareth fechou sua conta. Você foi expulso.', 'danger'));
    }
  },

  evictionRisk() {
    // Usa import dinâmico para evitar circular (spec original usava require, incompatível com ES modules)
    // Calcula com base no dayOfWeek armazenado
    const daysLeft = ((5 - this._currentDow + 7) % 7) || 7;
    const proj = this.gold + this._dailyIncome * daysLeft;
    return proj < 15 ? 'high' : proj < 20 ? 'medium' : 'none';
  },

  /** Chamado pelo TimeSystem para manter dayOfWeek atualizado sem circular */
  updateDow(dow) {
    this._currentDow = dow;
  },

  set(gold) { this.gold = gold; },
  serialize()   { return { gold: this.gold }; },
  deserialize(d){ this.gold = d.gold; },
};
