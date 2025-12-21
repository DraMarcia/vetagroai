import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { 
  initGA, 
  trackPageView, 
  trackLoginSuccess, 
  trackSignupCompleted,
  trackSubscriptionSuccess 
} from '@/lib/analytics';

interface AnalyticsProviderProps {
  children: React.ReactNode;
}

export const AnalyticsProvider = ({ children }: AnalyticsProviderProps) => {
  const location = useLocation();
  const hasTrackedMercadoPago = useRef(false);
  const previousUserRef = useRef<string | null>(null);

  // Initialize GA on mount
  useEffect(() => {
    initGA();
  }, []);

  // Track page views on route changes
  useEffect(() => {
    trackPageView(location.pathname + location.search);
  }, [location]);

  // Track Mercado Pago subscription success (return from checkout)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const collectionStatus = params.get('collection_status');
    const preapprovalId = params.get('preapproval_id');
    
    // Mercado Pago redirects with these params on success
    if (collectionStatus === 'approved' && preapprovalId && !hasTrackedMercadoPago.current) {
      hasTrackedMercadoPago.current = true;
      // Determine plan from URL or default
      const planId = location.pathname.includes('enterprise') ? 'enterprise' : 'pro';
      trackSubscriptionSuccess(planId);
    }
  }, [location]);

  // Track Google OAuth login/signup success
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          const isOAuth = session.user.app_metadata?.provider === 'google';
          const isNewUser = previousUserRef.current !== session.user.id;
          
          if (isOAuth && isNewUser) {
            // Check if user was created recently (within last minute) to determine signup vs login
            const createdAt = new Date(session.user.created_at).getTime();
            const now = Date.now();
            const isNewSignup = (now - createdAt) < 60000; // 1 minute threshold
            
            if (isNewSignup) {
              trackSignupCompleted('google');
            } else {
              trackLoginSuccess('google');
            }
          }
          previousUserRef.current = session.user.id;
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  return <>{children}</>;
};
