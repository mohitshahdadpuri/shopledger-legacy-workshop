var test = require('node:test');
var assert = require('node:assert/strict');
var pricing = require('../lib/pricing');
var orders = require('./fixtures/orders').orders;

function money(actual, expected, label) {
  assert.ok(Number.isFinite(actual) && Math.abs(actual - expected) < 0.01,
    label + ': expected ' + expected + ', got ' + actual);
}

// Literal expectations, independent of the pricing implementation.
// Per line: GST percent, gross, discount, taxable, tax, net.
var expected = [
  { taxable: 610, cgst: 33.45, sgst: 33.45, lines: [[18, 280, 0, 280, 50.4, 330.4], [5, 330, 0, 330, 16.5, 346.5]] },
  { taxable: 918, cgst: 22.95, sgst: 22.95, lines: [[5, 640, 64, 576, 28.8, 604.8], [5, 380, 38, 342, 17.1, 359.1]] },
  { taxable: 350, cgst: 24.68, sgst: 24.67, lines: [[12, 260, 32.5, 227.5, 27.3, 254.8], [18, 140, 17.5, 122.5, 22.05, 144.55]] },
  { taxable: 2090, cgst: 52.25, sgst: 52.25, lines: [[5, 2240, 150, 2090, 104.5, 2194.5]] },
  { taxable: 950, cgst: 45.98, sgst: 45.98, lines: [[5, 640, 32, 608, 30.4, 638.4], [18, 360, 18, 342, 61.56, 403.56]] },
  { taxable: 1149.5, cgst: 77.81, sgst: 77.8, lines: [[12, 900, 45, 855, 102.6, 957.6], [18, 310, 15.5, 294.5, 53.01, 347.51]] },
  { taxable: 1280, cgst: 63.5, sgst: 63.5, lines: [[12, 900, 0, 900, 108, 1008], [5, 380, 0, 380, 19, 399]] },
  { taxable: 500, cgst: 45, sgst: 45, lines: [[18, 140, 0, 140, 25.2, 165.2], [18, 360, 0, 360, 64.8, 424.8]] }
];

orders.forEach(function (order, index) {
  test('CHECKOUT CONTRACT: #' + order.id + ' total ' + order.total.toFixed(2) + ' / GST ' + order.tax.toFixed(2), function () {
    var before = structuredClone(order);
    var actual = pricing.computeTotals(order.items, order.coupon);
    var pin = expected[index];
    assert.deepEqual(Object.keys(actual).sort(), ['subtotal', 'discount', 'taxable', 'tax', 'cgst', 'sgst', 'total', 'lines'].sort());
    ['subtotal', 'discount', 'tax', 'total'].forEach(function (key) {
      money(actual[key], order[key], key);
    });
    ['taxable', 'cgst', 'sgst'].forEach(function (key) {
      money(actual[key], pin[key], key);
    });
    money(actual.cgst + actual.sgst, actual.tax, 'GST split');
    assert.equal(actual.lines.length, order.items.length);
    actual.lines.forEach(function (line, i) {
      var item = order.items[i];
      assert.deepEqual(Object.keys(line).sort(), ['id', 'name', 'hsn', 'gstPercent', 'gross', 'discount', 'taxable', 'tax', 'net'].sort());
      assert.equal(line.id, item.id);
      assert.equal(line.name, item.name);
      assert.equal(line.hsn, item.hsn);
      assert.equal(line.gstPercent, pin.lines[i][0]);
      ['gross', 'discount', 'taxable', 'tax', 'net'].forEach(function (key, j) {
        money(line[key], pin.lines[i][j + 1], 'line ' + i + ' ' + key);
      });
    });
    assert.deepEqual(order, before, 'checkout must not mutate its input');
  });
});
