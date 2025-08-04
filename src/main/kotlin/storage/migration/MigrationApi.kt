package storage.migration

import io.ktor.server.application.*
import io.ktor.server.auth.*
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import io.ktor.http.*
import kotlinx.serialization.Serializable
import storage.FileStorageFactory

/**
 * Data classes for Migration API
 */
@Serializable
data class StartMigrationRequest(
    val sourceType: String, // "local" or "s3"
    val targetType: String, // "local" or "s3"
    val sourceConfig: StorageConfig,
    val targetConfig: StorageConfig,
    val migrationConfig: MigrationConfigDto? = null
)

@Serializable
data class StorageConfig(
    val basePath: String? = null, // for local storage
    val bucketName: String? = null, // for S3
    val region: String? = null // for S3
)

@Serializable
data class MigrationConfigDto(
    val batchSize: Int = 100,
    val maxRetries: Int = 3,
    val verifyAfterMigration: Boolean = true,
    val deleteSourceAfterMigration: Boolean = false,
    val parallelTransfers: Int = 5,
    val timeoutPerFileMs: Long = 300_000,
    val skipExistingFiles: Boolean = true
)

@Serializable
data class MigrationStatusResponse(
    val migrationId: String,
    val status: String,
    val processedFiles: Int,
    val totalFiles: Int,
    val processedSizeBytes: Long,
    val totalSizeBytes: Long,
    val percentage: Double,
    val transferRate: Double,
    val estimatedTimeRemaining: Long?,
    val currentFile: String?,
    val message: String
)

@Serializable
data class MigrationResultResponse(
    val migrationId: String,
    val status: String,
    val totalFiles: Int,
    val successfulFiles: Int,
    val failedFiles: Int,
    val totalSizeBytes: Long,
    val transferredSizeBytes: Long,
    val duration: Long,
    val message: String,
    val failedFileDetails: List<MigrationFailureDto>
)

@Serializable
data class MigrationFailureDto(
    val filePath: String,
    val error: String,
    val retryCount: Int
)

/**
 * Configure Storage Migration API routes
 */
