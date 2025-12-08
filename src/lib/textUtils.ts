/**
 * Text utilities for cleaning and formatting AI responses
 */

/**
 * Clean text for display in the UI
 * Removes markdown symbols, emojis, and normalizes formatting
 */
export function cleanTextForDisplay(text: string): string {
  let cleaned = text;
  
  // Remove markdown headers (# ## ###) but keep text
  cleaned = cleaned.replace(/^#{1,6}\s+/gm, "");
  
  // Remove asterisks for bold/italic
  cleaned = cleaned.replace(/\*\*\*([^*]+)\*\*\*/g, "$1");
  cleaned = cleaned.replace(/\*\*([^*]+)\*\*/g, "$1");
  cleaned = cleaned.replace(/\*([^*]+)\*/g, "$1");
  cleaned = cleaned.replace(/__([^_]+)__/g, "$1");
  cleaned = cleaned.replace(/_([^_]+)_/g, "$1");
  
  // Convert markdown lists to proper bullet points
  cleaned = cleaned.replace(/^[-*]\s+/gm, "• ");
  
  // Keep numbered lists but clean formatting
  cleaned = cleaned.replace(/^(\d+)\.\s+/gm, "$1. ");
  
  // Remove common emojis
  cleaned = cleaned.replace(/[\u{1F300}-\u{1F9FF}]/gu, "");
  cleaned = cleaned.replace(/[\u{2600}-\u{26FF}]/gu, "");
  cleaned = cleaned.replace(/[\u{2700}-\u{27BF}]/gu, "");
  cleaned = cleaned.replace(/[\u{1F600}-\u{1F64F}]/gu, "");
  cleaned = cleaned.replace(/[\u{1F680}-\u{1F6FF}]/gu, "");
  cleaned = cleaned.replace(/[\u{1F1E0}-\u{1F1FF}]/gu, "");
  
  // Remove backticks
  cleaned = cleaned.replace(/`([^`]+)`/g, "$1");
  cleaned = cleaned.replace(/```[\s\S]*?```/g, "");
  
  // Remove warning emoji symbols like ⚠️
  cleaned = cleaned.replace(/[⚠️🛑📌✔️❌✅⭐🔹🔸🟩🟨🟧🟦🟪]/g, "");
  
  // Normalize whitespace
  cleaned = cleaned.replace(/\n{3,}/g, "\n\n");
  cleaned = cleaned.trim();
  
  return cleaned;
}

/**
 * Clean text specifically for PDF export
 * More aggressive cleaning for professional documents
 */
export function cleanTextForPDF(text: string): string {
  let cleaned = cleanTextForDisplay(text);
  
  // Convert remaining special characters to standard equivalents
  cleaned = cleaned.replace(/[\""]/g, '"');
  cleaned = cleaned.replace(/['']/g, "'");
  cleaned = cleaned.replace(/[–—]/g, "-");
  cleaned = cleaned.replace(/…/g, "...");
  
  // Ensure proper spacing after punctuation
  cleaned = cleaned.replace(/([.!?])([A-Z])/g, "$1 $2");
  
  // Clean up excessive spacing
  cleaned = cleaned.replace(/  +/g, " ");
  
  return cleaned;
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
    
    // Detect section titles (lines in CAPS ending with : or fully uppercase)
    const isSectionTitle = 
      (trimmedLine.length > 2 && 
       trimmedLine.length < 80 && 
       (trimmedLine.endsWith(":") || trimmedLine === trimmedLine.toUpperCase()) &&
       /[A-Z]/.test(trimmedLine) &&
       !trimmedLine.startsWith("•") &&
       !trimmedLine.startsWith("-") &&
       !trimmedLine.match(/^\d+\./));
    
    if (isSectionTitle) {
      if (currentSection.title || currentSection.body.trim()) {
        sections.push({ ...currentSection });
      }
      currentSection = { title: trimmedLine.replace(/:$/, ""), body: "" };
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
    cleaned = cleaned.trim();
    return cleaned;
  });
}
