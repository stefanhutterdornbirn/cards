// BillingService.ts - Frontend service for CardCoin billing system

import { i18n } from '../i18n/TranslationService.js';

interface AccountInfo {
    account: {
        id: number;
        userId: number;
        balance: number;
        totalEarned: number;
        totalSpent: number;
        createdAt: string;
        updatedAt: string;
    };
    metrics: {
        id: number;
        userId: number;
        documentsCreatedTotal: number;
        documentsCreatedThisMonth: number;
        dossiersCreatedTotal: number;
        dossiersCreatedThisMonth: number;
        bytesUploadedTotal: number;
        bytesUploadedThisMonth: number;
        bytesDownloadedTotal: number;
        bytesDownloadedThisMonth: number;
        apiCallsTotal: number;
        apiCallsThisMonth: number;
        learningcardsCreatedTotal: number;
        learningcardsCreatedThisMonth: number;
        buchungenCreatedTotal: number;
        buchungenCreatedThisMonth: number;
        searchesTotal: number;
        searchesThisMonth: number;
        lastMonthlyReset: string;
        createdAt: string;
        updatedAt: string;
    };
    recentTransactions: Transaction[];
}

interface Transaction {
    id: number;
    userId: number;
    transactionType: string;
    amount: number;
    description: string;
    operationType?: string;
    balanceBefore: number;
    balanceAfter: number;
    metadata?: string;
    createdAt: string;
}

interface BalanceCheck {
    canAfford: boolean;
    currentBalance: number;
    requiredAmount: number;
    remainingBalance?: number;
}

class BillingService {
    private static instance: BillingService;
    
    public static getInstance(): BillingService {
        if (!BillingService.instance) {
            BillingService.instance = new BillingService();
        }
        return BillingService.instance;
    }
    
    private async makeAuthenticatedRequest(url: string, options: RequestInit = {}): Promise<Response> {
        const authToken = localStorage.getItem('authToken');
        if (!authToken) {
            throw new Error(i18n.t('auth.authTokenNotFound'));
        }
        
        const headers = {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
            ...options.headers
        };
        
        return fetch(url, {
            ...options,
            headers
        });
    }
    
    /**
     * Get complete account information
     */
    async getAccountInfo(): Promise<AccountInfo> {
        const response = await this.makeAuthenticatedRequest('/billing/account');
        if (!response.ok) {
            throw new Error(`${i18n.t('billing.failedToGetAccountInfo')}: ${response.statusText}`);
        }
        return response.json();
    }
    
    /**
     * Get current balance only
     */
    async getBalance(): Promise<number> {
        const response = await this.makeAuthenticatedRequest('/billing/balance');
        if (!response.ok) {
            throw new Error(`${i18n.t('billing.failedToGetBalance')}: ${response.statusText}`);
        }
        const data = await response.json();
        return data.balance;
    }
    
    /**
     * Top up account balance
     */
    async topUpAccount(amount: number, description?: string): Promise<boolean> {
        const response = await this.makeAuthenticatedRequest('/billing/topup', {
            method: 'POST',
            body: JSON.stringify({ amount, description })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || i18n.t('billing.failedToTopUp'));
        }
        
        return true;
    }
    
    /**
     * Get transaction history
     */
    async getTransactionHistory(limit: number = 50): Promise<Transaction[]> {
        const response = await this.makeAuthenticatedRequest(`/billing/transactions?limit=${limit}`);
        if (!response.ok) {
            throw new Error(`${i18n.t('billing.failedToGetTransactionHistory')}: ${response.statusText}`);
        }
        const data = await response.json();
        return data.transactions;
    }
    
    /**
     * Check if user can afford an operation
     */
    async checkBalance(operation: string, additionalCost: number = 0): Promise<BalanceCheck> {
        const response = await this.makeAuthenticatedRequest(
            `/billing/check?operation=${operation}&additionalCost=${additionalCost}`,
            { method: 'POST' }
        );
        if (!response.ok) {
            throw new Error(`${i18n.t('billing.failedToCheckBalance')}: ${response.statusText}`);
        }
        return response.json();
    }
    
