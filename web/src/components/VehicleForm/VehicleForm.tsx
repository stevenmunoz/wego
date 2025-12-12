/**
 * Vehicle Form Component
 *
 * Form for adding/editing vehicles with validation
 */

import { type FC, useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { VehicleCreateInput } from '@/core/types';
import type { FirestoreVehicle } from '@/core/firebase';
import './VehicleForm.css';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const currentYear = new Date().getFullYear();

const vehicleSchema = z.object({
  plate: z
    .string()
    .min(6, 'La placa debe tener al menos 6 caracteres')
    .regex(/^[A-Za-z]{3}-?\d{3}$/, 'Formato de placa invalido (ej: ABC123 o ABC-123)'),
  brand: z.string().min(2, 'La marca es requerida'),
  model: z.string().min(1, 'El modelo es requerido'),
  year: z.coerce
    .number()
    .min(1990, 'El año debe ser mayor a 1990')
    .max(currentYear + 1, 'Año inválido'),
  color: z.string().min(2, 'El color es requerido'),
  vehicle_type: z.enum(['car', 'suv', 'van', 'motorcycle']),
  fuel_type: z.enum(['gasoline', 'diesel', 'electric', 'hybrid', 'gas']),
  passenger_capacity: z.coerce.number().min(1, 'Mínimo 1 pasajero').max(15, 'Máximo 15 pasajeros'),
  luggage_capacity: z.coerce.number().min(0).max(10).optional(),
  accepts_pets: z.boolean().optional(),
  accepts_wheelchairs: z.boolean().optional(),
  has_child_seat: z.boolean().optional(),
  has_air_conditioning: z.boolean().optional(),
  soat_expiry: z.string().optional(),
  tecnomecanica_expiry: z.string().optional(),
  is_primary: z.boolean().optional(),
  notes: z.string().optional(),
});

type VehicleFormData = z.infer<typeof vehicleSchema>;

interface VehicleFormProps {
  vehicle?: FirestoreVehicle;
  onSubmit: (data: VehicleCreateInput) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

// Convert Firestore Timestamp to date string for input
const timestampToDateString = (timestamp: { toDate: () => Date } | null): string => {
  if (!timestamp) return '';
  const date = timestamp.toDate();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const VehicleForm: FC<VehicleFormProps> = ({
  vehicle,
  onSubmit,
  onCancel,
  isSubmitting = false,
}) => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(vehicle?.photo_url || null);
  const [imageError, setImageError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<VehicleFormData>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: vehicle
      ? {
          plate: vehicle.plate,
          brand: vehicle.brand,
          model: vehicle.model,
          year: vehicle.year,
          color: vehicle.color,
          vehicle_type: vehicle.vehicle_type,
          fuel_type: vehicle.fuel_type,
          passenger_capacity: vehicle.passenger_capacity,
          luggage_capacity: vehicle.luggage_capacity,
          accepts_pets: vehicle.accepts_pets,
          accepts_wheelchairs: vehicle.accepts_wheelchairs,
          has_child_seat: vehicle.has_child_seat,
          has_air_conditioning: vehicle.has_air_conditioning,
          soat_expiry: timestampToDateString(vehicle.soat_expiry),
          tecnomecanica_expiry: timestampToDateString(vehicle.tecnomecanica_expiry),
          is_primary: vehicle.is_primary,
          notes: vehicle.notes,
        }
      : {
          vehicle_type: 'car',
          fuel_type: 'gasoline',
          passenger_capacity: 4,
          luggage_capacity: 2,
          accepts_pets: false,
          accepts_wheelchairs: false,
          has_child_seat: false,
          has_air_conditioning: true,
          is_primary: false,
        },
  });

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setImageError(null);

    if (!file) {
      return;
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      setImageError('Tipo de archivo no permitido. Use JPG, PNG o WebP.');
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      setImageError('El archivo es muy grande. Máximo 5MB.');
      return;
    }

    setImageFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(vehicle?.photo_url || null);
    setImageError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFormSubmit = async (data: VehicleFormData) => {
    const submitData: VehicleCreateInput = {
      ...data,
      imageFile: imageFile || undefined,
    };
    await onSubmit(submitData);
  };

  return (
    <div className="vehicle-form-container">
      <div className="form-header">
        <h2>{vehicle ? 'Editar Vehículo' : 'Agregar Vehículo'}</h2>
        <button type="button" className="btn-close" onClick={onCancel} aria-label="Cerrar">
          &times;
        </button>
      </div>

      <form onSubmit={handleSubmit(handleFormSubmit)} className="vehicle-form">
        {/* Vehicle Photo */}
        <fieldset className="form-section">
          <legend>Foto del Vehículo</legend>

          <div className="image-upload-container">
            {imagePreview ? (
              <div className="image-preview-wrapper">
                <img src={imagePreview} alt="Vista previa del vehículo" className="image-preview" />
                <button
                  type="button"
                  className="btn-remove-image"
                  onClick={handleRemoveImage}
                  title="Eliminar imagen"
                >
                  &times;
                </button>
              </div>
            ) : (
              <div
                className="image-upload-placeholder"
                onClick={() => fileInputRef.current?.click()}
              >
                <span className="upload-icon">📷</span>
                <span className="upload-text">Haz clic para subir una foto</span>
                <span className="upload-hint">JPG, PNG o WebP (máx. 5MB)</span>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleImageSelect}
              className="image-input"
              aria-label="Seleccionar imagen"
            />

            {imagePreview && (
              <button
                type="button"
                className="btn btn-outline btn-change-image"
                onClick={() => fileInputRef.current?.click()}
              >
                Cambiar imagen
              </button>
            )}

            {imageError && <span className="error-message">{imageError}</span>}
          </div>
        </fieldset>

        {/* Vehicle Identification */}
        <fieldset className="form-section">
          <legend>Identificación del Vehículo</legend>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="plate">Placa *</label>
              <input
                id="plate"
                type="text"
                placeholder="ABC123"
                {...register('plate')}
                className={errors.plate ? 'error' : ''}
              />
              {errors.plate && <span className="error-message">{errors.plate.message}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="year">Año *</label>
              <input
                id="year"
                type="number"
                min="1990"
                max={currentYear + 1}
                placeholder={String(currentYear)}
                {...register('year')}
                className={errors.year ? 'error' : ''}
              />
              {errors.year && <span className="error-message">{errors.year.message}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="brand">Marca *</label>
              <input
                id="brand"
                type="text"
                placeholder="Toyota, Chevrolet, etc."
                {...register('brand')}
                className={errors.brand ? 'error' : ''}
              />
              {errors.brand && <span className="error-message">{errors.brand.message}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="model">Modelo *</label>
              <input
                id="model"
                type="text"
                placeholder="Corolla, Spark, etc."
                {...register('model')}
                className={errors.model ? 'error' : ''}
              />
              {errors.model && <span className="error-message">{errors.model.message}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="color">Color *</label>
              <input
                id="color"
                type="text"
                placeholder="Blanco, Negro, Gris, etc."
                {...register('color')}
                className={errors.color ? 'error' : ''}
              />
              {errors.color && <span className="error-message">{errors.color.message}</span>}
            </div>
          </div>
        </fieldset>

        {/* Vehicle Classification */}
        <fieldset className="form-section">
          <legend>Clasificación</legend>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="vehicle_type">Tipo de Vehículo *</label>
              <select id="vehicle_type" {...register('vehicle_type')}>
                <option value="car">Automóvil</option>
                <option value="suv">Camioneta</option>
                <option value="van">Van</option>
                <option value="motorcycle">Motocicleta</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="fuel_type">Tipo de Combustible *</label>
              <select id="fuel_type" {...register('fuel_type')}>
                <option value="gasoline">Gasolina</option>
                <option value="diesel">Diesel</option>
                <option value="electric">Eléctrico</option>
                <option value="hybrid">Híbrido</option>
                <option value="gas">Gas</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="passenger_capacity">Capacidad de Pasajeros *</label>
              <input
                id="passenger_capacity"
                type="number"
                min="1"
                max="15"
                {...register('passenger_capacity')}
                className={errors.passenger_capacity ? 'error' : ''}
              />
              {errors.passenger_capacity && (
                <span className="error-message">{errors.passenger_capacity.message}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="luggage_capacity">Capacidad de Equipaje (piezas)</label>
              <input
                id="luggage_capacity"
                type="number"
                min="0"
                max="10"
                {...register('luggage_capacity')}
              />
            </div>
          </div>
        </fieldset>

        {/* Capabilities */}
        <fieldset className="form-section">
          <legend>Capacidades</legend>

          <div className="checkbox-group">
            <label className="checkbox-label">
              <input type="checkbox" {...register('accepts_pets')} />
              <span>Acepta mascotas</span>
            </label>

            <label className="checkbox-label">
              <input type="checkbox" {...register('accepts_wheelchairs')} />
              <span>Acepta sillas de ruedas</span>
            </label>

            <label className="checkbox-label">
              <input type="checkbox" {...register('has_child_seat')} />
              <span>Tiene silla para niños</span>
            </label>

            <label className="checkbox-label">
              <input type="checkbox" {...register('has_air_conditioning')} />
              <span>Tiene aire acondicionado</span>
            </label>

            <label className="checkbox-label">
              <input type="checkbox" {...register('is_primary')} />
              <span>Vehículo principal</span>
            </label>
          </div>
        </fieldset>

        {/* Documents */}
        <fieldset className="form-section">
          <legend>Documentos</legend>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="soat_expiry">Vencimiento SOAT</label>
              <input id="soat_expiry" type="date" {...register('soat_expiry')} />
            </div>

            <div className="form-group">
              <label htmlFor="tecnomecanica_expiry">Vencimiento Tecnomecánica</label>
              <input id="tecnomecanica_expiry" type="date" {...register('tecnomecanica_expiry')} />
            </div>
          </div>
        </fieldset>

        {/* Notes */}
        <fieldset className="form-section">
          <legend>Notas</legend>

          <div className="form-group">
            <textarea
              id="notes"
              rows={3}
              placeholder="Notas adicionales sobre el vehículo..."
              {...register('notes')}
            />
          </div>
        </fieldset>

        {/* Actions */}
        <div className="form-actions">
          <button type="button" className="btn btn-secondary" onClick={onCancel}>
            Cancelar
          </button>
          <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
            {isSubmitting ? 'Guardando...' : vehicle ? 'Guardar Cambios' : 'Agregar Vehículo'}
          </button>
        </div>
      </form>
    </div>
  );
};
