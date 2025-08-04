import { clearContentScreen } from './common.js';

const TECHNICAL_INFO_PAGE: string = "TECHNICAL_INFO_PAGE";

interface DatabaseTable {
    name: string;
    description: string;
    columns: string[];
    relationships: string[];
}

interface ApiEndpoint {
    method: string;
    path: string;
    description: string;
    requiresAuth: boolean;
    requiredRoles: string[];
}

interface FileInfo {
    path: string;
    type: 'Kotlin' | 'TypeScript' | 'CSS' | 'Config' | 'Template';
    description: string;
    mainFunctions: string[];
}

document.addEventListener('DOMContentLoaded', function () {
    const techInfoLink = document.getElementById('techInfoLink');
    
    techInfoLink?.addEventListener('click', function (e) {
        e.preventDefault();
        loadTechnicalInfo();
    });
});

function loadTechnicalInfo(): void {
    // Check authorization first
    checkTechnicalInfoAuthorization().then(authorized => {
        if (!authorized) {
            const content = document.getElementById('content');
            if (content) {
                content.innerHTML = `
                    <div class="error-container">
                        <h2>🚫 Zugriff verweigert</h2>
                        <p>Sie haben keine Berechtigung, diese Seite zu sehen.</p>
                        <p>Nur Benutzer mit der Rolle "system.admin" können auf die technischen Informationen zugreifen.</p>
                    </div>
                `;
            }
            return;
        }

        clearContentScreen(TECHNICAL_INFO_PAGE);
        const content = document.getElementById('content');
        if (!content) return;

        // Find or create technical info content div
        let techContent = document.getElementById('technicalInfoContent');
        if (!techContent) {
            techContent = document.createElement('div');
            techContent.id = 'technicalInfoContent';
            content.appendChild(techContent);
        }

    techContent.innerHTML = `
        <div class="tech-info-container">
            <div class="tech-info-header">
                <h1>🔧 Technische Systemdokumentation</h1>
                <div class="tech-info-meta">
                    <span class="meta-item">📅 Generiert: ${new Date().toLocaleDateString('de-DE')}</span>
                    <span class="meta-item">🔒 Nur für system.admin</span>
                </div>
            </div>

            <div class="tech-info-tabs">
                <button class="tab-button active" data-tab="overview">📊 Übersicht</button>
                <button class="tab-button" data-tab="database">🗄️ Datenbank</button>
                <button class="tab-button" data-tab="api">🔌 API</button>
                <button class="tab-button" data-tab="files">📁 Dateien</button>
                <button class="tab-button" data-tab="architecture">🏗️ Architektur</button>
            </div>

            <div id="overview" class="tab-content active">
                ${renderOverview()}
            </div>

            <div id="database" class="tab-content">
                ${renderDatabaseInfo()}
            </div>

            <div id="api" class="tab-content">
                ${renderApiInfo()}
            </div>

            <div id="files" class="tab-content">
                ${renderFileInfo()}
            </div>

            <div id="architecture" class="tab-content">
                ${renderArchitectureInfo()}
            </div>
        </div>
    `;

    addTechnicalInfoStyles();
    initializeTabs();
    }).catch(error => {
        console.error('Error loading technical info:', error);
        const content = document.getElementById('content');
        if (content) {
            content.innerHTML = `
                <div class="error-container">
                    <h2>❌ Fehler</h2>
                    <p>Fehler beim Laden der technischen Informationen.</p>
                </div>
            `;
        }
    });
}

async function checkTechnicalInfoAuthorization(): Promise<boolean> {
    try {
        const authToken = localStorage.getItem('authToken');
        if (!authToken) {
            return false;
        }

        const response = await fetch('/admin/technical-info', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const result = await response.json();
            return result.authorized === true;
        }

        return false;
    } catch (error) {
        console.error('Error checking authorization:', error);
        return false;
    }
}

function renderOverview(): string {
    return `
        <div class="overview-section">
            <h2>📈 Systemübersicht</h2>
            <div class="overview-grid">
                <div class="overview-card">
                    <h3>🎯 Projekt</h3>
                    <p><strong>Name:</strong> Karten - Learning & Document Management System</p>
                    <p><strong>Typ:</strong> Integrierte Lern- und Dokumentenmanagement-Plattform</p>
                    <p><strong>Version:</strong> 2.0.0</p>
                    <p><strong>Framework:</strong> Ktor (Kotlin) + TypeScript</p>
                </div>
                <div class="overview-card">
                    <h3>🏗️ Architektur</h3>
                    <p><strong>Backend:</strong> Kotlin + Ktor Framework</p>
                    <p><strong>Frontend:</strong> TypeScript + Vanilla JS</p>
                    <p><strong>Datenbank:</strong> PostgreSQL</p>
                    <p><strong>ORM:</strong> Exposed</p>
                </div>
                <div class="overview-card">
                    <h3>🔐 Sicherheit</h3>
                    <p><strong>Auth:</strong> JWT-basierte Authentifizierung</p>
                    <p><strong>Rollen:</strong> system.admin, admin, user, guest</p>
                    <p><strong>Gruppen:</strong> Gruppenbasierte Datenisolation</p>
                    <p><strong>Produkte:</strong> Feature-basierte Zugriffskontrolle</p>
                </div>
                <div class="overview-card">
                    <h3>📊 Statistiken</h3>
                    <p><strong>Kotlin-Dateien:</strong> ~25 Dateien</p>
                    <p><strong>TypeScript-Dateien:</strong> ~18 Dateien</p>
                    <p><strong>Datenbank-Tabellen:</strong> 31 Tabellen</p>
                    <p><strong>API-Endpoints:</strong> ~75 Endpoints</p>
                </div>
            </div>
        </div>
    `;
}

