# AWS Credentials Konfigurationsanleitung

## 🔐 AWS Access Keys Konfiguration

### **1. Umgebungsvariablen (Production - Empfohlen)**

```bash
# Standard AWS Environment Variables
export AWS_ACCESS_KEY_ID="AKIA..."
export AWS_SECRET_ACCESS_KEY="your-secret-key"
export AWS_DEFAULT_REGION="eu-central-1"

# Optional: Session Token für temporäre Credentials
export AWS_SESSION_TOKEN="temporary-token"
```

### **2. AWS Credentials File**

```bash
# ~/.aws/credentials
[default]
aws_access_key_id = AKIA...
aws_secret_access_key = your-secret-key

[production]
aws_access_key_id = AKIA...
aws_secret_access_key = prod-secret-key

# ~/.aws/config
[default]
region = eu-central-1
output = json

[profile production]
region = eu-central-1
```

### **3. IAM Roles (EC2/ECS/EKS - Sehr empfohlen)**

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::your-bucket-name",
        "arn:aws:s3:::your-bucket-name/*"
      ]
    }
  ]
}
```

### **4. Application.yaml Konfiguration**

```yaml
fileStorage:
  type: s3
  s3:
    bucketName: your-app-data-bucket
    region: eu-central-1
    # Credentials (nur für Development - use ENV vars in production!)
    accessKeyId: ${AWS_ACCESS_KEY_ID:-""}
    secretAccessKey: ${AWS_SECRET_ACCESS_KEY:-""}
    sessionToken: ${AWS_SESSION_TOKEN:-""}
```

### **5. Docker Environment**

```bash
# docker-compose.yml
version: '3.8'
services:
  app:
    image: learningcards:latest
    environment:
      - AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID}
      - AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY}
      - AWS_DEFAULT_REGION=eu-central-1
    volumes:
      - ~/.aws:/root/.aws:ro  # Optional: Mount AWS credentials
```

### **6. Kubernetes Secrets**

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: aws-credentials
type: Opaque
data:
  access-key-id: <base64-encoded-access-key>
  secret-access-key: <base64-encoded-secret-key>
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: learningcards
spec:
  template:
    spec:
      containers:
      - name: app
        env:
        - name: AWS_ACCESS_KEY_ID
          valueFrom:
            secretKeyRef:
              name: aws-credentials
              key: access-key-id
        - name: AWS_SECRET_ACCESS_KEY
          valueFrom:
            secretKeyRef:
              name: aws-credentials
              key: secret-access-key
```

## 🔄 AWS Credentials Priorität (Default Chain)

Die AWS SDK sucht in dieser Reihenfolge:

1. **Umgebungsvariablen**: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`
2. **Java System Properties**: `aws.accessKeyId`, `aws.secretKey`
3. **Credentials File**: `~/.aws/credentials`
4. **IAM Instance Profile** (EC2)
5. **IAM Task Role** (ECS)
6. **IAM Pod Role** (EKS)

## ⚡ Quick Setup Beispiele

### **Development (lokal)**
```bash
# Option 1: Environment Variables
export AWS_ACCESS_KEY_ID="AKIA..."
export AWS_SECRET_ACCESS_KEY="..."
./gradlew run

# Option 2: AWS CLI konfigurieren
aws configure
./gradlew run
```

### **Production (Docker)**
```bash
# Mit Environment Variables
docker run -e AWS_ACCESS_KEY_ID="..." -e AWS_SECRET_ACCESS_KEY="..." learningcards

# Mit IAM Role (empfohlen)
docker run learningcards  # Credentials automatisch von IAM Role
```

### **Cloud Deployment**
```bash
# AWS EC2 mit IAM Instance Profile
# Keine expliziten Credentials nötig!

# AWS ECS mit Task Role
# Keine expliziten Credentials nötig!

# AWS EKS mit Service Account
# Keine expliziten Credentials nötig!
```

## 🛡️ Sicherheits-Best Practices

### ✅ **DO (Empfohlen)**
- **IAM Roles** für Cloud-Deployments verwenden
- **Umgebungsvariablen** für Container
- **Least Privilege** - nur benötigte S3-Permissions
- **Credential Rotation** regelmäßig durchführen
- **AWS CLI Profile** für lokale Entwicklung

### ❌ **DON'T (Vermeiden)**
- Credentials in Code committen
- Credentials in application.yaml hardcoden
- Overly broad permissions (s3:*)
- Long-lived Access Keys ohne Rotation
- Credentials in Logs ausgeben

## 🧪 Test der Konfiguration

```bash
# Test AWS Credentials
aws sts get-caller-identity

# Test S3 Access
aws s3 ls s3://your-bucket-name

# Test mit der App
curl -X POST http://localhost:8080/api/storage/migration/local-to-s3 \
  -H "Content-Type: application/json" \
  -d '{
    "localBasePath": "/tmp/test",
    "s3BucketName": "your-bucket",
    "s3Region": "eu-central-1"
  }'
```