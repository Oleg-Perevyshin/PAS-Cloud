// $lib/utils/Common.ts
import { marked } from 'marked'
import DOMPurify from 'dompurify'

/**
 * Форматирование даты и времени
 * @param dateString - строка с датой и временем
 * @returns форматированная строка ДД.ММ.ГГГГ - ЧЧ:ММ
 */
export const FormatDate = (dateString: string | undefined): string => {
  if (dateString) {
    const date = new Date(dateString)
    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = date.getFullYear()
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    return `${day}.${month}.${year}\n${hours}:${minutes}`
  }
  return ''
}

/** Проверка серийного номера
 * @param serialNumber - серийные номер в виде строки
 * @returns cерийные номер, преобразованные в верхний регистр или null
 *  XXXX-YYYYYYYYYYYYYYYYYYYYYYYY|ZZ, где:
 *  X — ID устройства по каталогу - DevID (4 символа от 0 до Z)
 *  Y — Серийных номер чипа (24 символов от 0 до F)
 *  | - разделитель серийного номера и контрольной суммы
 *  Z - контрольная сумма CRC8 строки XXXX-YYYYYYYYYYYYYYYYYYYYYYYY в HEX формате
 */
export const ValidateDevSN = (serialNumber: string | null) => {
  if (!serialNumber) {
    return console.error('ValidateDevSN: Неверные входные данные'), null
  }

  /* Проверяем формат серийного номера и разделяем на части */
  const normalizedSerialNumber = serialNumber.toUpperCase()
  const serialNumberRegex = /^[0-9A-Z]{4}-[0-9A-Z]{24}\|[0-9A-F]{2}$/
  if (!serialNumberRegex.test(normalizedSerialNumber)) {
    return console.error('ValidateDevSN: Неверный формат серийного номера'), null
  }

  /* Разбиваем серийный номер на 2 подстроки (до символа '|' и после) */
  const parts = normalizedSerialNumber.split('|')
  if (parts.length !== 2) {
    return console.error('ValidateDevSN: Неверная структура серийного номера'), null
  }
  const serialPart = parts[0]
  const crcPart = parts[1]

  /* Вычисляем контрольную сумму CRC8 и сравниваем */
  let crc = 0x00
  for (let i = 0; i < serialPart.length; i++) {
    let extract = serialPart.charCodeAt(i)
    for (let j = 0; j < 8; j++) {
      const sum = (crc ^ extract) & 0x01
      crc >>= 1
      if (sum) crc ^= 0x8c
      extract >>= 1
    }
  }
  const calcCRC = crc.toString(16).toUpperCase()

  /* Сравнение с учетом формата */
  if (calcCRC.padStart(2, '0') !== crcPart.padStart(2, '0')) {
    return console.error('ValidateDevSN: Неверная контрольная сумма'), null
  }

  return normalizedSerialNumber
}

/**
 * Функция для добавления изображения
 * @param event - Событие изменения (change) на input[type="file"]
 * @param fieldName - Имя поля, в которое будет сохранено изображение (например, "ImageTitle", "ImageContent"...)
 * @param store - Хранилище, в которое будет сохранено изображение (например, NewsStore, UserStore и т.д.)
 */
interface StoreType<T> {
  update: (updater: (prevData: T) => T) => void
}
export const HandleImageUpload = <T>(event: Event, fieldName: string, store: StoreType<T>) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    const reader = new FileReader()
    reader.onload = () => {
      const binaryString = reader.result as ArrayBuffer
      const bytes = new Uint8Array(binaryString)
      const binary = Array.from(bytes)
        .map((byte) => String.fromCharCode(byte))
        .join('')
      const base64Avatar = window.btoa(binary)

      /* Обновляем хранилище */
      store.update((prevData: T) => ({
        ...prevData,
        [fieldName]: base64Avatar,
      }))
    }
    reader.readAsArrayBuffer(file)
  }
}

/**
 * Метод преобразования разметки MD в HTML
 * @param text - входная строка с разметкой MD
 * @returns - выходная строка, преобразованная в HTML
 */
export const RenderMarkdown = async (text: string) => {
  /* Установка опций для обработки Markdown */
  marked.setOptions({
    async: false, // Отключаем асинхронный режим
    breaks: true, // Включает поддержку разрыва строк
    gfm: true, // Поддержка GitHub Flavored Markdown
    pedantic: false, // Отключает строгий режим
    silent: true, // Не вызывает ошибок при рендеринге
  })

  /* Преобразуем Markdown в HTML и очищаем */
  const html = await marked(text)
  const cleanHtml = DOMPurify.sanitize(html)
  return cleanHtml
}

