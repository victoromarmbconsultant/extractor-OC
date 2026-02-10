# 📋 Sistema de Procesamiento de Ordenes de Compra (OCs)

Sistema web para procesar archivos PDF de Ordenes de Compra, extraer información estructurada y generar archivos CSV para análisis.

## 🚀 Inicio Rápido

### Requisitos
- Node.js 14 o superior ([Descargar aquí](https://nodejs.org/))

### Instalación y Uso

**Windows:**
1. Copia la carpeta `OCsigma` a tu PC
2. Haz doble clic en `start.bat`
3. Abre tu navegador en: http://localhost:3001

**Linux/Mac:**
1. Copia la carpeta `OCsigma` a tu PC
2. Ejecuta: `chmod +x start.sh && ./start.sh`
3. Abre tu navegador en: http://localhost:3001

📖 **Para instrucciones detalladas, consulta [INSTALACION.md](INSTALACION.md)**

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
├── client/              # Frontend React
│   ├── src/             # Código fuente del frontend
│   └── build/           # Frontend compilado (se genera)
├── server/              # Backend Node.js/Express
│   ├── index.js         # Servidor principal
│   └── pdfExtractor.js  # Lógica de extracción de PDFs
├── OCs/                 # PDFs pendientes de procesar
├── OCSProcesadas/       # PDFs ya procesados
├── OCSResult/           # Resultados (JSON y CSV)
├── start.bat            # Script de inicio (Windows)
├── start.sh             # Script de inicio (Linux/Mac)
└── INSTALACION.md       # Guía detallada de instalación
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
- **File System:** fs-extra

## 📝 Notas

- Los archivos PDF procesados se mueven automáticamente a `OCSProcesadas/`
- Si un CSV con el mismo nombre ya existe, se agrega un consecutivo (`-1`, `-2`, etc.)
- El sistema maneja automáticamente caracteres especiales y acentos en los CSV

## 📄 Licencia

ISC

---

**Versión:** 1.0.0
