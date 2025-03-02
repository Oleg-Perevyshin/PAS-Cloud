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
    const hasAccess = ['MANAGER', 'ADMIN'].includes(requester_user.Role)
    if (!hasAccess) {
      return new Response(JSON.stringify(ResponseManager('ER_USER_FORBIDDEN', lang)), { status: 403 })
    }

    /* Извлекаем все данные из запроса */
    const formData = await event.request.formData()
    const candidate_device = {
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
    for (const field of requiredFields) {
      if (!candidate_device[field]) {
        return new Response(JSON.stringify(ResponseManager('ER_INSUFFICIENT_DATA_TO_CREATE_DEVICE', lang)), {
          status: 400,
        })
      }
    }

    /* Проверка формата CatalogID */
    const catalogIdRegex = /^[0-9A-F]{4}$/
    if (!catalogIdRegex.test(candidate_device.CatalogID)) {
      return new Response(JSON.stringify(ResponseManager('ER_INVALID_CATALOG_ID', lang)), { status: 400 })
    }

    /* Проверка типов для Firmware, Manual и API */
    if (!(candidate_device.Firmware instanceof File) || !(candidate_device.Manual instanceof File) || !(candidate_device.API instanceof File)) {
      return new Response(JSON.stringify(ResponseManager('ER_INVALID_FILE_TYPE', lang)), { status: 400 })
    }

    /* Преобразуем файлы в Buffer */
    const fileToBuffer = async (file: File): Promise<Buffer> => {
      const arrayBuffer = await file.arrayBuffer()
      return Buffer.from(arrayBuffer)
    }
    const firmwareBytes = await fileToBuffer(candidate_device.Firmware as File)
    const manualBytes = await fileToBuffer(candidate_device.Manual as File)
    const apiBytes = await fileToBuffer(candidate_device.API as File)

    /* Создаем объект MetaData */
    const metaData = {
      CatalogID: candidate_device.CatalogID,
      VerFW: candidate_device.VerFW,
      CRC32: crc32(firmwareBytes),
    }

    /* Извлекаем текущее устройство из базы данных */
    let device = await prisma.catalogDevice.findUnique({
      where: { CatalogID: candidate_device.CatalogID },
      include: { Versions: true },
    })
    let versionDevice = null
    if (device) {
      /* Работа с существующим устройством */
      const existingVersion = device.Versions.find((ver) => ver.VerFW === candidate_device.VerFW)
      if (existingVersion) {
        /* Обновляем существующую версию для существующего устройства */
        versionDevice = await prisma.catalogVersion.update({
          where: { DeviceID_VerFW: { DeviceID: device.CatalogID, VerFW: candidate_device.VerFW } },
          data: {
            Description: candidate_device.Description,
            Firmware: firmwareBytes,
            Manual: manualBytes,
            API: apiBytes,
            MetaData: metaData,
          },
        })
      } else {
        /* Создаем новую версию для существующего устройства */
        versionDevice = await prisma.catalogVersion.create({
          data: {
            VerFW: candidate_device.VerFW,
            Description: candidate_device.Description,
            Firmware: firmwareBytes,
            Manual: manualBytes,
            API: apiBytes,
            MetaData: metaData,
            CatalogDevice: { connect: { CatalogID: device.CatalogID } },
          },
        })
      }
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
          MetaData: metaData,
          CatalogDevice: { connect: { CatalogID: candidate_device.CatalogID } },
        },
      })
    }
    if (!versionDevice) {
      return new Response(JSON.stringify(ResponseManager('ER_EDIT_DEVICE', lang)), { status: 500 })
    }

    /* Обновляем данные об устройстве после изменений */
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

    console.log(`Устройство ${device?.CatalogID} обновлено, последняя версия ${latestVerFW}`)

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
