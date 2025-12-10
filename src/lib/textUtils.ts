/**
 * Text utilities for cleaning and formatting AI responses
 * VetAgro Sustentável AI - Professional formatting standards
 * 
 * CRITICAL PDF RULES:
 * 1. Never convert text directly from interface
 * 2. Always rebuild clean text without hidden characters
 * 3. Never apply letter-spacing
 * 4. Preserve subscripts correctly (CO₂, CH₄, N₂O)
 * 5. Remove all zero-width spaces and special unicode
 */

// Proper subscript mappings for scientific notation
const SUBSCRIPT_MAP: Record<string, string> = {
  '₀': '0', '₁': '1', '₂': '2', '₃': '3', '₄': '4',
  '₅': '5', '₆': '6', '₇': '7', '₈': '8', '₉': '9'
};

// Chemical formulas with proper subscripts
const CHEMICAL_FORMULAS: Record<string, string> = {
  'CO2': 'CO₂',
  'CH4': 'CH₄',
  'N2O': 'N₂O',
  'CO2eq': 'CO₂eq',
  'CO2e': 'CO₂e',
  'H2O': 'H₂O',
  'O2': 'O₂',
  'tCO2eq': 'tCO₂eq',
  'tCO2e': 'tCO₂e',
  'kgCO2eq': 'kgCO₂eq',
  'kgCO2e': 'kgCO₂e'
};

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
    .replace(/%{2,}/g, '');
}

/**
 * Fix numbers that got spaced incorrectly (e.g., "2 4 9 9 . 5" -> "2499.5")
 */
function fixSpacedNumbers(text: string): string {
  // Fix numbers with internal spaces
  return text
    .replace(/(\d)\s+(\d)/g, '$1$2')
    .replace(/(\d)\s*\.\s*(\d)/g, '$1.$2')
    .replace(/(\d)\s*,\s*(\d)/g, '$1,$2');
}

/**
 * Normalize chemical formulas to use proper subscripts
 */
function normalizeChemicalFormulas(text: string): string {
  let normalized = text;
  
  // First, fix corrupted subscripts (like "CO ‚ eq" -> "CO₂eq")
  normalized = normalized
    .replace(/CO\s*[‚,]\s*eq?/gi, 'CO₂eq')
    .replace(/CO\s*[‚,]\s*e\s*q?/gi, 'CO₂eq')
    .replace(/CH\s*[‚,]\s*/gi, 'CH₄')
    .replace(/N\s*[‚,]\s*O/gi, 'N₂O');
  
  // Apply standard chemical formula mappings (case-insensitive)
  for (const [plain, subscript] of Object.entries(CHEMICAL_FORMULAS)) {
    const regex = new RegExp(plain.replace(/[0-9]/g, ''), 'gi');
    // Only replace if it matches the pattern with numbers
    normalized = normalized.replace(new RegExp(`\\b${plain}\\b`, 'gi'), subscript);
  }
  
  return normalized;
}

/**
 * Fix words with letter spacing (e.g., "E m i s s õ e s" -> "Emissões")
 */
function fixLetterSpacing(text: string): string {
  // Pattern: single letters separated by single spaces
  const spacedWordPattern = /\b([A-Za-zÀ-ÿ])\s([A-Za-zÀ-ÿ])\s([A-Za-zÀ-ÿ])(\s[A-Za-zÀ-ÿ])+\b/g;
  
  return text.replace(spacedWordPattern, (match) => {
    const letters = match.split(/\s+/);
    // Only join if all parts are single characters
    if (letters.every(l => l.length === 1)) {
      return letters.join('');
    }
    return match;
  });
}

/**
 * Check if content contains HTML
 */
function isHtmlContent(text: string): boolean {
  return /<(div|table|h[1-6]|p|tr|td|th|strong|br|span)[^>]*>/i.test(text);
}

/**
 * Convert HTML table to clean text format (Markdown style)
 */
function convertHtmlTableToText(tableHtml: string): string {
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
  
  // Calculate column widths
  const colWidths: number[] = [];
  for (const row of rows) {
    for (let i = 0; i < row.length; i++) {
      colWidths[i] = Math.max(colWidths[i] || 0, Math.min(row[i].length, 35));
    }
  }
  
  let result = '\n';
  const isHeaderRow = tableHtml.includes('<th');
  const isTwoColumnTable = rows.length > 0 && rows[0].length === 2;
  
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    
    if (i === 0 && isHeaderRow && !isTwoColumnTable) {
      // Header row with separator
      result += '| ' + row.map((cell, idx) => cell.padEnd(colWidths[idx] || 15)).join(' | ') + ' |\n';
      result += '|' + row.map((_, idx) => '-'.repeat((colWidths[idx] || 15) + 2)).join('|') + '|\n';
    } else if (isTwoColumnTable) {
      // Two-column: format as "Label: Value"
      const label = row[0].replace(/[:\s]+$/, '');
      const value = row[1] || '-';
      result += `• ${label}: ${value}\n`;
    } else if (i === 0 && !isHeaderRow) {
      // First row without headers
      result += '| ' + row.map((cell, idx) => cell.substring(0, colWidths[idx] || 15).padEnd(colWidths[idx] || 15)).join(' | ') + ' |\n';
    } else {
      // Data row
      result += '| ' + row.map((cell, idx) => cell.substring(0, colWidths[idx] || 15).padEnd(colWidths[idx] || 15)).join(' | ') + ' |\n';
    }
  }
  
  return result + '\n';
}

/**
 * Convert HTML content to clean plain text
 */
