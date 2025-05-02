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
  APILanguage: string
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
      APILanguage: formData.get('APILanguage') as string,
    }

    // Проверка обязательных полей
    const requiredFields: (keyof CandidateDevice)[] = ['CatalogID', 'CatalogName', 'Brief', 'Description', 'Icon', 'VerFW', 'Firmware', 'Manual', 'APILanguage']

    if (!requiredFields.every((field) => candidate_device[field])) {
      return new Response(JSON.stringify(ResponseManager('ER_INSUFFICIENT_DATA_TO_CREATE_DEVICE', lang)), { status: 400 })
    }

    // Проверка формата CatalogID
    const catalogIdRegex = /^[0-9A-F]{4}$/
    if (!catalogIdRegex.test(candidate_device.CatalogID)) {
      return new Response(JSON.stringify(ResponseManager('ER_INVALID_CATALOG_ID', lang)), { status: 400 })
    }

    // Проверка типов файлов
    const fileToBuffer = async (file: File): Promise<Buffer> => Buffer.from(await file.arrayBuffer())

    const firmwareBytes = await fileToBuffer(candidate_device.Firmware as File)
    const manualBytes = await fileToBuffer(candidate_device.Manual as File)
    const apiBytes = candidate_device.API ? await fileToBuffer(candidate_device.API as File) : null

    // Создаем метаданные
    const metaData = {
      CatalogID: candidate_device.CatalogID,
      VerFW: candidate_device.VerFW,
      CRC32: crc32(firmwareBytes),
    }

    // Поиск существующего устройства
    let device = await prisma.catalogDevice.findUnique({
      where: { CatalogID: candidate_device.CatalogID },
      include: {
        Versions: {
          include: {
            ApiFiles: true,
          },
        },
      },
    })

    let versionDevice = null
    if (device) {
      // Обновляем существующую версию
      versionDevice = await prisma.catalogVersion.upsert({
        where: { DeviceID_VerFW: { DeviceID: device.CatalogID, VerFW: candidate_device.VerFW } },
        create: {
          VerFW: candidate_device.VerFW,
          Description: candidate_device.Description,
          Firmware: firmwareBytes,
          Manual: manualBytes,
          MetaData: metaData,
          CatalogDevice: { connect: { CatalogID: device.CatalogID } },
          ApiFiles: apiBytes
            ? {
                create: {
                  Language: candidate_device.APILanguage,
                  Content: apiBytes,
                },
              }
            : undefined,
        },
        update: {
          Description: candidate_device.Description,
          Firmware: firmwareBytes,
          Manual: manualBytes,
          MetaData: metaData,
          ApiFiles: apiBytes
            ? {
                upsert: {
                  where: {
                    VersionDeviceID_VersionVerFW_Language: {
                      VersionDeviceID: device.CatalogID,
                      VersionVerFW: candidate_device.VerFW,
                      Language: candidate_device.APILanguage,
                    },
                  },
                  create: {
                    Language: candidate_device.APILanguage,
                    Content: apiBytes,
                  },
                  update: {
                    Content: apiBytes,
                  },
                },
              }
            : undefined,
        },
      })
    } else {
      // Создаем новое устройство с версией
      device = await prisma.catalogDevice.create({
        data: {
          CatalogID: candidate_device.CatalogID,
          CatalogName: candidate_device.CatalogName,
          Brief: candidate_device.Brief,
          Icon: candidate_device.Icon,
          VerFW: candidate_device.VerFW,
          Versions: {
            create: {
              VerFW: candidate_device.VerFW,
              Description: candidate_device.Description,
              Firmware: firmwareBytes,
              Manual: manualBytes,
              MetaData: metaData,
              ApiFiles: apiBytes
                ? {
                    create: {
                      Language: candidate_device.APILanguage,
                      Content: apiBytes,
                    },
                  }
                : undefined,
            },
          },
        },
        include: {
          Versions: {
            include: {
              ApiFiles: true,
            },
          },
        },
      })
      versionDevice = device?.Versions[0]
    }

    if (!versionDevice) {
      return new Response(JSON.stringify(ResponseManager('ER_EDIT_DEVICE', lang)), { status: 500 })
    }

    // Обновляем последнюю версию в CatalogDevice
    const allVersions = device?.Versions ? device.Versions.map((ver) => ver.VerFW) : []
    const latestVerFW = allVersions.length > 0 ? allVersions.sort((a, b) => b.localeCompare(a))[0] : '0.0'

    device = await prisma.catalogDevice.update({
      where: { CatalogID: candidate_device.CatalogID },
      data: {
        CatalogName: candidate_device.CatalogName,
        Brief: candidate_device.Brief,
        Icon: candidate_device.Icon,
        VerFW: latestVerFW,
      },
      include: {
        Versions: {
          include: {
            ApiFiles: true,
          },
        },
      },
    })

    // Формируем ответ
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
          APILanguages: ver.ApiFiles.map((api) => api.Language),
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
