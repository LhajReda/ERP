import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';

/**
 * Guard that ensures the authenticated user belongs to the tenant
 * specified in the request. The tenantId is set by the TenantMiddleware
 * from the x-tenant-id header or subdomain, and the user's tenantId
 * comes from the JWT token payload.
 *
 * Must be used after JwtAuthGuard so that request.user is populated,
 * and after TenantMiddleware so that request.tenantId is set.
 *
 * SUPER_ADMIN users bypass this check and can access any tenant's data.
 *
 * Usage:
 *   @UseGuards(JwtAuthGuard, TenantGuard)
 *   @Get('tenant-data')
 *   getTenantData() { ... }
 */
@Injectable()
export class TenantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const tenantId = request.tenantId;

    if (!tenantId) {
      throw new BadRequestException(
        'Identifiant du tenant manquant. Verifiez le header x-tenant-id ou le sous-domaine.',
      );
    }

    if (!user) {
      throw new ForbiddenException(
        'Utilisateur non authentifie. Impossible de verifier le tenant.',
      );
    }

    // SUPER_ADMIN can access any tenant
    if (user.role === 'SUPER_ADMIN') {
      return true;
    }

    if (user.tenantId !== tenantId) {
      throw new ForbiddenException(
        "Acces refuse. Vous n'appartenez pas a ce tenant.",
      );
    }

    return true;
  }
}
