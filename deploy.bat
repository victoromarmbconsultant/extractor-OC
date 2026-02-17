@echo off
REM Script de despliegue para OCsigma en Google Cloud Run (Windows)
REM Este script automatiza el proceso de build y deploy

setlocal enabledelayedexpansion

REM Variables de configuración
set PROJECT_ID=extractor-ocr
set SERVICE_NAME=ocsigma
set REGION=us-central1
set IMAGE_NAME=gcr.io/%PROJECT_ID%/%SERVICE_NAME%

echo ======================================
echo 🚀 Desplegando OCsigma a Cloud Run
echo ======================================
echo.

REM Verificar que gcloud esté instalado
where gcloud >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Error: gcloud CLI no está instalado
    echo Instálalo desde: https://cloud.google.com/sdk/docs/install
    exit /b 1
)

REM Configurar proyecto
echo ⚙️  Configurando proyecto: %PROJECT_ID%
gcloud config set project %PROJECT_ID%

echo 📦 Proyecto: %PROJECT_ID%
echo 🌍 Región: %REGION%
echo 🎯 Servicio: %SERVICE_NAME%
echo.

REM Preguntar método de deploy
echo Opción 1: Deploy con Cloud Build (recomendado)
echo Este método construye la imagen en la nube (gratis hasta 120 min/día)
echo.
set /p USE_CLOUD_BUILD="¿Usar Cloud Build? (s/n): "

if /i "%USE_CLOUD_BUILD%"=="s" (
    echo 🏗️  Iniciando Cloud Build...
    gcloud builds submit --config cloudbuild.yaml
    
    if %ERRORLEVEL% EQU 0 (
        echo ✅ Deploy completado con Cloud Build
    ) else (
        echo ❌ Error en el deploy
        exit /b 1
    )
) else (
    REM Build local
    echo 🏗️  Construyendo imagen Docker localmente...
    docker build -t %IMAGE_NAME%:latest .
    
    if %ERRORLEVEL% NEQ 0 (
        echo ❌ Error construyendo imagen
        exit /b 1
    )
    
    echo 📤 Subiendo imagen a Container Registry...
    docker push %IMAGE_NAME%:latest
    
    if %ERRORLEVEL% NEQ 0 (
        echo ❌ Error subiendo imagen
        exit /b 1
    )
    
    echo 🚀 Desplegando a Cloud Run...
    gcloud run deploy %SERVICE_NAME% ^
        --image=%IMAGE_NAME%:latest ^
        --platform=managed ^
        --region=%REGION% ^
        --allow-unauthenticated ^
        --memory=512Mi ^
        --cpu=1 ^
        --timeout=300s ^
        --max-instances=3 ^
        --set-env-vars=NODE_ENV=production,GCS_BUCKET_OCS=extractor-ocr-ocs,GCS_BUCKET_PROCESSED=extractor-ocr-procesadas,GCS_BUCKET_RESULTS=extractor-ocr-results,GOOGLE_CLOUD_PROJECT=%PROJECT_ID%
    
    if %ERRORLEVEL% EQU 0 (
        echo ✅ Deploy completado
    ) else (
        echo ❌ Error en el deploy
        exit /b 1
    )
)

echo.
echo ======================================
echo ✨ Obteniendo URL del servicio...
echo ======================================

REM Obtener URL del servicio
for /f "delims=" %%i in ('gcloud run services describe %SERVICE_NAME% --region=%REGION% --format="value(status.url)"') do set SERVICE_URL=%%i

echo.
echo 🎉 ¡Despliegue exitoso!
echo.
echo 📍 URL de tu aplicación:
echo %SERVICE_URL%
echo.
echo 📊 Ver logs:
echo gcloud run services logs read %SERVICE_NAME% --region=%REGION% --follow
echo.
echo 📈 Ver métricas:
echo https://console.cloud.google.com/run/detail/%REGION%/%SERVICE_NAME%/metrics?project=%PROJECT_ID%
echo.
echo ======================================

pause
