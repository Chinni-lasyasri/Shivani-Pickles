export declare class Order {
    id: string;
    userId: string;
    items: Array<{
        productId: string;
        productName: string;
        quantity: number;
        price: number;
    }>;
    totalPrice: number;
    status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
    paymentMethod: string;
    paymentDone: boolean;
    shippingAddress: {
        line1?: string;
        line2?: string;
        city?: string;
        state?: string;
        pincode?: string;
    };
    notes: string;
    createdAt: Date;
    updatedAt: Date;
}
