package storage.migration

import storage.FileStorage
import storage.FileStorageFactory
import kotlinx.coroutines.*
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.sync.Semaphore
import kotlinx.coroutines.sync.withPermit
import java.time.LocalDateTime
import java.util.UUID
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.atomic.AtomicLong
import java.util.concurrent.atomic.AtomicInteger

/**
 * Implementation of StorageMigrationService
 */
class StorageMigrationServiceImpl : StorageMigrationService, StorageMigrationConvenience {
    
    // Store ongoing migrations
    private val migrations = ConcurrentHashMap<String, MigrationInfo>()
    private val progressFlows = ConcurrentHashMap<String, MutableSharedFlow<MigrationProgress>>()
    
    // Coroutine scope for migration tasks
    private val migrationScope = CoroutineScope(Dispatchers.IO + SupervisorJob())
    
    private data class MigrationInfo(
        val id: String,
        val sourceStorage: FileStorage,
        val targetStorage: FileStorage,
        val config: MigrationConfig,
        val job: Job,
        var result: MigrationResult? = null,
        var progress: MigrationProgress? = null
    )
    
    override suspend fun startMigration(
        sourceStorage: FileStorage,
        targetStorage: FileStorage,
        config: MigrationConfig
    ): String {
        val migrationId = UUID.randomUUID().toString()
        val progressFlow = MutableSharedFlow<MigrationProgress>(replay = 1)
        progressFlows[migrationId] = progressFlow
        
        val job = migrationScope.launch {
            try {
                performMigration(migrationId, sourceStorage, targetStorage, config, progressFlow)
            } catch (e: Exception) {
                val failureResult = MigrationResult(
                    status = MigrationStatus.FAILED,
                    totalFiles = 0,
                    successfulFiles = 0,
                    failedFiles = 0,
                    failedFileDetails = listOf(MigrationFailure(
                        filePath = "N/A",
                        error = e.message ?: "Unknown error",
                        timestamp = LocalDateTime.now()
                    )),
                    totalSizeBytes = 0,
                    transferredSizeBytes = 0,
                    duration = 0,
                    startTime = LocalDateTime.now(),
                    endTime = LocalDateTime.now(),
                    message = "Migration failed: ${e.message}"
                )
                migrations[migrationId]?.let { info ->
                    migrations[migrationId] = info.copy(result = failureResult)
                }
            }
        }
        
        val migrationInfo = MigrationInfo(
            id = migrationId,
            sourceStorage = sourceStorage,
            targetStorage = targetStorage,
            config = config,
            job = job
        )
        
        migrations[migrationId] = migrationInfo
        return migrationId
    }
    
    private suspend fun performMigration(
        migrationId: String,
        sourceStorage: FileStorage,
        targetStorage: FileStorage,
        config: MigrationConfig,
        progressFlow: MutableSharedFlow<MigrationProgress>
    ) {
        val startTime = LocalDateTime.now()
        val failures = mutableListOf<MigrationFailure>()
        
        // Get list of all files to migrate
        val allFiles = sourceStorage.listFiles()
        val totalFiles = allFiles.size
        var totalSizeBytes = 0L
        
        // Calculate total size
        allFiles.forEach { filePath ->
            sourceStorage.getFileSize(filePath)?.let { size ->
                totalSizeBytes += size
            }
        }
        
        val processedFiles = AtomicInteger(0)
        val processedSize = AtomicLong(0)
        val successfulFiles = AtomicInteger(0)
        val startTimeMs = System.currentTimeMillis()
        
        // Send initial progress
        val initialProgress = MigrationProgress(
            status = MigrationStatus.IN_PROGRESS,
            processedFiles = 0,
            totalFiles = totalFiles,
            processedSizeBytes = 0,
            totalSizeBytes = totalSizeBytes,
            currentFile = null,
            percentage = 0.0,
            estimatedTimeRemaining = null,
            transferRate = 0.0,
            startTime = startTime,
            message = "Starting migration of $totalFiles files"
        )
        progressFlow.emit(initialProgress)
        
        // Process files in batches
        allFiles.chunked(config.batchSize).forEach { batch ->
            // Process batch with limited parallelism
            val semaphore = Semaphore(config.parallelTransfers)
            
            coroutineScope {
                batch.map { filePath ->
                    async {
                        semaphore.withPermit {
                            migrateSingleFile(
                                filePath,
                                sourceStorage,
                                targetStorage,
                                config,
                                failures,
                                processedFiles,
                                processedSize,
                                successfulFiles,
                                totalFiles,
                                totalSizeBytes,
                                startTimeMs,
                                progressFlow,
                                startTime
                            )
                        }
                    }
                }.awaitAll()
            }
        }
        
        // Final result
        val endTime = LocalDateTime.now()
        val duration = System.currentTimeMillis() - startTimeMs
        
        val result = MigrationResult(
            status = if (failures.isEmpty()) MigrationStatus.COMPLETED else MigrationStatus.FAILED,
            totalFiles = totalFiles,
            successfulFiles = successfulFiles.get(),
            failedFiles = failures.size,
            failedFileDetails = failures,
            totalSizeBytes = totalSizeBytes,
            transferredSizeBytes = processedSize.get(),
            duration = duration,
            startTime = startTime,
            endTime = endTime,
            message = if (failures.isEmpty()) {
                "Migration completed successfully"
            } else {
                "Migration completed with ${failures.size} failures"
            }
        )
        
        migrations[migrationId]?.let { info ->
            migrations[migrationId] = info.copy(result = result)
        }
        
        // Send final progress
        val finalProgress = MigrationProgress(
            status = result.status,
            processedFiles = totalFiles,
            totalFiles = totalFiles,
            processedSizeBytes = processedSize.get(),
            totalSizeBytes = totalSizeBytes,
            currentFile = null,
            percentage = 100.0,
            estimatedTimeRemaining = 0,
            transferRate = if (duration > 0) processedSize.get().toDouble() / (duration / 1000.0) else 0.0,
            startTime = startTime,
            message = result.message
        )
        progressFlow.emit(finalProgress)
    }
    
