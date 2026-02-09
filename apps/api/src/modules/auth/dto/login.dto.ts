import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class LoginDto {
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
    description: 'Mot de passe de l\'utilisateur',
    example: 'MySecureP@ss1',
  })
  @IsNotEmpty({ message: 'Le mot de passe est requis.' })
  @IsString({ message: 'Le mot de passe doit être une chaîne.' })
  password: string;
}
