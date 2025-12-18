/**
 * Vehicle types and interfaces
 */

export type VehicleType = 'car' | 'suv' | 'van' | 'motorcycle';
export type VehicleStatus = 'active' | 'inactive' | 'maintenance' | 'pending_approval';
export type FuelType = 'gasoline' | 'diesel' | 'electric' | 'hybrid' | 'gas';

export interface Vehicle {
  id: string;
  driver_id: string;

  // Vehicle identification
  plate: string; // Colombian format: ABC-123
  brand: string; // e.g., "Toyota", "Chevrolet"
  model: string; // e.g., "Corolla", "Spark"
  year: number; // e.g., 2020
  color: string; // e.g., "Blanco", "Negro"

  // Vehicle classification
  vehicle_type: VehicleType;
  fuel_type: FuelType;

  // Capacity
  passenger_capacity: number; // Max passengers (excluding driver)
  luggage_capacity: number; // Luggage capacity in pieces

  // Special capabilities
  accepts_pets: boolean;
  accepts_wheelchairs: boolean;
  has_child_seat: boolean;
  has_air_conditioning: boolean;

  // Documents
  soat_expiry: Date | null; // SOAT insurance expiry
  tecnomecanica_expiry: Date | null; // Technical inspection expiry

  // Status
  status: VehicleStatus;
  is_primary: boolean; // Primary vehicle for the driver

  // Metadata
  created_at: Date;
  updated_at: Date;
  photo_url?: string; // Vehicle photo URL
  notes?: string; // Admin notes
}

export interface VehicleCreateInput {
  plate: string;
  brand: string;
  model: string;
  year: number;
  color: string;
  vehicle_type: VehicleType;
  fuel_type: FuelType;
  passenger_capacity: number;
  luggage_capacity?: number;
  accepts_pets?: boolean;
  accepts_wheelchairs?: boolean;
  has_child_seat?: boolean;
  has_air_conditioning?: boolean;
  soat_expiry?: string | null;
  tecnomecanica_expiry?: string | null;
  is_primary?: boolean;
  notes?: string;
  imageFile?: File; // Optional image file for upload
  soatFile?: File; // Optional SOAT document file for upload
  tecnomecanicaFile?: File; // Optional Tecnomecánica document file for upload
}

export interface VehicleUpdateInput extends Partial<VehicleCreateInput> {
  status?: VehicleStatus;
  photo_url?: string;
  soat_document_url?: string;
  tecnomecanica_document_url?: string;
}
