import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PreviewTemplateDto, PreviewTemplateResponse } from '@certchain/shared';
import { PDF_GENERATOR_PORT, PdfGeneratorPort } from '../../../domain/ports/pdf-generator.port';
import {
  TEMPLATE_REPOSITORY,
  TemplateRepositoryPort,
} from '../../../domain/ports/template.repository.port';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class PreviewTemplateUseCase {
  constructor(
    @Inject(TEMPLATE_REPOSITORY)
    private readonly templateRepository: TemplateRepositoryPort,
    @Inject(PDF_GENERATOR_PORT)
    private readonly pdfGenerator: PdfGeneratorPort,
    private readonly configService: ConfigService,
  ) {}

  async execute(
    organizationId: string,
    templateId: string,
    dto: PreviewTemplateDto,
  ): Promise<PreviewTemplateResponse> {
    const template = await this.templateRepository.findByIdAndOrganization(
      templateId,
      organizationId,
    );
    if (!template) throw new NotFoundException('Template not found');

    const certificateId = uuidv4();
    const publicVerifyUrl = this.configService.get<string>(
      'PUBLIC_VERIFY_URL',
      'http://localhost:3000/verify',
    );

    const pdfBuffer = await this.pdfGenerator.generate({
      certificateId,
      studentName: dto.studentName ?? 'Jane Doe',
      courseName: dto.courseName ?? 'Sample Course',
      issueDate: dto.issueDate ?? new Date().toISOString().split('T')[0],
      verificationUrl: `${publicVerifyUrl}/${certificateId}`,
      template: template.config,
    });

    return { pdfBase64: pdfBuffer.toString('base64') };
  }
}
