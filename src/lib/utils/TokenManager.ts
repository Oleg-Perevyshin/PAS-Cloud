// $lib/utils/TokenManager.ts
import { JWT_ACCESS_SECRET, JWT_ACCESS_EXPIRE, JWT_REFRESH_SECRET, JWT_REFRESH_EXPIRE } from '$env/static/private'
import jwt from 'jsonwebtoken'
import { prisma } from '$lib/Prisma'

/* Проверка токенов на уникальность или его отсутствие */
const isTokenUnique = async (token: string, isRefreshToken: boolean = false): Promise<boolean> => {
  try {
    const usersWithSameToken = await prisma.user.findMany({
      where: isRefreshToken ? { RefreshToken: token } : { AccessToken: token },
    })
    return usersWithSameToken.length === 0
  } catch (error) {
    throw new Error(
      `ERR isTokenUnique: Ошибка проверки токенов на уникальность: ${error instanceof Error ? error.message : error}`,
    )
  }
}

/* Генерируем уникальные Access и Refresh токены на основании UserID и EMail */
export const generateTokens = async (UserID: string, EMail: string) => {
  if (!UserID || !EMail) {
    console.error('ERR generateTokens: Нет входных данных для генерации токенов')
    return null
  }
  if (!JWT_ACCESS_SECRET || !JWT_REFRESH_SECRET) {
    throw new Error('ERR generateTokens: JWT ключи не найдены в файле .env')
  }
  const payload = { UserID, EMail }
  const maxAttempts = 5
  let attempts = 0

  while (attempts < maxAttempts) {
    try {
      const accessToken = jwt.sign(payload, JWT_ACCESS_SECRET, { expiresIn: Number(JWT_ACCESS_EXPIRE) })
      const refreshToken = jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: Number(JWT_REFRESH_EXPIRE) })

      const isAccessTokenUnique = await isTokenUnique(accessToken, false)
      const isRefreshTokenUnique = await isTokenUnique(refreshToken, true)

      if (isAccessTokenUnique && isRefreshTokenUnique) {
        return { accessToken, refreshToken }
      }
    } catch (error) {
      throw new Error(`ERR generateTokens: Ошибка генерации токенов: ${error instanceof Error ? error.message : error}`)
    }
    attempts++
  }
  console.error('ERR generateTokens: Сервер не создал уникальные токены')
  return null
}