    private suspend fun migrateSingleFile(
        filePath: String,
        sourceStorage: FileStorage,
        targetStorage: FileStorage,
        config: MigrationConfig,
        failures: MutableList<MigrationFailure>,
        processedFiles: AtomicInteger,
        processedSize: AtomicLong,
        successfulFiles: AtomicInteger,
        totalFiles: Int,
        totalSizeBytes: Long,
        startTimeMs: Long,
        progressFlow: MutableSharedFlow<MigrationProgress>,
        startTime: LocalDateTime
    ) {
        var retryCount = 0
        var success = false
        
        while (retryCount <= config.maxRetries && !success) {
            try {
                // Check if file already exists in target (skip if configured)
                if (config.skipExistingFiles && targetStorage.fileExists(filePath)) {
                    success = true
                    successfulFiles.incrementAndGet()
                    break
                }
                
                // Read from source
                val inputStream = sourceStorage.readFile(filePath)
                if (inputStream == null) {
                    throw IllegalStateException("File not found in source: $filePath")
                }
                
                // Copy to target with timeout
                withTimeout(config.timeoutPerFileMs) {
                    inputStream.use { stream ->
                        targetStorage.saveFile(filePath, stream)
                    }
                }
                
                // Verify if configured
                if (config.verifyAfterMigration) {
                    val sourceSize = sourceStorage.getFileSize(filePath)
                    val targetSize = targetStorage.getFileSize(filePath)
                    if (sourceSize != targetSize) {
                        throw IllegalStateException("Size mismatch: source=$sourceSize, target=$targetSize")
                    }
                }
                
                success = true
                successfulFiles.incrementAndGet()
                
            } catch (e: Exception) {
                retryCount++
                if (retryCount > config.maxRetries) {
                    synchronized(failures) {
                        failures.add(MigrationFailure(
                            filePath = filePath,
                            error = e.message ?: "Unknown error",
                            timestamp = LocalDateTime.now(),
                            retryCount = retryCount - 1
                        ))
                    }
                }
                delay(1000L * retryCount) // Exponential backoff
            }
        }
        
        // Update progress
        val currentProcessed = processedFiles.incrementAndGet()
        val fileSize = sourceStorage.getFileSize(filePath) ?: 0L
        val currentSize = processedSize.addAndGet(fileSize)
        
        val elapsedMs = System.currentTimeMillis() - startTimeMs
        val percentage = (currentProcessed.toDouble() / totalFiles) * 100
        val transferRate = if (elapsedMs > 0) currentSize.toDouble() / (elapsedMs / 1000.0) else 0.0
        val estimatedTimeRemaining = if (transferRate > 0) {
            ((totalSizeBytes - currentSize) / transferRate * 1000).toLong()
        } else null
        
        val progress = MigrationProgress(
            status = MigrationStatus.IN_PROGRESS,
            processedFiles = currentProcessed,
            totalFiles = totalFiles,
            processedSizeBytes = currentSize,
            totalSizeBytes = totalSizeBytes,
            currentFile = filePath,
            percentage = percentage,
            estimatedTimeRemaining = estimatedTimeRemaining,
            transferRate = transferRate,
            startTime = startTime,
            message = "Migrating: $filePath ($currentProcessed/$totalFiles)"
        )
        
        migrations[progressFlow.toString()]?.let { info ->
            migrations[progressFlow.toString()] = info.copy(progress = progress)
        }
        
        progressFlow.emit(progress)
    }
    
