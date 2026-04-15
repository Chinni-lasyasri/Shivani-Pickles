/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CartItem } from './entities/cart.entity';

@Injectable()
export class CartService {
  constructor(
    @InjectRepository(CartItem)
    private readonly cartRepo: Repository<CartItem>,
  ) {}

  async findAll(userId: string): Promise<any[]> {
    const query = `
      SELECT c.*, p.name, p.price, p.image, p.category
      FROM cart c
      JOIN products p ON c."productId" = p.id
      WHERE c."userId" = $1 AND c.active = 1 AND p.active = 1
      ORDER BY c."createdAt" DESC
    `;
    return this.cartRepo.query(query, [userId]);
  }

  async addToCart(
    userId: string,
    productId: string,
    quantity: number = 1,
  ): Promise<CartItem> {
    // Check if item already exists
    const existing = await this.cartRepo.query(
      'SELECT * FROM cart WHERE "userId" = $1 AND "productId" = $2 AND active = 1',
      [userId, productId],
    );

    if (existing.length > 0) {
      // Update quantity
      const newQuantity = existing[0].quantity + quantity;
      const result = await this.cartRepo.query(
        'UPDATE cart SET quantity = $1, "updatedAt" = NOW() WHERE id = $2 AND active = 1 RETURNING *',
        [newQuantity, existing[0].id],
      );
      return result[0];
    } else {
      // Insert new
      const query = `
        INSERT INTO cart (id, "userId", "productId", quantity, active, "createdAt", "updatedAt")
        VALUES (gen_random_uuid(), $1, $2, $3, 1, NOW(), NOW())
        RETURNING *
      `;
      const result = await this.cartRepo.query(query, [
        userId,
        productId,
        quantity,
      ]);
      return result[0];
    }
  }

  async updateQuantity(
    userId: string,
    productId: string,
    quantity: number,
  ): Promise<CartItem> {
    if (quantity <= 0) {
      await this.removeFromCart(userId, productId);
      throw new NotFoundException('Item removed from cart');
    }

    const result = await this.cartRepo.query(
      'UPDATE cart SET quantity = $1, "updatedAt" = NOW() WHERE "userId" = $2 AND "productId" = $3 AND active = 1 RETURNING *',
      [quantity, userId, productId],
    );
    if (result.length === 0)
      throw new NotFoundException('Item not found in cart');
    return result[0];
  }

  async removeFromCart(userId: string, productId: string): Promise<void> {
    const result = await this.cartRepo.query(
      'UPDATE cart SET active = 0, "updatedAt" = NOW() WHERE "userId" = $1 AND "productId" = $2 AND active = 1 RETURNING *',
      [userId, productId],
    );
    if (result.length === 0)
      throw new NotFoundException('Item not found in cart');
  }

  async clearCart(userId: string): Promise<void> {
    await this.cartRepo.query(
      'UPDATE cart SET active = 0, "updatedAt" = NOW() WHERE "userId" = $1 AND active = 1',
      [userId],
    );
  }
}
