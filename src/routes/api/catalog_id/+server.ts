// src/routes/api/catalog_id/+server.ts
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

  /* Обрабатываем запрос */
  try {
    /* Проверяем права доступа */
    if (requester_user && !['ENGINEER', 'MANAGER', 'ADMIN'].includes(requester_user.Role)) {
      return new Response(JSON.stringify(ResponseManager('ER_USER_FORBIDDEN', lang)), { status: 403 })
    }

    /* Получаем CatalogID из параметров запроса */
    const CatalogIDParam = event.url.searchParams.get('CatalogID')
    const VerFWParam = event.url.searchParams.get('VerFW')
    const language = lang || 'ru'

    if (!CatalogIDParam) {
      return new Response(JSON.stringify(ResponseManager('ER_QUERY_DATA', lang)), { status: 400 })
    }

    /* Читаем данные о конкретном устройстве из базы данных */
    const device = await prisma.catalogDevice.findUnique({
      where: { CatalogID: CatalogIDParam },
      include: {
        Versions: {
          orderBy: { VerFW: 'desc' },
          include: {
            Localizations: true,
          },
        },
      },
    })

    if (!device) {
      return new Response(JSON.stringify(ResponseManager('ER_DEVICE_NOT_FOUND_IN_CATALOG', lang)), { status: 404 })
    }
    console.log(`Обработчик на сервере: ${device}`)

    /* Находим нужную версию */
    const selectedVersion = VerFWParam ? device.Versions.find((v) => v.VerFW === VerFWParam) : device.Versions[0] // Берем последнюю версию, если не указана

    if (!selectedVersion) {
      return new Response(JSON.stringify(ResponseManager('ER_VERSION_NOT_FOUND', lang)), { status: 404 })
    }

    /* Ищем локализацию с приоритетом: 1) запрошенный язык, 2) русский, 3) любая доступная */
    const findBestLocalization = (localizations: typeof selectedVersion.Localizations) => {
      // 1. Ищем запрошенный язык
      const requestedLangLoc = localizations.find((l) => l.Language === language)
      if (requestedLangLoc) return requestedLangLoc

      // 2. Ищем русскую локализацию
      const russianLoc = localizations.find((l) => l.Language === 'ru')
      if (russianLoc) return russianLoc

      // 3. Возвращаем первую доступную или null
      return localizations[0] || null
    }

    const bestLocalization = findBestLocalization(selectedVersion.Localizations)

    if (!bestLocalization) {
      return new Response(JSON.stringify(ResponseManager('ER_NO_LOCALIZATIONS_FOUND', lang)), { status: 404 })
    }

    /* Формируем ответ с данными об устройстве */
    const response = {
      Icon: device.Icon,
      CatalogID: device.CatalogID,
      CatalogName: device.CatalogName,
      LatestFW: device.LatestFW,
      VerFW: selectedVersion.VerFW,
      Brief: bestLocalization.Brief,
      Description: bestLocalization.Description,
      Versions: device.Versions.map((ver) => ({
        VerFW: ver.VerFW,
      })),
      Created: FormatDate(device.Created.toISOString()),
      Updated: FormatDate(device.Updated.toISOString()),
    }

    /* Формируем ответ */
    return new Response(JSON.stringify(ResponseManager('OK_GET_CATALOG', lang, { catalog: response })), { status: 200 })
  } catch (error) {
    console.error('Ошибка catalog_id', error)
    return new Response(JSON.stringify(ResponseManager('ER_GET_CATALOG', lang)), { status: 500 })
  }
}
