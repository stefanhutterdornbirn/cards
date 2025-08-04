/**
 * Leert alle Inhaltscontainer auf der Seite.
 * Entfernt den Inhalt aus den topicContent, imageContent und cardsContent Elementen.
 */

import { LegalPages } from './LegalPages.js';
import { i18nInitializer } from './i18n/I18nInitializer.js';
import { i18n } from './i18n/TranslationService.js';

    // Globale Verwaltung der Pages

let currentPage: string = "none";

export function getCurrentPage(): string {
    return currentPage;
}
export function clearContentScreen(callingpage: string): void {
    currentPage = callingpage;
    const homeContent = document.getElementById('homeContent');
    if (homeContent) {
        homeContent.innerHTML = '';
    }

    const topicContent = document.getElementById('topicContent');
    if (topicContent) {
        topicContent.innerHTML = '';
    }

    const imageContent = document.getElementById('imageContent');
    if (imageContent) {
        imageContent.innerHTML = '';
    }

    const cardsContent = document.getElementById('cardsContent');
    if (cardsContent) {
        cardsContent.innerHTML = '';
    }

    const newcardsContent = document.getElementById('newcardContent');
    if (newcardsContent) {
        newcardsContent.innerHTML = '';
    }

    const materialContent = document.getElementById('materialContent');
    if (materialContent) {
        materialContent.innerHTML = '';
    }

const learnContent = document.getElementById('learnContent');
    if (learnContent) {
        learnContent.innerHTML = '';
    }

    const buchungskartenContent = document.getElementById('buchungskartenContent');
    if (buchungskartenContent) {
        buchungskartenContent.innerHTML = '';
    }

    const userManagementContent = document.getElementById('userManagementContent');
    if (userManagementContent) {
        userManagementContent.innerHTML = '';
    }

    const groupManagementContent = document.getElementById('groupManagementContent');
    if (groupManagementContent) {
        groupManagementContent.innerHTML = '';
    }

    const roleManagementContent = document.getElementById('roleManagementContent');
    if (roleManagementContent) {
        roleManagementContent.innerHTML = '';
    }

    const productManagementContent = document.getElementById('productManagementContent');
    if (productManagementContent) {
        productManagementContent.innerHTML = '';
    }

    const examManagementContent = document.getElementById('examManagementContent');
    if (examManagementContent) {
        examManagementContent.innerHTML = '';
    }

    const assessmentContent = document.getElementById('assessmentContent');
    if (assessmentContent) {
        assessmentContent.innerHTML = '';
    }

    const testContent = document.getElementById('testContent');
    if (testContent) {
        testContent.innerHTML = '';
    }

    const technicalInfoContent = document.getElementById('technicalInfoContent');
    if (technicalInfoContent) {
        technicalInfoContent.innerHTML = '';
    }

}

// Utility Functions for the entire application

/**
 * Makes an authenticated HTTP request with automatic token handling
 */
export async function makeAuthenticatedRequest(url: string, options: RequestInit = {}): Promise<Response> {
    const authToken = localStorage.getItem('authToken');
    
    if (!authToken) {
        throw new Error('No authentication token found');
    }
    
    const defaultHeaders = {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
    };
    
    const mergedOptions: RequestInit = {
        ...options,
        headers: {
            ...defaultHeaders,
            ...options.headers
        }
    };
    
    return fetch(url, mergedOptions);
}

/**
 * Shows a notification message to the user
 */
