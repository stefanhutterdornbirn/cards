package billing.integration

import billing.service.BillingService
import billing.schema.OperationType
import billing.model.InsufficientFundsException
import java.math.BigDecimal

/**
 * Billing interceptor for integrating billing checks into existing services
 * This provides a clean way to add billing without heavily modifying existing code
 */
class BillingInterceptor {
    private val billingService = BillingService()
    
    /**
     * Check and debit for document creation
     */
    fun checkAndDebitDocumentCreation(userId: Int): Boolean {
        val result = billingService.checkAndDebitOperation(userId, OperationType.DOCUMENT_CREATE)
        if (!result.allowed) {
            throw InsufficientFundsException(result.message ?: "Insufficient CardCoin balance")
        }
        billingService.recordMetric(userId, "DOCUMENT_CREATE")
        return true
    }
    
    /**
     * Check and debit for dossier creation
     */
    fun checkAndDebitDossierCreation(userId: Int): Boolean {
        val result = billingService.checkAndDebitOperation(userId, OperationType.DOSSIER_CREATE)
        if (!result.allowed) {
            throw InsufficientFundsException(result.message ?: "Insufficient CardCoin balance")
        }
        billingService.recordMetric(userId, "DOSSIER_CREATE")
        return true
    }
    
    /**
     * Check and debit for learning card creation
     */
    fun checkAndDebitLearningCardCreation(userId: Int): Boolean {
        val result = billingService.checkAndDebitOperation(userId, OperationType.LEARNINGCARD_CREATE)
        if (!result.allowed) {
            throw InsufficientFundsException(result.message ?: "Insufficient CardCoin balance")
        }
        billingService.recordMetric(userId, "LEARNINGCARD_CREATE")
        return true
    }
    
    /**
     * Check and debit for file upload
     */
    fun checkAndDebitFileUpload(userId: Int, fileSizeBytes: Long): Boolean {
        val uploadCost = OperationType.calculateUploadCost(fileSizeBytes)
        val result = billingService.checkAndDebitOperation(userId, OperationType.UPLOAD_100KB, uploadCost - OperationType.UPLOAD_100KB.cost)
        if (!result.allowed) {
            throw InsufficientFundsException(result.message ?: "Insufficient CardCoin balance")
        }
        billingService.recordMetric(userId, "UPLOAD", 1, fileSizeBytes)
        return true
    }
    
    /**
     * Record file download (free, but tracked)
     */
    fun recordFileDownload(userId: Int, fileSizeBytes: Long) {
        billingService.recordMetric(userId, "DOWNLOAD", 1, fileSizeBytes)
    }
    
    /**
     * Check and debit for API call
     */
    fun checkAndDebitApiCall(userId: Int): Boolean {
        val result = billingService.checkAndDebitOperation(userId, OperationType.API_CALL)
        if (!result.allowed) {
            throw InsufficientFundsException(result.message ?: "Insufficient CardCoin balance")
        }
        billingService.recordMetric(userId, "API_CALL")
        return true
    }
    
    /**
     * Check and debit for search operation
     */
    fun checkAndDebitSearch(userId: Int): Boolean {
        val result = billingService.checkAndDebitOperation(userId, OperationType.SEARCH)
        if (!result.allowed) {
            throw InsufficientFundsException(result.message ?: "Insufficient CardCoin balance")
        }
        billingService.recordMetric(userId, "SEARCH")
        return true
    }
    
    /**
     * Check and debit for Buchung creation
     */
    fun checkAndDebitBuchungCreation(userId: Int): Boolean {
        // Using LEARNINGCARD_CREATE cost for Buchung as they have similar complexity
        val result = billingService.checkAndDebitOperation(userId, OperationType.LEARNINGCARD_CREATE)
        if (!result.allowed) {
            throw InsufficientFundsException(result.message ?: "Insufficient CardCoin balance")
        }
        billingService.recordMetric(userId, "BUCHUNG_CREATE")
        return true
    }
    
    /**
     * Get current user balance for frontend checks
     */
    fun getUserBalance(userId: Int): BigDecimal {
        return billingService.getAccountBalance(userId)
    }
}