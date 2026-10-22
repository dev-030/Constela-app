const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

const source = fs.readFileSync(
  require.resolve('../utils/message-reactions.ts'),
  'utf8'
);
const compiled = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2019,
  },
}).outputText;

const module_ = { exports: {} };
vm.runInNewContext(compiled, {
  module: module_,
  exports: module_.exports,
  require,
});
const { toggleReactionSummary, removeMyReaction } = module_.exports;

// The module is evaluated in its own VM context, so compare plain JSON.
const plain = (value) => JSON.parse(JSON.stringify(value));

const ME = 'profile-me';
const OTHER = 'profile-other';

test('the first reaction creates a single pill', () => {
  const reactions = toggleReactionSummary([], '👍', ME);
  assert.deepEqual(plain(reactions), [
    { emoji: '👍', count: 1, actor_ids: [ME] },
  ]);
});

test('reacting with another emoji replaces the previous one', () => {
  let reactions = toggleReactionSummary([], '👍', ME);
  reactions = toggleReactionSummary(reactions, '❤️', ME);

  assert.equal(reactions.length, 1);
  assert.equal(reactions[0].emoji, '❤️');
  assert.equal(reactions[0].count, 1);
  assert.deepEqual(plain(reactions[0].actor_ids), [ME]);
  assert.equal(reactions.filter((r) => r.actor_ids.includes(ME)).length, 1);
});

test('replacing a shared emoji keeps the other votes', () => {
  let reactions = [{ emoji: '👍', count: 2, actor_ids: [OTHER, ME] }];
  reactions = toggleReactionSummary(reactions, '❤️', ME);

  const thumbs = reactions.find((r) => r.emoji === '👍');
  const heart = reactions.find((r) => r.emoji === '❤️');
  assert.equal(thumbs.count, 1);
  assert.deepEqual(plain(thumbs.actor_ids), [OTHER]);
  assert.equal(heart.count, 1);
  assert.deepEqual(plain(heart.actor_ids), [ME]);
});

test('an empty pill is dropped when my reaction was the last one', () => {
  let reactions = [{ emoji: '👍', count: 1, actor_ids: [ME] }];
  reactions = toggleReactionSummary(reactions, '❤️', ME);

  assert.equal(reactions.length, 1);
  assert.equal(reactions[0].emoji, '❤️');
});

test('tapping my own emoji removes my reaction', () => {
  let reactions = toggleReactionSummary([], '👍', ME);
  reactions = toggleReactionSummary(reactions, '👍', ME);
  assert.deepEqual(plain(reactions), []);
});

test('tapping my own emoji in a shared pill only removes my vote', () => {
  let reactions = [{ emoji: '👍', count: 2, actor_ids: [OTHER, ME] }];
  reactions = toggleReactionSummary(reactions, '👍', ME);

  assert.equal(reactions.length, 1);
  assert.equal(reactions[0].count, 1);
  assert.deepEqual(plain(reactions[0].actor_ids), [OTHER]);
});

test('removeMyReaction drops my reaction from every pill', () => {
  const reactions = removeMyReaction(
    [
      { emoji: '👍', count: 1, actor_ids: [ME] },
      { emoji: '❤️', count: 2, actor_ids: [OTHER, ME] },
    ],
    ME
  );

  assert.equal(reactions.length, 1);
  assert.equal(reactions[0].emoji, '❤️');
  assert.equal(reactions[0].count, 1);
  assert.deepEqual(plain(reactions[0].actor_ids), [OTHER]);
});

test('removeMyReaction keeps other people\'s reactions untouched', () => {
  const reactions = removeMyReaction(
    [{ emoji: '👍', count: 3, actor_ids: [OTHER, ME, 'profile-third'] }],
    ME
  );

  assert.equal(reactions.length, 1);
  assert.equal(reactions[0].count, 2);
  assert.deepEqual(plain(reactions[0].actor_ids), [OTHER, 'profile-third']);
});

test('removeMyReaction on an empty list returns an empty list', () => {
  assert.deepEqual(plain(removeMyReaction([], ME)), []);
  assert.deepEqual(plain(removeMyReaction(null, ME)), []);
  assert.deepEqual(plain(removeMyReaction(undefined, ME)), []);
});

test('removeMyReaction without a profile id leaves the list as-is', () => {
  const reactions = [{ emoji: '👍', count: 1, actor_ids: [ME] }];
  assert.deepEqual(plain(removeMyReaction(reactions, null)), reactions);
  assert.deepEqual(plain(removeMyReaction(reactions, undefined)), reactions);
});
