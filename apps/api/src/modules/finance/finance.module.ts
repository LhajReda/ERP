import { Module } from '@nestjs/common';
import { InvoiceService } from './invoice.service';
import { PaymentService } from './payment.service';
import { TransactionService } from './transaction.service';
import { ReportService } from './report.service';
import { InvoiceController, TransactionController, ReportController } from './finance.controller';

@Module({
  controllers: [InvoiceController, TransactionController, ReportController],
  providers: [InvoiceService, PaymentService, TransactionService, ReportService],
  exports: [InvoiceService, PaymentService, TransactionService, ReportService],
})
export class FinanceModule {}
