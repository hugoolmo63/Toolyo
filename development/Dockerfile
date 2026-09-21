FROM node:20-alpine AS base

WORKDIR /app

# Instalar dependencias necesarias
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci

# Copiar el resto del código
COPY . .
RUN npx prisma generate

# Variables dummy para la fase de compilación de Next.js
ENV DATABASE_URL="postgresql://postgres:postgrespassword@localhost:5432/toolyo"
ENV SKIP_ENV_VALIDATION="true"

RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
