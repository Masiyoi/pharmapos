import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api/v1');

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  // Allow all origins in development
  app.enableCors({ origin: '*', credentials: false });

  await app.listen(process.env.PORT || 3000);
  console.log(`🚀 PharmaPos API running on: http://localhost:${process.env.PORT || 3000}/api/v1`);
}
bootstrap();
