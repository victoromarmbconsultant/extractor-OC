const express = require('express');
const cors = require('cors');
const fs = require('fs-extra');
const path = require('path');
const pdfParse = require('pdf-parse');
const { extractPDFData } = require('./pdfExtractor');
const storage = require('./storageService');

// Detectar si estamos en modo producción (servir frontend compilado)
const isProduction = process.env.NODE_ENV === 'production';
const clientBuildPath = path.join(__dirname, '..', 'client', 'build');

// Función para generar CSV a partir del JSON
async function generateCSV(results) {
  // Definir encabezados según la imagen proporcionada
  const headers = [
    'Orden',     // Primera columna: número de orden
    'FECHA',
    'A:',
    'Facturar a:',
    'Partida',  // Nueva columna entre C y D
    'Descripción',
    'F. Entrega',
    'Cantidad',
    'Unidad',
    'Precio Unitario',
    'Precio Total',
    'IVA',
    'Total (IVA Incl)',
    'CONSULTORIA',
    'FOLIO REPSE',
    'PERIODO DE CONSULTORIA',
    'PROVEEDOR',
    'PROYECT',
    'TIPO DE TARIFA',
    'TIPO DE CONSULTOR',
    'DESCUENTO'
  ];

  // Crear array de filas
  const rows = [headers];

  // Procesar cada entrada del JSON
  for (const [orderKey, orderData] of Object.entries(results)) {
    const detalle = orderData.Detalle || {};
    
    // Extraer número de orden de la clave (puede ser "4517984961-10" o solo "4517984961")
    // Si tiene guión, tomar la parte antes del guión
    const orderNumber = orderKey.includes('-') ? orderKey.split('-')[0] : orderKey;
    
    // Crear una fila por cada entrada
    const row = [
      orderNumber,                              // Orden (primera columna)
      orderData.Fecha || '',                    // FECHA
      orderData.A || '',                        // A:
      orderData.FacturarA || '',               // Facturar a:
      detalle.Ptda || '',                      // Partida (nueva columna)
      detalle.Descripción || '',               // Descripción
      detalle.FEntrega || '',                  // F. Entrega
      detalle.Cantidad || '',                  // Cantidad
      detalle.Unidad || '',                    // Unidad
      detalle.PrecioUnitario || '',            // Precio Unitario
      detalle.PrecioTotal || '',               // Precio Total
      detalle.IVA || '',                       // IVA
      detalle.TotalIVAIncl || '',              // Total (IVA Incl)
      detalle.CONSULTORIA || '',               // CONSULTORIA
      detalle.REPSE || '',                     // FOLIO REPSE
      detalle.PERIODO || '',                   // PERIODO DE CONSULTORIA
      detalle.PROVEEDOR || '',                 // PROVEEDOR
      detalle.PROYECTO || '',                  // PROYECT
      '',                                      // TIPO DE TARIFA (no se extrae del PDF actualmente)
      detalle.TIPO || '',                      // TIPO DE CONSULTOR
      detalle.DESCUENTO || ''                  // DESCUENTO
    ];

    rows.push(row);
  }

  // Convertir a formato CSV (manejar comas y comillas)
  const csvContent = rows.map(row => {
    return row.map(cell => {
      // Si la celda contiene comas, comillas o saltos de línea, envolver en comillas
      if (cell.includes(',') || cell.includes('"') || cell.includes('\n')) {
        // Escapar comillas dobles duplicándolas
        return `"${cell.replace(/"/g, '""')}"`;
      }
      return cell;
    }).join(',');
  }).join('\n');

  // Generar nombre de archivo con fecha
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0].replace(/-/g, '-'); // YYYY-MM-DD
  let baseFileName = `OC-procesadas-${dateStr}`;
  let fileName = `${baseFileName}.csv`;
  
  // Verificar si el archivo ya existe y agregar consecutivo si es necesario
  let counter = 1;
  while (await storage.fileExists('results', fileName)) {
    fileName = `${baseFileName}-${counter}.csv`;
    counter++;
  }

  // Guardar archivo CSV con BOM UTF-8 para que Excel lea correctamente los acentos
  // El BOM (Byte Order Mark) es necesario para que Excel reconozca UTF-8
  const BOM = '\uFEFF';
  await storage.saveFile('results', fileName, BOM + csvContent);

  return fileName;
}

// Configurar logging a archivo
const logFile = path.join(__dirname, '..', 'extraction.log');
const log = (message) => {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  fs.appendFileSync(logFile, logMessage);
  console.log(message);
};

