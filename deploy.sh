#!/bin/bash
# Script de despliegue para OCsigma en Google Cloud Run
# Este script automatiza el proceso de build y deploy

set -e  # Detener en caso de error

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Variables de configuración
PROJECT_ID="extractor-ocr"
SERVICE_NAME="ocsigma"
REGION="us-central1"
IMAGE_NAME="gcr.io/${PROJECT_ID}/${SERVICE_NAME}"

echo -e "${GREEN}======================================${NC}"
echo -e "${GREEN}🚀 Desplegando OCsigma a Cloud Run${NC}"
echo -e "${GREEN}======================================${NC}"
echo ""

# Verificar que gcloud esté instalado
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}❌ Error: gcloud CLI no está instalado${NC}"
    echo "Instálalo desde: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Verificar que el proyecto esté configurado
CURRENT_PROJECT=$(gcloud config get-value project 2>/dev/null)
if [ "$CURRENT_PROJECT" != "$PROJECT_ID" ]; then
    echo -e "${YELLOW}⚠️  Configurando proyecto: ${PROJECT_ID}${NC}"
    gcloud config set project ${PROJECT_ID}
fi

echo -e "${YELLOW}📦 Proyecto: ${PROJECT_ID}${NC}"
echo -e "${YELLOW}🌍 Región: ${REGION}${NC}"
echo -e "${YELLOW}🎯 Servicio: ${SERVICE_NAME}${NC}"
echo ""

# Opción 1: Deploy usando Cloud Build (recomendado)
echo -e "${GREEN}Opción 1: Deploy con Cloud Build${NC}"
echo "Este método construye la imagen en la nube (gratis hasta 120 min/día)"
echo ""
read -p "¿Usar Cloud Build? (s/n): " use_cloud_build

if [ "$use_cloud_build" = "s" ] || [ "$use_cloud_build" = "S" ]; then
    echo -e "${YELLOW}🏗️  Iniciando Cloud Build...${NC}"
    gcloud builds submit --config cloudbuild.yaml
    
    echo -e "${GREEN}✅ Deploy completado con Cloud Build${NC}"
else
    # Opción 2: Build local y push
    echo -e "${YELLOW}🏗️  Construyendo imagen Docker localmente...${NC}"
    docker build -t ${IMAGE_NAME}:latest .
    
    echo -e "${YELLOW}📤 Subiendo imagen a Container Registry...${NC}"
    docker push ${IMAGE_NAME}:latest
    
    echo -e "${YELLOW}🚀 Desplegando a Cloud Run...${NC}"
    gcloud run deploy ${SERVICE_NAME} \
        --image=${IMAGE_NAME}:latest \
        --platform=managed \
        --region=${REGION} \
        --allow-unauthenticated \
        --memory=512Mi \
        --cpu=1 \
        --timeout=300s \
        --max-instances=3 \
        --set-env-vars=NODE_ENV=production,GCS_BUCKET_OCS=extractor-ocr-ocs,GCS_BUCKET_PROCESSED=extractor-ocr-procesadas,GCS_BUCKET_RESULTS=extractor-ocr-results,GOOGLE_CLOUD_PROJECT=${PROJECT_ID}
    
    echo -e "${GREEN}✅ Deploy completado${NC}"
fi

echo ""
echo -e "${GREEN}======================================${NC}"
echo -e "${GREEN}✨ Obteniendo URL del servicio...${NC}"
echo -e "${GREEN}======================================${NC}"

# Obtener la URL del servicio
SERVICE_URL=$(gcloud run services describe ${SERVICE_NAME} --region=${REGION} --format='value(status.url)')

echo ""
echo -e "${GREEN}🎉 ¡Despliegue exitoso!${NC}"
echo ""
echo -e "${YELLOW}📍 URL de tu aplicación:${NC}"
echo -e "${GREEN}${SERVICE_URL}${NC}"
echo ""
echo -e "${YELLOW}📊 Ver logs:${NC}"
echo "gcloud run services logs read ${SERVICE_NAME} --region=${REGION} --follow"
echo ""
echo -e "${YELLOW}📈 Ver métricas:${NC}"
echo "https://console.cloud.google.com/run/detail/${REGION}/${SERVICE_NAME}/metrics?project=${PROJECT_ID}"
echo ""
echo -e "${GREEN}======================================${NC}"
