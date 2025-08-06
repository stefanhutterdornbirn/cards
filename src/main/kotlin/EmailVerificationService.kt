package com.shut

import java.security.SecureRandom
import java.time.ZonedDateTime
import java.time.format.DateTimeFormatter
import java.util.*

class EmailVerificationService(
    private val userCredentialsService: UserCredentialsService,
    private val emailService: EmailService?
) {
    
    private val random = SecureRandom()
    
    fun generateVerificationToken(): String {
        val bytes = ByteArray(32)
        random.nextBytes(bytes)
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes)
    }
    
    fun getTokenExpiry(): String {
        return ZonedDateTime.now().plusHours(24).toString()
    }
    
    fun sendVerificationEmail(userId: Int, email: String, username: String, baseUrl: String): Boolean {
        if (emailService == null) {
            println("⚠️ Email service not configured. Cannot send verification email.")
            return false
        }
        
        val token = generateVerificationToken()
        val expiry = getTokenExpiry()
        
        // Store token in database
        userCredentialsService.updateVerificationToken(userId, token, expiry)
        
        // Send email
        return emailService.sendVerificationEmail(email, username, token, baseUrl)
    }
    
    fun verifyEmailToken(token: String): VerificationResult {
        if (token.isBlank()) {
            return VerificationResult.INVALID_TOKEN
        }
        
        val user = userCredentialsService.getUserByVerificationToken(token)
        if (user == null) {
            return VerificationResult.TOKEN_NOT_FOUND
        }
        
        if (user.emailVerified) {
            return VerificationResult.ALREADY_VERIFIED
        }
        
        val success = userCredentialsService.verifyEmail(token)
        return if (success) {
            VerificationResult.SUCCESS
        } else {
            VerificationResult.VERIFICATION_FAILED
        }
    }
    
    fun resendVerificationEmail(email: String, baseUrl: String): ResendResult {
        val user = userCredentialsService.getUserCredentialsByEmail(email)
        if (user == null) {
            return ResendResult.USER_NOT_FOUND
        }
        
        if (user.emailVerified) {
            return ResendResult.ALREADY_VERIFIED
        }
        
        val success = sendVerificationEmail(user.id!!, email, user.username, baseUrl)
        return if (success) {
            ResendResult.SUCCESS
        } else {
            ResendResult.SEND_FAILED
        }
    }
    
    fun getUnverifiedUsers(): List<UserCredentials> {
        return userCredentialsService.getAllUsers().filter { !it.emailVerified && it.email != null }
    }
    
    companion object {
        fun create(userCredentialsService: UserCredentialsService): EmailVerificationService {
            val emailService = EmailService.createFromConfig() ?: EmailService.createFromEnvironment()
            if (emailService == null) {
                println("⚠️ Email service could not be initialized. Check SMTP configuration.")
            }
            return EmailVerificationService(userCredentialsService, emailService)
        }
    }
}

enum class VerificationResult(val message: String, val success: Boolean) {
    SUCCESS("Email verified successfully!", true),
    INVALID_TOKEN("Invalid or malformed verification token.", false),
    TOKEN_NOT_FOUND("Verification token not found or has expired.", false),
    ALREADY_VERIFIED("Email address is already verified.", true),
    VERIFICATION_FAILED("Verification process failed. Please try again.", false)
}

enum class ResendResult(val message: String, val success: Boolean) {
    SUCCESS("Verification email sent successfully!", true),
    USER_NOT_FOUND("No user found with this email address.", false),
    ALREADY_VERIFIED("Email address is already verified.", true),
    SEND_FAILED("Failed to send verification email. Please try again later.", false)
}