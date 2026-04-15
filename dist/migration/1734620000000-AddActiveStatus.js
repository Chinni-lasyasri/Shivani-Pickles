"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddActiveStatus1734620000000 = void 0;
class AddActiveStatus1734620000000 {
    name = 'AddActiveStatus1734620000000';
    async up(queryRunner) {
        await queryRunner.query(`
      ALTER TABLE "products"
      ADD COLUMN "active" SMALLINT NOT NULL DEFAULT 1
    `);
        await queryRunner.query(`
      ALTER TABLE "products"
      ADD COLUMN "quantity" INTEGER NOT NULL DEFAULT 0
    `);
        await queryRunner.query(`
      ALTER TABLE "orders"
      ADD COLUMN "active" SMALLINT NOT NULL DEFAULT 1
    `);
        await queryRunner.query(`
      ALTER TABLE "cart"
      ADD COLUMN "active" SMALLINT NOT NULL DEFAULT 1
    `);
        await queryRunner.query(`
      ALTER TABLE "wishlist"
      ADD COLUMN "active" SMALLINT NOT NULL DEFAULT 1
    `);
        await queryRunner.query(`
      ALTER TABLE "users"
      DROP COLUMN "isActive"
    `);
        await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN "active" SMALLINT NOT NULL DEFAULT 1
    `);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "active"`);
        await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "quantity"`);
        await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN "active"`);
        await queryRunner.query(`ALTER TABLE "cart" DROP COLUMN "active"`);
        await queryRunner.query(`ALTER TABLE "wishlist" DROP COLUMN "active"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "active"`);
        await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true
    `);
    }
}
exports.AddActiveStatus1734620000000 = AddActiveStatus1734620000000;
//# sourceMappingURL=1734620000000-AddActiveStatus.js.map