    /**
     * Show low balance warning modal
     */
    showLowBalanceWarning(currentBalance: number, requiredAmount: number): void {
        const modal = document.createElement('div');
        modal.className = 'billing-modal-overlay';
        modal.innerHTML = `
            <div class="billing-modal">
                <div class="billing-modal-header">
                    <h3>💰 ${i18n.t('billing.balanceExhausted')}</h3>
                    <button class="billing-modal-close">&times;</button>
                </div>
                <div class="billing-modal-body">
                    <div class="balance-warning">
                        <div class="balance-info">
                            <div class="balance-item">
                                <span class="balance-label">${i18n.t('billing.currentBalance')}:</span>
                                <span class="balance-value">${currentBalance.toFixed(4)} CardCoins</span>
                            </div>
                            <div class="balance-item">
                                <span class="balance-label">${i18n.t('billing.required')}:</span>
                                <span class="balance-value">${requiredAmount.toFixed(4)} CardCoins</span>
                            </div>
                            <div class="balance-item shortage">
                                <span class="balance-label">${i18n.t('billing.shortage')}:</span>
                                <span class="balance-value">${(requiredAmount - currentBalance).toFixed(4)} CardCoins</span>
                            </div>
                        </div>
                        <div class="warning-message">
                            <p>${i18n.t('billing.balanceExhaustedMessage')}</p>
                        </div>
                    </div>
                </div>
                <div class="billing-modal-footer">
                    <button class="btn btn-primary" id="topUpButton">${i18n.t('billing.topUpAccount')}</button>
                    <button class="btn btn-secondary billing-modal-close">${i18n.t('billing.close')}</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Event listeners
        modal.querySelectorAll('.billing-modal-close').forEach(btn => {
            btn.addEventListener('click', () => {
                document.body.removeChild(modal);
            });
        });
        
        modal.querySelector('#topUpButton')?.addEventListener('click', () => {
            document.body.removeChild(modal);
            this.showTopUpModal();
        });
        
        // Close on overlay click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });
    }
    
    /**
     * Show top-up modal
     */
    showTopUpModal(): void {
        const modal = document.createElement('div');
        modal.className = 'billing-modal-overlay';
        modal.innerHTML = `
            <div class="billing-modal">
                <div class="billing-modal-header">
                    <h3>💳 ${i18n.t('billing.topUpAccount')}</h3>
                    <button class="billing-modal-close">&times;</button>
                </div>
                <div class="billing-modal-body">
                    <div class="topup-form">
                        <div class="form-group">
                            <label for="topupAmount">${i18n.t('billing.amount')} (CardCoins):</label>
                            <input type="number" id="topupAmount" step="0.1" min="0.1" placeholder="10.0" required>
                        </div>
                        <div class="form-group">
                            <label for="topupDescription">${i18n.t('billing.description')} (${i18n.t('billing.optional')}):</label>
                            <input type="text" id="topupDescription" placeholder="${i18n.t('billing.topUpTransaction')}">
                        </div>
                        <div class="quick-amounts">
                            <span class="quick-amount-label">${i18n.t('billing.quickSelection')}:</span>
                            <button class="quick-amount" data-amount="5">5.0</button>
                            <button class="quick-amount" data-amount="10">10.0</button>
                            <button class="quick-amount" data-amount="25">25.0</button>
                            <button class="quick-amount" data-amount="50">50.0</button>
                        </div>
                    </div>
                </div>
                <div class="billing-modal-footer">
                    <button class="btn btn-primary" id="confirmTopUp">${i18n.t('billing.topUp')}</button>
                    <button class="btn btn-secondary billing-modal-close">${i18n.t('billing.cancel')}</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        const amountInput = modal.querySelector('#topupAmount') as HTMLInputElement;
        const descriptionInput = modal.querySelector('#topupDescription') as HTMLInputElement;
        
        // Quick amount buttons
        modal.querySelectorAll('.quick-amount').forEach(btn => {
            btn.addEventListener('click', () => {
                const amount = btn.getAttribute('data-amount');
                if (amount) {
                    amountInput.value = amount;
                }
            });
        });
        
        // Close buttons
        modal.querySelectorAll('.billing-modal-close').forEach(btn => {
            btn.addEventListener('click', () => {
                document.body.removeChild(modal);
            });
        });
        
        // Confirm button
        modal.querySelector('#confirmTopUp')?.addEventListener('click', async () => {
            // Close modal and show contact message instead of processing top-up
            document.body.removeChild(modal);
            alert(i18n.t('billing.contactForTopUp'));
        });
        
        // Close on overlay click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });
        
        // Focus amount input
        amountInput.focus();
    }
    
