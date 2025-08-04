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
            .sidebar ul {
            list-style-type: none;
            padding-left: 0;
            }
            .sidebar ul li {
            margin-bottom: 8px;
            }
            .sidebar ul li a {
            text-decoration: none;
            color: #333;
            display: block;
            padding: 5px 10px;
            border-radius: 4px;
            }
            .sidebar ul li a:hover {
            background-color: #f5f5f5;
            }
            .sidebar ul ul {
            padding-left: 20px;
            display: none; /*Untermenüs standardmäßig ausblenden */
            }
            .sidebar ul li.active > ul {
            display: block; /*Untermenüs anzeigen, wenn aktiv */
            }
            .sidebar ul li.has-submenu > a::after {
            content: '▾';
            margin-left: 5px;
            }
            .sidebar ul li.has-submenu.active > a::after {
            content: '▴';
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
                            <h1 class="app-title">🃏 Lernkarten Management System</h1>
                            <p class="app-subtitle">Dashboard & Verwaltung</p>
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
                
                <div class="main-layout">
                    <nav class="sidebar">
                        <div class="sidebar-header">
                            <h2>🃏 Karten</h2>
                        </div>
                        
                        <div class="sidebar-section">
                            <h3 class="sidebar-section-title">Navigation</h3>
                            <ul class="sidebar-section-list">
                                <li><a href="#" id="homeLink">🏠 Startseite</a></li>
                            </ul>
                        </div>
                        
                        <div class="sidebar-section">
                            <h3 class="sidebar-section-title">Produkte</h3>
                            <ul class="sidebar-section-list">
                                <li class="has-submenu" id="materialMenu">
                                    <a href="#" id="materialMainLink">📚 Lernmaterial</a>
                                    <ul>
                                        <li><a href="#" id="materialLink">Unterlagen</a></li>
                                    </ul>
                                </li>
                                <li class="has-submenu" id="cardsMenu">
                                    <a href="#" id="cardsMainLink">🃏 Lernkarten</a>
                                    <ul>
                                        <li><a href="#" id="cardsLink">Karten Übersicht</a></li>
                                        <li><a href="#" id="topicLink">Lern Gebiete</a></li>
                                        <li><a href="#" id="newcardsLink">Neue Karte</a></li>
                                        <li><a href="#" id="manageCardsLink">Ändern</a></li>
                                        <li><a href="#" id="lernenCardsLink">Lernen</a></li>
                                        <li><a href="#" id="examManagementLink">Fragebögen</a></li>
                                        <li><a href="#" id="pruefenCardsLink">Prüfungen definieren</a></li>
                                        <li><a href="#" id="testCardsLink">Prüfungen ablegen</a></li>
                                    </ul>
                                </li>
                                <li><a href="#" id="imageLink">🖼️ Bilder</a></li>
                                <li class="has-submenu" id="buchungskartenMenu">
                                    <a href="#" id="buchungskartenMainLink">💳 Buchungskarten</a>
                                    <ul>
                                        <li><a href="#" id="buchungskartenUebersichtLink">Übersicht</a></li>
                                        <li><a href="#" id="buchungskartenNeuLink">Neu</a></li>
                                        <li><a href="#" id="buchungskartenAuswertungenLink">Auswertungen</a></li>
                                    </ul>
                                </li>
                                <li><a href="#" id="dmsLink">📁 Card DMS</a></li>
                            </ul>
                        </div>
                        
                        <div class="sidebar-section">
                            <h3 class="sidebar-section-title">Aktionen</h3>
                            <ul class="sidebar-section-list">
                                <li class="has-submenu" id="managementMenu" style="display: none;">
                                    <a href="#" id="managementMainLink">⚙️ Verwaltung</a>
                                    <ul>
                                        <li><a href="#" id="userManagementLink" style="display: none;">Benutzer</a></li>
                                        <li><a href="#" id="groupManagementLink" style="display: none;">Gruppen</a></li>
                                        <li><a href="#" id="roleManagementLink" style="display: none;">Rollen</a></li>
                                        <li><a href="#" id="productManagementLink" style="display: none;">Produkte</a></li>
                                        <li><a href="#" id="techInfoLink" style="display: none;">Technische Info</a></li>
                                        <li><a href="#" id="storageMigrationLink" style="display: none;">🔧 Speicher Migration</a></li>
                                    </ul>
                                </li>
                            </ul>
                        </div>
                    </nav>
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