fun Application.configureMigrationApi() {
    val migrationService = StorageMigrationServiceImpl()
    
    routing {
        route("/api/storage/migration") {
                
                // Start a new migration
                post("/start") {
                    try {
                        val request = call.receive<StartMigrationRequest>()
                        
                        // Create source storage
                        val sourceStorage = when (request.sourceType) {
                            "local" -> {
                                val basePath = request.sourceConfig.basePath 
                                    ?: throw IllegalArgumentException("basePath required for local storage")
                                FileStorageFactory.createLocalFileStorage(basePath)
                            }
                            "s3" -> {
                                val bucketName = request.sourceConfig.bucketName 
                                    ?: throw IllegalArgumentException("bucketName required for S3 storage")
                                val region = request.sourceConfig.region ?: "eu-central-1"
                                FileStorageFactory.createS3FileStorage(bucketName, region)
                            }
                            else -> throw IllegalArgumentException("Unsupported source storage type: ${request.sourceType}")
                        }
                        
                        // Create target storage
                        val targetStorage = when (request.targetType) {
                            "local" -> {
                                val basePath = request.targetConfig.basePath 
                                    ?: throw IllegalArgumentException("basePath required for local storage")
                                FileStorageFactory.createLocalFileStorage(basePath)
                            }
                            "s3" -> {
                                val bucketName = request.targetConfig.bucketName 
                                    ?: throw IllegalArgumentException("bucketName required for S3 storage")
                                val region = request.targetConfig.region ?: "eu-central-1"
                                FileStorageFactory.createS3FileStorage(bucketName, region)
                            }
                            else -> throw IllegalArgumentException("Unsupported target storage type: ${request.targetType}")
                        }
                        
                        // Convert DTO to domain object
                        val migrationConfig = request.migrationConfig?.let { dto ->
                            MigrationConfig(
                                batchSize = dto.batchSize,
                                maxRetries = dto.maxRetries,
                                verifyAfterMigration = dto.verifyAfterMigration,
                                deleteSourceAfterMigration = dto.deleteSourceAfterMigration,
                                parallelTransfers = dto.parallelTransfers,
                                timeoutPerFileMs = dto.timeoutPerFileMs,
                                skipExistingFiles = dto.skipExistingFiles
                            )
                        } ?: MigrationConfig()
                        
                        val migrationId = migrationService.startMigration(sourceStorage, targetStorage, migrationConfig)
                        
                        call.respond(HttpStatusCode.OK, mapOf("migrationId" to migrationId))
                        
                    } catch (e: Exception) {
                        call.respond(HttpStatusCode.BadRequest, mapOf("error" to e.message))
                    }
                }
                
                // Get migration status/progress
                get("/status/{migrationId}") {
                    val migrationId = call.parameters["migrationId"] ?: run {
                        call.respond(HttpStatusCode.BadRequest, mapOf("error" to "migrationId required"))
                        return@get
                    }
                    
                    val progress = migrationService.getMigrationProgress(migrationId)
                    if (progress != null) {
                        val response = MigrationStatusResponse(
                            migrationId = migrationId,
                            status = progress.status.name,
                            processedFiles = progress.processedFiles,
                            totalFiles = progress.totalFiles,
                            processedSizeBytes = progress.processedSizeBytes,
                            totalSizeBytes = progress.totalSizeBytes,
                            percentage = progress.percentage,
                            transferRate = progress.transferRate,
                            estimatedTimeRemaining = progress.estimatedTimeRemaining,
                            currentFile = progress.currentFile,
                            message = progress.message
                        )
                        call.respond(response)
                    } else {
                        call.respond(HttpStatusCode.NotFound, mapOf("error" to "Migration not found"))
                    }
                }
                
                // Get migration result
                get("/result/{migrationId}") {
                    val migrationId = call.parameters["migrationId"] ?: run {
                        call.respond(HttpStatusCode.BadRequest, mapOf("error" to "migrationId required"))
                        return@get
                    }
                    
                    val result = migrationService.getMigrationResult(migrationId)
                    if (result != null) {
                        val response = MigrationResultResponse(
                            migrationId = migrationId,
                            status = result.status.name,
                            totalFiles = result.totalFiles,
                            successfulFiles = result.successfulFiles,
                            failedFiles = result.failedFiles,
                            totalSizeBytes = result.totalSizeBytes,
                            transferredSizeBytes = result.transferredSizeBytes,
                            duration = result.duration,
                            message = result.message,
                            failedFileDetails = result.failedFileDetails.map { failure ->
                                MigrationFailureDto(
                                    filePath = failure.filePath,
                                    error = failure.error,
                                    retryCount = failure.retryCount
                                )
                            }
                        )
                        call.respond(response)
                    } else {
                        call.respond(HttpStatusCode.NotFound, mapOf("error" to "Migration result not found"))
                    }
                }
                
                // Cancel migration
                post("/cancel/{migrationId}") {
                    val migrationId = call.parameters["migrationId"] ?: run {
                        call.respond(HttpStatusCode.BadRequest, mapOf("error" to "migrationId required"))
                        return@post
                    }
                    
                    val cancelled = migrationService.cancelMigration(migrationId)
                    call.respond(mapOf("cancelled" to cancelled))
                }
                
                // List all migrations
                get("/list") {
                    val migrations = migrationService.getAllMigrations()
                    val response = migrations.map { result ->
                        MigrationResultResponse(
                            migrationId = "unknown", // We don't have ID in result
                            status = result.status.name,
                            totalFiles = result.totalFiles,
                            successfulFiles = result.successfulFiles,
                            failedFiles = result.failedFiles,
                            totalSizeBytes = result.totalSizeBytes,
                            transferredSizeBytes = result.transferredSizeBytes,
                            duration = result.duration,
                            message = result.message,
                            failedFileDetails = result.failedFileDetails.map { failure ->
                                MigrationFailureDto(
                                    filePath = failure.filePath,
                                    error = failure.error,
                                    retryCount = failure.retryCount
                                )
                            }
                        )
                    }
                    call.respond(response)
                }
                
                // Test endpoint for debugging
                post("/test") {
                    try {
                        val body = call.receiveText()
                        call.respond(mapOf("received" to body))
                    } catch (e: Exception) {
                        call.respond(HttpStatusCode.BadRequest, mapOf("error" to e.message))
                    }
                }
                
                // Convenience endpoint for local to S3 migration
                post("/local-to-s3") {
                    try {
                        val bodyText = call.receiveText()
                        println("DEBUG: Received body: $bodyText")
                        
                        // Parse manually using simple approach
                        val localBasePath = "C:/projects/learningcards/cas" // Default for now
                        val bucketName = "m3-cas1" // From config
                        val region = "eu-central-1" // From config
                        val config = MigrationConfig()
                        
                        println("DEBUG: Migration request - localBasePath: $localBasePath, bucketName: $bucketName, region: $region")
                        
                        val migrationId = migrationService.migrateLocalToS3(
                            localBasePath,
                            bucketName,
                            region,
                            config
                        )
                        
                        call.respond(HttpStatusCode.OK, mapOf("migrationId" to migrationId))
                        
                    } catch (e: Exception) {
                        e.printStackTrace()
                        call.respond(HttpStatusCode.BadRequest, mapOf("error" to e.message, "details" to e.toString()))
                    }
                }
        }
    }
}