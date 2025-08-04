// Import billing integration
import { BillingIntegration } from '../billing/BillingIntegration.js';
import { BillingService } from '../billing/BillingService.js';
import { i18n } from '../i18n/TranslationService.js';

interface DMSTreeNode {
    id: number;
    name: string;
    type: 'registraturplan' | 'registraturposition' | 'dossier' | 'document';
    parentId?: number;
    children: DMSTreeNode[];
    metadata: Record<string, any>;
}

interface DMSNavigationResponse {
    currentPath: DMSTreeNode[];
    children: DMSTreeNode[];
    permissions: DMSPermissions;
}

interface DMSPermissions {
    canRead: boolean;
    canWrite: boolean;
    canDelete: boolean;
    canCreateDossier: boolean;
    canCreateDocument: boolean;
    canManageVersions: boolean;
}

interface DMSDocument {
    id: number;
    dossierId: number;
    titel: string;
    aktuelleVersionId?: number;
    status: string;
    userId: number;
    groupId: number;
    erstellungsdatum: string;
    beschreibung?: string;
}

interface DMSDocumentVersion {
    id: number;
    documentId: number;
    versionsnummer: number;
    dateiname: string;
    dateigroesse: number;
    mimeType: string;
    hashWert: string;
    kommentar?: string;
    userId: number;
    groupId: number;
    erstellungsdatum: string;
}

interface DMSDossier {
    id: number;
    registraturPositionId: number;
    parentDossierId?: number;
    name: string;
    laufnummer: string;
    positionNummer: number;
    eindeutigeLaufnummer: number;
    status: string;
    isPublicAnonymousShared: boolean;
    userId: number;
    groupId: number;
    erstellungsdatum: string;
    beschreibung?: string;
}

interface DMSStatistics {
    totalDocuments: number;
    totalDossiers: number;
    totalVersions: number;
    totalStorageBytes: number;
    documentsByStatus: Record<string, number>;
    documentsByMimeType: Record<string, number>;
    averageVersionsPerDocument: number;
    recentUploads: number; // Last 7 days
    topFileTypes: FileTypeStatistic[];
    storageByGroup: Record<string, number>;
}

interface FileTypeStatistic {
    mimeType: string;
    extension: string;
    count: number;
    totalSize: number;
}

class DMSManager {
    private currentPath: DMSTreeNode[] = [];
    private currentNode: DMSTreeNode | null = null;
    private rootTree: DMSTreeNode | null = null;
    private permissions: DMSPermissions = {
        canRead: false,
        canWrite: false,
        canDelete: false,
        canCreateDossier: false,
        canCreateDocument: false,
        canManageVersions: false
    };
    private isHandlingButtonUpload: boolean = false;

    private breadcrumbContainer: HTMLElement | null = null;
    private contentContainer: HTMLElement | null = null;
    private toolbarContainer: HTMLElement | null = null;

    constructor() {
        this.initializeDOMElements();
        this.setupEventListeners();
        this.loadRegistraturPlan();
        // Initialize translations for static HTML elements
        this.updateStaticHTMLTranslations();
    }

    private initializeDOMElements(): void {
        this.breadcrumbContainer = document.getElementById('dms-breadcrumb');
        this.contentContainer = document.getElementById('dms-content');
        this.toolbarContainer = document.getElementById('dms-toolbar');
    }

    private setupEventListeners(): void {
        // Setup global event listeners
        document.addEventListener('dms:navigate', (event: any) => {
            this.navigateToNode(event.detail.node);
        });

        document.addEventListener('dms:refresh', () => {
            this.refreshCurrentView();
        });

        // Upload button is now handled via inline onclick in HTML

        // Setup navigation links
        this.setupNavigationLinks();

        // Setup drag and drop
        this.setupDragAndDrop();
        
        // Setup language switching integration
        this.setupLanguageSwitching();
    }

    private setupNavigationLinks(): void {
        // Setup Registraturplan navigation link
        const registraturplanLink = document.querySelector('.dms-nav-link[href="#"]');
        if (registraturplanLink) {
            registraturplanLink.addEventListener('click', (e) => {
                e.preventDefault();
                this.loadRegistraturPlan();
            });
        }
    }

    private setupDragAndDrop(): void {
        if (this.contentContainer) {
            this.contentContainer.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.dataTransfer!.dropEffect = 'move';
            });

