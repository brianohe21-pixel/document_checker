import { MembershipRole } from '@certchain/shared';

export interface AuthenticatedUser {
  userId: string;
  email: string;
  organizationId: string;
  role: MembershipRole;
}
