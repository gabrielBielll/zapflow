# Dockerfile for the core-api service (Clojure)

# 1. Builder Stage: Build the uberjar
FROM clojure:lein-2.11.2 AS builder

# Set the working directory
WORKDIR /usr/src/app

# Copy the project definition file
COPY project.clj .

# Fetch dependencies. This is done as a separate step to leverage Docker layer caching.
RUN lein deps

# Copy the rest of the application source code
COPY src ./src

# Build the uberjar
RUN lein uberjar

# 2. Production Stage: Create the final image
FROM eclipse-temurin:21-jre-alpine

# Set the working directory
WORKDIR /usr/src/app

# Copy the uberjar from the builder stage
# The uberjar name is derived from the project name and version in project.clj
COPY --from=builder /usr/src/app/target/uberjar/core-api-0.1.0-SNAPSHOT-standalone.jar ./app.jar

# Expose the port the app runs on (assuming 8080 as a standard)
EXPOSE 8080

# The command to run the application
CMD ["java", "-jar", "app.jar"]
