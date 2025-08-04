import { i18n, Language } from './i18n/TranslationService.js';

class LegalPages {
    private currentPage: string | null = null;

    constructor() {
        this.initializeEventListeners();
        this.subscribeToLanguageChanges();
    }

    private initializeEventListeners(): void {
        document.getElementById('privacyLink')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.showPage('privacy');
        });

        document.getElementById('impressumLink')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.showPage('impressum');
        });

        document.getElementById('termsLink')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.showPage('terms');
        });

        document.getElementById('cookiePolicyLink')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.showPage('cookiePolicy');
        });

        document.getElementById('withdrawalLink')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.showPage('withdrawal');
        });

        document.getElementById('refundLink')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.showPage('refund');
        });

        document.getElementById('securityLink')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.showPage('security');
        });

        document.getElementById('communityLink')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.showPage('community');
        });

        document.getElementById('faqLink')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.showPage('faq');
        });

        document.getElementById('contactLink')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.showPage('contact');
        });
    }

    private showPage(pageId: string): void {
        // Create overlay with improved styling
        const overlay = document.createElement('div');
        overlay.className = 'legal-modal-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            z-index: 1000;
            display: flex;
            align-items: center;
            justify-content: center;
        `;
        
        // Create modal content with CardMS styling
        const modal = document.createElement('div');
        modal.className = 'legal-modal-content';
        modal.style.cssText = `
            background: white;
            border-radius: 8px;
            width: 90%;
            max-width: 800px;
            max-height: 90vh;
            overflow-y: auto;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
            position: relative;
        `;
        
        // Create header section
        const header = document.createElement('div');
        header.className = 'legal-modal-header';
        header.style.cssText = `
            padding: 1.5rem;
            border-bottom: 1px solid #e0e0e0;
            display: flex;
            justify-content: space-between;
            align-items: center;
        `;
        
        // Add title
        const title = document.createElement('h3');
        title.style.cssText = `
            margin: 0;
            font-size: 1.25rem;
            font-weight: 600;
            color: #333;
        `;
        title.textContent = this.getPageTitle(pageId);
        
        // Add close button with CardMS styling
        const closeButton = document.createElement('button');
        closeButton.innerHTML = '×';
        closeButton.className = 'legal-modal-close';
        closeButton.style.cssText = `
            background: #f8f9fa;
            border: 2px solid #e9ecef;
            border-radius: 50%;
            width: 35px;
            height: 35px;
            font-size: 18px;
            font-weight: bold;
            cursor: pointer;
            color: #6c757d;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s ease;
        `;
        closeButton.onclick = () => this.closeOverlay(overlay);
        
        // Add hover effect for close button
        closeButton.onmouseenter = () => {
            closeButton.style.background = '#e9ecef';
            closeButton.style.borderColor = '#dee2e6';
            closeButton.style.transform = 'scale(1.1)';
            closeButton.style.color = '#343a40';
        };
        closeButton.onmouseleave = () => {
            closeButton.style.background = '#f8f9fa';
            closeButton.style.borderColor = '#e9ecef';
            closeButton.style.transform = 'scale(1)';
            closeButton.style.color = '#6c757d';
        };
        
        header.appendChild(title);
        header.appendChild(closeButton);
        
        // Create body section
        const body = document.createElement('div');
        body.className = 'legal-modal-body';
        body.style.cssText = `
            padding: 1.5rem;
        `;
        
        // Add content with improved styling
        const contentDiv = document.createElement('div');
        contentDiv.className = 'legal-page';
        contentDiv.style.cssText = `
            color: #333;
            line-height: 1.6;
        `;
        contentDiv.innerHTML = this.getPageContent(pageId);
        
        body.appendChild(contentDiv);
        modal.appendChild(header);
        modal.appendChild(body);
        overlay.appendChild(modal);
        
        // Close on overlay click
        overlay.onclick = (e) => {
            if (e.target === overlay) {
                this.closeOverlay(overlay);
            }
        };
        
        // Close on Escape key
        const escapeHandler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                this.closeOverlay(overlay);
                document.removeEventListener('keydown', escapeHandler);
            }
        };
        document.addEventListener('keydown', escapeHandler);
        
        document.body.appendChild(overlay);
        this.currentPage = pageId;
    }
    
    private closeOverlay(overlay: HTMLElement): void {
        overlay.remove();
        this.currentPage = null;
    }

    private getPageTitle(pageId: string): string {
        const titles: Record<string, string> = {
            privacy: i18n.t('footer.privacy'),
            impressum: i18n.t('footer.impressum'),
            terms: i18n.t('footer.terms'),
            cookiePolicy: i18n.t('footer.cookiePolicy'),
            withdrawal: i18n.t('footer.withdrawal'),
            refund: i18n.t('footer.refund'),
            security: i18n.t('footer.security'),
            community: i18n.t('footer.community'),
            faq: i18n.t('footer.faq'),
            contact: i18n.t('footer.contact')
        };
        return titles[pageId] || pageId;
    }

    public getPageContent(pageId: string): string {
        const pages: Record<string, string> = {
            privacy: this.getPrivacyContent(),
            impressum: this.getImpressumContent(),
            terms: this.getTermsContent(),
            cookiePolicy: this.getCookiePolicyContent(),
            withdrawal: this.getWithdrawalContent(),
            refund: this.getRefundContent(),
            security: this.getSecurityContent(),
            community: this.getCommunityContent(),
            faq: this.getFaqContent(),
            contact: this.getContactContent(),
        };

        return pages[pageId] || '<h1>Seite nicht gefunden</h1>';
    }

    private subscribeToLanguageChanges(): void {
        i18n.subscribe((language: Language) => {
            if (this.currentPage) {
                // Refresh current page with new language
                this.showPage(this.currentPage);
            }
        });
    }

    private getPrivacyContent(): string {
        const lang = i18n.getCurrentLanguage();
        
        const content = {
            de: {
                title: '🔒 Datenschutzerklärung',
                lastUpdated: 'Letzte Aktualisierung: Januar 2025',
                responsible: '1. Verantwortlicher',
                dataCollected: '2. Erhobene Daten',
                registrationData: '2.1 Registrierungsdaten',
                usageData: '2.2 Nutzungsdaten',
                uploadedContent: '2.3 Hochgeladene Inhalte'
            },
            en: {
                title: '🔒 Privacy Policy',
                lastUpdated: 'Last updated: January 2025',
                responsible: '1. Data Controller',
                dataCollected: '2. Data Collected',
                registrationData: '2.1 Registration Data',
                usageData: '2.2 Usage Data',
                uploadedContent: '2.3 Uploaded Content'
            },
            fr: {
                title: '🔒 Politique de Confidentialité',
                lastUpdated: 'Dernière mise à jour: Janvier 2025',
                responsible: '1. Responsable du traitement',
                dataCollected: '2. Données collectées',
                registrationData: '2.1 Données d\'inscription',
                usageData: '2.2 Données d\'utilisation',
                uploadedContent: '2.3 Contenu téléchargé'
            },
            nl: {
                title: '🔒 Privacybeleid',
                lastUpdated: 'Laatst bijgewerkt: Januari 2025',
                responsible: '1. Verantwoordelijke',
                dataCollected: '2. Verzamelde gegevens',
                registrationData: '2.1 Registratiegegevens',
                usageData: '2.2 Gebruiksgegevens',
                uploadedContent: '2.3 Geüploade inhoud'
            }
        };

        const t = content[lang] || content.de;
        
        return `
            <div class="legal-page">
                <h1>${t.title}</h1>
                <p class="last-updated">${t.lastUpdated}</p>
                
                <section>
                    <h2>${t.responsible}</h2>
                    <p>
                        <strong>M3 - ICT Consulting & Research</strong><br>
                        Mitteldorfgasse 3<br>
                        6850 Dornbirn, ${lang === 'en' ? 'Austria' : lang === 'fr' ? 'Autriche' : lang === 'nl' ? 'Oostenrijk' : 'Österreich'}<br>
                        E-Mail: <a href="mailto:contact@m3-works.com">contact@m3-works.com</a><br>
                        <strong>Hosting:</strong> Dublin, ${lang === 'en' ? 'Ireland (EU) via AWS Ireland' : lang === 'fr' ? 'Irlande (UE) via AWS Ireland' : lang === 'nl' ? 'Ierland (EU) via AWS Ireland' : 'Irland (EU) via AWS Ireland'}
                    </p>
                </section>

                <section>
                    <h2>${t.dataCollected}</h2>
                    <h3>${t.registrationData}</h3>
                    <ul>
                        <li>${lang === 'en' ? 'Username and email address' : lang === 'fr' ? 'Nom d\'utilisateur et adresse e-mail' : lang === 'nl' ? 'Gebruikersnaam en e-mailadres' : 'Benutzername und E-Mail-Adresse'}</li>
                        <li>${lang === 'en' ? 'Encrypted password' : lang === 'fr' ? 'Mot de passe chiffré' : lang === 'nl' ? 'Versleuteld wachtwoord' : 'Verschlüsseltes Passwort'}</li>
                        <li>${lang === 'en' ? 'Registration timestamp' : lang === 'fr' ? 'Horodatage d\'inscription' : lang === 'nl' ? 'Registratietijdstempel' : 'Registrierungszeitpunkt'}</li>
                    </ul>

                    <h3>${t.usageData}</h3>
                    <ul>
                        <li>${lang === 'en' ? 'Created learning cards and materials' : lang === 'fr' ? 'Cartes d\'apprentissage et matériaux créés' : lang === 'nl' ? 'Gemaakte leerkaarten en materialen' : 'Erstellte Lernkarten und Materialien'}</li>
                        <li>${lang === 'en' ? 'Learning progress and test results' : lang === 'fr' ? 'Progrès d\'apprentissage et résultats des tests' : lang === 'nl' ? 'Leervoortgang en testresultaten' : 'Lernfortschritt und Testergebnisse'}</li>
                        <li>${lang === 'en' ? 'CardCoin transactions' : lang === 'fr' ? 'Transactions CardCoin' : lang === 'nl' ? 'CardCoin transacties' : 'CardCoin-Transaktionen'}</li>
                        <li>${lang === 'en' ? 'Access and activity logs' : lang === 'fr' ? 'Journaux d\'accès et d\'activité' : lang === 'nl' ? 'Toegangs- en activiteitslogs' : 'Zugriffs- und Aktivitätsprotokolle'}</li>
                    </ul>

                    <h3>${t.uploadedContent}</h3>
                    <ul>
                        <li>${lang === 'en' ? 'Uploaded images and graphics' : lang === 'fr' ? 'Images et graphiques téléchargés' : lang === 'nl' ? 'Geüploade afbeeldingen en grafiek' : 'Hochgeladene Bilder und Grafiken'}</li>
                        <li>${lang === 'en' ? 'Documents and files (PDF, Word, Excel, etc.)' : lang === 'fr' ? 'Documents et fichiers (PDF, Word, Excel, etc.)' : lang === 'nl' ? 'Documenten en bestanden (PDF, Word, Excel, enz.)' : 'Dokumente und Dateien (PDF, Word, Excel, etc.)'}</li>
                        <li>${lang === 'en' ? 'Learning materials and media content' : lang === 'fr' ? 'Matériaux d\'apprentissage et contenu média' : lang === 'nl' ? 'Leermaterialen en media-inhoud' : 'Lernmaterialien und Medieninhalte'}</li>
                        <li>DMS-Dokumente mit Versionierung</li>
                    </ul>

                    <h3>2.4 Technische Daten</h3>
                    <ul>
                        <li>LocalStorage-Daten (JWT-Tokens, Benutzereinstellungen)</li>
                        <li>SessionStorage-Daten (temporäre Sitzungsdaten)</li>
                    </ul>
                    
                    <p><strong>Hinweis:</strong> Wir speichern bewusst <em>keine</em> IP-Adressen, Browser-Informationen oder Gerätedaten, um Ihre Privatsphäre maximal zu schützen.</p>
                </section>

                <section>
                    <h2>3. Rechtsgrundlage</h2>
                    <p>Die Verarbeitung erfolgt auf Grundlage von:</p>
                    <ul>
                        <li><strong>Art. 6 Abs. 1 lit. b DSGVO</strong> - Vertragserfüllung</li>
                        <li><strong>Art. 6 Abs. 1 lit. f DSGVO</strong> - Berechtigte Interessen</li>
                        <li><strong>Art. 6 Abs. 1 lit. a DSGVO</strong> - Einwilligung (Cookies)</li>
                    </ul>
                </section>

                <section>
                    <h2>4. Speicherdauer</h2>
                    <ul>
                        <li><strong>Kontodaten:</strong> Bis zur Löschung des Accounts</li>
                        <li><strong>Lernmaterialien:</strong> Bis zur manuellen Löschung</li>
                        <li><strong>Protokolldaten:</strong> 90 Tage</li>
                        <li><strong>Backup-Daten:</strong> 30 Tage nach Löschung</li>
                    </ul>
                </section>

                <section>
                    <h2>5. Ihre Rechte</h2>
                    <p>Sie haben folgende Rechte:</p>
                    <ul>
                        <li><strong>Auskunft</strong> (Art. 15 DSGVO)</li>
                        <li><strong>Berichtigung</strong> (Art. 16 DSGVO)</li>
                        <li><strong>Löschung</strong> (Art. 17 DSGVO)</li>
                        <li><strong>Einschränkung</strong> (Art. 18 DSGVO)</li>
                        <li><strong>Datenübertragbarkeit</strong> (Art. 20 DSGVO)</li>
                        <li><strong>Widerspruch</strong> (Art. 21 DSGVO)</li>
                    </ul>
                </section>

                <section>
                    <h2>6. Datenübertragung</h2>
                    <p>Ihre Daten werden ausschließlich in EU-Rechenzentren in Irland verarbeitet. 
                    Eine Übertragung in Drittländer findet nicht statt.</p>
                </section>

                <section>
                    <h2>7. Cookies & Lokale Speicherung</h2>
                    <p><strong>Keine Cookies:</strong> Unsere Anwendung verwendet bewusst keine Cookies.</p>
                    <p><strong>Lokale Speicherung:</strong> Wir nutzen LocalStorage und SessionStorage für JWT-Authentifizierung und Benutzereinstellungen. Diese Daten bleiben auf Ihrem Gerät und werden nicht automatisch übertragen.</p>
                </section>

                <section>
                    <h2>8. Kontakt</h2>
                    <p>Bei Fragen zum Datenschutz wenden Sie sich an:<br>
                    <strong>M3 - ICT Consulting & Research</strong><br>
                    <a href="mailto:contact@m3-works.com">contact@m3-works.com</a></p>
                    
                    <p><strong>Aufsichtsbehörde:</strong><br>
                    Datenschutzbehörde Österreich<br>
                    Barichgasse 40-42, 1030 Wien<br>
                    <a href="mailto:dsb@dsb.gv.at">dsb@dsb.gv.at</a></p>
                </section>
            </div>
        `;
    }

    private getImpressumContent(): string {
        return `
            <div class="legal-page">
                <h1>📄 Impressum</h1>
                
                <section>
                    <h2>Medieninhaber und Herausgeber</h2>
                    <p><strong>M3 - ICT Consulting & Research</strong></p>
                    
                    <h2>Anschrift</h2>
                    <p>Mitteldorfgasse 3<br>6850 Dornbirn<br>Österreich</p>
                    
                    <h2>Kontakt</h2>
                    <p>
                        <strong>E-Mail:</strong> <a href="mailto:contact@m3-works.com">contact@m3-works.com</a><br>
                        <strong>Website:</strong> <a href="https://www.m3-works.com" target="_blank">www.m3-works.com</a>
                    </p>
                    
                    <h2>Unternehmensgegenstand</h2>
                    <p>ICT-Beratung und Research</p>
                    
                    <h2>UID-Nummer</h2>
                    <p>ATU61610509</p>
                    
                    <h2>Aufsichtsbehörde/Gewerbebehörde</h2>
                    <p>Magistrat der Stadt Dornbirn</p>
                    
                    <h2>Berufsrecht</h2>
                    <p>Es gelten folgende berufsrechtliche Regelungen: Gewerbeordnung: <a href="https://www.ris.bka.gv.at" target="_blank">www.ris.bka.gv.at</a></p>
                    
                    <h2>Verbraucherstreitbeilegung</h2>
                    <p>Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer 
                    Verbraucherschlichtungsstelle teilzunehmen.</p>
                </section>
            </div>
        `;
    }

    private getTermsContent(): string {
        return `
            <div class="legal-page">
                <h1>📋 Allgemeine Geschäftsbedingungen - Demo</h1>
                
                <section>
                    <div class="highlight-box info">
                        <h2>🎯 Demo-Applikation</h2>
                        <p><strong>Diese Anwendung ist eine kostenlose Demo-Version.</strong></p>
                        <p>Die folgenden AGB gelten für die Nutzung der Demo-Anwendung.</p>
                    </div>
                </section>

                <section>
                    <h2>§ 1 Geltungsbereich</h2>
                    <p>Diese Allgemeinen Geschäftsbedingungen gelten für die Nutzung der Demo-Anwendung 
                    "Lernkarten" von M3 - ICT Consulting & Research.</p>
                </section>

                <section>
                    <h2>§ 2 Demo-Status</h2>
                    <h3>2.1 Kostenlose Nutzung</h3>
                    <p>Die Demo-Anwendung wird kostenlos zur limitierten Nutzung angeboten. 
                    Es entstehen keine Kosten für die Nutzung der Demo-Features.</p>

                    <h3>2.2 Eingeschränkte Funktionalität</h3>
                    <p>Die Demo-Version hat eingeschränkte Funktionalitäten und dient ausschließlich 
                    zu Demonstrationszwecken.</p>

                    <h3>2.3 Keine produktive Nutzung</h3>
                    <p>Die Demo ist nicht für produktive Zwecke geeignet. Verwenden Sie keine 
                    sensiblen oder wichtigen Daten.</p>

                    <h3>2.4 Verfügbarkeit</h3>
                    <p>Als Demo-Applikation wird keine garantierte Verfügbarkeit zugesichert. 
                    Wartungsarbeiten werden nach Möglichkeit vorab angekündigt.</p>
                </section>

                <section>
                    <h2>§ 3 Nutzungsrechte</h2>
                    <p>Sie erhalten ein einfaches, nicht übertragbares Recht zur Nutzung der Demo-Anwendung 
                    zu Testzwecken.</p>
                </section>

                <section>
                    <h2>§ 4 Haftung</h2>
                    <h3>4.1 Haftungsausschluss</h3>
                    <p>Es wird keine Haftung für die Demo-Applikation übernommen. Die Nutzung erfolgt 
                    auf eigenes Risiko.</p>

                    <h3>4.2 Datenverlust</h3>
                    <p>Demo-Daten können jederzeit ohne Vorankündigung gelöscht werden. 
                    Es wird keine Haftung für Datenverlust übernommen.</p>
                </section>

                <section>
                    <h2>§ 5 Beendigung</h2>
                    <p>Die Demo-Nutzung kann jederzeit ohne Angabe von Gründen beendet werden. 
                    Accounts können ohne Vorwarnung deaktiviert werden.</p>
                </section>

                <section>
                    <h2>§ 6 Kontakt</h2>
                    <p>Bei Fragen zu diesen AGB wenden Sie sich an:<br>
                    <a href="mailto:contact@m3-works.com">contact@m3-works.com</a></p>
                </section>
            </div>
        `;
    }

    private getCookiePolicyContent(): string {
        return `
            <div class="legal-page">
                <h1>🍪 Cookie-Richtlinie</h1>
                <p class="last-updated">Letzte Aktualisierung: Januar 2025</p>
                
                <section>
                    <div class="highlight-box success">
                        <h2>🚫 Keine Cookies</h2>
                        <p><strong>Unsere Website verwendet keine Cookies.</strong></p>
                        <p>Wir haben uns bewusst dafür entschieden, vollständig auf Cookies zu verzichten, 
                        um Ihre Privatsphäre maximal zu schützen.</p>
                    </div>
                </section>

                <section>
                    <h2>Alternative Speichertechnologien</h2>
                    
                    <h3>LocalStorage</h3>
                    <p>Für die Authentifizierung verwenden wir LocalStorage zur Speicherung von JWT-Tokens. 
                    Diese Daten bleiben lokal auf Ihrem Gerät und werden nicht automatisch an Server übertragen.</p>
                    
                    <h3>SessionStorage</h3>
                    <p>Temporäre Sitzungsdaten werden in SessionStorage gespeichert und automatisch 
                    beim Schließen des Browsers gelöscht.</p>
                </section>

                <section>
                    <h2>Warum keine Cookies?</h2>
                    <ul>
                        <li><strong>Datenschutz:</strong> Keine automatische Übertragung von Tracking-Daten</li>
                        <li><strong>Transparenz:</strong> Volle Kontrolle über gespeicherte Daten</li>
                        <li><strong>Compliance:</strong> Keine Cookie-Banner oder Einwilligungsverfahren nötig</li>
                        <li><strong>Performance:</strong> Weniger HTTP-Overhead</li>
                    </ul>
                </section>

                <section>
                    <h2>Kontrolle über Ihre Daten</h2>
                    <p>Sie haben jederzeit volle Kontrolle über die lokal gespeicherten Daten:</p>
                    <ul>
                        <li>Löschen Sie LocalStorage über Ihren Browser</li>
                        <li>SessionStorage wird automatisch beim Schließen gelöscht</li>
                        <li>Keine versteckten Tracking-Mechanismen</li>
                    </ul>
                </section>

                <section>
                    <h2>Kontakt</h2>
                    <p>Bei Fragen zu unserer Cookie-freien Architektur wenden Sie sich an:<br>
                    <strong>M3 - ICT Consulting & Research</strong><br>
                    <a href="mailto:contact@m3-works.com">contact@m3-works.com</a></p>
                </section>
            </div>
        `;
    }

    private getWithdrawalContent(): string {
        return `
            <div class="legal-page">
                <h1>↩️ Account-Beendigung & Datennutzung</h1>
                
                <section>
                    <div class="highlight-box info">
                        <h2>🎯 Demo-Applikation</h2>
                        <p><strong>Da es sich um eine kostenlose Demo-Applikation handelt, gibt es keine Verträge im rechtlichen Sinne, die widerrufen werden müssten.</strong></p>
                    </div>
                </section>

                <section>
                    <h2>Account-Beendigung</h2>
                    <h3>Freiwillige Löschung</h3>
                    <p>Sie können Ihren Demo-Account jederzeit selbst löschen oder die Nutzung einstellen:</p>
                    <ul>
                        <li>Löschen Sie einfach Ihre lokalen Browser-Daten</li>
                        <li>Hören Sie auf, die Demo zu verwenden</li>
                        <li>Kontaktieren Sie uns für vollständige Account-Löschung</li>
                    </ul>

                    <h3>Automatische Bereinigung</h3>
                    <p>Demo-Accounts und -Daten werden regelmäßig automatisch bereinigt:</p>
                    <ul>
                        <li>Inaktive Accounts nach 90 Tagen</li>
                        <li>Demo-Daten werden periodisch zurückgesetzt</li>
                        <li>Keine langfristige Datenspeicherung</li>
                    </ul>
                </section>

                <section>
                    <h2>Datenexport (falls gewünscht)</h2>
                    <p>Obwohl es sich um eine Demo handelt, können Sie Ihre Test-Daten vor der Löschung exportieren:</p>
                    
                    <h3>Verfügbare Daten</h3>
                    <ul>
                        <li>Erstellte Demo-Lernkarten</li>
                        <li>Hochgeladene Test-Dateien</li>
                        <li>Demo-Konfigurationen</li>
                    </ul>

                    <h3>Export-Verfahren</h3>
                    <ul>
                        <li><strong>E-Mail:</strong> <a href="mailto:cards@m3-works.com">cards@m3-works.com</a></li>
                        <li><strong>Betreff:</strong> "Datenexport vor Account-Löschung"</li>
                        <li><strong>Angaben:</strong> Benutzername und E-Mail-Adresse</li>
                    </ul>
                </section>

                <section>
                    <h2>Nach der Beendigung</h2>
                    <ul>
                        <li><strong>Sofortige Deaktivierung:</strong> Account wird umgehend deaktiviert</li>
                        <li><strong>Datenlöschung:</strong> Alle Demo-Daten werden innerhalb von 30 Tagen gelöscht</li>
                        <li><strong>Backup-Bereinigung:</strong> Auch Backup-Systeme werden bereinigt</li>
                        <li><strong>Neuregistrierung:</strong> Jederzeit mit neuen Demo-Daten möglich</li>
                    </ul>
                </section>

                <section>
                    <h2>Kontakt</h2>
                    <p><strong>M3 - ICT Consulting & Research</strong><br>
                    <a href="mailto:contact@m3-works.com">contact@m3-works.com</a></p>
                </section>
            </div>
        `;
    }

    private getRefundContent(): string {
        return `
            <div class="legal-page">
                <h1>💸 Demo-Applikation - Kostenlose Nutzung</h1>
                
                <section>
                    <div class="highlight-box info">
                        <h2>🎯 Kostenlose Demo-Applikation</h2>
                        <p><strong>Diese Anwendung wird derzeit kostenlos zur limitierten Nutzung angeboten.</strong></p>
                        <p>Es wird keine Haftung für die Applikation wie auch für die Verfügbarkeit übernommen.</p>
                    </div>
                </section>

                <section>
                    <h2>Demo-Status</h2>
                    <h3>Keine Kosten</h3>
                    <ul>
                        <li>Die Demo-Version ist vollständig kostenlos</li>
                        <li>Keine versteckten Gebühren oder Abonnements</li>
                        <li>CardCoin-System ist nur zu Demonstrationszwecken</li>
                        <li>Keine echten Zahlungen erforderlich</li>
                    </ul>

                    <h3>Eingeschränkte Funktionalität</h3>
                    <ul>
                        <li>Begrenzte Features für Demo-Zwecke</li>
                        <li>Regelmäßige Datenbereinigung</li>
                        <li>Keine Service-Level-Agreements</li>
                        <li>Best-Effort Support</li>
                    </ul>
                </section>

                <section>
                    <h2>Zukünftige Vollversionen</h2>
                    <h3>Kommerzielle Lizenzen</h3>
                    <p>Für kommerzielle Vollversionen mit erweiterten Features:</p>
                    <ul>
                        <li>Professionelle Support-Services</li>
                        <li>Garantierte Verfügbarkeit</li>
                        <li>Erweiterte Funktionalitäten</li>
                        <li>Anpassbare Lizenzen</li>
                    </ul>

                    <h3>Interesse an Vollversion?</h3>
                    <p>Kontaktieren Sie uns für Informationen über kommerzielle Lizenzen:<br>
                    <a href="mailto:contact@m3-works.com">contact@m3-works.com</a></p>
                </section>

                <section>
                    <h2>Demo-Bedingungen</h2>
                    <h3>Nutzungsrechte</h3>
                    <ul>
                        <li>Kostenlose Nutzung zu Testzwecken</li>
                        <li>Keine kommerzielle Nutzung der Demo</li>
                        <li>Keine Garantien oder Gewährleistungen</li>
                        <li>Nutzung auf eigenes Risiko</li>
                    </ul>

                    <h3>Feedback erwünscht</h3>
                    <p>Ihr Feedback hilft uns bei der Weiterentwicklung:</p>
                    <ul>
                        <li>Feature-Wünsche</li>
                        <li>Bug-Reports</li>
                        <li>Usability-Feedback</li>
                    </ul>
                </section>

                <section>
                    <h2>Support & Kontakt</h2>
                    <p><strong>M3 - ICT Consulting & Research</strong><br>
                    <strong>Demo-Support:</strong> <a href="mailto:cards@m3-works.com">cards@m3-works.com</a><br>
                    <strong>Business-Anfragen:</strong> <a href="mailto:contact@m3-works.com">contact@m3-works.com</a></p>
                </section>
            </div>
        `;
    }

    private getSecurityContent(): string {
        return `
            <div class="legal-page">
                <h1>🛡️ Sicherheitsrichtlinien - Demo-Applikation</h1>
                
                <section>
                    <div class="highlight-box warning">
                        <h2>⚠️ Demo-Sicherheit</h2>
                        <p><strong>Diese Demo-Applikation implementiert grundlegende Sicherheitsmaßnahmen, bietet aber keine produktions-reifen Sicherheitsgarantien.</strong></p>
                        <p>Verwenden Sie keine sensiblen oder produktiven Daten in dieser Demo-Umgebung!</p>
                    </div>
                </section>
                
                <section>
                    <h2>🔐 Account-Sicherheit</h2>
                    
                    <h3>Passwort-Anforderungen</h3>
                    <ul>
                        <li><strong>Mindestlänge:</strong> 8 Zeichen</li>
                        <li><strong>Großbuchstaben:</strong> Mindestens 1</li>
                        <li><strong>Kleinbuchstaben:</strong> Mindestens 1</li>
                        <li><strong>Zahlen:</strong> Mindestens 1</li>
                        <li><strong>Sonderzeichen:</strong> Empfohlen</li>
                    </ul>

                    <h3>Demo-Empfehlungen</h3>
                    <ul>
                        <li><strong>Test-Passwörter:</strong> Verwenden Sie nur Test-Passwörter</li>
                        <li><strong>Keine produktiven Daten:</strong> Verwenden Sie keine echten Passwörter</li>
                        <li><strong>Demo-E-Mail:</strong> Nutzen Sie Test-E-Mail-Adressen</li>
                        <li><strong>Regelmäßige Löschung:</strong> Demo-Accounts werden regelmäßig bereinigt</li>
                        <li>Teilen Sie Ihre Zugangsdaten niemals mit anderen</li>
                    </ul>

                    <h3>Zwei-Faktor-Authentifizierung (2FA)</h3>
                    <p><em>Nicht verfügbar:</em> 2FA ist in dieser Demo-Version nicht implementiert.</p>
                </section>

                <section>
                    <h2>🔒 Grundlegende Sicherheitsmaßnahmen</h2>
                    
                    <h3>Datenübertragung</h3>
                    <ul>
                        <li><strong>HTTPS:</strong> Sichere Verbindungen für alle Datenübertragungen</li>
                        <li><strong>TLS-Verschlüsselung:</strong> Schutz während der Übertragung</li>
                        <li><strong>LocalStorage:</strong> Keine Cookies, Daten bleiben lokal</li>
                    </ul>

                    <h3>Datenspeicherung</h3>
                    <ul>
                        <li><strong>Passwort-Hashing:</strong> Passwörter werden verschlüsselt gespeichert</li>
                        <li><strong>JWT-Tokens:</strong> Sichere Authentifizierungstokens</li>
                        <li><strong>Demo-Umgebung:</strong> Keine produktions-kritischen Sicherheitsfeatures</li>
                    </ul>
                </section>

                <section>
                    <h2>🏢 Hosting & Infrastruktur</h2>
                    
                    <h3>AWS Ireland</h3>
                    <ul>
                        <li><strong>EU-Rechenzentrum:</strong> Hosting in Dublin, Irland</li>
                        <li><strong>AWS-Sicherheit:</strong> Nutzung der AWS-Sicherheitsinfrastruktur</li>
                        <li><strong>DSGVO-konform:</strong> EU-basierte Datenverarbeitung</li>
                        <li><strong>Demo-Setup:</strong> Vereinfachte Infrastruktur für Demonstrationszwecke</li>
                    </ul>

                    <h3>Datenschutz-Ansatz</h3>
                    <ul>
                        <li><strong>Privacy-First:</strong> Keine IP-Adressen oder Browser-Tracking</li>
                        <li><strong>Cookie-frei:</strong> Keine Cookies für maximale Privatsphäre</li>
                        <li><strong>Minimal-Prinzip:</strong> Nur notwendige Daten werden erhoben</li>
                        <li><strong>Transparenz:</strong> Offene Kommunikation über Demo-Limitierungen</li>
                    </ul>
                </section>

                <section>
                    <h2>⚠️ Demo-Limitierungen beachten</h2>
                    
                    <div class="highlight-box warning">
                        <h3>Wichtige Sicherheitshinweise für Demo-Nutzer</h3>
                        <ul>
                            <li><strong>Keine sensiblen Daten:</strong> Verwenden Sie keine echten, vertraulichen Informationen</li>
                            <li><strong>Test-Accounts:</strong> Erstellen Sie nur Test-Accounts für die Demo</li>
                            <li><strong>Öffentliche Demo:</strong> Andere Nutzer könnten Ihre Demo-Daten sehen</li>
                            <li><strong>Regelmäßige Bereinigung:</strong> Demo-Daten werden periodisch gelöscht</li>
                            <li><strong>Keine Produktions-Sicherheit:</strong> Demo-Level Sicherheitsmaßnahmen</li>
                        </ul>
                    </div>

                    <h3>Empfohlene Demo-Praktiken</h3>
                    <ul>
                        <li><strong>Fantasie-Daten:</strong> Verwenden Sie erfundene Namen und Informationen</li>
                        <li><strong>Test-E-Mails:</strong> Nutzen Sie temporäre E-Mail-Adressen</li>
                        <li><strong>Demo-Inhalte:</strong> Laden Sie nur Test-Dokumente hoch</li>
                        <li><strong>Kurze Sessions:</strong> Loggen Sie sich nach dem Testen aus</li>
                    </ul>
                </section>

                <section>
                    <h2>🔍 Probleme melden</h2>
                    
                    <h3>Demo-Support</h3>
                    <ul>
                        <li><strong>Best-Effort Basis:</strong> Support erfolgt nach Verfügbarkeit</li>
                        <li><strong>Entwicklungsfokus:</strong> Feedback zu Bugs und Features erwünscht</li>
                        <li><strong>Keine SLA:</strong> Keine garantierten Antwortzeiten</li>
                        <li><strong>Community-driven:</strong> Nutzer helfen sich gegenseitig</li>
                    </ul>

                    <h3>Was Sie melden sollten</h3>
                    <ul>
                        <li><strong>Bugs:</strong> Funktionsfehler in der Demo</li>
                        <li><strong>Security Issues:</strong> Potenzielle Sicherheitsprobleme</li>
                        <li><strong>Performance:</strong> Langsame Ladezeiten oder Abstürze</li>
                        <li><strong>Usability:</strong> Verwirrende Benutzeroberflächen</li>
                    </ul>
                </section>

                <section>
                    <h2>📧 Kontakt für Sicherheitsfragen</h2>
                    <p>
                        <strong>M3 - ICT Consulting & Research</strong><br>
                        <strong>E-Mail:</strong> <a href="mailto:contact@m3-works.com">contact@m3-works.com</a><br>
                        <strong>Produkt-Support:</strong> <a href="mailto:cards@m3-works.com">cards@m3-works.com</a><br>
                        <strong>Website:</strong> <a href="https://www.m3-works.com" target="_blank">www.m3-works.com</a><br>
                        <strong>Standort:</strong> Dornbirn, Österreich (Hosting: Dublin, Irland)<br>
                        <strong>Demo-Support:</strong> Best-Effort Basis, keine garantierten Antwortzeiten
                    </p>
                </section>
            </div>
        `;
    }

    private getCommunityContent(): string {
        return `
            <div class="legal-page">
                <h1>👥 Community-Richtlinien - Demo</h1>
                
                <section>
                    <div class="highlight-box info">
                        <h2>🎯 Demo-Community</h2>
                        <p><strong>Dies ist eine Demo-Anwendung mit vereinfachten Community-Richtlinien.</strong></p>
                        <p>Die beschriebenen Moderationsprozesse sind für Demonstrationszwecke vereinfacht dargestellt.</p>
                    </div>
                </section>

                <section>
                    <h2>🤝 Demo-Grundregeln</h2>
                    <p>Auch in einer Demo-Umgebung gelten grundlegende Regeln für einen respektvollen Umgang:</p>
                    
                    <h3>✅ Erwünschtes Verhalten</h3>
                    <ul>
                        <li>Respektvoller Umgang mit anderen Demo-Nutzern</li>
                        <li>Verwendung angemessener Sprache in Test-Inhalten</li>
                        <li>Erstellung sinnvoller Demo-Lernkarten für Testzwecke</li>
                        <li>Konstruktives Feedback zur Demo-Anwendung</li>
                    </ul>

                    <h3>❌ Zu vermeidendes Verhalten</h3>
                    <ul>
                        <li>Beleidigungen oder respektloses Verhalten</li>
                        <li>Upload unangemessener oder illegaler Inhalte</li>
                        <li>Spam oder Missbrauch der Demo-Funktionen</li>
                        <li>Versuche, die Demo-Sicherheit zu umgehen</li>
                    </ul>
                </section>

                <section>
                    <h2>🔧 Demo-Besonderheiten</h2>
                    
                    <h3>Automatische Bereinigung</h3>
                    <ul>
                        <li>Demo-Inhalte werden regelmäßig automatisch gelöscht</li>
                        <li>Problematische Inhalte werden ohne Vorwarnung entfernt</li>
                        <li>Accounts können bei Missbrauch sofort deaktiviert werden</li>
                        <li>Keine aufwändigen Beschwerdeverfahren in der Demo</li>
                    </ul>

                    <h3>Eingeschränkte Community-Features</h3>
                    <ul>
                        <li><strong>Kein Community-Chat</strong> oder soziale Interaktionen</li>
                        <li><strong>Keine Sharing-Funktionen</strong> zwischen Nutzern</li>
                        <li><strong>Begrenzte Benutzerprofile</strong> für Demo-Zwecke</li>
                        <li><strong>Vereinfachte Meldefunktionen</strong></li>
                    </ul>
                </section>

                <section>
                    <h2>⚖️ Vereinfachte Moderation</h2>
                    
                    <h3>Demo-Meldesystem</h3>
                    <p>Problematische Inhalte in der Demo können gemeldet werden:</p>
                    <ul>
                        <li><strong>E-Mail:</strong> <a href="mailto:cards@m3-works.com">cards@m3-works.com</a></li>
                        <li><strong>Betreff:</strong> "Demo - Problematischer Inhalt"</li>
                        <li><strong>Angaben:</strong> Beschreibung des Problems</li>
                    </ul>

                    <h3>Demo-Moderation</h3>
                    <ul>
                        <li><strong>Best-Effort Basis:</strong> Keine garantierten Bearbeitungszeiten</li>
                        <li><strong>Einfache Maßnahmen:</strong> Löschen oder Account-Deaktivierung</li>
                        <li><strong>Keine komplexen Verfahren:</strong> Schnelle, pragmatische Entscheidungen</li>
                        <li><strong>Fokus auf Demo-Betrieb:</strong> Aufrechterhaltung der Demo-Funktionalität</li>
                    </ul>
                </section>

                <section>
                    <h2>🛡️ Demo-Datenschutz</h2>
                    
                    <h3>Community-Daten</h3>
                    <ul>
                        <li>Nur die von Ihnen eingegebenen Test-Daten werden gespeichert</li>
                        <li>Keine Verfolgung von Nutzerinteraktionen über Demo-Zwecke hinaus</li>
                        <li>Regelmäßige Löschung aller Demo-Community-Inhalte</li>
                        <li>DSGVO-konforme Datenverarbeitung in der EU</li>
                    </ul>

                    <h3>Demo-Sicherheit</h3>
                    <ul>
                        <li><strong>Grundlegende Sicherheitsmaßnahmen</strong> implementiert</li>
                        <li><strong>Keine produktions-reifen Sicherheitsgarantien</strong></li>
                        <li><strong>Verwenden Sie keine sensiblen Daten</strong> in Demo-Inhalten</li>
                        <li><strong>Automatische Bereinigung</strong> problematischer Inhalte</li>
                    </ul>
                </section>

                <section>
                    <h2>🎯 Demo-Feedback</h2>
                    
                    <h3>Verbesserungsvorschläge</h3>
                    <p>Ihr Feedback zur Demo-Community ist willkommen:</p>
                    <ul>
                        <li><strong>Funktionalität:</strong> Was funktioniert gut/schlecht?</li>
                        <li><strong>Benutzerfreundlichkeit:</strong> Ist die Bedienung intuitiv?</li>
                        <li><strong>Features:</strong> Welche Funktionen fehlen?</li>
                        <li><strong>Performance:</strong> Wie ist die Geschwindigkeit?</li>
                    </ul>

                    <h3>Geplante Community-Features</h3>
                    <p><em>Für zukünftige Vollversionen in Entwicklung:</em></p>
                    <ul>
                        <li>Nutzer-zu-Nutzer Kommunikation</li>
                        <li>Sharing und Kollaboration bei Lernkarten</li>
                        <li>Community-Bewertungen und -Kommentare</li>
                        <li>Erweiterte Moderationswerkzeuge</li>
                        <li>Gamification und Belohnungssysteme</li>
                    </ul>
                </section>

                <section>
                    <h2>📞 Demo-Community Support</h2>
                    
                    <div class="highlight-box warning">
                        <h3>⚠️ Limitierter Support</h3>
                        <p>Community-Support erfolgt auf Best-Effort-Basis ohne Garantien!</p>
                    </div>

                    <div class="faq-item">
                        <h3>Anbieter der Demo</h3>
                        <p><strong>M3 - ICT Consulting & Research</strong><br>
                        Dornbirn, Österreich<br>
                        <strong>Demo-Projekt</strong> zur Technologie-Evaluation</p>
                    </div>

                    <div class="faq-item">
                        <h3>Community-Feedback</h3>
                        <p><strong>E-Mail:</strong> <a href="mailto:cards@m3-works.com">cards@m3-works.com</a><br>
                        <strong>Allgemeine Anfragen:</strong> <a href="mailto:contact@m3-works.com">contact@m3-works.com</a><br>
                        <strong>Website:</strong> <a href="https://www.m3-works.com" target="_blank">www.m3-works.com</a></p>
                    </div>

                    <div class="faq-item">
                        <h3>Support-Erwartungen</h3>
                        <ul>
                            <li><strong>Reaktionszeit:</strong> 1-3 Werktage (Best-Effort)</li>
                            <li><strong>Verfügbarkeit:</strong> Normale Geschäftszeiten</li>
                            <li><strong>Umfang:</strong> Grundlegende Demo-Unterstützung</li>
                            <li><strong>Sprachen:</strong> Deutsch, Englisch</li>
                        </ul>
                    </div>
                </section>
            </div>
        `;
    }

    private getFaqContent(): string {
        return `
            <div class="legal-page">
                <h1>❓ Häufig gestellte Fragen (FAQ) - Demo</h1>
                
                <section>
                    <div class="highlight-box info">
                        <h2>🎯 Demo-Applikation</h2>
                        <p><strong>Dies ist eine kostenlose Demo-Version der Lernkarten-Anwendung.</strong></p>
                        <p>Viele der unten beschriebenen Features sind für Demonstrationszwecke vereinfacht oder noch nicht vollständig implementiert.</p>
                    </div>
                </section>
                
                <section>
                    <h2>🚀 Erste Schritte</h2>
                    
                    <div class="faq-item">
                        <h3>Wie erstelle ich ein Demo-Konto?</h3>
                        <p>Klicken Sie auf "Registrieren" und geben Sie eine E-Mail-Adresse sowie ein Passwort ein. 
                        <strong>Hinweis:</strong> Verwenden Sie nur Test-Daten, da dies eine Demo-Umgebung ist.</p>
                    </div>

                    <div class="faq-item">
                        <h3>Was sind CardCoins in der Demo?</h3>
                        <p>CardCoins sind ein Demonstrationskonzept für ein Pay-per-Use-Modell. In der Demo sind sie nur zu Anschauungszwecken implementiert:</p>
                        <ul>
                            <li>Alle Aktionen funktionieren ohne echte Kosten</li>
                            <li>CardCoin-Anzeigen dienen nur der Demonstration</li>
                            <li>Keine echten Zahlungen oder Transaktionen</li>
                        </ul>
                    </div>

                    <div class="faq-item">
                        <h3>Kann ich echte Daten verwenden?</h3>
                        <p><strong>Nein!</strong> Verwenden Sie nur Testdaten in dieser Demo:</p>
                        <ul>
                            <li>Keine persönlichen oder vertraulichen Informationen</li>
                            <li>Keine produktiven Lernmaterialien</li>
                            <li>Demo-Daten werden regelmäßig bereinigt</li>
                        </ul>
                    </div>
                </section>

                <section>
                    <h2>🃏 Lernkarten</h2>
                    
                    <div class="faq-item">
                        <h3>Wie erstelle ich eine Lernkarte?</h3>
                        <p>Gehen Sie zu "Lernkarten" → "Neue Karte". Geben Sie Ihre Test-Frage und -Antwort ein, 
                        wählen Sie ein Thema und speichern Sie die Karte.</p>
                    </div>

                    <div class="faq-item">
                        <h3>Kann ich Bilder in Lernkarten verwenden?</h3>
                        <p>Ja! Sie können Test-Bilder hochladen. 
                        <strong>Hinweis:</strong> Laden Sie nur Demo-geeignete Bilder hoch.</p>
                    </div>

                    <div class="faq-item">
                        <h3>Gibt es einen Lernmodus?</h3>
                        <p>Ja! Der Demo-Lernmodus zeigt die geplante Funktionalität für systematisches Lernen. 
                        Einige erweiterte Features sind noch in Entwicklung.</p>
                    </div>
                </section>

                <section>
                    <h2>📚 Document Management System (DMS)</h2>
                    
                    <div class="faq-item">
                        <h3>Welche Dateiformate werden unterstützt?</h3>
                        <p>In der Demo: PDF, DOC, DOCX, TXT, JPG, PNG, GIF. 
                        <strong>Maximale Dateigröße:</strong> Begrenzt für Demo-Zwecke.</p>
                    </div>

                    <div class="faq-item">
                        <h3>Wie funktioniert das DMS?</h3>
                        <p>Das DMS demonstriert Dateiorganisation mit Ordnern, Versionierung und Metadaten. 
                        Die Demo zeigt die geplanten Funktionen für ein vollständiges Dokumentenmanagementsystem.</p>
                    </div>

                    <div class="faq-item">
                        <h3>Sind meine Demo-Dateien sicher?</h3>
                        <p>Demo-Dateien werden temporär gespeichert und regelmäßig gelöscht. 
                        Laden Sie keine wichtigen oder vertraulichen Dokumente hoch.</p>
                    </div>
                </section>

                <section>
                    <h2>🎯 Prüfungen & Tests</h2>
                    
                    <div class="faq-item">
                        <h3>Wie erstelle ich eine Test-Prüfung?</h3>
                        <p>Gehen Sie zu "Lernkarten" → "Prüfungen definieren". Die Demo zeigt das geplante Prüfungssystem 
                        mit konfigurierbaren Tests und Bewertungen.</p>
                    </div>

                    <div class="faq-item">
                        <h3>Werden Prüfungsergebnisse gespeichert?</h3>
                        <p>In der Demo werden Ergebnisse temporär gespeichert, um die Funktionalität zu demonstrieren. 
                        Alle Demo-Daten werden regelmäßig zurückgesetzt.</p>
                    </div>
                </section>

                <section>
                    <h2>🔧 Technische Demo-Details</h2>
                    
                    <div class="faq-item">
                        <h3>Welche Technologien werden demonstriert?</h3>
                        <p>Die Demo zeigt:</p>
                        <ul>
                            <li>Kotlin/Ktor Backend</li>
                            <li>TypeScript/JavaScript Frontend</li>
                            <li>PostgreSQL Datenbank</li>
                            <li>AWS-Hosting (Dublin, EU)</li>
                            <li>Cookie-freie Architektur</li>
                        </ul>
                    </div>

                    <div class="faq-item">
                        <h3>Wie sicher ist die Demo?</h3>
                        <p>Die Demo implementiert grundlegende Sicherheitsmaßnahmen, ist aber nicht für Produktivdaten geeignet:</p>
                        <ul>
                            <li>HTTPS-Verschlüsselung</li>
                            <li>JWT-Authentifizierung</li>
                            <li>EU-basierte Datenverarbeitung</li>
                            <li>Keine produktions-reifen Sicherheitsgarantien</li>
                        </ul>
                    </div>

                    <div class="faq-item">
                        <h3>Welche Browser werden unterstützt?</h3>
                        <p>Die Demo funktioniert mit modernen Browsern: 
                        Chrome 90+, Firefox 88+, Safari 14+, Edge 90+.</p>
                    </div>
                </section>

                <section>
                    <h2>🛡️ Demo-Datenschutz</h2>
                    
                    <div class="faq-item">
                        <h3>Welche Daten werden in der Demo gespeichert?</h3>
                        <p>Nur die von Ihnen eingegebenen Test-Daten:</p>
                        <ul>
                            <li>Test-Benutzername und E-Mail</li>
                            <li>Demo-Lernkarten und -Materialien</li>
                            <li>Hochgeladene Test-Dateien</li>
                            <li><strong>Keine</strong> IP-Adressen oder Browser-Tracking</li>
                        </ul>
                    </div>

                    <div class="faq-item">
                        <h3>Kann ich mein Demo-Konto löschen?</h3>
                        <p>Ja, Demo-Accounts können jederzeit gelöscht werden. 
                        Alle Demo-Daten werden regelmäßig automatisch bereinigt.</p>
                    </div>

                    <div class="faq-item">
                        <h3>Wo werden Demo-Daten gespeichert?</h3>
                        <p>Alle Demo-Daten werden in EU-Rechenzentren (Dublin, Irland) gespeichert 
                        und unterliegen der DSGVO.</p>
                    </div>
                </section>

                <section>
                    <h2>📞 Demo-Support & Kontakt</h2>
                    <div class="highlight-box warning">
                        <h3>⚠️ Demo-Support</h3>
                        <p>Dies ist eine Demo-Anwendung mit limitiertem Support!</p>
                    </div>
                    
                    <div class="faq-item">
                        <h3>Wer bietet diese Demo an?</h3>
                        <p><strong>M3 - ICT Consulting & Research</strong><br>
                        Österreichisches ICT-Beratungsunternehmen<br>
                        Standort: Dornbirn, Vorarlberg</p>
                    </div>

                    <div class="faq-item">
                        <h3>Wie kann ich Feedback geben?</h3>
                        <p>Für Feedback zur Demo-Anwendung:</p>
                        <ul>
                            <li><strong>E-Mail:</strong> <a href="mailto:cards@m3-works.com">cards@m3-works.com</a></li>
                            <li><strong>Allgemeine Anfragen:</strong> <a href="mailto:contact@m3-works.com">contact@m3-works.com</a></li>
                            <li><strong>Website:</strong> <a href="https://www.m3-works.com" target="_blank">www.m3-works.com</a></li>
                        </ul>
                    </div>

                    <div class="faq-item">
                        <h3>Gibt es kommerzielle Versionen?</h3>
                        <p>Für Informationen über kommerzielle Lizenzen oder Vollversionen 
                        kontaktieren Sie uns über <a href="mailto:contact@m3-works.com">contact@m3-works.com</a></p>
                    </div>

                    <div class="faq-item">
                        <h3>Wie ist die Support-Reaktionszeit?</h3>
                        <p><strong>Demo-Support:</strong> Best-Effort Basis (1-3 Werktage)<br>
                        <strong>Keine 24/7-Hotline</strong> oder Live-Chat für Demo-Version<br>
                        <strong>Nur E-Mail-Support</strong> verfügbar</p>
                    </div>
                </section>
            </div>
        `;
    }

    private getContactContent(): string {
        return `
            <div class="legal-page">
                <h1>📞 Kontakt - Demo-Applikation</h1>
                
                <section>
                    <div class="highlight-box info">
                        <h2>🎯 Demo-Status</h2>
                        <p><strong>Diese Anwendung ist eine kostenlose Demo-Version.</strong></p>
                        <p>Support erfolgt auf Best-Effort-Basis ohne garantierte Antwortzeiten.</p>
                    </div>
                </section>

                <section>
                    <h2>🏢 Anbieter</h2>
                    <div class="contact-card">
                        <h3>M3 - ICT Consulting & Research</h3>
                        <p>
                            Mitteldorfgasse 3<br>
                            6850 Dornbirn<br>
                            Österreich
                        </p>
                        <p>
                            <strong>USt-IdNr.:</strong> ATU61610509<br>
                            <strong>Website:</strong> <a href="https://www.m3-works.com" target="_blank">www.m3-works.com</a>
                        </p>
                    </div>
                </section>

                <section>
                    <h2>💬 Kontakt-Möglichkeiten</h2>
                    
                    <div class="support-channels">
                        <div class="support-channel">
                            <h3>📧 E-Mail Kontakt</h3>
                            <p><strong>Allgemeine Anfragen:</strong><br>
                            <a href="mailto:contact@m3-works.com">contact@m3-works.com</a></p>
                            
                            <p><strong>Demo-Support:</strong><br>
                            <a href="mailto:cards@m3-works.com">cards@m3-works.com</a></p>
                            
                            <p><strong>Reaktionszeit:</strong> Best-Effort Basis (normalerweise 1-3 Werktage)</p>
                        </div>

                        <div class="support-channel">
                            <h3>🌍 Hosting-Information</h3>
                            <p><strong>Server-Standort:</strong> Dublin, Irland (AWS EU)</p>
                            <p><strong>Anbieter-Standort:</strong> Dornbirn, Österreich</p>
                            <p><strong>DSGVO-konform:</strong> Ja, EU-basierte Datenverarbeitung</p>
                        </div>

                        <div class="support-channel">
                            <h3>⚠️ Demo-Limitierungen</h3>
                            <p><strong>Kein Telefon-Support</strong> für Demo-Version</p>
                            <p><strong>Kein Live-Chat</strong> verfügbar</p>
                            <p><strong>Eingeschränkte Support-Zeiten</strong></p>
                            <p><strong>Nur E-Mail-Kontakt</strong> für Demo-Nutzer</p>
                        </div>
                    </div>
                </section>

                <section>
                    <h2>🎯 Spezielle Anfragen</h2>
                    
                    <div class="special-contacts">
                        <div class="contact-category">
                            <h3>🔒 Datenschutz</h3>
                            <p><strong>Datenschutz-Anfragen:</strong><br>
                            <a href="mailto:contact@m3-works.com">contact@m3-works.com</a></p>
                            <p>Für DSGVO-Anfragen und Datenschutz-Fragen zur Demo.</p>
                        </div>

                        <div class="contact-category">
                            <h3>🛡️ Sicherheit</h3>
                            <p><strong>Sicherheitsprobleme:</strong><br>
                            <a href="mailto:contact@m3-works.com">contact@m3-works.com</a></p>
                            <p>Meldung von Sicherheitslücken in der Demo-Anwendung.</p>
                        </div>

                        <div class="contact-category">
                            <h3>💡 Feedback</h3>
                            <p><strong>Demo-Feedback:</strong><br>
                            <a href="mailto:cards@m3-works.com">cards@m3-works.com</a></p>
                            <p>Ihr Feedback zur Demo-Anwendung und Verbesserungsvorschläge.</p>
                        </div>

                        <div class="contact-category">
                            <h3>🚀 Interesse an Vollversion</h3>
                            <p><strong>Business-Anfragen:</strong><br>
                            <a href="mailto:contact@m3-works.com">contact@m3-works.com</a></p>
                            <p>Interesse an einer kommerziellen Vollversion oder Lizenzierung.</p>
                        </div>
                    </div>
                </section>

                <section>
                    <h2>⏰ Demo-Support Hinweise</h2>
                    
                    <div class="service-info">
                        <h3>📋 Was Sie erwarten können:</h3>
                        <ul>
                            <li><strong>E-Mail-Antworten:</strong> 1-3 Werktage (Best-Effort)</li>
                            <li><strong>Technische Hilfe:</strong> Grundlegende Unterstützung</li>
                            <li><strong>Feedback-Verarbeitung:</strong> Berücksichtigung für zukünftige Versionen</li>
                            <li><strong>Datenschutz-Anfragen:</strong> Vollständige DSGVO-Compliance</li>
                        </ul>

                        <h3>📋 Demo-Beschränkungen:</h3>
                        <ul>
                            <li><strong>Kein 24/7 Support</strong> wie bei kommerziellen Produkten</li>
                            <li><strong>Keine SLA-Garantien</strong> für Antwortzeiten</li>
                            <li><strong>Begrenzte technische Unterstützung</strong></li>
                            <li><strong>Fokus auf Feedback-Sammlung</strong> für Produktentwicklung</li>
                        </ul>
                    </div>
                </section>

                <section>
                    <h2>🇦🇹 Über M3 - ICT Consulting & Research</h2>
                    <div class="location-info">
                        <h3>Standort Dornbirn</h3>
                        <p>M3 - ICT Consulting & Research ist ein österreichisches Beratungsunternehmen 
                        mit Sitz in Dornbirn, Vorarlberg.</p>
                        
                        <p><strong>Spezialisierung:</strong></p>
                        <ul>
                            <li>ICT-Beratung und Forschung</li>
                            <li>Software-Entwicklung und Prototyping</li>
                            <li>Demo-Anwendungen und Proof-of-Concepts</li>
                            <li>Technologie-Evaluierung</li>
                        </ul>

                        <p><strong>Demo-Projekt:</strong> Diese Lernkarten-Anwendung ist ein Demonstrationsprojekt 
                        zur Evaluation moderner Web-Technologien und Lernmethoden.</p>
                    </div>
                </section>
            </div>
        `;
    }
}

// Initialize legal pages when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    (window as any).legalPages = new LegalPages();
});

export { LegalPages };