<html>
    <head>
        <title>Memory</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link rel = "stylesheet" href="/static/frontstyles.css" type="text/css">
        <link rel = "stylesheet" href="/static/buchungskarten.css" type="text/css">
        <link rel = "stylesheet" href="/static/ImageScript.css" type="text/css">
        <link rel = "stylesheet" href="/static/TopicsScript.css" type="text/css">
        <link rel = "stylesheet" href="/static/material.css" type="text/css">
        <link rel = "stylesheet" href="/static/billing/css/billing.css" type="text/css">
        <link rel="stylesheet" href="https://fonts.googleapis.com/icon?family=Material+Icons">
        <script type="module" src="/static/js/common.js" defer></script>
        <script type="module"  src="/static/js/TopicsScript.js" defer></script>
        <script type="module"  src="/static/js/ImageScript.js" defer></script>
        <script type="module"  src="/static/js/CardScript.js" defer></script>
        <script type="module"  src="/static/js/LearnScript.js" defer></script>
        <script type="module"  src="/static/js/NewCardScript.js" defer></script>
        <script type="module"  src="/static/menu.js" defer></script>
        <script src="/static/mobile-nav.js" defer></script>
        <script type="module"  src="/static/js/ManageCardsScript.js" defer></script>
        <script type="module"  src="/static/js/ExamManagementScript.js" defer></script>
        <script type="module"  src="/static/js/Material.js" defer></script>
        <script type="module"  src="/static/js/BuchungskartenScript.js" defer></script>
        <script type="module"  src="/static/js/Authentication.js" defer></script>
        <script type="module"  src="/static/js/ManagementScript.js" defer></script>
        <script type="module"  src="/static/js/HomeScript.js" defer></script>
        <script type="module"  src="/static/js/pruefen_AssessmentScript.js" defer></script>
        <script type="module"  src="/static/js/pruefen_TestScript.js" defer></script>
        <script type="module"  src="/static/js/TechnicalInfoScript.js" defer></script>
        <script type="module"  src="/static/js/StorageMigrationScript.js" defer></script>
        <script type="module"  src="/static/js/billing/BillingService.js" defer></script>
        <script type="module"  src="/static/js/LegalPages.js" defer></script>


        <style>
            /* Horizontal Navigation Styles */
            .horizontal-nav {
                background: #ffffff;
                border-bottom: 1px solid #e9ecef;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                padding: 0;
                position: relative;
                z-index: 100;
            }
            
            .nav-container {
                display: flex;
                align-items: center;
                padding: 0 1rem;
                max-width: 1400px;
                margin: 0 auto;
                flex-wrap: wrap;
            }
            
            .nav-item {
                position: relative;
            }
            
            .nav-link {
                display: block;
                padding: 1rem 1.5rem;
                color: #2c3e50;
                text-decoration: none;
                font-weight: 500;
                transition: all 0.2s ease;
                border-radius: 4px;
                white-space: nowrap;
            }
            
            .nav-link:hover {
                background: #f8f9fa;
                color: #2196f3;
            }
            
            .dropdown-toggle::after {
                content: '▾';
                margin-left: 0.5rem;
                font-size: 0.8rem;
                transition: transform 0.2s ease;
            }
            
            .dropdown:hover .dropdown-toggle::after {
                transform: rotate(180deg);
            }
            
            .dropdown-menu {
                position: absolute;
                top: 100%;
                left: 0;
                background: white;
                border: 1px solid #e9ecef;
                border-radius: 8px;
                box-shadow: 0 4px 16px rgba(0,0,0,0.15);
                min-width: 200px;
                opacity: 0;
                visibility: hidden;
                transform: translateY(-10px);
                transition: all 0.2s ease;
                z-index: 1000;
            }
            
            .dropdown:hover .dropdown-menu {
                opacity: 1;
                visibility: visible;
                transform: translateY(0);
            }
            
            .dropdown-item {
                display: block;
                padding: 0.75rem 1rem;
                color: #2c3e50;
                text-decoration: none;
                border-radius: 0;
                transition: all 0.2s ease;
            }
            
            .dropdown-item:hover {
                background: #f8f9fa;
                color: #2196f3;
            }
            
            .dropdown-item:first-child {
                border-radius: 8px 8px 0 0;
            }
            
            .dropdown-item:last-child {
                border-radius: 0 0 8px 8px;
            }
            
            /* Mobile responsive navigation */
            @media (max-width: 768px) {
                .nav-container {
                    flex-direction: column;
                    align-items: stretch;
                    padding: 0;
                }
                
                .nav-item {
                    width: 100%;
                }
                
                .nav-link {
                    padding: 0.75rem 1rem;
                    border-bottom: 1px solid #f0f0f0;
                }
                
                .dropdown-menu {
                    position: static;
                    box-shadow: none;
                    border: none;
                    background: #f8f9fa;
                    opacity: 1;
                    visibility: visible;
                    transform: none;
                    display: none;
                }
                
                .dropdown:hover .dropdown-menu {
                    display: block;
                }
                
                .dropdown-item {
                    padding: 0.5rem 2rem;
                    border-bottom: 1px solid #e9ecef;
                }
            }
        </style>




    </head>
    <body>
        <!-- Fullscreen Login Mask -->
        <div class="fullscreen-login-mask" id="fullscreenLoginMask">
            <div class="fullscreen-login-container">
                <div class="fullscreen-login-header">
                    <div class="login-header-top">
                        <h1>🃏 Karten</h1>
                        <div id="loginLanguageSwitcher" class="login-language-switcher"></div>
                    </div>
                    <p id="fullscreenSubtitle">Willkommen zurück! Bitte melden Sie sich an, um fortzufahren.</p>
                </div>
                
                <!-- Form Toggle Buttons -->
                <div class="form-toggle-buttons">
                    <button type="button" class="form-toggle-btn active" id="loginToggle">
                        <div class="form-toggle-content">
                            <span class="form-toggle-icon">🔐</span>
                            <span class="form-toggle-title">Anmelden</span>
                            <span class="form-toggle-description">Bereits registriert?</span>
                        </div>
                    </button>
                    <button type="button" class="form-toggle-btn" id="registerToggle">
                        <div class="form-toggle-content">
                            <span class="form-toggle-icon">📝</span>
                            <span class="form-toggle-title">Registrieren</span>
                            <span class="form-toggle-description">Neues Konto erstellen</span>
                        </div>
                    </button>
                </div>

                <!-- Login Form -->
                <div class="fullscreen-login-form" id="loginFormContainer">
                    <form id="fullscreenLoginForm">
                        <div class="fullscreen-login-group">
                            <label for="fullscreenUsername">👤 Benutzername</label>
                            <input type="text" id="fullscreenUsername" placeholder="Benutzername eingeben" required>
                        </div>
                        <div class="fullscreen-login-group">
                            <label for="fullscreenPassword">🔒 Passwort</label>
                            <input type="password" id="fullscreenPassword" placeholder="Passwort eingeben" required>
                        </div>
                        <button type="submit" class="fullscreen-login-submit">
                            <span class="fullscreen-login-submit-icon">🚀</span>
                            <span>Anmelden</span>
                        </button>
                    </form>
                </div>

                <!-- Registration Form -->
                <div class="fullscreen-login-form" id="registerFormContainer" style="display: none;">
                    <form id="fullscreenRegisterForm">
                        <div class="fullscreen-login-group">
                            <label for="registerUsername">👤 Benutzername</label>
                            <input type="text" id="registerUsername" placeholder="Gewünschten Benutzername eingeben" required>
                        </div>
                        <div class="fullscreen-login-group">
                            <label for="registerEmail">📧 E-Mail</label>
                            <input type="email" id="registerEmail" placeholder="E-Mail-Adresse eingeben" required>
                        </div>
                        <div class="fullscreen-login-group">
                            <label for="registerPassword">🔒 Passwort</label>
                            <input type="password" id="registerPassword" placeholder="Passwort eingeben" required>
                        </div>
                        <div class="fullscreen-login-group">
                            <label for="registerPasswordConfirm">🔒 Passwort bestätigen</label>
                            <input type="password" id="registerPasswordConfirm" placeholder="Passwort wiederholen" required>
                        </div>
                        <button type="submit" class="fullscreen-login-submit">
                            <span class="fullscreen-login-submit-icon">🎉</span>
                            <span>Registrieren</span>
                        </button>
                    </form>
                </div>
            </div>
        </div>

        <!-- Authenticated UI -->
        <div class="authenticated-container" id="authenticatedContainer">
            <div class="container">
                <!-- Header Section -->
                <header class="app-header">
                    <div class="header-content">
                        <div class="header-left">
                            <div class="header-title-section">
                                <h1 class="app-title">🃏 Lernkarten Management System</h1>
                                <p class="app-subtitle">Dashboard & Verwaltung</p>
                            </div>
                        </div>
                        <div class="header-right login-button-container">
                            <div class="header-user-info">
                                <div class="user-account">
                                    <span class="login-status" id="loginStatus">Eingeloggt als: </span>
                                </div>
                                <div class="user-status">
                                    <span class="login-status-icon" id="headerLoginIcon">✅</span>
                                    <span id="headerLoginStatus">Online</span>
                                </div>
                            </div>
                            <div id="languageSwitcher" class="header-language-switcher"></div>
                            <button class="login-btn logout" id="loginButton">
                                <span class="login-btn-icon">🚪</span>
                                <span class="login-btn-text">Logout</span>
                            </button>
                        </div>
                    </div>
                </header>
                
                <!-- Horizontal Navigation -->
                <nav class="horizontal-nav">
                    <div class="nav-container">
                        <div class="nav-item">
                            <a href="#" id="homeLink" class="nav-link">🏠 Startseite</a>
                        </div>
                        
                        <div class="nav-item dropdown" id="materialMenu">
                            <a href="#" id="materialMainLink" class="nav-link dropdown-toggle">📚 Lernmaterial</a>
                            <div class="dropdown-menu">
                                <a href="#" id="materialLink" class="dropdown-item">Unterlagen</a>
                            </div>
                        </div>
                        
                        <div class="nav-item dropdown" id="cardsMenu">
                            <a href="#" id="cardsMainLink" class="nav-link dropdown-toggle">🃏 Lernkarten</a>
                            <div class="dropdown-menu">
                                <a href="#" id="cardsLink" class="dropdown-item">Karten Übersicht</a>
                                <a href="#" id="topicLink" class="dropdown-item">Lern Gebiete</a>
                                <a href="#" id="newcardsLink" class="dropdown-item">Neue Karte</a>
                                <a href="#" id="manageCardsLink" class="dropdown-item">Ändern</a>
                                <a href="#" id="lernenCardsLink" class="dropdown-item">Lernen</a>
                                <a href="#" id="examManagementLink" class="dropdown-item">Fragebögen</a>
                                <a href="#" id="pruefenCardsLink" class="dropdown-item">Prüfungen definieren</a>
                                <a href="#" id="testCardsLink" class="dropdown-item">Prüfungen ablegen</a>
                            </div>
                        </div>
                        
                        <div class="nav-item">
                            <a href="#" id="imageLink" class="nav-link">🖼️ Bilder</a>
                        </div>
                        
                        <div class="nav-item dropdown" id="buchungskartenMenu">
                            <a href="#" id="buchungskartenMainLink" class="nav-link dropdown-toggle">💳 Buchungskarten</a>
                            <div class="dropdown-menu">
                                <a href="#" id="buchungskartenUebersichtLink" class="dropdown-item">Übersicht</a>
                                <a href="#" id="buchungskartenNeuLink" class="dropdown-item">Neu</a>
                                <a href="#" id="buchungskartenAuswertungenLink" class="dropdown-item">Auswertungen</a>
                            </div>
                        </div>
                        
                        <div class="nav-item">
                            <a href="#" id="dmsLink" class="nav-link">📁 Card DMS</a>
                        </div>
                        
                        <div class="nav-item dropdown" id="managementMenu" style="display: none;">
                            <a href="#" id="managementMainLink" class="nav-link dropdown-toggle">⚙️ Verwaltung</a>
                            <div class="dropdown-menu">
                                <a href="#" id="userManagementLink" class="dropdown-item" style="display: none;">Benutzer</a>
                                <a href="#" id="groupManagementLink" class="dropdown-item" style="display: none;">Gruppen</a>
                                <a href="#" id="roleManagementLink" class="dropdown-item" style="display: none;">Rollen</a>
                                <a href="#" id="productManagementLink" class="dropdown-item" style="display: none;">Produkte</a>
                                <a href="#" id="techInfoLink" class="dropdown-item" style="display: none;">Technische Info</a>
                                <a href="#" id="storageMigrationLink" class="dropdown-item" style="display: none;">🔧 Speicher Migration</a>
                            </div>
                        </div>
                    </div>
                </nav>

                <div class="main-layout">
                    <main class="content" id="content">
                    <div id="homeContent"></div>
                    <div id="topicContent"></div>
                    <div id="imageContent"></div>
                    <div id="cardsContent"></div>
                    <div id="learnContent"></div>
                    <div id="newcardContent"></div>
                    <div id="examManagementContent"></div>
                    <div id="testContent"></div>
                    <div id="materialContent"></div>
                    <div id="buchungskartenContent"></div>
                    <div id="userManagementContent"></div>
                    <div id="groupManagementContent"></div>
                    <div id="roleManagementContent"></div>
                    <div id="productManagementContent"></div>
                    <div id="technicalInfoContent"></div>
                    
                    <!-- Legal Pages Content -->
                    <div id="privacyContent" style="display: none;"></div>
                    <div id="impressumContent" style="display: none;"></div>
                    <div id="termsContent" style="display: none;"></div>
                    <div id="cookiePolicyContent" style="display: none;"></div>
                    <div id="withdrawalContent" style="display: none;"></div>
                    <div id="refundContent" style="display: none;"></div>
                    <div id="securityContent" style="display: none;"></div>
                    <div id="communityContent" style="display: none;"></div>
                    <div id="faqContent" style="display: none;"></div>
                    <div id="contactContent" style="display: none;"></div>
                    </main>
                </div>
                
                <!-- Footer -->
                <footer class="app-footer">
                    <div class="footer-content">
                        <div class="footer-section">
                            <h4>🃏 Lernkarten Apps</h4>
                            <p>Professionelle Lernplattform für effektives Wissensmanagement</p>
                            <p><small>Demo Applikation, made in Dornbirn mit 💖, ☕ und ✨ (AI)</small></p>
                        </div>
                        
                        <div class="footer-section">
                            <h4>📋 Rechtliches</h4>
                            <ul class="footer-links">
                                <li><a href="#" id="privacyLink">Datenschutzerklärung</a></li>
                                <li><a href="#" id="impressumLink">Impressum</a></li>
                                <li><a href="#" id="termsLink">AGB</a></li>
                                <li><a href="#" id="cookiePolicyLink">Cookie-Richtlinie</a></li>
                                <li><a href="#" id="withdrawalLink">Widerrufsbelehrung</a></li>
                                <li><a href="#" id="refundLink">Rückgabe & Erstattung</a></li>
                            </ul>
                        </div>
                        
                        <div class="footer-section">
                            <h4>🛡️ Service</h4>
                            <ul class="footer-links">
                                <li><a href="#" id="securityLink">Sicherheitsrichtlinien</a></li>
                                <li><a href="#" id="communityLink">Community-Richtlinien</a></li>
                                <li><a href="#" id="faqLink">FAQ & Hilfe</a></li>
                                <li><a href="#" id="contactLink">Kontakt</a></li>
                            </ul>
                        </div>
                        
                        <div class="footer-section">
                            <h4>🏢 Anbieter</h4>
                            <p>
                                <strong>Stefan Hutter - ITK Beratung & Research</strong><br>
                                Austria<br>
                                Steuernummer: ATU61610509<br>
                                <a href="mailto:contact@m3-works.com" class="footer-contact-link">contact@m3-works.com</a><br>
                                <a href="https://www.m3-works.com" target="_blank" class="footer-contact-link">www.m3-works.com</a><br>
                                <br>
                                <strong>Lernkarten Apps</strong><br>
                                <a href="mailto:cards@m3-works.com" class="footer-contact-link">cards@m3-works.com</a><br>
                                Demo Applikation, made in Dornbirn mit 💖, ☕und ✨ (AI)
                            </p>
                        </div>
                    </div>
                    
                    <div class="footer-bottom">
                        <p>&copy; 2025 Stefan Hutter - ITK Beratung & Research. Alle Rechte vorbehalten. | Hosting: AWS Ireland (EU) | Dornbirn</p>
                    </div>
                </footer>
            </div>
        </div>

    </body>
</html>