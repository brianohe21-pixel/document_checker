import { PrismaClient } from '@prisma/client';
import { DEFAULT_TEMPLATE_CONFIG } from '@certchain/shared';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const DEFAULT_ORG_ID = '00000000-0000-0000-0000-000000000001';

async function main() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) {
    throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD must be set for seed');
  }
  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.upsert({
    where: { email },
    update: { passwordHash },
    create: { email, passwordHash },
  });

  const org = await prisma.organization.upsert({
    where: { slug: 'default' },
    update: {},
    create: {
      id: DEFAULT_ORG_ID,
      name: 'Default Organization',
      slug: 'default',
      isActive: true,
    },
  });

  await prisma.membership.upsert({
    where: {
      userId_organizationId: {
        userId: user.id,
        organizationId: org.id,
      },
    },
    update: { role: 'SUPER_ADMIN' },
    create: {
      userId: user.id,
      organizationId: org.id,
      role: 'SUPER_ADMIN',
    },
  });

  const existingTemplate = await prisma.certificateTemplate.findFirst({
    where: { organizationId: org.id, isDefault: true },
  });

  if (!existingTemplate) {
    await prisma.certificateTemplate.create({
      data: {
        organizationId: org.id,
        name: 'Default Template',
        config: DEFAULT_TEMPLATE_CONFIG as object,
        isDefault: true,
        version: 1,
      },
    });
  }

  console.log(`Admin user seeded: ${email} (SUPER_ADMIN in ${org.slug})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
