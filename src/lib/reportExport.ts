import { jsPDF } from "jspdf";
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle } from "docx";
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
}

// ============= PDF Export =============

export async function exportToPDF(data: ReportData): Promise<void> {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const maxWidth = pageWidth - 2 * margin;
  const lineHeight = 5;
  const titleLineHeight = 7;
  
  let yPosition = margin;
  let currentPage = 1;
  
  // Helper: Add new page if needed
  const checkPageBreak = (requiredSpace: number = 15): boolean => {
    if (yPosition + requiredSpace > pageHeight - 30) {
      doc.addPage();
      currentPage++;
      yPosition = margin;
      return true;
    }
    return false;
  };
  
  // Helper: Add text with automatic page breaks
  const addText = (text: string, fontSize: number, isBold: boolean = false, isTitle: boolean = false) => {
    doc.setFontSize(fontSize);
    doc.setFont("helvetica", isBold ? "bold" : "normal");
    
    const lines = doc.splitTextToSize(text, maxWidth);
    const currentLineHeight = isTitle ? titleLineHeight : lineHeight;
    
    for (const line of lines) {
      checkPageBreak(currentLineHeight);
      doc.text(line, margin, yPosition);
      yPosition += currentLineHeight;
    }
  };
  
  // Helper: Add centered text
  const addCenteredText = (text: string, fontSize: number, isBold: boolean = false) => {
    doc.setFontSize(fontSize);
    doc.setFont("helvetica", isBold ? "bold" : "normal");
    checkPageBreak(10);
    doc.text(text, pageWidth / 2, yPosition, { align: "center" });
    yPosition += 7;
  };
  
  // ===== HEADER =====
  doc.setFillColor(34, 100, 60); // Dark green
  doc.rect(0, 0, pageWidth, 18, "F");
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("VetAgro Sustentável AI", pageWidth / 2, 8, { align: "center" });
  
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(data.toolName || "Relatório Técnico", pageWidth / 2, 14, { align: "center" });
  
  doc.setTextColor(0, 0, 0);
  yPosition = 28;
  
  // ===== TITLE =====
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(data.title, pageWidth / 2, yPosition, { align: "center" });
  yPosition += 10;
  
  // ===== DATE =====
  const dateStr = (data.date || new Date()).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric"
  });
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text(`Gerado em: ${dateStr}`, pageWidth / 2, yPosition, { align: "center" });
  doc.setTextColor(0, 0, 0);
  yPosition += 8;
  
  // ===== SEPARATOR =====
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 10;
  
  // ===== USER INPUTS (if provided) =====
  if (data.userInputs && Object.keys(data.userInputs).length > 0) {
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("DADOS DO CASO:", margin, yPosition);
    yPosition += 7;
    
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    
    for (const [key, value] of Object.entries(data.userInputs)) {
      checkPageBreak(6);
      const text = `• ${key}: ${value}`;
      const lines = doc.splitTextToSize(text, maxWidth);
      for (const line of lines) {
        doc.text(line, margin, yPosition);
        yPosition += 5;
      }
    }
    yPosition += 5;
  }
  
  // ===== MAIN CONTENT =====
  const cleanedContent = cleanTextForPDF(data.content);
  const sections = parseReportSections(cleanedContent);
  
  for (const section of sections) {
    // Section title
    if (section.title) {
      checkPageBreak(20);
      yPosition += 3;
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(34, 100, 60);
      doc.text(section.title, margin, yPosition);
      doc.setTextColor(0, 0, 0);
      yPosition += 7;
    }
    
    // Section body
    if (section.body.trim()) {
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      
      const paragraphs = section.body.split("\n").filter(p => p.trim());
      
      for (const para of paragraphs) {
        const trimmedPara = para.trim();
        if (!trimmedPara) continue;
        
        checkPageBreak(6);
        
        // Handle bullet points
        if (trimmedPara.startsWith("•") || trimmedPara.startsWith("-")) {
          const bulletText = trimmedPara.replace(/^[•-]\s*/, "");
          const lines = doc.splitTextToSize(`• ${bulletText}`, maxWidth - 5);
          for (let i = 0; i < lines.length; i++) {
            checkPageBreak(5);
            doc.text(lines[i], margin + (i === 0 ? 0 : 3), yPosition);
            yPosition += 5;
          }
        }
        // Handle numbered items
        else if (trimmedPara.match(/^\d+\./)) {
          const lines = doc.splitTextToSize(trimmedPara, maxWidth - 5);
          for (let i = 0; i < lines.length; i++) {
            checkPageBreak(5);
            doc.text(lines[i], margin + (i === 0 ? 0 : 5), yPosition);
            yPosition += 5;
          }
        }
        // Regular paragraph
        else {
          const lines = doc.splitTextToSize(trimmedPara, maxWidth);
          for (const line of lines) {
            checkPageBreak(5);
            doc.text(line, margin, yPosition);
            yPosition += 5;
          }
        }
      }
      yPosition += 2;
    }
  }
  
  // ===== REFERENCES =====
  if (data.references && data.references.length > 0) {
    checkPageBreak(40);
    yPosition += 8;
    
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 8;
    
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(34, 100, 60);
    doc.text("REFERÊNCIAS CONSULTADAS:", margin, yPosition);
    doc.setTextColor(0, 0, 0);
    yPosition += 7;
    
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    
    for (const ref of data.references) {
      checkPageBreak(5);
      const cleanRef = ref.replace(/^[•-]\s*/, "").trim();
      const lines = doc.splitTextToSize(`• ${cleanRef}`, maxWidth - 5);
      for (const line of lines) {
        doc.text(line, margin, yPosition);
        yPosition += 4;
      }
    }
  }
  
  // ===== FOOTER ON ALL PAGES =====
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    
    // Footer background
    doc.setFillColor(245, 245, 245);
    doc.rect(0, pageHeight - 20, pageWidth, 20, "F");
    
    // Footer line
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, pageHeight - 20, pageWidth - margin, pageHeight - 20);
    
    // Footer text
    doc.setFontSize(7);
    doc.setTextColor(100, 100, 100);
    doc.text(
      "Relatório gerado pela suíte VetAgro AI — inteligência aplicada à saúde e sustentabilidade.",
      pageWidth / 2,
      pageHeight - 12,
      { align: "center" }
    );
    
    doc.setFontSize(8);
    doc.text(
      `Página ${i} de ${totalPages}`,
      pageWidth / 2,
      pageHeight - 6,
      { align: "center" }
    );
  }
  
  // ===== SAVE =====
  const fileName = `${data.title.replace(/[^a-zA-Z0-9\s]/g, "").replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.pdf`;
  doc.save(fileName);
}

