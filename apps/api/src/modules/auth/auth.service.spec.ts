import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';

jest.mock('bcryptjs');

describe('AuthService', () => {
  let service: AuthService;
  let prisma: any;
  let jwtService: any;

  const mockUser = {
    id: 'user-1',
    phone: '+212661000001',
    email: 'admin@fla7a.ma',
    passwordHash: '$2b$12$hashedpassword',
    firstName: 'Mohammed',
    lastName: 'El Fassi',
    role: 'ADMIN',
    language: 'fr',
    tenantId: 'tenant-1',
    isActive: true,
    cin: 'AB123456',
  };

  beforeEach(async () => {
    prisma = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        count: jest.fn().mockResolvedValue(2),
      },
      tenant: {
        findUnique: jest.fn().mockResolvedValue({ id: 'tenant-1', isActive: true, maxUsers: 50 }),
      },
    };

    jwtService = {
      signAsync: jest.fn().mockResolvedValue('mock-jwt-token'),
      verifyAsync: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwtService },
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: jest.fn().mockReturnValue('jwt-secret-key'),
            get: jest.fn().mockReturnValue('15m'),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('validateUser', () => {
    it('should return user when credentials are valid', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.validateUser('+212661000001', 'Fla7a@2025');
      expect(result).toBeDefined();
      expect(result.id).toBe('user-1');
      expect(result.passwordHash).toBeUndefined();
    });

    it('should return null when phone not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      const result = await service.validateUser('+212999999999', 'password');
      expect(result).toBeNull();
    });

    it('should return null when password is wrong', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await service.validateUser('+212661000001', 'wrongpassword');
      expect(result).toBeNull();
    });

    it('should throw UnauthorizedException when account is deactivated', async () => {
      prisma.user.findUnique.mockResolvedValue({ ...mockUser, isActive: false });
      await expect(service.validateUser('+212661000001', 'Fla7a@2025')).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('login', () => {
    it('should return tokens and user info', async () => {
      prisma.user.update.mockResolvedValue(mockUser);
      const result = await service.login(mockUser);

      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      expect(result.user.id).toBe('user-1');
      expect(result.expiresIn).toBe(900); // 15m = 900s
    });

    it('should update lastLogin timestamp', async () => {
      prisma.user.update.mockResolvedValue(mockUser);
      await service.login(mockUser);

      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'user-1' },
          data: { lastLogin: expect.any(Date) },
        }),
      );
    });
  });

  describe('register', () => {
    it('should reject duplicate phone numbers', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      const dto = { phone: '+212661000001', password: 'Test@123', firstName: 'Test', lastName: 'User' };
      await expect(service.register(dto as any, 'tenant-1')).rejects.toThrow(ConflictException);
    });

    it('should reject when tenant is full', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.tenant.findUnique.mockResolvedValue({ id: 'tenant-1', isActive: true, maxUsers: 2 });
      prisma.user.count.mockResolvedValue(2);

      const dto = { phone: '+212661999999', password: 'Test@123', firstName: 'Test', lastName: 'User' };
      await expect(service.register(dto as any, 'tenant-1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('changePassword', () => {
    it('should reject when old password is wrong', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.changePassword('user-1', 'wrong', 'newpass')).rejects.toThrow(BadRequestException);
    });

    it('should reject when new password is same as old', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await expect(service.changePassword('user-1', 'same', 'same')).rejects.toThrow(BadRequestException);
    });
  });
});
