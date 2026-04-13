/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
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
      'SELECT * FROM products ORDER BY "createdAt" DESC',
    );
    return products as Product[];
  }

  async findOne(id: string): Promise<Product> {
    const products: any[] = await this.productRepo.query(
      'SELECT * FROM products WHERE id = $1',
      [id],
    );
    if (products.length === 0) throw new NotFoundException('Product not found');
    return products[0] as Product;
  }

  async create(
    productData: Partial<Product>,
    userRole: string,
  ): Promise<Product> {
    if (userRole !== 'admin')
      throw new ForbiddenException('Only admins can add products');

    const query = `
      INSERT INTO products (id, name, category, description, price, "oldPrice", image, badge, rating, reviews, tags, "createdAt", "updatedAt")
      VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
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
    ];
    const result: any[] = await this.productRepo.query(query, values);
    return result[0] as Product;
  }

  async update(
    id: string,
    productData: Partial<Product>,
    userRole: string,
  ): Promise<Product> {
    if (userRole !== 'admin')
      throw new ForbiddenException('Only admins can update products');

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

    if (setParts.length === 0)
      throw new NotFoundException('No fields to update');

    const query = `
      UPDATE products
      SET ${setParts.join(', ')}, "updatedAt" = NOW()
      WHERE id = $${paramIndex}
      RETURNING *
    `;
    values.push(id);

    const result: any[] = await this.productRepo.query(query, values);
    if (result.length === 0) throw new NotFoundException('Product not found');
    return result[0] as Product;
  }

  async remove(id: string, userRole: string): Promise<void> {
    if (userRole !== 'admin')
      throw new ForbiddenException('Only admins can delete products');

    const result = await this.productRepo.query(
      'DELETE FROM products WHERE id = $1 RETURNING *',
      [id],
    );
    if (result.length === 0) throw new NotFoundException('Product not found');
  }
}
