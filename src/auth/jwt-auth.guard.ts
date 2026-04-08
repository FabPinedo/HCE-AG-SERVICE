import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly http:   HttpService,
    private readonly config: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req        = context.switchToHttp().getRequest();
    const authHeader = req.headers['authorization'] as string | undefined;
    const cookieToken = req.cookies?.['access_token'] as string | undefined;

    // Acepta token desde cookie httpOnly o desde Authorization header
    const token = cookieToken ?? (authHeader?.startsWith('Bearer ') ? authHeader.replace('Bearer ', '').trim() : null);
    if (!token) throw new UnauthorizedException('Token requerido');

    const authUrl = this.config.get<string>('AUTH_SERVICE_URL', 'http://localhost:10101');
    try {
      const r = await firstValueFrom(
        this.http.post(
          `${authUrl}/auth/validate`,
          {},
          { headers: { Authorization: `Bearer ${token}` } },
        ),
      );
      if (r.data?.success) { req.user = r.data.data; return true; }
    } catch {}
    throw new UnauthorizedException('Token inválido o expirado');
  }
}
