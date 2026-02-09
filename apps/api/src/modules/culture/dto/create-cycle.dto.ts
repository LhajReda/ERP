import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEnum, IsDateString, IsNumber, IsOptional, Min } from 'class-validator';
import { CropType, Season } from '@prisma/client';

export class CreateCycleDto {
  @ApiProperty() @IsString() parcelId: string;
  @ApiProperty({ enum: CropType }) @IsEnum(CropType) cropType: CropType;
  @ApiProperty() @IsString() variety: string;
  @ApiPropertyOptional() @IsOptional() @IsString() varietyAr?: string;
  @ApiProperty({ enum: Season }) @IsEnum(Season) season: Season;
  @ApiProperty({ example: '2025/2026' }) @IsString() campaignYear: string;
  @ApiProperty() @IsDateString() sowingDate: string;
  @ApiProperty() @IsDateString() expectedHarvest: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) plantDensity?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) estimatedYield?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
}
