/**
 * GA4 Custom Events for WeGo
 *
 * Typed event tracking functions for all app features.
 * Each function maps to a specific user action in the app.
 */

import { trackEvent } from './gtag';

// ============================================================================
// AUTHENTICATION EVENTS
// ============================================================================

type AuthMethod = 'email' | 'google';

export function trackLogin(method: AuthMethod): void {
  trackEvent('login', { method });
}

export function trackSignup(method: AuthMethod): void {
  trackEvent('sign_up', { method });
}

export function trackLogout(): void {
  trackEvent('logout');
}

// ============================================================================
// RIDES DASHBOARD EVENTS
// ============================================================================

type DateFilterValue =
  | 'all'
  | 'today'
  | 'yesterday'
  | 'last7days'
  | 'last30days'
  | 'thisMonth'
  | 'lastMonth';

type StatusFilterValue =
  | 'all'
  | 'completed'
  | 'cancelled'
  | 'cancelled_by_passenger'
  | 'cancelled_by_driver';

export function trackRidesDateFiltered(filterValue: DateFilterValue): void {
  trackEvent('rides_filtered', {
    filter_type: 'date',
    filter_value: filterValue,
  });
}

export function trackRidesStatusFiltered(filterValue: StatusFilterValue): void {
  trackEvent('rides_filtered', {
    filter_type: 'status',
    filter_value: filterValue,
  });
}

type RideEditableField =
  | 'date'
  | 'time'
  | 'duration'
  | 'distance'
  | 'base_fare'
  | 'total_paid'
  | 'service_commission'
  | 'service_tax'
  | 'net_earnings'
  | 'status'
  | 'driver'
  | 'vehicle'
  | 'source';

export function trackRideEdited(fieldName: RideEditableField): void {
  trackEvent('ride_edited', { field_name: fieldName });
}

export function trackRidesPaginationChanged(
  pageSize: number,
  pageNumber: number
): void {
  trackEvent('pagination_changed', {
    page_size: pageSize,
    page_number: pageNumber,
  });
}

// ============================================================================
// INDRIVER IMPORT EVENTS
// ============================================================================

export function trackImportStarted(fileCount: number, fileTypes: string[]): void {
  trackEvent('import_started', {
    file_count: fileCount,
    file_types: fileTypes.join(','),
  });
}

export function trackExtractionCompleted(
  ridesExtracted: number,
  durationMs: number
): void {
  trackEvent('extraction_completed', {
    rides_extracted: ridesExtracted,
    duration_ms: durationMs,
  });
}

export function trackImportCompleted(ridesImported: number): void {
  trackEvent('import_completed', { rides_imported: ridesImported });
}

type ImportStep = 'upload' | 'review';

export function trackImportCancelled(step: ImportStep): void {
  trackEvent('import_cancelled', { step });
}

// ============================================================================
// VEHICLES EVENTS
// ============================================================================

type VehicleType = 'car' | 'suv' | 'van' | 'motorcycle';

export function trackVehicleCreated(
  vehicleType: VehicleType,
  hasPhoto: boolean
): void {
  trackEvent('vehicle_created', {
    vehicle_type: vehicleType,
    has_photo: hasPhoto,
  });
}

export function trackVehicleEdited(fieldsChanged: string[]): void {
  trackEvent('vehicle_edited', {
    fields_changed: fieldsChanged.join(','),
    fields_count: fieldsChanged.length,
  });
}

export function trackVehicleDeleted(): void {
  trackEvent('vehicle_deleted');
}

export function trackVehicleSetPrimary(): void {
  trackEvent('vehicle_set_primary');
}

export function trackVehiclePhotoUploaded(fileSizeKb: number): void {
  trackEvent('vehicle_photo_uploaded', { file_size_kb: fileSizeKb });
}

// ============================================================================
// NAVIGATION EVENTS
// ============================================================================

type PageName =
  | 'home'
  | 'login'
  | 'register'
  | 'dashboard'
  | 'vehicles'
  | 'indriver_import'
  | 'chat'
  | 'conversations'
  | 'users'
  | 'finances'
  | 'external_ride';

export function trackPageViewed(pageName: PageName): void {
  trackEvent('page_viewed', { page_name: pageName });
}