    /**
     * Show success message
     */
    private showSuccessMessage(message: string): void {
        const notification = document.createElement('div');
        notification.className = 'billing-notification success';
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
    
    /**
     * Refresh balance display in UI
     */
    async refreshBalanceDisplay(): Promise<void> {
        try {
            const accountInfo = await this.getAccountInfo();
            
            // Update balance displays
            document.querySelectorAll('.cardcoin-balance').forEach(element => {
                element.textContent = `${accountInfo.account.balance.toFixed(4)} CardCoins`;
            });
            
            // Update metrics displays if they exist
            this.updateMetricsDisplay(accountInfo.metrics);
            
        } catch (error) {
            console.error(i18n.t('billing.failedToRefreshBalance'), error);
        }
    }
    
    /**
     * Update metrics display
     */
    private updateMetricsDisplay(metrics: any): void {
        // This will be implemented when we create the user account GUI
        console.log('Metrics updated:', metrics);
    }
    
    /**
     * Initialize billing service and add balance display to header
     */
    async initialize(): Promise<void> {
        try {
            // Add balance display to header
            await this.addBalanceToHeader();
            
            // Refresh balance every 30 seconds
            setInterval(() => {
                this.refreshBalanceDisplay();
            }, 30000);
            
        } catch (error) {
            console.error(i18n.t('billing.failedToInitialize'), error);
        }
    }
    
    /**
     * Add balance display to header
     */
    private async addBalanceToHeader(): Promise<void> {
        const header = document.querySelector('.login-button-container');
        if (!header) return;
        
        try {
            const balance = await this.getBalance();
            
            const balanceDisplay = document.createElement('div');
            balanceDisplay.className = 'cardcoin-display';
            balanceDisplay.innerHTML = `
                <div class="cardcoin-info">
                    <span class="cardcoin-icon">🪙</span>
                    <span class="cardcoin-balance">${balance.toFixed(4)} CardCoins</span>
                </div>
            `;
            
            balanceDisplay.addEventListener('click', () => {
                this.showAccountModal();
            });
            
            // Insert before user info
            const userInfo = header.querySelector('.header-user-info');
            if (userInfo) {
                header.insertBefore(balanceDisplay, userInfo);
            } else {
                // Fallback: just add to header
                header.appendChild(balanceDisplay);
            }
            
        } catch (error) {
            console.error(i18n.t('billing.failedToAddBalanceToHeader'), error);
        }
    }
    
    /**
     * Show user account modal with detailed information
     */
    public async showAccountModal(): Promise<void> {
        try {
            const accountInfo = await this.getAccountInfo();
            
            const modal = document.createElement('div');
            modal.className = 'billing-modal-overlay';
            modal.innerHTML = `
                <div class="billing-modal large">
                    <div class="billing-modal-header">
                        <h3>🪙 ${i18n.t('billing.myCardCoinWallet')}</h3>
                        <button class="billing-modal-close">&times;</button>
                    </div>
                    <div class="billing-modal-body">
                        <div class="account-summary">
                            <div class="balance-card">
                                <h4>💰 ${i18n.t('billing.balance')}</h4>
                                <div class="balance-amount">${accountInfo.account.balance.toFixed(4)} CardCoins</div>
                                <div class="balance-stats">
                                    <span>${i18n.t('billing.earned')}: ${accountInfo.account.totalEarned.toFixed(2)}</span>
                                    <span>${i18n.t('billing.spent')}: ${accountInfo.account.totalSpent.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                        
                        <div class="metrics-section">
                            <h4>📊 ${i18n.t('billing.usageStatistics')}</h4>
                            <div class="metrics-grid">
                                <div class="metric-card">
                                    <div class="metric-value">${accountInfo.metrics.documentsCreatedTotal}</div>
                                    <div class="metric-label">${i18n.t('billing.documentsCreated')}</div>
                                    <div class="metric-monthly">${accountInfo.metrics.documentsCreatedThisMonth} ${i18n.t('billing.thisMonth')}</div>
                                </div>
                                <div class="metric-card">
                                    <div class="metric-value">${accountInfo.metrics.dossiersCreatedTotal}</div>
                                    <div class="metric-label">${i18n.t('billing.dossiersCreated')}</div>
                                    <div class="metric-monthly">${accountInfo.metrics.dossiersCreatedThisMonth} ${i18n.t('billing.thisMonth')}</div>
                                </div>
                                <div class="metric-card">
                                    <div class="metric-value">${accountInfo.metrics.learningcardsCreatedTotal}</div>
                                    <div class="metric-label">${i18n.t('billing.learningCardsCreated')}</div>
                                    <div class="metric-monthly">${accountInfo.metrics.learningcardsCreatedThisMonth} ${i18n.t('billing.thisMonth')}</div>
                                </div>
                                <div class="metric-card">
                                    <div class="metric-value">${(accountInfo.metrics.bytesUploadedTotal / 1024 / 1024).toFixed(1)} MB</div>
                                    <div class="metric-label">${i18n.t('billing.uploaded')}</div>
                                    <div class="metric-monthly">${(accountInfo.metrics.bytesUploadedThisMonth / 1024 / 1024).toFixed(1)} MB ${i18n.t('billing.thisMonth')}</div>
                                </div>
                                <div class="metric-card">
                                    <div class="metric-value">${(accountInfo.metrics.bytesDownloadedTotal / 1024 / 1024).toFixed(1)} MB</div>
                                    <div class="metric-label">${i18n.t('billing.downloaded')}</div>
                                    <div class="metric-monthly">${(accountInfo.metrics.bytesDownloadedThisMonth / 1024 / 1024).toFixed(1)} MB ${i18n.t('billing.thisMonth')}</div>
                                </div>
                                <div class="metric-card">
                                    <div class="metric-value">${accountInfo.metrics.apiCallsTotal}</div>
                                    <div class="metric-label">${i18n.t('billing.apiCalls')}</div>
                                    <div class="metric-monthly">${accountInfo.metrics.apiCallsThisMonth} ${i18n.t('billing.thisMonth')}</div>
                                </div>
                                <div class="metric-card">
                                    <div class="metric-value">${accountInfo.metrics.searchesTotal}</div>
                                    <div class="metric-label">${i18n.t('billing.searches')}</div>
                                    <div class="metric-monthly">${accountInfo.metrics.searchesThisMonth} ${i18n.t('billing.thisMonth')}</div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="recent-transactions">
                            <h4>📝 ${i18n.t('billing.recentTransactions')}</h4>
                            <div class="transactions-list">
                                ${accountInfo.recentTransactions.map(tx => `
                                    <div class="transaction-item ${tx.transactionType.toLowerCase()}">
                                        <div class="transaction-info">
                                            <div class="transaction-desc">${tx.description}</div>
                                            <div class="transaction-date">${new Date(tx.createdAt).toLocaleString('de-DE')}</div>
                                        </div>
                                        <div class="transaction-amount ${tx.transactionType === 'DEBIT' ? 'negative' : 'positive'}">
                                            ${tx.transactionType === 'DEBIT' ? '-' : '+'}${tx.amount.toFixed(4)}
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                    <div class="billing-modal-footer">
                        <button class="btn btn-primary" id="topUpFromAccount">${i18n.t('billing.topUpAccount')}</button>
                        <button class="btn btn-secondary billing-modal-close">${i18n.t('billing.close')}</button>
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
            
            // Event listeners
            modal.querySelectorAll('.billing-modal-close').forEach(btn => {
                btn.addEventListener('click', () => {
                    document.body.removeChild(modal);
                });
            });
            
            modal.querySelector('#topUpFromAccount')?.addEventListener('click', () => {
                document.body.removeChild(modal);
                this.showTopUpModal();
            });
            
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    document.body.removeChild(modal);
                }
            });
            
        } catch (error) {
            console.error(i18n.t('billing.failedToShowAccountModal'), error);
        }
    }
}

// Auto-initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Wait a bit for authentication to be established
    setTimeout(() => {
        const authToken = localStorage.getItem('authToken');
        if (authToken) {
            BillingService.getInstance().initialize();
        }
    }, 1000);
});

// Export for use in other modules
export { BillingService, type AccountInfo, type Transaction, type BalanceCheck };