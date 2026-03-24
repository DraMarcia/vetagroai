/**
 * Report Export Module - VetAgro Sustentável AI
 * 
 * CRITICAL PDF GENERATION RULES:
 * 1. NEVER use text directly from interface - always rebuild clean
 * 2. NEVER apply letter-spacing or character-spacing
 * 3. NEVER break words automatically
 * 4. NEVER use HTML justification - use native PDF alignment
 * 5. Remove ALL hidden unicode characters (U+201A, U+200B, soft hyphen, zero-width)
 * 6. Preserve subscripts correctly: CO₂, CH₄, N₂O
 * 7. Numbers must render without internal spacing: "2499.5" not "2 4 9 9 . 5"
 * 8. Tables use clean structure, no HTML artifacts
 * 9. Page breaks before: H1 titles, References, Legal Disclaimers
 * 10. NEVER duplicate interface text in PDF
 */

import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle, PageBreak, Table, TableRow, TableCell, WidthType } from "docx";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { cleanTextForPDF, parseReportSections, extractTablesFromContent, TableData } from "./textUtils";

// ============= Types =============

export interface ReportData {
  title: string;
  content: string;
  references?: string[];
  toolName?: string;
  date?: Date;
  userInputs?: Record<string, string | number>;
  caseId?: string;
}

// ============= Constants =============

// GREEN institutional color scheme - VetAgro IA
const BRAND_COLOR = { r: 14, g: 138, b: 71 }; // Green institucional #0E8A47
const BRAND_HEX = "0E8A47";
const SUBTITLE_COLOR = { r: 74, g: 74, b: 74 }; // Gray #4A4A4A
const BODY_COLOR = { r: 31, g: 31, b: 31 }; // Black #1F1F1F
const LIGHT_GRAY = { r: 150, g: 150, b: 150 };
const WEBSITE_URL = "www.vetagroai.com.br";
const DISCLAIMER = "Este relatorio e informativo e nao substitui avaliacao clinica por medico veterinario habilitado.";
const FOOTER_TEXT = "VetAgro IA - Inteligencia aplicada a saude, producao e bem-estar animal.";
const LEGAL_DISCLAIMER = "Este documento foi gerado por inteligencia artificial para fins de apoio tecnico. A validade oficial depende da assinatura do medico veterinario responsavel, conforme legislacao profissional vigente (Lei 5.517/1968 e Resolucoes CFMV).";
const CTA_TEXT = "Deseja analise complementar? Envie novos dados ou imagens pelo app.";

// ============= PDF Export =============

