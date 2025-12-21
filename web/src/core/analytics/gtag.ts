/**
 * Google Analytics 4 (GA4) initialization
 *
 * This module dynamically loads and initializes GA4 based on the
 * VITE_GA4_MEASUREMENT_ID environment variable.
 */

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
  }
}

/**
 * Initialize Google Analytics 4
 * Loads the gtag.js script and configures it with the measurement ID
 */
export function initGA4(): void {
  const measurementId = import.meta.env.VITE_GA4_MEASUREMENT_ID;

  if (!measurementId) {
    console.warn('[GA4] No measurement ID found. Analytics will not be initialized.');
    return;
  }

  // Initialize dataLayer
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag(...args: unknown[]) {
    window.dataLayer.push(args);
  };

  // Load gtag.js script
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  document.head.appendChild(script);

  // Initialize gtag
  window.gtag('js', new Date());
  window.gtag('config', measurementId);

  console.log(`[GA4] Initialized with measurement ID: ${measurementId}`);
}

/**
 * Track a page view
 * @param path - The page path to track
 * @param title - Optional page title
 */
export function trackPageView(path: string, title?: string): void {
  if (!window.gtag) return;

  window.gtag('event', 'page_view', {
    page_path: path,
    page_title: title,
  });
}

/**
 * Track a custom event
 * @param eventName - The name of the event
 * @param params - Optional event parameters
 */
export function trackEvent(eventName: string, params?: Record<string, unknown>): void {
  if (!window.gtag) return;

  window.gtag('event', eventName, params);
}
