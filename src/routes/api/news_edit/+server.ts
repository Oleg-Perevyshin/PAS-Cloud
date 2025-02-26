// src/routes/api/news_edit/+server.ts

import type { RequestHandler } from '@sveltejs/kit'
import { prisma } from '$lib/Prisma'
import { ResponseManager } from '$lib/utils/ResponseManager'
import { ValidateUser } from '$lib/utils/ValidateRequest'
import { FormatDate } from '$lib/utils/Common'
import { GenerateUniqueID } from '$lib/utils/ServerUtils'

export const POST: RequestHandler = async (event) => {
  /* Получаем язык, проверяем токены запросившего пользователя и активацию аккаунте */
  const { lang, requester_user, status } = await ValidateUser(event)
  if (!requester_user || status === 401) {
    return new Response(JSON.stringify(ResponseManager('ER_USER_UNAUTHORIZED', lang)), { status })
  }

  try {
    /* Получаем тело запроса и проверяем наличие полей UserID, DevSN и TagID */
    const body = await event.request.json()
    const { NewsID, UserID, Title, Brief, Content, ImageTitle, ImageContent, Published } = body
    if (!UserID || !Title || !Brief || !Content || Published === undefined) {
      return new Response(JSON.stringify(ResponseManager('ER_QUERY_DATA', lang)), { status: 400 })
    }

    /* Проверяем, существует ли пользователь с указанным UserID в базе данных */
    const requested_user = await prisma.user.findUnique({ where: { UserID: UserID } })
    if (!requested_user) {
      return new Response(JSON.stringify(ResponseManager('ER_USER_NOT_FOUND', lang)), { status: 404 })
    }

    /* Проверяем права доступа */
    const hasAccess =
      requester_user.UserID === requested_user.UserID || ['MANAGER', 'ADMIN'].includes(requester_user.Role)
    if (!hasAccess) {
      return new Response(JSON.stringify(ResponseManager('ER_USER_FORBIDDEN', lang)), { status: 403 })
    }

    /* Создаем/редактируем новость */
    const news = await prisma.news.upsert({
      where: { NewsID: NewsID || '' },
      create: {
        NewsID: await GenerateUniqueID('news', 4, 4),
        UserID: UserID,
        Title: Title,
        Brief: Brief,
        Content: Content,
        ImageTitle: ImageTitle,
        ImageContent: ImageContent,
        Published: Published,
      },
      update: {
        UserID: UserID,
        Title: Title,
        Brief: Brief,
        Content: Content,
        ImageTitle: ImageTitle,
        ImageContent: ImageContent,
        Published: Published,
      },
      include: { Author: true },
    })

    /* Получаем данные об авторе */
    const author = await prisma.user.findUnique({
      where: { UserID: requested_user.UserID },
      select: {
        UserID: true,
        EMail: true,
        NickName: true,
        Avatar: true,
        FirstName: true,
        LastName: true,
      },
    })

    /* Формируем ответ с добавленной новостью */
    const response = {
      NewsID: news.NewsID,
      UserID: news.UserID,
      Title: news.Title,
      Brief: news.Brief,
      Content: news.Content,
      ImageTitle: news.ImageTitle,
      ImageContent: news.ImageContent,
      Published: news.Published,
      Author: author,
      Created: FormatDate(news.Created.toISOString()),
      Updated: FormatDate(news.Updated.toISOString()),
    }
    const responseData = { news: response }
    return new Response(JSON.stringify(ResponseManager('OK_NEWS_ADD_EDIT', lang, responseData)), { status: 200 })
  } catch (error) {
    console.error('Ошибка news_edit', error)
    return new Response(JSON.stringify(ResponseManager('ER_NEWS', lang)), { status: 500 })
  }
}