export function showNotification(message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info', duration: number = 3000): void {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.notification-toast');
    existingNotifications.forEach(notification => notification.remove());
    
    const notification = document.createElement('div');
    notification.className = `notification-toast notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-icon">${getNotificationIcon(type)}</span>
            <span class="notification-message">${message}</span>
            <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
        </div>
    `;
    
    // Add styles if not already present
    if (!document.querySelector('#notification-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            .notification-toast {
                position: fixed;
                top: 20px;
                right: 20px;
                min-width: 300px;
                max-width: 500px;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                z-index: 10000;
                animation: slideIn 0.3s ease-out;
            }
            
            @keyframes slideIn {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
            
            .notification-content {
                display: flex;
                align-items: center;
                padding: 15px;
                gap: 10px;
                color: white;
            }
            
            .notification-success {
                background-color: #28a745;
                border-left: 4px solid #155724;
            }
            
            .notification-error {
                background-color: #dc3545;
                border-left: 4px solid #721c24;
            }
            
            .notification-warning {
                background-color: #ffc107;
                border-left: 4px solid #856404;
                color: #212529;
            }
            
            .notification-info {
                background-color: #17a2b8;
                border-left: 4px solid #0c5460;
            }
            
            .notification-icon {
                font-size: 18px;
                font-weight: bold;
            }
            
            .notification-message {
                flex: 1;
                font-size: 14px;
            }
            
            .notification-close {
                background: none;
                border: none;
                color: inherit;
                cursor: pointer;
                font-size: 20px;
                font-weight: bold;
                padding: 0;
                margin-left: 10px;
                opacity: 0.7;
            }
            
            .notification-close:hover {
                opacity: 1;
            }
        `;
        document.head.appendChild(style);
    }
    
    document.body.appendChild(notification);
    
    // Auto-remove after duration
    setTimeout(() => {
        if (notification.parentElement) {
            notification.style.animation = 'slideOut 0.3s ease-in forwards';
            setTimeout(() => notification.remove(), 300);
        }
    }, duration);
}

function getNotificationIcon(type: string): string {
    switch (type) {
        case 'success': return '✅';
        case 'error': return '❌';
        case 'warning': return '⚠️';
        case 'info': return 'ℹ️';
        default: return 'ℹ️';
    }
}

/**
 * Formats a date string to German locale
 */
export function formatDateGerman(dateString: string): string {
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('de-DE', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    } catch (error) {
        return 'Ungültiges Datum';
    }
}

/**
 * Formats a date and time string to German locale
 */
export function formatDateTimeGerman(dateString: string): string {
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('de-DE', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (error) {
        return 'Ungültiges Datum';
    }
}

/**
 * Formats time duration in seconds to readable format
 */
export function formatDuration(seconds: number): string {
    if (seconds < 60) {
        return `${Math.floor(seconds)}s`;
    } else if (seconds < 3600) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes}m ${remainingSeconds}s`;
    } else {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        return `${hours}h ${minutes}m`;
    }
}

/**
 * Validates email format
 */
export function isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Validates password strength
 */
export function validatePassword(password: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (password.length < 8) {
        errors.push('Passwort muss mindestens 8 Zeichen lang sein');
    }
    
    if (!/[A-Z]/.test(password)) {
        errors.push('Passwort muss mindestens einen Großbuchstaben enthalten');
    }
    
    if (!/[a-z]/.test(password)) {
        errors.push('Passwort muss mindestens einen Kleinbuchstaben enthalten');
    }
    
    if (!/[0-9]/.test(password)) {
        errors.push('Passwort muss mindestens eine Zahl enthalten');
    }
    
    return {
        isValid: errors.length === 0,
        errors
    };
}

/**
 * Debounces a function call
 */
export function debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void {
    let timeout: number;
    return function executedFunction(...args: Parameters<T>) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = window.setTimeout(later, wait);
    };
}

/**
 * Capitalizes the first letter of a string
 */
export function capitalizeFirst(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Truncates text to a specified length
 */
export function truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) {
        return text;
    }
    return text.slice(0, maxLength) + '...';
}

/**
 * Generates a random ID
 */
export function generateId(): string {
    return Math.random().toString(36).substring(2, 9);
}

/**
 * Converts file size in bytes to human readable format
 */
export function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Checks if user has specific permission
 */
export async function hasPermission(permission: string): Promise<boolean> {
    try {
        const response = await makeAuthenticatedRequest('/me');
        if (response.ok) {
            const userData = await response.json();
            return userData.permissions && userData.permissions.includes(permission);
        }
        return false;
    } catch (error) {
        console.error('Error checking permission:', error);
        return false;
    }
}

/**
 * Gets current user information
 */
export async function getCurrentUser(): Promise<any> {
    try {
        const response = await makeAuthenticatedRequest('/me');
        if (response.ok) {
            return await response.json();
        }
        return null;
    } catch (error) {
        console.error('Error getting current user:', error);
        return null;
    }
}

/**
 * Escapes HTML to prevent XSS
 */
export function escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Creates a loading spinner element
 */
export function createLoadingSpinner(size: 'small' | 'medium' | 'large' = 'medium'): HTMLElement {
    const spinner = document.createElement('div');
    spinner.className = `loading-spinner loading-spinner-${size}`;
    spinner.innerHTML = `
        <div class="spinner-border" role="status">
            <span class="sr-only">Laden...</span>
        </div>
    `;
    
    // Add spinner styles if not already present
    if (!document.querySelector('#spinner-styles')) {
        const style = document.createElement('style');
        style.id = 'spinner-styles';
        style.textContent = `
            .loading-spinner {
                display: flex;
                justify-content: center;
                align-items: center;
                padding: 20px;
            }
            
            .spinner-border {
                display: inline-block;
                border: 2px solid rgba(0, 0, 0, 0.1);
                border-left-color: #007bff;
                border-radius: 50%;
                animation: spin 1s linear infinite;
            }
            
            .loading-spinner-small .spinner-border {
                width: 1rem;
                height: 1rem;
            }
            
            .loading-spinner-medium .spinner-border {
                width: 2rem;
                height: 2rem;
            }
            
            .loading-spinner-large .spinner-border {
                width: 3rem;
                height: 3rem;
            }
            
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
            
            .sr-only {
                position: absolute;
                width: 1px;
                height: 1px;
                padding: 0;
                margin: -1px;
                overflow: hidden;
                clip: rect(0, 0, 0, 0);
                white-space: nowrap;
                border: 0;
            }
        `;
        document.head.appendChild(style);
    }
    
    return spinner;
}

