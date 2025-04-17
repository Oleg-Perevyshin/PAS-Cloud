# Dockerfile
FROM node:22-alpine

# Описание образа
LABEL autor="Oleg Perevyshin"
LABEL email="oleg.perevyshin@gmail.com"
LABEL app="PAS-Cloud"

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем package.json в контейнер и устанавливаем зависимости
COPY package.json .
RUN npm install

# Копируем файлы в контейнер
COPY . .

# Генерируем Prisma клиент
RUN npx prisma generate

# Собираем проект
RUN npm run build

# Порт приложения
EXPOSE 2005

# Устанавливаем переменную окружения
ENV BODY_SIZE_LIMIT=64M

# Команда запуска приложения
CMD ["npm", "run", "preview"]


# Сборка и запуск докера
# docker build --pull --tag mcmega/pas-cloud .
# docker login
# docker push mcmega/pas-cloud
# docker run --rm --name pas-cloud --network="host" -p 2005:2005 mcmega/pas-cloud
#
# Локальная сборка Windows и MacOS
# docker build --tag mcmega/pas-cloud .
# docker run --rm --name pas-cloud -p 2005:2005 mcmega/pas-cloud
#
# Локальная сборка Linux
# docker build --pull --tag mcmega/pas-cloud .
# docker run --rm --name pas-cloud --network="host" mcmega/pas-cloud