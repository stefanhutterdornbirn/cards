/**
 * I18n Initializer - Sets up internationalization system
 */

import { i18n, Language } from './TranslationService.js';
import { LanguageSwitcher } from '../components/LanguageSwitcher.js';

export class I18nInitializer {
    private headerLanguageSwitcher: LanguageSwitcher | null = null;
    private loginLanguageSwitcher: LanguageSwitcher | null = null;

    /**
     * Initialize the internationalization system
     */
    public initialize(): void {
        this.initializeLanguageSwitchers();
        this.updateStaticContent();
        this.subscribeToLanguageChanges();
    }

    /**
     * Initialize the language switcher components
     */
    private initializeLanguageSwitchers(): void {
        // Header language switcher (authenticated page)
        try {
            this.headerLanguageSwitcher = new LanguageSwitcher('languageSwitcher');
        } catch (error) {
            console.warn('Header language switcher container not found:', error);
        }

        // Login page language switcher
        try {
            this.loginLanguageSwitcher = new LanguageSwitcher('loginLanguageSwitcher');
        } catch (error) {
            console.warn('Login language switcher container not found:', error);
        }
    }

    /**
     * Update static content based on current language
     */
    private updateStaticContent(): void {
        this.updateNavigationTexts();
        this.updateFooterTexts();
        this.updateCommonTexts();
    }

