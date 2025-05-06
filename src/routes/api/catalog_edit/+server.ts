// src/routes/api/catalog_edit/+server.ts
import type { RequestHandler } from '@sveltejs/kit'
import { prisma } from '../../../../prisma/Prisma'
import { ResponseManager } from '$lib/utils/ResponseManager'
import { ValidateUser } from '$lib/utils/ValidateRequest'
import crc32 from 'crc/crc32'
import { FormatDate } from '$lib/utils/Common'

/* Определяем интерфейс для устройства */
interface CandidateDevice {
  Icon: string
  CatalogID: string
  CatalogName: string
  DataLanguage: string
  VerFW: string
  Brief: string
  Description: string
  Firmware: FormDataEntryValue | null
  Manual: FormDataEntryValue | null
  API: FormDataEntryValue | null
}

export const POST: RequestHandler = async (event) => {
  /* Получаем язык, проверяем токены запросившего пользователя и активацию аккаунте */
  const { lang, requester_user, status } = await ValidateUser(event)
  if (!requester_user || status === 401) {
    return new Response(JSON.stringify(ResponseManager('ER_USER_UNAUTHORIZED', lang)), { status: 401 })
  }

  try {
    /* Проверяем права доступа */
    if (requester_user && !['MANAGER', 'ADMIN'].includes(requester_user.Role)) {
      return new Response(JSON.stringify(ResponseManager('ER_USER_FORBIDDEN', lang)), { status: 403 })
    }

    /* Извлекаем все данные из запроса */
    const formData = await event.request.formData()
    const candidate_device: CandidateDevice = {
      Icon: formData.get('Icon') as string,
      CatalogID: formData.get('CatalogID') as string,
      CatalogName: formData.get('CatalogName') as string,
      DataLanguage: formData.get('DataLanguage') as string,
      VerFW: formData.get('VerFW') as string,
      Brief: formData.get('Brief') as string,
      Description: formData.get('Description') as string,
      Firmware: formData.get('Firmware'),
      Manual: formData.get('Manual'),
      API: formData.get('API'),
    }

    /* Проверка обязательных полей */
    const requiredFields: (keyof CandidateDevice)[] = [
      'Icon',
      'CatalogID',
      'CatalogName',
      'DataLanguage',
      'VerFW',
      'Brief',
      'Description',
      'Firmware',
      'Manual',
      'API',
    ]
    if (!requiredFields.every((field) => candidate_device[field])) {
      return new Response(JSON.stringify(ResponseManager('ER_INSUFFICIENT_DATA_TO_CREATE_DEVICE', lang)), { status: 400 })
    }

    /* Проверка формата CatalogID */
    const catalogIdRegex = /^[0-9A-F]{4}$/
    if (!catalogIdRegex.test(candidate_device.CatalogID)) {
      return new Response(JSON.stringify(ResponseManager('ER_INVALID_CATALOG_ID', lang)), { status: 400 })
    }

    /* Конвертация файлов */
    const fileToBuffer = async (file: File): Promise<Buffer> => Buffer.from(await file.arrayBuffer())
    const firmwareBytes = await fileToBuffer(candidate_device.Firmware as File)
    const manualBytes = await fileToBuffer(candidate_device.Manual as File)
    const apiBytes = await fileToBuffer(candidate_device.API as File)

    /* Создаем метаданные */
    const metaData = {
      CatalogID: candidate_device.CatalogID,
      VerFW: candidate_device.VerFW,
      CRC32: crc32(firmwareBytes),
    }

    /* Убедимся, что устройство существует */
    const device = await prisma.catalogDevice.upsert({
      where: { CatalogID: candidate_device.CatalogID },
      create: {
        CatalogID: candidate_device.CatalogID,
        CatalogName: candidate_device.CatalogName,
        Icon: candidate_device.Icon,
        LatestFW: candidate_device.VerFW,
      },
      update: {
        CatalogName: candidate_device.CatalogName,
        Icon: candidate_device.Icon,
      },
    })

    /* Найдем или создадим версию */
    const version = await prisma.catalogVersion.upsert({
      where: {
        DeviceID_VerFW: {
          DeviceID: device.CatalogID,
          VerFW: candidate_device.VerFW,
        },
      },
      create: {
        DeviceID: device.CatalogID,
        VerFW: candidate_device.VerFW,
      },
      update: {},
    })

    /* Обновим или создадим локализацию */
    const versionDevice = await prisma.catalogVersion.update({
      where: {
        DeviceID_VerFW: {
          DeviceID: device.CatalogID,
          VerFW: candidate_device.VerFW,
        },
      },
      data: {
        Localizations: {
          upsert: {
            where: {
              VersionID_Language: {
                VersionID: version.DeviceID,
                Language: candidate_device.DataLanguage,
              },
            },
            create: {
              Language: candidate_device.DataLanguage,
              Brief: candidate_device.Brief,
              Description: candidate_device.Description,
              Firmware: firmwareBytes,
              Manual: manualBytes,
              API: apiBytes,
              MetaData: metaData,
            },
            update: {
              Brief: candidate_device.Brief,
              Description: candidate_device.Description,
              Firmware: firmwareBytes,
              Manual: manualBytes,
              API: apiBytes,
              MetaData: metaData,
            },
          },
        },
      },
      include: {
        Localizations: {
          where: {
            Language: candidate_device.DataLanguage,
          },
        },
      },
    })

    /* Обновим LatestFW если версия новее */
    const finalDevice = await prisma.catalogDevice.update({
      where: { CatalogID: device.CatalogID },
      data: {
        LatestFW: candidate_device.VerFW > device.LatestFW ? candidate_device.VerFW : device.LatestFW,
      },
      include: {
        Versions: {
          include: {
            Localizations: true,
          },
        },
      },
    })

    /* Формируем ответ */
    const currentVersion = finalDevice.Versions.find((v) => v.VerFW === finalDevice.LatestFW)
    const currentLocalization = currentVersion?.Localizations.find((l) => l.Language === candidate_device.DataLanguage)
    const responseData = {
      catalog: {
        Icon: finalDevice.Icon,
        CatalogID: finalDevice.CatalogID,
        CatalogName: finalDevice.CatalogName,
        VerFW: finalDevice.LatestFW,

        Language: currentLocalization?.Language,
        Brief: currentLocalization?.Brief,
        Description: currentLocalization?.Description,

        Versions: finalDevice.Versions.map((v) => v.VerFW).sort((a, b) => parseFloat(b) - parseFloat(a)),

        Created: FormatDate(finalDevice.Created.toISOString()),
        Updated: FormatDate(finalDevice.Updated.toISOString()),
      },
    }

    return new Response(JSON.stringify(ResponseManager('OK_EDIT_DEVICE', lang, responseData)), { status: 201 })
  } catch (error) {
    console.error('Ошибка catalog_edit', error)
    return new Response(JSON.stringify(ResponseManager('ER_EDIT_DEVICE', lang)), { status: 500 })
  }
}
