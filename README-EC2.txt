# Learning Cards App - EC2 Deployment Guide

## 📋 Übersicht

Diese Anleitung zeigt, wie Sie die Learning Cards App auf AWS EC2 mit Terraform deployen.
Das Setup erstellt automatisch eine hochperformante Umgebung mit lokaler PostgreSQL-Datenbank
und optional SSL-Zertifikaten via Let's Encrypt.

## 🏗️ Infrastruktur

- **EC2 Instance**: t3.medium (2 vCPU, 4 GB RAM)
- **Storage**: 30 GB GP3 SSD (lokal)
- **Datenbank**: PostgreSQL 14 (lokal installiert)
- **Web Server**: Nginx (Reverse Proxy)
- **SSL**: Let's Encrypt (optional)
- **Netzwerk**: VPC mit Public Subnet + Elastic IP

## 📦 Voraussetzungen

### 1. Software installieren (Windows)

```powershell
# Chocolatey installieren (falls nicht vorhanden)
Set-ExecutionPolicy Bypass -Scope Process -Force
[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

# Erforderliche Tools installieren
choco install terraform awscli openjdk17 git -y
```

### 2. AWS konfigurieren

```powershell
aws configure
# AWS Access Key ID: [Ihr Access Key]
# AWS Secret Access Key: [Ihr Secret Key]
# Default region name: eu-central-1
# Default output format: json
```

### 3. Voraussetzungen prüfen

```powershell
cd C:\projects\learningcards
.\deploy-ec2.ps1 -Action check
```

## 🚀 Deployment

### Option 1: Schnellstart (nur HTTP)

```powershell
# Komplettes Deployment mit IP-Zugang
.\deploy-ec2.ps1 -Action full-deploy

# Dauer: ca. 8-12 Minuten
# Ergebnis: http://3.64.128.45 (Beispiel-IP)
```

### Option 2: Mit eigener Domain + SSL (HTTPS)

```powershell
# WICHTIG: Zuerst DNS A-Record setzen!
# Beispiel: lernkarten.m3-works.com → [EC2-IP wird angezeigt]

# Deployment mit SSL
.\deploy-ec2.ps1 -Action full-deploy -Domain "cards.m3-works.com", 
http://cards.m3-works.com/

# Dauer: ca. 10-15 Minuten
# Ergebnis: https://lernkarten.m3-works.com
```

### Schrittweises Deployment

```powershell
# 1. Nur Build
.\deploy-ec2.ps1 -Action build

# 2. Nur Infrastructure
.\deploy-ec2.ps1 -Action infrastructure

# 3. Nur App deployment
.\deploy-ec2.ps1 -Action deploy-app
```

## 📊 Management

### Status prüfen

```powershell
.\deploy-ec2.ps1 -Action status
```

### Logs anschauen

```powershell
.\deploy-ec2.ps1 -Action logs
```

### App-Update (nach Code-Änderungen)

```powershell
# Build und Deploy
.\deploy-ec2.ps1 -Action build
.\deploy-ec2.ps1 -Action deploy-app
```

### SSH-Verbindung

```powershell
# IP aus ec2-info.txt nehmen
ssh -i ~/.ssh/id_rsa ubuntu@[EC2-IP]
```

## 🌐 DNS-Setup für SSL

### Cloudflare/Route53/Andere DNS-Anbieter:

```
Type: A
Name: lernkarten
Value: [EC2-IP aus Terraform-Output]
TTL: 300
```

### DNS testen:

```powershell
nslookup lernkarten.m3-works.com
# Sollte die EC2-IP zurückgeben
```

## 📁 Generierte Dateien

```
learningcards/
├── terraform/
│   ├── terraform.tfvars    # 🔐 Passwörter & Konfiguration
│   ├── tfplan             # Terraform Deployment Plan
│   └── terraform.tfstate  # Infrastructure State (NICHT löschen!)
├── ec2-info.txt           # 📋 Deployment-Informationen
├── build/libs/
│   └── learningcards-all.jar # 📦 Application JAR
└── ~/.ssh/
    ├── id_rsa            # 🔑 SSH Private Key
    └── id_rsa.pub        # 🔑 SSH Public Key
```

## 🔧 Deployment-Phasen

### Phase 1: Build (2-3 Minuten)
- Gradle Build der Kotlin-App
- JAR-Erstellung (learningcards-all.jar)
- TypeScript-Kompilierung

### Phase 2: Infrastructure (3-5 Minuten)
- VPC, Subnet, Security Groups
- EC2 Instance (t3.medium)
- Elastic IP
- System-Setup (Java, PostgreSQL, Nginx)

### Phase 3: App Deployment (2-3 Minuten)
- JAR-Upload zur EC2
- Systemd Service-Setup
- App-Start
- Health-Check

### Phase 4: SSL Setup (1-2 Minuten, nur bei Domain)
- Domain-Validierung
- Let's Encrypt Zertifikat
- Nginx SSL-Konfiguration
- Auto-Renewal Setup

## 💰 Kosten (ca.)

