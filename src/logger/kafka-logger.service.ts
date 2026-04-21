import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Kafka, Producer, logLevel } from 'kafkajs';

@Injectable()
export class KafkaLoggerService implements OnModuleInit, OnModuleDestroy {
  private producer!: Producer;

  constructor(private readonly cfg: ConfigService) {}

  async onModuleInit() {
    const kafka = new Kafka({
      clientId: 'gateway-logger',
      brokers: (this.cfg.get<string>('KAFKA_BROKER', 'localhost:9092')).split(','),
      logLevel: logLevel.ERROR,
    });
    this.producer = kafka.producer();
    try {
      await this.producer.connect();
    } catch {
      // Kafka unavailable on startup — logs silently dropped until reconnect
    }
  }

  async onModuleDestroy() {
    await this.producer.disconnect();
  }

  async publishLog(entry: Record<string, any>): Promise<void> {
    try {
      await this.producer.send({
        topic: this.cfg.get<string>('KAFKA_TOPIC', 'platform.logs'),
        messages: [{ value: JSON.stringify(entry) }],
      });
    } catch {
      // Fire and forget — nunca bloquea el request
    }
  }
}
