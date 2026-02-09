import { ValidationPipe, ValidationPipeOptions } from '@nestjs/common';

/**
 * Default validation pipe options for the FLA7A ERP application.
 *
 * - whitelist: strips properties not decorated with class-validator decorators
 * - forbidNonWhitelisted: throws an error if non-whitelisted properties are present
 * - transform: automatically transforms payloads to DTO instances
 * - transformOptions.enableImplicitConversion: allows automatic type conversion
 *   (e.g., string query params to numbers)
 */
export const DEFAULT_VALIDATION_OPTIONS: ValidationPipeOptions = {
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
  transformOptions: {
    enableImplicitConversion: true,
  },
};

/**
 * Pre-configured ValidationPipe with sensible defaults for the application.
 * Can be used as a global pipe or on specific routes.
 *
 * Usage (global in main.ts):
 *   app.useGlobalPipes(new AppValidationPipe());
 *
 * Usage (per-route):
 *   @UsePipes(new AppValidationPipe())
 *   @Post()
 *   create(@Body() dto: CreateDto) { ... }
 */
export class AppValidationPipe extends ValidationPipe {
  constructor(options?: ValidationPipeOptions) {
    super({
      ...DEFAULT_VALIDATION_OPTIONS,
      ...options,
    });
  }
}
