// src/stores/NewsStore.ts
import { writable } from 'svelte/store'
import type { INews } from './Interfaces'

const DefaultNews: INews = {
  NewsID: '',
  UserID: '',
  Title: '',
  Brief: '',
  Content: '',
  ImageTitle: null,
  ImageContent: null,
  Published: false,
  Author: null,
  Created: '',
  Updated: '',
}

const DefaultNewsList: INews[] = []

/**
 * Создание writable store
 */
export const NewsStore = writable<INews>(DefaultNews)
export const NewsListStore = writable<INews[]>(DefaultNewsList)

/**
 * Подготовка модального окна для создания новой новости
 */
export const NewsClear = () => {
  NewsStore.update(() => ({
    NewsID: '',
    UserID: '',
    Title: '',
    Brief: '',
    Content: '',
    ImageTitle: null,
    ImageContent: null,
    Published: false,
    Author: null,
  }))
}

/**
 * Обновление или добавление новости
 */
export const NewsUpsert = (newsData: Partial<INews>) => {
  NewsListStore.update((currentNewsList) => {
    const existingIndex = currentNewsList.findIndex((news) => news.NewsID === newsData.NewsID)
    if (existingIndex !== -1) {
      /* Новость существует - обновляем только переданные поля */
      const updatedNewsList = [...currentNewsList]
      updatedNewsList[existingIndex] = {
        ...updatedNewsList[existingIndex],
        ...newsData,
      } as INews
      return updatedNewsList
    } else {
      /* Новости нет - добавляем новую */
      const newNews: INews = {
        NewsID: newsData.NewsID || '',
        UserID: newsData.UserID || '',
        Title: newsData.Title || '',
        Brief: newsData.Brief || '',
        Content: newsData.Content || '',
        ImageTitle: newsData.ImageTitle || null,
        ImageContent: newsData.ImageContent || null,
        Published: newsData.Published || false,
        Author: newsData.Author || null,
        Created: newsData.Created || '',
        Updated: newsData.Updated || '',
      }
      return [...currentNewsList, newNews]
    }
  })
}

/**
 * Удаление всех новостей
 */
export const NewsListClear = () => {
  NewsListStore.set([])
}

/**
 * Удаление новости из массива
 */
export const RemoveNewsFromStore = (NewsID: string) => {
  NewsListStore.update((currentNewsList) => currentNewsList.filter((news) => news.NewsID !== NewsID))
}
