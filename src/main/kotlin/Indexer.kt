package com.shut

import java.io.FileInputStream
import java.nio.file.Files
import java.nio.file.StandardCopyOption
import java.security.MessageDigest
import java.text.DecimalFormat
import kotlin.io.path.Path
import java.io.File
import org.apache.pdfbox.pdmodel.PDDocument
import org.apache.pdfbox.text.PDFTextStripper
import java.io.IOException
import java.nio.file.Paths
import storage.FileStorageFactory
import storage.FileStorage
import io.ktor.server.application.*

fun startIndexer() {
    // For backward compatibility, try local first, then S3
    try {
        indexS3("learning-materials/")
    } catch (e: Exception) {
        println("S3 indexing failed, falling back to local: ${e.message}")
        index("data/data")
    }
}

/**
 * Index files from S3 bucket
 */
fun indexS3(s3Prefix: String = "learning-materials/") {
    println("Starting S3 indexing with prefix: $s3Prefix")
    
    // Create S3 FileStorage instance
    val fileStorage = try {
        FileStorageFactory.createS3FileStorage("your-bucket-name") // Replace with actual bucket name
    } catch (e: Exception) {
        println("Failed to create S3 storage: ${e.message}")
        throw e
    }
    
    // Get all files from S3 with the given prefix
    val allFiles = fileStorage.listFiles(s3Prefix)
    println("Found ${allFiles.size} files in S3 with prefix: $s3Prefix")
    
    if (allFiles.isEmpty()) {
        println("No files found in S3 bucket with prefix: $s3Prefix")
        return
    }
    
    // Group files by "directory" (common prefix before last slash)
    val directoriesMap = allFiles
        .filter { !it.endsWith("/") } // Skip directory markers
        .groupBy { file ->
            // Extract directory name from S3 key
            val pathParts = file.removePrefix(s3Prefix).split("/")
            if (pathParts.size > 1) pathParts[0] else "root"
        }
    
    if (directoriesMap.isEmpty()) {
        println("No valid directories found in S3 files")
        return
    }
    
    // Initialize services
    val cas = ContentAddressableStorage.create()
    val lms = LernmaterialService()
    lms.initialize()
    val mcardService = MCardService()
    
    // Load stopwords
    val stopwords = try {
        Files.readAllLines(Paths.get("stopwords/deutsche_stopwords_nltk.txt")).toSet()
    } catch (e: Exception) {
        println("Warning: Could not load stopwords file: ${e.message}")
        emptySet()
    }
    
    // Create main packet
    val logoImage = mcardService.getImagebyID(1)
    val packet = Packet(
        0,
        "S3 Learning Materials",
        "Materials indexed from S3 bucket",
        logoImage
    )
    packet.id = lms.addPacket(packet)
    
    // Format for file sizes
    val sizeFormatter = DecimalFormat("#,###")
    val processedHashes = mutableMapOf<String, String>()
    var totalFiles = 0
    var uniqueFiles = 0
    
    println("Processing ${directoriesMap.size} directories from S3...")
    
    // Process each directory
    directoriesMap.forEach { (directoryName, files) ->
        println("Processing S3 directory: $directoryName (${files.size} files)")
        
        // Extract keywords from directory name
        val keywords = directoryName
            .split(" ", "-", "_")
            .filter { it.isNotBlank() }
            .map { it.trim() }
            .distinct()
        
        val materialien: MutableList<Material> = mutableListOf()
        
        files.forEach { s3Key ->
            try {
                val fileName = s3Key.substringAfterLast("/")
                val fileExtension = fileName.substringAfterLast('.', "bin")
                
                // Get file size from S3
                val fileSize = fileStorage.getFileSize(s3Key) ?: 0L
                val formattedSize = sizeFormatter.format(fileSize)
                
                // Download file to temporary location for processing
                val tempFile = downloadS3FileToTemp(fileStorage, s3Key)
                
                if (tempFile != null) {
                    try {
                        // Store in CAS
                        val storageResult = cas.store(tempFile)
                        val contentId = storageResult.hash
                        
                        // Track unique files
                        if (!processedHashes.containsKey(contentId)) {
                            processedHashes[contentId] = contentId
                            uniqueFiles++
                        }
                        
                        // Extract text content
                        val content = extractTextFromPdf(tempFile.absolutePath)
                        val cleanContent = removeStopwords(content, stopwords)
                        
                        // Add to materials
                        materialien.add(
                            Material(
                                0,
                                fileName,
                                fileExtension,
                                fileSize,
                                contentId,
                                cleanContent
                            )
                        )
                        
                        totalFiles++
                        println("Processed S3 file: $fileName ($formattedSize bytes)")
                        
                    } finally {
                        // Clean up temp file
                        tempFile.delete()
                    }
                } else {
                    println("Warning: Could not download S3 file: $s3Key")
                }
                
            } catch (e: Exception) {
                println("Error processing S3 file $s3Key: ${e.message}")
            }
        }
        
        // Create and save Unterlage
        if (materialien.isNotEmpty()) {
            val unterlage = Unterlage(0, packet, directoryName, materialien)
            unterlage.id = lms.addUnterlage(unterlage)
            println("Saved S3 directory to database: $directoryName with ${materialien.size} materials")
        }
    }
    
    println("S3 indexing completed!")
    println("Total directories processed: ${directoriesMap.size}")
    println("Total files processed: $totalFiles")
    println("Unique files stored: $uniqueFiles")
}

