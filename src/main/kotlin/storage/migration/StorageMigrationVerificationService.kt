package storage.migration

import com.shut.*
import dms.schema.DocumentVersion
import dms.service.DMSService
import kotlinx.serialization.Serializable
import org.jetbrains.exposed.sql.selectAll
import org.jetbrains.exposed.sql.transactions.transaction
import storage.FileStorageProvider
import storage.LocalFileStorage
import storage.S3FileStorage

@Serializable
data class MigrationVerificationResult(
    val status: String,
    val summary: MigrationVerificationSummary,
    val details: MigrationVerificationDetails,
    val errors: List<String> = emptyList()
)

@Serializable 
data class MigrationVerificationSummary(
    val totalFilesInDb: Int,
    val filesVerifiedInS3: Int,
    val filesMissingInS3: Int,
    val filesOnlyInS3: Int,
    val verificationSuccess: Boolean
)

@Serializable
data class MigrationVerificationDetails(
    val imageFiles: FileTypeVerification,
    val dmsFiles: FileTypeVerification,
    val casFiles: FileTypeVerification
)

@Serializable
data class FileTypeVerification(
    val totalInDb: Int,
    val verifiedInS3: Int,
    val missingInS3: List<String> = emptyList()
)

class StorageMigrationVerificationService {
    
    private val localStorage = LocalFileStorage("C:/projects/learningcards/cas")
    private val currentStorage = FileStorageProvider.getInstance()
    
    fun verifyMigration(includeDetails: Boolean = false): MigrationVerificationResult {
        val errors = mutableListOf<String>()
        
        try {
            // Verify current storage is S3
            if (currentStorage !is S3FileStorage) {
                errors.add("Current file storage is not S3. Migration verification requires S3 storage to be active.")
                return MigrationVerificationResult(
                    status = "error",
                    summary = MigrationVerificationSummary(0, 0, 0, 0, false),
                    details = MigrationVerificationDetails(
                        FileTypeVerification(0, 0), 
                        FileTypeVerification(0, 0),
                        FileTypeVerification(0, 0)
                    ),
                    errors = errors
                )
            }
            
            val imageVerification = verifyImageFiles(includeDetails)
            val dmsVerification = verifyDMSFiles(includeDetails)  
            val casVerification = verifyCASFiles(includeDetails)
            
            val totalInDb = imageVerification.totalInDb + dmsVerification.totalInDb + casVerification.totalInDb
            val verifiedInS3 = imageVerification.verifiedInS3 + dmsVerification.verifiedInS3 + casVerification.verifiedInS3
            val missingInS3 = imageVerification.missingInS3.size + dmsVerification.missingInS3.size + casVerification.missingInS3.size
            
            // Check for files only in S3 (not referenced in DB)
            val filesOnlyInS3 = countOrphanedS3Files()
            
            val summary = MigrationVerificationSummary(
                totalFilesInDb = totalInDb,
                filesVerifiedInS3 = verifiedInS3,
                filesMissingInS3 = missingInS3,
                filesOnlyInS3 = filesOnlyInS3,
                verificationSuccess = missingInS3 == 0
            )
            
            val details = MigrationVerificationDetails(
                imageFiles = imageVerification,
                dmsFiles = dmsVerification,
                casFiles = casVerification
            )
            
            return MigrationVerificationResult(
                status = if (summary.verificationSuccess) "success" else "partial",
                summary = summary,
                details = details,
                errors = errors
            )
            
        } catch (e: Exception) {
            errors.add("Verification failed: ${e.message}")
            return MigrationVerificationResult(
                status = "error",
                summary = MigrationVerificationSummary(0, 0, 0, 0, false),
                details = MigrationVerificationDetails(
                    FileTypeVerification(0, 0), 
                    FileTypeVerification(0, 0),
                    FileTypeVerification(0, 0)
                ),
                errors = errors
            )
        }
    }
    
