# Dockerfile for the ai-service (TypeScript)

# 1. Builder Stage: Compile the TypeScript code
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package.json ./
COPY package-lock.json ./

# Install all dependencies (including devDependencies)
RUN npm install

# Copy the rest of the source code
COPY . .

# Compile TypeScript to JavaScript
RUN npm run build

# 2. Production Stage: Create the final lean image
FROM node:20-alpine AS production

WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package.json ./
COPY package-lock.json ./

# Install ONLY production dependencies
RUN npm install --omit=dev

# Copy the compiled code from the builder stage
COPY --from=builder /usr/src/app/dist ./dist

# Expose a port (assuming 8080 as a standard for APIs)
EXPOSE 8080

# The command to run the application
CMD [ "node", "dist/index.js" ]
