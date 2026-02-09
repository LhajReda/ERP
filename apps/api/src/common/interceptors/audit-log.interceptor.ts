import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * HTTP method to audit action mapping.
 */
const METHOD_ACTION_MAP: Record<string, string> = {
  POST: 'CREATE',
  PUT: 'UPDATE',
  PATCH: 'UPDATE',
  DELETE: 'DELETE',
};

/**
 * Interceptor that automatically logs CREATE, UPDATE, and DELETE actions
 * to the AuditLog table via PrismaService. GET requests are ignored.
 *
 * The interceptor extracts:
 * - userId from request.user (set by JwtAuthGuard)
 * - entity name from the controller class name
 * - entityId from route params (id)
 * - IP address and User-Agent from the request
 * - response data as newData
 *
 * Usage:
 *   @UseInterceptors(AuditLogInterceptor)
 *   @Controller('farms')
 *   export class FarmController { ... }
 */
@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditLogInterceptor.name);

  constructor(private readonly prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const method = request.method?.toUpperCase();
    const action = METHOD_ACTION_MAP[method];

    // Only log mutation operations
    if (!action) {
      return next.handle();
    }

    const user = request.user;
    const controllerName = context.getClass().name;
    const entity = controllerName.replace('Controller', '');
    const entityId = request.params?.id || null;
    const ipAddress =
      request.ip ||
      request.headers['x-forwarded-for'] ||
      request.connection?.remoteAddress;
    const userAgent = request.headers['user-agent'] || null;

    // Capture the request body as the "before" state for context
    const requestBody = request.body ? { ...request.body } : null;

    // Remove sensitive fields from the logged data
    if (requestBody) {
      delete requestBody.password;
      delete requestBody.passwordHash;
      delete requestBody.twoFactorSecret;
    }

    return next.handle().pipe(
      tap({
        next: async (responseData) => {
          // Only log if we have an authenticated user
          if (!user?.id) {
            return;
          }

          try {
            await this.prisma.auditLog.create({
              data: {
                userId: user.id,
                action,
                entity,
                entityId: entityId || responseData?.id || null,
                oldData: action === 'UPDATE' ? requestBody : null,
                newData: responseData ?? null,
                ipAddress: typeof ipAddress === 'string' ? ipAddress : null,
                userAgent,
              },
            });
          } catch (error: any) {
            // Audit logging should never break the main request flow
            this.logger.error(
              `Failed to create audit log: ${error?.message}`,
              error?.stack,
            );
          }
        },
        error: () => {
          // Do not log failed operations
        },
      }),
    );
  }
}
