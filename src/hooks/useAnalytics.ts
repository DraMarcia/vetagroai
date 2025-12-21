import { useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { trackPageView, trackFeatureUsed } from '@/lib/analytics';

// Hook to track page views on route changes
export const usePageTracking = (): void => {
  const location = useLocation();

  useEffect(() => {
    // Track page view on every route change
    trackPageView(location.pathname + location.search);
  }, [location]);
};

// Hook to track feature usage (call once when feature is used)
export const useFeatureTracking = (featureName: string) => {
  const hasTracked = useRef(false);

  const trackFeature = useCallback(() => {
    if (!hasTracked.current) {
      hasTracked.current = true;
      trackFeatureUsed(featureName);
    }
  }, [featureName]);

  return { trackFeature };
};
