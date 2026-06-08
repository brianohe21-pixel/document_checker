import { Injectable } from '@nestjs/common';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import * as QRCode from 'qrcode';
import { CertificatePdfData, PdfGeneratorPort } from '../../domain/ports/pdf-generator.port';

@Injectable()
export class PdfLibGeneratorService implements PdfGeneratorPort {
  async generate(data: CertificatePdfData): Promise<Buffer> {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([842, 595]);
    const { width, height } = page.getSize();

    const titleFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const bodyFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

    const margin = 50;
    const accentColor = rgb(0.1, 0.3, 0.6);

    page.drawRectangle({
      x: margin,
      y: margin,
      width: width - margin * 2,
      height: height - margin * 2,
      borderColor: accentColor,
      borderWidth: 3,
    });

    page.drawText('CERTIFICATE OF COMPLETION', {
      x: width / 2 - 180,
      y: height - 100,
      size: 24,
      font: titleFont,
      color: accentColor,
    });

    page.drawText('This certifies that', {
      x: width / 2 - 70,
      y: height - 160,
      size: 14,
      font: bodyFont,
      color: rgb(0.3, 0.3, 0.3),
    });

    page.drawText(data.studentName, {
      x: width / 2 - data.studentName.length * 5,
      y: height - 200,
      size: 28,
      font: titleFont,
      color: rgb(0, 0, 0),
    });

    page.drawText('has successfully completed', {
      x: width / 2 - 95,
      y: height - 250,
      size: 14,
      font: bodyFont,
      color: rgb(0.3, 0.3, 0.3),
    });

    page.drawText(data.courseName, {
      x: width / 2 - data.courseName.length * 4,
      y: height - 290,
      size: 20,
      font: titleFont,
      color: accentColor,
    });

    page.drawText(`Issue Date: ${data.issueDate}`, {
      x: width / 2 - 80,
      y: height - 340,
      size: 12,
      font: bodyFont,
      color: rgb(0.3, 0.3, 0.3),
    });

    page.drawText(`Certificate ID: ${data.certificateId}`, {
      x: margin + 20,
      y: margin + 30,
      size: 10,
      font: bodyFont,
      color: rgb(0.5, 0.5, 0.5),
    });

    const qrPng = await QRCode.toBuffer(data.verificationUrl, {
      type: 'png',
      width: 120,
      margin: 1,
    });

    const qrImage = await pdfDoc.embedPng(qrPng);
    page.drawImage(qrImage, {
      x: width - margin - 140,
      y: margin + 20,
      width: 120,
      height: 120,
    });

    page.drawText('Scan to verify', {
      x: width - margin - 130,
      y: margin + 10,
      size: 8,
      font: bodyFont,
      color: rgb(0.5, 0.5, 0.5),
    });

    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
  }
}
