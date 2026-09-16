# Ares - Control Maestro
# Multi-stage build para imagen optimizada

# Stage 1: Dependencies
FROM node:18-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# Stage 2: Production
FROM node:18-alpine AS production
WORKDIR /app

# Crear usuario no-root por seguridad
RUN addgroup -g 1001 -S ares && \
    adduser -S ares -u 1001

# Copiar dependencias
COPY --from=deps /app/node_modules ./node_modules

# Copiar código fuente
COPY package*.json ./
COPY server.js ./
COPY database.js ./
COPY command_executor.js ./
COPY .env.example ./.env.example
COPY src/ ./src/
COPY lib/ ./lib/
COPY public/ ./public/
COPY data/ ./data/

# Crear directorio de datos si no existe
RUN mkdir -p /app/data

# Copiar archivos HTML
COPY index_gemini.html ./
COPY overlay.html ./
COPY style.css ./

# Cambiar permisos
RUN chown -R ares:ares /app

# Usuario no-root
USER ares

# Puerto
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1

# Environment
ENV NODE_ENV=production
ENV PORT=3000

# Iniciar servidor
CMD ["node", "server.js"]
