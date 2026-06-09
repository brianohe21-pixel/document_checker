import { Injectable } from '@nestjs/common';
import { CertificateStatus as PrismaCertificateStatus } from '@prisma/client';
import { CertificateListResponse, CertificateStatus } from '@certchain/shared';
import { Certificate } from '../../domain/entities/certificate.entity';
import {
  CertificateRepositoryPort,
  CreateCertificateData,
  FindAllCertificatesParams,
  UpdateRevocationData,
} from '../../domain/ports/certificate.repository.port';
import { PrismaService } from './prisma.service';

@Injectable()
export class PrismaCertificateRepository implements CertificateRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findByCertificateId(certificateId: string): Promise<Certificate | null> {
    const record = await this.prisma.certificate.findUnique({
      where: { certificateId },
    });
    return record ? this.toDomain(record) : null;
  }

  async findByDocumentHash(documentHash: string): Promise<Certificate | null> {
    const record = await this.prisma.certificate.findFirst({
      where: { documentHash },
    });
    return record ? this.toDomain(record) : null;
  }

  async create(data: CreateCertificateData): Promise<Certificate> {
    const record = await this.prisma.certificate.create({
      data: {
        certificateId: data.certificateId,
        studentName: data.studentName,
        studentEmail: data.studentEmail,
        courseName: data.courseName,
        issueDate: data.issueDate,
        documentHash: data.documentHash,
        transactionHash: data.transactionHash,
      },
    });
    return this.toDomain(record);
  }

  async updateRevocation(data: UpdateRevocationData): Promise<Certificate> {
    const record = await this.prisma.certificate.update({
      where: { certificateId: data.certificateId },
      data: {
        status: PrismaCertificateStatus.REVOKED,
        revokedAt: new Date(),
        revokedReason: data.revokedReason,
        revokeTransactionHash: data.revokeTransactionHash,
      },
    });
    return this.toDomain(record);
  }

  async findAll(params: FindAllCertificatesParams): Promise<CertificateListResponse> {
    const { page, limit, status } = params;
    const skip = (page - 1) * limit;

    const where = status ? { status: status as PrismaCertificateStatus } : undefined;

    const [records, total] = await Promise.all([
      this.prisma.certificate.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.certificate.count({ where }),
    ]);

    return {
      items: records.map((record) => ({
        certificateId: record.certificateId,
        studentName: record.studentName,
        studentEmail: record.studentEmail ?? undefined,
        courseName: record.courseName,
        issueDate: record.issueDate.toISOString().split('T')[0],
        status: record.status as CertificateStatus,
        createdAt: record.createdAt.toISOString(),
        revokedAt: record.revokedAt?.toISOString(),
        revokedReason: record.revokedReason ?? undefined,
      })),
      total,
      page,
      limit,
    };
  }

  private toDomain(record: {
    id: string;
    certificateId: string;
    studentName: string;
    studentEmail: string | null;
    courseName: string;
    issueDate: Date;
    documentHash: string;
    transactionHash: string;
    status: PrismaCertificateStatus;
    revokedAt: Date | null;
    revokedReason: string | null;
    revokeTransactionHash: string | null;
    createdAt: Date;
  }): Certificate {
    return new Certificate(
      record.id,
      record.certificateId,
      record.studentName,
      record.studentEmail,
      record.courseName,
      record.issueDate,
      record.documentHash,
      record.transactionHash,
      record.status as CertificateStatus,
      record.revokedAt,
      record.revokedReason,
      record.revokeTransactionHash,
      record.createdAt,
    );
  }
}
