package storage

import java.io.InputStream
import java.io.OutputStream
import java.io.File
import java.io.FileInputStream
import java.io.FileOutputStream
import java.nio.file.Paths
import software.amazon.awssdk.core.sync.RequestBody
import software.amazon.awssdk.services.s3.S3Client
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest
import software.amazon.awssdk.services.s3.model.GetObjectRequest
import software.amazon.awssdk.services.s3.model.HeadObjectRequest
import software.amazon.awssdk.services.s3.model.NoSuchKeyException
import software.amazon.awssdk.services.s3.model.PutObjectRequest
import org.slf4j.LoggerFactory

interface FileStorage {
    fun saveFile(path: String, content: InputStream)
    fun readFile(path: String): InputStream?
    fun deleteFile(path: String)
    fun fileExists(path: String): Boolean
    
    // Migration support methods
    fun listFiles(prefix: String = ""): List<String>
    fun getFileSize(path: String): Long?
    fun getFileHash(path: String): String? // Optional: for verification
}


class LocalFileStorage(private val basePath: String) : FileStorage {
    companion object {
        private val logger = LoggerFactory.getLogger(LocalFileStorage::class.java)
    }

    init {
        File(basePath).mkdirs() // Ensure base directory exists
    }

    private fun getFilePath(path: String): File {
        return Paths.get(basePath, path).toFile()
    }

    override fun saveFile(path: String, content: InputStream) {
        val file = getFilePath(path)
        file.parentFile?.mkdirs() // Create parent directories if they don't exist
        FileOutputStream(file).use { outputStream ->
            content.copyTo(outputStream)
        }
        logger.info("File saved to LOCAL storage: absolutePath={}, basePath={}, relativePath={}, size={} bytes", 
                   file.absolutePath, basePath, path, file.length())
    }

    override fun readFile(path: String): InputStream? {
        val file = getFilePath(path)
        return if (file.exists() && file.isFile) {
            FileInputStream(file)
        } else {
            null
        }
    }

    override fun deleteFile(path: String) {
        val file = getFilePath(path)
        if (file.exists()) {
            val absolutePath = file.absolutePath
            val deleted = file.delete()
            if (deleted) {
                logger.info("File deleted from LOCAL storage: absolutePath={}, basePath={}, relativePath={}", 
                           absolutePath, basePath, path)
            } else {
                logger.error("Failed to delete file from LOCAL storage: absolutePath={}, basePath={}, relativePath={}", 
                           absolutePath, basePath, path)
            }
        } else {
            val expectedPath = getFilePath(path).absolutePath
            logger.warn("Attempted to delete non-existent file from LOCAL storage: expectedPath={}, basePath={}, relativePath={}", 
                       expectedPath, basePath, path)
        }
    }

    override fun fileExists(path: String): Boolean {
        return getFilePath(path).exists()
    }
    
    override fun listFiles(prefix: String): List<String> {
        val prefixFile = if (prefix.isEmpty()) File(basePath) else File(basePath, prefix)
        val files = mutableListOf<String>()
        
        fun walkDirectory(dir: File, relativePath: String = "") {
            if (dir.exists() && dir.isDirectory) {
                dir.listFiles()?.forEach { file ->
                    val currentPath = if (relativePath.isEmpty()) file.name else "$relativePath/${file.name}"
                    if (file.isFile) {
                        files.add(currentPath)
                    } else if (file.isDirectory) {
                        walkDirectory(file, currentPath)
                    }
                }
            }
        }
        
        walkDirectory(prefixFile)
        return files
    }
    
    override fun getFileSize(path: String): Long? {
        val file = getFilePath(path)
        return if (file.exists() && file.isFile) file.length() else null
    }
    
    override fun getFileHash(path: String): String? {
        val file = getFilePath(path)
        if (!file.exists() || !file.isFile) return null
        
        return try {
            val digest = java.security.MessageDigest.getInstance("SHA-256")
            val bytes = file.readBytes()
            val hashBytes = digest.digest(bytes)
            hashBytes.joinToString("") { "%02x".format(it) }
        } catch (e: Exception) {
            null
        }
    }
}


