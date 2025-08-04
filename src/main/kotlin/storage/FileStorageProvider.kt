package storage

import io.ktor.server.config.*

/**
 * Global provider for FileStorage instance
 * This ensures a single instance is used throughout the application
 */
object FileStorageProvider {
    
    @Volatile
    private var instance: FileStorage? = null
    
    /**
     * Initialize the FileStorage with application configuration
     * This should be called once during application startup
     */
    fun initialize(config: ApplicationConfig) {
        if (instance == null) {
            synchronized(this) {
                if (instance == null) {
                    instance = FileStorageFactory.createFileStorage(config)
                }
            }
        }
    }
    
    /**
     * Get the current FileStorage instance
     * Throws exception if not initialized
     */
    fun getInstance(): FileStorage {
        return instance ?: throw IllegalStateException(
            "FileStorage not initialized. Call FileStorageProvider.initialize() first."
        )
    }
    
    /**
     * Check if FileStorage is initialized
     */
    fun isInitialized(): Boolean {
        return instance != null
    }
    
    /**
     * Reset the instance (for testing purposes)
     */
    fun reset() {
        instance = null
    }
    
    /**
     * Set a custom FileStorage instance (for testing purposes)
     */
    fun setCustomInstance(fileStorage: FileStorage) {
        instance = fileStorage
    }
}