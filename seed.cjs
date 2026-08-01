const prisma = require('./src/config/prisma');
const bcrypt = require('bcrypt');

async function main() {
  console.log('Seeding database...');
  
  // Create Super Admin role
  const role = await prisma.role.upsert({
    where: { name: 'Super Admin' },
    update: {},
    create: {
      name: 'Super Admin',
      description: 'Has all permissions',
      status: 'active'
    }
  });

  // Hash password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash('admin123', salt);

  // Create admin user
  const user = await prisma.user.upsert({
    where: { email: 'admin@trendcommerce.com' },
    update: {},
    create: {
      email: 'admin@trendcommerce.com',
      password: hashedPassword,
      name: 'Admin User',
      phone: '1234567890',
      gender: 'other',
      roleId: role.id,
      status: 'active'
    }
  });

  console.log('Seed successful!');
  console.log('Admin Email: admin@trendcommerce.com');
  console.log('Admin Password: admin123');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  });
