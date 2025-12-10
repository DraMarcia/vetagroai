/**
 * Text utilities for cleaning and formatting AI responses
 * VetAgro Sustentável AI - Professional formatting standards
 */

/**
 * Check if content contains HTML
 */
function isHtmlContent(text: string): boolean {
  return /<(div|table|h[1-6]|p|tr|td|th|strong|br|span)[^>]*>/i.test(text);
}

/**
 * Convert HTML table to clean text format
 */
function convertHtmlTableToText(tableHtml: string): string {
  const rows: string[][] = [];
  
  // Extract rows
  const rowMatches = tableHtml.match(/<tr[^>]*>[\s\S]*?<\/tr>/gi) || [];
  
  for (const rowHtml of rowMatches) {
    const cells: string[] = [];
    const cellMatches = rowHtml.match(/<(td|th)[^>]*>([\s\S]*?)<\/(td|th)>/gi) || [];
    
    for (const cellHtml of cellMatches) {
      // Extract cell content, remove tags
      let cellText = cellHtml
        .replace(/<(td|th)[^>]*>/gi, "")
        .replace(/<\/(td|th)>/gi, "")
        .replace(/<[^>]+>/g, "")
        .replace(/&nbsp;/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .trim();
      cells.push(cellText);
    }
    
    if (cells.length > 0) {
      rows.push(cells);
    }
  }
  
  if (rows.length === 0) return "";
  
  // Format as text table
  let result = "\n";
  
  // Check if first row is header (th tags)
  const isHeaderRow = tableHtml.includes("<th");
  
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (i === 0 && isHeaderRow) {
      // Header row
      result += row.join(" | ") + "\n";
      result += "-".repeat(60) + "\n";
    } else {
      // Data row - format as key: value if 2 columns
      if (row.length === 2) {
        result += `• ${row[0]}: ${row[1]}\n`;
      } else {
        result += row.join(" | ") + "\n";
      }
    }
  }
  
  return result + "\n";
}

/**
 * Convert HTML content to clean plain text
 */
function convertHtmlToText(html: string): string {
  let text = html;
  
  // Convert tables to text format first
  text = text.replace(/<table[^>]*>[\s\S]*?<\/table>/gi, (match) => {
    return convertHtmlTableToText(match);
  });
  
  // Convert headings to section titles
  text = text.replace(/<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/gi, (_, content) => {
    const cleanContent = content.replace(/<[^>]+>/g, "").trim().toUpperCase();
    return `\n\n${cleanContent}:\n`;
  });
  
  // Convert strong/bold to plain text
  text = text.replace(/<strong[^>]*>([\s\S]*?)<\/strong>/gi, "$1");
  text = text.replace(/<b[^>]*>([\s\S]*?)<\/b>/gi, "$1");
  
  // Convert emphasis to plain text
  text = text.replace(/<em[^>]*>([\s\S]*?)<\/em>/gi, "$1");
  text = text.replace(/<i[^>]*>([\s\S]*?)<\/i>/gi, "$1");
  
  // Convert line breaks
  text = text.replace(/<br\s*\/?>/gi, "\n");
  
  // Convert paragraphs
  text = text.replace(/<\/p>/gi, "\n\n");
  text = text.replace(/<p[^>]*>/gi, "");
  
  // Convert divs to line breaks
  text = text.replace(/<\/div>/gi, "\n");
  text = text.replace(/<div[^>]*>/gi, "");
  
  // Convert list items
  text = text.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, "• $1\n");
  text = text.replace(/<\/?[ou]l[^>]*>/gi, "\n");
  
  // Remove all remaining HTML tags
  text = text.replace(/<[^>]+>/g, "");
  
  // Decode HTML entities
  text = text.replace(/&nbsp;/g, " ");
  text = text.replace(/&amp;/g, "&");
  text = text.replace(/&lt;/g, "<");
  text = text.replace(/&gt;/g, ">");
  text = text.replace(/&quot;/g, '"');
  text = text.replace(/&#39;/g, "'");
  text = text.replace(/&apos;/g, "'");
  
  // Clean up excessive whitespace
  text = text.replace(/\n{3,}/g, "\n\n");
  text = text.replace(/  +/g, " ");
  text = text.replace(/^\s+/gm, "");
  
  return text.trim();
}

