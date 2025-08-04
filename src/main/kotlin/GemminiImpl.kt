package com.shut

// https://github.com/googleapis/java-genai
import com.google.genai.Client
import kotlinx.serialization.Serializable

// Project 187610535394
// API-Key AIzaSyCgb3OEjk__JgY8gl1CiSph4_LkWc-4DqA


// Ersetze dies durch deine tatsächlichen Werte
val PROJECT_ID = "187610535394"
val LOCATION = "us-central1" // Oder eine andere unterstützte Region

@Serializable
data class Frage(
    var frage: String
)

fun askGemini(frage: String): String {
    val client = Client.builder().apiKey("AIzaSyCgb3OEjk__JgY8gl1CiSph4_LkWc-4DqA").build()
    val response =
        client.models.generateContent("gemini-2.0-flash-001", frage, null)
    return response.text().toString()
}