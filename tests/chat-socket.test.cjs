const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

test('room messages appear immediately and are replaced by the server response', async () => {
  let messages = [];
  const posts = [];
  const profile = {
    id: 'profile-a',
    username: 'Jamil',
    photos: [{ is_main: true, image: 'avatar.jpg' }],
  };
  const queryClient = {
    setQueryData(key, updater) {
      if (key[0] === 'roomMessages') messages = updater(messages);
    },
    getQueryData: () => undefined,
    getQueryCache: () => ({ getAll: () => [] }),
    removeQueries: () => {},
  };
  const useProfileStore = (selector) => selector({ profile });
  useProfileStore.getState = () => ({ profile });
  const useAuthStore = () => ({ accessToken: null });
  useAuthStore.getState = () => ({ isAuthenticated: true });

  const modules = {
    react: {
      __esModule: true,
      default: {},
      createContext: () => ({ Provider: 'Provider' }),
      useCallback: (fn) => fn,
      useContext: () => null,
      useEffect: () => {},
      useRef: (value) => ({ current: value }),
      useState: (value) => [value, () => {}],
    },
    'react/jsx-runtime': { jsx: (type, props) => ({ type, props }) },
    '@tanstack/react-query': { useQueryClient: () => queryClient },
    '@/store/authStore': { useAuthStore },
    '@/store/profileStore': { useProfileStore },
    '@/constants/config': { WS_URL: 'ws://test' },
    '@/api/client': {
      apiClient: {
        post: async (path, body) => {
          posts.push({ path, body });
          return {
            data: {
              id: 'confirmed-1',
              room: 'room-1',
              sender: profile.id,
              sender_name: profile.username,
              sender_photo: 'avatar.jpg',
              content: body.content,
              timestamp: new Date().toISOString(),
            },
          };
        },
      },
    },
  };
  const source = fs.readFileSync(require.resolve('../api/ChatSocketProvider.tsx'), 'utf8');
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.ReactJSX,
      esModuleInterop: true,
    },
  }).outputText;
  const exports = {};
  vm.runInNewContext(compiled, {
    exports,
    require: (name) => modules[name],
    WebSocket: { OPEN: 1 },
    console,
  });

  const provider = exports.ChatSocketProvider({ children: null });
  provider.props.value.sendRoomMessage('room-1', ' hello ');

  assert.equal(messages.length, 1);
  assert.match(messages[0].id, /^temp-/);
  assert.equal(messages[0].content, 'hello');
  assert.equal(posts.length, 1);
  assert.equal(posts[0].path, '/api/chat/rooms/room-1/send/');
  assert.equal(posts[0].body.content, 'hello');

  await Promise.resolve();
  assert.equal(messages.length, 1);
  assert.equal(messages[0].id, 'confirmed-1');
});
