@echo off
REM Script de configuración inicial de Google Cloud para OCsigma (Windows)
REM Este script habilita APIs y crea los buckets necesarios

setlocal enabledelayedexpansion

REM Variables de configuración
set PROJECT_ID=extractor-ocr
set REGION=us-central1
set BUCKET_OCS=extractor-ocr-ocs
set BUCKET_PROCESSED=extractor-ocr-procesadas
set BUCKET_RESULTS=extractor-ocr-results

echo ======================================
echo 🔧 Configuración inicial de Google Cloud
echo ======================================
echo.

REM Verificar que gcloud esté instalado
where gcloud >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Error: gcloud CLI no está instalado
    echo Instálalo desde: https://cloud.google.com/sdk/docs/install
    pause
    exit /b 1
)

echo 📦 Proyecto: %PROJECT_ID%
echo 🌍 Región: %REGION%
echo.

REM Configurar proyecto
echo ⚙️  Configurando proyecto...
gcloud config set project %PROJECT_ID%

REM Login si es necesario
echo.
echo 🔐 Verificando autenticación...
gcloud auth list --filter=status:ACTIVE --format="value(account)" | findstr "@" >nul
if %ERRORLEVEL% NEQ 0 (
    echo Necesitas autenticarte con Google Cloud
    gcloud auth login
)

echo.
echo ======================================
echo 📡 Habilitando APIs necesarias...
echo ======================================
echo.

REM Habilitar APIs necesarias
echo Habilitando Cloud Run API...
gcloud services enable run.googleapis.com

echo Habilitando Cloud Storage API...
gcloud services enable storage.googleapis.com

echo Habilitando Cloud Build API...
gcloud services enable cloudbuild.googleapis.com

echo Habilitando Container Registry API...
gcloud services enable containerregistry.googleapis.com

echo ✅ APIs habilitadas

echo.
echo ======================================
echo 🗄️  Creando buckets de Cloud Storage...
echo ======================================
echo.

REM Crear bucket para PDFs pendientes
echo Creando bucket: %BUCKET_OCS%
gsutil ls -b gs://%BUCKET_OCS% >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo ⚠️  Bucket %BUCKET_OCS% ya existe
) else (
    gsutil mb -p %PROJECT_ID% -c STANDARD -l %REGION% gs://%BUCKET_OCS%/
    echo ✅ Bucket %BUCKET_OCS% creado
)

REM Crear bucket para PDFs procesados
echo Creando bucket: %BUCKET_PROCESSED%
gsutil ls -b gs://%BUCKET_PROCESSED% >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo ⚠️  Bucket %BUCKET_PROCESSED% ya existe
) else (
    gsutil mb -p %PROJECT_ID% -c STANDARD -l %REGION% gs://%BUCKET_PROCESSED%/
    echo ✅ Bucket %BUCKET_PROCESSED% creado
)

REM Crear bucket para resultados
echo Creando bucket: %BUCKET_RESULTS%
gsutil ls -b gs://%BUCKET_RESULTS% >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo ⚠️  Bucket %BUCKET_RESULTS% ya existe
) else (
    gsutil mb -p %PROJECT_ID% -c STANDARD -l %REGION% gs://%BUCKET_RESULTS%/
    echo ✅ Bucket %BUCKET_RESULTS% creado
)

echo.
echo ======================================
echo 🔒 Configurando permisos...
echo ======================================
echo.

REM Obtener número del proyecto
for /f "delims=" %%i in ('gcloud projects describe %PROJECT_ID% --format="value(projectNumber)"') do set PROJECT_NUMBER=%%i
set COMPUTE_SA=%PROJECT_NUMBER%-compute@developer.gserviceaccount.com

echo Otorgando permisos a la cuenta de servicio de Cloud Run
echo Cuenta de servicio: %COMPUTE_SA%

REM Dar permisos de Storage Object Admin a todos los buckets
gsutil iam ch serviceAccount:%COMPUTE_SA%:roles/storage.objectAdmin gs://%BUCKET_OCS% 2>nul
gsutil iam ch serviceAccount:%COMPUTE_SA%:roles/storage.objectAdmin gs://%BUCKET_PROCESSED% 2>nul
gsutil iam ch serviceAccount:%COMPUTE_SA%:roles/storage.objectAdmin gs://%BUCKET_RESULTS% 2>nul

echo ✅ Permisos configurados

echo.
echo ======================================
echo ✨ Configuración completada
echo ======================================
echo.
echo 📋 Resumen de recursos creados:
echo.
echo Buckets de Cloud Storage:
echo   • gs://%BUCKET_OCS%
echo   • gs://%BUCKET_PROCESSED%
echo   • gs://%BUCKET_RESULTS%
echo.
echo APIs habilitadas:
echo   • Cloud Run
echo   • Cloud Storage
echo   • Cloud Build
echo   • Container Registry
echo.
echo 🚀 Siguiente paso:
echo Ejecuta el script de deploy para desplegar la aplicación:
echo.
echo   deploy.bat
echo.
echo ======================================

pause
