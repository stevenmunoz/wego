/**
 * StepDatetime Component
 *
 * Date and time selection step
 */

import { type FC } from 'react';
import type { StepProps } from '../../types';
import { MESSAGES } from '../../constants';
import './Steps.css';

export const StepDatetime: FC<StepProps> = ({ formData, onUpdate, onNext }) => {
  const handleDateChange = (value: string) => {
    onUpdate({ date: value });
  };

  const handleTimeChange = (value: string) => {
    onUpdate({ time: value });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && formData.date && formData.time) {
      onNext();
    }
  };

  // Get today's date in YYYY-MM-DD format for max attribute
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="wizard-step">
      <div className="wizard-step-fields">
        <div className="wizard-step-field">
          <label className="wizard-field-label">{MESSAGES.DATE_LABEL}</label>
          <div className="wizard-input-with-icon">
            <svg
              className="wizard-input-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <input
              type="date"
              className="wizard-date-input wizard-input-has-icon"
              value={formData.date || ''}
              onChange={(e) => handleDateChange(e.target.value)}
              onKeyDown={handleKeyDown}
              max={today}
              autoFocus
            />
          </div>
        </div>
        <div className="wizard-step-field">
          <label className="wizard-field-label">{MESSAGES.TIME_LABEL}</label>
          <div className="wizard-input-with-icon">
            <svg
              className="wizard-input-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <input
              type="time"
              className="wizard-time-input wizard-input-has-icon"
              value={formData.time || ''}
              onChange={(e) => handleTimeChange(e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
