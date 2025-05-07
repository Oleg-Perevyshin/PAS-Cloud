// src/routes/api/catalog_list/+server.ts
import type { RequestHandler } from '@sveltejs/kit'
import { prisma } from '../../../../prisma/Prisma'
import type { Prisma } from '@prisma/client'
import { ResponseManager } from '$lib/utils/ResponseManager'
import { ValidateUser } from '$lib/utils/ValidateRequest'
import { FormatDate } from '$lib/utils/Common'

type CatalogDeviceWithRelations = Prisma.CatalogDeviceGetPayload<{
  include: {
    Versions: {
      include: {
        Localizations: true
      }
    }
  }
}>

export const GET: RequestHandler = async (event) => {
  /* Получаем язык, проверяем токены запросившего пользователя и активацию аккаунте */
  const { lang, requester_user, status } = await ValidateUser(event)
  if (!requester_user || status === 401) {
    return new Response(JSON.stringify(ResponseManager('ER_USER_UNAUTHORIZED', lang)), { status })
  }

  /* Обрабатываем запрос */
  try {
    /* Проверяем права доступа */
    if (requester_user && !['USER', 'ENGINEER', 'MANAGER', 'ADMIN'].includes(requester_user.Role)) {
      return new Response(JSON.stringify(ResponseManager('ER_USER_FORBIDDEN', lang)), { status: 403 })
    }

    /* Формируем параметры запроса */
    const quantity = Math.max(Number(event.url.searchParams.get('quantity')) || 10, 1)
    const startCursor = event.url.searchParams.get('startCursor')
    const endCursor = event.url.searchParams.get('endCursor')
    const cursorDevID = event.url.searchParams.get('cursor')
    const actualCursorID = cursorDevID === 'null' ? null : cursorDevID
    const language = lang || 'ru'

    /* Формируем условия запроса */
    const whereConditions: Prisma.CatalogDeviceWhereInput = {}
    const queryOptions: Prisma.CatalogDeviceFindManyArgs = {
      take: quantity,
      where: whereConditions,
      orderBy: { CatalogID: 'asc' },
      include: {
        Versions: {
          orderBy: { VerFW: 'desc' }, // Сортируем версии по убыванию
          include: {
            Localizations: {
              where: { Language: language },
              take: 1,
            },
          },
        },
      },
    }

    /* Фильтрация по диапазону CatalogID */
    const devIDFilter: Prisma.StringFilter = {}
    if (startCursor) {
      devIDFilter.gte = startCursor
    }
    if (endCursor) {
      devIDFilter.lte = endCursor
    }
    if (Object.keys(devIDFilter).length > 0) {
      whereConditions.CatalogID = devIDFilter
    }

    /* Курсор для пагинации */
    if (actualCursorID) {
      queryOptions.cursor = { CatalogID: actualCursorID }
      queryOptions.skip = 1
    }

    /* Получаем устройства из базы данных */
    const devices = (await prisma.catalogDevice.findMany(queryOptions)) as CatalogDeviceWithRelations[]

    /* Форматируем данные */
    const formattedDevices = devices.map((device) => {
      // Для каждой версии находим подходящую локализацию
      const versionsWithLocalizations = device.Versions.map((version) => {
        const localization = version.Localizations[0] || {
          Brief: '',
          Description: '',
          Language: '',
        }

        return {
          VerFW: version.VerFW,
          Brief: localization.Brief,
          Description: localization.Description,
          Language: localization.Language,
        }
      })

      // Находим локализацию для последней версии (первой в отсортированном списке)
      const latestVersionLocalization = device.Versions[0]?.Localizations[0] || {
        Brief: '',
        Description: '',
        Language: '',
      }

      return {
        Icon: device.Icon,
        CatalogID: device.CatalogID,
        CatalogName: device.CatalogName,
        LatestFW: device.LatestFW,
        Brief: latestVersionLocalization.Brief,
        Description: latestVersionLocalization.Description,
        Versions: versionsWithLocalizations, // Все версии с локализациями
        Created: FormatDate(device.Created.toISOString()),
        Updated: FormatDate(device.Updated.toISOString()),
      }
    })

    /* Формируем ответ */
    const newCursor = formattedDevices.length > 0 ? formattedDevices[formattedDevices.length - 1].CatalogID : null
    const responseData = {
      catalog_list: formattedDevices,
      cursor: newCursor,
    }

    return new Response(JSON.stringify(ResponseManager('OK_GET_CATALOG', lang, responseData)), { status: 200 })
  } catch (error) {
    console.error('Ошибка catalog_list', error)
    return new Response(JSON.stringify(ResponseManager('ER_GET_CATALOG', lang)), { status: 500 })
  }
}
