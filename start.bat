@echo off
echo ========================================
echo   Sistema de Procesamiento de OCs
echo ========================================
echo.

REM Verificar si Node.js está instalado
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js no está instalado o no está en el PATH
    echo.
    echo Por favor instala Node.js desde: https://nodejs.org/
    echo.
    pause
    exit /b 1
)

echo [OK] Node.js encontrado
echo.

REM Verificar si las dependencias están instaladas
if not exist "node_modules\" (
    echo [INFO] Instalando dependencias del proyecto...
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] Error al instalar dependencias del proyecto
        pause
        exit /b 1
    )
)

if not exist "server\node_modules\" (
    echo [INFO] Instalando dependencias del servidor...
    cd server
    call npm install
    cd ..
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] Error al instalar dependencias del servidor
        pause
        exit /b 1
    )
)

REM Verificar si el frontend está compilado
if not exist "client\build\" (
    echo [INFO] El frontend no está compilado. Compilando...
    cd client
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] Error al instalar dependencias del cliente
        cd ..
        pause
        exit /b 1
    )
    call npm run build
    cd ..
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] Error al compilar el frontend
        pause
        exit /b 1
    )
    echo [OK] Frontend compilado exitosamente
    echo.
)

REM Crear carpetas necesarias si no existen
if not exist "OCs\" mkdir "OCs"
if not exist "OCSProcesadas\" mkdir "OCSProcesadas"
if not exist "OCSResult\" mkdir "OCSResult"

echo [OK] Carpetas de trabajo verificadas
echo.
echo ========================================
echo   Iniciando servidor...
echo ========================================
echo.
echo Abre tu navegador en: http://localhost:3001
echo.
echo Presiona Ctrl+C para detener el servidor
echo.

REM Iniciar el servidor en modo producción
set NODE_ENV=production
node server/index.js

pause


