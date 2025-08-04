package billing.service

import billing.model.*
import billing.schema.*
import org.jetbrains.exposed.sql.*
import org.jetbrains.exposed.sql.SqlExpressionBuilder.eq
import org.jetbrains.exposed.sql.transactions.transaction
import java.math.BigDecimal
import java.time.LocalDateTime
import java.time.format.DateTimeFormatter
import java.time.Instant
import java.util.concurrent.atomic.AtomicLong

class BillingService {
    
    fun initialize() {
        transaction {
            SchemaUtils.create(UserMetrics, CardCoinAccount, BillingTransaction)
        }
    }
    
    /**
     * Check if user has sufficient balance and debit the account
     */
    fun checkAndDebitOperation(userId: Int, operation: OperationType, additionalCost: BigDecimal = BigDecimal.ZERO): BillingCheckResult {
        return transaction {
            val account = getOrCreateAccount(userId)
            val totalCost = operation.cost + additionalCost
            
            if (account.balance < totalCost) {
                BillingCheckResult(
                    allowed = false,
                    currentBalance = account.balance,
                    requiredAmount = totalCost,
                    message = "Dein Guthaben ist aufgebraucht, bitte lade dein Konto auf um weiter arbeiten zu können"
                )
            } else {
                // Debit the account
                val newBalance = account.balance - totalCost
                
                // Update account
                CardCoinAccount.update({ CardCoinAccount.userId eq userId }) {
                    it[balance] = newBalance
                    it[totalSpent] = account.totalSpent + totalCost
                    it[updatedAt] = LocalDateTime.now().toString()
                }
                
                // Record transaction
                recordTransaction(
                    userId = userId,
                    type = TransactionType.DEBIT,
                    amount = totalCost,
                    description = "Charged for ${operation.displayName}",
                    operationType = operation.name,
                    balanceBefore = account.balance,
                    balanceAfter = newBalance
                )
                
                BillingCheckResult(
                    allowed = true,
                    currentBalance = account.balance,
                    requiredAmount = totalCost,
                    remainingBalance = newBalance
                )
            }
        }
    }
    
    /**
     * Credit user account (top-up)
     */
    fun creditAccount(userId: Int, amount: BigDecimal, description: String = "Account top-up"): Boolean {
        return transaction {
            val account = getOrCreateAccount(userId)
            val newBalance = account.balance + amount
            
            // Update account
            val updateCount = CardCoinAccount.update({ CardCoinAccount.userId eq userId }) {
                it[balance] = newBalance
                it[totalEarned] = account.totalEarned + amount
                it[updatedAt] = LocalDateTime.now().toString()
            }
            
            if (updateCount > 0) {
                // Record transaction
                recordTransaction(
                    userId = userId,
                    type = TransactionType.TOPUP,
                    amount = amount,
                    description = description,
                    balanceBefore = account.balance,
                    balanceAfter = newBalance
                )
                true
            } else {
                false
            }
        }
    }
    
    /**
     * Get user account balance
     */
    fun getAccountBalance(userId: Int): BigDecimal {
        return transaction {
            getOrCreateAccount(userId).balance
        }
    }
    
    /**
     * Get complete account info with metrics and recent transactions
     */
    fun getAccountInfo(userId: Int): AccountInfo {
        return transaction {
            val account = getOrCreateAccount(userId)
            val metrics = getOrCreateMetrics(userId)
            val recentTransactions = getRecentTransactions(userId, 20)
            
            AccountInfo(
                account = account,
                metrics = metrics,
                recentTransactions = recentTransactions
            )
        }
    }
    
