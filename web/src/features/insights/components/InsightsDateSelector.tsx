/**
 * InsightsDateSelector Component
 *
 * A date picker that allows selecting a date for viewing insights.
 * Defaults to yesterday and restricts future dates.
 * Uses the SingleDatePicker component for consistent dropdown-style selection.
 */

import { type FC } from 'react';
import { SingleDatePicker } from '@/components/SingleDatePicker';

interface InsightsDateSelectorProps {
  value: Date;
  onChange: (date: Date) => void;
}

/**
 * Get yesterday's date as max selectable date
 */
function getYesterday(): Date {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(0, 0, 0, 0);
  return yesterday;
}

export const InsightsDateSelector: FC<InsightsDateSelectorProps> = ({ value, onChange }) => {
  return (
    <SingleDatePicker
      label="Fecha:"
      value={value}
      onChange={onChange}
      max={getYesterday()}
    />
  );
};
