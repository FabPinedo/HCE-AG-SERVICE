import { NestFactory }    from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule }      from './app.module';
import { json, urlencoded } from 'express';
import * as http   from 'http';
import * as https  from 'https';
import * as cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { buildHttpsOptions } from './ssl/ssl-config.util';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { logger: ['log', 'warn', 'error'] });

  app.use(helmet());
  app.use(cookieParser());
  app.use(json({ limit: '10mb' }));
  app.use(urlencoded({ extended: true, limit: '10mb' }));
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));

  const origins = process.env.ALLOWED_ORIGINS;
  app.enableCors({
    origin:         process.env.NODE_ENV === 'development' ? true : (origins ? origins.split(',') : false),
    methods:        ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials:    true,
  });

  await app.init();
  const expressApp = app.getHttpAdapter().getInstance();

  // ── HTTP siempre activo ──
  const port = Number(process.env.PORT ?? 10401);
  http.createServer(expressApp).listen(port, () => {
    console.log(`🚀 gw-pruebas-ag  HTTP  → http://localhost:${port}`);
  });

  // ── HTTPS si USE_SSL=true y hay certificados ──
  const httpsOptions = buildHttpsOptions();
  if (httpsOptions) {
    const sslPort = Number(process.env.SSL_PORT ?? 20401);
    try {
      https.createServer(httpsOptions, expressApp).listen(sslPort, () => {
        console.log(`🔒 gw-pruebas-ag  HTTPS → https://localhost:${sslPort}`);
      });
    } catch (e: any) {
      console.error('❌ Error al iniciar HTTPS:', e.message, '— solo HTTP activo');
    }
  }
}

bootstrap().catch(err => {
  console.error('Error fatal al iniciar el gateway:', err);
  process.exit(1);
});
