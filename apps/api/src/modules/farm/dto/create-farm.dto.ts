import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Min,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Region, WaterSource, FarmType } from '@prisma/client';

/**
 * DTO pour la creation d'une ferme.
 * Tous les champs obligatoires refletent les exigences du formulaire
 * d'enregistrement d'une exploitation agricole au Maroc.
 */
export class CreateFarmDto {
  // ---- Informations generales ----

  @ApiProperty({
    description: "Nom de l'exploitation agricole",
    example: 'Ferme Al Baraka',
    minLength: 2,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2, { message: 'Le nom doit contenir au moins 2 caracteres.' })
  name: string;

  @ApiPropertyOptional({
    description: "Nom de l'exploitation en arabe",
    example: 'مزرعة البركة',
  })
  @IsOptional()
  @IsString()
  nameAr?: string;

  @ApiPropertyOptional({
    description: "Numero d'enregistrement aupres du registre agricole",
    example: 'RA-2024-00123',
  })
  @IsOptional()
  @IsString()
  registrationNumber?: string;

  @ApiPropertyOptional({
    description: "Identifiant Commun de l'Entreprise (ICE) - 15 chiffres",
    example: '001234567890123',
  })
  @IsOptional()
  @IsString()
  @Matches(/^\d{15}$/, {
    message: "L'ICE doit contenir exactement 15 chiffres.",
  })
  ice?: string;

  @ApiPropertyOptional({
    description: 'Identifiant Fiscal (IF)',
    example: '12345678',
  })
  @IsOptional()
  @IsString()
  iff?: string;

  @ApiPropertyOptional({
    description: 'Numero de patente',
    example: '45678901',
  })
  @IsOptional()
  @IsString()
  patente?: string;

  @ApiPropertyOptional({
    description: "Numero d'affiliation CNSS",
    example: '1234567',
  })
  @IsOptional()
  @IsString()
  cnss?: string;

  @ApiPropertyOptional({
    description: "Numero de licence ONSSA (securite sanitaire)",
    example: 'ONSSA-2024-0001',
  })
  @IsOptional()
  @IsString()
  onssaLicense?: string;

  // ---- Localisation ----

  @ApiProperty({
    description: 'Region administrative du Maroc',
    enum: Region,
    example: Region.SOUSS_MASSA,
  })
  @IsEnum(Region, {
    message: `La region doit etre une des 12 regions du Maroc: ${Object.values(Region).join(', ')}`,
  })
  region: Region;

  @ApiProperty({
    description: 'Province ou prefecture',
    example: 'Chtouka Ait Baha',
  })
  @IsString()
  @IsNotEmpty()
  province: string;

  @ApiProperty({
    description: 'Commune rurale ou urbaine',
    example: 'Biougra',
  })
  @IsString()
  @IsNotEmpty()
  commune: string;

  @ApiPropertyOptional({
    description: 'Douar (village)',
    example: 'Douar Ait Melloul',
  })
  @IsOptional()
  @IsString()
  douar?: string;

  @ApiPropertyOptional({
    description: 'Adresse complete',
    example: 'Route de Biougra, Km 12',
  })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({
    description: 'Latitude GPS',
    example: 30.4278,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'La latitude doit etre un nombre.' })
  gpsLat?: number;

  @ApiPropertyOptional({
    description: 'Longitude GPS',
    example: -9.5981,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'La longitude doit etre un nombre.' })
  gpsLng?: number;

  // ---- Surface et caractaristiques ----

  @ApiProperty({
    description: 'Superficie totale en hectares',
    example: 25.5,
    minimum: 0.01,
  })
  @Type(() => Number)
  @IsNumber({}, { message: 'La superficie totale doit etre un nombre.' })
  @Min(0.01, {
    message: 'La superficie totale doit etre superieure a 0.01 hectare.',
  })
  totalArea: number;

  @ApiPropertyOptional({
    description: 'Superficie cultivee en hectares',
    example: 20.0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'La superficie cultivee doit etre un nombre.' })
  cultivatedArea?: number;

  @ApiProperty({
    description: "Source d'eau principale",
    enum: WaterSource,
    example: WaterSource.FORAGE,
  })
  @IsEnum(WaterSource, {
    message: `La source d'eau doit etre: ${Object.values(WaterSource).join(', ')}`,
  })
  waterSource: WaterSource;

  @ApiProperty({
    description: "Type d'exploitation",
    enum: FarmType,
    example: FarmType.IRRIGUE,
  })
  @IsEnum(FarmType, {
    message: `Le type de ferme doit etre: ${Object.values(FarmType).join(', ')}`,
  })
  farmType: FarmType;

  // ---- Contact ----

  @ApiPropertyOptional({
    description: 'Numero de telephone de la ferme',
    example: '+212528123456',
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({
    description: 'Adresse email de la ferme',
    example: 'contact@ferme-albaraka.ma',
  })
  @IsOptional()
  @IsEmail({}, { message: "L'adresse email n'est pas valide." })
  email?: string;
}
