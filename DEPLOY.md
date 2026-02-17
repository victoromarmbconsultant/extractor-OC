# Guía de Despliegue - OCsigma en Google Cloud Run

Esta guía te ayudará a desplegar la aplicación OCsigma en Google Cloud usando servicios gratuitos.

## Requisitos Previos

1. **Cuenta de Google Cloud**
   - Proyecto creado: `extractor-ocr`
   - Facturación habilitada (necesaria incluso para el free tier)

2. **Google Cloud SDK (gcloud CLI)**
   - Descargar desde: https://cloud.google.com/sdk/docs/install
   - Verificar instalación: `gcloud --version`

3. **Docker** (opcional, solo si harás build local)
   - Descargar desde: https://www.docker.com/products/docker-desktop

## Arquitectura del Despliegue

```
Usuario
   ↓ (HTTPS)
Cloud Run (Servicio ocsigma)
   ↓
Cloud Storage
   ├── extractor-ocr-ocs (PDFs pendientes)
   ├── extractor-ocr-procesadas (PDFs procesados)
   └── extractor-ocr-results (CSVs y JSONs)
```

## Paso 1: Configuración Inicial de Google Cloud

### Opción A: Script Automático (Recomendado)

**En Windows:**
```cmd
setup-gcloud.bat
```

**En Linux/Mac:**
```bash
chmod +x setup-gcloud.sh
./setup-gcloud.sh
```

Este script automáticamente:
- Configura el proyecto `extractor-ocr`
- Habilita las APIs necesarias (Cloud Run, Storage, Build)
- Crea los 3 buckets de Cloud Storage
- Configura permisos de acceso

### Opción B: Configuración Manual

```bash
# 1. Configurar proyecto
gcloud config set project extractor-ocr

# 2. Habilitar APIs
gcloud services enable run.googleapis.com
gcloud services enable storage.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable containerregistry.googleapis.com

# 3. Crear buckets
gsutil mb -l us-central1 gs://extractor-ocr-ocs
gsutil mb -l us-central1 gs://extractor-ocr-procesadas
gsutil mb -l us-central1 gs://extractor-ocr-results

# 4. Configurar permisos (reemplaza PROJECT_NUMBER)
PROJECT_NUMBER=$(gcloud projects describe extractor-ocr --format="value(projectNumber)")
COMPUTE_SA="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"

gsutil iam ch serviceAccount:${COMPUTE_SA}:roles/storage.objectAdmin gs://extractor-ocr-ocs
gsutil iam ch serviceAccount:${COMPUTE_SA}:roles/storage.objectAdmin gs://extractor-ocr-procesadas
gsutil iam ch serviceAccount:${COMPUTE_SA}:roles/storage.objectAdmin gs://extractor-ocr-results
```

## Paso 2: Despliegue de la Aplicación

### Opción A: Script Automático (Recomendado)

**En Windows:**
```cmd
deploy.bat
```

**En Linux/Mac:**
```bash
chmod +x deploy.sh
./deploy.sh
```

El script te preguntará si quieres usar Cloud Build (recomendado) o hacer build local.

### Opción B: Deploy Manual

#### Método 1: Con Cloud Build (Recomendado - 120 min gratis/día)

```bash
gcloud builds submit --config cloudbuild.yaml
```

Este comando:
1. Construye la imagen Docker en la nube
2. La sube al Container Registry
3. Despliega automáticamente a Cloud Run

#### Método 2: Build Local

```bash
# 1. Build de la imagen
docker build -t gcr.io/extractor-ocr/ocsigma:latest .

# 2. Push al Container Registry
docker push gcr.io/extractor-ocr/ocsigma:latest

# 3. Deploy a Cloud Run
gcloud run deploy ocsigma \
  --image=gcr.io/extractor-ocr/ocsigma:latest \
  --platform=managed \
  --region=us-central1 \
  --allow-unauthenticated \
  --memory=512Mi \
  --cpu=1 \
  --timeout=300s \
  --max-instances=3 \
  --set-env-vars=NODE_ENV=production,GCS_BUCKET_OCS=extractor-ocr-ocs,GCS_BUCKET_PROCESSED=extractor-ocr-procesadas,GCS_BUCKET_RESULTS=extractor-ocr-results,GOOGLE_CLOUD_PROJECT=extractor-ocr
```

## Paso 3: Obtener la URL de tu Aplicación

Después del despliegue, obtendrás una URL como:
```
https://ocsigma-xxxxx-uc.a.run.app
```

Para obtenerla manualmente:
```bash
gcloud run services describe ocsigma --region=us-central1 --format='value(status.url)'
```

## Uso de la Aplicación en la Nube

### Subir PDFs a Procesar

Puedes subir PDFs de dos formas:

**Opción 1: Desde la interfaz web**
1. Accede a tu URL de Cloud Run
2. Usa el botón "Upload" en la interfaz (si está implementado)

