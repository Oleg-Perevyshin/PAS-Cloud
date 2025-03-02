// $lib/utils/ServerUtils.ts
import { prisma } from '../Prisma'
import { Prisma } from '@prisma/client'

/**
 * Метод генерации уникального идентификатора
 * @param {('news' | 'user')} model - название модели Prisma для проверки уникальности
 * @param {number} blocks - количество блоков в идентификаторе
 * @param {number} charsPerBlock - количество символов в каждом блоке
 * @returns {Promise<string>} - возвращает уникальный идентификатор
 * @throws {Error} - если не удается сгенерировать уникальный идентификатор за 100 попыток
 */
export async function GenerateUniqueID(model: 'news' | 'user' | 'group' | 'chat_message', blocks: number, charsPerBlock: number): Promise<string> {
  const characters = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  let attempts = 0
  let newID: string

  while (attempts < 100) {
    newID = Array.from({ length: blocks }, () =>
      Array.from({ length: charsPerBlock }, () => characters[Math.floor(Math.random() * characters.length)]).join(''),
    ).join('-')

    /* Создаем объект where с правильным типом */
    let where:
      | Prisma.NewsWhereUniqueInput
      | Prisma.UserWhereUniqueInput
      | Prisma.DeviceWhereUniqueInput
      | Prisma.GroupWhereUniqueInput
      | Prisma.GroupMessageWhereUniqueInput
    if (model === 'news') {
      where = { NewsID: newID }
      const exists = await prisma.news.findUnique({ where })
      if (!exists) return newID
    } else if (model === 'user') {
      where = { UserID: newID }
      const exists = await prisma.user.findUnique({ where })
      if (!exists) return newID
    } else if (model === 'group') {
      where = { GroupID: newID }
      const exists = await prisma.group.findUnique({ where })
      if (!exists) return newID
    } else if (model === 'chat_message') {
      where = { MessageID: newID }
      const exists = await prisma.groupMessage.findUnique({ where })
      if (!exists) return newID
    } else {
      throw new Error(`Неверная модель`)
    }

    attempts++
  }
  throw new Error(`Не удалось сгенерировать уникальный ID для модели ${model} после 100 попыток`)
}

/**
 * Метод проверки E-Mail на валидность
 * @param {string} email - E-Mail
 */
export function ValidateEmail(email: string) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    throw new Error('Неверный формат E-Mail')
  }
  return true
}

/**
 * Метод проверки пароля
 * @param {string} password - пароль
 */
export function ValidatePassword(password: string) {
  if (!password || password.length < 6 || password.length > 32) {
    throw new Error('Пароль должен быть от 6 до 32 символов')
  }
  const hasLetter = /[a-zA-Z]/.test(password)
  const hasDigit = /\d/.test(password)
  if (!hasLetter || !hasDigit) {
    throw new Error('Пароль должен содержать как минимум одну букву и одну цифру')
  }
  return true
}