/**
 * Функция формирования пакета для отправки через WebSocket (зашифрованного)
 * Сначала формируем JSON из header, argument ,value
 * Преобразуем полученный JSON в строку и затем в массив байт
 * Вычисляем контрольную сумму массива байт CRC-16/Modbus (2 байта)
 * Шифруем массив байт с использованием CRC-16
 * Подготавливаем полезные данные (первый и последний байты пакета - старший и младший байты CRC)
 * Формируем итоговый пакет как объект JSON типа: { "Data": [Uint8Array] }
 *
 * @param header - заголовок пакета
 * @param argument - агрумент данных
 * @param value - данные
 * @returns - Uint8Array | null
 */
export const EncryptWebSocketPacket = (header: string, argument: string, value: object): Uint8Array | null => {
  if (!header || !argument || typeof value !== 'object') {
    return console.error('EncryptWebSocketPacket: Неверные входные данные'), null
  }

  /* Формируем JSON, преобразуем с строку и затем в массив байт */
  const JsonPacketAsString = JSON.stringify({ HEADER: header, ARGUMENT: argument, VALUE: value })
  const encoder = new TextEncoder()
  const dataBytes = encoder.encode(JsonPacketAsString)

  /* Вычисляем CRC16 байтового представления JSON пакета */
  const crcValue = crc16ModBus(dataBytes)

  /* Шифруем данные (ключ - CRC16 исходного массива Байт) */
  const encryptedData = cryptData(dataBytes, crcValue)

  /* Формируем итоговый пакет с CRC */
  const finalPacket = new Uint8Array(1 + encryptedData.length + 1)
  finalPacket[0] = (crcValue >> 8) & 0xff
  finalPacket.set(encryptedData, 1)
  finalPacket[encryptedData.length + 1] = crcValue & 0xff
  return finalPacket
}

/**
 * Функция расшифровки полученного массива байт (зашифрованного)
 * Получаем зашифрованный массив байт
 * Извлекаем из него ключ шифрования и полезные данные
 * Прогоняем данные через дешифратор с использованием ключа шифрования
 * Вычисляем контрольную сумму расшифрованного массива байт и сравниваем с ключпм шифрования
 * Если все хорошо, преобразуем массив байт в строку
 * Затем в объект JSON с проверкой
 *
 * @param encryptedPacket - входящий пакет
 * @returns - object | null
 */
export const DecryptWebSocketPacket = (encryptedPacket: Uint8Array): object | null => {
  /* Проверяем, что пакет имеет достаточную длину */
  if (encryptedPacket.length < 2) {
    return console.error('DecryptWebSocketPacket: Пакет слишком короткий'), null
  }

  /* Извлекаем контрольную сумму и полезные данные из пакета */
  const receivedCrc = (encryptedPacket[0] << 8) | encryptedPacket[encryptedPacket.length - 1]
  const receivedEncryptedData = encryptedPacket.slice(1, encryptedPacket.length - 1)

  /* Расшифровка данных */
  const decryptedData = cryptData(receivedEncryptedData, receivedCrc)
  const calcCrcValue = crc16ModBus(decryptedData)

  if (calcCrcValue !== receivedCrc) {
    return console.error('DecryptWebSocketPacket: Неверная контрольная сумма'), null
  }

  /* Получение исходного JSON пакета */
  const decoder = new TextDecoder()
  const jsonString = decoder.decode(decryptedData)

  try {
    return JSON.parse(jsonString)
  } catch (error) {
    return console.error(`DecryptWebSocketPacket: Ошибки расшифровки пакета ${error}`), null
  }
}

/* ********************************************************************************************* */
/* Рассчитываем контрольную сумму CRC-16/Modbus */
const crc16ModBus = (data: Uint8Array): number => {
  let crc = 0xffff
  for (let i = 0; i < data.length; i++) {
    crc ^= data[i]
    for (let j = 0; j < 8; j++) {
      const lsb = crc & 0x0001
      crc >>= 1
      if (lsb) {
        crc ^= 0xa001
      }
    }
  }
  return crc
}

/* Функция шифрования данных */
const cryptData = (inputData: Uint8Array, key: number): Uint8Array => {
  const keyBytes = new Uint8Array([key & 0xff, (key >> 8) & 0xff])
  const outputData = new Uint8Array(inputData.length)
  for (let i = 0; i < inputData.length; i++) {
    outputData[i] = inputData[i] ^ keyBytes[i % keyBytes.length]
  }
  return outputData
}
