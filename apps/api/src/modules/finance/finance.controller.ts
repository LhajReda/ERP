import { Controller, Get, Post, Body, Param, Query, UseGuards, Patch } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { InvoiceService } from './invoice.service';
import { PaymentService } from './payment.service';
import { TransactionService } from './transaction.service';
import { ReportService } from './report.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UserRole, InvoiceStatus, InvoiceType } from '@prisma/client';

@ApiTags('Finance')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('invoices')
export class InvoiceController {
  constructor(
    private readonly invoiceService: InvoiceService,
    private readonly paymentService: PaymentService,
  ) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.COMPTABLE)
  @ApiOperation({ summary: 'Creer une facture' })
  create(@Body() dto: CreateInvoiceDto) { return this.invoiceService.create(dto); }

  @Get()
  @ApiOperation({ summary: 'Lister les factures' })
  findAll(@Query() query: PaginationDto, @Query('farmId') farmId?: string, @Query('status') status?: InvoiceStatus, @Query('type') type?: InvoiceType) {
    return this.invoiceService.findAll(query, { farmId, status, type });
  }

  @Get(':id')
  findOne(@Param('id') id: string) { return this.invoiceService.findOne(id); }

  @Patch(':id/status')
  @Roles(UserRole.ADMIN, UserRole.COMPTABLE)
  updateStatus(@Param('id') id: string, @Body('status') status: InvoiceStatus) { return this.invoiceService.updateStatus(id, status); }

  @Post(':id/payments')
  @Roles(UserRole.ADMIN, UserRole.COMPTABLE)
  @ApiOperation({ summary: 'Enregistrer un paiement' })
  addPayment(@Body() dto: CreatePaymentDto) { return this.paymentService.create(dto); }
}

@ApiTags('Finance')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('transactions')
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.COMPTABLE)
  create(@Body() dto: CreateTransactionDto, @CurrentUser('id') userId: string) { return this.transactionService.create(dto, userId); }

  @Get('account/:accountId')
  findByAccount(@Param('accountId') accountId: string, @Query() query: PaginationDto) {
    return this.transactionService.findByAccount(accountId, query);
  }

  @Get('monthly-summary/:farmId')
  getMonthlySummary(@Param('farmId') farmId: string, @Query('year') year: number) {
    return this.transactionService.getMonthlySummary(farmId, year || new Date().getFullYear());
  }
}

@ApiTags('Finance')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('reports')
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Get('monthly-pnl/:farmId')
  @ApiOperation({ summary: 'Compte de resultat mensuel' })
  getMonthlyPnL(@Param('farmId') farmId: string, @Query('year') year: number, @Query('month') month: number) {
    return this.reportService.getMonthlyPnL(farmId, year, month);
  }

  @Get('annual-summary/:farmId')
  @ApiOperation({ summary: 'Resume annuel' })
  getAnnualSummary(@Param('farmId') farmId: string, @Query('year') year: number) {
    return this.reportService.getAnnualSummary(farmId, year || new Date().getFullYear());
  }

  @Get('crop-profitability/:cycleId')
  @ApiOperation({ summary: 'Rentabilite d\'un cycle de culture' })
  getCropProfit(@Param('cycleId') cycleId: string) { return this.reportService.getCropProfitability(cycleId); }
}
