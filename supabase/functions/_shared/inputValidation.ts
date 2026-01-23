// ===== INPUT VALIDATION & SANITIZATION =====
// Protects against prompt injection and malicious inputs

/**
 * Maximum allowed input length for AI prompts
 */
export const MAX_INPUT_LENGTH = 10000;

/**
 * Suspicious patterns that may indicate prompt injection attempts
 */
const SUSPICIOUS_PATTERNS = [
  /ignore\s+(all\s+)?(previous|prior|above)\s+(instructions?|prompts?|rules?)/i,
  /disregard\s+(all\s+)?(previous|prior|above)\s+(instructions?|prompts?|rules?)/i,
  /forget\s+(all\s+)?(previous|prior|above)\s+(instructions?|prompts?|rules?)/i,
  /you\s+are\s+now\s+(a|an|the)/i,
  /pretend\s+(you\s+are|to\s+be)/i,
  /act\s+as\s+(if|a|an|the)/i,
  /new\s+instructions?:/i,
  /system\s*prompt/i,
  /\[SYSTEM\]/i,
  /\[INST\]/i,
  /<<SYS>>/i,
  /<\|im_start\|>/i,
  /\bDAN\b.*\bmode\b/i, // "DAN mode" jailbreak
  /jailbreak/i,
  /bypass\s+(safety|filter|restriction)/i,
];

/**
 * Characters/sequences to remove from input
 */
const CONTROL_CHARS_REGEX = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g;

export interface ValidationResult {
  valid: boolean;
  sanitized: string;
  error?: string;
  warnings: string[];
}

/**
 * Validates and sanitizes user input before passing to AI
 */
export function validateAndSanitizeInput(
  input: string | null | undefined,
  fieldName: string = 'input',
  maxLength: number = MAX_INPUT_LENGTH
): ValidationResult {
  const warnings: string[] = [];

  // Check for null/undefined
  if (input === null || input === undefined) {
    return {
      valid: false,
      sanitized: '',
      error: `${fieldName} não pode ser vazio`,
      warnings,
    };
  }

  // Ensure it's a string
  if (typeof input !== 'string') {
    return {
      valid: false,
      sanitized: '',
      error: `${fieldName} deve ser texto`,
      warnings,
    };
  }

  // Remove control characters
  let sanitized = input.replace(CONTROL_CHARS_REGEX, '');

  // Trim whitespace
  sanitized = sanitized.trim();

  // Check if empty after sanitization
  if (sanitized.length === 0) {
    return {
      valid: false,
      sanitized: '',
      error: `${fieldName} não pode ser vazio`,
      warnings,
    };
  }

  // Check length
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
    warnings.push(`${fieldName} foi truncado para ${maxLength} caracteres`);
  }

  // Check for suspicious patterns
  for (const pattern of SUSPICIOUS_PATTERNS) {
    if (pattern.test(sanitized)) {
      warnings.push(`Padrão suspeito detectado em ${fieldName}`);
      // Log for monitoring but don't block - could be false positive
      console.warn(`[SECURITY] Suspicious pattern detected in ${fieldName}: ${pattern.source}`);
      break;
    }
  }

  return {
    valid: true,
    sanitized,
    warnings,
  };
}

/**
 * Validates multiple inputs at once
 */
export function validateMultipleInputs(
  inputs: Record<string, string | null | undefined>,
  maxLength: number = MAX_INPUT_LENGTH
): { valid: boolean; sanitized: Record<string, string>; errors: string[]; warnings: string[] } {
  const sanitized: Record<string, string> = {};
  const errors: string[] = [];
  const allWarnings: string[] = [];

  for (const [fieldName, value] of Object.entries(inputs)) {
    // Skip optional empty fields
    if (value === null || value === undefined || (typeof value === 'string' && value.trim() === '')) {
      sanitized[fieldName] = '';
      continue;
    }

    const result = validateAndSanitizeInput(value, fieldName, maxLength);
    
    if (!result.valid && result.error) {
      errors.push(result.error);
    }
    
    sanitized[fieldName] = result.sanitized;
    allWarnings.push(...result.warnings);
  }

  return {
    valid: errors.length === 0,
    sanitized,
    errors,
    warnings: allWarnings,
  };
}

/**
 * Sanitizes clinical/medical data specifically
 * More permissive than general input - allows medical terminology
 */
export function sanitizeClinicalData(input: string | null | undefined): string {
  if (!input || typeof input !== 'string') return '';
  
  // Remove control characters but preserve medical symbols
  let sanitized = input.replace(CONTROL_CHARS_REGEX, '');
  
  // Truncate if too long
  if (sanitized.length > MAX_INPUT_LENGTH) {
    sanitized = sanitized.substring(0, MAX_INPUT_LENGTH);
  }
  
  return sanitized.trim();
}

/**
 * Validates array of strings (e.g., history messages)
 */
export function validateMessageHistory(
  history: unknown[],
  maxMessages: number = 20,
  maxMessageLength: number = 5000
): { role: string; content: string }[] {
  if (!Array.isArray(history)) return [];
  
  return history
    .slice(-maxMessages) // Take only last N messages
    .filter((msg): msg is { role: string; content: string } => 
      typeof msg === 'object' &&
      msg !== null &&
      typeof (msg as Record<string, unknown>).role === 'string' &&
      typeof (msg as Record<string, unknown>).content === 'string'
    )
    .map(msg => ({
      role: msg.role === 'assistant' ? 'assistant' : 'user',
      content: sanitizeClinicalData(msg.content).substring(0, maxMessageLength),
    }));
}
