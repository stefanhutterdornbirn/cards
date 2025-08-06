# Learning Cards App - EC2 Deployment Script (Windows PowerShell)
param(
    [string]$Action = "help",
    [string]$Domain = "cards.m3-works.com",
    [string]$Email = "stefan.hutter@m3-works.com"
)

# Configuration
$ProjectDir = Get-Location
$TerraformDir = Join-Path $ProjectDir "terraform"
$BuildDir = Join-Path $ProjectDir "build"

# Colors for output (PowerShell compatible)
function Write-Info($message) {
    Write-Host "INFO: $message" -ForegroundColor Blue
}

function Write-Success($message) {
    Write-Host "SUCCESS: $message" -ForegroundColor Green
}

function Write-Warning($message) {
    Write-Host "WARNING: $message" -ForegroundColor Yellow
}

function Write-Error($message) {
    Write-Host "ERROR: $message" -ForegroundColor Red
}

function Check-Requirements {
    Write-Info "Checking requirements..."
    
    $missingTools = @()
    
    # Check Terraform
    try { 
        $null = Get-Command terraform -ErrorAction Stop 
    } catch { 
        $missingTools += "terraform" 
    }
    
    # Check AWS CLI
    try { 
        $null = Get-Command aws -ErrorAction Stop 
    } catch { 
        $missingTools += "aws-cli" 
    }
    
    # Check Java
    try { 
        $null = Get-Command java -ErrorAction Stop 
    } catch { 
        $missingTools += "java" 
    }
    
    # Check Gradle
    $gradleExists = (Test-Path ".\gradlew.bat") -or (Get-Command gradle -ErrorAction SilentlyContinue)
    if (-not $gradleExists) {
        $missingTools += "gradle"
    }
    
    # Check SSH (for deployment)
    try { 
        $null = Get-Command ssh -ErrorAction Stop 
    } catch { 
        $missingTools += "ssh (install Git for Windows or OpenSSH)" 
    }
    
    if ($missingTools.Count -gt 0) {
        Write-Error "Missing required tools: $($missingTools -join ', ')"
        Write-Info "Install with chocolatey:"
        Write-Info "  choco install terraform awscli openjdk17 git"
        exit 1
    }
    
    Write-Success "All required tools are installed"
}

function Build-Application {
    Write-Info "Building Learning Cards application..."
    
    # Clean and build
    if (Test-Path ".\gradlew.bat") {
        .\gradlew.bat clean buildFatJar
    } else {
        gradle clean buildFatJar
    }
    
    # Check if JAR was created
    $jarPath = "build\libs\learningcards-all.jar"
    if (-not (Test-Path $jarPath)) {
        Write-Error "Build failed - JAR file not found at $jarPath"
        exit 1
    }
    
    Write-Success "Application built successfully"
}

