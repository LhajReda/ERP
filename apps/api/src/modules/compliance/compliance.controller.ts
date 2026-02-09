import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { ComplianceService } from './compliance.service';
import { UserRole, CertificationType } from '@prisma/client';

@ApiTags('Compliance')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('compliance')
export class ComplianceController {
  constructor(private readonly complianceService: ComplianceService) {}

  @Post('certifications')
  @Roles(UserRole.ADMIN, UserRole.AUDITEUR)
  @ApiOperation({ summary: 'Ajouter une certification' })
  create(@Body() dto: { farmId: string; type: CertificationType; certificateNumber?: string; issuedBy?: string; issueDate?: string; expiryDate?: string }) {
    return this.complianceService.createCertification(dto);
  }

  @Get('certifications/:farmId')
  @ApiOperation({ summary: 'Certifications d\'une exploitation' })
  findByFarm(@Param('farmId') farmId: string) { return this.complianceService.findByFarm(farmId); }

  @Get('status/:farmId')
  @ApiOperation({ summary: 'Statut de conformite' })
  getStatus(@Param('farmId') farmId: string) { return this.complianceService.getComplianceStatus(farmId); }

  @Get('onssa-check/:farmId')
  @ApiOperation({ summary: 'Verification conformite ONSSA' })
  checkONSSA(@Param('farmId') farmId: string) { return this.complianceService.checkONSSACompliance(farmId); }

  @Get('expiring/:farmId')
  @ApiOperation({ summary: 'Certifications expirant bientot' })
  getExpiring(@Param('farmId') farmId: string, @Query('days') days?: number) {
    return this.complianceService.getExpiringCertifications(farmId, days || 30);
  }
}
