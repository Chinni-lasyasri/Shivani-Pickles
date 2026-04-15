"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const app_module_1 = require("./app.module");
const typeorm_1 = require("typeorm");
const bcrypt = __importStar(require("bcryptjs"));
async function seedDatabase() {
    const app = await core_1.NestFactory.createApplicationContext(app_module_1.AppModule);
    const dataSource = app.get(typeorm_1.DataSource);
    const adminPassword = await bcrypt.hash('Admin@1234', 12);
    const userPassword = await bcrypt.hash('User@1234', 12);
    await dataSource.query(`
    INSERT INTO users (id, mobile, password, "firstName", "lastName", email, role, "mobileVerified", active, "createdAt", "updatedAt")
    VALUES 
      (gen_random_uuid(), '9390862744', $1, 'Admin', 'User', 'admin@pickles.local', 'admin', true, 1, NOW(), NOW()),
      (gen_random_uuid(), '6300142545', $2, 'Regular', 'Customer', 'user@pickles.local', 'user', true, 1, NOW(), NOW())
    ON CONFLICT (mobile) DO NOTHING
  `, [adminPassword, userPassword]);
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
    await seedDatabase();
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.enableCors({
        origin: ['http://localhost:3001', 'http://localhost:3000'],
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        credentials: true,
    });
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: false,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
    }));
    const port = process.env.PORT ?? 3000;
    await app.listen(port);
    console.log(`🚀 Backend running at http://localhost:${port}`);
}
bootstrap();
//# sourceMappingURL=main.js.map