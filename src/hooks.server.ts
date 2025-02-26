// src/hooks.server.ts
import type { Handle } from '@sveltejs/kit'
import { ResponseManager } from '$lib/utils/ResponseManager'

export const handle: Handle = async ({ event, resolve }) => {
  /* Получаем язык */
  const lang = event.request.headers.get('Accept-Language') || 'ru'

  const length = +(event.request.headers.get('content-length') ?? '0')
  if (length > 67108864) {
    return new Response(JSON.stringify(ResponseManager('ER_BODY_SIZE_LIMIT', lang)), { status: 413 })
  }

  const response = await resolve(event)
  return response
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