const app = express();
// Cloud Run proporciona el puerto mediante variable de entorno PORT
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
// Aumentar límite para archivos grandes (50MB)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Endpoint para subir archivos PDF
app.post('/api/upload', async (req, res) => {
  try {
    const { filename, filedata } = req.body;
    
    if (!filename || !filedata) {
      return res.status(400).json({ error: 'Faltan datos del archivo (filename y filedata requeridos)' });
    }

    // Verificar que sea un archivo PDF
    if (!filename.toLowerCase().endsWith('.pdf')) {
      return res.status(400).json({ error: 'Solo se permiten archivos PDF' });
    }

    // Convertir base64 a buffer
    const buffer = Buffer.from(filedata, 'base64');
    
    // Guardar en Cloud Storage o carpeta local
    await storage.uploadFile('ocs', filename, buffer);
    
    log(`Archivo subido exitosamente: ${filename}`);
    
    res.json({ 
      success: true, 
      message: `Archivo ${filename} subido correctamente`,
      filename: filename
    });
  } catch (error) {
    console.error('Error subiendo archivo:', error);
    log(`Error subiendo archivo: ${error.message}`);
    res.status(500).json({ error: 'Error al subir el archivo', details: error.message });
  }
});

// Endpoint para listar archivos PDF
app.get('/api/files', async (req, res) => {
  try {
    const pdfFiles = await storage.listFiles('ocs', '.pdf');
    res.json(pdfFiles);
  } catch (error) {
    console.error('Error leyendo archivos:', error);
    res.status(500).json({ error: 'Error al leer los archivos PDF pendientes' });
  }
});

// Endpoint para listar archivos PDF procesados
app.get('/api/processed-files', async (req, res) => {
  try {
    const pdfFiles = await storage.listFiles('processed', '.pdf');
    res.json(pdfFiles);
  } catch (error) {
    console.error('Error leyendo archivos procesados:', error);
    res.status(500).json({ error: 'Error al leer los archivos PDF procesados' });
  }
});

// Endpoint para listar archivos CSV
app.get('/api/csv-files', async (req, res) => {
  try {
    const csvFiles = await storage.listFiles('results', '.csv');
    res.json(csvFiles);
  } catch (error) {
    console.error('Error leyendo archivos CSV:', error);
    res.status(500).json({ error: 'Error al leer los archivos CSV' });
  }
});

// Endpoint para servir archivos CSV
app.get('/api/csv-file/:filename', async (req, res) => {
  try {
    const filename = decodeURIComponent(req.params.filename);
    
    // Verificar que es un archivo CSV
    if (!filename.toLowerCase().endsWith('.csv')) {
      return res.status(400).json({ error: 'El archivo no es un CSV válido' });
    }
    
    // Verificar que el archivo existe
    const exists = await storage.fileExists('results', filename);
    if (!exists) {
      return res.status(404).json({ error: 'Archivo no encontrado' });
    }
    
    // Enviar el archivo con el tipo MIME correcto
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    // Leer y enviar el archivo
    const fileContent = await storage.readFileAsString('results', filename);
    res.send(fileContent);
  } catch (error) {
    console.error('Error sirviendo archivo CSV:', error);
    res.status(500).json({ error: 'Error al servir el archivo CSV' });
  }
});

