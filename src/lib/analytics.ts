// Google Analytics 4 Integration
const GA_MEASUREMENT_ID = 'G-T6S3J6MSSR';

// Declare gtag on window
declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
  }
}

// Initialize Google Analytics
export const initGA = (): void => {
  // Create script element for gtag.js
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  document.head.appendChild(script);

  // Initialize dataLayer and gtag function
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag(...args: unknown[]) {
    window.dataLayer.push(args);
  };

  window.gtag('js', new Date());
  window.gtag('config', GA_MEASUREMENT_ID, {
    send_page_view: false, // We'll handle page views manually for SPA
  });
};

// Track page views (for SPA navigation)
export const trackPageView = (path: string, title?: string): void => {
  if (typeof window.gtag !== 'function') return;
  
  window.gtag('event', 'page_view', {
    page_path: path,
    page_title: title || document.title,
    page_location: window.location.href,
  });
};

// Track custom events
export const trackEvent = (
  eventName: string,
  params?: Record<string, unknown>
): void => {
  if (typeof window.gtag !== 'function') return;
  
  window.gtag('event', eventName, params);
};

// === CONVERSION EVENTS ===

// Track when user starts signup process
export const trackSignupStarted = (method: 'email' | 'google'): void => {
  trackEvent('signup_started', { method });
};

// Track when signup is completed successfully
export const trackSignupCompleted = (method: 'email' | 'google'): void => {
  trackEvent('signup_completed', { method });
};

// Track successful login
export const trackLoginSuccess = (method: 'email' | 'google'): void => {
  trackEvent('login_success', { method });
};

// Track feature usage (no personal data)
export const trackFeatureUsed = (featureName: string): void => {
  trackEvent('feature_used', { feature_name: featureName });
};

// Track subscription click
export const trackSubscriptionClick = (planId: string): void => {
  trackEvent('subscription_click', { plan_id: planId });
};

// Track subscription success (Mercado Pago return)
export const trackSubscriptionSuccess = (planId: string): void => {
  trackEvent('subscription_success', { plan_id: planId });
};