export async function exportToPDF(data: ReportData): Promise<void> {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const maxWidth = pageWidth - 2 * margin;
  const lineHeight = 5;
  
  let yPosition = margin;
  let currentPage = 1;
  
  const caseId = data.caseId || `VET-${Date.now().toString(36).toUpperCase()}`;
  const dateStr = (data.date || new Date()).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });
  
  // ===== HELPERS =====
  
  const checkPageBreak = (requiredSpace: number = 15): boolean => {
    if (yPosition + requiredSpace > pageHeight - 30) {
      doc.addPage();
      currentPage++;
      addCompactHeader();
      yPosition = 22;
      return true;
    }
    return false;
  };

  // Compact header for every page
  const addCompactHeader = () => {
    // Thin green line at top
    doc.setFillColor(BRAND_COLOR.r, BRAND_COLOR.g, BRAND_COLOR.b);
    doc.rect(0, 0, pageWidth, 3, "F");
    
    // Brand name left, date + case ID right
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(BRAND_COLOR.r, BRAND_COLOR.g, BRAND_COLOR.b);
    doc.text("VetAgro IA", margin, 10);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(LIGHT_GRAY.r, LIGHT_GRAY.g, LIGHT_GRAY.b);
    doc.text(`${dateStr}  |  ${caseId}`, pageWidth - margin, 10, { align: "right" });
    
    // Separator line
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.3);
    doc.line(margin, 14, pageWidth - margin, 14);
    
    doc.setTextColor(BODY_COLOR.r, BODY_COLOR.g, BODY_COLOR.b);
  };

  // ===== PAGE 1 — HEADER + CONTENT START =====
  addCompactHeader();
  yPosition = 22;
  
  // Report title - large and bold
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(BODY_COLOR.r, BODY_COLOR.g, BODY_COLOR.b);
  const titleLines = doc.splitTextToSize(data.title, maxWidth);
  for (const line of titleLines) {
    doc.text(line, margin, yPosition);
    yPosition += 8;
  }
  
  // Tool name subtitle
  if (data.toolName) {
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(SUBTITLE_COLOR.r, SUBTITLE_COLOR.g, SUBTITLE_COLOR.b);
    doc.text(data.toolName, margin, yPosition);
    yPosition += 6;
  }
  
  // Thin separator after title
  doc.setDrawColor(BRAND_COLOR.r, BRAND_COLOR.g, BRAND_COLOR.b);
  doc.setLineWidth(0.8);
  doc.line(margin, yPosition, margin + 40, yPosition);
  yPosition += 10;
  
  // User inputs block (compact)
  if (data.userInputs && Object.keys(data.userInputs).length > 0) {
    doc.setFillColor(248, 250, 248);
    const inputHeight = 8 + Object.keys(data.userInputs).length * 5;
    doc.roundedRect(margin, yPosition - 2, maxWidth, inputHeight, 2, 2, "F");
    
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(BRAND_COLOR.r, BRAND_COLOR.g, BRAND_COLOR.b);
    doc.text("DADOS DO CASO", margin + 4, yPosition + 4);
    yPosition += 8;
    
    doc.setFont("helvetica", "normal");
    doc.setTextColor(BODY_COLOR.r, BODY_COLOR.g, BODY_COLOR.b);
    doc.setFontSize(8);
    
    for (const [key, value] of Object.entries(data.userInputs)) {
      doc.setFont("helvetica", "bold");
      doc.text(`${key}: `, margin + 4, yPosition);
      const keyWidth = doc.getTextWidth(`${key}: `);
      doc.setFont("helvetica", "normal");
      doc.text(String(value), margin + 4 + keyWidth, yPosition);
      yPosition += 5;
    }
    yPosition += 6;
  }
  
  // ===== MAIN CONTENT =====
  const { tables, contentWithPlaceholders } = extractTablesFromContent(data.content);
  let cleanedContent = cleanTextForPDF(contentWithPlaceholders);
  cleanedContent = cleanTextForPDF(cleanedContent);
  const sections = parseReportSections(cleanedContent);
  
  const processedTitles = new Set<string>();
  
  // Helper: Render table
  const renderTable = (tableData: TableData) => {
    if (checkPageBreak(40)) {
      yPosition = 22;
    }
    
    const tableBody = tableData.rows.length > 0 
      ? tableData.rows 
      : (tableData.headers.length > 0 ? [tableData.headers] : []);
    
    const tableHead = tableData.rows.length > 0 && tableData.headers.length > 0 
      ? [tableData.headers] 
      : undefined;
    
    if (tableBody.length === 0) return;
    
    autoTable(doc, {
      startY: yPosition,
      head: tableHead,
      body: tableBody,
      margin: { left: margin, right: margin },
      styles: {
        fontSize: 8,
        cellPadding: 3,
        lineColor: [200, 200, 200],
        lineWidth: 0.2,
        textColor: [BODY_COLOR.r, BODY_COLOR.g, BODY_COLOR.b],
        overflow: 'linebreak',
      },
      headStyles: {
        fillColor: [BRAND_COLOR.r, BRAND_COLOR.g, BRAND_COLOR.b],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        halign: 'center',
      },
      bodyStyles: { halign: 'left' },
      alternateRowStyles: { fillColor: [248, 250, 248] },
      didDrawPage: () => {
        currentPage = doc.getNumberOfPages();
      },
    });
    
    yPosition = (doc as any).lastAutoTable.finalY + 8;
  };
  
  // Render sections
  for (const section of sections) {
    const normalizedTitle = section.title?.replace(/[\s:]+/g, '').toUpperCase() || '';
    if (normalizedTitle && processedTitles.has(normalizedTitle)) continue;
    if (normalizedTitle) processedTitles.add(normalizedTitle);
    
    // Section title
    if (section.title) {
      if (checkPageBreak(20)) {
        yPosition = 22;
      }
      
      yPosition += 6;
      
      // Green accent bar + title
      doc.setFillColor(BRAND_COLOR.r, BRAND_COLOR.g, BRAND_COLOR.b);
      doc.rect(margin, yPosition - 4, 2.5, 8, "F");
      
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(BRAND_COLOR.r, BRAND_COLOR.g, BRAND_COLOR.b);
      
      const cleanTitle = section.title.replace(/%+/g, '').replace(/\s+/g, ' ').trim();
      doc.text(cleanTitle, margin + 5, yPosition + 2);
      doc.setTextColor(BODY_COLOR.r, BODY_COLOR.g, BODY_COLOR.b);
      yPosition += 10;
    }
    
    // Section body
    if (section.body.trim()) {
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      
      const paragraphs = section.body.split("\n").filter(p => p.trim());
      
      for (const para of paragraphs) {
        let trimmedPara = para.trim().replace(/%+/g, '').replace(/\s+/g, ' ');
        if (!trimmedPara) continue;
        
        // Table placeholder
        const tablePlaceholderMatch = trimmedPara.match(/\[\[TABLE_(\d+)\]\]/);
        if (tablePlaceholderMatch) {
          const tableIndex = parseInt(tablePlaceholderMatch[1], 10);
          if (tables[tableIndex]) renderTable(tables[tableIndex]);
          continue;
        }
        
        // Subsection title detection
        const isSubsectionTitle = trimmedPara.match(/^\d+\.\d+\.?\s+[A-ZÁÉÍÓÚÂÊÔÃÕÇ]/);
        const isSubsectionHeader = trimmedPara.match(/^[A-ZÁÉÍÓÚÂÊÔÃÕÇ][a-záéíóúâêôãõç]+\s+(Ambiental|Produtiv|de Gestão|imediatas|de médio|estruturantes)/i);
        
        if (isSubsectionTitle || isSubsectionHeader) {
          if (checkPageBreak(12)) yPosition = 22;
          yPosition += 4;
          doc.setFontSize(10);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(SUBTITLE_COLOR.r, SUBTITLE_COLOR.g, SUBTITLE_COLOR.b);
          doc.text(trimmedPara, margin + 3, yPosition);
          doc.setTextColor(BODY_COLOR.r, BODY_COLOR.g, BODY_COLOR.b);
          doc.setFont("helvetica", "normal");
          doc.setFontSize(9);
          yPosition += 7;
          continue;
        }
        
        if (checkPageBreak(8)) yPosition = 22;
        
        // Bullet points
        if (trimmedPara.startsWith("•") || trimmedPara.startsWith("-") || trimmedPara.startsWith("–")) {
          const bulletText = trimmedPara.replace(/^[•\-–]\s*/, '');
          const lines = doc.splitTextToSize(`• ${bulletText}`, maxWidth - 8);
          for (let i = 0; i < lines.length; i++) {
            if (checkPageBreak(6)) yPosition = 22;
            doc.text(lines[i], margin + (i === 0 ? 3 : 6), yPosition);
            yPosition += lineHeight;
          }
        }
        // Numbered items
        else if (trimmedPara.match(/^\d+\.\d*\.?\s/)) {
          yPosition += 3;
          doc.setFont("helvetica", "bold");
          const lines = doc.splitTextToSize(trimmedPara, maxWidth - 8);
          for (let i = 0; i < lines.length; i++) {
            if (checkPageBreak(6)) yPosition = 22;
            doc.text(lines[i], margin + (i === 0 ? 0 : 8), yPosition);
            yPosition += lineHeight;
          }
          doc.setFont("helvetica", "normal");
          yPosition += 2;
        }
        // Regular paragraph
        else {
          const lines = doc.splitTextToSize(trimmedPara, maxWidth);
          for (const line of lines) {
            if (checkPageBreak(6)) yPosition = 22;
            doc.text(line, margin, yPosition);
            yPosition += lineHeight;
          }
          yPosition += 2;
        }
      }
      yPosition += 4;
    }
  }
  
  // ===== REFERENCES SECTION =====
  if (data.references && data.references.length > 0) {
    if (checkPageBreak(40)) yPosition = 22;
    
    yPosition += 8;
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 8;
    
    // Section title
    doc.setFillColor(BRAND_COLOR.r, BRAND_COLOR.g, BRAND_COLOR.b);
    doc.rect(margin, yPosition - 4, 2.5, 8, "F");
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(BRAND_COLOR.r, BRAND_COLOR.g, BRAND_COLOR.b);
    doc.text("REFERENCIAS TECNICAS", margin + 5, yPosition + 2);
    doc.setTextColor(BODY_COLOR.r, BODY_COLOR.g, BODY_COLOR.b);
    yPosition += 10;
    
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    
    for (let i = 0; i < data.references.length; i++) {
      if (checkPageBreak(6)) yPosition = 22;
      const cleanRef = data.references[i].replace(/^[•\-–]\s*/, "").trim();
      const refText = `[${i + 1}] ${cleanRef}`;
      const lines = doc.splitTextToSize(refText, maxWidth - 5);
      for (const line of lines) {
        doc.text(line, margin + 3, yPosition);
        yPosition += 4;
      }
      yPosition += 1;
    }
  }
  
  // ===== FOOTER ON ALL PAGES =====
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    
    // Thin line
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.line(margin, pageHeight - 18, pageWidth - margin, pageHeight - 18);
    
    // Left: copyright
    doc.setFontSize(6.5);
    doc.setTextColor(LIGHT_GRAY.r, LIGHT_GRAY.g, LIGHT_GRAY.b);
    doc.text(`VetAgro IA (C) ${new Date().getFullYear()}  |  ${WEBSITE_URL}`, margin, pageHeight - 12);
    
    // Right: page number
    doc.text(`Pagina ${i} de ${totalPages}`, pageWidth - margin, pageHeight - 12, { align: "right" });
    
    // Legal disclaimer ONLY on last page, small
    if (i === totalPages) {
      doc.setFontSize(5.5);
      doc.setTextColor(170, 170, 170);
      const legalLines = doc.splitTextToSize(LEGAL_DISCLAIMER, maxWidth);
      for (let j = 0; j < legalLines.length; j++) {
        doc.text(legalLines[j], margin, pageHeight - 7 + (j * 3));
      }
    }
  }
  
  // Save
  const fileName = `${data.title.replace(/[^a-zA-Z0-9\s]/g, "").replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.pdf`;
  doc.save(fileName);
}

