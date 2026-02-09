/** Valide un numero CIN marocain (1-2 lettres + 5-6 chiffres) */
export function validateCIN(cin: string): boolean {
  return /^[A-Z]{1,2}\d{5,6}$/.test(cin.toUpperCase());
}

/** Valide un ICE (identifiant commun de l'entreprise) - exactement 15 chiffres */
export function validateICE(ice: string): boolean {
  return /^\d{15}$/.test(ice);
}

/** Valide un numero de telephone marocain (+212 5/6/7XX-XXXXXXXX) */
export function validateMoroccanPhone(phone: string): boolean {
  return /^\+212[5-7]\d{8}$/.test(phone);
}

/** Formate un numero de telephone au format marocain +212 */
export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('0')) return `+212${cleaned.slice(1)}`;
  if (cleaned.startsWith('212')) return `+${cleaned}`;
  return `+212${cleaned}`;
}

/** Genere un numero de facture au format FLA7A */
export function generateInvoiceNumber(sequence: number, year: number): string {
  return `FLA-${year}-${String(sequence).padStart(5, '0')}`;
}

/** Valide un RIB marocain (24 chiffres) */
export function validateRIB(rib: string): boolean {
  return /^\d{24}$/.test(rib.replace(/\s/g, ''));
}

/** Formate un numero CIN pour affichage */
export function formatCIN(cin: string): string {
  return cin.toUpperCase().trim();
}
