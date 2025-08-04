package storage.migration

import storage.FileStorageFactory
import kotlinx.coroutines.*
import kotlinx.coroutines.flow.collect

/**
 * Command Line Interface for Storage Migration
 * Usage: java -cp ... storage.migration.MigrationCliKt [args]
 */

suspend fun main(args: Array<String>) {
    if (args.size < 4) {
        printUsage()
        return
    }
    
    val command = args[0]
    
    when (command) {
        "migrate" -> runMigration(args.drop(1))
        "status" -> showStatus(args.drop(1))
        else -> {
            println("Unknown command: $command")
            printUsage()
        }
    }
}

private fun printUsage() {
    println("""
        Storage Migration CLI
        
        Usage:
          migrate <source-type> <source-config> <target-type> <target-config> [options]
          status <migration-id>
          
        Source/Target Types:
          local:<path>          - Local file system storage
          s3:<bucket>:<region>  - AWS S3 storage
          
        Examples:
          # Migrate from local to S3
          migrate local:/tmp/files s3:my-bucket:eu-central-1
          
          # Migrate from S3 to local
          migrate s3:my-bucket:eu-central-1 local:/backup/files
          
        Options:
          --batch-size <n>         Batch size for processing (default: 100)
          --max-retries <n>        Maximum retries per file (default: 3)
          --parallel <n>           Parallel transfers (default: 5)
          --verify                 Verify after migration (default: true)
          --delete-source          Delete source files after migration (default: false)
          --skip-existing          Skip existing files (default: true)
    """.trimIndent())
}

private suspend fun runMigration(args: List<String>) {
    if (args.size < 3) {
        println("Error: Not enough arguments for migration")
        printUsage()
        return
    }
    
    try {
        val sourceConfig = parseStorageConfig(args[0])
        val targetConfig = parseStorageConfig(args[1])
        val migrationOptions = parseMigrationOptions(args.drop(2))
        
        println("Starting migration...")
        println("Source: ${sourceConfig.first} (${sourceConfig.second})")
        println("Target: ${targetConfig.first} (${targetConfig.second})")
        
        val sourceStorage = createStorage(sourceConfig.first, sourceConfig.second)
        val targetStorage = createStorage(targetConfig.first, targetConfig.second)
        
        val migrationService = StorageMigrationServiceImpl()
        val migrationId = migrationService.startMigration(sourceStorage, targetStorage, migrationOptions)
        
        println("Migration started with ID: $migrationId")
        
        // Monitor progress
        migrationService.getMigrationProgressFlow(migrationId).collect { progress ->
            val percentage = String.format("%.1f", progress.percentage)
            val rate = formatTransferRate(progress.transferRate)
            val eta = formatETA(progress.estimatedTimeRemaining)
            
            println("Progress: $percentage% (${progress.processedFiles}/${progress.totalFiles}) - $rate - ETA: $eta")
            println("Current: ${progress.currentFile ?: "N/A"}")
            
            if (progress.status == MigrationStatus.COMPLETED || progress.status == MigrationStatus.FAILED) {
                println("Migration ${progress.status}: ${progress.message}")
                return@collect
            }
        }
        
        // Show final result
        val result = migrationService.getMigrationResult(migrationId)
        if (result != null) {
            println("\n=== Migration Result ===")
            println("Status: ${result.status}")
            println("Total Files: ${result.totalFiles}")
            println("Successful: ${result.successfulFiles}")
            println("Failed: ${result.failedFiles}")
            println("Duration: ${formatDuration(result.duration)}")
            println("Size Transferred: ${formatBytes(result.transferredSizeBytes)}")
            
            if (result.failedFiles > 0) {
                println("\nFailed Files:")
                result.failedFileDetails.take(10).forEach { failure ->
                    println("  ${failure.filePath}: ${failure.error}")
                }
                if (result.failedFileDetails.size > 10) {
                    println("  ... and ${result.failedFileDetails.size - 10} more")
                }
            }
        }
        
    } catch (e: Exception) {
        println("Migration failed: ${e.message}")
        e.printStackTrace()
    }
}

