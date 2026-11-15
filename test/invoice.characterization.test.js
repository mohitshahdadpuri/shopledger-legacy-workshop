var test = require('node:test');
var assert = require('node:assert/strict');
var invoice = require('../lib/invoice');
var reports = require('../lib/reports');
var fixtures = require('./fixtures/orders');

function money(actual, expected, label) {
  assert.ok(Number.isFinite(actual) && Math.abs(actual - expected) < 0.01,
    label + ': expected ' + expected + ', got ' + actual);
}

// Corrected invoice contract: checkout remains the source of truth.
// Per line: gross, post-discount tax, HSN GST percentage.
var expected = [
  { subtotal: 610, discount: 0, taxable: 610, tax: 66.9, cgst: 33.45, sgst: 33.45, total: 676.9, lines: [[280, 50.4, 18], [330, 16.5, 5]], delta: 0 },
  { subtotal: 1020, discount: 102, taxable: 918, tax: 45.9, cgst: 22.95, sgst: 22.95, total: 963.9, lines: [[640, 28.8, 5], [380, 17.1, 5]], delta: 0 },
  { subtotal: 400, discount: 50, taxable: 350, tax: 49.35, cgst: 24.68, sgst: 24.67, total: 399.35, lines: [[260, 27.3, 12], [140, 22.05, 18]], delta: 0 },
  { subtotal: 2240, discount: 150, taxable: 2090, tax: 104.5, cgst: 52.25, sgst: 52.25, total: 2194.5, lines: [[2240, 104.5, 5]], delta: 0 },
  { subtotal: 1000, discount: 50, taxable: 950, tax: 91.96, cgst: 45.98, sgst: 45.98, total: 1041.96, lines: [[640, 30.4, 5], [360, 61.56, 18]], delta: 0 },
  { subtotal: 1210, discount: 60.5, taxable: 1149.5, tax: 155.61, cgst: 77.81, sgst: 77.8, total: 1305.11, lines: [[900, 102.6, 12], [310, 53.01, 18]], delta: 0 },
  { subtotal: 1280, discount: 0, taxable: 1280, tax: 127, cgst: 63.5, sgst: 63.5, total: 1407, lines: [[900, 108, 12], [380, 19, 5]], delta: 0 },
  { subtotal: 500, discount: 0, taxable: 500, tax: 90, cgst: 45, sgst: 45, total: 590, lines: [[140, 25.2, 18], [360, 64.8, 18]], delta: 0 }
];

fixtures.orders.forEach(function (order, index) {
  var pin = expected[index];
  var prefix = order.id === 1008 ? 'MATCHING BASELINE: ' : 'CORRECTED BEHAVIOUR: ';
  test(prefix + '#' + order.id + ' invoice shows ' + pin.total.toFixed(2) + ' / GST ' + pin.tax.toFixed(2), function () {
    var before = structuredClone(order);
    var actual = invoice.computeInvoiceFigures(order);
    assert.deepEqual(Object.keys(actual).sort(), ['subtotal', 'discount', 'taxable', 'tax', 'cgst', 'sgst', 'total', 'rows'].sort());
    ['subtotal', 'discount', 'taxable', 'tax', 'cgst', 'sgst', 'total'].forEach(function (key) {
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
      assert.equal(row.gstPercent, pin.lines[i][2], 'invoice uses HSN slabs');
      money(row.line, pin.lines[i][0], 'row gross');
      money(row.lineTax, pin.lines[i][1], 'row tax');
    });
    assert.deepEqual(order, before, 'invoice must not mutate its input');
  });
});

test('CORRECTED BEHAVIOUR: GST reconciliation matches all 8 orders', function () {
  var db = structuredClone(fixtures);
  var before = structuredClone(db);
  var actual = reports.getGstReconciliation(db);
  assert.equal(actual.totalChecked, 8);
  assert.equal(actual.mismatchCount, 0);
  money(actual.totalDelta, 0, 'total absolute delta');
  assert.equal(actual.rows.length, 8);
  assert.deepEqual(actual.rows.filter(function (row) { return row.matched; }).map(function (row) { return row.orderId; }), [1001, 1002, 1003, 1004, 1005, 1006, 1007, 1008]);
  actual.rows.forEach(function (row, i) {
    var order = fixtures.orders[i];
    var pin = expected[i];
    assert.equal(row.orderId, order.id);
    assert.equal(row.date, order.date);
    assert.equal(row.customer, order.customer);
    assert.equal(row.coupon, order.coupon);
    assert.equal(row.matched, true);
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
