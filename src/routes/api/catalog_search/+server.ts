// src/routes/api/catalog_search/+server.ts
import type { RequestHandler } from '@sveltejs/kit'
import { prisma } from '../../../../prisma/Prisma'
import { ResponseManager } from '$lib/utils/ResponseManager'
import { ValidateUser } from '$lib/utils/ValidateRequest'
import type { Prisma } from '@prisma/client'
import { FormatDate } from '$lib/utils/Common'

// Тип для устройства с необходимыми полями
type CatalogDeviceWithRelations = Prisma.CatalogDeviceGetPayload<{
  include: {
    Versions: {
      include: {
        Localizations: {
          where: { Language: string }
          take: 1
        }
      }
      orderBy: { VerFW: 'desc' }
      take: 1
    }
  }
}>

export const GET: RequestHandler = async (event) => {
  const { lang, requester_user } = await ValidateUser(event)

  if (requester_user && !['ENGINEER', 'MANAGER', 'ADMIN'].includes(requester_user.Role)) {
    return new Response(JSON.stringify(ResponseManager('ER_USER_FORBIDDEN', lang)), { status: 403 })
  }

  try {
    const search = event.url.searchParams.get('search')?.trim() || ''
    const language = lang || 'en'
    const pageSize = 10

    // Формируем условия запроса
    const where: Prisma.CatalogDeviceWhereInput = {}

    if (search) {
      where.OR = [
        { CatalogID: { contains: search, mode: 'insensitive' } },
        { CatalogName: { contains: search, mode: 'insensitive' } },
        {
          Versions: {
            some: {
              Localizations: {
                some: {
                  Language: language,
                  OR: [{ Brief: { contains: search, mode: 'insensitive' } }, { Description: { contains: search, mode: 'insensitive' } }],
                },
              },
            },
          },
        },
      ]
    }

    // Получаем устройства с последней версией и локализацией
    const devices = (await prisma.catalogDevice.findMany({
      take: pageSize,
      where,
      orderBy: { CatalogID: 'asc' },
      include: {
        Versions: {
          orderBy: { VerFW: 'desc' },
          take: 1, // Только последняя версия
          include: {
            Localizations: {
              where: { Language: language },
              take: 1, // Только одна локализация для языка
            },
          },
        },
      },
    })) as CatalogDeviceWithRelations[]

    // Форматируем результат
    const formattedDevices = devices.map((device) => {
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
        CatalogID: device.CatalogID,
        CatalogName: device.CatalogName,
        Icon: device.Icon,
        LatestFW: device.LatestFW,
        Brief: latestVersionLocalization.Brief,
        Description: latestVersionLocalization.Description,
        Versions: versionsWithLocalizations,
        Created: FormatDate(device.Created.toISOString()),
        Updated: FormatDate(device.Updated.toISOString()),
      }
    })

    return new Response(JSON.stringify(ResponseManager('OK_CATALOG_SEARCH', lang, { catalog_list: formattedDevices })), { status: 200 })
  } catch (error) {
    console.error('Ошибка catalog_search', error)
    return new Response(JSON.stringify(ResponseManager('ER_CATALOG_SEARCH', lang)), { status: 500 })
  }
}
