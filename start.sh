#!/bin/bash

echo "========================================"
echo "  Sistema de Procesamiento de OCs"
echo "========================================"
echo ""

# Verificar si Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "[ERROR] Node.js no está instalado o no está en el PATH"
    echo ""
    echo "Por favor instala Node.js desde: https://nodejs.org/"
    echo ""
    exit 1
fi

echo "[OK] Node.js encontrado"
echo ""

# Verificar si las dependencias están instaladas
if [ ! -d "node_modules" ]; then
    echo "[INFO] Instalando dependencias del proyecto..."
    npm install
    if [ $? -ne 0 ]; then
        echo "[ERROR] Error al instalar dependencias del proyecto"
        exit 1
    fi
fi

if [ ! -d "server/node_modules" ]; then
    echo "[INFO] Instalando dependencias del servidor..."
    cd server
    npm install
    cd ..
    if [ $? -ne 0 ]; then
        echo "[ERROR] Error al instalar dependencias del servidor"
        exit 1
    fi
fi

# Verificar si el frontend está compilado
if [ ! -d "client/build" ]; then
    echo "[INFO] El frontend no está compilado. Compilando..."
    cd client
    npm install
    if [ $? -ne 0 ]; then
        echo "[ERROR] Error al instalar dependencias del cliente"
        cd ..
        exit 1
    fi
    npm run build
    cd ..
    if [ $? -ne 0 ]; then
        echo "[ERROR] Error al compilar el frontend"
        exit 1
    fi
    echo "[OK] Frontend compilado exitosamente"
    echo ""
fi

# Crear carpetas necesarias si no existen
mkdir -p OCs
mkdir -p OCSProcesadas
mkdir -p OCSResult

echo "[OK] Carpetas de trabajo verificadas"
echo ""
echo "========================================"
echo "  Iniciando servidor..."
echo "========================================"
echo ""
echo "Abre tu navegador en: http://localhost:3001"
echo ""
echo "Presiona Ctrl+C para detener el servidor"
echo ""

# Iniciar el servidor en modo producción
export NODE_ENV=production
node server/index.js


