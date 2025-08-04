package com.shut

import com.amazonaws.services.lambda.runtime.Context
import com.amazonaws.services.lambda.runtime.RequestHandler
import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyRequestEvent
import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyResponseEvent
import io.ktor.client.request.*
import io.ktor.client.statement.*
import io.ktor.http.*
import io.ktor.server.testing.*
import kotlinx.coroutines.runBlocking
import java.util.Base64

class LambdaHandler : RequestHandler<APIGatewayProxyRequestEvent, APIGatewayProxyResponseEvent> {
    
    companion object {
        // Cache the application for better performance
        private var isInitialized = false
        
        // Pre-compile regex patterns and other expensive operations
        private val hostPattern = setOf("host", "x-forwarded-for", "x-forwarded-proto", "x-forwarded-port")
        
        private fun ensureInitialized() {
            if (!isInitialized) {
                // Set system properties to override Ktor configuration for AWS environment
                System.setProperty("ktor.application.id", "learning-cards")
                System.setProperty("ktor.deployment.environment", "aws")
                
                // Warm up Java classes
                try {
                    Class.forName("io.ktor.server.testing.ApplicationTestBuilder")
                    Class.forName("io.ktor.client.statement.HttpResponse")
                } catch (e: Exception) {
                    // Ignore class loading exceptions
                }
                
                isInitialized = true
            }
        }
    }
    
    override fun handleRequest(input: APIGatewayProxyRequestEvent, context: Context): APIGatewayProxyResponseEvent {
        return try {
            ensureInitialized()
            context.logger.log("Processing ${input.httpMethod} ${input.path}")
            
            // Use runBlocking to handle the suspend functions
            val result = runBlocking {
                processRequest(input, context)
            }
            
            result
        } catch (e: Exception) {
            context.logger.log("Error processing request: ${e.message}")
            e.printStackTrace()
            
            createErrorResponse(e)
        }
    }
    
    private suspend fun processRequest(input: APIGatewayProxyRequestEvent, context: Context): APIGatewayProxyResponseEvent {
        var result: APIGatewayProxyResponseEvent? = null
        
        testApplication {
            application {
                module() // This calls your actual Ktor application module
            }
            
            val path = input.path ?: "/"
            val method = HttpMethod.parse(input.httpMethod ?: "GET")
            val headers = input.headers ?: emptyMap()
            val queryParameters = input.queryStringParameters ?: emptyMap()
            val multiValueQueryParameters = input.multiValueQueryStringParameters ?: emptyMap()
            val body = input.body
            val isBase64Encoded = input.isBase64Encoded ?: false
            
            // Build query string from parameters
            val queryString = buildQueryString(queryParameters, multiValueQueryParameters)
            val fullPath = if (queryString.isNotEmpty()) "$path?$queryString" else path
            
            context.logger.log("Making request to: $fullPath")
            
            // Make the request to your Ktor application
            val response = client.request(fullPath) {
                this.method = method
                
                // Forward headers (filter out problematic ones)
                val filteredHeaders = headers.filterKeys { key ->
                    key.lowercase() !in hostPattern
                }
                
                filteredHeaders.forEach { (key, value) ->
                    header(key, value)
                }
                
                // Handle request body
                if (body != null && method in listOf(HttpMethod.Post, HttpMethod.Put, HttpMethod.Patch, HttpMethod.Delete)) {
                    val actualBody = if (isBase64Encoded) {
                        Base64.getDecoder().decode(body)
                    } else {
                        body.toByteArray()
                    }
                    
                    setBody(actualBody)
                    
                    // Set content type if not already set
                    if ("content-type" !in filteredHeaders.keys.map { it.lowercase() }) {
                        contentType(ContentType.Application.Json)
                    }
                }
            }
            
            // Convert Ktor response to API Gateway response and store it
            result = convertToApiGatewayResponse(response, context)
        }
        
        return result ?: createErrorResponse(RuntimeException("Failed to process request"))
    }
    
    private fun buildQueryString(
        queryParameters: Map<String, String>,
        multiValueQueryParameters: Map<String, List<String>>
    ): String {
        val params = mutableListOf<String>()
        
        // Add single value parameters
        queryParameters.forEach { (key, value) ->
            params.add("$key=${java.net.URLEncoder.encode(value, "UTF-8")}")
        }
        
        // Add multi-value parameters
        multiValueQueryParameters.forEach { (key, values) ->
            values.forEach { value ->
                params.add("$key=${java.net.URLEncoder.encode(value, "UTF-8")}")
            }
        }
        
        return params.joinToString("&")
    }
    
    private suspend fun convertToApiGatewayResponse(
        response: io.ktor.client.statement.HttpResponse,
        context: Context
    ): APIGatewayProxyResponseEvent {
        val responseBody = response.bodyAsText()
        val statusCode = response.status.value
        
        context.logger.log("Response status: $statusCode, body length: ${responseBody.length}")
        
        // Convert response headers
        val responseHeaders = mutableMapOf<String, String>()
        response.headers.forEach { key, values ->
            responseHeaders[key] = values.joinToString(", ")
        }
        
        // Add CORS headers for web compatibility
        responseHeaders["Access-Control-Allow-Origin"] = "*"
        responseHeaders["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
        responseHeaders["Access-Control-Allow-Headers"] = "Content-Type, Authorization, X-Requested-With"
        
        return APIGatewayProxyResponseEvent().apply {
            this.statusCode = statusCode
            this.body = responseBody
            this.headers = responseHeaders
            this.isBase64Encoded = false
        }
    }
    
    private fun createErrorResponse(e: Exception): APIGatewayProxyResponseEvent {
        return APIGatewayProxyResponseEvent().apply {
            statusCode = 500
            body = """{"error":"Internal server error: ${e.message}","type":"${e.javaClass.simpleName}"}"""
            headers = mapOf(
                "Content-Type" to "application/json",
                "Access-Control-Allow-Origin" to "*"
            )
            isBase64Encoded = false
        }
    }
}