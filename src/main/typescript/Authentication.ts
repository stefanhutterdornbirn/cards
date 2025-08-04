// Authentication.ts - Handles login and registration functionality
import { i18n } from './i18n/TranslationService.js';

interface AuthResponse {
    token?: string;
    message?: string;
    error?: string;
}

interface RegistrationData {
    username: string;
    email: string;
    password: string;
    confirmPassword: string;
}

interface LoginData {
    username: string;
    password: string;
}

class AuthenticationManager {
    private fullscreenLoginMask: HTMLElement | null = null;
    private authenticatedContainer: HTMLElement | null = null;
    private loginFormContainer: HTMLElement | null = null;
    private registerFormContainer: HTMLElement | null = null;
    private fullscreenSubtitle: HTMLElement | null = null;
    private loginToggle: HTMLElement | null = null;
    private registerToggle: HTMLElement | null = null;
    private currentForm: 'login' | 'register' = 'login';

    constructor() {
        this.initializeElements();
        this.setupEventListeners();
        this.checkLoginStatus();
    }

    private initializeElements(): void {
        this.fullscreenLoginMask = document.getElementById('fullscreenLoginMask');
        this.authenticatedContainer = document.getElementById('authenticatedContainer');
        this.loginFormContainer = document.getElementById('loginFormContainer');
        this.registerFormContainer = document.getElementById('registerFormContainer');
        this.fullscreenSubtitle = document.getElementById('fullscreenSubtitle');
        this.loginToggle = document.getElementById('loginToggle');
        this.registerToggle = document.getElementById('registerToggle');
    }

    private setupEventListeners(): void {
        // Form toggle buttons
        this.loginToggle?.addEventListener('click', () => this.switchToLoginForm());
        this.registerToggle?.addEventListener('click', () => this.switchToRegisterForm());

        // Login form submission
        const loginForm = document.getElementById('fullscreenLoginForm');
        const loginSubmit = document.querySelector('#loginFormContainer .fullscreen-login-submit');
        
        loginForm?.addEventListener('submit', (e) => this.handleLogin(e));
        loginSubmit?.addEventListener('click', (e) => this.handleLogin(e));

        // Registration form submission
        const registerForm = document.getElementById('fullscreenRegisterForm');
        const registerSubmit = document.querySelector('#registerFormContainer .fullscreen-login-submit');
        
        registerForm?.addEventListener('submit', (e) => this.handleRegistration(e));
        registerSubmit?.addEventListener('click', (e) => this.handleRegistration(e));

        // Logout button
        const logoutButton = document.getElementById('loginButton');
        logoutButton?.addEventListener('click', () => this.handleLogout());
    }

    private switchToLoginForm(): void {
        this.currentForm = 'login';
        this.updateFormVisibility();
        this.updateToggleButtons();
        this.updateSubtitle();
        this.focusFirstInput();
    }

    private switchToRegisterForm(): void {
        this.currentForm = 'register';
        this.updateFormVisibility();
        this.updateToggleButtons();
        this.updateSubtitle();
        this.focusFirstInput();
    }

    private updateFormVisibility(): void {
        if (this.loginFormContainer && this.registerFormContainer) {
            if (this.currentForm === 'login') {
                this.loginFormContainer.style.display = 'block';
                this.registerFormContainer.style.display = 'none';
            } else {
                this.loginFormContainer.style.display = 'none';
                this.registerFormContainer.style.display = 'block';
            }
        }
    }

    private updateToggleButtons(): void {
        if (this.loginToggle && this.registerToggle) {
            if (this.currentForm === 'login') {
                this.loginToggle.classList.add('active');
                this.registerToggle.classList.remove('active');
            } else {
                this.loginToggle.classList.remove('active');
                this.registerToggle.classList.add('active');
            }
        }
    }

    private updateSubtitle(): void {
        if (this.fullscreenSubtitle) {
            if (this.currentForm === 'login') {
                this.fullscreenSubtitle.textContent = i18n.t('auth.welcomeBackLogin');
            } else {
                this.fullscreenSubtitle.textContent = i18n.t('auth.newUserWelcome');
            }
        }
    }

