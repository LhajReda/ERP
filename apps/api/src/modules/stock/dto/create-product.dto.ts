import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEnum, IsNumber, IsOptional, Min } from 'class-validator';
import { ProductCategory, UnitType } from '@prisma/client';

export class CreateProductDto {
  @ApiProperty() @IsString() name: string;
  @ApiPropertyOptional() @IsOptional() @IsString() nameAr?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() sku?: string;
  @ApiProperty({ enum: ProductCategory }) @IsEnum(ProductCategory) category: ProductCategory;
  @ApiProperty({ enum: UnitType }) @IsEnum(UnitType) unit: UnitType;
  @ApiProperty() @IsNumber() @Min(0) minStock: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) maxStock?: number;
  @ApiProperty() @IsNumber() @Min(0) unitPrice: number;
  @ApiPropertyOptional() @IsOptional() @IsString() onssaApproval?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() activeSubstance?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() toxicityClass?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() supplierId?: string;
  @ApiProperty() @IsString() farmId: string;
}