    /**
     * Record usage metrics
     */
    fun recordMetric(userId: Int, metricType: String, value: Int = 1, bytes: Long = 0) {
        transaction {
            val metrics = getOrCreateMetrics(userId)
            val now = LocalDateTime.now()
            
            // Check if we need to reset monthly counters
            val lastReset = LocalDateTime.parse(metrics.lastMonthlyReset)
            val shouldReset = now.month != lastReset.month || now.year != lastReset.year
            
            when (metricType.uppercase()) {
                "DOCUMENT_CREATE" -> {
                    UserMetrics.update({ UserMetrics.userId eq userId }) {
                        it[documentsCreatedTotal] = metrics.documentsCreatedTotal + value
                        it[documentsCreatedThisMonth] = if (shouldReset) value else metrics.documentsCreatedThisMonth + value
                        if (shouldReset) it[lastMonthlyReset] = now.toString()
                        it[updatedAt] = now.toString()
                    }
                }
                "DOSSIER_CREATE" -> {
                    UserMetrics.update({ UserMetrics.userId eq userId }) {
                        it[dossiersCreatedTotal] = metrics.dossiersCreatedTotal + value
                        it[dossiersCreatedThisMonth] = if (shouldReset) value else metrics.dossiersCreatedThisMonth + value
                        if (shouldReset) it[lastMonthlyReset] = now.toString()
                        it[updatedAt] = now.toString()
                    }
                }
                "LEARNINGCARD_CREATE" -> {
                    UserMetrics.update({ UserMetrics.userId eq userId }) {
                        it[learningcardsCreatedTotal] = metrics.learningcardsCreatedTotal + value
                        it[learningcardsCreatedThisMonth] = if (shouldReset) value else metrics.learningcardsCreatedThisMonth + value
                        if (shouldReset) it[lastMonthlyReset] = now.toString()
                        it[updatedAt] = now.toString()
                    }
                }
                "BUCHUNG_CREATE" -> {
                    UserMetrics.update({ UserMetrics.userId eq userId }) {
                        it[buchungenCreatedTotal] = metrics.buchungenCreatedTotal + value
                        it[buchungenCreatedThisMonth] = if (shouldReset) value else metrics.buchungenCreatedThisMonth + value
                        if (shouldReset) it[lastMonthlyReset] = now.toString()
                        it[updatedAt] = now.toString()
                    }
                }
                "UPLOAD" -> {
                    UserMetrics.update({ UserMetrics.userId eq userId }) {
                        it[bytesUploadedTotal] = metrics.bytesUploadedTotal + bytes
                        it[bytesUploadedThisMonth] = if (shouldReset) bytes else metrics.bytesUploadedThisMonth + bytes
                        if (shouldReset) it[lastMonthlyReset] = now.toString()
                        it[updatedAt] = now.toString()
                    }
                }
                "DOWNLOAD" -> {
                    UserMetrics.update({ UserMetrics.userId eq userId }) {
                        it[bytesDownloadedTotal] = metrics.bytesDownloadedTotal + bytes
                        it[bytesDownloadedThisMonth] = if (shouldReset) bytes else metrics.bytesDownloadedThisMonth + bytes
                        if (shouldReset) it[lastMonthlyReset] = now.toString()
                        it[updatedAt] = now.toString()
                    }
                }
                "API_CALL" -> {
                    UserMetrics.update({ UserMetrics.userId eq userId }) {
                        it[apiCallsTotal] = metrics.apiCallsTotal + value
                        it[apiCallsThisMonth] = if (shouldReset) value else metrics.apiCallsThisMonth + value
                        if (shouldReset) it[lastMonthlyReset] = now.toString()
                        it[updatedAt] = now.toString()
                    }
                }
                "SEARCH" -> {
                    UserMetrics.update({ UserMetrics.userId eq userId }) {
                        it[searchesTotal] = metrics.searchesTotal + value
                        it[searchesThisMonth] = if (shouldReset) value else metrics.searchesThisMonth + value
                        if (shouldReset) it[lastMonthlyReset] = now.toString()
                        it[updatedAt] = now.toString()
                    }
                }
            }
        }
    }
    
    /**
     * Get transaction history
     */
    fun getTransactionHistory(userId: Int, limit: Int = 50): List<BillingTransactionData> {
        return transaction {
            BillingTransaction.selectAll()
                .where { BillingTransaction.userId eq userId }
                .orderBy(BillingTransaction.createdAt, SortOrder.DESC)
                .orderBy(BillingTransaction.id, SortOrder.DESC)
                .limit(limit)
                .map { mapToTransactionData(it) }
        }
    }
    
    // Private helper methods
    
    private fun getOrCreateAccount(userId: Int): CardCoinAccountData {
        return CardCoinAccount.selectAll()
            .where { CardCoinAccount.userId eq userId }
            .map { mapToAccountData(it) }
            .singleOrNull() ?: run {
            // Create new account with initial balance
            val accountId = CardCoinAccount.insertAndGetId {
                it[CardCoinAccount.userId] = userId
                it[balance] = BigDecimal("10.0") // Start with 10 CardCoins
                it[totalEarned] = BigDecimal("10.0")
                it[totalSpent] = BigDecimal.ZERO
            }.value
            
            // Record initial credit transaction
            recordTransaction(
                userId = userId,
                type = TransactionType.CREDIT,
                amount = BigDecimal("10.0"),
                description = "Welcome bonus - Initial 10 CardCoins",
                balanceBefore = BigDecimal.ZERO,
                balanceAfter = BigDecimal("10.0")
            )
            
            CardCoinAccountData(
                id = accountId,
                userId = userId,
                balance = BigDecimal("10.0"),
                totalEarned = BigDecimal("10.0"),
                totalSpent = BigDecimal.ZERO
            )
        }
    }
    