// ============= DOCX Export =============

export async function exportToDocx(data: ReportData): Promise<void> {
  const cleanedContent = cleanTextForPDF(data.content);
  const sections = parseReportSections(cleanedContent);
  
  const caseId = data.caseId || `VET-${Date.now().toString(36).toUpperCase()}`;
  const dateStr = (data.date || new Date()).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric"
  });
  
  const children: Paragraph[] = [];
  
  // Cover section
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: "VetAgro Sustentável AI",
          bold: true,
          size: 48,
          color: BRAND_HEX
        })
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 }
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: "Inteligência aplicada à saúde, produção e bem-estar animal",
          size: 22,
          color: "666666",
          italics: true
        })
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 }
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: data.toolName || "Relatório Técnico",
          bold: true,
          size: 28,
          color: BRAND_HEX
        })
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 }
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: data.title,
          bold: true,
          size: 36
        })
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 300 }
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Data de Emissão: ${dateStr}`,
          size: 20,
          color: "666666"
        })
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 50 }
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `ID do Caso: ${caseId}`,
          size: 20,
          color: "666666"
        })
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 }
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: "AVISO: ",
          bold: true,
          size: 18,
          color: "996600"
        }),
        new TextRun({
          text: DISCLAIMER,
          size: 18,
          color: "996600"
        })
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 600 }
    }),
    new Paragraph({
      children: [new PageBreak()]
    })
  );
  
  // User inputs
  if (data.userInputs && Object.keys(data.userInputs).length > 0) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: "IDENTIFICAÇÃO DO CASO",
            bold: true,
            size: 24,
            color: BRAND_HEX
          })
        ],
        spacing: { before: 200, after: 150 },
        border: {
          bottom: { style: BorderStyle.SINGLE, size: 6, color: BRAND_HEX }
        }
      })
    );
    
    for (const [key, value] of Object.entries(data.userInputs)) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: `${key}: `, bold: true, size: 20 }),
            new TextRun({ text: String(value), size: 20 })
          ],
          bullet: { level: 0 },
          spacing: { after: 50 }
        })
      );
    }
    
    children.push(new Paragraph({ spacing: { after: 200 } }));
  }
  
  // Content sections
  for (const section of sections) {
    if (section.title) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: section.title,
              bold: true,
              size: 24,
              color: BRAND_HEX
            })
          ],
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 300, after: 150 },
          border: {
            left: { style: BorderStyle.SINGLE, size: 12, color: BRAND_HEX, space: 10 }
          }
        })
      );
    }
    
    if (section.body.trim()) {
      const paragraphs = section.body.split("\n").filter(p => p.trim());
      
      for (const para of paragraphs) {
        const trimmedPara = para.trim();
        if (!trimmedPara) continue;
        
        const isBullet = trimmedPara.startsWith("•") || trimmedPara.startsWith("-") || trimmedPara.startsWith("–");
        const isArrow = trimmedPara.startsWith("→") || trimmedPara.startsWith("->");
        const text = isBullet ? trimmedPara.replace(/^[•\-–]\s*/, "") : 
                     isArrow ? trimmedPara.replace(/^(→|->)\s*/, "→ ") : trimmedPara;
        
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: text,
                size: 22
              })
            ],
            bullet: isBullet ? { level: 0 } : undefined,
            alignment: isBullet ? AlignmentType.LEFT : AlignmentType.JUSTIFIED,
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
            size: 24,
            color: BRAND_HEX
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
      const cleanRef = ref.replace(/^[•\-–]\s*/, "").trim();
      children.push(
        new Paragraph({
          children: [new TextRun({ text: cleanRef, size: 20 })],
          bullet: { level: 0 },
          spacing: { after: 50 }
        })
      );
    }
  }
  
  // Legal Disclaimer
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: "AVISO LEGAL: ",
          bold: true,
          size: 18,
          color: "996600"
        }),
        new TextRun({
          text: LEGAL_DISCLAIMER,
          size: 18,
          color: "996600"
        })
      ],
      spacing: { before: 300, after: 200 },
      shading: { fill: "FFF8E6" }
    })
  );

  // CTA
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: CTA_TEXT,
          bold: true,
          size: 20,
          color: BRAND_HEX
        })
      ],
      alignment: AlignmentType.CENTER,
      spacing: { before: 300, after: 200 }
    })
  );
  
  // Footer
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: FOOTER_TEXT,
          size: 18,
          color: "999999",
          italics: true
        })
      ],
      alignment: AlignmentType.CENTER,
      spacing: { before: 200 }
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `${WEBSITE_URL} | © VetAgro Sustentável AI ${new Date().getFullYear()}`,
          size: 16,
          color: "AAAAAA"
        })
      ],
      alignment: AlignmentType.CENTER,
      spacing: { before: 100 }
    })
  );
  
  const doc = new Document({
    sections: [{
      properties: {},
      children
    }]
  });
  
  const blob = await Packer.toBlob(doc);
  const fileName = `${data.title.replace(/[^a-zA-Z0-9\s]/g, "").replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.docx`;
  saveAs(blob, fileName);
}

// ============= XLSX Export =============

export async function exportToXlsx(data: ReportData): Promise<void> {
  const cleanedContent = cleanTextForPDF(data.content);
  const sections = parseReportSections(cleanedContent);
  
  const caseId = data.caseId || `VET-${Date.now().toString(36).toUpperCase()}`;
  
  const wb = XLSX.utils.book_new();
  
  // Main content sheet
  const mainData: string[][] = [];
  mainData.push(["VetAgro Sustentável AI"]);
  mainData.push(["Inteligência aplicada à saúde, produção e bem-estar animal"]);
  mainData.push([""]);
  mainData.push([data.title]);
  mainData.push([`Ferramenta: ${data.toolName || "Relatório Técnico"}`]);
  mainData.push([`Data: ${(data.date || new Date()).toLocaleDateString("pt-BR")}`]);
  mainData.push([`ID do Caso: ${caseId}`]);
  mainData.push([""]);
  mainData.push([DISCLAIMER]);
  mainData.push([""]);
  
  // User inputs
  if (data.userInputs && Object.keys(data.userInputs).length > 0) {
    mainData.push(["IDENTIFICAÇÃO DO CASO"]);
    for (const [key, value] of Object.entries(data.userInputs)) {
      mainData.push([`${key}: ${value}`]);
    }
    mainData.push([""]);
  }
  
  // Content
  for (const section of sections) {
    if (section.title) {
      mainData.push([section.title]);
    }
    
    const lines = section.body.split("\n").filter(l => l.trim());
    for (const line of lines) {
      mainData.push([line.trim()]);
    }
    mainData.push([""]);
  }
  
  // References
  if (data.references && data.references.length > 0) {
    mainData.push(["REFERÊNCIAS CONSULTADAS"]);
    for (const ref of data.references) {
      const cleanRef = ref.replace(/^[•\-–]\s*/, "").trim();
      mainData.push([`• ${cleanRef}`]);
    }
  }
  
  // CTA and Footer
  mainData.push([""]);
  mainData.push([CTA_TEXT]);
  mainData.push([""]);
  mainData.push([FOOTER_TEXT]);
  mainData.push([`${WEBSITE_URL} | © VetAgro Sustentável AI ${new Date().getFullYear()}`]);
  
  const mainWs = XLSX.utils.aoa_to_sheet(mainData);
  mainWs["!cols"] = [{ wch: 120 }];
  
  XLSX.utils.book_append_sheet(wb, mainWs, "Relatório");
  
  // User inputs as separate sheet
  if (data.userInputs && Object.keys(data.userInputs).length > 0) {
    const inputsData: string[][] = [["Campo", "Valor"]];
    for (const [key, value] of Object.entries(data.userInputs)) {
      inputsData.push([key, String(value)]);
    }
    const inputsWs = XLSX.utils.aoa_to_sheet(inputsData);
    XLSX.utils.book_append_sheet(wb, inputsWs, "Dados de Entrada");
  }
  
  const fileName = `${data.title.replace(/[^a-zA-Z0-9\s]/g, "").replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.xlsx`;
  XLSX.writeFile(wb, fileName);
}

// ============= EPUB Export =============

export async function exportToEpub(data: ReportData): Promise<void> {
  const cleanedContent = cleanTextForPDF(data.content);
  const sections = parseReportSections(cleanedContent);
  
  const caseId = data.caseId || `VET-${Date.now().toString(36).toUpperCase()}`;
  const dateStr = (data.date || new Date()).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric"
  });
  
  let htmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" lang="pt-BR">
<head>
  <meta charset="UTF-8"/>
  <title>${data.title}</title>
  <style>
    body {
      font-family: 'Open Sans', 'Roboto', Arial, sans-serif;
      line-height: 1.7;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
      color: #333;
    }
    .cover {
      text-align: center;
      padding: 40px 20px;
      border-bottom: 3px solid #226444;
      margin-bottom: 30px;
    }
    .cover h1 {
      color: #226444;
      margin: 0;
      font-size: 2em;
    }
    .cover .tagline {
      color: #666;
      font-style: italic;
      margin: 10px 0 30px 0;
    }
    .cover .tool-name {
      background: #f0f8f0;
      display: inline-block;
      padding: 10px 25px;
      border-radius: 5px;
      color: #226444;
      font-weight: bold;
      font-size: 1.1em;
    }
    .cover .title {
      font-size: 1.4em;
      margin: 25px 0;
      font-weight: bold;
    }
    .cover .meta {
      color: #888;
      font-size: 0.9em;
    }
    .disclaimer {
      background: #fff8e0;
      border: 1px solid #ffd700;
      padding: 15px;
      border-radius: 5px;
      margin: 20px 0;
      text-align: center;
      font-size: 0.9em;
      color: #996600;
    }
    .case-data {
      background-color: #f8f8f8;
      padding: 20px;
      border-radius: 5px;
      margin-bottom: 25px;
      border-left: 4px solid #226444;
    }
    .case-data h3 {
      margin-top: 0;
      color: #226444;
    }
    h2 {
      color: #226444;
      margin-top: 30px;
      border-left: 4px solid #226444;
      padding-left: 12px;
      font-size: 1.2em;
    }
    .content p {
      text-align: justify;
      margin-bottom: 12px;
    }
    .bullet {
      padding-left: 20px;
      position: relative;
      margin-bottom: 8px;
    }
    .bullet::before {
      content: "•";
      position: absolute;
      left: 5px;
      color: #226444;
    }
    .references {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 2px solid #eee;
    }
    .references h2 {
      border-left: none;
      padding-left: 0;
    }
    .references ul {
      list-style-type: disc;
      padding-left: 25px;
    }
    .legal-disclaimer {
      background: #fff8e6;
      border: 1px solid #e6a700;
      padding: 15px;
      border-radius: 5px;
      margin: 30px 0;
      font-size: 0.85em;
      color: #996600;
    }
    .cta {
      background: #e8f4fc;
      border: 1px solid #1D3557;
      padding: 15px;
      border-radius: 5px;
      text-align: center;
      margin: 20px 0;
      color: #1D3557;
      font-weight: bold;
    }
    .footer {
      margin-top: 50px;
      text-align: center;
      color: #999;
      font-size: 12px;
      border-top: 1px solid #eee;
      padding-top: 20px;
    }
  </style>
</head>
<body>
  <div class="cover">
    <h1>VetAgro Sustentável AI</h1>
    <p class="tagline">Inteligência aplicada à saúde, produção e bem-estar animal</p>
    <div class="tool-name">${data.toolName || "Relatório Técnico"}</div>
    <p class="title">${data.title}</p>
    <p class="meta">Data de Emissão: ${dateStr}</p>
    <p class="meta">ID do Caso: ${caseId}</p>
  </div>
  
  <div class="disclaimer">
    <strong>AVISO:</strong> ${DISCLAIMER}
  </div>`;

  // User inputs
  if (data.userInputs && Object.keys(data.userInputs).length > 0) {
    htmlContent += `
  <div class="case-data">
    <h3>Identificação do Caso</h3>
    <ul>`;
    for (const [key, value] of Object.entries(data.userInputs)) {
      htmlContent += `
      <li><strong>${key}:</strong> ${value}</li>`;
    }
    htmlContent += `
    </ul>
  </div>`;
  }

  htmlContent += `
  <div class="content">`;
  
  for (const section of sections) {
    if (section.title) {
      htmlContent += `
    <h2>${section.title}</h2>`;
    }
    
    const paragraphs = section.body.split("\n").filter(p => p.trim());
    for (const para of paragraphs) {
      const trimmedPara = para.trim();
      if (!trimmedPara) continue;
      
      if (trimmedPara.startsWith("•") || trimmedPara.startsWith("-") || trimmedPara.startsWith("–")) {
        htmlContent += `
    <p class="bullet">${trimmedPara.replace(/^[•\-–]\s*/, "")}</p>`;
      } else {
        htmlContent += `
    <p>${trimmedPara}</p>`;
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
      const cleanRef = ref.replace(/^[•\-–]\s*/, "").trim();
      htmlContent += `
      <li>${cleanRef}</li>`;
    }
    htmlContent += `
    </ul>
  </div>`;
  } else {
    htmlContent += `
  </div>`;
  }
  
  htmlContent += `
  <div class="legal-disclaimer">
    <strong>⚠ AVISO LEGAL:</strong> ${LEGAL_DISCLAIMER}
  </div>
  <div class="cta">
    ${CTA_TEXT}
  </div>
  <div class="footer">
    <p>${FOOTER_TEXT}</p>
    <p>${WEBSITE_URL} | © VetAgro Sustentável AI ${new Date().getFullYear()}</p>
  </div>
</body>
</html>`;
  
  const blob = new Blob([htmlContent], { type: "application/xhtml+xml" });
  const fileName = `${data.title.replace(/[^a-zA-Z0-9\s]/g, "").replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.html`;
  saveAs(blob, fileName);
}

// ============= Default References =============

export const defaultReferences = [
  "Merck Veterinary Manual — Manual de Referência Veterinária",
  "FAO — Food and Agriculture Organization of the United Nations",
  "IPCC — Intergovernmental Panel on Climate Change",
  "OIE — World Organisation for Animal Health",
  "EMBRAPA — Empresa Brasileira de Pesquisa Agropecuária",
  "MAPA — Ministério da Agricultura, Pecuária e Abastecimento",
  "PubMed — National Library of Medicine"
];
