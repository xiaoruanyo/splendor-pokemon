// Reuse the TypeScript loader and run existing rule regressions first.
require('./test-rule-regressions.cjs');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const local = require('../src/data/cardDefinitions.ts').cardDefinitions;
const server = require('../server/src/engine/cardDefinitions.ts').cardDefinitions;
assert.deepEqual(local, server, 'Local and server must use identical card facts');
assert.equal(local.length, 90);
assert.equal(new Set(local.map(c => c.id)).size, 90);
for (const [level, count] of [[1,35],[2,30],[3,15],['rare',5],['legendary',5]]) {
  assert.equal(local.filter(c => c.level === level).length, count);
}
for (const c of local) {
  assert(fs.existsSync(path.join(__dirname, '../public', c.image)));
  assert.notEqual(c.bonus, 'purple');
  if (c.evolutionReq) {
    assert.equal(Object.values(c.evolutionReq).filter(Boolean).length, 1);
    assert(local.some(base => base.name === c.evolutionOf && base.level === c.level - 1));
  }
  if (typeof c.level === 'string') {
    assert.equal(c.cost.purple, 1);
    assert.equal(c.bonusCount, 2);
    assert.equal(c.points, c.level === 'rare' ? 0 : 2);
  }
}
assert.equal(local.find(c => c.name === '妙蛙草').evolutionReq.pink, 3);
assert.equal(local.find(c => c.name === '妙蛙花').evolutionReq.blue, 4);
for (const prefix of ['../src/engine/', '../server/src/engine/']) {
  const { canAfford, calculatePayment } = require(prefix + 'cards.ts');
  const { executeEvolution } = require(prefix + 'evolution.ts');
  const { validateBuyCard } = require(prefix + 'validator.ts');
  const zero = {red:0,blue:0,black:0,pink:0,yellow:0,purple:0};
  const rare = local.find(c => c.level === 'rare');
  assert.equal(canAfford(rare, zero, rare.cost).affordable, false);
  assert.equal(calculatePayment(rare, zero, rare.cost), null);
  assert.deepEqual(calculatePayment(rare, {...zero,purple:1}, rare.cost), {...zero,purple:1});
  const capturePlayer = {tokens:{...rare.cost},bonuses:{...zero},reservedCards:[]};
  const captureGame = {board:{revealed:{1:[],2:[],3:[]},rareRevealed:rare,legendaryRevealed:null}};
  assert.equal(validateBuyCard(captureGame,capturePlayer,rare,{...rare.cost},'board'),null);
  assert.notEqual(validateBuyCard(captureGame,capturePlayer,rare,{...rare.cost,purple:0},'board'),null);
  const from = structuredClone(local.find(c => c.name === '妙蛙种子'));
  const to = structuredClone(local.find(c => c.name === '妙蛙草'));
  const player = {ownedCards:[from],reservedCards:[],tokens:{...zero},bonuses:{...zero,pink:3,[from.bonus]:1},score:from.points,evolutionCount:0};
  const board = {revealed:{1:[],2:[to],3:[]},rareRevealed:null,legendaryRevealed:null};
  assert.equal(executeEvolution(player,{from,to},board).success,true);
  assert.equal(player.score,to.points,'Evolution replaces old card points');
  assert.deepEqual(player.tokens,zero,'Evolution does not consume held balls');
}
console.log('PASS 90-card inventory, local/server parity, single-color evolutions, artwork, master-ball payment and evolution scoring');
