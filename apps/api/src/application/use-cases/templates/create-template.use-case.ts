import { Inject, Injectable } from '@nestjs/common';
import { CertificateTemplate, CreateTemplateDto } from '@certchain/shared';
import {
  TEMPLATE_REPOSITORY,
  TemplateRepositoryPort,
} from '../../../domain/ports/template.repository.port';

@Injectable()
export class CreateTemplateUseCase {
  constructor(
    @Inject(TEMPLATE_REPOSITORY)
    private readonly templateRepository: TemplateRepositoryPort,
  ) {}

  async execute(organizationId: string, dto: CreateTemplateDto): Promise<CertificateTemplate> {
    const template = await this.templateRepository.create(organizationId, dto);
    return this.templateRepository.toDto(template);
  }
}