class S3FileStorage(private val s3Client: S3Client, private val bucketName: String) : FileStorage {
    companion object {
        private val logger = LoggerFactory.getLogger(S3FileStorage::class.java)
    }

    override fun saveFile(path: String, content: InputStream) {
        try {
            val putObjectRequest = PutObjectRequest.builder()
                .bucket(bucketName)
                .key(path) // S3 uses "key" for file paths
                .build()

            // Read content into byte array to get correct length
            val contentBytes = content.readBytes()
            s3Client.putObject(putObjectRequest, RequestBody.fromBytes(contentBytes))
            
            logger.info("File saved to S3 storage: s3Path=s3://{}/{}, bucket={}, key={}, size={} bytes", 
                       bucketName, path, bucketName, path, contentBytes.size)
        } catch (e: Exception) {
            logger.error("Failed to save file to S3 storage: s3Path=s3://{}/{}, bucket={}, key={}, error={}", 
                        bucketName, path, bucketName, path, e.message)
            throw e
        }
    }

    override fun readFile(path: String): InputStream? {
        val getObjectRequest = GetObjectRequest.builder()
            .bucket(bucketName)
            .key(path)
            .build()
        return try {
            s3Client.getObject(getObjectRequest)
        } catch (e: NoSuchKeyException) {
            null // File not found
        }
    }

    override fun deleteFile(path: String) {
        try {
            val deleteObjectRequest = DeleteObjectRequest.builder()
                .bucket(bucketName)
                .key(path)
                .build()
            s3Client.deleteObject(deleteObjectRequest)
            logger.info("File deleted from S3 storage: s3Path=s3://{}/{}, bucket={}, key={}", 
                       bucketName, path, bucketName, path)
        } catch (e: Exception) {
            logger.error("Failed to delete file from S3 storage: s3Path=s3://{}/{}, bucket={}, key={}, error={}", 
                        bucketName, path, bucketName, path, e.message)
            throw e
        }
    }

    override fun fileExists(path: String): Boolean {
        val headObjectRequest = HeadObjectRequest.builder()
            .bucket(bucketName)
            .key(path)
            .build()
        return try {
            s3Client.headObject(headObjectRequest)
            true
        } catch (e: NoSuchKeyException) {
            false
        }
    }
    
    override fun listFiles(prefix: String): List<String> {
        val listObjectsRequest = software.amazon.awssdk.services.s3.model.ListObjectsV2Request.builder()
            .bucket(bucketName)
            .prefix(prefix)
            .build()
        
        val files = mutableListOf<String>()
        var continuationToken: String? = null
        
        do {
            val request = if (continuationToken != null) {
                listObjectsRequest.toBuilder().continuationToken(continuationToken).build()
            } else {
                listObjectsRequest
            }
            
            val response = s3Client.listObjectsV2(request)
            response.contents().forEach { s3Object ->
                files.add(s3Object.key())
            }
            continuationToken = response.nextContinuationToken()
        } while (response.isTruncated)
        
        return files
    }
    
    override fun getFileSize(path: String): Long? {
        val headObjectRequest = HeadObjectRequest.builder()
            .bucket(bucketName)
            .key(path)
            .build()
        return try {
            val response = s3Client.headObject(headObjectRequest)
            response.contentLength()
        } catch (e: NoSuchKeyException) {
            null
        }
    }
    
    override fun getFileHash(path: String): String? {
        val headObjectRequest = HeadObjectRequest.builder()
            .bucket(bucketName)
            .key(path)
            .build()
        return try {
            val response = s3Client.headObject(headObjectRequest)
            // S3 ETag is usually MD5 hash (without quotes)
            response.eTag()?.replace("\"", "")
        } catch (e: NoSuchKeyException) {
            null
        }
    }
}

