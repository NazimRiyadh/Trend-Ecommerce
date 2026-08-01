import prisma from './src/config/prisma.js';
import bcrypt from 'bcrypt';

async function main() {
  console.log('Seeding database...');

  // ==========================================
  // 1. Permission Groups + Permissions
  // ==========================================
  const modulePermissions = {
    dashboard:  ['watch'],
    permission: ['watch', 'create', 'read', 'update', 'delete'],
    role:       ['watch', 'create', 'read', 'update', 'delete'],
    user:       ['watch', 'create', 'read', 'update', 'delete'],
    media:      ['watch', 'read', 'upload', 'write', 'delete'],
    category:   ['watch', 'create', 'read', 'update', 'delete'],
    brand:      ['watch', 'create', 'read', 'update', 'delete'],
    attribute:  ['watch', 'create', 'read', 'update', 'delete'],
    product:    ['watch', 'create', 'read', 'update', 'delete'],
  };

  const permissionMap = {}; // name → permission record

  for (const [moduleName, actions] of Object.entries(modulePermissions)) {
    const groupName = moduleName.charAt(0).toUpperCase() + moduleName.slice(1);

    const group = await prisma.permissionGroup.upsert({
      where: { name: groupName },
      update: {},
      create: { name: groupName, description: `${groupName} module permissions` }
    });

    for (const action of actions) {
      const permName = `${moduleName}:${action}`;
      const perm = await prisma.permission.upsert({
        where: { name: permName },
        update: {},
        create: {
          name: permName,
          description: `Can ${action} ${moduleName}`,
          groupId: group.id
        }
      });
      permissionMap[permName] = perm;
    }
  }

  const allPermissions = Object.values(permissionMap);
  console.log(`✓ Seeded ${allPermissions.length} permissions`);

  // ==========================================
  // 2. Super Admin Role (All permissions)
  // ==========================================
  const superAdminRole = await prisma.role.upsert({
    where: { name: 'Super Admin' },
    update: {},
    create: { name: 'Super Admin', description: 'Has all system permissions', status: 'active' }
  });

  for (const perm of allPermissions) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: superAdminRole.id, permissionId: perm.id } },
      update: {},
      create: { roleId: superAdminRole.id, permissionId: perm.id }
    });
  }
  console.log('✓ Seeded Super Admin role with all permissions');

  // ==========================================
  // 3. Catalog Manager Role (Catalog only — NO user/role/permission access)
  // ==========================================
  const catalogRole = await prisma.role.upsert({
    where: { name: 'Catalog Manager' },
    update: {},
    create: { name: 'Catalog Manager', description: 'Catalog access only. Cannot manage users, roles or permissions.', status: 'active' }
  });

  // Catalog permissions: media, category, brand, attribute, product, dashboard:watch
  const catalogPermissionNames = [
    'dashboard:watch',
    'media:watch', 'media:read', 'media:upload', 'media:write', 'media:delete',
    'category:watch', 'category:create', 'category:read', 'category:update', 'category:delete',
    'brand:watch', 'brand:create', 'brand:read', 'brand:update', 'brand:delete',
    'attribute:watch', 'attribute:create', 'attribute:read', 'attribute:update', 'attribute:delete',
    'product:watch', 'product:create', 'product:read', 'product:update', 'product:delete',
  ];

  for (const permName of catalogPermissionNames) {
    const perm = permissionMap[permName];
    if (perm) {
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: catalogRole.id, permissionId: perm.id } },
        update: {},
        create: { roleId: catalogRole.id, permissionId: perm.id }
      });
    }
  }
  console.log('✓ Seeded Catalog Manager role (catalog access only, no user/role/permission access)');

  // ==========================================
  // 4. Admin User (Super Admin)
  // ==========================================
  const adminSalt = await bcrypt.genSalt(10);
  const adminHash = await bcrypt.hash('admin123', adminSalt);

  await prisma.user.upsert({
    where: { email: 'admin@trendcommerce.com' },
    update: {},
    create: {
      email: 'admin@trendcommerce.com',
      password: adminHash,
      name: 'Admin User',
      phone: '1234567890',
      gender: 'other',
      roleId: superAdminRole.id,
      isActive: true
    }
  });
  console.log('✓ Seeded Super Admin user: admin@trendcommerce.com / admin123');

  // ==========================================
  // 5. Catalog Manager User (Limited — for 403 testing)
  // ==========================================
  const catalogSalt = await bcrypt.genSalt(10);
  const catalogHash = await bcrypt.hash('catalog123', catalogSalt);

  await prisma.user.upsert({
    where: { email: 'catalog@trendcommerce.com' },
    update: {},
    create: {
      email: 'catalog@trendcommerce.com',
      password: catalogHash,
      name: 'Catalog Manager',
      phone: '9876543210',
      gender: 'other',
      roleId: catalogRole.id,
      isActive: true
    }
  });
  console.log('✓ Seeded Catalog Manager user: catalog@trendcommerce.com / catalog123');
  console.log('  → This user CANNOT access /users, /roles, /permissions (will get 403)');

  // ==========================================
  // 6. Sample Data (helpful for testing)
  // ==========================================

  // Category
  await prisma.category.upsert({
    where: { slug: 'electronics' },
    update: {},
    create: { name: 'Electronics', slug: 'electronics', description: 'Gadgets & Electronic items', isActive: true }
  });
  await prisma.category.upsert({
    where: { slug: 'clothing' },
    update: {},
    create: { name: 'Clothing', slug: 'clothing', description: 'Fashion & Apparel', isActive: true }
  });

  // Brand
  await prisma.brand.upsert({
    where: { slug: 'apple' },
    update: {},
    create: { name: 'Apple', slug: 'apple', description: 'Premium Technology Products', status: 'active' }
  });
  await prisma.brand.upsert({
    where: { slug: 'samsung' },
    update: {},
    create: { name: 'Samsung', slug: 'samsung', description: 'Electronics & Mobile Devices', status: 'active' }
  });

  // Attribute
  const colorAttr = await prisma.attribute.upsert({
    where: { name: 'Color' },
    update: {},
    create: {
      name: 'Color',
      slug: 'color',
      type: 'colour_swatch',
      values: {
        create: [
          { value: 'Space Gray', slug: 'space-gray', referenceValue: '#4a4a4a' },
          { value: 'Silver', slug: 'silver', referenceValue: '#c0c0c0' },
          { value: 'Midnight', slug: 'midnight', referenceValue: '#1c1c1c' },
          { value: 'Starlight', slug: 'starlight', referenceValue: '#f0ece3' }
        ]
      }
    }
  });
  await prisma.attribute.upsert({
    where: { name: 'Size' },
    update: {},
    create: {
      name: 'Size',
      slug: 'size',
      type: 'radio',
      values: {
        create: [
          { value: 'Small', slug: 'small' },
          { value: 'Medium', slug: 'medium' },
          { value: 'Large', slug: 'large' },
          { value: 'XL', slug: 'xl' }
        ]
      }
    }
  });

  console.log('✓ Seeded sample categories, brands, and attributes');

  // ==========================================
  // Summary
  // ==========================================
  console.log('\n=========================================');
  console.log('  SEED COMPLETE');
  console.log('=========================================');
  console.log('  Super Admin:     admin@trendcommerce.com    / admin123');
  console.log('  Catalog Manager: catalog@trendcommerce.com / catalog123');
  console.log('  (Catalog Manager has NO user/role/permission access — for 403 testing)');
  console.log('=========================================\n');
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
