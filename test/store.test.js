var test = require('node:test');
var assert = require('node:assert/strict');
var fs = require('node:fs');
var os = require('node:os');
var path = require('node:path');

function fixture(t) {
  var directory = fs.mkdtempSync(path.join(os.tmpdir(), 'shopledger-store-'));
  var file = path.join(directory, 'db.json');
  var previous = process.env.SHOPLEDGER_DB_FILE;
  process.env.SHOPLEDGER_DB_FILE = file;
  delete require.cache[require.resolve('../lib/store')];
  var store = require('../lib/store');
  t.after(function () {
    delete require.cache[require.resolve('../lib/store')];
    if (previous === undefined) delete process.env.SHOPLEDGER_DB_FILE;
    else process.env.SHOPLEDGER_DB_FILE = previous;
    fs.rmSync(directory, { recursive: true, force: true });
  });
  return { store: store, file: file, directory: directory };
}

test('read supplies missing collections and ID defaults', function (t) {
  var f = fixture(t);
  fs.writeFileSync(f.file, '{}');
  assert.deepEqual(f.store.read(), {
    products: [], orders: [], customers: [], settlements: [], auditLog: [],
    nextOrderId: 1001, nextSettlementId: 501
  });
});

test('successful saves replace records with complete parseable JSON', function (t) {
  var f = fixture(t);
  f.store.write({ products: [{ id: 1 }] });
  var replacement = { products: [{ id: 2 }], nextOrderId: 1234 };
  f.store.write(replacement);
  assert.deepEqual(JSON.parse(fs.readFileSync(f.file, 'utf8')), replacement);
  assert.deepEqual(f.store.read(), replacement);
});

test('read reports invalid JSON', function (t) {
  var f = fixture(t);
  fs.writeFileSync(f.file, '{');
  assert.throws(function () { f.store.read(); }, SyntaxError);
});

test('save reports filesystem write failures', function (t) {
  var f = fixture(t);
  fs.rmSync(f.directory, { recursive: true });
  assert.throws(function () { f.store.write({}); }, { code: 'ENOENT' });
});
