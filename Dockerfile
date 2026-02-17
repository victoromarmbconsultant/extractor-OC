# Dockerfile multi-stage para OCsigma
# Stage 1: Build del frontend React
FROM node:18-alpine AS frontend-builder

WORKDIR /app/client

# Copiar package.json del cliente
COPY client/package*.json ./

# Instalar dependencias del frontend
RUN npm ci --only=production

# Copiar código fuente del cliente
COPY client/ ./

# Build del frontend para producción
RUN npm run build

# Stage 2: Imagen final con backend + frontend compilado
FROM node:18-alpine

# Establecer directorio de trabajo
WORKDIR /app

# Copiar package.json de la raíz y del servidor
COPY package*.json ./
COPY server/package*.json ./server/

# Instalar dependencias de producción
RUN npm ci --only=production && \
    cd server && \
    npm ci --only=production && \
    cd ..

# Copiar código del servidor
COPY server/ ./server/

# Copiar frontend compilado desde stage anterior
COPY --from=frontend-builder /app/client/build ./client/build

# Variables de entorno por defecto
ENV NODE_ENV=production
ENV PORT=8080

# Exponer puerto (Cloud Run usa 8080 por defecto)
EXPOSE 8080

# Comando para iniciar la aplicación
CMD ["npm", "start"]
