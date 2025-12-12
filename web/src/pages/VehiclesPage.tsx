/**
 * Vehicles page - displays all driver vehicles
 */

import { useState } from 'react';
import { useAuthStore } from '@/core/store/auth-store';
import { DashboardLayout } from '@/components/DashboardLayout';
import { VehiclesTable } from '@/components/VehiclesTable';
import { VehicleForm } from '@/components/VehicleForm';
import { useDriverVehicles } from '@/hooks/useDriverVehicles';
import { uploadVehicleImage, compressImage, deleteVehicleImage } from '@/core/firebase';
import type { FirestoreVehicle } from '@/core/firebase';
import type { VehicleCreateInput } from '@/core/types';
import './VehiclesPage.css';

export const VehiclesPage = () => {
  const user = useAuthStore((state) => state.user);
  const [showForm, setShowForm] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<FirestoreVehicle | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    vehicles,
    isLoading,
    error,
    refetch,
    addVehicle,
    updateVehicle,
    deleteVehicle,
    setPrimaryVehicle,
  } = useDriverVehicles(user?.id);

  const handleAddVehicle = async (data: VehicleCreateInput) => {
    if (!user?.id) return;

    setIsSubmitting(true);

    try {
      // Extract imageFile from data
      const { imageFile, ...vehicleData } = data;

      // Create vehicle first
      const result = await addVehicle(vehicleData);

      if (result.success && result.vehicleId) {
        // If there's an image to upload
        if (imageFile) {
          // Compress image before uploading
          const compressedImage = await compressImage(imageFile);

          // Upload to Firebase Storage
          const uploadResult = await uploadVehicleImage(
            user.id,
            result.vehicleId,
            compressedImage
          );

          // Update vehicle with photo URL
          if (uploadResult.success && uploadResult.url) {
            await updateVehicle(result.vehicleId, { photo_url: uploadResult.url });
          }
        }

        setShowForm(false);
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
    setShowForm(true);
  };

  const handleUpdateVehicle = async (data: VehicleCreateInput) => {
    if (!user?.id || !editingVehicle) return;

    setIsSubmitting(true);

    try {
      // Extract imageFile from data
      const { imageFile, ...vehicleData } = data;

      // Update vehicle data first
      await updateVehicle(editingVehicle.id, vehicleData);

      // Handle image update if there's a new image
      if (imageFile) {
        // Delete old image if exists
        if (editingVehicle.photo_url) {
          await deleteVehicleImage(editingVehicle.photo_url);
        }

        // Compress and upload new image
        const compressedImage = await compressImage(imageFile);
        const uploadResult = await uploadVehicleImage(
          user.id,
          editingVehicle.id,
          compressedImage
        );

        // Update vehicle with new photo URL
        if (uploadResult.success && uploadResult.url) {
          await updateVehicle(editingVehicle.id, { photo_url: uploadResult.url });
        }
      }

      setShowForm(false);
      setEditingVehicle(null);
      await refetch();
    } catch (error) {
      console.error('[VehiclesPage] Error updating vehicle:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingVehicle(null);
  };

  return (
    <DashboardLayout>
      <div className="vehicles-page">
        <header className="page-header">
          <div className="page-header-content">
            <h1 className="page-title">Mis Vehículos</h1>
            <p className="page-subtitle">Administra los vehículos registrados para tus servicios</p>
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
          onAddClick={() => setShowForm(true)}
          onEditVehicle={handleEditVehicle}
          onDeleteVehicle={deleteVehicle}
          onSetPrimary={setPrimaryVehicle}
        />

        {showForm && (
          <div className="modal-overlay" onClick={handleCloseForm}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
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
