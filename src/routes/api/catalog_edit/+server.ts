// src/routes/api/catalog_edit/+server.ts
import type { RequestHandler } from '@sveltejs/kit'
import { prisma } from '$lib/Prisma'
import { ResponseManager } from '$lib/utils/ResponseManager'
import { ValidateUser } from '$lib/utils/ValidateRequest'
import crc32 from 'crc/crc32'
import { FormatDate } from '$lib/utils/Common'

/* Определяем интерфейс для устройства */
interface CandidateDevice {
  CatalogID: string
  CatalogName: string
  Brief: string
  Description: string
  Icon: string
  VerFW: string
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
      CatalogID: formData.get('CatalogID') as string,
      CatalogName: formData.get('CatalogName') as string,
      Brief: formData.get('Brief') as string,
      Description: formData.get('Description') as string,
      Icon: formData.get('Icon') as string,
      VerFW: formData.get('VerFW') as string,
      Firmware: formData.get('Firmware'),
      Manual: formData.get('Manual'),
      API: formData.get('API'),
    }

    /* Проверяем наличия всех данных об устройстве */
    const requiredFields: (keyof CandidateDevice)[] = [
      'CatalogID',
      'CatalogName',
      'Brief',
      'Description',
      'Icon',
      'VerFW',
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

    /* Проверка типов для Firmware, Manual и API */
    const files = [candidate_device.Firmware, candidate_device.Manual, candidate_device.API]
    if (!files.every((file) => file instanceof File)) {
      return new Response(JSON.stringify(ResponseManager('ER_INVALID_FILE_TYPE', lang)), { status: 400 })
    }

    /* Преобразуем файлы в Buffer */
    const fileToBuffer = async (file: File): Promise<Buffer> => Buffer.from(await file.arrayBuffer())
    const [firmwareBytes, manualBytes, apiBytes] = await Promise.all(files.map(fileToBuffer))

    /* Извлекаем текущее устройство из базы данных */
    let device = await prisma.catalogDevice.findUnique({
      where: { CatalogID: candidate_device.CatalogID },
      include: { Versions: true },
    })

    /* Создаем объект MetaData */
    const metaData = {
      CatalogID: candidate_device.CatalogID,
      VerFW: candidate_device.VerFW,
      CRC32: crc32(firmwareBytes),
      Versions: [],
    }

    let versionDevice = null
    if (device) {
      /* Локальный сотрировщик */
      const sortedVersions = [...new Set([...device.Versions.map((ver) => ver.VerFW), candidate_device.VerFW])].sort((a, b) => {
        return parseFloat(b) - parseFloat(a)
      })

      versionDevice = await prisma.catalogVersion.upsert({
        where: { DeviceID_VerFW: { DeviceID: device.CatalogID, VerFW: candidate_device.VerFW } },
        create: {
          VerFW: candidate_device.VerFW,
          Description: candidate_device.Description,
          Firmware: firmwareBytes,
          Manual: manualBytes,
          API: apiBytes,
          MetaData: { ...metaData, Versions: sortedVersions },
          CatalogDevice: { connect: { CatalogID: device.CatalogID } },
        },
        update: {
          Description: candidate_device.Description,
          Firmware: firmwareBytes,
          Manual: manualBytes,
          API: apiBytes,
          MetaData: { ...metaData, Versions: sortedVersions },
        },
      })
    } else {
      /* Создаем новое устройство с новой версией */
      const newDevice = await prisma.catalogDevice.create({
        data: {
          CatalogID: candidate_device.CatalogID,
          CatalogName: candidate_device.CatalogName,
          Brief: candidate_device.Brief,
          Icon: candidate_device.Icon,
          VerFW: candidate_device.VerFW,
        },
      })
      if (!newDevice) {
        return new Response(JSON.stringify(ResponseManager('ER_EDIT_DEVICE', lang)), { status: 500 })
      }

      versionDevice = await prisma.catalogVersion.create({
        data: {
          VerFW: candidate_device.VerFW,
          Description: candidate_device.Description,
          Firmware: firmwareBytes,
          Manual: manualBytes,
          API: apiBytes,
          MetaData: { ...metaData, Versions: [candidate_device.VerFW] },
          CatalogDevice: { connect: { CatalogID: candidate_device.CatalogID } },
        },
      })
    }
    if (!versionDevice) {
      return new Response(JSON.stringify(ResponseManager('ER_EDIT_DEVICE', lang)), { status: 500 })
    }

    /* Получаем данные об устройстве после изменений */
    device = await prisma.catalogDevice.findUnique({
      where: { CatalogID: candidate_device.CatalogID },
      include: { Versions: true },
    })

    /* Получаем все версии для обновления последней версии в CatalogDevice */
    const allVersions = device && device.Versions ? device.Versions.map((ver) => ver.VerFW) : []
    const latestVerFW = allVersions.length > 0 ? allVersions.sort((a, b) => b.localeCompare(a))[0] : '0.0'

    /* Обновляем данные об устройстве в базе данных */
    device = await prisma.catalogDevice.update({
      where: { CatalogID: candidate_device.CatalogID },
      data: {
        CatalogName: candidate_device.CatalogName,
        Brief: candidate_device.Brief,
        Icon: candidate_device.Icon,
        VerFW: latestVerFW,
      },
      include: { Versions: true },
    })
    if (!device) {
      return new Response(JSON.stringify(ResponseManager('ER_EDIT_DEVICE', lang)), { status: 500 })
    }

    /* Создаем объект ответа без Firmware, Manual и API */
    const responseData = {
      catalog: {
        CatalogID: device.CatalogID,
        CatalogName: device.CatalogName,
        Brief: device.Brief,
        Description: versionDevice.Description,
        Icon: device.Icon,
        VerFW: latestVerFW,
        Versions: device.Versions.map((ver) => ({
          VerFW: ver.VerFW,
          Description: ver.Description,
          Created: FormatDate(ver.Created.toISOString()),
          Updated: FormatDate(ver.Updated.toISOString()),
        })),
        Created: FormatDate(device.Created.toISOString()),
        Updated: FormatDate(device.Updated.toISOString()),
      },
    }

    return new Response(JSON.stringify(ResponseManager('OK_EDIT_DEVICE', lang, responseData)), { status: 201 })
  } catch (error) {
    console.error('Ошибка catalog_edit', error)
    return new Response(JSON.stringify(ResponseManager('ER_EDIT_DEVICE', lang)), { status: 500 })
  }
}
