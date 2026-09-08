// Use the existing TypeScript dependency to load both engine copies in isolation.
const ts = require('typescript');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const assert = require('node:assert/strict');
const resolve = Module._resolveFilename;
Module._resolveFilename = function (request, parent, ...rest) {
  if (request.startsWith('.') && request.endsWith('.js')) {
    const source = path.resolve(path.dirname(parent.filename), request.replace(/\.js$/, '.ts'));
    if (fs.existsSync(source)) return source;
  }
  return resolve.call(this, request, parent, ...rest);
};
Module._extensions['.ts'] = (module, filename) => {
  const { outputText } = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    fileName: filename,
  });
  module._compile(outputText, filename);
};

const local = require('../src/engine/game.ts');
const server = require('../server/src/engine/game.ts');
const engines = [
  ['local', local, () => local.createInitialState('local', [1, 2].map(i => ({name:`P${i}`,trainer:'ash',trainerEmoji:'',isAI:false})))],
  ['server', server, () => server.createGameState('test', [1, 2].map(i => ({id:`p${i}`,name:`P${i}`,avatar:''})))],
];
for (const [name, engine, create] of engines) {
  for (const kind of ['rare', 'legendary']) {
    const game = create(), player = game.players[0];
    const id = game.board[`${kind}Revealed`].id;
    for (const [source, cardId, level] of [['board', id], ['deck', undefined, kind]]) {
      const before = JSON.stringify(game);
      const result = engine.reserveCard(game, player.id, source, cardId, level);
      assert.equal(result.success, false, `${name}: reject ${kind} ${source}`);
      assert.match(result.message, /不能保留/);
      assert.equal(JSON.stringify(game), before, `${name}: rejected reserve must not mutate state`);
    }
  }
  for (const source of ['board', 'deck']) {
    const game = create(), player = game.players[0];
    const card = game.board.revealed[1][0];
    const result = engine.reserveCard(game, player.id, source, source === 'board' ? card.id : undefined, source === 'deck' ? 1 : undefined);
    assert.equal(result.success, true);
    assert.equal(player.reservedCards.length, 1);
    assert.equal(player.tokens.purple, 1);
    assert.equal(game.tokenSupply.purple, 4);
    if (source === 'board') assert(!game.board.revealed[1].some(c => c.id === card.id));
  }
  const game = create(), before = JSON.stringify(game);
  assert.equal(engine.reserveCard(game, game.players[0].id, 'board', 'missing').success, false);
  assert.equal(JSON.stringify(game), before);
  console.log(`PASS ${name}: special board/deck blocked atomically; normal reserve and master-ball reward intact`);
}

// Evolution depends on permanent bonuses; a bag full of tokens cannot replace them.
const { getAvailableEvolutions } = require('../src/engine/evolution.ts');
const { createAllCards } = require('../src/data/cards.ts');
const game = engines[0][2](), player = game.players[0], cards = createAllCards();
const target = cards.find(c => c.evolutionOf && c.evolutionReq);
const base = cards.find(c => c.name === target.evolutionOf);
player.ownedCards = [base];
player.tokens = { ...target.evolutionReq };
player.bonuses = { red:0, blue:0, black:0, pink:0, yellow:0, purple:0 };
game.board.revealed[target.level] = [target];
assert(!getAvailableEvolutions(player, game.board).some(e => e.to.id === target.id));
player.tokens = { red:0, blue:0, black:0, pink:0, yellow:0, purple:0 };
player.bonuses = { ...target.evolutionReq };
assert(getAvailableEvolutions(player, game.board).some(e => e.to.id === target.id));
console.log('PASS evolution: permanent bonuses qualify, held tokens do not');
