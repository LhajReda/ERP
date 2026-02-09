/** Formate un montant en MAD (Dirham marocain) */
export function formatMAD(amount: number): string {
  return new Intl.NumberFormat('fr-MA', {
    style: 'currency',
    currency: 'MAD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/** Formate un montant sans symbole de devise */
export function formatAmount(amount: number): string {
  return new Intl.NumberFormat('fr-MA', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/** Parse un montant depuis une chaine formatee */
export function parseAmount(value: string): number {
  const cleaned = value.replace(/[^\d,.-]/g, '').replace(',', '.');
  return parseFloat(cleaned) || 0;
}

/** Convertit un taux TVA enum vers un nombre */
export function tvaRateToNumber(rate: string): number {
  const rates: Record<string, number> = {
    TVA_0: 0,
    TVA_7: 0.07,
    TVA_10: 0.1,
    TVA_14: 0.14,
    TVA_20: 0.2,
  };
  return rates[rate] ?? 0;
}

/** Calcule le montant TVA */
export function calculateTVA(subtotal: number, tvaRate: string): number {
  return subtotal * tvaRateToNumber(tvaRate);
}

/** Calcule le total TTC */
export function calculateTTC(subtotal: number, tvaRate: string): number {
  return subtotal + calculateTVA(subtotal, tvaRate);
}
