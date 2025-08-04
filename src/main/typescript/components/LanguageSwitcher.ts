/**
 * Language Switcher Component
 * Provides a dropdown interface for changing application language
 */

import { i18n, Language } from '../i18n/TranslationService.js';

export class LanguageSwitcher {
    private container: HTMLElement;
    private dropdown: HTMLElement | null = null;
    private isOpen: boolean = false;

    constructor(containerId: string) {
        const container = document.getElementById(containerId);
        if (!container) {
            throw new Error(`Container with ID ${containerId} not found`);
        }
        this.container = container;
        this.initialize();
    }

    private initialize(): void {
        this.render();
        this.attachEventListeners();
        
        // Subscribe to language changes
        i18n.subscribe((language: Language) => {
            this.updateCurrentLanguage(language);
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', (event) => {
            if (!this.container.contains(event.target as Node)) {
                this.closeDropdown();
            }
        });
    }

    private render(): void {
        const currentLang = i18n.getCurrentLanguage();
        const currentLangInfo = i18n.getAvailableLanguages().find(lang => lang.code === currentLang);
        
        this.container.innerHTML = `
            <div class="language-switcher">
                <button class="language-switcher-button" type="button" aria-label="Select Language">
                    <span class="language-flag">${currentLangInfo?.flag || '🌐'}</span>
                    <span class="language-name">${currentLangInfo?.name || 'Language'}</span>
                    <span class="language-arrow">▼</span>
                </button>
                <div class="language-dropdown" style="display: none;">
                    ${i18n.getAvailableLanguages().map(lang => `
                        <button class="language-option ${lang.code === currentLang ? 'active' : ''}" 
                                data-language="${lang.code}"
                                type="button">
                            <span class="language-flag">${lang.flag}</span>
                            <span class="language-name">${lang.name}</span>
                        </button>
                    `).join('')}
                </div>
            </div>
        `;

        // Add styles if not already present
        this.addStyles();
        
        this.dropdown = this.container.querySelector('.language-dropdown');
    }

    private addStyles(): void {
        if (document.querySelector('#language-switcher-styles')) {
            return;
        }

        const style = document.createElement('style');
        style.id = 'language-switcher-styles';
        style.textContent = `
            .language-switcher {
                position: relative;
                display: inline-block;
            }
            
            .language-switcher-button {
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 8px 12px;
                background: rgba(255, 255, 255, 0.1);
                border: 1px solid rgba(255, 255, 255, 0.2);
                border-radius: 6px;
                color: white;
                cursor: pointer;
                font-size: 14px;
                font-weight: 500;
                transition: all 0.2s ease;
                min-width: 120px;
            }
            
            .language-switcher-button:hover {
                background: rgba(255, 255, 255, 0.15);
                border-color: rgba(255, 255, 255, 0.3);
            }
            
            .language-switcher-button:active {
                background: rgba(255, 255, 255, 0.2);
            }
            
            .language-flag {
                font-size: 16px;
                line-height: 1;
            }
            
            .language-name {
                flex: 1;
                text-align: left;
            }
            
            .language-arrow {
                font-size: 10px;
                transition: transform 0.2s ease;
            }
            
            .language-switcher-button.open .language-arrow {
                transform: rotate(180deg);
            }
            
            .language-dropdown {
                position: absolute;
                top: 100%;
                left: 0;
                right: 0;
                background: white;
                border: 1px solid #dee2e6;
                border-radius: 6px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                z-index: 1000;
                margin-top: 4px;
                overflow: hidden;
            }
            
            .language-option {
                display: flex;
                align-items: center;
                gap: 10px;
                width: 100%;
                padding: 10px 12px;
                background: none;
                border: none;
                text-align: left;
                cursor: pointer;
                font-size: 14px;
                color: #495057;
                transition: background-color 0.2s ease;
            }
            
            .language-option:hover {
                background-color: #f8f9fa;
            }
            
            .language-option.active {
                background-color: #e3f2fd;
                color: #1976d2;
                font-weight: 500;
            }
            
            .language-option .language-flag {
                font-size: 16px;
            }
            
            .language-option .language-name {
                flex: 1;
            }
            
            /* Dark theme support */
            @media (prefers-color-scheme: dark) {
                .language-dropdown {
                    background: #2d3748;
                    border-color: #4a5568;
                }
                
                .language-option {
                    color: #e2e8f0;
                }
                
                .language-option:hover {
                    background-color: #4a5568;
                }
                
                .language-option.active {
                    background-color: #3182ce;
                    color: white;
                }
            }
            
            /* Mobile responsive */
            @media (max-width: 768px) {
                .language-switcher-button {
                    min-width: 100px;
                    padding: 6px 10px;
                    font-size: 13px;
                }
                
                .language-name {
                    display: none;
                }
                
                .language-dropdown {
                    right: 0;
                    left: auto;
                    min-width: 150px;
                }
                
                .language-option .language-name {
                    display: block;
                }
            }
        `;
        
        document.head.appendChild(style);
    }

    private attachEventListeners(): void {
        const button = this.container.querySelector('.language-switcher-button') as HTMLButtonElement;
        
        if (button) {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.toggleDropdown();
            });
        }

        // Language option click handlers
        this.container.addEventListener('click', (e) => {
            const target = e.target as HTMLElement;
            const languageOption = target.closest('.language-option') as HTMLButtonElement;
            
            if (languageOption) {
                const language = languageOption.dataset.language as Language;
                if (language) {
                    this.selectLanguage(language);
                }
            }
        });
    }

    private toggleDropdown(): void {
        if (this.isOpen) {
            this.closeDropdown();
        } else {
            this.openDropdown();
        }
    }

    private openDropdown(): void {
        if (this.dropdown) {
            this.dropdown.style.display = 'block';
            this.isOpen = true;
            
            const button = this.container.querySelector('.language-switcher-button');
            if (button) {
                button.classList.add('open');
            }
        }
    }

    private closeDropdown(): void {
        if (this.dropdown) {
            this.dropdown.style.display = 'none';
            this.isOpen = false;
            
            const button = this.container.querySelector('.language-switcher-button');
            if (button) {
                button.classList.remove('open');
            }
        }
    }

    private selectLanguage(language: Language): void {
        i18n.setLanguage(language);
        this.closeDropdown();
        
        // Trigger page reload to apply translations (simple approach)
        // In a more sophisticated app, you'd update all text dynamically
        setTimeout(() => {
            window.location.reload();
        }, 100);
    }

    private updateCurrentLanguage(language: Language): void {
        const currentLangInfo = i18n.getAvailableLanguages().find(lang => lang.code === language);
        
        const flagElement = this.container.querySelector('.language-switcher-button .language-flag');
        const nameElement = this.container.querySelector('.language-switcher-button .language-name');
        
        if (flagElement && currentLangInfo) {
            flagElement.textContent = currentLangInfo.flag;
        }
        
        if (nameElement && currentLangInfo) {
            nameElement.textContent = currentLangInfo.name;
        }

        // Update active state in dropdown
        const options = this.container.querySelectorAll('.language-option');
        options.forEach(option => {
            const optionElement = option as HTMLElement;
            if (optionElement.dataset.language === language) {
                optionElement.classList.add('active');
            } else {
                optionElement.classList.remove('active');
            }
        });
    }
}