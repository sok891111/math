/* Personal URLs intentionally remain the only access credential. */
(function () {
  'use strict';
  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  const uuid = () => crypto.randomUUID();
  async function fingerprint(entries) {
    const canonical = Object.fromEntries(Object.entries(entries).sort(([a], [b]) => a.localeCompare(b)));
    const bytes = new TextEncoder().encode(JSON.stringify(canonical));
    const digest = await crypto.subtle.digest('SHA-256', bytes);
    return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
  }
  let active;
  window.BlockCentralState = {
    start(id) {
      if (active?.id === id) return active.ready;
      if (active) { clearInterval(active.timer); window.removeEventListener('online', active.online); }
      const names = window.BlockStateKeys.groups(id);
      const metaKey = 'block-central-meta-v1:' + id;
      const pendingKey = 'block-central-pending-v1:' + id;
      const storage = localStorage;
      let meta = JSON.parse(storage.getItem(metaKey) || 'null') || {browserId: uuid(), migrated: false, baseline: {}};
      let busy = false, started = false, retryRequested = false;
      const session = active = {id};
      const persistMeta = () => storage.setItem(metaKey, JSON.stringify(meta));
      function snapshot() {
        const result = {};
        for (const [game, keys] of Object.entries(names)) {
          result[game] = {};
          for (const key of keys) { const raw = storage.getItem(key); if (raw !== null) result[game][key] = raw; }
        }
        return result;
      }
      const hasRecords = () => Object.values(snapshot()).some(entries => Object.keys(entries).length);
      async function request(method, body) {
        const response = await fetch('/api/user/' + encodeURIComponent(id) + '/state', {
          method, cache: 'no-store', credentials: 'same-origin',
          ...(body ? {headers: {'Content-Type': 'application/json'}, body: JSON.stringify(body)} : {}),
          signal: AbortSignal.timeout(20000),
        });
        if (!response.ok) throw Error('서버 저장 연결 실패');
        return response.json();
      }
      function enqueue(games, migration) {
        const payload = {browserId: meta.browserId, operationId: uuid(), migration, games};
        storage.setItem(pendingKey, JSON.stringify(payload));
        return payload;
      }
      async function sendPending() {
        const raw = storage.getItem(pendingKey);
        if (!raw) return;
        const body = JSON.parse(raw);
        await request('POST', body);
        // A different tab may have queued another upload while this one was running.
        if (storage.getItem(pendingKey) !== raw) return;
        for (const [game, entries] of Object.entries(body.games)) meta.baseline[game] = await fingerprint(entries);
        if (body.migration) meta.migrated = true;
        persistMeta();
        storage.removeItem(pendingKey);
      }
      async function sync() {
        if (busy || active !== session) return;
        busy = true;
        try {
          // Reload acknowledgements shared with other tabs of this same browser.
          meta = JSON.parse(storage.getItem(metaKey) || 'null') || meta;
          if (!meta.migrated && !storage.getItem(pendingKey)) {
            const games = Object.fromEntries(Object.entries(snapshot()).filter(([, entries]) => Object.keys(entries).length));
            enqueue(games, true);
          }
          if (!navigator.onLine) throw Error('offline');
          await sendPending();
          const current = snapshot(), changes = {};
          for (const game of Object.keys(names)) {
            if (await fingerprint(current[game]) !== (meta.baseline[game] || await fingerprint({}))) changes[game] = current[game];
          }
          if (Object.keys(changes).length) { enqueue(changes, false); await sendPending(); }
          const remote = await request('GET');
          let changed = false;
          for (const [game, record] of Object.entries(remote.games)) {
            if (!names[game]) continue;
            const now = snapshot()[game];
            // Do not overwrite progress produced while the request was in flight.
            if (await fingerprint(now) !== (meta.baseline[game] || await fingerprint({})) || !same(now, snapshot()[game])) continue;
            if (!same(now, record.entries)) {
              // This clean local copy is already preserved in the server's immutable history.
              for (const key of names[game]) {
                if (Object.hasOwn(record.entries, key)) storage.setItem(key, record.entries[key]);
                else storage.removeItem(key);
              }
              changed = true;
            }
            meta.baseline[game] = await fingerprint(record.entries);
          }
          persistMeta();
          // Existing game controllers restore their state only at startup.
          if (changed && started) location.reload();
          return true;
        } catch (error) {
          console.warn('[central-state]', error.message);
          if (!hasRecords()) throw Error('기존 서버 기록을 확인하지 못했어요. 인터넷 연결 후 새로고침해 주세요.');
          return false;
        } finally { busy = false; if (retryRequested) { retryRequested = false; queueMicrotask(() => sync().catch(() => {})); } }
      }
      persistMeta();
      session.online = () => { if (busy) retryRequested = true; else sync().catch(() => {}); };
      window.addEventListener('online', session.online);
      // Retry transient server failures even when the browser never fired an online event.
      session.timer = setInterval(() => sync().catch(() => {}), 10 * 60 * 1000);
      session.ready = sync().then(() => { started = true; });
      return session.ready;
    },
    async boot(id) {
      try {
        await this.start(id);
        for (const old of document.querySelectorAll('script[data-central-src]')) {
          await new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = old.getAttribute('data-central-src');
            if (old.dataset.centralType) script.type = old.dataset.centralType;
            script.onload = resolve; script.onerror = reject;
            old.replaceWith(script);
          });
        }
      } catch (error) {
        const panel = document.createElement('div');
        panel.style.cssText = 'position:fixed;inset:0;z-index:2147483647;background:#fffbed;display:grid;place-content:center;padding:32px;font:18px sans-serif';
        panel.textContent = error.message || '기록을 불러오지 못했어요. 새로고침해 주세요.';
        const button = document.createElement('button'); button.textContent = '다시 연결하기'; button.onclick = () => location.reload(); panel.append(button);
        document.body.append(panel);
      }
    },
  };
})();
