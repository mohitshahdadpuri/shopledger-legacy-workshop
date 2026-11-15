const { test } = require('node:test');
const assert = require('node:assert/strict');
const inventory = require('../lib/inventory');
const orders = require('../lib/orders');
const ledger = require('../lib/ledger');

for (const [sku, stock, reserved] of [['DRY-001', 1, 0], ['SPC-001', 4, 3]]) {
  test('#3 exact last unit succeeds for ' + sku, () => {
    const products = [{ id: 1, sku, stock, reserved }];
    const items = [{ id: 1, qty: 1 }];
    assert.equal(inventory.check(products, items).ok, true);
    inventory.reserve(products, items);
    assert.equal(inventory.getSellableStock(products[0]), 0);
    assert.equal(products[0].reserved, reserved);
  });
}

test('#3 excess quantity fails without mutation', () => {
  const products = [{ id: 1, stock: 4, reserved: 3 }];
  const before = structuredClone(products);
  assert.equal(inventory.check(products, [{ id: 1, qty: 2 }]).ok, false);
  assert.deepEqual(products, before);
});

test('#4 cancel #1007 restores both products, preserves reservations and reverses Khata once', () => {
  const db = {
    products: [{ id: 6, sku: 'DRY-001', stock: 1, reserved: 0 }, { id: 4, sku: 'OIL-001', stock: 22, reserved: 4 }],
    customers: [{ id: 4, totalBilled: 1507, balance: 1507 }],
    orders: [{ id: 1007, status: 'pending', paymentMode: 'khata', customerId: 4, total: 1407,
      items: [{ id: 6, qty: 2 }, { id: 4, qty: 2 }] }]
  };
  assert.equal(orders.cancel(db, 1007).ok, true);
  assert.ok(Math.abs(db.customers[0].totalBilled - 100) <= 0.01);
  assert.deepEqual(db.products.map(p => [p.stock, p.reserved]), [[3, 0], [24, 4]]);
  const before = structuredClone(db);
  assert.equal(orders.cancel(db, 1007).ok, false);
  assert.deepEqual(db, before);
});

test('#4 create/cancel cycle with duplicate lines restores starting inventory and Khata', () => {
  const db = { nextOrderId: 1, products: [{ id: 1, stock: 10, reserved: 3 }], orders: [],
    customers: [{ id: 1, totalBilled: 100, balance: 100 }] };
  const before = structuredClone(db.products);
  const items = [{ id: 1, qty: 2 }, { id: 1, qty: 3 }];
  assert.equal(inventory.check(db.products, items).ok, true);
  assert.equal(ledger.chargeOrderToKhata(db, 1, 50).ok, true);
  inventory.reserve(db.products, items);
  const order = orders.add(db, { items, paymentMode: 'khata', customerId: 1, total: 50 });
  assert.equal(orders.cancel(db, order.id).ok, true);
  assert.deepEqual(db.products, before);
  assert.ok(Math.abs(db.customers[0].totalBilled - 100) <= 0.01);
});

for (const reserved of [0, 3]) {
  test('#10 duplicate demand exceeding sellable fails without mutation, reserved=' + reserved, () => {
    const products = [{ id: 1, stock: 10, reserved }];
    const before = structuredClone(products);
    const qty = reserved ? 4 : 6;
    assert.equal(inventory.check(products, [{ id: 1, qty }, { id: 1, qty }]).ok, false);
    assert.deepEqual(products, before);
  });
}

test('#10 accepted aggregate including mixed numeric/string IDs deducts exactly sellable stock', () => {
  const products = [{ id: 1, stock: 10, reserved: 3 }];
  const items = [{ id: 1, qty: 3 }, { id: '1', qty: 4 }];
  assert.equal(inventory.check(products, items).ok, true);
  inventory.reserve(products, items);
  assert.equal(products[0].stock, 3);
  assert.equal(products[0].reserved, 3);
  assert.ok(products[0].stock >= products[0].reserved);
});

test('#10 unique-line orders retain intended behavior', () => {
  const products = [{ id: 1, stock: 10, reserved: 3 }, { id: 2, stock: 8, reserved: 2 }];
  const items = [{ id: 1, qty: 2 }, { id: 2, qty: 3 }];
  assert.equal(inventory.check(products, items).ok, true);
  inventory.reserve(products, items);
  assert.deepEqual(products.map(p => [p.stock, p.reserved]), [[8, 3], [5, 2]]);
});
