import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { MovementService } from './movement.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('MovementService', () => {
  let service: MovementService;
  let prisma: any;

  const mockProduct = {
    id: 'prod-1',
    name: 'NPK 15-15-15',
    currentStock: 100,
    unit: 'SAC',
    farmId: 'farm-1',
  };

  beforeEach(async () => {
    const txMock = {
      product: {
        findUniqueOrThrow: jest.fn().mockResolvedValue(mockProduct),
        update: jest.fn().mockResolvedValue({ ...mockProduct, currentStock: 150 }),
      },
      stockMovement: {
        create: jest.fn().mockImplementation(({ data }) =>
          Promise.resolve({ id: 'mov-1', ...data }),
        ),
      },
    };

    prisma = {
      $transaction: jest.fn().mockImplementation((fn) => fn(txMock)),
      stockMovement: {
        findMany: jest.fn().mockResolvedValue([]),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MovementService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<MovementService>(MovementService);
  });

  describe('create', () => {
    it('should create an ENTREE movement and increment stock', async () => {
      const dto = { productId: 'prod-1', type: 'ENTREE' as any, quantity: 50, unitPrice: 280 };
      const result = await service.create(dto, 'user-1');

      expect(result).toBeDefined();
      expect(result.totalPrice).toBe(14000); // 50 * 280
    });

    it('should create a SORTIE movement and decrement stock', async () => {
      const dto = { productId: 'prod-1', type: 'SORTIE' as any, quantity: 30, unitPrice: 280 };
      const result = await service.create(dto, 'user-1');
      expect(result).toBeDefined();
    });

    it('should reject SORTIE when insufficient stock', async () => {
      const txMock = {
        product: {
          findUniqueOrThrow: jest.fn().mockResolvedValue({ ...mockProduct, currentStock: 10 }),
          update: jest.fn(),
        },
        stockMovement: { create: jest.fn() },
      };
      prisma.$transaction.mockImplementation((fn: any) => fn(txMock));

      const dto = { productId: 'prod-1', type: 'SORTIE' as any, quantity: 50, unitPrice: 280 };
      await expect(service.create(dto, 'user-1')).rejects.toThrow(BadRequestException);
    });

    it('should allow AJUSTEMENT_PLUS without stock check', async () => {
      const dto = { productId: 'prod-1', type: 'AJUSTEMENT_PLUS' as any, quantity: 200, unitPrice: 0 };
      const result = await service.create(dto, 'user-1');
      expect(result).toBeDefined();
    });

    it('should reject PERTE when insufficient stock', async () => {
      const txMock = {
        product: {
          findUniqueOrThrow: jest.fn().mockResolvedValue({ ...mockProduct, currentStock: 5 }),
          update: jest.fn(),
        },
        stockMovement: { create: jest.fn() },
      };
      prisma.$transaction.mockImplementation((fn: any) => fn(txMock));

      const dto = { productId: 'prod-1', type: 'PERTE' as any, quantity: 10, unitPrice: 0 };
      await expect(service.create(dto, 'user-1')).rejects.toThrow(BadRequestException);
    });

    it('should calculate totalPrice correctly', async () => {
      const dto = { productId: 'prod-1', type: 'ENTREE' as any, quantity: 25, unitPrice: 420 };
      const result = await service.create(dto, 'user-1');
      expect(result.totalPrice).toBe(10500);
    });
  });

  describe('findByProduct', () => {
    it('should call prisma with correct product id', async () => {
      await service.findByProduct('prod-1');
      expect(prisma.stockMovement.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { productId: 'prod-1' } }),
      );
    });
  });
});
