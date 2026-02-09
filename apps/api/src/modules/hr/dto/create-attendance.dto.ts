import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEnum, IsDateString, IsNumber, IsOptional, Min } from 'class-validator';
import { AttendanceStatus } from '@prisma/client';

export class CreateAttendanceDto {
  @ApiProperty() @IsString() employeeId: string;
  @ApiProperty() @IsDateString() date: string;
  @ApiProperty({ enum: AttendanceStatus }) @IsEnum(AttendanceStatus) status: AttendanceStatus;
  @ApiPropertyOptional() @IsOptional() @IsDateString() checkIn?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() checkOut?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) hoursWorked?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) overtime?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() parcelName?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() activityType?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
}
