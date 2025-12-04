import { jsPDF } from "jspdf";
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle } from "docx";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

// ============= Text Processing & Cleaning =============

export interface ReportData {
  title: string;
  content: string;
  references?: string[];
  toolName?: string;
  date?: Date;
  userInputs?: Record<string, string | number>;
}

/**
 * Clean and normalize text content
 * - Remove hashtags, asterisks, emojis
 * - Convert markdown lists to bullet points
 * - Preserve structure
 */
export function cleanText(text: string): string {
  let cleaned = text;
  
  // Remove markdown headers (# ## ###) but keep text
  cleaned = cleaned.replace(/^#{1,6}\s+/gm, "");
  
  // Remove asterisks for bold/italic
  cleaned = cleaned.replace(/\*\*([^*]+)\*\*/g, "$1");
  cleaned = cleaned.replace(/\*([^*]+)\*/g, "$1");
  cleaned = cleaned.replace(/__([^_]+)__/g, "$1");
  cleaned = cleaned.replace(/_([^_]+)_/g, "$1");
  
  // Convert markdown lists to bullet points
  cleaned = cleaned.replace(/^[-*]\s+/gm, "• ");
  cleaned = cleaned.replace(/^\d+\.\s+/gm, "• ");
  
  // Remove common emojis (basic set)
  cleaned = cleaned.replace(/[\u{1F300}-\u{1F9FF}]/gu, "");
  cleaned = cleaned.replace(/[\u{2600}-\u{26FF}]/gu, "");
  cleaned = cleaned.replace(/[\u{2700}-\u{27BF}]/gu, "");
  
  // Remove backticks
  cleaned = cleaned.replace(/`([^`]+)`/g, "$1");
  cleaned = cleaned.replace(/```[\s\S]*?```/g, "");
  
  // Normalize whitespace
  cleaned = cleaned.replace(/\n{3,}/g, "\n\n");
  cleaned = cleaned.trim();
  
  return cleaned;
}

/**
 * Parse content into structured sections
 */
export function parseContentSections(content: string): { title: string; body: string }[] {
  const sections: { title: string; body: string }[] = [];
  const lines = content.split("\n");
  
  let currentSection: { title: string; body: string } = { title: "", body: "" };
  
  for (const line of lines) {
    // Detect section titles (lines in CAPS or ending with :)
    const isSectionTitle = 
      (line.trim().length > 0 && line.trim().length < 80 && line.trim() === line.trim().toUpperCase() && /[A-Z]/.test(line)) ||
      (line.trim().endsWith(":") && line.trim().length < 60 && !line.trim().startsWith("•"));
    
    if (isSectionTitle && line.trim().length > 2) {
      if (currentSection.title || currentSection.body) {
        sections.push({ ...currentSection });
      }
      currentSection = { title: line.trim().replace(/:$/, ""), body: "" };
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
 * Extract tables from content
 */
export function extractTables(content: string): { headers: string[]; rows: string[][] }[] {
  const tables: { headers: string[]; rows: string[][] }[] = [];
  const lines = content.split("\n");
  
  let inTable = false;
  let currentTable: { headers: string[]; rows: string[][] } = { headers: [], rows: [] };
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Detect markdown table
    if (line.startsWith("|") && line.endsWith("|")) {
      const cells = line.split("|").filter(c => c.trim()).map(c => c.trim());
      
      if (!inTable) {
        inTable = true;
        currentTable = { headers: cells, rows: [] };
      } else if (line.includes("---")) {
        // Separator line, skip
        continue;
      } else {
        currentTable.rows.push(cells);
      }
    } else if (inTable && line === "") {
      if (currentTable.headers.length > 0) {
        tables.push({ ...currentTable });
      }
      inTable = false;
      currentTable = { headers: [], rows: [] };
    }
  }
  
  if (inTable && currentTable.headers.length > 0) {
    tables.push(currentTable);
  }
  
  return tables;
}

// ============= PDF Export =============

export async function exportToPDF(data: ReportData): Promise<void> {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const maxWidth = pageWidth - 2 * margin;
  const lineHeight = 6;
  
  let yPosition = margin;
  
  const addNewPageIfNeeded = (requiredSpace: number = 20) => {
    if (yPosition + requiredSpace > pageHeight - margin) {
      doc.addPage();
      yPosition = margin;
      return true;
    }
    return false;
  };
  
  const addText = (text: string, fontSize: number, isBold: boolean = false, align: "left" | "center" = "left") => {
    doc.setFontSize(fontSize);
    doc.setFont("helvetica", isBold ? "bold" : "normal");
    
    const lines = doc.splitTextToSize(text, maxWidth);
    
    for (const line of lines) {
      addNewPageIfNeeded(lineHeight);
      
      if (align === "center") {
        doc.text(line, pageWidth / 2, yPosition, { align: "center" });
      } else {
        doc.text(line, margin, yPosition);
      }
      yPosition += lineHeight;
    }
  };
  
  // Header with logo placeholder
  doc.setFillColor(34, 139, 34);
  doc.rect(0, 0, pageWidth, 15, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.text("VetAgro IA", pageWidth / 2, 10, { align: "center" });
  doc.setTextColor(0, 0, 0);
  yPosition = 25;
  
  // Title
  addText(data.title, 18, true, "center");
  yPosition += 5;
  
  // Date
  const dateStr = (data.date || new Date()).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric"
  });
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Gerado em: ${dateStr}`, pageWidth / 2, yPosition, { align: "center" });
  doc.setTextColor(0, 0, 0);
  yPosition += 10;
  
  // Tool name if provided
  if (data.toolName) {
    doc.setFontSize(10);
    doc.setTextColor(80, 80, 80);
    doc.text(`Ferramenta: ${data.toolName}`, margin, yPosition);
    doc.setTextColor(0, 0, 0);
    yPosition += 8;
  }
  
  // Separator line
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 10;
  
  // Clean and process content
  const cleanedContent = cleanText(data.content);
  const sections = parseContentSections(cleanedContent);
  
  // Content
  for (const section of sections) {
    if (section.title) {
      addNewPageIfNeeded(20);
      yPosition += 3;
      addText(section.title, 12, true);
      yPosition += 2;
    }
    
    if (section.body.trim()) {
      const paragraphs = section.body.split("\n\n").filter(p => p.trim());
      
      for (const para of paragraphs) {
        const lines = para.split("\n").filter(l => l.trim());
        
        for (const line of lines) {
          addNewPageIfNeeded();
          addText(line.trim(), 10);
        }
        yPosition += 3;
      }
    }
  }
  
  // References section
  if (data.references && data.references.length > 0) {
    addNewPageIfNeeded(40);
    yPosition += 10;
    
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 8;
    
    addText("REFERÊNCIAS CONSULTADAS", 12, true);
    yPosition += 3;
    
    for (const ref of data.references) {
      addNewPageIfNeeded();
      addText(`• ${ref}`, 9);
    }
  }
  
  // Footer with page numbers
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Página ${i} de ${totalPages} | VetAgro IA - Relatório gerado automaticamente`,
      pageWidth / 2,
      pageHeight - 10,
      { align: "center" }
    );
  }
  
  // Save
  const fileName = `${data.title.replace(/[^a-zA-Z0-9]/g, "_")}_${new Date().toISOString().split("T")[0]}.pdf`;
  doc.save(fileName);
}

// ============= DOCX Export =============

export async function exportToDocx(data: ReportData): Promise<void> {
  const cleanedContent = cleanText(data.content);
  const sections = parseContentSections(cleanedContent);
  
  const children: Paragraph[] = [];
  
  // Title
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: data.title,
          bold: true,
          size: 36,
          color: "228B22"
        })
      ],
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 }
    })
  );
  
  // Date and tool name
  const dateStr = (data.date || new Date()).toLocaleDateString("pt-BR");
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: `Gerado em: ${dateStr}`,
          size: 20,
          color: "666666",
          italics: true
        }),
        ...(data.toolName ? [
          new TextRun({ text: " | ", size: 20, color: "666666" }),
          new TextRun({ text: `Ferramenta: ${data.toolName}`, size: 20, color: "666666", italics: true })
        ] : [])
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 }
    })
  );
  
  // Content sections
  for (const section of sections) {
    if (section.title) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: section.title,
              bold: true,
              size: 26
            })
          ],
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 300, after: 100 }
        })
      );
    }
    
    if (section.body.trim()) {
      const paragraphs = section.body.split("\n").filter(p => p.trim());
      
      for (const para of paragraphs) {
        const isBullet = para.trim().startsWith("•");
        
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: isBullet ? para.trim().substring(1).trim() : para.trim(),
                size: 22
              })
            ],
            bullet: isBullet ? { level: 0 } : undefined,
            spacing: { after: 100 }
          })
        );
      }
    }
  }
  
  // References
  if (data.references && data.references.length > 0) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: "REFERÊNCIAS CONSULTADAS",
            bold: true,
            size: 26
          })
        ],
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 200 },
        border: {
          top: { style: BorderStyle.SINGLE, size: 6, color: "CCCCCC" }
        }
      })
    );
    
    for (const ref of data.references) {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: ref, size: 20 })],
          bullet: { level: 0 },
          spacing: { after: 50 }
        })
      );
    }
  }
  
  const doc = new Document({
    sections: [{
      properties: {},
      children
    }]
  });
  
  const blob = await Packer.toBlob(doc);
  const fileName = `${data.title.replace(/[^a-zA-Z0-9]/g, "_")}_${new Date().toISOString().split("T")[0]}.docx`;
  saveAs(blob, fileName);
}

// ============= XLSX Export =============

export async function exportToXlsx(data: ReportData): Promise<void> {
  const cleanedContent = cleanText(data.content);
  const sections = parseContentSections(cleanedContent);
  const tables = extractTables(data.content);
  
  const wb = XLSX.utils.book_new();
  
  // Main content sheet
  const mainData: string[][] = [];
  mainData.push([data.title]);
  mainData.push([`Gerado em: ${(data.date || new Date()).toLocaleDateString("pt-BR")}`]);
  if (data.toolName) {
    mainData.push([`Ferramenta: ${data.toolName}`]);
  }
  mainData.push([]);
  
  for (const section of sections) {
    if (section.title) {
      mainData.push([section.title.toUpperCase()]);
    }
    
    const lines = section.body.split("\n").filter(l => l.trim());
    for (const line of lines) {
      mainData.push([line.trim()]);
    }
    mainData.push([]);
  }
  
  // References
  if (data.references && data.references.length > 0) {
    mainData.push(["REFERÊNCIAS CONSULTADAS"]);
    for (const ref of data.references) {
      mainData.push([`• ${ref}`]);
    }
  }
  
  const mainWs = XLSX.utils.aoa_to_sheet(mainData);
  
  // Set column width
  mainWs["!cols"] = [{ wch: 100 }];
  
  XLSX.utils.book_append_sheet(wb, mainWs, "Relatório");
  
  // Add tables as separate sheets if found
  tables.forEach((table, index) => {
    const tableData: string[][] = [table.headers, ...table.rows];
    const tableWs = XLSX.utils.aoa_to_sheet(tableData);
    XLSX.utils.book_append_sheet(wb, tableWs, `Tabela ${index + 1}`);
  });
  
  // User inputs sheet if provided
  if (data.userInputs && Object.keys(data.userInputs).length > 0) {
    const inputsData: string[][] = [["Campo", "Valor"]];
    for (const [key, value] of Object.entries(data.userInputs)) {
      inputsData.push([key, String(value)]);
    }
    const inputsWs = XLSX.utils.aoa_to_sheet(inputsData);
    XLSX.utils.book_append_sheet(wb, inputsWs, "Dados de Entrada");
  }
  
  const fileName = `${data.title.replace(/[^a-zA-Z0-9]/g, "_")}_${new Date().toISOString().split("T")[0]}.xlsx`;
  XLSX.writeFile(wb, fileName);
}

// ============= EPUB Export =============

export async function exportToEpub(data: ReportData): Promise<void> {
  const cleanedContent = cleanText(data.content);
  const sections = parseContentSections(cleanedContent);
  
  // Create HTML content for EPUB (simplified as HTML file for download)
  const dateStr = (data.date || new Date()).toLocaleDateString("pt-BR");
  
  let htmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" lang="pt-BR">
<head>
  <meta charset="UTF-8"/>
  <title>${data.title}</title>
  <style>
    body {
      font-family: Georgia, 'Times New Roman', serif;
      line-height: 1.6;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
      color: #333;
    }
    h1 {
      color: #228B22;
      text-align: center;
      border-bottom: 2px solid #228B22;
      padding-bottom: 10px;
    }
    h2 {
      color: #2F4F4F;
      margin-top: 30px;
      border-left: 4px solid #228B22;
      padding-left: 10px;
    }
    .meta {
      text-align: center;
      color: #666;
      font-style: italic;
      margin-bottom: 30px;
    }
    .content p {
      text-align: justify;
      margin-bottom: 12px;
    }
    .bullet {
      padding-left: 20px;
    }
    .references {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #ccc;
    }
    .references h2 {
      border-left: none;
      padding-left: 0;
    }
    .references ul {
      list-style-type: disc;
      padding-left: 25px;
    }
    .footer {
      margin-top: 50px;
      text-align: center;
      color: #999;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <h1>${data.title}</h1>
  <div class="meta">
    <p>Gerado em: ${dateStr}</p>
    ${data.toolName ? `<p>Ferramenta: ${data.toolName}</p>` : ""}
  </div>
  <div class="content">`;
  
  for (const section of sections) {
    if (section.title) {
      htmlContent += `
    <h2>${section.title}</h2>`;
    }
    
    const paragraphs = section.body.split("\n").filter(p => p.trim());
    for (const para of paragraphs) {
      if (para.trim().startsWith("•")) {
        htmlContent += `
    <p class="bullet">${para.trim()}</p>`;
      } else {
        htmlContent += `
    <p>${para.trim()}</p>`;
      }
    }
  }
  
  if (data.references && data.references.length > 0) {
    htmlContent += `
  </div>
  <div class="references">
    <h2>Referências Consultadas</h2>
    <ul>`;
    for (const ref of data.references) {
      htmlContent += `
      <li>${ref}</li>`;
    }
    htmlContent += `
    </ul>
  </div>`;
  } else {
    htmlContent += `
  </div>`;
  }
  
  htmlContent += `
  <div class="footer">
    <p>VetAgro IA - Relatório gerado automaticamente</p>
  </div>
</body>
</html>`;
  
  // For EPUB, we'll create an HTML file that can be opened in e-readers
  const blob = new Blob([htmlContent], { type: "application/xhtml+xml" });
  const fileName = `${data.title.replace(/[^a-zA-Z0-9]/g, "_")}_${new Date().toISOString().split("T")[0]}.html`;
  saveAs(blob, fileName);
}

// ============= Default References =============

export const defaultReferences = [
  "FAO - Food and Agriculture Organization of the United Nations",
  "IPCC - Intergovernmental Panel on Climate Change",
  "OIE - World Organisation for Animal Health",
  "EMBRAPA - Empresa Brasileira de Pesquisa Agropecuária",
  "MAPA - Ministério da Agricultura, Pecuária e Abastecimento",
  "Merck Veterinary Manual",
  "PubMed - National Library of Medicine"
];
