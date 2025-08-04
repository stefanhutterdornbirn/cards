package storage.migration

import storage.FileStorage
import kotlinx.coroutines.flow.Flow

/**
 * Service for migrating files between different storage backends
 */
interface StorageMigrationService {
    
    /**
     * Start migration from source to target storage
     * Returns immediately with migration ID, actual migration runs asynchronously
     */
    suspend fun startMigration(
        sourceStorage: FileStorage,
        targetStorage: FileStorage,
        config: MigrationConfig = MigrationConfig()
    ): String // Migration ID
    
    /**
     * Get current migration progress
     */
    suspend fun getMigrationProgress(migrationId: String): MigrationProgress?
    
    /**
     * Get final migration result
     */
    suspend fun getMigrationResult(migrationId: String): MigrationResult?
    
    /**
     * Cancel ongoing migration
     */
    suspend fun cancelMigration(migrationId: String): Boolean
    
    /**
     * Get a flow of progress updates for a migration
     */
    fun getMigrationProgressFlow(migrationId: String): Flow<MigrationProgress>
    
    /**
     * Verify that all files were migrated correctly
     */
    suspend fun verifyMigration(
        sourceStorage: FileStorage,
        targetStorage: FileStorage,
        migrationId: String
    ): VerificationResult
    
    /**
     * Get list of all migrations (for monitoring/debugging)
     */
    suspend fun getAllMigrations(): List<MigrationResult>
    
    /**
     * Clean up completed migrations older than specified days
     */
    suspend fun cleanupOldMigrations(olderThanDays: Int = 30): Int
}

/**
 * Convenience methods for common migration scenarios
 */
interface StorageMigrationConvenience {
    
    /**
     * Migrate from local storage to S3
     */
    suspend fun migrateLocalToS3(
        localBasePath: String,
        s3BucketName: String,
        s3Region: String = "eu-central-1",
        config: MigrationConfig = MigrationConfig()
    ): String
    
    /**
     * Migrate from S3 to local storage
     */
    suspend fun migrateS3ToLocal(
        s3BucketName: String,
        localBasePath: String,
        s3Region: String = "eu-central-1",
        config: MigrationConfig = MigrationConfig()
    ): String
}