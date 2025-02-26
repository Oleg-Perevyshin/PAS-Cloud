// $lib/utils/TimerManager.ts
const timers = new Map<string, NodeJS.Timeout>()

/* Запуск таймера при регистрации пользователя */
export const startTimer = (key: string, callback: () => void, delay: number) => {
  const timer = setTimeout(() => {
    callback()
    timers.delete(key)
  }, delay)
  timers.set(key, timer)
}

/* Остановка и удаление таймера при активации пользователя */
export const clearTimer = (key: string) => {
  const timer = timers.get(key)
  if (timer) {
    clearTimeout(timer)
    timers.delete(key)
  }
}