// Endpoint para procesar archivos seleccionados
app.post('/api/process', async (req, res) => {
  try {
    const { files } = req.body;
    
    if (!files || !Array.isArray(files) || files.length === 0) {
      return res.status(400).json({ error: 'No se proporcionaron archivos para procesar' });
    }

    const results = {};
    const errors = [];

    for (const filename of files) {
      try {
        // Verificar que el archivo existe
        const exists = await storage.fileExists('ocs', filename);
        if (!exists) {
          errors.push(`Archivo no encontrado: ${filename}`);
          continue;
        }

        // Leer y parsear el PDF desde Cloud Storage o carpeta local
        const dataBuffer = await storage.readFileAsBuffer('ocs', filename);
        const pdfData = await pdfParse(dataBuffer);
        
        // Extraer información del PDF
        log(`\n=== PROCESANDO ARCHIVO: ${filename} ===`);
        const extractedData = extractPDFData(pdfData.text, filename);
        log(`\n=== RESULTADO EXTRACCIÓN PARA ${filename} ===`);
        log(`Order: ${extractedData.Order}`);
        log(`Date: ${extractedData.Date}`);
        log(`To: ${extractedData.To}`);
        log(`Invoice: ${extractedData.Invoice}`);
        log(`Detalle count: ${extractedData.Detalle ? extractedData.Detalle.length : 0}`);
        if (extractedData.Detalle && extractedData.Detalle.length > 0) {
          log(`Detalle: ${JSON.stringify(extractedData.Detalle, null, 2)}`);
        } else {
          log('⚠️ NO SE ENCONTRARON DETALLES');
        }
        
        if (extractedData.Order) {
          // Si hay múltiples partidas, generar una entrada por cada partida
          // Usar Order-Ptda como clave para cada partida
          if (extractedData.Detalle && extractedData.Detalle.length > 0) {
            log(`Procesando ${extractedData.Detalle.length} partidas para orden ${extractedData.Order}`);
            for (const detail of extractedData.Detalle) {
              const orderKey = `${extractedData.Order}-${detail.Item}`;
              log(`Creando entrada para partida ${detail.Item} con clave ${orderKey}`);
              const detalle = {
                Ptda: detail.Item || '',
                Código: detail.Code || '',
                Descripción: detail.Description || '',
                FEntrega: detail.DelivDate || '',
                Cantidad: detail.Quantity || '',
                Unidad: detail.Unit || '',
                PrecioUnitario: detail.UnitPrice || '',
                PrecioTotal: detail.TotalPrice || '',
                IVA: detail.TAX || '',
                TotalIVAIncl: detail.TotalTax || '',
                CONSULTORIA: detail.Consultant || '',
                REPSE: detail.REPSE || '',
                PERIODO: detail.Periodo || '',
                PROVEEDOR: detail.Provider || '',
                PROYECTO: detail.Proyect || '',
                DESCUENTO: detail.Descuento || '',
                TIPO: detail.Tipo || ''
              };
              
              results[orderKey] = {
                Fecha: extractedData.Date || '',
                A: extractedData.To || '',
                FacturarA: extractedData.Invoice || '',
                Detalle: detalle
              };
            }
          } else {
            // No hay detalles, crear estructura vacía
            results[extractedData.Order] = {
              Fecha: extractedData.Date || '',
              A: extractedData.To || '',
              FacturarA: extractedData.Invoice || '',
              Detalle: {}
            };
          }

          // Mover archivo a bucket/carpeta procesada
          await storage.moveFile('ocs', 'processed', filename);
        } else {
          errors.push(`No se pudo extraer el número de orden de: ${filename}`);
        }
      } catch (error) {
        console.error(`Error procesando ${filename}:`, error);
        errors.push(`Error procesando ${filename}: ${error.message}`);
      }
    }

    // Guardar JSON resultante
    const jsonContent = JSON.stringify(results, null, 2);
    await storage.saveFile('results', 'DataOCS.json', jsonContent);

    // Generar CSV a partir del JSON
    let csvFileName = null;
    try {
      csvFileName = await generateCSV(results);
      log(`CSV generado exitosamente: ${csvFileName}`);
    } catch (csvError) {
      log(`Error al generar CSV: ${csvError.message}`);
      errors.push(`Error al generar CSV: ${csvError.message}`);
    }

    // Incluir información de debug en la respuesta
    const debugInfo = {
      totalFiles: files.length,
      processedFiles: Object.keys(results).length,
      filesWithDetails: Object.values(results).filter(r => r.Detalle && Object.keys(r.Detalle).length > 0).length
    };

    res.json({
      success: true,
      data: results,
      csvPath: csvFileName,
      errors: errors.length > 0 ? errors : undefined,
      debug: debugInfo
    });
  } catch (error) {
    console.error('Error en procesamiento:', error);
    res.status(500).json({ error: 'Error al procesar archivos', details: error.message });
  }
});

// En producción, servir archivos estáticos del frontend compilado
// Esto debe ir DESPUÉS de todas las rutas de API
if (isProduction && fs.existsSync(clientBuildPath)) {
  // Servir archivos estáticos (CSS, JS, imágenes, etc.)
  app.use(express.static(clientBuildPath));
  
  // Todas las rutas que no sean API, servir el index.html del frontend (para React Router)
  app.get('*', (req, res) => {
    // Si es una ruta de API, no servir el frontend
    if (req.path.startsWith('/api/')) {
      return res.status(404).json({ error: 'Endpoint no encontrado' });
    }
    res.sendFile(path.join(clientBuildPath, 'index.html'));
  });
}

app.listen(PORT, () => {
  const envInfo = storage.getEnvironmentInfo();
  console.log(`\n========================================`);
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
  console.log(`📦 Entorno: ${envInfo.isCloud ? 'CLOUD RUN' : 'LOCAL'}`);
  if (envInfo.isCloud) {
    console.log(`☁️ Cloud Storage Buckets:`);
    console.log(`   - OCs: ${envInfo.buckets.ocs}`);
    console.log(`   - Procesadas: ${envInfo.buckets.processed}`);
    console.log(`   - Resultados: ${envInfo.buckets.results}`);
  } else {
    console.log(`📁 Carpetas locales:`);
    console.log(`   - OCs: ${envInfo.localFolders.ocs}`);
    console.log(`   - Procesadas: ${envInfo.localFolders.processed}`);
    console.log(`   - Resultados: ${envInfo.localFolders.results}`);
  }
  if (isProduction) {
    console.log(`✅ Modo: PRODUCCIÓN (Frontend integrado)`);
  } else {
    console.log(`🔧 Modo: DESARROLLO`);
  }
  console.log(`========================================\n`);
});

