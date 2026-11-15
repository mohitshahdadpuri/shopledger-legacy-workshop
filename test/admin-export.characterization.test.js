const { test } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const store = require('../lib/store');

const fixture = { customers: [{ id: 'fixture-only' }], orders: [] };

async function request(t, path, headers = {}) {
  const previous = process.env.SHOPLEDGER_ADMIN_KEY;
  process.env.SHOPLEDGER_ADMIN_KEY = 'characterization-secret';
  t.after(() => {
    if (previous === undefined) delete process.env.SHOPLEDGER_ADMIN_KEY;
    else process.env.SHOPLEDGER_ADMIN_KEY = previous;
  });
  for (const module of ['../config', '../routes/reports', '../server']) {
    delete require.cache[require.resolve(module)];
  }
  t.mock.method(store, 'read', () => fixture);
  t.mock.method(store, 'write', () => { throw new Error('Unexpected database write'); });
  const app = require('../server');
  const server = http.createServer(app);
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise(resolve => server.close(resolve)));
  return new Promise((resolve, reject) => {
    http.get({ hostname: '127.0.0.1', port: server.address().port, path, headers }, res => {
      let body = '';
      res.setEncoding('utf8');
      res.on('data', chunk => { body += chunk; });
      res.on('end', () => resolve({ status: res.statusCode, body }));
    }).on('error', reject);
  });
}

test('CURRENT BEHAVIOUR: environment key in administrator header returns the database', async t => {
  const res = await request(t, '/api/admin/export', { 'x-admin-key': 'characterization-secret' });
  assert.equal(res.status, 200);
  assert.deepEqual(JSON.parse(res.body), fixture);
});

test('CURRENT BEHAVIOUR: former hardcoded query key returns 403', async t => {
  const res = await request(t, '/api/admin/export?key=shopledger-admin-2021');
  assert.equal(res.status, 403);
  assert.equal(res.body, 'Forbidden');
});
