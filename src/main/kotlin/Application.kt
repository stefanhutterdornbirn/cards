package com.shut

import io.ktor.server.application.*
import org.koin.ktor.plugin.Koin
import dms.routing.configureDMSRouting
import billing.routing.configureBillingRouting
import io.ktor.server.config.ApplicationConfig
import io.ktor.server.config.tryGetString
import storage.FileStorageProvider
import storage.migration.configureMigrationApi
import migration.configureMigrationManagementRouting

fun main(args: Array<String>) {
    io.ktor.server.netty.EngineMain.main(args)
}

fun Application.module() {

    log.info("Reading Configuration file ...")
    val config = environment.config
    var configMap = config.toMap()
    configMap.forEach { (k, v) -> log.info("$k: $v") }
    log.info(" .... reading Configuration file DOME")

    // Initialize FileStorage as the first step
    try {
        log.info("Initializing FileStorage...")
        FileStorageProvider.initialize(environment.config)
        log.info("FileStorage initialized successfully")
    } catch (e: Exception) {
        log.error("Failed to initialize FileStorage", e)
        throw e
    }
    
    install(Koin) {
        modules(appModule)
    }
    configureHTTP()
    configureSerialization()
    configureDatabases()
    configureTemplating()
    configureMonitoring()
    configureSecurity()
    configureRouting()
    configureAssessmentRouting()
    configureValidation()
    configureFrontend()
    configureDMSRouting()
    configureBillingRouting()
    configureMigrationApi()
    configureMigrationManagementRouting()
}

