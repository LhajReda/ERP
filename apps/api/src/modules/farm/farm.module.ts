import { Module } from '@nestjs/common';
import { FarmService } from './farm.service';
import { FarmController } from './farm.controller';

/**
 * Module Farm - Gestion des exploitations agricoles.
 * Fournit les endpoints CRUD et exporte le FarmService
 * pour utilisation par les modules dependants (parcel, culture, etc.).
 */
@Module({
  controllers: [FarmController],
  providers: [FarmService],
  exports: [FarmService],
})
export class FarmModule {}
