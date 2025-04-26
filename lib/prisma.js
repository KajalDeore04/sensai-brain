import { PrismaClient } from "@prisma/client";

export const db = globalThis.prisma || new PrismaClient();

if(process.env.NODE_ENV !== "production") {
  globalThis.prisma = db;
}

// globalThis.prisma: this global var ensures that prisma client instance is reused across hot reloads in development. without this , each time your app reloads, a new prisma client instance is created which can lead to memory leaks and performance issues.