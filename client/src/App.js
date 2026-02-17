import React, { useState, useEffect } from 'react';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

function App() {
  const [files, setFiles] = useState([]);
  const [processedFiles, setProcessedFiles] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [loadingFiles, setLoadingFiles] = useState(true);
  const [loadingProcessedFiles, setLoadingProcessedFiles] = useState(true);
  const [result, setResult] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showCsvModal, setShowCsvModal] = useState(false);
  const [csvFiles, setCsvFiles] = useState([]);
  const [loadingCsvFiles, setLoadingCsvFiles] = useState(false);
  const [error, setError] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(null);

  useEffect(() => {
    loadFiles();
    loadProcessedFiles();
  }, []);

  const loadFiles = async () => {
    setLoadingFiles(true);
    try {
      // Usar ruta relativa para que funcione con el proxy
      const response = await axios.get('/api/files', {
        timeout: 5000
      });
      setFiles(response.data);
      setError(null);
    } catch (err) {
      console.error('Error cargando archivos:', err);
      if (err.code === 'ECONNREFUSED' || err.message.includes('Network Error') || err.code === 'ERR_NETWORK') {
        setError('No se puede conectar al servidor. Asegúrate de que el backend esté corriendo en el puerto 3001.');
      } else {
        setError('Error al cargar los archivos: ' + (err.response?.data?.error || err.message));
      }
    } finally {
      setLoadingFiles(false);
    }
  };

  const loadProcessedFiles = async () => {
    setLoadingProcessedFiles(true);
    try {
      const response = await axios.get('/api/processed-files', {
        timeout: 5000
      });
      setProcessedFiles(response.data);
    } catch (err) {
      console.error('Error cargando archivos procesados:', err);
      // No mostrar error si falla, solo dejar vacío
    } finally {
      setLoadingProcessedFiles(false);
    }
  };

  const handleCheckboxChange = (filename) => {
    const newSelected = new Set(selectedFiles);
    if (newSelected.has(filename)) {
      newSelected.delete(filename);
    } else {
      newSelected.add(filename);
    }
    setSelectedFiles(newSelected);
  };

  const handleLimpiar = () => {
    setSelectedFiles(new Set());
    setResult(null);
    setError(null);
  };

  const handleProcesar = async () => {
    if (selectedFiles.size === 0) {
      setError('Por favor selecciona al menos un archivo para procesar');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await axios.post('/api/process', {
        files: Array.from(selectedFiles)
      }, {
        timeout: 300000 // 5 minutos para procesar PDFs
      });

      if (response.data.success) {
        setResult(response.data.data);
        setShowModal(true);
        // Recargar lista de archivos y archivos procesados
        await loadFiles();
        await loadProcessedFiles();
        // Limpiar selección
        setSelectedFiles(new Set());
      } else {
        setError('Error al procesar los archivos');
      }
    } catch (err) {
      setError('Error al procesar: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleCloseModal = async () => {
    setShowModal(false);
    // Cargar lista de CSVs y abrir modal de CSVs
    await loadCsvFiles();
    setShowCsvModal(true);
  };

  const loadCsvFiles = async () => {
    setLoadingCsvFiles(true);
    try {
      const response = await axios.get('/api/csv-files', {
        timeout: 5000
      });
      setCsvFiles(response.data);
    } catch (err) {
      console.error('Error cargando archivos CSV:', err);
      setError('Error al cargar archivos CSV: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoadingCsvFiles(false);
    }
  };

  const handleCloseCsvModal = () => {
    setShowCsvModal(false);
  };

  const handleCsvDoubleClick = async (filename) => {
    try {
      // Construir URL del archivo CSV
      const csvUrl = `/api/csv-file/${encodeURIComponent(filename)}`;
      // Abrir en nueva pestaña
      window.open(csvUrl, '_blank');
    } catch (err) {
      console.error('Error abriendo archivo CSV:', err);
      setError('Error al abrir el archivo CSV: ' + (err.message || 'Error desconocido'));
    }
  };

  const handleFileUpload = async (event) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setError(null);
    setUploadSuccess(null);

    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        // Verificar que sea PDF
        if (!file.name.toLowerCase().endsWith('.pdf')) {
          throw new Error(`${file.name} no es un archivo PDF`);
        }

        // Convertir a base64
        const reader = new FileReader();
        return new Promise((resolve, reject) => {
          reader.onload = async () => {
            try {
              const base64 = reader.result.split(',')[1];
              const response = await axios.post('/api/upload', {
                filename: file.name,
                filedata: base64
              }, {
                timeout: 60000 // 1 minuto
              });
              resolve(response.data);
            } catch (err) {
              reject(err);
            }
          };
          reader.onerror = () => reject(new Error(`Error leyendo ${file.name}`));
          reader.readAsDataURL(file);
        });
      });

      await Promise.all(uploadPromises);
      setUploadSuccess(`${files.length} archivo(s) subido(s) exitosamente`);
      
      // Recargar lista de archivos
      await loadFiles();
      
      // Limpiar el input
      event.target.value = '';
    } catch (err) {
      console.error('Error subiendo archivos:', err);
      setError('Error al subir archivos: ' + (err.response?.data?.error || err.message));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="container mt-5">
      <div className="row">
        <div className="col-12">
          <h1 className="mb-4">Sistema de Procesamiento de Ordenes de Compra</h1>
          
          {error && (
            <div className="alert alert-danger alert-dismissible fade show" role="alert">
              {error}
              <button type="button" className="btn-close" onClick={() => setError(null)}></button>
            </div>
          )}

          {uploadSuccess && (
            <div className="alert alert-success alert-dismissible fade show" role="alert">
              {uploadSuccess}
              <button type="button" className="btn-close" onClick={() => setUploadSuccess(null)}></button>
            </div>
          )}

          {/* Área de subida de archivos */}
          <div className="card mb-4">
            <div className="card-header bg-primary text-white">
              <h5 className="mb-0">📤 Subir Archivos PDF</h5>
            </div>
            <div className="card-body">
              <div className="mb-3">
                <label htmlFor="fileInput" className="form-label">
                  Selecciona uno o más archivos PDF para subir
                </label>
                <input
                  type="file"
                  className="form-control"
                  id="fileInput"
                  accept=".pdf"
                  multiple
                  onChange={handleFileUpload}
                  disabled={uploading}
                />
                <div className="form-text">
                  Puedes seleccionar múltiples archivos PDF a la vez
                </div>
              </div>
              {uploading && (
                <div className="text-center py-3">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Subiendo...</span>
                  </div>
                  <p className="mt-2 text-muted">Subiendo archivos...</p>
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Archivos PDF disponibles para procesar</h5>
              <button 
                className="btn btn-sm btn-outline-secondary" 
                onClick={loadFiles}
              >
                🔄 Actualizar
              </button>
            </div>
            <div className="card-body">
              {loadingFiles ? (
                <div className="text-center py-3">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Cargando...</span>
                  </div>
                  <p className="mt-2 text-muted">Cargando archivos...</p>
                </div>
              ) : files.length === 0 ? (
                <p className="text-muted">No hay archivos PDF en la carpeta OCs</p>
              ) : (
                <div className="list-group">
                  {files.map((file, index) => (
                    <div key={index} className="list-group-item">
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id={`file-${index}`}
                          checked={selectedFiles.has(file)}
                          onChange={() => handleCheckboxChange(file)}
                        />
                        <label className="form-check-label" htmlFor={`file-${index}`}>
                          {file}
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 d-flex gap-2">
            <button
              className="btn btn-secondary"
              onClick={handleLimpiar}
              disabled={selectedFiles.size === 0 && !result}
            >
              LIMPIAR
            </button>
            <button
              className="btn btn-primary"
              onClick={handleProcesar}
              disabled={selectedFiles.size === 0 || loading}
            >
              {loading ? 'Procesando...' : 'PROCESAR'}
            </button>
          </div>

          {/* Sección de archivos procesados */}
          <div className="card mt-4">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Archivos PDF Procesados</h5>
              <div className="d-flex gap-2">
                <button 
                  className="btn btn-sm btn-success" 
                  onClick={async () => {
                    await loadCsvFiles();
                    setShowCsvModal(true);
                  }}
                >
                  CSVs
                </button>
                <button 
                  className="btn btn-sm btn-outline-secondary" 
                  onClick={loadProcessedFiles}
                >
                  Actualizar
                </button>
              </div>
            </div>
            <div className="card-body">
              {loadingProcessedFiles ? (
                <div className="text-center py-3">
                  <div className="spinner-border text-success" role="status" style={{ width: '1.5rem', height: '1.5rem' }}>
                    <span className="visually-hidden">Cargando...</span>
                  </div>
                  <p className="mt-2 text-muted">Cargando archivos procesados...</p>
                </div>
              ) : processedFiles.length === 0 ? (
                <p className="text-muted">No hay archivos procesados aún</p>
              ) : (
                <div className="list-group">
                  {processedFiles.map((file, index) => (
                    <div key={index} className="list-group-item">
                      <div className="d-flex align-items-center">
                        <i className="bi bi-check-circle-fill text-success me-2">✓</i>
                        <span className="text-muted">{file}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {processedFiles.length > 0 && (
                <div className="mt-3">
                  <small className="text-muted">
                    Total procesados: <strong>{processedFiles.length}</strong>
                  </small>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal para mostrar resultado JSON */}
      {showModal && result && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Resultado del Procesamiento</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={handleCloseModal}
                ></button>
              </div>
              <div className="modal-body">
                <p className="text-success mb-3">
                  <strong>Archivos procesados exitosamente. JSON guardado en OCSResult/DataOCS.json</strong>
                </p>
                <pre className="bg-light p-3 rounded" style={{ maxHeight: '500px', overflow: 'auto' }}>
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleCloseModal}
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal para mostrar lista de archivos CSV */}
      {showCsvModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Archivos CSV Generados</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={handleCloseCsvModal}
                ></button>
              </div>
              <div className="modal-body">
                <p className="text-muted mb-3">
                  <strong>Haz doble clic en un archivo para abrirlo</strong>
                </p>
                {loadingCsvFiles ? (
                  <div className="text-center py-3">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Cargando...</span>
                    </div>
                    <p className="mt-2 text-muted">Cargando archivos CSV...</p>
                  </div>
                ) : csvFiles.length === 0 ? (
                  <p className="text-muted">No hay archivos CSV en la carpeta OCSResult</p>
                ) : (
                  <div className="list-group">
                    {csvFiles.map((file, index) => (
                      <div
                        key={index}
                        className="list-group-item list-group-item-action"
                        style={{ cursor: 'pointer' }}
                        onDoubleClick={() => handleCsvDoubleClick(file)}
                        title="Doble clic para abrir"
                      >
                        <div className="d-flex align-items-center">
                          <i className="bi bi-file-earmark-spreadsheet me-2" style={{ fontSize: '1.2rem' }}>📊</i>
                          <span>{file}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleCloseCsvModal}
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;

