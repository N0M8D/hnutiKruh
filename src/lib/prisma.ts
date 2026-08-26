import { PrismaClient } from '@prisma/client';

// Sdílená instance PrismaClient. Bez tohohle by si v serverless prostředí
// (Vercel) mohl každý import vytvářet vlastní klienta a vyčerpat DB connections.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prisma;
}
