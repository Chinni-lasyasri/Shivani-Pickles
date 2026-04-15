import { User } from '../../auth/entities/user.entity';
import { Product } from '../../products/entities/product.entity';
export declare class WishlistItem {
    id: string;
    userId: string;
    user: User;
    productId: string;
    product: Product;
    active: number;
    createdAt: Date;
    updatedAt: Date;
}
