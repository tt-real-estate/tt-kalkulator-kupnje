import { CONFIG } from './config.js';
import { calculate } from './calculator.js';
import { TRANSLATIONS } from './translations.js';

const standardCostKeys = ['lawyer', 'notary', 'registry', 'valuation', 'bank', 'translation', 'other'];
const state = { language: 'hr', taxTreatment: 'transfer', commissionType: 'none', customCosts: [], nextCostId: 1 };
const byId = id => document.getElementById(id);

function t() { return TRANSLATIONS[state.language]; }
function escapeHtml(value) { const node = document.createElement('div'); node.textContent = value; return node.innerHTML; }
function currency(value) { return new Intl.NumberFormat(t().locale, { style: 'currency', currency: 'EUR' }).format(value); }
function percentage(value) { return new Intl.NumberFormat(t().locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value) + '%'; }

function renderChoices() {
  byId('tax-options').innerHTML = Object.entries(t().taxOptions).map(([value, label]) => `
    <label class="choice ${state.taxTreatment === value ? 'selected' : ''}"><input type="radio" name="tax" value="${value}" ${state.taxTreatment === value ? 'checked' : ''}><span class="radio-mark"></span><b>${label}</b></label>`).join('');
  byId('commission-options').innerHTML = Object.entries(t().commissionOptions).map(([value, label]) => `
    <label class="segment ${state.commissionType === value ? 'selected' : ''}"><input type="radio" name="commission" value="${value}" ${state.commissionType === value ? 'checked' : ''}><span>${label}</span></label>`).join('');
  const vatValue = byId('commission-vat').value || 'included';
  byId('commission-vat').innerHTML = Object.entries(t().vatOptions).map(([value, label]) => `<option value="${value}" ${vatValue === value ? 'selected' : ''}>${label}</option>`).join('');
  byId('tax-note').textContent = t().taxNotes[state.taxTreatment];
  byId('vat-note').textContent = t().vatNotes[byId('commission-vat').value];
}

function renderStandardCosts() {
  const oldValues = Object.fromEntries(standardCostKeys.map(key => [key, byId(`cost-${key}`)?.value || '']));
  byId('standard-costs').innerHTML = standardCostKeys.map(key => `<label><span>${t().standardCosts[key]}</span><div class="money-input compact"><span>€</span><input id="cost-${key}" data-cost-key="${key}" type="number" min="0" step="10" inputmode="decimal" value="${oldValues[key]}" placeholder="0"></div></label>`).join('');
}

function renderCustomCosts() {
  byId('custom-costs').innerHTML = state.customCosts.map(cost => `<div class="custom-cost" data-id="${cost.id}">
    <label><span>${t().costName}</span><input class="custom-name" type="text" value="${escapeHtml(cost.name)}" placeholder="${t().costName}"></label>
    <label><span>${t().amount}</span><div class="money-input compact"><span>€</span><input class="custom-amount" type="number" min="0" step="10" inputmode="decimal" value="${cost.amount}" placeholder="0"></div></label>
    <button type="button" class="remove-cost" aria-label="${t().removeCost}" title="${t().removeCost}">×</button>
  </div>`).join('');
}

function collectInput() {
  const additionalCosts = standardCostKeys.map(key => ({ key, name: t().standardCosts[key], amount: byId(`cost-${key}`).value }));
  state.customCosts.forEach(cost => additionalCosts.push({ key: `custom-${cost.id}`, name: cost.name.trim() || t().unnamedCost, amount: cost.amount }));
  return { purchasePrice: byId('purchase-price').value, taxTreatment: state.taxTreatment, commissionType: state.commissionType, commissionPercentage: byId('commission-percentage').value, commissionFixed: byId('commission-fixed').value, commissionVat: byId('commission-vat').value, additionalCosts };
}