function Create-TerraformVars {
    $tfvarsFile = Join-Path $TerraformDir "terraform.tfvars"
    Write-Info "Using existing terraform.tfvars"
	return
    if (-not (Test-Path $tfvarsFile)) {
	    Write-Info "Creating terraform.tfvars file..."
        
        # Generate random passwords using .NET
        $dbPassword = [System.Web.Security.Membership]::GeneratePassword(25, 5)
        $jwtSecret = [System.Web.Security.Membership]::GeneratePassword(40, 8)
        
        # Ask for domain and email if not provided
        if (-not $Domain) {
            $Domain = Read-Host "Enter domain name (optional, press Enter to skip)"
        }
        
        if ($Domain -and -not $Email) {
            $Email = Read-Host "Enter email address for Let's Encrypt SSL (default: contact@m3-works.com)"
            if (-not $Email) {
                $Email = "contact@m3-works.com"
            }
        }
        
        # Check SSH key
        $sshKeyPath = "$env:USERPROFILE\.ssh\id_rsa.pub"
        if (-not (Test-Path $sshKeyPath)) {
            Write-Warning "SSH public key not found at $sshKeyPath"
            Write-Info "Generating SSH key pair..."
            
            # Generate SSH key
            $sshDir = "$env:USERPROFILE\.ssh"
            if (-not (Test-Path $sshDir)) {
                New-Item -ItemType Directory -Path $sshDir -Force
            }
            
            ssh-keygen -t rsa -b 4096 -f "$env:USERPROFILE\.ssh\id_rsa" -N '""'
            
            if (Test-Path $sshKeyPath) {
                Write-Success "SSH key pair generated"
            } else {
                Write-Error "Failed to generate SSH key"
                exit 1
            }
        }
        
        # Create terraform.tfvars
        $tfvarsContent = @"
# Learning Cards App - Terraform Variables
# Generated on $(Get-Date)

aws_region = "eu-central-1"
environment = "demo"
instance_type = "t3.medium"
root_volume_size = 30

# Security (generated randomly - change if needed)
db_password = "$dbPassword"
jwt_secret = "$jwtSecret"

# SSH Key
public_key_path = "$($sshKeyPath -replace '\\', '/')"

# Network access (restrict as needed)
allowed_cidr_blocks = ["0.0.0.0/0"]

# SSL Configuration
domain_name = "$Domain"
email_address = "$Email"
enable_ssl = $(if ($Domain -ne "" -and $Email -ne "") { "true" } else { "false" })
"@
        
        $tfvarsContent | Out-File -FilePath $tfvarsFile -Encoding UTF8
        
        Write-Success "Created terraform.tfvars with generated passwords"
        if ($Domain) {
            Write-Info "Domain: $Domain"
            Write-Warning "Make sure DNS A-record points to the EC2 IP before running!"
        }
        Write-Warning "Please review $tfvarsFile and adjust settings as needed"
    } else {
        Write-Info "Using existing terraform.tfvars"
    }
}

function Deploy-Infrastructure {
    Write-Info "Deploying infrastructure with Terraform..."
    
    Push-Location $TerraformDir
    
    try {
        # Initialize Terraform
        terraform init
        
        # Plan deployment
        Write-Info "Planning Terraform deployment..."
        terraform plan -out=tfplan
        
        # Ask for confirmation
        Write-Warning "Review the plan above. Do you want to proceed with deployment? (y/N)"
        $response = Read-Host
        if ($response -notmatch '^[Yy]$') {
            Write-Info "Deployment cancelled"
            return
        }
        
        # Apply deployment
        terraform apply tfplan
        
        # Get outputs
        $publicIp = terraform output -raw public_ip
        $sshCommand = terraform output -raw ssh_command
        $appUrl = terraform output -raw application_url
        $sslStatus = terraform output -raw ssl_status
        
        Write-Success "Infrastructure deployed successfully!"
        Write-Info "Public IP: $publicIp"
        Write-Info "SSH Command: $sshCommand"
        Write-Info "Application URL: $appUrl"
        Write-Info "SSL Status: $sslStatus"
        
        # Save outputs to file
        $infoContent = @"
Learning Cards App - EC2 Deployment Info
Generated on: $(Get-Date)

Public IP: $publicIp
SSH Command: $sshCommand
Application URL: $appUrl
SSL Status: $sslStatus

To connect: $sshCommand
To deploy app: .\deploy-ec2.ps1 deploy-app
"@
        
        $infoFile = Join-Path $ProjectDir "ec2-info.txt"
        $infoContent | Out-File -FilePath $infoFile -Encoding UTF8
        
        Write-Success "Deployment info saved to ec2-info.txt"
    }
    finally {
        Pop-Location
    }
}

