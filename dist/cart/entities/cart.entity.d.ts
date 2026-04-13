import { User } from '../../auth/entities/user.entity';
import { Product } from '../../products/entities/product.entity';
export declare class CartItem {
    id: string;
    userId: string;
    user: User;
    productId: string;
    product: Product;
    quantity: number;
    createdAt: Date;
    updatedAt: Date;
}
