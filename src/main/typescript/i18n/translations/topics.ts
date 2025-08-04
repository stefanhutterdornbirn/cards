/**
 * Topics/Learning Areas translations for all languages
 */

export const topicsTranslations = {
    de: {
        // Main interface
        title: 'Lerngebiete',
        subtitle: 'Organisieren Sie Ihre Lernkarten nach Themen',
        management: 'Lerngebiete-Verwaltung',
        totalTopics: 'Lerngebiete gesamt',
        
        // Actions
        newTopic: 'Neues Lerngebiet',
        addTopic: 'Neues Lerngebiet hinzufügen',
        createTopic: 'Neues Lerngebiet erstellen',
        editTopic: 'Lerngebiet bearbeiten',
        deleteTopic: 'Lerngebiet löschen',
        edit: 'Bearbeiten',
        delete: 'Löschen',
        create: 'Erstellen',
        save: 'Speichern',
        cancel: 'Abbrechen',
        saveTopic: 'Lerngebiet speichern',
        updateTopic: 'Lerngebiet aktualisieren',
        
        // Form fields
        topicName: 'Lerngebiet-Name',
        name: 'Name',
        placeholderName: 'Name des Lerngebiets',
        topicTitle: 'Titel',
        topicDescription: 'Beschreibung',
        topicColor: 'Farbe',
        topicIcon: 'Symbol',
        parentTopic: 'Übergeordnetes Thema',
        
        // Validation
        nameRequired: 'Name ist erforderlich',
        nameMinLength: 'Name muss mindestens 3 Zeichen lang sein',
        nameMaxLength: 'Name darf maximal 50 Zeichen lang sein',
        descriptionMaxLength: 'Beschreibung darf maximal 500 Zeichen lang sein',
        topicExists: 'Ein Lerngebiet mit diesem Namen existiert bereits',
        
        // Confirmations
        confirmDelete: 'Möchten Sie dieses Lerngebiet wirklich löschen?',
        confirmDeleteWithCards: 'Dieses Lerngebiet enthält {count} Karten. Möchten Sie es trotzdem löschen?',
        unsavedChanges: 'Sie haben ungespeicherte Änderungen. Möchten Sie fortfahren?',
        
        // Success messages
        topicCreated: 'Lerngebiet erfolgreich erstellt',
        topicUpdated: 'Lerngebiet erfolgreich aktualisiert',
        topicDeleted: 'Lerngebiet erfolgreich gelöscht',
        topicSaved: 'Lerngebiet erfolgreich gespeichert',
        
        // Error messages
        createError: 'Fehler beim Erstellen des Lerngebiets',
        updateError: 'Fehler beim Aktualisieren des Lerngebiets',
        deleteError: 'Fehler beim Löschen des Lerngebiets',
        loadError: 'Fehler beim Laden der Lerngebiete',
        saveError: 'Fehler beim Speichern des Lerngebiets',
        pleaseSelectTopic: 'Bitte wählen Sie ein Thema aus',
        
        // Statistics
        cardCount: 'Karten',
        totalCards: 'Gesamte Karten',
        newCards: 'Neue Karten',
        reviewCards: 'Zu wiederholen',
        masteredCards: 'Gemeistert',
        
        // Empty states
        noTopics: 'Keine Lerngebiete vorhanden',
        noTopicsFound: 'Keine Lerngebiete gefunden',
        createFirstTopic: 'Erstellen Sie Ihr erstes Lerngebiet',
        noCardsInTopic: 'Keine Karten in diesem Lerngebiet',
        
        // Filters and search
        searchTopics: 'Lerngebiete suchen',
        filterByName: 'Nach Name filtern',
        sortByName: 'Nach Name sortieren',
        sortByCardCount: 'Nach Kartenanzahl sortieren',
        sortByDate: 'Nach Datum sortieren',
        
        // Topic status
        active: 'Aktiv',
        inactive: 'Inaktiv',
        archived: 'Archiviert',
        
        // Hierarchy
        subtopics: 'Unterthemen',
        parentTopics: 'Übergeordnete Themen',
        rootTopic: 'Hauptthema',
        
        // Bulk actions
        selectAll: 'Alle auswählen',
        deselectAll: 'Alle abwählen',
        selectedTopics: 'Ausgewählte Lerngebiete',
        bulkDelete: 'Ausgewählte löschen',
        bulkArchive: 'Ausgewählte archivieren',
        bulkActivate: 'Ausgewählte aktivieren',
        
        // Import/Export
        importTopics: 'Lerngebiete importieren',
        exportTopics: 'Lerngebiete exportieren',
        importSuccess: 'Lerngebiete erfolgreich importiert',
        exportSuccess: 'Lerngebiete erfolgreich exportiert'
    },
    
    en: {
        // Main interface
        title: 'Learning Areas',
        subtitle: 'Organize your learning cards by topics',
        management: 'Learning Areas Management',
        totalTopics: 'Total Learning Areas',
        
        // Actions
        newTopic: 'New Learning Area',
        addTopic: 'Add New Learning Area',
        createTopic: 'Create New Learning Area',
        editTopic: 'Edit Learning Area',
        deleteTopic: 'Delete Learning Area',
        edit: 'Edit',
        delete: 'Delete',
        create: 'Create',
        save: 'Save',
        cancel: 'Cancel',
        saveTopic: 'Save Learning Area',
        updateTopic: 'Update Learning Area',
        
        // Form fields
        topicName: 'Learning Area Name',
        name: 'Name',
        placeholderName: 'Name of the learning area',
        topicTitle: 'Title',
        topicDescription: 'Description',
        topicColor: 'Color',
        topicIcon: 'Icon',
        parentTopic: 'Parent Topic',
        
        // Validation
        nameRequired: 'Name is required',
        nameMinLength: 'Name must be at least 3 characters long',
        nameMaxLength: 'Name must not exceed 50 characters',
        descriptionMaxLength: 'Description must not exceed 500 characters',
        topicExists: 'A learning area with this name already exists',
        
        // Confirmations
        confirmDelete: 'Do you really want to delete this learning area?',
        confirmDeleteWithCards: 'This learning area contains {count} cards. Do you still want to delete it?',
        unsavedChanges: 'You have unsaved changes. Do you want to continue?',
        
        // Success messages
        topicCreated: 'Learning area successfully created',
        topicUpdated: 'Learning area successfully updated',
        topicDeleted: 'Learning area successfully deleted',
        topicSaved: 'Learning area successfully saved',
        
        // Error messages
        createError: 'Error creating learning area',
        updateError: 'Error updating learning area',
        deleteError: 'Error deleting learning area',
        loadError: 'Error loading learning areas',
        saveError: 'Error saving learning area',
        pleaseSelectTopic: 'Please select a topic',
        
        // Statistics
        cardCount: 'Cards',
        totalCards: 'Total Cards',
        newCards: 'New Cards',
        reviewCards: 'To Review',
        masteredCards: 'Mastered',
        
        // Empty states
        noTopics: 'No learning areas available',
        noTopicsFound: 'No learning areas found',
        createFirstTopic: 'Create your first learning area',
        noCardsInTopic: 'No cards in this learning area',
        
        // Filters and search
        searchTopics: 'Search learning areas',
        filterByName: 'Filter by name',
        sortByName: 'Sort by name',
        sortByCardCount: 'Sort by card count',
        sortByDate: 'Sort by date',
        
        // Topic status
        active: 'Active',
        inactive: 'Inactive',
        archived: 'Archived',
        
        // Hierarchy
        subtopics: 'Subtopics',
        parentTopics: 'Parent Topics',
        rootTopic: 'Root Topic',
        
        // Bulk actions
        selectAll: 'Select All',
        deselectAll: 'Deselect All',
        selectedTopics: 'Selected Learning Areas',
        bulkDelete: 'Delete Selected',
        bulkArchive: 'Archive Selected',
        bulkActivate: 'Activate Selected',
        
        // Import/Export
        importTopics: 'Import Learning Areas',
        exportTopics: 'Export Learning Areas',
        importSuccess: 'Learning areas successfully imported',
        exportSuccess: 'Learning areas successfully exported'
    },
    
    fr: {
        // Main interface
        title: 'Domaines d\'Apprentissage',
        subtitle: 'Organisez vos cartes d\'apprentissage par sujets',
        management: 'Gestion des Domaines d\'Apprentissage',
        totalTopics: 'Total Domaines d\'Apprentissage',
        
        // Actions
        newTopic: 'Nouveau Domaine d\'Apprentissage',
        addTopic: 'Ajouter un Nouveau Domaine d\'Apprentissage',
        createTopic: 'Créer un Nouveau Domaine d\'Apprentissage',
        editTopic: 'Modifier le Domaine d\'Apprentissage',
        deleteTopic: 'Supprimer le Domaine d\'Apprentissage',
        edit: 'Modifier',
        delete: 'Supprimer',
        create: 'Créer',
        save: 'Sauvegarder',
        cancel: 'Annuler',
        saveTopic: 'Sauvegarder le Domaine d\'Apprentissage',
        updateTopic: 'Mettre à Jour le Domaine d\'Apprentissage',
        
        // Form fields
        topicName: 'Nom du Domaine d\'Apprentissage',
        name: 'Nom',
        placeholderName: 'Nom du domaine d\'apprentissage',
        topicTitle: 'Titre',
        topicDescription: 'Description',
        topicColor: 'Couleur',
        topicIcon: 'Icône',
        parentTopic: 'Sujet Parent',
        
        // Validation
        nameRequired: 'Le nom est requis',
        nameMinLength: 'Le nom doit contenir au moins 3 caractères',
        nameMaxLength: 'Le nom ne doit pas dépasser 50 caractères',
        descriptionMaxLength: 'La description ne doit pas dépasser 500 caractères',
        topicExists: 'Un domaine d\'apprentissage avec ce nom existe déjà',
        
        // Confirmations
        confirmDelete: 'Voulez-vous vraiment supprimer ce domaine d\'apprentissage ?',
        confirmDeleteWithCards: 'Ce domaine d\'apprentissage contient {count} cartes. Voulez-vous quand même le supprimer ?',
        unsavedChanges: 'Vous avez des modifications non sauvegardées. Voulez-vous continuer ?',
        
        // Success messages
        topicCreated: 'Domaine d\'apprentissage créé avec succès',
        topicUpdated: 'Domaine d\'apprentissage mis à jour avec succès',
        topicDeleted: 'Domaine d\'apprentissage supprimé avec succès',
        topicSaved: 'Domaine d\'apprentissage sauvegardé avec succès',
        
        // Error messages
        createError: 'Erreur lors de la création du domaine d\'apprentissage',
        updateError: 'Erreur lors de la mise à jour du domaine d\'apprentissage',
        deleteError: 'Erreur lors de la suppression du domaine d\'apprentissage',
        loadError: 'Erreur lors du chargement des domaines d\'apprentissage',
        saveError: 'Erreur lors de la sauvegarde du domaine d\'apprentissage',
        pleaseSelectTopic: 'Veuillez sélectionner un sujet',
        
        // Statistics
        cardCount: 'Cartes',
        totalCards: 'Total Cartes',
        newCards: 'Nouvelles Cartes',
        reviewCards: 'À Réviser',
        masteredCards: 'Maîtrisées',
        
        // Empty states
        noTopics: 'Aucun domaine d\'apprentissage disponible',
        noTopicsFound: 'Aucun domaine d\'apprentissage trouvé',
        createFirstTopic: 'Créez votre premier domaine d\'apprentissage',
        noCardsInTopic: 'Aucune carte dans ce domaine d\'apprentissage',
        
        // Filters and search
        searchTopics: 'Rechercher des domaines d\'apprentissage',
        filterByName: 'Filtrer par nom',
        sortByName: 'Trier par nom',
        sortByCardCount: 'Trier par nombre de cartes',
        sortByDate: 'Trier par date',
        
        // Topic status
        active: 'Actif',
        inactive: 'Inactif',
        archived: 'Archivé',
        
        // Hierarchy
        subtopics: 'Sous-sujets',
        parentTopics: 'Sujets Parents',
        rootTopic: 'Sujet Principal',
        
        // Bulk actions
        selectAll: 'Tout Sélectionner',
        deselectAll: 'Tout Désélectionner',
        selectedTopics: 'Domaines d\'Apprentissage Sélectionnés',
        bulkDelete: 'Supprimer Sélectionnés',
        bulkArchive: 'Archiver Sélectionnés',
        bulkActivate: 'Activer Sélectionnés',
        
        // Import/Export
        importTopics: 'Importer Domaines d\'Apprentissage',
        exportTopics: 'Exporter Domaines d\'Apprentissage',
        importSuccess: 'Domaines d\'apprentissage importés avec succès',
        exportSuccess: 'Domaines d\'apprentissage exportés avec succès'
    },
    
    nl: {
        // Main interface
        title: 'Leergebieden',
        subtitle: 'Organiseer uw leerkaarten per onderwerp',
        management: 'Leergebieden Beheer',
        totalTopics: 'Totaal Leergebieden',
        
        // Actions
        newTopic: 'Nieuw Leergebied',
        addTopic: 'Nieuw Leergebied Toevoegen',
        createTopic: 'Nieuw Leergebied Maken',
        editTopic: 'Leergebied Bewerken',
        deleteTopic: 'Leergebied Verwijderen',
        edit: 'Bewerken',
        delete: 'Verwijderen',
        create: 'Maken',
        save: 'Opslaan',
        cancel: 'Annuleren',
        saveTopic: 'Leergebied Opslaan',
        updateTopic: 'Leergebied Bijwerken',
        
        // Form fields
        topicName: 'Leergebied Naam',
        name: 'Naam',
        placeholderName: 'Naam van het leergebied',
        topicTitle: 'Titel',
        topicDescription: 'Beschrijving',
        topicColor: 'Kleur',
        topicIcon: 'Pictogram',
        parentTopic: 'Bovenliggend Onderwerp',
        
        // Validation
        nameRequired: 'Naam is vereist',
        nameMinLength: 'Naam moet minstens 3 tekens lang zijn',
        nameMaxLength: 'Naam mag niet meer dan 50 tekens bevatten',
        descriptionMaxLength: 'Beschrijving mag niet meer dan 500 tekens bevatten',
        topicExists: 'Een leergebied met deze naam bestaat al',
        
        // Confirmations
        confirmDelete: 'Wilt u dit leergebied echt verwijderen?',
        confirmDeleteWithCards: 'Dit leergebied bevat {count} kaarten. Wilt u het toch verwijderen?',
        unsavedChanges: 'U heeft niet-opgeslagen wijzigingen. Wilt u doorgaan?',
        
        // Success messages
        topicCreated: 'Leergebied succesvol gemaakt',
        topicUpdated: 'Leergebied succesvol bijgewerkt',
        topicDeleted: 'Leergebied succesvol verwijderd',
        topicSaved: 'Leergebied succesvol opgeslagen',
        
        // Error messages
        createError: 'Fout bij maken van leergebied',
        updateError: 'Fout bij bijwerken van leergebied',
        deleteError: 'Fout bij verwijderen van leergebied',
        loadError: 'Fout bij laden van leergebieden',
        saveError: 'Fout bij opslaan van leergebied',
        pleaseSelectTopic: 'Selecteer een onderwerp',
        
        // Statistics
        cardCount: 'Kaarten',
        totalCards: 'Totaal Kaarten',
        newCards: 'Nieuwe Kaarten',
        reviewCards: 'Te Herhalen',
        masteredCards: 'Beheerst',
        
        // Empty states
        noTopics: 'Geen leergebieden beschikbaar',
        noTopicsFound: 'Geen leergebieden gevonden',
        createFirstTopic: 'Maak uw eerste leergebied',
        noCardsInTopic: 'Geen kaarten in dit leergebied',
        
        // Filters and search
        searchTopics: 'Leergebieden zoeken',
        filterByName: 'Filter op naam',
        sortByName: 'Sorteer op naam',
        sortByCardCount: 'Sorteer op aantal kaarten',
        sortByDate: 'Sorteer op datum',
        
        // Topic status
        active: 'Actief',
        inactive: 'Inactief',
        archived: 'Gearchiveerd',
        
        // Hierarchy
        subtopics: 'Subonderwerpen',
        parentTopics: 'Bovenliggende Onderwerpen',
        rootTopic: 'Hoofdonderwerp',
        
        // Bulk actions
        selectAll: 'Alles Selecteren',
        deselectAll: 'Alles Deselecteren',
        selectedTopics: 'Geselecteerde Leergebieden',
        bulkDelete: 'Geselecteerde Verwijderen',
        bulkArchive: 'Geselecteerde Archiveren',
        bulkActivate: 'Geselecteerde Activeren',
        
        // Import/Export
        importTopics: 'Leergebieden Importeren',
        exportTopics: 'Leergebieden Exporteren',
        importSuccess: 'Leergebieden succesvol geïmporteerd',
        exportSuccess: 'Leergebieden succesvol geëxporteerd'
    }
};