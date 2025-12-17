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
import { useAllVehicles, type VehicleWithDriver } from '@/hooks/useAllVehicles';
import { uploadVehicleImage, compressImage, deleteVehicleImage } from '@/core/firebase';
import type { FirestoreVehicle, FirestoreDriver } from '@/core/firebase';
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
  const vehicles: (FirestoreVehicle | VehicleWithDriver)[] = isAdmin
    ? allVehiclesHook.vehicles
    : driverVehiclesHook.vehicles;
  const drivers: FirestoreDriver[] = isAdmin ? allVehiclesHook.drivers : [];
  const isLoading = isAdmin ? allVehiclesHook.isLoading : driverVehiclesHook.isLoading;
  const error = isAdmin ? allVehiclesHook.error : driverVehiclesHook.error;
  const refetch = isAdmin ? allVehiclesHook.refetch : driverVehiclesHook.refetch;

  const handleAddVehicle = async (data: VehicleCreateInput) => {
    // For admin, use selected driver; for driver, use their own ID
    const targetDriverId = isAdmin ? selectedDriverId : user?.id;
    if (!targetDriverId) return;

    setIsSubmitting(true);

    try {
      const { imageFile, ...vehicleData } = data;

      // Create vehicle using the appropriate hook
      const result = isAdmin
        ? await allVehiclesHook.addVehicle(targetDriverId, vehicleData)
        : await driverVehiclesHook.addVehicle(vehicleData);

      if (result.success && result.vehicleId) {
        if (imageFile) {
          const compressedImage = await compressImage(imageFile);
          const uploadResult = await uploadVehicleImage(
            targetDriverId,
            result.vehicleId,
            compressedImage
          );

          if (uploadResult.success && uploadResult.url) {
            if (isAdmin) {
              await allVehiclesHook.updateVehicle(targetDriverId, result.vehicleId, {
                photo_url: uploadResult.url,
              });
            } else {
              await driverVehiclesHook.updateVehicle(result.vehicleId, {
                photo_url: uploadResult.url,
              });
            }
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
      setSelectedDriverId(vehicle.driver_id);
    }
    setShowForm(true);
  };

  const handleUpdateVehicle = async (data: VehicleCreateInput) => {
    if (!editingVehicle) return;

    const originalDriverId = editingVehicle.driver_id;
    const newDriverId = isAdmin ? selectedDriverId : originalDriverId;
    setIsSubmitting(true);

    try {
      const { imageFile, ...vehicleData } = data;

      // Check if driver changed (admin only)
      if (isAdmin && newDriverId !== originalDriverId) {
        // Reassign vehicle to new driver first
        await allVehiclesHook.reassignVehicle(originalDriverId, newDriverId, editingVehicle.id);
      }

      // Update vehicle using the appropriate hook
      if (isAdmin) {
        await allVehiclesHook.updateVehicle(newDriverId, editingVehicle.id, vehicleData);
      } else {
        await driverVehiclesHook.updateVehicle(editingVehicle.id, vehicleData);
      }

      if (imageFile) {
        if (editingVehicle.photo_url) {
          await deleteVehicleImage(editingVehicle.photo_url);
        }

        const compressedImage = await compressImage(imageFile);
        const uploadResult = await uploadVehicleImage(
          newDriverId,
          editingVehicle.id,
          compressedImage
        );

        if (uploadResult.success && uploadResult.url) {
          if (isAdmin) {
            await allVehiclesHook.updateVehicle(newDriverId, editingVehicle.id, {
              photo_url: uploadResult.url,
            });
          } else {
            await driverVehiclesHook.updateVehicle(editingVehicle.id, {
              photo_url: uploadResult.url,
            });
          }
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
    const vehicle = vehicles.find((v) => v.id === vehicleId);
    if (!vehicle) return;

    if (isAdmin) {
      await allVehiclesHook.deleteVehicle(vehicle.driver_id, vehicleId);
    } else {
      await driverVehiclesHook.deleteVehicle(vehicleId);
    }
  };

  const handleSetPrimary = async (vehicleId: string) => {
    const vehicle = vehicles.find((v) => v.id === vehicleId);
    if (!vehicle) return;

    if (isAdmin) {
      await allVehiclesHook.setPrimaryVehicle(vehicle.driver_id, vehicleId);
    } else {
      await driverVehiclesHook.setPrimaryVehicle(vehicleId);
    }
  };

  const handleReassignVehicle = async (vehicleId: string, newDriverId: string) => {
    const vehicle = vehicles.find((v) => v.id === vehicleId);
    if (!vehicle || !isAdmin) return;

    await allVehiclesHook.reassignVehicle(vehicle.driver_id, newDriverId, vehicleId);
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
          <div className="page-header-content">
            <h1 className="page-title">{isAdmin ? 'Gestión de Vehículos' : 'Mis Vehículos'}</h1>
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
          onReassignVehicle={isAdmin ? handleReassignVehicle : undefined}
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
                    <label htmlFor="driver-select">
                      {editingVehicle ? 'Conductor asignado:' : 'Asignar a conductor:'}
                    </label>
                    <select
                      id="driver-select"
                      value={selectedDriverId}
                      onChange={(e) => setSelectedDriverId(e.target.value)}
                      required
                    >
                      {!editingVehicle && <option value="">Seleccionar conductor...</option>}
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
                isSubmitting={isSubmitting || (isAdmin && !editingVehicle && !selectedDriverId)}
              />
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};
