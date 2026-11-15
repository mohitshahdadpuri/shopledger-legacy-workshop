const { test } = require('node:test');
const assert = require('node:assert/strict');
const inventory = require('../lib/inventory');
const orders = require('../lib/orders');

test('check accepts below sellable and rejects unknown and excess without mutation', () => {
  const products = [{ id: 1, name: 'Item', stock: 10, reserved: 3 }];
  const before = structuredClone(products);
  assert.equal(inventory.check(products, [{ id: 1, qty: 6 }]).ok, true);
  assert.equal(inventory.check(products, [{ id: 1, qty: 8 }]).ok, false);
  assert.equal(inventory.check(products, [{ id: 2, qty: 1 }]).ok, false);
  assert.deepEqual(products, before);
});

test('CURRENT BEHAVIOUR: check rejects exact sellable stock', () => {
  assert.equal(inventory.check([{ id: 1, stock: 4, reserved: 3 }], [{ id: 1, qty: 1 }]).ok, false);
});

test('CURRENT BEHAVIOUR: duplicate lines pass check and reserve oversells', () => {
  const products = [{ id: 1, stock: 10, reserved: 0 }];
  const items = [{ id: 1, qty: 6 }, { id: 1, qty: 6 }];
  assert.equal(inventory.check(products, items).ok, true);
  inventory.reserve(products, items);
  assert.equal(products[0].stock, -2);
});

test('reserve deducts every accepted duplicate line and preserves reservations', () => {
  const products = [{ id: 1, stock: 10, reserved: 2 }];
  inventory.reserve(products, [{ id: 1, qty: 2 }, { id: 1, qty: 3 }]);
  assert.deepEqual(products, [{ id: 1, stock: 5, reserved: 2 }]);
});

test('CURRENT BEHAVIOUR: release ignores actual order identifiers including duplicates', () => {
  const products = [{ id: 1, stock: 5, reserved: 2 }];
  inventory.release(products, [{ id: 1, qty: 2 }, { id: 1, qty: 3 }]);
  assert.deepEqual(products, [{ id: 1, stock: 5, reserved: 2 }]);
});

test('CURRENT BEHAVIOUR: cancel changes status without restoring duplicate line stock', () => {
  const db = { products: [{ id: 1, stock: 5, reserved: 2 }], orders: [
    { id: 1007, status: 'pending', items: [{ id: 1, qty: 2 }, { id: 1, qty: 3 }] }
  ] };
  assert.equal(orders.cancel(db, 1007, 'test').ok, true);
  assert.equal(db.orders[0].status, 'cancelled');
  assert.equal(db.products[0].stock, 5);
  const before = structuredClone(db);
  assert.equal(orders.cancel(db, 1007).ok, false);
  assert.equal(orders.cancel(db, 999).ok, false);
  assert.deepEqual(db, before);
});
