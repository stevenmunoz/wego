/**
 * WizardInput Component
 *
 * Large, touch-friendly text input for wizard steps
 */

import { type FC, type KeyboardEvent, useRef, useEffect } from 'react';
import './WizardUI.css';

interface WizardInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: 'text' | 'textarea';
  autoFocus?: boolean;
  onEnter?: () => void;
  maxLength?: number;
  disabled?: boolean;
}

export const WizardInput: FC<WizardInputProps> = ({
  value,
  onChange,
  placeholder = '',
  type = 'text',
  autoFocus = true,
  onEnter,
  maxLength,
  disabled = false,
}) => {
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && type !== 'textarea' && onEnter) {
      e.preventDefault();
      onEnter();
    }
  };

  if (type === 'textarea') {
    return (
      <textarea
        ref={inputRef as React.RefObject<HTMLTextAreaElement>}
        className="wizard-input wizard-textarea"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        disabled={disabled}
        rows={4}
      />
    );
  }

  return (
    <input
      ref={inputRef as React.RefObject<HTMLInputElement>}
      type="text"
      className="wizard-input"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={handleKeyDown}
      placeholder={placeholder}
      maxLength={maxLength}
      disabled={disabled}
    />
  );
};
