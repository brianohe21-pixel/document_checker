import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthenticatedUser } from '../../domain/auth/auth-context';
import { GetMeUseCase } from '../../application/use-cases/get-me.use-case';
import { LoginUseCase } from '../../application/use-cases/login.use-case';
import { SwitchOrganizationUseCase } from '../../application/use-cases/switch-organization.use-case';
import { CurrentUser } from '../decorators/current-user.decorator';
import { LoginDto } from '../dto/login.dto';
import { SwitchOrganizationDto } from '../dto/switch-organization.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly loginUseCase: LoginUseCase,
    private readonly getMeUseCase: GetMeUseCase,
    private readonly switchOrganizationUseCase: SwitchOrganizationUseCase,
  ) {}

  @Post('login')
  @ApiOperation({ summary: 'Admin login' })
  login(@Body() dto: LoginDto) {
    return this.loginUseCase.execute(dto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Current user profile' })
  me(@CurrentUser() user: AuthenticatedUser) {
    return this.getMeUseCase.execute(user);
  }

  @Post('switch-organization')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Switch organization context' })
  switchOrganization(@CurrentUser() user: AuthenticatedUser, @Body() dto: SwitchOrganizationDto) {
    return this.switchOrganizationUseCase.execute(user, dto.organizationId);
  }
}
