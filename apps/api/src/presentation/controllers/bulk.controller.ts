import {
  Controller,
  Get,
  Param,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { memoryStorage } from 'multer';
import { AuthenticatedUser } from '../../domain/auth/auth-context';
import { CreateBulkJobUseCase } from '../../application/use-cases/bulk/create-bulk-job.use-case';
import { GetBulkJobUseCase } from '../../application/use-cases/bulk/get-bulk-job.use-case';
import { parseBulkCsv } from '../../application/helpers/csv-parser.helper';
import { CurrentUser } from '../decorators/current-user.decorator';
import { Roles } from '../decorators/roles.decorator';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';

const MAX_CSV_SIZE = 2 * 1024 * 1024;

@ApiTags('bulk')
@Controller('certificates/bulk')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class BulkController {
  constructor(
    private readonly createBulkJobUseCase: CreateBulkJobUseCase,
    private readonly getBulkJobUseCase: GetBulkJobUseCase,
  ) {}

  @Post()
  @Roles('ORG_ADMIN', 'ISSUER')
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
      limits: { fileSize: MAX_CSV_SIZE },
    }),
  )
  @ApiOperation({ summary: 'Bulk issue certificates from CSV' })
  create(@CurrentUser() user: AuthenticatedUser, @UploadedFile() file: Express.Multer.File) {
    const content = file.buffer.toString('utf-8');
    const rows = parseBulkCsv(content);
    return this.createBulkJobUseCase.execute(user, rows, file.originalname);
  }

  @Get(':jobId')
  @Roles('ORG_ADMIN', 'ISSUER', 'VIEWER')
  @ApiOperation({ summary: 'Get bulk job status' })
  getJob(@CurrentUser() user: AuthenticatedUser, @Param('jobId') jobId: string) {
    return this.getBulkJobUseCase.execute(user, jobId);
  }
}
