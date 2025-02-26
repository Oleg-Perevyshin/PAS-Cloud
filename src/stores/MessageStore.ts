// src/stores/MessageStore.ts
import { writable } from 'svelte/store'
import type { IPopUpMessage } from './Interfaces'

export const MessagesStore = writable<IPopUpMessage[]>([])
let messageId = 0

/* Функция для добавления нового сообщения */
export const addMessage = (text: string) => {
  const newMessage: IPopUpMessage = {
    id: messageId++,
    text,
    createdAt: Date.now(),
  }

  MessagesStore.update((messages) => {
    const updatedMessages = [...messages, newMessage]
    const timeoutId = setTimeout(() => {
      MessagesStore.update((msg) => msg.filter((m) => m.id !== newMessage.id))
    }, 5000)
    newMessage.timeoutId = timeoutId
    return updatedMessages
  })
}

/* Функция для удаления сообщения вручную */
export const RemoveMessage = (id: number) => {
  MessagesStore.update((messages) => {
    messages.forEach((msg) => {
      if (msg.id === id && msg.timeoutId) {
        clearTimeout(msg.timeoutId)
      }
    })
    return messages.filter((msg) => msg.id !== id)
  })
}
