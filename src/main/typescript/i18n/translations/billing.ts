/**
 * Billing/Buchungskarten module translations for all languages
 */

export const billingTranslations = {
    de: {
        // Main interface
        title: 'Buchungskarten',
        subtitle: 'Verwalten Sie Ihre Finanzen und Buchungen',
        
        // Navigation and actions
        newEntry: 'Neue Buchungskarte erstellen',
        addEntry: 'Neue Buchung hinzufügen',
        editEntry: 'Buchung bearbeiten',
        deleteEntry: 'Buchung löschen',
        overview: 'Übersicht',
        reports: 'Buchungskarten Auswertungen',
        statements: 'Abrechnungen',
        export: 'Export',
        import: 'Import',
        
        // Entry types
        income: 'Einnahme',
        expense: 'Ausgabe',
        transfer: 'Übertragung',
        adjustment: 'Korrektur',
        
        // Form fields
        amount: 'Betrag',
        category: 'Kategorie',
        date: 'Datum',
        description: 'Beschreibung',
        reference: 'Referenz',
        receipt: 'Beleg',
        receiptNumber: 'Belegnummer',
        notes: 'Notizen',
        tags: 'Tags',
        
        // Categories
        categories: {
            // Income categories
            income: 'EINNAHMEN',
            sales: 'Verkaufserlöse',
            services: 'Dienstleistungserlöse',
            interest: 'Zinserträge',
            dividends: 'Dividenden',
            rental: 'Mieteinnahmen',
            grants: 'Zuschüsse',
            other_income: 'Sonstige Einnahmen',
            
            // Expense categories
            expenses: 'AUSGABEN',
            materials: 'Materialkosten',
            supplies: 'Betriebsstoffe',
            personnel: 'Personalkosten',
            rent: 'Miete',
            utilities: 'Nebenkosten',
            telecommunications: 'Telekommunikation',
            marketing: 'Marketing',
            advertising: 'Werbung',
            travel: 'Reisekosten',
            office: 'Bürokosten',
            insurance: 'Versicherungen',
            taxes: 'Steuern',
            fees: 'Gebühren',
            maintenance: 'Wartung',
            repairs: 'Reparaturen',
            depreciation: 'Abschreibungen',
            interest_expense: 'Zinsaufwand',
            other_expenses: 'Sonstige Ausgaben'
        },
        
        // Filters and search
        filterByCategory: 'Nach Kategorie filtern',
        filterByType: 'Nach Typ filtern',
        filterByDate: 'Nach Datum filtern',
        filterByAmount: 'Nach Betrag filtern',
        searchEntries: 'Buchungen suchen',
        dateRange: 'Zeitraum',
        amountRange: 'Betragsbereich',
        
        // Validation
        amountRequired: 'Betrag ist erforderlich',
        categoryRequired: 'Kategorie ist erforderlich',
        dateRequired: 'Datum ist erforderlich',
        descriptionRequired: 'Beschreibung ist erforderlich',
        invalidAmount: 'Ungültiger Betrag',
        invalidDate: 'Ungültiges Datum',
        
        // Confirmations
        confirmDelete: 'Möchten Sie diese Buchung wirklich löschen?',
        confirmBulkDelete: 'Möchten Sie {count} Buchungen wirklich löschen?',
        unsavedChanges: 'Sie haben ungespeicherte Änderungen. Möchten Sie fortfahren?',
        
        // Success messages
        entryCreated: 'Buchung erfolgreich erstellt',
        cardCreated: 'Buchungskarte erfolgreich erstellt',
        entryUpdated: 'Buchung erfolgreich aktualisiert',
        cardUpdated: 'Buchungskarte erfolgreich aktualisiert',
        entryDeleted: 'Buchung erfolgreich gelöscht',
        cardDeleted: 'Buchungskarte erfolgreich gelöscht',
        importSuccess: 'Buchungen erfolgreich importiert',
        exportSuccess: 'Buchungen erfolgreich exportiert',
        
        // Error messages
        createError: 'Fehler beim Erstellen der Buchung',
        updateError: 'Fehler beim Aktualisieren der Buchung',
        deleteError: 'Fehler beim Löschen der Buchung',
        loadError: 'Fehler beim Laden der Buchungen',
        importError: 'Fehler beim Importieren',
        exportError: 'Fehler beim Exportieren',
        
        // Statistics and reports
        totalIncome: 'Gesamte Einnahmen',
        totalExpenses: 'Gesamte Ausgaben',
        netIncome: 'Nettoeinkommen',
        profit: 'Gewinn',
        loss: 'Verlust',
        balance: 'Saldo',
        monthlyReport: 'Monatsbericht',
        yearlyReport: 'Jahresbericht',
        quarterlyReport: 'Quartalsbericht',
        
        // Status
        draft: 'Entwurf',
        pending: 'Ausstehend',
        approved: 'Genehmigt',
        rejected: 'Abgelehnt',
        paid: 'Bezahlt',
        overdue: 'Überfällig',
        
        // Empty states
        noEntries: 'Keine Buchungen vorhanden',
        noEntriesFound: 'Keine Buchungen gefunden',
        createFirstEntry: 'Erstellen Sie Ihre erste Buchung',
        noReports: 'Keine Berichte verfügbar',
        
        // Bulk actions
        selectAll: 'Alle auswählen',
        deselectAll: 'Alle abwählen',
        selectedEntries: 'Ausgewählte Buchungen',
        bulkDelete: 'Ausgewählte löschen',
        bulkExport: 'Ausgewählte exportieren',
        bulkEdit: 'Ausgewählte bearbeiten',

        // Additional terms
        earn: 'Verdienen',
        spend: 'Ausgeben',
        topUp: 'Aufladen',

        // Error messages
        failedToGetAccountInfo: 'Fehler beim Laden der Kontoinformationen',
        failedToGetBalance: 'Fehler beim Laden des Kontostands',
        failedToTopUp: 'Fehler beim Aufladen des Kontos',
        failedToGetTransactionHistory: 'Fehler beim Laden der Transaktionshistorie',
        failedToCheckBalance: 'Fehler beim Überprüfen des Kontostands',
        pleaseEnterValidAmount: 'Bitte geben Sie einen gültigen Betrag ein',
        topUpError: 'Fehler beim Aufladen',
        failedToRefreshBalance: 'Fehler beim Aktualisieren der Kontostands-Anzeige',
        failedToInitialize: 'Fehler beim Initialisieren des Billing-Service',
        failedToAddBalanceToHeader: 'Fehler beim Hinzufügen des Kontostands zum Header',
        failedToShowAccountModal: 'Fehler beim Anzeigen des Konto-Modals',
        
        // Modal interface
        balanceExhausted: 'Guthaben aufgebraucht',
        currentBalance: 'Aktuelles Guthaben',
        required: 'Benötigt',
        shortage: 'Fehlbetrag',
        balanceExhaustedMessage: 'Dein Guthaben ist aufgebraucht, bitte lade dein Konto auf um weiter arbeiten zu können.',
        topUpAccount: 'Guthaben aufladen',
        close: 'Schließen',
        optional: 'optional',
        topUpTransaction: 'Guthaben Aufladung',
        quickSelection: 'Schnellauswahl',
        cancel: 'Abbrechen',
        successfullyTopUp: 'Erfolgreich',
        myCardCoinWallet: 'Mein CardCoin Wallet',
        earned: 'Verdient',
        spent: 'Ausgegeben',
        usageStatistics: 'Nutzungsstatistiken',
        documentsCreated: 'Dokumente erstellt',
        thisMonth: 'diesen Monat',
        dossiersCreated: 'Dossiers erstellt',
        learningCardsCreated: 'Lernkarten erstellt',
        uploaded: 'Hochgeladen',
        downloaded: 'Heruntergeladen',
        apiCalls: 'API-Aufrufe',
        searches: 'Suchen',
        recentTransactions: 'Letzte Transaktionen',
        contactForTopUp: 'Bitte wenden Sie sich an Ihre Kontaktperson contact@m3-works.com'
    },
    
    en: {
        // Main interface
        title: 'Billing Cards',
        subtitle: 'Manage your finances and bookings',
        
        // Navigation and actions
        newEntry: 'Create New Billing Card',
        addEntry: 'Add New Entry',
        editEntry: 'Edit Entry',
        deleteEntry: 'Delete Entry',
        overview: 'Overview',
        reports: 'Billing Reports',
        statements: 'Statements', 
        export: 'Export',
        import: 'Import',
        
        // Entry types
        income: 'Income',
        expense: 'Expense',
        transfer: 'Transfer',
        adjustment: 'Adjustment',
        
        // Form fields
        amount: 'Amount',
        category: 'Category',
        date: 'Date',
        description: 'Description',
        reference: 'Reference',
        receipt: 'Receipt',
        receiptNumber: 'Receipt Number',
        notes: 'Notes',
        tags: 'Tags',
        
        // Categories
        categories: {
            // Income categories
            income: 'INCOME',
            sales: 'Sales Revenue',
            services: 'Service Revenue',
            interest: 'Interest Income',
            dividends: 'Dividends',
            rental: 'Rental Income',
            grants: 'Grants',
            other_income: 'Other Income',
            
            // Expense categories
            expenses: 'EXPENSES',
            materials: 'Material Costs',
            supplies: 'Supplies',
            personnel: 'Personnel Costs',
            rent: 'Rent',
            utilities: 'Utilities',
            telecommunications: 'Telecommunications',
            marketing: 'Marketing',
            advertising: 'Advertising',
            travel: 'Travel Expenses',
            office: 'Office Costs',
            insurance: 'Insurance',
            taxes: 'Taxes',
            fees: 'Fees',
            maintenance: 'Maintenance',
            repairs: 'Repairs',
            depreciation: 'Depreciation',
            interest_expense: 'Interest Expense',
            other_expenses: 'Other Expenses'
        },
        
        // Filters and search
        filterByCategory: 'Filter by Category',
        filterByType: 'Filter by Type',
        filterByDate: 'Filter by Date',
        filterByAmount: 'Filter by Amount',
        searchEntries: 'Search Entries',
        dateRange: 'Date Range',
        amountRange: 'Amount Range',
        
        // Validation
        amountRequired: 'Amount is required',
        categoryRequired: 'Category is required',
        dateRequired: 'Date is required',
        descriptionRequired: 'Description is required',
        invalidAmount: 'Invalid amount',
        invalidDate: 'Invalid date',
        
        // Confirmations
        confirmDelete: 'Do you really want to delete this entry?',
        confirmBulkDelete: 'Do you really want to delete {count} entries?',
        unsavedChanges: 'You have unsaved changes. Do you want to continue?',
        
        // Success messages
        entryCreated: 'Entry successfully created',
        cardCreated: 'Billing card successfully created',
        entryUpdated: 'Entry successfully updated',
        cardUpdated: 'Billing card successfully updated',
        entryDeleted: 'Entry successfully deleted',
        cardDeleted: 'Billing card successfully deleted',
        importSuccess: 'Entries successfully imported',
        exportSuccess: 'Entries successfully exported',
        
        // Error messages
        createError: 'Error creating entry',
        updateError: 'Error updating entry',
        deleteError: 'Error deleting entry',
        loadError: 'Error loading entries',
        importError: 'Error importing',
        exportError: 'Error exporting',
        
        // Statistics and reports
        totalIncome: 'Total Income',
        totalExpenses: 'Total Expenses',
        netIncome: 'Net Income',
        profit: 'Profit',
        loss: 'Loss',
        balance: 'Balance',
        monthlyReport: 'Monthly Report',
        yearlyReport: 'Yearly Report',
        quarterlyReport: 'Quarterly Report',
        
        // Status
        draft: 'Draft',
        pending: 'Pending',
        approved: 'Approved',
        rejected: 'Rejected',
        paid: 'Paid',
        overdue: 'Overdue',
        
        // Empty states
        noEntries: 'No entries available',
        noEntriesFound: 'No entries found',
        createFirstEntry: 'Create your first entry',
        noReports: 'No reports available',
        
        // Bulk actions
        selectAll: 'Select All',
        deselectAll: 'Deselect All',
        selectedEntries: 'Selected Entries',
        bulkDelete: 'Delete Selected',
        bulkExport: 'Export Selected',
        bulkEdit: 'Edit Selected',
        
        // Additional terms
        earn: 'Earn',
        spend: 'Spend',
        topUp: 'Top Up',

        // Error messages
        failedToGetAccountInfo: 'Failed to get account information',
        failedToGetBalance: 'Failed to get balance',
        failedToTopUp: 'Failed to top up account',
        failedToGetTransactionHistory: 'Failed to get transaction history',
        failedToCheckBalance: 'Failed to check balance',
        pleaseEnterValidAmount: 'Please enter a valid amount',
        topUpError: 'Top up error',
        failedToRefreshBalance: 'Failed to refresh balance display',
        failedToInitialize: 'Failed to initialize billing service',
        failedToAddBalanceToHeader: 'Failed to add balance to header',
        failedToShowAccountModal: 'Failed to show account modal',
        
        // Modal interface
        balanceExhausted: 'Balance Exhausted',
        currentBalance: 'Current Balance',
        required: 'Required',
        shortage: 'Shortage',
        balanceExhaustedMessage: 'Your balance is exhausted, please top up your account to continue working.',
        topUpAccount: 'Top Up Account',
        close: 'Close',
        optional: 'optional',
        topUpTransaction: 'Balance Top Up',
        quickSelection: 'Quick Selection',
        cancel: 'Cancel',
        successfullyTopUp: 'Successfully',
        myCardCoinWallet: 'My CardCoin Wallet',
        earned: 'Earned',
        spent: 'Spent',
        usageStatistics: 'Usage Statistics',
        documentsCreated: 'Documents Created',
        thisMonth: 'this month',
        dossiersCreated: 'Dossiers Created',
        learningCardsCreated: 'Learning Cards Created',
        uploaded: 'Uploaded',
        downloaded: 'Downloaded',
        apiCalls: 'API Calls',
        searches: 'Searches',
        recentTransactions: 'Recent Transactions',
        contactForTopUp: 'Please contact your contact person contact@m3-works.com'
    },
    
    fr: {
        // Main interface
        title: 'Cartes de Facturation',
        subtitle: 'Gérez vos finances et réservations',
        
        // Navigation and actions
        newEntry: 'Créer Nouvelle Carte de Facturation',
        addEntry: 'Ajouter Nouvelle Entrée',
        editEntry: 'Modifier Entrée',
        deleteEntry: 'Supprimer Entrée',
        overview: 'Aperçu',
        reports: 'Rapports de Facturation',
        statements: 'Relevés',
        export: 'Exporter',
        import: 'Importer',
        
        // Entry types
        income: 'Revenus',
        expense: 'Dépense',
        transfer: 'Transfert',
        adjustment: 'Ajustement',
        
        // Form fields
        amount: 'Montant',
        category: 'Catégorie',
        date: 'Date',
        description: 'Description',
        reference: 'Référence',
        receipt: 'Reçu',
        receiptNumber: 'Numéro de Reçu',
        notes: 'Notes',
        tags: 'Étiquettes',
        
        // Categories
        categories: {
            // Income categories
            income: 'REVENUS',
            sales: 'Chiffre d\'Affaires',
            services: 'Revenus de Services',
            interest: 'Revenus d\'Intérêts',
            dividends: 'Dividendes',
            rental: 'Revenus Locatifs',
            grants: 'Subventions',
            other_income: 'Autres Revenus',
            
            // Expense categories
            expenses: 'DÉPENSES',
            materials: 'Coûts Matériaux',
            supplies: 'Fournitures',
            personnel: 'Coûts Personnel',
            rent: 'Loyer',
            utilities: 'Services Publics',
            telecommunications: 'Télécommunications',
            marketing: 'Marketing',
            advertising: 'Publicité',
            travel: 'Frais de Voyage',
            office: 'Coûts Bureau',
            insurance: 'Assurance',
            taxes: 'Taxes',
            fees: 'Frais',
            maintenance: 'Maintenance',
            repairs: 'Réparations',
            depreciation: 'Amortissement',
            interest_expense: 'Charges d\'Intérêts',
            other_expenses: 'Autres Dépenses'
        },
        
        // Filters and search
        filterByCategory: 'Filtrer par Catégorie',
        filterByType: 'Filtrer par Type',
        filterByDate: 'Filtrer par Date',
        filterByAmount: 'Filtrer par Montant',
        searchEntries: 'Rechercher Entrées',
        dateRange: 'Plage de Dates',
        amountRange: 'Plage de Montants',
        
        // Validation
        amountRequired: 'Le montant est requis',
        categoryRequired: 'La catégorie est requise',
        dateRequired: 'La date est requise',
        descriptionRequired: 'La description est requise',
        invalidAmount: 'Montant non valide',
        invalidDate: 'Date non valide',
        
        // Confirmations
        confirmDelete: 'Voulez-vous vraiment supprimer cette entrée ?',
        confirmBulkDelete: 'Voulez-vous vraiment supprimer {count} entrées ?',
        unsavedChanges: 'Vous avez des modifications non sauvegardées. Voulez-vous continuer ?',
        
        // Success messages
        entryCreated: 'Entrée créée avec succès',
        cardCreated: 'Carte de facturation créée avec succès',
        entryUpdated: 'Entrée mise à jour avec succès',
        cardUpdated: 'Carte de facturation mise à jour avec succès',
        entryDeleted: 'Entrée supprimée avec succès',
        cardDeleted: 'Carte de facturation supprimée avec succès',
        importSuccess: 'Entrées importées avec succès',
        exportSuccess: 'Entrées exportées avec succès',
        
        // Error messages
        createError: 'Erreur lors de la création de l\'entrée',
        updateError: 'Erreur lors de la mise à jour de l\'entrée',
        deleteError: 'Erreur lors de la suppression de l\'entrée',
        loadError: 'Erreur lors du chargement des entrées',
        importError: 'Erreur lors de l\'importation',
        exportError: 'Erreur lors de l\'exportation',
        
        // Statistics and reports
        totalIncome: 'Total des Revenus',
        totalExpenses: 'Total des Dépenses',
        netIncome: 'Revenu Net',
        profit: 'Profit',
        loss: 'Perte',
        balance: 'Solde',
        monthlyReport: 'Rapport Mensuel',
        yearlyReport: 'Rapport Annuel',
        quarterlyReport: 'Rapport Trimestriel',
        
        // Status
        draft: 'Brouillon',
        pending: 'En Attente',
        approved: 'Approuvé',
        rejected: 'Rejeté',
        paid: 'Payé',
        overdue: 'En Retard',
        
        // Empty states
        noEntries: 'Aucune entrée disponible',
        noEntriesFound: 'Aucune entrée trouvée',
        createFirstEntry: 'Créez votre première entrée',
        noReports: 'Aucun rapport disponible',
        
        // Bulk actions
        selectAll: 'Tout Sélectionner',
        deselectAll: 'Tout Désélectionner',
        selectedEntries: 'Entrées Sélectionnées',
        bulkDelete: 'Supprimer Sélectionnées',
        bulkExport: 'Exporter Sélectionnées',
        bulkEdit: 'Modifier Sélectionnées',
        
        // Additional terms
        earn: 'Gagner',
        spend: 'Dépenser',
        topUp: 'Recharger',

        // Error messages
        failedToGetAccountInfo: 'Échec de l\'obtention des informations de compte',
        failedToGetBalance: 'Échec de l\'obtention du solde',
        failedToTopUp: 'Échec de la recharge du compte',
        failedToGetTransactionHistory: 'Échec de l\'obtention de l\'historique des transactions',
        failedToCheckBalance: 'Échec de la vérification du solde',
        pleaseEnterValidAmount: 'Veuillez entrer un montant valide',
        topUpError: 'Erreur de recharge',
        failedToRefreshBalance: 'Échec de l\'actualisation de l\'affichage du solde',
        failedToInitialize: 'Échec de l\'initialisation du service de facturation',
        failedToAddBalanceToHeader: 'Échec de l\'ajout du solde à l\'en-tête',
        failedToShowAccountModal: 'Échec de l\'affichage du modal de compte',
        
        // Modal interface
        balanceExhausted: 'Solde Épuisé',
        currentBalance: 'Solde Actuel',
        required: 'Requis',
        shortage: 'Manque',
        balanceExhaustedMessage: 'Votre solde est épuisé, veuillez recharger votre compte pour continuer à travailler.',
        topUpAccount: 'Recharger le Compte',
        close: 'Fermer',
        optional: 'optionnel',
        topUpTransaction: 'Recharge de Solde',
        quickSelection: 'Sélection Rapide',
        cancel: 'Annuler',
        successfullyTopUp: 'Avec succès',
        myCardCoinWallet: 'Mon Portefeuille CardCoin',
        earned: 'Gagné',
        spent: 'Dépensé',
        usageStatistics: 'Statistiques d\'Utilisation',
        documentsCreated: 'Documents Créés',
        thisMonth: 'ce mois',
        dossiersCreated: 'Dossiers Créés',
        learningCardsCreated: 'Cartes d\'Apprentissage Créées',
        uploaded: 'Téléchargé',
        downloaded: 'Téléchargé',
        apiCalls: 'Appels API',
        searches: 'Recherches',
        recentTransactions: 'Transactions Récentes',
        contactForTopUp: 'Veuillez contacter votre personne de contact contact@m3-works.com'
    },
    
    nl: {
        // Main interface
        title: 'Facturatiekaarten',
        subtitle: 'Beheer uw financiën en boekingen',
        
        // Navigation and actions
        newEntry: 'Nieuwe Facturatiekaart Maken',
        addEntry: 'Nieuwe Invoer Toevoegen',
        editEntry: 'Invoer Bewerken',
        deleteEntry: 'Invoer Verwijderen',
        overview: 'Overzicht',
        reports: 'Facturatierapporten',
        statements: 'Overzichten',
        export: 'Exporteren',
        import: 'Importeren',
        
        // Entry types
        income: 'Inkomsten',
        expense: 'Uitgave',
        transfer: 'Overboeking',
        adjustment: 'Aanpassing',
        
        // Form fields
        amount: 'Bedrag',
        category: 'Categorie',
        date: 'Datum',
        description: 'Beschrijving',
        reference: 'Referentie',
        receipt: 'Bon',
        receiptNumber: 'Bonnummer',
        notes: 'Notities',
        tags: 'Tags',
        
        // Categories
        categories: {
            // Income categories
            income: 'INKOMSTEN',
            sales: 'Verkoopopbrengsten',
            services: 'Diensteninkomsten',
            interest: 'Renteinkomsten',
            dividends: 'Dividenden',
            rental: 'Huurinkomsten',
            grants: 'Subsidies',
            other_income: 'Overige Inkomsten',
            
            // Expense categories
            expenses: 'UITGAVEN',
            materials: 'Materiaalkosten',
            supplies: 'Benodigdheden',
            personnel: 'Personeelskosten',
            rent: 'Huur',
            utilities: 'Nutsvoorzieningen',
            telecommunications: 'Telecommunicatie',
            marketing: 'Marketing',
            advertising: 'Reclame',
            travel: 'Reiskosten',
            office: 'Kantoorkosten',
            insurance: 'Verzekering',
            taxes: 'Belastingen',
            fees: 'Kosten',
            maintenance: 'Onderhoud',
            repairs: 'Reparaties',
            depreciation: 'Afschrijvingen',
            interest_expense: 'Rentekosten',
            other_expenses: 'Overige Uitgaven'
        },
        
        // Filters and search
        filterByCategory: 'Filter op Categorie',
        filterByType: 'Filter op Type',
        filterByDate: 'Filter op Datum',
        filterByAmount: 'Filter op Bedrag',
        searchEntries: 'Invoeren Zoeken',
        dateRange: 'Datumbereik',
        amountRange: 'Bedragbereik',
        
        // Validation
        amountRequired: 'Bedrag is vereist',
        categoryRequired: 'Categorie is vereist',
        dateRequired: 'Datum is vereist',
        descriptionRequired: 'Beschrijving is vereist',
        invalidAmount: 'Ongeldig bedrag',
        invalidDate: 'Ongeldige datum',
        
        // Confirmations
        confirmDelete: 'Wilt u deze invoer echt verwijderen?',
        confirmBulkDelete: 'Wilt u {count} invoeren echt verwijderen?',
        unsavedChanges: 'U heeft niet-opgeslagen wijzigingen. Wilt u doorgaan?',
        
        // Success messages
        entryCreated: 'Invoer succesvol gemaakt',
        cardCreated: 'Facturatiekaart succesvol gemaakt',
        entryUpdated: 'Invoer succesvol bijgewerkt',
        cardUpdated: 'Facturatiekaart succesvol bijgewerkt',
        entryDeleted: 'Invoer succesvol verwijderd',
        cardDeleted: 'Facturatiekaart succesvol verwijderd',
        importSuccess: 'Invoeren succesvol geïmporteerd',
        exportSuccess: 'Invoeren succesvol geëxporteerd',
        
        // Error messages
        createError: 'Fout bij maken van invoer',
        updateError: 'Fout bij bijwerken van invoer',
        deleteError: 'Fout bij verwijderen van invoer',
        loadError: 'Fout bij laden van invoeren',
        importError: 'Fout bij importeren',
        exportError: 'Fout bij exporteren',
        
        // Statistics and reports
        totalIncome: 'Totale Inkomsten',
        totalExpenses: 'Totale Uitgaven',
        netIncome: 'Netto Inkomen',
        profit: 'Winst',
        loss: 'Verlies',
        balance: 'Saldo',
        monthlyReport: 'Maandrapport',
        yearlyReport: 'Jaarrapport',
        quarterlyReport: 'Kwartaalrapport',
        
        // Status
        draft: 'Concept',
        pending: 'In Behandeling',
        approved: 'Goedgekeurd',
        rejected: 'Afgewezen',
        paid: 'Betaald',
        overdue: 'Achterstallig',
        
        // Empty states
        noEntries: 'Geen invoeren beschikbaar',
        noEntriesFound: 'Geen invoeren gevonden',
        createFirstEntry: 'Maak uw eerste invoer',
        noReports: 'Geen rapporten beschikbaar',
        
        // Bulk actions
        selectAll: 'Alles Selecteren',
        deselectAll: 'Alles Deselecteren',
        selectedEntries: 'Geselecteerde Invoeren',
        bulkDelete: 'Geselecteerde Verwijderen',
        bulkExport: 'Geselecteerde Exporteren',
        bulkEdit: 'Geselecteerde Bewerken',
        
        // Additional terms
        earn: 'Verdienen',
        spend: 'Uitgeven',
        topUp: 'Opladen',

        // Error messages
        failedToGetAccountInfo: 'Fout bij ophalen van accountinformatie',
        failedToGetBalance: 'Fout bij ophalen van saldo',
        failedToTopUp: 'Fout bij opladen van account',
        failedToGetTransactionHistory: 'Fout bij ophalen van transactiegeschiedenis',
        failedToCheckBalance: 'Fout bij controleren van saldo',
        pleaseEnterValidAmount: 'Voer een geldig bedrag in',
        topUpError: 'Oplaad fout',
        failedToRefreshBalance: 'Fout bij vernieuwen van saldo weergave',
        failedToInitialize: 'Fout bij initialiseren van facturatieservice',
        failedToAddBalanceToHeader: 'Fout bij toevoegen van saldo aan header',
        failedToShowAccountModal: 'Fout bij tonen van account modal',
        
        // Modal interface
        balanceExhausted: 'Saldo Uitgeput',
        currentBalance: 'Huidig Saldo',
        required: 'Vereist',
        shortage: 'Tekort',
        balanceExhaustedMessage: 'Uw saldo is uitgeput, laad uw account op om door te kunnen werken.',
        topUpAccount: 'Account Opladen',
        close: 'Sluiten',
        optional: 'optioneel',
        topUpTransaction: 'Saldo Oplading',
        quickSelection: 'Snelle Selectie',
        cancel: 'Annuleren',
        successfullyTopUp: 'Succesvol',
        myCardCoinWallet: 'Mijn CardCoin Portefeuille',
        earned: 'Verdiend',
        spent: 'Uitgegeven',
        usageStatistics: 'Gebruiksstatistieken',
        documentsCreated: 'Documenten Gemaakt',
        thisMonth: 'deze maand',
        dossiersCreated: 'Dossiers Gemaakt',
        learningCardsCreated: 'Leerkaarten Gemaakt',
        uploaded: 'Geüpload',
        downloaded: 'Gedownload',
        apiCalls: 'API Oproepen',
        searches: 'Zoekopdrachten',
        recentTransactions: 'Recente Transacties',
        contactForTopUp: 'Neem contact op met uw contactpersoon contact@m3-works.com'
    }
};