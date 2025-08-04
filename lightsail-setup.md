# AWS Lightsail Setup ($3.50/month)

## 1. Create Lightsail Instance
```bash
aws lightsail create-instances \
    --instance-names learning-cards-demo \
    --availability-zone eu-central-1a \
    --blueprint-id ubuntu_20_04 \
    --bundle-id nano_2_0
```

## 2. Setup Script
```bash
#!/bin/bash
# User data script for Lightsail

# Install Java 21
sudo apt update
sudo apt install -y openjdk-21-jdk-headless

# Install PostgreSQL client
sudo apt install -y postgresql-client

# Create app directory
sudo mkdir -p /opt/learning-cards
sudo chown ubuntu:ubuntu /opt/learning-cards

# Create systemd service
sudo tee /etc/systemd/system/learning-cards.service > /dev/null <<EOF
[Unit]
Description=Learning Cards Application
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/opt/learning-cards
ExecStart=/usr/bin/java -jar /opt/learning-cards/app.jar
Restart=always
RestartSec=10

Environment=DB_HOST=your-rds-endpoint
Environment=DB_USER=postgres
Environment=DB_PASSWORD=your-password
Environment=DB_NAME=learningcards
Environment=S3_BUCKET_NAME=m3-cas1
Environment=AWS_REGION=eu-central-1

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl enable learning-cards
```

## 3. Deploy JAR
```bash
# Copy JAR to instance
scp -i ~/.ssh/LightsailDefaultKey-eu-central-1.pem \
    build/libs/*-all.jar \
    ubuntu@YOUR_LIGHTSAIL_IP:/opt/learning-cards/app.jar

# Start service
ssh -i ~/.ssh/LightsailDefaultKey-eu-central-1.pem ubuntu@YOUR_LIGHTSAIL_IP \
    "sudo systemctl start learning-cards"
```

## 4. Lightsail Database
- **Managed PostgreSQL**: $15/month (cheapest)
- **Or use**: Free RDS in same region