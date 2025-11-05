# Dockerfile for the gateway service

# Use an official Node.js runtime as a parent image
FROM node:20-alpine

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json to the working directory
COPY package.json ./
COPY package-lock.json ./

# Install any needed packages
RUN npm install

# Copy the rest of the application's source code
COPY . .

# Your app binds to port 8080, so expose that port
EXPOSE 8080

# Define the command to run your app
CMD [ "node", "index.js" ]
