// src/routes/api/news_list/+server.ts

import type { RequestHandler } from '@sveltejs/kit'
import { prisma } from '../../../../prisma/Prisma'
import { ResponseManager } from '$lib/utils/ResponseManager'
import { ValidateUser } from '$lib/utils/ValidateRequest'
import { FormatDate } from '$lib/utils/Common'

export const GET: RequestHandler = async (event) => {
  /* Получаем язык, проверяем токены запросившего пользователя и активацию аккаунте */
  const { lang, requester_user, status } = await ValidateUser(event)
  if (!requester_user || status === 401) {
    return new Response(JSON.stringify(ResponseManager('ER_USER_UNAUTHORIZED', lang)), { status })
  }

  try {
    /* Извлекаем UserID из параметров запроса */
    const UserID = event.url.searchParams.get('UserID')

    /* Проверяем права доступа */
    const hasAccess = requester_user.Role === 'MANAGER' || requester_user.Role === 'ADMIN'
    if (UserID && requester_user.UserID !== UserID && !hasAccess) {
      return new Response(JSON.stringify(ResponseManager('ER_USER_FORBIDDEN', lang)), { status: 403 })
    }

    /* Получаем параметр даты фильтрации из запроса */
    const updatedAfter = event.url.searchParams.get('updatedAfter')
    const updatedBefore = event.url.searchParams.get('updatedBefore')

    /* Формируем условия фильтрации */
    const filterConditions = {
      where: {
        ...(UserID ? { UserID } : {}),
        ...(updatedAfter && { Updated: { gte: new Date(updatedAfter) } }),
        ...(updatedBefore && { Updated: { lte: new Date(updatedBefore) } }),
        ...(hasAccess ? {} : { Published: true }),
      },
      orderBy: {
        Updated: 'desc' as const,
      },
      include: {
        Author: {
          select: {
            NickName: true,
            Avatar: true,
            FirstName: true,
            LastName: true,
            EMail: true,
          },
        },
      },
    }

    /* Получаем новости пользователя с учетом фильтрации */
    const userNews = await prisma.news.findMany(filterConditions)

    /* Формируем ответ с массивом новостей */
    const response = {
      news_list: userNews.map((news) => ({
        NewsID: news.NewsID,
        UserID: news.UserID || '',
        Title: news.Title,
        Brief: news.Brief,
        Content: news.Content,
        ImageTitle: news.ImageTitle,
        ImageContent: news.ImageContent,
        Published: news.Published,
        Author: news.Author,
        Created: FormatDate(news.Created.toISOString()),
        Updated: FormatDate(news.Updated.toISOString()),
      })),
    }
    return new Response(JSON.stringify(ResponseManager('OK_NEWS_LIST', lang, response)), { status: 200 })
  } catch (error) {
    console.error('Ошибка news_list', error)
    return new Response(JSON.stringify(ResponseManager('ER_NEWS_LIST', lang)), { status: 500 })
  }
}
