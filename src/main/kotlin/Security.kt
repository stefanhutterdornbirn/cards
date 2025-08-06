package com.shut

import billing.integration.BillingInterceptor
import com.auth0.jwt.JWT
import com.auth0.jwt.algorithms.Algorithm
import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.auth.*
import io.ktor.server.auth.jwt.*
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import io.ktor.server.sessions.*
import kotlinx.serialization.Serializable
import org.koin.ktor.ext.inject
import java.util.Date




// Datenklasse für die Token-Antwort
@Serializable
data class TokenResponse(val token: String)

@Serializable
data class MySession(val count: Int = 0)


fun Application.configureSecurity() {
    val billingInterceptor = BillingInterceptor()
    val userCredentialsService by inject<UserCredentialsService>()
    val groupService by inject<GroupService>()
    val userGroupService by inject<UserGroupService>()
    val roleService by inject<RoleService>()
    val groupRoleService by inject<GroupRoleService>()
    val productService by inject<ProductService>()
    val groupProductService by inject<GroupProductService>()
    val learningCardService by inject<LearningCardService>()
    val learningMaterialService by inject<LearningMaterialService>()
    val learningTopicService by inject<LearningTopicService>()
    val assessmentService by inject<AssessmentService>()
    
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
    
    // Helper function to charge API call and get user ID
    suspend fun ApplicationCall.chargeApiCallAndGetUserId(): Int? {
        val userId = getCurrentUserId()
        if (userId != null) {
            try {
                billingInterceptor.checkAndDebitApiCall(userId)
            } catch (e: Exception) {
                respond(HttpStatusCode.PaymentRequired, mapOf("error" to "Insufficient CardCoin balance", "details" to e.message))
                return null
            }
        }
        return userId
    }
    
    // Helper function to check if user has required permission
    suspend fun ApplicationCall.hasPermission(permission: String): Boolean {
        return try {
            val principal = principal<JWTPrincipal>()
            val username = principal?.payload?.getClaim("username")?.asString()
            
            if (username != null) {
                val user = userCredentialsService.getUserCredentialsByUsername(username)
                if (user != null && user.id != null) {
                    val userWithGroups = userCredentialsService.getUserWithGroups(user.id)
                    if (userWithGroups != null) {
                        // Get all permissions for this user through their groups
                        val allPermissions = mutableSetOf<String>()
                        userWithGroups.groups.forEach { group ->
                            val groupRoles = groupRoleService.getGroupRoles(group.id!!)
                            groupRoles.forEach { role ->
                                allPermissions.addAll(role.permissions)
                            }
                        }
                        // Check if user has the specific permission or system.admin (which grants all permissions)
                        return allPermissions.contains(permission) || allPermissions.contains("system.admin")
                    }
                }
            }
            false
        } catch (e: Exception) {
            false
        }
    }
    
    userCredentialsService.initialize()
    groupService.initialize()
    userGroupService.initialize()
    roleService.initialize()
    groupRoleService.initialize()
    productService.initialize()
    groupProductService.initialize()
    learningCardService.initialize()
    learningMaterialService.initialize()
    learningTopicService.initialize()
    assessmentService.initialize()

    install(Sessions) {
        cookie<MySession>("MY_SESSION") {
            cookie.extensions["SameSite"] = "lax"
        }
    }
    // Please read the jwt property from the config file if you are using EngineMain
    val jwtAudience = "jwt-audience"
    val jwtDomain = "https://jwt-provider-domain/"
    val jwtRealm = "ktor sample app"
    val jwtSecret = "secret"
    authentication {
        jwt {
            realm = jwtRealm
            verifier(
                JWT
                    .require(Algorithm.HMAC256(jwtSecret))
                    .withAudience(jwtAudience)
                    .withIssuer(jwtDomain)
                    .build()
            )
            validate { credential ->
                if (credential.payload.audience.contains(jwtAudience) && credential.payload.getClaim("username") != null) {
                    JWTPrincipal(credential.payload)
                } else {
                    null
                }
            }
        }
    }
    routing {



        get("/session/increment") {
            val session = call.sessions.get<MySession>() ?: MySession()
            call.sessions.set(session.copy(count = session.count + 1))
            call.respondText("Counter is ${session.count}. Refresh to increment.")
        }

        post("/register") {
            try {
                val credentials = call.receive<UserCredentials>()
                
                // Check if email is provided
                if (credentials.email.isNullOrBlank()) {
                    call.respond(HttpStatusCode.BadRequest, "Email address is required for registration")
                    return@post
                }
                
                val userID = userCredentialsService.addUserCredentials(credentials)
                
                // Assign user to default "Single" group
                userGroupService.addUserToDefaultGroup(userID)
                
                // Send verification email
                val emailVerificationService = EmailVerificationService.create(userCredentialsService)
                val host = call.request.headers["Host"] ?: "localhost:5000"
                val scheme = if (call.request.headers["X-Forwarded-Proto"] == "https") "https" else "http"
                val baseUrl = "$scheme://$host"
                
                val emailSent = emailVerificationService.sendVerificationEmail(
                    userID, credentials.email, credentials.username, baseUrl
                )
                
                if (emailSent) {
                    call.respond(HttpStatusCode.Created, mapOf(
                        "message" to "User created successfully. Please check your email to verify your account.",
                        "userId" to userID,
                        "emailSent" to true
                    ))
                } else {
                    call.respond(HttpStatusCode.Created, mapOf(
                        "message" to "User created but email verification could not be sent. Please contact support.",
                        "userId" to userID,
                        "emailSent" to false
                    ))
                }
            } catch (e: Exception) {
                call.respond(HttpStatusCode.BadRequest, "A bad thing happened: ${e.localizedMessage}")
            }
        }


        // Neue Login-Route, die ein JWT generiert
        post("/login") {
            try {
                val credentials = call.receive<UserCredentials>()
                val user = userCredentialsService.getUserCredentialsByUsername(credentials.username)

                // --- HIER IHRE AUTHENTIFIZIERUNGSLOGIK EINFÜGEN ---
                // Beispiel: Überprüfen Sie Benutzername und Passwort.
                if (user != null && credentials.password.equals(user.password)) {
                    // Check if email is verified (skip for admin)
                    if (!user.emailVerified && user.username != "admin") {
                        call.respond(HttpStatusCode.Forbidden, mapOf(
                            "error" to "Email verification required",
                            "message" to "Please verify your email address before logging in. Check your email for a verification link.",
                            "emailVerificationRequired" to true
                        ))
                        return@post
                    }
                    
                    // Bei Erfolg ein JWT generieren
                    val token = JWT.create()
                        .withAudience(jwtAudience)
                        .withIssuer(jwtDomain)
                        .withClaim("username", credentials.username) // Fügen Sie benutzerdefinierte Claims hinzu
                        // Sie können hier auch andere Claims wie Benutzer-ID, Rollen etc. hinzufügen
                        .withExpiresAt(Date(System.currentTimeMillis() + 60 * 60 * 1000 * 24)) // Token gültig für 24 Stunden
                        .sign(Algorithm.HMAC256(jwtSecret))

                    call.respond(HttpStatusCode.OK, TokenResponse(token))
                } else {
                    call.respond(HttpStatusCode.Unauthorized, "Invalid username or password")
                }
            } catch (e: ContentTransformationException) {
                call.respond(HttpStatusCode.BadRequest, "Could not parse credentials: ${e.localizedMessage}")
            }
        }

        // Email Verification Endpoints (Public)
        get("/verify-email") {
            val token = call.request.queryParameters["token"]
            if (token == null) {
                call.respond(HttpStatusCode.BadRequest, "Verification token is required")
                return@get
            }
            
            val emailVerificationService = EmailVerificationService.create(userCredentialsService)
            val result = emailVerificationService.verifyEmailToken(token)
            
            when (result) {
                VerificationResult.SUCCESS -> {
                    call.respondText(
                        """
                        <!DOCTYPE html>
                        <html>
                        <head>
                            <title>Email Verified - Learning Cards</title>
                            <style>
                                body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background-color: #f4f4f4; }
                                .container { max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                                .success { color: #28a745; font-size: 24px; margin-bottom: 20px; }
                                .message { color: #555; font-size: 16px; line-height: 1.6; margin-bottom: 30px; }
                                .button { display: inline-block; background-color: #007bff; color: white; text-decoration: none; padding: 12px 30px; border-radius: 5px; font-weight: bold; }
                                .button:hover { background-color: #0056b3; }
                            </style>
                        </head>
                        <body>
                            <div class="container">
                                <h1 class="success">✅ Email Verified Successfully!</h1>
                                <p class="message">Your email address has been verified and your account is now active. You can now log in and start using Learning Cards!</p>
                                <a href="/static/index.html" class="button">Go to Login</a>
                            </div>
                        </body>
                        </html>
                        """.trimIndent(),
                        ContentType.Text.Html
                    )
                }
                VerificationResult.ALREADY_VERIFIED -> {
                    call.respondText(
                        """
                        <!DOCTYPE html>
                        <html>
                        <head>
                            <title>Already Verified - Learning Cards</title>
                            <style>
                                body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background-color: #f4f4f4; }
                                .container { max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                                .info { color: #17a2b8; font-size: 24px; margin-bottom: 20px; }
                                .message { color: #555; font-size: 16px; line-height: 1.6; margin-bottom: 30px; }
                                .button { display: inline-block; background-color: #007bff; color: white; text-decoration: none; padding: 12px 30px; border-radius: 5px; font-weight: bold; }
                                .button:hover { background-color: #0056b3; }
                            </style>
                        </head>
                        <body>
                            <div class="container">
                                <h1 class="info">ℹ️ Email Already Verified</h1>
                                <p class="message">Your email address has already been verified. You can log in to your account.</p>
                                <a href="/static/index.html" class="button">Go to Login</a>
                            </div>
                        </body>
                        </html>
                        """.trimIndent(),
                        ContentType.Text.Html
                    )
                }
                else -> {
                    call.respondText(
                        """
                        <!DOCTYPE html>
                        <html>
                        <head>
                            <title>Verification Failed - Learning Cards</title>
                            <style>
                                body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background-color: #f4f4f4; }
                                .container { max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                                .error { color: #dc3545; font-size: 24px; margin-bottom: 20px; }
                                .message { color: #555; font-size: 16px; line-height: 1.6; margin-bottom: 30px; }
                                .button { display: inline-block; background-color: #007bff; color: white; text-decoration: none; padding: 12px 30px; border-radius: 5px; font-weight: bold; }
                                .button:hover { background-color: #0056b3; }
                            </style>
                        </head>
                        <body>
                            <div class="container">
                                <h1 class="error">❌ Email Verification Failed</h1>
                                <p class="message">${result.message}</p>
                                <p class="message">Please try registering again or contact support if you continue to experience issues.</p>
                                <a href="/static/index.html" class="button">Go to Login</a>
                            </div>
                        </body>
                        </html>
                        """.trimIndent(),
                        ContentType.Text.Html
                    )
                }
            }
        }

        post("/resend-verification") {
            try {
                val request = call.receive<Map<String, String>>()
                val email = request["email"]
                
                if (email.isNullOrBlank()) {
                    call.respond(HttpStatusCode.BadRequest, mapOf("error" to "Email address is required"))
                    return@post
                }
                
                val emailVerificationService = EmailVerificationService.create(userCredentialsService)
                val host = call.request.headers["Host"] ?: "localhost:5000"
                val scheme = if (call.request.headers["X-Forwarded-Proto"] == "https") "https" else "http"
                val baseUrl = "$scheme://$host"
                
                val result = emailVerificationService.resendVerificationEmail(email, baseUrl)
                
                when (result) {
                    ResendResult.SUCCESS -> {
                        call.respond(HttpStatusCode.OK, mapOf(
                            "message" to result.message,
                            "success" to true
                        ))
                    }
                    ResendResult.ALREADY_VERIFIED -> {
                        call.respond(HttpStatusCode.OK, mapOf(
                            "message" to result.message,
                            "success" to true,
                            "alreadyVerified" to true
                        ))
                    }
                    else -> {
                        call.respond(HttpStatusCode.BadRequest, mapOf(
                            "message" to result.message,
                            "success" to false
                        ))
                    }
                }
            } catch (e: Exception) {
                call.respond(HttpStatusCode.BadRequest, mapOf(
                    "error" to "Failed to resend verification email: ${e.localizedMessage}"
                ))
            }
        }

        // Manual Code Verification Endpoint (Public)
        post("/verify-manual-code") {
            try {
                val request = call.receive<Map<String, String>>()
                val verificationCode = request["verificationCode"]
                
                if (verificationCode.isNullOrBlank()) {
                    call.respond(HttpStatusCode.BadRequest, mapOf(
                        "error" to "Verification code is required",
                        "message" to "Please provide a verification code",
                        "verified" to false
                    ))
                    return@post
                }
                
                val emailVerificationService = EmailVerificationService.create(userCredentialsService)
                val result = emailVerificationService.verifyEmailToken(verificationCode)
                
                when (result) {
                    VerificationResult.SUCCESS -> {
                        call.respond(HttpStatusCode.OK, mapOf(
                            "verified" to true,
                            "message" to "Email verification successful",
                            "success" to true
                        ))
                    }
                    VerificationResult.ALREADY_VERIFIED -> {
                        call.respond(HttpStatusCode.OK, mapOf(
                            "verified" to true,
                            "message" to "Email is already verified",
                            "success" to true,
                            "alreadyVerified" to true
                        ))
                    }
                    VerificationResult.TOKEN_NOT_FOUND -> {
                        call.respond(HttpStatusCode.BadRequest, mapOf(
                            "verified" to false,
                            "message" to "Verification code not found or has expired. Please request a new verification email.",
                            "error" to "expired"
                        ))
                    }
                    VerificationResult.INVALID_TOKEN -> {
                        call.respond(HttpStatusCode.BadRequest, mapOf(
                            "verified" to false,
                            "message" to "Invalid verification code. Please check your code and try again.",
                            "error" to "invalid"
                        ))
                    }
                    VerificationResult.VERIFICATION_FAILED -> {
                        call.respond(HttpStatusCode.BadRequest, mapOf(
                            "verified" to false,
                            "message" to "Verification process failed. Please try again.",
                            "error" to "verification_failed"
                        ))
                    }
                }
            } catch (e: Exception) {
                call.respond(HttpStatusCode.InternalServerError, mapOf(
                    "verified" to false,
                    "message" to "Server error during verification: ${e.localizedMessage}",
                    "error" to "server_error"
                ))
            }
        }

        // User Management API Endpoints
        authenticate {
            // Get all users
            get("/users") {
                try {
                    if (!call.hasPermission("user.manage")) {
                        call.respond(HttpStatusCode.Forbidden, "Insufficient permissions")
                        return@get
                    }
                    
                    val users = userCredentialsService.getAllUsers()
                    call.respond(HttpStatusCode.OK, users)
                } catch (e: Exception) {
                    call.respond(HttpStatusCode.InternalServerError, "Error retrieving users: ${e.localizedMessage}")
                }
            }
            
            // Get specific user by ID
            get("/users/{id}") {
                try {
                    val id = call.parameters["id"]?.toIntOrNull()
                    if (id == null) {
                        call.respond(HttpStatusCode.BadRequest, "Invalid user ID")
                        return@get
                    }
                    
                    val user = userCredentialsService.getUserCredentialsById(id)
                    if (user != null) {
                        call.respond(HttpStatusCode.OK, user)
                    } else {
                        call.respond(HttpStatusCode.NotFound, "User not found")
                    }
                } catch (e: Exception) {
                    call.respond(HttpStatusCode.InternalServerError, "Error retrieving user: ${e.localizedMessage}")
                }
            }
            
            // Change user password (requires system.admin permission)
            put("/users/password") {
                try {
                    if (!call.hasPermission("system.admin")) {
                        call.respond(HttpStatusCode.Forbidden, "Insufficient permissions - system.admin role required")
                        return@put
                    }
                    
                    val passwordChangeRequest = call.receive<PasswordChangeRequest>()
                    
                    // Validate that the user exists
                    val user = userCredentialsService.getUserCredentialsById(passwordChangeRequest.userId)
                    if (user == null) {
                        call.respond(HttpStatusCode.NotFound, "User not found")
                        return@put
                    }
                    
                    // Validate password strength (basic validation)
                    if (passwordChangeRequest.newPassword.length < 4) {
                        call.respond(HttpStatusCode.BadRequest, "Password must be at least 4 characters long")
                        return@put
                    }
                    
                    val success = userCredentialsService.changeUserPassword(
                        passwordChangeRequest.userId, 
                        passwordChangeRequest.newPassword
                    )
                    
                    if (success) {
                        call.respond(HttpStatusCode.OK, mapOf(
                            "message" to "Password changed successfully",
                            "userId" to passwordChangeRequest.userId
                        ))
                    } else {
                        call.respond(HttpStatusCode.InternalServerError, "Failed to change password")
                    }
                } catch (e: Exception) {
                    call.respond(HttpStatusCode.BadRequest, "Error changing password: ${e.localizedMessage}")
                }
            }
        }

        // Group Management API Endpoints
        authenticate {
            // Get all groups
            get("/groups") {
                try {
                    if (!call.hasPermission("group.manage")) {
                        call.respond(HttpStatusCode.Forbidden, "Insufficient permissions")
                        return@get
                    }
                    
                    val groups = groupService.getAllGroups()
                    call.respond(HttpStatusCode.OK, groups)
                } catch (e: Exception) {
                    call.respond(HttpStatusCode.InternalServerError, "Error retrieving groups: ${e.localizedMessage}")
                }
            }
            
            // Get specific group by ID
            get("/groups/{id}") {
                try {
                    val id = call.parameters["id"]?.toIntOrNull()
                    if (id == null) {
                        call.respond(HttpStatusCode.BadRequest, "Invalid group ID")
                        return@get
                    }
                    
                    val group = groupService.getGroupById(id)
                    if (group != null) {
                        call.respond(HttpStatusCode.OK, group)
                    } else {
                        call.respond(HttpStatusCode.NotFound, "Group not found")
                    }
                } catch (e: Exception) {
                    call.respond(HttpStatusCode.InternalServerError, "Error retrieving group: ${e.localizedMessage}")
                }
            }
            
            // Create new group
            post("/groups") {
                try {
                    if (!call.hasPermission("group.manage")) {
                        call.respond(HttpStatusCode.Forbidden, "Insufficient permissions")
                        return@post
                    }
                    
                    val group = call.receive<Group>()
                    val groupId = groupService.createGroup(group)
                    call.respond(HttpStatusCode.Created, mapOf("id" to groupId, "message" to "Group created successfully"))
                } catch (e: Exception) {
                    call.respond(HttpStatusCode.BadRequest, "Error creating group: ${e.localizedMessage}")
                }
            }
            
            // Update group
            put("/groups/{id}") {
                try {
                    val id = call.parameters["id"]?.toIntOrNull()
                    if (id == null) {
                        call.respond(HttpStatusCode.BadRequest, "Invalid group ID")
                        return@put
                    }
                    
                    val group = call.receive<Group>()
                    groupService.updateGroup(id, group)
                    call.respond(HttpStatusCode.OK, "Group updated successfully")
                } catch (e: Exception) {
                    call.respond(HttpStatusCode.BadRequest, "Error updating group: ${e.localizedMessage}")
                }
            }
            
            // Delete group
            delete("/groups/{id}") {
                try {
                    val id = call.parameters["id"]?.toIntOrNull()
                    if (id == null) {
                        call.respond(HttpStatusCode.BadRequest, "Invalid group ID")
                        return@delete
                    }
                    
                    groupService.deleteGroup(id)
                    call.respond(HttpStatusCode.OK, "Group deleted successfully")
                } catch (e: Exception) {
                    call.respond(HttpStatusCode.BadRequest, "Error deleting group: ${e.localizedMessage}")
                }
            }
            
            // Get group members
            get("/groups/{id}/members") {
                try {
                    val id = call.parameters["id"]?.toIntOrNull()
                    if (id == null) {
                        call.respond(HttpStatusCode.BadRequest, "Invalid group ID")
                        return@get
                    }
                    
                    val members = groupService.getGroupMembers(id)
                    call.respond(HttpStatusCode.OK, members)
                } catch (e: Exception) {
                    call.respond(HttpStatusCode.InternalServerError, "Error retrieving group members: ${e.localizedMessage}")
                }
            }
            
            // Add user to group
            post("/groups/{groupId}/members/{userId}") {
                try {
                    val groupId = call.parameters["groupId"]?.toIntOrNull()
                    val userId = call.parameters["userId"]?.toIntOrNull()
                    
                    if (groupId == null || userId == null) {
                        call.respond(HttpStatusCode.BadRequest, "Invalid group ID or user ID")
                        return@post
                    }
                    
                    userGroupService.addUserToGroup(userId, groupId)
                    call.respond(HttpStatusCode.OK, "User added to group successfully")
                } catch (e: Exception) {
                    call.respond(HttpStatusCode.BadRequest, "Error adding user to group: ${e.localizedMessage}")
                }
            }
            
            // Remove user from group
            delete("/groups/{groupId}/members/{userId}") {
                try {
                    val groupId = call.parameters["groupId"]?.toIntOrNull()
                    val userId = call.parameters["userId"]?.toIntOrNull()
                    
                    if (groupId == null || userId == null) {
                        call.respond(HttpStatusCode.BadRequest, "Invalid group ID or user ID")
                        return@delete
                    }
                    
                    userGroupService.removeUserFromGroup(userId, groupId)
                    call.respond(HttpStatusCode.OK, "User removed from group successfully")
                } catch (e: Exception) {
                    call.respond(HttpStatusCode.BadRequest, "Error removing user from group: ${e.localizedMessage}")
                }
            }
            
            // Get user's groups
            get("/users/{userId}/groups") {
                try {
                    val userId = call.parameters["userId"]?.toIntOrNull()
                    if (userId == null) {
                        call.respond(HttpStatusCode.BadRequest, "Invalid user ID")
                        return@get
                    }
                    
                    val groups = userGroupService.getUserGroups(userId)
                    call.respond(HttpStatusCode.OK, groups)
                } catch (e: Exception) {
                    call.respond(HttpStatusCode.InternalServerError, "Error retrieving user groups: ${e.localizedMessage}")
                }
            }
            
            // Get current user with groups and permissions
            get("/me") {
                try {
                    val principal = call.principal<JWTPrincipal>()
                    val username = principal?.payload?.getClaim("username")?.asString()
                    
                    if (username != null) {
                        val user = userCredentialsService.getUserCredentialsByUsername(username)
                        if (user != null && user.id != null) {
                            val userWithGroups = userCredentialsService.getUserWithGroups(user.id)
                            if (userWithGroups != null) {
                                // Get all permissions for this user through their groups
                                val allPermissions = mutableSetOf<String>()
                                userWithGroups.groups.forEach { group ->
                                    val groupRoles = groupRoleService.getGroupRoles(group.id!!)
                                    groupRoles.forEach { role ->
                                        allPermissions.addAll(role.permissions)
                                    }
                                }
                                
                                // Create extended user response with permissions
                                val userWithPermissions = mapOf(
                                    "id" to userWithGroups.id,
                                    "username" to userWithGroups.username,
                                    "email" to userWithGroups.email,
                                    "groups" to userWithGroups.groups,
                                    "permissions" to allPermissions.toList()
                                )
                                
                                call.respond(HttpStatusCode.OK, userWithPermissions)
                            } else {
                                call.respond(HttpStatusCode.NotFound, "User groups not found")
                            }
                        } else {
                            call.respond(HttpStatusCode.NotFound, "User not found")
                        }
                    } else {
                        call.respond(HttpStatusCode.Unauthorized, "Invalid token")
                    }
                } catch (e: Exception) {
                    call.respond(HttpStatusCode.InternalServerError, "Error retrieving user information: ${e.localizedMessage}")
                }
            }
            
            // Legacy protected endpoint
            get("/protected-data") {
                val principal = call.principal<JWTPrincipal>()
                val username = principal?.payload?.getClaim("username")?.asString()
                call.respondText("Hello, $username! This is protected data.")
            }
        }

        // Role Management API Endpoints
        authenticate {
            // Get all roles
            get("/roles") {
                try {
                    if (!call.hasPermission("role.manage")) {
                        call.respond(HttpStatusCode.Forbidden, "Insufficient permissions")
                        return@get
                    }
                    
                    val roles = roleService.getAllRoles()
                    call.respond(HttpStatusCode.OK, roles)
                } catch (e: Exception) {
                    call.respond(HttpStatusCode.InternalServerError, "Error retrieving roles: ${e.localizedMessage}")
                }
            }
            
            // Get specific role by ID
            get("/roles/{id}") {
                try {
                    val id = call.parameters["id"]?.toIntOrNull()
                    if (id == null) {
                        call.respond(HttpStatusCode.BadRequest, "Invalid role ID")
                        return@get
                    }
                    
                    val role = roleService.getRoleById(id)
                    if (role != null) {
                        call.respond(HttpStatusCode.OK, role)
                    } else {
                        call.respond(HttpStatusCode.NotFound, "Role not found")
                    }
                } catch (e: Exception) {
                    call.respond(HttpStatusCode.InternalServerError, "Error retrieving role: ${e.localizedMessage}")
                }
            }
            
            // Create new role
            post("/roles") {
                try {
                    val role = call.receive<Role>()
                    val roleId = roleService.createRole(role)
                    call.respond(HttpStatusCode.Created, mapOf("id" to roleId, "message" to "Role created successfully"))
                } catch (e: Exception) {
                    call.respond(HttpStatusCode.BadRequest, "Error creating role: ${e.localizedMessage}")
                }
            }
            
            // Update role
            put("/roles/{id}") {
                try {
                    val id = call.parameters["id"]?.toIntOrNull()
                    if (id == null) {
                        call.respond(HttpStatusCode.BadRequest, "Invalid role ID")
                        return@put
                    }
                    
                    val role = call.receive<Role>()
                    roleService.updateRole(id, role)
                    call.respond(HttpStatusCode.OK, "Role updated successfully")
                } catch (e: Exception) {
                    call.respond(HttpStatusCode.BadRequest, "Error updating role: ${e.localizedMessage}")
                }
            }
            
            // Delete role
            delete("/roles/{id}") {
                try {
                    val id = call.parameters["id"]?.toIntOrNull()
                    if (id == null) {
                        call.respond(HttpStatusCode.BadRequest, "Invalid role ID")
                        return@delete
                    }
                    
                    roleService.deleteRole(id)
                    call.respond(HttpStatusCode.OK, "Role deleted successfully")
                } catch (e: Exception) {
                    call.respond(HttpStatusCode.BadRequest, "Error deleting role: ${e.localizedMessage}")
                }
            }
            
            // Get roles assigned to a group
            get("/groups/{groupId}/roles") {
                try {
                    val groupId = call.parameters["groupId"]?.toIntOrNull()
                    if (groupId == null) {
                        call.respond(HttpStatusCode.BadRequest, "Invalid group ID")
                        return@get
                    }
                    
                    val roles = groupRoleService.getGroupRoles(groupId)
                    call.respond(HttpStatusCode.OK, roles)
                } catch (e: Exception) {
                    call.respond(HttpStatusCode.InternalServerError, "Error retrieving group roles: ${e.localizedMessage}")
                }
            }
            
            // Assign role to group
            post("/groups/{groupId}/roles/{roleId}") {
                try {
                    val groupId = call.parameters["groupId"]?.toIntOrNull()
                    val roleId = call.parameters["roleId"]?.toIntOrNull()
                    
                    if (groupId == null || roleId == null) {
                        call.respond(HttpStatusCode.BadRequest, "Invalid group ID or role ID")
                        return@post
                    }
                    
                    groupRoleService.assignRoleToGroup(groupId, roleId)
                    call.respond(HttpStatusCode.OK, "Role assigned to group successfully")
                } catch (e: Exception) {
                    call.respond(HttpStatusCode.BadRequest, "Error assigning role to group: ${e.localizedMessage}")
                }
            }
            
            // Remove role from group
            delete("/groups/{groupId}/roles/{roleId}") {
                try {
                    val groupId = call.parameters["groupId"]?.toIntOrNull()
                    val roleId = call.parameters["roleId"]?.toIntOrNull()
                    
                    if (groupId == null || roleId == null) {
                        call.respond(HttpStatusCode.BadRequest, "Invalid group ID or role ID")
                        return@delete
                    }
                    
                    groupRoleService.removeRoleFromGroup(groupId, roleId)
                    call.respond(HttpStatusCode.OK, "Role removed from group successfully")
                } catch (e: Exception) {
                    call.respond(HttpStatusCode.BadRequest, "Error removing role from group: ${e.localizedMessage}")
                }
            }
            
            // Get groups that have a specific role
            get("/roles/{roleId}/groups") {
                try {
                    val roleId = call.parameters["roleId"]?.toIntOrNull()
                    if (roleId == null) {
                        call.respond(HttpStatusCode.BadRequest, "Invalid role ID")
                        return@get
                    }
                    
                    val groups = groupRoleService.getRoleGroups(roleId)
                    call.respond(HttpStatusCode.OK, groups)
                } catch (e: Exception) {
                    call.respond(HttpStatusCode.InternalServerError, "Error retrieving role groups: ${e.localizedMessage}")
                }
            }
            
            // Get group with all assigned roles
            get("/groups/{groupId}/with-roles") {
                try {
                    val groupId = call.parameters["groupId"]?.toIntOrNull()
                    if (groupId == null) {
                        call.respond(HttpStatusCode.BadRequest, "Invalid group ID")
                        return@get
                    }
                    
                    val groupWithRoles = groupRoleService.getGroupWithRoles(groupId)
                    if (groupWithRoles != null) {
                        call.respond(HttpStatusCode.OK, groupWithRoles)
                    } else {
                        call.respond(HttpStatusCode.NotFound, "Group not found")
                    }
                } catch (e: Exception) {
                    call.respond(HttpStatusCode.InternalServerError, "Error retrieving group with roles: ${e.localizedMessage}")
                }
            }
        }

        // Product Management API Endpoints
        authenticate {
            // Get all products
            get("/products") {
                try {
                    if (!call.hasPermission("product.manage")) {
                        call.respond(HttpStatusCode.Forbidden, "Insufficient permissions")
                        return@get
                    }
                    
                    val products = productService.getAllProducts()
                    call.respond(HttpStatusCode.OK, products)
                } catch (e: Exception) {
                    call.respond(HttpStatusCode.InternalServerError, "Error retrieving products: ${e.localizedMessage}")
                }
            }
            
            // Get specific product by ID
            get("/products/{id}") {
                try {
                    if (!call.hasPermission("product.manage")) {
                        call.respond(HttpStatusCode.Forbidden, "Insufficient permissions")
                        return@get
                    }
                    
                    val id = call.parameters["id"]?.toIntOrNull()
                    if (id == null) {
                        call.respond(HttpStatusCode.BadRequest, "Invalid product ID")
                        return@get
                    }
                    
                    val product = productService.getProductById(id)
                    if (product != null) {
                        call.respond(HttpStatusCode.OK, product)
                    } else {
                        call.respond(HttpStatusCode.NotFound, "Product not found")
                    }
                } catch (e: Exception) {
                    call.respond(HttpStatusCode.InternalServerError, "Error retrieving product: ${e.localizedMessage}")
                }
            }
            
            // Create new product
            post("/products") {
                try {
                    if (!call.hasPermission("product.manage")) {
                        call.respond(HttpStatusCode.Forbidden, "Insufficient permissions")
                        return@post
                    }
                    
                    val product = call.receive<Product>()
                    val productId = productService.createProduct(product)
                    call.respond(HttpStatusCode.Created, mapOf("id" to productId, "message" to "Product created successfully"))
                } catch (e: Exception) {
                    call.respond(HttpStatusCode.BadRequest, "Error creating product: ${e.localizedMessage}")
                }
            }
            
            // Update product
            put("/products/{id}") {
                try {
                    if (!call.hasPermission("product.manage")) {
                        call.respond(HttpStatusCode.Forbidden, "Insufficient permissions")
                        return@put
                    }
                    
                    val id = call.parameters["id"]?.toIntOrNull()
                    if (id == null) {
                        call.respond(HttpStatusCode.BadRequest, "Invalid product ID")
                        return@put
                    }
                    
                    val product = call.receive<Product>()
                    productService.updateProduct(id, product)
                    call.respond(HttpStatusCode.OK, "Product updated successfully")
                } catch (e: Exception) {
                    call.respond(HttpStatusCode.BadRequest, "Error updating product: ${e.localizedMessage}")
                }
            }
            
            // Delete product
            delete("/products/{id}") {
                try {
                    if (!call.hasPermission("product.manage")) {
                        call.respond(HttpStatusCode.Forbidden, "Insufficient permissions")
                        return@delete
                    }
                    
                    val id = call.parameters["id"]?.toIntOrNull()
                    if (id == null) {
                        call.respond(HttpStatusCode.BadRequest, "Invalid product ID")
                        return@delete
                    }
                    
                    productService.deleteProduct(id)
                    call.respond(HttpStatusCode.OK, "Product deleted successfully")
                } catch (e: Exception) {
                    call.respond(HttpStatusCode.BadRequest, "Error deleting product: ${e.localizedMessage}")
                }
            }
            
            // Get groups assigned to a product
            get("/products/{productId}/groups") {
                try {
                    if (!call.hasPermission("product.manage")) {
                        call.respond(HttpStatusCode.Forbidden, "Insufficient permissions")
                        return@get
                    }
                    
                    val productId = call.parameters["productId"]?.toIntOrNull()
                    if (productId == null) {
                        call.respond(HttpStatusCode.BadRequest, "Invalid product ID")
                        return@get
                    }
                    
                    val groups = groupProductService.getProductGroups(productId)
                    call.respond(HttpStatusCode.OK, groups)
                } catch (e: Exception) {
                    call.respond(HttpStatusCode.InternalServerError, "Error retrieving product groups: ${e.localizedMessage}")
                }
            }
            
            // Assign product to group
            post("/groups/{groupId}/products/{productId}") {
                try {
                    if (!call.hasPermission("product.manage")) {
                        call.respond(HttpStatusCode.Forbidden, "Insufficient permissions")
                        return@post
                    }
                    
                    val groupId = call.parameters["groupId"]?.toIntOrNull()
                    val productId = call.parameters["productId"]?.toIntOrNull()
                    
                    if (groupId == null || productId == null) {
                        call.respond(HttpStatusCode.BadRequest, "Invalid group ID or product ID")
                        return@post
                    }
                    
                    groupProductService.assignProductToGroup(groupId, productId)
                    call.respond(HttpStatusCode.OK, "Product assigned to group successfully")
                } catch (e: Exception) {
                    call.respond(HttpStatusCode.BadRequest, "Error assigning product to group: ${e.localizedMessage}")
                }
            }
            
            // Remove product from group
            delete("/groups/{groupId}/products/{productId}") {
                try {
                    if (!call.hasPermission("product.manage")) {
                        call.respond(HttpStatusCode.Forbidden, "Insufficient permissions")
                        return@delete
                    }
                    
                    val groupId = call.parameters["groupId"]?.toIntOrNull()
                    val productId = call.parameters["productId"]?.toIntOrNull()
                    
                    if (groupId == null || productId == null) {
                        call.respond(HttpStatusCode.BadRequest, "Invalid group ID or product ID")
                        return@delete
                    }
                    
                    groupProductService.removeProductFromGroup(groupId, productId)
                    call.respond(HttpStatusCode.OK, "Product removed from group successfully")
                } catch (e: Exception) {
                    call.respond(HttpStatusCode.BadRequest, "Error removing product from group: ${e.localizedMessage}")
                }
            }
            
            // Get products assigned to a group
            get("/groups/{groupId}/products") {
                try {
                    if (!call.hasPermission("product.manage")) {
                        call.respond(HttpStatusCode.Forbidden, "Insufficient permissions")
                        return@get
                    }
                    
                    val groupId = call.parameters["groupId"]?.toIntOrNull()
                    if (groupId == null) {
                        call.respond(HttpStatusCode.BadRequest, "Invalid group ID")
                        return@get
                    }
                    
                    val products = groupProductService.getGroupProducts(groupId)
                    call.respond(HttpStatusCode.OK, products)
                } catch (e: Exception) {
                    call.respond(HttpStatusCode.InternalServerError, "Error retrieving group products: ${e.localizedMessage}")
                }
            }
            
            // Get product with all assigned groups
            get("/products/{productId}/with-groups") {
                try {
                    if (!call.hasPermission("product.manage")) {
                        call.respond(HttpStatusCode.Forbidden, "Insufficient permissions")
                        return@get
                    }
                    
                    val productId = call.parameters["productId"]?.toIntOrNull()
                    if (productId == null) {
                        call.respond(HttpStatusCode.BadRequest, "Invalid product ID")
                        return@get
                    }
                    
                    val productWithGroups = groupProductService.getProductWithGroups(productId)
                    if (productWithGroups != null) {
                        call.respond(HttpStatusCode.OK, productWithGroups)
                    } else {
                        call.respond(HttpStatusCode.NotFound, "Product not found")
                    }
                } catch (e: Exception) {
                    call.respond(HttpStatusCode.InternalServerError, "Error retrieving product with groups: ${e.localizedMessage}")
                }
            }
            
            // Get user's available products
            get("/users/{userId}/products") {
                try {
                    val userId = call.parameters["userId"]?.toIntOrNull()
                    if (userId == null) {
                        call.respond(HttpStatusCode.BadRequest, "Invalid user ID")
                        return@get
                    }
                    
                    val products = groupProductService.getUserProducts(userId)
                    call.respond(HttpStatusCode.OK, products)
                } catch (e: Exception) {
                    call.respond(HttpStatusCode.InternalServerError, "Error retrieving user products: ${e.localizedMessage}")
                }
            }
            
            // Get current user's available products
            get("/me/products") {
                try {
                    val principal = call.principal<JWTPrincipal>()
                    val username = principal?.payload?.getClaim("username")?.asString()
                    
                    if (username != null) {
                        val user = userCredentialsService.getUserCredentialsByUsername(username)
                        if (user != null && user.id != null) {
                            val products = groupProductService.getUserProducts(user.id)
                            call.respond(HttpStatusCode.OK, products)
                        } else {
                            call.respond(HttpStatusCode.NotFound, "User not found")
                        }
                    } else {
                        call.respond(HttpStatusCode.Unauthorized, "Invalid token")
                    }
                } catch (e: Exception) {
                    call.respond(HttpStatusCode.InternalServerError, "Error retrieving user products: ${e.localizedMessage}")
                }
            }
        }

        // Learning Cards API Endpoints (Group-based isolation)
        
        // Exam Management API Endpoints
        authenticate {
            get("/exams") {
                try {
                    val userId = call.getCurrentUserId()
                    if (userId == null) {
                        call.respond(HttpStatusCode.Unauthorized, "Invalid token")
                        return@get
                    }
                    
                    val exams = learningCardService.getExamsForUser(userId)
                    call.respond(HttpStatusCode.OK, exams)
                } catch (e: Exception) {
                    call.respond(HttpStatusCode.InternalServerError, mapOf("error" to "Failed to load exams: ${e.message}"))
                }
            }

            post("/exams") {
                try {
                    val userId = call.getCurrentUserId()
                    if (userId == null) {
                        call.respond(HttpStatusCode.Unauthorized, "Invalid token")
                        return@post
                    }
                    
                    val exam = call.receive<Exam>()
                    val examId = learningCardService.createExam(exam, userId)
                    call.respond(HttpStatusCode.Created, mapOf("id" to examId, "message" to "Exam created successfully"))
                } catch (e: ContentTransformationException) {
                    call.respond(HttpStatusCode.BadRequest, mapOf("error" to "Invalid exam data: ${e.message}"))
                } catch (e: Exception) {
                    call.respond(HttpStatusCode.InternalServerError, mapOf("error" to "Failed to create exam: ${e.message}"))
                }
            }

            put("/exams/{id}") {
                try {
                    val userId = call.getCurrentUserId()
                    if (userId == null) {
                        call.respond(HttpStatusCode.Unauthorized, "Invalid token")
                        return@put
                    }
                    
                    val examId = call.parameters["id"]?.toLongOrNull() ?: throw IllegalArgumentException("Invalid exam ID")
                    val examUpdate = call.receive<Exam>()
                    
                    if (examId != examUpdate.id) {
                        call.respond(HttpStatusCode.BadRequest, mapOf("error" to "ID in path and body do not match"))
                        return@put
                    }
                    
                    val rowsAffected = learningCardService.updateExam(examUpdate, userId)
                    if (rowsAffected > 0) {
                        call.respond(HttpStatusCode.OK, mapOf("message" to "Exam updated successfully"))
                    } else {
                        call.respond(HttpStatusCode.NotFound, mapOf("error" to "Exam not found or no permission"))
                    }
                } catch (e: ContentTransformationException) {
                    call.respond(HttpStatusCode.BadRequest, mapOf("error" to "Invalid exam data: ${e.message}"))
                } catch (e: Exception) {
                    call.respond(HttpStatusCode.InternalServerError, mapOf("error" to "Failed to update exam: ${e.message}"))
                }
            }

            delete("/exams/{id}") {
                try {
                    val userId = call.getCurrentUserId()
                    if (userId == null) {
                        call.respond(HttpStatusCode.Unauthorized, "Invalid token")
                        return@delete
                    }
                    
                    val examId = call.parameters["id"]?.toLongOrNull() ?: throw IllegalArgumentException("Invalid exam ID")
                    
                    val rowsAffected = learningCardService.deleteExam(examId, userId)
                    if (rowsAffected > 0) {
                        call.respond(HttpStatusCode.OK, mapOf("message" to "Exam deleted successfully"))
                    } else {
                        call.respond(HttpStatusCode.NotFound, mapOf("error" to "Exam not found or no permission"))
                    }
                } catch (e: Exception) {
                    call.respond(HttpStatusCode.InternalServerError, mapOf("error" to "Failed to delete exam: ${e.message}"))
                }
            }

            // Exam Card Management
            get("/exams/{examId}/cards") {
                try {
                    val userId = call.getCurrentUserId()
                    if (userId == null) {
                        call.respond(HttpStatusCode.Unauthorized, "Invalid token")
                        return@get
                    }
                    
                    val examId = call.parameters["examId"]?.toLongOrNull() ?: throw IllegalArgumentException("Invalid exam ID")
                    
                    val cards = learningCardService.getExamCards(examId, userId)
                    call.respond(HttpStatusCode.OK, cards)
                } catch (e: Exception) {
                    call.respond(HttpStatusCode.InternalServerError, mapOf("error" to "Failed to load exam cards: ${e.message}"))
                }
            }

            post("/exams/{examId}/cards/{cardId}") {
                try {
                    val userId = call.getCurrentUserId()
                    if (userId == null) {
                        call.respond(HttpStatusCode.Unauthorized, "Invalid token")
                        return@post
                    }
                    
                    val examId = call.parameters["examId"]?.toLongOrNull() ?: throw IllegalArgumentException("Invalid exam ID")
                    val cardId = call.parameters["cardId"]?.toIntOrNull() ?: throw IllegalArgumentException("Invalid card ID")
                    
                    val success = learningCardService.addCardToExam(examId, cardId, userId)
                    if (success) {
                        call.respond(HttpStatusCode.Created, mapOf("message" to "Card added to exam successfully"))
                    } else {
                        call.respond(HttpStatusCode.BadRequest, mapOf("error" to "Failed to add card to exam"))
                    }
                } catch (e: IllegalArgumentException) {
                    call.respond(HttpStatusCode.BadRequest, mapOf("error" to e.message))
                } catch (e: Exception) {
                    call.respond(HttpStatusCode.InternalServerError, mapOf("error" to "Failed to add card to exam: ${e.message}"))
                }
            }

            delete("/exams/{examId}/cards/{cardId}") {
                try {
                    val userId = call.getCurrentUserId()
                    if (userId == null) {
                        call.respond(HttpStatusCode.Unauthorized, "Invalid token")
                        return@delete
                    }
                    
                    val examId = call.parameters["examId"]?.toLongOrNull() ?: throw IllegalArgumentException("Invalid exam ID")
                    val cardId = call.parameters["cardId"]?.toIntOrNull() ?: throw IllegalArgumentException("Invalid card ID")
                    
                    val success = learningCardService.removeCardFromExam(examId, cardId, userId)
                    if (success) {
                        call.respond(HttpStatusCode.OK, mapOf("message" to "Card removed from exam successfully"))
                    } else {
                        call.respond(HttpStatusCode.NotFound, mapOf("error" to "Card not found in exam or no permission"))
                    }
                } catch (e: Exception) {
                    call.respond(HttpStatusCode.InternalServerError, mapOf("error" to "Failed to remove card from exam: ${e.message}"))
                }
            }
        }
        authenticate {
            // Get learning cards for current user (with group-based isolation)
            get("/learning-cards") {
                try {
                    val userId = call.chargeApiCallAndGetUserId()
                    if (userId == null) {
                        call.respond(HttpStatusCode.Unauthorized, "Invalid token")
                        return@get
                    }
                    
                    val cards = learningCardService.getCardsForUser(userId)
                    call.respond(HttpStatusCode.OK, cards)
                } catch (e: Exception) {
                    call.respond(HttpStatusCode.InternalServerError, "Error retrieving learning cards: ${e.localizedMessage}")
                }
            }
            
            // Create new learning card
            post("/learning-cards") {
                try {
                    val userId = call.chargeApiCallAndGetUserId()
                    if (userId == null) {
                        call.respond(HttpStatusCode.Unauthorized, "Invalid token")
                        return@post
                    }
                    
                    val card = call.receive<LearningCard>()
                    val cardId = learningCardService.createCard(card, userId)
                    call.respond(HttpStatusCode.Created, mapOf("id" to cardId, "message" to "Learning card created successfully"))
                } catch (e: Exception) {
                    call.respond(HttpStatusCode.BadRequest, "Error creating learning card: ${e.localizedMessage}")
                }
            }
            
            // Update learning card
            put("/learning-cards/{id}") {
                try {
                    val userId = call.chargeApiCallAndGetUserId()
                    if (userId == null) {
                        call.respond(HttpStatusCode.Unauthorized, "Invalid token")
                        return@put
                    }
                    
                    val cardId = call.parameters["id"]?.toIntOrNull()
                    if (cardId == null) {
                        call.respond(HttpStatusCode.BadRequest, "Invalid card ID")
                        return@put
                    }
                    
                    val card = call.receive<LearningCard>()
                    val success = learningCardService.updateCard(cardId, card, userId)
                    if (success) {
                        call.respond(HttpStatusCode.OK, "Learning card updated successfully")
                    } else {
                        call.respond(HttpStatusCode.Forbidden, "Access denied or card not found")
                    }
                } catch (e: Exception) {
                    call.respond(HttpStatusCode.BadRequest, "Error updating learning card: ${e.localizedMessage}")
                }
            }
            
            // Delete learning card
            delete("/learning-cards/{id}") {
                try {
                    val userId = call.chargeApiCallAndGetUserId()
                    if (userId == null) {
                        call.respond(HttpStatusCode.Unauthorized, "Invalid token")
                        return@delete
                    }
                    
                    val cardId = call.parameters["id"]?.toIntOrNull()
                    if (cardId == null) {
                        call.respond(HttpStatusCode.BadRequest, "Invalid card ID")
                        return@delete
                    }
                    
                    val success = learningCardService.deleteCard(cardId, userId)
                    if (success) {
                        call.respond(HttpStatusCode.OK, "Learning card deleted successfully")
                    } else {
                        call.respond(HttpStatusCode.Forbidden, "Access denied or card not found")
                    }
                } catch (e: Exception) {
                    call.respond(HttpStatusCode.BadRequest, "Error deleting learning card: ${e.localizedMessage}")
                }
            }
        }

        // Learning Materials API Endpoints (Group-based isolation with product access)
        authenticate {
            // Get learning materials for current user (with group-based isolation and product access)
            get("/learning-materials") {
                try {
                    val userId = call.getCurrentUserId()
                    if (userId == null) {
                        call.respond(HttpStatusCode.Unauthorized, "Invalid token")
                        return@get
                    }
                    
                    val materials = learningMaterialService.getMaterialsForUser(userId)
                    call.respond(HttpStatusCode.OK, materials)
                } catch (e: Exception) {
                    call.respond(HttpStatusCode.InternalServerError, "Error retrieving learning materials: ${e.localizedMessage}")
                }
            }
            
            // Create new learning material
            post("/learning-materials") {
                try {
                    val userId = call.getCurrentUserId()
                    if (userId == null) {
                        call.respond(HttpStatusCode.Unauthorized, "Invalid token")
                        return@post
                    }
                    
                    val material = call.receive<LearningMaterial>()
                    val materialId = learningMaterialService.createMaterial(material, userId)
                    if (materialId != null) {
                        call.respond(HttpStatusCode.Created, mapOf("id" to materialId, "message" to "Learning material created successfully"))
                    } else {
                        call.respond(HttpStatusCode.Forbidden, "Access denied - Lernmaterial product required")
                    }
                } catch (e: Exception) {
                    call.respond(HttpStatusCode.BadRequest, "Error creating learning material: ${e.localizedMessage}")
                }
            }
        }

        // Learning Topics API Endpoints (Group-based isolation)
        authenticate {
            // Get learning topics for current user (with group-based isolation)
            get("/learning-topics") {
                try {
                    val userId = call.chargeApiCallAndGetUserId()
                    if (userId == null) {
                        call.respond(HttpStatusCode.Unauthorized, "Invalid token")
                        return@get
                    }
                    
                    val topics = learningTopicService.getTopicsForUser(userId)
                    call.respond(HttpStatusCode.OK, topics)
                } catch (e: Exception) {
                    call.respond(HttpStatusCode.InternalServerError, "Error retrieving topics: ${e.localizedMessage}")
                }
            }
            
            // Create new learning topic
            post("/learning-topics") {
                try {
                    val userId = call.getCurrentUserId()
                    if (userId == null) {
                        call.respond(HttpStatusCode.Unauthorized, "Invalid token")
                        return@post
                    }
                    
                    val topic = call.receive<LearningTopic>()
                    val topicId = learningTopicService.createTopic(topic, userId)
                    call.respond(HttpStatusCode.Created, mapOf("id" to topicId, "message" to "Topic created successfully"))
                } catch (e: Exception) {
                    call.respond(HttpStatusCode.BadRequest, "Error creating topic: ${e.localizedMessage}")
                }
            }
        }

        // Image Management API Endpoints (Group-based isolation)
        authenticate {
            // Get images for current user (with group-based isolation)
            get("/images") {
                try {
                    val userId = call.getCurrentUserId()
                    if (userId == null) {
                        call.respond(HttpStatusCode.Unauthorized, "Invalid token")
                        return@get
                    }
                    
                    val mcardService = MCardService()
                    val images = mcardService.getImagesForUser(userId)
                    call.respond(HttpStatusCode.OK, images)
                } catch (e: Exception) {
                    call.respond(HttpStatusCode.InternalServerError, "Error retrieving images: ${e.localizedMessage}")
                }
            }
            
            // Create new image
            post("/images") {
                try {
                    val userId = call.getCurrentUserId()
                    if (userId == null) {
                        call.respond(HttpStatusCode.Unauthorized, "Invalid token")
                        return@post
                    }
                    
                    val image = call.receive<Image>()
                    val mcardService = MCardService()
                    val imageId = mcardService.createImage(image, userId)
                    call.respond(HttpStatusCode.Created, mapOf("id" to imageId, "message" to "Image created successfully"))
                } catch (e: Exception) {
                    call.respond(HttpStatusCode.BadRequest, "Error creating image: ${e.localizedMessage}")
                }
            }
            
            // Update image
            put("/images/{id}") {
                try {
                    val userId = call.getCurrentUserId()
                    if (userId == null) {
                        call.respond(HttpStatusCode.Unauthorized, "Invalid token")
                        return@put
                    }
                    
                    val imageId = call.parameters["id"]?.toLongOrNull()
                    if (imageId == null) {
                        call.respond(HttpStatusCode.BadRequest, "Invalid image ID")
                        return@put
                    }
                    
                    val image = call.receive<Image>()
                    if (imageId != image.id) {
                        call.respond(HttpStatusCode.BadRequest, "ID in path and body do not match")
                        return@put
                    }
                    
                    val mcardService = MCardService()
                    val success = mcardService.updateImage(image, userId)
                    if (success > 0) {
                        call.respond(HttpStatusCode.OK, "Image updated successfully")
                    } else {
                        call.respond(HttpStatusCode.Forbidden, "Access denied or image not found")
                    }
                } catch (e: Exception) {
                    call.respond(HttpStatusCode.BadRequest, "Error updating image: ${e.localizedMessage}")
                }
            }
            
            // Delete image
            delete("/images/{id}") {
                try {
                    val userId = call.getCurrentUserId()
                    if (userId == null) {
                        call.respond(HttpStatusCode.Unauthorized, "Invalid token")
                        return@delete
                    }
                    
                    val imageId = call.parameters["id"]?.toLongOrNull()
                    if (imageId == null) {
                        call.respond(HttpStatusCode.BadRequest, "Invalid image ID")
                        return@delete
                    }
                    
                    val mcardService = MCardService()
                    val success = mcardService.deleteImage(imageId, userId)
                    if (success > 0) {
                        call.respond(HttpStatusCode.OK, "Image deleted successfully")
                    } else {
                        call.respond(HttpStatusCode.Forbidden, "Access denied or image not found")
                    }
                } catch (e: Exception) {
                    call.respond(HttpStatusCode.BadRequest, "Error deleting image: ${e.localizedMessage}")
                }
            }
            
            // Get specific image by ID
            get("/images/{id}") {
                try {
                    val userId = call.getCurrentUserId()
                    if (userId == null) {
                        call.respond(HttpStatusCode.Unauthorized, "Invalid token")
                        return@get
                    }
                    
                    val imageId = call.parameters["id"]?.toLongOrNull()
                    if (imageId == null) {
                        call.respond(HttpStatusCode.BadRequest, "Invalid image ID")
                        return@get
                    }
                    
                    val mcardService = MCardService()
                    val image = mcardService.getImagebyID(imageId)
                    
                    if (image.id > 0) {
                        // Check if user has access to this image
                        val userImages = mcardService.getImagesForUser(userId)
                        val hasAccess = userImages.any { it.id == imageId }
                        
                        if (hasAccess) {
                            call.respond(HttpStatusCode.OK, image)
                        } else {
                            call.respond(HttpStatusCode.Forbidden, "Access denied")
                        }
                    } else {
                        call.respond(HttpStatusCode.NotFound, "Image not found")
                    }
                } catch (e: Exception) {
                    call.respond(HttpStatusCode.BadRequest, "Error retrieving image: ${e.localizedMessage}")
                }
            }
        }

        // Technical Information API Endpoint (system.admin only)
        authenticate {
            get("/admin/technical-info") {
                try {
                    val principal = call.principal<JWTPrincipal>()
                    val username = principal?.payload?.getClaim("username")?.asString()
                    
                    if (username != null) {
                        val user = userCredentialsService.getUserCredentialsByUsername(username)
                        if (user != null && user.id != null) {
                            val userWithGroups = userCredentialsService.getUserWithGroups(user.id)
                            
                            if (userWithGroups != null) {
                                // Get all permissions for this user through their groups
                                val allPermissions = mutableSetOf<String>()
                                userWithGroups.groups.forEach { group ->
                                    val groupRoles = groupRoleService.getGroupRoles(group.id!!)
                                    groupRoles.forEach { role ->
                                        allPermissions.addAll(role.permissions)
                                    }
                                }
                                
                                // Check if user has system.admin permission
                                val hasSystemAdminPermission = allPermissions.contains("system.admin")
                                
                                if (hasSystemAdminPermission) {
                                    call.respond(HttpStatusCode.OK, mapOf("authorized" to true))
                                } else {
                                    call.respond(HttpStatusCode.Forbidden, "Insufficient permissions - system.admin role required")
                                }
                            } else {
                                call.respond(HttpStatusCode.Forbidden, "User groups not found")
                            }
                        } else {
                            call.respond(HttpStatusCode.NotFound, "User not found")
                        }
                    } else {
                        call.respond(HttpStatusCode.Unauthorized, "Invalid token")
                    }
                } catch (e: Exception) {
                    call.respond(HttpStatusCode.InternalServerError, "Error checking technical info access: ${e.localizedMessage}")
                }
            }
        }


    }
}