**Opción 2: Usando gsutil**
```bash
# Subir un PDF
gsutil cp archivo.pdf gs://extractor-ocr-ocs/

# Subir múltiples PDFs
gsutil cp *.pdf gs://extractor-ocr-ocs/

# Subir desde una carpeta
gsutil -m cp -r ./OCs/*.pdf gs://extractor-ocr-ocs/
```

### Descargar Resultados

```bash
# Listar archivos CSV disponibles
gsutil ls gs://extractor-ocr-results/*.csv

# Descargar un CSV específico
gsutil cp gs://extractor-ocr-results/OC-procesadas-2026-02-17.csv .

# Descargar todos los resultados
gsutil -m cp -r gs://extractor-ocr-results/* ./resultados/
```

## Monitoreo y Logs

### Ver logs en tiempo real
```bash
gcloud run services logs read ocsigma --region=us-central1 --follow
```

### Ver logs en Cloud Console
```
https://console.cloud.google.com/run/detail/us-central1/ocsigma/logs?project=extractor-ocr
```

### Ver métricas
```
https://console.cloud.google.com/run/detail/us-central1/ocsigma/metrics?project=extractor-ocr
```

## Actualizar la Aplicación

Cuando hagas cambios en el código:

1. Commit tus cambios
2. Ejecuta el script de deploy:
   ```bash
   ./deploy.sh  # Linux/Mac
   deploy.bat   # Windows
   ```

La aplicación se actualizará automáticamente con zero downtime.

## Gestión de Buckets

### Ver archivos en los buckets
```bash
# PDFs pendientes
gsutil ls gs://extractor-ocr-ocs/

# PDFs procesados
gsutil ls gs://extractor-ocr-procesadas/

# Resultados
gsutil ls gs://extractor-ocr-results/
```

### Limpiar archivos antiguos
```bash
# Eliminar todos los PDFs procesados (ten cuidado)
gsutil -m rm gs://extractor-ocr-procesadas/*.pdf

# Eliminar CSVs antiguos
gsutil -m rm gs://extractor-ocr-results/OC-procesadas-2026-01-*.csv
```

## Costos y Límites del Free Tier

### Cloud Run (Always Free)
- ✅ 2M peticiones/mes
- ✅ 360,000 GB-segundos de memoria/mes
- ✅ 180,000 vCPU-segundos/mes
- ✅ Escala a 0 cuando no hay tráfico

### Cloud Storage (Always Free)
- ✅ 5 GB de almacenamiento Standard
- ✅ 5,000 operaciones Clase A/mes (write, list)
- ✅ 50,000 operaciones Clase B/mes (read)

### Cloud Build (Always Free)
- ✅ 120 minutos de build/día

### Recomendaciones para mantenerte en el free tier
- Limita `--max-instances=3` para evitar escalado excesivo
- Limpia PDFs procesados periódicamente
- Mantén el almacenamiento bajo 5GB

## Solución de Problemas

### Error: "Permission denied"
```bash
# Re-autenticarse
gcloud auth login

# Verificar permisos de la cuenta de servicio
gcloud projects get-iam-policy extractor-ocr
```

### Error: "Service not found"
```bash
# Verificar que el servicio existe
gcloud run services list --region=us-central1
```

### Error: "Bucket does not exist"
```bash
# Verificar que los buckets existen
gsutil ls -p extractor-ocr

# Recrear buckets si es necesario
gsutil mb -l us-central1 gs://extractor-ocr-ocs
```

### La aplicación no procesa PDFs
1. Verifica que los PDFs estén en el bucket correcto:
   ```bash
   gsutil ls gs://extractor-ocr-ocs/
   ```

2. Revisa los logs para ver errores:
   ```bash
   gcloud run services logs read ocsigma --region=us-central1 --limit=50
   ```

3. Verifica las variables de entorno:
   ```bash
   gcloud run services describe ocsigma --region=us-central1 --format='value(spec.template.spec.containers[0].env)'
   ```

## Desarrollo Local

Para probar localmente antes de desplegar:

```bash
# 1. Instalar dependencias
npm run install-all

# 2. Ejecutar en modo desarrollo (usa carpetas locales)
npm run dev

# 3. O en modo producción local
npm run build
npm start
```

En modo local, la aplicación usa las carpetas `OCs/`, `OCSProcesadas/` y `OCSResult/` del sistema de archivos.

## URLs Útiles

- **Cloud Console**: https://console.cloud.google.com/
- **Cloud Run**: https://console.cloud.google.com/run?project=extractor-ocr
- **Cloud Storage**: https://console.cloud.google.com/storage/browser?project=extractor-ocr
- **Cloud Build**: https://console.cloud.google.com/cloud-build/builds?project=extractor-ocr

## Soporte

Si tienes problemas:
1. Revisa los logs: `gcloud run services logs read ocsigma --region=us-central1 --limit=100`
2. Verifica el estado del servicio: `gcloud run services describe ocsigma --region=us-central1`
3. Consulta la documentación de Google Cloud: https://cloud.google.com/run/docs
