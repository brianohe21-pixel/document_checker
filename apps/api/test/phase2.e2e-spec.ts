import { parseBulkCsv } from '../src/application/helpers/csv-parser.helper';
import { RolesGuard } from '../src/presentation/guards/roles.guard';
import { Reflector } from '@nestjs/core';
import { ExecutionContext } from '@nestjs/common';

describe('Phase 2 helpers', () => {
  describe('parseBulkCsv', () => {
    it('parses valid CSV rows', () => {
      const csv = `studentName,courseName,issueDate,studentEmail
Alice,Math 101,2026-06-01,alice@test.com
Bob,Physics,2026-06-02,`;
      const rows = parseBulkCsv(csv);
      expect(rows).toHaveLength(2);
      expect(rows[0].studentName).toBe('Alice');
      expect(rows[1].studentEmail).toBeUndefined();
    });

    it('rejects CSV with invalid row', () => {
      const csv = `studentName,courseName,issueDate
Alice,,2026-06-01`;
      expect(() => parseBulkCsv(csv)).toThrow();
    });

    it('rejects missing headers', () => {
      expect(() => parseBulkCsv('foo,bar\n1,2')).toThrow();
    });
  });

  describe('RolesGuard', () => {
    const reflector = new Reflector();
    const guard = new RolesGuard(reflector);

    function mockContext(role: string): ExecutionContext {
      return {
        getHandler: () => ({}),
        getClass: () => ({}),
        switchToHttp: () => ({
          getRequest: () => ({
            user: {
              userId: 'u1',
              email: 'a@b.com',
              organizationId: 'org1',
              role,
            },
          }),
        }),
      } as unknown as ExecutionContext;
    }

    beforeEach(() => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['ORG_ADMIN']);
    });

    it('allows SUPER_ADMIN regardless of required roles', () => {
      expect(guard.canActivate(mockContext('SUPER_ADMIN'))).toBe(true);
    });

    it('allows matching role', () => {
      expect(guard.canActivate(mockContext('ORG_ADMIN'))).toBe(true);
    });

    it('denies VIEWER for ORG_ADMIN endpoint', () => {
      expect(guard.canActivate(mockContext('VIEWER'))).toBe(false);
    });

    it('allows ISSUER when required', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['ISSUER', 'ORG_ADMIN']);
      expect(guard.canActivate(mockContext('ISSUER'))).toBe(true);
    });
  });
});