    private focusFirstInput(): void {
        setTimeout(() => {
            if (this.currentForm === 'login') {
                const usernameInput = document.getElementById('fullscreenUsername') as HTMLInputElement;
                usernameInput?.focus();
            } else {
                const registerUsernameInput = document.getElementById('registerUsername') as HTMLInputElement;
                registerUsernameInput?.focus();
            }
        }, 100);
    }

    private async handleLogin(event: Event): Promise<void> {
        event.preventDefault();

        const usernameInput = document.getElementById('fullscreenUsername') as HTMLInputElement;
        const passwordInput = document.getElementById('fullscreenPassword') as HTMLInputElement;
        const submitButton = document.querySelector('#loginFormContainer .fullscreen-login-submit') as HTMLButtonElement;

        if (!usernameInput || !passwordInput || !submitButton) {
            this.showNotification(i18n.t('auth.formElementsNotFound'), 'error');
            return;
        }

        const loginData: LoginData = {
            username: usernameInput.value.trim(),
            password: passwordInput.value
        };

        if (!loginData.username || !loginData.password) {
            this.showNotification(i18n.t('auth.pleaseEnterCredentials'), 'error');
            return;
        }

        // Show loading state
        submitButton.disabled = true;
        const originalContent = submitButton.innerHTML;
        submitButton.innerHTML = `<span class="fullscreen-login-submit-icon">⏳</span><span>${i18n.t('auth.loggingIn')}</span>`;

        try {
            const response = await fetch('/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(loginData)
            });

            const data: AuthResponse = await response.json();

            if (data.token) {
                localStorage.setItem('authToken', data.token);
                localStorage.setItem('username', loginData.username);
                this.updateAuthenticationState(loginData.username);
                this.showNotification(i18n.t('auth.loginSuccessful'), 'success');
                
                // Clear form
                usernameInput.value = '';
                passwordInput.value = '';
            } else {
                this.showNotification(i18n.t('auth.loginFailedCheckCredentials'), 'error');
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showNotification(i18n.t('auth.loginFailedTryLater'), 'error');
        } finally {
            // Reset button state
            submitButton.disabled = false;
            submitButton.innerHTML = originalContent;
        }
    }

