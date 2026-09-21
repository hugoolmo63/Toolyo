FROM node:20-slim AS builder

# Instalar OpenSSL y dependencias nativas requeridas por Prisma y ONNX
RUN apt-get update -y && apt-get install -y openssl ca-certificates libc6

WORKDIR /app

# Copiar configuración de dependencias
COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci

# Copiar código fuente y generar Prisma Client
COPY . .
RUN npx prisma generate

# Variables de entorno para la fase de build
ENV DATABASE_URL="postgresql://postgres:postgrespassword@localhost:5432/toolyo"
ENV SKIP_ENV_VALIDATION="true"

RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
