import { PartialType } from '@nestjs/swagger';
import { CreateFarmDto } from './create-farm.dto';

/**
 * DTO pour la mise a jour d'une ferme.
 * Tous les champs sont optionnels grace a PartialType.
 * Seuls les champs fournis seront mis a jour.
 */
export class UpdateFarmDto extends PartialType(CreateFarmDto) {}
