import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL is required when the database runtime is enabled.");
  }

  const adapter = new PrismaPg({ connectionString });

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

export function getPrismaClient() {
  return createPrismaClient();
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, property, receiver) {
    return Reflect.get(getPrismaClient(), property, receiver);
  },
});

export function isDatabaseConfigured() {
  const databaseUrl = process.env.DATABASE_URL?.trim();

  if (!databaseUrl || process.env.DATABASE_RUNTIME_ENABLED !== "true") {
    return false;
  }

  return !/USER:PASSWORD|user:password|USERNAME:PASSWORD/i.test(databaseUrl);
}
