import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MembershipRole } from '@certchain/shared';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  MinLength,
  ValidateNested,
} from 'class-validator';

class TemplateConfigDto {
  @ApiProperty()
  @IsString()
  title!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  subtitle?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  bodyLines?: string[];

  @ApiProperty()
  @IsString()
  primaryColor!: string;

  @ApiProperty()
  @IsBoolean()
  showQr!: boolean;

  @ApiProperty()
  @IsBoolean()
  showCertificateId!: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  logoUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  signatureImageUrl?: string;
}

export class CreateOrganizationBodyDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  name!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  slug!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  logoUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  primaryColor?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  verifyBaseUrl?: string;
}

export class UpdateOrganizationBodyDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  logoUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  primaryColor?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  verifyBaseUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class InviteMemberBodyDto {
  @ApiProperty()
  @IsEmail()
  email!: string;

  @ApiProperty()
  @IsString()
  @MinLength(6)
  password!: string;

  @ApiProperty({ enum: ['ORG_ADMIN', 'ISSUER', 'VIEWER'] })
  @IsEnum(['ORG_ADMIN', 'ISSUER', 'VIEWER'])
  role!: MembershipRole;
}

export class UpdateMemberRoleBodyDto {
  @ApiProperty({ enum: ['ORG_ADMIN', 'ISSUER', 'VIEWER'] })
  @IsEnum(['ORG_ADMIN', 'ISSUER', 'VIEWER'])
  role!: MembershipRole;
}

export class CreateTemplateBodyDto {
  @ApiProperty()
  @IsString()
  name!: string;

  @ApiProperty()
  @ValidateNested()
  @Type(() => TemplateConfigDto)
  @IsObject()
  config!: TemplateConfigDto;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

export class UpdateTemplateBodyDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @ValidateNested()
  @Type(() => TemplateConfigDto)
  config?: TemplateConfigDto;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

export class PreviewTemplateBodyDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  studentName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  courseName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  issueDate?: string;
}
