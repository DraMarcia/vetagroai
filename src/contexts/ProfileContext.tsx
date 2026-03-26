import { createContext, useContext, useState, ReactNode } from "react";

export type UserProfile = 
  | "veterinario" 
  | "zootecnista" 
  | "agronomo" 
  | "produtor" 
  | "pesquisador";

export type ActiveProfile = UserProfile | null;

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
    greeting: "Olá! 👋\n\nSou sua assistente em Medicina Veterinária.\n\nPosso te ajudar com:\n• Diagnóstico e conduta clínica\n• Sanidade e prevenção\n• Bem-estar animal\n• Protocolos e manejo\n\nDescreva o caso ou sintomas do animal.\nExemplo: 'Bovino com perda de peso e apatia, o que pode ser?'\n\nTambém avalio impactos produtivos e ambientais nas recomendações.\nVamos começar?",
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
    greeting: "Olá! 👋\n\nSou sua assistente em Zootecnia, focada em eficiência produtiva.\n\nPosso te ajudar com:\n• Formulação de dietas\n• Ganho de peso e desempenho\n• Conversão alimentar\n• Redução de custos\n• Sustentabilidade da produção\n\nPara começar, me diga:\n👉 espécie + fase produtiva\n👉 objetivo (ganho, custo, reprodução)\n\nExemplo: 'Suínos com 30 kg, quero melhorar desempenho.'\n\nTambém analiso impacto ambiental e eficiência do sistema.\nVamos começar? 🚀",
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
    greeting: "Olá! 👋\n\nSou sua assistente em Agronomia.\n\nPosso te ajudar com:\n• Manejo de culturas\n• Fertilidade do solo\n• Pragas e doenças\n• Planejamento produtivo\n\nDescreva sua cultura ou problema.\nExemplo: 'Milho com baixa produtividade, o que pode ser?'\n\nIncluo análise de sustentabilidade e uso eficiente de recursos.\nVamos começar?",
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
    greeting: "Olá! 👋\n\nSou sua assistente para gestão da produção rural.\n\nPosso te ajudar com:\n• Produção e rentabilidade\n• Manejo do sistema\n• Redução de custos\n• Tomada de decisão\n\nMe conte sobre sua propriedade ou desafio.\nExemplo: 'Quero melhorar a rentabilidade do meu sistema.'\n\nTambém avalio impactos ambientais e eficiência.\nVamos começar?",
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
    greeting: "Olá! 👋\n\nSou sua assistente para análise técnica e científica.\n\nPosso te ajudar com:\n• Interpretação de dados\n• Estruturação de análises\n• Discussões técnicas\n• Modelagem e indicadores\n\nDescreva seu estudo ou objetivo.\nExemplo: 'Analisar emissões de metano em confinamento.'\n\nIncluo análise crítica e relação com sustentabilidade.\nVamos começar?",
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
  activeProfile: ActiveProfile;
  setActiveProfile: (profile: UserProfile) => void;
  profileData: ProfileData | null;
  allProfiles: typeof profilesData;
}

const ProfileContext = createContext<ProfileContextType | null>(null);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [activeProfile, setActiveProfile] = useState<ActiveProfile>(null);

  return (
    <ProfileContext.Provider
      value={{
        activeProfile,
        setActiveProfile,
        profileData: activeProfile ? profilesData[activeProfile] : null,
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
