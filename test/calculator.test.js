import test from 'node:test';
import assert from 'node:assert/strict';
import { calculate, nonNegative } from '../calculator.js';
import { TRANSLATIONS } from '../translations.js';
import { CONFIG } from '../config.js';
import { readFile } from 'node:fs/promises';

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

test('all commission VAT choices preserve their intended behavior', () => {
  for (const commissionVat of ['included', 'none', 'unsure']) {
    const result = calculate({ ...base, commissionType: 'fixed', commissionFixed: 1000, commissionVat });
    assert.equal(result.commissionVat, 0);
    assert.equal(result.total, 201000);
  }
  const added = calculate({ ...base, commissionType: 'fixed', commissionFixed: 1000, commissionVat: 'added' });
  assert.equal(added.commissionVat, 250);
  assert.equal(added.total, 201250);
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
    assert.deepEqual(Object.keys(TRANSLATIONS[language].vatOptions), ['included', 'added', 'none', 'unsure']);
    assert.equal(Object.keys(TRANSLATIONS[language].standardCosts).length, 7);
  }
});

test('HR and EN CTA mailto content is correctly URL encoded', () => {
  const links = Object.fromEntries(['hr', 'en'].map(language => {
    const copy = TRANSLATIONS[language];
    return [language, `mailto:${CONFIG.ctaEmail}?subject=${encodeURIComponent(copy.ctaSubject)}&body=${encodeURIComponent(copy.ctaBody)}`];
  }));
  assert.match(links.hr, /^mailto:info\.ttnekretnine@gmail\.com\?subject=Upit%20za%20provjeru/);
  assert.ok(links.hr.includes('Po%C5%A1tovani'));
  assert.ok(links.en.includes('subject=Pre-purchase%20property%20check%20in%20Croatia'));
  assert.ok(!TRANSLATIONS.hr.ctaBody.includes('dokument'));
  assert.ok(!TRANSLATIONS.en.ctaBody.includes('document'));
});

test('APN is an external informational link and not part of calculation inputs', async () => {
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  assert.equal(CONFIG.apnCalculatorsUrl, 'https://apn.hr/povrat-poreza/kalkulatori-za-okvirni-izracun-potpore/');
  assert.match(html, /id="apn-link"[^>]+target="_blank"[^>]+rel="noopener noreferrer"/);
  assert.ok(!Object.keys(base).some(key => key.toLowerCase().includes('apn')));
});
