/**
 * InDriver File Uploader Component
 *
 * Drag-and-drop file upload zone for InDriver screenshots and PDFs
 */

import { type FC, useCallback, useRef, useState } from 'react';
import type { UploadedFile } from '../types';
import './InDriverUploader.css';

interface InDriverUploaderProps {
  files: UploadedFile[];
  isProcessing: boolean;
  onAddFiles: (files: File[]) => void;
  onRemoveFile: (index: number) => void;
  onClearFiles: () => void;
  onProcess: () => void;
}

const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export const InDriverUploader: FC<InDriverUploaderProps> = ({
  files,
  isProcessing,
  onAddFiles,
  onRemoveFile,
  onClearFiles,
  onProcess,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFiles = useCallback((fileList: FileList | File[]): File[] => {
    const validFiles: File[] = [];
    const fileArray = Array.from(fileList);

    for (const file of fileArray) {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        console.warn(`Tipo de archivo no soportado: ${file.name}`);
        continue;
      }
      if (file.size > MAX_FILE_SIZE) {
        console.warn(`Archivo muy grande: ${file.name}`);
        continue;
      }
      validFiles.push(file);
    }

    return validFiles;
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);

      const validFiles = validateFiles(e.dataTransfer.files);
      if (validFiles.length > 0) {
        onAddFiles(validFiles);
      }
    },
    [onAddFiles, validateFiles]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        const validFiles = validateFiles(e.target.files);
        if (validFiles.length > 0) {
          onAddFiles(validFiles);
        }
      }
      // Reset input to allow selecting same file again
      e.target.value = '';
    },
    [onAddFiles, validateFiles]
  );

  const handleZoneClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const getStatusIcon = (status: UploadedFile['status']) => {
    switch (status) {
      case 'processing':
        return '⏳';
      case 'success':
        return '✓';
      case 'error':
        return '✕';
      default:
        return '📄';
    }
  };

  const getStatusClass = (status: UploadedFile['status']) => {
    switch (status) {
      case 'processing':
        return 'file-status-processing';
      case 'success':
        return 'file-status-success';
      case 'error':
        return 'file-status-error';
      default:
        return 'file-status-pending';
    }
  };

  return (
    <div className="indriver-uploader">
      <div className="uploader-header">
        <h2 className="uploader-title">Importar Viajes de InDriver</h2>
        <p className="uploader-subtitle">
          Sube capturas de pantalla o PDFs de tus viajes en InDriver
        </p>
      </div>

      {/* Drop Zone */}
      <div
        className={`drop-zone ${isDragOver ? 'drop-zone-active' : ''} ${
          isProcessing ? 'drop-zone-disabled' : ''
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={isProcessing ? undefined : handleZoneClick}
        role="button"
        tabIndex={isProcessing ? -1 : 0}
        aria-label="Zona para soltar archivos"
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".png,.jpg,.jpeg,.pdf"
          onChange={handleFileSelect}
          className="file-input"
          disabled={isProcessing}
        />

        <div className="drop-zone-content">
          <div className="drop-zone-icon">📸</div>
          <p className="drop-zone-text">
            {isDragOver
              ? 'Suelta los archivos aquí'
              : 'Arrastra tus capturas aquí o haz clic para seleccionar'}
          </p>
          <p className="drop-zone-hint">
            Formatos: PNG, JPG, PDF (máx. 10MB c/u)
          </p>
        </div>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="file-list">
          <div className="file-list-header">
            <span className="file-count">
              {files.length} archivo{files.length !== 1 ? 's' : ''} seleccionado
              {files.length !== 1 ? 's' : ''}
            </span>
            <button
              type="button"
              className="btn-clear"
              onClick={onClearFiles}
              disabled={isProcessing}
            >
              Limpiar todo
            </button>
          </div>

          <ul className="files">
            {files.map((file, index) => (
              <li key={`${file.file.name}-${index}`} className="file-item">
                <div className="file-preview">
                  {file.file.type.startsWith('image/') ? (
                    <img src={file.preview} alt={file.file.name} />
                  ) : (
                    <div className="file-preview-pdf">PDF</div>
                  )}
                </div>

                <div className="file-info">
                  <span className="file-name" title={file.file.name}>
                    {file.file.name}
                  </span>
                  <span className="file-size">
                    {(file.file.size / 1024).toFixed(0)} KB
                  </span>
                  {file.error && (
                    <span className="file-error">{file.error}</span>
                  )}
                </div>

                <div className={`file-status ${getStatusClass(file.status)}`}>
                  {getStatusIcon(file.status)}
                </div>

                <button
                  type="button"
                  className="btn-remove"
                  onClick={() => onRemoveFile(index)}
                  disabled={isProcessing}
                  aria-label={`Eliminar ${file.file.name}`}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Actions */}
      <div className="uploader-actions">
        <button
          type="button"
          className="btn btn-primary"
          onClick={onProcess}
          disabled={files.length === 0 || isProcessing}
        >
          {isProcessing ? (
            <>
              <span className="spinner"></span>
              Procesando...
            </>
          ) : (
            'Procesar Capturas'
          )}
        </button>
      </div>
    </div>
  );
};
