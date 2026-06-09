import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class RevokeCertificateDto {
  @ApiProperty({ example: 'Issued in error' })
  @IsString()
  @IsNotEmpty()
  reason!: string;
}
