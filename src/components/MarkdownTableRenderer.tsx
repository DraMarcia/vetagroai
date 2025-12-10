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

interface MarkdownTableRendererProps {
  content: string;
  className?: string;
}

export const MarkdownTableRenderer: React.FC<MarkdownTableRendererProps> = ({ content, className = "" }) => {
  if (!containsMarkdownTable(content)) {
    return (
      <div 
        className={`whitespace-pre-line ${className}`}
        style={{ textAlign: 'justify', textJustify: 'inter-word' }}
      >
        {content}
      </div>
    );
  }

  const { tables } = extractTables(content);
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;

  tables.forEach((table, tableIndex) => {
    // Add text before table
    if (table.start > lastIndex) {
      const textBefore = content.slice(lastIndex, table.start);
      if (textBefore.trim()) {
        parts.push(
          <div 
            key={`text-${tableIndex}`}
            className="whitespace-pre-line"
            style={{ textAlign: 'justify', textJustify: 'inter-word' }}
          >
            {textBefore}
          </div>
        );
      }
    }

    // Parse and render table
    const parsed = parseMarkdownTable(table.content);
    if (parsed) {
      parts.push(
        <div key={`table-${tableIndex}`} className="my-4 overflow-x-auto">
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
    }

    lastIndex = table.end;
  });

  // Add remaining text after last table
  if (lastIndex < content.length) {
    const textAfter = content.slice(lastIndex);
    if (textAfter.trim()) {
      parts.push(
        <div 
          key="text-final"
          className="whitespace-pre-line"
          style={{ textAlign: 'justify', textJustify: 'inter-word' }}
        >
          {textAfter}
        </div>
      );
    }
  }

  return <div className={className}>{parts}</div>;
};
