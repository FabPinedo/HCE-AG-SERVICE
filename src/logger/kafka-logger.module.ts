import { Module } from '@nestjs/common';
import { KafkaLoggerService } from './kafka-logger.service';
import { LoggingInterceptor } from './logging.interceptor';

@Module({
  providers: [KafkaLoggerService, LoggingInterceptor],
  exports:   [KafkaLoggerService, LoggingInterceptor],
})
export class KafkaLoggerModule {}