// ============= DOCX Export =============

export async function exportToDocx(data: ReportData): Promise<void> {
  const cleanedContent = cleanTextForPDF(data.content);
  const sections = parseReportSections(cleanedContent);
  
  const children: Paragraph[] = [];
  
  // Header
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: "VetAgro Sustentável AI",
          bold: true,
          size: 24,
          color: "226444"
        }),
        new TextRun({
          text: data.toolName ? ` — ${data.toolName}` : "",
          size: 24,
          color: "666666"
        })
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 }
    })
  );
  
  // Title
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: data.title,
          bold: true,
          size: 32,
          color: "226444"
        })
      ],
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 }
    })
  );
  
  // Date
  const dateStr = (data.date || new Date()).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric"
  });
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: `Gerado em: ${dateStr}`,
          size: 20,
          color: "666666",
          italics: true
        })
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 }
    })
  );
  
  // User inputs
  if (data.userInputs && Object.keys(data.userInputs).length > 0) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: "DADOS DO CASO",
            bold: true,
            size: 24,
            color: "226444"
          })
        ],
        spacing: { before: 200, after: 100 }
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
              color: "226444"
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
        const trimmedPara = para.trim();
        if (!trimmedPara) continue;
        
        const isBullet = trimmedPara.startsWith("•") || trimmedPara.startsWith("-");
        const text = isBullet ? trimmedPara.replace(/^[•-]\s*/, "") : trimmedPara;
        
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
            color: "226444"
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
      const cleanRef = ref.replace(/^[•-]\s*/, "").trim();
      children.push(
        new Paragraph({
          children: [new TextRun({ text: cleanRef, size: 20 })],
          bullet: { level: 0 },
          spacing: { after: 50 }
        })
      );
    }
  }
  
  // Footer
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: "Relatório gerado pela suíte VetAgro AI — inteligência aplicada à saúde e sustentabilidade.",
          size: 18,
          color: "999999",
          italics: true
        })
      ],
      alignment: AlignmentType.CENTER,
      spacing: { before: 400 }
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
  
  const wb = XLSX.utils.book_new();
  
  // Main content sheet
  const mainData: string[][] = [];
  mainData.push(["VetAgro Sustentável AI"]);
  mainData.push([data.title]);
  mainData.push([`Gerado em: ${(data.date || new Date()).toLocaleDateString("pt-BR")}`]);
  if (data.toolName) {
    mainData.push([`Ferramenta: ${data.toolName}`]);
  }
  mainData.push([]);
  
  // User inputs
  if (data.userInputs && Object.keys(data.userInputs).length > 0) {
    mainData.push(["DADOS DO CASO"]);
    for (const [key, value] of Object.entries(data.userInputs)) {
      mainData.push([`${key}: ${value}`]);
    }
    mainData.push([]);
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
    mainData.push([]);
  }
  
  // References
  if (data.references && data.references.length > 0) {
    mainData.push(["REFERÊNCIAS CONSULTADAS"]);
    for (const ref of data.references) {
      const cleanRef = ref.replace(/^[•-]\s*/, "").trim();
      mainData.push([`• ${cleanRef}`]);
    }
  }
  
  // Footer
  mainData.push([]);
  mainData.push(["Relatório gerado pela suíte VetAgro AI — inteligência aplicada à saúde e sustentabilidade."]);
  
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
      font-family: Georgia, 'Times New Roman', serif;
      line-height: 1.7;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
      color: #333;
    }
    .header {
      background-color: #226444;
      color: white;
      padding: 15px;
      text-align: center;
      margin-bottom: 20px;
      border-radius: 4px;
    }
    .header h1 {
      margin: 0;
      font-size: 1.2em;
    }
    .header p {
      margin: 5px 0 0 0;
      font-size: 0.9em;
      opacity: 0.9;
    }
    h1.title {
      color: #226444;
      text-align: center;
      border-bottom: 2px solid #226444;
      padding-bottom: 10px;
      margin-top: 0;
    }
    h2 {
      color: #226444;
      margin-top: 30px;
      border-left: 4px solid #226444;
      padding-left: 10px;
      font-size: 1.1em;
    }
    .meta {
      text-align: center;
      color: #666;
      font-style: italic;
      margin-bottom: 30px;
    }
    .case-data {
      background-color: #f8f8f8;
      padding: 15px;
      border-radius: 4px;
      margin-bottom: 20px;
    }
    .case-data h3 {
      margin-top: 0;
      color: #226444;
    }
    .content p {
      text-align: justify;
      margin-bottom: 12px;
    }
    .bullet {
      padding-left: 20px;
      position: relative;
    }
    .bullet::before {
      content: "•";
      position: absolute;
      left: 5px;
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
      border-top: 1px solid #eee;
      padding-top: 20px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>VetAgro Sustentável AI</h1>
    <p>${data.toolName || "Relatório Técnico"}</p>
  </div>
  
  <h1 class="title">${data.title}</h1>
  <div class="meta">
    <p>Gerado em: ${dateStr}</p>
  </div>`;

  // User inputs
  if (data.userInputs && Object.keys(data.userInputs).length > 0) {
    htmlContent += `
  <div class="case-data">
    <h3>Dados do Caso</h3>
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
      
      if (trimmedPara.startsWith("•") || trimmedPara.startsWith("-")) {
        htmlContent += `
    <p class="bullet">${trimmedPara.replace(/^[•-]\s*/, "")}</p>`;
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
      const cleanRef = ref.replace(/^[•-]\s*/, "").trim();
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
  <div class="footer">
    <p>Relatório gerado pela suíte VetAgro AI — inteligência aplicada à saúde e sustentabilidade.</p>
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
