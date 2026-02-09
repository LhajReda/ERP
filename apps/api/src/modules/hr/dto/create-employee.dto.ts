import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEnum, IsDateString, IsNumber, IsOptional, IsArray, Matches, Min } from 'class-validator';
import { EmployeeType, WorkerRole } from '@prisma/client';

export class CreateEmployeeDto {
  @ApiProperty({ example: 'AB123456' })
  @IsString() @Matches(/^[A-Za-z]{1,2}\d{5,6}$/, { message: 'CIN invalide' })
  cin: string;

  @ApiProperty() @IsString() firstName: string;
  @ApiProperty() @IsString() lastName: string;
  @ApiPropertyOptional() @IsOptional() @IsString() firstNameAr?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() lastNameAr?: string;
  @ApiProperty() @IsString() @Matches(/^\+212[5-7]\d{8}$/, { message: 'Telephone invalide' }) phone: string;
  @ApiPropertyOptional() @IsOptional() @IsString() phone2?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() address?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() city?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() birthDate?: string;
  @ApiProperty({ enum: EmployeeType }) @IsEnum(EmployeeType) type: EmployeeType;
  @ApiProperty({ enum: WorkerRole }) @IsEnum(WorkerRole) role: WorkerRole;
  @ApiProperty({ description: 'Taux journalier (min SMAG 84.37 MAD)' })
  @IsNumber() @Min(84.37, { message: 'Le taux journalier ne peut pas etre inferieur au SMAG (84.37 MAD)' })
  dailyRate: number;

  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) monthlyRate?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() cnssNumber?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() bankRib?: string;
  @ApiProperty() @IsDateString() hireDate: string;
  @ApiPropertyOptional() @IsOptional() @IsString() contractType?: string;
  @ApiPropertyOptional() @IsOptional() @IsArray() @IsString({ each: true }) skills?: string[];
  @ApiProperty() @IsString() farmId: string;
}
