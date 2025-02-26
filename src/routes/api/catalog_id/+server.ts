// src/routes/api/catalog_id/+server.ts
import type { RequestHandler } from '@sveltejs/kit'
import { prisma } from '$lib/Prisma'
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

    /* Получаем DevID из параметров запроса */
    const devIDParam = event.url.searchParams.get('DevID')
    if (!devIDParam) {
      return new Response(JSON.stringify(ResponseManager('ER_QUERY_DATA', lang)), { status: 400 })
    }

    /* Читаем данные о конкретном устройстве из базы данных */
    const device = await prisma.catalog.findUnique({
      where: { DevID: devIDParam },
      select: {
        DevID: true,
        DevName: true,
        Brief: true,
        Description: true,
        Icon: true,
        VerFW: true,
        Firmware: false,
        Manual: false,
        MetaData: true,
        API: true,
        Created: true,
        Updated: true,
      },
    })
    if (!device) {
      return new Response(JSON.stringify(ResponseManager('ER_DEVICE_NOT_FOUND_IN_CATALOG', lang)), { status: 404 })
    }

    /* Преобразуем API из Uint8Array в строку и затем в объект JSON */
    let apiData = null
    try {
      const decoder = new TextDecoder('utf-8')
      const apiString = decoder.decode(device.API)
      apiData = apiString ? apiString : null
    } catch (error) {
      console.error('catalog_id Ошибка парсинга файла API', error)
      return new Response(JSON.stringify(ResponseManager('ER_API_PARSE_ERROR', lang)), { status: 400 })
    }

    /* Формируем ответ с данными об устройстве */
    const response = {
      DevID: device.DevID,
      DevName: device.DevName,
      Brief: device.Brief,
      Description: device.Description,
      Icon: device.Icon,
      VerFW: device.VerFW,
      MetaData: device.MetaData,
      API: apiData,
      Created: FormatDate(device.Created.toISOString()),
      Updated: FormatDate(device.Updated.toISOString()),
    }

    /* Формируем ответ */
    const responseData = { catalog: response }
    return new Response(JSON.stringify(ResponseManager('OK_GET_CATALOG', lang, responseData)), { status: 200 })
  } catch (error) {
    console.error('Ошибка catalog_id', error)
    return new Response(JSON.stringify(ResponseManager('ER_GET_CATALOG', lang)), { status: 500 })
  }
}
