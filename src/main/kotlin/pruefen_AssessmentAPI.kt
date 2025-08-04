package com.shut

import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.auth.*
import io.ktor.server.auth.jwt.*
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import org.koin.ktor.ext.inject

fun Application.configureAssessmentAPI() {
    val assessmentService by inject<AssessmentService>()
    val userCredentialsService by inject<UserCredentialsService>()
    
    // Helper function to get current user ID from JWT
    suspend fun ApplicationCall.getCurrentUserId(): Int? {
        return try {
            val principal = principal<JWTPrincipal>()
            val username = principal?.payload?.getClaim("username")?.asString()
            
            if (username != null) {
                val user = userCredentialsService.getUserCredentialsByUsername(username)
                user?.id
            } else {
                null
            }
        } catch (e: Exception) {
            null
        }
    }

    routing {
        authenticate {
            // Assessment Management API Endpoints
            
            // Get assessments for current user
            get("/assessments") {
                try {
                    val userId = call.getCurrentUserId()
                    if (userId == null) {
                        call.respond(HttpStatusCode.Unauthorized, "Invalid token")
                        return@get
                    }
                    
                    val assessments = assessmentService.getAssessmentsForUser(userId)
                    call.respond(HttpStatusCode.OK, assessments)
                } catch (e: Exception) {
                    call.respond(HttpStatusCode.InternalServerError, mapOf("error" to "Failed to load assessments: ${e.message}"))
                }
            }
            
            // Create new assessment
            post("/assessments") {
                try {
                    val userId = call.getCurrentUserId()
                    if (userId == null) {
                        call.respond(HttpStatusCode.Unauthorized, "Invalid token")
                        return@post
                    }
                    
                    val assessment = call.receive<Assessment>()
                    val assessmentId = assessmentService.createAssessment(assessment, userId)
                    call.respond(HttpStatusCode.Created, mapOf("id" to assessmentId, "message" to "Assessment created successfully"))
                } catch (e: Exception) {
                    call.respond(HttpStatusCode.BadRequest, mapOf("error" to "Failed to create assessment: ${e.message}"))
                }
            }
            
            // Update assessment
            put("/assessments/{id}") {
                try {
                    val userId = call.getCurrentUserId()
                    if (userId == null) {
                        call.respond(HttpStatusCode.Unauthorized, "Invalid token")
                        return@put
                    }
                    
                    val assessmentId = call.parameters["id"]?.toLongOrNull() ?: throw IllegalArgumentException("Invalid assessment ID")
                    val assessmentUpdate = call.receive<Assessment>()
                    
                    if (assessmentId != assessmentUpdate.id) {
                        call.respond(HttpStatusCode.BadRequest, mapOf("error" to "ID in path and body do not match"))
                        return@put
                    }
                    
                    val rowsAffected = assessmentService.updateAssessment(assessmentUpdate, userId)
                    if (rowsAffected > 0) {
                        call.respond(HttpStatusCode.OK, mapOf("message" to "Assessment updated successfully"))
                    } else {
                        call.respond(HttpStatusCode.NotFound, mapOf("error" to "Assessment not found or no permission"))
                    }
                } catch (e: Exception) {
                    call.respond(HttpStatusCode.InternalServerError, mapOf("error" to "Failed to update assessment: ${e.message}"))
                }
            }
            
            // Delete assessment
            delete("/assessments/{id}") {
                try {
                    val userId = call.getCurrentUserId()
                    if (userId == null) {
                        call.respond(HttpStatusCode.Unauthorized, "Invalid token")
                        return@delete
                    }
                    
                    val assessmentId = call.parameters["id"]?.toLongOrNull() ?: throw IllegalArgumentException("Invalid assessment ID")
                    
                    val rowsAffected = assessmentService.deleteAssessment(assessmentId, userId)
                    if (rowsAffected > 0) {
                        call.respond(HttpStatusCode.OK, mapOf("message" to "Assessment deleted successfully"))
                    } else {
                        call.respond(HttpStatusCode.NotFound, mapOf("error" to "Assessment not found or no permission"))
                    }
                } catch (e: Exception) {
                    call.respond(HttpStatusCode.InternalServerError, mapOf("error" to "Failed to delete assessment: ${e.message}"))
                }
            }
            
            // Assessment User Management
            
            // Get users assigned to assessment
            get("/assessments/{assessmentId}/users") {
                try {
                    val userId = call.getCurrentUserId()
                    if (userId == null) {
                        call.respond(HttpStatusCode.Unauthorized, "Invalid token")
                        return@get
                    }
                    
                    val assessmentId = call.parameters["assessmentId"]?.toLongOrNull() ?: throw IllegalArgumentException("Invalid assessment ID")
                    
                    val users = assessmentService.getAssessmentUsers(assessmentId, userId)
                    call.respond(HttpStatusCode.OK, users)
                } catch (e: Exception) {
                    call.respond(HttpStatusCode.InternalServerError, mapOf("error" to "Failed to load assessment users: ${e.message}"))
                }
            }
            
            // Add user to assessment
            post("/assessments/{assessmentId}/users/{userId}") {
                try {
                    val currentUserId = call.getCurrentUserId()
                    if (currentUserId == null) {
                        call.respond(HttpStatusCode.Unauthorized, "Invalid token")
                        return@post
                    }
                    
                    val assessmentId = call.parameters["assessmentId"]?.toLongOrNull() ?: throw IllegalArgumentException("Invalid assessment ID")
                    val targetUserId = call.parameters["userId"]?.toIntOrNull() ?: throw IllegalArgumentException("Invalid user ID")
                    
                    val success = assessmentService.addUserToAssessment(assessmentId, targetUserId, currentUserId)
                    if (success) {
                        call.respond(HttpStatusCode.Created, mapOf("message" to "User added to assessment successfully"))
                    } else {
                        call.respond(HttpStatusCode.BadRequest, mapOf("error" to "Failed to add user to assessment"))
                    }
                } catch (e: Exception) {
                    call.respond(HttpStatusCode.InternalServerError, mapOf("error" to "Failed to add user to assessment: ${e.message}"))
                }
            }
            
            // Remove user from assessment
            delete("/assessments/{assessmentId}/users/{userId}") {
                try {
                    val currentUserId = call.getCurrentUserId()
                    if (currentUserId == null) {
                        call.respond(HttpStatusCode.Unauthorized, "Invalid token")
                        return@delete
                    }
                    
                    val assessmentId = call.parameters["assessmentId"]?.toLongOrNull() ?: throw IllegalArgumentException("Invalid assessment ID")
                    val targetUserId = call.parameters["userId"]?.toIntOrNull() ?: throw IllegalArgumentException("Invalid user ID")
                    
                    val success = assessmentService.removeUserFromAssessment(assessmentId, targetUserId, currentUserId)
                    if (success) {
                        call.respond(HttpStatusCode.OK, mapOf("message" to "User removed from assessment successfully"))
                    } else {
                        call.respond(HttpStatusCode.NotFound, mapOf("error" to "User not found in assessment or no permission"))
                    }
                } catch (e: Exception) {
                    call.respond(HttpStatusCode.InternalServerError, mapOf("error" to "Failed to remove user from assessment: ${e.message}"))
                }
            }
        }
    }
}