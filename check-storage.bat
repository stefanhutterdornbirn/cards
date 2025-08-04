@echo off
REM Check storage on EC2 instance
REM This script checks for uploaded files and storage configuration

echo Learning Cards - Storage Check
echo ===============================
echo.

REM Read EC2 IP from ec2-info.txt if it exists
set EC2_IP=
if exist "ec2-info.txt" (
    for /f "tokens=3" %%i in ('findstr "Public IP:" ec2-info.txt') do set EC2_IP=%%i
)

REM If IP not found in file, use default
if "%EC2_IP%"=="" (
    set EC2_IP=3.124.169.248
    echo Warning: Using default IP address.
    echo.
)

echo Connecting to: ubuntu@%EC2_IP%
echo Checking storage locations...
echo.

ssh -i "%USERPROFILE%\.ssh\id_rsa" ubuntu@%EC2_IP% "
echo '=== Storage Directory Check ==='
echo 'Checking /opt/learningcards/storage:'
if [ -d '/opt/learningcards/storage' ]; then
    echo 'Directory exists'
    ls -la /opt/learningcards/storage/ 2>/dev/null || echo 'Directory is empty or no access'
    echo
    echo 'Finding all files in storage:'
    find /opt/learningcards/storage/ -type f 2>/dev/null | head -20 || echo 'No files found'
    echo
    echo 'Storage size:'
    du -sh /opt/learningcards/storage/ 2>/dev/null || echo 'Cannot get size'
else
    echo 'Directory does not exist!'
fi

echo
echo '=== Alternative Locations Check ==='
echo 'Checking /tmp/my-app-files (fallback):'
if [ -d '/tmp/my-app-files' ]; then
    echo 'Directory exists'
    find /tmp/my-app-files/ -type f 2>/dev/null | head -10 || echo 'No files found'
else
    echo 'Directory does not exist'
fi

echo
echo 'Checking /opt/learningcards/content-store:'
if [ -d '/opt/learningcards/content-store' ]; then
    echo 'Directory exists'
    find /opt/learningcards/content-store/ -type f 2>/dev/null | head -10 || echo 'No files found'
else
    echo 'Directory does not exist'
fi

echo
echo '=== Application Configuration Check ==='
echo 'Active configuration file:'
if [ -f '/opt/learningcards/application-ec2.yaml' ]; then
    echo 'Found application-ec2.yaml'
    grep -A 5 'fileStorage:' /opt/learningcards/application-ec2.yaml || echo 'No fileStorage config found'
else
    echo 'application-ec2.yaml not found'
fi

echo
echo '=== Directory Permissions ==='
ls -la /opt/learningcards/ | grep -E '(storage|logs)'

echo
echo '=== Recent App Activity ==='
echo 'Last 10 lines from app logs:'
sudo journalctl -u learningcards -n 10 --no-pager
"

echo.
pause