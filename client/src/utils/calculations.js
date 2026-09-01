export function calculateTotals(charges = [], manualTotal = null) {
  let taxableSum = 0;
  let igstSum = 0;
  let cgstSum = 0;
  let sgstSum = 0;
  let nonTaxableSum = 0;

  for (const c of charges) {
    taxableSum += parseFloat(c.taxable_amount) || 0;
    igstSum += parseFloat(c.igst) || 0;
    cgstSum += parseFloat(c.cgst) || 0;
    sgstSum += parseFloat(c.sgst) || 0;
    nonTaxableSum += parseFloat(c.non_taxable) || 0;
  }

  const computedTotal = taxableSum + igstSum + cgstSum + sgstSum + nonTaxableSum;
  const grandTotal = manualTotal !== null && manualTotal !== undefined && manualTotal !== '' && !isNaN(parseFloat(manualTotal))
    ? parseFloat(manualTotal)
    : computedTotal;
  const roundOff = grandTotal - computedTotal;

  return {
    taxableSum,
    igstSum,
    cgstSum,
    sgstSum,
    nonTaxableSum,
    computedTotal,
    grandTotal,
    roundOff,
  };
}

export function numberToWords(num) {
  const n = Math.round(parseFloat(num));
  if (isNaN(n) || n === 0) return 'ZERO RUPEES ONLY';

  const a = [
    '', 'ONE ', 'TWO ', 'THREE ', 'FOUR ', 'FIVE ', 'SIX ', 'SEVEN ', 'EIGHT ', 'NINE ',
    'TEN ', 'ELEVEN ', 'TWELVE ', 'THIRTEEN ', 'FOURTEEN ', 'FIFTEEN ', 'SIXTEEN ',
    'SEVENTEEN ', 'EIGHTEEN ', 'NINETEEN '
  ];
  const b = ['', '', 'TWENTY', 'THIRTY', 'FORTY', 'FIFTY', 'SIXTY', 'SEVENTY', 'EIGHTY', 'NINETY'];

  function inWords(val) {
    let str = '';
    if (val > 19) {
      str += b[Math.floor(val / 10)] + ' ' + a[val % 10];
    } else {
      str += a[val];
    }
    return str;
  }

  let str = '';
  const crore = Math.floor(n / 10000000);
  const lakh = Math.floor((n % 10000000) / 100000);
  const thousand = Math.floor((n % 100000) / 1000);
  const hundred = Math.floor((n % 1000) / 100);
  const rest = n % 100;

  if (crore > 0) str += inWords(crore) + 'CRORE ';
  if (lakh > 0) str += inWords(lakh) + 'LAKH ';
  if (thousand > 0) str += inWords(thousand) + 'THOUSAND ';
  if (hundred > 0) str += inWords(hundred) + 'HUNDRED ';
  if (rest > 0) {
    if (str !== '') str += 'AND ';
    str += inWords(rest);
  }

  return (str + 'RUPEES ONLY').replace(/\s+/g, ' ').trim();
}