/**
 * Shows a confirmation dialog
 */
export function showConfirmDialog(message: string, title: string = 'Bestätigung'): Promise<boolean> {
    return new Promise((resolve) => {
        const overlay = document.createElement('div');
        overlay.className = 'confirm-dialog-overlay';
        overlay.innerHTML = `
            <div class="confirm-dialog">
                <div class="confirm-dialog-header">
                    <h3>${escapeHtml(title)}</h3>
                </div>
                <div class="confirm-dialog-body">
                    <p>${escapeHtml(message)}</p>
                </div>
                <div class="confirm-dialog-footer">
                    <button class="btn btn-secondary" data-action="cancel">Abbrechen</button>
                    <button class="btn btn-primary" data-action="confirm">Bestätigen</button>
                </div>
            </div>
        `;
        
        // Add dialog styles if not already present
        if (!document.querySelector('#confirm-dialog-styles')) {
            const style = document.createElement('style');
            style.id = 'confirm-dialog-styles';
            style.textContent = `
                .confirm-dialog-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background-color: rgba(0, 0, 0, 0.5);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    z-index: 10001;
                }
                
                .confirm-dialog {
                    background: white;
                    border-radius: 8px;
                    max-width: 500px;
                    width: 90%;
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
                }
                
                .confirm-dialog-header {
                    padding: 20px 20px 0;
                    border-bottom: 1px solid #dee2e6;
                }
                
                .confirm-dialog-header h3 {
                    margin: 0 0 15px 0;
                    color: #495057;
                }
                
                .confirm-dialog-body {
                    padding: 20px;
                }
                
                .confirm-dialog-body p {
                    margin: 0;
                    color: #6c757d;
                    line-height: 1.5;
                }
                
                .confirm-dialog-footer {
                    padding: 0 20px 20px;
                    display: flex;
                    justify-content: flex-end;
                    gap: 10px;
                }
                
                .btn {
                    padding: 8px 16px;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 14px;
                    font-weight: 500;
                    transition: background-color 0.2s;
                }
                
                .btn-secondary {
                    background-color: #6c757d;
                    color: white;
                }
                
                .btn-secondary:hover {
                    background-color: #5a6268;
                }
                
                .btn-primary {
                    background-color: #007bff;
                    color: white;
                }
                
                .btn-primary:hover {
                    background-color: #0056b3;
                }
            `;
            document.head.appendChild(style);
        }
        
        overlay.addEventListener('click', (e) => {
            const target = e.target as HTMLElement;
            if (target.dataset.action === 'cancel' || target === overlay) {
                overlay.remove();
                resolve(false);
            } else if (target.dataset.action === 'confirm') {
                overlay.remove();
                resolve(true);
            }
        });
        
        document.body.appendChild(overlay);
    });
}

/**
 * Logs application events for debugging
 */
export function logEvent(event: string, data?: any): void {
    console.log(`[${new Date().toISOString()}] ${event}`, data);
}

/**
 * Handles API errors consistently
 */
export function handleApiError(error: any, defaultMessage: string = ''): void {
    if (!defaultMessage) defaultMessage = i18n.t('common.error');
    console.error('API Error:', error);
    
    let message = defaultMessage;
    
    if (error.response) {
        // Server responded with error status
        message = error.response.data?.message || error.response.statusText || defaultMessage;
    } else if (error.message) {
        // Network error or other client error
        message = error.message;
    }
    
    showNotification(message, 'error');
}

/**
 * Global error handler
 */
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    showNotification(i18n.t('common.unexpectedError'), 'error');
});

/**
 * Global promise rejection handler
 */
window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    showNotification(i18n.t('common.unexpectedError'), 'error');
});

/**
 * Get translated product name by database ID
 */
export function getProductName(productId: number): string {
    return i18n.t(`products.${productId}.name`);
}

/**
 * Get translated product description by database ID
 */
export function getProductDescription(productId: number): string {
    return i18n.t(`products.${productId}.description`);
}

/**
 * Get both translated product name and description
 */
export function getProductTranslations(productId: number): { name: string; description: string } {
    return {
        name: getProductName(productId),
        description: getProductDescription(productId)
    };
}

/**
 * Initialize application when DOM is loaded
 */
document.addEventListener('DOMContentLoaded', () => {
    // Initialize internationalization system
    i18nInitializer.initialize();
    
    // Initialize legal pages
    new LegalPages();
});

