# syntax=docker/dockerfile:1
# ---------------------------------------------------------------------
# VIALUNEXA · API REST (Java 21 + Spring Boot)
# Etapa 1: compila con Maven · Etapa 2: solo el JRE y el .jar
# ---------------------------------------------------------------------
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app

# Primero las dependencias (se reutilizan en caché si el pom no cambia)
COPY pom.xml .
RUN mvn -B -q dependency:go-offline

COPY src ./src
# Las pruebas se ejecutan en el pipeline de CI antes de desplegar
RUN mvn -B -q package -DskipTests

# ---------------------------------------------------------------------
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

RUN addgroup -S app && adduser -S app -G app
COPY --from=build /app/target/*.jar app.jar
USER app

# Ajuste de memoria para planes pequeños (p. ej. 512 MB en Render Free)
ENV PORT=8081 \
    JAVA_OPTS="-XX:MaxRAMPercentage=75 -XX:+UseSerialGC -Xss512k"

EXPOSE 8081
HEALTHCHECK --interval=30s --timeout=5s --start-period=60s \
  CMD wget -qO- http://127.0.0.1:${PORT}/actuator/health || exit 1

ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -jar app.jar"]
