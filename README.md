# gw-pruebas-ag

> API Gateway generado por **Jarvis Platform** — 2/4/2026

## Servicios proxiados

| Ruta | URL Backend | Protección |
|------|-------------|------------|
| /auth | http://localhost:10101 | Público |

## Rate Limiting
- Ventana: **60s** | Máx requests: **100**

## SSL
- `USE_SSL=true` activa HTTPS en el puerto `SSL_PORT`
- Coloca `server.key` y `server.crt` en la ruta definida por `CERT_PATH` (default: `/app/certs`)

## Instalación

```bash
npm install
cp .env.example .env
npm run start:dev
```
