/**
 * Report Builder - VetAgro IA
 * Structures AI responses into professional technical reports with auto-generated references.
 */

import { cleanTextForDisplay } from "./textUtils";

export interface ReportSection {
  section: string;
  body: string;
}

export interface StructuredReport {
  sections: ReportSection[];
  references: string[];
}

// ===== Reference Knowledge Base =====

interface ReferenceRule {
  keywords: string[];
  refs: string[];
}

const REFERENCE_RULES: ReferenceRule[] = [
  {
    keywords: ["mastite", "mamite", "cmt", "celulas somaticas", "cts", "leite"],
    refs: [
      "National Mastitis Council (NMC) – Recommended Mastitis Control Program, 2023",
      "Merck Veterinary Manual – Mastitis in Large Animals, 2024",
      "MAPA – Instrucao Normativa 76/77 – Regulamento Tecnico de Identidade e Qualidade do Leite",
    ],
  },
  {
    keywords: ["bovino", "gado", "vaca", "bezerro", "novilha", "touro", "boi"],
    refs: [
      "Merck Veterinary Manual – Cattle Medicine, 2024",
      "MAPA – Manual de Legislacao Sanitaria Animal, 2023",
      "Embrapa Gado de Corte – Boas Praticas de Manejo, 2023",
    ],
  },
  {
    keywords: ["equino", "cavalo", "egua", "potro", "equideo"],
    refs: [
      "Merck Veterinary Manual – Equine Medicine, 2024",
      "AAEP – American Association of Equine Practitioners Guidelines, 2023",
    ],
  },
  {
    keywords: ["emissao", "emissoes", "gee", "carbono", "metano", "ch4", "co2", "n2o", "sustentabilidade", "pegada"],
    refs: [
      "IPCC – 2019 Refinement to the 2006 Guidelines for National Greenhouse Gas Inventories",
      "FAO – Livestock's Long Shadow: Environmental Issues and Options",
      "SEEG/Observatorio do Clima – Sistema de Estimativas de Emissoes de Gases de Efeito Estufa, 2024",
      "Embrapa – Programa Carne Carbono Neutro (CCN)",
    ],
  },
  {
    keywords: ["confinamento", "engorda", "terminacao", "lote", "arroba", "gmd"],
    refs: [
      "Embrapa Gado de Corte – Manual de Confinamento, 2023",
      "NRC – Nutrient Requirements of Beef Cattle, 8th Edition, 2016",
      "CEPEA/ESALQ – Indicadores de Precos do Boi Gordo",
    ],
  },
  {
    keywords: ["racao", "dieta", "nutricao", "formulacao", "proteina", "energia", "ndt", "fdn"],
    refs: [
      "NRC – Nutrient Requirements of Beef Cattle, 8th Edition, 2016",
      "NRC – Nutrient Requirements of Dairy Cattle, 7th Edition, 2001",
      "Valadares Filho, S.C. – Tabelas Brasileiras de Composicao de Alimentos para Bovinos, CQBAL 4.0",
    ],
  },
  {
    keywords: ["planta", "pastagem", "forragem", "capim", "braquiaria", "panicum", "degradacao"],
    refs: [
      "Embrapa – Manual de Identificacao de Plantas Daninhas, 2023",
      "FAO – Grasslands and Pasturelands Management Guidelines",
      "MAPA – Registro Nacional de Cultivares (RNC)",
    ],
  },
  {
    keywords: ["exame", "hemograma", "bioquimico", "laboratorio", "urinali", "hematocrito"],
    refs: [
      "Thrall, M.A. – Hematologia e Bioquimica Clinica Veterinaria, 2a Ed.",
      "Kaneko, J.J. – Clinical Biochemistry of Domestic Animals, 6th Ed.",
      "Merck Veterinary Manual – Diagnostic Procedures, 2024",
    ],
  },
  {
    keywords: ["dose", "farmaco", "medicamento", "antibiotico", "anti-inflamatorio", "posologia", "prescricao"],
    refs: [
      "Spinosa, H.S. – Farmacologia Aplicada a Medicina Veterinaria, 6a Ed.",
      "Merck Veterinary Manual – Pharmacology, 2024",
      "MAPA – Compendio de Produtos Veterinarios (SINDAN/CPVS)",
    ],
  },
  {
    keywords: ["geoespacial", "bioma", "desmatamento", "car", "app", "reserva legal", "territorio"],
    refs: [
      "IBGE – Mapa de Biomas e Vegetacao do Brasil, 2024",
      "INPE/PRODES – Monitoramento do Desmatamento na Amazonia Legal",
      "SFB – Cadastro Ambiental Rural (CAR) – Dados Abertos",
      "MAPA – Zoneamento Agricola de Risco Climatico (ZARC)",
    ],
  },
  {
    keywords: ["clima", "climatico", "temperatura", "chuva", "itu", "estresse termico", "seca"],
    refs: [
      "INMET – Instituto Nacional de Meteorologia – Normais Climatologicas",
      "IPCC – AR6 Climate Change 2022: Impacts, Adaptation and Vulnerability",
      "Embrapa – Zoneamento Climatico para Pecuaria, 2023",
    ],
  },
  {
    keywords: ["diagnostico", "clinico", "sintoma", "sinal", "doenca", "enfermidade", "patologia"],
    refs: [
      "Merck Veterinary Manual – Veterinary Clinical Diagnosis, 2024",
      "Radostits, O.M. – Veterinary Medicine: A Textbook of Diseases of Cattle, Horses, Sheep, Pigs, and Goats, 11th Ed.",
      "Riet-Correa, F. – Doencas de Ruminantes e Equideos, 4a Ed.",
    ],
  },
];

