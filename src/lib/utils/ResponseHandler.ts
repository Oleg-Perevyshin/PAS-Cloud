// $lib/utils/ResponseHandler.ts
import { addMessage } from '../../stores'

type FetchResponse =
  | {
      status: {
        code: number
        message: string
      }
    }
  | Error
  | null
  | unknown

/**
 * Универсальный обработчик для вывода сообщений
 */
export const ResponseHandler = async (response: FetchResponse) => {
  let message: string

  if (response instanceof Error) {
    /* Обрабатываем обычные ошибки */
    message = response.message || 'Неизвестная ошибка'
  } else if (response === null) {
    /* Обрабатываем случай, когда ответ null */
    message = 'Ответ от сервера отсутствует'
  } else if (typeof response === 'object' && response !== null) {
    /* Обрабатываем объект ответа от сервера */
    const responseData = response as { status?: { message?: string } }
    message = responseData.status?.message || 'Неизвестная ошибка'
  } else {
    /* Если ничего не подходит, устанавливаем стандартное сообщение */
    message = 'Неизвестная ошибка'
  }

  /* Выводим сообщение */
  addMessage(message)
}
