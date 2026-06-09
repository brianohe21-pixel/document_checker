import { Inject, Injectable } from '@nestjs/common';
import { CertificateTemplate } from '@certchain/shared';
import {
  TEMPLATE_REPOSITORY,
  TemplateRepositoryPort,
} from '../../../domain/ports/template.repository.port';

@Injectable()
export class ListTemplatesUseCase {
  constructor(
    @Inject(TEMPLATE_REPOSITORY)
    private readonly templateRepository: TemplateRepositoryPort,
  ) {}

  async execute(organizationId: string): Promise<CertificateTemplate[]> {
    const templates = await this.templateRepository.findByOrganization(organizationId);
    return templates.map((t) => this.templateRepository.toDto(t));
  }
}
