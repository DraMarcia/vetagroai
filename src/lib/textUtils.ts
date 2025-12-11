/**
 * Text utilities for cleaning and formatting AI responses
 * VetAgro Sustentável AI - Professional formatting standards
 * 
 * CRITICAL PDF RULES (STRICT COMPLIANCE):
 * 1. NO markdown tables (| colunas |) - convert to aligned lists
 * 2. NO Unicode subscripts - use ASCII only: CO2, N2O, CH4
 * 3. NO word breaking or letter spacing
 * 4. Simple headers: "SECAO 1 - IDENTIFICACAO"
 * 5. NO duplicate sections
 * 6. Short paragraphs (max 3 lines)
 * 7. NO markdown formatting (###, **, >, ---)
 * 8. NO decorative lines (%%%%%%, ========)
 * 9. NO complex tables or code blocks
 * 10. Simple list indentation only
 */

/**
 * AGGRESSIVE removal of decorative patterns and hidden characters
 */
function removeDecorativePatterns(text: string): string {
  return text
    // Remove % patterns (any sequence of 2+ percent signs)
    .replace(/%+/g, '')
    // Remove = patterns (3+ equals)
    .replace(/={3,}/g, '')
    // Remove - patterns (4+ dashes)
    .replace(/-{4,}/g, '')
    // Remove _ patterns (3+ underscores)
    .replace(/_{3,}/g, '')
    // Remove * patterns (decorative)
    .replace(/\*{3,}/g, '')
    // Remove # patterns (decorative)
    .replace(/#{3,}/g, '')
    // Remove any remaining % that got through
    .replace(/%/g, '');
}

/**
 * Remove ALL hidden unicode characters that cause PDF rendering issues
 */
function removeHiddenCharacters(text: string): string {
  return text
    // Zero-width spaces
    .replace(/[\u200B\u200C\u200D\uFEFF]/g, '')
    // Zero-width non-joiner and joiner
    .replace(/[\u2060\u2061\u2062\u2063]/g, '')
    // Soft hyphens
    .replace(/\u00AD/g, '')
    // Word joiners
    .replace(/\u2064/g, '')
    // Left-to-right and right-to-left marks
    .replace(/[\u200E\u200F\u202A-\u202E]/g, '')
    // Byte order marks
    .replace(/\uFFFE/g, '')
    // Non-breaking spaces converted to regular spaces
    .replace(/\u00A0/g, ' ')
    // Single low quotation marks (U+201A) that corrupt subscripts
    .replace(/\u201A/g, '2')
    // Other problematic characters
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, '');
}

/**
 * AGGRESSIVE fix for words with letter spacing 
 * Handles: "E m i s s õ e s", "R E L A T Ó R I O", etc.
 */
