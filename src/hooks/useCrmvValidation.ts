import { useToast } from "@/hooks/use-toast";

export const UFS = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA",
  "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN",
  "RS", "RO", "RR", "SC", "SP", "SE", "TO"
] as const;

export type UF = typeof UFS[number];

export interface CrmvValidationResult {
  isValid: boolean;
  formattedCrmv: string | null;
}

/**
 * Validates CRMV number and UF for professional users
 * Returns validation result with formatted CRMV string
 */
export function validateCrmvFields(
  isProfessional: boolean,
  crmv: string,
  uf: string
): CrmvValidationResult {
  // Non-professionals don't need CRMV validation
  if (!isProfessional) {
    return { isValid: true, formattedCrmv: null };
  }

  // Gate keeper: CRMV is required for professionals
  if (!crmv.trim()) {
    return { isValid: false, formattedCrmv: null };
  }

  // Gate keeper: UF is required for professionals
  if (!uf.trim()) {
    return { isValid: false, formattedCrmv: null };
  }

  // Validate CRMV format (3-6 digits)
  const crmvPattern = /^\d{3,6}$/;
  if (!crmvPattern.test(crmv.trim())) {
    return { isValid: false, formattedCrmv: null };
  }

  // Validate UF format (2 letters)
  const ufPattern = /^[A-Z]{2}$/i;
  if (!ufPattern.test(uf.trim())) {
    return { isValid: false, formattedCrmv: null };
  }

  return { 
    isValid: true, 
    formattedCrmv: `${crmv.trim()}-${uf.trim().toUpperCase()}` 
  };
}

/**
 * Hook for CRMV validation with toast feedback
 */
export function useCrmvValidation() {
  const { toast } = useToast();

  const validateAndNotify = (
    isProfessional: boolean,
    crmv: string,
    uf: string
  ): CrmvValidationResult => {
    const result = validateCrmvFields(isProfessional, crmv, uf);

    if (isProfessional && !result.isValid) {
      if (!crmv.trim()) {
        toast({
          title: "CRMV obrigatório",
          description: "Para usuários veterinários, CRMV é obrigatório para emitir análise técnica.",
          variant: "destructive",
        });
      } else if (!uf.trim()) {
        toast({
          title: "UF obrigatório",
          description: "Para usuários veterinários, UF é obrigatório para emitir análise técnica.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "CRMV inválido",
          description: "Informe um número de CRMV válido (3-6 dígitos) e UF (2 letras).",
          variant: "destructive",
        });
      }
    }

    return result;
  };

  return { validateAndNotify, validateCrmvFields };
}

/**
 * Species options for multi-species support
 */
export const SPECIES_OPTIONS = [
  { value: "canina", label: "Canina (Cão)" },
  { value: "felina", label: "Felina (Gato)" },
  { value: "equina", label: "Equina (Cavalo)" },
  { value: "bovina", label: "Bovina" },
  { value: "ovina", label: "Ovina (Ovino)" },
  { value: "caprina", label: "Caprina (Caprino)" },
  { value: "suina", label: "Suína" },
  { value: "aves", label: "Aves" },
  { value: "peixes", label: "Peixes / Aquicultura" },
  { value: "silvestres", label: "Silvestres / Exóticos" },
  { value: "outra", label: "Outra" },
] as const;
