import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import fs from "fs";
import path from "path";

let prisma: PrismaClient;

if (process.env.NODE_ENV === "production" && process.env.VERCEL === "1") {
  const dbPath = "/tmp/dev.db";

  // Copy pre-populated dev.db to writable /tmp if it doesn't exist yet
  if (!fs.existsSync(dbPath)) {
    try {
      const dbDir = path.dirname(dbPath);
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
      }

      const bundledDbPath = path.join(process.cwd(), "dev.db");
      if (fs.existsSync(bundledDbPath)) {
        fs.copyFileSync(bundledDbPath, dbPath);
        console.log("Database successfully copied to /tmp/dev.db");
      } else {
        console.error("Bundled dev.db not found at:", bundledDbPath);
      }
    } catch (error) {
      console.error("Failed to copy database to /tmp:", error);
    }
  }

  const adapter = new PrismaBetterSqlite3({ url: `file:${dbPath}` });
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
