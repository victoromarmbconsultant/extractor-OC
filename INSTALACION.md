# 📦 Guía de Instalación - Sistema de Procesamiento de OCs

## Requisitos Previos

Antes de instalar la aplicación, necesitas tener instalado:

### Node.js (Versión 14 o superior)

1. **Descargar Node.js:**
   - Visita: https://nodejs.org/
   - Descarga la versión LTS (Long Term Support)
   - Para Windows: descarga el instalador `.msi`
   - Para Linux/Mac: sigue las instrucciones del sitio

2. **Verificar instalación:**
   - Abre una terminal/consola
   - Ejecuta: `node --version`
   - Deberías ver algo como: `v18.x.x` o superior

## Instalación de la Aplicación

### Paso 1: Copiar la carpeta

1. Copia toda la carpeta `OCsigma` a la ubicación donde quieras instalar la aplicación
   - Ejemplo: `C:\OCsigma` (Windows) o `/home/usuario/OCsigma` (Linux)

### Paso 2: Instalar dependencias (Primera vez)

**Windows:**
1. Abre la carpeta `OCsigma` en el Explorador de Archivos
2. Haz doble clic en `start.bat`
   - La primera vez instalará todas las dependencias automáticamente
   - Esto puede tardar varios minutos

**Linux/Mac:**
1. Abre una terminal
2. Navega a la carpeta: `cd /ruta/a/OCsigma`
3. Ejecuta: `chmod +x start.sh`
4. Ejecuta: `./start.sh`
   - La primera vez instalará todas las dependencias automáticamente

### Paso 3: Usar la aplicación

1. Una vez iniciado el servidor, verás un mensaje como:
   ```
   🚀 Servidor corriendo en http://localhost:3001
   ```

2. Abre tu navegador web (Chrome, Firefox, Edge, etc.)

3. Ve a la dirección: **http://localhost:3001**

4. ¡Listo! Ya puedes usar la aplicación

## Uso Diario

### Para iniciar la aplicación:

**Windows:**
- Haz doble clic en `start.bat`

**Linux/Mac:**
- Ejecuta: `./start.sh`

### Para detener la aplicación:

- Presiona `Ctrl + C` en la ventana de la terminal/consola

## Estructura de Carpetas

La aplicación crea y usa estas carpetas:

- **OCs/** - Coloca aquí los archivos PDF que quieres procesar
- **OCSProcesadas/** - Los PDFs procesados se mueven aquí automáticamente
- **OCSResult/** - Aquí se guardan:
  - `DataOCS.json` - Datos extraídos en formato JSON
  - `OC-procesadas-YYYY-MM-DD.csv` - Archivos CSV generados

## Solución de Problemas

### Error: "Node.js no está instalado"
- Instala Node.js desde https://nodejs.org/
- Reinicia tu computadora después de instalar
- Verifica con: `node --version` en una terminal

### Error: "Puerto 3001 ya está en uso"
- Cierra otras instancias de la aplicación
- O cambia el puerto en `server/index.js` (línea con `const PORT = 3001`)

### La aplicación no inicia
- Verifica que Node.js esté instalado correctamente
- Asegúrate de tener permisos de escritura en la carpeta
- Revisa los mensajes de error en la consola

### El frontend no se muestra
- Verifica que la carpeta `client/build` exista
- Si no existe, ejecuta manualmente:
  ```bash
  cd client
  npm install
  npm run build
  cd ..
  ```

## Actualización

Si recibes una nueva versión:

1. **Respaldar datos importantes:**
   - Copia las carpetas `OCs`, `OCSProcesadas`, `OCSResult` a un lugar seguro

2. **Reemplazar archivos:**
   - Reemplaza toda la carpeta `OCsigma` con la nueva versión
   - **NO** reemplaces las carpetas `OCs`, `OCSProcesadas`, `OCSResult`

3. **Reinstalar dependencias:**
   - Ejecuta `start.bat` (Windows) o `./start.sh` (Linux/Mac)
   - Se instalarán las dependencias automáticamente

## Soporte

Si tienes problemas:
1. Revisa los mensajes de error en la consola
2. Verifica que Node.js esté instalado correctamente
3. Asegúrate de tener todas las carpetas necesarias

---

**Versión:** 1.0.0  
**Última actualización:** 2024


