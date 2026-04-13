import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  userId: string;

  @Column('jsonb', { array: false })
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
    price: number;
  }>;

  @Column('decimal', { precision: 10, scale: 2 })
  totalPrice: number;

  @Column('varchar', { default: 'pending' })
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';

  @Column('varchar', { nullable: true })
  paymentMethod: string;

  @Column('boolean', { default: false })
  paymentDone: boolean;

  @Column('jsonb', { nullable: true })
  shippingAddress: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    pincode?: string;
  };

  @Column('varchar', { nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