function renderDatabaseInfo(): string {
    const tables: DatabaseTable[] = [
        // User Management System (7 tables)
        {
            name: 'credentials',
            description: 'Benutzeranmeldeinformationen',
            columns: ['id', 'username', 'password_hash', 'email', 'created_at', 'updated_at'],
            relationships: ['1:n user_groups', '1:n assessment_users']
        },
        {
            name: 'groups',
            description: 'Benutzergruppen für Datenisolation',
            columns: ['id', 'name', 'description', 'created_at'],
            relationships: ['n:m user_groups', 'n:m group_roles', 'n:m group_products']
        },
        {
            name: 'user_groups',
            description: 'Zuordnung von Benutzern zu Gruppen',
            columns: ['user_id', 'group_id', 'joined_at'],
            relationships: ['n:1 credentials', 'n:1 groups']
        },
        {
            name: 'roles',
            description: 'Benutzerrollen (system.admin, admin, user, guest)',
            columns: ['id', 'name', 'description', 'permissions', 'created_at'],
            relationships: ['n:m group_roles']
        },
        {
            name: 'group_roles',
            description: 'Zuordnung von Rollen zu Gruppen',
            columns: ['group_id', 'role_id', 'assigned_at'],
            relationships: ['n:1 groups', 'n:1 roles']
        },
        {
            name: 'products',
            description: 'Produktfeatures (Lernkarten, Prüfungen, Buchungen, etc.)',
            columns: ['id', 'name', 'description', 'enabled', 'created_at'],
            relationships: ['n:m group_products']
        },
        {
            name: 'group_products',
            description: 'Zuordnung von Produkten zu Gruppen',
            columns: ['group_id', 'product_id', 'assigned_at'],
            relationships: ['n:1 groups', 'n:1 products']
        },
        
        // Learning System (6 tables)
        {
            name: 'learning_cards',
            description: 'Lernkarten mit Fragen und Antworten',
            columns: ['id', 'question', 'answer', 'category', 'difficulty', 'title', 'group_id', 'created_by', 'created_at'],
            relationships: ['n:1 groups', 'n:m exam_cards', 'n:1 credentials']
        },
        {
            name: 'learning_materials',
            description: 'Lernmaterialien und Dokumente',
            columns: ['id', 'name', 'description', 'content_type', 'file_path', 'group_id', 'created_by', 'created_at'],
            relationships: ['n:1 groups', 'n:1 credentials']
        },
        {
            name: 'learning_topics',
            description: 'Lernkategorien und Themen',
            columns: ['id', 'name', 'description', 'parent_id', 'group_id', 'created_by', 'created_at'],
            relationships: ['n:1 groups', '1:n self-reference', 'n:1 credentials']
        },
        {
            name: 'exams',
            description: 'Prüfungsdefinitionen',
            columns: ['id', 'name', 'description', 'duration_in_seconds', 'created_by', 'group_id', 'created_at', 'updated_at'],
            relationships: ['n:1 groups', '1:n assessments', 'n:m exam_cards', 'n:1 credentials']
        },
        {
            name: 'exam_cards',
            description: 'Zuordnung von Lernkarten zu Prüfungen',
            columns: ['exam_id', 'card_id', 'order_index', 'added_at'],
            relationships: ['n:1 exams', 'n:1 learning_cards']
        },
        {
            name: 'image',
            description: 'Bildverwaltung für Lernkarten',
            columns: ['id', 'filename', 'original_name', 'file_path', 'content_type', 'size', 'group_id', 'created_at'],
            relationships: ['n:1 groups']
        },
        
        // Assessment System (3 tables)
        {
            name: 'assessments',
            description: 'Prüfungsinstanzen für Benutzer',
            columns: ['id', 'exam_id', 'name', 'start_time', 'end_time', 'duration', 'created_by', 'created_at', 'updated_at'],
            relationships: ['n:1 exams', '1:n assessment_users', '1:n assessment_results', 'n:1 credentials']
        },
        {
            name: 'assessment_users',
            description: 'Zuordnung von Benutzern zu Prüfungen',
            columns: ['id', 'assessment_id', 'user_id', 'status', 'actual_start_time', 'time_spent_seconds', 'added_at'],
            relationships: ['n:1 assessments', 'n:1 credentials']
        },
        {
            name: 'assessment_results',
            description: 'Prüfungsergebnisse',
            columns: ['id', 'assessment_id', 'user_id', 'started_at', 'completed_at', 'total_questions', 'correct_answers', 'incorrect_answers', 'score_percentage', 'time_spent_seconds'],
            relationships: ['n:1 assessments', 'n:1 credentials']
        },
        
        
        // Accounting System (5 tables)
        {
            name: 'buchungsart',
            description: 'Buchungsarten (Einnahme/Ausgabe)',
            columns: ['id', 'name', 'beschreibung'],
            relationships: ['1:n buchungskategorie', '1:n buchungskarte']
        },
        {
            name: 'buchungskategorie',
            description: 'Buchungskategorien',
            columns: ['id', 'name', 'beschreibung', 'buchungsart_id'],
            relationships: ['n:1 buchungsart', '1:n buchungskarte']
        },
        {
            name: 'dokument',
            description: 'Belege und Dokumente',
            columns: ['id', 'name', 'original_name', 'dateityp', 'groesse', 'pfad', 'hochgeladen'],
            relationships: ['1:n buchungskarte']
        },
        {
            name: 'buchungskarte',
            description: 'Buchungskarten für Rechnungswesen',
            columns: ['id', 'datum', 'buchungsart_id', 'kategorie_id', 'beschreibung', 'betrag', 'belegnummer', 'ust_betrag', 'ust_satz', 'dokument_id', 'image_id', 'erstellt', 'geaendert'],
            relationships: ['n:1 buchungsart', 'n:1 buchungskategorie', 'n:1 dokument', 'n:1 image']
        },
        {
            name: 'uebersichtskarte',
            description: 'Auswertungen und Übersichten der Buchungskarten',
            columns: ['id', 'titel', 'datum_von', 'datum_bis', 'zeitraum_typ', 'gesamt_einnahmen', 'gesamt_ausgaben', 'saldo', 'ausgangs_ust', 'eingangs_ust', 'ust_saldo', 'anzahl_buchungen', 'anzahl_einnahmen', 'anzahl_ausgaben', 'erstellt', 'geaendert'],
            relationships: ['Aggregated data from buchungskarte']
        },
        
        // Learning Materials System (4 tables)
        {
            name: 'packet',
            description: 'Lernmaterialpakete',
            columns: ['id', 'name', 'description', 'created_at'],
            relationships: ['1:n material']
        },
        {
            name: 'material',
            description: 'Lernmaterialien',
            columns: ['id', 'name', 'description', 'content_type', 'file_path', 'packet_id', 'created_at'],
            relationships: ['n:1 packet', 'n:m unterlage_material']
        },
        {
            name: 'unterlagen',
            description: 'Unterlagen und Dokumente',
            columns: ['id', 'name', 'description', 'content_type', 'file_path', 'created_at'],
            relationships: ['n:m unterlage_material']
        },
        {
            name: 'unterlage_material',
            description: 'Zuordnung von Unterlagen zu Materialien',
            columns: ['unterlage_id', 'material_id', 'assigned_at'],
            relationships: ['n:1 unterlagen', 'n:1 material']
        },
        
        // Progress Tracking (1 table)
        {
            name: 'stroke',
            description: 'Lernfortschritt-Tracker (Striche/Punkte)',
            columns: ['id', 'user_id', 'card_id', 'strokes', 'created_at', 'updated_at'],
            relationships: ['n:1 credentials', 'n:1 learning_cards']
        },
        
        // Document Management System - DMS (5 tables)
        {
            name: 'dms_registratur_plan',
            description: 'Registraturpläne für hierarchische Dokumentenstruktur',
            columns: ['id', 'name', 'beschreibung', 'group_id', 'user_id', 'erstellungsdatum', 'status'],
            relationships: ['n:1 groups', 'n:1 credentials', '1:n dms_registratur_position']
        },
        {
            name: 'dms_registratur_position',
            description: 'Positionen innerhalb eines Registraturplans',
            columns: ['id', 'registratur_plan_id', 'position_nummer', 'name', 'beschreibung', 'user_id', 'group_id', 'erstellungsdatum', 'status'],
            relationships: ['n:1 dms_registratur_plan', 'n:1 groups', 'n:1 credentials', '1:n dms_dossier']
        },
        {
            name: 'dms_dossier',
            description: 'Dossiers für Gruppierung von Dokumenten',
            columns: ['id', 'registratur_position_id', 'parent_dossier_id', 'name', 'laufnummer', 'position_nummer', 'eindeutige_laufnummer', 'status', 'user_id', 'group_id', 'erstellungsdatum', 'beschreibung'],
            relationships: ['n:1 dms_registratur_position', 'n:1 self-reference', 'n:1 groups', 'n:1 credentials', '1:n dms_document', '1:n child_dossiers']
        },
        {
            name: 'dms_document',
            description: 'Dokumente mit Metadaten und Versionsverwaltung',
            columns: ['id', 'dossier_id', 'titel', 'aktuelle_version_id', 'status', 'user_id', 'group_id', 'erstellungsdatum', 'beschreibung'],
            relationships: ['n:1 dms_dossier', 'n:1 groups', 'n:1 credentials', '1:n dms_document_version']
        },
        {
            name: 'dms_document_version',
            description: 'Dokumentversionen mit Content Addressable Storage',
            columns: ['id', 'document_id', 'versionsnummer', 'dateiname', 'dateigroesse', 'mime_type', 'hash_wert', 'text_inhalt', 'kommentar', 'status', 'user_id', 'group_id', 'erstellungsdatum'],
            relationships: ['n:1 dms_document', 'n:1 groups', 'n:1 credentials', 'CAS file storage']
        }
    ];

    return `
        <div class="database-section">
            <h2>🗄️ Datenbankschema</h2>
            <div class="db-overview">
                <div class="db-stats">
                    <div class="db-stat">
                        <span class="stat-number">${tables.length}</span>
                        <span class="stat-label">Tabellen</span>
                    </div>
                    <div class="db-stat">
                        <span class="stat-number">PostgreSQL</span>
                        <span class="stat-label">Datenbank</span>
                    </div>
                    <div class="db-stat">
                        <span class="stat-number">Exposed</span>
                        <span class="stat-label">ORM</span>
                    </div>
                </div>
            </div>
            
            <div class="tables-grid">
                ${tables.map(table => `
                    <div class="table-card">
                        <div class="table-header">
                            <h3>${table.name}</h3>
                            <span class="table-type">Tabelle</span>
                        </div>
                        <p class="table-description">${table.description}</p>
                        <div class="table-columns">
                            <h4>Spalten:</h4>
                            <ul>
                                ${table.columns.map(col => `<li><code>${col}</code></li>`).join('')}
                            </ul>
                        </div>
                        <div class="table-relationships">
                            <h4>Beziehungen:</h4>
                            <ul>
                                ${table.relationships.map(rel => `<li>${rel}</li>`).join('')}
                            </ul>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

function renderApiInfo(): string {
    const endpoints: ApiEndpoint[] = [
        { method: 'POST', path: '/register', description: 'Benutzerregistrierung', requiresAuth: false, requiredRoles: [] },
        { method: 'POST', path: '/login', description: 'Benutzeranmeldung (JWT)', requiresAuth: false, requiredRoles: [] },
        { method: 'GET', path: '/me', description: 'Aktuelle Benutzerinfo', requiresAuth: true, requiredRoles: ['user'] },
        { method: 'GET', path: '/users', description: 'Benutzerverwaltung', requiresAuth: true, requiredRoles: ['admin'] },
        { method: 'PUT', path: '/users/password', description: 'Passwort ändern', requiresAuth: true, requiredRoles: ['admin'] },
        { method: 'GET', path: '/learning-cards', description: 'Lernkarten abrufen', requiresAuth: true, requiredRoles: ['user'] },
        { method: 'POST', path: '/learning-cards', description: 'Neue Lernkarte erstellen', requiresAuth: true, requiredRoles: ['user'] },
        { method: 'PUT', path: '/learning-cards/{id}', description: 'Lernkarte bearbeiten', requiresAuth: true, requiredRoles: ['user'] },
        { method: 'DELETE', path: '/learning-cards/{id}', description: 'Lernkarte löschen', requiresAuth: true, requiredRoles: ['user'] },
        { method: 'GET', path: '/learning-materials', description: 'Lernmaterialien abrufen', requiresAuth: true, requiredRoles: ['user'] },
        { method: 'POST', path: '/learning-materials', description: 'Neues Lernmaterial erstellen', requiresAuth: true, requiredRoles: ['user'] },
        { method: 'GET', path: '/learning-topics', description: 'Lernthemen abrufen', requiresAuth: true, requiredRoles: ['user'] },
        { method: 'POST', path: '/learning-topics', description: 'Neues Lernthema erstellen', requiresAuth: true, requiredRoles: ['user'] },
        { method: 'GET', path: '/exams', description: 'Prüfungen abrufen', requiresAuth: true, requiredRoles: ['user'] },
        { method: 'POST', path: '/exams', description: 'Neue Prüfung erstellen', requiresAuth: true, requiredRoles: ['admin'] },
        { method: 'PUT', path: '/exams/{id}', description: 'Prüfung bearbeiten', requiresAuth: true, requiredRoles: ['admin'] },
        { method: 'DELETE', path: '/exams/{id}', description: 'Prüfung löschen', requiresAuth: true, requiredRoles: ['admin'] },
        { method: 'GET', path: '/assessments', description: 'Bewertungen abrufen', requiresAuth: true, requiredRoles: ['user'] },
        { method: 'POST', path: '/assessments', description: 'Neue Bewertung erstellen', requiresAuth: true, requiredRoles: ['admin'] },
        { method: 'POST', path: '/assessments/{id}/start', description: 'Prüfung starten', requiresAuth: true, requiredRoles: ['user'] },
        { method: 'POST', path: '/assessments/{id}/submit', description: 'Prüfung abgeben', requiresAuth: true, requiredRoles: ['user'] },
        { method: 'POST', path: '/assessments/{id}/pause', description: 'Prüfung pausieren', requiresAuth: true, requiredRoles: ['user'] },
        { method: 'GET', path: '/assessments/{id}/result', description: 'Prüfungsergebnis abrufen', requiresAuth: true, requiredRoles: ['user'] },
        { method: 'GET', path: '/assessments/available', description: 'Verfügbare Prüfungen abrufen', requiresAuth: true, requiredRoles: ['user'] },
        { method: 'GET', path: '/images', description: 'Bilder abrufen', requiresAuth: true, requiredRoles: ['user'] },
        { method: 'POST', path: '/images', description: 'Bild hochladen', requiresAuth: true, requiredRoles: ['user'] },
        { method: 'DELETE', path: '/images/{id}', description: 'Bild löschen', requiresAuth: true, requiredRoles: ['user'] },
        { method: 'GET', path: '/groups', description: 'Gruppen abrufen', requiresAuth: true, requiredRoles: ['admin'] },
        { method: 'POST', path: '/groups', description: 'Neue Gruppe erstellen', requiresAuth: true, requiredRoles: ['admin'] },
        { method: 'PUT', path: '/groups/{id}', description: 'Gruppe bearbeiten', requiresAuth: true, requiredRoles: ['admin'] },
        { method: 'DELETE', path: '/groups/{id}', description: 'Gruppe löschen', requiresAuth: true, requiredRoles: ['admin'] },
        { method: 'GET', path: '/roles', description: 'Rollen abrufen', requiresAuth: true, requiredRoles: ['admin'] },
        { method: 'POST', path: '/roles', description: 'Neue Rolle erstellen', requiresAuth: true, requiredRoles: ['system.admin'] },
        { method: 'GET', path: '/products', description: 'Produkte abrufen', requiresAuth: true, requiredRoles: ['admin'] },
        { method: 'POST', path: '/products', description: 'Neues Produkt erstellen', requiresAuth: true, requiredRoles: ['system.admin'] },
        { method: 'GET', path: '/buchungskarten', description: 'Buchungskarten abrufen', requiresAuth: true, requiredRoles: ['user'] },
        { method: 'POST', path: '/buchungskarten', description: 'Neue Buchungskarte erstellen', requiresAuth: true, requiredRoles: ['user'] },
        { method: 'GET', path: '/ai/ask', description: 'AI-Frage stellen (Gemini)', requiresAuth: true, requiredRoles: ['user'] },
        
        // DMS Endpoints
        { method: 'GET', path: '/dms/registraturplan', description: 'Registraturplan abrufen', requiresAuth: true, requiredRoles: ['user'] },
        { method: 'GET', path: '/dms/registraturplan/all', description: 'Alle Registraturpläne abrufen', requiresAuth: true, requiredRoles: ['user'] },
        { method: 'POST', path: '/dms/registraturposition', description: 'Registraturposition erstellen', requiresAuth: true, requiredRoles: ['user'] },
        { method: 'GET', path: '/dms/registraturposition/{id}', description: 'Registraturposition Details', requiresAuth: true, requiredRoles: ['user'] },
        { method: 'POST', path: '/dms/dossier', description: 'Dossier erstellen', requiresAuth: true, requiredRoles: ['user'] },
        { method: 'GET', path: '/dms/dossier/{id}', description: 'Dossier Details abrufen', requiresAuth: true, requiredRoles: ['user'] },
        { method: 'DELETE', path: '/dms/dossier/{id}', description: 'Dossier soft löschen', requiresAuth: true, requiredRoles: ['user'] },
        { method: 'PUT', path: '/dms/dossier/{id}/restore', description: 'Dossier wiederherstellen', requiresAuth: true, requiredRoles: ['user'] },
        { method: 'POST', path: '/dms/document', description: 'Dokument erstellen', requiresAuth: true, requiredRoles: ['user'] },
        { method: 'GET', path: '/dms/document/{id}', description: 'Dokument Details abrufen', requiresAuth: true, requiredRoles: ['user'] },
        { method: 'PUT', path: '/dms/document/{id}', description: 'Dokument bearbeiten', requiresAuth: true, requiredRoles: ['user'] },
        { method: 'DELETE', path: '/dms/document/{id}', description: 'Dokument soft löschen', requiresAuth: true, requiredRoles: ['user'] },
        { method: 'PUT', path: '/dms/document/{id}/restore', description: 'Dokument wiederherstellen', requiresAuth: true, requiredRoles: ['user'] },
        { method: 'POST', path: '/dms/document/{documentId}/version', description: 'Dokumentversion erstellen', requiresAuth: true, requiredRoles: ['user'] },
        { method: 'GET', path: '/dms/document/{documentId}/versions', description: 'Dokumentversionen abrufen', requiresAuth: true, requiredRoles: ['user'] },
        { method: 'DELETE', path: '/dms/document/{documentId}/version/{versionId}', description: 'Dokumentversion soft löschen', requiresAuth: true, requiredRoles: ['user'] },
        { method: 'PUT', path: '/dms/document/{documentId}/version/{versionId}/restore', description: 'Dokumentversion wiederherstellen', requiresAuth: true, requiredRoles: ['user'] },
        { method: 'GET', path: '/dms/file/{hash}', description: 'Datei per Hash abrufen', requiresAuth: true, requiredRoles: ['user'] },
        { method: 'POST', path: '/dms/upload', description: 'Datei hochladen (CAS)', requiresAuth: true, requiredRoles: ['user'] },
        { method: 'GET', path: '/dms/search', description: 'Volltext-Suche in Dokumenten', requiresAuth: true, requiredRoles: ['user'] },
        { method: 'GET', path: '/dms/statistics', description: 'DMS-Statistiken abrufen', requiresAuth: true, requiredRoles: ['user'] },
        { method: 'GET', path: '/dms/deleted-items', description: 'Gelöschte Elemente (Papierkorb)', requiresAuth: true, requiredRoles: ['user'] },
        { method: 'GET', path: '/dms/navigation/{type}/{id}', description: 'Navigation/Breadcrumbs', requiresAuth: true, requiredRoles: ['user'] }
    ];

    return `
        <div class="api-section">
            <h2>🔌 API-Endpunkte</h2>
            <div class="api-overview">
                <div class="api-stats">
                    <div class="api-stat">
                        <span class="stat-number">${endpoints.length}</span>
                        <span class="stat-label">Endpunkte</span>
                    </div>
                    <div class="api-stat">
                        <span class="stat-number">REST</span>
                        <span class="stat-label">API-Typ</span>
                    </div>
                    <div class="api-stat">
                        <span class="stat-number">JWT</span>
                        <span class="stat-label">Authentifizierung</span>
                    </div>
                </div>
            </div>
            
            <div class="endpoints-grid">
                ${endpoints.map(endpoint => `
                    <div class="endpoint-card">
                        <div class="endpoint-header">
                            <span class="http-method ${endpoint.method.toLowerCase()}">${endpoint.method}</span>
                            <code class="endpoint-path">${endpoint.path}</code>
                        </div>
                        <p class="endpoint-description">${endpoint.description}</p>
                        <div class="endpoint-auth">
                            <span class="auth-badge ${endpoint.requiresAuth ? 'auth-required' : 'auth-public'}">
                                ${endpoint.requiresAuth ? '🔒 Authentifizierung erforderlich' : '🌐 Öffentlich'}
                            </span>
                            ${endpoint.requiredRoles.length > 0 ? `
                                <div class="roles-required">
                                    <strong>Rollen:</strong> ${endpoint.requiredRoles.join(', ')}
                                </div>
                            ` : ''}
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

function renderFileInfo(): string {
    const files: FileInfo[] = [
        {
            path: 'src/main/kotlin/Application.kt',
            type: 'Kotlin',
            description: 'Haupt-Anwendungseinstiegspunkt',
            mainFunctions: ['main()', 'module()']
        },
        {
            path: 'src/main/kotlin/Security.kt',
            type: 'Kotlin',
            description: 'JWT-Authentifizierung und Autorisierung',
            mainFunctions: ['configureAuthentication()', 'validateJWT()']
        },
        {
            path: 'src/main/kotlin/UserSchema.kt',
            type: 'Kotlin',
            description: 'Benutzer-, Gruppen- und Rollenschema',
            mainFunctions: ['UserCredentialsService', 'GroupService', 'RoleService']
        },
        {
            path: 'src/main/kotlin/MemoryCardsSchema.kt',
            type: 'Kotlin',
            description: 'Lernkarten-Datenbankschema',
            mainFunctions: ['LearningCardService', 'LearningMaterialService']
        },
        {
            path: 'src/main/kotlin/pruefen_AssessmentSchema.kt',
            type: 'Kotlin',
            description: 'Prüfungs- und Bewertungsschema',
            mainFunctions: ['AssessmentService', 'ExamService']
        },
        {
            path: 'src/main/kotlin/GemminiImpl.kt',
            type: 'Kotlin',
            description: 'Google Gemini AI-Integration',
            mainFunctions: ['askGemini()']
        },
        {
            path: 'src/main/kotlin/ThumbnailService.kt',
            type: 'Kotlin',
            description: 'Bildverarbeitung und Miniaturansichten',
            mainFunctions: ['generateThumbnail()', 'processImage()']
        },
        {
            path: 'src/main/typescript/LearnScript.ts',
            type: 'TypeScript',
            description: 'Interaktive Lernkarten-Benutzeroberfläche',
            mainFunctions: ['loadLearningCards()', 'showCard()', 'nextCard()']
        },
        {
            path: 'src/main/typescript/pruefen_TestScript.ts',
            type: 'TypeScript',
            description: 'Prüfungsabnahme-Interface',
            mainFunctions: ['startAssessment()', 'submitAssessment()', 'toggleAnswer()']
        },
        {
            path: 'src/main/typescript/ManageCardsScript.ts',
            type: 'TypeScript',
            description: 'Lernkarten-Verwaltung',
            mainFunctions: ['loadCards()', 'editCard()', 'deleteCard()']
        },
        {
            path: 'src/main/typescript/Authentication.ts',
            type: 'TypeScript',
            description: 'Frontend-Authentifizierung',
            mainFunctions: ['login()', 'logout()', 'checkAuth()']
        },
        {
            path: 'src/main/resources/static/frontstyles.css',
            type: 'CSS',
            description: 'Haupt-Stylesheets für Frontend',
            mainFunctions: ['Responsive Design', 'Dark/Light Theme']
        },
        {
            path: 'src/main/resources/application.yaml',
            type: 'Config',
            description: 'Server-Konfiguration',
            mainFunctions: ['Database Connection', 'Server Settings']
        },
        {
            path: 'build.gradle.kts',
            type: 'Config',
            description: 'Gradle-Build-Konfiguration',
            mainFunctions: ['Dependencies', 'TypeScript Compilation']
        },
        
        // DMS-specific files
        {
            path: 'src/main/kotlin/dms/schema/DMSSchema.kt',
            type: 'Kotlin',
            description: 'DMS-Datenbankschema (Registratur, Dossier, Dokument)',
            mainFunctions: ['RegistraturPlan', 'Dossier', 'Document', 'DocumentVersion']
        },
        {
            path: 'src/main/kotlin/dms/service/DMSService.kt',
            type: 'Kotlin',
            description: 'DMS-Business-Logic und CRUD-Operationen',
            mainFunctions: ['createDocument()', 'buildDMSTree()', 'softDeleteDocument()', 'searchDocuments()']
        },
        {
            path: 'src/main/kotlin/dms/routing/DMSRouting.kt',
            type: 'Kotlin',
            description: 'DMS-REST-API-Endpoints',
            mainFunctions: ['configureDMSRouting()', 'File Upload/Download', 'Search API']
        },
        {
            path: 'src/main/kotlin/dms/security/DMSSecurity.kt',
            type: 'Kotlin',
            description: 'DMS-Sicherheit und Berechtigungen',
            mainFunctions: ['hasAccessToDocument()', 'canSoftDeleteDocument()', 'filterAccessibleDocuments()']
        },
        {
            path: 'src/main/kotlin/ContentAddressableStorage.kt',
            type: 'Kotlin',
            description: 'Content Addressable Storage für Dateiverwaltung',
            mainFunctions: ['store()', 'retrieve()', 'hash calculation', 'deduplication']
        },
        {
            path: 'src/main/typescript/dms/DMSScript.ts',
            type: 'TypeScript',
            description: 'DMS-Frontend mit Baumansicht und Dokumentenverwaltung',
            mainFunctions: ['loadDMSRegistraturplan()', 'uploadFile()', 'showVersionDeleteConfirmation()', 'populateDeletedItemsModal()']
        },
        {
            path: 'src/main/resources/static/dms/html/dms.html',
            type: 'Template',
            description: 'DMS-HTML-Template mit modaler Dialoge',
            mainFunctions: ['Tree Navigation', 'File Upload', 'Version Management', 'Trash/Restore Modals']
        },
        {
            path: 'src/main/resources/static/dms/css/dms.css',
            type: 'CSS',
            description: 'DMS-spezifische Styles',
            mainFunctions: ['Tree View', 'Modal Dialogs', 'File Upload UI', 'Responsive Design']
        }
    ];

    return `
        <div class="files-section">
            <h2>📁 Dateienübersicht</h2>
            <div class="files-overview">
                <div class="files-stats">
                    <div class="file-stat">
                        <span class="stat-number">${files.filter(f => f.type === 'Kotlin').length}</span>
                        <span class="stat-label">Kotlin-Dateien</span>
                    </div>
                    <div class="file-stat">
                        <span class="stat-number">${files.filter(f => f.type === 'TypeScript').length}</span>
                        <span class="stat-label">TypeScript-Dateien</span>
                    </div>
                    <div class="file-stat">
                        <span class="stat-number">${files.filter(f => f.type === 'CSS').length}</span>
                        <span class="stat-label">CSS-Dateien</span>
                    </div>
                    <div class="file-stat">
                        <span class="stat-number">${files.filter(f => f.type === 'Config').length}</span>
                        <span class="stat-label">Konfigurationsdateien</span>
                    </div>
                </div>
            </div>
            
            <div class="files-grid">
                ${files.map(file => `
                    <div class="file-card">
                        <div class="file-header">
                            <span class="file-type ${file.type.toLowerCase()}">${file.type}</span>
                            <code class="file-path">${file.path}</code>
                        </div>
                        <p class="file-description">${file.description}</p>
                        <div class="file-functions">
                            <h4>Hauptfunktionen:</h4>
                            <ul>
                                ${file.mainFunctions.map(func => `<li><code>${func}</code></li>`).join('')}
                            </ul>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

function renderArchitectureInfo(): string {
    return `
        <div class="architecture-section">
            <h2>🏗️ Systemarchitektur</h2>
            
            <div class="architecture-diagram">
                <div class="arch-layer frontend">
                    <h3>Frontend Layer</h3>
                    <div class="arch-components">
                        <div class="component">TypeScript</div>
                        <div class="component">Vanilla JavaScript</div>
                        <div class="component">CSS3</div>
                        <div class="component">HTML5</div>
                    </div>
                </div>
                
                <div class="arch-layer api">
                    <h3>API Layer</h3>
                    <div class="arch-components">
                        <div class="component">Ktor Framework</div>
                        <div class="component">JWT Authentication</div>
                        <div class="component">REST Endpoints</div>
                        <div class="component">Role-based Access</div>
                    </div>
                </div>
                
                <div class="arch-layer business">
                    <h3>Business Logic</h3>
                    <div class="arch-components">
                        <div class="component">Learning Cards Service</div>
                        <div class="component">Assessment Service</div>
                        <div class="component">Document Management Service</div>
                        <div class="component">User Management</div>
                        <div class="component">AI Integration (Gemini)</div>
                    </div>
                </div>
                
                <div class="arch-layer data">
                    <h3>Data Layer</h3>
                    <div class="arch-components">
                        <div class="component">Exposed ORM</div>
                        <div class="component">PostgreSQL</div>
                        <div class="component">File Storage</div>
                        <div class="component">Image Processing</div>
                    </div>
                </div>
            </div>
            
            <div class="architecture-details">
                <div class="arch-detail">
                    <h3>🔐 Sicherheitsarchitektur</h3>
                    <ul>
                        <li><strong>JWT-basierte Authentifizierung:</strong> Sichere Token-basierte Anmeldung</li>
                        <li><strong>Rollenbasierte Zugriffskontrolle:</strong> system.admin, admin, user, guest</li>
                        <li><strong>Gruppenbasierte Datenisolation:</strong> Benutzer sehen nur Gruppendaten</li>
                        <li><strong>Produktbasierte Features:</strong> Modulare Funktionsfreischaltung</li>
                    </ul>
                </div>
                
                <div class="arch-detail">
                    <h3>📊 Datenarchitektur</h3>
                    <ul>
                        <li><strong>PostgreSQL:</strong> Relationale Datenbank mit ACID-Eigenschaften</li>
                        <li><strong>Exposed ORM:</strong> Typsicherer Datenbankzugriff</li>
                        <li><strong>Content-Addressable Storage:</strong> Effiziente Dateiverwaltung</li>
                        <li><strong>Bildverarbeitung:</strong> Automatische Miniaturansichten</li>
                    </ul>
                </div>
                
                <div class="arch-detail">
                    <h3>🎯 Funktionale Architektur</h3>
                    <ul>
                        <li><strong>Lernkarten-System:</strong> Interaktive Multiple-Choice-Lernkarten</li>
                        <li><strong>Prüfungssystem:</strong> Zeitgesteuerte Bewertungen mit Pause/Fortsetzen</li>
                        <li><strong>DMS (Document Management):</strong> Hierarchisches Dokumentenmanagement mit Versionskontrolle</li>
                        <li><strong>Content Addressable Storage:</strong> Deduplizierte Dateispeicherung mit Hash-basiertem Zugriff</li>
                        <li><strong>Buchungssystem:</strong> Rechnungswesen und Dokumentenverwaltung</li>
                        <li><strong>AI-Integration:</strong> Google Gemini für Lernunterstützung</li>
                    </ul>
                </div>
                
                <div class="arch-detail">
                    <h3>⚡ Performance</h3>
                    <ul>
                        <li><strong>Asynchrone Verarbeitung:</strong> Kotlin Coroutines für Skalierbarkeit</li>
                        <li><strong>Caching:</strong> Intelligent caching für häufig verwendete Daten</li>
                        <li><strong>Lazy Loading:</strong> Bedarfsgerechtes Laden von Inhalten</li>
                        <li><strong>Optimierte Bildverarbeitung:</strong> Komprimierung und Miniaturansichten</li>
                    </ul>
                </div>
            </div>
        </div>
    `;
}

function initializeTabs(): void {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            const targetTab = (button as HTMLElement).dataset.tab;
            
            // Remove active class from all buttons and contents
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Add active class to clicked button and corresponding content
            button.classList.add('active');
            const targetContent = document.getElementById(targetTab!);
            if (targetContent) {
                targetContent.classList.add('active');
            }
        });
    });
}

