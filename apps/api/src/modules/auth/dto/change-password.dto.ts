import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({
    description: 'Mot de passe actuel',
    example: 'OldP@ssword1',
  })
  @IsNotEmpty({ message: 'L\'ancien mot de passe est requis.' })
  @IsString({ message: 'L\'ancien mot de passe doit être une chaîne.' })
  oldPassword: string;

  @ApiProperty({
    description: 'Nouveau mot de passe (minimum 8 caractères)',
    example: 'NewSecureP@ss1',
    minLength: 8,
  })
  @IsNotEmpty({ message: 'Le nouveau mot de passe est requis.' })
  @IsString({ message: 'Le nouveau mot de passe doit être une chaîne.' })
  @MinLength(8, {
    message: 'Le nouveau mot de passe doit contenir au moins 8 caractères.',
  })
  newPassword: string;
}