    private fun verifyImageFiles(includeDetails: Boolean): FileTypeVerification {
        return transaction {
            val imageLocations = ImageTab.selectAll()
                .map { it[ImageTab.location] }
                .distinct()
            
            val missingFiles = mutableListOf<String>()
            var verifiedCount = 0
            
            for (location in imageLocations) {
                // Image locations might be file paths or hashes
                val hash = extractHashFromLocation(location)
                if (hash != null) {
                    val casPath = getStoragePath(hash)
                    if (currentStorage.fileExists(casPath)) {
                        verifiedCount++
                    } else {
                        if (includeDetails) {
                            missingFiles.add(location)
                        }
                    }
                }
            }
            
            FileTypeVerification(
                totalInDb = imageLocations.size,
                verifiedInS3 = verifiedCount,
                missingInS3 = if (includeDetails) missingFiles else emptyList()
            )
        }
    }
    
    private fun verifyDMSFiles(includeDetails: Boolean): FileTypeVerification {
        return transaction {
            val dmsHashes = DocumentVersion.selectAll()
                .map { it[DocumentVersion.hashWert] }
                .distinct()
            
            val missingFiles = mutableListOf<String>()
            var verifiedCount = 0
            
            for (hash in dmsHashes) {
                val casPath = getStoragePath(hash)
                if (currentStorage.fileExists(casPath)) {
                    verifiedCount++
                } else {
                    if (includeDetails) {
                        missingFiles.add(hash)
                    }
                }
            }
            
            FileTypeVerification(
                totalInDb = dmsHashes.size,
                verifiedInS3 = verifiedCount,
                missingInS3 = if (includeDetails) missingFiles else emptyList()
            )
        }
    }
    
    private fun verifyCASFiles(includeDetails: Boolean): FileTypeVerification {
        // Get all files that were in local CAS but might be referenced elsewhere
        val localFiles = try {
            localStorage.listFiles()
        } catch (e: Exception) {
            emptyList()
        }
        
        val missingFiles = mutableListOf<String>()
        var verifiedCount = 0
        
        for (localFile in localFiles) {
            if (currentStorage.fileExists(localFile)) {
                verifiedCount++
            } else {
                if (includeDetails) {
                    missingFiles.add(localFile)
                }
            }
        }
        
        return FileTypeVerification(
            totalInDb = localFiles.size,
            verifiedInS3 = verifiedCount,
            missingInS3 = if (includeDetails) missingFiles else emptyList()
        )
    }
    
    private fun countOrphanedS3Files(): Int {
        return try {
            // Get all files in S3
            val s3Files = currentStorage.listFiles().toSet()
            
            // Get all files referenced in DB
            val referencedFiles = transaction {
                val imageHashes = ImageTab.selectAll()
                    .mapNotNull { extractHashFromLocation(it[ImageTab.location]) }
                    .map { getStoragePath(it) }
                    .toSet()
                
                val dmsHashes = DocumentVersion.selectAll()
                    .map { getStoragePath(it[DocumentVersion.hashWert]) }
                    .toSet()
                
                imageHashes + dmsHashes
            }
            
            // Count files in S3 that are not referenced in DB
            (s3Files - referencedFiles).size
        } catch (e: Exception) {
            0
        }
    }
    
    private fun extractHashFromLocation(location: String): String? {
        // Image location might be a hash or a file path
        // If it's already a hash (64 characters), return it
        if (location.matches(Regex("^[a-f0-9]{64}$"))) {
            return location
        }
        
        // If it's a file path, try to extract hash from filename
        val filename = location.substringAfterLast('/')
        if (filename.matches(Regex("^[a-f0-9]{64}$"))) {
            return filename
        }
        
        return null
    }
    
    private fun getStoragePath(hash: String): String {
        // Create 3-layer directory structure: ab/cd/ef/abcdef...
        require(hash.length >= 6) { "Hash must be at least 6 characters long" }
        val layer1 = hash.substring(0, 2)
        val layer2 = hash.substring(2, 4)
        val layer3 = hash.substring(4, 6)
        return "$layer1/$layer2/$layer3/$hash"
    }
    
