import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CertificateTemplate, UpdateTemplateDto } from '@certchain/shared';
import {
  TEMPLATE_REPOSITORY,
  TemplateRepositoryPort,
} from '../../../domain/ports/template.repository.port';

@Injectable()
export class UpdateTemplateUseCase {
  constructor(
    @Inject(TEMPLATE_REPOSITORY)
    private readonly templateRepository: TemplateRepositoryPort,
  ) {}

  async execute(
    organizationId: string,
    templateId: string,
    dto: UpdateTemplateDto,
  ): Promise<CertificateTemplate> {
    const existing = await this.templateRepository.findByIdAndOrganization(
      templateId,
      organizationId,
    );
    if (!existing) throw new NotFoundException('Template not found');

    const updated = await this.templateRepository.update(templateId, organizationId, dto);
    return this.templateRepository.toDto(updated);
  }
}
