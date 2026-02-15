import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import compression from 'compression';
import { AppModule } from './app.module';
import { PrismaService } from './prisma/prisma.service';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { AuditLogInterceptor } from './common/interceptors/audit-log.interceptor';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { requestContextMiddleware } from './common/middleware/request-context.middleware';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const toPositiveInt = (raw: string | undefined, fallback: number): number => {
    const parsed = Number(raw);
    return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
  };
  const authRateLimitMax = toPositiveInt(process.env.AUTH_RATE_LIMIT_MAX, 50);
  const chatRateLimitMax = toPositiveInt(process.env.CHAT_RATE_LIMIT_MAX, 120);

  app.use(requestContextMiddleware);

  // Securite
  app.use(helmet());
  app.use(compression());
  // Rate limit for auth endpoints
  app.use(
    '/api/v1/auth',
    rateLimit({
      windowMs: 15 * 60 * 1000,
      max: authRateLimitMax,
      standardHeaders: true,
      legacyHeaders: false,
    }),
  );
  // Cost-control and abuse protection for AI chat endpoints.
  app.use(
    '/api/v1/chat',
    rateLimit({
      windowMs: 15 * 60 * 1000,
      max: chatRateLimitMax,
      standardHeaders: true,
      legacyHeaders: false,
    }),
  );
  const configuredOrigins =
    process.env.APP_URL?.split(',').map((origin) => origin.trim()).filter(Boolean) ?? [];
  const defaultOrigins = ['http://localhost:3000', 'http://localhost:3001'];
  const allowedOrigins = configuredOrigins.length > 0 ? configuredOrigins : defaultOrigins;
  const isDev = process.env.NODE_ENV !== 'production';

  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests without Origin header (e.g. curl/Postman).
      if (!origin) {
        callback(null, true);
        return;
      }

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      // In local development, accept any localhost port to avoid port-collision issues.
      if (isDev && /^https?:\/\/localhost:\d+$/.test(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  });

  // Validation globale
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Filtres et intercepteurs globaux
  app.useGlobalFilters(new HttpExceptionFilter());
  const prisma = app.get(PrismaService);
  app.useGlobalInterceptors(
    new TransformInterceptor(),
    new AuditLogInterceptor(prisma),
  );

  // Prefix API
  app.setGlobalPrefix('api/v1');

  // Swagger
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('FLA7A ERP API')
      .setDescription('API du systeme ERP agricole marocain FLA7A')
      .setVersion('1.0')
      .addBearerAuth()
      .addTag('Auth', 'Authentification et autorisation')
      .addTag('Farms', 'Gestion des exploitations agricoles')
      .addTag('Parcels', 'Gestion des parcelles')
      .addTag('Culture', 'Cycles de culture et activites')
      .addTag('Stock', 'Gestion des stocks et intrants')
      .addTag('Finance', 'Facturation et comptabilite')
      .addTag('HR', 'Ressources humaines et paie')
      .addTag('Sales', 'Ventes et clients')
      .addTag('Compliance', 'Conformite ONSSA et certifications')
      .addTag('Dashboard', 'Indicateurs et tableaux de bord')
      .addTag('AI Agents', 'Chat intelligent multi-agents')
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
  }

  const port = process.env.PORT || 4000;
  await app.listen(port);
  console.log(`FLA7A ERP API running on port ${port}`);
  console.log(`Swagger docs: http://localhost:${port}/api/docs`);
}
bootstrap();
