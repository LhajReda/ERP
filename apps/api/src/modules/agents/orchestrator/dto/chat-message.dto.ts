import { Transform } from 'class-transformer';
import {
  IsIn,
  IsOptional,
  IsString,
  Length,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

const ID_PATTERN = /^[A-Za-z0-9_-]{8,120}$/;
const FARM_ID_PATTERN = /^[A-Za-z0-9_-]{6,80}$/;
const trimString = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

export class ChatMessageDto {
  @ApiProperty({
    description: 'Message utilisateur pour les agents IA',
    minLength: 1,
    maxLength: 2000,
    example: 'Donne-moi les alertes critiques finance et stock cette semaine.',
  })
  @Transform(trimString)
  @IsString()
  @Length(1, 2000)
  message: string;

  @ApiPropertyOptional({
    description:
      'Identifiant conversation. Si absent, le serveur en genere un.',
    example: 'conv_01J4B8N8G9A2Q4T8F0Y7R6K5M4',
  })
  @Transform(trimString)
  @IsOptional()
  @IsString()
  @Matches(ID_PATTERN)
  conversationId?: string;

  @ApiProperty({
    description: 'Identifiant ferme active',
    example: 'cm4abcxyz0001ezps1234abcd',
  })
  @Transform(trimString)
  @IsString()
  @Matches(FARM_ID_PATTERN)
  farmId: string;

  @ApiPropertyOptional({
    description: 'Langue de reponse',
    enum: ['fr', 'ar', 'dar'],
    default: 'fr',
  })
  @Transform(trimString)
  @IsOptional()
  @IsIn(['fr', 'ar', 'dar'])
  locale?: 'fr' | 'ar' | 'dar';
}
