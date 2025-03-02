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

    /* Получаем CatalogID из параметров запроса */
    const CatalogIDParam = event.url.searchParams.get('CatalogID')
    const VerFWParam = event.url.searchParams.get('VerFW')
    if (!CatalogIDParam) {
      return new Response(JSON.stringify(ResponseManager('ER_QUERY_DATA', lang)), { status: 400 })
    }

    /* Читаем данные о конкретном устройстве из базы данных */
    const device = await prisma.catalogDevice.findUnique({
      where: { CatalogID: CatalogIDParam },
      include: { Versions: true },
    })
    if (!device) {
      return new Response(JSON.stringify(ResponseManager('ER_DEVICE_NOT_FOUND_IN_CATALOG', lang)), { status: 404 })
    }

    let selectedVersion = null
    if (VerFWParam) {
      selectedVersion = await prisma.catalogVersion.findUnique({
        where: { DeviceID_VerFW: { DeviceID: device.CatalogID, VerFW: VerFWParam } },
      })
    }

    /* Если версия не указана или не найдена, находим последнюю доступную версию */
    if (!selectedVersion) {
      const versions = await prisma.catalogVersion.findMany({
        where: { DeviceID: device.CatalogID },
      })
      if (versions.length > 0) {
        selectedVersion = versions.reduce((latest, current) => {
          const currentVersion = parseFloat(current.VerFW)
          const latestVersion = parseFloat(latest.VerFW || '0.0')
          return currentVersion > latestVersion ? current : latest
        })
      }
    }
    if (!selectedVersion) {
      return new Response(JSON.stringify(ResponseManager('ER_VERSION_NOT_FOUND', lang)), { status: 404 })
    }

    /* Преобразуем API из Uint8Array в строку и затем в объект JSON */
    let apiData = null
    try {
      const decoder = new TextDecoder('utf-8')
      const apiString = decoder.decode(selectedVersion.API)
      apiData = apiString ? apiString : null
    } catch (error) {
      console.error('catalog_id Ошибка парсинга файла API', error)
      return new Response(JSON.stringify(ResponseManager('ER_API_PARSE_ERROR', lang)), { status: 400 })
    }

    /* Формируем ответ с данными об устройстве */
    const response = {
      CatalogID: device.CatalogID,
      CatalogName: device.CatalogName,
      Brief: device.Brief,
      Description: selectedVersion.Description,
      Icon: device.Icon,
      VerFW: selectedVersion.VerFW,
      Versions: device.Versions.map((ver) => ({
        VerFW: ver.VerFW,
        Description: ver.Description,
        Created: FormatDate(ver.Created.toISOString()),
        Updated: FormatDate(ver.Updated.toISOString()),
      })),
      MetaData: selectedVersion.MetaData,
      API: apiData,
      Created: FormatDate(selectedVersion.Created.toISOString()),
      Updated: FormatDate(selectedVersion.Updated.toISOString()),
    }

    /* Формируем ответ */
    const responseData = { catalog: response }
    return new Response(JSON.stringify(ResponseManager('OK_GET_CATALOG', lang, responseData)), { status: 200 })
  } catch (error) {
    console.error('Ошибка catalog_id', error)
    return new Response(JSON.stringify(ResponseManager('ER_GET_CATALOG', lang)), { status: 500 })
  }
}