function fixLetterSpacing(text: string): string {
  // Pattern 1: Single letters separated by spaces (3+ in sequence)
  // Match: "E m i s s õ e s" -> "Emissões"
  let result = text;
  
  // Detect sequences of single letters with spaces
  const singleLetterPattern = /\b([A-Za-zÀ-ÿ])\s+([A-Za-zÀ-ÿ])\s+([A-Za-zÀ-ÿ])(\s+[A-Za-zÀ-ÿ]){2,}\b/g;
  
  result = result.replace(singleLetterPattern, (match) => {
    // Remove all spaces between single characters
    return match.replace(/\s+/g, '');
  });
  
  // Pattern 2: Common broken words (specific fixes)
  const brokenWords: [RegExp, string][] = [
    [/E\s*m\s*i\s*s\s*s\s*[oõ]\s*e\s*s/gi, 'Emissoes'],
    [/R\s*E\s*L\s*A\s*T\s*[OÓ]\s*R\s*I\s*O/gi, 'RELATORIO'],
    [/I\s*D\s*E\s*N\s*T\s*I\s*F\s*I\s*C\s*A\s*[CÇ]\s*[AÃ]\s*O/gi, 'IDENTIFICACAO'],
    [/R\s*E\s*F\s*E\s*R\s*[EÊ]\s*N\s*C\s*I\s*A\s*S/gi, 'REFERENCIAS'],
    [/T\s*[EÉ]\s*C\s*N\s*I\s*C\s*A\s*S/gi, 'TECNICAS'],
    [/A\s*V\s*I\s*S\s*O/gi, 'AVISO'],
    [/L\s*E\s*G\s*A\s*L/gi, 'LEGAL'],
    [/A\s*N\s*[AÁ]\s*L\s*I\s*S\s*E/gi, 'ANALISE'],
    [/C\s*[AÁ]\s*L\s*C\s*U\s*L\s*O\s*S/gi, 'CALCULOS'],
    [/R\s*E\s*S\s*U\s*L\s*T\s*A\s*D\s*O\s*S/gi, 'RESULTADOS'],
    [/R\s*E\s*C\s*O\s*M\s*E\s*N\s*D\s*A\s*[CÇ]\s*[OÕ]\s*E\s*S/gi, 'RECOMENDACOES'],
    [/M\s*O\s*N\s*I\s*T\s*O\s*R\s*A\s*M\s*E\s*N\s*T\s*O/gi, 'MONITORAMENTO'],
    [/C\s*O\s*N\s*S\s*E\s*L\s*H\s*O/gi, 'CONSELHO'],
    [/D\s*o\s*c\s*u\s*m\s*e\s*n\s*t\s*o/gi, 'Documento'],
    [/S\s*u\s*s\s*t\s*e\s*n\s*t\s*[aá]\s*v\s*e\s*l/gi, 'Sustentavel'],
  ];
  
  for (const [pattern, replacement] of brokenWords) {
    result = result.replace(pattern, replacement);
  }
  
  return result;
}

/**
 * Fix numbers that got spaced incorrectly (e.g., "2 4 9 9 . 5" -> "2499.5")
 */
function fixSpacedNumbers(text: string): string {
  return text
    // Fix spaced digits
    .replace(/(\d)\s+(\d)/g, '$1$2')
    // Fix spaced decimal points
    .replace(/(\d)\s*\.\s*(\d)/g, '$1.$2')
    // Fix spaced commas in numbers
    .replace(/(\d)\s*,\s*(\d)/g, '$1,$2')
    // Fix "1 0 / 1 2 / 2 0 2 5" date patterns
    .replace(/(\d)\s*\/\s*(\d)/g, '$1/$2');
}

/**
 * Convert Unicode chemical formulas to ASCII for PDF safety
 * CO₂ -> CO2, CH₄ -> CH4, N₂O -> N2O
 */
function convertChemicalToASCII(text: string): string {
  return text
    // Convert subscript numbers to regular numbers
    .replace(/₀/g, '0')
    .replace(/₁/g, '1')
    .replace(/₂/g, '2')
    .replace(/₃/g, '3')
    .replace(/₄/g, '4')
    .replace(/₅/g, '5')
    .replace(/₆/g, '6')
    .replace(/₇/g, '7')
    .replace(/₈/g, '8')
    .replace(/₉/g, '9')
    // Fix corrupted subscripts (U+201A comma-like character)
    .replace(/CO\s*[‚,„]\s*e\s*q/gi, 'CO2eq')
    .replace(/CO\s*[‚,„]\s*e/gi, 'CO2e')
    .replace(/CO\s*[‚,„]/gi, 'CO2')
    .replace(/CH\s*[‚,„]/gi, 'CH4')
    .replace(/N\s*[‚,„]\s*O/gi, 'N2O')
    // Standardize common formulas
    .replace(/CO₂eq/gi, 'CO2eq')
    .replace(/CO₂e/gi, 'CO2e')
    .replace(/CO₂/gi, 'CO2')
    .replace(/CH₄/gi, 'CH4')
    .replace(/N₂O/gi, 'N2O')
    .replace(/H₂O/gi, 'H2O')
    .replace(/O₂/gi, 'O2')
    .replace(/tCO₂eq/gi, 'tCO2eq')
    .replace(/kgCO₂eq/gi, 'kgCO2eq')
    // Fix common corrupted patterns from AI output
    .replace(/t\s*CO\s*2\s*eq/gi, 'tCO2eq')
    .replace(/kg\s*CO\s*2\s*eq/gi, 'kgCO2eq');
}

/**
 * Remove special symbols that corrupt PDFs
 */
