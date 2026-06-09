import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEmail, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

export class IssueCertificateDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  studentName!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  courseName!: string;

  @ApiProperty({ example: '2025-06-09' })
  @IsDateString()
  issueDate!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  studentEmail?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  templateId?: string;
}
