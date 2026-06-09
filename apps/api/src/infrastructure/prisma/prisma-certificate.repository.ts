import { Injectable } from '@nestjs/common';
import { CertificateStatus as PrismaCertificateStatus, Prisma } from '@prisma/client';
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
      include: {
        organization: true,
        issuedBy: true,
      },
    });
    return record ? this.toDomain(record) : null;
  }

  async findByCertificateIdAndOrganization(
    certificateId: string,
    organizationId: string,
  ): Promise<Certificate | null> {
    const record = await this.prisma.certificate.findFirst({
      where: { certificateId, organizationId },
      include: {
        organization: true,
        issuedBy: true,
      },
    });
    return record ? this.toDomain(record) : null;
  }

  async findByDocumentHash(documentHash: string): Promise<Certificate | null> {
    const record = await this.prisma.certificate.findFirst({
      where: { documentHash },
      include: { organization: true, issuedBy: true },
    });
    return record ? this.toDomain(record) : null;
  }

  async create(data: CreateCertificateData): Promise<Certificate> {
    const record = await this.prisma.certificate.create({
      data: {
        certificateId: data.certificateId,
        organizationId: data.organizationId,
        templateId: data.templateId,
        issuedByUserId: data.issuedByUserId,
        studentName: data.studentName,
        studentEmail: data.studentEmail,
        courseName: data.courseName,
        issueDate: data.issueDate,
        documentHash: data.documentHash,
        transactionHash: data.transactionHash,
      },
      include: { organization: true, issuedBy: true },
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
      include: { organization: true, issuedBy: true },
    });
    return this.toDomain(record);
  }

  async findAll(params: FindAllCertificatesParams): Promise<CertificateListResponse> {
    const { page, limit, status, organizationId, search, courseName, dateFrom, dateTo } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.CertificateWhereInput = { organizationId };

    if (status) {
      where.status = status as PrismaCertificateStatus;
    }

    if (courseName) {
      where.courseName = { contains: courseName, mode: 'insensitive' };
    }

    if (search) {
      where.OR = [
        { studentName: { contains: search, mode: 'insensitive' } },
        { studentEmail: { contains: search, mode: 'insensitive' } },
        { courseName: { contains: search, mode: 'insensitive' } },
        { certificateId: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (dateFrom || dateTo) {
      where.issueDate = {};
      if (dateFrom) where.issueDate.gte = new Date(dateFrom);
      if (dateTo) where.issueDate.lte = new Date(dateTo);
    }

    const [records, total] = await Promise.all([
      this.prisma.certificate.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: { issuedBy: true },
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
        issuedByEmail: record.issuedBy?.email,
      })),
      total,
      page,
      limit,
    };
  }

  private toDomain(record: {
    id: string;
    certificateId: string;
    organizationId: string;
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
    organization?: { name: string; logoUrl: string | null };
    issuedBy?: { email: string } | null;
  }): Certificate {
    return new Certificate(
      record.id,
      record.certificateId,
      record.organizationId,
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
      record.organization?.name,
      record.organization?.logoUrl,
      record.issuedBy?.email,
    );
  }
}
