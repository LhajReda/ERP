import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateMovementDto } from './dto/create-movement.dto';
import { MovementType } from '@prisma/client';

const ADDITIVE_TYPES: MovementType[] = ['ENTREE', 'RETOUR', 'AJUSTEMENT_PLUS'];
const SUBTRACTIVE_TYPES: MovementType[] = ['SORTIE', 'PERTE', 'AJUSTEMENT_MOINS'];

@Injectable()
export class MovementService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateMovementDto, userId: string) {
    const totalPrice = dto.quantity * dto.unitPrice;

    return this.prisma.$transaction(async (tx) => {
      const product = await tx.product.findUniqueOrThrow({ where: { id: dto.productId } });

      if (SUBTRACTIVE_TYPES.includes(dto.type) && product.currentStock < dto.quantity) {
        throw new BadRequestException(
          `Stock insuffisant: ${product.currentStock} ${product.unit} disponible, ${dto.quantity} demande`,
        );
      }

      const movement = await tx.stockMovement.create({
        data: {
          ...dto,
          totalPrice,
          expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : undefined,
          createdBy: userId,
        },
      });

      const stockChange = ADDITIVE_TYPES.includes(dto.type) ? dto.quantity : -dto.quantity;
      await tx.product.update({
        where: { id: dto.productId },
        data: {
          currentStock: { increment: stockChange },
          ...(ADDITIVE_TYPES.includes(dto.type) && { lastPurchasePrice: dto.unitPrice }),
        },
      });

      return movement;
    });
  }

  async findByProduct(productId: string) {
    return this.prisma.stockMovement.findMany({
      where: { productId },
      orderBy: { date: 'desc' },
      take: 50,
    });
  }

  async findByDateRange(farmId: string, startDate: Date, endDate: Date) {
    return this.prisma.stockMovement.findMany({
      where: {
        product: { farmId },
        date: { gte: startDate, lte: endDate },
      },
      include: { product: { select: { name: true, unit: true } } },
      orderBy: { date: 'desc' },
    });
  }
}
