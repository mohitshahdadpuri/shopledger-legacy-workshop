const test = require('node:test');
const assert = require('node:assert/strict');
const orders = require('../lib/orders');

function fixture() {
  return { orders: ['28/12/2021', '05/01/2022', '14/01/2022', '30/01/2022',
    '02/02/2022', '18/02/2022', '04/03/2022', '15/03/2022']
    .map((date, i) => ({ id: 1001 + i, date })) };
}
const current = [1004, 1001, 1006, 1008, 1003, 1002, 1007, 1005];
test('CURRENT BEHAVIOUR: history sorts day-first strings', () => {
  assert.deepEqual(orders.list(fixture()).map(o => o.id), current);
});
for (const [from, to, expected] of [
  ['2022-01-01', '2022-01-31', current],
  ['2022-01-01', '2022-02-28', [1006, 1008, 1003, 1002, 1007, 1005]],
  ['2021-12-28', '2022-01-05', []]
]) {
  test(`CURRENT BEHAVIOUR: date range ${from} through ${to}`, () => {
    assert.deepEqual(orders.list(fixture(), { from, to }).map(o => o.id), expected);
  });
}