    fun getDetailedMissingFilesList(): List<MissingFileInfo> {
        val result = verifyMigration(includeDetails = true)
        val missingFiles = mutableListOf<MissingFileInfo>()
        
        result.details.imageFiles.missingInS3.forEach { location ->
            missingFiles.add(MissingFileInfo("image", location, "ImageTab.location"))
        }
        
        result.details.dmsFiles.missingInS3.forEach { hash ->
            missingFiles.add(MissingFileInfo("dms", hash, "DocumentVersion.hashWert"))
        }
        
        result.details.casFiles.missingInS3.forEach { path ->
            missingFiles.add(MissingFileInfo("cas", path, "Local CAS file"))
        }
        
        return missingFiles
    }
    
    /**
     * Clean up orphaned files in storage that are not referenced in the database
     * @param dryRun If true, only identify files to be deleted without actually deleting them
     * @param includeDetails If true, include list of deleted files in the result
     * @return CleanupResult with summary and details of the cleanup operation
     */
    fun cleanupOrphanedFiles(dryRun: Boolean = true, includeDetails: Boolean = false): CleanupResult {
        val errors = mutableListOf<String>()
        
        try {
            // Get all orphaned files
            val orphanedFiles = getOrphanedFiles()
            
            if (orphanedFiles.isEmpty()) {
                return CleanupResult(
                    status = "success",
                    summary = CleanupSummary(
                        totalOrphanedFiles = 0,
                        filesDeleted = 0,
                        filesFailedToDelete = 0,
                        spaceFreedBytes = 0L,
                        dryRun = dryRun
                    )
                )
            }
            
            val deletedFiles = mutableListOf<String>()
            val failedDeletions = mutableListOf<CleanupFailure>()
            var spaceFreed = 0L
            
            for (filePath in orphanedFiles) {
                try {
                    // Get file size before deletion (if supported)
                    val fileSize = currentStorage.getFileSize(filePath) ?: 0L
                    
                    if (!dryRun) {
                        // Actually delete the file
                        currentStorage.deleteFile(filePath)
                        
                        // Verify deletion was successful
                        if (currentStorage.fileExists(filePath)) {
                            failedDeletions.add(CleanupFailure(filePath, "File still exists after deletion attempt"))
                        } else {
                            if (includeDetails) {
                                deletedFiles.add(filePath)
                            }
                            spaceFreed += fileSize
                        }
                    } else {
                        // Dry run - just count what would be deleted
                        if (includeDetails) {
                            deletedFiles.add(filePath)
                        }
                        spaceFreed += fileSize
                    }
                } catch (e: Exception) {
                    failedDeletions.add(CleanupFailure(filePath, "Deletion failed: ${e.message}"))
                }
            }
            
            val filesDeleted = if (dryRun) 0 else (orphanedFiles.size - failedDeletions.size)
            val actualSpaceFreed = if (dryRun) 0L else spaceFreed
            
            return CleanupResult(
                status = if (failedDeletions.isEmpty()) "success" else "partial",
                summary = CleanupSummary(
                    totalOrphanedFiles = orphanedFiles.size,
                    filesDeleted = filesDeleted,
                    filesFailedToDelete = failedDeletions.size,
                    spaceFreedBytes = actualSpaceFreed,
                    dryRun = dryRun
                ),
                deletedFiles = if (includeDetails) deletedFiles else emptyList(),
                failedDeletions = failedDeletions,
                errors = errors
            )
            
        } catch (e: Exception) {
            errors.add("Cleanup operation failed: ${e.message}")
            return CleanupResult(
                status = "error",
                summary = CleanupSummary(0, 0, 0, 0L, dryRun),
                errors = errors
            )
        }
    }
    
    /**
     * Get list of orphaned files (files in storage but not referenced in database)
     */
    private fun getOrphanedFiles(): List<String> {
        return try {
            // Get all files in current storage
            val storageFiles = currentStorage.listFiles().toSet()
            
            // Get all files referenced in DB
            val referencedFiles = transaction {
                val imageHashes = ImageTab.selectAll()
                    .mapNotNull { extractHashFromLocation(it[ImageTab.location]) }
                    .map { getStoragePath(it) }
                    .toSet()
                
                val dmsHashes = DocumentVersion.selectAll()
                    .map { getStoragePath(it[DocumentVersion.hashWert]) }
                    .toSet()
                
                imageHashes + dmsHashes
            }
            
            // Return files that are in storage but not referenced in DB
            (storageFiles - referencedFiles).toList().sorted()
        } catch (e: Exception) {
            emptyList()
        }
    }
    
