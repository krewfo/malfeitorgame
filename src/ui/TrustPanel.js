// src/ui/TrustPanel.js
// Painel visual de trust — Regra 5: NÃO exibe números, apenas representação visual (pips/barras).
// Ativado com tecla T. Mostra 6 dimensões do NPC mais próximo.

import { getTrust, getArcState } from '../systems/TrustSystem.js';

const panel = document.getElementById('trust-panel');
let _visible = false;
let _currentNpc = null;

// Escutar tecla T para toggle
document.addEventListener('keydown', e => {
  if (e.key === 't' || e.key === 'T') {
    _visible = !_visible;
    if (_visible && _currentNpc) {
      _render(_currentNpc);
      panel.classList.remove('hidden');
    } else {
      panel.classList.add('hidden');
    }
  }
});

/**
 * Definir NPC atual para exibir trust.
 * Chamado quando o jogador está perto de um NPC.
 */
export function setTarget(npcId) {
  _currentNpc = npcId;
  if (_visible && npcId) {
    _render(npcId);
    panel.classList.remove('hidden');
  } else if (!npcId) {
    panel.classList.add('hidden');
  }
}

/**
 * Renderiza as barras de trust para o NPC.
 */
function _render(npcId) {
  const trust = getTrust(npcId);
  if (!trust) { panel.classList.add('hidden'); return; }
  const arc = getArcState(npcId);

  const DIMS = [
    { key: 'familiaridade', label: 'FAMIL',  min: -10, max: 20, type: 'normal' },
    { key: 'lealdade',      label: 'LEALD',  min: -10, max: 15, type: 'normal' },
    { key: 'respeito',      label: 'RESP',   min: -10, max: 15, type: 'normal' },
    { key: 'simpatia',      label: 'SIMP',   min: -10, max: 15, type: 'normal' },
    { key: 'medo',          label: 'MEDO',   min:   0, max: 15, type: 'fear' },
    { key: 'curiosidade',   label: 'CURIO',  min:   0, max: 10, type: 'normal' },
  ];

  let html = `<div style="color:#9CA3AF;font-size:5px;margin-bottom:4px;letter-spacing:0.5px">` +
    `${npcId.toUpperCase()} <span style="color:${_arcColor(arc)}">[${arc.toUpperCase()}]</span></div>`;

  for (const dim of DIMS) {
    const val = trust[dim.key] ?? 0;
    html += `<div class="trust-row">`;
    html += `<span class="trust-label">${dim.label}</span>`;
    html += `<span class="trust-bar">`;

    // Regra 5: sem números — apenas pips visuais
    // Normalizar para 0–10 pips
    const range = dim.max - dim.min;
    const normalized = Math.round(((val - dim.min) / range) * 10);
    const zeroPoint = Math.round(((0 - dim.min) / range) * 10);

    for (let i = 0; i < 10; i++) {
      let cls = 'trust-pip';
      if (dim.type === 'fear') {
        if (i < normalized) cls += ' fear';
      } else {
        if (i < normalized && i >= zeroPoint) {
          cls += normalized >= 8 ? ' high' : ' positive';
        } else if (i >= normalized && i < zeroPoint) {
          cls += ' negative';
        }
      }
      html += `<span class="${cls}"></span>`;
    }

    html += `</span></div>`;
  }

  panel.innerHTML = html;
}

function _arcColor(arc) {
  switch (arc) {
    case 'hostile': return '#E74C3C';
    case 'neutral': return '#7F8C8D';
    case 'warming': return '#F5A623';
    case 'trust':   return '#27AE60';
    case 'broken':  return '#8B0000';
    case 'locked':  return '#374151';
    default:        return '#7F8C8D';
  }
}

export const TrustPanel = { setTarget };
