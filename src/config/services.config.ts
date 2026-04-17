/**
 * @deprecated Este archivo no está en uso. GatewayService construye su propio
 * svcMap en el constructor leyendo ConfigService. Si se necesita centralizar la
 * configuración de servicios, mover la lógica del constructor de GatewayService
 * aquí y proveerlo como ConfigFactory en GatewayModule.
 */
export const SERVICE_MAP: Record<string, string> = {
  '/auth': process.env.AUTH_URL ?? 'http://localhost:10101',
};