function Deploy-Application {
    Write-Info "Deploying application to EC2..."
    
    # Check if infrastructure info exists
    $infoFile = Join-Path $ProjectDir "ec2-info.txt"
    if (-not (Test-Path $infoFile)) {
        Write-Error "EC2 info not found. Please run infrastructure deployment first."
        exit 1
    }
    
    # Extract public IP from info file
    $infoContent = Get-Content $infoFile
    $ipLine = $infoContent | Where-Object { $_ -match "Public IP: (.+)" }
    if ($ipLine -match "Public IP: (.+)") {
        $publicIp = $matches[1].Trim()
    } else {
        Write-Error "Could not determine EC2 public IP from info file"
        exit 1
    }
    
    Write-Info "Deploying to EC2 instance: $publicIp"
    
    # Check if JAR exists
    $jarPath = "build\libs\learningcards-all.jar"
    if (-not (Test-Path $jarPath)) {
        Write-Error "Application JAR not found at $jarPath. Please build first."
        exit 1
    }
    
    # Wait for instance to be ready
    Write-Info "Waiting for EC2 instance to be ready..."
    $retries = 0
    $maxRetries = 30
    
    while ($retries -lt $maxRetries) {
        try {
            $result = ssh -o ConnectTimeout=5 -o BatchMode=yes -i "$env:USERPROFILE\.ssh\id_rsa" "ubuntu@$publicIp" "echo 'Ready'" 2>$null
            if ($result -eq "Ready") {
                break
            }
        } catch {
            # Continue trying
        }
        
        Write-Info "Instance not ready yet, waiting... (attempt $($retries + 1)/$maxRetries)"
        Start-Sleep 10
        $retries++
    }
    
    if ($retries -eq $maxRetries) {
        Write-Error "Instance not reachable after $maxRetries attempts"
        exit 1
    }
    
    Write-Success "EC2 instance is ready"
    
    # Copy application files
    Write-Info "Copying application files..."
    scp -i "$env:USERPROFILE\.ssh\id_rsa" "$jarPath" "ubuntu@${publicIp}:/tmp/"
    
    
    # Deploy on EC2
    Write-Info "Running deployment on EC2..."
    $deployScript = @"
sudo /opt/learningcards/deploy.sh
"@
    
    ssh -i "$env:USERPROFILE\.ssh\id_rsa" "ubuntu@$publicIp" $deployScript
    
    Write-Success "Application deployed successfully!"
    
    # Show final URLs
    Push-Location $TerraformDir
    try {
        $appUrl = terraform output -raw application_url
        $directUrl = terraform output -raw direct_app_url
        
        Write-Info "Application URL: $appUrl"
        Write-Info "Direct App URL: $directUrl"
    }
    finally {
        Pop-Location
    }
}

function Show-Status {
    $infoFile = Join-Path $ProjectDir "ec2-info.txt"
    if (-not (Test-Path $infoFile)) {
        Write-Error "EC2 info not found. Please run infrastructure deployment first."
        exit 1
    }
    
    # Extract public IP
    $infoContent = Get-Content $infoFile
    $ipLine = $infoContent | Where-Object { $_ -match "Public IP: (.+)" }
    if ($ipLine -match "Public IP: (.+)") {
        $publicIp = $matches[1].Trim()
    } else {
        Write-Error "Could not determine EC2 public IP"
        exit 1
    }
    
    Write-Info "Checking status on $publicIp..."
    $statusScript = @"
echo '=== System Status ===' && uptime && echo && echo '=== Application Service Status ===' && sudo systemctl status learningcards --no-pager && echo && echo '=== Nginx Status ===' && sudo systemctl status nginx --no-pager && echo && echo '=== SSL Certificate Status ===' && if [ -d '/etc/letsencrypt/live' ]; then sudo certbot certificates; else echo 'No SSL certificates found'; fi && echo && echo '=== Disk Usage ===' && df -h && echo && echo '=== Memory Usage ===' && free -h
"@
    
    ssh -i "$env:USERPROFILE\.ssh\id_rsa" "ubuntu@$publicIp" $statusScript
}