            this.contentContainer.addEventListener('drop', (e) => {
                e.preventDefault();
                // Skip if we're handling a button upload
                if (this.isHandlingButtonUpload) {
                    return;
                }
                const files = e.dataTransfer!.files;
                if (files.length > 0) {
                    this.handleFileUpload(files);
                }
            });
        }
    }

    private setupLanguageSwitching(): void {
        // Create a robust language switching function that persists across navigation
        const languageSwitchHandler = (language: string) => {
            console.log('[DMS] Language switch requested:', language);
            
            // Prevent infinite loops by checking if we're already switching languages
            if (this.isLanguageSwitching) {
                console.log('[DMS] Language switch already in progress, skipping');
                return;
            }
            
            this.isLanguageSwitching = true;
            
            // Update the legacy DMS i18n system
            if ((window as any).dmsTranslations && (window as any).dmsTranslations[language]) {
                (window as any).currentLanguage = language;
                localStorage.setItem('dms-language', language);
                (window as any).updateTranslations();
            }
            
            // Update the TypeScript i18n system
            if (language === 'de' || language === 'en' || language === 'fr' || language === 'nl') {
                i18n.setLanguage(language as any);
                
                // Update translations with a delay to avoid immediate loops
                setTimeout(() => {
                    this.updateCurrentViewTranslations();
                    // Reset the flag after a short delay
                    setTimeout(() => {
                        this.isLanguageSwitching = false;
                    }, 200);
                }, 50);
            } else {
                this.isLanguageSwitching = false;
            }
        };
        
        // Override the global switchLanguage function
        (window as any).switchLanguage = languageSwitchHandler;
        
        // Also add direct event listener to the select element as backup
        const languageSelect = document.getElementById('dms-language-select') as HTMLSelectElement;
        if (languageSelect) {
            const currentLang = i18n.getCurrentLanguage();
            languageSelect.value = currentLang;
            
            // Remove existing listeners and add new one
            languageSelect.removeEventListener('change', this.handleLanguageChange);
            languageSelect.addEventListener('change', this.handleLanguageChange.bind(this));
        }
        
        // Store the handler for re-initialization after navigation
        this.languageSwitchHandler = languageSwitchHandler;
    }
    
    private handleLanguageChange = (event: Event) => {
        const target = event.target as HTMLSelectElement;
        if (target && target.value) {
            console.log('[DMS] Language change via direct event:', target.value);
            if (this.languageSwitchHandler) {
                this.languageSwitchHandler(target.value);
            }
        }
    };
    
    private languageSwitchHandler: ((language: string) => void) | null = null;
    private isLanguageSwitching: boolean = false;

    private updateCurrentViewTranslations(): void {
        console.log('[DMS] Updating current view translations');
        
        // Update static HTML elements using TypeScript i18n system
        this.updateStaticHTMLTranslations();
        
        // Update dynamic search toggle button
        this.updateSearchToggleButtonText();
        
        // Update only the dynamic content that uses TypeScript translations
        // without triggering a full navigation refresh
        if (this.currentNode) {
            // Update toolbar with new translations
            this.updateToolbar(this.currentNode);
            
            // Update breadcrumb if it contains TypeScript translations
            this.buildBreadcrumb(this.currentNode);
            
            // Re-render the content to update any TypeScript-generated text
            this.renderContent(this.currentNode);
        }
        
        console.log('[DMS] Translation update completed');
    }

    private updateStaticHTMLTranslations(): void {
        // Update navigation section
        const navigationHeader = document.querySelector('[data-i18n="nav.navigation"]');
        if (navigationHeader) {
            navigationHeader.textContent = i18n.t('dms.navigation');
        }

        const backToMainLink = document.querySelector('[data-i18n="dms.backToMain"]');
        if (backToMainLink) {
            backToMainLink.textContent = i18n.t('dms.backToMain');
        }

        const filingPlanLink = document.querySelector('[data-i18n="dms.filingPlan"]');
        if (filingPlanLink) {
            filingPlanLink.textContent = i18n.t('dms.filingPlan');
        }

        const searchLink = document.querySelector('[data-i18n="common.search"]');
        if (searchLink) {
            searchLink.textContent = i18n.t('dms.search');
        }

        const statisticsLink = document.querySelector('[data-i18n="dms.statistics"]');
        if (statisticsLink) {
            statisticsLink.textContent = i18n.t('dms.statistics');
        }

        // Update toolbar buttons
        const refreshButton = document.querySelector('[data-i18n="common.refresh"]');
        if (refreshButton) {
            refreshButton.textContent = i18n.t('dms.refresh');
        }

        const uploadButton = document.querySelector('[data-i18n="common.upload"]');
        if (uploadButton) {
            uploadButton.textContent = i18n.t('common.upload');
        }

        // Update sidebar elements
        const actionsHeader = document.querySelector('[data-i18n="nav.actions"]');
        if (actionsHeader) {
            actionsHeader.textContent = i18n.t('dms.actions');
        }

        const newDossierButton = document.querySelector('[data-i18n="dms.newDossier"]');
        if (newDossierButton) {
            newDossierButton.textContent = i18n.t('dms.newDossier');
        }

        const newDocumentButton = document.querySelector('[data-i18n="dms.newDocument"]');
        if (newDocumentButton) {
            newDocumentButton.textContent = i18n.t('dms.newDocument');
        }

        const recentActivitiesHeader = document.querySelector('[data-i18n="dms.recentActivities"]');
        if (recentActivitiesHeader) {
            recentActivitiesHeader.textContent = i18n.t('dms.recentActivities');
        }

        // Update activity items
        const documentCreatedActivity = document.querySelector('[data-i18n="dms.documentCreatedShort"]');
        if (documentCreatedActivity) {
            documentCreatedActivity.textContent = i18n.t('dms.documentCreatedShort');
        }

        const timeAgo2Hours = document.querySelector('[data-i18n="dms.timeAgo2HoursShort"]');
        if (timeAgo2Hours) {
            timeAgo2Hours.textContent = i18n.t('dms.timeAgo2HoursShort');
        }

        const dossierCreatedActivity = document.querySelector('[data-i18n="dms.dossierCreatedShort"]');
        if (dossierCreatedActivity) {
            dossierCreatedActivity.textContent = i18n.t('dms.dossierCreatedShort');
        }

        const timeAgoYesterday = document.querySelector('[data-i18n="dms.timeAgoYesterdayShort"]');
        if (timeAgoYesterday) {
            timeAgoYesterday.textContent = i18n.t('dms.timeAgoYesterdayShort');
        }

        // Update footer
        const serviceHeader = document.querySelector('[data-i18n="dms.service"]');
        if (serviceHeader) {
            serviceHeader.textContent = i18n.t('dms.service');
        }

        const providerFooter = document.querySelector('[data-i18n="dms.provider"]');
        if (providerFooter) {
            providerFooter.textContent = i18n.t('dms.provider');
        }

        const learningCardsAppsTitle = document.querySelector('[data-i18n="dms.learningCardsApps"]');
        if (learningCardsAppsTitle) {
            learningCardsAppsTitle.textContent = i18n.t('dms.learningCardsApps');
        }

        const professionalPlatformText = document.querySelector('[data-i18n="dms.professionalLearningPlatform"]');
        if (professionalPlatformText) {
            professionalPlatformText.textContent = i18n.t('dms.professionalLearningPlatform');
        }

        const demoAppText = document.querySelector('[data-i18n="dms.demoAppMadeIn"]');
        if (demoAppText) {
            demoAppText.textContent = i18n.t('dms.demoAppMadeIn');
        }

        // Update modal elements
        const createDossierTitle = document.querySelector('[data-i18n="modal.createDossier"]');
        if (createDossierTitle) {
            createDossierTitle.textContent = i18n.t('dms.createDossier');
        }

        const createRegistraturpositionTitle = document.querySelector('[data-i18n="modal.createRegistraturposition"]');
        if (createRegistraturpositionTitle) {
            createRegistraturpositionTitle.textContent = i18n.t('dms.createRegistraturposition');
        }

        // Update form labels in dossier modal
        const dossierNameLabel = document.querySelector('label[for="dossier-name"][data-i18n="form.name"]');
        if (dossierNameLabel) {
            dossierNameLabel.textContent = i18n.t('dms.dossierName');
        }

        const dossierDescriptionLabel = document.querySelector('label[for="dossier-beschreibung"][data-i18n="form.description"]');
        if (dossierDescriptionLabel) {
            dossierDescriptionLabel.textContent = i18n.t('dms.dossierDescription');
        }

        // Update form labels in registraturposition modal
        const registraturpositionNameLabel = document.querySelector('label[for="registraturposition-name"][data-i18n="form.name"]');
        if (registraturpositionNameLabel) {
            registraturpositionNameLabel.textContent = i18n.t('dms.registraturpositionName');
        }

        const positionNumberLabel = document.querySelector('label[for="registraturposition-positionNummer"][data-i18n="form.positionNumber"]');
        if (positionNumberLabel) {
            positionNumberLabel.textContent = i18n.t('dms.positionNumber');
        }

        const registraturpositionDescriptionLabel = document.querySelector('label[for="registraturposition-beschreibung"][data-i18n="form.description"]');
        if (registraturpositionDescriptionLabel) {
            registraturpositionDescriptionLabel.textContent = i18n.t('dms.registraturpositionDescription');
        }

        const pleaseSelectOption = document.querySelector('[data-i18n="form.pleaseSelect"]');
        if (pleaseSelectOption) {
            pleaseSelectOption.textContent = i18n.t('dms.pleaseSelectOption');
        }

        const parentDossierLabel = document.querySelector('[data-i18n="form.parentDossier"]');
        if (parentDossierLabel) {
            parentDossierLabel.textContent = i18n.t('dms.parentDossier');
        }

        const noParentDossierOption = document.querySelector('[data-i18n="form.noParentDossier"]');
        if (noParentDossierOption) {
            noParentDossierOption.textContent = i18n.t('dms.noParentDossier');
        }

        const helpTextDossier = document.querySelector('[data-i18n="form.helpTextDossier"]');
        if (helpTextDossier) {
            helpTextDossier.textContent = i18n.t('dms.selectParentDossierHelp');
        }

        const cancelButtons = document.querySelectorAll('[data-i18n="button.cancel"]');
        cancelButtons.forEach(button => {
            if (button.textContent === 'Abbrechen') {
                button.textContent = i18n.t('dms.cancel');
            }
        });

        const createButtons = document.querySelectorAll('[data-i18n="button.create"]');
        createButtons.forEach(button => {
            if (button.textContent === 'Erstellen') {
                button.textContent = i18n.t('dms.create');
            }
        });

        // Update search modal elements
        const searchModalTitle = document.querySelector('[data-i18n="dms.searchDocumentsAndDossiers"]');
        if (searchModalTitle) {
            searchModalTitle.textContent = `🔍 ${i18n.t('dms.searchDocumentsAndDossiers')}`;
        }

        const searchPlaceholder = document.querySelector('[data-i18n-placeholder="dms.searchPlaceholder"]') as HTMLInputElement;
        if (searchPlaceholder) {
            searchPlaceholder.placeholder = i18n.t('dms.searchPlaceholder');
        }

        const searchBtn = document.querySelector('[data-i18n="dms.searchBtn"]');
        if (searchBtn) {
            searchBtn.textContent = `🔍 ${i18n.t('dms.searchBtn')}`;
        }

        const typeLabel = document.querySelector('[data-i18n="dms.type"]');
        if (typeLabel) {
            typeLabel.textContent = i18n.t('dms.type');
        }

        const allOption = document.querySelector('[data-i18n="dms.all"]');
        if (allOption) {
            allOption.textContent = i18n.t('dms.all');
        }

        const onlyDocuments = document.querySelector('[data-i18n="dms.onlyDocuments"]');
        if (onlyDocuments) {
            onlyDocuments.textContent = i18n.t('dms.onlyDocuments');
        }

        const onlyDossiers = document.querySelector('[data-i18n="dms.onlyDossiers"]');
        if (onlyDossiers) {
            onlyDossiers.textContent = i18n.t('dms.onlyDossiers');
        }

        const fileTypeLabel = document.querySelector('[data-i18n="dms.fileType"]');
        if (fileTypeLabel) {
            fileTypeLabel.textContent = i18n.t('dms.fileType');
        }

        const allFileTypes = document.querySelector('[data-i18n="dms.allFileTypes"]');
        if (allFileTypes) {
            allFileTypes.textContent = i18n.t('dms.allFileTypes');
        }

        const textOption = document.querySelector('[data-i18n="dms.text"]');
        if (textOption) {
            textOption.textContent = i18n.t('dms.text');
        }

        const fromDateLabel = document.querySelector('[data-i18n="dms.fromDate"]');
        if (fromDateLabel) {
            fromDateLabel.textContent = i18n.t('dms.fromDate');
        }

        const toDateLabel = document.querySelector('[data-i18n="dms.toDate"]');
        if (toDateLabel) {
            toDateLabel.textContent = i18n.t('dms.toDate');
        }

        // Advanced search button is handled dynamically in toggleAdvancedFilters()

        const searchResultsTitle = document.querySelector('[data-i18n="dms.searchResults"]');
        if (searchResultsTitle) {
            searchResultsTitle.textContent = i18n.t('dms.searchResults');
        }

        const documentsHeader = document.querySelector('[data-i18n="dms.documents"]');
        if (documentsHeader) {
            documentsHeader.textContent = `📄 ${i18n.t('dms.documents')}`;
        }

        const dossiersHeader = document.querySelector('[data-i18n="dms.dossiers"]');
        if (dossiersHeader) {
            dossiersHeader.textContent = `📁 ${i18n.t('dms.dossiers')}`;
        }

        const noResultsFound = document.querySelector('[data-i18n="dms.noResultsFound"]');
        if (noResultsFound) {
            noResultsFound.textContent = i18n.t('dms.noResultsFound');
        }

        const tryOtherTerms = document.querySelector('[data-i18n="dms.tryOtherTerms"]');
        if (tryOtherTerms) {
            tryOtherTerms.textContent = i18n.t('dms.tryOtherTerms');
        }

        const searchInProgress = document.querySelector('[data-i18n="dms.searchInProgress"]');
        if (searchInProgress) {
            searchInProgress.textContent = i18n.t('dms.searchInProgress');
        }

        const closeButtons = document.querySelectorAll('[data-i18n="dms.close"]');
        closeButtons.forEach(button => {
            button.textContent = i18n.t('dms.close');
        });

        // Update deleted items modal elements
        const deletedItemsTitle = document.querySelector('[data-i18n="dms.deletedItems"]');
        if (deletedItemsTitle) {
            deletedItemsTitle.textContent = `🗂️ ${i18n.t('dms.deletedItems')}`;
        }

        const deletedItemsInfo = document.querySelector('[data-i18n="dms.deletedItemsInfo"]');
        if (deletedItemsInfo) {
            deletedItemsInfo.textContent = i18n.t('dms.deletedItemsInfo');
        }

        const deletedDocumentsHeader = document.querySelector('[data-i18n="dms.deletedDocuments"]');
        if (deletedDocumentsHeader) {
            deletedDocumentsHeader.textContent = `📄 ${i18n.t('dms.deletedDocuments')}`;
        }

        const deletedDossiersHeader = document.querySelector('[data-i18n="dms.deletedDossiers"]');
        if (deletedDossiersHeader) {
            deletedDossiersHeader.textContent = `📁 ${i18n.t('dms.deletedDossiers')}`;
        }

        const deletedVersionsHeader = document.querySelector('[data-i18n="dms.deletedDocumentVersions"]');
        if (deletedVersionsHeader) {
            deletedVersionsHeader.textContent = `🗂️ ${i18n.t('dms.deletedDocumentVersions')}`;
        }

        const noDeletedItems = document.querySelector('[data-i18n="dms.noDeletedItemsFound"]');
        if (noDeletedItems) {
            noDeletedItems.textContent = `✅ ${i18n.t('dms.noDeletedItemsFound')}`;
        }

        const publicShare = document.querySelector('label[for="dossier-be"][data-i18n="dms.publicshare"]');
            if (publicShare) {
                publicShare.textContent = `${i18n.t('dms.publicshare')}`;
            }


    }

    private updateSearchToggleButtonText(): void {
        const filters = document.getElementById('dms-search-filters');
        const toggleBtn = document.getElementById('dms-search-toggle-filters');
        
        if (filters && toggleBtn) {
            const isVisible = filters.style.display !== 'none';
            toggleBtn.textContent = isVisible ? `⚙️ ${i18n.t('dms.simpleSearch')}` : `⚙️ ${i18n.t('dms.advancedSearch')}`;
        }
    }

    private reinitializeLanguageSwitching(): void {
        // Don't reinitialize during a language switch to avoid loops
        if (this.isLanguageSwitching) {
            return;
        }
        
        // Ensure the global function is still overridden
        if (this.languageSwitchHandler) {
            (window as any).switchLanguage = this.languageSwitchHandler;
        }
        
        // Re-attach event listener to language select
        const languageSelect = document.getElementById('dms-language-select') as HTMLSelectElement;
        if (languageSelect) {
            const currentLang = i18n.getCurrentLanguage();
            languageSelect.value = currentLang;
            
            // Remove and re-add listener to ensure it's working
            languageSelect.removeEventListener('change', this.handleLanguageChange);
            languageSelect.addEventListener('change', this.handleLanguageChange.bind(this));
        }
    }

    private async loadRegistraturPlan(): Promise<void> {
        try {
            console.log('[DMS] loadRegistraturPlan: Starting to load registration plans');
            console.log('[DMS] loadRegistraturPlan: Auth token present:', !!localStorage.getItem('authToken'));
            
            // Reset navigation state when returning to root
            this.currentNode = null;
            this.currentPath = [];
            
            console.log('[DMS] loadRegistraturPlan: Making first API call to /dms/registraturplan/all');
            const startTime = Date.now();
            
            // First try to load all accessible Registraturplans
            const allPlansResponse = await fetch('/dms/registraturplan/all', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                }
            });

            const firstCallDuration = Date.now() - startTime;
            console.log(`[DMS] loadRegistraturPlan: First API call completed in ${firstCallDuration}ms, status: ${allPlansResponse.status}`);

            if (allPlansResponse.ok) {
                console.log('[DMS] loadRegistraturPlan: First API call successful, parsing response');
                const allPlansData = await allPlansResponse.json();
                console.log('[DMS] loadRegistraturPlan: Received plans data:', allPlansData);
                console.log(`[DMS] loadRegistraturPlan: Plans found: ${allPlansData.plans ? allPlansData.plans.length : 0}`);
                
                if (allPlansData.plans && allPlansData.plans.length > 0) {
                    console.log('[DMS] loadRegistraturPlan: Multiple plans found, calling handleMultipleRegistraturPlans');
                    this.handleMultipleRegistraturPlans(allPlansData.plans);
                    console.log('[DMS] loadRegistraturPlan: Successfully completed with multiple plans');
                    return;
                } else {
                    console.log('[DMS] loadRegistraturPlan: No plans in response, falling back to single plan API');
                }
            } else {
                console.log(`[DMS] loadRegistraturPlan: First API call failed with status ${allPlansResponse.status}, falling back to single plan API`);
            }

            // Fallback to single Registraturplan (original behavior)
            console.log('[DMS] loadRegistraturPlan: Making fallback API call to /dms/registraturplan');
            const fallbackStartTime = Date.now();
            
            const response = await fetch('/dms/registraturplan', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                }
            });

            const fallbackCallDuration = Date.now() - fallbackStartTime;
            console.log(`[DMS] loadRegistraturPlan: Fallback API call completed in ${fallbackCallDuration}ms, status: ${response.status}`);

            if (!response.ok) {
                console.error(`[DMS] loadRegistraturPlan: Fallback API call failed with status ${response.status}`);
                throw new Error(`Failed to load Registraturplan - HTTP ${response.status}`);
            }

            console.log('[DMS] loadRegistraturPlan: Fallback API call successful, parsing response');
            const data = await response.json();
            console.log('[DMS] loadRegistraturPlan: Received fallback data:', data);
            
            // Check if response includes permissions (new format) or is just tree (old format)
            if (data.tree && data.permissions) {
                console.log('[DMS] loadRegistraturPlan: Using new format with permissions:', data.permissions);
                this.permissions = data.permissions;
                this.rootTree = data.tree; // Store the complete tree
                console.log('[DMS] loadRegistraturPlan: Calling navigateToNode with tree:', data.tree);
                this.navigateToNode(data.tree);
            } else {
                console.log('[DMS] loadRegistraturPlan: Using old format, treating data as tree');
                // Fallback for old format - assume it's just the tree
                this.rootTree = data; // Store the complete tree
                console.log('[DMS] loadRegistraturPlan: Calling navigateToNode with data:', data);
                this.navigateToNode(data);
            }
            console.log('[DMS] loadRegistraturPlan: Successfully completed with single plan');
        } catch (error) {
            console.error('[DMS] loadRegistraturPlan: Error occurred:', error);
            console.error('[DMS] loadRegistraturPlan: Error stack:', error instanceof Error ? error.stack : 'No stack trace available');
            this.showError(i18n.t('dms.errorLoadingDossierInfo'));
        }
    }

    private handleMultipleRegistraturPlans(plans: any[]): void {
        console.log('DMSScript: Multiple Registraturplans available:', plans.length);
        
        // Show plan selector if multiple plans
        if (plans.length > 1) {
            this.showRegistraturPlanSelector(plans);
        } else if (plans.length === 1) {
            // Single plan - load directly
            const plan = plans[0];
            this.permissions = plan.permissions;
            this.rootTree = plan.tree;
            this.navigateToNode(plan.tree);
        }
    }

    private showRegistraturPlanSelector(plans: any[]): void {
        if (!this.contentContainer) return;

        const html = `
            <div class="dms-plan-selector">
                <div class="dms-plan-selector-header">
                    <h2>📁 ${i18n.t('dms.availableRegistrationPlans')}</h2>
                    <p>${i18n.t('dms.selectRegistrationPlan')}</p>
                </div>
                <div class="dms-plan-cards">
                    ${plans.map((plan, index) => `
                        <div class="dms-plan-card" onclick="window.dmsManager?.selectRegistraturPlan(${index})">
                            <div class="dms-plan-card-header">
                                <span class="dms-plan-icon">${plan.isPersonal ? '👤' : '👥'}</span>
                                <h3>${plan.plan.name}</h3>
                                ${plan.isPersonal ? `<span class="dms-plan-badge">${i18n.t('dms.personal')}</span>` : `<span class="dms-plan-badge">${i18n.t('dms.group')}</span>`}
                            </div>
                            <div class="dms-plan-card-body">
                                <p>${plan.plan.beschreibung || i18n.t('dms.noDescriptionAvailable')}</p>
                                <div class="dms-plan-stats">
                                    <span>📂 ${this.countChildrenRecursive(plan.tree)} Dossiers</span>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        this.contentContainer.innerHTML = html;
        
        // Store plans for selection
        (window as any).dmsPlansData = plans;
    }

    selectRegistraturPlan(planIndex: number): void {
        const plans = (window as any).dmsPlansData;
        if (!plans || !plans[planIndex]) return;

        const selectedPlan = plans[planIndex];
        console.log('DMSScript: Selected Registraturplan:', selectedPlan.plan.name);
        
        this.permissions = selectedPlan.permissions;
        this.rootTree = selectedPlan.tree;
        this.navigateToNode(selectedPlan.tree);
    }

    private countChildrenRecursive(node: any): number {
        let count = 0;
        if (node.children) {
            count += node.children.length;
            for (const child of node.children) {
                count += this.countChildrenRecursive(child);
            }
        }
        return count;
    }

    private navigateToNode(node: DMSTreeNode): void {
        this.currentNode = node;
        this.updateCurrentPath(node);
        this.buildBreadcrumb(node);
        this.renderContent(node);
        this.updateToolbar(node);
        this.updateSidebarButtons();
        
        // Reinitialize language switching after navigation
        this.reinitializeLanguageSwitching();
    }

    private updateCurrentPath(node: DMSTreeNode): void {
        // Build real hierarchical path using the tree structure
        this.currentPath = this.buildRealNodePath(node);
    }

    private buildRealNodePath(targetNode: DMSTreeNode): DMSTreeNode[] {
        if (!this.rootTree) {
            // Fallback to old method if no tree is available
            console.log('No rootTree available, using fallback path');
            return [targetNode];
        }

        const path: DMSTreeNode[] = [];
        const found = this.findPathToNode(this.rootTree, targetNode, path);
        
        if (found) {
            console.log('Built real path:', path.map(n => `${n.type}:${n.name}`).join(' > '));
            return path;
        } else {
            console.log('Target node not found in tree, building path from metadata');
            // If target node not found in tree (e.g., document), try to build path from available information
            return this.buildPathFromMetadata(targetNode);
        }
    }

    private buildPathFromMetadata(targetNode: DMSTreeNode): DMSTreeNode[] {
        const path: DMSTreeNode[] = [];
        
        // Start with the root
        if (this.rootTree) {
            path.push(this.rootTree);
        }
        
        // Try to build path using parent information if available
        if (targetNode.parentId && this.rootTree) {
            const parent = this.findNodeById(this.rootTree, targetNode.parentId);
            if (parent) {
                // Find path to parent first
                const parentPath: DMSTreeNode[] = [];
                if (this.findPathToNode(this.rootTree, parent, parentPath)) {
                    // Use parent path and add target node
                    return [...parentPath, targetNode];
                }
            }
        }
        
        // If we can't build a proper path, at least include the current path we know about
        // and append the target node
        if (this.currentPath.length > 0) {
            const existingPath = [...this.currentPath];
            // Add target node if it's not already the last element
            const lastNode = existingPath[existingPath.length - 1];
            if (!lastNode || lastNode.id !== targetNode.id || lastNode.type !== targetNode.type) {
                existingPath.push(targetNode);
            }
            return existingPath;
        }
        
        // Final fallback
        return [targetNode];
    }

    private findPathToNode(currentNode: DMSTreeNode, targetNode: DMSTreeNode, path: DMSTreeNode[]): boolean {
        // Add current node to path
        path.push(currentNode);

        // Check if we found the target
        if (currentNode.id === targetNode.id && currentNode.type === targetNode.type) {
            return true;
        }

        // Recursively search children
        for (const child of currentNode.children) {
            if (this.findPathToNode(child, targetNode, path)) {
                return true;
            }
        }

        // If target not found in this branch, remove current node from path
        path.pop();
        return false;
    }

    private findNodeInTree(root: DMSTreeNode, nodeId: number, nodeType: string): DMSTreeNode | null {
        if (root.id === nodeId && root.type === nodeType) {
            return root;
        }

        for (const child of root.children) {
            const found = this.findNodeInTree(child, nodeId, nodeType);
            if (found) {
                return found;
            }
        }

        return null;
    }

    private navigateToBreadcrumbNode(nodeId: number, nodeType: string): void {
        // Handle special case for root navigation (id 0 means return to root)
        if (nodeId === 0 && nodeType === 'registraturplan') {
            this.loadRegistraturPlan();
            return;
        }
        
        if (!this.rootTree) {
            // Fallback to API navigation if no tree is available
            this.navigateToNodeById(nodeId, nodeType);
            return;
        }

        // Find the node in the cached tree
        const targetNode = this.findNodeInTree(this.rootTree, nodeId, nodeType);
        if (targetNode) {
            // Direct navigation using cached tree data
            this.navigateToNode(targetNode);
        } else {
            // Fallback to API navigation if node not found in cache
            this.navigateToNodeById(nodeId, nodeType);
        }
    }

    private buildBreadcrumb(currentNode: DMSTreeNode): void {
        // Build path from root to current node with proper hierarchy
        const path = this.buildNodePath(currentNode);
        
        // Add a "Root" element if we're not at the root and there are multiple root nodes
        if (path.length > 1 || (path.length === 1 && path[0].type !== 'registraturplan')) {
            const rootElement: DMSTreeNode = {
                id: 0,
                name: 'Registraturplan',
                type: 'registraturplan',
                children: [],
                parentId: undefined,
                metadata: {}
            };
            path.unshift(rootElement);
        }
        
        // Update only header breadcrumb
        this.updateBreadcrumb(path);
    }

    private buildNodePath(currentNode: DMSTreeNode): DMSTreeNode[] {
        // Use the currentPath array that tracks the full navigation path
        const path = [...this.currentPath];
        
        // If current node is not in path, add it
        if (!path.some(node => node.id === currentNode.id && node.type === currentNode.type)) {
            path.push(currentNode);
        }
        
        return path;
    }

    private findParentDossier(node: DMSTreeNode): DMSTreeNode | null {
        // Look through the current path to find the parent dossier
        const path = this.currentPath;
        for (let i = path.length - 2; i >= 0; i--) {
            if (path[i].type === 'dossier') {
                return path[i];
            }
        }
        
        // If not found in path, try to find in tree structure
        if (this.rootTree && node.parentId) {
            const parent = this.findNodeById(this.rootTree, node.parentId);
            if (parent && parent.type === 'dossier') {
                return parent;
            }
        }
        
        return null;
    }

    private findNodeById(rootNode: DMSTreeNode, targetId: number): DMSTreeNode | null {
        if (rootNode.id === targetId) {
            return rootNode;
        }
        
        if (rootNode.children) {
            for (const child of rootNode.children) {
                const found = this.findNodeById(child, targetId);
                if (found) {
                    return found;
                }
            }
        }
        
        return null;
    }


    private updateBreadcrumb(path: DMSTreeNode[]): void {
        if (!this.breadcrumbContainer) return;

        const breadcrumbHtml = path.map((node, index) => {
            const isLast = index === path.length - 1;
            const classes = isLast ? 'dms-breadcrumb-current' : 'dms-breadcrumb-link';
            
            if (isLast) {
                return `<span class="${classes}">${this.getNodeIcon(node.type)} ${node.name}</span>`;
            } else {
                return `<span class="${classes}" data-node-id="${node.id}" data-node-type="${node.type}">${this.getNodeIcon(node.type)} ${node.name}</span>`;
            }
        }).join(' <span class="dms-breadcrumb-separator">›</span> ');

        this.breadcrumbContainer.innerHTML = breadcrumbHtml;

        // Add click handlers for breadcrumb navigation
        this.breadcrumbContainer.querySelectorAll('.dms-breadcrumb-link').forEach(link => {
            link.addEventListener('click', (e) => {
                const nodeId = (e.target as HTMLElement).dataset.nodeId;
                const nodeType = (e.target as HTMLElement).dataset.nodeType;
                if (nodeId && nodeType) {
                    this.navigateToBreadcrumbNode(parseInt(nodeId), nodeType);
                }
            });
        });
    }

    private renderContent(node: DMSTreeNode): void {
        if (!this.contentContainer) return;

        let contentHtml = '';

        switch (node.type) {
            case 'registraturplan':
                contentHtml = this.renderRegistraturPlan(node);
                break;
            case 'registraturposition':
                contentHtml = this.renderRegistraturPosition(node);
                break;
            case 'dossier':
                contentHtml = this.renderDossier(node);
                break;
            case 'document':
                contentHtml = this.renderDocument(node);
                break;
        }

        this.contentContainer.innerHTML = contentHtml;
        this.attachContentEventListeners();
    }

    private renderRegistraturPlan(node: DMSTreeNode): string {
        const positions = node.children.filter(child => child.type === 'registraturposition');
        
        return `
            <div class="dms-header">
                <h2>${this.getNodeIcon(node.type)} ${node.name}</h2>
                <p class="dms-description">${node.metadata.beschreibung || ''}</p>
            </div>
            <div class="dms-tree-container">
                <div class="dms-tree-view">
                    ${this.renderTreeNode(node, 0)}
                </div>
            </div>
        `;
    }

    private renderTreeNode(node: DMSTreeNode, level: number): string {
        const hasChildren = node.children && node.children.length > 0;
        const hasLazyChildren = node.metadata && node.metadata.hasChildren === 'true' && node.metadata.lazy === 'true';
        const canExpand = hasChildren || hasLazyChildren;
        
        const indentClass = `dms-tree-level-${level}`;
        const expandIcon = canExpand ? '▶' : '';
        const nodeTypeClass = `dms-tree-node-${node.type}`;
        
        let content = `
            <div class="dms-tree-node ${nodeTypeClass} ${indentClass}" 
                 data-node-id="${node.id}" 
                 data-node-type="${node.type}"
                 data-level="${level}"
                 data-has-lazy-children="${hasLazyChildren}">
                <div class="dms-tree-node-content">
                    <span class="dms-tree-expand ${canExpand ? 'has-children' : ''}" 
                          data-expanded="false">
                        ${expandIcon}
                    </span>
                    <span class="dms-tree-icon">${this.getNodeIcon(node.type)}</span>
                    <span class="dms-tree-label">${node.name}</span>
                    ${this.renderTreeNodeMetadata(node)}
                </div>
        `;

        if (hasChildren) {
            content += `
                <div class="dms-tree-children" data-expanded="false" data-loaded="true">
                    ${node.children.map(child => this.renderTreeNode(child, level + 1)).join('')}
                </div>
            `;
        } else if (hasLazyChildren) {
            content += `
                <div class="dms-tree-children" data-expanded="false" data-loaded="false" data-loading="false">
                    <div class="dms-tree-loading">${i18n.t('dms.loading')}</div>
                </div>
            `;
        }

        content += `</div>`;
        return content;
    }

    private renderTreeNodeMetadata(node: DMSTreeNode): string {
        switch (node.type) {
            case 'registraturposition':
                return `<span class="dms-tree-metadata">Position ${node.metadata.positionNummer}</span>`;
            case 'dossier':
                return `<span class="dms-tree-metadata">${node.metadata.laufnummer}</span>`;
            case 'document':
                return `<span class="dms-tree-metadata">${node.metadata.status}</span>`;
            default:
                return '';
        }
    }

    private renderRegistraturPosition(node: DMSTreeNode): string {
        const dossiers = node.children.filter(child => child.type === 'dossier');
        
        return `
            <div class="dms-header">
                <h2>${this.getNodeIcon(node.type)} ${node.name}</h2>
                <p class="dms-description">${node.metadata.beschreibung || ''}</p>
                <div class="dms-metadata">
                    <span class="dms-position-number">Position: ${node.metadata.positionNummer}</span>
                </div>
            </div>
            <div class="dms-content-grid">
                ${dossiers.map(dossier => this.renderDossierCard(dossier)).join('')}
            </div>
        `;
    }

    private renderDossier(node: DMSTreeNode): string {
        const childDossiers = node.children.filter(child => child.type === 'dossier');
        const documents = node.children.filter(child => child.type === 'document');
        
        return `
            <div class="dms-header">
                <h2>${this.getNodeIcon(node.type)} ${node.name}</h2>
                <p class="dms-description">${node.metadata.beschreibung || ''}</p>
                <div class="dms-metadata">
                    <span class="dms-laufnummer">${i18n.t('dms.runningNumber')}: ${node.metadata.laufnummer}</span>
                    <span class="dms-status">${i18n.t('dms.status')}: ${node.metadata.status}</span>
                </div>
            </div>
            <div class="dms-content-sections">
                ${childDossiers.length > 0 ? `
                    <div class="dms-section">
                        <h3>Unterdossiers</h3>
                        <div class="dms-content-grid">
                            ${childDossiers.map(dossier => this.renderDossierCard(dossier)).join('')}
                        </div>
                    </div>
                ` : ''}
                ${documents.length > 0 ? `
                    <div class="dms-section">
                        <h3>${i18n.t('dms.documents')}</h3>
                        <div class="dms-content-list">
                            ${documents.map(document => this.renderDocumentCard(document)).join('')}
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
    }

    private renderDocument(node: DMSTreeNode): string {
        // Debug: Log permissions when rendering document
        console.log('DMSScript: Rendering document with permissions:', this.permissions);
        console.log('DMSScript: canManageVersions =', this.permissions.canManageVersions);
        
        // Start loading detailed document information
        setTimeout(() => this.loadDocumentDetails(node.id), 100);
        
        // Find parent dossier for back navigation
        const parentDossier = this.findParentDossier(node);
        
        return `
            <div class="dms-header">
                ${parentDossier ? `
                    <div class="dms-navigation-back">
                        <button class="dms-btn dms-btn-secondary dms-btn-sm" onclick="window.dmsManager?.navigateToNodeById(${parentDossier.id}, '${parentDossier.type}')">
                            ← ${i18n.t('common.back')} ${parentDossier.name}
                        </button>
                    </div>
                ` : ''}
                <h2>${this.getNodeIcon(node.type)} ${node.name}</h2>
                <p class="dms-description">${node.metadata.beschreibung || ''}</p>
                <div class="dms-basic-metadata">
                    <span class="dms-status">${i18n.t('dms.status')}: ${node.metadata.status}</span>
                </div>
            </div>
            
            <div class="dms-document-actions">
                <button class="dms-btn dms-btn-primary" onclick="window.dmsManager?.openDocumentInline(${node.id})">
                    📖 ${i18n.t('dms.open')}
                </button>
                <button class="dms-btn dms-btn-secondary" onclick="window.dmsManager?.downloadDocument(${node.id})">
                    📥 ${i18n.t('dms.downloadCurrentVersion')}
                </button>
                <button class="dms-btn dms-btn-secondary" onclick="window.dmsManager?.showDownloadOptions(event, ${node.id})">
                    📥 ${i18n.t('dms.allVersions')}
                </button>
                <button class="dms-btn dms-btn-secondary" onclick="window.dmsManager?.showVersionHistory(${node.id})">
                    📜 ${i18n.t('dms.versionHistory')}
                </button>
                ${this.permissions.canManageVersions ? `
                    <button class="dms-btn dms-btn-secondary" onclick="window.dmsManager?.uploadNewVersion(${node.id})">
                        📤 ${i18n.t('dms.uploadVersion')}
                    </button>
                ` : `<!-- Neue Version button hidden: canManageVersions=${this.permissions.canManageVersions} -->`}
                ${this.permissions.canDelete ? `
                    <button class="dms-btn dms-btn-danger dms-btn-sm" onclick="window.dmsManager?.showDeleteConfirmation(${node.id}, 'document', '${node.name.replace(/'/g, "\\'")}')">
                        🗑️ ${i18n.t('dms.delete')}
                    </button>
                ` : ''}
            </div>

            <!-- Document Details Container (will be populated dynamically) -->
            <div id="dms-document-details" class="dms-document-details">
                <div class="dms-loading">
                    <div class="dms-loading-spinner"></div>
                    <p>${i18n.t('common.loading')}...</p>
                </div>
            </div>
        `;
    }

    private renderPositionCard(position: DMSTreeNode): string {
        return `
            <div class="dms-card" data-node-id="${position.id}" data-node-type="${position.type}">
                <div class="dms-card-header">
                    <h3>${this.getNodeIcon(position.type)} ${position.name}</h3>
                    <span class="dms-position-number">${position.metadata.positionNummer}</span>
                </div>
                <div class="dms-card-content">
                    <p>${position.metadata.beschreibung || ''}</p>
                    <div class="dms-card-stats">
                        <span>${position.children.length} Dossiers</span>
                    </div>
                </div>
            </div>
        `;
    }

    private renderDossierCard(dossier: DMSTreeNode): string {
        return `
            <div class="dms-card" data-node-id="${dossier.id}" data-node-type="${dossier.type}">
                <div class="dms-card-header">
                    <h3>${this.getNodeIcon(dossier.type)} ${dossier.name}</h3>
                    <div class="dms-item-actions">
                        <span class="dms-laufnummer">${dossier.metadata.laufnummer}</span>
                        ${this.permissions.canWrite ? `
                            <button class="dms-btn dms-btn-secondary dms-btn-sm" 
                                    onclick="event.stopPropagation(); window.dmsManager?.showShareLinkModal(${dossier.id}, '${dossier.name.replace(/'/g, "\\'")}')"
                                    title="Öffentlichen Link verwalten">
                                🔗
                            </button>
                        ` : ''}
                        ${this.permissions.canDelete ? `
                            <button class="dms-btn dms-btn-danger dms-btn-sm" 
                                    onclick="event.stopPropagation(); window.dmsManager?.showDeleteConfirmation(${dossier.id}, 'dossier', '${dossier.name.replace(/'/g, "\\'")}')"
                                    title="${i18n.t('dms.deleteDossier')}">
                                🗑️
                            </button>
                        ` : ''}
                    </div>
                </div>
                <div class="dms-card-content">
                    <p>${dossier.metadata.beschreibung || ''}</p>
                    <div class="dms-card-stats">
                        <span>${dossier.children.length} Objekte</span>
                        <span class="dms-status">${dossier.metadata.status}</span>
                    </div>
                </div>
            </div>
        `;
    }

    private renderDocumentCard(document: DMSTreeNode): string {
        return `
            <div class="dms-document-card" data-node-id="${document.id}" data-node-type="${document.type}">
                <div class="dms-document-icon">
                    ${this.getDocumentIcon(document.metadata.mimeType)}
                </div>
                <div class="dms-document-info">
                    <h4>${document.name}</h4>
                    <p class="dms-document-meta">
                        ${i18n.t('dms.status')}: ${document.metadata.status}
                        ${document.metadata.aktuelleVersionId ? `• ${i18n.t('dms.version')}: ${document.metadata.aktuelleVersionId}` : ''}
                    </p>
                    <p class="dms-document-description">${document.metadata.beschreibung || ''}</p>
                </div>
                <div class="dms-document-actions">
                    <button class="dms-btn dms-btn-sm" 
                            onclick="window.dmsManager?.openDocumentInline(${document.id})"
                            title="${i18n.t('dms.openDocument')}">
                        📖
                    </button>
                    <button class="dms-btn dms-btn-sm" 
                            onclick="window.dmsManager?.downloadDocument(${document.id})"
                            title="${i18n.t('dms.downloadLatestVersion')}">
                        📥
                    </button>
                    <button class="dms-btn dms-btn-sm" 
                            onclick="window.dmsManager?.showVersionHistory(${document.id})"
                            title="${i18n.t('dms.showVersionHistory')}">
                        📜
                    </button>
                    <button class="dms-btn dms-btn-sm" 
                            onclick="window.dmsManager?.showDownloadOptions(event, ${document.id})"
                            title="${i18n.t('dms.downloadOptions')}">
                        ⋮
                    </button>
                    ${this.permissions.canDelete ? `
                        <button class="dms-btn dms-btn-danger dms-btn-sm" 
                                onclick="event.stopPropagation(); window.dmsManager?.showDeleteConfirmation(${document.id}, 'document', '${document.name.replace(/'/g, "\\'")}')"
                                title="${i18n.t('dms.deleteDocument')}">
                            🗑️
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    }

    private attachContentEventListeners(): void {
        // Add click handlers for navigation cards (legacy)
        document.querySelectorAll('.dms-card').forEach(card => {
            card.addEventListener('click', (e) => {
                const nodeId = (e.currentTarget as HTMLElement).dataset.nodeId;
                const nodeType = (e.currentTarget as HTMLElement).dataset.nodeType;
                if (nodeId && nodeType) {
                    this.navigateToNodeById(parseInt(nodeId), nodeType);
                }
            });
        });

        // Add click handlers for document cards (legacy)
        document.querySelectorAll('.dms-document-card').forEach(card => {
            card.addEventListener('click', (e) => {
                const nodeId = (e.currentTarget as HTMLElement).dataset.nodeId;
                const nodeType = (e.currentTarget as HTMLElement).dataset.nodeType;
                if (nodeId && nodeType) {
                    this.navigateToNodeById(parseInt(nodeId), nodeType);
                }
            });
        });

        // Add tree view event listeners
        this.attachTreeEventListeners();
    }

    private attachTreeEventListeners(): void {
        // Expand/collapse functionality
        document.querySelectorAll('.dms-tree-expand.has-children').forEach(expandBtn => {
            expandBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleTreeNode(e.target as HTMLElement);
            });
        });

        // Tree node click handlers
        document.querySelectorAll('.dms-tree-node-content').forEach(nodeContent => {
            nodeContent.addEventListener('click', (e) => {
                e.stopPropagation();
                
                const treeNode = (e.currentTarget as HTMLElement).closest('.dms-tree-node') as HTMLElement;
                if (!treeNode) return;

                const nodeId = treeNode.dataset.nodeId;
                const nodeType = treeNode.dataset.nodeType;
                
                if (nodeId && nodeType) {
                    // Update selection state
                    this.updateTreeSelection(treeNode);
                    
                    // Navigate to node if it's not the current registraturplan root
                    if (nodeType !== 'registraturplan') {
                        this.navigateToNodeById(parseInt(nodeId), nodeType);
                    }
                }
            });
        });
    }

    private async toggleTreeNode(expandBtn: HTMLElement): Promise<void> {
        const treeNode = expandBtn.closest('.dms-tree-node');
        if (!treeNode) return;

        const childrenContainer = treeNode.querySelector('.dms-tree-children') as HTMLElement;
        if (!childrenContainer) return;

        const isExpanded = expandBtn.dataset.expanded === 'true';
        const newExpandedState = !isExpanded;

        // Check if we need to load children
        if (newExpandedState && childrenContainer.dataset.loaded === 'false') {
            const nodeId = (treeNode as HTMLElement).dataset.nodeId;
            const nodeType = (treeNode as HTMLElement).dataset.nodeType;
            const hasLazyChildren = (treeNode as HTMLElement).dataset.hasLazyChildren === 'true';
            
            if (hasLazyChildren && nodeId && nodeType) {
                // Show loading state
                childrenContainer.dataset.loading = 'true';
                const loadingDiv = childrenContainer.querySelector('.dms-tree-loading');
                if (loadingDiv) {
                    (loadingDiv as HTMLElement).style.display = 'block';
                }
                
                try {
                    const children = await this.loadNodeChildren(parseInt(nodeId), nodeType);
                    
                    // Replace loading with actual children
                    const childrenHtml = children.map(child => 
                        this.renderTreeNode(child, parseInt((treeNode as HTMLElement).dataset.level || '0') + 1)
                    ).join('');
                    
                    childrenContainer.innerHTML = childrenHtml;
                    childrenContainer.dataset.loaded = 'true';
                    
                    // Re-attach event listeners for new nodes
                    this.attachTreeEventListeners();
                    
                } catch (error) {
                    console.error('Error loading tree children:', error);
                    
                    // Show error state
                    childrenContainer.innerHTML = `<div class="dms-tree-error">${i18n.t('dms.errorLoadingDossierInfo')}</div>`;
                }
                
                childrenContainer.dataset.loading = 'false';
            }
        }

        // Update button state
        expandBtn.dataset.expanded = newExpandedState.toString();
        expandBtn.textContent = newExpandedState ? '▼' : '▶';

        // Update children visibility
        childrenContainer.dataset.expanded = newExpandedState.toString();
    }

    private async loadNodeChildren(nodeId: number, nodeType: string): Promise<DMSTreeNode[]> {
        const response = await fetch(`/dms/tree/${nodeType}/${nodeId}/children`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to load children: ${response.statusText}`);
        }

        const data = await response.json();
        return data.children || [];
    }

    private updateTreeSelection(selectedNode: HTMLElement): void {
        // Remove previous selection
        document.querySelectorAll('.dms-tree-node.selected').forEach(node => {
            node.classList.remove('selected');
        });

        // Add selection to clicked node
        selectedNode.classList.add('selected');
    }

    private updateToolbar(node: DMSTreeNode): void {
        if (!this.toolbarContainer) return;

        let toolbarHtml = '';

        // Allow creating registraturposition when viewing registraturplan
        if (this.permissions.canWrite && node.type === 'registraturplan') {
            toolbarHtml += `
                <button class="dms-btn dms-btn-primary" onclick="window.dmsManager?.createRegistraturPosition(${node.id})">
                    📊 ${i18n.t('dms.newRegistrationPosition')}
                </button>
            `;
        }

        if (this.permissions.canCreateDossier && (node.type === 'registraturposition' || node.type === 'dossier')) {
            toolbarHtml += `
                <button class="dms-btn dms-btn-primary" onclick="window.dmsManager?.createDossier(${node.id}, '${node.type}')">
                    📁 ${i18n.t('dms.newDossier')}
                </button>
            `;
        }

        if (this.permissions.canCreateDocument && node.type === 'dossier') {
            toolbarHtml += `
                <button class="dms-btn dms-btn-secondary" onclick="window.dmsManager?.createDocument(${node.id})">
                    📄 ${i18n.t('dms.newDocument')}
                </button>
            `;
        }

        toolbarHtml += `
            <button class="dms-btn dms-btn-secondary" onclick="window.dmsManager?.refreshCurrentView()">
                🔄 ${i18n.t('dms.refresh')}
            </button>
        `;

        // Add Papierkorb button if user has delete permissions
        if (this.permissions.canDelete) {
            toolbarHtml += `
                <button class="dms-btn dms-btn-secondary dms-btn-sm" onclick="window.dmsManager?.showDeletedItems()" title="${i18n.t('dms.showDeletedItems')}">
                    🗂️ ${i18n.t('dms.trash')}
                </button>
            `;
        }

        this.toolbarContainer.innerHTML = toolbarHtml;
    }

    private getNodeIcon(type: string): string {
        switch (type) {
            case 'registraturplan': return '📋';
            case 'registraturposition': return '📊';
            case 'dossier': return '📁';
            case 'document': return '📄';
            default: return '📄';
        }
    }

    private getDocumentIcon(mimeType: string): string {
        if (mimeType?.startsWith('image/')) return '🖼️';
        if (mimeType?.includes('pdf')) return '📕';
        if (mimeType?.includes('word')) return '📘';
        if (mimeType?.includes('excel')) return '📗';
        if (mimeType?.includes('powerpoint')) return '📙';
        return '📄';
    }

    public async navigateToNodeById(id: number, type: string): Promise<void> {
        try {
            let endpoint = '';
            switch (type) {
                case 'registraturposition':
                    endpoint = `/dms/registraturposition/${id}`;
                    break;
                case 'dossier':
                    endpoint = `/dms/dossier/${id}`;
                    break;
                case 'document':
                    endpoint = `/dms/document/${id}`;
                    break;
                default:
                    // For other types, we might need to reconstruct the tree
                    this.loadRegistraturPlan();
                    return;
            }

            const response = await fetch(endpoint, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to load node');
            }

            const data = await response.json();
            console.log('DMSScript: Setting permissions from API:', data.permissions);
            this.permissions = data.permissions;
            
            // Create a tree node from the response
            let nodeData, children = [];
            
            switch (type) {
                case 'registraturposition':
                    nodeData = data.registraturposition;
                    // Convert dossiers to tree nodes
                    if (data.dossiers) {
                        children = data.dossiers.map((dossier: any) => ({
                            id: dossier.id,
                            name: dossier.name,
                            type: 'dossier',
                            parentId: id,
                            children: [],
                            metadata: dossier
                        }));
                    }
                    break;
                case 'dossier':
                    nodeData = data.dossier;
                    // Convert child dossiers and documents to tree nodes
                    if (data.childDossiers) {
                        children = data.childDossiers.map((dossier: any) => ({
                            id: dossier.id,
                            name: dossier.name,
                            type: 'dossier',
                            parentId: id,
                            children: [],
                            metadata: dossier
                        }));
                    }
                    if (data.documents) {
                        children.push(...data.documents.map((document: any) => ({
                            id: document.id,
                            name: document.titel,
                            type: 'document',
                            parentId: id,
                            children: [],
                            metadata: document
                        })));
                    }
                    break;
                case 'document':
                    nodeData = data.document;
                    break;
                default:
                    nodeData = {};
            }
            
            const node: DMSTreeNode = {
                id: id,
                name: nodeData?.name || nodeData?.titel || 'Unknown',
                type: type as any,
                parentId: nodeData?.parentId || nodeData?.parentDossierId || nodeData?.registraturPositionId,
                children: children,
                metadata: nodeData || {}
            };

            this.navigateToNode(node);
        } catch (error) {
            console.error('Error navigating to node:', error);
            this.showError(i18n.t('dms.errorLoadingDossierInfo'));
        }
    }


    private async handleFileUpload(files: FileList): Promise<void> {
        for (const file of Array.from(files)) {
            try {
                const formData = new FormData();
                formData.append('file', file);

                const response = await fetch('/dms/upload', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                        'X-File-Name': file.name,
                        'X-File-Type': file.type
                    },
                    body: file
                });

                if (!response.ok) {
                    throw new Error('Upload failed');
                }

                const result = await response.json();
                console.log('File uploaded:', result);
                console.log('isDuplicate:', result.isDuplicate);
                console.log('message:', result.message);
                
                if (result.isDuplicate) {
                    // Show deduplication message (info, not error)
                    console.log('Showing deduplication info message');
                    this.showInfo(`${file.name}: ${result.message}`);
                } else {
                    this.showSuccess(i18n.t('dms.fileUploadedSuccessfully').replace('{0}', file.name));
                }
            } catch (error) {
                console.error('Error uploading file:', error);
                this.showError(`${i18n.t('materials.uploadError')}: ${file.name}`);
            }
        }
    }

    // Public methods for UI interactions
    public createRegistraturPosition(registraturPlanId: number): void {
        // Store the plan ID for form submission
        (window as any).currentRegistraturPlanId = registraturPlanId;
        
        // Reset form
        const form = document.getElementById('dms-create-registraturposition-form') as HTMLFormElement;
        if (form) {
            form.reset();
        }
        
        // Show modal
        const modal = document.getElementById('dms-create-registraturposition-modal');
        if (modal) {
            modal.style.display = 'flex';
            
            // Focus on first input
            setTimeout(() => {
                const nameInput = document.getElementById('registraturposition-name') as HTMLInputElement;
                nameInput?.focus();
            }, 100);
        }
    }

    public async createDossier(parentId: number, parentType?: string): Promise<void> {
        // Check billing before proceeding
        const canProceed = await BillingIntegration.checkBeforeOperation('DOSSIER_CREATE');
        if (!canProceed) {
            return;
        }
        // Reset form
        const form = document.getElementById('dms-create-dossier-form') as HTMLFormElement;
        if (form) {
            form.reset();
        }
        
        // Store context information for form population
        (window as any).currentParentContext = {
            id: parentId,
            type: parentType || 'registraturposition'
        };
        
        // Populate dropdowns based on context
        if (parentType === 'dossier') {
            // When called from a dossier, we need to get the dossier's registraturposition
            // and pre-select the dossier as parent
            this.populateFromDossierContext(parentId);
        } else {
            // When called from a registraturposition, use the old logic
            this.populateRegistraturpositionDropdown(parentId);
            this.populateParentDossierDropdown();
        }
        
        // Show modal
        const modal = document.getElementById('dms-create-dossier-modal');
        if (modal) {
            modal.style.display = 'flex';
            
            // Set up event listeners for form interactions
            setTimeout(() => {
                this.setupDossierFormEventListeners();
                
                // Ensure registraturposition field starts in the correct state
                this.initializeRegistraturpositionFieldState();
                
                // Focus on first dropdown
                const dropdown = document.getElementById('dossier-registraturposition') as HTMLSelectElement;
                dropdown?.focus();
            }, 100);
        }
    }

    private async populateRegistraturpositionDropdown(selectedId?: number): Promise<void> {
        try {
            console.log('[DMS] populateRegistraturpositionDropdown: Loading registraturplan');
            const response = await fetch('/dms/registraturplan', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to load Registraturplan');
            }

            const data = await response.json();
            const tree = data.tree || data;
            console.log('[DMS] populateRegistraturpositionDropdown: Tree loaded:', tree);
            
            const dropdown = document.getElementById('dossier-registraturposition') as HTMLSelectElement;
            if (!dropdown) {
                console.error('[DMS] populateRegistraturpositionDropdown: Dropdown element not found');
                return;
            }

            // Clear existing options except the first one
            dropdown.innerHTML = `<option value="">${i18n.t('dms.pleaseSelect')}</option>`;

            // Since the tree uses lazy loading, we need to load the children (registraturpositions) separately
            console.log('[DMS] populateRegistraturpositionDropdown: Loading children for registraturplan ID:', tree.id);
            const childrenResponse = await fetch(`/dms/tree/registraturplan/${tree.id}/children`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                }
            });

            if (!childrenResponse.ok) {
                throw new Error('Failed to load registraturpositions');
            }

            const childrenData = await childrenResponse.json();
            const positions = childrenData.children || [];
            console.log('[DMS] populateRegistraturpositionDropdown: Loaded positions:', positions);

            // Add Registraturpositions to dropdown
            positions.forEach((position: DMSTreeNode) => {
                if (position.type === 'registraturposition') {
                    const option = document.createElement('option');
                    option.value = position.id.toString();
                    option.textContent = `${position.name} (Position ${position.metadata.positionNummer})`;
                    
                    // Pre-select if this was the context where dossier creation was triggered
                    if (selectedId && position.id === selectedId) {
                        option.selected = true;
                    }
                    
                    dropdown.appendChild(option);
                }
            });

            console.log('[DMS] populateRegistraturpositionDropdown: Populated dropdown with', positions.length, 'positions');
        } catch (error) {
            console.error('Error loading Registraturpositions:', error);
            this.showError(i18n.t('dms.errorLoadingDossierInfo'));
        }
    }

    private async populateParentDossierDropdown(preSelectId?: number): Promise<void> {
        console.log('populateParentDossierDropdown:', preSelectId);
        try {
            const response = await fetch(`/dms/dossier`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                }
            });
            if (!response.ok) {
                throw new Error('Failed to load Dossiers');
            }
            const data = await response.json();
            console.log('received data:', data);
            const dropdown = document.getElementById('dossier-parent') as HTMLSelectElement;
            if (!dropdown) return;
            // Clear existing options except the first one
            dropdown.innerHTML = `<option value="">${i18n.t('dms.pleaseSelect')}</option>`;
            if (data.dossier) {
                data.dossier.forEach((dos: DMSDossier) => {
                    const option = document.createElement('option');
                    option.value = dos.id.toString();
                    option.textContent = `${dos.laufnummer} - ${dos.name}`;
                    
                    // Pre-select if this matches the preSelectId
                    if (preSelectId && dos.id === preSelectId) {
                        option.selected = true;
                    }
                    
                    dropdown.appendChild(option);
                });
            }
        } catch (error) {
            console.error('Error loading Dossiers:', error);
            this.showError(i18n.t('dms.errorLoadingDossierInfo'));
        }
    }

    private async populateFromDossierContext(dossierId: number): Promise<void> {
        try {
            // First, get the dossier details to find its registraturposition
            const dossierResponse = await fetch(`/dms/dossier/${dossierId}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                }
            });
            
            if (!dossierResponse.ok) {
                throw new Error('Failed to load Dossier details');
            }
            
            const dossierData = await dossierResponse.json();
            const dossier = dossierData.dossier as DMSDossier;
            
            if (dossier) {
                // Populate registraturposition dropdown and pre-select the dossier's position
                await this.populateRegistraturpositionDropdown(dossier.registraturPositionId);
                
                // Populate parent dossier dropdown and pre-select the current dossier
                await this.populateParentDossierDropdown(dossierId);
            } else {
                // Fallback to default behavior
                await this.populateRegistraturpositionDropdown();
                await this.populateParentDossierDropdown();
            }
        } catch (error) {
            console.error('Error loading dossier context:', error);
            this.showError(i18n.t('dms.errorLoadingDossierInfo'));
            
            // Fallback to default behavior
            await this.populateRegistraturpositionDropdown();
            await this.populateParentDossierDropdown();
        }
    }

    private async updateRegistraturpositionFromParentDossier(parentDossierId: string): Promise<void> {
        const registraturPositionDropdown = document.getElementById('dossier-registraturposition') as HTMLSelectElement;
        if (!registraturPositionDropdown) return;

        if (!parentDossierId || parentDossierId.trim() === '') {
            // If no parent dossier is selected, re-enable registraturposition dropdown for manual selection
            registraturPositionDropdown.disabled = false;
            return;
        }

        try {
            // Get the parent dossier details to find its registraturposition
            const response = await fetch(`/dms/dossier/${parentDossierId}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                }
            });
            
            if (!response.ok) {
                throw new Error('Failed to load Parent Dossier details');
            }
            
            const data = await response.json();
            const parentDossier = data.dossier as DMSDossier;
            
            if (parentDossier) {
                // Update the registraturposition dropdown to select the parent dossier's position
                registraturPositionDropdown.value = parentDossier.registraturPositionId.toString();
                
                // Disable the registraturposition dropdown since it's now determined by parent dossier
                registraturPositionDropdown.disabled = true;
                
                console.log('Updated registraturposition to:', parentDossier.registraturPositionId);
            }
        } catch (error) {
            console.error('Error updating registraturposition from parent dossier:', error);
            this.showError(i18n.t('dms.errorLoadingDossierInfo'));
            
            // Re-enable dropdown on error
            registraturPositionDropdown.disabled = false;
        }
    }

    private setupDossierFormEventListeners(): void {
        // Set up event listener for parent dossier dropdown changes
        const parentDossierDropdown = document.getElementById('dossier-parent') as HTMLSelectElement;
        if (parentDossierDropdown) {
            // Remove existing listeners to avoid duplicates
            parentDossierDropdown.removeEventListener('change', this.handleParentDossierChange.bind(this));
            
            // Add the change event listener
            parentDossierDropdown.addEventListener('change', this.handleParentDossierChange.bind(this));
        }
    }

    private handleParentDossierChange(event: Event): void {
        const dropdown = event.target as HTMLSelectElement;
        const selectedValue = dropdown.value;
        
        // Update registraturposition based on selected parent dossier
        this.updateRegistraturpositionFromParentDossier(selectedValue);
    }

    private initializeRegistraturpositionFieldState(): void {
        const registraturPositionDropdown = document.getElementById('dossier-registraturposition') as HTMLSelectElement;
        const parentDossierDropdown = document.getElementById('dossier-parent') as HTMLSelectElement;
        
        if (!registraturPositionDropdown || !parentDossierDropdown) return;

        // Check if a parent dossier is already selected (pre-filled)
        if (parentDossierDropdown.value && parentDossierDropdown.value.trim() !== '') {
            // Parent dossier is selected, make registraturposition field read-only
            registraturPositionDropdown.disabled = true;
        } else {
            // No parent dossier selected, ensure registraturposition field is enabled
            registraturPositionDropdown.disabled = false;
        }
    }

    private updateSidebarButtons(): void {
        const createDocumentBtn = document.getElementById('sidebar-create-document-btn') as HTMLButtonElement;
        
        if (createDocumentBtn) {
            // Enable the button only when in a dossier context
            const canCreateDocument = this.currentNode && this.currentNode.type === 'dossier';
            createDocumentBtn.disabled = !canCreateDocument;
            
            if (canCreateDocument && this.currentNode) {
                createDocumentBtn.title = `Dokument in "${this.currentNode.name}" erstellen`;
            } else {
                createDocumentBtn.title = i18n.t('dms.selectDossierToCreateDocument');
            }
        }
    }

    public createDocumentFromSidebar(): void {
        if (this.currentNode && this.currentNode.type === 'dossier') {
            this.createDocument(this.currentNode.id);
        } else {
            this.showError(i18n.t('dms.pleaseSelectDossier'));
        }
    }

    public async createDocument(dossierId: number): Promise<void> {
        // Check billing before proceeding
        const canProceed = await BillingIntegration.checkBeforeOperation('DOCUMENT_CREATE');
        if (!canProceed) {
            return;
        }
        
        // Store the dossier ID for the document creation
        (window as any).currentDossierId = dossierId;
        
        // Reset the form
        const form = document.getElementById('dms-create-document-form') as HTMLFormElement;
        if (form) {
            form.reset();
        }
        
        // Clear any previous file selections
        this.clearDocumentFileSelection();
        
        // Set the dossier ID in the hidden field
        const dossierIdField = document.getElementById('document-dossier-id') as HTMLInputElement;
        if (dossierIdField) {
            dossierIdField.value = dossierId.toString();
        }
        
        // Load and display dossier information
        this.loadTargetDossierInfo(dossierId);
        
        // Set up file upload listeners only if not handling button upload
        if (!this.isHandlingButtonUpload) {
            this.setupDocumentFileUploadListeners();
        }
        
        // Show the modal
        const modal = document.getElementById('dms-create-document-modal');
        if (modal) {
            modal.style.display = 'flex';
            
            // Focus on the title field after a short delay
            setTimeout(() => {
                const titleInput = document.getElementById('document-titel') as HTMLInputElement;
                titleInput?.focus();
            }, 100);
        }
    }

    private clearDocumentFileSelection(): void {
        const filePreview = document.getElementById('dms-document-file-preview');
        const uploadZone = document.getElementById('dms-document-upload-zone');
        const fileInput = document.getElementById('dms-document-file-input') as HTMLInputElement;
        const submitButton = document.getElementById('dms-create-document-submit') as HTMLButtonElement;
        
        if (filePreview) filePreview.style.display = 'none';
        if (uploadZone) uploadZone.style.display = 'flex';
        if (fileInput) fileInput.value = '';
        if (submitButton) submitButton.disabled = true;
        
        // Clear hidden fields
        ['document-file-hash', 'document-file-size', 'document-mime-type', 'document-file-name'].forEach(id => {
            const field = document.getElementById(id) as HTMLInputElement;
            if (field) field.value = '';
        });
    }

    private async loadTargetDossierInfo(dossierId: number): Promise<void> {
        try {
            const response = await fetch(`/dms/dossier/${dossierId}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to load dossier information');
            }

            const data = await response.json();
            const dossier = data.dossier as DMSDossier;

            const dossierNameElement = document.getElementById('dms-target-dossier-name');
            if (dossierNameElement && dossier) {
                dossierNameElement.textContent = `${dossier.laufnummer} - ${dossier.name}`;
            }
        } catch (error) {
            console.error('Error loading dossier info:', error);
            const dossierNameElement = document.getElementById('dms-target-dossier-name');
            if (dossierNameElement) {
                dossierNameElement.textContent = i18n.t('dms.errorLoadingDossierInfo');
            }
        }
    }

    private setupDocumentFileUploadListeners(): void {
        // Skip if handling button upload to prevent file dialogs
        if (this.isHandlingButtonUpload) {
            console.log('Skipping file upload listener setup - button upload in progress');
            return;
        }
        const uploadZone = document.getElementById('dms-document-upload-zone');
        const fileInput = document.getElementById('dms-document-file-input') as HTMLInputElement;

        if (!uploadZone || !fileInput) return;

        // Remove existing listeners to avoid duplicates
        const newUploadZone = uploadZone.cloneNode(true) as HTMLElement;
        const newFileInput = fileInput.cloneNode(true) as HTMLInputElement;
        
        uploadZone.parentNode?.replaceChild(newUploadZone, uploadZone);
        fileInput.parentNode?.replaceChild(newFileInput, fileInput);

        // Click to select file
        newUploadZone.addEventListener('click', () => {
            // Skip if we're handling a button upload
            if (this.isHandlingButtonUpload) {
                return;
            }
            newFileInput.click();
        });

        // File selection change
        newFileInput.addEventListener('change', (e) => {
            const files = (e.target as HTMLInputElement).files;
            if (files && files.length > 0) {
                this.handleDocumentFileSelection(files[0]);
            }
        });

        // Drag and drop
        newUploadZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            newUploadZone.classList.add('dms-drag-over');
        });

        newUploadZone.addEventListener('dragleave', (e) => {
            e.preventDefault();
            newUploadZone.classList.remove('dms-drag-over');
        });

        newUploadZone.addEventListener('drop', (e) => {
            e.preventDefault();
            newUploadZone.classList.remove('dms-drag-over');
            
            const files = e.dataTransfer?.files;
            if (files && files.length > 0) {
                this.handleDocumentFileSelection(files[0]);
            }
        });
    }

    private async handleDocumentFileSelection(file: File): Promise<void> {
        // Validate file size (50MB limit)
        const maxSize = 50 * 1024 * 1024; // 50MB in bytes
        if (file.size > maxSize) {
            this.showError(`${i18n.t('materials.fileTooLarge')} (50MB)`);
            return;
        }

        // Update file preview
        this.updateFilePreview(file);
        
        // Auto-fill title from filename if title is empty
        const titleInput = document.getElementById('document-titel') as HTMLInputElement;
        if (titleInput && !titleInput.value.trim()) {
            const fileName = file.name;
            const nameWithoutExt = fileName.substring(0, fileName.lastIndexOf('.')) || fileName;
            titleInput.value = nameWithoutExt;
        }

        // Upload the file
        await this.uploadDocumentFile(file);
    }

    private updateFilePreview(file: File): void {
        const uploadZone = document.getElementById('dms-document-upload-zone');
        const filePreview = document.getElementById('dms-document-file-preview');
        const fileIcon = document.getElementById('dms-file-icon');
        const fileName = document.getElementById('dms-file-name');
        const fileSize = document.getElementById('dms-file-size');
        const fileType = document.getElementById('dms-file-type');

        if (uploadZone) uploadZone.style.display = 'none';
        if (filePreview) filePreview.style.display = 'block';

        if (fileIcon) fileIcon.textContent = this.getDocumentIcon(file.type);
        if (fileName) fileName.textContent = file.name;
        if (fileSize) fileSize.textContent = this.formatFileSize(file.size);
        if (fileType) fileType.textContent = file.type || 'Unknown';
    }

    private formatFileSize(bytes: number): string {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    private async uploadDocumentFile(file: File): Promise<void> {
        const progressContainer = document.getElementById('dms-upload-progress');
        const progressFill = document.getElementById('dms-progress-fill');
        const progressText = document.getElementById('dms-progress-text');
        const successContainer = document.getElementById('dms-upload-success');

        try {
            if (progressContainer) progressContainer.style.display = 'block';
            if (successContainer) successContainer.style.display = 'none';

            const response = await fetch('/dms/upload', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                    'X-File-Name': file.name,
                    'X-File-Type': file.type
                },
                body: file
            });

            if (!response.ok) {
                throw new Error('Upload failed');
            }

            const result = await response.json();

            // Handle deduplication message
            if (result.isDuplicate) {
                this.showInfo(result.message || i18n.t('dms.fileDuplicateOptimized'));
            }

            // Store upload result in hidden fields
            this.updateHiddenFields({
                hash: result.hash,
                size: result.size,
                mimeType: result.mimeType || file.type,
                filename: result.filename || file.name
            });

            // Show success
            if (progressContainer) progressContainer.style.display = 'none';
            if (successContainer) successContainer.style.display = 'block';

            // Enable submit button
            const submitButton = document.getElementById('dms-create-document-submit') as HTMLButtonElement;
            if (submitButton) submitButton.disabled = false;

        } catch (error) {
            console.error('Error uploading file:', error);
            this.showError(`${i18n.t('materials.uploadError')}: ${(error as Error).message}`);
            
            // Hide progress on error
            if (progressContainer) progressContainer.style.display = 'none';
        }
    }

    private updateHiddenFields(uploadResult: { hash: string, size: number, mimeType: string, filename: string }): void {
        const fields = {
            'document-file-hash': uploadResult.hash,
            'document-file-size': uploadResult.size.toString(),
            'document-mime-type': uploadResult.mimeType,
            'document-file-name': uploadResult.filename
        };

        Object.entries(fields).forEach(([id, value]) => {
            const field = document.getElementById(id) as HTMLInputElement;
            if (field) field.value = value;
        });
    }

    public removeSelectedFile(): void {
        this.clearDocumentFileSelection();
    }

    public async downloadDocument(documentId: number): Promise<void> {
        try {
            console.log('Starting download for document:', documentId);
            
            // Show download progress indicator
            this.showDownloadProgress(`${i18n.t('common.loading')}...`);
            
            // First, get document details to find the current version
            const documentResponse = await fetch(`/dms/document/${documentId}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                }
            });

            if (!documentResponse.ok) {
                throw new Error(i18n.t('dms.documentNotFound'));
            }

            const documentData = await documentResponse.json();
            const documentInfo = documentData.document;
            const versions = documentData.versions;

            if (!versions || versions.length === 0) {
                throw new Error(i18n.t('dms.noVersionsFoundForDocument'));
            }

            // Get the current version (highest version number)
            const currentVersion = versions.reduce((latest: any, current: any) => 
                current.versionsnummer > latest.versionsnummer ? current : latest
            );

            console.log('Downloading version:', currentVersion);

            // Update progress
            this.updateDownloadProgress(`${i18n.t('common.loading')} ${currentVersion.dateiname}...`);

            // Download the file using the hash
            const downloadUrl = `/dms/file/${currentVersion.hashWert}`;
            
            console.log('Download URL:', downloadUrl);
            console.log('File hash:', currentVersion.hashWert);
            console.log('File name:', currentVersion.dateiname);
            
            // Use fetch to download with progress tracking
            const response = await fetch(downloadUrl, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                }
            });

            if (!response.ok) {
                let errorMessage = `Download fehlgeschlagen: ${response.status} ${response.statusText}`;
                
                try {
                    const errorData = await response.json();
                    if (errorData.error) {
                        errorMessage = errorData.error;
                    }
                } catch (e) {
                    // If response is not JSON, use the status text
                    console.log('Could not parse error response as JSON');
                }
                
                console.error('Download failed:', errorMessage);
                
                if (response.status === 404) {
                    throw new Error(`Datei wurde nicht gefunden: ${errorMessage}`);
                } else if (response.status === 403) {
                    throw new Error('Keine Berechtigung zum Herunterladen dieser Datei');
                } else {
                    throw new Error(errorMessage);
                }
            }

            // Get the content type and filename from headers
            const contentType = response.headers.get('Content-Type') || 'application/octet-stream';
            const contentDisposition = response.headers.get('Content-Disposition');
            let fileName = currentVersion.dateiname;
            
            // Try to extract filename from Content-Disposition header
            if (contentDisposition) {
                const fileNameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
                if (fileNameMatch && fileNameMatch[1]) {
                    fileName = fileNameMatch[1].replace(/['"]/g, '');
                }
            }

            // Convert response to blob
            const blob = await response.blob();
            
            // Create download link and trigger download
            const downloadLink = document.createElement('a');
            const blobUrl = window.URL.createObjectURL(blob);
            
            downloadLink.href = blobUrl;
            downloadLink.download = fileName;
            downloadLink.style.display = 'none';
            
            // Add to DOM, click, and remove
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
            
            // Clean up the blob URL
            setTimeout(() => {
                window.URL.revokeObjectURL(blobUrl);
            }, 1000);

            // Show success message
            this.hideDownloadProgress();
            this.showSuccess(i18n.t('dms.fileDownloaded').replace('{0}', fileName));

            console.log('Download completed for:', fileName);

        } catch (error) {
            console.error('Error downloading document:', error);
            this.hideDownloadProgress();
            this.showError(`${i18n.t('materials.downloadError')}: ${(error as Error).message}`);
        }
    }

    public async openDocumentInline(documentId: number): Promise<void> {
        try {
            console.log('Opening document inline:', documentId);
            
            // Show loading indicator
            this.showDownloadProgress(i18n.t('dms.openingDocument'));
            
            // First, get document details to find the current version
            const documentResponse = await fetch(`/dms/document/${documentId}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                }
            });

            if (!documentResponse.ok) {
                throw new Error(i18n.t('dms.documentNotFound'));
            }

            const documentData = await documentResponse.json();
            const documentInfo = documentData.document;
            const versions = documentData.versions;

            if (!versions || versions.length === 0) {
                throw new Error(i18n.t('dms.noVersionsFoundForDocument'));
            }

            // Get the current version (highest version number)
            const currentVersion = versions.reduce((latest: any, current: any) => 
                current.versionsnummer > latest.versionsnummer ? current : latest
            );

            // Check if the document is a PDF
            const isPDF = currentVersion.dateiname.toLowerCase().endsWith('.pdf') || 
                         currentVersion.mimeType === 'application/pdf';

            if (!isPDF) {
                // For non-PDF files, fall back to download
                this.hideDownloadProgress();
                await this.downloadDocument(documentId);
                return;
            }

            // Fetch the PDF file
            const fileResponse = await fetch(`/dms/file/${currentVersion.hashWert}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                }
            });

            if (!fileResponse.ok) {
                throw new Error(i18n.t('dms.fileCouldNotBeLoaded'));
            }

            const blob = await fileResponse.blob();
            this.hideDownloadProgress();

            // Show PDF in inline viewer
            this.showPdfOverlay(blob, currentVersion.dateiname, localStorage.getItem('authToken') || '');

        } catch (error) {
            console.error('Error opening document inline:', error);
            this.hideDownloadProgress();
            this.showError(`${i18n.t('common.error')}: ${(error as Error).message}`);
        }
    }

    private showPdfOverlay(blob: Blob, filename: string, authToken: string): void {
        // Remove any existing PDF modal
        const existingModal = document.getElementById('pdf-modal');
        if (existingModal) {
            existingModal.remove();
        }

        // Create blob URL for the PDF
        const pdfUrl = URL.createObjectURL(blob);

        // Create modal HTML
        const modalHtml = `
            <div id="pdf-modal" class="pdf-modal">
                <div class="pdf-modal-content">
                    <div class="pdf-modal-header">
                        <h3>${filename}</h3>
                        <div class="pdf-modal-controls">
                            <button onclick="window.dmsManager?.downloadPdfFromModal('${pdfUrl}', '${filename}')" 
                                    class="dms-btn dms-btn-sm" title="PDF herunterladen">
                                📥 Download
                            </button>
                            <button onclick="window.dmsManager?.closePdfModal()" 
                                    class="dms-btn dms-btn-sm" title="${i18n.t('dms.close')}">
                                ✕
                            </button>
                        </div>
                    </div>
                    <div class="pdf-modal-body">
                        <embed src="${pdfUrl}" 
                               type="application/pdf" 
                               width="100%" 
                               height="100%" 
                               class="pdf-embed">
                        <p>${i18n.t('dms.browserDoesNotSupportPdf')} 
                           <a href="${pdfUrl}" target="_blank">${i18n.t('dms.clickToOpenPdf')}</a>.</p>
                    </div>
                </div>
            </div>
        `;

        // Add modal to page
        document.body.insertAdjacentHTML('beforeend', modalHtml);

        // Store the blob URL for cleanup
        (window as any).currentPdfUrl = pdfUrl;
    }

    public downloadPdfFromModal(pdfUrl: string, filename: string): void {
        const link = document.createElement('a');
        link.href = pdfUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    public closePdfModal(): void {
        const modal = document.getElementById('pdf-modal');
        if (modal) {
            modal.remove();
        }
        
        // Clean up blob URL
        if ((window as any).currentPdfUrl) {
            URL.revokeObjectURL((window as any).currentPdfUrl);
            delete (window as any).currentPdfUrl;
        }
    }

    public async downloadSpecificVersion(documentId: number, versionId: number): Promise<void> {
        try {
            console.log('Starting download for document version:', documentId, versionId);
            
            // Show download progress indicator
            this.showDownloadProgress(`${i18n.t('common.loading')}...`);
            
            // Get specific version details
            const versionResponse = await fetch(`/dms/document/${documentId}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                }
            });

            if (!versionResponse.ok) {
                throw new Error(i18n.t('dms.documentVersionNotFound'));
            }

            const versionData = await versionResponse.json();
            const versions = versionData.versions;
            
            const specificVersion = versions.find((v: any) => v.id === versionId);
            if (!specificVersion) {
                throw new Error(i18n.t('dms.selectedVersionNotFound'));
            }

            console.log('Downloading specific version:', specificVersion);

            // Update progress
            this.updateDownloadProgress(`${i18n.t('common.loading')} ${specificVersion.dateiname} (${i18n.t('common.version')} ${specificVersion.versionsnummer})...`);

            // Download the file using the hash
            const downloadUrl = `/dms/file/${specificVersion.hashWert}`;
            
            const response = await fetch(downloadUrl, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                }
            });

            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error(i18n.t('dms.fileNotFound'));
                } else if (response.status === 403) {
                    throw new Error('Keine Berechtigung zum Herunterladen dieser Datei');
                } else {
                    throw new Error(`Download fehlgeschlagen: ${response.statusText}`);
                }
            }

            // Get the filename
            const contentDisposition = response.headers.get('Content-Disposition');
            let fileName = specificVersion.dateiname;
            
            if (contentDisposition) {
                const fileNameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
                if (fileNameMatch && fileNameMatch[1]) {
                    fileName = fileNameMatch[1].replace(/['"]/g, '');
                }
            }

            // Add version number to filename if not already present
            const fileExtension = fileName.substring(fileName.lastIndexOf('.'));
            const fileBaseName = fileName.substring(0, fileName.lastIndexOf('.'));
            const versionedFileName = `${fileBaseName}_v${specificVersion.versionsnummer}${fileExtension}`;

            // Convert response to blob and download
            const blob = await response.blob();
            const downloadLink = document.createElement('a');
            const blobUrl = window.URL.createObjectURL(blob);
            
            downloadLink.href = blobUrl;
            downloadLink.download = versionedFileName;
            downloadLink.style.display = 'none';
            
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
            
            setTimeout(() => {
                window.URL.revokeObjectURL(blobUrl);
            }, 1000);

            // Show success message
            this.hideDownloadProgress();
            this.showSuccess(i18n.t('dms.versionDownloaded').replace('{0}', specificVersion.versionsnummer.toString()).replace('{1}', fileName));

            console.log('Version download completed:', versionedFileName);

        } catch (error) {
            console.error('Error downloading document version:', error);
            this.hideDownloadProgress();
            this.showError(`${i18n.t('materials.downloadError')}: ${(error as Error).message}`);
        }
    }

    private showDownloadProgress(message: string): void {
        // Remove any existing download progress
        this.hideDownloadProgress();

        // Create download progress notification
        const progressNotification = document.createElement('div');
        progressNotification.id = 'dms-download-progress';
        progressNotification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #2196F3;
            color: white;
            padding: 16px 20px;
            border-radius: 8px;
            z-index: 10002;
            max-width: 300px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            font-family: system-ui, -apple-system, sans-serif;
            font-size: 14px;
        `;

        progressNotification.innerHTML = `
            <div style="display: flex; align-items: center; gap: 12px;">
                <div class="dms-download-spinner" style="
                    width: 20px;
                    height: 20px;
                    border: 2px solid rgba(255,255,255,0.3);
                    border-top: 2px solid white;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                "></div>
                <div>
                    <div style="font-weight: 600;">📥 ${i18n.t('dms.downloadInProgress')}</div>
                    <div id="dms-download-message" style="font-size: 12px; opacity: 0.9; margin-top: 4px;">${message}</div>
                </div>
            </div>
        `;

        // Add CSS animation if not already present
        if (!document.querySelector('#dms-download-spinner-styles')) {
            const styleSheet = document.createElement('style');
            styleSheet.id = 'dms-download-spinner-styles';
            styleSheet.textContent = `
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `;
            document.head.appendChild(styleSheet);
        }

        document.body.appendChild(progressNotification);
    }

    private updateDownloadProgress(message: string): void {
        const messageElement = document.getElementById('dms-download-message');
        if (messageElement) {
            messageElement.textContent = message;
        }
    }

    private hideDownloadProgress(): void {
        const progressNotification = document.getElementById('dms-download-progress');
        if (progressNotification) {
            progressNotification.remove();
        }
    }

    public async showDownloadOptions(event: Event, documentId: number): Promise<void> {
        event.preventDefault();
        event.stopPropagation();

        try {
            // Get document details and versions
            const response = await fetch(`/dms/document/${documentId}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                }
            });

            if (!response.ok) {
                throw new Error(i18n.t('dms.documentNotFound'));
            }

            const data = await response.json();
            const documentInfo = data.document;
            const versions = data.versions;

            if (!versions || versions.length === 0) {
                this.showError(i18n.t('dms.noVersionsFound'));
                return;
            }

            // Sort versions by version number (descending - newest first)
            versions.sort((a: any, b: any) => b.versionsnummer - a.versionsnummer);

            // Remove any existing download menu
            this.hideDownloadOptions();

            // Create download options menu
            const menu = document.createElement('div');
            menu.id = 'dms-download-options-menu';
            menu.style.cssText = `
                position: fixed;
                background: white;
                border: 1px solid #ddd;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                z-index: 10001;
                min-width: 280px;
                max-height: 400px;
                overflow-y: auto;
                font-family: system-ui, -apple-system, sans-serif;
            `;

            // Create menu content
            let menuContent = `
                <div style="padding: 16px; border-bottom: 1px solid #eee;">
                    <div style="font-weight: 600; margin-bottom: 4px;">📥 Download-Optionen</div>
                    <div style="font-size: 14px; color: #666;">${documentInfo.titel}</div>
                </div>
                <div style="padding: 8px 0;">
            `;

            // Add current version (quick download)
            const currentVersion = versions[0];
            menuContent += `
                <div class="dms-download-option" onclick="window.dmsManager?.downloadDocument(${documentId})" 
                     style="padding: 12px 16px; cursor: pointer; display: flex; align-items: center; gap: 12px; border-bottom: 1px solid #f0f0f0;">
                    <div style="color: #2196F3; font-size: 18px;">📥</div>
                    <div style="flex: 1;">
                        <div style="font-weight: 600; color: #2196F3;">${i18n.t('dms.downloadCurrentVersion')}</div>
                        <div style="font-size: 12px; color: #666;">Version ${currentVersion.versionsnummer} • ${this.formatFileSize(currentVersion.dateigroesse)}</div>
                    </div>
                </div>
            `;

            // Add all versions
            menuContent += `<div style="padding: 8px 16px; font-size: 12px; color: #666; font-weight: 600; text-transform: uppercase;">${i18n.t('dms.allVersions')}</div>`;
            
            versions.forEach((version: any, index: number) => {
                const isLatest = index === 0;
                const date = new Date(version.erstellungsdatum).toLocaleDateString('de-DE');
                
                menuContent += `
                    <div class="dms-download-option" 
                         onclick="window.dmsManager?.downloadSpecificVersion(${documentId}, ${version.id})"
                         style="padding: 10px 16px; cursor: pointer; display: flex; align-items: center; gap: 12px; ${isLatest ? 'background: #f8f9ff;' : ''}"
                         onmouseover="this.style.background='#f5f5f5'"
                         onmouseout="this.style.background='${isLatest ? '#f8f9ff' : 'white'}'">
                        <div style="color: #666; font-size: 16px;">${this.getDocumentIcon(version.mimeType)}</div>
                        <div style="flex: 1;">
                            <div style="font-weight: 500; ${isLatest ? 'color: #2196F3;' : 'color: #333;'}">
                                ${i18n.t('common.version')} ${version.versionsnummer} ${isLatest ? `(${i18n.t('common.current')})` : ''}
                            </div>
                            <div style="font-size: 12px; color: #666;">
                                ${version.dateiname} • ${this.formatFileSize(version.dateigroesse)} • ${date}
                            </div>
                            ${version.kommentar ? `<div style="font-size: 11px; color: #888; margin-top: 2px;">${version.kommentar}</div>` : ''}
                        </div>
                    </div>
                `;
            });

            menuContent += `</div>`;
            menu.innerHTML = menuContent;

            // Position the menu
            const clickEvent = event as MouseEvent;
            const x = clickEvent.clientX;
            const y = clickEvent.clientY;
            
            // Adjust position if menu would go off screen
            const menuWidth = 280;
            const menuMaxHeight = 400;
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;
            
            let left = x;
            let top = y;
            
            if (left + menuWidth > viewportWidth) {
                left = viewportWidth - menuWidth - 10;
            }
            if (top + menuMaxHeight > viewportHeight) {
                top = viewportHeight - menuMaxHeight - 10;
            }
            
            menu.style.left = `${left}px`;
            menu.style.top = `${top}px`;

            // Add to DOM
            document.body.appendChild(menu);

            // Close menu when clicking outside
            const closeMenu = (e: Event) => {
                if (!menu.contains(e.target as Node)) {
                    this.hideDownloadOptions();
                    document.removeEventListener('click', closeMenu);
                }
            };
            
            // Add small delay before adding the click listener to prevent immediate closure
            setTimeout(() => {
                document.addEventListener('click', closeMenu);
            }, 100);

        } catch (error) {
            console.error('Error showing download options:', error);
            this.showError(`${i18n.t('materials.downloadError')}: ${(error as Error).message}`);
        }
    }

    private hideDownloadOptions(): void {
        const menu = document.getElementById('dms-download-options-menu');
        if (menu) {
            menu.remove();
        }
    }

    private async loadDocumentDetails(documentId: number): Promise<void> {
        try {
            const response = await fetch(`/dms/document/${documentId}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to load document details');
            }

            const data = await response.json();
            const documentInfo = data.document as DMSDocument;
            const versions = data.versions as DMSDocumentVersion[];

            // Get the current (latest) version
            const currentVersion = versions && versions.length > 0 
                ? versions.reduce((latest, current) => 
                    current.versionsnummer > latest.versionsnummer ? current : latest
                  ) 
                : null;

            // Render the detailed information
            this.renderDocumentDetailsContent(documentInfo, versions, currentVersion);

        } catch (error) {
            console.error('Error loading document details:', error);
            const detailsContainer = document.getElementById('dms-document-details');
            if (detailsContainer) {
                detailsContainer.innerHTML = `
                    <div class="dms-error">
                        <p>${i18n.t('common.error')}: ${(error as Error).message}</p>
                    </div>
                `;
            }
        }
    }

    private renderDocumentDetailsContent(documentInfo: DMSDocument, versions: DMSDocumentVersion[], currentVersion: DMSDocumentVersion | null): void {
        const detailsContainer = document.getElementById('dms-document-details');
        if (!detailsContainer) return;

        const createdDate = new Date(documentInfo.erstellungsdatum).toLocaleDateString('de-DE', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        const currentVersionDate = currentVersion 
            ? new Date(currentVersion.erstellungsdatum).toLocaleDateString('de-DE', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })
            : 'N/A';

        detailsContainer.innerHTML = `
            <div class="dms-details-section">
                <div class="dms-section-header">
                    <h3>📋 ${i18n.t('dms.documentInformation')}</h3>
                    <div class="dms-edit-controls">
                        <button class="dms-btn dms-btn-sm dms-btn-secondary" id="dms-edit-metadata-btn" onclick="window.dmsManager?.toggleMetadataEdit()">
                            ✏️ ${i18n.t('dms.edit')}
                        </button>
                    </div>
                </div>
                
                <!-- Read-only view -->
                <div class="dms-details-grid" id="dms-metadata-display">
                    <div class="dms-detail-item">
                        <label>${i18n.t('dms.title')}:</label>
                        <span>${documentInfo.titel}</span>
                    </div>
                    <div class="dms-detail-item">
                        <label>${i18n.t('dms.documentId')}:</label>
                        <span>#${documentInfo.id}</span>
                    </div>
                    <div class="dms-detail-item">
                        <label>${i18n.t('dms.status')}:</label>
                        <span class="dms-status-badge ${this.getStatusCssClass(documentInfo.status)}">${documentInfo.status}</span>
                    </div>
                    <div class="dms-detail-item">
                        <label>${i18n.t('dms.dossierId')}:</label>
                        <span>#${documentInfo.dossierId}</span>
                    </div>
                    <div class="dms-detail-item">
                        <label>${i18n.t('dms.createdAt')}:</label>
                        <span>${createdDate}</span>
                    </div>
                    <div class="dms-detail-item">
                        <label>${i18n.t('dms.userId')}:</label>
                        <span>#${documentInfo.userId}</span>
                    </div>
                    <div class="dms-detail-item">
                        <label>${i18n.t('dms.groupId')}:</label>
                        <span>#${documentInfo.groupId}</span>
                    </div>
                    <div class="dms-detail-item">
                        <label>${i18n.t('dms.currentVersion')}:</label>
                        <span>${currentVersion ? `v${currentVersion.versionsnummer}` : 'Keine'}</span>
                    </div>
                    ${documentInfo.beschreibung ? `
                        <div class="dms-detail-item dms-detail-full-width">
                            <label>${i18n.t('dms.description')}:</label>
                            <span>${documentInfo.beschreibung}</span>
                        </div>
                    ` : ''}
                </div>

                <!-- Edit form (initially hidden) -->
                <form class="dms-metadata-form" id="dms-metadata-form" style="display: none;">
                    <div class="dms-form-grid">
                        <div class="dms-form-group">
                            <label for="edit-titel">${i18n.t('dms.title')} *</label>
                            <input type="text" id="edit-titel" name="titel" value="${documentInfo.titel}" required>
                        </div>
                        
                        <div class="dms-form-group">
                            <label>${i18n.t('dms.documentId')}</label>
                            <input type="text" value="#${documentInfo.id}" disabled class="dms-readonly-input">
                        </div>
                        
                        <div class="dms-form-group">
                            <label for="edit-status">${i18n.t('dms.status')}</label>
                            <select id="edit-status" name="status">
                                <option value="Entwurf" ${documentInfo.status === 'Entwurf' ? 'selected' : ''}>${i18n.t('dms.statusDraft')}</option>
                                <option value="In Bearbeitung" ${documentInfo.status === 'In Bearbeitung' ? 'selected' : ''}>${i18n.t('dms.statusInProgress')}</option>
                                <option value="Zur Freigabe" ${documentInfo.status === 'Zur Freigabe' ? 'selected' : ''}>${i18n.t('dms.statusForApproval')}</option>
                                <option value="Freigegeben" ${documentInfo.status === 'Freigegeben' ? 'selected' : ''}>${i18n.t('dms.statusApproved')}</option>
                                <option value="Archiviert" ${documentInfo.status === 'Archiviert' ? 'selected' : ''}>${i18n.t('dms.statusArchived')}</option>
                            </select>
                        </div>
                        
                        <div class="dms-form-group">
                            <label>Dossier-ID</label>
                            <input type="text" value="#${documentInfo.dossierId}" disabled class="dms-readonly-input">
                        </div>
                        
                        <div class="dms-form-group">
                            <label>${i18n.t('dms.createdAt')}</label>
                            <input type="text" value="${createdDate}" disabled class="dms-readonly-input">
                        </div>
                        
                        <div class="dms-form-group">
                            <label>${i18n.t('dms.userId')}</label>
                            <input type="text" value="#${documentInfo.userId}" disabled class="dms-readonly-input">
                        </div>
                        
                        <div class="dms-form-group">
                            <label>${i18n.t('dms.groupId')}</label>
                            <input type="text" value="#${documentInfo.groupId}" disabled class="dms-readonly-input">
                        </div>
                        
                        <div class="dms-form-group">
                            <label>${i18n.t('dms.currentVersion')}</label>
                            <input type="text" value="${currentVersion ? `v${currentVersion.versionsnummer}` : 'Keine'}" disabled class="dms-readonly-input">
                        </div>
                        
                        <div class="dms-form-group dms-form-full-width">
                            <label for="edit-beschreibung">Beschreibung</label>
                            <textarea id="edit-beschreibung" name="beschreibung" rows="4" placeholder="Beschreibung des Dokuments...">${documentInfo.beschreibung || ''}</textarea>
                        </div>
                    </div>
                    
                    <div class="dms-form-actions">
                        <button type="button" class="dms-btn dms-btn-secondary" onclick="window.dmsManager?.cancelMetadataEdit()">
                            ❌ Abbrechen
                        </button>
                        <button type="button" class="dms-btn dms-btn-primary" onclick="window.dmsManager?.saveMetadataChanges()">
                            ✅ Speichern
                        </button>
                    </div>
                    
                    <input type="hidden" id="edit-document-id" value="${documentInfo.id}">
                </form>
            </div>

            ${currentVersion ? `
                <div class="dms-details-section">
                    <h3>📄 ${i18n.t('dms.currentVersionTitle')} (v${currentVersion.versionsnummer})</h3>
                    <div class="dms-details-grid">
                        <div class="dms-detail-item">
                            <label>${i18n.t('dms.filename')}:</label>
                            <span>${currentVersion.dateiname}</span>
                        </div>
                        <div class="dms-detail-item">
                            <label>${i18n.t('dms.fileSize')}:</label>
                            <span>${this.formatFileSize(currentVersion.dateigroesse)}</span>
                        </div>
                        <div class="dms-detail-item">
                            <label>${i18n.t('dms.mimeType')}:</label>
                            <span>${currentVersion.mimeType}</span>
                        </div>
                        <div class="dms-detail-item">
                            <label>${i18n.t('dms.fileHash')}:</label>
                            <span class="dms-hash-value" title="${currentVersion.hashWert}">${currentVersion.hashWert.substring(0, 16)}...</span>
                        </div>
                        <div class="dms-detail-item">
                            <label>${i18n.t('dms.versionCreated')}:</label>
                            <span>${currentVersionDate}</span>
                        </div>
                        <div class="dms-detail-item">
                            <label>${i18n.t('dms.versionId')}:</label>
                            <span>#${currentVersion.id}</span>
                        </div>
                        ${currentVersion.kommentar ? `
                            <div class="dms-detail-item dms-detail-full-width">
                                <label>${i18n.t('dms.versionComment')}:</label>
                                <span>${currentVersion.kommentar}</span>
                            </div>
                        ` : ''}
                    </div>
                </div>
            ` : ''}

            <div class="dms-details-section">
                <h3>📚 ${i18n.t('dms.versionsOverview')}</h3>
                <div class="dms-versions-summary">
                    <div class="dms-version-stats">
                        <div class="dms-stat">
                            <span class="dms-stat-number">${versions.length}</span>
                            <span class="dms-stat-label">${i18n.t('dms.versions')}</span>
                        </div>
                        <div class="dms-stat">
                            <span class="dms-stat-number">${currentVersion ? currentVersion.versionsnummer : 0}</span>
                            <span class="dms-stat-label">${i18n.t('dms.currentVersionStat')}</span>
                        </div>
                        <div class="dms-stat">
                            <span class="dms-stat-number">${currentVersion ? this.formatFileSize(currentVersion.dateigroesse) : 'N/A'}</span>
                            <span class="dms-stat-label">${i18n.t('dms.currentSize')}</span>
                        </div>
                    </div>
                </div>
            </div>

            ${versions.length > 1 ? `
                <div class="dms-details-section">
                    <h3>📜 ${i18n.t('dms.allVersions')}</h3>
                    ${this.renderVersionsTable(versions, documentInfo)}
                </div>
            ` : ''}
        `;
    }

    private renderVersionsTable(versions: DMSDocumentVersion[], documentInfo: DMSDocument): string {
        const sortedVersions = versions.sort((a, b) => b.versionsnummer - a.versionsnummer);
        
        return `
            <div class="dms-versions-table-container">
                <table class="dms-versions-table">
                    <thead>
                        <tr>
                            <th>${i18n.t('dms.versionTableVersion')}</th>
                            <th>${i18n.t('dms.versionTableFile')}</th>
                            <th>${i18n.t('dms.versionTableSize')}</th>
                            <th>${i18n.t('dms.createdAt')}</th>
                            <th>${i18n.t('dms.versionTableComment')}</th>
                            <th>${i18n.t('dms.status')}</th>
                            <th>${i18n.t('dms.versionTableActions')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${sortedVersions.map(version => {
                            const isCurrentVersion = version.id === documentInfo.aktuelleVersionId;
                            const createdDate = new Date(version.erstellungsdatum);
                            const formattedDate = createdDate.toLocaleDateString('de-DE', {
                                year: 'numeric',
                                month: '2-digit',
                                day: '2-digit'
                            });
                            const formattedTime = createdDate.toLocaleTimeString('de-DE', {
                                hour: '2-digit',
                                minute: '2-digit'
                            });
                            
                            return `
                                <tr class="dms-version-row ${isCurrentVersion ? 'dms-current-version' : ''}">
                                    <td class="dms-version-number">
                                        <span class="dms-version-badge">v${version.versionsnummer}</span>
                                    </td>
                                    <td class="dms-version-file">
                                        <div class="dms-file-info-cell">
                                            <span class="dms-file-icon">${this.getDocumentIcon(version.mimeType)}</span>
                                            <div class="dms-file-details">
                                                <div class="dms-file-name">${version.dateiname}</div>
                                                <div class="dms-file-type">${version.mimeType}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td class="dms-version-size">${this.formatFileSize(version.dateigroesse)}</td>
                                    <td class="dms-version-date">
                                        <div class="dms-date-info">
                                            <div class="dms-date">${formattedDate}</div>
                                            <div class="dms-time">${formattedTime}</div>
                                        </div>
                                    </td>
                                    <td class="dms-version-comment">
                                        <span class="dms-comment-text">${version.kommentar || '-'}</span>
                                    </td>
                                    <td class="dms-version-status">
                                        ${isCurrentVersion ? `<span class="dms-status-current">${i18n.t('dms.current')}</span>` : `<span class="dms-status-archived">${i18n.t('dms.archived')}</span>`}
                                    </td>
                                    <td class="dms-version-actions">
                                        <button class="dms-btn dms-btn-sm dms-btn-download" 
                                                onclick="window.dmsManager?.downloadSpecificVersion(${documentInfo.id}, ${version.id})"
                                                title="${i18n.t('dms.downloadVersionTitle').replace('{0}', version.versionsnummer.toString())}">
                                            📥
                                        </button>
                                        ${!isCurrentVersion ? `
                                            <button class="dms-btn dms-btn-sm dms-btn-restore" 
                                                    onclick="window.dmsManager?.restoreVersion(${documentInfo.id}, ${version.id})"
                                                    title="${i18n.t('dms.restoreVersion')}">
                                                ↻
                                            </button>
                                        ` : ''}
                                        ${this.permissions.canDelete && versions.length > 1 ? `
                                            <button class="dms-btn dms-btn-sm dms-btn-danger" 
                                                    onclick="window.dmsManager?.showVersionDeleteConfirmation(${documentInfo.id}, ${version.id}, ${version.versionsnummer}, '${documentInfo.titel.replace(/'/g, "\\'")}')"
                                                    title="${i18n.t('dms.deleteVersion').replace('{0}', version.versionsnummer.toString())}"
                                                    ${isCurrentVersion ? 'disabled' : ''}>
                                                🗑️
                                            </button>
                                        ` : ''}
                                    </td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    public async showVersionHistory(documentId: number): Promise<void> {
        try {
            console.log('Loading version history for document:', documentId);
            
            // Load document information and versions
            const response = await fetch(`/dms/document/${documentId}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                }
            });

            if (!response.ok) {
                throw new Error(i18n.t('dms.documentNotFound'));
            }

            const data = await response.json();
            const documentInfo = data.document;
            const versions = data.versions;

            // Populate the modal content
            const modalContent = document.getElementById('dms-version-history-content');
            if (modalContent) {
                modalContent.innerHTML = `
                    <div class="dms-version-history-header">
                        <h4>📄 ${documentInfo.titel}</h4>
                        <p class="dms-document-meta">Dokument-ID: #${documentInfo.id} • ${versions.length} Version${versions.length !== 1 ? 'en' : ''}</p>
                    </div>
                    
                    ${this.renderVersionsTable(versions, documentInfo)}
                    
                    <div class="dms-version-history-footer">
                        <div class="dms-version-legend">
                            <span class="dms-legend-item">
                                <span class="dms-status-current">${i18n.t('dms.current')}</span> = ${i18n.t('dms.activeVersion')}
                            </span>
                            <span class="dms-legend-item">
                                <span class="dms-status-archived">${i18n.t('dms.archived')}</span> = ${i18n.t('dms.archivedVersion')}
                            </span>
                        </div>
                    </div>
                `;
            }

            // Show the modal
            const modal = document.getElementById('dms-version-history-modal');
            if (modal) {
                modal.style.display = 'flex';
            }

        } catch (error) {
            console.error('Error loading version history:', error);
            this.showError(i18n.t('dms.errorLoadingVersionHistory') + ': ' + (error as Error).message);
        }
    }

    public restoreVersion(documentId: number, versionId: number): void {
        // Future enhancement: Allow restoring an older version as the current version
        console.log('Restore version', versionId, 'for document', documentId);
        this.showInfo(i18n.t('dms.versionRestoreNotImplemented'));
    }

    public showVersionDeleteConfirmation(documentId: number, versionId: number, versionNumber: number, documentTitle: string): void {
        this.currentDeleteVersionItem = { 
            documentId, 
            versionId, 
            versionNumber, 
            documentTitle 
        };
        
        const modal = document.getElementById('dms-version-delete-confirmation-modal');
        if (modal) {
            const versionInfo = document.getElementById('dms-version-delete-info');
            if (versionInfo) {
                versionInfo.innerHTML = `
                    <div class="dms-delete-version-details">
                        <h4>📄 ${documentTitle}</h4>
                        <p>${i18n.t('dms.versionWillBeMarkedAsDeleted').replace('{0}', versionNumber.toString())}</p>
                    </div>
                `;
            }
            modal.style.display = 'block';
        }
    }

    public async deleteDocumentVersion(documentId: number, versionId: number): Promise<void> {
        try {
            console.log('Deleting version', versionId, 'from document', documentId);
            
            const response = await fetch(`/dms/document/${documentId}/version/${versionId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                }
            });

            if (!response.ok) {
                const errorData = await response.text();
                throw new Error(errorData || i18n.t('dms.errorDeletingVersion'));
            }

            this.showSuccess(i18n.t('dms.versionDeletedSuccessfully'));
            
            // Refresh the version history
            this.showVersionHistory(documentId);
            
            // Also refresh the current view if we're looking at this document
            if (this.currentNode?.id === documentId && this.currentNode?.type === 'document') {
                this.refreshCurrentView();
            }

        } catch (error) {
            console.error('Error deleting document version:', error);
            this.showError(i18n.t('dms.errorDeletingVersion') + ': ' + (error as Error).message);
        }
    }

    public confirmVersionDelete(): void {
        if (this.currentDeleteVersionItem) {
            this.deleteDocumentVersion(
                this.currentDeleteVersionItem.documentId, 
                this.currentDeleteVersionItem.versionId
            );
            this.closeModal('dms-version-delete-confirmation-modal');
            this.currentDeleteVersionItem = null;
        }
    }

    private getStatusCssClass(status: string): string {
        const statusMap: { [key: string]: string } = {
            'Entwurf': 'dms-status-entwurf',
            'In Bearbeitung': 'dms-status-in-bearbeitung',
            'Zur Freigabe': 'dms-status-zur-freigabe',
            'Freigegeben': 'dms-status-freigegeben',
            'Archiviert': 'dms-status-archiviert'
        };
        return statusMap[status] || 'dms-status-entwurf';
    }

    public toggleMetadataEdit(): void {
        const displayDiv = document.getElementById('dms-metadata-display');
        const formDiv = document.getElementById('dms-metadata-form');
        const editBtn = document.getElementById('dms-edit-metadata-btn');
        
        if (displayDiv && formDiv && editBtn) {
            const isEditing = formDiv.style.display !== 'none';
            
            if (isEditing) {
                // Switch to read-only view
                displayDiv.style.display = 'grid';
                formDiv.style.display = 'none';
                editBtn.innerHTML = `✏️ ${i18n.t('dms.edit')}`;
                editBtn.className = 'dms-btn dms-btn-sm dms-btn-secondary';
            } else {
                // Switch to edit mode
                displayDiv.style.display = 'none';
                formDiv.style.display = 'block';
                editBtn.innerHTML = `👁️ ${i18n.t('dms.view')}`;
                editBtn.className = 'dms-btn dms-btn-sm dms-btn-primary';
            }
        }
    }

    public cancelMetadataEdit(): void {
        // Reset form and switch back to read-only view
        const form = document.getElementById('dms-metadata-form') as HTMLFormElement;
        if (form) {
            form.reset();
            // Restore original values - we'll need to reload the data
            this.loadDocumentDetails(this.currentNode?.id || 0);
        }
        this.toggleMetadataEdit();
    }

    public async saveMetadataChanges(): Promise<void> {
        try {
            const documentId = document.getElementById('edit-document-id') as HTMLInputElement;
            const titelInput = document.getElementById('edit-titel') as HTMLInputElement;
            const statusSelect = document.getElementById('edit-status') as HTMLSelectElement;
            const beschreibungTextarea = document.getElementById('edit-beschreibung') as HTMLTextAreaElement;

            if (!documentId || !titelInput || !statusSelect || !beschreibungTextarea) {
                this.showError(i18n.t('forms.fieldNotFound'));
                return;
            }

            // Validation
            if (!titelInput.value.trim()) {
                this.showError(i18n.t('dms.pleaseEnterTitle'));
                titelInput.focus();
                return;
            }

            const updates = {
                titel: titelInput.value.trim(),
                status: statusSelect.value,
                beschreibung: beschreibungTextarea.value.trim() || null
            };

            // Show loading state
            const saveBtn = document.querySelector('.dms-btn-primary') as HTMLButtonElement;
            const originalText = saveBtn.innerHTML;
            saveBtn.innerHTML = `⏳ ${i18n.t('dms.saving')}`;
            saveBtn.disabled = true;

            // Send update request
            const response = await fetch(`/dms/document/${documentId.value}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updates)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || i18n.t('dms.errorSaving'));
            }

            // Success
            this.showSuccess(i18n.t('dms.documentMetadataUpdatedSuccessfully'));
            
            // Reload the document details to show updated data
            await this.loadDocumentDetails(parseInt(documentId.value));
            
            // Switch back to read-only view
            this.toggleMetadataEdit();

        } catch (error) {
            console.error('Error saving metadata changes:', error);
            this.showError(`${i18n.t('common.error')}: ${(error as Error).message}`);
        } finally {
            // Restore button state
            const saveBtn = document.querySelector('.dms-btn-primary') as HTMLButtonElement;
            if (saveBtn) {
                saveBtn.innerHTML = `✅ ${i18n.t('dms.save')}`;
                saveBtn.disabled = false;
            }
        }
    }

    public async uploadNewVersion(documentId: number): Promise<void> {
        console.log('DMSScript: uploadNewVersion called with documentId:', documentId);
        try {
            // Load document information first
            const response = await fetch(`/dms/document/${documentId}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                }
            });

            if (!response.ok) {
                throw new Error(i18n.t('dms.documentNotFound'));
            }

            const data = await response.json();
            const documentInfo = data.document;

            // Store document ID for the upload process
            (window as any).currentVersionDocumentId = documentId;

            // Reset the form
            const form = document.getElementById('dms-upload-version-form') as HTMLFormElement;
            if (form) {
                form.reset();
            }

            // Clear any previous file selections
            this.clearVersionFileSelection();

            // Set document information
            const documentIdField = document.getElementById('version-document-id') as HTMLInputElement;
            const documentTitleField = document.getElementById('dms-version-document-title');

            if (documentIdField) {
                documentIdField.value = documentId.toString();
            }
            if (documentTitleField) {
                documentTitleField.textContent = `${documentInfo.titel} (ID: ${documentInfo.id})`;
            }

            // Set up file upload listeners for version upload only if not handling button upload
            if (!this.isHandlingButtonUpload) {
                this.setupVersionFileUploadListeners();
            }

            // Show the modal
            const modal = document.getElementById('dms-upload-version-modal');
            console.log('DMSScript: Modal element found:', modal);
            if (modal) {
                console.log('DMSScript: Setting modal display to flex');
                modal.style.display = 'flex';
                console.log('DMSScript: Modal should now be visible');
            } else {
                console.error('DMSScript: Modal element not found in DOM!');
                this.showError(i18n.t('dms.modalNotFound'));
            }

        } catch (error) {
            console.error('DMSScript: Error in uploadNewVersion:', error);
            console.error('DMSScript: Error stack:', (error as Error).stack);
            this.showError(`${i18n.t('common.error')}: ${(error as Error).message}`);
        }
    }

    private clearVersionFileSelection(): void {
        const uploadZone = document.getElementById('dms-version-upload-zone');
        const filePreview = document.getElementById('dms-version-file-preview');
        const submitButton = document.getElementById('dms-upload-version-submit') as HTMLButtonElement;

        if (uploadZone) uploadZone.style.display = 'block';
        if (filePreview) filePreview.style.display = 'none';
        if (submitButton) submitButton.disabled = true;

        // Clear hidden fields
        ['version-file-hash', 'version-file-size', 'version-mime-type', 'version-file-name'].forEach(id => {
            const field = document.getElementById(id) as HTMLInputElement;
            if (field) field.value = '';
        });
    }

    private setupVersionFileUploadListeners(): void {
        // Skip if handling button upload to prevent file dialogs
        if (this.isHandlingButtonUpload) {
            console.log('Skipping version file upload listener setup - button upload in progress');
            return;
        }
        const fileInput = document.getElementById('dms-version-file-input') as HTMLInputElement;
        const uploadZone = document.getElementById('dms-version-upload-zone');

        // File input change event
        if (fileInput) {
            fileInput.replaceWith(fileInput.cloneNode(true)); // Remove old listeners
            const newFileInput = document.getElementById('dms-version-file-input') as HTMLInputElement;
            newFileInput.addEventListener('change', (e) => {
                const target = e.target as HTMLInputElement;
                if (target.files && target.files.length > 0) {
                    this.handleVersionFileSelection(target.files[0]);
                }
            });
        }

        // Upload zone click
        if (uploadZone) {
            uploadZone.replaceWith(uploadZone.cloneNode(true)); // Remove old listeners
            const newUploadZone = document.getElementById('dms-version-upload-zone');
            if (newUploadZone) {
                newUploadZone.addEventListener('click', () => {
                    // Skip if we're handling a button upload
                    if (this.isHandlingButtonUpload) {
                        return;
                    }
                    const input = document.getElementById('dms-version-file-input') as HTMLInputElement;
                    if (input) input.click();
                });

                // Drag and drop
                newUploadZone.addEventListener('dragover', (e) => {
                    e.preventDefault();
                    newUploadZone.classList.add('dms-drag-over');
                });

                newUploadZone.addEventListener('dragleave', (e) => {
                    e.preventDefault();
                    newUploadZone.classList.remove('dms-drag-over');
                });

                newUploadZone.addEventListener('drop', (e) => {
                    e.preventDefault();
                    newUploadZone.classList.remove('dms-drag-over');
                    
                    const files = e.dataTransfer?.files;
                    if (files && files.length > 0) {
                        this.handleVersionFileSelection(files[0]);
                    }
                });
            }
        }
    }

    private async handleVersionFileSelection(file: File): Promise<void> {
        // Validate file size (50MB limit)
        const maxSize = 50 * 1024 * 1024;
        if (file.size > maxSize) {
            this.showError(`${i18n.t('materials.fileTooLarge')} (50MB)`);
            return;
        }

        // Update file preview
        this.updateVersionFilePreview(file);
        
        // Upload the file
        await this.uploadVersionFile(file);
    }

    private updateVersionFilePreview(file: File): void {
        const uploadZone = document.getElementById('dms-version-upload-zone');
        const filePreview = document.getElementById('dms-version-file-preview');
        const fileIcon = document.getElementById('dms-version-file-icon');
        const fileName = document.getElementById('dms-version-file-name');
        const fileSize = document.getElementById('dms-version-file-size');
        const fileType = document.getElementById('dms-version-file-type');

        if (uploadZone) uploadZone.style.display = 'none';
        if (filePreview) filePreview.style.display = 'block';

        if (fileIcon) fileIcon.textContent = this.getDocumentIcon(file.type);
        if (fileName) fileName.textContent = file.name;
        if (fileSize) fileSize.textContent = this.formatFileSize(file.size);
        if (fileType) fileType.textContent = file.type || 'Unknown';
    }

    private async uploadVersionFile(file: File): Promise<void> {
        const progressContainer = document.getElementById('dms-version-upload-progress');
        const progressFill = document.getElementById('dms-version-progress-fill');
        const progressText = document.getElementById('dms-version-progress-text');
        const successContainer = document.getElementById('dms-version-upload-success');

        try {
            if (progressContainer) progressContainer.style.display = 'block';
            if (successContainer) successContainer.style.display = 'none';

            const response = await fetch('/dms/upload', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                    'X-File-Name': file.name,
                    'X-File-Type': file.type
                },
                body: file
            });

            if (!response.ok) {
                throw new Error('Upload fehlgeschlagen');
            }

            const result = await response.json();

            // Handle deduplication message
            if (result.isDuplicate) {
                this.showInfo(result.message || i18n.t('dms.fileDuplicateOptimized'));
            }

            // Store upload result in hidden fields
            this.updateVersionHiddenFields({
                hash: result.hash,
                size: result.size,
                mimeType: result.mimeType || file.type,
                filename: result.filename || file.name
            });

            // Show success
            if (progressContainer) progressContainer.style.display = 'none';
            if (successContainer) successContainer.style.display = 'block';

            // Enable submit button
            const submitButton = document.getElementById('dms-upload-version-submit') as HTMLButtonElement;
            if (submitButton) submitButton.disabled = false;

        } catch (error) {
            console.error('Upload error:', error);
            this.showError(`${i18n.t('materials.uploadError')}: ${(error as Error).message}`);
            
            if (progressContainer) progressContainer.style.display = 'none';
        }
    }

    private updateVersionHiddenFields(data: { hash: string; size: number; mimeType: string; filename: string }): void {
        const fields = {
            'version-file-hash': data.hash,
            'version-file-size': data.size.toString(),
            'version-mime-type': data.mimeType,
            'version-file-name': data.filename
        };

        Object.entries(fields).forEach(([id, value]) => {
            const field = document.getElementById(id) as HTMLInputElement;
            if (field) field.value = value;
        });
    }

    public removeVersionFile(): void {
        this.clearVersionFileSelection();
    }

    public async submitUploadVersion(): Promise<void> {
        try {
            const form = document.getElementById('dms-upload-version-form') as HTMLFormElement;
            if (!form) {
                console.error('Version form not found');
                return;
            }

            const submitButton = document.getElementById('dms-upload-version-submit') as HTMLButtonElement;
            const submitText = document.getElementById('dms-upload-version-submit-text');

            // Get form values
            const kommentar = (document.getElementById('version-kommentar') as HTMLInputElement)?.value;
            const documentId = (document.getElementById('version-document-id') as HTMLInputElement)?.value;
            const fileHash = (document.getElementById('version-file-hash') as HTMLInputElement)?.value;
            const fileSize = (document.getElementById('version-file-size') as HTMLInputElement)?.value;
            const mimeType = (document.getElementById('version-mime-type') as HTMLInputElement)?.value;
            const fileName = (document.getElementById('version-file-name') as HTMLInputElement)?.value;

            // Validation
            if (!kommentar || kommentar.trim() === '') {
                this.showError(i18n.t('dms.pleaseEnterVersionComment'));
                return;
            }

            if (!documentId) {
                this.showError(i18n.t('common.error'));
                return;
            }

            if (!fileHash) {
                this.showError(i18n.t('dms.pleaseSelectFile'));
                return;
            }

            // Disable submit button and show loading state
            if (submitButton) submitButton.disabled = true;
            if (submitText) submitText.textContent = 'Erstelle Version...';

            // Create the new version
            const versionData = {
                dateiname: fileName,
                dateigroesse: parseInt(fileSize || '0'),
                mimeType: mimeType,
                hashWert: fileHash,
                kommentar: kommentar.trim()
            };

            const response = await fetch(`/dms/document/${documentId}/version`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(versionData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || i18n.t('dms.errorCreatingVersion'));
            }

            const result = await response.json();
            
            // Success
            this.showSuccess(i18n.t('dms.newVersionUploadedSuccessfully').replace('{0}', result.versionsnummer.toString()));
            
            // Close modal
            this.closeModal('dms-upload-version-modal');
            
            // Refresh the current view to show the new version
            if (this.currentNode && this.currentNode.type === 'document') {
                this.loadDocumentDetails(this.currentNode.id);
            }

        } catch (error) {
            console.error('Error creating version:', error);
            
            // Parse error message for user-friendly display
            const errorMessage = (error as Error).message;
            let userFriendlyMessage = i18n.t('dms.errorCreatingVersion');
            
            if (errorMessage.includes('Error creating Document Version')) {
                // Extract the actual database error if available
                if (errorMessage.includes('PSQLException')) {
                    userFriendlyMessage = i18n.t('dms.databaseErrorSavingVersion');
                } else {
                    userFriendlyMessage = i18n.t('dms.errorCreatingVersion');
                }
            }
            
            this.showError(userFriendlyMessage);
        } finally {
            // Re-enable submit button
            const submitButton = document.getElementById('dms-upload-version-submit') as HTMLButtonElement;
            const submitText = document.getElementById('dms-upload-version-submit-text');
            if (submitButton) submitButton.disabled = false;
            if (submitText) submitText.textContent = 'Version hochladen';
        }
    }

    public closeModal(modalId: string): void {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
        }
    }

    private showModal(modalId: string): void {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'flex';
        } else {
            this.showError(i18n.t('dms.modalNotFoundReload').replace('{0}', modalId));
        }
    }

    public async submitCreateRegistraturPosition(): Promise<void> {
        try {
            const form = document.getElementById('dms-create-registraturposition-form') as HTMLFormElement;
            if (!form) return;

            const formData = new FormData(form);
            const registraturPlanId = (window as any).currentRegistraturPlanId;

            if (!registraturPlanId) {
                this.showError(i18n.t('dms.errorRegistraturplanIdNotFound'));
                return;
            }

            const data = {
                registraturPlanId: registraturPlanId,
                name: formData.get('name') as string,
                positionNummer: parseInt(formData.get('positionNummer') as string),
                beschreibung: formData.get('beschreibung') as string || null
            };

            const response = await fetch('/dms/registraturposition', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || i18n.t('dms.databaseErrorSavingDocument'));
            }

            const result = await response.json();
            this.showSuccess(i18n.t('dms.registraturpositionCreatedSuccessfully'));
            
            // Close modal
            this.closeModal('dms-create-registraturposition-modal');
            
            // Refresh current view
            this.refreshCurrentView();

        } catch (error) {
            console.error('Error creating registraturposition:', error);
            this.showError(`${i18n.t('dms.databaseErrorSavingDocument')}: ${(error as Error).message}`);
        }
    }

    public async submitCreateDossier(): Promise<void> {
        try {
            console.log('submitCreateDossier called'); // Debug log
            
            const form = document.getElementById('dms-create-dossier-form') as HTMLFormElement;
            if (!form) {
                console.error('Form not found');
                return;
            }

            const formData = new FormData(form);

            const registraturPositionId = formData.get('registraturPositionId') as string;
            const parentDossier = formData.get('parentDossierId') as string;
            const name = formData.get('name') as string;
            const beschreibung = formData.get('beschreibung') as string;
            const publicShareValue = formData.get('publicshare');
            const isPublicShareEnabled: boolean = publicShareValue !== null;
            console.log("public share presents, value",publicShareValue,isPublicShareEnabled)
            // Alternative: Get values directly from the form elements since FormData might not work with dynamic IDs
            const registraturPositionDropdown = document.getElementById('dossier-registraturposition') as HTMLSelectElement;
            const parentDossierDropdown = document.getElementById('dossier-parent') as HTMLSelectElement;
            const nameInput = document.getElementById('dossier-name') as HTMLInputElement;
            const beschreibungInput = document.getElementById('dossier-beschreibung') as HTMLTextAreaElement;
            const dossierPublicShare = document.getElementById('dossier-be') as HTMLTextAreaElement;
            const actualRegistraturPositionId = registraturPositionDropdown?.value || registraturPositionId;
            const actualParentDossier = parentDossierDropdown?.value || parentDossier;
            const actualName = nameInput?.value || name;
            const actualBeschreibung = beschreibungInput?.value || beschreibung;


            console.log('Form data:', {
                registraturPositionId: actualRegistraturPositionId,
                name: actualName,
                beschreibung: actualBeschreibung,
                parentDossierId: actualParentDossier,
                share: isPublicShareEnabled
            }); // Debug log

            // Validation
            if (!actualRegistraturPositionId || actualRegistraturPositionId === '') {
                this.showError(i18n.t('dms.pleaseSelectRegistraturposition'));
                return;
            }

            if (!actualName || actualName.trim() === '') {
                this.showError(i18n.t('dms.pleaseEnterName'));
                return;
            }

            const data = {
                registraturPositionId: parseInt(actualRegistraturPositionId),
                parentDossierId: actualParentDossier && actualParentDossier.trim() !== '' ? parseInt(actualParentDossier) : null,
                name: actualName.trim(),
                beschreibung: actualBeschreibung || null,
                publicShare: isPublicShareEnabled
            };
            console.log("dmsPlansData before send to service", data)
            const response = await fetch('/dms/dossier', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || i18n.t('dms.databaseErrorSavingDocument'));
            }

            const result = await response.json();
            this.showSuccess(i18n.t('dms.dossierCreatedSuccessfully'));
            
            // Close modal
            this.closeModal('dms-create-dossier-modal');
            
            // Refresh current view
            this.refreshCurrentView();

        } catch (error) {
            console.error('Error creating dossier:', error);
            this.showError(`${i18n.t('dms.databaseErrorSavingDocument')}: ${(error as Error).message}`);
        }
    }

    public async submitCreateDocument(): Promise<void> {
        try {
            const form = document.getElementById('dms-create-document-form') as HTMLFormElement;
            if (!form) {
                console.error('Document form not found');
                return;
            }

            const submitButton = document.getElementById('dms-create-document-submit') as HTMLButtonElement;
            const submitText = document.getElementById('dms-create-document-submit-text');

            // Get form values
            const titel = (document.getElementById('document-titel') as HTMLInputElement)?.value;
            const beschreibung = (document.getElementById('document-beschreibung') as HTMLTextAreaElement)?.value;
            const status = (document.getElementById('document-status') as HTMLSelectElement)?.value;
            const kommentar = (document.getElementById('document-kommentar') as HTMLInputElement)?.value;
            const dossierId = (document.getElementById('document-dossier-id') as HTMLInputElement)?.value;
            const fileHash = (document.getElementById('document-file-hash') as HTMLInputElement)?.value;
            const fileSize = (document.getElementById('document-file-size') as HTMLInputElement)?.value;
            const mimeType = (document.getElementById('document-mime-type') as HTMLInputElement)?.value;
            const fileName = (document.getElementById('document-file-name') as HTMLInputElement)?.value;

            console.log('Document form data:', {
                titel, beschreibung, status, kommentar, dossierId, fileHash, fileSize, mimeType, fileName
            });

            // Validation
            if (!titel || titel.trim() === '') {
                this.showError(i18n.t('dms.pleaseEnterTitle'));
                return;
            }

            if (!dossierId || dossierId === '') {
                this.showError(i18n.t('dms.dossierIdMissing'));
                return;
            }

            if (!fileHash || fileHash === '') {
                this.showError(i18n.t('dms.pleaseSelectFile'));
                return;
            }

            // Disable submit button and show loading state
            if (submitButton) submitButton.disabled = true;
            if (submitText) submitText.textContent = 'Erstelle Dokument...';

            // Step 1: Create the document
            const documentData = {
                dossierId: parseInt(dossierId),
                titel: titel.trim(),
                beschreibung: beschreibung?.trim() || null,
                status: status || 'Entwurf'
            };

            const documentResponse = await fetch('/dms/document', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(documentData)
            });

            if (!documentResponse.ok) {
                const errorData = await documentResponse.json();
                throw new Error(errorData.error || i18n.t('dms.errorCreatingDocument'));
            }

            const documentResult = await documentResponse.json();
            const documentId = documentResult.id;

            console.log('Document created with ID:', documentId);

            // Step 2: Create the document version
            const versionData = {
                documentId: documentId,
                dateiname: fileName,
                mimeType: mimeType,
                hashWert: fileHash,
                dateigroesse: parseInt(fileSize || '0'),
                kommentar: kommentar?.trim() || 'Erste Version'
            };

            const versionResponse = await fetch(`/dms/document/${documentId}/version`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(versionData)
            });

            if (!versionResponse.ok) {
                const errorData = await versionResponse.json();
                throw new Error(errorData.error || i18n.t('dms.errorCreatingVersion'));
            }

            const versionResult = await versionResponse.json();
            console.log('Document version created with ID:', versionResult.id);

            // Success!
            this.showSuccess(i18n.t('dms.documentCreatedSuccessfully'));

            // Close modal
            this.closeModal('dms-create-document-modal');

            // Refresh current view
            this.refreshCurrentView();

        } catch (error) {
            console.error('Error creating document:', error);
            
            // Parse error message for user-friendly display
            const errorMessage = (error as Error).message;
            let userFriendlyMessage = i18n.t('dms.errorCreatingDocument');
            
            if (errorMessage.includes('Error creating Document')) {
                if (errorMessage.includes('PSQLException')) {
                    userFriendlyMessage = i18n.t('dms.databaseErrorSavingDocument');
                } else {
                    userFriendlyMessage = i18n.t('dms.errorCreatingDocument');
                }
            }
            
            this.showError(userFriendlyMessage);
        } finally {
            // Re-enable submit button
            const submitButton = document.getElementById('dms-create-document-submit') as HTMLButtonElement;
            const submitText = document.getElementById('dms-create-document-submit-text');
            
            if (submitButton) submitButton.disabled = false;
            if (submitText) submitText.textContent = i18n.t('dms.createDocument');
        }
    }

    private showError(message: string): void {
        console.error(message);
        // Create a simple error notification
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #f44336;
            color: white;
            padding: 12px 20px;
            border-radius: 4px;
            z-index: 10001;
            max-width: 400px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        `;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
    }

    private showSuccess(message: string): void {
        console.log(message);
        // Create a simple success notification
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #4caf50;
            color: white;
            padding: 12px 20px;
            border-radius: 4px;
            z-index: 10001;
            max-width: 400px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        `;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 3000);
    }

    private showInfo(message: string): void {
        console.info(message);
        // Create a simple info notification
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #17a2b8;
            color: white;
            padding: 12px 16px;
            border-radius: 4px;
            max-width: 400px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
            z-index: 99999;
            font-size: 14px;
            font-weight: bold;
        `;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 4000);
    }

    private handleHeaderUpload(): void {
        console.log('handleHeaderUpload called');
        
        // IMMEDIATELY block all file inputs before doing anything else
        const allFileInputs = document.querySelectorAll('input[type="file"]') as NodeListOf<HTMLInputElement>;
        console.log('Found file inputs:', allFileInputs.length);
        
        allFileInputs.forEach((input, index) => {
            console.log(`Blocking file input ${index}:`, input);
            input.style.display = 'none';
            input.disabled = true;
            input.style.pointerEvents = 'none';
            // Completely override the click method
            (input as any).originalClick = input.click;
            input.click = () => {
                console.log(`File input ${index} click BLOCKED!`);
                return false;
            };
        });
        
        if (!this.currentNode) {
            this.showError(i18n.t('dms.pleaseSelectAreaToUpload'));
            return;
        }

        // Check if any modal is already open
        const modals = document.querySelectorAll('.dms-modal');
        let modalOpen = false;
        modals.forEach(modal => {
            const modalElement = modal as HTMLElement;
            if (modalElement.style.display === 'flex' || modalElement.style.display === 'block') {
                modalOpen = true;
            }
        });
        
        if (modalOpen) {
            console.log('Modal already open, ignoring upload button');
            return;
        }

        this.isHandlingButtonUpload = true;
        
        // Restore file inputs after delay
        setTimeout(() => {
            console.log('Restoring file inputs...');
            allFileInputs.forEach((input, index) => {
                console.log(`Restoring file input ${index}`);
                input.style.display = '';
                input.disabled = false;
                input.style.pointerEvents = '';
                if ((input as any).originalClick) {
                    input.click = (input as any).originalClick;
                }
            });
            this.isHandlingButtonUpload = false;
        }, 3000);

        const currentNodeId = this.currentNode.id;
        const currentNodeType = this.currentNode.type;

        switch (currentNodeType) {
            case 'dossier':
                // Im Dossier: Neues Dokument erstellen
                this.showInfo(i18n.t('dms.openingDocumentCreation'));
                setTimeout(() => {
                    this.showCreateDocumentModalSimple(currentNodeId);
                }, 100);
                break;
            case 'registraturposition':
                // In Registraturposition: Neues Dossier erstellen  
                this.showInfo(i18n.t('dms.openingDossierCreation'));
                setTimeout(() => {
                    this.showCreateDossierModalSimple(currentNodeId);
                }, 100);
                break;
            case 'document':
                // Bei Dokument: Neue Version hochladen
                this.showInfo(i18n.t('dms.openingVersionUpload'));
                setTimeout(() => {
                    this.showUploadVersionModalSimple(currentNodeId);
                }, 100);
                break;
            case 'registraturplan':
                // Im Registraturplan: Neue Registraturposition erstellen
                this.showInfo(i18n.t('dms.openingRegistrationPositionCreation'));
                setTimeout(() => {
                    this.showCreateRegistraturPositionModalSimple(currentNodeId);
                }, 100);
                break;
            default:
                this.showError(i18n.t('dms.uploadNotPossibleHere'));
                break;
        }
    }

    // Simple modal methods that don't set up automatic file uploads
    private showCreateDocumentModalSimple(dossierId: number): void {
        // Set the dossier ID in the hidden field
        const dossierIdField = document.getElementById('document-dossier-id') as HTMLInputElement;
        if (dossierIdField) {
            dossierIdField.value = dossierId.toString();
        }
        
        // Load and display dossier information
        this.loadTargetDossierInfo(dossierId);
        
        // Show the modal WITHOUT setting up file upload listeners
        const modal = document.getElementById('dms-create-document-modal');
        if (modal) {
            modal.style.display = 'flex';
        }
    }

    private showCreateDossierModalSimple(registraturPositionId: number): void {
        // Set the registraturposition ID
        const regPosIdField = document.getElementById('dossier-registraturposition-id') as HTMLInputElement;
        if (regPosIdField) {
            regPosIdField.value = registraturPositionId.toString();
        }
        
        // Show the modal
        const modal = document.getElementById('dms-create-dossier-modal');
        if (modal) {
            modal.style.display = 'flex';
        }
    }

    private showUploadVersionModalSimple(documentId: number): void {
        // Set document information
        const documentIdField = document.getElementById('version-document-id') as HTMLInputElement;
        if (documentIdField) {
            documentIdField.value = documentId.toString();
        }
        
        // Show the modal WITHOUT setting up file upload listeners
        const modal = document.getElementById('dms-upload-version-modal');
        if (modal) {
            modal.style.display = 'flex';
        }
    }

    private showCreateRegistraturPositionModalSimple(registraturPlanId: number): void {
        // Store the plan ID for form submission
        (window as any).currentRegistraturPlanId = registraturPlanId;
        
        // Show the modal
        const modal = document.getElementById('dms-create-registraturposition-modal');
        if (modal) {
            modal.style.display = 'flex';
        }
    }

    public testUpload(): void {
        console.log('testUpload called - opening appropriate dialog');
        
        if (!this.currentNode) {
            this.showError(i18n.t('dms.pleaseSelectAreaForUpload'));
            return;
        }
        
        // Call the appropriate method directly without the problematic flag
        const currentNodeId = this.currentNode.id;
        switch (this.currentNode.type) {
            case 'dossier':
                this.showInfo(i18n.t('dms.openingDocumentCreation'));
                this.createDocument(currentNodeId);
                break;
            case 'registraturposition':
                this.showInfo(i18n.t('dms.openingDossierCreation'));
                this.createDossier(currentNodeId);
                break;
            case 'document':
                this.showInfo(i18n.t('dms.openingVersionUpload'));
                this.uploadNewVersion(currentNodeId);
                break;
            case 'registraturplan':
                this.showInfo(i18n.t('dms.openingRegistrationPositionCreation'));
                this.createRegistraturPosition(currentNodeId);
                break;
            default:
                const message = i18n.t('dms.uploadForType')
                    .replace('{0}', this.currentNode.type)
                    .replace('{1}', this.currentNode.name);
                this.showInfo(message);
                break;
        }
    }
    
    /**
     * Show search interface
     */
    public showSearchInterface(): void {
        const modal = document.getElementById('dms-search-modal');
        if (modal) {
            modal.style.display = 'flex';
            
            // Clear previous search results and reset form
            this.clearSearchResults();
            this.resetSearchForm();
            
            // Focus search input
            const searchInput = document.getElementById('dms-search-query') as HTMLInputElement;
            if (searchInput) {
                setTimeout(() => searchInput.focus(), 100);
            }
            
            // Setup event listeners if not already set up
            this.setupSearchEventListeners();
        }
    }
    
    /**
     * Clear search results
     */
    private clearSearchResults(): void {
        const resultsContainer = document.getElementById('dms-search-results');
        const documentResults = document.getElementById('dms-document-results');
        const dossierResults = document.getElementById('dms-dossier-results');
        const noResults = document.getElementById('dms-search-no-results');
        const loadingElement = document.getElementById('dms-search-loading');
        
        // Hide all result sections
        if (resultsContainer) resultsContainer.style.display = 'none';
        if (documentResults) documentResults.style.display = 'none';
        if (dossierResults) dossierResults.style.display = 'none';
        if (noResults) noResults.style.display = 'none';
        if (loadingElement) loadingElement.style.display = 'none';
        
        // Clear result content
        const documentItems = document.getElementById('dms-document-items');
        const dossierItems = document.getElementById('dms-dossier-items');
        if (documentItems) documentItems.innerHTML = '';
        if (dossierItems) dossierItems.innerHTML = '';
    }
    
    /**
     * Reset search form to initial state
     */
    private resetSearchForm(): void {
        // Clear search input
        const searchInput = document.getElementById('dms-search-query') as HTMLInputElement;
        if (searchInput) {
            searchInput.value = '';
        }
        
        // Reset filters
        const typeFilter = document.getElementById('search-type') as HTMLSelectElement;
        const mimeTypeFilter = document.getElementById('search-mime-type') as HTMLSelectElement;
        const dateFromFilter = document.getElementById('search-date-from') as HTMLInputElement;
        const dateToFilter = document.getElementById('search-date-to') as HTMLInputElement;
        
        if (typeFilter) typeFilter.value = '';
        if (mimeTypeFilter) mimeTypeFilter.value = '';
        if (dateFromFilter) dateFromFilter.value = '';
        if (dateToFilter) dateToFilter.value = '';
        
        // Hide advanced filters
        const filters = document.getElementById('dms-search-filters');
        const toggleBtn = document.getElementById('dms-search-toggle-filters');
        
        if (filters) filters.style.display = 'none';
        if (toggleBtn) toggleBtn.textContent = `⚙️ ${i18n.t('dms.advancedSearch')}`;
    }
    
    /**
     * Setup search event listeners
     */
    private setupSearchEventListeners(): void {
        // Search button
        const searchBtn = document.getElementById('dms-search-btn');
        if (searchBtn && !searchBtn.dataset.listenerAttached) {
            searchBtn.addEventListener('click', () => this.performSearch());
            searchBtn.dataset.listenerAttached = 'true';
        }
        
        // Enter key in search input
        const searchInput = document.getElementById('dms-search-query') as HTMLInputElement;
        if (searchInput && !searchInput.dataset.listenerAttached) {
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.performSearch();
                }
            });
            searchInput.dataset.listenerAttached = 'true';
        }
        
        // Toggle advanced filters
        const toggleBtn = document.getElementById('dms-search-toggle-filters');
        if (toggleBtn && !toggleBtn.dataset.listenerAttached) {
            toggleBtn.addEventListener('click', () => this.toggleAdvancedFilters());
            toggleBtn.dataset.listenerAttached = 'true';
        }
        
        // Modal close functionality
        const modal = document.getElementById('dms-search-modal');
        const closeBtn = modal?.querySelector('.dms-modal-close') as HTMLElement;
        if (closeBtn && !closeBtn.dataset.listenerAttached) {
            closeBtn.addEventListener('click', () => {
                if (modal) modal.style.display = 'none';
            });
            closeBtn.dataset.listenerAttached = 'true';
        }
        
        // Click outside modal to close
        if (modal && !(modal as HTMLElement).dataset.listenerAttached) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.style.display = 'none';
                }
            });
            (modal as HTMLElement).dataset.listenerAttached = 'true';
        }
    }
    
    /**
     * Toggle advanced search filters
     */
    private toggleAdvancedFilters(): void {
        const filters = document.getElementById('dms-search-filters');
        const toggleBtn = document.getElementById('dms-search-toggle-filters');
        
        if (filters && toggleBtn) {
            const isVisible = filters.style.display !== 'none';
            filters.style.display = isVisible ? 'none' : 'block';
            toggleBtn.textContent = isVisible ? `⚙️ ${i18n.t('dms.advancedSearch')}` : `⚙️ ${i18n.t('dms.simpleSearch')}`;
        }
    }
    
    /**
     * Perform search
     */
    private async performSearch(): Promise<void> {
        const searchInput = document.getElementById('dms-search-query') as HTMLInputElement;
        const query = searchInput?.value?.trim();
        
        if (!query) {
            this.showError(i18n.t('dms.pleaseEnterSearchTerm'));
            return;
        }
        
        // Show loading state
        this.showSearchLoading(true);
        
        try {
            // Get filter values
            const typeFilter = (document.getElementById('search-type') as HTMLSelectElement)?.value || '';
            const mimeTypeFilter = (document.getElementById('search-mime-type') as HTMLSelectElement)?.value || '';
            const dateFromFilter = (document.getElementById('search-date-from') as HTMLInputElement)?.value || '';
            const dateToFilter = (document.getElementById('search-date-to') as HTMLInputElement)?.value || '';
            
            // Build query parameters
            const params = new URLSearchParams({
                q: query
            });
            
            if (typeFilter) params.append('type', typeFilter);
            if (mimeTypeFilter) params.append('mimeType', mimeTypeFilter);
            if (dateFromFilter) params.append('dateFrom', dateFromFilter);
            if (dateToFilter) params.append('dateTo', dateToFilter);
            
            // Perform search
            const response = await fetch(`/dms/search?${params.toString()}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                }
            });
            
            if (!response.ok) {
                throw new Error(`Search failed: ${response.status}`);
            }
            
            const searchResults = await response.json();
            this.displaySearchResults(searchResults, query);
            
        } catch (error) {
            console.error('Search error:', error);
            this.showError(i18n.t('dms.searchError') + ': ' + (error as Error).message);
        } finally {
            this.showSearchLoading(false);
        }
    }
    
    /**
     * Display search results
     */
    private displaySearchResults(results: any, query: string): void {
        const resultsContainer = document.getElementById('dms-search-results');
        const titleElement = document.getElementById('dms-search-results-title');
        const countElement = document.getElementById('dms-search-results-count');
        const documentResults = document.getElementById('dms-document-results');
        const dossierResults = document.getElementById('dms-dossier-results');
        const noResults = document.getElementById('dms-search-no-results');
        const documentItems = document.getElementById('dms-document-items');
        const dossierItems = document.getElementById('dms-dossier-items');
        
        if (!resultsContainer) return;
        
        // Show results container
        resultsContainer.style.display = 'block';
        
        // Update title and count
        if (titleElement) {
            titleElement.textContent = i18n.t('dms.searchResultsFor').replace('{0}', query);
        }
        if (countElement) {
            countElement.textContent = `${results.totalCount} Ergebnis(se) gefunden`;
        }
        
        // Show/hide sections based on results
        const hasDocuments = results.documents && results.documents.length > 0;
        const hasDossiers = results.dossiers && results.dossiers.length > 0;
        
        if (documentResults) {
            documentResults.style.display = hasDocuments ? 'block' : 'none';
        }
        if (dossierResults) {
            dossierResults.style.display = hasDossiers ? 'block' : 'none';
        }
        if (noResults) {
            noResults.style.display = (!hasDocuments && !hasDossiers) ? 'block' : 'none';
        }
        
        // Populate document results
        if (hasDocuments && documentItems) {
            documentItems.innerHTML = results.documents.map((item: any) => {
                const doc = item.document;
                const matchedVersion = item.matchedVersion;
                const matchType = item.matchType;
                const matchPreview = item.matchPreview;
                
                // Generate match info display
                let matchInfo = '';
                if (matchedVersion) {
                    switch (matchType) {
                        case 'version_content':
                            matchInfo = `<div class="dms-search-match-info">
                                <span class="dms-search-match-type">📝 Gefunden in PDF-Inhalt (Version ${matchedVersion.versionsnummer})</span>
                                ${matchPreview ? `<div class="dms-search-match-preview">"...${matchPreview}..."</div>` : ''}
                            </div>`;
                            break;
                        case 'version_filename':
                            matchInfo = `<div class="dms-search-match-info">
                                <span class="dms-search-match-type">📎 Gefunden in Dateiname (Version ${matchedVersion.versionsnummer})</span>
                                <div class="dms-search-match-preview">${matchedVersion.dateiname}</div>
                            </div>`;
                            break;
                        case 'version_comment':
                            matchInfo = `<div class="dms-search-match-info">
                                <span class="dms-search-match-type">💬 Gefunden in Kommentar (Version ${matchedVersion.versionsnummer})</span>
                                ${matchPreview ? `<div class="dms-search-match-preview">"${matchPreview}"</div>` : ''}
                            </div>`;
                            break;
                    }
                } else {
                    switch (matchType) {
                        case 'document_title':
                            matchInfo = `<div class="dms-search-match-info">
                                <span class="dms-search-match-type">📋 Gefunden in Dokumenttitel</span>
                            </div>`;
                            break;
                        case 'document_description':
                            matchInfo = `<div class="dms-search-match-info">
                                <span class="dms-search-match-type">📝 Gefunden in Dokumentbeschreibung</span>
                            </div>`;
                            break;
                    }
                }
                
                return `
                    <div class="dms-search-item">
                        <div class="dms-search-item-icon">📄</div>
                        <div class="dms-search-item-content">
                            <h6 class="dms-search-item-title">${doc.titel}</h6>
                            <p class="dms-search-item-description">${doc.beschreibung || i18n.t('dms.noDescriptionAvailable')}</p>
                            ${matchInfo}
                            <div class="dms-search-item-meta">
                                <span class="dms-search-item-status">Status: ${doc.status}</span>
                                <span class="dms-search-item-date">${i18n.t('dms.created')}: ${new Date(doc.erstellungsdatum).toLocaleDateString('de-DE')}</span>
                                ${matchedVersion ? `<span class="dms-search-item-version">${i18n.t('dms.currentVersion')}: ${doc.aktuelleVersionId || 'N/A'}</span>` : ''}
                            </div>
                        </div>
                        <div class="dms-search-item-actions">
                            <button class="dms-btn dms-btn-sm dms-btn-primary" onclick="window.dmsManager?.viewDocument(${doc.id})">
                                👁️ ${i18n.t('dms.view')}
                            </button>
                            ${matchedVersion ? `
                                <button class="dms-btn dms-btn-sm dms-btn-secondary" onclick="window.dmsManager?.viewDocumentVersion(${doc.id}, ${matchedVersion.versionsnummer})" title="Gefundene Version anzeigen">
                                    📄 v${matchedVersion.versionsnummer}
                                </button>
                            ` : ''}
                        </div>
                    </div>
                `;
            }).join('');
        }
        
        // Populate dossier results
        if (hasDossiers && dossierItems) {
            dossierItems.innerHTML = results.dossiers.map((dossier: any) => `
                <div class="dms-search-item">
                    <div class="dms-search-item-icon">📁</div>
                    <div class="dms-search-item-content">
                        <h6 class="dms-search-item-title">${dossier.name}</h6>
                        <p class="dms-search-item-description">${dossier.beschreibung || i18n.t('dms.noDescriptionAvailable')}</p>
                        <div class="dms-search-item-meta">
                            <span class="dms-search-item-status">${i18n.t('dms.runningNumber')}: ${dossier.laufnummer}</span>
                            <span class="dms-search-item-date">${i18n.t('dms.created')}: ${new Date(dossier.erstellungsdatum).toLocaleDateString('de-DE')}</span>
                        </div>
                    </div>
                    <div class="dms-search-item-actions">
                        <button class="dms-btn dms-btn-sm dms-btn-primary" onclick="window.dmsManager?.viewDossier(${dossier.id})">
                            👁️ ${i18n.t('dms.open')}
                        </button>
                    </div>
                </div>
            `).join('');
        }
    }
    
    /**
     * Show/hide search loading state
     */
    private showSearchLoading(show: boolean): void {
        const loadingElement = document.getElementById('dms-search-loading');
        const resultsContainer = document.getElementById('dms-search-results');
        
        if (loadingElement) {
            loadingElement.style.display = show ? 'block' : 'none';
        }
        
        if (resultsContainer && !show) {
            // Keep results visible when not loading
        }
    }
    
    /**
     * View document from search results
     */
    public async viewDocument(documentId: number): Promise<void> {
        // Close search modal
        const modal = document.getElementById('dms-search-modal');
        if (modal) modal.style.display = 'none';
        
        try {
            // Navigate to the document using the existing navigation system
            await this.navigateToNodeById(documentId, 'document');
            this.showInfo(i18n.t('dms.documentOpened').replace('{0}', documentId.toString()));
        } catch (error) {
            console.error('Error navigating to document:', error);
            this.showError(i18n.t('dms.errorOpeningDocument') + ': ' + (error as Error).message);
        }
    }
    
    /**
     * View dossier from search results
     */
    public async viewDossier(dossierId: number): Promise<void> {
        // Close search modal
        const modal = document.getElementById('dms-search-modal');
        if (modal) modal.style.display = 'none';
        
        try {
            // Navigate to the dossier using the existing navigation system
            await this.navigateToNodeById(dossierId, 'dossier');
            this.showInfo(i18n.t('dms.dossierOpened').replace('{0}', dossierId.toString()));
        } catch (error) {
            console.error('Error navigating to dossier:', error);
            this.showError(i18n.t('dms.errorOpeningDossier') + ': ' + (error as Error).message);
        }
    }
    
    /**
     * View specific document version from search results
     */
    public async viewDocumentVersion(documentId: number, versionNumber: number): Promise<void> {
        // Close search modal
        const modal = document.getElementById('dms-search-modal');
        if (modal) modal.style.display = 'none';
        
        try {
            // Navigate to the document first
            await this.navigateToNodeById(documentId, 'document');
            
            // Show info about the specific version
            this.showInfo(i18n.t('dms.documentVersionOpened').replace('{0}', documentId.toString()).replace('{1}', versionNumber.toString()));
            
            // TODO: Could implement highlighting or auto-scrolling to the specific version in the version history
        } catch (error) {
            console.error('Error navigating to document version:', error);
            this.showError(i18n.t('dms.errorOpeningDocumentVersion') + ': ' + (error as Error).message);
        }
    }

    // Debug helper method - can be called from browser console
    public debugPermissions(): void {
        console.log('=== DMS DEBUG INFO ===');
        console.log('Current Node:', this.currentNode);
        console.log('Current Permissions:', this.permissions);
        console.log('canManageVersions:', this.permissions.canManageVersions);
        
        // Check if button exists in DOM
        const uploadButtons = document.querySelectorAll('button[onclick*="uploadNewVersion"]');
        console.log('Upload buttons found in DOM:', uploadButtons.length);
        uploadButtons.forEach((btn, index) => {
            console.log(`Button ${index}:`, btn);
        });
        
        // Check for HTML comments (hidden buttons)
        const content = document.getElementById('dms-content')?.innerHTML || '';
        const hiddenButtonMatch = content.match(/<!-- Neue Version button hidden: canManageVersions=([^-]+) -->/);
        if (hiddenButtonMatch) {
            console.log('Found hidden button comment with canManageVersions =', hiddenButtonMatch[1]);
        }
        console.log('=== END DEBUG INFO ===');
    }

    // Debug helper to test modal opening directly
    public testModal(): void {
        console.log('Testing modal visibility...');
        const modal = document.getElementById('dms-upload-version-modal');
        if (modal) {
            console.log('Modal found, showing...');
            modal.style.display = 'flex';
        } else {
            console.log('Modal NOT found in DOM');
            // List all modal elements
            const allModals = document.querySelectorAll('.dms-modal');
            console.log('All modals in DOM:', allModals);
        }
    }

    // Statistics methods
    async loadStatistics(): Promise<DMSStatistics | null> {
        try {
            const response = await fetch('/dms/statistics', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const statistics = await response.json() as DMSStatistics;
            return statistics;
        } catch (error) {
            console.error('Error loading DMS statistics:', error);
            return null;
        }
    }

    displayStatistics(statistics: DMSStatistics): void {
        const container = document.getElementById('dms-statistics-container');
        if (!container) return;

        // Format storage size
        const formatBytes = (bytes: number): string => {
            const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
            if (bytes === 0) return '0 Bytes';
            const i = Math.floor(Math.log(bytes) / Math.log(1024));
            return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
        };

        // Build statistics HTML
        const html = `
            <div class="dms-statistics-grid">
                <div class="dms-statistics-card">
                    <h3>${i18n.t('dms.overview')}</h3>
                    <div class="dms-statistics-item">
                        <span class="label">${i18n.t('dms.totalDocuments')}:</span>
                        <span class="value">${statistics.totalDocuments.toLocaleString()}</span>
                    </div>
                    <div class="dms-statistics-item">
                        <span class="label">${i18n.t('dms.totalDossiers')}:</span>
                        <span class="value">${statistics.totalDossiers.toLocaleString()}</span>
                    </div>
                    <div class="dms-statistics-item">
                        <span class="label">${i18n.t('dms.totalVersions')}:</span>
                        <span class="value">${statistics.totalVersions.toLocaleString()}</span>
                    </div>
                    <div class="dms-statistics-item">
                        <span class="label">${i18n.t('dms.storageUsed')}:</span>
                        <span class="value">${formatBytes(statistics.totalStorageBytes)}</span>
                    </div>
                    <div class="dms-statistics-item">
                        <span class="label">${i18n.t('dms.avgVersionsPerDocument')}:</span>
                        <span class="value">${statistics.averageVersionsPerDocument.toFixed(1)}</span>
                    </div>
                    <div class="dms-statistics-item">
                        <span class="label">${i18n.t('dms.recentUploads')}:</span>
                        <span class="value">${statistics.recentUploads}</span>
                    </div>
                </div>

                <div class="dms-statistics-card">
                    <h3>${i18n.t('dms.topFileTypes')}</h3>
                    <div class="dms-statistics-list">
                        ${statistics.topFileTypes.slice(0, 5).map(fileType => `
                            <div class="dms-statistics-item">
                                <span class="label">${fileType.extension.toUpperCase()}:</span>
                                <span class="value">${fileType.count} (${formatBytes(fileType.totalSize)})</span>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div class="dms-statistics-card">
                    <h3>${i18n.t('dms.documentsByStatus')}</h3>
                    <div class="dms-statistics-list">
                        ${Object.entries(statistics.documentsByStatus).map(([status, count]) => `
                            <div class="dms-statistics-item">
                                <span class="label">${status}:</span>
                                <span class="value">${count}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div class="dms-statistics-card">
                    <h3>Speicherplatz nach Gruppe</h3>
                    <div class="dms-statistics-list">
                        ${Object.entries(statistics.storageByGroup).map(([group, bytes]) => `
                            <div class="dms-statistics-item">
                                <span class="label">${group}:</span>
                                <span class="value">${formatBytes(bytes)}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;

        container.innerHTML = html;
    }

    async showStatistics(): Promise<void> {
        const statistics = await this.loadStatistics();
        if (statistics) {
            this.displayStatistics(statistics);
            
            // Show statistics view
            const statisticsView = document.getElementById('dms-statistics-view');
            const contentContainer = document.getElementById('dms-content');
            
            if (statisticsView && contentContainer) {
                // Hide main content and show statistics
                contentContainer.style.display = 'none';
                statisticsView.style.display = 'block';
            }
        }
    }

    hideStatistics(): void {
        const statisticsView = document.getElementById('dms-statistics-view');
        const contentContainer = document.getElementById('dms-content');
        
        if (statisticsView && contentContainer) {
            // Hide statistics and show main content
            statisticsView.style.display = 'none';
            contentContainer.style.display = 'block';
        }
    }
    
    // ======================== SOFT DELETE FUNCTIONALITY ========================
    
    private currentDeleteItem: { id: number, type: string, name: string } | null = null;
    private currentDeleteVersionItem: { documentId: number, versionId: number, versionNumber: number, documentTitle: string } | null = null;
    
    /**
     * Show delete confirmation dialog
     */
    showDeleteConfirmation(id: number, type: string, name: string): void {
        this.currentDeleteItem = { id, type, name };
        
        const modal = document.getElementById('dms-delete-confirmation-modal');
        const itemInfo = document.getElementById('dms-delete-item-info');
        const consequences = document.getElementById('dms-delete-consequences');
        
        if (!modal || !itemInfo || !consequences) {
            console.error('Delete confirmation modal elements not found');
            return;
        }
        
        // Set item information
        const typeText = type === 'document' ? 'Dokument' : 'Dossier';
        itemInfo.textContent = `${typeText}: "${name}" (ID: ${id})`;
        
        // Set consequences text based on type
        let consequencesText = '';
        if (type === 'document') {
            consequencesText = i18n.t('dms.documentAndVersionsWillBeDeleted');
        } else if (type === 'dossier') {
            consequencesText = i18n.t('dms.dossierAndDocumentsWillBeDeleted');
        }
        consequences.textContent = consequencesText;
        
        modal.style.display = 'flex';
    }
    
    /**
     * Confirm and execute the delete operation
     */
    async confirmDelete(): Promise<void> {
        if (!this.currentDeleteItem) {
            this.showError(i18n.t('dms.noItemSelectedForDeletion'));
            return;
        }
        
        const { id, type, name } = this.currentDeleteItem;
        
        try {
            const endpoint = type === 'document' ? `/dms/document/${id}` : `/dms/dossier/${id}`;
            
            const response = await fetch(endpoint, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Delete operation failed');
            }
            
            const result = await response.json();
            
            // Close the confirmation modal
            this.closeModal('dms-delete-confirmation-modal');
            
            // Show success message
            this.showSuccess(result.message || i18n.t(type === 'document' ? 'dms.documentDeletedSuccessfully' : 'dms.dossierDeletedSuccessfully'));
            
            // Refresh the current view
            await this.refreshCurrentView();
            
        } catch (error) {
            console.error('Error deleting item:', error);
            this.showError(i18n.t('dms.errorDeleting') + ': ' + (error as Error).message);
        } finally {
            this.currentDeleteItem = null;
        }
    }
    
    /**
     * Show deleted items for restoration
     */
    async showDeletedItems(): Promise<void> {
        try {
            const response = await fetch('/dms/deleted-items', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                }
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to load deleted items');
            }
            
            const deletedItems = await response.json();
            
            // Populate the modal
            this.populateDeletedItemsModal(deletedItems);
            
            // Show the modal
            const modal = document.getElementById('dms-deleted-items-modal');
            if (modal) {
                modal.style.display = 'flex';
            }
            
        } catch (error) {
            console.error('Error loading deleted items:', error);
            this.showError(i18n.t('dms.errorLoadingDeletedItems') + ': ' + (error as Error).message);
        }
    }
    
    /**
     * Populate the deleted items modal with data
     */
    private populateDeletedItemsModal(deletedItems: any): void {
        const documentsSection = document.getElementById('dms-deleted-documents-section');
        const dossiersSection = document.getElementById('dms-deleted-dossiers-section');
        const versionsSection = document.getElementById('dms-deleted-versions-section');
        const documentsList = document.getElementById('dms-deleted-documents-list');
        const dossiersList = document.getElementById('dms-deleted-dossiers-list');
        const versionsList = document.getElementById('dms-deleted-versions-list');
        const noItemsMessage = document.getElementById('dms-no-deleted-items');
        
        if (!documentsList || !dossiersList || !versionsList || !noItemsMessage) {
            console.error('Deleted items modal elements not found');
            return;
        }
        
        const documents = deletedItems.documents || [];
        const dossiers = deletedItems.dossiers || [];
        const documentVersions = deletedItems.documentVersions || [];
        
        // Clear existing content
        documentsList.innerHTML = '';
        dossiersList.innerHTML = '';
        versionsList.innerHTML = '';
        
        // Check if there are any deleted items
        if (documents.length === 0 && dossiers.length === 0 && documentVersions.length === 0) {
            noItemsMessage.style.display = 'block';
            if (documentsSection) documentsSection.style.display = 'none';
            if (dossiersSection) dossiersSection.style.display = 'none';
            if (versionsSection) versionsSection.style.display = 'none';
            return;
        }
        
        noItemsMessage.style.display = 'none';
        
        // Populate documents
        if (documents.length > 0 && documentsSection) {
            documentsSection.style.display = 'block';
            documents.forEach((doc: any) => {
                const itemElement = this.createDeletedItemElement(doc, 'document');
                documentsList.appendChild(itemElement);
            });
        } else if (documentsSection) {
            documentsSection.style.display = 'none';
        }
        
        // Populate dossiers
        if (dossiers.length > 0 && dossiersSection) {
            dossiersSection.style.display = 'block';
            dossiers.forEach((dossier: any) => {
                const itemElement = this.createDeletedItemElement(dossier, 'dossier');
                dossiersList.appendChild(itemElement);
            });
        } else if (dossiersSection) {
            dossiersSection.style.display = 'none';
        }
        
        // Populate document versions
        if (documentVersions.length > 0 && versionsSection) {
            versionsSection.style.display = 'block';
            documentVersions.forEach((versionData: any) => {
                const itemElement = this.createDeletedVersionElement(versionData);
                versionsList.appendChild(itemElement);
            });
        } else if (versionsSection) {
            versionsSection.style.display = 'none';
        }
    }
    
    /**
     * Create HTML element for a deleted item
     */
    private createDeletedItemElement(item: any, type: string): HTMLElement {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'dms-deleted-item';
        
        const name = type === 'document' ? item.titel : item.name;
        const createdDate = new Date(item.erstellungsdatum).toLocaleDateString('de-DE');
        
        itemDiv.innerHTML = `
            <div class="dms-deleted-item-info">
                <div class="dms-deleted-item-name">${name}</div>
                <div class="dms-deleted-item-meta">
                    ${i18n.t('dms.idCreatedStatus').replace('{0}', item.id.toString()).replace('{1}', createdDate).replace('{2}', item.status)}
                </div>
            </div>
            <div class="dms-deleted-item-actions">
                <button class="dms-btn-restore" onclick="window.dmsManager?.restoreItem(${item.id}, '${type}', '${name.replace(/'/g, "\\'")}')">
                    ↻ Wiederherstellen
                </button>
            </div>
        `;
        
        return itemDiv;
    }
    
    /**
     * Create HTML element for a deleted document version
     */
    private createDeletedVersionElement(versionData: any): HTMLElement {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'dms-deleted-item';
        
        const version = versionData.version;
        const documentTitle = versionData.documentTitle;
        const createdDate = new Date(version.erstellungsdatum).toLocaleDateString('de-DE');
        
        itemDiv.innerHTML = `
            <div class="dms-deleted-item-info">
                <div class="dms-deleted-item-name">
                    📄 ${documentTitle} - Version ${version.versionsnummer}
                </div>
                <div class="dms-deleted-item-details">
                    ${version.dateiname} • ${this.formatFileSize(version.dateigroesse)}
                </div>
                <div class="dms-deleted-item-meta">
                    ID: ${version.id} • ${i18n.t('dms.created')}: ${createdDate} • ${version.kommentar || i18n.t('dms.noComment')}
                </div>
            </div>
            <div class="dms-deleted-item-actions">
                <button class="dms-btn-restore" onclick="window.dmsManager?.restoreDocumentVersion(${version.documentId}, ${version.id}, '${documentTitle.replace(/'/g, "\\'")} v${version.versionsnummer}')">
                    ↻ Wiederherstellen
                </button>
            </div>
        `;
        
        return itemDiv;
    }
    
    /**
     * Restore a deleted document version
     */
    async restoreDocumentVersion(documentId: number, versionId: number, displayName: string): Promise<void> {
        try {
            const response = await fetch(`/dms/document/${documentId}/version/${versionId}/restore`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                }
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || 'Failed to restore document version');
            }

            const result = await response.json();
            
            // Show success message
            this.showSuccess(result.message || i18n.t('dms.versionRestoredSuccessfully').replace('{0}', displayName));
            
            // Refresh the deleted items modal
            await this.showDeletedItems();
            
        } catch (error) {
            console.error('Error restoring document version:', error);
            this.showError(i18n.t('dms.errorRestoringVersion') + ': ' + (error as Error).message);
        }
    }
    
    /**
     * Restore a deleted item
     */
    async restoreItem(id: number, type: string, name: string): Promise<void> {
        try {
            const endpoint = type === 'document' ? `/dms/document/${id}/restore` : `/dms/dossier/${id}/restore`;
            
            const response = await fetch(endpoint, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Restore operation failed');
            }
            
            const result = await response.json();
            
            // Show success message
            this.showSuccess(result.message || i18n.t(type === 'document' ? 'dms.documentRestoredSuccessfully' : 'dms.dossierRestoredSuccessfully').replace('{0}', name));
            
            // Refresh the deleted items modal
            await this.showDeletedItems();
            
        } catch (error) {
            console.error('Error restoring item:', error);
            this.showError(i18n.t('dms.errorRestoring') + ': ' + (error as Error).message);
        }
    }
    
    /**
     * Refresh the current view after delete operations
     */
    private async refreshCurrentView(): Promise<void> {
        console.log('[DMS] refreshCurrentView: Button clicked!');
        console.log('[DMS] refreshCurrentView: currentNode:', this.currentNode);
        
        try {
            if (this.currentNode) {
                console.log('[DMS] refreshCurrentView: Reloading current node:', this.currentNode.id, this.currentNode.type);
                // Reload the current node to reflect deleted items
                await this.navigateToNodeById(this.currentNode.id, this.currentNode.type);
            } else {
                console.log('[DMS] refreshCurrentView: No current node, reloading main tree view');
                // Reload the main tree view
                await this.loadRegistraturPlan();
            }
            console.log('[DMS] refreshCurrentView: Completed successfully');
        } catch (error) {
            console.error('[DMS] refreshCurrentView: Error occurred:', error);
            // Don't show error to user as the delete operation already succeeded
        }
    }
    
    // Share Link Management Methods
    private currentShareDossierId: number | null = null;
    
    /**
     * Show the share link management modal for a dossier
     */
    async showShareLinkModal(dossierId: number, dossierName: string): Promise<void> {
        this.currentShareDossierId = dossierId;
        
        const modal = document.getElementById('dms-share-link-modal');
        const nameElement = document.getElementById('dms-share-dossier-name');
        const toggle = document.getElementById('dms-public-sharing-toggle') as HTMLInputElement;
        
        if (!modal || !nameElement || !toggle) {
            console.error('Share link modal elements not found');
            return;
        }
        
        // Set dossier name
        nameElement.textContent = dossierName;
        
        // Load current sharing status
        await this.loadShareLinkStatus(dossierId);
        
        // Show modal
        modal.style.display = 'flex';
    }
    
    /**
     * Load the current sharing status for a dossier
     */
    private async loadShareLinkStatus(dossierId: number): Promise<void> {
        try {
            const response = await fetch(`/dms/dossier/${dossierId}/share-link`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                }
            });
            
            const toggle = document.getElementById('dms-public-sharing-toggle') as HTMLInputElement;
            const linkSection = document.getElementById('dms-share-link-section');
            const disabledInfo = document.getElementById('dms-share-disabled-info');
            const linkInput = document.getElementById('dms-share-link-input') as HTMLInputElement;
            
            if (!toggle || !linkSection || !disabledInfo || !linkInput) return;
            
            if (response.ok) {
                const data = await response.json();
                toggle.checked = data.isPublic;
                
                if (data.isPublic && data.fullUrl) {
                    linkInput.value = data.fullUrl;
                    linkSection.style.display = 'block';
                    disabledInfo.style.display = 'none';
                } else {
                    linkSection.style.display = 'none';
                    disabledInfo.style.display = 'block';
                }
            } else {
                // Dossier is not publicly shared
                toggle.checked = false;
                linkSection.style.display = 'none';
                disabledInfo.style.display = 'block';
            }
            
        } catch (error) {
            console.error('Error loading share link status:', error);
            this.showError('Fehler beim Laden des Freigabestatus: ' + (error as Error).message);
        }
    }
    
    /**
     * Toggle public sharing for the current dossier
     */
    async togglePublicSharing(): Promise<void> {
        if (!this.currentShareDossierId) {
            this.showError('Kein Dossier ausgewählt');
            return;
        }
        
        const toggle = document.getElementById('dms-public-sharing-toggle') as HTMLInputElement;
        if (!toggle) return;
        
        const isPublic = toggle.checked;
        
        try {
            const response = await fetch(`/dms/dossier/${this.currentShareDossierId}/public-sharing`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ isPublic })
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to update sharing settings');
            }
            
            const data = await response.json();
            
            const linkSection = document.getElementById('dms-share-link-section');
            const disabledInfo = document.getElementById('dms-share-disabled-info');
            const linkInput = document.getElementById('dms-share-link-input') as HTMLInputElement;
            
            if (!linkSection || !disabledInfo || !linkInput) return;
            
            if (isPublic && data.fullUrl) {
                linkInput.value = data.fullUrl;
                linkSection.style.display = 'block';
                disabledInfo.style.display = 'none';
                this.showSuccess('Öffentlicher Zugriff wurde aktiviert');
            } else {
                linkSection.style.display = 'none';
                disabledInfo.style.display = 'block';
                this.showSuccess('Öffentlicher Zugriff wurde deaktiviert');
            }
            
        } catch (error) {
            console.error('Error toggling public sharing:', error);
            this.showError('Fehler beim Ändern der Freigabeeinstellungen: ' + (error as Error).message);
            // Revert toggle state
            toggle.checked = !isPublic;
        }
    }
    
    /**
     * Copy the share link to clipboard
     */
    async copyShareLink(): Promise<void> {
        const linkInput = document.getElementById('dms-share-link-input') as HTMLInputElement;
        if (!linkInput || !linkInput.value) {
            this.showError('Kein Link verfügbar zum Kopieren');
            return;
        }
        
        try {
            await navigator.clipboard.writeText(linkInput.value);
            this.showSuccess('Link wurde in die Zwischenablage kopiert');
        } catch (error) {
            console.error('Error copying to clipboard:', error);
            // Fallback: select the text
            linkInput.select();
            linkInput.setSelectionRange(0, 99999); // For mobile devices
            
            try {
                document.execCommand('copy');
                this.showSuccess('Link wurde in die Zwischenablage kopiert');
            } catch (fallbackError) {
                this.showError('Kopieren nicht möglich. Bitte manuell markieren und kopieren.');
            }
        }
    }
    
    /**
     * Open the share link in a new tab
     */
    openShareLink(): void {
        const linkInput = document.getElementById('dms-share-link-input') as HTMLInputElement;
        if (!linkInput || !linkInput.value) {
            this.showError('Kein Link verfügbar zum Öffnen');
            return;
        }
        
        window.open(linkInput.value, '_blank');
    }
}

// Initialize DMS when the page loads
let dmsManager: DMSManager | undefined;

// Global logout function for DMS
(window as any).logout = function() {
    localStorage.removeItem('authToken');
    window.location.href = '/index.html';
};

// Function to setup CardCoin display with popup functionality
async function setupCardCoinDisplay() {
    try {
        const token = localStorage.getItem('authToken');
        if (!token) return;

        // Get the CardCoin balance element
        const balanceElement = document.getElementById('dms-cardcoin-balance');
        if (!balanceElement) return;

        // Get billing service instance
        const billingService = BillingService.getInstance();
        
        // Get current balance and update display
        const balance = await billingService.getBalance();
        balanceElement.textContent = `${balance.toFixed(4)} CardCoins`;
        
        // Make it clickable and add popup functionality
        balanceElement.style.cursor = 'pointer';
        balanceElement.style.transition = 'all 0.2s ease';
        
        // Add click handler for account modal
        balanceElement.addEventListener('click', async () => {
            try {
                await billingService.showAccountModal();
            } catch (error) {
                console.error('[DMS] Error showing account modal:', error);
            }
        });

        // Add hover effect
        balanceElement.addEventListener('mouseenter', () => {
            balanceElement.style.transform = 'scale(1.05)';
            balanceElement.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
        });
        
        balanceElement.addEventListener('mouseleave', () => {
            balanceElement.style.transform = 'scale(1)';
            balanceElement.style.boxShadow = 'none';
        });

    } catch (error) {
        console.error('[DMS] Error setting up CardCoin display:', error);
    }
}

// Function to load user account information
async function loadUserAccountInfo() {
    try {
        const token = localStorage.getItem('authToken');
        if (!token) {
            console.log('[DMS] No auth token found');
            return;
        }

        // Get user info from token payload
        const payload = JSON.parse(atob(token.split('.')[1]));
        const username = payload.username;
        
        if (username) {
            document.getElementById('dms-username')!.textContent = username;
        }

        // Setup CardCoin display with popup functionality
        await setupCardCoinDisplay();

        // Show the user info section
        const userInfoElement = document.getElementById('dms-user-info');
        if (userInfoElement) {
            userInfoElement.style.display = 'flex';
        }
    } catch (error) {
        console.error('[DMS] Error loading user account info:', error);
    }
}

console.log('[DMS] DMSScript.ts loaded - adding DOMContentLoaded listener');

document.addEventListener('DOMContentLoaded', () => {
    console.log('[DMS] DOMContentLoaded event fired - initializing DMSManager');
    dmsManager = new DMSManager();
    // Export for global access
    (window as any).dmsManager = dmsManager;
    console.log('[DMS] DMSManager initialized and exported to window.dmsManager');
    
    // Load user account information
    loadUserAccountInfo();
});