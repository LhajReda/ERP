import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import compression from 'compression';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Securite
  app.use(helmet());
  app.use(compression());
  app.enableCors({
    origin: process.env.APP_URL || 'http://localhost:3000',
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
  app.useGlobalInterceptors(new TransformInterceptor());

  // Prefix API
  app.setGlobalPrefix('api/v1');

  // Swagger
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

  const port = process.env.PORT || 4000;
  await app.listen(port);
  console.log(`FLA7A ERP API running on port ${port}`);
  console.log(`Swagger docs: http://localhost:${port}/api/docs`);
}
bootstrap();
