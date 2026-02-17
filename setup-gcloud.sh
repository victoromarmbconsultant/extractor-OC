#!/bin/bash
# Script de configuración inicial de Google Cloud para OCsigma
# Este script habilita APIs y crea los buckets necesarios

set -e  # Detener en caso de error

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Variables de configuración
PROJECT_ID="extractor-ocr"
REGION="us-central1"
BUCKET_OCS="extractor-ocr-ocs"
BUCKET_PROCESSED="extractor-ocr-procesadas"
BUCKET_RESULTS="extractor-ocr-results"

echo -e "${GREEN}======================================${NC}"
echo -e "${GREEN}🔧 Configuración inicial de Google Cloud${NC}"
echo -e "${GREEN}======================================${NC}"
echo ""

# Verificar que gcloud esté instalado
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}❌ Error: gcloud CLI no está instalado${NC}"
    echo "Instálalo desde: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Verificar que gsutil esté disponible
if ! command -v gsutil &> /dev/null; then
    echo -e "${RED}❌ Error: gsutil no está disponible${NC}"
    echo "Instálalo con: gcloud components install gsutil"
    exit 1
fi

echo -e "${YELLOW}📦 Proyecto: ${PROJECT_ID}${NC}"
echo -e "${YELLOW}🌍 Región: ${REGION}${NC}"
echo ""

# Configurar proyecto
echo -e "${YELLOW}⚙️  Configurando proyecto...${NC}"
gcloud config set project ${PROJECT_ID}

# Login si es necesario
echo ""
echo -e "${YELLOW}🔐 Verificando autenticación...${NC}"
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q "@"; then
    echo -e "${YELLOW}Necesitas autenticarte con Google Cloud${NC}"
    gcloud auth login
fi

echo ""
echo -e "${GREEN}======================================${NC}"
echo -e "${GREEN}📡 Habilitando APIs necesarias...${NC}"
echo -e "${GREEN}======================================${NC}"
echo ""

# Habilitar APIs necesarias
echo -e "${YELLOW}Habilitando Cloud Run API...${NC}"
gcloud services enable run.googleapis.com

echo -e "${YELLOW}Habilitando Cloud Storage API...${NC}"
gcloud services enable storage.googleapis.com

echo -e "${YELLOW}Habilitando Cloud Build API...${NC}"
gcloud services enable cloudbuild.googleapis.com

echo -e "${YELLOW}Habilitando Container Registry API...${NC}"
gcloud services enable containerregistry.googleapis.com

echo -e "${GREEN}✅ APIs habilitadas${NC}"

echo ""
echo -e "${GREEN}======================================${NC}"
echo -e "${GREEN}🗄️  Creando buckets de Cloud Storage...${NC}"
echo -e "${GREEN}======================================${NC}"
echo ""

# Crear bucket para PDFs pendientes
echo -e "${YELLOW}Creando bucket: ${BUCKET_OCS}${NC}"
if gsutil ls -b gs://${BUCKET_OCS} 2>/dev/null; then
    echo -e "${YELLOW}⚠️  Bucket ${BUCKET_OCS} ya existe${NC}"
else
    gsutil mb -p ${PROJECT_ID} -c STANDARD -l ${REGION} gs://${BUCKET_OCS}/
    echo -e "${GREEN}✅ Bucket ${BUCKET_OCS} creado${NC}"
fi

# Crear bucket para PDFs procesados
echo -e "${YELLOW}Creando bucket: ${BUCKET_PROCESSED}${NC}"
if gsutil ls -b gs://${BUCKET_PROCESSED} 2>/dev/null; then
    echo -e "${YELLOW}⚠️  Bucket ${BUCKET_PROCESSED} ya existe${NC}"
else
    gsutil mb -p ${PROJECT_ID} -c STANDARD -l ${REGION} gs://${BUCKET_PROCESSED}/
    echo -e "${GREEN}✅ Bucket ${BUCKET_PROCESSED} creado${NC}"
fi

# Crear bucket para resultados
echo -e "${YELLOW}Creando bucket: ${BUCKET_RESULTS}${NC}"
if gsutil ls -b gs://${BUCKET_RESULTS} 2>/dev/null; then
    echo -e "${YELLOW}⚠️  Bucket ${BUCKET_RESULTS} ya existe${NC}"
else
    gsutil mb -p ${PROJECT_ID} -c STANDARD -l ${REGION} gs://${BUCKET_RESULTS}/
    echo -e "${GREEN}✅ Bucket ${BUCKET_RESULTS} creado${NC}"
fi

echo ""
echo -e "${GREEN}======================================${NC}"
echo -e "${GREEN}🔒 Configurando permisos...${NC}"
echo -e "${GREEN}======================================${NC}"
echo ""

# Obtener número del proyecto
PROJECT_NUMBER=$(gcloud projects describe ${PROJECT_ID} --format="value(projectNumber)")
COMPUTE_SA="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"

echo -e "${YELLOW}Otorgando permisos a la cuenta de servicio de Cloud Run${NC}"
echo -e "${YELLOW}Cuenta de servicio: ${COMPUTE_SA}${NC}"

# Dar permisos de Storage Object Admin a todos los buckets
gsutil iam ch serviceAccount:${COMPUTE_SA}:roles/storage.objectAdmin gs://${BUCKET_OCS} 2>/dev/null || true
gsutil iam ch serviceAccount:${COMPUTE_SA}:roles/storage.objectAdmin gs://${BUCKET_PROCESSED} 2>/dev/null || true
gsutil iam ch serviceAccount:${COMPUTE_SA}:roles/storage.objectAdmin gs://${BUCKET_RESULTS} 2>/dev/null || true

echo -e "${GREEN}✅ Permisos configurados${NC}"

echo ""
echo -e "${GREEN}======================================${NC}"
echo -e "${GREEN}✨ Configuración completada${NC}"
echo -e "${GREEN}======================================${NC}"
echo ""
echo -e "${YELLOW}📋 Resumen de recursos creados:${NC}"
echo ""
echo -e "${GREEN}Buckets de Cloud Storage:${NC}"
echo "  • gs://${BUCKET_OCS}"
echo "  • gs://${BUCKET_PROCESSED}"
echo "  • gs://${BUCKET_RESULTS}"
echo ""
echo -e "${GREEN}APIs habilitadas:${NC}"
echo "  • Cloud Run"
echo "  • Cloud Storage"
echo "  • Cloud Build"
echo "  • Container Registry"
echo ""
echo -e "${YELLOW}🚀 Siguiente paso:${NC}"
echo "Ejecuta el script de deploy para desplegar la aplicación:"
echo ""
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
    echo "  deploy.bat"
else
    echo "  ./deploy.sh"
fi
echo ""
echo -e "${GREEN}======================================${NC}"
