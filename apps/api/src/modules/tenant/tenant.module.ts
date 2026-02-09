import { Module } from '@nestjs/common';
import { TenantService } from './tenant.service';

/**
 * Module Tenant - Gestion multi-tenant pour FLA7A ERP.
 * Exporte le TenantService pour etre utilise par les autres modules
 * (auth, farm, etc.) qui ont besoin de verifier ou manipuler les tenants.
 */
@Module({
  providers: [TenantService],
  exports: [TenantService],
})
export class TenantModule {}