function Show-Logs {
    $infoFile = Join-Path $ProjectDir "ec2-info.txt"
    if (-not (Test-Path $infoFile)) {
        Write-Error "EC2 info not found. Please run infrastructure deployment first."
        exit 1
    }
    
    # Extract public IP
    $infoContent = Get-Content $infoFile
    $ipLine = $infoContent | Where-Object { $_ -match "Public IP: (.+)" }
    if ($ipLine -match "Public IP: (.+)") {
        $publicIp = $matches[1].Trim()
    } else {
        Write-Error "Could not determine EC2 public IP"
        exit 1
    }
    
    Write-Info "Showing application logs from $publicIp..."
    ssh -i "$env:USERPROFILE\.ssh\id_rsa" "ubuntu@$publicIp" "sudo journalctl -u learningcards -f"
}

function Destroy-Infrastructure {
    Write-Warning "This will destroy all infrastructure including the EC2 instance and data!"
    Write-Warning "Are you sure you want to proceed? (y/N)"
    $response = Read-Host
    if ($response -notmatch '^[Yy]$') {
        Write-Info "Destruction cancelled"
        return
    }
    
    Push-Location $TerraformDir
    try {
        terraform destroy
        
        # Remove info file
        $infoFile = Join-Path $ProjectDir "ec2-info.txt"
        if (Test-Path $infoFile) {
            Remove-Item $infoFile
        }
        
        Write-Success "Infrastructure destroyed"
    }
    finally {
        Pop-Location
    }
}

# Add System.Web assembly for password generation
Add-Type -AssemblyName System.Web

# Main script logic
switch ($Action.ToLower()) {
    "check" {
        Check-Requirements
    }
    "build" {
        Check-Requirements
        Build-Application
    }
    "infrastructure" {
        Check-Requirements
        Create-TerraformVars
        Deploy-Infrastructure
    }
    "deploy-app" {
        Deploy-Application
    }
    "full-deploy" {
        Check-Requirements
        Build-Application
        Create-TerraformVars
        Deploy-Infrastructure
        Write-Info "Waiting 60 seconds for instance initialization..."
        Start-Sleep 60
        Deploy-Application
    }
    "destroy" {
        Destroy-Infrastructure
    }
    "logs" {
        Show-Logs
    }
    "status" {
        Show-Status
    }
    "help" {
        Write-Host "Learning Cards App - EC2 Deployment Script (Windows PowerShell)" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "Usage: .\deploy-ec2.ps1 -Action <command> [-Domain <domain>] [-Email <email>]"
        Write-Host ""
        Write-Host "Commands:"
        Write-Host "  check         - Check if all required tools are installed"
        Write-Host "  build         - Build the application JAR"
        Write-Host "  infrastructure - Deploy only the infrastructure (EC2, VPC, etc.)"
        Write-Host "  deploy-app    - Deploy only the application to existing EC2"
        Write-Host "  full-deploy   - Build app and deploy everything (infrastructure + app)"
        Write-Host "  destroy       - Destroy all infrastructure"
        Write-Host "  logs          - Show application logs"
        Write-Host "  status        - Show system and application status"
        Write-Host "  help          - Show this help message"
        Write-Host ""
        Write-Host "SSL Examples:"
        Write-Host "  .\deploy-ec2.ps1 -Action full-deploy -Domain lernkarten.m3-works.com -Email contact@m3-works.com"
        Write-Host "  .\deploy-ec2.ps1 -Action infrastructure"
        Write-Host ""
        Write-Host "Prerequisites:"
        Write-Host "  - AWS CLI configured (aws configure)"
        Write-Host "  - Terraform installed"
        Write-Host "  - Java 17+ installed"
        Write-Host "  - SSH client (Git for Windows or OpenSSH)"
        Write-Host "  - If using domain: DNS A-record pointing to EC2 IP"
    }
    default {
        Write-Error "Unknown action: $Action"
        Write-Info "Use .\deploy-ec2.ps1 -Action help to see available commands"
        exit 1
    }
}