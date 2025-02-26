// src/routes/api/catalog_file/+server.ts
/**
 * Компонент, который возвращает файлы в зависимости от запроса
 * Путь запроса: /api/catalog_file?DevID=0000&TypeData=Manual - запрос от пользователя на получение 0000-Manual.pdf
 * Путь запроса: /api/catalog_file?DevID=0000&TypeData=Firmware - запрос от пользователя на получение 0000-Firmware.bin
 * Путь запроса: /api/catalog_file?DevID=0000&TypeData=API - запрос от устройства на получение API
 * Путь запроса: /api/catalog_file?DevSN=0000-0000C43300004B0C0000DADC|DF&TypeData=MetaData - запрос от устройства на получение мета данных
 * Путь запроса: /api/catalog_file?DevSN=0000-0000C43300004B0C0000DADC|DF&TypeData=Firmware - запрос от устройства на получение прошивки
 */

import type { RequestHandler } from '@sveltejs/kit'
import { prisma } from '$lib/Prisma'
import { ResponseManager } from '$lib/utils/ResponseManager'
import { ValidateUser } from '$lib/utils/ValidateRequest'
import { ValidateDevSN } from '$lib/utils/Common'

export const GET: RequestHandler = async (event) => {
  /* Получаем язык */
  const lang = event.request.headers.get('Accept-Language') || 'ru'

  try {
    /* Получаем параметры запроса и проверяем на наличие */
    let devID = event.url.searchParams.get('DevID')
    const devSNParam = event.url.searchParams.get('DevSN')
    const typeDataParam = event.url.searchParams.get('TypeData')
    if (!typeDataParam || (!devSNParam && !devID)) {
      return new Response(JSON.stringify(ResponseManager('ER_QUERY_DATA', lang)), { status: 400 })
    }

    /* Проверяем токены запросившего пользователя и активацию аккаунте или DevSN устройства */
    const { requester_user, status } = await ValidateUser(event)
    if (status === 401) {
      if (devSNParam) {
        const DevSN = ValidateDevSN(devSNParam)
        if (DevSN) {
          devID = DevSN.substring(0, 4)
        } else {
          return new Response(JSON.stringify(ResponseManager('ER_USER_UNAUTHORIZED', lang)), { status: 401 })
        }
      }
    } else if (requester_user) {
      /* Проверяем права доступа */
      const hasAccess = ['MANAGER', 'ADMIN'].includes(requester_user.Role)
      if (!hasAccess) {
        return new Response(JSON.stringify(ResponseManager('ER_USER_FORBIDDEN', lang)), { status: 403 })
      }
    }

    /* Если DevID не установлен (нет в запросе и нет серийного номера), возвращаем ошибку */
    if (!devID) {
      return new Response(JSON.stringify(ResponseManager('ER_QUERY_DATA', lang)), { status: 400 })
    }

    /* Читаем данные о конкретном устройстве из базы данных */
    const device = await prisma.catalog.findUnique({
      where: { DevID: devID },
      select: {
        DevID: true,
        DevName: true,
        Brief: true,
        Description: true,
        Icon: true,
        VerFW: true,
        Firmware: true,
        Manual: true,
        MetaData: true,
        API: true,
      },
    })
    if (!device) {
      return new Response(JSON.stringify(ResponseManager('ER_DEVICE_NOT_FOUND_IN_CATALOG', lang)), { status: 404 })
    }

    let fileBuffer: Buffer | string | null = null
    let fileName: string | null = null
    let contentType: string | null = null

    /* Обработка типа данных */
    if (typeDataParam === 'Firmware') {
      if (!device.Firmware) {
        return new Response(JSON.stringify(ResponseManager('ER_FILE_NOT_FOUND', lang)), { status: 404 })
      }
      fileBuffer = Buffer.from(device.Firmware)
      fileName = `${device.DevID}-Firmware.bin`
      contentType = 'application/octet-stream'
    } else if (typeDataParam === 'Manual') {
      if (!device.Manual) {
        return new Response(JSON.stringify(ResponseManager('ER_FILE_NOT_FOUND', lang)), { status: 404 })
      }
      fileBuffer = Buffer.from(device.Manual)
      fileName = `${device.DevID}-Manual.pdf`
      contentType = 'application/pdf'
    } else if (typeDataParam === 'MetaData') {
      if (!device.MetaData) {
        return new Response(JSON.stringify(ResponseManager('ER_FILE_NOT_FOUND', lang)), { status: 404 })
      }
      fileBuffer = Buffer.from(JSON.stringify(device.MetaData))
      fileName = `${device.DevID}-MetaData.json`
      contentType = 'application/json'
    } else if (typeDataParam === 'API') {
      if (!device.API) {
        return new Response(JSON.stringify(ResponseManager('ER_FILE_NOT_FOUND', lang)), { status: 404 })
      }
      fileBuffer = Buffer.from(device.API);
      fileName = `${device.DevID}-API.yaml`;
      contentType = 'application/x-yaml'
    } else if (typeDataParam === 'Icon') {
      if (!device.Icon) {
        return new Response(JSON.stringify(ResponseManager('ER_FILE_NOT_FOUND', lang)), { status: 404 })
      }
      fileBuffer = Buffer.from(device.Icon)
      fileName = `${device.DevID}-Icon.svg`
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
