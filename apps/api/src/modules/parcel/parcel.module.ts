import { Module } from '@nestjs/common';
import { ParcelService } from './parcel.service';
import { ParcelController } from './parcel.controller';

/**
 * Module Parcel - Gestion des parcelles agricoles.
 * Fournit les endpoints CRUD et exporte le ParcelService
 * pour utilisation par les modules dependants (culture, soil-analysis, etc.).
 */
@Module({
  controllers: [ParcelController],
  providers: [ParcelService],
  exports: [ParcelService],
})
export class ParcelModule {}
