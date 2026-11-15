const { test } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const crypto = require('node:crypto');
const store = require('../lib/store');

const secret = 'test-admin-secret';
const fixture = { customers: [{ id: 'private-fixture' }], orders: [] };

async function setup(t, key) {
  const previous = process.env.SHOPLEDGER_ADMIN_KEY;
  if (key === undefined) delete process.env.SHOPLEDGER_ADMIN_KEY;
  else process.env.SHOPLEDGER_ADMIN_KEY = key;
  t.after(() => {
    if (previous === undefined) delete process.env.SHOPLEDGER_ADMIN_KEY;
    else process.env.SHOPLEDGER_ADMIN_KEY = previous;
  });
  for (const module of ['../config', '../routes/reports', '../server']) {
    delete require.cache[require.resolve(module)];
  }
  let reads = 0;
  t.mock.method(store, 'read', () => { reads++; return fixture; });
  t.mock.method(store, 'write', () => { throw new Error('Unexpected database write'); });
  const server = http.createServer(require('../server'));
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise(resolve => server.close(resolve)));
  return {
    reads: () => reads,
    request(path = '/api/admin/export', headers = {}) {
      return new Promise((resolve, reject) => {
        http.get({ hostname: '127.0.0.1', port: server.address().port, path, headers }, res => {
          let body = '';
          res.setEncoding('utf8');
          res.on('data', chunk => { body += chunk; });
          res.on('end', () => resolve({ status: res.statusCode, body }));
        }).on('error', reject);
      });
    }
  };
}

test('environment key authorizes export only through the administrator header', async t => {
  const app = await setup(t, secret);
  assert.equal(require('../config').adminKey, secret);
  const res = await app.request(undefined, { 'x-admin-key': secret });
  assert.equal(res.status, 200);
  assert.deepEqual(JSON.parse(res.body), fixture);
  assert.equal(app.reads(), 1);
});

test('missing, invalid, non-admin and former embedded credentials expose no database', async t => {
  const app = await setup(t, secret);
  for (const headers of [{}, { 'x-admin-key': '' }, { 'x-admin-key': 'wrong' },
    { 'x-admin-key': 'test-admin-secreX' }, { 'x-admin-key': 'shopledger-admin-2021' },
    { 'x-user-role': 'user' }]) {
    const res = await app.request(undefined, headers);
    assert.equal(res.status, 403);
    assert.equal(res.body, 'Forbidden');
  }
  assert.equal(app.reads(), 0);
});

test('query credentials never authorize or override an invalid header', async t => {
  const app = await setup(t, secret);
  for (const key of [secret, 'shopledger-admin-2021', '', 'wrong']) {
    for (const headers of [{}, { 'x-admin-key': 'wrong' }]) {
      const res = await app.request('/api/admin/export?key=' + key, headers);
      assert.equal(res.status, 403);
      assert.equal(res.body, 'Forbidden');
    }
  }
  assert.equal(app.reads(), 0);
});

for (const key of [undefined, '']) {
  test(`secret configuration ${key === undefined ? 'unset' : 'empty'} fails closed for every credential form`, async t => {
    const app = await setup(t, key);
    for (const path of ['/api/admin/export', '/api/admin/export?key=shopledger-admin-2021',
      '/api/admin/export?key=' + secret, '/api/admin/export?key=']) {
      for (const headers of [{}, { 'x-admin-key': secret }, { 'x-admin-key': 'shopledger-admin-2021' }]) {
        const res = await app.request(path, headers);
        assert.equal(res.status, 403);
        assert.equal(res.body, 'Forbidden');
      }
    }
    assert.equal(app.reads(), 0);
  });
}

test('equal-length credential comparisons use crypto.timingSafeEqual and its result', async t => {
  const app = await setup(t, secret);
  const compare = t.mock.method(crypto, 'timingSafeEqual', () => false);
  const res = await app.request(undefined, { 'x-admin-key': secret });
  assert.equal(res.status, 403);
  assert.equal(compare.mock.callCount(), 1);
  assert.deepEqual(compare.mock.calls[0].arguments, [Buffer.from(secret), Buffer.from(secret)]);
  assert.equal(app.reads(), 0);
});
