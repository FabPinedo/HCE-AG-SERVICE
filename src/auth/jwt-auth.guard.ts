import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';

/**
 * S6 — Valida el JWT localmente sin llamar al Auth Service.
 *
 * Ventajas respecto al approach anterior (HTTP /auth/validate):
 *  - Sin latencia de red por request
 *  - El gateway no queda bloqueado si el Auth Service está caído
 *  - Escala horizontalmente sin dependencia
 *
 * Trade-off: un token revocado (logout) sigue siendo válido hasta que expira.
 * Mitigación: JWT_EXPIRES_IN corto (4h) + cookie httpOnly eliminada en logout.
 *
 * Requiere: JWT_SECRET igual al configurado en aa-pruebas-auth.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  private readonly secret: string;

  constructor(cfg: ConfigService) {
    this.secret = cfg.get<string>('JWT_SECRET', '');
  }

  canActivate(context: ExecutionContext): boolean {
    const req         = context.switchToHttp().getRequest();
    const cookieToken = req.cookies?.['access_token'] as string | undefined;
    const authHeader  = req.headers['authorization'] as string | undefined;

    const token = cookieToken
      ?? (authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : undefined);

    if (!token) throw new UnauthorizedException('Token requerido');
    if (!this.secret) throw new UnauthorizedException('JWT_SECRET no configurado en el gateway');

    try {
      const decoded = jwt.verify(token, this.secret) as Record<string, any>;
      req.user = {
        sub:            decoded['sub'],
        username:       decoded['username'],
        email:          decoded['email'],
        roles:          decoded['roles'],
        sessionId:      decoded['sessionId'],
        nombreCompleto: decoded['nombreCompleto'],
      };
      return true;
    } catch {
      throw new UnauthorizedException('Token inválido o expirado');
    }
  }
}
