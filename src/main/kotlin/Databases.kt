package com.shut


import com.zaxxer.hikari.HikariConfig
import com.zaxxer.hikari.HikariDataSource
import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import org.jetbrains.exposed.sql.Database
import org.jetbrains.exposed.sql.transactions.TransactionManager
import dms.service.DMSService
import billing.service.BillingService


fun Application.configureDatabases() {
    try {
        configureExposed()
        log.info("Database configuration completed successfully")
    } catch (e: Exception) {
        log.error("Database configuration failed, but continuing application startup", e)
        // Don't throw the exception - let the app start without DB
    }

    try {
        val ucService = UserCredentialsService()
        val mcardService = MCardService()
        var lernmaterialService = LernmaterialService()
        val counterService = CounterService()
        val buchungsKartenService = BuchungsKartenService()
        val groupService = GroupService()
        val userGroupService = UserGroupService()
        val roleService = RoleService()
        val groupRoleService = GroupRoleService()
        val productService = ProductService()
        val groupProductService = GroupProductService()
        val learningCardService = LearningCardService()
        val learningMaterialService = LearningMaterialService()
        val learningTopicService = LearningTopicService()
        val dmsService = DMSService()
        val billingService = BillingService()
        
        groupService.initialize()
        roleService.initialize()
        ucService.initialize()
        userGroupService.initialize()
        groupRoleService.initialize()
        productService.initialize()
        groupProductService.initialize()
        learningCardService.initialize()
        learningMaterialService.initialize()
        learningTopicService.initialize()
        mcardService.initialize()
        lernmaterialService.initialize()
        counterService.initialize()
        buchungsKartenService.initialize()
        dmsService.initialize()
        billingService.initialize()
        
        log.info("All database services initialized successfully")
    } catch (e: Exception) {
        log.error("Service initialization failed, but continuing", e)
    }
    
    // Setup admin user groups and roles after all tables are created
    try {
        // Note: This will only work if ucService was successfully initialized
        // ucService.setupAdminUserGroupsAndRoles()
        log.info("Skipping admin setup for now to avoid blocking startup")
    } catch (e: Exception) {
        log.error("Admin setup failed", e)
    }
    routing {
    }
}

fun Application.configureExposed() {
    // Try to get database configuration from environment variables first (for AWS Lambda)
    // Fall back to application configuration if not found
    val url = System.getenv("DB_HOST")?.let { host ->
        val port = System.getenv("DB_PORT") ?: "5432"
        val dbName = System.getenv("DB_NAME") ?: "learningcards"
        "jdbc:postgresql://$host:$port/$dbName"
    } ?: environment.config.property("postgres.url").getString()
    
    val user = System.getenv("DB_USER") 
        ?: environment.config.property("postgres.user").getString()
    
    val passwordValue = System.getenv("DB_PASSWORD") 
        ?: environment.config.property("postgres.password").getString()

    // Log connection details (without password) for debugging
    log.info("Database connection details:")
    log.info("URL: $url")
    log.info("User: $user")
    log.info("Using environment variables: ${System.getenv("DB_HOST") != null}")
    
    // Test DNS resolution
    try {
        val dbHost = System.getenv("DB_HOST") ?: "unknown"
        val address = java.net.InetAddress.getByName(dbHost)
        log.info("DNS resolution successful for $dbHost: ${address.hostAddress}")
    } catch (e: Exception) {
        log.error("DNS resolution failed for database host", e)
    }

    val config = HikariConfig().apply {
        driverClassName = "org.postgresql.Driver"
        jdbcUrl = url
        username = user
        password = passwordValue
        maximumPoolSize = 1  // Single connection per Lambda instance
        minimumIdle = 1      // Always keep one ready
        isAutoCommit = false
        transactionIsolation = "TRANSACTION_REPEATABLE_READ"
        
        // Lambda optimizations with increased timeouts for Aurora cold start
        connectionTimeout = 45000      // 45 seconds - Aurora can take time to wake up
        idleTimeout = 600000          // 10 minutes - keep alive longer
        maxLifetime = 1200000         // 20 minutes - longer lifetime
        leakDetectionThreshold = 60000 // 60 seconds - slower leak detection
        
        // Performance optimizations
        addDataSourceProperty("cachePrepStmts", "true")
        addDataSourceProperty("prepStmtCacheSize", "250")
        addDataSourceProperty("prepStmtCacheSqlLimit", "2048")
        addDataSourceProperty("useServerPrepStmts", "true")
    }

    try {
        val dataSource = HikariDataSource(config)
        Database.connect(dataSource)
        log.info("Database connection established successfully")
        
        // Test the connection
        dataSource.connection.use { conn ->
            val stmt = conn.createStatement()
            val rs = stmt.executeQuery("SELECT 1")
            if (rs.next()) {
                log.info("Database connectivity test passed")
            }
        }
    } catch (e: Exception) {
        log.error("Failed to initialize database connection", e)
        log.error("Connection URL: $url")
        log.error("Error type: ${e.javaClass.simpleName}")
        log.error("Error message: ${e.message}")
        
        // For Aurora Serverless, it might need time to scale up
        log.info("Aurora Serverless might be scaling up, retrying in 30 seconds...")
        Thread.sleep(30000)
        
        try {
            val dataSource = HikariDataSource(config)
            Database.connect(dataSource)
            log.info("Database connection established on retry")
        } catch (retryException: Exception) {
            log.error("Retry failed", retryException)
            throw retryException
        }
    }
}