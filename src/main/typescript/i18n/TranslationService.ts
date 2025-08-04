/**
 * Translation Service for internationalization support
 * Supports German (de), English (en), French (fr), and Dutch (nl)
 */

import { navigationTranslations } from './translations/navigation.js';
import { commonTranslations } from './translations/common.js';
import { formsTranslations } from './translations/forms.js';
import { authenticationTranslations } from './translations/authentication.js';
import { cardsTranslations } from './translations/cards.js';
import { topicsTranslations } from './translations/topics.js';
import { materialsTranslations, imagesTranslations } from './translations/materials.js';
import { billingTranslations } from './translations/billing.js';
import { footerTranslations } from './translations/footer.js';
import { buchungskartenTranslations } from './translations/buchungskarten.js';
import { managementTranslations } from './translations/management.js';
import { dmsTranslations } from './translations/dms.js';
import { testTranslations } from './translations/test.js';
import { homeTranslations } from './translations/home.js';
import { productsTranslations } from './translations/products.js';
import { learnTranslations } from './translations/learn.js';
import { examsTranslations } from './translations/exams.js';

export type Language = 'de' | 'en' | 'fr' | 'nl';

export interface TranslationKeys {
    [key: string]: string | TranslationKeys;
}

export class TranslationService {
    private static instance: TranslationService;
    private currentLanguage: Language = 'de';
    private translations: Record<Language, TranslationKeys> = {
        de: {},
        en: {},
        fr: {},
        nl: {}
    };
    private observers: ((language: Language) => void)[] = [];

    private constructor() {
        this.loadTranslations();
        this.loadSavedLanguage();
    }

    public static getInstance(): TranslationService {
        if (!TranslationService.instance) {
            TranslationService.instance = new TranslationService();
        }
        return TranslationService.instance;
    }

    /**
     * Load saved language from localStorage or detect from browser
     */
    private loadSavedLanguage(): void {
        const savedLang = localStorage.getItem('selectedLanguage') as Language;
        if (savedLang && ['de', 'en', 'fr', 'nl'].includes(savedLang)) {
            this.currentLanguage = savedLang;
        } else {
            // Detect from browser language
            const browserLang = navigator.language.substring(0, 2) as Language;
            if (['de', 'en', 'fr', 'nl'].includes(browserLang)) {
                this.currentLanguage = browserLang;
            }
        }
    }

    /**
     * Set current language and notify observers
     */
    public setLanguage(language: Language): void {
        this.currentLanguage = language;
        localStorage.setItem('selectedLanguage', language);
        this.notifyObservers();
    }

    /**
     * Get current language
     */
    public getCurrentLanguage(): Language {
        return this.currentLanguage;
    }

    /**
     * Get translated text by key
     */
    public t(key: string): string {
        const keys = key.split('.');
        let current: any = this.translations[this.currentLanguage];
        
        for (const k of keys) {
            if (current && typeof current === 'object' && k in current) {
                current = current[k];
            } else {
                // Fallback to German if key not found
                current = this.translations.de;
                for (const fallbackKey of keys) {
                    if (current && typeof current === 'object' && fallbackKey in current) {
                        current = current[fallbackKey];
                    } else {
                        return `[${key}]`; // Key not found
                    }
                }
                break;
            }
        }
        
        return typeof current === 'string' ? current : `[${key}]`;
    }

    /**
     * Subscribe to language changes
     */
    public subscribe(callback: (language: Language) => void): void {
        this.observers.push(callback);
    }

    /**
     * Unsubscribe from language changes
     */
    public unsubscribe(callback: (language: Language) => void): void {
        this.observers = this.observers.filter(obs => obs !== callback);
    }

    /**
     * Notify all observers of language change
     */
    private notifyObservers(): void {
        this.observers.forEach(callback => callback(this.currentLanguage));
    }

    /**
     * Load all translation files
     */
    private loadTranslations(): void {
        // Load translations from separate modules for better organization
        this.translations.de = {
            nav: navigationTranslations.de,
            common: commonTranslations.de,
            forms: formsTranslations.de,
            auth: authenticationTranslations.de,
            cards: cardsTranslations.de,
            topics: topicsTranslations.de,
            materials: materialsTranslations.de,
            images: imagesTranslations.de,
            billing: billingTranslations.de,
            footer: footerTranslations.de,
            buchungskarten: buchungskartenTranslations.de,
            management: managementTranslations.de,
            dms: dmsTranslations.de,
            test: testTranslations.de,
            home: homeTranslations.de,
            products: productsTranslations.de,
            learn: learnTranslations.de,
            exams: examsTranslations.de
        };

        // English translations
        this.translations.en = {
            nav: navigationTranslations.en,
            common: commonTranslations.en,
            forms: formsTranslations.en,
            auth: authenticationTranslations.en,
            cards: cardsTranslations.en,
            topics: topicsTranslations.en,
            materials: materialsTranslations.en,
            images: imagesTranslations.en,
            billing: billingTranslations.en,
            footer: footerTranslations.en,
            buchungskarten: buchungskartenTranslations.en,
            management: managementTranslations.en,
            dms: dmsTranslations.en,
            test: testTranslations.en,
            home: homeTranslations.en,
            products: productsTranslations.en,
            learn: learnTranslations.en,
            exams: examsTranslations.en
        };

        // French translations
        this.translations.fr = {
            nav: navigationTranslations.fr,
            common: commonTranslations.fr,
            forms: formsTranslations.fr,
            auth: authenticationTranslations.fr,
            cards: cardsTranslations.fr,
            topics: topicsTranslations.fr,
            materials: materialsTranslations.fr,
            images: imagesTranslations.fr,
            billing: billingTranslations.fr,
            footer: footerTranslations.fr,
            buchungskarten: buchungskartenTranslations.fr,
            management: managementTranslations.fr,
            dms: dmsTranslations.fr,
            test: testTranslations.fr,
            home: homeTranslations.fr,
            products: productsTranslations.fr,
            learn: learnTranslations.fr,
            exams: examsTranslations.fr
        };

        // Dutch translations
        this.translations.nl = {
            nav: navigationTranslations.nl,
            common: commonTranslations.nl,
            forms: formsTranslations.nl,
            auth: authenticationTranslations.nl,
            cards: cardsTranslations.nl,
            topics: topicsTranslations.nl,
            materials: materialsTranslations.nl,
            images: imagesTranslations.nl,
            billing: billingTranslations.nl,
            footer: footerTranslations.nl,
            buchungskarten: buchungskartenTranslations.nl,
            management: managementTranslations.nl,
            dms: dmsTranslations.nl,
            test: testTranslations.nl,
            home: homeTranslations.nl,
            products: productsTranslations.nl,
            learn: learnTranslations.nl,
            exams: examsTranslations.nl
        };
    }

    /**
     * Get available languages with their display names
     */
    public getAvailableLanguages(): Array<{code: Language, name: string, flag: string}> {
        return [
            { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
            { code: 'en', name: 'English', flag: '🇬🇧' },
            { code: 'fr', name: 'Français', flag: '🇫🇷' },
            { code: 'nl', name: 'Nederlands', flag: '🇳🇱' }
        ];
    }
}

// Export singleton instance
export const i18n = TranslationService.getInstance();