- **EC2 t3.medium**: ~$30/Monat
- **EBS 30GB GP3**: ~$3/Monat
- **Elastic IP**: $0 (wenn genutzt)
- **Datenübertragung**: ~$1-5/Monat

**Gesamt: ~$35/Monat**

## 🔒 Sicherheit

### Automatisch konfiguriert:
- Security Groups (nur HTTP/HTTPS/SSH)
- PostgreSQL (nur lokal erreichbar)
- SSL/TLS (Let's Encrypt)
- Firewall (UFW)

### Passwörter:
- **DB-Passwort**: Automatisch generiert in terraform.tfvars
- **JWT-Secret**: Automatisch generiert in terraform.tfvars
- **SSH-Key**: Automatisch generiert in ~/.ssh/

## ⚠️ UNDEPLOYMENT (Alles löschen)

### ⚠️ WARNUNG: Dies löscht ALLE Daten unwiderruflich!

```powershell
# Alles löschen (Infrastructure + Daten)
.\deploy-ec2.ps1 -Action destroy

# Bestätigung erforderlich (y/N)
```

### Was wird gelöscht:
- ❌ EC2 Instance (inkl. aller Daten)
- ❌ VPC und Netzwerk-Komponenten
- ❌ Elastic IP
- ❌ Security Groups
- ❌ Alle Anwendungsdaten
- ❌ PostgreSQL Datenbank
- ❌ SSL-Zertifikate

### Was bleibt erhalten:
- ✅ Lokale Dateien (JAR, terraform.tfvars, SSH-Keys)
- ✅ Code-Repository
- ✅ DNS-Records (müssen manuell entfernt werden)

### Komplette Bereinigung:

```powershell
# 1. Infrastructure löschen
.\deploy-ec2.ps1 -Action destroy

# 2. Lokale Terraform-Dateien löschen (optional)
Remove-Item terraform\terraform.tfstate* -Force
Remove-Item terraform\tfplan -Force
Remove-Item ec2-info.txt -Force

# 3. SSH-Keys löschen (optional)
Remove-Item ~/.ssh/id_rsa* -Force

# 4. Build-Artefakte löschen (optional)
Remove-Item build\ -Recurse -Force
```

## 🔄 Troubleshooting

### Problem: "terraform not found"
```powershell
refreshenv  # PowerShell neustarten
Get-Command terraform  # Prüfen
```

### Problem: "AWS credentials not configured"
```powershell
aws configure list
aws configure  # Erneut konfigurieren
```

### Problem: SSL-Setup failed
```powershell
# 1. DNS prüfen
nslookup lernkarten.m3-works.com

# 2. Manuell SSL einrichten
ssh -i ~/.ssh/id_rsa ubuntu@[EC2-IP]
sudo certbot --nginx -d lernkarten.m3-works.com --email contact@m3-works.com --agree-tos --non-interactive
```

### Problem: App startet nicht
```powershell
# Logs prüfen
.\deploy-ec2.ps1 -Action logs

# Oder SSH und direkt prüfen
ssh -i ~/.ssh/id_rsa ubuntu@[EC2-IP]
sudo systemctl status learningcards
sudo journalctl -u learningcards -f
```

### Problem: "Permission denied" bei SSH
```powershell
# SSH-Key Permissions korrigieren (Git Bash)
chmod 600 ~/.ssh/id_rsa
```

## 📞 Support

### Hilfe anzeigen:
```powershell
.\deploy-ec2.ps1 -Action help
```

### Verfügbare Kommandos:
- `check` - Voraussetzungen prüfen
- `build` - App builden
- `infrastructure` - Nur Infrastructure deployen
- `deploy-app` - Nur App deployen
- `full-deploy` - Komplettes Deployment
- `status` - System-Status anzeigen
- `logs` - App-Logs anzeigen
- `destroy` - Alles löschen
- `help` - Hilfe anzeigen

### Nützliche SSH-Kommandos auf EC2:
```bash
# Service-Status
sudo systemctl status learningcards nginx postgresql

# Logs
sudo journalctl -u learningcards -f

# App neu starten
sudo systemctl restart learningcards

# Disk-Space prüfen
df -h

# Memory prüfen
free -h
```

## 📈 Nach dem Deployment

### Zugriff auf die App:
- **HTTP**: http://[EC2-IP]
- **HTTPS**: https://[Domain] (falls SSL konfiguriert)
- **Direct**: http://[EC2-IP]:5000 (Bypass Nginx)

### Standard-Login (falls konfiguriert):
- Username: admin
- Password: [siehe App-Konfiguration]

### Erste Schritte:
1. App-URL im Browser öffnen
2. Account erstellen oder einloggen
3. Erste Lernkarten erstellen
4. Demo-Modus testen

---

🎉 **Deployment erfolgreich!**

Ihre Learning Cards App läuft jetzt auf AWS EC2 mit:
- ⚡ Ultra-schneller lokaler PostgreSQL-Datenbank
- 🔒 SSL-Verschlüsselung (falls Domain konfiguriert)
- 🚀 Professioneller Nginx Reverse Proxy
- 📊 Systemd Service Management
- 🔄 Automatische SSL-Erneuerung

**Viel Erfolg mit Ihrer Learning Cards Anwendung!**