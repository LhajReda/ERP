import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { TokenResponseDto } from './dto/token-response.dto';
import { JwtPayload } from './strategies/jwt.strategy';

const SALT_ROUNDS = 12;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly jwtSecret: string;
  private readonly accessTokenExpiration: string;
  private readonly refreshTokenExpiration: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    this.jwtSecret = this.configService.getOrThrow<string>('JWT_SECRET');
    this.accessTokenExpiration =
      this.configService.get<string>('JWT_EXPIRATION') || '15m';
    this.refreshTokenExpiration =
      this.configService.get<string>('JWT_REFRESH_EXPIRATION') || '7d';
  }

  /**
   * Validates a user by phone and password.
   * Returns the user (without passwordHash) if credentials are valid, null otherwise.
   */
  async validateUser(phone: string, password: string): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { phone },
    });

    if (!user) {
      this.logger.warn(`Tentative de connexion échouée: téléphone ${phone} introuvable`);
      return null;
    }

    if (!user.isActive) {
      this.logger.warn(`Tentative de connexion sur un compte désactivé: ${phone}`);
      throw new UnauthorizedException(
        'Compte désactivé. Veuillez contacter l\'administrateur.',
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      this.logger.warn(`Mot de passe incorrect pour le téléphone: ${phone}`);
      return null;
    }

    const {
      passwordHash: _passwordHash,
      twoFactorSecret: _twoFactorSecret,
      ...result
    } = user;
    return result;
  }

  /**
   * Generates access and refresh tokens for a validated user and updates lastLogin.
   */
  async login(user: any): Promise<TokenResponseDto> {
    const payload: Omit<JwtPayload, 'type'> = {
      sub: user.id,
      email: user.email,
      phone: user.phone,
      role: user.role,
      tenantId: user.tenantId,
      language: user.language,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        { ...payload, type: 'access' },
        { expiresIn: this.accessTokenExpiration },
      ),
      this.jwtService.signAsync(
        { ...payload, type: 'refresh' },
        { expiresIn: this.refreshTokenExpiration },
      ),
    ]);

    // Update lastLogin timestamp
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    this.logger.log(`Utilisateur connecté: ${user.phone} (${user.role})`);

    return {
      accessToken,
      refreshToken,
      expiresIn: this.parseExpirationToSeconds(this.accessTokenExpiration),
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        language: user.language,
        tenantId: user.tenantId,
      },
    };
  }

  /**
   * Registers a new user, hashes their password, and returns tokens.
   */
  async register(
    dto: RegisterDto,
    tenantId: string,
  ): Promise<TokenResponseDto> {
    // Check if phone already exists
    const existingPhone = await this.prisma.user.findUnique({
      where: { phone: dto.phone },
    });
    if (existingPhone) {
      throw new ConflictException(
        'Ce numéro de téléphone est déjà utilisé.',
      );
    }

    // Check if email already exists (if provided)
    if (dto.email) {
      const existingEmail = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });
      if (existingEmail) {
        throw new ConflictException('Cette adresse email est déjà utilisée.');
      }
    }

    // Check if CIN already exists (if provided)
    if (dto.cin) {
      const existingCin = await this.prisma.user.findUnique({
        where: { cin: dto.cin },
      });
      if (existingCin) {
        throw new ConflictException('Ce numéro de CIN est déjà utilisé.');
      }
    }

    // Verify that the tenant exists and is active
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { id: true, isActive: true, maxUsers: true },
    });

    if (!tenant || !tenant.isActive) {
      throw new BadRequestException(
        'Tenant introuvable ou désactivé.',
      );
    }

    // Check tenant user limit
    const currentUserCount = await this.prisma.user.count({
      where: { tenantId },
    });
    if (currentUserCount >= tenant.maxUsers) {
      throw new BadRequestException(
        'Le nombre maximum d\'utilisateurs pour ce tenant a été atteint.',
      );
    }

    // Hash the password
    const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);

    // Create the user
    const user = await this.prisma.user.create({
      data: {
        phone: dto.phone,
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        firstNameAr: dto.firstNameAr,
        lastNameAr: dto.lastNameAr,
        email: dto.email,
        cin: dto.cin,
        language: dto.language || 'fr',
        tenantId,
      },
    });

    this.logger.log(
      `Nouvel utilisateur enregistré: ${user.phone} (tenant: ${tenantId})`,
    );

    // Generate tokens and return
    return this.login(user);
  }

  /**
   * Verifies a refresh token and issues a new token pair.
   */
  async refreshToken(refreshToken: string): Promise<TokenResponseDto> {
    let payload: JwtPayload;

    try {
      payload = await this.jwtService.verifyAsync<JwtPayload>(refreshToken, {
        secret: this.jwtSecret,
      });
    } catch {
      throw new UnauthorizedException(
        'Token de rafraîchissement invalide ou expiré.',
      );
    }

    if (payload.type !== 'refresh') {
      throw new UnauthorizedException(
        'Type de token invalide. Un token de rafraîchissement est requis.',
      );
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user) {
      throw new UnauthorizedException(
        'Utilisateur introuvable. Le compte a peut-être été supprimé.',
      );
    }

    if (!user.isActive) {
      throw new UnauthorizedException(
        'Compte désactivé. Veuillez contacter l\'administrateur.',
      );
    }

    this.logger.log(`Token rafraîchi pour: ${user.phone}`);

    return this.login(user);
  }

  /**
   * Changes a user's password after verifying the old one.
   */
  async changePassword(
    userId: string,
    oldPassword: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('Utilisateur introuvable.');
    }

    const isOldPasswordValid = await bcrypt.compare(
      oldPassword,
      user.passwordHash,
    );

    if (!isOldPasswordValid) {
      throw new BadRequestException('L\'ancien mot de passe est incorrect.');
    }

    if (oldPassword === newPassword) {
      throw new BadRequestException(
        'Le nouveau mot de passe doit être différent de l\'ancien.',
      );
    }

    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    this.logger.log(`Mot de passe changé pour l'utilisateur: ${userId}`);

    return { message: 'Mot de passe changé avec succès.' };
  }

  /**
   * Parses a time expression like '15m', '1h', '7d' into seconds.
   */
  private parseExpirationToSeconds(expiration: string): number {
    const match = expiration.match(/^(\d+)(s|m|h|d)$/);
    if (!match) {
      return 900; // default: 15 minutes
    }

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case 's':
        return value;
      case 'm':
        return value * 60;
      case 'h':
        return value * 3600;
      case 'd':
        return value * 86400;
      default:
        return 900;
    }
  }
}