function addTechnicalInfoStyles(): void {
    const style = document.createElement('style');
    style.textContent = `
        .tech-info-container {
            max-width: 1400px;
            margin: 0 auto;
            padding: 20px;
        }
        
        .tech-info-header {
            text-align: center;
            margin-bottom: 30px;
            padding: 30px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border-radius: 10px;
        }
        
        .tech-info-header h1 {
            margin: 0 0 15px 0;
            font-size: 2.5em;
        }
        
        .tech-info-meta {
            display: flex;
            justify-content: center;
            gap: 30px;
            margin-top: 15px;
        }
        
        .meta-item {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 14px;
            opacity: 0.9;
        }
        
        .tech-info-tabs {
            display: flex;
            justify-content: center;
            margin-bottom: 30px;
            background: #f8f9fa;
            border-radius: 10px;
            padding: 5px;
        }
        
        .tab-button {
            background: transparent;
            border: none;
            padding: 15px 25px;
            cursor: pointer;
            border-radius: 8px;
            font-weight: 500;
            transition: all 0.3s ease;
            margin: 0 2px;
        }
        
        .tab-button:hover {
            background: #e9ecef;
        }
        
        .tab-button.active {
            background: #007bff;
            color: white;
        }
        
        .tab-content {
            display: none;
            animation: fadeIn 0.3s ease;
        }
        
        .tab-content.active {
            display: block;
        }
        
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        .overview-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin-top: 20px;
        }
        
        .overview-card {
            background: white;
            border: 1px solid #dee2e6;
            border-radius: 8px;
            padding: 20px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .overview-card h3 {
            margin: 0 0 15px 0;
            color: #495057;
        }
        
        .overview-card p {
            margin: 5px 0;
            color: #6c757d;
        }
        
        .db-overview, .api-overview, .files-overview {
            background: #f8f9fa;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 30px;
        }
        
        .db-stats, .api-stats, .files-stats {
            display: flex;
            justify-content: center;
            gap: 40px;
        }
        
        .db-stat, .api-stat, .file-stat {
            text-align: center;
        }
        
        .stat-number {
            display: block;
            font-size: 2em;
            font-weight: bold;
            color: #007bff;
        }
        
        .stat-label {
            font-size: 14px;
            color: #6c757d;
        }
        
        .tables-grid, .endpoints-grid, .files-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
            gap: 20px;
        }
        
        .table-card, .endpoint-card, .file-card {
            background: white;
            border: 1px solid #dee2e6;
            border-radius: 8px;
            padding: 20px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .table-header, .endpoint-header, .file-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
        }
        
        .table-header h3 {
            margin: 0;
            color: #495057;
        }
        
        .table-type {
            background: #e9ecef;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            color: #6c757d;
        }
        
        .table-description, .endpoint-description, .file-description {
            color: #6c757d;
            margin-bottom: 15px;
        }
        
        .table-columns ul, .file-functions ul {
            list-style: none;
            padding: 0;
            margin: 5px 0;
        }
        
        .table-columns li, .file-functions li {
            background: #f8f9fa;
            padding: 4px 8px;
            margin: 2px 0;
            border-radius: 4px;
            font-size: 12px;
        }
        
        .table-relationships ul {
            list-style: none;
            padding: 0;
            margin: 5px 0;
        }
        
        .table-relationships li {
            background: #e3f2fd;
            padding: 4px 8px;
            margin: 2px 0;
            border-radius: 4px;
            font-size: 12px;
            color: #1976d2;
        }
        
        .http-method {
            padding: 4px 8px;
            border-radius: 4px;
            font-weight: bold;
            font-size: 12px;
        }
        
        .http-method.get { background: #d4edda; color: #155724; }
        .http-method.post { background: #cce5ff; color: #004085; }
        .http-method.put { background: #fff3cd; color: #856404; }
        .http-method.delete { background: #f8d7da; color: #721c24; }
        
        .endpoint-path, .file-path {
            font-family: 'Courier New', monospace;
            background: #f8f9fa;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
        }
        
        .auth-badge {
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: 500;
        }
        
        .auth-required {
            background: #f8d7da;
            color: #721c24;
        }
        
        .auth-public {
            background: #d4edda;
            color: #155724;
        }
        
        .roles-required {
            margin-top: 5px;
            font-size: 12px;
            color: #495057;
        }
        
        .file-type {
            padding: 4px 8px;
            border-radius: 4px;
            font-weight: bold;
            font-size: 12px;
        }
        
        .file-type.kotlin { background: #e1f5fe; color: #0277bd; }
        .file-type.typescript { background: #f3e5f5; color: #7b1fa2; }
        .file-type.css { background: #e8f5e8; color: #2e7d32; }
        .file-type.config { background: #fff3e0; color: #f57c00; }
        
        .architecture-diagram {
            display: flex;
            flex-direction: column;
            gap: 20px;
            margin: 30px 0;
        }
        
        .arch-layer {
            background: white;
            border: 2px solid #dee2e6;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
        }
        
        .arch-layer.frontend { border-color: #28a745; }
        .arch-layer.api { border-color: #007bff; }
        .arch-layer.business { border-color: #ffc107; }
        .arch-layer.data { border-color: #dc3545; }
        
        .arch-layer h3 {
            margin: 0 0 15px 0;
            color: #495057;
        }
        
        .arch-components {
            display: flex;
            justify-content: center;
            gap: 10px;
            flex-wrap: wrap;
        }
        
        .component {
            background: #f8f9fa;
            padding: 8px 12px;
            border-radius: 4px;
            font-size: 14px;
            font-weight: 500;
        }
        
        .architecture-details {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin-top: 30px;
        }
        
        .arch-detail {
            background: white;
            border: 1px solid #dee2e6;
            border-radius: 8px;
            padding: 20px;
        }
        
        .arch-detail h3 {
            margin: 0 0 15px 0;
            color: #495057;
        }
        
        .arch-detail ul {
            list-style: none;
            padding: 0;
        }
        
        .arch-detail li {
            margin: 10px 0;
            padding: 10px;
            background: #f8f9fa;
            border-radius: 4px;
            border-left: 3px solid #007bff;
        }
        
        .arch-detail li strong {
            color: #495057;
        }
        
        @media (max-width: 768px) {
            .tech-info-tabs {
                flex-direction: column;
            }
            
            .overview-grid, .tables-grid, .endpoints-grid, .files-grid {
                grid-template-columns: 1fr;
            }
            
            .tech-info-meta {
                flex-direction: column;
                gap: 10px;
            }
            
            .db-stats, .api-stats, .files-stats {
                flex-direction: column;
                gap: 20px;
            }
            
            .arch-components {
                flex-direction: column;
            }
        }
        
        .error-container {
            text-align: center;
            padding: 60px 20px;
            max-width: 600px;
            margin: 0 auto;
        }
        
        .error-container h2 {
            color: #dc3545;
            margin-bottom: 20px;
            font-size: 2em;
        }
        
        .error-container p {
            color: #6c757d;
            font-size: 16px;
            line-height: 1.6;
            margin-bottom: 10px;
        }
    `;
    document.head.appendChild(style);
}

// Export to make this file a module
export {};