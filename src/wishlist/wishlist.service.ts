/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WishlistItem } from './entities/wishlist.entity';

@Injectable()
export class WishlistService {
  constructor(
    @InjectRepository(WishlistItem)
    private readonly wishlistRepo: Repository<WishlistItem>,
  ) {}

  async findAll(userId: string): Promise<any[]> {
    const query = `
      SELECT w.*, p.name, p.price, p.image, p.category
      FROM wishlist w
      JOIN products p ON w."productId" = p.id
      WHERE w."userId" = $1 AND w.active = 1 AND p.active = 1
      ORDER BY w."createdAt" DESC
    `;
    return this.wishlistRepo.query(query, [userId]);
  }

  async addToWishlist(
    userId: string,
    productId: string,
  ): Promise<WishlistItem> {
    // Check if already exists
    const existing = await this.wishlistRepo.query(
      'SELECT * FROM wishlist WHERE "userId" = $1 AND "productId" = $2 AND active = 1',
      [userId, productId],
    );
    if (existing.length > 0)
      throw new ConflictException('Product already in wishlist');

    const query = `
      INSERT INTO wishlist (id, "userId", "productId", active, "createdAt", "updatedAt")
      VALUES (gen_random_uuid(), $1, $2, 1, NOW(), NOW())
      RETURNING *
    `;
    const result = await this.wishlistRepo.query(query, [userId, productId]);
    return result[0];
  }

  async removeFromWishlist(userId: string, productId: string): Promise<void> {
    const result = await this.wishlistRepo.query(
      'UPDATE wishlist SET active = 0, "updatedAt" = NOW() WHERE "userId" = $1 AND "productId" = $2 AND active = 1 RETURNING *',
      [userId, productId],
    );
    if (result.length === 0)
      throw new NotFoundException('Item not found in wishlist');
  }

  async clearWishlist(userId: string): Promise<void> {
    await this.wishlistRepo.query(
      'UPDATE wishlist SET active = 0, "updatedAt" = NOW() WHERE "userId" = $1 AND active = 1',
      [userId],
    );
  }
}
