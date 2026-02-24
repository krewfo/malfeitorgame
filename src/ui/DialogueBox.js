// src/ui/DialogueBox.js
// Caixa de diálogo completa com typewriter, opções MASCARA, e temas por NPC.

import { getNode, markSeen } from '../systems/DialogueSystem.js';
import { processChoice, isOptionVisible, isCritical } from '../systems/MascaraSystem.js';
import { applyDelta } from '../systems/TrustSystem.js';
import { setFlag } from '../systems/FlagSystem.js';
import { AudioManager } from '../engine/audio.js';
import { EconomySystem } from '../systems/EconomySystem.js';

const NPC_THEMES = {
  gareth:    { border:'#B45309', name:'#F59E0B' },
  lyra:      { border:'#1D4ED8', name:'#60A5FA' },
  aldric:    { border:'#374151', name:'#9CA3AF' },
  davi:      { border:'#065F46', name:'#34D399' },
  berthilda: { border:'#1F2937', name:'#6B7280' },
  narracao:  { border:'#2E1B69', name:'#C8A4F8' },
};
const ASPECT_COLORS = {
  SINCERIDADE:    { bg:'#1E3A5F', text:'#93C5FD', border:'#3B82F6' },
  SARCASMO:       { bg:'#18181B', text:'#A1A1AA', border:'#71717A' },
  VULNERABILIDADE:{ bg:'#2E1065', text:'#C4B5FD', border:'#8B5CF6' },
  MANIPULACAO:    { bg:'#450A0A', text:'#FCA5A5', border:'#EF4444' },
  CULPA:          { bg:'#111827', text:'#9CA3AF', border:'#4B5563' },
  CURIOSIDADE:    { bg:'#022C22', text:'#6EE7B7', border:'#10B981' },
  AUTORIDADE:     { bg:'#431407', text:'#FDBA74', border:'#F97316' },
  SILENCIO:       { bg:'#0F172A', text:'#475569', border:'#334155' },
};

const box    = document.getElementById('dialogue-box');
const nameEl = document.getElementById('npc-name');
const textEl = document.getElementById('dialogue-text');
const optsEl = document.getElementById('options-container');

let _resolve = null;
let _skipTypewriter = false;
let _inDialogue = false;
let _currentSpeaker = null;

// Atalho: Enter/Espaço pula typewriter ou avança
document.addEventListener('keydown', e => {
  if (_inDialogue && (e.key === 'Enter' || e.key === ' ')) {
    e.preventDefault();
    _skipTypewriter = true;
  }
});

export function isActive() {
  return _inDialogue;
}

export function startDialogue(nodeId) {
  _inDialogue = true;
  return new Promise(res => { _resolve = res; _loadNode(nodeId); });
}

async function _loadNode(nodeId) {
  const node = getNode(nodeId);
  if (!node) { _end(); return; }
  markSeen(nodeId);

  const theme = NPC_THEMES[node.speaker] ?? NPC_THEMES.narracao;
  _currentSpeaker = node.speaker;
  box.style.borderColor = theme.border;
  nameEl.style.color    = theme.name;
  nameEl.textContent    = (node.speaker === 'narracao' ? 'NARRAÇÃO' : node.speaker).toUpperCase();
  optsEl.innerHTML      = '';
  box.classList.remove('hidden');

  await _typewriter(node.text);

  const opts = (node.aspect_options ?? []).filter(o => isOptionVisible(o, node.speaker));

  if (opts.length === 0) {
    const ncr = node.no_choice_result;
    if (ncr) {
      if (ncr.text) {
        await new Promise(r => setTimeout(r, 400));
        await _typewriter(ncr.text);
      }
      await new Promise(r => setTimeout(r, 1000));
      _applyEffects(node.speaker, ncr.effects);
      if (ncr.effects?.next_node) { _loadNode(ncr.effects.next_node); return; }
    }
    await new Promise(r => setTimeout(r, 600));
    _end(); return;
  }

  opts.forEach((opt, i) => {
    const colors = ASPECT_COLORS[opt.aspect] ?? ASPECT_COLORS.SILENCIO;
    const btn = document.createElement('button');
    btn.className = 'aspect-option';
    btn.style.cssText = `
      background:${colors.bg}; border:1px solid ${colors.border};
      animation-delay:${i * 80}ms;
      ${opt._culpa_faded ? 'opacity:0.6;' : ''}
    `;
    btn.title = opt._culpa_faded ? 'Usar novamente terá menos efeito' : '';
    btn.innerHTML =
      `<span class="aspect-tag" style="color:${colors.text}">${opt.aspect}</span>` +
      `<span class="opt-text">${opt.text}</span>` +
      (isCritical(opt.aspect) ? '<span class="warn-icon">⚠</span>' : '');
    btn.addEventListener('click', () => {
      AudioManager.playSfx('sfx_ui_select');
      _pick(node.speaker, opt);
    });
    optsEl.appendChild(btn);
  });

  // Atalhos numéricos 1–4
  const _keyHandler = e => {
    const n = parseInt(e.key) - 1;
    if (n >= 0 && n < opts.length) {
      document.removeEventListener('keydown', _keyHandler);
      _pick(node.speaker, opts[n]);
    }
  };
  document.addEventListener('keydown', _keyHandler);
}

function _applyEffects(npcId, effects) {
  if (!effects) return;
  for (const [npc, deltas] of Object.entries(effects.trust_deltas ?? {}))
    applyDelta(npc, deltas);
  for (const f of effects.flags_set ?? [])
    setFlag(f, true, 'dialogue');
  // Economia — ganhar ouro via efeito de diálogo
  if (effects.earn_gold) {
    EconomySystem.earn(effects.earn_gold);
    AudioManager.playSfx('sfx_coin');
  }
}

async function _pick(npcId, opt) {
  optsEl.innerHTML = '';
  processChoice(npcId, opt.aspect, opt.id);
  _applyEffects(npcId, opt.effects);
  await new Promise(r => setTimeout(r, 250));
  if (opt.effects?.next_node) { _loadNode(opt.effects.next_node); return; }
  _end();
}

function _end() {
  box.classList.add('hidden');
  _inDialogue = false;
  if (_resolve) { _resolve(); _resolve = null; }
}

function _typewriter(text) {
  return new Promise(res => {
    textEl.textContent = '';
    _skipTypewriter = false;
    let i = 0;
    let blipCounter = 0;
    const PAUSES = { '.':250, '!':250, '?':250, ',':100 };
    function tick() {
      if (_skipTypewriter) { textEl.textContent = text; res(); return; }
      if (i >= text.length) { res(); return; }
      textEl.textContent += text[i];
      // Play text blip every 3 chars (avoid too rapid fire)
      if (text[i] !== ' ' && ++blipCounter % 3 === 0) {
        AudioManager.playSfx(AudioManager.getTextBlip(_currentSpeaker));
      }
      const delay = PAUSES[text[i]] ?? 30;
      i++;
      setTimeout(tick, delay);
    }
    tick();
  });
}
