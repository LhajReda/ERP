import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

export class TokenUserDto {
  @ApiProperty({ description: 'Identifiant unique de l\'utilisateur' })
  id: string;

  @ApiProperty({ description: 'Prénom de l\'utilisateur', example: 'Mohammed' })
  firstName: string;

  @ApiProperty({
    description: 'Nom de famille de l\'utilisateur',
    example: 'El Fassi',
  })
  lastName: string;

  @ApiProperty({
    description: 'Rôle de l\'utilisateur',
    enum: UserRole,
    example: UserRole.ADMIN,
  })
  role: UserRole;

  @ApiProperty({
    description: 'Langue préférée',
    example: 'fr',
  })
  language: string;

  @ApiProperty({
    description: 'Identifiant du tenant',
    example: 'clxxxxxxxxxxxxxxx',
  })
  tenantId: string;
}

export class TokenResponseDto {
  @ApiProperty({
    description: 'Token d\'accès JWT',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  accessToken: string;

  @ApiProperty({
    description: 'Token de rafraîchissement JWT',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  refreshToken: string;

  @ApiProperty({
    description: 'Durée de validité du token d\'accès en secondes',
    example: 900,
  })
  expiresIn: number;

  @ApiProperty({
    description: 'Informations de l\'utilisateur connecté',
    type: TokenUserDto,
  })
  user: TokenUserDto;
}
