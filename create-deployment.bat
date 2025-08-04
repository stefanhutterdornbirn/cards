@echo off
echo Creating simple deployment.zip for initial deployment...

echo Building application...
call npm run build
call gradlew clean build

echo Creating deployment package...
if exist "deployment.zip" del "deployment.zip"
copy "build\libs\*.jar" "application.jar"

echo Creating ZIP with application.jar only...
powershell -Command "Compress-Archive -Path 'application.jar' -DestinationPath 'deployment.zip' -Force"

echo Deployment package created: deployment.zip
dir deployment.zip