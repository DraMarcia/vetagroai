/**
 * Report Builder - VetAgro IA
 * Parses AI-generated report text into structured sections and extracts references.
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

// ===== Section Detection =====

const SECTION_MAP: Record<string, string[]> = {
  "RESUMO EXECUTIVO": ["resumo executivo", "resumo", "sintese executiva"],
  "DIAGNOSTICO TECNICO": ["diagnostico tecnico", "diagnostico", "analise clinica"],
  "ANALISE TECNICA APROFUNDADA": ["analise tecnica aprofundada", "analise aprofundada", "analise tecnica"],
  "CONDUTA RECOMENDADA": ["conduta recomendada", "conduta", "tratamento", "recomendacoes tecnicas", "recomendacoes"],
  "PROTOCOLO DE ACAO": ["protocolo de acao", "protocolo", "passo a passo", "plano de acao"],
  "PONTOS CRITICOS E RISCOS": ["pontos criticos e riscos", "pontos criticos", "riscos", "alertas"],
  "CONSIDERACOES DE SUSTENTABILIDADE": ["consideracoes de sustentabilidade", "sustentabilidade", "impacto ambiental"],
  "PERGUNTAS PARA CONTINUIDADE": ["perguntas para continuidade", "perguntas", "proximos passos", "perguntas estrategicas"],
  "REFERENCIAS TECNICAS": ["referencias tecnicas", "referencias", "fontes", "bibliografia"],
};

const normalize = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9\s]/g, "").trim();

function detectSectionTitle(line: string): string | null {
  const n = normalize(line);
  // Sort by longest keyword first for specificity
  for (const [title, keywords] of Object.entries(SECTION_MAP)) {
    if (keywords.some(kw => n.includes(kw) && line.trim().length < 120)) {
      return title;
    }
  }
  return null;
}

// ===== Parse AI Report Text =====

export function parseAIReport(reportText: string): StructuredReport {
  const cleaned = cleanTextForDisplay(reportText);
  const lines = cleaned.split("\n");

  const sections: ReportSection[] = [];
  let currentTitle = "";
  let currentBody: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      if (currentBody.length > 0) currentBody.push("");
      continue;
    }

    const detected = detectSectionTitle(trimmed);
    if (detected) {
      if (currentTitle || currentBody.length > 0) {
        sections.push({ section: currentTitle || "CONTEUDO", body: currentBody.join("\n").trim() });
      }
      currentTitle = detected;
      currentBody = [];
    } else {
      currentBody.push(trimmed);
    }
  }
  if (currentTitle || currentBody.length > 0) {
    sections.push({ section: currentTitle || "CONTEUDO", body: currentBody.join("\n").trim() });
  }

  // Extract references
  const references: string[] = [];
  const refSection = sections.find(s => s.section === "REFERENCIAS TECNICAS");
  if (refSection) {
    const refLines = refSection.body.split("\n").filter(l => l.trim());
    for (const rl of refLines) {
      const clean = rl.replace(/^\[\d+\]\s*/, "").replace(/^[-•]\s*/, "").trim();
      if (clean) references.push(clean);
    }
    refSection.body = references.map((r, i) => `[${i + 1}] ${r}`).join("\n");
  }

  return { sections: sections.filter(s => s.body.trim()), references };
}

// ===== Fallback (only used when AI call fails) =====

export function buildFallbackReport(content: string, _profileTitle: string): StructuredReport {
  const cleaned = cleanTextForDisplay(content);
  const paragraphs = cleaned.split("\n\n").filter(p => p.trim());
  const total = paragraphs.length;

  const sections: ReportSection[] = [];

  if (total >= 1) sections.push({ section: "RESUMO EXECUTIVO", body: paragraphs.slice(0, Math.min(2, total)).join("\n\n") });
  if (total >= 3) sections.push({ section: "DIAGNOSTICO TECNICO", body: paragraphs.slice(2, Math.max(3, Math.floor(total * 0.35))).join("\n\n") });
  if (total >= 4) sections.push({ section: "ANALISE TECNICA APROFUNDADA", body: "Relatório gerado localmente. Para análise técnica aprofundada com IA, tente novamente." });
  if (total >= 4) sections.push({ section: "CONDUTA RECOMENDADA", body: paragraphs.slice(Math.floor(total * 0.35), Math.floor(total * 0.55)).join("\n\n") });
  if (total >= 5) sections.push({ section: "PROTOCOLO DE ACAO", body: paragraphs.slice(Math.floor(total * 0.55), Math.floor(total * 0.75)).join("\n\n") });
  if (total >= 6) sections.push({ section: "PONTOS CRITICOS E RISCOS", body: paragraphs.slice(Math.floor(total * 0.75)).join("\n\n") });

  const defaultRefs = [
    "MAPA - Ministerio da Agricultura, Pecuaria e Abastecimento - Legislacao Vigente",
    "FAO - Food and Agriculture Organization - Technical Guidelines",
    "Merck Veterinary Manual, 2024",
    "IPCC - 2019 Refinement to the 2006 Guidelines for National Greenhouse Gas Inventories",
  ];

  sections.push({ section: "REFERENCIAS TECNICAS", body: defaultRefs.map((r, i) => `[${i + 1}] ${r}`).join("\n") });

  return { sections: sections.filter(s => s.body.trim()), references: defaultRefs };
}