/**
 * Helper function to download S3 file to temporary location
 */
private fun downloadS3FileToTemp(fileStorage: FileStorage, s3Key: String): File? {
    return try {
        val inputStream = fileStorage.readFile(s3Key) ?: return null
        
        // Create temp file
        val fileName = s3Key.substringAfterLast("/")
        val fileExtension = fileName.substringAfterLast(".", "tmp")
        val tempFile = Files.createTempFile("s3_download_", ".$fileExtension").toFile()
        
        // Copy content
        inputStream.use { input ->
            tempFile.outputStream().use { output ->
                input.copyTo(output)
            }
        }
        
        tempFile
    } catch (e: Exception) {
        println("Error downloading S3 file $s3Key to temp: ${e.message}")
        null
    }
}

/**
 * Result of indexing operation
 */
data class IndexResult(
    val success: Boolean,
    val message: String,
    val totalDirectories: Int,
    val totalFiles: Int,
    val uniqueFiles: Int
)

/**
 * Index files from S3 bucket with specified bucket name
 * This function is called via API with bucket name parameter
 */
fun indexFromS3Bucket(bucketName: String, s3Prefix: String = "learning-materials/"): IndexResult {
    println("Starting S3 indexing from bucket: $bucketName with prefix: $s3Prefix")
    
    return try {
        // Create S3 FileStorage instance with provided bucket name
        val fileStorage = FileStorageFactory.createS3FileStorage(bucketName)
        processS3Files(fileStorage, s3Prefix, bucketName)
    } catch (e: Exception) {
        println("S3 indexing failed for bucket $bucketName: ${e.message}")
        IndexResult(
            success = false,
            message = "S3 indexing failed: ${e.message}",
            totalDirectories = 0,
            totalFiles = 0,
            uniqueFiles = 0
        )
    }
}

/**
 * Process S3 files and return IndexResult
 */
private fun processS3Files(fileStorage: FileStorage, s3Prefix: String, bucketName: String): IndexResult {
    // Get all files from S3 with the given prefix
    val allFiles = fileStorage.listFiles(s3Prefix)
    println("Found ${allFiles.size} files in S3 bucket $bucketName with prefix: $s3Prefix")
    
    if (allFiles.isEmpty()) {
        return IndexResult(
            success = true,
            message = "No files found in S3 bucket with prefix: $s3Prefix",
            totalDirectories = 0,
            totalFiles = 0,
            uniqueFiles = 0
        )
    }
    
    // Group files by "directory" (common prefix before last slash)
    val directoriesMap = allFiles
        .filter { !it.endsWith("/") } // Skip directory markers
        .groupBy { file ->
            // Extract directory name from S3 key
            val pathParts = file.removePrefix(s3Prefix).split("/")
            if (pathParts.size > 1) pathParts[0] else "root"
        }
    
    if (directoriesMap.isEmpty()) {
        return IndexResult(
            success = true,
            message = "No valid directories found in S3 files",
            totalDirectories = 0,
            totalFiles = 0,
            uniqueFiles = 0
        )
    }
    
    // Initialize services
    val cas = ContentAddressableStorage.create()
    val lms = LernmaterialService()
    lms.initialize()
    val mcardService = MCardService()
    
    // Load stopwords
    val stopwords = try {
        Files.readAllLines(Paths.get("stopwords/deutsche_stopwords_nltk.txt")).toSet()
    } catch (e: Exception) {
        println("Warning: Could not load stopwords file: ${e.message}")
        emptySet()
    }
    
    // Create main packet
    val logoImage = mcardService.getImagebyID(1)
    val packet = Packet(
        0,
        "S3 Materials: $bucketName",
        "Materials indexed from S3 bucket: $bucketName",
        logoImage
    )
    packet.id = lms.addPacket(packet)
    
    // Format for file sizes
    val sizeFormatter = DecimalFormat("#,###")
    val processedHashes = mutableMapOf<String, String>()
    var totalFiles = 0
    var uniqueFiles = 0
    
    println("Processing ${directoriesMap.size} directories from S3 bucket $bucketName...")
    
    // Process each directory
    directoriesMap.forEach { (directoryName, files) ->
        println("Processing S3 directory: $directoryName (${files.size} files)")
        
        val materialien: MutableList<Material> = mutableListOf()
        
        files.forEach { s3Key ->
            try {
                val fileName = s3Key.substringAfterLast("/")
                val fileExtension = fileName.substringAfterLast('.', "bin")
                
                // Get file size from S3
                val fileSize = fileStorage.getFileSize(s3Key) ?: 0L
                val formattedSize = sizeFormatter.format(fileSize)
                
                // Download file to temporary location for processing
                val tempFile = downloadS3FileToTemp(fileStorage, s3Key)
                
                if (tempFile != null) {
                    try {
                        // Store in CAS
                        val storageResult = cas.store(tempFile)
                        val contentId = storageResult.hash
                        
                        // Track unique files
                        if (!processedHashes.containsKey(contentId)) {
                            processedHashes[contentId] = contentId
                            uniqueFiles++
                        }
                        
                        // Extract text content
                        val content = extractTextFromPdf(tempFile.absolutePath)
                        val cleanContent = removeStopwords(content, stopwords)
                        
                        // Add to materials
                        materialien.add(
                            Material(
                                0,
                                fileName,
                                fileExtension,
                                fileSize,
                                contentId,
                                cleanContent
                            )
                        )
                        
                        totalFiles++
                        println("Processed S3 file: $fileName ($formattedSize bytes)")
                        
                    } finally {
                        // Clean up temp file
                        tempFile.delete()
                    }
                } else {
                    println("Warning: Could not download S3 file: $s3Key")
                }
                
            } catch (e: Exception) {
                println("Error processing S3 file $s3Key: ${e.message}")
            }
        }
        
        // Create and save Unterlage
        if (materialien.isNotEmpty()) {
            val unterlage = Unterlage(0, packet, directoryName, materialien)
            unterlage.id = lms.addUnterlage(unterlage)
            println("Saved S3 directory to database: $directoryName with ${materialien.size} materials")
        }
    }
    
    return IndexResult(
        success = true,
        message = "S3 indexing completed successfully from bucket: $bucketName",
        totalDirectories = directoriesMap.size,
        totalFiles = totalFiles,
        uniqueFiles = uniqueFiles
    )
}

