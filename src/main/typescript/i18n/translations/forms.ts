/**
 * Forms and validation translations for all languages
 */

export const formsTranslations = {
    de: {
        // Basic form elements
        required: 'Pflichtfeld',
        invalid: 'Ungültig',
        tooShort: 'Zu kurz',
        tooLong: 'Zu lang',
        invalidEmail: 'Ungültige E-Mail-Adresse',
        passwordTooWeak: 'Passwort zu schwach',
        passwordsDoNotMatch: 'Passwörter stimmen nicht überein',
        
        // Field requirements
        usernameRequired: 'Benutzername erforderlich',
        emailRequired: 'E-Mail erforderlich',
        passwordRequired: 'Passwort erforderlich',
        titleRequired: 'Titel erforderlich',
        nameRequired: 'Name erforderlich',
        
        // Input prompts
        pleaseEnterTitle: 'Bitte geben Sie einen Titel ein',
        pleaseEnterName: 'Bitte geben Sie einen Namen ein',
        pleaseEnterUsername: 'Bitte geben Sie einen Benutzername ein',
        pleaseEnterPassword: 'Bitte geben Sie ein Passwort ein',
        pleaseEnterEmail: 'Bitte geben Sie eine E-Mail-Adresse ein',
        pleaseEnterUsernameAndPassword: 'Bitte Benutzername und Passwort eingeben',
        fieldNotFound: 'Formularfelder nicht gefunden',
        
        // Password validation
        minLength: 'Passwort muss mindestens 8 Zeichen lang sein',
        requireUppercase: 'Passwort muss mindestens einen Großbuchstaben enthalten',
        requireLowercase: 'Passwort muss mindestens einen Kleinbuchstaben enthalten',
        requireNumber: 'Passwort muss mindestens eine Zahl enthalten',
        requireSpecial: 'Passwort muss mindestens ein Sonderzeichen enthalten',
        
        // Field labels
        username: 'Benutzername',
        password: 'Passwort',
        email: 'E-Mail',
        confirmPassword: 'Passwort bestätigen',
        firstName: 'Vorname',
        lastName: 'Nachname',
        phone: 'Telefon',
        address: 'Adresse',
        city: 'Stadt',
        zipCode: 'Postleitzahl',
        country: 'Land',
        
        // Placeholders
        enterUsername: 'Benutzername eingeben',
        enterPassword: 'Passwort eingeben',
        enterEmail: 'E-Mail eingeben',
        confirmPasswordPlaceholder: 'Passwort wiederholen',
        
        // Error messages
        uploadFailed: 'Fehler beim Hochladen',
        uploadError: 'Upload fehlgeschlagen',
        savingError: 'Fehler beim Speichern',
        deleteError: 'Fehler beim Löschen',
        loadingError: 'Fehler beim Laden',
        networkError: 'Netzwerkantwort war nicht ok',
        deleteConfirm: 'wirklich löschen?',
        downloadError: 'Fehler beim Herunterladen'
    },
    
    en: {
        // Basic form elements
        required: 'Required field',
        invalid: 'Invalid',
        tooShort: 'Too short',
        tooLong: 'Too long',
        invalidEmail: 'Invalid email address',
        passwordTooWeak: 'Password too weak',
        passwordsDoNotMatch: 'Passwords do not match',
        
        // Field requirements
        usernameRequired: 'Username required',
        emailRequired: 'Email required',
        passwordRequired: 'Password required',
        titleRequired: 'Title required',
        nameRequired: 'Name required',
        
        // Input prompts
        pleaseEnterTitle: 'Please enter a title',
        pleaseEnterName: 'Please enter a name',
        pleaseEnterUsername: 'Please enter a username',
        pleaseEnterPassword: 'Please enter a password',
        pleaseEnterEmail: 'Please enter an email address',
        pleaseEnterUsernameAndPassword: 'Please enter username and password',
        fieldNotFound: 'Form fields not found',
        
        // Password validation
        minLength: 'Password must be at least 8 characters long',
        requireUppercase: 'Password must contain at least one uppercase letter',
        requireLowercase: 'Password must contain at least one lowercase letter',
        requireNumber: 'Password must contain at least one number',
        requireSpecial: 'Password must contain at least one special character',
        
        // Field labels
        username: 'Username',
        password: 'Password',
        email: 'Email',
        confirmPassword: 'Confirm Password',
        firstName: 'First Name',
        lastName: 'Last Name',
        phone: 'Phone',
        address: 'Address',
        city: 'City',
        zipCode: 'ZIP Code',
        country: 'Country',
        
        // Placeholders
        enterUsername: 'Enter username',
        enterPassword: 'Enter password',
        enterEmail: 'Enter email',
        confirmPasswordPlaceholder: 'Repeat password',
        
        // Error messages
        uploadFailed: 'Upload failed',
        uploadError: 'Upload failed',
        savingError: 'Error saving',
        deleteError: 'Error deleting',
        loadingError: 'Error loading',
        networkError: 'Network response was not ok',
        deleteConfirm: 'really delete?',
        downloadError: 'Error downloading'
    },
    
    fr: {
        // Basic form elements
        required: 'Champ obligatoire',
        invalid: 'Non valide',
        tooShort: 'Trop court',
        tooLong: 'Trop long',
        invalidEmail: 'Adresse e-mail non valide',
        passwordTooWeak: 'Mot de passe trop faible',
        passwordsDoNotMatch: 'Les mots de passe ne correspondent pas',
        
        // Field requirements
        usernameRequired: 'Nom d\'utilisateur requis',
        emailRequired: 'E-mail requis',
        passwordRequired: 'Mot de passe requis',
        titleRequired: 'Titre requis',
        nameRequired: 'Nom requis',
        
        // Input prompts
        pleaseEnterTitle: 'Veuillez saisir un titre',
        pleaseEnterName: 'Veuillez saisir un nom',
        pleaseEnterUsername: 'Veuillez saisir un nom d\'utilisateur',
        pleaseEnterPassword: 'Veuillez saisir un mot de passe',
        pleaseEnterEmail: 'Veuillez saisir une adresse e-mail',
        pleaseEnterUsernameAndPassword: 'Veuillez saisir le nom d\'utilisateur et le mot de passe',
        fieldNotFound: 'Champs de formulaire introuvables',
        
        // Password validation
        minLength: 'Le mot de passe doit contenir au moins 8 caractères',
        requireUppercase: 'Le mot de passe doit contenir au moins une lettre majuscule',
        requireLowercase: 'Le mot de passe doit contenir au moins une lettre minuscule',
        requireNumber: 'Le mot de passe doit contenir au moins un chiffre',
        requireSpecial: 'Le mot de passe doit contenir au moins un caractère spécial',
        
        // Field labels
        username: 'Nom d\'utilisateur',
        password: 'Mot de passe',
        email: 'E-mail',
        confirmPassword: 'Confirmer le mot de passe',
        firstName: 'Prénom',
        lastName: 'Nom de famille',
        phone: 'Téléphone',
        address: 'Adresse',
        city: 'Ville',
        zipCode: 'Code postal',
        country: 'Pays',
        
        // Placeholders
        enterUsername: 'Saisir le nom d\'utilisateur',
        enterPassword: 'Saisir le mot de passe',
        enterEmail: 'Saisir l\'e-mail',
        confirmPasswordPlaceholder: 'Répéter le mot de passe',
        
        // Error messages
        uploadFailed: 'Échec du téléchargement',
        uploadError: 'Échec du téléchargement',
        savingError: 'Erreur lors de la sauvegarde',
        deleteError: 'Erreur lors de la suppression',
        loadingError: 'Erreur lors du chargement',
        networkError: 'La réponse réseau n\'était pas correcte',
        deleteConfirm: 'vraiment supprimer?',
        downloadError: 'Erreur lors du téléchargement'
    },
    
    nl: {
        // Basic form elements
        required: 'Verplicht veld',
        invalid: 'Ongeldig',
        tooShort: 'Te kort',
        tooLong: 'Te lang',
        invalidEmail: 'Ongeldig e-mailadres',
        passwordTooWeak: 'Wachtwoord te zwak',
        passwordsDoNotMatch: 'Wachtwoorden komen niet overeen',
        
        // Field requirements
        usernameRequired: 'Gebruikersnaam vereist',
        emailRequired: 'E-mail vereist',
        passwordRequired: 'Wachtwoord vereist',
        titleRequired: 'Titel vereist',
        nameRequired: 'Naam vereist',
        
        // Input prompts
        pleaseEnterTitle: 'Voer een titel in',
        pleaseEnterName: 'Voer een naam in',
        pleaseEnterUsername: 'Voer een gebruikersnaam in',
        pleaseEnterPassword: 'Voer een wachtwoord in',
        pleaseEnterEmail: 'Voer een e-mailadres in',
        pleaseEnterUsernameAndPassword: 'Voer gebruikersnaam en wachtwoord in',
        fieldNotFound: 'Formuliervelden niet gevonden',
        
        // Password validation
        minLength: 'Wachtwoord moet minstens 8 tekens lang zijn',
        requireUppercase: 'Wachtwoord moet minstens één hoofdletter bevatten',
        requireLowercase: 'Wachtwoord moet minstens één kleine letter bevatten',
        requireNumber: 'Wachtwoord moet minstens één cijfer bevatten',
        requireSpecial: 'Wachtwoord moet minstens één speciaal teken bevatten',
        
        // Field labels
        username: 'Gebruikersnaam',
        password: 'Wachtwoord',
        email: 'E-mail',
        confirmPassword: 'Wachtwoord bevestigen',
        firstName: 'Voornaam',
        lastName: 'Achternaam',
        phone: 'Telefoon',
        address: 'Adres',
        city: 'Stad',
        zipCode: 'Postcode',
        country: 'Land',
        
        // Placeholders
        enterUsername: 'Gebruikersnaam invoeren',
        enterPassword: 'Wachtwoord invoeren',
        enterEmail: 'E-mail invoeren',
        confirmPasswordPlaceholder: 'Wachtwoord herhalen',
        
        // Error messages
        uploadFailed: 'Upload mislukt',
        uploadError: 'Upload mislukt',
        savingError: 'Fout bij opslaan',
        deleteError: 'Fout bij verwijderen',
        loadingError: 'Fout bij laden',
        networkError: 'Netwerkrespons was niet ok',
        deleteConfirm: 'echt verwijderen?',
        downloadError: 'Fout bij downloaden'
    }
};