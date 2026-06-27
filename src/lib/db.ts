import { PrismaClient } from "@prisma/client";

// Singleton pattern to prevent multiple PrismaClient instances in development
// (Next.js hot-reload would otherwise create a new client on every reload)
const globalWithPrisma = global as typeof globalThis & {
  prisma?: PrismaClient;
};

const prisma =
  globalWithPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalWithPrisma.prisma = prisma;
}

export { prisma };
