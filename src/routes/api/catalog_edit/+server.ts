// src/routes/api/catalog_edit/+server.ts
import type { RequestHandler } from '@sveltejs/kit'
import { prisma } from '$lib/Prisma'
import { ResponseManager } from '$lib/utils/ResponseManager'
import { ValidateUser } from '$lib/utils/ValidateRequest'
import crc32 from 'crc/crc32'
import { FormatDate } from '$lib/utils/Common'

/* Определяем интерфейс для устройства */
interface CandidateDevice {
  DevID: string
  DevName: string
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
      DevID: formData.get('DevID') as string,
      DevName: formData.get('DevName') as string,
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
      'DevID',
      'DevName',
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

    /* Проверка типов для Firmware и Manual */
    if (
      !(candidate_device.Firmware instanceof File) ||
      !(candidate_device.Manual instanceof File) ||
      !(candidate_device.API instanceof File)
    ) {
      return new Response(JSON.stringify(ResponseManager('ER_INVALID_FILE_TYPE', lang)), { status: 400 })
    }

    /* Функция для преобразования файла в Buffer */
    const fileToBuffer = async (file: File): Promise<Buffer> => {
      const arrayBuffer = await file.arrayBuffer()
      return Buffer.from(arrayBuffer) // Преобразование в Buffer
    }
    /* Преобразуем файлы в Bytes */
    const firmwareBytes = await fileToBuffer(candidate_device.Firmware as File)
    const manualBytes = await fileToBuffer(candidate_device.Manual as File)
    const apiBytes = await fileToBuffer(candidate_device.API as File)

    /* Вычисляем CRC32 для прошивки */
    const crc32Hash = crc32(firmwareBytes)

    /* Создаем объекта MetaData */
    const metaData = {
      DevID: candidate_device.DevID,
      VerFW: candidate_device.VerFW,
      CRC32: crc32Hash,
    }

    /* Сохраняем данные об устройстве в базу данных */
    const device = await prisma.catalog.upsert({
      where: { DevID: candidate_device.DevID },
      create: {
        DevID: candidate_device.DevID,
        DevName: candidate_device.DevName,
        Brief: candidate_device.Brief,
        Description: candidate_device.Description,
        Icon: candidate_device.Icon,
        VerFW: candidate_device.VerFW,
        Firmware: firmwareBytes,
        Manual: manualBytes,
        API: apiBytes,
        MetaData: metaData,
      },
      update: {
        DevName: candidate_device.DevName,
        Brief: candidate_device.Brief,
        Description: candidate_device.Description,
        Icon: candidate_device.Icon,
        VerFW: candidate_device.VerFW,
        Firmware: firmwareBytes,
        Manual: manualBytes,
        API: apiBytes,
        MetaData: metaData,
      },
    })
    if (!device) {
      return new Response(JSON.stringify(ResponseManager('ER_EDIT_DEVICE', lang)), { status: 500 })
    }

    /* Создаем объект ответа без Firmware, Manual и API */
    const responseData = {
      catalog: {
        DevID: device.DevID,
        DevName: device.DevName,
        Brief: device.Brief,
        Description: device.Description,
        Icon: device.Icon,
        VerFW: device.VerFW,
        MetaData: device.MetaData,
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
