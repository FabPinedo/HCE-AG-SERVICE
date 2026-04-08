import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { GatewayModule } from './gateway/gateway.module';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { KafkaLoggerModule } from './logger/kafka-logger.module';
import { LoggingInterceptor } from './logger/logging.interceptor';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{
      ttl:   Number(process.env.RATE_LIMIT_TTL  ?? 60) * 1000,
      limit: Number(process.env.RATE_LIMIT_MAX  ?? 100),
    }]),
    GatewayModule,
    KafkaLoggerModule,
  ],
  providers: [{ provide: APP_INTERCEPTOR, useClass: LoggingInterceptor }],
})
export class AppModule {}
