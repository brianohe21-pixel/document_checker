import { Inject, Injectable } from '@nestjs/common';
import { CertificateListResponse, CertificateStatus } from '@certchain/shared';
import { AuthenticatedUser } from '../../domain/auth/auth-context';
import {
  CERTIFICATE_REPOSITORY,
  CertificateRepositoryPort,
} from '../../domain/ports/certificate.repository.port';

export interface ListCertificatesParams {
  page: number;
  limit: number;
  status?: CertificateStatus;
  search?: string;
  courseName?: string;
  dateFrom?: string;
  dateTo?: string;
}

@Injectable()
export class ListCertificatesUseCase {
  constructor(
    @Inject(CERTIFICATE_REPOSITORY)
    private readonly certificateRepository: CertificateRepositoryPort,
  ) {}

  async execute(
    user: AuthenticatedUser,
    params: ListCertificatesParams,
  ): Promise<CertificateListResponse> {
    return this.certificateRepository.findAll({
      organizationId: user.organizationId,
      page: params.page,
      limit: params.limit,
      status: params.status,
      search: params.search,
      courseName: params.courseName,
      dateFrom: params.dateFrom,
      dateTo: params.dateTo,
    });
  }
}
