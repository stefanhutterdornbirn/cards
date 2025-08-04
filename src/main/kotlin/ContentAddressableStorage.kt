package com.shut

import storage.FileStorage
import storage.FileStorageProvider
import java.io.ByteArrayInputStream
import java.io.File
import java.io.InputStream
import java.security.MessageDigest
import org.slf4j.LoggerFactory

class ContentAddressableStorage(private val fileStorage: FileStorage) {
    companion object {
        private const val HASH_ALGORITHM = "SHA-256"
        private val logger = LoggerFactory.getLogger(ContentAddressableStorage::class.java)
        
        /**
         * Create a ContentAddressableStorage instance using the global FileStorage
         * This is a convenience method for most use cases
         */
        fun create(): ContentAddressableStorage {
            return ContentAddressableStorage(FileStorageProvider.getInstance())
        }
    }

    data class StorageResult(
        val hash: String,
        val path: String,
        val size: Long,
        val wasAlreadyStored: Boolean = false
    )

    fun store(inputStream: InputStream): StorageResult {
        // Read the input stream into a byte array to calculate hash and store
        val content = inputStream.readBytes()
        val hash = calculateHash(content)
        val path = getStoragePath(hash)
        
        // Check if file already exists (deduplication detection)
        val wasAlreadyStored = fileStorage.fileExists(path)
        
        // Only write if file doesn't already exist (deduplication)
        if (!wasAlreadyStored) {
            fileStorage.saveFile(path, ByteArrayInputStream(content))
            val storageType = getStorageTypeInfo()
            logger.info("File stored in CAS [{}]: hash={}, path={}, size={} bytes", 
                       storageType, hash, path, content.size)
        } else {
            val storageType = getStorageTypeInfo()
            logger.info("File already exists in CAS [{}] (deduplication): hash={}, path={}, size={} bytes", 
                       storageType, hash, path, content.size)
        }
        
        return StorageResult(hash, path, content.size.toLong(), wasAlreadyStored)
    }

    fun store(file: File): StorageResult {
        val storageType = getStorageTypeInfo()
        logger.info("Storing file from local path [{}]: {}", storageType, file.absolutePath)
        return file.inputStream().use { store(it) }
    }

    @Deprecated("Use retrieveAsStream() instead for better abstraction")
    fun retrieve(hash: String): File? {
        // This method is only supported for LocalFileStorage
        // For cloud storage, use retrieveAsStream()
        val path = getStoragePath(hash)
        return if (fileStorage.fileExists(path)) {
            // Note: This will only work with LocalFileStorage
            // For S3 or other cloud storage, this will return null
            try {
                if (fileStorage is storage.LocalFileStorage) {
                    // Use reflection or add a method to get the actual file path
                    // For now, return null to force migration to retrieveAsStream()
                    null
                } else {
                    null
                }
            } catch (e: Exception) {
                null
            }
        } else {
            null
        }
    }
    
    fun retrieveAsStream(hash: String): InputStream? {
        val path = getStoragePath(hash)
        return fileStorage.readFile(path)
    }

    fun exists(hash: String): Boolean {
        val path = getStoragePath(hash)
        return fileStorage.fileExists(path)
    }

    fun delete(hash: String): Boolean {
        val path = getStoragePath(hash)
        val storageType = getStorageTypeInfo()
        return if (fileStorage.fileExists(path)) {
            try {
                fileStorage.deleteFile(path)
                logger.info("File deleted from CAS [{}]: hash={}, path={}", storageType, hash, path)
                true
            } catch (e: Exception) {
                logger.error("Failed to delete file from CAS [{}]: hash={}, path={}, error={}", 
                           storageType, hash, path, e.message)
                false
            }
        } else {
            logger.warn("Attempted to delete non-existent file from CAS [{}]: hash={}, path={}", 
                       storageType, hash, path)
            false
        }
    }

    fun getStorageInfo(hash: String): StorageInfo? {
        val path = getStoragePath(hash)
        return if (fileStorage.fileExists(path)) {
            // For cloud storage, we can't easily get file size without reading
            // We'll need to enhance the FileStorage interface for this
            // For now, return -1 for size when using cloud storage
            val size = try {
                if (fileStorage is storage.LocalFileStorage) {
                    // For local storage, we can still get the file size
                    val file = retrieve(hash)
                    file?.length() ?: -1L
                } else {
                    // For cloud storage, size is not easily available
                    // This could be enhanced by adding getFileSize() to FileStorage interface
                    -1L
                }
            } catch (e: Exception) {
                -1L
            }
            
            StorageInfo(
                hash = hash,
                size = size,
                path = path,
                exists = true
            )
        } else {
            null
        }
    }

    private fun calculateHash(content: ByteArray): String {
        val digest = MessageDigest.getInstance(HASH_ALGORITHM)
        val hashBytes = digest.digest(content)
        return hashBytes.joinToString("") { "%02x".format(it) }
    }

    private fun getStoragePath(hash: String): String {
        // Create 3-layer directory structure: ab/cd/ef/abcdef...
        require(hash.length >= 6) { "Hash must be at least 6 characters long" }
        val layer1 = hash.substring(0, 2)
        val layer2 = hash.substring(2, 4)
        val layer3 = hash.substring(4, 6)
        return "$layer1/$layer2/$layer3/$hash"
    }

    private fun getStorageTypeInfo(): String {
        return when (fileStorage) {
            is storage.LocalFileStorage -> {
                "LOCAL"
            }
            is storage.S3FileStorage -> {
                // Access private field via reflection to get bucket name
                try {
                    val bucketField = fileStorage.javaClass.getDeclaredField("bucketName")
                    bucketField.isAccessible = true
                    val bucketName = bucketField.get(fileStorage) as String
                    "S3:$bucketName"
                } catch (e: Exception) {
                    "S3"
                }
            }
            else -> {
                "UNKNOWN"
            }
        }
    }

    data class StorageInfo(
        val hash: String,
        val size: Long,
        val path: String,
        val exists: Boolean
    )

    @Deprecated("Not supported for cloud storage. Use migration tools instead.")
    fun listAllFiles(): List<StorageInfo> {
        // This method only works with LocalFileStorage
        // For cloud storage (S3), we would need to enhance FileStorage interface
        // to support listing operations or use specific cloud APIs
        
        if (fileStorage !is storage.LocalFileStorage) {
            throw UnsupportedOperationException(
                "listAllFiles() is not supported for cloud storage. " +
                "Use migration tools or cloud-specific APIs instead."
            )
        }
        
        // TODO: Implement this by adding list functionality to FileStorage interface
        // For now, return empty list to avoid breaking existing code
        return emptyList()
    }

    @Deprecated("Not supported for cloud storage. Use cloud-specific monitoring instead.")
    fun getStatistics(): StorageStatistics {
        // This method depends on listAllFiles() which is not supported for cloud storage
        if (fileStorage !is storage.LocalFileStorage) {
            throw UnsupportedOperationException(
                "getStatistics() is not supported for cloud storage. " +
                "Use cloud-specific monitoring and billing APIs instead."
            )
        }
        
        val files = listAllFiles()
        return StorageStatistics(
            totalFiles = files.size,
            totalSize = files.sumOf { it.size },
            averageSize = if (files.isNotEmpty()) files.sumOf { it.size } / files.size else 0L
        )
    }

    data class StorageStatistics(
        val totalFiles: Int,
        val totalSize: Long,
        val averageSize: Long
    )
}