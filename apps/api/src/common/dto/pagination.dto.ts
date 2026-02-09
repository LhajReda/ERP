import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  IsIn,
} from 'class-validator';

/**
 * Base pagination DTO used across all list/search endpoints.
 * Provides standardized query parameters for pagination, search,
 * and sorting.
 *
 * Usage:
 *   @Get()
 *   findAll(@Query() pagination: PaginationDto) { ... }
 */
export class PaginationDto {
  @ApiPropertyOptional({
    description: 'Numero de page (commence a 1)',
    default: 1,
    minimum: 1,
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiPropertyOptional({
    description: "Nombre d'elements par page",
    default: 20,
    minimum: 1,
    maximum: 100,
    example: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 20;

  @ApiPropertyOptional({
    description: 'Terme de recherche (recherche textuelle)',
    example: 'ferme',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Champ de tri',
    default: 'createdAt',
    example: 'createdAt',
  })
  @IsOptional()
  @IsString()
  sortBy: string = 'createdAt';

  @ApiPropertyOptional({
    description: 'Ordre de tri (asc ou desc)',
    default: 'desc',
    enum: ['asc', 'desc'],
    example: 'desc',
  })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder: 'asc' | 'desc' = 'desc';

  /**
   * Returns the number of records to skip for Prisma pagination.
   */
  get skip(): number {
    return (this.page - 1) * this.limit;
  }

  /**
   * Returns the take value for Prisma pagination (alias for limit).
   */
  get take(): number {
    return this.limit;
  }
}
