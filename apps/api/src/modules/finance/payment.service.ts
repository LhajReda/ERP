import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePaymentDto } from './dto/create-payment.dto';

@Injectable()
export class PaymentService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreatePaymentDto) {
    return this.prisma.$transaction(async (tx) => {
      const invoice = await tx.invoice.findUniqueOrThrow({ where: { id: dto.invoiceId } });
      if (dto.amount > invoice.amountDue) {
        throw new BadRequestException(`Montant depasse le reste a payer: ${invoice.amountDue} MAD`);
      }

      const payment = await tx.payment.create({
        data: { ...dto, date: new Date(dto.date) },
      });

      const newAmountPaid = invoice.amountPaid + dto.amount;
      const newAmountDue = invoice.total - newAmountPaid;
      await tx.invoice.update({
        where: { id: dto.invoiceId },
        data: {
          amountPaid: newAmountPaid,
          amountDue: newAmountDue,
          status: newAmountDue <= 0 ? 'PAYEE' : 'PARTIELLEMENT_PAYEE',
        },
      });

      return payment;
    });
  }

  async findByInvoice(invoiceId: string) {
    return this.prisma.payment.findMany({ where: { invoiceId }, orderBy: { date: 'desc' } });
  }
}
