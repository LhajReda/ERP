// =============================================
// Constantes reglementaires marocaines 2026
// =============================================

/** SMAG - Salaire Minimum Agricole Garanti 2026 */
export const SMAG_DAILY = 84.37;
export const SMAG_HOURLY = 10.55;
export const SMAG_MONTHLY = SMAG_DAILY * 26;

/** CNSS - Cotisations sociales */
export const CNSS_EMPLOYEE_RATE = 0.0448;
export const CNSS_EMPLOYER_RATE = 0.0898;
export const CNSS_CEILING = 6000; // Plafond mensuel en MAD

/** AMO - Assurance Maladie Obligatoire */
export const AMO_EMPLOYEE_RATE = 0.0226;
export const AMO_EMPLOYER_RATE = 0.0411;

/** Taux TVA applicables au Maroc */
export const TVA_RATES = {
  TVA_0: { rate: 0, label: 'Exonere (0%)' },
  TVA_7: { rate: 0.07, label: 'Reduit (7%)' },
  TVA_10: { rate: 0.1, label: 'Reduit (10%)' },
  TVA_14: { rate: 0.14, label: 'Intermediaire (14%)' },
  TVA_20: { rate: 0.2, label: 'Normal (20%)' },
} as const;

/** IS agricole : exonere si CA < 5M MAD */
export const IS_AGRICULTURAL_EXEMPTION_THRESHOLD = 5_000_000;

/** Bareme IR 2026 (tranches annuelles) */
export const IR_BRACKETS = [
  { min: 0, max: 30_000, rate: 0 },
  { min: 30_001, max: 50_000, rate: 0.1 },
  { min: 50_001, max: 60_000, rate: 0.2 },
  { min: 60_001, max: 80_000, rate: 0.3 },
  { min: 80_001, max: 180_000, rate: 0.34 },
  { min: 180_001, max: Infinity, rate: 0.38 },
] as const;

/** Majoration heures supplementaires */
export const OVERTIME_RATES = {
  NORMAL_25: 1.25, // 6h-21h jour ouvrable
  NORMAL_50: 1.5, // 21h-6h jour ouvrable
  WEEKEND_50: 1.5, // 6h-21h weekend/ferie
  WEEKEND_100: 2.0, // 21h-6h weekend/ferie
} as const;

/** Jours feries marocains (fixes) */
export const JOURS_FERIES_FIXES = [
  { month: 1, day: 1, name: 'Nouvel An', nameAr: 'رأس السنة الميلادية' },
  { month: 1, day: 11, name: 'Manifeste de l\'Independance', nameAr: 'تقديم وثيقة الاستقلال' },
  { month: 5, day: 1, name: 'Fete du Travail', nameAr: 'عيد الشغل' },
  { month: 7, day: 30, name: 'Fete du Trone', nameAr: 'عيد العرش' },
  { month: 8, day: 14, name: 'Oued Ed-Dahab', nameAr: 'ذكرى استرجاع وادي الذهب' },
  { month: 8, day: 20, name: 'Revolution du Roi et du Peuple', nameAr: 'ذكرى ثورة الملك والشعب' },
  { month: 8, day: 21, name: 'Fete de la Jeunesse', nameAr: 'عيد الشباب' },
  { month: 11, day: 6, name: 'Marche Verte', nameAr: 'ذكرى المسيرة الخضراء' },
  { month: 11, day: 18, name: 'Fete de l\'Independance', nameAr: 'عيد الاستقلال' },
] as const;

/** Plans d'abonnement FLA7A */
export const SUBSCRIPTION_PLANS = {
  fellah: { maxFarms: 1, maxUsers: 5, maxParcels: 10, aiAgents: false, price: 0 },
  cooperative: { maxFarms: 5, maxUsers: 25, maxParcels: 50, aiAgents: true, price: 499 },
  enterprise: { maxFarms: 50, maxUsers: 200, maxParcels: 500, aiAgents: true, price: 1999 },
} as const;
