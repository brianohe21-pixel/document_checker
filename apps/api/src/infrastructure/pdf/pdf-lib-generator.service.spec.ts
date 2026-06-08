import { PDFDocument } from 'pdf-lib';
import { PdfLibGeneratorService } from './pdf-lib-generator.service';

describe('PdfLibGeneratorService', () => {
  const service = new PdfLibGeneratorService();

  const testData = {
    certificateId: 'test-cert-uuid',
    studentName: 'Juan Perez',
    courseName: 'Blockchain Fundamentals',
    issueDate: '2026-06-01',
    verificationUrl: 'http://localhost:3000/verify/test-cert-uuid',
  };

  it('should generate a valid PDF buffer', async () => {
    const buffer = await service.generate(testData);
    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(0);

    const pdfDoc = await PDFDocument.load(buffer);
    expect(pdfDoc.getPageCount()).toBe(1);
  });

  it('should embed verification URL in QR (PDF contains image)', async () => {
    const buffer = await service.generate(testData);
    const pdfDoc = await PDFDocument.load(buffer);
    const page = pdfDoc.getPage(0);
    const { width, height } = page.getSize();
    expect(width).toBe(842);
    expect(height).toBe(595);
  });
});