fun index(dir: String) {
    val rootDir = File(dir)

    // Überprüfen, ob das Verzeichnis existiert
    if (!rootDir.exists() || !rootDir.isDirectory) {
        println("Verzeichnis existiert nicht: $dir")
        return
    }

    // Initialize Content Addressable Storage
    val cas = ContentAddressableStorage.create()

    // Liste aller Unterverzeichnisse im Hauptverzeichnis
    val directories = rootDir.listFiles()?.filter { it.isDirectory && it.name != "store" } ?: emptyList()

    // Falls keine Unterverzeichnisse gefunden wurden
    if (directories.isEmpty()) {
        println("Keine Unterverzeichnisse im Verzeichnis $dir gefunden")
        return
    }

    // Erstelle einen Index.txt im Hauptverzeichnis
    val indexFile = File(rootDir, "Index.txt")

    // Formatierung für Dateigröße
    val sizeFormatter = DecimalFormat("#,###")

    // Map zum Tracking von bereits verarbeiteten Hashes (für Deduplizierung)
    val processedHashes = mutableMapOf<String, String>()
    var gesamtDateiAnzahl = 0
    var gesamtEinzigartigeDateien = 0
    // Beginne mit dem Schreiben in die Indexdatei

    // Lade hier die Stopwords
    val stopwords = Files.readAllLines(Paths.get("stopwords/deutsche_stopwords_nltk.txt")).toSet()

    val lms = LernmaterialService()
    lms.initialize()

    val mcardService = MCardService()

    indexFile.bufferedWriter().use { writer ->
        writer.write("Laufnummer | Verzeichnisname | Schlagwörter | Dateiname | Typ der Datei | Größe (Bytes) | ContentID\n")
        writer.write("----------------------------------------------------------------------------------------------------------\n")

        var gesamtLaufnummer = 1


        val logoImage = mcardService.getImagebyID(1)
        val packet = Packet(
            0,
            "Fragen der Zentralmatura",
            "Die Unterlagen von https://www.matura.gv.at/downloads",
            logoImage
        )
        packet.id = lms.addPacket(packet)


        // Iteriere durch alle Unterverzeichnisse
        directories.forEachIndexed { dirIndex, directory ->
            val directoryName = directory.name


            // Extrahiere Schlagwörter (Wörter getrennt durch Leerzeichen oder Bindestriche)
            val keywords = directoryName
                .split(" ", "-")
                .filter { it.isNotBlank() }
                .map { it.trim() }
                .distinct()


            val keywordString = keywords.joinToString(", ")
            val dirLaufnummer = dirIndex + 1

            // Iteriere durch alle Dateien im Verzeichnis (rekursiv)
            val files = directory.walkTopDown().filter { it.isFile }.toList()
            val materialien: MutableList<Material> = mutableListOf()

            if (files.isEmpty()) {
                // Wenn der Ordner keine Dateien enthält, schreibe trotzdem eine Zeile für den Ordner
                writer.write("$gesamtLaufnummer | $directoryName | $keywordString | - | Verzeichnis | - | -\n")
                gesamtLaufnummer++
            } else {
                // Für jede Datei im Verzeichnis eine Zeile hinzufügen

                files.forEach { file ->

                    val fileName = file.name
                    val fileExtension = fileName.substringAfterLast('.', "bin")
                    val fileSize = file.length()
                    val formattedSize = sizeFormatter.format(fileSize)

                    // Store file in CAS and get hash
                    val storageResult = cas.store(file)
                    val contentId = storageResult.hash

                    // Track if this is a new unique file
                    if (!processedHashes.containsKey(contentId)) {
                        processedHashes[contentId] = contentId
                        gesamtEinzigartigeDateien++
                    }

                    // INdex the File
                    val content = extractTextFromPdf(file.absolutePath)
                    val cleanStopwords = removeStopwords(content, stopwords)
                    if (cleanStopwords == null) throw Exception("Content darf nicht null sein")
                    // Relativer Pfad vom Verzeichnis zur Datei für bessere Übersicht
                    val relativePath = file.absolutePath.substringAfter(directory.absolutePath + File.separator)

                    writer.write("$gesamtLaufnummer | $directoryName | $keywordString | $relativePath | $fileExtension | $formattedSize | $contentId\n")
                    gesamtLaufnummer++
                    gesamtDateiAnzahl++
                    // Erzeuge die Inhalte
                    materialien.add(
                        Material(
                            0,
                            fileName,
                            fileExtension,
                            storageResult.size,
                            contentId,
                            cleanStopwords
                        )
                    )
                }
            }
            val unterlage = Unterlage(0, packet, directoryName, materialien)
            unterlage.id = lms.addUnterlage(unterlage)


            println("Verzeichnis verarbeitet: $directoryName (Laufnummer: $dirLaufnummer) - ${files.size} Dateien")
            println("Unterlage wurde in die Datenbank gespeichert $unterlage")
        }

        // Abschluss der Indexerstellung
        writer.write("----------------------------------------------------------------------------------------------------------\n")
        writer.write("Insgesamt ${directories.size} Verzeichnisse und $gesamtDateiAnzahl Dateien indiziert.")
        writer.write("\nDavon $gesamtEinzigartigeDateien einzigartige Dateien im Store-Verzeichnis gespeichert.")
    }

    println("Index wurde erfolgreich erstellt: ${indexFile.absolutePath}")
    println("Insgesamt wurden ${directories.size} Verzeichnisse und $gesamtDateiAnzahl Dateien indiziert.")
    println("Davon wurden $gesamtEinzigartigeDateien einzigartige Dateien im Store-Verzeichnis gespeichert.")
}

