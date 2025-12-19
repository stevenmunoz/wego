/**
 * Vehicles page - displays all driver vehicles
 * Admin view: Shows all vehicles across all drivers with assignment options
 * Driver view: Shows only the logged-in driver's vehicles
 */

import { useState } from 'react';
import { useAuthStore } from '@/core/store/auth-store';
import { DashboardLayout } from '@/components/DashboardLayout';
import { VehiclesTable } from '@/components/VehiclesTable';
import { VehicleForm } from '@/components/VehicleForm';
import { useDriverVehicles } from '@/hooks/useDriverVehicles';
import { useAllVehicles } from '@/hooks/useAllVehicles';
import {
  uploadVehicleImage,
  compressImage,
  deleteStorageFile,
  uploadVehicleDocument,
} from '@/core/firebase';
import type { FirestoreVehicle, DriverWithUser } from '@/core/firebase';
import type { VehicleCreateInput } from '@/core/types';
import './VehiclesPage.css';

export const VehiclesPage = () => {
  const user = useAuthStore((state) => state.user);
  const userRole = useAuthStore((state) => state.userRole);
  const isAdmin = userRole === 'admin';

  const [showForm, setShowForm] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<FirestoreVehicle | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedDriverId, setSelectedDriverId] = useState<string>('');

  // Use different hooks based on role
  const driverVehiclesHook = useDriverVehicles(user?.id);
  const allVehiclesHook = useAllVehicles();

  // Select the appropriate data based on role
  const vehicles: FirestoreVehicle[] = isAdmin
    ? allVehiclesHook.vehicles
    : driverVehiclesHook.vehicles;
  const drivers: DriverWithUser[] = isAdmin ? allVehiclesHook.drivers : [];
  const isLoading = isAdmin ? allVehiclesHook.isLoading : driverVehiclesHook.isLoading;
  const error = isAdmin ? allVehiclesHook.error : driverVehiclesHook.error;
  const refetch = isAdmin ? allVehiclesHook.refetch : driverVehiclesHook.refetch;

  const handleAddVehicle = async (data: VehicleCreateInput) => {
    // For admin: they are the owner, selected driver is assigned
    // For driver: they are both owner and driver
    const ownerId = user?.id;
    if (!ownerId) return;

    setIsSubmitting(true);

    try {
      const { imageFile, soatFile, tecnomecanicaFile, ...vehicleData } = data;

      // If admin selected a driver, add it as assigned_driver_id
      if (isAdmin && selectedDriverId) {
        vehicleData.assigned_driver_id = selectedDriverId;
      }

      // Create vehicle using the appropriate hook
      const result = isAdmin
        ? await allVehiclesHook.addVehicle(ownerId, vehicleData)
        : await driverVehiclesHook.addVehicle(vehicleData);

      if (result.success && result.vehicleId) {
        const updates: Record<string, string> = {};

        // Upload vehicle image (now uses vehicleId only)
        if (imageFile) {
          const compressedImage = await compressImage(imageFile);
          const uploadResult = await uploadVehicleImage(result.vehicleId, compressedImage);
          if (uploadResult.success && uploadResult.url) {
            updates.photo_url = uploadResult.url;
          }
        }

        // Upload SOAT document (now uses vehicleId only)
        if (soatFile) {
          const soatResult = await uploadVehicleDocument(result.vehicleId, 'soat', soatFile);
          if (soatResult.success && soatResult.url) {
            updates.soat_document_url = soatResult.url;
          }
        }

        // Upload Tecnomecánica document (now uses vehicleId only)
        if (tecnomecanicaFile) {
          const tecnoResult = await uploadVehicleDocument(
            result.vehicleId,
            'tecnomecanica',
            tecnomecanicaFile
          );
          if (tecnoResult.success && tecnoResult.url) {
            updates.tecnomecanica_document_url = tecnoResult.url;
          }
        }

        // Update vehicle with uploaded file URLs
        if (Object.keys(updates).length > 0) {
          if (isAdmin) {
            await allVehiclesHook.updateVehicle(result.vehicleId, updates);
          } else {
            await driverVehiclesHook.updateVehicle(result.vehicleId, updates);
          }
        }

        setShowForm(false);
        setSelectedDriverId('');
        await refetch();
      }
    } catch (error) {
      console.error('[VehiclesPage] Error adding vehicle:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditVehicle = (vehicle: FirestoreVehicle) => {
    setEditingVehicle(vehicle);
    if (isAdmin) {
      // For admin editing, pre-select the current assigned driver (if any)
      setSelectedDriverId(vehicle.assigned_driver_id || '');
    }
    setShowForm(true);
  };

  const handleUpdateVehicle = async (data: VehicleCreateInput) => {
    if (!editingVehicle) return;

    setIsSubmitting(true);

    try {
      const { imageFile, soatFile, tecnomecanicaFile, ...vehicleData } = data;

      // Update vehicle using the appropriate hook (now uses vehicleId only)
      if (isAdmin) {
        await allVehiclesHook.updateVehicle(editingVehicle.id, vehicleData);

        // Handle driver assignment change (admin only)
        const currentDriverId = editingVehicle.assigned_driver_id || '';
        if (selectedDriverId !== currentDriverId) {
          if (selectedDriverId) {
            // Assign new driver
            await allVehiclesHook.assignDriver(editingVehicle.id, selectedDriverId);
          } else {
            // Unassign current driver
            await allVehiclesHook.unassignDriver(editingVehicle.id);
          }
        }
      } else {
        await driverVehiclesHook.updateVehicle(editingVehicle.id, vehicleData);
      }

      const updates: Record<string, string> = {};

      // Handle vehicle image upload (now uses vehicleId only)
      if (imageFile) {
        if (editingVehicle.photo_url) {
          await deleteStorageFile(editingVehicle.photo_url);
        }

        const compressedImage = await compressImage(imageFile);
        const uploadResult = await uploadVehicleImage(editingVehicle.id, compressedImage);

        if (uploadResult.success && uploadResult.url) {
          updates.photo_url = uploadResult.url;
        }
      }

      // Handle SOAT document upload (now uses vehicleId only)
      if (soatFile) {
        if (editingVehicle.soat_document_url) {
          await deleteStorageFile(editingVehicle.soat_document_url);
        }

        const soatResult = await uploadVehicleDocument(editingVehicle.id, 'soat', soatFile);

        if (soatResult.success && soatResult.url) {
          updates.soat_document_url = soatResult.url;
        }
      }

      // Handle Tecnomecánica document upload (now uses vehicleId only)
      if (tecnomecanicaFile) {
        if (editingVehicle.tecnomecanica_document_url) {
          await deleteStorageFile(editingVehicle.tecnomecanica_document_url);
        }

        const tecnoResult = await uploadVehicleDocument(
          editingVehicle.id,
          'tecnomecanica',
          tecnomecanicaFile
        );

        if (tecnoResult.success && tecnoResult.url) {
          updates.tecnomecanica_document_url = tecnoResult.url;
        }
      }

      // Update vehicle with uploaded file URLs
      if (Object.keys(updates).length > 0) {
        if (isAdmin) {
          await allVehiclesHook.updateVehicle(editingVehicle.id, updates);
        } else {
          await driverVehiclesHook.updateVehicle(editingVehicle.id, updates);
        }
      }

      setShowForm(false);
      setEditingVehicle(null);
      setSelectedDriverId('');
      await refetch();
    } catch (error) {
      console.error('[VehiclesPage] Error updating vehicle:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteVehicle = async (vehicleId: string) => {
    // Both admin and driver now use the same simplified delete (vehicleId only)
    if (isAdmin) {
      await allVehiclesHook.deleteVehicle(vehicleId);
    } else {
      await driverVehiclesHook.deleteVehicle(vehicleId);
    }
  };

  const handleSetPrimary = async (vehicleId: string) => {
    // Both use the same simplified set primary (vehicleId only)
    await driverVehiclesHook.setPrimaryVehicle(vehicleId);
  };

  const handleAssignDriver = async (vehicleId: string, driverId: string) => {
    if (!isAdmin) return;
    await allVehiclesHook.assignDriver(vehicleId, driverId);
  };

  const handleUnassignDriver = async (vehicleId: string) => {
    if (!isAdmin) return;
    await allVehiclesHook.unassignDriver(vehicleId);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingVehicle(null);
    setSelectedDriverId('');
  };

  return (
    <DashboardLayout>
      <div className="vehicles-page">
        <header className="page-header">
          <div className="page-header-top">
            <div className="page-header-title">
              <h1 className="page-title">
                {isAdmin ? 'Gestión de Vehículos' : 'Mis Vehículos'}
              </h1>
              <p className="page-subtitle">
                {isAdmin
                  ? 'Administra todos los vehículos de la flota'
                  : 'Administra los vehículos registrados para tus servicios'}
              </p>
            </div>
            <div className="page-header-actions">
              <button type="button" className="btn btn-outline" onClick={refetch}>
                <span>🔄</span> Actualizar
              </button>
              <button type="button" className="btn btn-primary" onClick={() => setShowForm(true)}>
                <span>+</span> Agregar Vehículo
              </button>
            </div>
          </div>
        </header>

        {error && (
          <div className="error-banner">
            <span className="error-icon">!</span>
            <span>{error}</span>
            <button type="button" className="btn-retry" onClick={refetch}>
              Reintentar
            </button>
          </div>
        )}

        <VehiclesTable
          vehicles={vehicles}
          isLoading={isLoading}
          isAdminView={isAdmin}
          drivers={drivers}
          onAddClick={() => setShowForm(true)}
          onEditVehicle={handleEditVehicle}
          onDeleteVehicle={handleDeleteVehicle}
          onSetPrimary={handleSetPrimary}
          onAssignDriver={isAdmin ? handleAssignDriver : undefined}
          onUnassignDriver={isAdmin ? handleUnassignDriver : undefined}
        />

        {showForm && (
          <div className="modal-overlay" onClick={handleCloseForm}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              {/* Driver selector for admin (add or edit) */}
              {isAdmin && (
                <>
                  <div className="driver-selector-header">
                    <h2>{editingVehicle ? 'Editar Vehículo' : 'Agregar Vehículo'}</h2>
                    <button
                      type="button"
                      className="btn-close"
                      onClick={handleCloseForm}
                      aria-label="Cerrar"
                    >
                      &times;
                    </button>
                  </div>
                  <div className="driver-selector-content">
                    <label htmlFor="driver-select">Conductor asignado:</label>
                    <select
                      id="driver-select"
                      value={selectedDriverId}
                      onChange={(e) => setSelectedDriverId(e.target.value)}
                    >
                      <option value="">Sin asignar</option>
                      {drivers.map((driver) => (
                        <option key={driver.id} value={driver.id}>
                          {driver.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}
              <VehicleForm
                vehicle={editingVehicle || undefined}
                onSubmit={editingVehicle ? handleUpdateVehicle : handleAddVehicle}
                onCancel={handleCloseForm}
                isSubmitting={isSubmitting}
              />
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};