    override suspend fun getMigrationProgress(migrationId: String): MigrationProgress? {
        return migrations[migrationId]?.progress
    }
    
    override suspend fun getMigrationResult(migrationId: String): MigrationResult? {
        return migrations[migrationId]?.result
    }
    
    override suspend fun cancelMigration(migrationId: String): Boolean {
        val migration = migrations[migrationId] ?: return false
        migration.job.cancel()
        return true
    }
    
    override fun getMigrationProgressFlow(migrationId: String): Flow<MigrationProgress> {
        return progressFlows[migrationId]?.asSharedFlow() ?: emptyFlow()
    }
    
    override suspend fun verifyMigration(
        sourceStorage: FileStorage,
        targetStorage: FileStorage,
        migrationId: String
    ): VerificationResult {
        val sourceFiles = sourceStorage.listFiles()
        val targetFiles = targetStorage.listFiles().toSet()
        
        val missingFiles = mutableListOf<String>()
        val mismatchedFiles = mutableListOf<String>()
        var verifiedFiles = 0
        
        sourceFiles.forEach { filePath ->
            if (!targetFiles.contains(filePath)) {
                missingFiles.add(filePath)
            } else {
                val sourceSize = sourceStorage.getFileSize(filePath)
                val targetSize = targetStorage.getFileSize(filePath)
                if (sourceSize != targetSize) {
                    mismatchedFiles.add(filePath)
                } else {
                    verifiedFiles++
                }
            }
        }
        
        val success = missingFiles.isEmpty() && mismatchedFiles.isEmpty()
        val details = buildString {
            append("Verification completed. ")
            append("Verified: $verifiedFiles files. ")
            if (missingFiles.isNotEmpty()) {
                append("Missing: ${missingFiles.size} files. ")
            }
            if (mismatchedFiles.isNotEmpty()) {
                append("Mismatched: ${mismatchedFiles.size} files.")
            }
        }
        
        return VerificationResult(
            totalFiles = sourceFiles.size,
            verifiedFiles = verifiedFiles,
            mismatchedFiles = mismatchedFiles,
            missingFiles = missingFiles,
            success = success,
            details = details
        )
    }
    
    override suspend fun getAllMigrations(): List<MigrationResult> {
        return migrations.values.mapNotNull { it.result }
    }
    
    override suspend fun cleanupOldMigrations(olderThanDays: Int): Int {
        val cutoffTime = LocalDateTime.now().minusDays(olderThanDays.toLong())
        val toRemove = migrations.filter { (_, info) ->
            info.result?.endTime?.isBefore(cutoffTime) == true
        }
        
        toRemove.forEach { (id, _) ->
            migrations.remove(id)
            progressFlows.remove(id)
        }
        
        return toRemove.size
    }
    
    // Convenience methods
    override suspend fun migrateLocalToS3(
        localBasePath: String,
        s3BucketName: String,
        s3Region: String,
        config: MigrationConfig
    ): String {
        val localStorage = FileStorageFactory.createLocalFileStorage(localBasePath)
        val s3Storage = FileStorageFactory.createS3FileStorage(s3BucketName, s3Region)
        return startMigration(localStorage, s3Storage, config)
    }
    
    override suspend fun migrateS3ToLocal(
        s3BucketName: String,
        localBasePath: String,
        s3Region: String,
        config: MigrationConfig
    ): String {
        val s3Storage = FileStorageFactory.createS3FileStorage(s3BucketName, s3Region)
        val localStorage = FileStorageFactory.createLocalFileStorage(localBasePath)
        return startMigration(s3Storage, localStorage, config)
    }
}