import { Injectable } from '@nestjs/common';
import { DEFAULT_TEMPLATE_CONFIG } from '@certchain/shared';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import * as QRCode from 'qrcode';
import { CertificatePdfData, PdfGeneratorPort } from '../../domain/ports/pdf-generator.port';

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const normalized = hex.replace('#', '');
  const num = parseInt(normalized, 16);
  return {
    r: ((num >> 16) & 255) / 255,
    g: ((num >> 8) & 255) / 255,
    b: (num & 255) / 255,
  };
}

@Injectable()
export class PdfLibGeneratorService implements PdfGeneratorPort {
  async generate(data: CertificatePdfData): Promise<Buffer> {
    const config = data.template ?? DEFAULT_TEMPLATE_CONFIG;
    const accent = hexToRgb(config.primaryColor);

    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([842, 595]);
    const { width, height } = page.getSize();

    const titleFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const bodyFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

    const margin = 50;
    const accentColor = rgb(accent.r, accent.g, accent.b);

    page.drawRectangle({
      x: margin,
      y: margin,
      width: width - margin * 2,
      height: height - margin * 2,
      borderColor: accentColor,
      borderWidth: 3,
    });

    let y = height - 80;

    if (config.logoUrl) {
      try {
        const imageBytes = await this.fetchImage(config.logoUrl);
        const image = config.logoUrl.toLowerCase().includes('.png')
          ? await pdfDoc.embedPng(imageBytes)
          : await pdfDoc.embedJpg(imageBytes);
        const dims = image.scale(0.3);
        page.drawImage(image, {
          x: width / 2 - dims.width / 2,
          y: y - dims.height,
          width: dims.width,
          height: dims.height,
        });
        y -= dims.height + 20;
      } catch {
        // skip logo on failure
      }
    }

    const titleWidth = config.title.length * 7;
    page.drawText(config.title, {
      x: width / 2 - titleWidth / 2,
      y,
      size: 24,
      font: titleFont,
      color: accentColor,
    });
    y -= 50;

    if (config.subtitle) {
      const subtitleWidth = config.subtitle.length * 4;
      page.drawText(config.subtitle, {
        x: width / 2 - subtitleWidth / 2,
        y,
        size: 14,
        font: bodyFont,
        color: rgb(0.3, 0.3, 0.3),
      });
      y -= 40;
    }

    const nameWidth = data.studentName.length * 5;
    page.drawText(data.studentName, {
      x: width / 2 - nameWidth / 2,
      y,
      size: 28,
      font: titleFont,
      color: rgb(0, 0, 0),
    });
    y -= 50;

    for (const line of config.bodyLines ?? []) {
      const lineWidth = line.length * 4;
      page.drawText(line, {
        x: width / 2 - lineWidth / 2,
        y,
        size: 14,
        font: bodyFont,
        color: rgb(0.3, 0.3, 0.3),
      });
      y -= 30;
    }

    const courseWidth = data.courseName.length * 4;
    page.drawText(data.courseName, {
      x: width / 2 - courseWidth / 2,
      y,
      size: 20,
      font: titleFont,
      color: accentColor,
    });
    y -= 50;

    page.drawText(`Issue Date: ${data.issueDate}`, {
      x: width / 2 - 80,
      y,
      size: 12,
      font: bodyFont,
      color: rgb(0.3, 0.3, 0.3),
    });

    if (config.customFields?.length) {
      y -= 30;
      for (const field of config.customFields) {
        if (field.value) {
          page.drawText(`${field.label}: ${field.value}`, {
            x: width / 2 - 100,
            y,
            size: 11,
            font: bodyFont,
            color: rgb(0.3, 0.3, 0.3),
          });
          y -= 20;
        }
      }
    }

    if (config.showCertificateId) {
      page.drawText(`Certificate ID: ${data.certificateId}`, {
        x: margin + 20,
        y: margin + 30,
        size: 10,
        font: bodyFont,
        color: rgb(0.5, 0.5, 0.5),
      });
    }

    if (config.showQr) {
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
    }

    if (config.signatureImageUrl) {
      try {
        const sigBytes = await this.fetchImage(config.signatureImageUrl);
        const sigImage = config.signatureImageUrl.toLowerCase().includes('.png')
          ? await pdfDoc.embedPng(sigBytes)
          : await pdfDoc.embedJpg(sigBytes);
        const sigDims = sigImage.scale(0.2);
        page.drawImage(sigImage, {
          x: margin + 40,
          y: margin + 50,
          width: sigDims.width,
          height: sigDims.height,
        });
      } catch {
        // skip signature on failure
      }
    }

    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
  }

  private async fetchImage(url: string): Promise<Uint8Array> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    try {
      const res = await fetch(url, { signal: controller.signal });
      if (!res.ok) throw new Error('Failed to fetch image');
      const buffer = await res.arrayBuffer();
      return new Uint8Array(buffer);
    } finally {
      clearTimeout(timeout);
    }
  }
}
