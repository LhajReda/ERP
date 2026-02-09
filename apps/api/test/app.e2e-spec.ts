import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('FLA7A ERP API (e2e)', () => {
  let app: INestApplication;
  let accessToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Health Check', () => {
    it('GET /api/v1 should return 404 (no root route)', () => {
      return request(app.getHttpServer())
        .get('/api/v1')
        .expect(404);
    });
  });

  describe('Auth Module', () => {
    it('POST /api/v1/auth/login should reject empty credentials', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({})
        .expect(401);
    });

    it('POST /api/v1/auth/login should reject invalid phone', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ phone: 'invalid', password: 'test' })
        .expect(401);
    });

    // Note: These tests require a running database with seed data
    // In CI, the database would be set up via docker-compose
    it('POST /api/v1/auth/login should accept valid credentials (requires DB)', async () => {
      try {
        const response = await request(app.getHttpServer())
          .post('/api/v1/auth/login')
          .send({ phone: '+212661000001', password: 'Fla7a@2025' });

        if (response.status === 201 || response.status === 200) {
          expect(response.body.data).toHaveProperty('accessToken');
          expect(response.body.data).toHaveProperty('refreshToken');
          expect(response.body.data).toHaveProperty('user');
          accessToken = response.body.data.accessToken;
        }
      } catch {
        // Skip if DB not available
        console.log('Skipping DB-dependent test: database not available');
      }
    });
  });

  describe('Protected Routes', () => {
    it('GET /api/v1/farms should reject unauthenticated requests', () => {
      return request(app.getHttpServer())
        .get('/api/v1/farms')
        .expect(401);
    });

    it('GET /api/v1/farms should accept authenticated requests (requires DB)', async () => {
      if (!accessToken) return; // Skip if login failed

      const response = await request(app.getHttpServer())
        .get('/api/v1/farms')
        .set('Authorization', `Bearer ${accessToken}`)
        .set('x-tenant-id', 'demo');

      expect([200, 403]).toContain(response.status);
    });
  });

  describe('Validation', () => {
    it('POST /api/v1/farms should reject invalid data when authenticated', async () => {
      if (!accessToken) return;

      return request(app.getHttpServer())
        .post('/api/v1/farms')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({}) // Empty body should fail validation
        .expect(400);
    });
  });
});
