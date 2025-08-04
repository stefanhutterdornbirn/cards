package com.shut

import io.ktor.server.application.Application
import io.ktor.server.application.*
import io.ktor.server.plugins.requestvalidation.*
import io.ktor.server.plugins.statuspages.*
import io.ktor.http.*
import io.ktor.server.response.*


fun Application.configureValidation() {
    install(RequestValidation) {
        validate<UserCredentials> { credentials ->
            // Einfache Regex zur E-Mail-Validierung (kann verbessert werden)
            val emailRegex = "^[A-Za-z0-9+_.-]+@(.+)$".toRegex()
            credentials.email?.takeIf { it.isNotBlank() }?.let { emailValue ->
                if (!emailRegex.matches(emailValue)) {
                    // Nur wenn eine E-Mail angegeben wurde und diese ungültig ist, Fehler werfen.
                    return@validate ValidationResult.Invalid("Invalid email format.")
                }
            }
            if (credentials.username.isBlank()) {
                ValidationResult.Invalid("Username cannot be blank.")
            } else if (credentials.password.length < 8) {
                ValidationResult.Invalid("Password must be at least 8 characters long.")
            } else {
                ValidationResult.Valid
            }
        }
        validate<String> { bodyText ->
            if (!bodyText.startsWith("Hello"))
                ValidationResult.Invalid("Body text should start with 'Hello'")
            else ValidationResult.Valid
        }
    }

    install(StatusPages) {
        exception<RequestValidationException> { call, cause ->
            call.respond(HttpStatusCode.BadRequest, cause.reasons.joinToString())
        }
        exception<Throwable> { call, cause ->
            call.respondText(text = "500: $cause" , status = HttpStatusCode.InternalServerError)
        }
    }
}