    /**
     * Get preview of files that would be deleted during cleanup
     * This is a safe way to see what the cleanup would do before actually running it
     */
    fun getOrphanedFilesPreview(limit: Int = 100): List<OrphanedFileInfo> {
        return try {
            val orphanedFiles = getOrphanedFiles()
            
            orphanedFiles.take(limit).map { filePath ->
                val fileSize = try {
                    currentStorage.getFileSize(filePath) ?: 0L
                } catch (e: Exception) {
                    0L
                }
                
                OrphanedFileInfo(
                    filePath = filePath,
                    sizeBytes = fileSize,
                    hash = extractHashFromStoragePath(filePath) ?: "unknown"
                )
            }
        } catch (e: Exception) {
            emptyList()
        }
    }
    
    /**
     * Extract hash from storage path (reverse of getStoragePath)
     */
    private fun extractHashFromStoragePath(path: String): String? {
        // Path format is: ab/cd/ef/abcdef...
        val parts = path.split('/')
        if (parts.size >= 4) {
            val filename = parts.last()
            if (filename.matches(Regex("^[a-f0-9]{64}$"))) {
                return filename
            }
        }
        return null
    }
    
    /**
     * Get detailed relationship information for all files in storage
     * Shows which database objects reference each file and derived images (thumbnails/resized)
     */
    fun getFileRelationships(limit: Int = 1000): List<FileRelationshipInfo> {
        return try {
            // Get all files in storage
            val storageFiles = currentStorage.listFiles().take(limit)
            
            // Get all database references
            val dbReferences = getAllDatabaseReferences()
            
            // Build file relationship map with derived images
            val fileRelationships = mutableMapOf<String, FileRelationshipInfo>()
            val processedHashes = mutableSetOf<String>()
            
            storageFiles.forEach { filePath ->
                val hash = extractHashFromStoragePath(filePath) ?: "unknown"
                if (processedHashes.contains(hash)) return@forEach
                
                val fileSize = try {
                    currentStorage.getFileSize(filePath) ?: 0L
                } catch (e: Exception) {
                    0L
                }
                
                // Find all database references for this file
                val references = dbReferences.filter { ref ->
                    ref.hash == hash || ref.filePath == filePath
                }
                
                // Determine file type and find derived files
                val (fileType, derivedFiles, originalHash) = analyzeFileType(hash, references)
                
                fileRelationships[hash] = FileRelationshipInfo(
                    filePath = filePath,
                    hash = hash,
                    sizeBytes = fileSize,
                    usedBy = references.map { it.reference },
                    derivedFiles = derivedFiles,
                    isOriginalOf = originalHash,
                    fileType = fileType,
                    isOrphaned = references.isEmpty() && originalHash == null
                )
                
                processedHashes.add(hash)
            }
            
            fileRelationships.values.toList().sortedBy { it.filePath }
        } catch (e: Exception) {
            emptyList()
        }
    }
    
