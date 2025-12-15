/**
 * Form Options and Labels in Spanish (Colombia)
 *
 * All user-facing text for the external ride registration form
 */

import type { RadioOption, WizardStep, StepConfig } from '../types';

// ============================================================================
// RADIO OPTIONS
// ============================================================================

export const REQUEST_SOURCE_OPTIONS: RadioOption[] = [
  { value: 'whatsapp', label: 'WhatsApp', icon: '💬' },
  { value: 'phone', label: 'Llamada telefonica', icon: '📞' },
  { value: 'referral', label: 'Referido', icon: '👥' },
  { value: 'other', label: 'Otro', icon: '📝' },
];

export const TRIP_REASON_OPTIONS: RadioOption[] = [
  { value: 'personal', label: 'Personal', icon: '🏠' },
  { value: 'work', label: 'Trabajo', icon: '💼' },
  { value: 'emergency', label: 'Emergencia', icon: '🚨' },
  { value: 'other', label: 'Otro', icon: '📝' },
];

export const TIME_OF_DAY_OPTIONS: RadioOption[] = [
  { value: 'morning', label: 'Mañana', description: '6:00 AM - 12:00 PM', icon: '🌅' },
  { value: 'afternoon', label: 'Tarde', description: '12:00 PM - 6:00 PM', icon: '☀️' },
  { value: 'evening', label: 'Noche', description: '6:00 PM - 10:00 PM', icon: '🌆' },
  { value: 'night', label: 'Madrugada', description: '10:00 PM - 6:00 AM', icon: '🌙' },
];

export const PAYMENT_METHOD_OPTIONS: RadioOption[] = [
  { value: 'cash', label: 'Efectivo', icon: '💵' },
  { value: 'nequi', label: 'Nequi', icon: '📱' },
  { value: 'daviplata', label: 'Daviplata', icon: '📱' },
  { value: 'bancolombia', label: 'Bancolombia', icon: '🏦' },
  { value: 'other', label: 'Otro', icon: '💳' },
];

// ============================================================================
// STEP CONFIGURATION
// ============================================================================

export const STEP_ORDER: WizardStep[] = [
  'datetime',
  'origin',
  'destination',
  'fare',
  'request_source',
  'trip_reason',
  'time_of_day',
  'is_recurring',
  'payment_method',
  'tip',
  'comments',
  'confirmation',
  'success',
];

export const STEP_CONFIG: Record<WizardStep, StepConfig> = {
  datetime: {
    id: 'datetime',
    question: '¿Cuando fue el viaje?',
    required: true,
    canSkip: false,
  },
  origin: {
    id: 'origin',
    question: '¿Donde recogiste al pasajero?',
    required: true,
    canSkip: false,
  },
  destination: {
    id: 'destination',
    question: '¿A donde lo llevaste?',
    required: true,
    canSkip: false,
  },
  fare: {
    id: 'fare',
    question: '¿Cuanto cobraste por el viaje?',
    required: true,
    canSkip: false,
  },
  request_source: {
    id: 'request_source',
    question: '¿Como te contacto el pasajero?',
    required: true,
    canSkip: false,
  },
  trip_reason: {
    id: 'trip_reason',
    question: '¿Cual fue el motivo del viaje?',
    required: true,
    canSkip: false,
  },
  time_of_day: {
    id: 'time_of_day',
    question: '¿En que horario fue el viaje?',
    required: true,
    canSkip: false,
  },
  is_recurring: {
    id: 'is_recurring',
    question: '¿Es un pasajero frecuente?',
    required: true,
    canSkip: false,
  },
  payment_method: {
    id: 'payment_method',
    question: '¿Como te pago?',
    required: true,
    canSkip: false,
  },
  tip: {
    id: 'tip',
    question: '¿Te dieron propina?',
    required: true,
    canSkip: false,
  },
  comments: {
    id: 'comments',
    question: '¿Algun comentario adicional?',
    required: false,
    canSkip: true,
  },
  confirmation: {
    id: 'confirmation',
    question: 'Confirma los datos del viaje',
    required: true,
    canSkip: false,
  },
  success: {
    id: 'success',
    question: '',
    required: false,
    canSkip: false,
  },
};

// ============================================================================
// UI MESSAGES
// ============================================================================

export const MESSAGES = {
  // Loading states
  LOADING_DRIVER: 'Cargando informacion...',
  LOADING_SUBMIT: 'Guardando viaje...',

  // Errors
  DRIVER_NOT_FOUND: 'Este enlace no es valido o el conductor no esta activo.',
  SUBMIT_ERROR: 'Error al guardar el viaje. Intenta de nuevo.',
  NETWORK_ERROR: 'Error de conexion. Verifica tu internet.',

  // Success
  SUBMIT_SUCCESS: '¡Viaje registrado correctamente!',
  SUCCESS_DESCRIPTION: 'El viaje ha sido guardado exitosamente.',

  // Actions
  REGISTER_ANOTHER: 'Registrar otro viaje',
  CONFIRM_SUBMIT: 'Confirmar y guardar',
  NEXT: 'Continuar',
  BACK: 'Atrás',
  SKIP: 'Saltar',

  // Placeholders
  PLACEHOLDER_ORIGIN: 'Ej: Cable Plaza, Manizales',
  PLACEHOLDER_DESTINATION: 'Ej: Aeropuerto La Nubia',
  PLACEHOLDER_COMMENTS: 'Escribe cualquier nota adicional sobre el viaje...',

  // Labels
  OPTIONAL: '(Opcional)',
  REQUIRED: '*',
  COP: 'COP',
  YES: 'Si',
  NO: 'No',
  TIP_AMOUNT_LABEL: '¿Cuanto te dieron?',
  DATE_LABEL: 'Fecha',
  TIME_LABEL: 'Hora',
} as const;

// ============================================================================
// PAYMENT METHOD LABELS (for display)
// ============================================================================

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash: 'Efectivo',
  nequi: 'Nequi',
  daviplata: 'Daviplata',
  bancolombia: 'Bancolombia',
  other: 'Otro',
};

export const REQUEST_SOURCE_LABELS: Record<string, string> = {
  whatsapp: 'WhatsApp',
  phone: 'Llamada telefonica',
  referral: 'Referido',
  other: 'Otro',
};

export const TRIP_REASON_LABELS: Record<string, string> = {
  personal: 'Personal',
  work: 'Trabajo',
  emergency: 'Emergencia',
  other: 'Otro',
};

export const TIME_OF_DAY_LABELS: Record<string, string> = {
  morning: 'Mañana',
  afternoon: 'Tarde',
  evening: 'Noche',
  night: 'Madrugada',
};
