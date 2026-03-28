// Google Analytics 4 Integration
const GA_MEASUREMENT_ID = 'G-T6S3J6MSSR';

// Declare gtag on window
declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
  }
}

// Initialize Google Analytics (script already loaded in index.html <head>)
export const initGA = (): void => {
  // gtag is loaded globally via index.html — just ensure window.gtag is available
  if (typeof window.gtag !== 'function') {
    window.dataLayer = window.dataLayer || [];
    window.gtag = function gtag(...args: unknown[]) {
      window.dataLayer.push(args);
    };
  }
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

// === FUNNEL EVENTS ===

// 1. Track profile selection on Index page
export const trackSelectProfile = (profileName: string): void => {
  trackEvent('select_profile', { profile_name: profileName });
};

// 2. Track chat opened
export const trackStartChat = (profileName?: string): void => {
  trackEvent('start_chat', { profile_name: profileName });
};

// 3. Track message sent to AI
export const trackSendMessage = (profileName?: string): void => {
  trackEvent('send_message', { profile_name: profileName });
};

// 4. Track report generation click
export const trackGenerateReport = (format?: string): void => {
  trackEvent('generate_report', { format });
};

// 5. Track PDF download
export const trackDownloadPdf = (): void => {
  trackEvent('download_pdf');
};

// 6. Track plans page view
export const trackViewPlans = (): void => {
  trackEvent('view_plans');
};

// 7. Track subscription/credits click
export const trackSubscriptionClick = (planId: string): void => {
  trackEvent('click_subscribe', { plan_id: planId });
};

// 8. Track begin checkout (redirect to Mercado Pago)
export const trackBeginCheckout = (planId: string, value?: number): void => {
  trackEvent('begin_checkout', { plan_id: planId, value, currency: 'BRL' });
};

// 9. Track purchase completion (Mercado Pago return)
export const trackSubscriptionSuccess = (planId: string): void => {
  trackEvent('purchase', { plan_id: planId, currency: 'BRL' });
};
