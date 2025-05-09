// src/routes/healthcheck/+server.ts
import { prisma } from "../../../prisma/Prisma"

export const GET = async () => {
  try {
    /* Проверяем доступность БД */
    await prisma.$queryRaw`SELECT 1`;
    return new Response(JSON.stringify({ status: "ok", db: "connected" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })
  } catch {
    return new Response(JSON.stringify({ status: "error", db: "down" }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    })
  }
}
