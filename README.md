# ag-pruebas-ag

> API Gateway generado por **Jarvis Platform** — 2/4/2026

Proxy inverso con rate limiting, CORS, SSL opcional y validación JWT local (sin llamada HTTP al Auth Service).

## Servicios proxiados

| Ruta | Variable env | Descripción |
|------|-------------|-------------|
| `/auth/*` | `AUTH_URL` | Redirige al Auth Service (`aa-pruebas-auth`) |

## Endpoints propios

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/health` | Health check — verifica conectividad con todos los servicios |
| GET | `/` | Info del gateway (deshabilitado en `NODE_ENV=production`) |

## Variables de entorno

| Variable | Requerida | Default | Descripción |
|----------|:---------:|---------|-------------|
| `PORT` | — | `10401` | Puerto HTTP |
| `NODE_ENV` | — | `development` | Entorno (`development` / `production`) |
| `ALLOWED_ORIGINS` | — | — | Orígenes CORS permitidos (coma-separados). En `development` se acepta cualquier origen |
| `RATE_LIMIT_TTL` | — | `60` | Ventana de rate limiting en segundos |
| `RATE_LIMIT_MAX` | — | `100` | Máximo de requests por ventana por IP |
| `REQUEST_TIMEOUT` | — | `120000` | Timeout de requests HTTP salientes en ms |
| `JWT_SECRET` | ✓ | — | Mismo valor que `JWT_SECRET` del Auth Service — el gateway valida el token **localmente** con `jsonwebtoken` sin llamar al Auth Service |
| `AUTH_URL` | ✓ | — | URL base del Auth Service — usada para **proxy** de rutas `/auth/*` |
| `USE_SSL` | — | `false` | `true` activa el servidor HTTPS adicional |
| `SSL_PORT` | — | `20401` | Puerto HTTPS (solo si `USE_SSL=true`) |
| `CERT_PATH` | — | `/app/certs` | Ruta a los certificados SSL (`server.crt` + `server.key` o `server.pfx`) |
| `SERVER_NAME` | — | — | Nombre del servidor para certificados PFX con múltiples entradas |
| `KAFKA_BROKER` | — | `localhost:9092` | Broker(s) Kafka (coma-separados) |
| `KAFKA_TOPIC` | — | `platform.logs` | Topic donde se publican eventos de gateway |

> **Nota sobre validación JWT (S6):** El guard usa `jsonwebtoken` directamente con `JWT_SECRET`.
> Si el usuario hace logout, la cookie se elimina en el cliente pero el token sigue siendo criptográficamente
> válido hasta que expire (`JWT_EXPIRES_IN`, default 4h). Esto es aceptable con TTL corto y
> cookie `httpOnly` eliminada al logout.

## Rate Limiting

- Ventana: `RATE_LIMIT_TTL` segundos (default 60s)
- Máximo: `RATE_LIMIT_MAX` requests por IP (default 100)
- Respuesta al exceder: `429 Too Many Requests`

## SSL

- `USE_SSL=true` levanta un servidor HTTPS adicional en `SSL_PORT` (el HTTP sigue activo)
- Formatos soportados: `server.crt` + `server.key`, o `server.pfx`
- Certificados en la ruta definida por `CERT_PATH`
- `SSL_VERIFY=false` en el Auth Service si usa certificado autofirmado internamente

## Path traversal

El gateway rechaza con `400` cualquier URL que contenga `..` o `%2e%2e`
antes de hacer el proxy al servicio upstream.

## Instalación

```bash
npm install
cp .env.example .env
# Completar AUTH_URL y AUTH_SERVICE_URL con la URL del aa-pruebas-auth
npm run start:dev
```
