import { Repository } from 'typeorm';
import { Order } from './entities/order.entity';
import { CreateOrderDto } from './dto/create-order.dto';
export declare class OrdersService {
    private readonly orderRepo;
    constructor(orderRepo: Repository<Order>);
    create(userId: string, dto: CreateOrderDto): Promise<Order>;
    findAll(userRole: string, userId?: string): Promise<Order[]>;
    findOne(id: string, userRole: string, userId?: string): Promise<Order>;
    updateStatus(id: string, status: string, userRole: string): Promise<Order>;
    cancel(id: string, userId: string): Promise<Order>;
}
