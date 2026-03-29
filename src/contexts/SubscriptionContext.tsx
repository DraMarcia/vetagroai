import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";

type SubscriptionPlan = "free" | "pro" | "enterprise";

interface SubscriptionState {
  plan: SubscriptionPlan;
  credits: number;
  creditsResetAt: string | null;
  isAdmin: boolean;
  isProfessional: boolean;
  hasUnlimited: boolean;
  isLoading: boolean;
}

interface SubscriptionContextType extends SubscriptionState {
  user: User | null;
  useCredit: () => Promise<boolean>;
  refreshSubscription: () => Promise<void>;
  canAccessFeature: (feature: string) => boolean;
}

const SubscriptionContext = createContext<SubscriptionContextType | null>(null);

const PRO_FEATURES = [
  "upload_exams",
  "pdf_reports",
  "technical_responses",
  "unlimited_tools",
  "advanced_modeling",
];

const ENTERPRISE_FEATURES = [
  ...PRO_FEATURES,
  "multi_user",
  "custom_branding",
  "priority_support",
  "export_history",
];

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [state, setState] = useState<SubscriptionState>({
    plan: "free",
    credits: 5,
    creditsResetAt: null,
    isAdmin: false,
    isProfessional: false,
    hasUnlimited: false,
    isLoading: true,
  });

  const fetchSubscription = async () => {
    try {
      // Call RPC without user_id - it now uses auth.uid() directly
      const { data, error } = await supabase.rpc("check_credits");

      if (error) throw error;

      if (data && typeof data === "object" && !Array.isArray(data)) {
        const result = data as Record<string, unknown>;
        setState({
          plan: (result.plan as SubscriptionPlan) || "free",
          credits: (result.credits as number) || 10,
          creditsResetAt: (result.credits_reset_at as string) || null,
          isAdmin: (result.is_admin as boolean) || false,
          isProfessional: (result.is_professional as boolean) || false,
          hasUnlimited: (result.has_unlimited as boolean) || false,
          isLoading: false,
        });
      }
    } catch (error) {
      console.error("Error fetching subscription:", error);
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  };

  const refreshSubscription = async () => {
    if (user) {
      await fetchSubscription();
    }
  };

  const useCredit = async (): Promise<boolean> => {
    if (!user) return false;

    try {
      // Call RPC without user_id - it now uses auth.uid() directly
      const { data, error } = await supabase.rpc("use_credit");

      if (error) throw error;

      await refreshSubscription();
      return data as boolean;
    } catch (error) {
      console.error("Error using credit:", error);
      return false;
    }
  };

  const canAccessFeature = (feature: string): boolean => {
    if (state.isAdmin) return true;
    if (state.plan === "enterprise") return true;
    if (state.plan === "pro" && PRO_FEATURES.includes(feature)) return true;
    return false;
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          setTimeout(() => {
            fetchSubscription();
          }, 0);
        } else {
          setState({
            plan: "free",
            credits: 5,
            creditsResetAt: null,
            isAdmin: false,
            isProfessional: false,
            hasUnlimited: false,
            isLoading: false,
          });
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchSubscription();
      } else {
        setState((prev) => ({ ...prev, isLoading: false }));
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <SubscriptionContext.Provider
      value={{
        ...state,
        user,
        useCredit,
        refreshSubscription,
        canAccessFeature,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error("useSubscription must be used within a SubscriptionProvider");
  }
  return context;
}
