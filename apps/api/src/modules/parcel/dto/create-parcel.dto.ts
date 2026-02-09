import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { SoilType, IrrigationType, ParcelStatus } from '@prisma/client';

/**
 * DTO pour la creation d'une parcelle.
 * Une parcelle represente une unite de terrain cultivable
 * au sein d'une exploitation agricole.
 */
export class CreateParcelDto {
  // ---- Identification ----

  @ApiProperty({
    description: 'Nom de la parcelle',
    example: 'Parcelle Nord - Tomates',
    minLength: 2,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2, { message: 'Le nom doit contenir au moins 2 caracteres.' })
  name: string;

  @ApiPropertyOptional({
    description: 'Nom de la parcelle en arabe',
    example: 'القطعة الشمالية - طماطم',
  })
  @IsOptional()
  @IsString()
  nameAr?: string;

  @ApiPropertyOptional({
    description: 'Code interne de la parcelle',
    example: 'P-001',
  })
  @IsOptional()
  @IsString()
  code?: string;

  // ---- Caracteristiques physiques ----

  @ApiProperty({
    description: 'Superficie de la parcelle en hectares',
    example: 2.5,
    minimum: 0.01,
  })
  @Type(() => Number)
  @IsNumber({}, { message: 'La superficie doit etre un nombre.' })
  @Min(0.01, {
    message: 'La superficie doit etre superieure a 0.01 hectare.',
  })
  area: number;

  @ApiProperty({
    description: 'Type de sol',
    enum: SoilType,
    example: SoilType.ARGILO_SABLEUX,
  })
  @IsEnum(SoilType, {
    message: `Le type de sol doit etre: ${Object.values(SoilType).join(', ')}`,
  })
  soilType: SoilType;

  @ApiProperty({
    description: "Type d'irrigation",
    enum: IrrigationType,
    example: IrrigationType.GOUTTE_A_GOUTTE,
  })
  @IsEnum(IrrigationType, {
    message: `Le type d'irrigation doit etre: ${Object.values(IrrigationType).join(', ')}`,
  })
  irrigationType: IrrigationType;

  @ApiPropertyOptional({
    description: "Quota d'eau alloue en metres cubes par hectare",
    example: 5000,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: "Le quota d'eau doit etre un nombre." })
  waterQuota?: number;

  // ---- Geolocalisation ----

  @ApiPropertyOptional({
    description:
      'Polygone GeoJSON delimitant la parcelle. Format: { "type": "Polygon", "coordinates": [...] }',
    example: {
      type: 'Polygon',
      coordinates: [
        [
          [-9.598, 30.428],
          [-9.596, 30.428],
          [-9.596, 30.426],
          [-9.598, 30.426],
          [-9.598, 30.428],
        ],
      ],
    },
  })
  @IsOptional()
  @IsObject({ message: 'Le geoPolygon doit etre un objet JSON valide.' })
  geoPolygon?: Record<string, any>;

  @ApiPropertyOptional({
    description:
      'Point central GPS de la parcelle. Format: { "lat": number, "lng": number }',
    example: { lat: 30.427, lng: -9.597 },
  })
  @IsOptional()
  @IsObject({ message: 'Le gpsCenter doit etre un objet JSON valide.' })
  gpsCenter?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Altitude en metres',
    example: 120,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: "L'altitude doit etre un nombre." })
  altitude?: number;

  // ---- Culture et statut ----

  @ApiPropertyOptional({
    description: 'Culture actuelle sur la parcelle',
    example: 'Tomates cerises',
  })
  @IsOptional()
  @IsString()
  currentCrop?: string;

  @ApiPropertyOptional({
    description: 'Statut de la parcelle',
    enum: ParcelStatus,
    default: ParcelStatus.PREPARATION,
    example: ParcelStatus.CULTIVEE,
  })
  @IsOptional()
  @IsEnum(ParcelStatus, {
    message: `Le statut doit etre: ${Object.values(ParcelStatus).join(', ')}`,
  })
  status?: ParcelStatus;

  @ApiPropertyOptional({
    description: 'Notes ou observations sur la parcelle',
    example: 'Sol draine recemment, bonne exposition sud',
  })
  @IsOptional()
  @IsString()
  notes?: string;

  // ---- Relation ----

  @ApiProperty({
    description: 'Identifiant de la ferme a laquelle appartient la parcelle',
    example: 'clxyz123abc',
  })
  @IsString()
  @IsNotEmpty({ message: "L'identifiant de la ferme est obligatoire." })
  farmId: string;
}
