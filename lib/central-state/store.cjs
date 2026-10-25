const {createMagicStore} = require('../magicEnglishStore.cjs');
const {groups} = require('./keys.cjs');
const crypto = require('node:crypto');
function createCentralState({store = createMagicStore({prefix: 'block-central:', dir: require('node:path').join(process.cwd(), '.central-state-data')})} = {}) {
  async function read(userId) {
    const records = await Promise.all(Object.keys(groups(userId)).map(async game => [game, await store.latest(`${userId}:game:${game}:`)]));
    return Object.fromEntries(records.filter(([, record]) => record));
  }
  const invalid = message => Object.assign(Error(message), {status: 400});
  async function write(userId, body) {
    if (!body || !/^[a-zA-Z0-9-]{16,80}$/.test(body.operationId || '') || !/^[a-zA-Z0-9-]{16,80}$/.test(body.browserId || '')) throw invalid('잘못된 저장 요청입니다.');
    const allowed = groups(userId);
    if (!body.games || typeof body.games !== 'object' || Array.isArray(body.games) || Object.keys(body.games).length > 7) throw invalid('게임 기록이 올바르지 않습니다.');
    for (const [game, entries] of Object.entries(body.games)) {
      if (!Object.hasOwn(allowed, game) || !entries || typeof entries !== 'object' || Array.isArray(entries)) throw invalid('지원하지 않는 게임입니다.');
      for (const [key, value] of Object.entries(entries)) {
        if (!allowed[game].includes(key) || typeof value !== 'string') throw invalid('저장 키가 올바르지 않습니다.');
        // Preserve original serialized bytes, including saves the game may need to repair.
      }
    }
    const digest = crypto.createHash('sha256').update(JSON.stringify(body)).digest('hex');
    const op = await store.putOnce(`${userId}:operation:${body.operationId}`, {digest, games: body.games, browserId: body.browserId, migration: body.migration === true, savedAt: new Date().toISOString()});
    if (op.value.digest !== digest) throw Object.assign(Error('같은 요청의 내용이 변경되었습니다.'), {status:409});
    const value = op.value;
    if (value.migration) await store.putOnce(`${userId}:migration:${body.browserId}`, value);
    for (const [game, entries] of Object.entries(value.games)) {
      await store.putOnce(`${userId}:game:${game}:${value.savedAt}:${body.operationId}`, {entries, savedAt: value.savedAt, operationId: body.operationId});
    }
    return {ok: true, savedAt: value.savedAt};
  }
  return {read, write};
}
module.exports = {createCentralState};
