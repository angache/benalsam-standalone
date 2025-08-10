import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123456', 12);
  
  const admin = await prisma.adminUser.upsert({
    where: { email: 'admin@benalsam.com' },
    update: {},
    create: {
      email: 'admin@benalsam.com',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: 'SUPER_ADMIN',
      isActive: true,
    },
  });

  console.log('✅ Admin user created:', admin.email);

  // Create test users
  const users = await Promise.all([
    prisma.user.upsert({
      where: { email: 'user1@example.com' },
      update: {},
      create: {
        email: 'user1@example.com',
        name: 'Ahmet Yılmaz',
        status: 'ACTIVE',
        trustScore: 85,
      },
    }),
    prisma.user.upsert({
      where: { email: 'user2@example.com' },
      update: {},
      create: {
        email: 'user2@example.com',
        name: 'Ayşe Demir',
        status: 'ACTIVE',
        trustScore: 92,
      },
    }),
    prisma.user.upsert({
      where: { email: 'user3@example.com' },
      update: {},
      create: {
        email: 'user3@example.com',
        name: 'Mehmet Kaya',
        status: 'ACTIVE',
        trustScore: 78,
      },
    }),
  ]);

  console.log('✅ Test users created:', users.length);

  // Create test listings
  const listings = await Promise.all([
    prisma.listing.create({
      data: {
        title: 'iPhone 14 Pro Max - Mükemmel Durumda',
        description: '6 ay önce alınmış, kutulu iPhone 14 Pro Max. Hiç kullanılmamış gibi durumda.',
        price: 45000,
        category: 'Elektronik',
        condition: 'Çok İyi',
        status: 'PENDING',
        userId: users[0].id,
        views: 0,
        favorites: 0,
        images: {
          create: [
            { url: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400', order: 0 },
            { url: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400', order: 1 },
          ],
        },
        location: {
          create: {
            city: 'İstanbul',
            district: 'Kadıköy',
            neighborhood: 'Fenerbahçe',
          },
        },
      },
    }),
    prisma.listing.create({
      data: {
        title: 'MacBook Air M2 - 2023 Model',
        description: 'Apple MacBook Air M2 çip, 8GB RAM, 256GB SSD. Garantisi devam ediyor.',
        price: 35000,
        category: 'Elektronik',
        condition: 'Yeni Gibi',
        status: 'ACTIVE',
        userId: users[1].id,
        views: 45,
        favorites: 12,
        images: {
          create: [
            { url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400', order: 0 },
          ],
        },
        location: {
          create: {
            city: 'İstanbul',
            district: 'Beşiktaş',
            neighborhood: 'Levent',
          },
        },
      },
    }),
    prisma.listing.create({
      data: {
        title: 'Samsung Galaxy S23 Ultra',
        description: 'Samsung Galaxy S23 Ultra, 256GB, Phantom Black. 3 ay kullanıldı.',
        price: 28000,
        category: 'Elektronik',
        condition: 'İyi',
        status: 'ACTIVE',
        userId: users[2].id,
        views: 23,
        favorites: 8,
        images: {
          create: [
            { url: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=400', order: 0 },
          ],
        },
        location: {
          create: {
            city: 'Ankara',
            district: 'Çankaya',
            neighborhood: 'Kızılay',
          },
        },
      },
    }),
    prisma.listing.create({
      data: {
        title: 'PS5 Console + 2 Controller',
        description: 'PlayStation 5 Console, 2 adet DualSense controller ile birlikte.',
        price: 18000,
        category: 'Oyun & Hobi',
        condition: 'Çok İyi',
        status: 'PENDING',
        userId: users[0].id,
        views: 0,
        favorites: 0,
        images: {
          create: [
            { url: 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=400', order: 0 },
          ],
        },
        location: {
          create: {
            city: 'İzmir',
            district: 'Konak',
            neighborhood: 'Alsancak',
          },
        },
      },
    }),
    prisma.listing.create({
      data: {
        title: 'Nike Air Jordan 1 Retro High',
        description: 'Nike Air Jordan 1 Retro High OG, US 42, Beyaz/Kırmızı renk.',
        price: 4500,
        category: 'Giyim & Aksesuar',
        condition: 'Yeni',
        status: 'REJECTED',
        userId: users[1].id,
        views: 67,
        favorites: 15,
        moderationReason: 'Sahte ürün şüphesi',
        images: {
          create: [
            { url: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400', order: 0 },
          ],
        },
        location: {
          create: {
            city: 'İstanbul',
            district: 'Şişli',
            neighborhood: 'Nişantaşı',
          },
        },
      },
    }),
  ]);

  console.log('✅ Test listings created:', listings.length);

  // Create some reports
  const reports = await Promise.all([
    prisma.report.create({
      data: {
        listingId: listings[4].id, // Rejected listing
        reporterId: users[2].id,
        reason: 'Sahte ürün',
        description: 'Bu ürünün sahte olduğunu düşünüyorum.',
        status: 'RESOLVED',
      },
    }),
  ]);

  console.log('✅ Test reports created:', reports.length);

  // Create daily stats
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  await Promise.all([
    prisma.dailyStat.upsert({
      where: { date: today },
      update: {},
      create: {
        date: today,
        totalUsers: 1250,
        newUsers: 15,
        activeUsers: 890,
        totalListings: 3420,
        newListings: 45,
        activeListings: 2890,
        totalRevenue: 125000,
        premiumSubscriptions: 89,
        reportsCount: 12,
        resolvedReports: 8,
      },
    }),
    prisma.dailyStat.upsert({
      where: { date: yesterday },
      update: {},
      create: {
        date: yesterday,
        totalUsers: 1235,
        newUsers: 12,
        activeUsers: 875,
        totalListings: 3375,
        newListings: 38,
        activeListings: 2845,
        totalRevenue: 118000,
        premiumSubscriptions: 87,
        reportsCount: 15,
        resolvedReports: 10,
      },
    }),
  ]);

  console.log('✅ Daily stats created');

  console.log('🎉 Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 