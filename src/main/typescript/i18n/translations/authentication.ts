/**
 * Authentication translations for all languages
 */

export const authenticationTranslations = {
    de: {
        // Login/Register interface
        welcomeBack: 'Willkommen zurück! Bitte melden Sie sich an, um fortzufahren.',
        login: 'Anmelden',
        register: 'Registrieren',
        alreadyRegistered: 'Bereits registriert?',
        createAccount: 'Neues Konto erstellen',
        loggedInAs: 'Eingeloggt als',
        online: 'Online',
        offline: 'Offline',
        
        // Authentication states
        loggingIn: 'Anmelden...',
        registering: 'Registrieren...',
        loggedOut: 'Abgemeldet',
        sessionActive: 'Sitzung aktiv',
        
        // Error messages
        loginFailed: 'Anmeldung fehlgeschlagen',
        registrationFailed: 'Registrierung fehlgeschlagen',
        invalidCredentials: 'Ungültige Anmeldedaten',
        userExists: 'Ein Benutzer mit diesem Namen oder dieser E-Mail-Adresse existiert bereits',
        noAuth: 'Keine Authentifizierung gefunden. Bitte melden Sie sich an.',
        sessionExpired: 'Sitzung abgelaufen. Bitte melden Sie sich erneut an.',
        accessDenied: 'Zugriff verweigert',
        unauthorized: 'Nicht autorisiert',
        
        // Success messages
        loginSuccess: 'Erfolgreich angemeldet',
        registrationSuccess: 'Erfolgreich registriert',
        logoutSuccess: 'Erfolgreich abgemeldet',
        
        // User status
        userStatus: 'Benutzerstatus',
        lastLogin: 'Letzte Anmeldung',
        accountCreated: 'Konto erstellt',
        profileUpdated: 'Profil aktualisiert',
        
        // Account management
        myAccount: 'Mein Konto',
        accountSettings: 'Kontoeinstellungen',
        changePassword: 'Passwort ändern',
        updateProfile: 'Profil aktualisieren',
        deleteAccount: 'Konto löschen',
        
        // Permissions
        permissions: 'Berechtigungen',
        roles: 'Rollen',
        adminAccess: 'Administrator-Zugriff',
        userAccess: 'Benutzer-Zugriff',
        readOnly: 'Nur lesen',
        fullAccess: 'Vollzugriff',
        
        // Welcome messages
        welcomeBackLogin: 'Willkommen zurück! Bitte melden Sie sich an, um fortzufahren.',
        newUserWelcome: 'Neu hier? Erstellen Sie ein Konto, um zu beginnen.',
        
        // Login errors and validations
        pleaseEnterCredentials: 'Bitte Benutzername und Passwort eingeben',
        loginFailedCheckCredentials: 'Login fehlgeschlagen. Bitte prüfen Sie Ihre Anmeldedaten.',
        loginFailedTryLater: 'Login fehlgeschlagen. Bitte versuchen Sie es später erneut.',
        
        // Registration validations
        pleaseFillAllFields: 'Bitte alle Felder ausfüllen',
        passwordsDoNotMatch: 'Passwörter stimmen nicht überein',
        pleaseEnterValidEmail: 'Bitte eine gültige E-Mail-Adresse eingeben',
        
        // Registration success/error
        registrationSuccessful: 'Registrierung erfolgreich! Sie können sich jetzt anmelden.',
        registrationFailedTryAgain: 'Registrierung fehlgeschlagen. Bitte versuchen Sie es erneut.',
        registrationFailedTryLater: 'Registrierung fehlgeschlagen. Bitte versuchen Sie es später erneut.',
        
        // Form validation specific messages
        pleaseEnterValidEmailAddress: 'Bitte geben Sie eine gültige E-Mail-Adresse ein.',
        passwordTooWeak: 'Das Passwort ist zu schwach. Bitte wählen Sie ein stärkeres Passwort.',
        usernameInvalid: 'Der Benutzername ist ungültig. Bitte wählen Sie einen anderen Namen.',
        
        // New missing keys from Authentication.ts
        formElementsNotFound: 'Formular-Elemente nicht gefunden',
        loginSuccessful: 'Login erfolgreich!',
        passwordMinLength: 'Passwort muss mindestens 6 Zeichen lang sein',
        registrationFailedPleaseRetry: 'Registrierung fehlgeschlagen. Bitte versuchen Sie es erneut.',
        userAlreadyExists: 'Ein Benutzer mit diesem Namen oder dieser E-Mail-Adresse existiert bereits.',
        loggedOutSuccessfully: 'Erfolgreich abgemeldet',
        logout: 'Logout',
        userAlreadyExistsTitle: 'Benutzer existiert bereits',
        userAlreadyExistsMessage: 'Ein Benutzer mit diesem Namen oder dieser E-Mail-Adresse ist bereits registriert.',
        wouldYouLikeToLogin: 'Möchten Sie sich stattdessen anmelden?',
        goToLogin: 'Zur Anmeldung',
        enterDifferentData: 'Andere Daten eingeben',
        
        // Email verification messages
        registrationEmailVerificationRequired: '📧 Registrierung erfolgreich! Bitte überprüfen Sie Ihre E-Mails und klicken Sie auf den Bestätigungslink.',
        registrationSuccessfulButEmailFailed: '⚠️ Registrierung erfolgreich, aber E-Mail-Versand fehlgeschlagen. Bitte kontaktieren Sie den Support.',
        emailVerificationTitle: 'E-Mail-Bestätigung erforderlich',
        step1: 'Schritt 1',
        step2: 'Schritt 2', 
        step3: 'Schritt 3',
        step4: 'Schritt 4',
        registrationComplete: 'Ihr Konto wurde erfolgreich erstellt',
        checkYourEmail: 'Überprüfen Sie Ihr E-Mail-Postfach',
        clickVerificationLink: 'Klicken Sie auf den Bestätigungslink in der E-Mail',
        thenYouCanLogin: 'Dann können Sie sich anmelden',
        emailVerificationNote: 'Der Bestätigungslink ist 24 Stunden gültig. Falls Sie keine E-Mail erhalten haben, überprüfen Sie Ihren Spam-Ordner.',
        understood: 'Verstanden'
    },
    
    en: {
        // Login/Register interface
        welcomeBack: 'Welcome back! Please sign in to continue.',
        login: 'Sign In',
        register: 'Register',
        alreadyRegistered: 'Already registered?',
        createAccount: 'Create new account',
        loggedInAs: 'Logged in as',
        online: 'Online',
        offline: 'Offline',
        
        // Authentication states
        loggingIn: 'Signing in...',
        registering: 'Registering...',
        loggedOut: 'Logged out',
        sessionActive: 'Session active',
        
        // Error messages
        loginFailed: 'Login failed',
        registrationFailed: 'Registration failed',
        invalidCredentials: 'Invalid credentials',
        userExists: 'A user with this name or email address already exists',
        noAuth: 'No authentication found. Please sign in.',
        sessionExpired: 'Session expired. Please sign in again.',
        accessDenied: 'Access denied',
        unauthorized: 'Unauthorized',
        
        // Success messages
        loginSuccess: 'Successfully signed in',
        registrationSuccess: 'Successfully registered',
        logoutSuccess: 'Successfully signed out',
        
        // User status
        userStatus: 'User status',
        lastLogin: 'Last login',
        accountCreated: 'Account created',
        profileUpdated: 'Profile updated',
        
        // Account management
        myAccount: 'My Account',
        accountSettings: 'Account Settings',
        changePassword: 'Change Password',
        updateProfile: 'Update Profile',
        deleteAccount: 'Delete Account',
        
        // Permissions
        permissions: 'Permissions',
        roles: 'Roles',
        adminAccess: 'Administrator Access',
        userAccess: 'User Access',
        readOnly: 'Read Only',
        fullAccess: 'Full Access',
        
        // Welcome messages
        welcomeBackLogin: 'Welcome back! Please sign in to continue.',
        newUserWelcome: 'New here? Create an account to get started.',
        
        // Login errors and validations
        pleaseEnterCredentials: 'Please enter username and password',
        loginFailedCheckCredentials: 'Login failed. Please check your credentials.',
        loginFailedTryLater: 'Login failed. Please try again later.',
        
        // Registration validations
        pleaseFillAllFields: 'Please fill in all fields',
        passwordsDoNotMatch: 'Passwords do not match',
        pleaseEnterValidEmail: 'Please enter a valid email address',
        
        // Registration success/error
        registrationSuccessful: 'Registration successful! You can now log in.',
        registrationFailedTryAgain: 'Registration failed. Please try again.',
        registrationFailedTryLater: 'Registration failed. Please try again later.',
        
        // Form validation specific messages
        pleaseEnterValidEmailAddress: 'Please enter a valid email address.',
        passwordTooWeak: 'The password is too weak. Please choose a stronger password.',
        usernameInvalid: 'The username is invalid. Please choose a different name.',
        
        // New missing keys from Authentication.ts
        formElementsNotFound: 'Form elements not found',
        loginSuccessful: 'Login successful!',
        passwordMinLength: 'Password must be at least 6 characters long',
        registrationFailedPleaseRetry: 'Registration failed. Please try again.',
        userAlreadyExists: 'A user with this name or email address already exists.',
        loggedOutSuccessfully: 'Successfully logged out',
        logout: 'Logout',
        userAlreadyExistsTitle: 'User already exists',
        userAlreadyExistsMessage: 'A user with this name or email address is already registered.',
        wouldYouLikeToLogin: 'Would you like to sign in instead?',
        goToLogin: 'Go to Login',
        enterDifferentData: 'Enter different data',
        
        // Email verification messages
        registrationEmailVerificationRequired: '📧 Registration successful! Please check your email and click the verification link.',
        registrationSuccessfulButEmailFailed: '⚠️ Registration successful, but email sending failed. Please contact support.',
        emailVerificationTitle: 'Email Verification Required',
        step1: 'Step 1',
        step2: 'Step 2',
        step3: 'Step 3',
        step4: 'Step 4',
        registrationComplete: 'Your account has been successfully created',
        checkYourEmail: 'Check your email inbox',
        clickVerificationLink: 'Click the verification link in the email',
        thenYouCanLogin: 'Then you can log in',
        emailVerificationNote: 'The verification link is valid for 24 hours. If you haven\'t received an email, check your spam folder.',
        understood: 'Understood'
    },
    
    fr: {
        // Login/Register interface
        welcomeBack: 'Bon retour ! Veuillez vous connecter pour continuer.',
        login: 'Se Connecter',
        register: 'S\'inscrire',
        alreadyRegistered: 'Déjà inscrit ?',
        createAccount: 'Créer un nouveau compte',
        loggedInAs: 'Connecté en tant que',
        online: 'En ligne',
        offline: 'Hors ligne',
        
        // Authentication states
        loggingIn: 'Connexion en cours...',
        registering: 'Inscription en cours...',
        loggedOut: 'Déconnecté',
        sessionActive: 'Session active',
        
        // Error messages
        loginFailed: 'Échec de la connexion',
        registrationFailed: 'Échec de l\'inscription',
        invalidCredentials: 'Identifiants non valides',
        userExists: 'Un utilisateur avec ce nom ou cette adresse e-mail existe déjà',
        noAuth: 'Aucune authentification trouvée. Veuillez vous connecter.',
        sessionExpired: 'Session expirée. Veuillez vous reconnecter.',
        accessDenied: 'Accès refusé',
        unauthorized: 'Non autorisé',
        
        // Success messages
        loginSuccess: 'Connexion réussie',
        registrationSuccess: 'Inscription réussie',
        logoutSuccess: 'Déconnexion réussie',
        
        // User status
        userStatus: 'Statut utilisateur',
        lastLogin: 'Dernière connexion',
        accountCreated: 'Compte créé',
        profileUpdated: 'Profil mis à jour',
        
        // Account management
        myAccount: 'Mon Compte',
        accountSettings: 'Paramètres du Compte',
        changePassword: 'Changer le Mot de Passe',
        updateProfile: 'Mettre à Jour le Profil',
        deleteAccount: 'Supprimer le Compte',
        
        // Permissions
        permissions: 'Permissions',
        roles: 'Rôles',
        adminAccess: 'Accès Administrateur',
        userAccess: 'Accès Utilisateur',
        readOnly: 'Lecture Seule',
        fullAccess: 'Accès Complet',
        
        // Welcome messages
        welcomeBackLogin: 'Bon retour ! Veuillez vous connecter pour continuer.',
        newUserWelcome: 'Nouveau ici ? Créez un compte pour commencer.',
        
        // Login errors and validations
        pleaseEnterCredentials: 'Veuillez saisir le nom d\'utilisateur et le mot de passe',
        loginFailedCheckCredentials: 'Connexion échouée. Veuillez vérifier vos identifiants.',
        loginFailedTryLater: 'Connexion échouée. Veuillez réessayer plus tard.',
        
        // Registration validations
        pleaseFillAllFields: 'Veuillez remplir tous les champs',
        passwordsDoNotMatch: 'Les mots de passe ne correspondent pas',
        pleaseEnterValidEmail: 'Veuillez saisir une adresse e-mail valide',
        
        // Registration success/error
        registrationSuccessful: 'Inscription réussie ! Vous pouvez maintenant vous connecter.',
        registrationFailedTryAgain: 'Inscription échouée. Veuillez réessayer.',
        registrationFailedTryLater: 'Inscription échouée. Veuillez réessayer plus tard.',
        
        // Form validation specific messages
        pleaseEnterValidEmailAddress: 'Veuillez saisir une adresse e-mail valide.',
        passwordTooWeak: 'Le mot de passe est trop faible. Veuillez choisir un mot de passe plus fort.',
        usernameInvalid: 'Le nom d\'utilisateur est invalide. Veuillez choisir un autre nom.',
        
        // New missing keys from Authentication.ts
        formElementsNotFound: 'Éléments de formulaire non trouvés',
        loginSuccessful: 'Connexion réussie !',
        passwordMinLength: 'Le mot de passe doit contenir au moins 6 caractères',
        registrationFailedPleaseRetry: 'Inscription échouée. Veuillez réessayer.',
        userAlreadyExists: 'Un utilisateur avec ce nom ou cette adresse e-mail existe déjà.',
        loggedOutSuccessfully: 'Déconnexion réussie',
        logout: 'Déconnexion',
        userAlreadyExistsTitle: 'L\'utilisateur existe déjà',
        userAlreadyExistsMessage: 'Un utilisateur avec ce nom ou cette adresse e-mail est déjà inscrit.',
        wouldYouLikeToLogin: 'Souhaitez-vous vous connecter à la place ?',
        goToLogin: 'Aller à la Connexion',
        enterDifferentData: 'Saisir des données différentes'
    },
    
    nl: {
        // Login/Register interface
        welcomeBack: 'Welkom terug! Log in om verder te gaan.',
        login: 'Inloggen',
        register: 'Registreren',
        alreadyRegistered: 'Al geregistreerd?',
        createAccount: 'Nieuw account aanmaken',
        loggedInAs: 'Ingelogd als',
        online: 'Online',
        offline: 'Offline',
        
        // Authentication states
        loggingIn: 'Inloggen...',
        registering: 'Registreren...',
        loggedOut: 'Uitgelogd',
        sessionActive: 'Sessie actief',
        
        // Error messages
        loginFailed: 'Inloggen mislukt',
        registrationFailed: 'Registratie mislukt',
        invalidCredentials: 'Ongeldige inloggegevens',
        userExists: 'Een gebruiker met deze naam of e-mailadres bestaat al',
        noAuth: 'Geen authenticatie gevonden. Log alstublieft in.',
        sessionExpired: 'Sessie verlopen. Log opnieuw in.',
        accessDenied: 'Toegang geweigerd',
        unauthorized: 'Niet geautoriseerd',
        
        // Success messages
        loginSuccess: 'Succesvol ingelogd',
        registrationSuccess: 'Succesvol geregistreerd',
        logoutSuccess: 'Succesvol uitgelogd',
        
        // User status
        userStatus: 'Gebruikersstatus',
        lastLogin: 'Laatste login',
        accountCreated: 'Account aangemaakt',
        profileUpdated: 'Profiel bijgewerkt',
        
        // Account management
        myAccount: 'Mijn Account',
        accountSettings: 'Account Instellingen',
        changePassword: 'Wachtwoord Wijzigen',
        updateProfile: 'Profiel Bijwerken',
        deleteAccount: 'Account Verwijderen',
        
        // Permissions
        permissions: 'Rechten',
        roles: 'Rollen',
        adminAccess: 'Beheerder Toegang',
        userAccess: 'Gebruiker Toegang',
        readOnly: 'Alleen Lezen',
        fullAccess: 'Volledige Toegang',
        
        // Welcome messages
        welcomeBackLogin: 'Welkom terug! Log in om door te gaan.',
        newUserWelcome: 'Nieuw hier? Maak een account aan om te beginnen.',
        
        // Login errors and validations
        pleaseEnterCredentials: 'Voer gebruikersnaam en wachtwoord in',
        loginFailedCheckCredentials: 'Inloggen mislukt. Controleer uw inloggegevens.',
        loginFailedTryLater: 'Inloggen mislukt. Probeer het later opnieuw.',
        
        // Registration validations
        pleaseFillAllFields: 'Vul alle velden in',
        passwordsDoNotMatch: 'Wachtwoorden komen niet overeen',
        pleaseEnterValidEmail: 'Voer een geldig e-mailadres in',
        
        // Registration success/error
        registrationSuccessful: 'Registratie succesvol! U kunt nu inloggen.',
        registrationFailedTryAgain: 'Registratie mislukt. Probeer het opnieuw.',
        registrationFailedTryLater: 'Registratie mislukt. Probeer het later opnieuw.',
        
        // Form validation specific messages
        pleaseEnterValidEmailAddress: 'Voer een geldig e-mailadres in.',
        passwordTooWeak: 'Het wachtwoord is te zwak. Kies een sterker wachtwoord.',
        usernameInvalid: 'De gebruikersnaam is ongeldig. Kies een andere naam.',
        
        // New missing keys from Authentication.ts
        formElementsNotFound: 'Formulierelementen niet gevonden',
        loginSuccessful: 'Inloggen succesvol!',
        passwordMinLength: 'Wachtwoord moet minstens 6 tekens lang zijn',
        registrationFailedPleaseRetry: 'Registratie mislukt. Probeer opnieuw.',
        userAlreadyExists: 'Een gebruiker met deze naam of e-mailadres bestaat al.',
        loggedOutSuccessfully: 'Succesvol uitgelogd',
        logout: 'Uitloggen',
        userAlreadyExistsTitle: 'Gebruiker bestaat al',
        userAlreadyExistsMessage: 'Een gebruiker met deze naam of e-mailadres is al geregistreerd.',
        wouldYouLikeToLogin: 'Wilt u in plaats daarvan inloggen?',
        goToLogin: 'Ga naar Inloggen',
        enterDifferentData: 'Andere gegevens invoeren'
    }
};