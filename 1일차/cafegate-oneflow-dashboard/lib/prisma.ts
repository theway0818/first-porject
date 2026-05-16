import { PrismaNeonHttp } from "@prisma/adapter-neon";
import { PrismaClient } from "@/app/generated/prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function createPrismaClient() {
  const url = process.env.DATABASE_URL?.replace(/\s/g, "");
  if (!url) {
    throw new Error(
      "DATABASE_URL이 설정되지 않았습니다. .env.local에 Neon/Postgres 연결 문자열을 추가해주세요."
    );
  }
  const adapter = new PrismaNeonHttp(url, {});
  return new PrismaClient({ adapter });
}

function getPrisma(): PrismaClient {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClient();
  }
  return globalForPrisma.prisma;
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getPrisma();
    return Reflect.get(client, prop, client);
  },
});