function removeProblematicSymbols(text: string): string {
  return text
    // Convert arrows to simple text
    .replace(/[→⇒⇐⇔←↑↓]/g, '->')
    // Remove problematic symbols
    .replace(/[±‰†‡°˚·¶§©®™]/g, '')
    // Convert special quotes
    .replace(/[""]/g, '"')
    .replace(/['']/g, "'")
    .replace(/[–—]/g, '-')
    .replace(/…/g, '...')
    // Remove warning/emoji symbols
    .replace(/⚠️?/g, 'ATENCAO: ')
    .replace(/[📌📍🔔💡⚡🛑✔️❌✅⭐🔹🔸🟩🟨🟧🟦🟪🔴🟢🔵⬛⬜🟤🟠🔶🔷]/g, '');
}

/**
 * Check if content contains HTML
 */
function isHtmlContent(text: string): boolean {
  return /<(div|table|h[1-6]|p|tr|td|th|strong|br|span)[^>]*>/i.test(text);
}

/**
 * Convert HTML table to aligned parameter list (NOT markdown tables)
 */
function convertHtmlTableToAlignedList(tableHtml: string): string {
  const rows: string[][] = [];
  const rowMatches = tableHtml.match(/<tr[^>]*>[\s\S]*?<\/tr>/gi) || [];
  
  for (const rowHtml of rowMatches) {
    const cells: string[] = [];
    const cellMatches = rowHtml.match(/<(td|th)[^>]*>([\s\S]*?)<\/(td|th)>/gi) || [];
    
    for (const cellHtml of cellMatches) {
      let cellText = cellHtml
        .replace(/<(td|th)[^>]*>/gi, '')
        .replace(/<\/(td|th)>/gi, '')
        .replace(/<strong[^>]*>([\s\S]*?)<\/strong>/gi, '$1')
        .replace(/<b[^>]*>([\s\S]*?)<\/b>/gi, '$1')
        .replace(/<[^>]+>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/\s+/g, ' ')
        .trim();
      cells.push(cellText);
    }
    
    if (cells.length > 0) {
      rows.push(cells);
    }
  }
  
  if (rows.length === 0) return '';
  
  // Convert to aligned parameter list (NO markdown tables)
  let result = '\n';
  const isHeaderRow = tableHtml.includes('<th');
  
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (row.every(cell => !cell.trim())) continue;
    
    if (row.length === 2) {
      const label = row[0].replace(/[:\s]+$/, '');
      const value = row[1] || '-';
      result += `  - ${label}: ${value}\n`;
    } else if (row.length >= 3) {
      result += `  - ${row.join(' - ')}\n`;
    } else if (row.length === 1) {
      result += `  - ${row[0]}\n`;
    }
  }
  
  return result + '\n';
}

/**
 * Convert markdown tables to aligned parameter lists
 */
function convertMarkdownTableToList(text: string): string {
  // Match markdown tables
  const tablePattern = /\|[^\n]+\|\n(\|[-:| ]+\|\n)?(\|[^\n]+\|\n?)*/g;
  
  return text.replace(tablePattern, (table) => {
    const lines = table.trim().split('\n');
    let result = '\n';
    
    for (const line of lines) {
      // Skip separator lines
      if (line.match(/^\|[\s-:|]+\|$/)) continue;
      
      const cells = line.split('|')
        .filter(c => c.trim())
        .map(c => c.trim());
      
      if (cells.length === 0) continue;
      
      if (cells.length === 2) {
        result += `  - ${cells[0]}: ${cells[1]}\n`;
      } else if (cells.length === 3) {
        result += `  - ${cells[0]}: ${cells[1]} (${cells[2]})\n`;
      } else if (cells.length >= 1) {
        result += `  - ${cells.join(' - ')}\n`;
      }
    }
    
    return result + '\n';
  });
}

/**
 * Convert HTML content to clean plain text
 */
