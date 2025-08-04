package billing.model

import java.math.BigDecimal
import java.time.LocalDateTime

data class UserMetricsData(
    val id: Int = 0,
    val userId: Int,
    val documentsCreatedTotal: Int = 0,
    val documentsCreatedThisMonth: Int = 0,
    val dossiersCreatedTotal: Int = 0,
    val dossiersCreatedThisMonth: Int = 0,
    val bytesUploadedTotal: Long = 0,
    val bytesUploadedThisMonth: Long = 0,
    val bytesDownloadedTotal: Long = 0,
    val bytesDownloadedThisMonth: Long = 0,
    val apiCallsTotal: Int = 0,
    val apiCallsThisMonth: Int = 0,
    val learningcardsCreatedTotal: Int = 0,
    val learningcardsCreatedThisMonth: Int = 0,
    val buchungenCreatedTotal: Int = 0,
    val buchungenCreatedThisMonth: Int = 0,
    val searchesTotal: Int = 0,
    val searchesThisMonth: Int = 0,
    val lastMonthlyReset: String = LocalDateTime.now().toString(),
    val createdAt: String = LocalDateTime.now().toString(),
    val updatedAt: String = LocalDateTime.now().toString()
)

data class CardCoinAccountData(
    val id: Int = 0,
    val userId: Int,
    val balance: BigDecimal = BigDecimal.ZERO,
    val totalEarned: BigDecimal = BigDecimal.ZERO,
    val totalSpent: BigDecimal = BigDecimal.ZERO,
    val createdAt: String = LocalDateTime.now().toString(),
    val updatedAt: String = LocalDateTime.now().toString()
)

data class BillingTransactionData(
    val id: Int = 0,
    val userId: Int,
    val transactionType: String,
    val amount: BigDecimal,
    val description: String,
    val operationType: String? = null,
    val balanceBefore: BigDecimal,
    val balanceAfter: BigDecimal,
    val metadata: String? = null,
    val createdAt: String = LocalDateTime.now().toString()
)

data class AccountInfo(
    val account: CardCoinAccountData,
    val metrics: UserMetricsData,
    val recentTransactions: List<BillingTransactionData> = emptyList()
)

data class TopUpRequest(
    val amount: BigDecimal,
    val description: String? = null
)

data class BillingCheckResult(
    val allowed: Boolean,
    val currentBalance: BigDecimal,
    val requiredAmount: BigDecimal,
    val remainingBalance: BigDecimal? = null,
    val message: String? = null
)

class InsufficientFundsException(message: String) : Exception(message)