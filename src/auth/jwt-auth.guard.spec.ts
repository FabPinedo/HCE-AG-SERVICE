import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ConfigService }                           from '@nestjs/config';
import * as jwt                                    from 'jsonwebtoken';
import { JwtAuthGuard }                            from './jwt-auth.guard';

// ── Helpers ───────────────────────────────────────────────────────────────────

const SECRET = 'test-secret-32-chars-padding-xxxx';

function makeCfg(secret = SECRET): ConfigService {
  return { get: (k: string, d = '') => k === 'JWT_SECRET' ? secret : d } as any;
}

function makeToken(payload: object, secret = SECRET, opts?: jwt.SignOptions): string {
  return jwt.sign(payload, secret, opts);
}

function makeContext(overrides: {
  cookies?:     Record<string, string>;
  headers?:     Record<string, string>;
} = {}): ExecutionContext {
  const req: any = {
    cookies: overrides.cookies ?? {},
    headers: overrides.headers ?? {},
    user:    undefined,
  };
  return {
    switchToHttp: () => ({ getRequest: () => req }),
  } as any;
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('JwtAuthGuard', () => {

  describe('canActivate() — token válido', () => {
    it('acepta token en cookie access_token y popula req.user', () => {
      const payload = {
        sub: 'u1', username: 'JPEREZ', email: 'j@x.com',
        roles: ['12'], sessionId: 'sess-1', nombreCompleto: 'Juan Pérez',
      };
      const token = makeToken(payload);
      const guard = new JwtAuthGuard(makeCfg());
      const ctx   = makeContext({ cookies: { access_token: token } });

      const result = guard.canActivate(ctx);
      const req    = ctx.switchToHttp().getRequest();

      expect(result).toBe(true);
      expect(req.user.sub).toBe('u1');
      expect(req.user.username).toBe('JPEREZ');
      expect(req.user.sessionId).toBe('sess-1');
      expect(req.user.nombreCompleto).toBe('Juan Pérez');
    });

    it('acepta token en Authorization: Bearer <token>', () => {
      const token = makeToken({ sub: 'u2', username: 'MLOPEZ', email: '', roles: [], sessionId: 's2', nombreCompleto: '' });
      const guard = new JwtAuthGuard(makeCfg());
      const ctx   = makeContext({ headers: { authorization: `Bearer ${token}` } });

      expect(guard.canActivate(ctx)).toBe(true);
      expect(ctx.switchToHttp().getRequest().user.sub).toBe('u2');
    });

    it('cookie tiene prioridad sobre Authorization header', () => {
      const cookiePayload = { sub: 'cookie-user', username: 'A', email: '', roles: [], sessionId: 's', nombreCompleto: '' };
      const bearerPayload = { sub: 'bearer-user', username: 'B', email: '', roles: [], sessionId: 's', nombreCompleto: '' };
      const cookieTok = makeToken(cookiePayload);
      const bearerTok = makeToken(bearerPayload);
      const guard = new JwtAuthGuard(makeCfg());
      const ctx   = makeContext({
        cookies: { access_token: cookieTok },
        headers: { authorization: `Bearer ${bearerTok}` },
      });

      guard.canActivate(ctx);
      expect(ctx.switchToHttp().getRequest().user.sub).toBe('cookie-user');
    });
  });

  describe('canActivate() — errores', () => {
    it('sin token → lanza UnauthorizedException', () => {
      const guard = new JwtAuthGuard(makeCfg());
      const ctx   = makeContext();
      expect(() => guard.canActivate(ctx)).toThrow(UnauthorizedException);
    });

    it('sin JWT_SECRET configurado → lanza UnauthorizedException', () => {
      const token = makeToken({ sub: 'u1' });
      const guard = new JwtAuthGuard(makeCfg(''));   // secret vacío
      const ctx   = makeContext({ cookies: { access_token: token } });
      expect(() => guard.canActivate(ctx)).toThrow(UnauthorizedException);
    });

    it('token firmado con secreto diferente → lanza UnauthorizedException', () => {
      const token = makeToken({ sub: 'u1' }, 'otro-secreto-diferente-32-chars-xxx');
      const guard = new JwtAuthGuard(makeCfg(SECRET));
      const ctx   = makeContext({ cookies: { access_token: token } });
      expect(() => guard.canActivate(ctx)).toThrow(UnauthorizedException);
    });

    it('token expirado → lanza UnauthorizedException', () => {
      const token = makeToken({ sub: 'u1' }, SECRET, { expiresIn: -1 });
      const guard = new JwtAuthGuard(makeCfg());
      const ctx   = makeContext({ cookies: { access_token: token } });
      expect(() => guard.canActivate(ctx)).toThrow(UnauthorizedException);
    });

    it('token malformado (basura) → lanza UnauthorizedException', () => {
      const guard = new JwtAuthGuard(makeCfg());
      const ctx   = makeContext({ cookies: { access_token: 'not.a.jwt' } });
      expect(() => guard.canActivate(ctx)).toThrow(UnauthorizedException);
    });

    it('Authorization header sin prefijo Bearer → lanza UnauthorizedException', () => {
      const token = makeToken({ sub: 'u1' });
      const guard = new JwtAuthGuard(makeCfg());
      // sin "Bearer " → el token no se extrae → no hay token
      const ctx   = makeContext({ headers: { authorization: token } });
      expect(() => guard.canActivate(ctx)).toThrow(UnauthorizedException);
    });
  });
});
