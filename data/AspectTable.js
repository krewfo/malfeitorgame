// data/AspectTable.js
// ASPECT_DELTA_TABLE — lei absoluta do sistema MASCARA.
// Object.freeze() — imutável em runtime (Regra 4).

export const ASPECT_DELTA_TABLE = Object.freeze({
  SINCERIDADE: {
    gareth:    { familiaridade:1, respeito:1 },
    lyra:      { familiaridade:1, simpatia:1 },
    aldric:    { lealdade:1 },
    serena:    { simpatia:1 },
    davi:      { respeito:1 },
    stenn:     { respeito:-1 },
    berthilda: {},
    nora:      { respeito:1 },
  },
  SARCASMO: {
    gareth:    { simpatia:1 },
    lyra:      { simpatia:-2, familiaridade:1 },
    aldric:    { simpatia:-1 },
    serena:    { simpatia:-1 },
    davi:      { curiosidade:1, simpatia:1 },
    stenn:     { respeito:-1 },
    berthilda: {},
    nora:      { respeito:-1 },
  },
  VULNERABILIDADE: {
    gareth:    { lealdade:1 },
    lyra:      { simpatia:2 },   // só aplica se arc_state !== 'hostile'
    aldric:    { simpatia:2, lealdade:1 },
    serena:    { simpatia:1 },
    davi:      { curiosidade:2 },
    stenn:     { medo:1 },       // Stenn explora vulnerabilidade como vantagem
    berthilda: {},
    nora:      { familiaridade:1 },
  },
  MANIPULACAO: {
    gareth:    {},
    lyra:      { lealdade:-3 },  // detecta sempre
    aldric:    { lealdade:-3 },  // detecta sempre
    serena:    { simpatia:-2 },
    davi:      { curiosidade:-1 },
    stenn:     { respeito:2, lealdade:1 }, // único NPC que respeita manipulação
    berthilda: {},
    nora:      { respeito:-2 },
  },
  CULPA: {
    gareth:    { simpatia:-1 },
    lyra:      { simpatia:1, curiosidade:1 }, // 1× — depois delta÷2
    aldric:    { simpatia:1 },
    serena:    { familiaridade:1 },
    davi:      { curiosidade:2 },
    stenn:     {},
    berthilda: { lealdade:1 },   // 1× — depois delta÷2
    nora:      {},
  },
  CURIOSIDADE: {
    gareth:    { curiosidade:-1, simpatia:1 },
    lyra:      { familiaridade:1 },
    aldric:    { familiaridade:1 },
    serena:    { familiaridade:1 },
    davi:      { respeito:2, curiosidade:1 },
    stenn:     {},
    berthilda: {},
    nora:      { respeito:2, curiosidade:1 },
  },
  AUTORIDADE: {
    gareth:    { medo:1, simpatia:-2 },
    lyra:      { lealdade:-3, medo:2 },
    aldric:    { medo:1, lealdade:-1 },
    serena:    { lealdade:-2 },
    davi:      { curiosidade:-2 },
    stenn:     { respeito:1 },
    berthilda: {},
    nora:      { respeito:-2 },
  },
  SILENCIO: {
    gareth:    { curiosidade:1 },
    lyra:      { curiosidade:2, familiaridade:1 },
    aldric:    { familiaridade:1 },
    serena:    { familiaridade:2 },
    davi:      { simpatia:-1 },
    stenn:     {},
    berthilda: {}, // LOCKED mas silêncio é o único que ela "percebe" — sem delta mesmo assim
    nora:      { familiaridade:1 },
  },
});
