/**
 * Vehicle types and interfaces
 *
 * Unified vehicle model supporting fleet management:
 * - owner_id: who owns/pays for the vehicle
 * - assigned_driver_id: who currently drives (optional, can change)
 * - weekly_rental_amount: rental rate for fleet vehicles (optional)
 */

export type VehicleType = 'car' | 'suv' | 'van' | 'motorcycle';
export type VehicleStatus = 'active' | 'inactive' | 'maintenance' | 'pending_approval';
export type FuelType = 'gasoline' | 'diesel' | 'electric' | 'hybrid' | 'gas';

export interface Vehicle {
  id: string;

  // Ownership (required)
  owner_id: string; // User who owns/pays for the vehicle

  // Driver assignment (optional - for fleet model)
  assigned_driver_id?: string; // Currently assigned driver

  // Rental (optional - for fleet model)
  weekly_rental_amount?: number; // Weekly rental rate in COP

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
  soat_document_url?: string; // SOAT document URL
  tecnomecanica_document_url?: string; // Tecnomecánica document URL

  // Status
  status: VehicleStatus;
  is_primary: boolean; // Primary vehicle for the owner

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
  // Fleet management (optional)
  weekly_rental_amount?: number;
  assigned_driver_id?: string;
  // File uploads
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
