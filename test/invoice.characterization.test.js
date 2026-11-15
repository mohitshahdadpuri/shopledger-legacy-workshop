var test = require('node:test');
var assert = require('node:assert/strict');
var invoice = require('../lib/invoice');
var reports = require('../lib/reports');
var fixtures = require('./fixtures/orders');

function money(actual, expected, label) {
  assert.ok(Number.isFinite(actual) && Math.abs(actual - expected) < 0.01,
    label + ': expected ' + expected + ', got ' + actual);
}

// Deliberately pin today's incorrect invoice engine; these are not desired totals.
var expected = [
  { subtotal: 610, discount: 0, tax: 109.8, cgst: 54.9, sgst: 54.9, total: 719.8, lines: [[280, 50.4], [330, 59.4]], delta: 42.9 },
  { subtotal: 1020, discount: 120.36, tax: 183.6, cgst: 91.8, sgst: 91.8, total: 1083.24, lines: [[640, 115.2], [380, 68.4]], delta: 119.34 },
  { subtotal: 400, discount: 50, tax: 72, cgst: 36, sgst: 36, total: 422, lines: [[260, 46.8], [140, 25.2]], delta: 22.65 },
  { subtotal: 2240, discount: 264.32, tax: 403.2, cgst: 201.6, sgst: 201.6, total: 2378.88, lines: [[2240, 403.2]], delta: 184.38 },
  { subtotal: 1000, discount: 50, tax: 180, cgst: 90, sgst: 90, total: 1130, lines: [[640, 115.2], [360, 64.8]], delta: 88.04 },
  { subtotal: 1210, discount: 71.39, tax: 217.8, cgst: 108.9, sgst: 108.9, total: 1356.41, lines: [[900, 162], [310, 55.8]], delta: 51.3 },
  { subtotal: 1280, discount: 0, tax: 230.4, cgst: 115.2, sgst: 115.2, total: 1510.4, lines: [[900, 162], [380, 68.4]], delta: 103.4 },
  { subtotal: 500, discount: 0, tax: 90, cgst: 45, sgst: 45, total: 590, lines: [[140, 25.2], [360, 64.8]], delta: 0 }
];

fixtures.orders.forEach(function (order, index) {
  var pin = expected[index];
  var prefix = order.id === 1008 ? 'MATCHING BASELINE: ' : 'CURRENT BEHAVIOUR: ';
  test(prefix + '#' + order.id + ' invoice shows ' + pin.total.toFixed(2) + ' / GST ' + pin.tax.toFixed(2), function () {
    var before = structuredClone(order);
    var actual = invoice.computeInvoiceFigures(order);
    assert.deepEqual(Object.keys(actual).sort(), ['subtotal', 'discount', 'tax', 'cgst', 'sgst', 'total', 'rows'].sort());
    ['subtotal', 'discount', 'tax', 'cgst', 'sgst', 'total'].forEach(function (key) {
      money(actual[key], pin[key], key);
    });
    money(actual.cgst + actual.sgst, actual.tax, 'GST split');
    assert.equal(actual.rows.length, order.items.length);
    actual.rows.forEach(function (row, i) {
      var item = order.items[i];
      assert.deepEqual(Object.keys(row).sort(), ['name', 'sku', 'hsn', 'qty', 'price', 'gstPercent', 'line', 'lineTax'].sort());
      ['name', 'sku', 'hsn', 'qty'].forEach(function (key) {
        assert.equal(row[key], item[key]);
      });
      money(row.price, item.price, 'row price');
      assert.equal(row.gstPercent, 18, 'current invoice ignores HSN slabs');
      money(row.line, pin.lines[i][0], 'row gross');
      money(row.lineTax, pin.lines[i][1], 'row tax');
    });
    assert.deepEqual(order, before, 'invoice must not mutate its input');
  });
});

test('CURRENT BEHAVIOUR: GST reconciliation mismatches 7 of 8 orders; only #1008 matches', function () {
  var db = structuredClone(fixtures);
  var before = structuredClone(db);
  var actual = reports.getGstReconciliation(db);
  assert.equal(actual.totalChecked, 8);
  assert.equal(actual.mismatchCount, 7);
  money(actual.totalDelta, 612.01, 'total absolute delta');
  assert.equal(actual.rows.length, 8);
  assert.deepEqual(actual.rows.filter(function (row) { return row.matched; }).map(function (row) { return row.orderId; }), [1008]);
  actual.rows.forEach(function (row, i) {
    var order = fixtures.orders[i];
    var pin = expected[i];
    assert.equal(row.orderId, order.id);
    assert.equal(row.date, order.date);
    assert.equal(row.customer, order.customer);
    assert.equal(row.coupon, order.coupon);
    assert.equal(row.matched, order.id === 1008);
    ['Subtotal', 'Discount', 'Tax', 'Total'].forEach(function (key) {
      money(row['ledger' + key], order[key.toLowerCase()], 'ledger ' + key);
    });
    ['Discount', 'Tax', 'Total'].forEach(function (key) {
      money(row['invoice' + key], pin[key.toLowerCase()], 'invoice ' + key);
    });
    money(row.delta, pin.delta, 'delta');
  });
  assert.deepEqual(db, before, 'reconciliation must not mutate its input');
});
