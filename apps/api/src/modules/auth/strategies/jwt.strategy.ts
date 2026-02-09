import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../../prisma/prisma.service';

export interface JwtPayload {
  sub: string;
  email: string | null;
  phone: string;
  role: string;
  tenantId: string;
  language: string;
  type: 'access' | 'refresh';
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload) {
    if (payload.type !== 'access') {
      throw new UnauthorizedException(
        'Type de token invalide. Un token d\'accès est requis.',
      );
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        phone: true,
        role: true,
        tenantId: true,
        language: true,
        isActive: true,
        firstName: true,
        lastName: true,
      },
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

    return {
      id: user.id,
      email: user.email,
      phone: user.phone,
      role: user.role,
      tenantId: user.tenantId,
      language: user.language,
      firstName: user.firstName,
      lastName: user.lastName,
    };
  }
}
