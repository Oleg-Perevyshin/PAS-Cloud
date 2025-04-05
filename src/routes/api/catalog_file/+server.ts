// src/routes/api/catalog_file/+server.ts
/**
 * Компонент, который возвращает файлы в зависимости от запроса
 * Путь запроса: /api/catalog_file?CatalogID=0000&DataType=Manual&VerFW=0.1 - запрос от пользователя на получение руководства 0000-Manual-v0.3.pdf
 * Путь запроса: /api/catalog_file?CatalogID=0000&DataType=Firmware&VerFW=0.3 - запрос от пользователя на получение прошивки 0000-Firmware-v0.3.bin
 * Путь запроса: /api/catalog_file?CatalogID=0000&DataType=API&VerFW=0.3 - запрос от устройства на получение API
 * Путь запроса: /api/catalog_file?DevSN=0000-0000C43300004B0C0000DADC|DF&DataType=MetaData&VerFW=0.3 - запрос от устройства на получение мета данных
 * Путь запроса: /api/catalog_file?DevSN=0000-0000C43300004B0C0000DADC|DF&DataType=Firmware&VerFW=0.3 - запрос от устройства на получение прошивки
 */

import type { RequestHandler } from '@sveltejs/kit'
import { prisma } from '$lib/Prisma'
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
    if (!DataTypeParam || !VerFWParam || (!DevSNParam && !CatalogID)) {
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
    let DevID
    if (CatalogID) {
      DevID = CatalogID
    } else if (DevSNParam) {
      DevID = DevSNParam?.substring(0, 4)
    } else {
      return new Response(JSON.stringify(ResponseManager('ER_QUERY_DATA', lang)), { status: 400 })
    }

    /* Читаем данные о конкретном устройстве из базы данных */
    const device = await prisma.catalogDevice.findUnique({
      where: { CatalogID: DevID },
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

    /* Создаем список прошивок из 15 последних в порядке убывания */
    const allVersions = device.Versions.map((ver) => ver.VerFW)
      .sort((a, b) => parseFloat(b) - parseFloat(a))
      .slice(0, 15)
    /* Собираем ответ с метаданными */
    const responseData = {
      CatalogID: device.CatalogID,
      CRC32: crc32(Buffer.from(selectedVersion.Firmware)),
      VerFW: selectedVersion.VerFW,
      Versions: allVersions,
    }

    let fileBuffer: Buffer | string | null = null
    let fileName: string | null = null
    let contentType: string | null = null

    /* Обработка типа данных */
    if (DataTypeParam === 'Firmware') {
      if (!selectedVersion.Firmware) {
        return new Response(JSON.stringify(ResponseManager('ER_FILE_NOT_FOUND', lang)), { status: 404 })
      }
      fileBuffer = Buffer.from(selectedVersion.Firmware)
      fileName = `${device.CatalogID}-Firmware-v${VerFWParam}.bin`
      contentType = 'application/octet-stream'
    } else if (DataTypeParam === 'Manual') {
      if (!selectedVersion.Manual) {
        return new Response(JSON.stringify(ResponseManager('ER_FILE_NOT_FOUND', lang)), { status: 404 })
      }
      fileBuffer = Buffer.from(selectedVersion.Manual)
      fileName = `${device.CatalogID}-Manual-v${VerFWParam}.pdf`
      contentType = 'application/pdf'
    } else if (DataTypeParam === 'MetaData') {
      if (!selectedVersion.MetaData) {
        return new Response(JSON.stringify(ResponseManager('ER_FILE_NOT_FOUND', lang)), { status: 404 })
      }
      fileBuffer = Buffer.from(JSON.stringify(responseData))
      fileName = `${device.CatalogID}-MetaData.json`
      contentType = 'application/json'
    } else if (DataTypeParam === 'API') {
      if (!selectedVersion.API) {
        return new Response(JSON.stringify(ResponseManager('ER_FILE_NOT_FOUND', lang)), { status: 404 })
      }
      fileBuffer = Buffer.from(selectedVersion.API)
      fileName = `${device.CatalogID}-API-v${VerFWParam}.yaml`
      contentType = 'application/x-yaml'
    } else if (DataTypeParam === 'Icon') {
      if (!device.Icon) {
        return new Response(JSON.stringify(ResponseManager('ER_FILE_NOT_FOUND', lang)), { status: 404 })
      }
      fileBuffer = Buffer.from(device.Icon)
      fileName = `${device.CatalogID}-Icon.svg`
      contentType = 'image/svg+xml'
    } else {
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
