@echo off
REM Learning Cards EC2 Logs Viewer
REM This script shows logs from the EC2 instance

echo Learning Cards - Log Viewer
echo ============================
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
echo.

REM Show menu
echo Select log view option:
echo 1) Live logs (follow new entries)
echo 2) Last 50 lines
echo 3) Last 100 lines  
echo 4) Today's logs
echo 5) All application logs
echo 6) System status
echo.
set /p choice="Enter choice (1-6): "

echo.
echo Connecting to EC2 instance...
echo.

REM Execute based on choice
if "%choice%"=="1" (
    echo Starting live log view... Press Ctrl+C to exit
    ssh -i "%USERPROFILE%\.ssh\id_rsa" ubuntu@%EC2_IP% "sudo journalctl -u learningcards -f"
) else if "%choice%"=="2" (
    ssh -i "%USERPROFILE%\.ssh\id_rsa" ubuntu@%EC2_IP% "sudo journalctl -u learningcards -n 50"
) else if "%choice%"=="3" (
    ssh -i "%USERPROFILE%\.ssh\id_rsa" ubuntu@%EC2_IP% "sudo journalctl -u learningcards -n 100"
) else if "%choice%"=="4" (
    ssh -i "%USERPROFILE%\.ssh\id_rsa" ubuntu@%EC2_IP% "sudo journalctl -u learningcards --since today"
) else if "%choice%"=="5" (
    ssh -i "%USERPROFILE%\.ssh\id_rsa" ubuntu@%EC2_IP% "sudo journalctl -u learningcards --no-pager"
) else if "%choice%"=="6" (
    ssh -i "%USERPROFILE%\.ssh\id_rsa" ubuntu@%EC2_IP% "echo '=== Service Status ===' && sudo systemctl status learningcards --no-pager && echo && echo '=== Last 20 Log Lines ===' && sudo journalctl -u learningcards -n 20"
) else (
    echo Invalid choice. Showing last 50 lines...
    ssh -i "%USERPROFILE%\.ssh\id_rsa" ubuntu@%EC2_IP% "sudo journalctl -u learningcards -n 50"
)

echo.
pause