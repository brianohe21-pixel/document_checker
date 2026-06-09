import { Inject, Injectable } from '@nestjs/common';
import { CertificateListResponse, CertificateStatus } from '@certchain/shared';
import {
  CERTIFICATE_REPOSITORY,
  CertificateRepositoryPort,
} from '../../domain/ports/certificate.repository.port';

@Injectable()
export class ListCertificatesUseCase {
  constructor(
    @Inject(CERTIFICATE_REPOSITORY)
    private readonly certificateRepository: CertificateRepositoryPort,
  ) {}

  async execute(
    page: number,
    limit: number,
    status?: CertificateStatus,
  ): Promise<CertificateListResponse> {
    return this.certificateRepository.findAll({ page, limit, status });
  }
}