function convertHtmlToText(html: string): string {
  let text = html;
  
  // Convert tables first
  text = text.replace(/<table[^>]*>[\s\S]*?<\/table>/gi, (match) => {
    return convertHtmlTableToText(match);
  });
  
  // Convert headings
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
  text = text.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, '• $1\n');
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
 * Master cleaning function for display
 * Aggressively removes ALL markdown, symbols, hidden characters
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
  
  // Step 3: Fix letter spacing issues BEFORE other processing
  cleaned = fixLetterSpacing(cleaned);
  
  // Step 4: Fix spaced numbers
  cleaned = fixSpacedNumbers(cleaned);
  
  // Step 5: Normalize chemical formulas
  cleaned = normalizeChemicalFormulas(cleaned);
  
  // Step 6: Remove markdown
  cleaned = cleaned.replace(/^#{1,6}\s*/gm, '');
  cleaned = cleaned.replace(/\*\*\*([^*]+)\*\*\*/g, '$1');
  cleaned = cleaned.replace(/\*\*([^*]+)\*\*/g, '$1');
  cleaned = cleaned.replace(/\*([^*\n]+)\*/g, '$1');
  cleaned = cleaned.replace(/^\s*\*\s+/gm, '• ');
  cleaned = cleaned.replace(/\*/g, '');
  cleaned = cleaned.replace(/__([^_]+)__/g, '$1');
  cleaned = cleaned.replace(/_([^_]+)_/g, '$1');
  cleaned = cleaned.replace(/^[-]\s+/gm, '• ');
  cleaned = cleaned.replace(/#/g, '');
  cleaned = cleaned.replace(/^(\d+)\.\s+/gm, '$1. ');
  
  // Step 7: Remove emojis
  cleaned = cleaned.replace(/[\u{1F300}-\u{1F9FF}]/gu, '');
  cleaned = cleaned.replace(/[\u{2600}-\u{26FF}]/gu, '');
  cleaned = cleaned.replace(/[\u{2700}-\u{27BF}]/gu, '');
  cleaned = cleaned.replace(/[\u{1F600}-\u{1F64F}]/gu, '');
  cleaned = cleaned.replace(/[\u{1F680}-\u{1F6FF}]/gu, '');
  cleaned = cleaned.replace(/[\u{1F1E0}-\u{1F1FF}]/gu, '');
  cleaned = cleaned.replace(/[⚠️🛑📌✔️❌✅⭐🔹🔸🟩🟨🟧🟦🟪⚡💡📍🔔🔴🟢🔵⬛⬜🟤🟠🔶🔷]/g, '');
  
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
 * More aggressive - ensures clean output for professional documents
 */
export function cleanTextForPDF(text: string): string {
  if (!text) return '';
  
  let cleaned = text;
  
  // Step 1: Remove ALL hidden unicode characters first
  cleaned = removeHiddenCharacters(cleaned);
  
  // Step 2: Convert HTML if present
  if (isHtmlContent(cleaned)) {
    cleaned = convertHtmlToText(cleaned);
  }
  
  // Step 3: Apply standard display cleaning
  cleaned = cleanTextForDisplay(cleaned);
  
  // Step 4: Additional PDF-specific cleaning
  // Normalize quotes and dashes
  cleaned = cleaned.replace(/[""]/g, '"');
  cleaned = cleaned.replace(/['']/g, "'");
  cleaned = cleaned.replace(/[–—]/g, '-');
  cleaned = cleaned.replace(/…/g, '...');
  
  // Step 5: Fix spacing after punctuation
  cleaned = cleaned.replace(/([.!?])([A-Z])/g, '$1 $2');
  
  // Step 6: Final aggressive cleanup
  cleaned = cleaned.replace(/\*+/g, '');
  cleaned = cleaned.replace(/#+/g, '');
  cleaned = cleaned.replace(/%{2,}/g, '');
  cleaned = cleaned.replace(/  +/g, ' ');
  
  // Step 7: Ensure chemical formulas are correct
  cleaned = normalizeChemicalFormulas(cleaned);
  
  // Step 8: One final pass for hidden characters
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
    
    // Detect section titles
    const numberedTitleMatch = trimmedLine.match(/^(\d+)\.\s*([A-ZÁÀÂÃÉÊÍÓÔÕÚÇ\s]+)(?::|$)/);
    const capsTitle = trimmedLine.match(/^([A-ZÁÀÂÃÉÊÍÓÔÕÚÇ\s]{3,50}):?$/);
    
    const isSectionTitle = 
      (numberedTitleMatch !== null) ||
      (capsTitle !== null && 
       trimmedLine.length > 2 && 
       trimmedLine.length < 80 &&
       !trimmedLine.startsWith('•') &&
       !trimmedLine.startsWith('-') &&
       !trimmedLine.startsWith('→'));
    
    if (isSectionTitle) {
      if (currentSection.title || currentSection.body.trim()) {
        sections.push({ ...currentSection });
      }
      let cleanTitle = trimmedLine.replace(/:$/, '');
      cleanTitle = cleanTitle.replace(/^\d+\.\s*/, '');
      currentSection = { title: cleanTitle.trim(), body: '' };
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
 * Format references for display
 */
export function formatReferences(references: string[]): string[] {
  return references.map(ref => {
    let cleaned = ref.replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1');
    cleaned = cleaned.replace(/^[-*•]\s*/, '');
    cleaned = cleaned.replace(/\*/g, '');
    cleaned = cleaned.replace(/#/g, '');
    cleaned = removeHiddenCharacters(cleaned);
    cleaned = cleaned.trim();
    return cleaned;
  });
}

/**
 * Format text for professional justified display
 */
export function formatForJustifiedDisplay(text: string): string {
  let formatted = cleanTextForDisplay(text);
  formatted = formatted.replace(/\n{3,}/g, '\n\n');
  formatted = formatted.replace(/^[•\-–]\s*/gm, '• ');
  return formatted;
}
