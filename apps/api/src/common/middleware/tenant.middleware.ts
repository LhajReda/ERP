import {
  Injectable,
  NestMiddleware,
  Logger,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

/**
 * Extend the Express Request interface to include tenantId.
 */
declare global {
  namespace Express {
    interface Request {
      tenantId?: string;
    }
  }
}

/**
 * Middleware that extracts the tenant identifier from the incoming request
 * and attaches it to the request object as `request.tenantId`.
 *
 * Tenant resolution order:
 * 1. `x-tenant-id` header (used by API clients and mobile apps)
 * 2. Subdomain extraction from the Host header (used by web apps)
 *
 * Excluded paths (no tenant required):
 * - /api/v1/auth/* (authentication routes)
 * - /api/docs* (Swagger documentation)
 * - /health (health check)
 *
 * Usage in AppModule:
 *   configure(consumer: MiddlewareConsumer) {
 *     consumer.apply(TenantMiddleware).forRoutes('*');
 *   }
 */
@Injectable()
export class TenantMiddleware implements NestMiddleware {
  private readonly logger = new Logger(TenantMiddleware.name);

  /**
   * Paths that do not require tenant identification.
   */
  private readonly excludedPaths = [
    '/api/v1/auth',
    '/api/docs',
    '/health',
  ];

  use(req: Request, _res: Response, next: NextFunction): void {
    // Skip tenant resolution for excluded paths
    const isExcluded = this.excludedPaths.some((path) =>
      req.originalUrl.startsWith(path),
    );

    if (isExcluded) {
      return next();
    }

    // 1. Try x-tenant-id header first
    const headerTenantId = req.headers['x-tenant-id'] as string;

    if (headerTenantId) {
      req.tenantId = headerTenantId;
      return next();
    }

    // 2. Try subdomain extraction from Host header
    const host = req.headers.host;

    if (host) {
      const tenantFromSubdomain = this.extractTenantFromHost(host);

      if (tenantFromSubdomain) {
        req.tenantId = tenantFromSubdomain;
        return next();
      }
    }

    // No tenant found - this is acceptable for some routes
    // The TenantGuard will enforce tenant requirement where needed
    this.logger.debug(
      `No tenant identified for ${req.method} ${req.originalUrl}`,
    );

    next();
  }

  /**
   * Extracts the tenant subdomain from the host header.
   * Expects format: <subdomain>.fla7a.ma or <subdomain>.localhost
   *
   * Returns null for:
   * - IP addresses
   * - localhost without subdomain
   * - Single-segment hostnames
   * - Known non-tenant subdomains (www, api, app)
   */
  private extractTenantFromHost(host: string): string | null {
    // Remove port number if present
    const hostname = host.split(':')[0];

    // Skip IP addresses
    if (/^\d+\.\d+\.\d+\.\d+$/.test(hostname)) {
      return null;
    }

    // Skip plain localhost
    if (hostname === 'localhost') {
      return null;
    }

    const parts = hostname.split('.');

    // Need at least 2 parts (subdomain.domain) or 3 for full domains (sub.domain.tld)
    if (parts.length < 2) {
      return null;
    }

    const subdomain = parts[0];

    // Skip known non-tenant subdomains
    const reservedSubdomains = ['www', 'api', 'app', 'admin', 'mail', 'ftp'];
    if (reservedSubdomains.includes(subdomain.toLowerCase())) {
      return null;
    }

    return subdomain;
  }
}
