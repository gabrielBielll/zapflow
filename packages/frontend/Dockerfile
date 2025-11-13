# Dockerfile for the frontend service

# 1. Builder Stage: Build the Next.js application
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package.json ./
COPY package-lock.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application source code
COPY . .

# Build the Next.js application
RUN npm run build

# 2. Production Stage: Create the final, lean image
FROM node:20-alpine AS production

# Set working directory
WORKDIR /app

# Copie o package.json E o package-lock.json
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/package-lock.json ./package-lock.json

# Instale APENAS as dependências de produção
RUN npm install --omit=dev

# Copy built assets from the builder stage
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/next.config.ts ./next.config.ts

# Expõe a porta que o Render espera (definida no render.yaml)
EXPOSE 10000

# Inicia o app usando a variável $PORT fornecida pelo Render
CMD ["sh", "-c", "npm start -- -p $PORT"]
