import { CartService } from './cart.service';
export declare class CartController {
    private readonly cartService;
    constructor(cartService: CartService);
    findAll(req: any): Promise<any[]>;
    addToCart(body: {
        productId: string;
        quantity?: number;
    }, req: any): Promise<import("./entities/cart.entity").CartItem>;
    updateQuantity(body: {
        productId: string;
        quantity: number;
    }, req: any): Promise<import("./entities/cart.entity").CartItem>;
    removeFromCart(body: {
        productId: string;
    }, req: any): Promise<void>;
    clearCart(req: any): Promise<void>;
}
