FROM node:18-bullseye-slim AS build

WORKDIR /app


RUN apt-get update && \
    apt-get install -y openjdk-17-jdk-headless --no-install-recommends && \
    rm -rf /var/lib/apt/lists/*

ENV JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64
ENV PATH=$JAVA_HOME/bin:$PATH

RUN java -version && node -v && npm -v

# Gradle-related files (project root)
COPY gradlew .
COPY gradle gradle
COPY build.gradle.kts .
COPY settings.gradle.kts .
COPY gradle.properties .
COPY tsconfig.json .


COPY package.json package-lock.json ./
COPY src src
RUN chmod +x ./gradlew
RUN npm install
RUN ./gradlew build -x test --info --stacktrace

FROM amazoncorretto:17
COPY --from=build /app/build/libs/*.jar app.jar
COPY --from=build /app/src/main/resources/application.yaml .
COPY data ./data
COPY stopwords/deutsche_stopwords_nltk.txt ./stopwords/deutsche_stopwords_nltk.txt
EXPOSE 8080
ENTRYPOINT ["java", "-Dconfig.file=application.yaml", "-jar", "app.jar"]