function convertHtmlToText(html: string): string {
  let text = html;
  
  // Convert tables to aligned lists
  text = text.replace(/<table[^>]*>[\s\S]*?<\/table>/gi, (match) => {
    return convertHtmlTableToAlignedList(match);
  });
  
  // Convert headings to simple format (ASCII safe)
  text = text.replace(/<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/gi, (_, content) => {
    const cleanContent = content.replace(/<[^>]+>/g, '').trim().toUpperCase();
    return `\n\n${cleanContent}:\n`;
  });
  
  // Remove formatting tags but keep content
  text = text.replace(/<strong[^>]*>([\s\S]*?)<\/strong>/gi, '$1');
  text = text.replace(/<b[^>]*>([\s\S]*?)<\/b>/gi, '$1');
  text = text.replace(/<em[^>]*>([\s\S]*?)<\/em>/gi, '$1');
  text = text.replace(/<i[^>]*>([\s\S]*?)<\/i>/gi, '$1');
  
  // Convert line breaks
  text = text.replace(/<br\s*\/?>/gi, '\n');
  text = text.replace(/<\/p>/gi, '\n\n');
  text = text.replace(/<p[^>]*>/gi, '');
  text = text.replace(/<\/div>/gi, '\n');
  text = text.replace(/<div[^>]*>/gi, '');
  
  // Convert lists
  text = text.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, '  - $1\n');
  text = text.replace(/<\/?[ou]l[^>]*>/gi, '\n');
  
  // Remove remaining tags
  text = text.replace(/<[^>]+>/g, '');
  
  // Decode entities
  text = text.replace(/&nbsp;/g, ' ');
  text = text.replace(/&amp;/g, '&');
  text = text.replace(/&lt;/g, '<');
  text = text.replace(/&gt;/g, '>');
  text = text.replace(/&quot;/g, '"');
  text = text.replace(/&#39;/g, "'");
  text = text.replace(/&apos;/g, "'");
  
  return text.trim();
}

/**
 * Split long paragraphs into shorter ones (max ~150 chars)
 */
function splitLongParagraphs(text: string): string {
  const MAX_PARA_LENGTH = 180;
  const lines = text.split('\n');
  const result: string[] = [];
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    // Skip short lines, bullet points, headers
    if (trimmed.length <= MAX_PARA_LENGTH || 
        trimmed.startsWith('-') || 
        trimmed.startsWith('•') ||
        trimmed.match(/^[A-Z\s]+:$/)) {
      result.push(line);
      continue;
    }
    
    // Split long paragraphs at sentence boundaries
    const sentences = trimmed.match(/[^.!?]+[.!?]+/g) || [trimmed];
    let currentPara = '';
    
    for (const sentence of sentences) {
      if ((currentPara + sentence).length <= MAX_PARA_LENGTH) {
        currentPara += sentence;
      } else {
        if (currentPara) result.push(currentPara.trim());
        currentPara = sentence;
      }
    }
    if (currentPara) result.push(currentPara.trim());
  }
  
  return result.join('\n');
}

/**
 * Remove duplicate sections from text
 */
function removeDuplicateSections(text: string): string {
  const lines = text.split('\n');
  const seenSections = new Set<string>();
  const result: string[] = [];
  let skipUntilNextSection = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim().toUpperCase();
    
    // Check if this is a section header
    const isSectionHeader = 
      trimmed.match(/^[A-Z\s]{4,}:?$/) ||
      trimmed.match(/^\d+\)\s*[A-Z]/) ||
      trimmed.match(/^SECAO\s*\d+/i);
    
    if (isSectionHeader) {
      const normalizedHeader = trimmed
        .replace(/[:\s]+/g, '')
        .replace(/^\d+\)/g, '');
      
      if (seenSections.has(normalizedHeader)) {
        skipUntilNextSection = true;
        continue;
      }
      
      seenSections.add(normalizedHeader);
      skipUntilNextSection = false;
    }
    
    if (!skipUntilNextSection) {
      result.push(line);
    }
  }
  
  return result.join('\n');
}

/**
 * CRITICAL: Pre-process continuous text to add line breaks before section titles
 * This handles AI responses that come without proper line breaks
 */
