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
    .replace(/\u201A/g, '')
    // Other problematic characters
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
    // Remove %%%%%%%% patterns
    .replace(/%{2,}/g, '')
    // Remove ======== patterns
    .replace(/={3,}/g, '')
    // Remove -------- patterns (decorative)
    .replace(/-{4,}/g, '');
}

/**
 * Fix numbers that got spaced incorrectly (e.g., "2 4 9 9 . 5" -> "2499.5")
 */
function fixSpacedNumbers(text: string): string {
  return text
    .replace(/(\d)\s+(\d)/g, '$1$2')
    .replace(/(\d)\s*\.\s*(\d)/g, '$1.$2')
    .replace(/(\d)\s*,\s*(\d)/g, '$1,$2');
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
    // Fix corrupted subscripts
    .replace(/CO\s*[‚,]\s*eq?/gi, 'CO2eq')
    .replace(/CO\s*[‚,]\s*e\s*q?/gi, 'CO2eq')
    .replace(/CH\s*[‚,]\s*/gi, 'CH4')
    .replace(/N\s*[‚,]\s*O/gi, 'N2O')
    // Standardize common formulas
    .replace(/CO₂eq/gi, 'CO2eq')
    .replace(/CO₂e/gi, 'CO2e')
    .replace(/CO₂/gi, 'CO2')
    .replace(/CH₄/gi, 'CH4')
    .replace(/N₂O/gi, 'N2O')
    .replace(/H₂O/gi, 'H2O')
    .replace(/O₂/gi, 'O2')
    .replace(/tCO₂eq/gi, 'tCO2eq')
    .replace(/kgCO₂eq/gi, 'kgCO2eq');
}

/**
 * Fix words with letter spacing (e.g., "E m i s s o e s" -> "Emissoes")
 */
function fixLetterSpacing(text: string): string {
  const spacedWordPattern = /\b([A-Za-zÀ-ÿ])\s([A-Za-zÀ-ÿ])\s([A-Za-zÀ-ÿ])(\s[A-Za-zÀ-ÿ])+\b/g;
  
  return text.replace(spacedWordPattern, (match) => {
    const letters = match.split(/\s+/);
    if (letters.every(l => l.length === 1)) {
      return letters.join('');
    }
    return match;
  });
}

/**
 * Remove special symbols that corrupt PDFs
 */
