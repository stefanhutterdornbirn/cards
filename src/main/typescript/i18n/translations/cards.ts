/**
 * Learning Cards module translations for all languages
 */

export const cardsTranslations = {
    de: {
        // Main navigation
        title: 'Lernkarten',
        management: 'Lernkarten Verwaltung',
        newCard: 'Neue Karte',
        createNewCard: 'Neue Lernkarte erstellen',
        newAnswer: 'Neue Antwort',
        askAI: 'Frage die KI',
        loading: 'Wird geladen...',
        save: 'Speichern',
        cancel: 'Abbrechen',
        imageSelect: 'Bild auswählen',
        imagePreview: 'Bildvorschau',
        selectTopic: '-- Bitte Thema auswählen --',
        selectImage: '-- Bitte Bild auswählen --',
        titlePlaceholder: 'Geben Sie hier den Titel der Lernkarte ein...',
        questionPlaceholder: 'Geben Sie hier Ihre Frage ein...',
        answerPlaceholder: 'Antwort eingeben',
        cardTitle: 'Titel',
        correct: 'Korrekt',
        minTwoAnswersRequired: 'Mindestens zwei Antworten sind erforderlich!',
        oneCorrectAnswerRequired: 'Mindestens eine Antwort muss als korrekt markiert sein.',
        cardSavedSuccessfully: 'Lernkarte erfolgreich gespeichert!',
        pleaseSelectImage: 'Bitte wählen Sie ein Bild aus.',
        // Management page
        id: 'ID',
        actions: 'Aktionen',
        unknown: 'Unbekannt',
        edit: 'Bearbeiten',
        delete: 'Löschen',
        areas: 'Gebiete',
        imagePreviewAlt: 'Bildvorschau',
        minTwoAnswersRequiredText: 'Mindestens zwei Antworten mit Text sind erforderlich.',
        oneCorrectAnswerRequiredText: 'Mindestens eine Antwort muss als korrekt markiert sein.',
        updateFailed: 'Aktualisierung fehlgeschlagen',
        deleteFailed: 'Löschen fehlgeschlagen',
        deleteSuccessful: 'Löschen erfolgreich',
        cardDeletedSuccessfully: 'Karte erfolgreich gelöscht',
        errorLoadingCards: 'Fehler beim Laden der Karten. Bitte versuchen Sie es später erneut.',
        editCard: 'Karte bearbeiten',
        deleteCard: 'Karte löschen',
        
        // Card content
        question: 'Frage',
        answer: 'Antwort',
        answers: 'Antworten',
        correctAnswer: 'Richtige Antwort',
        incorrectAnswer: 'Falsche Antwort',
        multipleChoice: 'Multiple Choice',
        freeText: 'Freitext',
        
        // Card properties
        topic: 'Thema',
        difficulty: 'Schwierigkeit',
        tags: 'Tags',
        category: 'Kategorie',
        level: 'Level',
        points: 'Punkte',
        
        // Difficulty levels
        easy: 'Einfach',
        medium: 'Mittel',
        hard: 'Schwer',
        expert: 'Experte',
        
        // Filters and search
        allTopics: 'Alle Themen',
        filterByTopic: 'Nach Thema filtern',
        filterByDifficulty: 'Nach Schwierigkeit filtern',
        searchCards: 'Karten suchen',
        
        // Actions
        createCard: 'Karte erstellen',
        saveCard: 'Karte speichern',
        updateCard: 'Karte aktualisieren',
        duplicateCard: 'Karte duplizieren',
        archiveCard: 'Karte archivieren',
        
        // Confirmations
        confirmDelete: 'Möchten Sie diese Karte wirklich löschen?',
        confirmArchive: 'Möchten Sie diese Karte archivieren?',
        unsavedChanges: 'Sie haben ungespeicherte Änderungen. Möchten Sie fortfahren?',
        
        // Success messages
        cardCreated: 'Karte erfolgreich erstellt',
        cardSaved: 'Karte erfolgreich gespeichert',
        cardUpdated: 'Karte erfolgreich aktualisiert',
        cardDeleted: 'Karte erfolgreich gelöscht',
        cardDuplicated: 'Karte erfolgreich dupliziert',
        cardArchived: 'Karte erfolgreich archiviert',
        
        // Error messages
        createError: 'Fehler beim Erstellen der Karte',
        saveError: 'Fehler beim Speichern der Karte',
        updateError: 'Fehler beim Aktualisieren der Karte',
        deleteError: 'Fehler beim Löschen der Karte',
        loadError: 'Fehler beim Laden der Karten',
        strokeSaveError: 'Fehler beim Speichern des Strokes',
        strokeSaved: 'Stroke erfolgreich geloggt',
        
        // Validation
        minTwoAnswers: 'Mindestens zwei Antworten mit Text sind erforderlich',
        questionRequired: 'Frage ist erforderlich',
        answerRequired: 'Mindestens eine Antwort ist erforderlich',
        topicRequired: 'Thema ist erforderlich',
        invalidCardData: 'Ungültige Kartendaten',
        
        // States
        draft: 'Entwurf',
        published: 'Veröffentlicht',
        archived: 'Archiviert',
        private: 'Privat',
        shared: 'Geteilt',
        
        // Statistics
        cardStats: 'Karten-Statistiken',
        totalCards: 'Gesamte Karten',
        newCards: 'Neue Karten',
        reviewCards: 'Wiederholung',
        masteredCards: 'Gemeistert',
        
        // Learning progress
        learningProgress: 'Lernfortschritt',
        correctAnswers: 'Richtige Antworten',
        incorrectAnswers: 'Falsche Antworten',
        accuracy: 'Genauigkeit',
        streak: 'Serie',
        
        // Empty states
        noCards: 'Keine Lernkarten verfügbar',
        noCardsFound: 'Keine Karten gefunden',
        noCardsInTopic: 'Keine Karten in diesem Thema',
        createFirstCard: 'Erstellen Sie Ihre erste Karte',
        
        // Bulk actions
        selectAll: 'Alle auswählen',
        deselectAll: 'Alle abwählen',
        selectedCards: 'Ausgewählte Karten',
        bulkDelete: 'Ausgewählte löschen',
        bulkArchive: 'Ausgewählte archivieren',
        bulkEdit: 'Ausgewählte bearbeiten',
        pleaseEnterQuestion: 'Bitte geben Sie eine Frage ein',
        errorSaving: 'Fehler beim Speichern der Änderungen',
        errorDeleting: 'Fehler beim Löschen der Karte'
    },
    
    en: {
        // Main navigation
        title: 'Learning Cards',
        management: 'Learning Cards Management',
        newCard: 'New Card',
        createNewCard: 'Create New Learning Card',
        newAnswer: 'New Answer',
        askAI: 'Ask AI',
        loading: 'Loading...',
        save: 'Save',
        cancel: 'Cancel',
        imageSelect: 'Select Image',
        imagePreview: 'Image Preview',
        selectTopic: '-- Please select topic --',
        selectImage: '-- Please select image --',
        titlePlaceholder: 'Enter the title of the learning card here...',
        questionPlaceholder: 'Enter your question here...',
        answerPlaceholder: 'Enter answer',
        cardTitle: 'Title',
        correct: 'Correct',
        minTwoAnswersRequired: 'At least two answers are required!',
        oneCorrectAnswerRequired: 'At least one answer must be marked as correct.',
        cardSavedSuccessfully: 'Learning card successfully saved!',
        pleaseSelectImage: 'Please select an image.',
        // Management page
        id: 'ID',
        actions: 'Actions',
        unknown: 'Unknown',
        edit: 'Edit',
        delete: 'Delete',
        areas: 'Areas',
        imagePreviewAlt: 'Image Preview',
        minTwoAnswersRequiredText: 'At least two answers with text are required.',
        oneCorrectAnswerRequiredText: 'At least one answer must be marked as correct.',
        updateFailed: 'Update failed',
        deleteFailed: 'Delete failed',
        deleteSuccessful: 'Delete successful',
        cardDeletedSuccessfully: 'Card successfully deleted',
        errorLoadingCards: 'Error loading cards. Please try again later.',
        editCard: 'Edit Card',
        deleteCard: 'Delete Card',
        
        // Card content
        question: 'Question',
        answer: 'Answer',
        answers: 'Answers',
        correctAnswer: 'Correct Answer',
        incorrectAnswer: 'Incorrect Answer',
        multipleChoice: 'Multiple Choice',
        freeText: 'Free Text',
        
        // Card properties
        topic: 'Topic',
        difficulty: 'Difficulty',
        tags: 'Tags',
        category: 'Category',
        level: 'Level',
        points: 'Points',
        
        // Difficulty levels
        easy: 'Easy',
        medium: 'Medium',
        hard: 'Hard',
        expert: 'Expert',
        
        // Filters and search
        allTopics: 'All Topics',
        filterByTopic: 'Filter by Topic',
        filterByDifficulty: 'Filter by Difficulty',
        searchCards: 'Search Cards',
        
        // Actions
        createCard: 'Create Card',
        saveCard: 'Save Card',
        updateCard: 'Update Card',
        duplicateCard: 'Duplicate Card',
        archiveCard: 'Archive Card',
        
        // Confirmations
        confirmDelete: 'Do you really want to delete this card?',
        confirmArchive: 'Do you want to archive this card?',
        unsavedChanges: 'You have unsaved changes. Do you want to continue?',
        
        // Success messages
        cardCreated: 'Card successfully created',
        cardSaved: 'Card successfully saved',
        cardUpdated: 'Card successfully updated',
        cardDeleted: 'Card successfully deleted',
        cardDuplicated: 'Card successfully duplicated',
        cardArchived: 'Card successfully archived',
        
        // Error messages
        createError: 'Error creating card',
        saveError: 'Error saving card',
        updateError: 'Error updating card',
        deleteError: 'Error deleting card',
        loadError: 'Error loading cards',
        strokeSaveError: 'Error saving stroke',
        strokeSaved: 'Stroke successfully logged',
        
        // Validation
        minTwoAnswers: 'At least two answers with text are required',
        questionRequired: 'Question is required',
        answerRequired: 'At least one answer is required',
        topicRequired: 'Topic is required',
        invalidCardData: 'Invalid card data',
        
        // States
        draft: 'Draft',
        published: 'Published',
        archived: 'Archived',
        private: 'Private',
        shared: 'Shared',
        
        // Statistics
        cardStats: 'Card Statistics',
        totalCards: 'Total Cards',
        newCards: 'New Cards',
        reviewCards: 'Review',
        masteredCards: 'Mastered',
        
        // Learning progress
        learningProgress: 'Learning Progress',
        correctAnswers: 'Correct Answers',
        incorrectAnswers: 'Incorrect Answers',
        accuracy: 'Accuracy',
        streak: 'Streak',
        
        // Empty states
        noCards: 'No learning cards available',
        noCardsFound: 'No cards found',
        noCardsInTopic: 'No cards in this topic',
        createFirstCard: 'Create your first card',
        
        // Bulk actions
        selectAll: 'Select All',
        deselectAll: 'Deselect All',
        selectedCards: 'Selected Cards',
        bulkDelete: 'Delete Selected',
        bulkArchive: 'Archive Selected',
        bulkEdit: 'Edit Selected',
        pleaseEnterQuestion: 'Please enter a question',
        errorSaving: 'Error saving changes',
        errorDeleting: 'Error deleting card'
    },
    
    fr: {
        // Main navigation
        title: 'Cartes d\'Apprentissage',
        management: 'Gestion des Cartes d\'Apprentissage',
        newCard: 'Nouvelle Carte',
        createNewCard: 'Créer Nouvelle Carte d\'Apprentissage',
        newAnswer: 'Nouvelle Réponse',
        askAI: 'Demander à l\'IA',
        loading: 'Chargement...',
        save: 'Sauvegarder',
        cancel: 'Annuler',
        imageSelect: 'Sélectionner Image',
        imagePreview: 'Aperçu Image',
        selectTopic: '-- Veuillez sélectionner un sujet --',
        selectImage: '-- Veuillez sélectionner une image --',
        titlePlaceholder: 'Entrez le titre de la carte d\'apprentissage ici...',
        questionPlaceholder: 'Entrez votre question ici...',
        answerPlaceholder: 'Entrer réponse',
        cardTitle: 'Titre',
        correct: 'Correct',
        minTwoAnswersRequired: 'Au moins deux réponses sont requises !',
        oneCorrectAnswerRequired: 'Au moins une réponse doit être marquée comme correcte.',
        cardSavedSuccessfully: 'Carte d\'apprentissage sauvegardée avec succès !',
        pleaseSelectImage: 'Veuillez sélectionner une image.',
        // Management page
        id: 'ID',
        actions: 'Actions',
        unknown: 'Inconnu',
        edit: 'Modifier',
        delete: 'Supprimer',
        areas: 'Domaines',
        imagePreviewAlt: 'Aperçu Image',
        minTwoAnswersRequiredText: 'Au moins deux réponses avec du texte sont requises.',
        oneCorrectAnswerRequiredText: 'Au moins une réponse doit être marquée comme correcte.',
        updateFailed: 'Mise à jour échouée',
        deleteFailed: 'Suppression échouée',
        deleteSuccessful: 'Suppression réussie',
        cardDeletedSuccessfully: 'Carte supprimée avec succès',
        errorLoadingCards: 'Erreur lors du chargement des cartes. Veuillez réessayer plus tard.',
        editCard: 'Modifier Carte',
        deleteCard: 'Supprimer Carte',
        
        // Card content
        question: 'Question',
        answer: 'Réponse',
        answers: 'Réponses',
        correctAnswer: 'Bonne Réponse',
        incorrectAnswer: 'Mauvaise Réponse',
        multipleChoice: 'Choix Multiple',
        freeText: 'Texte Libre',
        
        // Card properties
        topic: 'Sujet',
        difficulty: 'Difficulté',
        tags: 'Étiquettes',
        category: 'Catégorie',
        level: 'Niveau',
        points: 'Points',
        
        // Difficulty levels
        easy: 'Facile',
        medium: 'Moyen',
        hard: 'Difficile',
        expert: 'Expert',
        
        // Filters and search
        allTopics: 'Tous les Sujets',
        filterByTopic: 'Filtrer par Sujet',
        filterByDifficulty: 'Filtrer par Difficulté',
        searchCards: 'Rechercher Cartes',
        
        // Actions
        createCard: 'Créer Carte',
        saveCard: 'Sauvegarder Carte',
        updateCard: 'Mettre à Jour Carte',
        duplicateCard: 'Dupliquer Carte',
        archiveCard: 'Archiver Carte',
        
        // Confirmations
        confirmDelete: 'Voulez-vous vraiment supprimer cette carte ?',
        confirmArchive: 'Voulez-vous archiver cette carte ?',
        unsavedChanges: 'Vous avez des modifications non sauvegardées. Voulez-vous continuer ?',
        
        // Success messages
        cardCreated: 'Carte créée avec succès',
        cardSaved: 'Carte sauvegardée avec succès',
        cardUpdated: 'Carte mise à jour avec succès',
        cardDeleted: 'Carte supprimée avec succès',
        cardDuplicated: 'Carte dupliquée avec succès',
        cardArchived: 'Carte archivée avec succès',
        
        // Error messages
        createError: 'Erreur lors de la création de la carte',
        saveError: 'Erreur lors de la sauvegarde de la carte',
        updateError: 'Erreur lors de la mise à jour de la carte',
        deleteError: 'Erreur lors de la suppression de la carte',
        loadError: 'Erreur lors du chargement des cartes',
        strokeSaveError: 'Erreur lors de la sauvegarde du trait',
        strokeSaved: 'Trait sauvegardé avec succès',
        
        // Validation
        minTwoAnswers: 'Au moins deux réponses avec du texte sont requises',
        questionRequired: 'La question est requise',
        answerRequired: 'Au moins une réponse est requise',
        topicRequired: 'Le sujet est requis',
        invalidCardData: 'Données de carte non valides',
        
        // States
        draft: 'Brouillon',
        published: 'Publié',
        archived: 'Archivé',
        private: 'Privé',
        shared: 'Partagé',
        
        // Statistics
        cardStats: 'Statistiques des Cartes',
        totalCards: 'Total Cartes',
        newCards: 'Nouvelles Cartes',
        reviewCards: 'Révision',
        masteredCards: 'Maîtrisées',
        
        // Learning progress
        learningProgress: 'Progrès d\'Apprentissage',
        correctAnswers: 'Bonnes Réponses',
        incorrectAnswers: 'Mauvaises Réponses',
        accuracy: 'Précision',
        streak: 'Série',
        
        // Empty states
        noCards: 'Aucune carte d\'apprentissage disponible',
        noCardsFound: 'Aucune carte trouvée',
        noCardsInTopic: 'Aucune carte dans ce sujet',
        createFirstCard: 'Créez votre première carte',
        
        // Bulk actions
        selectAll: 'Tout Sélectionner',
        deselectAll: 'Tout Désélectionner',
        selectedCards: 'Cartes Sélectionnées',
        bulkDelete: 'Supprimer Sélectionnées',
        bulkArchive: 'Archiver Sélectionnées',
        bulkEdit: 'Modifier Sélectionnées',
        pleaseEnterQuestion: 'Veuillez saisir une question',
        errorSaving: 'Erreur lors de la sauvegarde des modifications',
        errorDeleting: 'Erreur lors de la suppression de la carte'
    },
    
    nl: {
        // Main navigation
        title: 'Leerkaarten',
        management: 'Leerkaarten Beheer',
        newCard: 'Nieuwe Kaart',
        createNewCard: 'Nieuwe Leerkaart Maken',
        newAnswer: 'Nieuw Antwoord',
        askAI: 'Vraag AI',
        loading: 'Laden...',
        save: 'Opslaan',
        cancel: 'Annuleren',
        imageSelect: 'Afbeelding Selecteren',
        imagePreview: 'Afbeelding Voorbeeld',
        selectTopic: '-- Selecteer onderwerp --',
        selectImage: '-- Selecteer afbeelding --',
        titlePlaceholder: 'Voer hier de titel van de leerkaart in...',
        questionPlaceholder: 'Voer hier uw vraag in...',
        answerPlaceholder: 'Antwoord invoeren',
        cardTitle: 'Titel',
        correct: 'Correct',
        minTwoAnswersRequired: 'Minstens twee antwoorden zijn vereist!',
        oneCorrectAnswerRequired: 'Minstens één antwoord moet als correct gemarkeerd zijn.',
        cardSavedSuccessfully: 'Leerkaart succesvol opgeslagen!',
        pleaseSelectImage: 'Selecteer een afbeelding.',
        // Management page
        id: 'ID',
        actions: 'Acties',
        unknown: 'Onbekend',
        edit: 'Bewerken',
        delete: 'Verwijderen',
        areas: 'Gebieden',
        imagePreviewAlt: 'Afbeelding Voorbeeld',
        minTwoAnswersRequiredText: 'Minstens twee antwoorden met tekst zijn vereist.',
        oneCorrectAnswerRequiredText: 'Minstens één antwoord moet als correct gemarkeerd zijn.',
        updateFailed: 'Update mislukt',
        deleteFailed: 'Verwijderen mislukt',
        deleteSuccessful: 'Verwijderen succesvol',
        cardDeletedSuccessfully: 'Kaart succesvol verwijderd',
        errorLoadingCards: 'Fout bij laden van kaarten. Probeer het later opnieuw.',
        editCard: 'Kaart Bewerken',
        deleteCard: 'Kaart Verwijderen',
        
        // Card content
        question: 'Vraag',
        answer: 'Antwoord',
        answers: 'Antwoorden',
        correctAnswer: 'Juist Antwoord',
        incorrectAnswer: 'Onjuist Antwoord',
        multipleChoice: 'Meerkeuze',
        freeText: 'Vrije Tekst',
        
        // Card properties
        topic: 'Onderwerp',
        difficulty: 'Moeilijkheid',
        tags: 'Tags',
        category: 'Categorie',
        level: 'Niveau',
        points: 'Punten',
        
        // Difficulty levels
        easy: 'Makkelijk',
        medium: 'Gemiddeld',
        hard: 'Moeilijk',
        expert: 'Expert',
        
        // Filters and search
        allTopics: 'Alle Onderwerpen',
        filterByTopic: 'Filter op Onderwerp',
        filterByDifficulty: 'Filter op Moeilijkheid',
        searchCards: 'Kaarten Zoeken',
        
        // Actions
        createCard: 'Kaart Maken',
        saveCard: 'Kaart Opslaan',
        updateCard: 'Kaart Bijwerken',
        duplicateCard: 'Kaart Dupliceren',
        archiveCard: 'Kaart Archiveren',
        
        // Confirmations
        confirmDelete: 'Wilt u deze kaart echt verwijderen?',
        confirmArchive: 'Wilt u deze kaart archiveren?',
        unsavedChanges: 'U heeft niet-opgeslagen wijzigingen. Wilt u doorgaan?',
        
        // Success messages
        cardCreated: 'Kaart succesvol gemaakt',
        cardSaved: 'Kaart succesvol opgeslagen',
        cardUpdated: 'Kaart succesvol bijgewerkt',
        cardDeleted: 'Kaart succesvol verwijderd',
        cardDuplicated: 'Kaart succesvol gedupliceerd',
        cardArchived: 'Kaart succesvol gearchiveerd',
        
        // Error messages
        createError: 'Fout bij maken van kaart',
        saveError: 'Fout bij opslaan van kaart',
        updateError: 'Fout bij bijwerken van kaart',
        deleteError: 'Fout bij verwijderen van kaart',
        loadError: 'Fout bij laden van kaarten',
        strokeSaveError: 'Fout bij opslaan van lijn',
        strokeSaved: 'Lijn succesvol opgeslagen',
        
        // Validation
        minTwoAnswers: 'Minstens twee antwoorden met tekst zijn vereist',
        questionRequired: 'Vraag is vereist',
        answerRequired: 'Minstens één antwoord is vereist',
        topicRequired: 'Onderwerp is vereist',
        invalidCardData: 'Ongeldige kaartgegevens',
        
        // States
        draft: 'Concept',
        published: 'Gepubliceerd',
        archived: 'Gearchiveerd',
        private: 'Privé',
        shared: 'Gedeeld',
        
        // Statistics
        cardStats: 'Kaart Statistieken',
        totalCards: 'Totaal Kaarten',
        newCards: 'Nieuwe Kaarten',
        reviewCards: 'Herhaling',
        masteredCards: 'Beheerst',
        
        // Learning progress
        learningProgress: 'Leervoortgang',
        correctAnswers: 'Juiste Antwoorden',
        incorrectAnswers: 'Onjuiste Antwoorden',
        accuracy: 'Nauwkeurigheid',
        streak: 'Reeks',
        
        // Empty states
        noCards: 'Geen leerkaarten beschikbaar',
        noCardsFound: 'Geen kaarten gevonden',
        noCardsInTopic: 'Geen kaarten in dit onderwerp',
        createFirstCard: 'Maak uw eerste kaart',
        
        // Bulk actions
        selectAll: 'Alles Selecteren',
        deselectAll: 'Alles Deselecteren',
        selectedCards: 'Geselecteerde Kaarten',
        bulkDelete: 'Geselecteerde Verwijderen',
        bulkArchive: 'Geselecteerde Archiveren',
        bulkEdit: 'Geselecteerde Bewerken',
        pleaseEnterQuestion: 'Voer een vraag in',
        errorSaving: 'Fout bij opslaan van wijzigingen',
        errorDeleting: 'Fout bij verwijderen van kaart'
    }
};