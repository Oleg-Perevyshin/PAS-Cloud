// src/routes/api/news_delete/+server.ts

import type { RequestHandler } from '@sveltejs/kit'
import { prisma } from '../../../../prisma/Prisma'
import { ResponseManager } from '$lib/utils/ResponseManager'
import { ValidateUser } from '$lib/utils/ValidateRequest'

export const DELETE: RequestHandler = async (event) => {
  /* Получаем язык, проверяем токены запросившего пользователя и активацию аккаунте */
  const { lang, requester_user, status } = await ValidateUser(event)
  if (!requester_user || status === 401) {
    return new Response(JSON.stringify(ResponseManager('ER_USER_UNAUTHORIZED', lang)), { status })
  }

  try {
    /* Получаем тело запроса и проверяем наличие полей UserID, DevSN */
    const body = await event.request.json()
    const { UserID, NewsID } = body
    if (!UserID || !NewsID) {
      return new Response(JSON.stringify(ResponseManager('ER_QUERY_DATA', lang)), { status: 400 })
    }

    /* Проверяем, существует ли пользователь с указанным UserID в базе данных */
    const requested_user = await prisma.user.findUnique({
      where: { UserID },
      include: { News: true },
    })
    if (!requested_user) {
      return new Response(JSON.stringify(ResponseManager('ER_USER_NOT_FOUND', lang)), { status: 404 })
    }

    /* Проверяем права доступа */
    const hasAccess = requester_user.UserID === requested_user.UserID || ['MANAGER', 'ADMIN'].includes(requester_user.Role)
    if (!hasAccess) {
      return new Response(JSON.stringify(ResponseManager('ER_USER_FORBIDDEN', lang)), { status: 403 })
    }

    /* Проверка существования новости перед удалением */
    const existingNews = await prisma.news.findUnique({ where: { NewsID } })
    if (!existingNews) {
      return new Response(JSON.stringify(ResponseManager('ER_NEWS_NOT_FOUND', lang)), { status: 404 })
    }

    /* Удаляем новость с указанным NewsID */
    const delete_user_news = await prisma.news.delete({ where: { NewsID } })
    if (!delete_user_news) {
      return new Response(JSON.stringify(ResponseManager('ER_NEWS_DELETE', lang)), { status: 500 })
    }

    return new Response(JSON.stringify(ResponseManager('OK_NEWS_DELETE', lang)), { status: 200 })
  } catch (error) {
    console.error('Ошибка news_delete', error)
    return new Response(JSON.stringify(ResponseManager('ER_NEWS_DELETE', lang)), { status: 500 })
  }
}