    private async handleRegistration(event: Event): Promise<void> {
        event.preventDefault();

        const usernameInput = document.getElementById('registerUsername') as HTMLInputElement;
        const emailInput = document.getElementById('registerEmail') as HTMLInputElement;
        const passwordInput = document.getElementById('registerPassword') as HTMLInputElement;
        const confirmPasswordInput = document.getElementById('registerPasswordConfirm') as HTMLInputElement;
        const submitButton = document.querySelector('#registerFormContainer .fullscreen-login-submit') as HTMLButtonElement;

        if (!usernameInput || !emailInput || !passwordInput || !confirmPasswordInput || !submitButton) {
            this.showNotification(i18n.t('auth.formElementsNotFound'), 'error');
            return;
        }

        const registrationData: RegistrationData = {
            username: usernameInput.value.trim(),
            email: emailInput.value.trim(),
            password: passwordInput.value,
            confirmPassword: confirmPasswordInput.value
        };

        // Validation
        if (!registrationData.username || !registrationData.email || !registrationData.password || !registrationData.confirmPassword) {
            this.showNotification(i18n.t('auth.pleaseFillAllFields'), 'error');
            return;
        }

        if (registrationData.password !== registrationData.confirmPassword) {
            this.showNotification(i18n.t('auth.passwordsDoNotMatch'), 'error');
            return;
        }

        if (registrationData.password.length < 6) {
            this.showNotification(i18n.t('auth.passwordMinLength'), 'error');
            return;
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(registrationData.email)) {
            this.showNotification(i18n.t('auth.pleaseEnterValidEmail'), 'error');
            return;
        }

        // Show loading state
        submitButton.disabled = true;
        const originalContent = submitButton.innerHTML;
        submitButton.innerHTML = `<span class="fullscreen-login-submit-icon">⏳</span><span>${i18n.t('auth.registering')}</span>`;

        try {
            const response = await fetch('/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    username: registrationData.username,
                    email: registrationData.email,
                    password: registrationData.password
                })
            });

            let data: AuthResponse;
            const contentType = response.headers.get('content-type');
            
            if (contentType && contentType.includes('application/json')) {
                data = await response.json();
            } else {
                // Handle plain text response
                const textResponse = await response.text();
                data = { message: textResponse };
            }

            if (response.ok) {
                this.showNotification(i18n.t('auth.registrationSuccessful'), 'success');
                
                // Clear form
                usernameInput.value = '';
                emailInput.value = '';
                passwordInput.value = '';
                confirmPasswordInput.value = '';
                
                // Switch to login form
                this.switchToLoginForm();
                
                // Pre-fill username in login form
                const loginUsernameInput = document.getElementById('fullscreenUsername') as HTMLInputElement;
                if (loginUsernameInput) {
                    loginUsernameInput.value = registrationData.username;
                }
            } else {
                // Handle different types of registration errors
                let errorMessage = i18n.t('auth.registrationFailedPleaseRetry');
                
                if (data.message) {
                    const message = data.message.toLowerCase();
                    
                    if (message.includes('already exists') || message.includes('bereits vorhanden') || 
                        message.includes('user already') || message.includes('duplicate') ||
                        message.includes('schon registriert')) {
                        errorMessage = i18n.t('auth.userAlreadyExists');
                        
                        // Offer to switch to login
                        this.showDuplicateUserDialog(registrationData.username);
                        return;
                    } else if (message.includes('invalid email') || message.includes('ungültige e-mail')) {
                        errorMessage = i18n.t('auth.pleaseEnterValidEmailAddress');
                    } else if (message.includes('password') && (message.includes('weak') || message.includes('short'))) {
                        errorMessage = i18n.t('auth.passwordTooWeak');
                    } else if (message.includes('username') && (message.includes('invalid') || message.includes('ungültig'))) {
                        errorMessage = i18n.t('auth.usernameInvalid');
                    } else {
                        // Use the server message if it's user-friendly
                        errorMessage = data.message;
                    }
                }
                
                this.showNotification(errorMessage, 'error');
            }
        } catch (error) {
            console.error('Registration error:', error);
            this.showNotification(i18n.t('auth.registrationFailedTryLater'), 'error');
        } finally {
            // Reset button state
            submitButton.disabled = false;
            submitButton.innerHTML = originalContent;
        }
    }

    private handleLogout(): void {
        localStorage.removeItem('authToken');
        localStorage.removeItem('username');
        this.updateAuthenticationState(null);
        this.showNotification(i18n.t('auth.loggedOutSuccessfully'), 'success');
    }

    private checkLoginStatus(): void {
        const token = localStorage.getItem('authToken');
        const username = localStorage.getItem('username');
        
        if (token && username) {
            this.updateAuthenticationState(username);
        } else {
            this.updateAuthenticationState(null);
        }
    }

    private updateAuthenticationState(username: string | null): void {
        if (username) {
            // User is authenticated - show main app
            this.fullscreenLoginMask?.classList.add('hide');
            this.authenticatedContainer?.classList.add('show');
            
            // Update status display
            const loginStatus = document.getElementById('loginStatus');
            const loginIcon = document.getElementById('loginIcon');
            const loginBtnText = document.querySelector('.login-btn-text');
            const loginBtnIcon = document.querySelector('.login-btn-icon');
            const loginButton = document.getElementById('loginButton');
            
            if (loginStatus) loginStatus.textContent = `${i18n.t('auth.loggedInAs')}: ${username}`;
            if (loginIcon) loginIcon.textContent = '✅';
            if (loginBtnText) loginBtnText.textContent = i18n.t('auth.logout');
            if (loginBtnIcon) loginBtnIcon.textContent = '🚪';
            if (loginButton) loginButton.classList.add('logout');
            
            // Check user permissions and show/hide management menu
            this.checkUserPermissions();
            
            // Show home page by default
            this.showHomePage();
        } else {
            // User is not authenticated - show fullscreen login
            this.fullscreenLoginMask?.classList.remove('hide');
            this.authenticatedContainer?.classList.remove('show');
            
            // Hide all management menus
            this.hideAllManagementMenus();
            
            // Reset to login form
            this.switchToLoginForm();
        }
    }

    private async checkUserPermissions(): Promise<void> {
        try {
            const token = localStorage.getItem('authToken');
            if (!token) {
                this.hideAllManagementMenus();
                this.hideAllProductMenus();
                return;
            }

            const [userResponse, productsResponse] = await Promise.all([
                fetch('/me', {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }),
                fetch('/me/products', {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                })
            ]);

            if (userResponse.ok && productsResponse.ok) {
                const userData = await userResponse.json();
                const userProducts = await productsResponse.json();
                
                this.updateManagementMenuVisibility(userData);
                this.updateProductMenuVisibility(userProducts);
            } else {
                this.hideAllManagementMenus();
                this.hideAllProductMenus();
            }
        } catch (error) {
            console.error('Error checking user permissions:', error);
            this.hideAllManagementMenus();
            this.hideAllProductMenus();
        }
    }

    private updateManagementMenuVisibility(userData: any): void {
        const permissions = userData.permissions || [];
        
        // Check if user has system admin permission (grants all management rights)
        const hasSystemAdmin = permissions.includes('system.admin');
        
        // Check individual permissions or system admin
        const hasUserManage = permissions.includes('user.manage') || hasSystemAdmin;
        const hasGroupManage = permissions.includes('group.manage') || hasSystemAdmin;
        const hasRoleManage = permissions.includes('role.manage') || hasSystemAdmin;
        const hasProductManage = permissions.includes('product.manage') || hasSystemAdmin;
        
        // Show/hide individual menu items
        this.toggleMenuVisibility('userManagementLink', hasUserManage);
        this.toggleMenuVisibility('groupManagementLink', hasGroupManage);
        this.toggleMenuVisibility('roleManagementLink', hasRoleManage);
        this.toggleMenuVisibility('productManagementLink', hasProductManage);
        
        // Technical Info is only visible to system.admin
        this.toggleMenuVisibility('techInfoLink', hasSystemAdmin);
        
        // Storage Migration is only visible to system.admin
        this.toggleMenuVisibility('storageMigrationLink', hasSystemAdmin);
        
        // Show management menu if user has any management permission
        const hasAnyManagementPermission = hasUserManage || hasGroupManage || hasRoleManage || hasProductManage || hasSystemAdmin;
        this.toggleMenuVisibility('managementMenu', hasAnyManagementPermission);
    }

    private toggleMenuVisibility(elementId: string, isVisible: boolean): void {
        const element = document.getElementById(elementId);
        if (element) {
            element.style.display = isVisible ? 'block' : 'none';
        }
    }

    private hasSystemAdminPermission(userData: any): boolean {
        // Check if user has system.admin permission directly from the permissions array
        if (userData.permissions && Array.isArray(userData.permissions)) {
            return userData.permissions.includes('system.admin');
        }
        return false;
    }

    private hideAllManagementMenus(): void {
        this.toggleMenuVisibility('userManagementLink', false);
        this.toggleMenuVisibility('groupManagementLink', false);
        this.toggleMenuVisibility('roleManagementLink', false);
        this.toggleMenuVisibility('productManagementLink', false);
        this.toggleMenuVisibility('techInfoLink', false);
        this.toggleMenuVisibility('storageMigrationLink', false);
        this.toggleMenuVisibility('managementMenu', false);
    }

    private updateProductMenuVisibility(userProducts: any[]): void {
        const productNames = userProducts.map(product => product.name);
        
        // Show/hide menu items based on user's available products
        this.toggleMenuVisibility('cardsMenu', productNames.includes('Lernkarten'));
        this.toggleMenuVisibility('imageLink', productNames.includes('Bilderverwaltung'));
        this.toggleMenuVisibility('buchungskartenMenu', productNames.includes('Buchungskarten'));
        this.toggleMenuVisibility('materialMenu', productNames.includes('Lernmaterial'));
        this.toggleMenuVisibility('dmsLink', productNames.includes('Card DMS'));
        
        // Log for debugging
        console.log('User products:', productNames);
    }

    private hideAllProductMenus(): void {
        this.toggleMenuVisibility('cardsMenu', false);
        this.toggleMenuVisibility('imageLink', false);
        this.toggleMenuVisibility('buchungskartenMenu', false);
        this.toggleMenuVisibility('materialMenu', false);
        this.toggleMenuVisibility('dmsLink', false);
    }

    // Public method to refresh product menu visibility
    public async refreshProductMenuVisibility(): Promise<void> {
        try {
            const token = localStorage.getItem('authToken');
            if (!token) {
                this.hideAllProductMenus();
                return;
            }

            const response = await fetch('/me/products', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const userProducts = await response.json();
                this.updateProductMenuVisibility(userProducts);
            } else {
                this.hideAllProductMenus();
            }
        } catch (error) {
            console.error('Error refreshing product menu visibility:', error);
            this.hideAllProductMenus();
        }
    }

    // Public method to show home page
    public showHomePage(): void {
        const homeLink = document.getElementById('homeLink');
        if (homeLink) {
            homeLink.click();
        }
    }

    private showDuplicateUserDialog(username: string): void {
        // Remove existing dialog if any
        const existingDialog = document.querySelector('.duplicate-user-dialog');
        if (existingDialog) {
            existingDialog.remove();
        }

        const dialog = document.createElement('div');
        dialog.className = 'duplicate-user-dialog';
        dialog.innerHTML = `
            <div class="duplicate-user-dialog-content">
                <div class="duplicate-user-dialog-header">
                    <h3>👤 ${i18n.t('auth.userAlreadyExistsTitle')}</h3>
                </div>
                <div class="duplicate-user-dialog-body">
                    <p>${i18n.t('auth.userAlreadyExistsMessage')}</p>
                    <p>${i18n.t('auth.wouldYouLikeToLogin')}</p>
                </div>
                <div class="duplicate-user-dialog-actions">
                    <button class="duplicate-user-dialog-btn primary" id="switchToLoginBtn">
                        🔐 ${i18n.t('auth.goToLogin')}
                    </button>
                    <button class="duplicate-user-dialog-btn secondary" id="stayOnRegisterBtn">
                        📝 ${i18n.t('auth.enterDifferentData')}
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(dialog);

        // Event listeners
        const switchToLoginBtn = dialog.querySelector('#switchToLoginBtn');
        const stayOnRegisterBtn = dialog.querySelector('#stayOnRegisterBtn');

        switchToLoginBtn?.addEventListener('click', () => {
            this.switchToLoginForm();
            
            // Pre-fill username in login form
            const loginUsernameInput = document.getElementById('fullscreenUsername') as HTMLInputElement;
            if (loginUsernameInput) {
                loginUsernameInput.value = username;
                // Focus on password field
                setTimeout(() => {
                    const passwordInput = document.getElementById('fullscreenPassword') as HTMLInputElement;
                    passwordInput?.focus();
                }, 100);
            }
            
            dialog.remove();
        });

        stayOnRegisterBtn?.addEventListener('click', () => {
            // Clear username and email fields for retry
            const usernameInput = document.getElementById('registerUsername') as HTMLInputElement;
            const emailInput = document.getElementById('registerEmail') as HTMLInputElement;
            
            if (usernameInput) {
                usernameInput.value = '';
                usernameInput.focus();
            }
            if (emailInput) {
                emailInput.value = '';
            }
            
            dialog.remove();
        });

        // Close dialog when clicking outside
        dialog.addEventListener('click', (event) => {
            if (event.target === dialog) {
                dialog.remove();
            }
        });

        // Auto-remove after 10 seconds
        setTimeout(() => {
            if (dialog.parentNode) {
                dialog.remove();
            }
        }, 10000);
    }

    private showNotification(message: string, type: 'success' | 'error' | 'info' = 'info'): void {
        // Remove existing notification if any
        const existingNotification = document.querySelector('.notification');
        if (existingNotification) {
            existingNotification.remove();
        }

        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-icon">${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}</span>
                <span>${message}</span>
            </div>
        `;

        document.body.appendChild(notification);

        // Auto-remove after 4 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.opacity = '0';
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.remove();
                    }
                }, 300);
            }
        }, 4000);
    }
}

// Global instance for access from other modules
declare global {
    interface Window {
        authenticationSystem: AuthenticationManager;
    }
}

// Initialize authentication manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.authenticationSystem = new AuthenticationManager();
    
    // Setup DMS link handler
    const dmsLink = document.getElementById('dmsLink');
    dmsLink?.addEventListener('click', (e) => {
        e.preventDefault();
        console.log('DMS link clicked!'); // Debug log
        // Navigate directly to DMS interface
        window.location.href = '/static/dms/html/dms.html';
    });
});

// Export to make this file a module (required for global augmentations)
export {};