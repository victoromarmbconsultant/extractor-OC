const { Storage } = require('@google-cloud/storage');
const path = require('path');
const fs = require('fs-extra');

// Determinar si estamos en entorno local o Cloud Run
const isCloudEnvironment = process.env.K_SERVICE !== undefined; // K_SERVICE está presente en Cloud Run

// Configurar Cloud Storage
const storage = new Storage();

// Nombres de los buckets (configurables vía variables de entorno)
const BUCKET_OCS = process.env.GCS_BUCKET_OCS || 'extractor-ocr-ocs';
const BUCKET_PROCESSED = process.env.GCS_BUCKET_PROCESSED || 'extractor-ocr-procesadas';
const BUCKET_RESULTS = process.env.GCS_BUCKET_RESULTS || 'extractor-ocr-results';

// Carpetas locales para desarrollo (fallback)
const LOCAL_OCS_FOLDER = path.join(__dirname, '..', 'OCs');
const LOCAL_PROCESSED_FOLDER = path.join(__dirname, '..', 'OCSProcesadas');
const LOCAL_RESULTS_FOLDER = path.join(__dirname, '..', 'OCSResult');

// Asegurar que las carpetas locales existan si estamos en desarrollo
if (!isCloudEnvironment) {
  fs.ensureDirSync(LOCAL_OCS_FOLDER);
  fs.ensureDirSync(LOCAL_PROCESSED_FOLDER);
  fs.ensureDirSync(LOCAL_RESULTS_FOLDER);
}

/**
 * Obtiene el bucket correspondiente según el tipo
 */
function getBucketName(type) {
  const bucketMap = {
    'ocs': BUCKET_OCS,
    'processed': BUCKET_PROCESSED,
    'results': BUCKET_RESULTS
  };
  return bucketMap[type];
}

/**
 * Obtiene la carpeta local correspondiente según el tipo
 */
function getLocalFolder(type) {
  const folderMap = {
    'ocs': LOCAL_OCS_FOLDER,
    'processed': LOCAL_PROCESSED_FOLDER,
    'results': LOCAL_RESULTS_FOLDER
  };
  return folderMap[type];
}

/**
 * Lista archivos en un bucket o carpeta local
 * @param {string} type - Tipo de almacenamiento ('ocs', 'processed', 'results')
 * @param {string} extension - Extensión de archivo a filtrar (ej: '.pdf', '.csv')
 * @returns {Promise<Array<string>>} Lista de nombres de archivos
 */
async function listFiles(type, extension = '') {
  try {
    if (isCloudEnvironment) {
      const bucketName = getBucketName(type);
      const bucket = storage.bucket(bucketName);
      const [files] = await bucket.getFiles();
      
      let fileNames = files.map(file => file.name);
      
      if (extension) {
        fileNames = fileNames.filter(name => 
          name.toLowerCase().endsWith(extension.toLowerCase())
        );
      }
      
      return fileNames.sort().reverse(); // Más recientes primero
    } else {
      // Entorno local - usar sistema de archivos
      const folder = getLocalFolder(type);
      const files = await fs.readdir(folder);
      
      let fileNames = extension 
        ? files.filter(file => file.toLowerCase().endsWith(extension.toLowerCase()))
        : files;
      
      return fileNames.sort().reverse();
    }
  } catch (error) {
    console.error(`Error listando archivos de tipo ${type}:`, error);
    throw error;
  }
}

/**
 * Lee un archivo como buffer desde bucket o carpeta local
 * @param {string} type - Tipo de almacenamiento
 * @param {string} filename - Nombre del archivo
 * @returns {Promise<Buffer>} Contenido del archivo
 */
async function readFileAsBuffer(type, filename) {
  try {
    if (isCloudEnvironment) {
      const bucketName = getBucketName(type);
      const bucket = storage.bucket(bucketName);
      const file = bucket.file(filename);
      
      const [buffer] = await file.download();
      return buffer;
    } else {
      // Entorno local
      const folder = getLocalFolder(type);
      const filePath = path.join(folder, filename);
      return await fs.readFile(filePath);
    }
  } catch (error) {
    console.error(`Error leyendo archivo ${filename} de tipo ${type}:`, error);
    throw error;
  }
}

/**
 * Lee un archivo como string desde bucket o carpeta local
 * @param {string} type - Tipo de almacenamiento
 * @param {string} filename - Nombre del archivo
 * @returns {Promise<string>} Contenido del archivo como string
 */
async function readFileAsString(type, filename) {
  try {
    if (isCloudEnvironment) {
      const bucketName = getBucketName(type);
      const bucket = storage.bucket(bucketName);
      const file = bucket.file(filename);
      
      const [contents] = await file.download();
      return contents.toString('utf8');
    } else {
      // Entorno local
      const folder = getLocalFolder(type);
      const filePath = path.join(folder, filename);
      return await fs.readFile(filePath, 'utf8');
    }
  } catch (error) {
    console.error(`Error leyendo archivo ${filename} de tipo ${type}:`, error);
    throw error;
  }
}

