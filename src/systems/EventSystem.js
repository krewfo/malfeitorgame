// src/systems/EventSystem.js
// Barramento pub/sub leve para comunicação entre sistemas.
// Também gerencia eventos agendados (scheduled events) carregados de JSON.
// Evita importações circulares: sistemas emitem eventos,
// outros sistemas escutam sem dependência direta.

import { getFlag, setFlag } from './FlagSystem.js';

const _listeners = {};
let _scheduledEvents = [];
let _loaded = false;

export const EventSystem = Object.freeze({
  /**
   * Registra um ouvinte para um evento.
   */
  on(event, callback) {
    if (!_listeners[event]) _listeners[event] = [];
    _listeners[event].push(callback);
    return () => {
      const idx = _listeners[event].indexOf(callback);
      if (idx !== -1) _listeners[event].splice(idx, 1);
    };
  },

  /**
   * Registra um ouvinte que dispara apenas UMA vez.
   */
  once(event, callback) {
    const unsub = this.on(event, (...args) => {
      unsub();
      callback(...args);
    });
    return unsub;
  },

  /**
   * Emite um evento para todos os ouvintes registrados.
   */
  emit(event, ...args) {
    const list = _listeners[event];
    if (!list) return;
    for (const fn of [...list]) {
      try {
        fn(...args);
      } catch (err) {
        console.error(`EventSystem: erro no handler de "${event}":`, err);
      }
    }
  },

  /**
   * Remove TODOS os ouvintes de um evento (ou de todos se evento omitido).
   */
  off(event) {
    if (event) {
      delete _listeners[event];
    } else {
      for (const k of Object.keys(_listeners)) delete _listeners[k];
    }
  },

  /**
   * Carrega eventos agendados de um JSON.
   */
  async loadEvents(url) {
    try {
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        _scheduledEvents = data;
        _loaded = true;
      }
    } catch (e) {
      console.warn('EventSystem: não foi possível carregar eventos:', e);
    }
  },

  /**
   * Verifica e dispara eventos agendados para o dia/hora atual.
   * Chamado pelo TimeSystem no avanço de dia.
   */
  checkEvents(day, hour) {
    if (!_loaded) return;
    for (const evt of _scheduledEvents) {
      // Já disparou?
      if (evt.flag_on_fire && getFlag(evt.flag_on_fire)) continue;

      // Dentro do range de dia?
      const [dMin, dMax] = evt.day_range;
      if (day < dMin || day > dMax) continue;

      // Dentro do range de hora?
      if (evt.hour_range) {
        const [hMin, hMax] = evt.hour_range;
        if (hour < hMin || hour > hMax) continue;
      }

      // Condições satisfeitas?
      const condOk = (evt.conditions ?? []).every(f => getFlag(f));
      if (!condOk) continue;

      // Disparar evento
      if (evt.flag_on_fire) setFlag(evt.flag_on_fire, true, 'event');
      if (evt.effects?.flags_set) {
        for (const f of evt.effects.flags_set) setFlag(f, true, 'event');
      }
      if (evt.effects?.notification) {
        // Emitir como um evento pub/sub para HUD
        this.emit('notification', evt.effects.notification, evt.id);
      }
    }
  },
});
