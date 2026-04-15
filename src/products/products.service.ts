/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
  ) {}

  async findAll(): Promise<Product[]> {
    const products: any[] = await this.productRepo.query(
      'SELECT * FROM products WHERE active = 1 ORDER BY "createdAt" DESC',
    );
    return products as Product[];
  }

  async findOne(id: string): Promise<Product> {
    const products: any[] = await this.productRepo.query(
      'SELECT * FROM products WHERE id = $1 AND active = 1',
      [id],
    );
    if (products.length === 0) throw new NotFoundException('Product not found');
    return products[0] as Product;
  }

  async create(productData: Partial<Product>): Promise<Product> {
    const query = `
      INSERT INTO products (id, name, category, description, price, "oldPrice", image, badge, rating, reviews, tags, active, quantity, "createdAt", "updatedAt")
      VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
      RETURNING *
    `;
    const values = [
      productData.name,
      productData.category,
      productData.description,
      productData.price,
      productData.oldPrice,
      productData.image,
      productData.badge,
      productData.rating || 5,
      productData.reviews || 0,
      productData.tags || [],
      productData.active !== undefined ? productData.active : 1,
      productData.quantity || 0,
    ];
    const result: any[] = await this.productRepo.query(query, values);
    return result[0] as Product;
  }

  async update(id: string, productData: Partial<Product>): Promise<Product> {
    const setParts: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (productData.name) {
      setParts.push(`name = $${paramIndex++}`);
      values.push(productData.name);
    }
    if (productData.category) {
      setParts.push(`category = $${paramIndex++}`);
      values.push(productData.category);
    }
    if (productData.description) {
      setParts.push(`description = $${paramIndex++}`);
      values.push(productData.description);
    }
    if (productData.price !== undefined) {
      setParts.push(`price = $${paramIndex++}`);
      values.push(productData.price);
    }
    if (productData.oldPrice !== undefined) {
      setParts.push(`"oldPrice" = $${paramIndex++}`);
      values.push(productData.oldPrice);
    }
    if (productData.image) {
      setParts.push(`image = $${paramIndex++}`);
      values.push(productData.image);
    }
    if (productData.badge !== undefined) {
      setParts.push(`badge = $${paramIndex++}`);
      values.push(productData.badge);
    }
    if (productData.rating !== undefined) {
      setParts.push(`rating = $${paramIndex++}`);
      values.push(productData.rating);
    }
    if (productData.reviews !== undefined) {
      setParts.push(`reviews = $${paramIndex++}`);
      values.push(productData.reviews);
    }
    if (productData.tags) {
      setParts.push(`tags = $${paramIndex++}`);
      values.push(productData.tags);
    }
    if (productData.active !== undefined) {
      setParts.push(`active = $${paramIndex++}`);
      values.push(productData.active);
    }
    if (productData.quantity !== undefined) {
      setParts.push(`quantity = $${paramIndex++}`);
      values.push(productData.quantity);
    }

    if (setParts.length === 0)
      throw new NotFoundException('No fields to update');

    const query = `
      UPDATE products
      SET ${setParts.join(', ')}, "updatedAt" = NOW()
      WHERE id = $${paramIndex} AND active = 1
      RETURNING *
    `;
    values.push(id);

    const result: any[] = await this.productRepo.query(query, values);
    if (result.length === 0) throw new NotFoundException('Product not found');
    return result[0] as Product;
  }

  async remove(id: string): Promise<void> {
    const result = await this.productRepo.query(
      'UPDATE products SET active = 0, "updatedAt" = NOW() WHERE id = $1 AND active = 1 RETURNING *',
      [id],
    );
    if (result.length === 0) throw new NotFoundException('Product not found');
  }
}
