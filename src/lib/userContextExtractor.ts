/**
 * Extracts structured user context from chat messages.
 * Used to populate userContext for the consultative flow.
 */

export interface UserContext {
  perfil: string;
  localizacao: string;
  bioma: string;
  area_ha: string;
  sistema: string;
  atividade: string;
  animais: string;
  manejo: string;
  objetivo: string;
  especie: string;
  raca: string;
  idade: string;
  peso: string;
  sinais_clinicos: string;
  cultura: string;
  solo: string;
  dados_completos: boolean;
}

export type ConversationStage = "idle" | "diagnostico" | "analise" | "final";

export function createEmptyContext(profileId: string): UserContext {
  return {
    perfil: profileId,
    localizacao: "",
    bioma: "",
    area_ha: "",
    sistema: "",
    atividade: "",
    animais: "",
    manejo: "",
    objetivo: "",
    especie: "",
    raca: "",
    idade: "",
    peso: "",
    sinais_clinicos: "",
    cultura: "",
    solo: "",
    dados_completos: false,
  };
}

// Patterns for extracting context from user messages
const EXTRACTION_RULES: { field: keyof UserContext; patterns: RegExp[] }[] = [
  {
    field: "area_ha",
    patterns: [
      /(\d[\d.,]*)\s*(?:hectares?|ha)\b/i,
      /(?:área|area|propriedade)\s*(?:de|com)?\s*(\d[\d.,]*)/i,
    ],
  },
  {
    field: "animais",
    patterns: [
      /(\d[\d.,]*)\s*(?:cabe[cç]as?|animais?|bois?|vacas?|novilhos?|bezerros?|su[ií]nos?|aves?|galinhas?|frangos?|ovinos?|caprinos?)/i,
      /(?:rebanho|lote|plantel)\s*(?:de|com)?\s*(\d[\d.,]*)/i,
    ],
  },
  {
    field: "localizacao",
    patterns: [
      /(?:em|no|na|de|do|da|regi[aã]o)\s+((?:Acre|Alagoas|Amap[aá]|Amazonas|Bahia|Cear[aá]|Distrito Federal|Esp[ií]rito Santo|Goi[aá]s|Maranh[aã]o|Mato Grosso(?:\s+do\s+Sul)?|Minas Gerais|Par[aá]|Para[ií]ba|Paran[aá]|Pernambuco|Piau[ií]|Rio (?:de Janeiro|Grande (?:do (?:Norte|Sul)))|Rond[oô]nia|Roraima|Santa Catarina|S[aã]o Paulo|Sergipe|Tocantins))/i,
      /(?:em|no|na)\s+([A-Z][a-záéíóúãõê]+(?:\s+[A-Z][a-záéíóúãõê]+){0,3})\s*[-,]/i,
    ],
  },
  {
    field: "sistema",
    patterns: [
      /(?:sistema|tipo)\s*(?:de)?\s*(pasto|pastejo|confinamento|semiconfinamento|semi-confinamento|ilpf|integra[cç][aã]o|extensivo|intensivo|cria|recria|engorda|ciclo completo)/i,
      /\b(pasto|confinamento|semiconfinamento|ilpf|extensivo|intensivo)\b/i,
    ],
  },
  {
    field: "bioma",
    patterns: [
      /(?:bioma|regi[aã]o)\s*(?:de|do|da)?\s*(cerrado|amaz[oô]nia|caatinga|mata atl[aâ]ntica|pampa|pantanal)/i,
      /\b(cerrado|amaz[oô]nia|caatinga|mata atl[aâ]ntica|pampa|pantanal)\b/i,
    ],
  },
  {
    field: "especie",
    patterns: [
      /\b(bovinos?|su[ií]nos?|equinos?|ovinos?|caprinos?|aves?|galinhas?|frangos?|peixes?|bu[bf]alinos?)\b/i,
    ],
  },
  {
    field: "raca",
    patterns: [
      /\b(nelore|angus|hereford|brahman|girolando|gir|guzer[aá]|holand[eê]s|jersey|simental|tabapuã|senepol|bonsmara|charol[eê]s|limousin|brangus)\b/i,
    ],
  },
  {
    field: "peso",
    patterns: [
      /(\d[\d.,]*)\s*(?:kg|quilos?|kilos?)\b/i,
    ],
  },
  {
    field: "cultura",
    patterns: [
      /\b(milho|soja|cana|algod[aã]o|caf[eé]|arroz|feij[aã]o|trigo|sorgo|capim|brachiaria|braqui[aá]ria|pastagem|eucalipto|citros|laranja)\b/i,
    ],
  },
  {
    field: "solo",
    patterns: [
      /(?:solo|terra)\s*(arenoso|argiloso|siltoso|latossolo|argissolo|neossolo|cambissolo)/i,
    ],
  },
];

