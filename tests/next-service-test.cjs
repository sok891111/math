const http = require('http');
const assert = require('assert');
const { spawn } = require('child_process');

function request(url, options = {}, body = null) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const payload = body ? (typeof body === 'string' ? body : JSON.stringify(body)) : null;
    const reqOptions = {
      hostname: parsed.hostname,
      port: parsed.port,
      path: parsed.pathname + parsed.search,
      method: options.method || 'GET',
      headers: {
        ...(options.headers || {}),
        ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {})
      }
    };

    const req = http.request(reqOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: data }));
    });

    req.on('error', reject);
    if (payload) {
      req.write(payload);
    }
    req.end();
  });
}

async function run() {
  const PORT = 4188;
  console.log(`Starting Next.js server on port ${PORT}...`);

  const server = spawn('npx', ['next', 'start', '-p', String(PORT)], {
    cwd: process.cwd(),
    env: { ...process.env, PORT: String(PORT), ADMIN_SECRET: 'test-admin-secret' }
  });

  server.stdout.on('data', d => process.stdout.write('[server] ' + d));
  server.stderr.on('data', d => process.stderr.write('[server-err] ' + d));

  // Wait for server to start
  let ready = false;
  for (let i = 0; i < 30; i++) {
    try {
      const res = await request(`http://localhost:${PORT}/admin`);
      if (res.status === 200) {
        ready = true;
        break;
      }
    } catch {
      await new Promise(r => setTimeout(r, 500));
    }
  }

  if (!ready) {
    server.kill();
    throw new Error('Server failed to start within timeout');
  }

  console.log('\n--- 1. Testing Admin Auth API ---');
  // Wrong password
  const failAuth = await request(`http://localhost:${PORT}/api/admin/auth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { password: 'wrong-password' });
  assert.strictEqual(failAuth.status, 401, 'Should fail auth with wrong password');

  // Login with default 'admin'
  const adminAuth = await request(`http://localhost:${PORT}/api/admin/auth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { password: 'admin' });
  assert.strictEqual(adminAuth.status, 200, 'Should succeed auth with default admin password');

  // Login with env ADMIN_SECRET
  const successAuth = await request(`http://localhost:${PORT}/api/admin/auth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { password: 'test-admin-secret' });
  assert.strictEqual(successAuth.status, 200, 'Should succeed auth with correct env password');
  const authData = JSON.parse(successAuth.body);
  const secret = authData.secret;
  assert.strictEqual(secret, 'test-admin-secret');
  console.log('✅ Admin Auth API test passed (both "admin" and env secret work).');

  console.log('\n--- 1.1 Testing Base URL Guide Modal ---');
  const rootRes = await request(`http://localhost:${PORT}/`);
  assert.strictEqual(rootRes.status, 200, 'Root path should return 200');
  assert(rootRes.body.includes('개인별 전용 접속 링크로'), 'Root path should show personalized URL guide modal');
  assert(!rootRes.body.includes('/admin'), 'Root path should NEVER expose admin link publicly');
  console.log('✅ Base URL Guide Modal displayed correctly without exposing admin link.');

  console.log('\n--- 2. Testing User Creation API ---');
  // Add User "지우" (no final consonant, should have '야', '의')
  const addUserRes = await request(`http://localhost:${PORT}/api/admin/users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-secret': secret
    }
  }, { name: '지우' });
  assert.strictEqual(addUserRes.status, 200, 'User creation should succeed');
  const createdUser = JSON.parse(addUserRes.body).user;
  assert(createdUser.id && createdUser.id.length === 6, 'User should have 6-char id');
  assert.strictEqual(createdUser.name, '지우');
  console.log(`✅ User created: ${createdUser.name} (${createdUser.id})`);

  console.log('\n--- 3. Testing User Lobby Entry Page (/:userId) ---');
  const lobbyRes = await request(`http://localhost:${PORT}/${createdUser.id}`);
  assert.strictEqual(lobbyRes.status, 200, 'User lobby route should return 200');
  assert(lobbyRes.body.includes('수학 모험 기지') || lobbyRes.body.includes('지우'), 'Should serve personalized dot lobby entry page');
  assert(lobbyRes.body.includes(`/${createdUser.id}/platformer`), 'Should have link to sunshine platformer');
  assert(lobbyRes.body.includes(`/${createdUser.id}/island`), 'Should have link to block island');
  console.log('✅ User Lobby Entry Page served with 2 dot game cards.');

  console.log('\n--- 4. Testing Sunshine Platformer Route (/:userId/platformer) ---');
  const platformerRes = await request(`http://localhost:${PORT}/${createdUser.id}/platformer`);
  assert.strictEqual(platformerRes.status, 200, 'User platformer route should return 200');
  assert(platformerRes.body.includes('지우'), 'Should personalize child name in platformer game');
  assert(platformerRes.body.includes('window.__BLOCK_USER__'), 'Should inject __BLOCK_USER__ in platformer');
  console.log('✅ Sunshine Platformer game served successfully.');

  console.log('\n--- 5. Testing Block Island Route (/:userId/island) ---');
  const islandRes = await request(`http://localhost:${PORT}/${createdUser.id}/island`);
  assert.strictEqual(islandRes.status, 200, 'User island route should return 200');
  assert(islandRes.body.includes('지우의 열칸 블록섬') || islandRes.body.includes('반가워, 지우야!'), 'Should personalize Korean name in island game');
  assert(islandRes.body.includes('window.__BLOCK_USER__'), 'Should inject __BLOCK_USER__ in island game');
  console.log('✅ Block Island game served successfully.');

  console.log('\n--- 5.1 Testing Badge Showcase Route (/:userId/badges) ---');
  const badgesRes = await request(`http://localhost:${PORT}/${createdUser.id}/badges`);
  assert.strictEqual(badgesRes.status, 200, 'User badges route should return 200');
  assert(badgesRes.body.includes('지우의 뱃지 보관함') || badgesRes.body.includes('지우'), 'Should serve personalized badge showcase page');
  assert(badgesRes.body.includes('나의 뱃지 링크'), 'Should include share button');
  console.log('✅ Badge Showcase page served successfully.');

  console.log('\n--- 5.2 Testing Badge Sync API (/api/user/:userId/badges) ---');
  const syncBadgesRes = await request(`http://localhost:${PORT}/api/user/${createdUser.id}/badges`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  }, { badges: { earnedIds: ['first-light', 'island-fox-bridge'] } });
  assert.strictEqual(syncBadgesRes.status, 200, 'Badges sync should succeed');

  const getBadgesRes = await request(`http://localhost:${PORT}/api/user/${createdUser.id}/badges`);
  assert.strictEqual(getBadgesRes.status, 200, 'Get badges API should return 200');
  const badgesApiData = JSON.parse(getBadgesRes.body);
  assert(badgesApiData.badges?.earnedIds?.includes('first-light'), 'Should contain synced badge');
  console.log('✅ Badge Sync API works correctly.');

  console.log('\n--- 6. Testing Non-existent User Route ---');
  const notFoundRes = await request(`http://localhost:${PORT}/nonexist123`);
  assert.strictEqual(notFoundRes.status, 404, 'Non-existent user route should return 404');
  console.log('✅ Non-existent user returns 404 as expected.');

  console.log('\n--- 7. Testing User Deletion ---');
  const deleteRes = await request(`http://localhost:${PORT}/api/admin/users`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-secret': secret
    }
  }, { userId: createdUser.id });
  assert.strictEqual(deleteRes.status, 200, 'User deletion should succeed');

  const afterDeleteRes = await request(`http://localhost:${PORT}/${createdUser.id}`);
  assert.strictEqual(afterDeleteRes.status, 404, 'Deleted user route should now return 404');
  console.log('✅ User deletion test passed and URL invalidated.');

  console.log('\n🎉 ALL SERVICE INTEGRATION TESTS PASSED!\n');
  server.kill();
  process.exit(0);
}

run().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
