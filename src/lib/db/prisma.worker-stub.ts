const unavailableDatabase = new Proxy(
  {},
  {
    get() {
      throw new Error("DATABASE_RUNTIME_DISABLED");
    },
  },
);

export const prisma = unavailableDatabase as never;

export function getPrismaClient() {
  throw new Error("DATABASE_RUNTIME_DISABLED");
}

export function isDatabaseConfigured() {
  return false;
}
