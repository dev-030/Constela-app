const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

test('likes update locally before the server responds and roll back on failure', () => {
  let quota = { limit: 3, used: 2, remaining: 1, resets_at: '2099-01-01T00:00:00Z' };
  const useProfileStore = {
    getState: () => ({
      profile: { access: { quotas: { likes: quota } } },
      updateQuota: (_kind, next) => { quota = next; },
    }),
  };
  let mutationOptions;
  const modules = {
    '@tanstack/react-query': {
      useMutation: options => { mutationOptions = options; return options; },
      useQueryClient: () => ({ invalidateQueries: () => {} }),
      useInfiniteQuery: () => {},
      useQuery: () => {},
    },
    './client': { apiClient: {} },
    '@/store/profileStore': { useProfileStore },
  };
  const source = fs.readFileSync(require.resolve('../api/matching.ts'), 'utf8');
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const exports = {};
  vm.runInNewContext(compiled, { exports, require: name => modules[name] });

  exports.useSwipeActionMutation();
  const context = mutationOptions.onMutate({ targetId: 'profile-b', action: 'liked' });
  assert.equal(quota.used, 3);
  assert.equal(quota.remaining, 0);

  mutationOptions.onError({}, { targetId: 'profile-b', action: 'liked' }, context);
  assert.equal(quota.used, 2);
  assert.equal(quota.remaining, 1);
});

test('a quota reserved at swipe start is not decremented twice by the request', () => {
  let quota = { limit: 3, used: 2, remaining: 1, resets_at: '2099-01-01T00:00:00Z' };
  const useProfileStore = {
    getState: () => ({
      profile: { access: { quotas: { likes: quota } } },
      updateQuota: (_kind, next) => { quota = next; },
    }),
  };
  let mutationOptions;
  const modules = {
    '@tanstack/react-query': {
      useMutation: options => { mutationOptions = options; return options; },
      useQueryClient: () => ({ invalidateQueries: () => {} }),
      useInfiniteQuery: () => {},
      useQuery: () => {},
    },
    './client': { apiClient: {} },
    '@/store/profileStore': { useProfileStore },
  };
  const source = fs.readFileSync(require.resolve('../api/matching.ts'), 'utf8');
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const exports = {};
  vm.runInNewContext(compiled, { exports, require: name => modules[name] });

  const reservation = exports.reserveLocalLikeQuota();
  assert.equal(reservation.allowed, true);
  assert.equal(quota.used, 3);
  assert.equal(quota.remaining, 0);

  exports.useSwipeActionMutation();
  const context = mutationOptions.onMutate({
    targetId: 'profile-b',
    action: 'liked',
    previousQuota: reservation.previousQuota,
  });
  assert.equal(quota.used, 3);
  assert.equal(quota.remaining, 0);

  mutationOptions.onError({}, { targetId: 'profile-b', action: 'liked' }, context);
  assert.equal(quota.used, 2);
  assert.equal(quota.remaining, 1);

  quota = { ...quota, used: 3, remaining: 0 };
  assert.equal(exports.reserveLocalLikeQuota().allowed, false);
  assert.equal(quota.remaining, 0);
});

test('the server quota wins over rollback when the backend reports the limit', () => {
  let quota = { limit: 3, used: 3, remaining: 0, resets_at: '2099-01-01T00:00:00Z' };
  const useProfileStore = {
    getState: () => ({
      profile: { access: { quotas: { likes: quota } } },
      updateQuota: (_kind, next) => { quota = next; },
    }),
  };
  let mutationOptions;
  const modules = {
    '@tanstack/react-query': {
      useMutation: options => { mutationOptions = options; return options; },
      useQueryClient: () => ({ invalidateQueries: () => {} }),
      useInfiniteQuery: () => {},
      useQuery: () => {},
    },
    './client': { apiClient: {} },
    '@/store/profileStore': { useProfileStore },
  };
  const source = fs.readFileSync(require.resolve('../api/matching.ts'), 'utf8');
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const exports = {};
  vm.runInNewContext(compiled, { exports, require: name => modules[name] });

  exports.useSwipeActionMutation();
  mutationOptions.onError(
    { response: { data: { quota } } },
    { targetId: 'profile-b', action: 'liked' },
    { previousQuota: { ...quota, used: 2, remaining: 1 } },
  );
  assert.equal(quota.used, 3);
  assert.equal(quota.remaining, 0);
});
