import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  category: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  oldPrice: number;

  @Column()
  image: string;

  @Column({ nullable: true })
  badge: string;

  @Column({ type: 'int', default: 5 })
  rating: number;

  @Column({ type: 'int', default: 0 })
  reviews: number;

  @Column({ type: 'json', nullable: true })
  tags: string[];

  @Column({
    type: 'smallint',
    default: 1,
    comment: '0=deleted, 1=active, 2=out of stock',
  })
  active: number;

  @Column({ type: 'int', default: 0 })
  quantity: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
