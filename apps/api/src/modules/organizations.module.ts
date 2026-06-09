import { Module } from '@nestjs/common';
import { CreateOrganizationUseCase } from '../application/use-cases/organizations/create-organization.use-case';
import { GetOrganizationUseCase } from '../application/use-cases/organizations/get-organization.use-case';
import { InviteMemberUseCase } from '../application/use-cases/organizations/invite-member.use-case';
import { ListMembersUseCase } from '../application/use-cases/organizations/list-members.use-case';
import { ListOrganizationsUseCase } from '../application/use-cases/organizations/list-organizations.use-case';
import { UpdateMemberRoleUseCase } from '../application/use-cases/organizations/update-member-role.use-case';
import { UpdateOrganizationUseCase } from '../application/use-cases/organizations/update-organization.use-case';
import { CreateTemplateUseCase } from '../application/use-cases/templates/create-template.use-case';
import { ListTemplatesUseCase } from '../application/use-cases/templates/list-templates.use-case';
import { PreviewTemplateUseCase } from '../application/use-cases/templates/preview-template.use-case';
import { UpdateTemplateUseCase } from '../application/use-cases/templates/update-template.use-case';
import { AUDIT_LOG_REPOSITORY } from '../domain/ports/audit-log.repository.port';
import { MEMBERSHIP_REPOSITORY } from '../domain/ports/membership.repository.port';
import { ORGANIZATION_REPOSITORY } from '../domain/ports/organization.repository.port';
import { TEMPLATE_REPOSITORY } from '../domain/ports/template.repository.port';
import { USER_REPOSITORY } from '../domain/ports/user.repository.port';
import { PrismaAuditLogRepository } from '../infrastructure/prisma/prisma-audit-log.repository';
import { PrismaMembershipRepository } from '../infrastructure/prisma/prisma-membership.repository';
import { PrismaOrganizationRepository } from '../infrastructure/prisma/prisma-organization.repository';
import { PrismaTemplateRepository } from '../infrastructure/prisma/prisma-template.repository';
import { PrismaUserRepository } from '../infrastructure/prisma/prisma-user.repository';
import { OrganizationsController } from '../presentation/controllers/organizations.controller';
import { RolesGuard } from '../presentation/guards/roles.guard';
import { PDF_GENERATOR_PORT } from '../domain/ports/pdf-generator.port';
import { PdfLibGeneratorService } from '../infrastructure/pdf/pdf-lib-generator.service';
import { PrismaModule } from './prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [OrganizationsController],
  providers: [
    ListOrganizationsUseCase,
    CreateOrganizationUseCase,
    GetOrganizationUseCase,
    UpdateOrganizationUseCase,
    ListMembersUseCase,
    InviteMemberUseCase,
    UpdateMemberRoleUseCase,
    ListTemplatesUseCase,
    CreateTemplateUseCase,
    UpdateTemplateUseCase,
    PreviewTemplateUseCase,
    RolesGuard,
    { provide: ORGANIZATION_REPOSITORY, useClass: PrismaOrganizationRepository },
    { provide: MEMBERSHIP_REPOSITORY, useClass: PrismaMembershipRepository },
    { provide: USER_REPOSITORY, useClass: PrismaUserRepository },
    { provide: TEMPLATE_REPOSITORY, useClass: PrismaTemplateRepository },
    { provide: AUDIT_LOG_REPOSITORY, useClass: PrismaAuditLogRepository },
    { provide: PDF_GENERATOR_PORT, useClass: PdfLibGeneratorService },
  ],
  exports: [
    MEMBERSHIP_REPOSITORY,
    ORGANIZATION_REPOSITORY,
    TEMPLATE_REPOSITORY,
    AUDIT_LOG_REPOSITORY,
  ],
})
export class OrganizationsModule {}
