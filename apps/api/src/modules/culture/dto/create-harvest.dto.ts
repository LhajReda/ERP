import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEnum, IsDateString, IsNumber, IsOptional, Min } from 'class-validator';
import { UnitType } from '@prisma/client';

export class CreateHarvestDto {
  @ApiProperty() @IsString() cycleId: string;
  @ApiProperty() @IsDateString() date: string;
  @ApiProperty() @IsNumber() @Min(0) quantity: number;
  @ApiPropertyOptional({ enum: UnitType, default: 'KG' }) @IsOptional() @IsEnum(UnitType) unit?: UnitType;
  @ApiPropertyOptional() @IsOptional() @IsString() quality?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() caliber?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() storageLocation?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
}
