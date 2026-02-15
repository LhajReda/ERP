import { randomUUID } from 'node:crypto';
import { Logger } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { requestContext } from '../context/request-context';

const REQUEST_ID_HEADER = 'x-request-id';
const logger = new Logger('HTTP');

const readHeaderValue = (value: string | string[] | undefined): string | null => {
  if (Array.isArray(value)) {
    const first = value[0]?.trim();
    return first || null;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed || null;
  }
  return null;
};

export const requestContextMiddleware = (
  request: Request,
  response: Response,
  next: NextFunction,
): void => {
  const requestId = readHeaderValue(request.headers[REQUEST_ID_HEADER]) ?? randomUUID();
  const startTime = Date.now();
  const requestPath = request.originalUrl || request.url;

  response.setHeader(REQUEST_ID_HEADER, requestId);

  requestContext.run({ requestId, startTime }, () => {
    response.on('finish', () => {
      const durationMs = Date.now() - startTime;
      logger.log(
        JSON.stringify({
          event: 'http_request',
          requestId,
          method: request.method,
          path: requestPath,
          statusCode: response.statusCode,
          durationMs,
        }),
      );
    });

    next();
  });
};
