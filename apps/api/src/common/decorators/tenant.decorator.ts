import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Custom parameter decorator that extracts the current tenant ID
 * from the request object. The tenantId is attached by the
 * TenantMiddleware from the x-tenant-id header or subdomain.
 *
 * Usage:
 *   @Get('data')
 *   getData(@CurrentTenant() tenantId: string) { ... }
 */
export const CurrentTenant = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    return request.tenantId;
  },
);
