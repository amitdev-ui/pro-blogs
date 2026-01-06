import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Add connection timeout to DATABASE_URL if not present
function getDatabaseUrl(): string {
  const url = process.env.DATABASE_URL || "";
  if (!url) return "";
  const sslAccept = process.env.MYSQL_SSL || ""; // e.g., "strict" or "accept_invalid_certs"
  const sslCert = process.env.MYSQL_SSL_CERT || ""; // relative to ./prisma folder
  let final = url;
  const hasQuery = final.includes("?");
  const qp = (key: string, value: string) => (hasQuery ? `&${key}=${value}` : `?${key}=${value}`);
  if (!final.includes("connect_timeout")) {
    final = `${final}${qp("connect_timeout", "5")}`;
  }
  if (sslAccept && !final.includes("sslaccept")) {
    final = `${final}${qp("sslaccept", sslAccept)}`;
  }
  if (sslCert && !final.includes("sslcert")) {
    final = `${final}${qp("sslcert", sslCert)}`;
  }
  return final;
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

