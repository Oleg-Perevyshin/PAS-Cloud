// src/routes/api/catalog_delete/+server.ts
import type { RequestHandler } from '@sveltejs/kit'
import { prisma } from '../../../../prisma/Prisma'
import { ResponseManager } from '$lib/utils/ResponseManager'
import { ValidateUser } from '$lib/utils/ValidateRequest'
import { FormatDate } from '$lib/utils/Common'

export const DELETE: RequestHandler = async (event) => {
  /* Проверка авторизации и прав доступа */
  const { lang, requester_user, status } = await ValidateUser(event)
  if (!requester_user || status === 401) {
    return new Response(JSON.stringify(ResponseManager('ER_USER_UNAUTHORIZED', lang)), { status })
  }

  try {
    if (requester_user && !['MANAGER', 'ADMIN'].includes(requester_user.Role)) {
      return new Response(JSON.stringify(ResponseManager('ER_USER_FORBIDDEN', lang)), { status: 403 })
    }

    /* Получаем CatalogID и VerFW для удаления */
    const { CatalogID, VerFW } = await event.request.json()
    if (!CatalogID) {
      return new Response(JSON.stringify(ResponseManager('ER_QUERY_DATA', lang)), { status: 400 })
    }

    /* Используем транзакцию для безопасного удаления */
    const result = await prisma.$transaction(async (prisma) => {
      if (VerFW) {
        /* Удаление конкретной версии */
        await prisma.versionLocalization.deleteMany({
          where: { Version: { DeviceID: CatalogID, VerFW } },
        })

        await prisma.catalogVersion.delete({
          where: { DeviceID_VerFW: { DeviceID: CatalogID, VerFW } },
        })

        /* Проверяем количество оставшихся версий */
        const remainingVersions = await prisma.catalogVersion.count({
          where: { DeviceID: CatalogID },
        })

        /* Если версий не осталось - удаляем устройство полностью */
        if (remainingVersions === 0) {
          await prisma.userDevice.deleteMany({
            where: { Device: { DevID: CatalogID } },
          })

          await prisma.device.deleteMany({
            where: { DevID: CatalogID },
          })

          await prisma.catalogDevice.delete({
            where: { CatalogID },
          })
          return null
        }

        /* Обновляем LatestFW если нужно */
        const [latestVersion] = await prisma.catalogVersion.findMany({
          where: { DeviceID: CatalogID },
          orderBy: { VerFW: 'desc' },
          take: 1,
        })

        await prisma.catalogDevice.update({
          where: { CatalogID },
          data: { LatestFW: latestVersion?.VerFW || '' },
        })

        return await getDeviceWithVersions(CatalogID, lang)
      } else {
        /* Полное удаление устройства */
        await prisma.versionLocalization.deleteMany({
          where: { Version: { DeviceID: CatalogID } },
        })

        await prisma.catalogVersion.deleteMany({
          where: { DeviceID: CatalogID },
        })

        await prisma.userDevice.deleteMany({
          where: { Device: { DevID: CatalogID } },
        })

        await prisma.device.deleteMany({
          where: { DevID: CatalogID },
        })

        await prisma.catalogDevice.delete({
          where: { CatalogID },
        })
        return null
      }
    })

    /* Формируем ответ, если null - устройство удалено полностью, иначе - только его версия */
    if (result === null) {
      return new Response(JSON.stringify(ResponseManager('OK_DELETE_DEVICE_FROM_CATALOG', lang, { catalog: { CatalogID } })), { status: 200 })
    }

    const currentVersion = result.Versions[0]
    const currentLocalization = currentVersion?.Localizations.find((l) => l.Language === lang)

    const responseData = {
      catalog: {
        Icon: result.Icon,
        CatalogID: result.CatalogID,
        CatalogName: result.CatalogName,
        LatestFW: result.LatestFW,
        Brief: currentLocalization?.Brief || '',
        Description: currentLocalization?.Description || '',
        Versions: result.Versions.map((v) => v.VerFW),
        Created: FormatDate(result.Created.toISOString()),
        Updated: FormatDate(result.Updated.toISOString()),
      },
    }

    return new Response(JSON.stringify(ResponseManager('OK_DELETE_DEVICE_VERSION', lang, responseData)), { status: 200 })
  } catch (error) {
    console.error('Ошибка удаления устройства:', error)
    return new Response(JSON.stringify(ResponseManager('ER_DELETE_DEVICE_FROM_CATALOG', lang)), { status: 500 })
  }
}

/* Вспомогательная функция для получения устройства с версиями */
async function getDeviceWithVersions(CatalogID: string, lang: string) {
  return await prisma.catalogDevice.findUnique({
    where: { CatalogID },
    include: {
      Versions: {
        orderBy: { VerFW: 'desc' },
        include: {
          Localizations: {
            where: { Language: lang },
            take: 1,
          },
        },
      },
    },
  })
}
