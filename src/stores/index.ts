// src/stores/index.ts

/**
 * Экспортируем все стооры для упрощения импорта в других частях приложения
 */
export * from './MessageStore'            // Стор для управления сообщениями
export * from './WebSocketStore'          // Стор для управления сообщениями WebSocket
export * from './CatalogStore'            // Стор для управления каталогом устройств
export * from './UserStore'               // Стор для управления данными пользователей
export * from './UserStoreTemp'           // Стор для управления временными данными пользователей
export * from './NewsStore'               // Стор для управления новостями
export * from './ThemeStore'              // Стор для управления темой оформления
export * from './LoaderStore'             // Стор для управления управления компонентом загрузки
export * from './DeviceStore'             // Стор изделия
