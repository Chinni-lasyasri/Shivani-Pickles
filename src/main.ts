import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcryptjs';

async function seedDatabase() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);

  // Seed users
  const adminPassword = await bcrypt.hash('Admin@1234', 12);
  const userPassword = await bcrypt.hash('User@1234', 12);

  await dataSource.query(
    `
    INSERT INTO users (id, mobile, password, "firstName", "lastName", email, role, "mobileVerified", active, "createdAt", "updatedAt")
    VALUES 
      (gen_random_uuid(), '9390862744', $1, 'Admin', 'User', 'admin@pickles.local', 'admin', true, 1, NOW(), NOW()),
      (gen_random_uuid(), '6300142545', $2, 'Regular', 'Customer', 'user@pickles.local', 'user', true, 1, NOW(), NOW())
    ON CONFLICT (mobile) DO NOTHING
  `,
    [adminPassword, userPassword],
  );

  // Seed products
  await dataSource.query(`
    INSERT INTO products (id, name, category, description, price, "oldPrice", image, badge, rating, reviews, tags, "createdAt", "updatedAt")
    VALUES 
      (gen_random_uuid(), 'Classic Dill Cucumber Pickle', 'Cucumber', 'Crisp garden cucumbers brined low-and-slow with fresh dill, garlic cloves and whole black peppercorns.', 249, 299, '/product1.png', 'bestseller', 5, 412, '["cucumber", "mild"]'::jsonb, NOW(), NOW()),
      (gen_random_uuid(), 'Spicy Mango Achaar', 'Mango', 'Raw Alphonso mangoes slow-cured in mustard oil with fenugreek, turmeric and a fiery red-chili masala.', 299, 349, '/product2.png', 'hot', 5, 287, '["mango", "spicy"]'::jsonb, NOW(), NOW()),
      (gen_random_uuid(), 'Garlic Chili Fire Pickle', 'Chili', 'Whole red Jwala chilies packed with plump garlic in a rich aromatic oil — not for the faint-hearted.', 279, NULL, '/product3.png', 'new', 4, 98, '["chili", "spicy"]'::jsonb, NOW(), NOW()),
      (gen_random_uuid(), 'Lemon Ginger Zest Pickle', 'Lemon', 'Sun-dried lemon slices mingled with julienned ginger in a tangy brine — brightens any meal.', 219, 259, '/product1.png', NULL, 4, 175, '["lemon", "mild"]'::jsonb, NOW(), NOW()),
      (gen_random_uuid(), 'Mixed Vegetable Achaar', 'Mixed', 'A medley of carrot, cauliflower, turnip and green chili in a punchy mustard-seed oil masala.', 259, 319, '/product2.png', 'bestseller', 5, 321, '["mixed", "mild"]'::jsonb, NOW(), NOW()),
      (gen_random_uuid(), 'Raw Amla Gooseberry Pickle', 'Amla', 'Indian gooseberries in a vitamin-C rich spiced brine. Tart, tangy and incredibly good for you.', 239, NULL, '/product3.png', 'new', 4, 64, '["amla", "mild"]'::jsonb, NOW(), NOW())
    ON CONFLICT DO NOTHING
  `);

  await app.close();
  console.log('🌱 Database seeded successfully');
}

async function bootstrap() {
  // Seed database first
  await seedDatabase();

  const app = await NestFactory.create(AppModule);

  // Enable CORS for React frontend
  app.enableCors({
    origin: [
      'http://localhost:3001',
      'http://localhost:3000',
      'shivani-pickles-hu0x2iwo3-chinni-lasyasris-projects.vercel.app',
      'shivani-pickles-ui.vercel.app',
    ],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`🚀 Backend running at http://localhost:${port}`);
}
bootstrap();
