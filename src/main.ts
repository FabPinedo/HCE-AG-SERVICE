import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { json, urlencoded } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const useSSL = process.env.USE_SSL === 'true';
  const port   = useSSL
    ? Number(process.env.SSL_PORT  ?? 20100)
    : Number(process.env.PORT      ?? 10100);

  let httpsOptions: any = undefined;
  if (useSSL) {
    const certDir = process.env.CERT_PATH ?? '/app/certs';
    try {
      httpsOptions = {
        key:  fs.readFileSync(path.join(certDir, 'server.key')),
        cert: fs.readFileSync(path.join(certDir, 'server.crt')),
      };
    } catch {
      if (process.env.NODE_ENV === 'production') {
        console.error('FATAL: SSL certificates not found at', certDir);
        process.exit(1);
      } else {
        console.warn('WARNING: SSL certificates not found — running without HTTPS');
      }
    }
  }

  const app = await NestFactory.create(AppModule, httpsOptions ? { httpsOptions } : {});

  const origins = process.env.ALLOWED_ORIGINS;
  app.enableCors({
    origin: process.env.NODE_ENV === 'development'
      ? true
      : (origins ? origins.split(',') : false),
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true,
  });

  app.use(cookieParser());
  app.use(json({ limit: '10mb' }));
  app.use(urlencoded({ extended: true, limit: '10mb' }));

  await app.listen(port);
  console.log(`🚀 gw-pruebas-ag on ${useSSL ? 'https' : 'http'}://localhost:${port}`);
}
bootstrap();
