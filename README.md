# 📋 Sistema de Procesamiento de Ordenes de Compra (OCs)

Sistema web para procesar archivos PDF de Ordenes de Compra, extraer información estructurada y generar archivos CSV para análisis.

## 🚀 Inicio Rápido

### Opción A: Uso Local

**Requisitos:**
- Node.js 14 o superior ([Descargar aquí](https://nodejs.org/))

**Instalación y Uso:**

**Windows:**
1. Copia la carpeta `OCsigma` a tu PC
2. Haz doble clic en `start.bat`
3. Abre tu navegador en: http://localhost:3001

**Linux/Mac:**
1. Copia la carpeta `OCsigma` a tu PC
2. Ejecuta: `chmod +x start.sh && ./start.sh`
3. Abre tu navegador en: http://localhost:3001

📖 **Para instrucciones detalladas, consulta [INSTALACION.md](INSTALACION.md)**

### Opción B: Despliegue en Google Cloud ☁️

Despliega la aplicación en Cloud Run con recursos GRATUITOS y obtén una URL pública.

**Pasos rápidos:**
1. Ejecuta `setup-gcloud.bat` (Windows) o `./setup-gcloud.sh` (Linux/Mac)
2. Ejecuta `deploy.bat` (Windows) o `./deploy.sh` (Linux/Mac)
3. Obtén tu URL pública: `https://ocsigma-xxxxx-uc.a.run.app`

☁️ **Para instrucciones completas de despliegue, consulta [DEPLOY.md](DEPLOY.md)**

## ✨ Características

- ✅ Lectura y procesamiento de archivos PDF de Ordenes de Compra
- ✅ Extracción automática de datos estructurados:
  - Número de orden
  - Fecha
  - Información de destinatario (A:)
  - Información de facturación (Facturar a:)
  - Detalles de partidas (cantidad, precios, IVA, etc.)
- ✅ Generación de archivos JSON y CSV
- ✅ Interfaz web intuitiva con Bootstrap
- ✅ Gestión visual de archivos procesados y pendientes

## 📁 Estructura del Proyecto

```
OCsigma/
├── client/                # Frontend React
│   ├── src/               # Código fuente del frontend
│   └── build/             # Frontend compilado (se genera)
├── server/                # Backend Node.js/Express
│   ├── index.js           # Servidor principal
│   ├── pdfExtractor.js    # Lógica de extracción de PDFs
│   └── storageService.js  # Servicio de Cloud Storage/Local
├── OCs/                   # PDFs pendientes (modo local)
├── OCSProcesadas/         # PDFs procesados (modo local)
├── OCSResult/             # Resultados (modo local)
├── Dockerfile             # Configuración Docker
├── cloudbuild.yaml        # Configuración Cloud Build
├── deploy.bat/sh          # Scripts de despliegue
├── setup-gcloud.bat/sh    # Scripts de configuración GCP
├── start.bat              # Script de inicio local (Windows)
├── start.sh               # Script de inicio local (Linux/Mac)
├── INSTALACION.md         # Guía de instalación local
└── DEPLOY.md              # Guía de despliegue en Cloud
```

## 🔧 Desarrollo

### Modo Desarrollo (con hot-reload)

```bash
npm run dev
```

Esto inicia:
- Backend en: http://localhost:3001
- Frontend en: http://localhost:3002

### Compilar para Producción

```bash
npm run build
```

### Iniciar en Modo Producción

```bash
npm start
```

O usa los scripts:
- Windows: `start.bat`
- Linux/Mac: `./start.sh`

## 📊 Formato de Salida

### JSON (DataOCS.json)
```json
{
  "4517909567-10": {
    "Fecha": "29.03.2023",
    "A": "CONTROL DE PROCESOS...",
    "FacturarA": "SIGMA ALIMENTOS...",
    "Detalle": {
      "Ptda": "10",
      "Descripción": "...",
      "Cantidad": "11.000",
      "Unidad": "DIA",
      ...
    }
  }
}
```

### CSV (OC-procesadas-YYYY-MM-DD.csv)
Archivo CSV con columnas:
- Orden, FECHA, A:, Facturar a:, Partida, Descripción, F. Entrega, Cantidad, Unidad, Precio Unitario, Precio Total, IVA, Total (IVA Incl), CONSULTORIA, FOLIO REPSE, PERIODO DE CONSULTORIA, PROVEEDOR, PROYECT, TIPO DE TARIFA, TIPO DE CONSULTOR, DESCUENTO

## 🛠️ Tecnologías Utilizadas

- **Frontend:** React 18, Bootstrap 5
- **Backend:** Node.js, Express
- **PDF Processing:** pdf-parse
- **Storage:** fs-extra (local) / Google Cloud Storage (cloud)
- **Cloud:** Google Cloud Run, Cloud Storage, Cloud Build
- **Container:** Docker multi-stage builds

## 📝 Notas

- Los archivos PDF procesados se mueven automáticamente a `OCSProcesadas/` (local) o bucket correspondiente (cloud)
- Si un CSV con el mismo nombre ya existe, se agrega un consecutivo (`-1`, `-2`, etc.)
- El sistema maneja automáticamente caracteres especiales y acentos en los CSV
- En Cloud Run, los archivos se almacenan en Cloud Storage (persistente)
- En modo local, los archivos se almacenan en carpetas del sistema de archivos

## ☁️ Despliegue en Producción

La aplicación está lista para desplegarse en Google Cloud Run con recursos gratuitos:

- **Cloud Run:** 2M peticiones/mes gratis
- **Cloud Storage:** 5GB gratis
- **Cloud Build:** 120 min/día gratis

Ver [DEPLOY.md](DEPLOY.md) para instrucciones completas.

## 📄 Licencia

ISC

---

**Versión:** 1.0.0
