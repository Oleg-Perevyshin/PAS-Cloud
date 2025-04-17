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
ENV NODE_ENV=production
ENV JWT_ACCESS_SECRET=${{ secrets.JWT_ACCESS_SECRET }}
ENV JWT_REFRESH_SECRET=${{ secrets.JWT_REFRESH_SECRET }}
ENV DATABASE_URL=${{ secrets.DATABASE_URL }}
ENV JWT_ACCESS_EXPIRE=${{ secrets.JWT_ACCESS_EXPIRE }}
ENV JWT_REFRESH_EXPIRE=${{ secrets.JWT_REFRESH_EXPIRE }}
ENV JWT_ACCESS_MAX_AGE=${{ secrets.JWT_ACCESS_MAX_AGE }}
ENV JWT_REFRESH_MAX_AGE=${{ secrets.JWT_REFRESH_MAX_AGE }}

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