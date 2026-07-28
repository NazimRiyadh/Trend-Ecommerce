import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const permissions = [
  { group: 'dashboard', actions: ['watch'] },
  { group: 'permission', actions: ['watch', 'create', 'read', 'update', 'delete'] },
  { group: 'role', actions: ['watch', 'create', 'read', 'update', 'delete'] },
  { group: 'user', actions: ['watch', 'create', 'read', 'update', 'delete'] },
  { group: 'media', actions: ['watch', 'read', 'upload', 'write', 'delete'] },
  { group: 'category', actions: ['watch', 'create', 'read', 'update', 'delete'] },
  { group: 'brand', actions: ['watch', 'create', 'read', 'update', 'delete'] },
  { group: 'attribute', actions: ['watch', 'create', 'read', 'update', 'delete'] },
  { group: 'product', actions: ['watch', 'create', 'read', 'update', 'delete'] },
];

async function main() {
  console.log('Start seeding...');

  // 1. Create Permissions
  let allPermissionIds = [];
  let limitedPermissionIds = [];

  for (const { group, actions } of permissions) {
    const groupRecord = await prisma.permissionGroup.upsert({
      where: { name: group },
      update: {},
      create: { name: group, description: `Permissions for ${group}` },
    });

    for (const action of actions) {
      const permName = `${group}:${action}`;
      const permRecord = await prisma.permission.upsert({
        where: { name: permName },
        update: {},
        create: {
          name: permName,
          description: `Can ${action} ${group}`,
          groupId: groupRecord.id,
        },
      });

      allPermissionIds.push(permRecord.id);

      // Give Catalog Manager limited access (dashboard + catalog modules)
      if (['dashboard', 'media', 'category', 'brand', 'attribute', 'product'].includes(group)) {
        limitedPermissionIds.push(permRecord.id);
      }
    }
  }

  // 2. Create Super Administrator role
  const adminRole = await prisma.role.upsert({
    where: { name: 'Super Administrator' },
    update: {},
    create: {
      name: 'Super Administrator',
      description: 'Full system access',
      permissions: {
        create: allPermissionIds.map(id => ({ permissionId: id }))
      }
    },
  });

  // 3. Create Catalog Manager role
  const catalogRole = await prisma.role.upsert({
    where: { name: 'Catalog Manager' },
    update: {},
    create: {
      name: 'Catalog Manager',
      description: 'Access to catalog and media only',
      permissions: {
        create: limitedPermissionIds.map(id => ({ permissionId: id }))
      }
    },
  });

  // 4. Create Super Admin User
  const adminPassword = await bcrypt.hash('Admin@123', 10);
  await prisma.user.upsert({
    where: { email: 'admin@trendcommerce.com' },
    update: {},
    create: {
      name: 'Super Admin',
      email: 'admin@trendcommerce.com',
      password: adminPassword,
      roleId: adminRole.id,
      isActive: true,
    },
  });

  // 5. Create Limited User
  const catalogPassword = await bcrypt.hash('Catalog@123', 10);
  await prisma.user.upsert({
    where: { email: 'catalog@trendcommerce.com' },
    update: {},
    create: {
      name: 'Catalog Manager',
      email: 'catalog@trendcommerce.com',
      password: catalogPassword,
      roleId: catalogRole.id,
      isActive: true,
    },
  });

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
