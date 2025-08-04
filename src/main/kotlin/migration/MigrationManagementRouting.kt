package migration

import com.shut.*
import billing.integration.BillingInterceptor
import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.auth.authenticate
import io.ktor.server.auth.jwt.JWTPrincipal
import io.ktor.server.auth.principal
import io.ktor.server.response.*
import io.ktor.server.routing.*
import io.ktor.server.freemarker.*
import storage.migration.StorageMigrationVerificationService

fun Application.configureMigrationManagementRouting() {
    routing {
        authenticate {
            // Migration Management GUI - Only for system.admin role
            get("/migration-management") {
                try {
                    val userId = call.getCurrentUserId()
                    if (userId == null) {
                        call.respond(HttpStatusCode.Unauthorized, "Authentication required")
                        return@get
                    }
                    
                    // Check if user has system.admin permission using the existing function
                    val userCredentialsService = UserCredentialsService()
                    val principal = call.principal<JWTPrincipal>()
                    val username = principal?.payload?.getClaim("username")?.asString()
                    
                    if (username == null) {
                        call.respond(HttpStatusCode.Unauthorized, "Authentication required")
                        return@get
                    }
                    
                    val user = userCredentialsService.getUserCredentialsByUsername(username)
                    if (user?.id == null) {
                        call.respond(HttpStatusCode.Unauthorized, "User not found")
                        return@get
                    }
                    
                    val userWithGroups = userCredentialsService.getUserWithGroups(user.id)
                    val hasSystemAdmin = userWithGroups?.groups?.any { group ->
                        val groupRoleService = GroupRoleService()
                        val groupRoles = groupRoleService.getGroupRoles(group.id!!)
                        groupRoles.any { role ->
                            role.permissions.contains("system.admin")
                        }
                    } ?: false
                    
                    if (!hasSystemAdmin) {
                        call.respond(HttpStatusCode.Forbidden, "Access denied. System admin role required.")
                        return@get
                    }
                    
                    // Serve the migration management HTML page
                    call.respond(FreeMarkerContent("migration/migration-management.ftl", mapOf(
                        "title" to "Storage Migration Management",
                        "userId" to userId
                    )))
                } catch (e: Exception) {
                    call.respond(
                        HttpStatusCode.InternalServerError,
                        mapOf("error" to "Failed to load migration management: ${e.message}")
                    )
                }
            }
            
            // API endpoints for migration management (with role check)
            route("/api/migration") {
                intercept(ApplicationCallPipeline.Call) {
                    // Check system.admin permission
                    val userCredentialsService = UserCredentialsService()
                    val principal = call.principal<JWTPrincipal>()
                    val username = principal?.payload?.getClaim("username")?.asString()
                    
                    if (username == null) {
                        call.respond(HttpStatusCode.Unauthorized, "Authentication required")
                        finish()
                        return@intercept
                    }
                    
                    val user = userCredentialsService.getUserCredentialsByUsername(username)
                    if (user?.id == null) {
                        call.respond(HttpStatusCode.Unauthorized, "User not found")
                        finish()
                        return@intercept
                    }
                    
                    val userWithGroups = userCredentialsService.getUserWithGroups(user.id)
                    val hasSystemAdmin = userWithGroups?.groups?.any { group ->
                        val groupRoleService = GroupRoleService()
                        val groupRoles = groupRoleService.getGroupRoles(group.id!!)
                        groupRoles.any { role ->
                            role.permissions.contains("system.admin")
                        }
                    } ?: false
                    
                    if (!hasSystemAdmin) {
                        call.respond(HttpStatusCode.Forbidden, "Access denied. System admin role required.")
                        finish()
                        return@intercept
                    }
                }
                
                // Verification endpoints
                get("/verify") {
                    try {
                        val includeDetails = call.request.queryParameters["details"]?.toBoolean() ?: false
                        val verificationService = StorageMigrationVerificationService()
                        val result = verificationService.verifyMigration(includeDetails)
                        call.respond(HttpStatusCode.OK, result)
                    } catch (e: Exception) {
                        call.respond(
                            HttpStatusCode.InternalServerError,
                            mapOf("error" to "Verification failed: ${e.message}")
                        )
                    }
                }
                
                get("/missing-files") {
                    try {
                        val verificationService = StorageMigrationVerificationService()
                        val missingFiles = verificationService.getDetailedMissingFilesList()
                        call.respond(HttpStatusCode.OK, mapOf("missingFiles" to missingFiles))
                    } catch (e: Exception) {
                        call.respond(
                            HttpStatusCode.InternalServerError,
                            mapOf("error" to "Failed to get missing files: ${e.message}")
                        )
                    }
                }
                
                get("/orphaned-files") {
                    try {
                        val limit = call.request.queryParameters["limit"]?.toIntOrNull() ?: 100
                        val verificationService = StorageMigrationVerificationService()
                        val orphanedFiles = verificationService.getOrphanedFilesPreview(limit)
                        call.respond(HttpStatusCode.OK, mapOf(
                            "orphanedFiles" to orphanedFiles,
                            "totalShown" to orphanedFiles.size,
                            "limit" to limit
                        ))
                    } catch (e: Exception) {
                        call.respond(
                            HttpStatusCode.InternalServerError,
                            mapOf("error" to "Failed to get orphaned files: ${e.message}")
                        )
                    }
                }
                
                get("/file-relationships") {
                    try {
                        val limit = call.request.queryParameters["limit"]?.toIntOrNull() ?: 1000
                        val onlyOrphaned = call.request.queryParameters["onlyOrphaned"]?.toBoolean() ?: false
                        val onlyUsed = call.request.queryParameters["onlyUsed"]?.toBoolean() ?: false
                        
                        val verificationService = StorageMigrationVerificationService()
                        var relationships = verificationService.getFileRelationships(limit)
                        
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
                        
                        call.respond(HttpStatusCode.OK, mapOf(
                            "relationships" to relationships,
                            "summary" to summary
                        ))
                    } catch (e: Exception) {
                        call.respond(
                            HttpStatusCode.InternalServerError,
                            mapOf("error" to "Failed to get file relationships: ${e.message}")
                        )
                    }
                }
                
                // Cleanup endpoints
                post("/cleanup") {
                    try {
                        val dryRun = call.request.queryParameters["dryRun"]?.toBoolean() ?: true
                        val includeDetails = call.request.queryParameters["details"]?.toBoolean() ?: false
                        val confirmation = call.request.queryParameters["confirm"]?.toBoolean() ?: false
                        
                        if (!dryRun && !confirmation) {
                            call.respond(
                                HttpStatusCode.BadRequest,
                                mapOf(
                                    "error" to "Actual file deletion requires explicit confirmation",
                                    "message" to "Add ?confirm=true&dryRun=false to actually delete files"
                                )
                            )
                            return@post
                        }
                        
                        val verificationService = StorageMigrationVerificationService()
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
                            mapOf("error" to "Cleanup failed: ${e.message}")
                        )
                    }
                }
                
                // Storage listing endpoints
                get("/storage-files") {
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
                                mapOf("path" to filePath, "size" to size)
                            }
                        } else {
                            limitedFiles.map { filePath -> mapOf("path" to filePath) }
                        }
                        
                        call.respond(HttpStatusCode.OK, mapOf(
                            "files" to fileInfoList,
                            "totalFiles" to allFiles.size,
                            "shown" to limitedFiles.size,
                            "limit" to limit
                        ))
                    } catch (e: Exception) {
                        call.respond(
                            HttpStatusCode.InternalServerError,
                            mapOf("error" to "Failed to list storage files: ${e.message}")
                        )
                    }
                }
            }
        }
    }
}

