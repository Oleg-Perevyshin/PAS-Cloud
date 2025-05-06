// src/hooks.server.ts
import type { Handle } from '@sveltejs/kit'
import { ResponseManager } from '$lib/utils/ResponseManager'
import pino from 'pino'
import { LOG_LEVEL } from '$env/static/private'

const logger = pino({
  level: LOG_LEVEL || 'info',
  // transport: {
  //   target: 'pino-loki',
  //   options: {
  //     translateTime: 'dd-mm-yyyy HH:MM:ss.l o',
  //     colorize: true,
  //     ignore: 'pid,hostname',
  //     host: 'localhost:3100',
  //   },
  // },
})

export const handle: Handle = async ({ event, resolve }) => {
  const lang = event.request.headers.get('Accept-Language') || 'ru'
  const contentLength = +(event.request.headers.get('content-length') ?? '0')

  /* TRACE: Логируем детали запроса (если уровень >= trace) */
  // logger.trace(
  //   {
  //     headers: Object.fromEntries(event.request.headers.entries()),
  //     ip: event.getClientAddress(),
  //   },
  //   'Получен запрос (детали)',
  // )

  /* DEBUG: Размер тела запроса */
  // logger.debug(`Content-Length: ${contentLength} Bytes`)

  /* Размера тела должен быть до 64 MB (FATAL для критически больших запросов) */
  if (contentLength > 67_108_864) {
    // logger.fatal({ contentLength, maxAllowed: 67_108_864 }, 'Превышен максимальный размер тела запроса')
    return new Response(JSON.stringify(ResponseManager('ER_BODY_SIZE_LIMIT', lang)), { status: 413 })
  }

  /* INFO: Основная информация о запросе */
  // logger.info({ method: event.request.method, path: event.url.pathname }, 'Начало обработки запроса')

  try {
    const response = await resolve(event)

    /* INFO: Успешный ответ */
    // logger.info({ status: response.status }, 'Запрос успешно обработан')

    /* DEBUG: Детали ответа */
    // logger.debug({ headers: Object.fromEntries(response.headers.entries()) }, 'Заголовки ответа')

    return response
  } catch (error) {
    /* ERROR: Ошибка обработки запроса */
    // logger.error(
    //   {
    //     error: error instanceof Error ? error.message : String(error),
    //     stack: error instanceof Error ? error.stack : undefined,
    //   },
    //   'Ошибка при обработке запроса',
    // )

    /* WARN: Дополнительное предупреждение для специфичных ошибок */
    if (error instanceof Error && error.message.includes('Validation')) {
      // logger.warn('Ошибка валидации данных')
    }

    throw error // или возвращаем кастомный Response
  }
}

// import { WebSocketServer } from 'ws'
// import type { Server } from 'http'
// /* WebSocket Server */
// const wss = new WebSocketServer({ noServer: true })
// wss.on('connection', (ws) => {
//   ws.on('error', console.error)

//   ws.on('message', (data) => {
//     /* Логика обработки полученных данных */
//     console.log(`Received from Client: ${data}`)
//   })

//   ws.send('Welcome to the WebSocket Server!')
// })

// /* Обработка WebSocket соединений */
// export default function plugin(server: Server) {
//   server.on('upgrade', function (req, socket, head) {
//     if (req.url === '/ws') {
//       wss.handleUpgrade(req, socket, head, (ws) => {
//         wss.emit('connection', ws, req)
//       })
//     }
//   })
// }
