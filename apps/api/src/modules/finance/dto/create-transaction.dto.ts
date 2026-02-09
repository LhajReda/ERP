import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEnum, IsDateString, IsNumber, IsOptional, Min } from 'class-validator';
import { TransactionType, ExpenseCategory } from '@prisma/client';

export class CreateTransactionDto {
  @ApiProperty({ enum: TransactionType }) @IsEnum(TransactionType) type: TransactionType;
  @ApiProperty({ enum: ExpenseCategory }) @IsEnum(ExpenseCategory) category: ExpenseCategory;
  @ApiProperty() @IsNumber() @Min(0) amount: number;
  @ApiProperty() @IsDateString() date: string;
  @ApiProperty() @IsString() description: string;
  @ApiPropertyOptional() @IsOptional() @IsString() descriptionAr?: string;
  @ApiProperty() @IsString() accountId: string;
  @ApiPropertyOptional() @IsOptional() @IsString() invoiceId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() reference?: string;
}