const OBJECTIVE_PATTERNS = [
  /(?:quero|preciso|objetivo|meta|desejo|gostaria)\s+(?:de\s+)?(.*?)(?:\.|$)/i,
  /(?:para|pra)\s+(reduzir|aumentar|melhorar|otimizar|calcular|analisar|simular|modelar|planejar)(.*?)(?:\.|$)/i,
];

/**
 * Extract context fields from a single user message and merge into existing context.
 */
export function extractContextFromMessage(
  message: string,
  currentContext: UserContext,
): UserContext {
  const updated = { ...currentContext };

  for (const rule of EXTRACTION_RULES) {
    if (updated[rule.field]) continue; // don't overwrite existing data
    for (const pattern of rule.patterns) {
      const match = message.match(pattern);
      if (match) {
        updated[rule.field] = match[1]?.trim() || match[0]?.trim();
        break;
      }
    }
  }

  // Objective extraction
  if (!updated.objetivo) {
    for (const pattern of OBJECTIVE_PATTERNS) {
      const match = message.match(pattern);
      if (match) {
        updated.objetivo = (match[1] + (match[2] || "")).trim();
        break;
      }
    }
  }

  // Check completeness based on profile
  updated.dados_completos = isContextComplete(updated);

  return updated;
}

/**
 * Check if minimum required context is available for full analysis.
 * Requirements vary by profile.
 */
export function isContextComplete(ctx: UserContext): boolean {
  const hasLocation = !!(ctx.localizacao || ctx.bioma);
  
  switch (ctx.perfil) {
    case "veterinario":
      return !!(ctx.especie && ctx.sinais_clinicos);
    case "zootecnista":
      return !!(ctx.especie && ctx.sistema && ctx.animais);
    case "agronomo":
      return !!(ctx.cultura && hasLocation);
    case "produtor":
      return !!(ctx.sistema && (ctx.area_ha || ctx.animais) && hasLocation);
    case "pesquisador":
      return !!(ctx.objetivo && ctx.sistema);
    default:
      return !!(ctx.sistema && hasLocation);
  }
}

/**
 * Determines if a message requires the consultative flow
 * (i.e., it's a technical request, not a casual chat).
 */
export function requiresConsultativeFlow(message: string): boolean {
  const technicalPatterns = [
    /\b(calcul|diagn[oó]stic|model|planej|analis|simul|formul|interpret|avaliar|estim|quantific)/i,
    /\b(emiss[oõ]es?|carbono|gee|metano|sustentab)/i,
    /\b(dieta|ra[cç][aã]o|nutri[cç][aã]o|dose|dosagem|medicamento|vacina)/i,
    /\b(custo|viabilidade|rentabilidade|margem|lucro|receita)/i,
    /\b(confinamento|pastejo|ilpf|integra[cç][aã]o)/i,
    /\b(hemograma|bioqu[ií]mica|exame|laborat[oó]rio|parasit)/i,
    /\b(praga|doen[cç]a|sintoma|les[aã]o|infec[cç][aã]o|tratamento)/i,
    /\b(cr[eé]dito.*carbono|pagamento.*ambiental|certifica[cç][aã]o)/i,
    /\b(produtividade|efici[eê]ncia|desempenho|convers[aã]o)/i,
    /\b(rebanho|plantel|lote|propriedade|fazenda|hectare)/i,
  ];

  return technicalPatterns.some((p) => p.test(message));
}

/**
 * Serialize context for sending to the edge function.
 * Only includes non-empty fields.
 */
export function serializeContext(ctx: UserContext): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(ctx)) {
    if (value && key !== "dados_completos") {
      result[key] = String(value);
    }
  }
  return result;
}
