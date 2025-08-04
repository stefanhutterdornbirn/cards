package storage

import software.amazon.awssdk.auth.credentials.*
import software.amazon.awssdk.regions.Region
import software.amazon.awssdk.services.s3.S3Client
import io.ktor.server.config.*

/**
 * Factory for creating FileStorage instances based on configuration
 */
object FileStorageFactory {
    
    /**
     * Creates a FileStorage instance based on the application configuration
     */
    fun createFileStorage(config: ApplicationConfig): FileStorage {
        val storageType = config.tryGetString("fileStorage.type") ?: "local"
        
        return when (storageType.lowercase()) {
            "local" -> {
                val basePath = config.tryGetString("fileStorage.local.basePath") ?: "/tmp/my-app-files"
                LocalFileStorage(basePath)
            }
            "s3" -> {
                val bucketName = config.tryGetString("fileStorage.s3.bucketName") 
                    ?: throw IllegalArgumentException("S3 bucket name is required when using S3 storage")
                val region = config.tryGetString("fileStorage.s3.region") ?: "eu-central-1"
                
                // Get AWS credentials from config or environment
                val accessKeyId = config.tryGetString("fileStorage.s3.accessKeyId")
                val secretAccessKey = config.tryGetString("fileStorage.s3.secretAccessKey")
                val sessionToken = config.tryGetString("fileStorage.s3.sessionToken")
                
                val s3Client = createS3Client(region, accessKeyId, secretAccessKey, sessionToken)
                S3FileStorage(s3Client, bucketName)
            }
            else -> {
                throw IllegalArgumentException("Unsupported storage type: $storageType. Supported types: local, s3")
            }
        }
    }
    
    /**
     * Creates a FileStorage instance with explicit parameters (for testing or special cases)
     */
    fun createLocalFileStorage(basePath: String): FileStorage {
        return LocalFileStorage(basePath)
    }
    
    /**
     * Creates an S3 FileStorage instance with explicit parameters
     */
    fun createS3FileStorage(bucketName: String, region: String = "eu-central-1"): FileStorage {
        val s3Client = createS3Client(region)
        return S3FileStorage(s3Client, bucketName)
    }
    
    /**
     * Creates S3Client with proper credential configuration
     */
    private fun createS3Client(
        region: String,
        accessKeyId: String? = null,
        secretAccessKey: String? = null,
        sessionToken: String? = null
    ): S3Client {
        val clientBuilder = S3Client.builder().region(Region.of(region))
        
        // Configure credentials based on what's available
        val credentialsProvider = when {
            // 1. Explicit credentials provided (from config)
            !accessKeyId.isNullOrEmpty() && !secretAccessKey.isNullOrEmpty() -> {
                if (!sessionToken.isNullOrEmpty()) {
                    // Temporary credentials with session token
                    StaticCredentialsProvider.create(
                        AwsSessionCredentials.create(accessKeyId, secretAccessKey, sessionToken)
                    )
                } else {
                    // Basic credentials
                    StaticCredentialsProvider.create(
                        AwsBasicCredentials.create(accessKeyId, secretAccessKey)
                    )
                }
            }
            
            // 2. Default credential chain (recommended for production)
            else -> {
                DefaultCredentialsProvider.create()
            }
        }
        
        return clientBuilder.credentialsProvider(credentialsProvider).build()
    }
}