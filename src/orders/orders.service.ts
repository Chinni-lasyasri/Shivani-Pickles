/* eslint-disable prettier/prettier */
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
  ) { }

  async create(userId: string, dto: CreateOrderDto): Promise<Order> {
    console.log('userId', userId);
    console.log('dto', dto);
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('Order must contain at least one item');
    }

    const totalPrice = dto.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );

    const query = `
      INSERT INTO orders (id, "userId", items, "totalPrice", status, "paymentMethod", "paymentDone", 
                         "shippingAddress", notes, active, "createdAt", "updatedAt")
      VALUES (gen_random_uuid(), $1, $2, $3, 'pending', $4, $5, $6, $7, 1, NOW(), NOW())
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

    let query: string;
    const params: any[] = [];

    if (userRole === 'admin') {
      // Admins see ALL orders regardless of active status
      query = 'SELECT * FROM orders ORDER BY "createdAt" DESC';
    } else {
      // Regular users only see their own active orders
      query =
        'SELECT * FROM orders WHERE active = 1 AND "userId" = $1 ORDER BY "createdAt" DESC';
      params.push(userId);
    }

    console.log('query:', query);
    const orders: any[] = await this.orderRepo.query(query, params);
    console.log('Fetched orders:', orders);
    return orders as Order[];
  }

  async findOne(id: string, userRole: string, userId?: string): Promise<Order> {
    const query = 'SELECT * FROM orders WHERE id = $1 AND active = 1';
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
    userId?: string,
  ): Promise<Order> {
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

    // First, get the order to check ownership and current status
    const orderQuery = 'SELECT * FROM orders WHERE id = $1 AND active = 1';
    const orders: any[] = await this.orderRepo.query(orderQuery, [id]);

    if (orders.length === 0) {
      throw new NotFoundException('Order not found');
    }

    const order = orders[0];

    // Check permissions based on role
    if (userRole === 'admin') {
      // Admins can update any order to any status
    } else if (userRole === 'user') {
      // Users can only cancel their own orders
      if (order.userId !== userId) {
        throw new ForbiddenException('You can only update your own orders');
      }

      if (status !== 'cancelled') {
        throw new ForbiddenException('Users can only cancel orders');
      }

      // Users can only cancel pending orders
      if (order.status !== 'pending') {
        throw new BadRequestException(
          'Order cannot be cancelled. It may already be shipped or delivered.',
        );
      }
    } else {
      throw new ForbiddenException(
        'Insufficient permissions to update order status',
      );
    }

    const updateQuery = `
      UPDATE orders
      SET status = $1, "updatedAt" = NOW()
      WHERE id = $2
      RETURNING *
    `;

    const result: any[] = await this.orderRepo.query(updateQuery, [status, id]);
    return result[0] as Order;
  }

  async cancel(id: string, userId: string): Promise<Order> {
    const query = `
      UPDATE orders
      SET status = 'cancelled', active = 2, "updatedAt" = NOW()
      WHERE id = $1 AND "userId" = $2 AND status = 'pending' AND active = 1
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
