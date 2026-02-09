import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Put,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthService } from './auth.service';
import { ChangePasswordDto } from './dto/change-password.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RegisterDto } from './dto/register.dto';
import { TokenResponseDto } from './dto/token-response.dto';
import { LocalAuthGuard } from './guards/local-auth.guard';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // ─── POST /auth/login ──────────────────────────────────────────
  @Post('login')
  @UseGuards(LocalAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Connexion utilisateur',
    description:
      'Authentifie un utilisateur avec son numéro de téléphone et mot de passe. Retourne un token d\'accès et un token de rafraîchissement.',
  })
  @ApiBody({ type: LoginDto })
  @ApiOkResponse({
    description: 'Connexion réussie',
    type: TokenResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Identifiants invalides',
  })
  async login(@Request() req: any): Promise<TokenResponseDto> {
    return this.authService.login(req.user);
  }

  // ─── POST /auth/register ───────────────────────────────────────
  @Post('register')
  @ApiOperation({
    summary: 'Inscription d\'un nouvel utilisateur',
    description:
      'Crée un nouveau compte utilisateur et retourne les tokens d\'authentification. Un tenantId doit être fourni en en-tête x-tenant-id.',
  })
  @ApiCreatedResponse({
    description: 'Inscription réussie',
    type: TokenResponseDto,
  })
  async register(
    @Body() dto: RegisterDto,
    @Request() req: any,
  ): Promise<TokenResponseDto> {
    const tenantId = req.headers['x-tenant-id'];
    if (!tenantId) {
      throw new BadRequestException(
        'L\'en-tête x-tenant-id est requis pour l\'inscription.',
      );
    }
    return this.authService.register(dto, tenantId);
  }

  // ─── POST /auth/refresh ────────────────────────────────────────
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Rafraîchir le token d\'accès',
    description:
      'Utilise un token de rafraîchissement valide pour obtenir une nouvelle paire de tokens.',
  })
  @ApiOkResponse({
    description: 'Tokens rafraîchis avec succès',
    type: TokenResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Token de rafraîchissement invalide ou expiré',
  })
  async refresh(@Body() dto: RefreshTokenDto): Promise<TokenResponseDto> {
    return this.authService.refreshToken(dto.refreshToken);
  }

  // ─── GET /auth/profile ─────────────────────────────────────────
  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Obtenir le profil de l\'utilisateur connecté',
    description:
      'Retourne les informations du profil de l\'utilisateur authentifié.',
  })
  @ApiOkResponse({
    description: 'Profil de l\'utilisateur',
  })
  @ApiUnauthorizedResponse({
    description: 'Token d\'accès invalide ou expiré',
  })
  getProfile(@CurrentUser() user: any) {
    return user;
  }

  // ─── PUT /auth/change-password ─────────────────────────────────
  @Put('change-password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Changer le mot de passe',
    description:
      'Permet à l\'utilisateur authentifié de changer son mot de passe en fournissant l\'ancien et le nouveau.',
  })
  @ApiOkResponse({
    description: 'Mot de passe changé avec succès',
  })
  @ApiUnauthorizedResponse({
    description: 'Token d\'accès invalide ou expiré',
  })
  async changePassword(
    @CurrentUser('id') userId: string,
    @Body() dto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    return this.authService.changePassword(
      userId,
      dto.oldPassword,
      dto.newPassword,
    );
  }

  // ─── POST /auth/logout ─────────────────────────────────────────
  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Déconnexion',
    description:
      'Déconnecte l\'utilisateur. Côté client, le token doit être supprimé. Un mécanisme de blacklist peut être ajouté ultérieurement.',
  })
  @ApiOkResponse({
    description: 'Déconnexion réussie',
  })
  @ApiUnauthorizedResponse({
    description: 'Token d\'accès invalide ou expiré',
  })
  logout(): { message: string } {
    // In a production setup, you would add the token to a blacklist
    // stored in Redis to prevent reuse until expiration.
    // For now, the client is responsible for discarding the token.
    return { message: 'Déconnexion réussie.' };
  }
}