export function preprocessContinuousText(text: string): string {
  if (!text) return '';
  
  let processed = text;
  
  // Known section title keywords - add line breaks before them
  const sectionKeywords = [
    'SÍNTESE EXECUTIVA',
    'SINTESE EXECUTIVA',
    'DADOS DO PRODUTOR',
    'PROJEÇÕES ZOOTÉCNICAS',
    'PROJECOES ZOOTECNICAS',
    'ANÁLISE ECONÔMICA',
    'ANALISE ECONOMICA',
    'ANÁLISE DE SENSIBILIDADE',
    'ANALISE DE SENSIBILIDADE',
    'ANÁLISE DE EMISSÕES',
    'ANALISE DE EMISSOES',
    'VIABILIDADE COM GIROS',
    'RECOMENDAÇÕES TÉCNICAS',
    'RECOMENDACOES TECNICAS',
    'REFERÊNCIAS TÉCNICAS',
    'REFERENCIAS TECNICAS',
    'IDENTIFICAÇÃO DO CASO',
    'IDENTIFICACAO DO CASO',
    'AVALIAÇÃO CLÍNICA',
    'DIAGNÓSTICOS DIFERENCIAIS',
    'EXAMES COMPLEMENTARES',
    'CLASSIFICAÇÃO DE URGÊNCIA',
    'RECOMENDAÇÕES PRÁTICAS',
    'CONSIDERAÇÕES FINAIS',
    'CONCLUSÃO TÉCNICA',
    'ALERTA LEGAL',
    'AVISO LEGAL',
    'REFERÊNCIAS CONSULTADAS',
    'CUSTOS DE ENTRADA',
    'CUSTOS DE ALIMENTAÇÃO',
    'CUSTOS OPERACIONAIS',
    'ANALISE DE RESULTADO',
    'CENÁRIO BASE',
    'CENARIO BASE',
    'CENÁRIO 1',
    'CENARIO 1',
    'CENÁRIO 2',
    'CENARIO 2',
    'ESTRATÉGIAS PARA MELHORAR',
    'ESTRATEGIAS PARA MELHORAR',
    'REDUÇÃO DE METANO',
    'REDUCAO DE METANO',
    'MANEJO SUSTENTÁVEL',
    'MANEJO SUSTENTAVEL',
    'ALTERNATIVAS NUTRICIONAIS',
  ];
  
  for (const keyword of sectionKeywords) {
    // Add line breaks before section keywords (case insensitive)
    const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`([^\\n])\\s*(${escapedKeyword})`, 'gi');
    processed = processed.replace(regex, '$1\n\n$2');
  }
  
  // Add line breaks before numbered subsections like "4.1", "4.2", etc.
  processed = processed.replace(/([^\\n])(\d+\.\d+\s+[A-ZÁÉÍÓÚÂÊÔÃÕÇ])/g, '$1\n\n$2');
  
  // Add line breaks before bullet points that are stuck to previous text
  processed = processed.replace(/([.!?:])(\s*)(-\s+[A-ZÁÉÍÓÚÂÊÔÃÕÇ])/g, '$1\n$3');
  processed = processed.replace(/([a-záéíóúâêôãõç])(-\s+[A-Z])/gi, '$1\n$2');
  
  // Fix bullet points that are stuck together (ending with period followed by dash)
  processed = processed.replace(/(\.)(-\s+)/g, '.\n$2');
  
  // Clean up multiple line breaks
  processed = processed.replace(/\n{3,}/g, '\n\n');
  
  return processed.trim();
}

/**
 * Master cleaning function for display
 */
