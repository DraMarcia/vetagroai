import { createContext, useContext, useState, ReactNode } from "react";

export type UserProfile = 
  | "veterinario" 
  | "zootecnista" 
  | "agronomo" 
  | "produtor" 
  | "pesquisador";

interface ProfileData {
  id: UserProfile;
  title: string;
  greeting: string;
  subtitle: string;
  placeholder: string;
  disclaimer: string;
  chipLabel: string;
  suggestions: string[];
  actions: { label: string; category: string }[];
}

const profilesData: Record<UserProfile, ProfileData> = {
  veterinario: {
    id: "veterinario",
    title: "Veterinários",
    greeting: "Olá! Como posso te ajudar na prática clínica hoje?",
    subtitle: "Descreva sua realidade, objetivos ou envie dados. Eu te ajudo com análise e recomendações.",
    placeholder: "Descreva um caso clínico, sintomas ou envie exames...",
    disclaimer: "O VetAgro IA apoia suas decisões clínicas com base em dados. Sempre utilize seu julgamento profissional.",
    chipLabel: "Clínica Veterinária",
    suggestions: [
      "Diagnosticar sinais clínicos em bovinos",
      "Interpretar hemograma completo",
      "Calcular dose de anti-inflamatório",
      "Avaliar mucosa ocular de equino",
    ],
    actions: [
      { label: "Diagnóstico diferencial", category: "Diagnóstico" },
      { label: "Interpretar exames", category: "Diagnóstico" },
      { label: "Calcular dose", category: "Tratamento" },
      { label: "Receituário veterinário", category: "Tratamento" },
      { label: "Escore corporal", category: "Avaliação" },
      { label: "Dicionário farmacológico", category: "Referência" },
    ],
  },
  zootecnista: {
    id: "zootecnista",
    title: "Zootecnistas",
    greeting: "Olá! Vamos otimizar seu sistema produtivo hoje?",
    subtitle: "Descreva sua realidade, objetivos ou envie dados. Eu te ajudo com análise e recomendações.",
    placeholder: "Descreva o sistema produtivo, dieta ou dados do rebanho...",
    disclaimer: "O VetAgro IA fornece análises para apoio técnico. Avalie conforme a realidade do sistema produtivo.",
    chipLabel: "Gestão Produtiva",
    suggestions: [
      "Formular ração para gado de corte",
      "Avaliar eficiência alimentar do lote",
      "Analisar indicadores produtivos",
      "Calcular conversão alimentar",
    ],
    actions: [
      { label: "Calculadora de ração", category: "Nutrição" },
      { label: "Painel produtivo", category: "Gestão" },
      { label: "Escore corporal", category: "Avaliação" },
      { label: "Simulador de confinamento", category: "Planejamento" },
      { label: "Emissões do rebanho", category: "Sustentabilidade" },
      { label: "Análise climática", category: "Ambiente" },
    ],
  },
  agronomo: {
    id: "agronomo",
    title: "Agrônomos",
    greeting: "Olá! Como posso ajudar na sua produção agrícola?",
    subtitle: "Descreva sua realidade, objetivos ou envie dados. Eu te ajudo com análise e recomendações.",
    placeholder: "Descreva a cultura, solo, região ou envie imagens...",
    disclaimer: "O VetAgro IA oferece recomendações baseadas em dados. Considere as condições locais antes de decidir.",
    chipLabel: "Produção Agrícola",
    suggestions: [
      "Identificar planta tóxica por imagem",
      "Analisar sustentabilidade da propriedade",
      "Consultar dados geoespaciais da região",
      "Avaliar impacto climático na produção",
    ],
    actions: [
      { label: "Identificar plantas", category: "Diagnóstico" },
      { label: "Análise de sustentabilidade", category: "Sustentabilidade" },
      { label: "Consulta geoespacial", category: "Território" },
      { label: "Análise climática", category: "Clima" },
      { label: "Emissões de GEE", category: "Sustentabilidade" },
      { label: "Modelador de carbono", category: "Planejamento" },
    ],
  },
  produtor: {
    id: "produtor",
    title: "Produtor Rural",
    greeting: "Olá! Vamos melhorar os resultados da sua propriedade hoje?",
    subtitle: "Descreva sua realidade, objetivos ou envie dados. Eu te ajudo com análise e recomendações.",
    placeholder: "Descreva sua propriedade, rebanho ou dúvida...",
    disclaimer: "O VetAgro IA ajuda com análises e sugestões. Avalie o que faz mais sentido para sua realidade.",
    chipLabel: "Gestão da Propriedade",
    suggestions: [
      "Quero melhorar a produtividade do meu rebanho",
      "Como reduzir custos da alimentação?",
      "Calcular emissões do lote",
      "Avaliar eficiência da fazenda",
    ],
    actions: [
      { label: "Avaliar eficiência da fazenda", category: "Diagnóstico" },
      { label: "Diagnóstico produtivo", category: "Diagnóstico" },
      { label: "Simular custos e lucro", category: "Planejamento" },
      { label: "Planejamento alimentar", category: "Planejamento" },
      { label: "Calcular emissões do rebanho", category: "Sustentabilidade" },
      { label: "Indicadores ambientais", category: "Sustentabilidade" },
    ],
  },
  pesquisador: {
    id: "pesquisador",
    title: "Pesquisador",
    greeting: "Olá! Vamos gerar análises científicas e insights avançados hoje?",
    subtitle: "Descreva sua realidade, objetivos ou envie dados. Eu te ajudo com análise e recomendações.",
    placeholder: "Descreva o objetivo da pesquisa, variáveis ou envie dados...",
    disclaimer: "As análises são baseadas em modelos e dados disponíveis. Recomenda-se validação técnica e científica.",
    chipLabel: "Análise Científica",
    suggestions: [
      "Calcular emissões de metano em confinamento",
      "Modelar cenário de mitigação",
      "Analisar correlação entre variáveis",
      "Gerar estrutura de artigo científico",
    ],
    actions: [
      { label: "Calcular emissões de GEE (IPCC)", category: "Emissões" },
      { label: "Modelagem de carbono", category: "Modelagem" },
      { label: "Análise estatística avançada", category: "Análise" },
      { label: "Modelos preditivos", category: "Modelagem" },
      { label: "Consulta geoespacial", category: "Dados" },
      { label: "Análise de sustentabilidade", category: "Sustentabilidade" },
    ],
  },
};

interface ProfileContextType {
  activeProfile: UserProfile;
  setActiveProfile: (profile: UserProfile) => void;
  profileData: ProfileData;
  allProfiles: typeof profilesData;
}

const ProfileContext = createContext<ProfileContextType | null>(null);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [activeProfile, setActiveProfile] = useState<UserProfile>("produtor");

  return (
    <ProfileContext.Provider
      value={{
        activeProfile,
        setActiveProfile,
        profileData: profilesData[activeProfile],
        allProfiles: profilesData,
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error("useProfile must be used within ProfileProvider");
  return ctx;
}
