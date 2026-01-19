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
import './InDriverImportPage.css';

type PageView = 'upload' | 'review';

export const InDriverImportPage: FC = () => {
  const [view, setView] = useState<PageView>('upload');
  const [importSuccess, setImportSuccess] = useState(false);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');
  const [validationError, setValidationError] = useState<string | null>(null);
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

    // Clear any previous validation error
    setValidationError(null);

    // Vehicle selection is required
    if (!selectedVehicleId) {
      setValidationError('Debes seleccionar un vehículo para importar los viajes.');
      return;
    }

    const selectedVehicle = vehicles.find((v) => v.id === selectedVehicleId);
    if (!selectedVehicle) {
      setValidationError('Vehículo no encontrado.');
      return;
    }

    // STRICT: Only allow import if vehicle has an assigned driver
    // No fallbacks to owner_id or logged-in user
    if (!selectedVehicle.assigned_driver_id) {
      setValidationError(
        'El vehículo seleccionado no tiene un conductor asignado. Asigna un conductor al vehículo primero en la sección de Vehículos.'
      );
      return;
    }

    // Use ONLY the assigned driver - no fallbacks
    const driverId = selectedVehicle.assigned_driver_id;

    // Pass selected vehicle ID for tracking
    const success = await importRides(driverId, selectedVehicleId);
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
  }, [user?.id, selectedVehicleId, vehicles, importRides, clearFiles, clearExtracted]);

  const handleBackToUpload = useCallback(() => {
    trackImportCancelled('review');
    setView('upload');
  }, []);

  return (
    <DashboardLayout>
      <div className="indriver-import-page">
        <div className="page-container">
          {/* Error Alert */}
          {(error || validationError) && (
            <div className="alert alert-error" role="alert">
              <span className="alert-icon">!</span>
              <span className="alert-message">{error || validationError}</span>
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
                    onChange={(e) => {
                      setSelectedVehicleId(e.target.value);
                      setValidationError(null); // Clear validation error on selection change
                    }}
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
                isExtracting={isExtracting}
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
