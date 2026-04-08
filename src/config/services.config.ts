// services.config.ts — URLs de servicios backend
export const SERVICE_MAP: Record<string, string> = {
  '/auth': process.env.AUTH_URL ?? 'http://localhost:10101',
};