    /**
     * Get all database references to files
     */
    private fun getAllDatabaseReferences(): List<FileReference> {
        return transaction {
            val references = mutableListOf<FileReference>()
            
            // 1. Image files (original, thumbnail, resized)
            ImageTab.selectAll().forEach { row ->
                val location = row[ImageTab.location]
                val thumbnailHash = row[ImageTab.thumbnailHash]
                val resizedHash = row[ImageTab.resizedHash]
                val imageId = row[ImageTab.id].toString()
                val imageName = row[ImageTab.name]
                
                val additionalInfo = mapOf(
                    "extension" to row[ImageTab.extension],
                    "groupId" to row[ImageTab.groupId].toString(),
                    "createdBy" to (row[ImageTab.createdBy]?.toString() ?: "null"),
                    "createdAt" to (row[ImageTab.createdAt] ?: "null")
                )
                
                // Original image
                val originalHash = extractHashFromLocation(location)
                if (originalHash != null) {
                    references.add(FileReference(
                        hash = originalHash,
                        filePath = getStoragePath(originalHash),
                        reference = DatabaseReference(
                            table = "ImageTab",
                            recordId = imageId,
                            field = "location",
                            recordTitle = imageName,
                            additionalInfo = additionalInfo
                        )
                    ))
                }
                
                // Thumbnail hash
                if (thumbnailHash != null) {
                    references.add(FileReference(
                        hash = thumbnailHash,
                        filePath = getStoragePath(thumbnailHash),
                        reference = DatabaseReference(
                            table = "ImageTab",
                            recordId = imageId,
                            field = "thumbnailHash",
                            recordTitle = "$imageName (thumbnail)",
                            additionalInfo = additionalInfo + ("derivedFrom" to (originalHash ?: "unknown"))
                        )
                    ))
                }
                
                // Resized hash
                if (resizedHash != null) {
                    references.add(FileReference(
                        hash = resizedHash,
                        filePath = getStoragePath(resizedHash),
                        reference = DatabaseReference(
                            table = "ImageTab",
                            recordId = imageId,
                            field = "resizedHash",
                            recordTitle = "$imageName (resized)",
                            additionalInfo = additionalInfo + ("derivedFrom" to (originalHash ?: "unknown"))
                        )
                    ))
                }
            }
            
            // 2. DMS Documents
            DocumentVersion.selectAll().forEach { row ->
                val hash = row[DocumentVersion.hashWert]
                references.add(FileReference(
                    hash = hash,
                    filePath = getStoragePath(hash),
                    reference = DatabaseReference(
                        table = "DocumentVersion",
                        recordId = row[DocumentVersion.id].toString(),
                        field = "hashWert",
                        recordTitle = row[DocumentVersion.dateiname],
                        additionalInfo = mapOf(
                            "documentId" to row[DocumentVersion.documentId].toString(),
                            "versionsnummer" to row[DocumentVersion.versionsnummer].toString(),
                            "dateigroesse" to row[DocumentVersion.dateigroesse].toString(),
                            "mimeType" to row[DocumentVersion.mimeType],
                            "status" to row[DocumentVersion.status]
                        )
                    )
                ))
            }
            
            // 3. Learning Cards with Images (indirect reference)
            LearningCardsTab.selectAll().forEach { row ->
                val imageId = row[LearningCardsTab.imageId]
                if (imageId != null) {
                    // Find the corresponding image
                    val imageRow = ImageTab.selectAll()
                        .where { ImageTab.id eq imageId }
                        .firstOrNull()
                    
                    if (imageRow != null) {
                        val location = imageRow[ImageTab.location]
                        val hash = extractHashFromLocation(location)
                        if (hash != null) {
                            references.add(FileReference(
                                hash = hash,
                                filePath = getStoragePath(hash),
                                reference = DatabaseReference(
                                    table = "LearningCardsTab",
                                    recordId = row[LearningCardsTab.id].toString(),
                                    field = "imageId (indirect)",
                                    recordTitle = row[LearningCardsTab.title],
                                    additionalInfo = mapOf(
                                        "imageId" to imageId.toString(),
                                        "category" to (row[LearningCardsTab.category] ?: "null"),
                                        "groupId" to row[LearningCardsTab.groupId].toString(),
                                        "createdBy" to row[LearningCardsTab.createdBy].toString()
                                    )
                                )
                            ))
                        }
                    }
                }
            }
            
            references
        }
    }
    
    /**
     * Get relationships for a specific file by hash or path
     */
    fun getFileRelationshipByHash(hash: String): FileRelationshipInfo? {
        return try {
            val filePath = getStoragePath(hash)
            val fileSize = try {
                currentStorage.getFileSize(filePath) ?: 0L
            } catch (e: Exception) {
                0L
            }
            
            val dbReferences = getAllDatabaseReferences()
            val references = dbReferences.filter { it.hash == hash }
            
            if (currentStorage.fileExists(filePath) || references.isNotEmpty()) {
                FileRelationshipInfo(
                    filePath = filePath,
                    hash = hash,
                    sizeBytes = fileSize,
                    usedBy = references.map { it.reference },
                    isOrphaned = references.isEmpty()
                )
            } else {
                null
            }
        } catch (e: Exception) {
            null
        }
    }
    
