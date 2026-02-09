import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateParcelDto } from './create-parcel.dto';

/**
 * DTO pour la mise a jour d'une parcelle.
 * Tous les champs sont optionnels. Le farmId ne peut pas etre modifie
 * apres creation (une parcelle ne peut pas changer de ferme).
 */
export class UpdateParcelDto extends PartialType(
  OmitType(CreateParcelDto, ['farmId'] as const),
) {}
