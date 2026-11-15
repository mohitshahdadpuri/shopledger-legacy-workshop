const test = require('node:test');
const assert = require('node:assert/strict');
const ledger = require('../lib/ledger');

test('string settlement increments the numeric total', () => {
  const db = { customers: [{ id: 1, name: 'Meera Joshi', openingBalance: 450,
    totalBilled: 1982.01, totalSettled: 1200 }], settlements: [], nextSettlementId: 501 };
  const result = ledger.recordSettlement(db, 1, '500');
  assert.equal(result.ok, true);
  assert.equal(typeof result.customer.totalSettled, 'number');
  assert.ok(Math.abs(result.customer.totalSettled - 1700) < 0.01);
  assert.ok(Math.abs(result.customer.balance - 732.01) < 0.01);
  assert.ok(Math.abs(result.settlement.amount - 500) < 0.01);
});
