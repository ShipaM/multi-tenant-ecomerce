import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client.js';
import * as bcrypt from 'bcryptjs';

import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DATABASE_URL,
  }),
});

async function main() {
  console.log('Seeding the platform admin user');

  const password = '12345678';
  const email = 'shipinomaksim@gmail.com';

  const hashedPassword = await bcrypt.hash(password, 10);

  await prisma.user.upsert({
    where: {
      email,
    },
    update: { passwordHash: hashedPassword },
    create: {
      email,
      passwordHash: hashedPassword,
      userType: 'PLATFORM_ADMIN',
      twoFactorEnabled: false,
      phone: '3850006879',
      fullName: 'Shipino Maksim',
    },
  });

  console.log('\n User Create done.');
}

main();
