import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Add connection timeout to DATABASE_URL if not present
function getDatabaseUrl(): string {
  const url = process.env.DATABASE_URL || "";
  if (!url) return "";
  
  // If URL already has query parameters, append to them
  if (url.includes("?")) {
    if (!url.includes("connect_timeout")) {
      return `${url}&connect_timeout=5`;
    }
    return url;
  } else {
    // Add query parameters
    return `${url}?connect_timeout=5`;
  }
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    datasources: {
      db: {
        url: getDatabaseUrl(),
      },
    },
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

