const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

function setup() {
  const state = { profile: { id: 'account-a', subscription_tier: 'freemium' }, authenticated: true, sdkId: null, logins: [], posts: [] };
  const sdk = {
    configure: ({ appUserID }) => { state.sdkId = appUserID; },
    getAppUserID: async () => state.sdkId,
    logIn: async id => { state.sdkId = id; state.logins.push(id); },
    getOfferings: async () => ({ all: {} }),
    getCustomerInfo: async () => ({ entitlements: { active: {} } }),
    purchasePackage: async () => ({ customerInfo: { entitlements: { active: {} } } }),
    restorePurchases: async () => ({ entitlements: { active: {} } }),
  };
  const modules = {
    'react-native-purchases': { __esModule: true, default: sdk },
    'react-native': { NativeModules: { RNPurchases: {} } },
    '@/store/profileStore': { useProfileStore: { getState: () => ({ profile: state.profile, setProfile: data => { state.profile = data; } }) } },
    '@/store/authStore': { useAuthStore: { getState: () => ({ isAuthenticated: state.authenticated }) } },
    './client': { apiClient: { post: async path => { state.posts.push(path); return { data: state.response ?? { ...state.profile, subscription_tier: 'light' } }; } } },
  };
  const source = fs.readFileSync(require.resolve('../api/purchases.ts'), 'utf8');
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
  const exports = {};
  vm.runInNewContext(compiled, { exports, require: name => {
    if (!(name in modules)) throw new Error('Unexpected import: ' + name);
    return modules[name];
  }, process: { env: { EXPO_PUBLIC_REVENUECAT_KEY: 'public-test-key' } }, console });
  return { api: exports, state, sdk };
}

test('switching accounts logs into RevenueCat before the next purchase', async () => {
  const { api, state } = setup();
  await api.initializePurchases('account-a');
  state.profile = { id: 'account-b' };
  await api.purchasePackage({});
  assert.equal(state.sdkId, 'account-b');
  assert.deepEqual(state.logins, ['account-b']);
});

test('logged-out users cannot purchase or initialize an arbitrary identity', async () => {
  const { api, state } = setup();
  state.authenticated = false;
  await assert.rejects(api.purchasePackage({}));
  assert.equal(state.sdkId, null);
});

test('store cancellation does not grant local premium access', async () => {
  const { api, state, sdk } = setup();
  sdk.purchasePackage = async () => { throw { userCancelled: true }; };
  assert.equal(await api.purchasePackage({}), null);
  assert.equal(state.profile.subscription_tier, 'freemium');
});

test('verification uses backend response and rejects cross-account responses', async () => {
  const { api, state } = setup();
  await api.syncSubscription();
  assert.equal(state.profile.subscription_tier, 'light');
  assert.deepEqual(state.posts, ['/api/subscription/sync/']);
  state.response = { id: 'account-b', subscription_tier: 'plus' };
  await assert.rejects(api.syncSubscription());
  assert.equal(state.profile.id, 'account-a');
});

test('purchase results cannot update a different signed-in account', async () => {
  const { api, state, sdk } = setup();
  sdk.purchasePackage = async () => {
    state.profile = { id: 'account-b', subscription_tier: 'freemium' };
    return { customerInfo: {} };
  };
  await assert.rejects(api.purchasePackage({}));
  assert.equal(state.profile.subscription_tier, 'freemium');
});
