// prisma/seed.ts
import { PrismaClient } from '@prisma/client'
import { Prisma } from '@prisma/client'

const prisma = new PrismaClient()
const DEFAULT_TAGS = [
  { id: '1', name: 'Tag 1', color: 'bg-stone-400 border-2 !border-stone-400' },
  { id: '2', name: 'Tag 2', color: 'bg-red-400 border-2 !border-red-400' },
  { id: '3', name: 'Tag 3', color: 'bg-orange-400 border-2 !border-orange-400' },
  { id: '4', name: 'Tag 4', color: 'bg-yellow-400 border-2 !border-yellow-400' },
  { id: '5', name: 'Tag 5', color: 'bg-lime-400 border-2 !border-lime-400' },
  { id: '6', name: 'Tag 6', color: 'bg-emerald-400 border-2 !border-emerald-400' },
  { id: '7', name: 'Tag 7', color: 'bg-cyan-400 border-2 !border-cyan-400' },
  { id: '8', name: 'Tag 8', color: 'bg-blue-400 border-2 !border-blue-400' },
  { id: '9', name: 'Tag 9', color: 'bg-violet-400 border-2 !border-violet-400' },
  { id: '10', name: 'Tag 10', color: 'bg-fuchsia-400 border-2 !border-fuchsia-400' },
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
    {
      IsActivated: true,
      IsOnline: false,
      Role: 'MANAGER',
      EMail: 'user_104@gmail.com',
      Password: '$argon2id$v=19$m=65536,t=3,p=4$cQr7WMka597cn2ZRe8f4QA$zULE+m8ZfBKpwaTqNlbz7lP17l5NNA6WzHbEJKnSoJI',
      NickName: 'Caramel',
      Avatar: '',
      FirstName: 'Елена',
      LastName: 'Петрова',
      Department: 'Техническое зрение',
      AboutMe: 'Менеджер проектов',
      Country: 'Беларусь',
      Region: 'Минская обл.',
      City: 'Минск',
      Address: 'ул. Ленина 20',
      PostCode: '220030',
      PhoneNumber: '+375296859516',
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
