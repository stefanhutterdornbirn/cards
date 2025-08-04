package storage.migration

import java.time.LocalDateTime

/**
 * Result of a migration operation
 */
data class MigrationResult(
    val status: MigrationStatus,
    val totalFiles: Int,
    val successfulFiles: Int,
    val failedFiles: Int,
    val failedFileDetails: List<MigrationFailure>,
    val totalSizeBytes: Long,
    val transferredSizeBytes: Long,
    val duration: Long, // milliseconds
    val startTime: LocalDateTime,
    val endTime: LocalDateTime?,
    val message: String
)

/**
 * Status of the migration process
 */
enum class MigrationStatus {
    NOT_STARTED,
    IN_PROGRESS,
    COMPLETED,
    FAILED,
    CANCELLED,
    VERIFICATION_IN_PROGRESS,
    VERIFICATION_COMPLETED,
    VERIFICATION_FAILED
}

/**
 * Details about a failed file migration
 */
data class MigrationFailure(
    val filePath: String,
    val error: String,
    val timestamp: LocalDateTime,
    val retryCount: Int = 0
)

/**
 * Progress information during migration
 */
data class MigrationProgress(
    val status: MigrationStatus,
    val processedFiles: Int,
    val totalFiles: Int,
    val processedSizeBytes: Long,
    val totalSizeBytes: Long,
    val currentFile: String?,
    val percentage: Double,
    val estimatedTimeRemaining: Long?, // milliseconds
    val transferRate: Double, // bytes per second
    val startTime: LocalDateTime,
    val message: String
)

/**
 * Configuration for migration process
 */
data class MigrationConfig(
    val batchSize: Int = 100,
    val maxRetries: Int = 3,
    val verifyAfterMigration: Boolean = true,
    val deleteSourceAfterMigration: Boolean = false,
    val parallelTransfers: Int = 5,
    val timeoutPerFileMs: Long = 300_000, // 5 minutes
    val skipExistingFiles: Boolean = true
)

/**
 * Result of file verification
 */
data class VerificationResult(
    val totalFiles: Int,
    val verifiedFiles: Int,
    val mismatchedFiles: List<String>,
    val missingFiles: List<String>,
    val success: Boolean,
    val details: String
)