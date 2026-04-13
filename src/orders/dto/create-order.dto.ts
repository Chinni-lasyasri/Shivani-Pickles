export class CreateOrderDto {
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
    price: number;
  }>;

  paymentMethod?: string;
  paymentDone?: boolean;

  shippingAddress?: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    pincode?: string;
  };

  notes?: string;
}
