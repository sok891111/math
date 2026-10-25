const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const {createMagicStore} = require('../lib/magicEnglishStore.cjs');
const {createCentralState} = require('../lib/central-state/store.cjs');
const {centralStateHTML} = require('../lib/central-state/html.cjs');
const {groups} = require('../lib/central-state/keys.cjs');
const id = 'Test12', key = groups(id).island[0];
const payload = (operationId, value) => ({operationId, browserId: 'browser-123456789', migration: true, games: {island: {[key]: value}}});
test('migration preserves exact bytes, retry does not roll back newer saves, and namespaces are isolated', async () => {
 const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'central-state-'));
 try {
  const store = createMagicStore({client: false, dir, vercel: false, prefix: 'test:'});
  const state = createCentralState({store});
  const first = payload('operation-123456789', '{"completed":3,"treasures":["old"]}');
  await state.write(id, first);
  assert.equal((await state.read(id)).island.entries[key], first.games.island[key]);
  await new Promise(r => setTimeout(r, 5));
  const second = payload('operation-987654321', '{"completed":4}');
  second.migration = false;
  await state.write(id, second);
  await state.write(id, first);
  assert.equal((await state.read(id)).island.entries[key], second.games.island[key]);
  assert.deepEqual(await state.read('Other1'), {});
  assert.equal((await store.get(id + ':migration:' + first.browserId)).games.island[key], first.games.island[key]);
  await assert.rejects(state.write(id, {...first, games: {island: {[key]: 'changed'}}}));
  await assert.rejects(state.write(id, {...second, games: {island: {'block_admin_secret': 'bad'}}}));
 } finally { await fs.rm(dir, {recursive:true, force:true}); }
});
test('a partial write retries safely and keeps the original migration', async () => {
 const rows = new Map(); let fail = true;
 const store = {
  async putOnce(key,value) { if (key.includes(':game:') && fail) {fail=false; throw Error('connection lost');} if (!rows.has(key)) rows.set(key,value); return {value:rows.get(key)}; },
  async latest(prefix) {return [...rows.entries()].filter(([key])=>key.startsWith(prefix)).sort(([a],[b])=>b.localeCompare(a))[0]?.[1] || null;}
 };
 const state = createCentralState({store}), body = payload('operation-partial123', 'original');
 await assert.rejects(state.write(id,body));
 await state.write(id,body);
 assert.equal((await state.read(id)).island.entries[key], 'original');
});
test('HTML waits for hydration while retaining context and module types', () => {
 const html = centralStateHTML('<body><script>window.__BLOCK_USER__={id:"Test12"}</script><script src="/one.js"></script><script type="module" src="app.js"></script></body>', id);
 assert.match(html, /window.__BLOCK_USER__/);
 assert.match(html, /data-central-src="\/one.js"/);
 assert.match(html, /data-central-type="module"/);
 assert.match(html, /BlockCentralState.boot\("Test12"\)/);
 assert.equal(centralStateHTML('<body>guest</body>', null), '<body>guest</body>');
});
