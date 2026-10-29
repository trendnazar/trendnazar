import { PrismaClient } from '@prisma/client'
import path from 'path'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// SQLite db da absolute path — serverless bundle ch vi sahi chale
const databaseUrl =
  process.env.DATABASE_URL ?? `file:${path.join(process.cwd(), 'db', 'custom.db')}`

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['query'],
    datasourceUrl: databaseUrl,
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
