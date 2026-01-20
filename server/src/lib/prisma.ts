import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'
import config from "@/config";

let globalForPrisma = global as unknown as { prisma?: PrismaClient, adapter?: PrismaPg };
const adapter = globalForPrisma?.adapter ?? new PrismaPg({ connectionString: config.databaseUrl });
const prisma = globalForPrisma?.prisma ?? new PrismaClient({ adapter })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma = { adapter, prisma }
}

export { prisma };