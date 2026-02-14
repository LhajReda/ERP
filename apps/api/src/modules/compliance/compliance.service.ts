import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CertificationType } from '@prisma/client';

@Injectable()
export class ComplianceService {
  constructor(private readonly prisma: PrismaService) {}

  async createCertification(data: {
    farmId: string; type: CertificationType; certificateNumber?: string;
    issuedBy?: string; issueDate?: string; expiryDate?: string; documentUrl?: string;
  }) {
    return this.prisma.certification.create({
      data: {
        ...data,
        issueDate: data.issueDate ? new Date(data.issueDate) : undefined,
        expiryDate: data.expiryDate ? new Date(data.expiryDate) : undefined,
      },
    });
  }

  async findByFarm(farmId: string) {
    return this.prisma.certification.findMany({
      where: { farmId },
      include: { audits: { take: 3, orderBy: { date: 'desc' } } },
      orderBy: { type: 'asc' },
    });
  }

  async getComplianceStatus(farmId: string) {
    const certs = await this.prisma.certification.findMany({ where: { farmId } });
    const now = new Date();
    return certs.map((c: any) => {
      let status: 'active' | 'expired' | 'expiring_soon' = 'active';
      if (c.expiryDate) {
        if (c.expiryDate < now) status = 'expired';
        else {
          const daysLeft = Math.ceil((c.expiryDate.getTime() - now.getTime()) / 86400000);
          if (daysLeft <= 30) status = 'expiring_soon';
        }
      }
      return { ...c, computedStatus: status };
    });
  }

  async getExpiringCertifications(farmId: string, days = 30) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);
    return this.prisma.certification.findMany({
      where: { farmId, expiryDate: { lte: futureDate, gte: new Date() } },
    });
  }

  async checkONSSACompliance(farmId: string) {
    const [products, certs] = await Promise.all([
      this.prisma.product.findMany({ where: { farmId, category: 'PHYTOSANITAIRE' } }),
      this.prisma.certification.findMany({ where: { farmId, type: 'ONSSA' } }),
    ]);
    const unapproved = products.filter((p: any) => !p.onssaApproval);
    return {
      hasONSSACertification: certs.length > 0,
      totalPhytoProducts: products.length,
      approvedProducts: products.length - unapproved.length,
      unapprovedProducts: unapproved.map((p: any) => ({ id: p.id, name: p.name })),
      isCompliant: certs.length > 0 && unapproved.length === 0,
    };
  }
}
