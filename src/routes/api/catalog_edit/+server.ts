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
  Language: string
  CurrentFW: string
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
      Language: formData.get('Language') as string,
      CurrentFW: formData.get('CurrentFW') as string,
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
      'Language',
      'CurrentFW',
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
      CurrentFW: candidate_device.CurrentFW,
      CRC32: crc32(firmwareBytes),
    }

    const result = await prisma.$transaction(async (prisma) => {
      /* Создаем/обновляем устройство */
      const device = await prisma.catalogDevice.upsert({
        where: { CatalogID: candidate_device.CatalogID },
        create: {
          CatalogID: candidate_device.CatalogID,
          CatalogName: candidate_device.CatalogName,
          Icon: candidate_device.Icon,
          LatestFW: candidate_device.CurrentFW,
        },
        update: {
          CatalogName: candidate_device.CatalogName,
          Icon: candidate_device.Icon,
        },
      })

      /* Создаем/обновляем версию */
      const version = await prisma.catalogVersion.upsert({
        where: {
          DeviceID_VerFW: {
            DeviceID: device.CatalogID,
            VerFW: candidate_device.CurrentFW,
          },
        },
        create: {
          DeviceID: device.CatalogID,
          VerFW: candidate_device.CurrentFW,
        },
        update: {},
      })

      /* Обновляем/создаем локализацию */
      await prisma.versionLocalization.upsert({
        where: {
          VersionLanguageUnique: {
            VersionID: version.id,
            Language: candidate_device.Language,
          },
        },
        create: {
          VersionID: version.id,
          Language: candidate_device.Language,
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
      })

      /* Обновляем LatestFW если версия новее */
      if (candidate_device.CurrentFW > device.LatestFW) {
        await prisma.catalogDevice.update({
          where: { CatalogID: device.CatalogID },
          data: { LatestFW: candidate_device.CurrentFW },
        })
      }

      /* Получаем обновленные данные для ответа */
      return await prisma.catalogDevice.findUnique({
        where: { CatalogID: device.CatalogID },
        include: {
          Versions: {
            include: {
              Localizations: true,
            },
            orderBy: {
              VerFW: 'desc',
            },
          },
        },
      })
    })

    /* Формируем ответ */
    const currentVersion = result?.Versions[0]
    const currentLocalization = currentVersion?.Localizations.find((l) => l.Language === candidate_device.Language)
    const responseData = {
      catalog: {
        Icon: result?.Icon,
        CatalogID: result?.CatalogID,
        CatalogName: result?.CatalogName,
        CurrentFW: result?.LatestFW,
        Language: currentLocalization?.Language,
        Brief: currentLocalization?.Brief,
        Description: currentLocalization?.Description,
        Versions: result?.Versions.map((v) => v.VerFW),
        Created: FormatDate(result?.Created.toISOString()),
        Updated: FormatDate(result?.Updated.toISOString()),
      },
    }
    return new Response(JSON.stringify(ResponseManager('OK_EDIT_DEVICE', lang, responseData)), { status: 201 })
  } catch (error) {
    console.error('Ошибка catalog_edit', error)
    return new Response(JSON.stringify(ResponseManager('ER_EDIT_DEVICE', lang)), { status: 500 })
  }
}
