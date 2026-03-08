import { supabase } from "@/integrations/supabase/client";

/**
 * Log anonymized territorial scientific data from sustainability tools.
 * Fire-and-forget — never blocks the caller. No user data is stored.
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
      // Only log if we have at least some useful data
      if (!params.state && !params.municipality && !params.estimatedEmissionValue) return;

      await (supabase.from("territorial_agro_metrics") as any).insert({
        tool_name: params.toolName,
        municipality: params.municipality || null,
        state: params.state || null,
        production_system: params.productionSystem || null,
        estimated_emission_value: params.estimatedEmissionValue || null,
        emission_type: params.emissionType || null,
        herd_size_range: params.herdSizeRange || null,
        calculation_method: params.calculationMethod || null,
        metadata: params.metadata || null,
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
