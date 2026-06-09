import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { memoryStorage } from 'multer';
import { IssueCertificateUseCase } from '../../application/use-cases/issue-certificate.use-case';
import { ListCertificatesUseCase } from '../../application/use-cases/list-certificates.use-case';
import { RevokeCertificateUseCase } from '../../application/use-cases/revoke-certificate.use-case';
import { VerifyCertificateByPdfUseCase } from '../../application/use-cases/verify-certificate-by-pdf.use-case';
import { VerifyCertificateUseCase } from '../../application/use-cases/verify-certificate.use-case';
import { IssueCertificateDto } from '../dto/issue-certificate.dto';
import { ListCertificatesDto } from '../dto/list-certificates.dto';
import { RevokeCertificateDto } from '../dto/revoke-certificate.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

const MAX_PDF_SIZE = 10 * 1024 * 1024;

@ApiTags('certificates')
@Controller()
export class CertificatesController {
  constructor(
    private readonly issueCertificateUseCase: IssueCertificateUseCase,
    private readonly verifyCertificateUseCase: VerifyCertificateUseCase,
    private readonly verifyCertificateByPdfUseCase: VerifyCertificateByPdfUseCase,
    private readonly revokeCertificateUseCase: RevokeCertificateUseCase,
    private readonly listCertificatesUseCase: ListCertificatesUseCase,
  ) {}

  @Post('certificates')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Issue a new certificate' })
  issue(@Body() dto: IssueCertificateDto) {
    return this.issueCertificateUseCase.execute(dto);
  }

  @Get('certificates')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List certificates (admin)' })
  list(@Query() query: ListCertificatesDto) {
    return this.listCertificatesUseCase.execute(query.page ?? 1, query.limit ?? 20, query.status);
  }

  @Post('certificates/:certificateId/revoke')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Revoke a certificate' })
  revoke(@Param('certificateId') certificateId: string, @Body() dto: RevokeCertificateDto) {
    return this.revokeCertificateUseCase.execute(certificateId, dto);
  }

  @Get('verify/:certificateId')
  @ApiOperation({ summary: 'Public certificate verification by ID' })
  verify(@Param('certificateId') certificateId: string) {
    return this.verifyCertificateUseCase.execute(certificateId);
  }

  @Post('verify/upload')
  @ApiOperation({ summary: 'Public certificate verification by PDF upload' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: MAX_PDF_SIZE },
    }),
  )
  verifyUpload(@UploadedFile() file: Express.Multer.File) {
    return this.verifyCertificateByPdfUseCase.execute(file);
  }
}
