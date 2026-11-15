const test = require('node:test');
const assert = require('node:assert/strict');
const orders = require('../lib/orders');
const dates = require('../lib/dates');
const ledger = require('../lib/ledger');

function history() {
  return { orders: ['28/12/2021', '05/01/2022', '14/01/2022', '30/01/2022',
    '02/02/2022', '18/02/2022', '04/03/2022', '15/03/2022']
    .map((date, i) => ({ id: 1001 + i, date })) };
}
function account() {
  return { customers: [{ id: 1, name: 'Meera Joshi', openingBalance: 450,
    totalBilled: 1982.01, totalSettled: 1200, balance: 1232.01 }],
  settlements: [], nextSettlementId: 501 };
}
const ids = (db, filters) => orders.list(db, filters).map(o => o.id);
const money = (actual, expected) => assert.ok(typeof actual === 'number' &&
  Math.abs(actual - expected) < 0.01, actual + ' should equal ' + expected);

test('history: all eight orders newest first without source mutation', () => {
  const db = history();
  const before = structuredClone(db);
  assert.deepEqual(ids(db), [1008, 1007, 1006, 1005, 1004, 1003, 1002, 1001]);
  assert.deepEqual(db, before);
});
for (const [from, to, expected] of [
  ['2022-01-01', '2022-01-31', [1004, 1003, 1002]],
  ['2022-01-01', '2022-02-28', [1006, 1005, 1004, 1003, 1002]],
  ['2021-12-28', '2022-01-05', [1002, 1001]],
  ['2022-01-30', '2022-02-02', [1005, 1004]],
  ['2022-01-14', '2022-01-14', [1003]]
]) {
  test('history: inclusive range ' + from + ' to ' + to, () => {
    const db = history(), before = structuredClone(db);
    assert.deepEqual(ids(db, { from, to }), expected);
    assert.deepEqual(db, before);
    const indian = s => s.split('-').reverse().join('/');
    assert.deepEqual(ids(db, { from: indian(from), to: indian(to) }), expected);
  });
}
test('history: equivalent stored formats and equal dates retain source order', () => {
  const db = { orders: [{ id: 1, date: '05/01/2022' },
    { id: 2, date: '2022-01-05' }, { id: 3, date: '04/01/2022' }] };
  const before = structuredClone(db);
  assert.deepEqual(ids(db), [1, 2, 3]);
  assert.deepEqual(ids(db, { from: '2022-01-05', to: '05/01/2022' }), [1, 2]);
  assert.deepEqual(db, before);
});
test('dates: sortable keys validate calendar dates and preserve fiscal normalization', () => {
  assert.equal(dates.sortableDateKey('05/01/2022'), '2022-01-05');
  assert.equal(dates.sortableDateKey('2022-01-05'), '2022-01-05');
  assert.equal(dates.sortableDateKey('29/02/2024'), '2024-02-29');
  for (const invalid of ['31/02/2022', '2022-13-01', '2023-02-29', 'abc', '', null])
    assert.equal(dates.sortableDateKey(invalid), '');
  assert.equal(dates.normalizeDateKey('2022-01-05'), '05/01/2022');
  assert.equal(dates.getFiscalYear('2022-01-05'), 'FY21-22');
  assert.equal(dates.getFiscalYear('2022-04-01'), 'FY22-23');
});
for (const amount of ['500', 500]) {
  test('settlement: ' + typeof amount + ' 500 then 100 uses numeric totals', () => {
    const db = account();
    const result = ledger.recordSettlement(db, 1, amount);
    assert.equal(result.ok, true);
    money(result.customer.totalSettled, 1700);
    money(result.customer.balance, 732.01);
    money(result.settlement.amount, result.customer.totalSettled - 1200);
    assert.equal(ledger.recordSettlement(db, 1, '100').ok, true);
    money(db.customers[0].totalSettled, 1800);
    money(db.customers[0].balance, 632.01);
    assert.equal(db.nextSettlementId, 503);
    assert.equal(db.settlements.length, 2);
  });
}
for (const [label, amount] of [
  ['abc', 'abc'], ['zero', 0], ['negative', -5], ['empty', ''], ['spaces', '  '],
  ['NaN', NaN], ['Infinity', Infinity], ['negative Infinity', -Infinity],
  ['Infinity string', 'Infinity'], ['null', null], ['undefined', undefined],
  ['boolean', true], ['array', [500]], ['object', {}], ['bigint', 500n]
]) {
  test('settlement: rejects ' + label + ' without any mutation', () => {
    const db = account(), before = structuredClone(db);
    assert.equal(ledger.recordSettlement(db, 1, amount).ok, false);
    assert.deepEqual(db, before);
  });
}
test('settlement: rounded receipt agrees with rounded ledger increment', () => {
  const db = account();
  const result = ledger.recordSettlement(db, 1, '10.126');
  assert.equal(result.ok, true);
  money(result.settlement.amount, 10.13);
  money(result.customer.totalSettled, 1210.13);
  money(result.settlement.amount, result.customer.totalSettled - 1200);
  money(result.customer.balance, 1221.88);
});