export function cleanTextForDisplay(text: string): string {
  if (!text) return '';
  
  let cleaned = text;
  
  // Step 0: Pre-process continuous text to add line breaks
  cleaned = preprocessContinuousText(cleaned);
  
  // Step 1: Remove decorative patterns FIRST
  cleaned = removeDecorativePatterns(cleaned);
  
  // Step 2: Remove ALL hidden unicode characters
  cleaned = removeHiddenCharacters(cleaned);
  
  // Step 3: Convert HTML if present
  if (isHtmlContent(cleaned)) {
    cleaned = convertHtmlToText(cleaned);
  }
  
  // Step 4: Fix letter spacing issues
  cleaned = fixLetterSpacing(cleaned);
  
  // Step 5: Fix spaced numbers
  cleaned = fixSpacedNumbers(cleaned);
  
  // Step 6: Remove markdown formatting
  cleaned = cleaned.replace(/^#{1,6}\s*/gm, '');
  cleaned = cleaned.replace(/\*\*\*([^*]+)\*\*\*/g, '$1');
  cleaned = cleaned.replace(/\*\*([^*]+)\*\*/g, '$1');
  cleaned = cleaned.replace(/\*([^*\n]+)\*/g, '$1');
  cleaned = cleaned.replace(/^\s*\*\s+/gm, '  - ');
  cleaned = cleaned.replace(/\*/g, '');
  cleaned = cleaned.replace(/__([^_]+)__/g, '$1');
  cleaned = cleaned.replace(/_([^_]+)_/g, '$1');
  cleaned = cleaned.replace(/^[-]\s+/gm, '  - ');
  cleaned = cleaned.replace(/#/g, '');
  
  // Step 7: Remove emojis
  cleaned = cleaned.replace(/[\u{1F300}-\u{1F9FF}]/gu, '');
  cleaned = cleaned.replace(/[\u{2600}-\u{26FF}]/gu, '');
  cleaned = cleaned.replace(/[\u{2700}-\u{27BF}]/gu, '');
  cleaned = cleaned.replace(/[\u{1F600}-\u{1F64F}]/gu, '');
  cleaned = cleaned.replace(/[\u{1F680}-\u{1F6FF}]/gu, '');
  cleaned = cleaned.replace(/[\u{1F1E0}-\u{1F1FF}]/gu, '');
  
  // Step 8: Remove code blocks
  cleaned = cleaned.replace(/`([^`]+)`/g, '$1');
  cleaned = cleaned.replace(/```[\s\S]*?```/g, '');
  
  // Step 9: Final cleanup
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
  cleaned = cleaned.replace(/  +/g, ' ');
  cleaned = cleaned.trim();
  
  return cleaned;
}

/**
 * Master cleaning function for PDF export
 * STRICT COMPLIANCE with PDF rules
 */
export function cleanTextForPDF(text: string): string {
  if (!text) return '';
  
  let cleaned = text;
  
  // Step 1: AGGRESSIVE removal of decorative patterns
  cleaned = removeDecorativePatterns(cleaned);
  
  // Step 2: Remove ALL hidden unicode characters
  cleaned = removeHiddenCharacters(cleaned);
  
  // Step 3: Fix letter spacing EARLY
  cleaned = fixLetterSpacing(cleaned);
  
  // Step 4: Fix spaced numbers
  cleaned = fixSpacedNumbers(cleaned);
  
  // Step 5: Convert HTML if present
  if (isHtmlContent(cleaned)) {
    cleaned = convertHtmlToText(cleaned);
  }
  
  // Step 6: Convert markdown tables to aligned lists
  cleaned = convertMarkdownTableToList(cleaned);
  
  // Step 7: Apply standard display cleaning
  cleaned = cleanTextForDisplay(cleaned);
  
  // Step 8: Convert chemical formulas to ASCII (NO subscripts)
  cleaned = convertChemicalToASCII(cleaned);
  
  // Step 9: Remove problematic symbols
  cleaned = removeProblematicSymbols(cleaned);
  
  // Step 10: Remove duplicate sections
  cleaned = removeDuplicateSections(cleaned);
  
  // Step 11: Split long paragraphs
  cleaned = splitLongParagraphs(cleaned);
  
  // Step 12: Fix spacing after punctuation
  cleaned = cleaned.replace(/([.!?])([A-Z])/g, '$1 $2');
  
  // Step 13: Final aggressive cleanup - one more pass
  cleaned = removeDecorativePatterns(cleaned);
  cleaned = removeHiddenCharacters(cleaned);
  cleaned = fixLetterSpacing(cleaned);
  cleaned = fixSpacedNumbers(cleaned);
  
  // Step 14: Clean up whitespace
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
  cleaned = cleaned.replace(/  +/g, ' ');
  cleaned = cleaned.replace(/^\s+/gm, '');
  
  return cleaned.trim();
}

/**
 * Parse content into structured sections for reports
 * Also removes duplicate sections
 */
export function parseReportSections(content: string): { title: string; body: string }[] {
  const sections: { title: string; body: string }[] = [];
  const lines = content.split('\n');
  const seenTitles = new Set<string>();
  
  let currentSection: { title: string; body: string } = { title: '', body: '' };
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    // Detect section titles (numbered or all caps)
    const numberedTitleMatch = trimmedLine.match(/^(\d+)\)\s*([A-Za-zÀ-ÿ\s]+)(?::|$)/);
    const capsTitle = trimmedLine.match(/^([A-ZÁÀÂÃÉÊÍÓÔÕÚÇ\s]{3,50}):?$/);
    const sectionMatch = trimmedLine.match(/^SECAO\s*\d+\s*[-—]\s*(.+)/i);
    
    const isSectionTitle = 
      (numberedTitleMatch !== null) ||
      (sectionMatch !== null) ||
      (capsTitle !== null && 
       trimmedLine.length > 2 && 
       trimmedLine.length < 80 &&
       !trimmedLine.startsWith('-') &&
       !trimmedLine.startsWith('•'));
    
    if (isSectionTitle) {
      // Save current section if not empty
      if (currentSection.title || currentSection.body.trim()) {
        // Only add if not duplicate
        const normalizedTitle = currentSection.title.replace(/[\s:]+/g, '').toUpperCase();
        if (!seenTitles.has(normalizedTitle)) {
          seenTitles.add(normalizedTitle);
          sections.push({ ...currentSection });
        }
      }
      
      // Extract clean title
      let cleanTitle = trimmedLine.replace(/:$/, '');
      cleanTitle = cleanTitle.replace(/^\d+\)\s*/, '');
      cleanTitle = cleanTitle.replace(/^SECAO\s*\d+\s*[-—]\s*/i, '');
      
      // Check if this title is duplicate
      const normalizedNewTitle = cleanTitle.replace(/[\s:]+/g, '').toUpperCase();
      if (seenTitles.has(normalizedNewTitle)) {
        // Skip duplicate section - continue adding to current body
        continue;
      }
      
      currentSection = { title: cleanTitle.trim().toUpperCase(), body: '' };
    } else {
      currentSection.body += line + '\n';
    }
  }
  
  // Add last section if not empty and not duplicate
  if (currentSection.title || currentSection.body.trim()) {
    const normalizedTitle = currentSection.title.replace(/[\s:]+/g, '').toUpperCase();
    if (!seenTitles.has(normalizedTitle)) {
      sections.push(currentSection);
    }
  }
  
  return sections;
}

/**
 * Format references for display (ASCII safe)
 */
export function formatReferences(references: string[]): string[] {
  const seen = new Set<string>();
  
  return references
    .map(ref => {
      let cleaned = ref.replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1');
      cleaned = cleaned.replace(/^[-*•]\s*/, '');
      cleaned = cleaned.replace(/\*/g, '');
      cleaned = cleaned.replace(/#/g, '');
      cleaned = removeHiddenCharacters(cleaned);
      cleaned = convertChemicalToASCII(cleaned);
      cleaned = cleaned.trim();
      return cleaned;
    })
    .filter(ref => {
      if (seen.has(ref.toLowerCase())) return false;
      seen.add(ref.toLowerCase());
      return ref.length > 0;
    });
}

/**
 * Format text for professional display
 */
export function formatForJustifiedDisplay(text: string): string {
  let formatted = cleanTextForDisplay(text);
  formatted = formatted.replace(/\n{3,}/g, '\n\n');
  formatted = formatted.replace(/^[•\-–]\s*/gm, '  - ');
  return formatted;
}

// ============= Table Extraction Types =============

export interface TableData {
  headers: string[];
  rows: string[][];
  title?: string;
}

/**
 * Extract tables from content for proper PDF rendering
 * Returns both the tables and the content with tables replaced by placeholders
 */
export function extractTablesFromContent(content: string): {
  tables: TableData[];
  contentWithPlaceholders: string;
} {
  const tables: TableData[] = [];
  let contentWithPlaceholders = content;
  let tableIndex = 0;

  // Pattern 1: Markdown tables (| col1 | col2 |)
  const markdownTablePattern = /\|[^\n]+\|\n(\|[-:| ]+\|\n)?(\|[^\n]+\|\n?)*/g;
  
  contentWithPlaceholders = contentWithPlaceholders.replace(markdownTablePattern, (match) => {
    const lines = match.trim().split('\n');
    const tableData: TableData = { headers: [], rows: [] };
    
    let isFirstDataRow = true;
    
    for (const line of lines) {
      // Skip separator lines
      if (line.match(/^\|[\s-:|]+\|$/)) continue;
      
      const cells = line.split('|')
        .filter(c => c.trim())
        .map(c => cleanCellContent(c.trim()));
      
      if (cells.length === 0) continue;
      
      if (isFirstDataRow) {
        tableData.headers = cells;
        isFirstDataRow = false;
      } else {
        tableData.rows.push(cells);
      }
    }
    
    if (tableData.headers.length > 0 || tableData.rows.length > 0) {
      tables.push(tableData);
      return `[[TABLE_${tableIndex++}]]`;
    }
    return match;
  });

  // Pattern 2: HTML tables
  const htmlTablePattern = /<table[^>]*>[\s\S]*?<\/table>/gi;
  
  contentWithPlaceholders = contentWithPlaceholders.replace(htmlTablePattern, (match) => {
    const tableData = parseHtmlTable(match);
    if (tableData.headers.length > 0 || tableData.rows.length > 0) {
      tables.push(tableData);
      return `[[TABLE_${tableIndex++}]]`;
    }
    return match;
  });

  return { tables, contentWithPlaceholders };
}

/**
 * Clean individual cell content
 */
function cleanCellContent(cell: string): string {
  let cleaned = cell;
  
  // Remove markdown formatting
  cleaned = cleaned.replace(/\*\*([^*]+)\*\*/g, '$1');
  cleaned = cleaned.replace(/\*([^*]+)\*/g, '$1');
  cleaned = cleaned.replace(/__([^_]+)__/g, '$1');
  cleaned = cleaned.replace(/_([^_]+)_/g, '$1');
  
  // Convert chemical formulas
  cleaned = cleaned
    .replace(/CO₂/gi, 'CO2')
    .replace(/CH₄/gi, 'CH4')
    .replace(/N₂O/gi, 'N2O')
    .replace(/tCO₂eq/gi, 'tCO2eq');
  
  // Remove hidden characters
  cleaned = cleaned.replace(/[\u200B\u200C\u200D\uFEFF\u00AD]/g, '');
  
  // Fix spaced numbers
  cleaned = cleaned.replace(/(\d)\s+(\d)/g, '$1$2');
  
  return cleaned.trim();
}

/**
 * Parse HTML table to TableData
 */
function parseHtmlTable(tableHtml: string): TableData {
  const tableData: TableData = { headers: [], rows: [] };
  
  // Extract header cells
  const headerMatch = tableHtml.match(/<thead[^>]*>[\s\S]*?<\/thead>/i);
  if (headerMatch) {
    const thMatches = headerMatch[0].match(/<th[^>]*>([\s\S]*?)<\/th>/gi) || [];
    tableData.headers = thMatches.map(th => {
      return cleanCellContent(
        th.replace(/<th[^>]*>/gi, '').replace(/<\/th>/gi, '').replace(/<[^>]+>/g, '')
      );
    });
  }
  
  // Extract body rows
  const rowMatches = tableHtml.match(/<tr[^>]*>[\s\S]*?<\/tr>/gi) || [];
  
  for (const rowHtml of rowMatches) {
    // Skip header rows
    if (rowHtml.includes('<th')) {
      if (tableData.headers.length === 0) {
        const thMatches = rowHtml.match(/<th[^>]*>([\s\S]*?)<\/th>/gi) || [];
        tableData.headers = thMatches.map(th => {
          return cleanCellContent(
            th.replace(/<th[^>]*>/gi, '').replace(/<\/th>/gi, '').replace(/<[^>]+>/g, '')
          );
        });
      }
      continue;
    }
    
    const cellMatches = rowHtml.match(/<td[^>]*>([\s\S]*?)<\/td>/gi) || [];
    if (cellMatches.length > 0) {
      const row = cellMatches.map(td => {
        return cleanCellContent(
          td.replace(/<td[^>]*>/gi, '').replace(/<\/td>/gi, '').replace(/<[^>]+>/g, '')
        );
      });
      
      // If no headers yet and this is first row, use as headers
      if (tableData.headers.length === 0 && tableData.rows.length === 0) {
        tableData.headers = row;
      } else {
        tableData.rows.push(row);
      }
    }
  }
  
  return tableData;
}
