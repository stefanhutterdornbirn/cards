#!/usr/bin/env pwsh

$ErrorActionPreference = "Stop"

Write-Host "Fixing database schema for email verification..." -ForegroundColor Yellow

# Copy SQL file to EC2
Write-Host "Uploading SQL script..."
scp -o StrictHostKeyChecking=no fix-db.sql ubuntu@63.179.44.7:/tmp/fix-db.sql

# Execute SQL on EC2
Write-Host "Executing SQL script..."
$sshResult = ssh -o StrictHostKeyChecking=no ubuntu@63.179.44.7 @"
sudo -u postgres psql -d learningcards -f /tmp/fix-db.sql
"@

Write-Host $sshResult

# Restart the application to pick up the changes
Write-Host "Restarting application..."
ssh -o StrictHostKeyChecking=no ubuntu@63.179.44.7 "sudo systemctl restart learningcards"

# Wait a moment for restart
Start-Sleep -Seconds 5

# Check status
Write-Host "Checking application status..."
$statusResult = ssh -o StrictHostKeyChecking=no ubuntu@63.179.44.7 "sudo systemctl status learningcards --no-pager -l"
Write-Host $statusResult

Write-Host "Database schema fixed!" -ForegroundColor Green