import { jsPDF } from "jspdf";
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle, PageBreak } from "docx";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { cleanTextForPDF, parseReportSections } from "./textUtils";

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

// GREEN institutional color scheme - VetAgro Sustentável AI
const BRAND_COLOR = { r: 27, g: 127, b: 70 }; // Green #1B7F46
const BRAND_HEX = "1B7F46";
const SUBTITLE_COLOR = { r: 74, g: 74, b: 74 }; // Gray #4A4A4A
const BODY_COLOR = { r: 31, g: 31, b: 31 }; // Black #1F1F1F
const WEBSITE_URL = "www.vetagroai.com.br";
const DISCLAIMER = "Este relatório é informativo e não substitui avaliação clínica por médico veterinário habilitado.";
const FOOTER_TEXT = "Documento gerado pela suíte VetAgro Sustentável AI — inteligência aplicada à saúde, produção e bem-estar animal.";
const LEGAL_DISCLAIMER = "Este documento foi gerado por inteligência artificial para fins de apoio. A validade oficial depende da assinatura do médico veterinário responsável, conforme legislação profissional vigente (Lei 5.517/1968 e Resoluções CFMV).";
const CTA_TEXT = "Deseja análise complementar? Envie novos dados ou imagens pelo app.";

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
    month: "long",
    year: "numeric"
  });
  
  // Helper: Check page break
  const checkPageBreak = (requiredSpace: number = 15): boolean => {
    if (yPosition + requiredSpace > pageHeight - 35) {
      doc.addPage();
      currentPage++;
      yPosition = margin;
      return true;
    }
    return false;
  };

  // ===== COVER PAGE =====
  
  // Header background
  doc.setFillColor(BRAND_COLOR.r, BRAND_COLOR.g, BRAND_COLOR.b);
  doc.rect(0, 0, pageWidth, 60, "F");
  
  // Brand name
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.text("VetAgro Sustentável AI", pageWidth / 2, 28, { align: "center" });
  
  // Tagline
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text("Inteligência aplicada à saúde, produção e bem-estar animal", pageWidth / 2, 40, { align: "center" });
  
  // Decorative line
  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(0.5);
  doc.line(60, 50, pageWidth - 60, 50);
  
  doc.setTextColor(0, 0, 0);
  
  // Tool name box
  yPosition = 80;
  doc.setFillColor(235, 250, 240); // Light green background
  doc.roundedRect(margin, yPosition, maxWidth, 25, 3, 3, "F");
  
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(BRAND_COLOR.r, BRAND_COLOR.g, BRAND_COLOR.b);
  doc.text(data.toolName || "Relatório Técnico", pageWidth / 2, yPosition + 15, { align: "center" });
  
  // Report title
  yPosition = 125;
  doc.setFontSize(18);
  doc.setTextColor(0, 0, 0);
  const titleLines = doc.splitTextToSize(data.title, maxWidth - 20);
  for (const line of titleLines) {
    doc.text(line, pageWidth / 2, yPosition, { align: "center" });
    yPosition += 10;
  }
  
  // Case info box
  yPosition = 165;
  doc.setFillColor(250, 250, 250);
  doc.roundedRect(margin + 20, yPosition, maxWidth - 40, 35, 3, 3, "F");
  doc.setDrawColor(220, 220, 220);
  doc.roundedRect(margin + 20, yPosition, maxWidth - 40, 35, 3, 3, "S");
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 100, 100);
  doc.text(`Data de Emissão: ${dateStr}`, pageWidth / 2, yPosition + 14, { align: "center" });
  doc.text(`ID do Caso: ${caseId}`, pageWidth / 2, yPosition + 26, { align: "center" });
  
  // Disclaimer box
  yPosition = 220;
  doc.setFillColor(255, 250, 240);
  doc.setDrawColor(255, 200, 100);
  doc.roundedRect(margin, yPosition, maxWidth, 25, 3, 3, "FD");
  
  doc.setFontSize(9);
  doc.setTextColor(150, 100, 50);
  doc.setFont("helvetica", "bold");
  doc.text("AVISO IMPORTANTE", pageWidth / 2, yPosition + 10, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.text(DISCLAIMER, pageWidth / 2, yPosition + 18, { align: "center" });
  
  // Footer on cover
  doc.setTextColor(150, 150, 150);
  doc.setFontSize(9);
  doc.text(WEBSITE_URL, pageWidth / 2, pageHeight - 25, { align: "center" });
  doc.text(`© VetAgro Sustentável AI - ${new Date().getFullYear()}`, pageWidth / 2, pageHeight - 18, { align: "center" });
  
  // ===== CONTENT PAGES =====
  doc.addPage();
  currentPage = 2;
  yPosition = margin;
  
  // Page header
  const addPageHeader = () => {
    doc.setFillColor(BRAND_COLOR.r, BRAND_COLOR.g, BRAND_COLOR.b);
    doc.rect(0, 0, pageWidth, 15, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("VetAgro Sustentável AI", 15, 10);
    doc.setFont("helvetica", "normal");
    doc.text(data.toolName || "Relatório", pageWidth - 15, 10, { align: "right" });
    doc.setTextColor(0, 0, 0);
  };
  
  addPageHeader();
  yPosition = 25;
  
  // User inputs section
  if (data.userInputs && Object.keys(data.userInputs).length > 0) {
    doc.setFillColor(240, 250, 245); // Light green background
    doc.roundedRect(margin, yPosition, maxWidth, 8 + Object.keys(data.userInputs).length * 6, 2, 2, "F");
    
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(BRAND_COLOR.r, BRAND_COLOR.g, BRAND_COLOR.b);
    doc.text("IDENTIFICAÇÃO DO CASO", margin + 5, yPosition + 6);
    yPosition += 12;
    
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(60, 60, 60);
    
    for (const [key, value] of Object.entries(data.userInputs)) {
      const text = `• ${key}: ${value}`;
      const lines = doc.splitTextToSize(text, maxWidth - 10);
      for (const line of lines) {
        doc.text(line, margin + 5, yPosition);
        yPosition += 5;
      }
    }
    yPosition += 8;
  }
  
  // Main content
  const cleanedContent = cleanTextForPDF(data.content);
  const sections = parseReportSections(cleanedContent);
  
  for (const section of sections) {
    // Section title
    if (section.title) {
      if (checkPageBreak(25)) {
        addPageHeader();
        yPosition = 25;
      }
      
      yPosition += 5;
      doc.setFillColor(BRAND_COLOR.r, BRAND_COLOR.g, BRAND_COLOR.b);
      doc.rect(margin, yPosition - 4, 3, 10, "F");
      
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(BRAND_COLOR.r, BRAND_COLOR.g, BRAND_COLOR.b);
      doc.text(section.title, margin + 6, yPosition + 3);
      doc.setTextColor(0, 0, 0);
      yPosition += 12;
    }
    
    // Section body
    if (section.body.trim()) {
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      
      const paragraphs = section.body.split("\n").filter(p => p.trim());
      
      for (const para of paragraphs) {
        const trimmedPara = para.trim();
        if (!trimmedPara) continue;
        
        if (checkPageBreak(8)) {
          addPageHeader();
          yPosition = 25;
        }
        
        // Handle bullet points
        if (trimmedPara.startsWith("•") || trimmedPara.startsWith("-") || trimmedPara.startsWith("–")) {
          const bulletText = trimmedPara.replace(/^[•\-–]\s*/, "");
          const lines = doc.splitTextToSize(`• ${bulletText}`, maxWidth - 8);
          for (let i = 0; i < lines.length; i++) {
            if (checkPageBreak(6)) {
              addPageHeader();
              yPosition = 25;
            }
            doc.text(lines[i], margin + (i === 0 ? 3 : 6), yPosition);
            yPosition += 5;
          }
        }
        // Handle numbered items
        else if (trimmedPara.match(/^\d+\./)) {
          const lines = doc.splitTextToSize(trimmedPara, maxWidth - 8);
          for (let i = 0; i < lines.length; i++) {
            if (checkPageBreak(6)) {
              addPageHeader();
              yPosition = 25;
            }
            doc.text(lines[i], margin + (i === 0 ? 3 : 8), yPosition);
            yPosition += 5;
          }
        }
        // Handle arrows
        else if (trimmedPara.startsWith("→") || trimmedPara.startsWith("->")) {
          const arrowText = trimmedPara.replace(/^(→|->)\s*/, "");
          const lines = doc.splitTextToSize(`→ ${arrowText}`, maxWidth - 8);
          for (let i = 0; i < lines.length; i++) {
            if (checkPageBreak(6)) {
              addPageHeader();
              yPosition = 25;
            }
            doc.text(lines[i], margin + (i === 0 ? 5 : 8), yPosition);
            yPosition += 5;
          }
        }
        // Regular paragraph
        else {
          const lines = doc.splitTextToSize(trimmedPara, maxWidth);
          for (const line of lines) {
            if (checkPageBreak(6)) {
              addPageHeader();
              yPosition = 25;
            }
            doc.text(line, margin, yPosition);
            yPosition += 5;
          }
        }
      }
      yPosition += 3;
    }
  }
  
  // References section
  if (data.references && data.references.length > 0) {
    if (checkPageBreak(50)) {
      addPageHeader();
      yPosition = 25;
    }
    
    yPosition += 10;
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 10;
    
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(BRAND_COLOR.r, BRAND_COLOR.g, BRAND_COLOR.b);
    doc.text("REFERÊNCIAS CONSULTADAS", margin, yPosition);
    doc.setTextColor(0, 0, 0);
    yPosition += 8;
    
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    
    for (const ref of data.references) {
      if (checkPageBreak(6)) {
        addPageHeader();
        yPosition = 25;
      }
      const cleanRef = ref.replace(/^[•\-–]\s*/, "").trim();
      const lines = doc.splitTextToSize(`• ${cleanRef}`, maxWidth - 5);
      for (const line of lines) {
        doc.text(line, margin + 3, yPosition);
        yPosition += 4;
      }
    }
  }
  
  // Legal Disclaimer Section
  if (checkPageBreak(45)) {
    addPageHeader();
    yPosition = 25;
  }
  yPosition += 10;
  
  doc.setFillColor(255, 248, 230);
  doc.setDrawColor(200, 150, 50);
  doc.roundedRect(margin, yPosition, maxWidth, 28, 3, 3, "FD");
  
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(150, 100, 50);
  doc.text("AVISO LEGAL", margin + 5, yPosition + 8);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  const legalLines = doc.splitTextToSize(LEGAL_DISCLAIMER, maxWidth - 10);
  for (let i = 0; i < legalLines.length; i++) {
    doc.text(legalLines[i], margin + 5, yPosition + 14 + (i * 4));
  }
  yPosition += 35;

  // CTA Section
  if (checkPageBreak(25)) {
    addPageHeader();
    yPosition = 25;
  }
  
  doc.setFillColor(235, 250, 240); // Light green background
  doc.setDrawColor(BRAND_COLOR.r, BRAND_COLOR.g, BRAND_COLOR.b);
  doc.roundedRect(margin, yPosition, maxWidth, 18, 3, 3, "FD");
  
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(BRAND_COLOR.r, BRAND_COLOR.g, BRAND_COLOR.b);
  doc.text(CTA_TEXT, pageWidth / 2, yPosition + 11, { align: "center" });
  
  // Footer on all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 2; i <= totalPages; i++) {
    doc.setPage(i);
    
    // Footer background
    doc.setFillColor(250, 250, 250);
    doc.rect(0, pageHeight - 22, pageWidth, 22, "F");
    
    // Footer line
    doc.setDrawColor(BRAND_COLOR.r, BRAND_COLOR.g, BRAND_COLOR.b);
    doc.setLineWidth(0.5);
    doc.line(margin, pageHeight - 22, pageWidth - margin, pageHeight - 22);
    
    // Footer text
    doc.setFontSize(7);
    doc.setTextColor(100, 100, 100);
    doc.text(FOOTER_TEXT, pageWidth / 2, pageHeight - 14, { align: "center" });
    
    // Copyright and page number
    doc.setFontSize(7);
    doc.text(`© VetAgro Sustentável AI — ${new Date().getFullYear()}`, margin, pageHeight - 6);
    doc.text(`Página ${i - 1} de ${totalPages - 1}`, pageWidth - margin, pageHeight - 6, { align: "right" });
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
            spacing: { after: 80 }
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