    /**
     * Analyze file type and find derived files (thumbnails/resized versions)
     * Returns: Triple(fileType, derivedFiles, originalHash)
     */
    private fun analyzeFileType(hash: String, references: List<FileReference>): Triple<String, List<DerivedFileInfo>, String?> {
        // If file has database references, it's likely an original
        if (references.isNotEmpty()) {
            val imageReferences = references.filter { it.reference.table == "ImageTab" }
            if (imageReferences.isNotEmpty()) {
                // This is an original image - try to find its derived versions
                val derivedFiles = findDerivedFiles(hash)
                return Triple("original", derivedFiles, null)
            }
            
            if (references.any { it.reference.table == "DocumentVersion" }) {
                return Triple("document", emptyList(), null)
            }
            
            return Triple("unknown", emptyList(), null)
        }
        
        // File has no database references - could be a derived file (thumbnail/resized)
        // Try to find if this is derived from any original image
        val originalHash = findOriginalImageForDerived(hash)
        if (originalHash != null) {
            val derivedType = determineDerivedType(hash, originalHash)
            return Triple(derivedType, emptyList(), originalHash)
        }
        
        return Triple("orphaned", emptyList(), null)
    }
    
    /**
     * Find derived files (thumbnail and resized) for an original image hash
     */
    private fun findDerivedFiles(originalHash: String): List<DerivedFileInfo> {
        val derivedFiles = mutableListOf<DerivedFileInfo>()
        
        try {
            // Get original image stream
            val originalStream = currentStorage.readFile(getStoragePath(originalHash))
            if (originalStream != null) {
                // Try to generate thumbnail and check if it exists in storage
                val thumbnailService = ThumbnailService()
                val resizeService = ResizeService()
                
                try {
                    val thumbnailHash = thumbnailService.createThumbnail(
                        originalStream, "temp", "jpg"
                    )
                    
                    if (currentStorage.fileExists(getStoragePath(thumbnailHash)) && thumbnailHash != originalHash) {
                        val thumbnailSize = currentStorage.getFileSize(getStoragePath(thumbnailHash)) ?: 0L
                        derivedFiles.add(DerivedFileInfo(
                            hash = thumbnailHash,
                            filePath = getStoragePath(thumbnailHash),
                            type = "thumbnail",
                            sizeBytes = thumbnailSize
                        ))
                    }
                } catch (e: Exception) {
                    // Thumbnail generation failed, skip
                }
                
                try {
                    // Reset stream for resized version
                    val originalStream2 = currentStorage.readFile(getStoragePath(originalHash))
                    if (originalStream2 != null) {
                        val resizedHash = resizeService.createResized(
                            originalStream2, "temp", "jpg"
                        )
                        
                        if (currentStorage.fileExists(getStoragePath(resizedHash)) && resizedHash != originalHash) {
                            val resizedSize = currentStorage.getFileSize(getStoragePath(resizedHash)) ?: 0L
                            derivedFiles.add(DerivedFileInfo(
                                hash = resizedHash,
                                filePath = getStoragePath(resizedHash),
                                type = "resized",
                                sizeBytes = resizedSize
                            ))
                        }
                    }
                } catch (e: Exception) {
                    // Resized generation failed, skip
                }
            }
        } catch (e: Exception) {
            // Original file not accessible, skip
        }
        
        return derivedFiles
    }
    
    /**
     * Try to find the original image that this derived file came from
     */
    private fun findOriginalImageForDerived(derivedHash: String): String? {
        // Get all original images from database
        return transaction {
            ImageTab.selectAll().forEach { row ->
                val location = row[ImageTab.location]
                val originalHash = extractHashFromLocation(location)
                if (originalHash != null) {
                    // Check if this derived hash could be generated from this original
                    if (isDerivedFrom(derivedHash, originalHash)) {
                        return@transaction originalHash
                    }
                }
            }
            null
        }
    }
    
