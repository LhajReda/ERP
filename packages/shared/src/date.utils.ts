import { format, parseISO, isValid } from 'date-fns';
import { fr } from 'date-fns/locale';

/** Formate une date au format marocain (dd/MM/yyyy) */
export function formatDateMA(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(d)) return '';
  return format(d, 'dd/MM/yyyy', { locale: fr });
}

/** Formate une date avec heure */
export function formatDateTimeMA(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(d)) return '';
  return format(d, 'dd/MM/yyyy HH:mm', { locale: fr });
}

/** Formate pour affichage mois/annee */
export function formatMonthYear(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(d)) return '';
  return format(d, 'MMMM yyyy', { locale: fr });
}

/** Retourne l'annee de campagne agricole (ex: 2025/2026) */
export function getCampaignYear(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = date.getMonth();
  // Campagne agricole commence en septembre
  if (month >= 8) return `${year}/${year + 1}`;
  return `${year - 1}/${year}`;
}

/** Retourne la saison agricole */
export function getAgriculturalSeason(date: Date = new Date()): 'AUTOMNE_HIVER' | 'PRINTEMPS_ETE' {
  const month = date.getMonth();
  // Automne-Hiver: Sept-Fev, Printemps-Ete: Mars-Aout
  return month >= 8 || month <= 1 ? 'AUTOMNE_HIVER' : 'PRINTEMPS_ETE';
}
