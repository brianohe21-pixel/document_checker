import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthenticatedUser } from '../../domain/auth/auth-context';
import { CreateOrganizationUseCase } from '../../application/use-cases/organizations/create-organization.use-case';
import { GetOrganizationUseCase } from '../../application/use-cases/organizations/get-organization.use-case';
import { InviteMemberUseCase } from '../../application/use-cases/organizations/invite-member.use-case';
import { ListMembersUseCase } from '../../application/use-cases/organizations/list-members.use-case';
import { ListOrganizationsUseCase } from '../../application/use-cases/organizations/list-organizations.use-case';
import { UpdateMemberRoleUseCase } from '../../application/use-cases/organizations/update-member-role.use-case';
import { UpdateOrganizationUseCase } from '../../application/use-cases/organizations/update-organization.use-case';
import { CreateTemplateUseCase } from '../../application/use-cases/templates/create-template.use-case';
import { ListTemplatesUseCase } from '../../application/use-cases/templates/list-templates.use-case';
import { PreviewTemplateUseCase } from '../../application/use-cases/templates/preview-template.use-case';
import { UpdateTemplateUseCase } from '../../application/use-cases/templates/update-template.use-case';
import { CurrentUser } from '../decorators/current-user.decorator';
import { Roles } from '../decorators/roles.decorator';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import {
  CreateOrganizationBodyDto,
  CreateTemplateBodyDto,
  InviteMemberBodyDto,
  PreviewTemplateBodyDto,
  UpdateMemberRoleBodyDto,
  UpdateOrganizationBodyDto,
  UpdateTemplateBodyDto,
} from '../dto/organization.dto';

@ApiTags('organizations')
@Controller('organizations')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class OrganizationsController {
  constructor(
    private readonly listOrganizationsUseCase: ListOrganizationsUseCase,
    private readonly createOrganizationUseCase: CreateOrganizationUseCase,
    private readonly getOrganizationUseCase: GetOrganizationUseCase,
    private readonly updateOrganizationUseCase: UpdateOrganizationUseCase,
    private readonly listMembersUseCase: ListMembersUseCase,
    private readonly inviteMemberUseCase: InviteMemberUseCase,
    private readonly updateMemberRoleUseCase: UpdateMemberRoleUseCase,
    private readonly listTemplatesUseCase: ListTemplatesUseCase,
    private readonly createTemplateUseCase: CreateTemplateUseCase,
    private readonly updateTemplateUseCase: UpdateTemplateUseCase,
    private readonly previewTemplateUseCase: PreviewTemplateUseCase,
  ) {}

  @Get()
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: 'List all organizations' })
  list() {
    return this.listOrganizationsUseCase.execute();
  }

  @Post()
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: 'Create organization' })
  create(@Body() dto: CreateOrganizationBodyDto) {
    return this.createOrganizationUseCase.execute(dto);
  }

  @Get(':id')
  @Roles('SUPER_ADMIN', 'ORG_ADMIN')
  @ApiOperation({ summary: 'Get organization by id' })
  getOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.getOrganizationUseCase.execute(user, id);
  }

  @Patch(':id')
  @Roles('SUPER_ADMIN', 'ORG_ADMIN')
  @ApiOperation({ summary: 'Update organization' })
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateOrganizationBodyDto,
  ) {
    if (user.role !== 'SUPER_ADMIN' && user.organizationId !== id) {
      throw new ForbiddenException('Access denied');
    }
    return this.updateOrganizationUseCase.execute(id, dto);
  }

  @Get(':id/members')
  @Roles('SUPER_ADMIN', 'ORG_ADMIN')
  @ApiOperation({ summary: 'List organization members' })
  listMembers(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    if (user.role !== 'SUPER_ADMIN' && user.organizationId !== id) {
      return [];
    }
    return this.listMembersUseCase.execute(id);
  }

  @Post(':id/members')
  @Roles('SUPER_ADMIN', 'ORG_ADMIN')
  @ApiOperation({ summary: 'Invite member' })
  invite(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: InviteMemberBodyDto,
  ) {
    if (user.role !== 'SUPER_ADMIN' && user.organizationId !== id) {
      return null;
    }
    return this.inviteMemberUseCase.execute(user, id, dto);
  }

  @Patch(':id/members/:membershipId')
  @Roles('SUPER_ADMIN', 'ORG_ADMIN')
  @ApiOperation({ summary: 'Update member role' })
  updateMember(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Param('membershipId') membershipId: string,
    @Body() dto: UpdateMemberRoleBodyDto,
  ) {
    if (user.role !== 'SUPER_ADMIN' && user.organizationId !== id) {
      return null;
    }
    return this.updateMemberRoleUseCase.execute(user, id, membershipId, dto);
  }

  @Get(':id/templates')
  @Roles('ORG_ADMIN', 'ISSUER', 'VIEWER')
  @ApiOperation({ summary: 'List templates' })
  listTemplates(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    const orgId = user.role === 'SUPER_ADMIN' ? id : user.organizationId;
    if (user.role !== 'SUPER_ADMIN' && user.organizationId !== id) {
      return [];
    }
    return this.listTemplatesUseCase.execute(orgId);
  }

  @Post(':id/templates')
  @Roles('ORG_ADMIN')
  @ApiOperation({ summary: 'Create template' })
  createTemplate(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: CreateTemplateBodyDto,
  ) {
    if (user.role !== 'SUPER_ADMIN' && user.organizationId !== id) {
      return null;
    }
    return this.createTemplateUseCase.execute(id, dto);
  }

  @Patch(':id/templates/:templateId')
  @Roles('ORG_ADMIN')
  @ApiOperation({ summary: 'Update template' })
  updateTemplate(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Param('templateId') templateId: string,
    @Body() dto: UpdateTemplateBodyDto,
  ) {
    if (user.role !== 'SUPER_ADMIN' && user.organizationId !== id) {
      return null;
    }
    return this.updateTemplateUseCase.execute(id, templateId, dto);
  }

  @Post(':id/templates/:templateId/preview')
  @Roles('ORG_ADMIN', 'ISSUER')
  @ApiOperation({ summary: 'Preview template PDF' })
  previewTemplate(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Param('templateId') templateId: string,
    @Body() dto: PreviewTemplateBodyDto,
  ) {
    if (user.role !== 'SUPER_ADMIN' && user.organizationId !== id) {
      return null;
    }
    return this.previewTemplateUseCase.execute(id, templateId, dto);
  }
}
