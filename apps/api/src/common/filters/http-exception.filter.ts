import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { requestContext } from '../context/request-context';

/**
 * Shape of the standardized error response.
 */
export interface ErrorResponse {
  success: false;
  statusCode: number;
  message: string | string[];
  error: string;
  timestamp: string;
  path: string;
  requestId: string | null;
}

/**
 * Global exception filter that catches all HttpExceptions and returns
 * a standardized error response:
 * {
 *   success: false,
 *   statusCode: <HTTP status code>,
 *   message: <error message or validation messages array>,
 *   error: <error name>,
 *   timestamp: <ISO date string>,
 *   path: <request URL>
 * }
 *
 * Applied globally in main.ts via app.useGlobalFilters().
 */
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: HttpException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const statusCode = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    // Extract the message - handle both string and validation error responses
    let message: string | string[];
    let error: string;

    if (typeof exceptionResponse === 'string') {
      message = exceptionResponse;
      error = exception.name;
    } else if (typeof exceptionResponse === 'object') {
      const responseObj = exceptionResponse as Record<string, unknown>;
      const rawMessage = responseObj.message;
      const rawError = responseObj.error;

      if (Array.isArray(rawMessage)) {
        const normalizedMessages = rawMessage.filter(
          (item): item is string => typeof item === 'string',
        );
        message =
          normalizedMessages.length > 0 ? normalizedMessages : exception.message;
      } else {
        message =
          typeof rawMessage === 'string' ? rawMessage : exception.message;
      }
      error = typeof rawError === 'string' ? rawError : exception.name;
    } else {
      message = exception.message;
      error = exception.name;
    }
    const requestId = requestContext.getRequestId();

    const errorResponse: ErrorResponse = {
      success: false,
      statusCode,
      message,
      error,
      timestamp: new Date().toISOString(),
      path: request.url,
      requestId,
    };

    // Log server errors (5xx) at error level, client errors at warn level
    if (statusCode >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        JSON.stringify({
          event: 'http_error',
          requestId,
          method: request.method,
          path: request.url,
          statusCode,
          error,
          message,
        }),
        exception.stack,
      );
    } else {
      this.logger.warn(
        JSON.stringify({
          event: 'http_error',
          requestId,
          method: request.method,
          path: request.url,
          statusCode,
          error,
          message,
        }),
      );
    }

    response.status(statusCode).json(errorResponse);
  }
}
