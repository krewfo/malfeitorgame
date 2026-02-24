// tests/test_smoke.js
// Smoke tests para MALFEITOR — executar com: node tests/test_smoke.js
// Testa sistemas isolados sem dependências de DOM/Canvas.
// Usa apenas assert nativo do Node.

import assert from 'node:assert';
import { test, describe, beforeEach } from 'node:test';

// ═══════════════════════════════════════════════════════════════
// 1. FlagSystem — flags, permanentes, audit log
// ═══════════════════════════════════════════════════════════════
describe('FlagSystem', async () => {
  const { setFlag, getFlag, injectDayGetter } = await import('../src/systems/FlagSystem.js');
  injectDayGetter(() => 1);

  test('setFlag / getFlag básico', () => {
    setFlag('FLAG_NPC_GARETH_FIRST_JOB', true, 'test');
    assert.strictEqual(getFlag('FLAG_NPC_GARETH_FIRST_JOB'), true);
  });

  test('flag permanente não reverte', () => {
    setFlag('FLAG_NPC_LYRA_ARC_BROKEN', true, 'test');
    setFlag('FLAG_NPC_LYRA_ARC_BROKEN', false, 'test');
    assert.strictEqual(getFlag('FLAG_NPC_LYRA_ARC_BROKEN'), true);
  });

  test('flag desconhecida não explode', () => {
    setFlag('FLAG_DIALOGUE_TEST_SEEN', true, 'test');
    assert.strictEqual(getFlag('FLAG_DIALOGUE_TEST_SEEN'), true);
  });

  test('FLAG_NPC_LYRA_ARC_BROKEN limita ending score', () => {
    // Já setada acima como true
    const score = getFlag('FLAG_ENDING_SCORE');
    assert.ok(score <= 30, `Score deveria ser ≤30, mas é ${score}`);
  });

  test('FLAG_VILLAGE_HOSTILE bloqueia redenção', () => {
    setFlag('FLAG_VILLAGE_HOSTILE', true, 'test');
    assert.strictEqual(getFlag('FLAG_ENDING_REDEMPTION_AVAILABLE'), false);
  });
});

// ═══════════════════════════════════════════════════════════════
// 2. EconomySystem — gold, rent, eviction
// ═══════════════════════════════════════════════════════════════
describe('EconomySystem', async () => {
  const { EconomySystem } = await import('../src/systems/EconomySystem.js');

  test('gold inicial = 5', () => {
    assert.strictEqual(EconomySystem.gold, 5);
  });

  test('earn aumenta gold', () => {
    const before = EconomySystem.gold;
    EconomySystem.earn(10);
    assert.strictEqual(EconomySystem.gold, before + 10);
  });

  test('spend retorna false se gold insuficiente', () => {
    EconomySystem.set(3);
    const ok = EconomySystem.spend(5);
    assert.strictEqual(ok, false);
    assert.strictEqual(EconomySystem.gold, 3);
  });

  test('spend desconta corretamente', () => {
    EconomySystem.set(20);
    const ok = EconomySystem.spend(7);
    assert.strictEqual(ok, true);
    assert.strictEqual(EconomySystem.gold, 13);
  });

  test('RENT é 15', () => {
    assert.strictEqual(EconomySystem.RENT, 15);
  });
});

// ═══════════════════════════════════════════════════════════════
// 3. AspectTable — imutabilidade e estrutura
// ═══════════════════════════════════════════════════════════════
describe('AspectTable', async () => {
  const { ASPECT_DELTA_TABLE } = await import('../data/AspectTable.js');

  test('tabela existe e está congelada', () => {
    assert.ok(ASPECT_DELTA_TABLE);
    assert.ok(Object.isFrozen(ASPECT_DELTA_TABLE));
  });

  test('contém 8 aspectos', () => {
    const aspects = Object.keys(ASPECT_DELTA_TABLE);
    assert.strictEqual(aspects.length, 8);
  });

  test('não pode ser alterada em runtime', () => {
    assert.throws(() => {
      ASPECT_DELTA_TABLE.NOVO_ASPECTO = {};
    }, TypeError);
  });

  test('deltas são numéricos', () => {
    for (const [aspect, npcs] of Object.entries(ASPECT_DELTA_TABLE)) {
      for (const [npc, deltas] of Object.entries(npcs)) {
        for (const [dim, val] of Object.entries(deltas)) {
          assert.strictEqual(typeof val, 'number', `${aspect}.${npc}.${dim} não é number`);
        }
      }
    }
  });
});

// ═══════════════════════════════════════════════════════════════
// 4. EventSystem — pub/sub
// ═══════════════════════════════════════════════════════════════
describe('EventSystem', async () => {
  const { EventSystem } = await import('../src/systems/EventSystem.js');

  beforeEach(() => EventSystem.off());

  test('on + emit funciona', () => {
    let received = null;
    EventSystem.on('test_event', (data) => { received = data; });
    EventSystem.emit('test_event', 42);
    assert.strictEqual(received, 42);
  });

  test('once dispara apenas uma vez', () => {
    let count = 0;
    EventSystem.once('once_event', () => { count++; });
    EventSystem.emit('once_event');
    EventSystem.emit('once_event');
    assert.strictEqual(count, 1);
  });

  test('unsubscribe funciona', () => {
    let count = 0;
    const unsub = EventSystem.on('unsub_test', () => { count++; });
    EventSystem.emit('unsub_test');
    unsub();
    EventSystem.emit('unsub_test');
    assert.strictEqual(count, 1);
  });

  test('off limpa todos os listeners', () => {
    let called = false;
    EventSystem.on('clear_test', () => { called = true; });
    EventSystem.off();
    EventSystem.emit('clear_test');
    assert.strictEqual(called, false);
  });

  test('erro no handler não quebra outros', () => {
    let second = false;
    EventSystem.on('error_test', () => { throw new Error('boom'); });
    EventSystem.on('error_test', () => { second = true; });
    EventSystem.emit('error_test');
    assert.strictEqual(second, true);
  });
});

// ═══════════════════════════════════════════════════════════════
// 5. MascaraSystem — processChoice estrutura
// ═══════════════════════════════════════════════════════════════
describe('MascaraSystem', async () => {
  const Mascara = await import('../src/systems/MascaraSystem.js');

  test('isCritical identifica AUTORIDADE', () => {
    assert.strictEqual(Mascara.isCritical('AUTORIDADE'), true);
  });

  test('isCritical identifica MANIPULACAO', () => {
    assert.strictEqual(Mascara.isCritical('MANIPULACAO'), true);
  });

  test('isCritical rejeita EMPATIA', () => {
    assert.strictEqual(Mascara.isCritical('EMPATIA'), false);
  });

  test('isOptionVisible sem restricoes retorna true', () => {
    assert.strictEqual(Mascara.isOptionVisible({}, 'gareth'), true);
  });

  test('isOptionVisible com hidden_when bloqueada', () => {
    const { setFlag } = await import('../src/systems/FlagSystem.js');
    setFlag('FLAG_NPC_GARETH_FIRST_JOB', true, 'test');
    const opt = { hidden_when: ['FLAG_NPC_GARETH_FIRST_JOB'] };
    assert.strictEqual(Mascara.isOptionVisible(opt, 'gareth'), false);
  });
});

console.log('\n✅ Todos os smoke tests concluídos.');
