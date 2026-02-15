import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { PrismaService } from '../../prisma/prisma.service';
import { requestContext } from '../context/request-context';

/**
 * HTTP method to audit action mapping.
 */
const METHOD_ACTION_MAP: Record<string, string> = {
  POST: 'CREATE',
  PUT: 'UPDATE',
  PATCH: 'UPDATE',
  DELETE: 'DELETE',
};

const SENSITIVE_FIELDS = new Set([
  'password',
  'passwordhash',
  'twofactorsecret',
  'accesstoken',
  'refreshtoken',
  'token',
  'authorization',
  'cookie',
  'secret',
  'apikey',
  'apisecret',
]);

const JWT_PATTERN = /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/;

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error && error.message) return error.message;
  return 'Unknown audit log error';
};

const getErrorStack = (error: unknown): string | undefined => {
  if (error instanceof Error && error.stack) return error.stack;
  return undefined;
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
    const requestBody = this.sanitizeForAudit(request.body);

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
                oldData:
                  action === 'UPDATE'
                    ? this.toPrismaJson(requestBody)
                    : Prisma.JsonNull,
                newData: this.toPrismaJson(
                  this.sanitizeForAudit(responseData),
                ),
                ipAddress: typeof ipAddress === 'string' ? ipAddress : null,
                userAgent,
              },
            });
          } catch (error: unknown) {
            // Audit logging should never break the main request flow
            const requestId = requestContext.getRequestId();
            this.logger.error(
              JSON.stringify({
                event: 'audit_log_error',
                requestId,
                message: getErrorMessage(error),
                action,
                entity,
                entityId,
              }),
              getErrorStack(error),
            );
          }
        },
        error: () => {
          // Do not log failed operations
        },
      }),
    );
  }

  private sanitizeForAudit(value: unknown): unknown {
    return this.sanitizeValue(value, 0, new WeakSet<object>());
  }

  private sanitizeValue(
    value: unknown,
    depth: number,
    seen: WeakSet<object>,
  ): unknown {
    if (value === null || typeof value === 'undefined') return null;
    if (typeof value === 'bigint') return value.toString();
    if (typeof value === 'string') {
      return JWT_PATTERN.test(value) ? '[REDACTED]' : value;
    }
    if (typeof value !== 'object') return value;
    if (value instanceof Date) return value.toISOString();

    if (depth >= 6) return '[TRUNCATED]';

    if (seen.has(value)) return '[CIRCULAR]';
    seen.add(value);

    if (Array.isArray(value)) {
      const sanitizedArray = value.map((item) =>
        this.sanitizeValue(item, depth + 1, seen),
      );
      seen.delete(value);
      return sanitizedArray;
    }

    const sanitized: Record<string, unknown> = {};
    for (const [key, raw] of Object.entries(value as Record<string, unknown>)) {
      const normalizedKey = key.toLowerCase();
      if (
        SENSITIVE_FIELDS.has(normalizedKey) ||
        normalizedKey.includes('password') ||
        normalizedKey.includes('token') ||
        normalizedKey.includes('secret')
      ) {
        sanitized[key] = '[REDACTED]';
        continue;
      }
      sanitized[key] = this.sanitizeValue(raw, depth + 1, seen);
    }

    seen.delete(value);
    return sanitized;
  }

  private toPrismaJson(
    value: unknown,
  ): Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput {
    if (value === null || typeof value === 'undefined') {
      return Prisma.JsonNull;
    }
    return value as Prisma.InputJsonValue;
  }
}
