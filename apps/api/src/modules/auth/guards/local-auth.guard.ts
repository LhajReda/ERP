import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Guard that uses the 'local' Passport strategy to validate
 * phone number and password credentials from the request body.
 *
 * Usage:
 *   @UseGuards(LocalAuthGuard)
 *   @Post('login')
 *   login(@Request() req) { ... }
 */
@Injectable()
export class LocalAuthGuard extends AuthGuard('local') {}
