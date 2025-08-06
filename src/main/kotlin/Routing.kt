package com.shut

import billing.integration.BillingInterceptor
import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.auth.authenticate
import io.ktor.server.auth.jwt.JWTPrincipal
import io.ktor.server.auth.principal
import io.ktor.server.http.content.*
import io.ktor.server.request.ContentTransformationException
import io.ktor.server.request.receive
import io.ktor.server.request.receiveStream
import io.ktor.server.response.*
import io.ktor.server.routing.*
import io.ktor.server.sse.*
import io.ktor.server.freemarker.*
import io.ktor.server.webjars.*
import io.ktor.sse.*
import org.apache.commons.lang3.IntegerRange
import java.io.ByteArrayInputStream
import java.io.File
import java.io.InputStream
import java.util.UUID
import org.apache.pdfbox.pdmodel.PDDocument
import org.apache.pdfbox.text.PDFTextStripper

// Helper function to charge API call and get user ID
suspend fun ApplicationCall.chargeApiCallAndGetUserId(billingInterceptor: BillingInterceptor): Int? {
    val userId = getCurrentUserId()
    if (userId != null) {
        try {
            billingInterceptor.checkAndDebitApiCall(userId)
        } catch (e: Exception) {
            respond(
                HttpStatusCode.PaymentRequired,
                mapOf("error" to "Insufficient CardCoin balance", "details" to e.message)
            )
            return null
        }
    }
    return userId
}

// Helper function to get current user ID from JWT
suspend fun ApplicationCall.getCurrentUserId(): Int? {
    return try {
        val principal = principal<JWTPrincipal>()
        val username = principal?.payload?.getClaim("username")?.asString()

        if (username != null) {
            val userCredentialsService = UserCredentialsService()
            val user = userCredentialsService.getUserCredentialsByUsername(username)
            user?.id
        } else {
            null
        }
    } catch (e: Exception) {
        null
    }
}

fun extractTextFromPdf(inputStream: InputStream): String {
    return try {
        val document = PDDocument.load(inputStream)
        val stripper = PDFTextStripper()
        val text = stripper.getText(document)
        document.close()
        text
    } catch (e: Exception) {
        throw RuntimeException("Fehler beim Extrahieren des PDF-Texts: ${e.message}", e)
    }
}

