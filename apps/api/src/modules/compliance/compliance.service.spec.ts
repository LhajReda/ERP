import { Test, TestingModule } from '@nestjs/testing';
import { ComplianceService } from './compliance.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('ComplianceService', () => {
  let service: ComplianceService;
  let prisma: any;

  const mockCerts = [
    {
      id: 'cert-1',
      type: 'ONSSA',
      farmId: 'farm-1',
      certificateNumber: 'ONSSA-SM-2024-001',
      expiryDate: new Date('2027-12-31'), // Future = active
      status: 'active',
    },
    {
      id: 'cert-2',
      type: 'GLOBAL_GAP',
      farmId: 'farm-1',
      certificateNumber: 'GG-2024-001',
      expiryDate: new Date('2024-01-01'), // Past = expired
      status: 'active',
    },
    {
      id: 'cert-3',
      type: 'BIO_MAROC',
      farmId: 'farm-1',
      certificateNumber: 'BIO-2024-001',
      expiryDate: new Date(Date.now() + 15 * 86400000), // 15 days = expiring_soon
      status: 'active',
    },
  ];

  const mockProducts = [
    { id: 'p1', name: 'Confidor', category: 'PHYTOSANITAIRE', onssaApproval: 'ONSSA-001' },
    { id: 'p2', name: 'Roundup', category: 'PHYTOSANITAIRE', onssaApproval: null },
  ];

  beforeEach(async () => {
    prisma = {
      certification: {
        create: jest.fn().mockResolvedValue(mockCerts[0]),
        findMany: jest.fn().mockResolvedValue(mockCerts),
      },
      product: {
        findMany: jest.fn().mockResolvedValue(mockProducts),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ComplianceService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<ComplianceService>(ComplianceService);
  });

  describe('getComplianceStatus', () => {
    it('should categorize certifications by expiry status', async () => {
      const result = await service.getComplianceStatus('farm-1');
      expect(result).toHaveLength(3);

      const active = result.find((c: any) => c.id === 'cert-1');
      expect(active.computedStatus).toBe('active');

      const expired = result.find((c: any) => c.id === 'cert-2');
      expect(expired.computedStatus).toBe('expired');

      const expiring = result.find((c: any) => c.id === 'cert-3');
      expect(expiring.computedStatus).toBe('expiring_soon');
    });
  });

  describe('checkONSSACompliance', () => {
    it('should identify unapproved phyto products', async () => {
      const result = await service.checkONSSACompliance('farm-1');
      expect(result.totalPhytoProducts).toBe(2);
      expect(result.approvedProducts).toBe(1);
      expect(result.unapprovedProducts).toHaveLength(1);
      expect(result.unapprovedProducts[0].name).toBe('Roundup');
    });

    it('should report non-compliant when unapproved products exist', async () => {
      const result = await service.checkONSSACompliance('farm-1');
      expect(result.isCompliant).toBe(false);
    });

    it('should report compliant when all products approved and cert exists', async () => {
      prisma.product.findMany.mockResolvedValue([mockProducts[0]]); // Only approved product
      const result = await service.checkONSSACompliance('farm-1');
      expect(result.isCompliant).toBe(true);
    });
  });
});
