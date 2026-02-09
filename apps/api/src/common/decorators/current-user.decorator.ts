import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Custom parameter decorator that extracts the authenticated user
 * from the request object. The user is attached by the JWT auth guard
 * after successful token validation.
 *
 * Usage:
 *   @Get('profile')
 *   getProfile(@CurrentUser() user: User) { ... }
 *
 *   @Get('profile')
 *   getProfile(@CurrentUser('id') userId: string) { ... }
 */
export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      return null;
    }

    return data ? user[data] : user;
  },
);
