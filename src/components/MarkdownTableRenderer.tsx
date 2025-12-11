import React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface ParsedTable {
  headers: string[];
  rows: string[][];
}

// Parse markdown table to structured data
const parseMarkdownTable = (tableText: string): ParsedTable | null => {
  const lines = tableText.trim().split('\n').filter(line => line.trim());
  if (lines.length < 2) return null;
  
  // Parse header
  const headerLine = lines[0];
  const headers = headerLine
    .split('|')
    .map(cell => cell.trim())
    .filter(cell => cell.length > 0);
  
  if (headers.length === 0) return null;
  
  // Skip separator line (line with dashes)
  const rows: string[][] = [];
  for (let i = 2; i < lines.length; i++) {
    const cells = lines[i]
      .split('|')
      .map(cell => cell.trim())
      .filter(cell => cell.length > 0);
    if (cells.length > 0) {
      rows.push(cells);
    }
  }
  
  return { headers, rows };
};

// Check if text contains a markdown table
const containsMarkdownTable = (text: string): boolean => {
  const tablePattern = /\|[^|]+\|.*\n\|[-:\s|]+\|.*\n(\|[^|]+\|.*\n?)+/;
  return tablePattern.test(text);
};

// Extract tables and their positions from text
const extractTables = (text: string): { tables: { start: number; end: number; content: string }[]; } => {
  const tables: { start: number; end: number; content: string }[] = [];
  const tablePattern = /(\|[^|]+\|.*\n\|[-:\s|]+\|.*\n(?:\|[^|]+\|.*\n?)+)/g;
  
  let match;
  while ((match = tablePattern.exec(text)) !== null) {
    tables.push({
      start: match.index,
      end: match.index + match[0].length,
      content: match[0]
    });
  }
  
  return { tables };
};

/**
 * Pre-process continuous text to add line breaks before section titles
 * This handles AI responses that come without proper line breaks
 */
