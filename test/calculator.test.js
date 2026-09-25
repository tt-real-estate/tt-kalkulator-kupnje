import test from 'node:test';
import assert from 'node:assert/strict';
import { calculate, nonNegative } from '../calculator.js';
import { TRANSLATIONS } from '../translations.js';

const base = { purchasePrice: 200000, taxTreatment: 'unsure', commissionType: 'none', commissionVat: 'none', additionalCosts: [] };

test('3% transfer tax without commission', () => {
  const result = calculate({ ...base, taxTreatment: 'transfer' });
  assert.equal(result.transferTax, 6000); assert.equal(result.total, 206000);
});

test('VAT included property adds no transfer tax or VAT', () => {
  const result = calculate({ ...base, taxTreatment: 'vatIncluded' });
  assert.equal(result.transferTax, 0); assert.equal(result.total, 200000);
});

test('percentage commission without VAT', () => {
  const result = calculate({ ...base, commissionType: 'percentage', commissionPercentage: 2.5 });
  assert.equal(result.commission, 5000); assert.equal(result.commissionVat, 0); assert.equal(result.total, 205000);
});

test('25% VAT is added only to percentage commission', () => {
  const result = calculate({ ...base, commissionType: 'percentage', commissionPercentage: 2, commissionVat: 'added' });
  assert.equal(result.commission, 4000); assert.equal(result.commissionVat, 1000); assert.equal(result.total, 205000);
});

test('fixed commission with VAT included is not taxed again', () => {
  const result = calculate({ ...base, commissionType: 'fixed', commissionFixed: 4000, commissionVat: 'included' });
  assert.equal(result.commission, 4000); assert.equal(result.commissionVat, 0); assert.equal(result.total, 204000);
});

test('several additional costs are itemised and totalled once', () => {
  const result = calculate({ ...base, additionalCosts: [{ name: 'Lawyer', amount: 1500 }, { name: 'Notary', amount: 300 }, { name: 'Translation', amount: 200 }] });
  assert.equal(result.additionalCosts.length, 3); assert.equal(result.additionalCostsTotal, 2000); assert.equal(result.total, 202000); assert.equal(result.additionalPercentage, 1);
});

test('unsure tax treatment adds no tax', () => {
  const result = calculate(base); assert.equal(result.transferTax, 0); assert.equal(result.total, 200000);
});

test('negative and empty numeric values safely become zero', () => {
  assert.equal(nonNegative(-10), 0); assert.equal(nonNegative(''), 0); assert.equal(nonNegative('abc'), 0);
});

test('HR and EN dictionaries provide complete core option sets', () => {
  for (const language of ['hr', 'en']) {
    assert.deepEqual(Object.keys(TRANSLATIONS[language].taxOptions), ['transfer', 'vatIncluded', 'unsure']);
    assert.deepEqual(Object.keys(TRANSLATIONS[language].commissionOptions), ['none', 'percentage', 'fixed']);
    assert.equal(Object.keys(TRANSLATIONS[language].standardCosts).length, 7);
  }
});
