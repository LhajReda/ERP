import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEnum, IsDateString, IsNumber, IsOptional, IsInt, Min } from 'class-validator';
import { ActivityType } from '@prisma/client';

export class CreateActivityDto {
  @ApiProperty() @IsString() cycleId: string;
  @ApiProperty({ enum: ActivityType }) @IsEnum(ActivityType) type: ActivityType;
  @ApiProperty() @IsDateString() date: string;
  @ApiProperty() @IsString() description: string;
  @ApiPropertyOptional() @IsOptional() @IsString() descriptionAr?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) cost?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) laborHours?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(1) workersCount?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() equipmentUsed?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() weatherCondition?: string;
}
