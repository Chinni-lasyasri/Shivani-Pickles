import { Repository } from 'typeorm';
import { WishlistItem } from './entities/wishlist.entity';
export declare class WishlistService {
    private readonly wishlistRepo;
    constructor(wishlistRepo: Repository<WishlistItem>);
    findAll(userId: string): Promise<any[]>;
    addToWishlist(userId: string, productId: string): Promise<WishlistItem>;
    removeFromWishlist(userId: string, productId: string): Promise<void>;
    clearWishlist(userId: string): Promise<void>;
}