    /**
     * Update navigation menu texts
     */
    private updateNavigationTexts(): void {
        // Update navigation section titles
        const sectionTitles = document.querySelectorAll('.sidebar-section-title');
        sectionTitles.forEach(element => {
            if (element.textContent === 'Navigation') {
                element.textContent = i18n.t('nav.navigation');
            } else if (element.textContent === 'Produkte') {
                element.textContent = i18n.t('nav.products');
            } else if (element.textContent === 'Aktionen') {
                element.textContent = i18n.t('nav.actions');
            }
        });

        // Update main navigation links with full text including emojis
        const mainNavLinks = [
            { id: 'materialMainLink', text: '📚 ' + i18n.t('nav.materials') },
            { id: 'cardsMainLink', text: '🃏 ' + i18n.t('nav.cards') },
            { id: 'buchungskartenMainLink', text: '💳 ' + i18n.t('nav.billing') }
        ];
        
        mainNavLinks.forEach(({ id, text }) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = text;
            }
        });
        
        // Update contact link
        const contactLinks = document.querySelectorAll('a[href="#"]:not([id])');
        contactLinks.forEach(element => {
            if (element.textContent && element.textContent.includes('Kontakt')) {
                element.textContent = '📞 ' + i18n.t('nav.contact');
            }
        });

        // Update individual navigation items
        const navElements = [
            { id: 'homeLink', key: 'nav.home', iconPrefix: '🏠 ' },
            { id: 'topicLink', key: 'nav.topics', iconPrefix: '' },
            { id: 'cardsLink', key: 'nav.cardsOverview', iconPrefix: '' },
            { id: 'newcardsLink', key: 'nav.newCard', iconPrefix: '' },
            { id: 'materialLink', key: 'nav.documents', iconPrefix: '' },
            { id: 'lernenCardsLink', key: 'nav.learn', iconPrefix: '' },
            { id: 'manageCardsLink', key: 'nav.edit', iconPrefix: '' },
            { id: 'examManagementLink', key: 'nav.questionnaires', iconPrefix: '' },
            { id: 'pruefenCardsLink', key: 'nav.defineExams', iconPrefix: '' },
            { id: 'testCardsLink', key: 'nav.takeExams', iconPrefix: '' },
            { id: 'imageLink', key: 'nav.images', iconPrefix: '🖼️ ' },
            { id: 'buchungskartenUebersichtLink', key: 'nav.overview', iconPrefix: '' },
            { id: 'buchungskartenNeuLink', key: 'nav.new', iconPrefix: '' },
            { id: 'buchungskartenAuswertungenLink', key: 'nav.reports', iconPrefix: '' },
            { id: 'dmsLink', key: 'nav.dms', iconPrefix: '📁 ' },
            { id: 'managementMainLink', key: 'nav.management', iconPrefix: '⚙️ ' },
            { id: 'userManagementLink', key: 'nav.users', iconPrefix: '' },
            { id: 'groupManagementLink', key: 'nav.groups', iconPrefix: '' },
            { id: 'roleManagementLink', key: 'nav.roles', iconPrefix: '' },
            { id: 'productManagementLink', key: 'nav.products_mgmt', iconPrefix: '' },
            { id: 'techInfoLink', key: 'nav.technicalInfo', iconPrefix: '' }
        ];

        navElements.forEach(({ id, key, iconPrefix }) => {
            const element = document.getElementById(id);            
            if (element) {
                element.textContent = iconPrefix + i18n.t(key);
            }
        });

        // Update logout button text
        const logoutButton = document.querySelector('#loginButton .login-btn-text');
        if (logoutButton) {
            logoutButton.textContent = i18n.t('nav.logout');
        }

        // Update main header titles
        const appTitle = document.querySelector('.app-title');
        if (appTitle) {
            const lang = i18n.getCurrentLanguage();
            const titles = {
                de: '🃏 Lernkarten Management System',
                en: '🃏 Learning Cards Management System',
                fr: '🃏 Système de Gestion des Cartes d\'Apprentissage',
                nl: '🃏 Leerkaarten Beheersysteem'
            };
            appTitle.textContent = titles[lang] || titles.de;
        }

        const appSubtitle = document.querySelector('.app-subtitle');
        if (appSubtitle) {
            const lang = i18n.getCurrentLanguage();
            const subtitles = {
                de: 'Dashboard & Verwaltung',
                en: 'Dashboard & Management',
                fr: 'Tableau de Bord & Gestion',
                nl: 'Dashboard & Beheer'
            };
            appSubtitle.textContent = subtitles[lang] || subtitles.de;
        }
    }

    /**
     * Update footer texts
     */
    private updateFooterTexts(): void {
        // Footer section headers
        const footerHeaders = document.querySelectorAll('.footer-section h4');
        if (footerHeaders.length >= 3) {
            footerHeaders[1].textContent = `📋 ${i18n.t('footer.legal')}`;
            // Skip third footer section for DMS pages since they handle their own translations
            if (footerHeaders[2] && !document.getElementById('dms-content')) {
                footerHeaders[2].textContent = `🛡️ ${i18n.t('nav.contact')}`;
            }
        }

        // Footer links
        const footerLinks = [
            { id: 'privacyLink', key: 'footer.privacy' },
            { id: 'impressumLink', key: 'footer.impressum' },
            { id: 'termsLink', key: 'footer.terms' }
        ];

        footerLinks.forEach(({ id, key }) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = i18n.t(key);
            }
        });

        // Update company info
        const companyNameElements = document.querySelectorAll('.footer-section p strong');
        companyNameElements.forEach(element => {
            if (element.textContent?.includes('Stefan Hutter') || element.textContent?.includes('M3 - ICT')) {
                element.textContent = i18n.t('footer.company');
            }
        });

        // Update address info
        const addressElements = document.querySelectorAll('.footer-section p');
        addressElements.forEach(element => {
            if (element.textContent?.includes('6850 Dornbirn')) {
                // Replace the old address format with new one
                element.innerHTML = element.innerHTML.replace(
                    /6850 Dornbirn,\s*Österreich/g,
                    i18n.t('footer.address')
                );
                element.innerHTML = element.innerHTML.replace(
                    /Mitteldorfgasse\s*3,\s*6850\s*Dornbirn/g,
                    i18n.t('footer.address')
                );
            }
        });
    }

    /**
     * Update common UI texts
     */
    private updateCommonTexts(): void {
        // Update login form texts
        const loginTexts = [
            { selector: '#fullscreenSubtitle', key: 'auth.welcomeBack' },
            { selector: '#loginToggle .form-toggle-title', key: 'auth.login' },
            { selector: '#loginToggle .form-toggle-description', key: 'auth.alreadyRegistered' },
            { selector: '#registerToggle .form-toggle-title', key: 'auth.register' },
            { selector: '#registerToggle .form-toggle-description', key: 'auth.createAccount' }
        ];

        loginTexts.forEach(({ selector, key }) => {
            const element = document.querySelector(selector);
            if (element) {
                element.textContent = i18n.t(key);
            }
        });

        // Update user info texts
        const userGreeting = document.querySelector('.user-greeting');
        if (userGreeting) {
            userGreeting.textContent = i18n.t('auth.loggedInAs') + ':';
        }

        const onlineStatus = document.querySelector('#headerLoginStatus');
        if (onlineStatus) {
            onlineStatus.textContent = i18n.t('auth.online');
        }
    }

    /**
     * Subscribe to language changes and update content
     */
    private subscribeToLanguageChanges(): void {
        i18n.subscribe((language: Language) => {
            this.updateStaticContent();
            this.updatePageTitle(language);
        });
    }

    /**
     * Update page title based on current language
     */
    private updatePageTitle(language: Language): void {
        const titleMappings = {
            de: 'Memory - Lernkarten Management System',
            en: 'Memory - Learning Cards Management System',
            fr: 'Memory - Système de Gestion des Cartes d\'Apprentissage',
            nl: 'Memory - Leerkaarten Beheersysteem'
        };

        document.title = titleMappings[language] || titleMappings.de;
    }
}

// Export singleton instance
export const i18nInitializer = new I18nInitializer();