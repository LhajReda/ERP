import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEnum, IsDateString, IsNumber, IsOptional, IsArray, ValidateNested, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { InvoiceType, TvaRate, UnitType } from '@prisma/client';

export class CreateInvoiceLineDto {
  @ApiProperty() @IsString() description: string;
  @ApiPropertyOptional() @IsOptional() @IsString() descriptionAr?: string;
  @ApiProperty() @IsNumber() @Min(0.01) quantity: number;
  @ApiProperty({ enum: UnitType }) @IsEnum(UnitType) unit: UnitType;
  @ApiProperty() @IsNumber() @Min(0) unitPrice: number;
  @ApiPropertyOptional({ enum: TvaRate }) @IsOptional() @IsEnum(TvaRate) tvaRate?: TvaRate;
}

export class CreateInvoiceDto {
  @ApiProperty({ enum: InvoiceType }) @IsEnum(InvoiceType) type: InvoiceType;
  @ApiPropertyOptional() @IsOptional() @IsString() clientId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() supplierId?: string;
  @ApiProperty() @IsString() farmId: string;
  @ApiProperty() @IsDateString() date: string;
  @ApiProperty() @IsDateString() dueDate: string;
  @ApiPropertyOptional({ enum: TvaRate }) @IsOptional() @IsEnum(TvaRate) tvaRate?: TvaRate;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) discountPercent?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() paymentTerms?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
  @ApiProperty({ type: [CreateInvoiceLineDto] })
  @IsArray() @ValidateNested({ each: true }) @Type(() => CreateInvoiceLineDto)
  lines: CreateInvoiceLineDto[];
}