/**
 * Aggressively clean text for professional display
 * Removes ALL markdown, asterisks, hashtags, emojis, and formatting symbols
 * Also handles HTML content by converting to plain text
 */
export function cleanTextForDisplay(text: string): string {
  let cleaned = text;
  
  // If content is HTML, convert to plain text first
  if (isHtmlContent(cleaned)) {
    cleaned = convertHtmlToText(cleaned);
  }
  
  // Remove markdown headers (# ## ###) but keep text
  cleaned = cleaned.replace(/^#{1,6}\s*/gm, "");
  
  // Remove ALL asterisks (bold, italic, list markers)
  cleaned = cleaned.replace(/\*\*\*([^*]+)\*\*\*/g, "$1");
  cleaned = cleaned.replace(/\*\*([^*]+)\*\*/g, "$1");
  cleaned = cleaned.replace(/\*([^*\n]+)\*/g, "$1");
  cleaned = cleaned.replace(/^\s*\*\s+/gm, "• ");
  cleaned = cleaned.replace(/\*/g, ""); // Remove any remaining asterisks
  
  // Remove underscores for formatting
  cleaned = cleaned.replace(/__([^_]+)__/g, "$1");
  cleaned = cleaned.replace(/_([^_]+)_/g, "$1");
  
  // Convert markdown lists to proper bullet points
  cleaned = cleaned.replace(/^[-]\s+/gm, "• ");
  
  // Remove hashtags completely
  cleaned = cleaned.replace(/#/g, "");
  
  // Keep numbered lists but clean formatting
  cleaned = cleaned.replace(/^(\d+)\.\s+/gm, "$1. ");
  
  // Remove common emojis and unicode symbols
  cleaned = cleaned.replace(/[\u{1F300}-\u{1F9FF}]/gu, "");
  cleaned = cleaned.replace(/[\u{2600}-\u{26FF}]/gu, "");
  cleaned = cleaned.replace(/[\u{2700}-\u{27BF}]/gu, "");
  cleaned = cleaned.replace(/[\u{1F600}-\u{1F64F}]/gu, "");
  cleaned = cleaned.replace(/[\u{1F680}-\u{1F6FF}]/gu, "");
  cleaned = cleaned.replace(/[\u{1F1E0}-\u{1F1FF}]/gu, "");
  
  // Remove backticks and code blocks
  cleaned = cleaned.replace(/`([^`]+)`/g, "$1");
  cleaned = cleaned.replace(/```[\s\S]*?```/g, "");
  
  // Remove warning and other symbol emojis
  cleaned = cleaned.replace(/[⚠️🛑📌✔️❌✅⭐🔹🔸🟩🟨🟧🟦🟪⚡💡📍🔔🔴🟢🔵⬛⬜🟤🟠🔶🔷]/g, "");
  
  // Fix letter spacing issues (e.g., "a r t r i t e" -> "artrite")
  cleaned = cleaned.replace(/(\w)\s(\w)\s(\w)\s(\w)/g, (match) => {
    const letters = match.split(/\s+/);
    if (letters.every(l => l.length === 1)) {
      return letters.join("");
    }
    return match;
  });
  
  // Fix more extensive letter spacing
  cleaned = cleaned.replace(/(?<!\w)(\w)\s(?=\w\s\w\s\w)/g, "$1");
  
  // Clean up excessive whitespace
  cleaned = cleaned.replace(/\n{3,}/g, "\n\n");
  cleaned = cleaned.replace(/  +/g, " ");
  cleaned = cleaned.trim();
  
  return cleaned;
}

/**
 * Clean text specifically for PDF export
 * More aggressive cleaning for professional documents
 * Handles both HTML and markdown content
 */
export function cleanTextForPDF(text: string): string {
  let cleaned = text;
  
  // If content is HTML, convert to plain text first
  if (isHtmlContent(cleaned)) {
    cleaned = convertHtmlToText(cleaned);
  }
  
  // Apply standard display cleaning
  cleaned = cleanTextForDisplay(cleaned);
  
  // Convert remaining special characters to standard equivalents
  cleaned = cleaned.replace(/[\""]/g, '"');
  cleaned = cleaned.replace(/['']/g, "'");
  cleaned = cleaned.replace(/[–—]/g, "-");
  cleaned = cleaned.replace(/…/g, "...");
  
  // Ensure proper spacing after punctuation
  cleaned = cleaned.replace(/([.!?])([A-Z])/g, "$1 $2");
  
  // Clean up excessive spacing
  cleaned = cleaned.replace(/  +/g, " ");
  
  // Remove any remaining markdown artifacts
  cleaned = cleaned.replace(/\*+/g, "");
  cleaned = cleaned.replace(/#+/g, "");
  
  // Fix broken words with spaces between letters
  cleaned = fixBrokenWords(cleaned);
  
  return cleaned;
}

/**
 * Fix words that have been broken with spaces between letters
 */
function fixBrokenWords(text: string): string {
  // Pattern to detect spaced-out words like "a r t r i t e"
  const spacedPattern = /\b([a-zA-ZÀ-ÿ])\s([a-zA-ZÀ-ÿ])\s([a-zA-ZÀ-ÿ])\s([a-zA-ZÀ-ÿ])(?:\s([a-zA-ZÀ-ÿ]))?(?:\s([a-zA-ZÀ-ÿ]))?(?:\s([a-zA-ZÀ-ÿ]))?\b/g;
  
  return text.replace(spacedPattern, (match, ...letters) => {
    const validLetters = letters.filter(l => l && typeof l === 'string' && l.length === 1);
    if (validLetters.length >= 4) {
      return validLetters.join("");
    }
    return match;
  });
}

/**
 * Parse content into structured sections for reports
 */
export function parseReportSections(content: string): { title: string; body: string }[] {
  const sections: { title: string; body: string }[] = [];
  const lines = content.split("\n");
  
  let currentSection: { title: string; body: string } = { title: "", body: "" };
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    // Detect section titles: numbered (1. TITLE) or CAPS with colon
    const numberedTitleMatch = trimmedLine.match(/^(\d+)\.\s*([A-ZÁÀÂÃÉÊÍÓÔÕÚÇ\s]+)(?::|$)/);
    const capsTitle = trimmedLine.match(/^([A-ZÁÀÂÃÉÊÍÓÔÕÚÇ\s]{3,50}):?$/);
    
    const isSectionTitle = 
      (numberedTitleMatch !== null) ||
      (capsTitle !== null && 
       trimmedLine.length > 2 && 
       trimmedLine.length < 80 &&
       !trimmedLine.startsWith("•") &&
       !trimmedLine.startsWith("-") &&
       !trimmedLine.startsWith("→"));
    
    if (isSectionTitle) {
      if (currentSection.title || currentSection.body.trim()) {
        sections.push({ ...currentSection });
      }
      // Clean the title
      let cleanTitle = trimmedLine.replace(/:$/, "");
      // Remove leading number if present
      cleanTitle = cleanTitle.replace(/^\d+\.\s*/, "");
      currentSection = { title: cleanTitle.trim(), body: "" };
    } else {
      currentSection.body += line + "\n";
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
    // Remove any markdown or special formatting
    let cleaned = ref.replace(/\[([^\]]+)\]\([^\)]+\)/g, "$1");
    cleaned = cleaned.replace(/^[-*•]\s*/, "");
    cleaned = cleaned.replace(/\*/g, "");
    cleaned = cleaned.replace(/#/g, "");
    cleaned = cleaned.trim();
    return cleaned;
  });
}

/**
 * Format text for professional justified display
 */
export function formatForJustifiedDisplay(text: string): string {
  let formatted = cleanTextForDisplay(text);
  
  // Ensure proper paragraph breaks
  formatted = formatted.replace(/\n{3,}/g, "\n\n");
  
  // Ensure bullet points are consistent
  formatted = formatted.replace(/^[•\-–]\s*/gm, "• ");
  
  return formatted;
}
