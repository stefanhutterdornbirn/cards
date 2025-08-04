// HomeScript.ts - Beautiful Homepage for Karten Application

import { clearContentScreen } from './common.js';
import { i18n } from './i18n/TranslationService.js';

const HOME_PAGE = "HOME_PAGE";

class HomePageManager {
    private homeContent: HTMLElement | null = null;

    constructor() {
        this.initializeElements();
        this.setupEventListeners();
    }

    private initializeElements(): void {
        this.homeContent = document.getElementById('homeContent');
    }

    private setupEventListeners(): void {
        const homeLink = document.getElementById('homeLink');
        homeLink?.addEventListener('click', (e) => {
            e.preventDefault();
            this.showHomePage();
        });
    }

    public showHomePage(): void {
        clearContentScreen(HOME_PAGE);
        
        if (!this.homeContent) {
            console.error(i18n.t('common.elementNotFound'));
            return;
        }

        this.renderHomePage();
    }

    private renderHomePage(): void {
        if (!this.homeContent) return;

        this.homeContent.innerHTML = `
            <div class="home-container">
                <div class="hero-section">
                    <div class="hero-content">
                        <div class="hero-icon">🃏</div>
                        <h1 class="hero-title">${i18n.t('home.heroTitle')}</h1>
                        <p class="hero-subtitle">${i18n.t('home.heroSubtitle')}</p>
                        <div class="hero-description">
                            ${i18n.t('home.heroDescription')}
                        </div>
                    </div>
                </div>

                <div class="features-section">
                    <h2 class="section-title">
                        <span class="section-icon">✨</span>
                        ${i18n.t('home.featuresTitle')}
                    </h2>
                    
                    <div class="features-grid">
                        <div class="feature-card">
                            <div class="feature-icon">📚</div>
                            <h3 class="feature-title">${i18n.t('home.learningCardsTitle')}</h3>
                            <p class="feature-description">
                                ${i18n.t('home.learningCardsDescription')}
                            </p>
                            <div class="feature-highlights">
                                <span class="highlight">${i18n.t('home.learningCardsHighlight1')}</span>
                                <span class="highlight">${i18n.t('home.learningCardsHighlight2')}</span>
                                <span class="highlight">${i18n.t('home.learningCardsHighlight3')}</span>
                                <span class="highlight">${i18n.t('home.learningCardsHighlight4')}</span>
                            </div>
                        </div>

                        <div class="feature-card">
                            <div class="feature-icon">🗂️</div>
                            <h3 class="feature-title">${i18n.t('home.dmsTitle')}</h3>
                            <p class="feature-description">
                                ${i18n.t('home.dmsDescription')}
                            </p>
                            <div class="feature-highlights">
                                <span class="highlight">${i18n.t('home.dmsHighlight1')}</span>
                                <span class="highlight">${i18n.t('home.dmsHighlight2')}</span>
                                <span class="highlight">${i18n.t('home.dmsHighlight3')}</span>
                                <span class="highlight">${i18n.t('home.dmsHighlight4')}</span>
                            </div>
                        </div>

                        <div class="feature-card">
                            <div class="feature-icon">🖼️</div>
                            <h3 class="feature-title">${i18n.t('home.imageManagementTitle')}</h3>
                            <p class="feature-description">
                                ${i18n.t('home.imageManagementDescription')}
                            </p>
                            <div class="feature-highlights">
                                <span class="highlight">${i18n.t('home.imageManagementHighlight1')}</span>
                                <span class="highlight">${i18n.t('home.imageManagementHighlight2')}</span>
                                <span class="highlight">${i18n.t('home.imageManagementHighlight3')}</span>
                                <span class="highlight">${i18n.t('home.imageManagementHighlight4')}</span>
                            </div>
                        </div>

                        <div class="feature-card">
                            <div class="feature-icon">📊</div>
                            <h3 class="feature-title">${i18n.t('home.billingTitle')}</h3>
                            <p class="feature-description">
                                ${i18n.t('home.billingDescription')}
                            </p>
                            <div class="feature-highlights">
                                <span class="highlight">${i18n.t('home.billingHighlight1')}</span>
                                <span class="highlight">${i18n.t('home.billingHighlight2')}</span>
                                <span class="highlight">${i18n.t('home.billingHighlight3')}</span>
                                <span class="highlight">${i18n.t('home.billingHighlight4')}</span>
                            </div>
                        </div>

                        <div class="feature-card">
                            <div class="feature-icon">📖</div>
                            <h3 class="feature-title">${i18n.t('home.materialsTitle')}</h3>
                            <p class="feature-description">
                                ${i18n.t('home.materialsDescription')}
                            </p>
                            <div class="feature-highlights">
                                <span class="highlight">${i18n.t('home.materialsHighlight1')}</span>
                                <span class="highlight">${i18n.t('home.materialsHighlight2')}</span>
                                <span class="highlight">${i18n.t('home.materialsHighlight3')}</span>
                                <span class="highlight">${i18n.t('home.materialsHighlight4')}</span>
                            </div>
                        </div>

                        <div class="feature-card">
                            <div class="feature-icon">🎯</div>
                            <h3 class="feature-title">${i18n.t('home.examSystemTitle')}</h3>
                            <p class="feature-description">
                                ${i18n.t('home.examSystemDescription')}
                            </p>
                            <div class="feature-highlights">
                                <span class="highlight">${i18n.t('home.examSystemHighlight1')}</span>
                                <span class="highlight">${i18n.t('home.examSystemHighlight2')}</span>
                                <span class="highlight">${i18n.t('home.examSystemHighlight3')}</span>
                                <span class="highlight">${i18n.t('home.examSystemHighlight4')}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="admin-section">
                    <h2 class="section-title">
                        <span class="section-icon">⚙️</span>
                        ${i18n.t('home.adminTitle')}
                    </h2>
                    
                    <div class="admin-grid">
                        <div class="admin-card">
                            <div class="admin-icon">👥</div>
                            <h3 class="admin-title">${i18n.t('home.userManagementTitle')}</h3>
                            <p class="admin-description">
                                ${i18n.t('home.userManagementDescription')}
                            </p>
                        </div>

                        <div class="admin-card">
                            <div class="admin-icon">🏷️</div>
                            <h3 class="admin-title">${i18n.t('home.groupsRolesTitle')}</h3>
                            <p class="admin-description">
                                ${i18n.t('home.groupsRolesDescription')}
                            </p>
                        </div>

                        <div class="admin-card">
                            <div class="admin-icon">📦</div>
                            <h3 class="admin-title">${i18n.t('home.productManagementTitle')}</h3>
                            <p class="admin-description">
                                ${i18n.t('home.productManagementDescription')}
                            </p>
                        </div>

                        <div class="admin-card">
                            <div class="admin-icon">🔧</div>
                            <h3 class="admin-title">${i18n.t('home.technicalInfoTitle')}</h3>
                            <p class="admin-description">
                                ${i18n.t('home.technicalInfoDescription')}
                            </p>
                        </div>
                    </div>
                </div>

                <div class="security-section">
                    <h2 class="section-title">
                        <span class="section-icon">🔒</span>
                        ${i18n.t('home.securityTitle')}
                    </h2>
                    
                    <div class="security-content">
                        <div class="security-info">
                            <h3>${i18n.t('home.roleBasedAccessTitle')}</h3>
                            <p>
                                ${i18n.t('home.roleBasedAccessDescription')}
                            </p>
                        </div>
                        
                        <div class="security-features">
                            <div class="security-feature">
                                <span class="security-icon">🔐</span>
                                <span>${i18n.t('home.jwtAuth')}</span>
                            </div>
                            <div class="security-feature">
                                <span class="security-icon">🛡️</span>
                                <span>${i18n.t('home.granularPermissions')}</span>
                            </div>
                            <div class="security-feature">
                                <span class="security-icon">👁️</span>
                                <span>${i18n.t('home.dynamicMenus')}</span>
                            </div>
                            <div class="security-feature">
                                <span class="security-icon">🏢</span>
                                <span>${i18n.t('home.groupBasedAccess')}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="technology-section">
                    <h2 class="section-title">
                        <span class="section-icon">⚡</span>
                        ${i18n.t('home.technologyTitle')}
                    </h2>
                    
                    <div class="tech-content">
                        <div class="tech-info">
                            <h3>${i18n.t('home.enterpriseTechTitle')}</h3>
                            <p>
                                ${i18n.t('home.enterpriseTechDescription')}
                            </p>
                        </div>
                        
                        <div class="tech-stack">
                            <div class="tech-category">
                                <h4>Backend</h4>
                                <div class="tech-items">
                                    <span class="tech-item">Kotlin + Ktor</span>
                                    <span class="tech-item">PostgreSQL</span>
                                    <span class="tech-item">Exposed ORM</span>
                                    <span class="tech-item">JWT Auth</span>
                                </div>
                            </div>
                            
                            <div class="tech-category">
                                <h4>Frontend</h4>
                                <div class="tech-items">
                                    <span class="tech-item">TypeScript</span>
                                    <span class="tech-item">Modern CSS</span>
                                    <span class="tech-item">Responsive Design</span>
                                    <span class="tech-item">Progressive Web App</span>
                                </div>
                            </div>
                            
                            <div class="tech-category">
                                <h4>Features</h4>
                                <div class="tech-items">
                                    <span class="tech-item">Content Addressable Storage</span>
                                    <span class="tech-item">PDF Text Extraction</span>
                                    <span class="tech-item">Image Processing</span>
                                    <span class="tech-item">Full-Text Search</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="getting-started-section">
                    <h2 class="section-title">
                        <span class="section-icon">🚀</span>
                        ${i18n.t('home.gettingStartedTitle')}
                    </h2>
                    
                    <div class="steps-container">
                        <div class="step">
                            <div class="step-number">1</div>
                            <div class="step-content">
                                <h3>${i18n.t('home.stepLoginTitle')}</h3>
                                <p>${i18n.t('home.stepLoginDescription')}</p>
                            </div>
                        </div>
                        
                        <div class="step">
                            <div class="step-number">2</div>
                            <div class="step-content">
                                <h3>${i18n.t('home.stepPermissionsTitle')}</h3>
                                <p>${i18n.t('home.stepPermissionsDescription')}</p>
                            </div>
                        </div>
                        
                        <div class="step">
                            <div class="step-number">3</div>
                            <div class="step-content">
                                <h3>${i18n.t('home.stepStartTitle')}</h3>
                                <p>${i18n.t('home.stepStartDescription')}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style>
                .home-container {
                    max-width: 1200px;
                    margin: 0 auto;
                    padding: 20px;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                }

                .hero-section {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    border-radius: 20px;
                    padding: 60px 40px;
                    text-align: center;
                    color: white;
                    margin-bottom: 40px;
                    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
                }

                .hero-icon {
                    font-size: 4rem;
                    margin-bottom: 20px;
                    animation: float 3s ease-in-out infinite;
                }

                @keyframes float {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-10px); }
                }

                .hero-title {
                    font-size: 3rem;
                    font-weight: 700;
                    margin-bottom: 10px;
                    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
                }

                .hero-subtitle {
                    font-size: 1.3rem;
                    margin-bottom: 20px;
                    opacity: 0.9;
                }

                .hero-description {
                    font-size: 1.1rem;
                    line-height: 1.6;
                    max-width: 600px;
                    margin: 0 auto;
                    opacity: 0.9;
                }

                .section-title {
                    font-size: 2rem;
                    font-weight: 600;
                    margin-bottom: 30px;
                    text-align: center;
                    color: #333;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 15px;
                }

                .section-icon {
                    font-size: 2.5rem;
                }

                .features-section {
                    margin-bottom: 50px;
                }

                .features-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                    gap: 30px;
                    margin-bottom: 50px;
                }

                .feature-card {
                    background: white;
                    border-radius: 15px;
                    padding: 30px;
                    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
                    border: 1px solid #e0e0e0;
                    transition: transform 0.3s ease, box-shadow 0.3s ease;
                }

                .feature-card:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
                }

                .feature-icon {
                    font-size: 3rem;
                    margin-bottom: 20px;
                    text-align: center;
                }

                .feature-title {
                    font-size: 1.5rem;
                    font-weight: 600;
                    margin-bottom: 15px;
                    color: #333;
                    text-align: center;
                }

                .feature-description {
                    color: #666;
                    line-height: 1.6;
                    margin-bottom: 20px;
                    text-align: center;
                }

                .feature-highlights {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }

                .highlight {
                    color: #667eea;
                    font-weight: 500;
                    font-size: 0.9rem;
                }

                .admin-section {
                    margin-bottom: 50px;
                }

                .admin-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                    gap: 25px;
                }

                .admin-card {
                    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
                    border-radius: 15px;
                    padding: 25px;
                    color: white;
                    text-align: center;
                    transition: transform 0.3s ease;
                }

                .admin-card:hover {
                    transform: translateY(-3px);
                }

                .admin-icon {
                    font-size: 2.5rem;
                    margin-bottom: 15px;
                }

                .admin-title {
                    font-size: 1.3rem;
                    font-weight: 600;
                    margin-bottom: 10px;
                }

                .admin-description {
                    font-size: 0.95rem;
                    line-height: 1.5;
                    opacity: 0.9;
                }

                .security-section {
                    background: #f8f9fa;
                    border-radius: 15px;
                    padding: 40px;
                    margin-bottom: 50px;
                }

                .security-content {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 40px;
                    align-items: center;
                }

                .security-info h3 {
                    color: #333;
                    margin-bottom: 15px;
                    font-size: 1.3rem;
                }

                .security-info p {
                    color: #666;
                    line-height: 1.6;
                }

                .security-features {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 15px;
                }

                .security-feature {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    color: #333;
                    font-weight: 500;
                }

                .security-icon {
                    font-size: 1.2rem;
                }

                .technology-section {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    border-radius: 15px;
                    padding: 40px;
                    margin-bottom: 50px;
                    color: white;
                }

                .technology-section .section-title {
                    color: white;
                }

                .tech-content {
                    display: grid;
                    grid-template-columns: 1fr 2fr;
                    gap: 40px;
                    align-items: start;
                }

                .tech-info h3 {
                    color: white;
                    margin-bottom: 15px;
                    font-size: 1.3rem;
                }

                .tech-info p {
                    color: rgba(255, 255, 255, 0.9);
                    line-height: 1.6;
                }

                .tech-stack {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 30px;
                }

                .tech-category h4 {
                    color: white;
                    margin-bottom: 15px;
                    font-size: 1.1rem;
                    font-weight: 600;
                }

                .tech-items {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }

                .tech-item {
                    background: rgba(255, 255, 255, 0.2);
                    padding: 8px 12px;
                    border-radius: 8px;
                    font-size: 0.9rem;
                    font-weight: 500;
                    backdrop-filter: blur(10px);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                }

                .getting-started-section {
                    margin-bottom: 50px;
                }

                .steps-container {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 30px;
                }

                .step {
                    display: flex;
                    align-items: center;
                    gap: 20px;
                    padding: 20px;
                    background: white;
                    border-radius: 15px;
                    box-shadow: 0 3px 10px rgba(0, 0, 0, 0.1);
                }

                .step-number {
                    width: 50px;
                    height: 50px;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: 600;
                    font-size: 1.2rem;
                    flex-shrink: 0;
                }

                .step-content h3 {
                    color: #333;
                    margin-bottom: 5px;
                    font-size: 1.1rem;
                }

                .step-content p {
                    color: #666;
                    font-size: 0.9rem;
                    margin: 0;
                }

                @media (max-width: 768px) {
                    .home-container {
                        padding: 15px;
                    }

                    .hero-section {
                        padding: 40px 20px;
                    }

                    .hero-title {
                        font-size: 2rem;
                    }

                    .hero-subtitle {
                        font-size: 1.1rem;
                    }

                    .features-grid {
                        grid-template-columns: 1fr;
                    }

                    .security-content {
                        grid-template-columns: 1fr;
                        gap: 20px;
                    }

                    .security-features {
                        grid-template-columns: 1fr;
                    }

                    .step {
                        flex-direction: column;
                        text-align: center;
                    }

                    .tech-content {
                        grid-template-columns: 1fr;
                        gap: 20px;
                    }

                    .tech-stack {
                        grid-template-columns: 1fr;
                        gap: 20px;
                    }
                }
            </style>
        `;
    }
}

// Initialize home page manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new HomePageManager();
});

// Export to make this file a module
export {};