function removeProblematicSymbols(text: string): string {
  return text
    // Remove arrows and special symbols
    .replace(/[→⇒⇐⇔←↑↓]/g, '->')
    .replace(/[±‰†‡°˚·]/g, '')
    // Convert special quotes
    .replace(/[""]/g, '"')
    .replace(/['']/g, "'")
    .replace(/[–—]/g, '-')
    .replace(/…/g, '...')
    // Remove warning symbols
    .replace(/⚠️?/g, 'ATENCAO: ')
    .replace(/[📌📍🔔💡⚡]/g, '');
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
    
    // Skip empty rows
    if (row.every(cell => !cell.trim())) continue;
    
    // Format as "Parametro: Valor" for 2-column tables
    if (row.length === 2) {
      const label = row[0].replace(/[:\s]+$/, '');
      const value = row[1] || '-';
      result += `  - ${label}: ${value}\n`;
    } 
    // Format as bullet list for single column or header rows
    else if (row.length === 1 || (i === 0 && isHeaderRow)) {
      result += `  - ${row.join(' | ')}\n`;
    }
    // Format multi-column as aligned bullets
    else {
      result += `  - ${row.join(' | ')}\n`;
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
      
      // Format as aligned parameters
      if (cells.length === 2) {
        result += `  - ${cells[0]}: ${cells[1]}\n`;
      } else if (cells.length >= 1) {
        result += `  - ${cells.join(' | ')}\n`;
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
  
  // Convert tables to aligned lists (NOT markdown)
  text = text.replace(/<table[^>]*>[\s\S]*?<\/table>/gi, (match) => {
    return convertHtmlTableToAlignedList(match);
  });
  
  // Convert headings to simple format
  text = text.replace(/<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/gi, (_, content) => {
    const cleanContent = content.replace(/<[^>]+>/g, '').trim().toUpperCase();
    // Remove accents for PDF safety
    const normalized = cleanContent
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
    return `\n\n${normalized}:\n`;
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
  
  // Clean whitespace
  text = text.replace(/\n{3,}/g, '\n\n');
  text = text.replace(/  +/g, ' ');
  text = text.replace(/^\s+/gm, '');
  
  return text.trim();
}

/**
 * Split long paragraphs into shorter ones (max 3 lines ~150 chars)
 */
function splitLongParagraphs(text: string): string {
  const MAX_PARA_LENGTH = 200;
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
 * Master cleaning function for display
 */
export function cleanTextForDisplay(text: string): string {
  if (!text) return '';
  
  let cleaned = text;
  
  // Step 1: Remove ALL hidden unicode characters
  cleaned = removeHiddenCharacters(cleaned);
  
  // Step 2: Convert HTML if present
  if (isHtmlContent(cleaned)) {
    cleaned = convertHtmlToText(cleaned);
  }
  
  // Step 3: Fix letter spacing issues
  cleaned = fixLetterSpacing(cleaned);
  
  // Step 4: Fix spaced numbers
  cleaned = fixSpacedNumbers(cleaned);
  
  // Step 5: Remove markdown formatting
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
  
  // Step 6: Remove emojis
  cleaned = cleaned.replace(/[\u{1F300}-\u{1F9FF}]/gu, '');
  cleaned = cleaned.replace(/[\u{2600}-\u{26FF}]/gu, '');
  cleaned = cleaned.replace(/[\u{2700}-\u{27BF}]/gu, '');
  cleaned = cleaned.replace(/[\u{1F600}-\u{1F64F}]/gu, '');
  cleaned = cleaned.replace(/[\u{1F680}-\u{1F6FF}]/gu, '');
  cleaned = cleaned.replace(/[\u{1F1E0}-\u{1F1FF}]/gu, '');
  cleaned = cleaned.replace(/[⚠️🛑📌✔️❌✅⭐🔹🔸🟩🟨🟧🟦🟪⚡💡📍🔔🔴🟢🔵⬛⬜🟤🟠🔶🔷]/g, '');
  
  // Step 7: Remove code blocks
  cleaned = cleaned.replace(/`([^`]+)`/g, '$1');
  cleaned = cleaned.replace(/```[\s\S]*?```/g, '');
  
  // Step 8: Final cleanup
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
  
  // Step 1: Remove ALL hidden unicode characters
  cleaned = removeHiddenCharacters(cleaned);
  
  // Step 2: Convert HTML if present
  if (isHtmlContent(cleaned)) {
    cleaned = convertHtmlToText(cleaned);
  }
  
  // Step 3: Convert markdown tables to aligned lists
  cleaned = convertMarkdownTableToList(cleaned);
  
  // Step 4: Apply standard display cleaning
  cleaned = cleanTextForDisplay(cleaned);
  
  // Step 5: Convert chemical formulas to ASCII (NO subscripts)
  cleaned = convertChemicalToASCII(cleaned);
  
  // Step 6: Remove problematic symbols
  cleaned = removeProblematicSymbols(cleaned);
  
  // Step 7: Split long paragraphs
  cleaned = splitLongParagraphs(cleaned);
  
  // Step 8: Fix spacing after punctuation
  cleaned = cleaned.replace(/([.!?])([A-Z])/g, '$1 $2');
  
  // Step 9: Final aggressive cleanup
  cleaned = cleaned.replace(/\*+/g, '');
  cleaned = cleaned.replace(/#+/g, '');
  cleaned = cleaned.replace(/%{2,}/g, '');
  cleaned = cleaned.replace(/={3,}/g, '');
  cleaned = cleaned.replace(/-{4,}/g, '');
  cleaned = cleaned.replace(/  +/g, ' ');
  
  // Step 10: One final pass for hidden characters
  cleaned = removeHiddenCharacters(cleaned);
  
  return cleaned;
}

/**
 * Parse content into structured sections for reports
 */
export function parseReportSections(content: string): { title: string; body: string }[] {
  const sections: { title: string; body: string }[] = [];
  const lines = content.split('\n');
  
  let currentSection: { title: string; body: string } = { title: '', body: '' };
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    // Detect section titles (numbered or all caps)
    const numberedTitleMatch = trimmedLine.match(/^(\d+)\.\s*([A-Za-zÀ-ÿ\s]+)(?::|$)/);
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
      if (currentSection.title || currentSection.body.trim()) {
        sections.push({ ...currentSection });
      }
      let cleanTitle = trimmedLine.replace(/:$/, '');
      cleanTitle = cleanTitle.replace(/^\d+\.\s*/, '');
      cleanTitle = cleanTitle.replace(/^SECAO\s*\d+\s*[-—]\s*/i, '');
      currentSection = { title: cleanTitle.trim().toUpperCase(), body: '' };
    } else {
      currentSection.body += line + '\n';
    }
  }
  
  if (currentSection.title || currentSection.body.trim()) {
    sections.push(currentSection);
  }
  
  return sections;
}

/**
 * Format references for display (ASCII safe)
 */
export function formatReferences(references: string[]): string[] {
  return references.map(ref => {
    let cleaned = ref.replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1');
    cleaned = cleaned.replace(/^[-*•]\s*/, '');
    cleaned = cleaned.replace(/\*/g, '');
    cleaned = cleaned.replace(/#/g, '');
    cleaned = removeHiddenCharacters(cleaned);
    cleaned = convertChemicalToASCII(cleaned);
    cleaned = cleaned.trim();
    return cleaned;
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
