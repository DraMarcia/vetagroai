/**
 * Detects numeric/technical data in AI responses and extracts metrics for visualization.
 * NO new AI calls — purely parse-based.
 */

export interface ExtractedMetric {
  label: string;
  value: number;
  unit: string;
  context?: string;
}

export interface ExtractedChartData {
  type: "bar" | "line";
  title: string;
  data: { name: string; value: number }[];
}

export interface AnalysisData {
  metrics: ExtractedMetric[];
  chart: ExtractedChartData | null;
  summary: string;
}

// Technical keywords that indicate calculable/analytical content
const TECHNICAL_KEYWORDS = [
  "produção", "producao", "produtividade",
  "kg", "ton", "litros", "l/dia",
  "gmd", "gpd", "ganho médio", "ganho medio",
  "emissão", "emissao", "ch4", "co2", "n2o", "co2eq", "co₂",
  "conversão alimentar", "conversao alimentar", "eficiência", "eficiencia",
  "ração", "racao", "dieta", "consumo",
  "custo", "r$", "receita", "lucro", "margem",
  "arroba", "@", "cab", "cabeça", "cabeca",
  "hectare", "ha", "alqueire",
  "taxa de lotação", "taxa de lotacao", "ua/ha",
  "mortalidade", "natalidade", "fertilidade",
  "peso vivo", "peso final", "peso inicial",
  "confinamento", "semiconfinamento",
  "proteína", "proteina", "energia", "ndt", "fdn",
  "ms", "matéria seca", "materia seca",
];

// Skills/profiles where analysis visualization is relevant
const ANALYSIS_PROFILES = [
  "zootecnista", "produtor", "agronomo", "pesquisador",
];

const ANALYSIS_CHIPS = [
  "análise produtiva", "analise produtiva",
  "eficiência alimentar", "eficiencia alimentar",
  "formulação de dietas", "formulacao de dietas",
  "simulação", "simulacao", "simulação produtiva",
  "cálculo de gee", "calculo de gee",
  "modelagem de carbono",
  "escore corporal",
  "análise econômica", "analise economica",
  "eficiência produtiva", "eficiencia produtiva",
  "planejamento nutricional",
  "análise climática", "analise climatica",
];

/**
 * Determines if the response warrants a visual analysis component.
 */
export function shouldRenderAnalysis(
  content: string,
  profileId?: string
): boolean {
  if (!content || content.length < 100) return false;

  // Profile filter (optional but recommended)
  if (profileId && !ANALYSIS_PROFILES.includes(profileId)) return false;

  const lower = content.toLowerCase();

  // Must have numbers
  const numberMatches = content.match(/\d+[.,]?\d*/g);
  if (!numberMatches || numberMatches.length < 3) return false;

  // Must have technical keywords
  const keywordCount = TECHNICAL_KEYWORDS.filter(kw => lower.includes(kw)).length;
  if (keywordCount < 2) return false;

  return true;
}

/**
 * Extract numeric metrics from AI response text.
 */
export function extractAnalysisData(content: string): AnalysisData {
  const metrics = extractMetrics(content);
  const chart = buildChartData(metrics, content);
  const summary = buildSummary(content);

  return { metrics: metrics.slice(0, 6), chart, summary };
}

// ── Metric extraction ──

const METRIC_PATTERNS: { pattern: RegExp; label: string; unit: string }[] = [
  { pattern: /(?:produção|producao)\s*(?:total|diária|diaria|mensal|anual)?[:\s]*(?:de\s+)?(\d+[.,]?\d*)\s*(kg|ton|litros|l|arroba|@)/gi, label: "Produção", unit: "" },
  { pattern: /gmd[:\s]*(\d+[.,]?\d*)\s*(kg|g)/gi, label: "GMD", unit: "" },
  { pattern: /(?:ganho\s*(?:médio|medio)\s*(?:diário|diario)?)[:\s]*(\d+[.,]?\d*)\s*(kg|g)/gi, label: "GMD", unit: "" },
  { pattern: /(?:emissão|emissao|emissões|emissoes)\s*(?:de\s+)?(?:ch4|co2|co₂|gee|co2eq)?[:\s]*(\d+[.,]?\d*)\s*(kg|ton|t)\s*(?:co2eq|co₂eq|ch4)?/gi, label: "Emissão", unit: "" },
  { pattern: /(?:conversão|conversao)\s*alimentar[:\s]*(\d+[.,]?\d*)/gi, label: "Conv. Alimentar", unit: ":1" },
  { pattern: /(?:custo|investimento)[:\s]*r?\$?\s*(\d+[.,]?\d*)/gi, label: "Custo", unit: "R$" },
  { pattern: /(?:receita|faturamento|lucro|margem)[:\s]*r?\$?\s*(\d+[.,]?\d*)/gi, label: "Receita", unit: "R$" },
  { pattern: /(?:peso\s*(?:vivo|final|médio|medio))[:\s]*(\d+[.,]?\d*)\s*(kg|arroba|@)/gi, label: "Peso", unit: "" },
  { pattern: /(?:consumo\s*(?:de\s*)?(?:ms|matéria\s*seca|ração|racao))[:\s]*(\d+[.,]?\d*)\s*(kg|%)/gi, label: "Consumo MS", unit: "" },
  { pattern: /(?:taxa\s*de\s*lotação|lotacao|ua\/ha)[:\s]*(\d+[.,]?\d*)\s*(ua\/ha|cab\/ha)?/gi, label: "Lotação", unit: "UA/ha" },
  { pattern: /(?:mortalidade|natalidade|fertilidade)[:\s]*(\d+[.,]?\d*)\s*%/gi, label: "Taxa", unit: "%" },
  { pattern: /(?:proteína|proteina)\s*(?:bruta)?[:\s]*(\d+[.,]?\d*)\s*%/gi, label: "PB", unit: "%" },
  { pattern: /(?:ndt|energia)[:\s]*(\d+[.,]?\d*)\s*(%|mcal)?/gi, label: "NDT/Energia", unit: "" },
];

