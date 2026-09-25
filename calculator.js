import { CONFIG } from './config.js';

export function nonNegative(value) {
  const number = Number.parseFloat(value);
  return Number.isFinite(number) && number > 0 ? number : 0;
}

export function calculate(input) {
  const purchasePrice = nonNegative(input.purchasePrice);
  const transferTax = input.taxTreatment === 'transfer' ? purchasePrice * CONFIG.realEstateTransferTaxRate : 0;
  let commission = 0;
  if (input.commissionType === 'percentage') {
    commission = purchasePrice * nonNegative(input.commissionPercentage) / 100;
  } else if (input.commissionType === 'fixed') {
    commission = nonNegative(input.commissionFixed);
  }
  const commissionVat = commission > 0 && input.commissionVat === 'added'
    ? commission * CONFIG.croatianVatRate
    : 0;
  const additionalCosts = (input.additionalCosts || [])
    .map(cost => ({ ...cost, amount: nonNegative(cost.amount) }))
    .filter(cost => cost.amount > 0);
  const additionalCostsTotal = additionalCosts.reduce((sum, cost) => sum + cost.amount, 0);
  const costsAbovePrice = transferTax + commission + commissionVat + additionalCostsTotal;

  return {
    purchasePrice, transferTax, commission, commissionVat, additionalCosts,
    additionalCostsTotal, costsAbovePrice,
    additionalPercentage: purchasePrice > 0 ? costsAbovePrice / purchasePrice * 100 : 0,
    total: purchasePrice + costsAbovePrice,
  };
}