function updateResults() {
  const result = calculate(collectInput());
  const lines = [{ name: t().purchaseLine, amount: result.purchasePrice }];
  if (result.transferTax > 0) lines.push({ name: t().transferLine, amount: result.transferTax });
  if (result.commission > 0) lines.push({ name: t().commissionLine, amount: result.commission });
  if (result.commissionVat > 0) lines.push({ name: t().vatLine, amount: result.commissionVat });
  result.additionalCosts.forEach(cost => lines.push({ name: cost.name, amount: cost.amount }));
  byId('breakdown').innerHTML = lines.map(line => `<div><span>${escapeHtml(line.name)}</span><strong>${currency(line.amount)}</strong></div>`).join('');
  byId('total').textContent = currency(result.total);
  byId('additional-total').textContent = currency(result.costsAbovePrice);
  byId('additional-percentage').innerHTML = `${percentage(result.additionalPercentage)} <span data-i18n="ofPrice">${t().ofPrice}</span>`;
}

function updateConditionalFields() {
  const visible = state.commissionType !== 'none';
  byId('commission-fields').hidden = !visible;
  byId('percentage-field').hidden = state.commissionType !== 'percentage';
  byId('fixed-field').hidden = state.commissionType !== 'fixed';
}

function setLanguage(language) {
  state.language = language;
  document.documentElement.lang = language;
  document.title = language === 'hr' ? 'TT Real Estate | Antares — Kalkulator ukupnog troška kupnje' : 'TT Real Estate | Antares — Property Purchase Total Cost Calculator';
  document.querySelectorAll('[data-i18n]').forEach(element => { element.innerHTML = t()[element.dataset.i18n]; });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(element => { element.placeholder = t()[element.dataset.i18nPlaceholder]; });
  document.querySelectorAll('[data-i18n-aria]').forEach(element => { element.setAttribute('aria-label', t()[element.dataset.i18nAria]); });
  document.querySelectorAll('.language-button').forEach(button => { const active = button.dataset.language === language; button.classList.toggle('active', active); button.setAttribute('aria-pressed', active); });
  renderChoices(); renderStandardCosts(); renderCustomCosts(); updateResults(); validateAll();
}

function validateAll() {
  const numericInputs = document.querySelectorAll('input[type="number"]');
  numericInputs.forEach(input => { if (Number(input.value) < 0) input.value = 0; input.setCustomValidity(''); });
  byId('purchase-price-error').textContent = '';
  byId('commission-error').textContent = '';
}

document.addEventListener('input', event => {
  if (event.target.matches('input[type="number"]') && Number(event.target.value) < 0) {
    event.target.value = 0;
    const error = event.target.id === 'purchase-price' ? byId('purchase-price-error') : byId('commission-error');
    error.textContent = t().negativeError;
  }
  const row = event.target.closest('.custom-cost');
  if (row) {
    const item = state.customCosts.find(cost => cost.id === Number(row.dataset.id));
    if (event.target.classList.contains('custom-name')) item.name = event.target.value;
    if (event.target.classList.contains('custom-amount')) item.amount = event.target.value;
  }
  updateResults();
});

document.addEventListener('change', event => {
  if (event.target.name === 'tax') { state.taxTreatment = event.target.value; renderChoices(); }
  if (event.target.name === 'commission') { state.commissionType = event.target.value; renderChoices(); updateConditionalFields(); }
  if (event.target.id === 'commission-vat') byId('vat-note').textContent = t().vatNotes[event.target.value];
  updateResults();
});

document.addEventListener('click', event => {
  const languageButton = event.target.closest('.language-button');
  if (languageButton) setLanguage(languageButton.dataset.language);
  if (event.target.closest('#add-cost')) { state.customCosts.push({ id: state.nextCostId++, name: '', amount: '' }); renderCustomCosts(); }
  const removeButton = event.target.closest('.remove-cost');
  if (removeButton) { state.customCosts = state.customCosts.filter(cost => cost.id !== Number(removeButton.closest('.custom-cost').dataset.id)); renderCustomCosts(); updateResults(); }
});

byId('cta-link').href = CONFIG.ctaUrl;
byId('year').textContent = new Date().getFullYear();
renderStandardCosts(); renderCustomCosts(); setLanguage('hr'); updateConditionalFields();
