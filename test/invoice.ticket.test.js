var test = require('node:test');
var assert = require('node:assert/strict');
var invoice = require('../lib/invoice');
var reports = require('../lib/reports');
var fixtures = require('./fixtures/orders');

function money(actual, expected) {
  assert.ok(Number.isFinite(actual) && Math.abs(actual - expected) < 0.01,
    'expected ' + expected + ', got ' + actual);
}

fixtures.orders.filter(function (order) { return order.status !== 'cancelled'; }).forEach(function (order) {
  test('Ticket 1: #' + order.id + ' invoice equals ledger to the paisa', function () {
    var actual = invoice.computeInvoiceFigures(order);
    ['subtotal', 'discount', 'tax', 'total'].forEach(function (key) {
      money(actual[key], order[key]);
    });
    money(actual.cgst + actual.sgst, actual.tax);
  });
});

test('Ticket 1: #1002 invoice is 963.90 with GST 45.90', function () {
  var actual = invoice.computeInvoiceFigures(fixtures.orders[1]);
  money(actual.total, 963.90);
  money(actual.tax, 45.90);
});

test('Ticket 1: #1004 SAVE10 discount is capped at 150', function () {
  money(invoice.computeInvoiceFigures(fixtures.orders[3]).discount, 150);
});

test('Ticket 1: #1001 and #1007 use the real HSN GST slabs', function () {
  assert.deepEqual(invoice.computeInvoiceFigures(fixtures.orders[0]).rows.map(function (row) { return row.gstPercent; }), [18, 5]);
  assert.deepEqual(invoice.computeInvoiceFigures(fixtures.orders[6]).rows.map(function (row) { return row.gstPercent; }), [12, 5]);
});

test('Ticket 1: GST reconciliation matches all 8 orders', function () {
  var actual = reports.getGstReconciliation(structuredClone(fixtures));
  assert.equal(actual.totalChecked, 8);
  assert.equal(actual.mismatchCount, 0);
  money(actual.totalDelta, 0);
  assert.ok(actual.rows.every(function (row) { return row.matched; }));
});

test('Ticket 1: printed totals are ordered and display the corrected values', function () {
  fixtures.orders.forEach(function (order) {
    var html = invoice.render(order);
    var labels = ['Gross Subtotal', 'Coupon Discount', 'Taxable Value', 'CGST', 'SGST', 'Invoice Total'];
    var totals = html.slice(html.indexOf('<table class="totals-table">'));
    var previous = -1;
    labels.forEach(function (label) {
      var index = totals.indexOf('<td>' + label);
      assert.ok(index > previous, '#' + order.id + ': missing or unordered ' + label);
      previous = index;
    });
    assert.ok(totals.includes('₹' + order.total.toFixed(2)), 'printed ledger total');
    assert.ok(!html.includes('Accountant Reconciliation Notice'));
  });
  var html = invoice.render(fixtures.orders[1]);
  assert.match(html, /<td class="r">5%<\/td>/);
  assert.match(html, /Taxable Value<\/td><td class="r">₹918\.00/);
  assert.match(html, /CGST<\/td><td class="r">₹22\.95/);
  assert.match(html, /SGST<\/td><td class="r">₹22\.95/);
});
