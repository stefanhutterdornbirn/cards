@echo off
REM Learning Cards EC2 Login Script
REM This script connects to the EC2 instance via SSH

echo Connecting to Learning Cards EC2 instance...
echo.

REM Check if SSH key exists
if not exist "%USERPROFILE%\.ssh\id_rsa" (
    echo ERROR: SSH key not found at %USERPROFILE%\.ssh\id_rsa
    echo Please ensure the SSH key is in the correct location.
    pause
    exit /b 1
)

REM Read EC2 IP from ec2-info.txt if it exists
set EC2_IP=
if exist "ec2-info.txt" (
    for /f "tokens=3" %%i in ('findstr "Public IP:" ec2-info.txt') do set EC2_IP=%%i
)

REM If IP not found in file, use default or prompt user
if "%EC2_IP%"=="" (
    set EC2_IP=3.124.169.248
    echo Warning: Using default IP address. Update this script with your actual EC2 IP.
    echo.
)

echo Connecting to: ubuntu@%EC2_IP%
echo Using SSH key: %USERPROFILE%\.ssh\id_rsa
echo.

REM Connect via SSH
ssh -i "%USERPROFILE%\.ssh\id_rsa" ubuntu@%EC2_IP%

REM If SSH fails, show error message
if %ERRORLEVEL% neq 0 (
    echo.
    echo SSH connection failed. Please check:
    echo 1. EC2 instance is running
    echo 2. SSH key permissions are correct
    echo 3. Security group allows SSH access from your IP
    echo 4. EC2 IP address is correct: %EC2_IP%
    echo.
    pause
)