/**
 * Guarda un archivo desde buffer o string
 * @param {string} type - Tipo de almacenamiento
 * @param {string} filename - Nombre del archivo
 * @param {Buffer|string} content - Contenido a guardar
 * @returns {Promise<void>}
 */
async function saveFile(type, filename, content) {
  try {
    if (isCloudEnvironment) {
      const bucketName = getBucketName(type);
      const bucket = storage.bucket(bucketName);
      const file = bucket.file(filename);
      
      await file.save(content, {
        metadata: {
          contentType: getContentType(filename)
        }
      });
    } else {
      // Entorno local
      const folder = getLocalFolder(type);
      const filePath = path.join(folder, filename);
      await fs.writeFile(filePath, content);
    }
  } catch (error) {
    console.error(`Error guardando archivo ${filename} en tipo ${type}:`, error);
    throw error;
  }
}

/**
 * Mueve un archivo entre buckets o carpetas
 * @param {string} sourceType - Tipo de origen ('ocs', 'processed', 'results')
 * @param {string} destType - Tipo de destino
 * @param {string} filename - Nombre del archivo
 * @returns {Promise<void>}
 */
async function moveFile(sourceType, destType, filename) {
  try {
    if (isCloudEnvironment) {
      const sourceBucketName = getBucketName(sourceType);
      const destBucketName = getBucketName(destType);
      
      const sourceBucket = storage.bucket(sourceBucketName);
      const destBucket = storage.bucket(destBucketName);
      
      // Copiar archivo al destino
      await sourceBucket.file(filename).copy(destBucket.file(filename));
      
      // Eliminar archivo original
      await sourceBucket.file(filename).delete();
    } else {
      // Entorno local
      const sourceFolder = getLocalFolder(sourceType);
      const destFolder = getLocalFolder(destType);
      
      const sourcePath = path.join(sourceFolder, filename);
      const destPath = path.join(destFolder, filename);
      
      await fs.move(sourcePath, destPath, { overwrite: true });
    }
  } catch (error) {
    console.error(`Error moviendo archivo ${filename} de ${sourceType} a ${destType}:`, error);
    throw error;
  }
}

/**
 * Verifica si un archivo existe
 * @param {string} type - Tipo de almacenamiento
 * @param {string} filename - Nombre del archivo
 * @returns {Promise<boolean>}
 */
async function fileExists(type, filename) {
  try {
    if (isCloudEnvironment) {
      const bucketName = getBucketName(type);
      const bucket = storage.bucket(bucketName);
      const file = bucket.file(filename);
      
      const [exists] = await file.exists();
      return exists;
    } else {
      // Entorno local
      const folder = getLocalFolder(type);
      const filePath = path.join(folder, filename);
      return await fs.pathExists(filePath);
    }
  } catch (error) {
    console.error(`Error verificando existencia de archivo ${filename}:`, error);
    return false;
  }
}

/**
 * Sube un archivo desde un buffer
 * @param {string} type - Tipo de almacenamiento
 * @param {string} filename - Nombre del archivo
 * @param {Buffer} buffer - Buffer del archivo
 * @returns {Promise<void>}
 */
async function uploadFile(type, filename, buffer) {
  return saveFile(type, filename, buffer);
}

/**
 * Obtiene el tipo de contenido basado en la extensión del archivo
 */
function getContentType(filename) {
  const ext = path.extname(filename).toLowerCase();
  const contentTypes = {
    '.pdf': 'application/pdf',
    '.csv': 'text/csv',
    '.json': 'application/json',
    '.txt': 'text/plain',
    '.log': 'text/plain'
  };
  return contentTypes[ext] || 'application/octet-stream';
}

/**
 * Obtiene información sobre el entorno de ejecución
 */
function getEnvironmentInfo() {
  return {
    isCloud: isCloudEnvironment,
    buckets: isCloudEnvironment ? {
      ocs: BUCKET_OCS,
      processed: BUCKET_PROCESSED,
      results: BUCKET_RESULTS
    } : null,
    localFolders: !isCloudEnvironment ? {
      ocs: LOCAL_OCS_FOLDER,
      processed: LOCAL_PROCESSED_FOLDER,
      results: LOCAL_RESULTS_FOLDER
    } : null
  };
}

module.exports = {
  listFiles,
  readFileAsBuffer,
  readFileAsString,
  saveFile,
  moveFile,
  fileExists,
  uploadFile,
  getEnvironmentInfo,
  // Exportar constantes para uso directo si es necesario
  isCloudEnvironment,
  BUCKET_OCS,
  BUCKET_PROCESSED,
  BUCKET_RESULTS
};
