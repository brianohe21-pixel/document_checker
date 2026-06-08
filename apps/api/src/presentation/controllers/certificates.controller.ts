import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { IssueCertificateUseCase } from '../../application/use-cases/issue-certificate.use-case';
import { VerifyCertificateUseCase } from '../../application/use-cases/verify-certificate.use-case';
import { IssueCertificateDto } from '../dto/issue-certificate.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

@ApiTags('certificates')
@Controller()
export class CertificatesController {
  constructor(
    private readonly issueCertificateUseCase: IssueCertificateUseCase,
    private readonly verifyCertificateUseCase: VerifyCertificateUseCase,
  ) {}

  @Post('certificates')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Issue a new certificate' })
  issue(@Body() dto: IssueCertificateDto) {
    return this.issueCertificateUseCase.execute(dto);
  }

  @Get('verify/:certificateId')
  @ApiOperation({ summary: 'Public certificate verification' })
  verify(@Param('certificateId') certificateId: string) {
    return this.verifyCertificateUseCase.execute(certificateId);
  }
}
