import { z } from 'zod';

/** Schema CIN marocain */
export const cinSchema = z
  .string()
  .regex(/^[A-Za-z]{1,2}\d{5,6}$/, 'CIN invalide (ex: AB123456)')
  .transform((v) => v.toUpperCase());

/** Schema ICE */
export const iceSchema = z.string().regex(/^\d{15}$/, 'ICE doit contenir exactement 15 chiffres');

/** Schema telephone marocain */
export const phoneSchema = z
  .string()
  .regex(/^\+212[5-7]\d{8}$/, 'Telephone invalide (ex: +212612345678)');

/** Schema RIB marocain */
export const ribSchema = z
  .string()
  .regex(/^\d{24}$/, 'RIB doit contenir 24 chiffres')
  .transform((v) => v.replace(/\s/g, ''));

/** Schema email optionnel */
export const optionalEmailSchema = z.string().email('Email invalide').optional().or(z.literal(''));

/** Schema montant MAD */
export const amountSchema = z.number().min(0, 'Montant doit etre positif');

/** Schema superficie hectares */
export const areaSchema = z.number().min(0.01, 'Superficie minimum 0.01 ha');

/** Schema coordonnees GPS Maroc */
export const gpsLatSchema = z.number().min(21).max(36); // Latitude Maroc
export const gpsLngSchema = z.number().min(-17).max(-1); // Longitude Maroc

/** Schema pagination */
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type PaginationInput = z.infer<typeof paginationSchema>;
