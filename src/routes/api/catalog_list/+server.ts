// src/routes/api/catalog_list/+server.ts
import type { RequestHandler } from '@sveltejs/kit'
import { prisma } from '../../../../prisma/Prisma'
import type { Prisma } from '../../../../prisma/client'
import { ResponseManager } from '$lib/utils/ResponseManager'
import { ValidateUser } from '$lib/utils/ValidateRequest'
import { FormatDate } from '$lib/utils/Common'

/* Определяем интерфейс для устройства */
interface CatalogDeviceShort {
  Icon: string
  CatalogID: string
  CatalogName: string
  LatestFW: string
  Brief: string
}

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

    /* Формируем пакеты с устройствами с учетом пагинации */
    const quantity = Math.max(Number(event.url.searchParams.get('quantity')) || 10, 1)
    const startCursor = event.url.searchParams.get('startCursor')
    const endCursor = event.url.searchParams.get('endCursor')
    const cursorDevID = event.url.searchParams.get('cursor')
    const actualCursorID = cursorDevID === 'null' ? null : cursorDevID

    /* Определяем тип для queryOptions */
    const whereConditions: Prisma.CatalogDeviceWhereInput = {}
    const queryOptions: Prisma.CatalogDeviceFindManyArgs = {
      take: quantity,
      where: whereConditions,
      orderBy: { CatalogID: 'asc' },
      include: { Versions: true },
    }

    /* Если передан диапазон, добавляем условия для фильтрации */
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
    if (Object.keys(whereConditions).length > 0) {
      queryOptions.where = whereConditions
    }

    /* Если курсор установлен, пропускаем текущее устройство */
    if (actualCursorID) {
      queryOptions.cursor = { CatalogID: actualCursorID }
      queryOptions.skip = 1
    }

    /* Читаем данные из базы данных согласно опций queryOptions */
    const devices = (await prisma.catalogDevice.findMany({
      ...queryOptions,
      include: { Versions: true },
    })) as CatalogDeviceShort[]
    if (!devices) {
      return new Response(JSON.stringify(ResponseManager('ER_GET_CATALOG', lang)), { status: 500 })
    }

    /* Обрабатываем каждое устройство и находим последнюю версию прошивки */
    const formattedDevices = await Promise.all(
      devices.map(async (device) => {
        /* Получаем все версии для данного устройства */
        const versions = device.Versions || []

        /* Находим последнюю версию */
        const latestVersion = versions.reduce((latest, current) => {
          const num1 = parseFloat(current.VerFW)
          const num2 = parseFloat(latest)
          return num1 > num2 ? current.VerFW : latest
        }, '0.0')

        return {
          CatalogID: device.CatalogID,
          CatalogName: device.CatalogName,
          Brief: device.Brief,
          Description: versions.find((version) => version.VerFW === latestVersion)?.Description || '',
          Icon: device.Icon,
          VerFW: latestVersion,
          Versions:
            versions.map((version) => ({
              VerFW: version.VerFW,
              Description: version.Description,
              Created: FormatDate(version.Created.toISOString()),
              Updated: FormatDate(version.Updated.toISOString()),
            })) || [],
          Created: FormatDate(device.Created.toISOString()),
          Updated: FormatDate(device.Updated.toISOString()),
        }
      }),
    )

    /* Определяем курсор и формируем ответ */
    const newCursor = formattedDevices.length > 0 ? formattedDevices[formattedDevices.length - 1].CatalogID : null
    const responseData = { catalog_list: formattedDevices, cursor: newCursor }
    return new Response(JSON.stringify(ResponseManager('OK_GET_CATALOG', lang, responseData)), { status: 200 })
  } catch (error) {
    console.error('Ошибка catalog_list', error)
    return new Response(JSON.stringify(ResponseManager('ER_GET_CATALOG', lang)), { status: 500 })
  }
}
