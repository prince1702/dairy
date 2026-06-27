import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

let prisma: PrismaClient;

if (process.env.NODE_ENV === "production") {
  const adapter = new PrismaBetterSqlite3({ url: "file:./dev.db" });
  prisma = new PrismaClient({ adapter });
} else {
  // Prevent multiple instances of Prisma Client in development
  const globalWithPrisma = global as typeof globalThis & {
    prisma?: PrismaClient;
  };
  if (!globalWithPrisma.prisma) {
    const adapter = new PrismaBetterSqlite3({ url: "file:./dev.db" });
    globalWithPrisma.prisma = new PrismaClient({ adapter });
  }
  prisma = globalWithPrisma.prisma;
}

export { prisma };
