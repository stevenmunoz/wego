/**
 * InDriver Import Page
 *
 * Main page for importing ride data from InDriver screenshots/PDFs
 */

import { type FC, useState, useCallback } from 'react';
import {
  InDriverUploader,
  InDriverReviewTable,
  useInDriverExtract,
} from '../features/indriver-import';
import { useAuthStore } from '@/core/store/auth-store';
import { DashboardLayout } from '@/components/DashboardLayout';
import './InDriverImportPage.css';

type PageView = 'upload' | 'review';

export const InDriverImportPage: FC = () => {
  const [view, setView] = useState<PageView>('upload');
  const [importSuccess, setImportSuccess] = useState(false);
  const { user } = useAuthStore();

  const {
    files,
    extractedRides,
    isExtracting,
    isImporting,
    error,
    summary,
    addFiles,
    removeFile,
    clearFiles,
    extractAll,
    updateRide,
    removeRide,
    importRides,
    clearExtracted,
  } = useInDriverExtract();

  const handleProcess = useCallback(async () => {
    await extractAll();
    setView('review');
  }, [extractAll]);

  const handleImport = useCallback(async () => {
    if (!user?.id) {
      return;
    }
    const success = await importRides(user.id);
    if (success) {
      setImportSuccess(true);
      // Clear state after short delay
      setTimeout(() => {
        clearFiles();
        clearExtracted();
        setView('upload');
        setImportSuccess(false);
      }, 2000);
    }
  }, [user?.id, importRides, clearFiles, clearExtracted]);

  const handleBackToUpload = useCallback(() => {
    setView('upload');
  }, []);

  return (
    <DashboardLayout>
      <div className="indriver-import-page">
        <div className="page-container">
          {/* Error Alert */}
          {error && (
            <div className="alert alert-error" role="alert">
              <span className="alert-icon">!</span>
              <span className="alert-message">{error}</span>
            </div>
          )}

          {/* Success Alert */}
          {importSuccess && (
            <div className="alert alert-success" role="alert">
              <span className="alert-icon">✓</span>
              <span className="alert-message">
                Viajes importados correctamente!
              </span>
            </div>
          )}

          {/* Content */}
          {view === 'upload' ? (
            <InDriverUploader
              files={files}
              isProcessing={isExtracting}
              onAddFiles={addFiles}
              onRemoveFile={removeFile}
              onClearFiles={clearFiles}
              onProcess={handleProcess}
            />
          ) : (
            <InDriverReviewTable
              rides={extractedRides}
              summary={summary}
              isImporting={isImporting}
              onUpdateRide={updateRide}
              onRemoveRide={removeRide}
              onImport={handleImport}
              onBack={handleBackToUpload}
            />
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};
