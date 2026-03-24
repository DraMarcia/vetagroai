import { supabase } from "@/integrations/supabase/client";

/**
 * Log anonymized territorial scientific data from sustainability tools.
 * Fire-and-forget — never blocks the caller. No user data is stored.
 * Uses SECURITY DEFINER RPC to prevent direct table manipulation.
 */
export function logTerritorialMetric(params: {
  toolName: string;
  municipality?: string;
  state?: string;
  productionSystem?: string;
  estimatedEmissionValue?: number;
  emissionType?: string;
  herdSizeRange?: string;
  calculationMethod?: string;
  metadata?: Record<string, unknown>;
}): void {
  (async () => {
    try {
      if (!params.state && !params.municipality && !params.estimatedEmissionValue) return;

      await (supabase.rpc as any)("insert_territorial_metric", {
        _tool_name: params.toolName,
        _municipality: params.municipality || null,
        _state: params.state || null,
        _production_system: params.productionSystem || null,
        _estimated_emission_value: params.estimatedEmissionValue || null,
        _emission_type: params.emissionType || null,
        _herd_size_range: params.herdSizeRange || null,
        _calculation_method: params.calculationMethod || null,
        _metadata: params.metadata || {},
      });
    } catch (e) {
      console.warn("[TerritorialLogger] Failed to log:", e);
    }
  })();
}

/**
 * Convert exact herd size to anonymized range for privacy.
 */
export function anonymizeHerdSize(count: number): string {
  if (count <= 50) return "1-50";
  if (count <= 100) return "51-100";
  if (count <= 500) return "101-500";
  if (count <= 1000) return "501-1000";
  if (count <= 5000) return "1001-5000";
  return "5000+";
}