/**
 * Berechnet den SHA-256 Hash einer Datei
 */
fun calculateSHA256(file: File): String {
    val digest = MessageDigest.getInstance("SHA-256")
    val buffer = ByteArray(8192)
    FileInputStream(file).use { fis ->
        var bytesRead: Int
        while (fis.read(buffer).also { bytesRead = it } != -1) {
            digest.update(buffer, 0, bytesRead)
        }
    }

    // Konvertiere den Hash in einen Hex-String
    return digest.digest().joinToString("") { "%02x".format(it) }
}

fun extractTextFromPdf(filePath: String): String {
    var content: String = " "
    try {
        if (filePath.endsWith("pdf")) {
            PDDocument.load(File(filePath)).use { document ->
                if (!document.isEncrypted) {
                    val stripper = PDFTextStripper()
                    content = stripper.getText(document)
                    if (content == null) content = " "
                } else {
                    println("PDF is encrypted, cannot extract text: $filePath")
                    null
                }
            }
        }
    } catch (e: IOException) {
        println("Error extracting text from PDF $filePath: ${e.message}")
        throw e
    }
    return content
}

fun removeStopwords(textString: String, stopwordsList: Set<String>): String {
    val normalizedStopwords = stopwordsList.map { it.lowercase() }.toSet()
    val words = textString.split(Regex("\\s+")) // Teilt den String an einem oder mehreren Leerzeichen
    val filteredWords = words.filter { word ->
        val cleanedWord = word.replace(Regex("[^\\p{L}\\p{N}]+"), "").lowercase()
        cleanedWord.isNotBlank() && cleanedWord !in normalizedStopwords
    }
    return filteredWords.joinToString(" ")
}


