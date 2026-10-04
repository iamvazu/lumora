import { PrismaClient } from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var prismaApp: PrismaClient | undefined;
}

export const prisma =
  globalThis.prismaApp ||
  new PrismaClient({
    log: process.env['NODE_ENV'] === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env['NODE_ENV'] !== 'production') {
  globalThis.prismaApp = prisma;
}

export * from '@prisma/client';