    private fun getOrCreateMetrics(userId: Int): UserMetricsData {
        println("[BillingService] getOrCreateMetrics: userId = $userId")
        return UserMetrics.selectAll()
            .where { UserMetrics.userId eq userId }
            .map { mapToMetricsData(it) }
            .singleOrNull() ?: run {
            // Create new metrics record
            println("[BillingService] getOrCreateMetrics: Creating new metrics record for userId = $userId")
            val metricsId = UserMetrics.insertAndGetId {
                it[UserMetrics.userId] = userId
            }.value
            
            UserMetricsData(id = metricsId, userId = userId)
        }
    }
    
    private fun recordTransaction(
        userId: Int,
        type: TransactionType,
        amount: BigDecimal,
        description: String,
        operationType: String? = null,
        balanceBefore: BigDecimal,
        balanceAfter: BigDecimal,
        metadata: String? = null
    ) {
        BillingTransaction.insert {
            it[BillingTransaction.userId] = userId
            it[transactionType] = type.name
            it[BillingTransaction.amount] = amount
            it[BillingTransaction.description] = description
            it[BillingTransaction.operationType] = operationType
            it[BillingTransaction.balanceBefore] = balanceBefore
            it[BillingTransaction.balanceAfter] = balanceAfter
            it[BillingTransaction.metadata] = metadata
            it[createdAt] = Instant.now().toString()
        }
    }
    
    private fun getRecentTransactions(userId: Int, limit: Int): List<BillingTransactionData> {
        return BillingTransaction.selectAll()
            .where { BillingTransaction.userId eq userId }
            .orderBy(BillingTransaction.createdAt, SortOrder.DESC)
            .orderBy(BillingTransaction.id, SortOrder.DESC)
            .limit(limit)
            .map { mapToTransactionData(it) }
    }
    
    // Mapping functions
    
    private fun mapToAccountData(row: ResultRow): CardCoinAccountData {
        return CardCoinAccountData(
            id = row[CardCoinAccount.id].value,
            userId = row[CardCoinAccount.userId],
            balance = row[CardCoinAccount.balance],
            totalEarned = row[CardCoinAccount.totalEarned],
            totalSpent = row[CardCoinAccount.totalSpent],
            createdAt = row[CardCoinAccount.createdAt],
            updatedAt = row[CardCoinAccount.updatedAt]
        )
    }
    
    private fun mapToMetricsData(row: ResultRow): UserMetricsData {
        return UserMetricsData(
            id = row[UserMetrics.id].value,
            userId = row[UserMetrics.userId],
            documentsCreatedTotal = row[UserMetrics.documentsCreatedTotal],
            documentsCreatedThisMonth = row[UserMetrics.documentsCreatedThisMonth],
            dossiersCreatedTotal = row[UserMetrics.dossiersCreatedTotal],
            dossiersCreatedThisMonth = row[UserMetrics.dossiersCreatedThisMonth],
            bytesUploadedTotal = row[UserMetrics.bytesUploadedTotal],
            bytesUploadedThisMonth = row[UserMetrics.bytesUploadedThisMonth],
            bytesDownloadedTotal = row[UserMetrics.bytesDownloadedTotal],
            bytesDownloadedThisMonth = row[UserMetrics.bytesDownloadedThisMonth],
            apiCallsTotal = row[UserMetrics.apiCallsTotal],
            apiCallsThisMonth = row[UserMetrics.apiCallsThisMonth],
            learningcardsCreatedTotal = row[UserMetrics.learningcardsCreatedTotal],
            learningcardsCreatedThisMonth = row[UserMetrics.learningcardsCreatedThisMonth],
            buchungenCreatedTotal = row[UserMetrics.buchungenCreatedTotal],
            buchungenCreatedThisMonth = row[UserMetrics.buchungenCreatedThisMonth],
            searchesTotal = row[UserMetrics.searchesTotal],
            searchesThisMonth = row[UserMetrics.searchesThisMonth],
            lastMonthlyReset = row[UserMetrics.lastMonthlyReset],
            createdAt = row[UserMetrics.createdAt],
            updatedAt = row[UserMetrics.updatedAt]
        )
    }
    
    private fun mapToTransactionData(row: ResultRow): BillingTransactionData {
        return BillingTransactionData(
            id = row[BillingTransaction.id].value,
            userId = row[BillingTransaction.userId],
            transactionType = row[BillingTransaction.transactionType],
            amount = row[BillingTransaction.amount],
            description = row[BillingTransaction.description],
            operationType = row[BillingTransaction.operationType],
            balanceBefore = row[BillingTransaction.balanceBefore],
            balanceAfter = row[BillingTransaction.balanceAfter],
            metadata = row[BillingTransaction.metadata],
            createdAt = row[BillingTransaction.createdAt]
        )
    }
}