private suspend fun showStatus(args: List<String>) {
    if (args.isEmpty()) {
        println("Error: Migration ID required")
        return
    }
    
    val migrationId = args[0]
    val migrationService = StorageMigrationServiceImpl()
    
    val progress = migrationService.getMigrationProgress(migrationId)
    val result = migrationService.getMigrationResult(migrationId)
    
    if (progress != null) {
        println("Migration Status: ${progress.status}")
        println("Progress: ${String.format("%.1f", progress.percentage)}%")
        println("Files: ${progress.processedFiles}/${progress.totalFiles}")
        println("Size: ${formatBytes(progress.processedSizeBytes)}/${formatBytes(progress.totalSizeBytes)}")
        println("Transfer Rate: ${formatTransferRate(progress.transferRate)}")
        println("ETA: ${formatETA(progress.estimatedTimeRemaining)}")
        println("Message: ${progress.message}")
    } else if (result != null) {
        println("Migration completed.")
        println("Final Status: ${result.status}")
        println("Files: ${result.successfulFiles}/${result.totalFiles} successful")
        println("Duration: ${formatDuration(result.duration)}")
        println("Message: ${result.message}")
    } else {
        println("Migration not found: $migrationId")
    }
}

private fun parseStorageConfig(config: String): Pair<String, Map<String, String>> {
    val parts = config.split(":")
    return when (parts[0]) {
        "local" -> {
            if (parts.size != 2) throw IllegalArgumentException("Local storage format: local:<path>")
            "local" to mapOf("basePath" to parts[1])
        }
        "s3" -> {
            if (parts.size != 3) throw IllegalArgumentException("S3 storage format: s3:<bucket>:<region>")
            "s3" to mapOf("bucketName" to parts[1], "region" to parts[2])
        }
        else -> throw IllegalArgumentException("Unsupported storage type: ${parts[0]}")
    }
}

private fun parseMigrationOptions(args: List<String>): MigrationConfig {
    var config = MigrationConfig()
    
    var i = 0
    while (i < args.size) {
        when (args[i]) {
            "--batch-size" -> {
                if (i + 1 < args.size) {
                    config = config.copy(batchSize = args[i + 1].toInt())
                    i++
                }
            }
            "--max-retries" -> {
                if (i + 1 < args.size) {
                    config = config.copy(maxRetries = args[i + 1].toInt())
                    i++
                }
            }
            "--parallel" -> {
                if (i + 1 < args.size) {
                    config = config.copy(parallelTransfers = args[i + 1].toInt())
                    i++
                }
            }
            "--verify" -> {
                config = config.copy(verifyAfterMigration = true)
            }
            "--delete-source" -> {
                config = config.copy(deleteSourceAfterMigration = true)
            }
            "--skip-existing" -> {
                config = config.copy(skipExistingFiles = true)
            }
        }
        i++
    }
    
    return config
}

private fun createStorage(type: String, config: Map<String, String>) = when (type) {
    "local" -> FileStorageFactory.createLocalFileStorage(config["basePath"]!!)
    "s3" -> FileStorageFactory.createS3FileStorage(config["bucketName"]!!, config["region"]!!)
    else -> throw IllegalArgumentException("Unsupported storage type: $type")
}

private fun formatTransferRate(bytesPerSecond: Double): String {
    return when {
        bytesPerSecond < 1024 -> "${String.format("%.1f", bytesPerSecond)} B/s"
        bytesPerSecond < 1024 * 1024 -> "${String.format("%.1f", bytesPerSecond / 1024)} KB/s"
        bytesPerSecond < 1024 * 1024 * 1024 -> "${String.format("%.1f", bytesPerSecond / (1024 * 1024))} MB/s"
        else -> "${String.format("%.1f", bytesPerSecond / (1024 * 1024 * 1024))} GB/s"
    }
}

private fun formatBytes(bytes: Long): String {
    return when {
        bytes < 1024 -> "$bytes B"
        bytes < 1024 * 1024 -> "${bytes / 1024} KB"
        bytes < 1024 * 1024 * 1024 -> "${bytes / (1024 * 1024)} MB"
        else -> "${bytes / (1024 * 1024 * 1024)} GB"
    }
}

private fun formatDuration(millis: Long): String {
    val seconds = millis / 1000
    val minutes = seconds / 60
    val hours = minutes / 60
    
    return when {
        hours > 0 -> "${hours}h ${minutes % 60}m ${seconds % 60}s"
        minutes > 0 -> "${minutes}m ${seconds % 60}s"
        else -> "${seconds}s"
    }
}

private fun formatETA(millis: Long?): String {
    return if (millis == null || millis <= 0) {
        "Unknown"
    } else {
        formatDuration(millis)
    }
}