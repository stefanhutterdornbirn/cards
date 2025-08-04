# Card DMS - Dokumentenmanagement-System

Das Card DMS ist ein vollständiges Dokumentenmanagement-System mit revisionssicherer Versionierung und gruppenbasierter Sicherheit.

## Architektur

### Datenmodell

```
RegistraturPlan (1:n) RegistraturPosition (1:n) Dossier (1:n) Document (1:n) DocumentVersion
```

1. **RegistraturPlan**: Oberste Ebene des Ablagesystems
2. **RegistraturPosition**: Registraturpositionen mit eindeutigen Nummern
3. **Dossier**: Ordner-ähnliche Strukturen mit Laufnummern (Format: "Position-Nummer")
4. **Document**: Logische Dokumentenklammer für alle Versionen
5. **DocumentVersion**: Einzelne unveränderliche Dokumentversionen

### Sicherheitsmodell

- **Normale Gruppen**: Alle Gruppenmitglieder haben Vollzugriff auf Dokumente anderer Gruppenmitglieder
- **Gruppe "Single"**: Jeder Benutzer hat nur Zugriff auf seine eigenen Dokumente
- **Registraturplan**: Jede Gruppe hat einen eigenen Registraturplan, Single-Benutzer haben persönliche Registraturpläne

### Integration

Das DMS ist nahtlos in das bestehende System integriert:

- **CAS Integration**: Nutzt das vorhandene Content Addressable Storage für Dateispeicherung
- **Authentifizierung**: Verwendet das bestehende JWT-System
- **Gruppenverwaltung**: Integriert sich in das vorhandene Gruppen-/Rollensystem
- **Produkt "Card DMS"**: Neues Produkt für Zugriffskontrolle

## Verzeichnisstruktur

```
src/main/kotlin/dms/
├── schema/          # Datenbankschemas
├── service/         # Business Logic Services
├── routing/         # API Routing
├── security/        # DMS-spezifische Sicherheit
└── model/          # Data Models

src/main/typescript/dms/     # DMS Frontend
src/main/resources/static/dms/   # DMS Static Assets
```

## API-Endpunkte

### Registraturplan
- `GET /dms/registraturplan` - Laden des Registraturplans
- `POST /dms/registraturposition` - Neue Registraturposition erstellen

### Dossiers
- `POST /dms/dossier` - Neues Dossier erstellen
- `GET /dms/dossier/{id}` - Dossier laden

### Dokumente
- `POST /dms/document` - Neues Dokument erstellen
- `GET /dms/document/{id}` - Dokument laden
- `PUT /dms/document/{id}` - Dokument aktualisieren

### Versionen
- `POST /dms/document/{documentId}/version` - Neue Version erstellen
- `GET /dms/document/{documentId}/versions` - Versionen laden

### Dateien
- `GET /dms/file/{hash}` - Datei herunterladen
- `POST /dms/upload` - Datei hochladen

## Frontend-Features

### Navigation
- **Google Docs-ähnliche Navigation**: Hierarchische Ordnerstruktur
- **Breadcrumb-Navigation**: Pfadanzeige mit Klick-Navigation
- **Drag & Drop**: Dateien per Drag & Drop hochladen

### Benutzeroberfläche
- **Responsive Design**: Optimiert für Desktop und Mobile
- **Kartenansicht**: Übersichtliche Darstellung von Dossiers und Dokumenten
- **Suchfunktion**: Volltext-Suche durch Dokumente
- **Versionsverlauf**: Detaillierte Versionshistorie

### Funktionen
- **Mehrfach-Upload**: Mehrere Dateien gleichzeitig hochladen
- **Vorschau**: Direktvorschau von Dokumenten
- **Kommentare**: Versionsspezifische Kommentare
- **Status-Management**: Dokumentenstatus (Entwurf, Freigegeben, etc.)

## Technische Details

### Revisionssicherheit
- Alle Dokumentversionen sind unveränderlich
- Kryptographische Hashes (SHA256) für Integritätsprüfung
- Vollständige Audit-Trails

### Skalierbarkeit
- Content Addressable Storage für effiziente Dateispeicherung
- Deduplizierung identischer Dateien
- Optimierte Datenbankabfragen

### Sicherheit
- Verschlüsselte Kommunikation
- Rollenbasierte Zugriffskontrolle
- Sichere Dateispeicherung
- Audit-Logging

## Deployment

Das DMS wird automatisch mit dem Hauptprojekt deployt. Die Datenbankinitialisierung erfolgt über:

```kotlin
val dmsService = DMSService()
dmsService.initialize()
```

## Erweiterungen

Das System ist erweiterbar für:
- **Workflow-Management**: Dokumentenfreigabeprozesse
- **Erweiterte Suche**: Volltext-Indexierung
- **Collaboration**: Gemeinsame Bearbeitung
- **Reporting**: Nutzungsstatistiken
- **Integration**: Externe Systeme