// prisma/seed.ts
import { PrismaClient } from '@prisma/client'
import { Prisma } from '@prisma/client'

const prisma = new PrismaClient()
export const DEFAULT_TAGS = [
  { id: 'tag-1', name: 'Tag 1', value: 'tag-1', color: 'bg-stone-400 border-2 !border-stone-400' },
  { id: 'tag-2', name: 'Tag 2', value: 'tag-2', color: 'bg-red-400 border-2 !border-red-400' },
  { id: 'tag-3', name: 'Tag 3', value: 'tag-3', color: 'bg-yellow-400 border-2 !border-yellow-400' },
  { id: 'tag-4', name: 'Tag 4', value: 'tag-4', color: 'bg-green-400 border-2 !border-green-400' },
  { id: 'tag-5', name: 'Tag 5', value: 'tag-5', color: 'bg-sky-400 border-2 !border-sky-400' },
  { id: 'tag-6', name: 'Tag 6', value: 'tag-6', color: 'bg-fuchsia-400 border-2 !border-fuchsia-400' },
]

async function GenerateUniqueID(model: 'news' | 'user', blocks: number, charsPerBlock: number): Promise<string> {
  const characters = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  let attempts = 0
  let newID: string

  while (attempts < 100) {
    newID = Array.from({ length: blocks }, () =>
      Array.from({ length: charsPerBlock }, () => characters[Math.floor(Math.random() * characters.length)]).join(''),
    ).join('-')

    /* Создаем объект where с правильным типом */
    let where: Prisma.NewsWhereUniqueInput | Prisma.UserWhereUniqueInput | Prisma.DeviceWhereUniqueInput
    if (model === 'news') {
      where = { NewsID: newID }
      const exists = await prisma.news.findUnique({ where })
      if (!exists) return newID
    } else if (model === 'user') {
      where = { UserID: newID }
      const exists = await prisma.user.findUnique({ where })
      if (!exists) return newID
    } else {
      throw new Error(`Неверная модель`)
    }

    attempts++
  }
  throw new Error(`Не удалось сгенерировать уникальный ID для модели ${model} после 100 попыток`)
}

/* Функция создания фиктивных пользователей */
const seed = async () => {
  /* Очищаем БД */
  // await prisma.user.deleteMany()

  const SeedUsersData = [
    {
      IsActivated: true,
      IsOnline: false,
      Role: 'ADMIN',
      EMail: 'user_101@gmail.com',
      Password: '$argon2id$v=19$m=65536,t=3,p=4$3rysWEg2zGPV/c5Z4yNtPA$zv9ZipCSeHXS4yMQNk5BmD7VcZuC4MzJIp/jKA8IFfU',
      NickName: 'Anna',
      Avatar: '',
      FirstName: 'Анастасия',
      LastName: 'Евдокимова',
      Department: 'Техническое зрение',
      AboutMe: 'Администратор проекта',
      Country: 'Беларусь',
      Region: 'Минская обл.',
      City: 'Минск',
      Address: 'пр. Независимости 9',
      PostCode: '220005',
      PhoneNumber: '+375296551214',
      Tags: DEFAULT_TAGS,
    },
    {
      IsActivated: true,
      IsOnline: false,
      Role: 'USER',
      EMail: 'user_102@gmail.com',
      Password: '$argon2id$v=19$m=65536,t=3,p=4$zmR0/98UYOJ43jA8TWU8ew$v9cb+0Gi416ZV8xovMxfeXZEii0R2XJsadMyhaeD1A4',
      NickName: 'SCh',
      Avatar: '',
      FirstName: 'Сергей',
      LastName: 'Чуриков',
      Department: 'Техническое зрение',
      AboutMe: 'Обычный пользователь',
      Country: 'Беларусь',
      Region: 'Минская обл.',
      City: 'Минск',
      Address: 'ул. Сурганова 33',
      PostCode: '220012',
      PhoneNumber: '+375296551214',
      Tags: DEFAULT_TAGS,
    },
    {
      IsActivated: true,
      IsOnline: false,
      Role: 'ENGINEER',
      EMail: 'user_103@gmail.com',
      Password: '$argon2id$v=19$m=65536,t=3,p=4$V4AFkPH4OZXuxfbMQeOg7w$gDtsYztK7KuoAfi3FjjJ1mVcFvznkbgUZ726qKF7iO8',
      NickName: 'OlGur',
      Avatar: '',
      FirstName: 'Ольга',
      LastName: 'Гуринович',
      Department: 'Техническое зрение',
      AboutMe: 'Инженер-конструктор',
      Country: 'Беларусь',
      Region: 'Минская обл.',
      City: 'Минск',
      Address: 'ул. Пролетарская 15',
      PostCode: '220019',
      PhoneNumber: '+375335569584',
      Tags: DEFAULT_TAGS,
    },
  ]

  /* Генерация уникальных ID для каждого пользователя */
  const SeedUsers = await Promise.all(
    SeedUsersData.map(async (userData) => ({
      UserID: await GenerateUniqueID('user', 4, 4),
      ...userData,
    })),
  )

  /* Заполняем фиктивными данными */
  for (const user of SeedUsers) {
    await prisma.user.create({
      data: user,
    })
  }
  console.log('Фиктивные пользователи созданы!')
}

seed()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