// Default references always included
const DEFAULT_REFS = [
  "MAPA – Ministerio da Agricultura, Pecuaria e Abastecimento – Legislacao Vigente",
  "FAO – Food and Agriculture Organization – Technical Guidelines",
];

// ===== Section Detection =====

const SECTION_MAP: Record<string, string[]> = {
  "RESUMO EXECUTIVO": ["resumo", "sintese", "overview", "sumario", "resumo executivo", "sintese executiva"],
  "DIAGNOSTICO TECNICO": ["diagnostico", "analise clinica", "avaliacao", "analise tecnica", "diagnostico tecnico", "diagnostico diferencial"],
  "CONDUTA RECOMENDADA": ["conduta", "tratamento", "terapia", "manejo recomendado", "recomendacoes", "recomendacoes tecnicas", "conduta recomendada"],
  "PROTOCOLO DE ACAO": ["protocolo", "passo a passo", "procedimento", "plano de acao", "acoes", "protocolo de acao", "roteiro"],
  "PONTOS CRITICOS E RISCOS": ["riscos", "pontos criticos", "atencao", "alertas", "cuidados", "pontos criticos e riscos"],
  "CONSIDERACOES DE SUSTENTABILIDADE": ["sustentabilidade", "ambiental", "impacto ambiental", "emissoes", "gee", "carbono"],
  "PERGUNTAS PARA CONTINUIDADE": ["perguntas", "proximos passos", "continuidade", "investigar", "perguntas para continuidade", "perguntas estrategicas"],
  "REFERENCIAS TECNICAS": ["referencias", "fontes", "literatura", "bibliografia", "referencias tecnicas"],
};

const normalize = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9\s]/g, "").trim();

function detectSectionTitle(line: string): string | null {
  const n = normalize(line);
  for (const [title, keywords] of Object.entries(SECTION_MAP)) {
    if (keywords.some(kw => n.includes(kw) && line.trim().length < 100)) {
      return title;
    }
  }
  return null;
}

// ===== Auto-generate references =====

function generateReferences(content: string): string[] {
  const n = normalize(content);
  const matchedRefs = new Set<string>();

  for (const rule of REFERENCE_RULES) {
    if (rule.keywords.some(kw => n.includes(kw))) {
      rule.refs.forEach(r => matchedRefs.add(r));
    }
  }

  // Always add defaults
  DEFAULT_REFS.forEach(r => matchedRefs.add(r));

  return Array.from(matchedRefs);
}

// ===== Main Builder =====

