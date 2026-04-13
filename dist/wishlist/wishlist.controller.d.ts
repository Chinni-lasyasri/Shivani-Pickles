import { WishlistService } from './wishlist.service';
export declare class WishlistController {
    private readonly wishlistService;
    constructor(wishlistService: WishlistService);
    findAll(req: any): Promise<any[]>;
    addToWishlist(body: {
        productId: string;
    }, req: any): Promise<import("./entities/wishlist.entity").WishlistItem>;
    removeFromWishlist(body: {
        productId: string;
    }, req: any): Promise<void>;
    clearWishlist(req: any): Promise<void>;
}
