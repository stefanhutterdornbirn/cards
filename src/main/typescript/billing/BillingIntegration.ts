// BillingIntegration.ts - Helper functions for integrating billing checks into existing frontend code

import { BillingService } from './BillingService.js';

/**
 * Billing integration helper for existing frontend modules
 */
export class BillingIntegration {
    private static billingService = BillingService.getInstance();
    
    /**
     * Check if user can afford an operation before proceeding
     * Shows low balance warning if insufficient funds
     */
    static async checkBeforeOperation(operation: string, additionalCost: number = 0): Promise<boolean> {
        try {
            const balanceCheck = await this.billingService.checkBalance(operation, additionalCost);
            
            if (!balanceCheck.canAfford) {
                this.billingService.showLowBalanceWarning(
                    balanceCheck.currentBalance, 
                    balanceCheck.requiredAmount
                );
                return false;
            }
            
            return true;
        } catch (error) {
            console.error('Error checking balance:', error);
            return true; // Don't block on error, but log it
        }
    }
    
    /**
     * Wrap an async operation with billing check
     */
    static async withBillingCheck<T>(
        operation: string, 
        asyncFn: () => Promise<T>, 
        additionalCost: number = 0
    ): Promise<T | null> {
        const canProceed = await this.checkBeforeOperation(operation, additionalCost);
        if (!canProceed) {
            return null;
        }
        
        try {
            const result = await asyncFn();
            // Refresh balance display after successful operation
            this.billingService.refreshBalanceDisplay();
            return result;
        } catch (error) {
            // If it's a billing error, show appropriate message
            if (error instanceof Error && error.message.includes('Insufficient CardCoin balance')) {
                const balance = await this.billingService.getBalance();
                this.billingService.showLowBalanceWarning(balance, 0.1); // Estimated cost
            }
            throw error;
        }
    }
    
    /**
     * Show billing info tooltip on hover for operation buttons
     */
    static addBillingTooltip(element: HTMLElement, operation: string, additionalCost: number = 0): void {
        const costs: { [key: string]: number } = {
            'DOCUMENT_CREATE': 0.1,
            'DOSSIER_CREATE': 0.2,
            'LEARNINGCARD_CREATE': 0.1,
            'UPLOAD_100KB': 0.1,
            'SEARCH': 0.01,
            'API_CALL': 0.01
        };
        
        const cost = (costs[operation] || 0) + additionalCost;
        const tooltip = document.createElement('div');
        tooltip.className = 'billing-tooltip';
        tooltip.textContent = `Kosten: ${cost.toFixed(4)} CardCoins`;
        
        element.addEventListener('mouseenter', () => {
            document.body.appendChild(tooltip);
            const rect = element.getBoundingClientRect();
            tooltip.style.left = `${rect.left + rect.width / 2}px`;
            tooltip.style.top = `${rect.top - 30}px`;
        });
        
        element.addEventListener('mouseleave', () => {
            if (document.body.contains(tooltip)) {
                document.body.removeChild(tooltip);
            }
        });
    }
    
    /**
     * Add billing indicator to buttons (shows cost)
     */
    static addCostIndicator(button: HTMLElement, operation: string, additionalCost: number = 0): void {
        const costs: { [key: string]: number } = {
            'DOCUMENT_CREATE': 0.1,
            'DOSSIER_CREATE': 0.2,
            'LEARNINGCARD_CREATE': 0.1,
            'UPLOAD_100KB': 0.1,
            'SEARCH': 0.01,
            'API_CALL': 0.01
        };
        
        const cost = (costs[operation] || 0) + additionalCost;
        const indicator = document.createElement('span');
        indicator.className = 'cost-indicator';
        indicator.textContent = `${cost.toFixed(cost < 0.1 ? 3 : 2)}🪙`;
        
        button.appendChild(indicator);
    }
    
    /**
     * Pre-check multiple operations (e.g., for bulk actions)
     */
    static async checkBulkOperations(operations: Array<{type: string, cost?: number}>): Promise<boolean> {
        try {
            let totalCost = 0;
            operations.forEach(op => {
                const costs: { [key: string]: number } = {
                    'DOCUMENT_CREATE': 0.1,
                    'DOSSIER_CREATE': 0.2,
                    'LEARNINGCARD_CREATE': 0.1,
                    'UPLOAD_100KB': 0.1,
                    'SEARCH': 0.01,
                    'API_CALL': 0.01
                };
                totalCost += (costs[op.type] || 0) + (op.cost || 0);
            });
            
            const balance = await this.billingService.getBalance();
            if (balance < totalCost) {
                this.billingService.showLowBalanceWarning(balance, totalCost);
                return false;
            }
            
            return true;
        } catch (error) {
            console.error('Error checking bulk operations:', error);
            return true;
        }
    }
}

// Add global CSS for billing tooltips and indicators
const billingIntegrationCSS = `
    .billing-tooltip {
        position: absolute;
        background: #333;
        color: white;
        padding: 5px 8px;
        border-radius: 4px;
        font-size: 12px;
        z-index: 10000;
        transform: translateX(-50%);
        white-space: nowrap;
        pointer-events: none;
    }
    
    .billing-tooltip::after {
        content: '';
        position: absolute;
        top: 100%;
        left: 50%;
        margin-left: -5px;
        border: 5px solid transparent;
        border-top-color: #333;
    }
    
    .cost-indicator {
        font-size: 11px;
        margin-left: 5px;
        opacity: 0.8;
        background: rgba(255, 255, 255, 0.2);
        padding: 2px 4px;
        border-radius: 8px;
    }
`;

// Add CSS to document head
const styleSheet = document.createElement('style');
styleSheet.textContent = billingIntegrationCSS;
document.head.appendChild(styleSheet);