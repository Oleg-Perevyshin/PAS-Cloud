// $lib/Prisma.ts
// Вынесено отдельно, чтоб не создавать много подключений к БД
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
export { prisma }
