import { BadRequestException } from '@nestjs/common';
import { IssueCertificateDto } from '@certchain/shared';

const REQUIRED_HEADERS = ['studentName', 'courseName', 'issueDate'];

export function parseBulkCsv(content: string): IssueCertificateDto[] {
  const lines = content
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    throw new BadRequestException('CSV must have a header row and at least one data row');
  }

  const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
  for (const required of REQUIRED_HEADERS) {
    if (!headers.includes(required)) {
      throw new BadRequestException(`Missing required column: ${required}`);
    }
  }

  const rows: IssueCertificateDto[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i]);
    const row: Record<string, string> = {};
    headers.forEach((header, index) => {
      row[header] = values[index]?.trim() ?? '';
    });

    if (!row.studentName || !row.courseName || !row.issueDate) {
      throw new BadRequestException(`Row ${i + 1}: missing required fields`);
    }

    rows.push({
      studentName: row.studentName,
      courseName: row.courseName,
      issueDate: row.issueDate,
      studentEmail: row.studentEmail || undefined,
      templateId: row.templateId || undefined,
    });
  }

  return rows;
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.replace(/^"|"$/g, '').replace(/""/g, '"'));
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.replace(/^"|"$/g, '').replace(/""/g, '"'));
  return result;
}
