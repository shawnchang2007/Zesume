import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { cache } from "react";

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL is required when the database runtime is enabled.");
  }

  const adapter = new PrismaPg({
    connectionString,
    max: 1,
    maxUses: 100,
    idleTimeoutMillis: 5_000,
  });

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

export const getPrismaClient = cache(createPrismaClient);

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, property, _receiver) {
    const client = getPrismaClient();
    const value = Reflect.get(client, property, client);

    return typeof value === "function" ? value.bind(client) : value;
  },
});

export function isDatabaseConfigured() {
  const databaseUrl = process.env.DATABASE_URL?.trim();

  if (!databaseUrl || process.env.DATABASE_RUNTIME_ENABLED !== "true") {
    return false;
  }

  return !/USER:PASSWORD|user:password|USERNAME:PASSWORD/i.test(databaseUrl);
}