fun Application.configureRouting() {
    install(SSE)

    val billingInterceptor = BillingInterceptor()
    val mcs = MCardService()
    val mms = LernmaterialService()
    val counterService = CounterService()
    val buchungsKartenService = BuchungsKartenService()
    val cas = ContentAddressableStorage.create()
    val uploadDir = java.io.File("uploads")
    if (!uploadDir.exists()) {
        uploadDir.mkdirs()
    }

    install(Webjars) {
        path = "/webjars" //defaults to /webjars
    }

    routing {
        get("/health") {
            try {
                val healthData = mutableMapOf<String, Any>(
                    "status" to "healthy", 
                    "timestamp" to System.currentTimeMillis(),
                    "environment" to (System.getenv("KTOR_ENV") ?: "unknown"),
                    "lambda" to true,
                    "db_host" to (System.getenv("DB_HOST") ?: "not_set"),
                    "s3_bucket" to (System.getenv("S3_BUCKET_NAME") ?: "not_set")
                )
                
                // Test FileStorage
                try {
                    val isFileStorageInit = storage.FileStorageProvider.isInitialized()
                    healthData["file_storage_initialized"] = isFileStorageInit
                    
                    if (isFileStorageInit) {
                        val fileStorage = storage.FileStorageProvider.getInstance()
                        healthData["file_storage_type"] = fileStorage.javaClass.simpleName
                    }
                } catch (e: Exception) {
                    healthData["file_storage_error"] = e.message ?: "unknown error"
                }
                
                // Test database connectivity
                try {
                    val dbHost = System.getenv("DB_HOST")
                    if (dbHost != null) {
                        val address = java.net.InetAddress.getByName(dbHost)
                        healthData["db_dns_resolution"] = "success"
                        healthData["db_ip"] = address.hostAddress
                    }
                } catch (e: Exception) {
                    healthData["db_dns_resolution"] = "failed"
                    healthData["db_dns_error"] = e.message ?: "unknown error"
                }
                
                // Test S3 connectivity (basic)
                try {
                    val bucketName = System.getenv("S3_BUCKET_NAME")
                    if (bucketName != null && storage.FileStorageProvider.isInitialized()) {
                        val fileStorage = storage.FileStorageProvider.getInstance()
                        if (fileStorage is storage.S3FileStorage) {
                            healthData["s3_storage_active"] = true
                        } else {
                            healthData["s3_storage_active"] = false
                            healthData["actual_storage_type"] = fileStorage.javaClass.simpleName
                        }
                    }
                } catch (e: Exception) {
                    healthData["s3_test_error"] = e.message ?: "unknown error"
                }
                
                call.respond(HttpStatusCode.OK, healthData)
            } catch (e: Exception) {
                call.respond(HttpStatusCode.InternalServerError, mapOf(
                    "status" to "ERROR",
                    "error" to e.message,
                    "type" to e.javaClass.simpleName
                ))
            }
        }
        sse("/hello") {
            send(ServerSentEvent("world"))
        }
        get("/webjars") {
            call.respondText("<script src='/webjars/jquery/jquery.js'></script>", ContentType.Text.Html)
        }
        // Static plugin. Try to access `/static/index.html`
        staticResources("/static", "static")

        // Anonymous public dossier access (no authentication required)
        get("/dms/public/dossier/{anonymousId}") {
            val anonymousId = call.parameters["anonymousId"]
            if (anonymousId != null) {
                call.respondRedirect("/static/dms/html/anonymous.html?dossier="+anonymousId.toString())
            } else {
                call.respond(HttpStatusCode.BadRequest, "Invalid dossier ID")
            }
        }

        authenticate {
            // DMS Interface Route
            get("/dms") {
                val userId = call.chargeApiCallAndGetUserId(billingInterceptor)
                if (userId != null) {
                    val groupProductService = GroupProductService()
                    val userProducts = groupProductService.getUserProducts(userId)
                    val hasDMSAccess = userProducts.any { it.name == "Card DMS" }

                    if (hasDMSAccess) {
                        call.respondRedirect("/static/dms/html/dms.html")
                    } else {
                        call.respond(HttpStatusCode.Forbidden, "Access to Card DMS not granted")
                    }
                } else {
                    call.respond(HttpStatusCode.Unauthorized, "Authentication required")
                }
            }

            // Legacy routes removed - using new group-based API endpoints in Security.kt
            // All topic routes now handled by /learning-topics in Security.kt
            // All memory card routes now handled by /learning-cards in Security.kt

            // Image routes moved to Security.kt for group-based isolation
            post("/images/content/{filename}") {
                val filename = call.parameters["filename"]?.toString()
                    ?: throw IllegalArgumentException("Invalid filename in path")
                val fileExtension = filename.substringAfterLast('.', "jpg")
                val inputStream = call.receiveStream()

                // Store original file in CAS
                val originalResult = cas.store(inputStream)

                // Create thumbnail and store in CAS
                val thumbnailService = ThumbnailService()
                val originalStream = cas.retrieveAsStream(originalResult.hash)!!
                val thumbnailHash = thumbnailService.createThumbnail(
                    originalStream,
                    filename,
                    fileExtension
                )

                // Create resized version and store in CAS
                val resizeService = ResizeService()
                val originalStreamForResize = cas.retrieveAsStream(originalResult.hash)!!
                val resizedHash = resizeService.createResized(
                    originalStreamForResize,
                    filename,
                    fileExtension
                )

                call.respond(
                    HttpStatusCode.Created, mapOf(
                        "id" to originalResult.hash,
                        "thumbnailId" to thumbnailHash,
                        "resizedId" to resizedHash,
                        "size" to originalResult.size
                    )
                )
            }

            post("/images/upload/{filename}") {
                val userId = call.chargeApiCallAndGetUserId(billingInterceptor)
                if (userId == null) return@post

                val filename = call.parameters["filename"]?.toString()
                    ?: throw IllegalArgumentException("Invalid filename in path")
                val fileExtension = filename.substringAfterLast('.', "jpg")
                val inputStream = call.receiveStream()

                // Store original file in CAS
                val originalResult = cas.store(inputStream)

                // Create thumbnail and store in CAS
                val thumbnailService = ThumbnailService()
                val originalStream = cas.retrieveAsStream(originalResult.hash)!!
                val thumbnailHash = thumbnailService.createThumbnail(
                    originalStream,
                    filename,
                    fileExtension
                )

                // Create resized version and store in CAS
                val resizeService = ResizeService()
                val originalStreamForResize = cas.retrieveAsStream(originalResult.hash)!!
                val resizedHash = resizeService.createResized(
                    originalStreamForResize,
                    filename,
                    fileExtension
                )

                // Create database entry with all hashes
                val image = Image(
                    id = 0L, // Will be auto-generated
                    name = filename,
                    extension = fileExtension,
                    location = originalResult.hash,
                    thumbnailHash = thumbnailHash,
                    resizedHash = resizedHash,
                    groupId = 0, // Will be set by createImage
                    createdBy = userId
                )

                val mcardService = MCardService()
                val imageId = mcardService.createImage(image, userId)

                call.respond(
                    HttpStatusCode.Created, mapOf(
                        "id" to imageId,
                        "originalHash" to originalResult.hash,
                        "thumbnailHash" to thumbnailHash,
                        "resizedHash" to resizedHash,
                        "size" to originalResult.size
                    )
                )
            }

            get("/content/{hash}") {
                try {
                    val hash = call.parameters["hash"] ?: return@get call.respond(
                        HttpStatusCode.BadRequest,
                        "Hash fehlt"
                    )
                    
                    // Debug logging
                    application.environment.log.info("Retrieving content for hash: $hash")
                    application.environment.log.info("CAS instance: ${cas.javaClass.simpleName}")
                    
                    val inputStream = cas.retrieveAsStream(hash)
                    if (inputStream == null) {
                        application.environment.log.warn("File not found for hash: $hash")
                        call.respond(HttpStatusCode.NotFound, "Datei nicht gefunden")
                        return@get
                    }

                    // Try to determine content type from file content or default to octet-stream
                    val contentType = when {
                        hash.endsWith(".jpg") || hash.endsWith(".jpeg") -> ContentType.Image.JPEG
                        hash.endsWith(".png") -> ContentType.Image.PNG
                        hash.endsWith(".gif") -> ContentType.Image.GIF
                        hash.endsWith(".pdf") -> ContentType.Application.Pdf
                        else -> ContentType.Application.OctetStream
                    }

                    application.environment.log.info("Serving file with content type: $contentType")
                    call.respondBytes(inputStream.readBytes(), contentType)
                } catch (e: Exception) {
                    val hash = call.parameters["hash"] ?: "unknown"
                    application.environment.log.error("Error serving content for hash: $hash", e)
                    call.respond(
                        HttpStatusCode.InternalServerError,
                        "Fehler beim Bereitstellen der Datei: ${e.localizedMessage}"
                    )
                }
            }

            get("/resize/{hash}") {
                try {
                    val hash = call.parameters["hash"] ?: return@get call.respond(
                        HttpStatusCode.BadRequest,
                        "Hash fehlt"
                    )
                    val resizeService = ResizeService()
                    val resizedStream = resizeService.getResizedStream(hash)
                    if (resizedStream == null) {
                        call.respond(HttpStatusCode.NotFound, "Resized image nicht gefunden")
                        return@get
                    }

                    val contentType = ContentType.Image.Any
                    call.response.header(HttpHeaders.CacheControl, "public, max-age=3600")
                    val fileBytes = resizedStream.use { it.readBytes() }
                    call.respondBytes(fileBytes, contentType)
                } catch (e: Exception) {
                    call.respond(
                        HttpStatusCode.InternalServerError,
                        "Fehler beim Bereitstellen des Bildes: ${e.localizedMessage}"
                    )
                }
            }


            // Legacy memorycard routes removed - now handled by /learning-cards in Security.kt

            delete("/database/all") {
                try {
                    val totalDeleted = mcs.deleteAllData()
                    call.respond(
                        HttpStatusCode.OK,
                        mapOf("message" to "Alle Datenbankeinträge wurden gelöscht", "totalDeleted" to totalDeleted)
                    )
                } catch (e: Exception) {
                    call.respond(
                        HttpStatusCode.InternalServerError,
                        mapOf("message" to "Fehler beim Löschen aller Datenbankeinträge: ${e.localizedMessage}")
                    )
                }
            }

            // Legacy demo data route removed - addDemoData() references old schema

            get("/index") {
                startIndexer()
            }

            get("/storage/statistics") {
                try {
                    val cas = ContentAddressableStorage.create()
                    val statistics = cas.getStatistics()
                    call.respond(HttpStatusCode.OK, statistics)
                } catch (e: Exception) {
                    call.respond(
                        HttpStatusCode.InternalServerError,
                        mapOf("error" to "Error loading storage statistics: ${e.message}")
                    )
                }
            }

            get("/storage/migration/verify") {
                try {
                    val includeDetails = call.request.queryParameters["details"]?.toBoolean() ?: false
                    val verificationService = storage.migration.StorageMigrationVerificationService()
                    val result = verificationService.verifyMigration(includeDetails)
                    call.respond(HttpStatusCode.OK, result)
                } catch (e: Exception) {
                    call.respond(
                        HttpStatusCode.InternalServerError,
                        mapOf("error" to "Storage migration verification failed: ${e.message}")
                    )
                }
            }

            get("/storage/migration/missing-files") {
                try {
                    val verificationService = storage.migration.StorageMigrationVerificationService()
                    val missingFiles = verificationService.getDetailedMissingFilesList()
                    call.respond(HttpStatusCode.OK, mapOf("missingFiles" to missingFiles))
                } catch (e: Exception) {
                    call.respond(
                        HttpStatusCode.InternalServerError,
                        mapOf("error" to "Failed to get missing files list: ${e.message}")
                    )
                }
            }

            get("/storage/migration/orphaned-files") {
                try {
                    val limit = call.request.queryParameters["limit"]?.toIntOrNull() ?: 100
                    val verificationService = storage.migration.StorageMigrationVerificationService()
                    val orphanedFiles = verificationService.getOrphanedFilesPreview(limit)
                    call.respond(
                        HttpStatusCode.OK, mapOf(
                            "orphanedFiles" to orphanedFiles,
                            "totalShown" to orphanedFiles.size,
                            "limit" to limit
                        )
                    )
                } catch (e: Exception) {
                    call.respond(
                        HttpStatusCode.InternalServerError,
                        mapOf("error" to "Failed to get orphaned files list: ${e.message}")
                    )
                }
            }

            get("/storage/files") {
                try {
                    val prefix = call.request.queryParameters["prefix"] ?: ""
                    val limit = call.request.queryParameters["limit"]?.toIntOrNull() ?: 1000
                    val includeSize = call.request.queryParameters["includeSize"]?.toBoolean() ?: false

                    val fileStorage = storage.FileStorageProvider.getInstance()
                    val allFiles = fileStorage.listFiles(prefix)

                    val limitedFiles = allFiles.take(limit)

                    val fileInfoList = if (includeSize) {
                        limitedFiles.map { filePath ->
                            val size = try {
                                fileStorage.getFileSize(filePath) ?: 0L
                            } catch (e: Exception) {
                                0L
                            }
                            mapOf(
                                "path" to filePath,
                                "size" to size
                            )
                        }
                    } else {
                        limitedFiles.map { filePath ->
                            mapOf("path" to filePath)
                        }
                    }

                    call.respond(
                        HttpStatusCode.OK, mapOf(
                            "files" to fileInfoList,
                            "totalFiles" to allFiles.size,
                            "shown" to limitedFiles.size,
                            "limit" to limit,
                            "prefix" to prefix,
                            "includeSize" to includeSize
                        )
                    )
                } catch (e: Exception) {
                    call.respond(
                        HttpStatusCode.InternalServerError,
                        mapOf("error" to "Failed to list storage files: ${e.message}")
                    )
                }
            }

            get("/storage/files/relationships") {
                try {
                    val limit = call.request.queryParameters["limit"]?.toIntOrNull() ?: 1000
                    val onlyOrphaned = call.request.queryParameters["onlyOrphaned"]?.toBoolean() ?: false
                    val onlyUsed = call.request.queryParameters["onlyUsed"]?.toBoolean() ?: false

                    val verificationService = storage.migration.StorageMigrationVerificationService()
                    var relationships = verificationService.getFileRelationships(limit)

                    // Filter based on parameters
                    if (onlyOrphaned) {
                        relationships = relationships.filter { it.isOrphaned }
                    } else if (onlyUsed) {
                        relationships = relationships.filter { !it.isOrphaned }
                    }

                    val summary = mapOf(
                        "totalFiles" to relationships.size,
                        "orphanedFiles" to relationships.count { it.isOrphaned },
                        "usedFiles" to relationships.count { !it.isOrphaned },
                        "totalReferences" to relationships.sumOf { it.usedBy.size }
                    )

                    call.respond(
                        HttpStatusCode.OK, mapOf(
                            "relationships" to relationships,
                            "summary" to summary,
                            "filters" to mapOf(
                                "limit" to limit,
                                "onlyOrphaned" to onlyOrphaned,
                                "onlyUsed" to onlyUsed
                            )
                        )
                    )
                } catch (e: Exception) {
                    call.respond(
                        HttpStatusCode.InternalServerError,
                        mapOf("error" to "Failed to get file relationships: ${e.message}")
                    )
                }
            }

            get("/storage/files/relationships/{hash}") {
                try {
                    val hash = call.parameters["hash"] ?: return@get call.respond(
                        HttpStatusCode.BadRequest,
                        mapOf("error" to "Hash parameter is required")
                    )

                    val verificationService = storage.migration.StorageMigrationVerificationService()
                    val relationship = verificationService.getFileRelationshipByHash(hash)

                    if (relationship != null) {
                        call.respond(HttpStatusCode.OK, relationship)
                    } else {
                        call.respond(
                            HttpStatusCode.NotFound,
                            mapOf("error" to "File with hash '$hash' not found in storage or database")
                        )
                    }
                } catch (e: Exception) {
                    call.respond(
                        HttpStatusCode.InternalServerError,
                        mapOf("error" to "Failed to get file relationship: ${e.message}")
                    )
                }
            }

            post("/storage/migration/cleanup") {
                try {
                    val dryRun = call.request.queryParameters["dryRun"]?.toBoolean() ?: true
                    val includeDetails = call.request.queryParameters["details"]?.toBoolean() ?: false
                    val confirmation = call.request.queryParameters["confirm"]?.toBoolean() ?: false

                    // Safety check - require explicit confirmation for actual deletion
                    if (!dryRun && !confirmation) {
                        call.respond(
                            HttpStatusCode.BadRequest,
                            mapOf(
                                "error" to "Actual file deletion requires explicit confirmation",
                                "message" to "Add ?confirm=true&dryRun=false to actually delete files",
                                "suggestion" to "Run with ?dryRun=true first to preview what would be deleted"
                            )
                        )
                        return@post
                    }

                    val verificationService = storage.migration.StorageMigrationVerificationService()
                    val result = verificationService.cleanupOrphanedFiles(dryRun, includeDetails)

                    val statusCode = when (result.status) {
                        "success" -> HttpStatusCode.OK
                        "partial" -> HttpStatusCode.PartialContent
                        else -> HttpStatusCode.InternalServerError
                    }

                    call.respond(statusCode, result)
                } catch (e: Exception) {
                    call.respond(
                        HttpStatusCode.InternalServerError,
                        mapOf("error" to "Cleanup operation failed: ${e.message}")
                    )
                }
            }

            get("/unterlagen") {
                try {
                    // 1. Get query parameters
                    val page = call.request.queryParameters["page"]?.toIntOrNull() ?: 1 // Default to page 1
                    val pageSize =
                        call.request.queryParameters["pageSize"]?.toIntOrNull() ?: 10 // Default to 10 items per page

                    // Optional: Add more robust validation for page and pageSize if needed
                    if (page <= 0 || pageSize <= 0) {
                        call.respond(HttpStatusCode.BadRequest, "Page and pageSize must be positive integers.")
                        return@get // Exit the route handler
                    }

                    val mcall = mms.getUnterlagenAllInfo(page = page, pageSize = pageSize)
                    call.respond(mcall)
                } catch (e: Exception) {
                    call.respond(HttpStatusCode.NoContent)
                }
            }

            get("/unterlagen/anz") {
                try {
                    val anz = mms.getUnterlagenAllInfoAnz()
                    call.respond(HttpStatusCode.OK, mapOf("count" to anz))
                } catch (e: Exception) {
                    call.respond(HttpStatusCode.NoContent)
                }
            }

            get("/unterlagen/search") {
                try {
                    val userId = call.chargeApiCallAndGetUserId(billingInterceptor)
                    if (userId == null) return@get

                    val searchTerm = call.request.queryParameters["q"] ?: ""
                    val page = call.request.queryParameters["page"]?.toIntOrNull() ?: 1
                    val pageSize = call.request.queryParameters["pageSize"]?.toIntOrNull() ?: 10

                    if (page <= 0 || pageSize <= 0) {
                        call.respond(HttpStatusCode.BadRequest, "Page and pageSize must be positive integers.")
                        return@get
                    }

                    if (searchTerm.isBlank()) {
                        call.respond(HttpStatusCode.BadRequest, "Search term cannot be empty.")
                        return@get
                    }

                    val results = mms.searchUnterlagen(searchTerm, page, pageSize)
                    call.respond(results)
                } catch (e: Exception) {
                    call.respond(HttpStatusCode.InternalServerError, "Search failed: ${e.message}")
                }
            }

            get("/unterlagen/search/anz") {
                try {
                    val userId = call.chargeApiCallAndGetUserId(billingInterceptor)
                    if (userId == null) return@get

                    val searchTerm = call.request.queryParameters["q"] ?: ""

                    if (searchTerm.isBlank()) {
                        call.respond(HttpStatusCode.BadRequest, "Search term cannot be empty.")
                        return@get
                    }

                    val count = mms.searchUnterlagenAnz(searchTerm)
                    call.respond(HttpStatusCode.OK, mapOf("count" to count))
                } catch (e: Exception) {
                    call.respond(HttpStatusCode.InternalServerError, "Search count failed: ${e.message}")
                }
            }


            get("/material/content/{contentID}") {
                try {
                    val contentID = call.parameters["contentID"] ?: return@get call.respond(
                        HttpStatusCode.BadRequest,
                        "Content ID fehlt"
                    )
                    // First try CAS, then fallback to legacy store directory
                    var inputStream = cas.retrieveAsStream(contentID)
                    if (inputStream == null) {
                        val legacyFile = File("store/$contentID")
                        if (legacyFile.exists()) {
                            inputStream = legacyFile.inputStream()
                        }
                    }
                    if (inputStream == null) {
                        call.respond(HttpStatusCode.NotFound, "Contentfile nicht gefunden")
                        return@get
                    }
                    val contentType = when (contentID.substringAfterLast('.', "").lowercase()) {
                        "zip" -> ContentType.Application.Zip
                        "mp3" -> ContentType.Audio.MPEG
                        "pdf" -> ContentType.Application.Pdf
                        "rtf" -> ContentType.Application.Docx
                        else -> ContentType.Application.OctetStream
                    }
                    call.response.header(HttpHeaders.CacheControl, "public, max-age=3600")
                    call.respondBytes(inputStream.readBytes(), contentType)
                } catch (e: Exception) {
                    call.respond(
                        HttpStatusCode.InternalServerError,
                        "Fehler beim Bereitstellen des Contents: ${e.localizedMessage}"
                    )
                }
            }

            post("/ask") {
                val frage: Frage = call.receive<Frage>()
                val antwort: String = askGemini(frage.frage)
                call.respond(HttpStatusCode.OK, mapOf("antwort" to antwort))
            }


            post("/stroke") {
                try {
                    val newStroke = call.receive<Stroke>()
                    val createdStrokeID = counterService.addStroke(newStroke)
                    newStroke.id = createdStrokeID
                    call.respond(HttpStatusCode.Created, newStroke)
                } catch (e: Exception) {
                    call.respond(HttpStatusCode.BadRequest, "Fehler beim Erstellen des Stroke: ${e.localizedMessage}")
                }
            }

            get("/stroke") {
                try {
                    val allStrokes = counterService.getStrokeAll()
                    call.respond(allStrokes)
                } catch (e: Exception) {
                    call.respond(HttpStatusCode.NoContent)
                }
            }

            delete("/stroke/{id}") {
                try {
                    val id = call.parameters["id"]?.toLong() ?: throw IllegalArgumentException("Invalid ID in path")
                    val numdele = counterService.deleteStroke(id)
                    call.respond(HttpStatusCode.OK, mapOf("message" to "${numdele} Stroke with id ${id} was deleted"))
                } catch (e: Exception) {
                    call.respond(
                        HttpStatusCode.InternalServerError,
                        mapOf("message" to "Error deleting Stroke: ${e.localizedMessage}")
                    )
                }
            }

            get("/stroke/{id}") {
                try {
                    val id = call.parameters["id"]?.toLong() ?: throw IllegalArgumentException("Invalid ID")
                    val strokes = counterService.getStrokebyId(id)
                    if (strokes.size > 0) {
                        call.respond(strokes)
                    } else {
                        call.respond(HttpStatusCode.NotFound)
                    }
                } catch (e: Exception) {
                    call.respond(HttpStatusCode.BadRequest, "Invalid ID: ${call.parameters["id"]}")
                }
            }

            get("/stroke/anz/{id}") {
                try {
                    val id = call.parameters["id"]?.toLong() ?: throw IllegalArgumentException("Invalid ID")
                    val strokes = counterService.getStrokebyId(id)
                    if (strokes.size > 0) {
                        call.respond(mapOf("number" to strokes.size))
                    } else {
                        call.respond(HttpStatusCode.NotFound)
                    }
                } catch (e: Exception) {
                    call.respond(HttpStatusCode.BadRequest, "Invalid ID: ${call.parameters["id"]}")
                }
            }


            // Buchungskarten API Endpoints
            get("/buchungsarten") {
                try {
                    val userId = call.getCurrentUserId()
                    if (userId == null) {
                        call.respond(HttpStatusCode.Unauthorized, mapOf("error" to "Authentication required"))
                        return@get
                    }

                    val buchungsArten = buchungsKartenService.getBuchungsArtenForUser(userId)
                    call.respond(HttpStatusCode.OK, buchungsArten)
                } catch (e: Exception) {
                    call.respond(
                        HttpStatusCode.InternalServerError,
                        mapOf("error" to "Fehler beim Laden der Buchungsarten: ${e.message}")
                    )
                }
            }

            get("/buchungskategorien/{buchungsartId}") {
                try {
                    val userId = call.getCurrentUserId()
                    if (userId == null) {
                        call.respond(HttpStatusCode.Unauthorized, mapOf("error" to "Authentication required"))
                        return@get
                    }

                    val buchungsartId = call.parameters["buchungsartId"]?.toLongOrNull()
                    if (buchungsartId == null) {
                        call.respond(HttpStatusCode.BadRequest, mapOf("error" to "Ungültige Buchungsart-ID"))
                        return@get
                    }

                    val kategorien = buchungsKartenService.getKategorienForUser(userId, buchungsartId)
                    call.respond(HttpStatusCode.OK, kategorien)
                } catch (e: Exception) {
                    call.respond(
                        HttpStatusCode.InternalServerError,
                        mapOf("error" to "Fehler beim Laden der Kategorien: ${e.message}")
                    )
                }
            }

            get("/buchungskarten") {
                try {
                    val userId = call.getCurrentUserId()
                    if (userId == null) {
                        call.respond(HttpStatusCode.Unauthorized, mapOf("error" to "Authentication required"))
                        return@get
                    }

                    val buchungsKarten = buchungsKartenService.getBuchungsKartenForUser(userId)
                    call.respond(HttpStatusCode.OK, buchungsKarten)
                } catch (e: Exception) {
                    call.respond(
                        HttpStatusCode.InternalServerError,
                        mapOf("error" to "Fehler beim Laden der Buchungskarten: ${e.message}")
                    )
                }
            }

            get("/buchungskarten/zeitraum") {
                try {
                    val datumVon = call.request.queryParameters["datumVon"]
                    val datumBis = call.request.queryParameters["datumBis"]

                    if (datumVon.isNullOrEmpty() || datumBis.isNullOrEmpty()) {
                        call.respond(
                            HttpStatusCode.BadRequest,
                            mapOf("error" to "datumVon und datumBis Parameter sind erforderlich")
                        )
                        return@get
                    }

                    val userId = call.getCurrentUserId()
                    if (userId == null) {
                        call.respond(HttpStatusCode.Unauthorized, mapOf("error" to "Authentication required"))
                        return@get
                    }

                    val buchungsKarten = buchungsKartenService.getBuchungsKartenByDateRange(datumVon, datumBis, userId)
                    call.respond(HttpStatusCode.OK, buchungsKarten)
                } catch (e: Exception) {
                    call.respond(
                        HttpStatusCode.InternalServerError,
                        mapOf("error" to "Fehler beim Laden der Buchungskarten für den Zeitraum: ${e.message}")
                    )
                }
            }

            post("/buchungskarten") {
                try {
                    val userId = call.getCurrentUserId()
                    if (userId == null) {
                        call.respond(HttpStatusCode.Unauthorized, mapOf("error" to "Authentication required"))
                        return@post
                    }

                    val buchungsKarte = call.receive<BuchungsKarte>()
                    val id = buchungsKartenService.addBuchungsKarte(buchungsKarte, userId)
                    call.respond(
                        HttpStatusCode.Created,
                        mapOf("id" to id, "message" to "Buchungskarte erfolgreich erstellt")
                    )
                } catch (e: ContentTransformationException) {
                    call.respond(HttpStatusCode.BadRequest, mapOf("error" to "Ungültige Anfrage: ${e.message}"))
                } catch (e: Exception) {
                    call.respond(
                        HttpStatusCode.InternalServerError,
                        mapOf("error" to "Fehler beim Erstellen der Buchungskarte: ${e.message}")
                    )
                }
            }

            put("/buchungskarten/{id}") {
                try {
                    val userId = call.getCurrentUserId()
                    if (userId == null) {
                        call.respond(HttpStatusCode.Unauthorized, mapOf("error" to "Authentication required"))
                        return@put
                    }

                    val id = call.parameters["id"]?.toLongOrNull()
                    if (id == null) {
                        call.respond(HttpStatusCode.BadRequest, mapOf("error" to "Ungültige ID"))
                        return@put
                    }

                    val updateData = call.receive<UpdateBuchungsKarteRequest>()
                    val success = buchungsKartenService.updateBuchungsKarte(id, updateData, userId)

                    if (success) {
                        call.respond(HttpStatusCode.OK, mapOf("message" to "Buchungskarte erfolgreich aktualisiert"))
                    } else {
                        call.respond(
                            HttpStatusCode.NotFound,
                            mapOf("error" to "Buchungskarte nicht gefunden oder keine Berechtigung")
                        )
                    }
                } catch (e: ContentTransformationException) {
                    call.respond(HttpStatusCode.BadRequest, mapOf("error" to "Ungültige Anfrage: ${e.message}"))
                } catch (e: Exception) {
                    call.respond(
                        HttpStatusCode.InternalServerError,
                        mapOf("error" to "Fehler beim Aktualisieren der Buchungskarte: ${e.message}")
                    )
                }
            }

            delete("/buchungskarten/{id}") {
                try {
                    val id = call.parameters["id"]?.toLongOrNull()
                    if (id == null) {
                        call.respond(HttpStatusCode.BadRequest, mapOf("error" to "Ungültige Buchungskarten-ID"))
                        return@delete
                    }

                    val userId = call.getCurrentUserId()
                    if (userId == null) {
                        call.respond(HttpStatusCode.Unauthorized, mapOf("error" to "Authentication required"))
                        return@delete
                    }

                    val deleted = buchungsKartenService.deleteBuchungsKarte(id, userId)
                    if (deleted) {
                        call.respond(HttpStatusCode.OK, mapOf("message" to "Buchungskarte erfolgreich gelöscht"))
                    } else {
                        call.respond(HttpStatusCode.NotFound, mapOf("error" to "Buchungskarte nicht gefunden"))
                    }
                } catch (e: Exception) {
                    call.respond(
                        HttpStatusCode.InternalServerError,
                        mapOf("error" to "Fehler beim Löschen der Buchungskarte: ${e.message}")
                    )
                }
            }

            post("/extract-pdf-text") {
                try {
                    val inputStream = call.receiveStream()
                    val text = extractTextFromPdf(inputStream)
                    call.respond(HttpStatusCode.OK, mapOf("text" to text))
                } catch (e: Exception) {
                    call.respond(
                        HttpStatusCode.InternalServerError,
                        mapOf("error" to "Fehler bei der PDF-Textextraktion: ${e.message}")
                    )
                }
            }

            post("/dokument") {
                try {
                    val dokument = call.receive<Dokument>()
                    val id = buchungsKartenService.addDokument(dokument)
                    call.respond(
                        HttpStatusCode.Created,
                        mapOf("id" to id, "message" to "Dokument erfolgreich hochgeladen")
                    )
                } catch (e: ContentTransformationException) {
                    call.respond(HttpStatusCode.BadRequest, mapOf("error" to "Ungültige Anfrage: ${e.message}"))
                } catch (e: Exception) {
                    call.respond(
                        HttpStatusCode.InternalServerError,
                        mapOf("error" to "Fehler beim Hochladen des Dokuments: ${e.message}")
                    )
                }
            }

            get("/dokument/{id}") {
                try {
                    val id = call.parameters["id"]?.toLongOrNull()
                    if (id == null) {
                        call.respond(HttpStatusCode.BadRequest, mapOf("error" to "Ungültige Dokument-ID"))
                        return@get
                    }

                    val dokument = buchungsKartenService.getDokumentById(id)
                    if (dokument != null) {
                        println("DEBUG: Retrieved document: id=${dokument.id}, name=${dokument.name}, originalName=${dokument.originalName}, pfad=${dokument.pfad}")

                        // Try to get file from CAS using the hash stored as name
                        var inputStream = cas.retrieveAsStream(dokument.name)
                        var fromCas = true
                        var fileSize = 0L

                        // If not found in CAS, try legacy path (fallback for old documents)
                        if (inputStream == null) {
                            println("DEBUG: File not found in CAS, trying legacy path: ${dokument.pfad}")
                            val legacyFile = File(dokument.pfad)
                            if (legacyFile.exists()) {
                                inputStream = legacyFile.inputStream()
                                fileSize = legacyFile.length()
                                fromCas = false
                            }
                        } else {
                            // For CAS files, get size from CAS
                            val storageInfo = cas.getStorageInfo(dokument.name)
                            fileSize = storageInfo?.size ?: 0L
                        }

                        if (inputStream != null) {
                            println("DEBUG: File found (from CAS: $fromCas, size: $fileSize)")

                            // Set proper content type and disposition
                            val contentType = when (dokument.dateityp.lowercase()) {
                                "application/pdf" -> ContentType.Application.Pdf
                                "image/jpeg", "image/jpg" -> ContentType.Image.JPEG
                                "image/png" -> ContentType.Image.PNG
                                else -> ContentType.Application.OctetStream
                            }

                            println("DEBUG: Setting content type to: $contentType for dateityp: ${dokument.dateityp}")

                            // Record download metrics (downloads are free, but tracked)
                            try {
                                val principal = call.principal<JWTPrincipal>()
                                val userId = principal?.payload?.getClaim("userId")?.asInt()
                                if (userId != null) {
                                    billingInterceptor.recordFileDownload(userId, fileSize)
                                    println("DEBUG: Download metrics recorded for user $userId, size: $fileSize bytes")
                                }
                            } catch (e: Exception) {
                                println("DEBUG: Error recording download metrics: ${e.message}")
                                // Don't fail the download if metrics recording fails
                            }

                            // Set headers before responding
                            call.response.header(HttpHeaders.ContentType, contentType.toString())
                            call.response.header(
                                HttpHeaders.ContentDisposition,
                                ContentDisposition.Attachment.withParameter(
                                    ContentDisposition.Parameters.FileName, dokument.originalName
                                ).toString()
                            )

                            // Respond with stream content
                            call.respondBytes(inputStream.readBytes(), contentType)
                        } else {
                            println("DEBUG: File not found anywhere. CAS name: ${dokument.name}, Legacy path: ${dokument.pfad}")
                            call.respond(HttpStatusCode.NotFound, mapOf("error" to "Datei nicht gefunden"))
                        }
                    } else {
                        println("DEBUG: Document with id $id not found in database")
                        call.respond(HttpStatusCode.NotFound, mapOf("error" to "Dokument nicht gefunden"))
                    }
                } catch (e: Exception) {
                    println("DEBUG: Exception in document retrieval: ${e.message}")
                    e.printStackTrace()
                    call.respond(
                        HttpStatusCode.InternalServerError,
                        mapOf("error" to "Fehler beim Laden des Dokuments: ${e.message}")
                    )
                }
            }

            get("/dokument/{id}/info") {
                try {
                    val id = call.parameters["id"]?.toLongOrNull()
                    if (id == null) {
                        call.respond(HttpStatusCode.BadRequest, mapOf("error" to "Ungültige Dokument-ID"))
                        return@get
                    }

                    val dokument = buchungsKartenService.getDokumentById(id)
                    if (dokument != null) {
                        call.respond(HttpStatusCode.OK, dokument)
                    } else {
                        call.respond(HttpStatusCode.NotFound, mapOf("error" to "Dokument nicht gefunden"))
                    }
                } catch (e: Exception) {
                    call.respond(
                        HttpStatusCode.InternalServerError,
                        mapOf("error" to "Fehler beim Laden des Dokuments: ${e.message}")
                    )
                }
            }

            post("/dokument/upload") {
                try {
                    val inputStream = call.receiveStream()
                    val fileName = call.request.headers["X-File-Name"] ?: "document_${System.currentTimeMillis()}"
                    val fileType = call.request.headers["X-File-Type"] ?: "application/octet-stream"
                    val fileSize = call.request.headers["X-File-Size"]?.toLongOrNull() ?: 0L

                    // Store file in CAS
                    val result = cas.store(inputStream)

                    // Erstelle Dokument-Eintrag in der Datenbank
                    val dokument = Dokument(
                        id = 0, // Wird von der Datenbank generiert
                        name = result.hash,
                        originalName = fileName,
                        dateityp = fileType,
                        groesse = result.size,
                        pfad = result.path,
                        hochgeladen = java.time.LocalDateTime.now().toString()
                    )

                    val dokumentId = buchungsKartenService.addDokument(dokument)
                    call.respond(
                        HttpStatusCode.Created, mapOf(
                            "id" to dokumentId,
                            "hash" to result.hash,
                            "size" to result.size,
                            "message" to "Dokument erfolgreich hochgeladen"
                        )
                    )
                } catch (e: Exception) {
                    call.respond(
                        HttpStatusCode.InternalServerError,
                        mapOf("error" to "Fehler beim Hochladen der Datei: ${e.message}")
                    )
                }
            }

            // Übersichtskarten API Endpoints
            get("/uebersichtskarten") {
                try {
                    val userId = call.getCurrentUserId()
                    if (userId == null) {
                        call.respond(HttpStatusCode.Unauthorized, mapOf("error" to "Authentication required"))
                        return@get
                    }

                    val uebersichtsKarten = buchungsKartenService.getUebersichtsKartenForUser(userId)
                    call.respond(HttpStatusCode.OK, uebersichtsKarten)
                } catch (e: Exception) {
                    call.respond(
                        HttpStatusCode.InternalServerError,
                        mapOf("error" to "Fehler beim Laden der Übersichtskarten: ${e.message}")
                    )
                }
            }

            post("/uebersichtskarten") {
                try {
                    val requestBody = call.receive<Map<String, Any>>()
                    val datumVon = requestBody["datumVon"] as String
                    val datumBis = requestBody["datumBis"] as String
                    val zeitraumTyp = ZeitraumTyp.valueOf(requestBody["zeitraumTyp"] as String)
                    val titel = requestBody["titel"] as String?

                    val userId = call.getCurrentUserId()
                    if (userId == null) {
                        call.respond(HttpStatusCode.Unauthorized, mapOf("error" to "Authentication required"))
                        return@post
                    }

                    val uebersichtsKarte =
                        buchungsKartenService.createUebersichtsKarte(datumVon, datumBis, zeitraumTyp, userId, titel)
                    call.respond(HttpStatusCode.Created, uebersichtsKarte)
                } catch (e: ContentTransformationException) {
                    call.respond(HttpStatusCode.BadRequest, mapOf("error" to "Ungültige Anfrage: ${e.message}"))
                } catch (e: Exception) {
                    call.respond(
                        HttpStatusCode.InternalServerError,
                        mapOf("error" to "Fehler beim Erstellen der Übersichtskarte: ${e.message}")
                    )
                }
            }

            get("/uebersichtskarten/{id}") {
                try {
                    val id = call.parameters["id"]?.toLongOrNull()
                    if (id == null) {
                        call.respond(HttpStatusCode.BadRequest, mapOf("error" to "Ungültige Übersichtskarten-ID"))
                        return@get
                    }

                    val userId = call.getCurrentUserId()
                    if (userId == null) {
                        call.respond(HttpStatusCode.Unauthorized, mapOf("error" to "Authentication required"))
                        return@get
                    }

                    val uebersichtsKarte = buchungsKartenService.getUebersichtsKarteById(id, userId)
                    if (uebersichtsKarte != null) {
                        call.respond(HttpStatusCode.OK, uebersichtsKarte)
                    } else {
                        call.respond(HttpStatusCode.NotFound, mapOf("error" to "Übersichtskarte nicht gefunden"))
                    }
                } catch (e: Exception) {
                    call.respond(
                        HttpStatusCode.InternalServerError,
                        mapOf("error" to "Fehler beim Laden der Übersichtskarte: ${e.message}")
                    )
                }
            }

            delete("/uebersichtskarten/{id}") {
                try {
                    val id = call.parameters["id"]?.toLongOrNull()
                    if (id == null) {
                        call.respond(HttpStatusCode.BadRequest, mapOf("error" to "Ungültige Übersichtskarten-ID"))
                        return@delete
                    }

                    val userId = call.getCurrentUserId()
                    if (userId == null) {
                        call.respond(HttpStatusCode.Unauthorized, mapOf("error" to "Authentication required"))
                        return@delete
                    }

                    val deleted = buchungsKartenService.deleteUebersichtsKarte(id, userId)
                    if (deleted) {
                        call.respond(HttpStatusCode.OK, mapOf("message" to "Übersichtskarte erfolgreich gelöscht"))
                    } else {
                        call.respond(HttpStatusCode.NotFound, mapOf("error" to "Übersichtskarte nicht gefunden"))
                    }
                } catch (e: Exception) {
                    call.respond(
                        HttpStatusCode.InternalServerError,
                        mapOf("error" to "Fehler beim Löschen der Übersichtskarte: ${e.message}")
                    )
                }
            }
            // Storage Migration Management GUI (system.admin only)
            get("/mm") {
                try {
                    println("DEBUG: Migration management route accessed in Routing.kt")
                    val userId = call.getCurrentUserId()
                    println("DEBUG: User ID: $userId")

                    if (userId != null) {
                        println("DEBUG: Looking up user with ID: $userId")
                        val userCredentialsService = UserCredentialsService()
                        val userWithGroups = userCredentialsService.getUserWithGroups(userId)
                        println("DEBUG: User groups: ${userWithGroups?.groups?.map { it.name }}")

                        if (userWithGroups != null) {
                            // Get all permissions for this user through their groups
                            val allPermissions = mutableSetOf<String>()
                            userWithGroups.groups.forEach { group ->
                                val groupRoleService = GroupRoleService()
                                val groupRoles = groupRoleService.getGroupRoles(group.id!!)
                                println("DEBUG: Group ${group.name} roles: ${groupRoles.map { it.name }}")
                                groupRoles.forEach { role ->
                                    println("DEBUG: Role ${role.name} permissions: ${role.permissions}")
                                    allPermissions.addAll(role.permissions)
                                }
                            }

                            println("DEBUG: All user permissions: $allPermissions")
                            // Check if user has system.admin permission
                            val hasSystemAdminPermission = allPermissions.contains("system.admin")
                            println("DEBUG: Has system.admin permission: $hasSystemAdminPermission")

                            if (hasSystemAdminPermission) {
                                println("DEBUG: Serving migration management page")
                                // Serve the migration management HTML page
                                call.respond(
                                    FreeMarkerContent(
                                        "migration/migration-management.ftl", mapOf(
                                            "title" to "Storage Migration Management",
                                            "userId" to userId
                                        )
                                    )
                                )
                            } else {
                                println("DEBUG: Access denied - no system.admin permission")
                                call.respond(HttpStatusCode.Forbidden, "Access denied. System admin role required.")
                            }
                        } else {
                            println("DEBUG: User groups not found")
                            call.respond(HttpStatusCode.Forbidden, "User groups not found")
                        }
                    } else {
                        println("DEBUG: User ID is null from billing")
                        call.respond(HttpStatusCode.Unauthorized, "Authentication required")
                    }
                } catch (e: Exception) {
                    println("DEBUG: Exception in migration route: ${e.message}")
                    e.printStackTrace()
                    call.respond(
                        HttpStatusCode.InternalServerError,
                        "Error loading migration management: ${e.localizedMessage}"
                    )
                }
            }


        }
        // Public
        get("/thumbnails/{hash}") {
            try {
                val hash = call.parameters["hash"] ?: return@get call.respond(
                    HttpStatusCode.BadRequest,
                    "Hash fehlt"
                )
                val thumbnailService = ThumbnailService()
                val thumbnailStream = thumbnailService.getThumbnailStream(hash)
                if (thumbnailStream == null) {
                    call.respond(HttpStatusCode.NotFound, "Thumbnail nicht gefunden")
                    return@get
                }
                val contentType = ContentType.Image.Any
                call.response.header(HttpHeaders.CacheControl, "public, max-age=3600")
                val fileBytes = thumbnailStream.use { it.readBytes() }
                call.respondBytes(fileBytes, contentType)

            } catch (e: Exception) {
                call.respond(
                    HttpStatusCode.InternalServerError,
                    "Fehler beim Bereitstellen des Thumbnails: ${e.localizedMessage}"
                )
            }
        }


    }
}