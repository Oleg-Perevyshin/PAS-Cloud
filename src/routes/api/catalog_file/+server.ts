// src/routes/api/catalog_file/+server.ts
/**
 * Компонент, который возвращает файлы в зависимости от запроса
 * Путь запроса: /api/catalog_file?CatalogID=0000&DataType=Manual&VerFW=0.1&Language=ru - запрос от пользователя на получение руководства 0000-Manual-v0.3.pdf
 * Путь запроса: /api/catalog_file?CatalogID=0000&DataType=Firmware&VerFW=0.3&Language=ru - запрос от пользователя на получение прошивки 0000-Firmware-v0.3.bin
 * Путь запроса: /api/catalog_file?CatalogID=0000&DataType=API&VerFW=0.3&Language=ru - запрос от устройства на получение API
 * Путь запроса: /api/catalog_file?DevSN=0000-0000C43300004B0C0000DADC|DF&DataType=MetaData&VerFW=0.3&Language=ru - запрос от устройства на получение мета данных
 * Путь запроса: /api/catalog_file?DevSN=0000-0000C43300004B0C0000DADC|DF&DataType=Firmware&VerFW=0.3&Language=ru - запрос от устройства на получение прошивки
 */

import type { RequestHandler } from '@sveltejs/kit'
import { prisma } from '../../../../prisma/Prisma'
import { ResponseManager } from '$lib/utils/ResponseManager'
import { ValidateUser } from '$lib/utils/ValidateRequest'
import { ValidateDevSN } from '$lib/utils/Common'
import crc32 from 'crc/crc32'

