import { Controller, All, Get, Req, Res, UseGuards } from '@nestjs/common';
import { Request, Response } from 'express';
import { ThrottlerGuard } from '@nestjs/throttler';
import { GatewayService } from './gateway.service';

@Controller()
@UseGuards(ThrottlerGuard)
export class GatewayController {
  constructor(private readonly gatewayService: GatewayService) {}

  @All('auth/*')
  async proxyAuth(@Req() req: Request, @Res() res: Response) {
    return this.gatewayService.proxyRequest(req, res, 'auth');
  }

  @Get('health')
  async health() {
    return this.gatewayService.healthCheck();
  }

  @Get()
  info() {
    return {
      service: 'gw-pruebas-ag',
      type: 'API Gateway',
      timestamp: new Date().toISOString(),
      routes: ['/auth'],
    };
  }
}
