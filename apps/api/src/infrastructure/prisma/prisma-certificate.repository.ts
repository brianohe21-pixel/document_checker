import { Injectable } from '@nestjs/common';
import { Certificate } from '../../domain/entities/certificate.entity';
import {
  CertificateRepositoryPort,
  CreateCertificateData,
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
        courseName: data.courseName,
        issueDate: data.issueDate,
        documentHash: data.documentHash,
        transactionHash: data.transactionHash,
      },
    });
    return this.toDomain(record);
  }

  private toDomain(record: {
    id: string;
    certificateId: string;
    studentName: string;
    courseName: string;
    issueDate: Date;
    documentHash: string;
    transactionHash: string;
    createdAt: Date;
  }): Certificate {
    return new Certificate(
      record.id,
      record.certificateId,
      record.studentName,
      record.courseName,
      record.issueDate,
      record.documentHash,
      record.transactionHash,
      record.createdAt,
    );
  }
}
