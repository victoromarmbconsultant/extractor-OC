# 📦 Guía de Distribución - Sistema de Procesamiento de OCs

## Preparar la Aplicación para Distribución

### Paso 1: Compilar el Frontend

Antes de distribuir, asegúrate de compilar el frontend:

```bash
cd client
npm install
npm run build
cd ..
```

Esto creará la carpeta `client/build/` con los archivos estáticos del frontend.

### Paso 2: Verificar que Todo Esté Listo

Asegúrate de que existan estos archivos en la raíz del proyecto:

- ✅ `start.bat` (Windows)
- ✅ `start.sh` (Linux/Mac)
- ✅ `INSTALACION.md`
- ✅ `README.md`
- ✅ `package.json`
- ✅ `client/build/` (carpeta con frontend compilado)
- ✅ `server/` (carpeta con el backend)

### Paso 3: Limpiar Archivos No Necesarios (Opcional)

Antes de distribuir, puedes eliminar:

- `node_modules/` (se reinstalarán automáticamente)
- `client/node_modules/` (se reinstalarán automáticamente)
- `server/node_modules/` (se reinstalarán automáticamente)
- `.git/` (si usas control de versiones, mantenlo)
- `extraction.log` (archivo de logs, opcional)

**NOTA:** Los scripts `start.bat` y `start.sh` instalarán automáticamente las dependencias si no existen.

### Paso 4: Crear el Paquete de Distribución

#### Opción A: Carpeta Completa (Recomendado)

1. Comprime toda la carpeta `OCsigma` en un archivo ZIP
2. Nombre sugerido: `OCsigma-v1.0.0.zip`

#### Opción B: Solo Archivos Esenciales

Incluye solo estos archivos/carpetas:

```
OCsigma/
├── client/
│   └── build/          # Frontend compilado (IMPORTANTE)
├── server/             # Backend completo
│   ├── index.js
│   ├── pdfExtractor.js
│   └── package.json
├── OCs/                # Carpeta vacía (se creará automáticamente)
├── OCSProcesadas/      # Carpeta vacía (se creará automáticamente)
├── OCSResult/          # Carpeta vacía (se creará automáticamente)
├── start.bat           # Script Windows
├── start.sh             # Script Linux/Mac
├── package.json
├── INSTALACION.md      # Guía de instalación
├── README.md           # Documentación
└── DISTRIBUCION.md     # Este archivo
```

## Distribuir la Aplicación

### Métodos de Distribución

1. **USB/Disco Externo:**
   - Copia el archivo ZIP a un USB
   - Entrega el USB a los usuarios

2. **Red Local/Compartida:**
   - Coloca el ZIP en una carpeta compartida de red
   - Comparte el enlace con los usuarios

3. **Email/Cloud:**
   - Sube el ZIP a Google Drive, Dropbox, OneDrive, etc.
   - Comparte el enlace de descarga

4. **Servidor Web:**
   - Sube el ZIP a un servidor web
   - Proporciona el enlace de descarga

## Instrucciones para el Usuario Final

Los usuarios deben seguir las instrucciones en `INSTALACION.md`, que incluyen:

1. Instalar Node.js (si no lo tienen)
2. Extraer el archivo ZIP
3. Ejecutar `start.bat` (Windows) o `./start.sh` (Linux/Mac)
4. Abrir el navegador en http://localhost:3001

## Verificación Post-Distribución

Después de que un usuario instale la aplicación, debería poder:

- ✅ Ejecutar `start.bat` o `./start.sh` sin errores
- ✅ Ver el mensaje: "Servidor corriendo en http://localhost:3001"
- ✅ Abrir http://localhost:3001 en el navegador y ver la interfaz
- ✅ Colocar PDFs en la carpeta `OCs/` y procesarlos

## Tamaño del Paquete

**Tamaño aproximado:**
- Sin `node_modules`: ~5-10 MB
- Con `node_modules`: ~150-200 MB

**Recomendación:** Distribuir sin `node_modules` (los scripts los instalarán automáticamente)

## Actualizaciones Futuras

Cuando haya una nueva versión:

1. Actualiza el número de versión en `package.json`
2. Compila el frontend nuevamente
3. Crea un nuevo ZIP con el nuevo número de versión
4. Distribuye siguiendo el mismo proceso
5. Los usuarios pueden reemplazar la carpeta completa (respetando sus carpetas `OCs`, `OCSProcesadas`, `OCSResult`)

---

**Versión:** 1.0.0


