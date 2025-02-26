// src/routes/api/catalog_list/+server.ts
import type { RequestHandler } from '@sveltejs/kit'
import { prisma } from '$lib/Prisma'
import type { Prisma } from '@prisma/client'
import { ResponseManager } from '$lib/utils/ResponseManager'
import { ValidateUser } from '$lib/utils/ValidateRequest'
import { FormatDate } from '$lib/utils/Common'

export const GET: RequestHandler = async (event) => {
  /* Получаем язык, проверяем токены запросившего пользователя и активацию аккаунте */
  const { lang, requester_user, status } = await ValidateUser(event)
  if (!requester_user || status === 401) {
    return new Response(JSON.stringify(ResponseManager('ER_USER_UNAUTHORIZED', lang)), { status })
  }

  /* Обрабатываем запрос */
  try {
    /* Проверяем права доступа */
    const hasAccess = ['ENGINEER', 'MANAGER', 'ADMIN'].includes(requester_user.Role)
    if (!hasAccess) {
      return new Response(JSON.stringify(ResponseManager('ER_USER_FORBIDDEN', lang)), { status: 403 })
    }

    /* Формируем пакеты с устройствами с учетом пагинации */
    const startCursor = event.url.searchParams.get('startCursor')
    const endCursor = event.url.searchParams.get('endCursor')
    const cursorDevID = event.url.searchParams.get('cursor')
    const actualCursorID = cursorDevID === 'null' ? null : cursorDevID
    const quantity = Math.max(Number(event.url.searchParams.get('quantity')) || 10, 1)

    /* Определяем тип для queryOptions */
    const queryOptions: Prisma.CatalogFindManyArgs = {
      take: quantity,
      orderBy: { DevID: 'asc' },
      select: {
        DevID: true,
        DevName: true,
        Brief: true,
        Description: true,
        Icon: true,
        VerFW: true,
        MetaData: true,
        Created: true,
        Updated: true,
      },
    }

    /* Если передан диапазон, добавляем условия для фильтрации */
    const whereConditions: Prisma.CatalogWhereInput = {}
    const devIDFilter: Prisma.StringFilter = {}

    if (startCursor) {
      devIDFilter.gte = startCursor
    }
    if (endCursor) {
      devIDFilter.lte = endCursor
    }
    if (Object.keys(devIDFilter).length > 0) {
      whereConditions.DevID = devIDFilter
    }
    if (Object.keys(whereConditions).length > 0) {
      queryOptions.where = whereConditions
    }

    /* Если курсор установлен, пропускаем текущее устройство */
    if (actualCursorID) {
      queryOptions.cursor = { DevID: actualCursorID }
      queryOptions.skip = 1
    }

    /* Читаем данные из базы данных согласно опций queryOptions */
    const devices = await prisma.catalog.findMany(queryOptions)
    if (!devices) {
      return new Response(JSON.stringify(ResponseManager('ER_GET_CATALOG', lang)), { status: 500 })
    }

    /* Обрабатываем каждое устройство и форматируем даты */
    const formattedDevices = devices.map((device) => ({
      DevID: device.DevID,
      DevName: device.DevName,
      Brief: device.Brief,
      Description: device.Description,
      Icon: device.Icon,
      VerFW: device.VerFW,
      MetaData: device.MetaData,
      Created: FormatDate(device.Created.toISOString()),
      Updated: FormatDate(device.Updated.toISOString()),
    }))

    /* Определяем курсор и формируем ответ */
    const newCursor = formattedDevices.length > 0 ? formattedDevices[formattedDevices.length - 1].DevID : null
    const responseData = { catalog_list: formattedDevices, cursor: newCursor }
    return new Response(JSON.stringify(ResponseManager('OK_GET_CATALOG', lang, responseData)), { status: 200 })
  } catch (error) {
    console.error('Ошибка catalog_list', error)
    return new Response(JSON.stringify(ResponseManager('ER_GET_CATALOG', lang)), { status: 500 })
  }
}