    /**
     * Check if derivedHash could be a thumbnail or resized version of originalHash
     */
    private fun isDerivedFrom(derivedHash: String, originalHash: String): Boolean {
        try {
            val originalStream = currentStorage.readFile(getStoragePath(originalHash)) ?: return false
            
            // Try generating thumbnail and resized versions to see if they match
            val thumbnailService = ThumbnailService()
            val resizeService = ResizeService()
            
            try {
                val generatedThumbnailHash = thumbnailService.createThumbnail(
                    originalStream, "temp", "jpg"
                )
                if (generatedThumbnailHash == derivedHash) {
                    return true
                }
            } catch (e: Exception) {
                // Ignore
            }
            
            try {
                val originalStream2 = currentStorage.readFile(getStoragePath(originalHash))
                if (originalStream2 != null) {
                    val generatedResizedHash = resizeService.createResized(
                        originalStream2, "temp", "jpg"
                    )
                    if (generatedResizedHash == derivedHash) {
                        return true
                    }
                }
            } catch (e: Exception) {
                // Ignore
            }
            
        } catch (e: Exception) {
            // Ignore
        }
        
        return false
    }
    
    /**
     * Determine if derived file is thumbnail or resized based on comparison with original
     */
    private fun determineDerivedType(derivedHash: String, originalHash: String): String {
        try {
            val originalStream = currentStorage.readFile(getStoragePath(originalHash)) ?: return "derived"
            
            val thumbnailService = ThumbnailService()
            val generatedThumbnailHash = thumbnailService.createThumbnail(
                originalStream, "temp", "jpg"
            )
            
            if (generatedThumbnailHash == derivedHash) {
                return "thumbnail"
            }
            
            val originalStream2 = currentStorage.readFile(getStoragePath(originalHash))
            if (originalStream2 != null) {
                val resizeService = ResizeService()
                val generatedResizedHash = resizeService.createResized(
                    originalStream2, "temp", "jpg"
                )
                
                if (generatedResizedHash == derivedHash) {
                    return "resized"
                }
            }
        } catch (e: Exception) {
            // Ignore
        }
        
        return "derived"
    }

    private data class FileReference(
        val hash: String,
        val filePath: String,
        val reference: DatabaseReference
    )
}

@Serializable
data class MissingFileInfo(
    val type: String,
    val identifier: String,
    val source: String
)

@Serializable
data class CleanupResult(
    val status: String,
    val summary: CleanupSummary,
    val deletedFiles: List<String> = emptyList(),
    val failedDeletions: List<CleanupFailure> = emptyList(),
    val errors: List<String> = emptyList()
)

@Serializable
data class CleanupSummary(
    val totalOrphanedFiles: Int,
    val filesDeleted: Int,
    val filesFailedToDelete: Int,
    val spaceFreedBytes: Long,
    val dryRun: Boolean
)

@Serializable
data class CleanupFailure(
    val filePath: String,
    val error: String
)

@Serializable
data class OrphanedFileInfo(
    val filePath: String,
    val sizeBytes: Long,
    val hash: String
)

@Serializable
data class FileRelationshipInfo(
    val filePath: String,
    val hash: String,
    val sizeBytes: Long,
    val usedBy: List<DatabaseReference>,
    val derivedFiles: List<DerivedFileInfo> = emptyList(),
    val isOriginalOf: String? = null, // Hash of original if this is a derived file
    val fileType: String = "unknown", // "original", "thumbnail", "resized", "document"
    val isOrphaned: Boolean
)

@Serializable
data class DerivedFileInfo(
    val hash: String,
    val filePath: String,
    val type: String, // "thumbnail" or "resized"
    val sizeBytes: Long
)

@Serializable
data class DatabaseReference(
    val table: String,
    val recordId: String,
    val field: String,
    val recordTitle: String? = null,
    val additionalInfo: Map<String, String> = emptyMap()
)