const preprocessContinuousText = (text: string): string => {
  if (!text) return '';
  
  let processed = text;
  
  // Known section title patterns - add line breaks before them
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
    const regex = new RegExp(`([^\\n])\\s*(${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
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
};

// Check if line is a section title (uppercase or ends with :)
const isSectionTitle = (line: string): boolean => {
  const trimmed = line.trim();
  if (trimmed.length < 3 || trimmed.length > 100) return false;
  
  // Lines that are mostly uppercase (>60%) and have at least 3 chars
  const uppercaseChars = (trimmed.match(/[A-ZÀ-Ü]/g) || []).length;
  const totalChars = trimmed.replace(/[\s:]/g, '').length;
  const uppercaseRatio = totalChars > 0 ? uppercaseChars / totalChars : 0;
  const isUppercase = uppercaseRatio > 0.6 && totalChars >= 3;
  
  // Lines ending with : that don't start with bullet
  const endsWithColon = trimmed.endsWith(':') && !trimmed.startsWith('•') && !trimmed.startsWith('-');
  
  // Common section patterns
  const sectionPatterns = [
    /^(IDENTIFICAÇÃO|ANÁLISE|DIAGNÓSTICO|RECOMENDAÇÕES|REFERÊNCIAS|CONCLUSÃO|RESUMO|SÍNTESE|PROJEÇÃO|CUSTOS|EMISSÕES|RESULTADOS|METODOLOGIA|PARÂMETROS|INDICADORES|VIABILIDADE|CENÁRIOS|OBSERVAÇÕES|ALERTAS|CONSIDERAÇÕES|DADOS|MANEJO|ESTRATÉGIAS|ALTERNATIVAS|REDUÇÃO)/i,
    /^\d+\.\s*[A-ZÀ-Ü]/,
    /^\d+\.\d+\s+[A-ZÀ-Ü]/,
  ];
  const matchesPattern = sectionPatterns.some(p => p.test(trimmed));
  
  return isUppercase || endsWithColon || matchesPattern;
};

// Check if line is a subsection title
const isSubsectionTitle = (line: string): boolean => {
  const trimmed = line.trim();
  // Lines that start with number followed by dot and text
  if (/^\d+\.\d+\.?\s+\w/.test(trimmed)) return true;
  // Lines that have title case and end with :
  if (trimmed.endsWith(':') && trimmed.length < 80 && /^[A-ZÁÉÍÓÚÂÊÔÃÕÇ]/.test(trimmed)) return true;
  // Lines starting with specific keywords
  const subsectionPatterns = [
    /^(Nota:|Importante:|Atenção:|Observação:|Dica:|Alerta:|OBS:)/i,
    /^(Cenário\s+\d+|Scenario)/i,
  ];
  return subsectionPatterns.some(p => p.test(trimmed));
};

// Check if line is a bullet point
const isBulletPoint = (line: string): boolean => {
  const trimmed = line.trim();
  return /^[•\-–→]\s/.test(trimmed) || /^[a-z]\)\s/i.test(trimmed);
};

// Check if line is a numbered list item
const isNumberedItem = (line: string): boolean => {
  const trimmed = line.trim();
  return /^\d+[.)]\s/.test(trimmed);
};

interface MarkdownTableRendererProps {
  content: string;
  className?: string;
}

export const MarkdownTableRenderer: React.FC<MarkdownTableRendererProps> = ({ content, className = "" }) => {
  // Pre-process the content to add line breaks before section titles
  const processedContent = preprocessContinuousText(content);
  
  const renderTable = (tableContent: string, key: string) => {
    const parsed = parseMarkdownTable(tableContent);
    if (!parsed) return null;
    
    return (
      <div key={key} className="my-4 overflow-x-auto">
        <Table className="border border-border">
          <TableHeader>
            <TableRow className="bg-muted/50">
              {parsed.headers.map((header, idx) => (
                <TableHead 
                  key={idx} 
                  className="font-semibold text-foreground border-b border-border px-3 py-2 text-left"
                >
                  {header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {parsed.rows.map((row, rowIdx) => (
              <TableRow 
                key={rowIdx} 
                className={rowIdx % 2 === 0 ? "bg-background" : "bg-muted/30"}
              >
                {row.map((cell, cellIdx) => (
                  <TableCell 
                    key={cellIdx} 
                    className="border-b border-border px-3 py-2 text-sm"
                  >
                    {cell}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  };

  const renderStructuredContent = (text: string): React.ReactNode[] => {
    const parts: React.ReactNode[] = [];
    const lines = text.split('\n');
    let currentParagraph: string[] = [];
    let listItems: { type: 'bullet' | 'number'; content: string }[] = [];
    
    const flushParagraph = () => {
      if (currentParagraph.length > 0) {
        const text = currentParagraph.join(' ').trim();
        if (text) {
          parts.push(
            <p 
              key={`p-${parts.length}`} 
              className="mb-3 text-foreground leading-relaxed"
              style={{ textAlign: 'justify', textJustify: 'inter-word' }}
            >
              {text}
            </p>
          );
        }
        currentParagraph = [];
      }
    };
    
    const flushList = () => {
      if (listItems.length > 0) {
        const isBullet = listItems[0].type === 'bullet';
        const ListTag = isBullet ? 'ul' : 'ol';
        parts.push(
          <ListTag 
            key={`list-${parts.length}`} 
            className={`mb-4 pl-5 space-y-1.5 ${isBullet ? 'list-disc' : 'list-decimal'}`}
          >
            {listItems.map((item, idx) => (
              <li 
                key={idx} 
                className="text-foreground leading-relaxed"
                style={{ textAlign: 'justify', textJustify: 'inter-word' }}
              >
                {item.content}
              </li>
            ))}
          </ListTag>
        );
        listItems = [];
      }
    };
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmedLine = line.trim();
      
      // Skip empty lines
      if (!trimmedLine) {
        flushParagraph();
        flushList();
        continue;
      }
      
      // Section title (H2)
      if (isSectionTitle(trimmedLine)) {
        flushParagraph();
        flushList();
        parts.push(
          <h2 
            key={`h2-${parts.length}`} 
            className="text-lg font-bold text-primary mt-6 mb-3 pb-1 border-b-2 border-primary/30"
          >
            {trimmedLine.replace(/:$/, '')}
          </h2>
        );
        continue;
      }
      
      // Subsection title (H3)
      if (isSubsectionTitle(trimmedLine)) {
        flushParagraph();
        flushList();
        parts.push(
          <h3 
            key={`h3-${parts.length}`} 
            className="text-base font-semibold text-foreground mt-4 mb-2"
          >
            {trimmedLine.replace(/:$/, '')}
          </h3>
        );
        continue;
      }
      
      // Bullet point
      if (isBulletPoint(trimmedLine)) {
        flushParagraph();
        const bulletContent = trimmedLine.replace(/^[•\-–→]\s*/, '').replace(/^[a-z]\)\s*/i, '');
        
        // If we have numbered items, flush them first
        if (listItems.length > 0 && listItems[0].type === 'number') {
          flushList();
        }
        
        listItems.push({ type: 'bullet', content: bulletContent });
        continue;
      }
      
      // Numbered item
      if (isNumberedItem(trimmedLine)) {
        flushParagraph();
        const numberContent = trimmedLine.replace(/^\d+[.)]\s*/, '');
        
        // If we have bullet items, flush them first
        if (listItems.length > 0 && listItems[0].type === 'bullet') {
          flushList();
        }
        
        listItems.push({ type: 'number', content: numberContent });
        continue;
      }
      
      // Regular text - add to paragraph
      flushList();
      currentParagraph.push(trimmedLine);
    }
    
    // Flush remaining content
    flushParagraph();
    flushList();
    
    return parts;
  };

  // If content has tables, handle them specially
  if (containsMarkdownTable(processedContent)) {
    const { tables } = extractTables(processedContent);
    const allParts: React.ReactNode[] = [];
    let lastIndex = 0;

    tables.forEach((table, tableIndex) => {
      // Add text before table
      if (table.start > lastIndex) {
        const textBefore = processedContent.slice(lastIndex, table.start);
        if (textBefore.trim()) {
          allParts.push(
            <div key={`text-${tableIndex}`}>
              {renderStructuredContent(textBefore)}
            </div>
          );
        }
      }

      // Render table
      allParts.push(renderTable(table.content, `table-${tableIndex}`));
      lastIndex = table.end;
    });

    // Add remaining text after last table
    if (lastIndex < processedContent.length) {
      const textAfter = processedContent.slice(lastIndex);
      if (textAfter.trim()) {
        allParts.push(
          <div key="text-final">
            {renderStructuredContent(textAfter)}
          </div>
        );
      }
    }

    return <div className={className}>{allParts}</div>;
  }

  // No tables - render structured content directly
  return (
    <div className={className}>
      {renderStructuredContent(processedContent)}
    </div>
  );
};