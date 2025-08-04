package billing.schema

import com.shut.UserCredentialsTab
import org.jetbrains.exposed.dao.id.IntIdTable
import org.jetbrains.exposed.sql.*
import java.math.BigDecimal
import java.time.LocalDateTime

object UserMetrics : IntIdTable("user_metrics") {
    val userId = integer("user_id").references(UserCredentialsTab.id).uniqueIndex()
    val documentsCreatedTotal = integer("documents_created_total").default(0)
    val documentsCreatedThisMonth = integer("documents_created_this_month").default(0)
    val dossiersCreatedTotal = integer("dossiers_created_total").default(0)
    val dossiersCreatedThisMonth = integer("dossiers_created_this_month").default(0)
    val bytesUploadedTotal = long("bytes_uploaded_total").default(0)
    val bytesUploadedThisMonth = long("bytes_uploaded_this_month").default(0)
    val bytesDownloadedTotal = long("bytes_downloaded_total").default(0)
    val bytesDownloadedThisMonth = long("bytes_downloaded_this_month").default(0)
    val apiCallsTotal = integer("api_calls_total").default(0)
    val apiCallsThisMonth = integer("api_calls_this_month").default(0)
    val learningcardsCreatedTotal = integer("learningcards_created_total").default(0)
    val learningcardsCreatedThisMonth = integer("learningcards_created_this_month").default(0)
    val buchungenCreatedTotal = integer("buchungen_created_total").default(0)
    val buchungenCreatedThisMonth = integer("buchungen_created_this_month").default(0)
    val searchesTotal = integer("searches_total").default(0)
    val searchesThisMonth = integer("searches_this_month").default(0)
    val lastMonthlyReset = varchar("last_monthly_reset", 50).default(LocalDateTime.now().toString())
    val createdAt = varchar("created_at", 50).default(LocalDateTime.now().toString())
    val updatedAt = varchar("updated_at", 50).default(LocalDateTime.now().toString())
}

object CardCoinAccount : IntIdTable("cardcoin_account") {
    val userId = integer("user_id").references(UserCredentialsTab.id).uniqueIndex()
    val balance = decimal("balance", 10, 4).default(BigDecimal.ZERO)
    val totalEarned = decimal("total_earned", 10, 4).default(BigDecimal.ZERO)
    val totalSpent = decimal("total_spent", 10, 4).default(BigDecimal.ZERO)
    val createdAt = varchar("created_at", 50).default(LocalDateTime.now().toString())
    val updatedAt = varchar("updated_at", 50).default(LocalDateTime.now().toString())
}

object BillingTransaction : IntIdTable("billing_transaction") {
    val userId = integer("user_id").references(UserCredentialsTab.id)
    val transactionType = varchar("transaction_type", 50) // DEBIT, CREDIT, TOPUP
    val amount = decimal("amount", 10, 4)
    val description = varchar("description", 255)
    val operationType = varchar("operation_type", 50).nullable() // DOCUMENT_CREATE, API_CALL, etc.
    val balanceBefore = decimal("balance_before", 10, 4)
    val balanceAfter = decimal("balance_after", 10, 4)
    val metadata = text("metadata").nullable() // JSON for additional info
    val createdAt = varchar("created_at", 50).default(LocalDateTime.now().toString())
}

enum class TransactionType {
    DEBIT, CREDIT, TOPUP
}

enum class OperationType(val cost: BigDecimal, val displayName: String) {
    DOCUMENT_CREATE(BigDecimal("0.1"), "Dokument erstellen"),
    LEARNINGCARD_CREATE(BigDecimal("0.1"), "Lernkarte erstellen"),
    DOSSIER_CREATE(BigDecimal("0.2"), "Dossier erstellen"),
    UPLOAD_100KB(BigDecimal("0.1"), "Upload (100KB)"),
    API_CALL(BigDecimal("0.01"), "API-Aufruf"),
    SEARCH(BigDecimal("0.01"), "Suche");
    
    companion object {
        fun calculateUploadCost(bytes: Long): BigDecimal {
            val blocks = (bytes + 102399) / 102400 // Round up to next 100KB block
            return UPLOAD_100KB.cost * BigDecimal(blocks)
        }
    }
}