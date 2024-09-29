# --------------------------------
# 1. Этап сборки (Builder Stage)
# --------------------------------
FROM node:18-alpine AS builder

# Устанавливаем рабочую директорию
WORKDIR /usr/src/app

# Копируем package.json и package-lock.json
COPY package*.json ./

# Устанавливаем все зависимости, включая dev-зависимости
RUN npm install

# Копируем исходный код приложения
COPY . .

# Сборка TypeScript проекта
RUN npm run build

# --------------------------------
# 2. Production Stage
# --------------------------------
FROM node:18-alpine AS production

# Устанавливаем рабочую директорию
WORKDIR /usr/src/app

# Копируем только необходимые файлы
COPY package*.json ./

# Устанавливаем только production-зависимости
RUN npm ci

# Копируем скомпилированные файлы из этапа сборки
COPY --from=builder /usr/src/app/dist ./dist

# Копируем папку миграций и ormconfig.ts
COPY --from=builder /usr/src/app/src/migrations ./src/migrations
COPY --from=builder /usr/src/app/ormconfig.ts ./ormconfig.ts

# Копируем OpenAPI файл
COPY --from=builder /usr/src/app/openApi/openapi.yaml ./openApi/openapi.yaml
