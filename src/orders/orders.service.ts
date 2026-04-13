/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from './entities/order.entity';
import { CreateOrderDto } from './dto/create-order.dto';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
  ) {}

  async create(userId: string, dto: CreateOrderDto): Promise<Order> {
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('Order must contain at least one item');
    }

    const totalPrice = dto.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );

    const query = `
      INSERT INTO orders (id, "userId", items, "totalPrice", status, "paymentMethod", "paymentDone", 
                         "shippingAddress", notes, "createdAt", "updatedAt")
      VALUES (gen_random_uuid(), $1, $2, $3, 'pending', $4, $5, $6, $7, NOW(), NOW())
      RETURNING *
    `;

    const result: any[] = await this.orderRepo.query(query, [
      userId,
      JSON.stringify(dto.items),
      totalPrice,
      dto.paymentMethod || null,
      dto.paymentDone || false,
      JSON.stringify(dto.shippingAddress || {}),
      dto.notes || null,
    ]);

    return result[0] as Order;
  }

  async findAll(userRole: string, userId?: string): Promise<Order[]> {
    if (userRole !== 'admin' && !userId) {
      throw new ForbiddenException('Only admins can view all orders');
    }

    let query = 'SELECT * FROM orders';
    const params: any[] = [];

    if (userRole !== 'admin' && userId) {
      query += ' WHERE "userId" = $1';
      params.push(userId);
    }

    query += ' ORDER BY "createdAt" DESC';

    const orders: any[] = await this.orderRepo.query(query, params);
    return orders as Order[];
  }

  async findOne(id: string, userRole: string, userId?: string): Promise<Order> {
    const query = 'SELECT * FROM orders WHERE id = $1';
    const orders: any[] = await this.orderRepo.query(query, [id]);

    if (orders.length === 0) {
      throw new NotFoundException('Order not found');
    }

    const order = orders[0];

    // Regular users can only see their own orders
    if (userRole !== 'admin' && order.userId !== userId) {
      throw new ForbiddenException('You can only view your own orders');
    }

    return order as Order;
  }

  async updateStatus(
    id: string,
    status: string,
    userRole: string,
  ): Promise<Order> {
    if (userRole !== 'admin') {
      throw new ForbiddenException('Only admins can update order status');
    }

    const validStatuses = [
      'pending',
      'confirmed',
      'shipped',
      'delivered',
      'cancelled',
    ];
    if (!validStatuses.includes(status)) {
      throw new BadRequestException(
        `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
      );
    }

    const query = `
      UPDATE orders
      SET status = $1, "updatedAt" = NOW()
      WHERE id = $2
      RETURNING *
    `;

    const result: any[] = await this.orderRepo.query(query, [status, id]);

    if (result.length === 0) {
      throw new NotFoundException('Order not found');
    }

    return result[0] as Order;
  }

  async cancel(id: string, userId: string): Promise<Order> {
    const query = `
      UPDATE orders
      SET status = 'cancelled', "updatedAt" = NOW()
      WHERE id = $1 AND "userId" = $2 AND status = 'pending'
      RETURNING *
    `;

    const result: any[] = await this.orderRepo.query(query, [id, userId]);

    if (result.length === 0) {
      throw new BadRequestException(
        'Order cannot be cancelled. It may already be shipped or not exist.',
      );
    }

    return result[0] as Order;
  }
}
