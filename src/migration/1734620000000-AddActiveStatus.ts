import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddActiveStatus1734620000000 implements MigrationInterface {
  name = 'AddActiveStatus1734620000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add active column to products table
    await queryRunner.query(`
      ALTER TABLE "products"
      ADD COLUMN "active" SMALLINT NOT NULL DEFAULT 1
    `);

    // Add quantity column to products table
    await queryRunner.query(`
      ALTER TABLE "products"
      ADD COLUMN "quantity" INTEGER NOT NULL DEFAULT 0
    `);

    // Add active column to orders table
    await queryRunner.query(`
      ALTER TABLE "orders"
      ADD COLUMN "active" SMALLINT NOT NULL DEFAULT 1
    `);

    // Add active column to cart table
    await queryRunner.query(`
      ALTER TABLE "cart"
      ADD COLUMN "active" SMALLINT NOT NULL DEFAULT 1
    `);

    // Add active column to wishlist table
    await queryRunner.query(`
      ALTER TABLE "wishlist"
      ADD COLUMN "active" SMALLINT NOT NULL DEFAULT 1
    `);

    // Update users table - replace isActive with active
    await queryRunner.query(`
      ALTER TABLE "users"
      DROP COLUMN "isActive"
    `);

    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN "active" SMALLINT NOT NULL DEFAULT 1
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove active and quantity columns from products table
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "active"`);
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "quantity"`);
    await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN "active"`);
    await queryRunner.query(`ALTER TABLE "cart" DROP COLUMN "active"`);
    await queryRunner.query(`ALTER TABLE "wishlist" DROP COLUMN "active"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "active"`);

    // Restore isActive column to users table
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true
    `);
  }
}
