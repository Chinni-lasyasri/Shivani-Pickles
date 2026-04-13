import { Repository } from 'typeorm';
import { CartItem } from './entities/cart.entity';
export declare class CartService {
    private readonly cartRepo;
    constructor(cartRepo: Repository<CartItem>);
    findAll(userId: string): Promise<any[]>;
    addToCart(userId: string, productId: string, quantity?: number): Promise<CartItem>;
    updateQuantity(userId: string, productId: string, quantity: number): Promise<CartItem>;
    removeFromCart(userId: string, productId: string): Promise<void>;
    clearCart(userId: string): Promise<void>;
}
