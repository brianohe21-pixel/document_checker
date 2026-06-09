import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class IssueCertificateDto {
  @ApiProperty({ example: 'Juan Perez' })
  @IsString()
  @IsNotEmpty()
  studentName!: string;

  @ApiProperty({ example: 'Blockchain Fundamentals' })
  @IsString()
  @IsNotEmpty()
  courseName!: string;

  @ApiProperty({ example: '2026-06-01' })
  @IsDateString()
  issueDate!: string;

  @ApiPropertyOptional({ example: 'student@example.com' })
  @IsOptional()
  @IsEmail()
  studentEmail?: string;
}
