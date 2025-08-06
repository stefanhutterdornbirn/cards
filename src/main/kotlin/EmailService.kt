package com.shut

import javax.mail.*
import javax.mail.internet.*
import java.util.*
import kotlinx.serialization.Serializable

@Serializable
data class EmailConfig(
    val smtpHost: String,
    val smtpPort: Int,
    val username: String,
    val password: String,
    val fromEmail: String,
    val fromName: String,
    val enableTLS: Boolean = true,
    val enableAuth: Boolean = true
)

@Serializable
data class EmailTemplate(
    val subject: String,
    val htmlContent: String,
    val textContent: String
)

class EmailService(private val config: EmailConfig) {
    
    private val properties = Properties().apply {
        put("mail.smtp.host", config.smtpHost)
        put("mail.smtp.port", config.smtpPort)
        put("mail.smtp.auth", config.enableAuth.toString())
        
        if (config.smtpPort == 465) {
            // SSL connection for port 465
            put("mail.smtp.ssl.enable", "true")
            put("mail.smtp.ssl.protocols", "TLSv1.2")
        } else if (config.enableTLS) {
            // STARTTLS for port 587
            put("mail.smtp.starttls.enable", "true")
        }
    }
    
    private val authenticator = object : Authenticator() {
        override fun getPasswordAuthentication(): PasswordAuthentication {
            return PasswordAuthentication(config.username, config.password)
        }
    }
    
    fun sendVerificationEmail(toEmail: String, username: String, verificationToken: String, baseUrl: String): Boolean {
        val verificationLink = "$baseUrl/verify-email?token=$verificationToken"
        
        val template = createVerificationTemplate(username, verificationLink, verificationToken)
        
        return sendEmail(toEmail, template.subject, template.htmlContent, template.textContent)
    }
    
    private fun createVerificationTemplate(username: String, verificationLink: String, token: String): EmailTemplate {
        val subject = "Verify Your Email Address - Learning Cards"
        
        val htmlContent = """
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Email Verification</title>
                <style>
                    body { font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 20px; }
                    .container { max-width: 600px; margin: 0 auto; background-color: white; padding: 40px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                    .header { text-align: center; margin-bottom: 30px; }
                    .header h1 { color: #333; margin: 0; }
                    .content { line-height: 1.6; color: #555; }
                    .verification-button { display: inline-block; background-color: #007bff; color: white; text-decoration: none; padding: 12px 30px; border-radius: 5px; margin: 20px 0; font-weight: bold; }
                    .verification-button:hover { background-color: #0056b3; }
                    .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #888; text-align: center; }
                    .token { font-family: monospace; background-color: #f8f9fa; padding: 10px; border-radius: 5px; margin: 10px 0; word-break: break-all; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🎓 Learning Cards</h1>
                        <p>Email Verification Required</p>
                    </div>
                    
                    <div class="content">
                        <p>Hello <strong>$username</strong>,</p>
                        
                        <p>Welcome to Learning Cards! To complete your registration and start using our platform, please verify your email address.</p>
                        
                        <div style="text-align: center;">
                            <a href="$verificationLink" class="verification-button">Verify Email Address</a>
                        </div>
                        
                        <p>If the button above doesn't work, you can also copy and paste the following link into your browser:</p>
                        <div class="token">$verificationLink</div>
                        
                        <p><strong>Alternative:</strong> You can also use this verification code:</p>
                        <div class="token">$token</div>
                        
                        <p><strong>Important:</strong> This verification link will expire in 24 hours for security reasons.</p>
                        
                        <p>If you didn't create an account with Learning Cards, please ignore this email.</p>
                        
                        <p>Best regards,<br>The Learning Cards Team</p>
                    </div>
                    
                    <div class="footer">
                        <p>© 2025 Learning Cards. All rights reserved.</p>
                        <p>This is an automated email. Please do not reply to this message.</p>
                    </div>
                </div>
            </body>
            </html>
        """.trimIndent()
        
        val textContent = """
            Learning Cards - Email Verification
            
            Hello $username,
            
            Welcome to Learning Cards! To complete your registration and start using our platform, please verify your email address.
            
            Click this link to verify: $verificationLink
            
            Or use this verification code: $token
            
            Important: This verification link will expire in 24 hours for security reasons.
            
            If you didn't create an account with Learning Cards, please ignore this email.
            
            Best regards,
            The Learning Cards Team
            
            © 2025 Learning Cards. All rights reserved.
            This is an automated email. Please do not reply to this message.
        """.trimIndent()
        
        return EmailTemplate(subject, htmlContent, textContent)
    }
    
    private fun sendEmail(toEmail: String, subject: String, htmlContent: String, textContent: String): Boolean {
        return try {
            val session = Session.getInstance(properties, authenticator)
            val message = MimeMessage(session)
            
            // Set sender
            message.setFrom(InternetAddress(config.fromEmail, config.fromName))
            
            // Set recipient
            message.setRecipients(Message.RecipientType.TO, InternetAddress.parse(toEmail))
            
            // Set subject
            message.subject = subject
            
            // Create multipart message
            val multipart = MimeMultipart("alternative")
            
            // Add text part
            val textPart = MimeBodyPart()
            textPart.setText(textContent, "utf-8")
            multipart.addBodyPart(textPart)
            
            // Add HTML part
            val htmlPart = MimeBodyPart()
            htmlPart.setContent(htmlContent, "text/html; charset=utf-8")
            multipart.addBodyPart(htmlPart)
            
            // Set content
            message.setContent(multipart)
            
            // Send message
            Transport.send(message)
            
            println("✅ Email sent successfully to $toEmail")
            true
        } catch (e: Exception) {
            println("❌ Failed to send email to $toEmail: ${e.message}")
            e.printStackTrace()
            false
        }
    }
    
    companion object {
        fun createFromConfig(): EmailService? {
            return try {
                val config = EmailConfig(
                    smtpHost = "smtp.mailbox.org",
                    smtpPort = 465,
                    username = "mag.stefan.hutter@m3-works.com",
                    password = "r!w-A8Db\$wd?bEA",
                    fromEmail = "mag.stefan.hutter@m3-works.com",
                    fromName = "Learning Cards",
                    enableTLS = true,
                    enableAuth = true
                )
                EmailService(config)
            } catch (e: Exception) {
                println("⚠️ Failed to create email service: ${e.message}")
                null
            }
        }
        
        fun createFromEnvironment(): EmailService? {
            return try {
                val config = EmailConfig(
                    smtpHost = System.getenv("SMTP_HOST") ?: "smtp.mailbox.org",
                    smtpPort = System.getenv("SMTP_PORT")?.toIntOrNull() ?: 465,
                    username = System.getenv("SMTP_USERNAME") ?: return null,
                    password = System.getenv("SMTP_PASSWORD") ?: return null,
                    fromEmail = System.getenv("SMTP_FROM_EMAIL") ?: return null,
                    fromName = System.getenv("SMTP_FROM_NAME") ?: "Learning Cards",
                    enableTLS = System.getenv("SMTP_TLS")?.toBoolean() ?: true,
                    enableAuth = System.getenv("SMTP_AUTH")?.toBoolean() ?: true
                )
                EmailService(config)
            } catch (e: Exception) {
                println("⚠️ Failed to create email service from environment: ${e.message}")
                null
            }
        }
    }
}