function extractMetrics(content: string): ExtractedMetric[] {
  const metrics: ExtractedMetric[] = [];
  const seen = new Set<string>();

  for (const { pattern, label, unit: defaultUnit } of METRIC_PATTERNS) {
    // Reset regex
    pattern.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(content)) !== null) {
      const rawValue = match[1].replace(",", ".");
      const value = parseFloat(rawValue);
      if (isNaN(value) || value === 0) continue;

      const matchedUnit = match[2] || defaultUnit;
      const key = `${label}-${value}`;
      if (seen.has(key)) continue;
      seen.add(key);

      metrics.push({
        label,
        value,
        unit: matchedUnit,
        context: match[0].trim(),
      });
    }
  }

  // Fallback: extract standalone significant numbers with units
  if (metrics.length < 2) {
    const fallbackPattern = /(\d+[.,]?\d*)\s*(kg|ton|litros|%|r\$|arroba|@|ua\/ha|cab|ha|hectare|g\/dia|l\/dia)/gi;
    let match: RegExpExecArray | null;
    while ((match = fallbackPattern.exec(content)) !== null) {
      const rawValue = match[1].replace(",", ".");
      const value = parseFloat(rawValue);
      if (isNaN(value) || value === 0) continue;
      const key = `metric-${value}-${match[2]}`;
      if (seen.has(key)) continue;
      seen.add(key);
      metrics.push({ label: match[2].toUpperCase(), value, unit: match[2] });
      if (metrics.length >= 6) break;
    }
  }

  return metrics;
}

// ── Chart data ──

function buildChartData(metrics: ExtractedMetric[], content: string): ExtractedChartData | null {
  if (metrics.length < 2) return null;

  // Try to find comparison data (e.g., multiple values with same unit)
  const byUnit = new Map<string, ExtractedMetric[]>();
  for (const m of metrics) {
    const u = m.unit.toLowerCase().replace(/[^a-z%$/]/g, "") || "valor";
    byUnit.set(u, [...(byUnit.get(u) || []), m]);
  }

  // Pick the largest group for charting
  let bestGroup: ExtractedMetric[] = [];
  for (const group of byUnit.values()) {
    if (group.length > bestGroup.length) bestGroup = group;
  }

  if (bestGroup.length >= 2) {
    return {
      type: "bar",
      title: `Comparativo (${bestGroup[0].unit || "valores"})`,
      data: bestGroup.slice(0, 6).map(m => ({
        name: m.label,
        value: m.value,
      })),
    };
  }

  // Fallback: use all metrics as bars
  if (metrics.length >= 2) {
    return {
      type: "bar",
      title: "Métricas extraídas",
      data: metrics.slice(0, 6).map(m => ({
        name: m.label,
        value: m.value,
      })),
    };
  }

  return null;
}

// ── Summary ──

function buildSummary(content: string): string {
  // Strip markdown formatting and the report CTA
  const cleaned = content
    .replace(/---\n\nSe você quiser.*$/s, "")
    .replace(/\*{1,3}([^*]+)\*{1,3}/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .trim();

  // Get first 2-3 meaningful sentences
  const sentences = cleaned
    .split(/[.!?]\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 20 && s.length < 300);

  const summary = sentences.slice(0, 3).join(". ");
  if (summary.length > 300) return summary.slice(0, 297) + "...";
  return summary ? summary + "." : "";
}
