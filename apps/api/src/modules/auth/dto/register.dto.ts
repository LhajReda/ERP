import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @ApiProperty({
    description: 'Numéro de téléphone au format marocain +212',
    example: '+212612345678',
  })
  @IsNotEmpty({ message: 'Le numéro de téléphone est requis.' })
  @IsString({ message: 'Le numéro de téléphone doit être une chaîne.' })
  @Matches(/^\+212[5-7]\d{8}$/, {
    message:
      'Le numéro de téléphone doit être au format marocain +212 suivi de 9 chiffres (ex: +212612345678).',
  })
  phone: string;

  @ApiProperty({
    description: 'Mot de passe (minimum 8 caractères)',
    example: 'MySecureP@ss1',
    minLength: 8,
  })
  @IsNotEmpty({ message: 'Le mot de passe est requis.' })
  @IsString({ message: 'Le mot de passe doit être une chaîne.' })
  @MinLength(8, {
    message: 'Le mot de passe doit contenir au moins 8 caractères.',
  })
  password: string;

  @ApiProperty({
    description: 'Prénom en français',
    example: 'Mohammed',
  })
  @IsNotEmpty({ message: 'Le prénom est requis.' })
  @IsString({ message: 'Le prénom doit être une chaîne.' })
  firstName: string;

  @ApiProperty({
    description: 'Nom de famille en français',
    example: 'El Fassi',
  })
  @IsNotEmpty({ message: 'Le nom de famille est requis.' })
  @IsString({ message: 'Le nom de famille doit être une chaîne.' })
  lastName: string;

  @ApiPropertyOptional({
    description: 'Prénom en arabe',
    example: 'محمد',
  })
  @IsOptional()
  @IsString({ message: 'Le prénom en arabe doit être une chaîne.' })
  firstNameAr?: string;

  @ApiPropertyOptional({
    description: 'Nom de famille en arabe',
    example: 'الفاسي',
  })
  @IsOptional()
  @IsString({ message: 'Le nom de famille en arabe doit être une chaîne.' })
  lastNameAr?: string;

  @ApiPropertyOptional({
    description: 'Adresse email',
    example: 'mohammed@example.com',
  })
  @IsOptional()
  @IsEmail({}, { message: 'L\'adresse email n\'est pas valide.' })
  email?: string;

  @ApiPropertyOptional({
    description: 'Numéro de CIN marocain (ex: AB123456 ou B12345)',
    example: 'AB123456',
  })
  @IsOptional()
  @IsString({ message: 'Le CIN doit être une chaîne.' })
  @Matches(/^[A-Z]{1,2}\d{5,6}$/, {
    message:
      'Le CIN doit être au format marocain: 1 ou 2 lettres majuscules suivies de 5 ou 6 chiffres (ex: AB123456).',
  })
  cin?: string;

  @ApiPropertyOptional({
    description: 'Langue préférée (fr, ar, ber)',
    example: 'fr',
    default: 'fr',
  })
  @IsOptional()
  @IsString({ message: 'La langue doit être une chaîne.' })
  @Matches(/^(fr|ar|ber)$/, {
    message: 'La langue doit être fr, ar ou ber.',
  })
  language?: string;
}
