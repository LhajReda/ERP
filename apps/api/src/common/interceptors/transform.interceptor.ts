import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  StreamableFile,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { requestContext } from '../context/request-context';

/**
 * Shape of the standardized API response.
 */
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  timestamp: string;
  path: string;
  requestId: string | null;
}

/**
 * Interceptor that wraps all successful responses in a standardized format:
 * {
 *   success: true,
 *   data: <original response>,
 *   timestamp: <ISO date string>,
 *   path: <request URL>
 * }
 *
 * Applied globally in main.ts via app.useGlobalInterceptors().
 */
@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, ApiResponse<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T>> {
    const request = context.switchToHttp().getRequest();
    const path = request.url;
    const requestId = requestContext.getRequestId();

    return next.handle().pipe(
      map((data) => {
        if (data instanceof StreamableFile || Buffer.isBuffer(data)) {
          return data as any;
        }

        return {
          success: true,
          data,
          timestamp: new Date().toISOString(),
          path,
          requestId,
        };
      }),
    );
  }
}
