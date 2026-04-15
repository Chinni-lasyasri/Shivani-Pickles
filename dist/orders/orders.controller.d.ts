import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
export declare class OrdersController {
    private readonly ordersService;
    constructor(ordersService: OrdersService);
    create(req: any, createOrderDto: CreateOrderDto): Promise<import("./entities/order.entity").Order>;
    findAll(req: any): Promise<import("./entities/order.entity").Order[]>;
    findOne(id: string, req: any): Promise<import("./entities/order.entity").Order>;
    updateStatus(id: string, updateOrderStatusDto: UpdateOrderStatusDto, req: any): Promise<import("./entities/order.entity").Order>;
    cancel(id: string, req: any): Promise<import("./entities/order.entity").Order>;
}
