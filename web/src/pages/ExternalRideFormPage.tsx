/**
 * ExternalRideFormPage
 *
 * Public page for external ride registration
 * URL: /registrar-viaje/:driverSlug
 */

import { type FC } from 'react';
import { useParams } from 'react-router-dom';
import {
  PublicFormLayout,
  ExternalRideWizard,
  useDriverBySlug,
  MESSAGES,
} from '@/features/external-rides';
import '@/features/external-rides/components/layout/PublicFormLayout.css';

export const ExternalRideFormPage: FC = () => {
  const { driverSlug } = useParams<{ driverSlug: string }>();
  const { driver, isLoading, error } = useDriverBySlug(driverSlug);

  // Loading state
  if (isLoading) {
    return (
      <PublicFormLayout driver={null}>
        <div className="public-form-loading">
          <div className="public-form-loading-spinner" />
          <span className="public-form-loading-text">{MESSAGES.LOADING_DRIVER}</span>
        </div>
      </PublicFormLayout>
    );
  }

  // Error state (invalid slug or driver not found)
  if (error || !driver) {
    return (
      <PublicFormLayout driver={null}>
        <div className="public-form-error">
          <span className="public-form-error-icon">😕</span>
          <h2 className="public-form-error-title">Enlace no valido</h2>
          <p className="public-form-error-message">
            {error || MESSAGES.DRIVER_NOT_FOUND}
          </p>
        </div>
      </PublicFormLayout>
    );
  }

  // Main form
  return (
    <PublicFormLayout driver={driver}>
      <ExternalRideWizard driver={driver} />
    </PublicFormLayout>
  );
};
