package billing.routing

import billing.model.TopUpRequest
import billing.service.BillingService
import com.shut.UserCredentialsService
import io.ktor.http.*
import io.ktor.server.application.*
import io.ktor.server.auth.*
import io.ktor.server.auth.jwt.*
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.server.routing.*

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

fun Application.configureBillingRouting() {
    val billingService = BillingService()
    
    routing {
        authenticate {
            route("/billing") {
                
                // Get user account info (balance, metrics, recent transactions)
                get("/account") {
                    try {
                        val userId = call.getCurrentUserId()
                        if (userId == null) {
                            call.respond(HttpStatusCode.Unauthorized, mapOf("error" to "Authentication required"))
                            return@get
                        }
                        
                        val accountInfo = billingService.getAccountInfo(userId)
                        call.respond(HttpStatusCode.OK, accountInfo)
                        
                    } catch (e: Exception) {
                        call.respond(HttpStatusCode.InternalServerError, mapOf("error" to "Error loading account info: ${e.message}"))
                    }
                }
                
                // Get current balance
                get("/balance") {
                    try {
                        val userId = call.getCurrentUserId()
                        if (userId == null) {
                            call.respond(HttpStatusCode.Unauthorized, mapOf("error" to "Authentication required"))
                            return@get
                        }
                        
                        val balance = billingService.getAccountBalance(userId)
                        call.respond(HttpStatusCode.OK, mapOf("balance" to balance))
                        
                    } catch (e: Exception) {
                        call.respond(HttpStatusCode.InternalServerError, mapOf("error" to "Error loading balance: ${e.message}"))
                    }
                }
                
                // Top up account
                post("/topup") {
                    try {
                        val userId = call.getCurrentUserId()
                        if (userId == null) {
                            call.respond(HttpStatusCode.Unauthorized, mapOf("error" to "Authentication required"))
                            return@post
                        }
                        
                        val request = call.receive<TopUpRequest>()
                        
                        if (request.amount <= java.math.BigDecimal.ZERO) {
                            call.respond(HttpStatusCode.BadRequest, mapOf("error" to "Amount must be positive"))
                            return@post
                        }
                        
                        val success = billingService.creditAccount(
                            userId = userId,
                            amount = request.amount,
                            description = request.description ?: "Manual top-up"
                        )
                        
                        if (success) {
                            val newBalance = billingService.getAccountBalance(userId)
                            call.respond(HttpStatusCode.OK, mapOf(
                                "success" to true,
                                "message" to "Account topped up successfully",
                                "newBalance" to newBalance
                            ))
                        } else {
                            call.respond(HttpStatusCode.InternalServerError, mapOf("error" to "Failed to top up account"))
                        }
                        
                    } catch (e: Exception) {
                        call.respond(HttpStatusCode.InternalServerError, mapOf("error" to "Error topping up account: ${e.message}"))
                    }
                }
                
                // Get transaction history
                get("/transactions") {
                    try {
                        val userId = call.getCurrentUserId()
                        if (userId == null) {
                            call.respond(HttpStatusCode.Unauthorized, mapOf("error" to "Authentication required"))
                            return@get
                        }
                        
                        val limit = call.request.queryParameters["limit"]?.toIntOrNull() ?: 50
                        val transactions = billingService.getTransactionHistory(userId, limit)
                        
                        call.respond(HttpStatusCode.OK, mapOf("transactions" to transactions))
                        
                    } catch (e: Exception) {
                        call.respond(HttpStatusCode.InternalServerError, mapOf("error" to "Error loading transactions: ${e.message}"))
                    }
                }
                
                // Get detailed metrics
                get("/metrics") {
                    try {
                        val userId = call.getCurrentUserId()
                        if (userId == null) {
                            call.respond(HttpStatusCode.Unauthorized, mapOf("error" to "Authentication required"))
                            return@get
                        }
                        
                        val accountInfo = billingService.getAccountInfo(userId)
                        call.respond(HttpStatusCode.OK, mapOf("metrics" to accountInfo.metrics))
                        
                    } catch (e: Exception) {
                        call.respond(HttpStatusCode.InternalServerError, mapOf("error" to "Error loading metrics: ${e.message}"))
                    }
                }
                
                // Check balance for operation (for frontend validation)
                post("/check") {
                    try {
                        val userId = call.getCurrentUserId()
                        if (userId == null) {
                            call.respond(HttpStatusCode.Unauthorized, mapOf("error" to "Authentication required"))
                            return@post
                        }
                        
                        val operationType = call.request.queryParameters["operation"]
                        val additionalCost = call.request.queryParameters["additionalCost"]?.toBigDecimalOrNull() ?: java.math.BigDecimal.ZERO
                        
                        if (operationType == null) {
                            call.respond(HttpStatusCode.BadRequest, mapOf("error" to "Operation type required"))
                            return@post
                        }
                        
                        val operation = try {
                            billing.schema.OperationType.valueOf(operationType.uppercase())
                        } catch (e: IllegalArgumentException) {
                            call.respond(HttpStatusCode.BadRequest, mapOf("error" to "Invalid operation type"))
                            return@post
                        }
                        
                        val balance = billingService.getAccountBalance(userId)
                        val totalCost = operation.cost + additionalCost
                        val canAfford = balance >= totalCost
                        
                        call.respond(HttpStatusCode.OK, mapOf(
                            "canAfford" to canAfford,
                            "currentBalance" to balance,
                            "requiredAmount" to totalCost,
                            "remainingBalance" to if (canAfford) balance - totalCost else null
                        ))
                        
                    } catch (e: Exception) {
                        call.respond(HttpStatusCode.InternalServerError, mapOf("error" to "Error checking balance: ${e.message}"))
                    }
                }
            }
        }
    }
}