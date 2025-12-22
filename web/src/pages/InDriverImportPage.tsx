/**
 * InDriver Import Page
 *
 * Main page for importing ride data from InDriver screenshots/PDFs
 */

import { type FC, useState, useCallback, useEffect, useRef } from 'react';
import {
  InDriverUploader,
  InDriverReviewTable,
  useInDriverExtract,
} from '../features/indriver-import';
import { useAuthStore } from '@/core/store/auth-store';
import { DashboardLayout } from '@/components/DashboardLayout';
import { useDriverVehicles } from '@/hooks/useDriverVehicles';
import { useAllVehicles } from '@/hooks/useAllVehicles';
import { trackImportCancelled } from '@/core/analytics';
import { config } from '@/core/config';
import './InDriverImportPage.css';

type PageView = 'upload' | 'review';

export const InDriverImportPage: FC = () => {
  const [view, setView] = useState<PageView>('upload');
  const [importSuccess, setImportSuccess] = useState(false);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');
  const user = useAuthStore((state) => state.user);
  const userRole = useAuthStore((state) => state.userRole);
  const isAdmin = userRole === 'admin';
  const successTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup timeout on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      if (successTimeoutRef.current) {
        clearTimeout(successTimeoutRef.current);
      }
    };
  }, []);

  // Fetch vehicles - use different hooks based on role
  const driverVehiclesHook = useDriverVehicles(user?.id);
  const allVehiclesHook = useAllVehicles();

  // Select the appropriate data based on role
  const vehicles = isAdmin ? allVehiclesHook.vehicles : driverVehiclesHook.vehicles;
  const isLoadingVehicles = isAdmin ? allVehiclesHook.isLoading : driverVehiclesHook.isLoading;

  // Auto-select primary vehicle when vehicles are loaded
  useEffect(() => {
    if (vehicles.length > 0 && !selectedVehicleId) {
      const primaryVehicle = vehicles.find((v) => v.is_primary);
      if (primaryVehicle) {
        setSelectedVehicleId(primaryVehicle.id);
      } else {
        // If no primary, select the first one
        setSelectedVehicleId(vehicles[0].id);
      }
    }
  }, [vehicles, selectedVehicleId]);

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

    // Determine the driver ID to save rides under
    // If admin selects a vehicle, use the vehicle owner's ID
    // Otherwise use the logged-in user's ID
    let driverId = user.id;
    if (isAdmin && selectedVehicleId) {
      const selectedVehicle = vehicles.find((v) => v.id === selectedVehicleId);
      if (selectedVehicle?.owner_id) {
        driverId = selectedVehicle.owner_id;
      }
    }

    // Pass selected vehicle ID for tracking
    const success = await importRides(driverId, selectedVehicleId || undefined);
    if (success) {
      setImportSuccess(true);
      // Clear any existing timeout before setting a new one
      if (successTimeoutRef.current) {
        clearTimeout(successTimeoutRef.current);
      }
      // Clear state after short delay
      successTimeoutRef.current = setTimeout(() => {
        clearFiles();
        clearExtracted();
        setView('upload');
        setImportSuccess(false);
      }, 2000);
    }
  }, [user?.id, isAdmin, selectedVehicleId, vehicles, importRides, clearFiles, clearExtracted]);

  const handleBackToUpload = useCallback(() => {
    trackImportCancelled('review');
    setView('upload');
  }, []);

  return (
    <DashboardLayout>
      <div className="indriver-import-page">
        <div className="page-container">
          {/* Backend Not Available Warning */}
          {!config.hasBackend && (
            <div className="alert alert-warning" role="alert">
              <span className="alert-icon">⚠️</span>
              <span className="alert-message">
                El servidor de procesamiento no está configurado. Esta función requiere un backend
                desplegado.
              </span>
            </div>
          )}

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
              <span className="alert-message">Viajes importados correctamente!</span>
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
            <>
              {/* Vehicle Selector */}
              {vehicles.length > 0 && (
                <div className="vehicle-selector-bar">
                  <label htmlFor="vehicle-select" className="vehicle-label">
                    Vehículo utilizado:
                  </label>
                  <select
                    id="vehicle-select"
                    className="vehicle-select"
                    value={selectedVehicleId}
                    onChange={(e) => setSelectedVehicleId(e.target.value)}
                    disabled={isImporting}
                  >
                    {vehicles.map((vehicle) => (
                      <option key={vehicle.id} value={vehicle.id}>
                        {vehicle.plate} - {vehicle.brand} {vehicle.model}
                        {vehicle.is_primary ? ' (Principal)' : ''}
                        {isAdmin && 'driver_name' in vehicle ? ` - ${vehicle.driver_name}` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              {vehicles.length === 0 && !isLoadingVehicles && (
                <div className="alert alert-warning" role="alert">
                  <span className="alert-icon">⚠️</span>
                  <span className="alert-message">
                    No tienes vehículos registrados. Los viajes se importarán sin asociar a un
                    vehículo.
                  </span>
                </div>
              )}
              <InDriverReviewTable
                rides={extractedRides}
                summary={summary}
                isImporting={isImporting}
                onUpdateRide={updateRide}
                onImport={handleImport}
                onBack={handleBackToUpload}
              />
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};