export const GET: RequestHandler = async (event) => {
  /* Получаем язык */
  const lang = event.request.headers.get('Accept-Language') || 'ru'

  try {
    /* Получаем параметры запроса и проверяем на наличие */
    const CatalogID = event.url.searchParams.get('CatalogID')
    const DevSNParam = event.url.searchParams.get('DevSN')
    const DataTypeParam = event.url.searchParams.get('DataType')
    const VerFWParam = event.url.searchParams.get('VerFW')
    const LangParam = event.url.searchParams.get('Language')
    if (!DataTypeParam || !VerFWParam || !LangParam || (!DevSNParam && !CatalogID)) {
      return new Response(JSON.stringify(ResponseManager('ER_QUERY_DATA', lang)), { status: 400 })
    }

    /* Проверяем токены запросившего пользователя или серийный номер устройства */
    const { requester_user, status } = await ValidateUser(event)
    if (status === 401 && !ValidateDevSN(DevSNParam)) {
      /* Оба токена недействительны и нет серийного номера */
      return new Response(JSON.stringify(ResponseManager('ER_QUERY_DATA', lang)), { status: 400 })
    }

    /* Проверяем права доступа */
    if (requester_user && !['ENGINEER', 'MANAGER', 'ADMIN'].includes(requester_user.Role)) {
      return new Response(JSON.stringify(ResponseManager('ER_USER_FORBIDDEN', lang)), { status: 403 })
    }

    /* Если CatalogID или DevSNParam нет в запросе возвращаем ошибку */
    const DevID = CatalogID || DevSNParam?.substring(0, 4)
    if (!DevID) {
      return new Response(JSON.stringify(ResponseManager('ER_QUERY_DATA', lang)), { status: 400 })
    }

    /* Читаем данные о конкретном устройстве из базы данных */
    const device = await prisma.catalogDevice.findUnique({
      where: { CatalogID: DevID },
      include: {
        Versions: {
          where: { VerFW: VerFWParam },
          take: 1,
          include: {
            Localizations: {
              where: { Language: LangParam },
              take: 1,
            },
          },
        },
      },
    })

    if (!device) {
      return new Response(JSON.stringify(ResponseManager('ER_DEVICE_NOT_FOUND_IN_CATALOG', lang)), { status: 404 })
    }

    // Находим нужную версию
    let selectedVersion = device.Versions[0]
    if (!selectedVersion && !VerFWParam) {
      // Если версия не указана, ищем последнюю
      const versions = await prisma.catalogVersion.findMany({
        where: { DeviceID: DevID },
        orderBy: { VerFW: 'desc' },
        take: 1,
        include: {
          Localizations: {
            where: { Language: lang },
            take: 1,
          },
        },
      })
      selectedVersion = versions[0]
    }

    if (!selectedVersion) {
      return new Response(JSON.stringify(ResponseManager('ER_VERSION_NOT_FOUND', lang)), { status: 404 })
    }

    const localization = selectedVersion.Localizations[0]
    if (!localization && DataTypeParam !== 'MetaData') {
      return new Response(JSON.stringify(ResponseManager('ER_LOCALIZATION_NOT_FOUND', lang)), { status: 404 })
    }

    // Подготовка метаданных
    const allVersions = await prisma.catalogVersion.findMany({
      where: { DeviceID: device.CatalogID },
      orderBy: { VerFW: 'desc' },
      take: 15,
      select: { VerFW: true },
    })

    const responseData = {
      CatalogID: device.CatalogID,
      CRC32: localization.Firmware ? crc32(Buffer.from(localization.Firmware)) : null,
      VerFW: selectedVersion.VerFW,
      Versions: allVersions.map((v) => v.VerFW),
    }

    let fileBuffer: Buffer | string | null = null
    let fileName: string | null = null
    let contentType: string | null = null

    /* Обработка типа данных */
    switch (DataTypeParam) {
      case 'Firmware':
        if (!localization.Firmware) {
          return new Response(JSON.stringify(ResponseManager('ER_FILE_NOT_FOUND', lang)), { status: 404 })
        }
        fileBuffer = Buffer.from(localization.Firmware)
        fileName = `${device.CatalogID}-Firmware-v${selectedVersion.VerFW}-${LangParam}.bin`
        contentType = 'application/octet-stream'
        break

      case 'Manual':
        if (!localization.Manual) {
          return new Response(JSON.stringify(ResponseManager('ER_FILE_NOT_FOUND', lang)), { status: 404 })
        }
        fileBuffer = Buffer.from(localization.Manual)
        fileName = `${device.CatalogID}-Manual-v${selectedVersion.VerFW}-${LangParam}.pdf`
        contentType = 'application/pdf'
        break

      case 'MetaData':
        fileBuffer = Buffer.from(JSON.stringify(responseData))
        fileName = `${device.CatalogID}-MetaData.json`
        contentType = 'application/json'
        break

      case 'API': {
        const apiFile = localization.API
        if (!apiFile) {
          return new Response(JSON.stringify(ResponseManager('ER_API_LANGUAGE_NOT_FOUND', lang)), { status: 404 })
        }
        fileBuffer = Buffer.from(apiFile)
        fileName = `${device.CatalogID}-API-v${selectedVersion.VerFW}-${LangParam}.yaml`
        contentType = 'application/x-yaml'
        break
      }

      case 'Icon':
        if (!device.Icon) {
          return new Response(JSON.stringify(ResponseManager('ER_FILE_NOT_FOUND', lang)), { status: 404 })
        }
        fileBuffer = Buffer.from(device.Icon)
        fileName = `${device.CatalogID}-Icon.svg`
        contentType = 'image/svg+xml'
        break

      default:
        return new Response(JSON.stringify(ResponseManager('ER_QUERY_DATA', lang)), { status: 400 })
    }

    /* Возвращаем файл */
    return new Response(fileBuffer, {
      status: 200,
      headers: {
        'content-disposition': `inline; filename="${fileName}"`,
        'content-type': contentType,
        'content-length': Buffer.byteLength(fileBuffer).toString(),
      },
    })
  } catch (error) {
    console.log('Ошибка catalog_file', error)
    return new Response(JSON.stringify(ResponseManager('ER_GET_CATALOG', lang)), { status: 500 })
  }
}
