plugins {
    alias(libs.plugins.kotlin.jvm)
    alias(libs.plugins.ktor)
    alias(libs.plugins.kotlin.plugin.serialization)
    id("com.github.node-gradle.node") version "7.0.2"
}

group = "com.shut"
version = "0.0.1"

application {
    mainClass = "io.ktor.server.netty.EngineMain"
    val isDevelopment: Boolean = project.ext.has("development")
    applicationDefaultJvmArgs = listOf("-Dio.ktor.development=$isDevelopment")
}

repositories {
    mavenCentral()
    maven { url = uri("https://maven.pkg.jetbrains.space/kotlin/p/kotlin/kotlin-js-wrappers") }
    gradlePluginPortal()
}

allprojects {
    repositories {
        mavenCentral()
    }
}

tasks.processResources {
    duplicatesStrategy = DuplicatesStrategy.EXCLUDE
}


kotlin {
    sourceSets {
        val main by getting {
            kotlin.srcDir("src/main/kotlin") // Standard, kann angepasst werden
            // Beispiel für ein zusätzliches Verzeichnis:
            // kotlin.srcDir("src/another/kotlin/source/folder")
            resources.srcDir("src/main/resources") // Standard für Ressourcen
        }
        val test by getting {
            kotlin.srcDir("src/test/kotlin") // Standard, kann angepasst werden
            resources.srcDir("src/test/resources") // Standard für Test-Ressourcen
        }
    }
}



dependencies {
    // AWS Lambda support
    implementation("com.amazonaws:aws-lambda-java-events:3.11.4")
    implementation("com.amazonaws:aws-lambda-java-core:1.2.3")
    
    implementation("software.amazon.awssdk:s3:2.29.15")
    implementation("com.google.genai:google-genai:1.7.0")
    implementation("com.google.auth:google-auth-library-oauth2-http:1.37.1")
    implementation("com.google.auth:google-auth-library-credentials:1.37.1")
    implementation("io.ktor:ktor-server-html-builder-jvm:3.2.1")
    implementation("org.apache.pdfbox:pdfbox:2.0.30")
    implementation("net.lingala.zip4j:zip4j:2.11.5")
    implementation("org.imgscalr:imgscalr-lib:4.2")
    implementation(libs.koin.ktor)
    implementation("com.zaxxer:HikariCP:6.3.0")
    implementation(libs.kotlin.asyncapi.ktor)
    implementation(libs.ktor.server.core)
    implementation(libs.ktor.serialization.kotlinx.json)
    implementation(libs.ktor.server.content.negotiation)
    implementation("org.jetbrains.exposed:exposed-core:0.61.0")
    implementation("org.jetbrains.exposed:exposed-dao:0.61.0")
    implementation("org.jetbrains.exposed:exposed-jdbc:0.61.0")
    implementation(libs.postgresql)
    implementation(libs.h2)
    implementation(libs.ktor.server.freemarker)
    implementation(libs.ktor.server.html.builder)
    implementation(libs.kotlinx.html)
    implementation(libs.ktor.serialization.gson)
    implementation(libs.ktor.server.call.logging)
    implementation(libs.ktor.server.call.id)
    implementation(libs.ktor.server.sse)
    implementation(libs.ktor.server.host.common)
    implementation(libs.ktor.server.status.pages)
    implementation(libs.ktor.server.webjars)
    implementation(libs.jquery)
    implementation(libs.ktor.server.request.validation)
    implementation(libs.ktor.server.sessions)
    implementation(libs.ktor.server.auth)
    implementation(libs.ktor.server.auth.jwt)
    implementation(libs.ktor.server.netty)
    implementation(libs.logback.classic)
    implementation(libs.ktor.server.config.yaml)
    implementation(libs.ktor.server.test.host)  // Move to implementation for Lambda
    implementation(libs.ktor.client.content.negotiation) // For Lambda client
    implementation(libs.ktor.client.core)
    testImplementation(libs.kotlin.test.junit)
}

// Bestehende Konfiguration beibehalten...

// Node.js und TypeScript Konfiguration
node {
    version.set("18.18.0")
    download.set(true)
}

tasks.register<com.github.gradle.node.npm.task.NpmTask>("buildTypeScript") {
    dependsOn(tasks.npmInstall)
    npmCommand.set(listOf("run", "build"))
}

// Commented out to avoid Node.js issues in deployment environments
// TypeScript should be built separately if needed
// tasks.named("processResources") {
//     dependsOn("buildTypeScript")
// }

// Lambda-specific fat JAR task
tasks.register<Jar>("buildLambdaJar") {
    // Don't depend on buildTypeScript to avoid Node.js issues in deployment environments
    // TypeScript should be built separately if needed
    archiveFileName.set("learning-cards.jar")
    destinationDirectory.set(file("."))  // Place JAR in root directory
    manifest {
        attributes["Main-Class"] = "com.shut.LambdaHandler"
    }
    from(sourceSets.main.get().output)
    dependsOn(configurations.runtimeClasspath)
    from({
        configurations.runtimeClasspath.get().filter { it.name.endsWith("jar") }.map { zipTree(it) }
    })
    duplicatesStrategy = DuplicatesStrategy.EXCLUDE
}

// Task to build and prepare for Lambda deployment
tasks.register("prepareLambdaDeployment") {
    dependsOn("buildLambdaJar")
    doLast {
        println("Lambda JAR built: learning-cards.jar")
        println("To deploy:")
        println("1. Run: terraform init")
        println("2. Run: terraform plan") 
        println("3. Run: terraform apply")
    }
}