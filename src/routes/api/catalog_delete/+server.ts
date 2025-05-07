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
        const deletedVersion = await prisma.catalogVersion.delete({
          where: { IDX_DeviceVersion: { DeviceID: CatalogID, VerFW } },
        })
        if (!deletedVersion) {
          throw new Error('Версия не найдена')
        }

        /* Проверяем количество оставшихся версий (если версий не осталось - удаляем устройство полностью) */
        const remainingVersions = await prisma.catalogVersion.count({
          where: { DeviceID: CatalogID },
        })
        if (remainingVersions === 0) {
          await deleteDeviceCompletely(CatalogID)
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
        await deleteDeviceCompletely(CatalogID)
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

    // return new Response(JSON.stringify(ResponseManager('OK_DELETE_DEVICE_VERSION', lang)), { status: 200 })
    return new Response(JSON.stringify(ResponseManager('OK_DELETE_DEVICE_VERSION', lang, responseData)), { status: 200 })
  } catch (error) {
    console.error('Ошибка удаления устройства:', error)
    return new Response(JSON.stringify(ResponseManager('ER_DELETE_DEVICE_FROM_CATALOG', lang)), { status: 500 })
  }
}

/* Вспомогательная функция для полного удаления устройства */
async function deleteDeviceCompletely(CatalogID: string) {
  // Удаление связей с пользователями
  await prisma.userDevice.deleteMany({
    where: { Device: { DevID: CatalogID } },
  })

  // Удаление физических устройств
  await prisma.device.deleteMany({
    where: { DevID: CatalogID },
  })

  // Удаление из каталога (каскадно удалит версии и локализации)
  await prisma.catalogDevice.delete({
    where: { CatalogID },
  })
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
