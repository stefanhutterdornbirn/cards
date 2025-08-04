/**
 * Test and Assessment module translations for all languages
 */

export const testTranslations = {
    de: {
        // General
        unknown: 'Unbekannt',
        test: 'Prüfung',
        tests: 'Prüfungen',
        exam: 'Prüfung',
        exams: 'Prüfungen',
        assessment: 'Bewertung',
        
        // Status translations
        completed: 'Abgeschlossen',
        inProgress: 'In Bearbeitung',
        expired: 'Abgelaufen',
        cancelled: 'Abgebrochen',
        paused: 'Pausiert',
        available: 'Verfügbar',
        assigned: 'Zugewiesen',
        
        // Main interface
        takeExams: 'Prüfungen ablegen',
        yourAvailableExams: 'Ihre verfügbaren Prüfungen',
        loadingAvailableExams: 'Verfügbare Prüfungen werden geladen...',
        
        // Empty states
        noExamsAvailable: 'Keine Prüfungen verfügbar',
        noExamsAvailableText: 'Derzeit sind keine Prüfungen für Sie verfügbar.',
        
        // Actions
        startExam: 'Prüfung starten',
        continueExam: 'Prüfung fortsetzen',
        submitExam: 'Prüfung abgeben',
        pauseExam: 'Prüfung pausieren',
        
        // Statistics
        statAvailable: 'Verfügbar',
        statInProgress: 'In Bearbeitung',
        statCompleted: 'Abgeschlossen',
        
        // Confirmations
        confirmStartExam: 'Möchten Sie diese Prüfung jetzt starten? Die Zeit läuft ab dem Start.',
        confirmContinueExam: 'Möchten Sie diese Prüfung fortsetzen?',
        confirmSubmitExam: 'Möchten Sie die Prüfung wirklich abgeben?',
        confirmPauseExam: 'Möchten Sie die Prüfung pausieren? Sie können sie später fortsetzen.',
        
        // Notifications
        timeExpired: 'Die Zeit ist abgelaufen! Die Prüfung wird automatisch abgegeben.',
        examPaused: 'Prüfung wurde pausiert. Sie können sie über den "Fortsetzen" Button wieder aufnehmen.',
        
        // Error messages
        errorLoadingExams: 'Fehler beim Laden der verfügbaren Prüfungen',
        errorLoadingResults: 'Fehler beim Laden der Prüfungsergebnisse',
        errorStartingExam: 'Fehler beim Starten der Prüfung',
        errorLoadingQuestions: 'Fehler beim Laden der Fragen',
        errorPausingExam: 'Fehler beim Pausieren der Prüfung, aber Sie können sie trotzdem später fortsetzen.',
        errorSubmittingExam: 'Fehler beim Abgeben der Prüfung',
        
        // Exam interface
        examResult: 'Prüfungsergebnis',
        questions: 'Fragen',
        cards: 'Karten',
        timeLeft: 'Verbleibende Zeit',
        
        // Additional UI elements
        continue: 'Fortsetzen',
        showResult: 'Ergebnis anzeigen',
        correctAnswers: 'Richtig beantwortet',
        incorrectAnswers: 'Falsch beantwortet',
        timeRequired: 'Benötigte Zeit',

        // Assessment Management
        conductExams: 'Prüfungen durchführen',
        newAssessment: 'Neues Assessment',
        loadingAssessments: 'Assessments werden geladen...',
        noAssessmentsCreated: 'Noch keine Assessments erstellt.',
        clickNewAssessment: 'Klicken Sie auf "Neues Assessment", um ein Assessment zu erstellen.',
        examId: 'Prüfung ID',
        manageUsers: 'Benutzer verwalten',
        edit: 'Bearbeiten',
        delete: 'Löschen',

        // Assessment Forms
        createNewAssessment: 'Neues Assessment erstellen',
        assessmentName: 'Name des Assessments',
        selectExam: 'Prüfung auswählen',
        pleaseSelectExam: 'Bitte wählen Sie eine Prüfung',
        startTime: 'Startzeit',
        endTime: 'Endzeit',
        cancel: 'Abbrechen',
        save: 'Speichern',
        editAssessment: 'Assessment bearbeiten',
        update: 'Aktualisieren',

        // User Management
        manageAssessmentUsers: 'Benutzer des Assessments verwalten',
        close: 'Schließen',
        availableUsers: 'Verfügbare Benutzer',
        noAvailableUsers: 'Keine verfügbaren Benutzer',
        add: 'Hinzufügen',
        usersInAssessment: 'Benutzer im Assessment',
        remove: 'Entfernen',

        // Validation and Error Messages
        pleaseEnterAssessmentName: 'Bitte geben Sie einen Namen für das Assessment ein.',
        pleaseSelectExamFirst: 'Bitte wählen Sie eine Prüfung aus.',
        pleaseEnterValidTimeframe: 'Bitte geben Sie ein gültiges Zeitfenster ein.',
        endDateMustBeAfterStart: 'Das Enddatum muss nach dem Startdatum liegen.',
        confirmDeleteAssessment: 'Möchten Sie dieses Assessment wirklich löschen?',

        // Error messages specific to assessments
        errorLoadingAssessments: 'Fehler beim Laden der Assessments',
        errorLoadingAvailableExams: 'Fehler beim Laden der verfügbaren Prüfungen',
        errorLoadingAssessment: 'Fehler beim Laden des Assessments',
        errorUpdatingAssessment: 'Fehler beim Aktualisieren des Assessments',
        errorDeletingAssessment: 'Fehler beim Löschen des Assessments',
        errorLoadingUsers: 'Fehler beim Laden der Benutzer',
        errorAddingUser: 'Fehler beim Hinzufügen des Benutzers',
        errorRemovingUser: 'Fehler beim Entfernen des Benutzers',
        errorCreatingAssessment: 'Fehler beim Erstellen des Assessments',
        
        // Additional missing keys
        assessmentNamePlaceholder: 'z.B. Mathematik Klausur Gruppe A',
        timeframe: 'Zeitfenster',
        from: 'Von',
        to: 'Bis',
        created: 'Erstellt',
        noUsersAssigned: 'Keine Benutzer zugewiesen',
        
        // Additional test interface keys
        scheduled: 'Geplant',
        contactInstructorForInfo: 'Kontaktieren Sie Ihren Dozenten oder Administrator für weitere Informationen.',
        total: 'Gesamt',
        veryEasy: 'Sehr Leicht',
        easy: 'Leicht',
        medium: 'Mittel',
        hard: 'Schwer',
        veryHard: 'Sehr Schwer',
        question: 'Frage',
        general: 'Allgemein',
        rateYourKnowledge: 'Bewerten Sie Ihr Wissen zu den einzelnen Antworten:',
        still: 'Noch',
        questionsToAnswer: 'Frage(n) zu beantworten',
        achieved: 'Erreicht',
        totalQuestions: 'Gesamtfragen',
        understood: 'Verstanden'
    },
    
    en: {
        // General
        unknown: 'Unknown',
        test: 'Test',
        tests: 'Tests',
        exam: 'Exam',
        exams: 'Exams',
        assessment: 'Assessment',
        
        // Status translations
        completed: 'Completed',
        inProgress: 'In Progress',
        expired: 'Expired',
        cancelled: 'Cancelled',
        paused: 'Paused',
        available: 'Available',
        assigned: 'Assigned',
        
        // Main interface
        takeExams: 'Take Exams',
        yourAvailableExams: 'Your available exams',
        loadingAvailableExams: 'Loading available exams...',
        
        // Empty states
        noExamsAvailable: 'No exams available',
        noExamsAvailableText: 'Currently no exams are available for you.',
        
        // Actions
        startExam: 'Start Exam',
        continueExam: 'Continue Exam',
        submitExam: 'Submit Exam',
        pauseExam: 'Pause Exam',
        
        // Statistics
        statAvailable: 'Available',
        statInProgress: 'In Progress',
        statCompleted: 'Completed',
        
        // Confirmations
        confirmStartExam: 'Do you want to start this exam now? The timer will start immediately.',
        confirmContinueExam: 'Do you want to continue this exam?',
        confirmSubmitExam: 'Do you really want to submit the exam?',
        confirmPauseExam: 'Do you want to pause the exam? You can continue it later.',
        
        // Notifications
        timeExpired: 'Time has expired! The exam will be submitted automatically.',
        examPaused: 'Exam was paused. You can resume it using the "Continue" button.',
        
        // Error messages
        errorLoadingExams: 'Error loading available exams',
        errorLoadingResults: 'Error loading exam results',
        errorStartingExam: 'Error starting exam',
        errorLoadingQuestions: 'Error loading questions',
        errorPausingExam: 'Error pausing exam, but you can still continue it later.',
        errorSubmittingExam: 'Error submitting exam',
        
        // Exam interface
        examResult: 'Exam Result',
        questions: 'Questions',
        cards: 'Cards',
        timeLeft: 'Time Left',
        
        // Additional UI elements
        continue: 'Continue',
        showResult: 'Show Result',
        correctAnswers: 'Correct answers',
        incorrectAnswers: 'Incorrect answers',
        timeRequired: 'Time required',

        // Assessment Management
        conductExams: 'Conduct Exams',
        newAssessment: 'New Assessment',
        loadingAssessments: 'Loading assessments...',
        noAssessmentsCreated: 'No assessments created yet.',
        clickNewAssessment: 'Click "New Assessment" to create an assessment.',
        examId: 'Exam ID',
        manageUsers: 'Manage Users',
        edit: 'Edit',
        delete: 'Delete',

        // Assessment Forms
        createNewAssessment: 'Create New Assessment',
        assessmentName: 'Assessment Name',
        selectExam: 'Select Exam',
        pleaseSelectExam: 'Please select an exam',
        startTime: 'Start Time',
        endTime: 'End Time',
        cancel: 'Cancel',
        save: 'Save',
        editAssessment: 'Edit Assessment',
        update: 'Update',

        // User Management
        manageAssessmentUsers: 'Manage Assessment Users',
        close: 'Close',
        availableUsers: 'Available Users',
        noAvailableUsers: 'No available users',
        add: 'Add',
        usersInAssessment: 'Users in Assessment',
        remove: 'Remove',

        // Validation and Error Messages
        pleaseEnterAssessmentName: 'Please enter a name for the assessment.',
        pleaseSelectExamFirst: 'Please select an exam.',
        pleaseEnterValidTimeframe: 'Please enter a valid timeframe.',
        endDateMustBeAfterStart: 'End date must be after start date.',
        confirmDeleteAssessment: 'Do you really want to delete this assessment?',

        // Error messages specific to assessments
        errorLoadingAssessments: 'Error loading assessments',
        errorLoadingAvailableExams: 'Error loading available exams',
        errorLoadingAssessment: 'Error loading assessment',
        errorUpdatingAssessment: 'Error updating assessment',
        errorDeletingAssessment: 'Error deleting assessment',
        errorLoadingUsers: 'Error loading users',
        errorAddingUser: 'Error adding user',
        errorRemovingUser: 'Error removing user',
        errorCreatingAssessment: 'Error creating assessment',
        
        // Additional missing keys
        assessmentNamePlaceholder: 'e.g. Mathematics Exam Group A',
        timeframe: 'Timeframe',
        from: 'From',
        to: 'To',
        created: 'Created',
        noUsersAssigned: 'No users assigned',
        
        // Additional test interface keys
        scheduled: 'Scheduled',
        contactInstructorForInfo: 'Contact your instructor or administrator for more information.',
        total: 'Total',
        veryEasy: 'Very Easy',
        easy: 'Easy',
        medium: 'Medium',
        hard: 'Hard',
        veryHard: 'Very Hard',
        question: 'Question',
        general: 'General',
        rateYourKnowledge: 'Rate your knowledge of the individual answers:',
        still: 'Still',
        questionsToAnswer: 'question(s) to answer',
        achieved: 'Achieved',
        totalQuestions: 'Total Questions',
        understood: 'Understood'
    },
    
    fr: {
        // General
        unknown: 'Inconnu',
        test: 'Test',
        tests: 'Tests',
        exam: 'Examen',
        exams: 'Examens',
        assessment: 'Évaluation',
        
        // Status translations
        completed: 'Terminé',
        inProgress: 'En cours',
        expired: 'Expiré',
        cancelled: 'Annulé',
        paused: 'En pause',
        available: 'Disponible',
        assigned: 'Assigné',
        
        // Main interface
        takeExams: 'Passer des Examens',
        yourAvailableExams: 'Vos examens disponibles',
        loadingAvailableExams: 'Chargement des examens disponibles...',
        
        // Empty states
        noExamsAvailable: 'Aucun examen disponible',
        noExamsAvailableText: 'Actuellement, aucun examen n\'est disponible pour vous.',
        
        // Actions
        startExam: 'Commencer l\'Examen',
        continueExam: 'Continuer l\'Examen',
        submitExam: 'Soumettre l\'Examen',
        pauseExam: 'Mettre en Pause l\'Examen',
        
        // Statistics
        statAvailable: 'Disponible',
        statInProgress: 'En cours',
        statCompleted: 'Terminé',
        
        // Confirmations
        confirmStartExam: 'Voulez-vous commencer cet examen maintenant ? Le chronomètre démarrera immédiatement.',
        confirmContinueExam: 'Voulez-vous continuer cet examen ?',
        confirmSubmitExam: 'Voulez-vous vraiment soumettre l\'examen ?',
        confirmPauseExam: 'Voulez-vous mettre l\'examen en pause ? Vous pourrez le continuer plus tard.',
        
        // Notifications
        timeExpired: 'Le temps est écoulé ! L\'examen sera soumis automatiquement.',
        examPaused: 'L\'examen a été mis en pause. Vous pouvez le reprendre avec le bouton "Continuer".',
        
        // Error messages
        errorLoadingExams: 'Erreur lors du chargement des examens disponibles',
        errorLoadingResults: 'Erreur lors du chargement des résultats d\'examen',
        errorStartingExam: 'Erreur lors du démarrage de l\'examen',
        errorLoadingQuestions: 'Erreur lors du chargement des questions',
        errorPausingExam: 'Erreur lors de la mise en pause de l\'examen, mais vous pouvez toujours le continuer plus tard.',
        errorSubmittingExam: 'Erreur lors de la soumission de l\'examen',
        
        // Exam interface
        examResult: 'Résultat d\'Examen',
        questions: 'Questions',
        cards: 'Cartes',
        timeLeft: 'Temps Restant',
        
        // Additional UI elements
        continue: 'Continuer',
        showResult: 'Afficher Résultat',
        correctAnswers: 'Réponses correctes',
        incorrectAnswers: 'Réponses incorrectes',
        timeRequired: 'Temps requis',
        
        // Assessment Management
        conductExams: 'Conduire des Examens',
        newAssessment: 'Nouvelle Évaluation',
        loadingAssessments: 'Chargement des évaluations...',
        noAssessmentsCreated: 'Aucune évaluation créée encore.',
        clickNewAssessment: 'Cliquez sur "Nouvelle Évaluation" pour créer une évaluation.',
        examId: 'ID d\'Examen',
        manageUsers: 'Gérer les Utilisateurs',
        edit: 'Modifier',
        delete: 'Supprimer',
        
        // Assessment Forms
        createNewAssessment: 'Créer une Nouvelle Évaluation',
        assessmentName: 'Nom de l\'Évaluation',
        selectExam: 'Sélectionner un Examen',
        pleaseSelectExam: 'Veuillez sélectionner un examen',
        startTime: 'Heure de Début',
        endTime: 'Heure de Fin',
        cancel: 'Annuler',
        save: 'Sauvegarder',
        editAssessment: 'Modifier l\'Évaluation',
        update: 'Mettre à Jour',
        
        // User Management
        manageAssessmentUsers: 'Gérer les Utilisateurs de l\'Évaluation',
        close: 'Fermer',
        availableUsers: 'Utilisateurs Disponibles',
        noAvailableUsers: 'Aucun utilisateur disponible',
        add: 'Ajouter',
        usersInAssessment: 'Utilisateurs dans l\'Évaluation',
        remove: 'Supprimer',
        
        // Validation and Error Messages
        pleaseEnterAssessmentName: 'Veuillez entrer un nom pour l\'évaluation.',
        pleaseSelectExamFirst: 'Veuillez sélectionner un examen.',
        pleaseEnterValidTimeframe: 'Veuillez entrer une plage horaire valide.',
        endDateMustBeAfterStart: 'La date de fin doit être après la date de début.',
        confirmDeleteAssessment: 'Voulez-vous vraiment supprimer cette évaluation?',
        
        // Error messages specific to assessments
        errorLoadingAssessments: 'Erreur lors du chargement des évaluations',
        errorLoadingAvailableExams: 'Erreur lors du chargement des examens disponibles',
        errorLoadingAssessment: 'Erreur lors du chargement de l\'évaluation',
        errorUpdatingAssessment: 'Erreur lors de la mise à jour de l\'évaluation',
        errorDeletingAssessment: 'Erreur lors de la suppression de l\'évaluation',
        errorLoadingUsers: 'Erreur lors du chargement des utilisateurs',
        errorAddingUser: 'Erreur lors de l\'ajout de l\'utilisateur',
        errorRemovingUser: 'Erreur lors de la suppression de l\'utilisateur',
        errorCreatingAssessment: 'Erreur lors de la création de l\'évaluation',
        
        // Additional missing keys
        assessmentNamePlaceholder: 'p.ex. Examen de Mathématiques Groupe A',
        timeframe: 'Plage Horaire',
        from: 'De',
        to: 'À',
        created: 'Créé',
        noUsersAssigned: 'Aucun utilisateur assigné',
        
        // Additional test interface keys
        scheduled: 'Programmé',
        contactInstructorForInfo: 'Contactez votre instructeur ou administrateur pour plus d\'informations.',
        total: 'Total',
        veryEasy: 'Très Facile',
        easy: 'Facile',
        medium: 'Moyen',
        hard: 'Difficile',
        veryHard: 'Très Difficile',
        question: 'Question',
        general: 'Général',
        rateYourKnowledge: 'Évaluez votre connaissance des réponses individuelles:',
        still: 'Encore',
        questionsToAnswer: 'question(s) à répondre',
        achieved: 'Atteint',
        totalQuestions: 'Questions Totales',
        understood: 'Compris'
    },
    
    nl: {
        // General
        unknown: 'Onbekend',
        test: 'Test',
        tests: 'Tests',
        exam: 'Examen',
        exams: 'Examens',
        assessment: 'Beoordeling',
        
        // Status translations
        completed: 'Voltooid',
        inProgress: 'Bezig',
        expired: 'Verlopen',
        cancelled: 'Geannuleerd',
        paused: 'Gepauzeerd',
        available: 'Beschikbaar',
        assigned: 'Toegewezen',
        
        // Main interface
        takeExams: 'Examens Afleggen',
        yourAvailableExams: 'Uw beschikbare examens',
        loadingAvailableExams: 'Beschikbare examens laden...',
        
        // Empty states
        noExamsAvailable: 'Geen examens beschikbaar',
        noExamsAvailableText: 'Momenteel zijn er geen examens voor u beschikbaar.',
        
        // Actions
        startExam: 'Examen Starten',
        continueExam: 'Examen Voortzetten',
        submitExam: 'Examen Inleveren',
        pauseExam: 'Examen Pauzeren',
        
        // Statistics
        statAvailable: 'Beschikbaar',
        statInProgress: 'Bezig',
        statCompleted: 'Voltooid',
        
        // Confirmations
        confirmStartExam: 'Wilt u dit examen nu starten? De timer start onmiddellijk.',
        confirmContinueExam: 'Wilt u dit examen voortzetten?',
        confirmSubmitExam: 'Wilt u het examen echt inleveren?',
        confirmPauseExam: 'Wilt u het examen pauzeren? U kunt het later voortzetten.',
        
        // Notifications
        timeExpired: 'De tijd is verstreken! Het examen wordt automatisch ingeleverd.',
        examPaused: 'Examen werd gepauzeerd. U kunt het hervatten met de "Voortzetten" knop.',
        
        // Error messages
        errorLoadingExams: 'Fout bij laden van beschikbare examens',
        errorLoadingResults: 'Fout bij laden van examenresultaten',
        errorStartingExam: 'Fout bij starten van examen',
        errorLoadingQuestions: 'Fout bij laden van vragen',
        errorPausingExam: 'Fout bij pauzeren van examen, maar u kunt het nog steeds later voortzetten.',
        errorSubmittingExam: 'Fout bij inleveren van examen',
        
        // Exam interface
        examResult: 'Examenresultaat',
        questions: 'Vragen',
        cards: 'Kaarten',
        timeLeft: 'Resterende Tijd',
        
        // Additional UI elements
        continue: 'Voortzetten',
        showResult: 'Resultaat Tonen',
        correctAnswers: 'Juiste antwoorden',
        incorrectAnswers: 'Onjuiste antwoorden',
        timeRequired: 'Benodigde tijd',
        
        // Assessment Management
        conductExams: 'Examens Afnemen',
        newAssessment: 'Nieuwe Beoordeling',
        loadingAssessments: 'Beoordelingen laden...',
        noAssessmentsCreated: 'Nog geen beoordelingen gemaakt.',
        clickNewAssessment: 'Klik op "Nieuwe Beoordeling" om een beoordeling te maken.',
        examId: 'Examen ID',
        manageUsers: 'Gebruikers Beheren',
        edit: 'Bewerken',
        delete: 'Verwijderen',
        
        // Assessment Forms
        createNewAssessment: 'Nieuwe Beoordeling Maken',
        assessmentName: 'Naam van Beoordeling',
        selectExam: 'Examen Selecteren',
        pleaseSelectExam: 'Selecteer een examen',
        startTime: 'Starttijd',
        endTime: 'Eindtijd',
        cancel: 'Annuleren',
        save: 'Opslaan',
        editAssessment: 'Beoordeling Bewerken',
        update: 'Bijwerken',
        
        // User Management
        manageAssessmentUsers: 'Gebruikers van Beoordeling Beheren',
        close: 'Sluiten',
        availableUsers: 'Beschikbare Gebruikers',
        noAvailableUsers: 'Geen beschikbare gebruikers',
        add: 'Toevoegen',
        usersInAssessment: 'Gebruikers in Beoordeling',
        remove: 'Verwijderen',
        
        // Validation and Error Messages
        pleaseEnterAssessmentName: 'Voer een naam in voor de beoordeling.',
        pleaseSelectExamFirst: 'Selecteer eerst een examen.',
        pleaseEnterValidTimeframe: 'Voer een geldig tijdsbestek in.',
        endDateMustBeAfterStart: 'Einddatum moet na startdatum liggen.',
        confirmDeleteAssessment: 'Wilt u deze beoordeling echt verwijderen?',
        
        // Error messages specific to assessments
        errorLoadingAssessments: 'Fout bij laden van beoordelingen',
        errorLoadingAvailableExams: 'Fout bij laden van beschikbare examens',
        errorLoadingAssessment: 'Fout bij laden van beoordeling',
        errorUpdatingAssessment: 'Fout bij bijwerken van beoordeling',
        errorDeletingAssessment: 'Fout bij verwijderen van beoordeling',
        errorLoadingUsers: 'Fout bij laden van gebruikers',
        errorAddingUser: 'Fout bij toevoegen van gebruiker',
        errorRemovingUser: 'Fout bij verwijderen van gebruiker',
        errorCreatingAssessment: 'Fout bij maken van beoordeling',
        
        // Additional missing keys
        assessmentNamePlaceholder: 'bijv. Wiskunde Examen Groep A',
        timeframe: 'Tijdsbestek',
        from: 'Van',
        to: 'Tot',
        created: 'Gemaakt',
        noUsersAssigned: 'Geen gebruikers toegewezen',
        
        // Additional test interface keys
        scheduled: 'Gepland',
        contactInstructorForInfo: 'Neem contact op met uw docent of beheerder voor meer informatie.',
        total: 'Totaal',
        veryEasy: 'Zeer Gemakkelijk',
        easy: 'Gemakkelijk',
        medium: 'Gemiddeld',
        hard: 'Moeilijk',
        veryHard: 'Zeer Moeilijk',
        question: 'Vraag',
        general: 'Algemeen',
        rateYourKnowledge: 'Beoordeel uw kennis van de individuele antwoorden:',
        still: 'Nog',
        questionsToAnswer: 'vraag/vragen te beantwoorden',
        achieved: 'Behaald',
        totalQuestions: 'Totaal Vragen',
        understood: 'Begrepen'
    }
};