export function buildStructuredReport(content: string, profileTitle: string): StructuredReport {
  const cleaned = cleanTextForDisplay(content);
  const lines = cleaned.split("\n").filter(l => l.trim());

  // Phase 1: Try to parse existing sections
  const rawSections: ReportSection[] = [];
  let currentTitle = "";
  let currentBody: string[] = [];

  for (const line of lines) {
    const detected = detectSectionTitle(line);
    if (detected) {
      if (currentTitle || currentBody.length > 0) {
        rawSections.push({ section: currentTitle || "CONTEUDO", body: currentBody.join("\n") });
      }
      currentTitle = detected;
      currentBody = [];
    } else {
      currentBody.push(line);
    }
  }
  if (currentTitle || currentBody.length > 0) {
    rawSections.push({ section: currentTitle || "CONTEUDO", body: currentBody.join("\n") });
  }

  // Phase 2: Map to mandatory structure
  const mandatorySections = [
    "RESUMO EXECUTIVO",
    "DIAGNOSTICO TECNICO",
    "CONDUTA RECOMENDADA",
    "PROTOCOLO DE ACAO",
    "PONTOS CRITICOS E RISCOS",
    "CONSIDERACOES DE SUSTENTABILIDADE",
    "PERGUNTAS PARA CONTINUIDADE",
  ];

  const mapped = new Map<string, string>();
  for (const sec of rawSections) {
    const existing = mapped.get(sec.section);
    mapped.set(sec.section, existing ? `${existing}\n${sec.body}` : sec.body);
  }

  // If we only got generic "CONTEUDO" (no real sections detected), split intelligently
  if (rawSections.length <= 1 || (rawSections.length === 1 && rawSections[0].section === "CONTEUDO")) {
    const allText = cleaned;
    const paragraphs = allText.split("\n\n").filter(p => p.trim());
    const total = paragraphs.length;

    if (total >= 2) {
      mapped.set("RESUMO EXECUTIVO", paragraphs.slice(0, Math.min(2, total)).join("\n\n"));
    }
    if (total >= 3) {
      const diagEnd = Math.max(3, Math.floor(total * 0.3));
      mapped.set("DIAGNOSTICO TECNICO", paragraphs.slice(2, diagEnd).join("\n\n"));
    }
    if (total >= 4) {
      const condStart = Math.floor(total * 0.3);
      const condEnd = Math.floor(total * 0.5);
      mapped.set("CONDUTA RECOMENDADA", paragraphs.slice(condStart, Math.max(condStart + 1, condEnd)).join("\n\n"));
    }
    if (total >= 5) {
      const protStart = Math.floor(total * 0.5);
      const protEnd = Math.floor(total * 0.65);
      mapped.set("PROTOCOLO DE ACAO", paragraphs.slice(protStart, Math.max(protStart + 1, protEnd)).join("\n\n"));
    }
    if (total >= 6) {
      const riskStart = Math.floor(total * 0.65);
      const riskEnd = Math.floor(total * 0.8);
      mapped.set("PONTOS CRITICOS E RISCOS", paragraphs.slice(riskStart, Math.max(riskStart + 1, riskEnd)).join("\n\n"));
    }
    if (total >= 7) {
      mapped.set("CONSIDERACOES DE SUSTENTABILIDADE", paragraphs.slice(Math.floor(total * 0.8), Math.floor(total * 0.9)).join("\n\n"));
    }
    if (total >= 3) {
      const lastParagraphs = paragraphs.slice(-1);
      mapped.set("PERGUNTAS PARA CONTINUIDADE", lastParagraphs.join("\n\n"));
    }
  }

  // Phase 3: Build final sections list
  const finalSections: ReportSection[] = [];

  for (const sec of mandatorySections) {
    const body = mapped.get(sec);
    if (body && body.trim()) {
      finalSections.push({ section: sec, body: body.trim() });
    }
  }

  // Add any extra sections that didn't fit mandatory names
  for (const [key, val] of mapped.entries()) {
    if (!mandatorySections.includes(key) && key !== "CONTEUDO" && key !== "REFERENCIAS TECNICAS" && val.trim()) {
      finalSections.push({ section: key, body: val.trim() });
    }
  }

  // Ensure at least some content
  if (finalSections.length === 0) {
    finalSections.push({ section: "RESUMO EXECUTIVO", body: cleaned.slice(0, 500) });
    if (cleaned.length > 500) {
      finalSections.push({ section: "DIAGNOSTICO TECNICO", body: cleaned.slice(500) });
    }
  }

  // Phase 4: Auto-generate references
  const references = generateReferences(content);

  // Add references section to display
  finalSections.push({
    section: "REFERENCIAS TECNICAS",
    body: references.map((r, i) => `[${i + 1}] ${r}`).join("\n"),
  });

  return { sections: finalSections, references };
}
