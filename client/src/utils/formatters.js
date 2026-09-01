export function formatCurrency(amount) {
  const num = parseFloat(amount);
  if (isNaN(num)) return '₹0.00';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

export function formatNumber(amount) {
  const num = parseFloat(amount);
  if (isNaN(num)) return '0.00';
  return num.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatDate(timestamp) {
  if (!timestamp) return '-';
  const date = new Date(typeof timestamp === 'number' && timestamp < 10000000000 ? timestamp * 1000 : timestamp);
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateTime(timestamp) {
  if (!timestamp) return '-';
  const date = new Date(typeof timestamp === 'number' && timestamp < 10000000000 ? timestamp * 1000 : timestamp);
  return date.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
