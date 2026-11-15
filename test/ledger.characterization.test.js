const test = require('node:test');
const assert = require('node:assert/strict');
const ledger = require('../lib/ledger');

test('CURRENT BEHAVIOUR: string settlement concatenates the total', () => {
  const db = { customers: [{ id: 1, name: 'Meera Joshi', openingBalance: 450,
    totalBilled: 1982.01, totalSettled: 1200 }], settlements: [], nextSettlementId: 501 };
  const result = ledger.recordSettlement(db, 1, '500');
  assert.equal(result.ok, true);
  assert.equal(result.customer.totalSettled, '1200500');
  assert.ok(Math.abs(result.customer.balance - (-1198067.99)) < 0.01);
  assert.ok(Math.abs(result.settlement.amount - 500) < 0.01);
});
